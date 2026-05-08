import { dibujarClientes } from "./renderclientes.js";
import { cambiarSeccion } from "./ui.js";
import { API_BASE_URL } from "./config.js";

const API_URL = `${API_BASE_URL}/api/clientes`;

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
            arca: document.getElementById("arca").value.trim()
        };

        if (!datos.nombre || !datos.apellido) {
            alert("⚠️ Nombre y Apellido son obligatorios");
            return;
        }
        
        const exito = await guardarClienteAPI(datos, id || null);
        if (exito) {
            alert("✅ Cliente guardado correctamente");
            formCliente.reset();

            await listarClientes(); // Recarga la tabla de clientes

            if (typeof window.cargarDatosParaVenta === "function") {
                await window.cargarDatosParaVenta(); // Recarga el select de clientes en ventas
            }

            cambiarSeccion('seccionClientes');
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
    // Abrimos el modal
    cambiarSeccion('pantallaCliente');
};

export async function eliminarCliente(id, nombre){
    // 1. El cartel de confirmación
    const rta = confirm(`¿Estás seguro de que querés eliminar a "${nombre}"?, esa accion solo desactivara el cliente`);
    if (rta) {
        try {
            // 2. Avisamos al Backend (Controller) que cambie el estado a 0
           const response = await fetch(`${API_BASE_URL}/api/clientes/${id}`, {
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

export async function cargarDatosBalance(clienteId) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/clientes/${clienteId}/cuenta-corriente`);
        const data = await res.json();
        window.balanceClienteMovimientos = data.movimientos || [];
        window.balanceClienteSaldoTotal = data.saldoTotal || 0;

        document.getElementById("ba-saldo-total").innerText = `$${parseFloat(data.saldoTotal).toFixed(2)}`;
        const totalPagado = data.movimientos.reduce((sum, m) => sum + parseFloat(m.haber), 0);
        document.getElementById("ba-total-pagos").innerText = `$${totalPagado.toFixed(2)}`;

        const body = document.getElementById("ba-tabla-body");
        body.innerHTML = data.movimientos.map(m => `
            <tr class="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors text-sm">
                <td class="p-3 md:p-4 text-gray-500 whitespace-nowrap">${new Date(m.fecha).toLocaleString('es-AR')}</td>
                <td class="p-3 md:p-4">
                    <span class="font-bold dark:text-white">${m.descripcion}</span>
                    ${m.observaciones ? `<br><span class="text-[11px] text-slate-500 italic">${m.observaciones}</span>` : ''}
                    ${m.venta_id ? `<br><span class="text-[10px] text-blue-500 font-mono italic">REF: Venta #${m.venta_id}</span>` : ''}
                </td>
                <td class="p-3 md:p-4 text-right font-mono text-red-500 whitespace-nowrap">${m.debe > 0 ? `+$${parseFloat(m.debe).toFixed(2)}` : '-'}</td>
                <td class="p-3 md:p-4 text-right font-mono text-green-500 whitespace-nowrap">${m.haber > 0 ? `-$${parseFloat(m.haber).toFixed(2)}` : '-'}</td>
                <td class="p-3 md:p-4 text-right font-black font-mono dark:text-white bg-blue-50/30 dark:bg-blue-900/10 whitespace-nowrap">$${parseFloat(m.saldo_acumulado).toFixed(2)}</td>
                <td class="p-3 md:p-4 text-center">
                    ${m.haber > 0 && m.venta_id ? `<button onclick="imprimirReciboPagoMov(${m.venta_id}, ${parseFloat(m.haber)}, ${parseFloat(m.saldo_acumulado)}, '${encodeURIComponent(m.observaciones || "")}')" class="hover:scale-150 transition-transform" title="Imprimir Recibo">🖨️</button>` : '-'}
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error("Error al cargar balance:", error);
    }
}

// 1. Función que dispara el botón "Balance" desde la tabla de clientes
export async function irABalanceCliente(id, nombre, apellido) {
    // Guardamos el cliente actual para usar desde la pantalla de balance
    window.currentBalanceClienteId = id;
    window.currentBalanceClienteNombre = `${nombre} ${apellido}`;

    // Ocultamos Clientes (Asegurate que este ID coincida con tu div de clientes)
    document.getElementById("seccionClientes").classList.add("hidden");
    
    // Mostramos Balance
    const pantallaBalance = document.getElementById("pantalla-balance-cliente");
    pantallaBalance.classList.remove("hidden");

    // Actualizamos el nombre en la cabecera
    document.getElementById("ba-nombre-cliente").innerText = `Balance: ${nombre} ${apellido}`;

    // Cargamos los datos reales
    await cargarDatosBalance(id);
};

export async function abrirBuscadorClientes() {
    const clientes = await fetchClientes(); // Trae los clientes de la DB
    const modal = document.getElementById("modalBuscadorClientes");
    const tbody = document.getElementById("tablaBuscadorClientes");
    tbody.innerHTML = clientes.map(c => `
        <tr class="border-b dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
            <td class="p-3">${c.nombre}</td>
            <td class="p-3">${c.apellido}</td>
            <td class="p-3">${c.direccion}</td>
            <td class="p-3 text-right">${c.dni}</td>
            <td class="p-3 text-right">${c.cuit}</td>
            <td class="p-3 text-center">
                <button onclick="seleccionarClienteDesdeModal('${c.id}')" 
                    class="bg-gradient-to-r from-cyan-500 to-teal-400 font-bold py-1 px-5 rounded-xl shadow-lg">
                    Seleccionar
                </button>
        </td>
        </tr>
    `).join('');
    modal.classList.remove("hidden");
    document.getElementById("inputFiltroClientes").focus();
};

export async function cerrarBuscadorClientes() {
    document.getElementById("modalBuscadorClientes").classList.add("hidden");
};

export async function filtrarClientesModal() {
    const texto = document.getElementById("inputFiltroClientes").value.toLowerCase();
    const filas = document.querySelectorAll("#tablaBuscadorClientes tr");

    filas.forEach(fila => {
        const contenido = fila.textContent.toLowerCase();
        fila.style.display = contenido.includes(texto) ? "" : "none";
    });
};

export async function seleccionarClienteDesdeModal(id) {
    // 1. Buscamos el select de clientes en la pantalla de venta
    const selectC = document.getElementById("v-cliente-select");
    if (!selectC) return;

    // 2. Buscamos si el cliente ya existe como opción dentro del select
    let optionExistente = selectC.querySelector(`option[value="${id}"]`);

    // 3. Si no existe, lo buscamos en la base y lo agregamos al select
    if (!optionExistente) {
        const clientes = await fetchClientes();
        const cliente = clientes.find(c => String(c.id) === String(id));

        if (cliente) {
            const nuevaOption = document.createElement("option");
            nuevaOption.value = cliente.id;
            nuevaOption.textContent = `${cliente.nombre} ${cliente.apellido}`;
            selectC.appendChild(nuevaOption);
        }
    }

    // 4. Ahora sí seleccionamos el cliente
    selectC.value = id;

    // 5. Cerramos el buscador
    cerrarBuscadorClientes();
};

export async function initClientes() {
    // 1. Cargar y mostrar clientes
    await listarClientes();
    
    // 2. Configurar el formulario
    configurarFormularioCliente();
    
    // 3. Configurar buscador
    configurarBuscadorClientes();
    
    // 4. Botones abrir/cerrar modal de cliente
    const btnAbrirModalCliente = document.getElementById("btnAbrirModalCliente");
    if (btnAbrirModalCliente) {
        btnAbrirModalCliente.onclick = () => {
            document.getElementById("formCliente").reset();
            document.getElementById("formClienteId").value = "";
            cambiarSeccion("pantallaCliente");
        };
    }

    const btnCerrarModalCliente = document.getElementById("btnCerrarModalCliente");
    if (btnCerrarModalCliente) {
        btnCerrarModalCliente.onclick = () => cambiarSeccion("seccionClientes");
    }

    document.addEventListener("click", (ec) => {
        const btn = ec.target.closest(".btn-eliminarCli");
        if (!btn) return;
        const id = btn.dataset.id;
        const desc = btn.dataset.desc;
        eliminarCliente(id, desc);
    });
    
    console.log("✅ Módulo de Clientes inicializado");
}

function movimientoEstaEnRango(movimiento, fechaDesde, fechaHasta) {
    const fechaMovimiento = new Date(movimiento.fecha);

    if (fechaDesde) {
        const desde = new Date(`${fechaDesde}T00:00:00`);
        if (fechaMovimiento < desde) return false;
    }

    if (fechaHasta) {
        const hasta = new Date(`${fechaHasta}T23:59:59`);
        if (fechaMovimiento > hasta) return false;
    }

    return true;
}

function abrirPreviewBalancePDF(doc, nombreArchivo = "balance-cliente.pdf") {
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);

    const win = window.open(url, "_blank");
    if (!win) {
        alert("⚠️ El navegador bloqueó la ventana emergente. Permití popups para este sitio.");
        return;
    }

    win.addEventListener("load", () => {
        win.document.title = nombreArchivo;
    });

    setTimeout(() => URL.revokeObjectURL(url), 60000);
}

window.imprimirBalanceClientePDF = () => {
    const movimientos = window.balanceClienteMovimientos || [];
    const nombreCliente = window.currentBalanceClienteNombre || "Cliente";
    const fechaDesde = document.getElementById("ba-fecha-desde")?.value;
    const fechaHasta = document.getElementById("ba-fecha-hasta")?.value;

    if (movimientos.length === 0) {
        alert("No hay movimientos para imprimir.");
        return;
    }

    if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
        alert("La fecha desde no puede ser mayor que la fecha hasta.");
        return;
    }

    const movimientosFiltrados = movimientos
    .filter((movimiento) => movimientoEstaEnRango(movimiento, fechaDesde, fechaHasta))
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    if (movimientosFiltrados.length === 0) {
        alert("No hay movimientos en el rango de fechas seleccionado.");
        return;
    }

    const totalDebe = movimientosFiltrados.reduce((sum, movimiento) => {
        return sum + Number(movimiento.debe || 0);
    }, 0);

    const totalHaber = movimientosFiltrados.reduce((sum, movimiento) => {
        return sum + Number(movimiento.haber || 0);
    }, 0);

    const saldoFinal = Number(movimientosFiltrados[movimientosFiltrados.length - 1].saldo_acumulado || 0);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("landscape");
    
    if (typeof doc.autoTable !== "function") {
        alert("No se pudo cargar el generador de tablas PDF. Revisá la conexión a internet o el script de AutoTable.");
        return;
    }

    const pageWidth = doc.internal.pageSize.getWidth();
    const fechaEmision = new Date().toLocaleString("es-AR");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Balance de Cliente", 14, 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Cliente: ${nombreCliente}`, 14, 24);
    doc.text(`Emitido: ${fechaEmision}`, pageWidth - 14, 24, { align: "right" });

    const textoRango = fechaDesde || fechaHasta
        ? `Período: ${fechaDesde || "Inicio"} al ${fechaHasta || "Hoy"}`
        : "Período: Todos los movimientos";

    doc.text(textoRango, 14, 31);
    
    doc.autoTable({
        startY: 38,
        head: [[
            "Fecha / Hora",
            "Concepto",
            "Debe (+)",
            "Haber (-)",
            "Saldo acumulado",
            "Recibo"
        ]],
        body: movimientosFiltrados.map((movimiento) => [
            new Date(movimiento.fecha).toLocaleString("es-AR"),
            movimiento.observaciones
            ? `${movimiento.descripcion || "-"}\nObs: ${movimiento.observaciones}`
            : movimiento.descripcion || "-",
            Number(movimiento.debe || 0) > 0 ? `$${Number(movimiento.debe).toFixed(2)}` : "-",
            Number(movimiento.haber || 0) > 0 ? `$${Number(movimiento.haber).toFixed(2)}` : "-",
            `$${Number(movimiento.saldo_acumulado || 0).toFixed(2)}`,
            movimiento.haber > 0 && movimiento.venta_id ? `Venta #${movimiento.venta_id}` : "-"
        ]),
        styles: {
            fontSize: 8,
            cellPadding: 2
        },
        headStyles: {
            fillColor: [0, 168, 168],
            textColor: 255
        },
        columnStyles: {
            2: { halign: "right" },
            3: { halign: "right" },
            4: { halign: "right" },
            5: { halign: "center" }
        },
        margin: { left: 14, right: 14 }
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`Total Debe: $${totalDebe.toFixed(2)}`, 14, finalY);
    doc.text(`Total Haber: $${totalHaber.toFixed(2)}`, 90, finalY);
    doc.text(`Saldo final del período: $${saldoFinal.toFixed(2)}`, 170, finalY);

    abrirPreviewBalancePDF(doc, `Balance_${nombreCliente.replaceAll(" ", "_")}.pdf`);
};

window.prepararEdicionCliente = prepararEdicionCliente;
window.eliminarCliente = eliminarCliente;
window.listarClientes = listarClientes;
window.irABalanceCliente = irABalanceCliente;
window.abrirBuscadorClientes = abrirBuscadorClientes;
window.cerrarBuscadorClientes = cerrarBuscadorClientes;
window.filtrarClientesModal = filtrarClientesModal;
window.seleccionarClienteDesdeModal = seleccionarClienteDesdeModal;