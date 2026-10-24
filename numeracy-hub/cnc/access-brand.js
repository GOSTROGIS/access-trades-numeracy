/* Official programme identity; no external services or fonts are required. */
(() => {
  'use strict';
  const brand = document.querySelector('.topbar .brand');
  if (brand) {
    brand.classList.add('cnc-brand');
    const badge = document.createElement('img');
    badge.className = 'cnc-badge';
    badge.src = '../../brand/is4s-badge.svg';
    badge.alt = 'ACCESS Indigenous Skills4Success';
    badge.width = 120; badge.height = 110;
    const copy = document.createElement('div'); copy.className = 'cnc-brand-copy';
    const title = document.createElement('h1'); title.textContent = 'CNC workshop';
    const subtitle = document.createElement('small'); subtitle.textContent = '3D mill · 3D lathe · program builder';
    const home = document.createElement('a'); home.className = 'cnc-home';
    home.href = '../index.html#cnc'; home.target = '_top'; home.textContent = 'Numeracy Hub';
    copy.append(title, subtitle, home); brand.replaceChildren(badge, copy);
  }
  document.title = 'CNC workshop · Numeracy Hub';
  if (!document.querySelector('link[rel="icon"]')) {
    const icon = document.createElement('link'); icon.rel = 'icon';
    icon.href = '../../brand/access-symbol.svg'; icon.type = 'image/svg+xml';
    document.head.append(icon);
  }
  const help = document.getElementById('btn-help');
  if (help) { help.setAttribute('aria-label', 'Simulator help'); help.title = 'Simulator help'; }
  const view = document.getElementById('viewport');
  if (view) {
    view.setAttribute('tabindex', '-1');
    const skip = document.createElement('a'); skip.href = '#viewport';
    skip.className = 'cnc-skip'; skip.textContent = 'Skip to 3D machine';
    document.body.prepend(skip);
  }
})();
