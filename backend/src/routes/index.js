const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const pool     = require('../config/database');
const { autenticar, autorizar } = require('../middleware/auth');
const fs     = require('fs');
const path   = require('path');
const https2 = require('https');
const crypto = require('crypto');

const r = express.Router();

// ── BAIRROS CASCAVEL (GeoJSON Oficial IBGE) ───────────
let BAIRROS_GEOJSON = {};
try {
  const geoData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/bairros_cascavel.geojson'), 'utf8'));
  geoData.features.forEach(f => {
    const nome = f.properties.NM_BAIRRO;
    if (nome && f.geometry) {
      BAIRROS_GEOJSON[nome] = f.geometry;
      // aliases sem acento
      const nSA = nome.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      if (nSA !== nome) BAIRROS_GEOJSON[nSA] = f.geometry;
    }
  });
  console.log('[GEO] Bairros carregados:', Object.keys(BAIRROS_GEOJSON).filter(k => !k.includes('normalized')).length);
} catch(e) {
  console.log('[GEO] GeoJSON não encontrado:', e.message);
}

function centerOf(geometry) {
  try {
    const coords = geometry.type === 'Polygon'
      ? geometry.coordinates[0]
      : geometry.type === 'MultiPolygon'
        ? geometry.coordinates[0][0]
        : [];
    const lats = coords.map(c => c[1]);
    const lngs = coords.map(c => c[0]);
    return {
      center_lat: lats.reduce((a,b)=>a+b,0)/lats.length,
      center_lng: lngs.reduce((a,b)=>a+b,0)/lngs.length,
    };
  } catch { return {}; }
}

const temPermissao = (usuario, permissao) => {
  if (!usuario) return false;
  if (['admin','gestor'].includes(usuario.role)) return true;
  const perms = usuario.permissoes || {};
  return perms[permissao] === true;
};

// ── CLOUDINARY HELPERS ────────────────────────────────
const CLOUD_NAME = 'dinfzopjh';
const API_KEY    = '754394543815596';

// ── AUTH ─────────────────────────────────────────────
r.post('/auth/login', async (req, res) => {
  const ip        = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ erro: 'E-mail e senha obrigatórios' });
    const { rows } = await pool.query(
      `SELECT u.*, s.nome as setor_nome FROM usuarios u LEFT JOIN setores s ON s.id=u.setor_id WHERE u.email=$1 AND u.ativo=TRUE`,
      [email.toLowerCase().trim()]
    );
    if (!rows.length) {
      await pool.query('INSERT INTO logs_acesso (email, acao, ip, user_agent, sucesso) VALUES ($1,$2,$3,$4,FALSE)', [email, 'login', ip, userAgent]).catch(()=>{});
      return res.status(401).json({ erro: 'E-mail ou senha incorretos' });
    }
    const ok = await bcrypt.compare(senha, rows[0].senha_hash);
    if (!ok) {
      await pool.query('INSERT INTO logs_acesso (usuario_id, email, acao, ip, user_agent, sucesso) VALUES ($1,$2,$3,$4,$5,FALSE)', [rows[0].id, email, 'login', ip, userAgent]).catch(()=>{});
      return res.status(401).json({ erro: 'E-mail ou senha incorretos' });
    }
    await pool.query('UPDATE usuarios SET ultimo_login=NOW() WHERE id=$1', [rows[0].id]);
    await pool.query('INSERT INTO logs_acesso (usuario_id, email, acao, ip, user_agent, sucesso) VALUES ($1,$2,$3,$4,$5,TRUE)', [rows[0].id, email, 'login', ip, userAgent]).catch(()=>{});
    const token = jwt.sign({ id: rows[0].id, role: rows[0].role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
    delete rows[0].senha_hash;
    res.json({ token, usuario: rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ erro: 'Erro interno' }); }
});

r.get('/auth/me', autenticar, (req, res) => res.json({ usuario: req.usuario }));

// ── LOGS DE ACESSO ────────────────────────────────────
r.get('/logs', autenticar, autorizar('admin','gestor'), async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = parseInt(req.query.offset) || 0;
    const { rows } = await pool.query(
      `SELECT l.id, l.email, l.acao, l.ip, l.sucesso, l.criado_em, u.nome as usuario_nome, u.role
       FROM logs_acesso l LEFT JOIN usuarios u ON u.id=l.usuario_id
       ORDER BY l.criado_em DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json(rows);
  } catch { res.status(500).json({ erro: 'Erro ao listar logs' }); }
});

r.post('/auth/trocar-senha', autenticar, async (req, res) => {
  try {
    const { senha_atual, nova_senha } = req.body;
    if (!nova_senha || nova_senha.length < 6) return res.status(400).json({ erro: 'Nova senha deve ter pelo menos 6 caracteres' });
    const { rows } = await pool.query('SELECT senha_hash FROM usuarios WHERE id=$1', [req.usuario.id]);
    if (!await bcrypt.compare(senha_atual, rows[0].senha_hash)) return res.status(400).json({ erro: 'Senha atual incorreta' });
    await pool.query('UPDATE usuarios SET senha_hash=$1 WHERE id=$2', [await bcrypt.hash(nova_senha, 10), req.usuario.id]);
    res.json({ mensagem: 'Senha alterada com sucesso' });
  } catch { res.status(500).json({ erro: 'Erro interno' }); }
});

// ── USUÁRIOS ──────────────────────────────────────────
r.get('/usuarios', autenticar, autorizar('admin', 'gestor'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id,u.nome,u.email,u.role,u.ativo,u.ultimo_login,u.setor_id,s.nome as setor_nome,u.permissoes
       FROM usuarios u LEFT JOIN setores s ON s.id=u.setor_id ORDER BY u.nome`
    );
    res.json(rows);
  } catch { res.status(500).json({ erro: 'Erro ao listar usuários' }); }
});

