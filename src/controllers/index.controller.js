const LibroModel = require('../models/libro.model');
const ReporteModel = require('../models/reporte.model');

const IndexController = {

    async index(req, res) {
        try {
            const libros = await LibroModel.getRecientes(36); // 6 filas x 6 columnas
            const stats = await ReporteModel.getStats();

            res.render('index', {
                title: 'Inicio',
                libros: libros.map(l => ({
                    ...l,
                    portada: l.portada_url_libros
                        ? `/uploads/portadas/${l.portada_url_libros}`
                        : null,
                    descripcion_corta: l.descripcion_libros
                        ? l.descripcion_libros.substring(0, 100) + '...'
                        : 'Sin descripción disponible'
                })),
                stats,
                estaLogueado: res.locals.estaLogueado
            });
        } catch (error) {
            console.error('Error en index:', error.message);
            res.render('index', {
                title: 'Inicio',
                libros: [],
                stats: { total_libros: 0, total_usuarios: 0, total_autores: 0, total_categorias: 0 }
            });
        }
    }

};

module.exports = IndexController;