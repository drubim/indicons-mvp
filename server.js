app.get("/indicador/links", requireIndicador, async (req, res) => {
  const produtos = await dbAll("SELECT * FROM produtos");
  const base = process.env.BASE_URL || "https://indicons.onrender.com";

  const content = `
    <div class="card">
      <h2>Produtos de consórcio para indicação</h2>
      <p class="muted">
        Use a tabela abaixo para gerar e copiar os links de indicação. Cada linha representa um plano/valor
        da administradora. Clique em <strong>Copiar link</strong> ao lado do plano que deseja enviar.
      </p>
    </div>

    <div class="card">
      ${
        produtos.length === 0
          ? `<p class="muted">Nenhum produto cadastrado. Cadastre os planos na tabela <code>produtos</code>.</p>`
          : `
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Cód.</th>
              <th>Produto / Plano</th>
              <th>Crédito / Detalhes</th>
              <th>Link de indicação</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${produtos
              .map((p) => {
                const link = `${base}/consorcio?i=${req.session.indicadorId}&p=${p.id}`;
                return `
                  <tr>
                    <td>${p.codigo || "-"}</td>
                    <td>${p.nome}</td>
                    <td>${p.credito_referencia || p.descricao || "-"}</td>
                    <td style="max-width:260px; font-size:11px; word-break:break-all;">
                      <code>${link}</code>
                    </td>
                    <td style="white-space:nowrap;">
                      <button type="button" class="btn btn-secondary" onclick="copyLink('${link.replace(/'/g, "\\'")}')">
                        Copiar link
                      </button>
                    </td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>`
      }
    </div>

    <script>
      function copyLink(text) {
        if (!navigator.clipboard) {
          // fallback simples
          const tempInput = document.createElement('input');
          tempInput.value = text;
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          document.body.removeChild(tempInput);
          alert('Link copiado.');
          return;
        }

        navigator.clipboard.writeText(text)
          .then(function() {
            const msg = document.createElement('div');
            msg.textContent = 'Link copiado!';
            msg.style.position = 'fixed';
            msg.style.bottom = '16px';
            msg.style.right = '16px';
            msg.style.background = '#0ea5e9';
            msg.style.color = 'white';
            msg.style.padding = '8px 14px';
            msg.style.borderRadius = '999px';
            msg.style.fontSize = '13px';
            msg.style.boxShadow = '0 4px 12px rgba(15,23,42,0.25)';
            document.body.appendChild(msg);
            setTimeout(function(){ document.body.removeChild(msg); }, 1800);
          })
          .catch(function() {
            alert('Não foi possível copiar o link. Copie manualmente.');
          });
      }
    </script>
  `;

  res.send(
    layout(
      "Links Indicador",
      content,
      `Indicador: ${req.session.indicadorNome} | <a href="/logout">Sair</a>`
    )
  );
});
