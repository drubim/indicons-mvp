const express = require('express');
const path = require('path');
const session = require('express-session');
const crypto = require('crypto');

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
   LEADS EM MEMÓRIA
====================== */
let leads = [];
let leadId = 1;

/* ======================
   LOGIN
====================== */
app.post('/login', (req, res) => {
  const { email, senha } = req.body;
  const user = users.find(u => u.email === email && u.senha === senha);
  if (!user) return res.redirect('/login.html');

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

  const codigo = crypto.randomBytes(4).toString('hex'); // 🔑 código único

  users.push({
    id: indicadorId++,
    email,
    senha,
    role: 'indicador',
    codigo
  });

  res.redirect('/login.html');
});

/* ======================
   DASHBOARD
====================== */
app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/login.html');

  if (req.session.user.role === 'admin') return res.redirect('/admin');
  if (req.session.user.role === 'parceiro') return res.redirect('/parceiro');
  if (req.session.user.role === 'indicador') return res.redirect('/indicador');
});

/* ======================
   AUTH
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
   PAINÉIS (INTACTOS)
====================== */
app.get('/admin', auth('admin'), (req, res) =>
  res.sendFile(path.join(__dirname, 'public/admin.html'))
);

app.get('/parceiro', auth('parceiro'), (req, res) =>
  res.sendFile(path.join(__dirname, 'public/parceiro.html'))
);

app.get('/indicador', auth('indicador'), (req, res) =>
  res.sendFile(path.join(__dirname, 'public/indicador.html'))
);

/* ======================
   LINK DO INDICADOR (BACKEND)
====================== */
// endpoint para o painel usar futuramente (opcional)
app.get('/api/link-indicador', auth('indicador'), (req, res) => {
  const indicador = users.find(u => u.id === req.session.user.id);
  res.json({ codigo: indicador.codigo });
});

/* ======================
   ROTA INVISÍVEL DO CLIENTE
====================== */
app.get('/i/:codigo', (req, res) => {
  const indicador = users.find(
    u => u.role === 'indicador' && u.codigo === req.params.codigo
  );

  if (!indicador) return res.send('Link inválido');

  res.send(`
    <h2>Receba uma simulação</h2>
    <form method="POST">
      <input name="nome" placeholder="Nome" required /><br><br>
      <input name="telefone" placeholder="Telefone" required /><br><br>
      <button type="submit">Enviar</button>
    </form>
  `);
});

app.post('/i/:codigo', (req, res) => {
  const indicador = users.find(
    u => u.role === 'indicador' && u.codigo === req.params.codigo
  );

  if (!indicador) return res.send('Link inválido');

  leads.push({
    id: leadId++,
    nome: req.body.nome,
    telefone: req.body.telefone,
    indicadorId: indicador.id,
    status: 'novo',
    criadoEm: new Date()
  });

  res.send('Cadastro recebido. Em breve entraremos em contato.');
});

/* ======================
   DEBUG (TEMPORÁRIO)
====================== */
app.get('/debug/leads', (req, res) => res.json(leads));

/* ======================
   LOGOUT
====================== */
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login.html'));
});

/* ======================
   START
====================== */
app.listen(PORT, () => console.log('INDICONS rodando'));
