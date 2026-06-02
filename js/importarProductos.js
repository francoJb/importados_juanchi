import { API_BASE_URL } from "./config.js";
import { apiFetch } from "./apiClient.js";
import { mostrarAlerta } from "./ui.js";

let productosParaImportar = [];

// Esperar a que XLSX esté disponible
function esperarXLSX() {
    return new Promise((resolve) => {
        const intentos = () => {
            if (window.XLSX) {
                resolve();
            } else {
                setTimeout(intentos, 100);
            }
        };
        intentos();
    });
}

export async function initImportarProductos() {
    // Esperar a que XLSX esté disponible
    await esperarXLSX();

    const btnImportar = document.getElementById('btnImportarProductos');
    const modal = document.getElementById('modalImportarProductos');
    const inputArchivo = document.getElementById('archivoImportacion');
    const btnCancelar = document.getElementById('btnCancelarImportacion');
    const btnProcesar = document.getElementById('btnProcesarImportacion');

    if (!btnImportar) return;

    // Verificar que SheetJS esté disponible
    if (!window.XLSX) {
        console.error('SheetJS no está disponible. Verifica que se haya cargado correctamente.');
        btnImportar.disabled = true;
        return;
    }

    const abrirModal = () => {
        modal.classList.remove('hidden');
        // Agregar animación
        setTimeout(() => {
            const content = modal.querySelector('.modal-card');
            if (content) {
                content.classList.remove('scale-95', 'opacity-0');
                content.classList.add('scale-100', 'opacity-100');
            }
        }, 10);
        inputArchivo.value = '';
        productosParaImportar = [];
        document.getElementById('previewImportacion').classList.add('hidden');
        document.getElementById('progressImportacion').classList.add('hidden');
        btnProcesar.disabled = true;
    };

    const cerrarModal = () => {
        const content = modal.querySelector('.modal-card');
        if (content) {
            content.classList.add('scale-95', 'opacity-0');
            content.classList.remove('scale-100', 'opacity-100');
        }
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    };

    // Abrir modal
    btnImportar.addEventListener('click', abrirModal);

    // Cerrar modal
    btnCancelar.addEventListener('click', cerrarModal);
    
    // Cerrar modal al hacer click fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            cerrarModal();
        }
    });

    // Procesar archivo
    inputArchivo.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const data = await leerArchivoExcel(file);
            if (data && data.length > 0) {
                productosParaImportar = data;
                mostrarPreviewImportacion(data);
                btnProcesar.disabled = false;
            } else {
                mostrarAlerta('El archivo no contiene productos válidos.', 'Error', 'error');
            }
        } catch (error) {
            console.error('Error al procesar archivo:', error);
            mostrarAlerta('Error al procesar el archivo: ' + error.message, 'Error', 'error');
        }
    });

    // Procesar importación
    btnProcesar.addEventListener('click', async () => {
        if (productosParaImportar.length === 0) {
            mostrarAlerta('Selecciona un archivo con productos.', 'Error', 'error');
            return;
        }

        await procesarImportacion(productosParaImportar);
    });
}

async function leerArchivoExcel(file) {
    return new Promise((resolve, reject) => {
        // Verificar que XLSX esté disponible
        if (!window.XLSX) {
            reject(new Error('La librería de Excel (XLSX) no está cargada. Recarga la página e intenta de nuevo.'));
            return;
        }

        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = window.XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = window.XLSX.utils.sheet_to_json(worksheet, {
                    defval: '',
                    blankrows: false
                });

                // Normalizar y validar datos
                const productosValidos = json
                    .map((row, index) => ({
                        sku: (row.sku || row.SKU || '').toString().trim().toUpperCase(),
                        descripcion: (row.descripcion || row.Descripcion || row.description || '').toString().trim(),
                        marca: (row.marca || row.Marca || '').toString().trim(),
                        modelo: (row.modelo || row.Modelo || '').toString().trim(),
                        proveedor: (row.proveedor || row.Proveedor || '').toString().trim(),
                        categoria: (row.categoria || row.Categoria || '').toString().trim(),
                        costo: parseFloat(row.costo || row.Costo || 0) || 0,
                        precio: parseFloat(row.precio || row.Precio || 0) || 0,
                        iva: parseFloat(row.iva || row.IVA || 21) || 21,
                        stock: parseInt(row.stock || row.Stock || 0) || 0,
                        rowIndex: index + 2 // Para referencia de fila en el Excel
                    }))
                    .filter(p => p.sku && p.descripcion); // Validar que tenga SKU y descripción

                if (productosValidos.length === 0) {
                    reject(new Error('No se encontraron productos válidos. Asegúrate de que haya columnas "sku" y "descripcion".'));
                    return;
                }

                resolve(productosValidos);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => {
            reject(new Error('Error al leer el archivo'));
        };

        reader.readAsArrayBuffer(file);
    });
}

