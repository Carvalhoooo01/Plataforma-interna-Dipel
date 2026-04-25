require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const app     = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

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
