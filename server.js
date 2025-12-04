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
// LANDING PAGE PREMIUM (/lp)
// =============================================================
app.get("/lp", (req, res) => {
  const content = `
  <section class="card" style="text-align:center;">
    <h1 style="font-size:34px; margin-bottom:10px;">Ganhe até R$ 5.000/mês indicando consórcios</h1>
    <p class="muted" style="font-size:17px;">Sem vender. Sem experiência. Apenas compartilhe um link.</p>
    <a href="/indicador/registrar" class="btn" style="margin-top:18px;">Quero ser Indicador</a>
  </section>

  <section class="card">
    <h2>Por que trabalhar com o INDICONS?</h2>
    <div class="grid">
      <div class="card">
        <h3>5% de comissão</h3>
        <p class="muted">Venda de R$ 100.000 → você recebe R$ 5.000.</p>
      </div>
      <div class="card">
        <h3>Você só indica</h3>
        <p class="muted">Nosso parceiro oficial finaliza a venda por você.</p>
      </div>
      <div class="card">
        <h3>Links prontos</h3>
        <p class="muted">Basta copiar e enviar via WhatsApp.</p>
      </div>
      <div class="card">
        <h3>Painel completo</h3>
        <p class="muted">Acompanhe cada pré-venda gerada automaticamente.</p>
      </div>
    </div>
  </section>

  <section class="card">
    <h2>Como funciona?</h2>
    <div class="grid">
      <div class="card"><h3>1. Cadastre-se</h3><p class="muted">Crie sua conta gratuitamente.</p></div>
      <div class="card"><h3>2. Envie seus links</h3><p class="muted">Compartilhe em grupos, contatos, redes sociais.</p></div>
      <div class="card"><h3>3. Ganhe comissão</h3><p class="muted">Receba automaticamente 5% por venda concluída.</p></div>
    </div>
  </section>

  <section class="card" style="text-align:center;">
    <h2>Comece agora</h2>
    <p class="muted">Leva menos de 1 minuto.</p>
    <a href="/indicador/registrar" class="btn">Criar minha conta gratuita</a>
  </section>
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
