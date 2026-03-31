const mediator = window.gestionMediatorInstance;

document.addEventListener('DOMContentLoaded', () => {
    // Cargar las estadías iniciales al cargar la página
    mediator.cargarEstadias();

    // Adjuntar listeners de eventos a los elementos del DOM, delegando al mediador
    mediator.btnBuscar.addEventListener('click', mediator.realizarBusqueda);
    mediator.btnLimpiar.addEventListener('click', mediator.limpiarBusqueda);
    mediator.inputBusqueda.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') mediator.realizarBusqueda();
    });

    mediator.switchHistorial.addEventListener('change', mediator.cargarEstadias);
});