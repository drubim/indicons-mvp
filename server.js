const express = require('express');
const path = require('path');

/* ===============================
   APP BÁSICO
================================ */
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

/* ===============================
   "BANCO" EM MEMÓRIA (MVP)
================================ */

/* Usuários fixos */
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
    nome: 'Parceiro'
  }
];

/* Indicadores cadastrados */
const indicadores = [];

/* Indicações (leads) */
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
    nome: user.nome
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

  indicadores.push({
    email,
    senha,
    nome: nome || 'Indicador',
    role: 'indicador',
    nivel: 'Ativo',
    vendas: 0
  });

  res.json({ success: true });
});

/* ===============================
   LINK PÚBLICO DE INDICAÇÃO
================================ */
app.get('/i/:codigo', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/indicacao.html'));
});

/* ===============================
   REGISTRO DA INDICAÇÃO
================================ */
app.post('/indicacao', async (req, res) => {
  const { nome, whatsapp } = req.body;

  if (!nome || !whatsapp) {
    return res.status(400).json({ error: 'Dados inválidos' });
  }

  const novaIndicacao = {
    id: Date.now(),
    nome,
    whatsapp,
    status: 'Registrado',          // 🟡
    cor: 'amarelo',
    criadaEm: new Date()
  };

  indicacoes.push(novaIndicacao);

  console.log('🟡 NOVA INDICAÇÃO REGISTRADA:', novaIndicacao.nome);

  /* ===============================
     IA-SDR (MOCK POR ENQUANTO)
     Aqui entra a IA real depois
  ================================ */

  console.log('🤖 IA-SDR iniciando contato (mock)');
  console.log(`Mensagem simulada para ${whatsapp}`);

  // Simulação de lead quente
  const leadQuente = true;

  if (leadQuente) {
    novaIndicacao.status = 'Em atendimento'; // 🔵
    novaIndicacao.cor = 'azul';

    console.log('🔥 Lead qualificado');
    console.log('📅 Reunião simulada agendada');
    console.log('🔵 Status atualizado para EM ATENDIMENTO');
  }

  res.json({ success: true });
});

/* ===============================
   ROTAS DE TESTE (OPCIONAL)
================================ */
app.get('/_debug/indicacoes', (req, res) => {
  res.json(indicacoes);
});

app.get('/_debug/indicadores', (req, res) => {
  res.json(indicadores);
});

/* ===============================
   START SERVER
================================ */
app.listen(PORT, () => {
  console.log(`🚀 INDICONS rodando na porta ${PORT}`);
});
