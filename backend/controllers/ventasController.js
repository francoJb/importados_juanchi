const db = require('../database/database'); // Tu conexión a MySQL

function redondear2(valor) {
    return Math.round(Number(valor) * 100) / 100;
}

function formatearFechaLocal(fecha) {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
}

function obtenerUltimoDiaDelMes(anio, mesIndexadoDesdeCero) {
    return new Date(anio, mesIndexadoDesdeCero + 1, 0).getDate();
}

function generarCuotas(total, cantidadCuotas, diaVencimientoMensual) {
    const cantidad = Number(cantidadCuotas);
    const diaVencimiento = Number(diaVencimientoMensual);

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
        throw new Error("La cantidad de cuotas debe ser mayor a 0.");
    }

    if (!Number.isInteger(diaVencimiento) || diaVencimiento < 1 || diaVencimiento > 31) {
        throw new Error("El día de vencimiento mensual debe estar entre 1 y 31.");
    }

    const totalCentavos = Math.round(Number(total) * 100);
    const baseCentavos = Math.floor(totalCentavos / cantidad);
    let restoCentavos = totalCentavos - (baseCentavos * cantidad);
    const hoy = new Date();
    const primerMesOffset = diaVencimiento > hoy.getDate() ? 0 : 1;

    return Array.from({ length: cantidad }, (_, index) => {
        const montoCentavos = baseCentavos + (restoCentavos > 0 ? 1 : 0);
        if (restoCentavos > 0) restoCentavos -= 1;

        const mesVencimiento = hoy.getMonth() + primerMesOffset + index;
        const vencimiento = new Date(hoy.getFullYear(), mesVencimiento, 1);
        const ultimoDia = obtenerUltimoDiaDelMes(vencimiento.getFullYear(), vencimiento.getMonth());
        vencimiento.setDate(Math.min(diaVencimiento, ultimoDia));

        return {
            numero: index + 1,
            monto: redondear2(montoCentavos / 100),
            fecha_vencimiento: formatearFechaLocal(vencimiento)
        };
    });
}

