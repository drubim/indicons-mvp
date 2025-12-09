// =============================================================
// INDICONS – Sistema completo + SQLite + Layout Médio + WhatsApp + IA + PWA
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
// CONFIG – COMISSÃO
// -----------------------------------------------
const COMMISSION_RATE = 0.015; // até 1,5% (total)

// esquema descritivo de parcelas (não armazenado em tabela, apenas informativo)
const COMMISSION_SCHEME = [
  0.005, // 0,50%
  0.002, // 0,20%
  0.002, // 0,20%
  0.002, // 0,20%
  0.002, // 0,20%
  0.002, // 0,20%
];

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

  // Seed planos AUTOS
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
// WHATSAPP
// -------------------------------------------------------------
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const PARCEIRO_TELEFONE = process.env.PARCEIRO_TELEFONE || "";

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
  const msg = `Olá ${nome}, recebemos sua pré-adesão de consórcio pelo INDICONS. Um especialista entrará em contato em até 60 minutos.`;
  return sendWhatsAppMessage(phone, msg);
}

async function notifyPartnerNewLead(partnerPhone, preVendaId) {
  if (!partnerPhone) {
    console.log("[DEBUG] Telefone do parceiro não configurado. Notificação não enviada.");
    return;
  }
  const msg = `Nova pré-venda recebida no INDICONS. ID: ${preVendaId}. Acesse o painel do parceiro para atender.`;
  return sendWhatsAppMessage(partnerPhone, msg);
}

async function sendFollowUpLead(phone, nome) {
  const msg = `Olá ${nome}, vimos que sua pré-adesão de consórcio ainda está em aberto. Posso ajudar com alguma dúvida para seguir com a contratação?`;
  return sendWhatsAppMessage(phone, msg);
}

// -------------------------------------------------------------
// IA – STUB
// -------------------------------------------------------------
async function askAI(message, context = []) {
  return `IA (simulado): você perguntou "${message}". Em produção, aqui entra a integração com o provedor de IA.`;
}

