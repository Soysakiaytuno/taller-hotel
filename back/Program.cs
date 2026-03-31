using Microsoft.Data.SqlClient;

var builder = WebApplication.CreateBuilder(args);

// 1. AGREGA ESTO PARA PERMITIR CORS
builder.Services.AddCors(options => {
    options.AddPolicy("PermitirTodo", policy => {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();

// 2. ACTIVA EL CORS ANTES DE TUS RUTAS
app.UseCors("PermitirTodo");

app.MapGet("/", () => "El backend del Hotel está corriendo y listo.");
app.MapRegistrarEndpoints(); 
app.MapEstadiaEndpoints();
app.MapHabitacionEndpoints();
app.MapDepartamentoEndpoints();

app.Run();