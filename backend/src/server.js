require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');
const app       = express();

app.set('trust proxy', 1);  // ← ADICIONA AQUI

const allowedOrigins = [
  'http://localhost:5173',
  'https://plataforma-interna-dipel.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));
// ... resto igual
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── RATE LIMITING ─────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: { erro: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { erro: 'Muitas requisições. Tente novamente em instantes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', generalLimiter);
app.use('/api/auth/login', loginLimiter);

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
