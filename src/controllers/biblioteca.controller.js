const pool = require('../config/db');

const BibliotecaController = {

    async dashboard(req, res) {
        try {
            // Estadísticas para el bibliotecario
            const { rows: stats } = await pool.query(`
        SELECT
          (SELECT COUNT(*) FROM libros WHERE activo_libros = TRUE) AS total_libros,
          (SELECT COUNT(*) FROM autores) AS total_autores,
          (SELECT COUNT(*) FROM categorias) AS total_categorias,
          (SELECT COUNT(*) FROM descargas) AS total_descargas,
          (SELECT COUNT(*) FROM visualizaciones) AS total_visualizaciones
      `);

            // Últimos libros subidos
            const { rows: librosRecientes } = await pool.query(`
        SELECT l.id_libros, l.titulo_libros, l.portada_url_libros,
          l.fecha_subida_libros, u.nombre_usuarios AS subido_por,
          STRING_AGG(DISTINCT a.nombre_autores, ', ') AS autores,
          STRING_AGG(DISTINCT c.nombre_categorias, ', ') AS categorias
        FROM libros l
        LEFT JOIN usuarios u ON l.id_usuarios = u.id_usuarios
        LEFT JOIN libro_autor la ON l.id_libros = la.id_libros
        LEFT JOIN autores a ON la.id_autores = a.id_autores
        LEFT JOIN libro_categoria lc ON l.id_libros = lc.id_libros
        LEFT JOIN categorias c ON lc.id_categorias = c.id_categorias
        WHERE l.activo_libros = TRUE
        GROUP BY l.id_libros, u.nombre_usuarios
        ORDER BY l.fecha_subida_libros DESC
        LIMIT 5
      `);

            // Libros más descargados
            const { rows: librosTop } = await pool.query(`
        SELECT l.id_libros, l.titulo_libros,
          COUNT(d.id_descargas) AS total_descargas
        FROM libros l
        LEFT JOIN descargas d ON l.id_libros = d.id_libros
        WHERE l.activo_libros = TRUE
        GROUP BY l.id_libros
        ORDER BY total_descargas DESC
        LIMIT 5
      `);

            res.render('biblioteca/dashboard', {
                title: 'Panel de Bibliotecario',
                layout: 'main',
                stats: stats[0],
                librosRecientes,
                librosTop,
                usuario: req.usuario
            });

        } catch (error) {
            console.error('Error en dashboard biblioteca:', error.message);
            res.render('biblioteca/dashboard', {
                title: 'Panel de Bibliotecario',
                layout: 'main',
                stats: {},
                librosRecientes: [],
                librosTop: [],
                usuario: req.usuario
            });
        }
    }

};

module.exports = BibliotecaController;