const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

/* MIDDLEWARE */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

/* "BANCO" EM MEMÓRIA */
const usuarios = [
  { email: 'admin@indicons.com.br', senha: 'admin123', role: 'admin' },
  { email: 'parceiro@indicons.com.br', senha: 'parceiro123', role: 'parceiro' },
  { email: 'indicador@indicons.com.br', senha: 'indicador123', role: 'indicador' }
];

/* LOGIN */
app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  const user = usuarios.find(
    u => u.email === email && u.senha === senha
  );

  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  res.json({ role: user.role });
});

/* CADASTRO DE INDICADOR */
app.post('/cadastro', (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
