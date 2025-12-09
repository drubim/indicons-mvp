// server.js
// INDICONS - Tudo em um arquivo

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const path = require('path');

// -----------------------------------------------------
// 1. CONFIGURAÇÃO BANCO (Postgres)
// -----------------------------------------------------

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ou use:
  // host: process.env.DB_HOST,
  // port: process.env.DB_PORT,
  // user: process.env.DB_USER,
  // password: process.env.DB_PASS,
  // database: process.env.DB_NAME,
});

pool.on('error', (err) => {
  console.error('Erro inesperado no pool de conexões', err);
  process.exit(-1);
});

// -----------------------------------------------------
// 2. SERVIÇO DE WHATSAPP
// -----------------------------------------------------

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;   // ex: https://graph.facebook.com/v20.0
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

async function sendWhatsAppMessage(phone, message) {
  if (!WHATSAPP_API_URL || !WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    console.log('[DEBUG] WhatsApp não configurado. Mensagem não enviada:', phone, message);
    return;
  }

  try {
    await axios.post(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error(
      'Erro ao enviar WhatsApp:',
      error.response?.data || error.message
    );
  }
}

// Mensagens específicas do fluxo
async function notifyCustomerPreAdesao(phone, nome) {
  const msg = `Olá ${nome}, recebemos sua pré-adesão do consórcio. Um especialista entrará em contato em até 60 minutos.`;
  return sendWhatsAppMessage(phone, msg);
}

async function notifyPartnerNewLead(partnerPhone, leadId) {
  const msg = `Nova pré-venda recebida no INDICONS. ID do lead: ${leadId}. Acesse o painel para atender.`;
  return sendWhatsAppMessage(partnerPhone, msg);
}

async function sendFollowUpLead(phone, nome) {
  const msg = `Olá ${nome}, vimos que sua pré-adesão ainda está em aberto. Tem alguma dúvida ou gostaria de seguir com a contratação?`;
  return sendWhatsAppMessage(phone, msg);
}

// -----------------------------------------------------
// 3. SERVIÇO DE IA (STUB)
// -----------------------------------------------------

async function askAI(message, context = []) {
  // Integre aqui com a IA real (OpenAI, etc.)
  return `IA (simulado): você perguntou "${message}". Em produção, use a API de IA.`;
}

// -----------------------------------------------------
// 4. CONFIG EXPRESS
// -----------------------------------------------------

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const JWT_SECRET = process.env.JWT_SECRET || 'secretao-indicons';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://seu-dominio.com';

// -----------------------------------------------------
// 5. ROTAS BÁSICAS DE PÁGINA (LANDING SIMPLES)
// -----------------------------------------------------

app.get('/', (req, res) => {
  // HTML simples com Bootstrap
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <title>INDICONS - Indique consórcios e ganhe comissão</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
        rel="stylesheet"
      />
    </head>
    <body class="bg-light">
      <nav class="navbar navbar-expand-lg navbar-dark bg-primary mb-4">
        <div class="container">
          <a class="navbar-brand" href="#">INDICONS</a>
        </div>
      </nav>

      <div class="container">
        <div class="row mb-4">
          <div class="col-md-8">
            <h1>Indique consórcios e receba 5% de comissão</h1>
            <p>
              Qualquer pessoa física ou jurídica pode indicar clientes para consórcios
              e acompanhar tudo em tempo real.
            </p>
            <p class="text-muted">
              MVP: Indicadores gerando links, clientes fazendo pré-adesão, parceiros finalizando venda,
              comissões calculadas – tudo sem integração direta com administradoras.
            </p>
          </div>
        </div>

        <div class="row">
          <div class="col-md-4">
            <h3>Fluxo simples</h3>
            <p>Indicador gera link, cliente faz pré-adesão, parceiro conclui a venda.</p>
          </div>
          <div class="col-md-4">
            <h3>WhatsApp + IA</h3>
            <p>Mensagens automáticas, follow-up e chat inteligente para tirar dúvidas.</p>
          </div>
          <div class="col-md-4">
            <h3>Painéis completos</h3>
            <p>Dashboard para indicador, parceiro e admin, tudo em um único sistema.</p>
          </div>
        </div>
      </div>

      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    </body>
    </html>
  `);
});

// -----------------------------------------------------
// 6. ROTAS INDICADOR
// -----------------------------------------------------

// Cadastro indicador
app.post('/api/indicator/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO indicators (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id, name, email',
      [name, email, hash]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao cadastrar indicador' });
  }
});

// Login indicador
app.post('/api/indicator/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM indicators WHERE email = $1',
      [email]
    );
    const indicator = result.rows[0];
    if (!indicator) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const ok = await bcrypt.compare(password, indicator.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: indicator.id, role: 'indicator' },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      indicator: { id: indicator.id, name: indicator.name, email: indicator.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no login do indicador' });
  }
});

// Geração de link de indicação
app.post('/api/indicator/links', async (req, res) => {
  const { indicatorId, productId } = req.body;
  const link = `${FRONTEND_URL}/pre-adesao?indicatorId=${indicatorId}&productId=${productId}`;
  res.json({ link });
});

// Dashboard do indicador (pré-vendas + comissões)
app.get('/api/indicator/:indicatorId/dashboard', async (req, res) => {
  const { indicatorId } = req.params;
  try {
    const leads = await pool.query(
      'SELECT * FROM leads WHERE indicator_id = $1 ORDER BY created_at DESC',
      [indicatorId]
    );
    const commissions = await pool.query(
      'SELECT * FROM commissions WHERE indicator_id = $1 ORDER BY created_at DESC',
      [indicatorId]
    );

    res.json({
      leads: leads.rows,
      commissions: commissions.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar dashboard do indicador' });
  }
});

// -----------------------------------------------------
// 7. ROTAS CLIENTE (PRÉ-ADESÃO)
// -----------------------------------------------------

app.post('/api/client/pre-adesao', async (req, res) => {
  const {
    indicatorId,
    productId,
    customerName,
    customerPhone,
  } = req.body;

  try {
    // Cria lead
    const result = await pool.query(
      `INSERT INTO leads (indicator_id, product_id, customer_name, customer_phone, status)
       VALUES ($1,$2,$3,$4,'PRE_ADESAO')
       RETURNING id`,
      [indicatorId, productId, customerName, customerPhone]
    );
    const leadId = result.rows[0].id;

    // WhatsApp para o cliente
    await notifyCustomerPreAdesao(customerPhone, customerName);

    // Encontrar parceiro ativo (lógica simples)
    const partnerResult = await pool.query(
      'SELECT id, name, email FROM partners WHERE active = TRUE ORDER BY id LIMIT 1'
    );
    const partner = partnerResult.rows[0];

    if (partner) {
      // Em produção, usar telefone real do parceiro salvo na tabela
      console.log(
        `[DEBUG] Notificar parceiro ${partner.name} sobre lead ${leadId}`
      );
      // await notifyPartnerNewLead(partner_phone, leadId);
    }

    res.json({ leadId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar pré-adesão' });
  }
});

// -----------------------------------------------------
// 8. ROTAS PARCEIRO
// -----------------------------------------------------

// Cadastro parceiro (pode ser restrito ao admin em produção)
app.post('/api/partner/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO partners (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id, name, email',
      [name, email, hash]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao cadastrar parceiro' });
  }
});

// Login parceiro
app.post('/api/partner/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM partners WHERE email = $1',
      [email]
    );
    const partner = result.rows[0];
    if (!partner) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const ok = await bcrypt.compare(password, partner.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: partner.id, role: 'partner' },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      partner: { id: partner.id, name: partner.name, email: partner.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no login do parceiro' });
  }
});

// Listar pré-vendas para atendimento
app.get('/api/partner/:partnerId/leads', async (req, res) => {
  const { partnerId } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM leads
       WHERE (partner_id = $1 OR partner_id IS NULL)
       AND status IN ('PRE_ADESAO', 'EM_ATENDIMENTO')
       ORDER BY created_at ASC`,
      [partnerId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar pré-vendas' });
  }
});

// Atualizar status do lead (conclusão, boleto, comissão)
app.post('/api/partner/lead/:leadId/status', async (req, res) => {
  const { leadId } = req.params;
  const { status, boletoNumber, boletoPaid, partnerId, commissionValue } = req.body;

  try {
    await pool.query(
      `UPDATE leads
       SET status = $1,
           boleto_number = COALESCE($2, boleto_number),
           boleto_paid = COALESCE($3, boleto_paid),
           partner_id = COALESCE($4, partner_id),
           updated_at = NOW()
       WHERE id = $5`,
      [status, boletoNumber, boletoPaid, partnerId, leadId]
    );

    // Se venda concluída (boleto pago), gera comissão
    if (boletoPaid === true && commissionValue) {
      const leadResult = await pool.query(
        'SELECT indicator_id FROM leads WHERE id = $1',
        [leadId]
      );
      const indicatorId = leadResult.rows[0]?.indicator_id;

      if (indicatorId) {
        await pool.query(
          `INSERT INTO commissions (lead_id, indicator_id, commission_value, status)
           VALUES ($1,$2,$3,'PENDENTE')`,
          [leadId, indicatorId, commissionValue]
        );
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar status do lead' });
  }
});

// -----------------------------------------------------
// 9. ROTAS ADMIN
// -----------------------------------------------------

// Dashboard admin simples
app.get('/api/admin/dashboard', async (req, res) => {
  try {
    const totalIndicators = await pool.query('SELECT COUNT(*) FROM indicators');
    const totalLeads = await pool.query('SELECT COUNT(*) FROM leads');
    const totalCommissions = await pool.query(
      'SELECT COALESCE(SUM(commission_value),0) AS total FROM commissions'
    );

    res.json({
      indicators: Number(totalIndicators.rows[0].count),
      leads: Number(totalLeads.rows[0].count),
      commissionsTotal: Number(totalCommissions.rows[0].total),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar dashboard admin' });
  }
});

// -----------------------------------------------------
// 10. ROTAS CHAT (IA) - SITE E WHATSAPP
// -----------------------------------------------------

// Chat inteligente no site
app.post('/api/chat/site', async (req, res) => {
  const { message, context } = req.body;
  try {
    const answer = await askAI(message, context);
    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao processar chat do site' });
  }
});

// Webhook WhatsApp para IA (estrutura)
app.post('/api/chat/whatsapp-webhook', async (req, res) => {
  console.log('[DEBUG] Webhook WhatsApp IA recebido:', req.body);
  // Aqui você trataria as mensagens recebidas e responderia com sendWhatsAppMessage + askAI
  res.sendStatus(200);
});

// -----------------------------------------------------
// 11. SERVIDOR
// -----------------------------------------------------

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`INDICONS rodando na porta ${PORT}`);
});
