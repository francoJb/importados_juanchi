import { API_BASE_URL } from "./config.js";
import { apiFetch } from "./apiClient.js";
import { mostrarAlerta } from "./ui.js";

let productosParaImportar = [];

export function initImportarProductos() {
    const btnImportar = document.getElementById("btnImportarProductos");
    const modal = document.getElementById("modalImportarProductos");
    const inputArchivo = document.getElementById("archivoImportacion");
    const btnCancelar = document.getElementById("btnCancelarImportacion");
    const btnProcesar = document.getElementById("btnProcesarImportacion");
    const preview = document.getElementById("previewImportacion");
    const progress = document.getElementById("progressImportacion");

    if (!btnImportar) return;

    if (!modal || !inputArchivo || !btnCancelar || !btnProcesar || !preview || !progress) {
        console.error("No se pudo inicializar la importacion: faltan elementos del modal.");
        return;
    }

    const abrirModal = () => {
        modal.classList.remove("hidden");
        setTimeout(() => {
            const content = modal.querySelector(".modal-card");
            if (content) {
                content.classList.remove("scale-95", "opacity-0");
                content.classList.add("scale-100", "opacity-100");
            }
        }, 10);

        inputArchivo.value = "";
        productosParaImportar = [];
        preview.classList.add("hidden");
        progress.classList.add("hidden");
        btnProcesar.disabled = true;

        if (!window.XLSX) {
            mostrarAlerta(
                "La libreria para leer Excel todavia no esta cargada. Revisa tu conexion o recarga la pagina antes de seleccionar el archivo.",
                "Importacion no disponible",
                "warning"
            );
        }
    };

    const cerrarModal = () => {
        const content = modal.querySelector(".modal-card");
        if (content) {
            content.classList.add("scale-95", "opacity-0");
            content.classList.remove("scale-100", "opacity-100");
        }
        setTimeout(() => {
            modal.classList.add("hidden");
        }, 300);
    };

    btnImportar.addEventListener("click", abrirModal);

    btnCancelar.addEventListener("click", cerrarModal);

    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            cerrarModal();
        }
    });

    inputArchivo.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            if (!window.XLSX) {
                throw new Error("La libreria de Excel (XLSX) no esta cargada. Recarga la pagina e intenta de nuevo.");
            }

            const data = await leerArchivoExcel(file);
            if (data && data.length > 0) {
                productosParaImportar = data;
                mostrarPreviewImportacion(data);
                btnProcesar.disabled = false;
            } else {
                mostrarAlerta("El archivo no contiene productos validos.", "Error", "error");
            }
        } catch (error) {
            console.error("Error al procesar archivo:", error);
            mostrarAlerta("Error al procesar el archivo: " + error.message, "Error", "error");
        }
    });

    btnProcesar.addEventListener("click", async () => {
        if (productosParaImportar.length === 0) {
            mostrarAlerta("Selecciona un archivo con productos.", "Error", "error");
            return;
        }

        await procesarImportacion(productosParaImportar);
    });
}

async function leerArchivoExcel(file) {
    return new Promise((resolve, reject) => {
        if (!window.XLSX) {
            reject(new Error("La libreria de Excel (XLSX) no esta cargada. Recarga la pagina e intenta de nuevo."));
            return;
        }

        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = window.XLSX.read(data, { type: "array" });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = window.XLSX.utils.sheet_to_json(worksheet, {
                    defval: "",
                    blankrows: false
                });

                const productosValidos = json
                    .map((row, index) => ({
                        sku: (row.sku || row.SKU || "").toString().trim().toUpperCase(),
                        descripcion: (row.descripcion || row.Descripcion || row.description || "").toString().trim(),
                        marca: (row.marca || row.Marca || "").toString().trim(),
                        modelo: (row.modelo || row.Modelo || "").toString().trim(),
                        proveedor: (row.proveedor || row.Proveedor || "").toString().trim(),
                        categoria: (row.categoria || row.Categoria || "").toString().trim(),
                        costo: parseFloat(row.costo || row.Costo || 0) || 0,
                        precio: parseFloat(row.precio || row.Precio || 0) || 0,
                        iva: parseFloat(row.iva || row.IVA || 21) || 21,
                        stock: parseInt(row.stock || row.Stock || 0, 10) || 0,
                        rowIndex: index + 2
                    }))
                    .filter(p => p.sku && p.descripcion);

                if (productosValidos.length === 0) {
                    reject(new Error('No se encontraron productos validos. Asegurate de que haya columnas "sku" y "descripcion".'));
                    return;
                }

                resolve(productosValidos);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => {
            reject(new Error("Error al leer el archivo"));
        };

        reader.readAsArrayBuffer(file);
    });
}

