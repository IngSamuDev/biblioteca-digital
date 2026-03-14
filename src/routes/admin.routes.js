const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const { verificarToken, soloAdmin } = require('../middlewares/auth.middleware');

// Solo el dashboard requiere soloAdmin
router.get('/dashboard', verificarToken, soloAdmin, AdminController.dashboard);

module.exports = router;