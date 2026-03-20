// js/app.js
import { fetchProductos, guardarProductoAPI } from "./productos.js";
import { dibujarProductos } from "./renderproductos.js";

// --- UTILIDADES DE UI ---
const toggleModal = (id, mostrar = true) => {
    const modal = document.getElementById(id);
    modal.classList.toggle("hidden", !mostrar);
    modal.classList.toggle("flex", mostrar);
};

// Función global para cargar datos en el modal
window.prepararEdicion = async (id) => {
    const productos = await fetchProductos();
    const p = productos.find(prod => prod.id == id);
    
    if (!p) return;

    // Llenamos el formulario con los datos guardados
    document.getElementById("prodId").value = p.id;
    document.getElementById("prodCodigo").value = p.prodCodigo;
    document.getElementById("prodDescripcion").value = p.prodDescripcion;
    document.getElementById("prodMarca").value = p.prodMarca;
    document.getElementById("prodModelo").value = p.prodModelo;
    document.getElementById("prodPrecio").value = p.prodPrecio;
    document.getElementById("prodCosto").value = p.prodCosto;
    document.getElementById("prodStock").value = p.prodStock;
    document.getElementById("prodStockMinimo").value = p.prodStockMinimo;
    document.getElementById("prodControlStock").checked = p.prodControlStock;

    // Abrimos el modal
    const modal = document.getElementById("modalProducto");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
};



// --- AL CARGAR EL DOCUMENTO ---
document.addEventListener("DOMContentLoaded", async () => {
    
    // 1. CARGA INICIAL
    const productos = await fetchProductos();
    dibujarProductos(productos);

    // 2. NAVEGACIÓN (Solo para que puedas ver la sección de Inventario)
    const linkProductos = document.getElementById("linkProductos");
    const seccionProductos = document.getElementById("seccionProductos");
    const seccionDashboard = document.getElementById("seccionDashboard");

    linkProductos.onclick = () => {
        seccionDashboard.classList.add("hidden");
        seccionProductos.classList.remove("hidden");
    };

    // 3. ABRIR/CERRAR MODAL
    document.getElementById("btnAbrirModalProducto").onclick = () => {
        document.getElementById("formProducto").reset();
        document.getElementById("prodId").value = ""; // Limpiar ID por si es nuevo
        toggleModal("modalProducto", true);
    };

    document.getElementById("btnCerrarModalProducto").onclick = () => toggleModal("modalProducto", false);

    // 4. GUARDAR PRODUCTO (EVENTO SUBMIT)
    const formProducto = document.getElementById("formProducto");
    formProducto.onsubmit = async (e) => {
        e.preventDefault();

        const id = document.getElementById("prodId").value;
        
        // Capturamos los datos usando los IDs exactos de tu HTML
        const datos = {
            prodCodigo: document.getElementById("prodCodigo").value,
            prodDescripcion: document.getElementById("prodDescripcion").value,
            prodMarca: document.getElementById("prodMarca").value,
            prodModelo: document.getElementById("prodModelo").value,
            prodProveedor: document.getElementById("prodProveedor").value,
            prodCategoria: document.getElementById("prodCategoria").value,
            prodCosto: Number(document.getElementById("prodCosto").value),
            prodPrecio: Number(document.getElementById("prodPrecio").value),
            prodStock: Number(document.getElementById("prodStock").value),
            prodStockMinimo: Number(document.getElementById("prodStockMinimo").value),
            prodControlStock: document.getElementById("prodControlStock").checked
        };

        const exito = await guardarProductoAPI(datos, id || null);

        if (exito) {
            alert("✅ Producto guardado correctamente");
            toggleModal("modalProducto", false);
            formProducto.reset();
            
            // Recargar la tabla
            const productosActualizados = await fetchProductos();
            dibujarProductos(productosActualizados);
        } else {
            alert("❌ Error al guardar el producto");
        }
    };


    // --- LÓGICA DEL BUSCADOR ---
    const inputBusqueda = document.getElementById("buscarProducto");

    inputBusqueda.oninput = async (e) => {
        const termino = e.target.value.toLowerCase();
        const todosLosProductos = await fetchProductos(); // Traemos la lista fresca
        
        const filtrados = todosLosProductos.filter(p => 
            p.prodDescripcion.toLowerCase().includes(termino) || 
            p.prodCodigo.toLowerCase().includes(termino) ||
            p.prodMarca.toLowerCase().includes(termino)
        );
        
        dibujarProductos(filtrados); // Volvemos a dibujar solo los que coinciden
    };



    // 5. MODO OSCURO (Básico para que no te moleste la vista)
    const btnDarkMode = document.getElementById("btnDarkMode");
    btnDarkMode.onclick = () => document.documentElement.classList.toggle("dark");
});