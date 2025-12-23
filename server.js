const express = require('express');
const path = require('path');
const session = require('express-session');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  name: 'indicons.sid',
  secret: 'indicons-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true, sameSite: 'lax' }
}));

app.use(express.static(path.join(__dirname, 'public')));

/* ======================
   CONFIG
====================== */
const INDICADOR_PERCENTUAL = 0.10;

/* ======================
   USERS
====================== */
const users = [
  { id: 1, email: 'admin@indicons.com.br', senha: 'admin123', role: 'admin' },
  { id: 2, email: 'parceiro@indicons.com.br', senha: 'parceiro123', role: 'parceiro' }
];
let indicadorId = 100;

/* ======================
   LEADS
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
  req.session.user = { id: user.id, role: user.role };
  res.redirect('/dashboard');
});

app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;
  const user = users.find(u => u.email === email && u.senha === senha);
  if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });
  req.session.user = { id: user.id, role: user.role };
  res.json({ ok: true, role: user.role });
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
  if (!req.session.user) return res.redirect('/login.html');
  if (req.session.user.role === 'admin') return res.redirect('/admin.html');
  if (req.session.user.role === 'parceiro') return res.redirect('/parceiro.html');
  if (req.session.user.role === 'indicador') return res.redirect('/indicador.html');
});

/* ======================
   LINK INDICADOR
====================== */
app.get('/api/indicador/link', (req, res) => {
  const ind = users.find(u => u.id === req.session.user.id);
  res.json({ link: `https://app.indicons.com.br/i/${ind.codigo}` });
});

/* ======================
   APIs DE LEADS
====================== */

// ADMIN vê tudo
app.get('/api/leads/admin', (req, res) => {
  if (req.session.user.role !== 'admin') return res.sendStatus(401);
  res.json(leads);
});

// PARCEIRO vê SOMENTE leads quentes COM reunião
app.get('/api/leads/parceiro', (req, res) => {
  if (req.session.user.role !== 'parceiro') return res.sendStatus(401);

  res.json(
    leads.filter(l =>
      l.classificacao === 'quente' &&
      l.reuniaoAgendada === true &&
      l.parceiroId === req.session.user.id
    )
  );
});

// INDICADOR vê resumo
app.get('/api/leads/indicador', (req, res) => {
  if (req.session.user.role !== 'indicador') return res.sendStatus(401);

  res.json(
    leads
      .filter(l => l.indicadorId === req.session.user.id)
      .map(l => ({
        nome: l.nome,
        status: l.status,
        comissao: l.comissaoIndicador,
        criadoEm: l.criadoEm
      }))
  );
});

/* ======================
   FORM CLIENTE
====================== */
app.get('/i/:codigo', (req, res) => {
  const ind = users.find(u => u.codigo === req.params.codigo);
  if (!ind) return res.send('Link inválido');
  res.send(`
    <form method="POST">
      <input name="nome" required placeholder="Nome"><br>
      <input name="telefone" required placeholder="Telefone"><br>
      <button>Enviar</button>
    </form>
  `);
});

/* ======================
   RECEBE CLIENTE + IA + AGENDAMENTO
====================== */
app.post('/i/:codigo', (req, res) => {
  const ind = users.find(u => u.codigo === req.params.codigo);
  if (!ind) return res.send('Link inválido');

  // IA (simulada)
  const score = Math.floor(Math.random() * 100);

  let classificacao = 'frio';
  let status = 'Recebido';
  let reuniaoAgendada = false;
  let parceiroId = null;

  if (score >= 70) {
    classificacao = 'quente';
    status = 'Reunião agendada';
    reuniaoAgendada = true;

    // atribuição automática de parceiro
    const parceiro = users.find(u => u.role === 'parceiro');
    parceiroId = parceiro?.id || null;
  } else if (score >= 40) {
    classificacao = 'morno';
    status = 'Em atendimento';
  }

  const houveVenda = classificacao === 'quente';
  const valorConsorcio = houveVenda ? 100000 : 0;
  const comissaoTotal = houveVenda ? valorConsorcio * 0.06 : 0;
  const comissaoIndicador = houveVenda
    ? comissaoTotal * INDICADOR_PERCENTUAL
    : 0;

  leads.push({
    id: leadId++,
    nome: req.body.nome,
    telefone: req.body.telefone,
    indicadorId: ind.id,
    parceiroId,
    score,
    classificacao,
    status,
    reuniaoAgendada,
    valorConsorcio,
    comissaoIndicador,
    criadoEm: new Date()
  });

  res.send('Cadastro realizado com sucesso.');
});

/* ======================
   LOGOUT
====================== */
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login.html'));
});

app.listen(PORT, () => {
  console.log('INDICONS – parceiro só vê lead quente com reunião');
});
