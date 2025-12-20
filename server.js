const express = require('express');
const path = require('path');
const { agendarComDuplicacao } = require('./services/googleAgenda');

const app = express();
const PORT = process.env.PORT || 3000;

/* ===============================
   MIDDLEWARES
================================ */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

/* ===============================
   DADOS EM MEMÓRIA (MVP)
================================ */

// Admin e parceiro
const usuarios = [
  {
    email: 'admin@indicons.com.br',
    senha: 'admin123',
    role: 'admin',
    nome: 'Administrador'
  },
  {
    email: 'parceiro@indicons.com.br',
    senha: 'parceiro123',
    role: 'parceiro',
    nome: 'Parceiro',
    calendarId: null // 🔹 futuramente agenda do parceiro
  }
];

// Indicadores
const indicadores = [];

// Indicações (leads)
const indicacoes = [];

/* ===============================
   LOGIN
================================ */
app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  const user =
    usuarios.find(u => u.email === email && u.senha === senha) ||
    indicadores.find(i => i.email === email && i.senha === senha);

  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  res.json({
    role: user.role,
    nome: user.nome,
    codigo: user.codigo || null
  });
});

/* ===============================
   CADASTRO DE INDICADOR
================================ */
app.post('/cadastro', (req, res) => {
  const { email, senha, nome } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  const existe =
    usuarios.find(u => u.email === email) ||
    indicadores.find(i => i.email === email);

  if (existe) {
    return res.status(409).json({ error: 'Usuário já existe' });
  }

  const codigoIndicador = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();

  indicadores.push({
    email,
    senha,
    nome: nome || 'Indicador',
    role: 'indicador',
    codigo: codigoIndicador,
    nivel: 'Ativo',
    vendas: 0
  });

  res.json({ success: true, codigo: codigoIndicador });
});

/* ===============================
   LINK ÚNICO DO INDICADOR
================================ */
app.get('/i/:codigo', (req, res) => {
  const { codigo } = req.params;

  const indicador = indicadores.find(i => i.codigo === codigo);
  if (!indicador) {
    return res.status(404).send('Link inválido');
  }

  res.sendFile(path.join(__dirname, 'public/indicacao.html'));
});

/* ===============================
   REGISTRO DA INDICAÇÃO
   (LEAD QUALIFICADO → AGENDA REAL)
================================ */
app.post('/indicacao', async (req, res) => {
  try {
    const { nome, whatsapp, codigoIndicador } = req.body;

    const indicador = indicadores.find(i => i.codigo === codigoIndicador);
    if (!indicador) {
      return res.status(400).json({ error: 'Indicador inválido' });
    }

    // 🔹 horário exemplo (depois vem da IA)
    const horarioISO = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ).toISOString(); // amanhã

    const parceiro = usuarios.find(u => u.role === 'parceiro');

    // 🔹 AQUI ACONTECE O AGENDAMENTO REAL
    const evento = await agendarComDuplicacao({
      nome,
      whatsapp,
      inicio: horarioISO,
      parceiroCalendarId: parceiro.calendarId // null por enquanto
    });

    indicacoes.push({
      id: Date.now(),
      nome,
      whatsapp,
      indicadorCodigo: indicador.codigo,
      indicadorNome: indicador.nome,
      status: 'Em atendimento',
      horarioAgendado: evento.inicio,
      meetLink: evento.meetLink,
      criadaEm: new Date()
    });

    console.log(`📅 Agendado + Meet criado para ${nome}`);

    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao agendar:', err);
    res.status(500).json({ error: 'Erro ao agendar reunião' });
  }
});

/* ===============================
   PAINEL DO INDICADOR (API)
================================ */
app.get('/indicador/:codigo', (req, res) => {
  const { codigo } = req.params;

  const indicador = indicadores.find(i => i.codigo === codigo);
  if (!indicador) {
    return res.status(404).json({ error: 'Indicador não encontrado' });
  }

  const minhasIndicacoes = indicacoes.filter(
    i => i.indicadorCodigo === codigo
  );

  res.json({
    nome: indicador.nome,
    codigo: indicador.codigo,
    nivel: indicador.nivel,
    indicacoes: minhasIndicacoes
  });
});

/* ===============================
   PAINEL DO PARCEIRO
================================ */
app.get('/parceiro/leads', (req, res) => {
  const leads = indicacoes.filter(
    i => i.status === 'Em atendimento'
  );
  res.json(leads);
});

app.post('/parceiro/status', (req, res) => {
  const { id, status } = req.body;

  const lead = indicacoes.find(i => i.id === id);
  if (!lead) {
    return res.status(404).json({ error: 'Lead não encontrado' });
  }

  lead.status = status;

  if (status === 'Venda concluída') {
    const indicador = indicadores.find(
      i => i.codigo === lead.indicadorCodigo
    );

    if (indicador) {
      indicador.vendas += 1;

      if (indicador.vendas >= 3) indicador.nivel = 'Premium';
      else if (indicador.vendas >= 1) indicador.nivel = 'Destaque';
      else indicador.nivel = 'Ativo';
    }
  }

  res.json({ success: true });
});

/* ===============================
   START SERVER
================================ */
app.listen(PORT, () => {
  console.log(`🚀 INDICONS rodando na porta ${PORT}`);
});