exports.crearVenta = async (req, res) => {
    
    const { cliente_id, total, metodo_pago, entrega_inicial, cuotas, items, observaciones } = req.body;
    const totalVenta = Number(total);
    const entregaInicial = Number(entrega_inicial || 0);
    const saldoFinanciado = redondear2(totalVenta - entregaInicial);
    
    if (['Cuenta Corriente', 'Cuotas'].includes(metodo_pago) && (!cliente_id || Number(cliente_id) === 0)) {
        return res.status(400).json({
            error: "Seleccioná un cliente registrado para vender a crédito o en cuotas."
        });
    }

    // Validar que el cliente tenga habilitado el crédito si el pago es a cuenta corriente
    if (metodo_pago === 'Cuenta Corriente' && cliente_id && Number(cliente_id) !== 0) {
        const empresaId = req.empresaId;
        const [clienteRows] = await db.query(
            "SELECT habilitar_cc, nombre, apellido FROM clientes WHERE empresa_id = ? AND id = ?",
            [empresaId, cliente_id]
        );
        const cliente = clienteRows[0];
        if (!cliente || !cliente.habilitar_cc) {
            return res.status(400).json({
                error: `El cliente ${cliente ? cliente.nombre + ' ' + cliente.apellido : 'seleccionado'} no tiene habilitado el crédito. No se puede registrar venta a cuenta corriente.`
            });
        }
    }

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "La venta debe tener al menos un ítem." });
    }

    if (!Number.isFinite(totalVenta) || totalVenta <= 0) {
        return res.status(400).json({ error: "El total de la venta debe ser mayor a 0." });
    }

    if (!Number.isFinite(entregaInicial) || entregaInicial < 0) {
        return res.status(400).json({ error: "La entrega inicial no puede ser negativa." });
    }

    if (['Cuenta Corriente', 'Cuotas'].includes(metodo_pago) && entregaInicial >= totalVenta) {
        return res.status(400).json({ error: "La entrega inicial debe ser menor al total de la venta." });
    }

    let planCuotas = [];
    if (metodo_pago === 'Cuotas') {
        try {
            planCuotas = generarCuotas(saldoFinanciado, cuotas?.cantidad, cuotas?.dia_vencimiento);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    

    // Obtenemos una conexión del pool para la transacción
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Insertar la Cabecera de la Venta
        // Si es Cta Cte o Cuotas, el saldo_pendiente queda abierto hasta cobrar.
        const saldoPendiente = ['Cuenta Corriente', 'Cuotas'].includes(metodo_pago) ? saldoFinanciado : 0;
        const estadoPago = (['Cuenta Corriente', 'Cuotas'].includes(metodo_pago) && saldoPendiente > 0) ? 'Pendiente' : 'Pagado';

        const empresaId = req.empresaId;
        const [ventaRes] = await connection.query(
            `INSERT INTO ventas (empresa_id, cliente_id, total, metodo_pago, estado_pago, saldo_pendiente, observaciones) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [empresaId, cliente_id === 0 ? null : cliente_id, totalVenta, metodo_pago, estadoPago, saldoPendiente, observaciones]
        );
        const ventaId = ventaRes.insertId;

        // 2. Procesar cada Producto (Detalle + Stock)
        // Localizá este bucle dentro de exports.crearVenta
        for (const item of items) {
            // A. CONSULTA DE SEGURIDAD: Traemos el stock actual, el nombre del producto y si controla stock
            const [productoRows] = await connection.query(
                "SELECT stock, descripcion, control_stock FROM productos WHERE empresa_id=? AND id=?",
                [empresaId, item.id]
            );
            const producto = productoRows[0];
            // B. VALIDACIÓN: Si no hay fila (raro) o si controla stock y el stock es menor a lo pedido
            if (!producto) {
                throw new Error(`Producto con ID ${item.id} no encontrado`);
            }
            if (producto.control_stock && producto.stock < item.cantidad) {
                // Solo validar stock si el producto tiene control de stock activado
                throw new Error(`Stock insuficiente para "${producto.descripcion}". disponible: ${producto.stock}`);
            }
            // C. REGISTRO DEL DETALLE (Solo si pasó la validación de arriba)
            await connection.query(
                "INSERT INTO detalle_ventas (empresa_id, venta_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?, ?)",
                [empresaId, ventaId, item.id, item.cantidad, item.precio]
            );
            // D. DESCUENTO DE STOCK (Solo si el producto controla stock)
            if (producto.control_stock) {
                await connection.query(
                    "UPDATE productos SET stock = stock - ? WHERE empresa_id=? AND id=?",
                    [item.cantidad, empresaId, item.id]
                );
            }
        }

        // 3. LÓGICA DE CUENTA CORRIENTE / CUOTAS (Si aplica)
        if (['Cuenta Corriente', 'Cuotas'].includes(metodo_pago) && cliente_id !== 0) {
    
            // A. Primero obtenemos el saldo actual del cliente
            const [rows] = await connection.query(
                "SELECT IFNULL(SUM(debe - haber), 0) as saldoActual FROM cuenta_corriente WHERE empresa_id = ? AND cliente_id = ? AND estado = 1",
                [empresaId, cliente_id]
            );
            let saldoCalculado = parseFloat(rows[0].saldoActual);

            // B. Registrar la DEUDA (El DEBE)
            saldoCalculado += totalVenta; // Sumamos lo que se lleva
            const descripcionDeuda = metodo_pago === 'Cuotas'
                ? `Venta # ${ventaId} en ${planCuotas.length} cuotas - ${observaciones || 'Sin obs.'}`
                : `Venta # ${ventaId} - ${observaciones || 'Sin obs.'}`;

            await connection.query(
                `INSERT INTO cuenta_corriente (empresa_id, cliente_id, venta_id, descripcion, debe, haber, saldo_acumulado) 
                VALUES (?, ?, ?, ?, ?, 0, ?)`,
                [empresaId, cliente_id, ventaId, descripcionDeuda, totalVenta, saldoCalculado]
            );

            // C. Si hubo ENTREGA INICIAL, registrar el pago (El HABER)
            if (entregaInicial > 0) {
                saldoCalculado -= entregaInicial; // Restamos lo que pagó
                await connection.query(
                    `INSERT INTO cuenta_corriente (empresa_id, cliente_id, venta_id, descripcion, debe, haber, saldo_acumulado) 
                    VALUES (?, ?, ?, ?, 0, ?, ?)`,
                    [empresaId, cliente_id, ventaId, `Entrega inicial Venta #${ventaId}`, entregaInicial, saldoCalculado]
                );
            }

            if (metodo_pago === 'Cuotas') {
                for (const cuota of planCuotas) {
                    await connection.query(
                        `INSERT INTO venta_cuotas
                         (empresa_id, venta_id, cliente_id, numero_cuota, fecha_vencimiento, monto, saldo_pendiente, estado)
                         VALUES (?, ?, ?, ?, ?, ?, ?, 'Pendiente')`,
                        [empresaId, ventaId, cliente_id, cuota.numero, cuota.fecha_vencimiento, cuota.monto, cuota.monto]
                    );
                }
            }
        }
        await connection.commit();
        res.json({ success: true, mensaje: "Venta procesada con éxito", ventaId, cuotas: planCuotas });


    } catch (error) {
        await connection.rollback();
        console.error("Error en la transacción:", error);
        res.status(500).json({ error: "Fallo en la base de datos: " + error.message });
    } finally {
        connection.release();
    }
};

