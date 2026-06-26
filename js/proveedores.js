import { dibujarProveedores } from "./renderproveedores.js";
import { cambiarSeccion, mostrarAlerta, toggleModal } from "./ui.js";
import { API_BASE_URL } from "./config.js";
import { apiFetch } from "./apiClient.js";

const API_URL = `${API_BASE_URL}/api/proveedores`;
let proveedoresEstado = 'activos';
let proveedoresCache = [];

// 1. OBTENER DATOS (API)
export async function fetchProveedores(estado = 'activos') {
    try {
        const url = estado === 'eliminados' ? `${API_URL}?estado=eliminados` : API_URL;
        const res = await apiFetch(url);
        if (!res.ok) throw new Error("Error al obtener proveedores");
        return await res.json();
    } catch (error) {
        console.error("Error en fetchProveedores:", error);
        return [];
    }
}

// 2. CREAR PROVEEDOR
export async function crearProveedor(proveedor) {
    try {
        const res = await apiFetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(proveedor)
        });
        if (!res.ok) throw new Error("Error al crear proveedor");
        const nuevoProveedor = await res.json();
        mostrarAlerta("Proveedor creado exitosamente", "success");
        return nuevoProveedor;
    } catch (error) {
        console.error("Error en crearProveedor:", error);
        mostrarAlerta("Error al crear proveedor: " + error.message, "error");
        throw error;
    }
}

// 3. ACTUALIZAR PROVEEDOR
export async function actualizarProveedor(id, proveedor) {
    try {
        const res = await apiFetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(proveedor)
        });
        if (!res.ok) throw new Error("Error al actualizar proveedor");
        const proveedorActualizado = await res.json();
        mostrarAlerta("Proveedor actualizado exitosamente", "success");
        return proveedorActualizado;
    } catch (error) {
        console.error("Error en actualizarProveedor:", error);
        mostrarAlerta("Error al actualizar proveedor: " + error.message, "error");
        throw error;
    }
}

// En tu archivo de proveedores:
export async function poblarSelectProveedores() {
    const proveedores = await fetchProveedores(); // Tu función que trae los proveedores de la base de datos
    const select = document.getElementById("proveedor"); // El ID del select en tu HTML
    if (!select) return;

    // Limpiamos las opciones viejas
    select.innerHTML = '<option value="">Seleccione un proveedor...</option>';
    
    // Llenamos el select con los nuevos datos
    proveedores.forEach(prov => {
        const option = document.createElement("option");
        option.value = prov.id; // IMPORTANTE: Guardamos el ID
        option.innerText = prov.nombre; // Mostramos el nombre
        select.appendChild(option);
    });
}

// 4. ELIMINAR PROVEEDOR
export async function eliminarProveedor(id, nombre) {
    if (!confirm(`¿Estás seguro de eliminar el proveedor "${nombre}"?`)) return;
    try {
        const res = await apiFetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Error al eliminar proveedor");
        mostrarAlerta("Proveedor eliminado exitosamente", "success");
        await listarProveedores(proveedoresEstado);
        return true;
    } catch (error) {
        console.error("Error en eliminarProveedor:", error);
        mostrarAlerta("Error al eliminar proveedor: " + error.message, "error");
        return false;
    }
}

export async function restaurarProveedor(id) {
    try {
        const res = await apiFetch(`${API_URL}/${id}/restaurar`, { method: 'PUT' });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Error al restaurar proveedor');
        }
        mostrarAlerta('Proveedor restaurado exitosamente', 'success');
        await listarProveedores(proveedoresEstado);
        return true;
    } catch (error) {
        console.error('Error en restaurarProveedor:', error);
        mostrarAlerta('Error al restaurar proveedor: ' + error.message, 'error');
        return false;
    }
}

// 5. LISTAR PROVEEDORES (con búsqueda)
export async function listarProveedores(estado = 'activos') {
    proveedoresEstado = estado;
    proveedoresCache = await fetchProveedores(estado);
    dibujarProveedores(proveedoresCache, estado);
}

// 6. BUSCAR PROVEEDORES
export function buscarProveedores(query) {
    const filtrados = proveedoresCache.filter(p => {
        const texto = `${p.nombre} ${p.cuit} ${p.telefono} ${p.email}`.toLowerCase();
        return texto.includes(query.toLowerCase());
    });
    dibujarProveedores(filtrados, proveedoresEstado);
}

