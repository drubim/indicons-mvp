const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

/* =========================
   BASE EM MEMÓRIA (MVP)
========================= */
const usuarios = [
  {
    id: 1, 
    nome: 'Admin',
    email: 'admin@indicons.com.br',
    senha: 'admin123',
    tipo: 'admin'
  },
  {
    id: 2,
    nome: 'Parceiro',
    email: 'parceiro@indicons.com.br',
    senha: 'parceiro123',
    tipo: 'parceiro'
  }
];

const indicadores = [];
const leads = [];

/* =========================
   CADASTRO INDICADOR
========================= */
app.post('/cadastro', (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Dados incompletos' });
  }

  const existe = usuarios.find(u => u.email === email);
  if (existe) {
    return res.status(400).json({ erro: 'Usuário já existe' });
  }

  const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();

  const novoIndicador = {
    id: Date.now(),
    nome,
    email,
    senha,
    tipo: 'indicador',
    codigo
  };

  usuarios.push(novoIndicador);
  indicadores.push({ codigo, nome });

  res.json({ ok: true });
});

/* =============*
