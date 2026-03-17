const LibroModel = require('../models/libro.model');
const CategoriaModel = require('../models/categoria.model');
const DescargaModel = require('../models/descarga.model');
const path = require('path');

const CatalogoController = {

    async index(req, res) {
        try {
            const { buscar, categoria, ordenar } = req.query;
            const libros = await LibroModel.buscar({ buscar, categoria, ordenar });
            const categorias = await CategoriaModel.getAll();

            res.render('catalogo/index', {
                title: 'Catálogo de Libros',
                layout: 'main',
                libros: libros.map(l => ({
                    ...l,
                    portada: l.portada_url_libros ? `/uploads/portadas/${l.portada_url_libros}` : null,
                    descripcion_corta: l.descripcion_libros ? l.descripcion_libros.substring(0, 100) + '...' : 'Sin descripción'
                })),
                categorias,
                buscar: buscar || '',
                categoriaSeleccionada: categoria || '',
                ordenar: ordenar || 'fecha_desc',
                totalLibros: libros.length
            });
        } catch (error) {
            console.error('Error en catálogo:', error.message);
            res.render('catalogo/index', { title: 'Catálogo', libros: [], categorias: [], totalLibros: 0 });
        }
    },

    async detalle(req, res) {
        try {
            const { id } = req.params;
            const libro = await LibroModel.getById(id);
            if (!libro) return res.redirect('/catalogo');

            const relacionados = await LibroModel.getRelacionados(id);

            res.render('catalogo/detalle', {
                title: libro.titulo_libros,
                layout: 'main',
                libro: { ...libro, portada: libro.portada_url_libros ? `/uploads/portadas/${libro.portada_url_libros}` : null },
                relacionados: relacionados.map(r => ({ ...r, portada: r.portada_url_libros ? `/uploads/portadas/${r.portada_url_libros}` : null })),
                usuario: req.usuario
            });
        } catch (error) {
            console.error('Error en detalle:', error.message);
            res.redirect('/catalogo');
        }
    },

    async verPDF(req, res) {
        try {
            const { id } = req.params;
            const libro = await LibroModel.getById(id);
            if (!libro) return res.redirect('/catalogo');

            await DescargaModel.registrarVisualizacion({ userId: req.usuario.id, libroId: id });

            res.render('catalogo/visor', {
                title: `Leyendo: ${libro.titulo_libros}`,
                layout: 'main',
                libro: { ...libro, pdfUrl: `/uploads/pdfs/${libro.archivo_url_libros}` },
                usuario: req.usuario
            });
        } catch (error) {
            console.error('Error en visor PDF:', error.message);
            res.redirect('/catalogo');
        }
    },

    async descargar(req, res) {
        try {
            const { id } = req.params;
            const libro = await LibroModel.getById(id);
            if (!libro) return res.redirect('/catalogo');

            await DescargaModel.registrar({ userId: req.usuario.id, libroId: id });

            const filePath = path.join(__dirname, '../public/uploads/pdfs', libro.archivo_url_libros);
            res.download(filePath, `${libro.titulo_libros}.pdf`);
        } catch (error) {
            console.error('Error en descarga:', error.message);
            res.redirect('/catalogo');
        }
    }

};

module.exports = CatalogoController;