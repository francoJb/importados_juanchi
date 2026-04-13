// ==========================================
// 1. IMPORTACIONES Y CONFIGURACIÓN INICIAL
// ==========================================

import { dibujarClientes } from "./renderclientes.js";
import { fetchClientes, listarClientes, configurarFormularioCliente, configurarBuscadorClientes } from "./clientes.js";

import { dibujarProductos } from "./renderproductos.js";
import { fetchProductos, listarProductos, configurarFormularioProducto, configurarBuscadorProductos } from "./productos.js";

import { actualizarTablaVenta } from "./renderventas.js";





// ==========================================
// 6. CARGA INICIAL (DOMContentLoaded)
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    listarClientes();
    configurarFormularioCliente();
    configurarBuscadorClientes();
    listarProductos();
    configurarFormularioProducto();
    configurarBuscadorProductos();

    cambiarSeccion('seccionDashboard');

    // --- CONFIGURACIÓN DE CLICS DEL MENÚ LATERAL ---

    // 1. Cuando hagan clic en Dashboard
    document.getElementById("linkDashboard").addEventListener("click", (e) => {
        e.preventDefault(); // Esto evita que la página salte al principio por el href="#"
        cambiarSeccion('seccionDashboard');
    });

    // 2. Cuando hagan clic en Clientes
    document.getElementById("linkClientes").addEventListener("click", (e) => {
        e.preventDefault();
        cambiarSeccion('seccionClientes');
    });

    // 3. Cuando hagan clic en Ventas
    document.getElementById("linkVentas").addEventListener("click", (e) => {
        e.preventDefault();
        cambiarSeccion('seccionVentas');
        listarVentas();
    });

    // 4. Cuando hagan clic en Productos
    document.getElementById("linkProductos").addEventListener("click", (e) => {
        e.preventDefault();
        cambiarSeccion('seccionProductos');
    });

    // 5. Cuando hagan clic en Configuracion
    document.getElementById("linkConfig").addEventListener("click", (e) => {
        e.preventDefault();
        cambiarSeccion('seccionConfig');
    });

    // 6. El botón de "Nueva Venta" (el que está dentro de la sección ventas)
    // Supongamos que su ID es 'btn-nueva-venta'
    const btnNuevaVenta = document.getElementById("btn-nueva-venta");
    if (btnNuevaVenta) {
        btnNuevaVenta.addEventListener("click", () => {
            carritoVenta = [];
            document.getElementById("v-observaciones").value = ""
            document.getElementById("v-cliente-select").value = "0";
            actualizarTablaVenta(carritoVenta);
            cambiarSeccion('pantallaGenerarVenta');
        });
    }
    
    let carritoVenta = [];

    window.volverALista = () => {
        // Si el carrito tiene productos, pedimos confirmación
        if (carritoVenta.length > 0) {
            const confirmar = confirm("⚠️ Tenés productos cargados. ¿Seguro que querés cancelar la venta y volver?");
            if (!confirmar) return; // Si dice que no, nos quedamos en la pantalla
        }
        carritoVenta = [];
        actualizarTablaVenta(carritoVenta);
        cambiarSeccion('seccionVentas');
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
    



    // ==========================================
    // 4. MÓDULO DE CLIENTES
    // ==========================================
    // 1. Función que dispara el botón "Balance" desde la tabla de clientes
    window.irABalanceCliente = async (id, nombre, apellido) => {
        // Ocultamos Clientes (Asegurate que este ID coincida con tu div de clientes)
        document.getElementById("seccionClientes").classList.add("hidden");
        
        // Mostramos Balance
        const pantallaBalance = document.getElementById("pantalla-balance-cliente");
        pantallaBalance.classList.remove("hidden");

        // Actualizamos el nombre en la cabecera
        document.getElementById("ba-nombre-cliente").innerText = `Balance: ${nombre} ${apellido}`;

        // Cargamos los datos reales
        await cargarDatosBalance(id);
    };


    // 3. Carga de datos desde la API
    async function cargarDatosBalance(clienteId) {
        try {
            const res = await fetch(`http://localhost:3000/api/clientes/${clienteId}/cuenta-corriente`);
            const data = await res.json();

            // Llenar tarjetas superiores
            document.getElementById("ba-saldo-total").innerText = `$${parseFloat(data.saldoTotal).toFixed(2)}`;
            
            // Calcular total pagado (suma de haber)
            const totalPagado = data.movimientos.reduce((sum, m) => sum + parseFloat(m.haber), 0);
            document.getElementById("ba-total-pagos").innerText = `$${totalPagado.toFixed(2)}`;

            // Llenar tabla
            const body = document.getElementById("ba-tabla-body");
            body.innerHTML = data.movimientos.map(m => `
                <tr class="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors text-sm">
                    <td class="p-4 text-gray-500">${new Date(m.fecha).toLocaleString('es-AR')}</td>
                    <td class="p-4">
                        <span class="font-bold dark:text-white">${m.descripcion}</span>
                        ${m.venta_id ? `<br><span class="text-[10px] text-blue-500 font-mono italic">REF: Venta #${m.venta_id}</span>` : ''}
                    </td>
                    <td class="p-4 text-right font-mono text-red-500">${m.debe > 0 ? `+$${parseFloat(m.debe).toFixed(2)}` : '-'}</td>
                    <td class="p-4 text-right font-mono text-green-500">${m.haber > 0 ? `-$${parseFloat(m.haber).toFixed(2)}` : '-'}</td>
                    <td class="p-4 text-right font-black font-mono dark:text-white bg-blue-50/30 dark:bg-blue-900/10">$${parseFloat(m.saldo_acumulado).toFixed(2)}</td>
                </tr>
            `).join('');

        } catch (error) {
            console.error("Error al cargar balance:", error);
        }
    }

    // 3. ABRIR/CERRAR MODAL PRODUTO
    document.getElementById("btnAbrirModalProducto").onclick = () => {
        document.getElementById("formProducto").reset();
        document.getElementById("formProductoId").value = ""; // Limpiar ID por si es nuevo
        toggleModal("modalProducto", true);
    };
    document.getElementById("btnCerrarModalProducto").onclick = () => toggleModal("modalProducto", false);

    // 3. ABRIR/CERRAR MODAL CLIENTE
    document.getElementById("btnAbrirModalCliente").onclick = () => {
        document.getElementById("formCliente").reset();
        document.getElementById("formClienteId").value = ""; // Limpiar ID por si es nuevo
        toggleModal("modalCliente", true);
    };
    document.getElementById("btnCerrarModalCliente").onclick = () => toggleModal("modalCliente", false);




    window.seleccionarClienteDesdeModal = async (id) => {
        // 1. Buscamos el select de clientes en la pantalla de venta
        const selectC = document.getElementById("v-cliente-select");
        // 2. Le asignamos el ID del cliente seleccionado
        if (selectC) {
            selectC.value = id;
        }
        // 3. Cerramos el buscador
        cerrarBuscadorClientes();
    };

    document.addEventListener("click", (ec) => {
        const btn = ec.target.closest(".btn-eliminarCli");
        if (!btn) return;
        const id = btn.dataset.id;
        const desc = btn.dataset.desc;
        eliminarCliente(id, desc);
    });

    

    // 1. Reloj profesional
    if(document.getElementById("pantallaGenerarVenta")){
        setInterval(() => {
            const reloj = document.getElementById("reloj-venta");
            if(reloj) reloj.innerText = new Date().toLocaleTimeString();
        }, 1000);
    }

    
    
    
    // ==========================================
    // 5. MÓDULO DE VENTAS (CARRITO Y CÁLCULOS)
    // ==========================================

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
                document.getElementById("inputFiltroProductos").value = skuIngresado;
                filtrarProductosModal();
            }
        }
    };

    window.abrirBuscadorClientes = async () => {
        const clientes = await fetchClientes(); // Trae los clientes de la DB
        const modal = document.getElementById("modalBuscadorClientes");
        const tbody = document.getElementById("tablaBuscadorClientes");
        tbody.innerHTML = clientes.map(c => `
            <tr class="border-b dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                <td class="p-3">${c.nombre}</td>
                <td class="p-3">${c.apellido}</td>
                <td class="p-3">${c.direccion}</td>
                <td class="p-3 text-right">${c.dni}</td>
                <td class="p-3 text-right">${c.cuit}</td>
                <td class="p-3 text-center">
                    <button onclick="seleccionarClienteDesdeModal('${c.id}')" 
                        class="bg-naranja-500 hover:bg-naranja-600 text-white font-bold py-1 px-5 rounded-xl shadow-lg">
                        Seleccionar
                    </button>
            </td>
            </tr>
        `).join('');
        modal.classList.remove("hidden");
        document.getElementById("inputFiltroClientes").focus();
    };

    window.cerrarBuscadorClientes = () => {
        document.getElementById("modalBuscadorClientes").classList.add("hidden");
    };

    window.filtrarClientesModal = () => {
        const texto = document.getElementById("inputFiltroClientes").value.toLowerCase();
        const filas = document.querySelectorAll("#tablaBuscadorClientes tr");

        filas.forEach(fila => {
            const contenido = fila.textContent.toLowerCase();
            fila.style.display = contenido.includes(texto) ? "" : "none";
        });
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
    
    window.abrirBuscadorProductos = async () => {
        const productos = await fetchProductos(); // Trae los productos de la DB
        const modal = document.getElementById("modalBuscadorProductos");
        const tbody = document.getElementById("tablaBuscadorProductos");

        tbody.innerHTML = productos.map(p => `
            <tr class="border-b dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                <td class="p-3">${p.sku}</td>
                <td class="p-3">${p.descripcion}</td>
                <td class="p-3">${p.marca}</td>
                <td class="p-3 text-right ${p.stock <= p.stock_minimo ? 'text-red-500 font-bold' : ''}">${p.stock}</td>
                <td class="p-3 text-right">${p.precio_neto}</td>
                <td class="p-3 text-center">
                    <button onclick="seleccionarProductoDesdeModal('${p.sku}')" 
                        class="bg-naranja-500 hover:bg-naranja-600 text-white font-bold py-1 px-5 rounded-xl shadow-lg">
                        Seleccionar
                    </button>
                </td>
            </tr>
        `).join('');

        modal.classList.remove("hidden");
        document.getElementById("inputFiltroProductos").focus();
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
        const texto = document.getElementById("inputFiltroProductos").value.toLowerCase();
        const filas = document.querySelectorAll("#tablaBuscadorProductos tr");

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
        if (!select || !select.value) return;

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

    window.procesarVentaFinal = async () => {
        const btnConfirmar = document.getElementById("btn-confirmar-final");
        const idCliente = parseInt(document.getElementById("v-cliente-select").value);
        const metodoPago = document.getElementById("pago-metodo").value;
        const entregaInicial = parseFloat(document.getElementById("pago-entrega").value) || 0;
        const observaciones = document.getElementById("v-observaciones").value;
        
        // Calculamos el total real del carrito
        const totalVenta = carritoVenta.reduce((sum, i) => sum + i.subtotal, 0);

        // 1. Validación de seguridad extra
        if (carritoVenta.length === 0) return alert("El carrito está vacío.");
        if (metodoPago === "Cuenta Corriente" && idCliente === 0) {
            return alert("Error: No se puede fiar a un Consumidor Final.");
        }

        // Bloqueamos el botón para evitar doble clic y duplicados en la DB
        btnConfirmar.disabled = true;
        btnConfirmar.innerText = "Procesando...";

        // 2. Preparamos el paquete de datos
        const datosVenta = {
            cliente_id: idCliente,
            total: totalVenta,
            metodo_pago: metodoPago,
            entrega_inicial: entregaInicial, // Importante para Cta Cte
            observaciones: observaciones,
            items: carritoVenta.map(item => ({
                id: item.id,
                cantidad: item.cantidad,
                precio: item.precio
            }))
        };

        try {
            // 3. Enviamos al servidor (Ruta que crearemos en el Controller)
            const respuesta = await fetch("http://localhost:3000/api/ventas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datosVenta)
            });

            const resultado = await respuesta.json();

            if (respuesta.ok) {
                alert("✅ Venta realizada con éxito.");
                // Limpiamos todo y volvemos al historial
                await listarVentas();
                cerrarModalPago();
                cambiarSeccion('seccionVentas');
                
                // Si tenés una función para refrescar la tabla de historial, llamala acá
                if (typeof obtenerVentas === "function") obtenerVentas();
                
            } else {
                throw new Error(resultado.error || "Error desconocido al guardar.");
            }
        } catch (error) {
            alert("❌ Error al procesar venta: " + error.message);
        } finally {
            btnConfirmar.disabled = false;
            btnConfirmar.innerText = "Confirmar Venta";
        }

    };

    window.cerrarModalPago = () => document.getElementById("modalPago").classList.add("hidden");

    window.verDetalleVenta = async (id) => {
        try {
            // 1. Buscamos los datos de la venta (la cabecera)
            const resVenta = await fetch(`http://localhost:3000/api/ventas`);
            const ventas = await resVenta.json();
            const venta = ventas.find(v => v.id === id);

            // 2. Buscamos los productos del detalle
            const resDetalle = await fetch(`http://localhost:3000/api/ventas/${id}/detalle`);
            const detalles = await resDetalle.json();

            if (!venta) return alert("Venta no encontrada");

            // 3. Llenamos la información general
            document.getElementById("md-titulo").innerText = `Detalle de Venta #${venta.id}`;
            document.getElementById("md-fecha").innerText = new Date(venta.fecha).toLocaleString('es-AR');
            document.getElementById("md-cliente").innerText = venta.cliente_nombre ? `${venta.cliente_nombre} ${venta.cliente_apellido}` : "Consumidor Final";
            document.getElementById("md-total-final").innerText = `$${parseFloat(venta.total).toFixed(2)}`;
            document.getElementById("md-pendiente").innerText = `$${parseFloat(venta.saldo_pendiente).toFixed(2)}`;
            document.getElementById("v-observaciones").innerText = venta.observaciones || "Sin observaciones registradas.";

            // Estado visual (badge)
            const saldo = parseFloat(venta.saldo_pendiente);
            const contenedorEstado = document.getElementById("md-estado");
            // Agregá esto también en la lógica del saldo
            const txtPendiente = document.getElementById("md-pendiente");
            if (saldo > 0) {
                txtPendiente.classList.add("text-red-600", "animate-pulse"); // Titila suavemente si debe plata
            } else {
                txtPendiente.classList.remove("text-red-600", "animate-pulse");
                txtPendiente.classList.add("text-gray-400");
            }
           
            // ... código anterior de verDetalleVenta ...

            const btnCobrar = document.getElementById("btn-md-cobrar");
            if (saldo > 0) {
                btnCobrar.classList.remove("hidden");
                const idDelCliente = venta.cliente_id;
                
                // Al hacer clic, cerramos este modal y abrimos el de cobranza
                btnCobrar.onclick = () => {
                    cerrarModalDetalle();
                    abrirPantallaCobranza(venta.id, idDelCliente, saldo);
                };
            } else {
                btnCobrar.classList.add("hidden");
            }

            // Finalmente mostramos el modal
            document.getElementById("modal-detalle-venta").classList.remove("hidden");

            if (saldo <= 0) {
                // VENTA COBRADA TOTALMENTE
                contenedorEstado.innerHTML = `
                    <div class="flex flex-col items-center">
                        <span class="px-4 py-1 bg-green-500 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-sm">
                            FINALIZADA
                        </span>
                        <span class="text-[10px] text-green-600 mt-1 font-bold">Cobro Total</span>
                    </div>`;
            } else if (saldo < parseFloat(venta.total)) {
                // VENTA PAGADA PARCIALMENTE
                contenedorEstado.innerHTML = `
                    <div class="flex flex-col items-center">
                        <span class="px-4 py-1 bg-orange-500 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-sm">
                            PAGO PARCIAL
                        </span>
                        <span class="text-[10px] text-orange-600 mt-1 font-bold">Pendiente de Cobro</span>
                    </div>`;
            } else {
                // NO PAGÓ NADA (DEUDA TOTAL)
                contenedorEstado.innerHTML = `
                    <div class="flex flex-col items-center">
                        <span class="px-4 py-1 bg-red-500 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-sm">
                            PENDIENTE
                        </span>
                        <span class="text-[10px] text-red-600 mt-1 font-bold">Cuenta Corriente</span>
                    </div>`;
            }
            // 4. Llenamos la tabla de productos
            const body = document.getElementById("md-items-body");
            body.innerHTML = detalles.map(d => `
                <tr class="text-sm">
                    <td class="py-4 font-mono text-gray-500">${d.sku}</td>
                    <td class="py-4 font-medium dark:text-white">${d.descripcion}</td>
                    <td class="py-4 text-right font-mono">$${parseFloat(d.precio_unitario).toFixed(2)}</td>
                    <td class="py-4 text-center font-bold text-blue-600">x${d.cantidad}</td>
                    <td class="py-4 text-right font-black dark:text-white font-mono">$${(d.cantidad * d.precio_unitario).toFixed(2)}</td>
                </tr>
            `).join('');

            // 5. Mostrar el modal
            document.getElementById("modal-detalle-venta").classList.remove("hidden");

        } catch (error) {
            console.error("Error:", error);
            alert("Error al cargar el detalle.");
        }
    };

    window.abrirPantallaCobranza = async (ventaId, clienteId, saldoPendiente) => {
        const monto = prompt(`Registrar pago...\nSaldo: $${saldoPendiente}`);
        if (!monto || isNaN(monto) || monto <= 0) return;

        try {
            const response = await fetch(`http://localhost:3000/api/ventas/${ventaId}/pago`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ monto }) // Solo mandamos el monto
            });

            const data = await response.json();
            if (data.success) {
                alert("¡Pago de $" + monto + " registrado!");
                window.listarVentas(); // Refrescar la tabla principal
            } else {
                alert("Error: " + data.error);
            }
        } catch (error) {
            alert("Error de conexión");
        }
    };

    window.cerrarModalDetalle = () => {
        document.getElementById("modal-detalle-venta").classList.add("hidden");
    };
    window.imprimirVenta = (id) => {
        alert("Generando PDF para la venta " + id);
    };
    window.eliminarVenta = async (id) => {
        if(confirm("¿Estás seguro de eliminar esta venta? Esto no devolverá el stock automáticamente.")){
            // Aquí irá el fetch DELETE a tu API
        }
    };


    // 5. MODO OSCURO (Básico para que no te moleste la vista)
    const btnDarkMode = document.getElementById("btnDarkMode");
    btnDarkMode.onclick = () => document.documentElement.classList.toggle("dark");
});