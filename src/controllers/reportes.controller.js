const pool = require('../config/db');

const ReportesController = {

    async index(req, res) {
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

            // Libros más descargados
            const { rows: librosDescargados } = await pool.query(`
        SELECT l.id_libros, l.titulo_libros, l.portada_url_libros,
          COUNT(d.id_descargas) AS total_descargas,
          STRING_AGG(DISTINCT a.nombre_autores, ', ') AS autores
        FROM libros l
        LEFT JOIN descargas d ON l.id_libros = d.id_libros
        LEFT JOIN libro_autor la ON l.id_libros = la.id_libros
        LEFT JOIN autores a ON la.id_autores = a.id_autores
        WHERE l.activo_libros = TRUE
        GROUP BY l.id_libros
        ORDER BY total_descargas DESC
        LIMIT 10
      `);

            // Libros más vistos
            const { rows: librosVistos } = await pool.query(`
        SELECT l.id_libros, l.titulo_libros,
          COUNT(v.id_visualizaciones) AS total_visualizaciones,
          STRING_AGG(DISTINCT a.nombre_autores, ', ') AS autores
        FROM libros l
        LEFT JOIN visualizaciones v ON l.id_libros = v.id_libros
        LEFT JOIN libro_autor la ON l.id_libros = la.id_libros
        LEFT JOIN autores a ON la.id_autores = a.id_autores
        WHERE l.activo_libros = TRUE
        GROUP BY l.id_libros
        ORDER BY total_visualizaciones DESC
        LIMIT 10
      `);

            // Usuarios más activos
            const { rows: usuariosActivos } = await pool.query(`
        SELECT u.id_usuarios, u.nombre_usuarios, u.email_usuarios,
          r.nombre_roles,
          COUNT(DISTINCT d.id_descargas) AS total_descargas,
          COUNT(DISTINCT v.id_visualizaciones) AS total_visualizaciones
        FROM usuarios u
        JOIN roles r ON u.id_roles = r.id_roles
        LEFT JOIN descargas d ON u.id_usuarios = d.id_usuarios
        LEFT JOIN visualizaciones v ON u.id_usuarios = v.id_usuarios
        WHERE u.estado_usuarios = TRUE
        GROUP BY u.id_usuarios, r.nombre_roles
        ORDER BY total_descargas DESC
        LIMIT 10
      `);

            // Actividad reciente del sistema
            const { rows: actividades } = await pool.query(`
        SELECT a.accion_actividad_sistema, a.descripcion_actividad_sistema,
          a.fecha_actividad_sistema, u.nombre_usuarios
        FROM actividad_sistema a
        LEFT JOIN usuarios u ON a.id_usuarios = u.id_usuarios
        ORDER BY a.fecha_actividad_sistema DESC
        LIMIT 20
      `);

            // Descargas por día (últimos 7 días)
            const { rows: descargasPorDia } = await pool.query(`
        SELECT DATE(fecha_descarga_descargas) AS dia,
          COUNT(*) AS total
        FROM descargas
        WHERE fecha_descarga_descargas >= NOW() - INTERVAL '7 days'
        GROUP BY dia
        ORDER BY dia ASC
      `);

            res.render('admin/reportes/index', {
                title: 'Reportes y Estadísticas',
                layout: 'main',
                stats: stats[0],
                librosDescargados,
                librosVistos,
                usuariosActivos,
                actividades,
                descargasPorDia,
                usuario: req.usuario
            });

        } catch (error) {
            console.error('Error en reportes:', error.message);
            res.redirect('/admin/dashboard');
        }
    },

    // Historial de descargas por usuario (RF37)
    async historialUsuario(req, res) {
        try {
            const { id } = req.params;

            const { rows: usuarioInfo } = await pool.query(
                `SELECT nombre_usuarios, email_usuarios FROM usuarios WHERE id_usuarios = $1`, [id]
            );
            if (usuarioInfo.length === 0) return res.redirect('/admin/reportes');

            const { rows: descargas } = await pool.query(`
        SELECT l.titulo_libros, l.portada_url_libros,
          d.fecha_descarga_descargas,
          STRING_AGG(DISTINCT a.nombre_autores, ', ') AS autores
        FROM descargas d
        JOIN libros l ON d.id_libros = l.id_libros
        LEFT JOIN libro_autor la ON l.id_libros = la.id_libros
        LEFT JOIN autores a ON la.id_autores = a.id_autores
        WHERE d.id_usuarios = $1
        GROUP BY l.id_libros, d.fecha_descarga_descargas
        ORDER BY d.fecha_descarga_descargas DESC
      `, [id]);

            const { rows: visualizaciones } = await pool.query(`
        SELECT l.titulo_libros, v.fecha_visualizacion_visualizaciones,
          STRING_AGG(DISTINCT a.nombre_autores, ', ') AS autores
        FROM visualizaciones v
        JOIN libros l ON v.id_libros = l.id_libros
        LEFT JOIN libro_autor la ON l.id_libros = la.id_libros
        LEFT JOIN autores a ON la.id_autores = a.id_autores
        WHERE v.id_usuarios = $1
        GROUP BY l.id_libros, v.fecha_visualizacion_visualizaciones
        ORDER BY v.fecha_visualizacion_visualizaciones DESC
      `, [id]);

            res.render('admin/reportes/historial', {
                title: `Historial de ${usuarioInfo[0].nombre_usuarios}`,
                layout: 'main',
                usuarioVer: usuarioInfo[0],
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