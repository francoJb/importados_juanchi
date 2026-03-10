const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// crear base de datos
const db = new sqlite3.Database("./database.db");

// crear tabla clientes si no existe
db.run(`
CREATE TABLE IF NOT EXISTS clientes (
id INTEGER PRIMARY KEY AUTOINCREMENT,
nombre TEXT,
apellido TEXT,
dni TEXT,
direccion TEXT,
telefono TEXT,
email TEXT
)
`);

// ruta para guardar cliente
app.post("/clientes", (req, res) => {
    const { nombre, apellido, dni, direccion, telefono, email } = req.body;

    db.run(
  "INSERT INTO clientes (nombre, apellido, dni, direccion, telefono, email) VALUES (?, ?, ?, ?, ?, ?)",
  [nombre, apellido, dni, direccion, telefono, email],
  function (err) {
    if (err) {
      return res.status(500).json(err);
    }
    res.json({ id: this.lastID });
  }
);
});

// ruta para obtener clientes
app.get("/clientes", (req, res) => {
    db.all("SELECT * FROM clientes", [], (err, rows) => {
        if (err) {
            return res.status(500).json(err);
        }
        res.json(rows);
    });
});

app.listen(3000, () => {
    console.log("Servidor corriendo en puerto 3000");
});