const pool = require('../config/db');

const CatalogoController = {

    // ── Catálogo principal (RF43, RF44, RF45, RF46, RF47) ────────
    async index(req, res) {
        try {
            const { buscar, categoria, ordenar } = req.query;

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
        ${whereClause}
        GROUP BY l.id_libros
        ${orderClause}
      `, params);

            const { rows: categorias } = await pool.query(
                `SELECT id_categorias, nombre_categorias FROM categorias ORDER BY nombre_categorias`
            );

            res.render('catalogo/index', {
                title: 'Catálogo de Libros',
                layout: 'main',
                libros: libros.map(l => ({
                    ...l,
                    portada: l.portada_url_libros
                        ? `/uploads/portadas/${l.portada_url_libros}`
                        : null,
                    descripcion_corta: l.descripcion_libros
                        ? l.descripcion_libros.substring(0, 100) + '...'
                        : 'Sin descripción disponible'
                })),
                categorias,
                buscar: buscar || '',
                categoriaSeleccionada: categoria || '',
                ordenar: ordenar || 'fecha_desc',
                totalLibros: libros.length
            });

        } catch (error) {
            console.error('Error en catálogo:', error.message);
            res.render('catalogo/index', {
                title: 'Catálogo de Libros',
                libros: [],
                categorias: [],
                totalLibros: 0
            });
        }
    },

    // ── Detalle del libro (RF48) ──────────────────────────────────
    async detalle(req, res) {
        try {
            const { id } = req.params;

            const { rows: libros } = await pool.query(`
        SELECT
          l.*,
          u.nombre_usuarios AS subido_por,
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

            if (libros.length === 0) return res.redirect('/catalogo');

            const libro = libros[0];

            const { rows: relacionados } = await pool.query(`
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

            res.render('catalogo/detalle', {
                title: libro.titulo_libros,
                layout: 'main',
                libro: {
                    ...libro,
                    portada: libro.portada_url_libros
                        ? `/uploads/portadas/${libro.portada_url_libros}`
                        : null
                },
                relacionados: relacionados.map(r => ({
                    ...r,
                    portada: r.portada_url_libros
                        ? `/uploads/portadas/${r.portada_url_libros}`
                        : null
                })),
                usuario: req.usuario
            });

        } catch (error) {
            console.error('Error en detalle:', error.message);
            res.redirect('/catalogo');
        }
    },

    // ── Ver PDF en línea (RF31, RF32, RF35) ───────────────────────
    async verPDF(req, res) {
        try {
            const { id } = req.params;

            const { rows } = await pool.query(
                `SELECT id_libros, titulo_libros, archivo_url_libros, portada_url_libros
         FROM libros WHERE id_libros = $1 AND activo_libros = TRUE`,
                [id]
            );

            if (rows.length === 0) return res.redirect('/catalogo');

            const libro = rows[0];

            // Registrar visualización (RF35)
            await pool.query(
                `INSERT INTO visualizaciones (id_usuarios, id_libros) VALUES ($1, $2)`,
                [req.usuario.id, id]
            );

            res.render('catalogo/visor', {
                title: `Leyendo: ${libro.titulo_libros}`,
                layout: 'main',
                libro: {
                    ...libro,
                    pdfUrl: `/uploads/pdfs/${libro.archivo_url_libros}`
                },
                usuario: req.usuario
            });

        } catch (error) {
            console.error('Error en visor PDF:', error.message);
            res.redirect('/catalogo');
        }
    },

    // ── Descargar libro (RF33, RF34) ──────────────────────────────
    async descargar(req, res) {
        try {
            const { id } = req.params;

            const { rows } = await pool.query(
                `SELECT archivo_url_libros, titulo_libros FROM libros WHERE id_libros = $1 AND activo_libros = TRUE`,
                [id]
            );

            if (rows.length === 0) return res.redirect('/catalogo');

            // Registrar descarga (RF34)
            await pool.query(
                `INSERT INTO descargas (id_usuarios, id_libros) VALUES ($1, $2)`,
                [req.usuario.id, id]
            );

            const path = require('path');
            const filePath = path.join(__dirname, '../public/uploads/pdfs', rows[0].archivo_url_libros);
            res.download(filePath, `${rows[0].titulo_libros}.pdf`);

        } catch (error) {
            console.error('Error en descarga:', error.message);
            res.redirect('/catalogo');
        }
    }

};

module.exports = CatalogoController;