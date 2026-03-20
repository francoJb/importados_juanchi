const db = require('../database/database');

exports.obtenerProductos = (req, res) => {
    db.all("SELECT * FROM productos", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

exports.crearProducto = (req, res) => {
    const p = req.body;
    const sql = `INSERT INTO productos (prodCodigo, prodDescripcion, prodMarca, prodModelo, prodCategoria, prodCosto, prodPrecio, prodStock, prodStockMinimo, prodControlStock) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const params = [p.prodCodigo, p.prodDescripcion, p.prodMarca, p.prodModelo, p.prodCategoria, p.prodCosto, p.prodPrecio, p.prodStock, p.prodStockMinimo, p.prodControlStock ? 1 : 0];

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID, ...p });
    });
};

exports.editarProducto = (req, res) => {
    const { id } = req.params;
    const p = req.body;
    const sql = `UPDATE productos SET prodCodigo=?, prodDescripcion=?, prodMarca=?, prodModelo=?, prodCategoria=?, prodCosto=?, prodPrecio=?, prodStock=?, prodStockMinimo=?, prodControlStock=? WHERE id=?`;
    
    const params = [p.prodCodigo, p.prodDescripcion, p.prodMarca, p.prodModelo, p.prodCategoria, p.prodCosto, p.prodPrecio, p.prodStock, p.prodStockMinimo, p.prodControlStock ? 1 : 0, id];

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ mensaje: "Actualizado", cambios: this.changes });
    });
};