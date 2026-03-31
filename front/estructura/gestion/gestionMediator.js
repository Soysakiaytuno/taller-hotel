class GestionMediator {
    constructor() {
        this.puerto = 5189;

        // Referencias a elementos del DOM
        this.contenedorTarjetas = document.getElementById('contenedorTarjetas');
        this.inputBusqueda = document.getElementById('inputBusqueda');
        this.btnBuscar = document.getElementById('btnBuscar');
        this.btnLimpiar = document.getElementById('btnLimpiar');
        this.switchHistorial = document.getElementById('switchHistorial');
        this.contenedorSwitch = document.getElementById('contenedorSwitch');
        this.modalDetalle = new bootstrap.Modal(document.getElementById('modalDetalle'));
        this.cuerpoModal = document.getElementById('cuerpoModal');
        this.footerModal = document.getElementById('footerModal');

        // Asegurarse de que los elementos existan
        if (!this.contenedorTarjetas || !this.inputBusqueda || !this.btnBuscar || !this.btnLimpiar || !this.switchHistorial || !this.contenedorSwitch || !this.cuerpoModal || !this.footerModal) {
            console.error("Uno o más elementos DOM requeridos para la gestión no se encontraron.");
        }

        // Instanciar los manejadores de cada funcionalidad
        this.cargador = new GestionCargador(this);
        this.buscador = new GestionBuscador(this);
        this.detalle = new GestionDetalle(this);

        // Bindear 'this' a los métodos que serán usados como callbacks de eventos
        this.realizarBusqueda = this.realizarBusqueda.bind(this);
        this.limpiarBusqueda = this.limpiarBusqueda.bind(this);
        this.cargarEstadias = this.cargarEstadias.bind(this);

        this.verDetalle = this.verDetalle.bind(this);
        this.cambiarEstado = this.cambiarEstado.bind(this);
        this.dibujarTarjetas = this.dibujarTarjetas.bind(this);
    }

    // Helper privado para obtener y clonar contenido de plantillas
    _getTemplateContent(templateId) {
        const template = document.getElementById(templateId);
        if (!template) {
            console.error(`Plantilla con ID "${templateId}" no encontrada.`);
            return null;
        }
        return document.importNode(template.content, true);
    }

    // --- Métodos de delegación ---

    cargarEstadias() {
        this.cargador.cargarEstadias();
    }

    dibujarTarjetas(listaEstadias, mensajeVacio) {
        this.cargador.dibujarTarjetas(listaEstadias, mensajeVacio);
    }

    realizarBusqueda() {
        this.buscador.realizarBusqueda();
    }

    limpiarBusqueda() {
        this.buscador.limpiarBusqueda();
    }

    verDetalle(id) {
        this.detalle.verDetalle(id);
    }

    cambiarEstado(idEstadia, nuevoEstado) {
        this.detalle.cambiarEstado(idEstadia, nuevoEstado);
    }
}

// Exportar la instancia del mediador globalmente
window.gestionMediatorInstance = new GestionMediator();