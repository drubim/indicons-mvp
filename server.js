const express = require('express');
const path = require('path');
const session = require('express-session');
const crypto = require('crypto');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

/* ======================
   MIDDLEWARE
====================== */
app.set('trust proxy', 1);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  name: 'indicons.sid',
  secret: 'indicons-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true, sameSite: 'lax' }
}));

app.use(express.static(path.join(__dirname, 'public')));

/* ======================
   GOOGLE CALENDAR
====================== */
const auth = new google.auth.GoogleAuth({
  keyFile: 'calendar.json',
  scopes: ['https://www.googleapis.com/auth/calendar']
});
const calendar = google.calendar({ version: 'v3', auth });
const CALENDAR_ID = 'SEU_CALENDARIO@gmail.com';

/* ======================
   EMAIL (TESTE)
====================== */
const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'SEU_EMAIL@gmail.com',
    pass: 'SENHA_DE_APP'
  }
});

/* ======================
   CONFIG
====================== */
const RETRY_INTERVAL = 30 * 1000;

/* ======================
   USERS
====================== */
const users = [
  { id: 1, email: 'admin@indicons.com.br', senha: 'admin123', role: 'admin' },
  { id: 2, email: 'parceiro@indicons.com.br', senha: 'parceiro123', role: 'parceiro' }
];
let indicadorId = 100;

/* ======================
   LEADS + FILA
====================== */
let leads = [];
let retryQueue = [];
let leadId = 1;

/* ======================
   FUNÇÃO: AGENDAR + NOTIFICAR
====================== */
async function agendarEEnviar(lead) {
  try {
    const start = new Date();
    start.setHours(start.getHours() + 2);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 30);

    const event = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      conferenceDataVersion: 1,
      requestBody: {
        summary: `Reunião INDICONS – ${lead.nome}`,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
        conferenceData: {
          createRequest: { requestId: crypto.randomUUID() }
        }
      }
    });

    lead.reuniaoAgendada = true;
    lead.status = 'Reunião agendada';
    lead.meetLink = event.data.hangoutLink;
    lead.dataReuniao = start;

    const parceiro = users.find(u => u.id === lead.parceiroId);

    // EMAIL PARA PARCEIRO
    await mailer.sendMail({
      from: 'INDICONS <SEU_EMAIL@gmail.com>',
      to: parceiro.email,
      subject: 'Novo lead com reunião agendada',
      html: `
        <p><strong>Cliente:</strong> ${lead.nome}</p>
        <p><strong>Data:</strong> ${start.toLocaleString()}</p>
        <p><a href="${lead.meetLink}">Entrar na reunião</a></p>
      `
    });

    // EMAIL PARA CLIENTE
    await mailer.sendMail({
      from: 'INDICONS <SEU_EMAIL@gmail.com>',
      to: 'cliente@teste.com', /* depois usar email real */
      subject: 'Sua reunião foi agendada',
      html: `
        <p>Sua reunião foi confirmada.</p>
        <p><strong>Data:</strong> ${start.toLocaleString()}</p>
        <p><a href="${lead.meetLink}">Acessar reunião</a></p>
      `
    });

    console.log(`📧 Notificações enviadas para lead ${lead.id}`);
    return true;

  } catch (err) {
    console.error('❌ Erro agenda/notificação:', err.message);
    return false;
  }
}

/* ======================
   FILA DE RETRY
====================== */
setInterval(async () => {
  if (retryQueue.length === 0) return;

  for (let i = retryQueue.length - 1; i >= 0; i--) {
    const item = retryQueue[i];
    const lead = leads.find(l => l.id === item.leadId);
    if (!lead) {
      retryQueue.splice(i, 1);
      continue;
    }

    const ok = await agendarEEnviar(lead);
    if (ok) retryQueue.splice(i, 1);
  }
}, RETRY_INTERVAL);

/* ======================
   ROTAS ESSENCIAIS
====================== */
app.post('/i/:codigo', (req, res) => {
  const ind = users.find(u => u.codigo === req.params.codigo);
  if (!ind) return res.send('Link inválido');

  const score = Math.floor(Math.random() * 100);
  let classificacao = 'frio';
  let status = 'Recebido';
  let parceiroId = null;

  if (score >= 70) {
    classificacao = 'quente';
    status = 'Aguardando agendamento';
    parceiroId = users.find(u => u.role === 'parceiro')?.id;
  }

  const lead = {
    id: leadId++,
    nome: req.body.nome,
    telefone: req.body.telefone,
    indicadorId: ind.id,
    parceiroId,
    classificacao,
    status,
    reuniaoAgendada: false,
    criadoEm: new Date()
  };

  leads.push(lead);
  if (classificacao === 'quente') retryQueue.push({ leadId: lead.id });

  res.send('Cadastro realizado com sucesso.');
});

/* ======================
   START
====================== */
app.listen(PORT, () => {
  console.log('INDICONS – NOTIFICAÇÃO ATIVA');
});
