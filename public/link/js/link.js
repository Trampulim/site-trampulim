/* ══════════════════════════════════════════════════════════════
   Grupo Trampulim — link-in-bio
   Lê links.json → renderiza os botões → dispara tracking por clique.

   Para editar os links, mexa APENAS em /link/links.json.
   Este arquivo você não precisa tocar.
   ══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var CFG = window.TRAMPULIM_CONFIG || {};

  /* ---------- 1. Rastreamento: Meta Pixel + GA4 ---------- */

  // Meta Pixel (bootstrap oficial)
  if (CFG.metaPixelId) {
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', CFG.metaPixelId);
    window.fbq('track', 'PageView');
  }

  // Google Analytics 4 (gtag)
  if (CFG.ga4MeasurementId) {
    var g = document.createElement('script');
    g.async = true;
    g.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(CFG.ga4MeasurementId);
    document.head.appendChild(g);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', CFG.ga4MeasurementId);
  }

  function trackClick(link) {
    // Meta Pixel — evento customizado LinkClick
    if (window.fbq) {
      window.fbq('trackCustom', 'LinkClick', {
        link_id: link.id,
        link_title: link.title,
        content_name: link.id
      });
    }
    // GA4 — evento link_click
    if (window.gtag) {
      window.gtag('event', 'link_click', {
        link_id: link.id,
        link_title: link.title
      });
    }
  }

  /* ---------- 2. UTM ---------- */
  // Só aplica em links http/https e quando não foi desativado (utm:false).
  function withUtm(url, link, utmDefault) {
    if (link.utm === false) return url;
    if (!/^https?:\/\//i.test(url)) return url; // wa.me, tel:, mailto: etc.

    var d = utmDefault || {};
    var o = link.utm || {};
    var params = {
      utm_source:   o.source   || d.source,
      utm_medium:   o.medium   || d.medium,
      utm_campaign: o.campaign || d.campaign
    };

    try {
      var u = new URL(url);
      Object.keys(params).forEach(function (k) {
        if (params[k] && !u.searchParams.has(k)) u.searchParams.set(k, params[k]);
      });
      return u.toString();
    } catch (e) {
      return url;
    }
  }

  /* ---------- 3. Ícones (SVG inline, stroke currentColor) ---------- */
  var ICONS = {
    ticket: '<path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1a2 2 0 0 0 0 4v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a2 2 0 0 0 0-4V8Z"/><path d="M15 6v2M15 12v2M15 18v-2"/>',
    whatsapp: '<path d="M20.5 3.5A11 11 0 0 0 3.2 17.2L2 22l4.9-1.3A11 11 0 1 0 20.5 3.5Z"/><path d="M8.5 8c.3-.7.6-.7.9-.7h.7c.2 0 .5 0 .7.5l.9 2c.1.2.1.4 0 .6l-.5.8c-.1.2-.2.4 0 .7.5.9 1.4 1.8 2.4 2.2.3.2.5.1.7-.1l.6-.8c.2-.2.4-.2.6-.1l1.9.9c.3.1.4.3.4.5 0 .8-.5 1.7-1.3 2-1 .3-2.3.3-4.6-1.1-1.9-1.2-3.2-3-3.6-3.9-.4-.9-.6-1.9-.3-2.4Z" fill="currentColor" stroke="none"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"/>',
    linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 10v7M7 7v.01M11 17v-4a2 2 0 0 1 4 0v4M11 10v7"/>',
    youtube: '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10 9.5l5 2.5-5 2.5Z" fill="currentColor" stroke="none"/>',
    facebook: '<path d="M14 8.5V7c0-.8.2-1.5 1.5-1.5H17V2.6C16.6 2.5 15.6 2.4 14.6 2.4c-2.4 0-3.9 1.4-3.9 4v2.1H8v3h2.7V22h3.3v-10.5h2.5l.4-3H14Z" fill="currentColor" stroke="none"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.5 6 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-6-3.5-9s1-6.5 3.5-9Z"/>'
  };
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg>';

  function iconSvg(name) {
    var body = ICONS[name] || ICONS.globe;
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
           'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  }

  /* ---------- 4. Render ---------- */
  function isExternal(url) {
    return /^https?:\/\//i.test(url) &&
           url.indexOf(location.origin) !== 0;
  }

  function render(data) {
    // Perfil
    if (data.profile) {
      if (data.profile.logo) {
        var logo = document.getElementById('logo');
        logo.src = data.profile.logo;
        if (data.profile.name) logo.alt = data.profile.name;
      }
      if (data.profile.tagline) {
        document.getElementById('tagline').textContent = data.profile.tagline;
      }
    }

    var box = document.getElementById('links');
    box.innerHTML = '';
    box.classList.remove('is-loading');

    (data.links || []).forEach(function (link) {
      var a = document.createElement('a');
      a.className = 'link' + (link.featured ? ' featured' : '');
      a.href = withUtm(link.url, link, data.utmDefault);
      a.setAttribute('data-id', link.id);
      a.setAttribute('aria-label', link.title);

      if (isExternal(link.url)) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }

      var badge = link.featured ? '<span class="badge">Em cartaz</span>' : '';
      a.innerHTML =
        badge +
        '<span class="ic">' + iconSvg(link.icon) + '</span>' +
        '<span class="txt">' + escapeHtml(link.title) + '</span>' +
        '<span class="go">' + ARROW + '</span>';

      a.addEventListener('click', function () { trackClick(link); });
      box.appendChild(a);
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }

  /* ---------- 5. Boot ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  var box = document.getElementById('links');
  box.classList.add('is-loading');
  box.innerHTML = '<p class="load-msg">Carregando…</p>';

  fetch('links.json', { cache: 'no-cache' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(render)
    .catch(function (err) {
      console.error('Falha ao carregar links.json:', err);
      box.classList.remove('is-loading');
      box.innerHTML = '<p class="load-msg">Não foi possível carregar os links.</p>';
    });
})();
