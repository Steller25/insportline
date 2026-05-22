// ==UserScript==
// @name         Redirect between insportline domains (Material 3 Expressive)
// @namespace    https://github.com/Steller25/insportline
// @version      3.0.2
// @description  Material 3 Expressive style switcher for domain redirect!
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
      const CURRENT = (typeof GM_info !== 'undefined' && GM_info && GM_info.script && GM_info.script.version) || '3.0.2';
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

  // ============================ Switcher właściwy =============================
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

  if (!domainMappings[host]) return;

  // ============================ CSS (Material 3 Expressive) =============================
  const style = document.createElement('style');
  style.textContent = `
:root {
  --ins-btn-radius: 999px;
  --ins-gap: 12px;
  --ins-pad-y: 10px;
  --ins-pad-x: 22px;
  --ins-font: "Roboto", system-ui, -apple-system, sans-serif;

  /* Expressive Vibrancy */
  --ins-pl-base: #ffb4ab; --ins-pl-text: #ffffff; --ins-pl-container: #ba1a1a;
  --ins-cz-base: #bac3ff; --ins-cz-text: #ffffff; --ins-cz-container: #0041c4;
  --ins-eu-base: #b4f1aa; --ins-eu-text: #ffffff; --ins-eu-container: #006e1c;
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
  font-size: 14px !important;
  font-weight: 800 !important;
  text-transform: uppercase !important;
  letter-spacing: .7px !important;
  border: none !important;
  border-radius: var(--ins-btn-radius) !important;
  padding: var(--ins-pad-y) var(--ins-pad-x) !important;
  cursor: pointer !important;
  text-decoration: none !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  box-shadow: 0 4px 14px rgba(0,0,0,.25) !important;
  transition: all .2s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
  user-select: none !important;
  outline: none !important;
  line-height: 1 !important;
  white-space: nowrap !important;
  position: relative !important;
  overflow: hidden !important;
  min-height: 44px !important;
  gap: 8px !important;
}

.ins-icon {
  display: inline-block !important;
  width: 20px !important;
  height: 20px !important;
  flex: 0 0 20px !important;
  border-radius: 50% !important;
}

a.insportline-btn:hover {
  transform: scale(1.08) translateY(-2px) !important;
  box-shadow: 0 8px 24px rgba(0,0,0,.35) !important;
}

a.insportline-btn:active {
  transform: scale(0.92) translateY(0) !important;
}

a.insportline-btn--PL { background-color: var(--ins-pl-container) !important; color: var(--ins-pl-text) !important; }
a.insportline-btn--CZ { background-color: var(--ins-cz-container) !important; color: var(--ins-cz-text) !important; }
a.insportline-btn--EU { background-color: var(--ins-eu-container) !important; color: var(--ins-eu-text) !important; }

.ins-ripple {
  position: absolute;
  border-radius: 50%;
  transform: scale(0);
  opacity: .25;
  pointer-events: none;
  inset: 0;
  background: #fff;
  animation: ins-ripple .4s ease-out;
}
@keyframes ins-ripple {
  to { transform: scale(2.5); opacity: 0; }
}

@media (max-width: 560px) {
  .insportline-switcher-container {
    position: fixed !important; left: 50% !important; transform: translateX(-50%) !important;
    bottom: max(16px, env(safe-area-inset-bottom)) !important;
    background: #1c1b1f !important; padding: 12px !important; border-radius: 999px !important;
    box-shadow: 0 12px 36px rgba(0,0,0,.4) !important;
    display: flex !important; max-width: 92vw !important; margin-left: 0 !important;
  }
}
  `;
  document.head.appendChild(style);

  // ============================ Przekierowanie =============================
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

  // ============================ SVG Flags =============================
  function svgFlag(label) {
    if (label === 'PL') {
      return `<svg viewBox="0 0 3 2" class="ins-icon" aria-hidden="true"><rect width="3" height="1" y="0" fill="#fff"/><rect width="3" height="1" y="1" fill="#DC143C"/></svg>`;
    }
    if (label === 'CZ') {
      return `<svg viewBox="0 0 3 2" class="ins-icon" aria-hidden="true"><rect width="3" height="1" y="0" fill="#fff"/><rect width="3" height="1" y="1" fill="#D7141A"/><polygon points="0,0 1.2,1 0,2" fill="#11457E"/></svg>`;
    }
    return `<svg viewBox="0 0 24 24" class="ins-icon" aria-hidden="true"><rect width="24" height="24" fill="#003399"/><g fill="#FFCC00">${Array.from({length:12},(_,i)=>{const a=((i*30)-90)*Math.PI/180, r=8, cx=12+Math.cos(a)*r, cy=12+Math.sin(a)*r; return `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="1.1"/>`;}).join('')}</g></svg>`;
  }

  function addRipple(el) {
    el.addEventListener('click', () => {
      const r = document.createElement('span');
      r.className = 'ins-ripple';
      el.appendChild(r);
      r.addEventListener('animationend', () => r.remove());
    });
  }

  // ============================ Tworzenie linków =============================
  function createLink(label, targetHost) {
    const link = document.createElement('a');
    link.innerHTML = svgFlag(label) + `<span class="ins-text">${label}</span>`;
    link.className = `insportline-btn insportline-btn--${label}`;
    link.href = buildDestUrl(targetHost);
    link.setAttribute('role', 'button');
    link.setAttribute('title', label === 'PL' ? 'Polska' : (label === 'CZ' ? 'Czechy' : 'Unia Europejska'));

    link.addEventListener('click', (e) => {
      e.preventDefault();
      executeRedirect(link.href, false);
    });

    link.addEventListener('auxclick', (e) => {
      if (e.button === 1) {
        e.preventDefault();
        executeRedirect(link.href, true);
      }
    });

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

  const observer = new MutationObserver(() => {
    if (!document.getElementById(SENTINEL_ID)) {
      const anchor = findAnchorNode();
      if (anchor) mount(anchor.parentElement || anchor, anchor);
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // ============================ Skróty klawiszowe =============================
  window.addEventListener('keydown', (e) => {
    if (!e.altKey) return;
    const map = { '1':'PL', '2':'CZ', '3':'EU' };
    const label = map[e.key];
    if (!label) return;

    const btn = document.querySelector(`#${SENTINEL_ID} a.insportline-btn--${label}`);
    if (!btn) return;

    e.preventDefault();
    executeRedirect(btn.href, e.shiftKey);
  });
})();
