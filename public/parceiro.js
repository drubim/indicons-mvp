fetch("/api/parceiro/leads")
  .then(res => res.json())
  .then(leads => {
    const tbody = document.getElementById("leads");

    leads.forEach(l => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${l.nome}</td>
        <td>${l.telefone}</td>
        <td>${l.administradora}</td>
        <td>R$ ${l.valor}</td>
        <td>${l.status}</td>
        <td>
          <select onchange="updateStatus(${l.id}, this.value)">
            <option>PRE_ADESAO</option>
            <option>EM_ATENDIMENTO</option>
            <option>VENDIDO</option>
            <option>CANCELADO</option>
          </select>
        </td>
      `;
      tbody.appendChild(tr);
    });
  });

function updateStatus(id, status) {
  fetch("/api/parceiro/status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ leadId: id, status })
  });
}
