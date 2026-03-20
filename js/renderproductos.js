// js/renderproductos.js
export function dibujarProductos(productos) {
    const tabla = document.getElementById("tablaProductosBody");
    tabla.innerHTML = "";
    
    productos.forEach(p => {
        tabla.innerHTML += `
            <tr class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                <td class="p-3 border text-center font-mono text-xs">${p.prodCodigo || '---'}</td>
                <td class="p-3 border font-bold">${p.prodDescripcion}</td>
                <td class="p-3 border">${p.prodMarca || ''}</td>
                <td class="p-3 border">${p.prodModelo || ''}</td>
                <td class="p-3 border">${p.prodCategoria || ''}</td>
                <td class="p-3 border text-right text-gray-400">$${p.prodCosto}</td>
                <td class="p-3 border text-right font-bold text-naranja-600">$${p.prodPrecio}</td>
                <td class="p-3 border text-center ${p.prodStock <= p.prodStockMinimo ? 'text-red-600 font-black' : ''}">${p.prodStock}</td>
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