// ==========================================
// 1. IMPORTACIONES Y CONFIGURACIÓN INICIAL
// ==========================================

import { initClientes, fetchClientes } from "./clientes.js";
import { initProductos, fetchProductos } from "./productos.js";
import { initVentas, listarVentas, obtenerHistorialVentas } from "./ventas.js";
import { cambiarSeccion, mostrarLoader, ocultarLoader } from "./ui.js";
import { load, save } from "./storage.js";
import { API_BASE_URL } from "./config.js";
import { apiFetch } from "./apiClient.js";

const CONFIG_STORAGE_KEY = "empresaConfig";
const URL_API_VENTAS = `${API_BASE_URL}/api/ventas`;
let chartVentasDashboard = null;

async function validarSesionActual() {
    const token = sessionStorage.getItem('authToken');

    if (!token) {
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        return response.ok;
    } catch (error) {
        console.error('Error validando sesión:', error);
        return false;
    }
}

const CONFIG_DEFAULTS = {
    razonSocial: "JR Import S.A.",
    nombreFantasia: "JR Import",
    domicilio: "Calle Ficticia 123, Ciudad Autónoma de Buenos Aires",
    cuit: "30-12345678-9",
    email: "info@jrimport.com",
    telefono: "(011) 1234-5678",
    website: "www.jrimport.com",
    condicionIva: "Responsable Inscripto"
};

function obtenerConfiguracionEmpresa() {
    const config = load(CONFIG_STORAGE_KEY);
    if (!config || Array.isArray(config)) {
        return CONFIG_DEFAULTS;
    }
    return { ...CONFIG_DEFAULTS, ...config };
}

function popularFormularioConfiguracion() {
    const config = obtenerConfiguracionEmpresa();
    document.getElementById("configRazonSocial").value = config.razonSocial;
    document.getElementById("configNombreFantasia").value = config.nombreFantasia;
    document.getElementById("configCuit").value = config.cuit;
    document.getElementById("configDomicilio").value = config.domicilio;
    document.getElementById("configEmail").value = config.email;
    document.getElementById("configTelefono").value = config.telefono;
    document.getElementById("configWebsite").value = config.website;
    document.getElementById("configCondicionIva").value = config.condicionIva;
}

function guardarConfiguracionEmpresa(event) {
    event.preventDefault();
    const nuevaConfig = {
        razonSocial: document.getElementById("configRazonSocial").value.trim(),
        nombreFantasia: document.getElementById("configNombreFantasia").value.trim(),
        cuit: document.getElementById("configCuit").value.trim(),
        domicilio: document.getElementById("configDomicilio").value.trim(),
        email: document.getElementById("configEmail").value.trim(),
        telefono: document.getElementById("configTelefono").value.trim(),
        website: document.getElementById("configWebsite").value.trim(),
        condicionIva: document.getElementById("configCondicionIva").value.trim()
    };

    save(CONFIG_STORAGE_KEY, nuevaConfig);
    alert("✅ Datos de la empresa guardados correctamente.");
}

function formatMoney(value) {
    return `$${Number(value || 0).toFixed(2)}`;
}

function fechaValida(fecha) {
    const parsed = new Date(fecha);
    return !Number.isNaN(parsed.getTime()) ? parsed : null;
}

async function obtenerTopProductosMasVendidos(ventas) {
    const ventasRecientes = ventas.slice(0, 20);
    const acumulado = {};

    const detalles = await Promise.all(ventasRecientes.map(async (venta) => {
        const res = await apiFetch(`${URL_API_VENTAS}/${venta.id}/detalle`);
        if (!res.ok) return [];
        return await res.json();
    }));

    detalles.flat().forEach(item => {
        const key = `${item.sku}|${item.descripcion}`;
        acumulado[key] = (acumulado[key] || 0) + Number(item.cantidad || 0);
    });

    return Object.entries(acumulado)
        .map(([key, cantidad]) => {
            const [sku, descripcion] = key.split("|");
            return { sku, descripcion, cantidad };
        })
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5);
}

