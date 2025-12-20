// ===================================
// INDICONS - SERVER.JS COMPATÍVEL
// ===================================

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ===================================
// MIDDLEWARES
// ===================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// ===================================
// DATABASE
// ===================================
const db = new sqlite3.Database('./indicons.db');

// ===================================
// DATABASE SETUP (SEGURO)
// ===================================
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      email TEXT UNIQUE,
      senha_hash TEXT,
      role TEXT,
      ativo INTEGER DEFAULT 1
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      telefone TEXT,
      produto TEXT,
      indicador_id INTEGER,
      status TEXT DEFAULT 'Cliente registrado',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// ===================================
// ROTAS DE PÁGINA (CRÍTICAS)
// ===================================
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/parceiro', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'parceiro.html'));
});

app.get('/indicador', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'indicador.html'));
});

app.get('/cadastro', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cadastro.html'));
});

// ===================================
// LOGIN ANTIGO (FORM POST /login)
// ===================================
app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  db.get(
    `SELECT * FROM users WHERE email = ? AND ativo = 1`,
    [email],
    (err, user) => {
      if (!user) return res.redirect('/login.html');

      if (!bcrypt.compareSync(senha, user.senha_hash)) {
        return res.redirect('/login.html');
      }

      // REDIRECIONA CONFORME PERFIL
      if (user.role === 'admin') {
        return res.redirect('/admin.html');
      }
      if (user.role === 'parceiro') {
        return res.redirect('/parceiro.html');
      }
      if (user.role === 'indicador') {
        return res.redirect('/indicador.html');
      }

      return res.redirect('/login.html');
    }
  );
});

// ===================================
// CADASTRO PÚBLICO (FORM ANTIGO)
// ===================================
app.post('/cadastro', (req, res) => {
  const { nome, telefone, produto, indicador_id } = req.body;

  db.run(
    `
    INSERT INTO clientes (nome, telefone, produto, indicador_id)
    VALUES (?, ?, ?, ?)
    `,
    [nome, telefone, produto, indicador_id || null],
    () => {
      res.redirect('/obrigado.html');
    }
  );
});

// ===================================
// API SIMPLES (NÃO BLOQUEIA TELAS)
// ===================================
app.get('/api/clientes', (req, res) => {
  db.all(
    `SELECT * FROM clientes ORDER BY created_at DESC`,
    [],
    (err, rows) => {
      res.json(rows || []);
    }
  );
});

// ===================================
// SERVER START
// ===================================
app.listen(PORT, () => {
  console.log(`✅ INDICONS rodando corretamente na porta ${PORT}`);
});
