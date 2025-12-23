const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const SECRET = 'indicons-secret';

/* ======================
   USUÁRIOS FIXOS (SEM DB)
====================== */
const usuarios = [
  { id: 1, email: 'admin@indicons.com.br', senha: 'admin123', role: 'admin' },
  { id: 2, email: 'parceiro@indicons.com.br', senha: 'parceiro123', role: 'parceiro' },
  { id: 3, email: 'indicador@indicons.com.br', senha: 'indicador123', role: 'indicador' }
];

/* ======================
   LOGIN (100% FUNCIONAL)
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
