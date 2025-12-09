// server.js - INDICONS com layout profissional (Bootstrap) e fluxo completo
const express = require("express");
const session = require("express-session");
const app = express();

// Configuração básica
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: "indicons-segredo-simples",
    resave: false,
    saveUninitialized: true,
  })
);

// "Banco" em memória (MVP) - em produção trocar por banco real
let indicadores = [];
let parceiros = [];
let admins = [];
let produtos = [];
let preVendas = [];
let comissoes = [];

let nextIndicadorId = 1;
let nextParceiroId = 1;
let nextAdminId = 1;
let nextProdutoId = 1;
let nextPreVendaId = 1;
let nextComissaoId = 1;

// Usuários padrão para testes
admins.push({
  id: nextAdminId++,
  nome: "Admin Padrão",
  email: "admin@indicons.com",
  senha: "123456",
});

parceiros.push({
  id: nextParceiroId++,
  nome: "Parceiro Padrão",
  email: "parceiro@indicons.com",
  senha: "123456",
});

// Produtos exemplo
produtos.push(
  {
    id: nextProdutoId++,
    nome: "Consórcio Imóvel - Embracon",
    codigo: "IMOVEL01",
    administradora: "Embracon",
    descricao:
      "Cartas de crédito para aquisição de imóveis residenciais e comerciais.",
  },
  {
    id: nextProdutoId++,
    nome: "Consórcio Auto - Porto Seguro",
    codigo: "AUTO01",
    administradora: "Porto Seguro",
    descricao: "Consórcio para veículos leves novos e seminovos.",
  },
  {
    id: nextProdutoId++,
    nome: "Consórcio Serviços - Embracon",
    codigo: "SERVICO01",
    administradora: "Embracon",
    descricao:
      "Consórcio para reformas, educação, cirurgias e outros serviços.",
  }
);

// Middlewares de autenticação
function requireIndicador(req, res, next) {
  if (req.session && req.session.indicadorId) return next();
  return res.redirect("/indicador/login");
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.adminId) return next();
  return res.redirect("/admin/login");
}

function requireParceiro(req, res, next) {
  if (req.session && req.session.parceiroId) return next();
  return res.redirect("/parceiro/login");
}

