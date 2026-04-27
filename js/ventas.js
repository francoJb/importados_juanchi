import { fetchClientes, cargarDatosBalance } from "./clientes.js";
import { fetchProductos } from "./productos.js";
import { actualizarTablaVenta, renderTablaVentas } from "./renderventas.js";
import { cambiarSeccion } from "./ui.js";
import { load } from "./storage.js";

const URL_API = "http://localhost:3000/api/ventas";

// Datos del vendedor por defecto
const DATOS_VENDEDOR = {
    razonSocial: "JR Import S.A.",
    nombreFantasia: "JR Import",
    domicilio: "Calle Ficticia 123, Ciudad Autónoma de Buenos Aires",
    cuit: "30-12345678-9"
};

function obtenerDatosEmpresa() {
    const config = load("empresaConfig");
    if (!config || Array.isArray(config)) {
        return DATOS_VENDEDOR;
    }
    return {
        razonSocial: config.razonSocial || DATOS_VENDEDOR.razonSocial,
        nombreFantasia: config.nombreFantasia || DATOS_VENDEDOR.nombreFantasia,
        domicilio: config.domicilio || DATOS_VENDEDOR.domicilio,
        cuit: config.cuit || DATOS_VENDEDOR.cuit
    };
}

let carritoVenta = [];
let productosVenta = [];

