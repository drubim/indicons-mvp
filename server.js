/***************************************************
 * INDICONS — SERVER.JS (MVP COMPLETO)
 * - Cadastro com LGPD
 * - Pré-adesão real (leads)
 * - Dashboard com dados reais
 * - Timeline visual por lead
 ***************************************************/
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const session = require("express-session");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   CONFIGURAÇÕES GERAIS
========================= */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: "indicons_secret_2025",
  resave: false,
  saveUninitialized: false
}));

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
   FUNÇÕES AUXILIARES
========================= */
function auth(req, res, next) {
  if (!req.session.usuario) return res.redirect("/login");
  next();
}

function timeline(status) {
  const etapas = ["PRE_ADESAO", "EM_ATENDIMENTO", "APROVADA"];
  let html = `<div class="timeline">`;

  etapas.forEach(e => {
    const ok = etapas.indexOf(e) <= etapas.indexOf(status);
    html += `<div class="step ${ok ? "ok" : ""}">${e.replace("_", " ")}</div>`;
  });

  html += `</div>`;
  return html;
}

/* =========================
   HOME
========================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* =========================
   CADASTRO INDICADOR
========================= */
app.get("/cadastro", (req, res) => {
  res.send(`
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Cadastro — INDICONS</title>
      <link rel="stylesheet" href="/style.css">
    </head>
    <body>
      <section class="hero">
        <div class="container">
          <div class="card">
            <h2>Cadastro de Indicador</h2>
            <form method="POST">
              <input name="nome" placeholder="Nome completo" required><br><br>
              <input name="email" type="email" placeholder="E-mail" required><br><br>
              <input name="senha" type="password" placeholder="Senha" required><br><br>

              <label style="font-size:14px;">
                <input type="checkbox" name="aceite" required>
                Li e aceito o
                <a href="/termo-indicador.html" target="_blank">
                  Termo de Adesão do Indicador
                </a>
                e autorizo contato do INDICONS e administradoras.
              </label><br><br>

              <button class="btn-primary">Criar conta</button>
            </form>
          </div>
        </div>
      </section>
    </body>
    </html>
  `);
});

app.post("/cadastro", async (req, res) => {
  if (!req.body.aceite) return res.send("Aceite obrigatório.");

  const hash = await bcrypt.hash(req.body.senha, 10);

  db.run(
    `INSERT INTO usuarios (nome,email,senha,tipo)
     VALUES (?,?,?,'indicador')`,
    [req.body.nome, req.body.email, hash],
    function (err) {
      if (err) return res.send("Erro ao cadastrar.");

      db.run(
        `INSERT INTO consentimentos (usuario_id,tipo,ip)
         VALUES (?,?,?)`,
        [this.lastID, "INDICADOR", req.ip]
      );

      res.redirect("/login");
    }
  );
});

/* =========================
   LOGIN
========================= */
app.get("/login", (req, res) => {
  res.send(`
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Login — INDICONS</title>
      <link rel="stylesheet" href="/style.css">
    </head>
    <body>
      <section class="hero">
        <div class="container">
          <div class="card">
            <h2>Login</h2>
            <form method="POST">
              <input name="email" placeholder="Email" required><br><br>
              <input type="password" name="senha" placeholder="Senha" required><br><br>
              <button class="btn-primary">Entrar</button>
            </form>
          </div>
        </div>
      </section>
    </body>
    </html>
  `);
});

app.post("/login", (req, res) => {
  db.get(`SELECT * FROM usuarios WHERE email=?`, [req.body.email], async (err, u) => {
    if (!u) return res.send("Usuário não encontrado");
    if (!(await bcrypt.compare(req.body.senha, u.senha))) return res.send("Senha inválida");

    req.session.usuario = u;
    res.redirect("/dashboard");
  });
});

/* =========================
   DASHBOARD REAL
========================= */
app.get("/dashboard", auth, (req, res) => {
  const indicadorId = req.session.usuario.id;

  db.all(
    `SELECT * FROM leads WHERE indicador_id=?`,
    [indicadorId],
    (err, leads) => {

      const totalIndicacoes = leads.length;
      const aprovadas = leads.filter(l => l.status === "APROVADA");
      const totalAprovadas = aprovadas.length;
      const totalVendido = aprovadas.reduce((s, l) => s + (l.valor || 0), 0);

      res.send(`
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Painel — INDICONS</title>
          <link rel="stylesheet" href="/style.css">
        </head>
        <body>
          <section class="hero">
            <div class="container">

              <div class="dashboard-cards">
                <div class="metric"><h4>Indicações</h4><strong>${totalIndicacoes}</strong></div>
                <div class="metric"><h4>Aprovadas</h4><strong>${totalAprovadas}</strong></div>
                <div class="metric"><h4>Valor vendido</h4><strong>R$ ${totalVendido.toFixed(2)}</strong></div>
              </div>

              ${leads.map(l => `
                <div class="card">
                  <strong>${l.nome}</strong><br>
                  ${l.administradora} • R$ ${l.valor}<br>
                  ${timeline(l.status)}
                </div>
              `).join("")}

              <a href="/logout" class="btn-secondary">Sair</a>

            </div>
          </section>
        </body>
        </html>
      `);
    }
  );
});

/* =========================
   PRÉ-ADESÃO DO CLIENTE
========================= */
app.get("/indicar", (req, res) => {
  res.send(`
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Pré-adesão — INDICONS</title>
      <link rel="stylesheet" href="/style.css">
    </head>
    <body>
      <section class="hero">
        <div class="container">
          <div class="card">
            <h2>Pré-adesão</h2>
            <form method="POST">
              <input name="nome" placeholder="Nome" required><br><br>
              <input name="telefone" placeholder="Telefone" required><br><br>
              <input name="email" type="email" placeholder="E-mail" required><br><br>
              <select name="administradora" required>
                <option>Embracon</option>
                <option>Ademicon</option>
                <option>Porto</option>
              </select><br><br>
              <input name="valor" placeholder="Valor do crédito" required><br><br>

              <label>
                <input type="checkbox" name="aceite" required>
                Autorizo contato conforme
                <a href="/termo-cliente.html" target="_blank">Termo</a>
              </label><br><br>

              <button class="btn-primary">Enviar</button>
            </form>
          </div>
        </div>
      </section>
    </body>
    </html>
  `);
});

app.post("/indicar", (req, res) => {
  if (!req.body.aceite) return res.send("Aceite obrigatório.");

  db.run(
    `INSERT INTO leads (nome,telefone,email,administradora,valor,status)
     VALUES (?,?,?,?,?,'PRE_ADESAO')`,
    [req.body.nome, req.body.telefone, req.body.email, req.body.administradora, req.body.valor],
    () => res.send("Pré-adesão enviada com sucesso.")
  );
});

/* =========================
   LOGOUT
========================= */
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

/* =========================
   START
========================= */
app.listen(PORT, () => {
  console.log("INDICONS rodando na porta " + PORT);
});
