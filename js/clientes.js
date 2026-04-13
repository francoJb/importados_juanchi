import { dibujarClientes } from "./renderclientes.js";

const API_URL = "http://localhost:3000/api/clientes";

// 1. OBTENER DATOS (API)
export async function fetchClientes() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Error al obtener clientes");
        return await res.json();
    } catch (error) {
        console.error("Error en fetchClientes:", error);
        return [];
    }
}

// 2. LISTAR (Une API + RENDER)
export async function listarClientes() {
    const clientes = await fetchClientes();
    dibujarClientes(clientes);
}

// 3. GUARDAR (API)
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

// 4. LÓGICA DE FORMULARIO (Mantenimiento de Clientes)
export function configurarFormularioCliente() {
    const formCliente = document.getElementById("formCliente");
    if (!formCliente) return;

    formCliente.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById("formClienteId").value; // Ajustado según tu modal de edición
        
        const datos = {
            nombre: document.getElementById("nombre").value.trim(),
            apellido: document.getElementById("apellido").value.trim(),
            dni: document.getElementById("dni").value.trim(),
            direccion: document.getElementById("direccion").value.trim(),
            email: document.getElementById("email").value.trim(),
            telefono: document.getElementById("telefono").value.trim(),
            cuit: document.getElementById("cuit").value.trim(),
            arca: document.getElementById("arca").value.trim(),
            fecha_alta: document.getElementById("fecha_alta").value.trim()
        };

        if (!datos.nombre || !datos.apellido) {
            alert("⚠️ Nombre y Apellido son obligatorios");
            return;
        }
        
        const exito = await guardarClienteAPI(datos, id || null);
        if (exito) {
            alert("✅ Cliente guardado correctamente");
            toggleModal("modalCliente", false);
            formCliente.reset();
            listarClientes(); // Recarga la tabla automáticamente
        }
    };
}

// 5. BUSCADOR DE CLIENTES (Sección Clientes)
export function configurarBuscadorClientes() {
    const inputBusqueda = document.getElementById("buscarCliente");
    if (inputBusqueda) {
        inputBusqueda.oninput = async (e) => {
            const termino = e.target.value.toLowerCase();
            const todosLosClientes = await fetchClientes();
            const filtrados = todosLosClientes.filter(c => 
                (c.nombre || "").toLowerCase().includes(termino) || 
                (c.apellido || "").toLowerCase().includes(termino) ||
                (c.dni || "").toLowerCase().includes(termino)
            );
            dibujarClientes(filtrados);
        };
    }
}

// 6. PREPARAR EDICIÓN
export async function prepararEdicionCliente(id) {
    const cliente = await fetchClientes();
    const c = cliente.find(cli => cli.id == id);
    if (!c) return;
    // Llenamos el formulario con los datos guardados
    document.getElementById("formClienteId").value = c.id;
    document.getElementById("nombre").value = c.nombre;
    document.getElementById("apellido").value = c.apellido;
    document.getElementById("dni").value = c.dni;
    document.getElementById("direccion").value = c.direccion;
    document.getElementById("email").value = c.email;
    document.getElementById("telefono").value = c.telefono;
    document.getElementById("cuit").value = c.cuit;
    document.getElementById("arca").value = c.arca;
    document.getElementById("fecha_alta").value = c.fecha_alta;

    // Abrimos el modal
    const modal = document.getElementById("modalCliente");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
};

export async function eliminarCliente(id, nombre){
        // 1. El cartel de confirmación
        const rta = confirm(`¿Estás seguro de que querés eliminar a "${nombre}"?, esa accion solo desactivara el cliente`);
        if (rta) {
            try {
                // 2. Avisamos al Backend (Controller) que cambie el estado a 0
                const response = await fetch(`http://localhost:3000/api/clientes/${id}`, {
                    method: 'DELETE' // El método que definiste en tus rutas
                });
                if (response.ok) {
                    alert("Cliente eliminado con éxito.");
                    // 3. Recargamos la lista para que el cliente "desaparezca"
                    const clientesActualizados = await fetchClientes();
                    dibujarClientes(clientesActualizados);
                } else {
                    alert("No se pudo eliminar el cliente.");
                }
            } catch (error) {
                console.error("Error en la conexión:", error);
            }
        }
    };


window.prepararEdicionCliente = prepararEdicionCliente;
window.eliminarCliente = eliminarCliente;
window.listarClientes = listarClientes;