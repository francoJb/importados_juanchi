const db = require("../database/db");
exports.obtenerClientes = (req, res) => {
  db.all("SELECT * FROM clientes", [], (err, rows) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.json(rows);
  });
};
exports.crearCliente = (req, res) => {
  const { nombre, apellido, dni, direccion, telefono, email } = req.body;
  db.run(
    `INSERT INTO clientes (nombre, apellido, dni, direccion, telefono, email)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [nombre, apellido, dni, direccion, telefono, email],
    function(err){
      if(err){
        return res.status(500).json(err);
      }
      res.json({ id: this.lastID });
    }
  );
};
