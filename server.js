/***************************************************
 * INDICONS — SERVER.JS (VERSÃO FINAL)
 * Landing + Sistema + Dashboard + Financeiro
 ***************************************************/

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const session = require("express-session");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   CONFIGURAÇÕES BÁSICAS
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
    CREATE TABLE IF NOT EXISTS comissoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      indicador_id INTEGER,
      parcela INTEGER,
      percentual REAL,
      valor REAL,
      status TEXT
    )
  `);
});

/* =========================
   MIDDLEWARE LOGIN
========================= */
function requireLogin(req, res, next) {
  if (!req.session.usuario) {
    return res.redirect("/login.html");
  }
  next();
}

/* =========================
   ROTAS PÚBLICAS
========================= */

// Landing page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// Cadastro
app.post("/cadastro", async (req, res) => {
  const { nome, email, senha } = req.body;
  const hash = await bcrypt.hash(senha, 10);

  db.run(
    `INSERT INTO usuarios (nome, email, senha, tipo)
     VALUES (?, ?, ?, 'indicador')`,
    [nome, email, hash],
    function (err) {
      if (err) {
        return res.send("Erro ao cadastrar. Email já existe.");
      }
      res.redirect("/login.html");
    }
  );
});

// Login
app.post("/login", (req, res) => {
  const { email, senha } = req.body;

  db.get(
    "SELECT * FROM usuarios WHERE email = ?",
    [email],
    async (err, user) => {
      if (!user) return res.send("Usuário não encontrado");

      const ok = await bcrypt.compare(senha, user.senha);
      if (!ok) return res.send("Senha inválida");

      req.session.usuario = user;
      res.redirect("/dashboard");
    }
  );
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

/* =========================
   DASHBOARD PROTEGIDO
========================= */
app.get("/dashboard", requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "public/dashboard.html"));
});

/* =========================
   API — DASHBOARD (GRÁFICOS)
========================= */
app.get("/api/dashboard", requireLogin, (req, res) => {
  const indicadorId = req.session.usuario.id;

  db.all(
    "SELECT status, COUNT(*) as total FROM leads WHERE indicador_id = ? GROUP BY status",
    [indicadorId],
    (err, rows) => {
      let funil = [0, 0, 0, 0];
      rows.forEach((r) => {
        if (r.status === "PRE_ADESAO") funil[0] = r.total;
        if (r.status === "ATENDIMENTO") funil[1] = r.total;
        if (r.status === "VENDIDO") funil[2] = r.total;
        if (r.status === "PAGO") funil[3] = r.total;
      });

      db.get(
        "SELECT COUNT(*) as pre FROM leads WHERE indicador_id = ?",
        [indicadorId],
        (e, p) => {
          db.get(
            "SELECT COUNT(*) as v FROM leads WHERE indicador_id = ? AND status = 'VENDIDO'",
            [indicadorId],
            (e2, v) => {
              db.get(
                "SELECT SUM(valor) as total FROM comissoes WHERE indicador_id = ?",
                [indicadorId],
                (e3, c) => {
                  res.json({
                    pre: p.pre || 0,
                    vendas: v.v || 0,
                    comissao: c.total || 0,
                    funil,
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

/* =========================
   API — FINANCEIRO
========================= */
app.get("/api/financeiro", requireLogin, (req, res) => {
  const indicadorId = req.session.usuario.id;

  db.all(
    "SELECT * FROM comissoes WHERE indicador_id = ?",
    [indicadorId],
    (err, rows) => {
      const totalPrevisto = rows.reduce((s, r) => s + r.valor, 0);
      const totalPago = rows
        .filter((r) => r.status === "PAGA")
        .reduce((s, r) => s + r.valor, 0);

      res.json({
        totalPrevisto,
        totalPago,
        parcelas: rows,
      });
    }
  );
});

/* =========================
   API — WHATSAPP (SIMULAÇÃO)
========================= */
app.post("/api/whatsapp", requireLogin, (req, res) => {
  const { telefone, mensagem } = req.body;

  console.log("WHATSAPP AUTOMÁTICO");
  console.log("Telefone:", telefone);
  console.log("Mensagem:", mensagem);

  res.json({
    ok: true,
    status: "Mensagem enviada (simulação)",
  });
});

/* =========================
   SERVIDOR
========================= */
app.listen(PORT, () => {
  console.log("INDICONS rodando na porta " + PORT);
});
