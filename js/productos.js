import { dibujarProductos } from "./renderproductos.js";
import { cambiarSeccion, mostrarAlerta, mostrarConfirmacion } from "./ui.js";
import { API_BASE_URL } from "./config.js";
import { apiFetch } from "./apiClient.js";

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

    const inputCategoria = document.getElementById('categoria');
    const camposVehiculo = document.getElementById('camposVehiculo');

    if (inputCategoria && camposVehiculo) {
        inputCategoria.addEventListener('input', () => {
            const categoriaSeleccionada = inputCategoria.value.trim().toUpperCase();
            // CORRECCIÓN: Robusto contra VEHICULO o VEHICULOS
            if (categoriaSeleccionada.startsWith('VEHICULO')) {
                camposVehiculo.classList.remove('hidden');
            } else {
                camposVehiculo.classList.add('hidden');
            }
        });
    }

    formProducto.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById("formProductoId").value;
        
        const categoriaInput = document.getElementById("categoria").value.trim().toUpperCase();
        const esVehiculo = categoriaInput.startsWith("VEHICULO");
        
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
            
            // CORRECCIÓN PUNTO 1: Enviamos las propiedades exactas que mapea el Backend
            categoria_nombre: document.getElementById("categoria").value.trim(),
            proveedor_nombre: document.getElementById("proveedor").value.trim(),
            categoria: document.getElementById("categoria").value.trim(),
            proveedor: document.getElementById("proveedor").value.trim(),
            
            vehiculo_tipo: esVehiculo ? document.getElementById('vehiculo_tipo').value : null,
            vehiculo_anio: esVehiculo ? (parseInt(document.getElementById('vehiculo_anio').value) || null) : null,
            vehiculo_chasis: esVehiculo ? document.getElementById('vehiculo_chasis').value.trim() : null,
            vehiculo_motor: esVehiculo ? document.getElementById('vehiculo_motor').value.trim() : null,
            vehiculo_color: esVehiculo ? document.getElementById('vehiculo_color').value.trim() : null
        };

        if (!datos.sku || !datos.descripcion) {
            mostrarAlerta("SKU y Descripción son obligatorios", "Campos requeridos", "warning");
            return;
        }
        
        const exito = await guardarProductoAPI(datos, id || null);
        if (exito) {
            mostrarAlerta("Producto guardado correctamente", "¡Éxito!", "success");
            formProducto.reset();
            
            if (camposVehiculo) {
                camposVehiculo.classList.add('hidden');
            }

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
    document.getElementById("categoria").value = p.categoria || '';
    document.getElementById("proveedor").value = p.proveedor || '';
    document.getElementById("costo").value = p.costo;
    document.getElementById("precio_neto").value = p.precio_neto;
    document.getElementById("stock").value = p.stock;
    document.getElementById("stock_minimo").value = p.stock_minimo;
    document.getElementById("control_stock").checked = p.control_stock === 1;

    const inputCategoria = document.getElementById('categoria');
    if (inputCategoria) {
        inputCategoria.dispatchEvent(new Event('input'));
    }

    const camposVehiculo = document.getElementById('camposVehiculo');
    
    // CORRECCIÓN PUNTO 4: Comprobación segura de la categoría que ahora sí vendrá poblada
    if (p.categoria && p.categoria.trim().toUpperCase().startsWith('VEHICULO')) {
        if (camposVehiculo) camposVehiculo.classList.remove('hidden');
        
        document.getElementById('vehiculo_tipo').value = p.vehiculo_tipo || '';
        document.getElementById('vehiculo_anio').value = p.vehiculo_anio || '';
        document.getElementById('vehiculo_chasis').value = p.vehiculo_chasis || '';
        document.getElementById('vehiculo_motor').value = p.vehiculo_motor || '';
        document.getElementById('vehiculo_color').value = p.vehiculo_color || '';
    } else {
        if (camposVehiculo) camposVehiculo.classList.add('hidden');
        
        document.getElementById('vehiculo_tipo').value = '';
        document.getElementById('vehiculo_anio').value = '';
        document.getElementById('vehiculo_chasis').value = '';
        document.getElementById('vehiculo_motor').value = '';
        document.getElementById('vehiculo_color').value = '';
    }

    document.getElementById("tituloModalProducto").innerText = "Editar Producto";
    cambiarSeccion('pantallaProducto');
}

