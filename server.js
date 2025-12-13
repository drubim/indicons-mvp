/***************************************************
 * INDICONS — SERVER.JS (MVP FUNCIONAL)
 * Backend + Pré-adesão integrada (ETAPA F)
 ***************************************************/

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const session = require("express-session");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   CONFIGURAÇÕES
========================= */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: "indicons_secret_2025",
  resave: false,
  saveUninitialized: false
}));

// 🔹 SERVIR ARQUIVOS DA PASTA PUBLIC
app.use(express.static(path.join(__dirname, "public")));

/* =========================
   BANCO DE DADOS
========================= */
const db = new sqlite3.Database("./indicons.db");

db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      email TEXT UNIQUE,
      senha TEXT,
      tipo TEXT,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      telefone TEXT,
      email TEXT,
      indicador_id INTEGER,
      administradora TEXT,
      valor REAL,
      status TEXT,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS historico (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER,
      status TEXT,
      data DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS comissoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER,
      parcela INTEGER,
      percentual REAL,
      valor REAL,
      status TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS consentimentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      tipo TEXT,
      ip TEXT,
      data DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

/* =========================
   MIDDLEWARE AUTH
========================= */
function auth(req, res, next) {
  if (!req.session.usuario) {
    return res.redirect("/login.html");
  }
  next();
}

/* =========================
   HOME (PUBLIC)
========================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* =========================
   CADASTRO INDICADOR
========================= */
app.post("/api/cadastro", async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: "Dados incompletos" });
  }

  const hash = await bcrypt.hash(senha, 10);

  db.run(
    `INSERT INTO usuarios (nome,email,senha,tipo)
     VALUES (?,?,?,'indicador')`,
    [nome, email, hash],
    function (err) {
      if (err) {
        return res.status(400).json({ erro: "Email já cadastrado" });
      }

      db.run(
        `INSERT INTO consentimentos (usuario_id,tipo,ip)
         VALUES (?,?,?)`,
        [this.lastID, "INDICADOR", req.ip]
      );

      res.json({ ok: true });
    }
  );
});

/* =========================
   LOGIN
========================= */
app.post("/api/login", (req, res) => {
  const { email, senha } = req.body;

  db.get(
    `SELECT * FROM usuarios WHERE email=?`,
    [email],
    async (err, usuario) => {
      if (!usuario) {
        return res.status(401).json({ erro: "Usuário não encontrado" });
      }

      const ok = await bcrypt.compare(senha, usuario.senha);
      if (!ok) {
        return res.status(401).json({ erro: "Senha inválida" });
      }

      req.session.usuario = usuario;
      res.json({ ok: true });
    }
  );
});

/* =========================
   DASHBOARD INDICADOR
========================= */
app.get("/dashboard", auth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

app.get("/api/dashboard/leads", auth, (req, res) => {
  db.all(
    `SELECT * FROM leads WHERE indicador_id=? ORDER BY criado_em DESC`,
    [req.session.usuario.id],
    (err, rows) => res.json(rows || [])
  );
});

/* =========================
   PRÉ-ADESÃO DO CLIENTE (ETAPA F)
========================= */
app.post("/api/pre-adesao", (req, res) => {
  const {
    nome,
    telefone,
    email,
    indicador_id,
    administradora,
    valor
  } = req.body;

  if (!nome || !telefone || !email || !indicador_id) {
    return res.status(400).json({ erro: "Dados incompletos" });
  }

  db.run(
    `INSERT INTO leads
      (nome, telefone, email, indicador_id, administradora, valor, status)
     VALUES (?, ?, ?, ?, ?, ?, 'PRE_ADESAO')`,
    [nome, telefone, email, indicador_id, administradora || null, valor || null],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ erro: "Erro ao salvar lead" });
      }

      db.run(
        `INSERT INTO historico (lead_id, status)
         VALUES (?, 'PRE_ADESAO')`,
        [this.lastID]
      );

      res.json({ ok: true });
    }
  );
});

/* =========================
   API PARCEIRO (BASE)
========================= */
app.get("/api/parceiro", auth, (req, res) => {
  db.all(
    `SELECT * FROM leads WHERE status != 'VENDIDO'`,
    [],
    (err, leads) => res.json(leads || [])
  );
});

/* =========================
   LOGOUT
========================= */
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
  console.log("INDICONS rodando na porta " + PORT);
});
