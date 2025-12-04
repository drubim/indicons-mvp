// ===============================================
// INDICONS – MVP COMPLETO COM SQLite (UI melhorada)
// ===============================================
const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();

const app = express();

// -----------------------------------------------
// Middlewares
// -----------------------------------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: 'indicons-secret',
    resave: false,
    saveUninitialized: true,
  })
);

// -----------------------------------------------
// Banco SQLite
// -----------------------------------------------
const db = new sqlite3.Database('./indicons.db');

// Cria tabelas se não existirem
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS indicadores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
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
      FOREIGN KEY (indicador_id) REFERENCES indicadores(id),
      FOREIGN KEY (produto_id) REFERENCES produtos(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS comissoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      indicador_id INTEGER NOT NULL,
      pre_venda_id INTEGER NOT NULL,
      valor_venda REAL NOT NULL,
      valor_comissao REAL NOT NULL,
      FOREIGN KEY (indicador_id) REFERENCES indicadores(id),
      FOREIGN KEY (pre_venda_id) REFERENCES pre_vendas(id)
    )
  `);

  // Inserir produtos padrão se tabela estiver vazia
  db.get('SELECT COUNT(*) AS c FROM produtos', (err, row) => {
    if (err) return console.error(err);
    if (row.c === 0) {
      db.run(
        'INSERT INTO produtos (nome, descricao) VALUES (?, ?)',
        ['Consórcio Imobiliário', 'Crédito para imóveis residenciais e comerciais']
      );
      db.run(
        'INSERT INTO produtos (nome, descricao) VALUES (?, ?)',
        ['Consórcio Automóvel', 'Crédito para aquisição de veículos']
      );
    }
  });
});

// Helpers de Promise para SQLite
function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this); // this.lastID, this.changes
    });
  });
}

// -----------------------------------------------
// Layout (UI melhorada)
// -----------------------------------------------
function layout(title, content, userNav = '') {
  return `
  <!DOCTYPE html>
  <html lang="pt-br">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        :root {
          --bg: #020617;
          --primary: #0f766e;
          --primary-soft: #0d9488;
          --card: #0b1120;
          --text-main: #e5e7eb;
          --text-muted: #9ca3af;
          --border: #1f2937;
          --danger: #f97373;
          --accent: #22c55e;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background: radial-gradient(circle at top, #0f172a 0, #020617 45%, #000 100%);
          color: var(--text-main);
        }
        a { color: #38bdf8; text-decoration: none; }
        a:hover { text-decoration: underline; }

        header {
          border-bottom: 1px solid var(--border);
          background: rgba(15,23,42,0.95);
          backdrop-filter: blur(10px);
          position: sticky;
          top: 0;
          z-index: 20;
        }
        .header-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .logo-mark {
          width: 32px;
          height: 32px;
          border-radius: 999px;
          background: radial-gradient(circle at 30% 30%, #22c55e, #0f766e 45%, #0b1120);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 18px;
          color: white;
        }
        .logo-text-main { font-weight: 700; letter-spacing: 0.04em; }
        .logo-text-sub { font-size: 12px; color: var(--text-muted); }

        nav a {
          margin-left: 12px;
          font-size: 14px;
          color: var(--text-muted);
        }
        nav a:first-child { margin-left: 0; }
        nav a:hover { color: white; }

        .user-nav {
          font-size: 13px;
          color: var(--text-muted);
        }
        .user-nav a { color: #facc15; }

        main {
          max-width: 1100px;
          margin: 18px auto 32px;
          padding: 0 16px;
        }
        .card {
          background: linear-gradient(135deg, rgba(15,23,42,0.9), rgba(15,23,42,0.98));
          border-radius: 18px;
          border: 1px solid var(--border);
          padding: 18px 20px;
          box-shadow: 0 18px 40px rgba(0,0,0,0.4);
          margin-bottom: 18px;
        }
        .card-soft {
          background: rgba(15,23,42,0.9);
          border-radius: 14px;
          border: 1px solid var(--border);
          padding: 14px 16px;
          margin-bottom: 12px;
        }
        h1 { font-size: 24px; margin: 0 0 8px; }
        h2 { font-size: 18px; margin: 18px 0 8px; }
        h3 { font-size: 15px; margin: 14px 0 6px; }
        p { margin: 6px 0; font-size: 14px; }
        .muted { color: var(--text-muted); font-size: 13px; }

        form label { display: block; font-size: 13px; margin-top: 8px; margin-bottom: 2px; }
        input, select {
          width: 100%;
          padding: 8px 10px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: #020617;
          color: var(--text-main);
          font-size: 13px;
        }
        input:focus, select:focus {
          outline: none;
          border-color: #22c55e;
          box-shadow: 0 0 0 1px rgba(34,197,94,0.4);
        }

        button {
          border-radius: 999px;
          border: none;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: #020617;
          margin-top: 10px;
        }
        button:hover {
          filter: brightness(1.05);
        }

        .btn-secondary {
          background: #0f172a;
          color: var(--text-main);
          border: 1px solid var(--border);
        }
        .btn-secondary:hover {
          background: #020617;
        }

        .pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 2px 8px;
          border-radius: 999px;
          border: 1px solid var(--border);
          font-size: 11px;
          color: var(--text-muted);
        }

        .status {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 11px;
          border: 1px solid var(--border);
        }
        .status-pre { background: rgba(59,130,246,0.1); color:#60a5fa; }
        .status-atend { background: rgba(234,179,8,0.1); color:#facc15; }
        .status-aprov { background: rgba(34,197,94,0.1); color:#4ade80; }
        .status-canc { background: rgba(248,113,113,0.08); color:#fca5a5; }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 12px;
        }

        @media (max-width: 640px) {
          .header-inner { flex-direction: column; align-items: flex-start; }
          nav { display: flex; flex-wrap: wrap; gap: 8px; }
        }
      </style>
    </head>
    <body>
      <header>
        <div class="header-inner">
          <div class="logo">
            <div class="logo-mark">I</div>
            <div>
              <div class="logo-text-main">INDICONS</div>
              <div class="logo-text-sub">Indicação inteligente de consórcios</div>
            </div>
          </div>
          <div style="flex:1"></div>
          <nav>
            <a href="/">Home</a>
            <a href="/indicador/login">Indicador</a>
            <a href="/parceiro/login">Parceiro</a>
            <a href="/admin/login">Admin</a>
          </nav>
          <div class="user-nav">${userNav || ''}</div>
        </div>
      </header>
      <main>
        ${content}
      </main>
    </body>
  </html>
  `;
}

// -----------------------------------------------
// HOME
// -----------------------------------------------
app.get('/', (req, res) => {
  const content = `
    <section class="card">
      <h1>Plataforma INDICONS</h1>
      <p>Controle de indicações de consórcio, pré-venda e comissionamento em um só lugar.</p>
      <p class="muted">MVP funcional com banco SQLite, ideal para validar o modelo de negócio.</p>
      <div style="margin-top:10px; display:flex; flex-wrap:wrap; gap:8px;">
        <a href="/indicador/registrar"><button>Quero ser indicador</button></a>
        <a href="/indicador/login"><button class="btn-secondary">Já sou indicador</button></a>
        <a href="/parceiro/login"><button class="btn-secondary">Área do parceiro</button></a>
        <a href="/admin/login"><button class="btn-secondary">Painel admin</button></a>
      </div>
    </section>

    <section class="card-soft">
      <h2>Como funciona o fluxo</h2>
      <ul class="flow">
        <li>1. Indicador se cadastra e gera links de produtos.</li>
        <li>2. Cliente clica no link, preenche dados e envia a pré-adesão.</li>
        <li>3. Parceiro recebe a pré-venda, atende o cliente e finaliza a venda no sistema da administradora.</li>
        <li>4. Parceiro marca a venda como “Aprovada” com o valor fechado.</li>
        <li>5. Sistema registra automaticamente comissão de 5% para o indicador.</li>
      </ul>
    </section>

    <section class="card-soft">
      <h2>Logins de teste</h2>
      <p><span class="pill">Admin</span> admin@indicons.com / 123456</p>
      <p><span class="pill">Parceiro</span> parceiro@indicons.com / 123456</p>
      <p class="muted">Indicadores são criados pela rota de cadastro.</p>
    </section>
  `;
  res.send(layout('INDICONS - Home', content));
});

// -----------------------------------------------
// MIDDLEWARES SIMPLES DE AUTENTICAÇÃO
// -----------------------------------------------
function requireIndicador(req, res, next) {
  if (!req.session.indicadorId) return res.redirect('/indicador/login');
  next();
}
function requireParceiro(req, res, next) {
  if (!req.session.parceiroId) return res.redirect('/parceiro/login');
  next();
}
function requireAdmin(req, res, next) {
  if (!req.session.adminId) return res.redirect('/admin/login');
  next();
}

// -----------------------------------------------
// INDICADOR – CADASTRO / LOGIN / DASHBOARD
// -----------------------------------------------
app.get('/indicador/registrar', (req, res) => {
  const content = `
    <section class="card">
      <h2>Cadastrar indicador</h2>
      <p class="muted">Preencha seus dados para receber links de indicação e comissões.</p>
      <form method="POST">
        <label>Nome completo</label>
        <input name="nome" required>
        <label>E-mail</label>
        <input name="email" type="email" required>
        <label>Senha</label>
        <input name="senha" type="password" required>
        <button type="submit">Registrar</button>
      </form>
    </section>
  `;
  res.send(layout('Cadastrar Indicador', content));
});

app.post('/indicador/registrar', async (req, res) => {
  const { nome, email, senha } = req.body;
  try {
    await dbRun(
      'INSERT INTO indicadores (nome, email, senha) VALUES (?, ?, ?)',
      [nome, email, senha]
    );
    res.redirect('/indicador/login');
  } catch (e) {
    res.send(layout('Erro', `<section class="card"><p>Erro ao cadastrar indicador (talvez e-mail já usado).</p><p class="muted">${e.message}</p></section>`));
  }
});

app.get('/indicador/login', (req, res) => {
  const content = `
    <section class="card">
      <h2>Login do indicador</h2>
      <form method="POST">
        <label>E-mail</label>
        <input name="email" type="email" required>
        <label>Senha</label>
        <input name="senha" type="password" required>
        <button type="submit">Entrar</button>
      </form>
      <p class="muted">Ainda não tem cadastro? <a href="/indicador/registrar">Criar conta de indicador</a>.</p>
    </section>
  `;
  res.send(layout('Login Indicador', content));
});

app.post('/indicador/login', async (req, res) => {
  const { email, senha } = req.body;
  const ind = await dbGet(
    'SELECT * FROM indicadores WHERE email = ? AND senha = ?',
    [email, senha]
  );
  if (!ind) {
    return res.send(layout('Login inválido', `<section class="card"><p>Login inválido.</p><p><a href="/indicador/login">Tentar novamente</a></p></section>`));
  }

  req.session.indicadorId = ind.id;
  req.session.indicadorNome = ind.nome;
  res.redirect('/indicador/dashboard');
});

app.get('/indicador/dashboard', requireIndicador, async (req, res) => {
  const preVendas = await dbAll(
    `SELECT pv.*, p.nome AS produto_nome
     FROM pre_vendas pv
     JOIN produtos p ON p.id = pv.produto_id
     WHERE pv.indicador_id = ?
     ORDER BY pv.id DESC`,
    [req.session.indicadorId]
  );

  const content = `
    <section class="card">
      <h2>Bem-vindo, ${req.session.indicadorNome}</h2>
      <p class="muted">Aqui você acompanha suas indicações e pré-vendas.</p>
      <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:8px;">
        <a href="/indicador/links"><button>Meus links de produtos</button></a>
      </div>
    </section>

    <section class="card-soft">
      <h3>Minhas pré-vendas</h3>
      ${
        preVendas.length === 0
          ? '<p class="muted">Nenhuma pré-venda ainda.</p>'
          : preVendas
              .map((v) => {
                let statusClass = 'status-pre';
                if (v.status === 'EM_ATENDIMENTO') statusClass = 'status-atend';
                if (v.status === 'APROVADA') statusClass = 'status-aprov';
                if (v.status === 'NAO_FECHOU') statusClass = 'status-canc';
                return `
          <div class="card-soft">
            <strong>${v.nome_cliente}</strong> – ${v.produto_nome}<br>
            <span class="status ${statusClass}">${v.status}</span><br>
            <span class="muted">Telefone: ${v.telefone_cliente} | E-mail: ${v.email_cliente}</span>
          </div>`;
              })
              .join('')
      }
    </section>
  `;
  const nav = `<div>Indicador: ${req.session.indicadorNome} · <a href="/logout">Sair</a></div>`;
  res.send(layout('Dashboard Indicador', content, nav));
});

// Links de produtos
app.get('/indicador/links', requireIndicador, async (req, res) => {
  const produtos = await dbAll('SELECT * FROM produtos ORDER BY id');
  const baseUrl = process.env.BASE_URL || 'https://indicons.onrender.com';

  const content = `
    <section class="card">
      <h2>Meus links de indicação</h2>
      <p class="muted">Copie o link do produto e envie por WhatsApp, redes sociais ou e-mail.</p>
    </section>
    <section class="grid">
      ${
        produtos.length === 0
          ? '<p class="muted">Nenhum produto configurado.</p>'
          : produtos
              .map((p) => {
                const link = `${baseUrl}/consorcio?i=${req.session.indicadorId}&p=${p.id}`;
                return `
          <div class="card-soft">
            <h3>${p.nome}</h3>
            <p class="muted">${p.descricao || ''}</p>
            <p style="font-size:12px; word-break:break-all;"><strong>Link:</strong><br><code>${link}</code></p>
          </div>`;
              })
              .join('')
      }
    </section>
  `;
  const nav = `<div>Indicador: ${req.session.indicadorNome} · <a href="/logout">Sair</a></div>`;
  res.send(layout('Links Indicador', content, nav));
});

// -----------------------------------------------
// CLIENTE – PÁGINA DO PRODUTO / PRÉ-ADESÃO
// -----------------------------------------------
app.get('/consorcio', async (req, res) => {
  const { i, p } = req.query;
  if (!i || !p) return res.send('Link inválido.');

  const indicador = await dbGet('SELECT * FROM indicadores WHERE id = ?', [i]);
  const produto = await dbGet('SELECT * FROM produtos WHERE id = ?', [p]);

  if (!indicador || !produto) return res.send('Link inválido.');

  const content = `
    <section class="card">
      <h2>${produto.nome}</h2>
      <p class="muted">${produto.descricao || ''}</p>
      <p class="muted">Indicação de: <strong>${indicador.nome}</strong></p>

      <h3>Pré-adesão</h3>
      <form method="POST" action="/consorcio">
        <input type="hidden" name="indicador_id" value="${indicador.id}">
        <input type="hidden" name="produto_id" value="${produto.id}">

        <label>Nome completo</label>
        <input name="nome" required>
        <label>Telefone / WhatsApp</label>
        <input name="telefone" required>
        <label>E-mail</label>
        <input name="email" type="email" required>
        <button type="submit">Confirmar pré-adesão</button>
      </form>
      <p class="muted" style="margin-top:10px;">
        Esta é uma PRÉ-VENDA. O parceiro oficial entrará em contato para finalizar o cadastro no sistema da administradora
        e emitir o boleto.
      </p>
    </section>
  `;
  res.send(layout('Pré-adesão', content));
});

app.post('/consorcio', async (req, res) => {
  const { indicador_id, produto_id, nome, telefone, email } = req.body;
  await dbRun(
    `INSERT INTO pre_vendas (indicador_id, produto_id, nome_cliente, telefone_cliente, email_cliente, status)
     VALUES (?, ?, ?, ?, ?, 'PRE_ADESAO')`,
    [indicador_id, produto_id, nome, telefone, email]
  );
  const content = `
    <section class="card">
      <h2>Pré-adesão registrada</h2>
      <p>Obrigado, ${nome}. Sua pré-adesão foi enviada com sucesso.</p>
      <p class="muted">
        Um parceiro autorizado entrará em contato para concluir a contratação do consórcio.
      </p>
    </section>
  `;
  res.send(layout('Pré-adesão registrada', content));
});

// -----------------------------------------------
// PARCEIRO – LOGIN / PRÉ-VENDAS
// -----------------------------------------------
app.get('/parceiro/login', (req, res) => {
  const content = `
    <section class="card">
      <h2>Login do parceiro</h2>
      <form method="POST">
        <label>E-mail</label>
        <input name="email" type="email" required>
        <label>Senha</label>
        <input name="senha" type="password" required>
        <button type="submit">Entrar</button>
      </form>
      <p class="muted">Usuário padrão: parceiro@indicons.com / 123456</p>
    </section>
  `;
  res.send(layout('Login Parceiro', content));
});

// Parceiro fixo simples (poderia estar no banco também)
const PARCEIRO_EMAIL = 'parceiro@indicons.com';
const PARCEIRO_SENHA = '123456';

app.post('/parceiro/login', (req, res) => {
  const { email, senha } = req.body;
  if (email === PARCEIRO_EMAIL && senha === PARCEIRO_SENHA) {
    req.session.parceiroId = 1;
    req.session.parceiroNome = 'Parceiro';
    return res.redirect('/parceiro/pre-vendas');
  }
  res.send(layout('Login inválido', `<section class="card"><p>Login inválido.</p><p><a href="/parceiro/login">Tentar novamente</a></p></section>`));
});

app.get('/parceiro/pre-vendas', requireParceiro, async (req, res) => {
  const rows = await dbAll(
    `SELECT pv.*, p.nome AS produto_nome, i.nome AS indicador_nome
     FROM pre_vendas pv
     JOIN produtos p ON p.id = pv.produto_id
     JOIN indicadores i ON i.id = pv.indicador_id
     ORDER BY pv.id DESC`
  );

  const content = `
    <section class="card">
      <h2>Pré-vendas para atendimento</h2>
      <p class="muted">Visualize as pré-adesões e atualize o status conforme o andamento da venda.</p>
    </section>
    ${
      rows.length === 0
        ? '<section class="card-soft"><p class="muted">Nenhuma pré-venda no momento.</p></section>'
        : rows
            .map((v) => {
              let statusClass = 'status-pre';
              if (v.status === 'EM_ATENDIMENTO') statusClass = 'status-atend';
              if (v.status === 'APROVADA') statusClass = 'status-aprov';
              if (v.status === 'NAO_FECHOU') statusClass = 'status-canc';
              return `
      <section class="card-soft">
        <h3>${v.nome_cliente}</h3>
        <p class="muted">${v.produto_nome}</p>
        <p class="muted">Indicador: ${v.indicador_nome}</p>
        <p class="muted">Contato: ${v.telefone_cliente} · ${v.email_cliente}</p>
        <p>Status atual: <span class="status ${statusClass}">${v.status}</span></p>
        <form method="POST" action="/parceiro/pre-vendas/${v.id}/status">
          <label>Novo status</label>
          <select name="status">
            <option value="EM_ATENDIMENTO">Em atendimento</option>
            <option value="BOLETO_EMITIDO">Boleto emitido</option>
            <option value="APROVADA">Aprovada / Venda finalizada</option>
            <option value="NAO_FECHOU">Não fechou</option>
          </select>
          <label>Valor da venda (se aprovada)</label>
          <input name="valor_venda" placeholder="Ex: 100000">
          <button type="submit">Atualizar</button>
        </form>
      </section>`;
            })
            .join('')
    }
  `;
  const nav = `<div>Parceiro: ${req.session.parceiroNome} · <a href="/logout">Sair</a></div>`;
  res.send(layout('Pré-vendas Parceiro', content, nav));
});

app.post('/parceiro/pre-vendas/:id/status', requireParceiro, async (req, res) => {
  const id = req.params.id;
  const { status, valor_venda } = req.body;

  await dbRun('UPDATE pre_vendas SET status = ?, valor_venda = ? WHERE id = ?', [
    status,
    valor_venda || null,
    id,
  ]);

  if (status === 'APROVADA' && valor_venda) {
    const pv = await dbGet('SELECT * FROM pre_vendas WHERE id = ?', [id]);
    if (pv) {
      const valorVenda = Number(valor_venda);
      const comissao = valorVenda * 0.05;
      await dbRun(
        'INSERT INTO comissoes (indicador_id, pre_venda_id, valor_venda, valor_comissao) VALUES (?, ?, ?, ?)',
        [pv.indicador_id, pv.id, valorVenda, comissao]
      );
    }
  }

  res.redirect('/parceiro/pre-vendas');
});

// -----------------------------------------------
// ADMIN – LOGIN / DASHBOARD
// -----------------------------------------------
app.get('/admin/login', (req, res) => {
  const content = `
    <section class="card">
      <h2>Login admin</h2>
      <form method="POST">
        <label>E-mail</label>
        <input name="email" type="email" required>
        <label>Senha</label>
        <input name="senha" type="password" required>
        <button type="submit">Entrar</button>
      </form>
      <p class="muted">Usuário padrão: admin@indicons.com / 123456</p>
    </section>
  `;
  res.send(layout('Login Admin', content));
});

const ADMIN_EMAIL = 'admin@indicons.com';
const ADMIN_SENHA = '123456';

app.post('/admin/login', (req, res) => {
  const { email, senha } = req.body;
  if (email === ADMIN_EMAIL && senha === ADMIN_SENHA) {
    req.session.adminId = 1;
    req.session.adminNome = 'Admin';
    return res.redirect('/admin/dashboard');
  }
  res.send(layout('Login inválido', `<section class="card"><p>Login inválido.</p><p><a href="/admin/login">Tentar novamente</a></p></section>`));
});

app.get('/admin/dashboard', requireAdmin, async (req, res) => {
  const coms = await dbAll(
    `SELECT c.*, i.nome AS indicador_nome
     FROM comissoes c
     JOIN indicadores i ON i.id = c.indicador_id
     ORDER BY c.id DESC`
  );

  const content = `
    <section class="card">
      <h2>Painel do admin</h2>
      <p class="muted">Visão geral de comissões geradas pelas vendas aprovadas.</p>
    </section>
    <section class="card-soft">
      <h3>Comissões</h3>
      ${
        coms.length === 0
          ? '<p class="muted">Nenhuma comissão registrada ainda.</p>'
          : coms
              .map(
                (c) => `
        <div class="card-soft">
          <strong>Indicador:</strong> ${c.indicador_nome}<br>
          <span class="muted">Valor da venda:</span> R$ ${c.valor_venda.toFixed(2)}<br>
          <span class="muted">Comissão (5%):</span> R$ ${c.valor_comissao.toFixed(2)}
        </div>`
              )
              .join('')
      }
    </section>
  `;
  const nav = `<div>Admin: ${req.session.adminNome} · <a href="/logout">Sair</a></div>`;
  res.send(layout('Dashboard Admin', content, nav));
});

// -----------------------------------------------
// LOGOUT
// -----------------------------------------------
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// -----------------------------------------------
// SERVIDOR
// -----------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('INDICONS rodando na porta ' + PORT);
});