r.post('/usuarios', autenticar, autorizar('admin'), async (req, res) => {
  try {
    const { nome, email, senha, role = 'colaborador', setor_id, permissoes } = req.body;
    if (!nome || !email || !senha) return res.status(400).json({ erro: 'Nome, e-mail e senha obrigatórios' });
    const hash = await bcrypt.hash(senha, 10);
    const { rows } = await pool.query(
      `INSERT INTO usuarios (nome,email,senha_hash,role,setor_id,permissoes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,nome,email,role,permissoes`,
      [nome, email.toLowerCase().trim(), hash, role, setor_id || null, permissoes ? JSON.stringify(permissoes) : '{}']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ erro: 'E-mail já cadastrado' });
    res.status(500).json({ erro: 'Erro ao criar usuário: ' + err.message });
  }
});

r.put('/usuarios/:id', autenticar, autorizar('admin'), async (req, res) => {
  try {
    const { nome, email, role, setor_id, ativo, permissoes } = req.body;
    const { rows } = await pool.query(
      `UPDATE usuarios SET nome=COALESCE($1,nome),email=COALESCE($2,email),role=COALESCE($3,role),setor_id=COALESCE($4,setor_id),ativo=COALESCE($5,ativo),permissoes=COALESCE($6,permissoes) WHERE id=$7 RETURNING id,nome,email,role,ativo,permissoes`,
      [nome, email, role, setor_id, ativo, permissoes ? JSON.stringify(permissoes) : null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Não encontrado' });
    res.json(rows[0]);
  } catch(e) { res.status(500).json({ erro: 'Erro ao atualizar: ' + e.message }); }
});

r.delete('/usuarios/:id', autenticar, autorizar('admin'), async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.usuario.id) return res.status(400).json({ erro: 'Não pode excluir sua própria conta' });
    await pool.query('DELETE FROM usuarios WHERE id=$1', [req.params.id]);
    res.json({ mensagem: 'Usuário excluído' });
  } catch { res.status(500).json({ erro: 'Erro ao excluir' }); }
});

// ── TÉCNICOS ──────────────────────────────────────────
r.get('/tecnicos', autenticar, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM tecnicos WHERE ativo=TRUE ORDER BY nome');
    res.json(rows);
  } catch { res.status(500).json({ erro: 'Erro ao listar técnicos' }); }
});

