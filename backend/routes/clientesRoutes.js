// backend/routes/clientesRoutes.js
const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');
const verificarToken = require('../middlewares/authMiddleware');
const verificarTenant = require('../middlewares/tenantMiddleware');

router.get('/', verificarToken, verificarTenant, clientesController.obtenerClientes);
router.post('/', verificarToken, verificarTenant, clientesController.crearCliente);
router.put('/:id', verificarToken, verificarTenant, clientesController.editarCliente);
router.put('/:id/restaurar', verificarToken, verificarTenant, clientesController.restaurarCliente);
router.delete('/:id', verificarToken, verificarTenant, clientesController.eliminarCliente);
router.get('/:id/cuenta-corriente', verificarToken, verificarTenant, clientesController.obtenerCuentaCorriente);

module.exports = router;
