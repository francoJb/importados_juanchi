// backend/routes/clientesRoutes.js
const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');

// Definimos las rutas
router.get('/', clientesController.obtenerClientes);
router.post('/', clientesController.crearCliente);
router.put('/:id', clientesController.editarCliente);
router.delete('/:id', clientesController.eliminarCliente);
router.get('/:id/cuenta-corriente', clientesController.obtenerCuentaCorriente);


module.exports = router;