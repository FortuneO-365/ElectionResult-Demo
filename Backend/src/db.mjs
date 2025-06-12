import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const {
    DB_HOST,
    DB_USER,
    DB_PASSWORD,
    DB_NAME
} = process.env;

const pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME ,
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}); 

pool.on('error', (err) => {
    console.error('Database connection error:', err);
});

export default pool.promise();