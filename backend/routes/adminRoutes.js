const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verificarToken, verificarPlatformAdmin } = require('../middlewares/adminMiddleware');

// EMPRESAS - CRUD completo
router.get('/companies', verificarToken, verificarPlatformAdmin, adminController.listCompanies);
router.post('/companies', verificarToken, verificarPlatformAdmin, adminController.createCompany);
router.get('/companies/:id', verificarToken, verificarPlatformAdmin, adminController.getCompany);
router.put('/companies/:id', verificarToken, verificarPlatformAdmin, adminController.updateCompany);
router.delete('/companies/:id', verificarToken, verificarPlatformAdmin, adminController.deleteCompany);

// USUARIOS - CRUD completo
router.get('/users', verificarToken, verificarPlatformAdmin, adminController.listUsers);
router.post('/users', verificarToken, verificarPlatformAdmin, adminController.createUser);
router.get('/users/:id', verificarToken, verificarPlatformAdmin, adminController.getUser);
router.put('/users/:id', verificarToken, verificarPlatformAdmin, adminController.updateUser);
router.delete('/users/:id', verificarToken, verificarPlatformAdmin, adminController.deleteUser);

// USUARIOS POR EMPRESA
router.get('/companies/:empresaId/users', verificarToken, verificarPlatformAdmin, adminController.getUsersByCompany);

module.exports = router;