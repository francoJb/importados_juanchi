const db = require('../database/database'); // Tu conexión a MySQL

exports.crearVenta = async (req, res) => {
    
    const { cliente_id, total, metodo_pago, entrega_inicial, items, observaciones } = req.body;
    
    if (metodo_pago === 'Cuenta Corriente' && (!cliente_id || Number(cliente_id) === 0)) {
        return res.status(400).json({
            error: "No se puede registrar Cuenta Corriente para Consumidor Final. Seleccioná un cliente registrado."
        });
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

        const [ventaRes] = await connection.query(
            `INSERT INTO ventas (cliente_id, total, metodo_pago, estado_pago, saldo_pendiente, observaciones) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [cliente_id === 0 ? null : cliente_id, total, metodo_pago, estadoPago, saldoPendiente, observaciones]
        );
        const ventaId = ventaRes.insertId;

        // 2. Procesar cada Producto (Detalle + Stock)
        // Localizá este bucle dentro de exports.crearVenta
        for (const item of items) {
            // A. CONSULTA DE SEGURIDAD: Traemos el stock actual y el nombre del producto
            const [productoRows] = await connection.query(
                "SELECT stock, descripcion FROM productos WHERE id = ?",
                [item.id]
            );
            const producto = productoRows[0];
            // B. VALIDACIÓN: Si no hay fila (raro) o si el stock es menor a lo pedido
            if (!producto || producto.stock < item.cantidad) {
                // Al lanzar este Error, el 'catch' de abajo ejecutará connection.rollback()
                // Esto cancela TODA la venta, incluso si los productos anteriores sí tenían stock.
                throw new Error(`Stock insuficiente para "${producto ? producto.descripcion : 'ID ' + item.id}". disponible: ${producto ? producto.stock : 0}`);
            }
            // C. REGISTRO DEL DETALLE (Solo si pasó la validación de arriba)
            await connection.query(
                "INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)",
                [ventaId, item.id, item.cantidad, item.precio]
            );
            // D. DESCUENTO DE STOCK
            await connection.query(
                "UPDATE productos SET stock = stock - ? WHERE id = ?",
                [item.cantidad, item.id]
            );
        }

        // 3. LÓGICA DE CUENTA CORRIENTE (Si aplica)
        if (metodo_pago === 'Cuenta Corriente' && cliente_id !== 0) {
    
            // A. Primero obtenemos el saldo actual del cliente
            const [rows] = await connection.query(
                "SELECT IFNULL(SUM(debe - haber), 0) as saldoActual FROM cuenta_corriente WHERE cliente_id = ?",
                [cliente_id]
            );
            let saldoCalculado = parseFloat(rows[0].saldoActual);

            // B. Registrar la DEUDA (El DEBE)
            saldoCalculado += parseFloat(total); // Sumamos lo que se lleva
            await connection.query(
                `INSERT INTO cuenta_corriente (cliente_id, venta_id, descripcion, debe, haber, saldo_acumulado) 
                VALUES (?, ?, ?, ?, 0, ?)`,
                [cliente_id, ventaId, `Venta # ${ventaId} - ${observaciones || 'Sin obs.'}`, total, saldoCalculado]
            );

            // C. Si hubo ENTREGA INICIAL, registrar el pago (El HABER)
            if (entrega_inicial > 0) {
                saldoCalculado -= parseFloat(entrega_inicial); // Restamos lo que pagó
                await connection.query(
                    `INSERT INTO cuenta_corriente (cliente_id, venta_id, descripcion, debe, haber, saldo_acumulado) 
                    VALUES (?, ?, ?, 0, ?, ?)`,
                    [cliente_id, ventaId, `Entrega inicial Venta #${ventaId}`, entrega_inicial, saldoCalculado]
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
            LEFT JOIN clientes c ON v.cliente_id = c.id
            ORDER BY v.fecha DESC
        `);
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
            LEFT JOIN clientes c ON v.cliente_id = c.id
            WHERE v.id = ?
        `, [id]);
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
            JOIN productos p ON d.producto_id = p.id
            WHERE d.venta_id = ?`, 
        [id]);

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
            "SELECT id FROM ventas WHERE id = ?",
            [ventaId]
        );

        if (ventaRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Venta no encontrada" });
        }

        const [detalles] = await connection.query(
            "SELECT producto_id, cantidad FROM detalle_ventas WHERE venta_id = ?",
            [ventaId]
        );

        for (const detalle of detalles) {
            await connection.query(
                "UPDATE productos SET stock = stock + ? WHERE id = ?",
                [detalle.cantidad, detalle.producto_id]
            );
        }

        await connection.query(
            "DELETE FROM cuenta_corriente WHERE venta_id = ?",
            [ventaId]
        );

        await connection.query(
            "DELETE FROM detalle_ventas WHERE venta_id = ?",
            [ventaId]
        );

        await connection.query(
            "DELETE FROM ventas WHERE id = ?",
            [ventaId]
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
    const { monto } = req.body;

    const ventaIdNum = Number(ventaId);
    if (!Number.isInteger(ventaIdNum) || ventaIdNum <= 0) {
        return res.status(400).json({ error: "ID de venta inválido." });
    }

    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
        return res.status(400).json({ error: "Monto inválido. Debe ser mayor a 0." });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1) Buscar venta
        const [ventaRows] = await connection.query(
            "SELECT cliente_id, total, saldo_pendiente FROM ventas WHERE id = ?",
            [ventaIdNum]
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
            "UPDATE ventas SET saldo_pendiente = ?, estado_pago = ? WHERE id = ?",
            [nuevoSaldo, nuevoEstado, ventaIdNum]
        );

        // 3) Registrar en cuenta corriente
        const [ccRows] = await connection.query(
            "SELECT IFNULL(SUM(debe - haber), 0) as saldoActual FROM cuenta_corriente WHERE cliente_id = ?",
            [idCliente]
        );
        const saldoActualNum = parseFloat(ccRows[0].saldoActual) || 0;
        const nuevoSaldoAcumulado = saldoActualNum - montoNum;

        await connection.query(
            `INSERT INTO cuenta_corriente (cliente_id, venta_id, descripcion, debe, haber, saldo_acumulado) 
             VALUES (?, ?, ?, 0, ?, ?)`,
            [idCliente, ventaIdNum, `Pago Venta #${ventaIdNum}`, montoNum, nuevoSaldoAcumulado]
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