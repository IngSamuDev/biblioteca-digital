const express = require('express');
const router = express.Router();
const BibliotecaController = require('../controllers/biblioteca.controller');
const { verificarToken, soloStaff } = require('../middlewares/auth.middleware');

router.use(verificarToken, soloStaff);

// GET /biblioteca/dashboard
router.get('/dashboard', BibliotecaController.dashboard);

module.exports = router;