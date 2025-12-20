/***************************************************
 * INDICONS — SERVER.JS
 * Render FREE • Admin/Parceiro garantidos
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

// arquivos estáticos
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
      status TEXT DEFAULT 'PRE_ADESAO',
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

/* =========================
   GARANTIR USUÁRIOS PADRÃO
   (FUNCIONA NO RENDER FREE)
========================= */
async function garantirUsuario(nome, email, senha, tipo) {
  db.get("SELECT * FROM usuarios WHERE email = ?", [email], async (err, row) => {
    const hash = await bcrypt.hash(senha, 10);

    if (!row) {
      db.run(
        "INSERT INTO usuarios (nome,email,senha,tipo) VALUES (?,?,?,?)",
        [nome, email, hash, tipo]
      );
      console.log(`✔ ${tipo.toUpperCase()} criado: ${email}`);
    } else if (row.tipo !== tipo) {
      db.run(
        "UPDATE usuarios SET senha=?, tipo=? WHERE email=?",
        [hash, tipo, email]
      );
      console.log(`✔ ${email} atualizado para ${tipo}`);
    }
  });
}

// chama sempre ao subir
garantirUsuario(
  "Administrador",
  "admin@indicons.com.br",
  "admin123",
  "admin"
);

garantirUsuario(
  "Parceiro Padrão",
  "parceiro@indicons.com.br",
  "parceiro123",
  "parceiro"
);

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
   LOGIN / LOGOUT
========================= */
app.post("/login", (req, res) => {
  const { email, senha } = req.body;

  db.get(
    "SELECT * FROM usuarios WHERE email = ?",
    [email],
    async (err, usuario) => {
      if (!usuario) return res.send("Usuário não encontrado");

      const ok = await bcrypt.compare(senha, usuario.senha);
      if (!ok) return res.send("Senha incorreta");

      req.session.usuario = usuario;

      if (usuario.tipo === "admin") return res.redirect("/admin");
      if (usuario.tipo === "parceiro") return res.redirect("/parceiro");
      return res.redirect("/dashboard");
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
    (err) => {
      if (err) return res.send("Erro ao cadastrar");
      res.redirect("/login.html");
    }
  );
});

/* =========================
   ÁREAS PROTEGIDAS
========================= */

// INDICADOR
app.get("/dashboard", auth, (req, res) => {
  if (req.session.usuario.tipo !== "indicador") {
    return res.send("Acesso negado");
  }
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// PARCEIRO
app.get("/parceiro", auth, (req, res) => {
  if (req.session.usuario.tipo !== "parceiro") {
    return res.send("Acesso negado");
  }
  res.sendFile(path.join(__dirname, "public", "parceiro.html"));
});

// ADMIN
app.get("/admin", auth, (req, res) => {
  if (req.session.usuario.tipo !== "admin") {
    return res.send("Acesso negado");
  }
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

/* =========================
   API PARCEIRO (LEADS)
========================= */
app.get("/api/parceiro/leads", auth, (req, res) => {
  if (req.session.usuario.tipo !== "parceiro") {
    return res.status(403).json([]);
  }

  db.all(
    "SELECT * FROM leads WHERE status != 'VENDIDO'",
    [],
    (err, rows) => res.json(rows || [])
  );
});

/* =========================
   SERVIDOR
========================= */
app.listen(PORT, () => {
  console.log("🚀 INDICONS rodando na porta " + PORT);
});
