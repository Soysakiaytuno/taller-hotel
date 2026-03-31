const puerto = 5189;

class RoomSelectionMediator {
    constructor() {
        this.habitacionesSeleccionadas = [];
        this.capacidadMaximaActual = 0;
        this.inventarioHabitaciones = [];
        this.catalogoTipos = [];

        this.selectTipo = document.getElementById('tipoHabitacion');
        this.selectEspecifica = document.getElementById('habitacionEspecifica');
        this.btnAgregar = document.getElementById('btnAgregarHabitacion');
        this.listaHabitacionesReserva = document.getElementById('listaCarrito');
        this.capacidadVisual = document.getElementById('capacidadTotalVisual');

        if (!this.selectTipo || !this.selectEspecifica || !this.btnAgregar || !this.listaHabitacionesReserva || !this.capacidadVisual) {
            console.error("One or more required DOM elements for room selection are missing.");
        }
    }

    get selectedRooms() {
        return this.habitacionesSeleccionadas;
    }

    get currentMaxCapacity() {
        return this.capacidadMaximaActual;
    }

    setInventarioHabitaciones(data) {
        this.inventarioHabitaciones = data;
    }

    setCatalogoTipos(data) {
        this.catalogoTipos = data;
    }

    async loadInitialData() {
        try {
            const [resHabitaciones, resTipos] = await Promise.all([
                fetch(`http://localhost:${puerto}/api/habitaciones`),
                fetch(`http://localhost:${puerto}/api/tipos-habitacion`)
            ]);

            if (resHabitaciones.ok && resTipos.ok) {
                this.setInventarioHabitaciones(await resHabitaciones.json());
                this.setCatalogoTipos(await resTipos.json());

                this.selectTipo.innerHTML = '<option value="">Seleccione un tipo...</option>';
                this.catalogoTipos.forEach(tipo => {
                    this.selectTipo.innerHTML += `<option value="${tipo.id}">${tipo.nombre} (Cap: ${tipo.capacidad}) - $${tipo.precio}</option>`;
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
    }

    filterSpecificRooms(idTipoSeleccionado) {
        this.selectEspecifica.innerHTML = '<option value="">Seleccione una habitación...</option>';

        if (!idTipoSeleccionado) {
            this.selectEspecifica.disabled = true;
            this.btnAgregar.disabled = true;
            return;
        }

        const disponibles = this.inventarioHabitaciones.filter(h =>
            h.idTipo === idTipoSeleccionado && !this.habitacionesSeleccionadas.some(item => item.id === h.id)
        );

        if (disponibles.length === 0) {
            this.selectEspecifica.innerHTML = '<option value="">No hay disponibles de este tipo</option>';
            this.selectEspecifica.disabled = true;
            this.btnAgregar.disabled = true;
        } else {
            disponibles.forEach(h => {
                this.selectEspecifica.innerHTML += `<option value="${h.id}">${h.numero} (Capacidad: ${h.capacidad})</option>`;
            });
            this.selectEspecifica.disabled = false;
        }
    }

    addRoomToSelection(idHab) {
        const habitacion = this.inventarioHabitaciones.find(h => h.id === idHab);

        if (habitacion) {
            this.habitacionesSeleccionadas.push(habitacion);
            this.updateUI();
            
            this.selectTipo.value = "";
            this.selectEspecifica.innerHTML = '<option value="">Primero seleccione el tipo...</option>';
            this.selectEspecifica.disabled = true;
            this.btnAgregar.disabled = true;
        }
    }

    removeRoomFromSelection(idHabitacion) {
        this.habitacionesSeleccionadas = this.habitacionesSeleccionadas.filter(h => h.id !== idHabitacion);
        this.updateUI();
        this.selectTipo.dispatchEvent(new Event('change'));
    }

    updateUI() {
        this.listaHabitacionesReserva.innerHTML = '';
        this.capacidadMaximaActual = 0;

        if (this.habitacionesSeleccionadas.length === 0) {
            this.listaHabitacionesReserva.innerHTML = '<li class="list-group-item text-muted text-center">Aún no has agregado habitaciones.</li>';
        } else {
            this.habitacionesSeleccionadas.forEach(h => {
                this.capacidadMaximaActual += h.capacidad;
                this.listaHabitacionesReserva.innerHTML += `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${h.numero}</strong> <span class="badge bg-secondary ms-2">${h.tipo}</span>
                            <br><small class="text-muted">Capacidad: ${h.capacidad} personas</small>
                        </div>
                        <button type="button" class="btn btn-sm btn-outline-danger" onclick="window.roomSelectionMediatorInstance.removeRoomFromSelection(${h.id})">Quitar</button>
                    </li>
                `;
            });
        }
        this.capacidadVisual.textContent = `${this.capacidadMaximaActual} personas`;

        window.habitacionesSeleccionadas = this.habitacionesSeleccionadas;
        window.capacidadMaximaActual = this.capacidadMaximaActual;
    }
}

window.roomSelectionMediatorInstance = new RoomSelectionMediator();