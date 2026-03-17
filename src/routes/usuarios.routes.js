const express = require('express');
const router = express.Router();
const UsuariosController = require('../controllers/usuarios.controller');
const { verificarToken, soloAdmin } = require('../middlewares/auth.middleware');
const V = require('../middlewares/validaciones.middleware');

router.use(verificarToken, soloAdmin);

router.get('/', UsuariosController.index);
router.get('/nuevo', UsuariosController.showNuevo);
router.post('/nuevo', V.crearUsuario, UsuariosController.crear);
router.get('/:id/editar', UsuariosController.showEditar);
router.post('/:id/editar', V.editarUsuario, UsuariosController.actualizar);
router.post('/:id/desactivar', UsuariosController.desactivar);
router.post('/:id/eliminar', UsuariosController.eliminar);

module.exports = router;