// -------------------------------------------------------------
// LAYOUT GLOBAL – TEMA INTERMEDIÁRIO + FOOTER + CONTATO
// -------------------------------------------------------------
function layout(title, content, userNav = "") {
  return `
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <link
    href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
    rel="stylesheet"
  />

  <style>
    :root {
      --bg-body: #e2e8f0;            /* mais escuro que antes */
      --bg-main: #e5e7eb;
      --header-bg: rgba(248,250,252,0.96);
      --header-border: #cbd5e1;
      --card-bg: #f9fafb;
      --card-border: #d4d4d8;
      --card-shadow: 0 8px 24px rgba(15,23,42,0.12);
      --text-main: #0f172a;
      --text-muted: #64748b;
      --accent: #16a34a;
      --accent-soft: #dcfce7;
      --accent-strong: #15803d;
      --accent-alt: #0ea5e9;
      --danger: #ef4444;
      --danger-soft: #fee2e2;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--text-main);
      background:
        radial-gradient(circle at top left, rgba(56,189,248,0.18) 0, transparent 55%),
        radial-gradient(circle at bottom right, rgba(34,197,94,0.18) 0, transparent 55%),
        var(--bg-body);
    }

    a { color: inherit; }

    header {
      position: sticky;
      top: 0;
      z-index: 20;
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      background: var(--header-bg);
      border-bottom: 1px solid var(--header-border);
    }

    .header-inner {
      max-width: 1120px;
      margin: 0 auto;
      padding: 10px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #0f172a;
    }

    .logo-mark {
      width: 34px;
      height: 34px;
      border-radius: 999px;
      background:
        radial-gradient(circle at 30% 0, #16a34a, transparent 60%),
        radial-gradient(circle at 80% 100%, #0ea5e9, transparent 60%),
        #ffffff;
      border: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #0f172a;
      font-size: 18px;
      font-weight: 800;
      box-shadow: 0 4px 10px rgba(15,23,42,0.12);
    }

    nav {
      display:flex;
      align-items:center;
      gap:4px;
      flex-wrap:wrap;
    }
    nav a {
      text-decoration: none;
      color: #0f172a;
      font-weight: 500;
      font-size: 13px;
      padding: 6px 10px;
      border-radius: 999px;
      border: 1px solid transparent;
      transition: all 0.18s ease-out;
    }
    nav a:hover {
      color: #0f172a;
      border-color: #e2e8f0;
      background: #f3f4f6;
    }
    .nav-contact {
      border-color:#16a34a;
      background:#ecfdf5;
      color:#166534;
      font-weight:600;
    }
    .nav-contact:hover {
      background:#bbf7d0;
    }

    main {
      max-width: 1120px;
      margin: 0 auto;
      padding: 20px 18px 32px;
    }

    .card {
      background: var(--card-bg);
      border-radius: 16px;
      padding: 18px 18px;
      margin-bottom: 18px;
      border: 1px solid var(--card-border);
      box-shadow: var(--card-shadow);
    }

    /* Cartões menores para login/cadastro */
    .auth-card {
      max-width: 420px;
      margin: 0 auto 18px;
      padding: 18px 16px;
    }

    .card h1,
    .card h2,
    .card h3 {
      margin-top: 0;
      color: #0f172a;
    }

    .btn {
      background: var(--accent);
      color: #ffffff;
      padding: 9px 18px;
      border-radius: 999px;
      border: none;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.18s ease-out;
      box-shadow: 0 8px 20px rgba(22,163,74,0.35);
    }
    .btn:hover {
      background: var(--accent-strong);
      transform: translateY(-1px);
      box-shadow: 0 10px 26px rgba(22,163,74,0.45);
    }

    .btn-secondary {
      background: #f9fafb;
      color: #0f172a;
      border: 1px solid #cbd5e1;
      box-shadow: 0 4px 14px rgba(15,23,42,0.10);
    }
    .btn-secondary:hover {
      background: #e5e7eb;
      border-color: var(--accent-alt);
    }

    .badge-status {
      display:inline-flex;
      align-items:center;
      gap:5px;
      border-radius:999px;
      padding:3px 9px;
      font-size:11px;
      border:1px solid #e2e8f0;
      background:#f8fafc;
      color:#0f172a;
    }
    .badge-status-dot {
      width:7px;
      height:7px;
      border-radius:999px;
      background:#9ca3af;
    }
    .badge-status--pre { border-color:#bfdbfe; background:#eff6ff; color:#1d4ed8; }
    .badge-status--pre .badge-status-dot { background:#3b82f6; }
    .badge-status--atend { border-color:#e9d5ff; background:#f5f3ff; color:#7c2d12; }
    .badge-status--atend .badge-status-dot { background:#a855f7; }
    .badge-status--boleto { border-color:#fed7aa; background:#fffbeb; color:#9a3412; }
    .badge-status--boleto .badge-status-dot { background:#f97316; }
    .badge-status--ok { border-color:#bbf7d0; background:#ecfdf5; color:#166534; }
    .badge-status--ok .badge-status-dot { background:#22c55e; }
    .badge-status--lost { border-color:#fecaca; background:#fef2f2; color:#b91c1c; }
    .badge-status--lost .badge-status-dot { background:#ef4444; }

    .muted { color: var(--text-muted); }

    input,
    select,
    textarea {
      width: 100%;
      padding: 9px 10px;
      margin-top: 5px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      font-size: 14px;
      background: #f9fafb;
      color: #0f172a;
      outline: none;
      transition: all 0.18s ease-out;
    }
    input:focus,
    select:focus,
    textarea:focus {
      border-color: var(--accent-alt);
      box-shadow: 0 0 0 1px rgba(56,189,248,0.4);
      background:#ffffff;
    }

    textarea { min-height: 70px; }
    form label { font-weight: 500; margin-top: 10px; display: block; color: #0f172a; }

    .grid {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    }

    .table-wrapper {
      overflow-x: auto;
      margin-top: 8px;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      min-width: 720px;
      color: #0f172a;
      background:#f9fafb;
    }
    table.data-table th,
    table.data-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #e5e7eb;
      text-align: left;
      vertical-align: top;
    }
    table.data-table thead th {
      background: #e5e7eb;
      font-size: 11px;
      font-weight: 600;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    table.data-table tbody tr:nth-child(even) {
      background: #f3f4f6;
    }
    table.data-table tbody tr:hover {
      background: #dbeafe;
    }

    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 11px;
      background: #111827;
      padding: 3px 6px;
      border-radius: 4px;
      border: 1px solid #1f2937;
      color: #e5e7eb;
    }

    /* Footer */
    .site-footer {
      border-top:1px solid #cbd5e1;
      background:#111827;
      color:#9ca3af;
    }
    .site-footer-inner {
      max-width:1120px;
      margin:0 auto;
      padding:10px 18px 16px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      flex-wrap:wrap;
      font-size:11px;
    }
    .footer-left { display:flex; flex-direction:column; gap:2px; }
    .footer-right { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .footer-contact-btn {
      padding:4px 10px;
      border-radius:999px;
      border:1px solid #16a34a;
      background:#064e3b;
      color:#bbf7d0;
      font-size:11px;
      text-decoration:none;
      font-weight:500;
    }
    .footer-contact-btn:hover {
      background:#16a34a;
      color:#f9fafb;
    }

    @media (max-width: 640px) {
      .header-inner {
        flex-wrap: wrap;
        justify-content: center;
      }
      nav {
        justify-content: center;
      }
      main {
        padding: 16px 14px 28px;
      }
      .card {
        padding: 16px 14px;
      }
      .site-footer-inner {
        align-items:flex-start;
      }
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
      <a href="/contato" class="nav-contact">Contato</a>
    </nav>

    <div style="font-size:11px; color:#64748b;">${userNav}</div>
  </div>
</header>

<main>${content}</main>

<footer class="site-footer">
  <div class="site-footer-inner">
    <div class="footer-left">
      <div>© 2025 Dhealth Ltda — CNPJ 56.952.650/0001-91</div>
      <div>Plataforma de indicações de consórcio com parceiros homologados.</div>
    </div>
    <div class="footer-right">
      <span>Comissões de até 1,5% pagas em até 6 parcelas, conforme contrato de parceria.</span>
      <a href="/contato" class="footer-contact-btn">Falar com um especialista</a>
    </div>
  </div>
</footer>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
`;
}

