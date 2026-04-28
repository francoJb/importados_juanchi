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
            listarClientes(); // Recarga la tabla automáticamente
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

        document.getElementById("ba-saldo-total").innerText = `$${parseFloat(data.saldoTotal).toFixed(2)}`;
        const totalPagado = data.movimientos.reduce((sum, m) => sum + parseFloat(m.haber), 0);
        document.getElementById("ba-total-pagos").innerText = `$${totalPagado.toFixed(2)}`;

        const body = document.getElementById("ba-tabla-body");
        body.innerHTML = data.movimientos.map(m => `
            <tr class="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors text-sm">
                <td class="p-4 text-gray-500">${new Date(m.fecha).toLocaleString('es-AR')}</td>
                <td class="p-4">
                    <span class="font-bold dark:text-white">${m.descripcion}</span>
                    ${m.venta_id ? `<br><span class="text-[10px] text-blue-500 font-mono italic">REF: Venta #${m.venta_id}</span>` : ''}
                </td>
                <td class="p-4 text-right font-mono text-red-500">${m.debe > 0 ? `+$${parseFloat(m.debe).toFixed(2)}` : '-'}</td>
                <td class="p-4 text-right font-mono text-green-500">${m.haber > 0 ? `-$${parseFloat(m.haber).toFixed(2)}` : '-'}</td>
                <td class="p-4 text-right font-black font-mono dark:text-white bg-blue-50/30 dark:bg-blue-900/10">$${parseFloat(m.saldo_acumulado).toFixed(2)}</td>
                <td class="p-4 text-center">
                    ${m.haber > 0 && m.venta_id ? `<button onclick="imprimirReciboPagoMov(${m.venta_id}, ${parseFloat(m.haber)}, ${parseFloat(m.saldo_acumulado)})" class="hover:scale-150 transition-transform" title="Imprimir Recibo">🖨️</button>` : '-'}
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
                    class="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-1 px-5 rounded-xl shadow-lg">
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
    // 2. Le asignamos el ID del cliente seleccionado
    if (selectC) {
        selectC.value = id;
    }
    // 3. Cerramos el buscador
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

window.prepararEdicionCliente = prepararEdicionCliente;
window.eliminarCliente = eliminarCliente;
window.listarClientes = listarClientes;
window.irABalanceCliente = irABalanceCliente;
window.abrirBuscadorClientes = abrirBuscadorClientes;
window.cerrarBuscadorClientes = cerrarBuscadorClientes;
window.filtrarClientesModal = filtrarClientesModal;
window.seleccionarClienteDesdeModal = seleccionarClienteDesdeModal;