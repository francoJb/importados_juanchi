export async function obtenerProductos() {
  const res = await fetch("http://localhost:3000/productos");
  const productos = await res.json();
  return productos;
}

export async function agregarProducto(nombre, marca, modelo, categoria, precio, stock) {
  await fetch("http://localhost:3000/productos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      nombre,
      marca,
      modelo,
      categoria,
      precio,
      stock
    })
  });
}

export async function eliminarProducto(id) {

  await fetch(`http://localhost:3000/productos/${id}`, {
    method: "DELETE"
  });
}

export async function editarProducto(id, nombre, marca, modelo, categoria, precio, stock) {
  await fetch(`http://localhost:3000/productos/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      nombre,
      marca,
      modelo,
      categoria,
      precio,
      stock
    })
  });
}

export async function descontarStock(carrito) {
  const productos = await obtenerProductos();
  for (let item of carrito) {
    const productoDB = productos.find(p => p.nombre === item.producto);
    if (!productoDB) continue;
    const nuevoStock = productoDB.stock - item.cantidad;
    await editarProducto(
      productoDB.id,
      productoDB.nombre,
      productoDB.marca,
      productoDB.modelo,
      productoDB.categoria,
      productoDB.precio,
      nuevoStock
    );
  }
}
