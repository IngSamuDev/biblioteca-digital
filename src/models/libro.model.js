const pool = require('../config/db');

const LibroModel = {

    async getAll() {
        const { rows } = await pool.query(`
      SELECT
        l.id_libros, l.titulo_libros, l.descripcion_libros,
        l.anio_publicacion_libros, l.portada_url_libros,
        l.archivo_url_libros, l.fecha_subida_libros,
        l.activo_libros, u.nombre_usuarios AS subido_por,
        STRING_AGG(DISTINCT a.nombre_autores, ', ') AS autores,
        STRING_AGG(DISTINCT c.nombre_categorias, ', ') AS categorias,
        COUNT(DISTINCT d.id_descargas) AS total_descargas
      FROM libros l
      LEFT JOIN usuarios u ON l.id_usuarios = u.id_usuarios
      LEFT JOIN libro_autor la ON l.id_libros = la.id_libros
      LEFT JOIN autores a ON la.id_autores = a.id_autores
      LEFT JOIN libro_categoria lc ON l.id_libros = lc.id_libros
      LEFT JOIN categorias c ON lc.id_categorias = c.id_categorias
      LEFT JOIN descargas d ON l.id_libros = d.id_libros
      GROUP BY l.id_libros, u.nombre_usuarios
      ORDER BY l.fecha_subida_libros DESC
    `);
        return rows;
    },

    async getById(id) {
        const { rows } = await pool.query(`
      SELECT
        l.*, u.nombre_usuarios AS subido_por,
        STRING_AGG(DISTINCT a.nombre_autores, ', ') AS autores,
        STRING_AGG(DISTINCT c.nombre_categorias, ', ') AS categorias,
        COUNT(DISTINCT d.id_descargas) AS total_descargas,
        COUNT(DISTINCT v.id_visualizaciones) AS total_visualizaciones
      FROM libros l
      LEFT JOIN usuarios u ON l.id_usuarios = u.id_usuarios
      LEFT JOIN libro_autor la ON l.id_libros = la.id_libros
      LEFT JOIN autores a ON la.id_autores = a.id_autores
      LEFT JOIN libro_categoria lc ON l.id_libros = lc.id_libros
      LEFT JOIN categorias c ON lc.id_categorias = c.id_categorias
      LEFT JOIN descargas d ON l.id_libros = d.id_libros
      LEFT JOIN visualizaciones v ON l.id_libros = v.id_libros
      WHERE l.id_libros = $1 AND l.activo_libros = TRUE
      GROUP BY l.id_libros, u.nombre_usuarios
    `, [id]);
        return rows[0] || null;
    },

    async getRecientes(limite = 8) {
        const { rows } = await pool.query(`
      SELECT
        l.id_libros, l.titulo_libros, l.descripcion_libros,
        l.anio_publicacion_libros, l.portada_url_libros,
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
      LIMIT $1
    `, [limite]);
        return rows;
    },

    async buscar({ buscar, categoria, ordenar }) {
        let whereClause = 'WHERE l.activo_libros = TRUE';
        const params = [];
        let paramCount = 1;

        if (buscar) {
            whereClause += ` AND (
        LOWER(l.titulo_libros) LIKE LOWER($${paramCount})
        OR EXISTS (
          SELECT 1 FROM libro_autor la
          JOIN autores a ON la.id_autores = a.id_autores
          WHERE la.id_libros = l.id_libros
          AND LOWER(a.nombre_autores) LIKE LOWER($${paramCount})
        )
      )`;
            params.push(`%${buscar}%`);
            paramCount++;
        }

        if (categoria) {
            whereClause += ` AND EXISTS (
        SELECT 1 FROM libro_categoria lc
        JOIN categorias c ON lc.id_categorias = c.id_categorias
        WHERE lc.id_libros = l.id_libros
        AND c.id_categorias = $${paramCount}
      )`;
            params.push(categoria);
            paramCount++;
        }

        let orderClause = 'ORDER BY l.fecha_subida_libros DESC';
        if (ordenar === 'titulo_asc') orderClause = 'ORDER BY l.titulo_libros ASC';
        if (ordenar === 'titulo_desc') orderClause = 'ORDER BY l.titulo_libros DESC';
        if (ordenar === 'fecha_asc') orderClause = 'ORDER BY l.fecha_subida_libros ASC';
        if (ordenar === 'fecha_desc') orderClause = 'ORDER BY l.fecha_subida_libros DESC';

        const { rows } = await pool.query(`
      SELECT
        l.id_libros, l.titulo_libros, l.descripcion_libros,
        l.anio_publicacion_libros, l.portada_url_libros,
        l.fecha_subida_libros,
        STRING_AGG(DISTINCT a.nombre_autores, ', ') AS autores,
        STRING_AGG(DISTINCT c.nombre_categorias, ', ') AS categorias
      FROM libros l
      LEFT JOIN libro_autor la ON l.id_libros = la.id_libros
      LEFT JOIN autores a ON la.id_autores = a.id_autores
      LEFT JOIN libro_categoria lc ON l.id_libros = lc.id_libros
      LEFT JOIN categorias c ON lc.id_categorias = c.id_categorias
      ${whereClause}
      GROUP BY l.id_libros
      ${orderClause}
    `, params);
        return rows;
    },

    async getRelacionados(id) {
        const { rows } = await pool.query(`
      SELECT DISTINCT l.id_libros, l.titulo_libros, l.portada_url_libros,
        STRING_AGG(DISTINCT a.nombre_autores, ', ') AS autores
      FROM libros l
      LEFT JOIN libro_autor la ON l.id_libros = la.id_libros
      LEFT JOIN autores a ON la.id_autores = a.id_autores
      LEFT JOIN libro_categoria lc ON l.id_libros = lc.id_libros
      WHERE lc.id_categorias IN (
        SELECT id_categorias FROM libro_categoria WHERE id_libros = $1
      )
      AND l.id_libros != $1
      AND l.activo_libros = TRUE
      GROUP BY l.id_libros
      LIMIT 4
    `, [id]);
        return rows;
    },

    async create({ titulo, descripcion, anio, pdfFilename, portadaFilename, userId }) {
        const { rows } = await pool.query(`
      INSERT INTO libros
        (titulo_libros, descripcion_libros, anio_publicacion_libros,
         archivo_url_libros, portada_url_libros, id_usuarios)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id_libros
    `, [titulo, descripcion || null, anio || null, pdfFilename, portadaFilename || null, userId]);
        return rows[0];
    },

    async update({ id, titulo, descripcion, anio, pdfFilename, portadaFilename }) {
        await pool.query(`
      UPDATE libros SET
        titulo_libros = $1,
        descripcion_libros = $2,
        anio_publicacion_libros = $3,
        archivo_url_libros = $4,
        portada_url_libros = $5
      WHERE id_libros = $6
    `, [titulo, descripcion || null, anio || null, pdfFilename, portadaFilename, id]);
    },

    async delete(id) {
        await pool.query(`DELETE FROM libros WHERE id_libros = $1`, [id]);
    },

    async asociarAutores(libroId, autores) {
        await pool.query(`DELETE FROM libro_autor WHERE id_libros = $1`, [libroId]);
        if (autores) {
            const autoresArray = Array.isArray(autores) ? autores : [autores];
            for (const autorId of autoresArray) {
                await pool.query(
                    `INSERT INTO libro_autor (id_libros, id_autores) VALUES ($1, $2)`,
                    [libroId, autorId]
                );
            }
        }
    },

    async asociarCategorias(libroId, categorias) {
        await pool.query(`DELETE FROM libro_categoria WHERE id_libros = $1`, [libroId]);
        if (categorias) {
            const categoriasArray = Array.isArray(categorias) ? categorias : [categorias];
            for (const catId of categoriasArray) {
                await pool.query(
                    `INSERT INTO libro_categoria (id_libros, id_categorias) VALUES ($1, $2)`,
                    [libroId, catId]
                );
            }
        }
    },

    async getAutoresSeleccionados(libroId) {
        const { rows } = await pool.query(
            `SELECT id_autores FROM libro_autor WHERE id_libros = $1`, [libroId]
        );
        return rows.map(r => r.id_autores);
    },

    async getCategoriasSeleccionadas(libroId) {
        const { rows } = await pool.query(
            `SELECT id_categorias FROM libro_categoria WHERE id_libros = $1`, [libroId]
        );
        return rows.map(r => r.id_categorias);
    },

    async getMasDescargados(limite = 5) {
        const { rows } = await pool.query(`
      SELECT l.id_libros, l.titulo_libros,
        COUNT(d.id_descargas) AS total_descargas
      FROM libros l
      LEFT JOIN descargas d ON l.id_libros = d.id_libros
      WHERE l.activo_libros = TRUE
      GROUP BY l.id_libros
      ORDER BY total_descargas DESC
      LIMIT $1
    `, [limite]);
        return rows;
    }

};

module.exports = LibroModel;