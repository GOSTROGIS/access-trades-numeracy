/* HP-15C emulator (RPN, Run mode, real numbers).
   Sources: HP-15C Owner's Handbook (hp15c-oh-en.pdf, edition 2.4) and the HP 15c Collector's Edition Owner's Handbook
   (hp15c-ce-oh-en.pdf, edition 3, February 2023). Page numbers in comments are the printed pages, which are the same in
   both handbooks. See calc2/CALC-MODELS.md. */
var HP15C = (function () {
  'use strict';

  /* Keyboard, four rows of ten as on the calculator. [id, face, gold f label (above), blue g label (lower face)] */
  var ROWS = [
    [['sqrt', '√x', 'A', 'x²'], ['ex', 'eˣ', 'B', 'LN'], ['tenx', '10ˣ', 'C', 'LOG'], ['pow', 'yˣ', 'D', '%'], ['inv', '1/x', 'E', 'Δ%'],
      ['chs', 'CHS', 'MATRIX', 'ABS'], ['d7', '7', 'FIX', 'DEG'], ['d8', '8', 'SCI', 'RAD'], ['d9', '9', 'ENG', 'GRD'], ['div', '÷', 'SOLVE', 'x≤y']],
    [['sst', 'SST', 'LBL', 'BST'], ['gto', 'GTO', 'HYP', 'HYP⁻¹'], ['sin', 'SIN', 'DIM', 'SIN⁻¹'], ['cos', 'COS', '(i)', 'COS⁻¹'], ['tan', 'TAN', 'I', 'TAN⁻¹'],
      ['eex', 'EEX', 'RESULT', 'π'], ['d4', '4', 'x≶', 'SF'], ['d5', '5', 'DSE', 'CF'], ['d6', '6', 'ISG', 'F?'], ['mul', '×', '∫ˣᵧ', 'x=0']],
    [['rs', 'R/S', 'PSE', 'P/R'], ['gsb', 'GSB', 'Σ', 'RTN'], ['rdn', 'R↓', 'PRGM', 'R↑'], ['xy', 'x≶y', 'REG', 'RND'], ['back', '←', 'PREFIX', 'CLx'],
      ['enter', 'ENTER', 'RAN #', 'LSTx'], ['d1', '1', '→R', '→P'], ['d2', '2', '→H.MS', '→H'], ['d3', '3', '→RAD', '→DEG'], ['sub', '−', 'Re≶Im', 'TEST']],
    [['on', 'ON', '', ''], ['f', 'f', '', ''], ['g', 'g', '', ''], ['sto', 'STO', 'FRAC', 'INT'], ['rcl', 'RCL', 'USER', 'MEM'],
      ['enter2', '', '', ''], ['d0', '0', 'x!', 'x̄'], ['dot', '.', 'ŷ,r', 's'], ['sigma', 'Σ+', 'L.R.', 'Σ−'], ['add', '+', 'Py,x', 'Cy,x']]
  ];
  var KEYS = {};
  ROWS.forEach(function (r) { r.forEach(function (k) { if (k[0] !== 'enter2') KEYS[k[0]] = { face: k[1], f: k[2], g: k[3] }; }); });

  var PI10 = 3.141592654; /* "the first 10 digits of π" (p. 24) */
  var MAXV = 9.999999999e99;
  function HErr(n) { this.n = n; }
  /* every result is rounded to 10 significant digits (p. 60, Round-Off Error) */
  /* test switch only: true skips the 10-digit rounding, to tell a translation error from the HP's own rounding */
  var unrounded = false;
  function r10(v) {
    if (typeof v !== 'number' || isNaN(v)) throw new HErr(0);
    if (v === 0 || unrounded) return v;
    if (Math.abs(v) > MAXV) return v > 0 ? MAXV : -MAXV;
    if (Math.abs(v) < 1e-99) return 0;
    return Number(v.toPrecision(10));
  }
  function isInt(v) { return Math.abs(v - Math.round(v)) < 1e-9; }
  function hms2h(v) {
    var sg = v < 0 ? -1 : 1, a = Math.abs(v), h = Math.floor(a + 1e-12);
    var rest = Math.round((a - h) * 1e10) / 1e8, m = Math.floor(rest + 1e-9), s = (rest - m) * 100;
    return sg * (h + m / 60 + s / 3600);
  }
  function h2hms(v) {
    var sg = v < 0 ? -1 : 1, a = Math.abs(v), h = Math.floor(a + 1e-12);
    var mr = (a - h) * 60, m = Math.floor(mr + 1e-9), s = (mr - m) * 60;
    if (s >= 60 - 1e-7) { s = 0; m += 1; }
    if (m >= 60) { m -= 60; h += 1; }
    return sg * (h + m / 100 + s / 10000);
  }

  function Calc() { this.R = []; for (var i = 0; i < 20; i++) this.R.push(0); this.powerOn(); }
  Calc.prototype.powerOn = function () {
    this.x = 0; this.y = 0; this.z = 0; this.t = 0; this.lastx = 0;
    this.lift = true; this.entry = null; this.prefix = null; this.await = null; this.hyp = null;
    this.angle = 'DEG'; this.fmt = { mode: 'FIX', n: 4 }; this.err = null; this.off = false;
  };

  /* ---------- the stack (section 3 and appendix B) ---------- */
  Calc.prototype.liftStack = function () { this.t = this.z; this.z = this.y; this.y = this.x; };
  Calc.prototype.drop = function () { this.y = this.z; this.z = this.t; };
  Calc.prototype.endEntry = function () {
    if (!this.entry) return;
    var e = this.entry, v = parseFloat((e.neg ? '-' : '') + (e.mant || '0'));
    if (e.exp !== null) v = v * Math.pow(10, (e.expNeg ? -1 : 1) * parseInt(e.exp || '0', 10));
    this.x = r10(v);
    this.entry = null;
  };
  /* a new number keyed or recalled: the stack lifts first when lift is enabled (p. 36) */
  Calc.prototype.newNumber = function (v) {
    this.endEntry();
    if (this.lift) this.liftStack();
    this.x = r10(v);
    this.lift = true;
  };
  Calc.prototype.startEntry = function () {
    this.endEntry();
    if (this.lift) this.liftStack();
    this.entry = { mant: '', exp: null, expNeg: false, neg: false };
    this.x = 0;
    /* a keyed number is lifted by the next number keyed or recalled: digit entry leaves the lift enabled, so
       CLx 7 π lifts 7 into Y (pp. 209-211: only ENTER, CLx, Σ+, Σ− disable; CHS, EEX, ← are neutral during entry) */
    this.lift = true;
  };
  Calc.prototype.digit = function (ch) {
    if (!this.entry) this.startEntry();
    var e = this.entry;
    if (e.exp !== null) { if (ch !== '.') e.exp = (e.exp + ch).slice(-2); return; }
    if (ch === '.') { if (e.mant.indexOf('.') < 0) e.mant = (e.mant || '0') + '.'; return; }
    if (e.mant.replace(/\D/g, '').length >= 10) return;
    e.mant = (e.mant === '0' ? '' : e.mant) + ch;
  };
  Calc.prototype.unary = function (f) {
    this.endEntry();
    this.lastx = this.x;
    this.x = r10(f(this.x));
    this.lift = true;
  };
  Calc.prototype.binary = function (f) {
    this.endEntry();
    var y = this.y, x = this.x;
    var v = r10(f(y, x));
    this.lastx = x;
    this.x = v; this.drop();
    this.lift = true;
  };
  Calc.prototype.toRad = function (a) { return this.angle === 'DEG' ? a * Math.PI / 180 : this.angle === 'GRAD' ? a * Math.PI / 200 : a; };
  Calc.prototype.fromRad = function (a) { return this.angle === 'DEG' ? a * 180 / Math.PI : this.angle === 'GRAD' ? a * 200 / Math.PI : a; };
  function clean(v) { return Math.abs(v) < 1e-12 ? 0 : v; }
  function fact(v) { if (!isInt(v) || v < 0 || v > 69) throw new HErr(0); var r = 1; for (var i = 2; i <= Math.round(v); i++) r *= i; return r; }
  function comb(y, x, perm) {
    if (!isInt(y) || !isInt(x) || y < 0 || x < 0 || x > y) throw new HErr(0);
    var n = Math.round(y), k = Math.round(x), p = 1, i;
    if (perm) { for (i = 0; i < k; i++) p *= (n - i); return p; }
    k = Math.min(k, n - k); for (i = 1; i <= k; i++) p = p * (n - k + i) / i; return Math.round(p);
  }
  var REG = { d0: 0, d1: 1, d2: 2, d3: 3, d4: 4, d5: 5, d6: 6, d7: 7, d8: 8, d9: 9 };

  Calc.prototype.press = function (key) {
    if (!KEYS[key]) throw new Error('Unknown HP-15C key: ' + key);
    if (this.off) { if (key === 'on') this.off = false; return; }
    /* any key clears an Error display and is not otherwise carried out (p. 61) */
    if (this.err !== null) { this.err = null; return; }
    try { this.key(key); } catch (e) {
      if (e instanceof HErr) { this.err = e.n; this.prefix = null; this.await = null; this.hyp = null; this.entry = null; }
      else throw e;
    }
  };
  Calc.prototype.key = function (key) {
    var self = this;
    if (key === 'on') { this.off = true; return; }
    /* register address after STO, RCL or f x≶ (p. 42): 0-9, or . then 0-9 */
    if (this.await) {
      var aw = this.await;
      if (key === 'dot' && !aw.dot) { aw.dot = true; return; }
      if (!aw.arith && (key === 'add' || key === 'sub' || key === 'mul' || key === 'div') && (aw.op === 'sto' || aw.op === 'rcl')) { aw.arith = key; return; }
      this.await = null;
      if (!(key in REG)) return;
      var n = REG[key] + (aw.dot ? 10 : 0);
      this.endEntry();
      if (aw.op === 'sto') {
        if (aw.arith) {
          var cur = this.R[n], x0 = this.x;
          this.R[n] = r10(aw.arith === 'add' ? cur + x0 : aw.arith === 'sub' ? cur - x0 : aw.arith === 'mul' ? cur * x0 : (function () { if (x0 === 0) throw new HErr(0); return cur / x0; })());
        } else this.R[n] = this.x;
        this.lift = true;
      } else if (aw.op === 'rcl') {
        if (aw.arith) {
          var r = this.R[n], xv = this.x;
          this.lastx = xv;
          this.x = r10(aw.arith === 'add' ? xv + r : aw.arith === 'sub' ? xv - r : aw.arith === 'mul' ? xv * r : (function () { if (r === 0) throw new HErr(0); return xv / r; })());
          this.lift = true;
        } else this.newNumber(this.R[n]);
      } else if (aw.op === 'xchg') {
        var tmp = this.R[n]; this.R[n] = this.x; this.x = tmp; this.lift = true;
      } else if (aw.op === 'fix' || aw.op === 'sci' || aw.op === 'eng') {
        this.fmt = { mode: aw.op.toUpperCase(), n: REG[key] };
      }
      return;
    }
    if (key === 'f' || key === 'g') { this.prefix = this.prefix === key ? null : key; return; }
    var pre = this.prefix;
    this.prefix = null;
    if (pre === 'f') return this.fkey(key);
    if (pre === 'g') return this.gkey(key);
    if (this.hyp) {
      var hy = this.hyp; this.hyp = null;
      if (key === 'sin' || key === 'cos' || key === 'tan') {
        var fn = { sin: [Math.sinh, Math.asinh], cos: [Math.cosh, Math.acosh], tan: [Math.tanh, Math.atanh] }[key][hy === 'inv' ? 1 : 0];
        this.unary(function (v) { var r = fn(v); if (isNaN(r) || !isFinite(r)) throw new HErr(0); return r; });
        return;
      }
    }
    if (/^d[0-9]$/.test(key)) { this.digit(key.slice(1)); return; }
    switch (key) {
      case 'dot': this.digit('.'); return;
      case 'eex':
        /* EEX starts the exponent of the number being keyed (p. 19) */
        if (!this.entry) { this.startEntry(); this.entry.mant = '1'; }
        if (this.entry.exp === null) this.entry.exp = '';
        return;
      case 'chs':
        if (this.entry) { if (this.entry.exp !== null) this.entry.expNeg = !this.entry.expNeg; else this.entry.neg = !this.entry.neg; return; }
        this.x = -this.x; this.lift = true; return;
      case 'back':
        /* ← deletes the last digit during entry, otherwise it clears X like CLx (p. 21) */
        if (this.entry) {
          var e = this.entry;
          if (e.exp !== null) { if (e.exp.length) e.exp = e.exp.slice(0, -1); else e.exp = null; return; }
          if (e.mant.length > 1) { e.mant = e.mant.slice(0, -1); return; }
          this.entry = null; this.x = 0; this.lift = false; return;
        }
        this.x = 0; this.lift = false; return;
      case 'enter':
        /* ENTER lifts the stack, copies X into Y and disables stack lift (pp. 33, 36) */
        this.endEntry(); this.liftStack(); this.lift = false; return;
      case 'add': this.binary(function (y, x) { return y + x; }); return;
      case 'sub': this.binary(function (y, x) { return y - x; }); return;
      case 'mul': this.binary(function (y, x) { return y * x; }); return;
      case 'div': this.binary(function (y, x) { if (x === 0) throw new HErr(0); return y / x; }); return;
      case 'pow': this.binary(function (y, x) {
        if (y === 0 && x <= 0) throw new HErr(0);
        if (y < 0 && !isInt(x)) throw new HErr(0);
        return Math.pow(y, x);
      }); return;
      case 'sqrt': this.unary(function (v) { if (v < 0) throw new HErr(0); return Math.sqrt(v); }); return;
      case 'ex': this.unary(Math.exp); return;
      case 'tenx': this.unary(function (v) { return Math.pow(10, v); }); return;
      case 'inv': this.unary(function (v) { if (v === 0) throw new HErr(0); return 1 / v; }); return;
      case 'sin': this.unary(function (v) { return clean(Math.sin(self.toRad(v))); }); return;
      case 'cos': this.unary(function (v) { return clean(Math.cos(self.toRad(v))); }); return;
      case 'tan': this.unary(function (v) {
        var q = self.angle === 'DEG' ? v / 90 : self.angle === 'GRAD' ? v / 100 : null;
        if (q !== null && isInt(q) && Math.round(q) % 2) return MAXV;
        return clean(Math.tan(self.toRad(v)));
      }); return;
      case 'xy': this.endEntry(); var a = this.x; this.x = this.y; this.y = a; this.lift = true; return;
      case 'rdn': this.endEntry(); var w = this.x; this.x = this.y; this.y = this.z; this.z = this.t; this.t = w; this.lift = true; return;
      case 'sto': this.endEntry(); this.await = { op: 'sto' }; return;
      case 'rcl': this.endEntry(); this.await = { op: 'rcl' }; return;
      case 'gto': return;
      default: return;
    }
  };
  Calc.prototype.fkey = function (key) {
    var self = this;
    switch (key) {
      case 'gto': this.hyp = 'hyp'; return;
      case 'd1': /* →R: θ in Y, r in X gives x in X and y in Y (p. 31) */
        this.endEntry();
        var r = this.x, th = this.toRad(this.y);
        this.lastx = r;
        this.x = r10(clean(r * Math.cos(th))); this.y = r10(clean(r * Math.sin(th))); this.lift = true; return;
      case 'd2': this.unary(h2hms); return;
      case 'd3': this.unary(function (v) { return v * Math.PI / 180; }); return;
      case 'd0': this.unary(fact); return;
      case 'sto': this.unary(function (v) { return v - (v < 0 ? Math.ceil(v) : Math.floor(v)); }); return;
      case 'add': this.binary(function (y, x) { return comb(y, x, true); }); return;
      case 'd4': this.endEntry(); this.await = { op: 'xchg' }; return;
      case 'd7': this.endEntry(); this.await = { op: 'fix' }; return;
      case 'd8': this.endEntry(); this.await = { op: 'sci' }; return;
      case 'd9': this.endEntry(); this.await = { op: 'eng' }; return;
      case 'back': return;
      default: return;
    }
  };
  Calc.prototype.gkey = function (key) {
    var self = this;
    switch (key) {
      case 'sqrt': this.unary(function (v) { return v * v; }); return;
      case 'ex': this.unary(function (v) { if (v <= 0) throw new HErr(0); return Math.log(v); }); return;
      case 'tenx': this.unary(function (v) { if (v <= 0) throw new HErr(0); return Math.log10(v); }); return;
      case 'pow': /* % keeps the base in Y (p. 29) */
        this.endEntry(); this.lastx = this.x; this.x = r10(this.y * this.x / 100); this.lift = true; return;
      case 'inv': /* Δ% keeps the base in Y (p. 30) */
        this.endEntry(); if (this.y === 0) throw new HErr(0); this.lastx = this.x; this.x = r10((this.x - this.y) / this.y * 100); this.lift = true; return;
      case 'chs': this.unary(Math.abs); return;
      case 'd7': this.endEntry(); this.angle = 'DEG'; return;
      case 'd8': this.endEntry(); this.angle = 'RAD'; return;
      case 'd9': this.endEntry(); this.angle = 'GRAD'; return;
      case 'gto': this.hyp = 'inv'; return;
      case 'sin': this.unary(function (v) { if (Math.abs(v) > 1) throw new HErr(0); return self.fromRad(Math.asin(v)); }); return;
      case 'cos': this.unary(function (v) { if (Math.abs(v) > 1) throw new HErr(0); return self.fromRad(Math.acos(v)); }); return;
      case 'tan': this.unary(function (v) { return self.fromRad(Math.atan(v)); }); return;
      case 'eex': this.newNumber(PI10); return;
      case 'rdn': this.endEntry(); var w = this.t; this.t = this.z; this.z = this.y; this.y = this.x; this.x = w; this.lift = true; return;
      case 'xy': /* RND rounds to the display format (p. 24) */
        this.unary(function (v) { if (self.fmt.mode !== 'FIX') return Number(v.toPrecision(self.fmt.n + 1)); return Number(v.toFixed(self.fmt.n)); }); return;
      case 'back': /* CLx clears X and disables stack lift (p. 36) */
        this.entry = null; this.x = 0; this.lift = false; return;
      case 'enter': this.endEntry(); if (this.lift) this.liftStack(); this.x = this.lastx; this.lift = true; return;
      case 'd1': /* →P: y in Y, x in X gives r in X and θ in Y (p. 30) */
        this.endEntry();
        var x = this.x, y = this.y;
        this.lastx = x;
        this.x = r10(Math.sqrt(x * x + y * y)); this.y = r10(this.fromRad(Math.atan2(y, x))); this.lift = true; return;
      case 'd2': this.unary(hms2h); return;
      case 'd3': this.unary(function (v) { return v * 180 / Math.PI; }); return;
      case 'sto': this.unary(function (v) { return v < 0 ? Math.ceil(v) : Math.floor(v); }); return;
      case 'add': this.binary(function (y, x) { return comb(y, x, false); }); return;
      default: return;
    }
  };

  /* ---------- display (section 5) ---------- */
  function commas(s) { return s.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  /* |v| to n decimals, rounded half up on the 10 decimal digits the calculator holds (not on the binary value) */
  function decFixed(v, n) {
    var a = Math.abs(v);
    if (a === 0) return n > 0 ? '0.' + new Array(n + 1).join('0') : '0';
    var ex = a.toExponential(9), m = ex.split('e'), digits = m[0].replace('.', ''), e = parseInt(m[1], 10);
    var k = e - 9 + n, big = BigInt(digits), out;
    if (k >= 0) out = big * (10n ** BigInt(k));
    else { var div = 10n ** BigInt(-k); out = big / div; if ((big % div) * 2n >= div) out += 1n; }
    var str = out.toString();
    if (n > 0) { while (str.length <= n) str = '0' + str; str = str.slice(0, -n) + '.' + str.slice(-n); }
    return str;
  }
  function sciOf(v, n) {
    n = Math.min(n, 6);
    var a = Math.abs(v), e = a === 0 ? 0 : Math.floor(Math.log10(a)), m = a / Math.pow(10, e);
    if (Number(decFixed(m, n)) >= 10) { e += 1; m = a / Math.pow(10, e); }
    var ms = decFixed(m, n);
    if (ms.indexOf('.') < 0) ms += '.';
    return { main: (v < 0 ? '-' : '') + ms, exp: (e < 0 ? '-' : ' ') + ('0' + Math.abs(e)).slice(-2) };
  }
  Calc.prototype.fmtValue = function (v) {
    var f = this.fmt;
    if (f.mode === 'SCI') return sciOf(v, f.n);
    if (f.mode === 'ENG') {
      var a = Math.abs(v), e = a === 0 ? 0 : Math.floor(Math.log10(a)), e3 = Math.floor(e / 3) * 3, m = v / Math.pow(10, e3);
      var dec = Math.max(0, f.n - (Math.floor(Math.log10(Math.abs(m) || 1))));
      return { main: m.toFixed(Math.min(dec, 6)), exp: (e3 < 0 ? '-' : ' ') + ('0' + Math.abs(e3)).slice(-2) };
    }
    /* FIX n, up to 10 digits. Too large or too small for that shows an exponent (p. 58) */
    var av = Math.abs(v);
    if (av >= 1e10) return sciOf(v, f.n);
    var intDigits = av >= 1 ? Math.floor(Math.log10(av) + 1e-12) + 1 : 1;
    var n = Math.min(f.n, 10 - intDigits);
    if (v !== 0 && Number(decFixed(av, n)) === 0) return sciOf(v, f.n);
    var s = decFixed(av, n);
    if (s.replace(/\D/g, '').length > 10) s = decFixed(av, Math.max(0, n - 1));
    var ip = s.split('.')[0], fp = s.split('.')[1];
    return { main: (v < 0 ? '-' : '') + commas(ip) + '.' + (fp || ''), exp: '' };
  };
  Calc.prototype.display = function () {
    var ind = { f: this.prefix === 'f', g: this.prefix === 'g', angle: this.angle, rad: this.angle === 'RAD', grad: this.angle === 'GRAD' };
    if (this.off) return { main: '', exp: '', ind: {}, off: true };
    if (this.err !== null) return { main: 'Error ' + this.err, exp: '', ind: ind, error: 'Error ' + this.err };
    if (this.entry) {
      var e = this.entry, m = e.mant || '0', ip = m.split('.')[0], fp = m.indexOf('.') >= 0 ? '.' + m.split('.')[1] : '';
      return { main: (e.neg ? '-' : '') + commas(ip) + fp, exp: e.exp !== null ? (e.expNeg ? '-' : ' ') + ('0' + e.exp).slice(-2) : '', ind: ind, entry: true };
    }
    var f = this.fmtValue(this.x);
    return { main: f.main, exp: f.exp, ind: ind };
  };
  Calc.prototype.value = function () {
    if (this.entry) { var e = this.entry, v = parseFloat((e.neg ? '-' : '') + (e.mant || '0')); if (e.exp !== null) v *= Math.pow(10, (e.expNeg ? -1 : 1) * parseInt(e.exp || '0', 10)); return v; }
    return this.x;
  };
  Calc.prototype.text = function () { var d = this.display(); return d.main + (d.exp ? ' ' + d.exp.trim() : ''); };
  Calc.prototype.run = function (keys) { var self = this; keys.forEach(function (k) { self.press(k); }); return this.display(); };

  return { Calc: Calc, KEYS: KEYS, ROWS: ROWS, PI10: PI10, hms2h: hms2h, h2hms: h2hms, unrounded: function (on) { unrounded = !!on; } };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = HP15C;
