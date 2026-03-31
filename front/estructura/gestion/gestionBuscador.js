class GestionBuscador {
    constructor(mediator) {
        this.mediator = mediator;
    }

    async realizarBusqueda() {
        const query = this.mediator.inputBusqueda.value.trim();
        if (query === "") return;

        this.mediator.btnLimpiar.style.display = 'block';
        this.mediator.contenedorSwitch.style.display = 'none';

        try {
            const res = await fetch(`http://localhost:${this.mediator.puerto}/api/estadias/buscar?q=${encodeURIComponent(query)}`);
            const resultados = await res.json();
            this.mediator.dibujarTarjetas(resultados, `🔍 No se encontraron reservas que coincidan con "${query}".`);
        } catch (err) {
            console.error("Error en la búsqueda:", err);
        }
    }

    limpiarBusqueda() {
        this.mediator.inputBusqueda.value = "";
        this.mediator.btnLimpiar.style.display = 'none';
        this.mediator.contenedorSwitch.style.display = 'block';
        this.mediator.cargarEstadias();
    }
}