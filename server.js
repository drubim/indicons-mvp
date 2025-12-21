const express = require('express');
const path = require('path');

const { classificarEAgendar } = require('./services/iaSdr');
const {
  gerarUrlAutorizacao,
  obterTokens, 
  setTokens
} = require('./services/googleOAuth');

const app = express();
const PORT = process.env.PORT || 3000;

/* ===============================
   MIDDLEWARE
================================ */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

/* ===============================
   DADOS EM MEMÓRIA (MVP)
================================ */
const usuarios = [
  { email: 'admin@indicons.com.br', senha: 'admin123', role: 'admin', nome: 'Administrador' },
  { email: 'parceiro@indicons.com.br', senha: 'parceiro123', role: 'parceiro', nome: 'Parceiro' }
];

const indicadores = [];
const indicacoes = [];

/* ===============================
   HEALTH CHECK (RENDER)
================================ */
app.get('/', (req, res) => {
  res.send('INDICONS ONLINE');
});

/* ===============================
   LOGIN
================================ */
app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  const user =
    usuarios.find(u => u.email === email && u.senha === senha) ||
    indicadores.find(i => i.email === email && i.senha === senha);

  if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

  res.json({
    role: user.role,
    nome: user.nome,
    codigo: user.codigo || null
  });
});

/* ===============================
   CADASTRO INDICADOR
================================ */
app.post('/cadastro', (req, res) => {
  const { email, senha, nome } = req.body;

  const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();

  indicadores.push({
    email,
    senha,
    nome,
    role: 'indicador',
    codigo,
    nivel: 'Ativo'
  });

  res.json({ success: true, codigo });
});

/* ===============================
   LINK DO INDICADOR
================================ */
app.get('/i/:codigo', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/indicacao.html'));
});

/* ===============================
   REGISTRO DE LEAD + IA + GOOGLE
================================ */
app.post('/indicacao', async (req, res) => {
  try {
    const { nome, whatsapp, codigoIndicador } = req.body;

    const indicador = indicadores.find(i => i.codigo === codigoIndicador);
    if (!indicador) {
      return res.status(400).json({ error: 'Indicador inválido' });
    }

    const ia = await classificarEAgendar({ nome, whatsapp });

    indicacoes.push({
      id: Date.now(),
      nome,
      whatsapp,

      indicadorCodigo: indicador.codigo,
      indicadorNome: indicador.nome,

      classificacaoIA: ia.classificacao,
      status: ia.status,

      horarioReuniao: ia.horarioReuniao || null,
      linkReuniao: ia.linkReuniao || null,

      criadaEm: new Date()
    });

    res.json({ success: true });
  } catch (e) {
    console.error('Erro ao registrar lead:', e);
    res.status(500).json({ error: 'Erro ao registrar lead' });
  }
});

/* ===============================
   INDICADOR — PAINEL
================================ */
app.get('/indicador/:codigo', (req, res) => {
  const indicador = indicadores.find(i => i.codigo === req.params.codigo);

  if (!indicador) {
    return res.status(404).json({ error: 'Indicador não encontrado' });
  }

  res.json({
    nome: indicador.nome,
    codigo: indicador.codigo,
    indicacoes: indicacoes.filter(
      l => l.indicadorCodigo === indicador.codigo
    )
  });
});

/* ===============================
   ADMIN
================================ */
app.get('/admin/usuarios', (req, res) => {
  const lista = [
    ...usuarios.map(u => ({
      nome: u.nome,
      email: u.email,
      tipo: u.role
    })),
    ...indicadores.map(i => ({
      nome: i.nome,
      email: i.email,
      tipo: 'indicador'
    }))
  ];
  res.json(lista);
});

app.get('/admin/leads', (req, res) => {
  res.json(indicacoes);
});

/* ===============================
   PARCEIRO
================================ */
app.get('/parceiro/leads', (req, res) => {
  res.json(indicacoes);
});

app.post('/parceiro/lead/status', (req, res) => {
  const { leadId, status } = req.body;

  const lead = indicacoes.find(l => l.id === leadId);
  if (!lead) return res.status(404).json({ error: 'Lead não encontrado' });

  lead.status = status;
  res.json({ success: true });
});

/* ===============================
   🔐 OAUTH GOOGLE — ETAPA 5
================================ */

/* Iniciar autorização Google */
app.get('/auth/google', (req, res) => {
  const url = gerarUrlAutorizacao();
  res.redirect(url);
});

/* Callback do Google */
let googleTokens = null;

app.get('/oauth2callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).send('Código não fornecido');
    }

    const tokens = await obterTokens(code);
    googleTokens = tokens;
    setTokens(tokens);

    res.send(
      '✅ Google Calendar conectado com sucesso. Pode fechar esta página.'
    );
  } catch (e) {
    console.error('Erro OAuth:', e);
    res.status(500).send('Erro ao autenticar com Google');
  }
});

/* ===============================
   START
================================ */
app.listen(PORT, () => {
  console.log(`🚀 INDICONS ONLINE NA PORTA ${PORT}`);
});
