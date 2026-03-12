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
export function agregarProducto(nombre, precio, stock) {
  const productos = obtenerProductos();
  const nuevo = {
    id: "P" + (productos.length + 1).toString().padStart(3, "0"),
    nombre,
    precio,
    stock
  };
  productos.push(nuevo);
  save("productos", productos);
}

export function eliminarProducto(index) {
  const productos = obtenerProductos();
  productos.splice(index, 1);
  save("productos", productos);
}

export function editarProducto(index, nombre, precio, stock) {
  const productos = obtenerProductos();
  productos[index].nombre = nombre;
  productos[index].precio = precio;
  productos[index].stock = stock;
  save("productos", productos);
}