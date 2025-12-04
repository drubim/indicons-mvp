// ===============================================
// INDICONS – MVP COMPLETO COM HOME CLICÁVEL
// ===============================================
const express = require('express');
const session = require('express-session');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: 'indicons-secret',
    resave: false,
    saveUninitialized: true,
  })
);

// ===============================================
// BANCO DE DADOS EM MEMÓRIA (MVP)
// ===============================================
let produtos = [
  { id: 1, nome: "Consórcio Imobiliário", descricao: "Crédito para imóveis" },
  { id: 2, nome: "Consórcio Automóvel", descricao: "Crédito para carro" }
];

let indicadores = [];
let parceiros = [
  { id: 1, nome: "Parceiro Oficial", email: "parceiro@indicons.com", senha: "123456" }
];
let admins = [
  { id: 1, nome: "Admin", email: "admin@indicons.com", senha: "123456" }
];

let preVendas = [];
let comissoes = [];

let indicadorIdCounter = 1;
let preVendaIdCounter = 1;

// ===============================================
// TEMPLATE HTML BÁSICO
// ===============================================
function layout(title, content, userInfo = '') {
  return `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
      body { font-family: Arial; margin: 20px; }
      nav a { margin-right: 15px; font-weight: bold; }
      input, select { margin: 6px 0; padding: 6px; width: 250px; }
      button { padding: 8px 16px; }
      .card { padding: 20px; background: #f5f5f5; margin: 10px 0; border-radius: 8px; }
      .flow li { margin-bottom: 6px; }
    </style>
  </head>
  <body>
    ${userInfo}
    <hr>
    ${content}
  </body>
  </html>
  `;
}

// ===============================================
// HOME – AGORA COM LINKS CLICÁVEIS
// ===============================================
app.get('/', (req, res) => {
  const userInfo = `
    <nav>
      <a href="/">Home</a>
      <a href="/indicador/login">Área do Indicador</a>
      <a href="/parceiro/login">Área do Parceiro</a>
      <a href="/admin/login">Área Admin</a>
    </nav>
  `;
  const content = `
    <h1>INDICONS – Fluxo completo de indicação e pré-venda de consórcios</h1>

    <h2>Acessos rápidos</h2>
    <ul>
      <li><a href="/indicador/registrar">Cadastrar novo INDICADOR</a></li>
      <li><a href="/indicador/login">Login do INDICADOR</a></li>
      <li><a href="/parceiro/login">Login do PARCEIRO</a></li>
      <li><a href="/admin/login">Login do ADMIN</a></li>
    </ul>

    <h2>Como funciona</h2>
    <ul class="flow">
      <li>1. Indicador se cadastra e obtém seus links de produtos.</li>
      <li>2. Cliente abre o link e envia uma pré-adesão.</li>
      <li>3. Parceiro recebe a pré-venda e finaliza a venda no sistema da administradora.</li>
      <li>4. Parceiro marca “Boleto Emitido” e depois “Venda Finalizada”.</li>
      <li>5. Sistema calcula comissão de 5% para o indicador.</li>
    </ul>

    <h2>Logins de Teste</h2>
    <p><strong>Admin:</strong> admin@indicons.com / 123456</p>
    <p><strong>Parceiro:</strong> parceiro@indicons.com / 123456</p>
  `;
  res.send(layout("INDICONS - Home", content, userInfo));
});

// ===============================================
// INDICADOR – CADASTRO
// ===============================================
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
  res.send(layout("Registrar Indicador", content));
});

app.post('/indicador/registrar', (req, res) => {
  const { nome, email, senha } = req.body;

  indicadores.push({
    id: indicadorIdCounter++,
    nome,
    email,
    senha
  });

  res.redirect('/indicador/login');
});

// ===============================================
// INDICADOR – LOGIN
// ===============================================
app.get('/indicador/login', (req, res) => {
  const content = `
    <h2>Login do Indicador</h2>
    <form method="POST">
      <input name="email" placeholder="E-mail" required><br>
      <input name="senha" type="password" placeholder="Senha" required><br>
      <button type="submit">Entrar</button>
    </form>
  `;
  res.send(layout("Login Indicador", content));
});

app.post('/indicador/login', (req, res) => {
  const { email, senha } = req.body;

  const ind = indicadores.find(i => i.email === email && i.senha === senha);
  if (!ind) return res.send("Login inválido.");

  req.session.indicador = ind;
  res.redirect('/indicador/dashboard');
});

// ===============================================
// INDICADOR – DASHBOARD
// ===============================================
app.get('/indicador/dashboard', (req, res) => {
  if (!req.session.indicador) return res.redirect('/indicador/login');

  const content = `
    <h2>Bem-vindo, ${req.session.indicador.nome}</h2>
    <p><a href="/indicador/links">Meus links de produtos</a></p>
    <p><a href="/indicador/indicacoes">Minhas indicações</a></p>
  `;
  res.send(layout("Dashboard Indicador", content));
});

// ===============================================
// INDICADOR – LINKS DE PRODUTOS
// ===============================================
app.get('/indicador/links', (req, res) => {
  if (!req.session.indicador) return res.redirect('/indicador/login');

  let html = `<h2>Meus links de produtos</h2>`;

  produtos.forEach(p => {
    html += `
      <div class="card">
        <h3>${p.nome}</h3>
        <p>${p.descricao}</p>
        <p><strong>Link:</strong><br>
        <code>https://indicons.onrender.com/consorcio?i=${req.session.indicador.id}&p=${p.id}</code>
        </p>
      </div>
    `;
  });

  res.send(layout("Links dos Produtos", html));
});

