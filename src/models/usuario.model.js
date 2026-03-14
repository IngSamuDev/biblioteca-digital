const pool = require('../config/db');

const UsuarioModel = {

    async findByEmail(email) {
        const { rows } = await pool.query(
            `SELECT u.*, r.nombre_roles 
       FROM usuarios u
       JOIN roles r ON u.id_roles = r.id_roles
       WHERE u.email_usuarios = $1 AND u.estado_usuarios = TRUE`,
            [email]
        );
        return rows[0] || null;
    },

    async findById(id) {
        const { rows } = await pool.query(
            `SELECT u.*, r.nombre_roles 
       FROM usuarios u
       JOIN roles r ON u.id_roles = r.id_roles
       WHERE u.id_usuarios = $1 AND u.estado_usuarios = TRUE`,
            [id]
        );
        return rows[0] || null;
    },

    async create({ nombre, email, password }) {
        const { rows: rol } = await pool.query(
            `SELECT id_roles FROM roles WHERE nombre_roles = 'lector'`
        );
        const { rows } = await pool.query(
            `INSERT INTO usuarios (nombre_usuarios, email_usuarios, password_usuarios, id_roles)
       VALUES ($1, $2, $3, $4)
       RETURNING id_usuarios, nombre_usuarios, email_usuarios, id_roles`,
            [nombre, email, password, rol[0].id_roles]
        );
        return rows[0];
    },

    async emailExiste(email) {
        const { rows } = await pool.query(
            `SELECT id_usuarios FROM usuarios WHERE email_usuarios = $1`,
            [email]
        );
        return rows.length > 0;
    }

};

module.exports = UsuarioModel;