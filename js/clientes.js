// js/clientes.js
const API_URL = "http://localhost:3000/api/clientes";

export async function fetchClientes() {
    const res = await fetch(API_URL);
    return await res.json();
}

export async function guardarClienteAPI(datos, id = null) {
    const method = id ? "PUT" : "POST";
    const url = id ? `${API_URL}/${id}` : API_URL;
    try {
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });
        if (!res.ok) {
            let mensaje = "Error al guardar cliente";
            try {
                const errorData = await res.json();
                mensaje = errorData.error || mensaje;
            } catch {}
            throw new Error(mensaje);
        }
        return true;
    } catch (error) {
        alert("❌ " + error.message);
        return false;
    }
}