// server.js - INDICONS MVP COMPLETO (versão final sem integração com administradora)
const express = require('express');
const session = require('express-session');
const app = express();

// Configuração básica
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'indicons-segredo-simples',
  resave: false,
  saveUninitialized: true
}));

// "Banco de dados" em memória (perde tudo ao reiniciar o servidor)
// Em produção, isso deve ser trocado por banco real (SQLite/MySQL/etc.)
let indicadores = [];
let parceiros = [];
let admins = [];
let produtos = [];
let preVendas = [];
let comissoes = [];

// Sequência de IDs
let nextIndicadorId = 1;
let nextParceiroId = 1;
let nextAdminId = 1;
let nextProdutoId = 1;
let nextPreVendaId = 1;
let nextComissaoId = 1;

// Cria um admin e um parceiro padrão para você testar
admins.push({
  id: nextAdminId++,
  nome: 'Admin Padrão',
  email: 'admin@indicons.com',
  senha: '123456'
});

parceiros.push({
  id: nextParceiroId++,
  nome: 'Parceiro Padrão',
  email: 'parceiro@indicons.com',
  senha: '123456'
});

// Produtos de exemplo (consórcios)
produtos.push(
  {
    id: nextProdutoId++,
    nome: 'Consórcio Imóvel - Embracon',
    codigo: 'IMOVEL01',
    administradora: 'Embracon',
    descricao: 'Cartas de crédito para imóveis residenciais e comerciais.'
  },
  {
    id: nextProdutoId++,
    nome: 'Consórcio Auto - Porto Seguro',
    codigo: 'AUTO01',
    administradora: 'Porto Seguro',
    descricao: 'Consórcio para veículos leves novos e seminovos.'
  },
  {
    id: nextProdutoId++,
    nome: 'Consórcio Serviços - Embracon',
    codigo: 'SERVICO01',
    administradora: 'Embracon',
    descricao: 'Consórcio para serviços diversos (reformas, estudos, etc.).'
  }
);

// Middlewares de autenticação
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

