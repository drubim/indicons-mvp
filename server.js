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
   CONFIGURAÇÃO DE COMISSÃO
====================== */
// percentual do indicador sobre a comissão líquida
const INDICADOR_PERCENTUAL = 0.10; // 10%

/* USERS */
const users = [
  { id: 1, email: 'admin@indicons.com.br', senha: 'admin123', role: 'admin' },
  { id: 2, email: 'parceiro@indicons.com.br', senha: 'parceiro123', role: 'parceiro' }
];
let indicadorId = 100;

/* LEADS */
let leads = [];
let leadId = 1;

/* LOGIN */
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

/* CADASTRO INDICADOR */
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

/* DASHBOARD */
app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/login.html');
  if (req.session.user.role === 'admin') return res.redirect('/admin.html');
  if (req.session.user.role === 'parceiro') return res.redirect('/parceiro.html');
  if (req.session.user.role === 'indicador') return res.redirect('/indicador.html');
});

/* LINK INDICADOR */
app.get('/api/indicador/link', (req, res) => {
  const ind = users.find(u => u.id === req.session.user.id);
  res.json({ link: `https://app.indicons.com.br/i/${ind.codigo}` });
});

/* LEADS – INDICADOR */
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

/* FORM CLIENTE */
app.get('/i/:codigo', (req, res) => {
  const ind = users.find(u => u.codigo === req.params.codigo);
  if (!ind) return res.send('Link inválido');
  res.send(`
    <form method="POST">
      <input name="nome" placeholder="Nome" required><br>
      <input name="telefone" placeholder="Telefone" required><br>
      <button>Enviar</button>
    </form>
  `);
});

/* RECEBE CLIENTE */
app.post('/i/:codigo', (req, res) => {
  const ind = users.find(u => u.codigo === req.params.codigo);
  if (!ind) return res.send('Link inválido');

  // lógica interna (simulação)
  const score = Math.floor(Math.random() * 100);
  const valorConsorcio = score >= 70 ? 80000 : 0; // simulado
  const houveVenda = score >= 70;

  let status = 'Recebido';
  if (score >= 40) status = 'Em atendimento';
  if (houveVenda) status = 'Finalizado – Vendido';
  if (!houveVenda && score < 40) status = 'Finalizado – Não vendido';

  // comissão simulada
  const comissaoTotal = houveVenda ? valorConsorcio * 0.06 : 0; // 6% exemplo
  const comissaoIndicador = houveVenda
    ? comissaoTotal * INDICADOR_PERCENTUAL
    : 0;

  leads.push({
    id: leadId++,
    nome: req.body.nome,
    telefone: req.body.telefone,
    indicadorId: ind.id,
    status,
    valorConsorcio,
    comissaoIndicador,
    criadoEm: new Date()
  });

  res.send('Cadastro realizado com sucesso.');
});

/* LOGOUT */
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login.html'));
});

app.listen(PORT, () => {
  console.log('INDICONS – status final + comissão do indicador');
});
