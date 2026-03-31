document.addEventListener('DOMContentLoaded', async () => {
    const contenedor = document.getElementById('contenedorDirectorios');
    
    try {
        const response = await fetch('http://localhost:5189/api/departamentos');
        const departamentos = await response.json();
        
        contenedor.innerHTML = '';
        
        // Validación en caso de que la tabla esté vacía
        if (departamentos.length === 0) {
            contenedor.innerHTML = '<div class="alert alert-info w-100 text-center">No hay departamentos registrados.</div>';
            return;
        }

        // Generación dinámica de las tarjetas
        departamentos.forEach(d => {
            contenedor.innerHTML += `
                <div class="col-md-4 mb-4">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-header bg-dark text-white">
                            <h5 class="mb-0 text-center">${d.nombre}</h5>
                        </div>
                        <div class="card-body bg-white text-center">
                            <p class="text-muted small text-uppercase mb-1">Encargado del Área</p>
                            <h5 class="text-primary mb-3">👤 ${d.encargado}</h5>
                            
                            <p class="text-muted small text-uppercase mb-1">Contacto / Extensión</p>
                            <h6 class="mb-0">📞 ${d.contacto}</h6>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error("Error al cargar el directorio:", error);
        contenedor.innerHTML = '<div class="alert alert-danger text-center w-100">Error de conexión con el servidor.</div>';
    }
});