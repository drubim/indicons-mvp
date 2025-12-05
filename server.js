// =============================================================
// INDICONS – Sistema completo + SQLite + Painel Comercial
// + Histórico de status + Layout profissional com tabelas
// + Produtos AUTOS (códigos 8749–8730) com botão "Copiar link"
// (sem landing page /lp)
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
      descricao TEXT,
      codigo TEXT,
      credito TEXT,
      prazo TEXT,
      primeira_parcela TEXT,
      demais_parcelas TEXT
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

  // Seed de produtos AUTOS (apenas se tabela estiver vazia)
  db.get("SELECT COUNT(*) AS c FROM produtos", (err, row) => {
    if (row && row.c === 0) {
      const stmt = db.prepare(`
        INSERT INTO produtos
          (nome, descricao, codigo, credito, prazo, primeira_parcela, demais_parcelas)
        VALUES (?,?,?,?,?,?,?)
      `);

      const autos = [
        ["Autos", "Plano Autos 8749", "8749", "R$ 180.000,00", "100 meses", "R$ 5.706,00", "R$ 2.106,00"],
        ["Autos", "Plano Autos 8748", "8748", "R$ 170.000,00", "101 meses", "R$ 5.389,00", "R$ 1.989,00"],
        ["Autos", "Plano Autos 8747", "8747", "R$ 160.000,00", "102 meses", "R$ 5.072,00", "R$ 1.872,00"],
        ["Autos", "Plano Autos 8746", "8746", "R$ 150.000,00", "103 meses", "R$ 4.755,00", "R$ 1.755,00"],
        ["Autos", "Plano Autos 8745", "8745", "R$ 140.000,00", "104 meses", "R$ 4.438,00", "R$ 1.638,00"],
        ["Autos", "Plano Autos 8744", "8744", "R$ 130.000,00", "105 meses", "R$ 4.121,00", "R$ 1.521,00"],
        ["Autos", "Plano Autos 8743", "8743", "R$ 120.000,00", "106 meses", "R$ 3.804,00", "R$ 1.404,00"],
        ["Autos", "Plano Autos 8742", "8742", "R$ 110.000,00", "107 meses", "R$ 3.487,00", "R$ 1.287,00"],
        ["Autos", "Plano Autos 8741", "8741", "R$ 100.000,00", "108 meses", "R$ 3.170,00", "R$ 1.170,00"],
        ["Autos", "Plano Autos 8739", "8739", "R$ 90.000,00", "109 meses", "R$ 2.853,00", "R$ 1.053,00"],
        ["Autos", "Plano Autos 8738", "8738", "R$ 85.000,00", "110 meses", "R$ 2.694,50", "R$ 994,50"],
        ["Autos", "Plano Autos 8737", "8737", "R$ 80.000,00", "111 meses", "R$ 2.536,00", "R$ 936,00"],
        ["Autos", "Plano Autos 8736", "8736", "R$ 75.000,00", "112 meses", "R$ 2.377,50", "R$ 877,50"],
        ["Autos", "Plano Autos 8735", "8735", "R$ 70.000,00", "113 meses", "R$ 2.219,00", "R$ 819,00"],
        ["Autos", "Plano Autos 8734", "8734", "R$ 65.000,00", "114 meses", "R$ 2.060,50", "R$ 760,50"],
        ["Autos", "Plano Autos 8733", "8733", "R$ 60.000,00", "115 meses", "R$ 1.902,00", "R$ 702,00"],
        ["Autos", "Plano Autos 8732", "8732", "R$ 55.000,00", "116 meses", "R$ 1.743,50", "R$ 643,50"],
        ["Autos", "Plano Autos 8731", "8731", "R$ 50.000,00", "117 meses", "R$ 1.585,00", "R$ 585,00"],
        ["Autos", "Plano Autos 8730", "8730", "R$ 45.000,00", "118 meses", "R$ 1.426,50", "R$ 526,50"],
      ];

      autos.forEach((p) => stmt.run(p));
      stmt.finalize();
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
      <a href="/indicador/registrar">Seja Indicador</a>
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
        <a class="btn" href="/indicador/registrar">Quero ser indicador</a>
      </div>
      `
    )
  );
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
// INDICADOR – DASHBOARD COMERCIAL + GRÁFICO
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
// INDICADOR – LINKS (TABELA + BOTÃO COPIAR)
// =============================================================
app.get("/indicador/links", requireIndicador, async (req, res) => {
  const produtos = await dbAll("SELECT * FROM produtos ORDER BY nome, codigo");
  const base = process.env.BASE_URL || "https://indicons.onrender.com";

  const content = `
    <div class="card">
      <h2>Produtos de consórcio para indicação</h2>
      <p class="muted">
        Use a tabela abaixo para gerar e copiar os links de indicação. Cada linha representa um plano de consórcio.
        Clique em <strong>Copiar link</strong> ao lado do plano que deseja enviar para seu cliente.
      </p>
    </div>

    <div class="card">
      ${
        produtos.length === 0
          ? `<p class="muted">Nenhum produto cadastrado. Cadastre os planos na tabela <code>produtos</code>.</p>`
          : `
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Código</th>
              <th>Crédito</th>
              <th>Prazo</th>
              <th>1ª parcela</th>
              <th>Demais parcelas</th>
              <th>Link de indicação</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${produtos
              .map((p) => {
                const link = `${base}/consorcio?i=${req.session.indicadorId}&p=${p.id}`;
                return `
                  <tr>
                    <td>${p.nome}</td>
                    <td>${p.codigo || "-"}</td>
                    <td>${p.credito || "-"}</td>
                    <td>${p.prazo || "-"}</td>
                    <td>${p.primeira_parcela || "-"}</td>
                    <td>${p.demais_parcelas || "-"}</td>
                    <td style="max-width:260px; font-size:11px; word-break:break-all;">
                      <code>${link}</code>
                    </td>
                    <td style="white-space:nowrap;">
                      <button type="button" class="btn btn-secondary" onclick="copyLink('${link.replace(/'/g, "\\'")}')">
                        Copiar link
                      </button>
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

    <script>
      function copyLink(text) {
        if (!navigator.clipboard) {
          const tempInput = document.createElement('input');
          tempInput.value = text;
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          document.body.removeChild(tempInput);
          alert('Link copiado.');
          return;
        }

        navigator.clipboard.writeText(text)
          .then(function() {
            const msg = document.createElement('div');
            msg.textContent = 'Link copiado!';
            msg.style.position = 'fixed';
            msg.style.bottom = '16px';
            msg.style.right = '16px';
            msg.style.background = '#0ea5e9';
            msg.style.color = 'white';
            msg.style.padding = '8px 14px';
            msg.style.borderRadius = '999px';
            msg.style.fontSize = '13px';
            msg.style.boxShadow = '0 4px 12px rgba(15,23,42,0.25)';
            document.body.appendChild(msg);
            setTimeout(function(){ document.body.removeChild(msg); }, 1800);
          })
          .catch(function() {
            alert('Não foi possível copiar o link. Copie manualmente.');
          });
      }
    </script>
  `;

  res.send(
    layout(
      "Links Indicador",
      content,
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
            <h2>${prod.nome} – Cód. ${prod.codigo || ""}</h2>
            <p class="muted">${prod.descricao || ""}</p>
            <p class="muted">
              Crédito: <strong>${prod.credito || "-"}</strong> · Prazo: <strong>${prod.prazo || "-"}</strong><br>
              1ª parcela: <strong>${prod.primeira_parcela || "-"}</strong> · Demais parcelas: <strong>${prod.demais_parcelas || "-"}</strong>
            </p>
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

// Atualização de status com histórico e proteção de comissão duplicada
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
