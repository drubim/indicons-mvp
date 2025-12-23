const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();

/* ======================
   CONFIG BÁSICA
====================== */
app.use(express.json());
app.use(express.static('public'));

const SECRET = 'indicons-secret';

/* ======================
   MODELS (AJUSTE AQUI)
   ⚠️ USE SEUS MODELS REAIS
====================== */
const db = require('./models'); 
const Indicador = db.Indicador;
const Lead = db.Lead;

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
   ROTA INVISÍVEL
====================== */
app.get('/i/:codigo', async (req, res) => {
  try {
    const indicador = await Indicador.findOne({
      where: { codigo: req.params.codigo }
    });

    if (!indicador) {
      return res.status(404).send('Link inválido');
    }

    res.sendFile(path.join(__dirname, 'public/cadastro-cliente.html'));
  } catch (e) {
    res.status(500).send('Erro interno');
  }
});

/* ======================
   CADASTRO LEAD
====================== */
app.post('/api/cadastro-cliente/:codigo', async (req, res) => {
  try {
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
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao cadastrar' });
  }
});

/* ======================
   LEADS - INDICADOR
====================== */
app.get('/api/leads/indicador', auth, async (req, res) => {
  if (req.user.role !== 'indicador') return res.sendStatus(403);

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
  if (req.user.role !== 'parceiro') return res.sendStatus(403);

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
  if (req.user.role !== 'admin') return res.sendStatus(403);

  const leads = await Lead.findAll({
    order: [['createdAt', 'DESC']]
  });

  res.json(leads);
});

/* ======================
   START (RENDER SAFE)
====================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Indicons rodando na porta', PORT);
});
