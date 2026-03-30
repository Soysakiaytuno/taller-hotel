using Microsoft.Data.SqlClient;

public static class Registrar
{
    public static void MapRegistrarEndpoints(this WebApplication app)
    {
        app.MapPost("/api/clientes/registrar", async (RegistroClienteRequest peticion) =>
        {
            if (string.IsNullOrWhiteSpace(peticion.Nombre) ||
                string.IsNullOrWhiteSpace(peticion.Apellido) ||
                string.IsNullOrWhiteSpace(peticion.Documento))
            {
                return Results.BadRequest(new { error = "El nombre, apellido y documento son obligatorios." });
            }

            string connectionString = "Server=localhost;Database=HotelDB;Trusted_Connection=True;TrustServerCertificate=True;";

            using (SqlConnection connection = new SqlConnection(connectionString))
            {
                await connection.OpenAsync();
                string checkQuery = "SELECT COUNT(1) FROM Usuario WHERE Documentacion = @Documento";
                using (SqlCommand checkCmd = new SqlCommand(checkQuery, connection))
                {
                    checkCmd.Parameters.AddWithValue("@Documento", peticion.Documento);
                    int? existe = (int?)await checkCmd.ExecuteScalarAsync();

                    if (existe > 0)
                    {
                        return Results.Conflict(new { error = "Ya existe un usuario registrado con este documento de identidad." }); 
                    }
                }

                int nuevoUsuarioId;
                string insertUsuarioQuery = @"
                    INSERT INTO Usuario (Nombre, Apellido, Documentacion) 
                    VALUES (@Nombre, @Apellido, @Documento);
                    SELECT SCOPE_IDENTITY();";

                using (SqlCommand insertUsuCmd = new SqlCommand(insertUsuarioQuery, connection))
                {
                    insertUsuCmd.Parameters.AddWithValue("@Nombre", peticion.Nombre);
                    insertUsuCmd.Parameters.AddWithValue("@Apellido", peticion.Apellido);
                    insertUsuCmd.Parameters.AddWithValue("@Documento", peticion.Documento);

                    nuevoUsuarioId = Convert.ToInt32(await insertUsuCmd.ExecuteScalarAsync());
                }
                string insertClienteQuery = "INSERT INTO Cliente (ID_Usuario) VALUES (@IdUsuario)";
                using (SqlCommand insertCliCmd = new SqlCommand(insertClienteQuery, connection))
                {
                    insertCliCmd.Parameters.AddWithValue("@IdUsuario", nuevoUsuarioId);
                    await insertCliCmd.ExecuteNonQueryAsync();
                }
            }
            return Results.Ok(new { mensaje = "Cliente registrado exitosamente.", idGenerado = peticion.Documento });
        });
    }
}
public class RegistroClienteRequest
{
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public string Documento { get; set; } = string.Empty;
}