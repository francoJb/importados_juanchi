// Validar que la empresa_id del token coincida con la consulta
function verificarTenant(req, res, next) {
    if (!req.empresaId) {
        return res.status(401).json({ error: "Empresa no identificada en token." });
    }

    // Los controladores usan req.empresaId para filtrar datos
    next();
}

module.exports = verificarTenant;