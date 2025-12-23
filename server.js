const express = require('express');
const path = require('path');
const session = require('express-session');
const crypto = require('crypto');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;

/* ======================
   MIDDLEWARE / SESSÃO
====================== */
app.set('trust proxy', 1);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  name: 'indicons.sid',
  secret: 'indicons-secret',
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    secure: true,
    sameSite: 'lax'
  }
}));

app.use(express.static(path.join(__dirname, 'public')));

/* ======================
   GOOGLE CALENDAR + MEET
====================== */
const auth = new google.auth.GoogleAuth({
  keyFile: 'calendar.json', // arquivo da service account
  scopes: ['https://www.googleapis.com/auth/calendar']
});

const calendar = google.calendar({ version: 'v3', auth });

// ⚠️ TROQUE PELO SEU CALENDÁRIO REAL
const CALENDAR_ID = 'SEU_CALENDARIO@gmail.com';

/* ======================
   USUÁRIOS
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
   LOGIN / CADASTRO
====================== */
app.post('/login', (req, res) => {
  const { email, senha } = req.body;
  const user = users.find(u => u.email === email && u.senha === senha);
  if (!user) return res.redirect('/login.html');

  req.session.user = { id: user.id, role: user.role };
  res.redirect('/dashboard');
});

app.post('/cadastro-indicador', (req, res) => {
  const { email, senha } = req.body;

  users.push({
    id: indicadorId++,
    email,
    senha,
    role: 'indicador',
    codigo: crypto.randomBytes(4).toString('hex')
  });

  res.redirect('/login.html');
});

app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/login.html');

  if (req.session.user.role === 'admin') return res.redirect('/admin.html');
  if (req.session.user.role === 'parceiro') return res.redirect('/parceiro.html');
  if (req.session.user.role === 'indicador') return res.redirect('/indicador.html');
});

/* ======================
   APIs INDICADOR / ADMIN
====================== */
app.get('/api/indicador/link', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'indicador') {
    return res.sendStatus(401);
  }

  const indicador = users.find(u => u.id === req.session.user.id);
  res.json({ link: `https://app.indicons.com.br/i/${indicador.codigo}` });
});

app.get('/api/leads/indicador', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'indicador') {
    return res.sendStatus(401);
  }

  res.json(leads.filter(l => l.indicadorId === req.session.user.id));
});

app.get('/api/leads/admin', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.sendStatus(401);
  }

  res.json(leads);
});

/* ======================
   FORM CLIENTE
====================== */
app.get('/i/:codigo', (req, res) => {
  const indicador = users.find(u => u.codigo === req.params.codigo);
  if (!indicador) return res.send('Link inválido');

  res.send(`
    <h2>Receba uma simulação</h2>
    <form method="POST">
      <input name="nome" required placeholder="Nome"><br><br>
      <input name="telefone" required placeholder="Telefone"><br><br>
      <button>Enviar</button>
    </form>
  `);
});

/* ======================
   RECEBE LEAD + AGENDA
====================== */
app.post('/i/:codigo', async (req, res) => {
  const indicador = users.find Elliott => u.codigo === req.params.codigo);
  if (!indicador) return res.send('Link inválido');

  const score = Math.floor(Math.random() * 100);

  let status = 'Recebido';
  let reuniaoAgendada = false;
  let meetLink = null;
  let dataReuniao = null;

  if (score >= 70) {
    try {
      const start = new Date();
      start.setHours(start.getHours() + 2);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 30);

      const event = await calendar.events.insert({
        calendarId: CALENDAR_ID,
        conferenceDataVersion: 1,
        requestBody: {
          summary: `Reunião INDICONS – ${req.body.nome}`,
          start: { dateTime: start.toISOString() },
          end: { dateTime: end.toISOString() },
          conferenceData: {
            createRequest: { requestId: crypto.randomUUID() }
          }
        }
      });

      reuniaoAgendada = true;
      meetLink = event.data.hangoutLink;
      dataReuniao = start;
      status = 'Reunião agendada';

    } catch (err) {
      console.error('Erro ao agendar reunião:', err.message);
      status = 'Aguardando agendamento';
    }
  }

  leads.push({
    id: leadId++,
    nome: req.body.nome,
    telefone: req.body.telefone,
    indicadorId: indicador.id,
    score,
    status,
    reuniaoAgendada,
    meetLink,
    dataReuniao,
    criadoEm: new Date()
  });

  res.send('Cadastro realizado com sucesso.');
});

/* ======================
   LOGOUT
====================== */
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login.html'));
});

/* ======================
   START
====================== */
app.listen(PORT, () => {
  console.log('INDICONS – Google Calendar + Meet ativos');
});
