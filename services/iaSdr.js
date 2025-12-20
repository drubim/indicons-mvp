// services/iaSdr.js
async function qualificarLead(contexto) {
  // MOCK seguro – não quebra deploy
  return {
    classificacao: "QUENTE",
    resumo: "Interesse confirmado em consórcio"
  };
}

module.exports = { qualificarLead };
