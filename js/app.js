import { guardarVenta } from "./ventas.js";
import { renderCarrito } from "./ui.js";
import { renderVentas } from "./renderventas.js";
import { descontarStock } from "./productos.js";
import { obtenerProductos } from "./productos.js";
import { agregarProducto as apiAgregarProducto } from "./productos.js";
import { eliminarProducto as apiEliminarProducto, editarProducto as apiEditarProducto } from "./productos.js";
import { renderProductos } from "./renderproductos.js";
import { cargarClientes, guardarCliente } from "./modules/clientesUi.js";
import { verificarStockBajo } from "./modules/productosUi.js";




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
  document.getElementById("prodCategoria").value = p.categoria;
  document.getElementById("prodPrecio").value = p.precio;
  document.getElementById("prodStock").value = p.stock;
  document.getElementById("prodStockMinimo").value = p.stock_minimo;
  modalProducto.classList.remove("hidden");
}; 



document.addEventListener("DOMContentLoaded", async () => {

  // Lógica de Modo Oscuro centralizada
  const btnDarkMode = document.getElementById("btnDarkMode");
  const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("darkMode", isDark);
  };
  // Cargar preferencia al iniciar
  if (localStorage.getItem("darkMode") === "true") {
    document.documentElement.classList.add("dark");
  }
  btnDarkMode.addEventListener("click", toggleDarkMode);

  const secciones = {
    linkDashboard: document.getElementById("seccionDashboard"),
    linkClientes: document.getElementById("seccionClientes"),
    linkProductos: document.getElementById("seccionProductos"),
    linkVentas: document.getElementById("seccionVentas"),
    linkConfig: document.getElementById("seccionConfig")
  };

  // Función para cambiar de pantalla
  async function cambiarPantalla(idLink) {
    // Ocultar todas
    Object.values(secciones).forEach(s => s?.classList.add("hidden"));
    // Mostrar la seleccionada
    const seccionActiva = secciones[idLink];
    if (seccionActiva) {
      seccionActiva.classList.remove("hidden");

      // Cargar datos según la sección
      if (idLink === "linkClientes") await cargarClientes();
      if (idLink === "linkProductos") await renderProductos();
      if (idLink === "linkVentas") await renderVentas();
    }
  }
  // Escuchar clics en el menú lateral
  document.querySelector("nav").addEventListener("click", (e) => {
    const link = e.target.closest("a"); // Busca el <a> más cercano al clic
    if (link) {
      e.preventDefault();
      cambiarPantalla(link.id);
    }
  });

  // Función universal para abrir/cerrar cualquier modal
  function toggleModal(idModal, mostrar = true) {
    const modal = document.getElementById(idModal);
    if (!modal) return;
    if (mostrar) {
      modal.classList.remove("hidden");
      modal.classList.add("flex"); // Para que el centrado de Tailwind funcione
    } else {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }
  }

  // Abrir modales
  document.getElementById("btnAbrirModalCliente").onclick = () => toggleModal("modalCliente");
  document.getElementById("btnAbrirModalProducto").onclick = () => toggleModal("modalProducto");
  document.getElementById("btnAbrirModal").onclick = () => toggleModal("modalVenta");
  
  // Cerrar modales (buscamos todos los botones que cierran)
  document.querySelectorAll("[id^='btnCerrarModal']").forEach(btn => {
    btn.onclick = (e) => {
      const modalId = e.target.closest("[id^='modal']").id;
      toggleModal(modalId, false);
    };
  });


  // Seleccionamos todos los modales (los que tienen la clase 'fixed')
  document.querySelectorAll('.fixed').forEach(modal => {
    modal.addEventListener('click', (e) => {
      // 'e.target' es donde hiciste clic. 'modal' es el fondo.
      // Si son lo mismo, significa que hiciste clic FUERA del cuadro blanco.
      if (e.target === modal) {
        toggleModal(modal.id, false);
      }
    });
  });



  async function cargarSugerenciasCategorias() {
    const productos = await obtenerProductos();
    const datalist = document.getElementById("listaCategorias");
    if (!datalist || !Array.isArray(productos)) return;

    // Extraemos categorías únicas de los productos que ya tenés
    const categoriasUnicas = [...new Set(productos.map(p => p.categoria).filter(c => c))];
    
    datalist.innerHTML = categoriasUnicas.map(cat => 
        `<option value="${cat}">`
    ).join("");
  }


  await verificarStockBajo();


 

  const btnGuardarCliente = document.getElementById("btnGuardarCliente")
  btnGuardarCliente.addEventListener("click", guardarCliente);
  const modal = document.getElementById("modalVenta");
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

    
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      modal.classList.add("hidden");
    }
  });

  // Variable global para el carrito (aseguramos que esté declarada una sola vez)
  let carrito = [];
  const formVenta = document.getElementById("formVenta");
  if (formVenta) {
    formVenta.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nombreProducto = document.getElementById("inputProducto").value;
      const precio = Number(document.getElementById("inputPrecio").value);
      const cantidad = Number(document.getElementById("inputCantidad").value);

      // 1. Validar stock antes de agregar al carrito
      const productos = await obtenerProductos();
      const productoDB = productos.find(p => p.nombre === nombreProducto);

      if (!productoDB || cantidad > productoDB.stock) {
        alert("⚠️ Stock insuficiente o producto no encontrado");
        return;
      }

      // 2. Agregar al carrito
      const item = { 
        id: productoDB.id, 
        producto: nombreProducto, 
        precio, 
        cantidad,
        subtotal: precio * cantidad 
      };
          
      carrito.push(item);
          
      // 3. Dibujar el carrito en el HTML
      renderCarrito(carrito);
          
      // 4. Limpiar el formulario para el siguiente producto
      formVenta.reset();
    });
  }
  
  

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

  const btnConfirmar = document.getElementById("btnConfirmar");

  if (btnConfirmar) {
    btnConfirmar.onclick = async () => {
      // 1. Validar que el carrito no esté vacío
      if (carrito.length === 0) {
        alert("🛒 El carrito está vacío. Agregá productos antes de confirmar.");
        return;
      }
      try {
        // 2. Descontar stock de cada producto en el carrito
        // Usamos un bucle para procesar cada item
        for (const item of carrito) {
          // Buscamos el ID real del producto (asegurate que 'item' tenga el .id)
          await descontarStock(item.id, item.cantidad);
        }
        // 3. Preparar los datos de la venta para el servidor
        const nuevaVenta = {
          cliente: document.getElementById("inputCliente")?.value || "Consumidor Final",
          total: carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0),
          fecha: new Date().toISOString()
        };

        // 4. Guardar la venta en la Base de Datos
        const respuesta = await fetch("http://localhost:3000/ventas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nuevaVenta)
        });

        if (respuesta.ok) {
          alert("✅ ¡Venta realizada con éxito!");
                  
          // 5. Limpieza total después del éxito
          carrito = []; // Vaciamos el carrito
          renderCarrito(carrito); // Limpiamos la tabla visual
          toggleModal("modalVenta", false); // Cerramos el modal
                  
          // 6. Actualizar las tablas de fondo (opcional)
          if (typeof renderProductos === "function") await renderProductos();
          if (typeof renderVentas === "function") await renderVentas();
        }

      } catch (error) {
        console.error("Error al procesar la venta:", error);
        alert("❌ Hubo un problema al procesar la venta. Revisá la consola.");
      }
    };
  }


  const formProducto = document.getElementById("formProducto");

  if (formProducto) {
    formProducto.addEventListener("submit", async (e) => {
      e.preventDefault();

      // 1. Capturamos los datos
      const id = document.getElementById("prodId").value;
      const codigo = document.getElementById("prodCodigo").value;
      const nombre = document.getElementById("prodNombre").value;
      const marca = document.getElementById("prodMarca").value;
      const modelo = document.getElementById("prodModelo").value;
      const categoria = document.getElementById("prodCategoria").value;
      const precio = Number(document.getElementById("prodPrecio").value);
      const stock = Number(document.getElementById("prodStock").value);
      const stock_minimo = Number(document.getElementById("prodStockMinimo").value);

      let ok;

      // 2. Decidimos si editamos o agregamos usando las funciones de la API
      if (id) {
        // Si hay ID, editamos el existente
        ok = await apiEditarProducto(id, nombre, marca, modelo, categoria, precio, stock, stock_minimo);
        await renderProductos(); // Refrescamos la tabla
      } else {
        // Si no hay ID, creamos uno nuevo
        ok = await apiAgregarProducto(codigo, nombre, marca, modelo, categoria, precio, stock, stock_minimo);
      }

      // 3. Si la operación fue exitosa, limpiamos y cerramos
      if (ok) {
        await renderProductos(); // Refrescamos la tabla
        formProducto.reset(); // Vaciamos el formulario
        document.getElementById("prodId").value = ""; // Limpiamos el ID oculto
        modalProducto.classList.add("hidden"); // Cerramos el modal
        alert("✅ Producto guardado correctamente");
      }
    });
  }

    


  cargarClientes();
  await renderProductos();
  await verificarStockBajo();
  await cargarSugerenciasCategorias();

  
});



