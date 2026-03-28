const URL_API = "http://localhost:3000/api/ventas";

export async function enviarVentaAlServidor(datos) {
    const response = await fetch(URL_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
    return await response.json();
}

export async function obtenerHistorialVentas() {
    const response = await fetch(URL_API);
    return await response.json();
}