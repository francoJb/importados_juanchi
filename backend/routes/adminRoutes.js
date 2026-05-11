const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verificarToken, verificarAdmin } = require('../middlewares/adminMiddleware');

// Rutas de administración de empresas
router.get('/companies', verificarToken, verificarAdmin, adminController.listCompanies);
router.post('/companies', verificarToken, verificarAdmin, adminController.createCompany);

// Rutas de administración de usuarios
router.get('/users', verificarToken, verificarAdmin, adminController.listUsers);
router.post('/users', verificarToken, verificarAdmin, adminController.createUser);

module.exports = router;
