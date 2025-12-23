document
  .getElementById("formPreAdesao")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const f = e.target;

    const dados = {
      nome: f.nome.value,
      telefone: f.telefone.value,
      email: f.email.value,
      administradora: f.administradora.value,
      valor: f.valor.value,
    };

    const res = await fetch("/api/pre-adesao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    const r = await res.json();

    if (r.sucesso) {
      alert("Pré-adesão enviada com sucesso!");
      f.reset();
    } else {
      alert("Erro ao enviar");
    }
  });
