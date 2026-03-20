export async function cargarClientes(){
  const respuesta = await fetch("http://localhost:3000/clientes");
  const clientes = await respuesta.json();
  const tabla = document.getElementById("listaClientes");
  if(!tabla) return;
  tabla.innerHTML = "";
  clientes.forEach(cliente => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${cliente.id}</td>
      <td>${cliente.nombre}</td>
      <td>${cliente.apellido}</td>
      <td>${cliente.cuit}</td>
      <td>${cliente.direccion}</td>
      <td>${cliente.telefono}</td>
      <td>${cliente.email}</td>
      td>${cliente.arca}</td>
      td>${cliente.saldo}</td>
      td>${cliente.habilitar_cc}</td>

    `;
    tabla.appendChild(fila);
  });
}





