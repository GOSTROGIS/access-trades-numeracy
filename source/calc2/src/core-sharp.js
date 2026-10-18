/* Sharp EL-531XT emulator (normal mode).
   Sources: EL-531XT Operation Manual and Calculation Examples (sharp.ca, EL531XT_OM_En.pdf) and the
   EL-531TH Series Operation Guide (global.sharp, OperationGuide_EL531TH.pdf). See calc2/CALC-MODELS.md.
   D.A.L. (Direct Algebraic Logic): keys are typed in the order the expression is written. The equation line is
   worked out on = (or another calculation-ending key) with the manual's priority levels. */
var SharpEL = (function () {
  'use strict';

  /* Key layout, top to bottom, as on the EL-531XT faceplate (EL-531TH guide p. 3 shows the same layout).
     [id, face label, 2ndF label (orange), ALPHA letter (green)] */
  var LAYOUT = {
    nav: [['2ndf', '2ndF', '', ''], ['home', 'HOME', '', ''], ['onc', 'ON/C', 'OFF', ''], ['mode', 'MODE', 'CA', '']],
    rows: [
      [['alpha', 'ALPHA', 'STAT VAR', ''], ['setup', 'SET UP', '', ''], ['del', 'DEL', 'INS', '']],
      [['hyp', 'hyp', 'arc hyp', ''], ['sin', 'sin', 'sin⁻¹', ''], ['cos', 'cos', 'cos⁻¹', ''], ['tan', 'tan', 'tan⁻¹', ''], ['pi', 'π', 'DRG▸', ''], ['drg', 'DRG', '', '']],
      [['pow', 'yˣ', 'ˣ√', 'A'], ['sqrt', '√', '', 'B'], ['sq', 'x²', 'x⁻¹', 'C'], ['cube', 'x³', '³√', 'D'], ['log', 'log', '10ˣ', 'E'], ['ln', 'ln', 'eˣ', 'F']],
      [['exp', 'Exp', '←,→', ''], ['abc', 'a b/c', 'd/c', ''], ['dms', 'D°M′S', '↔DEG', ''], ['rcl', 'RCL', '', 'X'], ['sto', 'STO', ',', 'Y'], ['mplus', 'M+', 'M−', 'M']],
      [['d7', '7', 'RANDOM', ''], ['d8', '8', '→rθ', ''], ['d9', '9', '→xy', ''], ['lp', '(', '', ''], ['rp', ')', '', '']],
      [['d4', '4', 'n!', ''], ['d5', '5', 'nCr', ''], ['d6', '6', 'nPr', ''], ['mul', '×', '', ''], ['div', '÷', '', '']],
      [['d1', '1', '%', ''], ['d2', '2', '', ''], ['d3', '3', '', ''], ['add', '+', '', ''], ['sub', '−', '', '']],
      [['d0', '0', 'MDF', ''], ['dot', '.', '', ''], ['neg', '+/−', 'M-CLR', ''], ['eq', '=', '', 'ANS']]
    ]
  };
  var KEYS = {};
  LAYOUT.nav.concat.apply(LAYOUT.nav, LAYOUT.rows).forEach(function (k) { KEYS[k[0]] = { face: k[1], second: k[2], alpha: k[3] }; });
  KEYS.up = { face: '▲', second: '', alpha: '' }; KEYS.down = { face: '▼', second: '', alpha: '' };
  KEYS.left = { face: '◀', second: '', alpha: '' }; KEYS.right = { face: '▶', second: '', alpha: '' };
  /* the letter keys used after STO, RCL and ALPHA (green letters on the faceplate) */
  var LETTER = { pow: 'A', sqrt: 'B', sq: 'C', cube: 'D', log: 'E', ln: 'F', rcl: 'X', sto: 'Y', mplus: 'M' };
  var LETTER_KEY = {};
  Object.keys(LETTER).forEach(function (k) { LETTER_KEY[LETTER[k]] = k; });

  var PI = Math.PI;
  function sig(v, n) { return (v === 0 || !isFinite(v)) ? v : Number(v.toPrecision(n)); }
  function SErr(kind) { this.kind = kind; }
  var NEXT = { DEG: 'RAD', RAD: 'GRAD', GRAD: 'DEG' };
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }
  function toFrac(v) {
    if (!isFinite(v)) return null;
    for (var d = 1; d <= 99999; d++) {
      var n = Math.round(v * d);
      if (Math.abs(n / d - v) <= 1e-11 * Math.max(1, Math.abs(v))) { var g = gcd(n, d); return [n / g, d / g]; }
    }
    return null;
  }
  function fracDigits(fr) {
    var n = Math.abs(fr[0]), d = fr[1], w = Math.floor(n / d), r = n - w * d;
    return String(w || '').length + String(r).length + String(d).length;
  }

  function Calc() { this.mem = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, X: 0, Y: 0, M: 0 }; this.ans = 0; this.reset(); }
  Calc.prototype.reset = function () {
    this.angle = 'DEG';
    this.fse = 'NORM1'; this.tab = null;
    this.off = false;
    this.clearEntry();
    this.result = { v: 0, form: 'dec' };
    this.top = '';
    this.state = 'result';
  };
  Calc.prototype.clearEntry = function () {
    this.eq = []; this.num = null; this.second = false; this.alpha = false; this.hypOn = false; this.arcHyp = false;
    this.await = null; this.err = null; this.setup = null; this.coordShown = null;
  };

  /* ---------- typing the equation ---------- */
  function newNum() { return { kind: 'dec', parts: [''], exp: null, expNeg: false, neg: false }; }
  Calc.prototype.startEq = function (keepAns) {
    if (this.state === 'result') {
      this.eq = keepAns ? [{ k: 'ans' }] : [];
      this.state = 'entry';
      this.coordShown = null;
    }
  };
  Calc.prototype.closeNum = function () {
    if (!this.num) return;
    var n = this.num, v, tok = { k: 'num' };
    if (n.kind === 'dms') {
      var p = n.parts.map(function (s) { return parseFloat(s || '0'); });
      v = p[0] + (p[1] || 0) / 60 + (p[2] || 0) / 3600;
      tok.dms = true;
      tok.s = n.parts[0] + '°' + (n.parts.length > 1 ? (n.parts[1] || '0') + '′' : '') + (n.parts.length > 2 ? (n.parts[2] || '0') + '″' : '');
    } else if (n.kind === 'frac') {
      var q = n.parts.map(function (s) { return parseFloat(s || '0'); }), w = 0, nu, de;
      if (q.length === 3) { w = q[0]; nu = q[1]; de = q[2]; } else { nu = q[0]; de = q[1]; }
      if (de === 0) throw new SErr('Error 2');
      v = w + nu / de;
      tok.frac = true; tok.s = n.parts.join('┌');
      tok.imp = q.length === 2 && nu >= de;
    } else {
      v = parseFloat(n.parts[0] || '0');
      if (n.exp !== null) v = v * Math.pow(10, (n.expNeg ? -1 : 1) * parseInt(n.exp || '0', 10));
      tok.s = (n.parts[0] || '0') + (n.exp !== null ? 'E' + (n.expNeg ? '-' : '') + (n.exp || '0') : '');
    }
    if (n.neg) { v = -v; tok.s = '-' + tok.s; }
    tok.v = v;
    this.eq.push(tok);
    this.num = null;
  };
  Calc.prototype.digit = function (ch) {
    this.startEq(false);
    if (!this.num) this.num = newNum();
    var n = this.num;
    if (n.exp !== null) { if (ch !== '.') n.exp = (n.exp + ch).slice(-2); return; }
    var i = n.parts.length - 1, cur = n.parts[i];
    if (ch === '.') { if (cur.indexOf('.') < 0) n.parts[i] = (cur || '0') + '.'; return; }
    /* the entry stops at the 10 digit cells of the display (a leading 0 before the point takes a cell) */
    if (n.parts.join('').replace(/\D/g, '').length >= 10) return;
    n.parts[i] = (cur === '0' ? '' : cur) + ch;
  };
  Calc.prototype.push = function (tok) { this.closeNum(); this.eq.push(tok); };

  /* ---------- working out the equation line ----------
     Priority levels from the manual ("Priority Levels in Calculation"), highest first: fractions, functions after
     their argument (x⁻¹, x², n!), yˣ and ˣ√, implied multiplication, functions before their argument (sin, √ ...),
     nCr and nPr, × and ÷, + and −, then = and the other calculation-ending keys. */
  Calc.prototype.toRad = function (a) { return this.angle === 'DEG' ? a * PI / 180 : this.angle === 'GRAD' ? a * PI / 200 : a; };
  Calc.prototype.fromRad = function (a) { return this.angle === 'DEG' ? a * 180 / PI : this.angle === 'GRAD' ? a * 200 / PI : a; };
  function clean(v) { return Math.abs(v) < 1e-13 ? 0 : v; }
  Calc.prototype.fn = function (f, x) {
    var h = f.h;
    switch (f.fn) {
      case 'sin': return h === 'hyp' ? Math.sinh(x) : h === 'arc' ? Math.asinh(x) : clean(Math.sin(this.toRad(x)));
      case 'cos': if (h === 'hyp') return Math.cosh(x); if (h === 'arc') { if (x < 1) throw new SErr('Error 2'); return Math.acosh(x); } return clean(Math.cos(this.toRad(x)));
      case 'tan':
        if (h === 'hyp') return Math.tanh(x);
        if (h === 'arc') { if (Math.abs(x) >= 1) throw new SErr('Error 2'); return Math.atanh(x); }
        var q = this.angle === 'DEG' ? x / 90 : this.angle === 'GRAD' ? x / 100 : null;
        if (q !== null && Math.abs(q - Math.round(q)) < 1e-12 && Math.round(q) % 2) throw new SErr('Error 2');
        return clean(Math.tan(this.toRad(x)));
      case 'asin': if (Math.abs(x) > 1) throw new SErr('Error 2'); return this.fromRad(Math.asin(x));
      case 'acos': if (Math.abs(x) > 1) throw new SErr('Error 2'); return this.fromRad(Math.acos(x));
      case 'atan': return this.fromRad(Math.atan(x));
      case 'sqrt': if (x < 0) throw new SErr('Error 2'); return Math.sqrt(x);
      case 'cbrt': return Math.cbrt(x);
      case 'log': if (x <= 0) throw new SErr('Error 2'); return Math.log10(x);
      case 'ln': if (x <= 0) throw new SErr('Error 2'); return Math.log(x);
      case 'tenx': return Math.pow(10, x);
      case 'ex': return Math.exp(x);
    }
    throw new SErr('Error 1');
  };
  function isInt(v) { return Math.abs(v - Math.round(v)) < 1e-9; }
  Calc.prototype.evaluate = function (toks) {
    var self = this, p = 0;
    function peek() { return toks[p]; }
    function is(k, sub) { var t = toks[p]; return t && t.k === k && (sub === undefined || t.op === sub); }
    function startsPrimary(t) { return t && (t.k === 'num' || t.k === 'lp' || t.k === 'pi' || t.k === 'var' || t.k === 'ans' || t.k === 'pre'); }
    function sum() {
      var v = prod();
      while (is('op', 'add') || is('op', 'sub')) { var o = toks[p++].op, r = prod(); v = o === 'add' ? v + r : v - r; }
      return v;
    }
    function prod() {
      var v = comb();
      while (is('op', 'mul') || is('op', 'div')) {
        var o = toks[p++].op, r = comb();
        if (o === 'div' && r === 0) throw new SErr('Error 2');
        v = o === 'mul' ? v * r : v / r;
      }
      return v;
    }
    function comb() {
      var v = implied();
      while (is('ncr') || is('npr')) {
        var o = toks[p++].k, r = implied();
        if (!isInt(v) || !isInt(r) || v < 0 || r < 0 || r > v) throw new SErr('Error 2');
        var n = Math.round(v), k = Math.round(r), out = 1, i;
        if (o === 'npr') for (i = 0; i < k; i++) out *= (n - i);
        else { k = Math.min(k, n - k); for (i = 1; i <= k; i++) out = out * (n - k + i) / i; out = Math.round(out); }
        v = out;
      }
      return v;
    }
    function implied() {
      var v = prefix();
      while (startsPrimary(peek())) v = v * prefix();
      return v;
    }
    function prefix() {
      var t = peek();
      if (t && t.k === 'pre') { p++; return self.fn(t, prefix2()); }
      if (t && t.k === 'neg') { p++; return -prefix2(); }
      return power();
    }
    /* the argument of a function written before it: everything of a higher priority (powers, x² ...) */
    function prefix2() { var t = peek(); if (t && (t.k === 'pre' || t.k === 'neg')) return prefix(); return power(); }
    function power() {
      var v = postfix();
      while (is('pow') || is('root')) {
        var o = toks[p++].k, r = (peek() && (peek().k === 'pre' || peek().k === 'neg')) ? prefix() : postfix();
        if (o === 'pow') {
          if (v === 0 && r <= 0) throw new SErr('Error 2');
          if (v < 0 && !isInt(r)) {
            var inv = 1 / r;
            if (isInt(inv) && Math.round(inv) % 2) { v = -Math.pow(-v, r); continue; }
            throw new SErr('Error 2');
          }
          v = Math.pow(v, r);
        } else {
          /* the x-th root of y, keyed x 2ndF ˣ√ y */
          if (v === 0) throw new SErr('Error 2');
          if (r < 0) { if (isInt(v) && Math.round(v) % 2) { v = -Math.pow(-r, 1 / v); continue; } throw new SErr('Error 2'); }
          v = Math.pow(r, 1 / v);
        }
      }
      return v;
    }
    function postfix() {
      var v = primary();
      while (is('fbar')) { p++; var den = primary(); if (den === 0) throw new SErr('Error 2'); v = v / den; }
      while (is('post')) {
        var f = toks[p++].fn;
        if (f === 'sq') v = v * v;
        else if (f === 'cube') v = v * v * v;
        else if (f === 'inv') { if (v === 0) throw new SErr('Error 2'); v = 1 / v; }
        else if (f === 'fact') {
          if (!isInt(v) || v < 0 || v > 69) throw new SErr('Error 2');
          var r = 1; for (var i = 2; i <= Math.round(v); i++) r *= i; v = r;
        }
      }
      return v;
    }
    function primary() {
      var t = toks[p++];
      if (!t) throw new SErr('Error 1');
      if (t.k === 'num') return t.v;
      if (t.k === 'pi') return PI;
      if (t.k === 'var') return self.mem[t.name];
      if (t.k === 'ans') return self.ans;
      if (t.k === 'lp') {
        var v = sum();
        if (is('rp')) p++;
        else if (p < toks.length) throw new SErr('Error 1');
        return v;
      }
      if (t.k === 'pre' || t.k === 'neg') { p--; return prefix(); }
      throw new SErr('Error 1');
    }
    var out = sum();
    if (p < toks.length) throw new SErr('Error 1');
    if (!isFinite(out) || Math.abs(out) >= 1e100) throw new SErr('Error 2');
    return sig(out, 14);
  };
  /* A result shows as a fraction when a fraction was keyed and only arithmetic was done. It shows in degrees,
     minutes and seconds when D°M′S values were keyed and no function or plain number was added or subtracted
     (Calculation Examples [8] and [10]). */
  Calc.prototype.formOf = function (toks, v) {
    var hasFrac = toks.some(function (t) { return t.frac; }), hasDms = toks.some(function (t) { return t.dms; });
    /* a plain decimal number keyed with a fraction gives a decimal result (Calculation Examples [8]: 1.25 + 2/5 = 1.65) */
    var hasDec = toks.some(function (t) { return t.k === 'num' && !t.frac && !t.dms && /\.|E/.test(t.s); });
    /* the first fraction keyed sets the form: 7┌5 (improper) gives 16807┌3125, 3┌1┌2 gives 4┌5┌6 (Calculation Examples [8]) */
    var firstFr = toks.filter(function (t) { return t.frac; })[0], imp = !!(firstFr && firstFr.imp);
    var fnUsed = toks.some(function (t) { return t.k === 'pre' && t.fn !== 'sqrt'; });
    if (hasFrac && !fnUsed && !hasDec && !hasDms) {
      var fr = toFrac(v);
      if (fr && fracDigits(fr) <= 10) return { form: fr[1] === 1 ? 'dec' : 'frac', fr: fr, imp: imp };
    }
    if (hasDms && !toks.some(function (t) { return t.k === 'pre' || t.k === 'post'; })) {
      var mixed = false;
      toks.forEach(function (t, i) {
        if (t.k === 'num' && !t.dms) {
          var prev = toks[i - 1], next = toks[i + 1];
          if ((prev && prev.k === 'op' && (prev.op === 'add' || prev.op === 'sub')) || (next && next.k === 'op' && (next.op === 'add' || next.op === 'sub'))) mixed = true;
        }
      });
      if (!mixed) return { form: 'dms' };
    }
    return { form: 'dec' };
  };
  var PRE_TXT = { sin: 'sin', cos: 'cos', tan: 'tan', asin: 'sin⁻¹', acos: 'cos⁻¹', atan: 'tan⁻¹', sqrt: '√', cbrt: '³√', log: 'log', ln: 'ln', tenx: '10^', ex: 'e^' };
  Calc.prototype.eqText = function (toks) {
    var s = '';
    toks.forEach(function (t) {
      switch (t.k) {
        case 'num': s += t.s; break;
        case 'op': s += { add: '+', sub: '−', mul: '×', div: '÷' }[t.op]; break;
        case 'lp': s += '('; break;
        case 'rp': s += ')'; break;
        case 'pi': s += 'π'; break;
        case 'var': s += t.name; break;
        case 'ans': s += 'ANS'; break;
        case 'neg': s += '−'; break;
        case 'pow': s += '^'; break;
        case 'root': s += 'ˣ√'; break;
        case 'ncr': s += 'C'; break;
        case 'npr': s += 'P'; break;
        case 'comma': s += ','; break;
        case 'fbar': s += '┌'; break;
        case 'post': s += { sq: '²', cube: '³', inv: '⁻¹', fact: '!' }[t.fn]; break;
        case 'pre': s += (t.h === 'arc' ? 'arc' : '') + (PRE_TXT[t.fn] || t.fn) + (t.h ? 'h' : ''); break;
      }
    });
    return s;
  };
  /* = and the other calculation-ending keys */
  Calc.prototype.finishEq = function (endText) {
    this.closeNum();
    var toks = this.eq;
    if (this.state === 'result') return this.result.v;
    /* a function keyed straight after a result, with nothing after it, works on that result (Calculation Examples [7]: √ANS) */
    if (toks.length && toks[toks.length - 1].k === 'pre') toks.push({ k: 'ans' });
    var v = this.evaluate(toks);
    var f = this.formOf(toks, v);
    this.result = { v: v, form: f.form, fr: f.fr, imp: !!f.imp };
    this.ans = v;
    this.top = this.eqText(toks) + (endText === undefined ? '=' : endText);
    this.state = 'result';
    return v;
  };
  Calc.prototype.percent = function () {
    /* 2ndF %, from Calculation Examples [4]: a×b% = a×b÷100, a÷b% = a÷b×100, a+b% = a+a×b÷100, a−b% = a−a×b÷100 */
    this.closeNum();
    var toks = this.eq, i = toks.length - 1, depth = 0;
    for (; i >= 0; i--) {
      var t = toks[i];
      if (t.k === 'rp') depth++;
      else if (t.k === 'lp') depth--;
      else if (depth === 0 && t.k === 'op') break;
    }
    var b = this.evaluate(toks.slice(i + 1)), v;
    if (i < 0) v = b / 100;
    else {
      var a = this.evaluate(toks.slice(0, i)), op = toks[i].op;
      v = op === 'mul' ? a * b / 100 : op === 'div' ? a / b * 100 : op === 'add' ? a + a * b / 100 : a - a * b / 100;
    }
    v = sig(v, 14);
    this.top = this.eqText(toks) + '%';
    this.result = { v: v, form: 'dec' };
    this.ans = v; this.state = 'result';
  };
  Calc.prototype.coord = function (kind) {
    this.closeNum();
    var toks = this.eq, at = -1;
    toks.forEach(function (t, i) { if (t.k === 'comma') at = i; });
    if (at < 0) throw new SErr('Error 1');
    var a = this.evaluate(toks.slice(0, at)), b = this.evaluate(toks.slice(at + 1)), r1, r2;
    if (kind === 'rp') { r1 = Math.sqrt(a * a + b * b); r2 = this.fromRad(Math.atan2(b, a)); }
    else { var th = this.toRad(b); r1 = clean(a * Math.cos(th)); r2 = clean(a * Math.sin(th)); }
    r1 = sig(r1, 14); r2 = sig(r2, 14);
    /* the results go to memories X and Y (Coordinate Conversions) */
    this.mem.X = r1; this.mem.Y = r2;
    this.top = this.eqText(toks);
    this.result = { v: r1, form: 'dec' };
    this.coordShown = { kind: kind, which: 0 };
    this.ans = r1; this.state = 'result';
  };

  /* ---------- keys ---------- */
  Calc.prototype.press = function (key) {
    if (!KEYS[key]) throw new Error('Unknown Sharp key: ' + key);
    if (this.off) { if (key === 'onc') { this.off = false; this.clearEntry(); this.state = 'result'; this.result = { v: 0, form: 'dec' }; this.top = ''; } return; }
    if (this.err) { if (key === 'onc') { this.clearEntry(); this.state = 'result'; this.result = { v: 0, form: 'dec' }; this.top = ''; } return; }
    try { this.key(key); } catch (e) {
      if (e instanceof SErr) { this.err = e.kind; this.second = false; this.alpha = false; }
      else throw e;
    }
  };
  Calc.prototype.key = function (key) {
    var sec = this.second;
    if (this.await) {
      var aw = this.await; this.await = null;
      var letter = LETTER[key];
      if (!letter) return;
      if (aw === 'sto') {
        var v = this.state === 'entry' ? this.finishEq('⇒' + letter) : this.result.v;
        this.mem[letter] = v;
        if (!/⇒[A-Z]$/.test(this.top)) this.top = this.fmtPlain(v) + '⇒' + letter;
        return;
      }
      if (aw === 'rcl' && this.state === 'result') {
        /* RCL on its own shows the memory (Memory Calculations, example 1: RCL M shows M=) */
        this.eq = [{ k: 'var', name: letter }]; this.state = 'entry';
        return;
      }
      this.startEq(false);
      this.push({ k: 'var', name: letter });
      return;
    }
    if (key === '2ndf') { this.second = !this.second; this.alpha = false; return; }
    if (key === 'alpha') { if (sec) { this.second = false; return; } this.alpha = !this.alpha; this.await = this.alpha ? 'alpha' : null; return; }
    this.second = false; this.alpha = false;
    if (key === 'onc') {
      if (sec) { this.off = true; return; }
      this.clearEntry(); this.state = 'result'; this.result = { v: 0, form: 'dec' }; this.top = '';
      return;
    }
    if (/^d[0-9]$/.test(key) && sec) {
      var sk = { d8: 'rp', d9: 'xy', d4: 'fact', d5: 'ncr', d6: 'npr', d1: 'pct' }[key];
      if (sk === 'rp' || sk === 'xy') { this.coord(sk); return; }
      if (sk === 'fact') { this.startEq(true); this.push({ k: 'post', fn: 'fact' }); return; }
      if (sk === 'ncr' || sk === 'npr') { this.startEq(true); this.push({ k: sk }); return; }
      if (sk === 'pct') { this.percent(); return; }
      return;
    }
    if (/^d[0-9]$/.test(key)) { this.digit(key.slice(1)); return; }
    switch (key) {
      case 'dot': this.digit('.'); return;
      case 'exp':
        if (sec) { /* ← , → shows the other coordinate result */
          if (this.coordShown) {
            this.coordShown.which = 1 - this.coordShown.which;
            this.result = { v: this.coordShown.which ? this.mem.Y : this.mem.X, form: 'dec' };
          }
          return;
        }
        if (!this.num) this.digit('1');
        if (this.num.kind === 'dec' && this.num.exp === null) this.num.exp = '';
        return;
      case 'neg':
        if (sec) { this.mem = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, X: 0, Y: 0, M: 0 }; return; }
        if (this.num && this.num.exp !== null) { this.num.expNeg = !this.num.expNeg; return; }
        if (this.num) { this.num.neg = !this.num.neg; return; }
        this.startEq(false);
        this.eq.push({ k: 'neg' });
        return;
      case 'abc':
        if (sec) { if (this.state === 'result' && this.result.form === 'frac') this.result.imp = !this.result.imp; return; }
        if (this.num && this.num.kind !== 'dms' && this.num.exp === null && this.num.parts.length < 3) {
          this.num.kind = 'frac'; this.num.parts.push(''); return;
        }
        /* a b/c after a D°M′S value divides it, as a fraction (Calculation Examples [8]: 1°2′3″ over 2) */
        if (this.num && this.num.kind === 'dms') { this.push({ k: 'fbar' }); return; }
        if (this.state === 'result') {
          /* a b/c on a result switches between fraction and decimal (Fractional Calculations) */
          if (this.result.form === 'frac') this.result = { v: this.result.v, form: 'dec', wasFr: this.result.fr };
          else { var fr = this.result.wasFr || toFrac(this.result.v); if (fr && fr[1] !== 1 && fracDigits(fr) <= 10) this.result = { v: this.result.v, form: 'frac', fr: fr, imp: false }; }
        }
        return;
      case 'dms':
        if (sec) { /* ↔DEG */
          if (this.state === 'entry') this.finishEq('=');
          this.result = { v: this.result.v, form: this.result.form === 'dms' ? 'dec' : 'dms' };
          return;
        }
        if (!this.num) this.digit('0');
        if (this.num.kind === 'dec' && this.num.exp === null && this.num.parts.length === 1) { this.num.kind = 'dms'; this.num.parts.push(''); return; }
        if (this.num.kind === 'dms' && this.num.parts.length < 3) { this.num.parts.push(''); return; }
        return;
      case 'pi':
        if (sec) { /* DRG▸ changes the value to the next angle unit and switches to it (Calculation Examples [5]) */
          if (this.state === 'entry') this.finishEq('=');
          var v0 = this.result.v, to = NEXT[this.angle], r;
          if (this.angle === 'DEG') r = v0 * PI / 180; else if (this.angle === 'RAD') r = v0 * 200 / PI; else r = v0 * 0.9;
          this.angle = to; r = sig(r, 14);
          this.result = { v: r, form: 'dec' }; this.ans = r;
          return;
        }
        this.startEq(false); this.push({ k: 'pi' }); return;
      case 'drg': this.angle = NEXT[this.angle]; return;
      case 'hyp':
        if (sec) { this.arcHyp = true; this.hypOn = false; } else { this.hypOn = true; this.arcHyp = false; }
        return;
      case 'sin': case 'cos': case 'tan': {
        this.startEq(false);
        var fnm = key, h = null;
        if (this.hypOn) h = 'hyp'; else if (this.arcHyp) h = 'arc'; else if (sec) fnm = 'a' + key;
        this.hypOn = false; this.arcHyp = false;
        this.push({ k: 'pre', fn: fnm, h: h });
        return;
      }
      case 'sqrt': this.startEq(false); this.push({ k: 'pre', fn: 'sqrt' }); return;
      case 'log': this.startEq(false); this.push({ k: 'pre', fn: sec ? 'tenx' : 'log' }); return;
      case 'ln': this.startEq(false); this.push({ k: 'pre', fn: sec ? 'ex' : 'ln' }); return;
      case 'cube':
        if (sec) { this.startEq(false); this.push({ k: 'pre', fn: 'cbrt' }); return; }
        this.startEq(true); this.push({ k: 'post', fn: 'cube' }); return;
      case 'sq': this.startEq(true); this.push({ k: 'post', fn: sec ? 'inv' : 'sq' }); return;
      case 'pow': this.startEq(true); this.push({ k: sec ? 'root' : 'pow' }); return;
      case 'add': case 'sub': case 'mul': case 'div': this.startEq(true); this.push({ k: 'op', op: key }); return;
      case 'lp': this.startEq(false); this.push({ k: 'lp' }); return;
      case 'rp': this.startEq(true); this.push({ k: 'rp' }); return;
      case 'eq':
        if (this.state === 'result') return;
        this.finishEq('='); return;
      case 'sto':
        if (sec) { this.startEq(true); this.push({ k: 'comma' }); return; }
        this.await = 'sto'; return;
      case 'rcl': this.await = 'rcl'; return;
      case 'mplus': {
        var mv = this.state === 'entry' ? this.finishEq(sec ? 'M−' : 'M+') : this.result.v;
        this.mem.M = sig(this.mem.M + (sec ? -mv : mv), 14);
        return;
      }
      case 'del':
        if (this.num) {
          var nn = this.num, li = nn.parts.length - 1;
          if (nn.exp !== null) { if (nn.exp.length) nn.exp = nn.exp.slice(0, -1); else nn.exp = null; }
          else if (nn.parts[li].length) nn.parts[li] = nn.parts[li].slice(0, -1);
          else if (li > 0) nn.parts.pop();
          else this.num = null;
          return;
        }
        if (this.state === 'entry') this.eq.pop();
        return;
      case 'home': case 'mode': this.clearEntry(); this.state = 'result'; this.result = { v: 0, form: 'dec' }; this.top = ''; return;
      case 'setup': return;
    }
  };

  /* ---------- display ---------- */
  function group(intStr) { return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, '’'); }
  /* NORM1 (the default): 10 digits, plain notation for 0.000000001 to 9999999999 ("Setting the Floating Point Numbers System") */
  function fmtNorm(v) {
    if (v === 0) return { main: '0.', exp: '' };
    var a = Math.abs(v), sg = v < 0 ? '-' : '';
    var r = Number(a.toPrecision(10));
    if (r >= 1e-9 && r <= 9999999999) {
      var intDigits = r >= 1 ? Math.floor(Math.log10(r) + 1e-12) + 1 : 1;
      var dec = Math.max(0, 10 - intDigits);
      var s = r.toFixed(Math.min(20, dec + 2));
      var ip = s.split('.')[0], fp = (s.split('.')[1] || '').slice(0, dec).replace(/0+$/, '');
      return { main: sg + group(ip) + '.' + fp, exp: '' };
    }
    var e = Math.floor(Math.log10(r)), m = r / Math.pow(10, e);
    if (Number(m.toPrecision(10)) >= 10) { e += 1; m = r / Math.pow(10, e); }
    var ms = Number(m.toPrecision(10)).toString();
    if (ms.indexOf('.') < 0) ms += '.';
    return { main: sg + ms, exp: String(e) };
  }
  function fmtDms(v) {
    var sg = v < 0 ? '-' : '', a = Math.abs(v);
    var d = Math.floor(a + 1e-12), mr = (a - d) * 60, m = Math.floor(mr + 1e-9), s = sig((mr - m) * 60, 10);
    if (s >= 60 - 1e-7) { s = 0; m += 1; }
    if (m >= 60) { m = 0; d += 1; }
    var ss = String(Number(s.toFixed(Math.max(0, 8 - String(d).length - String(m).length))));
    return sg + d + '°' + m + '′' + ss + '″';
  }
  function fmtFrac(fr, imp) {
    var n = fr[0], d = fr[1], sg = n < 0 ? '-' : '';
    n = Math.abs(n);
    if (d === 1) return sg + n + '.';
    if (imp || n < d) return sg + n + '┌' + d;
    var w = Math.floor(n / d);
    return sg + w + '┌' + (n - w * d) + '┌' + d;
  }
  Calc.prototype.fmtPlain = function (v) { return fmtNorm(v).main.replace(/’/g, ''); };
  Calc.prototype.display = function () {
    var ind = { second: this.second, hyp: this.hypOn || this.arcHyp, arc: this.arcHyp, alpha: this.alpha || this.await === 'alpha', angle: this.angle,
      m: this.mem.M !== 0, sto: this.await === 'sto', rcl: this.await === 'rcl' };
    if (this.off) return { top: '', main: '', exp: '', ind: {}, off: true };
    if (this.err) return { top: '', main: this.err, exp: '', ind: ind, error: this.err };
    if (this.state === 'entry') {
      var top = this.eqText(this.eq), main = '0.', exp = '';
      if (this.num) {
        var n = this.num;
        if (n.kind === 'dms') main = n.parts[0] + '°' + (n.parts.length > 1 ? n.parts[1] + '′' : '') + (n.parts.length > 2 ? n.parts[2] + '″' : '');
        else if (n.kind === 'frac') main = n.parts.join('┌');
        else { main = (n.parts[0] || '0'); exp = n.exp !== null ? (n.expNeg ? '-' : '') + ('0' + n.exp).slice(-2) : ''; }
        if (n.neg) main = '-' + main;
      } else if (this.eq.length === 1 && this.eq[0].k === 'var') {
        main = fmtNorm(this.mem[this.eq[0].name]).main;
        top = this.eq[0].name + '=';
      } else {
        main = fmtNorm(this.result.v).main;
      }
      return { top: top, main: main, exp: exp, ind: ind, entry: true };
    }
    var r = this.result, f;
    if (r.form === 'frac' && r.fr) f = { main: fmtFrac(r.fr, r.imp), exp: '' };
    else if (r.form === 'dms') f = { main: fmtDms(r.v), exp: '' };
    else f = fmtNorm(r.v);
    var label = this.coordShown ? (this.coordShown.kind === 'rp' ? ['r=', 'θ='] : ['x=', 'y='])[this.coordShown.which] : null;
    return { top: label || this.top, main: f.main, exp: f.exp, ind: ind, form: r.form };
  };
  Calc.prototype.value = function () {
    if (this.state === 'entry') {
      if (this.num) {
        var keepEq = this.eq.slice(), n = this.num;
        this.num = JSON.parse(JSON.stringify(n));
        this.closeNum();
        var t = this.eq.pop();
        this.eq = keepEq; this.num = n;
        return t.v;
      }
      if (this.eq.length === 1 && this.eq[0].k === 'var') return this.mem[this.eq[0].name];
      return this.result.v;
    }
    return this.result.v;
  };
  Calc.prototype.text = function () { var d = this.display(); return d.main + (d.exp ? ' ' + d.exp : ''); };
  Calc.prototype.run = function (keys) { var self = this; keys.forEach(function (k) { self.press(k); }); return this.display(); };

  return { Calc: Calc, KEYS: KEYS, LAYOUT: LAYOUT, LETTER: LETTER, LETTER_KEY: LETTER_KEY, fmtDms: fmtDms, fmtNorm: fmtNorm };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = SharpEL;
