const pool = require('../config/db');

const AutorModel = {

    async getAll() {
        const { rows } = await pool.query(`
      SELECT a.*, COUNT(la.id_libros) AS total_libros
      FROM autores a
      LEFT JOIN libro_autor la ON a.id_autores = la.id_autores
      GROUP BY a.id_autores
      ORDER BY a.nombre_autores ASC
    `);
        return rows;
    },

    async getById(id) {
        const { rows } = await pool.query(
            `SELECT * FROM autores WHERE id_autores = $1`, [id]
        );
        return rows[0] || null;
    },

    async create({ nombre, nacionalidad }) {
        await pool.query(
            `INSERT INTO autores (nombre_autores, nacionalidad_autores) VALUES ($1, $2)`,
            [nombre, nacionalidad || null]
        );
    },

    async update({ id, nombre, nacionalidad }) {
        await pool.query(
            `UPDATE autores SET nombre_autores = $1, nacionalidad_autores = $2 WHERE id_autores = $3`,
            [nombre, nacionalidad || null, id]
        );
    },

    async delete(id) {
        await pool.query(`DELETE FROM autores WHERE id_autores = $1`, [id]);
    }

};

module.exports = AutorModel;