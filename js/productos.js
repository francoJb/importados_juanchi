import { dibujarProductos } from "./renderproductos.js";
import { cambiarSeccion, mostrarAlerta, mostrarConfirmacion } from "./ui.js";
import { API_BASE_URL } from "./config.js";
import { apiFetch } from "./apiClient.js";
import { poblarSelectProveedores } from "./proveedores.js";

const API_URL = `${API_BASE_URL}/api/productos`;
let productosEstado = 'activos';
let productosCache = [];

// 1. OBTENER DATOS (API)
export async function fetchProductos(estado = 'activos') {
    try {
        const url = estado === 'eliminados' ? `${API_URL}?estado=eliminados` : API_URL;
        const res = await apiFetch(url);
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
    const select = document.getElementById("categoria"); // Buscamos el nuevo select
    if (!select) return;

    // Limpiamos las opciones viejas, dejando solo la primera por defecto
    select.innerHTML = '<option value="">Seleccione una categoría...</option>';
    
    // Recorremos las categorías y las agregamos como etiquetas <option>
    categorias.forEach(cat => {
        const option = document.createElement("option");
        // IMPORTANTE: Ahora guardamos el ID en el value, no el nombre
        option.value = cat.id; 
        option.innerText = cat.nombre;
        select.appendChild(option);
    });
}

// 2. LISTAR (Une API + RENDER)
export async function listarProductos(estado = 'activos') {
    productosEstado = estado;
    productosCache = await fetchProductos(estado);
    dibujarProductos(productosCache, estado);
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

export async function restaurarProducto(id) {
    try {
        const res = await apiFetch(`${API_URL}/${id}/restaurar`, { method: 'PUT' });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Error al restaurar producto');
        }
        mostrarAlerta('Producto restaurado correctamente', '¡Éxito!', 'success');
        await listarProductos(productosEstado);
        return true;
    } catch (error) {
        console.error('Error al restaurar producto:', error);
        mostrarAlerta('Error al restaurar el producto: ' + error.message, 'Error', 'error');
        return false;
    }
}

// 4. LÓGICA DE FORMULARIO (Mantenimiento de Productos)
export function configurarFormularioProducto() {
    const formProducto = document.getElementById("formProducto");
    if (!formProducto) return;

    formProducto.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById("formProductoId").value;
        
        const datos = {
            sku: document.getElementById("sku").value.trim(),
            descripcion: document.getElementById("descripcion").value,
            marca: document.getElementById("marca").value,
            modelo: document.getElementById("modelo").value,   
            costo: Number(document.getElementById("costo").value),
            precio_neto: Number(document.getElementById("precio_neto").value),
            stock: Number(document.getElementById("stock").value),
            stock_minimo: Number(document.getElementById("stock_minimo").value),
            control_stock: document.getElementById("control_stock").checked ? 1 : 0,
            categoria_id: document.getElementById("categoria").value,v,
            
            proveedor_nombre: document.getElementById("proveedor").value.trim(),
            proveedor: document.getElementById("proveedor").value.trim()
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
            await listarProductos(productosEstado);
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
            const filtrados = productosCache.filter(p => 
                (p.descripcion || "").toLowerCase().includes(termino) || 
                (p.sku || "").toLowerCase().includes(termino) ||
                (p.marca || "").toLowerCase().includes(termino)
            );
            dibujarProductos(filtrados, productosEstado);
        };
    }
}

// 6. PREPARAR EDICIÓN
export async function prepararEdicionProducto(id) {
    const p = productosCache.find(prod => prod.id == id);
    if (!p) return;

    document.getElementById("formProductoId").value = p.id;
    document.getElementById("sku").value = p.sku;
    document.getElementById("descripcion").value = p.descripcion;
    document.getElementById("marca").value = p.marca;
    document.getElementById("modelo").value = p.modelo;
    document.getElementById("categoria").value = p.categoria_id || '';
    document.getElementById("proveedor").value = p.proveedor || '';
    document.getElementById("costo").value = p.costo;
    document.getElementById("precio_neto").value = p.precio_neto;
    document.getElementById("stock").value = p.stock;
    document.getElementById("stock_minimo").value = p.stock_minimo;
    document.getElementById("control_stock").checked = p.control_stock === 1;

    document.getElementById("tituloModalProducto").innerText = "Editar Producto";
    cambiarSeccion('pantallaProducto');
}

// 1. FUNCIÓN PARA ABRIR EL MODAL Y CARGAR LOS DATOS ACTUALES
window.abrirModalEditarUnidad = function(id, chasis, motor, color, anio, patente) {
    document.getElementById('editUnidadId').value = id;
    document.getElementById('editChasis').value = chasis || '';
    document.getElementById('editMotor').value = motor || '';
    document.getElementById('editColor').value = color || '';
    document.getElementById('editAnio').value = anio || '';
    document.getElementById('editPatente').value = patente || '';
    
    document.getElementById('modalEditarUnidad').classList.remove('hidden');
};

