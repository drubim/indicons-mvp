/***************************************************
 * INDICONS — SERVER.JS (MVP CONSOLIDADO)
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
   MIDDLEWARE AUTH
========================= */
function auth(req, res, next) {
  if (!req.session.usuario) return res.redirect("/login");
  next();
}

/* =========================
   HOME (FRONTEND)
========================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* =========================
   CADASTRO INDICADOR
========================= */
app.get("/cadastro", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
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

            <form method="POST" action="/cadastro">
              <input name="nome" placeholder="Nome completo" required><br><br>
              <input type="email" name="email" placeholder="E-mail" required><br><br>
              <input type="password" name="senha" placeholder="Senha" required><br><br>

              <label style="font-size:14px;">
                <input type="checkbox" name="aceite" required>
                Li e aceito o
                <a href="/termo-indicador.html" target="_blank">
                  Termo de Adesão do Indicador
                </a>
                e autorizo o contato do INDICONS e administradoras parceiras.
              </label>

              <br><br>
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
  if (!req.body.aceite) {
    return res.send("É obrigatório aceitar o Termo de Adesão.");
  }

  const hash = await bcrypt.hash(req.body.senha, 10);

  db.run(
    `INSERT INTO usuarios (nome,email,senha,tipo)
     VALUES (?,?,?,'indicador')`,
    [req.body.nome, req.body.email, hash],
    function (err) {
      if (err) return res.send("Erro ao cadastrar (email já existe).");

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
    <!DOCTYPE html>
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
    if (!(await bcrypt.compare(req.body.senha, u.senha))) {
      return res.send("Senha inválida");
    }
    req.session.usuario = u;
    res.redirect("/dashboard");
  });
});

/* =========================
   DASHBOARD
========================= */
app.get("/dashboard", auth, (req, res) => {
  const indicadorId = req.session.usuario.id;

  db.all(
    `SELECT * FROM leads WHERE indicador_id = ?`,
    [indicadorId],
    (err, leads) => {

      if (err) return res.send("Erro ao carregar dados");

      const totalIndicacoes = leads.length;

      const aprovadas = leads.filter(l => l.status === "APROVADA");
      const totalAprovadas = aprovadas.length;

      const totalVendido = aprovadas.reduce(
        (s, l) => s + (l.valor || 0), 0
      );

      db.all(
        `SELECT * FROM comissoes WHERE lead_id IN
         (SELECT id FROM leads WHERE indicador_id = ?)`,
        [indicadorId],
        (err2, coms) => {

          const totalComissao = coms.reduce(
            (s, c) => s + (c.valor || 0), 0
          );

          res.send(`
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
              <meta charset="UTF-8">
              <title>Painel do Indicador — INDICONS</title>
              <link rel="stylesheet" href="/style.css">
            </head>
            <body>

            <section class="hero">
              <div class="container">

                <div class="card">
                  <h1>Painel do Indicador</h1>
                  <p>Acompanhe suas indicações e comissões reais</p>
                </div>

                <div class="dashboard-cards">
                  <div class="metric">
                    <h4>Indicações realizadas</h4>
                    <strong>${totalIndicacoes}</strong>
                  </div>

                  <div class="metric">
                    <h4>Vendas aprovadas</h4>
                    <strong>${totalAprovadas}</strong>
                  </div>

                  <div class="metric">
                    <h4>Valor vendido</h4>
                    <strong>R$ ${totalVendido.toFixed(2)}</strong>
                  </div>

                  <div class="metric">
                    <h4>Comissão prevista</h4>
                    <strong>R$ ${totalComissao.toFixed(2)}</strong>
                  </div>
                </div>

                <div class="card" style="margin-top:30px;">
                  <a href="/comparativo" class="btn-secondary">
                    Ver tabela de comissões por administradora
                  </a>
                  <a href="/logout" class="btn-secondary" style="margin-left:10px;">
                    Sair
                  </a>
                </div>

              </div>
            </section>

            </body>
            </html>
          `);
        }
      );
    }
  );
});

/* =========================
   COMPARATIVO
========================= */
app.get("/comparativo", auth, (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Comparativo — INDICONS</title>
      <link rel="stylesheet" href="/style.css">
    </head>
    <body>
      <section class="hero">
        <div class="container">
          <div class="card">
            <h2>Administradoras Parceiras</h2>
            <table>
              <tr><th>Administradora</th><th>Comissão Máxima</th><th>Pagamento</th></tr>
              <tr><td>Embracon</td><td>Até 1,5%</td><td>6 parcelas</td></tr>
              <tr><td>Ademicon</td><td>Até 1,5%</td><td>6 parcelas</td></tr>
              <tr><td>Porto</td><td>Até 1,5%</td><td>6 parcelas</td></tr>
            </table>
          </div>
        </div>
      </section>
    </body>
    </html>
  `);
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
