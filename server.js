const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

/* ========================
   BASE EM MEMÓRIA (MVP)
======================== */
const indicadores = [
  { codigo: 'PJ55AY', nome: 'Indicador Teste' }
];

const leads = [];

/* ========================
   ROTAS INDICADOR
======================== */
app.get('/indicador/:codigo', (req, res) => {
  const indicador = indicadores.find(i => i.codigo === req.params.codigo);

  if (!indicador) {
    return res.json({
      nome: 'Indicador',
      codigo: req.params.codigo,
      indicacoes: []
    });
  }

  const indicacoes = leads.filter(
    l => l.indicadorCodigo === indicador.codigo
  );

  res.json({
    nome: indicador.nome || 'Indicador',
    codigo: indicador.codigo,
    indicacoes
  });
});

/* ========================
   CADASTRO DE LEAD
======================== */
app.post('/lead', (req, res) => {
  const { nome, indicadorCodigo } = req.body;

  const indicador = indicadores.find(i => i.codigo === indicadorCodigo);

  const novoLead = {
    id: Date.now(),
    nome,
    indicadorCodigo,
    indicadorNome: indicador ? indicador.nome : 'Indicador',
    status: 'Registrado',
    valorVenda: null,
    percentualComissao: 0.01,
    valorComissao: null
  };

  leads.push(novoLead);
  res.json({ ok: true });
});

/* ========================
   PARCEIRO / ADMIN
======================== */
app.get('/parceiro/leads', (req, res) => res.json(leads));
app.get('/admin/leads', (req, res) => res.json(leads));

/* ========================
   MARCAR COMO VENDIDO
======================== */
app.post('/lead/vendido', (req, res) => {
  const { id, valorVenda } = req.body;

  const lead = leads.find(l => l.id === id);
  if (!lead) return res.status(404).json({ erro: 'Lead não encontrado' });

  lead.status = 'Vendido';
  lead.valorVenda = Number(valorVenda);
  lead.valorComissao = lead.valorVenda * lead.percentualComissao;

  res.json({ ok: true });
});

app.listen(PORT, () =>
  console.log('Servidor rodando na porta', PORT)
);
