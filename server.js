// server.js - INDICONS usando SQLite (banco real)

const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();

// ========= CONFIG BÁSICA =========
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'indicons-segredo-simples',
  resave: false,
  saveUninitialized: true
}));

// ========= CONEXÃO COM SQLITE =========
const DB_FILE = path.join(__dirname, 'indicons.db');
const db = new sqlite3.Database(DB_FILE);

// Helpers para usar Promises (fica mais simples)
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this); // this.lastID, this.changes
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, function (err, row) {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, function (err, rows) {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// ========= CRIAÇÃO DE TABELAS E DADOS INICIAIS =========
async function initDb() {
  // Tabelas
  await run(`
    CREATE TABLE IF NOT EXISTS indicador (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      cpf_cnpj TEXT,
      pix TEXT,
      senha TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS parceiro (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS produto (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      codigo TEXT NOT NULL UNIQUE,
      administradora TEXT NOT NULL,
      descricao TEXT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS pre_venda (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      indicador_id INTEGER NOT NULL,
      produto_id INTEGER NOT NULL,
      valor_carta REAL NOT NULL,
      prazo_meses INTEGER NOT NULL,
      nome_cliente TEXT NOT NULL,
      cpf_cliente TEXT NOT NULL,
      telefone_cliente TEXT NOT NULL,
      email_cliente TEXT NOT NULL,
      cidade_uf TEXT NOT NULL,
      status TEXT NOT NULL,
      valor_venda REAL,
      parceiro_id INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY (indicador_id) REFERENCES indicador(id),
      FOREIGN KEY (produto_id) REFERENCES produto(id),
      FOREIGN KEY (parceiro_id) REFERENCES parceiro(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS comissao (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      indicador_id INTEGER NOT NULL,
      pre_venda_id INTEGER NOT NULL,
      valor_base REAL NOT NULL,
      percentual REAL NOT NULL,
      valor_comissao REAL NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY (indicador_id) REFERENCES indicador(id),
      FOREIGN KEY (pre_venda_id) REFERENCES pre_venda(id)
    )
  `);

  // Admin padrão
  const admin = await get(`SELECT * FROM admin WHERE email = ?`, ['admin@indicons.com']);
  if (!admin) {
    await run(
      `INSERT INTO admin (nome, email, senha) VALUES (?, ?, ?)`,
      ['Admin Padrão', 'admin@indicons.com', '123456']
    );
  }

  // Parceiro padrão
  const parceiro = await get(`SELECT * FROM parceiro WHERE email = ?`, ['parceiro@indicons.com']);
  if (!parceiro) {
    await run(
      `INSERT INTO parceiro (nome, email, senha) VALUES (?, ?, ?)`,
      ['Parceiro Padrão', 'parceiro@indicons.com', '123456']
    );
  }

  // Produtos exemplo
  const countProdutos = await get(`SELECT COUNT(*) as total FROM produto`);
  if (!countProdutos || countProdutos.total === 0) {
    await run(
      `INSERT INTO produto (nome, codigo, administradora, descricao) VALUES (?, ?, ?, ?)`,
      ['Consórcio Imóvel - Embracon', 'IMOVEL01', 'Embracon', 'Cartas de crédito para imóveis residenciais e comerciais.']
    );
    await run(
      `INSERT INTO produto (nome, codigo, administradora, descricao) VALUES (?, ?, ?, ?)`,
      ['Consórcio Auto - Porto Seguro', 'AUTO01', 'Porto Seguro', 'Consórcio para veículos leves novos e seminovos.']
    );
    await run(
      `INSERT INTO produto (nome, codigo, administradora, descricao) VALUES (?, ?, ?, ?)`,
      ['Consórcio Serviços - Embracon', 'SERVICO01', 'Embracon', 'Consórcio para serviços diversos (reformas, estudos, etc.).']
    );
  }

  console.log('Banco SQLite inicializado (indicons.db).');
}

// ========= MIDDLEWARES DE AUTENTICAÇÃO =========
function requireIndicador(req, res, next) {
  if (req.session && req.session.indicadorId) return next();
  return res.redirect('/indicador/login');
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.adminId) return next();
  return res.redirect('/admin/login');
}

function requireParceiro(req, res, next) {
  if (req.session && req.session.parceiroId) return next();
  return res.redirect('/parceiro/login');
}

// ========= LAYOUT HTML =========
function layout(title, content, userInfo = '') {
  return `
  <!DOCTYPE html>
  <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin:0; background:#f3f4f6; }
        header { background:#0f766e; color:white; padding:0.75rem 1.25rem; display:flex; justify-content:space-between; align-items:center; }
        a { color:#0f766e; text-decoration:none; }
        a:hover { text-decoration:underline; }
        .container { max-width:1100px; margin:1rem auto 2rem; padding:1rem 1.25rem; background:white; border-radius:10px; box-shadow:0 1px 4px rgba(0,0,0,0.06); }
        h1,h2,h3 { margin-top:0; }
        nav a { margin-right:0.8rem; font-size:0.9rem; }
        table { width:100%; border-collapse:collapse; margin-top:0.5rem; font-size:0.85rem; }
        th, td { border:1px solid #e5e7eb; padding:0.4rem 0.5rem; text-align:left; }
        th { background:#f9fafb; }
        label { display:block; font-size:0.85rem; margin-top:0.4rem; }
        input, select, textarea { width:100%; padding:0.35rem 0.4rem; border-radius:4px; border:1px solid #d1d5db; font-size:0.9rem; }
        button { margin-top:0.6rem; padding:0.45rem 0.9rem; border-radius:4px; border:none; background:#0f766e; color:white; cursor:pointer; font-size:0.9rem; }
        button:hover { background:#115e59; }
        .muted { font-size:0.8rem; color:#6b7280; }
        .badge { display:inline-block; padding:0.1rem 0.4rem; border-radius:999px; font-size:0.7rem; background:#e5e7eb; margin-left:0.25rem;}
        .badge-ind { background:#e0f2fe; }
        .badge-par { background:#fee2e2; }
        .badge-admin { background:#dcfce7; }
        ul.flow { font-size:0.85rem; padding-left:1.2rem; }
        ul.flow li { margin-bottom:0.25rem; }
      </style>
    </head>
    <body>
      <header>
        <div><strong>INDICONS</strong> – Plataforma de Indicação de Consórcios</div>
        <div>${userInfo}</div>
      </header>
      <div class="container">
        ${content}
      </div>
    </body>
  </html>
  `;
}

// ========= ROTAS =========

// HOME
app.get('/', async (req, res) => {
  const userInfo = `
    <nav>
      <a href="/">Home</a>
      <a href="/indicador/login">Indicador</a>
      <a href="/parceiro/login">Parceiro</a>
      <a href="/admin/login">Admin</a>
    </nav>
  `;
  const content = `
    <h1>INDICONS – Agora com banco SQLite</h1>
    <p>
      Todos os dados (indicadores, produtos, pré-vendas, comissões) são salvos no arquivo <code>indicons.db</code>.
      Você pode desligar o servidor e ligar de novo que as informações permanecem.
    </p>
    <h2>Fluxo do sistema</h2>
    <ul class="flow">
      <li><strong>Indicador</strong> se cadastra e pega seus links de produtos.</li>
      <li><strong>Cliente</strong> acessa o link e faz a pré-adesão.</li>
      <li><strong>Parceiro</strong> vê a pré-venda, entra em contato e fecha no sistema da administradora.</li>
      <li><strong>Parceiro</strong> marca a pré-venda como aprovada e informa o valor da venda.</li>
      <li><strong>INDICONS</strong> calcula 5% de comissão para o indicador.</li>
      <li><strong>Admin</strong> acompanha produtos, indicadores e comissões.</li>
    </ul>
    <h2>Logins de teste</h2>
    <ul>
      <li><strong>Admin:</strong> admin@indicons.com / 123456</li>
      <li><strong>Parceiro:</strong> parceiro@indicons.com / 123456</li>
    </ul>
  `;
  res.send(layout('INDICONS - Home', content, userInfo));
});

// ===== INDICADOR: CADASTRO =====
app.get('/indicador/registrar', (req, res) => {
  const userInfo = `<span class="badge badge-ind">Indicador</span>`;
  const content = `
    <h1>Cadastro de Indicador</h1>
    <form method="POST" action="/indicador/registrar">
      <label>Nome completo
        <input type="text" name="nome" required>
      </label>
      <label>E-mail
        <input type="email" name="email" required>
      </label>
      <label>CPF/CNPJ
        <input type="text" name="cpf_cnpj" required>
      </label>
      <label>Chave Pix
        <input type="text" name="pix" required>
      </label>
      <label>Senha
        <input type="password" name="senha" required>
      </label>
      <button type="submit">Cadastrar</button>
    </form>
  `;
  res.send(layout('Cadastro Indicador', content, userInfo));
});

app.post('/indicador/registrar', async (req, res) => {
  try {
    const { nome, email, cpf_cnpj, pix, senha } = req.body;
    const jaExiste = await get(`SELECT id FROM indicador WHERE email = ?`, [email]);
    if (jaExiste) {
      return res.send(layout('Erro', `<p>Já existe indicador com este e-mail.</p><a href="/indicador/login">Ir para login</a>`));
    }
    await run(
      `INSERT INTO indicador (nome, email, cpf_cnpj, pix, senha) VALUES (?, ?, ?, ?, ?)`,
      [nome, email, cpf_cnpj, pix, senha]
    );
    res.send(layout('Cadastro ok', `<p>Indicador cadastrado com sucesso.</p><a href="/indicador/login">Ir para login</a>`));
  } catch (err) {
    console.error(err);
    res.send(layout('Erro', `<p>Erro ao cadastrar indicador.</p>`));
  }
});

// ===== INDICADOR: LOGIN & DASHBOARD =====
app.get('/indicador/login', (req, res) => {
  const content = `
    <h1>Login Indicador</h1>
    <form method="POST" action="/indicador/login">
      <label>E-mail
        <input type="email" name="email" required>
      </label>
      <label>Senha
        <input type="password" name="senha" required>
      </label>
      <button type="submit">Entrar</button>
    </form>
  `;
  res.send(layout('Login Indicador', content, ''));
});

app.post('/indicador/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    const ind = await get(`SELECT * FROM indicador WHERE email = ? AND senha = ?`, [email, senha]);
    if (!ind) {
      return res.send(layout('Erro', `<p>Credenciais inválidas.</p><a href="/indicador/login">Tentar novamente</a>`));
    }
    req.session.indicadorId = ind.id;
    res.redirect('/indicador/dashboard');
  } catch (err) {
    console.error(err);
    res.send(layout('Erro', `<p>Erro no login.</p>`));
  }
});

