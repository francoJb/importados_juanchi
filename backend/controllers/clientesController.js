const db = require('../database/database');

exports.obtenerClientes = (req, res) => {
    db.all("SELECT * FROM productos WHERE estado = 1", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

exports.crearCliente = (req, res) => {
    const p = req.body;
    const sql = `INSERT INTO clientes (nombre, apellido, telefono, direccion, dni, cuit, arca, email, fecha_alta)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [p.nombre, p.apellido, p.telefono, p.direccion, p.dni, p.cuit, p.arca, p.email, p.fecha_alta];
    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID, ...p });
    });
};

exports.editarCliente = (req, res) => {
    const { id } = req.params;
    const p = req.body;
    const sql = `UPDATE productos SET nombre=?, apellido=?, telefono=?, direccion=?, dni=?, cuit=?, arca=?, email=?, fecha_alta=? WHERE id=?`;
    const params = [p.nombre, p.apellido, p.telefono, p.direccion, p.dni, p.cuit, p.arca, p.email, p.fecha_alta ,id];
    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ mensaje: "Actualizado", cambios: this.changes });
    });
};

exports.eliminarCliente = (req, res) => {
    // 1. Obtenemos el ID que viene en la URL
    const { id } = req.params;
    // 2. Definimos el SQL para la "Baja Lógica" (poner estado en 0)
    const sql = `UPDATE clientes SET estado = 0 WHERE id = ?`;
    // 3. Le pedimos a SQLite que ejecute el cambio
    db.run(sql, [id], function(err) {
        if (err) {
            // Si hay un error de base de datos, avisamos al frontend
            console.error("Error al desactivar cliente:", err.message);
            return res.status(500).json({ error: err.message });
        }
        // Si no se cambió ninguna fila, es porque el ID no existía
        if (this.changes === 0) {
            return res.status(404).json({ mensaje: "Cliente no encontrado" });
        }
        // Si todo salió bien, respondemos con éxito
        res.json({ 
            mensaje: "Cliente desactivado correctamente",
            id: id 
        });
    });
};