const express = require('express');
const router = express.Router();
const ventasController = require('../controllers/ventasController');
const verificarToken = require('../middlewares/authMiddleware');

// Definir la ruta para crear venta
router.post('/', verificarToken, ventasController.crearVenta);
router.get('/', verificarToken, ventasController.obtenerVentas);
router.get('/:id', verificarToken, ventasController.obtenerVenta);
router.get('/:id/detalle', verificarToken, ventasController.obtenerDetalleVenta);
router.post('/:ventaId/pago', verificarToken, ventasController.registrarPago);
router.delete('/:id', verificarToken, ventasController.eliminarVenta);


module.exports = router;