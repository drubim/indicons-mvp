const express = require('express');
const path = require('path');
const session = require('express-session');
const crypto = require('crypto');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;

/* ======================
   GOOGLE CALENDAR / MEET
====================== */
const authGoogle = new google.auth.GoogleAuth({
  keyFile: 'calendar.json', // arquivo na raiz
  scopes: ['https://www.googleapis.com/auth/calendar']
});

const calendar = google.calendar({ version: 'v3', auth: authGoogle });

/* ======================
   MIDDLEWARE
====================== */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: 'indicons-secret',
  resave: false,
  saveUninitialized: false
}));

app.use(express.static(path.join(__dirname, 'public')));

/* ======================
   USUÁRIOS EM MEMÓRIA
====================== */
const users = [
  { id: 1, email: 'admin@indicons.com.br', senha: 'admin123', role: 'admin' },
  { id: 2, email: 'parceiro@indicons.com.br', senha: 'parceiro123', role: 'parceiro' }
];

let indicadorId = 100;

/* ======================
   LEADS / MEETINGS
====================== */
let leads = [];
let meetings = [];
let leadId = 1;
let meetingId = 1;

/* ======================
   PARCEIROS (ROUND-ROBIN)
====================== */
let parceiroIndex = 0;
function getNextParceiroId() {
  const parceiros = users.filter(u => u.role === 'parceiro');
  if (!parceiros.length) return null;
  const parceiro = parceiros[parceiroIndex % parceiros.length];
  parceiroIndex++;
  return parceiro.id;
}

/* ======================
   AUTH / LOGIN
====================== */
app.post('/login', (req, res) => {
  const { email, senha } = req.body;
  const user = users.find(u => u.email === email && u.senha === senha);
  if (!user) return res.redirect('/login.html');

  req.session.user = { id: user.id, role: user.role };
  res.redirect('/dashboard');
});

function protect(role) {
  return (req, res, next) => {
    if (!req.session.user || req.session.user.role !== role) {
      return res.redirect('/login.html');
    }
    next();
  };
}

/* ======================
   DASHBOARD
====================== */
app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/login.html');
  if (req.session.user.role === 'admin') return res.redirect('/admin');
  if (req.session.user.role === 'parceiro') return res.redirect('/parceiro');
  if (req.session.user.role === 'indicador') return res.redirect('/indicador');
});

/* ======================
   PAINÉIS (HTMLs EXISTENTES)
====================== */
app.get('/admin', protect('admin'), (req, res) =>
  res.sendFile(path.join(__dirname, 'public/admin.html'))
);
app.get('/parceiro', protect('parceiro'), (req, res) =>
  res.sendFile(path.join(__dirname, 'public/parceiro.html'))
);
app.get('/indicador', protect('indicador'), (req, res) =>
  res.sendFile(path.join(__dirname, 'public/indicador.html'))
);

/* ======================
   CADASTRO INDICADOR
====================== */
app.post('/cadastro-indicador', (req, res) => {
  const { email, senha } = req.body;
  const codigo = crypto.randomBytes(4).toString('hex');

  users.push({
    id: indicadorId++,
    email,
    senha,
    role: 'indicador',
    codigo
  });

  res.redirect('/login.html');
});

/* ======================
   LINK DO INDICADOR
====================== */
app.get('/api/indicador/link', protect('indicador'), (req, res) => {
  const indicador = users.find(u => u.id === req.session.user.id);
  res.json({ link: `https://app.indicons.com.br/i/${indicador.codigo}` });
});

/* ======================
   APIs DE LEADS
====================== */
app.get('/api/leads/admin', protect('admin'), (req, res) => res.json(leads));

app.get('/api/leads/indicador', protect('indicador'), (req, res) =>
  res.json(leads.filter(l => l.indicadorId === req.session.user.id))
);

app.get('/api/leads/parceiro', protect('parceiro'), (req, res) =>
  res.json(leads.filter(l => l.parceiroId === req.session.user.id))
);

/* ======================
   APIs DE REUNIÕES
====================== */
app.get('/api/meetings/admin', protect('admin'), (req, res) => res.json(meetings));

app.get('/api/meetings/parceiro', protect('parceiro'), (req, res) =>
  res.json(meetings.filter(m => m.parceiroId === req.session.user.id))
);

/* ======================
   ROTA INVISÍVEL DO CLIENTE
====================== */
app.get('/i/:codigo', (req, res) => {
  const indicador = users.find(u => u.role === 'indicador' && u.codigo === req.params.codigo);
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

app.post('/i/:codigo', (req, res) => {
  const indicador = users.find(u => u.role === 'indicador' && u.codigo === req.params.codigo);
  if (!indicador) return res.send('Link inválido');

  leads.push({
    id: leadId++,
    nome: req.body.nome,
    telefone: req.body.telefone,
    indicadorId: indicador.id,
    parceiroId: null,
    status: 'novo',
    score: 0,
    classificacao: 'frio',
    criadoEm: new Date()
  });

  res.send('Cadastro recebido. Em breve entraremos em contato.');
});

/* ======================
   IA INVISÍVEL + GOOGLE CALENDAR
====================== */
setInterval(async () => {
  for (const lead of leads) {
    if (lead.status === 'novo') {
      // score e classificação
      lead.score = Math.floor(Math.random() * 100);
      if (lead.score >= 70) lead.classificacao = 'quente';
      else if (lead.score >= 40) lead.classificacao = 'morno';
      else lead.classificacao = 'frio';

      if (lead.classificacao === 'frio') {
        lead.status = 'disponivel';
        continue;
      }

      const parceiroId = getNextParceiroId();
      if (!parceiroId) continue;

      // agenda para +2h, duração 30min
      const start = new Date();
      start.setHours(start.getHours() + 2);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 30);

      const event = await calendar.events.insert({
        calendarId: 'primary',
        conferenceDataVersion: 1,
        requestBody: {
          summary: `Reunião INDICONS – ${lead.nome}`,
          description: `Lead automático INDICONS`,
          start: { dateTime: start.toISOString() },
          end: { dateTime: end.toISOString() },
          conferenceData: {
            createRequest: { requestId: crypto.randomUUID() }
          }
        }
      });

      meetings.push({
        id: meetingId++,
        leadId: lead.id,
        parceiroId,
        data: start,
        meetLink: event.data.hangoutLink,
        googleEventId: event.data.id
      });

      lead.parceiroId = parceiroId;
      lead.status = 'agendado';
      lead.triadoEm = new Date();
    }
  }
}, 15000);

/* ======================
   DEBUG – TESTE CALENDAR
====================== */
app.get('/debug/test-calendar', async (req, res) => {
  try {
    const start = new Date();
    start.setHours(start.getHours() + 1);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 30);

    const event = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: {
        summary: 'TESTE INDICONS',
        description: 'Evento de teste automático',
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
        conferenceData: {
          createRequest: { requestId: crypto.randomUUID() }
        }
      }
    });

    res.json({
      ok: true,
      meet: event.data.hangoutLink,
      eventId: event.data.id
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
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
app.listen(PORT, () => console.log('INDICONS rodando com Google Calendar/Meet'));
 
