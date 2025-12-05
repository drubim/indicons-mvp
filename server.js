// =============================================================
// INDICONS – Sistema completo + SQLite + LP Premium + Painel Comercial
// + Histórico de status + Proteção de comissões duplicadas
// =============================================================
const express = require("express");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();

const app = express();

// -----------------------------------------------
// CONFIGURAÇÕES BÁSICAS
// -----------------------------------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "indicons-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      // secure: true // habilitar quando estiver usando HTTPS
    }
  })
);

// -----------------------------------------------
// BANCO DE DADOS SQLite
// -----------------------------------------------
const db = new sqlite3.Database("./indicons.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS indicadores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      descricao TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS pre_vendas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      indicador_id INTEGER NOT NULL,
      produto_id INTEGER NOT NULL,
      nome_cliente TEXT NOT NULL,
      telefone_cliente TEXT NOT NULL,
      email_cliente TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PRE_ADESAO',
      valor_venda REAL,
      FOREIGN KEY(indicador_id) REFERENCES indicadores(id),
      FOREIGN KEY(produto_id) REFERENCES produtos(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS comissoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      indicador_id INTEGER NOT NULL,
      pre_venda_id INTEGER NOT NULL,
      valor_venda REAL NOT NULL,
      valor_comissao REAL NOT NULL,
      FOREIGN KEY(indicador_id) REFERENCES indicadores(id),
      FOREIGN KEY(pre_venda_id) REFERENCES pre_vendas(id)
    )
  `);

  // NOVA TABELA: histórico de status das pré-vendas
  db.run(`
    CREATE TABLE IF NOT EXISTS historico_pre_vendas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pre_venda_id INTEGER NOT NULL,
      usuario_tipo TEXT NOT NULL,        -- 'PARCEIRO' ou 'ADMIN'
      usuario_nome TEXT,
      status_anterior TEXT,
      status_novo TEXT,
      observacao TEXT,
      criado_em DATETIME DEFAULT (datetime('now','localtime')),
      FOREIGN KEY(pre_venda_id) REFERENCES pre_vendas(id)
    )
  `);

  // seed de produtos
  db.get("SELECT COUNT(*) AS c FROM produtos", (err, row) => {
    if (row && row.c === 0) {
      db.run(
        `INSERT INTO produtos (nome, descricao) VALUES (?, ?)`,
        ["Consórcio Imobiliário", "Crédito para imóveis residenciais e comerciais"]
      );
      db.run(
        `INSERT INTO produtos (nome, descricao) VALUES (?, ?)`,
        ["Consórcio Automóvel", "Crédito para veículos leves e pesados"]
      );
    }
  });
});

// Helpers async
function dbAll(sql, params = []) {
  return new Promise((resolve, reject) =>
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)))
  );
}
function dbGet(sql, params = []) {
  return new Promise((resolve, reject) =>
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)))
  );
}
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) =>
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    })
  );
}

// -------------------------------------------------------------
// LAYOUT GLOBAL (tema claro, reaproveitado para tudo)
// -------------------------------------------------------------
function layout(title, content, userNav = "") {
  return `
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <style>
    body { background:#f1f5f9; margin:0; font-family: Arial, system-ui; color:#1e293b; }

    header {
      background:#ffffff;
      border-bottom:1px solid #cbd5e1;
      position:sticky; top:0;
      z-index:10;
    }

    .header-inner {
      max-width:1100px;
      margin:auto;
      padding:10px 18px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
    }

    .logo { display:flex; align-items:center; gap:10px
