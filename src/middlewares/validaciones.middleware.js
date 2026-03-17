// ── Helpers ───────────────────────────────────────────────────
const esEmailValido = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const esPasswordSegura = (pass) => pass.length >= 6;
const esAnioValido = (anio) => !anio || (Number(anio) >= 1000 && Number(anio) <= new Date().getFullYear() + 1);

const Validaciones = {

    // ── AUTENTICACIÓN ─────────────────────────────────────────────
    login(req, res, next) {
        const { email, password } = req.body;
        const errores = [];

        if (!email || email.trim() === '') {
            errores.push('El email es obligatorio');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errores.push('El email no tiene un formato válido');
        }

        if (!password || password.trim() === '') {
            errores.push('La contraseña es obligatoria');
        }

        if (errores.length > 0) {
            return res.render('auth/login', {
                title: 'Iniciar Sesión',
                layout: 'main',
                error: errores[0],
                email
            });
        }

        next();
    },

    registro(req, res, next) {
        const { nombre, email, password, confirmar_password } = req.body;
        const errores = [];

        if (!nombre || nombre.trim() === '') errores.push('El nombre es obligatorio');
        else if (nombre.trim().length < 3) errores.push('El nombre debe tener al menos 3 caracteres');

        if (!email || email.trim() === '') errores.push('El email es obligatorio');
        else if (!esEmailValido(email)) errores.push('El email no tiene un formato válido');

        if (!password || password.trim() === '') errores.push('La contraseña es obligatoria');
        else if (!esPasswordSegura(password)) errores.push('La contraseña debe tener al menos 6 caracteres');

        if (!confirmar_password || confirmar_password.trim() === '') errores.push('Debes confirmar la contraseña');
        else if (password !== confirmar_password) errores.push('Las contraseñas no coinciden');

        if (errores.length > 0) {
            return res.render('auth/registro', {
                title: 'Crear Cuenta',
                layout: 'main',
                error: errores[0],
                nombre, email
            });
        }
        next();
    },

    // ── LIBROS ────────────────────────────────────────────────────
    crearLibro(req, res, next) {
        const { titulo, anio } = req.body;
        const errores = [];

        if (!titulo || titulo.trim() === '') errores.push('El título del libro es obligatorio');
        else if (titulo.trim().length < 2) errores.push('El título debe tener al menos 2 caracteres');
        else if (titulo.trim().length > 200) errores.push('El título no puede superar 200 caracteres');

        if (!esAnioValido(anio)) errores.push(`El año debe estar entre 1000 y ${new Date().getFullYear() + 1}`);

        if (!req.files || !req.files.pdf) errores.push('El archivo PDF es obligatorio');
        else if (req.files.pdf[0].mimetype !== 'application/pdf') errores.push('El archivo debe ser en formato PDF');
        else if (req.files.pdf[0].size > 50 * 1024 * 1024) errores.push('El PDF no puede superar los 50MB');

        if (req.files && req.files.portada) {
            if (!req.files.portada[0].mimetype.startsWith('image/')) {
                errores.push('La portada debe ser una imagen (JPG, PNG, WEBP)');
            }
        }

        if (errores.length > 0) {
            return res.redirect(`/admin/libros/nuevo?error=${encodeURIComponent(errores[0])}`);
        }
        next();
    },

    editarLibro(req, res, next) {
        const { titulo, anio } = req.body;
        const errores = [];

        if (!titulo || titulo.trim() === '') errores.push('El título del libro es obligatorio');
        else if (titulo.trim().length < 2) errores.push('El título debe tener al menos 2 caracteres');
        else if (titulo.trim().length > 200) errores.push('El título no puede superar 200 caracteres');

        if (!esAnioValido(anio)) errores.push(`El año debe estar entre 1000 y ${new Date().getFullYear() + 1}`);

        if (req.files && req.files.pdf) {
            if (req.files.pdf[0].mimetype !== 'application/pdf') errores.push('El archivo debe ser en formato PDF');
            if (req.files.pdf[0].size > 50 * 1024 * 1024) errores.push('El PDF no puede superar los 50MB');
        }

        if (req.files && req.files.portada) {
            if (!req.files.portada[0].mimetype.startsWith('image/')) {
                errores.push('La portada debe ser una imagen (JPG, PNG, WEBP)');
            }
        }

        if (errores.length > 0) {
            return res.redirect(`/admin/libros/${req.params.id}/editar?error=${encodeURIComponent(errores[0])}`);
        }
        next();
    },

    // ── AUTORES ───────────────────────────────────────────────────
    autor(req, res, next) {
        const { nombre } = req.body;
        const errores = [];

        if (!nombre || nombre.trim() === '') errores.push('El nombre del autor es obligatorio');
        else if (nombre.trim().length < 2) errores.push('El nombre debe tener al menos 2 caracteres');
        else if (nombre.trim().length > 150) errores.push('El nombre no puede superar 150 caracteres');

        if (errores.length > 0) {
            const esEdicion = req.params.id !== undefined;
            return res.render(esEdicion ? 'admin/autores/editar' : 'admin/autores/nuevo', {
                title: esEdicion ? 'Editar Autor' : 'Nuevo Autor',
                layout: 'main',
                error: errores[0],
                autor: req.body,
                usuario: req.usuario
            });
        }
        next();
    },

    // ── CATEGORÍAS ────────────────────────────────────────────────
    categoria(req, res, next) {
        const { nombre } = req.body;
        const errores = [];

        if (!nombre || nombre.trim() === '') errores.push('El nombre de la categoría es obligatorio');
        else if (nombre.trim().length < 2) errores.push('El nombre debe tener al menos 2 caracteres');
        else if (nombre.trim().length > 100) errores.push('El nombre no puede superar 100 caracteres');

        if (errores.length > 0) {
            const esEdicion = req.params.id !== undefined;
            return res.render(esEdicion ? 'admin/categorias/editar' : 'admin/categorias/nuevo', {
                title: esEdicion ? 'Editar Categoría' : 'Nueva Categoría',
                layout: 'main',
                error: errores[0],
                categoria: req.body,
                usuario: req.usuario
            });
        }
        next();
    },

    // ── USUARIOS ──────────────────────────────────────────────────
    crearUsuario(req, res, next) {
        const { nombre, email, password, id_roles } = req.body;
        const errores = [];

        if (!nombre || nombre.trim() === '') errores.push('El nombre es obligatorio');
        else if (nombre.trim().length < 3) errores.push('El nombre debe tener al menos 3 caracteres');

        if (!email || email.trim() === '') errores.push('El email es obligatorio');
        else if (!esEmailValido(email)) errores.push('El email no tiene un formato válido');

        if (!password || password.trim() === '') errores.push('La contraseña es obligatoria');
        else if (!esPasswordSegura(password)) errores.push('La contraseña debe tener al menos 6 caracteres');

        if (!id_roles) errores.push('Debes seleccionar un rol');

        if (errores.length > 0) {
            return res.redirect(`/admin/usuarios/nuevo?error=${encodeURIComponent(errores[0])}`);
        }
        next();
    },

    editarUsuario(req, res, next) {
        const { nombre, email, password, id_roles } = req.body;
        const errores = [];

        if (!nombre || nombre.trim() === '') errores.push('El nombre es obligatorio');
        else if (nombre.trim().length < 3) errores.push('El nombre debe tener al menos 3 caracteres');

        if (!email || email.trim() === '') errores.push('El email es obligatorio');
        else if (!esEmailValido(email)) errores.push('El email no tiene un formato válido');

        if (password && password.trim() !== '' && !esPasswordSegura(password)) {
            errores.push('La nueva contraseña debe tener al menos 6 caracteres');
        }

        if (!id_roles) errores.push('Debes seleccionar un rol');

        if (errores.length > 0) {
            return res.redirect(`/admin/usuarios/${req.params.id}/editar?error=${encodeURIComponent(errores[0])}`);
        }
        next();
    }

};

module.exports = Validaciones;