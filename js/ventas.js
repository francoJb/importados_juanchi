import { save, load } from "./storage.js";

export function obtenerVentas() {
  return load("ventas") || [];
}

function generarNumeroVenta() {
  const ventas = obtenerVentas();
  if (ventas.length === 0) {
    return "0001";
  }
  const ultimoNumero = Math.max(...ventas.map(v => Number(v.id)));
  const nuevoNumero = ultimoNumero + 1;
  return nuevoNumero.toString().padStart(4, "0");
}

export function guardarVenta(carrito, total, cliente) {
  const ventas = obtenerVentas();

  const nuevaVenta = {
    id: generarNumeroVenta(),
    fecha: new Date().toLocaleDateString(),
    cliente: cliente || "Consumidor Final",
    productos: carrito,
    total: total,
    saldo: 0,
    entregado: false
  };

  ventas.push(nuevaVenta);
  save("ventas", ventas);
}