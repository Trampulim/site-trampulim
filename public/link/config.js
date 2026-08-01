/* ══════════════════════════════════════════════════════════════
   CONFIG — IDs de rastreamento do link-in-bio do Grupo Trampulim

   ⚠️  IMPORTANTE: estes IDs NÃO são segredos.
   O Meta Pixel ID e o GA4 Measurement ID rodam no navegador de quem
   visita — qualquer pessoa consegue vê-los no código da página. Isso
   é normal e esperado; não há como "esconder" um pixel de uma página
   pública. Mantê-los aqui só centraliza a edição num único lugar.

   Segredos de verdade (senhas, tokens de API, chave da API de
   Conversões do Meta) NUNCA entram neste arquivo — eles só existiriam
   num backend, que esta página não tem.
   ══════════════════════════════════════════════════════════════ */

window.TRAMPULIM_CONFIG = {
  /* Meta Pixel — "Pixel - Grupo Trampulim (Novo)" (mesmo do site) */
  metaPixelId: "866723092730172",

  /* Google Analytics 4 — cole seu Measurement ID (formato G-XXXXXXXXXX).
     Deixe "" (vazio) se ainda não tiver GA4; a página funciona normalmente. */
  ga4MeasurementId: ""
};
