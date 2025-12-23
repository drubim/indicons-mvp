document.getElementById("formPreAdesao").addEventListener("submit", async e => {
  e.preventDefault();

  const form = e.target;

  const dados = {
    nome: form.nome.value,
    telefone: form.telefone.value,
    email: form.email.value,
    administradora: form.administradora.value,
    valor: form.valor.value
  };

  try {
    const res = await fetch("/api/pre-adesao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados)
    });

    const r = await res.json();

    if (r.sucesso) {
      alert("Pré-adesão enviada com sucesso! Em breve entraremos em contato.");
      form.reset();
    } else {
      alert("Erro ao enviar pré-adesão.");
    }
  } catch (err) {
    alert("Erro de conexão.");
  }
});
