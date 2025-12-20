document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;
  const erro = document.getElementById('erro');

  erro.style.display = 'none';

  fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, senha })
  })
    .then(res => {
      if (!res.ok) {
        throw new Error('Usuário ou senha inválidos');
      }
      return res.json();
    })
    .then(data => {
      // salva token
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);

      // redireciona conforme papel
      if (data.role === 'admin') {
        window.location.href = '/admin';
      } else if (data.role === 'parceiro') {
        window.location.href = '/parceiro';
      } else if (data.role === 'indicador') {
        window.location.href = '/indicador';
      } else {
        throw new Error('Perfil inválido');
      }
    })
    .catch(err => {
      erro.innerText = err.message;
      erro.style.display = 'block';
    });
});
