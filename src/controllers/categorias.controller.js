const CategoriaModel = require('../models/categoria.model');
const ReporteModel = require('../models/reporte.model');

const CategoriasController = {

    async index(req, res) {
        try {
            const categorias = await CategoriaModel.getAll();
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
            await CategoriaModel.create({ nombre, descripcion });
            await ReporteModel.registrarActividad({
                userId: req.usuario.id,
                accion: 'CATEGORIA_CREADA',
                descripcion: `Categoría creada: ${nombre}`
            });
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
            const categoria = await CategoriaModel.getById(req.params.id);
            if (!categoria) return res.redirect('/admin/categorias');
            res.render('admin/categorias/editar', {
                title: 'Editar Categoría',
                layout: 'main',
                categoria,
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
                const categoria = await CategoriaModel.getById(id);
                return res.render('admin/categorias/editar', {
                    title: 'Editar Categoría',
                    layout: 'main',
                    error: 'El nombre es obligatorio',
                    categoria,
                    usuario: req.usuario
                });
            }
            await CategoriaModel.update({ id, nombre, descripcion });
            res.redirect('/admin/categorias?success=categoria_actualizada');
        } catch (error) {
            console.error('Error actualizando categoría:', error.message);
            res.redirect('/admin/categorias');
        }
    },

    async eliminar(req, res) {
        try {
            const { id } = req.params;
            const categoria = await CategoriaModel.getById(id);
            if (!categoria) return res.redirect('/admin/categorias');
            await CategoriaModel.delete(id);
            await ReporteModel.registrarActividad({
                userId: req.usuario.id,
                accion: 'CATEGORIA_ELIMINADA',
                descripcion: `Categoría eliminada: ${categoria.nombre_categorias}`
            });
            res.redirect('/admin/categorias?success=categoria_eliminada');
        } catch (error) {
            console.error('Error eliminando categoría:', error.message);
            res.redirect('/admin/categorias');
        }
    }

};

module.exports = CategoriasController;