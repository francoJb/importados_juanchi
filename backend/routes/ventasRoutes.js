const express = require('express');
const router = express.Router();
const ventasController = require('../controllers/ventasController');
const verificarToken = require('../middlewares/authMiddleware');
const verificarTenant = require('../middlewares/tenantMiddleware');

// Definir la ruta para crear venta
router.post('/', verificarToken, verificarTenant, ventasController.crearVenta);
router.get('/', verificarToken, verificarTenant, ventasController.obtenerVentas);
router.get('/cuotas-pendientes', verificarToken, verificarTenant, ventasController.obtenerCuotasPendientes);
router.get('/:id', verificarToken, verificarTenant, ventasController.obtenerVenta);
router.get('/:id/detalle', verificarToken, verificarTenant, ventasController.obtenerDetalleVenta);
router.get('/:id/cuotas', verificarToken, verificarTenant, ventasController.obtenerCuotasVenta);
router.post('/:ventaId/pago', verificarToken, verificarTenant, ventasController.registrarPago);
router.put('/:id/restaurar', verificarToken, verificarTenant, ventasController.restaurarVenta);
router.delete('/:id', verificarToken, verificarTenant, ventasController.eliminarVenta);


module.exports = router;