// Helper para layout simples, mas com todas as informações do fluxo
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
        .status { padding:0.1rem 0.4rem; border-radius:999px; font-size:0.7rem; border:1px solid #e5e7eb; display:inline-block;}
        ul.flow { font-size:0.85rem; padding-left:1.2rem; }
        ul.flow li { margin-bottom:0.25rem; }
        .pill { display:inline-block; padding:0.1rem 0.4rem; border-radius:999px; border:1px solid #e5e7eb; font-size:0.75rem; margin-right:0.2rem; }
      </style>
    </head>
    <body>
      <header>
        <div>
          <strong>INDICONS</strong> – Plataforma de Indicação de Consórcios
        </div>
        <div>${userInfo}</div>
      </header>
      <div class="container">
        ${content}
      </div>
    </body>
  </html>
  `;
}

// ================= HOME (explicando TODO o fluxo) ====================
app.get('/', (req, res) => {
  const userInfo = `
    <nav>
      <a href="/">Home</a>
      <a href="/indicador/login">Indicador</a>
      <a href="/parceiro/login">Parceiro</a>
      <a href="/admin/login">Admin</a>
    </nav>
  `;
  const content = `
    <h1>INDICONS – Fluxo completo de indicação e pré-venda de consórcios</h1>
    <p>
      Esta versão do sistema já está com TODO o fluxo funcional em MVP, sem integração direta com a administradora.
      O fechamento da venda e emissão do boleto são feitos pelo <strong>parceiro/representante</strong> no sistema da administradora.
    </p>

    <h2>Como funciona na prática</h2>
    <ul class="flow">
      <li><strong>1. Indicador</strong> se cadastra e faz login.</li>
      <li><strong>2. Indicador</strong> acessa “Meus links de indicação” e copia o link de cada produto de consórcio.</li>
      <li><strong>3. Indicador</strong> envia o link para o cliente (WhatsApp, redes sociais, etc.).</li>
      <li><strong>4. Cliente</strong> abre o link, vê o produto, faz simulação básica, preenche os dados e confirma a <strong>pré-adesão</strong>.</li>
      <li><strong>5. O sistema INDICONS</strong> registra essa pré-venda vinculada ao indicador e ao produto.</li>
      <li><strong>6. Parceiro/representante</strong> faz login, vê a fila de pré-vendas, entra em contato com o cliente e
          finaliza a venda pelo sistema oficial da administradora (Embracon, Porto, etc.).</li>
      <li><strong>7. Parceiro</strong> volta no INDICONS, marca a pré-venda como “Boleto emitido” e depois “Aprovada / Venda finalizada” quando o boleto é pago.</li>
      <li><strong>8. O sistema INDICONS</strong> calcula automaticamente a <strong>comissão de 5%</strong> para o indicador e registra em “Comissões”.</li>
      <li><strong>9. Admin</strong> controla produtos, indicadores e comissões a pagar/pagas.</li>
    </ul>

    <h2>Acessos de exemplo para testes</h2>
    <ul>
      <li><strong>Admin:</strong> e-mail <code>admin@indicons.com</code> – senha <code>123456</code></li>
      <li><strong>Parceiro:</strong> e-mail <code>parceiro@indicons.com</code> – senha <code>123456</code></li>
      <li>Indicadores você cadastra na própria tela de cadastro.</li>
    </ul>

    <h2>Próximos passos possíveis</h2>
    <p class="muted">
      Este MVP guarda tudo em memória e serve para validar o fluxo de negócio.
      Em uma próxima fase, basta trocar os arrays por um banco de dados (SQLite/MySQL/PostgreSQL) e,
      se desejar, adicionar IA e WhatsApp oficial.
    </p>
  `;
  res.send(layout('INDICONS - Home', content, userInfo));
});


// ================= INDICADOR ====================

// Tela de registro
app.get('/indicador/registrar', (req, res) => {
  const userInfo = `<span class="badge badge-ind">Indicador</span>`;
  const content = `
    <h1>Cadastro de Indicador</h1>
    <p>Cadastre-se para receber links de indicação e ganhar <strong>5% de comissão</strong> sobre vendas aprovadas.</p>
    <form method="POST" action="/indicador/registrar">
      <label>Nome completo
        <input type="text" name="nome" required>
      </label>
      <label>E-mail
        <input type="email" name="email" required>
      </label>
      <label>CPF/CNPJ
        <input type="text" name="cpfCnpj" required>
      </label>
      <label>Chave Pix (para pagamento de comissão)
        <input type="text" name="pix" required>
      </label>
      <label>Senha
        <input type="password" name="senha" required>
      </label>
      <button type="submit">Cadastrar</button>
    </form>
    <p class="muted">
      Após o cadastro, você poderá fazer login como indicador, copiar seus links de produtos e começar a indicar clientes.
    </p>
  `;
  res.send(layout('Cadastro Indicador', content, userInfo));
});

app.post('/indicador/registrar', (req, res) => {
  const { nome, email, cpfCnpj, pix, senha } = req.body;
  if (indicadores.some(i => i.email === email)) {
    return res.send(layout('Erro', `<p>Já existe indicador com este e-mail.</p><a href="/indicador/login">Ir para login</a>`));
  }
  const ind = {
    id: nextIndicadorId++,
    nome,
    email,
    cpfCnpj,
    pix,
    senha // sem hash neste MVP
  };
  indicadores.push(ind);
  res.send(layout('Cadastro ok', `<p>Indicador cadastrado com sucesso.</p><a href="/indicador/login">Ir para login</a>`));
});

// Login indicador
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
    <p class="muted">Ainda não é indicador? <a href="/indicador/registrar">Cadastre-se aqui</a>.</p>
  `;
  res.send(layout('Login Indicador', content, ''));
});

app.post('/indicador/login', (req, res) => {
  const { email, senha } = req.body;
  const ind = indicadores.find(i => i.email === email && i.senha === senha);
  if (!ind) {
    return res.send(layout('Login', `<p>Credenciais inválidas.</p><a href="/indicador/login">Tentar novamente</a>`));
  }
  req.session.indicadorId = ind.id;
  res.redirect('/indicador/dashboard');
});

