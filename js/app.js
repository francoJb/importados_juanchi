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
  document.getElementById("prodCodigo").value = p.codigo;
  document.getElementById("prodDescripcion").value = p.descripcion;
  document.getElementById("prodMarca").value = p.marca;
  document.getElementById("prodModelo").value = p.modelo;
  document.getElementById("prodCategoria").value = p.categoria;
  document.getElementById("prodCosto").value = p.costo;
  document.getElementById("prodPrecio").value = p.precio;
  document.getElementById("prodStock").value = p.stock;
  document.getElementById("prodStockMinimo").value = p.stock_minimo;
  document.getElementById("prodProveedor").value = p.proveedor;
  document.getElementById("prodIva").value = p.iva;
  document.getElementById("prodImagen").value = p.imagen_url;
  document.getElementById("prodControlStock").value = p.controlar_stock;
  toggleModal("modalProducto", true);
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

  const btnRegistrarCobro = document.getElementById("btnRegistrarCobro");

  btnRegistrarCobro.onclick = async () => {
      const id = document.getElementById("clienteId").value;
      const saldoActual = parseFloat(document.getElementById("clienteSaldo").innerText.replace("$ ", ""));

      if (!id) return alert("❌ Primero selecciona un cliente existente.");
      if (saldoActual <= 0) return alert("✅ Este cliente no tiene deuda.");

      const montoCobro = prompt(`El saldo es $${saldoActual}. ¿Cuánto entrega el cliente?`);
      const monto = parseFloat(montoCobro);

      if (monto > 0 && monto <= saldoActual) {
          // 1. Enviamos el cobro al servidor (necesitaremos una ruta nueva)
          const res = await fetch(`http://localhost:3000/clientes/${id}/cobrar`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ monto })
          });

          if (res.ok) {
              alert("✅ Cobro registrado correctamente.");
              // 2. Actualizamos la visual del saldo sin cerrar el modal
              const nuevoSaldo = saldoActual - monto;
              document.getElementById("clienteSaldo").innerText = `$ ${nuevoSaldo.toFixed(2)}`;
              await cargarClientes(); // Recarga la tabla de fondo
          }
      } else {
          alert("❌ Monto inválido. Debe ser mayor a 0 y no mayor al saldo.");
      }
  };








const inputBuscar = document.getElementById("buscarProducto");
  if (inputBuscar) {
    inputBuscar.addEventListener("input", async (e) => {
      const texto = e.target.value.toLowerCase().trim();
      // 1. Obtenemos todos los productos (puedes usar una variable global si ya los tienes)
      const productos = await obtenerProductos(); 
      // 2. Filtramos por múltiples campos
      const filtrados = productos.filter(p => 
        p.descripcion?.toLowerCase().includes(texto) ||
        p.marca?.toLowerCase().includes(texto) ||
        p.modelo?.toLowerCase().includes(texto)||
        p.categoria?.toLowerCase().includes(texto) ||
        p.codigo?.toLowerCase().includes(texto)
      );
      // 3. Volvemos a dibujar la tabla con los resultados filtrados
      // Pasamos 'filtrados' a tu función de renderizado
      renderProductos(filtrados); 
    });
  }


  const inputPrecio = document.getElementById("prodPrecio");
  const inputCosto = document.getElementById("prodCosto");
  const avisoMargen = document.getElementById("avisoMargen");
  function validarMargen() {
    const precio = Number(inputPrecio.value);
    const costo = Number(inputCosto.value);
    // Si el precio es menor al costo (y ambos tienen valor), mostramos el aviso
    if (precio > 0 && costo > 0 && precio < costo) {
      avisoMargen.classList.remove("hidden");
      inputPrecio.classList.add("border-red-500", "ring-1", "ring-red-500");
    } else {
      avisoMargen.classList.add("hidden");
      inputPrecio.classList.remove("border-red-500", "ring-1", "ring-red-500");
    }
  }
  // Escuchamos cuando escribís en cualquiera de los dos
  inputPrecio.addEventListener("input", validarMargen);
  inputCosto.addEventListener("input", validarMargen);



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
        producto: producto.descripcion,
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
      p.descripcion.toLowerCase().includes(texto)
    );
    filtrados.forEach(p => {
      const div = document.createElement("div");
      div.className = "p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600";
      div.textContent = `${p.descripcion} (stock: ${p.stock})`;
      div.addEventListener("click", () => {
        inputProducto.value = p.descripcion;
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
      const descripcionProducto = document.getElementById("inputProducto").value;
      const precio = Number(document.getElementById("inputPrecio").value);
      const cantidad = Number(document.getElementById("inputCantidad").value);

      // 1. Validar stock antes de agregar al carrito
      const productos = await obtenerProductos();
      const productoDB = productos.find(p => p.descripcion === descripcionProducto);

      if (!productoDB || cantidad > productoDB.stock) {
        alert("⚠️ Stock insuficiente o producto no encontrado");
        return;
      }

      // 2. Agregar al carrito
      const item = { 
        id: productoDB.id, 
        producto: descripcionProducto, 
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
    const productoDB = productos.find(p => p.descripcion === producto);
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
      const descripcion = document.getElementById("prodDescripcion").value;
      const marca = document.getElementById("prodMarca").value;
      const modelo = document.getElementById("prodModelo").value;
      const categoria = document.getElementById("prodCategoria").value;
      const costo = Number(document.getElementById("prodCosto").value);
      const precio = Number(document.getElementById("prodPrecio").value);
      const stock = Number(document.getElementById("prodStock").value);
      const stock_minimo = Number(document.getElementById("prodStockMinimo").value);
      const proveedor = document.getElementById("prodProveedor").value;
      const iva =Number(document.getElementById("prodIva").value);
      const imagen_url = document.getElementById("prodImagen").value;
      const controlar_stock = document.getElementById("prodControlStock").checked ? 1 : 0;


      let ok;

      // 2. Decidimos si editamos o agregamos usando las funciones de la API
      if (id) {
        // Si hay ID, editamos el existente
        ok = await apiEditarProducto(id, codigo, descripcion, marca, modelo, categoria, costo, precio, stock, stock_minimo, proveedor, iva, imagen_url, controlar_stock, id);
        await renderProductos(); // Refrescamos la tabla
      } else {
        // Si no hay ID, creamos uno nuevo
        ok = await apiAgregarProducto(codigo, descripcion, marca, modelo, categoria, costo, precio, stock, stock_minimo, proveedor, iva, imagen_url, controlar_stock);
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



