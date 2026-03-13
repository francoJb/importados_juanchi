const db = require("../database/db");

exports.obtenerProductos = (req, res) => {
  db.all("SELECT * FROM productos", [], (err, rows) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.json(rows);
  });
};
exports.crearProducto = (req, res) => {
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
};
exports.eliminarProducto = (req, res) => {
  const id = req.params.id;
  db.run(
    "DELETE FROM productos WHERE id = ?",
    [id],
    function(err){
      if(err){
        return res.status(500).json(err);
      }
      res.json({ eliminado: true });
    }
  );
};
exports.actualizarProducto = (req, res) => {
  const id = req.params.id;
  const { nombre, marca, modelo, categoria, precio, stock } = req.body;
  db.run(
    `UPDATE productos
     SET nombre=?, marca=?, modelo=?, categoria=?, precio=?, stock=?
     WHERE id=?`,
    [nombre, marca, modelo, categoria, precio, stock, id],
    function(err){
      if(err){
        return res.status(500).json(err);
      }
      res.json({ actualizado: true });
    }
  );
};
