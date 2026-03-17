const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const V = require('../middlewares/validaciones.middleware');

// ── Rutas normales ────────────────────────────────────────────
router.get('/login', AuthController.showLogin);
router.post('/login', V.login, AuthController.login);
router.get('/registro', AuthController.showRegistro);
router.post('/registro', V.registro, AuthController.registro);
router.get('/logout', AuthController.logout);

// ── Google LOGIN ──────────────────────────────────────────────
router.get('/google/login',
    passport.authenticate('google-login', { scope: ['profile', 'email'] })
);

router.get('/google/login/callback',
    (req, res, next) => {
        passport.authenticate('google-login', (err, user, info) => {
            if (err) return next(err);

            if (!user) {
                if (info && info.message === 'desactivado') {
                    return res.redirect('/auth/login?error=desactivado');
                }
                return res.redirect('/auth/login?error=no_registrado');
            }

            req.logIn(user, (err) => {
                if (err) return next(err);

                const token = jwt.sign(
                    {
                        id: user.id_usuarios,
                        nombre: user.nombre_usuarios,
                        email: user.email_usuarios,
                        rol: user.nombre_roles
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: process.env.JWT_EXPIRES_IN }
                );

                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 24 * 60 * 60 * 1000
                });

                if (user.nombre_roles === 'administrador') return res.redirect('/admin/dashboard');
                if (user.nombre_roles === 'bibliotecario') return res.redirect('/biblioteca/dashboard');
                return res.redirect('/');
            });
        })(req, res, next);
    }
);

// ── Google REGISTRO ───────────────────────────────────────────
router.get('/google/registro',
    passport.authenticate('google-registro', { scope: ['profile', 'email'] })
);

router.get('/google/registro/callback',
    (req, res, next) => {
        passport.authenticate('google-registro', (err, user, info) => {
            if (err) return next(err);

            if (!user) {
                if (info && info.message === 'ya_registrado') {
                    return res.redirect('/auth/registro?error=ya_registrado');
                }
                return res.redirect('/auth/registro?error=error');
            }

            req.logIn(user, (err) => {
                if (err) return next(err);

                const token = jwt.sign(
                    {
                        id: user.id_usuarios,
                        nombre: user.nombre_usuarios,
                        email: user.email_usuarios,
                        rol: user.nombre_roles
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: process.env.JWT_EXPIRES_IN }
                );

                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 24 * 60 * 60 * 1000
                });

                return res.redirect('/');
            });
        })(req, res, next);
    }
);

module.exports = router;