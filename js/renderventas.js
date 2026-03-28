// Este archivo NO sabe nada de base de datos, solo sabe de HTML (DOM)

export function actualizarTablaVenta(carritoVenta) {
    const body = document.getElementById("v-items-body");
    const labelTotal = document.getElementById("v-total-pantalla");
    const headerCantidad = document.querySelector("#pantallaGenerarVenta th:nth-child(4)");

    if (!body) return;

    if (carritoVenta.length === 0) {
        body.innerHTML = `<tr id="v-items-vacio"><td colspan="6" class="text-center py-12 text-gray-400 italic">No hay datos</td></tr>`;
        labelTotal.innerText = "$0.00";
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
                    class="input-cantidad w-16 p-1 text-center border rounded bg-transparent font-bold text-blue-600" 
                    data-index="${index}">
            </td>
            <td class="p-4 text-right font-black text-gray-900 dark:text-white font-mono">$${item.subtotal.toFixed(2)}</td>
            <td class="p-4 text-center">
                <button class="btn-quitar text-red-500 hover:text-red-700 text-xs" data-index="${index}">✕ Borrar</button>
            </td>
        </tr>
    `).join('');

    const total = carritoVenta.reduce((sum, i) => sum + i.subtotal, 0);
    const cantItems = carritoVenta.reduce((sum, i) => sum + i.cantidad, 0);

    labelTotal.innerText = `$${total.toFixed(2)}`;
    if (headerCantidad) headerCantidad.innerText = `Cantidad (${cantItems})`;
}