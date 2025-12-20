const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');

const app = express();
const db = new sqlite3.Database('./indicons.db');
const SECRET = 'indicons_secret';

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

function role(role) {
  return (req, res, next) => {
    if (req.user.role !== role) return res.sendStatus(403);
    next();
  };
}

function evento(cliente_id, tipo, origem) {
  db.run(
    `INSERT INTO eventos (cliente_id, tipo_evento, origem) VALUES (?, ?, ?)`,
    [cliente_id, tipo, origem]
  );
}

/* ==== BANCO ==== */
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    nome TEXT,
    email TEXT UNIQUE,
    senha_hash TEXT,
    role TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS indicadores (
    id INTEGER PRIMARY KEY,
    user_id INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS parceiros (
    id INTEGER PRIMARY KEY,
    user_id INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY,
    nome TEXT,
    slug TEXT,
    valor_min REAL,
    valor_max REAL,
    parcela_min REAL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY,
    nome TEXT,
    telefone TEXT,
    produto_id INTEGER,
    indicador_id INTEGER,
    status_externo TEXT,
    status_interno TEXT,
    valor_estimado REAL,
    prazo_estimado INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS vendas (
    id INTEGER PRIMARY KEY,
    cliente_id INTEGER,
    produto_id INTEGER,
    parceiro_id INTEGER,
    valor_carta REAL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS comissoes (
    id INTEGER PRIMARY KEY,
    venda_id INTEGER,
    indicador_id INTEGER,
    valor REAL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS eventos (
    id INTEGER PRIMARY KEY,
    cliente_id INTEGER,
    tipo_evento TEXT,
    origem TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

/* ==== LOGIN ==== */
app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;
  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (!user) return res.sendStatus(401);
    if (!bcrypt.compareSync(senha, user.senha_hash)) return res.sendStatus(401);

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET);
    res.json({ token, role: user.role });
  });
});

/* ==== CADASTRO CLIENTE ==== */
app.post('/api/clientes', (req, res) => {
  const { nome, telefone, produto_id, indicador_id, valor_estimado, prazo_estimado } = req.body;

  db.run(
    `INSERT INTO clientes 
    (nome, telefone, produto_id, indicador_id, status_externo, status_interno, valor_estimado, prazo_estimado)
    VALUES (?, ?, ?, ?, 'CLIENTE REGISTRADO', 'CAPTADO', ?, ?)`,
    [nome, telefone, produto_id, indicador_id, valor_estimado, prazo_estimado],
    function () {
      evento(this.lastID, 'CLIENTE_REGISTRADO', 'SISTEMA');
      res.json({ ok: true });
    }
  );
});

/* ==== INDICADOR ==== */
app.get('/api/indicador/clientes', auth, role('indicador'), (req, res) => {
  db.all(
    `SELECT c.nome, c.status_externo, v.valor_carta, co.valor
     FROM clientes c
     LEFT JOIN vendas v ON v.cliente_id = c.id
     LEFT JOIN comissoes co ON co.venda_id = v.id
     WHERE c.indicador_id = ?`,
    [req.user.id],
    (_, rows) => res.json(rows)
  );
});

/* ==== PARCEIRO ==== */
app.post('/api/parceiro/venda', auth, role('parceiro'), (req, res) => {
  const { cliente_id, produto_id, valor_carta } = req.body;

  db.run(
    `INSERT INTO vendas (cliente_id, produto_id, parceiro_id, valor_carta)
     VALUES (?, ?, ?, ?)`,
    [cliente_id, produto_id, req.user.id, valor_carta],
    function () {
      const venda_id = this.lastID;
      const comissao = valor_carta * 0.02;

      db.get(`SELECT indicador_id FROM clientes WHERE id = ?`, [cliente_id], (_, c) => {
        db.run(
          `INSERT INTO comissoes (venda_id, indicador_id, valor)
           VALUES (?, ?, ?)`,
          [venda_id, c.indicador_id, comissao]
        );

        db.run(
          `UPDATE clientes SET status_externo = 'VENDA CONCLUÍDA' WHERE id = ?`,
          [cliente_id]
        );

        evento(cliente_id, 'VENDA_CONCLUIDA', 'PARCEIRO');
        res.json({ ok: true });
      });
    }
  );
});

app.listen(3000, () => console.log('INDICONS rodando'));
