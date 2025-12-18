fetch("/api/admin/dashboard")
  .then(res => res.json())
  .then(d => {
    document.getElementById("usuarios").innerText = d.usuarios;
    document.getElementById("leads").innerText = d.leads;
    document.getElementById("comissao").innerText = "R$ " + d.comissao;
  });
