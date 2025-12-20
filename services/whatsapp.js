// services/whatsapp.js
import axios from "axios";

export async function enviarMensagem(numero, mensagem) {
  await axios.post(
    process.env.WHATSAPP_URL,
    {
      phone: numero,
      message: mensagem
    },
    {
      headers: { "Authorization": process.env.WHATSAPP_TOKEN }
    }
  );
}
