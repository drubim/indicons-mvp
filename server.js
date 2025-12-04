// ===============================================
// INDICONS – MVP COMPLETO COM SQLite
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
// Layout
// -----------------------------------------------
function layout(title, content, userNav = '') {
  return `
  <!DOCTYPE html>
  <html lang="pt-br">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background:#f3f4f6; }
        header { background:#0f766e; color:white; padding:10px 20px; }
        header nav a { color:white; margin-right:10px; text-decoration:none; font-weight:bold; }
        header nav a:hover { text-decoration:underline; }
        .container { max-width:900px; margin:20px auto; background:white; padding:20px; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.1); }
        h1,h2,h3 { margin-top:0; }
        input, select { margin:5px 0; padding:6px; width:260px; }
        button { padding:6px 14px; margin-top:8px; background:#0f766e; color:white; border:none; border-radius:4px; cursor:pointer; }
        button:hover { background:#115e59; }
        .card { background:#f9fafb; padding:10px 14px; border-radius:6px; margin-bottom:10px; }
        .flow li { margin-bottom:4px; }
        a { color:#0f766e; }
      </style>
    </head>
    <body>
      <header>
        <nav>
          <a href="/">Home</a>
          <a href="/indicador/login">Indicador</a>
          <a href="/parceiro/login">Parceiro</a>
          <a href="/admin/login">Admin</a>
        </nav>
        ${userNav}
      </header>
      <div class="container">
        ${content}
      </div>
    </body>
  </html>
  `;
}

// -----------------------------------------------
// HOME
// -----------------------------------------------
app.get('/', (req, res) => {
  const content = `
    <h1>INDICONS – Fluxo completo de indicação e pré-venda de consórcios (SQLite)</h1>

    <h2>Acessos rápidos</h2>
    <ul>
      <li><a href="/indicador/registrar">Cadastrar novo INDICADOR</a></li>
      <li><a href="/indicador/login">Login do INDICADOR</a></li>
      <li><a href="/parceiro/login">Login do PARCEIRO</a></li>
      <li><a href="/admin/login">Login do ADMIN</a></li>
    </ul>

    <h2>Como funciona</h2>
    <ul class="flow">
      <li>1. Indicador se cadastra e obtém links de produtos.</li>
      <li>2. Cliente abre o link, preenche pré-adesão.</li>
      <li>3. Parceiro recebe a pré-venda e finaliza no sistema da administradora.</li>
      <li>4. Parceiro marca venda aprovada com valor.</li>
      <li>5. Sistema registra comissão de 5% para o indicador.</li>
    </ul>

    <h2>Logins de teste</h2>
    <p><strong>Admin:</strong> admin@indicons.com / 123456</p>
    <p><strong>Parceiro:</strong> parceiro@indicons.com / 123456</p>
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
    <h2>Cadastrar Indicador</h2>
    <form method="POST">
      <input name="nome" placeholder="Nome" required><br>
      <input name="email" placeholder="E-mail" required><br>
      <input name="senha" type="password" placeholder="Senha" required><br>
      <button type="submit">Registrar</button>
    </form>
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
    res.send('Erro ao cadastrar indicador (talvez e-mail já usado).');
  }
});

app.get('/indicador/login', (req, res) => {
  const content = `
    <h2>Login do Indicador</h2>
    <form method="POST">
      <input name="email" placeholder="E-mail" required><br>
      <input name="senha" type="password" placeholder="Senha" required><br>
      <button type="submit">Entrar</button>
    </form>
  `;
  res.send(layout('Login Indicador', content));
});

app.post('/indicador/login', async (req, res) => {
  const { email, senha } = req.body;
  const ind = await dbGet(
    'SELECT * FROM indicadores WHERE email = ? AND senha = ?',
    [email, senha]
  );
  if (!ind) return res.send('Login inválido.');

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
    <h2>Bem-vindo, ${req.session.indicadorNome}</h2>
    <p><a href="/indicador/links">Meus links de produtos</a></p>

    <h3>Minhas pré-vendas</h3>
    ${
      preVendas.length === 0
        ? '<p>Nenhuma pré-venda ainda.</p>'
        : preVendas
            .map(
              (v) => `
        <div class="card">
          <strong>${v.nome_cliente}</strong> – ${v.produto_nome}<br>
          Status: ${v.status}<br>
          Telefone: ${v.telefone_cliente}
        </div>`
            )
            .join('')
    }
  `;
  const nav = `<div>Indicador: ${req.session.indicadorNome} | <a href="/logout">Sair</a></div>`;
  res.send(layout('Dashboard Indicador', content, nav));
});