// ===============================================
// CLIENTE – PÁGINA DO PRODUTO
// ===============================================
app.get('/consorcio', (req, res) => {
  const { i, p } = req.query;

  const indicador = indicadores.find(x => x.id == i);
  const produto = produtos.find(x => x.id == p);

  if (!indicador || !produto) return res.send("Link inválido.");

  const content = `
    <h2>${produto.nome}</h2>
    <p>${produto.descricao}</p>

    <h3>Pré-adesão</h3>
    <form method="POST" action="/consorcio">
      <input type="hidden" name="indicador_id" value="${i}">
      <input type="hidden" name="produto_id" value="${p}">

      <input name="nome" placeholder="Nome" required><br>
      <input name="telefone" placeholder="Telefone" required><br>
      <input name="email" placeholder="E-mail" required><br>
      <button type="submit">Confirmar pré-adesão</button>
    </form>
  `;

  res.send(layout("Pré-venda", content));
});

app.post('/consorcio', (req, res) => {
  const { indicador_id, produto_id, nome, telefone, email } = req.body;

  preVendas.push({
    id: preVendaIdCounter++,
    indicador_id,
    produto_id,
    nome,
    telefone,
    email,
    status: "Pré-adesão enviada"
  });

  res.send(`<h2>Pré-adesão registrada!</h2><p>O parceiro entrará em contato.</p>`);
});

// ===============================================
// PARCEIRO – LOGIN
// ===============================================
app.get('/parceiro/login', (req, res) => {
  const content = `
    <h2>Login do Parceiro</h2>
    <form method="POST">
      <input name="email" placeholder="E-mail" required><br>
      <input name="senha" type="password" placeholder="Senha" required><br>
      <button type="submit">Entrar</button>
    </form>
  `;
  res.send(layout("Login Parceiro", content));
});

app.post('/parceiro/login', (req, res) => {
  const p = parceiros.find(x => x.email === req.body.email && x.senha === req.body.senha);
  if (!p) return res.send("Login inválido.");
  req.session.parceiro = p;
  res.redirect('/parceiro/pre-vendas');
});

// ===============================================
// PARCEIRO – LISTA DE PRÉ-VENDAS
// ===============================================
app.get('/parceiro/pre-vendas', (req, res) => {
  if (!req.session.parceiro) return res.redirect('/parceiro/login');

  let html = `<h2>Pré-vendas pendentes</h2>`;

  preVendas.forEach(v => {
    html += `
      <div class="card">
        <strong>${v.nome}</strong><br>
        Produto: ${v.produto_id}<br>
        Telefone: ${v.telefone}<br>
        Status: ${v.status}<br>
        <form method="POST" action="/parceiro/atualizar">
          <input type="hidden" name="id" value="${v.id}">
          <select name="status">
            <option>Em atendimento</option>
            <option>Boleto emitido</option>
            <option>Aprovada / Venda finalizada</option>
          </select><br>
          <input name="valor" placeholder="Valor da venda (opcional)">
          <button type="submit">Atualizar</button>
        </form>
      </div>
    `;
  });

  res.send(layout("Pré-vendas Parceiro", html));
});

// ===============================================
// PARCEIRO – ATUALIZA STATUS
// ===============================================
app.post('/parceiro/atualizar', (req, res) => {
  const { id, status, valor } = req.body;

  const venda = preVendas.find(v => v.id == id);
  venda.status = status;

  if (status === "Aprovada / Venda finalizada" && valor) {
    comissoes.push({
      indicador_id: venda.indicador_id,
      valor: valor * 0.05,
      venda: valor
    });
  }

  res.redirect('/parceiro/pre-vendas');
});

// ===============================================
// ADMIN – LOGIN
// ===============================================
app.get('/admin/login', (req, res) => {
  const content = `
    <h2>Login do Admin</h2>
    <form method="POST">
      <input name="email" placeholder="E-mail" required><br>
      <input name="senha" type="password" placeholder="Senha" required><br>
      <button type="submit">Entrar</button>
    </form>
  `;
  res.send(layout("Admin Login", content));
});

app.post('/admin/login', (req, res) => {
  const adm = admins.find(x => x.email === req.body.email && x.senha === req.body.senha);
  if (!adm) return res.send("Login inválido.");
  req.session.admin = adm;
  res.redirect('/admin/dashboard');
});

// ===============================================
// ADMIN – DASHBOARD
// ===============================================
app.get('/admin/dashboard', (req, res) => {
  if (!req.session.admin) return res.redirect('/admin/login');

  let html = `<h2>Painel do Admin</h2>`;

  html += `<h3>Comissões</h3>`;
  comissoes.forEach(c => {
    const ind = indicadores.find(i => i.id == c.indicador_id);
    html += `
      <div class="card">
        Indicador: ${ind.nome}<br>
        Venda: ${c.venda}<br>
        Comissão: ${c.valor}
      </div>
    `;
  });

  res.send(layout("Admin Dashboard", html));
});

// ===============================================
// SUBIR SERVIDOR
// ===============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
