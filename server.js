const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { Indicador, Lead, Usuario } = require('./models');

const app = express();

app.use(bodyParser.json());
app.use(express.static('public'));

const SECRET = 'indicons-secret';

// =====================
// AUTH MIDDLEWARE
// =====================
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

// =====================
// ROTA INVISÍVEL - CLIENTE INDICADO
// =====================
app.get('/i/:codigo', async (req, res) => {
  const indicador = await Indicador.findOne({
    where: { codigo: req.params.codigo }
  });

  if (!indicador) {
    return res.status(404).send('Link inválido');
  }

  res.sendFile(path.join(__dirname, 'public/cadastro-cliente.html'));
});

// =====================
// CADASTRO DO LEAD
// =====================
app.post('/api/cadastro-cliente/:codigo', async (req, res) => {
  const { nome, telefone, email } = req.body;

  const indicador = await Indicador.findOne({
    where: { codigo: req.params.codigo }
  });

  if (!indicador) {
    return res.status(400).json({ erro: 'Indicador inválido' });
  }

  await Lead.create({
    nome,
    telefone,
    email,
    indicador_id: indicador.id,
    status: 'novo'
  });

  res.json({ sucesso: true });
});

// =====================
// LEADS - INDICADOR
// =====================
app.get('/api/leads/indicador', auth, async (req, res) => {
  if (req.user.role !== 'indicador') return res.sendStatus(403);

  const leads = await Lead.findAll({
    where: { indicador_id: req.user.id },
    order: [['created_at', 'DESC']]
  });

  res.json(leads);
});

// =====================
// LEADS - PARCEIRO
// =====================
app.get('/api/leads/parceiro', auth, async (req, res) => {
  if (req.user.role !== 'parceiro') return res.sendStatus(403);

  const leads = await Lead.findAll({
    where: { parceiro_id: req.user.id },
    order: [['created_at', 'DESC']]
  });

  res.json(leads);
});

// =====================
// LEADS - ADMIN
// =====================
app.get('/api/leads/admin', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);

  const leads = await Lead.findAll({
    order: [['created_at', 'DESC']]
  });

  res.json(leads);
});

// =====================
app.listen(3000, () => {
  console.log('Indicons rodando');
});