export async function enviarVentaAlServidor(datos) {
    const response = await fetch(URL_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
    return await response.json();
}

async function cargarDatosParaVenta() {
    try {
        const [clientes, productos] = await Promise.all([
            fetchClientes(),
            fetchProductos()
        ]);

        const selectC = document.getElementById("v-cliente-select");
        if (selectC) {
            selectC.innerHTML = '<option value="0" class="text-blue-600">Consumidor Final</option>';
            clientes.forEach(c => {
                selectC.innerHTML += `<option value="${c.id}">${c.nombre} ${c.apellido}</option>`;
            });
        }

        productosVenta = productos;
        window.productosVenta = productos;

        console.log("✅ Datos para venta cargados correctamente");
    } catch (error) {
        console.error("❌ Error al cargar datos para la venta:", error);
    }
}

function setSkuFocus() {
    const inputSku = document.getElementById("v-sku-directo");
    if (inputSku) {
        inputSku.value = "";
        inputSku.focus();
    } else {
        console.warn("No se encontró 'v-sku-directo'. Asegúrate de que el input de SKU tenga ese ID.");
    }
}

function addPagoEntregaListener() {
    document.getElementById("pago-entrega")?.addEventListener("input", calcularSaldoCtaCte);
}

window.volverALista = () => {
    if (carritoVenta.length > 0) {
        const confirmar = confirm("⚠️ Tenés productos cargados. ¿Seguro que querés cancelar la venta y volver?");
        if (!confirmar) return;
    }
    carritoVenta = [];
    actualizarTablaVenta(carritoVenta);
    cambiarSeccion('seccionVentas');
};

window.cargarDatosParaVenta = cargarDatosParaVenta;

window.checkEnterVenta = async (e) => {
    if (e.key === 'Enter' || e.keyCode === 13) {
        const skuIngresado = e.target.value.trim().toUpperCase();
        if (!skuIngresado) return;

        const productos = await fetchProductos();
        const p = productos.find(item => item.sku.toUpperCase() === skuIngresado);

        if (p) {
            const nuevoItem = {
                id: p.id,
                sku: p.sku,
                desc: p.descripcion,
                precio: parseFloat(p.precio_neto),
                cantidad: 1,
                subtotal: parseFloat(p.precio_neto)
            };

            carritoVenta.push(nuevoItem);
            actualizarTablaVenta(carritoVenta);
            e.target.value = "";
            console.log("Producto cargado con éxito vía SKU");
        } else {
            alert("⚠️ El SKU no existe. Abriendo buscador avanzado...");
            abrirBuscadorProductos();
            document.getElementById("inputFiltroProductos").value = skuIngresado;
            filtrarProductosModal();
        }
    }
};

window.abrirBuscadorProductos = async () => {
    const productos = await fetchProductos();
    const modal = document.getElementById("modalBuscadorProductos");
    const tbody = document.getElementById("tablaBuscadorProductos");

    tbody.innerHTML = productos.map(p => `
        <tr class="border-b dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
            <td class="p-3">${p.sku}</td>
            <td class="p-3">${p.descripcion}</td>
            <td class="p-3">${p.marca}</td>
            <td class="p-3 text-right ${p.stock <= p.stock_minimo ? 'text-red-500 font-bold' : ''}">${p.stock}</td>
            <td class="p-3 text-right">${p.precio_neto}</td>
            <td class="p-3 text-center">
                <button onclick="seleccionarProductoDesdeModal('${p.sku}')" 
                    class="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-1 px-5 rounded-xl shadow-lg">
                    Seleccionar
                </button>
            </td>
        </tr>
    `).join('');

    modal.classList.remove("hidden");
    document.getElementById("inputFiltroProductos").focus();
};

window.seleccionarProductoDesdeModal = async (sku) => {
    const productos = await fetchProductos();
    const p = productos.find(item => item.sku === sku);

    if (p) {
        const nuevoItem = {
            id: p.id,
            sku: p.sku,
            desc: p.descripcion,
            precio: parseFloat(p.precio_neto),
            cantidad: 1,
            subtotal: parseFloat(p.precio_neto)
        };

        carritoVenta.push(nuevoItem);
        actualizarTablaVenta(carritoVenta);
        cerrarBuscadorProductos();
    }
};

window.filtrarProductosModal = () => {
    const texto = document.getElementById("inputFiltroProductos").value.toLowerCase();
    const filas = document.querySelectorAll("#tablaBuscadorProductos tr");

    filas.forEach(fila => {
        const contenido = fila.textContent.toLowerCase();
        fila.style.display = contenido.includes(texto) ? "" : "none";
    });
};

window.cerrarBuscadorProductos = () => {
    document.getElementById("modalBuscadorProductos").classList.add("hidden");
};

window.agregarItemVenta = () => {
    const select = document.getElementById("v-producto-select");
    if (!select || !select.value) return;

    const opt = select.options[select.selectedIndex];
    const item = {
        id: select.value,
        sku: opt.dataset.sku,
        desc: opt.dataset.desc,
        precio: parseFloat(opt.dataset.precio),
        cantidad: 1,
    };
    item.subtotal = item.precio * item.cantidad;

    carritoVenta.push(item);
    actualizarTablaVenta(carritoVenta);
    select.value = "";
};

window.quitarItemVenta = (index) => {
    carritoVenta.splice(index, 1);
    actualizarTablaVenta(carritoVenta);
    console.log("Producto eliminado del carrito local");
};

window.cambiarCantidad = (index, nuevaCantidad) => {
    const cant = parseInt(nuevaCantidad);
    if (cant > 0) {
        carritoVenta[index].cantidad = cant;
        carritoVenta[index].subtotal = carritoVenta[index].precio * cant;
        actualizarTablaVenta(carritoVenta);
    }
};

window.abrirModalPago = () => {
    if (carritoVenta.length === 0) return alert("⚠️ No hay productos cargados.");
    const total = carritoVenta.reduce((sum, i) => sum + i.subtotal, 0);
    const idCliente = document.getElementById("v-cliente-select").value;
    document.getElementById("pago-total-monto").innerText = `$${total.toFixed(2)}`;
    document.getElementById("pago-entrega").value = 0;

    const optCtaCte = document.getElementById("opt-cta-cte");
    const selectMetodo = document.getElementById("pago-metodo");
    if (idCliente == 0) {
        optCtaCte.disabled = true;
        optCtaCte.innerText = "Cuenta Corriente (Solo clientes reg.)";
        selectMetodo.value = "Efectivo";
    } else {
        optCtaCte.disabled = false;
        optCtaCte.innerText = "Cuenta Corriente";
    }
    toggleCamposCtaCte();

    document.getElementById("modalPago").classList.remove("hidden");
};

window.toggleCamposCtaCte = () => {
    const metodo = document.getElementById("pago-metodo").value;
    const divCtaCte = document.getElementById("campos-ctacte");
    if (metodo === "Cuenta Corriente") {
        divCtaCte.classList.remove("hidden");
        calcularSaldoCtaCte();
    } else {
        divCtaCte.classList.add("hidden");
    }
};

window.calcularSaldoCtaCte = () => {
    const total = carritoVenta.reduce((sum, i) => sum + i.subtotal, 0);
    const entrega = parseFloat(document.getElementById("pago-entrega").value) || 0;
    const saldo = total - entrega;
    document.getElementById("pago-saldo-final").innerText = `$${saldo.toFixed(2)}`;
};

window.procesarVentaFinal = async () => {
    const btnConfirmar = document.getElementById("btn-confirmar-final");
    const idCliente = parseInt(document.getElementById("v-cliente-select").value);
    const metodoPago = document.getElementById("pago-metodo").value;
    const entregaInicial = parseFloat(document.getElementById("pago-entrega").value) || 0;
    const observaciones = document.getElementById("v-observaciones").value;

    const totalVenta = carritoVenta.reduce((sum, i) => sum + i.subtotal, 0);

    if (carritoVenta.length === 0) return alert("El carrito está vacío.");
    if (metodoPago === "Cuenta Corriente" && idCliente === 0) {
        return alert("Error: No se puede fiar a un Consumidor Final.");
    }

    btnConfirmar.disabled = true;
    btnConfirmar.innerText = "Procesando...";

    const datosVenta = {
        cliente_id: idCliente,
        total: totalVenta,
        metodo_pago: metodoPago,
        entrega_inicial: entregaInicial,
        observaciones: observaciones,
        items: carritoVenta.map(item => ({
            id: item.id,
            cantidad: item.cantidad,
            precio: item.precio
        }))
    };

    try {
        const respuesta = await fetch(URL_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datosVenta)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            alert("✅ Venta realizada con éxito.");
            const ventaSimulada = { id: resultado.ventaId, fecha: new Date(), cliente_id: idCliente, total: totalVenta, observaciones: observaciones };
            const detallesSimulados = carritoVenta.map(item => ({ sku: item.sku, descripcion: item.desc, precio_unitario: item.precio, cantidad: item.cantidad }));
            await generarFacturaPDFExistente(ventaSimulada, detallesSimulados);
            cerrarModalPago();
            cambiarSeccion('seccionVentas');
            listarVentas();
        } else {
            throw new Error(resultado.error || "Error desconocido al guardar.");
        }
    } catch (error) {
        alert("❌ Error al procesar venta: " + error.message);
    } finally {
        btnConfirmar.disabled = false;
        btnConfirmar.innerText = "Confirmar Venta";
    }
};

