const { Pool } = require('pg');
require('dotenv').config();

const PGSQL = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

const connectPGSql = () => {
    PGSQL.connect(function (err) {
        if (err) {
            console.error('error connecting: ' + err.stack);
            return;
        }
        console.log('PGMySql connected as id ');
    });
}

module.exports = { connectPGSql, PGSQL }