app.get('/indicador/dashboard', requireIndicador, async (req, res) => {
  try {
    const ind = await get(`SELECT * FROM indicador WHERE id = ?`, [req.session.indicadorId]);
    const minhasPre = await all(
      `SELECT pv.*, pr.nome AS produto_nome
       FROM pre_venda pv
       JOIN produto pr ON pr.id = pv.produto_id
       WHERE pv.indicador_id = ?
       ORDER BY pv.id DESC`,
      [ind.id]
    );
    const minhasCom = await all(
      `SELECT * FROM comissao WHERE indicador_id = ?`,
      [ind.id]
    );

    const totalAPagar = minhasCom
      .filter(c => c.status === 'A_PAGAR')
      .reduce((sum, c) => sum + c.valor_comissao, 0);

    const totalPaga = minhasCom
      .filter(c => c.status === 'PAGA')
      .reduce((sum, c) => sum + c.valor_comissao, 0);

    const userInfo = `<span>${ind.nome}</span> <span class="badge badge-ind">Indicador</span> <a href="/logout">Sair</a>`;

    let rows = minhasPre.map(pv => `
      <tr>
        <td>${pv.id}</td>
        <td>${pv.nome_cliente}</td>
        <td>${pv.produto_nome}</td>
        <td>${pv.status}</td>
        <td>${pv.valor_carta}</td>
        <td>${pv.valor_venda || '-'}</td>
      </tr>
    `).join('');
    if (!rows) rows = `<tr><td colspan="6">Nenhuma indicação ainda.</td></tr>`;

    const content = `
      <h1>Dashboard do Indicador</h1>
      <p>
        <strong>Comissão a receber:</strong> R$ ${totalAPagar.toFixed(2)}<br>
        <strong>Comissão já paga:</strong> R$ ${totalPaga.toFixed(2)}
      </p>
      <p>
        <a href="/indicador/links">Meus links de indicação</a> |
        <a href="/indicador/dashboard">Minhas indicações</a>
      </p>
      <h2>Minhas indicações / pré-vendas</h2>
      <table>
        <tr>
          <th>#</th>
          <th>Cliente</th>
          <th>Produto</th>
          <th>Status</th>
          <th>Valor carta</th>
          <th>Valor venda</th>
        </tr>
        ${rows}
      </table>
    `;
    res.send(layout('Dashboard Indicador', content, userInfo));
  } catch (err) {
    console.error(err);
    res.send(layout('Erro', `<p>Erro ao carregar dashboard.</p>`));
  }
});

