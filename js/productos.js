import { save, load } from "./storage.js";

export function obtenerProductos() {
  return load("productos") || [];
}

export function guardarProductos(productos) {
  save("productos", productos);
}

export function descontarStock(carrito) {
  const productos = obtenerProductos();

  carrito.forEach(item => {
    const producto = productos.find(p => p.nombre === item.producto);

    if (producto) {
      producto.stock -= item.cantidad;
    }
  });

  guardarProductos(productos);
}