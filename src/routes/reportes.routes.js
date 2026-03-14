const express = require('express');
const router = express.Router();
const ReportesController = require('../controllers/reportes.controller');
const { verificarToken, soloAdmin } = require('../middlewares/auth.middleware');

router.use(verificarToken, soloAdmin);

router.get('/', ReportesController.index);
router.get('/historial/:id', ReportesController.historialUsuario);

module.exports = router;