fetch("/api/parceiro/leads")
  .then(res => res.json())
  .then(leads => {
    const tbody = document.getElementById("leadsTable");

    leads.forEach(l => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${l.nome}</td>
        <td>${l.telefone}</td>
        <td>${l.email}</td>
        <td>${l.administradora || "-"}</td>
        <td>R$ ${l.valor || "-"}</td>
        <td>
          <select data-id="${l.id}">
            <option value="PRE_ADESAO" ${l.status==="PRE_ADESAO"?"selected":""}>Pré-adesão</option>
            <option value="EM_ATENDIMENTO" ${l.status==="EM_ATENDIMENTO"?"selected":""}>Em atendimento</option>
            <option value="VENDIDO" ${l.status==="VENDIDO"?"selected":""}>Vendido</option>
            <option value="CANCELADO" ${l.status==="CANCELADO"?"selected":""}>Cancelado</option>
          </select>
        </td>
        <td>
          <button onclick="atualizarStatus(${l.id})">Salvar</button>
        </td>
      `;

      tbody.appendChild(tr);
    });
  });

function atualizarStatus(id) {
  const select = document.querySelector(`select[data-id="${id}"]`);
  const status = select.value;

  fetch("/api/parceiro/status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ leadId: id, status })
  })
  .then(() => alert("Status atualizado com sucesso"));
}