// Links de indicação
app.get('/indicador/links', requireIndicador, async (req, res) => {
  try {
    const ind = await get(`SELECT * FROM indicador WHERE id = ?`, [req.session.indicadorId]);
    const prods = await all(`SELECT * FROM produto ORDER BY id`);

    const userInfo = `<span>${ind.nome}</span> <span class="badge badge-ind">Indicador</span> <a href="/logout">Sair</a>`;

    let rows = prods.map(p => {
      const link = `http://localhost:3000/consorcio?i=${ind.id}&p=${p.id}`;
      return `
        <tr>
          <td>${p.id}</td>
          <td>${p.nome}</td>
          <td>${p.administradora}</td>
          <td>${p.descricao || ''}</td>
          <td><input type="text" value="${link}" style="width:100%;" readonly></td>
        </tr>
      `;
    }).join('');
    if (!rows) rows = `<tr><td colspan="5">Nenhum produto.</td></tr>`;

    const content = `
      <h1>Meus links de indicação</h1>
      <table>
        <tr>
          <th>ID</th>
          <th>Produto</th>
          <th>Administradora</th>
          <th>Descrição</th>
          <th>Link de indicação</th>
        </tr>
        ${rows}
      </table>
    `;
    res.send(layout('Links Indicador', content, userInfo));
  } catch (err) {
    console.error(err);
    res.send(layout('Erro', `<p>Erro ao carregar links.</p>`));
  }
});

