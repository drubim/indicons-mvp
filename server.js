const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

/* ===============================
   BASE EM MEMÓRIA
   =============================== */
let usuarios = [
  {
    id: "ADMIN_01",
    nome: "Admin",
    email: "admin@indicons.com.br",
    senha: "admin123",
    role: "admin"
  },
  {
    id: "CLOSER_01",
    nome: "Parceiro",
    email: "parceiro@indicons.com.br",
    senha: "parceiro123",
    role: "parceiro"
  }
];

let leads = [];

/* ===============================
   ROTAS HTML
   =============================== */
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

app.get("/login", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "login.html"))
);

app.get("/cadastro-indicador", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "cadastro-indicador.html"))
);

app.get("/cadastro", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "cadastro.html"))
);

app.get("/painel-indicador", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "painel-indicador.html"))
);

app.get("/painel-parceiro", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "painel-parceiro.html"))
);

app.get("/painel-admin", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "painel-admin.html"))
);

/* ===============================
   API – LOGIN
   =============================== */
app.post("/api/login", (req, res) => {
  const { email, senha } = req.body;

  const user = usuarios.find(
    u => u.email === email && u.senha === senha
  );

  if (!user) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  res.json({
    success: true,
    role: user.role,
    codigo_indicador: user.codigo_indicador || null,
    parceiro_id: user.id
  });
});

/* ===============================
   API – CADASTRO INDICADOR
   =============================== */
app.post("/api/indicadores", (req, res) => {
  const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();

  usuarios.push({
    id: Date.now().toString(),
    nome: req.body.nome,
    email: req.body.email,
    telefone: req.body.telefone,
    senha: req.body.senha,
    role: "indicador",
    codigo_indicador: codigo
  });

  res.json({ success: true, codigo_indicador: codigo });
});

/* ===============================
   API – CADASTRO CLIENTE
   =============================== */
app.post("/api/clientes", (req, res) => {
  const lead = {
    id: Date.now(),
    nome: req.body.nome,
    telefone: req.body.telefone,
    email: req.body.email,
    criado_em: new Date(),

    indicador_codigo: req.body.indicador_codigo,
    parceiro_id: "CLOSER_01",

    status: "registrado",
    valor_consorcio: null,
    comissao: null,

    status_ia: "quente",
    reuniao_agendada: true,
    data_reuniao: new Date(Date.now() + 86400000)
  };

  leads.push(lead);
  res.json({ success: true });
});

/* ===============================
   API – LISTAGEM
   =============================== */
app.get("/api/leads", (req, res) => {
  res.json(leads);
});

app.listen(PORT, () => {
  console.log("INDICONS rodando na porta", PORT);
  console.log("Usuarios:", usuarios.map(u => u.email));
});

// deploy trigger
