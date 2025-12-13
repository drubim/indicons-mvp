/***************************************************
 * INDICONS — SERVER.JS
 * Backend funcional + login + dashboard conectado
 ***************************************************/

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const session = require("express-session");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   MIDDLEWARES BÁSICOS
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

/* =========================
   SERVIR ARQUIVOS ESTÁTICOS
   (HTML / CSS / JS)
========================= */
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
});

/* =========================
   FUNÇÃO DE AUTENTICAÇÃO
========================= */
function auth(req, res, next) {
  if (!req.session.usuario) {
    return res.redirect("/login.html");
  }
  next();
}

/* =========================
   ROTAS DE AUTENTICAÇÃO
========================= */

// LOGIN
app.post("/login", (req, res) => {
  const { email, senha } = req.body;

  db.get(
    "SELECT * FROM usuarios WHERE email = ?",
    [email],
    async (err, user) => {
      if (err || !user) {
        return res.send("Usuário não encontrado");
      }

      const ok = await bcrypt.compare(senha, user.senha);
      if (!ok) {
        return res.send("Senha inválida");
      }

      req.session.usuario = {
        id: user.id,
        nome: user.nome,
        tipo: user.tipo,
      };

      res.redirect("/dashboard");
    }
  );
});

// LOGOUT
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login.html");
  });
});

/* =========================
   DASHBOARD (PROTEGIDO)
========================= */
app.get("/dashboard", auth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

/* =========================
   API — PASSO 6
   DADOS REAIS DO DASHBOARD
========================= */
app.get("/api/dashboard", auth, (req, res) => {
  const indicadorId = req.session.usuario.id;

  db.all(
    "SELECT * FROM leads WHERE indicador_id = ?",
    [indicadorId],
    (err, leads) => {
      if (err) {
        return res.json([]);
      }
      res.json(leads);
    }
  );
});

/* =========================
   SERVIDOR
========================= */
app.listen(PORT, () => {
  console.log("✅ INDICONS rodando na porta " + PORT);
});
