# Link-in-bio — Grupo Trampulim

Página única "link na bio" (substitui o Linktree). HTML/CSS/JS puro, sem build,
mesma identidade visual de trampulim.com.br.

**Pasta auto-contida:** tudo que a página precisa está aqui dentro (logo, favicon,
imagem de compartilhamento). Por isso funciona tanto como **subdomínio**
(`link.trampulim.com.br`, recomendado) quanto como subpasta (`trampulim.com.br/link/`),
sem depender de nenhum arquivo de fora.

```
link/
├── index.html      ← página (não precisa mexer)
├── links.json      ← 👈 VOCÊ EDITA SÓ ESTE ARQUIVO
├── config.js       ← IDs do Pixel e do GA4
├── css/link.css    ← estilo (não precisa mexer)
├── js/link.js      ← lógica + tracking (não precisa mexer)
├── .htaccess       ← HTTPS e segurança
├── og.jpg          ← imagem de preview ao compartilhar (já pronta)
├── marca-trampulim-grande.png ← logo (cópia local)
└── favicon.svg / favicon.ico
```

---

## 1. Como editar os links (sem programar)

Abra **`links.json`**. Cada botão é um bloco assim:

```json
{
  "id": "instagram",
  "title": "Instagram",
  "url": "https://instagram.com/grupotrampulim",
  "icon": "instagram"
}
```

- **`title`** — o texto que aparece no botão.
- **`url`** — para onde o botão leva.
- **`icon`** — o desenho à esquerda. Valores disponíveis:
  `ticket`, `whatsapp`, `instagram`, `linkedin`, `youtube`, `facebook`, `globe`.
- **`id`** — nome curto e único (sem espaço/acento). É o que aparece nos relatórios
  de clique do Pixel e do GA4. **Não repita ids.**

**Adicionar** um botão: copie um bloco inteiro (com as `{ }` e a vírgula antes) e cole.
**Remover:** apague o bloco. **Reordenar:** mova o bloco — a ordem no arquivo é a
ordem na tela.

> ⚠️ Cuidado com as **vírgulas**: cada bloco `{ ... }` é separado por vírgula, mas o
> **último** (antes do `]`) **não** leva vírgula. Se a página parar de mostrar os
> links, quase sempre é isso. Cole o conteúdo em <https://jsonlint.com> para conferir.

### Botão em destaque (terracota)
Para deixar **um** botão com a cor de destaque + selo "Em cartaz" (use no link mais
importante do momento, ex.: ingressos), adicione `"featured": true`. Use em **um**
botão só — o destaque só funciona se for exceção.

### Campanha / UTM
Links externos recebem automaticamente `utm_source`, `utm_medium` e `utm_campaign`
(padrão em `utmDefault`, no topo do arquivo). Para personalizar por link:
`"utm": { "campaign": "casamento-palacio-das-artes" }`.
Para **não** colocar UTM em um link (ex.: WhatsApp), use `"utm": false`.

---

## 2. Imagem de compartilhamento (Open Graph)

Já está pronta em **`og.jpg`** (1200×630, logo sobre fundo creme). É ela que aparece
quando alguém cola o link no WhatsApp/Instagram/Facebook. Para trocar depois, basta
substituir o arquivo `og.jpg` mantendo o nome e as proporções ~1200×630.

---

## 3. Configurar Pixel e Google Analytics

Abra **`config.js`**:

```js
window.TRAMPULIM_CONFIG = {
  metaPixelId: "866723092730172",   // Pixel do Trampulim (já preenchido)
  ga4MeasurementId: ""              // 👈 cole aqui o G-XXXXXXXXXX do GA4
};
```

- O **Meta Pixel** já está com o ID do "Pixel - Grupo Trampulim (Novo)". Cada visita
  dispara `PageView`; cada clique dispara o evento **`LinkClick`** (com `link_id` e
  `link_title`) — dá pra criar público de remarketing por link.
- O **GA4**: pegue o *Measurement ID* em GA4 → Administrador → Fluxos de dados
  (formato `G-XXXXXXXXXX`) e cole. Cada clique vira o evento **`link_click`**.
  Deixe `""` se ainda não tiver — a página funciona sem.

> Esses IDs **não são segredo**: todo pixel roda no navegador do visitante e é
> visível por natureza. Não há nada a "esconder" numa página pública. Segredos de
> verdade (senhas, token da API de Conversões) só existiriam num servidor/backend,
> que esta página não tem — de propósito, pra reduzir a superfície de ataque.

---

## 4. Publicar como subdomínio `link.trampulim.com.br` (recomendado)

O Plano M do HostGator inclui **subdomínios ilimitados sem custo extra**.

1. **cPanel → Domínios → Subdomínios** (ou "Criar um novo domínio").
2. Subdomínio: `link` · Domínio: `trampulim.com.br`.
3. **Document Root** (Raiz do documento): aponte para **`public_html/link`**.
4. Salvar. O HostGator já cria o registro DNS do subdomínio automaticamente
   (mesmo servidor) — não precisa mexer em DNS externo.
5. **Gerenciador de Arquivos** → suba os arquivos desta pasta para `public_html/link/`
   (incluindo o **`.htaccess`** — ative "Mostrar arquivos ocultos (dotfiles)").
6. **SSL:** em **cPanel → SSL/TLS Status**, confirme que `link.trampulim.com.br` tem
   certificado (AutoSSL). Pode levar de minutos a algumas horas após criar o
   subdomínio. **Só acesse via HTTPS depois que o SSL estiver ativo** — o `.htaccess`
   força HTTPS, então sem certificado o navegador mostra aviso de segurança.
7. Acesse **`https://link.trampulim.com.br`**.

Para trocar um link depois, basta reenviar o **`links.json`** editado — nada mais.

### Alternativa: subpasta `trampulim.com.br/link/`
Se preferir não criar subdomínio, suba a mesma pasta para `public_html/link/` e acesse
`https://trampulim.com.br/link/`. Como os caminhos são relativos, funciona igual — só
troque, no `index.html`, as 4 linhas de `link.trampulim.com.br` (canonical, og:url,
og:image, twitter:image) por `trampulim.com.br/link/`.

---

## 5. Checklist de segurança (aplicado)

- [x] **HTTPS forçado** — redirect 301 http→https no `.htaccess`.
- [x] **HSTS** — `Strict-Transport-Security` (2 anos, includeSubDomains).
- [x] **CSP** — `Content-Security-Policy` liberando só os hosts realmente usados
      (Google Fonts, Meta Pixel, GA4); bloqueia o resto.
- [x] **X-Frame-Options: DENY** + `frame-ancestors 'none'` — impede clickjacking.
- [x] **X-Content-Type-Options: nosniff**.
- [x] **Referrer-Policy: strict-origin-when-cross-origin**.
- [x] **Permissions-Policy** — desliga câmera, microfone, geolocalização e FLoC.
- [x] **Sem inputs/formulários** nesta v1 → superfície de ataque mínima.
- [x] **Sem segredos no código** — só IDs públicos de pixel/analytics.
- [x] **Zero dependências de terceiros** (nenhuma lib/framework) além de Pixel/GA.
- [x] `escapeHtml` no render → conteúdo do `links.json` não injeta HTML.

> Depois de publicar, confira as notas em <https://securityheaders.com> e o CSP no
> console do navegador (não pode haver "Refused to load…" em vermelho).
