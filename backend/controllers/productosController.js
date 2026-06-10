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
    
    // Obtenemos una conexión del pool para garantizar que si falla la unidad hija, no se cree el producto base
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const checkSql = "SELECT id FROM productos WHERE empresa_id = ? AND sku = ? AND estado = 1";
        const [existing] = await connection.query(checkSql, [empresaId, p.sku.trim()]);
        
        if (existing.length > 0) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ error: `El SKU "${p.sku}" ya esta registrado en otro producto` });
        }

        // Validaciones preventivas de unicidad de Motor/Chasis si se están enviando directamente en la carga inicial
        const tieneMotor = p.vehiculo_motor && p.vehiculo_motor.trim() !== "";
        const tieneChasis = p.vehiculo_chasis && p.vehiculo_chasis.trim() !== "";

        if (tieneMotor || tieneChasis) {
            // Verificar si ese chasis o motor ya existen en las unidades disponibles del sistema
            const [checkUnidad] = await connection.query(
                "SELECT id FROM vehiculos_unidades WHERE empresa_id = ? AND (chasis = ? OR motor = ?) AND estado_venta != 'Vendido' AND estado = 1",
                [empresaId, p.vehiculo_chasis?.trim() || '---', p.vehiculo_motor?.trim() || '---']
            );
            if (checkUnidad.length > 0) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ error: "El número de chasis o motor ingresado ya pertenece a un vehículo activo en stock." });
            }
        }

        const categoriaId = await obtenerOCrearCategoria(p.categoria, empresaId);
        const proveedorId = await obtenerOCrearProveedor(p.proveedor, empresaId);

        // Mantenemos la estructura de tu INSERT para no alterar las columnas existentes de tu tabla
        const sql = `INSERT INTO productos (empresa_id, sku, descripcion, marca, modelo, categoria_id, proveedor, proveedor_id, costo, precio_neto, iva, control_stock, stock, stock_minimo, estado, vehiculo_tipo, vehiculo_anio, vehiculo_chasis, vehiculo_motor, vehiculo_color) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`;
        
        const params = [
            empresaId,
            p.sku.trim(),
            p.descripcion,
            p.marca,
            p.modelo,
            categoriaId,
            p.proveedor,
            p.proveedor_id || proveedorId,
            p.costo || 0,
            p.precio_neto || 0,
            p.iva || 21,
            p.control_stock ? 1 : 0,
            p.stock || 0,
            p.stock_minimo || 0,
            p.vehiculo_tipo || null,
            p.vehiculo_anio || null,
            p.vehiculo_chasis || null,
            p.vehiculo_motor || null,
            p.vehiculo_color || null
        ];

        const [result] = await connection.query(sql, params);
        const productoId = result.insertId;

        // SEEDING DE UNIDAD ÚNICA: Si tiene motor o chasis, creamos su registro en la tabla de unidades tracking
        if (tieneMotor || tieneChasis) {
            await connection.query(
                `INSERT INTO vehiculos_unidades (empresa_id, producto_id, chasis, motor, color, anio, estado_venta)
                 VALUES (?, ?, ?, ?, ?, ?, 'Disponible')`,
                [
                    empresaId,
                    productoId,
                    p.vehiculo_chasis?.trim() || '',
                    p.vehiculo_motor?.trim() || '',
                    p.vehiculo_color || p.color || null,
                    p.vehiculo_anio || null
                ]
            );
        }

        await connection.commit();
        connection.release();

        res.status(201).json({ 
            id: productoId, 
            ...p, 
            categoria_id: categoriaId,
            control_stock: p.control_stock ? 1 : 0 
        });

    } catch (err) {
        await connection.rollback();
        connection.release();
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