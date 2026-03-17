const AutorModel = require('../models/autor.model');
const ReporteModel = require('../models/reporte.model');

const AutoresController = {

    async index(req, res) {
        try {
            const autores = await AutorModel.getAll();
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
            await AutorModel.create({ nombre, nacionalidad });
            await ReporteModel.registrarActividad({
                userId: req.usuario.id,
                accion: 'AUTOR_CREADO',
                descripcion: `Autor creado: ${nombre}`
            });
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
            const autor = await AutorModel.getById(req.params.id);
            if (!autor) return res.redirect('/admin/autores');
            res.render('admin/autores/editar', {
                title: 'Editar Autor',
                layout: 'main',
                autor,
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
                const autor = await AutorModel.getById(id);
                return res.render('admin/autores/editar', {
                    title: 'Editar Autor',
                    layout: 'main',
                    error: 'El nombre es obligatorio',
                    autor,
                    usuario: req.usuario
                });
            }
            await AutorModel.update({ id, nombre, nacionalidad });
            res.redirect('/admin/autores?success=autor_actualizado');
        } catch (error) {
            console.error('Error actualizando autor:', error.message);
            res.redirect('/admin/autores');
        }
    },

    async eliminar(req, res) {
        try {
            const { id } = req.params;
            const autor = await AutorModel.getById(id);
            if (!autor) return res.redirect('/admin/autores');
            await AutorModel.delete(id);
            await ReporteModel.registrarActividad({
                userId: req.usuario.id,
                accion: 'AUTOR_ELIMINADO',
                descripcion: `Autor eliminado: ${autor.nombre_autores}`
            });
            res.redirect('/admin/autores?success=autor_eliminado');
        } catch (error) {
            console.error('Error eliminando autor:', error.message);
            res.redirect('/admin/autores');
        }
    }

};

module.exports = AutoresController;