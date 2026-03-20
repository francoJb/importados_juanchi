// backend/routes/productosRoutes.js
const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');

// Definimos las rutas
router.get('/', productosController.obtenerProductos);
router.post('/', productosController.crearProducto);
router.put('/:id', productosController.editarProducto);

module.exports = router;