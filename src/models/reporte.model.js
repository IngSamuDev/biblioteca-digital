const pool = require('../config/db');

const ReporteModel = {

    async getStats() {
        const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM libros WHERE activo_libros = TRUE) AS total_libros,
        (SELECT COUNT(*) FROM usuarios WHERE estado_usuarios = TRUE) AS total_usuarios,
        (SELECT COUNT(*) FROM autores) AS total_autores,
        (SELECT COUNT(*) FROM categorias) AS total_categorias,
        (SELECT COUNT(*) FROM descargas) AS total_descargas,
        (SELECT COUNT(*) FROM visualizaciones) AS total_visualizaciones
    `);
        return rows[0];
    },

    async getLibrosMasDescargados(limite = 10) {
        const { rows } = await pool.query(`
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
      LIMIT $1
    `, [limite]);
        return rows;
    },

    async getLibrosMasVistos(limite = 10) {
        const { rows } = await pool.query(`
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
      LIMIT $1
    `, [limite]);
        return rows;
    },

    async getUsuariosMasActivos(limite = 10) {
        const { rows } = await pool.query(`
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
      LIMIT $1
    `, [limite]);
        return rows;
    },

    async getActividadReciente(limite = 20) {
        const { rows } = await pool.query(`
      SELECT a.accion_actividad_sistema, a.descripcion_actividad_sistema,
        a.fecha_actividad_sistema, u.nombre_usuarios
      FROM actividad_sistema a
      LEFT JOIN usuarios u ON a.id_usuarios = u.id_usuarios
      ORDER BY a.fecha_actividad_sistema DESC
      LIMIT $1
    `, [limite]);
        return rows;
    },

    async registrarActividad({ userId, accion, descripcion }) {
        await pool.query(`
      INSERT INTO actividad_sistema (id_usuarios, accion_actividad_sistema, descripcion_actividad_sistema)
      VALUES ($1, $2, $3)
    `, [userId, accion, descripcion]);
    }

};

module.exports = ReporteModel;