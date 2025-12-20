const express = require('express');
const path = require('path');
const { classificarEAgendar } = require('./services/iaSdr');

const app = express();
const PORT = process.env.PORT || 3000;

/* ===============================
   MIDDLEWARE
================================ */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

/* ===============================
   DADOS EM MEMÓRIA
================================ */
const usuarios = [
  { email: 'admin@indicons.com.br', senha: 'admin123', role: 'admin', nome: 'Administrador' },
  { email: 'parceiro@indicons.com.br', senha: 'parceiro123', role: 'parceiro', nome: 'Parceiro' }
];

const indicadores = [];
const indicacoes = [];

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
   LINK INDICADOR
================================ */
app.get('/i/:codigo', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/indicacao.html'));
});

/* ===============================
   REGISTRO DE LEAD + IA
================================ */
app.post('/indicacao', async (req, res) => {
  const { nome, whatsapp, codigoIndicador } = req.body;

  const indicador = indicadores.find(i => i.codigo === codigoIndicador);
  if (!indicador) {
    return res.status(400).json({ error: 'Indicador inválido' });
  }

  const ia = await classificarEAgendar({ whatsapp });

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
});

/* ===============================
   PARCEIRO — LISTAR LEADS
================================ */
app.get('/parceiro/leads', (req, res) => {
  res.json(indicacoes);
});

/* ===============================
   PARCEIRO — AÇÃO HUMANA FINAL
================================ */
app.post('/parceiro/lead/status', (req, res) => {
  const { leadId, status } = req.body;

  const lead = indicacoes.find(l => l.id === leadId);
  if (!lead) return res.status(404).json({ error: 'Lead não encontrado' });

  lead.status = status;

  res.json({ success: true });
});

/* ===============================
   START
================================ */
app.listen(PORT, () => {
  console.log(`🚀 INDICONS ONLINE NA PORTA ${PORT}`);
});