// ===== FLUXO CLIENTE (PRÉ-VENDA) =====
app.get('/consorcio', async (req, res) => {
  try {
    const { i, p } = req.query;
    const indicador = await get(`SELECT * FROM indicador WHERE id = ?`, [Number(i)]);
    const produto = await get(`SELECT * FROM produto WHERE id = ?`, [Number(p)]);
    if (!indicador || !produto) {
      return res.send(layout('Erro', `<p>Link inválido ou indicador/produto não encontrado.</p>`));
    }

    const content = `
      <h1>Simulação & Pré-adesão – ${produto.nome}</h1>
      <p>Você está sendo atendido por <strong>${indicador.nome}</strong>.</p>
      <form method="POST" action="/consorcio">
        <input type="hidden" name="indicador_id" value="${indicador.id}">
        <input type="hidden" name="produto_id" value="${produto.id}">
        <h3>Simulação</h3>
        <label>Valor da carta (R$)
          <input type="number" name="valor_carta" required>
        </label>
        <label>Prazo (meses)
          <input type="number" name="prazo_meses" required>
        </label>
        <h3>Dados do cliente</h3>
        <label>Nome completo
          <input type="text" name="nome_cliente" required>
        </label>
        <label>CPF
          <input type="text" name="cpf_cliente" required>
        </label>
        <label>Telefone / WhatsApp
          <input type="text" name="telefone_cliente" required>
        </label>
        <label>E-mail
          <input type="email" name="email_cliente" required>
        </label>
        <label>Cidade/UF
          <input type="text" name="cidade_uf" required>
        </label>
        <label>
          <input type="checkbox" name="aceite" required>
          Autorizo contato para finalizar a contratação, ciente de que a venda será concluída pela administradora.
        </label>
        <button type="submit">Confirmar pré-adesão</button>
      </form>
    `;
    res.send(layout('Pré-adesão', content));
  } catch (err) {
    console.error(err);
    res.send(layout('Erro', `<p>Erro ao carregar página de pré-adesão.</p>`));
  }
});