function generarListaStockBajo(productos) {
    const bajos = productos
        .filter(p => Number(p.stock) <= Number(p.stock_minimo))
        .slice(0, 5);

    if (bajos.length === 0) {
        return `<p class="text-sm text-gray-500 dark:text-gray-400">No hay productos en alerta de stock bajo.</p>`;
    }

    return bajos.map(p => `
        <div class="rounded-2xl border border-orange-100 dark:border-orange-900/40 bg-orange-50/70 dark:bg-orange-950/20 p-4">
            <p class="font-bold text-gray-900 dark:text-white">${p.descripcion || p.sku}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">Stock: ${p.stock} / Min: ${p.stock_minimo}</p>
        </div>
    `).join('');
}

function crearGraficoVentas(ventas) {
    const canvas = document.getElementById("dashboardVentasChart");
    if (!canvas) return;

    const ultimasVentas = ventas.slice(0, 7).reverse();
    const labels = ultimasVentas.map(v => fechaValida(v.fecha)?.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) || '-');
    const data = ultimasVentas.map(v => Number(v.total || 0));

    if (chartVentasDashboard) {
        chartVentasDashboard.destroy();
    }

    chartVentasDashboard = new Chart(canvas, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Monto por Venta',
                data,
                borderColor: '#2563EB',
                backgroundColor: 'rgba(37, 99, 235, 0.2)',
                fill: true,
                tension: 0.3,
                pointRadius: 4,
                pointBackgroundColor: '#1D4ED8'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { ticks: { color: '#6B7280' } },
                y: {
                    ticks: {
                        color: '#6B7280',
                        callback: value => `$${value}`
                    }
                }
            }
        }
    });
}

async function renderDashboard() {
    mostrarLoader();

    try {
        const [clientes, productos, ventas] = await Promise.all([
            fetchClientes(),
            fetchProductos(),
            obtenerHistorialVentas()
        ]);

        const ahora = new Date();
        const primerDiaMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        const hace30Dias = new Date(ahora);
        hace30Dias.setDate(hace30Dias.getDate() - 30);

        const ventasMes = ventas.filter(v => {
            const fecha = fechaValida(v.fecha);
            return fecha && fecha >= primerDiaMes && fecha <= ahora;
        });

        const totalMes = ventasMes.reduce((sum, v) => sum + Number(v.total || 0), 0);
        const saldoPendiente = ventas.reduce((sum, v) => sum + Number(v.saldo_pendiente || 0), 0);
        const nuevosClientes = clientes.filter(c => {
            const fecha = fechaValida(c.fecha_alta);
            return fecha && fecha >= hace30Dias && fecha <= ahora;
        }).length;
        const stockBajo = productos.filter(p => Number(p.stock) <= Number(p.stock_minimo)).length;

        document.getElementById("dashboardVentasMes").innerText = formatMoney(totalMes);
        document.getElementById("dashboardSaldoPendiente").innerText = formatMoney(saldoPendiente);
        document.getElementById("dashboardClientesNuevos").innerText = nuevosClientes;
        document.getElementById("dashboardProductosStockBajo").innerText = stockBajo;
        document.getElementById("dashboardLowStockList").innerHTML = generarListaStockBajo(productos);

        const ultimas5 = ventas.slice(0, 5);
        document.getElementById("dashboardUltimasVentasBody").innerHTML = ultimas5.map(v => {
            const fecha = fechaValida(v.fecha);
            return `
                <tr class="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                    <td class="p-3 font-mono text-gray-700 dark:text-gray-200">#${v.id}</td>
                    <td class="p-3 text-gray-600 dark:text-gray-300">${v.cliente_nombre ? `${v.cliente_nombre} ${v.cliente_apellido || ''}` : 'Consumidor Final'}</td>
                    <td class="p-3 text-right font-bold text-slate-900 dark:text-white">${formatMoney(v.total)}</td>
                    <td class="p-3 text-sm font-semibold ${v.estado_pago && v.estado_pago.toLowerCase().includes('pagado') ? 'text-green-600' : 'text-orange-500'}">${v.estado_pago || 'Pendiente'}</td>
                    <td class="p-3">${fecha ? fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'}</td>
                </tr>
            `;
        }).join('');

        const topProductos = await obtenerTopProductosMasVendidos(ventas);
        document.getElementById("dashboardTopProductosBody").innerHTML = topProductos.map(p => `
            <tr class="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                <td class="p-3 text-gray-700 dark:text-gray-200">${p.descripcion}</td>
                <td class="p-3 text-right font-bold text-slate-900 dark:text-white">${p.cantidad}</td>
            </tr>
        `).join('');

        crearGraficoVentas(ventas);
    } catch (error) {
        console.error("Error al cargar dashboard:", error);
        alert("No se pudo cargar el dashboard. Revisá la consola para más detalle.");
    } finally {
        ocultarLoader();
    }
}


