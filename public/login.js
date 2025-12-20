// =======================================
// LOGIN.JS - FUNCIONAL E ROBUSTO
// =======================================

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('loginForm');
  const erro = document.getElementById('erro');

  // DEBUG VISUAL (REMOVA DEPOIS SE QUISER)
  console.log('login.js carregado com sucesso');

  if (!form) {
    alert('ERRO: Formulário de login não encontrado.');
    return;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    erro.style.display = 'none';

    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value.trim();

    if (!email || !senha) {
      erro.innerText = 'Preencha e-mail e senha.';
      erro.style.display = 'block';
      return;
    }

    fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, senha })
    })
      .then(async res => {
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || 'Usuário ou senha inválidos');
        }
        return res.json();
      })
      .then(data => {
        // Salva token
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);

        // Redireciona conforme perfil
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
        erro.innerText = err.message || 'Erro ao entrar';
        erro.style.display = 'block';
      });
  });
});
