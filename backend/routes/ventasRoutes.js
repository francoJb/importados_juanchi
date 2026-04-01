const express = require('express');
const router = express.Router();
const ventasController = require('../controllers/ventasController');

// Definir la ruta para crear venta
router.post('/', ventasController.crearVenta);

// (Opcional) Ruta para obtener el historial
// router.get('/', ventasController.obtenerVentas);

module.exports = router;