const pool = require('./db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const initDB = async () => {
    const client = await pool.connect();
    try {

        // 👇 ESTA LÍNEA SOLUCIONA TODO
        await client.query(`SET search_path TO ${process.env.DB_SCHEMA || 'biblioteca'}`);

        console.log('🔧 Verificando datos iniciales...');

        await client.query(`
        INSERT INTO roles (nombre_roles, descripcion_roles) VALUES
        ('administrador', 'Control total del sistema'),
        ('bibliotecario', 'Gestión de libros y catálogo'),
        ('lector', 'Consulta y lectura de libros')
        ON CONFLICT (nombre_roles) DO NOTHING;
        `);

        const { rows: adminRol } = await client.query(
            `SELECT id_roles FROM roles WHERE nombre_roles = 'administrador'`
        );

        const { rows: existeAdmin } = await client.query(
            `SELECT id_usuarios FROM usuarios WHERE email_usuarios = $1`,
            [process.env.ADMIN_EMAIL]
        );

        if (existeAdmin.length === 0) {
            const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

            await client.query(
                `INSERT INTO usuarios (nombre_usuarios, email_usuarios, password_usuarios, id_roles)
                 VALUES ($1,$2,$3,$4)`,
                [
                    process.env.ADMIN_NOMBRE,
                    process.env.ADMIN_EMAIL,
                    hash,
                    adminRol[0].id_roles
                ]
            );

            console.log(`Admin creado: ${process.env.ADMIN_EMAIL}`);
        } else {
            console.log(`Admin ya existe: ${process.env.ADMIN_EMAIL}`);
        }

        console.log('Datos iniciales verificados correctamente');

    } catch (error) {
        console.error('Error en initDB:', error.message);
        throw error;
    } finally {
        client.release();
    }
};

module.exports = initDB;