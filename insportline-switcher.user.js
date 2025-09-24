// ==UserScript==
// @name         Redirect between insportline domains (Material 3 look) + middle-click + responsive + icons/ripple/shortcuts
// @namespace    https://github.com/Steller25/insportline
// @version      2.6.0
// @description  Material 3-style switcher links to jump between insportline domains, preserving path/query/hash; supports middle-click/new tab; robust on SPAs; optional update bubble; responsive mobile dock; inline SVG flags; ripple; keyboard shortcuts; improved accessibility & focus.
// @author       Steller25
// @match        https://www.e-insportline.pl/*
// @match        https://e-insportline.pl/*
// @match        https://www.insportline.cz/*
// @match        https://insportline.cz/*
// @match        https://www.insportline.eu/*
// @match        https://insportline.eu/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=e-insportline.pl
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// @updateURL    https://raw.githubusercontent.com/Steller25/insportline/main/insportline-switcher.user.js
// @downloadURL  https://raw.githubusercontent.com/Steller25/insportline/main/insportline-switcher.user.js
// @homepageURL  https://github.com/Steller25/insportline
// @supportURL   https://github.com/Steller25/insportline/issues
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  // ============= Optional: delikatne przypomnienie o aktualizacji =============
  (function checkForHintedUpdate() {
    try {
      const CURRENT =
        (typeof GM_info !== 'undefined' && GM_info && GM_info.script && GM_info.script.version) ||
        '2.6.0'; // fallback zgodny z @version

      const LAST_CHECK_KEY = 'ins-switcher-last-check';
      const now = Date.now();
      const last = Number(localStorage.getItem(LAST_CHECK_KEY) || 0);
      const INTERVAL = 24 * 60 * 60 * 1000; // 1 dzień

      if (now - last < INTERVAL) return; // ogranicz częstotliwość
      localStorage.setItem(LAST_CHECK_KEY, String(now));

      const INFO_URL = 'https://raw.githubusercontent.com/Steller25/insportline/main/latest.json';

      GM_xmlhttpRequest({
        method: 'GET',
        url: INFO_URL,
        headers: { 'Cache-Control': 'no-cache' },
        onload: (res) => {
          try {
            if (!res.responseText) return;
            const info = JSON.parse(res.responseText);
            if (!info || !info.version || !info.installUrl) return;

            if (isNewer(info.version, CURRENT)) {
              showUpdateBubble(info.version, info.installUrl, info.notes);
            }
          } catch (e) {
            // cicho
          }
        },
      });

      function isNewer(a, b) {
        const pa = String(a).split('.').map(Number);
        const pb = String(b).split('.').map(Number);
        for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
          const da = pa[i] || 0, db = pb[i] || 0;
          if (da > db) return true;
          if (da < db) return false;
        }
        return false;
      }

      function showUpdateBubble(ver, url, notes) {
        const wrap = document.createElement('div');
        wrap.setAttribute('role', 'dialog');
        wrap.setAttribute('aria-live', 'polite');
        Object.assign(wrap.style, {
          position: 'fixed',
          right: '16px',
          bottom: '16px',
          maxWidth: '320px',
          zIndex: 2147483647,
          background: '#1f1f1f',
          color: '#fff',
          borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0,0,0,.35)',
          padding: '12px 14px',
          fontFamily: 'system-ui, Arial, sans-serif',
          lineHeight: '1.3',
        });

        const title = document.createElement('div');
        title.textContent = `Nowa wersja: ${ver}`;
        Object.assign(title.style, { fontWeight: '600', marginBottom: '6px' });

        const msg = document.createElement('div');
        msg.textContent = notes || 'Kliknij, aby zainstalować aktualizację.';
        Object.assign(msg.style, { marginBottom: '10px', opacity: '.95' });

        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = 'Zainstaluj';
        Object.assign(link.style, {
          display: 'inline-block',
          textDecoration: 'none',
          padding: '8px 14px',
          borderRadius: '999px',
          background: '#4CAF50',
          color: '#fff',
          fontWeight: 600,
        });

        const close = document.createElement('button');
        close.type = 'button';
        close.ariaLabel = 'Zamknij przypomnienie';
        close.textContent = '×';
        Object.assign(close.style, {
          position: 'absolute',
          right: '8px',
          top: '4px',
          width: '28px',
          height: '28px',
          border: 'none',
          borderRadius: '50%',
          background: 'transparent',
          color: '#fff',
          fontSize: '18px',
          cursor: 'pointer',
        });
        close.addEventListener('click', () => wrap.remove());

        wrap.append(title, msg, link, close);
        document.body.appendChild(wrap);

        // Autodestrukcja po 20s
        setTimeout(() => wrap.remove(), 20000);
      }
    } catch (_) {}
  })();

  // ============================ Switcher właściwy =============================
  // Normalize hostname (strip leading "www.")
  const rawHost = window.location.hostname;
  const host = rawHost.replace(/^www\./, '');

  const domainMappings = {
    'e-insportline.pl': [
      { label: 'CZ', host: 'insportline.cz' },
      { label: 'EU', host: 'insportline.eu' },
    ],
    'insportline.cz': [
      { label: 'PL', host: 'e-insportline.pl' },
      { label: 'EU', host: 'insportline.eu' },
    ],
    'insportline.eu': [
      { label: 'PL', host: 'e-insportline.pl' },
      { label: 'CZ', host: 'insportline.cz' },
    ],
  };

  if (!domainMappings[host]) {
    console.error('[insportline-switcher] Unsupported host:', host);
    return;
  }

  // ============================ CSS =============================
  const style = document.createElement('style');
  style.textContent = `
:root {
  --ins-btn-radius: 28px;
  --ins-gap: 12px;
  --ins-pad-y: 10px;
  --ins-pad-x: 24px;
  --ins-focus-ring: 3px;
  --ins-font: "Roboto", "Arial", system-ui, sans-serif;

  --ins-pl-base: #E53935; --ins-pl-hover: #D32F2F;
  --ins-cz-base: #1E88E5; --ins-cz-hover: #1565C0;
  --ins-eu-base: #43A047; --ins-eu-hover: #2E7D32;
  --ins-focus: 100, 100, 255;
}

.insportline-switcher-container {
  display: inline-flex;
  align-items: center;
  gap: var(--ins-gap);
  margin-left: 24px;
}

a.insportline-btn {
  font-family: var(--ins-font);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: .1px;
  border: none;
  border-radius: var(--ins-btn-radius);
  padding: var(--ins-pad-y) var(--ins-pad-x);
  color: #fff;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 1px 3px rgba(0,0,0,.2),
    0 1px 2px rgba(0,0,0,.14),
    0 2px 1px rgba(0,0,0,.12);
  transition: background-color .2s ease, box-shadow .2s ease, transform .02s ease;
  user-select: none;
  outline: none;
  line-height: 1;
  white-space: nowrap;

  /* >>> DODATKI: lepsza dotykowość, ripple i ikony <<< */
  position: relative;           /* ripple container */
  overflow: hidden;             /* clip ripple */
  min-height: 44px;             /* target dotykowy */
  gap: 8px;                     /* odstęp ikona-tekst */
}

/* Ikona (SVG) po lewej */
.ins-icon {
  display: inline-block;
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
}

/* Ripple */
.ins-ripple {
  position: absolute;
  border-radius: 50%;
  transform: scale(0);
  opacity: .2;
  pointer-events: none;
  inset: 0;                     /* pełnoekranowy ripple – lekki i bez obliczeń */
  background: #fff;
  animation: ins-ripple .35s ease-out;
}
@keyframes ins-ripple {
  from { transform: scale(0); opacity: .25; }
  to   { transform: scale(1); opacity: 0; }
}

a.insportline-btn:active { transform: translateY(1px); }

a.insportline-btn--PL { background-color: var(--ins-pl-base); }
a.insportline-btn--PL:hover { background-color: var(--ins-pl-hover); }
a.insportline-btn--CZ { background-color: var(--ins-cz-base); }
a.insportline-btn--CZ:hover { background-color: var(--ins-cz-hover); }
a.insportline-btn--EU { background-color: var(--ins-eu-base); }
a.insportline-btn--EU:hover { background-color: var(--ins-eu-hover); }

/* Mocniejszy focus (kontrast AA) */
a.insportline-btn:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 var(--ins-focus-ring) rgba(255,255,255,.85),
    0 2px 6px rgba(0,0,0,.25);
}

/* Hover/active – subtelny „elevation step” */
a.insportline-btn:hover {
  transform: translateY(-1px);
  box-shadow:
    0 6px 16px rgba(0,0,0,.2),
    0 2px 4px rgba(0,0,0,.18);
}
a.insportline-btn:active { transform: translateY(0); }

/* Light/Dark (prefers-color-scheme) */
@media (prefers-color-scheme: light) {
  .insportline-switcher-container { /* kolory brandów bez zmian */ }
}
@media (prefers-color-scheme: dark) {
  .insportline-switcher-container { filter: none; }
}

/* --- Responsywność --- */
@media (max-width: 1024px) {
  :root {
    --ins-gap: 10px;
    --ins-pad-y: 9px;
    --ins-pad-x: 20px;
  }
  a.insportline-btn { font-size: 13.5px; }
  .insportline-switcher-container { margin-left: 16px; }
}

@media (max-width: 760px) {
  :root {
    --ins-gap: 10px;
    --ins-pad-y: 8px;
    --ins-pad-x: 18px;
  }
  a.insportline-btn { font-size: 13px; }
  .insportline-switcher-container { margin-left: 12px; }
}

/* Na bardzo małych ekranach – pływający pasek u dołu z przewijaniem poziomym */
@media (max-width: 560px) {
  .insportline-switcher-container {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: max(10px, env(safe-area-inset-bottom));
    background: color-mix(in srgb, #1f1f1f 85%, transparent);
    padding: 8px 10px;
    border-radius: 999px;
    z-index: 2147483647;
    gap: 8px;
    box-shadow:
      0 8px 30px rgba(0,0,0,.35),
      0 2px 8px rgba(0,0,0,.2);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);

    display: flex;
    overflow-x: auto;
    overflow-y: hidden;
    max-width: min(96vw, 640px);
    scrollbar-width: none; /* Firefox */
  }
  .insportline-switcher-container::-webkit-scrollbar { display: none; } /* WebKit */

  a.insportline-btn {
    padding: 8px 12px;
    font-size: 13px;
    gap: 6px; /* zmniejszony odstęp ikony */
  }

  /* Opcjonalny „oddech” u dołu, by pasek nie nachodził na CTA strony */
  body { padding-bottom: max(0px, env(safe-area-inset-bottom)); }
}

@media (prefers-reduced-motion: reduce) {
  a.insportline-btn { transition: none; }
}
  `;
  document.head.appendChild(style);

  function buildDestUrl(targetHost) {
    const u = new URL(window.location.href);
    u.host = targetHost;
    u.port = '';
    return u.toString();
  }

  // ============================ Ikony + Ripple =============================
  // Proste, lekkie flagi w SVG (inline). Bez zewnętrznych assetów.
  function svgFlag(label) {
    // Minimalistyczne wersje: PL, CZ, EU
    if (label === 'PL') {
      return `<svg viewBox="0 0 3 2" class="ins-icon" aria-hidden="true">
        <rect width="3" height="1" y="0" fill="#fff"/>
        <rect width="3" height="1" y="1" fill="#DC143C"/>
      </svg>`;
    }
    if (label === 'CZ') {
      return `<svg viewBox="0 0 3 2" class="ins-icon" aria-hidden="true">
        <rect width="3" height="1" y="0" fill="#fff"/>
        <rect width="3" height="1" y="1" fill="#D7141A"/>
        <polygon points="0,0 1.2,1 0,2" fill="#11457E"/>
      </svg>`;
    }
    // EU – żółte gwiazdki na niebieskim (uproszczenie: kółeczka)
    return `<svg viewBox="0 0 24 24" class="ins-icon" aria-hidden="true">
      <rect width="24" height="24" fill="#003399"/>
      <g fill="#FFCC00">
        ${Array.from({length:12},(_,i)=>{
          const a = ((i*30)-90)*Math.PI/180, r=8, cx=12+Math.cos(a)*r, cy=12+Math.sin(a)*r;
          return `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="1.1"/>`;
        }).join('')}
      </g>
    </svg>`;
  }

  // Ripple – krótki efekt „fali” na interakcję
  function addRipple(el) {
    const spawn = () => {
      const r = document.createElement('span');
      r.className = 'ins-ripple';
      el.appendChild(r);
      r.addEventListener('animationend', () => r.remove());
    };
    el.addEventListener('click', spawn);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') spawn();
    });
  }

  // ============================ Tworzenie linków =============================
  function createLink(label, targetHost) {
    const link = document.createElement('a');
    link.innerHTML = svgFlag(label) + `<span class="ins-text">${label}</span>`;
    link.className = `insportline-btn insportline-btn--${label}`;
    link.href = buildDestUrl(targetHost);
    link.target = '_self';
    link.rel = 'noopener';
    link.setAttribute('role', 'button');
    link.setAttribute('title', label === 'PL' ? 'Polska' : (label === 'CZ' ? 'Czechy' : 'Unia Europejska'));
    link.setAttribute('aria-label', `Przełącz na domenę ${label}`);
    link.setAttribute('aria-keyshortcuts', label === 'PL' ? 'Alt+1' : (label === 'CZ' ? 'Alt+2' : 'Alt+3'));

    // Middle-click/new tab
    link.addEventListener('auxclick', (e) => {
      if (e.button === 1) {
        e.preventDefault();
        window.open(link.href, '_blank', 'noopener');
      }
    });

    // Ripple
    addRipple(link);
    return link;
  }

  const SENTINEL_ID = 'insportline-switcher-mounted';

  function mount(containerParent, afterNode) {
    if (!containerParent || document.getElementById(SENTINEL_ID)) return;

    const container = document.createElement('div');
    container.className = 'insportline-switcher-container';
    container.id = SENTINEL_ID;
    container.setAttribute('role', 'toolbar');
    container.setAttribute('aria-label', 'Przełączanie domen insportline');

    (domainMappings[host] || []).forEach(({ label, host: targetHost }) => {
      const a = createLink(label, targetHost);
      container.appendChild(a);
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
    if (anchor) {
      mount(anchor.parentElement || anchor, anchor);
      return true;
    }
    return false;
  })();

  const observer = new MutationObserver(() => {
    if (!document.getElementById(SENTINEL_ID)) {
      const anchor = findAnchorNode();
      if (anchor) mount(anchor.parentElement || anchor, anchor);
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  (function hookHistory() {
    const rerun = () => {
      const switcher = document.getElementById(SENTINEL_ID);
      if (switcher) {
        switcher.querySelectorAll('a.insportline-btn').forEach((a) => {
          const label = a.textContent.trim();
          const cfg = (domainMappings[host] || []).find((x) => x.label === label);
          if (cfg) a.href = buildDestUrl(cfg.host);
        });
      } else {
        const anchor = findAnchorNode();
        if (anchor) mount(anchor.parentElement || anchor, anchor);
      }
    };
    const wrap = (fnName) => {
      const orig = history[fnName];
      history[fnName] = function () {
        const res = orig.apply(this, arguments);
        setTimeout(rerun, 0);
        return res;
      };
    };
    wrap('pushState');
    wrap('replaceState');
    window.addEventListener('popstate', () => setTimeout(rerun, 0));
  })();

  // ============================ Skróty klawiszowe =============================
  // Skróty: Alt+1 (PL), Alt+2 (CZ), Alt+3 (EU).
  // Z Shift – otwórz w nowej karcie.
  window.addEventListener('keydown', (e) => {
    if (!e.altKey) return;
    const map = { '1':'PL', '2':'CZ', '3':'EU' };
    const label = map[e.key];
    if (!label) return;

    const btn = document.querySelector(`#${SENTINEL_ID} a.insportline-btn--${label}`);
    if (!btn) return;

    e.preventDefault();
    if (e.shiftKey) {
      window.open(btn.href, '_blank', 'noopener');
    } else {
      window.location.assign(btn.href);
    }
  });
})();
