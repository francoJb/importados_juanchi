const express = require('express');
const router = express.Router();
const ventasController = require('../controllers/ventasController');
const verificarToken = require('../middlewares/authMiddleware');
const verificarTenant = require('../middlewares/tenantMiddleware');

// Definir la ruta para crear venta
router.post('/', verificarToken, verificarTenant, ventasController.crearVenta);
router.get('/', verificarToken, verificarTenant, ventasController.obtenerVentas);
router.get('/:id', verificarToken, verificarTenant, ventasController.obtenerVenta);
router.get('/:id/detalle', verificarToken, verificarTenant, ventasController.obtenerDetalleVenta);
router.post('/:ventaId/pago', verificarToken, verificarTenant, ventasController.registrarPago);
router.delete('/:id', verificarToken, verificarTenant, ventasController.eliminarVenta);


module.exports = router;