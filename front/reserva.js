const inputCantidad = document.getElementById('cantidadPersonas');
const contenedorHuespedes = document.getElementById('contenedorHuespedes');

// 1. GENERAR FORMULARIOS DE HUÉSPEDES
inputCantidad.addEventListener('input', () => {
    const cantidad = parseInt(inputCantidad.value) || 0;
    contenedorHuespedes.innerHTML = ''; 

    // Verificamos la capacidad usando la variable global del carrito
    if (cantidad > window.capacidadMaximaActual && window.carrito.length > 0) {
        alert(`¡Atención! Has seleccionado ${cantidad} personas, pero el carrito solo soporta ${window.capacidadMaximaActual}. Agrega más habitaciones.`);
    }

    if (cantidad > 0) {
        contenedorHuespedes.innerHTML = `<h6 class="mt-3 border-bottom pb-2 text-primary">Detalle de Huéspedes</h6>`;
        for (let i = 1; i <= cantidad; i++) {
            contenedorHuespedes.innerHTML += `
                <div class="row mb-2 huesped-row">
                    <div class="col-md-4">
                        <input type="text" class="form-control h-nombre" placeholder="Nombre persona ${i}" required>
                    </div>
                    <div class="col-md-4">
                        <input type="text" class="form-control h-apellido" placeholder="Apellido persona ${i}" required>
                    </div>
                    <div class="col-md-4">
                        <input type="text" class="form-control h-doc" placeholder="Documentación persona ${i}" required>
                    </div>
                </div>
            `;
        }
    }
});

// 2. ENVIAR FORMULARIO AL BACKEND
document.getElementById('formReserva').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Leemos el carrito global
    if (window.carrito.length === 0) {
        alert("Debes agregar al menos una habitación al carrito.");
        return;
    }

    const habitacionesIds = window.carrito.map(h => h.id);
    const huespedes = [];
    
    document.querySelectorAll('.huesped-row').forEach(row => {
        huespedes.push({
            Nombre: row.querySelector('.h-nombre').value,
            Apellido: row.querySelector('.h-apellido').value,
            Documentacion: row.querySelector('.h-doc').value
        });
    });

    const payload = {
        DocumentacionCliente: document.getElementById('documentacionCliente').value,
        HabitacionesIds: habitacionesIds,
        FechaIngreso: document.getElementById('fechaIngreso').value,
        FechaSalida: document.getElementById('fechaSalida').value,
        Huespedes: huespedes
    };

    let alerta = document.getElementById('alertaReserva');
    if(!alerta) {
        alerta = document.createElement('div');
        alerta.id = 'alertaReserva';
        alerta.className = 'alert mt-3 d-none';
        document.getElementById('formReserva').appendChild(alerta);
    }

    try {
        const response = await fetch('http://localhost:5189/api/estadias/registrar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // Intentamos leer la respuesta del servidor (sea éxito o error)
        let result;
        try {
            result = await response.json();
        } catch (e) {
            result = { error: "El servidor devolvió un error grave que no es JSON." };
        }

        alerta.className = 'alert mt-3'; 

        if (response.ok) {
            alerta.classList.add('alert-success');
            alerta.textContent = result.mensaje;
            
            // LIMPIAR LA PANTALLA TRAS EL ÉXITO
            window.carrito = [];
            window.actualizarUI();
            document.getElementById('formReserva').reset();
            contenedorHuespedes.innerHTML = '';
        } else {
            alerta.classList.add('alert-danger');
            // AQUÍ ESTÁ LA MAGIA: result.detail atrapa el error de transaction.Rollback() en C#
            alerta.textContent = result.error || result.detail || "Error interno del servidor (500). Revisa la terminal de C#."; 
        }
    } catch (error) {
        alerta.className = 'alert mt-3 alert-danger';
        alerta.textContent = "Error crítico de conexión con el servidor.";
    }
});