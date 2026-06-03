#!/usr/bin/env node
const db = require('../database/database');

async function renumerarVentas(conn, empresaId, apply) {
    const [ventas] = await conn.query(
        'SELECT id FROM ventas WHERE empresa_id = ? ORDER BY fecha ASC, id ASC',
        [empresaId]
    );

    let numero = 1;
    for (const venta of ventas) {
        if (apply) {
            await conn.query('UPDATE ventas SET numero = ? WHERE empresa_id = ? AND id = ?', [numero, empresaId, venta.id]);
        }
        console.log(`  factura venta id ${venta.id} -> ${numero}`);
        numero++;
    }

    return numero;
}

async function renumerarPlanes(conn, empresaId, apply) {
    const [ventas] = await conn.query(
        "SELECT id FROM ventas WHERE empresa_id = ? AND metodo_pago = 'Cuotas' ORDER BY fecha ASC, id ASC",
        [empresaId]
    );

    if (apply) {
        await conn.query("UPDATE ventas SET numero_plan_pagos = NULL WHERE empresa_id = ? AND metodo_pago <> 'Cuotas'", [empresaId]);
    }

    let numero = 1;
    for (const venta of ventas) {
        if (apply) {
            await conn.query('UPDATE ventas SET numero_plan_pagos = ? WHERE empresa_id = ? AND id = ?', [numero, empresaId, venta.id]);
        }
        console.log(`  plan pagos venta id ${venta.id} -> ${numero}`);
        numero++;
    }

    return numero;
}

async function renumerarRecibos(conn, empresaId, apply) {
    const [recibos] = await conn.query(
        'SELECT id FROM cuenta_corriente WHERE empresa_id = ? AND haber > 0 ORDER BY fecha ASC, id ASC',
        [empresaId]
    );

    if (apply) {
        await conn.query('UPDATE cuenta_corriente SET numero_recibo = NULL WHERE empresa_id = ? AND haber <= 0', [empresaId]);
    }

    let numero = 1;
    for (const recibo of recibos) {
        if (apply) {
            await conn.query('UPDATE cuenta_corriente SET numero_recibo = ? WHERE empresa_id = ? AND id = ?', [numero, empresaId, recibo.id]);
        }
        console.log(`  recibo cuenta_corriente id ${recibo.id} -> ${numero}`);
        numero++;
    }

    if (apply) {
        await conn.query(`
            UPDATE venta_cuotas vc
            INNER JOIN cuenta_corriente cc ON cc.id = vc.recibo_id AND cc.empresa_id = vc.empresa_id
            SET vc.recibo_numero = cc.numero_recibo
            WHERE vc.empresa_id = ?
        `, [empresaId]);
    }

    return numero;
}

async function actualizarContador(conn, empresaId, tipo, proximoNumero, apply) {
    if (!apply) return;

    await conn.query(`
        INSERT INTO documentos_contadores (empresa_id, tipo, proximo_numero)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE proximo_numero = VALUES(proximo_numero)
    `, [empresaId, tipo, proximoNumero]);
}

async function main() {
    const apply = process.argv.includes('--apply');
    console.log(apply
        ? 'Aplicando renumeración de documentos desde 1 por empresa...'
        : 'Dry-run: mostrando renumeración de documentos. Usá --apply para aplicar.');

    await db.ready;

    const [empresas] = await db.query('SELECT id, nombre FROM empresas ORDER BY id ASC');
    for (const empresa of empresas) {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            console.log(`Empresa ${empresa.id} - ${empresa.nombre}`);

            const proximaFactura = await renumerarVentas(conn, empresa.id, apply);
            const proximoPlan = await renumerarPlanes(conn, empresa.id, apply);
            const proximoRecibo = await renumerarRecibos(conn, empresa.id, apply);

            await actualizarContador(conn, empresa.id, 'factura', proximaFactura, apply);
            await actualizarContador(conn, empresa.id, 'plan_pagos', proximoPlan, apply);
            await actualizarContador(conn, empresa.id, 'recibo', proximoRecibo, apply);

            if (apply) {
                await conn.commit();
            } else {
                await conn.rollback();
            }
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    console.log(apply ? 'Renumeración aplicada.' : 'Dry-run completado.');
    await db.end();
}

main().catch(error => {
    console.error('Error al renumerar documentos:', error);
    process.exit(1);
});
