const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'dipelnet',
  user:     process.env.DB_USER     || 'postgres',
  password: String(process.env.DB_PASSWORD || '123'),
});

pool.on('connect', () => console.log('✅ Conectado ao PostgreSQL'));
pool.on('error',   (err) => { console.error('❌ Erro PostgreSQL:', err); process.exit(-1); });

module.exports = pool;