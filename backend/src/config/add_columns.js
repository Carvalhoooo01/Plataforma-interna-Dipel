// Execute UMA VEZ: node src/config/add_columns.js
const pool = require('./database');

const run = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      ALTER TABLE tecnicos
        ADD COLUMN IF NOT EXISTS lat  DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS lng  DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS raio DOUBLE PRECISION;
    `);
    await client.query(`
      UPDATE tecnicos
      SET lat = -24.928906, lng = -53.405179, raio = 1200
      WHERE codigo = 'T001' AND lat IS NULL;
    `);
    await client.query('COMMIT');
    console.log('✅ Colunas lat/lng/raio adicionadas!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro:', err.message);
  } finally {
    client.release();
    process.exit(0);
  }
};
run();