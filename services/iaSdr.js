// services/iaSdr.js

async function classificarLead({ nome, whatsapp }) {
  /**
   * REGRA MOCK (SEGURA):
   * - Sempre retorna QUENTE por enquanto
   * - Depois entra OpenAI / WhatsApp / perguntas
   */

  return {
    classificacao: 'QUENTE', // FRIO | MORNO | QUENTE
    resumo: 'Objetivo claro e abertura para conversa'
  };
}

module.exports = { classificarLead };
