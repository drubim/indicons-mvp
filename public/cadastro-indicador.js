document.getElementById('cadastroIndicadorForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const erro = document.getElementById('erro');
  erro.style.display = 'none';

  try {
    const res = await fetch('/cadastro-indicador', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // 🔑 mantém sessão
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    if (!data.ok) {
      erro.innerText = 'Erro ao cadastrar indicador';
      erro.style.display = 'block';
      return;
    }

    // 🔗 Link gerado com sucesso
    console.log('Link do indicador:', data.link);

    // Redireciona para o painel do indicador
    window.location.href = '/indicador.html';

  } catch (err) {
    erro.innerText = 'Erro ao conectar com o servidor';
    erro.style.display = 'block';
  }
});
