/***************************************************
 * INDICONS — SERVER.JS
 * Backend funcional + Indicador + Parceiro
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

app.use(
  session({
    secret: "indicons_secret_2025",
    resave: false,
    saveUninitialized: false,
  })
);

/* =========================
   ARQUIVOS ESTÁTICOS
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
   AUTH
========================= */
function auth(req, res, next) {
  if (!req.session.usuario) {
    return res.redirect("/login.html");
  }
  next();
}

/* =========================
   LOGIN
========================= */
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

/* =========================
   LOGOUT
========================= */
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login.html");
  });
});

/* =========================
   DASHBOARD INDICADOR
========================= */
app.get("/dashboard", auth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

/* =========================
   DASHBOARD PARCEIRO
========================= */
app.get("/parceiro", auth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "parceiro.html"));
});

/* =========================
   API — INDICADOR
========================= */
app.get("/api/dashboard", auth, (req, res) => {
  const indicadorId = req.session.usuario.id;

  db.all(
    "SELECT * FROM leads WHERE indicador_id = ?",
    [indicadorId],
    (err, leads) => {
      if (err) return res.json([]);
      res.json(leads || []);
    }
  );
});

/* =========================
   API — PARCEIRO  ✅ (NOVO)
========================= */
app.get("/api/parceiro", auth, (req, res) => {
  db.all(
    "SELECT * FROM leads WHERE status != 'VENDIDO' OR status IS NULL",
    [],
    (err, leads) => {
      if (err) return res.json([]);
      res.json(leads || []);
    }
  );
});

/* =========================
   SERVIDOR
========================= */
app.listen(PORT, () => {
  console.log("✅ INDICONS rodando na porta " + PORT);
});
