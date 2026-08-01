/* ── Dual Deck + Web Audio ────────────────────────── */
let audioCtx = null;
let masterGain = null;

const deckA = { el: new Audio(), gain: null, source: null };
const deckB = { el: new Audio(), gain: null, source: null };
deckA.el.preload = deckB.el.preload = 'auto';
deckA.el.crossOrigin = deckB.el.crossOrigin = 'anonymous';

let activeDeck   = deckA;
let inactiveDeck = deckB;

let crossfadeDuration = 3;  // seconds
let autoCrossfade     = false;
let crossfadeTimer    = null;
// Avançar para a próxima faixa automaticamente ao terminar (padrão: ligado)
let autoplayEnd = localStorage.getItem('tp_autoplay') !== '0';

function initCtx() {
  if (audioCtx) { audioCtx.resume(); return; }
  audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 1;
  masterGain.connect(audioCtx.destination);

  for (const deck of [deckA, deckB]) {
    deck.source = audioCtx.createMediaElementSource(deck.el);
    deck.gain   = audioCtx.createGain();
    deck.gain.gain.value = 0;
    deck.source.connect(deck.gain);
    deck.gain.connect(masterGain);
  }
}

/* ── State ────────────────────────────────────────── */
let shows       = [];
let order       = {};
let currentShow = null;
let currentIdx  = -1;

/* ── Persist ─────────────────────────────────────── */
function saveOrder() {
  localStorage.setItem('tp_order_v2', JSON.stringify(order));
}
function loadOrder() {
  try { return JSON.parse(localStorage.getItem('tp_order_v2') || '{}'); }
  catch { return {}; }
}

// Lista de espetáculos persistida no celular (sobrevive reload e offline)
function saveShows() {
  // Guarda só metadados (id, nome, faixas do servidor) — áudios ficam no IndexedDB
  const data = shows.map(s => ({ id: s.id, nome: s.nome, faixas: s.faixas || [] }));
  localStorage.setItem('tp_shows_v1', JSON.stringify(data));
}
function loadShowsLocal() {
  try { return JSON.parse(localStorage.getItem('tp_shows_v1') || '[]'); }
  catch { return []; }
}

/* ── Fetch shows ─────────────────────────────────── */
async function fetchShows() {
  try {
    const res = await fetch('listar.php', { cache: 'no-store' });
    return await res.json();
  } catch { return []; }
}

// Mescla espetáculos do servidor com os salvos no celular (dedupe por id)
function mergeShows(serverShows, localShows) {
  const byId = {};
  // Locais primeiro (preservam ordem/criações do usuário)
  for (const s of localShows) byId[s.id] = { ...s, faixas: s.faixas || [] };
  // Servidor sobrepõe faixas (fonte de verdade quando online)
  for (const s of serverShows) {
    if (byId[s.id]) byId[s.id].faixas = s.faixas || [];
    else byId[s.id] = { ...s, faixas: s.faixas || [] };
  }
  return Object.values(byId);
}

/* ── Ordered tracks ──────────────────────────────── */
function getOrdered(show) {
  const saved = order[show.id];
  if (!saved) return [...show.faixas];
  const map = Object.fromEntries(show.faixas.map(f => [f.url, f]));
  const result = saved.map(u => map[u]).filter(Boolean);
  show.faixas.forEach(f => { if (!saved.includes(f.url)) result.push(f); });
  return result;
}

/* ── Sidebar ─────────────────────────────────────── */
function renderSidebar() {
  const list = document.getElementById('show-list');
  list.innerHTML = '';
  shows.forEach(show => {
    const el = document.createElement('div');
    el.className = 'show-item' + (currentShow?.id === show.id ? ' active' : '');
    el.innerHTML = `<span class="dot"></span><span>${capitalize(show.nome)}</span>`;
    el.addEventListener('click', () => selectShow(show));
    list.appendChild(el);
    // Badge offline (assíncrono, sem bloquear render)
    idbGetAll(show.id).then(rows => {
      if (rows.length && show.faixas.length && rows.length >= show.faixas.length) {
        const badge = document.createElement('span');
        badge.className = 'offline-badge';
        badge.textContent = '✓';
        badge.title = 'Disponível offline';
        el.appendChild(badge);
      }
    });
  });
}

