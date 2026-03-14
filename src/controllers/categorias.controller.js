const pool = require('../config/db');

const CategoriasController = {

    async index(req, res) {
        try {
            const { rows: categorias } = await pool.query(`
        SELECT c.*, COUNT(lc.id_libros) AS total_libros
        FROM categorias c
        LEFT JOIN libro_categoria lc ON c.id_categorias = lc.id_categorias
        GROUP BY c.id_categorias
        ORDER BY c.nombre_categorias ASC
      `);

            res.render('admin/categorias/index', {
                title: 'Gestión de Categorías',
                layout: 'main',
                categorias,
                success: req.query.success || null,
                usuario: req.usuario
            });
        } catch (error) {
            console.error('Error listando categorías:', error.message);
            res.redirect('/admin/dashboard');
        }
    },

    showNuevo(req, res) {
        res.render('admin/categorias/nuevo', {
            title: 'Nueva Categoría',
            layout: 'main',
            usuario: req.usuario
        });
    },

    async crear(req, res) {
        try {
            const { nombre, descripcion } = req.body;

            if (!nombre) {
                return res.render('admin/categorias/nuevo', {
                    title: 'Nueva Categoría',
                    layout: 'main',
                    error: 'El nombre es obligatorio',
                    usuario: req.usuario
                });
            }

            await pool.query(
                `INSERT INTO categorias (nombre_categorias, descripcion_categorias) VALUES ($1, $2)`,
                [nombre, descripcion || null]
            );

            await pool.query(`
        INSERT INTO actividad_sistema (id_usuarios, accion_actividad_sistema, descripcion_actividad_sistema)
        VALUES ($1, $2, $3)
      `, [req.usuario.id, 'CATEGORIA_CREADA', `Categoría creada: ${nombre}`]);

            res.redirect('/admin/categorias?success=categoria_creada');
        } catch (error) {
            console.error('Error creando categoría:', error.message);
            res.render('admin/categorias/nuevo', {
                title: 'Nueva Categoría',
                layout: 'main',
                error: error.message.includes('unique') ? 'Esta categoría ya existe' : 'Error interno del servidor',
                usuario: req.usuario
            });
        }
    },

    async showEditar(req, res) {
        try {
            const { rows } = await pool.query(
                `SELECT * FROM categorias WHERE id_categorias = $1`, [req.params.id]
            );
            if (rows.length === 0) return res.redirect('/admin/categorias');

            res.render('admin/categorias/editar', {
                title: 'Editar Categoría',
                layout: 'main',
                categoria: rows[0],
                usuario: req.usuario
            });
        } catch (error) {
            console.error('Error mostrando editar categoría:', error.message);
            res.redirect('/admin/categorias');
        }
    },

    async actualizar(req, res) {
        try {
            const { nombre, descripcion } = req.body;
            const { id } = req.params;

            if (!nombre) {
                const { rows } = await pool.query(
                    `SELECT * FROM categorias WHERE id_categorias = $1`, [id]
                );
                return res.render('admin/categorias/editar', {
                    title: 'Editar Categoría',
                    layout: 'main',
                    error: 'El nombre es obligatorio',
                    categoria: rows[0],
                    usuario: req.usuario
                });
            }

            await pool.query(
                `UPDATE categorias SET nombre_categorias = $1, descripcion_categorias = $2 WHERE id_categorias = $3`,
                [nombre, descripcion || null, id]
            );

            res.redirect('/admin/categorias?success=categoria_actualizada');
        } catch (error) {
            console.error('Error actualizando categoría:', error.message);
            res.redirect('/admin/categorias');
        }
    },

    async eliminar(req, res) {
        try {
            const { id } = req.params;
            const { rows } = await pool.query(
                `SELECT nombre_categorias FROM categorias WHERE id_categorias = $1`, [id]
            );
            if (rows.length === 0) return res.redirect('/admin/categorias');

            await pool.query(`DELETE FROM categorias WHERE id_categorias = $1`, [id]);

            await pool.query(`
        INSERT INTO actividad_sistema (id_usuarios, accion_actividad_sistema, descripcion_actividad_sistema)
        VALUES ($1, $2, $3)
      `, [req.usuario.id, 'CATEGORIA_ELIMINADA', `Categoría eliminada: ${rows[0].nombre_categorias}`]);

            res.redirect('/admin/categorias?success=categoria_eliminada');
        } catch (error) {
            console.error('Error eliminando categoría:', error.message);
            res.redirect('/admin/categorias');
        }
    }

};

module.exports = CategoriasController;