window.cerrarModalPago = () => document.getElementById("modalPago").classList.add("hidden");

async function cargarDatosVenta(id) {
    const resVenta = await fetch(`${URL_API}/${id}`);
    const venta = await resVenta.json();
    const resDetalle = await fetch(`${URL_API}/${id}/detalle`);
    const detalles = await resDetalle.json();
    window.ventaActual = venta;
    window.detallesActual = detalles;
    return { venta, detalles };
}

window.verDetalleVenta = async (id) => {
    const { venta, detalles } = await cargarDatosVenta(id);

    if (!venta) return alert("Venta no encontrada");

    document.getElementById("md-titulo").innerText = `Detalle de Venta #${venta.id}`;
    document.getElementById("md-fecha").innerText = new Date(venta.fecha).toLocaleString('es-AR');
    document.getElementById("md-cliente").innerText = venta.cliente_nombre ? `${venta.cliente_nombre} ${venta.cliente_apellido}` : "Consumidor Final";
    document.getElementById("md-total-final").innerText = `$${parseFloat(venta.total).toFixed(2)}`;
    document.getElementById("md-pendiente").innerText = `$${parseFloat(venta.saldo_pendiente).toFixed(2)}`;
    document.getElementById("md-observaciones").innerText = venta.observaciones || "Sin observaciones.";

    const saldo = parseFloat(venta.saldo_pendiente);
    const contenedorEstado = document.getElementById("md-estado");
    const txtPendiente = document.getElementById("md-pendiente");
    if (saldo > 0) {
        txtPendiente.classList.add("text-red-600", "animate-pulse");
    } else {
        txtPendiente.classList.remove("text-red-600", "animate-pulse");
        txtPendiente.classList.add("text-gray-400");
    }

    const btnCobrar = document.getElementById("btn-md-cobrar");
    if (saldo > 0) {
        btnCobrar.classList.remove("hidden");
        const idDelCliente = venta.cliente_id;
        btnCobrar.onclick = () => {
            cambiarSeccion('seccionVentas');
            abrirPantallaCobranza(venta.id, idDelCliente, saldo);
        };
    } else {
        btnCobrar.classList.add("hidden");
    }

    cambiarSeccion('pantalla-detalle-venta');

    if (saldo <= 0) {
        contenedorEstado.innerHTML = `
            <div class="flex flex-col items-center">
                <span class="px-4 py-1 bg-green-500 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-sm">
                    FINALIZADA
                </span>
                <span class="text-[10px] text-green-600 mt-1 font-bold">Cobro Total</span>
            </div>`;
    } else if (saldo < parseFloat(venta.total)) {
        contenedorEstado.innerHTML = `
            <div class="flex flex-col items-center">
                <span class="px-4 py-1 bg-orange-500 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-sm">
                    PAGO PARCIAL
                </span>
                <span class="text-[10px] text-orange-600 mt-1 font-bold">Pendiente de Cobro</span>
            </div>`;
    } else {
        contenedorEstado.innerHTML = `
            <div class="flex flex-col items-center">
                <span class="px-4 py-1 bg-red-500 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-sm">
                    PENDIENTE
                </span>
                <span class="text-[10px] text-red-600 mt-1 font-bold">Cuenta Corriente</span>
            </div>`;
    }

    const body = document.getElementById("md-items-body");
    body.innerHTML = detalles.map(d => `
        <tr class="text-sm">
            <td class="py-4 font-mono text-gray-500">${d.sku}</td>
            <td class="py-4 font-medium dark:text-white">${d.descripcion}</td>
            <td class="py-4 text-right font-mono">$${parseFloat(d.precio_unitario).toFixed(2)}</td>
            <td class="py-4 text-center font-bold text-blue-600">x${d.cantidad}</td>
            <td class="py-4 text-right font-black dark:text-white font-mono">$${(d.cantidad * d.precio_unitario).toFixed(2)}</td>
        </tr>
    `).join('');
};

