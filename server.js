// =============================================================
// INDICONS – Sistema completo + SQLite + Landing Page Premium
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
    secret: "indicons-secret",
    resave: false,
    saveUninitialized: true,
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

  db.get("SELECT COUNT(*) AS c FROM produtos", (err, row) => {
    if (row.c === 0) {
      db.run(
        `INSERT INTO produtos (nome, descricao) VALUES (?, ?)`,
        ["Consórcio Imobiliário", "Crédito para imóveis residenciais e comerciais"]
      );
      db.run(
        `INSERT INTO produtos (nome, descricao) VALUES (?, ?)`,
        ["Consórcio Automóvel", "Crédito para veículos leves e pesados"]
      );
    }
  });
});

// Funções auxiliares async:
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
// LAYOUT GLOBAL (PAINEL + LANDING PAGE CLARA)
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
    body { background:#f1f5f9; margin:0; font-family: Arial; color:#1e293b; }

    header {
      background:#ffffff;
      border-bottom:1px solid #cbd5e1;
      position:sticky; top:0;
      z-index:10;
    }

    .header-inner {
      max-width:1100px;
      margin:auto;
      padding:12px 20px;
      display:flex;
      align-items:center;
      justify-content:space-between;
    }

    .logo { display:flex; align-items:center; gap:12px; font-size:20px; font-weight:bold; }
    .logo-mark {
      width:38px; height:38px; border-radius:50%;
      background:linear-gradient(135deg,#0ea5e9,#0369a1);
      color:white; display:flex; align-items:center; justify-content:center;
      font-size:18px; font-weight:700;
    }

    nav a {
      margin-left: 14px;
      text-decoration:none;
      color:#475569;
      font-weight:500;
    }
    nav a:hover { color:#0ea5e9; }

    main { max-width:1100px; margin:auto; padding:20px; }

    .card {
      background:#ffffff;
      border:1px solid #cbd5e1;
      border-radius:12px;
      padding:28px;
      margin-bottom:20px;
      box-shadow:0 4px 12px rgba(0,0,0,0.04);
    }

    .btn {
      background:#0ea5e9; color:white;
      padding:12px 20px; border-radius:999px;
      border:none; cursor:pointer; font-weight:bold; font-size:16px;
      display:inline-block; text-decoration:none;
    }
    .btn:hover { background:#0369a1; }

    .muted { color:#64748b; }
    input,select {
      width:100%; padding:10px; margin-top:6px;
      border-radius:8px; border:1px solid #cbd5e1;
      font-size:15px;
    }
    form label { font-weight:bold; margin-top:12px; display:block; }
    .grid { display:grid; gap:20px; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); }
  </style>
</head>

<body>
<header>
  <div class="header-inner">
    <div class="logo">
      <div class="logo-mark">I</div> INDICONS
    </div>

    <nav>
      <a href="/">Home</a>
      <a href="/lp">Seja Indicador</a>
      <a href="/indicador/login">Indicador</a>
      <a href="/parceiro/login">Parceiro</a>
      <a href="/admin/login">Admin</a>
    </nav>

    <div>${userNav}</div>
  </div>
</header>

<main>${content}</main>
</body>
</html>
`;
}

// -------------------------------------------------------------
// PAGINA HOME
// -------------------------------------------------------------
app.get("/", (req, res) => {
  res.send(
    layout(
      "INDICONS - Home",
      `<div class="card">
        <h1>Bem-vindo ao INDICONS</h1>
        <p class="muted">Plataforma completa de indicação de consórcios.</p>
        <a class="btn" href="/lp">Acessar página comercial</a>
      </div>`
    )
  );
});

// =============================================================
// LANDING PAGE PREMIUM /lp (animações + imagens + gráfico)
// =============================================================
app.get("/lp", (req, res) => {
  const content = `
  <style>
    /* Estilos específicos da landing page (tema claro, animado) */
    .lp-hero {
      background: linear-gradient(135deg, #e0f2fe, #f9fafb);
      border-radius: 18px;
      padding: 50px 24px;
      display: grid;
      grid-template-columns: minmax(0, 2fr) minmax(0, 1.5fr);
      gap: 24px;
      align-items: center;
      border: 1px solid #bfdbfe;
      box-shadow: 0 10px 40px rgba(15,23,42,0.12);
      animation: lpFadeIn 0.8s ease-out;
    }
    @media (max-width: 768px) {
      .lp-hero {
        grid-template-columns: 1fr;
      }
    }
    .lp-hero-title {
      font-size: 32px;
      line-height: 1.2;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 10px;
    }
    .lp-hero-sub {
      font-size: 17px;
      color: #64748b;
      margin-bottom: 18px;
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
      animation: lpSlideUp 0.9s ease-out;
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
      font-size:16px;
      box-shadow:0 10px 25px rgba(14,165,233,0.4);
      transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
    }
    .lp-cta-main:hover {
      transform: translateY(-1px);
      background:#0369a1;
      box-shadow:0 14px 30px rgba(15,23,42,0.45);
    }
    .lp-cta-note {
      font-size: 13px;
      color:#64748b;
      margin-top:6px;
    }

    .lp-section {
      background:#ffffff;
      border-radius:18px;
      padding:26px 22px;
      margin-top:20px;
      border:1px solid #e2e8f0;
      box-shadow:0 8px 24px rgba(15,23,42,0.06);
      animation: lpFadeIn 0.8s ease-out;
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
      padding:16px 14px;
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

    .lp-footer-cta {
      text-align:center;
      margin-top:10px;
    }
    .lp-footer-cta p {
      margin-bottom:10px;
      color:#64748b;
    }

    /* Animações */
    @keyframes lpFadeIn {
      from { opacity:0; transform:translateY(8px); }
      to { opacity:1; transform:translateY(0); }
    }
    @keyframes lpSlideUp {
      from { opacity:0; transform:translateY(20px); }
      to { opacity:1; transform:translateY(0); }
    }
  </style>

  <!-- HERO -->
  <section class="lp-hero">
    <div>
      <div class="lp-hero-badge">
        🔑 Renda extra com indicação de consórcio
      </div>
      <h1 class="lp-hero-title">
        Ganhe até R$ 5.000 por mês<br>apenas indicando consórcios
      </h1>
      <p class="lp-hero-sub">
        Você não precisa vender, negociar ou explicar o produto. Apenas envia um link.  
        Nossa equipe parceira faz o restante e você recebe <strong>5% de comissão</strong>
        nas vendas aprovadas.
      </p>
      <a href="/indicador/registrar" class="lp-cta-main">
        Quero ser Indicador agora
      </a>
      <div class="lp-cta-note">
        Cadastro 100% gratuito · Sem meta mínima · Sem necessidade de CNPJ
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

  <!-- BENEFÍCIOS -->
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

  <!-- COMO FUNCIONA + GRÁFICO -->
  <section class="lp-section">
    <h2>Como funciona na prática?</h2>
    <div class="lp-grid">
      <div class="lp-card">
        <h3>1. Cadastre-se</h3>
        <p>Crie sua conta gratuita em poucos segundos e acesse sua área de indicador.</p>
      </div>
      <div class="lp-card">
        <h3>2. Compartilhe seus links</h3>
        <p>Use seus links prontos e envie para contatos, grupos, redes sociais, e-mail etc.</p>
      </div>
      <div class="lp-card">
        <h3>3. O parceiro fecha a venda</h3>
        <p>O parceiro entra em contato, finaliza a venda na administradora e atualiza o sistema.</p>
      </div>
      <div class="lp-card">
        <h3>4. Você recebe a comissão</h3>
        <p>O sistema registra a venda aprovada e calcula automaticamente sua comissão de 5%.</p>
      </div>
    </div>

    <h3 style="margin-top:24px;">Cenário realista de ganhos mensais</h3>
    <p class="muted">Simulação simples apenas para ilustrar o potencial da indicação:</p>
    <div style="max-width:480px; margin-top:10px;">
      <canvas id="lpChart" height="180"></canvas>
    </div>
  </section>

  <!-- TABELA DE GANHOS -->
  <section class="lp-section">
    <h2>Exemplos de ganhos por indicação</h2>
    <table class="lp-table">
      <thead>
        <tr>
          <th>Quantidade de vendas</th>
          <th>Ticket médio da carta</th>
          <th>Comissão (5%) estimada</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>2 vendas / mês</td>
          <td>R$ 80.000</td>
          <td>R$ 8.000</td>
        </tr>
        <tr>
          <td>4 vendas / mês</td>
          <td>R$ 60.000</td>
          <td>R$ 12.000</td>
        </tr>
        <tr>
          <td>8 vendas / mês</td>
          <td>R$ 50.000</td>
          <td>R$ 20.000</td>
        </tr>
      </tbody>
    </table>
    <p class="muted" style="margin-top:8px;">Valores meramente ilustrativos. O resultado depende do volume e perfil dos clientes indicados.</p>
  </section>

  <!-- DEPOIMENTOS -->
  <section class="lp-section">
    <h2>Depoimentos de indic
    adores</h2>
    <div class="lp-testimonials">
      <div class="lp-testimonial">
        <div class="lp-testimonial-header">
          <img class="lp-testimonial-avatar" src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400" alt="Depoimento 1">
          <div>
            <div class="lp-testimonial-name">Carla, 32 anos</div>
            <div class="lp-testimonial-role">Indicadora há 6 meses</div>
          </div>
        </div>
        <p>"Eu já trabalhava com vendas, mas nunca tinha usado indicação estruturada. Com o INDICONS eu só mando o link e acompanho tudo no painel."</p>
      </div>

      <div class="lp-testimonial">
        <div class="lp-testimonial-header">
          <img class="lp-testimonial-avatar" src="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400" alt="Depoimento 2">
          <div>
            <div class="lp-testimonial-name">Marcos, 41 anos</div>
            <div class="lp-testimonial-role">Autônomo</div>
          </div>
        </div>
        <p>"Eu não tinha tempo para vender consórcio, mas tinha contatos. Agora indico, o parceiro fecha e eu recebo pelas vendas."</p>
      </div>

      <div class="lp-testimonial">
        <div class="lp-testimonial-header">
          <img class="lp-testimonial-avatar" src="https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=400" alt="Depoimento 3">
          <div>
            <div class="lp-testimonial-name">Ana Paula, 27 anos</div>
            <div class="lp-testimonial-role">Criadora de conteúdo</div>
          </div>
        </div>
        <p>"Uso meus perfis nas redes sociais para falar de planejamento financeiro e direciono os interessados para meus links do INDICONS."</p>
      </div>
    </div>
  </section>

  <!-- CHAMADA FINAL -->
  <section class="lp-section lp-footer-cta">
    <h2>Pronto para começar a indicar?</h2>
    <p>Crie sua conta de indicador gratuitamente e teste o modelo com seus próprios contatos.</p>
    <a href="/indicador/registrar" class="lp-cta-main">Criar minha conta de indicador</a>
    <p class="lp-cta-note">Você poderá acessar seus links e seu painel de acompanhamento logo após o cadastro.</p>
  </section>

  <!-- Script do gráfico -->
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
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
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
// INDICADOR
// =============================================================
app.get("/indicador/registrar", (req, res) => {
  res.send(
    layout(
      "Registrar Indicador",
      `
      <div class="card">
        <h2>Cadastrar Indicador</h2>
        <form method="POST">
          <label>Nome</label><input required name="nome">
          <label>Email</label><input required type="email" name="email">
          <label>Senha</label><input required type="password" name="senha">
          <button class="btn" style="margin-top:14px;">Registrar</button>
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
    res.send("Erro: Email já existe");
  }
});

app.get("/indicador/login", (req, res) => {
  res.send(
    layout(
      "Login Indicador",
      `<div class="card">
        <h2>Login do Indicador</h2>
        <form method="POST">
          <label>Email</label><input name="email">
          <label>Senha</label><input type="password" name="senha">
          <button class="btn">Entrar</button>
        </form>
      </div>`
    )
  );
});

app.post("/indicador/login", async (req, res) => {
  const ind = await dbGet(
    "SELECT * FROM indicadores WHERE email=? AND senha=?",
    [req.body.email, req.body.senha]
  );
  if (!ind) return res.send("Login inválido");

  req.session.indicadorId = ind.id;
  req.session.indicadorNome = ind.nome;
  res.redirect("/indicador/dashboard");
});

app.get("/indicador/dashboard", requireIndicador, async (req, res) => {
  const pre = await dbAll(
    `SELECT pv.*, p.nome AS produto_nome 
     FROM pre_vendas pv 
     JOIN produtos p ON p.id=pv.produto_id 
     WHERE indicador_id=? ORDER BY pv.id DESC`,
    [req.session.indicadorId]
  );

  res.send(
    layout(
      "Dashboard Indicador",
      `
      <div class="card">
        <h2>Olá, ${req.session.indicadorNome}</h2>
        <a href="/indicador/links" class="btn">Meus Links</a>
      </div>

      <div class="card">
        <h3>Minhas Pré-vendas</h3>
        ${
          pre.length === 0
            ? `<p class="muted">Nenhuma pré-venda ainda.</p>`
            : pre
                .map(
                  (v) =>
                    `<div class="card" style="margin-top:6px;">
                      <strong>${v.nome_cliente}</strong> – ${v.produto_nome}<br>
                      Status: ${v.status}<br>
                      Telefone: ${v.telefone_cliente}
                    </div>`
                )
                .join("")
        }
      </div>
      `,
      `Indicador: ${req.session.indicadorNome} | <a href="/logout">Sair</a>`
    )
  );
});

app.get("/indicador/links", requireIndicador, async (req, res) => {
  const produtos = await dbAll("SELECT * FROM produtos");
  const base = process.env.BASE_URL || "https://indicons.onrender.com";

  res.send(
    layout(
      "Links Indicador",
      `
      <div class="card"><h2>Meus Links de Indicação</h2></div>
      <div class="grid">
        ${produtos
          .map((p) => {
            const link = `${base}/consorcio?i=${req.session.indicadorId}&p=${p.id}`;
            return `<div class="card">
              <h3>${p.nome}</h3>
              <p>${p.descricao}</p>
              <p><strong>Link:</strong><br><code>${link}</code></p>
            </div>`;
          })
          .join("")}
      </div>
      `,
      `Indicador: ${req.session.indicadorNome} | <a href="/logout">Sair</a>`
    )
  );
});

// =============================================================
// CLIENTE – PRÉ-ADESÃO
// =============================================================
app.get("/consorcio", async (req, res) => {
  const { i, p } = req.query;
  const ind = await dbGet("SELECT * FROM indicadores WHERE id=?", [i]);
  const prod = await dbGet("SELECT * FROM produtos WHERE id=?", [p]);

  if (!ind || !prod) return res.send("Link inválido.");

  res.send(
    layout(
      "Pré-adesão",
      `
      <div class="card">
        <h2>${prod.nome}</h2>
        <p class="muted">${prod.descricao}</p>
        <p>Indicado por <strong>${ind.nome}</strong></p>

        <form method="POST" action="/consorcio">
          <input type="hidden" name="indicador_id" value="${ind.id}">
          <input type="hidden" name="produto_id" value="${prod.id}">

          <label>Nome</label><input name="nome" required>
          <label>Telefone</label><input name="telefone" required>
          <label>Email</label><input name="email" required>

          <button class="btn">Enviar Pré-adesão</button>
        </form>
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
      `<div class="card"><h2>Pré-adesão registrada!</h2>
      <p>O parceiro entrará em contato.</p></div>`
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
        <h2>Login Parceiro</h2>
        <form method="POST">
          <label>Email</label><input name="email">
          <label>Senha</label><input type="password" name="senha">
          <button class="btn">Entrar</button>
        </form>
      </div>`
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
  res.send("Login inválido");
});

app.get("/parceiro/pre-vendas", requireParceiro, async (req, res) => {
  const pv = await dbAll(
    `SELECT pv.*, p.nome produto_nome, i.nome indicador_nome
     FROM pre_vendas pv
     JOIN produtos p ON p.id=pv.produto_id
     JOIN indicadores i ON i.id=pv.indicador_id
     ORDER BY pv.id DESC`
  );

  res.send(
    layout(
      "Pré-vendas",
      `
      <div class="card"><h2>Pré-vendas</h2></div>
      ${pv
        .map(
          (v) =>
            `<div class="card">
              <h3>${v.nome_cliente}</h3>
              <p class="muted">${v.produto_nome}</p>
              <p>Indicador: ${v.indicador_nome}</p>

              <form method="POST" action="/parceiro/pre-vendas/${v.id}/status">
                <label>Status</label>
                <select name="status">
                  <option value="EM_ATENDIMENTO">Em atendimento</option>
                  <option value="BOLETO_EMITIDO">Boleto emitido</option>
                  <option value="APROVADA">Aprovada</option>
                  <option value="NAO_FECHOU">Não fechou</option>
                </select>

                <label>Valor da venda (se aprovada)</label>
                <input name="valor_venda">

                <button class="btn">Atualizar</button>
              </form>
            </div>`
        )
        .join("")}
      `,
      `Parceiro: ${req.session.parceiroNome} | <a href="/logout">Sair</a>`
    )
  );
});

app.post("/parceiro/pre-vendas/:id/status", requireParceiro, async (req, res) => {
  const { status, valor_venda } = req.body;
  const id = req.params.id;

  await dbRun(`UPDATE pre_vendas SET status=?, valor_venda=? WHERE id=?`, [
    status,
    valor_venda || null,
    id,
  ]);

  if (status === "APROVADA" && valor_venda) {
    const pv = await dbGet("SELECT * FROM pre_vendas WHERE id=?", [id]);

    await dbRun(
      `INSERT INTO comissoes (indicador_id,pre_venda_id,valor_venda,valor_comissao)
       VALUES (?,?,?,?)`,
      [pv.indicador_id, pv.id, valor_venda, valor_venda * 0.05]
    );
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
        <form method="POST">
          <label>Email</label><input name="email">
          <label>Senha</label><input type="password" name="senha">
          <button class="btn">Entrar</button>
        </form>
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
  res.send("Login inválido");
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
        <h2>Comissões</h2>
        ${
          coms.length === 0
            ? "<p class='muted'>Nenhuma comissão ainda.</p>"
            : coms
                .map(
                  (c) =>
                    `<div class="card" style="margin-top:8px;">
                      Indicador: <strong>${c.indicador_nome}</strong><br>
                      Valor venda: R$ ${c.valor_venda}<br>
                      Comissão: <strong>R$ ${c.valor_comissao}</strong>
                    </div>`
                )
                .join("")
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
// INICIAR SERVIDOR
// =============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("INDICONS rodando na porta " + PORT));
