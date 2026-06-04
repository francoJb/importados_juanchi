const db = require('../database/database');
const { formatearFechaHoraArgentina, ahoraArgentinaDate } = require('../utils/time');
const { logAction } = require('../utils/audit');


exports.obtenerClientes = async (req, res) => {
    try {
        const empresaId = req.empresaId;
        const estado = req.query.estado === 'eliminados' ? 0 : 1;
        const [rows] = await db.query(
            "SELECT * FROM clientes WHERE empresa_id = ? AND estado = ? ORDER BY nombre, apellido",
            [empresaId, estado]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.crearCliente = async (req, res) => {
    const p = req.body;
    
    if (!p.nombre?.trim() || !p.apellido?.trim() || !p.dni?.trim()) {
        return res.status(400).json({ error: "Nombre, apellido y DNI son obligatorios" });
    }

    const sql = `INSERT INTO clientes (empresa_id, nombre, apellido, telefono, direccion, dni, cuit, arca, email, habilitar_cc, estado)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`;
    const cuitLimpio = (p.cuit || "").trim();
    const cuitParaGuardar = cuitLimpio === "" ? null : cuitLimpio;             
    const params = [req.empresaId, p.nombre, p.apellido, p.telefono, p.direccion, p.dni, cuitParaGuardar, p.arca, p.email, p.habilitar_cc ? 1 : 0];

    try {
        const [result] = await db.query(sql, params);
        // En MySQL el ID generado está en result.insertId
        res.status(201).json({ id: result.insertId, ...p });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            const msg = (err.sqlMessage || err.message || "").toLowerCase();

            if (msg.includes("dni")) {
                return res.status(400).json({ error: "El DNI ya está registrado" });
            }

            if (msg.includes("cuit") || msg.includes("cuil")) {
                return res.status(400).json({ error: "El CUIT/CUIL ya está registrado" });
            }

            return res.status(400).json({ error: "DNI o CUIT ya registrado" });
        }
        // MySQL usa ENUM, si el valor no coincide daría error aquí
        if (err.code === 'ER_WARN_DATA_TRUNCATED') {
            return res.status(400).json({ error: "Condición fiscal inválida" });
        }
        res.status(500).json({ error: err.message });
    }
};

exports.editarCliente = async (req, res) => {
    const { id } = req.params;
    const empresaId = req.empresaId;
    const p = req.body;

    if (!p.nombre?.trim() || !p.apellido?.trim() || !p.dni?.trim()) {
        return res.status(400).json({ error: "Datos inválidos" });
    }

    const sql = `UPDATE clientes SET nombre=?, apellido=?, telefono=?, direccion=?, dni=?, cuit=?, arca=?, email=?, habilitar_cc=? WHERE empresa_id=? AND id=? AND estado = 1`;
    const cuitLimpio = (p.cuit || "").trim();
    const cuitParaGuardar = cuitLimpio === "" ? null : cuitLimpio;
    const params = [p.nombre, p.apellido, p.telefono, p.direccion, p.dni, cuitParaGuardar, p.arca, p.email, p.habilitar_cc ? 1 : 0, empresaId, id];

    try {
        const [result] = await db.query(sql, params);
        // En MySQL los cambios están en result.affectedRows
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: "Cliente no encontrado" });
        }
        res.json({ mensaje: "Actualizado", cambios: result.affectedRows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.eliminarCliente = async (req, res) => {
    const { id } = req.params;
    const empresaId = req.empresaId;
    
    // Usamos NOW() de MySQL para evitar errores de formato string vs datetime en Staging
    const sql = `UPDATE clientes SET estado = 0, deleted_at = NOW(), deleted_by = ? WHERE empresa_id = ? AND id = ?`;
    
    try {
        // Quitamos la variable 'fecha' de los parámetros ya que NOW() lo resuelve la base de datos
        const [result] = await db.query(sql, [req.usuarioId || null, empresaId, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: "Cliente no encontrado o no pertenece a la empresa" });
        }
        
        // Registrar auditoría
        await logAction(db, { 
            empresaId, 
            usuarioId: req.usuarioId || null, 
            accion: 'soft_delete', 
            entidad: 'clientes', 
            entidadId: id, 
            descripcion: 'Cliente desactivado' 
        });
        
        res.json({ 
            mensaje: "Cliente desactivado correctamente",
            id: id 
        });
    } catch (err) {
        console.error("Error al desactivar cliente:", err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.restaurarCliente = async (req, res) => {
    const { id } = req.params;
    const empresaId = req.empresaId;

    try {
        const [result] = await db.query(
            "UPDATE clientes SET estado = 1, deleted_at = NULL, deleted_by = NULL WHERE empresa_id = ? AND id = ? AND estado = 0",
            [empresaId, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: "Cliente eliminado no encontrado" });
        }
        await logAction(db, { empresaId, usuarioId: req.usuarioId || null, accion: 'restore', entidad: 'clientes', entidadId: id, descripcion: 'Cliente restaurado' });
        res.json({ mensaje: "Cliente restaurado correctamente", id });
    } catch (err) {
        console.error("Error al restaurar cliente:", err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.obtenerCuentaCorriente = async (req, res) => {
    const { id } = req.params;
    try {
        const empresaId = req.empresaId;
        
        // CONSULTA MEJORADA: Usamos alias 'cc' y 'v' para evitar conflictos de columnas duplicadas
        const [rows] = await db.query(`
            SELECT 
                cc.id, 
                cc.fecha, 
                cc.descripcion, 
                cc.venta_id, 
                cc.debe, 
                cc.haber, 
                cc.saldo_acumulado,
                cc.observaciones,
                v.numero AS factura_numero -- <--- Traemos el número real de la factura
            FROM cuenta_corriente cc
            LEFT JOIN ventas v ON v.id = cc.venta_id AND v.empresa_id = cc.empresa_id
            WHERE cc.empresa_id = ? AND cc.cliente_id = ? AND cc.estado = 1
            ORDER BY cc.fecha DESC`, 
        [empresaId, id]);

        // También traemos el saldo total actual para mostrarlo arriba
        const [saldoTotal] = await db.query(
            "SELECT IFNULL(SUM(debe - haber), 0) as total FROM cuenta_corriente WHERE cliente_id = ? AND empresa_id = ? AND estado = 1",
            [id, empresaId]
        );

        res.json({
            movimientos: rows,
            saldoTotal: saldoTotal[0].total
        });
    } catch (error) {
        console.error("Error en obtenerCuentaCorriente:", error.message);
        res.status(500).json({ error: error.message });
    }
};
