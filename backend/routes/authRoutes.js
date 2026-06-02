const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verificarToken = require('../middlewares/authMiddleware');

router.post('/login', authController.login);
router.get('/me', verificarToken, authController.me);
router.get('/empresa-actual', verificarToken, authController.getEmpresaActual);

module.exports = router;