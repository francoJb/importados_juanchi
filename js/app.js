// js/app.js
import { fetchProductos, guardarProductoAPI } from "./productos.js";
import { dibujarProductos } from "./renderproductos.js";
import { fetchClientes, guardarClienteAPI } from "./clientes.js";
import { dibujarClientes } from "./renderclientes.js";

// --- UTILIDADES DE UI ---
const toggleModal = (id, mostrar = true) => {
    const modal = document.getElementById(id);
    modal.classList.toggle("hidden", !mostrar);
    modal.classList.toggle("flex", mostrar);
};


window.prepararEdicionProducto = async (id) => { 
    const productos = await fetchProductos(); // Traemos la lista
    const p = productos.find(prod => prod.id == id);
    if (!p) return;

    // Llenamos el formulario (lo que ya tenías)
    document.getElementById("id").value = p.id;
    document.getElementById("sku").value = p.sku;
    document.getElementById("descripcion").value = p.descripcion;
    document.getElementById("marca").value = p.marca;
    document.getElementById("modelo").value = p.modelo;
    document.getElementById("categoria").value = p.categoria; // <-- Se asigna aquí
    document.getElementById("proveedor").value = p.proveedor;
    document.getElementById("costo").value = p.costo;
    document.getElementById("precio_neto").value = p.precio_neto;
    document.getElementById("iva").value = p.iva;
    document.getElementById("control_stock").checked = p.control_stock;
    document.getElementById("stock").value = p.stock;
    document.getElementById("stock_minimo").value = p.stock_minimo;
    document.getElementById("nro_motor").value = p.nro_motor || "";
    document.getElementById("nro_chasis").value = p.nro_chasis || "";

    // --- LA PARTE NUEVA ---
    // Disparamos el evento 'change' manualmente para que el código que oculta/muestra
    // el div de chasis y motor se ejecute ahora mismo.
    document.getElementById("categoria").dispatchEvent(new Event('change'));
    // ----------------------

    // Abrimos el modal
    const modal = document.getElementById("modalProducto");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
};

window.prepararEdicionCliente = async (id) => { //carga datos modal cliente
    const cliente = await fetchClientes();
    const c = cliente.find(cli => cli.id == id);
    if (!c) return;
    // Llenamos el formulario con los datos guardados
    document.getElementById("clienteId").value = c.id;
    document.getElementById("nombre").value = c.nombre;
    document.getElementById("apellido").value = c.apellido;
    document.getElementById("dni").value = c.dni;
    document.getElementById("direccion").value = c.direccion;
    document.getElementById("email").value = c.email;
    document.getElementById("telefono").value = c.telefono;
    document.getElementById("cuit").value = c.cuit;
    document.getElementById("arca").value = c.arca;
    document.getElementById("fecha_alta").value = c.fecha_alta;

    // Abrimos el modal
    const modal = document.getElementById("modalCliente");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
};


