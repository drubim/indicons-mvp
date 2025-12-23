const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

/* =====================================================
   CONFIGURAÇÃO BÁSICA
   ===================================================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

/* =====================================================
   BASES EM MEMÓRIA (TEMPORÁRIO – SEM QUEBRAR FRONT)
   ===================================================== */

/**
 * USUÁRIOS INTERNOS
 * (admin, parceiro, indicadores cadastrados)
 */
let usuarios = [
  {
    id: "ADMIN_01",
    nome: "Admin",
    email: "admin@indicons.com.br",
    senha: "admin123",
    role: "admin"
  },
  {
    id: "PARCEIRO_01",
    nome: "Parceiro",
    email: "parceiro@indicons.com.br",
    senha: "parceiro123",
    role: "parceiro"
  }
];

/**
 * LEADS (CLIENTES INDICADOS)
 * BASE ÚNICA PARA TODOS OS PAINÉIS
 */
let leads = [];

/* =====================================================
   ROTAS HTML (SEM MUDAR NOMES DE ARQUIVOS)
   ===================================================== */

app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

app.get("/login", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "login.html"))
);

app.get("/cadastro", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "cadastro.html"))
);

app.get("/cadastro-indicador", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "cadastro-indicador.html"))
);

app.get("/admin", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "admin.html"))
);

app.get("/parceiro", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "parceiro.html"))
);

app.get("/indicador", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "indicador.html"))
);

/* =====================================================
   LOGIN (SEM IMPACTAR PAINÉIS)
   ===================================================== */

app.post("/api/login", (req, res) => {
  const { email, senha } = req.body;

  const usuario = usuarios.find(
    u => u.email === email && u.senha === senha
  );

  if (!usuario) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  res.json({
    success: true,
    role: usuario.role,
    indicador_codigo: usuario.codigo_indicador || null,
    parceiro_id: usuario.id
  });
});

/* =====================================================
   CADASTRO DE INDICADOR (VISÍVEL NA HOME)
   ===================================================== */

app.post("/api/indicadores", (req, res) => {
  const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();

  const indicador = {
    id: "IND_" + Date.now(),
    nome: req.body.nome,
    email: req.body.email,
    telefone: req.body.telefone,
    senha: req.body.senha,
    role: "indicador",
    codigo_indicador: codigo
  };

  usuarios.push(indicador);

  res.json({
    success: true,
    codigo_indicador: codigo
  });
});

/* =====================================================
   CADASTRO DE CLIENTE (LEAD)
   ===================================================== */

app.post("/api/clientes", (req, res) => {
  const lead = {
    id: Date.now(),

    /* campos usados nos painéis */
    cliente: req.body.nome,
    nome: req.body.nome,
    telefone: req.body.telefone,
    email: req.body.email,
    data: new Date().toLocaleDateString("pt-BR"),

    status: "Registrado",
    valor: null,
    comissao: null,

    indicador: req.body.indicador_codigo,
    parceiro: null,

    /* campos internos (IA – NÃO VISÍVEL AO INDICADOR) */
    _statusIA: "pendente",
    _reuniaoAgendada: false,
    _dataReuniao: null
  };

  leads.push(lead);

  /* IA roda em segundo plano */
  processarIA(lead);

  res.json({ success: true });
});

/* =====================================================
   LISTAGEM DE LEADS (ADMIN / PARCEIRO / INDICADOR)
   ===================================================== */

app.get("/api/leads", (req, res) => {
  res.json(leads);
});

/* =====================================================
   IA (INVISÍVEL AO INDICADOR)
   ===================================================== */

function processarIA(lead) {
  // Simulação de triagem automática
  lead._statusIA = "quente";

  // Atribui parceiro e agenda (interno)
  lead.parceiro = "PARCEIRO_01";
  lead._reuniaoAgendada = true;
  lead._dataReuniao = new Date(Date.now() + 86400000);
}

/* =====================================================
   START
   ===================================================== */

app.listen(PORT, () => {
  console.log("INDICONS rodando na porta", PORT);
  console.log(
    "Usuarios carregados:",
    usuarios.map(u => `${u.role}: ${u.email}`)
  );
});

/* deploy trigger */