// 7. PREPARAR FORMULARIO PARA EDICIÓN
export function prepararEdicionProveedor(id) {
    fetchProveedores().then(proveedores => {
        const proveedor = proveedores.find(p => p.id === id);
        if (!proveedor) return;

        document.getElementById("formProveedorId").value = proveedor.id;
        document.getElementById("proveedorNombre").value = proveedor.nombre || "";
        document.getElementById("proveedorCuit").value = proveedor.cuit || "";
        document.getElementById("proveedorArcaCategoria").value = proveedor.arca_categoria || "";
        document.getElementById("proveedorBancoCuenta").value = proveedor.banco_cuenta || "";
        document.getElementById("proveedorTelefono").value = proveedor.telefono || "";
        document.getElementById("proveedorDireccion").value = proveedor.direccion || "";
        document.getElementById("proveedorEmail").value = proveedor.email || "";
        document.getElementById("proveedorObservaciones").value = proveedor.observaciones || "";

        document.getElementById("tituloModalProveedor").textContent = "Editar Proveedor";
        toggleModal('modalProveedor', true);
    });
}

// 8. LIMPIAR FORMULARIO
export function limpiarFormularioProveedor() {
    document.getElementById("formProveedorId").value = "";
    document.getElementById("proveedorNombre").value = "";
    document.getElementById("proveedorCuit").value = "";
    document.getElementById("proveedorArcaCategoria").value = "";
    document.getElementById("proveedorBancoCuenta").value = "";
    document.getElementById("proveedorTelefono").value = "";
    document.getElementById("proveedorDireccion").value = "";
    document.getElementById("proveedorEmail").value = "";
    document.getElementById("proveedorObservaciones").value = "";

    document.getElementById("tituloModalProveedor").textContent = "Nuevo Proveedor";
}

// 9. MANEJAR SUBMIT DEL FORMULARIO
export async function manejarSubmitProveedor(event) {
    event.preventDefault();

    const id = document.getElementById("formProveedorId").value;
    const proveedor = {
        nombre: document.getElementById("proveedorNombre").value.trim().toUpperCase(),
        cuit: document.getElementById("proveedorCuit").value.trim(),
        arca_categoria: document.getElementById("proveedorArcaCategoria").value.trim(),
        banco_cuenta: document.getElementById("proveedorBancoCuenta").value.trim(),
        telefono: document.getElementById("proveedorTelefono").value.trim(),
        direccion: document.getElementById("proveedorDireccion").value.trim(),
        email: document.getElementById("proveedorEmail").value.trim(),
        observaciones: document.getElementById("proveedorObservaciones").value.trim()
    };

    try {
        if (id) {
            await actualizarProveedor(id, proveedor);
        } else {
            await crearProveedor(proveedor);
        }
        limpiarFormularioProveedor();
        toggleModal('modalProveedor', false);
        await listarProveedores(proveedoresEstado);
    } catch (error) {
        console.error("Error al guardar el proveedor:", error);
    }
}

// 10. INICIALIZACIÓN
export async function initProveedores() {
    await listarProveedores();
    configurarFormularioProveedor();
    configurarBuscadorProveedores();

    const btnAbrirModalProveedor = document.getElementById("btnAbrirModalProveedor");
    if (btnAbrirModalProveedor) {
        btnAbrirModalProveedor.onclick = () => {
            limpiarFormularioProveedor();
            toggleModal('modalProveedor', true);
        };
    }

    const toggleEliminados = document.getElementById("toggleProveedoresEliminados");
    if (toggleEliminados) {
        toggleEliminados.onchange = async (e) => {
            await listarProveedores(e.target.checked ? 'eliminados' : 'activos');
        };
    }

    window.restaurarProveedor = restaurarProveedor;
}

// 11. CONFIGURAR FORMULARIO
function configurarFormularioProveedor() {
    const form = document.getElementById("formProveedor");
    if (form) {
        form.addEventListener("submit", manejarSubmitProveedor);
    }
}

// 12. CONFIGURAR BUSCADOR
function configurarBuscadorProveedores() {
    const input = document.getElementById("buscarProveedor");
    if (input) {
        input.addEventListener("input", (e) => {
            buscarProveedores(e.target.value);
        });
    }
}

// 13. CERRAR MODAL PROVEEDOR
export function cerrarModalProveedor() {
    toggleModal('modalProveedor', false);
}

// 14. EXPOSICIÓN GLOBAL PARA HTML
window.eliminarProveedor = eliminarProveedor;
window.prepararEdicionProveedor = prepararEdicionProveedor;
window.cerrarModalProveedor = cerrarModalProveedor;