const bcrypt = require('bcryptjs');
const db = require('../database/database');

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

exports.createUser = async (req, res) => {
    const { empresa_id, usuario, password, role, nombre, apellido } = req.body;

    if (!empresa_id || !usuario || !password) {
        return res.status(400).json({ error: 'Empresa, usuario y contraseña son obligatorios.' });
    }

    if (!['admin', 'user'].includes(role || 'user')) {
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