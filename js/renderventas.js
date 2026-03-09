import { obtenerVentas } from "./ventas.js";

export function renderVentas() {
  const ventas = obtenerVentas();
  const tabla = document.getElementById("tablaVentasBody");

  tabla.innerHTML = "";

  ventas.forEach(v => {
    const entregado = v.entregado ? "SI" : "NO";

    tabla.innerHTML += `
      <tr class="hover:bg-gray-50 dark:hover:bg-slate-700">
        <td class="p-4 font-semibold">${v.id}</td>
        <td class="p-4">${v.fecha}</td>
        <td class="p-4">$${v.total}</td>
        <td class="p-4">$${v.saldo ?? 0}</td>
        <td class="p-4">${entregado}</td>
        <td class="p-4">${v.cliente || "Consumidor Final"}</td>

        <td class="p-4 text-center">
          <button 
            onclick="verDetalleVenta('${v.id}')"
            class="text-blue-500 hover:underline"
            >
            Ver
          </button>
        </td>
      </tr>
    `;
  });
}