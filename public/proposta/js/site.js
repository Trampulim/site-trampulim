/* ════════════════════════════════════════════════════════════
   GRUPO TRAMPULIM — site.js (multilíngue PT / EN / ES)
   Injeta NAV + DRAWER + FOOTER + WhatsApp + seletor de idioma.
   Idioma detectado pela URL: /proposta/ (pt), /proposta/en/, /proposta/es/
   ════════════════════════════════════════════════════════════ */
(function () {
  var WA = 'https://wa.me/5531986891687';
  var path = location.pathname;
  var lang = 'pt';
  if (path.indexOf('/proposta/en/') === 0) lang = 'en';
  else if (path.indexOf('/proposta/es/') === 0) lang = 'es';
  var BASE = lang === 'pt' ? '/proposta/' : '/proposta/' + lang + '/';
  document.documentElement.lang = (lang === 'pt') ? 'pt-BR' : lang;

  // caminho relativo da página atual (para o seletor de idioma)
  var rel = path.replace(/^\/proposta\/(en\/|es\/)?/, '');
  if (!rel || rel === '') rel = 'index.html';

  var page = document.body.getAttribute('data-page') || '';

  /* ---- Dicionário de rótulos (nav / footer / chrome) ---- */
  var T = {
    pt: {
      grupo:'O Grupo', historico:'Histórico', ficha:'Ficha Técnica', premios:'Prêmios', cronologia:'Cronologia',
      repertorio:'Repertório', espetaculos:'Espetáculos', intervencoes:'Intervenções e Números',
      empresas:'Nas Empresas', pratubate:'Pratubatê', trampuli:'Trampulimprovisa', performances:'Performances Personalizadas',
      oficinas:'Oficinas', deposito:'Depósito de Bobagens', contato:'Contato',
      fGrupo:'O Grupo', fRep:'Repertório', fExtra:'Extra',
      fTag:'Circo, teatro e palhaçaria desde 1994.<br/>Belo Horizonte – MG, Brasil.',
      fRights:'© 2026 Grupo Trampulim de Circo e Teatro. Todos os direitos reservados.',
      langLabel:'Idioma'
    },
    es: {
      grupo:'El Grupo', historico:'Historia', ficha:'Ficha Técnica', premios:'Premios', cronologia:'Cronología',
      repertorio:'Repertorio', espetaculos:'Espectáculos', intervencoes:'Intervenciones y Números',
      empresas:'En las Empresas', pratubate:'Pratubatê', trampuli:'Trampulimprovisa', performances:'Performances Personalizadas',
      oficinas:'Talleres', deposito:'Depósito de Bobadas', contato:'Contacto',
      fGrupo:'El Grupo', fRep:'Repertorio', fExtra:'Extra',
      fTag:'Circo, teatro y payasería desde 1994.<br/>Belo Horizonte – MG, Brasil.',
      fRights:'© 2026 Grupo Trampulim de Circo y Teatro. Todos los derechos reservados.',
      langLabel:'Idioma'
    },
    en: {
      grupo:'The Group', historico:'History', ficha:'Technical Sheet', premios:'Awards', cronologia:'Timeline',
      repertorio:'Repertoire', espetaculos:'Shows', intervencoes:'Interventions & Acts',
      empresas:'For Companies', pratubate:'Pratubatê', trampuli:'Trampulimprovisa', performances:'Custom Performances',
      oficinas:'Workshops', deposito:'Oddities Cabinet', contato:'Contact',
      fGrupo:'The Group', fRep:'Repertoire', fExtra:'Extra',
      fTag:'Circus, theatre and clowning since 1994.<br/>Belo Horizonte – MG, Brazil.',
      fRights:'© 2026 Grupo Trampulim Circus & Theatre. All rights reserved.',
      langLabel:'Language'
    }
  };
  var t = T[lang];

  var NAV = [
    { id:'grupo', label:t.grupo, href:BASE+'historico.html', children:[
      { label:t.historico, href:BASE+'historico.html' },
      { label:t.ficha, href:BASE+'ficha-tecnica.html' },
      { label:t.premios, href:BASE+'premios.html' },
      { label:t.cronologia, href:BASE+'cronologia.html' },
    ]},
    { id:'repertorio', label:t.repertorio, href:BASE+'espetaculos.html', children:[
      { label:t.espetaculos, href:BASE+'espetaculos.html' },
      { label:t.intervencoes, href:BASE+'intervencoes.html' },
    ]},
    { id:'empresas', label:t.empresas, href:BASE+'nas-empresas.html', children:[
      { label:t.pratubate, href:BASE+'nas-empresas.html' },
      { label:t.trampuli, href:BASE+'nas-empresas.html#servicos' },
      { label:t.performances, href:BASE+'nas-empresas.html#servicos' },
    ]},
    { id:'oficinas', label:t.oficinas, href:BASE+'oficinas.html' },
    { id:'extra', label:t.deposito, href:BASE+'deposito.html' },
  ];

  var chevron = '<svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';

  var navItems = NAV.map(function (item) {
    var active = item.id === page ? ' active' : '';
    if (item.children) {
      var dd = item.children.map(function (c) {
        return '<a href="' + c.href + '">' + c.label + (c.sub ? '<small>' + c.sub + '</small>' : '') + '</a>';
      }).join('');
      return '<li class="nav-item' + active + '"><a href="' + item.href + '" tabindex="0">' + item.label + chevron + '</a><div class="nav-dropdown">' + dd + '</div></li>';
    }
    return '<li class="nav-item' + active + '"><a href="' + item.href + '">' + item.label + '</a></li>';
  }).join('');

  /* ---- Redes sociais (fonte única: nav + footer) ---- */
  var SOCIALS = [
    ['Instagram','https://www.instagram.com/trampulim','M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z'],
    ['Facebook','https://www.facebook.com/GrupoTrampulim','M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'],
    ['YouTube','https://www.youtube.com/GrupoTrampulim','M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z'],
    ['LinkedIn','https://www.linkedin.com/company/grupo-trampulim/','M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z']
  ];
  function socialLink(s, cls, size) {
    return '<a href="' + s[1] + '" class="' + cls + '" target="_blank" rel="noopener" aria-label="' + s[0] + '">' +
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="currentColor"><path d="' + s[2] + '"/></svg></a>';
  }

  /* ---- Seletor de idioma (lado a lado) ---- */
  var langs = [['pt','PT','/proposta/'],['en','EN','/proposta/en/'],['es','ES','/proposta/es/']];
  var langDesktop = '<li class="nav-item lang-inline">' +
    langs.map(function (l) {
      return '<a href="' + l[2] + rel + '"' + (l[0]===lang?' class="cur"':'') + '>' + l[1] + '</a>';
    }).join('<span class="lang-sep">·</span>') + '</li>';

  /* ---- Redes sociais no topo (desktop) ---- */
  var navSocials = '<li class="nav-item nav-socials">' +
    SOCIALS.map(function (s) { return socialLink(s, 'nav-social', 15); }).join('') + '</li>';

  var navHTML =
    '<nav id="nav"><div class="container"><div class="nav-inner">' +
      '<a href="' + BASE + 'index.html" class="nav-logo"><img src="/marca-trampulim-grande.png" alt="Grupo Trampulim" /></a>' +
      '<ul class="nav-menu">' + navItems + langDesktop + navSocials + '</ul>' +
      '<a href="' + BASE + 'contato.html" class="nav-cta-btn">' + t.contato + '</a>' +
      '<button class="nav-hamburger" id="hamburger" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>' +
    '</div></div></nav>';

  /* ---- Drawer mobile ---- */
  var drawerInner = NAV.map(function (item) {
    var head = '<a href="' + item.href + '" class="drawer-link">' + item.label + '</a>';
    var subs = '';
    if (item.children) {
      subs = '<div class="drawer-subs">' + item.children.map(function (c) {
        return '<a href="' + c.href + '" class="drawer-sub-link">' + c.label + '</a>';
      }).join('') + '</div>';
    }
    return '<div class="drawer-group">' + head + subs + '</div>';
  }).join('');
  var drawerLang = '<div class="drawer-group drawer-lang"><span class="drawer-section-title">' + t.langLabel + '</span><div class="drawer-langs">' +
    langs.map(function (l) { return '<a href="' + l[2] + rel + '" class="drawer-lang-link' + (l[0]===lang?' cur':'') + '">' + l[1] + '</a>'; }).join('') + '</div></div>';
  var drawerSocials = '<div class="drawer-socials">' +
    SOCIALS.map(function (s) { return socialLink(s, 'drawer-social', 18); }).join('') + '</div>';
  var drawerHTML = '<div id="nav-drawer">' + drawerInner + drawerLang + '<a href="' + BASE + 'contato.html" class="drawer-cta">' + t.contato + '</a>' + drawerSocials + '</div>';

  /* ---- Footer ---- */
  var footerHTML =
    '<footer><div class="container">' +
      '<div class="footer-top">' +
        '<div class="footer-brand">' +
          '<div class="footer-logo"><img src="/marca-trampulim-grande.png" alt="Grupo Trampulim" /></div>' +
          '<p>' + t.fTag + '</p>' +
          '<div class="f-socials">' +
            SOCIALS.map(function (s) { return socialLink(s, 'f-social', 16); }).join('') +
          '</div>' +
        '</div>' +
        '<div class="footer-col"><h4>' + t.fGrupo + '</h4><ul>' +
          '<li><a href="' + BASE + 'historico.html">' + t.historico + '</a></li>' +
          '<li><a href="' + BASE + 'ficha-tecnica.html">' + t.ficha + '</a></li>' +
          '<li><a href="' + BASE + 'premios.html">' + t.premios + '</a></li>' +
          '<li><a href="' + BASE + 'cronologia.html">' + t.cronologia + '</a></li>' +
        '</ul></div>' +
        '<div class="footer-col"><h4>' + t.fRep + '</h4><ul>' +
          '<li><a href="' + BASE + 'espetaculos.html">' + t.espetaculos + '</a></li>' +
          '<li><a href="' + BASE + 'intervencoes.html">' + t.intervencoes + '</a></li>' +
          '<li><a href="' + BASE + 'nas-empresas.html">' + t.empresas + '</a></li>' +
          '<li><a href="' + BASE + 'oficinas.html">' + t.oficinas + '</a></li>' +
        '</ul></div>' +
        '<div class="footer-col"><h4>' + t.fExtra + '</h4><ul>' +
          '<li><a href="' + BASE + 'deposito.html">' + t.deposito + '</a></li>' +
          '<li><a href="' + BASE + 'contato.html">' + t.contato + '</a></li>' +
        '</ul></div>' +
      '</div>' +
      '<div class="footer-bottom">' +
        '<span>' + t.fRights + '</span>' +
        '<span>contato@trampulim.com.br</span>' +
      '</div>' +
    '</div></footer>';

  var waHTML =
    '<a href="' + WA + '" class="wa-btn" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">' +
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>' +
    '</a>';

  document.body.insertAdjacentHTML('afterbegin', navHTML + drawerHTML);
  document.body.insertAdjacentHTML('beforeend', footerHTML + waHTML);

  /* ---- Comportamentos ---- */
  var nav = document.getElementById('nav');
  window.addEventListener('scroll', function () { nav.classList.toggle('scrolled', window.scrollY > 20); }, { passive: true });

  var hamburger = document.getElementById('hamburger');
  var drawer = document.getElementById('nav-drawer');
  function closeDrawer() {
    drawer.classList.remove('open'); hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded','false'); document.body.style.overflow = '';
  }
  hamburger.addEventListener('click', function () {
    var open = drawer.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });
  drawer.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeDrawer); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('open')) { closeDrawer(); hamburger.focus(); }
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  document.querySelectorAll('.carousel').forEach(function (car) {
    var track = car.querySelector('.carousel-track');
    if (!track) return;
    var prev = car.querySelector('.carousel-btn.prev'), next = car.querySelector('.carousel-btn.next');
    function step() { return track.clientWidth; }
    if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (next) next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
  });

  document.querySelectorAll('.yt-facade').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-id');
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube.com/embed/' + id + '?autoplay=1';
      iframe.title = 'Grupo Trampulim';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      btn.innerHTML = ''; btn.appendChild(iframe);
    });
  });

  /* ---- Galerias em tira de filme: auto-scroll + arrasto/swipe/trackpad + lightbox ---- */
  var marqueeRows = document.querySelectorAll('.show-marquee .marquee-row');
  if (marqueeRows.length) {
    var SPEED = 42; // px por segundo (movimento automático)

    /* Lightbox (único) */
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = '<img alt="" />';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector('img');
    var lbOpen = false;
    function openLb(src) { lbImg.src = src; lb.classList.add('open'); document.body.style.overflow = 'hidden'; lbOpen = true; }
    function closeLb() { lb.classList.remove('open'); document.body.style.overflow = ''; lbOpen = false; }
    lb.addEventListener('click', closeLb);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && lbOpen) closeLb(); });

    var states = [];
    marqueeRows.forEach(function (row) {
      var track = row.querySelector('.marquee-track');
      if (!track) return;
      /* Duplica todo o conteúdo uma vez → loop sem emenda, independente da duplicação do HTML */
      var clone = track.cloneNode(true);
      while (clone.firstChild) { track.appendChild(clone.firstChild); }

      var st = { row: row, track: track, dir: row.classList.contains('rtl') ? -1 : 1, userUntil: 0, dragging: false, moved: 0 };
      states.push(st);

      function half() { return track.scrollWidth / 2; }
      function wrap() {
        var h = half();
        if (h <= 0) return;
        if (row.scrollLeft >= h) row.scrollLeft -= h;
        else if (row.scrollLeft <= 0) row.scrollLeft += h;
      }
      st.wrap = wrap;
      if (st.dir < 0) row.scrollLeft = half(); // começa "no meio" para poder ir nas duas direções

      function userActive() { st.userUntil = performance.now() + 1600; }

      row.addEventListener('wheel', function (e) { if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) userActive(); }, { passive: true });
      row.addEventListener('touchstart', userActive, { passive: true });
      row.addEventListener('touchmove', userActive, { passive: true });
      row.addEventListener('scroll', wrap, { passive: true });

      /* Arrasto com mouse — com LIMIAR (clique vs arrasto). Sem pointer capture
         (capture roubava o clique). Touch/trackpad usam a rolagem nativa. */
      var DRAG_THRESHOLD = 6;
      function onMove(e) {
        if (!st.pending) return;
        var dx = e.clientX - st.startX;
        if (!st.dragging) {
          if (Math.abs(dx) < DRAG_THRESHOLD) return; // ainda é um clique
          st.dragging = true; row.classList.add('dragging');
        }
        row.scrollLeft = st.startScroll - dx;
        userActive();
      }
      function onUp() {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        st.pending = false;
        row.classList.remove('dragging');
        // swallow do clique nativo seguinte (abrimos manualmente aqui)
        st.suppressClick = true;
        setTimeout(function () { st.suppressClick = false; }, 120);
        if (st.dragging) {
          st.dragging = false; // foi arrasto → não abre
        } else if (st.downImg) {
          // clique limpo do mouse → abre EXATAMENTE a foto pressionada (imune a micro-desvio)
          openLb(st.downImg.getAttribute('src'));
        }
        st.downImg = null;
      }
      row.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'mouse' || e.button !== 0) return; // só mouse; touch = nativo
        st.pending = true; st.dragging = false; st.startX = e.clientX; st.startScroll = row.scrollLeft;
        st.downImg = (e.target && e.target.tagName === 'IMG') ? e.target : null;
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
      });

      /* Lightbox no toque (tap): mouse já é tratado no pointerup acima */
      track.querySelectorAll('.marquee-item img').forEach(function (img) {
        img.addEventListener('click', function () {
          if (st.suppressClick) { st.suppressClick = false; return; }
          openLb(img.getAttribute('src'));
        });
      });
    });

    var last = performance.now();
    var canHover = !window.matchMedia || window.matchMedia('(hover: hover)').matches;
    function frame(now) {
      var dt = Math.min((now - last) / 1000, 0.05); last = now;
      for (var i = 0; i < states.length; i++) {
        var st = states[i];
        if (lbOpen || st.dragging || now < st.userUntil) continue;
        // pausa quando o cursor está sobre a fileira (estado :hover do próprio navegador)
        if (canHover && st.row.matches(':hover')) continue;
        st.row.scrollLeft += st.dir * SPEED * dt;
        st.wrap();
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  var form = document.getElementById('contato-form');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    var data = new FormData(form);
    fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(data).toString() })
      .then(function () {
        var ok = document.getElementById('form-ok'); if (ok) ok.style.display = 'block';
        form.reset();
        btn.disabled = false;
      })
      .catch(function () {
        var ok = document.getElementById('form-ok');
        if (ok) { ok.style.background='#fef2f2'; ok.style.borderColor='#ef4444'; ok.style.color='#b91c1c';
          ok.textContent='Erro ao enviar. Por favor, tente o WhatsApp ou e-mail.'; ok.style.display='block'; }
        btn.disabled = false;
      });
  });
})();