app.post('/consorcio', async (req, res) => {
  try {
    const {
      indicador_id,
      produto_id,
      valor_carta,
      prazo_meses,
      nome_cliente,
      cpf_cliente,
      telefone_cliente,
      email_cliente,
      cidade_uf
    } = req.body;

    const indicador = await get(`SELECT * FROM indicador WHERE id = ?`, [Number(indicador_id)]);
    const produto = await get(`SELECT * FROM produto WHERE id = ?`, [Number(produto_id)]);
    if (!indicador || !produto) {
      return res.send(layout('Erro', `<p>Indicador ou produto inválido.</p>`));
    }

    const now = new Date().toISOString();
    const result = await run(
      `INSERT INTO pre_venda (
        indicador_id, produto_id, valor_carta, prazo_meses,
        nome_cliente, cpf_cliente, telefone_cliente, email_cliente,
        cidade_uf, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        indicador.id,
        produto.id,
        Number(valor_carta),
        Number(prazo_meses),
        nome_cliente,
        cpf_cliente,
        telefone_cliente,
        email_cliente,
        cidade_uf,
        'PRE_VENDA',
        now
      ]
    );

    const pvId = result.lastID;

    const content = `
      <h1>Pré-adesão registrada</h1>
      <p>Obrigado, ${nome_cliente}. Sua pré-adesão foi registrada com o código <strong>${pvId}</strong>.</p>
      <p>Em até 60 minutos um parceiro autorizado entrará em contato para finalizar sua adesão.</p>
    `;
    res.send(layout('Pré-adesão ok', content));
  } catch (err) {
    console.error(err);
    res.send(layout('Erro', `<p>Erro ao registrar pré-adesão.</p>`));
  }
});

// ===== PARCEIRO =====
app.get('/parceiro/login', (req, res) => {
  const content = `
    <h1>Login Parceiro</h1>
    <form method="POST" action="/parceiro/login">
      <label>E-mail
        <input type="email" name="email" required>
      </label>
      <label>Senha
        <input type="password" name="senha" required>
      </label>
      <button type="submit">Entrar</button>
    </form>
    <p class="muted">Usuário padrão: parceiro@indicons.com / 123456</p>
  `;
  res.send(layout('Login Parceiro', content));
});

app.post('/parceiro/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    const par = await get(`SELECT * FROM parceiro WHERE email = ? AND senha = ?`, [email, senha]);
    if (!par) {
      return res.send(layout('Erro', `<p>Credenciais inválidas.</p><a href="/parceiro/login">Tentar novamente</a>`));
    }
    req.session.parceiroId = par.id;
    res.redirect('/parceiro/pre-vendas');
  } catch (err) {
    console.error(err);
    res.send(layout('Erro', `<p>Erro no login do parceiro.</p>`));
  }
});

app.get('/parceiro/pre-vendas', requireParceiro, async (req, res) => {
  try {
    const par = await get(`SELECT * FROM parceiro WHERE id = ?`, [req.session.parceiroId]);
    const userInfo = `<span>${par.nome}</span> <span class="badge badge-par">Parceiro</span> <a href="/logout">Sair</a>`;

    const lista = await all(
      `SELECT pv.*, pr.nome AS produto_nome, ind.nome AS indicador_nome
       FROM pre_venda pv
       JOIN produto pr ON pr.id = pv.produto_id
       JOIN indicador ind ON ind.id = pv.indicador_id
       ORDER BY pv.id DESC`
    );

    let rows = lista.map(pv => `
      <tr>
        <td>${pv.id}</td>
        <td>${pv.nome_cliente}</td>
        <td>${pv.telefone_cliente}</td>
        <td>${pv.produto_nome}</td>
        <td>${pv.indicador_nome}</td>
        <td>${pv.status}</td>
        <td><a href="/parceiro/pre-vendas/${pv.id}">Atender</a></td>
      </tr>
    `).join('');
    if (!rows) rows = `<tr><td colspan="7">Nenhuma pré-venda ainda.</td></tr>`;

    const content = `
      <h1>Pré-vendas para atendimento</h1>
      <table>
        <tr>
          <th>#</th>
          <th>Cliente</th>
          <th>Telefone</th>
          <th>Produto</th>
          <th>Indicador</th>
          <th>Status</th>
          <th>Ações</th>
        </tr>
        ${rows}
      </table>
    `;
    res.send(layout('Pré-vendas Parceiro', content, userInfo));
  } catch (err) {
    console.error(err);
    res.send(layout('Erro', `<p>Erro ao carregar pré-vendas.</p>`));
  }
});

app.get('/parceiro/pre-vendas/:id', requireParceiro, async (req, res) => {
  try {
    const par = await get(`SELECT * FROM parceiro WHERE id = ?`, [req.session.parceiroId]);
    const userInfo = `<span>${par.nome}</span> <span class="badge badge-par">Parceiro</span> <a href="/logout">Sair</a>`;

    const pv = await get(
      `SELECT pv.*, pr.nome AS produto_nome, ind.nome AS indicador_nome
       FROM pre_venda pv
       JOIN produto pr ON pr.id = pv.produto_id
       JOIN indicador ind ON ind.id = pv.indicador_id
       WHERE pv.id = ?`,
      [Number(req.params.id)]
    );
    if (!pv) {
      return res.send(layout('Erro', `<p>Pré-venda não encontrada.</p>`, userInfo));
    }

    const content = `
      <h1>Pré-venda #${pv.id}</h1>
      <p><strong>Cliente:</strong> ${pv.nome_cliente} (${pv.cpf_cliente})</p>
      <p><strong>Telefone:</strong> ${pv.telefone_cliente} | <strong>E-mail:</strong> ${pv.email_cliente}</p>
      <p><strong>Produto:</strong> ${pv.produto_nome}</p>
      <p><strong>Indicador:</strong> ${pv.indicador_nome}</p>
      <p><strong>Valor carta:</strong> R$ ${pv.valor_carta} | <strong>Prazo:</strong> ${pv.prazo_meses} meses</p>
      <p><strong>Status atual:</strong> ${pv.status}</p>

      <h3>Atualizar status</h3>
      <form method="POST" action="/parceiro/pre-vendas/${pv.id}/status">
        <label>Novo status
          <select name="status">
            <option value="EM_ATENDIMENTO">Em atendimento</option>
            <option value="BOLETO_EMITIDO">Boleto emitido</option>
            <option value="APROVADA">Aprovada / Venda finalizada</option>
            <option value="REPROVADA">Reprovada / Não aprovada</option>
            <option value="NAO_FECHOU">Não fechou</option>
          </select>
        </label>
        <label>Valor da venda (somente se aprovada)
          <input type="number" step="0.01" name="valor_venda">
        </label>
        <button type="submit">Salvar</button>
      </form>
    `;
    res.send(layout('Pré-venda Detalhe', content, userInfo));
  } catch (err) {
    console.error(err);
    res.send(layout('Erro', `<p>Erro ao carregar pré-venda.</p>`));
  }
});

app.post('/parceiro/pre-vendas/:id/status', requireParceiro, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status, valor_venda } = req.body;

    const pv = await get(`SELECT * FROM pre_venda WHERE id = ?`, [id]);
    if (!pv) {
      return res.send(layout('Erro', `<p>Pré-venda não encontrada.</p>`));
    }

    await run(`UPDATE pre_venda SET status = ?, valor_venda = ? WHERE id = ?`, [
      status,
      valor_venda ? Number(valor_venda) : pv.valor_venda,
      id
    ]);

    if (status === 'APROVADA' && valor_venda) {
      const valor = Number(valor_venda);
      const comissao = valor * 0.05;
      await run(
        `INSERT INTO comissao (indicador_id, pre_venda_id, valor_base, percentual, valor_comissao, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [pv.indicador_id, pv.id, valor, 5, comissao, 'A_PAGAR']
      );
    }

    res.redirect('/parceiro/pre-vendas');
  } catch (err) {
    console.error(err);
    res.send(layout('Erro', `<p>Erro ao atualizar pré-venda.</p>`));
  }
});

