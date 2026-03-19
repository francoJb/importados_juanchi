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

export async function guardarCliente() {
  // 1. Capturamos los datos con los IDs exactos del nuevo modal
  const nombre = document.getElementById("clienteNombre").value;
  const apellido = document.getElementById("clienteApellido").value;
  const cuit = document.getElementById("clienteCuit").value;
  const direccion = document.getElementById("clienteDireccion").value;
  const telefono = document.getElementById("clienteTelefono").value;
  const email = document.getElementById("clienteEmail").value;
  const arca = document.getElementById("clienteArca").value;
  
  // Convertimos a número el saldo
  const saldo = parseFloat(document.getElementById("clienteSaldo").innerText.replace("$ ", "")) || 0;
  
  // Usamos .checked para el checkbox (1 si está marcado, 0 si no)
  const habilitar_cc = document.getElementById("clienteHabilitarCC").checked ? 1 : 0;

  // 2. Enviamos al servidor
  const respuesta = await fetch("http://localhost:3000/clientes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nombre, apellido, cuit, direccion, telefono, email, arca, saldo, habilitar_cc
    })
  });

  if (respuesta.ok) {
    // 3. Si todo salió bien, actualizamos y cerramos
    await cargarClientes();
    
    // Limpiamos el formulario (recomiendo usar .reset() si es un <form>)
    document.getElementById("formCliente").reset();
    
    // Cerramos usando la función global que creamos
    toggleModal("modalCliente", false);
    
    alert("✅ Cliente guardado con éxito");
  } else {
    alert("❌ Error al guardar el cliente");
  }
}



