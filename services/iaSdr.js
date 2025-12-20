// services/iaSdr.js
import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function qualificarLead(contexto) {
  const prompt = `
Você é um SDR virtual da INDICONS.
Classifique o lead como QUENTE, MORNO ou FRIO e gere um resumo curto.

Dados:
${JSON.stringify(contexto)}

Responda em JSON:
{ "classificacao": "...", "resumo": "..." }
`;

  const r = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }]
  });

  return JSON.parse(r.choices[0].message.content);
}
