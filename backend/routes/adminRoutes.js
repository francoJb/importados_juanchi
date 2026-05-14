const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verificarToken, verificarAdmin } = require('../middlewares/adminMiddleware');

// EMPRESAS - CRUD completo
router.get('/companies', verificarToken, verificarAdmin, adminController.listCompanies);
router.post('/companies', verificarToken, verificarAdmin, adminController.createCompany);
router.get('/companies/:id', verificarToken, verificarAdmin, adminController.getCompany);
router.put('/companies/:id', verificarToken, verificarAdmin, adminController.updateCompany);
router.delete('/companies/:id', verificarToken, verificarAdmin, adminController.deleteCompany);

// USUARIOS - CRUD completo
router.get('/users', verificarToken, verificarAdmin, adminController.listUsers);
router.post('/users', verificarToken, verificarAdmin, adminController.createUser);
router.get('/users/:id', verificarToken, verificarAdmin, adminController.getUser);
router.put('/users/:id', verificarToken, verificarAdmin, adminController.updateUser);
router.delete('/users/:id', verificarToken, verificarAdmin, adminController.deleteUser);

// USUARIOS POR EMPRESA
router.get('/companies/:empresaId/users', verificarToken, verificarAdmin, adminController.getUsersByCompany);

module.exports = router;