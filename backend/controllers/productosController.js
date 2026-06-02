const db = require('../database/database');
const { formatearFechaHoraArgentina, ahoraArgentinaDate } = require('../utils/time');
const { logAction } = require('../utils/audit');

// Función auxiliar para obtener o crear categoría
async function obtenerOCrearCategoria(nombreCategoria, empresaId) {
    if (!nombreCategoria?.trim()) return null;
    const nombreNormalizado = nombreCategoria.trim().toUpperCase();
    const [existing] = await db.query("SELECT id FROM categorias WHERE empresa_id = ? AND nombre = ? AND estado = 1", [empresaId, nombreNormalizado]);
    if (existing.length > 0) {
        return existing[0].id;
    }
    const [result] = await db.query("INSERT INTO categorias (empresa_id, nombre, estado) VALUES (?, ?, 1)", [empresaId, nombreNormalizado]);
    return result.insertId;
}

// Función auxiliar para obtener o crear proveedor
async function obtenerOCrearProveedor(nombreProveedor, empresaId) {
    if (!nombreProveedor?.trim()) return null;
    const nombreNormalizado = nombreProveedor.trim().toUpperCase();
    const [existing] = await db.query("SELECT id FROM proveedores WHERE empresa_id = ? AND nombre = ? AND estado = 1", [empresaId, nombreNormalizado]);
    if (existing.length > 0) {
        return existing[0].id;
    }
    const [result] = await db.query(`INSERT INTO proveedores (empresa_id, nombre, estado) VALUES (?, ?, 1)`, [empresaId, nombreNormalizado]);
    return result.insertId;
}

exports.obtenerProductos = async (req, res) => {
    try {
        const empresaId = req.empresaId; // Del middleware
        const estado = req.query.estado === 'eliminados' ? 0 : 1;
        const [rows] = await db.query(`
            SELECT p.*, c.nombre as categoria, COALESCE(pr.nombre, p.proveedor) as proveedor
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id AND c.empresa_id = ?
            LEFT JOIN proveedores pr ON p.proveedor_id = pr.id AND pr.empresa_id = ?
            WHERE p.empresa_id = ? AND p.estado = ?
            ORDER BY p.descripcion
        `, [empresaId, empresaId, empresaId, estado]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.obtenerCategorias = async (req, res) => {
    try {
        const empresaId = req.empresaId;
        const [rows] = await db.query("SELECT id, nombre FROM categorias WHERE empresa_id = ? AND estado = 1 ORDER BY nombre", [empresaId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.crearProducto = async (req, res) => {
    const p = req.body;
    const empresaId = req.empresaId; // Del middleware
    
    if (!p.sku?.trim() || !p.descripcion?.trim()) {
        return res.status(400).json({ error: "SKU y Descripcion son obligatorios" });
    }
    try {
        const checkSql = "SELECT id FROM productos WHERE empresa_id = ? AND sku = ? AND estado = 1";
        const [existing] = await db.query(checkSql, [empresaId, p.sku.trim()]);
        
        if (existing.length > 0) {
            return res.status(400).json({ error: `El SKU "${p.sku}" ya esta registrado en otro producto` });
        }
        const categoriaId = await obtenerOCrearCategoria(p.categoria, empresaId);
        const proveedorId = await obtenerOCrearProveedor(p.proveedor, empresaId);
        const sql = `INSERT INTO productos (empresa_id, sku, descripcion, marca, modelo, categoria_id, proveedor, proveedor_id, costo, precio_neto, iva, control_stock, stock, stock_minimo, estado) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`;
        const params = [
            empresaId,
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
    const empresaId = req.empresaId;
    const p = req.body;

    if (!p.sku?.trim() || !p.descripcion?.trim()) {
        return res.status(400).json({ error: "SKU y Descripcion son obligatorios" });
    }

    try {
        // Obtener o crear categoría
        const categoriaId = await obtenerOCrearCategoria(p.categoria, empresaId);
        const proveedorId = await obtenerOCrearProveedor(p.proveedor, empresaId);

        const sql = `UPDATE productos SET sku=?, descripcion=?, marca=?, modelo=?, categoria_id=?, proveedor=?, proveedor_id=?, costo=?, precio_neto=?, iva=?, control_stock=?, stock=?, stock_minimo=? WHERE empresa_id=? AND id=? AND estado = 1`;
        
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
            empresaId,
            id
        ];

        const [result] = await db.query(sql, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: "Producto no encontrado o inactivo" });
        }
        res.json({ mensaje: "Actualizado", cambios: result.affectedRows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.eliminarProducto = async (req, res) => {
    const { id } = req.params;
    const empresaId = req.empresaId;
    const sql = `UPDATE productos SET estado = 0, deleted_at = ?, deleted_by = ? WHERE empresa_id=? AND id=?`;
    const fecha = formatearFechaHoraArgentina(ahoraArgentinaDate());
    try {
        const [result] = await db.query(sql, [fecha, req.usuarioId || null, empresaId, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: "Producto no encontrado" });
        }
        await logAction(db, { empresaId, usuarioId: req.usuarioId || null, accion: 'soft_delete', entidad: 'productos', entidadId: id, descripcion: 'Producto desactivado' });
        res.json({ 
            mensaje: "Producto desactivado correctamente",
            id: id 
        });
    } catch (err) {
        console.error("Error al desactivar producto:", err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.restaurarProducto = async (req, res) => {
    const { id } = req.params;
    const empresaId = req.empresaId;

    try {
        const [result] = await db.query(
            "UPDATE productos SET estado = 1 WHERE empresa_id = ? AND id = ? AND estado = 0",
            [empresaId, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: "Producto eliminado no encontrado" });
        }
        await logAction(db, { empresaId, usuarioId: req.usuarioId || null, accion: 'restore', entidad: 'productos', entidadId: id, descripcion: 'Producto restaurado' });
        res.json({ mensaje: "Producto restaurado correctamente", id });
    } catch (err) {
        console.error("Error al restaurar producto:", err.message);
        res.status(500).json({ error: err.message });
    }
};
