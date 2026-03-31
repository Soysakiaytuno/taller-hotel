const mediator = window.roomSelectionMediatorInstance;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const [resHabitaciones, resTipos] = await Promise.all([
            fetch('http://localhost:5189/api/habitaciones'),
            fetch('http://localhost:5189/api/tipos-habitacion')
        ]);
        
        if (resHabitaciones.ok && resTipos.ok) {
            mediator.setInventarioHabitaciones(await resHabitaciones.json());
            mediator.setCatalogoTipos(await resTipos.json());
            await mediator.loadInitialData();
            mediator.updateUI();
        } else {
            console.error("Error al cargar datos del servidor.");
            alert("Error de backend. Revisa la consola.");
        }
    } catch (error) {
        console.error("Fallo de red al intentar descargar los datos:", error);
        alert("¡No se pudo conectar con el backend! Asegúrate de que el servidor esté corriendo.");
    }
});

// 2. FILTRAR AL CAMBIAR EL TIPO DE HABITACIÓN
mediator.selectTipo.addEventListener('change', (e) => {
    const idTipoSeleccionado = parseInt(e.target.value);
    mediator.filterSpecificRooms(idTipoSeleccionado);
});

mediator.selectEspecifica.addEventListener('change', (e) => {
    mediator.btnAgregar.disabled = e.target.value === "";
});

// 3. AGREGAR HABITACIÓN A LA SELECCIÓN
mediator.btnAgregar.addEventListener('click', () => {
    const idHab = parseInt(mediator.selectEspecifica.value);
    mediator.addRoomToSelection(idHab);
});

window.actualizarUI = () => mediator.updateUI();