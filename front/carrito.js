// Usamos el objeto 'window' para que estas variables puedan ser leídas desde reserva.js
window.carrito = [];
window.capacidadMaximaActual = 0;
let inventarioHabitaciones = [];
let catalogoTipos = []; // Nueva variable para guardar los tipos

const selectTipo = document.getElementById('tipoHabitacion');
const selectEspecifica = document.getElementById('habitacionEspecifica');
const btnAgregar = document.getElementById('btnAgregarHabitacion');
const listaCarrito = document.getElementById('listaCarrito');
const capacidadVisual = document.getElementById('capacidadTotalVisual');

// 1. CARGAR DATOS DESDE EL BACKEND AL ABRIR LA PÁGINA
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Hacemos las dos peticiones al mismo tiempo para mayor velocidad
        const [resHabitaciones, resTipos] = await Promise.all([
            fetch('http://localhost:5189/api/habitaciones'),
            fetch('http://localhost:5189/api/tipos-habitacion')
        ]);
        
        if (resHabitaciones.ok && resTipos.ok) {
            inventarioHabitaciones = await resHabitaciones.json();
            catalogoTipos = await resTipos.json();
            
            // Llenar el select de Tipos de Habitación dinámicamente
            selectTipo.innerHTML = '<option value="">Seleccione un tipo...</option>';
            catalogoTipos.forEach(tipo => {
                // Formateamos para que se vea igual que antes: Nombre (Cap: X) - $Y
                selectTipo.innerHTML += `<option value="${tipo.id}">${tipo.nombre} (Cap: ${tipo.capacidad}) - $${tipo.precio}</option>`;
            });

            console.log("Catálogos cargados correctamente");
        } else {
            console.error("Error al cargar datos del servidor.");
            alert("Error de backend. Revisa la consola.");
        }
    } catch (error) {
        console.error("Fallo de red al intentar descargar los datos:", error);
        alert("¡No se pudo conectar con el backend! Asegúrate de que C# esté corriendo.");
    }
});

// ... (El resto del código de carrito.js se queda exactamente igual) ...

// 2. FILTRAR AL CAMBIAR EL TIPO DE HABITACIÓN
selectTipo.addEventListener('change', (e) => {
    const idTipoSeleccionado = parseInt(e.target.value);
    selectEspecifica.innerHTML = '<option value="">Seleccione una habitación...</option>';
    
    if (!idTipoSeleccionado) {
        selectEspecifica.disabled = true;
        btnAgregar.disabled = true;
        return;
    }

    const disponibles = inventarioHabitaciones.filter(h => 
        h.idTipo === idTipoSeleccionado && !window.carrito.some(item => item.id === h.id)
    );

    if (disponibles.length === 0) {
        selectEspecifica.innerHTML = '<option value="">No hay disponibles de este tipo</option>';
        selectEspecifica.disabled = true;
        btnAgregar.disabled = true;
    } else {
        disponibles.forEach(h => {
            selectEspecifica.innerHTML += `<option value="${h.id}">${h.numero} (Capacidad: ${h.capacidad})</option>`;
        });
        selectEspecifica.disabled = false;
    }
});

selectEspecifica.addEventListener('change', (e) => {
    btnAgregar.disabled = e.target.value === "";
});

// 3. AGREGAR AL CARRITO
btnAgregar.addEventListener('click', () => {
    const idHab = parseInt(selectEspecifica.value);
    const habitacion = inventarioHabitaciones.find(h => h.id === idHab);
    
    if (habitacion) {
        window.carrito.push(habitacion);
        window.actualizarUI();
        
        selectTipo.value = "";
        selectEspecifica.innerHTML = '<option value="">Primero seleccione el tipo...</option>';
        selectEspecifica.disabled = true;
        btnAgregar.disabled = true;
    }
});

// 4. QUITAR DEL CARRITO (Debe ser global para el onclick del HTML)
window.quitarDelCarrito = function(idHabitacion) {
    window.carrito = window.carrito.filter(h => h.id !== idHabitacion);
    window.actualizarUI();
    selectTipo.dispatchEvent(new Event('change')); 
};

// 5. DIBUJAR EL CARRITO EN PANTALLA
window.actualizarUI = function() {
    listaCarrito.innerHTML = '';
    window.capacidadMaximaActual = 0;

    if (window.carrito.length === 0) {
        listaCarrito.innerHTML = '<li class="list-group-item text-muted text-center">Aún no has agregado habitaciones.</li>';
    } else {
        window.carrito.forEach(h => {
            window.capacidadMaximaActual += h.capacidad;
            listaCarrito.innerHTML += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${h.numero}</strong> <span class="badge bg-secondary ms-2">${h.tipo}</span>
                        <br><small class="text-muted">Capacidad: ${h.capacidad} personas</small>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="quitarDelCarrito(${h.id})">Quitar</button>
                </li>
            `;
        });
    }
    capacidadVisual.textContent = `${window.capacidadMaximaActual} personas`;
};