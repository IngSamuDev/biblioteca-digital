const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./db');
require('dotenv').config();

const schema = process.env.DB_SCHEMA || 'biblioteca';

// ── Estrategia LOGIN ──────────────────────────────────────────
passport.use('google-login', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/login/callback'
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails[0].value;

            const { rows } = await pool.query(
                `SELECT u.*, r.nombre_roles 
       FROM ${schema}.usuarios u
       JOIN ${schema}.roles r ON u.id_roles = r.id_roles
       WHERE u.email_usuarios = $1`,
                [email]
            );

            if (rows.length === 0) {
                return done(null, false, { message: 'no_registrado' });
            }

            if (!rows[0].estado_usuarios) {
                return done(null, false, { message: 'desactivado' });
            }

            return done(null, rows[0]);

        } catch (error) {
            console.error('Error en google-login:', error.message);
            return done(error, null);
        }
    }));

// ── Estrategia REGISTRO ───────────────────────────────────────
passport.use('google-registro', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/registro/callback'
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails[0].value;
            const nombre = profile.displayName;

            const { rows: existe } = await pool.query(
                `SELECT id_usuarios FROM ${schema}.usuarios WHERE email_usuarios = $1`,
                [email]
            );

            if (existe.length > 0) {
                return done(null, false, { message: 'ya_registrado' });
            }

            const { rows: rol } = await pool.query(
                `SELECT id_roles FROM ${schema}.roles WHERE nombre_roles = 'lector'`
            );

            const { rows: nuevo } = await pool.query(
                `INSERT INTO ${schema}.usuarios 
        (nombre_usuarios, email_usuarios, password_usuarios, id_roles)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
                [nombre, email, 'GOOGLE_AUTH', rol[0].id_roles]
            );

            const { rows: nuevoConRol } = await pool.query(
                `SELECT u.*, r.nombre_roles 
       FROM ${schema}.usuarios u
       JOIN ${schema}.roles r ON u.id_roles = r.id_roles
       WHERE u.id_usuarios = $1`,
                [nuevo[0].id_usuarios]
            );

            await pool.query(
                `INSERT INTO ${schema}.actividad_sistema 
        (id_usuarios, accion_actividad_sistema, descripcion_actividad_sistema)
       VALUES ($1, $2, $3)`,
                [nuevoConRol[0].id_usuarios, 'REGISTRO_GOOGLE', `Nuevo usuario registrado via Google: ${email}`]
            );

            return done(null, nuevoConRol[0]);

        } catch (error) {
            console.error('Error en google-registro:', error.message);
            return done(error, null);
        }
    }));

passport.serializeUser((user, done) => {
    done(null, user.id_usuarios);
});

passport.deserializeUser(async (id, done) => {
    try {
        const { rows } = await pool.query(
            `SELECT u.*, r.nombre_roles
       FROM ${schema}.usuarios u
       JOIN ${schema}.roles r ON u.id_roles = r.id_roles
       WHERE u.id_usuarios = $1`,
            [id]
        );
        done(null, rows[0]);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;