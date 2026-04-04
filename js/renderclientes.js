// js/renderclientes.js  RENDERIZA LA SECCION CLIENTES
export function dibujarClientes(clientes) {
    const tabla = document.getElementById("tablaClientesBody");
    tabla.innerHTML = "";
    
    clientes.forEach(p => {
        tabla.innerHTML += `
            <tr class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                <td class="p-3 border text-left">${p.nombre || '---'}</td>
                <td class="p-3 border text-left">${p.apellido}</td>
                <td class="p-3 border text-center">${p.dni || ''}</td>
                <td class="p-3 border text-center">${p.cuit || ''}</td>
                <td class="p-3 border text-center">${p.telefono || ''}</td>
                <td class="p-3 border text-left">${p.direccion}</td>
                <td class="p-3 border text-center">
                    <button onclick="prepararEdicionCliente(${p.id})" class="text-blue-500 hover:scale-125 transition-transform">✏️</button>
                    <button onclick="irABalanceCliente(${p.id}, '${p.nombre}', '${p.apellido}')" title="Ver Balance / CC" class="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors">📊</button>
                    <button class="btn-eliminarCli" "text-blue-500 hover:scale-125 transition-transform" data-id="${p.id}" data-desc="${p.nombre}"> 🗑️</button>
                </td>
            </tr>
        `;
    });
}