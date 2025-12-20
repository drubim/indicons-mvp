const { google } = require('googleapis');

const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/calendar']
);

const calendar = google.calendar({ version: 'v3', auth });

async function criarEvento({ nome, whatsapp, inicio, calendarId }) {
  const evento = {
    summary: `Lead INDICONS – ${nome}`,
    description: `Contato: ${whatsapp}`,
    start: {
      dateTime: inicio,
      timeZone: 'America/Sao_Paulo'
    },
    end: {
      dateTime: new Date(
        new Date(inicio).getTime() + 30 * 60000
      ).toISOString(),
      timeZone: 'America/Sao_Paulo'
    },
    conferenceData: {
      createRequest: {
        requestId: `indicons-${Date.now()}`
      }
    }
  };

  const res = await calendar.events.insert({
    calendarId,
    resource: evento,
    conferenceDataVersion: 1
  });

  return res.data;
}

async function agendarComDuplicacao({ nome, whatsapp, inicio, parceiroCalendarId }) {
  // 1️⃣ Agenda mestre (INDICONS)
  const eventoPrincipal = await criarEvento({
    nome,
    whatsapp,
    inicio,
    calendarId: process.env.GOOGLE_CALENDAR_ID
  });

  // 2️⃣ Duplica na agenda do parceiro
  if (parceiroCalendarId) {
    await calendar.events.insert({
      calendarId: parceiroCalendarId,
      resource: {
        ...eventoPrincipal,
        conferenceData: eventoPrincipal.conferenceData
      },
      conferenceDataVersion: 1
    });
  }

  return {
    inicio: eventoPrincipal.start.dateTime,
    meetLink: eventoPrincipal.conferenceData.entryPoints[0].uri
  };
}

module.exports = { agendarComDuplicacao };
