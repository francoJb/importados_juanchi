const db = require('../database/database');

// Función auxiliar para obtener o crear categoría
async function obtenerOCrearCategoria(nombreCategoria) {
    if (!nombreCategoria?.trim()) return null;

    const nombreNormalizado = nombreCategoria.trim().toUpperCase();

    const [existing] = await db.query("SELECT id FROM categorias WHERE nombre = ? AND estado = 1", [nombreNormalizado]);
    if (existing.length > 0) {
        return existing[0].id;
    }

    const [result] = await db.query("INSERT INTO categorias (nombre, estado) VALUES (?, 1)", [nombreNormalizado]);
    return result.insertId;
}

// Función auxiliar para obtener o crear proveedor
async function obtenerOCrearProveedor(nombreProveedor) {
    if (!nombreProveedor?.trim()) return null;

    const nombreNormalizado = nombreProveedor.trim().toUpperCase();

    const [existing] = await db.query("SELECT id FROM proveedores WHERE nombre = ? AND estado = 1", [nombreNormalizado]);
    if (existing.length > 0) {
        return existing[0].id;
    }

    const [result] = await db.query(
        `INSERT INTO proveedores (nombre, estado) VALUES (?, 1)`,
        [nombreNormalizado]
    );
    return result.insertId;
}

exports.obtenerProductos = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.*, c.nombre as categoria, COALESCE(pr.nombre, p.proveedor) as proveedor
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
            WHERE p.estado = 1
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.obtenerCategorias = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT id, nombre FROM categorias WHERE estado = 1 ORDER BY nombre");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.crearProducto = async (req, res) => {
    const p = req.body;

    // 1. Validaciones básicas
    if (!p.sku?.trim() || !p.descripcion?.trim()) {
        return res.status(400).json({ error: "SKU y Descripcion son obligatorios" });
    }

    try {
        // 2. Validación de SKU manual (opcional, MySQL UNIQUE también lo frenaría)
        const checkSql = "SELECT id FROM productos WHERE sku = ? AND estado = 1";
        const [existing] = await db.query(checkSql, [p.sku.trim()]);
        
        if (existing.length > 0) {
            return res.status(400).json({ error: `El SKU "${p.sku}" ya esta registrado en otro producto` });
        }

        // 3. Obtener o crear categoría
        const categoriaId = await obtenerOCrearCategoria(p.categoria);

        // 4. Inserción
        const proveedorId = await obtenerOCrearProveedor(p.proveedor);

        const sql = `INSERT INTO productos (sku, descripcion, marca, modelo, categoria_id, proveedor, proveedor_id, costo, precio_neto, iva, control_stock, stock, stock_minimo, estado) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`;
        
        const params = [
            p.sku.trim(), 
            p.descripcion, 
            p.marca, 
            p.modelo, 
            categoriaId, 
            p.proveedor,
            proveedorId,
            p.costo || 0, 
            p.precio_neto || 0, 
            p.iva || 21, 
            p.control_stock ? 1 : 0, 
            p.stock || 0, 
            p.stock_minimo || 0
        ];

        const [result] = await db.query(sql, params);
        
        res.status(201).json({ 
            id: result.insertId, 
            ...p, 
            categoria_id: categoriaId,
            control_stock: p.control_stock ? 1 : 0 
        });

    } catch (err) {
        console.error("Error al crear producto:", err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.editarProducto = async (req, res) => {
    const { id } = req.params;
    const p = req.body;

    if (!p.sku?.trim() || !p.descripcion?.trim()) {
        return res.status(400).json({ error: "SKU y Descripcion son obligatorios" });
    }

    try {
        // Obtener o crear categoría
        const categoriaId = await obtenerOCrearCategoria(p.categoria);

        const proveedorId = await obtenerOCrearProveedor(p.proveedor);

        const sql = `UPDATE productos SET sku=?, descripcion=?, marca=?, modelo=?, categoria_id=?, proveedor=?, proveedor_id=?, costo=?, precio_neto=?, iva=?, control_stock=?, stock=?, stock_minimo=? WHERE id=?`;
        
        const params = [
            p.sku, 
            p.descripcion, 
            p.marca, 
            p.modelo, 
            categoriaId, 
            p.proveedor, 
            proveedorId,
            p.costo, 
            p.precio_neto, 
            p.iva, 
            p.control_stock ? 1 : 0, 
            p.stock, 
            p.stock_minimo, 
            id
        ];

        const [result] = await db.query(sql, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: "Producto no encontrado" });
        }
        res.json({ mensaje: "Actualizado", cambios: result.affectedRows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.eliminarProducto = async (req, res) => {
    const { id } = req.params;
    const sql = `UPDATE productos SET estado = 0 WHERE id = ?`;

    try {
        const [result] = await db.query(sql, [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: "Producto no encontrado" });
        }
        res.json({ 
            mensaje: "Producto desactivado correctamente",
            id: id 
        });
    } catch (err) {
        console.error("Error al desactivar producto:", err.message);
        res.status(500).json({ error: err.message });
    }
};