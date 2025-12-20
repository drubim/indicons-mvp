document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;

  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    if (!response.ok) {
      alert('Usuário ou senha inválidos');
      return;
    }

    const data = await response.json();

    if (data.role === 'admin') window.location.href = 'admin.html';
    if (data.role === 'parceiro') window.location.href = 'parceiro.html';
    if (data.role === 'indicador') window.location.href = 'indicador.html';

  } catch (error) {
    alert('Erro ao conectar no servidor');
  }
});