// Layout com Bootstrap 5
function layout(title, content, req) {
  let userBadge = "";
  if (req.session?.indicadorId) {
    const ind = indicadores.find((i) => i.id === req.session.indicadorId);
    if (ind) {
      userBadge = `<span class="badge rounded-pill bg-primary-subtle text-primary me-2">Indicador</span><span class="me-3">${ind.nome}</span><a href="/logout" class="btn btn-outline-light btn-sm">Sair</a>`;
    }
  } else if (req.session?.parceiroId) {
    const par = parceiros.find((p) => p.id === req.session.parceiroId);
    if (par) {
      userBadge = `<span class="badge rounded-pill bg-danger-subtle text-danger me-2">Parceiro</span><span class="me-3">${par.nome}</span><a href="/logout" class="btn btn-outline-light btn-sm">Sair</a>`;
    }
  } else if (req.session?.adminId) {
    const adm = admins.find((a) => a.id === req.session.adminId);
    if (adm) {
      userBadge = `<span class="badge rounded-pill bg-success-subtle text-success me-2">Admin</span><span class="me-3">${adm.nome}</span><a href="/logout" class="btn btn-outline-light btn-sm">Sair</a>`;
    }
  } else {
    userBadge = `<a href="/indicador/login" class="btn btn-outline-light btn-sm me-2">Indicador</a>
                 <a href="/parceiro/login" class="btn btn-outline-light btn-sm me-2">Parceiro</a>
                 <a href="/admin/login" class="btn btn-outline-light btn-sm">Admin</a>`;
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <!-- Bootstrap CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    body { background-color:#f3f4f6; }
    .navbar-brand span.logo-mark {
      display:inline-block;
      width:26px;
      height:26px;
      border-radius:8px;
      background:linear-gradient(135deg,#0f766e,#22c55e);
      margin-right:8px;
      position:relative;
      overflow:hidden;
    }
    .navbar-brand span.logo-mark::after {
      content:"›";
      position:absolute;
      color:white;
      font-weight:bold;
      font-size:18px;
      top:1px;
      left:7px;
    }
    .card-shadow { box-shadow:0 4px 12px rgba(15,118,110,0.08); }
    .status-badge {
      font-size:0.75rem;
      border-radius:999px;
      padding:2px 8px;
    }
  </style>
</head>
<body>
  <nav class="navbar navbar-expand-lg navbar-dark bg-teal" style="background:#0f766e;">
    <div class="container-fluid px-4">
      <a class="navbar-brand d-flex align-items-center" href="/">
        <span class="logo-mark"></span>
        <span class="fw-bold">INDICONS</span>
        <span class="ms-2 small">indicação inteligente de consórcios</span>
      </a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMain">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navMain">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item"><a class="nav-link" href="/">Início</a></li>
          <li class="nav-item"><a class="nav-link" href="/indicador/login">Indicador</a></li>
          <li class="nav-item"><a class="nav-link" href="/parceiro/login">Parceiro</a></li>
          <li class="nav-item"><a class="nav-link" href="/admin/login">Admin</a></li>
        </ul>
        <div class="d-flex align-items-center">
          ${userBadge}
        </div>
      </div>
    </div>
  </nav>

  <main class="container my-4">
    ${content}
  </main>

  <footer class="text-center text-muted small py-3">
    INDICONS © ${new Date().getFullYear()} • Plataforma de indicação e pré-venda de consórcios
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
}

// ================= HOME ====================
app.get("/", (req, res) => {
  const content = `
  <div class="row g-4">
    <div class="col-lg-7">
      <div class="card card-shadow border-0">
        <div class="card-body p-4">
          <h1 class="h3 mb-3">Automatize indicações de consórcio com segurança e controle</h1>
          <p class="text-muted mb-3">
            O INDICONS permite que pessoas físicas e jurídicas indiquem clientes para consórcios
            de administradoras parceiras. Cada indicação gera uma pré-venda, atendida por um parceiro autorizado,
            e o indicador recebe <strong>5% de comissão</strong> sobre as vendas aprovadas.
          </p>
          <div class="row g-3 mb-3">
            <div class="col-md-4">
              <div class="border rounded-3 p-2 h-100">
                <div class="fw-semibold small">Indicador</div>
                <div class="small text-muted">Gera links, envia para contatos e acompanha comissões.</div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="border rounded-3 p-2 h-100">
                <div class="fw-semibold small">Parceiro</div>
                <div class="small text-muted">Atende pré-vendas e finaliza no sistema da administradora.</div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="border rounded-3 p-2 h-100">
                <div class="fw-semibold small">Admin</div>
                <div class="small text-muted">Gerencia produtos, indicadores, parceiros e comissões.</div>
              </div>
            </div>
          </div>

          <div class="d-flex flex-wrap gap-2 mb-3">
            <a href="/indicador/registrar" class="btn btn-teal btn-lg" style="background:#0f766e;border:none;">
              Quero ser indicador
            </a>
            <a href="/indicador/login" class="btn btn-outline-teal btn-lg" style="border-color:#0f766e;color:#0f766e;">
              Já sou indicador
            </a>
          </div>

          <div class="alert alert-info small mb-0">
            <strong>Fluxo completo:</strong> indicador gera link → cliente preenche pré-adesão →
            parceiro finaliza no sistema da administradora → INDICONS registra a venda e calcula a comissão
            de 5% para o indicador.
          </div>
        </div>
      </div>
    </div>

    <div class="col-lg-5">
      <div class="card border-0 mb-3">
        <div class="card-body p-4">
          <h2 class="h5 mb-3">Acesso rápido</h2>
          <div class="list-group small">
            <a href="/indicador/login" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
              Área do Indicador
              <span class="badge bg-primary-subtle text-primary rounded-pill">Indicação & comissão</span>
            </a>
            <a href="/parceiro/login" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
              Área do Parceiro
              <span class="badge bg-danger-subtle text-danger rounded-pill">Atendimento & fechamento</span>
            </a>
            <a href="/admin/login" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
              Área Administrativa
              <span class="badge bg-success-subtle text-success rounded-pill">Gestão & relatórios</span>
            </a>
          </div>
          <hr class="my-3">
          <p class="text-muted small mb-1">Logins de teste:</p>
          <ul class="small text-muted mb-0">
            <li>Admin: <code>admin@indicons.com</code> / <code>123456</code></li>
            <li>Parceiro: <code>parceiro@indicons.com</code> / <code>123456</code></li>
          </ul>
        </div>
      </div>

      <div class="card border-0 card-shadow">
        <div class="card-body p-3">
          <h2 class="h6 mb-2">Produtos de consórcio (exemplo)</h2>
          <ul class="list-unstyled small mb-0">
            ${produtos
              .map(
                (p) => `
              <li class="mb-1">
                <span class="fw-semibold">${p.nome}</span>
                <span class="badge bg-light text-muted border ms-1">${p.administradora}</span><br>
                <span class="text-muted">${p.descricao}</span>
              </li>`
              )
              .join("")}
          </ul>
        </div>
      </div>
    </div>
  </div>
  `;
  res.send(layout("INDICONS - Início", content, req));
});

// ================= INDICADOR ====================

// Cadastro
app.get("/indicador/registrar", (req, res) => {
  const content = `
  <div class="row justify-content-center">
    <div class="col-lg-6">
      <div class="card card-shadow border-0">
        <div class="card-body p-4">
          <h1 class="h4 mb-3">Cadastro de Indicador</h1>
          <p class="text-muted small">
            Cadastre-se para gerar links de consórcios, indicar clientes e receber <strong>5% de comissão</strong> em cada venda aprovada.
          </p>
          <form method="POST" action="/indicador/registrar" class="row g-3">
            <div class="col-12">
              <label class="form-label">Nome completo</label>
              <input type="text" class="form-control" name="nome" required>
            </div>
            <div class="col-12">
              <label class="form-label">E-mail</label>
              <input type="email" class="form-control" name="email" required>
            </div>
            <div class="col-md-6">
              <label class="form-label">CPF/CNPJ</label>
              <input type="text" class="form-control" name="cpfCnpj" required>
            </div>
            <div class="col-md-6">
              <label class="form-label">Chave Pix (para pagamento da comissão)</label>
              <input type="text" class="form-control" name="pix" required>
            </div>
            <div class="col-12">
              <label class="form-label">Senha</label>
              <input type="password" class="form-control" name="senha" required>
            </div>
            <div class="col-12 d-flex justify-content-between align-items-center">
              <button type="submit" class="btn" style="background:#0f766e;color:white;">Cadastrar</button>
              <a href="/indicador/login" class="small">Já sou indicador</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>`;
  res.send(layout("Cadastro Indicador", content, req));
});

app.post("/indicador/registrar", (req, res) => {
  const { nome, email, cpfCnpj, pix, senha } = req.body;
  if (indicadores.some((i) => i.email === email)) {
    const content = `
    <div class="alert alert-danger">Já existe um indicador com esse e-mail.</div>
    <a href="/indicador/login" class="btn btn-sm btn-outline-secondary">Ir para login</a>`;
    return res.send(layout("Erro", content, req));
  }
  const ind = {
    id: nextIndicadorId++,
    nome,
    email,
    cpfCnpj,
    pix,
    senha,
  };
  indicadores.push(ind);
  const content = `
  <div class="alert alert-success">Cadastro realizado com sucesso. Agora você já pode acessar sua área de indicador.</div>
  <a href="/indicador/login" class="btn btn-sm btn-success">Ir para login</a>`;
  res.send(layout("Cadastro OK", content, req));
});

// Login indicador
app.get("/indicador/login", (req, res) => {
  const content = `
  <div class="row justify-content-center">
    <div class="col-md-5">
      <div class="card card-shadow border-0">
        <div class="card-body p-4">
          <h1 class="h4 mb-3">Login do Indicador</h1>
          <form method="POST" action="/indicador/login" class="row g-3">
            <div class="col-12">
              <label class="form-label">E-mail</label>
              <input type="email" class="form-control" name="email" required>
            </div>
            <div class="col-12">
              <label class="form-label">Senha</label>
              <input type="password" class="form-control" name="senha" required>
            </div>
            <div class="col-12 d-flex justify-content-between align-items-center">
              <button type="submit" class="btn btn-primary">Entrar</button>
              <a href="/indicador/registrar" class="small">Quero me cadastrar</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>`;
  res.send(layout("Login Indicador", content, req));
});

app.post("/indicador/login", (req, res) => {
  const { email, senha } = req.body;
  const ind = indicadores.find((i) => i.email === email && i.senha === senha);
  if (!ind) {
    const content = `
    <div class="alert alert-danger">Credenciais inválidas.</div>
    <a href="/indicador/login" class="btn btn-sm btn-outline-secondary">Tentar novamente</a>`;
    return res.send(layout("Erro login", content, req));
  }
  req.session.indicadorId = ind.id;
  res.redirect("/indicador/dashboard");
});

// Dashboard indicador
app.get("/indicador/dashboard", requireIndicador, (req, res) => {
  const ind = indicadores.find((i) => i.id === req.session.indicadorId);
  const minhasPreVendas = preVendas.filter((pv) => pv.indicadorId === ind.id);
  const minhasComissoes = comissoes.filter((c) => c.indicadorId === ind.id);

  const totalAPagar = minhasComissoes
    .filter((c) => c.status === "A_PAGAR")
    .reduce((sum, c) => sum + c.valorComissao, 0);

  const totalPago = minhasComissoes
    .filter((c) => c.status === "PAGA")
    .reduce((sum, c) => sum + c.valorComissao, 0);

  let linhasPreVendas = minhasPreVendas
    .map((pv) => {
      const prod = produtos.find((p) => p.id === pv.produtoId);
      return `
      <tr>
        <td>${pv.id}</td>
        <td>${pv.nomeCliente}</td>
        <td>${prod ? prod.nome : "-"}</td>
        <td><span class="status-badge bg-light border text-muted">${pv.status}</span></td>
        <td>${pv.valorCarta ? "R$ " + pv.valorCarta.toFixed(2) : "-"}</td>
        <td>${pv.valorVenda ? "R$ " + pv.valorVenda.toFixed(2) : "-"}</td>
      </tr>`;
    })
    .join("");

  if (!linhasPreVendas) {
    linhasPreVendas = `<tr><td colspan="6" class="text-center text-muted">Nenhuma pré-venda gerada ainda.</td></tr>`;
  }

  const content = `
  <div class="mb-3 d-flex justify-content-between align-items-center">
    <h1 class="h4 mb-0">Painel do Indicador</h1>
    <a href="/indicador/links" class="btn btn-sm btn-success">Meus links de indicação</a>
  </div>

  <div class="row g-3 mb-4">
    <div class="col-md-4">
      <div class="card border-0 card-shadow">
        <div class="card-body">
          <div class="text-muted small mb-1">Comissão a receber</div>
          <div class="h5 mb-0">R$ ${totalAPagar.toFixed(2)}</div>
        </div>
      </div>
    </div>
    <div class="col-md-4">
      <div class="card border-0 card-shadow">
        <div class="card-body">
          <div class="text-muted small mb-1">Comissão já paga</div>
          <div class="h5 mb-0">R$ ${totalPago.toFixed(2)}</div>
        </div>
      </div>
    </div>
    <div class="col-md-4">
      <div class="card border-0 card-shadow">
        <div class="card-body">
          <div class="text-muted small mb-1">Total de pré-vendas</div>
          <div class="h5 mb-0">${minhasPreVendas.length}</div>
        </div>
      </div>
    </div>
  </div>

  <h2 class="h5 mb-2">Minhas indicações / pré-vendas</h2>
  <div class="table-responsive">
    <table class="table table-sm align-middle">
      <thead class="table-light">
        <tr>
          <th>#</th>
          <th>Cliente</th>
          <th>Produto</th>
          <th>Status</th>
          <th>Valor carta</th>
          <th>Valor venda</th>
        </tr>
      </thead>
      <tbody>
        ${linhasPreVendas}
      </tbody>
    </table>
  </div>`;
  res.send(layout("Dashboard Indicador", content, req));
});

// Links de indicação
app.get("/indicador/links", requireIndicador, (req, res) => {
  const ind = indicadores.find((i) => i.id === req.session.indicadorId);

  let linhas = produtos
    .map((p) => {
      const link = `https://app.indicons.com.br/consorcio?i=${ind.id}&p=${p.id}`;
      // para ambiente local use: http://localhost:3000/consorcio?...
      return `
      <tr>
        <td>${p.id}</td>
        <td>${p.nome}</td>
        <td>${p.administradora}</td>
        <td>${p.descricao}</td>
        <td><input type="text" class="form-control form-control-sm" value="${link}" readonly></td>
      </tr>`;
    })
    .join("");

  if (!linhas) {
    linhas = `<tr><td colspan="5" class="text-center text-muted">Nenhum produto cadastrado.</td></tr>`;
  }

  const content = `
  <div class="mb-3 d-flex justify-content-between align-items-center">
    <h1 class="h5 mb-0">Meus links de indicação</h1>
    <a href="/indicador/dashboard" class="btn btn-sm btn-outline-secondary">Voltar ao painel</a>
  </div>
  <p class="text-muted small">
    Copie o link do produto e envie para seus contatos via WhatsApp, redes sociais ou e-mail.
    Cada cliente que preencher a pré-adesão ficará automaticamente vinculado a você.
  </p>
  <div class="table-responsive">
    <table class="table table-sm align-middle">
      <thead class="table-light">
        <tr>
          <th>ID</th>
          <th>Produto</th>
          <th>Administradora</th>
          <th>Descrição</th>
          <th>Link de indicação</th>
        </tr>
      </thead>
      <tbody>
        ${linhas}
      </tbody>
    </table>
  </div>`;
  res.send(layout("Links Indicador", content, req));
});

// ================= FLUXO CLIENTE ====================

app.get("/consorcio", (req, res) => {
  const { i, p } = req.query;
  const indicador = indicadores.find((ind) => ind.id === Number(i));
  const produto = produtos.find((prod) => prod.id === Number(p));

  if (!indicador || !produto) {
    const content = `<div class="alert alert-danger">Link inválido ou expirado.</div>`;
    return res.send(layout("Erro link", content, req));
  }

  const content = `
  <div class="row justify-content-center">
    <div class="col-lg-7">
      <div class="card card-shadow border-0 mb-3">
        <div class="card-body p-4">
          <h1 class="h4 mb-1">${produto.nome}</h1>
          <div class="text-muted small mb-2">
            Administradora: <strong>${produto.administradora}</strong><br>
            Indicador: <strong>${indicador.nome}</strong>
          </div>
          <p class="small text-muted">${produto.descricao}</p>
          <hr>
          <form method="POST" action="/consorcio" class="row g-3">
            <input type="hidden" name="indicadorId" value="${indicador.id}">
            <input type="hidden" name="produtoId" value="${produto.id}">
            <div class="col-md-6">
              <label class="form-label">Valor da carta (R$)</label>
              <input type="number" class="form-control" name="valorCarta" required>
            </div>
            <div class="col-md-6">
              <label class="form-label">Prazo (meses)</label>
              <input type="number" class="form-control" name="prazoMeses" required>
            </div>
            <div class="col-12">
              <label class="form-label">Nome completo</label>
              <input type="text" class="form-control" name="nomeCliente" required>
            </div>
            <div class="col-md-6">
              <label class="form-label">CPF</label>
              <input type="text" class="form-control" name="cpfCliente" required>
            </div>
            <div class="col-md-6">
              <label class="form-label">Telefone / WhatsApp</label>
              <input type="text" class="form-control" name="telefoneCliente" required>
            </div>
            <div class="col-md-6">
              <label class="form-label">E-mail</label>
              <input type="email" class="form-control" name="emailCliente" required>
            </div>
            <div class="col-md-6">
              <label class="form-label">Cidade / UF</label>
              <input type="text" class="form-control" name="cidadeUf" required>
            </div>
            <div class="col-12 form-check">
              <input class="form-check-input" type="checkbox" id="aceite" name="aceite" required>
              <label class="form-check-label small" for="aceite">
                Autorizo contato para finalização da contratação do consórcio por parceiro autorizado
                e estou ciente de que a venda será concluída diretamente na administradora.
              </label>
            </div>
            <div class="col-12">
              <button type="submit" class="btn btn-success">Confirmar pré-adesão</button>
            </div>
          </form>
          <p class="small text-muted mt-3 mb-0">
            Esta é uma pré-venda. A proposta será analisada por um parceiro especialista, que fará o cadastro
            no sistema da administradora, emitirá o boleto e enviará o contrato para sua confirmação.
          </p>
        </div>
      </div>
    </div>
  </div>`;
  res.send(layout("Pré-adesão", content, req));
});

app.post("/consorcio", (req, res) => {
  const {
    indicadorId,
    produtoId,
    valorCarta,
    prazoMeses,
    nomeCliente,
    cpfCliente,
    telefoneCliente,
    emailCliente,
    cidadeUf,
  } = req.body;

  const indicador = indicadores.find((ind) => ind.id === Number(indicadorId));
  const produto = produtos.find((prod) => prod.id === Number(produtoId));

  if (!indicador || !produto) {
    const content = `<div class="alert alert-danger">Indicador ou produto inválido.</div>`;
    return res.send(layout("Erro pré-adesão", content, req));
  }

  const pv = {
    id: nextPreVendaId++,
    indicadorId: indicador.id,
    produtoId: produto.id,
    valorCarta: Number(valorCarta),
    prazoMeses: Number(prazoMeses),
    nomeCliente,
    cpfCliente,
    telefoneCliente,
    emailCliente,
    cidadeUf,
    status: "PRE_VENDA",
    parceiroId: null,
    valorVenda: null,
  };

  preVendas.push(pv);

  const content = `
  <div class="row justify-content-center">
    <div class="col-md-7">
      <div class="card card-shadow border-0">
        <div class="card-body p-4">
          <h1 class="h4 mb-2">Pré-adesão registrada</h1>
          <p>Obrigado, <strong>${nomeCliente}</strong>. Sua pré-adesão foi registrada com o código:</p>
          <p class="display-6 fw-bold mb-3">${pv.id}</p>
          <p class="text-muted small mb-3">
            Em até <strong>60 minutos</strong> um especialista da nossa rede de parceiros entrará em contato
            para confirmar seus dados, ajustar a simulação (se necessário), registrar a proposta na administradora
            e emitir o boleto e o contrato.
          </p>
          <p class="small text-muted mb-0">
            A venda será concluída apenas após o pagamento do boleto emitido pela administradora de consórcio.
          </p>
        </div>
      </div>
    </div>
  </div>`;
  res.send(layout("Pré-adesão OK", content, req));
});

// ================= PARCEIRO ====================

app.get("/parceiro/login", (req, res) => {
  const content = `
  <div class="row justify-content-center">
    <div class="col-md-5">
      <div class="card card-shadow border-0">
        <div class="card-body p-4">
          <h1 class="h4 mb-3">Login do Parceiro / Representante</h1>
          <p class="small text-muted">
            Acesse para visualizar as pré-vendas geradas pelos indicadores, contatar os clientes e finalizar as vendas
            no sistema da administradora.
          </p>
          <form method="POST" action="/parceiro/login" class="row g-3">
            <div class="col-12">
              <label class="form-label">E-mail</label>
              <input type="email" class="form-control" name="email" required>
            </div>
            <div class="col-12">
              <label class="form-label">Senha</label>
              <input type="password" class="form-control" name="senha" required>
            </div>
            <div class="col-12">
              <button type="submit" class="btn btn-primary w-100">Entrar</button>
            </div>
          </form>
          <p class="small text-muted mt-3 mb-0">
            Usuário de teste: parceiro@indicons.com / 123456
          </p>
        </div>
      </div>
    </div>
  </div>`;
  res.send(layout("Login Parceiro", content, req));
});

app.post("/parceiro/login", (req, res) => {
  const { email, senha } = req.body;
  const par = parceiros.find((p) => p.email === email && p.senha === senha);
  if (!par) {
    const content = `<div class="alert alert-danger">Credenciais inválidas.</div>`;
    return res.send(layout("Erro login parceiro", content, req));
  }
  req.session.parceiroId = par.id;
  res.redirect("/parceiro/pre-vendas");
});

app.get("/parceiro/pre-vendas", requireParceiro, (req, res) => {
  const pvOrdenadas = [...preVendas].sort((a, b) => b.id - a.id);

  let linhas = pvOrdenadas
    .map((pv) => {
      const prod = produtos.find((p) => p.id === pv.produtoId);
      const ind = indicadores.find((i) => i.id === pv.indicadorId);
      return `
      <tr>
        <td>${pv.id}</td>
        <td>${pv.nomeCliente}</td>
        <td>${pv.telefoneCliente}</td>
        <td>${prod ? prod.nome : "-"}</td>
        <td>${ind ? ind.nome : "-"}</td>
        <td><span class="status-badge bg-light border text-muted">${pv.status}</span></td>
        <td><a href="/parceiro/pre-vendas/${pv.id}" class="btn btn-sm btn-outline-primary">Atender</a></td>
      </tr>`;
    })
    .join("");

  if (!linhas) {
    linhas = `<tr><td colspan="7" class="text-center text-muted">Nenhuma pré-venda disponível.</td></tr>`;
  }

  const content = `
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h1 class="h5 mb-0">Pré-vendas para atendimento</h1>
  </div>
  <div class="table-responsive">
    <table class="table table-sm align-middle">
      <thead class="table-light">
        <tr>
          <th>#</th>
          <th>Cliente</th>
          <th>Telefone</th>
          <th>Produto</th>
          <th>Indicador</th>
          <th>Status</th>
          <th>Ação</th>
        </tr>
      </thead>
      <tbody>
        ${linhas}
      </tbody>
    </table>
  </div>`;
  res.send(layout("Pré-vendas Parceiro", content, req));
});

app.get("/parceiro/pre-vendas/:id", requireParceiro, (req, res) => {
  const pv = preVendas.find((pv) => pv.id === Number(req.params.id));
  if (!pv) {
    const content = `<div class="alert alert-danger">Pré-venda não encontrada.</div>`;
    return res.send(layout("Erro", content, req));
  }
  const prod = produtos.find((p) => p.id === pv.produtoId);
  const ind = indicadores.find((i) => i.id === pv.indicadorId);

  const content = `
  <div class="row">
    <div class="col-lg-7">
      <div class="card card-shadow border-0 mb-3">
        <div class="card-body p-4">
          <h1 class="h5 mb-2">Pré-venda #${pv.id}</h1>
          <p class="small text-muted mb-2">Status atual: <strong>${pv.status}</strong></p>
          <h2 class="h6">Dados do cliente</h2>
          <ul class="small mb-3">
            <li><strong>Nome:</strong> ${pv.nomeCliente}</li>
            <li><strong>CPF:</strong> ${pv.cpfCliente}</li>
            <li><strong>Telefone:</strong> ${pv.telefoneCliente}</li>
            <li><strong>E-mail:</strong> ${pv.emailCliente}</li>
            <li><strong>Cidade/UF:</strong> ${pv.cidadeUf}</li>
          </ul>
          <h2 class="h6">Produto e simulação</h2>
          <ul class="small mb-0">
            <li><strong>Produto:</strong> ${prod ? prod.nome : "-"}</li>
            <li><strong>Indicador:</strong> ${ind ? ind.nome : "-"}</li>
            <li><strong>Valor da carta:</strong> R$ ${pv.valorCarta.toFixed(2)}</li>
            <li><strong>Prazo:</strong> ${pv.prazoMeses} meses</li>
          </ul>
        </div>
      </div>
    </div>
    <div class="col-lg-5">
      <div class="card border-0 card-shadow">
        <div class="card-body p-4">
          <h2 class="h6 mb-3">Atualizar status / registrar venda</h2>
          <form method="POST" action="/parceiro/pre-vendas/${pv.id}/status" class="row g-3">
            <div class="col-12">
              <label class="form-label">Novo status</label>
              <select name="status" class="form-select" required>
                <option value="EM_ATENDIMENTO">Em atendimento</option>
                <option value="BOLETO_EMITIDO">Boleto emitido</option>
                <option value="APROVADA">Aprovada / Venda finalizada</option>
                <option value="REPROVADA">Reprovada</option>
                <option value="NAO_FECHOU">Não fechou</option>
              </select>
            </div>
            <div class="col-12">
              <label class="form-label">Valor da venda (somente se aprovada)</label>
              <input type="number" step="0.01" name="valorVenda" class="form-control">
            </div>
            <div class="col-12">
              <button type="submit" class="btn btn-primary w-100">Salvar</button>
            </div>
          </form>
          <p class="small text-muted mt-3 mb-0">
            Lembrete: o cadastro da cota, emissão de boleto e contrato devem ser feitos no sistema oficial da administradora.
            Aqui você registra o status comercial e gera a comissão do indicador.
          </p>
        </div>
      </div>
    </div>
  </div>`;
  res.send(layout("Pré-venda detalhe", content, req));
});

app.post("/parceiro/pre-vendas/:id/status", requireParceiro, (req, res) => {
  const pv = preVendas.find((pv) => pv.id === Number(req.params.id));
  if (!pv) {
    const content = `<div class="alert alert-danger">Pré-venda não encontrada.</div>`;
    return res.send(layout("Erro", content, req));
  }
  const { status, valorVenda } = req.body;
  pv.status = status;
  if (status === "APROVADA" && valorVenda) {
    pv.valorVenda = Number(valorVenda);
    const valorComissao = pv.valorVenda * 0.05;
    comissoes.push({
      id: nextComissaoId++,
      indicadorId: pv.indicadorId,
      preVendaId: pv.id,
      valorBase: pv.valorVenda,
      percentual: 5,
      valorComissao,
      status: "A_PAGAR",
    });
  }
  res.redirect("/parceiro/pre-vendas");
});

// ================= ADMIN ====================

app.get("/admin/login", (req, res) => {
  const content = `
  <div class="row justify-content-center">
    <div class="col-md-5">
      <div class="card card-shadow border-0">
        <div class="card-body p-4">
          <h1 class="h4 mb-3">Login Administrativo</h1>
          <form method="POST" action="/admin/login" class="row g-3">
            <div class="col-12">
              <label class="form-label">E-mail</label>
              <input type="email" class="form-control" name="email" required>
            </div>
            <div class="col-12">
              <label class="form-label">Senha</label>
              <input type="password" class="form-control" name="senha" required>
            </div>
            <div class="col-12">
              <button type="submit" class="btn btn-primary w-100">Entrar</button>
            </div>
          </form>
          <p class="small text-muted mt-3 mb-0">
            Usuário de teste: admin@indicons.com / 123456
          </p>
        </div>
      </div>
    </div>
  </div>`;
  res.send(layout("Login Admin", content, req));
});

app.post("/admin/login", (req, res) => {
  const { email, senha } = req.body;
  const adm = admins.find((a) => a.email === email && a.senha === senha);
  if (!adm) {
    const content = `<div class="alert alert-danger">Credenciais inválidas.</div>`;
    return res.send(layout("Erro login admin", content, req));
  }
  req.session.adminId = adm.id;
  res.redirect("/admin/dashboard");
});

app.get("/admin/dashboard", requireAdmin, (req, res) => {
  const totalPreVendas = preVendas.length;
  const totalAprovadas = preVendas.filter((pv) => pv.status === "APROVADA").length;
  const totalComissao = comissoes.reduce((sum, c) => sum + c.valorComissao, 0);

  const content = `
  <h1 class="h4 mb-3">Painel Administrativo</h1>
  <div class="row g-3 mb-4">
    <div class="col-md-4">
      <div class="card border-0 card-shadow">
        <div class="card-body">
          <div class="small text-muted mb-1">Pré-vendas totais</div>
          <div class="h5 mb-0">${totalPreVendas}</div>
        </div>
      </div>
    </div>
    <div class="col-md-4">
      <div class="card border-0 card-shadow">
        <div class="card-body">
          <div class="small text-muted mb-1">Vendas aprovadas</div>
          <div class="h5 mb-0">${totalAprovadas}</div>
        </div>
      </div>
    </div>
    <div class="col-md-4">
      <div class="card border-0 card-shadow">
        <div class="card-body">
          <div class="small text-muted mb-1">Comissões geradas</div>
          <div class="h5 mb-0">R$ ${totalComissao.toFixed(2)}</div>
        </div>
      </div>
    </div>
  </div>

  <div class="d-flex flex-wrap gap-2">
    <a href="/admin/produtos" class="btn btn-outline-primary btn-sm">Gerenciar produtos</a>
    <a href="/admin/indicadores" class="btn btn-outline-primary btn-sm">Ver indicadores</a>
    <a href="/admin/comissoes" class="btn btn-outline-primary btn-sm">Ver comissões</a>
  </div>`;
  res.send(layout("Dashboard Admin", content, req));
});

// Produtos
app.get("/admin/produtos", requireAdmin, (req, res) => {
  let linhas = produtos
    .map(
      (p) => `
    <tr>
      <td>${p.id}</td>
      <td>${p.nome}</td>
      <td>${p.codigo}</td>
      <td>${p.administradora}</td>
      <td>${p.descricao}</td>
    </tr>`
    )
    .join("");

  if (!linhas) {
    linhas = `<tr><td colspan="5" class="text-center text-muted">Nenhum produto cadastrado.</td></tr>`;
  }

  const content = `
  <h1 class="h5 mb-3">Produtos de consórcio</h1>
  <div class="table-responsive mb-3">
    <table class="table table-sm align-middle">
      <thead class="table-light">
        <tr>
          <th>ID</th>
          <th>Nome</</th>
          <th>Código</th>
          <th>Administradora</th>
          <th>Descrição</th>
        </tr>
      </thead>
      <tbody>
        ${linhas}
      </tbody>
    </table>
  </div>
  <hr>
  <h2 class="h6 mb-3">Novo produto</h2>
  <form method="POST" action="/admin/produtos" class="row g-3">
    <div class="col-12">
      <label class="form-label">Nome</label>
      <input type="text" name="nome" class="form-control" required>
    </div>
    <div class="col-md-4">
      <label class="form-label">Código</label>
      <input type="text" name="codigo" class="form-control" required>
    </div>
    <div class="col-md-4">
      <label class="form-label">Administradora</label>
      <input type="text" name="administradora" class="form-control" required>
    </div>
    <div class="col-12">
      <label class="form-label">Descrição</label>
      <textarea name="descricao" class="form-control" rows="2"></textarea>
    </div>
    <div class="col-12">
      <button type="submit" class="btn btn-success">Adicionar produto</button>
    </div>
  </form>`;
  res.send(layout("Produtos", content, req));
});

app.post("/admin/produtos", requireAdmin, (req, res) => {
  const { nome, codigo, administradora, descricao } = req.body;
  produtos.push({
    id: nextProdutoId++,
    nome,
    codigo,
    administradora,
    descricao,
  });
  res.redirect("/admin/produtos");
});

// Indicadores
app.get("/admin/indicadores", requireAdmin, (req, res) => {
  let linhas = indicadores
    .map(
      (i) => `
    <tr>
      <td>${i.id}</td>
      <td>${i.nome}</td>
      <td>${i.email}</td>
      <td>${i.cpfCnpj}</td>
      <td>${i.pix}</td>
    </tr>`
    )
    .join("");

  if (!linhas) {
    linhas = `<tr><td colspan="5" class="text-center text-muted">Nenhum indicador cadastrado.</td></tr>`;
  }

  const content = `
  <h1 class="h5 mb-3">Indicadores cadastrados</h1>
  <div class="table-responsive">
    <table class="table table-sm align-middle">
      <thead class="table-light">
        <tr>
          <th>ID</th>
          <th>Nome</th>
          <th>E-mail</th>
          <th>CPF/CNPJ</th>
          <th>Pix</th>
        </tr>
      </thead>
      <tbody>
        ${linhas}
      </tbody>
    </table>
  </div>`;
  res.send(layout("Indicadores", content, req));
});

// Comissões
app.get("/admin/comissoes", requireAdmin, (req, res) => {
  let linhas = comissoes
    .map((c) => {
      const ind = indicadores.find((i) => i.id === c.indicadorId);
      return `
      <tr>
        <td>${c.id}</td>
        <td>${ind ? ind.nome : "-"}</td>
        <td>R$ ${c.valorBase.toFixed(2)}</td>
        <td>R$ ${c.valorComissao.toFixed(2)}</td>
        <td>${c.status}</td>
      </tr>`;
    })
    .join("");

  if (!linhas) {
    linhas = `<tr><td colspan="5" class="text-center text-muted">Nenhuma comissão gerada.</td></tr>`;
  }

  const content = `
  <h1 class="h5 mb-3">Comissões</h1>
  <div class="table-responsive">
    <table class="table table-sm align-middle">
      <thead class="table-light">
        <tr>
          <th>ID</th>
          <th>Indicador</th>
          <th>Valor base</th>
          <th>Comissão (5%)</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${linhas}
      </tbody>
    </table>
  </div>
  <p class="small text-muted mb-0">
    Neste MVP, todas as comissões são criadas com status <code>A_PAGAR</code>.
    Em uma evolução, você pode adicionar uma tela para marcar como <code>PAGA</code> e registrar data de pagamento.
  </p>`;
  res.send(layout("Comissões", content, req));
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// Porta (Render usa process.env.PORT)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("INDICONS rodando na porta " + PORT);
});
