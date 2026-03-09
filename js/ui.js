import { obtenerVentas } from "./ventas.js";


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

export function renderVentas() {

  const ventas = obtenerVentas();

  const tabla = document.getElementById("tablaVentasBody");

  if (!tabla) return;

  tabla.innerHTML = "";

  ventas.forEach(v => {

    const saldo = v.saldo ?? 0;
    const entregado = v.entregado ? "SI" : "NO";

    let colorSaldo = "text-green-600";
    if (saldo > 0 && saldo < v.total) {
      colorSaldo = "text-yellow-500";
    }
    if (saldo === v.total) {
      colorSaldo = "text-red-600";
    }

    tabla.innerHTML += `
      <tr class="hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer">

        <td class="p-4 font-semibold">${v.id}</td>

        <td class="p-4">${v.fecha}</td>

        <td class="p-4 text-right font-bold text-naranja-600">
          $${v.total}
        </td>

        <td class="p-4 text-right">
          $${saldo}
        </td>

        <td class="p-4 text-center">
          ${entregado}
        </td>

        <td class="p-4">
          ${v.cliente || "Consumidor Final"}
        </td>

        <td class="p-4 text-center">

          <button 
            onclick="verDetalleVenta('${v.id}')"
            class="text-blue-500 hover:underline text-sm"
          >
            Ver
          </button>

        </td>

      </tr>
    `;

  });

}