// Links de produtos
app.get('/indicador/links', requireIndicador, async (req, res) => {
  const produtos = await dbAll('SELECT * FROM produtos ORDER BY id');
  const baseUrl = process.env.BASE_URL || 'https://indicons.onrender.com';

  const content = `
    <h2>Meus links de produtos</h2>
    ${produtos
      .map((p) => {
        const link = `${baseUrl}/consorcio?i=${req.session.indicadorId}&p=${p.id}`;
        return `
        <div class="card">
          <strong>${p.nome}</strong><br>
          ${p.descricao || ''}<br>
          Link:<br>
          <code>${link}</code>
        </div>`;
      })
      .join('')}
  `;
  const nav = `<div>Indicador: ${req.session.indicadorNome} | <a href="/logout">Sair</a></div>`;
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
    <h2>${produto.nome}</h2>
    <p>${produto.descricao || ''}</p>
    <p>Você está sendo atendido por: <strong>${indicador.nome}</strong></p>

    <h3>Pré-adesão</h3>
    <form method="POST" action="/consorcio">
      <input type="hidden" name="indicador_id" value="${indicador.id}">
      <input type="hidden" name="produto_id" value="${produto.id}">
      <input name="nome" placeholder="Nome completo" required><br>
      <input name="telefone" placeholder="Telefone / WhatsApp" required><br>
      <input name="email" placeholder="E-mail" required><br>
      <button type="submit">Confirmar pré-adesão</button>
    </form>
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
  res.send('<h2>Pré-adesão registrada!</h2><p>Um parceiro entrará em contato.</p>');
});

// -----------------------------------------------
// PARCEIRO – LOGIN / PRÉ-VENDAS
// -----------------------------------------------
app.get('/parceiro/login', (req, res) => {
  const content = `
    <h2>Login do Parceiro</h2>
    <form method="POST">
      <input name="email" placeholder="E-mail" required><br>
      <input name="senha" type="password" placeholder="Senha" required><br>
      <button type="submit">Entrar</button>
    </form>
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
  res.send('Login inválido.');
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
    <h2>Pré-vendas</h2>
    ${
      rows.length === 0
        ? '<p>Nenhuma pré-venda.</p>'
        : rows
            .map(
              (v) => `
      <div class="card">
        <strong>${v.nome_cliente}</strong> – ${v.produto_nome}<br>
        Indicador: ${v.indicador_nome}<br>
        Telefone: ${v.telefone_cliente} | E-mail: ${v.email_cliente}<br>
        Status atual: ${v.status}<br>
        <form method="POST" action="/parceiro/pre-vendas/${v.id}/status">
          <select name="status">
            <option value="EM_ATENDIMENTO">Em atendimento</option>
            <option value="BOLETO_EMITIDO">Boleto emitido</option>
            <option value="APROVADA">Aprovada / Venda finalizada</option>
            <option value="NAO_FECHOU">Não fechou</option>
          </select><br>
          <input name="valor_venda" placeholder="Valor da venda (se aprovada)"><br>
          <button type="submit">Atualizar</button>
        </form>
      </div>
    `
            )
            .join('')
    }
  `;
  const nav = `<div>Parceiro: ${req.session.parceiroNome} | <a href="/logout">Sair</a></div>`;
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
    // buscar pre_venda para pegar indicador_id
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
    <h2>Login Admin</h2>
    <form method="POST">
      <input name="email" placeholder="E-mail" required><br>
      <input name="senha" type="password" placeholder="Senha" required><br>
      <button type="submit">Entrar</button>
    </form>
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
  res.send('Login inválido.');
});

app.get('/admin/dashboard', requireAdmin, async (req, res) => {
  const coms = await dbAll(
    `SELECT c.*, i.nome AS indicador_nome
     FROM comissoes c
     JOIN indicadores i ON i.id = c.indicador_id
     ORDER BY c.id DESC`
  );

  const content = `
    <h2>Painel do Admin</h2>
    <h3>Comissões</h3>
    ${
      coms.length === 0
        ? '<p>Nenhuma comissão registrada.</p>'
        : coms
            .map(
              (c) => `
      <div class="card">
        Indicador: ${c.indicador_nome}<br>
        Valor da venda: R$ ${c.valor_venda.toFixed(2)}<br>
        Comissão (5%): R$ ${c.valor_comissao.toFixed(2)}
      </div>
    `
            )
            .join('')
    }
  `;
  const nav = `<div>Admin: ${req.session.adminNome} | <a href="/logout">Sair</a></div>`;
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
