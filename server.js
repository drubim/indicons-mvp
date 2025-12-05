// =============================================================
// INDICONS – Sistema completo + SQLite + LP Premium + Painel Comercial
// + Histórico de status + Layout profissional com tabelas
// =============================================================
const express = require("express");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();

const app = express();

// -----------------------------------------------
// CONFIGURAÇÕES BÁSICAS
// -----------------------------------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "indicons-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      // secure: true // habilitar quando estiver usando HTTPS
    },
  })
);

// -----------------------------------------------
// BANCO DE DADOS SQLite
// -----------------------------------------------
const db = new sqlite3.Database("./indicons.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS indicadores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      descricao TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS pre_vendas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      indicador_id INTEGER NOT NULL,
      produto_id INTEGER NOT NULL,
      nome_cliente TEXT NOT NULL,
      telefone_cliente TEXT NOT NULL,
      email_cliente TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PRE_ADESAO',
      valor_venda REAL,
      FOREIGN KEY(indicador_id) REFERENCES indicadores(id),
      FOREIGN KEY(produto_id) REFERENCES produtos(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS comissoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      indicador_id INTEGER NOT NULL,
      pre_venda_id INTEGER NOT NULL,
      valor_venda REAL NOT NULL,
      valor_comissao REAL NOT NULL,
      FOREIGN KEY(indicador_id) REFERENCES indicadores(id),
      FOREIGN KEY(pre_venda_id) REFERENCES pre_vendas(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS historico_pre_vendas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pre_venda_id INTEGER NOT NULL,
      usuario_tipo TEXT NOT NULL,
      usuario_nome TEXT,
      status_anterior TEXT,
      status_novo TEXT,
      observacao TEXT,
      criado_em DATETIME DEFAULT (datetime('now','localtime')),
      FOREIGN KEY(pre_venda_id) REFERENCES pre_vendas(id)
    )
  `);

  db.get("SELECT COUNT(*) AS c FROM produtos", (err, row) => {
    if (row && row.c === 0) {
      db.run(
        `INSERT INTO produtos (nome, descricao) VALUES (?, ?)`,
        [
          "Consórcio Imobiliário",
          "Crédito para imóveis residenciais e comerciais",
        ]
      );
      db.run(
        `INSERT INTO produtos (nome, descricao) VALUES (?, ?)`,
        ["Consórcio Automóvel", "Crédito para veículos leves e pesados"]
      );
    }
  });
});

// Helpers async
function dbAll(sql, params = []) {
  return new Promise((resolve, reject) =>
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)))
  );
}
function dbGet(sql, params = []) {
  return new Promise((resolve, reject) =>
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)))
  );
}
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) =>
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    })
  );
}

// -------------------------------------------------------------
// LAYOUT GLOBAL (tema claro, reaproveitado para tudo)
// -------------------------------------------------------------
function layout(title, content, userNav = "") {
  return `
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <style>
    body { background:#f1f5f9; margin:0; font-family: Arial, system-ui; color:#1e293b; }

    header {
      background:#ffffff;
      border-bottom:1px solid #cbd5e1;
      position:sticky; top:0;
      z-index:10;
    }

    .header-inner {
      max-width:1200px;
      margin:auto;
      padding:10px 18px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
    }

    .logo { display:flex; align-items:center; gap:10px; font-size:18px; font-weight:bold; }
    .logo-mark {
      width:34px; height:34px; border-radius:50%;
      background:linear-gradient(135deg,#0ea5e9,#0369a1);
      color:white; display:flex; align-items:center; justify-content:center;
      font-size:18px; font-weight:700;
    }

    nav a {
      margin-left: 12px;
      text-decoration:none;
      color:#475569;
      font-weight:500;
      font-size:14px;
    }
    nav a:hover { color:#0ea5e9; }

    main { max-width:1200px; margin:auto; padding:18px; }

    .card {
      background:#ffffff;
      border:1px solid #cbd5e1;
      border-radius:14px;
      padding:18px 18px 20px 18px;
      margin-bottom:18px;
      box-shadow:0 3px 10px rgba(15,23,42,0.06);
    }

    .btn {
      background:#0ea5e9; color:white;
      padding:9px 16px; border-radius:999px;
      border:none; cursor:pointer; font-weight:600; font-size:14px;
      text-decoration:none; display:inline-block;
    }
    .btn:hover { background:#0369a1; }

    .btn-secondary {
      background:#e2e8f0;
      color:#1e293b;
    }
    .btn-secondary:hover {
      background:#cbd5e1;
    }

    .muted { color:#64748b; }

    input,select,textarea {
      width:100%; padding:9px; margin-top:5px;
      border-radius:8px; border:1px solid #cbd5e1;
      font-size:14px;
    }
    textarea { min-height:70px; }
    form label { font-weight:600; margin-top:10px; display:block; }

    .grid { display:grid; gap:16px; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); }

    .dashboard-grid {
      display:grid;
      grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
      gap:14px;
    }
    .stat-card {
      background:#f8fafc;
      border-radius:12px;
      padding:12px 14px;
      border:1px solid #e2e8f0;
    }
    .stat-label { font-size:12px; text-transform:uppercase; letter-spacing:0.06em; color:#94a3b8; }
    .stat-value { font-size:22px; font-weight:700; margin-top:4px; }
    .stat-description { font-size:12px; color:#64748b; margin-top:3px; }

    .table-wrapper {
      overflow-x:auto;
      margin-top:8px;
    }
    table.data-table {
      width:100%;
      border-collapse:collapse;
      font-size:13px;
      min-width:720px;
    }
    table.data-table th,
    table.data-table td {
      padding:8px 10px;
      border-bottom:1px solid #e2e8f0;
      text-align:left;
      vertical-align:top;
    }
    table.data-table thead th {
      background:#f8fafc;
      font-size:12px;
      font-weight:600;
      color:#6b7280;
      text-transform:uppercase;
      letter-spacing:0.05em;
    }
    table.data-table tbody tr:hover {
      background:#f9fafb;
    }

    .pill { display:inline-flex; align-items:center; padding:2px 8px; border-radius:999px;
            border:1px solid #cbd5e1; font-size:11px; color:#64748b; }

    .status-badge {
      display:inline-block;
      padding:2px 8px;
      border-radius:999px;
      font-size:11px;
      font-weight:600;
    }
    .status-PRE_ADESAO { background:#e5e7eb; color:#4b5563; }
    .status-EM_ATENDIMENTO { background:#dbeafe; color:#1d4ed8; }
    .status-BOLETO_EMITIDO { background:#fef3c7; color:#b45309; }
    .status-APROVADA { background:#dcfce7; color:#15803d; }
    .status-NAO_FECHOU { background:#fee2e2; color:#b91c1c; }

    .hist-meta { color:#9ca3af; font-size:11px; }

    .tag-small {
      display:inline-flex;
      align-items:center;
      padding:2px 6px;
      border-radius:999px;
      background:#eff6ff;
      color:#1d4ed8;
      font-size:11px;
      font-weight:500;
    }

    .form-steps {
      display:flex;
      flex-wrap:wrap;
      gap:8px;
      margin-bottom:10px;
      font-size:12px;
      color:#64748b;
    }
    .form-step {
      display:flex;
      align-items:center;
      gap:6px;
    }
    .form-step-number {
      width:18px; height:18px;
      border-radius:999px;
      background:#e0f2fe;
      color:#0369a1;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:10px;
      font-weight:700;
    }
  </style>
</head>

<body>
<header>
  <div class="header-inner">
    <div class="logo">
      <div class="logo-mark">I</div>
      <div>INDICONS</div>
    </div>

    <nav>
      <a href="/">Home</a>
      <a href="/lp">Seja Indicador</a>
      <a href="/indicador/login">Indicador</a>
      <a href="/parceiro/login">Parceiro</a>
      <a href="/admin/login">Admin</a>
    </nav>

    <div style="font-size:12px;">${userNav}</div>
  </div>
</header>

<main>${content}</main>
</body>
</html>
`;
}

// =============================================================
// HOME SIMPLES
// =============================================================
app.get("/", (req, res) => {
  res.send(
    layout(
      "INDICONS - Home",
      `
      <div class="card">
        <h1>Bem-vindo ao INDICONS</h1>
        <p class="muted">Plataforma de indicação de consórcios com painel para indicador, parceiro e admin.</p>
        <a class="btn" href="/lp">Ver página comercial para se tornar indicador</a>
      </div>
      `
    )
  );
});

// =============================================================
// LANDING PAGE PREMIUM /lp (mantida, já é bem didática)
// =============================================================
app.get("/lp", (req, res) => {
  const content = `
  <style>
    .lp-hero {
      background: linear-gradient(135deg, #e0f2fe, #f9fafb);
      border-radius: 18px;
      padding: 40px 24px;
      display: grid;
      grid-template-columns: minmax(0, 2fr) minmax(0, 1.5fr);
      gap: 24px;
      align-items: center;
      border: 1px solid #bfdbfe;
      box-shadow: 0 10px 40px rgba(15,23,42,0.12);
      animation: lpFadeIn 0.7s ease-out;
    }
    @media (max-width: 768px) {
      .lp-hero { grid-template-columns: 1fr; }
    }
    .lp-hero-title {
      font-size: 32px;
      line-height: 1.2;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 10px;
    }
    .lp-hero-sub {
      font-size: 16px;
      color: #64748b;
      margin-bottom: 16px;
    }
    .lp-hero-badge {
      display:inline-flex;
      align-items:center;
      gap:6px;
      padding:4px 10px;
      border-radius:999px;
      background:#e0f2fe;
      color:#0369a1;
      font-size:12px;
      font-weight:600;
      margin-bottom:10px;
    }
    .lp-hero-img-wrapper {
      border-radius: 18px;
      overflow: hidden;
      position: relative;
      background:#0f172a;
      animation: lpSlideUp 0.8s ease-out;
    }
    .lp-hero-img {
      width: 100%;
      display: block;
      object-fit: cover;
      max-height: 260px;
      filter: saturate(1.1);
      transform: scale(1.02);
    }
    .lp-hero-tag {
      position:absolute;
      bottom:10px;
      left:10px;
      background:rgba(15,23,42,0.9);
      color:#e5e7eb;
      padding:6px 10px;
      border-radius:999px;
      font-size:12px;
    }

    .lp-cta-main {
      display:inline-flex;
      align-items:center;
      gap:8px;
      background:#0ea5e9;
      color:white;
      padding:12px 22px;
      border-radius:999px;
      font-weight:700;
      text-decoration:none;
      font-size:15px;
      box-shadow:0 10px 25px rgba(14,165,233,0.4);
      transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
    }
    .lp-cta-main:hover {
      transform: translateY(-1px);
      background:#0369a1;
      box-shadow:0 16px 32px rgba(15,23,42,0.45);
    }
    .lp-cta-note {
      font-size: 13px;
      color:#64748b;
      margin-top:6px;
    }

    .lp-section {
      background:#ffffff;
      border-radius:18px;
      padding:24px 20px;
      margin-top:20px;
      border:1px solid #e2e8f0;
      box-shadow:0 8px 24px rgba(15,23,42,0.06);
      animation: lpFadeIn 0.7s ease-out;
    }
    .lp-section h2 {
      margin-top:0;
      font-size:22px;
      color:#0f172a;
    }
    .lp-grid {
      display:grid;
      grid-template-columns:repeat(auto-fit,minmax(230px,1fr));
      gap:16px;
      margin-top:14px;
    }
    .lp-card {
      background:#f8fafc;
      border-radius:14px;
      padding:14px 12px;
      border:1px solid #e2e8f0;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .lp-card:hover {
      transform: translateY(-3px);
      box-shadow:0 12px 30px rgba(15,23,42,0.12);
    }
    .lp-card h3 {
      margin-top:0;
      font-size:16px;
      color:#0f172a;
      margin-bottom:6px;
    }
    .lp-card p {
      margin:0;
      font-size:14px;
      color:#64748b;
    }

    .lp-table {
      width:100%;
      border-collapse:collapse;
      margin-top:12px;
      font-size:14px;
    }
    .lp-table th, .lp-table td {
      border:1px solid #e2e8f0;
      padding:8px;
      text-align:center;
    }
    .lp-table th {
      background:#eff6ff;
      color:#1e293b;
    }

    .lp-testimonials {
      display:grid;
      grid-template-columns:repeat(auto-fit,minmax(260px,1fr));
      gap:14px;
      margin-top:14px;
    }
    .lp-testimonial {
      border-radius:14px;
      padding:14px;
      background:#f9fafb;
      border:1px solid #e2e8f0;
      font-size:14px;
      color:#475569;
    }
    .lp-testimonial-header {
      display:flex;
      align-items:center;
      gap:10px;
      margin-bottom:8px;
    }
    .lp-testimonial-avatar {
      width:36px;
      height:36px;
      border-radius:50%;
      object-fit:cover;
    }
    .lp-testimonial-name {
      font-weight:600;
    }
    .lp-testimonial-role {
      font-size:12px;
      color:#9ca3af;
    }

    .lp-footer-cta { text-align:center; margin-top:10px; }

    @keyframes lpFadeIn {
      from { opacity:0; transform:translateY(6px); }
      to { opacity:1; transform:translateY(0); }
    }
    @keyframes lpSlideUp {
      from { opacity:0; transform:translateY(20px); }
      to { opacity:1; transform:translateY(0); }
    }
  </style>

  <section class="lp-hero">
    <div>
      <div class="lp-hero-badge">🔑 Renda extra com indicação de consórcios</div>
      <h1 class="lp-hero-title">
        Ganhe até R$ 5.000 por mês<br>apenas indicando consórcios
      </h1>
      <p class="lp-hero-sub">
        Você não precisa vender, negociar ou explicar o produto. Apenas envia um link.  
        A equipe parceira faz o restante e você recebe <strong>5% de comissão</strong>
        nas vendas aprovadas.
      </p>
      <a href="/indicador/registrar" class="lp-cta-main">
        Quero ser Indicador agora
      </a>
      <div class="lp-cta-note">
        Cadastro gratuito · Sem meta mínima · Sem necessidade de CNPJ
      </div>
    </div>

    <div class="lp-hero-img-wrapper">
      <img
        class="lp-hero-img"
        src="https://images.pexels.com/photos/1181555/pexels-photo-1181555.jpeg?auto=compress&cs=tinysrgb&w=800"
        alt="Pessoa usando notebook para trabalhar com indicações"
      />
      <div class="lp-hero-tag">
        Plataforma INDICONS em funcionamento real
      </div>
    </div>
  </section>

  <section class="lp-section">
    <h2>Por que trabalhar com indicação via INDICONS?</h2>
    <div class="lp-grid">
      <div class="lp-card">
        <h3>5% de comissão real</h3>
        <p>Venda de R$ 100.000 gera R$ 5.000 de comissão para você. Uma única venda já faz diferença.</p>
      </div>
      <div class="lp-card">
        <h3>Você só indica</h3>
        <p>O parceiro autorizado faz contato, explica o produto, tira dúvidas e fecha a venda.</p>
      </div>
      <div class="lp-card">
        <h3>Links prontos para compartilhar</h3>
        <p>Você gera links personalizados e envia por WhatsApp, redes sociais ou e-mail.</p>
      </div>
      <div class="lp-card">
        <h3>Plataforma com registro de tudo</h3>
        <p>Cada pré-adesão fica registrada com data, cliente, produto e indicador.</p>
      </div>
    </div>
  </section>

  <section class="lp-section">
    <h2>Como funciona na prática?</h2>
    <div class="lp-grid">
      <div class="lp-card"><h3>1. Cadastre-se</h3><p>Crie sua conta gratuita e acesse sua área de indicador.</p></div>
      <div class="lp-card"><h3>2. Compartilhe seus links</h3><p>Envie para contatos, grupos e redes sociais.</p></div>
      <div class="lp-card"><h3>3. Parceiro fecha a venda</h3><p>Ele registra no sistema da administradora.</p></div>
      <div class="lp-card"><h3>4. Você recebe a comissão</h3><p>O sistema registra e calcula seus 5%.</p></div>
    </div>

    <h3 style="margin-top:24px;">Cenário realista de ganhos mensais</h3>
    <p class="muted">Simulação simples apenas para ilustrar o potencial:</p>
    <div style="max-width:480px; margin-top:10px;">
      <canvas id="lpChart" height="180"></canvas>
    </div>
  </section>

  <section class="lp-section">
    <h2>Exemplos de ganhos por indicação</h2>
    <table class="lp-table">
      <thead>
        <tr>
          <th>Quantidade de vendas</th>
          <th>Ticket médio</th>
          <th>Comissão (5%) estimada</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>2 vendas / mês</td><td>R$ 80.000</td><td>R$ 8.000</td></tr>
        <tr><td>4 vendas / mês</td><td>R$ 60.000</td><td>R$ 12.000</td></tr>
        <tr><td>8 vendas / mês</td><td>R$ 50.000</td><td>R$ 20.000</td></tr>
      </tbody>
    </table>
    <p class="muted" style="margin-top:8px;">Valores meramente ilustrativos.</p>
  </section>

  <section class="lp-section">
    <h2>Depoimentos de indicadoras e indicadores</h2>
    <div class="lp-testimonials">
      <div class="lp-testimonial">
        <div class="lp-testimonial-header">
          <img class="lp-testimonial-avatar" src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400" alt="Depoimento 1">
          <div>
            <div class="lp-testimonial-name">Carla, 32 anos</div>
            <div class="lp-testimonial-role">Indicadora há 6 meses</div>
          </div>
        </div>
        <p>"Eu só compartilho os links. O parceiro faz todo o atendimento e eu acompanho tudo no painel."</p>
      </div>

      <div class="lp-testimonial">
        <div class="lp-testimonial-header">
          <img class="lp-testimonial-avatar" src="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400" alt="Depoimento 2">
          <div>
            <div class="lp-testimonial-name">Marcos, 41 anos</div>
            <div class="lp-testimonial-role">Autônomo</div>
          </div>
        </div>
        <p>"Eu tinha muitos contatos, mas não vendia consórcio. Agora só indico e recebo comissão nas vendas."</p>
      </div>

      <div class="lp-testimonial">
        <div class="lp-testimonial-header">
          <img class="lp-testimonial-avatar" src="https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=400" alt="Depoimento 3">
          <div>
            <div class="lp-testimonial-name">Ana Paula, 27 anos</div>
            <div class="lp-testimonial-role">Criadora de conteúdo</div>
          </div>
        </div>
        <p>"Uso as minhas redes para falar de finanças e direciono os interessados para meus links do INDICONS."</p>
      </div>
    </div>
  </section>

  <section class="lp-section lp-footer-cta">
    <h2>Pronto para começar a indicar?</h2>
    <p>Crie sua conta de indicador gratuitamente e teste o modelo com seus próprios contatos.</p>
    <a href="/indicador/registrar" class="lp-cta-main">Criar minha conta de indicador</a>
    <p class="lp-cta-note">Logo após o cadastro você já terá acesso aos seus links e ao painel.</p>
  </section>

  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script>
    window.addEventListener('DOMContentLoaded', function () {
      var ctx = document.getElementById('lpChart');
      if (!ctx) return;
      ctx = ctx.getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['2 vendas', '4 vendas', '8 vendas'],
          datasets: [{
            label: 'Comissão estimada (R$)',
            data: [8000, 12000, 20000],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      });
    });
  </script>
  `;

  res.send(layout("Seja Indicador – INDICONS", content));
});

// =============================================================
// MIDDLEWARES DE AUTENTICAÇÃO
// =============================================================
function requireIndicador(req, res, next) {
  if (!req.session.indicadorId) return res.redirect("/indicador/login");
  next();
}
function requireParceiro(req, res, next) {
  if (!req.session.parceiroId) return res.redirect("/parceiro/login");
  next();
}
function requireAdmin(req, res, next) {
  if (!req.session.adminId) return res.redirect("/admin/login");
  next();
}

// =============================================================
// INDICADOR – CADASTRO / LOGIN
// =============================================================
app.get("/indicador/registrar", (req, res) => {
  res.send(
    layout(
      "Registrar Indicador",
      `
      <div class="card">
        <h2>Cadastrar Indicador</h2>
        <p class="muted">Crie sua conta para gerar links de indicação de consórcios e acompanhar suas comissões.</p>
        <form method="POST">
          <label>Nome completo</label><input required name="nome" placeholder="Ex: Ana Silva">
          <label>Email</label><input required type="email" name="email" placeholder="seuemail@exemplo.com">
          <label>Senha</label><input required type="password" name="senha" placeholder="Mínimo 6 caracteres">
          <button class="btn" style="margin-top:12px;">Registrar</button>
        </form>
      </div>
      `
    )
  );
});

app.post("/indicador/registrar", async (req, res) => {
  const { nome, email, senha } = req.body;
  try {
    await dbRun(
      "INSERT INTO indicadores (nome,email,senha) VALUES (?,?,?)",
      [nome, email, senha]
    );
    res.redirect("/indicador/login");
  } catch (e) {
    res.send(
      layout(
        "Erro ao cadastrar",
        `<div class="card"><h2>Não foi possível concluir o cadastro</h2><p class="muted">O email informado já está em uso. Tente fazer login ou cadastre outro email.</p><a href="/indicador/registrar" class="btn btn-secondary">Voltar</a></div>`
      )
    );
  }
});

app.get("/indicador/login", (req, res) => {
  res.send(
    layout(
      "Login Indicador",
      `
      <div class="card">
        <h2>Login do Indicador</h2>
        <p class="muted">Acesse seu painel para ver pré-vendas, vendas aprovadas e comissões.</p>
        <form method="POST">
          <label>Email</label><input name="email" placeholder="seuemail@exemplo.com">
          <label>Senha</label><input type="password" name="senha" placeholder="••••••••">
          <button class="btn" style="margin-top:10px;">Entrar</button>
        </form>
        <p class="muted" style="margin-top:8px;">Ainda não tem conta? <a href="/indicador/registrar">Cadastre-se aqui</a>.</p>
      </div>
      `
    )
  );
});

app.post("/indicador/login", async (req, res) => {
  const ind = await dbGet(
    "SELECT * FROM indicadores WHERE email=? AND senha=?",
    [req.body.email, req.body.senha]
  );
  if (!ind)
    return res.send(
      layout(
        "Login inválido",
        `<div class="card"><h2>Login inválido</h2><p class="muted">Verifique email e senha e tente novamente.</p><a href="/indicador/login" class="btn btn-secondary">Voltar</a></div>`
      )
    );

  req.session.indicadorId = ind.id;
  req.session.indicadorNome = ind.nome;
  res.redirect("/indicador/dashboard");
});

// =============================================================
// INDICADOR – DASHBOARD COMERCIAL + GRÁFICO (tabelas)
// =============================================================
app.get("/indicador/dashboard", requireIndicador, async (req, res) => {
  const indicadorId = req.session.indicadorId;

  const pre = await dbAll(
    `SELECT pv.*, p.nome AS produto_nome 
     FROM pre_vendas pv 
     JOIN produtos p ON p.id = pv.produto_id 
     WHERE pv.indicador_id = ? 
     ORDER BY pv.id DESC`,
    [indicadorId]
  );

  const coms = await dbAll(
    `SELECT * FROM comissoes WHERE indicador_id = ?`,
    [indicadorId]
  );

  const totalPre = pre.length;
  const totalAprovadas = pre.filter((v) => v.status === "APROVADA").length;
  const valorVendasAprovadas = pre
    .filter((v) => v.status === "APROVADA" && v.valor_venda)
    .reduce((s, v) => s + Number(v.valor_venda || 0), 0);
  const totalComissao = coms.reduce(
    (s, c) => s + Number(c.valor_comissao || 0),
    0
  );

  function countStatus(st) {
    return pre.filter((v) => v.status === st).length;
  }
  const statusPreAdesao = countStatus("PRE_ADESAO");
  const statusEmAtend = countStatus("EM_ATENDIMENTO");
  const statusBoleto = countStatus("BOLETO_EMITIDO");
  const statusAprovada = countStatus("APROVADA");
  const statusNaoFechou = countStatus("NAO_FECHOU");

  const content = `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
        <div>
          <h2>Painel comercial – ${req.session.indicadorNome}</h2>
          <p class="muted">Acompanhe suas indicações, status de cada cliente e comissões geradas.</p>
        </div>
        <div>
          <a href="/indicador/links" class="btn">Ver meus links de indicação</a>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>Visão geral</h3>
      <div class="dashboard-grid">
        <div class="stat-card">
          <div class="stat-label">Pré-vendas recebidas</div>
          <div class="stat-value">${totalPre}</div>
          <div class="stat-description">Clientes que clicaram nos seus links e preencheram a pré-adesão.</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Vendas aprovadas</div>
          <div class="stat-value">${totalAprovadas}</div>
          <div class="stat-description">Pré-vendas que viraram contrato de consórcio.</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Valor vendido (aprovado)</div>
          <div class="stat-value">R$ ${valorVendasAprovadas.toFixed(2)}</div>
          <div class="stat-description">Somente vendas com status "APROVADA".</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Comissões estimadas</div>
          <div class="stat-value">R$ ${totalComissao.toFixed(2)}</div>
          <div class="stat-description">Baseado nos registros de comissão lançados pelo parceiro.</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>Funil de atendimento das suas indicações</h3>
      <p class="muted">Veja em que etapa estão os clientes que você indicou.</p>
      <div style="max-width:520px; margin-top:10px;">
        <canvas id="indicadorChart" height="180"></canvas>
      </div>
    </div>

    <div class="card">
      <h3>Lista de clientes indicados</h3>
      <p class="muted">Tabela com todas as pré-vendas geradas pelos seus links.</p>
      ${
        pre.length === 0
          ? `<p class="muted" style="margin-top:8px;">Nenhuma pré-venda ainda. Compartilhe seus links para começar.</p>`
          : `
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Produto</th>
              <th>Status</th>
              <th>Valor da venda</th>
              <th>Contato</th>
            </tr>
          </thead>
          <tbody>
            ${pre
              .map(
                (v) => `
              <tr>
                <td>${v.nome_cliente}</td>
                <td>${v.produto_nome}</td>
                <td><span class="status-badge status-${v.status}">${v.status}</span></td>
                <td>${
                  v.valor_venda
                    ? "R$ " + Number(v.valor_venda).toFixed(2)
                    : "-"
                }</td>
                <td>
                  <div>${v.telefone_cliente}</div>
                  <div class="muted">${v.email_cliente}</div>
                </td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>`
      }
    </div>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
      window.addEventListener('DOMContentLoaded', function () {
        var ctx = document.getElementById('indicadorChart');
        if (!ctx) return;
        ctx = ctx.getContext('2d');

        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: [
              'Pré-adesão',
              'Em atendimento',
              'Boleto emitido',
              'Aprovada',
              'Não fechou'
            ],
            datasets: [{
              label: 'Quantidade de clientes',
              data: [
                ${statusPreAdesao},
                ${statusEmAtend},
                ${statusBoleto},
                ${statusAprovada},
                ${statusNaoFechou}
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
          }
        });
      });
    </script>
  `;

  res.send(
    layout(
      "Dashboard Indicador",
      content,
      `Indicador: ${req.session.indicadorNome} | <a href="/logout">Sair</a>`
    )
  );
});

// =============================================================
// INDICADOR – LINKS
// =============================================================
app.get("/indicador/links", requireIndicador, async (req, res) => {
  const produtos = await dbAll("SELECT * FROM produtos");
  const base = process.env.BASE_URL || "https://indicons.onrender.com";

  res.send(
    layout(
      "Links Indicador",
      `
      <div class="card">
        <h2>Meus links de indicação</h2>
        <p class="muted">Copie e envie os links para seus contatos por WhatsApp, redes sociais ou e-mail.</p>
      </div>
      <div class="card">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Descrição</th>
                <th>Link de indicação</th>
              </tr>
            </thead>
            <tbody>
              ${produtos
                .map((p) => {
                  const link = `${base}/consorcio?i=${req.session.indicadorId}&p=${p.id}`;
                  return `
                    <tr>
                      <td>${p.nome}</td>
                      <td>${p.descricao}</td>
                      <td>
                        <code style="font-size:11px;">${link}</code><br>
                        <span class="muted" style="font-size:11px;">Compartilhe este endereço com seus clientes.</span>
                      </td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
      `,
      `Indicador: ${req.session.indicadorNome} | <a href="/logout">Sair</a>`
    )
  );
});

// =============================================================
// CLIENTE – PRÉ-ADESÃO (mais didático)
// =============================================================
app.get("/consorcio", async (req, res) => {
  const { i, p } = req.query;
  const ind = await dbGet("SELECT * FROM indicadores WHERE id=?", [i]);
  const prod = await dbGet("SELECT * FROM produtos WHERE id=?", [p]);

  if (!ind || !prod)
    return res.send(
      layout(
        "Link inválido",
        `<div class="card"><h2>Link de consórcio inválido</h2><p class="muted">Verifique com a pessoa que enviou o link ou tente novamente mais tarde.</p></div>`
      )
    );

  res.send(
    layout(
      "Pré-adesão",
      `
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
          <div>
            <h2>${prod.nome}</h2>
            <p class="muted">${prod.descricao}</p>
          </div>
          <div class="tag-small">
            Indicação de ${ind.nome}
          </div>
        </div>

        <div class="form-steps">
          <div class="form-step">
            <div class="form-step-number">1</div> <span>Você preenche seus dados de interesse.</span>
          </div>
          <div class="form-step">
            <div class="form-step-number">2</div> <span>Um especialista entra em contato para tirar dúvidas.</span>
          </div>
          <div class="form-step">
            <div class="form-step-number">3</div> <span>Se fizer sentido para você, a adesão é concluída.</span>
          </div>
        </div>

        <form method="POST" action="/consorcio">
          <input type="hidden" name="indicador_id" value="${ind.id}">
          <input type="hidden" name="produto_id" value="${prod.id}">

          <label>Nome completo</label>
          <input name="nome" required placeholder="Como está no seu documento">

          <label>Telefone / WhatsApp</label>
          <input name="telefone" required placeholder="(DDD) 9 9999-9999">

          <label>E-mail</label>
          <input name="email" type="email" required placeholder="seuemail@exemplo.com">

          <button class="btn" style="margin-top:12px;">Quero receber contato sobre este consórcio</button>
        </form>

        <p class="muted" style="margin-top:8px; font-size:12px;">
          Seus dados serão usados apenas para contato sobre este consórcio. Não realizamos cobrança automática sem sua autorização.
        </p>
      </div>
      `
    )
  );
});

app.post("/consorcio", async (req, res) => {
  const { indicador_id, produto_id, nome, telefone, email } = req.body;
  await dbRun(
    `INSERT INTO pre_vendas (indicador_id,produto_id,nome_cliente,telefone_cliente,email_cliente)
     VALUES (?,?,?,?,?)`,
    [indicador_id, produto_id, nome, telefone, email]
  );

  res.send(
    layout(
      "Pré-adesão enviada",
      `<div class="card">
        <h2>Pré-adesão registrada com sucesso</h2>
        <p class="muted">Um parceiro autorizado entrará em contato em breve para explicar o consórcio e tirar suas dúvidas, sem compromisso.</p>
      </div>`
    )
  );
});

// =============================================================
// PARCEIRO
// =============================================================
const PARCEIRO_EMAIL = "parceiro@indicons.com";
const PARCEIRO_SENHA = "123456";

app.get("/parceiro/login", (req, res) => {
  res.send(
    layout(
      "Login Parceiro",
      `
      <div class="card">
        <h2>Login do Parceiro</h2>
        <p class="muted">Acesse a fila de pré-vendas geradas pelos indicadores e atualize o status de cada cliente.</p>
        <form method="POST">
          <label>Email</label><input name="email">
          <label>Senha</label><input type="password" name="senha">
          <button class="btn" style="margin-top:10px;">Entrar</button>
        </form>
        <p class="muted">Usuário padrão: parceiro@indicons.com / 123456</p>
      </div>
      `
    )
  );
});

app.post("/parceiro/login", (req, res) => {
  const { email, senha } = req.body;
  if (email === PARCEIRO_EMAIL && senha === PARCEIRO_SENHA) {
    req.session.parceiroId = 1;
    req.session.parceiroNome = "Parceiro";
    return res.redirect("/parceiro/pre-vendas");
  }
  res.send(
    layout(
      "Login inválido",
      `<div class="card"><h2>Login inválido</h2><p class="muted">Verifique usuário e senha e tente novamente.</p><a href="/parceiro/login" class="btn btn-secondary">Voltar</a></div>`
    )
  );
});

// Lista de pré-vendas em tabela + histórico resumido
app.get("/parceiro/pre-vendas", requireParceiro, async (req, res) => {
  const pv = await dbAll(
    `SELECT pv.*, p.nome produto_nome, i.nome indicador_nome
     FROM pre_vendas pv
     JOIN produtos p ON p.id=pv.produto_id
     JOIN indicadores i ON i.id=pv.indicador_id
     ORDER BY pv.id DESC`
  );

  const historico = await dbAll(
    `SELECT * FROM historico_pre_vendas ORDER BY criado_em DESC`
  );

  res.send(
    layout(
      "Pré-vendas para atendimento",
      `
      <div class="card">
        <h2>Pré-vendas para atendimento</h2>
        <p class="muted">Use a tabela abaixo para controlar o andamento de cada cliente indicado.</p>
      </div>

      <div class="card">
        ${
          pv.length === 0
            ? `<p class="muted">Nenhuma pré-venda registrada até o momento.</p>`
            : `
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Produto / Indicador</th>
                <th>Status atual</th>
                <th>Valor venda</th>
                <th>Última observação</th>
                <th>Atualizar</th>
              </tr>
            </thead>
            <tbody>
              ${pv
                .map((v) => {
                  const histPv = historico.filter((h) => h.pre_venda_id === v.id);
                  const ultimo = histPv[0];
                  const ultimaObs =
                    ultimo && ultimo.observacao
                      ? ultimo.observacao
                      : "Sem observações registradas.";

                  return `
                    <tr>
                      <td>
                        <strong>${v.nome_cliente}</strong><br>
                        <span class="muted">${v.telefone_cliente}</span><br>
                        <span class="muted">${v.email_cliente}</span>
                      </td>
                      <td>
                        ${v.produto_nome}<br>
                        <span class="muted" style="font-size:11px;">Indicador: ${v.indicador_nome}</span>
                      </td>
                      <td>
                        <span class="status-badge status-${v.status}">${v.status}</span><br>
                        ${
                          ultimo
                            ? `<span class="hist-meta">Atualizado por ${ultimo.usuario_nome || ultimo.usuario_tipo} em ${ultimo.criado_em}</span>`
                            : ""
                        }
                      </td>
                      <td>
                        ${
                          v.valor_venda
                            ? "R$ " + Number(v.valor_venda).toFixed(2)
                            : "-"
                        }
                      </td>
                      <td style="max-width:220px;">
                        <span class="muted" style="font-size:12px;">${ultimaObs}</span>
                      </td>
                      <td>
                        <form method="POST" action="/parceiro/pre-vendas/${v.id}/status">
                          <label style="font-size:11px;">Novo status</label>
                          <select name="status">
                            <option value="EM_ATENDIMENTO" ${
                              v.status === "EM_ATENDIMENTO" ? "selected" : ""
                            }>Em atendimento</option>
                            <option value="BOLETO_EMITIDO" ${
                              v.status === "BOLETO_EMITIDO" ? "selected" : ""
                            }>Boleto emitido</option>
                            <option value="APROVADA" ${
                              v.status === "APROVADA" ? "selected" : ""
                            }>Aprovada</option>
                            <option value="NAO_FECHOU" ${
                              v.status === "NAO_FECHOU" ? "selected" : ""
                            }>Não fechou</option>
                          </select>

                          <label style="font-size:11px;">Valor venda (se aprovada)</label>
                          <input name="valor_venda" placeholder="Ex: 80000,00">

                          <label style="font-size:11px;">Observação</label>
                          <textarea name="observacao" placeholder="Ex: Cliente pediu proposta, aguardando retorno."></textarea>

                          <button class="btn" style="margin-top:6px; width:100%;">Salvar</button>
                        </form>
                      </td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>
        </div>`
        }
      </div>
      `,
      `Parceiro: ${req.session.parceiroNome} | <a href="/logout">Sair</a>`
    )
  );
});

// Atualização de status com histórico e proteção comissão duplicada
app.post("/parceiro/pre-vendas/:id/status", requireParceiro, async (req, res) => {
  const { status, valor_venda, observacao } = req.body;
  const id = req.params.id;

  const pv = await dbGet("SELECT * FROM pre_vendas WHERE id=?", [id]);
  if (!pv) {
    return res.redirect("/parceiro/pre-vendas");
  }

  const updates = ["status = ?"];
  const params = [status];

  let novoValorVenda = null;

  if (valor_venda && valor_venda.toString().trim() !== "") {
    const parsed = parseFloat(
      valor_venda.toString().replace(".", "").replace(",", ".")
    );
    if (!isNaN(parsed) && parsed > 0) {
      updates.push("valor_venda = ?");
      params.push(parsed);
      novoValorVenda = parsed;
    }
  }

  params.push(id);
  await dbRun(`UPDATE pre_vendas SET ${updates.join(", ")} WHERE id=?`, params);

  await dbRun(
    `
    INSERT INTO historico_pre_vendas
      (pre_venda_id, usuario_tipo, usuario_nome, status_anterior, status_novo, observacao)
    VALUES (?,?,?,?,?,?)
  `,
    [
      id,
      "PARCEIRO",
      req.session.parceiroNome || "Parceiro",
      pv.status,
      status,
      observacao && observacao.trim() !== "" ? observacao.trim() : null,
    ]
  );

  const pvAtual = await dbGet("SELECT * FROM pre_vendas WHERE id=?", [id]);

  if (status === "APROVADA") {
    let valorComissaoBase = novoValorVenda;

    if (valorComissaoBase === null && pvAtual && pvAtual.valor_venda) {
      valorComissaoBase = Number(pvAtual.valor_venda);
    }

    if (valorComissaoBase && valorComissaoBase > 0) {
      const jaTem = await dbGet(
        "SELECT id FROM comissoes WHERE pre_venda_id = ?",
        [id]
      );

      if (!jaTem) {
        await dbRun(
          `INSERT INTO comissoes (indicador_id,pre_venda_id,valor_venda,valor_comissao)
           VALUES (?,?,?,?)`,
          [
            pvAtual.indicador_id,
            id,
            valorComissaoBase,
            valorComissaoBase * 0.05,
          ]
        );
      }
    }
  }

  res.redirect("/parceiro/pre-vendas");
});

// =============================================================
// ADMIN
// =============================================================
const ADMIN_EMAIL = "admin@indicons.com";
const ADMIN_SENHA = "123456";

app.get("/admin/login", (req, res) => {
  res.send(
    layout(
      "Admin Login",
      `
      <div class="card">
        <h2>Login Admin</h2>
        <p class="muted">Área administrativa para acompanhar as comissões dos indicadores.</p>
        <form method="POST">
          <label>Email</label><input name="email">
          <label>Senha</label><input type="password" name="senha">
          <button class="btn" style="margin-top:10px;">Entrar</button>
        </form>
        <p class="muted">Usuário padrão: admin@indicons.com / 123456</p>
      </div>
      `
    )
  );
});

app.post("/admin/login", (req, res) => {
  if (req.body.email === ADMIN_EMAIL && req.body.senha === ADMIN_SENHA) {
    req.session.adminId = 1;
    req.session.adminNome = "Admin";
    return res.redirect("/admin/dashboard");
  }
  res.send(
    layout(
      "Login inválido",
      `<div class="card"><h2>Login inválido</h2><p class="muted">Verifique usuário e senha e tente novamente.</p><a href="/admin/login" class="btn btn-secondary">Voltar</a></div>`
    )
  );
});

app.get("/admin/dashboard", requireAdmin, async (req, res) => {
  const coms = await dbAll(
    `SELECT c.*, i.nome AS indicador_nome
     FROM comissoes c
     JOIN indicadores i ON i.id=c.indicador_id
     ORDER BY c.id DESC`
  );

  res.send(
    layout(
      "Dashboard Admin",
      `
      <div class="card">
        <h2>Comissões geradas pelos indicadores</h2>
        <p class="muted">Tabela com todas as comissões lançadas a partir das vendas aprovadas.</p>
      </div>
      <div class="card">
        ${
          coms.length === 0
            ? "<p class='muted'>Nenhuma comissão registrada ainda.</p>"
            : `
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Indicador</th>
                <th>Pré-venda</th>
                <th>Valor venda</th>
                <th>Comissão (5%)</th>
              </tr>
            </thead>
            <tbody>
              ${coms
                .map(
                  (c) => `
                <tr>
                  <td>#${c.id}</td>
                  <td>${c.indicador_nome}</td>
                  <td>${c.pre_venda_id}</td>
                  <td>R$ ${Number(c.valor_venda).toFixed(2)}</td>
                  <td><strong>R$ ${Number(c.valor_comissao).toFixed(2)}</strong></td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>`
        }
      </div>
      `,
      `Admin: ${req.session.adminNome} | <a href="/logout">Sair</a>`
    )
  );
});

// =============================================================
// LOGOUT
// =============================================================
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// =============================================================
// IA DEMO E WHATSAPP DEMO (somente estrutura, sem API real)
// =============================================================
app.post("/api/ia-demo", (req, res) => {
  const pergunta = req.body.pergunta || "";
  res.json({
    resposta:
      "Esta é uma resposta automática de demonstração. Em produção, aqui entraria a integração com IA (OpenAI, etc.). Sua pergunta foi: " +
      pergunta,
  });
});

app.post("/api/whatsapp-demo", (req, res) => {
  const { telefone, mensagem } = req.body;
  console.log(
    "Simulando envio de WhatsApp para:",
    telefone,
    "mensagem:",
    mensagem
  );
  res.json({
    ok: true,
    detalhe:
      "Envio de WhatsApp simulado. Em produção, aqui entra a integração com um provedor (Z-API, Gupshup, etc.).",
  });
});

// =============================================================
// INICIAR SERVIDOR
// =============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("INDICONS rodando na porta " + PORT));
