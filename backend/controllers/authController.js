const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/database');

exports.login = async (req, res) => {
    const { empresa, usuario, password } = req.body;

    if (!empresa || !usuario || !password) {
        return res.status(400).json({ error: 'Empresa, usuario y contraseña son obligatorios.' });
    }

    try {
        const [empresaRows] = await db.query('SELECT id, nombre FROM empresas WHERE nombre = ? AND estado = 1 LIMIT 1', [empresa.trim()]);
        if (empresaRows.length > 0) {
            const empresaData = empresaRows[0];
            const [userRows] = await db.query(
                'SELECT id, usuario, password_hash, role FROM usuarios WHERE usuario = ? AND empresa_id = ? AND estado = 1 LIMIT 1',
                [usuario.trim(), empresaData.id]
            );

            if (userRows.length > 0) {
                const user = userRows[0];
                const passwordOk = await bcrypt.compare(password, user.password_hash);
                if (!passwordOk) {
                    return res.status(401).json({ error: 'Credenciales incorrectas.' });
                }

                const token = jwt.sign(
                    {
                        usuario: user.usuario,
                        empresa: empresaData.nombre,
                        empresaId: empresaData.id,
                        usuarioId: user.id,
                        role: user.role
                    },
                    process.env.JWT_SECRET,
                    {
                        expiresIn: process.env.JWT_EXPIRES_IN || '20d'
                    }
                );

                return res.json({
                    success: true,
                    token,
                    usuario: user.usuario,
                    empresa: empresaData.nombre,
                    role: user.role,
                    usuarioId: user.id,
                    empresaId: empresaData.id
                });
            }
        }

        const empresaOk = empresa === process.env.AUTH_EMPRESA;
        const usuarioOk = usuario === process.env.AUTH_USER;

        if (!empresaOk || !usuarioOk) {
            return res.status(401).json({ error: 'Credenciales incorrectas.' });
        }

        const passwordOk = await bcrypt.compare(password, process.env.AUTH_PASSWORD_HASH || '');
        if (!passwordOk) {
            return res.status(401).json({ error: 'Credenciales incorrectas.' });
        }

        const token = jwt.sign(
            {
                usuario,
                empresa,
                role: 'platform_admin',
                usuarioId: 0,
                empresaId: 0
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || '20d'
            }
        );

        return res.json({
            success: true,
            token,
            usuario,
            empresa,
            role: 'platform_admin',
            usuarioId: 0,
            empresaId: 0
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error al procesar el inicio de sesión.' });
    }
};

exports.me = (req, res) => {
    const { usuario, empresa, role, usuarioId, empresaId } = req.user;
    res.json({
        success: true,
        usuario,
        empresa,
        role: role || 'user',
        usuarioId: usuarioId || null,
        empresaId: empresaId || null
    });
};