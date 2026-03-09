import { obtenerVentas } from "./ventas.js";

export function verDetalleVenta(id) {

  const contenedor = document.getElementById("detalleVenta");

  if (!contenedor) {
    console.log("No existe el contenedor detalleVenta");
    return;
  }

  const ventas = obtenerVentas();
  const venta = ventas.find(v => v.id === id);

  if (!venta) return;

  let html = `
    <h3 class="text-lg font-bold mb-3">Venta #${venta.id}</h3>
    <p>Fecha: ${venta.fecha}</p>
    <p>Cliente: ${venta.cliente}</p>

    <table class="w-full mt-4">
      <thead>
        <tr>
          <th>Producto</th>
          <th>Cant</th>
          <th>Precio</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>
  `;

  venta.productos.forEach(p => {
    html += `
      <tr>
        <td>${p.producto}</td>
        <td>${p.cantidad}</td>
        <td>$${p.precio}</td>
        <td>$${p.precio * p.cantidad}</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;

  contenedor.innerHTML = html;
}