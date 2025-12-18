/***************************************************
 * INDICONS — SERVER.JS (VERSÃO ESTÁVEL)
 ***************************************************/

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const session = require("express-session");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   CONFIGURAÇÕES BÁSICAS
========================= */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: "indicons_secret_2025",
  resave: false,
  saveUninitialized: false
}));

app.use(express.static("public"));

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
      status TEXT DEFAULT 'PRE_ADESAO',
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
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
});

/* =========================
   MIDDLEWARES
========================= */
function auth(req, res, next) {
  if (!req.session.usuario) return res.redirect("/login.html");
  next();
}

function requireParceiro(req, res, next) {
  if (!req.session.usuario || req.session.usuario.tipo !== "parceiro") {
    return res.redirect("/login.html");
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.usuario || req.session.usuario.tipo !== "admin") {
    return res.redirect("/login.html");
  }
  next();
}

/* =========================
   ROTAS PRINCIPAIS
========================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

/* =========================
   CADASTRO / LOGIN
========================= */
app.post("/cadastro", async (req, res) => {
  const { nome, email, senha } = req.body;
  const hash = await bcrypt.hash(senha, 10);

  db.run(
    "INSERT INTO usuarios (nome,email,senha,tipo) VALUES (?,?,?,?)",
    [nome, email, hash, "indicador"],
    err => {
      if (err) return res.send("Erro ao cadastrar");
      res.redirect("/login.html");
    }
  );
});

app.post("/login", (req, res) => {
  const { email, senha } = req.body;

  db.get(
    "SELECT * FROM usuarios WHERE email=?",
    [email],
    async (err, user) => {
      if (!user) return res.send("Usuário não encontrado");
      const ok = await bcrypt.compare(senha, user.senha);
      if (!ok) return res.send("Senha inválida");

      req.session.usuario = user;

      if (user.tipo === "admin") return res.redirect("/admin");
      if (user.tipo === "parceiro") return res.redirect("/parceiro");
      return res.redirect("/dashboard");
    }
  );
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

/* =========================
   DASHBOARD INDICADOR
========================= */
app.get("/dashboard", auth, (req, res) => {
  res.sendFile(path.join(__dirname, "public/dashboard.html"));
});

app.get("/api/dashboard", auth, (req, res) => {
  db.all(
    "SELECT * FROM leads WHERE indicador_id=?",
    [req.session.usuario.id],
    (err, rows) => res.json(rows || [])
  );
});

/* =========================
   PRÉ-ADESÃO (CLIENTE)
========================= */
app.post("/api/pre-adesao", (req, res) => {
  const { nome, telefone, email, administradora, valor, indicador } = req.body;

  db.run(
    `INSERT INTO leads (nome,telefone,email,administradora,valor,indicador_id)
     VALUES (?,?,?,?,?,?)`,
    [nome, telefone, email, administradora, valor, indicador],
    () => res.json({ ok: true })
  );
});

/* =========================
   ÁREA PARCEIRO
========================= */
app.get("/parceiro", requireParceiro, (req, res) => {
  res.sendFile(path.join(__dirname, "public/parceiro.html"));
});

app.get("/api/parceiro/leads", requireParceiro, (req, res) => {
  db.all(
    "SELECT * FROM leads WHERE status != 'VENDIDO'",
    [],
    (err, rows) => res.json(rows || [])
  );
});

app.post("/api/parceiro/status", requireParceiro, (req, res) => {
  const { leadId, status } = req.body;
  db.run(
    "UPDATE leads SET status=? WHERE id=?",
    [status, leadId],
    () => res.json({ ok: true })
  );
});

/* =========================
   ÁREA ADMIN
========================= */
app.get("/admin", requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "public/admin.html"));
});

app.get("/api/admin/dashboard", requireAdmin, (req, res) => {
  db.get("SELECT COUNT(*) as u FROM usuarios", [], (e, u) => {
    db.get("SELECT COUNT(*) as l FROM leads", [], (e2, l) => {
      res.json({
        usuarios: u.u,
        leads: l.l
      });
    });
  });
});

/* =========================
   SERVIDOR
========================= */
app.listen(PORT, () => {
  console.log("INDICONS rodando na porta " + PORT);
});
