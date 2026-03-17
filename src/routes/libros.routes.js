const express = require('express');
const router = express.Router();
const LibrosController = require('../controllers/libros.controller');
const { verificarToken, soloStaff } = require('../middlewares/auth.middleware');
const V = require('../middlewares/validaciones.middleware');

router.use(verificarToken, soloStaff);

router.get('/', LibrosController.index);
router.get('/nuevo', LibrosController.showNuevo);
router.post('/nuevo', LibrosController.upload, V.crearLibro, LibrosController.crear);
router.get('/:id/editar', LibrosController.showEditar);
router.post('/:id/editar', LibrosController.upload, V.editarLibro, LibrosController.actualizar);
router.post('/:id/eliminar', LibrosController.eliminar);

module.exports = router;