// ===== ADMIN =====
app.get('/admin/login', (req, res) => {
  const content = `
    <h1>Login Admin</h1>
    <form method="POST" action="/admin/login">
      <label>E-mail
        <input type="email" name="email" required>
      </label>
      <label>Senha
        <input type="password" name="senha" required>
      </label>
      <button type="submit">Entrar</button>
    </form>
    <p class="muted">Usuário padrão: admin@indicons.com / 123456</p>
  `;
  res.send(layout('Login Admin', content));
});

app.post('/admin/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    const adm = await get(`SELECT * FROM admin WHERE email = ? AND senha = ?`, [email, senha]);
    if (!adm) {
      return res.send(layout('Erro', `<p>Credenciais inválidas.</p><a href="/admin/login">Tentar novamente</a>`));
    }
    req.session.adminId = adm.id;
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error(err);
    res.send(layout('Erro', `<p>Erro no login admin.</p>`));
  }
});

app.get('/admin/dashboard', requireAdmin, async (req, res) => {
  try {
    const adm = await get(`SELECT * FROM admin WHERE id = ?`, [req.session.adminId]);
    const userInfo = `<span>${adm.nome}</span> <span class="badge badge-admin">Admin</span> <a href="/logout">Sair</a>`;

    const totalPre = await get(`SELECT COUNT(*) as total FROM pre_venda`);
    const totalAprov = await get(`SELECT COUNT(*) as total FROM pre_venda WHERE status = 'APROVADA'`);
    const somaCom = await get(`SELECT IFNULL(SUM(valor_comissao),0) as total FROM comissao`);

    const content = `
      <h1>Dashboard Admin</h1>
      <p>
        <strong>Pré-vendas totais:</strong> ${totalPre.total}<br>
        <strong>Vendas aprovadas:</strong> ${totalAprov.total}<br>
        <strong>Comissões geradas:</strong> R$ ${somaCom.total.toFixed(2)}
      </p>
      <p>
        <a href="/admin/produtos">Gerenciar produtos</a> |
        <a href="/admin/indicadores">Ver indicadores</a> |
        <a href="/admin/comissoes">Ver comissões</a>
      </p>
    `;
    res.send(layout('Dashboard Admin', content, userInfo));
  } catch (err) {
    console.error(err);
    res.send(layout('Erro', `<p>Erro ao carregar dashboard admin.</p>`));
  }
});

