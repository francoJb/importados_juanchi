// js/clientes.js
const API_URL = "http://localhost:3000/api/clientes";

export async function fetchClientes() {
    const res = await fetch(API_URL);
    return await res.json();
}

export async function guardarClienteAPI(datos, id = null) {
    const method = id ? "PUT" : "POST";
    const url = id ? `${API_URL}/${id}` : API_URL;
    
    const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
    });
    return res.ok;
}