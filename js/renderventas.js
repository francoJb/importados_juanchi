import { obtenerVentas } from "./ventas.js";

export function renderVentas() {
  const ventas = obtenerVentas();
  const tablaBody = document.getElementById("tablaVentasBody");

  tablaBody.innerHTML = "";

  ventas.forEach((venta) => {
    const fila = document.createElement("tr");

    fila.innerHTML = `
      <td>${venta.id}</td>
      <td>${venta.fecha}</td>
      <td>${venta.cliente}</td>
      <td>$${venta.total}</td>
      <td>${venta.entregado ? "✔" : "Pendiente"}</td>
    `;

    tablaBody.appendChild(fila);
  });
}