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
      <td>${cliente.dni}</td>
      <td>${cliente.direccion}</td>
      <td>${cliente.telefono}</td>
      <td>${cliente.email}</td>
    `;

    tabla.appendChild(fila);

  });

}

export async function guardarCliente(){

  const nombre = document.getElementById("inputNombreCliente").value;
  const apellido = document.getElementById("inputApellidoCliente").value;
  const dni = document.getElementById("inputDniCliente").value;
  const direccion = document.getElementById("inputDireccionCliente").value;
  const telefono = document.getElementById("inputTelefonoCliente").value;
  const email = document.getElementById("inputEmailCliente").value;

  const respuesta = await fetch("http://localhost:3000/clientes",{

    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },

    body: JSON.stringify({
      nombre,
      apellido,
      dni,
      direccion,
      telefono,
      email
    })

  });

  await respuesta.json();

  await cargarClientes();

  document.getElementById("inputNombreCliente").value="";
  document.getElementById("inputApellidoCliente").value="";
  document.getElementById("inputDniCliente").value="";
  document.getElementById("inputDireccionCliente").value="";
  document.getElementById("inputTelefonoCliente").value="";
  document.getElementById("inputEmailCliente").value="";

  document.getElementById("modalCliente").classList.add("hidden");

}



