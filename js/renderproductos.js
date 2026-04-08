// js/renderproductos.js  RENDERIZA LA SECCION INVENTARIO
export function dibujarProductos(productos) {
    const tabla = document.getElementById("tablaProductosBody");
    if (!tabla) return;
    tabla.innerHTML = "";
    productos.forEach(p => {
        tabla.innerHTML += `
            <tr class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                <td class="p-3 text-center font-mono text-xs">${p.sku || '---'}</td>
                <td class="p-3">${p.descripcion || ''}</td>
                <td class="p-3">${p.marca || ''}</td>
                <td class="p-3">${p.modelo || ''}</td>
                <td class="p-3">${p.categoria || ''}</td>
                <td class="p-3 text-right text-gray-400">$${p.costo}</td>
                <td class="p-3 text-right font-bold text-naranja-600">$${p.precio_neto}</td>
                <td class="p-3 text-center ${(Number(p.stock) <= Number(p.stock_minimo)) ? 'text-red-600 font-black' : ''}">${p.stock}</td>
                <td class="p-3 text-center">
                    <button onclick="prepararEdicionProducto(${p.id})" class="text-blue-500 hover:scale-125 transition-transform">✏️</button>
                    <button class="btn-eliminar" "text-blue-500 hover:scale-125 transition-transform" data-id="${p.id}" data-desc="${p.sku}"> 🗑️</button>
                </td>
            </tr>
        `;
    });
}