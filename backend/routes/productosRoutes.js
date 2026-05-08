// backend/routes/productosRoutes.js
const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');
const verificarToken = require('../middlewares/authMiddleware');

// Definimos las rutas
router.get('/', verificarToken, productosController.obtenerProductos);
router.post('/', verificarToken, productosController.crearProducto);
router.put('/:id', verificarToken, productosController.editarProducto);
router.delete('/:id', verificarToken, productosController.eliminarProducto);


module.exports = router;