const puerto = 5189;

// ==========================================
// 1. EVENTOS INICIALES
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    cargarEstadias(); // Carga inicial por defecto

    // Eventos de Búsqueda
    document.getElementById('btnBuscar').addEventListener('click', realizarBusqueda);
    document.getElementById('btnLimpiar').addEventListener('click', limpiarBusqueda);
    document.getElementById('inputBusqueda').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') realizarBusqueda();
    });

    // Evento del Switch de Historial
    document.getElementById('switchHistorial').addEventListener('change', cargarEstadias);
});

// ==========================================
// 2. LÓGICA DE CARGA Y BÚSQUEDA
// ==========================================

// Carga la vista general (Lee el estado del switch automáticamente)
async function cargarEstadias() {
    const mostrarPasadas = document.getElementById('switchHistorial').checked;
    
    try {
        // Le mandamos el valor del switch al backend (true o false)
        const res = await fetch(`http://localhost:${puerto}/api/estadias?incluirPasadas=${mostrarPasadas}`);
        const estadias = await res.json();
        
        let mensaje = mostrarPasadas 
            ? "📭 No hay registros en el sistema." 
            : "📭 Por ahora no hay reservas activas a visualizar.";
            
        dibujarTarjetas(estadias, mensaje);
    } catch (err) {
        console.error("Error al cargar estadías:", err);
    }
}

// Carga los resultados de la búsqueda
async function realizarBusqueda() {
    const query = document.getElementById('inputBusqueda').value.trim();
    if (query === "") return;

    // Cambios visuales al buscar
    document.getElementById('btnLimpiar').style.display = 'block';
    document.getElementById('contenedorSwitch').style.display = 'none'; // Ocultamos el switch al buscar

    try {
        const res = await fetch(`http://localhost:${puerto}/api/estadias/buscar?q=${encodeURIComponent(query)}`);
        const resultados = await res.json();
        dibujarTarjetas(resultados, `🔍 No se encontraron reservas que coincidan con "${query}".`);
    } catch (err) {
        console.error("Error en la búsqueda:", err);
    }
}

// Limpia la búsqueda y restaura la vista
function limpiarBusqueda() {
    document.getElementById('inputBusqueda').value = "";
    document.getElementById('btnLimpiar').style.display = 'none';
    document.getElementById('contenedorSwitch').style.display = 'block'; // Volvemos a mostrar el switch
    
    cargarEstadias(); // Recargamos la vista respetando como haya quedado el switch
}

// ==========================================
// 3. RENDERIZADO VISUAL
// ==========================================
function dibujarTarjetas(listaEstadias, mensajeVacio) {
    const contenedor = document.getElementById('contenedorTarjetas');
    contenedor.innerHTML = '';

    if (listaEstadias.length === 0) {
        contenedor.innerHTML = `
            <div class="col-12 text-center mt-5">
                <div class="p-5 bg-white shadow-sm rounded">
                    <h5 class="text-muted mb-0">${mensajeVacio}</h5>
                </div>
            </div>`;
        return;
    }

    listaEstadias.forEach(e => {
        let colorBorde = 'primary'; 
        if (e.estado === 'Check-in') colorBorde = 'success';
        if (e.estado === 'Check-out') colorBorde = 'secondary'; 

        let etiquetaEstado = e.estado === 'Check-in' ? 'ACTIVA (In-house)' : 
                            (e.estado === 'Check-out' ? 'FINALIZADA (Check-out)' : 'FUTURA (Confirmada)');

        contenedor.innerHTML += `
            <div class="col-md-4 mb-3">
                <div class="card shadow-sm border-${colorBorde} h-100" 
                     style="cursor: pointer" onclick="verDetalle(${e.id})">
                    <div class="card-body">
                        <span class="badge bg-${colorBorde} mb-2">${etiquetaEstado}</span>
                        <h5 class="card-title">${e.cliente}</h5>
                        <p class="card-text text-muted mb-1">Doc: ${e.doc}</p>
                        <hr>
                        <div class="d-flex justify-content-between small">
                            <span><strong>Llegada:</strong> ${e.ingreso}</span>
                            <span><strong>Salida:</strong> ${e.salida}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
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