// 1. Variables para guardar temporalmente los datos de la venta activa
let ventaIdActual = null;
let saldoActual = 0;

let clienteIdActualCobranza = null;
let ventasPendientesModal = [];
let ventasSeleccionadasModal = new Set();

function formatearMoneda(valor) {
    return `$${parseFloat(valor || 0).toFixed(2)}`;
}

function obtenerTotalSeleccionadoModal() {
    return ventasPendientesModal
        .filter(v => ventasSeleccionadasModal.has(v.id))
        .reduce((acc, v) => acc + parseFloat(v.saldo_pendiente || 0), 0);
}

function actualizarResumenPagoModal() {
    const totalSeleccionado = obtenerTotalSeleccionadoModal();
    const montoInput = document.getElementById('modalPago-monto');
    const saldoEl = document.getElementById('modalPago-saldo');
    const totalEl = document.getElementById('modalPago-totalSeleccionado');
    const monto = parseFloat(montoInput.value) || 0;
    const saldo = totalSeleccionado - monto;

    totalEl.textContent = formatearMoneda(totalSeleccionado);
    saldoEl.textContent = formatearMoneda(saldo);
    saldoEl.classList.toggle("text-red-600", saldo > 0);
    saldoEl.classList.toggle("text-green-600", saldo <= 0);
}

function renderVentasPendientesModal() {
    const tbody = document.getElementById('modalPago-ventasPendientes');
    tbody.innerHTML = ventasPendientesModal.map(v => `
        <tr>
            <td class="p-2">
                <input 
                    type="checkbox"
                    class="modalPago-check-venta h-4 w-4"
                    data-venta-id="${v.id}"
                    ${ventasSeleccionadasModal.has(v.id) ? "checked" : ""}
                >
            </td>
            <td class="p-2 font-semibold">#${v.id}</td>
            <td class="p-2">${new Date(v.fecha).toLocaleDateString('es-AR')}</td>
            <td class="p-2 text-right font-mono text-red-600">${formatearMoneda(v.saldo_pendiente)}</td>
        </tr>
    `).join('');

    document.querySelectorAll('.modalPago-check-venta').forEach(check => {
        check.addEventListener('change', (e) => {
            const id = Number(e.target.dataset.ventaId);
            if (e.target.checked) {
                ventasSeleccionadasModal.add(id);
            } else {
                ventasSeleccionadasModal.delete(id);
            }

            const totalSeleccionado = obtenerTotalSeleccionadoModal();
            const inputMonto = document.getElementById('modalPago-monto');
            if ((parseFloat(inputMonto.value) || 0) > totalSeleccionado) {
                inputMonto.value = totalSeleccionado.toFixed(2);
            }
            actualizarResumenPagoModal();
        });
    });
}

