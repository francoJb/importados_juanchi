const db = require('../database/database');

exports.obtenerProductos = (req, res) => {
    db.all("SELECT * FROM productos WHERE estado = 1", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

exports.crearProducto = (req, res) => {
    const p = req.body;
    const sql = `INSERT INTO productos (sku, descripcion, marca, modelo, categoria, proveedor, costo, precio_neto, iva, control_stock, stock, stock_minimo) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [p.sku, p.descripcion, p.marca, p.modelo, p.categoria, p.proveedor, p.costo, p.precio_neto, p.iva, p.control_stock ? 1 : 0, p.stock, p.stock_minimo];
    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID, ...p });
    });
};

exports.editarProducto = (req, res) => {
    const { id } = req.params;
    const p = req.body;
    const sql = `UPDATE productos SET sku=?, descripcion=?, marca=?, modelo=?, categoria=?, proveedor=?, costo=?, precio_neto=?, iva=?, control_stock=?, stock=?, stock_minimo=? WHERE id=?`;
    const params = [p.sku, p.descripcion, p.marca, p.modelo, p.categoria, p.proveedor, p.costo, p.precio_neto, p.iva, p.control_stock ? 1 : 0, p.stock, p.stock_minimo, id];
    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ mensaje: "Actualizado", cambios: this.changes });
    });
};



exports.eliminarProducto = (req, res) => {
    // 1. Obtenemos el ID que viene en la URL (ej: /api/productos/5)
    const { id } = req.params;
    // 2. Definimos el SQL para la "Baja Lógica" (poner estado en 0)
    const sql = `UPDATE productos SET estado = 0 WHERE id = ?`;
    // 3. Le pedimos a SQLite que ejecute el cambio
    db.run(sql, [id], function(err) {
        if (err) {
            // Si hay un error de base de datos, avisamos al frontend
            console.error("Error al desactivar producto:", err.message);
            return res.status(500).json({ error: err.message });
        }
        // Si no se cambió ninguna fila, es porque el ID no existía
        if (this.changes === 0) {
            return res.status(404).json({ mensaje: "Producto no encontrado" });
        }
        // Si todo salió bien, respondemos con éxito
        res.json({ 
            mensaje: "Producto desactivado correctamente",
            id: id 
        });
    });
};