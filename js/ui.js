// ==========================================
// 2. UTILIDADES GENERALES (UI Y NAVEGACIÓN)
// ==========================================
export const toggleModal = (id, mostrar = true) => {
    const modal = document.getElementById(id);
    modal.classList.toggle("hidden", !mostrar);
    modal.classList.toggle("flex", mostrar);
};

export const mostrarLoader = () => {
    const loader = document.getElementById("globalLoader");
    if (!loader) return;

    loader.classList.remove("hidden");
    loader.classList.add("flex");
};

export const ocultarLoader = () => {
    const loader = document.getElementById("globalLoader");
    if (!loader) return;

    loader.classList.add("hidden");
    loader.classList.remove("flex");
};


export const cambiarSeccion = (idSeccionDestino) => {

    const pantallas = [
        "seccionDashboard", 
        "seccionProductos", 
        "seccionClientes", 
        "seccionVentas",
        "seccionConfig",
        "pantallaGenerarVenta",
        "pantalla-balance-cliente",
        "pantallaCliente",
        "pantallaProducto",
        "pantalla-detalle-venta"
    ];
    pantallas.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.classList.add("hidden");
        }
    });
  
    const pantallaActiva = document.getElementById(idSeccionDestino);
    if (pantallaActiva) {
        pantallaActiva.classList.remove("hidden");
    }
    
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
   
    const headerVentas = document.getElementById("headerVentas");
    if (headerVentas) {
        if (idSeccionDestino === "pantallaGenerarVenta") {
            headerVentas.classList.add("hidden");
        } else {
            headerVentas.classList.remove("hidden");
        }
    }

    // Inicializar opciones de pago cuando se entra a la sección de ventas
    if (idSeccionDestino === "seccionVentas" || idSeccionDestino === "pantallaGenerarVenta") {
        if (typeof window.actualizarOpcionesPago === "function") {
            // Por defecto, ocultar cuenta corriente (consumidor final)
            window.actualizarOpcionesPago(false);
        }
    }
};

window.cambiarSeccion = cambiarSeccion;
window.toggleModal = toggleModal;

// ==========================================
// 3. SISTEMA DE ALERTAS/MODALES
// ==========================================

/**
 * Muestra un modal de alerta personalizado
 * @param {string} message - Mensaje a mostrar
 * @param {string} title - Título del modal (opcional)
 * @param {string} type - Tipo de alerta: 'success', 'error', 'warning', 'info'
 */
export const mostrarAlerta = (message, title = '', type = 'info') => {
    const modal = document.getElementById('modalAlerta');
    const content = document.getElementById('modalAlertaContent');
    const icon = document.getElementById('modalAlertaIcon');
    const titleEl = document.getElementById('modalAlertaTitle');
    const messageEl = document.getElementById('modalAlertaMessage');
    const btn = document.getElementById('modalAlertaBtn');

    // Configurar icono y colores según el tipo
    const config = {
        success: { icon: '✅', title: title || '¡Éxito!' },
        error: { icon: '❌', title: title || 'Error' },
        warning: { icon: '⚠️', title: title || 'Advertencia' },
        info: { icon: 'ℹ️', title: title || 'Información' }
    };

    const { icon: iconText, title: defaultTitle } = config[type] || config.info;

    icon.textContent = iconText;
    titleEl.textContent = title || defaultTitle;
    messageEl.textContent = message;

    // Mostrar modal con animación
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Animación de entrada
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);

    // Función para cerrar
    const cerrarModal = () => {
        content.classList.remove('scale-100', 'opacity-100');
        content.classList.add('scale-95', 'opacity-0');

        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }, 300);
    };

    // Event listener para el botón
    const handleClick = () => {
        cerrarModal();
        btn.removeEventListener('click', handleClick);
    };

    btn.addEventListener('click', handleClick);

    // Cerrar al hacer click fuera del modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            cerrarModal();
        }
    });

    // Cerrar con tecla Escape
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            cerrarModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
};

/**
 * Función global para reemplazar alert() - mantiene compatibilidad
 * @param {string} message - Mensaje a mostrar
 */
window.mostrarAlerta = mostrarAlerta;

// Función de compatibilidad para reemplazar alert()
window.alert = (message) => {
    mostrarAlerta(message, '', 'info');
};