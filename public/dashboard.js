fetch("/api/dashboard")
  .then(res => res.json())
  .then(leads => {

    document.getElementById("totalLeads").innerText = leads.length;

    const aprovadas = leads.filter(l => l.status === "VENDIDO");
    document.getElementById("totalVendas").innerText = aprovadas.length;

    const total = aprovadas.reduce((s,l)=>s+(Number(l.valor)||0),0);
    const comissao = total * 0.015;
    document.getElementById("totalComissao").innerText =
      "R$ " + comissao.toFixed(2);

    // TABELA
    const tbody = document.getElementById("financeiroTabela");
    leads.forEach(l => {
      tbody.innerHTML += `
        <tr>
          <td>${l.nome}</td>
          <td>${l.administradora || "-"}</td>
          <td>R$ ${l.valor || "-"}</td>
          <td>${l.status}</td>
        </tr>
      `;
    });

    // FUNIL
    const statusCount = {};
    leads.forEach(l => {
      statusCount[l.status] = (statusCount[l.status] || 0) + 1;
    });

    new Chart(document.getElementById("funilChart"), {
      type: "bar",
      data: {
        labels: Object.keys(statusCount),
        datasets: [{
          label: "Leads",
          data: Object.values(statusCount),
          backgroundColor: "#2563eb"
        }]
      },
      options: {
        plugins: { legend: { display:false } },
        scales: { y: { beginAtZero:true } }
      }
    });

  });
