/***************************************************
 * INDICONS — SERVER.JS (VERSÃO ESTÁVEL)
 * Corrigido para:
 * - Site estático (/public)
 * - Cadastro e login funcionando
 * - Sessão persistente no Render
 ***************************************************/

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const session = require("express-session");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   MIDDLEWARES
========================= */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* 👉 SERVIR ARQUIVOS ESTÁTICOS */
app.use(express.static("public"));

/* 👉 SESSÃO (Render compatível) */
app.use(
  session({
    secret: "indicons_secret_2025",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // OBRIGATÓRIO no Render
      httpOnly: true,
    },
  })
);

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
      tipo TEXT DEFAULT 'indicador',
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
      status TEXT DEFAULT 'PRE-ADESAO',
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

/* =========================
   AUTH
========================= */
function auth(req, res, next) {
  if (!req.session.usuario) {
    return res.redirect("/login.html");
  }
  next();
}

/* =========================
   CADASTRO
========================= */
app.post("/cadastro", async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.send("Dados incompletos");
  }

  const hash = await bcrypt.hash(senha, 10);

  db.run(
    `INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)`,
    [nome, email, hash],
    function (err) {
      if (err) {
        return res.send("E-mail já cadastrado");
      }
      res.redirect("/login.html");
    }
  );
});

/* =========================
   LOGIN
========================= */
app.post("/login", (req, res) => {
  const { email, senha } = req.body;

  db.get(
    `SELECT * FROM usuarios WHERE email = ?`,
    [email],
    async (err, usuario) => {
      if (!usuario) {
        return res.send("Usuário não encontrado");
      }

      const ok = await bcrypt.compare(senha, usuario.senha);
      if (!ok) {
        return res.send("Senha inválida");
      }

      req.session.usuario = {
        id: usuario.id,
        nome: usuario.nome,
        tipo: usuario.tipo,
      };

      res.redirect("/dashboard");
    }
  );
});

/* =========================
   DASHBOARD
========================= */
app.get("/dashboard", auth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

/* =========================
   API LEADS (exemplo)
========================= */
app.get("/api/leads", auth, (req, res) => {
  db.all(
    `SELECT * FROM leads WHERE indicador_id = ?`,
    [req.session.usuario.id],
    (err, rows) => {
      res.json(rows || []);
    }
  );
});

/* =========================
   LOGOUT
========================= */
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login.html");
  });
});

/* =========================
   START
========================= */
app.listen(PORT, () => {
  console.log("INDICONS rodando na porta " + PORT);
});
