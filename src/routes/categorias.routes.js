const express = require('express');
const router = express.Router();
const CategoriasController = require('../controllers/categorias.controller');
const { verificarToken, soloStaff } = require('../middlewares/auth.middleware');
const V = require('../middlewares/validaciones.middleware');

router.use(verificarToken, soloStaff);

router.get('/', CategoriasController.index);
router.get('/nuevo', CategoriasController.showNuevo);
router.post('/nuevo', V.categoria, CategoriasController.crear);
router.get('/:id/editar', CategoriasController.showEditar);
router.post('/:id/editar', V.categoria, CategoriasController.actualizar);
router.post('/:id/eliminar', CategoriasController.eliminar);

module.exports = router;