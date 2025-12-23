const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const SECRET = 'indicons-secret';

/* ======================
   USUÁRIOS EM MEMÓRIA
====================== */
const usuarios = [
  { id: 1, email: 'admin@indicons.com.br', senha: 'admin123', role: 'admin' },
  { id: 2, email: 'parceiro@indicons.com.br', senha: 'parceiro123', role: 'parceiro' }
];

let proximoId = 3;

/* ======================
   LOGIN
====================== */
app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;

  const usuario = usuarios.find(
    u => u.email === email && u.senha === senha
  );

  if (!usuario) {
    return res.status(401).json({ erro: 'Usuário ou senha inválidos' });
  }

  const token = jwt.sign(
    { id: usuario.id, role: usuario.role },
    SECRET,
    { expiresIn: '1d' }
  );

  res.json({ token, role: usuario.role });
});

/* ======================
   CADASTRO DE INDICADOR
====================== */
app.post('/api/cadastro', (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Dados inválidos' });
  }

  const existe = usuarios.find(u => u.email === email);
  if (existe) {
    return res.status(400).json({ erro: 'Usuário já existe' });
  }

  usuarios.push({
    id: proximoId++,
    email,
    senha,
    role: 'indicador'
  });

  res.json({ sucesso: true });
});

/* ======================
   ROTA INVISÍVEL CLIENTE
====================== */
app.get('/i/:codigo', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/cadastro-cliente.html'));
});

/* ======================
   START
====================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Indicons rodando');
});