async function selectShow(show) {
  currentShow = show;
  document.getElementById('show-title').textContent = capitalize(show.nome);
  document.getElementById('tracklist-header').style.display = 'flex';
  renderSidebar();
  show._local = await loadLocalTracks(show.id);
  renderTracklist();
  updateOfflineBtn(show);
  showTracksView();
}

/* ── Tracklist ───────────────────────────────────── */
function renderTracklist() {
  const list = document.getElementById('tracklist');
  list.innerHTML = '';

  if (!currentShow) {
    list.innerHTML = `<div class="empty-state"><span class="big">🎭</span><p>Selecione um espetáculo na lista ao lado</p></div>`;
    return;
  }

  const tracks = getMergedTracks(currentShow);
  if (!tracks.length) {
    list.innerHTML = `<div class="empty-state"><span class="big">📁</span><p>Nenhuma faixa encontrada.<br>Toque 📁 para importar do celular<br>ou suba arquivos para <code>audio/${currentShow.id}/</code></p></div>`;
    return;
  }

  tracks.forEach((track, i) => {
    const playing = i === currentIdx;
    const el = document.createElement('div');
    el.className = 'track' + (playing ? ' playing' : '') + (track.local ? ' track-local' : '');
    el.dataset.url = track.url;
    el.dataset.idx = i;
    el.innerHTML = `
      <div class="track-num">${i + 1}</div>
      <div class="track-eq"><span></span><span></span><span></span></div>
      <div class="track-name">${track.name}</div>
      <div class="track-actions">
        <span class="track-handle btn-icon" title="Arrastar">⠿</span>
      </div>`;
    el.addEventListener('click', e => {
      if (e.target.closest('.track-handle')) return;
      playTrack(i);
    });
    setupDrag(el);
    list.appendChild(el);
  });

  // Rola para a faixa ativa
  scrollToActive();
}

/* ── Play with crossfade ─────────────────────────── */
function playTrack(idx, instant = false) {
  if (!currentShow) return;
  const tracks = getMergedTracks(currentShow);
  if (idx < 0 || idx >= tracks.length) return;

  initCtx();

  const track    = tracks[idx];
  const nextDeck = inactiveDeck;
  const prevDeck = activeDeck;

  // Cancela qualquer pausa pendente do deck que vamos reutilizar
  // (evita que um clique anterior pause a faixa nova logo após tocar)
  clearTimeout(nextDeck._pauseTimer);

  // Prepare next deck
  nextDeck.el.src = track.url;
  nextDeck._trackName = track.name;
  nextDeck._playStartedAt = Date.now();
  nextDeck.el.play().catch(() => toast('Erro ao carregar o áudio'));

  const dur = instant ? 0.05 : crossfadeDuration;
  const now = audioCtx.currentTime;

  // Fade out current deck
  prevDeck.gain.gain.cancelScheduledValues(now);
  prevDeck.gain.gain.setValueAtTime(prevDeck.gain.gain.value, now);
  prevDeck.gain.gain.linearRampToValueAtTime(0, now + dur);
  // Pausa o deck anterior só se ele ainda estiver inativo no fim do fade
  prevDeck._pauseTimer = setTimeout(() => {
    if (prevDeck !== activeDeck) { prevDeck.el.pause(); prevDeck.el.currentTime = 0; }
  }, dur * 1000 + 100);

  // Fade in next deck
  nextDeck.gain.gain.cancelScheduledValues(now);
  nextDeck.gain.gain.setValueAtTime(0, now);
  nextDeck.gain.gain.linearRampToValueAtTime(1, now + dur);

  // Swap decks
  activeDeck   = nextDeck;
  inactiveDeck = prevDeck;

  currentIdx = idx;
  updatePlayerInfo(track);
  renderTracklist();
  document.getElementById('btn-play').textContent = '⏸';
  scrollToActive();

  // Schedule auto-crossfade at end
  clearTimeout(crossfadeTimer);
  if (autoCrossfade && autoplayEnd) scheduleCrossfade();
}

