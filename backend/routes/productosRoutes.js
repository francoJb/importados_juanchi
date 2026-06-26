// backend/routes/productosRoutes.js
const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');
const verificarToken = require('../middlewares/authMiddleware');
const verificarTenant = require('../middlewares/tenantMiddleware');

// Definimos las rutas
router.get('/', verificarToken, verificarTenant, productosController.obtenerProductos);
router.get('/categorias', verificarToken, verificarTenant, productosController.obtenerCategorias);
router.post('/', verificarToken, verificarTenant, productosController.crearProducto);
router.put('/:id', verificarToken, verificarTenant, productosController.editarProducto);
router.put('/:id/restaurar', verificarToken, verificarTenant, productosController.restaurarProducto);
router.delete('/:id', verificarToken, verificarTenant, productosController.eliminarProducto);
router.get('/:productoId/unidades-disponibles', verificarToken, verificarTenant, productosController.obtenerUnidadesDisponibles);
router.post('/agregar-unidad', verificarToken, verificarTenant, productosController.agregarUnidadVehiculo);
router.put('/vehiculos/unidades/:id', verificarToken, verificarTenant, productosController.editarUnidadVehiculo);
router.post('/categorias/nueva', verificarToken, verificarTenant, productosController.crearCategoria);
module.exports = router;
