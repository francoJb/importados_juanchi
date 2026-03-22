// js/renderclientes.js  RENDERIZA LA SECCION CLIENTES
export function dibujarClientes(clientes) {
    const tabla = document.getElementById("tablaClientesBody");
    tabla.innerHTML = "";
    
    clientes.forEach(p => {
        tabla.innerHTML += `
            <tr class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                <td class="p-3 border text-center font-mono text-xs">${p.nombre || '---'}</td>
                <td class="p-3 border font-bold">${p.apellido}</td>
                <td class="p-3 border">${p.dni || ''}</td>
                <td class="p-3 border">${p.cuit || ''}</td>
                <td class="p-3 border">${p.telefono || ''}</td>
                <td class="p-3 border text-right text-gray-400">$${p.direccion}</td>
                <td class="p-3 border text-center">
                    <button onclick="prepararEdicion(${p.id})" class="text-blue-500 hover:scale-125 transition-transform">✏️</button>
                    <button onclick="balanceCliente(${p.id})" class="text-blue-500 hover:scale-125 transition-transform">⚖️</button>
                    <button onclick="eliminarCliente(${p.id})" class="text-blue-500 hover:scale-125 transition-transform">🗑️</button>
                </td>
            </tr>
        `;
    });
}