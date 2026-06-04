export function actualizarTablaVenta(carritoVenta) {
    const body = document.getElementById("v-items-body");
    const labelTotal = document.getElementById("v-total-pantalla");
    const headerCantidad = document.querySelector("#pantallaGenerarVenta th:nth-child(4)");

    if (!body) return;

    if (carritoVenta.length === 0) {
        body.innerHTML = `<tr id="v-items-vacio"><td colspan="6" class="text-center py-12 text-gray-400 italic">No hay datos</td></tr>`;
        if (labelTotal) labelTotal.innerText = "$0.00";
        if (headerCantidad) headerCantidad.innerText = "Cantidad (0)";
        return;
    }

    body.innerHTML = carritoVenta.map((item, index) => `
        <tr class="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
            <td class="p-4 text-gray-500 dark:text-gray-400 font-mono">${item.sku}</td>
            <td class="p-4 font-medium text-gray-900 dark:text-white">${item.desc}</td>
            <td class="p-4 text-right font-mono">$${item.precio.toFixed(2)}</td>
            <td class="p-4 text-center">
                <input type="number" value="${item.cantidad}" min="1"
                    class="input-cantidad w-16 p-1 text-center border rounded bg-transparent"
                    data-index="${index}">
            </td>
            <td class="p-4 text-right font-black text-gray-900 dark:text-white font-mono">$${item.subtotal.toFixed(2)}</td>
            <td class="p-4 text-center">
                <button class="btn-quitar text-red-500 hover:text-red-700 text-xs" data-index="${index}" title="Quitar">Eliminar</button>
            </td>
        </tr>
    `).join("");

    const total = carritoVenta.reduce((sum, i) => sum + i.subtotal, 0);
    const cantItems = carritoVenta.reduce((sum, i) => sum + i.cantidad, 0);

    if (labelTotal) labelTotal.innerText = `$${total.toFixed(2)}`;
    if (headerCantidad) headerCantidad.innerText = `Cantidad (${cantItems})`;

    document.querySelectorAll(".input-cantidad").forEach(input => {
        input.addEventListener("change", (e) => {
            const index = e.target.dataset.index;
            const nuevaCantidad = parseInt(e.target.value, 10);

            if (nuevaCantidad > 0) {
                carritoVenta[index].cantidad = nuevaCantidad;
                carritoVenta[index].subtotal = nuevaCantidad * carritoVenta[index].precio;
                actualizarTablaVenta(carritoVenta);
            }
        });
    });

    document.querySelectorAll(".btn-quitar").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const index = e.target.dataset.index;
            carritoVenta.splice(index, 1);
            actualizarTablaVenta(carritoVenta);
        });
    });
}

export function renderTablaVentas(ventas) {
    const cuerpoTabla = document.getElementById("cuerpo-tabla-ventas");
    if (!cuerpoTabla) return;

    cuerpoTabla.innerHTML = "";

    // 1. Detectamos si el checkbox existe en el DOM y si está activo actualmente
    const checkboxOcultar = document.getElementById("toggleVentasFinalizadas");
    const ocultarActivo = checkboxOcultar ? checkboxOcultar.checked : false;

    ventas.forEach(v => {
        const isEliminado = Number(v.estado) === 0;
        const fechaFormateada = new Date(v.fecha).toLocaleString();
        const cliente = v.cliente_nombre ? `${v.cliente_nombre} ${v.cliente_apellido || ""}` : "Consumidor Final";
        const estadoEntrega = isEliminado
            ? '<span class="inline-flex items-center rounded-full bg-rose-100 px-2 py-1 text-xs font-bold text-rose-700 ring-1 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:ring-rose-500/30">Eliminada</span>'
            : v.estado_pago === "Pagado"
                ? '<span class="text-cyan-600 font-bold">Finalizado</span>'
                : '<span class="text-orange-500 font-bold">Pendiente</span>';
        const numeroVenta = v.numero || v.id;
        const acciones = isEliminado ? "" : `
            <button onclick="verDetalleVenta(${v.id})" class="text-blue-500 hover:scale-150 transition-transform" title="Ver Detalle">👁️</button>
            <button onclick="imprimirVenta(${v.id})" class="text-blue-500 hover:scale-150 transition-transform" title="Imprimir">🖨️</button>
            ${v.metodo_pago === "Cuotas" ? `<button onclick="imprimirPlanPagosVenta(${v.id})" class="text-blue-500 hover:scale-150 transition-transform" title="Plan de pagos">📄</button>` : ""}
            <button onclick="eliminarVenta(${v.id})" class="text-blue-500 hover:scale-150 transition-transform" title="Eliminar">🗑️</button>
        `;

        // 2. Evaluamos si la venta actual está finalizada (y no eliminada)
        const esFinalizado = v.estado_pago === "Pagado" && !isEliminado;
        
        // 3. Si está finalizada y el checkbox está activo, le asignamos la clase 'hidden' de Tailwind
        const claseOcultar = (esFinalizado && ocultarActivo) ? "hidden" : "";

        // 4. Agregamos el atributo 'data-finalizado' y la 'claseOcultar' al elemento <tr>
        cuerpoTabla.innerHTML += `
            <tr data-finalizado="${esFinalizado}" class="transition-colors ${claseOcultar} ${isEliminado ? "bg-rose-50/80 text-slate-500 dark:bg-rose-950/20 dark:text-slate-400" : "hover:bg-gray-50 dark:hover:bg-slate-700/50"}">
                <td class="p-2 text-center font-mono ${isEliminado ? "line-through decoration-rose-400 decoration-2" : ""}">#${numeroVenta}</td>
                <td class="p-2">${fechaFormateada}</td>
                <td class="p-2 text-right">$${v.total}</td>
                <td class="p-2 text-right">$${v.saldo_pendiente}</td>
                <td class="p-2 text-center">${estadoEntrega}</td>
                <td class="p-2 text-center">${cliente}</td>
                <td class="p-2 flex gap-2 justify-center">${acciones}</td>
            </tr>
        `;
    });
}
