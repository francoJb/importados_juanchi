import { obtenerVentas } from "./ventas.js";

let chart;

export function renderGrafico() {

  const ventas = obtenerVentas();

  const dias = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  const totales = [0,0,0,0,0,0,0];

  ventas.forEach(v => {
    const fecha = new Date(v.fecha);
    const dia = fecha.getDay();
    totales[dia] += v.total;
  });

  const ctx = document.getElementById("graficoVentas");

  if(chart){
    chart.destroy();
  }

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: dias,
      datasets: [{
        label: "Ventas USD",
        data: totales,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });

}