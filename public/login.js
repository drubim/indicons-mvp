document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;

  const res = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha })
  });

  if (!res.ok) {
    alert('Usuário ou senha inválidos');
    return;
  }

  const data = await res.json();

  // 🔴 AQUI É O PONTO CRÍTICO
  if (data.role === 'indicador') {
    if (!data.codigo) {
      alert('Erro: indicador sem código');
      return;
    }
    window.location.href = `/indicador.html?codigo=${data.codigo}`;
    return;
  }

  if (data.role === 'parceiro') {
    window.location.href = '/parceiro.html';
    return;
  }

  if (data.role === 'admin') {
    window.location.href = '/admin.html';
    return;
  }
});
