const express = require('express');
const path = require('path');
const { agendarComDuplicacao } = require('./services/googleAgenda');
const { classificarLead } = require('./services/iaSdr');

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
    calendarId: null // futura agenda do parceiro
  }
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

  const existe =
    usuarios.find(u => u.email === email) ||
    indicadores.find(i => i.email === email);

  if (existe) {
    return res.status(409).json({ error: 'Usuário já existe' });
  }

  const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();

  indicadores.push({
    email,
    senha,
    nome: nome || 'Indicador',
    role: 'indicador',
    codigo,
    nivel: 'Ativo',
    vendas: 0
  });

  res.json({ success: true, codigo });
});

/* ===============================
   LINK DO INDICADOR
================================ */
app.get('/i/:codigo', (req, res) => {
  const indicador = indicadores.find(i => i.codigo === req.params.codigo);
  if (!indicador) return res.status(404).send('Link inválido');

  res.sendFile(path.join(__dirname, 'public/indicacao.html'));
});

/* ===============================
   REGISTRO + IA + DECISÃO
================================ */
app.post('/indicacao', async (req, res) => {
  try {
    const { nome, whatsapp, codigoIndicador } = req.body;

    const indicador = indicadores.find(i => i.codigo === codigoIndicador);
    if (!indicador) {
      return res.status(400).json({ error: 'Indicador inválido' });
    }

    // 1️⃣ IA classifica o lead
    const resultadoIA = await classificarLead({ nome, whatsapp });

    const lead = {
      id: Date.now(),
      nome,
      whatsapp,
      indicadorCodigo: indicador.codigo,
      indicadorNome: indicador.nome,
      classificacaoIA: resultadoIA.classificacao,
      resumoIA: resultadoIA.resumo,
      status: 'Registrado',
      criadaEm: new Date()
    };

    // 2️⃣ DECISÃO DA IA
    if (resultadoIA.classificacao === 'QUENTE') {
      const parceiro = usuarios.find(u => u.role === 'parceiro');

      const horarioISO = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toISOString(); // amanhã (exemplo)

      const evento = await agendarComDuplicacao({
        nome,
        whatsapp,
        inicio: horarioISO,
        parceiroCalendarId: parceiro.calendarId
      });

      lead.status = 'Em atendimento';
      lead.horarioAgendado = evento.inicio;
      lead.meetLink = evento.meetLink;
    }

    indicacoes.push(lead);

    console.log(`🤖 IA: ${resultadoIA.classificacao} → ${lead.status}`);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no processamento do lead' });
  }
});

/* ===============================
   PAINEL INDICADOR
================================ */
app.get('/indicador/:codigo', (req, res) => {
  const indicador = indicadores.find(i => i.codigo === req.params.codigo);
  if (!indicador) return res.status(404).json({ error: 'Não encontrado' });

  res.json({
    nome: indicador.nome,
    codigo: indicador.codigo,
    nivel: indicador.nivel,
    indicacoes: indicacoes.filter(i => i.indicadorCodigo === indicador.codigo)
  });
});

/* ===============================
   PAINEL PARCEIRO
================================ */
app.get('/parceiro/leads', (req, res) => {
  res.json(indicacoes.filter(i => i.status === 'Em atendimento'));
});

/* ===============================
   START
================================ */
app.listen(PORT, () => {
  console.log(`🚀 INDICONS rodando na porta ${PORT}`);
});
