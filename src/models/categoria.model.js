const pool = require('../config/db');

const CategoriaModel = {

    async getAll() {
        const { rows } = await pool.query(`
      SELECT c.*, COUNT(lc.id_libros) AS total_libros
      FROM categorias c
      LEFT JOIN libro_categoria lc ON c.id_categorias = lc.id_categorias
      GROUP BY c.id_categorias
      ORDER BY c.nombre_categorias ASC
    `);
        return rows;
    },

    async getById(id) {
        const { rows } = await pool.query(
            `SELECT * FROM categorias WHERE id_categorias = $1`, [id]
        );
        return rows[0] || null;
    },

    async create({ nombre, descripcion }) {
        await pool.query(
            `INSERT INTO categorias (nombre_categorias, descripcion_categorias) VALUES ($1, $2)`,
            [nombre, descripcion || null]
        );
    },

    async update({ id, nombre, descripcion }) {
        await pool.query(
            `UPDATE categorias SET nombre_categorias = $1, descripcion_categorias = $2 WHERE id_categorias = $3`,
            [nombre, descripcion || null, id]
        );
    },

    async delete(id) {
        await pool.query(`DELETE FROM categorias WHERE id_categorias = $1`, [id]);
    }

};

module.exports = CategoriaModel;