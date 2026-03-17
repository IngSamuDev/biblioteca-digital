const ReporteModel = require('../models/reporte.model');
const DescargaModel = require('../models/descarga.model');
const UsuarioModel = require('../models/usuario.model');

const ReportesController = {

  async index(req, res) {
    try {
      const stats = await ReporteModel.getStats();
      const librosDescargados = await ReporteModel.getLibrosMasDescargados(10);
      const librosVistos = await ReporteModel.getLibrosMasVistos(10);
      const usuariosActivos = await ReporteModel.getUsuariosMasActivos(10);
      const actividades = await ReporteModel.getActividadReciente(20);

      res.render('admin/reportes/index', {
        title: 'Reportes y Estadísticas',
        layout: 'main',
        stats,
        librosDescargados,
        librosVistos,
        usuariosActivos,
        actividades,
        usuario: req.usuario
      });
    } catch (error) {
      console.error('Error en reportes:', error.message);
      res.redirect('/admin/dashboard');
    }
  },

  async historialUsuario(req, res) {
    try {
      const { id } = req.params;
      const usuarioInfo = await UsuarioModel.findById(id);
      if (!usuarioInfo) return res.redirect('/admin/reportes');

      const descargas = await DescargaModel.getHistorialUsuario(id);
      const visualizaciones = await DescargaModel.getVisualizacionesUsuario(id);

      res.render('admin/reportes/historial', {
        title: `Historial de ${usuarioInfo.nombre_usuarios}`,
        layout: 'main',
        usuarioVer: usuarioInfo,
        descargas,
        visualizaciones,
        usuario: req.usuario
      });
    } catch (error) {
      console.error('Error en historial:', error.message);
      res.redirect('/admin/reportes');
    }
  }

};

module.exports = ReportesController;