// Dashboard indicador
app.get('/indicador/dashboard', requireIndicador, (req, res) => {
  const ind = indicadores.find(i => i.id === req.session.indicadorId);
  const minhasPreVendas = preVendas.filter(pv => pv.indicadorId === ind.id);
  const minhasComissoes = comissoes.filter(c => c.indicadorId === ind.id);

  const totalComissaoAPagar = minhasComissoes
    .filter(c => c.status === 'A_PAGAR')
    .reduce((sum, c) => sum + c.valorComissao, 0);

  const totalComissaoPaga = minhasComissoes
    .filter(c => c.status === 'PAGA')
    .reduce((sum, c) => sum + c.valorComissao, 0);

  const userInfo = `<span>${ind.nome}</span> <span class="badge badge-ind">Indicador</span> <a href="/logout">Sair</a>`;

  let rows = minhasPreVendas.map(pv => {
    const prod = produtos.find(p => p.id === pv.produtoId);
    return `
      <tr>
        <td>${pv.id}</td>
        <td>${pv.nomeCliente}</td>
        <td>${prod ? prod.nome : '-'}</td>
        <td>${pv.status}</td>
        <td>${pv.valorCarta || '-'}</td>
        <td>${pv.valorVenda || '-'}</td>
      </tr>
    `;
  }).join('');

  if (!rows) rows = `<tr><td colspan="6">Nenhuma indicação ainda.</td></tr>`;

  const content = `
    <h1>Dashboard do Indicador</h1>
    <p>Bem-vindo, ${ind.nome}. Aqui você acompanha suas indicações e comissões.</p>
    <p>
      <strong>Comissão a receber:</strong> R$ ${totalComissaoAPagar.toFixed(2)}<br>
      <strong>Comissão já paga:</strong> R$ ${totalComissaoPaga.toFixed(2)}
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
    <p class="muted">
      Status possíveis: PRE_VENDA, EM_ATENDIMENTO, BOLETO_EMITIDO, APROVADA, REPROVADA, NAO_FECHOU.<br>
      Quando o parceiro marca APROVADA e registra o valor da venda, o sistema gera sua comissão de 5%.
    </p>
  `;
  res.send(layout('Dashboard Indicador', content, userInfo));
});

// Links de indicação
app.get('/indicador/links', requireIndicador, (req, res) => {
  const ind = indicadores.find(i => i.id === req.session.indicadorId);
  const userInfo = `<span>${ind.nome}</span> <span class="badge badge-ind">Indicador</span> <a href="/logout">Sair</a>`;

  let rows = produtos.map(p => {
    const link = `http://localhost:3000/consorcio?i=${ind.id}&p=${p.id}`;
    return `
      <tr>
        <td>${p.id}</td>
        <td>${p.nome}</td>
        <td>${p.administradora}</td>
        <td>${p.descricao}</td>
        <td><input type="text" value="${link}" style="width:100%;" readonly></td>
      </tr>
    `;
  }).join('');

  if (!rows) rows = `<tr><td colspan="5">Nenhum produto cadastrado.</td></tr>`;

  const content = `
    <h1>Meus links de indicação</h1>
    <p>Copie o link do produto e envie para seus clientes via WhatsApp, redes sociais, e-mail, etc.</p>
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
    <p class="muted">
      Neste MVP o domínio é <code>http://localhost:3000</code>. Em produção, será o seu domínio (ex.: <code>https://indicons.com/</code>).
      O link já vem com o ID do indicador e o ID do produto.
    </p>
  `;
  res.send(layout('Links Indicador', content, userInfo));
});


// ================= FLUXO CLIENTE (PRÉ-VENDA) ====================

// Tela de pré-venda / simulação
app.get('/consorcio', (req, res) => {
  const { i, p } = req.query; // i = indicadorId, p = produtoId
  const indicador = indicadores.find(ind => ind.id === Number(i));
  const produto = produtos.find(prod => prod.id === Number(p));

  if (!indicador || !produto) {
    return res.send(layout('Erro', `<p>Link inválido ou indicador/produto não encontrado.</p>`));
  }

  const content = `
    <h1>Simulação & Pré-adesão – ${produto.nome}</h1>
    <p>Você está sendo atendido por <strong>${indicador.nome}</strong> (indicador parceiro INDICONS).</p>
    <form method="POST" action="/consorcio">
      <input type="hidden" name="indicadorId" value="${indicador.id}">
      <input type="hidden" name="produtoId" value="${produto.id}">
      <h3>Simulação básica</h3>
      <label>Valor da carta (R$)
        <input type="number" name="valorCarta" required>
      </label>
      <label>Prazo (meses)
        <input type="number" name="prazoMeses" required>
      </label>
      <p class="muted">
        Os valores finais de parcela, taxas e condições serão confirmados pelo parceiro autorizado
        no sistema oficial da administradora.
      </p>
      <h3>Dados do cliente</h3>
      <label>Nome completo
        <input type="text" name="nomeCliente" required>
      </label>
      <label>CPF
        <input type="text" name="cpfCliente" required>
      </label>
      <label>Telefone / WhatsApp
        <input type="text" name="telefoneCliente" required>
      </label>
      <label>E-mail
        <input type="email" name="emailCliente" required>
      </label>
      <label>Cidade/UF
        <input type="text" name="cidadeUf" required>
      </label>
      <label>
        <input type="checkbox" name="aceite" required>
        Confirmo que desejo receber contato para finalizar a contratação do consórcio e estou ciente
        de que a contratação será concluída diretamente pela administradora parceira.
      </label>
      <button type="submit">Confirmar pré-adesão</button>
    </form>
    <p class="muted">
      Esta é uma PRÉ-VENDA. A venda efetiva só ocorre após o parceiro/representante da administradora:
      <br>• entrar em contato com você;
      <br>• registrar a proposta no sistema oficial;
      <br>• emitir o boleto e o contrato;
      <br>• e você efetuar o pagamento do boleto da administradora.
    </p>
  `;
  res.send(layout('Pré-adesão', content));
});

