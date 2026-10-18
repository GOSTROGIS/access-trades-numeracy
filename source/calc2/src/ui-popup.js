/* Calculator faceplate: popup panel inside the page, own-window mode at #calc, keyboard input and key playback.
   Built on the TI-30Xa popup (TICalc). The model menu at the top right switches between the TI-30Xa, the Sharp
   EL-531XT and the HP-15C: the whole panel is drawn again as that calculator, and every run plays the selected
   model's keys (CalcKit translates the canonical TI-30Xa sequence). Speed, jog, hide operations, the run glow
   messages and the compact phone view work the same for all three. API: window.TICalc (unchanged) and
   CalcKit.mount / CalcKit.play. */
(function (G) {
  'use strict';
  var K = G.CalcKit, T = G.TI30, S = G.SharpEL, H = G.HP15C, doc = G.document;
  var model = K.getModel();
  var calc = K.newCalc(model);
  var root, lcdMain, lcdExp, lcdInd, lcdTop, live, tape, notesEl, playBox, playTxt, fab;
  var progEl, jogBox, opsShowBtn, lastBox, lastKey, multEl, jogIn, opsIn;
  var playing = null, mounted = false;
  /* playback settings, remembered per viewer: speed multiplier and jog (one key at a time) */
  var SPEEDS = [{ m: 0.5, name: 'Slow' }, { m: 1, name: 'Normal' }, { m: 2, name: 'Fast' }];
  var PREF_KEY = 'access-ti30-play-v1', prefs = { speed: 1, jog: false };
  try {
    var saved = JSON.parse(G.localStorage.getItem(PREF_KEY) || 'null');
    if (saved && SPEEDS.some(function (s) { return s.m === saved.speed; })) prefs.speed = saved.speed;
    if (saved && typeof saved.jog === 'boolean') prefs.jog = saved.jog;
  } catch (e) { /* storage blocked: defaults for this visit */ }
  function savePrefs() { try { G.localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (e) { /* storage blocked */ } }
  var opsOn = false, opsShown = false;
  var standalone = /(^|#)calc$/.test(G.location.hash);

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var NAME = { ti30xa: 'TI-30Xa', el531xt: 'Sharp EL-531XT', hp15c: 'HP-15C' };
  var SHORT = { ti30xa: 'TI-30Xa', el531xt: 'EL-531XT', hp15c: 'HP-15C' };

  /* ---------- TI-30Xa faceplate ---------- */
  var CAT = { '2nd': 'k-2nd', onc: 'k-on', off: 'k-on' };
  function cat(id) {
    if (CAT[id]) return CAT[id];
    if (/^d[0-9]$/.test(id) || id === 'dot' || id === 'neg') return 'k-num';
    return 'k-fn';
  }
  function keyCell(k, extra) {
    var id = k[0], p = k[1], s = k[2];
    var aria = p + (s ? ', 2nd ' + s : '');
    return '<div class="ti-cell' + (extra ? ' ' + extra : '') + '"><span class="k2" aria-hidden="true">' + esc(s || '') + '</span>' +
      '<button type="button" class="ti-k ' + cat(id) + '" data-k="' + id + '" aria-label="' + esc(aria) + '">' + esc(p) + '</button></div>';
  }
  function faceTI() {
    var L = T.LAYOUT, h = '';
    h += '<div class="ti-brand"><span class="ti-model">TI-30Xa layout</span>' + keyCell(L.onc, 'ti-oncell') + '</div>';
    h += '<div class="ti-top">';
    L.top.forEach(function (row) { row.forEach(function (k) { h += keyCell(k); }); });
    h += '</div><div class="ti-lower"><div class="ti-left">';
    L.left.forEach(function (row) { row.forEach(function (k) { h += keyCell(k); }); });
    h += '</div><div class="ti-right">';
    L.right.forEach(function (k) { h += keyCell(k, k[0] === 'eq' ? 'ti-eqcell' : ''); });
    h += '</div></div>';
    return h;
  }

  /* ---------- Sharp EL-531XT faceplate (EL-531TH guide p. 3 key layout; colours from the EL-531XT) ---------- */
  var SH_WHITE = { lp: 1, rp: 1, mul: 1, div: 1, add: 1, sub: 1, eq: 1 };
  function shCell(k, extra) {
    var id = k[0], face = k[1], sec = k[2], al = k[3];
    var cls = /^d[0-9]$/.test(id) || id === 'dot' || id === 'neg' ? 'sk-num' : SH_WHITE[id] ? 'sk-op' : id === '2ndf' ? 'sk-2nd' : id === 'alpha' ? 'sk-alpha' : id === 'onc' ? 'sk-on' : 'sk-fn';
    var aria = face + (sec ? ', 2ndF ' + sec : '') + (al ? ', ALPHA ' + al : '');
    return '<div class="sh-cell' + (extra ? ' ' + extra : '') + '"><span class="sk-lab" aria-hidden="true"><span class="sk-2">' + esc(sec || '') + '</span><span class="sk-a">' + esc(al || '') + '</span></span>' +
      '<button type="button" class="ti-k ' + cls + '" data-k="' + id + '" aria-label="' + esc(aria) + '">' + esc(face) + '</button></div>';
  }
  function faceSharp() {
    var L = S.LAYOUT, R = L.rows, nav = {};
    L.nav.forEach(function (k) { nav[k[0]] = k; });
    var h = '<div class="ti-keys sh-face">';
    h += '<div class="sh-nav">' + shCell(['home', 'HOME', '', '']) + '<div class="sh-pad" role="group" aria-label="Cursor keys">' +
      '<button type="button" class="sh-ar sh-up" data-k="up" aria-label="Up">▲</button><button type="button" class="sh-ar sh-left" data-k="left" aria-label="Left">◀</button>' +
      '<button type="button" class="sh-ar sh-right" data-k="right" aria-label="Right">▶</button><button type="button" class="sh-ar sh-down" data-k="down" aria-label="Down">▼</button></div>' +
      shCell(nav.onc) + shCell(nav['2ndf']) + shCell(nav.mode) + '</div>';
    h += '<div class="sh-row3">';
    R[0].forEach(function (k) { h += shCell(k); });
    h += '</div><div class="sh-fn">';
    for (var r = 1; r <= 3; r++) R[r].forEach(function (k) { h += shCell(k); });
    h += '</div><div class="sh-num">';
    for (var q = 4; q <= 7; q++) R[q].forEach(function (k) { h += shCell(k, k[0] === 'eq' ? 'sh-eqcell' : ''); });
    h += '</div></div>';
    return h;
  }

  /* ---------- HP-15C faceplate (four rows of ten, ENTER two rows high; handbook pp. 18-19) ---------- */
  function hpCell(k, extra) {
    var id = k[0], face = k[1], f = k[2], g = k[3];
    var cls = id === 'f' ? 'hk-f' : id === 'g' ? 'hk-g' : 'hk-k';
    var aria = face + (f ? ', f ' + f : '') + (g ? ', g ' + g : '');
    return '<div class="hp-cell' + (extra ? ' ' + extra : '') + '"><span class="hk-f-lab" aria-hidden="true">' + esc(f || '') + '</span>' +
      '<button type="button" class="ti-k ' + cls + '" data-k="' + id + '" aria-label="' + esc(aria) + '"><span class="hk-face">' + esc(face) + '</span>' +
      (g ? '<span class="hk-g-lab" aria-hidden="true">' + esc(g) + '</span>' : '') + '</button></div>';
  }
  function faceHP() {
    var h = '<div class="ti-keys hp-face"><div class="hp-grid">';
    H.ROWS.forEach(function (row, ri) {
      row.forEach(function (k, ci) {
        if (k[0] === 'enter2') return;
        var extra = k[0] === 'enter' ? 'hp-enter' : '';
        if (ri === 2 && ci >= 1 && ci <= 4) extra += ' hp-clr';
        h += hpCell(k, extra);
      });
    });
    h += '</div></div>';
    return h;
  }

  var HELP = {
    ti30xa: 'Keyboard: digits, + − × ÷ ( ) ^, Enter for =, Backspace for ←, Esc for ON/C.',
    el531xt: 'Keyboard: digits, + − × ÷ ( ) ^, Enter for =, Backspace for DEL, Esc for ON/C. Keys go in the order the expression is written (D.A.L.).',
    hp15c: 'Keyboard: digits, + − × ÷, Enter for ENTER, Backspace for ←. RPN: key a number, ENTER, the next number, then the operation.'
  };
  function build() {
    var h = '';
    h += '<div class="ti-bar"><span class="ti-grip" aria-hidden="true"></span><span class="ti-title">' + esc(NAME[model]) + ' calculator</span>';
    h += '<label class="ti-msel-w"><span class="sr-only">Calculator model</span><select class="ti-msel" aria-label="Calculator model">' +
      K.models().map(function (m) { return '<option value="' + m.id + '"' + (m.id === model ? ' selected' : '') + '>' + esc(SHORT[m.id]) + '</option>'; }).join('') + '</select></label>';
    if (!standalone) h += '<button type="button" class="ti-ic" data-act="popout" title="Open in its own window" aria-label="Open the calculator in its own window"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M11 3h6v6M17 3l-8 8M8 5H4v11h11v-4"/></svg></button>' +
      '<button type="button" class="ti-ic" data-act="close" title="Close" aria-label="Close the calculator"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15"/></svg></button>';
    h += '</div><div class="ti-body">';
    if (model === 'ti30xa') h += '<div class="ti-lcd"><div class="ti-ind" aria-hidden="true"></div><div class="ti-num" aria-hidden="true"><span class="ti-main">0.</span><span class="ti-exp"></span></div></div>';
    else if (model === 'el531xt') h += '<div class="sh-head"><span class="sh-solar" aria-hidden="true"></span><div class="ti-lcd sh-lcd"><div class="ti-ind" aria-hidden="true"></div><div class="sh-eq" aria-hidden="true"></div><div class="ti-num" aria-hidden="true"><span class="ti-main">0.</span><span class="ti-exp"></span></div></div><p class="sh-name"><span>D.A.L.</span><span>EL-531XT</span></p></div>';
    else h += '<div class="hp-head"><div class="ti-lcd hp-lcd"><div class="ti-num" aria-hidden="true"><span class="ti-main">0.0000</span><span class="ti-exp"></span></div><div class="ti-ind" aria-hidden="true"></div></div><p class="hp-name">HP-15C</p></div>';
    h += '<p class="sr-only ti-live" aria-live="polite"></p>';
    h += '<div class="ti-ctl"><div class="ti-speed" role="radiogroup" aria-label="Playback speed"><span class="ti-ctl-l" aria-hidden="true">Speed</span>';
    SPEEDS.forEach(function (s) { h += '<button type="button" class="ti-sp" role="radio" aria-checked="false" data-act="speed" data-speed="' + s.m + '" aria-label="' + s.name + ', ' + s.m + ' times">' + s.name + '</button>'; });
    h += '<output class="ti-mult"></output></div>';
    h += '<div class="ti-sw"><label><input type="checkbox" class="ti-jog-in" role="switch">Jog: one key at a time</label><label><input type="checkbox" class="ti-ops-in" role="switch">Hide operations</label></div></div>';
    h += '<div class="ti-play" hidden><span class="ti-play-t"></span><span class="ti-prog" aria-live="off"></span><button type="button" class="ti-stop" data-act="stop">Stop</button></div>';
    h += '<div class="ti-jog" role="group" aria-label="Jog: one key at a time" hidden><button type="button" class="ti-jb" data-act="back">Back</button><button type="button" class="ti-jb ti-jb-main" data-act="step">Next key</button><button type="button" class="ti-jb" data-act="rest">Play rest</button></div>';
    h += '<button type="button" class="ti-ops-show" data-act="ops" aria-expanded="false" hidden>Show operations</button>';
    h += '<div class="ti-tape" aria-label="Keys pressed"></div>';
    h += '<p class="ti-notes" hidden></p>';
    h += '<p class="ti-last" hidden><span>Key pressed</span><kbd class="tk tk-fn"></kbd></p>';
    h += model === 'ti30xa' ? faceTI() : model === 'el531xt' ? faceSharp() : faceHP();
    h += '<p class="ti-help">' + esc(HELP[model]) + '</p>';
    h += '</div>';
    var keep = root ? { hidden: root.hidden, style: root.getAttribute('style') } : null;
    if (root && root.parentNode) root.parentNode.removeChild(root);
    root = doc.createElement('section');
    root.className = 'ti-pop calc-' + model + (standalone ? ' ti-standalone' : '');
    root.id = 'ti-pop';
    root.setAttribute('data-calc-model', model);
    root.setAttribute('role', standalone ? 'region' : 'dialog');
    root.setAttribute('aria-label', NAME[model] + ' calculator');
    root.innerHTML = h;
    if (!standalone) root.hidden = keep ? keep.hidden : true;
    if (keep && keep.style) root.setAttribute('style', keep.style);
    doc.body.appendChild(root);
    lcdMain = root.querySelector('.ti-main'); lcdExp = root.querySelector('.ti-exp'); lcdInd = root.querySelector('.ti-ind'); lcdTop = root.querySelector('.sh-eq');
    live = root.querySelector('.ti-live'); tape = root.querySelector('.ti-tape'); notesEl = root.querySelector('.ti-notes');
    playBox = root.querySelector('.ti-play'); playTxt = root.querySelector('.ti-play-t');
    progEl = root.querySelector('.ti-prog'); jogBox = root.querySelector('.ti-jog'); opsShowBtn = root.querySelector('.ti-ops-show');
    lastBox = root.querySelector('.ti-last'); lastKey = lastBox.querySelector('kbd'); multEl = root.querySelector('.ti-mult');
    jogIn = root.querySelector('.ti-jog-in'); opsIn = root.querySelector('.ti-ops-in');
    jogIn.addEventListener('change', function () { api.setJog(jogIn.checked); });
    opsIn.addEventListener('change', function () { if (G.HideOps) G.HideOps.set(opsIn.checked); else api.opsChanged(opsIn.checked); });
    root.querySelector('.ti-msel').addEventListener('change', function (e) { K.setModel(e.target.value); });
    root.querySelector('.ti-speed').addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var k = 0;
      SPEEDS.forEach(function (s, j) { if (s.m === prefs.speed) k = j; });
      k = Math.max(0, Math.min(SPEEDS.length - 1, k + d));
      api.setSpeed(SPEEDS[k].m);
      root.querySelector('.ti-sp[aria-checked="true"]').focus();
    });
    root.addEventListener('click', onClick);
    if (!standalone) {
      if (!fab) {
        fab = doc.createElement('button');
        fab.type = 'button';
        fab.className = 'ti-fab';
        fab.setAttribute('aria-controls', 'ti-pop');
        fab.setAttribute('aria-expanded', 'false');
        fab.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="4" y="2" width="12" height="16" rx="2"/><path d="M7 5h6M7 9h1M10 9h1M13 9h0M7 12h1M10 12h1M7 15h1M10 15h1M13 12v3"/></svg><span>Calculator</span>';
        fab.addEventListener('click', function () { api.toggle(); });
        doc.body.appendChild(fab);
      }
      fab.setAttribute('aria-expanded', root.hidden ? 'false' : 'true');
      drag();
    }
    if (standalone) doc.title = NAME[model] + ' calculator';
    paint();
    paintPrefs();
    paintOps();
  }
  function paintPrefs() {
    if (!root) return;
    Array.prototype.forEach.call(root.querySelectorAll('.ti-sp'), function (b) {
      var on = +b.getAttribute('data-speed') === prefs.speed;
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    multEl.textContent = prefs.speed + '×';
    jogIn.checked = prefs.jog;
  }
  /* with operations hidden, the key list stays behind a Show operations button: the screen and keypad still show each key */
  function paintOps() {
    if (!root) return;
    var hide = opsOn && !opsShown;
    root.classList.toggle('ops-hidden', hide);
    opsIn.checked = opsOn;
    opsShowBtn.hidden = !opsOn;
    opsShowBtn.setAttribute('aria-expanded', opsShown ? 'true' : 'false');
    opsShowBtn.textContent = opsShown ? 'Hide operations' : 'Show operations';
    if (!hide) lastBox.hidden = true;
  }
  /* the face label of a key, as printed on the key itself */
  function faceLabel(id) {
    if (model === 'el531xt') return S.KEYS[id] ? S.KEYS[id].face : id;
    if (model === 'hp15c') return H.KEYS[id] ? H.KEYS[id].face : id;
    return T.label(id, false);
  }
  var SHIFTS = { '2nd': 'tk-2nd', '2ndf': 'tk-2nd tk-sh-2ndf', f: 'tk-2nd tk-sh-f', g: 'tk-2nd tk-sh-g' };
  function keyClass(id) {
    if (SHIFTS[id]) return 'tk ' + SHIFTS[id];
    return 'tk ' + (/^d[0-9]$|^dot$|^neg$|^chs$/.test(id) ? 'tk-num' : 'tk-fn');
  }
  function showLast(id) {
    if (!(opsOn && !opsShown) || !id) { lastBox.hidden = true; return; }
    lastKey.textContent = faceLabel(id);
    lastKey.className = keyClass(id);
    lastBox.hidden = false;
  }

  var IND = {
    ti30xa: [['second', '2nd'], ['hyp', 'HYP'], ['angle', null], ['m1', 'M1'], ['m2', 'M2'], ['m3', 'M3'], ['stat', 'STAT'], ['k', 'K'], ['paren', '( )'], ['fix', 'FIX'], ['sci', 'SCI'], ['eng', 'ENG'], ['x', 'x'], ['r', 'r'], ['n', 'n=']],
    el531xt: [['second', '2ndF'], ['hyp', 'HYP'], ['alpha', 'ALPHA'], ['angle', null], ['m', 'M']],
    hp15c: [['f', 'f'], ['g', 'g'], ['rad', 'RAD'], ['grad', 'GRAD']]
  };
  function paint() {
    var d = calc.display();
    lcdMain.textContent = d.off ? '' : d.main;
    lcdExp.textContent = d.exp ? String(d.exp).trim() : '';
    if (lcdTop) lcdTop.textContent = d.off ? '' : (d.top || '');
    var h = '';
    IND[model].forEach(function (it) {
      var on = it[1] === null ? !d.off : !!(d.ind && d.ind[it[0]]);
      var txt = it[1] === null ? (d.ind && d.ind.angle) || 'DEG' : it[1];
      h += '<span class="' + (on ? 'on' : '') + '">' + esc(txt) + '</span>';
    });
    lcdInd.innerHTML = h;
    live.textContent = d.off ? 'Calculator off' : 'Display ' + d.main + (d.exp ? ' times ten to the ' + String(d.exp).trim() : '');
  }
  function flash(id) {
    var b = root.querySelector('[data-k="' + id + '"]');
    if (!b) return;
    b.classList.add('is-hit');
    setTimeout(function () { b.classList.remove('is-hit'); }, 200);
  }
  function addTape(id) {
    var span = doc.createElement('kbd');
    span.className = keyClass(id);
    span.textContent = faceLabel(id);
    tape.appendChild(span);
    while (tape.childNodes.length > 24) tape.removeChild(tape.firstChild);
  }
  function press(id, fromPlay) {
    if (!fromPlay && playing) stop();
    calc.press(id);
    flash(id);
    if (!fromPlay) addTape(id);
    paint();
  }
  function onClick(e) {
    var k = e.target.closest('.ti-k, .sh-ar');
    if (k) { press(k.dataset.k); return; }
    var a = e.target.closest('[data-act]');
    if (!a) return;
    var act = a.dataset.act;
    if (act === 'close') api.close();
    else if (act === 'popout') api.popout();
    else if (act === 'stop') stop();
    else if (act === 'speed') api.setSpeed(+a.getAttribute('data-speed'));
    else if (act === 'step') jogStep();
    else if (act === 'back') jogBack();
    else if (act === 'rest') jogRest();
    else if (act === 'ops') { opsShown = !opsShown; paintOps(); }
  }

  /* ---------- playback ---------- */
  function stop() {
    if (playing) {
      clearTimeout(playing.timer);
      /* tell the page that asked for this run that it was stopped */
      if (playing.src) post(playing.src, { ti30: 'stop', id: playing.id });
      if (playing.cb && playing.cb.onStop) { try { playing.cb.onStop(); } catch (e) { /* caller's own code */ } }
      playing = null;
    }
    if (!root) return;
    playBox.hidden = true;
    jogBox.hidden = true;
    lastBox.hidden = true;
    notesEl.hidden = true;
    root.classList.remove('is-playing');
    Array.prototype.forEach.call(tape.querySelectorAll('.is-now'), function (n) { n.classList.remove('is-now'); });
  }
  function post(src, msg) { try { src.postMessage(msg, '*'); } catch (e) { /* the page has gone */ } }
  /* step times: 240 ms for a digit, 420 ms for any other key, divided by the speed multiplier */
  function delay(s) { return Math.round((s.fast ? 240 : 420) / prefs.speed); }
  function lightChip(chip) {
    var p = playing;
    Array.prototype.forEach.call(tape.querySelectorAll('.is-now'), function (n) { n.classList.remove('is-now'); });
    if (p && chip >= 0 && p.map[chip]) p.map[chip].forEach(function (n) { if (n) n.classList.add('is-now'); });
  }
  /* the two opening presses are not counted: "Key 3 of 11" counts the keys of the sequence itself */
  function paintProg() {
    var p = playing;
    if (!p) return;
    progEl.textContent = 'Key ' + Math.max(0, p.i - 2) + ' of ' + p.keys;
  }
  function paintJog() {
    var p = playing;
    jogBox.hidden = !(p && p.paused);
    progEl.setAttribute('aria-live', p && p.paused ? 'polite' : 'off');
    if (!p || !p.paused) return;
    jogBox.querySelector('[data-act="back"]').disabled = p.i <= 2;
    playTxt.textContent = p.i <= 2 ? 'Jog: press Next key' : 'Jog: paused';
  }
  /* press the next key of the run and tell the page which chip it was */
  function doStep() {
    var p = playing, s = p.steps[p.i++];
    lightChip(s.chip);
    if (p.src) post(p.src, { ti30: 'step', chip: s.chip, id: p.id });
    if (p.cb && p.cb.onStep) { try { p.cb.onStep(s.chip, p.chips[s.chip] || null); } catch (e) { /* caller's own code */ } }
    press(s.id, true);
    showLast(p.i > 2 ? s.id : null);
    paintProg();
    return s;
  }
  function finish() {
    var p = playing;
    playTxt.textContent = 'Done. The screen shows the answer.';
    jogBox.hidden = true;
    if (p && p.src) post(p.src, { ti30: 'done', id: p.id });
    if (p && p.cb && p.cb.onDone) { try { p.cb.onDone(); } catch (e) { /* caller's own code */ } }
    playing = null;
    setTimeout(function () { if (!playing) { playBox.hidden = true; lastBox.hidden = true; notesEl.hidden = true; root.classList.remove('is-playing'); } }, 2600);
  }
  function next() {
    var p = playing;
    if (!p) return;
    if (p.i >= p.steps.length) { finish(); return; }
    /* jog: the opening presses play by themselves, then every key waits for Next key */
    if (p.jog && p.i >= 2) {
      var first = !p.paused;
      p.paused = true;
      paintJog();
      if (first && root.contains(doc.activeElement) === false) { try { jogBox.querySelector('[data-act="step"]').focus({ preventScroll: true }); } catch (e) { /* focus refused */ } }
      return;
    }
    var s = doStep();
    p.timer = setTimeout(next, delay(s));
  }
  function jogStep() {
    var p = playing;
    if (!p || !p.paused) return;
    doStep();
    if (p.i >= p.steps.length) { finish(); return; }
    paintJog();
  }
  /* Back: a calculator has no undo, so replay the run from the start, without sound or messages, to one key before.
     The TI-30Xa starts again from ON/C. The Sharp and the HP start again from the state the run started in. */
  function snap(c) {
    var o = Object.create(Object.getPrototypeOf(c)), j = JSON.parse(JSON.stringify(c));
    Object.keys(j).forEach(function (k) { o[k] = j[k]; });
    return o;
  }
  function jogBack() {
    var p = playing;
    if (!p || !p.paused || p.i <= 2) return;
    var target = p.i - 1;
    if (p.snap) calc = snap(p.snap); else calc.press('onc');
    for (var k = 0; k < target; k++) calc.press(p.steps[k].id);
    p.i = target;
    paint();
    var s = p.steps[p.i - 1], chip = p.i > 2 ? s.chip : -1;
    lightChip(chip);
    if (p.src) post(p.src, { ti30: 'step', chip: chip, id: p.id });
    if (p.cb && p.cb.onStep) { try { p.cb.onStep(chip, p.chips[chip] || null); } catch (e) { /* caller's own code */ } }
    showLast(p.i > 2 ? s.id : null);
    paintProg();
    paintJog();
  }
  function jogRest() {
    var p = playing;
    if (!p) return;
    p.jog = false;
    p.paused = false;
    jogBox.hidden = true;
    progEl.setAttribute('aria-live', 'off');
    playTxt.textContent = 'Playing the key presses';
    clearTimeout(p.timer);
    next();
  }
  /* seq: a canonical TI-30Xa key sequence. source and id: the page that asked (from the message event) gets step, done
     and stop messages back. cb: {onStep(i, chip), onDone, onStop} for CalcKit.play */
  function play(seq, source, id, cb) {
    api.open();
    stop();
    var st = K.steps(seq, model);
    var chips = K.keysFor(seq, model);
    if (st.ti && model !== 'ti30xa') {
      /* the translator could not carry these keys over: say so instead of pressing keys this model does not have */
      playBox.hidden = false;
      playTxt.textContent = K.notesFor(seq, model).join(' ');
      if (source) post(source, { ti30: 'done', id: id });
      if (cb && cb.onDone) { try { cb.onDone(); } catch (e) { /* caller's own code */ } }
      return;
    }
    tape.innerHTML = K.chipsHtml(seq, model).replace(/<span class="tk-note">[\s\S]*?<\/span>/g, '');
    var notes = K.notesFor(seq, model);
    notesEl.textContent = notes.join(' ');
    notesEl.hidden = !notes.length;
    var chipEls = tape.querySelectorAll('kbd'), map = [], ci = 0;
    chips.forEach(function (c, i) { var n = c.kind === 'num' && c.key === 'num' ? (c.neg ? 2 : 1) : (c.shift && c.key !== '2nd' ? 2 : 1); map[i] = []; for (var j = 0; j < n; j++) map[i].push(chipEls[ci++]); });
    opsShown = false;
    paintOps();
    playBox.hidden = false;
    root.classList.add('is-playing');
    playTxt.textContent = prefs.jog ? 'Jog: press Next key' : 'Playing the key presses';
    playing = { timer: null, src: source || null, id: id, steps: st.list, i: 0, map: map, chips: chips, keys: st.list.length - 2, jog: prefs.jog, paused: false, cb: cb || null, snap: model === 'ti30xa' ? null : snap(calc) };
    paintProg();
    if (model === 'ti30xa') calc.press('onc');
    next();
  }

  /* ---------- dragging ---------- */
  function drag() {
    var bar = root.querySelector('.ti-bar'), sx, sy, ox, oy, on = false;
    bar.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button, select, label') || G.matchMedia('(max-width: 640px)').matches) return;
      on = true; bar.setPointerCapture(e.pointerId);
      var r = root.getBoundingClientRect();
      sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top;
    });
    bar.addEventListener('pointermove', function (e) {
      if (!on) return;
      var x = Math.min(Math.max(0, ox + e.clientX - sx), G.innerWidth - 120), y = Math.min(Math.max(0, oy + e.clientY - sy), G.innerHeight - 60);
      root.style.left = x + 'px'; root.style.top = y + 'px'; root.style.right = 'auto'; root.style.bottom = 'auto';
    });
    bar.addEventListener('pointerup', function () { on = false; });
  }

  /* ---------- keyboard ---------- */
  var KB = {
    ti30xa: { '+': 'add', '-': 'sub', '*': 'mul', 'x': 'mul', '/': 'div', '^': 'pow', '(': 'lp', ')': 'rp', '=': 'eq', 'Enter': 'eq', 'Backspace': 'back', 'Escape': 'onc', '.': 'dot' },
    el531xt: { '+': 'add', '-': 'sub', '*': 'mul', 'x': 'mul', '/': 'div', '^': 'pow', '(': 'lp', ')': 'rp', '=': 'eq', 'Enter': 'eq', 'Backspace': 'del', 'Escape': 'onc', '.': 'dot' },
    hp15c: { '+': 'add', '-': 'sub', '*': 'mul', 'x': 'mul', '/': 'div', '^': 'pow', 'Enter': 'enter', '=': 'enter', 'Backspace': 'back', '.': 'dot' }
  };
  doc.addEventListener('keydown', function (e) {
    if (!root || root.hidden || e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    if (!standalone && !root.contains(t) && t !== doc.body) return;
    if (e.key === 'Escape' && !standalone) { e.preventDefault(); api.close(); return; }
    /* jog: Space or Right arrow presses the next key, Left arrow steps back (a focused button keeps its own Space) */
    if (playing && playing.paused && root.contains(t) && !(t.closest && t.closest('.ti-speed'))) {
      var onBtn = t.closest && t.closest('button, input');
      if (e.key === 'ArrowRight' || (e.key === ' ' && !onBtn)) { e.preventDefault(); jogStep(); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); jogBack(); return; }
    }
    var id = /^[0-9]$/.test(e.key) ? 'd' + e.key : KB[model][e.key];
    if (!id) return;
    e.preventDefault();
    press(id);
  });

  /* ---------- model switch: the whole panel is drawn again as the chosen calculator ---------- */
  function switchModel(id) {
    if (id === model) return;
    var wasOpen = root && !root.hidden, focusSel = root && root.contains(doc.activeElement) && doc.activeElement.classList.contains('ti-msel');
    stop();
    model = id;
    calc = K.newCalc(model);
    if (root) {
      build();
      if (!standalone) root.hidden = !wasOpen;
      if (focusSel) { try { root.querySelector('.ti-msel').focus(); } catch (e) { /* focus refused */ } }
    }
  }
  K.onChange(switchModel);

  var api = {
    open: function () {
      if (!root) build();
      root.hidden = false;
      if (fab) fab.setAttribute('aria-expanded', 'true');
    },
    close: function () {
      stop();
      root.hidden = true;
      if (fab) { fab.setAttribute('aria-expanded', 'false'); fab.focus(); }
    },
    toggle: function () { if (!root || root.hidden) { api.open(); root.querySelector('.ti-k').focus(); } else api.close(); },
    play: play,
    press: press,
    popout: function () {
      var url = G.location.href.split('#')[0] + '#calc';
      var w = null;
      try { w = G.open(url, 'ti30xa', 'popup,width=' + (model === 'hp15c' ? 640 : 400) + ',height=' + (model === 'hp15c' ? 620 : 760)); } catch (e) { w = null; }
      if (!w) { playBox.hidden = false; playTxt.textContent = 'This browser blocked a new window. Use the calculator here.'; }
    },
    standalone: standalone,
    setSpeed: function (m) {
      if (!SPEEDS.some(function (s) { return s.m === m; })) return;
      prefs.speed = m; savePrefs(); paintPrefs();
    },
    setJog: function (on) {
      prefs.jog = !!on; savePrefs(); paintPrefs();
      if (!on && playing && playing.paused) jogRest();
    },
    prefs: function () { return { speed: prefs.speed, jog: prefs.jog }; },
    jogStep: function () { jogStep(); },
    jogBack: function () { jogBack(); },
    jogRest: function () { jogRest(); },
    state: function () { return playing ? { id: playing.id, key: Math.max(0, playing.i - 2), keys: playing.keys, paused: !!playing.paused } : null; },
    opsChanged: function (on) { opsOn = !!on; opsShown = false; paintOps(); },
    model: function () { return model; },
    setModel: function (id) { K.setModel(id); }
  };
  Object.defineProperty(api, 'calc', { get: function () { return calc; }, enumerable: true });
  G.TICalc = api;
  /* CalcKit.mount: the floating Calculator button and the popup. CalcKit.play: a run with callbacks */
  K.mount = function (opts) {
    opts = opts || {};
    if (opts.standalone) standalone = true;
    if (!root) build();
    if (opts.open) api.open();
    mounted = true;
    return api;
  };
  K.play = function (seq, o) {
    o = o || {};
    play(seq, null, o.id, { onStep: o.onStep, onDone: o.onDone, onStop: o.onStop });
  };
  K.popup = api;
  G.addEventListener('message', function (e) {
    var d = e.data;
    if (d && d.ti30 === 'play' && typeof d.seq === 'string') play(d.seq, e.source, d.id);
    if (d && d.ti30 === 'open') api.open();
  });
  function start() {
    if (G.CALCKIT_NO_AUTOMOUNT && !standalone) return;
    build();
    if (standalone) doc.documentElement.classList.add('calc-only');
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start); else start();
})(window);
