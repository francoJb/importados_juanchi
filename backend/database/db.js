const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "database.db");

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error al conectar:", err.message);
    } else {
        console.log("Conectado a SQLite en:", dbPath);
        crearTablas(); // Llamamos a la creación de tablas aquí
    }
});

function crearTablas() {
    db.serialize(() => {
        // Tabla Productos con la columna 'activo'
        db.run(`CREATE TABLE IF NOT EXISTS productos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo TEXT UNIQUE,
            descripcion TEXT,
            marca TEXT,
            modelo TEXT,
            categoria TEXT,
            costo REAL,
            precio REAL,
            stock INTEGER,
            stock_minimo INTEGER DEFAULT 1,
            activo INTEGER DEFAULT 1,
            proveedor TEXT,
            iva REAL DEFAULT 21,
            imagen_url TEXT,
            controlar_stock INTEGER DEFAULT 1
        )`);

        // Tabla Clientes
        db.run(`CREATE TABLE IF NOT EXISTS clientes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT,
            apellido TEXT,
            dni TEXT,
            direccion TEXT,
            telefono TEXT,
            email TEXT
        )`);


        console.log("Tablas verificadas/creadas correctamente.");
    });
}

module.exports = db;
