// ==UserScript==
// @name         Redirect between insportline domains (Material 3 Expressive)
// @namespace    https://github.com/Steller25/insportline
// @version      3.4.0
// @description  Material 3 Expressive switcher z menu kontekstowym, pięknymi flagami i porównaniem cen!
// @author       Steller25
// @match        https://www.e-insportline.pl/*
// @match        https://e-insportline.pl/*
// @match        https://www.insportline.cz/*
// @match        https://insportline.cz/*
// @match        https://www.insportline.eu/*
// @match        https://insportline.eu/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=e-insportline.pl
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @connect      raw.githubusercontent.com
// @connect      e-insportline.pl
// @connect      www.e-insportline.pl
// @connect      insportline.cz
// @connect      www.insportline.cz
// @connect      insportline.eu
// @connect      www.insportline.eu
// @updateURL    https://raw.githubusercontent.com/Steller25/insportline/main/insportline-switcher.user.js
// @downloadURL  https://raw.githubusercontent.com/Steller25/insportline/main/insportline-switcher.user.js
// @homepageURL  https://github.com/Steller25/insportline
// @supportURL   https://github.com/Steller25/insportline/issues
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  // ============= Przypomnienie o aktualizacji =============
  (function checkForHintedUpdate() {
    try {
      const CURRENT = (typeof GM_info !== 'undefined' && GM_info && GM_info.script && GM_info.script.version) || '3.4.0';
      const INFO_URL = 'https://raw.githubusercontent.com/Steller25/insportline/main/latest.json';

      const KEY = {
        lastSuccess: 'ins-switcher:last-success',
        etag: 'ins-switcher:etag',
        dismissed: 'ins-switcher:dismissed-ver',
        heartbeat: 'ins-switcher:heartbeat',
      };

      const SESSION_GAP_MS = 5 * 60 * 1000;
      const now = Date.now();
      const lastBeat = Number(GM_getValue(KEY.heartbeat, 0));
      const isNewBrowserSession = (now - lastBeat) > SESSION_GAP_MS;

      beat();
      setInterval(beat, 60 * 1000);
      function beat() { GM_setValue(KEY.heartbeat, Date.now()); }

      if (typeof GM_registerMenuCommand === 'function') {
        GM_registerMenuCommand('Sprawdź aktualizację teraz', () => fetchInfo(true));
      }

      const lastSuccess = Number(GM_getValue(KEY.lastSuccess, 0));
      const STALENESS_MS = 24 * 60 * 60 * 1000;
      if (isNewBrowserSession || (now - lastSuccess) > STALENESS_MS) {
        fetchInfo(false);
      }

      function fetchInfo(isManual) {
        const etag = GM_getValue(KEY.etag, null);
        GM_xmlhttpRequest({
          method: 'GET',
          url: INFO_URL,
          headers: Object.assign({ 'Cache-Control': 'no-cache' }, etag ? { 'If-None-Match': etag } : {}),
          onload: (res) => {
            if (res.status === 304) {
              GM_setValue(KEY.lastSuccess, Date.now());
              if (isManual) showUpdateBubble(CURRENT, '', 'Masz najnowszą wersję.', { installable: false });
              return;
            }
            if (res.status >= 200 && res.status < 300 && res.responseText) {
              try {
                const newEtag = res.responseHeaders?.split(/\r?\n/)?.find((h) => /^etag:/i.test(h))?.split(':')[1]?.trim();
                if (newEtag) GM_setValue(KEY.etag, newEtag);

                const info = JSON.parse(res.responseText);
                if (!info || !info.version || !info.installUrl) return;

                GM_setValue(KEY.lastSuccess, Date.now());
                const dismissed = String(GM_getValue(KEY.dismissed, '') || '');
                if (dismissed === info.version) return;

                if (isNewer(info.version, CURRENT)) {
                  showUpdateBubble(info.version, info.installUrl, info.notes);
                } else if (isManual) {
                  showUpdateBubble(CURRENT, '', 'Masz najnowszą wersję.', { installable: false });
                }
              } catch { /* cicho */ }
            }
          }
        });
      }

      function isNewer(a, b) {
        const norm = (v) => String(v).split('-')[0].split('.').map((x) => parseInt(x, 10) || 0);
        const pa = norm(a), pb = norm(b);
        for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
          const da = pa[i] || 0, db = pb[i] || 0;
          if (da > db) return true;
          if (da < db) return false;
        }
        return false;
      }

      function showUpdateBubble(ver, url, notes, opts = { installable: true }) {
        const wrap = document.createElement('div');
        wrap.setAttribute('role', 'dialog');
        wrap.setAttribute('aria-live', 'polite');
        Object.assign(wrap.style, {
          position: 'fixed', right: '16px', bottom: '16px', maxWidth: '320px', zIndex: 2147483647,
          background: '#1c1b1f', color: '#e6e1e5', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,.35)',
          padding: '16px', fontFamily: 'system-ui, sans-serif', lineHeight: '1.4'
        });

        const title = document.createElement('div');
        title.textContent = opts.installable ? `Nowa wersja: ${ver}` : `Aktualnie: ${ver}`;
        Object.assign(title.style, { fontWeight: '700', marginBottom: '6px', fontSize: '15px' });

        const msg = document.createElement('div');
        msg.textContent = notes || (opts.installable ? 'Kliknij, aby zainstalować aktualizację.' : 'Brak nowszej wersji.');
        Object.assign(msg.style, { marginBottom: '12px', fontSize: '14px', opacity: '.9' });

        const actions = document.createElement('div');
        Object.assign(actions.style, { display: 'flex', gap: '8px', alignItems: 'center' });

        if (opts.installable && url) {
          const link = document.createElement('a');
          link.href = url; link.target = '_blank'; link.rel = 'noopener'; link.textContent = 'Zainstaluj';
          Object.assign(link.style, {
            display: 'inline-block', textDecoration: 'none', padding: '8px 16px', borderRadius: '999px',
            background: '#386a20', color: '#fff', fontWeight: '600', fontSize: '14px'
          });
          actions.appendChild(link);
        }

        const dismiss = document.createElement('button');
        dismiss.type = 'button'; dismiss.textContent = 'Nie teraz';
        Object.assign(dismiss.style, {
          border: 'none', background: 'transparent', color: '#a4a1a9', cursor: 'pointer', fontWeight: '600', fontSize: '14px'
        });
        dismiss.addEventListener('click', () => {
          if (opts.installable) GM_setValue(KEY.dismissed, ver);
          wrap.remove();
        });
        actions.appendChild(dismiss);

        const close = document.createElement('button');
        close.type = 'button'; close.ariaLabel = 'Zamknij'; close.textContent = '×';
        Object.assign(close.style, {
          position: 'absolute', right: '8px', top: '8px', width: '28px', height: '28px',
          border: 'none', borderRadius: '50%', background: 'transparent', color: '#a4a1a9', fontSize: '20px', cursor: 'pointer'
        });
        close.addEventListener('click', () => wrap.remove());

        wrap.append(title, msg, actions, close);
        document.body.appendChild(wrap);
        setTimeout(() => wrap.remove(), 20000);
      }
    } catch {/* cicho */}
  })();

  // ============================ Konfiguracja =============================
  const rawHost = window.location.hostname;
  const host = rawHost.replace(/^www\./, '');

  const domainMappings = {
    'e-insportline.pl': [
      { label: 'CZ', host: 'insportline.cz' },
      { label: 'EU', host: 'insportline.eu' }
    ],
    'insportline.cz': [
      { label: 'PL', host: 'e-insportline.pl' },
      { label: 'EU', host: 'insportline.eu' }
    ],
    'insportline.eu': [
      { label: 'PL', host: 'e-insportline.pl' },
      { label: 'CZ', host: 'insportline.cz' }
    ]
  };

  const allDomains = [
    { label: 'PL', host: 'e-insportline.pl' },
    { label: 'CZ', host: 'insportline.cz' },
    { label: 'EU', host: 'insportline.eu' }
  ];

  if (!domainMappings[host]) return;

  // ============================ CSS =============================
  const style = document.createElement('style');
  style.textContent = `
:root {
  --ins-btn-radius: 999px;
  --ins-gap: 10px;
  --ins-font: "Roboto", system-ui, -apple-system, sans-serif;

  --ins-pl-container: #ba1a1a;
  --ins-pl-glow:      rgba(186, 26, 26, .50);
  --ins-pl-highlight: rgba(255, 120, 120, .18);

  --ins-cz-container: #0041c4;
  --ins-cz-glow:      rgba(0, 65, 196, .50);
  --ins-cz-highlight: rgba(120, 160, 255, .18);

  --ins-eu-container: #006e1c;
  --ins-eu-glow:      rgba(0, 110, 28, .50);
  --ins-eu-highlight: rgba(80, 220, 100, .18);
}

.insportline-switcher-container {
  display: inline-flex !important;
  align-items: center !important;
  gap: var(--ins-gap) !important;
  margin-left: 24px !important;
  z-index: 999999 !important;
}

a.insportline-btn {
  font-family: var(--ins-font) !important;
  border: none !important;
  border-radius: var(--ins-btn-radius) !important;
  cursor: pointer !important;
  text-decoration: none !important;
  display: inline-flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 8px 18px 9px !important;
  gap: 4px !important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.20),
    0 4px 16px rgba(0,0,0,.28) !important;
  transition:
    transform .22s cubic-bezier(0.175, 0.885, 0.32, 1.275),
    box-shadow .22s ease,
    filter .22s ease !important;
  -webkit-transition: 
    -webkit-transform .22s cubic-bezier(0.175, 0.885, 0.32, 1.275),
    box-shadow .22s ease,
    filter .22s ease !important;
  user-select: none !important;
  -webkit-user-select: none !important;
  outline: none !important;
  position: relative !important;
  overflow: hidden !important;
  min-height: 46px !important;
  min-width: 68px !important;
  color: #fff !important;
  background-image: linear-gradient(180deg, rgba(255,255,255,.13) 0%, rgba(0,0,0,.08) 100%) !important;
}

.ins-main {
  display: flex !important;
  align-items: center !important;
  gap: 7px !important;
  font-size: 13.5px !important;
  font-weight: 800 !important;
  text-transform: uppercase !important;
  letter-spacing: .75px !important;
  line-height: 1 !important;
  white-space: nowrap !important;
  transition: opacity .18s ease !important;
}

.ins-icon {
  display: inline-block !important;
  width: 21px !important;
  height: 14px !important;
  flex: 0 0 21px !important;
  border-radius: 2px !important;
  box-shadow: 0 1px 4px rgba(0,0,0,.35), 0 0 0 1px rgba(0,0,0,.1) !important;
}

.ins-price {
  font-size: 10px !important;
  font-weight: 700 !important;
  padding: 2px 8px !important;
  border-radius: 999px !important;
  background: rgba(0,0,0,.22) !important;
  color: rgba(255,255,255,.92) !important;
  letter-spacing: .25px !important;
  min-width: 52px !important;
  text-align: center !important;
  line-height: 1.6 !important;
  white-space: nowrap !important;
  transition: opacity .3s ease !important;
}

.ins-price--loading {
  color: rgba(255,255,255,.55) !important;
  letter-spacing: 3px !important;
  animation: ins-pulse 1.2s ease-in-out infinite !important;
}
@keyframes ins-pulse {
  0%, 100% { opacity: .45; }
  50%       { opacity: 1; }
}

.ins-price--loaded {
  animation: ins-fade-up .32s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}
@keyframes ins-fade-up {
  from { opacity: 0; transform: translateY(4px) scale(.9); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.ins-price--unavailable {
  color: rgba(255,255,255,.38) !important;
}

a.insportline-btn:hover {
  transform: scale(1.09) translateY(-2px) !important;
  -webkit-transform: scale(1.09) translateY(-2px) !important;
}
a.insportline-btn--PL:hover {
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.22),
    0 8px 28px var(--ins-pl-glow),
    0 0 0 3px var(--ins-pl-highlight) !important;
}
a.insportline-btn--CZ:hover {
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.22),
    0 8px 28px var(--ins-cz-glow),
    0 0 0 3px var(--ins-cz-highlight) !important;
}
a.insportline-btn--EU:hover {
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.22),
    0 8px 28px var(--ins-eu-glow),
    0 0 0 3px var(--ins-eu-highlight) !important;
}

a.insportline-btn:active {
  transform: scale(0.93) translateY(1px) !important;
  -webkit-transform: scale(0.93) translateY(1px) !important;
  filter: brightness(.9) !important;
}

a.insportline-btn--PL { background-color: var(--ins-pl-container) !important; }
a.insportline-btn--CZ { background-color: var(--ins-cz-container) !important; }
a.insportline-btn--EU { background-color: var(--ins-eu-container) !important; }

a.insportline-btn.ins-clicking .ins-main,
a.insportline-btn.ins-clicking .ins-price {
  opacity: .28 !important;
  pointer-events: none !important;
}
a.insportline-btn.ins-clicking::before {
  content: '' !important;
  position: absolute !important;
  width: 20px !important;
  height: 20px !important;
  border: 2.5px solid rgba(255,255,255,.3) !important;
  border-top-color: #fff !important;
  border-radius: 50% !important;
  animation: ins-spin .55s linear infinite !important;
  pointer-events: none !important;
}
@keyframes ins-spin { to { transform: rotate(360deg); } }

.ins-ripple {
  position: absolute;
  border-radius: 50%;
  transform: scale(0);
  -webkit-transform: scale(0);
  opacity: .20;
  pointer-events: none;
  inset: 0;
  background: #fff;
  animation: ins-ripple .45s ease-out;
}
@keyframes ins-ripple {
  to { transform: scale(2.8); -webkit-transform: scale(2.8); opacity: 0; }
}

/* Material 3 Expressive Context Menu */
.ins-context-menu {
  position: fixed;
  background: #211f26;
  color: #e6e1e5;
  border-radius: 12px;
  padding: 8px 0;
  min-width: 210px;
  box-shadow: 0 4px 20px rgba(0,0,0,.5);
  z-index: 2147483647;
  font-family: var(--ins-font);
  font-size: 14px;
  transform: scale(0.92);
  opacity: 0;
  pointer-events: none;
  transition: transform 0.15s cubic-bezier(0, 0, 0.2, 1), opacity 0.15s cubic-bezier(0, 0, 0.2, 1);
  -webkit-transition: -webkit-transform 0.15s cubic-bezier(0, 0, 0.2, 1), opacity 0.15s cubic-bezier(0, 0, 0.2, 1);
  border: 1px solid rgba(255,255,255,.08);
}
.ins-context-menu.ins-active {
  transform: scale(1);
  opacity: 1;
  pointer-events: auto;
}
.ins-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  font-weight: 500;
  transition: background 0.15s ease;
}
.ins-menu-item:hover {
  background: rgba(255, 255, 255, .08);
}
.ins-menu-item:active {
  background: rgba(255, 255, 255, .16);
}
.ins-menu-divider {
  height: 1px;
  background: rgba(255, 255, 255, .12);
  margin: 6px 0;
}
.ins-menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
}

@media (max-width: 560px) {
  .insportline-switcher-container {
    position: fixed !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    -webkit-transform: translateX(-50%) !important;
    bottom: max(18px, env(safe-area-inset-bottom)) !important;
    background: rgba(24, 23, 27, .88) !important;
    backdrop-filter: blur(16px) saturate(160%) !important;
    -webkit-backdrop-filter: blur(16px) saturate(160%) !important;
    padding: 10px 14px !important;
    border-radius: 999px !important;
    box-shadow: 0 14px 44px rgba(0,0,0,.48) !important;
    border: 1px solid rgba(255,255,255,.09) !important;
    display: flex !important;
    max-width: 92vw !important;
    margin-left: 0 !important;
    gap: 8px !important;
  }
}
  `;
  document.head.appendChild(style);

  // ============================ Helpers =============================
  function executeRedirect(targetUrl, openInNewTab = false) {
    if (openInNewTab) {
      window.open(targetUrl, '_blank', 'noopener');
    } else {
      window.location.href = targetUrl;
    }
  }

  function buildDestUrl(targetHost) {
    const u = new URL(window.location.href);
    u.host = targetHost;
    u.port = '';
    return u.toString();
  }

  // ============================ Porównanie cen =============================
  const PRICE_SELECTORS = [
    '[itemprop="price"]',
    '.product-detail .price',
    '.detail-price .price',
    '.detail-price',
    '.product-price .price',
    '.product-price',
    '.price-final',
    '.price-box .price',
    '.product__price',
    '.price',
  ];

  const CURRENCY_SUFFIX = {
    'e-insportline.pl': 'zł',
    'insportline.cz': 'Kč',
    'insportline.eu': '€',
  };

  const LOCALE = {
    'e-insportline.pl': 'pl-PL',
    'insportline.cz': 'cs-CZ',
    'insportline.eu': 'de-DE',
  };

  function parseRawPrice(raw) {
    if (!raw) return NaN;
    const s = raw.replace(/\s/g, '');
    if (s.includes(',') && s.includes('.')) {
      const normalized = s.lastIndexOf(',') > s.lastIndexOf('.')
        ? s.replace(/\./g, '').replace(',', '.')
        : s.replace(/,/g, '');
      return parseFloat(normalized);
    }
    if (s.includes(',')) {
      const parts = s.split(',');
      return parts[parts.length - 1].length <= 2
        ? parseFloat(s.replace(',', '.'))
        : parseFloat(s.replace(',', ''));
    }
    return parseFloat(s);
  }

  function extractPriceFromDoc(doc) {
    for (const sel of PRICE_SELECTORS) {
      const el = doc.querySelector(sel);
      if (!el) continue;

      const content = el.getAttribute('content');
      if (content) {
        const num = parseFloat(content);
        if (!isNaN(num) && num > 0) return num;
      }

      const text = (el.textContent || '').replace(/[^\d,.\s]/g, '').trim();
      const num = parseRawPrice(text);
      if (!isNaN(num) && num > 0) return num;
    }
    return null;
  }

  function isProductPage() {
    for (const sel of PRICE_SELECTORS) {
      const el = document.querySelector(sel);
      if (!el) continue;
      const content = el.getAttribute('content') || el.textContent || '';
      const num = parseRawPrice(content.replace(/[^\d,.\s]/g, '').trim());
      if (!isNaN(num) && num > 0) return true;
    }
    return false;
  }

  function formatPrice(num, targetHost) {
    const locale = LOCALE[targetHost] || 'pl-PL';
    const suffix = CURRENCY_SUFFIX[targetHost] || '';
    const formatted = num.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${formatted} ${suffix}`;
  }

  function fetchPriceForHost(targetHost, onDone) {
    const cacheKey = `ins:price:${targetHost}:${window.location.pathname}`;
    try {
      const hit = sessionStorage.getItem(cacheKey);
      if (hit !== null) {
        onDone(hit === '' ? null : parseFloat(hit));
        return;
      }
    } catch { /* sessionStorage zablokowany */ }

    GM_xmlhttpRequest({
      method: 'GET',
      url: buildDestUrl(targetHost),
      onload(res) {
        if (res.status !== 200) { onDone(null); return; }
        const parser = new DOMParser();
        const doc = parser.parseFromString(res.responseText, 'text/html');
        const price = extractPriceFromDoc(doc);
        try {
          sessionStorage.setItem(cacheKey, price === null ? '' : String(price));
        } catch { /* cicho */ }
        onDone(price);
      },
      onerror() { onDone(null); },
    });
  }

  // ============================ Dokładne Flagi 3:2 =============================
  function svgFlag(label) {
    if (label === 'PL') {
      return `<svg viewBox="0 0 30 20" class="ins-icon" aria-hidden="true"><rect width="30" height="10" fill="#fff"/><rect width="30" height="10" y="10" fill="#dc143c"/></svg>`;
    }
    if (label === 'CZ') {
      return `<svg viewBox="0 0 30 20" class="ins-icon" aria-hidden="true"><rect width="30" height="10" fill="#fff"/><rect width="30" height="10" y="10" fill="#d7141a"/><path d="M0,0 L15,10 L0,20 Z" fill="#11457e"/></svg>`;
    }
    return `<svg viewBox="0 0 30 20" class="ins-icon" aria-hidden="true"><rect width="30" height="20" fill="#003399"/><g fill="#ffcc00">${Array.from({ length: 12 }, (_, i) => {
      const angle = (i * 30 * Math.PI) / 180;
      const cx = 15 + Math.sin(angle) * 6.66;
      const cy = 10 - Math.cos(angle) * 6.66;
      return `<path d="M${cx},${cy-0.6} L${cx+0.17},${cy-0.18} L${cx+0.62},${cy-0.15} L${cx+0.28},${cy+0.16} L${cx+0.39},${cy+0.6} L${cx},${cy+0.32} L${cx-0.39},${cy+0.6} L${cx-0.28},${cy+0.16} L${cx-0.62},${cy-0.15} L${cx-0.17},${cy-0.18} Z"/>`;
    }).join('')}</g></svg>`;
  }

  // ============================ Menu Kontekstowe =============================
  let contextMenuEl = null;

  function createContextMenu() {
    if (contextMenuEl) return contextMenuEl;

    const menu = document.createElement('div');
    menu.className = 'ins-context-menu';
    document.body.appendChild(menu);
    contextMenuEl = menu;

    document.addEventListener('click', () => menu.classList.remove('ins-active'));
    window.addEventListener('blur', () => menu.classList.remove('ins-active'));
    window.addEventListener('scroll', () => menu.classList.remove('ins-active'), { passive: true });

    return menu;
  }

  function showMenu(e, label, targetHost) {
    e.preventDefault();
    const menu = createContextMenu();
    menu.innerHTML = '';

    const currentDest = buildDestUrl(targetHost);

    menu.style.left = `${e.clientX}px`;
    menu.style.top = `${e.clientY}px`;
    
    setTimeout(() => {
      const rect = menu.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        menu.style.left = `${e.clientX - rect.width}px`;
      }
      if (rect.bottom > window.innerHeight) {
        menu.style.top = `${e.clientY - rect.height}px`;
      }
      menu.classList.add('ins-active');
    }, 10);

    // Opcja 1: Otwórz tę domenę (nowa karta)
    const itemNewTab = document.createElement('div');
    itemNewTab.className = 'ins-menu-item';
    itemNewTab.innerHTML = `<span class="ins-menu-icon">🡥</span> <span>Otwórz ${label} w nowej karcie</span>`;
    itemNewTab.addEventListener('click', () => executeRedirect(currentDest, true));
    menu.appendChild(itemNewTab);

    // Opcja 2: Otwórz WSZYSTKIE 3 domeny na raz (Bypass blokady pop-upów)
    const itemAll = document.createElement('div');
    itemAll.className = 'ins-menu-item';
    itemAll.innerHTML = `<span class="ins-menu-icon">🗂️</span> <span>Otwórz wszystkie 3 strony</span>`;
    itemAll.addEventListener('click', () => {
      let openedFirst = false;

      allDomains.forEach(d => {
        if (d.host !== host) {
          const url = buildDestUrl(d.host);
          
          if (!openedFirst) {
            window.open(url, '_blank', 'noopener');
            openedFirst = true;
          } else {
            const fakeLink = document.createElement('a');
            fakeLink.href = url;
            fakeLink.target = '_blank';
            fakeLink.rel = 'noopener';
            document.body.appendChild(fakeLink);
            fakeLink.click();
            fakeLink.remove();
          }
        }
      });
    });
    menu.appendChild(itemAll);

    const divider = document.createElement('div');
    divider.className = 'ins-menu-divider';
    menu.appendChild(divider);

    // Opcja 3: Kopiuj czysty link
    const itemCopy = document.createElement('div');
    itemCopy.className = 'ins-menu-item';
    itemCopy.innerHTML = `<span class="ins-menu-icon">📋</span> <span>Kopiuj link do wersji ${label}</span>`;
    itemCopy.addEventListener('click', () => {
      navigator.clipboard.writeText(currentDest).catch(() => {});
    });
    menu.appendChild(itemCopy);
  }

  // ============================ Ripple =============================
  function addRipple(el) {
    el.addEventListener('click', () => {
      const r = document.createElement('span');
      r.className = 'ins-ripple';
      el.appendChild(r);
      r.addEventListener('animationend', () => r.remove());
    });
  }

  // ============================ Tworzenie linku =============================
  function createLink(label, targetHost) {
    const link = document.createElement('a');
    link.className = `insportline-btn insportline-btn--${label}`;
    link.href = buildDestUrl(targetHost);
    link.setAttribute('role', 'button');
    link.setAttribute('title', label === 'PL' ? 'Polska' : label === 'CZ' ? 'Czechy' : 'Unia Europejska');

    const main = document.createElement('span');
    main.className = 'ins-main';
    main.innerHTML = svgFlag(label) + `<span class="ins-label">${label}</span>`;
    link.appendChild(main);

    if (isProductPage()) {
      const priceBadge = document.createElement('span');
      priceBadge.className = 'ins-price ins-price--loading';
      priceBadge.textContent = '···';
      link.appendChild(priceBadge);

      setTimeout(() => {
        fetchPriceForHost(targetHost, (price) => {
          if (price !== null) {
            priceBadge.textContent = formatPrice(price, targetHost);
            priceBadge.className = 'ins-price ins-price--loaded';
          } else {
            priceBadge.textContent = '—';
            priceBadge.className = 'ins-price ins-price--unavailable';
          }
        });
      }, 400);
    }

    link.addEventListener('click', (e) => {
      e.preventDefault();
      if (link.classList.contains('ins-clicking')) return;
      link.classList.add('ins-clicking');
      setTimeout(() => executeRedirect(link.href, false), 350);
    });

    link.addEventListener('auxclick', (e) => {
      if (e.button === 1) {
        e.preventDefault();
        executeRedirect(link.href, true);
      }
    });

    link.addEventListener('contextmenu', (e) => {
      showMenu(e, label, targetHost);
    });

    addRipple(link);
    return link;
  }

  // ============================ Montowanie =============================
  const SENTINEL_ID = 'insportline-switcher-mounted';

  function mount(containerParent, afterNode) {
    if (!containerParent || document.getElementById(SENTINEL_ID)) return;

    const container = document.createElement('div');
    container.className = 'insportline-switcher-container';
    container.id = SENTINEL_ID;
    container.setAttribute('role', 'toolbar');
    container.setAttribute('aria-label', 'Przełącz wersję językową');

    const targets = domainMappings[host] || [];
    targets.forEach(({ label, host: targetHost }) => {
      container.appendChild(createLink(label, targetHost));
    });

    if (afterNode && afterNode.parentNode) {
      afterNode.parentNode.insertBefore(container, afterNode.nextSibling);
    } else {
      containerParent.appendChild(container);
    }
  }

  function findAnchorNode() {
    return (
      document.querySelector('.navbar__logo') ||
      document.querySelector('header .logo, .site-header .logo, .navbar-brand') ||
      document.querySelector('header, .site-header, .navbar, .topbar')
    );
  }

  (function tryMount() {
    const anchor = findAnchorNode();
    if (anchor) mount(anchor.parentElement || anchor, anchor);
  })();

  const observerRoot = document.querySelector('header, .site-header, .navbar, nav') || document.documentElement;
  const observer = new MutationObserver(() => {
    if (!document.getElementById(SENTINEL_ID)) {
      const anchor = findAnchorNode();
      if (anchor) mount(anchor.parentElement || anchor, anchor);
    }
  });
  observer.observe(observerRoot, { childList: true, subtree: true });

  // ============================ Skróty klawiszowe =============================
  window.addEventListener('keydown', (e) => {
    if (!e.altKey) return;
    const map = { '1': 'PL', '2': 'CZ', '3': 'EU' };
    const label = map[e.key];
    if (!label) return;

    const btn = document.querySelector(`#${SENTINEL_ID} a.insportline-btn--${label}`);
    if (!btn) return;

    e.preventDefault();
    executeRedirect(btn.href, e.shiftKey);
  });
})();
