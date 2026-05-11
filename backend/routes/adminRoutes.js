const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verificarToken, verificarAdmin } = require('../middlewares/adminMiddleware');

router.get('/companies', verificarToken, verificarAdmin, adminController.listCompanies);
router.post('/companies', verificarToken, verificarAdmin, adminController.createCompany);
router.get('/users', verificarToken, verificarAdmin, adminController.listUsers);
router.post('/users', verificarToken, verificarAdmin, adminController.createUser);

module.exports = router;