r.post('/tecnicos', autenticar, autorizar('admin', 'gestor'), async (req, res) => {
  try {
    const { nome, codigo, telefone, regioes, status, lat, lng, setor_id } = req.body;
    if (!nome || !codigo) return res.status(400).json({ erro: 'Nome e código obrigatórios' });
    const raio = req.body.raio !== '' && req.body.raio != null ? parseFloat(req.body.raio) : null;
    const { rows } = await pool.query(
      `INSERT INTO tecnicos (nome,codigo,telefone,regioes,status,lat,lng,raio,setor_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [nome, codigo, telefone, regioes || [], status || 'Disponível', lat || null, lng || null, raio, setor_id || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ erro: 'Código já cadastrado' });
    res.status(500).json({ erro: 'Erro ao criar técnico' });
  }
});

r.put('/tecnicos/:id', autenticar, async (req, res) => {
  if (!temPermissao(req.usuario, 'editar_tecnicos'))
    return res.status(403).json({ erro: 'Acesso negado' });
  try {
    const id = parseInt(req.params.id);
    const nome     = req.body.nome     || null;
    const codigo   = req.body.codigo   || null;
    const telefone = req.body.telefone || null;
    const status   = req.body.status   || null;
    const lat      = (req.body.lat !== '' && req.body.lat != null) ? parseFloat(req.body.lat) : null;
    const lng      = (req.body.lng !== '' && req.body.lng != null) ? parseFloat(req.body.lng) : null;
    const regioes  = Array.isArray(req.body.regioes) ? req.body.regioes : (req.body.regioes ? String(req.body.regioes).split(',').map(r=>r.trim()) : []);
    const raio     = (req.body.raio !== '' && req.body.raio != null) ? parseFloat(req.body.raio) : null;
    const { rows } = await pool.query(
      `UPDATE tecnicos SET nome=COALESCE($1,nome),codigo=COALESCE($2,codigo),telefone=COALESCE($3,telefone),regioes=$4,status=COALESCE($5,status),lat=$6,lng=$7,raio=$8 WHERE id=$9 RETURNING *`,
      [nome, codigo, telefone, regioes, status, lat, lng, raio, id]
    );
    if (!rows.length) return res.status(404).json({ erro: `Técnico id=${id} não encontrado` });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar técnico', detalhe: err.message });
  }
});

r.delete('/tecnicos/:id', autenticar, async (req, res) => {
  if (!temPermissao(req.usuario, 'excluir_tecnicos'))
    return res.status(403).json({ erro: 'Acesso negado' });
  try {
    await pool.query('UPDATE tecnicos SET ativo=FALSE WHERE id=$1', [req.params.id]);
    res.json({ mensagem: 'Técnico desativado' });
  } catch { res.status(500).json({ erro: 'Erro ao desativar' }); }
});

// ── CONTRATO TÉCNICO (Cloudinary) ─────────────────────
r.post('/tecnicos/:id/contrato', autenticar, async (req, res) => {
  if (!temPermissao(req.usuario, 'editar_tecnicos'))
    return res.status(403).json({ erro: 'Acesso negado' });
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', async () => {
    try {
      const buffer   = Buffer.concat(chunks);
      const fileName = req.headers['x-filename'] || `contrato-tecnico-${req.params.id}`;
      const url      = await cloudinaryUpload(buffer, fileName, 'dipelnet/contratos');
      await pool.query('UPDATE tecnicos SET contrato_url=$1 WHERE id=$2', [url, req.params.id]);
      res.json({ ok: true, url });
    } catch(e) { res.status(500).json({ erro: e.message }); }
  });
  req.on('error', e => res.status(500).json({ erro: e.message }));
});

r.delete('/tecnicos/:id/contrato', autenticar, async (req, res) => {
  if (!temPermissao(req.usuario, 'editar_tecnicos'))
    return res.status(403).json({ erro: 'Acesso negado' });
  try {
    await pool.query('UPDATE tecnicos SET contrato_url=NULL WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ erro: e.message }); }
});

// ── EQUIPAMENTOS ──────────────────────────────────────
r.get('/equipamentos', autenticar, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM equipamentos WHERE ativo=TRUE ORDER BY marca, modelo');
    res.json(rows);
  } catch { res.status(500).json({ erro: 'Erro ao listar equipamentos' }); }
});

r.post('/equipamentos', autenticar, autorizar('admin', 'gestor'), async (req, res) => {
  try {
    const { marca, modelo, plano, wifi, diferencial } = req.body;
    if (!marca || !modelo) return res.status(400).json({ erro: 'Marca e modelo obrigatórios' });
    const { rows } = await pool.query(
      'INSERT INTO equipamentos (marca, modelo, plano, wifi, diferencial) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [marca, modelo, plano, wifi, diferencial]
    );
    res.status(201).json(rows[0]);
  } catch { res.status(500).json({ erro: 'Erro ao criar equipamento' }); }
});

r.put('/equipamentos/:id', autenticar, async (req, res) => {
  if (!temPermissao(req.usuario, 'editar_equipamentos'))
    return res.status(403).json({ erro: 'Acesso negado' });
  try {
    const { marca, modelo, plano, wifi, diferencial } = req.body;
    const { rows } = await pool.query(
      'UPDATE equipamentos SET marca=$1, modelo=$2, plano=$3, wifi=$4, diferencial=$5 WHERE id=$6 RETURNING *',
      [marca, modelo, plano, wifi, diferencial, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Não encontrado' });
    res.json(rows[0]);
  } catch { res.status(500).json({ erro: 'Erro ao atualizar equipamento' }); }
});

r.delete('/equipamentos/:id', autenticar, async (req, res) => {
  if (!temPermissao(req.usuario, 'excluir_equipamentos'))
    return res.status(403).json({ erro: 'Acesso negado' });
  try {
    await pool.query('UPDATE equipamentos SET ativo=FALSE WHERE id=$1', [req.params.id]);
    res.json({ mensagem: 'Equipamento removido' });
  } catch { res.status(500).json({ erro: 'Erro ao remover equipamento' }); }
});

// ── GUIAS ─────────────────────────────────────────────
r.get('/guias', autenticar, async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT id,slug,titulo,descricao,categoria,conteudo,status,atualizado_em FROM guias WHERE status='Ativo' AND categoria != 'Checklist' ORDER BY criado_em`);
    res.json(rows);
  } catch { res.status(500).json({ erro: 'Erro ao listar guias' }); }
});

r.get('/guias/:slug', autenticar, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM guias WHERE slug=$1', [req.params.slug]);
    if (!rows.length) return res.status(404).json({ erro: 'Guia não encontrado' });
    res.json(rows[0]);
  } catch { res.status(500).json({ erro: 'Erro ao buscar guia' }); }
});