// -------------------------------------------------------------
// PWA BÁSICO
// -------------------------------------------------------------
app.get("/manifest.json", (req, res) => {
  res.json({
    name: "INDICONS",
    short_name: "INDICONS",
    start_url: "/",
    display: "standalone",
    background_color: "#111827",
    theme_color: "#16a34a",
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
// HOME – LANDING PAGE
// =============================================================
app.get("/", (req, res) => {
  const content = `
  <style>
    .lp-hero {
      background:
        radial-gradient(circle at top left, rgba(56,189,248,0.28), transparent 60%),
        radial-gradient(circle at bottom right, rgba(34,197,94,0.25), transparent 55%),
        #111827;
      border-radius: 22px;
      padding: 32px 24px;
      display: grid;
      grid-template-columns: minmax(0, 2.1fr) minmax(0, 1.7fr);
      gap: 26px;
      align-items: center;
      border: 1px solid #1f2937;
      box-shadow: 0 20px 50px rgba(0,0,0,0.45);
      color:#e5e7eb;
    }
    @media (max-width: 900px) {
      .lp-hero {
        grid-template-columns: 1fr;
      }
    }
    .lp-hero-title {
      font-size: 32px;
      line-height: 1.15;
      font-weight: 800;
      color: #f9fafb;
      margin-bottom: 10px;
    }
    .lp-hero-sub {
      font-size: 15px;
      color: #cbd5f5;
      margin-bottom: 16px;
    }
    .lp-hero-sub strong {
      color: #4ade80;
    }
    .lp-hero-badge {
      display:inline-flex;
      align-items:center;
      gap:8px;
      padding:5px 12px;
      border-radius:999px;
      background: #065f46;
      color:#bbf7d0;
      font-size:11px;
      font-weight:600;
      margin-bottom:10px;
      border: 1px solid #16a34a;
    }
    .lp-hero-badge::before {
      content: "●";
      font-size: 13px;
      color: #22c55e;
    }

    .lp-hero-metrics {
      display:flex;
      gap:12px;
      flex-wrap:wrap;
      margin-top:14px;
    }
    .lp-hero-metric {
      border-radius:14px;
      padding:10px 12px;
      background:#020617;
      border:1px solid #1f2937;
      min-width:130px;
    }
    .lp-hero-metric strong {
      display:block;
      font-size:18px;
      color:#f9fafb;
    }
    .lp-hero-metric span {
      display:block;
      font-size:11px;
      color:#9ca3af;
    }

    .lp-hero-img-wrapper {
      border-radius: 18px;
      overflow: hidden;
      position: relative;
      background:#020617;
      border: 1px solid #1f2937;
      box-shadow: 0 18px 40px rgba(0,0,0,0.75);
    }
    .lp-hero-img {
      width: 100%;
      display: block;
      object-fit: cover;
      max-height: 300px;
      filter: saturate(1.02) contrast(1.06);
    }
    .lp-hero-tag {
      position:absolute;
      bottom:10px;
      left:10px;
      background:rgba(15,23,42,0.95);
      color:#e5e7eb;
      padding:6px 10px;
      border-radius:999px;
      font-size:11px;
      border: 1px solid rgba(55,65,81,0.9);
    }

    .lp-cta-main {
      display:inline-flex;
      align-items:center;
      gap:8px;
      background:#22c55e;
      color:#022c22;
      padding:11px 22px;
      border-radius:999px;
      font-weight:700;
      text-decoration:none;
      font-size:14px;
      box-shadow:0 16px 40px rgba(34,197,94,0.65);
      border: none;
      transition: all .18s ease-out;
    }
    .lp-cta-main:hover {
      background:#15803d;
      color:#f9fafb;
      transform: translateY(-1px);
      box-shadow:0 20px 48px rgba(22,163,74,0.85);
    }
    .lp-cta-note {
      font-size: 12px;
      color:#bfdbfe;
      margin-top:8px;
    }

    .lp-section {
      background: #0f172a;
      border-radius:20px;
      padding:22px 18px;
      margin-top:20px;
      border:1px solid #1f2937;
      box-shadow:0 14px 40px rgba(0,0,0,0.6);
      color:#e5e7eb;
    }
    .lp-section h2 {
      margin-top:0;
      font-size:20px;
      color:#f9fafb;
    }
    .lp-grid {
      display:grid;
      grid-template-columns:repeat(auto-fit,minmax(230px,1fr));
      gap:16px;
      margin-top:14px;
    }
    .lp-card {
      background:#020617;
      border-radius:14px;
      padding:14px 12px;
      border:1px solid #1f2937;
    }
    .lp-card h3 {
      margin-top:0;
      font-size:15px;
      color:#f9fafb;
      margin-bottom:6px;
    }
    .lp-card p {
      margin:0;
      font-size:13px;
      color:#9ca3af;
    }

    .lp-table {
      width:100%;
      border-collapse:collapse;
      margin-top:12px;
      font-size:13px;
      color:#e5e7eb;
      background:#020617;
    }
    .lp-table th, .lp-table td {
      border:1px solid #1f2937;
      padding:8px;
      text-align:center;
    }
    .lp-table th {
      background:#111827;
      color:#9ca3af;
      font-size:11px;
      text-transform:uppercase;
      letter-spacing:.08em;
    }
    .lp-table tbody tr:nth-child(even) {
      background:#020617;
    }

    .lp-trust-strip {
      margin-top:18px;
      display:flex;
      flex-wrap:wrap;
      gap:10px;
      align-items:center;
      font-size:11px;
      color:#9ca3af;
    }
    .lp-trust-pill {
      display:inline-flex;
      align-items:center;
      gap:6px;
      padding:4px 10px;
      border-radius:999px;
      background:#020617;
      border:1px solid #1f2937;
    }
    .lp-trust-pill-icon {
      font-size:13px;
    }
  </style>

  <section class="lp-hero">
    <div>
      <div class="lp-hero-badge">Plataforma de indicação de consórcios</div>
      <h1 class="lp-hero-title">
        Transforme sua rede de contatos<br>em renda recorrente.
      </h1>
      <p class="lp-hero-sub">
        Você só indica. Um parceiro especializado faz todo o atendimento, negocia e fecha a venda.
        Em cada consórcio aprovado, você recebe <strong>comissão de até 1,5%</strong>.
      </p>

      <a href="/indicador/registrar" class="lp-cta-main">
        Começar como Indicador
      </a>
      <div class="lp-cta-note">
        Cadastro gratuito · Sem meta mínima · Acompanhe tudo em um painel profissional
      </div>

      <div class="lp-hero-metrics">
        <div class="lp-hero-metric">
          <strong>até 1,5%</strong>
          <span>comissão máxima sobre vendas aprovadas</span>
        </div>
        <div class="lp-hero-metric">
          <strong>R$ 100 mil</strong>
          <span>podem gerar até R$ 1.500 para você</span>
        </div>
        <div class="lp-hero-metric">
          <strong>100% online</strong>
          <span>links, pré-adesões e painel web</span>
        </div>
      </div>

      <div class="lp-trust-strip">
        <!-- Removido CNPJ e HTTPS daqui, conforme pedido -->
        <div class="lp-trust-pill">
          <span class="lp-trust-pill-icon">✅</span>
          <span>Atuação com administradoras de consórcio reguladas pelo Bacen</span>
        </div>
      </div>
    </div>

    <div class="lp-hero-img-wrapper">
      <img
        class="lp-hero-img"
        src="https://images.pexels.com/photos/1181555/pexels-photo-1181555.jpeg?auto=compress&cs=tinysrgb&w=1200"
        alt="Indicador acompanhando comissões em um dashboard"
      />
      <div class="lp-hero-tag">
        Painel de indicadores com funil e comissões em tempo real
      </div>
    </div>
  </section>

  <section class="lp-section">
    <h2>Como o INDICONS funciona na prática</h2>
    <div class="lp-grid">
      <div class="lp-card">
        <h3>1. Gere seu link</h3>
        <p>Você se cadastra como indicador e escolhe o plano de consórcio. O sistema gera links personalizados prontos para compartilhar.</p>
      </div>
      <div class="lp-card">
        <h3>2. Cliente faz a pré-adesão</h3>
        <p>O cliente preenche um formulário rápido pelo link. Essa pré-venda aparece instantaneamente no seu painel.</p>
      </div>
      <div class="lp-card">
        <h3>3. Parceiro finaliza a venda</h3>
        <p>Um parceiro autorizado faz o atendimento, emite boleto e conclui o contrato diretamente na administradora.</p>
      </div>
      <div class="lp-card">
        <h3>4. Você recebe comissão</h3>
        <p>Ao marcar a venda como aprovada, o sistema calcula automaticamente sua comissão total de até 1,5%, paga em até 6 parcelas.</p>
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
          <th>Comissão (até 1,5%) estimada</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>2 vendas / mês</td><td>R$ 80.000</td><td>R$ 2.400</td></tr>
        <tr><td>4 vendas / mês</td><td>R$ 60.000</td><td>R$ 3.600</td></tr>
        <tr><td>8 vendas / mês</td><td>R$ 50.000</td><td>R$ 6.000</td></tr>
      </tbody>
    </table>
    <p class="muted" style="margin-top:8px; color:#9ca3af;">
      Valores meramente ilustrativos, considerando comissão máxima de 1,5% sobre o valor do contrato.
      A comissão ao indicador é paga em 6 parcelas (0,50% / 0,20% / 0,20% / 0,20% / 0,20% / 0,20%),
      com possibilidade de estorno de 0,35% até a 6ª parcela em caso de inadimplência ou cancelamento do contrato.
    </p>
  </section>
  `;

  res.send(layout("Home – INDICONS", content));
});

// =============================================================
// PÁGINA DE CONTATO
// =============================================================
app.get("/contato", (req, res) => {
  const content = `
    <div class="card auth-card">
      <h2>Contato</h2>
      <p class="muted">
        Fale com a equipe da <strong>Dhealth Ltda</strong> sobre parcerias, dúvidas sobre o INDICONS
        ou suporte à plataforma.
      </p>
      <ul class="muted" style="font-size:13px; padding-left:18px; margin-top:8px;">
        <li>Razão Social: Dhealth Ltda</li>
        <li>CNPJ: 56.952.650/0001-91</li>
      </ul>

      <div style="margin-top:12px; font-size:13px;">
        <p><strong>E-mail:</strong> <a href="mailto:contato@dhealth.com.br">contato@dhealth.com.br</a></p>
        <p><strong>WhatsApp:</strong> <a href="https://wa.me/5500000000000" target="_blank" rel="noopener noreferrer">+55 (00) 00000-0000</a></p>
      </div>

      <p class="muted" style="font-size:12px; margin-top:12px;">
        As informações acima são exemplos. Ajuste e-mails e telefone para os dados oficiais da empresa.
      </p>
    </div>
  `;
  res.send(layout("Contato – INDICONS", content));
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
// INDICADOR – CADASTRO / LOGIN (com LGPD / autorização)
// =============================================================
app.get("/indicador/registrar", (req, res) => {
  res.send(
    layout(
      "Registrar Indicador",
      `
      <div class="card auth-card">
        <h2>Cadastrar Indicador</h2>
        <form method="POST">
          <label>Nome</label><input required name="nome">
          <label>Email</label><input required type="email" name="email">
          <label>Senha</label><input required type="password" name="senha">

          <div style="margin-top:10px; font-size:12px; color:#64748b;">
            <label style="display:flex; align-items:flex-start; gap:6px;">
              <input type="checkbox" name="aceite_termos" required style="margin-top:2px;">
              <span>
                Declaro que li e aceito os termos da plataforma INDICONS/Dhealth Ltda e
                autorizo o contato por telefone, WhatsApp ou e-mail por parte da
                plataforma e das administradoras de consórcio parceiras, para fins de
                análise, oferta e acompanhamento de consórcios, em conformidade com a
                LGPD (Lei nº 13.709/2018) e com a regulamentação do Banco Central do Brasil.
              </span>
            </label>
          </div>

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
      <div class="card auth-card">
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
// INDICADOR – DASHBOARD COM LINHA DO TEMPO + GRÁFICOS
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

  const stageOrder = [
    "PRE_ADESAO",
    "EM_ATENDIMENTO",
    "BOLETO_EMITIDO",
    "APROVADA",
    "NAO_FECHOU"
  ];

  const stageLabels = {
    PRE_ADESAO: "Pré-adesão",
    EM_ATENDIMENTO: "Em atendimento",
    BOLETO_EMITIDO: "Boleto emitido",
    APROVADA: "Venda aprovada",
    NAO_FECHOU: "Não fechou"
  };

  const content = `
    <style>
      .dashboard-hero {
        display:grid;
        grid-template-columns:minmax(0,2.1fr) minmax(0,1.6fr);
        gap:16px;
        align-items:center;
      }
      @media (max-width: 900px) {
        .dashboard-hero {
          grid-template-columns:1fr;
        }
      }
      .dashboard-hero-metrics {
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:10px;
        margin-top:10px;
      }
      @media (max-width:600px){
        .dashboard-hero-metrics {
          grid-template-columns:1fr;
        }
      }
      .metric-card {
        border-radius:12px;
        padding:10px 12px;
        background:#020617;
        border:1px solid #1f2937;
        color:#e5e7eb;
      }
      .metric-label {
        font-size:11px;
        text-transform:uppercase;
        letter-spacing:.08em;
        color:#9ca3af;
      }
      .metric-value {
        font-size:20px;
        font-weight:700;
        margin-top:4px;
        color:#f9fafb;
      }
      .metric-helper {
        font-size:11px;
        color:#9ca3af;
      }

      .hero-img-panel {
        border-radius:18px;
        overflow:hidden;
        position:relative;
        background:#020617;
        border:1px solid #1f2937;
        box-shadow:0 16px 40px rgba(0,0,0,0.7);
      }
      .hero-img {
        width:100%;
        display:block;
        object-fit:cover;
        max-height:240px;
      }
      .hero-img-tag {
        position:absolute;
        bottom:10px;
        left:10px;
        background:rgba(15,23,42,0.95);
        color:#e5e7eb;
        padding:6px 10px;
        border-radius:999px;
        font-size:11px;
        border:1px solid rgba(55,65,81,0.9);
      }

      .timeline-wrapper {
        margin-top: 14px;
        overflow-x: auto;
        padding-bottom: 6px;
      }
      .timeline {
        display: flex;
        align-items: flex-start;
        min-width: 650px;
        position: relative;
        padding: 18px 6px 4px 6px;
      }
      .timeline-step {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
        text-align: center;
        font-size: 12px;
      }
      .timeline-circle {
        width: 36px;
        height: 36px;
        border-radius: 999px;
        border: 3px solid #1f2937;
        background: #020617;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        color: #f9fafb;
        z-index: 2;
      }
      .timeline-label {
        margin-top: 6px;
        font-weight: 600;
        color: #e5e7eb;
      }
      .timeline-caption {
        margin-top: 2px;
        color: #9ca3af;
        font-size: 11px;
        max-width: 160px;
      }

      .timeline-connector {
        position: absolute;
        top: 32px;
        left: 0;
        right: 0;
        height: 3px;
        background: #1f2937;
        z-index: 1;
      }
      .timeline-progress {
        position: absolute;
        top: 32px;
        left: 0;
        height: 3px;
        background: linear-gradient(90deg,#0ea5e9,#22c55e);
        z-index: 1;
        width:100%;
      }

      .stepper-mini {
        display:flex;
        gap:6px;
        margin-top:8px;
        flex-wrap:wrap;
      }
      .stepper-mini-step {
        display:flex;
        align-items:center;
        gap:4px;
        font-size:11px;
        padding:4px 8px;
        border-radius:999px;
        border:1px solid #1f2937;
        background:#020617;
        color:#9ca3af;
      }
      .stepper-mini-step-dot {
        width:8px;
        height:8px;
        border-radius:999px;
        background:#4b5563;
      }
      .stepper-mini-step.done {
        border-color:#16a34a;
        background:#022c22;
        color:#bbf7d0;
      }
      .stepper-mini-step.done .stepper-mini-step-dot {
        background:#22c55e;
      }
      .stepper-mini-step.current {
        border-color:#0ea5e9;
        background:#0b1120;
        color:#e5e7eb;
      }
      .stepper-mini-step.current .stepper-mini-step-dot {
        background:#0ea5e9;
      }
      .stepper-mini-step.lost {
        border-color:#b91c1c;
        background:#450a0a;
        color:#fecaca;
      }
      .stepper-mini-step.lost .stepper-mini-step-dot {
        background:#ef4444;
      }

      .charts-grid {
        display:grid;
        grid-template-columns: minmax(0,2fr) minmax(0,1.3fr);
        gap:14px;
      }
      @media (max-width: 900px) {
        .charts-grid {
          grid-template-columns:1fr;
        }
      }
    </style>

    <div class="card" style="background:#020617; border-color:#1f2937; color:#e5e7eb;">
      <div class="dashboard-hero">
        <div>
          <h2>Painel do Indicador</h2>
          <p class="muted" style="color:#9ca3af;">
            Acompanhe todas as indicações, entenda em que etapa do funil cada cliente está
            e visualize quanto você já gerou de vendas e comissões (até 1,5% por venda).
          </p>
          <a href="/indicador/links" class="btn" style="margin-top:8px;">Ver meus links de indicação</a>

          <div class="dashboard-hero-metrics">
            <div class="metric-card">
              <div class="metric-label">Pré-vendas totais</div>
              <div class="metric-value">${totalPre}</div>
              <div class="metric-helper">Clientes que chegaram pelos seus links</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Vendas aprovadas</div>
              <div class="metric-value">${totalAprovadas}</div>
              <div class="metric-helper">Contratos confirmados</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Valor vendido (aprovadas)</div>
              <div class="metric-value">R$ ${valorVendasAprovadas.toFixed(2)}</div>
              <div class="metric-helper">Somente indicações aprovadas</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Comissões acumuladas</div>
              <div class="metric-value">R$ ${totalComissao.toFixed(2)}</div>
              <div class="metric-helper">
                Baseado em comissão total de até 1,5%, paga em 6 parcelas.
              </div>
            </div>
          </div>

          <p style="margin-top:10px; font-size:11px; color:#9ca3af;">
            Modelo de pagamento da comissão ao indicador:
            6 parcelas sobre o valor da venda (0,50% / 0,20% / 0,20% / 0,20% / 0,20% / 0,20%),
            com possibilidade de estorno de 0,35% até a 6ª parcela em caso de inadimplência
            ou cancelamento do contrato pelo cliente.
          </p>
        </div>

        <div class="hero-img-panel">
          <img
            src="https://images.pexels.com/photos/669610/pexels-photo-669610.jpeg?auto=compress&cs=tinysrgb&w=1200"
            class="hero-img"
            alt="Dashboard de vendas em um notebook"
          />
          <div class="hero-img-tag">
            Funil visual de consórcios gerados pelas suas indicações
          </div>
        </div>
      </div>
    </div>

    <div class="card" style="background:#020617; border-color:#1f2937; color:#e5e7eb;">
      <h3>Etapas do funil de indicação</h3>
      <p class="muted" style="color:#9ca3af;">
        Todo cliente caminha por estas etapas: do clique no link até a aprovação da venda.
      </p>

      <div class="timeline-wrapper">
        <div class="timeline">
          <div class="timeline-connector"></div>
          <div class="timeline-progress"></div>

          <div class="timeline-step">
            <div class="timeline-circle">1</div>
            <div class="timeline-label">Pré-adesão</div>
            <div class="timeline-caption">
              Cliente preenche o formulário pelo seu link.
            </div>
          </div>
          <div class="timeline-step">
            <div class="timeline-circle">2</div>
            <div class="timeline-label">Em atendimento</div>
            <div class="timeline-caption">
              Parceiro entra em contato (ligação / WhatsApp).
            </div>
          </div>
          <div class="timeline-step">
            <div class="timeline-circle">3</div>
            <div class="timeline-label">Boleto emitido</div>
            <div class="timeline-caption">
              Boleto é gerado na administradora.
            </div>
          </div>
          <div class="timeline-step">
            <div class="timeline-circle">4</div>
            <div class="timeline-label">Venda aprovada</div>
            <div class="timeline-caption">
              Boleto pago e venda confirmada.
            </div>
          </div>
          <div class="timeline-step">
            <div class="timeline-circle">5</div>
            <div class="timeline-label">Não fechou</div>
            <div class="timeline-caption">
              Quando o cliente decide não seguir com a contratação.
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card" style="background:#020617; border-color:#1f2937; color:#e5e7eb;">
      <h3>Visão gráfica do funil</h3>
      <div class="charts-grid">
        <div>
          <p class="muted" style="color:#9ca3af;">Quantidade de pré-vendas em cada etapa.</p>
          <canvas id="funilBarChart" height="180"></canvas>
        </div>
        <div>
          <p class="muted" style="color:#9ca3af;">Distribuição percentual das suas indicações.</p>
          <canvas id="conversionChart" height="180"></canvas>
        </div>
      </div>
    </div>

    <div class="card" style="background:#020617; border-color:#1f2937; color:#e5e7eb;">
      <h3>Minhas pré-vendas (linha do tempo individual)</h3>
      ${
        pre.length === 0
          ? `<p class="muted" style="color:#9ca3af;">Nenhuma pré-venda ainda. Gere seu primeiro link na área “Meus links de indicação”.</p>`
          : pre
              .map((v) => {
                const currentStageIndex = stageOrder.indexOf(v.status);
                const isLost = v.status === "NAO_FECHOU";

                function statusBadgeClass(st) {
                  if (st === "PRE_ADESAO") return "badge-status badge-status--pre";
                  if (st === "EM_ATENDIMENTO") return "badge-status badge-status--atend";
                  if (st === "BOLETO_EMITIDO") return "badge-status badge-status--boleto";
                  if (st === "APROVADA") return "badge-status badge-status--ok";
                  if (st === "NAO_FECHOU") return "badge-status badge-status--lost";
                  return "badge-status";
                }

                return `
        <div class="card" style="margin-top:10px; background:#020617; border-color:#1f2937; color:#e5e7eb;">
          <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center;">
            <div>
              <strong>${v.nome_cliente}</strong> – ${v.produto_nome}<br>
              <span class="muted" style="color:#9ca3af;">Contato: ${v.telefone_cliente} · ${v.email_cliente}</span><br>
              ${
                v.valor_venda
                  ? `<span class="muted" style="color:#9ca3af;">Valor da venda: R$ ${Number(v.valor_venda).toFixed(2)}</span><br>`
                  : ""
              }
            </div>
            <div>
              <span class="${statusBadgeClass(v.status)}">
                <span class="badge-status-dot"></span>
                ${stageLabels[v.status] || v.status}
              </span>
            </div>
          </div>

          <div class="stepper-mini">
            ${stageOrder
              .map((st, idx) => {
                let cls = "";
                if (isLost && st === "NAO_FECHOU") {
                  cls = "lost";
                } else if (idx < currentStageIndex && v.status !== "NAO_FECHOU") {
                  cls = "done";
                } else if (idx === currentStageIndex) {
                  cls = "current";
                }
                return `
                  <div class="stepper-mini-step ${cls}">
                    <div class="stepper-mini-step-dot"></div>
                    <span>${stageLabels[st]}</span>
                  </div>
                `;
              })
              .join("")}
          </div>
        </div>`;
              })
              .join("")
      }
    </div>

    <script>
      window.addEventListener('DOMContentLoaded', function () {
        var ctxBar = document.getElementById('funilBarChart');
        if (ctxBar) {
          new Chart(ctxBar.getContext('2d'), {
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
              scales: {
                x: { ticks: { color: '#9ca3af', font: { size: 11 } } },
                y: {
                  beginAtZero: true,
                  ticks: { color: '#9ca3af', font: { size: 11 } }
                }
              }
            }
          });
        }

        var total = ${totalPre};
        var ctxPie = document.getElementById('conversionChart');
        if (ctxPie && total > 0) {
          new Chart(ctxPie.getContext('2d'), {
            type: 'doughnut',
            data: {
              labels: [
                'Pré-adesão',
                'Em atendimento',
                'Boleto emitido',
                'Aprovada',
                'Não fechou'
              ],
              datasets: [{
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
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: { color: '#e5e7eb', font: { size: 11 } }
                }
              }
            }
          });
        }
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
    <div class="card" style="background:#020617; border-color:#1f2937; color:#e5e7eb;">
      <h2>Produtos de consórcio para indicação</h2>
      <p class="muted" style="color:#9ca3af;">
        Use a tabela abaixo para gerar e copiar os links de indicação. Cada linha representa um plano/valor
        da administradora. Clique em <strong>Copiar link</strong> ao lado do plano que deseja enviar.
      </p>
    </div>

    <div class="card" style="background:#020617; border-color:#1f2937; color:#e5e7eb;">
      ${
        produtos.length === 0
          ? `<p class="muted" style="color:#9ca3af;">Nenhum produto cadastrado. Cadastre os planos na tabela <code>produtos</code>.</p>`
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
            msg.style.background = '#22c55e';
            msg.style.color = 'white';
            msg.style.padding = '8px 14px';
            msg.style.borderRadius = '999px';
            msg.style.fontSize = '13px';
            msg.style.boxShadow = '0 4px 18px rgba(0,0,0,0.6)';
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
// CLIENTE – PRÉ-ADESÃO (com LGPD / autorização)
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
      <div class="card auth-card" style="background:#020617; border-color:#1f2937; color:#e5e7eb;">
        <h2>${prod.nome}</h2>
        ${
          prod.codigo || prod.credito_referencia
            ? `<p class="muted" style="color:#9ca3af;">Código: <strong>${prod.codigo || "-"}</strong> · ${prod.credito_referencia || ""}</p>`
            : ""
        }
        <p>Indicação de <strong>${ind.nome}</strong></p>

        <form method="POST" action="/consorcio">
          <input type="hidden" name="indicador_id" value="${ind.id}">
          <input type="hidden" name="produto_id" value="${prod.id}">

          <label>Nome completo</label><input name="nome" required>
          <label>Telefone / WhatsApp</label><input name="telefone" required>
          <label>E-mail</label><input name="email" type="email" required>

          <div style="margin-top:10px; font-size:12px; color:#9ca3af;">
            <label style="display:flex; align-items:flex-start; gap:6px;">
              <input type="checkbox" name="aceite_termos" required style="margin-top:2px;">
              <span>
                Autorizo o tratamento dos meus dados pessoais pela plataforma INDICONS/Dhealth Ltda
                e pelas administradoras de consórcio parceiras, para fins de análise de perfil,
                oferta, contratação e acompanhamento de consórcios, em conformidade com a LGPD
                (Lei nº 13.709/2018) e com as normas do Banco Central do Brasil, bem como o contato
                por telefone, WhatsApp ou e-mail para esclarecimento de dúvidas e envio de propostas.
              </span>
            </label>
          </div>

          <button class="btn" style="margin-top:12px;">Confirmar pré-adesão</button>
        </form>

        <p class="muted" style="margin-top:8px; color:#9ca3af;">
          Um parceiro autorizado entrará em contato para finalizar a venda. O envio desta pré-adesão
          não garante aprovação de crédito, que dependerá das políticas da administradora.
        </p>
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

  await notifyCustomerPreAdesao(telefone, nome);
  await notifyPartnerNewLead(PARCEIRO_TELEFONE, preVendaId);

  res.send(
    layout(
      "Pré-adesão enviada",
      `<div class="card auth-card" style="background:#020617; border-color:#1f2937; color:#e5e7eb;"><h2>Pré-adesão registrada!</h2><p class="muted" style="color:#9ca3af;">O parceiro entrará em contato em breve para dar sequência na análise e eventual contratação do consórcio.</p></div>`
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
      <div class="card auth-card" style="background:#020617; border-color:#1f2937; color:#e5e7eb;">
        <h2>Login do Parceiro</h2>
        <form method="POST">
          <label>Email</label><input name="email">
          <label>Senha</label><input type="password" name="senha">
          <button class="btn" style="margin-top:10px;">Entrar</button>
        </form>
        <p class="muted" style="color:#9ca3af;">Usuário padrão: parceiro@indicons.com / 123456</p>
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
      <div class="card" style="background:#020617; border-color:#1f2937; color:#e5e7eb;">
        <h2>Pré-vendas para atendimento</h2>
        <p class="muted" style="color:#9ca3af;">
          Utilize estes dados apenas para fins de atendimento e formalização do consórcio,
          em conformidade com a LGPD e com as políticas da administradora.
        </p>
      </div>
      ${
        pv.length === 0
          ? `<div class="card" style="background:#020617; border-color:#1f2937; color:#e5e7eb;"><p class="muted" style="color:#9ca3af;">Nenhuma pré-venda ainda.</p></div>`
          : pv
              .map(
                (v) => `
      <div class="card" style="background:#020617; border-color:#1f2937; color:#e5e7eb;">
        <h3>${v.nome_cliente}</h3>
        <p class="muted" style="color:#9ca3af;">${v.produto_nome}</p>
        <p class="muted" style="color:#9ca3af;">Indicador: ${v.indicador_nome}</p>
        <p class="muted" style="color:#9ca3af;">Contato: ${v.telefone_cliente} · ${v.email_cliente}</p>

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
      const valor = Number(valor_venda);
      await dbRun(
        `INSERT INTO comissoes (indicador_id,pre_venda_id,valor_venda,valor_comissao)
         VALUES (?,?,?,?)`,
        [pv.indicador_id, pv.id, valor, valor * COMMISSION_RATE]
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
      <div class="card auth-card" style="background:#020617; border-color:#1f2937; color:#e5e7eb;">
        <h2>Login Admin</h2>
        <form method="POST">
          <label>Email</label><input name="email">
          <label>Senha</label><input type="password" name="senha">
          <button class="btn" style="margin-top:10px;">Entrar</button>
        </form>
        <p class="muted" style="color:#9ca3af;">Usuário padrão: admin@indicons.com / 123456</p>
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
      <div class="card" style="background:#020617; border-color:#1f2937; color:#e5e7eb;">
        <h2>Comissões</h2>
        <p class="muted" style="color:#9ca3af;">
          As comissões ao indicador são calculadas sobre o valor de venda aprovado, com
          percentual total de até 1,5%. O pagamento é realizado em 6 parcelas (0,50% / 0,20% / 0,20% / 0,20% / 0,20% / 0,20%),
          com possibilidade de estorno de 0,35% até a 6ª parcela em caso de inadimplência ou cancelamento do contrato.
        </p>
        ${
          coms.length === 0
            ? "<p class='muted' style='color:#9ca3af;'>Nenhuma comissão registrada ainda.</p>"
            : coms
                .map(
                  (c) =>
                    `<div class="card" style="margin-top:8px; background:#020617; border-color:#1f2937; color:#e5e7eb;">
                      Indicador: <strong>${c.indicador_nome}</strong><br>
                      Valor venda: R$ ${c.valor_venda}<br>
                      Comissão total (até 1,5%): <strong>R$ ${c.valor_comissao}</strong>
                    </div>`
                )
                .join("")
        }
      </div>

      <div class="card" style="background:#020617; border-color:#1f2937; color:#e5e7eb;">
        <h3>Follow-up organizado</h3>
        <p class="muted" style="color:#9ca3af;">
          Clique no botão abaixo para enviar mensagens de follow-up para todas as pré-vendas
          em status <strong>PRE_ADESAO</strong> ou <strong>EM_ATENDIMENTO</strong>.
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
      `<div class="card auth-card" style="background:#020617; border-color:#1f2937; color:#e5e7eb;"><h2>Follow-up enviado para ${abertas.length} pré-vendas abertas.</h2></div>`,
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
// IA – ENDPOINTS
// =============================================================
app.post("/api/chat/site", async (req, res) => {
  const { mensagem, contexto } = req.body;
  const answer = await askAI(mensagem || "", contexto || []);
  res.json({ resposta: answer });
});

app.post("/api/chat/whatsapp-webhook", async (req, res) => {
  console.log("[DEBUG] Webhook WhatsApp IA recebido:", req.body);
  res.sendStatus(200);
});

// DEMOS
app.post("/api/ia-demo", (req, res) => {
  const pergunta = req.body.pergunta || "";
  res.json({
    resposta:
      "Demo de IA. Em produção, aqui entraria a integração com IA. Pergunta: " +
      pergunta,
  });
});

app.post("/api/whatsapp-demo", (req, res) => {
  const { telefone, mensagem } = req.body;
  console.log("Simulando envio de WhatsApp para:", telefone, "mensagem:", mensagem);
  res.json({
    ok: true,
    detalhe:
      "Envio de WhatsApp simulado. Em produção, aqui entra o provedor real.",
  });
});

// =============================================================
// INICIAR SERVIDOR
// =============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("INDICONS rodando na porta " + PORT));