// 2. Adaptación de la función para ABRIR el modal
window.abrirPantallaCobranza = (ventaId, clienteId, saldoPendiente, ventasPendientes = null) => {
    // Guardamos los IDs para usarlos luego al presionar "Aceptar"
    ventaIdActual = ventaId;
    saldoActual = saldoPendiente;
    clienteIdActualCobranza = clienteId;

    // Referencias a los elementos del modal que me pasaste
    const modal = document.getElementById('modalRegistroPago');
    const inputMonto = document.getElementById('modalPago-monto');
    const inputObs = document.getElementById('modalPago-observaciones');
    const metodoInput = document.getElementById('modalPago-metodo');

    // Cargamos ventas disponibles (modo simple o múltiple)
    ventasPendientesModal = Array.isArray(ventasPendientes) && ventasPendientes.length > 0
        ? ventasPendientes
        : [{ id: ventaId, fecha: new Date().toISOString(), saldo_pendiente: saldoPendiente }];
    ventasSeleccionadasModal = new Set([ventaId]);

    renderVentasPendientesModal();
    inputMonto.value = parseFloat(saldoPendiente).toFixed(2);
    inputObs.value = "";
    metodoInput.value = "Efectivo";
    actualizarResumenPagoModal();

    inputMonto.oninput = () => actualizarResumenPagoModal();

    // Mostramos el modal quitando la clase 'hidden' de Tailwind
    modal.classList.remove('hidden');
};

// 3. Lógica para el botón CANCELAR
document.getElementById('btnCancelRegistroPago').addEventListener('click', () => {
    document.getElementById('modalRegistroPago').classList.add('hidden');
    // Limpiamos las variables de control por seguridad
    ventaIdActual = null;
    clienteIdActualCobranza = null;
    saldoActual = 0;
    ventasPendientesModal = [];
    ventasSeleccionadasModal.clear();
});

// 4. Lógica para el botón ACEPTAR (Procesar el pago)
document.getElementById('btnAcceptRegistroPago').addEventListener('click', async () => {
    // Referencias a los inputs del modal
    const montoInput = document.getElementById('modalPago-monto');
    const metodoInput = document.getElementById('modalPago-metodo');
    const obsInput = document.getElementById('modalPago-observaciones');
    
    const monto = parseFloat(montoInput.value);
    const metodo = metodoInput.value;
    const observaciones = obsInput.value;
    const totalSeleccionado = obtenerTotalSeleccionadoModal();

    // --- VALIDACIONES BÁSICAS ---
    if (ventasSeleccionadasModal.size === 0) {
        alert("Seleccioná al menos una venta pendiente.");
        return;
    }
    if (!monto || monto <= 0) {
        alert("Por favor, ingrese un monto válido.");
        return;
    }

    if (monto > totalSeleccionado) {
        alert("El monto no puede ser mayor al total seleccionado (" + formatearMoneda(totalSeleccionado) + ").");
        return;
    }

    // --- ENVÍO DE DATOS AL BACKEND ---
    try {
        // Bloqueamos el botón para evitar doble clic accidental
        const btnAceptar = document.getElementById('btnAcceptRegistroPago');
        btnAceptar.disabled = true;
        btnAceptar.textContent = "Procesando...";

        const ventasSeleccionadas = ventasPendientesModal
            .filter(v => ventasSeleccionadasModal.has(v.id))
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

        let montoRestante = monto;
        const pagosRealizados = [];

        for (const venta of ventasSeleccionadas) {
            if (montoRestante <= 0) break;
            const saldoVenta = parseFloat(venta.saldo_pendiente);
            const montoParaVenta = Math.min(montoRestante, saldoVenta);

            const response = await fetch(`${URL_API}/${venta.id}/pago`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    monto: montoParaVenta,
                    metodo: metodo,
                    observaciones: observaciones
                })
            });

            const data = await response.json();
                if (!response.ok || !data.success) {
                    throw new Error(data.error || `No se pudo registrar el pago de la venta #${venta.id}`);
                }

            pagosRealizados.push({
                ventaId: venta.id,
                montoPagado: montoParaVenta,
                nuevoSaldo: data.nuevoSaldo
            });
            montoRestante -= montoParaVenta;
        }

        if (pagosRealizados.length === 0) {
            alert("No se registraron pagos.");
            return;
        }

        alert(`¡Pago registrado con éxito! Ventas afectadas: ${pagosRealizados.length}`);

        document.getElementById('modalRegistroPago').classList.add('hidden');
        

        for (const pago of pagosRealizados) {
            const ventaActualizada = await fetchVentaPorId(pago.ventaId);
            await generarReciboPagoPDF(ventaActualizada, pago.montoPagado, pago.nuevoSaldo);
        }
        // 5. Si hay cliente de balance seleccionado, volver a esa pantalla y refrescar datos
        if (window.currentBalanceClienteId) {
            cambiarSeccion("pantalla-balance-cliente");
            await cargarDatosBalance(window.currentBalanceClienteId);
        }

        await listarVentas();

    } catch (error) {
        console.error("Error en la petición:", error);
        alert("Hubo un error de conexión con el servidor.");
    } finally {
        // Reestablecemos el botón pase lo que pase
        const btnAceptar = document.getElementById('btnAcceptRegistroPago');
        btnAceptar.disabled = false;
        btnAceptar.textContent = "Aceptar";
    }
});