function mostrarPreviewImportacion(productos) {
    const preview = document.getElementById('previewImportacion');
    const cantidadEl = document.getElementById('cantidadProductosPreview');
    const tabla = document.getElementById('previewTabla');

    cantidadEl.textContent = productos.length;
    tabla.innerHTML = productos
        .slice(0, 10) // Mostrar solo los primeros 10
        .map(p => `
            <tr class="border-b dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700">
                <td class="border p-2 font-mono text-xs">${p.sku}</td>
                <td class="border p-2 text-xs">${p.descripcion}</td>
                <td class="border p-2 text-xs text-right">$${p.precio.toFixed(2)}</td>
                <td class="border p-2 text-xs text-center">${p.stock}</td>
            </tr>
        `).join('');

    if (productos.length > 10) {
        tabla.innerHTML += `
            <tr class="bg-gray-100 dark:bg-slate-700">
                <td colspan="4" class="border p-2 text-xs text-center font-bold">
                    ... y ${productos.length - 10} más
                </td>
            </tr>
        `;
    }

    preview.classList.remove('hidden');
}

async function procesarImportacion(productos) {
    const modal = document.getElementById('modalImportarProductos');
    const progress = document.getElementById('progressImportacion');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const btnProcesar = document.getElementById('btnProcesarImportacion');
    const inputArchivo = document.getElementById('archivoImportacion');

    progress.classList.remove('hidden');
    btnProcesar.disabled = true;
    inputArchivo.disabled = true;

    let importados = 0;
    let errores = 0;
    const erroresDetalle = [];

    try {
        for (let i = 0; i < productos.length; i++) {
            const producto = productos[i];
            const porcentaje = Math.round((i / productos.length) * 100);

            progressBar.style.width = porcentaje + '%';
            progressText.textContent = `${i}/${productos.length}`;

            try {
                const response = await apiFetch(`${API_BASE_URL}/api/productos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sku: producto.sku,
                        descripcion: producto.descripcion,
                        marca: producto.marca,
                        modelo: producto.modelo,
                        proveedor: producto.proveedor,
                        categoria: producto.categoria,
                        costo: producto.costo,
                        precio_neto: producto.precio,
                        iva: producto.iva,
                        stock: producto.stock,
                        control_stock: producto.stock > 0 ? 1 : 0
                    })
                });

                if (response.ok) {
                    importados++;
                } else {
                    const error = await response.json();
                    errores++;
                    erroresDetalle.push(`Fila ${producto.rowIndex}: ${error.error || 'Error desconocido'}`);
                }
            } catch (error) {
                errores++;
                erroresDetalle.push(`Fila ${producto.rowIndex}: ${error.message}`);
            }

            // Pequeña pausa para no sobrecargar el servidor
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Finalizar
        progressBar.style.width = '100%';
        progressText.textContent = `${productos.length}/${productos.length}`;

        // Mostrar resultado
        setTimeout(() => {
            progress.classList.add('hidden');
            
            const content = modal.querySelector('.modal-card');
            if (content) {
                content.classList.add('scale-95', 'opacity-0');
                content.classList.remove('scale-100', 'opacity-100');
            }
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);

            let mensaje = `Se importaron ${importados} producto${importados !== 1 ? 's' : ''}`;
            let tipo = 'success';

            if (errores > 0) {
                mensaje += ` (${errores} error${errores !== 1 ? 'es' : ''})`;
                if (errores <= 5) {
                    mensaje += '\n\n' + erroresDetalle.join('\n');
                }
                tipo = errores < importados ? 'warning' : 'error';
            }

            mostrarAlerta(mensaje, 'Importación completada', tipo);

            // Recargar productos
            window.listarProductos?.();
        }, 500);
    } catch (error) {
        console.error('Error en procesarImportacion:', error);
        progress.classList.add('hidden');
        mostrarAlerta('Error al procesar la importación: ' + error.message, 'Error', 'error');
    } finally {
        btnProcesar.disabled = false;
        inputArchivo.disabled = false;
    }
}
