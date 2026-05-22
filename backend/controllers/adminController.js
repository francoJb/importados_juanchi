const bcrypt = require('bcryptjs');
const db = require('../database/database');

// ==========================================
// EMPRESAS
// ==========================================
exports.listCompanies = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, nombre, razon_social, cuit, domicilio, email, telefono, website, condicion_iva, estado FROM empresas ORDER BY id DESC');
        res.json(rows);
    } catch (error) {
        console.error('Error listando empresas:', error);
        res.status(500).json({ error: 'No se pudieron cargar las empresas.' });
    }
};

exports.createCompany = async (req, res) => {
    const { nombre, razon_social, cuit, domicilio, email, telefono, website, condicion_iva } = req.body;
    if (!nombre) {
        return res.status(400).json({ error: 'El nombre de la empresa es obligatorio.' });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO empresas (nombre, razon_social, cuit, domicilio, email, telefono, website, condicion_iva)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [nombre.trim(), razon_social || '', cuit || '', domicilio || '', email || '', telefono || '', website || '', condicion_iva || '']
        );

        res.status(201).json({ success: true, empresaId: result.insertId });
    } catch (error) {
        console.error('Error creando empresa:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Ya existe una empresa con ese nombre o CUIT.' });
        }
        res.status(500).json({ error: 'No se pudo crear la empresa.' });
    }
};

exports.listUsers = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT u.id, u.usuario, u.nombre, u.apellido, u.role, u.estado, e.id AS empresa_id, e.nombre AS empresa_nombre
            FROM usuarios u
            INNER JOIN empresas e ON u.empresa_id = e.id
            ORDER BY u.id DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error listando usuarios:', error);
        res.status(500).json({ error: 'No se pudieron cargar los usuarios.' });
    }
};

exports.getCompany = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT id, nombre, razon_social, cuit, domicilio, email, telefono, website, condicion_iva, estado FROM empresas WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Empresa no encontrada.' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error obteniendo empresa:', error);
        res.status(500).json({ error: 'No se pudo obtener la empresa.' });
    }
};

exports.updateCompany = async (req, res) => {
    const { id } = req.params;
    const { nombre, razon_social, cuit, domicilio, email, telefono, website, condicion_iva } = req.body;
    
    if (!nombre) {
        return res.status(400).json({ error: 'El nombre de la empresa es obligatorio.' });
    }

    try {
        const [result] = await db.query(
            `UPDATE empresas SET nombre=?, razon_social=?, cuit=?, domicilio=?, email=?, telefono=?, website=?, condicion_iva=? WHERE id=?`,
            [nombre.trim(), razon_social || '', cuit || '', domicilio || '', email || '', telefono || '', website || '', condicion_iva || '', id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Empresa no encontrada.' });
        }

        res.json({ success: true, mensaje: 'Empresa actualizada.' });
    } catch (error) {
        console.error('Error actualizando empresa:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Ya existe una empresa con ese nombre o CUIT.' });
        }
        res.status(500).json({ error: 'No se pudo actualizar la empresa.' });
    }
};

exports.deleteCompany = async (req, res) => {
    const { id } = req.params;
    
    try {
        const [result] = await db.query(
            `UPDATE empresas SET estado = 0 WHERE id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Empresa no encontrada.' });
        }

        res.json({ success: true, mensaje: 'Empresa desactivada.' });
    } catch (error) {
        console.error('Error desactivando empresa:', error);
        res.status(500).json({ error: 'No se pudo desactivar la empresa.' });
    }
};

exports.getUsersByCompany = async (req, res) => {
    const { empresaId } = req.params;
    
    try {
        const [rows] = await db.query(`
            SELECT u.id, u.usuario, u.nombre, u.apellido, u.role, u.estado, u.empresa_id, u.fecha_alta
            FROM usuarios u
            WHERE u.empresa_id = ?
            ORDER BY u.id DESC
        `, [empresaId]);
        res.json(rows);
    } catch (error) {
        console.error('Error listando usuarios:', error);
        res.status(500).json({ error: 'No se pudieron cargar los usuarios.' });
    }
};

exports.getUser = async (req, res) => {
    const { id } = req.params;
    
    try {
        const [rows] = await db.query(`
            SELECT u.id, u.usuario, u.nombre, u.apellido, u.role, u.estado, u.empresa_id, e.nombre AS empresa_nombre, u.fecha_alta
            FROM usuarios u
            INNER JOIN empresas e ON u.empresa_id = e.id
            WHERE u.id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error obteniendo usuario:', error);
        res.status(500).json({ error: 'No se pudo obtener el usuario.' });
    }
};

// ==========================================
// USUARIOS
// ==========================================
exports.createUser = async (req, res) => {
    const { empresa_id, usuario, password, role, nombre, apellido } = req.body;

    if (!empresa_id || !usuario || !password) {
        return res.status(400).json({ error: 'Empresa, usuario y contraseña son obligatorios.' });
    }

    if (!['platform_admin', 'tenant_admin', 'user'].includes(role || 'user')) {
        return res.status(400).json({ error: 'Rol inválido.' });
    }

    try {
        const password_hash = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            `INSERT INTO usuarios (empresa_id, usuario, password_hash, role, nombre, apellido)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [empresa_id, usuario.trim(), password_hash, role || 'user', nombre || '', apellido || '']
        );

        res.status(201).json({ success: true, userId: result.insertId });
    } catch (error) {
        console.error('Error creando usuario:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Ya existe un usuario con ese nombre de usuario.' });
        }
        res.status(500).json({ error: 'No se pudo crear el usuario.' });
    }
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { usuario, password, role, nombre, apellido, estado } = req.body;

    if (!usuario) {
        return res.status(400).json({ error: 'Usuario es obligatorio.' });
    }

    if (!['platform_admin', 'tenant_admin', 'user'].includes(role || 'user')) {
        return res.status(400).json({ error: 'Rol inválido.' });
    }

    try {
        let sql, params;
        
        if (password) {
            // Si se proporciona contraseña nueva
            const bcrypt = require('bcryptjs');
            const password_hash = await bcrypt.hash(password, 10);
            sql = `UPDATE usuarios SET usuario=?, password_hash=?, role=?, nombre=?, apellido=?, estado=? WHERE id=?`;
            params = [usuario.trim(), password_hash, role || 'user', nombre || '', apellido || '', estado !== undefined ? estado : 1, id];
        } else {
            // Sin cambio de contraseña
            sql = `UPDATE usuarios SET usuario=?, role=?, nombre=?, apellido=?, estado=? WHERE id=?`;
            params = [usuario.trim(), role || 'user', nombre || '', apellido || '', estado !== undefined ? estado : 1, id];
        }

        const [result] = await db.query(sql, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        res.json({ success: true, mensaje: 'Usuario actualizado.' });
    } catch (error) {
        console.error('Error actualizando usuario:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Ya existe un usuario con ese nombre de usuario.' });
        }
        res.status(500).json({ error: 'No se pudo actualizar el usuario.' });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    
    try {
        const [result] = await db.query(
            `UPDATE usuarios SET estado = 0 WHERE id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        res.json({ success: true, mensaje: 'Usuario desactivado.' });
    } catch (error) {
        console.error('Error desactivando usuario:', error);
        res.status(500).json({ error: 'No se pudo desactivar el usuario.' });
    }
};