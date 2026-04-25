const jwt  = require('jsonwebtoken');
const pool = require('../config/database');

const autenticar = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ erro: 'Token não fornecido' });
    const payload = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    const { rows } = await pool.query(
      `SELECT u.id, u.nome, u.email, u.role, u.setor_id, s.nome as setor_nome
       FROM usuarios u LEFT JOIN setores s ON s.id = u.setor_id
       WHERE u.id=$1 AND u.ativo=TRUE`, [payload.id]
    );
    if (!rows.length) return res.status(401).json({ erro: 'Usuário inativo' });
    req.usuario = rows[0];
    next();
  } catch { return res.status(401).json({ erro: 'Token inválido' }); }
};

const autorizar = (...roles) => (req, res, next) => {
  if (!roles.includes(req.usuario.role))
    return res.status(403).json({ erro: 'Acesso negado' });
  next();
};

module.exports = { autenticar, autorizar };
