const db = require('../database/database');

// Función para convertir fecha de DD/MM/AAAA a YYYY-MM-DD
function convertirFecha(fechaStr) {
    if (!fechaStr || fechaStr.trim() === '') {
        return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    }
    const partes = fechaStr.split('/');
    if (partes.length === 3) {
        const dia = partes[0].padStart(2, '0');
        const mes = partes[1].padStart(2, '0');
        const anio = partes[2];
        return `${anio}-${mes}-${dia}`;
    }
    // Si ya es YYYY-MM-DD o ISO, intentar parsear
    const date = new Date(fechaStr);
    if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
}

exports.obtenerClientes = async (req, res) => {
    try {
        // En MySQL usamos await y desestructuramos [rows]
        const [rows] = await db.query("SELECT * FROM clientes WHERE estado = 1");
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

    const sql = `INSERT INTO clientes (nombre, apellido, telefono, direccion, dni, cuit, arca, email, fecha_alta, estado)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`;
    
    // Convertir fecha a YYYY-MM-DD
    const fecha = convertirFecha(p.fecha_alta);
    const params = [p.nombre, p.apellido, p.telefono, p.direccion, p.dni, p.cuit, p.arca, p.email, fecha];

    try {
        const [result] = await db.query(sql, params);
        // En MySQL el ID generado está en result.insertId
        res.status(201).json({ id: result.insertId, ...p });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
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
    const p = req.body;

    if (!p.nombre?.trim() || !p.apellido?.trim() || !p.dni?.trim()) {
        return res.status(400).json({ error: "Datos inválidos" });
    }

    const sql = `UPDATE clientes SET nombre=?, apellido=?, telefono=?, direccion=?, dni=?, cuit=?, arca=?, email=?, fecha_alta=? WHERE id=?`;
    const params = [p.nombre, p.apellido, p.telefono, p.direccion, p.dni, p.cuit, p.arca, p.email, convertirFecha(p.fecha_alta), id];

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
    const sql = `UPDATE clientes SET estado = 0 WHERE id = ?`;

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
        const [rows] = await db.query(`
            SELECT 
                id, 
                fecha, 
                descripcion, 
                venta_id, 
                debe, 
                haber, 
                saldo_acumulado 
            FROM cuenta_corriente 
            WHERE cliente_id = ? 
            ORDER BY fecha DESC`, 
        [id]);

        // También traemos el saldo total actual para mostrarlo arriba
        const [saldoTotal] = await db.query(
            "SELECT IFNULL(SUM(debe - haber), 0) as total FROM cuenta_corriente WHERE cliente_id = ?",
            [id]
        );

        res.json({
            movimientos: rows,
            saldoTotal: saldoTotal[0].total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};