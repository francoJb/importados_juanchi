import { dibujarProductos } from "./renderproductos.js";
import { cambiarSeccion, mostrarAlerta } from "./ui.js";
import { API_BASE_URL } from "./config.js";
import { apiFetch } from "./apiClient.js";

const API_URL = `${API_BASE_URL}/api/productos`;
// 1. OBTENER DATOS (API)
export async function fetchProductos() {
    try {
        const res = await apiFetch(API_URL);
        if (!res.ok) throw new Error("Error al obtener productos");
        return await res.json();
    } catch (error) {
        console.error("Error en fetchProductos:", error);
        return [];
    }
}

export async function fetchCategorias() {
    try {
        const res = await apiFetch(`${API_URL}/categorias`);
        if (!res.ok) throw new Error("Error al obtener categorías");
        return await res.json();
    } catch (error) {
        console.error("Error en fetchCategorias:", error);
        return [];
    }
}

export async function fetchProveedores() {
    try {
        const res = await apiFetch(`${API_BASE_URL}/api/proveedores`);
        if (!res.ok) throw new Error("Error al obtener proveedores");
        return await res.json();
    } catch (error) {
        console.error("Error en fetchProveedores:", error);
        return [];
    }
}

export async function poblarSelectCategorias() {
    const categorias = await fetchCategorias();
    const datalist = document.getElementById("categoriasDatalist");
    if (!datalist) return;

    datalist.innerHTML = '';
    categorias.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat.nombre; // Usar nombre en mayúsculas
        datalist.appendChild(option);
    });
}

export async function poblarSelectProveedores() {
    const proveedores = await fetchProveedores();
    const datalist = document.getElementById("proveedoresDatalist");
    if (!datalist) return;

    datalist.innerHTML = '';
    proveedores.forEach(prov => {
        const option = document.createElement("option");
        option.value = prov.nombre;
        datalist.appendChild(option);
    });
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
        const res = await apiFetch(url, {
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
        mostrarAlerta("❌ " + error.message, "Error", "error");
        return false;
    }
}

// 4. LÓGICA DE FORMULARIO (Mantenimiento de Productos)
export function configurarFormularioProducto() {
    const formProducto = document.getElementById("formProducto");
    if (!formProducto) return;

    formProducto.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById("formProductoId").value; // Ajustado según tu modal de edición
        
        const datos = {
            sku: document.getElementById("sku").value.trim(),
            descripcion: document.getElementById("descripcion").value,
            marca: document.getElementById("marca").value,
            modelo: document.getElementById("modelo").value,   
            categoria: document.getElementById("categoria").value,
            proveedor: document.getElementById("proveedor").value,
            costo: Number(document.getElementById("costo").value),
            precio_neto: Number(document.getElementById("precio_neto").value),
            stock: Number(document.getElementById("stock").value),
            stock_minimo: Number(document.getElementById("stock_minimo").value),
            control_stock: document.getElementById("control_stock").checked ? 1 : 0,
        };

        if (!datos.sku || !datos.descripcion) {
            mostrarAlerta("SKU y Descripción son obligatorios", "Campos requeridos", "warning");
            return;
        }
        
        const exito = await guardarProductoAPI(datos, id || null);
        if (exito) {
            mostrarAlerta("Producto guardado correctamente", "¡Éxito!", "success");
            formProducto.reset();
            await poblarSelectCategorias();
            await poblarSelectProveedores();
            listarProductos(); // Recarga la tabla automáticamente
            cambiarSeccion('seccionProductos');
        }
    };
}

// 5. BUSCADOR DE PRODUCTOS (Sección Productos)
export function configurarBuscadorProductos() {
    const inputBusqueda = document.getElementById("buscarProducto");
    if (inputBusqueda) {
        inputBusqueda.oninput = async (e) => {
            const termino = e.target.value.toLowerCase();
            const todosLosProductos = await fetchProductos();
            const filtrados = todosLosProductos.filter(p => 
                (p.descripcion || "").toLowerCase().includes(termino) || 
                (p.sku || "").toLowerCase().includes(termino) ||
                (p.marca || "").toLowerCase().includes(termino)
            );
            dibujarProductos(filtrados);
        };
    }
}

// 6. PREPARAR EDICIÓN
export async function prepararEdicionProducto(id) {
    const productos = await fetchProductos();
    const p = productos.find(prod => prod.id == id);
    if (!p) return;

    document.getElementById("formProductoId").value = p.id;
    document.getElementById("sku").value = p.sku;
    document.getElementById("descripcion").value = p.descripcion;
    document.getElementById("marca").value = p.marca;
    document.getElementById("modelo").value = p.modelo;
    document.getElementById("categoria").value = p.categoria;
    document.getElementById("proveedor").value = p.proveedor;
    document.getElementById("costo").value = p.costo;
    document.getElementById("precio_neto").value = p.precio_neto;
    document.getElementById("stock").value = p.stock;
    document.getElementById("stock_minimo").value = p.stock_minimo;
    document.getElementById("control_stock").checked = p.control_stock === 1;

    document.getElementById("tituloModalProducto").innerText = "Editar Producto";
    cambiarSeccion('pantallaProducto');
}

// 7. ELIMINAR PRODUCTO (Soft Delete)
export async function eliminarProducto(id, descripcion) {
    const confirmacion = confirm(`¿Estás seguro de que quieres eliminar el producto "${descripcion}"? Esta acción solo lo desactivará.`);
    if (!confirmacion) return;

    try {
        const response = await apiFetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            mostrarAlerta("Producto eliminado correctamente.", "¡Éxito!", "success");
            listarProductos(); // Recarga la tabla automáticamente
        } else {
            const errorData = await response.json();
            mostrarAlerta("Error al eliminar el producto: " + (errorData.error || "Error desconocido"), "Error", "error");
        }
    } catch (error) {
        console.error("Error en la conexión:", error);
        mostrarAlerta("Error de conexión al eliminar el producto.", "Error de conexión", "error");
    }
}

// Hacer la función global para el onclick
window.eliminarProducto = eliminarProducto;

export async function initProductos() {
    await poblarSelectCategorias();
    await poblarSelectProveedores();
    await listarProductos();
    configurarFormularioProducto();
    configurarBuscadorProductos();

    const btnAbrirModalProducto = document.getElementById("btnAbrirModalProducto");
    if (btnAbrirModalProducto) {
        btnAbrirModalProducto.onclick = () => {
            document.getElementById("formProducto").reset();
            document.getElementById("formProductoId").value = "";
            cambiarSeccion("pantallaProducto");
        };
    }

    const btnCerrarModalProducto = document.getElementById("btnCerrarModalProducto");
    if (btnCerrarModalProducto) {
        btnCerrarModalProducto.onclick = () => cambiarSeccion("seccionProductos");
    }
}

// EXPOSICIÓN GLOBAL PARA HTML
window.prepararEdicionProducto = prepararEdicionProducto;
window.eliminarProducto = eliminarProducto;
window.listarProductos = listarProductos;