function mostrarPreviewImportacion(productos) {
    const preview = document.getElementById("previewImportacion");
    const cantidadEl = document.getElementById("cantidadProductosPreview");
    const tabla = document.getElementById("previewTabla");

    cantidadEl.textContent = productos.length;
    tabla.innerHTML = productos
        .slice(0, 10)
        .map(p => `
            <tr class="border-b dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700">
                <td class="border p-2 font-mono text-xs">${p.sku}</td>
                <td class="border p-2 text-xs">${p.descripcion}</td>
                <td class="border p-2 text-xs text-right">$${p.precio.toFixed(2)}</td>
                <td class="border p-2 text-xs text-center">${p.stock}</td>
            </tr>
        `).join("");

    if (productos.length > 10) {
        tabla.innerHTML += `
            <tr class="bg-gray-100 dark:bg-slate-700">
                <td colspan="4" class="border p-2 text-xs text-center font-bold">
                    ... y ${productos.length - 10} mas
                </td>
            </tr>
        `;
    }

    preview.classList.remove("hidden");
}

async function procesarImportacion(productos) {
    const modal = document.getElementById("modalImportarProductos");
    const progress = document.getElementById("progressImportacion");
    const progressBar = document.getElementById("progressBar");
    const progressText = document.getElementById("progressText");
    const btnProcesar = document.getElementById("btnProcesarImportacion");
    const inputArchivo = document.getElementById("archivoImportacion");

    progress.classList.remove("hidden");
    btnProcesar.disabled = true;
    inputArchivo.disabled = true;

    let importados = 0;
    let errores = 0;
    const erroresDetalle = [];

    try {
        for (let i = 0; i < productos.length; i++) {
            const producto = productos[i];
            const porcentaje = Math.round((i / productos.length) * 100);

            progressBar.style.width = porcentaje + "%";
            progressText.textContent = `${i}/${productos.length}`;

            try {
                const response = await apiFetch(`${API_BASE_URL}/api/productos`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
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
                    erroresDetalle.push(`Fila ${producto.rowIndex}: ${error.error || "Error desconocido"}`);
                }
            } catch (error) {
                errores++;
                erroresDetalle.push(`Fila ${producto.rowIndex}: ${error.message}`);
            }

            await new Promise(resolve => setTimeout(resolve, 100));
        }

        progressBar.style.width = "100%";
        progressText.textContent = `${productos.length}/${productos.length}`;

        setTimeout(() => {
            progress.classList.add("hidden");

            const content = modal.querySelector(".modal-card");
            if (content) {
                content.classList.add("scale-95", "opacity-0");
                content.classList.remove("scale-100", "opacity-100");
            }
            setTimeout(() => {
                modal.classList.add("hidden");
            }, 300);

            let mensaje = `Se importaron ${importados} producto${importados !== 1 ? "s" : ""}`;
            let tipo = "success";

            if (errores > 0) {
                mensaje += ` (${errores} error${errores !== 1 ? "es" : ""})`;
                if (errores <= 5) {
                    mensaje += "\n\n" + erroresDetalle.join("\n");
                }
                tipo = errores < importados ? "warning" : "error";
            }

            mostrarAlerta(mensaje, "Importacion completada", tipo);
            window.listarProductos?.();
        }, 500);
    } catch (error) {
        console.error("Error en procesarImportacion:", error);
        progress.classList.add("hidden");
        mostrarAlerta("Error al procesar la importacion: " + error.message, "Error", "error");
    } finally {
        btnProcesar.disabled = false;
        inputArchivo.disabled = false;
    }
}
