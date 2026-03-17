const pool = require('../config/db');

const DescargaModel = {

    async registrar({ userId, libroId }) {
        await pool.query(
            `INSERT INTO descargas (id_usuarios, id_libros) VALUES ($1, $2)`,
            [userId, libroId]
        );
    },

    async registrarVisualizacion({ userId, libroId }) {
        await pool.query(
            `INSERT INTO visualizaciones (id_usuarios, id_libros) VALUES ($1, $2)`,
            [userId, libroId]
        );
    },

    async getHistorialUsuario(userId) {
        const { rows } = await pool.query(`
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
    `, [userId]);
        return rows;
    },

    async getVisualizacionesUsuario(userId) {
        const { rows } = await pool.query(`
      SELECT l.titulo_libros, v.fecha_visualizacion_visualizaciones,
        STRING_AGG(DISTINCT a.nombre_autores, ', ') AS autores
      FROM visualizaciones v
      JOIN libros l ON v.id_libros = l.id_libros
      LEFT JOIN libro_autor la ON l.id_libros = la.id_libros
      LEFT JOIN autores a ON la.id_autores = a.id_autores
      WHERE v.id_usuarios = $1
      GROUP BY l.id_libros, v.fecha_visualizacion_visualizaciones
      ORDER BY v.fecha_visualizacion_visualizaciones DESC
    `, [userId]);
        return rows;
    }

};

module.exports = DescargaModel;