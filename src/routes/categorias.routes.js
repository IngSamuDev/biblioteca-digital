const express = require('express');
const router = express.Router();
const CategoriasController = require('../controllers/categorias.controller');
const { verificarToken, soloStaff } = require('../middlewares/auth.middleware');

router.use(verificarToken, soloStaff);

router.get('/', CategoriasController.index);
router.get('/nuevo', CategoriasController.showNuevo);
router.post('/nuevo', CategoriasController.crear);
router.get('/:id/editar', CategoriasController.showEditar);
router.post('/:id/editar', CategoriasController.actualizar);
router.post('/:id/eliminar', CategoriasController.eliminar);

module.exports = router;