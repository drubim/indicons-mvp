// =============================================================
// INDICONS – Sistema completo + SQLite + WhatsApp + IA + PWA
// =============================================================
require("dotenv").config();

const express = require("express");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();
const axios = require("axios");

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
      descricao TEXT,
      codigo TEXT,
      credito_referencia TEXT
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

  // Seed com os planos reais de AUTOS (tabela enviada)
  db.get("SELECT COUNT(*) AS c FROM produtos", (err, row) => {
    if (row && row.c === 0) {
      const planosAutos = [
        { produto: "Autos", codigo: "8749", credito: "R$ 180.000,00", prazo: "100 meses", primeira: "R$ 5.706,00", demais: "R$ 2.106,00" },
        { produto: "Autos", codigo: "8749", credito: "R$ 180.000,00", prazo: "90 meses",  primeira: "R$ 5.920,00", demais: "R$ 2.320,00" },

        { produto: "Autos", codigo: "8748", credito: "R$ 170.000,00", prazo: "100 meses", primeira: "R$ 5.389,00", demais: "R$ 1.989,00" },
        { produto: "Autos", codigo: "8748", credito: "R$ 170.000,00", prazo: "90 meses",  primeira: "R$ 5.591,11", demais: "R$ 2.191,11" },

        { produto: "Autos", codigo: "8747", credito: "R$ 160.000,00", prazo: "100 meses", primeira: "R$ 5.072,00", demais: "R$ 1.872,00" },
        { produto: "Autos", codigo: "8747", credito: "R$ 160.000,00", prazo: "90 meses",  primeira: "R$ 5.262,22", demais: "R$ 2.062,22" },

        { produto: "Autos", codigo: "8746", credito: "R$ 150.000,00", prazo: "100 meses", primeira: "R$ 4.755,00", demais: "R$ 1.755,00" },
        { produto: "Autos", codigo: "8746", credito: "R$ 150.000,00", prazo: "90 meses",  primeira: "R$ 4.933,33", demais: "R$ 1.933,33" },

        { produto: "Autos", codigo: "8745", credito: "R$ 140.000,00", prazo: "100 meses", primeira: "R$ 4.438,00", demais: "R$ 1.638,00" },
        { produto: "Autos", codigo: "8745", credito: "R$ 140.000,00", prazo: "90 meses",  primeira: "R$ 4.604,44", demais: "R$ 1.804,44" },

        { produto: "Autos", codigo: "8744", credito: "R$ 130.000,00", prazo: "100 meses", primeira: "R$ 4.121,00", demais: "R$ 1.521,00" },
        { produto: "Autos", codigo: "8744", credito: "R$ 130.000,00", prazo: "90 meses",  primeira: "R$ 4.275,56", demais: "R$ 1.675,56" },

        { produto: "Autos", codigo: "8743", credito: "R$ 120.000,00", prazo: "100 meses", primeira: "R$ 3.804,00", demais: "R$ 1.404,00" },
        { produto: "Autos", codigo: "8743", credito: "R$ 120.000,00", prazo: "90 meses",  primeira: "R$ 3.946,67", demais: "R$ 1.546,67" },

        { produto: "Autos", codigo: "8742", credito: "R$ 110.000,00", prazo: "100 meses", primeira: "R$ 3.487,00", demais: "R$ 1.287,00" },
        { produto: "Autos", codigo: "8742", credito: "R$ 110.000,00", prazo: "90 meses",  primeira: "R$ 3.617,78", demais: "R$ 1.417,78" },

        { produto: "Autos", codigo: "8741", credito: "R$ 100.000,00", prazo: "100 meses", primeira: "R$ 3.170,00", demais: "R$ 1.170,00" },
        { produto: "Autos", codigo: "8741", credito: "R$ 100.000,00", prazo: "90 meses",  primeira: "R$ 3.288,89", demais: "R$ 1.288,89" },

        { produto: "Autos", codigo: "8739", credito: "R$ 90.000,00", prazo: "100 meses", primeira: "R$ 2.853,00", demais: "R$ 1.053,00" },
        { produto: "Autos", codigo: "8739", credito: "R$ 90.000,00", prazo: "90 meses",  primeira: "R$ 2.960,00", demais: "R$ 1.160,00" },

        { produto: "Autos", codigo: "8738", credito: "R$ 85.000,00", prazo: "100 meses", primeira: "R$ 2.694,50", demais: "R$ 994,50" },
        { produto: "Autos", codigo: "8738", credito: "R$ 85.000,00", prazo: "90 meses",  primeira: "R$ 2.795,56", demais: "R$ 1.095,56" },

        { produto: "Autos", codigo: "8737", credito: "R$ 80.000,00", prazo: "100 meses", primeira: "R$ 2.536,00", demais: "R$ 936,00" },
        { produto: "Autos", codigo: "8737", credito: "R$ 80.000,00", prazo: "90 meses",  primeira: "R$ 2.631,11", demais: "R$ 1.031,11" },

        { produto: "Autos", codigo: "8736", credito: "R$ 75.000,00", prazo: "100 meses", primeira: "R$ 2.377,50", demais: "R$ 877,50" },
        { produto: "Autos", codigo: "8736", credito: "R$ 75.000,00", prazo: "90 meses",  primeira: "R$ 2.466,67", demais: "R$ 966,67" },

        { produto: "Autos", codigo: "8735", credito: "R$ 70.000,00", prazo: "100 meses", primeira: "R$ 2.219,00", demais: "R$ 819,00" },
        { produto: "Autos", codigo: "8735", credito: "R$ 70.000,00", prazo: "90 meses",  primeira: "R$ 2.302,22", demais: "R$ 902,22" },

        { produto: "Autos", codigo: "8734", credito: "R$ 65.000,00", prazo: "100 meses", primeira: "R$ 2.060,50", demais: "R$ 760,50" },
        { produto: "Autos", codigo: "8734", credito: "R$ 65.000,00", prazo: "90 meses",  primeira: "R$ 2.137,78", demais: "R$ 837,78" },

        { produto: "Autos", codigo: "8733", credito: "R$ 60.000,00", prazo: "100 meses", primeira: "R$ 1.902,00", demais: "R$ 702,00" },
        { produto: "Autos", codigo: "8733", credito: "R$ 60.000,00", prazo: "90 meses",  primeira: "R$ 1.973,33", demais: "R$ 773,33" },

        { produto: "Autos", codigo: "8732", credito: "R$ 55.000,00", prazo: "100 meses", primeira: "R$ 1.743,50", demais: "R$ 643,50" },
        { produto: "Autos", codigo: "8732", credito: "R$ 55.000,00", prazo: "90 meses",  primeira: "R$ 1.808,89", demais: "R$ 708,89" },

        { produto: "Autos", codigo: "8731", credito: "R$ 50.000,00", prazo: "100 meses", primeira: "R$ 1.585,00", demais: "R$ 585,00" },
        { produto: "Autos", codigo: "8731", credito: "R$ 50.000,00", prazo: "90 meses",  primeira: "R$ 1.644,44", demais: "R$ 644,44" },

        { produto: "Autos", codigo: "8730", credito: "R$ 45.000,00", prazo: "100 meses", primeira: "R$ 1.426,50", demais: "R$ 526,50" },
        { produto: "Autos", codigo: "8730", credito: "R$ 45.000,00", prazo: "90 meses",  primeira: "R$ 1.480,00", demais: "R$ 580,00" },
      ];

      planosAutos.forEach((p) => {
        const nome = `${p.produto} ${p.codigo} – ${p.prazo}`;
        const detalhes = `${p.credito} · 1ª Parcela ${p.primeira} · Demais ${p.demais}`;
        db.run(
          `INSERT INTO produtos (nome, descricao, codigo, credito_referencia) VALUES (?,?,?,?)`,
          [nome, null, p.codigo, detalhes]
        );
      });
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
// SERVIÇO DE WHATSAPP (Cloud API ou outro provedor)
// -------------------------------------------------------------
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;   // ex: https://graph.facebook.com/v20.0
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const PARCEIRO_TELEFONE = process.env.PARCEIRO_TELEFONE || ""; // telefone do parceiro para notificação

async function sendWhatsAppMessage(phone, message) {
  if (!WHATSAPP_API_URL || !WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    console.log("[DEBUG] WhatsApp não configurado. Mensagem não enviada:", phone, message);
    return;
  }

  try {
    await axios.post(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error(
      "Erro ao enviar WhatsApp:",
      error.response?.data || error.message
    );
  }
}

async function notifyCustomerPreAdesao(phone, nome) {
  const msg = `Olá ${nome}, recebemos sua pré-adesão do consórcio. Um especialista entrará em contato em até 60 minutos.`;
  return sendWhatsAppMessage(phone, msg);
}

async function notifyPartnerNewLead(partnerPhone, preVendaId) {
  if (!partnerPhone) {
    console.log("[DEBUG] Telefone do parceiro não configurado. Notificação não enviada.");
    return;
  }
  const msg = `Nova pré-venda recebida no INDICONS. ID da pré-venda: ${preVendaId}. Acesse o painel do parceiro para atender.`;
  return sendWhatsAppMessage(partnerPhone, msg);
}

async function sendFollowUpLead(phone, nome) {
  const msg = `Olá ${nome}, vimos que sua pré-adesão ainda está em aberto. Tem alguma dúvida ou gostaria de seguir com a contratação?`;
  return sendWhatsAppMessage(phone, msg);
}

// -------------------------------------------------------------
// SERVIÇO DE IA – ATENDIMENTO (SITE / WHATSAPP)
// -------------------------------------------------------------
async function askAI(message, context = []) {
  // Integre aqui com a IA real (OpenAI, etc.)
  return `IA (simulado): você perguntou "${message}". Em produção, aqui você conecta na API de IA.`;
}

// -------------------------------------------------------------
// LAYOUT GLOBAL + BOOTSTRAP + PWA
// -------------------------------------------------------------
function layout(title, content, userNav = "") {
  return `
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="manifest" href="/manifest.json" />

  <!-- Bootstrap CSS -->
  <link
    href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
    rel="stylesheet"
  />

  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/service-worker.js')
          .then(function() { console.log('Service worker registrado'); })
          .catch(function(err) { console.error('Erro SW:', err); });
      });
    }
  </script>

  <style>
    body { background:#f1f5f9; margin:0; font-family: Arial, system-ui; color:#1e293b; }

    header {
      background:#ffffff;
      border-bottom:1px solid #cbd5e1;
      position:sticky; top:0;
      z-index:10;
    }

    .header-inner {
      max-width:1100px;
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

    main { max-width:1100px; margin:auto; padding:18px; }

    .card {
      background:#ffffff;
      border:1px solid #cbd5e1;
      border-radius:14px;
      padding:22px;
      margin-bottom:18px;
      box-shadow:0 4px 12px rgba(0,0,0,0.05);
    }

    .btn {
      background:#0ea5e9; color:white;
      padding:10px 18px; border-radius:999px;
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
      <a href="/indicador/login">Indicador</a>
      <a href="/parceiro/login">Parceiro</a>
      <a href="/admin/login">Admin</a>
    </nav>

    <div style="font-size:12px;">${userNav}</div>
  </div>
</header>

<main>${content}</main>

<!-- Bootstrap JS -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
`;
}

// -------------------------------------------------------------
// MANIFEST + SERVICE WORKER (PWA BÁSICO)
// -------------------------------------------------------------
app.get("/manifest.json", (req, res) => {
  res.json({
    name: "INDICONS",
    short_name: "INDICONS",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0ea5e9",
    icons: [],
  });
});

app.get("/service-worker.js", (req, res) => {
  res.set("Content-Type", "application/javascript");
  res.send(`
self.addEventListener('install', function(event) {
  console.log('Service worker instalado.');
});
self.addEventListener('fetch', function(event) {
  // Cache básico poderia ser implementado aqui
});
  `);
});

// =============================================================
// HOME = TELA "SEJA INDICADOR"
// =============================================================
app.get("/", (req, res) => {
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
    }
    .lp-cta-main:hover {
      background:#0369a1;
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
  `;

  res.send(layout("Home – INDICONS", content));
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
        <form method="POST">
          <label>Nome</label><input required name="nome">
          <label>Email</label><input required type="email" name="email">
          <label>Senha</label><input required type="password" name="senha">
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
    res.send("Erro ao cadastrar (email já existe).");
  }
});

app.get("/indicador/login", (req, res) => {
  res.send(
    layout(
      "Login Indicador",
      `
      <div class="card">
        <h2>Login do Indicador</h2>
        <form method="POST">
          <label>Email</label><input name="email">
          <label>Senha</label><input type="password" name="senha">
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
  if (!ind) return res.send("Login inválido");

  req.session.indicadorId = ind.id;
  req.session.indicadorNome = ind.nome;
  res.redirect("/indicador/dashboard");
});

// =============================================================
// INDICADOR – DASHBOARD
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
  const totalAprovadas = pre.filter(v => v.status === "APROVADA").length;
  const valorVendasAprovadas = pre
    .filter(v => v.status === "APROVADA" && v.valor_venda)
    .reduce((s, v) => s + Number(v.valor_venda || 0), 0);
  const totalComissao = coms.reduce(
    (s, c) => s + Number(c.valor_comissao || 0),
    0
  );

  function countStatus(st) {
    return pre.filter(v => v.status === st).length;
  }
  const statusPreAdesao   = countStatus("PRE_ADESAO");
  const statusEmAtend     = countStatus("EM_ATENDIMENTO");
  const statusBoleto      = countStatus("BOLETO_EMITIDO");
  const statusAprovada    = countStatus("APROVADA");
  const statusNaoFechou   = countStatus("NAO_FECHOU");

  const content = `
    <div class="card">
      <h2>Painel comercial – ${req.session.indicadorNome}</h2>
      <p class="muted">Resumo das suas indicações, vendas e comissões.</p>
      <a href="/indicador/links" class="btn" style="margin-top:8px;">Ver meus links de indicação</a>
    </div>

    <div class="card">
      <h3>Resumo rápido</h3>
      <div class="grid">
        <div class="card">
          <strong>Total de pré-vendas</strong>
          <p style="font-size:24px; margin:6px 0;">${totalPre}</p>
          <p class="muted">Clientes que chegaram pelos seus links.</p>
        </div>
        <div class="card">
          <strong>Vendas aprovadas</strong>
          <p style="font-size:24px; margin:6px 0;">${totalAprovadas}</p>
          <p class="muted">Pré-vendas que viraram contrato.</p>
        </div>
        <div class="card">
          <strong>Valor vendido (aprovadas)</strong>
          <p style="font-size:24px; margin:6px 0;">R$ ${valorVendasAprovadas.toFixed(2)}</p>
          <p class="muted">Somente vendas com status "APROVADA".</p>
        </div>
        <div class="card">
          <strong>Comissões acumuladas</strong>
          <p style="font-size:24px; margin:6px 0;">R$ ${totalComissao.toFixed(2)}</p>
          <p class="muted">Baseado em registros de comissão.</p>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>Funil de atendimento das suas indicações</h3>
      <p class="muted">Visualização por status de cada pré-venda.</p>
      <div style="max-width:520px; margin-top:10px;">
        <canvas id="indicadorChart" height="180"></canvas>
      </div>
    </div>

    <div class="card">
      <h3>Minhas pré-vendas (detalhado)</h3>
      ${
        pre.length === 0
          ? `<p class="muted">Nenhuma pré-venda ainda.</p>`
          : pre
              .map(
                (v) => `
        <div class="card" style="margin-top:8px;">
          <strong>${v.nome_cliente}</strong> – ${v.produto_nome}<br>
          <span class="muted">Status: ${v.status}</span><br>
          <span class="muted">Contato: ${v.telefone_cliente} · ${v.email_cliente}</span><br>
          ${
            v.valor_venda
              ? `<span class="muted">Valor da venda: R$ ${Number(v.valor_venda).toFixed(2)}</span>`
              : ""
          }
        </div>`
              )
              .join("")
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
              label: 'Pré-vendas',
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
// INDICADOR – LINKS (tabela + copiar link)
// =============================================================
app.get("/indicador/links", requireIndicador, async (req, res) => {
  const produtos = await dbAll("SELECT * FROM produtos");
  const base = process.env.BASE_URL || "https://indicons.onrender.com";

  const content = `
    <div class="card">
      <h2>Produtos de consórcio para indicação</h2>
      <p class="muted">
        Use a tabela abaixo para gerar e copiar os links de indicação. Cada linha representa um plano/valor
        da administradora. Clique em <strong>Copiar link</strong> ao lado do plano que deseja enviar.
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
              <th>Cód.</th>
              <th>Produto / Plano</th>
              <th>Crédito / Detalhes</th>
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
                    <td>${p.codigo || "-"}</td>
                    <td>${p.nome}</td>
                    <td>${p.credito_referencia || p.descricao || "-"}</td>
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

  if (!ind || !prod) return res.send("Link inválido.");

  res.send(
    layout(
      "Pré-adesão",
      `
      <div class="card">
        <h2>${prod.nome}</h2>
        ${
          prod.codigo || prod.credito_referencia
            ? `<p class="muted">Código: <strong>${prod.codigo || "-"}</strong> · ${prod.credito_referencia || ""}</p>`
            : ""
        }
        <p>Indicação de <strong>${ind.nome}</strong></p>

        <form method="POST" action="/consorcio">
          <input type="hidden" name="indicador_id" value="${ind.id}">
          <input type="hidden" name="produto_id" value="${prod.id}">

          <label>Nome completo</label><input name="nome" required>
          <label>Telefone / WhatsApp</label><input name="telefone" required>
          <label>E-mail</label><input name="email" type="email" required>

          <button class="btn" style="margin-top:12px;">Confirmar pré-adesão</button>
        </form>

        <p class="muted" style="margin-top:8px;">Um parceiro autorizado entrará em contato para finalizar a venda.</p>
      </div>
      `
    )
  );
});

app.post("/consorcio", async (req, res) => {
  const { indicador_id, produto_id, nome, telefone, email } = req.body;

  const result = await dbRun(
    `INSERT INTO pre_vendas (indicador_id,produto_id,nome_cliente,telefone_cliente,email_cliente)
     VALUES (?,?,?,?,?)`,
    [indicador_id, produto_id, nome, telefone, email]
  );
  const preVendaId = result.lastID;

  // Enviar mensagem automática pós pré-adesão para o cliente
  await notifyCustomerPreAdesao(telefone, nome);

  // Notificar parceiro sobre nova pré-venda (se telefone configurado)
  await notifyPartnerNewLead(PARCEIRO_TELEFONE, preVendaId);

  res.send(
    layout(
      "Pré-adesão enviada",
      `<div class="card"><h2>Pré-adesão registrada!</h2><p>O parceiro entrará em contato em breve.</p></div>`
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
      <div class="card">
        <h2>Pré-vendas para atendimento</h2>
      </div>
      ${
        pv.length === 0
          ? `<div class="card"><p class="muted">Nenhuma pré-venda ainda.</p></div>`
          : pv
              .map(
                (v) => `
      <div class="card">
        <h3>${v.nome_cliente}</h3>
        <p class="muted">${v.produto_nome}</p>
        <p class="muted">Indicador: ${v.indicador_nome}</p>
        <p class="muted">Contato: ${v.telefone_cliente} · ${v.email_cliente}</p>

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

          <button class="btn" style="margin-top:8px;">Atualizar</button>
        </form>
      </div>`
              )
              .join("")
      }
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
    if (pv) {
      await dbRun(
        `INSERT INTO comissoes (indicador_id,pre_venda_id,valor_venda,valor_comissao)
         VALUES (?,?,?,?)`,
        [pv.indicador_id, pv.id, valor_venda, valor_venda * 0.05]
      );
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
  res.send("Login inválido");
});

app.get("/admin/dashboard", requireAdmin, async (req, res) => {
  const coms = await dbAll(
    `SELECT c.*, i.nome AS indicador_nome
     FROM comissoes c
     JOIN indicadores i ON i.id=c.indicador_id
     ORDER BY c.id DESC`
  );

  const content = `
      <div class="card">
        <h2>Comissões</h2>
        ${
          coms.length === 0
            ? "<p class='muted'>Nenhuma comissão registrada ainda.</p>"
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

      <div class="card">
        <h3>Follow-up organizado</h3>
        <p class="muted">
          Clique no botão abaixo para enviar mensagens de follow-up para todas as pré-vendas
          em status <strong>PRE_ADESAO</strong> ou <strong>EM_ATENDIMENTO</strong>.
          O envio usa a integração de WhatsApp configurada.
        </p>
        <form method="POST" action="/admin/disparar-followup">
          <button class="btn">Disparar follow-up para pré-vendas abertas</button>
        </form>
      </div>
  `;

  res.send(
    layout(
      "Dashboard Admin",
      content,
      `Admin: ${req.session.adminNome} | <a href="/logout">Sair</a>`
    )
  );
});

// Follow-up organizado (não massa indiscriminado, só abertas)
app.post("/admin/disparar-followup", requireAdmin, async (req, res) => {
  const abertas = await dbAll(
    `SELECT * FROM pre_vendas
     WHERE status IN ('PRE_ADESAO','EM_ATENDIMENTO')`
  );

  for (const pv of abertas) {
    await sendFollowUpLead(pv.telefone_cliente, pv.nome_cliente);
  }

  res.send(
    layout(
      "Follow-up disparado",
      `<div class="card"><h2>Follow-up enviado para ${abertas.length} pré-vendas abertas.</h2></div>`,
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
// IA – ENDPOINTS (SITE / WHATSAPP)
// =============================================================
app.post("/api/chat/site", async (req, res) => {
  const { mensagem, contexto } = req.body;
  const answer = await askAI(mensagem || "", contexto || []);
  res.json({ resposta: answer });
});

app.post("/api/chat/whatsapp-webhook", async (req, res) => {
  console.log("[DEBUG] Webhook WhatsApp IA recebido:", req.body);
  // Aqui você poderia:
  // 1. Ler a mensagem vinda do WhatsApp
  // 2. Chamar askAI(...)
  // 3. Responder com sendWhatsAppMessage(...)
  res.sendStatus(200);
});

// =============================================================
// ENDPOINTS DEMO (mantidos)
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
  console.log("Simulando envio de WhatsApp para:", telefone, "mensagem:", mensagem);
  res.json({
    ok: true,
    detalhe:
      "Envio de WhatsApp simulado. Em produção, aqui entra a integração com um provedor (Cloud API, Z-API, etc.).",
  });
});

// =============================================================
// INICIAR SERVIDOR
// =============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("INDICONS rodando na porta " + PORT));
