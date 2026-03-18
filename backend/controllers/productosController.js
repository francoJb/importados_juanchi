const db = require("../database/db");

exports.obtenerProductos = (req, res) => {
  db.all("SELECT * FROM productos WHERE activo = 1", [], (err, rows) => {
    if(err){
      console.error("Error al crear producto:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
};
exports.crearProducto = (req, res) => {
  const {codigo, nombre, marca, modelo, categoria, precio, stock, stock_minimo } = req.body;
  const categoriaLimpia = String(categoria || "").trim().toUpperCase() || "GENERAL";
    // 🔴 Validación básica
  if (!codigo || !nombre || !precio) {
    return res.status(400).json({
      error: "Código, nombre y precio son obligatorios"
    });
  }
  // 🔴 Validación numérica
  if (isNaN(precio) || isNaN(stock)) {
    return res.status(400).json({
      error: "Precio y stock deben ser números"
    });
  }

  db.run(
    `INSERT INTO productos (codigo, nombre, marca, modelo, categoria, precio, stock, stock_minimo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [codigo, nombre, marca, modelo, categoriaLimpia, precio, stock, stock_minimo],
    function(err){
      // 🔴 Error de duplicado
      if (err && err.message.includes("UNIQUE")) {
        return res.status(400).json({
          error: "Ya existe un producto con ese código"
        });
      }
      // 🔴 Otro error SQL
      if (err) {
        console.error("Error SQL:", err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID });
    }
  );
};

exports.eliminarProducto = (req, res) => {
  const id = req.params.id;
  db.run(
    "UPDATE productos SET activo = 0 WHERE id = ?",
    [req.params.id],
    function(err){
      if(err) return res.status(500).json(err);
      res.json({mensaje:"Producto desactivado"});
    }
  );
};

exports.actualizarProducto = (req, res) => {
  const id = req.params.id;
  const { nombre, marca, modelo, categoria, precio, stock } = req.body;
  const categoriaLimpia = String(categoria || "").trim().toUpperCase() || "GENERAL";
  db.run(
    `UPDATE productos
     SET nombre=?, marca=?, modelo=?, categoria=?, precio=?, stock=?
     WHERE id=?`,
    [nombre, marca, modelo, categoriaLimpia, precio, stock, id],
    function(err){
      if(err){
        return res.status(500).json(err);
      }
      res.json({ actualizado: true });
    }
  );
};
