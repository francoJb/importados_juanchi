export async function obtenerProductos() {
  const res = await fetch("http://localhost:3000/productos");
  const data = await res.json();
  return data;
}


export async function agregarProducto(codigo, nombre, marca, modelo, categoria, precio, stock, stock_minimo) {
  const errorDiv = document.getElementById("errorProducto");
  const res = await fetch("http://localhost:3000/productos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      codigo,
      nombre,
      marca,
      modelo,
      categoria,
      precio,
      stock,
      stock_minimo
    })
  });
  const data = await res.json();
  console.log("STATUS:", res.status);
  console.log("RESPUESTA:", data);

  if (!res.ok) {
    errorDiv.textContent = data.error;
    errorDiv.style.display = "block";
    return false;
  }
    errorDiv.style.display = "none";
    errorDiv.textContent = "Producto guardado correctamente";
    errorDiv.style.color = "green";
      
}

export async function eliminarProducto(id) {

  await fetch(`http://localhost:3000/productos/${id}`, {
    method: "DELETE"
  });
}

export async function editarProducto(id, nombre, marca, modelo, categoria, precio, stock, stock_minimo) {
  await fetch(`http://localhost:3000/productos/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      codigo,
      nombre,
      marca,
      modelo,
      categoria,
      precio,
      stock,
      stock_minimo
    })
  });
}

export async function descontarStock(id, cantidadRestar) {
  // 1. Obtenemos todos los productos para encontrar el actual
  const productos = await obtenerProductos();
  const productoActual = productos.find(p => p.id == id);

  if (!productoActual) {
      console.error("Producto no encontrado para descontar stock");
      return;
  }

  // 2. Calculamos el nuevo stock
  const nuevoStock = productoActual.stock - cantidadRestar;

  // 3. Enviamos la actualización al servidor
  // ¡OJO! Aquí es donde probablemente llamabas a 'editarProducto' mal.
  // Debemos llamar a la API directamente (fetch)
  const response = await fetch(`http://localhost:3000/productos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...productoActual, // Mantenemos los otros datos igual (nombre, precio, etc)
      stock: nuevoStock  // Solo sobreescribimos el stock
    })
  });

  if (!response.ok) {
      throw new Error("No se pudo actualizar el stock en el servidor");
  }
}

