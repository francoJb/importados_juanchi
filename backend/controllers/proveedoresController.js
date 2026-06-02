// backend/controllers/proveedoresController.js
const db = require('../database/database');
const { formatearFechaHoraArgentina, ahoraArgentinaDate } = require('../utils/time');
const { logAction } = require('../utils/audit');

exports.obtenerProveedores = async (req, res) => {
    try {
        const empresaId = req.empresaId;
        const estado = req.query.estado === 'eliminados' ? 0 : 1;
        const [rows] = await db.query("SELECT * FROM proveedores WHERE empresa_id=? AND estado = ? ORDER BY nombre", [empresaId, estado]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.crearProveedor = async (req, res) => {
    const { nombre, cuit, arca_categoria, banco_cuenta, telefono, direccion, email, observaciones } = req.body;
    try {
        const [result] = await db.query(
            "INSERT INTO proveedores (empresa_id, nombre, cuit, arca_categoria, banco_cuenta, telefono, direccion, email, observaciones, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)",
            [req.empresaId, nombre.toUpperCase(), cuit, arca_categoria, banco_cuenta, telefono, direccion, email, observaciones]
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
        const [result] = await db.query(
            "UPDATE proveedores SET nombre = ?, cuit = ?, arca_categoria = ?, banco_cuenta = ?, telefono = ?, direccion = ?, email = ?, observaciones = ? WHERE empresa_id=? AND id = ? AND estado = 1",
            [nombre.toUpperCase(), cuit, arca_categoria, banco_cuenta, telefono, direccion, email, observaciones, req.empresaId, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Proveedor no encontrado o inactivo' });
        }
        res.json({ id, nombre, cuit, arca_categoria, banco_cuenta, telefono, direccion, email, observaciones });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.eliminarProveedor = async (req, res) => {
    const { id } = req.params;
    const fecha = formatearFechaHoraArgentina(ahoraArgentinaDate());
    try {
        const [result] = await db.query("UPDATE proveedores SET estado = 0, deleted_at = ?, deleted_by = ? WHERE empresa_id=? AND id=?", [fecha, req.usuarioId || null, req.empresaId, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Proveedor no encontrado" });
        }
        await logAction(db, { empresaId: req.empresaId, usuarioId: req.usuarioId || null, accion: 'soft_delete', entidad: 'proveedores', entidadId: id, descripcion: 'Proveedor desactivado' });
        res.json({ message: "Proveedor eliminado" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.restaurarProveedor = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query("UPDATE proveedores SET estado = 1, deleted_at = NULL, deleted_by = NULL WHERE empresa_id=? AND id=? AND estado = 0", [req.empresaId, id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Proveedor eliminado no encontrado' });
        await logAction(db, { empresaId: req.empresaId, usuarioId: req.usuarioId || null, accion: 'restore', entidad: 'proveedores', entidadId: id, descripcion: 'Proveedor restaurado' });
        res.json({ message: 'Proveedor restaurado', id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};