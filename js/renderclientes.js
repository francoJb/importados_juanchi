export function dibujarClientes(clientes) {
    const tabla = document.getElementById("tablaClientesBody");
    tabla.innerHTML = "";
    
    clientes.forEach(c => {
        tabla.innerHTML += `
            <tr class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                <td class="p-3 text-left">${c.nombre || '---'}</td>
                <td class="p-3 text-left">${c.apellido}</td>
                <td class="p-3 text-center">${c.dni || ''}</td>
                <td class="p-3 text-center">${c.cuit || ''}</td>
                <td class="p-3 text-center">${c.telefono || ''}</td>
                <td class="p-3 text-left">${c.direccion}</td>
                <td class="p-3 text-center">
                    <button onclick="prepararEdicionCliente(${c.id})" class="text-blue-500 hover:scale-125 transition-transform" title="Editar">✏️</button>
                    <button onclick="irABalanceCliente(${c.id}, '${c.nombre}', '${c.apellido}')" class="text-blue-500 hover:scale-125 transition-transform"  title="Ver Balance / CC" class="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors">📊</button>
                    <button class="btn-eliminarCli text-blue-500 hover:scale-125 transition-transform" data-id="${c.id}" data-desc="${c.nombre}"  title="Eliminar"> 🗑️</button>
                </td>
            </tr>
        `;
    });
}