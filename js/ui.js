import { renderVentas } from "./renderventas.js";
renderVentas();



export function renderCarrito(productos) {
  const tabla = document.getElementById("tablaCarrito");
  const totalElement = document.getElementById("totalVenta");
  tabla.innerHTML = "";
  let total = 0;
  productos.forEach((p, index) => {
    const subtotal = p.precio * p.cantidad;
    total += subtotal;
    tabla.innerHTML += `
      <tr class="hover:bg-gray-50 dark:hover:bg-slate-700">
        <td class="p-3">${p.codigo}</td>
        <td class="p-3">${p.producto}</td>
        <td class="p-3 text-center">${p.cantidad}</td>
        <td class="p-3 text-right">$${p.precio}</td>
        <td class="p-3 text-right">$${subtotal}</td>
        <td class="p-3 text-center">
          <button 
            onclick="eliminarProducto(${index})"
            class="text-red-500 hover:text-red-700">
            ✕
          </button>
        </td>
      </tr>
    `;
  });
  totalElement.textContent = `$${total}`;
}
