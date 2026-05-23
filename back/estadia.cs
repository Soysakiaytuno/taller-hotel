using Microsoft.Data.SqlClient;
using System.Data;

public static class EstadiaApi
{
    public static void MapEstadiaEndpoints(this WebApplication app)
    {
        // 1. Obtener lista de estadías para las tarjetas
        app.MapGet("/api/estadias", async (bool? incluirPasadas) =>
        {
            var lista = new List<object>();
            string connectionString = "Server=localhost;Database=HotelDB;Trusted_Connection=True;TrustServerCertificate=True;";

            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                await conn.OpenAsync();
                
                // LÓGICA DEL SWITCH: Cambiamos la condición SQL dependiendo de lo que pida el Frontend
                string condicionEstado = (incluirPasadas == true) 
                    ? "e.Estado_Reserva IN ('Confirmada', 'Check-in', 'Check-out')" 
                    : "e.Estado_Reserva IN ('Confirmada', 'Check-in')";

                // Inyectamos la condición en la consulta
                string query = $@"
                    SELECT 
                        e.ID_Estadia, 
                        u.Nombre, u.Apellido, u.Documentacion,
                        e.Fecha_Ingreso, e.Fecha_Salida, e.Estado_Reserva
                    FROM Estadia e
                    INNER JOIN Cliente c ON e.ID_Cliente = c.ID_Cliente
                    INNER JOIN Usuario u ON c.ID_Usuario = u.ID_Usuario
                    WHERE {condicionEstado}
                    ORDER BY e.Fecha_Ingreso ASC";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        lista.Add(new {
                            id = reader.GetInt32(0),
                            cliente = $"{reader.GetString(1)} {reader.GetString(2)}",
                            doc = reader.GetString(3),
                            ingreso = reader.GetDateTime(4).ToString("yyyy-MM-dd"),
                            salida = reader.GetDateTime(5).ToString("yyyy-MM-dd"),
                            estado = reader.GetString(6)
                        });
                    }
                }
            }
            return Results.Ok(lista);
        });

        app.MapGet("/api/estadias/{id}", async (int id) =>
        {
            string connectionString = "Server=localhost;Database=HotelDB;Trusted_Connection=True;TrustServerCertificate=True;";
            
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                await conn.OpenAsync();

                // A. Datos Generales de la Reserva y del Titular
                object? datosReserva = null;
                string qGeneral = @"
                    SELECT 
                        e.ID_Estadia, e.Estado_Reserva, e.Fecha_Registro, e.Fecha_Ingreso, e.Fecha_Salida,
                        u.Nombre, u.Apellido, u.Documentacion,
                        e.FechaHora_CheckIn, e.FechaHora_CheckOut 
                    FROM Estadia e
                    INNER JOIN Cliente c ON e.ID_Cliente = c.ID_Cliente
                    INNER JOIN Usuario u ON c.ID_Usuario = u.ID_Usuario
                    WHERE e.ID_Estadia = @id";
                
                using (SqlCommand cmd = new SqlCommand(qGeneral, conn))
                {
                    cmd.Parameters.AddWithValue("@id", id);
                    using (var r = await cmd.ExecuteReaderAsync())
                    {
                        if (await r.ReadAsync())
                        {
                            // Validamos si la base de datos devuelve un valor Nulo (DBNull)
                            string checkInReal = r.IsDBNull(8) ? "" : r.GetDateTime(8).ToString("yyyy-MM-dd HH:mm");
                            string checkOutReal = r.IsDBNull(9) ? "" : r.GetDateTime(9).ToString("yyyy-MM-dd HH:mm");

                            datosReserva = new {
                                id = r.GetInt32(0),
                                estado = r.GetString(1),
                                fechaRegistro = r.GetDateTime(2).ToString("yyyy-MM-dd HH:mm"),
                                ingreso = r.GetDateTime(3).ToString("yyyy-MM-dd"),
                                salida = r.GetDateTime(4).ToString("yyyy-MM-dd"),
                                titular = $"{r.GetString(5)} {r.GetString(6)}",
                                documentacion = r.GetString(7),
                                checkInReal = checkInReal,
                                checkOutReal = checkOutReal
                            };
                        }
                    }
                }

                // B. Habitaciones (Ahora traemos también el Tipo de Habitación)
                var habitaciones = new List<object>();
                string qHab = @"
                    SELECT h.Numero_Habitacion, t.Nombre AS TipoHabitacion
                    FROM Estadia_Habitacion eh 
                    INNER JOIN Habitacion h ON eh.ID_Habitacion = h.ID_Habitacion 
                    INNER JOIN Tipo_Habitacion t ON h.ID_TipoHabitacion = t.ID_TipoHabitacion
                    WHERE eh.ID_Estadia = @id";
                
                using (SqlCommand cmd = new SqlCommand(qHab, conn)) {
                    cmd.Parameters.AddWithValue("@id", id);
                    using (var r = await cmd.ExecuteReaderAsync()) while(await r.ReadAsync()) 
                        habitaciones.Add(new { numero = r.GetString(0), tipo = r.GetString(1) });
                }

                // C. Huéspedes
                var huespedes = new List<object>();
                string qHue = @"
                    SELECT u.Nombre, u.Apellido, u.Documentacion 
                    FROM Huesped_Habitacion hh
                    INNER JOIN Estadia_Habitacion eh ON hh.ID_Estadia_Habitacion = eh.ID_Estadia_Habitacion
                    INNER JOIN Huesped h ON hh.ID_Huesped = h.ID_Huesped
                    INNER JOIN Usuario u ON h.ID_Usuario = u.ID_Usuario
                    WHERE eh.ID_Estadia = @id";
                    
                using (SqlCommand cmd = new SqlCommand(qHue, conn)) {
                    cmd.Parameters.AddWithValue("@id", id);
                    using (var r = await cmd.ExecuteReaderAsync()) while(await r.ReadAsync()) 
                        huespedes.Add(new { nombre = r.GetString(0), apellido = r.GetString(1), doc = r.GetString(2) });
                }

                // Devolvemos todo el paquete completo
                return Results.Ok(new { reserva = datosReserva, habitaciones, huespedes });
            }
        });
        
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
        // 3. Cambiar estado de la Estadía Y de las Habitaciones
        app.MapPut("/api/estadias/{id}/estado", async (int id, CambioEstadoRequest req) =>
        {
            if (req.NuevoEstado != "Check-in" && req.NuevoEstado != "Check-out")
            {
                return Results.BadRequest(new { error = "Estado no válido." });
            }

            int nuevoEstadoHabitacion = req.NuevoEstado == "Check-in" ? 2 : 1;

            string connectionString = "Server=localhost;Database=HotelDB;Trusted_Connection=True;TrustServerCertificate=True;";

            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                await conn.OpenAsync();
                
                using (SqlTransaction transaction = conn.BeginTransaction())
                {
                    try
                    {
                        // PASO A: Actualizamos el estado y marcamos la hora exacta
                        string updateEstadia = "";
                        if (req.NuevoEstado == "Check-in") {
                            updateEstadia = "UPDATE Estadia SET Estado_Reserva = @estado, FechaHora_CheckIn = GETDATE() WHERE ID_Estadia = @id";
                        } else if (req.NuevoEstado == "Check-out") {
                            updateEstadia = "UPDATE Estadia SET Estado_Reserva = @estado, FechaHora_CheckOut = GETDATE() WHERE ID_Estadia = @id";
                        }

                        using (SqlCommand cmdEst = new SqlCommand(updateEstadia, conn, transaction))
                        {
                            cmdEst.Parameters.AddWithValue("@estado", req.NuevoEstado);
                            cmdEst.Parameters.AddWithValue("@id", id);
                            
                            int filasAfectadas = await cmdEst.ExecuteNonQueryAsync();
                            if (filasAfectadas == 0)
                            {
                                transaction.Rollback();
                                return Results.NotFound(new { error = "No se encontró la reserva." });
                            }
                        }

                        // PASO B: Actualizamos el estado de las Habitaciones vinculadas a esta Estadia
                        string updateHabitaciones = @"
                            UPDATE Habitacion 
                            SET ID_Estado = @estadoHabitacion 
                            WHERE ID_Habitacion IN (
                                SELECT ID_Habitacion FROM Estadia_Habitacion WHERE ID_Estadia = @id
                            )";
                            
                        using (SqlCommand cmdHab = new SqlCommand(updateHabitaciones, conn, transaction))
                        {
                            cmdHab.Parameters.AddWithValue("@estadoHabitacion", nuevoEstadoHabitacion);
                            cmdHab.Parameters.AddWithValue("@id", id);
                            
                            await cmdHab.ExecuteNonQueryAsync();
                        }

                        // Si llegamos hasta aquí, todo salió bien, guardamos los cambios
                        transaction.Commit();
                        return Results.Ok(new { mensaje = $"Check-in/out exitoso. Las habitaciones han sido actualizadas." });
                    }
                    catch (Exception ex)
                    {
                        transaction.Rollback();
                        return Results.Problem("Error interno al procesar el cambio: " + ex.Message);
                    }
                }
            }
        });
        // 4. Búsqueda global de reservas (Incluye Check-out)
        app.MapGet("/api/estadias/buscar", async (string q) =>
        {
            if (string.IsNullOrWhiteSpace(q)) return Results.BadRequest("Término de búsqueda vacío.");

            var lista = new List<object>();
            string connectionString = "Server=localhost;Database=HotelDB;Trusted_Connection=True;TrustServerCertificate=True;";

            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                await conn.OpenAsync();
                
                // Buscamos coincidencias en Documento, Nombre, Apellido o el Nombre Completo
                string query = @"
                    SELECT 
                        e.ID_Estadia, 
                        u.Nombre, u.Apellido, u.Documentacion,
                        e.Fecha_Ingreso, e.Fecha_Salida, e.Estado_Reserva
                    FROM Estadia e
                    INNER JOIN Cliente c ON e.ID_Cliente = c.ID_Cliente
                    INNER JOIN Usuario u ON c.ID_Usuario = u.ID_Usuario
                    WHERE u.Documentacion LIKE @busqueda 
                       OR u.Nombre LIKE @busqueda 
                       OR u.Apellido LIKE @busqueda
                       OR CONCAT(u.Nombre, ' ', u.Apellido) LIKE @busqueda
                       OR e.Fecha_Salida LIKE @busqueda
                    ORDER BY e.Fecha_Ingreso DESC";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    // Añadimos los % para que busque coincidencias parciales (ej. buscar "Pér" encuentra "Pérez")
                    cmd.Parameters.AddWithValue("@busqueda", "%" + q + "%");

                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            lista.Add(new {
                                id = reader.GetInt32(0),
                                cliente = $"{reader.GetString(1)} {reader.GetString(2)}",
                                doc = reader.GetString(3),
                                ingreso = reader.GetDateTime(4).ToString("yyyy-MM-dd"),
                                salida = reader.GetDateTime(5).ToString("yyyy-MM-dd"),
                                estado = reader.GetString(6)
                            });
                        }
                    }
                }
            }
            return Results.Ok(lista);
        });
    }
}
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

public class CambioEstadoRequest
{
    public string NuevoEstado { get; set; } = string.Empty;
}