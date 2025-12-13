/***************************************************
 * INDICONS — SERVER.JS
 * Versão visual + comparativa (inspirada Turn2c)
 * MVP profissional, transparente e didático
 ***************************************************/

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   CONFIGURAÇÕES
========================= */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));  // Para servir arquivos estáticos da pasta public
app.use(session({
  secret: "indicons_secret_2025",
  resave: false,
  saveUninitialized: false
}));

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
  db.run(`INSERT INTO historico (lead_id, status) VALUES (?, ?)`, [leadId, status]);
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
   ESTILO BASE
========================= */
function layout(titulo, conteudo) {
  return `
  <html>
  <head>
    <title>${titulo}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" type="text/css" href="/style.css">  <!-- Link para o style.css -->
  </head>
  <body>
    <header>
      <h1>INDICONS</h1>
    </header>
    <main>
      ${conteudo}
    </main>
    <footer>
      Plataforma de indicação de consórcios • Termos e condições aplicáveis
    </footer>
  </body>
  </html>
  `;
}

/* =========================
   HOME
========================= */
app.get("/", (req, res) => {
  res.send(layout("INDICONS", `
    <div class="card">
      <h2>Transforme sua rede de contatos em renda recorrente</h2>
      <p>Você apenas indica. Um parceiro especializado faz todo o atendimento e fecha a venda.</p>
      <h3>Comissão de até 1,5%</h3>
      <p>Valores pagos em até 6 parcelas, conforme regras contratuais.</p>
      <a class="btn" href="/cadastro">Começar como Indicador</a>
    </div>

    <div class="card">
      <h3>Como funciona</h3>
      <div class="timeline">
        <div class="step ok">1. Você indica</div>
        <div class="step ok">2. Parceiro atende</div>
        <div class="step ok">3. Administradora aprova</div>
        <div class="step ok">4. Comissão registrada</div>
        <div class="step ok">5. Pagamento em parcelas</div>
      </div>
    </div>
  `));
});

/* =========================
   TABELA COMPARATIVA
========================= */
app.get("/comparativo", auth, (req, res) => {
  res.send(layout("Comparativo", `
    <div class="card">
      <h2>Administradoras parceiras</h2>
      <p>Informações referenciais. Condições podem variar conforme campanha.</p>

      <table>
        <thead>
          <tr>
            <th>Administradora</th>
            <th>Comissão máxima</th>
            <th>Forma de pagamento</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Embracon</td><td>Até 1,5%</td><td>6 parcelas</td></tr>
          <tr><td>Ademicon</td><td>Até 1,5%</td><td>6 parcelas</td></tr>
          <tr><td>Porto</td><td>Até 1,5%</td><td>6 parcelas</td></tr>
          <tr><td>Outras</td><td>Variável</td><td>Conforme contrato</td></tr>
        </tbody>
      </table>
    </div>
  `));
});

/* =========================
   CADASTRO / LOGIN
========================= */
app.get("/cadastro", (req, res) => {
  res.send(layout("Cadastro", `
    <div class="card">
      <h2>Cadastro de Indicador</h2>
      <form method="POST">
        <input name="nome" placeholder="Nome" required><br><br>
        <input name="email" placeholder="Email" required><br><br>
        <input type="password" name="senha" placeholder="Senha" required><br><br>
        <label>
          <input type="checkbox" required>
          Li e aceito os termos e autorizo contato do INDICONS e administradoras.
        </label><br><br>
        <button class="btn">Criar conta</button>
      </form>
    </div>
  `));
});

app.post("/cadastro", async (req, res) => {
  const hash = await bcrypt.hash(req.body.senha, 10);
  db.run(`
    INSERT INTO usuarios (nome,email,senha,tipo)
    VALUES (?,?,?,'indicador')
  `, [req.body.nome, req.body.email, hash], function () {
    db.run(`INSERT INTO consentimentos (usuario_id,tipo,ip) VALUES (?,?,?)`,
      [this.lastID, "INDICADOR", req.ip]);
    res.redirect("/login");
  });
});

app.get("/login", (req, res) => {
  res.send(layout("Login", `
    <div class="card">
      <h2>Login</h2>
      <form method="POST">
        <input name="email" placeholder="Email" required><br><br>
        <input type="password" name="senha" placeholder="Senha" required><br><br>
        <button class="btn">Entrar</button>
      </form>
    </div>
  `));
});

app.post("/login", (req, res) => {
  db.get(`SELECT * FROM usuarios WHERE email=?`, [req.body.email], async (e,u)=>{
    if(!u) return res.send("Usuário não encontrado");
    if(!(await bcrypt.compare(req.body.senha,u.senha))) return res.send("Senha inválida");
    req.session.usuario = u;
    res.redirect("/dashboard");
  });
});

/* =========================
   DASHBOARD
========================= */
app.get("/dashboard", auth, (req, res) => {
  db.all(`SELECT * FROM leads WHERE indicador_id=?`, [req.session.usuario.id], (e,leads)=>{
    let html = `
      <div class="card">
        <h2>Painel do Indicador</h2>
        <a class="btn sec" href="/comparativo">Ver comissões por administradora</a>
      </div>
    `;
    leads.forEach(l=>{
      html+=`
        <div class="card">
          <strong>${l.nome}</strong><br>
          Administradora: ${l.administradora}<br>
          Valor: R$ ${l.valor}<br>
          Status: ${l.status}
        </div>
      `;
    });
    res.send(layout("Dashboard",html));
  });
});

/* =========================
   SERVIDOR
========================= */
app.listen(PORT, () => {
  console.log("INDICONS rodando na porta " + PORT);
});
