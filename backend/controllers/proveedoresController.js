// backend/controllers/proveedoresController.js
const db = require('../database/database');

exports.obtenerProveedores = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM proveedores WHERE estado = 1 ORDER BY nombre");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.crearProveedor = async (req, res) => {
    const { nombre, cuit, arca_categoria, banco_cuenta, telefono, direccion, email, observaciones } = req.body;
    try {
        const [result] = await db.query(
            "INSERT INTO proveedores (nombre, cuit, arca_categoria, banco_cuenta, telefono, direccion, email, observaciones, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)",
            [nombre.toUpperCase(), cuit, arca_categoria, banco_cuenta, telefono, direccion, email, observaciones]
        );
        res.status(201).json({ id: result.insertId, nombre, cuit, arca_categoria, banco_cuenta, telefono, direccion, email, observaciones });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.actualizarProveedor = async (req, res) => {
    const { id } = req.params;
    const { nombre, cuit, arca_categoria, banco_cuenta, telefono, direccion, email, observaciones } = req.body;
    try {
        await db.query(
            "UPDATE proveedores SET nombre = ?, cuit = ?, arca_categoria = ?, banco_cuenta = ?, telefono = ?, direccion = ?, email = ?, observaciones = ? WHERE id = ?",
            [nombre.toUpperCase(), cuit, arca_categoria, banco_cuenta, telefono, direccion, email, observaciones, id]
        );
        res.json({ id, nombre, cuit, arca_categoria, banco_cuenta, telefono, direccion, email, observaciones });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.eliminarProveedor = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("UPDATE proveedores SET estado = 0 WHERE id = ?", [id]);
        res.json({ message: "Proveedor eliminado" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};