app.get('/admin/produtos', requireAdmin, async (req, res) => {
  try {
    const adm = await get(`SELECT * FROM admin WHERE id = ?`, [req.session.adminId]);
    const userInfo = `<span>${adm.nome}</span> <span class="badge badge-admin">Admin</span> <a href="/logout">Sair</a>`;
    const prods = await all(`SELECT * FROM produto ORDER BY id`);

    let rows = prods.map(p => `
      <tr>
        <td>${p.id}</td>
        <td>${p.nome}</td>
        <td>${p.codigo}</td>
        <td>${p.administradora}</td>
        <td>${p.descricao || ''}</td>
      </tr>
    `).join('');
    if (!rows) rows = `<tr><td colspan="5">Nenhum produto.</td></tr>`;

    const content = `
      <h1>Produtos</h1>
      <table>
        <tr>
          <th>ID</th>
          <th>Nome</th>
          <th>Código</th>
          <th>Administradora</th>
          <th>Descrição</th>
        </tr>
        ${rows}
      </table>
      <h2>Novo produto</h2>
      <form method="POST" action="/admin/produtos">
        <label>Nome
          <input type="text" name="nome" required>
        </label>
        <label>Código
          <input type="text" name="codigo" required>
        </label>
        <label>Administradora
          <input type="text" name="administradora" required>
        </label>
        <label>Descrição
          <textarea name="descricao"></textarea>
        </label>
        <button type="submit">Adicionar</button>
      </form>
    `;
    res.send(layout('Produtos', content, userInfo));
  } catch (err) {
    console.error(err);
    res.send(layout('Erro', `<p>Erro ao carregar produtos.</p>`));
  }
});