window.cerrarModalDetalle = () => {
    cambiarSeccion('seccionVentas');
};

window.abrirPagoDesdeBalance = async () => {
    const clienteId = window.currentBalanceClienteId;
    if (!clienteId) {
        return alert("No hay cliente seleccionado en el balance.");
    }

    try {
        const response = await fetch(URL_API);
        if (!response.ok) throw new Error("No se pudieron cargar las ventas");
        const ventas = await response.json();
        const ventasPendientes = ventas.filter(v => v.cliente_id == clienteId && parseFloat(v.saldo_pendiente) > 0);

        if (ventasPendientes.length === 0) {
            return alert("No hay facturas pendientes para este cliente.");
        }

        const primeraVenta = ventasPendientes[0];
        abrirPantallaCobranza(
            primeraVenta.id,
            clienteId,
            parseFloat(primeraVenta.saldo_pendiente),
            ventasPendientes
        );
    } catch (error) {
        console.error(error);
        alert("Error al cargar las ventas para el balance.");
    }
};

window.imprimirReciboPagoMov = async (ventaId, monto, saldo) => {
    try {
        const venta = await fetchVentaPorId(ventaId);
        if (!venta) {
            return alert("No se encontró la venta para generar el recibo.");
        }
        await generarReciboPagoPDF(venta, monto, saldo);
    } catch (error) {
        console.error("Error generando recibo de pago:", error);
        alert("No se pudo generar el recibo de pago.");
    }
};

async function fetchVentaPorId(ventaId) {
    const response = await fetch(URL_API);
    if (!response.ok) throw new Error("No se pudieron cargar las ventas");
    const ventas = await response.json();
    return ventas.find(v => v.id == ventaId);
}

