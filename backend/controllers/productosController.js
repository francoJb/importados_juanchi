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
        const empresaId = req.empresaId; 
        const estado = req.query.estado === 'eliminados' ? 0 : 1;

        const [rows] = await db.query(`
            SELECT 
                p.*, 
                c.nombre as categoria, 
                COALESCE(pr.nombre, p.proveedor) as proveedor,
                CASE 
                    WHEN c.nombre IS NOT NULL AND c.nombre LIKE 'VEHICULO%' THEN
                        (SELECT COUNT(*) FROM vehiculos_unidades vu WHERE vu.producto_id = p.id AND vu.empresa_id = ? AND vu.estado_venta = 'Disponible' AND vu.estado = 1)
                    ELSE 
                        p.stock 
                END as stock
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id AND c.empresa_id = ?
            LEFT JOIN proveedores pr ON p.proveedor_id = pr.id AND pr.empresa_id = ?
            WHERE p.empresa_id = ? AND p.estado = ?
            ORDER BY p.descripcion
        `, [empresaId, empresaId, empresaId, empresaId, estado]);

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
    const connection = await db.getConnection();
    const empresaId = req.empresaId;

    try {
        await connection.beginTransaction();

        const {
            sku,
            marca,
            modelo,
            descripcion,
            costo,
            precio_neto,
            stock_minimo,
            control_stock,
            categoria_nombre,
            proveedor_nombre
        } = req.body;

        if (!sku || !descripcion || costo === undefined || precio_neto === undefined) {
            return res.status(400).json({ error: "Faltan campos requeridos" });
        }

        let categoriaId = null;
        if (categoria_nombre?.trim()) {
            const nombreNormalizado = categoria_nombre.trim().toUpperCase();
            const [existingCat] = await connection.query("SELECT id FROM categorias WHERE empresa_id = ? AND nombre = ? AND estado = 1", [empresaId, nombreNormalizado]);
            if (existingCat.length > 0) {
                categoriaId = existingCat[0].id;
            } else {
                const [resultCat] = await connection.query("INSERT INTO categorias (empresa_id, nombre, estado) VALUES (?, ?, 1)", [empresaId, nombreNormalizado]);
                categoriaId = resultCat.insertId;
            }
        }

        let proveedorId = null;
        if (proveedor_nombre?.trim()) {
            const nombreNormalizado = proveedor_nombre.trim().toUpperCase();
            const [existingProv] = await connection.query("SELECT id FROM proveedores WHERE empresa_id = ? AND nombre = ? AND estado = 1", [empresaId, nombreNormalizado]);
            if (existingProv.length > 0) {
                proveedorId = existingProv[0].id;
            } else {
                const [resultProv] = await connection.query("INSERT INTO proveedores (empresa_id, nombre, estado) VALUES (?, ?, 1)", [empresaId, nombreNormalizado]);
                proveedorId = resultProv.insertId;
            }
        }

        const [result] = await connection.query(
            `INSERT INTO productos (
                empresa_id,
                sku,
                marca,
                modelo,
                descripcion,
                costo,
                precio_neto, 
                stock,
                stock_minimo,
                control_stock,
                categoria_id,
                proveedor_id,
                estado
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, 1)`, 
            [
                empresaId,
                sku,
                marca,
                modelo,
                descripcion,
                costo,
                precio_neto,
                stock_minimo || 0,
                control_stock ? 1 : 0,
                categoriaId,
                proveedorId
            ]
        );

        const nuevoProductoId = result.insertId;

        await logAction(connection, { 
            empresaId, 
            usuarioId: req.usuarioId || null, 
            accion: 'create', 
            entidad: 'productos', 
            entidadId: nuevoProductoId, 
            descripcion: `Producto creado: ${descripcion} (ID: ${nuevoProductoId})` 
        });

        await connection.commit();
        res.status(201).json({ mensaje: "Producto creado correctamente", id: nuevoProductoId });

    } catch (err) {
        await connection.rollback();
        console.error("Error al crear producto:", err.message);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
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
        const categoriaId = await obtenerOCrearCategoria(p.categoria, empresaId);
        const proveedorId = await obtenerOCrearProveedor(p.proveedor, empresaId);

        const sql = `
            UPDATE productos SET
                sku=?,
                descripcion=?,
                marca=?,
                modelo=?,
                categoria_id=?,
                proveedor=?,
                proveedor_id=?,
                costo=?,
                precio_neto=?,
                iva=?,
                control_stock=?,
                stock=?,
                stock_minimo=?
            WHERE empresa_id=? AND id=? AND estado = 1
        `;
        
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

exports.obtenerUnidadesDisponibles = async (req, res) => {
    try {
        const empresaId = req.empresaId;
        const { productoId } = req.params;

        const [unidades] = await db.query(
            `SELECT id, chasis, motor, color, anio, patente 
             FROM vehiculos_unidades 
             WHERE empresa_id = ? AND producto_id = ? AND estado_venta = 'Disponible' AND estado = 1
             ORDER BY fecha_ingreso ASC`,
            [empresaId, productoId]
        );

        res.json(unidades);
    } catch (err) {
        console.error("Error al obtener unidades disponibles:", err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.agregarUnidadVehiculo = async (req, res) => {
    try {
        const empresaId = req.empresaId;
        const { productoId, chasis, motor, color, anio, patente } = req.body;

        if (!productoId || !chasis?.trim() || !motor?.trim()) {
            return res.status(400).json({ error: "Producto, Chasis y Motor son obligatorios" });
        }

        const sql = `
            INSERT INTO vehiculos_unidades 
                (empresa_id, producto_id, chasis, motor, color, anio, patente, estado_venta, estado, fecha_ingreso) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Disponible', 1, NOW())
        `;

        const params = [
            empresaId,
            productoId,
            chasis.trim(),
            motor.trim(),
            color || 'S/C',
            anio || null,
            patente || null
        ];

        const [result] = await db.query(sql, params);
        
        res.status(201).json({ mensaje: "Unidad agregada correctamente", id: result.insertId });
    } catch (err) {
        console.error("Error al agregar unidad:", err.message);
        res.status(500).json({ error: err.message });
    }
};


exports.editarUnidadVehiculo = async (req, res) => {
    try {
        const { id } = req.params;
        const empresaId = req.empresaId;
        const { chasis, motor, color, anio, patente } = req.body;

        if (!chasis?.trim() || !motor?.trim()) {
            return res.status(400).json({ error: "Chasis y Motor son obligatorios" });
        }

        const sql = `
            UPDATE vehiculos_unidades SET
                chasis = ?,
                motor = ?,
                color = ?,
                anio = ?,
                patente = ?
            WHERE empresa_id = ? AND id = ? AND estado = 1
        `;

        const [result] = await db.query(sql, [
            chasis.trim(),
            motor.trim(),
            color || 'S/C',
            anio || null,
            patente || null,
            empresaId,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Unidad física no encontrada o dada de baja" });
        }

        res.json({ mensaje: "Unidad física actualizada correctamente" });
    } catch (err) {
        console.error("Error al editar la unidad de vehículo:", err.message);
        res.status(500).json({ error: err.message });
    }
};