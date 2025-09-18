// ==UserScript==
// @name         Redirect between insportline domains (Material 3 look) + middle-click
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  Material 3-style switcher buttons (as <a> links) for switching insportline domains with preserved path; supports middle-click new tab.
// @author
// @match        https://www.e-insportline.pl/*
// @match        https://www.insportline.cz/*
// @match        https://www.insportline.eu/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=e-insportline.pl
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    const domainMappings = {
        'www.e-insportline.pl': [
            { label: 'CZ', redirectDomain: 'www.insportline.cz' },
            { label: 'EU', redirectDomain: 'www.insportline.eu' }
        ],
        'www.insportline.cz': [
            { label: 'PL', redirectDomain: 'www.e-insportline.pl' },
            { label: 'EU', redirectDomain: 'www.insportline.eu' }
        ],
        'www.insportline.eu': [
            { label: 'PL', redirectDomain: 'www.e-insportline.pl' },
            { label: 'CZ', redirectDomain: 'www.insportline.cz' }
        ]
    };

    const materialColors = {
        PL: { base: '#E53935', hover: '#D32F2F' },  // red tone
        CZ: { base: '#1E88E5', hover: '#1565C0' },  // blue tone
        EU: { base: '#43A047', hover: '#2E7D32' }   // green tone
    };

    const currentDomain = window.location.hostname;
    if (!(currentDomain in domainMappings)) {
        console.error('Nieobsługiwana domena:', currentDomain);
        return;
    }

    // Style pod <a> wyglądające jak przyciski (Material 3)
    const style = document.createElement('style');
    style.textContent = `
        .insportline-switcher-container {
            display: inline-flex;
            align-items: center;
            gap: 12px;
            margin-left: 24px;
        }

        .insportline-btn {
            font-family: "Roboto", "Arial", sans-serif;
            font-size: 14px;
            font-weight: 500;
            letter-spacing: 0.1px;
            border: none;
            border-radius: 28px;
            padding: 10px 24px;
            color: white;
            cursor: pointer;
            text-decoration: none; /* dla <a> */
            display: inline-flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.2),
                        0px 1px 2px rgba(0, 0, 0, 0.14),
                        0px 2px 1px rgba(0, 0, 0, 0.12);
            transition: background-color 0.3s ease, box-shadow 0.2s ease;
            user-select: none;
        }

        .insportline-btn--PL { background-color: ${materialColors.PL.base}; }
        .insportline-btn--CZ { background-color: ${materialColors.CZ.base}; }
        .insportline-btn--EU { background-color: ${materialColors.EU.base}; }

        .insportline-btn--PL:hover { background-color: ${materialColors.PL.hover}; }
        .insportline-btn--CZ:hover { background-color: ${materialColors.CZ.hover}; }
        .insportline-btn--EU:hover { background-color: ${materialColors.EU.hover}; }

        .insportline-btn:focus-visible {
            outline: none;
            box-shadow: 0 0 0 3px rgba(100, 100, 255, 0.3);
        }
    `;
    document.head.appendChild(style);

    // Tworzenie linku zamiast przycisku — wspiera środkowy przycisk myszy
    function createLink(label, redirectDomain) {
        const link = document.createElement('a');
        link.textContent = label;
        link.className = `insportline-btn insportline-btn--${label}`;
        link.rel = 'noopener';
        link.target = '_self'; // lewy klik w tej samej karcie; middle/ctrl/cmd otwiera w nowej

        // Ustal docelowy URL (z zachowaniem ścieżki i parametrów)
        const newUrl = window.location.href.replace(window.location.hostname, redirectDomain);
        link.href = newUrl;

        // Fallback: jeśli middle-click nie zadziała domyślnie, otwórz ręcznie
        link.addEventListener('auxclick', (e) => {
            if (e.button === 1) { // środkowy przycisk
                e.preventDefault();
                window.open(newUrl, '_blank', 'noopener');
            }
        });

        return link;
    }

    // Szukanie navbaru/logo
    const navbarLogo = document.querySelector('.navbar__logo');
    if (navbarLogo) {
        const container = document.createElement('div');
        container.className = 'insportline-switcher-container';

        domainMappings[currentDomain].forEach(({ label, redirectDomain }) => {
            const link = createLink(label, redirectDomain);
            container.appendChild(link);
        });

        navbarLogo.parentNode.insertBefore(container, navbarLogo.nextSibling);
    } else {
        console.error('Nie znaleziono sekcji logo w navbarze.');
    }
})();