async function generarReciboPagoPDF(venta, montoPagado, nuevoSaldo) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = margin;

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("RECIBO DE PAGO", pageWidth / 2, y, { align: "center" });
    y += 12;

    const datosEmpresa = obtenerDatosEmpresa();
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(datosEmpresa.razonSocial, margin, y);
    y += 5;
    doc.text(`CUIT: ${datosEmpresa.cuit}`, margin, y);
    y += 5;
    doc.text(`Domicilio: ${datosEmpresa.domicilio}`, margin, y);
    y += 10;

    doc.text(`Fecha: ${new Date().toLocaleDateString('es-AR')}`, pageWidth - margin, y, { align: "right" });
    y += 10;

    doc.setFont("helvetica", "bold");
    doc.text("Cliente:", margin, y);
    doc.setFont("helvetica", "normal");
    y += 5;

    let clienteData = "Consumidor Final";
    if (venta && venta.cliente_id > 0) {
        const clientes = await fetchClientes();
        const cliente = clientes.find(c => c.id == venta.cliente_id);
        if (cliente) {
            clienteData = `${cliente.nombre} ${cliente.apellido}\nDNI: ${cliente.dni || 'N/A'}\nCUIT: ${cliente.cuit || 'N/A'}\nDirección: ${cliente.direccion || 'N/A'}`;
        }
    }
    const clienteLines = doc.splitTextToSize(clienteData, pageWidth - 2 * margin);
    doc.text(clienteLines, margin, y);
    y += clienteLines.length * 5 + 10;

    doc.setFont("helvetica", "bold");
    doc.text(`Facturado a N°: ${venta ? `0001 - ${String(venta.id).padStart(8, '0')}` : '---'}`, margin, y);
    y += 7;
    doc.text(`Importe abonado: $${parseFloat(montoPagado).toFixed(2)}`, margin, y);
    y += 7;
    doc.text(`Saldo restante cuenta corriente: $${parseFloat(nuevoSaldo).toFixed(2)}`, margin, y);
    y += 15;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Detalle:", margin, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text (`Recibi la suma de: $${parseFloat(montoPagado).toFixed(2)}.`, margin, y);
    y += 7;
    doc.text(`en concepto de pago por venta N° ${venta ? `0001 - ${String(venta.id).padStart(8, '0')}` : '---'}.`, margin, y);
    y += 7;
    doc.text(`Saldo de cuenta corriente después del pago: $${parseFloat(nuevoSaldo).toFixed(2)}.`, margin, y);
    y += 15;

    const observaciones = venta?.observaciones || "Sin observaciones";
    doc.text("Observaciones:", margin, y);
    y += 5;
    const obsLines = doc.splitTextToSize(observaciones, pageWidth - 2 * margin);
    doc.text(obsLines, margin, y);
    y += obsLines.length * 5 + 10;

    doc.setFontSize(8);
    doc.text("Este recibo documenta el pago de la factura indicada y el saldo de la cuenta corriente.", pageWidth / 2, y, { align: "center" });

    doc.save(`ReciboPago_${venta ? venta.id : 'sin-id'}.pdf`);
}

window.imprimirVenta = (id) => {
    alert("Generando PDF para la venta " + id);
};

window.eliminarVenta = async (id) => {
    if (confirm("¿Estás seguro de eliminar esta venta? Esto no devolverá el stock automáticamente.")) {
        try {
            const response = await fetch(`${URL_API}/${id}`, { method: "DELETE" });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "No se pudo eliminar la venta");
            }

            alert(data.message || "Venta eliminada correctamente");
            await listarVentas();
        } catch (error) {
            console.error("Error al eliminar venta:", error);
            alert(`No se pudo eliminar la venta: ${error.message}`);
        }
    }
};

export async function initVentas() {
    carritoVenta = [];

    const btnNuevaVenta = document.getElementById("btn-nueva-venta");
    if (btnNuevaVenta) {
        btnNuevaVenta.addEventListener("click", () => {
            carritoVenta = [];
            document.getElementById("v-observaciones").value = "";
            document.getElementById("v-cliente-select").value = "0";
            actualizarTablaVenta(carritoVenta);
            cambiarSeccion('pantallaGenerarVenta');
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape" || e.keyCode === 27) {
            const modalBusqueda = document.getElementById("modalBuscadorProductos");
            if (modalBusqueda && !modalBusqueda.classList.contains("hidden")) {
                cerrarBuscadorProductos();
                return;
            }

            const modalBusquedaClientes = document.getElementById("modalBuscadorClientes");
            if (modalBusquedaClientes && !modalBusquedaClientes.classList.contains("hidden")) {
                cerrarBuscadorClientes();
                return;
            }

            const modalPago = document.getElementById("modalPago");
            if (modalPago && !modalPago.classList.contains("hidden")) {
                cerrarModalPago();
                return;
            }

            const pantallaVenta = document.getElementById("pantallaGenerarVenta");
            if (pantallaVenta && !pantallaVenta.classList.contains("hidden")) {
                volverALista();
            }
        }
    });

    setSkuFocus();
    addPagoEntregaListener();
    await cargarDatosParaVenta();
}

export async function listarVentas() {
    const cuerpoTabla = document.getElementById("cuerpo-tabla-ventas");
    if (!cuerpoTabla) return;

    try {
        const respuesta = await fetch(URL_API);
        if (!respuesta.ok) throw new Error("Error al obtener ventas");
        const ventas = await respuesta.json();
        renderTablaVentas(ventas);
    } catch (error) {
        console.error("Error al listar ventas:", error);
    }
}

