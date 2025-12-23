const express = require('express');
const path = require('path');
const session = require('express-session');
const crypto = require('crypto');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;

/* ======================
   RENDER / PROXY FIX
====================== */
app.set('trust proxy', 1);

/* ======================
   GOOGLE CALENDAR
====================== */
const authGoogle = new google.auth.GoogleAuth({
  keyFile: 'calendar.json',
  scopes: ['https://www.googleapis.com/auth/calendar']
});
const calendar = google.calendar({ version: 'v3', auth: authGoogle });

/* ======================
   MIDDLEWARE
====================== */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  name: 'indicons.sid',
  secret: 'indicons-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,      // HTTPS
    sameSite: 'lax'
  }
}));

app.use(express.static(path.join(__dirname, 'public')));

/* ======================
   USERS
====================== */
const users = [
  { id: 1, email: 'admin@indicons.com.br', senha: 'admin123', role: 'admin' },
  { id: 2, email: 'parceiro@indicons.com.br', senha: 'parceiro123', role: 'parceiro' }
];

let indicadorId = 100;

/* ======================
   LEADS
====================== */
let leads = [];
let leadId = 1;

/* ======================
   LOGIN (TESTE VISÍVEL)
====================== */
app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  const user = users.find(u => u.email === email && u.senha === senha);
  if (!user) {
    return res.send('LOGIN INVALIDO');
  }

  req.session.user = {
    id: user.id,
    role: user.role
  };

  res.send(`LOGADO COMO ${user.role}`);
});

/* ======================
   TESTE DE SESSÃO
====================== */
app.get('/debug/session', (req, res) => {
  res.json({
    session: req.session.user || null
  });
});

/* ======================
   START
====================== */
app.listen(PORT, () => {
  console.log('INDICONS rodando (login fix Render)');
});