r.put('/guias/:id/imagem', autenticar, async (req, res) => {
  if (!temPermissao(req.usuario, 'editar_guias'))
    return res.status(403).json({ erro: 'Acesso negado' });
  try {
    const { step_index, img_index, url } = req.body;
    const slug  = req.params.id;
    const isNum = /^\d+$/.test(slug);
    const query = isNum
      ? 'SELECT id, conteudo FROM guias WHERE id=$1'
      : 'SELECT id, conteudo FROM guias WHERE slug=$1';
    let { rows } = await pool.query(query, [slug]);
    if (!rows.length) {
      if (isNum) return res.status(404).json({ erro: 'Guia não encontrado' });
      const ins = await pool.query(
        `INSERT INTO guias (slug, titulo, descricao, categoria, conteudo, status)
         VALUES ($1,$1,'','','{"steps":[]}'::jsonb,'Ativo') RETURNING id, conteudo`,
        [slug]
      );
      rows = ins.rows;
    }
    const { id, conteudo } = rows[0];
    if (!conteudo.steps) conteudo.steps = [];
    while (conteudo.steps.length <= step_index) conteudo.steps.push({ imgs: [] });
    if (!Array.isArray(conteudo.steps[step_index].imgs)) conteudo.steps[step_index].imgs = [];
    const imgs = conteudo.steps[step_index].imgs;
    if (url === null || url === undefined) {
      if (img_index !== undefined && img_index < imgs.length) imgs.splice(img_index, 1);
    } else {
      if (img_index !== undefined && img_index < imgs.length) imgs[img_index] = url;
      else imgs.push(url);
    }
    await pool.query('UPDATE guias SET conteudo=$1, atualizado_em=NOW() WHERE id=$2', [JSON.stringify(conteudo), id]);
    res.json({ mensagem: 'Imagem atualizada com sucesso', url });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao salvar imagem', detalhe: err.message });
  }
});

// ── AVISOS ────────────────────────────────────────────
r.get('/avisos', autenticar, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.*,u.nome as autor FROM avisos a LEFT JOIN usuarios u ON u.id=a.criado_por WHERE a.ativo=TRUE ORDER BY a.prioridade DESC, a.criado_em DESC`
    );
    res.json(rows);
  } catch { res.status(500).json({ erro: 'Erro ao listar avisos' }); }
});

r.post('/avisos', autenticar, async (req, res) => {
  if (!temPermissao(req.usuario, 'editar_avisos'))
    return res.status(403).json({ erro: 'Acesso negado' });
  try {
    const { titulo, corpo, prioridade = 'normal', setor_id } = req.body;
    if (!titulo || !corpo) return res.status(400).json({ erro: 'Título e corpo obrigatórios' });
    const { rows } = await pool.query(
      `INSERT INTO avisos (titulo,corpo,prioridade,setor_id,criado_por) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [titulo, corpo, prioridade, setor_id || null, req.usuario.id]
    );
    res.status(201).json(rows[0]);
  } catch { res.status(500).json({ erro: 'Erro ao criar aviso' }); }
});

r.put('/avisos/:id', autenticar, async (req, res) => {
  if (!temPermissao(req.usuario, 'editar_avisos'))
    return res.status(403).json({ erro: 'Acesso negado' });
  try {
    const { titulo, corpo, prioridade } = req.body;
    const { rows } = await pool.query(
      `UPDATE avisos SET titulo=$1, corpo=$2, prioridade=$3 WHERE id=$4 AND ativo=TRUE RETURNING *`,
      [titulo, corpo, prioridade || 'normal', req.params.id]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Aviso não encontrado' });
    res.json(rows[0]);
  } catch { res.status(500).json({ erro: 'Erro ao editar aviso' }); }
});

r.delete('/avisos/:id', autenticar, async (req, res) => {
  if (!temPermissao(req.usuario, 'excluir_avisos'))
    return res.status(403).json({ erro: 'Acesso negado' });
  try {
    await pool.query('UPDATE avisos SET ativo=FALSE WHERE id=$1', [req.params.id]);
    res.json({ mensagem: 'Aviso removido' });
  } catch { res.status(500).json({ erro: 'Erro ao remover aviso' }); }
});

// ── COLABORADORES ─────────────────────────────────────
r.get('/colaboradores', autenticar, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM colaboradores ORDER BY setor, ordem, nome');
    res.json(rows);
  } catch { res.status(500).json({ erro: 'Erro ao listar colaboradores' }); }
});

r.post('/colaboradores', autenticar, async (req, res) => {
  if (!temPermissao(req.usuario, 'editar_colaboradores'))
    return res.status(403).json({ erro: 'Acesso negado' });
  try {
    const { nome, cargo, setor, ordem = 0, telefone } = req.body;
    if (!nome || !cargo || !setor) return res.status(400).json({ erro: 'Nome, cargo e setor obrigatórios' });
    const { rows } = await pool.query(
      'INSERT INTO colaboradores (nome, cargo, setor, ordem, telefone) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [nome, cargo, setor, ordem, telefone || null]
    );
    res.status(201).json(rows[0]);
  } catch { res.status(500).json({ erro: 'Erro ao criar colaborador' }); }
});

r.put('/colaboradores/:id', autenticar, async (req, res) => {
  if (!temPermissao(req.usuario, 'editar_colaboradores'))
    return res.status(403).json({ erro: 'Acesso negado' });
  try {
    const { nome, cargo, setor, ordem, telefone } = req.body;
    const { rows } = await pool.query(
      'UPDATE colaboradores SET nome=$1, cargo=$2, setor=$3, ordem=COALESCE($4,ordem), telefone=$5 WHERE id=$6 RETURNING *',
      [nome, cargo, setor, ordem, telefone || null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Não encontrado' });
    res.json(rows[0]);
  } catch { res.status(500).json({ erro: 'Erro ao atualizar colaborador' }); }
});

r.delete('/colaboradores/:id', autenticar, async (req, res) => {
  if (!temPermissao(req.usuario, 'editar_colaboradores'))
    return res.status(403).json({ erro: 'Acesso negado' });
  try {
    await pool.query('DELETE FROM colaboradores WHERE id=$1', [req.params.id]);
    res.json({ mensagem: 'Colaborador removido' });
  } catch { res.status(500).json({ erro: 'Erro ao remover colaborador' }); }
});

// ── CONTRATO COLABORADOR (Cloudinary) ─────────────────
r.post('/colaboradores/:id/contrato', autenticar, async (req, res) => {
  if (!temPermissao(req.usuario, 'editar_colaboradores'))
    return res.status(403).json({ erro: 'Acesso negado' });
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', async () => {
    try {
      const buffer   = Buffer.concat(chunks);
      const fileName = req.headers['x-filename'] || `contrato-colaborador-${req.params.id}`;
      const url      = await cloudinaryUpload(buffer, fileName, 'dipelnet/contratos');
      await pool.query('UPDATE colaboradores SET contrato_url=$1 WHERE id=$2', [url, req.params.id]);
      res.json({ ok: true, url });
    } catch(e) { res.status(500).json({ erro: e.message }); }
  });
  req.on('error', e => res.status(500).json({ erro: e.message }));
});

