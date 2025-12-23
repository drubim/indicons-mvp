const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const SECRET = 'indicons-secret';

/* ======================
   MODELS
====================== */
let Usuario = null;
let Indicador = null;
let Lead = null;

try {
  const db = require('./models');
  Usuario = db.Usuario;
  Indicador = db.Indicador;
  Lead = db.Lead;
} catch {
  console.log('Models não carregados');
}

/* ======================
   CRIAR USUÁRIOS PADRÃO
====================== */
async function criarUsuariosPadrao() {
  if (!Usuario) return;

  const usuarios = [
    { email: 'admin@indicons.com.br', senha: 'admin123', role: 'admin' },
    { email: 'parceiro@indicons.com.br', senha: 'parceiro123', role: 'parceiro' }
  ];

  for (const u of usuarios) {
    const existe = await Usuario.findOne({ where: { email: u.email } });
    if (!existe) {
      await Usuario.create(u);
    }
  }
}

criarUsuariosPadrao();

/* ======================
   LOGIN
====================== */
app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!Usuario) {
    return res.status(500).json({ erro: 'Sistema indisponível' });
  }

  const usuario = await Usuario.findOne({
    where: { email, senha }
  });

  if (!usuario) {
    return res.status(401).json({ erro: 'Usuário ou senha inválidos' });
  }

  const token = jwt.sign(
    { id: usuario.id, role: usuario.role },
    SECRET,
    { expiresIn: '1d' }
  );

  res.json({ token, role: usuario.role });
});

/* ======================
   ROTA INVISÍVEL
====================== */
app.get('/i/:codigo', async (req, res) => {
  if (!Indicador) {
    return res.sendFile(path.join(__dirname, 'public/cadastro-cliente.html'));
  }

  const indicador = await Indicador.findOne({
    where: { codigo: req.params.codigo }
  });

  if (!indicador) {
    return res.status(404).send('Link inválido');
  }

  res.sendFile(path.join(__dirname, 'public/cadastro-cliente.html'));
});

/* ======================
   START
====================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Indicons rodando');
});
