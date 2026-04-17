const express = require('express');
const router = express.Router();
const ventasController = require('../controllers/ventasController');

// Definir la ruta para crear venta
router.post('/', ventasController.crearVenta);
router.get('/', ventasController.obtenerVentas);
router.get('/:id', ventasController.obtenerVenta);
router.get('/:id/detalle', ventasController.obtenerDetalleVenta);
router.post('/:ventaId/pago', ventasController.registrarPago);
router.delete('/:id', ventasController.eliminarVenta);

// (Opcional) Ruta para obtener el historial
// router.get('/', ventasController.obtenerVentas);

module.exports = router;