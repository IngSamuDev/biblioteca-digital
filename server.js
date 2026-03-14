require('dotenv').config();
const app = require('./src/app');
const initDB = require('./src/config/initDB');

const PORT = process.env.PORT || 3000;

const start = async () => {
    await initDB();
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en puerto ${PORT}`);
    });
};

start();