const db = require('../database/database');

exports.realizarVenta = async (req, res) => {
    const { cliente_id, fecha, items, total } = req.body;
    const connection = await db.getConnection(); // Pedimos una conexión para la transacción
    try {
        await connection.beginTransaction();
        // 1. Insertar la Venta (Cabecera)
        const [ventaRes] = await connection.query(
            "INSERT INTO ventas (cliente_id, fecha, total) VALUES (?, ?, ?)",
            [cliente_id, fecha, total]
        );
        const ventaId = ventaRes.insertId;
        // 2. Procesar cada item
        for (const item of items) {
            // A. Insertar en detalle_ventas
            await connection.query(
                "INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)",
                [ventaId, item.id, item.cantidad, item.precio]
            );
            // B. Descontar Stock
            await connection.query(
                "UPDATE productos SET stock = stock - ? WHERE id = ?",
                [item.cantidad, item.id]
            );
        }
        await connection.commit();
        res.json({ mensaje: "Venta realizada con éxito", id: ventaId });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: "Fallo en la venta: " + error.message });
    } finally {
        connection.release(); // Devolvemos la conexión al pool
    }
};