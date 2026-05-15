const db = require('../database/database'); // Tu conexión a MySQL

exports.crearVenta = async (req, res) => {
    
    const { cliente_id, total, metodo_pago, entrega_inicial, items, observaciones } = req.body;
    
    if (metodo_pago === 'Cuenta Corriente' && (!cliente_id || Number(cliente_id) === 0)) {
        return res.status(400).json({
            error: "No se puede registrar Cuenta Corriente para Consumidor Final. Seleccioná un cliente registrado."
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

    if (!total || Number(total) <= 0) {
        return res.status(400).json({ error: "El total de la venta debe ser mayor a 0." });
    }
    

    // Obtenemos una conexión del pool para la transacción
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Insertar la Cabecera de la Venta
        // Si es Cta Cte, el saldo_pendiente es (Total - Entrega)
        const saldoPendiente = (metodo_pago === 'Cuenta Corriente') ? (total - entrega_inicial) : 0;
        const estadoPago = (metodo_pago === 'Cuenta Corriente' && saldoPendiente > 0) ? 'Pendiente' : 'Pagado';

        const empresaId = req.empresaId;
        const [ventaRes] = await connection.query(
            `INSERT INTO ventas (empresa_id, cliente_id, total, metodo_pago, estado_pago, saldo_pendiente, observaciones) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [empresaId, cliente_id === 0 ? null : cliente_id, total, metodo_pago, estadoPago, saldoPendiente, observaciones]
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

        // 3. LÓGICA DE CUENTA CORRIENTE (Si aplica)
        if (metodo_pago === 'Cuenta Corriente' && cliente_id !== 0) {
    
            // A. Primero obtenemos el saldo actual del cliente
            const [rows] = await connection.query(
                "SELECT IFNULL(SUM(debe - haber), 0) as saldoActual FROM cuenta_corriente WHERE empresa_id = ? AND cliente_id = ?",
                [empresaId, cliente_id]
            );
            let saldoCalculado = parseFloat(rows[0].saldoActual);

            // B. Registrar la DEUDA (El DEBE)
            saldoCalculado += parseFloat(total); // Sumamos lo que se lleva
            await connection.query(
                `INSERT INTO cuenta_corriente (empresa_id, cliente_id, venta_id, descripcion, debe, haber, saldo_acumulado) 
                VALUES (?, ?, ?, ?, ?, 0, ?)`,
                [empresaId, cliente_id, ventaId, `Venta # ${ventaId} - ${observaciones || 'Sin obs.'}`, total, saldoCalculado]
            );

            // C. Si hubo ENTREGA INICIAL, registrar el pago (El HABER)
            if (entrega_inicial > 0) {
                saldoCalculado -= parseFloat(entrega_inicial); // Restamos lo que pagó
                await connection.query(
                    `INSERT INTO cuenta_corriente (empresa_id, cliente_id, venta_id, descripcion, debe, haber, saldo_acumulado) 
                    VALUES (?, ?, ?, ?, 0, ?, ?)`,
                    [empresaId, cliente_id, ventaId, `Entrega inicial Venta #${ventaId}`, entrega_inicial, saldoCalculado]
                );
            }
        }
        await connection.commit();
        res.json({ success: true, mensaje: "Venta y Cta. Cte. procesadas con éxito", ventaId });


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
        const [rows] = await db.query(`
            SELECT 
                v.id,
                v.cliente_id, 
                v.fecha, 
                v.total, 
                v.saldo_pendiente, 
                v.estado_pago, -- Usaremos esto para saber si está "Finalizado" o "Pendiente"
                c.nombre AS cliente_nombre, 
                c.apellido AS cliente_apellido
            FROM ventas v
            LEFT JOIN clientes c ON v.cliente_id = c.id AND c.empresa_id=?
            WHERE v.empresa_id=? and v.estado = 1
            ORDER BY v.fecha DESC
            `, [empresaId, empresaId]
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
            "SELECT id FROM ventas WHERE id=? AND empresa_id=?",
            [ventaId, req.empresaId]
        );

        if (ventaRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Venta no encontrada" });
        }

        const [detalles] = await connection.query(
            "SELECT producto_id, cantidad FROM detalle_ventas WHERE empresa_id = ? AND venta_id = ?",
            [req.empresaId, ventaId]
        );

        for (const detalle of detalles) {
            await connection.query(
                "UPDATE productos SET stock = stock + ? WHERE empresa_id=? AND id = ?",
                [detalle.cantidad, req.empresaId, detalle.producto_id]
            );
        }

        await connection.query(
            "DELETE FROM cuenta_corriente WHERE empresa_id=? AND venta_id = ?",
            [req.empresaId, ventaId]
        );

        await connection.query(
            "DELETE FROM detalle_ventas WHERE empresa_id=? AND venta_id = ?",
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
exports.registrarPago = async (req, res) => {
    const { ventaId } = req.params;
    const { monto, observaciones } = req.body;

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
            "SELECT cliente_id, total, saldo_pendiente FROM ventas WHERE empresa_id = ? AND id = ? and estado = 1",
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

        const nuevoSaldo = saldoPendienteNum - montoNum;
        const nuevoEstado = nuevoSaldo <= 0 ? "Pagado" : "Parcial";

        // 2) Actualizar ventas
        await connection.query(
            "UPDATE ventas SET saldo_pendiente = ?, estado_pago = ? WHERE id = ? AND empresa_id=?",
            [nuevoSaldo, nuevoEstado, ventaIdNum, empresaId]
        );

        // 3) Registrar en cuenta corriente
        const [ccRows] = await connection.query(
            "SELECT IFNULL(SUM(debe - haber), 0) as saldoActual FROM cuenta_corriente WHERE empresa_id = ? AND cliente_id = ?",
            [empresaId, idCliente]
        );
        const saldoActualNum = parseFloat(ccRows[0].saldoActual) || 0;
        const nuevoSaldoAcumulado = saldoActualNum - montoNum;

        const observacionesPago = observaciones && observaciones.trim()
            ? observaciones.trim()
            : null;

        await connection.query(
            `INSERT INTO cuenta_corriente (empresa_id, cliente_id, venta_id, descripcion, debe, haber, saldo_acumulado, observaciones) 
            VALUES (?, ?, ?, ?, 0, ?, ?, ?)`,
            [empresaId, idCliente, ventaIdNum, `Pago Venta #${ventaIdNum}`, montoNum, nuevoSaldoAcumulado, observacionesPago]
        );

        await connection.commit();
        return res.json({ success: true, nuevoSaldo });

    } catch (error) {
        await connection.rollback();
        console.error("ERROR EN PAGO:", error.message);
        return res.status(500).json({ error: "Error interno del servidor" });
    } finally {
        connection.release();
    }
};