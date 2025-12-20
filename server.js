const express = require('express');
const path = require('path');

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
   CADASTRO DE INDICADOR
================================ */
app.post('/cadastro', (req, res) => {
  const { email, senha, nome } = req.body;

  const existe =
    usuarios.find(u => u.email === email) ||
    indicadores.find(i => i.email === email);

  if (existe) return res.status(409).json({ error: 'Usuário já existe' });

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
   REGISTRO DE LEAD
================================ */
app.post('/indicacao', (req, res) => {
  const { nome, whatsapp, codigoIndicador } = req.body;

  const indicador = indicadores.find(i => i.codigo === codigoIndicador);
  if (!indicador) return res.status(400).json({ error: 'Indicador inválido' });

  indicacoes.push({
    id: Date.now(),
    nome,
    whatsapp,
    indicadorCodigo: indicador.codigo,
    indicadorNome: indicador.nome,
    status: 'Registrado',
    criadaEm: new Date()
  });

  res.json({ success: true });
});

/* ===============================
   ROTAS ADMIN (ESSENCIAIS)
================================ */

// Resumo
app.get('/admin/resumo', (req, res) => {
  res.json({
    usuarios: usuarios.length + indicadores.length,
    leads: indicacoes.length,
    comissoes: 0
  });
});

// Usuários
app.get('/admin/usuarios', (req, res) => {
  res.json([
    ...usuarios.map(u => ({ nome: u.nome, email: u.email, tipo: u.role })),
    ...indicadores.map(i => ({ nome: i.nome, email: i.email, tipo: 'indicador' }))
  ]);
});

// Leads
app.get('/admin/leads', (req, res) => {
  res.json(indicacoes);
});

/* ===============================
   START
================================ */
app.listen(PORT, () => {
  console.log(`🚀 INDICONS ONLINE NA PORTA ${PORT}`);
});
