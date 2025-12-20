// ========================================
// INDICONS - SERVER.JS FINAL FUNCIONAL
// ========================================

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = 'indicons_secret';

// ========================================
// MIDDLEWARES
// ========================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ========================================
// DATABASE
// ========================================
const db = new sqlite3.Database('./indicons.db');

// ========================================
// DATABASE SETUP
// ========================================
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      email TEXT UNIQUE,
      senha_hash TEXT,
      role TEXT,
      ativo INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// ========================================
// CRIA USUÁRIOS PADRÃO (SE NÃO EXISTIREM)
// ========================================
function criarUsuario(email, senha, role, nome) {
  db.get(`SELECT id FROM users WHERE email = ?`, [email], (err, row) => {
    if (!row) {
      const hash = bcrypt.hashSync(senha, 10);
      db.run(
        `INSERT INTO users (nome, email, senha_hash, role, ativo)
         VALUES (?, ?, ?, ?, 1)`,
        [nome, email, hash, role]
      );
      console.log(`✅ Usuário criado: ${email} / ${senha}`);
    }
  });
}

criarUsuario('admin@indicons.com.br', 'admin123', 'admin', 'Administrador');
criarUsuario('parceiro@indicons.com.br', 'parceiro123', 'parceiro', 'Parceiro');
criarUsuario('indicador@indicons.com.br', 'indicador123', 'indicador', 'Indicador');

// ========================================
// ROTAS DE PÁGINA
// ========================================
app.get('/login', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'login.html'))
);

app.get('/admin', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'admin.html'))
);

app.get('/parceiro', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'parceiro.html'))
);

app.get('/indicador', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'indicador.html'))
);

// ========================================
// API LOGIN (USADO PELO login.js)
// ========================================
app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;

  db.get(
    `SELECT * FROM users WHERE email = ? AND ativo = 1`,
    [email],
    (err, user) => {
      if (!user) {
        return res.status(401).json({ error: 'Usuário não encontrado' });
      }

      if (!bcrypt.compareSync(senha, user.senha_hash)) {
        return res.status(401).json({ error: 'Senha inválida' });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role },
        SECRET,
        { expiresIn: '8h' }
      );

      return res.json({
        token,
        role: user.role
      });
    }
  );
});

// ========================================
// CADASTRO DE INDICADOR
// ========================================
app.post('/cadastro', (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.redirect('/cadastro.html');
  }

  db.get(
    `SELECT id FROM users WHERE email = ?`,
    [email],
    (err, row) => {
      if (row) {
        return res.redirect('/login.html');
      }

      const hash = bcrypt.hashSync(senha, 10);

      db.run(
        `INSERT INTO users (nome, email, senha_hash, role, ativo)
         VALUES (?, ?, ?, 'indicador', 1)`,
        [nome, email, hash],
        () => res.redirect('/login.html')
      );
    }
  );
});

// ========================================
// SERVER START
// ========================================
app.listen(PORT, () => {
  console.log(`✅ INDICONS rodando na porta ${PORT}`);
});
