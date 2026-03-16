const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const clientesRoutes = require("./routes/clientesRoutes");
const productosRoutes = require("./routes/productosRoutes");
const ventasRoutes = require("./routes/ventasRoutes");



const app = express();
app.use(cors());
app.use(express.json());
app.use("/clientes", clientesRoutes);
app.use("/productos", productosRoutes);
app.use("/ventas", ventasRoutes);



// crear base de datos
const db = new sqlite3.Database("./database.db");

// crear tabla CLIENTES si no existe
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

// crear tabla PRODUCTOS si no existe
db.run(`
CREATE TABLE IF NOT EXISTS productos (
id INTEGER PRIMARY KEY AUTOINCREMENT,
codigo TEXT,
nombre TEXT,
marca TEXT,
modelo TEXT,
categoria TEXT,
precio REAL,
stock INTEGER,
stock_minimo INTEGER DEFAULT 1,
activo INGEGER DEFAULT 1
)
`);

// crear tabla VENTAS si no existe
db.run(`
CREATE TABLE IF NOT EXISTS ventas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente TEXT,
  total REAL,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);

// crear tabla DETALLE_VENTA si no existe
db.run(`
CREATE TABLE IF NOT EXISTS detalle_venta (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venta_id INTEGER,
  producto TEXT,
  precio REAL,
  cantidad INTEGER
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

// ruta para guardar PRODCTOS
app.post("/productos", (req, res) => {
  const { nombre, marca, modelo, categoria, precio, stock } = req.body;
  db.run(
    `INSERT INTO productos (nombre, marca, modelo, categoria, precio, stock)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [nombre, marca, modelo, categoria, precio, stock],
    function(err){
      if(err){
        return res.status(500).json(err);
      }
      res.json({ id: this.lastID });
    }
  );
});

// ruta para obtener PRODUCTOS
app.get("/productos", (req, res) => {
  db.all("SELECT * FROM productos", [], (err, rows) => {
    if(err){
      return res.status(500).json(err);
    }
    res.json(rows);
  });
});

app.listen(3000, () => {
    console.log("Servidor corriendo en puerto 3000");
});