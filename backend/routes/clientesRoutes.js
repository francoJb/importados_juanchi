// backend/routes/clientesRoutes.js
const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');
const verificarToken = require('../middlewares/authMiddleware');

// Definimos las rutas
router.get('/', verificarToken, clientesController.obtenerClientes);
router.post('/', verificarToken, clientesController.crearCliente);
router.put('/:id', verificarToken, clientesController.editarCliente);
router.delete('/:id', verificarToken, clientesController.eliminarCliente);
router.get('/:id/cuenta-corriente', verificarToken, clientesController.obtenerCuentaCorriente);


module.exports = router;