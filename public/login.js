document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const erro = document.getElementById('erro');

  erro.style.display = 'none';

  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    if (!data.ok) {
      erro.innerText = 'Login inválido';
      erro.style.display = 'block';
      return;
    }

    // 🔀 Redirecionamento por perfil
    if (data.role === 'admin') {
      window.location.href = '/admin.html';
      return;
    }

    if (data.role === 'parceiro') {
      window.location.href = '/parceiro.html';
      return;
    }

    if (data.role === 'indicador') {
      window.location.href = '/indicador.html';
      return;
    }

    erro.innerText = 'Perfil não reconhecido';
    erro.style.display = 'block';

  } catch (err) {
    erro.innerText = 'Erro ao conectar com o servidor';
    erro.style.display = 'block';
  }
});
