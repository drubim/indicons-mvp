/***************************************************
 * INDICONS — SERVER.JS (OPÇÃO A)
 * MVP funcional com segurança, LGPD e comissões
 ***************************************************/

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const session = require("express-session");

const app = express();
const PORT = 3000;

/* =========================
   MIDDLEWARES
========================= */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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
      parceiro TEXT,
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
      VALUES (?, ?, ?, ?, ?)
    `, [
      leadId,
      parc.p,
      parc.perc * 100,
      valor * parc.perc,
      "PREVISTA"
    ]);
  });
}

/* =========================
   HOME
========================= */
app.get("/", (req, res) => {
  res.send(`
  <div style="font-family:Arial; padding:40px; max-width:900px; margin:auto;">
    <h1>Transforme sua rede de contatos em renda recorrente</h1>
    <p>Você indica. Um parceiro especializado faz todo o atendimento e fecha a venda.</p>
    <h3>Comissão de até 1,5%</h3>
    <p>Cadastro gratuito • Sem meta mínima • Painel profissional</p>
    <a href="/cadastro">Começar como Indicador</a>
  </div>
  `);
});

/* =========================
   CADASTRO INDICADOR
========================= */
app.get("/cadastro", (req, res) => {
  res.send(`
  <div style="max-width:500px;margin:auto;">
    <h2>Cadastro de Indicador</h2>
    <form method="POST">
      <input name="nome" placeholder="Nome" required><br><br>
      <input name="email" placeholder="Email" required><br><br>
      <input type="password" name="senha" placeholder="Senha" required><br><br>

      <label>
        <input type="checkbox" required>
        Aceito os Termos de Adesão e autorizo contato do INDICONS e administradoras parceiras.
      </label><br><br>

      <button>Criar conta</button>
    </form>
  </div>
  `);
});

app.post("/cadastro", async (req, res) => {
  const { nome, email, senha } = req.body;
  const hash = await bcrypt.hash(senha, 10);

  db.run(`
    INSERT INTO usuarios (nome, email, senha, tipo)
    VALUES (?, ?, ?, ?)
  `, [nome, email, hash, "indicador"], function () {

    db.run(`
      INSERT INTO consentimentos (usuario_id, tipo, ip)
      VALUES (?, ?, ?)
    `, [this.lastID, "INDICADOR", req.ip]);

    res.redirect("/login");
  });
});

/* =========================
   LOGIN
========================= */
app.get("/login", (req, res) => {
  res.send(`
  <div style="max-width:400px;margin:auto;">
    <h2>Login</h2>
    <form method="POST">
      <input name="email" placeholder="Email" required><br><br>
      <input type="password" name="senha" placeholder="Senha" required><br><br>
      <button>Entrar</button>
    </form>
  </div>
  `);
});

app.post("/login", (req, res) => {
  const { email, senha } = req.body;

  db.get(`
    SELECT * FROM usuarios WHERE email = ?
  `, [email], async (err, user) => {

    if (!user) return res.send("Usuário não encontrado");

    const ok = await bcrypt.compare(senha, user.senha);
    if (!ok) return res.send("Senha inválida");

    req.session.usuario = user;
    res.redirect("/indicador/dashboard");
  });
});

/* =========================
   PRÉ-ADESÃO CLIENTE
========================= */
app.get("/pre-adesao", (req, res) => {
  res.send(`
  <div style="max-width:500px;margin:auto;">
    <h2>Pré-Adesão</h2>
    <form method="POST">
      <input name="nome" placeholder="Nome" required><br><br>
      <input name="telefone" placeholder="Telefone" required><br><br>
      <input name="email" placeholder="Email" required><br><br>
      <input name="administradora" placeholder="Administradora" required><br><br>
      <input name="valor" placeholder="Valor do contrato" required><br><br>

      <label>
        <input type="checkbox" required>
        Autorizo contato do INDICONS e da administradora parceira.
      </label><br><br>

      <button>Enviar</button>
    </form>
  </div>
  `);
});

app.post("/pre-adesao", (req, res) => {
  const u = req.session.usuario;
  if (!u) return res.redirect("/login");

  const { nome, telefone, email, administradora, valor } = req.body;

  db.run(`
    INSERT INTO leads
    (nome, telefone, email, indicador_id, administradora, valor, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [nome, telefone, email, u.id, administradora, valor, "PRE_ADESAO"],
  function () {

    registrarHistorico(this.lastID, "PRE_ADESAO");

    db.run(`
      INSERT INTO consentimentos (usuario_id, tipo, ip)
      VALUES (?, ?, ?)
    `, [u.id, "CLIENTE", req.ip]);

    res.redirect("/indicador/dashboard");
  });
});

/* =========================
   DASHBOARD INDICADOR
========================= */
app.get("/indicador/dashboard", auth, (req, res) => {
  db.all(`
    SELECT * FROM leads WHERE indicador_id = ?
  `, [req.session.usuario.id], (err, leads) => {

    let html = `<h2>Meus Leads</h2><a href="/pre-adesao">Nova Pré-Adesão</a><hr>`;

    leads.forEach(l => {
      html += `
        <div>
          <strong>${l.nome}</strong><br>
          Status: ${l.status}<br>
          Valor: R$ ${l.valor}<br>
          <a href="/lead/${l.id}">Detalhes</a>
        </div><hr>
      `;
    });

    res.send(html);
  });
});

/* =========================
   DETALHE DO LEAD
========================= */
app.get("/lead/:id", auth, (req, res) => {
  const id = req.params.id;

  db.get(`SELECT * FROM leads WHERE id = ?`, [id], (e, lead) => {
    db.all(`SELECT * FROM historico WHERE lead_id = ?`, [id], (h, hist) => {
      db.all(`SELECT * FROM comissoes WHERE lead_id = ?`, [id], (c, com) => {

        let html = `<h2>${lead.nome}</h2>`;
        html += `<h3>Linha do Tempo</h3><ul>`;
        hist.forEach(i => html += `<li>${i.data} - ${i.status}</li>`);
        html += `</ul><h3>Comissões</h3><ul>`;
        com.forEach(p => {
          html += `<li>Parcela ${p.parcela}: ${p.percentual}% - R$ ${p.valor} (${p.status})</li>`;
        });
        html += `</ul>`;

        res.send(html);
      });
    });
  });
});

/* =========================
   SERVIDOR
========================= */
app.listen(PORT, () => {
  console.log("INDICONS rodando em http://localhost:" + PORT);
});
