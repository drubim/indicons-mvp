const { criarEvento } = require('./googleAgenda');

function gerarHorario() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d;
}

async function classificarEAgendar({ whatsapp, nome }) {
  const numero = whatsapp.replace(/\D/g, '');

  // FRIO
  if (numero.length < 11) {
    return {
      classificacao: 'FRIO',
      status: 'Registrado'
    };
  }

  // QUENTE → agenda real
  const inicio = gerarHorario();
  const evento = await criarEvento({ nome, inicio });

  return {
    classificacao: 'QUENTE',
    status: 'Reunião agendada',
    horarioReuniao: evento.inicio,
    linkReuniao: evento.linkMeet
  };
}

module.exports = { classificarEAgendar };
