// js/productos.js
import { dibujarProductos } from "./renderproductos.js";
import { toggleModal } from "./ui.js";

const API_URL = "http://localhost:3000/api/productos";

// 1. OBTENER DATOS (API)
export async function fetchProductos() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Error al obtener productos");
        return await res.json();
    } catch (error) {
        console.error("Error en fetchProductos:", error);
        return [];
    }
}

// 2. LISTAR (Une API + RENDER)
export async function listarProductos() {
    const productos = await fetchProductos();
    dibujarProductos(productos);
}

// 3. GUARDAR (API)
export async function guardarProductoAPI(datos, id = null) {
    const method = id ? "PUT" : "POST";
    const url = id ? `${API_URL}/${id}` : API_URL;
    try {
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Error al guardar");
        }
        return true;
    } catch (error) {
        alert("❌ " + error.message);
        return false;
    }
}

// 4. LÓGICA DE INTERFAZ (Controlador)
export async function prepararEdicionProducto(id) {
    const productos = await fetchProductos();
    const p = productos.find(prod => prod.id === id);
    if (!p) return;

    // Llenar campos del formulario
    document.getElementById("formProductoId").value = p.id;
    document.getElementById("sku").value = p.sku;
    document.getElementById("descripcion").value = p.descripcion;
    document.getElementById("marca").value = p.marca;
    document.getElementById("modelo").value = p.modelo;
    document.getElementById("categoria").value = p.categoria;
    document.getElementById("proveedor").value = p.proveedor;
    document.getElementById("costo").value = p.costo;
    document.getElementById("precio_neto").value = p.precio_neto;
    document.getElementById("iva").value = p.iva;
    document.getElementById("stock").value = p.stock;
    document.getElementById("stock_minimo").value = p.stock_minimo;
    document.getElementById("control_stock").checked = p.control_stock === 1;

    document.getElementById("tituloModalProducto").innerText = "Editar Producto";
    toggleModal("modalProducto", true);
}

export async function eliminarProducto(id) {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;
    try {
        const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        if (res.ok) {
            listarProductos();
        }
    } catch (error) {
        alert("Error al eliminar");
    }
}

// 5. EXPOSICIÓN GLOBAL
window.prepararEdicionProducto = prepararEdicionProducto;
window.eliminarProducto = eliminarProducto;
window.listarProductos = listarProductos;
