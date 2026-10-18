/* CalcKit core: the three calculator models, the selected model, key chips and screens for any canonical TI-30Xa
   key sequence. Worked solutions are written once, as TI-30Xa sequences (the seq strings pages send in
   {ti30:'play'}). CalcTranslate turns them into the selected model's keys, so pages never write Sharp or HP keys.
   Needs TI30, SharpEL, HP15C and CalcTranslate. The popup (CalcKit.mount, CalcKit.play) is added by ui-popup.js. */
var CalcKit = (function (G) {
  'use strict';
  var T = G.TI30, S = G.SharpEL, H = G.HP15C, X = G.CalcTranslate;
  var STORE = 'access-calc-model';
  var MODELS = [
    { id: 'ti30xa', name: 'TI-30Xa', logic: 'algebraic', maker: 'Texas Instruments' },
    { id: 'el531xt', name: 'Sharp EL-531XT', logic: 'dal', maker: 'Sharp' },
    { id: 'hp15c', name: 'HP-15C', logic: 'rpn', maker: 'HP' }
  ];
  var BY = {};
  MODELS.forEach(function (m) { BY[m.id] = m; });
  /* how each model starts a worked solution: the two key presses the calculator plays before the keys of the
     solution (the same count on every model, so "Key 3 of 11" and the chip glow line up) */
  var START = {
    ti30xa: [{ key: 'onc', shift: null }, { key: 'onc', shift: null }],
    el531xt: [{ key: 'onc', shift: null }, { key: 'onc', shift: null }],
    hp15c: [{ key: 'back', shift: 'g' }]
  };
  var SUB = {
    ti30xa: { pre: 'Start with ', post: ' and DEG on the screen.' },
    el531xt: { pre: 'Start with ', post: ' and DEG on the screen.' },
    hp15c: { pre: 'Start with ', post: ' in Degrees mode (no RAD or GRAD on the screen).' }
  };
  var model = 'ti30xa';
  try { var saved = G.localStorage.getItem(STORE); if (BY[saved]) model = saved; } catch (e) { /* storage blocked: TI-30Xa for this visit */ }
  var listeners = [];

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function info(id) { return BY[id || model]; }
  function models() { return MODELS.map(function (m) { return { id: m.id, name: m.name, logic: m.logic }; }); }
  function getModel() { return model; }
  function setModel(id) {
    if (!BY[id] || id === model) return model;
    model = id;
    try { G.localStorage.setItem(STORE, id); } catch (e) { /* storage blocked: kept for this visit */ }
    listeners.slice().forEach(function (fn) { try { fn(id); } catch (e) { /* one listener failing must not stop the rest */ } });
    return model;
  }
  function onChange(fn) { listeners.push(fn); return function () { var i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); }; }

  /* ---------- tokens ---------- */
  /* model tokens for a canonical sequence: {num}, {key, shift} and {note}. TI-30Xa tokens come from the TI30
     tokenizer itself. A sequence the translator cannot carry over keeps its TI-30Xa keys and gets a note. */
  var cache = {};
  function tokensFor(seq, id) {
    id = id || model;
    var ck = id + '|' + seq;
    if (cache[ck]) return cache[ck];
    var r;
    if (id === 'ti30xa') r = { toks: tiTokens(seq), ok: true };
    else {
      try { r = { toks: X.translate(seq, id), ok: true }; }
      catch (e) {
        if (!(e instanceof X.Unsupported)) throw e;
        r = { toks: [{ note: 'Not on this model: ' + e.message + '. The TI-30Xa keys are shown.' }].concat(tiTokens(seq)), ok: false, why: e.message };
      }
    }
    cache[ck] = r;
    return r;
  }
  function tiTokens(seq) {
    return T.tokens(seq).map(function (t) {
      if (t.num != null) return { num: t.num, neg: !!t.neg, ti: true };
      if (t.key === '2nd') return { key: '2nd', shift: null, ti: true };
      return { key: t.key, shift: t.second ? '2nd' : null, ti: true };
    });
  }
  /* the token list the TI30.tokens wrapper hands to page scripts: one entry per chip group, notes left out.
     A number is one chip (two when a TI-30Xa number is negative); a key with its shift key is two chips. */
  function pageTokens(seq, id) {
    var out = [];
    tokensFor(seq, id).toks.forEach(function (t) {
      if (t.note) return;
      if (t.num != null) out.push({ num: String(t.num), neg: !!t.neg });
      else out.push({ key: t.key, second: !!t.shift && t.key !== '2nd' });
    });
    return out;
  }

  /* ---------- labels and chips ---------- */
  var OPS = { add: 1, sub: 1, mul: 1, div: 1, eq: 1, onc: 1, enter: 1 };
  var SHIFT_LABEL = { '2nd': '2nd', '2ndf': '2ndF', f: 'f', g: 'g', alpha: 'ALPHA' };
  function shiftOf(t, id) { return t.ti ? 'ti30xa' : id; }
  function label(t, id, prev) {
    var m = shiftOf(t, id);
    if (t.num != null) return String(t.num);
    if (m === 'ti30xa') return T.KEYS[t.key] ? T.KEYS[t.key][t.shift ? 1 : 0] : t.key;
    if (m === 'el531xt') {
      var k = S.KEYS[t.key];
      if (!k) return t.key;
      /* the key after STO or RCL names a memory: its green letter (EL-531TH guide p. 3) */
      if (!t.shift && prev && !prev.shift && (prev.key === 'sto' || prev.key === 'rcl') && S.LETTER[t.key]) return S.LETTER[t.key];
      return t.shift === '2ndf' ? k.second : t.shift === 'alpha' ? k.alpha : k.face;
    }
    var h = H.KEYS[t.key];
    if (!h) return t.key;
    return t.shift === 'f' ? h.f : t.shift === 'g' ? h.g : h.face;
  }
  function kindOf(t, id, prev) {
    if (t.num != null) return 'num';
    var m = shiftOf(t, id);
    if (t.key === '2nd') return '2nd';
    if (t.shift) return 'fn';
    if (m === 'el531xt' && prev && !prev.shift && (prev.key === 'sto' || prev.key === 'rcl') && S.LETTER[t.key]) return 'alpha';
    if (/^d[0-9]$/.test(t.key) || t.key === 'dot' || t.key === 'neg' || t.key === 'chs') return 'num';
    return OPS[t.key] ? 'op' : 'fn';
  }
  /* CalcKit.keysFor: one entry per chip group. {label, key, shift} plus kind, and neg for a negative TI number */
  function keysFor(seq, id) {
    id = id || model;
    var out = [], prev = null;
    tokensFor(seq, id).toks.forEach(function (t) {
      if (t.note) return;
      var e = { label: label(t, id, prev), key: t.num != null ? 'num' : t.key, shift: t.shift || null, kind: kindOf(t, id, prev) };
      if (t.shift) e.shiftLabel = SHIFT_LABEL[t.shift];
      if (t.neg) e.neg = true;
      out.push(e);
      prev = t;
    });
    return out;
  }
  function notesFor(seq, id) {
    return tokensFor(seq, id || model).toks.filter(function (t) { return t.note; }).map(function (t) { return t.note; });
  }
  var SHIFT_CLASS = { '2nd': '', '2ndf': ' tk-sh-2ndf', f: ' tk-sh-f', g: ' tk-sh-g', alpha: ' tk-sh-alpha' };
  var SEC_CLASS = { '2nd': '', '2ndf': ' tk-sec-2ndf', f: ' tk-sec-f', g: ' tk-sec-g', alpha: ' tk-sec-alpha' };
  /* chip HTML with the class names the hub already uses (tk, tk-num, tk-op, tk-fn, tk-2nd, tk-sec), so glow and hide
     operations work for every model. Notes are spans, never kbd, so they are not counted as chips. */
  function chipsHtml(seq, id) {
    id = id || model;
    var h = '', prev = null;
    tokensFor(seq, id).toks.forEach(function (t) {
      if (t.note) { h += '<span class="tk-note">' + esc(t.note) + '</span>'; return; }
      var lab = label(t, id, prev), kind = kindOf(t, id, prev);
      if (t.num != null) {
        h += '<kbd class="tk tk-num">' + esc(lab) + '</kbd>';
        if (t.neg) h += '<kbd class="tk tk-num">' + esc(T.KEYS.neg[0]) + '</kbd>';
      } else if (t.key === '2nd') h += '<kbd class="tk tk-2nd">2nd</kbd>';
      else if (t.shift) {
        h += '<kbd class="tk tk-2nd' + SHIFT_CLASS[t.shift] + '">' + esc(SHIFT_LABEL[t.shift]) + '</kbd>' +
          '<kbd class="tk tk-fn tk-sec' + SEC_CLASS[t.shift] + '">' + esc(lab) + '</kbd>';
      } else h += '<kbd class="tk tk-' + (kind === 'alpha' ? 'fn tk-alpha' : kind) + '">' + esc(lab) + '</kbd>';
      prev = t;
    });
    return h;
  }
  /* chips for Word and PDF exports: {t, k} with k one of num, op, fn, 2nd, 2ndf, f, g, alpha, note */
  function exportChips(seq, id) {
    id = id || model;
    var out = [], prev = null;
    tokensFor(seq, id).toks.forEach(function (t) {
      if (t.note) { out.push({ t: t.note, k: 'note' }); return; }
      var lab = label(t, id, prev), kind = kindOf(t, id, prev);
      if (t.num != null) { out.push({ t: lab, k: 'num' }); if (t.neg) out.push({ t: T.KEYS.neg[0], k: 'num' }); }
      else if (t.key === '2nd') out.push({ t: '2nd', k: '2nd' });
      else if (t.shift) { out.push({ t: SHIFT_LABEL[t.shift], k: t.shift }); out.push({ t: lab, k: 'fn' }); }
      else out.push({ t: lab, k: kind === 'alpha' ? 'alpha' : kind });
      prev = t;
    });
    return out;
  }

  /* ---------- emulators and screens ---------- */
  function newCalc(id) {
    id = id || model;
    if (id === 'el531xt') return new S.Calc();
    if (id === 'hp15c') return new H.Calc();
    return new T.Calc();
  }
  /* the key presses of a run: the start presses (not counted as keys of the solution) then the solution's keys,
     each with the index of its chip group */
  function steps(seq, id) {
    id = id || model;
    var r = tokensFor(seq, id), list = [];
    var tiRun = id === 'ti30xa' || !r.ok;
    (tiRun ? START.ti30xa : START[id]).forEach(function (t) {
      if (t.shift) list.push({ id: t.shift, chip: -1 });
      list.push({ id: t.key, chip: -1 });
    });
    var chip = -1;
    r.toks.forEach(function (t) {
      if (t.note) return;
      chip++;
      if (t.num != null) {
        String(t.num).split('').forEach(function (c) { list.push({ id: c === '.' ? 'dot' : 'd' + c, chip: chip, fast: true }); });
        if (t.neg) list.push({ id: 'neg', chip: chip });
        return;
      }
      if (t.shift) list.push({ id: t.shift, chip: chip });
      list.push({ id: t.key, chip: chip });
    });
    return { list: list, start: 2, ti: tiRun };
  }
  function screen(seq, id) {
    id = id || model;
    var st = steps(seq, id), c = newCalc(st.ti ? 'ti30xa' : id);
    st.list.forEach(function (s) { c.press(s.id); });
    return c.display();
  }
  function screenText(d) { return d.main + (d.exp ? ' ×10^' + String(d.exp).trim() : ''); }

  /* ---------- key-chip blocks ---------- */
  function startChips(id) {
    id = id || model;
    return (START[id]).map(function (t) {
      if (t.shift) return '<kbd class="tk tk-2nd' + SHIFT_CLASS[t.shift] + '">' + SHIFT_LABEL[t.shift] + '</kbd><kbd class="tk tk-fn tk-sec' + SEC_CLASS[t.shift] + '">' + esc(label(t, id, null)) + '</kbd>';
      return '<kbd class="tk tk-op">' + esc(label(t, id, null)) + '</kbd>';
    }).join('');
  }
  function heading(id) {
    id = id || model;
    var sub = SUB[id];
    return {
      title: 'On the ' + BY[id].name,
      subHtml: sub.pre + startChips(id) + sub.post,
      subText: sub.pre + START[id].map(function (t) { return (t.shift ? SHIFT_LABEL[t.shift] + ' ' : '') + label(t, id, null); }).join(' ') + sub.post
    };
  }
  /* the calculator line of an exam's instructions */
  function examIntro(id) {
    id = id || model;
    return 'Use the ' + BY[id].name + (id === 'hp15c' ? ' in Degrees mode.' : ' in DEG mode.');
  }
  function screenHtml(d) { return '<span class="tk-lcd">' + esc(d.main) + (d.exp ? '<sup>' + esc(String(d.exp).trim()) + '</sup>' : '') + '</span>'; }
  /* the same block TIKeys.html builds, for the selected model: list [{label, seq}], opts.hideScreen */
  function blockHtml(list, opts, id) {
    opts = opts || {};
    id = id || model;
    if (!list || !list.length) return '';
    var hd = heading(id);
    var h = '<div class="tikeys" data-calc-model="' + id + '"><p class="tikeys-h"><span class="tikeys-title">' + esc(hd.title) + '</span><span class="tikeys-sub">' + hd.subHtml + '</span></p><ol class="tikeys-list">';
    list.forEach(function (k) {
      h += '<li class="tikeys-row"><span class="tikeys-lab">' + esc(k.label) + '</span><span class="tikeys-seq">' + chipsHtml(k.seq, id) + '</span>' +
        '<span class="tikeys-out">' + (opts.hideScreen ? '' : '<span class="tikeys-scr">Screen</span>' + screenHtml(screen(k.seq, id))) +
        '<button type="button" class="tikeys-run" data-seq="' + esc(k.seq) + '">Run on calculator</button></span></li>';
    });
    return h + '</ol></div>';
  }
  /* CalcKit.renderChips: a chip row for the selected model inside el, rendered again whenever the model changes */
  var rendered = [];
  function renderChips(el, seq) {
    if (!el) return;
    el.setAttribute('data-calc-seq', seq);
    el.innerHTML = chipsHtml(seq);
    el.setAttribute('data-calc-model', model);
    if (rendered.indexOf(el) < 0) rendered.push(el);
  }
  onChange(function () {
    rendered = rendered.filter(function (el) { return el.isConnected !== false; });
    rendered.forEach(function (el) { el.innerHTML = chipsHtml(el.getAttribute('data-calc-seq')); el.setAttribute('data-calc-model', model); });
  });

  return {
    models: models, getModel: getModel, setModel: setModel, onChange: onChange, info: info,
    keysFor: keysFor, notesFor: notesFor, tokensFor: tokensFor, pageTokens: pageTokens,
    chipsHtml: chipsHtml, exportChips: exportChips, examIntro: examIntro, renderChips: renderChips, blockHtml: blockHtml, heading: heading,
    screen: screen, screenText: screenText, screenHtml: screenHtml, steps: steps, newCalc: newCalc,
    STORE: STORE, START: START
  };
})(typeof window !== 'undefined' ? window : global);
if (typeof module !== 'undefined' && module.exports) module.exports = CalcKit;
