// backend/controllers/productosController.js
const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, '../../db.json');

// Función auxiliar para leer la base de datos
const leerDB = () => {
    try {
        if (!fs.existsSync(dbPath)) {
            // Si no existe, creamos uno básico
            const inicial = { productos: [], clientes: [], ventas: [] };
            fs.writeFileSync(dbPath, JSON.stringify(inicial, null, 2));
            return inicial;
        }
        const contenido = fs.readFileSync(dbPath, 'utf-8');
        return JSON.parse(contenido || '{"productos":[]}'); // Si está vacío, evita el error
    } catch (error) {
        console.error("Error leyendo la base de datos:", error);
        return { productos: [] };
    }
};

const escribirDB = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));


exports.obtenerProductos = (req, res) => {
    try {
        const db = leerDB();
        res.json(db.productos);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al leer productos" });
    }
};

exports.crearProducto = (req, res) => {
    try {
        const db = leerDB();
        const nuevoProducto = {
            id: Date.now(), // ID único temporal
            ...req.body,
            stock: Number(req.body.stock),
            precio: Number(req.body.precio),
            costo: Number(req.body.costo)
        };
        db.productos.push(nuevoProducto);
        escribirDB(db);
        res.status(201).json(nuevoProducto);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al crear producto" });
    }
};

exports.editarProducto = (req, res) => {
    try {
        const db = leerDB();
        const { id } = req.params;
        const index = db.productos.findIndex(p => p.id == id);
        
        if (index !== -1) {
            db.productos[index] = { ...db.productos[index], ...req.body };
            escribirDB(db);
            res.json(db.productos[index]);
        } else {
            res.status(404).json({ mensaje: "Producto no encontrado" });
        }
    } catch (error) {
        res.status(500).json({ mensaje: "Error al editar" });
    }
};