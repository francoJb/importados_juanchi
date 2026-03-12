import { obtenerProductos } from "./productos.js";

export function renderProductos() {

  const productos = obtenerProductos();
  const tabla = document.getElementById("tablaProductosBody");
  if (!tabla) return;
    tabla.innerHTML = "";
    productos.forEach((p, index) => {
        tabla.innerHTML += `
            <tr class="border-b">
                <td class="p-2">${p.id}</td>
                <td class="p-2">${p.nombre}</td>
                <td class="p-2">$${p.precio}</td>
                <td class="p-2">${p.stock}</td>
                <td class="p-2 text-center">
                    <button onclick="editarProducto(${index})" class="text-blue-500 mr-2">
                        ✏️
                    </button>
                    <button onclick="eliminarProducto(${index})" class="text-red-500">
                        🗑
                    </button>
                </td>
            </tr>
        `;
    });
}