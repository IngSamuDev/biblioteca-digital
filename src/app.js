const express = require('express');
const { engine } = require('express-handlebars');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const passport = require('./config/passport');
const { cargarUsuario } = require('./middlewares/auth.middleware');

const app = express();

// ── Motor de plantillas Handlebars ────────────────────────────
app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views/layouts'),
    partialsDir: path.join(__dirname, 'views/partials'),
    helpers: {
        eq: (a, b) => a === b,
        currentYear: () => new Date().getFullYear(),
        toString: (val) => String(val),
        gte: (a, b) => a >= b,
        lte: (a, b) => a <= b
    }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// ── Middlewares globales ──────────────────────────────────────
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Sesión para passport ──────────────────────────────────────
app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// ── Passport ──────────────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

// ── Cargar usuario en todas las vistas ───────────────────────
app.use(cargarUsuario);

// ── Archivos estáticos ────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Rutas ─────────────────────────────────────────────────────
app.use('/auth', require('./routes/auth.routes'));
app.use('/admin', require('./routes/admin.routes'));
app.use('/admin/libros', require('./routes/libros.routes'));
app.use('/admin/autores', require('./routes/autores.routes'));
app.use('/admin/categorias', require('./routes/categorias.routes'));
app.use('/admin/usuarios', require('./routes/usuarios.routes'));
app.use('/admin/reportes', require('./routes/reportes.routes'));
app.use('/biblioteca', require('./routes/biblioteca.routes'));
app.use('/catalogo', require('./routes/catalogo.routes'));
app.use('/', require('./routes/index.routes'));

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).render('error', {
        title: 'Página no encontrada',
        mensaje: 'La página que buscas no existe.',
        layout: 'main'
    });
});

module.exports = app;