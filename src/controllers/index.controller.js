const pool = require('../config/db');

const IndexController = {

    async index(req, res) {
        try {
            // Obtener libros recientes con sus autores y categorías
            const { rows: libros } = await pool.query(`
        SELECT 
          l.id_libros,
          l.titulo_libros,
          l.descripcion_libros,
          l.anio_publicacion_libros,
          l.portada_url_libros,
          l.fecha_subida_libros,
          STRING_AGG(DISTINCT a.nombre_autores, ', ') AS autores,
          STRING_AGG(DISTINCT c.nombre_categorias, ', ') AS categorias
        FROM libros l
        LEFT JOIN libro_autor la ON l.id_libros = la.id_libros
        LEFT JOIN autores a ON la.id_autores = a.id_autores
        LEFT JOIN libro_categoria lc ON l.id_libros = lc.id_libros
        LEFT JOIN categorias c ON lc.id_categorias = c.id_categorias
        WHERE l.activo_libros = TRUE
        GROUP BY l.id_libros
        ORDER BY l.fecha_subida_libros DESC
        LIMIT 8
      `);

            // Estadísticas generales
            const { rows: stats } = await pool.query(`
        SELECT
          (SELECT COUNT(*) FROM libros WHERE activo_libros = TRUE) AS total_libros,
          (SELECT COUNT(*) FROM usuarios WHERE estado_usuarios = TRUE) AS total_usuarios,
          (SELECT COUNT(*) FROM autores) AS total_autores,
          (SELECT COUNT(*) FROM categorias) AS total_categorias
      `);

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
                stats: stats[0],
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