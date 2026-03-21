const db = require('../database/database');

exports.obtenerProductos = (req, res) => {
    db.all("SELECT * FROM productos", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

exports.crearProducto = (req, res) => {
    const p = req.body;
    const sql = `INSERT INTO productos (sku, descripcion, marca, modelo, categoria, proveedor, costo, precio_neto, iva, control_stock, stock, stock_minimo, estado) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const params = [p.sku, p.descripcion, p.marca, p.modelo, p.categoria, p.proveedor, p.costo, p.precio_neto, p.iva, p.control_stock ? 1 : 0, p.stock, p.stock_minimo, p.estado];

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID, ...p });
    });
};

exports.editarProducto = (req, res) => {
    const { id } = req.params;
    const p = req.body;
    const sql = `UPDATE productos SET sku=?, descripcion=?, marca=?, modelo=?, categoria=?, proveedor=?, costo=?, precio_neto=?, iva=?, control_stock=?, stock=?, stock_minimo=?, estado=?, WHERE id=?`;
    
    const params = [p.sku, p.descripcion, p.marca, p.modelo, p.categoria, p.proveedor, p.costo, p.precio_neto, p.iva, p.control_stock ? 1 : 0, p.stock, p.stock_minimo, p.estado, id];

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ mensaje: "Actualizado", cambios: this.changes });
    });
};