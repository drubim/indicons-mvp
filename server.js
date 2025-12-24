const express = require('express');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 10000;

// =====================
// MIDDLEWARES
// =====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// =====================
// "BANCO" EM MEMÓRIA (MVP)
// =====================
const users = [
  { id: 1, email: 'admin@indicons.com.br', senha: 'admin123', role: 'admin' },
  { id: 2, email: 'parceiro@indicons.com.br', senha: 'parceiro123', role: 'parceiro' }
];

const indicadores = [];
const leads = [];

// =====================
// ROTAS HTML (GET)
// =====================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/indicador.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'indicador.html')));
app.get('/parceiro.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'parceiro.html')));
app.get('/cadastro-indicador.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'cadastro-indicador.html')));
app.get('/cadastro-lead.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'cadastro-lead.html')));

// =====================
// API — LOGIN
// =====================
app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;
  const user = users.find(u => u.email === email && u.senha === senha);

  if (!user) {
    return res.status(401).json({ ok: false, message: 'Usuário ou senha inválidos' });
  }

  return res.json({
    ok: true,
    role: user.role,
    token: crypto.randomBytes(16).toString('hex')
  });
});

// =====================
// API — CADASTRO INDICADOR
// =====================
app.post('/api/cadastro-indicador', (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) {
    return res.status(400).json({ ok: false, message: 'Dados obrigatórios' });
  }

  const codigo = crypto.randomBytes(4).toString('hex');

  indicadores.push({
    id: indicadores.length + 1,
    nome,
    email,
    senha,
    codigo,
    role: 'indicador'
  });

  const link = `/i/${codigo}`;

  return res.json({ ok: true, link });
});

// =====================
// LINK DE INDICAÇÃO
// =====================
app.get('/i/:codigo', (req, res) => {
  const { codigo } = req.params;
  const indicador = indicadores.find(i => i.codigo === codigo);

  if (!indicador) {
    return res.status(404).send('Link inválido');
  }

  res.sendFile(path.join(__dirname, 'public', 'cadastro-lead.html'));
});

// =====================
// API — CADASTRO LEAD
// =====================
app.post('/api/cadastro-lead', (req, res) => {
  const { nome, telefone, email, codigoIndicador } = req.body;

  if (!nome || !telefone || !codigoIndicador) {
    return res.status(400).json({ ok: false, message: 'Dados obrigatórios' });
  }

  leads.push({
    id: leads.length + 1,
    nome,
    telefone,
    email,
    codigoIndicador,
    status: 'novo' // IA entra depois
  });

  return res.json({ ok: true });
});

// =====================
// API — LISTAGENS (PAINÉIS)
// =====================
app.get('/api/admin/leads', (req, res) => res.json(leads));
app.get('/api/indicador/leads/:codigo', (req, res) => {
  const { codigo } = req.params;
  res.json(leads.filter(l => l.codigoIndicador === codigo));
});
app.get('/api/parceiro/leads', (req, res) => {
  // MVP: parceiro vê todos
  res.json(leads);
});

// =====================
// 🚫 AGENDAMENTO / GOOGLE — DESLIGADO
// =====================
// NÃO existe googleapis
// NÃO existe calendar.json
// NÃO existe setInterval
// NÃO existe reagendamento
// NÃO existe IA aqui

// =====================
// START SERVER
// =====================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
