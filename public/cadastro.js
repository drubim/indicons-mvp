document.getElementById('cadastroForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;

  const response = await fetch('/cadastro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha })
  });

  if (response.ok) {
    alert('Cadastro realizado com sucesso');
    window.location.href = 'login.html';
  } else {
    const erro = await response.json();
    alert(erro.error || 'Erro ao cadastrar');
  }
});
