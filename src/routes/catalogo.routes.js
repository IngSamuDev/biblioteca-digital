const express = require('express');
const router = express.Router();
const CatalogoController = require('../controllers/catalogo.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

router.use(verificarToken);

router.get('/', CatalogoController.index);
router.get('/:id/leer', CatalogoController.verPDF);
router.get('/:id/descargar', CatalogoController.descargar);
router.get('/:id', CatalogoController.detalle);

module.exports = router;