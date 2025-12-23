const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

/* ===============================
   ROTAS HTML (CORREÇÃO PRINCIPAL)
   =============================== */

// HOME
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// CADASTRO INDICADOR
app.get("/cadastro-indicador", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "cadastro-indicador.html"));
});

// LOGIN
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// CADASTRO CLIENTE (VIA LINK)
app.get("/cadastro", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "cadastro.html"));
});

// PAINÉIS
app.get("/painel-indicador", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "painel-indicador.html"));
});

app.get("/painel-parceiro", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "painel-parceiro.html"));
});

app.get("/painel-admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "painel-admin.html"));
});

/* ===============================
   BACKEND (MANTIDO)
   =============================== */

let usuarios = [];
let leads = [];

function gerarCodigoIndicador() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// CADASTRO INDICADOR
app.post("/api/indicadores", (req, res) => {
  const codigo = gerarCodigoIndicador();

  usuarios.push({
    id: Date.now(),
    nome: req.body.nome,
    email: req.body.email,
    telefone: req.body.telefone,
    senha: req.body.senha,
    role: "indicador",
    codigo_indicador: codigo
  });

  res.json({ success: true, codigo_indicador: codigo });
});

// LOGIN
app.post("/api/login", (req, res) => {
  const user = usuarios.find(
    u => u.email === req.body.email && u.senha === req.body.senha
  );

  if (!user) return res.status(401).json({ error: "Credenciais inválidas" });

  res.json({
    success: true,
    role: user.role,
    codigo_indicador: user.codigo_indicador || null,
    parceiro_id: user.id
  });
});

// CADASTRO CLIENTE
app.post("/api/clientes", (req, res) => {
  const lead = {
    id: Date.now(),
    nome: req.body.nome,
    telefone: req.body.telefone,
    email: req.body.email,
    criado_em: new Date(),
    indicador_codigo: req.body.indicador_codigo,
    parceiro_id: null,
    status: "registrado",
    valor_consorcio: null,
    comissao: null,
    status_ia: "pendente",
    reuniao_agendada: false,
    data_reuniao: null
  };

  leads.push(lead);
  processarIA(lead);

  res.json({ success: true });
});

// LISTAGEM
app.get("/api/leads", (req, res) => {
  res.json(leads);
});

// IA (BASTIDORES)
function processarIA(lead) {
  lead.status_ia = "quente";
  lead.parceiro_id = "CLOSER_01";
  lead.reuniao_agendada = true;
  lead.data_reuniao = new Date(Date.now() + 86400000);
}

app.listen(PORT, () => {
  console.log("INDICONS rodando corretamente");
});

// deploy trigger
