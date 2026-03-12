import { guardarVenta } from "./ventas.js";
import { renderCarrito } from "./ui.js";
import { renderVentas } from "./renderventas.js";
import { descontarStock } from "./productos.js";
import { obtenerProductos } from "./productos.js";
import { agregarProducto } from "./productos.js";
import { renderProductos } from "./renderproductos.js";
import { eliminarProducto, editarProducto } from "./productos.js";

window.eliminarProducto = function(index){
    eliminarProducto(index);
    renderProductos();
  };

 window.editarProducto = function(index){
  const nombre = prompt("Nuevo nombre:");
  const precio = Number(prompt("Nuevo precio:"));
  const stock = Number(prompt("Nuevo stock:"));
  if(!nombre) return;
  editarProducto(index, nombre, precio, stock);
  renderProductos();
};





document.addEventListener("DOMContentLoaded", () => {
  const linkDashboard = document.getElementById("linkDashboard");
  const linkClientes = document.getElementById("linkClientes");
  const seccionDashboard = document.getElementById("seccionDashboard");
  const seccionClientes = document.getElementById("seccionClientes");
  const seccionProductos = document.getElementById("seccionProductos");
  const btnDarkMode = document.getElementById("btnDarkMode");
  const btnAbrirModalCliente = document.getElementById("btnAbrirModalCliente")
  const modalCliente = document.getElementById("modalCliente")
  const btnCerrarModalCliente = document.getElementById("btnCerrarModalCliente")
  const btnGuardarCliente = document.getElementById("btnGuardarCliente")
  btnGuardarCliente.addEventListener("click", guardarCliente);
  const modal = document.getElementById("modalVenta");
  const btnAbrirModal = document.getElementById("btnAbrirModal");
  const btnCerrarModal = document.getElementById("btnCerrarModal");
  const btnConfirmar = document.getElementById("btnConfirmar");
  const linkVentas = document.getElementById("linkVentas");
  const seccionVentas = document.getElementById("seccionVentas");
  const linkProductos = document.getElementById("linkProductos");
  


  linkProductos.addEventListener("click", () => {
    seccionDashboard.classList.add("hidden");
    seccionClientes.classList.add("hidden");
    seccionVentas.classList.add("hidden");
    seccionProductos.classList.remove("hidden");
  });

 

 
  async function cargarClientes() {
      const respuesta = await fetch("http://localhost:3000/clientes");
      const clientes = await respuesta.json();

      const tabla = document.getElementById("listaClientes");
      if (!tabla) return;
      tabla.innerHTML = "";

      clientes.forEach(cliente => {
          const fila = document.createElement("tr");

          fila.innerHTML = `
              <td>${cliente.id}</td>
              <td>${cliente.nombre}</td>
              <td>${cliente.apellido}</td>
              <td>${cliente.dni}</td>
              <td>${cliente.direccion}</td>
              <td>${cliente.telefono}</td>
              <td>${cliente.email}</td>
            `;

          tabla.appendChild(fila);
      });
  }

  async function guardarCliente() {
    const nombre = document.getElementById("inputNombreCliente").value;
    const apellido = document.getElementById("inputApellidoCliente").value;
    const dni = document.getElementById("inputDniCliente").value;
    const direccion = document.getElementById("inputDireccionCliente").value;
    const telefono = document.getElementById("inputTelefonoCliente").value;
    const email = document.getElementById("inputEmailCliente").value;

    const respuesta = await fetch("http://localhost:3000/clientes", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            nombre,
            apellido,
            dni,
            direccion,
            telefono,
            email
        })
    });

    await respuesta.json();

    cargarClientes();
    document.getElementById("inputNombreCliente").value = "";
    document.getElementById("inputApellidoCliente").value = "";
    document.getElementById("inputDniCliente").value = "";
    document.getElementById("inputDireccionCliente").value = "";
    document.getElementById("inputTelefonoCliente").value = "";
    document.getElementById("inputEmailCliente").value = "";

    modalCliente.classList.add("hidden");
  }
 
  btnAbrirModalCliente.addEventListener("click", () => {
    modalCliente.classList.remove("hidden")
  })
  
  btnCerrarModalCliente.addEventListener("click", () => {
    modalCliente.classList.add("hidden")
  })

  function mostrarSeccion(seccion) {
  seccionDashboard.classList.add("hidden");
  seccionClientes.classList.add("hidden");
  seccionVentas.classList.add("hidden");
  seccion.classList.remove("hidden");
  }

  linkDashboard.addEventListener("click", (e) => {
    e.preventDefault();
    mostrarSeccion(seccionDashboard);
  });

  linkClientes.addEventListener("click", (e) => {
  e.preventDefault();
  mostrarSeccion(seccionClientes);
  cargarClientes();
  });
  
  linkVentas.addEventListener("click", (e) => {
  e.preventDefault();
  mostrarSeccion(seccionVentas);
  renderVentas();
  });

  function initDarkMode() {
    const darkModeGuardado = localStorage.getItem("darkMode");
    if (darkModeGuardado === "true") {
      document.documentElement.classList.add("dark");
    }
  }

  function toggleDarkMode() {
  const html = document.documentElement;
  html.classList.toggle("dark");
  const modoOscuroActivo = html.classList.contains("dark");
  localStorage.setItem("darkMode", modoOscuroActivo);
  }

  btnDarkMode.addEventListener("click", toggleDarkMode);

  initDarkMode();
    
  btnAbrirModal.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });

  btnCerrarModal.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });
    
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      modal.classList.add("hidden");
    }
  });

  let carrito = [];
  const form = document.getElementById("formVenta");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const producto = document.getElementById("inputProducto").value;
    const precio = Number(document.getElementById("inputPrecio").value);
    const cantidad = Number(document.getElementById("inputCantidad").value);
    const productos = obtenerProductos();
    const productoDB = productos.find(p => p.nombre === producto);
    if (!productoDB) {
      alert("Producto no encontrado en inventario");
      return;
    }
    if (cantidad > productoDB.stock) {
      alert("Stock insuficiente");
      return;
    }
    const item = { producto, precio, cantidad };
    carrito.push(item);
    renderCarrito(carrito);
    form.reset();
  });

  btnConfirmar.addEventListener("click", () => {
  if (carrito.length === 0) return;
  let total = 0;
  carrito.forEach(p => {
    total += p.precio * p.cantidad;
  });
  const cliente = document.getElementById("inputCliente").value;
  guardarVenta(carrito, total, cliente);
  descontarStock(carrito);
  renderVentas();
  carrito = [];
  renderCarrito(carrito);
  modal.classList.add("hidden");
  });

  const formProducto = document.getElementById("formProducto");
  if (formProducto) {
    formProducto.addEventListener("submit", (e) => {
      e.preventDefault();
      const nombre = document.getElementById("prodNombre").value;
      const precio = Number(document.getElementById("prodPrecio").value);
      const stock = Number(document.getElementById("prodStock").value);
      agregarProducto(nombre, precio, stock);
      renderProductos();
      formProducto.reset();
    });
  }

  window.eliminarProducto = function(index) {
  carrito.splice(index, 1);
  renderCarrito(carrito);
  };
  cargarClientes();
  renderProductos();
  
  
});



