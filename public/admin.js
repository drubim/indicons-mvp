fetch("/api/admin/dashboard")
  .then(res => res.json())
  .then(data => {

    document.getElementById("totalUsuarios").innerText = data.usuarios;
    document.getElementById("totalLeads").innerText = data.leads;
    document.getElementById("totalComissao").innerText =
      "R$ " + (data.comissao || 0).toFixed(2);
  });

/* USUÁRIOS */
fetch("/api/admin/usuarios")
  .then(res => res.json())
  .then(usuarios => {
    const tbody = document.getElementById("usuariosTabela");
    usuarios.forEach(u => {
      tbody.innerHTML += `
        <tr>
          <td>${u.nome}</td>
          <td>${u.email}</td>
          <td>${u.tipo}</td>
        </tr>
      `;
    });
  });

/* LEADS */
fetch("/api/admin/leads")
  .then(res => res.json())
  .then(leads => {
    const tbody = document.getElementById("leadsTabela");
    leads.forEach(l => {
      tbody.innerHTML += `
        <tr>
          <td>${l.nome}</td>
          <td>${l.email}</td>
          <td>R$ ${l.valor || "-"}</td>
          <td>${l.status}</td>
        </tr>
      `;
    });
  });
