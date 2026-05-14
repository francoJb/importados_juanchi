const db = require('../database/database');


exports.obtenerClientes = async (req, res) => {
    try {
        const empresaId = req.empresaId;
        const [rows] = await db.query("SELECT * FROM clientes WHERE empresa_id = ? AND estado = 1", [empresaId]);
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
    const { empresaId, id } = req.params;
    const p = req.body;

    if (!p.nombre?.trim() || !p.apellido?.trim() || !p.dni?.trim()) {
        return res.status(400).json({ error: "Datos inválidos" });
    }

    const sql = `UPDATE clientes SET nombre=?, apellido=?, telefono=?, direccion=?, dni=?, cuit=?, arca=?, email=?, habilitar_cc=? WHERE empresa_id=? AND id=?`;
    const cuitLimpio = (p.cuit || "").trim();
    const cuitParaGuardar = cuitLimpio === "" ? null : cuitLimpio;
    const params = [p.nombre, p.apellido, p.telefono, p.direccion, p.dni, cuitParaGuardar, p.arca, p.email, p.habilitar_cc ? 1 : 0, id];

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
    const { empresaId, id } = req.params;
    const sql = `UPDATE clientes SET estado = 0 WHERE empresa_id=? AND id = ?`;

    try {
        const [result] = await db.query(sql, [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: "Cliente no encontrado" });
        }
        res.json({ 
            mensaje: "Cliente desactivado correctamente",
            id: id 
        });
    } catch (err) {
        console.error("Error al desactivar cliente:", err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.obtenerCuentaCorriente = async (req, res) => {
    const { id } = req.params;
    try {
        const empresaId =req.empresaId;
        const [rows] = await db.query(`
            SELECT 
                id, 
                fecha, 
                descripcion, 
                venta_id, 
                debe, 
                haber, 
                saldo_acumulado,
                observaciones
            FROM cuenta_corriente 
            WHERE empresa_id=? AND cliente_id = ? 
            ORDER BY fecha DESC`, 
        [empresaId, id]);

        // También traemos el saldo total actual para mostrarlo arriba
        const [saldoTotal] = await db.query(
            "SELECT IFNULL(SUM(debe - haber), 0) as total FROM cuenta_corriente WHERE cliente_id = ? AND empresa_id = ?",
            [id, empresaId]
        );

        res.json({
            movimientos: rows,
            saldoTotal: saldoTotal[0].total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};