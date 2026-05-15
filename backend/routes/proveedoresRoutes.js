// backend/routes/proveedoresRoutes.js
const express = require('express');
const router = express.Router();
const proveedoresController = require('../controllers/proveedoresController');
const verificarToken = require('../middlewares/authMiddleware');
const verificarTenant = require('../middlewares/tenantMiddleware');

// Definimos las rutas
router.get('/', verificarToken, verificarTenant, proveedoresController.obtenerProveedores);
router.post('/', verificarToken, verificarTenant, proveedoresController.crearProveedor);
router.put('/:id', verificarToken, verificarTenant, proveedoresController.actualizarProveedor);
router.delete('/:id', verificarToken, verificarTenant, proveedoresController.eliminarProveedor);

module.exports = router;