// ==========================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ==========================================

async function initApp() {
    // Inicializar módulos
    await initClientes();
    await initProductos();
    await initVentas();

    cambiarSeccion('seccionDashboard');

    const sidebar = document.getElementById("sidebar");
    const btnMenuMobile = document.getElementById("btnMenuMobile");
    const mobileMenuOverlay = document.getElementById("mobileMenuOverlay");

    const abrirMenuMobile = () => {
        if (!sidebar || !mobileMenuOverlay) return;
        sidebar.classList.remove("-translate-x-full");
        mobileMenuOverlay.classList.remove("hidden");
    };

    const cerrarMenuMobile = () => {
        if (!sidebar || !mobileMenuOverlay) return;
        sidebar.classList.add("-translate-x-full");
        mobileMenuOverlay.classList.add("hidden");
    };

    btnMenuMobile?.addEventListener("click", abrirMenuMobile);
    mobileMenuOverlay?.addEventListener("click", cerrarMenuMobile);

    // cerrar al elegir opción
    ["linkDashboard", "linkClientes", "linkVentas", "linkProductos", "linkConfig"].forEach((id) => {
        document.getElementById(id)?.addEventListener("click", () => {
            if (window.innerWidth < 768) cerrarMenuMobile();
        });
    });

    // --- CONFIGURACIÓN DE CLICS DEL MENÚ LATERAL ---

    // 1. Cuando hagan clic en Dashboard
    document.getElementById("linkDashboard").addEventListener("click", (e) => {
        e.preventDefault(); // Esto evita que la página salte al principio por el href="#"
        cambiarSeccion('seccionDashboard');
        renderDashboard();
    });

    // 2. Cuando hagan clic en Clientes
    document.getElementById("linkClientes").addEventListener("click", (e) => {
        e.preventDefault();
        cambiarSeccion('seccionClientes');
    });

    // 3. Cuando hagan clic en Ventas
    document.getElementById("linkVentas").addEventListener("click", (e) => {
        e.preventDefault();
        cambiarSeccion('seccionVentas');
        listarVentas();
    });

    // 4. Cuando hagan clic en Productos
    document.getElementById("linkProductos").addEventListener("click", (e) => {
        e.preventDefault();
        cambiarSeccion('seccionProductos');
    });

    // 5. Cuando hagan clic en Configuracion
    document.getElementById("linkConfig").addEventListener("click", (e) => {
        e.preventDefault();
        cambiarSeccion('seccionConfig');
        popularFormularioConfiguracion();
    });

    const dashboardRefresh = document.getElementById("dashboardRefresh");
    if (dashboardRefresh) {
        dashboardRefresh.addEventListener("click", renderDashboard);
    }

    const formConfigEmpresa = document.getElementById("formConfigEmpresa");
    if (formConfigEmpresa) {
        formConfigEmpresa.addEventListener("submit", guardarConfiguracionEmpresa);
    }

    popularFormularioConfiguracion();
    renderDashboard();

    // 1. Reloj profesional
    if(document.getElementById("pantallaGenerarVenta")){
        setInterval(() => {
            const reloj = document.getElementById("reloj-venta");
            if(reloj) reloj.innerText = new Date().toLocaleTimeString();
        }, 1000);
    }

    // 5. MODO OSCURO (Básico para que no te moleste la vista)
    const btnDarkMode = document.getElementById("btnDarkMode");
    if (btnDarkMode) {
        btnDarkMode.onclick = () => document.documentElement.classList.toggle("dark");
    }

    // 6. CERRAR SESIÓN
    const btnLogout = document.getElementById("btnLogout");
    if (btnLogout) {
        btnLogout.onclick = openLogoutConfirm;
    }
}

function openLogoutConfirm() {
    const modal = document.getElementById('modalLogoutConfirm');
    if (modal) modal.classList.remove('hidden');
}

function closeLogoutConfirm() {
    const modal = document.getElementById('modalLogoutConfirm');
    if (modal) modal.classList.add('hidden');
}

