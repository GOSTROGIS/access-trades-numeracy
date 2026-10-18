/* ACCESS Trades standalone calculators: page script. Runs after calc-kit.js (the same TI-30Xa, Sharp EL-531XT and
   HP-15C emulators as the Numeracy Hub). window.CALC_PAGE.model names the calculator of a single-model page.
   With no model (calculators.html) the switcher and the calculator's own menu choose it, saved per viewer in
   localStorage 'access-calc-model'. */
(function () {
  'use strict';
  /* after DOMContentLoaded, so the kit's own start-up (which leaves the popup unbuilt) has already run */
  function init() {
  var K = window.CalcKit, doc = document, cfg = window.CALC_PAGE || {};
  var STORE = 'access-calc-model';
  var fixed = cfg.model || null;
  var NAME = { ti30xa: 'TI-30Xa', el531xt: 'Sharp EL-531XT', hp15c: 'HP-15C' };

  /* a single-model page shows its own calculator and leaves the viewer's saved choice as it was */
  if (fixed) {
    var saved = null;
    try { saved = localStorage.getItem(STORE); } catch (e) { saved = null; }
    K.setModel(fixed);
    try {
      if (saved === null) localStorage.removeItem(STORE);
      else localStorage.setItem(STORE, saved);
    } catch (e) { /* storage blocked: nothing was saved */ }
  }

  /* the calculator, full size in the page (CalcKit standalone mode: no popup, no floating button) */
  var slot = doc.getElementById('calc-slot');
  K.mount({ standalone: true });
  function place() {
    var r = doc.getElementById('ti-pop');
    if (r && r.parentNode !== slot) slot.appendChild(r);
    doc.title = cfg.title || doc.title;
  }
  place();

  /* This page draws its own key blocks for each model, and its notes show chips for a fixed model. The kit's
     page layer (made for hub frames) would hand TI-30Xa token lists in the selected model's keys, so it is
     marked as present and left out. The chip colours it would add are in the page styles. */
  if (!window.CalcKitLayer) window.CalcKitLayer = { set: function () {}, model: function () { return K.getModel(); }, scan: function () {}, standalonePage: true };

  /* keys typed while a link, button or switch outside the calculator has focus belong to that control,
     the way the hub's calculator only takes keys aimed at it */
  Array.prototype.forEach.call(doc.querySelectorAll('[data-own-keys]'), function (el) {
    el.addEventListener('keydown', function (e) {
      if (e.target !== doc.body) e.stopPropagation();
    });
  });

  /* key chips inside the notes, always for the notes' own model */
  Array.prototype.forEach.call(doc.querySelectorAll('.kseq[data-seq]'), function (el) {
    el.innerHTML = K.chipsHtml(el.getAttribute('data-seq'), el.getAttribute('data-model'));
  });

  /* the screen each of those sequences ends on, from the same emulator */
  Array.prototype.forEach.call(doc.querySelectorAll('.kout[data-seq]'), function (el) {
    el.innerHTML = K.screenHtml(K.screen(el.getAttribute('data-seq'), el.getAttribute('data-model')));
  });

  /* worked examples: canonical TI-30Xa sequences, shown and played on the selected model */
  var EX = [
    { label: 'Add: 4245 + 15', seq: '4245 + 15 =' },
    { label: 'Mixed numbers: 5 7/8 + 1 1/8', seq: '5 ab/c 7 ab/c 8 + 1 ab/c 1 ab/c 8 =' },
    { label: 'Sine of 30° (DEG)', seq: '30 SIN' },
    { label: 'Rectangular to polar, x = 10 and y = 5: r', seq: '10 x⇄y 5 R▸P' },
    { label: 'The same conversion, then θ', seq: '10 x⇄y 5 R▸P x⇄y' },
    { label: 'Polar to rectangular, r = 12 and θ = 30°: x', seq: '12 x⇄y 30 P▸R' },
    { label: 'The same conversion, then y', seq: '12 x⇄y 30 P▸R x⇄y' }
  ];
  var exBox = doc.getElementById('examples');
  function drawExamples() {
    if (!exBox) return;
    exBox.innerHTML = K.blockHtml(EX, {});
  }
  drawExamples();

  /* Run on calculator: plays the keys on the calculator above, the chip being pressed glows */
  function clearGlow() {
    Array.prototype.forEach.call(doc.querySelectorAll('.glow-key, .glow-run'), function (n) { n.classList.remove('glow-key', 'glow-run'); });
  }
  function lcdInView() {
    var lcd = slot.querySelector('.ti-lcd');
    if (!lcd) return true;
    var r = lcd.getBoundingClientRect();
    return r.top >= 0 && r.bottom <= (window.innerHeight || doc.documentElement.clientHeight);
  }
  if (exBox) exBox.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.tikeys-run');
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    var seq = b.getAttribute('data-seq'), row = b.closest('.tikeys-row');
    var kb = row.querySelectorAll('.tikeys-seq kbd'), groups = [], c = 0;
    K.keysFor(seq).forEach(function (k, gi) {
      var n = k.key === 'num' ? (k.neg ? 2 : 1) : (k.shift && k.key !== '2nd' ? 2 : 1);
      groups[gi] = [];
      for (var j = 0; j < n; j++) groups[gi].push(kb[c++]);
    });
    clearGlow();
    row.classList.add('glow-run');
    if (!lcdInView()) {
      var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      try { slot.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' }); } catch (err) { slot.scrollIntoView(); }
    }
    K.play(seq, {
      id: 'example',
      onStep: function (gi) {
        Array.prototype.forEach.call(row.querySelectorAll('.glow-key'), function (n) { n.classList.remove('glow-key'); });
        (groups[gi] || []).forEach(function (n) { if (n) n.classList.add('glow-key'); });
      },
      onDone: function () { setTimeout(clearGlow, 900); },
      onStop: clearGlow
    });
  });

  /* calculators.html: the switcher, the notes for the chosen model, and the calculator's own menu stay in step */
  var radios = doc.querySelectorAll('input[name="calc-model"]');
  function paint() {
    var m = K.getModel();
    Array.prototype.forEach.call(radios, function (r) { r.checked = r.value === m; });
    Array.prototype.forEach.call(doc.querySelectorAll('.how[data-model]'), function (s) { s.hidden = s.getAttribute('data-model') !== m; });
    doc.documentElement.setAttribute('data-calc-model', m);
    var nm = doc.getElementById('model-name');
    if (nm) nm.textContent = NAME[m];
  }
  Array.prototype.forEach.call(radios, function (r) {
    r.addEventListener('change', function () { if (r.checked) K.setModel(r.value); });
  });
  K.onChange(function (id) {
    place();
    clearGlow();
    drawExamples();
    paint();
  });
  paint();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
