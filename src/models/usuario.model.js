const pool = require('../config/db');

const UsuarioModel = {

    // Buscar por email SIN filtrar por estado (para login)
    async findByEmailSinFiltro(email) {
        const { rows } = await pool.query(
            `SELECT u.*, r.nombre_roles 
       FROM usuarios u
       JOIN roles r ON u.id_roles = r.id_roles
       WHERE u.email_usuarios = $1`,
            [email]
        );
        return rows[0] || null;
    },

    // Buscar por email solo usuarios activos
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

    // Buscar por ID solo usuarios activos
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

    // Crear nuevo usuario lector
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

    // Verificar si email ya existe
    async emailExiste(email) {
        const { rows } = await pool.query(
            `SELECT id_usuarios FROM usuarios WHERE email_usuarios = $1`,
            [email]
        );
        return rows.length > 0;
    },

    // Obtener últimos usuarios registrados
    async getUltimos(limite = 5) {
        const { rows } = await pool.query(`
      SELECT u.id_usuarios, u.nombre_usuarios, u.email_usuarios,
             u.fecha_creacion_usuarios, u.estado_usuarios, r.nombre_roles
      FROM usuarios u
      JOIN roles r ON u.id_roles = r.id_roles
      ORDER BY u.fecha_creacion_usuarios DESC
      LIMIT $1
    `, [limite]);
        return rows;
    },

    // Obtener todos los usuarios
    async getAll() {
        const { rows } = await pool.query(`
      SELECT u.*, r.nombre_roles
      FROM usuarios u
      JOIN roles r ON u.id_roles = r.id_roles
      ORDER BY u.fecha_creacion_usuarios DESC
    `);
        return rows;
    },

    // Obtener usuario por ID sin filtrar estado (para admin)
    async findByIdAdmin(id) {
        const { rows } = await pool.query(
            `SELECT u.*, r.nombre_roles 
       FROM usuarios u
       JOIN roles r ON u.id_roles = r.id_roles
       WHERE u.id_usuarios = $1`,
            [id]
        );
        return rows[0] || null;
    },

    // Verificar si email existe en otro usuario (para edición)
    async emailExisteEnOtro(email, id) {
        const { rows } = await pool.query(
            `SELECT id_usuarios FROM usuarios 
       WHERE email_usuarios = $1 AND id_usuarios != $2`,
            [email, id]
        );
        return rows.length > 0;
    },

    // Obtener todos los roles
    async getRoles() {
        const { rows } = await pool.query(
            `SELECT * FROM roles ORDER BY nombre_roles`
        );
        return rows;
    }

};

module.exports = UsuarioModel;