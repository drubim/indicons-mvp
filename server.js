const express = require('express');
const path = require('path');
const session = require('express-session');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

/* ======================
   MIDDLEWARE
====================== */
app.set('trust proxy', 1);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  name: 'indicons.sid',
  secret: 'indicons-secret',
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    secure: true,      // OBRIGATÓRIO EM HTTPS (Render)
    sameSite: 'lax'
  }
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
   LEADS EM MEMÓRIA
====================== */
let leads = [];
let leadId = 1;

/* ======================
   LOGIN (FORM HTML)
====================== */
app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  const user = users.find(
    u => u.email === email && u.senha === senha
  );

  if (!user) {
    return res.redirect('/login.html');
  }

  req.session.user = {
    id: user.id,
    role: user.role
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
    role: 'indicador',
    codigo: crypto.randomBytes(4).toString('hex')
  });

  res.redirect('/login.html');
});

/* ======================
   DASHBOARD
====================== */
app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login.html');
  }

  if (req.session.user.role === 'admin') {
    return res.redirect('/admin.html');
  }

  if (req.session.user.role === 'parceiro') {
    return res.redirect('/parceiro.html');
  }

  if (req.session.user.role === 'indicador') {
    return res.redirect('/indicador.html');
  }

  res.redirect('/login.html');
});

/* ======================
   LINK DO INDICADOR
====================== */
app.get('/api/indicador/link', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'indicador') {
    return res.sendStatus(401);
  }

  const indicador = users.find(u => u.id === req.session.user.id);

  res.json({
    link: `https://app.indicons.com.br/i/${indicador.codigo}`
  });
});

/* ======================
   LEADS DO INDICADOR
====================== */
app.get('/api/leads/indicador', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'indicador') {
    return res.sendStatus(401);
  }

  res.json(
    leads.filter(l => l.indicadorId === req.session.user.id)
  );
});

/* ======================
   LEADS DO ADMIN
====================== */
app.get('/api/leads/admin', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.sendStatus(401);
  }

  res.json(leads);
});

/* ======================
   FORM CLIENTE (LINK INDICADOR)
====================== */
app.get('/i/:codigo', (req, res) => {
  const indicador = users.find(
    u => u.role === 'indicador' && u.codigo === req.params.codigo
  );

  if (!indicador) {
    return res.send('Link inválido');
  }

  res.send(`
    <h2>Receba uma simulação</h2>
    <form method="POST">
      <input name="nome" required placeholder="Nome"><br><br>
      <input name="telefone" required placeholder="Telefone"><br><br>
      <button>Enviar</button>
    </form>
  `);
});

/* ======================
   RECEBE LEAD
====================== */
app.post('/i/:codigo', (req, res) => {
  const indicador = users.find(
    u => u.role === 'indicador' && u.codigo === req.params.codigo
  );

  if (!indicador) {
    return res.send('Link inválido');
  }

  leads.push({
    id: leadId++,
    nome: req.body.nome,
    telefone: req.body.telefone,
    indicadorId: indicador.id,
    status: 'Recebido',
    criadoEm: new Date()
  });

  res.send('Cadastro realizado com sucesso.');
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
  console.log('INDICONS – servidor estável (HTTPS + sessão OK)');
});
