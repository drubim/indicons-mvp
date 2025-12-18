/***************************************************
 * INDICONS — SERVER.JS (COM CONTAS PADRÃO)
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
app.use(express.static("public"));

/* =========================
   BANCO DE DADOS
========================= */
const db = new sqlite3.Database("./indicons.db");

db.serialize(async () => {

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

  /* =========================
     CRIAR CONTAS PADRÃO
  ========================= */
  const adminHash = await bcrypt.hash("admin123", 10);
  const parceiroHash = await bcrypt.hash("parceiro123", 10);

  db.get(
    "SELECT id FROM usuarios WHERE tipo='admin'",
    [],
    (err, row) => {
      if (!row) {
        db.run(
          "INSERT INTO usuarios (nome,email,senha,tipo) VALUES (?,?,?,?)",
          ["Administrador", "admin@indicons.com", adminHash, "admin"]
        );
        console.log("✔ Admin padrão criado");
      }
    }
  );

  db.get(
    "SELECT id FROM usuarios WHERE tipo='parceiro'",
    [],
    (err, row) => {
      if (!row) {
        db.run(
          "INSERT INTO usuarios (nome,email,senha,tipo) VALUES (?,?,?,?)",
          ["Parceiro", "parceiro@indicons.com", parceiroHash, "parceiro"]
        );
        console.log("✔ Parceiro padrão criado");
      }
    }
  );

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
   ROTAS
========================= */
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "public/index.html"))
);

app.post("/cadastro", async (req, res) => {
  const hash = await bcrypt.hash(req.body.senha, 10);
  db.run(
    "INSERT INTO usuarios (nome,email,senha,tipo) VALUES (?,?,?,?)",
    [req.body.nome, req.body.email, hash, "indicador"],
    () => res.redirect("/login.html")
  );
});

app.post("/login", (req, res) => {
  db.get(
    "SELECT * FROM usuarios WHERE email=?",
    [req.body.email],
    async (err, u) => {
      if (!u) return res.send("Usuário não encontrado");
      if (!(await bcrypt.compare(req.body.senha, u.senha)))
        return res.send("Senha inválida");

      req.session.usuario = u;
      if (u.tipo === "admin") return res.redirect("/admin");
      if (u.tipo === "parceiro") return res.redirect("/parceiro");
      res.redirect("/dashboard");
    }
  );
});

app.get("/dashboard", auth, (req, res) =>
  res.sendFile(path.join(__dirname, "public/dashboard.html"))
);

app.get("/parceiro", requireParceiro, (req, res) =>
  res.sendFile(path.join(__dirname, "public/parceiro.html"))
);

app.get("/admin", requireAdmin, (req, res) =>
  res.sendFile(path.join(__dirname, "public/admin.html"))
);

app.get("/logout", (req, res) =>
  req.session.destroy(() => res.redirect("/"))
);

/* =========================
   SERVIDOR
========================= */
app.listen(PORT, () => {
  console.log("INDICONS rodando na porta " + PORT);
});
