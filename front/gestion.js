const puerto = 5189;

document.addEventListener('DOMContentLoaded', cargarEstadias);

async function cargarEstadias() {
    const contenedor = document.getElementById('contenedorTarjetas');
    try {
        const res = await fetch(`http://localhost:${puerto}/api/estadias`);
        const estadias = await res.json();

        contenedor.innerHTML = '';

        // NUEVA LÓGICA: Validar si la lista está vacía
        if (estadias.length === 0) {
            contenedor.innerHTML = `
                <div class="col-12 text-center mt-5">
                    <div class="p-5 bg-white shadow-sm rounded">
                        <h4 class="text-muted mb-3">📭 Por ahora no hay reservas a visualizar.</h4>
                        <p class="text-muted mb-0">Cuando registres una nueva estadía, aparecerá aquí automáticamente.</p>
                    </div>
                </div>
            `;
            return; // Detenemos la función aquí para que no intente dibujar tarjetas
        }

        // Si hay datos, dibujamos las tarjetas normalmente
        estadias.forEach(e => {
            const esActiva = e.estado === 'Check-in';
            contenedor.innerHTML += `
                <div class="col-md-4 mb-3">
                    <div class="card shadow-sm border-${esActiva ? 'success' : 'primary'} h-100" 
                         style="cursor: pointer" onclick="verDetalle(${e.id})">
                        <div class="card-body">
                            <span class="badge bg-${esActiva ? 'success' : 'primary'} mb-2">
                                ${esActiva ? 'ACTIVA (In-house)' : 'FUTURA (Confirmada)'}
                            </span>
                            <h5 class="card-title">${e.cliente}</h5>
                            <p class="card-text text-muted mb-1">Doc: ${e.doc}</p>
                            <hr>
                            <div class="d-flex justify-content-between small">
                                ${e.ingreso !== "" ? `<span><strong>Check-in:</strong> ${e.ingreso}</span>` : '<span></span>'}
                                ${e.salida !== "" ? `<span><strong>Check-out:</strong> ${e.salida}</span>` : '<span></span>'}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (err) {
        console.error(err);
        contenedor.innerHTML = '<div class="alert alert-danger text-center">No se cargo ninguna estadía.</div>';
    }
}

async function verDetalle(id) {
    const modal = new bootstrap.Modal(document.getElementById('modalDetalle'));
    const cuerpo = document.getElementById('cuerpoModal');
    
    // Mostramos un icono de carga mientras esperamos al servidor
    cuerpo.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-2 text-muted">Cargando folio completo...</p></div>';
    modal.show();

    try {
        const res = await fetch(`http://localhost:${puerto}/api/estadias/${id}`);
        const data = await res.json();
        const r = data.reserva;

        // Construimos un diseño de "Folio" o "Voucher" utilizando las cuadrículas de Bootstrap
        cuerpo.innerHTML = `
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="bg-light p-3 rounded border">
                        <h6 class="text-primary border-bottom pb-2">Datos de la Reserva</h6>
                        <p class="mb-1"><strong>ID Reserva:</strong> #${r.id}</p>
                        <p class="mb-2"><strong>Estado:</strong> <span class="badge bg-${r.estado === 'Check-in' ? 'success' : 'primary'}">${r.estado}</span></p>
                        
                        <p class="mb-0 small">Llegada programada: ${r.ingreso}</p>
                        <p class="mb-2 small border-bottom pb-2">Salida programada: ${r.salida}</p>
                        
                        ${r.checkInReal !== "" ? `<p class="mb-1 text-success"><strong>Check-in Real:</strong> ${r.checkInReal}</p>` : ''}
                        ${r.checkOutReal !== "" ? `<p class="mb-1 text-danger"><strong>Check-out Real:</strong> ${r.checkOutReal}</p>` : ''}
                        
                        <p class="mb-0 small text-muted mt-3">Registrada el: ${r.fechaRegistro}</p>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="bg-light p-3 rounded border h-100">
                        <h6 class="text-primary border-bottom pb-2">Cliente Titular (Quien reservó)</h6>
                        <h5 class="mb-1 mt-3">${r.titular}</h5>
                        <p class="mb-0 text-muted">Documentación: ${r.documentacion}</p>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-5">
                    <h6 class="text-primary border-bottom pb-2">Habitaciones (${data.habitaciones.length})</h6>
                    <ul class="list-group mb-3 shadow-sm">
                        ${data.habitaciones.map(h => `
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                <strong>${h.numero}</strong>
                                <span class="badge bg-secondary rounded-pill">${h.tipo}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <div class="col-md-7">
                    <h6 class="text-primary border-bottom pb-2">Huéspedes (${data.huespedes.length})</h6>
                    <div class="table-responsive shadow-sm rounded border">
                        <table class="table table-sm table-hover mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Nombre Completo</th>
                                    <th>Documentación</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.huespedes.map(h => `
                                    <tr>
                                        <td>${h.nombre} ${h.apellido}</td>
                                        <td>${h.doc}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        // --- NUEVA LÓGICA DE BOTONES ---
        const footer = document.getElementById('footerModal');
        footer.innerHTML = '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>';

        if (r.estado === 'Confirmada') {
            footer.innerHTML += `<button type="button" class="btn btn-success px-4" onclick="cambiarEstado(${r.id}, 'Check-in')">Realizar Check-in</button>`;
        } else if (r.estado === 'Check-in') {
            footer.innerHTML += `<button type="button" class="btn btn-warning px-4" onclick="cambiarEstado(${r.id}, 'Check-out')">Realizar Check-out</button>`;
        }

    } catch (err) {
        cuerpo.innerHTML = `
            <div class="alert alert-danger text-center">
                <strong>Error al cargar los detalles.</strong><br>
                Asegúrate de que el servidor de C# esté corriendo en el puerto ${puerto}.
            </div>`;
    }
}
// Función para procesar el Check-in o Check-out
async function cambiarEstado(idEstadia, nuevoEstado) {
    // 1. Mensaje de validación condicional
    let mensajeConfirmacion = "";
    if (nuevoEstado === "Check-in") {
        mensajeConfirmacion = "Por favor, confirme que ha validado físicamente la documentación de todos los huéspedes presentes.\n\n¿Desea proceder con el Check-in?";
    } else {
        mensajeConfirmacion = "¿Está seguro de que desea realizar el Check-out? Esta acción cerrará la cuenta de las habitaciones y la reserva desaparecerá de este panel activo.";
    }

    // 2. Ventana de confirmación nativa del navegador
    if (!confirm(mensajeConfirmacion)) {
        return; // Si el usuario cancela, no hacemos nada
    }

    // 3. Petición al backend
    try {
        const response = await fetch(`http://localhost:${puerto}/api/estadias/${idEstadia}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ NuevoEstado: nuevoEstado })
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.mensaje); // "La reserva ha cambiado a estado..."
            
            // Cerramos el modal usando Bootstrap
            const modalElement = document.getElementById('modalDetalle');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            modalInstance.hide();
            
            // Recargamos las tarjetas para reflejar el cambio en pantalla
            cargarEstadias();
        } else {
            alert("Error: " + result.error);
        }
    } catch (error) {
        console.error(error);
        alert("Error de conexión al intentar cambiar el estado.");
    }
}