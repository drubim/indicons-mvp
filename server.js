const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

/* BASE EM MEMÓRIA (substitui banco por enquanto) */
let leads = [];

/* ===============================
   1️⃣ CADASTRO DE LEAD (INDICADOR)
   =============================== */
app.post("/api/leads", async (req, res) => {
  const lead = {
    id: Date.now(),
    nome: req.body.nome,
    telefone: req.body.telefone,
    email: req.body.email,

    indicador_codigo: req.body.indicador_codigo,
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

  // 👉 CHAMA IA APÓS CADASTRO
  processarLeadComIA(lead);

  res.json({ success: true });
});

/* ===============================
   2️⃣ LISTAGEM (INDICADOR / PARCEIRO / ADMIN)
   =============================== */
app.get("/api/leads", (req, res) => {
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

/* ===============================
   3️⃣ ATUALIZAÇÃO (PARCEIRO / ADMIN)
   =============================== */
app.put("/api/leads/:id", (req, res) => {
  const lead = leads.find(l => l.id == req.params.id);
  if (!lead) return res.status(404).end();

  Object.assign(lead, req.body);

  if (lead.status === "vendido") {
    lead.comissao = lead.valor_consorcio * 0.02;
  }

  res.json(lead);
});

/* ===============================
   4️⃣ IA – TRIAGEM + AGENDAMENTO
   =============================== */
function processarLeadComIA(lead) {
  // SIMULA TRIAGEM (substituir por IA real)
  const leadQuente = true; // regra simples por enquanto

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
  console.log("INDICONS rodando");
});

// deploy trigger
