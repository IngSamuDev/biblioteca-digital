const pool = require('../config/db');

const AdminController = {

    async dashboard(req, res) {
        try {
            // Estadísticas generales
            const { rows: stats } = await pool.query(`
        SELECT
          (SELECT COUNT(*) FROM libros WHERE activo_libros = TRUE) AS total_libros,
          (SELECT COUNT(*) FROM usuarios WHERE estado_usuarios = TRUE) AS total_usuarios,
          (SELECT COUNT(*) FROM autores) AS total_autores,
          (SELECT COUNT(*) FROM categorias) AS total_categorias,
          (SELECT COUNT(*) FROM descargas) AS total_descargas,
          (SELECT COUNT(*) FROM visualizaciones) AS total_visualizaciones
      `);

            // Últimos 5 usuarios registrados
            const { rows: usuarios } = await pool.query(`
        SELECT u.id_usuarios, u.nombre_usuarios, u.email_usuarios,
               u.fecha_creacion_usuarios, u.estado_usuarios, r.nombre_roles
        FROM usuarios u
        JOIN roles r ON u.id_roles = r.id_roles
        ORDER BY u.fecha_creacion_usuarios DESC
        LIMIT 5
      `);

            // Libros más descargados
            const { rows: librosTop } = await pool.query(`
        SELECT l.id_libros, l.titulo_libros, COUNT(d.id_descargas) AS total_descargas
        FROM libros l
        LEFT JOIN descargas d ON l.id_libros = d.id_libros
        WHERE l.activo_libros = TRUE
        GROUP BY l.id_libros
        ORDER BY total_descargas DESC
        LIMIT 5
      `);

            // Últimas 5 actividades
            const { rows: actividades } = await pool.query(`
        SELECT a.accion_actividad_sistema, a.descripcion_actividad_sistema,
               a.fecha_actividad_sistema, u.nombre_usuarios
        FROM actividad_sistema a
        LEFT JOIN usuarios u ON a.id_usuarios = u.id_usuarios
        ORDER BY a.fecha_actividad_sistema DESC
        LIMIT 5
      `);

            res.render('admin/dashboard', {
                title: 'Panel de Administración',
                layout: 'main',
                stats: stats[0],
                usuarios,
                librosTop,
                actividades,
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
                actividades: [],
                usuario: req.usuario
            });
        }
    }

};

module.exports = AdminController;