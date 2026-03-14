const pool = require('../config/db');

const AutoresController = {

    async index(req, res) {
        try {
            const { rows: autores } = await pool.query(`
        SELECT a.*, COUNT(la.id_libros) AS total_libros
        FROM autores a
        LEFT JOIN libro_autor la ON a.id_autores = la.id_autores
        GROUP BY a.id_autores
        ORDER BY a.nombre_autores ASC
      `);

            res.render('admin/autores/index', {
                title: 'Gestión de Autores',
                layout: 'main',
                autores,
                success: req.query.success || null,
                usuario: req.usuario
            });
        } catch (error) {
            console.error('Error listando autores:', error.message);
            res.redirect('/admin/dashboard');
        }
    },

    showNuevo(req, res) {
        res.render('admin/autores/nuevo', {
            title: 'Nuevo Autor',
            layout: 'main',
            usuario: req.usuario
        });
    },

    async crear(req, res) {
        try {
            const { nombre, nacionalidad } = req.body;

            if (!nombre) {
                return res.render('admin/autores/nuevo', {
                    title: 'Nuevo Autor',
                    layout: 'main',
                    error: 'El nombre es obligatorio',
                    usuario: req.usuario
                });
            }

            await pool.query(
                `INSERT INTO autores (nombre_autores, nacionalidad_autores) VALUES ($1, $2)`,
                [nombre, nacionalidad || null]
            );

            await pool.query(`
        INSERT INTO actividad_sistema (id_usuarios, accion_actividad_sistema, descripcion_actividad_sistema)
        VALUES ($1, $2, $3)
      `, [req.usuario.id, 'AUTOR_CREADO', `Autor creado: ${nombre}`]);

            res.redirect('/admin/autores?success=autor_creado');
        } catch (error) {
            console.error('Error creando autor:', error.message);
            res.render('admin/autores/nuevo', {
                title: 'Nuevo Autor',
                layout: 'main',
                error: 'Error interno del servidor',
                usuario: req.usuario
            });
        }
    },

    async showEditar(req, res) {
        try {
            const { rows } = await pool.query(
                `SELECT * FROM autores WHERE id_autores = $1`, [req.params.id]
            );
            if (rows.length === 0) return res.redirect('/admin/autores');

            res.render('admin/autores/editar', {
                title: 'Editar Autor',
                layout: 'main',
                autor: rows[0],
                usuario: req.usuario
            });
        } catch (error) {
            console.error('Error mostrando editar autor:', error.message);
            res.redirect('/admin/autores');
        }
    },

    async actualizar(req, res) {
        try {
            const { nombre, nacionalidad } = req.body;
            const { id } = req.params;

            if (!nombre) {
                const { rows } = await pool.query(
                    `SELECT * FROM autores WHERE id_autores = $1`, [id]
                );
                return res.render('admin/autores/editar', {
                    title: 'Editar Autor',
                    layout: 'main',
                    error: 'El nombre es obligatorio',
                    autor: rows[0],
                    usuario: req.usuario
                });
            }

            await pool.query(
                `UPDATE autores SET nombre_autores = $1, nacionalidad_autores = $2 WHERE id_autores = $3`,
                [nombre, nacionalidad || null, id]
            );

            res.redirect('/admin/autores?success=autor_actualizado');
        } catch (error) {
            console.error('Error actualizando autor:', error.message);
            res.redirect('/admin/autores');
        }
    },

    async eliminar(req, res) {
        try {
            const { id } = req.params;
            const { rows } = await pool.query(
                `SELECT nombre_autores FROM autores WHERE id_autores = $1`, [id]
            );
            if (rows.length === 0) return res.redirect('/admin/autores');

            await pool.query(`DELETE FROM autores WHERE id_autores = $1`, [id]);

            await pool.query(`
        INSERT INTO actividad_sistema (id_usuarios, accion_actividad_sistema, descripcion_actividad_sistema)
        VALUES ($1, $2, $3)
      `, [req.usuario.id, 'AUTOR_ELIMINADO', `Autor eliminado: ${rows[0].nombre_autores}`]);

            res.redirect('/admin/autores?success=autor_eliminado');
        } catch (error) {
            console.error('Error eliminando autor:', error.message);
            res.redirect('/admin/autores');
        }
    }

};

module.exports = AutoresController;