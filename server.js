/***************************************************
 * INDICONS — SERVER.JS
 * MVP funcional com PRÉ-ADESÃO integrada
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
app.use(
  session({
    secret: "indicons_secret_2025",
    resave: false,
    saveUninitialized: false,
  })
);
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
});

/* =========================
   AUTENTICAÇÃO
========================= */
function auth(req, res, next) {
  if (!req.session.usuario) return res.status(401).json({ erro: "Não autorizado" });
  next();
}

/* =========================
   HOME
========================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

/* =========================
   CADASTRO / LOGIN
========================= */
app.post("/cadastro", async (req, res) => {
  const hash = await bcrypt.hash(req.body.senha, 10);
  db.run(
    `INSERT INTO usuarios (nome,email,senha,tipo) VALUES (?,?,?,'indicador')`,
    [req.body.nome, req.body.email, hash],
    () => res.redirect("/login.html")
  );
});

app.post("/login", (req, res) => {
  db.get(
    `SELECT * FROM usuarios WHERE email=?`,
    [req.body.email],
    async (err, u) => {
      if (!u) return res.send("Usuário não encontrado");
      if (!(await bcrypt.compare(req.body.senha, u.senha)))
        return res.send("Senha inválida");
      req.session.usuario = u;
      res.redirect("/dashboard.html");
    }
  );
});

/* =========================
   PRÉ-ADESÃO (ETAPA F)
========================= */
app.post("/api/pre-adesao", auth, (req, res) => {
  const { nome, telefone, email, administradora, valor } = req.body;

  if (!nome || !telefone || !administradora || !valor) {
    return res.status(400).json({ erro: "Dados incompletos" });
  }

  db.run(
    `
    INSERT INTO leads
    (nome, telefone, email, indicador_id, administradora, valor, status)
    VALUES (?, ?, ?, ?, ?, ?, 'EM_ATENDIMENTO')
    `,
    [
      nome,
      telefone,
      email || "",
      req.session.usuario.id,
      administradora,
      valor,
    ],
    function (err) {
      if (err) return res.status(500).json({ erro: "Erro ao salvar lead" });

      db.run(
        `INSERT INTO historico (lead_id, status) VALUES (?, ?)`,
        [this.lastID, "EM_ATENDIMENTO"]
      );

      console.log("📩 NOVA PRÉ-ADESÃO:", nome, telefone);

      res.json({ sucesso: true });
    }
  );
});

/* =========================
   DASHBOARD
========================= */
app.get("/api/leads", auth, (req, res) => {
  db.all(
    `SELECT * FROM leads WHERE indicador_id=?`,
    [req.session.usuario.id],
    (err, rows) => res.json(rows || [])
  );
});

/* =========================
   SERVIDOR
========================= */
app.listen(PORT, () => {
  console.log("INDICONS rodando na porta " + PORT);
});
