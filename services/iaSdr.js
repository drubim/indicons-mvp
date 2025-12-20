// services/iaSdr.js
// IA SDR MOCK — classifica leads

async function classificarLead({ nome, whatsapp }) {
  /**
   * REGRA MOCK (simples e segura):
   * - Se WhatsApp começa com 9 → QUENTE
   * - Caso contrário → MORNO
   * (Depois isso vira OpenAI)
   */

  if (!whatsapp) {
    return { classificacao: 'FRIO', motivo: 'Contato incompleto' };
  }

  if (whatsapp.replace(/\D/g, '').length >= 11) {
    return {
      classificacao: 'QUENTE',
      motivo: 'Contato válido e interesse potencial'
    };
  }

  return {
    classificacao: 'MORNO',
    motivo: 'Interesse inicial'
  };
}

module.exports = { classificarLead };
