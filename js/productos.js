// js/productos.js
const API_URL = "http://localhost:3000/api/productos";

export async function fetchProductos() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) {
            throw new Error("Error al obtener productos");
        }
        return await res.json();
    } catch (error) {
        console.error("Error en fetchProductos:", error);
        return [];
    }
}

export async function guardarProductoAPI(datos, id = null) {
    const method = id ? "PUT" : "POST";
    const url = id ? `${API_URL}/${id}` : API_URL;
    try{
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });
        if (!res.ok) {
            let mensaje = "Error desconocido al guardar";
            try {
                const errorData = await res.json();
                mensaje = errorData.error || mensaje;
            } catch {
                // si no viene JSON, usamos mensaje genérico
            }
            throw new Error(mensaje);
        }   
        return true;
    } catch (error){
        //Mostramos el mesaje real en el alert
        alert("❌ " + error.message);
        return false;
    }
}     