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
  const {codigo, descripcion, marca, modelo, categoria, costo, precio, stock, stock_minimo, proveedor, iva, imagen_url, controlar_stock} = req.body;
  const categoriaLimpia = String(categoria || "").trim().toUpperCase() || "GENERAL";
    // 🔴 Validación básica
  if (!codigo || !descripcion || !precio) {
    return res.status(400).json({
      error: "Código, descripción y precio son obligatorios"
    });
  }
  // 🔴 Validación numérica
  if (isNaN(costo) || isNaN(precio) || isNaN(stock)) {
    return res.status(400).json({
      error: "Costo, precio y stock deben ser números"
    });
  }

  db.run(
    `INSERT INTO productos (codigo, descripcion, marca, modelo, categoria, costo, precio, stock, stock_minimo, proveedor, iva, imagen_url, controlar_stock)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [codigo, descripcion, marca, modelo, categoriaLimpia, costo, precio, stock, stock_minimo, proveedor, iva, imagen_url, controlar_stock],
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
  const { codigo, descripcion, marca, modelo, categoria, costo, precio, stock, stock_minimo, proveedor, iva, imagen_url, controlar_stock } = req.body;
  const categoriaLimpia = String(categoria || "").trim().toUpperCase() || "GENERAL";
  // Asegurate de que no haya comas antes del WHERE y que los nombres coincidan con la DB
  const sql = `UPDATE productos 
               SET codigo=?, descripcion=?, marca=?, modelo=?, categoria=?, costo=?, precio=?, stock=?, stock_minimo=?, proveedor=?, iva=?, imagen_url=?, controlar_stock=?
               WHERE id=?`;
  const valores = [
    codigo,
    descripcion,
    marca,
    modelo,
    categoriaLimpia,
    costo,
    precio,
    stock,
    stock_minimo,
    proveedor,
    iva,
    imagen_url,
    controlar_stock,
    id
  ];
  db.run(sql, valores, function(err) {
    if (err) {
      // Este log te dirá exactamente qué falló en la terminal de VS Code
      console.error("Error en el UPDATE:", err.message); 
      return res.status(500).json({ error: err.message });
    }
    res.json({ actualizado: true });
  });
};