function confirmLogout() {
    sessionStorage.removeItem('loggedIn');
    sessionStorage.removeItem('authToken');
    closeLogoutConfirm();
    location.reload();
}

// ==========================================
// LÓGICA DE LOGIN
// ==========================================

function showLogin() {
    document.getElementById('pantallaLogin').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
}

function showApp() {
    document.getElementById('pantallaLogin').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
}

async function iniciarApp() {
    showApp();
    await initApp();
}

// ==========================================
// 6. CARGA INICIAL (DOMContentLoaded)
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const input = document.getElementById('password');
            if (input) {
                input.type = input.type === 'password' ? 'text' : 'password';
            }
        });
    }

    const formLogin = document.getElementById('formLogin');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const empresa = document.getElementById('empresa').value;
            const usuario = document.getElementById('usuario').value;
            const password = document.getElementById('password').value;
            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        empresa,
                        usuario,
                        password
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    alert(data.error || 'Credenciales incorrectas. Intente nuevamente.');
                    return;
                }

                sessionStorage.setItem('authToken', data.token);
                sessionStorage.setItem('loggedIn', 'true');

                await iniciarApp();
            } catch (error) {
                console.error('Error al iniciar sesión:', error);
                alert('No se pudo conectar con el servidor. Intente nuevamente.');
            }
        });
    }

    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', openLogoutConfirm);
    }

    const btnConfirmLogout = document.getElementById('btnConfirmLogout');
    if (btnConfirmLogout) {
        btnConfirmLogout.addEventListener('click', confirmLogout);
    }

    const btnCancelLogout = document.getElementById('btnCancelLogout');
    if (btnCancelLogout) {
        btnCancelLogout.addEventListener('click', closeLogoutConfirm);
    }

    if (sessionStorage.getItem('loggedIn') !== 'true') {
        showLogin();
        return;
    }

    const sesionValida = await validarSesionActual();

    if (!sesionValida) {
        sessionStorage.removeItem('loggedIn');
        sessionStorage.removeItem('authToken');
        showLogin();
        return;
    }

    await iniciarApp();

    // --- CONFIGURACIÓN DE CLICS DEL MENÚ LATERAL ---

    // 1. Cuando hagan clic en Dashboard
    document.getElementById("linkDashboard").addEventListener("click", (e) => {
        e.preventDefault(); // Esto evita que la página salte al principio por el href="#"
        cambiarSeccion('seccionDashboard');
        renderDashboard();
    });

    // 2. Cuando hagan clic en Clientes
    document.getElementById("linkClientes").addEventListener("click", (e) => {
        e.preventDefault();
        cambiarSeccion('seccionClientes');
    });

    // 3. Cuando hagan clic en Ventas
    document.getElementById("linkVentas").addEventListener("click", (e) => {
        e.preventDefault();
        cambiarSeccion('seccionVentas');
        listarVentas();
    });

    // 4. Cuando hagan clic en Productos
    document.getElementById("linkProductos").addEventListener("click", (e) => {
        e.preventDefault();
        cambiarSeccion('seccionProductos');
    });

    // 5. Cuando hagan clic en Configuracion
    document.getElementById("linkConfig").addEventListener("click", (e) => {
        e.preventDefault();
        cambiarSeccion('seccionConfig');
        popularFormularioConfiguracion();
    });

    const dashboardRefresh = document.getElementById("dashboardRefresh");
    if (dashboardRefresh) {
        dashboardRefresh.addEventListener("click", renderDashboard);
    }

    const formConfigEmpresa = document.getElementById("formConfigEmpresa");
    if (formConfigEmpresa) {
        formConfigEmpresa.addEventListener("submit", guardarConfiguracionEmpresa);
    }

    popularFormularioConfiguracion();
    renderDashboard();





    

    // 1. Reloj profesional
    if(document.getElementById("pantallaGenerarVenta")){
        setInterval(() => {
            const reloj = document.getElementById("reloj-venta");
            if(reloj) reloj.innerText = new Date().toLocaleTimeString();
        }, 1000);
    }

    
    
    
    // 5. MODO OSCURO (Básico para que no te moleste la vista)
    const btnDarkMode = document.getElementById("btnDarkMode");
    if (btnDarkMode) {
        btnDarkMode.onclick = () => document.documentElement.classList.toggle("dark");
    }
});