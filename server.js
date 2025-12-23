const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();

app.use(express.json());
app.use(express.static('public'));

const SECRET = 'indicons-secret';

/* ======================
   MODELS (SEGURO)
====================== */
let Usuario = null;
let Indicador = null;
let Lead = null;

try {
  const db = require('./models');
  Usuario = db.Usuario || null;
  Indicador = db.Indicador || null;
  Lead = db.Lead || null;
  console.log('Models carregados');
} catch (e) {
  console.log('Models não carregados');
}

/* ======================
   AUTH
====================== */
function auth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.sendStatus(401);

  try {
    req.user = jwt.verify(token.replace('Bearer ', ''), SECRET);
    next();
  } catch {
    res.sendStatus(401);
  }
}

/* ======================
   LOGIN (RESTAURADO)
====================== */
app.post('/api/login', async (req, res) => {
  if (!Usuario) {
    return res.status(500).json({ erro: 'Usuários não disponíveis' });
  }

  const { email, senha } = req.body;

  try {
    const usuario = await Usuario.findOne({
      where: { email, senha }
    });

    if (!usuario) {
      return res.status(401).json({ erro: 'Usuário ou senha inválidos' });
    }

    const token = jwt.sign(
      { id: usuario.id, role: usuario.role },
      SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, role: usuario.role });
  } catch {
    res.status(500).json({ erro: 'Erro no login' });
  }
});

/* ======================
   ROTA INVISÍVEL CLIENTE
====================== */
app.get('/i/:codigo', async (req, res) => {
  if (!Indicador) {
    return res.sendFile(path.join(__dirname, 'public/cadastro-cliente.html'));
  }

  const indicador = await Indicador.findOne({
    where: { codigo: req.params.codigo }
  });

  if (!indicador) {
    return res.status(404).send('Link inválido');
  }

  res.sendFile(path.join(__dirname, 'public/cadastro-cliente.html'));
});

/* ======================
   CADASTRO DE LEAD
====================== */
app.post('/api/cadastro-cliente/:codigo', async (req, res) => {
  if (!Indicador || !Lead) {
    return res.json({ sucesso: true });
  }

  const indicador = await Indicador.findOne({
    where: { codigo: req.params.codigo }
  });

  if (!indicador) {
    return res.status(400).json({ erro: 'Indicador inválido' });
  }

  await Lead.create({
    nome: req.body.nome,
    telefone: req.body.telefone,
    email: req.body.email,
    indicador_id: indicador.id,
    status: 'novo'
  });

  res.json({ sucesso: true });
});

/* ======================
   LEADS - INDICADOR
====================== */
app.get('/api/leads/indicador', auth, async (req, res) => {
  if (!Lead || req.user.role !== 'indicador') return res.json([]);

  const leads = await Lead.findAll({
    where: { indicador_id: req.user.id },
    order: [['createdAt', 'DESC']]
  });

  res.json(leads);
});

/* ======================
   LEADS - PARCEIRO
====================== */
app.get('/api/leads/parceiro', auth, async (req, res) => {
  if (!Lead || req.user.role !== 'parceiro') return res.json([]);

  const leads = await Lead.findAll({
    where: { parceiro_id: req.user.id },
    order: [['createdAt', 'DESC']]
  });

  res.json(leads);
});

/* ======================
   LEADS - ADMIN
====================== */
app.get('/api/leads/admin', auth, async (req, res) => {
  if (!Lead || req.user.role !== 'admin') return res.json([]);

  const leads = await Lead.findAll({
    order: [['createdAt', 'DESC']]
  });

  res.json(leads);
});

/* ======================
   START
====================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Indicons rodando na porta', PORT);
});
