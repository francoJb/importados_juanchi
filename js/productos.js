// js/productos.js
const API_URL = "http://localhost:3000/api/productos";

export async function fetchProductos() {
    const res = await fetch(API_URL);
    return await res.json();
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
            //extraemos el JSON del error que mando el backend
            const errorData = await res.json();
            //lanzamos un error con el mensaje especifico
            throw new Error(errorData.error || "Error desconocido al guardar");
        }   
        return true;
    } catch (error){
        //Mostramos el mesaje real en el alert
        alert("❌ " + error.message);
        return false;
    }
}     