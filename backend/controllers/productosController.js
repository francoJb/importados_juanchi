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
    const connection = await db.getConnection();
    const empresaId = req.empresaId;

    try {
        await connection.beginTransaction();

        // 1. Extraemos los campos del Frontend
        const {
            sku, descripcion, costo, precio_neto, stock, stock_minimo,
            control_stock, categoria_nombre, proveedor_nombre,
            vehiculo_chasis, vehiculo_motor, vehiculo_color, vehiculo_anio, vehiculo_patente
        } = req.body;

        if (!sku || !descripcion || costo === undefined || precio_neto === undefined) {
            return res.status(400).json({ error: "Faltan campos requeridos" });
        }

        // Obtener o crear categoría y proveedor usando la conexión de la transacción
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

        // 2. CORRECCIÓN AQUÍ: Quitamos 'vehiculo_patente' de la consulta de productos para evitar el error
        const [result] = await connection.query(
            `INSERT INTO productos (
                empresa_id, sku, descripcion, costo, precio_neto, stock, stock_minimo, 
                control_stock, categoria_id, proveedor_id, estado,
                vehiculo_chasis, vehiculo_motor, vehiculo_color, vehiculo_anio
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`,
            [
                empresaId, sku, descripcion, costo, precio_neto, stock || 0, stock_minimo || 0,
                control_stock ? 1 : 0, categoriaId, proveedorId,
                vehiculo_chasis || null, vehiculo_motor || null, vehiculo_color || null, 
                vehiculo_anio || null
            ]
        );

        const nuevoProductoId = result.insertId;

        // 3. Si los campos indican que es un vehículo, registramos su stock real (¡Acá SÍ va la patente!)
        const esVehiculo = (vehiculo_chasis && vehiculo_chasis.trim() !== "") || 
                           (vehiculo_motor && vehiculo_motor.trim() !== "");

        if (esVehiculo) {
            await connection.query(
                `INSERT INTO vehiculos_unidades 
                    (empresa_id, producto_id, chasis, motor, color, anio, patente, estado_venta, estado, fecha_ingreso) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'Disponible', 1, NOW())`,
                [
                    empresaId,
                    nuevoProductoId,
                    vehiculo_chasis,
                    vehiculo_motor,
                    vehiculo_color || 'S/C',
                    vehiculo_anio || null,
                    vehiculo_patente || null // Se guarda de forma impecable en la tabla de unidades
                ]
            );
        }

        // Registrar la acción en la auditoría
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
        // Obtener o crear categoría
        const categoriaId = await obtenerOCrearCategoria(p.categoria, empresaId);
        const proveedorId = await obtenerOCrearProveedor(p.proveedor, empresaId);

        const sql = `UPDATE productos SET sku=?, descripcion=?, marca=?, modelo=?, categoria_id=?, proveedor=?, proveedor_id=?, costo=?, precio_neto=?, iva=?, control_stock=?, stock=?, stock_minimo=?, vehiculo_tipo=?, vehiculo_anio=?, vehiculo_chasis=?, vehiculo_motor=?, vehiculo_color=? WHERE empresa_id=? AND id=? AND estado = 1`;
        
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
            p.vehiculo_tipo || null,
            p.vehiculo_anio || null,
            p.vehiculo_chasis || null,
            p.vehiculo_motor || null,
            p.vehiculo_color || null,
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
// Obtener las unidades específicas de un vehículo que estén en stock disponible
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