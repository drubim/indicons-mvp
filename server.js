const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

/* BASE ÚNICA */
let leads = [];

/* =====================================
   FUNÇÃO CENTRAL DE CRIAÇÃO DE LEAD
   ===================================== */
function criarLead(data) {
  const lead = {
    id: Date.now(),
    nome: data.nome,
    telefone: data.telefone,
    email: data.email || null,

    indicador_codigo: data.indicador_codigo || null,
    parceiro_id: null,

    status: "registrado",
    status_ia: "pendente",

    valor_consorcio: null,
    comissao: null,

    reuniao_agendada: false,
    data_reuniao: null,

    criado_em: new Date()
  };

  leads.push(lead);

  // chama IA após criar
  processarLeadComIA(lead);

  return lead;
}

/* =====================================
   CADASTRO ANTIGO (MANTIDO)
   ===================================== */
app.post("/api/clientes", (req, res) => {
  try {
    const lead = criarLead(req.body);
    res.json({ success: true, lead });
  } catch (e) {
    res.status(400).json({ error: "Erro ao cadastrar cliente" });
  }
});

/* =====================================
   NOVO ENDPOINT (OPCIONAL)
   ===================================== */
app.post("/api/leads", (req, res) => {
  try {
    const lead = criarLead(req.body);
    res.json({ success: true, lead });
  } catch (e) {
    res.status(400).json({ error: "Erro ao cadastrar lead" });
  }
});

/* =====================================
   LISTAGEM (INDICADOR / PARCEIRO / ADMIN)
   ===================================== */
app.get("/api/clientes", (req, res) => {
  const { indicador, parceiro } = req.query;
  let resultado = leads;

  if (indicador) {
    resultado = resultado.filter(l => l.indicador_codigo === indicador);
  }

  if (parceiro) {
    resultado = resultado.filter(l => l.parceiro_id === parceiro);
  }

  res.json(resultado);
});

/* =====================================
   ATUALIZAÇÃO (PARCEIRO / ADMIN)
   ===================================== */
app.put("/api/clientes/:id", (req, res) => {
  const lead = leads.find(l => l.id == req.params.id);
  if (!lead) return res.status(404).json({ error: "Lead não encontrado" });

  Object.assign(lead, req.body);

  if (lead.status === "vendido" && lead.valor_consorcio) {
    lead.comissao = lead.valor_consorcio * 0.02;
  }

  res.json({ success: true, lead });
});

/* =====================================
   IA – TRIAGEM + AGENDAMENTO
   ===================================== */
function processarLeadComIA(lead) {
  // ⚠️ lógica simples (substituir por IA real depois)
  const leadQuente = true;

  if (leadQuente) {
    lead.status_ia = "quente";
    lead.parceiro_id = "CLOSER_01";
    lead.reuniao_agendada = true;
    lead.data_reuniao = new Date(Date.now() + 86400000);
  } else {
    lead.status_ia = "frio";
  }
}

app.listen(PORT, () => {
  console.log("INDICONS rodando corretamente");
});

// deploy trigger
