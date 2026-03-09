import { save, load } from "./storage.js";

export function obtenerVentas() {
  return load("ventas") || [];
}

function generarNumeroVenta() {
  const ventas = obtenerVentas();
  const numero = ventas.length + 1;
  return numero.toString().padStart(4, "0");
}

export function guardarVenta(carrito, total) {
  const ventas = obtenerVentas();
  const nuevaVenta = {
    id: generarNumeroVenta(),
    fecha: new Date().toLocaleDateString(),
    cliente: "Consumidor Final",
    productos: carrito,
    total: total,
    saldo: 0,
    entregado: false
  };
  ventas.push(nuevaVenta);
  save("ventas", ventas);
}