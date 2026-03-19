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
  const { nombre, apellido, cuit, direccion, telefono, email, arca, saldo, habilitar_cc } = req.body;

  // 1. Validación básica (quitamos isNaN de cuit para permitir guiones)
  if (!nombre || !apellido || !cuit || !telefono) {
    return res.status(400).json({
      error: "Nombre, Apellido, DNI/CUIT y teléfono son OBLIGATORIOS"
    });
  }

  // 2. Insertar en la base de datos
  db.run(
    `INSERT INTO clientes (nombre, apellido, cuit, direccion, telefono, email, arca, saldo, habilitar_cc)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [nombre, apellido, cuit, direccion, telefono, email, arca || 'Consumidor Final', saldo || 0, habilitar_cc],
    function(err) {
      // Error de duplicado (DNI o CUIT ya cargado)
      if (err && err.message.includes("UNIQUE")) {
        return res.status(400).json({
          error: "Ya existe un cliente registrado con ese DNI/CUIT"
        });
      }
      
      if (err) {
        console.error("Error SQL:", err.message);
        return res.status(500).json({ error: err.message });
      }
      
      res.json({ id: this.lastID });
    }
  );
};



exports.registrarCobro = (req, res) => {
    const { id } = req.params;
    const { monto } = req.body;

    db.run(
        "UPDATE clientes SET saldo = saldo - ? WHERE id = ?",
        [monto, id],
        function(err) {
            if (err) return res.status(500).json(err);
            res.json({ mensaje: "Cobro procesado" });
        }
    );
};



