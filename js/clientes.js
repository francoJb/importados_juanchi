// js/clientes.js

const URL_API = "http://localhost:3000/clientes";

// Obtener todos los clientes
export async function obtenerClientes() {
    try {
        const res = await fetch(URL_API);
        return await res.json();
    } catch (error) {
        console.error("Error al obtener clientes:", error);
        return [];
    }
}

// Guardar o Editar Cliente
export async function guardarCliente(datosCliente, id = null) {
    const url = id ? `${URL_API}/${id}` : URL_API;
    const method = id ? "PUT" : "POST";

    try {
        const res = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datosCliente)
        });
        return res.ok;
    } catch (error) {
        console.error("Error al guardar cliente:", error);
        return false;
    }
}

// Registrar un cobro (Cuenta Corriente)
export async function registrarCobroAPI(id, monto) {
    try {
        const res = await fetch(`${URL_API}/${id}/cobrar`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ monto })
        });
        return res.ok;
    } catch (error) {
        console.error("Error en el cobro:", error);
        return false;
    }
}