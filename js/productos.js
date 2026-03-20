// js/productos.js
const API_URL = "http://localhost:3000/api/productos";

export async function fetchProductos() {
    const res = await fetch(API_URL);
    return await res.json();
}

export async function guardarProductoAPI(datos, id = null) {
    const method = id ? "PUT" : "POST";
    const url = id ? `${API_URL}/${id}` : API_URL;
    
    const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
    });
    return res.ok;
}