const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

/* MIDDLEWARES */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* SERVIR FRONTEND */
app.use(express.static(path.join(__dirname, 'public')));

/* LOGIN */
app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  // CONTAS FIXAS PARA TESTE
  if (email === 'admin@indicons.com.br' && senha === 'admin123') {
    return res.json({ role: 'admin' });
  }

  if (email === 'parceiro@indicons.com.br' && senha === 'parceiro123') {
    return res.json({ role: 'parceiro' });
  }

  if (email === 'indicador@indicons.com.br' && senha === 'indicador123') {
    return res.json({ role: 'indicador' });
  }

  return res.status(401).json({ error: 'Credenciais inválidas' });
});

/* ROTAS HTML */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login.html'));
});

/* START */
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
