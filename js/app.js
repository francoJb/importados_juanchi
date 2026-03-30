// js/app.js
import { fetchProductos, guardarProductoAPI } from "./productos.js";
import { dibujarProductos } from "./renderproductos.js";
import { fetchClientes, guardarClienteAPI } from "./clientes.js";
import { dibujarClientes } from "./renderclientes.js";
import { actualizarTablaVenta } from "./renderventas.js";

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
            // 1. Si el buscador de clientes está abierto, lo cierra
            const modalBusquedaClientes = document.getElementById("modalBuscadorClientes");
            if (modalBusquedaClientes && !modalBusquedaClientes.classList.contains("hidden")) {
                cerrarBuscadorClientes();
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

    // Definimos la función con window. para que mostrarPantallaVenta la encuentre
    window.cargarDatosParaVenta = async () => {
        try {
            // 1. Traemos los datos del servidor (Usando tus funciones fetch)
            const [clientes, productos] = await Promise.all([
                fetchClientes(), 
                fetchProductos()
            ]);

            // 2. Llenamos el select de clientes
            const selectC = document.getElementById("v-cliente-select");
            if (selectC) {
                selectC.innerHTML = '<option value="0" class="text-blue-600">Consumidor Final</option>';
                clientes.forEach(c => {
                    selectC.innerHTML += `<option value="${c.id}">${c.nombre} ${c.apellido}</option>`;
                });
            }

            // 3. Guardamos los productos en una variable global para el Buscador/Lupa
            // IMPORTANTE: Asegúrate de tener declarada 'let productosVenta = []' al inicio de app.js
            window.productosVenta = productos; 

            console.log("✅ Datos para venta cargados correctamente");
        } catch (error) {
            console.error("❌ Error al cargar datos para la venta:", error);
        }
    };

    // Abrir la pantalla completa
    window.mostrarPantallaVenta = async () => {
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
                    actualizarTablaVenta(carritoVenta);
                    
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

        window.abrirBuscadorClientes = async () => {
            const clientes = await fetchClientes(); // Trae los productos de la DB
            const modal = document.getElementById("modalBuscadorClientes");
            const tbody = document.getElementById("tablaBuscadorBody");

            tbody.innerHTML = clientes.map(c => `
                <tr class="border-b dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                    <td class="p-3 font-mono font-bold text-blue-600">${c.nombre}</td>
                    <td class="p-3">${c.apellido}</td>
                    <td class="p-3 text-right ${c.direccion}</td>
                    <td class="p-3 text-right font-bold text-green-600">$${c.dni}</td>
                    <td class="p-3 text-center">
                        <button onclick="seleccionarProductoDesdeModal('${c.idCliente}')" 
                            class="bg-blue-600 text-white px-3 py-1 rounded text-xs uppercase font-bold hover:bg-blue-700">
                            Seleccionar
                        </button>
                    </td>
                </tr>
            `).join('');

            modal.classList.remove("hidden");
            document.getElementById("inputFiltroBusqueda").focus();
        };
        window.cerrarBuscadorClientes = () => {
            document.getElementById("modalBuscadorClientes").classList.add("hidden");
        };

        // Llenar Productos con SKU (Código) y Descripción
        const inputSku = document.getElementById("v-sku-directo");
        if (inputSku) {
            inputSku.value = ""; // Solo lo limpiamos al abrir la pantalla
            inputSku.focus();    // Le damos el foco para empezar a escribir rápido
        } else {
            console.warn("No se encontró 'v-sku-directo'. Asegúrate de que el input de SKU tenga ese ID.");
        }

        // 3. TERCERO: Cargamos los datos (Tu lógica de siempre)
        cargarDatosParaVenta(); 
    };


   
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
            actualizarTablaVenta(carritoVenta);
            
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
        actualizarTablaVenta(carritoVenta);
        // Limpiar buscador
        select.value = "";
    };

    window.quitarItemVenta = (index) => {
        // 1. Eliminamos el elemento del array 'carritoVenta' usando su posición (index)
        // El '1' significa que solo borramos ese elemento
        carritoVenta.splice(index, 1);

        // 2. Volvemos a llamar a la función que dibuja la tabla
        // Esto hace que la fila desaparezca y el Total Azul se actualice
        actualizarTablaVenta(carritoVenta);
        
        console.log("Producto eliminado del carrito local");
    };
    
    window.cambiarCantidad = (index, nuevaCantidad) => {
        const cant = parseInt(nuevaCantidad);
        if(cant > 0) {
            carritoVenta[index].cantidad = cant;
            carritoVenta[index].subtotal = carritoVenta[index].precio * cant;
            actualizarTablaVenta(carritoVenta);
        }
    };

    // Lógica de Pago
    // 1. Al abrir el modal, verificamos quién es el cliente
    window.abrirModalPago = () => {
        if (carritoVenta.length === 0) return alert("⚠️ No hay productos cargados.");
        const total = carritoVenta.reduce((sum, i) => sum + i.subtotal, 0);
        const idCliente = document.getElementById("v-cliente-select").value;
        document.getElementById("pago-total-monto").innerText = `$${total.toFixed(2)}`;
        document.getElementById("pago-entrega").value = 0;

        // Bloquear Cta Cte si es Consumidor Final (ID 0)
        const optCtaCte = document.getElementById("opt-cta-cte");
        const selectMetodo = document.getElementById("pago-metodo");
        if (idCliente == 0) {
            optCtaCte.disabled = true;
            optCtaCte.innerText = "Cuenta Corriente (Solo clientes reg.)";
            selectMetodo.value = "Efectivo"; // Resetear a efectivo
        } else {
            optCtaCte.disabled = false;
            optCtaCte.innerText = "Cuenta Corriente (Fiado)";
        }
        toggleCamposCtaCte(); // Actualizar visibilidad de campos
        document.getElementById("modalPago").classList.remove("hidden");
    };

    // 2. Mostrar/Ocultar campos de entrega inicial
    window.toggleCamposCtaCte = () => {
        const metodo = document.getElementById("pago-metodo").value;
        const divCtaCte = document.getElementById("campos-ctacte");
        if (metodo === "Cuenta Corriente") {
            divCtaCte.classList.remove("hidden");
            calcularSaldoCtaCte();
        } else {
            divCtaCte.classList.add("hidden");
        }
    };

    // 3. Calcular cuánto le queda debiendo
    window.calcularSaldoCtaCte = () => {
        const total = carritoVenta.reduce((sum, i) => sum + i.subtotal, 0);
        const entrega = parseFloat(document.getElementById("pago-entrega").value) || 0;
        const saldo = total - entrega;
        document.getElementById("pago-saldo-final").innerText = `$${saldo.toFixed(2)}`;
    };

    // Escuchar cambios en el input de entrega para recalcular en vivo
    document.getElementById("pago-entrega")?.addEventListener("input", calcularSaldoCtaCte);

    window.cerrarModalPago = () => document.getElementById("modalPago").classList.add("hidden");

    // 5. MODO OSCURO (Básico para que no te moleste la vista)
    const btnDarkMode = document.getElementById("btnDarkMode");
    btnDarkMode.onclick = () => document.documentElement.classList.toggle("dark");
});