// --- AL CARGAR EL DOCUMENTO ---
document.addEventListener("DOMContentLoaded", async () => {
    
    // 1. CARGA INICIAL
    const productos = await fetchProductos();
    dibujarProductos(productos);
    const clientes =await fetchClientes();
    dibujarClientes(clientes);

    // 2. NAVEGACIÓN (Solo para que puedas ver la sección de Inventario)
    const linkProductos = document.getElementById("linkProductos");
    const seccionProductos = document.getElementById("seccionProductos");
    const linkDashboard = document.getElementById("linkDashboard");
    const seccionDashboard = document.getElementById("seccionDashboard");
    const linkClientes = document.getElementById("linkClientes");
    const seccionClientes = document.getElementById("seccionClientes");
    const linkVentas = document.getElementById("linkVentas")
    const seccionVentas = document.getElementById("seccionVentas")

    linkDashboard.onclick = () => {
        seccionDashboard.classList.remove("hidden");
        seccionVentas.classList.add("hidden");
        seccionProductos.classList.add("hidden");
        seccionClientes.classList.add("hidden");
    };
    
    linkProductos.onclick = () => {
        seccionDashboard.classList.add("hidden");
        seccionVentas.classList.add("hidden");
        seccionClientes.classList.add("hidden");
        seccionProductos.classList.remove("hidden");
    };

    linkClientes.onclick = () => {
        seccionDashboard.classList.add("hidden");
        seccionVentas.classList.add("hidden");
        seccionProductos.classList.add("hidden");
        seccionClientes.classList.remove("hidden");
    };

    linkVentas.onclick = () => {
        seccionDashboard.classList.add("hidden");
        seccionVentas.classList.remove("hidden");
        seccionProductos.classList.add("hidden");
        seccionClientes.classList.add("hidden");
    };


    // 3. ABRIR/CERRAR MODAL PRODUTO
    document.getElementById("btnAbrirModalProducto").onclick = () => {
        document.getElementById("formProducto").reset();
        document.getElementById("id").value = ""; // Limpiar ID por si es nuevo
        toggleModal("modalProducto", true);
    };
    document.getElementById("btnCerrarModalProducto").onclick = () => toggleModal("modalProducto", false);

    // 3. ABRIR/CERRAR MODAL CLIENTE
    document.getElementById("btnAbrirModalCliente").onclick = () => {
        document.getElementById("formCliente").reset();
        document.getElementById("id").value = ""; // Limpiar ID por si es nuevo
        toggleModal("modalCliente", true);
    };
    document.getElementById("btnCerrarModalCliente").onclick = () => toggleModal("modalCliente", false);

    const categoriaSelect = document.getElementById("categoria");
    const camposVehiculo = document.getElementById("camposVehiculo");
    const inputMotor = document.getElementById("nro_motor");
    const inputChasis = document.getElementById("nro_chasis");
    function toggleCamposVehiculo() {
        const categoria = categoriaSelect.value;
        const esVehiculo = categoria === "moto" || categoria === "auto";
        camposVehiculo.style.display = esVehiculo ? "block" : "none";
        // 👉 hacer obligatorios o no
        inputMotor.required = esVehiculo;
        inputChasis.required = esVehiculo;
        // 👉 limpiar si se ocultan (MUY IMPORTANTE)
        if (!esVehiculo) {
            inputMotor.value = "";
            inputChasis.value = "";
        }
    }

    // evento al cambiar categoría
    categoriaSelect.addEventListener("change", toggleCamposVehiculo);

    // 👉 IMPORTANTE: ejecutar al cargar (modo edición)
    toggleCamposVehiculo();

    // 4. GUARDAR PRODUCTO (EVENTO SUBMIT)
    const formProducto = document.getElementById("formProducto");
    formProducto.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById("id").value;
        // Capturamos los datos usando los IDs exactos de tu HTML
        const datos = {
            sku: document.getElementById("sku").value.trim(),
            descripcion: document.getElementById("descripcion").value,
            marca: document.getElementById("marca").value,
            modelo: document.getElementById("modelo").value,   
            categoria: document.getElementById("categoria").value,
            proveedor: document.getElementById("proveedor").value,
            costo: Number(document.getElementById("costo").value),
            precio_neto: Number(document.getElementById("precio_neto").value),
            stock: Number(document.getElementById("stock").value),
            stock_minimo: Number(document.getElementById("stock_minimo").value),
            control_stock: document.getElementById("control_stock").checked ? 1 : 0,
            nro_chasis: document.getElementById("nro_chasis")?.value || null,
            nro_motor: document.getElementById("nro_motor")?.value || null
        };
        if (!datos.sku){
            alert("⚠️ El SKU es obligatorio.");
            document.getElementById("sku").focus();
            return;
        }
        if (!datos.descripcion){
            alert("⚠️ La descripcion es obligatoria.");
            document.getElementById("descripcion").focus();
            return;
        }
        
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
        // 3. ABRIR/CERRAR MODAL CLIENTE
        document.getElementById("btnAbrirModalCliente").onclick = () => {
            document.getElementById("formCliente").reset();
            document.getElementById("id").value = ""; // Limpiar ID por si es nuevo
            toggleModal("modalCliente", true);
        };
        document.getElementById("btnCerrarModalCliente").onclick = () => toggleModal("modalCliente", false);
    };


    // 4. GUARDAR CLIENTE (EVENTO SUBMIT)
    const formCliente = document.getElementById("formCliente");
    formCliente.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById("clienteId").value;
        // Capturamos los datos usando los IDs exactos de tu HTML
        const datos = {
            nombre: document.getElementById("nombre").value,
            apellido: document.getElementById("apellido").value,
            telefono: document.getElementById("telefono").value,
            direccion: document.getElementById("direccion").value,
            dni: document.getElementById("dni").value,
            cuit: document.getElementById("cuit").value,
            arca: document.getElementById("arca").value,
            email: document.getElementById("email").value,
            fecha_alta: document.getElementById("fecha_alta").value
        };
        const exito = await guardarClienteAPI(datos, id || null);
        if (exito) {
            alert("✅ Cliente guardado correctamente");
            toggleModal("modalCliente", false);
            formCliente.reset();
                
            // Recargar la tabla
            const clientesActualizados = await fetchClientes();
            dibujarClientes(clientesActualizados);
        } else {
            alert("❌ Error al guardar el cliente");
        }
    };


    // --- LÓGICA DEL BUSCADOR PRODUCTO---
    const inputBusqueda = document.getElementById("buscarProducto");
    if (inputBusqueda) {
        inputBusqueda.oninput = async (e) => {
            const termino = e.target.value.toLowerCase();
            const todosLosProductos = await fetchProductos();
            const filtrados = todosLosProductos.filter(p => 
                (p.descripcion || "").toLowerCase().includes(termino) || 
                (p.sku || "").toLowerCase().includes(termino) ||
                (p.marca || "").toLowerCase().includes(termino)
            );
            dibujarProductos(filtrados);
        };
    }

    // --- LÓGICA DEL BUSCADOR CLIENTES---
    const inputBusquedaCliente = document.getElementById("buscarCliente");
    if (inputBusquedaCliente) {
        inputBusquedaCliente.oninput = async (e) => {
            const termino = e.target.value.toLowerCase();
            const todosLosClientes = await fetchClientes();
            const filtrados = todosLosClientes.filter(p => 
                (p.nombre || "").toLowerCase().includes(termino) || 
                (p.apellido || "").toLowerCase().includes(termino) ||
                (p.dni || "").toLowerCase().includes(termino)
            );
            dibujarClientes(filtrados);
        };
    }


    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-eliminar");
        if (!btn) return;
        const id = btn.dataset.id;
        const desc = btn.dataset.desc;
        eliminarProducto(id, desc);
    });
    
    window.eliminarProducto = async (id, sku) => {
    // 1. El cartel de confirmación
    const rta = confirm(`¿Estás seguro de que querés eliminar el producto con código "${sku}"?`);
    if (rta) {
            try {
                // 2. Avisamos al Backend
                const response = await fetch(`http://localhost:3000/api/productos/${id}`, {
                    method: 'DELETE' 
                });
                if (response.ok) {
                    alert("Producto eliminado con éxito.");
                    // 3. Recargamos la lista
                    const productosActualizados = await fetchProductos();
                    dibujarProductos(productosActualizados);
                } else {
                    alert("No se pudo eliminar el producto.");
                }
            } catch (error) {
                console.error("Error en la conexión:", error);
            }
        }
    };

    document.addEventListener("click", (ec) => {
        const btn = ec.target.closest(".btn-eliminarCli");
        if (!btn) return;
        const id = btn.dataset.id;
        const desc = btn.dataset.desc;
        eliminarCliente(id, desc);
    });

    window.eliminarCliente = async (id, nombre) => {
        // 1. El cartel de confirmación
        const rta = confirm(`¿Estás seguro de que querés eliminar a "${nombre}"?, esa accion solo desactivara el cliente`);
        if (rta) {
            try {
                // 2. Avisamos al Backend (Controller) que cambie el estado a 0
                const response = await fetch(`http://localhost:3000/api/clientes/${id}`, {
                    method: 'DELETE' // El método que definiste en tus rutas
                });
                if (response.ok) {
                    alert("Cliente eliminado con éxito.");
                    // 3. Recargamos la lista para que el cliente "desaparezca"
                    const clientesActualizados = await fetchClientes();
                    dibujarClientes(clientesActualizados);
                } else {
                    alert("No se pudo eliminar el cliente.");
                }
            } catch (error) {
                console.error("Error en la conexión:", error);
            }
        }
    };

    const btnAbrirVenta = document.getElementById("btn-nueva-venta");
    if (btnAbrirVenta) {
        btnAbrirVenta.addEventListener("click", () => {
            mostrarPantallaVenta(); 
        });
    }
    

    let carritoVenta = [];

    // Abrir la pantalla completa
    window.mostrarPantallaVenta = async () => {
        // 1. PRIMERO: Forzamos a que la sección de Ventas sea la activa en el sistema de navegación
        // Esto simula que el usuario hizo clic en "Ventas" en el menú lateral
        const seccionVentas = document.getElementById("seccionVentas");
        const todasLasSecciones = [
            document.getElementById("seccionProductos"),
            document.getElementById("seccionClientes"),
            document.getElementById("seccionVentas")
        ];

        // Ocultamos todas y mostramos la de Ventas
        todasLasSecciones.forEach(s => s?.classList.add("hidden"));
        seccionVentas.classList.remove("hidden");

        // 2. SEGUNDO: Dentro de la sección Ventas, ocultamos el historial y mostramos la facturación
        const tablaHistorial = seccionVentas.querySelector("header").nextElementSibling; // El div de la tabla
        const pantallaGenerarVenta = document.getElementById("pantallaGenerarVenta");

        if (tablaHistorial) tablaHistorial.classList.add("hidden");
        if (pantallaGenerarVenta) {
            pantallaGenerarVenta.classList.remove("hidden");
            // Movemos el scroll al inicio por si acaso
            window.scrollTo(0, 0);
        }

        // 3. TERCERO: Cargamos los datos (Tu lógica de siempre)
        cargarDatosParaVenta(); 
    };

    // Agregar item al carrito
    window.agregarItemVenta = () => {
        const select = document.getElementById("v-producto-select");
        const id = select.value;
        if(!id) return;

        const opt = select.options[select.selectedIndex];
        const item = {
            id: id,
            desc: opt.dataset.desc,
            precio: parseFloat(opt.dataset.precio),
            cantidad: parseInt(document.getElementById("v-cantidad").value),
        };
        item.subtotal = item.precio * item.cantidad;

        carritoVenta.push(item);
        actualizarTablaVenta();
    };

    function actualizarTablaVenta() {
        const body = document.getElementById("v-items-body");
        body.innerHTML = carritoVenta.map((item, index) => `
            <tr class="border-b dark:border-slate-700">
                <td class="p-4 font-medium">${item.desc}</td>
                <td class="p-4 text-center">${item.cantidad}</td>
                <td class="p-4 text-right">$${item.precio.toFixed(2)}</td>
                <td class="p-4 text-right font-bold">$${item.subtotal.toFixed(2)}</td>
                <td class="p-4 text-center">
                    <button onclick="quitarItemVenta(${index})" class="text-red-500">✕</button>
                </td>
            </tr>
        `).join('');

        const total = carritoVenta.reduce((sum, i) => sum + i.subtotal, 0);
        document.getElementById("v-total-pantalla").innerText = `$${total.toFixed(2)}`;
    }

    // Lógica de Pago
    window.abrirModalPago = () => {
        if(carritoVenta.length === 0) return alert("El carrito está vacío");
        
        const total = document.getElementById("v-total-pantalla").innerText;
        document.getElementById("v-monto-final").innerText = total;
        
        // Habilitar Cuenta Corriente solo si el cliente no es "Consumidor Final" (id 0)
        const idCliente = document.getElementById("v-cliente-select").value;
        const optCtaCte = document.getElementById("opt-cta-cte");
        optCtaCte.disabled = (idCliente === "0");

        document.getElementById("modalPago").classList.remove("hidden");
    };

    window.cerrarModalPago = () => document.getElementById("modalPago").classList.add("hidden");

    window.cerrarPantallaVenta = () => {
        document.getElementById("pantallaGenerarVenta").classList.add("hidden");
        document.getElementById("seccionVentas").classList.remove("hidden");
    };

    // 5. MODO OSCURO (Básico para que no te moleste la vista)
    const btnDarkMode = document.getElementById("btnDarkMode");
    btnDarkMode.onclick = () => document.documentElement.classList.toggle("dark");
});