app.post('/admin/produtos', requireAdmin, async (req, res) => {
  try {
    const { nome, codigo, administradora, descricao } = req.body;
    await run(
      `INSERT INTO produto (nome, codigo, administradora, descricao) VALUES (?, ?, ?, ?)`,
      [nome, codigo, administradora, descricao]
    );
    res.redirect('/admin/produtos');
  } catch (err) {
    console.error(err);
    res.send(layout('Erro', `<p>Erro ao adicionar produto (código pode estar duplicado).</p>`));
  }
});

app.get('/admin/indicadores', requireAdmin, async (req, res) => {
  try {
    const adm = await get(`SELECT * FROM admin WHERE id = ?`, [req.session.adminId]);
    const userInfo = `<span>${adm.nome}</span> <span class="badge badge-admin">Admin</span> <a href="/logout">Sair</a>`;
    const inds = await all(`SELECT * FROM indicador ORDER BY id`);

    let rows = inds.map(i => `
      <tr>
        <td>${i.id}</td>
        <td>${i.nome}</td>
        <td>${i.email}</td>
        <td>${i.cpf_cnpj}</td>
        <td>${i.pix}</td>
      </tr>
    `).join('');
    if (!rows) rows = `<tr><td colspan="5">Nenhum indicador.</td></tr>`;

    const content = `
      <h1>Indicadores</h1>
      <table>
        <tr>
          <th>ID</th>
          <th>Nome</th>
          <th>E-mail</th>
          <th>CPF/CNPJ</th>
          <th>Pix</th>
        </tr>
        ${rows}
      </table>
    `;
    res.send(layout('Indicadores', content, userInfo));
  } catch (err) {
    console.error(err);
    res.send(layout('Erro', `<p>Erro ao carregar indicadores.</p>`));
  }
});

app.get('/admin/comissoes', requireAdmin, async (req, res) => {
  try {
    const adm = await get(`SELECT * FROM admin WHERE id = ?`, [req.session.adminId]);
    const userInfo = `<span>${adm.nome}</span> <span class="badge badge-admin">Admin</span> <a href="/logout">Sair</a>`;
    const coms = await all(
      `SELECT c.*, i.nome AS indicador_nome
       FROM comissao c
       JOIN indicador i ON i.id = c.indicador_id
       ORDER BY c.id DESC`
    );

    let rows = coms.map(c => `
      <tr>
        <td>${c.id}</td>
        <td>${c.indicador_nome}</td>
        <td>${c.valor_base.toFixed(2)}</td>
        <td>${c.valor_comissao.toFixed(2)}</td>
        <td>${c.status}</td>
      </tr>
    `).join('');
    if (!rows) rows = `<tr><td colspan="5">Nenhuma comissão.</td></tr>`;

    const content = `
      <h1>Comissões</h1>
      <table>
        <tr>
          <th>ID</th>
          <th>Indicador</th>
          <th>Valor base</th>
          <th>Comissão (5%)</th>
          <th>Status</th>
        </tr>
        ${rows}
      </table>
      <p class="muted">Em uma próxima etapa podemos criar a ação de marcar comissão como PAGA.</p>
    `;
    res.send(layout('Comissões', content, userInfo));
  } catch (err) {
    console.error(err);
    res.send(layout('Erro', `<p>Erro ao carregar comissões.</p>`));
  }
});

// ===== LOGOUT =====
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// ===== INICIAR (primeiro inicializa DB, depois sobe servidor) =====
initDb().then(() => {
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`INDICONS com SQLite rodando em http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Erro ao inicializar o banco:', err);
});
