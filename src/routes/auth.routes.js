const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');

// ── Rutas normales ────────────────────────────────────────────
router.get('/login', AuthController.showLogin);
router.post('/login', AuthController.login);
router.get('/registro', AuthController.showRegistro);
router.post('/registro', AuthController.registro);
router.get('/logout', AuthController.logout);

// ── Google LOGIN ──────────────────────────────────────────────
router.get('/google/login',
    passport.authenticate('google-login', { scope: ['profile', 'email'] })
);

router.get('/google/login/callback',
    passport.authenticate('google-login', {
        failureRedirect: '/auth/login?error=no_registrado'
    }),
    (req, res) => {
        const token = jwt.sign(
            {
                id: req.user.id_usuarios,
                nombre: req.user.nombre_usuarios,
                email: req.user.email_usuarios,
                rol: req.user.nombre_roles
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000
        });
        if (req.user.nombre_roles === 'administrador') return res.redirect('/admin/dashboard');
        if (req.user.nombre_roles === 'bibliotecario') return res.redirect('/biblioteca/dashboard');
        return res.redirect('/');
    }
);

// ── Google REGISTRO ───────────────────────────────────────────
router.get('/google/registro',
    passport.authenticate('google-registro', { scope: ['profile', 'email'] })
);

router.get('/google/registro/callback',
    passport.authenticate('google-registro', {
        failureRedirect: '/auth/registro?error=ya_registrado'
    }),
    (req, res) => {
        const token = jwt.sign(
            {
                id: req.user.id_usuarios,
                nombre: req.user.nombre_usuarios,
                email: req.user.email_usuarios,
                rol: req.user.nombre_roles
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
    }
);

module.exports = router;