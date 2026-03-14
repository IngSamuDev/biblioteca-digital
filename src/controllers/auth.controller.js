const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/usuario.model');

const AuthController = {

    // ── Mostrar formulario de login ──────────────────────────────
    showLogin(req, res) {
        const success = req.query.registro === 'exitoso'
            ? 'Cuenta creada exitosamente. Inicia sesión.' : null;

        const error = req.query.error === 'no_registrado'
            ? 'No tienes cuenta. Por favor regístrate primero.' : null;

        res.render('auth/login', {
            title: 'Iniciar Sesión',
            layout: 'main',
            success,
            error
        });
    },

    // ── Mostrar formulario de registro ───────────────────────────
    showRegistro(req, res) {
        const error = req.query.error === 'ya_registrado'
            ? 'Este email ya está registrado. Inicia sesión.' : null;

        res.render('auth/registro', {
            title: 'Crear Cuenta',
            layout: 'main',
            error
        });
    },

    // ── Procesar login (RF2, RF4) ────────────────────────────────
    async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.render('auth/login', {
                    title: 'Iniciar Sesión',
                    error: 'Email y contraseña son obligatorios',
                    email
                });
            }

            const usuario = await UsuarioModel.findByEmail(email);
            if (!usuario) {
                return res.render('auth/login', {
                    title: 'Iniciar Sesión',
                    error: 'Credenciales incorrectas',
                    email
                });
            }

            // Verificar que no sea cuenta de Google
            if (usuario.password_usuarios === 'GOOGLE_AUTH') {
                return res.render('auth/login', {
                    title: 'Iniciar Sesión',
                    error: 'Esta cuenta usa Google. Inicia sesión con el botón de Google.',
                    email
                });
            }

            const passwordValida = await bcrypt.compare(password, usuario.password_usuarios);
            if (!passwordValida) {
                return res.render('auth/login', {
                    title: 'Iniciar Sesión',
                    error: 'Credenciales incorrectas',
                    email
                });
            }

            const token = jwt.sign(
                {
                    id: usuario.id_usuarios,
                    nombre: usuario.nombre_usuarios,
                    email: usuario.email_usuarios,
                    rol: usuario.nombre_roles
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000
            });

            if (usuario.nombre_roles === 'administrador') return res.redirect('/admin/dashboard');
            if (usuario.nombre_roles === 'bibliotecario') return res.redirect('/biblioteca/dashboard');
            return res.redirect('/');

        } catch (error) {
            console.error('Error en login:', error.message);
            res.render('auth/login', {
                title: 'Iniciar Sesión',
                error: 'Error interno del servidor'
            });
        }
    },

    // ── Procesar registro (RF1, RF3) ─────────────────────────────
    async registro(req, res) {
        try {
            const { nombre, email, password, confirmar_password } = req.body;

            if (!nombre || !email || !password || !confirmar_password) {
                return res.render('auth/registro', {
                    title: 'Crear Cuenta',
                    error: 'Todos los campos son obligatorios',
                    nombre, email
                });
            }

            if (password !== confirmar_password) {
                return res.render('auth/registro', {
                    title: 'Crear Cuenta',
                    error: 'Las contraseñas no coinciden',
                    nombre, email
                });
            }

            if (password.length < 6) {
                return res.render('auth/registro', {
                    title: 'Crear Cuenta',
                    error: 'La contraseña debe tener al menos 6 caracteres',
                    nombre, email
                });
            }

            const existe = await UsuarioModel.emailExiste(email);
            if (existe) {
                return res.render('auth/registro', {
                    title: 'Crear Cuenta',
                    error: 'Este email ya está registrado',
                    nombre, email
                });
            }

            const hash = await bcrypt.hash(password, 10);
            await UsuarioModel.create({ nombre, email, password: hash });
            return res.redirect('/');

        } catch (error) {
            console.error('Error en registro:', error.message);
            res.render('auth/registro', {
                title: 'Crear Cuenta',
                error: 'Error interno del servidor'
            });
        }
    },

    // ── Cerrar sesión (RF5) ──────────────────────────────────────
    logout(req, res) {
        res.clearCookie('token');
        res.redirect('/');
    }

};

module.exports = AuthController;