function scheduleCrossfade() {
  clearTimeout(crossfadeTimer);
  const el = activeDeck.el;

  function check() {
    if (!autoCrossfade || !autoplayEnd || activeDeck.el !== el) return;
    if (!el.duration) { crossfadeTimer = setTimeout(check, 500); return; }
    const remaining = el.duration - el.currentTime;
    if (remaining <= crossfadeDuration + 0.2) {
      const tracks = getMergedTracks(currentShow);
      if (currentIdx < tracks.length - 1) playTrack(currentIdx + 1);
      return;
    }
    crossfadeTimer = setTimeout(check, 500);
  }
  crossfadeTimer = setTimeout(check, 500);
}

function scrollToActive() {
  const active = document.querySelector('#tracklist .track.playing');
  if (active) active.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function updatePlayerInfo(track) {
  document.getElementById('track-title').textContent = track.name;
  document.getElementById('track-show').textContent  = capitalize(currentShow?.nome || '');
}

/* ── Audio events (active deck) ──────────────────── */
function attachDeckEvents(deck) {
  deck.el.addEventListener('timeupdate', () => {
    if (deck !== activeDeck) return;
    const prog = document.getElementById('progress');
    const cur  = document.getElementById('time-cur');
    const tot  = document.getElementById('time-tot');
    if (!deck.el.duration) return;
    prog.value = (deck.el.currentTime / deck.el.duration) * 100;
    cur.textContent = fmt(deck.el.currentTime);
    tot.textContent = fmt(deck.el.duration);
  });

  deck.el.addEventListener('ended', () => {
    if (deck !== activeDeck) return;

    // Proteção: se a faixa "terminou" rápido demais, é problema de formato
    // (arquivo que o navegador não decodifica direito) — para e avisa,
    // em vez de pular as faixas em cascata.
    const elapsed = (Date.now() - (deck._playStartedAt || 0)) / 1000;
    if (elapsed < 2) {
      deck.el.pause();
      toast(`"${deck._trackName || 'Faixa'}" tem um problema de formato. Converta para MP3.`);
      document.getElementById('btn-play').textContent = '▶';
      return;
    }

    // Autoplay desligado: para no fim da faixa, sem avançar
    if (!autoplayEnd) {
      document.getElementById('btn-play').textContent = '▶';
      return;
    }

    if (!autoCrossfade) {
      const tracks = getMergedTracks(currentShow);
      if (currentIdx < tracks.length - 1) playTrack(currentIdx + 1, true);
      else { currentIdx = -1; renderTracklist(); resetPlayerBar(); }
    }
  });

  // Erro de carregamento/decodificação — avisa sem travar a interface
  deck.el.addEventListener('error', () => {
    if (deck !== activeDeck) return;
    toast(`Erro ao tocar "${deck._trackName || 'a faixa'}". Tente converter para MP3.`);
    document.getElementById('btn-play').textContent = '▶';
  });

  deck.el.addEventListener('play',  () => { if (deck === activeDeck) document.getElementById('btn-play').textContent = '⏸'; });
  deck.el.addEventListener('pause', () => { if (deck === activeDeck) document.getElementById('btn-play').textContent = '▶'; });
}

attachDeckEvents(deckA);
attachDeckEvents(deckB);

function resetPlayerBar() {
  document.getElementById('track-title').textContent = '—';
  document.getElementById('track-show').textContent  = '';
  document.getElementById('progress').value = 0;
  document.getElementById('time-cur').textContent = '0:00';
  document.getElementById('time-tot').textContent = '0:00';
}

/* ── Controls ────────────────────────────────────── */
document.getElementById('btn-play').addEventListener('click', () => {
  initCtx();
  if (!activeDeck.el.src) return;
  if (activeDeck.el.paused) activeDeck.el.play();
  else activeDeck.el.pause();
});

document.getElementById('btn-prev').addEventListener('click', () => {
  if (activeDeck.el.currentTime > 3) { activeDeck.el.currentTime = 0; return; }
  playTrack(currentIdx - 1);
});

document.getElementById('btn-next').addEventListener('click', () => playTrack(currentIdx + 1));

document.getElementById('progress').addEventListener('input', e => {
  if (activeDeck.el.duration) activeDeck.el.currentTime = (e.target.value / 100) * activeDeck.el.duration;
});

/* ── Volume fader customizado (div arrastável vertical) ── */
const volTrack   = document.getElementById('vol-track');
const volThumb   = document.getElementById('fader-thumb');
const volDisplay = document.getElementById('vol-pct');
let volValue = 100; // 0–100

function setVolume(v) {
  v = Math.max(0, Math.min(100, Math.round(v)));
  volValue = v;
  if (masterGain) masterGain.gain.value = v / 100;
  else { deckA.el.volume = deckB.el.volume = v / 100; }
  volDisplay.textContent = v + '%';
  // posiciona thumb: 0% = bottom (top alto), 100% = top (top baixo → invertido visualmente)
  const trackH  = volTrack.clientHeight;
  const thumbH  = volThumb.offsetHeight;
  const usable  = trackH - thumbH;
  // 100% volume = thumb no topo, 0% = thumb no fundo
  const topPx   = usable * (1 - v / 100);
  volThumb.style.top = topPx + (thumbH / 2) + 'px';
}

function volFromY(clientY) {
  const rect   = volTrack.getBoundingClientRect();
  const thumbH = volThumb.offsetHeight;
  const usable = rect.height - thumbH;
  const relY   = clientY - rect.top - thumbH / 2;
  const ratio  = 1 - relY / usable;
  return ratio * 100;
}

// Mouse
volTrack.addEventListener('mousedown', e => {
  volThumb.classList.add('dragging');
  setVolume(volFromY(e.clientY));
  const onMove = ev => setVolume(volFromY(ev.clientY));
  const onUp   = ()  => { volThumb.classList.remove('dragging'); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
});

// Touch
volTrack.addEventListener('touchstart', e => {
  e.preventDefault();
  volThumb.classList.add('dragging');
  setVolume(volFromY(e.touches[0].clientY));
  const onMove = ev => { ev.preventDefault(); setVolume(volFromY(ev.touches[0].clientY)); };
  const onEnd  = ()  => { volThumb.classList.remove('dragging'); document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onEnd); };
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend', onEnd);
}, { passive: false });

// Posiciona thumb no load (volume 100%)
window.addEventListener('load', () => setVolume(100));

/* ── Crossfade controls ──────────────────────────── */
const cfSlider  = document.getElementById('crossfade-dur');
const cfDisplay = document.getElementById('cf-val');

cfSlider.addEventListener('input', e => {
  crossfadeDuration = parseFloat(e.target.value);
  cfDisplay.textContent = crossfadeDuration === 0 ? 'OFF' : crossfadeDuration + 's';
});

document.getElementById('auto-crossfade').addEventListener('change', e => {
  autoCrossfade = e.target.checked;
  if (autoCrossfade && autoplayEnd && activeDeck.el.src && !activeDeck.el.paused) scheduleCrossfade();
  else clearTimeout(crossfadeTimer);
});

// Autoplay ao final das faixas (marcável, padrão ligado, persiste)
const autoplayChk = document.getElementById('autoplay-end');
autoplayChk.checked = autoplayEnd;
autoplayChk.addEventListener('change', e => {
  autoplayEnd = e.target.checked;
  localStorage.setItem('tp_autoplay', autoplayEnd ? '1' : '0');
  if (autoplayEnd && autoCrossfade && activeDeck.el.src && !activeDeck.el.paused) scheduleCrossfade();
  else if (!autoplayEnd) clearTimeout(crossfadeTimer);
});

/* ── Drag & drop ─────────────────────────────────── */
let draggingEl = null;

function setupDrag(el) {
  const handle = el.querySelector('.track-handle');
  el.draggable = true;

  el.addEventListener('dragstart', e => {
    draggingEl = el; el.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });
  el.addEventListener('dragend', () => {
    draggingEl = null; el.classList.remove('dragging');
    document.querySelectorAll('.track').forEach(t => t.classList.remove('drag-over'));
    saveCurrentOrder();
  });
  el.addEventListener('dragover', e => {
    e.preventDefault();
    if (draggingEl && draggingEl !== el) {
      document.querySelectorAll('.track').forEach(t => t.classList.remove('drag-over'));
      el.classList.add('drag-over');
    }
  });
  el.addEventListener('drop', e => {
    e.preventDefault();
    if (draggingEl && draggingEl !== el) {
      const list = el.parentNode;
      const all  = [...list.querySelectorAll('.track')];
      const from = all.indexOf(draggingEl), to = all.indexOf(el);
      if (from < to) list.insertBefore(draggingEl, el.nextSibling);
      else list.insertBefore(draggingEl, el);
      el.classList.remove('drag-over');
    }
  });

  // Touch drag
  let touchY0 = 0, clone = null;
  handle.addEventListener('touchstart', e => {
    const t = e.touches[0]; touchY0 = t.clientY;
    clone = el.cloneNode(true);
    const r = el.getBoundingClientRect();
    clone.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${el.offsetWidth}px;opacity:.8;pointer-events:none;z-index:999;background:var(--surface2);border-radius:8px;`;
    document.body.appendChild(clone);
    el.classList.add('dragging');
  }, { passive: true });

  handle.addEventListener('touchmove', e => {
    e.preventDefault();
    const t = e.touches[0], dy = t.clientY - touchY0;
    if (clone) clone.style.top = (el.getBoundingClientRect().top + dy) + 'px';
    const target = document.elementFromPoint(t.clientX, t.clientY)?.closest('.track');
    document.querySelectorAll('.track').forEach(x => x.classList.remove('drag-over'));
    if (target && target !== el) target.classList.add('drag-over');
  }, { passive: false });

  handle.addEventListener('touchend', e => {
    const t = e.changedTouches[0];
    const target = document.elementFromPoint(t.clientX, t.clientY)?.closest('.track');
    if (target && target !== el) {
      const list = el.parentNode, all = [...list.querySelectorAll('.track')];
      const from = all.indexOf(el), to = all.indexOf(target);
      if (from < to) list.insertBefore(el, target.nextSibling);
      else list.insertBefore(el, target);
    }
    clone?.remove(); clone = null;
    el.classList.remove('dragging');
    document.querySelectorAll('.track').forEach(x => x.classList.remove('drag-over'));
    saveCurrentOrder();
  }, { passive: true });
}

function saveCurrentOrder() {
  if (!currentShow) return;
  const els = document.querySelectorAll('#tracklist .track');
  order[currentShow.id] = [...els].map(el => el.dataset.url);
  saveOrder();
  els.forEach((el, i) => {
    const n = el.querySelector('.track-num');
    if (n) n.textContent = i + 1;
    el.dataset.idx = i;
  });
}

/* ── New show modal ──────────────────────────────── */
document.getElementById('btn-new-show').addEventListener('click', () => {
  document.getElementById('modal-new-show').style.display = 'flex';
  document.getElementById('new-show-name').value = '';
  setTimeout(() => document.getElementById('new-show-name').focus(), 50);
});
document.getElementById('btn-cancel-show').addEventListener('click', closeModal);
document.getElementById('btn-confirm-show').addEventListener('click', () => {
  const name = document.getElementById('new-show-name').value.trim();
  if (!name) return;
  const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  if (shows.find(s => s.id === id)) { toast('Já existe um espetáculo com esse nome'); return; }
  const show = { id, nome: name, faixas: [] };
  shows.push(show);
  saveShows();
  renderSidebar();
  selectShow(show);
  closeModal();
  toast(`Espetáculo "${name}" criado. Toque 📁 para importar as faixas.`);
});
document.getElementById('new-show-name').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-confirm-show').click();
  if (e.key === 'Escape') closeModal();
});
function closeModal() { document.getElementById('modal-new-show').style.display = 'none'; }

/* ── Navegação duas telas (mobile) ───────────────── */
const app = document.getElementById('app');

function isMobile() { return window.innerWidth <= 600; }

function showTracksView() {
  if (!isMobile()) return;
  app.classList.remove('view-shows');
  app.classList.add('view-tracks');
  document.getElementById('btn-back').style.display = 'flex';
}

function showShowsView() {
  if (!isMobile()) return;
  app.classList.remove('view-tracks');
  app.classList.add('view-shows');
  document.getElementById('btn-back').style.display = 'none';
}

document.getElementById('btn-back').addEventListener('click', showShowsView);

// Inicia na tela de espetáculos no mobile
if (isMobile()) app.classList.add('view-shows');

function closeSidebar() { /* no-op — substituído por navegação de telas */ }

/* ── Helpers ─────────────────────────────────────── */
function fmt(s) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}
function capitalize(s) { return s.replace(/\b\w/g, c => c.toUpperCase()); }
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 3500);
}

/* ── IndexedDB — armazenamento local de áudios ────── */
let idb = null;

function openIDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open('tp_audio', 1);
    req.onupgradeneeded = e => {
      e.target.result.createObjectStore('tracks', { keyPath: 'key' });
    };
    req.onsuccess = e => res(e.target.result);
    req.onerror   = e => rej(e.target.error);
  });
}

async function idbPut(key, blob) {
  const db = idb || (idb = await openIDB());
  return new Promise((res, rej) => {
    const tx = db.transaction('tracks', 'readwrite');
    tx.objectStore('tracks').put({ key, blob });
    tx.oncomplete = res; tx.onerror = e => rej(e.target.error);
  });
}

async function idbGetAll(prefix) {
  const db = idb || (idb = await openIDB());
  return new Promise((res, rej) => {
    const tx    = db.transaction('tracks', 'readonly');
    const store = tx.objectStore('tracks');
    const range = IDBKeyRange.bound(prefix + '/', prefix + '/￿');
    const req   = store.getAll(range);
    req.onsuccess = e => res(e.target.result);
    req.onerror   = e => rej(e.target.error);
  });
}

async function idbDelete(key) {
  const db = idb || (idb = await openIDB());
  return new Promise((res, rej) => {
    const tx = db.transaction('tracks', 'readwrite');
    tx.objectStore('tracks').delete(key);
    tx.oncomplete = res; tx.onerror = e => rej(e.target.error);
  });
}

// Carrega faixas locais salvas para um espetáculo
async function loadLocalTracks(showId) {
  const rows = await idbGetAll(showId);
  return rows.map(r => ({
    name: r.key.replace(showId + '/', '').replace(/\.\w+$/, ''),
    url:  URL.createObjectURL(r.blob),
    local: true,
    key:  r.key,
  }));
}

// Verifica quais faixas de um show estão salvas offline
async function getOfflineKeys(showId) {
  const rows = await idbGetAll(showId);
  return new Set(rows.map(r => r.key));
}

// Ícone de download (seta grossa) — usado no botão de salvar offline
const DL_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M5 21h14"/></svg>';

// Baixa todas as faixas do show e salva no IndexedDB
async function saveShowOffline(show) {
  const tracks = getOrdered(show);
  if (!tracks.length) { toast('Nenhuma faixa no servidor para baixar.'); return; }

  const btn = document.getElementById('btn-save-offline');
  btn.classList.add('saving');
  btn.title = 'Baixando…';

  let ok = 0;
  for (const [i, track] of tracks.entries()) {
    btn.textContent = `${i + 1}/${tracks.length}`;
    try {
      const res  = await fetch(track.url);
      if (!res.ok) throw new Error(res.status);
      const blob = await res.blob();
      const key  = show.id + '/' + track.name;
      await idbPut(key, blob);
      ok++;
    } catch {
      toast(`Erro ao baixar: ${track.name}`);
    }
  }

  btn.innerHTML = DL_ICON;
  btn.classList.remove('saving');

  if (ok === tracks.length) {
    btn.classList.add('saved');
    btn.title = 'Salvo offline ✓';
    toast(`${ok} faixa(s) salvas! O espetáculo toca offline agora.`);
  } else {
    toast(`${ok}/${tracks.length} faixas salvas. Verifique a conexão.`);
  }

  show._local = await loadLocalTracks(show.id);
  renderTracklist();
  renderSidebar();
}

document.getElementById('btn-save-offline').addEventListener('click', () => {
  if (!currentShow) return;
  if (!navigator.onLine) { toast('Sem internet. Conecte para baixar as faixas.'); return; }
  saveShowOffline(currentShow);
});

// Ao abrir um show, indica se já está offline
async function updateOfflineBtn(show) {
  const btn = document.getElementById('btn-save-offline');
  btn.classList.remove('saved', 'saving');
  btn.innerHTML = DL_ICON;
  btn.title = 'Salvar para tocar offline';
  const tracks  = getOrdered(show);
  if (!tracks.length) return;
  const saved   = await getOfflineKeys(show.id);
  const allSaved = tracks.every(t => saved.has(show.id + '/' + t.name));
  if (allSaved) { btn.classList.add('saved'); btn.title = 'Salvo offline ✓'; }
}

// Importa arquivos selecionados pelo usuário
document.getElementById('file-import').addEventListener('change', async e => {
  if (!currentShow) return;
  const files = [...e.target.files];
  if (!files.length) return;

  toast(`Salvando ${files.length} faixa(s)…`);
  for (const file of files) {
    const key = currentShow.id + '/' + file.name;
    await idbPut(key, file);
  }

  // Recarrega faixas locais e mescla com lista do show
  currentShow._local = await loadLocalTracks(currentShow.id);
  renderTracklist();
  toast(`${files.length} faixa(s) salvas! Tocam offline.`);
  e.target.value = ''; // permite reimportar o mesmo arquivo
});

// Retorna faixas locais + servidor mescladas (locais têm prioridade por nome)
function getMergedTracks(show) {
  const local  = show._local || [];
  const server = getOrdered(show);
  // Remove duplicatas: se nome igual ao de uma faixa local, descarta servidor
  const localNames = new Set(local.map(t => t.name.toLowerCase()));
  const filtered   = server.filter(t => !localNames.has(t.name.toLowerCase().replace(/\.\w+$/, '')));
  // Junta: locais primeiro, depois restantes do servidor
  return [...local, ...filtered];
}

/* ── Init ────────────────────────────────────────── */
function renderEmptyMsg() {
  document.getElementById('show-list').innerHTML =
    `<p style="padding:12px;font-size:13px;color:var(--text-dim);line-height:1.5">Nenhum espetáculo ainda.<br>Toque <b>+ Novo espetáculo</b> e importe as faixas com o ícone 📁.</p>`;
}

async function init() {
  order = loadOrder();

  // 1. Carrega espetáculos salvos no celular — instantâneo e funciona offline
  shows = loadShowsLocal();
  renderSidebar();
  if (!shows.length) renderEmptyMsg();
  if (shows.length && !isMobile()) selectShow(shows[0]);

  // 2. Registra service worker com auto-atualização
  // (assim novas versões aplicam sozinhas, sem limpar cache manualmente)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(reg => {
      reg.update();
      // Quando um SW novo assume o controle, recarrega uma vez
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloaded) return;
        reloaded = true;
        window.location.reload();
      });
      // Se há um SW esperando, pede para assumir já
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (nw) nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            nw.postMessage('skip-waiting');
          }
        });
      });
    }).catch(() => {});
  }

  // 3. Tenta atualizar pela lista do servidor (se online)
  try {
    const serverShows = await fetchShows();
    if (serverShows.length) {
      shows = mergeShows(serverShows, shows);
      saveShows();
      renderSidebar();
      if (!currentShow && shows.length && !isMobile()) selectShow(shows[0]);
    }
  } catch { /* offline — mantém a lista local */ }

  if (!shows.length) renderEmptyMsg();
}

init();
