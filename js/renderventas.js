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

    // 1. Renderizamos el HTML
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
                <button class="btn-quitar text-red-500 hover:text-red-700 text-xs" data-index="${index}">🗑️</button>
            </td>
        </tr>
    `).join('');

    // 2. Calculamos totales para los labels
    const total = carritoVenta.reduce((sum, i) => sum + i.subtotal, 0);
    const cantItems = carritoVenta.reduce((sum, i) => sum + i.cantidad, 0);

    if (labelTotal) labelTotal.innerText = `$${total.toFixed(2)}`;
    if (headerCantidad) headerCantidad.innerText = `Cantidad (${cantItems})`;

    // --- AQUÍ ESTÁ EL TRUCO PARA QUE SEA DINÁMICO ---

    // 3. Escuchamos cambios en los inputs de cantidad
    document.querySelectorAll('.input-cantidad').forEach(input => {
        input.addEventListener('change', (e) => {
            const index = e.target.dataset.index;
            const nuevaCantidad = parseInt(e.target.value);

            if (nuevaCantidad > 0) {
                // Actualizamos el objeto en el array
                carritoVenta[index].cantidad = nuevaCantidad;
                // Recalculamos su subtotal
                carritoVenta[index].subtotal = nuevaCantidad * carritoVenta[index].precio;
                
                // Volvemos a llamar a la función para refrescar la vista
                actualizarTablaVenta(carritoVenta);
            }
        });
    });

    // 4. Escuchamos clics en los botones de quitar (opcional pero recomendado)
    document.querySelectorAll('.btn-quitar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.target.dataset.index;
            carritoVenta.splice(index, 1); // Borramos el item del array
            actualizarTablaVenta(carritoVenta); // Refrescamos
        });
    });
}

export function renderTablaVentas(ventas) {
    const cuerpoTabla = document.getElementById("cuerpo-tabla-ventas"); // Asegurate que este sea el ID de tu <tbody>
    if (!cuerpoTabla) return;

    cuerpoTabla.innerHTML = ""; // Limpiamos la tabla

    ventas.forEach(v => {
        const fechaFormateada = new Date(v.fecha).toLocaleString();
        const cliente = v.cliente_nombre ? `${v.cliente_nombre} ${v.cliente_apellido}` : "Consumidor Final";
        
        // Lógica para el estado de entrega (puedes ajustarla según tu necesidad)
        const estadoEntrega = v.estado_pago === 'Pagado' 
            ? '<span class="text-cyan-600 font-bold">Finalizado</span>' 
            : '<span class="text-orange-500 font-bold">Pendiente</span>';

        cuerpoTabla.innerHTML += `
            <tr class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                <td class="p-2 text-center">#${v.id}</td>
                <td class="p-2">${fechaFormateada}</td>
                <td class="p-2 text-right">$${v.total}</td>
                <td class="p-2 text-right">$${v.saldo_pendiente}</td>
                <td class="p-2 text-center">${estadoEntrega}</td>
                <td class="p-2 text-center">${cliente}</td>
                <td class="p-2 flex gap-2 justify-center">
                    <button onclick="verDetalleVenta(${v.id})" class="text-blue-500 hover:scale-150 transition-transform" title="Ver Detalle">👁️</button>
                    <button onclick="imprimirVenta(${v.id})" class="text-blue-500 hover:scale-150 transition-transform" title="Imprimir">🖨️</button>
                    <button onclick="eliminarVenta(${v.id})" class="text-blue-500 hover:scale-150 transition-transform" title="Eliminar">🗑️</button>
                </td>
            </tr>
        `;
    });
}