r.delete('/colaboradores/:id/contrato', autenticar, async (req, res) => {
  if (!temPermissao(req.usuario, 'editar_colaboradores'))
    return res.status(403).json({ erro: 'Acesso negado' });
  try {
    await pool.query('UPDATE colaboradores SET contrato_url=NULL WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ erro: e.message }); }
});

// ── SETORES ───────────────────────────────────────────
r.get('/setores', autenticar, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM setores WHERE ativo=TRUE ORDER BY nome');
    res.json(rows);
  } catch { res.status(500).json({ erro: 'Erro ao listar setores' }); }
});

// ── GEO PROXY ────────────────────────────────────────
const https = require('https');

function httpsGet(url, headers = {}, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const req2 = https.get(url, { headers }, r2 => {
      let body = '';
      r2.on('data', c => body += c);
      r2.on('end', () => {
        try { resolve({ status: r2.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: r2.statusCode, data: null }); }
      });
    });
    req2.on('error', reject);
    req2.setTimeout(timeoutMs, () => { req2.destroy(); reject(new Error('timeout')); });
  });
}

function overpassToGeojson(elements) {
  for (const el of elements) {
    if (el.type === 'way' && el.geometry && el.geometry.length > 3)
      return { type:'Polygon', coordinates:[el.geometry.map(p=>[p.lon,p.lat])] };
    if (el.type === 'relation' && el.members) {
      const outer = el.members.filter(m => m.role==='outer' && m.geometry && m.geometry.length>3);
      if (outer.length) {
        const rings = outer.map(m => m.geometry.map(p=>[p.lon,p.lat]));
        return rings.length===1
          ? { type:'Polygon', coordinates:rings }
          : { type:'MultiPolygon', coordinates:rings.map(r=>[r]) };
      }
    }
  }
  return null;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const geoServerCache = {};

r.get('/geo/regiao', autenticar, async (req, res) => {
  const { nome } = req.query;
  if (!nome) return res.status(400).json({ erro:'Nome obrigatório' });
  if (geoServerCache[nome]) return res.json(geoServerCache[nome]);

  // ── Verifica GeoJSON oficial primeiro ────────────────
  const nSA = nome.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const geom = BAIRROS_GEOJSON[nome] || BAIRROS_GEOJSON[nSA];
  if (geom) {
    const c = centerOf(geom);
    const result = { geometry: geom, ...c, display_name: nome, source: 'geojson-ibge' };
    geoServerCache[nome] = result;
    return res.json(result);
  }

  const H = { 'User-Agent':'Dipelnet/1.0', 'Accept-Language':'pt-BR,pt' };
  function centerOfLocal(geometry) {
    try {
      const coords = geometry.type==='Polygon' ? geometry.coordinates[0] : geometry.coordinates[0][0];
      return { center_lat:coords.reduce((s,[,y])=>s+y,0)/coords.length, center_lng:coords.reduce((s,[x])=>s+x,0)/coords.length };
    } catch { return {}; }
  }
  const OSM_IDS = {
    // ── Relations OSM ─────────────────────────────────
    'Floresta':{ id:6727084,type:'relation' },'Periolo':{ id:6727073,type:'relation' },'Morumbi':{ id:6727086,type:'relation' },
    'Brasília':{ id:6727085,type:'relation' },'Interlagos':{ id:6727083,type:'relation' },'Cascavel Velho':{ id:6727076,type:'relation' },
    'Cataratas':{ id:6727074,type:'relation' },'Região do Lago':{ id:6727067,type:'relation' },'Região do lago':{ id:6727067,type:'relation' },
    'Pacaembu':{ id:6727075,type:'relation' },'Pacaembú':{ id:6727075,type:'relation' },'Santos Dumont':{ id:6727060,type:'relation' },
    'Cancelli':{ id:6727080,type:'relation' },'Esmeralda':{ id:6727068,type:'relation' },'Country':{ id:6727057,type:'relation' },
    'São Cristóvão':{ id:6727072,type:'relation' },'Sao Cristovao':{ id:6727072,type:'relation' },'Parque Verde':{ id:6727078,type:'relation' },
    'Santa Felicidade':{ id:6727064,type:'relation' },'Maria Luiza':{ id:6727056,type:'relation' },'Neva':{ id:6727063,type:'relation' },
    'Coqueiral':{ id:6727058,type:'relation' },'Canadá':{ id:6727081,type:'relation' },'Canada':{ id:6727081,type:'relation' },
    'Recanto Tropical':{ id:6727079,type:'relation' },'Tropical':{ id:6727079,type:'relation' },
    'Independência':{ id:11998962,type:'relation' },'Independencia':{ id:11998962,type:'relation' },
    // ── Ways OSM ──────────────────────────────────────
    'Alto Alegre':{ id:454903448,type:'way' },'Parque São Paulo':{ id:454903443,type:'way' },'Parque Sao Paulo':{ id:454903443,type:'way' },
    'Santa Cruz':{ id:454903447,type:'way' },'Universitário':{ id:454903444,type:'way' },'Universitario':{ id:454903444,type:'way' },
    'Pioneiros Catarinenses':{ id:454903437,type:'way' },'Guarujá':{ id:454903439,type:'way' },'Guaruja':{ id:454903439,type:'way' },
    // ── BBox ─────────────────────────────────────────
    'Brasmadeira':    { type:'bbox',minLat:-24.9353,maxLat:-24.9093,minLng:-53.4603,maxLng:-53.4343 },
    'Santo Onofre':   { type:'bbox',minLat:-24.9858,maxLat:-24.9558,minLng:-53.5123,maxLng:-53.4823 },
    'Centro':         { type:'bbox',minLat:-24.9800,maxLat:-24.9300,minLng:-53.4893,maxLng:-53.4393 },
    'Vila Tolentino': { type:'bbox',minLat:-24.9833,maxLat:-24.9633,minLng:-53.4883,maxLng:-53.4483 },
    'Barcelona':      { type:'bbox',minLat:-24.9050,maxLat:-24.8750,minLng:-53.4750,maxLng:-53.4450 },
    'Riviera':        { type:'bbox',minLat:-24.9050,maxLat:-24.8750,minLng:-53.4450,maxLng:-53.4150 },
    'Florais do Paraná':{ type:'bbox',minLat:-24.9200,maxLat:-24.8950,minLng:-53.4200,maxLng:-53.3900 },
    'Florais Do Parana':{ type:'bbox',minLat:-24.9200,maxLat:-24.8950,minLng:-53.4200,maxLng:-53.3900 },
    'Jardim Mantovani':{ type:'bbox',minLat:-24.9200,maxLat:-24.8900,minLng:-53.3950,maxLng:-53.3650 },
    'Claudete':       { type:'bbox',minLat:-24.9550,maxLat:-24.9250,minLng:-53.5250,maxLng:-53.4950 },
    'Vila Militar':   { type:'bbox',minLat:-24.9850,maxLat:-24.9550,minLng:-53.4650,maxLng:-53.4350 },
    'Jardim Veneza':  { type:'bbox',minLat:-24.9950,maxLat:-24.9650,minLng:-53.4350,maxLng:-53.4050 },
    'Jardim Veneza':  { type:'bbox',minLat:-24.9950,maxLat:-24.9650,minLng:-53.4350,maxLng:-53.4050 },
    'FAG':            { type:'bbox',minLat:-24.9850,maxLat:-24.9600,minLng:-53.5000,maxLng:-53.4700 },
    'Fag':            { type:'bbox',minLat:-24.9850,maxLat:-24.9600,minLng:-53.5000,maxLng:-53.4700 },
    '14 de Novembro': { type:'bbox',minLat:-25.0050,maxLat:-24.9750,minLng:-53.5100,maxLng:-53.4800 },
    'XIV de Novembro':{ type:'bbox',minLat:-25.0050,maxLat:-24.9750,minLng:-53.5100,maxLng:-53.4800 },
  };
  const n = nome.trim().split(' ').map(p=>p.charAt(0).toUpperCase()+p.slice(1).toLowerCase()).join(' ');
  const nA = n.normalize('NFD').replace(/[̀-ͯ]/g,'');
  const mapAcentos = { 'Corbelia':'Corbélia','Cafelandia':'Cafelândia','Guaraniacu':'Guaraniaçu','Ceu Azul':'Céu Azul','Santo Inacio':'Santo Inácio','Sao Domingos':'São Domingos','Regiao Do Lago':'Região do Lago','Parque Sao Paulo':'Parque São Paulo','Sao Cristovao':'São Cristóvão','Bairro Sao Cristovao':'Bairro São Cristóvão' };
  const nAcento = mapAcentos[nA] || n;
  const osmEntry = OSM_IDS[nAcento] || OSM_IDS[n] || OSM_IDS[nome];
  if (osmEntry) {
    if (osmEntry.type === 'bbox') {
      const { minLat, maxLat, minLng, maxLng } = osmEntry;
      const geom = { type:'Polygon', coordinates:[[[ minLng,minLat],[maxLng,minLat],[maxLng,maxLat],[minLng,maxLat],[minLng,minLat]]] };
      const c = { center_lat:(minLat+maxLat)/2, center_lng:(minLng+maxLng)/2 };
      const result = { geometry:geom,...c,display_name:nAcento,source:'bbox' };
      geoServerCache[nome] = result; return res.json(result);
    }
    try {
      const q = osmEntry.type==='way' ? `[out:json][timeout:10];way(${osmEntry.id});out geom;` : `[out:json][timeout:10];relation(${osmEntry.id});out geom;`;
      const url = 'https://overpass-api.de/api/interpreter?data='+encodeURIComponent(q);
      const r2 = await httpsGet(url, H, 10000);
      if (r2.status===200 && r2.data?.elements?.length) {
        const el = r2.data.elements[0];
        let geom = null;
        if (osmEntry.type==='way' && el.geometry) geom = { type:'Polygon', coordinates:[el.geometry.map(p=>[p.lon,p.lat])] };
        else geom = overpassToGeojson(r2.data.elements);
        if (geom) { const c = centerOfLocal(geom); const result = { geometry:geom,...c,display_name:nAcento,source:'osm-id' }; geoServerCache[nome]=result; return res.json(result); }
      }
    } catch(e) { console.log(`[GEO OSM ID erro] ${e.message}`); }
  }
  const CASCAVEL = { lat:-24.9558, lng:-53.4548 };
  async function nominatim(query, filtro) {
    try {
      await sleep(400);
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&polygon_geojson=1&limit=5&addressdetails=1`;
      const r2 = await httpsGet(url, H, 8000);
      if (r2.status!==200 || !r2.data?.length) return null;
      for (const item of r2.data) {
        const lat=parseFloat(item.lat), lng=parseFloat(item.lon);
        if (filtro && !filtro(item,lat,lng)) continue;
        const geom=item.geojson;
        if (geom && (geom.type==='Polygon'||geom.type==='MultiPolygon')) { const c=centerOfLocal(geom); return { geometry:geom,...c,display_name:item.display_name }; }
        return { geometry:null,center_lat:lat,center_lng:lng,display_name:item.display_name };
      }
    } catch(e) { console.log(`[GEO Nominatim erro] ${e.message}`); }
    return null;
  }
  const filtroBairro = (item,lat,lng) => { const dist=Math.sqrt(Math.pow(lat-CASCAVEL.lat,2)+Math.pow(lng-CASCAVEL.lng,2))*111; const ehCidade=['city','town','municipality'].includes(item.addresstype||item.type)&&!(item.display_name||'').toLowerCase().includes('cascavel'); return dist<=30&&!ehCidade; };
  const filtroParana = (item,lat,lng) => lat>-27&&lat<-22&&lng>-55&&lng<-48;
  const tentativas = [
    () => nominatim(`${nAcento}, Cascavel, Paraná`, filtroBairro),
    () => nominatim(`${nA}, Cascavel, Paraná`, filtroBairro),
    () => nominatim(`${nAcento}, Paraná, Brasil`, filtroParana),
    () => nominatim(`${nA}, Paraná, Brasil`, filtroParana),
  ];
  for (const t of tentativas) { const result=await t(); if (result) { geoServerCache[nome]=result; return res.json(result); } }
  res.status(404).json({ erro:'Região não encontrada' });
});

const BAIRROS_CASCAVEL = ['Centro','Cancelli','Country','São Cristóvão','Pacaembu','Região do Lago','Periolo','Morumbi','Brasília','Cascavel Velho','Jardim União','Universitário','XIV de Novembro','14 de Novembro','Esmeralda','Parque Verde','Tropical','Recanto Tropical','Maria Luiza','Neva','Vila Tolentino','Parque São Paulo','Aracy','Santa Cruz','Santo Onofre','Alto Alegre','Palmeiras','Coqueiral','Santa Felicidade','Guarujá','Santos Dumont','Pioneiros Catarinenses','Canadá','Brasmadeira','Floresta','Interlagos','Cataratas','Aroeira','Fag','Vista Linda','Santo Inácio','Bairro São Cristóvão','Independência','Barcelona','Riviera','Florais do Paraná','Jardim Mantovani','Claudete','Vila Militar','Jardim Veneza','FAG'];
const CIDADES_PR = ['Cafelândia','Corbélia','Guaraniaçu','Catanduvas','Nova Aurora','Boa Vista da Aparecida','Campo Bonito','Cascavel','Céu Azul','Formosa do Oeste','Ibema','Lindoeste','Santa Lúcia','Três Barras do Paraná'];

r.get('/geo/autocomplete', autenticar, async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json([]);
  const n = q.trim().toLowerCase();
  const H = { 'User-Agent':'Dipelnet/1.0', 'Accept-Language':'pt-BR,pt' };
  const semAcentos = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const nSA = semAcentos(n);
  const bairrosMatch = BAIRROS_CASCAVEL.filter(b => semAcentos(b).includes(nSA)).map(b => ({ nome:b,display:`${b}, Cascavel - PR`,tipo:'Bairro · Cascavel' }));
  const cidadesMatch = CIDADES_PR.filter(c => semAcentos(c).includes(nSA)).map(c => ({ nome:c,display:`${c}, Paraná`,tipo:'Cidade · PR' }));
  const local = [...bairrosMatch,...cidadesMatch].slice(0,8);
  if (local.length > 0) return res.json(local);
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q+', Paraná')}&format=json&limit=8&addressdetails=1&countrycodes=br`;
    const r2 = await httpsGet(url, H, 5000);
    if (r2.status!==200||!r2.data?.length) return res.json([]);
    const resultados = [];
    for (const item of r2.data) {
      const lat=parseFloat(item.lat),lng=parseFloat(item.lon);
      if (!(lat>-27&&lat<-22&&lng>-55&&lng<-48)) continue;
      const addresstype=item.addresstype||item.type||'';
      const distCascavel=Math.sqrt(Math.pow(lat-(-24.9558),2)+Math.pow(lng-(-53.4548),2))*111;
      const nomePrincipal=item.name||(item.display_name||'').split(',')[0].trim();
      const display=(item.display_name||'').split(',').slice(0,2).join(',').trim();
      let tipo=distCascavel<20?'Bairro · Cascavel':'Cidade · PR';
      if (['city','town','municipality'].includes(addresstype)) tipo='Cidade · PR';
      if (!resultados.find(r=>r.nome===nomePrincipal)) resultados.push({ nome:nomePrincipal,display,tipo,distCascavel:Math.round(distCascavel) });
    }
    resultados.sort((a,b)=>(a.tipo.includes('Cascavel')?0:1)-(b.tipo.includes('Cascavel')?0:1)||a.distCascavel-b.distCascavel);
    res.json(resultados.slice(0,6));
  } catch { res.json([]); }
});

// ── PDF RECICLAGEM ────────────────────────────────────
const PDF_PATH = path.join(__dirname, '../../uploads/reciclagem.pdf');

function cloudinaryUpload(fileBuffer, fileName, folder = 'dipelnet/manuais') {
  return new Promise((resolve, reject) => {
    const API_SECRET = process.env.CLOUDINARY_API_SECRET || '';
    const timestamp  = Math.floor(Date.now() / 1000);
    const sigStr     = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
    const signature  = crypto.createHash('sha1').update(sigStr).digest('hex');
    const boundary   = '----CloudinaryBoundary' + Date.now();
    const parts = [];
    const addField = (name, value) => parts.push(Buffer.from(`--${boundary}\nContent-Disposition: form-data; name="${name}"\n\n${value}\n`));
    addField('api_key', API_KEY); addField('timestamp', timestamp); addField('signature', signature); addField('folder', folder); addField('resource_type', 'raw');
    parts.push(Buffer.from(`--${boundary}\nContent-Disposition: form-data; name="file"; filename="${fileName}"\nContent-Type: application/pdf\n\n`));
    parts.push(fileBuffer); parts.push(Buffer.from(`\n--${boundary}--\n`));
    const body = Buffer.concat(parts);
    const options = { hostname:'api.cloudinary.com', path:`/v1_1/${CLOUD_NAME}/raw/upload`, method:'POST', headers:{ 'Content-Type':`multipart/form-data; boundary=${boundary}`,'Content-Length':body.length } };
    const req = https2.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { const json=JSON.parse(data); if (json.secure_url) resolve(json.secure_url); else reject(new Error(json.error?.message||'Upload falhou')); } catch { reject(new Error('Resposta inválida')); } });
    });
    req.on('error', reject); req.write(body); req.end();
  });
}

