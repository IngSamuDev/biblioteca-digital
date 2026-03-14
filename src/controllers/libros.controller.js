const pool = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ── Configuración de Multer ───────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'pdf') {
            cb(null, path.join(__dirname, '../public/uploads/pdfs'));
        } else {
            cb(null, path.join(__dirname, '../public/uploads/portadas'));
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'pdf') {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos PDF'), false);
        }
    } else if (file.fieldname === 'portada') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes para la portada'), false);
        }
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB máximo
});

const LibrosController = {

    // ── Middleware de subida ──────────────────────────────────────
    upload: upload.fields([
        { name: 'pdf', maxCount: 1 },
        { name: 'portada', maxCount: 1 }
    ]),

    // ── Listar libros (admin) ─────────────────────────────────────
    async index(req, res) {
        try {
            const { rows: libros } = await pool.query(`
        SELECT
          l.id_libros, l.titulo_libros, l.anio_publicacion_libros,
          l.fecha_subida_libros, l.activo_libros, l.portada_url_libros,
          u.nombre_usuarios AS subido_por,
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

            res.render('admin/libros/index', {
                title: 'Gestión de Libros',
                layout: 'main',
                libros,
                usuario: req.usuario
            });
        } catch (error) {
            console.error('Error listando libros:', error.message);
            res.redirect('/admin/dashboard');
        }
    },

    // ── Mostrar formulario nuevo libro ────────────────────────────
    async showNuevo(req, res) {
        try {
            const { rows: autores } = await pool.query(
                `SELECT id_autores, nombre_autores FROM autores ORDER BY nombre_autores`
            );
            const { rows: categorias } = await pool.query(
                `SELECT id_categorias, nombre_categorias FROM categorias ORDER BY nombre_categorias`
            );

            res.render('admin/libros/nuevo', {
                title: 'Subir Nuevo Libro',
                layout: 'main',
                autores,
                categorias,
                usuario: req.usuario
            });
        } catch (error) {
            console.error('Error mostrando formulario:', error.message);
            res.redirect('/admin/libros');
        }
    },

    // ── Crear libro (RF15, RF16, RF17, RF18) ──────────────────────
    async crear(req, res) {
        try {
            const { titulo, descripcion, anio, autores, categorias } = req.body;

            // Validar campos obligatorios
            if (!titulo) {
                return res.redirect('/admin/libros/nuevo?error=titulo_requerido');
            }

            // Validar que se subió el PDF (RF16)
            if (!req.files || !req.files.pdf) {
                return res.redirect('/admin/libros/nuevo?error=pdf_requerido');
            }

            const pdfFile = req.files.pdf[0];
            const portadaFile = req.files.portada ? req.files.portada[0] : null;

            // Insertar libro (RF18, RF23, RF24)
            const { rows } = await pool.query(`
        INSERT INTO libros
          (titulo_libros, descripcion_libros, anio_publicacion_libros,
           archivo_url_libros, portada_url_libros, id_usuarios)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id_libros
      `, [
                titulo,
                descripcion || null,
                anio || null,
                pdfFile.filename,
                portadaFile ? portadaFile.filename : null,
                req.usuario.id
            ]);

            const libroId = rows[0].id_libros;

            // Asociar autores (RF21)
            if (autores) {
                const autoresArray = Array.isArray(autores) ? autores : [autores];
                for (const autorId of autoresArray) {
                    await pool.query(
                        `INSERT INTO libro_autor (id_libros, id_autores) VALUES ($1, $2)`,
                        [libroId, autorId]
                    );
                }
            }

            // Asociar categorías (RF22)
            if (categorias) {
                const categoriasArray = Array.isArray(categorias) ? categorias : [categorias];
                for (const catId of categoriasArray) {
                    await pool.query(
                        `INSERT INTO libro_categoria (id_libros, id_categorias) VALUES ($1, $2)`,
                        [libroId, catId]
                    );
                }
            }

            // Registrar actividad
            await pool.query(`
        INSERT INTO actividad_sistema (id_usuarios, accion_actividad_sistema, descripcion_actividad_sistema)
        VALUES ($1, $2, $3)
      `, [req.usuario.id, 'LIBRO_CREADO', `Libro creado: ${titulo}`]);

            res.redirect('/admin/libros?success=libro_creado');

        } catch (error) {
            console.error('Error creando libro:', error.message);
            res.redirect('/admin/libros/nuevo?error=error_servidor');
        }
    },

    // ── Mostrar formulario editar libro ───────────────────────────
    async showEditar(req, res) {
        try {
            const { id } = req.params;

            const { rows: libros } = await pool.query(
                `SELECT * FROM libros WHERE id_libros = $1`, [id]
            );

            if (libros.length === 0) return res.redirect('/admin/libros');

            const { rows: autores } = await pool.query(
                `SELECT id_autores, nombre_autores FROM autores ORDER BY nombre_autores`
            );
            const { rows: categorias } = await pool.query(
                `SELECT id_categorias, nombre_categorias FROM categorias ORDER BY nombre_categorias`
            );
            const { rows: autoresLibro } = await pool.query(
                `SELECT id_autores FROM libro_autor WHERE id_libros = $1`, [id]
            );
            const { rows: categoriasLibro } = await pool.query(
                `SELECT id_categorias FROM libro_categoria WHERE id_libros = $1`, [id]
            );

            const autoresSeleccionados = autoresLibro.map(a => a.id_autores);
            const categoriasSeleccionadas = categoriasLibro.map(c => c.id_categorias);

            res.render('admin/libros/editar', {
                title: 'Editar Libro',
                layout: 'main',
                libro: libros[0],
                autores: autores.map(a => ({
                    ...a,
                    seleccionado: autoresSeleccionados.includes(a.id_autores)
                })),
                categorias: categorias.map(c => ({
                    ...c,
                    seleccionada: categoriasSeleccionadas.includes(c.id_categorias)
                })),
                usuario: req.usuario
            });
        } catch (error) {
            console.error('Error mostrando editar:', error.message);
            res.redirect('/admin/libros');
        }
    },

    // ── Actualizar libro (RF19) ───────────────────────────────────
    async actualizar(req, res) {
        try {
            const { id } = req.params;
            const { titulo, descripcion, anio, autores, categorias } = req.body;

            const { rows: libroActual } = await pool.query(
                `SELECT * FROM libros WHERE id_libros = $1`, [id]
            );
            if (libroActual.length === 0) return res.redirect('/admin/libros');

            let pdfFilename = libroActual[0].archivo_url_libros;
            let portadaFilename = libroActual[0].portada_url_libros;

            // Si subió nuevo PDF
            if (req.files && req.files.pdf) {
                // Eliminar PDF anterior
                const oldPdf = path.join(__dirname, '../public/uploads/pdfs', pdfFilename);
                if (fs.existsSync(oldPdf)) fs.unlinkSync(oldPdf);
                pdfFilename = req.files.pdf[0].filename;
            }

            // Si subió nueva portada
            if (req.files && req.files.portada) {
                if (portadaFilename) {
                    const oldPortada = path.join(__dirname, '../public/uploads/portadas', portadaFilename);
                    if (fs.existsSync(oldPortada)) fs.unlinkSync(oldPortada);
                }
                portadaFilename = req.files.portada[0].filename;
            }

            await pool.query(`
        UPDATE libros SET
          titulo_libros = $1,
          descripcion_libros = $2,
          anio_publicacion_libros = $3,
          archivo_url_libros = $4,
          portada_url_libros = $5
        WHERE id_libros = $6
      `, [titulo, descripcion || null, anio || null, pdfFilename, portadaFilename, id]);

            // Actualizar autores
            await pool.query(`DELETE FROM libro_autor WHERE id_libros = $1`, [id]);
            if (autores) {
                const autoresArray = Array.isArray(autores) ? autores : [autores];
                for (const autorId of autoresArray) {
                    await pool.query(
                        `INSERT INTO libro_autor (id_libros, id_autores) VALUES ($1, $2)`,
                        [id, autorId]
                    );
                }
            }

            // Actualizar categorías
            await pool.query(`DELETE FROM libro_categoria WHERE id_libros = $1`, [id]);
            if (categorias) {
                const categoriasArray = Array.isArray(categorias) ? categorias : [categorias];
                for (const catId of categoriasArray) {
                    await pool.query(
                        `INSERT INTO libro_categoria (id_libros, id_categorias) VALUES ($1, $2)`,
                        [id, catId]
                    );
                }
            }

            await pool.query(`
        INSERT INTO actividad_sistema (id_usuarios, accion_actividad_sistema, descripcion_actividad_sistema)
        VALUES ($1, $2, $3)
      `, [req.usuario.id, 'LIBRO_EDITADO', `Libro editado: ${titulo}`]);

            res.redirect('/admin/libros?success=libro_actualizado');

        } catch (error) {
            console.error('Error actualizando libro:', error.message);
            res.redirect(`/admin/libros/${req.params.id}/editar?error=error_servidor`);
        }
    },

    // ── Eliminar libro (RF20) ─────────────────────────────────────
    async eliminar(req, res) {
        try {
            const { id } = req.params;

            const { rows } = await pool.query(
                `SELECT * FROM libros WHERE id_libros = $1`, [id]
            );
            if (rows.length === 0) return res.redirect('/admin/libros');

            // Eliminar archivos físicos
            if (rows[0].archivo_url_libros) {
                const pdfPath = path.join(__dirname, '../public/uploads/pdfs', rows[0].archivo_url_libros);
                if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
            }
            if (rows[0].portada_url_libros) {
                const portadaPath = path.join(__dirname, '../public/uploads/portadas', rows[0].portada_url_libros);
                if (fs.existsSync(portadaPath)) fs.unlinkSync(portadaPath);
            }

            await pool.query(`DELETE FROM libros WHERE id_libros = $1`, [id]);

            await pool.query(`
        INSERT INTO actividad_sistema (id_usuarios, accion_actividad_sistema, descripcion_actividad_sistema)
        VALUES ($1, $2, $3)
      `, [req.usuario.id, 'LIBRO_ELIMINADO', `Libro eliminado: ${rows[0].titulo_libros}`]);

            res.redirect('/admin/libros?success=libro_eliminado');

        } catch (error) {
            console.error('Error eliminando libro:', error.message);
            res.redirect('/admin/libros');
        }
    }

};

module.exports = LibrosController;