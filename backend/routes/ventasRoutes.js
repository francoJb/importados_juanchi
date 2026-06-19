const express = require('express');
const router = express.Router();
const ventasController = require('../controllers/ventasController');
const verificarToken = require('../middlewares/authMiddleware');
const verificarTenant = require('../middlewares/tenantMiddleware');

// ==================================================
// 1. RUTAS ESTÁTICAS / FIJAS (SIEMPRE VAN PRIMERO)
// ==================================================
router.post('/', verificarToken, verificarTenant, ventasController.crearVenta);
router.get('/', verificarToken, verificarTenant, ventasController.obtenerVentas);
router.get('/cuotas-pendientes', verificarToken, verificarTenant, ventasController.obtenerCuotasPendientes);

// Moviendo esta ruta aquí arriba evitamos que Express la confunda con un ID de venta
router.get('/top-productos', verificarToken, verificarTenant, ventasController.obtenerTopProductosMasVendidos);


// ==================================================
// 2. RUTAS DINÁMICAS / CON PARÁMETROS (VAN AL FINAL)
// ==================================================
router.get('/:id', verificarToken, verificarTenant, ventasController.obtenerVenta);
router.get('/:id/detalle', verificarToken, verificarTenant, ventasController.obtenerDetalleVenta);
router.get('/:id/cuotas', verificarToken, verificarTenant, ventasController.obtenerCuotasVenta);
router.post('/:ventaId/pago', verificarToken, verificarTenant, ventasController.registrarPago);

// Anular venta (no borrar) — body: { motivo, revertStock?: boolean, revertCtaCte?: boolean }
router.post('/:id/anular', verificarToken, verificarTenant, ventasController.anularVenta);

module.exports = router;
