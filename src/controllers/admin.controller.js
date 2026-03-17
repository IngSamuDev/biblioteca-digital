const ReporteModel = require('../models/reporte.model');
const LibroModel = require('../models/libro.model');
const UsuarioModel = require('../models/usuario.model');

const AdminController = {

    async dashboard(req, res) {
        try {
            const stats = await ReporteModel.getStats();
            const usuarios = await UsuarioModel.getUltimos(5);
            const librosTop = await LibroModel.getMasDescargados(5);

            res.render('admin/dashboard', {
                title: 'Panel de Administración',
                layout: 'main',
                stats,
                usuarios,
                librosTop,
                usuario: req.usuario
            });
        } catch (error) {
            console.error('Error en dashboard admin:', error.message);
            res.render('admin/dashboard', {
                title: 'Panel de Administración',
                layout: 'main',
                stats: {},
                usuarios: [],
                librosTop: [],
                usuario: req.usuario
            });
        }
    }

};

module.exports = AdminController;