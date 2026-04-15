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
                v.fecha, 
                v.total, 
                v.saldo_pendiente, 
                v.estado_pago, -- Usaremos esto para saber si está "Entregado" o "Pendiente"
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

exports.registrarPago = async (req, res) => {
    const { ventaId } = req.params;
    const { monto } = req.body; // Ya no necesitamos obligatoriamente el clienteId desde afuera
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Buscamos la venta y el ID del cliente al mismo tiempo (Seguridad total)
        const [ventaRows] = await connection.query(
            "SELECT cliente_id, total, saldo_pendiente FROM ventas WHERE id = ?", 
            [ventaId]
        );

        if (ventaRows.length === 0) throw new Error("Venta no encontrada");

        const venta = ventaRows[0];
        const idCliente = venta.cliente_id; // <--- Lo recuperamos de la DB
        const nuevoSaldo = parseFloat(venta.saldo_pendiente) - parseFloat(monto);
        const nuevoEstado = nuevoSaldo <= 0 ? 'Pagado' : 'Parcial';

        if (nuevoSaldo < 0) throw new Error("El monto supera el saldo pendiente");

        // 2. Actualizar la tabla Ventas
        await connection.query(
            "UPDATE ventas SET saldo_pendiente = ?, estado_pago = ? WHERE id = ?",
            [nuevoSaldo, nuevoEstado, ventaId]
        );

        // 3. Registrar en Cuenta Corriente
        // Calculamos el saldo acumulado del cliente para que la historia cierre
        const [ccRows] = await connection.query(
            "SELECT IFNULL(SUM(debe - haber), 0) as saldoActual FROM cuenta_corriente WHERE cliente_id = ?",
            [idCliente]
        );
        const nuevoSaldoAcumulado = parseFloat(ccRows[0].saldoActual) - parseFloat(monto);

        await connection.query(
            `INSERT INTO cuenta_corriente (cliente_id, venta_id, descripcion, debe, haber, saldo_acumulado) 
             VALUES (?, ?, ?, 0, ?, ?)`,
            [idCliente, ventaId, `Pago Venta #${ventaId}`, monto, nuevoSaldoAcumulado]
        );

        await connection.commit();
        res.json({ success: true, nuevoSaldo });

    } catch (error) {
        await connection.rollback();
        console.error("ERROR EN PAGO:", error.message); // Esto te saldrá en la terminal de VS Code
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
};