app.post('/consorcio', (req, res) => {
  const {
    indicadorId,
    produtoId,
    valorCarta,
    prazoMeses,
    nomeCliente,
    cpfCliente,
    telefoneCliente,
    emailCliente,
    cidadeUf
  } = req.body;

  const indicador = indicadores.find(ind => ind.id === Number(indicadorId));
  const produto = produtos.find(prod => prod.id === Number(produtoId));

  if (!indicador || !produto) {
    return res.send(layout('Erro', `<p>Indicador ou produto inválido.</p>`));
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
    status: 'PRE_VENDA',
    parceiroId: null,
    valorVenda: null
  };

  preVendas.push(pv);

  const content = `
    <h1>Pré-adesão registrada</h1>
    <p>Obrigado, ${nomeCliente}. Sua pré-adesão foi registrada com o código <strong>${pv.id}</strong>.</p>
    <p>Em até <strong>60 minutos</strong> um especialista da nossa rede de parceiros entrará em contato para:</p>
    <ul class="flow">
      <li>confirmar seus dados;</li>
      <li>ajustar simulação, se necessário;</li>
      <li>registrar a proposta no sistema da administradora;</li>
      <li>emitir boleto e contrato para você analisar e pagar.</li>
    </ul>
    <p class="muted">
      A venda será concluída somente após o pagamento do boleto emitido pela administradora de consórcio.
    </p>
  `;
  res.send(layout('Pré-adesão ok', content));
});


// ================= PARCEIRO ====================

// Login parceiro
app.get('/parceiro/login', (req, res) => {
  const content = `
    <h1>Login Parceiro / Representante</h1>
    <p>
      Área para o parceiro responsável por acessar as pré-vendas do INDICONS, contatar o cliente
      e finalizar a venda no sistema da administradora.
    </p>
    <form method="POST" action="/parceiro/login">
      <label>E-mail
        <input type="email" name="email" required>
      </label>
      <label>Senha
        <input type="password" name="senha" required>
      </label>
      <button type="submit">Entrar</button>
    </form>
    <p class="muted">Usuário padrão para testes: parceiro@indicons.com / senha: 123456</p>
  `;
  res.send(layout('Login Parceiro', content));
});

app.post('/parceiro/login', (req, res) => {
  const { email, senha } = req.body;
  const par = parceiros.find(p => p.email === email && p.senha === senha);
  if (!par) {
    return res.send(layout('Erro', `<p>Credenciais inválidas.</p><a href="/parceiro/login">Tentar novamente</a>`));
  }
  req.session.parceiroId = par.id;
  res.redirect('/parceiro/pre-vendas');
});

