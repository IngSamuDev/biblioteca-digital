const { Pool } = require('pg');
require('dotenv').config();

let pool;

if (process.env.DATABASE_URL) {
    // Railway — usa DATABASE_URL directamente
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        options: `-c search_path=${process.env.DB_SCHEMA || 'biblioteca'}`
    });
} else {
    // Local
    pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        options: `-c search_path=${process.env.DB_SCHEMA}`
    });
}

pool.connect((err, client, release) => {
    if (err) {
        console.error('Error conectando a PostgreSQL:', err.message);
        return;
    }
    release();
    console.log('Conectado a PostgreSQL correctamente');
});

module.exports = pool;