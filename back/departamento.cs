using Microsoft.Data.SqlClient;

public static class DepartamentoApi
{
    public static void MapDepartamentoEndpoints(this WebApplication app)
    {
        app.MapGet("/api/departamentos", async () =>
        {
            var lista = new List<object>();
            string connectionString = "Server=localhost;Database=HotelDB;Trusted_Connection=True;TrustServerCertificate=True;";

            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                await conn.OpenAsync();
                
                string query = @"
                    SELECT 
                        d.Nombre_Rol AS NombreDepartamento, 
                        d.Contacto,
                        u.Nombre, u.Apellido
                    FROM Departamento d
                    -- Buscamos si hay un empleado asignado a este departamento que tenga el Rol 1 (Encargado)
                    LEFT JOIN Empleado e ON d.ID_Departamento = e.ID_Departamento AND e.ID_Rol = 1
                    LEFT JOIN Usuario u ON e.ID_Usuario = u.ID_Usuario";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        lista.Add(new {
                            nombre = reader.GetString(0),
                            contacto = reader.IsDBNull(1) ? "Sin contacto" : reader.GetString(1),
                            encargado = reader.IsDBNull(2) ? "Sin encargado asignado" : $"{reader.GetString(2)} {reader.GetString(3)}"
                        });
                    }
                }
            }
            return Results.Ok(lista);
        });
    }
}