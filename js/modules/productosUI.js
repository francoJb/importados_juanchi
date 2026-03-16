import { obtenerProductos } from "../productos.js";

export async function cargarCategorias(){
  const productos = await obtenerProductos();
  const select = document.getElementById("filtroCategoria");
  if(!select) return;
  const categorias = [...new Set(productos.map(p => p.categoria))];
  categorias.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });
}


export async function verificarStockBajo(){
  const productos = await obtenerProductos();
  const bajos = productos.filter(p => p.stock <= 2);
  if(bajos.length === 0) return;
  console.log("Productos con stock bajo:", bajos);
}


export async function cargarProductosSelect(){
  const productos = await obtenerProductos();
  const select = document.getElementById("inputProducto");
  if(!select) return;
  select.innerHTML = "";
  productos.forEach(p => {
    const option = document.createElement("option");
    option.value = p.nombre;
    option.textContent = `${p.nombre} (stock: ${p.stock})`;
    select.appendChild(option);
  });
}

export function initAutocomplete(){
  const inputProducto = document.getElementById("inputProducto");
  const sugerencias = document.getElementById("sugerenciasProductos");
  if(!inputProducto) return;
  inputProducto.addEventListener("input", async () => {
    const texto = inputProducto.value.toLowerCase();
    const productos = await obtenerProductos();
    sugerencias.innerHTML = "";
    if(texto.length === 0){
      sugerencias.classList.add("hidden");
      return;
    }
    const filtrados = productos.filter(p =>
      p.nombre.toLowerCase().includes(texto)
    );
    filtrados.forEach(p => {
      const div = document.createElement("div");
      div.className = "p-2 cursor-pointer hover:bg-gray-200";
      div.textContent = `${p.nombre} (stock: ${p.stock})`;
      div.addEventListener("click", () => {
        inputProducto.value = p.nombre;
        document.getElementById("inputPrecio").value = p.precio;
        sugerencias.classList.add("hidden");
      });
      sugerencias.appendChild(div);
    });
    sugerencias.classList.remove("hidden");
  });
}
