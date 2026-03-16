import { obtenerProductos } from "./productos.js";

export async function renderProductos() {

  const productos = await obtenerProductos();

  const tabla = document.getElementById("tablaProductosBody");
  if (!tabla) return;

  tabla.innerHTML = "";

  productos.forEach((p) => {

    tabla.innerHTML += `
      <tr class="border-b">
        <td class="p-2">${p.id}</td>
        <td class="p-2">${p.nombre}</td>
        <td class="p-2">$${p.precio}</td>
        <td class="p-2">${p.stock}</td>
        <td class="p-2 text-center">
          <button onclick="editarProducto(${p.id})">✏️</button>
          <button onclick="eliminarProducto(${p.id})">🗑</button>
        </td>
      </tr>
    `;
  });

}