async function generarFacturaPDFExistente(venta, detalles) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Configuración de página A4
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let y = margin;

    // Encabezado principal
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("FACTURA", pageWidth / 2, y, { align: "center" });
    y += 10;

    doc.setFontSize(14);
    doc.text("C", pageWidth / 2, y, { align: "center" }); // Tipo C para consumidor final
    y += 15;

    // Línea separadora
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Datos del emisor (izquierda)
    const datosEmpresa = obtenerDatosEmpresa();
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(datosEmpresa.razonSocial, margin, y);
    y += 5;
    doc.text(`CUIT: ${datosEmpresa.cuit}`, margin, y);
    y += 5;
    doc.text(`Domicilio: ${datosEmpresa.domicilio}`, margin, y);
    y += 10;

    // Número y fecha (derecha)
    doc.text(`Fecha: ${new Date(venta.fecha).toLocaleDateString('es-AR')}`, pageWidth - margin, y, { align: "right" });
    y += 5;
    doc.text(`Factura N°: 0001 - ${String(venta.id).padStart(8, '0')}`, pageWidth - margin, y, { align: "right" }); // Punto de venta 0001
    y += 15;

    // Datos del cliente
    doc.setFont("helvetica", "bold");
    doc.text("Cliente:", margin, y);
    doc.setFont("helvetica", "normal");
    y += 5;

    let clienteData = "Consumidor Final";
    if (venta.cliente_id > 0) {
        const clientes = await fetchClientes();
        const cliente = clientes.find(c => c.id == venta.cliente_id);
        if (cliente) {
            clienteData = `${cliente.nombre} ${cliente.apellido}\nDNI: ${cliente.dni}\nCUIT: ${cliente.cuit}\nDirección: ${cliente.direccion}`;
        }
    }
    const clienteLines = doc.splitTextToSize(clienteData, 80);
    doc.text(clienteLines, margin, y);
    y += clienteLines.length * 5 + 10;

    // Tabla de detalles
    doc.setFont("helvetica", "bold");
    doc.text("Detalle de la Venta:", margin, y);
    y += 10;

    // Encabezados de tabla
    const tableStartY = y;
    doc.setFontSize(9);
    doc.text("Cant.", margin, y);
    doc.text("Descripción", margin + 20, y);
    doc.text("P.Unit.", pageWidth - 60, y, { align: "right" });
    doc.text("Subtotal", pageWidth - margin, y, { align: "right" });
    y += 5;

    // Línea bajo encabezados
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    // Items
    doc.setFont("helvetica", "normal");
    detalles.forEach(item => {
        doc.text(item.cantidad.toString(), margin, y);
        const descLines = doc.splitTextToSize(item.descripcion, 80);
        doc.text(descLines, margin + 20, y);
        doc.text(`$${parseFloat(item.precio_unitario).toFixed(2)}`, pageWidth - 60, y, { align: "right" });
        doc.text(`$${(item.cantidad * item.precio_unitario).toFixed(2)}`, pageWidth - margin, y, { align: "right" });
        y += descLines.length * 5 + 2;
    });

    // Línea final de tabla
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Total
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`TOTAL: $${parseFloat(venta.total).toFixed(2)}`, pageWidth - margin, y, { align: "right" });
    y += 15;

    // Observaciones
    if (venta.observaciones) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("Observaciones:", margin, y);
        y += 5;
        const obsLines = doc.splitTextToSize(venta.observaciones, pageWidth - 2 * margin);
        doc.text(obsLines, margin, y);
    }

    // Pie de página
    y = pageHeight - 30;
    doc.setFontSize(8);
    doc.text("Esta factura se emite conforme a la Resolución General N° 1415 de la AFIP.", pageWidth / 2, y, { align: "center" });

    // Descargar el PDF
    doc.save(`Factura_${venta.id}.pdf`);
}

window.imprimirFactura = () => {
    if (!window.ventaActual || !window.detallesActual) {
        alert("No hay datos de venta para imprimir.");
        return;
    }
    generarFacturaPDFExistente(window.ventaActual, window.detallesActual);
};

window.imprimirVenta = async (id) => {
    await cargarDatosVenta(id);
    imprimirFactura();
};

export async function obtenerHistorialVentas() {
    const response = await fetch(URL_API);
    return await response.json();
}