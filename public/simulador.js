function simular() {
  const valor = Number(document.getElementById("valor").value);
  const totalEl = document.getElementById("total");
  const parcelasEl = document.getElementById("parcelas");

  if (!valor || valor <= 0) {
    alert("Informe um valor válido.");
    return;
  }

  const parcelas = [
    { n: 1, p: 0.005 },
    { n: 2, p: 0.002 },
    { n: 3, p: 0.002 },
    { n: 4, p: 0.002 },
    { n: 5, p: 0.002 },
    { n: 6, p: 0.002 }
  ];

  let total = 0;
  parcelasEl.innerHTML = "";

  parcelas.forEach(parc => {
    const v = valor * parc.p;
    total += v;

    const div = document.createElement("div");
    div.className = "parcela";
    div.innerHTML = `
      <strong>${parc.n}ª parcela</strong>
      <span>${(parc.p * 100).toFixed(2)}%</span>
      <span>R$ ${v.toFixed(2)}</span>
    `;
    parcelasEl.appendChild(div);
  });

  totalEl.innerText = `R$ ${total.toFixed(2)}`;
}
