const db = require('../database/database');
const { formatearFechaHoraArgentina, ahoraArgentinaDate } = require('../utils/time');
const { logAction } = require('../utils/audit');

exports.crearCategoria = async (req, res) => {
    try {
        const empresaId = req.empresaId; // Identificamos la empresa del usuario
        const { nombre } = req.body; // Recibimos el nombre que el usuario escribió en el modal

        if (!nombre?.trim()) {
            return res.status(400).json({ error: "El nombre de la categoría es obligatorio" });
        }

        const nombreNormalizado = nombre.trim().toUpperCase();

        // 1. Verificamos si ya existe una categoría activa con ese mismo nombre para esta empresa
        const [existing] = await db.query(
            "SELECT id FROM categorias WHERE empresa_id = ? AND nombre = ? AND estado = 1", 
            [empresaId, nombreNormalizado]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: "Esta categoría ya existe en tu sistema" });
        }

        // 2. Si no existe, la insertamos en la base de datos
        const [result] = await db.query(
            "INSERT INTO categorias (empresa_id, nombre, estado) VALUES (?, ?, 1)", 
            [empresaId, nombreNormalizado]
        );

        // Respondemos con éxito y devolvemos el ID de la nueva categoría
        res.status(201).json({ 
            mensaje: "Categoría creada correctamente", 
            id: result.insertId 
        });

    } catch (err) {
        console.error("Error al crear categoría:", err.message);
        res.status(500).json({ error: err.message });
    }
};


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
            categoria_id,
            proveedor_nombre
        } = req.body;

        if (!sku || !descripcion || costo === undefined || precio_neto === undefined) {
            return res.status(400).json({ error: "Faltan campos requeridos" });
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
                categoria_id || null,
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
        const categoriaId = p.categoria_id || null;

        let proveedorId = null;
        if (p.proveedor_nombre?.trim() || p.proveedor?.trim()) {
            const nombreProveedor = (p.proveedor_nombre || p.proveedor).trim().toUpperCase();

            const [existingProv] = await db.query(
                "SELECT id FROM proveedores WHERE empresa_id = ? AND nombre = ? AND estado = 1",
                [empresaId, nombreProveedor]
            );

            if (existingProv.length > 0) {
                proveedorId = existingProv[0].id;
            } else {
                const [resultProv] = await db.query(
                    "INSERT INTO proveedores (empresa_id, nombre, estado) VALUES (?, ?, 1)",
                    [empresaId, nombreProveedor]
                );
                proveedorId = resultProv.insertId;
            }
        }

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
    const connection = await db.getConnection();

    try {
        const empresaId = req.empresaId;
        const { productoId, chasis, motor, color, anio, patente, tipo } = req.body;

        if (!productoId || !chasis?.trim() || !motor?.trim()) {
            return res.status(400).json({ error: "Producto, Chasis y Motor son obligatorios" });
        }
        
        await connection.beginTransaction();
        const sql = `
            INSERT INTO vehiculos_unidades 
                (empresa_id, producto_id, tipo, chasis, motor, color, anio, patente, estado_venta, estado, fecha_ingreso) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Disponible', 1, NOW())
        `;

        const params = [
            empresaId,
            productoId,
            tipo || null,
            chasis.trim(),
            motor.trim(),
            color || 'S/C',
            anio || null,
            patente || null
        ];

        const [result] = await connection.query(sql, params);
        await connection.commit();
        res.status(201).json({ mensaje: "Unidad agregada correctamente", id: result.insertId });
    } catch (err) {
        await connection.rollback();
        console.error("Error al agregar unidad:", err.message);
        res.status(500).json({ error: err.message });
    } finally {
        await connection.release();
    }
};


exports.editarUnidadVehiculo = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const { id } = req.params;
        const empresaId = req.empresaId;
        const { tipo, chasis, motor, color, anio, patente } = req.body;

        if (!chasis?.trim() || !motor?.trim()) {
            return res.status(400).json({ error: "Chasis y Motor son obligatorios" });
        }

        await connection.beginTransaction();
        const sql = `
            UPDATE vehiculos_unidades SET
                tipo = ?,
                chasis = ?,
                motor = ?,
                color = ?,
                anio = ?,
                patente = ?
            WHERE empresa_id = ? AND id = ? AND estado = 1
        `;

        const [result] = await connection.query(sql, [
            tipo || null,
            chasis.trim(),
            motor.trim(),
            color || 'S/C',
            anio || null,
            patente || null,
            empresaId,
            id
        ]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Unidad física no encontrada o dada de baja" });
        }

        await connection.commit();
        res.json({ mensaje: "Unidad física actualizada correctamente" });
    } catch (err) {
        await connection.rollback();
        console.error("Error al editar la unidad de vehículo:", err.message);
        res.status(500).json({ error: err.message });
    } finally {
        await connection.release();
    }
};