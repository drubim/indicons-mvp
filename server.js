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
   BASE EM MEMÓRIA (TEMPORÁRIA, SEM QUEBRAR FRONT)
   ===================================================== */
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

let leads = [];

/* =====================================================
   ROTAS HTML (MAPEADAS PARA OS ARQUIVOS EXISTENTES)
   ===================================================== */

// HOME
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// LOGIN
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// CADASTRO DE INDICADOR
app.get("/cadastro-indicador", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "cadastro-indicador.html"));
});

// CADASTRO DE CLIENTE
app.get("/cadastro", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "cadastro.html"));
});

// PAINÉIS PREMIUM (SEM MEXER EM LAYOUT)
app.get("/painel
