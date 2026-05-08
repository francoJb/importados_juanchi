const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    const { empresa, usuario, password } = req.body;

    if (!empresa || !usuario || !password) {
        return res.status(400).json({ error: "Empresa, usuario y contraseña son obligatorios." });
    }

    const empresaOk = empresa === process.env.AUTH_EMPRESA;
    const usuarioOk = usuario === process.env.AUTH_USER;

    if (!empresaOk || !usuarioOk) {
        return res.status(401).json({ error: "Credenciales incorrectas." });
    }

    const passwordOk = await bcrypt.compare(password, process.env.AUTH_PASSWORD_HASH || "");

    if (!passwordOk) {
        return res.status(401).json({ error: "Credenciales incorrectas." });
    }

    const token = jwt.sign(
        {
            usuario,
            empresa
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "20d"
        }
    );

    res.json({
        success: true,
        token,
        usuario,
        empresa
    });
};

exports.me = (req, res) => {
    res.json({
        success: true,
        usuario: req.user.usuario,
        empresa: req.user.empresa
    });
};