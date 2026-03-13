export function initNavigation(){

  const linkDashboard = document.getElementById("linkDashboard");
  const linkClientes = document.getElementById("linkClientes");
  const linkVentas = document.getElementById("linkVentas");
  const linkProductos = document.getElementById("linkProductos");

  const seccionDashboard = document.getElementById("seccionDashboard");
  const seccionClientes = document.getElementById("seccionClientes");
  const seccionVentas = document.getElementById("seccionVentas");
  const seccionProductos = document.getElementById("seccionProductos");

  function mostrarSeccion(seccion){

    seccionDashboard.classList.add("hidden");
    seccionClientes.classList.add("hidden");
    seccionVentas.classList.add("hidden");
    seccionProductos.classList.add("hidden");

    seccion.classList.remove("hidden");

  }

  linkDashboard.addEventListener("click", e=>{
    e.preventDefault();
    mostrarSeccion(seccionDashboard);
  });

  linkClientes.addEventListener("click", e=>{
    e.preventDefault();
    mostrarSeccion(seccionClientes);
  });

  linkVentas.addEventListener("click", e=>{
    e.preventDefault();
    mostrarSeccion(seccionVentas);
  });

  linkProductos.addEventListener("click", e=>{
    e.preventDefault();
    mostrarSeccion(seccionProductos);
  });

}
