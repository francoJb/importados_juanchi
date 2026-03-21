const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("Error al abrir base de datos", err);
    else console.log("✅ Conectado a SQLite: database.db");
});

// Crear tablas iniciales
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sku TEXT,
        descripcion TEXT NOT NULL,
        marca TEXT,
        modelo TEXT,
        categoria TEXT,
        proveedor TEXT,
        costo REAL,
        precio_neto REAL,
        iva REAL,
        control_stock INTEGER,
        stock INTEGER,
        stock_minimo INTEGER,
        estado INTEGER
    )`);
});

module.exports = db;