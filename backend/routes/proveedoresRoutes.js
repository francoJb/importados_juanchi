// backend/routes/proveedoresRoutes.js
const express = require('express');
const router = express.Router();
const proveedoresController = require('../controllers/proveedoresController');
const verificarToken = require('../middlewares/authMiddleware');

// Definimos las rutas
router.get('/', verificarToken, proveedoresController.obtenerProveedores);
router.post('/', verificarToken, proveedoresController.crearProveedor);
router.put('/:id', verificarToken, proveedoresController.actualizarProveedor);
router.delete('/:id', verificarToken, proveedoresController.eliminarProveedor);

module.exports = router;