exports.obtenerVentas = async (req, res) => {
    try {
        const empresaId = req.empresaId;
        const estado = req.query.estado === 'eliminados' ? 0 : 1;
        const [rows] = await db.query(`
            SELECT 
                v.id,
                v.cliente_id, 
                v.fecha, 
                v.total, 
                v.metodo_pago,
                v.saldo_pendiente, 
                v.estado_pago, -- Usaremos esto para saber si está "Finalizado" o "Pendiente"
                c.nombre AS cliente_nombre, 
                c.apellido AS cliente_apellido
            FROM ventas v
            LEFT JOIN clientes c ON v.cliente_id = c.id AND c.empresa_id=?
            WHERE v.empresa_id=? and v.estado = ?
            ORDER BY v.fecha DESC
            `, [empresaId, empresaId, estado]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerVenta = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query(`
            SELECT 
                v.id, 
                v.fecha, 
                v.total, 
                v.metodo_pago,
                v.saldo_pendiente, 
                v.estado_pago,
                v.cliente_id,
                v.observaciones,
                c.nombre AS cliente_nombre, 
                c.apellido AS cliente_apellido
            FROM ventas v
            LEFT JOIN clientes c ON v.cliente_id = c.id AND c.empresa_id = v.empresa_id
            WHERE v.id = ? AND v.empresa_id=? AND v.estado = 1
        `, [id, req.empresaId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerDetalleVenta = async (req, res) => {
    const { id } = req.params; // El ID de la venta que viene en la URL
    try {
        const [rows] = await db.query(`
            SELECT 
                d.cantidad, 
                d.precio_unitario, 
                (d.cantidad * d.precio_unitario) as subtotal,
                p.descripcion, 
                p.sku 
            FROM detalle_ventas d
            JOIN productos p ON d.producto_id = p.id AND p.empresa_id = d.empresa_id
            WHERE d.venta_id = ? AND d.empresa_id=?` , 
        [id, req.empresaId]);

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerCuotasPendientes = async (req, res) => {
    const { clienteId, ventaId } = req.query;
    const filtros = ['vc.empresa_id = ?', "vc.estado <> 'Pagada'", 'vc.saldo_pendiente > 0'];
    const params = [req.empresaId];

    if (clienteId) {
        filtros.push('vc.cliente_id = ?');
        params.push(clienteId);
    }

    if (ventaId) {
        filtros.push('vc.venta_id = ?');
        params.push(ventaId);
    }

    try {
        const [rows] = await db.query(`
            SELECT
                vc.id,
                vc.venta_id,
                vc.cliente_id,
                vc.numero_cuota,
                vc.fecha_vencimiento,
                vc.fecha_pago,
                vc.monto,
                vc.saldo_pendiente,
                vc.recibo_id,
                vc.estado,
                v.fecha AS venta_fecha,
                c.nombre AS cliente_nombre,
                c.apellido AS cliente_apellido
            FROM venta_cuotas vc
            INNER JOIN ventas v ON v.id = vc.venta_id AND v.empresa_id = vc.empresa_id
            INNER JOIN clientes c ON c.id = vc.cliente_id AND c.empresa_id = vc.empresa_id
            WHERE ${filtros.join(' AND ')} AND v.estado = 1
            ORDER BY vc.fecha_vencimiento ASC, vc.numero_cuota ASC
        `, params);

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerCuotasVenta = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await db.query(`
            SELECT
                vc.id,
                vc.venta_id,
                vc.cliente_id,
                vc.numero_cuota,
                vc.fecha_vencimiento,
                vc.fecha_pago,
                vc.monto,
                vc.saldo_pendiente,
                vc.recibo_id,
                vc.estado,
                v.fecha AS venta_fecha,
                c.nombre AS cliente_nombre,
                c.apellido AS cliente_apellido
            FROM venta_cuotas vc
            INNER JOIN ventas v ON v.id = vc.venta_id AND v.empresa_id = vc.empresa_id
            INNER JOIN clientes c ON c.id = vc.cliente_id AND c.empresa_id = vc.empresa_id
            WHERE vc.empresa_id = ? AND vc.venta_id = ?
            ORDER BY vc.numero_cuota ASC
        `, [req.empresaId, id]);

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.eliminarVenta = async (req, res) => {
    const { id } = req.params;
    const ventaId = Number(id);

    if (!Number.isInteger(ventaId) || ventaId <= 0) {
        return res.status(400).json({ error: "ID de venta inválido" });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [ventaRows] = await connection.query(
            "SELECT id, estado FROM ventas WHERE id=? AND empresa_id=?",
            [ventaId, req.empresaId]
        );

        if (ventaRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Venta no encontrada" });
        }

        if (Number(ventaRows[0].estado) === 0) {
            await connection.rollback();
            return res.status(400).json({ error: "La venta ya está eliminada" });
        }

        const [detalles] = await connection.query(
            "SELECT producto_id, cantidad FROM detalle_ventas WHERE empresa_id = ? AND venta_id = ?",
            [req.empresaId, ventaId]
        );

        for (const detalle of detalles) {
            await connection.query(
                "UPDATE productos SET stock = stock + ? WHERE empresa_id=? AND id = ? AND control_stock = 1",
                [detalle.cantidad, req.empresaId, detalle.producto_id]
            );
        }

        await connection.query(
            "UPDATE cuenta_corriente SET estado = 0 WHERE empresa_id=? AND venta_id = ?",
            [req.empresaId, ventaId]
        );

        await connection.query(
            "UPDATE ventas SET estado = 0 WHERE id = ? AND empresa_id=?",
            [ventaId, req.empresaId]
        );

        await connection.commit();
        return res.json({ success: true, message: "Venta eliminada correctamente" });
    } catch (error) {
        await connection.rollback();
        console.error("ERROR AL ELIMINAR VENTA:", error.message);
        return res.status(500).json({ error: "Error interno al eliminar la venta" });
    } finally {
        connection.release();
    }
};

exports.restaurarVenta = async (req, res) => {
    const { id } = req.params;
    const ventaId = Number(id);

    if (!Number.isInteger(ventaId) || ventaId <= 0) {
        return res.status(400).json({ error: "ID de venta inválido" });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [ventaRows] = await connection.query(
            "SELECT id, estado FROM ventas WHERE id=? AND empresa_id=?",
            [ventaId, req.empresaId]
        );

        if (ventaRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Venta no encontrada" });
        }

        if (Number(ventaRows[0].estado) === 1) {
            await connection.rollback();
            return res.status(400).json({ error: "La venta ya está activa" });
        }

        const [detalles] = await connection.query(
            "SELECT producto_id, cantidad FROM detalle_ventas WHERE empresa_id = ? AND venta_id = ?",
            [req.empresaId, ventaId]
        );

        for (const detalle of detalles) {
            await connection.query(
                "UPDATE productos SET stock = stock - ? WHERE empresa_id=? AND id = ? AND control_stock = 1",
                [detalle.cantidad, req.empresaId, detalle.producto_id]
            );
        }

        await connection.query(
            "UPDATE cuenta_corriente SET estado = 1 WHERE empresa_id=? AND venta_id = ?",
            [req.empresaId, ventaId]
        );

        await connection.query(
            "UPDATE ventas SET estado = 1 WHERE id = ? AND empresa_id=?",
            [ventaId, req.empresaId]
        );

        await connection.commit();
        return res.json({ success: true, message: "Venta restaurada correctamente" });
    } catch (error) {
        await connection.rollback();
        console.error("ERROR AL RESTAURAR VENTA:", error.message);
        return res.status(500).json({ error: "Error interno al restaurar la venta" });
    } finally {
        connection.release();
    }
};
exports.registrarPago = async (req, res) => {
    const { ventaId } = req.params;
    const { monto, observaciones, cuota_ids } = req.body;

    const ventaIdNum = Number(ventaId);
    if (!Number.isInteger(ventaIdNum) || ventaIdNum <= 0) {
        return res.status(400).json({ error: "ID de venta inválido." });
    }

    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
        return res.status(400).json({ error: "Monto inválido. Debe ser mayor a 0." });
    }
    const empresaId = req.empresaId;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1) Buscar venta
        const [ventaRows] = await connection.query(
            "SELECT cliente_id, total, saldo_pendiente, metodo_pago FROM ventas WHERE empresa_id = ? AND id = ? and estado = 1",
            [empresaId, ventaIdNum]
        );

        if (ventaRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Venta no encontrada" });
        }

        const venta = ventaRows[0];
        const idCliente = venta.cliente_id;

        if (!idCliente) {
            await connection.rollback();
            return res.status(400).json({ error: "La venta no tiene cliente asociado." });
        }

        const saldoPendienteNum = parseFloat(venta.saldo_pendiente);
        if (isNaN(saldoPendienteNum) || saldoPendienteNum <= 0) {
            await connection.rollback();
            return res.status(400).json({ error: "La venta no tiene saldo pendiente." });
        }

        if (montoNum > saldoPendienteNum) {
            await connection.rollback();
            return res.status(400).json({ error: "El monto supera el saldo pendiente" });
        }

        const nuevoSaldo = redondear2(saldoPendienteNum - montoNum);
        const nuevoEstado = nuevoSaldo <= 0 ? "Pagado" : "Parcial";

        const observacionesPago = observaciones && observaciones.trim()
            ? observaciones.trim()
            : null;

        if (venta.metodo_pago === 'Cuotas') {
            const filtrosCuotas = ['empresa_id = ?', 'venta_id = ?', "estado <> 'Pagada'", 'saldo_pendiente > 0'];
            const paramsCuotas = [empresaId, ventaIdNum];

            if (Array.isArray(cuota_ids) && cuota_ids.length > 0) {
                filtrosCuotas.push(`id IN (${cuota_ids.map(() => '?').join(',')})`);
                paramsCuotas.push(...cuota_ids.map(Number));
            }

            const [cuotasRows] = await connection.query(
                `SELECT id, saldo_pendiente FROM venta_cuotas WHERE ${filtrosCuotas.join(' AND ')} ORDER BY fecha_vencimiento ASC, numero_cuota ASC`,
                paramsCuotas
            );

            let montoRestanteCuotas = montoNum;
            const cuotasPagadasIds = [];
            for (const cuota of cuotasRows) {
                if (montoRestanteCuotas <= 0) break;
                const saldoCuota = parseFloat(cuota.saldo_pendiente);
                const pagoCuota = Math.min(montoRestanteCuotas, saldoCuota);
                const nuevoSaldoCuota = redondear2(saldoCuota - pagoCuota);
                const nuevoEstadoCuota = nuevoSaldoCuota <= 0 ? 'Pagada' : 'Parcial';

                await connection.query(
                    `UPDATE venta_cuotas
                     SET saldo_pendiente = ?, estado = ?, fecha_pago = CASE WHEN ? = 'Pagada' THEN NOW() ELSE fecha_pago END, observaciones = ?
                     WHERE empresa_id = ? AND id = ?`,
                    [nuevoSaldoCuota, nuevoEstadoCuota, nuevoEstadoCuota, observacionesPago, empresaId, cuota.id]
                );

                montoRestanteCuotas = redondear2(montoRestanteCuotas - pagoCuota);
                if (pagoCuota > 0) cuotasPagadasIds.push(cuota.id);
            }
        }

        // 2) Actualizar ventas
        await connection.query(
            "UPDATE ventas SET saldo_pendiente = ?, estado_pago = ? WHERE id = ? AND empresa_id=?",
            [nuevoSaldo, nuevoEstado, ventaIdNum, empresaId]
        );

        // 3) Registrar en cuenta corriente
        const [ccRows] = await connection.query(
            "SELECT IFNULL(SUM(debe - haber), 0) as saldoActual FROM cuenta_corriente WHERE empresa_id = ? AND cliente_id = ? AND estado = 1",
            [empresaId, idCliente]
        );
        const saldoActualNum = parseFloat(ccRows[0].saldoActual) || 0;
        const nuevoSaldoAcumulado = saldoActualNum - montoNum;

        const [insertCcResult] = await connection.query(
            `INSERT INTO cuenta_corriente (empresa_id, cliente_id, venta_id, descripcion, debe, haber, saldo_acumulado, observaciones) 
            VALUES (?, ?, ?, ?, 0, ?, ?, ?)`,
            [empresaId, idCliente, ventaIdNum, `Pago Venta #${ventaIdNum}`, montoNum, nuevoSaldoAcumulado, observacionesPago]
        );

        // Obtener el id del recibo (insertId de la inserción anterior)
        const reciboId = insertCcResult.insertId;

        // Si se pagaron cuotas, vincular el recibo a las cuotas afectadas
        if (Array.isArray(cuotasPagadasIds) && cuotasPagadasIds.length > 0) {
            await connection.query(
                `UPDATE venta_cuotas SET recibo_id = ? WHERE empresa_id = ? AND id IN (${cuotasPagadasIds.map(() => '?').join(',')})`,
                [reciboId, empresaId, ...cuotasPagadasIds]
            );
        }

        await connection.commit();
        return res.json({ success: true, nuevoSaldo, reciboId });

    } catch (error) {
        await connection.rollback();
        console.error("ERROR EN PAGO:", error.message);
        return res.status(500).json({ error: "Error interno del servidor" });
    } finally {
        connection.release();
    }
};
