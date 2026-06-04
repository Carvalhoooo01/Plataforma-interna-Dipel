const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => console.log('✅ Conectado ao PostgreSQL'));
pool.on('error',   (err) => { console.error('❌ Erro PostgreSQL:', err); process.exit(-1); });

module.exports = pool;
