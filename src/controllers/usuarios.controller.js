const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const UsuariosController = {

    async index(req, res) {
        try {
            const { rows: usuarios } = await pool.query(`
        SELECT u.*, r.nombre_roles
        FROM usuarios u
        JOIN roles r ON u.id_roles = r.id_roles
        ORDER BY u.fecha_creacion_usuarios DESC
      `);

            res.render('admin/usuarios/index', {
                title: 'Gestión de Usuarios',
                layout: 'main',
                usuarios,
                success: req.query.success || null,
                usuario: req.usuario
            });
        } catch (error) {
            console.error('Error listando usuarios:', error.message);
            res.redirect('/admin/dashboard');
        }
    },

    async showNuevo(req, res) {
        try {
            const { rows: roles } = await pool.query(
                `SELECT * FROM roles ORDER BY nombre_roles`
            );
            res.render('admin/usuarios/nuevo', {
                title: 'Nuevo Usuario',
                layout: 'main',
                roles,
                usuario: req.usuario
            });
        } catch (error) {
            console.error('Error mostrando formulario:', error.message);
            res.redirect('/admin/usuarios');
        }
    },

    async crear(req, res) {
        try {
            const { nombre, email, password, id_roles } = req.body;

            if (!nombre || !email || !password || !id_roles) {
                const { rows: roles } = await pool.query(`SELECT * FROM roles`);
                return res.render('admin/usuarios/nuevo', {
                    title: 'Nuevo Usuario',
                    layout: 'main',
                    error: 'Todos los campos son obligatorios',
                    roles,
                    usuario: req.usuario
                });
            }

            // Verificar email duplicado
            const { rows: existe } = await pool.query(
                `SELECT id_usuarios FROM usuarios WHERE email_usuarios = $1`, [email]
            );
            if (existe.length > 0) {
                const { rows: roles } = await pool.query(`SELECT * FROM roles`);
                return res.render('admin/usuarios/nuevo', {
                    title: 'Nuevo Usuario',
                    layout: 'main',
                    error: 'Este email ya está registrado',
                    roles,
                    nombre, email,
                    usuario: req.usuario
                });
            }

            const hash = await bcrypt.hash(password, 10);
            await pool.query(`
        INSERT INTO usuarios (nombre_usuarios, email_usuarios, password_usuarios, id_roles)
        VALUES ($1, $2, $3, $4)
      `, [nombre, email, hash, id_roles]);

            await pool.query(`
        INSERT INTO actividad_sistema (id_usuarios, accion_actividad_sistema, descripcion_actividad_sistema)
        VALUES ($1, $2, $3)
      `, [req.usuario.id, 'USUARIO_CREADO', `Usuario creado: ${email}`]);

            res.redirect('/admin/usuarios?success=usuario_creado');
        } catch (error) {
            console.error('Error creando usuario:', error.message);
            res.redirect('/admin/usuarios/nuevo?error=error_servidor');
        }
    },

    async showEditar(req, res) {
        try {
            const { id } = req.params;
            const { rows: usuarios } = await pool.query(
                `SELECT * FROM usuarios WHERE id_usuarios = $1`, [id]
            );
            if (usuarios.length === 0) return res.redirect('/admin/usuarios');

            const { rows: roles } = await pool.query(`SELECT * FROM roles ORDER BY nombre_roles`);

            res.render('admin/usuarios/editar', {
                title: 'Editar Usuario',
                layout: 'main',
                usuarioEditar: usuarios[0],
                roles: roles.map(r => ({
                    ...r,
                    seleccionado: r.id_roles === usuarios[0].id_roles
                })),
                usuario: req.usuario
            });
        } catch (error) {
            console.error('Error mostrando editar:', error.message);
            res.redirect('/admin/usuarios');
        }
    },

    async actualizar(req, res) {
        try {
            const { id } = req.params;
            const { nombre, email, password, id_roles, estado } = req.body;

            if (!nombre || !email || !id_roles) {
                return res.redirect(`/admin/usuarios/${id}/editar?error=campos_requeridos`);
            }

            // Verificar email duplicado en otro usuario
            const { rows: existe } = await pool.query(
                `SELECT id_usuarios FROM usuarios WHERE email_usuarios = $1 AND id_usuarios != $2`,
                [email, id]
            );
            if (existe.length > 0) {
                return res.redirect(`/admin/usuarios/${id}/editar?error=email_duplicado`);
            }

            // Si hay nueva contraseña la hasheamos
            if (password && password.length >= 6) {
                const hash = await bcrypt.hash(password, 10);
                await pool.query(`
          UPDATE usuarios SET
            nombre_usuarios = $1,
            email_usuarios = $2,
            password_usuarios = $3,
            id_roles = $4,
            estado_usuarios = $5
          WHERE id_usuarios = $6
        `, [nombre, email, hash, id_roles, estado === 'true', id]);
            } else {
                await pool.query(`
          UPDATE usuarios SET
            nombre_usuarios = $1,
            email_usuarios = $2,
            id_roles = $3,
            estado_usuarios = $4
          WHERE id_usuarios = $5
        `, [nombre, email, id_roles, estado === 'true', id]);
            }

            await pool.query(`
        INSERT INTO actividad_sistema (id_usuarios, accion_actividad_sistema, descripcion_actividad_sistema)
        VALUES ($1, $2, $3)
      `, [req.usuario.id, 'USUARIO_EDITADO', `Usuario editado: ${email}`]);

            res.redirect('/admin/usuarios?success=usuario_actualizado');
        } catch (error) {
            console.error('Error actualizando usuario:', error.message);
            res.redirect('/admin/usuarios');
        }
    },

    async desactivar(req, res) {
        try {
            const { id } = req.params;

            // No puede desactivarse a sí mismo
            if (parseInt(id) === req.usuario.id) {
                return res.redirect('/admin/usuarios?error=no_puedes_desactivarte');
            }

            const { rows } = await pool.query(
                `SELECT email_usuarios, estado_usuarios FROM usuarios WHERE id_usuarios = $1`, [id]
            );
            if (rows.length === 0) return res.redirect('/admin/usuarios');

            const nuevoEstado = !rows[0].estado_usuarios;
            await pool.query(
                `UPDATE usuarios SET estado_usuarios = $1 WHERE id_usuarios = $2`,
                [nuevoEstado, id]
            );

            await pool.query(`
        INSERT INTO actividad_sistema (id_usuarios, accion_actividad_sistema, descripcion_actividad_sistema)
        VALUES ($1, $2, $3)
      `, [req.usuario.id, nuevoEstado ? 'USUARIO_ACTIVADO' : 'USUARIO_DESACTIVADO',
            `Usuario ${nuevoEstado ? 'activado' : 'desactivado'}: ${rows[0].email_usuarios}`]);

            res.redirect('/admin/usuarios?success=estado_actualizado');
        } catch (error) {
            console.error('Error desactivando usuario:', error.message);
            res.redirect('/admin/usuarios');
        }
    },

    async eliminar(req, res) {
        try {
            const { id } = req.params;

            // No puede eliminarse a sí mismo
            if (parseInt(id) === req.usuario.id) {
                return res.redirect('/admin/usuarios?error=no_puedes_eliminarte');
            }

            const { rows } = await pool.query(
                `SELECT email_usuarios FROM usuarios WHERE id_usuarios = $1`, [id]
            );
            if (rows.length === 0) return res.redirect('/admin/usuarios');

            await pool.query(`DELETE FROM usuarios WHERE id_usuarios = $1`, [id]);

            await pool.query(`
        INSERT INTO actividad_sistema (id_usuarios, accion_actividad_sistema, descripcion_actividad_sistema)
        VALUES ($1, $2, $3)
      `, [req.usuario.id, 'USUARIO_ELIMINADO', `Usuario eliminado: ${rows[0].email_usuarios}`]);

            res.redirect('/admin/usuarios?success=usuario_eliminado');
        } catch (error) {
            console.error('Error eliminando usuario:', error.message);
            res.redirect('/admin/usuarios');
        }
    }

};

module.exports = UsuariosController;