/***************************************************
 * INDICONS — SERVER.JS (VERSÃO COMPLETA FINAL)
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

/* arquivos estáticos */
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
   CONTAS PADRÃO (ADMIN)
========================= */
db.get(
  "SELECT * FROM usuarios WHERE email = ?",
  ["admin@indicons.com.br"],
  async (err, row) => {
    if (!row) {
      const hash = await bcrypt.hash("admin123", 10);
      db.run(
        "INSERT INTO usuarios (nome,email,senha,tipo) VALUES (?,?,?,?)",
        ["Administrador", "admin@indicons.com.br", hash, "admin"]
      );
      console.log("✔ Admin padrão criado: admin@indicons.com.br / admin123");
    }
  }
);

/* =========================
   AUTENTICAÇÃO
========================= */
function auth(req, res, next) {
  if (!req.session.usuario) return res.redirect("/login.html");
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.usuario || req.session.usuario.tipo !== "admin")
    return res.status(403).send("Acesso negado");
  next();
}

/* =========================
   ROTAS BÁSICAS
========================= */
app.post("/login", (req, res) => {
  const { email, senha } = req.body;

  db.get(
    "SELECT * FROM usuarios WHERE email = ?",
    [email],
    async (err, user) => {
      if (!user) return res.redirect("/login.html?erro=1");

      const ok = await bcrypt.compare(senha, user.senha);
      if (!ok) return res.redirect("/login.html?erro=1");

      req.session.usuario = user;

      if (user.tipo === "admin") return res.redirect("/admin.html");
      return res.redirect("/dashboard.html");
    }
  );
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login.html"));
});

/* =========================
   CADASTRO INDICADOR
========================= */
app.post("/cadastro", async (req, res) => {
  const { nome, email, senha } = req.body;
  const hash = await bcrypt.hash(senha, 10);

  db.run(
    "INSERT INTO usuarios (nome,email,senha,tipo) VALUES (?,?,?,?)",
    [nome, email, hash, "indicador"],
    () => res.redirect("/login.html")
  );
});

/* =========================
   DASHBOARD INDICADOR (API)
========================= */
app.get("/api/dashboard", auth, (req, res) => {
  db.all(
    "SELECT * FROM leads WHERE indicador_id = ?",
    [req.session.usuario.id],
    (err, leads) => res.json(leads || [])
  );
});

/* =========================
   ADMIN — MÉTRICAS
========================= */
app.get("/api/admin/dashboard", requireAdmin, (req, res) => {
  db.serialize(() => {
    db.get("SELECT COUNT(*) as total FROM usuarios", [], (e, u) => {
      db.get("SELECT COUNT(*) as total FROM leads", [], (e, l) => {
        db.get(
          "SELECT SUM(valor) as total FROM comissoes",
          [],
          (e, c) => {
            res.json({
              usuarios: u.total || 0,
              leads: l.total || 0,
              comissao: c.total || 0,
            });
          }
        );
      });
    });
  });
});

/* =========================
   ADMIN — LISTAS (IMPORTANTE)
   👉 ROTAS PEDIDAS
========================= */
app.get("/api/admin/usuarios", requireAdmin, (req, res) => {
  db.all(
    "SELECT nome,email,tipo FROM usuarios",
    [],
    (err, rows) => res.json(rows || [])
  );
});

app.get("/api/admin/leads", requireAdmin, (req, res) => {
  db.all("SELECT * FROM leads", [], (err, rows) =>
    res.json(rows || [])
  );
});

/* =========================
   SERVIDOR
========================= */
app.listen(PORT, () => {
  console.log("🚀 INDICONS rodando na porta " + PORT);
});
