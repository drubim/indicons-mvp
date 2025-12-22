// pega codigo da URL
const params = new URLSearchParams(window.location.search);
const codigo = params.get("codigo");

const link = `https://app.indicons.com.br/indicador.html?codigo=${codigo}`;

document.getElementById("linkIndicador").value = link;

document.getElementById("copiar").onclick = () => {
  navigator.clipboard.writeText(link);
  const msg = document.getElementById("msg");
  msg.style.display = "block";
  setTimeout(() => msg.style.display = "none", 1500);
};

// dados simulados (frontend apenas)
const dados = [
  { cliente: "João", status: "Registrado", valor: null, comissao: null, data: "10/12" },
  { cliente: "Maria", status: "Em andamento", valor: 180000, comissao: null, data: "12/12" },
  { cliente: "Carlos", status: "Vendido", valor: 250000, comissao: 5000, data: "15/12" }
];

let r=0,a=0,v=0,c=0;
const tbody = document.getElementById("lista");

dados.forEach(d => {
  if (d.status==="Registrado") r++;
  if (d.status==="Em andamento") a++;
  if (d.status==="Vendido") { v++; c+=d.comissao; }

  tbody.innerHTML += `
    <tr>
      <td>${d.cliente}</td>
      <td>${d.status}</td>
      <td>${d.valor?d.valor.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}):"-"}</td>
      <td>${d.comissao?d.comissao.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}):"-"}</td>
      <td>${d.data}</td>
    </tr>
  `;
});

document.getElementById("r").innerText=r;
document.getElementById("a").innerText=a;
document.getElementById("v").innerText=v;
document.getElementById("c").innerText=c.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
