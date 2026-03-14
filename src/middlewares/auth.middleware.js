const jwt = require('jsonwebtoken');

const AuthMiddleware = {

    verificarToken(req, res, next) {
        const token = req.cookies.token;
        if (!token) {
            return res.redirect('/auth/login');
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.usuario = decoded;
            next();
        } catch (error) {
            res.clearCookie('token');
            return res.redirect('/auth/login');
        }
    },

    cargarUsuario(req, res, next) {
        const token = req.cookies.token;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.usuario = decoded;
                res.locals.usuario = decoded;
                res.locals.estaLogueado = true;
                res.locals.esAdmin = decoded.rol === 'administrador';
                res.locals.esBibliotecario = decoded.rol === 'bibliotecario';
                res.locals.esLector = decoded.rol === 'lector';
            } catch {
                res.clearCookie('token');
            }
        } else {
            res.locals.estaLogueado = false;
        }
        next();
    },

    soloAdmin(req, res, next) {
        if (!req.usuario || req.usuario.rol !== 'administrador') {
            return res.status(403).render('error', {
                title: 'Acceso denegado',
                mensaje: 'Solo el administrador puede acceder a esta sección',
                layout: 'main'
            });
        }
        next();
    },

    soloStaff(req, res, next) {
        const rolesPermitidos = ['administrador', 'bibliotecario'];
        if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).render('error', {
                title: 'Acceso denegado',
                mensaje: 'No tienes permisos para acceder a esta sección',
                layout: 'main'
            });
        }
        next();
    }

};

module.exports = AuthMiddleware;