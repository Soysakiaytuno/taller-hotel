class GestionCargador {
    constructor(mediator) {
        this.mediator = mediator;
    }

    async cargarEstadias() {
        const mostrarPasadas = this.mediator.switchHistorial.checked;
        
        try {
            const res = await fetch(`http://localhost:${this.mediator.puerto}/api/estadias?incluirPasadas=${mostrarPasadas}`);
            const estadias = await res.json();
            
            let mensaje = mostrarPasadas 
                ? "📭 No hay registros en el sistema." 
                : "📭 Por ahora no hay reservas activas a visualizar.";
                
            this.dibujarTarjetas(estadias, mensaje);
        } catch (err) {
            console.error("Error al cargar estadías:", err);
        }
    }

    dibujarTarjetas(listaEstadias, mensajeVacio) {
        this.mediator.contenedorTarjetas.innerHTML = '';

        if (listaEstadias.length === 0) {
            const emptyStateFragment = this.mediator._getTemplateContent('template-empty-state');
            if (emptyStateFragment) {
                emptyStateFragment.querySelector('[data-placeholder="mensajeVacio"]').textContent = mensajeVacio;
                this.mediator.contenedorTarjetas.appendChild(emptyStateFragment);
            }
            return;
        }

        const cardTemplate = document.getElementById('template-estadia-card');
        if (!cardTemplate) {
            console.error("Plantilla 'template-estadia-card' no encontrada.");
            return;
        }

        listaEstadias.forEach(e => {
            const cardClone = document.importNode(cardTemplate.content, true);
            const cardDiv = cardClone.querySelector('.card');
            const badgeSpan = cardClone.querySelector('[data-placeholder="etiquetaEstado"]');

            let colorBorde = 'primary';
            let etiquetaEstado = 'FUTURA (Confirmada)';
            if (e.estado === 'Check-in') {
                colorBorde = 'success';
                etiquetaEstado = 'ACTIVA (In-house)';
            } else if (e.estado === 'Check-out') {
                colorBorde = 'secondary';
                etiquetaEstado = 'FINALIZADA (Check-out)';
            }

            cardDiv.classList.add(`border-${colorBorde}`);
            cardDiv.addEventListener('click', () => this.mediator.verDetalle(e.id));
            badgeSpan.classList.add(`bg-${colorBorde}`);
            badgeSpan.textContent = etiquetaEstado;
            cardClone.querySelector('[data-placeholder="cliente"]').textContent = e.cliente;
            cardClone.querySelector('[data-placeholder="doc"]').textContent = e.doc;
            cardClone.querySelector('[data-placeholder="ingreso"]').textContent = e.ingreso;
            cardClone.querySelector('[data-placeholder="salida"]').textContent = e.salida;
            this.mediator.contenedorTarjetas.appendChild(cardClone);
        });
    }
}