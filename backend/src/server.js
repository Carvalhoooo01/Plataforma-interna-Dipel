require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const app     = express();

const allowedOrigins = [
  'http://localhost:5173',
  'https://plataforma-interna-dipel.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));

// Pula express.json() para rotas de upload de contrato (raw binary)
app.use((req, res, next) => {
  const isContratoUpload = req.method === 'POST' && req.path.includes('/contrato');
  if (isContratoUpload) return next();
  express.json()(req, res, next);
});
app.use((req, res, next) => {
  const isContratoUpload = req.method === 'POST' && req.path.includes('/contrato');
  if (isContratoUpload) return next();
  express.urlencoded({ extended: true })(req, res, next);
});

if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => { console.log(`[${req.method}] ${req.path}`); next(); });
}

app.use('/api', require('./routes/index'));
app.get('/health', (_req, res) => res.json({ status: 'ok', versao: '1.0.0' }));
app.use((_req, res) => res.status(404).json({ erro: 'Rota não encontrada' }));
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ erro: 'Erro interno' }); });

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
});