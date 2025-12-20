/* ===============================
   PAINEL DO PARCEIRO
================================ */

/* Buscar leads em atendimento (qualificados + agendados) */
app.get('/parceiro/leads', (req, res) => {
  const leadsEmAtendimento = indicacoes.filter(
    l => l.status === 'Em atendimento'
  );

  res.json(leadsEmAtendimento);
});

/* Atualizar status do lead */
app.post('/parceiro/status', (req, res) => {
  const { id, status } = req.body;

  const lead = indicacoes.find(l => l.id === id);
  if (!lead) {
    return res.status(404).json({ error: 'Lead não encontrado' });
  }

  lead.status = status;

  // Se virou venda, contabiliza para o indicador
  if (status === 'Venda concluída') {
    const indicador = indicadores.find(
      i => i.codigo === lead.indicadorCodigo
    );

    if (indicador) {
      indicador.vendas += 1;

      // Atualiza nível automaticamente
      if (indicador.vendas >= 3) indicador.nivel = 'Premium';
      else if (indicador.vendas >= 1) indicador.nivel = 'Destaque';
      else indicador.nivel = 'Ativo';
    }
  }

  res.json({ success: true });
});
