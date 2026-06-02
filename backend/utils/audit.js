const db = require('../database/database');
const { formatearFechaHoraArgentina, ahoraArgentinaDate } = require('./time');

async function logAction(connectionOrDb, { empresaId, usuarioId = null, accion, entidad, entidadId = null, descripcion = null }) {
  const fecha = formatearFechaHoraArgentina(ahoraArgentinaDate());
  const sql = `INSERT INTO auditoria (empresa_id, usuario_id, accion, entidad, entidad_id, descripcion, fecha) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const params = [empresaId, usuarioId, accion, entidad, entidadId, descripcion, fecha];

  // Si se pasa una conexión, usarla (útil dentro de transacciones), si no, usar el pool
  if (connectionOrDb && typeof connectionOrDb.query === 'function' && connectionOrDb.beginTransaction) {
    // Es una conexión del pool
    await connectionOrDb.query(sql, params);
  } else {
    await db.query(sql, params);
  }
}

module.exports = { logAction };
