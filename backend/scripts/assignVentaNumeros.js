#!/usr/bin/env node
const db = require('../database/database');

async function main() {
  const apply = process.argv.includes('--apply');
  console.log(apply ? 'Aplicando asignación de números correlativos...' : 'Dry-run: mostrar asignaciones (use --apply para ejecutar)');

  try {
    const [empRows] = await db.query('SELECT DISTINCT empresa_id FROM ventas WHERE empresa_id IS NOT NULL');
    if (!empRows || empRows.length === 0) {
      console.log('No se encontraron ventas con empresa_id.');
      process.exit(0);
    }

    for (const er of empRows) {
      const empresaId = er.empresa_id;
      const [ventas] = await db.query('SELECT id FROM ventas WHERE empresa_id = ? ORDER BY id ASC', [empresaId]);
      if (!ventas || ventas.length === 0) continue;

      console.log(`Empresa ${empresaId}: ${ventas.length} ventas`);
      let n = 1;

      // Ejecutar en transacción por empresa para seguridad
      if (apply) {
        const conn = await db.getConnection();
        try {
          await conn.beginTransaction();
          for (const v of ventas) {
            await conn.query('UPDATE ventas SET numero = ? WHERE id = ?', [n, v.id]);
            n++;
          }
          await conn.commit();
        } catch (err) {
          await conn.rollback();
          conn.release();
          throw err;
        }
        conn.release();
        console.log(` Empresa ${empresaId}: numeración actualizada.`);
      } else {
        for (const v of ventas) {
          console.log(`  id ${v.id} -> numero ${n}`);
          n++;
        }
      }
    }

    if (!apply) console.log('\nDry-run completado. Reejecuta con --apply para aplicar los cambios.');
    else console.log('\nAsignación completada.');
    process.exit(0);
  } catch (error) {
    console.error('Error al asignar números:', error);
    process.exit(1);
  }
}

main();
