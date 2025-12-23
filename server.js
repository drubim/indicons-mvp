const express = require('express');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

/* ======================
   MIDDLEWARE
====================== */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: 'indicons-secret',
  resave: false,
  saveUninitialized: false
}));

app.use(express.static(path.join(__dirname, 'public')));

/* ======================
   USUÁRIOS EM MEMÓRIA
====================== */
const users = [
  { id: 1, email: 'admin@indicons.com.br', senha: 'admin123', role: 'admin' },
  { id: 2, email: 'parceiro@indicons.com.br', senha: 'parceiro123', role: 'parceiro' }
];

let indicadorId = 100;

/* ======================
   LOGIN
====================== */
app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  const user = users.find(u => u.email === email && u.senha === senha);
  if (!user) {
    return res.redirect('/login.html');
  }

  req.session.user = {
    id: user.id,
    role: user.role,
    email: user.email
  };

  res.redirect('/dashboard');
});

/* ======================
   CADASTRO INDICADOR
====================== */
app.post('/cadastro-indicador', (req, res) => {
  const { email, senha } = req.body;

  users.push({
    id: indicadorId++,
    email,
    senha,
    role: 'indicador'
  });

  res.redirect('/login.html');
});

/* ======================
   DASHBOARD CENTRAL
====================== */
app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login.html');
  }

  const role = req.session.user.role;

  if (role === 'admin') return res.redirect('/admin');
  if (role === 'parceiro') return res.redirect('/parceiro');
  if (role === 'indicador') return res.redirect('/indicador');

  res.redirect('/login.html');
});

/* ======================
   MIDDLEWARE AUTH
====================== */
function auth(role) {
  return (req, res, next) => {
    if (!req.session.user || req.session.user.role !== role) {
      return res.redirect('/login.html');
    }
    next();
  };
}

/* ======================
   PAINÉIS PROTEGIDOS
====================== */
app.get('/admin', auth('admin'), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/parceiro', auth('parceiro'), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'parceiro.html'));
});

app.get('/indicador', auth('indicador'), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'indicador.html'));
});

/* ======================
   LOGOUT
====================== */
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login.html');
  });
});

/* ======================
   START
====================== */
app.listen(PORT, () => {
  console.log('INDICONS rodando');
});
