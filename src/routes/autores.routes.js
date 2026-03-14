const express = require('express');
const router = express.Router();
const AutoresController = require('../controllers/autores.controller');
const { verificarToken, soloStaff } = require('../middlewares/auth.middleware');

router.use(verificarToken, soloStaff);

router.get('/', AutoresController.index);
router.get('/nuevo', AutoresController.showNuevo);
router.post('/nuevo', AutoresController.crear);
router.get('/:id/editar', AutoresController.showEditar);
router.post('/:id/editar', AutoresController.actualizar);
router.post('/:id/eliminar', AutoresController.eliminar);

module.exports = router;