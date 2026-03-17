const LibroModel = require('../models/libro.model');
const ReporteModel = require('../models/reporte.model');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
        file.mimetype === 'application/pdf' ? cb(null, true) : cb(new Error('Solo PDF'), false);
    } else if (file.fieldname === 'portada') {
        file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Solo imágenes'), false);
    }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } });

const LibrosController = {

    upload: upload.fields([
        { name: 'pdf', maxCount: 1 },
        { name: 'portada', maxCount: 1 }
    ]),

    async index(req, res) {
        try {
            const libros = await LibroModel.getAll();
            res.render('admin/libros/index', {
                title: 'Gestión de Libros',
                layout: 'main',
                libros,
                success: req.query.success || null,
                usuario: req.usuario
            });
        } catch (error) {
            console.error('Error listando libros:', error.message);
            res.redirect('/admin/dashboard');
        }
    },

    async showNuevo(req, res) {
        try {
            const AutorModel = require('../models/autor.model');
            const CategoriaModel = require('../models/categoria.model');
            const autores = await AutorModel.getAll();
            const categorias = await CategoriaModel.getAll();
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

    async crear(req, res) {
        try {
            const { titulo, descripcion, anio, autores, categorias } = req.body;

            if (!titulo) return res.redirect('/admin/libros/nuevo?error=titulo_requerido');
            if (!req.files || !req.files.pdf) return res.redirect('/admin/libros/nuevo?error=pdf_requerido');

            const pdfFile = req.files.pdf[0];
            const portadaFile = req.files.portada ? req.files.portada[0] : null;

            const libro = await LibroModel.create({
                titulo, descripcion, anio,
                pdfFilename: pdfFile.filename,
                portadaFilename: portadaFile ? portadaFile.filename : null,
                userId: req.usuario.id
            });

            await LibroModel.asociarAutores(libro.id_libros, autores);
            await LibroModel.asociarCategorias(libro.id_libros, categorias);

            await ReporteModel.registrarActividad({
                userId: req.usuario.id,
                accion: 'LIBRO_CREADO',
                descripcion: `Libro creado: ${titulo}`
            });

            res.redirect('/admin/libros?success=libro_creado');
        } catch (error) {
            console.error('Error creando libro:', error.message);
            res.redirect('/admin/libros/nuevo?error=error_servidor');
        }
    },

    async showEditar(req, res) {
        try {
            const AutorModel = require('../models/autor.model');
            const CategoriaModel = require('../models/categoria.model');
            const { id } = req.params;

            const libro = await LibroModel.getById(id);
            if (!libro) return res.redirect('/admin/libros');

            const autores = await AutorModel.getAll();
            const categorias = await CategoriaModel.getAll();
            const autoresSeleccionados = await LibroModel.getAutoresSeleccionados(id);
            const categoriasSeleccionadas = await LibroModel.getCategoriasSeleccionadas(id);

            res.render('admin/libros/editar', {
                title: 'Editar Libro',
                layout: 'main',
                libro,
                autores: autores.map(a => ({ ...a, seleccionado: autoresSeleccionados.includes(a.id_autores) })),
                categorias: categorias.map(c => ({ ...c, seleccionada: categoriasSeleccionadas.includes(c.id_categorias) })),
                usuario: req.usuario
            });
        } catch (error) {
            console.error('Error mostrando editar:', error.message);
            res.redirect('/admin/libros');
        }
    },

    async actualizar(req, res) {
        try {
            const { id } = req.params;
            const { titulo, descripcion, anio, autores, categorias } = req.body;

            const libroActual = await LibroModel.getById(id);
            if (!libroActual) return res.redirect('/admin/libros');

            let pdfFilename = libroActual.archivo_url_libros;
            let portadaFilename = libroActual.portada_url_libros;

            if (req.files && req.files.pdf) {
                const oldPdf = path.join(__dirname, '../public/uploads/pdfs', pdfFilename);
                if (fs.existsSync(oldPdf)) fs.unlinkSync(oldPdf);
                pdfFilename = req.files.pdf[0].filename;
            }

            if (req.files && req.files.portada) {
                if (portadaFilename) {
                    const oldPortada = path.join(__dirname, '../public/uploads/portadas', portadaFilename);
                    if (fs.existsSync(oldPortada)) fs.unlinkSync(oldPortada);
                }
                portadaFilename = req.files.portada[0].filename;
            }

            await LibroModel.update({ id, titulo, descripcion, anio, pdfFilename, portadaFilename });
            await LibroModel.asociarAutores(id, autores);
            await LibroModel.asociarCategorias(id, categorias);

            await ReporteModel.registrarActividad({
                userId: req.usuario.id,
                accion: 'LIBRO_EDITADO',
                descripcion: `Libro editado: ${titulo}`
            });

            res.redirect('/admin/libros?success=libro_actualizado');
        } catch (error) {
            console.error('Error actualizando libro:', error.message);
            res.redirect(`/admin/libros/${req.params.id}/editar?error=error_servidor`);
        }
    },

    async eliminar(req, res) {
        try {
            const { id } = req.params;
            const libro = await LibroModel.getById(id);
            if (!libro) return res.redirect('/admin/libros');

            if (libro.archivo_url_libros) {
                const pdfPath = path.join(__dirname, '../public/uploads/pdfs', libro.archivo_url_libros);
                if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
            }
            if (libro.portada_url_libros) {
                const portadaPath = path.join(__dirname, '../public/uploads/portadas', libro.portada_url_libros);
                if (fs.existsSync(portadaPath)) fs.unlinkSync(portadaPath);
            }

            await LibroModel.delete(id);

            await ReporteModel.registrarActividad({
                userId: req.usuario.id,
                accion: 'LIBRO_ELIMINADO',
                descripcion: `Libro eliminado: ${libro.titulo_libros}`
            });

            res.redirect('/admin/libros?success=libro_eliminado');
        } catch (error) {
            console.error('Error eliminando libro:', error.message);
            res.redirect('/admin/libros');
        }
    }

};

module.exports = LibrosController;