// services/iaSdr.js

function gerarHorarioReuniao() {
  const data = new Date();
  data.setDate(data.getDate() + 1); // amanhã
  data.setHours(10, 0, 0, 0);       // 10:00
  return data;
}

async function classificarEAgendar({ whatsapp }) {
  const numero = whatsapp.replace(/\D/g, '');

  // FRIO
  if (numero.length < 11) {
    return {
      classificacao: 'FRIO',
      status: 'Registrado'
    };
  }

  // QUENTE
  return {
    classificacao: 'QUENTE',
    status: 'Reunião agendada',
    horarioReuniao: gerarHorarioReuniao(),
    linkReuniao: 'https://meet.google.com/abc-defg-hij' // mock
  };
}

module.exports = { classificarEAgendar };
