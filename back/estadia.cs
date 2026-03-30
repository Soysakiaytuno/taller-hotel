using Microsoft.Data.SqlClient;
using System.Data;

public static class EstadiaApi
{
    public static void MapEstadiaEndpoints(this WebApplication app)
    {
        app.MapPost("/api/estadias/registrar", async (RegistroEstadiaRequest req) =>
        {
            // 1. VALIDACIÓN DE FECHAS BÁSICA
            if (req.FechaIngreso >= req.FechaSalida)
                return Results.BadRequest(new { error = "La fecha de salida debe ser mayor a la fecha de ingreso." });
            
            if (req.FechaIngreso.Date < DateTime.Now.Date)
                return Results.BadRequest(new { error = "No puedes hacer reservas en el pasado." });

            if (req.HabitacionesIds == null || !req.HabitacionesIds.Any() || req.Huespedes == null || !req.Huespedes.Any())
                return Results.BadRequest(new { error = "Debes seleccionar al menos una habitación y registrar al menos un huésped." });

            if (string.IsNullOrWhiteSpace(req.DocumentacionCliente))
                return Results.BadRequest(new { error = "La documentación del cliente es obligatoria." });

            string connectionString = "Server=localhost;Database=HotelDB;Trusted_Connection=True;TrustServerCertificate=True;";

            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                await conn.OpenAsync();

                // 2. BUSCAR AL CLIENTE POR SU DOCUMENTACIÓN (EL CAMBIO PRINCIPAL)
                int idClienteEncontrado = 0;
                string clienteQuery = @"
                    SELECT c.ID_Cliente 
                    FROM Cliente c
                    INNER JOIN Usuario u ON c.ID_Usuario = u.ID_Usuario
                    WHERE u.Documentacion = @Doc";
                
                using (SqlCommand cmdCli = new SqlCommand(clienteQuery, conn))
                {
                    cmdCli.Parameters.AddWithValue("@Doc", req.DocumentacionCliente);
                    object? resCli = await cmdCli.ExecuteScalarAsync();
                    
                    if (resCli == null)
                    {
                        return Results.BadRequest(new { error = "No se encontró ningún cliente registrado con esa documentación. Debe registrar al cliente primero." });
                    }
                    idClienteEncontrado = Convert.ToInt32(resCli);
                }

                // Armamos una cadena de IDs para las consultas de validación
                string idsHabitaciones = string.Join(",", req.HabitacionesIds);

                // 3. VALIDACIÓN DE CAPACIDAD
                string capacidadQuery = $@"
                    SELECT SUM(t.CapacidadMaxima) 
                    FROM Habitacion h 
                    INNER JOIN Tipo_Habitacion t ON h.ID_TipoHabitacion = t.ID_TipoHabitacion 
                    WHERE h.ID_Habitacion IN ({idsHabitaciones})";
                
                using (SqlCommand capCmd = new SqlCommand(capacidadQuery, conn))
                {
                    object? result = await capCmd.ExecuteScalarAsync();
                    int capacidadTotal = result != DBNull.Value ? Convert.ToInt32(result) : 0;

                    if (req.Huespedes.Count > capacidadTotal)
                        return Results.BadRequest(new { error = $"Capacidad excedida. Las habitaciones seleccionadas solo soportan {capacidadTotal} personas." });
                }

                // 4. VALIDACIÓN DE DISPONIBILIDAD
                string overlapQuery = $@"
                    SELECT COUNT(1) 
                    FROM Estadia_Habitacion eh
                    INNER JOIN Estadia e ON eh.ID_Estadia = e.ID_Estadia
                    WHERE eh.ID_Habitacion IN ({idsHabitaciones})
                    AND e.Estado_Reserva != 'Cancelada'
                    AND (e.Fecha_Ingreso < @FechaSalida AND e.Fecha_Salida > @FechaIngreso)";
                
                using (SqlCommand overCmd = new SqlCommand(overlapQuery, conn))
                {
                    overCmd.Parameters.AddWithValue("@FechaIngreso", req.FechaIngreso);
                    overCmd.Parameters.AddWithValue("@FechaSalida", req.FechaSalida);
                    if ((int?)await overCmd.ExecuteScalarAsync() > 0)
                        return Results.BadRequest(new { error = "Una o más habitaciones ya están reservadas en esas fechas." });
                }

                // === INICIA LA TRANSACCIÓN ===
                using (SqlTransaction transaction = conn.BeginTransaction())
                {
                    try
                    {
                        // 5. Insertar Estadia usando el idClienteEncontrado
                        string insertEstadia = @"
                            INSERT INTO Estadia (ID_Cliente, Fecha_Ingreso, Fecha_Salida, Estado_Reserva) 
                            VALUES (@IdC, @Ingreso, @Salida, 'Confirmada');
                            SELECT SCOPE_IDENTITY();";
                        
                        int idEstadia;
                        using (SqlCommand cmd = new SqlCommand(insertEstadia, conn, transaction))
                        {
                            cmd.Parameters.AddWithValue("@IdC", idClienteEncontrado);
                            cmd.Parameters.AddWithValue("@Ingreso", req.FechaIngreso);
                            cmd.Parameters.AddWithValue("@Salida", req.FechaSalida);
                            idEstadia = Convert.ToInt32(await cmd.ExecuteScalarAsync());
                        }

                        // 6. Insertar Estadia_Habitacion
                        int idPrimeraEstadiaHabitacion = 0; 
                        foreach (int idHab in req.HabitacionesIds)
                        {
                            string insertEH = "INSERT INTO Estadia_Habitacion (ID_Estadia, ID_Habitacion) VALUES (@IdE, @IdH); SELECT SCOPE_IDENTITY();";
                            using (SqlCommand cmdEH = new SqlCommand(insertEH, conn, transaction))
                            {
                                cmdEH.Parameters.AddWithValue("@IdE", idEstadia);
                                cmdEH.Parameters.AddWithValue("@IdH", idHab);
                                int currentEH = Convert.ToInt32(await cmdEH.ExecuteScalarAsync());
                                if (idPrimeraEstadiaHabitacion == 0) idPrimeraEstadiaHabitacion = currentEH;
                            }
                        }

                        // 7. Procesar Huéspedes
                        foreach (var h in req.Huespedes)
                        {
                            string buscarUsu = "SELECT ID_Usuario FROM Usuario WHERE Documentacion = @Doc";
                            int idUsuario = 0;
                            using (SqlCommand cmdBus = new SqlCommand(buscarUsu, conn, transaction))
                            {
                                cmdBus.Parameters.AddWithValue("@Doc", h.Documentacion);
                                object? res = await cmdBus.ExecuteScalarAsync();
                                if (res != null) idUsuario = Convert.ToInt32(res);
                            }

                            if (idUsuario == 0)
                            {
                                string insertUsu = "INSERT INTO Usuario (Nombre, Apellido, Documentacion) VALUES (@Nom, @Ape, @Doc); SELECT SCOPE_IDENTITY();";
                                using (SqlCommand cmdInsU = new SqlCommand(insertUsu, conn, transaction))
                                {
                                    cmdInsU.Parameters.AddWithValue("@Nom", h.Nombre);
                                    cmdInsU.Parameters.AddWithValue("@Ape", h.Apellido);
                                    cmdInsU.Parameters.AddWithValue("@Doc", h.Documentacion);
                                    idUsuario = Convert.ToInt32(await cmdInsU.ExecuteScalarAsync());
                                }
                            }

                            string insertHuesped = "INSERT INTO Huesped (ID_Usuario) VALUES (@IdU); SELECT SCOPE_IDENTITY();";
                            int idHuesped;
                            using (SqlCommand cmdH = new SqlCommand(insertHuesped, conn, transaction))
                            {
                                cmdH.Parameters.AddWithValue("@IdU", idUsuario);
                                idHuesped = Convert.ToInt32(await cmdH.ExecuteScalarAsync());
                            }

                            string insertHH = "INSERT INTO Huesped_Habitacion (ID_Estadia_Habitacion, ID_Huesped) VALUES (@IdEH, @IdHuesped)";
                            using (SqlCommand cmdHH = new SqlCommand(insertHH, conn, transaction))
                            {
                                cmdHH.Parameters.AddWithValue("@IdEH", idPrimeraEstadiaHabitacion);
                                cmdHH.Parameters.AddWithValue("@IdHuesped", idHuesped);
                                await cmdHH.ExecuteNonQueryAsync();
                            }
                        }

                        transaction.Commit();
                        return Results.Ok(new { mensaje = "Reserva creada exitosamente.", idReserva = idEstadia });
                    }
                    catch (Exception ex)
                    {
                        transaction.Rollback();
                        return Results.Problem("Error al procesar la reserva: " + ex.Message);
                    }
                }
            }
        });
    }
}

// MODELO ACTUALIZADO: Ahora recibe un string para la documentación
public class RegistroEstadiaRequest
{
    public string DocumentacionCliente { get; set; } = string.Empty; 
    public List<int> HabitacionesIds { get; set; } = new();
    public DateTime FechaIngreso { get; set; }
    public DateTime FechaSalida { get; set; }
    public List<HuespedDato> Huespedes { get; set; } = new();
}

public class HuespedDato
{
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public string Documentacion { get; set; } = string.Empty;
}