// 1. FUNCIÓN PARA ABRIR EL MODAL Y CARGAR LOS DATOS ACTUALES
window.abrirModalEditarUnidad = function(id, chasis, motor, color, anio, patente) {
    // Asignamos los valores actuales del vehículo a los inputs del modal
    document.getElementById('editUnidadId').value = id;
    document.getElementById('editChasis').value = chasis || '';
    document.getElementById('editMotor').value = motor || '';
    document.getElementById('editColor').value = color || '';
    document.getElementById('editAnio').value = anio || '';
    document.getElementById('editPatente').value = patente || '';
    
    // Mostramos el modal quitando la clase 'hidden' de Tailwind
    document.getElementById('modalEditarUnidad').classList.remove('hidden');
};

// 2. FUNCIÓN PARA CERRAR EL MODAL
window.cerrarModalEditarUnidad = function() {
    // Ocultamos el modal agregando la clase 'hidden'
    document.getElementById('modalEditarUnidad').classList.add('hidden');
    // Limpiamos el formulario para la próxima vez
    document.getElementById('formEditarUnidad').reset();
};

// 3. FUNCIÓN PARA GUARDAR LOS CAMBIOS EN EL SERVIDOR (INTEGRADO CON APIFETCH)
window.guardarCambiosUnidad = async function(event) {
    event.preventDefault(); // Evitamos que la página se recargue por el formulario

    // Recuperamos el ID oculto y los nuevos valores escritos por el usuario
    const id = document.getElementById('editUnidadId').value;
    const datosModificados = {
        chasis: document.getElementById('editChasis').value.trim(),
        motor: document.getElementById('editMotor').value.trim(),
        color: document.getElementById('editColor').value.trim(),
        anio: document.getElementById('editAnio').value ? parseInt(document.getElementById('editAnio').value) : null,
        patente: document.getElementById('editPatente').value.trim()
    };

    try {
        // Usamos tu 'apiFetch' apuntando a la subruta de vehículos de tu controlador de productos
        const response = await apiFetch(`${API_URL}/vehiculos/unidades/${id}`, {
            method: 'PUT',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datosModificados)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'No se pudieron guardar los cambios');
        }

        // Usamos tus alertas estéticas del sistema
        mostrarAlerta('¡Datos del vehículo corregidos con éxito!', '¡Éxito!', 'success');
        window.cerrarModalEditarUnidad();
        
        // Refrescamos tu grilla automáticamente usando tu función nativa
        await listarProductos(productosEstado);

    } catch (error) {
        console.error('Error al actualizar:', error);
        mostrarAlerta(error.message, 'Error', 'error');
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
            await listarProductos(productosEstado); // Recarga la tabla automáticamente
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
}

// ==========================================
// CONTROL DEL MODAL DE UNIDADES ADICIONALES
// ==========================================

// Abrir el modal flotante pasando los datos del producto padre
window.abrirModalUnidad = function(id, descripcion) {
    document.getElementById('unidadProductoId').value = id;
    document.getElementById('txtNombreProductoUnidad').innerText = descripcion;
    
    // Reseteamos el formulario para que no queden datos de la carga anterior
    document.getElementById('formNuevaUnidad').reset();
    
    // Quitamos la clase 'hidden' para mostrar el modal
    document.getElementById('modalAgregarUnidad').classList.remove('hidden');
}

// Cerrar el modal flotante
window.cerrarModalUnidad = function() {
    document.getElementById('modalAgregarUnidad').classList.add('hidden');
}

