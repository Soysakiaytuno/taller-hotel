document.getElementById('formRegistroCliente').addEventListener('submit', async function(evento) {
    
    evento.preventDefault();

    const nombre = document.getElementById('nombre').value;
    const apellido = document.getElementById('apellido').value;
    const documento = document.getElementById('documento').value;

    const datosCliente = {
        Nombre: nombre,
        Apellido: apellido,
        Documento: documento
    };

    const alerta = document.getElementById('mensajeAlerta');

    try {
        const respuesta = await fetch('http://localhost:5189/api/clientes/registrar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosCliente)
        });

        const resultado = await respuesta.json();

        alerta.classList.remove('d-none', 'alert-success', 'alert-danger', 'alert-warning');

        if (respuesta.ok) {
            alerta.classList.add('alert-success');
            alerta.textContent = resultado.mensaje;
            document.getElementById('formRegistroCliente').reset();
        } else if (respuesta.status === 409) {
            alerta.classList.add('alert-warning');
            alerta.textContent = resultado.error;
        } else {
            alerta.classList.add('alert-danger');
            alerta.textContent = "Error al registrar: " + (resultado.error || "Revisa los datos.");
        }

    } catch (error) {
        console.error("Error de conexión:", error);
        alerta.classList.remove('d-none');
        alerta.classList.add('alert-danger');
        alerta.textContent = "No se pudo conectar con el servidor. ¿Está encendido el backend?";
    }
})