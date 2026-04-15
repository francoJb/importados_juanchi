// ==========================================
// 2. UTILIDADES GENERALES (UI Y NAVEGACIÓN)
// ==========================================
export const toggleModal = (id, mostrar = true) => {
    const modal = document.getElementById(id);
    modal.classList.toggle("hidden", !mostrar);
    modal.classList.toggle("flex", mostrar);
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
   
    const headerVentas = document.getElementById("headerVentas");
    if (headerVentas) {
        if (idSeccionDestino === "pantallaGenerarVenta") {
            headerVentas.classList.add("hidden");
        } else {
            headerVentas.classList.remove("hidden");
        }
    }
};

window.cambiarSeccion = cambiarSeccion;
window.toggleModal = toggleModal;