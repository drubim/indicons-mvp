const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

/* =======================
   MIDDLEWARES
======================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

/* =======================
   USUÁRIOS EM MEMÓRIA
======================= */
let usuarios = [
  { id: 1, email: 'admin@indicons.com.br', senha: 'admin123', role: 'admin' },
  { id: 2, email: 'parceiro@indicons.com.br', senha: 'parceiro123', role: 'parceiro' }
];

let indicadorIdCounter = 100;

/* =======================
   LOGIN
======================= */
app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;

  const user = usuarios.find(
    u => u.email === email && u.senha === senha
  );

  if (!user) {
    return res.status(401).json({ error: 'Usuário ou senha inválidos' });
  }

  res.json({
    token: 'fake-token',
    role: user.role
  });
});

/* =======================
   CADASTRO DE INDICADOR
======================= */
app.post('/api/cadastro-indicador', (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'Dados inválidos' });
  }

  const existe = usuarios.find(u => u.email === email);
  if (existe) {
    return res.status(409).json({ error: 'Usuário já existe' });
  }

  const novoIndicador = {
    id: indicadorIdCounter++,
    email,
    senha,
    role: 'indicador'
  };

  usuarios.push(novoIndicador);

  res.json({ sucesso: true });
});

/* =======================
   ROTAS HTML
======================= */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/cadastro.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'cadastro.html'));
});

app.get('/painel-indicador.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'painel-indicador.html'));
});

/* =======================
   ROTA INVISÍVEL
======================= */
app.get('/i/:codigo', (req, res) => {
  res.send(`
    <h2>Cadastro recebido</h2>
    <p>Em breve entraremos em contato.</p>
  `);
});

/* =======================
   START
======================= */
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
