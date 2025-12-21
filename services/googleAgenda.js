const { google } = require('googleapis');
const { oauth2Client } = require('./googleOAuth');

const calendar = google.calendar({
  version: 'v3',
  auth: oauth2Client
});

async function criarEvento({ nome, inicio }) {
  const evento = {
    summary: `Reunião INDICONS – ${nome}`,
    description: 'Reunião criada automaticamente pela IA INDICONS',
    start: {
      dateTime: inicio.toISOString(),
      timeZone: 'America/Sao_Paulo'
    },
    end: {
      dateTime: new Date(inicio.getTime() + 60 * 60 * 1000).toISOString(),
      timeZone: 'America/Sao_Paulo'
    },
    conferenceData: {
      createRequest: {
        requestId: Math.random().toString(36).substring(2),
        conferenceSolutionKey: { type: 'hangoutsMeet' }
      }
    }
  };

  const res = await calendar.events.insert({
    calendarId: 'primary',
    resource: evento,
    conferenceDataVersion: 1
  });

  return {
    linkMeet: res.data.hangoutLink,
    inicio: res.data.start.dateTime
  };
}

module.exports = { criarEvento };
