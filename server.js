// ===============================
// INDICONS - SERVER FINAL
// Google Calendar + Meet
// Auth ÚNICA via Service Account
// ===============================

const express = require('express');
const session = require('express-session');
const path = require('path');
const crypto = require('crypto');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 10000;

// ===============================
// MIDDLEWARES
// ===============================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: 'indicons-secret',
    resave: false,
    saveUninitialized: true
  })
);

// ===============================
// AUTH GOOGLE (ÚNICO E DEFINITIVO)
// ===============================
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'calendar.json'),
  scopes: ['https://www.googleapis.com/auth/calendar']
});

const calendar = google.calendar({
  version: 'v3',
  auth
});

// 🔎 Validação explícita da Service Account (LOG OBRIGATÓRIO)
auth.getClient()
  .then(() => {
    console.log('✅ Service Account autenticada com sucesso');
    console.log('INDICONS - servidor final com Google Calendar + Meet (OK)');
  })
  .catch(err => {
    console.error('❌ Falha ao autenticar Service Account:', err.message);
  });

// ===============================
// DADOS EM MEMÓRIA (MVP)
// ===============================
let indicadores = [];
let leads = [];
let parceiros = [
  { id: 1, nome: 'Parceiro 1' }
];

// ===============================
// LOGIN SIMPLES (ADMIN / PARCEIRO)
// ===============================
app.post('/login', (req, res) => {
  const { email } = req.body;

  if (email === 'admin@indicons.com.br') {
    req.session.user = { role: 'admin' };
    return res.json({ ok: true, role: 'admin' });
  }

  if (email === 'parceiro@indicons.com.br') {
    req.session.user = { role: 'parceiro', parceiroId: 1 };
    return res.json({ ok: true, role: 'parceiro' });
  }

  return res.status(401).json({ error: 'Login inválido' });
});

// ===============================
// CADASTRO INDICADOR
// ===============================
app.post('/cadastro-indicador', (req, res) => {
  const id = indicadores.length + 1;
  const codigo = crypto.randomBytes(4).toString('hex');

  indicadores.push({
    id,
    email: req.body.email,
    codigo
  });

  req.session.user = { role: 'indicador', indicadorId: id };

  res.json({
    ok: true,
    link: `https://app.indicons.com.br/i/${codigo}`
  });
});

// ===============================
// CADASTRO LEAD VIA LINK INDICADOR
// ===============================
app.post('/i/:codigo', async (req, res) => {
  try {
    const indicador = indicadores.find(i => i.codigo === req.params.codigo);
    if (!indicador) return res.status(404).send('Indicador inválido');

    const score = Math.floor(Math.random() * 100);
    const quente = score >= 70;

    const lead = {
      id: leads.length + 1,
      nome: req.body.nome,
      telefone: req.body.telefone,
      indicadorId: indicador.id,
      score,
      classificacao: quente ? 'quente' : 'frio',
      status: quente ? 'Aguardando agendamento' : 'Recebido',
      parceiroId: null,
      meetLink: null,
      data: new Date()
    };

    // ===============================
    // AGENDAMENTO AUTOMÁTICO (SE QUENTE)
    // ===============================
    if (quente) {
      const start = new Date(Date.now() + 60 * 60 * 1000);
      const end = new Date(start.getTime() + 30 * 60 * 1000);

      try {
        const event = await calendar.events.insert({
          calendarId: 'indicons.agenda@gmail.com',
          conferenceDataVersion: 1,
          requestBody: {
            summary: `Reunião INDICONS – ${lead.nome}`,
            start: { dateTime: start.toISOString() },
            end: { dateTime: end.toISOString() },
            attendees: [
              { email: 'indicons.agenda@gmail.com' }
            ],
            conferenceData: {
              createRequest: {
                requestId: crypto.randomUUID(),
                conferenceSolutionKey: { type: 'hangoutsMeet' }
              }
            }
          }
        });

        lead.meetLink = event.data.hangoutLink;
        lead.status = 'Reunião agendada';
        lead.parceiroId = 1;

        console.log('✅ Evento criado com sucesso');
        console.log('Meet link:', lead.meetLink);

      } catch (err) {
        console.error('❌ Erro ao agendar:', err.message);
      }
    }

    leads.push(lead);
    res.json({ ok: true });

  } catch (err) {
    console.error(err);
    res.status(500).send('Erro interno');
  }
});

// ===============================
// APIs PAINÉIS
// ===============================
app.get('/api/admin/leads', (req, res) => {
  res.json(leads);
});

app.get('/api/indicador/leads', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'indicador') {
    return res.status(401).json([]);
  }
  res.json(leads.filter(l => l.indicadorId === req.session.user.indicadorId));
});

app.get('/api/parceiro/leads', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'parceiro') {
    return res.status(401).json([]);
  }
  res.json(leads.filter(l => l.parceiroId === req.session.user.parceiroId));
});

// ===============================
// START SERVER
// ===============================
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
