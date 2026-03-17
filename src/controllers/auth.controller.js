const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/usuario.model');

const AuthController = {

    showLogin(req, res) {
        const success = req.query.registro === 'exitoso'
            ? 'Cuenta creada exitosamente. Inicia sesión.' : null;

        let error = null;
        if (req.query.error === 'no_registrado') error = 'No tienes cuenta. Por favor regístrate primero.';
        if (req.query.error === 'desactivado') error = '⚠️ Tu cuenta está desactivada. Contacta al administrador.';

        res.render('auth/login', {
            title: 'Iniciar Sesión',
            layout: 'main',
            success,
            error
        });
    },

    showRegistro(req, res) {
        let error = null;
        if (req.query.error === 'ya_registrado') error = 'Este email ya está registrado. Inicia sesión.';

        res.render('auth/registro', {
            title: 'Crear Cuenta',
            layout: 'main',
            error
        });
    },

    async login(req, res) {
        try {
            const { email, password } = req.body;

            const usuario = await UsuarioModel.findByEmailSinFiltro(email);

            if (!usuario) {
                return res.render('auth/login', {
                    title: 'Iniciar Sesión',
                    error: 'Credenciales incorrectas',
                    email
                });
            }

            // Usuario inactivo
            if (!usuario.estado_usuarios) {
                return res.render('auth/login', {
                    title: 'Iniciar Sesión',
                    error: '⚠️ Tu cuenta está desactivada. Contacta al administrador.',
                    email
                });
            }

            // Cuenta de Google
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

    async registro(req, res) {
        try {
            const { nombre, email, password } = req.body;

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

    logout(req, res) {
        res.clearCookie('token');
        res.redirect('/');
    }

};

module.exports = AuthController;