r.get('/config/reciclagem-pdf', autenticar, async (req, res) => {
  try { const { rows } = await pool.query("SELECT valor FROM configuracoes WHERE chave='reciclagem_pdf_url' LIMIT 1"); res.json({ url: rows[0]?.valor||null }); }
  catch { res.json({ url: null }); }
});

r.post('/config/reciclagem-pdf', autenticar, autorizar('admin','gestor'), async (req, res) => {
  try { const { url } = req.body; await pool.query(`INSERT INTO configuracoes (chave, valor) VALUES ('reciclagem_pdf_url', $1) ON CONFLICT (chave) DO UPDATE SET valor = $1`, [url]); res.json({ ok: true }); }
  catch { res.status(500).json({ erro: 'Erro ao salvar URL' }); }
});

r.get('/config/reciclagem-pdf-proxy', (req, res) => {
  if (!fs.existsSync(PDF_PATH)) return res.status(404).send('PDF não encontrado.');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="Reciclagem.pdf"');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  fs.createReadStream(PDF_PATH).pipe(res);
});

r.delete('/config/reciclagem-remover', autenticar, autorizar('admin','gestor'), (req, res) => {
  try { if (fs.existsSync(PDF_PATH)) fs.unlinkSync(PDF_PATH); res.json({ ok: true }); }
  catch(e) { res.status(500).json({ erro: e.message }); }
});

r.post('/config/reciclagem-upload-local', autenticar, autorizar('admin','gestor'), (req, res) => {
  const uploadsDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => { const buffer=Buffer.concat(chunks); fs.writeFileSync(PDF_PATH, buffer); res.json({ ok:true, size:buffer.length }); });
  req.on('error', e => res.status(500).json({ erro: e.message }));
});

r.post('/config/reciclagem-upload', autenticar, autorizar('admin','gestor'), async (req, res) => {
  try {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', async () => {
      try { const buffer=Buffer.concat(chunks); const fileName=req.headers['x-filename']||'manual.pdf'; const url=await cloudinaryUpload(buffer,fileName); await pool.query(`INSERT INTO configuracoes (chave, valor) VALUES ('reciclagem_pdf_url', $1) ON CONFLICT (chave) DO UPDATE SET valor = $1`,[url]); res.json({ url }); }
      catch(e) { res.status(500).json({ erro: e.message }); }
    });
  } catch(e) { res.status(500).json({ erro: e.message }); }
});

module.exports = r;
