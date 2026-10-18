/* TI-30Xa emulator engine.
   Behaviour follows the TI-30Xa guidebook (education.ti.com, 30xa-eng.pdf).
   Exposed as window.TI30 in the browser and module.exports in node. */
(function (root) {
  'use strict';

  var PI12 = 3.14159265359;
  var SEP = '⌟';
  var MAXV = 9.999999999e99;

  /* Faceplate layout, top row first. Each key is [id, primary label, 2nd label]. */
  var LAYOUT = {
    top: [
      [['2nd', '2nd', ''], ['drg', 'DRG', 'DRG\u25B8'], ['log', 'LOG', '10\u02E3'], ['ln', 'LN', 'e\u02E3'], ['off', 'OFF', '']],
      [['hyp', 'HYP', 'K'], ['sin', 'SIN', 'SIN\u207B\u00B9'], ['cos', 'COS', 'COS\u207B\u00B9'], ['tan', 'TAN', 'TAN\u207B\u00B9'], ['pow', 'y\u02E3', '\u02E3\u221Ay']]
    ],
    left: [
      [['pi', '\u03C0', 'x\u21C4y'], ['inv', '1/x', 'FRQ'], ['sq', 'x\u00B2', 'x\u0304'], ['sqrt', '\u221Ax', '\u03C3xn-1']],
      [['sigma', '\u03A3+', '\u03A3\u2212'], ['ee', 'EE', 'n'], ['lp', '(', '\u03A3x'], ['rp', ')', '\u03A3x\u00B2']],
      [['sto', 'STO', 'EXC'], ['d7', '7', 'CSR'], ['d8', '8', 'nCr'], ['d9', '9', 'nPr']],
      [['rcl', 'RCL', 'SUM'], ['d4', '4', 'FLO'], ['d5', '5', 'SCI'], ['d6', '6', 'ENG']],
      [['abc', 'a b/c', 'd/c'], ['d1', '1', 'x\u00B3'], ['d2', '2', '%'], ['d3', '3', 'x!']],
      [['back', '\u2190', 'F\u21C4D'], ['d0', '0', '\u00B3\u221Ax'], ['dot', '.', 'FIX'], ['neg', '+\u21C4\u2212', '']]
    ],
    right: [['div', '\u00F7', '\u03C3xn'], ['mul', '\u00D7', 'P\u25B8R'], ['sub', '\u2212', 'R\u25B8P'], ['add', '+', 'DMS\u25B8DD'], ['eq', '=', 'DD\u25B8DMS']],
    onc: ['onc', 'ON/C', '']
  };
  var KEYS = {};
  function addKey(k) { KEYS[k[0]] = [k[1], k[2]]; }
  LAYOUT.top.concat(LAYOUT.left).forEach(function (row) { row.forEach(addKey); });
  LAYOUT.right.forEach(addKey);
  addKey(LAYOUT.onc);

  /* 2nd functions by key id */
  var SECOND = {
    drg: 'drgconv', log: 'tenx', ln: 'ex', hyp: 'konst', sin: 'asin', cos: 'acos', tan: 'atan', pow: 'root',
    pi: 'xy', inv: 'frq', sq: 'mean', sqrt: 'sdn1', div: 'sdn', sigma: 'sminus', ee: 'n', lp: 'sx', rp: 'sx2',
    mul: 'p2r', sto: 'exc', d7: 'csr', d8: 'ncr', d9: 'npr', sub: 'r2p', rcl: 'sum', d4: 'flo', d5: 'sci',
    d6: 'eng', add: 'dmsdd', abc: 'dc', d1: 'cube', d2: 'pct', d3: 'fact', back: 'fd', d0: 'cbrt', dot: 'fix', eq: 'dddms'
  };
  var PREC = { add: 1, sub: 1, mul: 2, div: 2, pow: 3, root: 3, ncr: 4, npr: 4 };

  function sig13(v) { return (v === 0 || !isFinite(v)) ? v : Number(v.toPrecision(13)); }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }
  function rat(n, d) {
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d);
    return [n / g, d / g];
  }
  function isInt(v) { return Math.abs(v - Math.round(v)) < 1e-9 && Math.abs(v) < 1e15; }
  function V(v) { return { v: v, r: null, fr: false, imp: false }; }
  function I(n) { return { v: n, r: [n, 1], fr: false, imp: false }; }
  function F(n, d) {
    var r = rat(n, d);
    return { v: r[0] / r[1], r: r, fr: r[1] !== 1, imp: false };
  }

  function CalcError(msg) { this.msg = msg; }

  function Calc() { this.memory = [0, 0, 0]; this.powerOn(); }

  Calc.prototype.powerOn = function () {
    this.off = false;
    this.angle = 'DEG';
    this.notation = 'FLO';
    this.fix = null;
    this.stat = { n: 0, sx: 0, sx2: 0 };
    this.clearAll();
  };

  Calc.prototype.clearAll = function () {
    this.x = I(0);
    this.entry = null;
    this.ops = [];
    this.K = null;
    this.t = 0;
    this.err = false;
    this.second = false;
    this.hyp = false;
    this.await = null;
    this.frqData = null;
    this.override = null;
    this.coord = '';
    this.lastKey = null;
    this.lastWasOp = false;
  };

  /* ---------- entry ---------- */
  Calc.prototype.newEntry = function () {
    this.entry = { parts: [''], neg: false, ee: null, eeNeg: false };
    this.lastWasOp = false;
  };
  Calc.prototype.entryCur = function () { return this.entry.parts[this.entry.parts.length - 1]; };
  Calc.prototype.digit = function (ch) {
    if (!this.entry) this.newEntry();
    var e = this.entry;
    if (e.ee !== null) { e.ee = (e.ee + ch).slice(-2); return; }
    var cur = this.entryCur();
    var count = e.parts.join('').replace(/[^0-9]/g, '').length;
    if (count >= 10) return;
    if (ch === '.') {
      if (e.parts.length > 1 || cur.indexOf('.') >= 0) return;
      if (cur === '') cur = '0';
      e.parts[e.parts.length - 1] = cur + '.';
      return;
    }
    if (cur === '0') cur = '';
    e.parts[e.parts.length - 1] = cur + ch;
  };
  Calc.prototype.entryValue = function () {
    var e = this.entry, sgn = e.neg ? -1 : 1;
    if (e.parts.length > 1) {
      var p = e.parts.map(function (s) { return parseInt(s || '0', 10); });
      var w = 0, n, d;
      if (p.length === 3) { w = p[0]; n = p[1]; d = p[2]; } else { n = p[0]; d = p[1]; }
      if (d === 0 || d > 999) throw new CalcError('denominator');
      var val = F(sgn * (w * d + n), d);
      val.fr = true;
      val.imp = (p.length === 2 && n >= d);
      return val;
    }
    var s = e.parts[0] || '0';
    var v = parseFloat(s);
    if (e.ee !== null) v = v * Math.pow(10, (e.eeNeg ? -1 : 1) * parseInt(e.ee || '0', 10));
    v = sgn * v;
    if (e.ee === null && s.indexOf('.') < 0) return I(v);
    return V(sig13(v));
  };
  Calc.prototype.finish = function () {
    if (this.entry) { this.x = this.entryValue(); this.entry = null; }
    return this.x;
  };

  /* ---------- checks ---------- */
  function chk(v) {
    if (typeof v !== 'number' || isNaN(v) || Math.abs(v) > MAXV) throw new CalcError('overflow');
    if (Math.abs(v) < 1e-99) return 0;
    return sig13(v);
  }
  Calc.prototype.setX = function (v) { this.x = V(chk(v)); };
  Calc.prototype.toRad = function (a) {
    if (this.angle === 'DEG') return a * Math.PI / 180;
    if (this.angle === 'GRAD') return a * Math.PI / 200;
    return a;
  };
  Calc.prototype.fromRad = function (a) {
    if (this.angle === 'DEG') return a * 180 / Math.PI;
    if (this.angle === 'GRAD') return a * 200 / Math.PI;
    return a;
  };
  function clean(v) { return Math.abs(v) < 1e-12 ? 0 : v; }

  /* ---------- binary operations ---------- */
  function apply(op, a, b) {
    var v, r = null, both = a.r && b.r;
    switch (op) {
      case 'add': v = a.v + b.v; if (both) r = rat(a.r[0] * b.r[1] + b.r[0] * a.r[1], a.r[1] * b.r[1]); break;
      case 'sub': v = a.v - b.v; if (both) r = rat(a.r[0] * b.r[1] - b.r[0] * a.r[1], a.r[1] * b.r[1]); break;
      case 'mul': v = a.v * b.v; if (both) r = rat(a.r[0] * b.r[0], a.r[1] * b.r[1]); break;
      case 'div':
        if (b.v === 0) throw new CalcError('div0');
        v = a.v / b.v; if (both) r = rat(a.r[0] * b.r[1], a.r[1] * b.r[0]); break;
      case 'pow':
        if (a.v === 0 && b.v === 0) throw new CalcError('pow');
        if (a.v < 0 && !isInt(b.v)) throw new CalcError('pow');
        if (a.v === 0 && b.v < 0) throw new CalcError('div0');
        v = Math.pow(a.v, b.v); break;
      case 'root':
        if (b.v === 0) throw new CalcError('root');
        if (a.v < 0) {
          if (!(isInt(b.v) && Math.abs(Math.round(b.v)) % 2 === 1)) throw new CalcError('root');
          v = -Math.pow(-a.v, 1 / b.v);
        } else v = Math.pow(a.v, 1 / b.v);
        break;
      case 'ncr':
      case 'npr':
        if (!isInt(a.v) || !isInt(b.v) || a.v < 0 || b.v < 0 || b.v > a.v) throw new CalcError('ncr');
        var n = Math.round(a.v), k = Math.round(b.v), p = 1, i;
        if (op === 'npr') { for (i = 0; i < k; i++) p *= (n - i); }
        else { k = Math.min(k, n - k); for (i = 1; i <= k; i++) p = p * (n - k + i) / i; p = Math.round(p); }
        v = p; break;
    }
    v = chk(v);
    var out = V(v);
    if (r && (op === 'add' || op === 'sub' || op === 'mul' || op === 'div')) {
      if (a.fr || b.fr) {
        if (r[1] <= 999) { out.r = r; out.fr = r[1] !== 1; }
      } else if (r[1] === 1) out.r = r;
    }
    return out;
  }

  Calc.prototype.pendingCount = function () {
    return this.ops.filter(function (o) { return o !== '('; }).length;
  };
  Calc.prototype.reduceTo = function (prec) {
    while (this.ops.length) {
      var top = this.ops[this.ops.length - 1];
      if (top === '(' || PREC[top.op] < prec) break;
      this.ops.pop();
      this.x = apply(top.op, top.a, this.x);
    }
  };
  Calc.prototype.binary = function (op) {
    var self = this;
    if (this.lastWasOp && this.ops.length && this.ops[this.ops.length - 1] !== '(') {
      this.ops[this.ops.length - 1].op = op;
      return;
    }
    this.finish();
    this.K = null;
    this.reduceTo(PREC[op]);
    var lim = this.stat.n > 0 ? 2 : 4;
    if (this.pendingCount() + 1 > lim) throw new CalcError('pending');
    this.ops.push({ op: op, a: self.x });
    this.lastWasOp = true;
  };
  Calc.prototype.lparen = function () {
    var opens = this.ops.filter(function (o) { return o === '('; }).length;
    if (opens >= 15) throw new CalcError('paren');
    this.entry = null;
    this.ops.push('(');
    this.lastWasOp = true;
  };
  Calc.prototype.rparen = function () {
    this.finish();
    this.reduceTo(0);
    if (this.ops.length && this.ops[this.ops.length - 1] === '(') this.ops.pop();
  };
  Calc.prototype.equals = function () {
    this.finish();
    if (!this.ops.length && this.K) { this.x = apply(this.K.op, this.x, this.K.b); return; }
    while (this.ops.length) {
      var top = this.ops.pop();
      if (top !== '(') this.x = apply(top.op, top.a, this.x);
    }
  };

  /* ---------- single-variable functions ---------- */
  Calc.prototype.unary = function (fn) {
    var x = this.finish(), v = x.v, r, h = this.hyp;
    this.hyp = false;
    switch (fn) {
      case 'sq': r = v * v; break;
      case 'cube': r = v * v * v; break;
      case 'sqrt': if (v < 0) throw new CalcError('sqrt'); r = Math.sqrt(v); break;
      case 'cbrt': r = Math.cbrt(v); break;
      case 'inv': if (v === 0) throw new CalcError('div0'); r = 1 / v; break;
      case 'log': if (v <= 0) throw new CalcError('log'); r = Math.log10(v); break;
      case 'ln': if (v <= 0) throw new CalcError('ln'); r = Math.log(v); break;
      case 'tenx': r = Math.pow(10, v); break;
      case 'ex': r = Math.exp(v); break;
      case 'fact':
        if (!isInt(v) || v < 0 || v > 69) throw new CalcError('fact');
        r = 1; for (var i = 2; i <= Math.round(v); i++) r *= i; break;
      case 'sin': r = h ? Math.sinh(v) : clean(Math.sin(this.toRad(v))); break;
      case 'cos': r = h ? Math.cosh(v) : clean(Math.cos(this.toRad(v))); break;
      case 'tan':
        if (h) { r = Math.tanh(v); break; }
        var q = this.angle === 'DEG' ? 90 : (this.angle === 'GRAD' ? 100 : null);
        if (q !== null && isInt(v / q) && Math.round(v / q) % 2 !== 0) throw new CalcError('tan');
        var c = Math.cos(this.toRad(v));
        if (Math.abs(c) < 1e-13) throw new CalcError('tan');
        r = clean(Math.tan(this.toRad(v))); break;
      case 'asin':
        if (h) { r = Math.asinh(v); break; }
        if (Math.abs(v) > 1) throw new CalcError('asin'); r = this.fromRad(Math.asin(v)); break;
      case 'acos':
        if (h) { if (v < 1) throw new CalcError('acosh'); r = Math.acosh(v); break; }
        if (Math.abs(v) > 1) throw new CalcError('acos'); r = this.fromRad(Math.acos(v)); break;
      case 'atan':
        if (h) { if (Math.abs(v) >= 1) throw new CalcError('atanh'); r = Math.atanh(v); break; }
        r = this.fromRad(Math.atan(v)); break;
      case 'dmsdd':
        var sg = v < 0 ? -1 : 1, a = Math.abs(v), d = Math.floor(a + 1e-12);
        var rest = Math.round((a - d) * 100 * 1e9) / 1e9, m = Math.floor(rest + 1e-12);
        var s = (rest - m) * 100;
        r = sg * (d + m / 60 + s / 3600); break;
      case 'pct':
        var top = this.ops.length ? this.ops[this.ops.length - 1] : null;
        if (top && top !== '(' && (top.op === 'add' || top.op === 'sub')) r = top.a.v * v / 100;
        else r = v / 100;
        break;
    }
    this.setX(r);
  };

  /* ---------- statistics ---------- */
  Calc.prototype.statAdd = function (sign) {
    var x = this.finish().v, data = x, f = 1;
    if (this.frqData !== null) { data = this.frqData; f = Math.round(x); this.frqData = null; }
    if (Math.abs(data) >= 1e64) throw new CalcError('stat');
    var st = this.stat;
    if (sign < 0 && st.n - f <= 0) throw new CalcError('stat');
    st.n += sign * f; st.sx += sign * f * data; st.sx2 += sign * f * data * data;
    this.x = I(st.n);
    this.override = { label: 'n=' };
  };
  Calc.prototype.statGet = function (what) {
    this.finish();
    var st = this.stat, n = st.n, r;
    if (what === 'n') r = n;
    else if (what === 'sx') r = st.sx;
    else if (what === 'sx2') r = st.sx2;
    else {
      if (n === 0) throw new CalcError('stat');
      var mean = st.sx / n;
      if (what === 'mean') r = mean;
      else {
        var ss = Math.max(0, st.sx2 - st.sx * st.sx / n);
        if (what === 'sdn') r = Math.sqrt(ss / n);
        else { if (n < 2) throw new CalcError('stat'); r = Math.sqrt(ss / (n - 1)); }
      }
    }
    this.setX(r);
  };

  /* ---------- angle units and coordinates ---------- */
  var NEXT = { DEG: 'RAD', RAD: 'GRAD', GRAD: 'DEG' };
  Calc.prototype.drgConvert = function () {
    var v = this.finish().v, to = NEXT[this.angle], r;
    if (this.angle === 'DEG') r = v * Math.PI / 180;
    else if (this.angle === 'RAD') r = v * 200 / Math.PI;
    else r = v * 0.9;
    this.angle = to;
    this.setX(r);
  };
  Calc.prototype.coordConvert = function (kind) {
    var b = this.finish().v, a = this.t, r1, r2;
    if (kind === 'r2p') { r1 = Math.sqrt(a * a + b * b); r2 = this.fromRad(Math.atan2(b, a)); this.coord = 'r'; }
    else { var th = this.toRad(b); r1 = a * Math.cos(th); r2 = a * Math.sin(th); r1 = clean(r1); r2 = clean(r2); this.coord = 'x'; }
    this.setX(r1);
    this.t = chk(r2);
  };
  Calc.prototype.swapXY = function () {
    var v = this.finish().v, t = this.t;
    this.t = v;
    this.setX(t);
  };

  /* ---------- fractions ---------- */
  function toFrac(v) {
    for (var d = 1; d <= 999; d++) {
      var n = Math.round(v * d);
      if (Math.abs(n / d - v) <= 1e-10 * Math.max(1, Math.abs(v))) return rat(n, d);
    }
    return null;
  }
  Calc.prototype.fracDec = function () {
    var x = this.finish();
    if (x.fr) { this.x = V(x.v); this.x.wasFr = x.r; return; }
    if (this.fix === 0) return;
    var r = x.wasFr || toFrac(x.v);
    if (r && r[1] !== 1) this.x = { v: x.v, r: r, fr: true, imp: false };
  };
  Calc.prototype.toggleImp = function () {
    var x = this.finish();
    if (x.fr) x.imp = !x.imp;
  };

  /* ---------- memory ---------- */
  Calc.prototype.memOp = function (kind, n) {
    var i = n - 1, x = this.finish().v;
    if (kind === 'sto') this.memory[i] = x;
    else if (kind === 'rcl') this.setX(this.memory[i]);
    else if (kind === 'sum') this.memory[i] = chk(this.memory[i] + x);
    else if (kind === 'exc') { var m = this.memory[i]; this.memory[i] = x; this.setX(m); }
  };

  /* ---------- key handler ---------- */
  Calc.prototype.press = function (key) {
    if (!KEYS[key]) throw new Error('Unknown key: ' + key);
    var wasOnc = this.lastKey === 'onc';
    this.lastKey = key;
    if (this.off) { if (key === 'onc') this.powerOn(); return; }
    if (key === 'onc') {
      if (this.err || wasOnc) { this.clearAll(); this.lastKey = 'onc'; return; }
      this.entry = null; this.x = I(0); this.K = null; this.second = false; this.hyp = false;
      this.await = null; this.override = null; this.coord = '';
      return;
    }
    if (this.err) return;
    if (key === 'off') { this.off = true; return; }
    this.override = null;
    try { this.dispatch(key); } catch (e) {
      if (e instanceof CalcError) { this.err = e.msg; this.second = false; this.hyp = false; this.await = null; }
      else throw e;
    }
  };

  Calc.prototype.dispatch = function (key) {
    if (this.await) {
      var aw = this.await;
      this.await = null;
      if (aw === 'fix') {
        if (key === 'dot') { this.fix = null; return; }
        if (/^d[0-9]$/.test(key)) { this.fix = parseInt(key.slice(1), 10); return; }
      } else if (/^d[1-3]$/.test(key)) { this.memOp(aw, parseInt(key.slice(1), 10)); return; }
    }
    if (key === '2nd') { this.second = !this.second; return; }
    var act = key;
    if (this.second) { this.second = false; act = SECOND[key] || key; }
    if (act !== 'hyp' && ['sin', 'cos', 'tan', 'asin', 'acos', 'atan'].indexOf(act) < 0) this.hyp = false;
    if (act !== 'p2r' && act !== 'r2p' && act !== 'xy') this.coord = '';
    var wasOp = this.lastWasOp;
    if (!/^d[0-9]$/.test(act) && act !== 'dot' && act !== 'abc' && act !== 'ee' && act !== 'neg' && act !== 'back') this.lastWasOp = false;

    if (/^d[0-9]$/.test(act)) { if (!this.entry) this.newEntry(); this.digit(act.slice(1)); return; }
    switch (act) {
      case 'dot': if (!this.entry) this.newEntry(); this.digit('.'); return;
      case 'abc':
        if (!this.entry) return;
        if (this.entry.ee !== null || this.entry.parts.length >= 3 || this.entryCur().indexOf('.') >= 0) return;
        this.entry.parts.push(''); return;
      case 'ee':
        if (!this.entry) { this.newEntry(); this.entry.parts[0] = String(Math.abs(this.x.v)); this.entry.neg = this.x.v < 0; }
        if (this.entry.parts.length > 1) return;
        if (this.entry.ee === null) this.entry.ee = '';
        return;
      case 'neg':
        if (this.entry) {
          if (this.entry.ee !== null) this.entry.eeNeg = !this.entry.eeNeg; else this.entry.neg = !this.entry.neg;
          this.lastWasOp = wasOp;
          return;
        }
        this.x = { v: -this.x.v, r: this.x.r ? [-this.x.r[0], this.x.r[1]] : null, fr: this.x.fr, imp: this.x.imp };
        return;
      case 'back':
        if (!this.entry) return;
        var e = this.entry;
        if (e.ee !== null) { if (e.ee.length) e.ee = e.ee.slice(0, -1); else e.ee = null; return; }
        var cur = this.entryCur();
        if (cur.length) e.parts[e.parts.length - 1] = cur.slice(0, -1);
        else if (e.parts.length > 1) e.parts.pop();
        return;
      case 'pi': this.entry = null; this.x = V(PI12); return;
      case 'add': case 'sub': case 'mul': case 'div': case 'pow': case 'root': case 'ncr': case 'npr':
        this.lastWasOp = wasOp; this.binary(act); return;
      case 'lp': this.lparen(); return;
      case 'rp': this.rparen(); return;
      case 'eq': this.equals(); return;
      case 'sq': case 'cube': case 'sqrt': case 'cbrt': case 'inv': case 'log': case 'ln': case 'tenx': case 'ex':
      case 'fact': case 'sin': case 'cos': case 'tan': case 'asin': case 'acos': case 'atan': case 'dmsdd': case 'pct':
        this.unary(act); return;
      case 'hyp': this.hyp = true; return;
      case 'drg': this.finish(); this.angle = NEXT[this.angle]; return;
      case 'drgconv': this.drgConvert(); return;
      case 'konst':
        this.finish();
        var top = this.ops.length ? this.ops[this.ops.length - 1] : null;
        if (top && top !== '(') this.K = { op: top.op, b: this.x };
        return;
      case 'xy': this.swapXY(); return;
      case 'p2r': case 'r2p': this.coordConvert(act); return;
      case 'sto': case 'rcl': case 'sum': case 'exc': this.finish(); this.await = act; return;
      case 'fix': this.finish(); this.await = 'fix'; return;
      case 'flo': this.finish(); this.notation = 'FLO'; return;
      case 'sci': this.finish(); this.notation = 'SCI'; return;
      case 'eng': this.finish(); this.notation = 'ENG'; return;
      case 'frq': this.frqData = this.finish().v; this.entry = null; return;
      case 'sigma': this.statAdd(1); return;
      case 'sminus': this.statAdd(-1); return;
      case 'mean': case 'sdn': case 'sdn1': case 'n': case 'sx': case 'sx2': this.statGet(act); return;
      case 'csr':
        if (this.stat.n === 0) throw new CalcError('stat');
        this.stat = { n: 0, sx: 0, sx2: 0 }; return;
      case 'fd': this.fracDec(); return;
      case 'dc': this.toggleImp(); return;
      case 'dddms': this.finish(); this.override = { dms: true }; return;
    }
  };

  /* ---------- display ---------- */
  function digitsOf(s) { return s.replace(/[^0-9]/g, '').length; }
  function stripZeros(s) { return s.indexOf('.') >= 0 ? s.replace(/0+$/, '') : s; }
  function pad2(e) { var a = Math.abs(e); return (e < 0 ? '-' : '') + (a < 10 ? '0' : '') + a; }

  function fmtSci(v, fix, eng) {
    var a = Math.abs(v), e = a === 0 ? 0 : Math.floor(Math.log10(a));
    if (eng) e = Math.floor(e / 3) * 3;
    var out = fmtSciAt(v, e, fix, eng);
    if (Math.abs(parseFloat(out.main)) >= (eng ? 1000 : 10)) out = fmtSciAt(v, e + (eng ? 3 : 1), fix, eng);
    return out;
  }
  function fmtSciAt(v, e, fix, eng) {
    var m = v / Math.pow(10, e);
    var intDigits = Math.max(1, Math.floor(Math.log10(Math.abs(m) || 1)) + 1);
    var dec = fix !== null ? fix : 10 - intDigits;
    var s = m.toFixed(Math.min(dec, 10 - intDigits));
    if (fix === null) s = stripZeros(s);
    if (fix === null && s.indexOf('.') < 0) s += '.';
    return { main: s, exp: pad2(e) };
  }
  function fmtFlo(v, fix) {
    var a = Math.abs(v);
    if (a !== 0 && (a >= 9999999999.5 || a < 1e-9)) return fmtSci(v, fix, false);
    var k = a >= 1 ? Math.floor(Math.log10(a)) + 1 : 1;
    var dec = Math.max(0, 10 - k);
    if (fix !== null) dec = Math.min(dec, fix);
    var s = v.toFixed(dec);
    if (digitsOf(s) > 10) s = v.toFixed(Math.max(0, dec - 1));
    if (fix === null) {
      s = stripZeros(s);
      if (s.indexOf('.') < 0) s += '.';
    }
    if (/^-?0\.?0*$/.test(s) && fix === null) s = '0.';
    if (s === '-0.') s = '0.';
    return { main: s, exp: '' };
  }
  function fmtFrac(x) {
    var n = x.r[0], d = x.r[1], sg = n < 0 ? '-' : '';
    n = Math.abs(n);
    if (d === 1) return sg + n + '.';
    if (x.imp || n < d) return sg + n + SEP + d;
    var w = Math.floor(n / d), rem = n - w * d;
    return sg + w + SEP + rem + SEP + d;
  }
  function fmtDMS(v) {
    var sg = v < 0 ? '-' : '', a = Math.abs(v);
    var tenths = Math.round(a * 36000);
    var d = Math.floor(tenths / 36000), rem = tenths - d * 36000;
    var m = Math.floor(rem / 600); rem -= m * 600;
    var s = Math.floor(rem / 10), t = rem - s * 10;
    function two(q) { return (q < 10 ? '0' : '') + q; }
    return sg + d + '°' + two(m) + "'" + two(s) + '"' + t;
  }

  Calc.prototype.formatValue = function (x) {
    if (x.fr && x.r && x.r[1] !== 1) return { main: fmtFrac(x), exp: '' };
    if (this.notation === 'SCI') return x.v === 0 ? { main: this.fix !== null ? (0).toFixed(this.fix) : '0.', exp: '00' } : fmtSci(x.v, this.fix, false);
    if (this.notation === 'ENG') return x.v === 0 ? { main: this.fix !== null ? (0).toFixed(this.fix) : '0.', exp: '00' } : fmtSci(x.v, this.fix, true);
    return fmtFlo(x.v, this.fix);
  };

  Calc.prototype.display = function () {
    var ind = {
      second: this.second, hyp: this.hyp, angle: this.angle,
      m1: this.memory[0] !== 0, m2: this.memory[1] !== 0, m3: this.memory[2] !== 0,
      stat: this.stat.n > 0, k: !!this.K, paren: this.ops.indexOf('(') >= 0,
      fix: this.fix !== null, sci: this.notation === 'SCI', eng: this.notation === 'ENG',
      x: this.coord === 'x', r: this.coord === 'r', n: !!(this.override && this.override.label === 'n=')
    };
    if (this.off) return { main: '', exp: '', ind: {}, off: true };
    if (this.err) return { main: 'Error', exp: '', ind: ind, error: this.err };
    if (this.entry) {
      var e = this.entry, s;
      if (e.parts.length > 1) s = e.parts.join(SEP);
      else s = e.parts[0] || '0';
      if (e.neg) s = '-' + s;
      var ex = e.ee !== null ? (e.eeNeg ? '-' : '') + (e.ee.length ? (e.ee.length === 1 ? '0' + e.ee : e.ee) : '00') : '';
      return { main: s, exp: ex, ind: ind, entry: true };
    }
    if (this.override && this.override.dms) return { main: fmtDMS(this.x.v), exp: '', ind: ind };
    var f = this.formatValue(this.x);
    return { main: f.main, exp: f.exp, ind: ind };
  };
  Calc.prototype.value = function () { return this.entry ? this.entryValue().v : this.x.v; };
  Calc.prototype.text = function () { var d = this.display(); return d.main + (d.exp ? ' ' + d.exp : ''); };

  /* ---------- key sequences ---------- */
  var ALIAS = {
    '+': 'add', '-': 'sub', '−': 'sub', '*': 'mul', '×': 'mul', 'x': 'mul', '/': 'div', '÷': 'div',
    '=': 'eq', '(': 'lp', ')': 'rp', '^': 'pow', '±': 'neg', '+/-': 'neg', 'ab/c': 'abc', '1/x': 'inv',
    'x²': 'sq', '√': 'sqrt', 'π': 'pi', 'pi': 'pi', 'on/c': 'onc', 'ac': 'onc', '.': 'dot'
  };
  /* Key labels as they are printed on the calculator. 2nd labels expand to 2nd plus the key. */
  var BY1 = {}, BY2 = {};
  Object.keys(KEYS).forEach(function (id) {
    if (KEYS[id][0] && !/^d[0-9]$/.test(id) && id !== 'dot') BY1[KEYS[id][0]] = id;
    if (KEYS[id][1]) BY2[KEYS[id][1]] = id;
  });
  /* Token list for a sequence string. Numbers stay whole, keys are resolved to ids. */
  function tokens(seq) {
    var out = [];
    String(seq).trim().split(/\s+/).forEach(function (tok) {
      if (!tok) return;
      if (/^-?(\d+\.?\d*|\.\d+)$/.test(tok)) { out.push({ num: tok.replace(/^-/, ''), neg: tok[0] === '-' }); return; }
      if (tok === '2nd') { out.push({ key: '2nd' }); return; }
      if (BY2[tok]) { out.push({ key: BY2[tok], second: true }); return; }
      var low = tok.toLowerCase();
      var id = BY1[tok] || (KEYS[tok] ? tok : (KEYS[low] ? low : ALIAS[tok] || ALIAS[low]));
      if (!id) throw new Error('Unknown key token: ' + tok);
      out.push({ key: id });
    });
    return out;
  }
  function parseSeq(seq) {
    var keys = [];
    tokens(seq).forEach(function (t) {
      if (t.key) { if (t.second) keys.push('2nd'); keys.push(t.key); return; }
      t.num.split('').forEach(function (c) { keys.push(c === '.' ? 'dot' : 'd' + c); });
      if (t.neg) keys.push('neg');
    });
    return keys;
  }
  Calc.prototype.run = function (seq) {
    var self = this;
    parseSeq(seq).forEach(function (k) { self.press(k); });
    return this.display();
  };

  var api = {
    Calc: Calc, KEYS: KEYS, LAYOUT: LAYOUT, SECOND: SECOND, PI12: PI12, SEP: SEP,
    parseSeq: parseSeq, tokens: tokens,
    label: function (id, second) { return KEYS[id] ? (second ? KEYS[id][1] : KEYS[id][0]) : id; }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TI30 = api;
})(typeof window !== 'undefined' ? window : this);
