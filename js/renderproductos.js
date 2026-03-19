import { obtenerProductos } from "./productos.js";

export async function renderProductos(listaFiltrada = null) {
  const productos = listaFiltrada || await obtenerProductos();
  const tabla = document.getElementById("tablaProductosBody");
  tabla.innerHTML = "";
  productos.forEach((p) => {
    tabla.innerHTML += `
      <tr class="border-b hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
        <td class="p-2 text-center">${p.codigo}</td>
        <td class="p-2 text-left">${p.descripcion}</td> <!-- Texto a la izquierda -->
        <td class="p-2 text-left">${p.marca}</td>
        <td class="p-2 text-left">${p.modelo}</td>
        <td class="p-2 text-left">${p.categoria}</td>
        <td class="p-2 text-right">$${p.costo}</td> <!-- Precios a la derecha -->
        <td class="p-2 text-right font-bold text-naranja-600">$${p.precio}</td>
        <td class="p-2 text-center ${p.stock <= p.stock_minimo ? 'text-red-500 font-bold' : ''}">${p.stock}</td>
        <td class="p-2 text-center flex justify-center gap-2">
          <button onclick="editarProducto(${p.id})" title="Editar">✏️</button>
          <button onclick="duplicarProducto(${p.id})" title="Duplicar">📑</button>
          <button onclick="balanceProducto(${p.id})" title="Balance">⚖️</button>
          <button onclick="eliminarProducto(${p.id})" title="Eliminar">🗑️</button>
        </td>
      </tr>
    `;
  });
}

