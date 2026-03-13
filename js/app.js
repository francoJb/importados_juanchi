import { guardarVenta } from "./ventas.js";
import { renderCarrito } from "./ui.js";
import { renderVentas } from "./renderventas.js";
import { descontarStock } from "./productos.js";
import { obtenerProductos } from "./productos.js";
import { agregarProducto } from "./productos.js";
import { eliminarProducto, editarProducto } from "./productos.js";
import { renderProductos } from "./renderproductos.js";
import { initNavigation } from "./modules/navigation.js";
import { cargarClientes, guardarCliente } from "./modules/clientesUi.js";
import { cargarCategorias, verificarStockBajo, cargarProductosSelect, initAutocomplete } from "./modules/productosUI.js";


window.eliminarProducto = async function(index){
    await eliminarProducto(index);
    renderProductos();
};


window.editarProducto = async function(id){
  const nombre = prompt("Nuevo nombre:");
  const marca = prompt("Marca:");
  const modelo = prompt("Modelo:");
  const categoria = prompt("Categoria:");
  const precio = Number(prompt("Precio:"));
  const stock = Number(prompt("Stock:"));
  await editarProducto(id, nombre, marca, modelo, categoria, precio, stock);
  renderProductos();
};


document.addEventListener("DOMContentLoaded", async () => {
  
  await cargarCategorias();
  await verificarStockBajo();
  initAutocomplete();
  initNavigation();

 
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
  const seccionVentas = document.getElementById("seccionVentas");
  const linkProductos = document.getElementById("linkProductos");
  const buscarProducto = document.getElementById("buscarProducto");  

  linkProductos.addEventListener("click", () => {
    seccionDashboard.classList.add("hidden");
    seccionClientes.classList.add("hidden");
    seccionVentas.classList.add("hidden");
    seccionProductos.classList.remove("hidden");
  });


  
  if(buscarProducto){
    buscarProducto.addEventListener("input", () => {
        const texto = document.getElementById("buscarProducto").value;
        renderProductos(filtroCategoria.value, texto);
      });
  }     


  const filtroCategoria = document.getElementById("filtroCategoria");
  if(filtroCategoria){
   filtroCategoria.addEventListener("change", () => {
      renderProductos(filtroCategoria.value);
    });
  }


  const inputProducto = document.getElementById("inputProducto");
  const sugerencias = document.getElementById("sugerenciasProductos");
  inputProducto.addEventListener("input", async () => {
    const texto = inputProducto.value.toLowerCase();
    const productos = await obtenerProductos();
    sugerencias.innerHTML = "";
    if(texto.length === 0){
      sugerencias.classList.add("hidden");
      return;
    }
    const filtrados = productos.filter(p =>
      p.nombre.toLowerCase().includes(texto)
    );
    filtrados.forEach(p => {
      const div = document.createElement("div");
      div.className = "p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600";
      div.textContent = `${p.nombre} (stock: ${p.stock})`;
      div.addEventListener("click", () => {
        inputProducto.value = p.nombre;
        document.getElementById("inputPrecio").value = p.precio;
        sugerencias.classList.add("hidden");
      });
      sugerencias.appendChild(div);
    });
    sugerencias.classList.remove("hidden");
  });

  
  
  btnAbrirModal.addEventListener("click", () => {
    cargarProductosSelect();
    modal.classList.remove("hidden");
  });
  
  btnCerrarModalCliente.addEventListener("click", () => {
    modalCliente.classList.add("hidden")
  })


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

  const selectProducto = document.getElementById("inputProducto");
  selectProducto.addEventListener("change", async () => {
    const productos = await obtenerProductos();
    const nombre = selectProducto.value;
    const producto = productos.find(p => p.nombre === nombre);
    if(producto){
      document.getElementById("inputPrecio").value = producto.precio;
    }
  });  
  

  const form = document.getElementById("formVenta");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const producto = document.getElementById("inputProducto").value;
    const precio = Number(document.getElementById("inputPrecio").value);
    const cantidad = Number(document.getElementById("inputCantidad").value);
    const productos = await obtenerProductos();
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

  btnConfirmar.addEventListener("click", async () => {
  if (carrito.length === 0) return;
  let total = 0;
  carrito.forEach(p => {
    total += p.precio * p.cantidad;
  });
  const cliente = document.getElementById("inputCliente").value;
  guardarVenta(carrito, total, cliente);
  await descontarStock(carrito);
  renderVentas();
  carrito = [];
  renderCarrito(carrito);
  modal.classList.add("hidden");
  });

  const formProducto = document.getElementById("formProducto");
  if (formProducto) {
    formProducto.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nombre = document.getElementById("prodNombre").value;
      const marca = document.getElementById("prodMarca").value;
      const modelo = document.getElementById("prodModelo").value;
      const categoria = document.getElementById("prodCategoria").value;
      const precio = Number(document.getElementById("prodPrecio").value);
      const stock = Number(document.getElementById("prodStock").value);
      await agregarProducto(nombre, marca, modelo, categoria, precio, stock);
      renderProductos();
      formProducto.reset();
    });
  }
    


  cargarClientes();
  renderProductos();
  await verificarStockBajo();
  await cargarCategorias();
  
  
});



