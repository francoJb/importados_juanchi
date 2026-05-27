const bcrypt = require('bcryptjs');
const db = require('../database/database');

const DEFAULT_PASSWORD = process.env.INITIAL_USERS_PASSWORD || 'admin';

async function upsertCompany(nombre) {
    await db.query(
        `INSERT INTO empresas (nombre, estado)
         VALUES (?, 1)
         ON DUPLICATE KEY UPDATE estado = VALUES(estado)`,
        [nombre]
    );

    const [rows] = await db.query(
        'SELECT id, nombre FROM empresas WHERE nombre = ? LIMIT 1',
        [nombre]
    );

    if (rows.length === 0) {
        throw new Error(`No se pudo preparar la empresa ${nombre}`);
    }

    return rows[0];
}

async function upsertUser({ empresaId, usuario, role, nombre, apellido, passwordHash }) {
    const [existing] = await db.query(
        'SELECT id FROM usuarios WHERE usuario = ? LIMIT 1',
        [usuario]
    );

    if (existing.length > 0) {
        await db.query(
            `UPDATE usuarios
             SET empresa_id = ?, password_hash = ?, role = ?, nombre = ?, apellido = ?, estado = 1
             WHERE usuario = ?`,
            [empresaId, passwordHash, role, nombre, apellido, usuario]
        );
        return existing[0].id;
    }

    const [result] = await db.query(
        `INSERT INTO usuarios (empresa_id, usuario, password_hash, role, nombre, apellido, estado)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [empresaId, usuario, passwordHash, role, nombre, apellido]
    );

    return result.insertId;
}

async function main() {
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    const eldaGestion = await upsertCompany('eldaGestion');
    const jrimport = await upsertCompany('Jrimport');

    const francoId = await upsertUser({
        empresaId: eldaGestion.id,
        usuario: 'franco',
        role: 'platform_admin',
        nombre: 'Franco',
        apellido: '',
        passwordHash
    });

    const adminId = await upsertUser({
        empresaId: jrimport.id,
        usuario: 'Admin',
        role: 'tenant_admin',
        nombre: 'Admin',
        apellido: '',
        passwordHash
    });

    console.log('Accesos iniciales listos:');
    console.log(`- eldaGestion / franco / ${DEFAULT_PASSWORD} (platform_admin, solo Configuracion) [usuario_id=${francoId}]`);
    console.log(`- Jrimport / Admin / ${DEFAULT_PASSWORD} (tenant_admin, sistema operativo sin Configuracion) [usuario_id=${adminId}]`);
}

main()
    .catch((error) => {
        console.error('No se pudieron preparar los accesos iniciales:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await db.end();
    });
