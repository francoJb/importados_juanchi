const db = require("../database/db");

exports.obtenerProductos = (req, res) => {
  db.all("SELECT * FROM productos WHERE activo = 1", [], (err, rows) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.json(rows);
  });
};
exports.crearProducto = (req, res) => {
  const {codigo, nombre, marca, modelo, categoria, precio, stock, stock_minimo } = req.body;
  db.run(
    `INSERT INTO productos (codigo, nombre, marca, modelo, categoria, precio, stock, stock_minimo)
     VALUES (?, ?, ?, ?, ?, ?, ?  )`,
    [codigo, nombre, marca, modelo, categoria, precio, stock, stock_minimo],
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
