let criarEvento = null;

// Tentamos carregar o Google Agenda, mas NÃO quebramos se falhar
try {
  const agenda = require('./googleAgenda');
  criarEvento = agenda.criarEvento;
} catch (e) {
  console.warn('⚠️ Google Agenda ainda não disponível');
}

function gerarHorario() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d;
}

async function classificarEAgendar({ whatsapp, nome }) {
  const numero = (whatsapp || '').replace(/\D/g, '');

  // FRIO
  if (numero.length < 11) {
    return {
      classificacao: 'FRIO',
      status: 'Registrado'
    };
  }

  // QUENTE — tenta agendar, mas não quebra se não conseguir
  let horario = gerarHorario();
  let link = null;

  if (criarEvento) {
    try {
      const evento = await criarEvento({ nome, inicio: horario });
      horario = evento.inicio;
      link = evento.linkMeet;
    } catch (e) {
      console.error('Erro ao criar evento Google:', e.message);
    }
  }

  return {
    classificacao: 'QUENTE',
    status: 'Reunião agendada',
    horarioReuniao: horario,
    linkReuniao: link
  };
}

module.exports = { classificarEAgendar };
