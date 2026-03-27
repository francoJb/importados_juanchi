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
    
    
    window.volverALista = () => {
        // Si el carrito tiene productos, pedimos confirmación
        if (carritoVenta.length > 0) {
            const confirmar = confirm("⚠️ Tenés productos cargados. ¿Seguro que querés cancelar la venta y volver?");
            if (!confirmar) return; // Si dice que no, nos quedamos en la pantalla
        }
        
        // Si está vacío o confirmó, cerramos la pantalla
        cerrarPantallaVenta(); 
    };

    // Escuchador de teclado global
    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape" || e.keyCode === 27) {
            
            // 1. Si el buscador de productos está abierto, lo cierra
            const modalBusqueda = document.getElementById("modalBuscadorProductos");
            if (modalBusqueda && !modalBusqueda.classList.contains("hidden")) {
                cerrarBuscadorProductos();
                return; // Detenemos aquí para que no cierre todo lo demás de un tiro
            }

            // 2. Si el modal de pago está abierto, lo cierra
            const modalPago = document.getElementById("modalPago");
            if (modalPago && !modalPago.classList.contains("hidden")) {
                cerrarModalPago();
                return;
            }
        
            // 3. Si estás en la pantalla de Nueva Venta, vuelve al inicio
            // Solo si no hay un modal encima
            const pantallaVenta = document.getElementById("pantallaGenerarVenta");
            if (pantallaVenta && !pantallaVenta.classList.contains("hidden")) {
                volverALista(); 
            }
        }
    });
    
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
    
    // 1. Reloj profesional
    if(document.getElementById("pantallaGenerarVenta")){
        setInterval(() => {
            const reloj = document.getElementById("reloj-venta");
            if(reloj) reloj.innerText = new Date().toLocaleTimeString();
        }, 1000);
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
        const headerVentas = seccionVentas.querySelector("header"); // El que dice "VENTAS" y "+ Nueva Venta"
        const tablaHistorial = seccionVentas.querySelector("header").nextElementSibling; // El div de la tabla
        const pantallaGenerarVenta = document.getElementById("pantallaGenerarVenta");
        if (headerVentas) headerVentas.classList.add("hidden");
        if (tablaHistorial) tablaHistorial.classList.add("hidden");
        if (pantallaGenerarVenta) {
            pantallaGenerarVenta.classList.remove("hidden");
            // Movemos el scroll al inicio por si acaso
            window.scrollTo(0, 0);
        }
        window.cerrarPantallaVenta = () => {
        document.getElementById("pantallaGenerarVenta").classList.add("hidden");
        document.getElementById("seccionVentas").classList.remove("hidden");
        if (headerVentas) headerVentas.classList.remove("hidden");
    };

        window.checkEnterVenta = async (e) => {
            // Si la tecla presionada es Enter (código 13)
            if (e.keyCode === 13) {
                const skuIngresado = e.target.value.trim().toUpperCase();
                if (!skuIngresado) return;

                // Buscamos en la lista de productos que ya tenemos cargada
                const productos = await fetchProductos();
                const p = productos.find(item => item.sku.toUpperCase() === skuIngresado);

                if (p) {
                    // Si existe, lo agregamos
                    const nuevoItem = {
                        id: p.id,
                        sku: p.sku,
                        desc: p.descripcion,
                        precio: parseFloat(p.precio_neto),
                        cantidad: 1,
                        subtotal: parseFloat(p.precio_neto)
                    };

                    carritoVenta.push(nuevoItem);
                    actualizarTablaVenta();
                    
                    // Limpiamos el input para la siguiente carga
                    e.target.value = "";
                    console.log("Producto cargado con éxito vía SKU");
                } else {
                    // Si no existe, avisamos y abrimos el buscador automático para ayudar
                    alert("⚠️ El SKU no existe. Abriendo buscador avanzado...");
                    abrirBuscadorProductos();
                    // Opcional: pasar lo que escribió el usuario al filtro del modal
                    document.getElementById("inputFiltroBusqueda").value = skuIngresado;
                    filtrarProductosModal();
                }
            }
        };
        
        const [clientes, productos] = await Promise.all([fetchClientes(), fetchProductos()]);
    
        // Llenar Clientes con color azul
        const selectC = document.getElementById("v-cliente-select");
        selectC.innerHTML = '<option value="0" class="text-blue-600">Consumidor Final</option>';
        clientes.forEach(c => {
            selectC.innerHTML += `<option value="${c.id}">${c.nombre} ${c.apellido}</option>`;
        });

        // Llenar Productos con SKU (Código) y Descripción
        const selectP = document.getElementById("v-producto-select");
        selectP.innerHTML = '<option value="">--- Buscar producto ---</option>';
        productos.forEach(p => {
            // Guardamos el SKU en data-sku
            selectP.innerHTML += `<option value="${p.id}" data-precio="${p.precio_neto}" data-desc="${p.descripcion}" data-sku="${p.sku}">
                ${p.sku} | ${p.descripcion}
            </option>`;
        });

        // 3. TERCERO: Cargamos los datos (Tu lógica de siempre)
        cargarDatosParaVenta(); 
    };


    // 1. Abrir y llenar el modal
    window.abrirBuscadorProductos = async () => {
        const productos = await fetchProductos(); // Trae los productos de la DB
        const modal = document.getElementById("modalBuscadorProductos");
        const tbody = document.getElementById("tablaBuscadorBody");

        tbody.innerHTML = productos.map(p => `
            <tr class="border-b dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                <td class="p-3 font-mono font-bold text-blue-600">${p.sku}</td>
                <td class="p-3">${p.descripcion} <br> <small class="text-gray-400">${p.marca} ${p.modelo}</small></td>
                <td class="p-3 text-right ${p.stock <= p.stock_minimo ? 'text-red-500 font-bold' : ''}">${p.stock}</td>
                <td class="p-3 text-right font-bold text-green-600">$${p.precio_neto}</td>
                <td class="p-3 text-center">
                    <button onclick="seleccionarProductoDesdeModal('${p.sku}')" 
                        class="bg-blue-600 text-white px-3 py-1 rounded text-xs uppercase font-bold hover:bg-blue-700">
                        Seleccionar
                    </button>
                </td>
            </tr>
        `).join('');

        modal.classList.remove("hidden");
        document.getElementById("inputFiltroBusqueda").focus();
    };

    // 2. Función para cuando hacés clic en "Seleccionar"
    window.seleccionarProductoDesdeModal = async (sku) => {
        // Buscamos el producto completo por su SKU
        const productos = await fetchProductos();
        const p = productos.find(item => item.sku === sku);

        if (p) {
            // Creamos el objeto para el carrito
            const nuevoItem = {
                id: p.id,
                sku: p.sku,
                desc: p.descripcion,
                precio: parseFloat(p.precio_neto),
                cantidad: 1,
                subtotal: parseFloat(p.precio_neto)
            };

            // Agregamos al array global de la venta
            carritoVenta.push(nuevoItem);
            
            // Actualizamos la tabla de la pantalla de ventas
            actualizarTablaVenta();
            
            // Cerramos el modal
            cerrarBuscadorProductos();
        }
    };

    // 3. Filtro rápido dentro del modal
    window.filtrarProductosModal = () => {
        const texto = document.getElementById("inputFiltroBusqueda").value.toLowerCase();
        const filas = document.querySelectorAll("#tablaBuscadorBody tr");

        filas.forEach(fila => {
            const contenido = fila.textContent.toLowerCase();
            fila.style.display = contenido.includes(texto) ? "" : "none";
        });
    };

    window.cerrarBuscadorProductos = () => {
        document.getElementById("modalBuscadorProductos").classList.add("hidden");
    };

    // Agregar item al carrito
    window.agregarItemVenta = () => {
        const select = document.getElementById("v-producto-select");
        if(!select.value) return;

        const opt = select.options[select.selectedIndex];
        const item = {
            id: select.value,
            sku: opt.dataset.sku, // Capturamos el Código
            desc: opt.dataset.desc,
            precio: parseFloat(opt.dataset.precio),
            cantidad: 1, // Por defecto 1 como en la imagen
        };
        item.subtotal = item.precio * item.cantidad;

        carritoVenta.push(item);
        actualizarTablaVenta();
        // Limpiar buscador
        select.value = "";
    };

    function actualizarTablaVenta() {
        const body = document.getElementById("v-items-body");
        const labelTotal = document.getElementById("v-total-pantalla");
        const headerCantidad = document.querySelector("#pantallaGenerarVenta th:nth-child(4)");

        if(carritoVenta.length === 0) {
            body.innerHTML = `<tr id="v-items-vacio"><td colspan="6" class="text-center py-12 text-gray-400 italic">No hay datos</td></tr>`;
            labelTotal.innerText = "$0.00";
            if(headerCantidad) headerCantidad.innerText = "Cantidad (0)";
            return;
        }

        body.innerHTML = carritoVenta.map((item, index) => `
            <tr class="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                <td class="p-4 text-gray-500 dark:text-gray-400 font-mono">${item.sku}</td>
                <td class="p-4 font-medium text-gray-900 dark:text-white">${item.desc}</td>
                <td class="p-4 text-right font-mono">$${item.precio.toFixed(2)}</td>
                <td class="p-4 text-center">
                    <input type="number" value="${item.cantidad}" min="1" onchange="cambiarCantidad(${index}, this.value)" class="w-16 p-1 text-center border rounded bg-transparent font-bold text-blue-600">
                </td>
                <td class="p-4 text-right font-black text-gray-900 dark:text-white font-mono">$${item.subtotal.toFixed(2)}</td>
                <td class="p-4 text-center">
                    <button onclick="quitarItemVenta(${index})" class="text-red-500 hover:text-red-700 text-xs"> 🗑️ </button> 
                </td>
            </tr>
        `).join('');

        const total = carritoVenta.reduce((sum, i) => sum + i.subtotal, 0);
        const cantItems = carritoVenta.reduce((sum, i) => sum + i.cantidad, 0);

        labelTotal.innerText = `$${total.toFixed(2)}`;
        if(headerCantidad) headerCantidad.innerText = `Cantidad (${cantItems})`;
    }
    
    window.cambiarCantidad = (index, nuevaCantidad) => {
        const cant = parseInt(nuevaCantidad);
        if(cant > 0) {
            carritoVenta[index].cantidad = cant;
            carritoVenta[index].subtotal = carritoVenta[index].precio * cant;
            actualizarTablaVenta();
        }
    };

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

    // 5. MODO OSCURO (Básico para que no te moleste la vista)
    const btnDarkMode = document.getElementById("btnDarkMode");
    btnDarkMode.onclick = () => document.documentElement.classList.toggle("dark");
});