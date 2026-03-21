// js/renderproductos.js  RENDERIZA LA SECCION INVENTARIO
export function dibujarProductos(productos) {
    const tabla = document.getElementById("tablaProductosBody");
    tabla.innerHTML = "";
    
    productos.forEach(p => {
        tabla.innerHTML += `
            <tr class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                <td class="p-3 border text-center font-mono text-xs">${p.sku || '---'}</td>
                <td class="p-3 border font-bold">${p.descripcion}</td>
                <td class="p-3 border">${p.marca || ''}</td>
                <td class="p-3 border">${p.modelo || ''}</td>
                <td class="p-3 border">${p.categoria || ''}</td>
                <td class="p-3 border text-right text-gray-400">$${p.costo}</td>
                <td class="p-3 border text-right font-bold text-naranja-600">$${p.precio_neto}</td>
                <td class="p-3 border text-center ${p.stock <= p.stock_minimo ? 'text-red-600 font-black' : ''}">${p.stock}</td>
                <td class="p-3 border text-center">
                    <button onclick="prepararEdicion(${p.id})" class="text-blue-500 hover:scale-125 transition-transform">✏️</button>
                    <button onclick="clonar(${p.id})" class="text-blue-500 hover:scale-125 transition-transform">📑</button>
                    <button onclick="balanceProducto(${p.id})" class="text-blue-500 hover:scale-125 transition-transform">⚖️</button>
                    <button onclick="eliminarProducto(${p.id})" class="text-blue-500 hover:scale-125 transition-transform">🗑️</button>
                </td>
            </tr>
        `;
    });
}