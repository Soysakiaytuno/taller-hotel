document.getElementById('formRegistroCliente').addEventListener('submit', async function(evento) {
    // Evitamos que la página se recargue al enviar el formulario
    evento.preventDefault();

    // 1. Capturamos los valores de los inputs
    const nombre = document.getElementById('nombre').value;
    const apellido = document.getElementById('apellido').value;
    const documento = document.getElementById('documento').value;

    // 2. Preparamos el objeto JSON que espera C#
    const datosCliente = {
        Nombre: nombre,
        Apellido: apellido,
        Documento: documento
    };

    const alerta = document.getElementById('mensajeAlerta');

    try {
        // 3. Hacemos la petición POST a tu backend
        // OJO: Asegúrate de que el puerto (ej. 5000 o 5258) sea el que muestra tu terminal al correr C#
        const respuesta = await fetch('http://localhost:5189/api/clientes/registrar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosCliente)
        });

        // 4. Leemos la respuesta del servidor
        const resultado = await respuesta.json();

        // 5. Manejamos los escenarios (Éxito, Error de duplicado, etc.)
        alerta.classList.remove('d-none', 'alert-success', 'alert-danger', 'alert-warning');

        if (respuesta.ok) {
            alerta.classList.add('alert-success');
            alerta.textContent = resultado.mensaje; // "Cliente registrado exitosamente"
            document.getElementById('formRegistroCliente').reset(); // Limpiamos el formulario
        } else if (respuesta.status === 409) {
            alerta.classList.add('alert-warning');
            alerta.textContent = resultado.error; // "Ya existe un usuario..."
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