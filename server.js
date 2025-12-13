/***************************************************
 * INDICONS — SERVER.JS
 * Versão visual + comparativa (inspirada Turn2c)
 * MVP profissional, transparente e didático
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

/* =========================
   ARQUIVOS ESTÁTICOS (PUBLIC)
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
    CREATE TABLE IF NOT EXISTS historico (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER,
      status TEXT,
      data DATETIME DEFAULT CURRENT_TIMESTAMP
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

function registrarHistorico(leadId, status) {
  db.run(
    `INSERT INTO historico (lead_id, status) VALUES (?, ?)`,
    [leadId, status]
  );
}

function gerarParcelas(leadId, valor) {
  const parcelas = [
    { p: 1, perc: 0.005 },
    { p: 2, perc: 0.002 },
    { p: 3, perc: 0.002 },
    { p: 4, perc: 0.002 },
    { p: 5, perc: 0.002 },
    { p: 6, perc: 0.002 },
  ];

  parcelas.forEach(parc => {
    db.run(`
      INSERT INTO comissoes (lead_id, parcela, percentual, valor, status)
      VALUES (?, ?, ?, ?, 'PREVISTA')
    `, [leadId, parc.p, parc.perc * 100, valor * parc.perc]);
  });
}

/* =========================
   LAYOUT BASE (HTML)
========================= */
function layout(titulo, conteudo) {
  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8">
    <title>${titulo}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="/style.css">
  </head>
  <body>
    <header class="header">
      <h1>INDICONS</h1>
    </header>

    <main class="container">
      ${conteudo}
    </main>

    <footer class="footer">
      Plataforma de indicação de consórcios • Termos e condições aplicáveis
    </footer>

    <script src="/app.js"></script>
  </body>
  </html>
  `;
}

/* =========================
   HOME
========================= */
app.get("/", (req, res) => {
  res.send(layout("INDICONS", `
    <section class="card">
      <h2>Transforme sua rede de contatos em renda recorrente</h2>
      <p>Você apenas indica. Um parceiro especializado faz todo o atendimento e fecha a venda.</p>
      <h3>Comissão de até 1,5%</h3>
      <p>Pagamentos realizados em até 6 parcelas conforme regras contratuais.</p>
      <a class="btn" href="/cadastro">Começar como Indicador</a>
    </section>

    <section class="card">
      <h3>Como funciona</h3>
      <div class="timeline">
        <div class="step ok">1. Você indica</div>
        <div class="step ok">2. Parceiro atende</div>
        <div class="step ok">3. Administradora aprova</div>
        <div class="step ok">4. Comissão registrada</div>
        <div class="step ok">5. Pagamento parcelado</div>
      </div>
    </section>
  `));
});

/* =========================
   COMPARATIVO
========================= */
app.get("/comparativo", auth, (req, res) => {
  res.send(layout("Comparativo", `
    <section class="card">
      <h2>Administradoras parceiras</h2>
      <table>
        <thead>
          <tr>
            <th>Administradora</th>
            <th>Comissão máxima</th>
            <th>Pagamento</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Embracon</td><td>Até 1,5%</td><td>6 parcelas</td></tr>
          <tr><td>Ademicon</td><td>Até 1,5%</td><td>6 parcelas</td></tr>
          <tr><td>Porto</td><td>Até 1,5%</td><td>6 parcelas</td></tr>
          <tr><td>Outras</td><td>Variável</td><td>Contrato</td></tr>
        </tbody>
      </table>
    </section>
  `));
});

/* =========================
   CADASTRO
========================= */
app.get("/cadastro", (req, res) => {
  res.send(layout("Cadastro", `
    <section class="card">
      <h2>Cadastro de Indicador</h2>
      <form method="POST">
        <input name="nome" placeholder="Nome completo" required>
        <input name="email" placeholder="Email" required>
        <input type="password" name="senha" placeholder="Senha" required>

        <label class="checkbox">
          <input type="checkbox" required>
          Li e aceito os termos e autorizo contato do INDICONS e das administradoras.
        </label>

        <button class="btn">Criar conta</button>
      </form>
    </section>
  `));
});

app.post("/cadastro", async (req, res) => {
  const hash = await bcrypt.hash(req.body.senha, 10);

  db.run(`
    INSERT INTO usuarios (nome,email,senha,tipo)
    VALUES (?,?,?,'indicador')
  `, [req.body.nome, req.body.email, hash], function () {

    db.run(`
      INSERT INTO consentimentos (usuario_id,tipo,ip)
      VALUES (?,?,?)
    `, [this.lastID, "INDICADOR", req.ip]);

    res.redirect("/login");
  });
});

/* =========================
   LOGIN
========================= */
app.get("/login", (req, res) => {
  res.send(layout("Login", `
    <section class="card">
      <h2>Login</h2>
      <form method="POST">
        <input name="email" placeholder="Email" required>
        <input type="password" name="senha" placeholder="Senha" required>
        <button class="btn">Entrar</button>
      </form>
    </section>
  `));
});

app.post("/login", (req, res) => {
  db.get(`SELECT * FROM usuarios WHERE email=?`, [req.body.email], async (e, u) => {
    if (!u) return res.send("Usuário não encontrado");
    if (!(await bcrypt.compare(req.body.senha, u.senha))) return res.send("Senha inválida");

    req.session.usuario = u;
    res.redirect("/dashboard");
  });
});

/* =========================
   DASHBOARD
========================= */
app.get("/dashboard", auth, (req, res) => {
  db.all(
    `SELECT * FROM leads WHERE indicador_id=?`,
    [req.session.usuario.id],
    (e, leads) => {

      let html = `
        <section class="card">
          <h2>Painel do Indicador</h2>
          <a class="btn sec" href="/comparativo">Ver comissões por administradora</a>
        </section>
      `;

      leads.forEach(l => {
        html += `
          <section class="card">
            <strong>${l.nome}</strong><br>
            Administradora: ${l.administradora}<br>
            Valor: R$ ${l.valor || "-"}<br>
            Status: ${l.status || "Em análise"}
          </section>
        `;
      });

      res.send(layout("Dashboard", html));
    }
  );
});

/* =========================
   SERVIDOR
========================= */
app.listen(PORT, () => {
  console.log("INDICONS rodando na porta " + PORT);
});
