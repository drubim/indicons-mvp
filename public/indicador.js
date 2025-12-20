fetch('/api/indicador/clientes', {
  headers: { Authorization: 'Bearer ' + localStorage.token }
})
.then(r => r.json())
.then(d => {
  d.forEach(c => {
    lista.innerHTML += `<li>${c.nome} - ${c.status_externo} - ${c.valor_carta || ''}</li>`;
  });
});
