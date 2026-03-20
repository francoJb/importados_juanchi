// js/app.js
import { 
    guardarCliente, 
    registrarCobroAPI, 
    obtenerClientes 
} from "./clientes.js";
import { renderClientes } from "./renderclientes.js";

import { 
    agregarAlCarrito, 
    finalizarVentaAPI, 
    limpiarCarrito, 
    carrito 
} from "./ventas.js";
import { 
    renderCarritoUI, 
    renderHistorialVentas 
} from "./renderventas.js";

import { 
    obtenerProductos, 
    descontarStock, 
    agregarProducto as apiAgregarProducto, 
    editarProducto as apiEditarProducto,
    eliminarProducto as apiEliminarProducto 
} from "./productos.js";
import { renderProductos } from "./renderproductos.js";
import { verificarStockBajo } from "./modules/productosUi.js";

// --- FUNCIONES GLOBALES PARA LA UI ---
function toggleModal(idModal, mostrar = true) {
    const modal = document.getElementById(idModal);
    if (!modal) return;
    modal.classList.toggle("hidden", !mostrar);
    modal.classList.toggle("flex", mostrar);
}

// Hacer funciones accesibles desde el HTML (para botones en tablas)
window.editarProducto = async (id) => {
    const productos = await obtenerProductos();
    const p = productos.find(prod => prod.id == id);
    if (!p) return;
    
    document.getElementById("prodId").value = p.id;
    document.getElementById("prodCodigo").value = p.codigo;
    document.getElementById("prodDescripcion").value = p.descripcion;
    document.getElementById("prodPrecio").value = p.precio;
    document.getElementById("prodStock").value = p.stock;
    // ... completar el resto de campos si es necesario ...
    toggleModal("modalProducto", true);
};

window.eliminarProducto = async (id) => {
    if (confirm("¿Desea desactivar este producto?")) {
        await apiEliminarProducto(id);
        await renderProductos();
    }
};

// --- INICIO DE LA APLICACIÓN ---
document.addEventListener("DOMContentLoaded", async () => {

    // 1. MODO OSCURO
    const btnDarkMode = document.getElementById("btnDarkMode");
    if (localStorage.getItem("darkMode") === "true") document.documentElement.classList.add("dark");
    
    btnDarkMode.onclick = () => {
        const isDark = document.documentElement.classList.toggle("dark");
        localStorage.setItem("darkMode", isDark);
    };

    // 2. NAVEGACIÓN SPA
    const secciones = {
        linkDashboard: document.getElementById("seccionDashboard"),
        linkClientes: document.getElementById("seccionClientes"),
        linkProductos: document.getElementById("seccionProductos"),
        linkVentas: document.getElementById("seccionVentas"),
        linkConfig: document.getElementById("seccionConfig")
    };

    async function cambiarPantalla(idLink) {
        Object.values(secciones).forEach(s => s?.classList.add("hidden"));
        const activa = secciones[idLink];
        if (activa) {
            activa.classList.remove("hidden");
            if (idLink === "linkClientes") await renderClientes();
            if (idLink === "linkProductos") await renderProductos();
            if (idLink === "linkVentas") await renderHistorialVentas();
        }
    }

    document.querySelector("nav").onclick = (e) => {
        const link = e.target.closest("a");
        if (link) { e.preventDefault(); cambiarPantalla(link.id); }
    };

    // 3. GESTIÓN DE MODALES
    document.getElementById("btnAbrirModalCliente").onclick = () => toggleModal("modalCliente");
    document.getElementById("btnAbrirModalProducto").onclick = () => toggleModal("modalProducto");
    document.getElementById("btnAbrirModal").onclick = () => toggleModal("modalVenta");

    document.querySelectorAll("[id^='btnCerrarModal']").forEach(btn => {
        btn.onclick = () => toggleModal(btn.closest("[id^='modal']").id, false);
    });

    // 4. LÓGICA DE VENTAS (CARRITO)
    const formVenta = document.getElementById("formVenta");
    formVenta.onsubmit = async (e) => {
        e.preventDefault();
        const desc = document.getElementById("inputProducto").value;
        const cant = Number(document.getElementById("inputCantidad").value);
        const precio = Number(document.getElementById("inputPrecio").value);

        const prods = await obtenerProductos();
        const pDB = prods.find(p => p.descripcion === desc);

        if (!pDB || cant > pDB.stock) return alert("⚠️ Stock insuficiente");

        agregarAlCarrito({ id: pDB.id, producto: desc, precio, cantidad: cant });
        renderCarritoUI();
        formVenta.reset();
    };

    document.getElementById("btnConfirmar").onclick = async () => {
        if (carrito.length === 0) return alert("Carrito vacío");

        for (const item of carrito) { await descontarStock(item.id, item.cantidad); }

        const ok = await finalizarVentaAPI({
            cliente: document.getElementById("inputCliente").value || "Consumidor Final",
            total: carrito.reduce((acc, i) => acc + i.subtotal, 0),
            fecha: new Date().toISOString()
        });

        if (ok) {
            alert("✅ Venta exitosa");
            limpiarCarrito();
            renderCarritoUI();
            toggleModal("modalVenta", false);
            await renderHistorialVentas();
        }
    };

    // 5. GESTIÓN DE CLIENTES (FORMULARIO)
    document.getElementById("formCliente").onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById("clienteId").value;
        const datos = {
            nombre: document.getElementById("clienteNombre").value,
            apellido: document.getElementById("clienteApellido").value,
            cuit: document.getElementById("clienteCuit").value,
            saldo: 0 // O el valor inicial que definas
        };

        if (await guardarCliente(datos, id)) {
            alert("✅ Cliente guardado");
            toggleModal("modalCliente", false);
            await renderClientes();
        }
    };

    // 6. BUSCADOR DE PRODUCTOS
    document.getElementById("buscarProducto").oninput = async (e) => {
        const txt = e.target.value.toLowerCase();
        const prods = await obtenerProductos();
        const filtrados = prods.filter(p => p.descripcion.toLowerCase().includes(txt) || p.codigo.includes(txt));
        renderProductos(filtrados);
    };

    // Carga inicial
    await renderProductos();
    await verificarStockBajo();
});