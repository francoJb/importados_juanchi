import { initNavigation, mostrarSeccion } from "./modules/navigation.js";
import { guardarVenta } from "./ventas.js";
import { renderCarrito } from "./ui.js";
import { renderVentas } from "./renderventas.js";
import { descontarStock } from "./productos.js";
import { obtenerProductos } from "./productos.js";
import { agregarProducto as apiAgregarProducto } from "./productos.js";
import { eliminarProducto as apiEliminarProducto, editarProducto as apiEditarProducto } from "./productos.js";
import { renderProductos } from "./renderproductos.js";
import { cargarClientes, guardarCliente } from "./modules/clientesUi.js";
import { cargarCategorias, verificarStockBajo, cargarProductosSelect, initAutocomplete } from "./modules/productosUi.js";


window.eliminarProducto = async function(id){
    const confirmar =confirm("¿Desea desactivar este producto?");
    if(!confirmar) return;
    await apiEliminarProducto(id);
    await renderProductos();
};


window.editarProducto = async function(id){
  const productos = await obtenerProductos();
  const p = productos.find(prod => prod.id == id);
  document.getElementById("prodId").value = p.id;
  document.getElementById("prodNombre").value = p.nombre;
  document.getElementById("prodMarca").value = p.marca;
  document.getElementById("prodModelo").value = p.modelo;
  await cargarCategorias();
  document.getElementById("prodCategoria").value = p.categoria;
  document.getElementById("prodPrecio").value = p.precio;
  document.getElementById("prodStock").value = p.stock;
  document.getElementById("prodStockMinimo").value = p.stock_minimo;
  modalProducto.classList.remove("hidden");
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
  const btnAbrirModalProducto = document.getElementById("btnAbrirModalProducto");
  const btnCerrarModalProducto = document.getElementById("btnCerrarModalProducto");
  const modalProducto = document.getElementById("modalProducto");
  const inputCodigo = document.getElementById("inputCodigoBarras");


  if(inputCodigo){
    inputCodigo.addEventListener("change", async () => {
      const codigo = inputCodigo.value;
      const productos = await obtenerProductos();
      const producto = productos.find(p => p.codigo == codigo);
      if(!producto){
        alert("Producto no encontrado");
        inputCodigo.value = "";
        return;
      }
      const item = {
        producto: producto.nombre,
        precio: producto.precio,
        cantidad: 1
      };
      carrito.push(item);
      renderCarrito(carrito);
      inputCodigo.value = "";
    });
  }
  

  linkProductos.addEventListener("click", async () => {
    mostrarSeccion(document.getElementById("seccionProductos"));
    await renderProductos();
  });


  async function cargarCategoriasProductos(){
    const productos = await obtenerProductos();
    const select = document.getElementById("prodCategoria");
    if(!select) return;
    const categorias = [...new Set(productos.map(p => p.categoria))];
    select.innerHTML = `<option value="">Seleccionar categoría</option>`;
    categorias.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      select.appendChild(option);
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

  btnAbrirModalProducto.addEventListener("click", async () => {
    await cargarCategoriasProductos();
    const form = document.getElementById("formProducto");
    form.reset();
    document.getElementById("prodId").value = "";
    modalProducto.classList.remove("hidden");
  })

  btnCerrarModalProducto.addEventListener("click", () => {
    modalProducto.classList.add("hidden");
  })
  
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

  const selectCuotas = document.getElementById("cuotas");
  const valorCuota = document.getElementById("valorCuota");
  if(selectCuotas){
    selectCuotas.addEventListener("change", calcularCuota);
  }
  
  function calcularCuota(){
    const cuotas = Number(document.getElementById("cuotas").value);
    let total = 0;
    carrito.forEach(p => {
      total += p.precio * p.cantidad;
    });
    const cuota = total / cuotas;
    const valorCuota = document.getElementById("valorCuota");
    valorCuota.textContent = `$${cuota.toLocaleString()} por cuota`;
  }

  btnConfirmar.addEventListener("click", async () => {
  if (carrito.length === 0) return;
  let total = 0;
  carrito.forEach(p => {
    total += p.precio * p.cantidad;
  });
  const cliente = document.getElementById("inputCliente").value;
  const formaPago = document.getElementById("formaPago").value;
  const cuotas = Number(document.getElementById("cuotas").value);
  guardarVenta(carrito, total, cliente, formaPago, cliente);
  await descontarStock(carrito);
  renderVentas();
  carrito = [];
  renderCarrito(carrito);
  calcularCuota();
  modal.classList.add("hidden");
  });

  const formProducto = document.getElementById("formProducto");
  if (formProducto) {
    formProducto.addEventListener("submit", async (e) => {
      e.preventDefault();
      const codigo = document.getElementById("prodCodigo").value;
      const id = document.getElementById("prodId").value;
      const nombre = document.getElementById("prodNombre").value;
      const marca = document.getElementById("prodMarca").value;
      const modelo = document.getElementById("prodModelo").value;
      const categoria = document.getElementById("prodCategoria").value;
      const precio = Number(document.getElementById("prodPrecio").value);
      const stock = Number(document.getElementById("prodStock").value);
      const stock_minimo = Number(document.getElementById("prodStockMinimo").value);
      let ok;
      if(id){
        ok = true; // podés mejorar esto después
        await apiEditarProducto(id, nombre, marca, modelo, categoria, precio, stock, stock_minimo);
      }else{
        ok = await apiAgregarProducto(codigo, nombre, marca, modelo, categoria, precio, stock, stock_minimo);
      }
      // 🔴 SOLO si salió bien
      if(ok){
        await renderProductos();
        mostrarSeccion(document.getElementById("seccionProductos")); // 🔥 ACÁ
        formProducto.reset();
        document.getElementById("prodId").value = "";
        modalProducto.classList.add("hidden");
      }
    });
  }
    


  cargarClientes();
  await renderProductos();
  await verificarStockBajo();
  await cargarCategorias();
  
  
});



