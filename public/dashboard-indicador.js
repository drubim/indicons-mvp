// ===== PEGAR CÓDIGO DA URL =====
const params = new URLSearchParams(window.location.search);
const codigo = params.get("codigo") || "SEU_CODIGO";

// ===== GERAR LINK DO INDICADOR =====
const link = `https://app.indicons.com.br/indicador.html?codigo=${codigo}`;

const inputLink = document.getElementById("linkIndicador");
const btnCopiar = document.getElementById("btnCopiar");
const msgCopiado = document.getElementById("msgCopiado");

inputLink.value = link;

btnCopiar.addEventListener("click", () => {
  navigator.clipboard.writeText(link);
  msgCopiado.style.display = "block";
  setTimeout(() => (msgCopiado.style.display = "none"), 1500);
});

// ===== DADOS (EXEMPLO FRONTEND) =====
const indicacoes = [
  { cliente: "João", status: "Registrado", valor: null, comissao: null, data: "10/12" },
  { cliente: "Maria", status: "Em andamento", valor: 180000, comissao: null, data: "12/12" },
  { cliente: "Carlos", status: "Vendido", valor: 250000, comissao: 5000, data: "15/12" }
];

let registrado = 0;
let andamento = 0;
let vendido = 0;
let totalComissao = 0;

const tbody = document.getElementById("listaIndicacoes");

indicacoes.forEach(item => {
  if (item.status === "Registrado") registrado++;
  if (item.status === "Em andamento") andamento++;
  if (item.status === "Vendido") {
    vendido++;
    totalComissao += item.comissao;
  }

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${item.cliente}</td>
    <td><span class="badge ${item.status.toLowerCase().replace(" ", "")}">${item.status}</span></td>
    <td>${item.valor ? moeda(item.valor) : "—"}</td>
    <td>${item.status === "Vendido" ? moeda(item.comissao) : "—"}</td>
    <td>${item.data}</td>
  `;
  tbody.appendChild(tr);
});

document.getElementById("registrado").innerText = registrado;
document.getElementById("andamento").innerText = andamento;
document.getElementById("vendido").innerText = vendido;
document.getElementById("totalComissao").innerText = moeda(totalComissao);

// ===== HELPERS =====
function moeda(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}
 
