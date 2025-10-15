# Projeto — Comparador de Algoritmos de Ordenação (Atualizado)

Este pacote contém o projeto **atualizado por completo**, com:

- Relatório comparativo dentro do site (gráficos e conclusões).
- Botões:
  - **Rodar teste**
  - **Gerar relatório**
  - **Teste completo (melhor/médio/pior)** — roda **5 execuções por ponto** em cada cenário (ordenado, aleatório, inverso) e exibe 3 gráficos + tabela-resumo.
  - **Exportar PDF** — exporta todo o relatório visível (incluindo o bloco de casos).
## Como usar

1. Extraia todos os arquivos em uma mesma pasta.
2. Abra `index.html` no navegador (de preferência Chrome/Edge/Firefox atual).
3. Certifique-se de estar **conectado à internet** (Chart.js, html2canvas e jsPDF são carregados por CDN).
4. Use os botões no topo:
   - **Gerar relatório** → gráficos principais (média de 3 execuções por ponto).
   - **Teste completo (melhor/médio/pior)** → roda 5 execuções por ponto e mostra os 3 gráficos (um por cenário) + tabela.
   - **Exportar PDF** → gera o PDF do relatório.
