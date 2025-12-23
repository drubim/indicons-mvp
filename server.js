const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

/* =======================
   MIDDLEWARE
======================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

/* =======================
   USUÁRIOS EM MEMÓRIA
======================= */
let usuarios = [
  { id: 1, email: 'admin@indicons.com.br', senha: 'admin123', role: 'admin' },
  { id: 2, email: 'parceiro@indicons.com.br', senha: 'parceiro123', role: 'parceiro' }
];

let indicadorIdCounter = 100;

/* =======================
   LOGIN API
======================= */
app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;

  const user = usuarios.find(
    u => u.email === email && u.senha === senha
  );

  if (!user) {
    return res.status(401).json({ error: 'Usuário inválido' });
  }

  res.json({ role: user.role });
});

/* =======================
   CADASTRO INDICADOR
======================= */
app.post('/api/cadastro-indicador', (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'Dados inválidos' });
  }

  if (usuarios.find(u => u.email === email)) {
    return res.status(409).json({ error: 'Usuário já existe' });
  }

  usuarios.push({
    id: indicadorIdCounter++,
    email,
    senha,
    role: 'indicador'
  });

  res.json({ sucesso: true });
});

/* =======================
   🔒 AUTH BRIDGE (CHAVE)
======================= */
app.get('/auth/:role', (req, res) => {
  const { role } = req.params;

  if (!['admin', 'parceiro', 'indicador'].includes(role)) {
    return res.status(403).send('Acesso inválido');
  }

  res.send(`
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body>
      <script>
        // grava tudo que QUALQUER painel possa exigir
        localStorage.setItem('token', 'ok');
        localStorage.setItem('role', '${role}');
        localStorage.setItem('perfil', '${role}');
        localStorage.setItem('usuario', 'logado');

        sessionStorage.setItem('token', 'ok');
        sessionStorage.setItem('role', '${role}');
        sessionStorage.setItem('perfil', '${role}');
        sessionStorage.setItem('usuario', 'logado');

        // redireciona para o painel real
        window.location.href = '/${role}.html';
      </script>
    </body>
    </html>
  `);
});

/* =======================
   ROTA INVISÍVEL
======================= */
app.get('/i/:codigo', (req, res) => {
  res.send('Cadastro recebido. Em breve entraremos em contato.');
});

/* =======================
   START
======================= */
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
