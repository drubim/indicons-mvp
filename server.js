// ===============================
// INDICONS - SERVER.JS COMPLETO
// ===============================

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = 'indicons_secret_key';

// ===============================
// MIDDLEWARES
// ===============================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// ===============================
// DATABASE
// ===============================
const db = new sqlite3.Database('./indicons.db');

// ===============================
// AUTH MIDDLEWARE
// ===============================
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token ausente' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = decoded;
    next();
  });
}

function role(required) {
  return (req, res, next) => {
    if (req.user.role !== required) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    next();
  };
}

// ===============================
// EVENTOS (AUDITORIA)
// ===============================
function registrarEvento(clienteId, tipo, origem, descricao = '') {
  db.run(
    `INSERT INTO eventos (cliente_id, tipo_evento, origem, descricao)
     VALUES (?, ?, ?, ?)`,
    [clienteId, tipo, origem, descricao]
  );
}

// ===============================
// DATABASE SETUP
// ===============================
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

  db.run(`
    CREATE TABLE IF NOT EXISTS indicadores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS parceiros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      link_reuniao TEXT,
      ativo INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      slug TEXT,
      valor_min REAL,
      valor_max REAL,
      parcela_min REAL,
      ativo INTEGER DEFAULT 1
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      telefone TEXT,
      produto_id INTEGER,
      indicador_id INTEGER,
      parceiro_id INTEGER,
      status_externo TEXT DEFAULT 'CLIENTE REGISTRADO',
      status_interno TEXT,
      valor_estimado REAL,
      prazo_estimado INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS vendas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER,
      produto_id INTEGER,
      parceiro_id INTEGER,
      valor_carta REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS comissoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venda_id INTEGER,
      indicador_id INTEGER,
      percentual REAL,
      valor_comissao REAL,
      status TEXT DEFAULT 'PENDENTE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      paid_at DATETIME
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS eventos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER,
      tipo_evento TEXT,
      origem TEXT,
      descricao TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// ===============================
// ROTAS DE PÁGINA (CRÍTICO)
// ===============================
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/parceiro', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'parceiro.html'));
});

app.get('/indicador', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'indicador.html'));
});

// ===============================
// AUTH / LOGIN
// ===============================
app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;

  db.get(
    `SELECT * FROM users WHERE email = ? AND ativo = 1`,
    [email],
    (err, user) => {
      if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });
      if (!bcrypt.compareSync(senha, user.senha_hash)) {
        return res.status(401).json({ error: 'Senha inválida' });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role },
        SECRET,
        { expiresIn: '8h' }
      );

      res.json({ token, role: user.role });
    }
  );
});

// ===============================
// CADASTRO DE CLIENTE (PÚBLICO)
// ===============================
app.post('/api/clientes', (req, res) => {
  const {
    nome,
    telefone,
    produto_id,
    indicador_id,
    valor_estimado,
    prazo_estimado
  } = req.body;

  db.run(
    `INSERT INTO clientes
     (nome, telefone, produto_id, indicador_id, status_externo, status_interno, valor_estimado, prazo_estimado)
     VALUES (?, ?, ?, ?, 'CLIENTE REGISTRADO', 'CAPTADO', ?, ?)`,
    [nome, telefone, produto_id, indicador_id, valor_estimado, prazo_estimado],
    function () {
      registrarEvento(this.lastID, 'CLIENTE_REGISTRADO', 'SISTEMA');
      res.json({ success: true });
    }
  );
});

// ===============================
// INDICADOR - ACOMPANHAMENTO
// ===============================
app.get('/api/indicador/clientes', auth, role('indicador'), (req, res) => {
  db.all(
    `
    SELECT 
      c.nome,
      c.status_externo,
      v.valor_carta,
      co.valor_comissao
    FROM clientes c
    LEFT JOIN vendas v ON v.cliente_id = c.id
    LEFT JOIN comissoes co ON co.venda_id = v.id
    WHERE c.indicador_id = ?
    `,
    [req.user.id],
    (err, rows) => {
      res.json(rows || []);
    }
  );
});

// ===============================
// PARCEIRO - CONFIRMAR VENDA
// ===============================
app.post('/api/parceiro/venda', auth, role('parceiro'), (req, res) => {
  const { cliente_id, produto_id, valor_carta } = req.body;

  db.run(
    `
    INSERT INTO vendas (cliente_id, produto_id, parceiro_id, valor_carta)
    VALUES (?, ?, ?, ?)
    `,
    [cliente_id, produto_id, req.user.id, valor_carta],
    function () {
      const vendaId = this.lastID;
      const percentual = 0.02;

      db.get(
        `SELECT indicador_id FROM clientes WHERE id = ?`,
        [cliente_id],
        (err, cliente) => {
          const valorComissao = valor_carta * percentual;

          db.run(
            `
            INSERT INTO comissoes (venda_id, indicador_id, percentual, valor_comissao)
            VALUES (?, ?, ?, ?)
            `,
            [vendaId, cliente.indicador_id, percentual, valorComissao]
          );

          db.run(
            `
            UPDATE clientes
            SET status_externo = 'VENDA CONCLUÍDA', status_interno = 'VENDA_FECHADA'
            WHERE id = ?
            `,
            [cliente_id]
          );

          registrarEvento(cliente_id, 'VENDA_CONCLUIDA', 'PARCEIRO');
          res.json({ success: true });
        }
      );
    }
  );
});

// ===============================
// SERVER START
// ===============================
app.listen(PORT, () => {
  console.log(`✅ INDICONS rodando na porta ${PORT}`);
});