// 2. FUNCIÓN PARA CERRAR EL MODAL
window.cerrarModalEditarUnidad = function() {
    document.getElementById('modalEditarUnidad').classList.add('hidden');
    document.getElementById('formEditarUnidad').reset();
};

// 3. FUNCIÓN PARA GUARDAR LOS CAMBIOS EN EL SERVIDOR (FETCH)
window.guardarCambiosUnidad = async function(event) {
    event.preventDefault();

    const id = document.getElementById('editUnidadId').value;
    const datosModificados = {
        chasis: document.getElementById('editChasis').value,
        motor: document.getElementById('editMotor').value,
        color: document.getElementById('editColor').value,
        anio: document.getElementById('editAnio').value,
        patente: document.getElementById('editPatente').value
    };

    try {
        const response = await fetch(`/vehiculos/unidades/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosModificados)
        });

        const resultado = await response.json();

        if (!response.ok) {
            throw new Error(resultado.error || 'No se pudieron guardar los cambios');
        }

        alert('✅ ¡Datos del vehículo corregidos con éxito!');
        window.cerrarModalEditarUnidad();
        
        if (typeof window.obtenerProductos === 'function') {
            window.obtenerProductos();
        }

    } catch (error) {
        console.error('Error al actualizar:', error);
        alert(`❌ Error: ${error.message}`);
    }
};

// 7. ELIMINAR PRODUCTO (Soft Delete)
export async function eliminarProducto(id, descripcion) {
    const confirmacion = await mostrarConfirmacion({
        title: "Eliminar producto",
        message: `¿Estás seguro de que querés eliminar el producto "${descripcion}"? Esta acción solo lo desactivará.`,
        confirmText: "Eliminar"
    });
    if (!confirmacion) return;

    try {
        const response = await apiFetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            mostrarAlerta("Producto eliminado correctamente.", "¡Éxito!", "success");
            await listarProductos(productosEstado);
        } else {
            const errorData = await response.json();
            mostrarAlerta("Error al eliminar el producto: " + (errorData.error || "Error desconocido"), "Error", "error");
        }
    } catch (error) {
        console.error("Error en la conexión:", error);
        mostrarAlerta("Error de conexión al eliminar el producto.", "Error de conexión", "error");
    }
}

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

    const toggleEliminados = document.getElementById("toggleProductosEliminados");
    if (toggleEliminados) {
        toggleEliminados.onchange = async (e) => {
            await listarProductos(e.target.checked ? 'eliminados' : 'activos');
        };
    }

    const btnCerrarModalProducto = document.getElementById("btnCerrarModalProducto");
    if (btnCerrarModalProducto) {
        btnCerrarModalProducto.onclick = () => cambiarSeccion("seccionProductos");
    }

    window.restaurarProducto = restaurarProducto;

    // === CONTROL DEL MODAL DE NUEVA CATEGORÍA ===
    const modalCat = document.getElementById("modalAgregarCategoria");
    const btnAbrirCat = document.getElementById("btnAbrirModalCategoria");
    const btnCerrarCatX = document.getElementById("btnCerrarModalCategoriaX");
    const btnCancelarCat = document.getElementById("btnCancelarCategoria");
    const formNuevaCat = document.getElementById("formNuevaCategoria");

    // Abrir el modal al presionar '+'
    if (btnAbrirCat && modalCat) {
        btnAbrirCat.onclick = () => {
            if (formNuevaCat) formNuevaCat.reset();
            modalCat.classList.remove("hidden");
        };
    }

    // Función auxiliar para cerrar el modal
    const cerrarMiModalCat = () => {
        if (modalCat) modalCat.classList.add("hidden");
    };

    if (btnCerrarCatX) btnCerrarCatX.onclick = cerrarMiModalCat;
    if (btnCancelarCat) btnCancelarCat.onclick = cerrarMiModalCat;

    // Escuchar el envío del formulario del modal (Guardar Categoría)
    if (formNuevaCat) {
        formNuevaCat.onsubmit = async (e) => {
            e.preventDefault();
            
            const nombreInput = document.getElementById("nuevoNombreCategoria");
            if (!nombreInput) return;

            const datos = {
                nombre: nombreInput.value.trim().toUpperCase()
            };

            try {
                // Hacemos un POST a un nuevo endpoint en el backend que crearemos luego
                const response = await apiFetch(`${API_URL}/categorias/nueva`, {
                    method: 'POST',
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(datos)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Error al guardar la categoría");
                }

                mostrarAlerta("Categoría añadida con éxito", "¡Éxito!", "success");
                cerrarMiModalCat();
                
                // Volvemos a cargar las categorías para que aparezca la nueva en el select
                await poblarSelectCategorias();
                
            } catch (err) {
                console.error("Error al guardar la categoría:", err);
                mostrarAlerta(err.message, "Error", "error");
            }
        };
    }

}

// ==========================================
// VER STOCK DE UNIDADES (DETALLE DE VEHÍCULOS)
// ==========================================

window.verUnidadesVehiculo = async function(productoId, descripcion) {
    try {
        // 1. Llamamos al endpoint del backend que ya tenemos creado
        const res = await apiFetch(`${API_URL}/${productoId}/unidades-disponibles`);
        if (!res.ok) throw new Error("No se pudieron cargar las unidades del vehículo");
        
        const unidades = await res.json();

        // 2. Buscamos el título del modal para poner el nombre del vehículo (si existe en tu HTML)
        const txtTitulo = document.getElementById("txtTituloModalVerUnidades") || document.getElementById("tituloModalVerUnidades");
        if (txtTitulo) {
            txtTitulo.innerText = `Unidades en Stock - ${descripcion}`;
        }

        // 3. Buscamos la tabla o contenedor donde se listan las unidades físicas
        const tbody = document.getElementById("tbodyUnidadesVehiculo") || document.getElementById("tablaUnidadesCuerpo");
        if (tbody) {
            tbody.innerHTML = ""; // Limpiamos lo que haya antes

            if (unidades.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center p-4 text-gray-500 dark:text-gray-400">
                            No hay unidades físicas disponibles para este modelo.
                        </td>
                    </tr>`;
            } else {
                // Dibujamos cada chasis/motor en la tabla
                unidades.forEach(u => {
                    const tr = document.createElement("tr");
                    tr.className = "border-b border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800";
                    tr.innerHTML = `
                        <td class="p-3">${u.chasis || '-'}</td>
                        <td class="p-3">${u.motor || '-'}</td>
                        <td class="p-3">${u.color || '-'}</td>
                        <td class="p-3 text-center">${u.anio || '-'}</td>
                        <td class="p-3 text-center">${u.patente || '-'}</td>
                        <td class="p-3 text-center">
                            <button onclick="abrirModalEditarUnidad(${u.id}, '${u.chasis}', '${u.motor}', '${u.color}', ${u.anio}, '${u.patente}')" 
                                    class="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                                Editar
                            </button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        }

        // 4. Mostramos el modal quitando la clase 'hidden' de Tailwind
        const modalVer = document.getElementById("modalVerUnidades");
        if (modalVer) {
            modalVer.classList.remove("hidden");
        } else {
            console.warn("⚠️ No se encontró el elemento HTML con el ID 'modalVerUnidades'");
        }

    } catch (error) {
        console.error("Error al cargar unidades:", error);
        mostrarAlerta("No se pudieron cargar las unidades físicas: " + error.message, "Error", "error");
    }
};

// Función auxiliar para cerrar este modal desde el botón "Cerrar" o la "X"
window.cerrarModalVerUnidades = function() {
    const modalVer = document.getElementById("modalVerUnidades");
    if (modalVer) modalVer.classList.add("hidden");
};

// ==========================================
// CONTROL DEL MODAL DE UNIDADES ADICIONALES
// ==========================================

window.abrirModalUnidad = function(id, descripcion) {
    document.getElementById('unidadProductoId').value = id;
    document.getElementById('txtNombreProductoUnidad').innerText = descripcion;
    
    document.getElementById('formNuevaUnidad').reset();
    document.getElementById('modalAgregarUnidad').classList.remove('hidden');
}

window.cerrarModalUnidad = function() {
    document.getElementById('modalAgregarUnidad').classList.add('hidden');
}

const formNuevaUnidad = document.getElementById('formNuevaUnidad');
if (formNuevaUnidad) {
    formNuevaUnidad.onsubmit = async function(e) {
        e.preventDefault();
        
        const data = {
            productoId: document.getElementById('unidadProductoId').value,
            chasis: document.getElementById('addChasis').value.trim(),
            motor: document.getElementById('addMotor').value.trim(),
            color: document.getElementById('addColor').value.trim(),
            anio: document.getElementById('addAnio').value ? parseInt(document.getElementById('addAnio').value) : null,
            patente: document.getElementById('addPatente').value.trim()
        };

        try {
            const response = await apiFetch(`${API_URL}/agregar-unidad`, {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error desconocido en el servidor");
            }

            mostrarAlerta("¡Unidad física añadida al stock con éxito!", "¡Éxito!", "success");
            window.cerrarModalUnidad();
            
            await listarProductos(productosEstado);
            
        } catch (err) {
            console.error("Error al guardar la unidad:", err);
            mostrarAlerta("Error al guardar la unidad: " + err.message, "Error", "error");
        }
    };
}

window.prepararEdicionProducto = prepararEdicionProducto;
window.eliminarProducto = eliminarProducto;
window.listarProductos = listarProductos;