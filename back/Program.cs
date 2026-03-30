using Microsoft.Data.SqlClient;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

string connectionString = "Server=localhost;Database=HotelDB;Trusted_Connection=True;TrustServerCertificate=True;";

try
{
    using (SqlConnection connection = new SqlConnection(connectionString))
    {
        Console.WriteLine("Intentando conectar a la base de datos...");
        connection.Open();
        Console.WriteLine("¡ÉXITO! La conexión a HotelDB está funcionando perfectamente.");
    }
}
catch (Exception ex)
{
    Console.WriteLine("ERROR al conectar con la base de datos:");
    Console.WriteLine(ex.Message);
}

app.MapGet("/", () => "El backend del Hotel está corriendo y listo.");

app.Run();