// Lista de pré-vendas
app.get('/parceiro/pre-vendas', requireParceiro, (req, res) => {
  const par = parceiros.find(p => p.id === req.session.parceiroId);
  const userInfo = `<span>${par.nome}</span> <span class="badge badge-par">Parceiro</span> <a href="/logout">Sair</a>`;

  let rows = preVendas.map(pv => {
    const prod = produtos.find(p => p.id === pv.produtoId);
    const ind = indicadores.find(i => i.id === pv.indicadorId);
    return `
      <tr>
        <td>${pv.id}</td>
        <td>${pv.nomeCliente}</td>
        <td>${pv.telefoneCliente}</td>
        <td>${prod ? prod.nome : ''}</td>
        <td>${ind ? ind.nome : ''}</td>
        <td>${pv.status}</td>
        <td><a href="/parceiro/pre-vendas/${pv.id}">Atender</a></td>
      </tr>
    `;
  }).join('');

  if (!rows) rows = `<tr><td colspan="7">Nenhuma pré-venda ainda.</td></tr>`;

  const content = `
    <h1>Pré-vendas para atendimento</h1>
    <p>
      Aqui o parceiro visualiza todas as pré-vendas geradas pelos indicadores.
      O fechamento da venda (boleto, contrato, cadastro da cota) é realizado diretamente no sistema da administradora.
    </p>
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
});

// Detalhe pré-venda
app.get('/parceiro/pre-vendas/:id', requireParceiro, (req, res) => {
  const par = parceiros.find(p => p.id === req.session.parceiroId);
  const userInfo = `<span>${par.nome}</span> <span class="badge badge-par">Parceiro</span> <a href="/logout">Sair</a>`;
  const pv = preVendas.find(pv => pv.id === Number(req.params.id));
  if (!pv) {
    return res.send(layout('Erro', `<p>Pré-venda não encontrada.</p>`, userInfo));
  }
  const prod = produtos.find(p => p.id === pv.produtoId);
  const ind = indicadores.find(i => i.id === pv.indicadorId);

  const content = `
    <h1>Pré-venda #${pv.id}</h1>
    <p><strong>Cliente:</strong> ${pv.nomeCliente} (${pv.cpfCliente})</p>
    <p><strong>Telefone:</strong> ${pv.telefoneCliente} | <strong>E-mail:</strong> ${pv.emailCliente}</p>
    <p><strong>Cidade/UF:</strong> ${pv.cidadeUf}</p>
    <p><strong>Produto:</strong> ${prod ? prod.nome : ''}</p>
    <p><strong>Indicador:</strong> ${ind ? ind.nome : ''}</p>
    <p><strong>Valor carta:</strong> R$ ${pv.valorCarta.toFixed(2)} | <strong>Prazo:</strong> ${pv.prazoMeses} meses</p>
    <p><strong>Status atual:</strong> ${pv.status}</p>

    <h3>Atualizar status (controle de fechamento)</h3>
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
        <input type="number" step="0.01" name="valorVenda">
      </label>
      <button type="submit">Salvar</button>
    </form>
    <p class="muted">
      Importante:
      <br>• a emissão de boleto e contrato deve ser feita no sistema oficial da administradora;
      <br>• o INDICONS registra apenas o status comercial e calcula a comissão do indicador.
    </p>
  `;
  res.send(layout('Pré-venda Detalhe', content, userInfo));
});

app.post('/parceiro/pre-vendas/:id/status', requireParceiro, (req, res) => {
  const pv = preVendas.find(pv => pv.id === Number(req.params.id));
  if (!pv) {
    return res.send(layout('Erro', `<p>Pré-venda não encontrada.</p>`));
  }
  const { status, valorVenda } = req.body;
  pv.status = status;
  if (status === 'APROVADA' && valorVenda) {
    pv.valorVenda = Number(valorVenda);
    // cria comissao 5%
    const valorComissao = pv.valorVenda * 0.05;
    comissoes.push({
      id: nextComissaoId++,
      indicadorId: pv.indicadorId,
      preVendaId: pv.id,
      valorBase: pv.valorVenda,
      percentual: 5,
      valorComissao,
      status: 'A_PAGAR'
    });
  }
  res.redirect('/parceiro/pre-vendas');
});


// ================= ADMIN ====================

// Login admin
app.get('/admin/login', (req, res) => {
  const content = `
    <h1>Login Admin</h1>
    <p>Área administrativa para gerenciar produtos, indicadores e comissões.</p>
    <form method="POST" action="/admin/login">
      <label>E-mail
        <input type="email" name="email" required>
      </label>
      <label>Senha
        <input type="password" name="senha" required>
      </label>
      <button type="submit">Entrar</button>
    </form>
    <p class="muted">Usuário padrão para testes: admin@indicons.com / senha: 123456</p>
  `;
  res.send(layout('Login Admin', content));
});

app.post('/admin/login', (req, res) => {
  const { email, senha } = req.body;
  const adm = admins.find(a => a.email === email && a.senha === senha);
  if (!adm) {
    return res.send(layout('Erro', `<p>Credenciais inválidas.</p><a href="/admin/login">Tentar novamente</a>`));
  }
  req.session.adminId = adm.id;
  res.redirect('/admin/dashboard');
});

// Dashboard admin
app.get('/admin/dashboard', requireAdmin, (req, res) => {
  const adm = admins.find(a => a.id === req.session.adminId);
  const userInfo = `<span>${adm.nome}</span> <span class="badge badge-admin">Admin</span> <a href="/logout">Sair</a>`;

  const totalPreVendas = preVendas.length;
  const totalAprovadas = preVendas.filter(pv => pv.status === 'APROVADA').length;
  const totalComissao = comissoes.reduce((sum, c) => sum + c.valorComissao, 0);

  const content = `
    <h1>Dashboard Admin</h1>
    <p>
      <strong>Pré-vendas totais:</strong> ${totalPreVendas}<br>
      <strong>Vendas aprovadas:</strong> ${totalAprovadas}<br>
      <strong>Comissões geradas (todas):</strong> R$ ${totalComissao.toFixed(2)}
    </p>
    <p>
      <a href="/admin/produtos">Gerenciar produtos</a> |
      <a href="/admin/indicadores">Ver indicadores</a> |
      <a href="/admin/comissoes">Ver comissões</a>
    </p>
    <p class="muted">
      Lembre-se: este MVP usa dados em memória. Ao reiniciar o servidor, tudo zera.
      Em produção, isso deve ir para banco de dados.
    </p>
  `;
  res.send(layout('Dashboard Admin', content, userInfo));
});

// Produtos
app.get('/admin/produtos', requireAdmin, (req, res) => {
  const adm = admins.find(a => a.id === req.session.adminId);
  const userInfo = `<span>${adm.nome}</span> <span class="badge badge-admin">Admin</span> <a href="/logout">Sair</a>`;

  let rows = produtos.map(p => `
    <tr>
      <td>${p.id}</td>
      <td>${p.nome}</td>
      <td>${p.codigo}</td>
      <td>${p.administradora}</td>
      <td>${p.descricao}</td>
    </tr>
  `).join('');
  if (!rows) rows = `<tr><td colspan="5">Nenhum produto.</td></tr>`;

  const content = `
    <h1>Produtos de consórcio</h1>
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
      <label>Código interno
        <input type="text" name="codigo" required>
      </label>
      <label>Administradora
        <input type="text" name="administradora" required>
      </label>
      <label>Descrição
        <textarea name="descricao"></textarea>
      </label>
      <button type="submit">Adicionar produto</button>
    </form>
  `;
  res.send(layout('Produtos', content, userInfo));
});

app.post('/admin/produtos', requireAdmin, (req, res) => {
  const { nome, codigo, administradora, descricao } = req.body;
  produtos.push({
    id: nextProdutoId++,
    nome,
    codigo,
    administradora,
    descricao
  });
  res.redirect('/admin/produtos');
});

// Indicadores
app.get('/admin/indicadores', requireAdmin, (req, res) => {
  const adm = admins.find(a => a.id === req.session.adminId);
  const userInfo = `<span>${adm.nome}</span> <span class="badge badge-admin">Admin</span> <a href="/logout">Sair</a>`;

  let rows = indicadores.map(i => `
    <tr>
      <td>${i.id}</td>
      <td>${i.nome}</td>
      <td>${i.email}</td>
      <td>${i.cpfCnpj}</td>
      <td>${i.pix}</td>
    </tr>
  `).join('');
  if (!rows) rows = `<tr><td colspan="5">Nenhum indicador.</td></tr>`;

  const content = `
    <h1>Indicadores cadastrados</h1>
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
});

// Comissões
app.get('/admin/comissoes', requireAdmin, (req, res) => {
  const adm = admins.find(a => a.id === req.session.adminId);
  const userInfo = `<span>${adm.nome}</span> <span class="badge badge-admin">Admin</span> <a href="/logout">Sair</a>`;

  let rows = comissoes.map(c => {
    const ind = indicadores.find(i => i.id === c.indicadorId);
    return `
      <tr>
        <td>${c.id}</td>
        <td>${ind ? ind.nome : ''}</td>
        <td>${c.valorBase.toFixed(2)}</td>
        <td>${c.valorComissao.toFixed(2)}</td>
        <td>${c.status}</td>
      </tr>
    `;
  }).join('');
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
    <p class="muted">
      Neste MVP, o status fica apenas como <code>A_PAGAR</code> por padrão.
      Em uma evolução, você pode criar uma tela para marcar como PAGA e registrar a data de pagamento.
    </p>
  `;
  res.send(layout('Comissões', content, userInfo));
});


// ================= LOGOUT ====================
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`INDICONS MVP rodando em http://localhost:${PORT}`);
});
