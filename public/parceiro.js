function fechar() {
  fetch('/api/parceiro/venda', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + localStorage.token
    },
    body: JSON.stringify({
      cliente_id: cliente.value,
      produto_id: 1,
      valor_carta: valor.value
    })
  }).then(() => alert('Venda registrada'));
}
