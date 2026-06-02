function ahoraArgentinaDate() {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const offsetHoras = -3; // UTC-3
  return new Date(utc + (3600000 * offsetHoras));
}

function formatearFechaHoraArgentina(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  const hora = String(fecha.getHours()).padStart(2, '0');
  const min = String(fecha.getMinutes()).padStart(2, '0');
  const seg = String(fecha.getSeconds()).padStart(2, '0');
  return `${anio}-${mes}-${dia} ${hora}:${min}:${seg}`;
}

module.exports = { ahoraArgentinaDate, formatearFechaHoraArgentina };
