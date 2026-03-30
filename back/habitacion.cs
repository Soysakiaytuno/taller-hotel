using Microsoft.Data.SqlClient;

public static class HabitacionApi
{
    public static void MapHabitacionEndpoints(this WebApplication app)
    {
        // 1. RUTA EXISTENTE: Obtener las habitaciones específicas
        app.MapGet("/api/habitaciones", async () =>
        {
            var habitaciones = new List<object>();
            string connectionString = "Server=localhost;Database=HotelDB;Trusted_Connection=True;TrustServerCertificate=True;";

            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                await conn.OpenAsync();
                string query = @"
                    SELECT 
                        h.ID_Habitacion, 
                        h.Numero_Habitacion, 
                        t.ID_TipoHabitacion, 
                        t.Nombre, 
                        t.CapacidadMaxima 
                    FROM Habitacion h
                    INNER JOIN Tipo_Habitacion t ON h.ID_TipoHabitacion = t.ID_TipoHabitacion
                    WHERE h.ID_Estado = 1"; 

                using (SqlCommand cmd = new SqlCommand(query, conn))
                using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        habitaciones.Add(new {
                            id = reader.GetInt32(0),
                            numero = reader.GetString(1),
                            idTipo = reader.GetInt32(2),
                            tipo = reader.GetString(3),
                            capacidad = reader.GetInt32(4)
                        });
                    }
                }
            }
            return Results.Ok(habitaciones);
        });

        // 2. NUEVA RUTA: Obtener el catálogo de Tipos de Habitación
        app.MapGet("/api/tipos-habitacion", async () =>
        {
            var tipos = new List<object>();
            string connectionString = "Server=localhost;Database=HotelDB;Trusted_Connection=True;TrustServerCertificate=True;";

            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                await conn.OpenAsync();
                // Traemos el ID, Nombre, Capacidad y Precio para mostrarlo bonito
                string query = "SELECT ID_TipoHabitacion, Nombre, CapacidadMaxima, Precio FROM Tipo_Habitacion"; 

                using (SqlCommand cmd = new SqlCommand(query, conn))
                using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        tipos.Add(new {
                            id = reader.GetInt32(0),
                            nombre = reader.GetString(1),
                            capacidad = reader.GetInt32(2),
                            precio = reader.GetDecimal(3)
                        });
                    }
                }
            }
            return Results.Ok(tipos);
        });
    }
}