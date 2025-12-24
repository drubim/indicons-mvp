const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

/* =========================
   MIDDLEWARES BÁSICOS
========================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'indicons-secret',
  resave: false,
  saveUninitialized: true
}));

/* =========================
   ARQUIVOS ESTÁTICOS (HTML)
========================= */

app.use(express.static(path.join(__dirname, 'public')));

/* =========================
   ROTAS HTML (FIX DEFINITIVO)
========================= */

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/indicador', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'indicador.html'));
});

app.get('/parceiro', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'parceiro.html'));
});

app.get('/cadastro-indicador', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cadastro-indicador.html'));
});

/* =========================
   ROTAS DE API (SIMPLIFICADAS)
========================= */

// LOGIN (teste)
app.post('/login', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ ok: false });
  }

  let role = 'indicador';
  if (email.includes('admin')) role = 'admin';
  if (email.includes('parceiro')) role = 'parceiro';

  req.session.user = { email, role };

  res.json({ ok: true, role });
});

// CADASTRO INDICADOR (gera link)
app.post('/cadastro-indicador', (req, res) => {
  const id = Math.random().toString(16).slice(2, 10);
  res.json({
    ok: true,
    link: `https://app.indicons.com.br/i/${id}`
  });
});

/* =========================
   FALLBACK (ERRO CLARO)
========================= */

app.use((req, res) => {
  res.status(404).send('Rota não encontrada');
});

/* =========================
   START
========================= */

app.listen(PORT, () => {
  console.log('====================================');
  console.log('INDICONS - servidor base estável ON');
  console.log('Porta:', PORT);
  console.log('====================================');
});