// Escuchar el envío del formulario de la nueva unidad física
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
            // CORRECCIÓN 1 Y 2: Usamos la constante API_URL correcta y agregamos las cabeceras JSON
            const response = await apiFetch(`${API_URL}/agregar-unidad`, {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            // CORRECCIÓN 3: Validamos si el servidor realmente procesó la solicitud
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error desconocido en el servidor");
            }

            // Usamos tu función nativa de alertas estéticas en vez del alert nativo
            mostrarAlerta("¡Unidad física añadida al stock con éxito!", "¡Éxito!", "success");
            window.cerrarModalUnidad();
            
            // Refrescamos la grilla para ver reflejado el nuevo stock en tiempo real
            await listarProductos(productosEstado);
            
        } catch (err) {
            console.error("Error al guardar la unidad:", err);
            mostrarAlerta("Error al guardar la unidad: " + err.message, "Error", "error");
        }
    };
}
// 1. FUNCIÓN GLOBAL PARA ABRIR EL MODAL Y CARGAR LAS UNIDADES DESDE EL BACKEND
window.verUnidadesVehiculo = async function(productoId, descripcionProducto) {
    // Seteamos el nombre del producto en el título del modal
    document.getElementById('nombreProductoModal').innerText = descripcionProducto;
    
    const tbody = document.getElementById('tablaUnidadesFisicasBody');
    const mensajeVacio = document.getElementById('sinUnidadesMensaje');
    tbody.innerHTML = ''; // Limpiamos la tabla anterior
    
    try {
        // Consultamos a tu controlador mediante apiFetch
        // IMPORTANTE: Asegúrate de que en tu archivo de rutas backend del servidor tengas declarado:
        // router.get('/:productoId/unidades', productosController.obtenerUnidadesDisponibles);
        const response = await apiFetch(`${API_URL}/${productoId}/unidades`);
        
        if (!response.ok) throw new Error("No se pudo obtener el listado de unidades.");
        
        const unidades = await response.json();
        
        if (unidades.length === 0) {
            mensajeVacio.classList.remove('hidden');
        } else {
            mensajeVacio.classList.add('hidden');
            
            // Recorremos cada unidad física y creamos su fila en la tabla
            unidades.forEach(unidad => {
                const fila = document.createElement('tr');
                fila.className = "hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors";
                
                fila.innerHTML = `
                    <td class="px-4 py-3 font-mono font-semibold">${unidad.chasis}</td>
                    <td class="px-4 py-3 font-mono">${unidad.motor}</td>
                    <td class="px-4 py-3">${unidad.color || 'S/C'}</td>
                    <td class="px-4 py-3">${unidad.anio || '-'}</td>
                    <td class="px-4 py-3"><span class="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">${unidad.patente || 'S/P'}</span></td>
                    <td class="px-4 py-3 text-center">
                        <button onclick="window.abrirModalEditarUnidad(${unidad.id}, '${unidad.chasis}', '${unidad.motor}', '${unidad.color}', '${unidad.anio}', '${unidad.patente}')" 
                                class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30">
                            ✏️ Editar
                        </button>
                    </td>
                `;
                tbody.appendChild(fila);
            });
        }
        
        // Abrimos el modal quitando la clase hidden
        document.getElementById('modalVerUnidades').classList.remove('hidden');
        
    } catch (error) {
        console.error("Error cargando unidades:", error);
        mostrarAlerta(error.message, "Error", "error");
    }
};

// 2. FUNCIÓN PARA CERRAR EL MODAL
window.cerrarModalVerUnidades = function() {
    document.getElementById('modalVerUnidades').classList.add('hidden');
};

// EXPOSICIÓN GLOBAL PARA HTML
window.prepararEdicionProducto = prepararEdicionProducto;
window.eliminarProducto = eliminarProducto;
window.listarProductos = listarProductos;
