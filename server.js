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
   LEADS (CLIENTES) EM MEMÓRIA
====================== */
let leads = [];
let leadId = 1;

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
   ROTA INVISÍVEL – CLIENTE
====================== */

// Formulário invisível do cliente
app.get('/i/:codigo', (req, res) => {
  const codigo = req.params.codigo;

  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Cadastro</title>
    </head>
    <body>
      <h2>Receba uma simulação</h2>

      <form method="POST" action="/i/${codigo}">
        <input name="nome" placeholder="Seu nome" required /><br><br>
        <input name="telefone" placeholder="Telefone" required /><br><br>
        <button type="submit">Enviar</button>
      </form>
    </body>
    </html>
  `);
});

// Recebe cadastro do cliente
app.post('/i/:codigo', (req, res) => {
  const { nome, telefone } = req.body;
  const codigo = req.params.codigo;

  leads.push({
    id: leadId++,
    nome,
    telefone,
    codigoIndicador: codigo,
    status: 'novo',
    criadoEm: new Date()
  });

  res.send('Cadastro recebido. Em breve entraremos em contato.');
});

/* ======================
   DEBUG (TEMPORÁRIO)
====================== */
app.get('/debug/leads', (req, res) => {
  res.json(leads);
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
