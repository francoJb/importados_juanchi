#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const db = require('../database/database');

async function run() {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  if (files.length === 0) {
    console.log('No hay migraciones para ejecutar.');
    process.exit(0);
  }

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    console.log('Ejecutando migración:', file);
    const sql = fs.readFileSync(filePath, 'utf8');

    // Separar por ; pero respetar que puede haber ; dentro de comentarios o strings.
    // Usaremos una división simple por ; y filtraremos líneas vacías — suficiente para migraciones simples.
    const statements = sql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);

    for (const stmt of statements) {
      try {
        console.log(' Ejecutando statement...');
        await db.query(stmt);
      } catch (err) {
        console.error(' Error ejecutando statement:', err.message || err);
        // Continuar con la siguiente statement
      }
    }
  }

  console.log('Migraciones finalizadas.');
  process.exit(0);
}

run().catch(err => {
  console.error('Error en migraciones:', err);
  process.exit(1);
});
