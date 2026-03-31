class GestionDetalle {
    constructor(mediator) {
        this.mediator = mediator;
    }

    async verDetalle(id) {
        const loadingFragment = this.mediator._getTemplateContent('template-modal-loading');
        if (loadingFragment) {
            this.mediator.cuerpoModal.innerHTML = '';
            this.mediator.cuerpoModal.appendChild(loadingFragment);
        }
        this.mediator.modalDetalle.show();

        try {
            const res = await fetch(`http://localhost:${this.mediator.puerto}/api/estadias/${id}`);
            const data = await res.json();
            const r = data.reserva;
            const detailFragment = this.mediator._getTemplateContent('template-modal-detalle');
            if (!detailFragment) {
                throw new Error("Plantilla 'template-modal-detalle' no encontrada.");
            }

            detailFragment.querySelector('[data-placeholder="reservaId"]').textContent = r.id;
            const estadoBadge = detailFragment.querySelector('[data-placeholder="reservaEstado"]');
            estadoBadge.textContent = r.estado;
            estadoBadge.classList.add(`bg-${r.estado === 'Check-in' ? 'success' : 'primary'}`);
            detailFragment.querySelector('[data-placeholder="reservaIngreso"]').textContent = r.ingreso;
            detailFragment.querySelector('[data-placeholder="reservaSalida"]').textContent = r.salida;
            
            const checkInRealContainer = detailFragment.querySelector('[data-container="checkInRealContainer"]');
            if (r.checkInReal !== "") {
                checkInRealContainer.classList.remove('d-none');
                checkInRealContainer.querySelector('[data-placeholder="checkInReal"]').textContent = r.checkInReal;
            } else {
                checkInRealContainer.classList.add('d-none');
            }

            const checkOutRealContainer = detailFragment.querySelector('[data-container="checkOutRealContainer"]');
            if (r.checkOutReal !== "") {
                checkOutRealContainer.classList.remove('d-none');
                checkOutRealContainer.querySelector('[data-placeholder="checkOutReal"]').textContent = r.checkOutReal;
            } else {
                checkOutRealContainer.classList.add('d-none');
            }

            detailFragment.querySelector('[data-placeholder="fechaRegistro"]').textContent = r.fechaRegistro;
            detailFragment.querySelector('[data-placeholder="titular"]').textContent = r.titular;
            detailFragment.querySelector('[data-placeholder="documentacion"]').textContent = r.documentacion;

            detailFragment.querySelector('[data-placeholder="numHabitaciones"]').textContent = data.habitaciones.length;
            const habitacionesContainer = detailFragment.querySelector('[data-container="habitaciones"]');
            const habitacionItemTemplate = document.getElementById('template-habitacion-item');
            if (habitacionItemTemplate) {
                data.habitaciones.forEach(h => {
                    const itemClone = document.importNode(habitacionItemTemplate.content, true);
                    itemClone.querySelector('[data-placeholder="numero"]').textContent = h.numero;
                    itemClone.querySelector('[data-placeholder="tipo"]').textContent = h.tipo;
                    habitacionesContainer.appendChild(itemClone);
                });
            }

            detailFragment.querySelector('[data-placeholder="numHuespedes"]').textContent = data.huespedes.length;
            const huespedesContainer = detailFragment.querySelector('[data-container="huespedes"]');
            const huespedRowTemplate = document.getElementById('template-huesped-row');
            if (huespedRowTemplate) {
                data.huespedes.forEach(h => {
                    const rowClone = document.importNode(huespedRowTemplate.content, true);
                    rowClone.querySelector('[data-placeholder="nombre"]').textContent = h.nombre;
                    rowClone.querySelector('[data-placeholder="apellido"]').textContent = h.apellido;
                    rowClone.querySelector('[data-placeholder="doc"]').textContent = h.doc;
                    huespedesContainer.appendChild(rowClone);
                });
            }
            
            this.mediator.cuerpoModal.innerHTML = '';
            this.mediator.cuerpoModal.appendChild(detailFragment);

            this.mediator.footerModal.innerHTML = '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>';

            if (r.estado === 'Confirmada') {
                this.mediator.footerModal.innerHTML += `<button type="button" class="btn btn-success px-4" onclick="window.gestionMediatorInstance.cambiarEstado(${r.id}, 'Check-in')">Realizar Check-in</button>`;
            } else if (r.estado === 'Check-in') {
                this.mediator.footerModal.innerHTML += `<button type="button" class="btn btn-warning px-4" onclick="window.gestionMediatorInstance.cambiarEstado(${r.id}, 'Check-out')">Realizar Check-out</button>`;
            }

        } catch (err) {
            console.error("Error al cargar los detalles:", err);
            const errorFragment = this.mediator._getTemplateContent('template-modal-error');
            if (errorFragment) {
                errorFragment.querySelector('[data-placeholder="puerto"]').textContent = this.mediator.puerto;
                this.mediator.cuerpoModal.innerHTML = '';
                this.mediator.cuerpoModal.appendChild(errorFragment);
            }
        }
    }

    async cambiarEstado(idEstadia, nuevoEstado) {
        const mensaje = nuevoEstado === "Check-in"
            ? "Por favor, confirme que ha validado físicamente la documentación de todos los huéspedes presentes.\n\n¿Desea proceder con el Check-in?"
            : "¿Está seguro de que desea realizar el Check-out? Esta acción cerrará la cuenta de las habitaciones y la reserva desaparecerá de este panel activo.";

        if (!confirm(mensaje)) return;

        try {
            const response = await fetch(`http://localhost:${this.mediator.puerto}/api/estadias/${idEstadia}/estado`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ NuevoEstado: nuevoEstado })
            });
            const result = await response.json();
            alert(response.ok ? result.mensaje : `Error: ${result.error}`);
            if (response.ok) {
                this.mediator.modalDetalle.hide();
                this.mediator.cargarEstadias();
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión al intentar cambiar el estado.");
        }
    }
}