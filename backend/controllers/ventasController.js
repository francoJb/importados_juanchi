const db = require('../database/database'); // Tu conexión a MySQL

exports.crearVenta = async (req, res) => {
    const { cliente_id, total, metodo_pago, entrega_inicial, items, observaciones } = req.body;
    
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
        for (const item of items) {
            // Insertar detalle
            await connection.query(
                "INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)",
                [ventaId, item.id, item.cantidad, item.precio]
            );

            // DESCONTAR STOCK
            await connection.query(
                "UPDATE productos SET stock = stock - ? WHERE id = ?",
                [item.cantidad, item.id]
            );
        }

        // 3. LÓGICA DE CUENTA CORRIENTE (Si aplica)
        if (metodo_pago === 'Cuenta Corriente' && cliente_id !== 0) {
            
            // A. Registrar la DEUDA (El DEBE)
            await connection.query(
                `INSERT INTO cuenta_corriente (cliente_id, venta_id, descripcion, debe, haber, saldo_acumulado) 
                 VALUES (?, ?, ?, ?, 0, (SELECT IFNULL(SUM(debe - haber), 0) + ? FROM cuenta_corriente WHERE cliente_id = ?))`,
                [cliente_id, ventaId, `Venta # ${ventaId} - ${observaciones || 'Sin obs.'}`, total, total, cliente_id]
            );

            // B. Si hubo ENTREGA INICIAL, registrar el pago (El HABER)
            if (entrega_inicial > 0) {
                await connection.query(
                    `INSERT INTO cuenta_corriente (cliente_id, venta_id, descripcion, debe, haber, saldo_acumulado) 
                     VALUES (?, ?, ?, 0, ?, (SELECT IFNULL(SUM(debe - haber), 0) - ? FROM cuenta_corriente WHERE cliente_id = ?))`,
                    [cliente_id, ventaId, `Entrega inicial Venta #${ventaId}`, entrega_inicial, entrega_inicial, cliente_id]
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