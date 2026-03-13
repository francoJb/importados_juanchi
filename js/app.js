import { guardarVenta } from "./ventas.js";
import { renderCarrito } from "./ui.js";
import { renderVentas } from "./renderventas.js";
import { descontarStock } from "./productos.js";
import { obtenerProductos } from "./productos.js";
import { agregarProducto } from "./productos.js";
import { eliminarProducto, editarProducto } from "./productos.js";
import { renderProductos } from "./renderproductos.js";

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

  const buscarProducto = document.getElementById("buscarProducto");
    
  if(buscarProducto){
    buscarProducto.addEventListener("input", () => {
        const texto = document.getElementById("buscarProducto").value;
        renderProductos(filtroCategoria.value, texto);
      });
  }     



  function cargarCategorias(){
    const productos = obtenerProductos();
    const select = document.getElementById("filtroCategoria");
    if(!select) return;
    const categorias = [...new Set(productos.map(p => p.categoria))];
    categorias.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      select.appendChild(option);
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
  inputProducto.addEventListener("input", () => {
    const texto = inputProducto.value.toLowerCase();
    const productos = obtenerProductos();
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

  function verificarStockBajo(){
    const productos = obtenerProductos();
    const bajos = productos.filter(p => p.stock <= 2);
    if(bajos.length === 0) return;
    console.log("Productos con stock bajo:", bajos);
  }
 
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
 
  btnAbrirModal.addEventListener("click", () => {
    cargarProductosSelect();
    modal.classList.remove("hidden");
  });
  
  btnCerrarModalCliente.addEventListener("click", () => {
    modalCliente.classList.add("hidden")
  })

  function mostrarSeccion(seccion) {
    seccionDashboard.classList.add("hidden");
    seccionClientes.classList.add("hidden");
    seccionVentas.classList.add("hidden");
    seccionProductos.classList.add("hidden");
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

  const selectProducto = document.getElementById("inputProducto");
  selectProducto.addEventListener("change", () => {
    const productos = obtenerProductos();
    const nombre = selectProducto.value;
    const producto = productos.find(p => p.nombre === nombre);
    if(producto){
      document.getElementById("inputPrecio").value = producto.precio;
    }
  });  
  

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
      const marca = document.getElementById("prodMarca").value;
      const modelo = document.getElementById("prodModelo").value;
      const categoria = document.getElementById("prodCategoria").value;
      const precio = Number(document.getElementById("prodPrecio").value);
      const stock = Number(document.getElementById("prodStock").value);
      agregarProducto(nombre, marca, modelo, categoria, precio, stock);
      renderProductos();
      formProducto.reset();
    });
  }
    function cargarProductosSelect(){
    const productos = obtenerProductos();
    const select = document.getElementById("inputProducto");
    if(!select) return;
    select.innerHTML = "";
    productos.forEach(p => {
      const option = document.createElement("option");
      option.value = p.nombre;
      option.textContent = `${p.nombre} (stock: ${p.stock})`;
      select.appendChild(option);
    });
  }


  cargarClientes();
  renderProductos();
  verificarStockBajo();
  cargarCategorias();
  
  
});



