// js/renderproveedores.js  RENDERIZA LA SECCION PROVEEDORES
import { eliminarProveedor } from "./proveedores.js";

export function dibujarProveedores(proveedores) {
    const tabla = document.getElementById("tablaProveedoresBody");
    if (!tabla) return;
    tabla.innerHTML = "";
    proveedores.forEach(p => {
        const isEliminado = p.estado === 0;
        tabla.innerHTML += `
            <tr class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${isEliminado ? 'bg-red-50 dark:bg-red-900/10 opacity-90' : ''}">
                <td class="p-3">${p.nombre || ''}</td>
                <td class="p-3 font-mono text-xs">${p.cuit || ''}</td>
                <td class="p-3">${p.arca_categoria || ''}</td>
                <td class="p-3">${p.telefono || ''}</td>
                <td class="p-3">${p.email || ''}</td>
                <td class="p-3 text-center">
                    ${isEliminado ? `
                        <button onclick="restaurarProveedor(${p.id})" class="text-green-600 hover:scale-150 transition-transform" title="Restaurar">♻️</button>
                    ` : `
                        <button onclick="prepararEdicionProveedor(${p.id})" class="hover:scale-150 transition-transform" title="Editar">✏️</button>
                        <button onclick="eliminarProveedor(${p.id}, '${p.nombre}')" class="btn-eliminar hover:scale-150 transition-transform" title="Eliminar"> 🗑️</button>
                    `}
                </td>
            </tr>
        `;
    });
}