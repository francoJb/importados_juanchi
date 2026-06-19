// js/renderproductos.js  RENDERIZA LA SECCION PRODUCTOS
import { eliminarProducto } from "./productos.js";

export function dibujarProductos(productos) {
    const tabla = document.getElementById("tablaProductosBody");
    if (!tabla) return;
    tabla.innerHTML = "";
    productos.forEach(p => {
        const isEliminado = p.estado === 0;
        
        // OPTIMIZACIÓN: Evaluamos si empieza con "VEHICULO" para que coincida perfectamente con el Backend (sea singular o plural)
        const esVehiculo = p.categoria && p.categoria.toUpperCase().startsWith("VEHICULO");

        tabla.innerHTML += `
            <tr class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${isEliminado ? 'bg-red-50 dark:bg-red-900/10 opacity-90' : ''}">
                <td class="p-3 text-center font-mono text-xs">${p.sku || '---'}</td>
                <td class="p-3">${p.descripcion || ''}</td>
                <td class="p-3">${p.marca || ''}</td>
                <td class="p-3">${p.modelo || ''}</td>
                <td class="p-3">${p.proveedor || ''}</td>
                <td class="p-3">${p.categoria || ''}</td>
                <td class="p-3 text-right text-gray-400">$${p.costo}</td>
                <td class="p-3 text-right">$${p.precio_neto}</td>
                <td class="p-3 text-center ${(Number(p.stock) <= Number(p.stock_minimo)) ? 'text-red-600 font-black' : ''}">${p.stock}</td>
                <td class="p-3 text-center">
                    ${isEliminado ? `
                        <button onclick="restaurarProducto(${p.id})" class="text-green-600 hover:scale-150 transition-transform" title="Restaurar">♻️</button>
                    ` : `
                        ${esVehiculo ? `
                            <button onclick="window.verUnidadesVehiculo(${p.id}, '${p.descripcion || p.sku}')" 
                                    class="text-indigo-600 dark:text-indigo-400 hover:scale-125 transition-transform font-bold mr-3" 
                                    title="Ver Unidades en Stock (Chasis/Motor)">
                                🔍 Ver Stock
                            </button>
                            
                            <button onclick="abrirModalUnidad(${p.id}, '${p.descripcion || p.sku}')" class="text-blue-600 hover:scale-125 transition-transform font-bold mr-2" title="Agregar Unidad Física / Chasis">➕ Unidad</button>
                        ` : ''}
                        
                        <button onclick="prepararEdicionProducto(${p.id})" class="hover:scale-150 transition-transform" title="Editar">✏️</button>
                        <button onclick="eliminarProducto(${p.id}, '${p.descripcion || p.sku}')" class="btn-eliminar hover:scale-150 transition-transform" title="Eliminar"> 🗑️</button>
                    `}
                </td>
            </tr>
        `;
    });
}