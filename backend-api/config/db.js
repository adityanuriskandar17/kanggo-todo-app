const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });
require('dotenv').config({ path: '.env' });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'bosani',
  password: process.env.DB_PASSWORD || '1234567890',
  database: process.env.DB_DATABASE || 'kanggo_db',
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
