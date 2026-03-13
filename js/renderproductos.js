import { obtenerProductos } from "./productos.js";

export function renderProductos(categoria = "todas", texto = "") {

    let productos = obtenerProductos();
    if(categoria !== "todas"){
        productos = productos.filter(p => p.categoria === categoria);
    }
    if(texto !== ""){
        const t = texto.toLowerCase();
            productos = productos.filter(p =>
            p.nombre.toLowerCase().includes(t) ||
            p.marca.toLowerCase().includes(t) ||
            p.modelo.toLowerCase().includes(t)
        );
    }

    const tabla = document.getElementById("tablaProductosBody");
    if (!tabla) return;
    tabla.innerHTML = "";
    productos.forEach((p, index) => {
        tabla.innerHTML += `
            <tr class="border-b">
                <td class="p-2">${p.id}</td>
                <td class="p-2">${p.nombre}</td>
                <td class="p-2">${p.marca}</td>
                <td class="p-2">${p.modelo}</td>
                <td class="p-2">${p.categoria}</td>
                <td class="p-2">$${p.precio}</td>
                <td class="p-2">${p.stock <= 2 ? `<span class="text-red-500 font-bold">⚠ ${p.stock}</span>`: p.stock}</td>
                <td class="p-2 text-center">
                    <button onclick="editarProducto(${index})" class="text-blue-500 mr-2">
                        ✏️
                    </button>
                    <button onclick="eliminarProducto(${index})" class="text-red-500">
                        🗑
                    </button>
                </td>
            </tr>
        `;
    });
}