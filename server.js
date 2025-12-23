const express = require('express');
const path = require('path');
const session = require('express-session');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

/* ======================
   RENDER / PROXY FIX
====================== */
app.set('trust proxy', 1);

/* ======================
   MIDDLEWARE
====================== */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  name: 'indicons.sid',
  secret: 'indicons-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
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
   LOGIN (FORM HTML)
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
   LOGIN (FETCH / API)
====================== */
app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;

  const user = users.find(u => u.email === email && u.senha === senha);
  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  req.session.user = {
    id: user.id,
    role: user.role,
    email: user.email
  };

  res.json({ ok: true, role: user.role });
});

/* ======================
   CADASTRO INDICADOR
====================== */
app.post('/cadastro-indicador', (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.send('Dados inválidos');

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
   DASHBOARD / REDIRECIONAMENTO
====================== */
app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/login.html');

  if (req.session.user.role === 'admin') return res.redirect('/admin.html');
  if (req.session.user.role === 'parceiro') return res.redirect('/parceiro.html');
  if (req.session.user.role === 'indicador') return res.redirect('/indicador.html');
});

/* ======================
   LINK DO INDICADOR
====================== */
app.get('/api/indicador/link', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'indicador') {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  const indicador = users.find(u => u.id === req.session.user.id);
  if (!indicador || !indicador.codigo) {
    return res.status(404).json({ error: 'Indicador não encontrado' });
  }

  res.json({
    link: `https://app.indicons.com.br/i/${indicador.codigo}`
  });
});

/* ======================
   ROTA INVISÍVEL DO CLIENTE (BASE)
====================== */
app.get('/i/:codigo', (req, res) => {
  const indicador = users.find(
    u => u.role === 'indicador' && u.codigo === req.params.codigo
  );

  if (!indicador) return res.send('Link inválido');

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
   LOGOUT
====================== */
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login.html'));
});

/* ======================
   DEBUG (opcional)
====================== */
app.get('/debug/users', (req, res) => {
  res.json(users);
});

/* ======================
   START
====================== */
app.listen(PORT, () => {
  console.log('INDICONS rodando – base estável com login, cadastro e link');
});
