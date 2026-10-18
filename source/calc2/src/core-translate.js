/* Translator: a canonical TI-30Xa key sequence (the form every worked solution is written in) becomes the key
   sequence for another calculator model.
   1. The TI sequence is read key by key, the way the TI-30Xa reads it (pending operations, brackets, = , memories,
      ON/C), but instead of numbers it builds an expression tree.
   2. The tree is written out for the target model: Sharp EL-531XT in D.A.L. order, HP-15C in RPN with ENTER and the
      4-level stack (storage registers take over when an expression would need more than four levels).
   Rows joined by " ON/C ON/C " are translated one by one and joined with the model's own clear, two key presses, so
   a chip map for the joined sequence still lines up row by row. Needs TI30 (the TI-30Xa engine). */
var CalcTranslate = (function () {
  'use strict';
  var G = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
  function T30() { return G.TI30 || (typeof require === 'function' ? require('../ti30.js') : null); }

  function Unsupported(msg) { this.message = msg; }
  var PREC = { add: 1, sub: 1, mul: 2, div: 2, pow: 3, root: 3, ncr: 4, npr: 4 };
  var NEXT = { DEG: 'RAD', RAD: 'GRAD', GRAD: 'DEG' };

  /* ---------- 1. TI-30Xa key sequence to expression tree ---------- */
  function num(s, neg, ee, eeNeg) { return { t: 'num', s: s, neg: !!neg, ee: ee, eeNeg: !!eeNeg }; }
  function lit(n) { return { t: 'num', s: String(n), neg: false, ee: null, eeNeg: false }; }
  function readTI(seq) {
    var T = T30(), keys = T.parseSeq(seq);
    var st = {
      x: lit(0), entry: null, ops: [], lastWasOp: false, mem: [null, null, null], t: lit(0), angle: 'DEG',
      events: [], second: false, hyp: false, await: null, lastKey: null, showDms: false, fmt: null, disp: []
    };
    function finish() {
      if (!st.entry) return st.x;
      var e = st.entry;
      if (e.parts.length > 1) {
        var p = e.parts.map(function (s) { return s || '0'; });
        st.x = p.length === 3 ? { t: 'frac', w: p[0], n: p[1], d: p[2], neg: e.neg } : { t: 'frac', w: null, n: p[0], d: p[1], neg: e.neg };
      } else st.x = num(e.parts[0] || '0', e.neg, e.ee, e.eeNeg);
      st.entry = null;
      return st.x;
    }
    function reduceTo(prec) {
      while (st.ops.length) {
        var top = st.ops[st.ops.length - 1];
        if (top === '(' || PREC[top.op] < prec) break;
        st.ops.pop();
        st.x = { t: 'bin', op: top.op, l: top.a, r: st.x };
      }
    }
    function memRef(i) { return { t: 'mem', slot: i, node: st.mem[i - 1] || lit(0) }; }
    keys.forEach(function (key) {
      var wasOnc = st.lastKey === 'onc';
      st.lastKey = key;
      if (key !== '2nd' && key !== 'dddms' && !st.second) st.showDms = false;
      if (key === 'onc') {
        st.disp = [];
        if (wasOnc) { st.x = lit(0); st.entry = null; st.ops = []; st.t = lit(0); st.lastWasOp = false; }
        else { st.entry = null; st.x = lit(0); }
        st.second = false; st.hyp = false; st.await = null;
        return;
      }
      if (st.await) {
        var aw = st.await; st.await = null;
        if (aw === 'fix') {
          if (key === 'dot') { st.events.push({ fmt: null }); return; }
          if (/^d[0-9]$/.test(key)) { st.events.push({ fmt: parseInt(key.slice(1), 10) }); return; }
        } else if (/^d[1-3]$/.test(key)) {
          var slot = parseInt(key.slice(1), 10), xv = finish();
          if (aw === 'sto') { st.mem[slot - 1] = xv; st.events.push({ store: slot, node: xv }); }
          else if (aw === 'rcl') { st.x = memRef(slot); }
          else if (aw === 'sum') { var sm = { t: 'bin', op: 'add', l: memRef(slot), r: xv }; st.mem[slot - 1] = sm; st.events.push({ store: slot, node: sm }); }
          else throw new Unsupported('EXC');
          return;
        }
      }
      if (key === '2nd') { st.second = !st.second; return; }
      var act = key;
      if (st.second) { st.second = false; act = T.SECOND[key] || key; }
      if (act === 'dddms') { finish(); st.showDms = true; return; }
      var wasOp = st.lastWasOp;
      if (act !== 'neg' && act !== 'back') st.lastWasOp = false;
      if (act !== 'hyp' && ['sin', 'cos', 'tan', 'asin', 'acos', 'atan'].indexOf(act) < 0) st.hyp = false;
      if (/^d[0-9]$/.test(act) || act === 'dot') {
        if (!st.entry) st.entry = { parts: [''], neg: false, ee: null, eeNeg: false };
        var en = st.entry, ch = act === 'dot' ? '.' : act.slice(1);
        if (en.ee !== null) { if (ch !== '.') en.ee = (en.ee + ch).slice(-2); return; }
        var cur = en.parts[en.parts.length - 1];
        if (ch === '.') { if (en.parts.length === 1 && cur.indexOf('.') < 0) en.parts[0] = (cur || '0') + '.'; return; }
        en.parts[en.parts.length - 1] = (cur === '0' ? '' : cur) + ch;
        return;
      }
      switch (act) {
        case 'abc':
          if (st.entry && st.entry.ee === null && st.entry.parts.length < 3 && st.entry.parts[st.entry.parts.length - 1].indexOf('.') < 0) st.entry.parts.push('');
          return;
        case 'ee':
          if (!st.entry) {
            var xs = st.x;
            if (xs.t !== 'num' || xs.ee !== null) throw new Unsupported('EE after a result');
            st.entry = { parts: [xs.s], neg: xs.neg, ee: null, eeNeg: false };
          }
          if (st.entry.parts.length === 1 && st.entry.ee === null) st.entry.ee = '';
          return;
        case 'neg':
          if (st.entry) { if (st.entry.ee !== null) st.entry.eeNeg = !st.entry.eeNeg; else st.entry.neg = !st.entry.neg; st.lastWasOp = wasOp; return; }
          st.x = { t: 'un', fn: 'neg', a: st.x };
          return;
        case 'back':
          if (!st.entry) return;
          var e2 = st.entry;
          if (e2.ee !== null) { if (e2.ee.length) e2.ee = e2.ee.slice(0, -1); else e2.ee = null; return; }
          var c2 = e2.parts[e2.parts.length - 1];
          if (c2.length) e2.parts[e2.parts.length - 1] = c2.slice(0, -1); else if (e2.parts.length > 1) e2.parts.pop();
          return;
        case 'pi': st.entry = null; st.x = { t: 'pi' }; return;
        case 'add': case 'sub': case 'mul': case 'div': case 'pow': case 'root': case 'ncr': case 'npr':
          if (wasOp && st.ops.length && st.ops[st.ops.length - 1] !== '(') { st.ops[st.ops.length - 1].op = act; st.lastWasOp = true; return; }
          finish(); reduceTo(PREC[act]); st.ops.push({ op: act, a: st.x }); st.lastWasOp = true; return;
        case 'lp': st.entry = null; st.ops.push('('); st.lastWasOp = true; return;
        case 'rp': finish(); reduceTo(0); if (st.ops.length && st.ops[st.ops.length - 1] === '(') st.ops.pop(); return;
        case 'eq':
          finish();
          while (st.ops.length) { var top = st.ops.pop(); if (top !== '(') st.x = { t: 'bin', op: top.op, l: top.a, r: st.x }; }
          return;
        case 'sq': case 'cube': case 'sqrt': case 'cbrt': case 'inv': case 'log': case 'ln': case 'tenx': case 'ex': case 'fact':
        case 'sin': case 'cos': case 'tan': case 'asin': case 'acos': case 'atan': case 'dmsdd': {
          var a = finish(), fn = act;
          if (st.hyp && /^(a?)(sin|cos|tan)$/.test(act)) fn = act.charAt(0) === 'a' ? 'a' + act.slice(1) + 'h' : act + 'h';
          st.hyp = false;
          st.x = { t: 'un', fn: fn, a: a, mode: /^(sin|cos|tan|asin|acos|atan)$/.test(fn) ? st.angle : null };
          return;
        }
        case 'pct': {
          var pv = finish(), tp = st.ops.length ? st.ops[st.ops.length - 1] : null;
          st.x = tp && tp !== '(' && (tp.op === 'add' || tp.op === 'sub') ? { t: 'pctof', base: tp.a, a: pv } : { t: 'pct', a: pv };
          return;
        }
        case 'hyp': st.hyp = true; return;
        case 'drg': finish(); st.angle = NEXT[st.angle]; st.events.push({ mode: st.angle }); return;
        case 'drgconv': { var dv = finish(); st.x = { t: 'drgc', from: st.angle, to: NEXT[st.angle], a: dv }; st.angle = NEXT[st.angle]; return; }
        case 'xy': { var sv = finish(), tt = st.t; st.t = sv; st.x = tt; return; }
        case 'p2r': case 'r2p': {
          var b = finish(), ca = st.t;
          st.x = { t: 'coord', kind: act, a: ca, b: b, part: 0, mode: st.angle };
          st.t = { t: 'coord', kind: act, a: ca, b: b, part: 1, mode: st.angle };
          return;
        }
        case 'sto': case 'rcl': case 'sum': case 'exc': finish(); st.await = act; return;
        case 'fix': finish(); st.await = 'fix'; return;
        case 'flo': case 'sci': case 'eng': finish(); st.events.push({ notation: act }); return;
        /* F⇄D and d/c change only how the answer is shown: the value stays the same */
        case 'fd': finish(); st.disp.push('fd'); return;
        case 'dc': finish(); st.disp.push('dc'); return;
        default: throw new Unsupported('TI key ' + act + ' has no translation');
      }
    });
    if (st.entry) finish();
    var pending = st.ops.filter(function (o) { return o !== '('; });
    return { events: st.events, x: st.x, pending: pending, open: st.ops.length, angle: st.angle, showDms: st.showDms, mem: st.mem, disp: st.disp };
  }

  /* ---------- tree helpers ---------- */
  function numValue(n) {
    var v = parseFloat(n.s);
    if (n.ee !== null && n.ee !== undefined) v *= Math.pow(10, (n.eeNeg ? -1 : 1) * parseInt(n.ee || '0', 10));
    return n.neg ? -v : v;
  }
  /* value of a tree node, worked out the way the TI-30Xa does (used to pick keys that depend on a sign) */
  var RAD = { DEG: Math.PI / 180, RAD: 1, GRAD: Math.PI / 200 };
  function hms(v) { var a = Math.abs(v), d = Math.floor(a + 1e-12), f = (a - d) * 100, m = Math.floor(f + 1e-9), sec = (f - m) * 100; return (v < 0 ? -1 : 1) * (d + m / 60 + sec / 3600); }
  function val(n) {
    switch (n.t) {
      case 'num': return numValue(n);
      case 'frac': { var w = n.w !== null ? parseFloat(n.w) : 0, f = parseFloat(n.n) / parseFloat(n.d); return (n.neg ? -1 : 1) * (w + f); }
      case 'pi': return Math.PI;
      case 'mem': return val(n.node);
      case 'pct': return val(n.a) / 100;
      case 'pctof': return val(n.base) * val(n.a) / 100;
      case 'drgc': { var f2 = { DEG: { RAD: Math.PI / 180 }, RAD: { GRAD: 200 / Math.PI }, GRAD: { DEG: 0.9 } }; return val(n.a) * f2[n.from][n.to]; }
      case 'coord': {
        var a = val(n.a), b = val(n.b), u = RAD[n.mode];
        if (n.kind === 'p2r') return n.part ? a * Math.sin(b * u) : a * Math.cos(b * u);
        return n.part ? Math.atan2(b, a) / u : Math.sqrt(a * a + b * b);
      }
      case 'bin': {
        var l = val(n.l), r = val(n.r);
        switch (n.op) {
          case 'add': return l + r; case 'sub': return l - r; case 'mul': return l * r; case 'div': return l / r;
          case 'pow': return Math.pow(l, r);
          case 'root': return l < 0 ? -Math.pow(-l, 1 / r) : Math.pow(l, 1 / r);
          default: return NaN;
        }
      }
      case 'un': {
        var x = val(n.a), m = RAD[n.mode] || 1;
        switch (n.fn) {
          case 'neg': return -x; case 'sq': return x * x; case 'cube': return x * x * x; case 'sqrt': return Math.sqrt(x); case 'cbrt': return Math.cbrt(x);
          case 'inv': return 1 / x; case 'log': return Math.log10(x); case 'ln': return Math.log(x); case 'tenx': return Math.pow(10, x); case 'ex': return Math.exp(x);
          case 'sin': return Math.sin(x * m); case 'cos': return Math.cos(x * m); case 'tan': return Math.tan(x * m);
          case 'asin': return Math.asin(x) / m; case 'acos': return Math.acos(x) / m; case 'atan': return Math.atan(x) / m;
          case 'dmsdd': return hms(x);
          default: return NaN;
        }
      }
    }
    return NaN;
  }
  function hasTrigIn(node, mode, out) {
    if (!node || typeof node !== 'object') return;
    if ((node.t === 'un' && node.mode) || node.t === 'coord') { if (node.mode !== mode) out.bad = true; }
    ['a', 'b', 'l', 'r', 'base'].forEach(function (k) { if (node[k]) hasTrigIn(node[k], mode, out); });
  }

  /* ---------- 2a. Sharp EL-531XT (D.A.L.) ---------- */
  /* Token shapes: {num:'12.5'} | {key:id, shift:'2ndf'|'alpha'|null} | {note:text} */
  var SH = {
    sin: ['sin'], cos: ['cos'], tan: ['tan'], asin: ['sin', '2ndf'], acos: ['cos', '2ndf'], atan: ['tan', '2ndf'],
    sqrt: ['sqrt'], cbrt: ['cube', '2ndf'], log: ['log'], ln: ['ln'], tenx: ['log', '2ndf'], ex: ['ln', '2ndf']
  };
  var SH_POST = { sq: ['sq'], cube: ['cube'], inv: ['sq', '2ndf'], fact: ['d4', '2ndf'] };
  var SLOT_LETTER = { 1: 'A', 2: 'B', 3: 'C' };
  /* Sharp priority of a tree node: higher binds tighter (manual, Priority Levels in Calculation) */
  function shPrio(n) {
    if (n.t === 'num') return n.neg ? 5 : 10;
    if (n.t === 'frac' || n.t === 'pi' || n.t === 'mem' || n.t === 'coordref' || n.t === 'dmslit') return 10;
    if (n.t === 'un') {
      if (SH_POST[n.fn]) return 9;
      return 5;
    }
    if (n.t === 'bin') return { pow: 8, root: 8, ncr: 7, npr: 7, mul: 3, div: 3, add: 2, sub: 2 }[n.op];
    if (n.t === 'pct' || n.t === 'pctof') return 3;
    return 10;
  }
  function emitSharp(prog) {
    var out = [], notes = [], spills = 0;
    function k(id, shift) { out.push({ key: id, shift: shift || null }); }
    function numTok(s) { out.push({ num: s }); }
    function emitNum(n) {
      if (n.neg) k('neg');
      numTok(n.s);
      if (n.ee !== null && n.ee !== undefined) { k('exp'); if (n.eeNeg) k('neg'); numTok(n.ee || '0'); }
    }
    function paren(fn) { k('lp'); fn(); k('rp'); }
    function emit(n, ctx) {
      switch (n.t) {
        case 'num': emitNum(n); return;
        case 'pi': k('pi'); return;
        case 'frac':
          if (n.neg) k('neg');
          if (n.w !== null) { numTok(n.w); k('abc'); }
          numTok(n.n); k('abc'); numTok(n.d);
          return;
        case 'dmslit':
          numTok(n.d); k('dms'); numTok(n.m); k('dms'); numTok(n.s);
          return;
        case 'mem': k('rcl'); k(n.letterKey); return;
        case 'coordref': k('rcl'); k(n.which ? 'sto' : 'rcl'); return;
        case 'un': {
          if (n.fn === 'neg') { k('neg'); sub(n.a, 5.5); return; }
          if (n.fn === 'dmsdd') {
            var dl = dmsLiteral(n.a);
            if (!dl) throw new Unsupported('DMS▸DD of a result');
            emit(dl); return;
          }
          if (/h$/.test(n.fn)) {
            var base = n.fn.replace(/h$/, ''), arc = base.charAt(0) === 'a';
            if (arc) { k('hyp', '2ndf'); k(base.slice(1)); } else { k('hyp'); k(base); }
            sub(n.a, 8.5, true); return;
          }
          if (SH_POST[n.fn]) { sub(n.a, 9.5); var pk = SH_POST[n.fn]; k(pk[0], pk[1]); return; }
          var f = SH[n.fn];
          if (!f) throw new Unsupported('function ' + n.fn);
          k(f[0], f[1]);
          sub(n.a, 8.5, true);
          return;
        }
        case 'bin': {
          var pr = shPrio(n), opk = { add: 'add', sub: 'sub', mul: 'mul', div: 'div', pow: 'pow', root: 'pow', ncr: 'd5', npr: 'd6' }[n.op];
          if (n.op === 'root') {
            /* TI: y ˣ√y x is the x-th root of y. Sharp: x 2ndF ˣ√ y */
            sub(n.r, pr + 0.5); k('pow', '2ndf'); sub(n.l, pr + 0.5); return;
          }
          sub(n.l, n.op === 'pow' ? pr + 0.5 : pr);
          if (n.op === 'ncr' || n.op === 'npr') k(opk, '2ndf'); else k(opk);
          sub(n.r, pr + 0.5);
          return;
        }
        case 'pct': sub(n.a, 3.5); k('div'); numTok('100'); return;
        case 'pctof': sub(n.base, 3.5); k('mul'); sub(n.a, 3.5); k('div'); numTok('100'); return;
      }
      throw new Unsupported('node ' + n.t);
    }
    /* need: the priority the slot needs. Brackets go round anything that binds less tightly. A function written
       before its argument gets its argument in brackets unless it is a plain number. */
    function sub(n, need, fnArg) {
      var plain = n.t === 'num' && !n.neg && (n.ee === null || n.ee === undefined) || n.t === 'pi' || n.t === 'mem' || n.t === 'coordref';
      if (fnArg) { if (plain) emit(n); else paren(function () { emit(n); }); return; }
      if (shPrio(n) < need || (n.t === 'un' && SH[n.fn] && need > 5) || (n.t === 'frac' && need >= 8) || (n.t === 'num' && n.neg && need > 5) || (n.t === 'dmslit' && need >= 8)) paren(function () { emit(n); });
      else emit(n);
    }
    function dmsLiteral(a) {
      if (a.t !== 'num' || a.ee !== null && a.ee !== undefined) return null;
      var s = a.s, ip = s.split('.')[0] || '0', fp = (s.split('.')[1] || '');
      var mm = (fp + '00').slice(0, 2), ss = fp.length > 2 ? fp.slice(2, 4) + (fp.length > 4 ? '.' + fp.slice(4) : '') : '0';
      return { t: 'dmslit', d: String(parseInt(ip, 10)), m: String(parseInt(mm, 10)), s: String(Number(ss)), neg: a.neg };
    }
    /* coordinates used inside a larger expression: the conversion runs first, then RCL X or RCL Y */
    function lift(n, pre) {
      if (!n || typeof n !== 'object') return n;
      if (n.t === 'coord' && !pre.top) {
        pre.list.push(n);
        return { t: 'coordref', which: n.part };
      }
      var c = {};
      Object.keys(n).forEach(function (key) { c[key] = n[key]; });
      ['a', 'b', 'l', 'r', 'base'].forEach(function (key) { if (c[key]) c[key] = lift(c[key], { top: false, list: pre.list }); });
      if (c.t === 'mem') c.letterKey = SLOT_KEY(c.slot);
      return c;
    }
    /* memory letters A to F sit on the keys yˣ √ x² x³ log ln (ALPHA letters, EL-531TH guide p. 3) */
    function SLOT_KEY(slot) { return { A: 'pow', B: 'sqrt', C: 'sq', D: 'cube', E: 'log', F: 'ln' }[SLOT_LETTER[slot] || spillLetter(slot)]; }
    function spillLetter(slot) { return { 4: 'D', 5: 'E', 6: 'F' }[slot]; }
    function coordPart(n) {
      /* a 2ndF , b 2ndF →rθ (or →xy). Each part is a number, or worked out first and kept in D or E */
      var parts = [n.a, n.b].map(function (p, i) {
        if (p.t === 'num' && (p.ee === null || p.ee === undefined)) return p;
        if (p.t === 'mem') return lift(p, { top: false, list: [] });
        var slot = 4 + i;
        statement(p);
        k('sto'); k(SLOT_KEY(slot));
        k('onc');
        return { t: 'mem', slot: slot, letterKey: SLOT_KEY(slot) };
      });
      emit(parts[0]); k('sto', '2ndf'); emit(parts[1]);
      k(n.kind === 'r2p' ? 'd8' : 'd9', '2ndf');
    }
    function statement(node) {
      var pre = { top: true, list: [] };
      var tree = node.t === 'coord' ? node : lift(node, pre);
      pre.list.forEach(function (c) { coordPart(c); k('onc'); });
      if (tree.t === 'coord') { coordPart(tree); if (tree.part) k('exp', '2ndf'); return 'coord'; }
      if (tree.t === 'drgc') { sub(lift(tree.a, { top: false, list: [] }), 0); k('pi', '2ndf'); return 'end'; }
      emit(tree, {});
      return 'open';
    }
    var mode = 'DEG';
    function setMode(m) { while (mode !== m) { k('drg'); mode = NEXT[mode]; } }
    prog.events.forEach(function (ev) {
      if (ev.mode) { setMode(ev.mode); return; }
      if (ev.store) {
        var how = statement(ev.node);
        if (how === 'coord') { k('onc'); k('rcl'); k(ev.node.part ? 'sto' : 'rcl'); }
        k('sto'); k(SLOT_KEY(ev.store));
        k('onc');
        return;
      }
      if (ev.fmt !== undefined || ev.notation) throw new Unsupported('display format keys');
    });
    var x = prog.x, finalHow;
    var chk = {};
    function plainNum(n) { return n.t === 'num' && !n.neg && (n.ee === null || n.ee === undefined); }
    /* 2ndF % ends the calculation (Calculation Examples [4]): a+b% = a+a×b÷100, a−b% = a−a×b÷100, a×b% = a×b÷100,
       a÷b% = a÷b×100. Used only in those documented shapes, with plain numbers. */
    function nativePct(n) {
      if (n.t === 'bin' && (n.op === 'add' || n.op === 'sub') && n.r.t === 'pctof' && n.r.base === n.l && plainNum(n.l) && plainNum(n.r.a)) return [n.l, n.op, n.r.a];
      if (n.t === 'bin' && (n.op === 'mul' || n.op === 'div') && n.r.t === 'pct' && plainNum(n.l) && plainNum(n.r.a)) return [n.l, n.op, n.r.a];
      if (n.t === 'pctof' && plainNum(n.base) && plainNum(n.a)) return [n.base, 'mul', n.a];
      return null;
    }
    hasTrigIn(x, mode, chk);
    if (chk.bad) throw new Unsupported('angle unit changed inside one expression');
    var np = nativePct(x);
    if (np) {
      emitNum(np[0]); k(np[1]); emitNum(np[2]); k('d1', '2ndf');
      finalHow = 'end';
    } else if (prog.pending.length && !(x.t === 'num' && !x.neg)) {
      /* the TI-30Xa sequence stops part way with a worked-out value on its screen (a % amount, a function of the
         number keyed): the D.A.L. line shows that value with = */
      finalHow = statement(x);
      if (finalHow === 'open') k('eq');
    } else if (prog.pending.length) {
      /* the sequence stops part way: key the same unfinished line */
      prog.pending.forEach(function (o) { emit(lift(o.a, { top: false, list: [] })); k({ add: 'add', sub: 'sub', mul: 'mul', div: 'div', pow: 'pow' }[o.op] || 'mul'); });
      emit(lift(x, { top: false, list: [] }));
      finalHow = 'pending';
    } else if (x.t === 'num' && !x.neg && x.ee == null && !prog.showDms && !prog.events.some(function (e) { return e.store; })) {
      emitNum(x); finalHow = 'entry';
    } else {
      finalHow = statement(x);
      if (finalHow === 'open') k('eq');
    }
    if (prog.showDms) { k('dms', '2ndf'); }
    /* F⇄D: a b/c after a result switches decimal and fraction; d/c: 2ndF d/c switches mixed and improper
       (Calculation Examples [8], EL-531TH guide p. 19). A bare number is finished with = first. */
    if (prog.disp && prog.disp.length) {
      if (finalHow === 'entry') k('eq');
      prog.disp.forEach(function (d) { if (d === 'fd') k('abc'); else k('abc', '2ndf'); });
    }
    return { tokens: out, notes: notes, how: finalHow };
  }

  /* ---------- 2b. HP-15C (RPN) ---------- */
  var HPU = {
    sq: [['sqrt', 'g']], sqrt: [['sqrt']], inv: [['inv']], log: [['tenx', 'g']], ln: [['ex', 'g']], tenx: [['tenx']], ex: [['ex']],
    fact: [['d0', 'f']], sin: [['sin']], cos: [['cos']], tan: [['tan']], asin: [['sin', 'g']], acos: [['cos', 'g']], atan: [['tan', 'g']],
    sinh: [['gto', 'f'], ['sin']], cosh: [['gto', 'f'], ['cos']], tanh: [['gto', 'f'], ['tan']],
    asinh: [['gto', 'g'], ['sin']], acosh: [['gto', 'g'], ['cos']], atanh: [['gto', 'g'], ['tan']],
    dmsdd: [['d2', 'g']], neg: [['chs']]
  };
  var HP_BIN = { add: [['add']], sub: [['sub']], mul: [['mul']], div: [['div']], pow: [['pow']], ncr: [['add', 'g']], npr: [['add', 'f']] };
  var COMMUTE = { add: 1, mul: 1 };
  function emitHP(prog) {
    var out = [], noted = {}, free = [4, 5, 6, 7, 8, 9], lastEntry = false;
    function note(key, text) { if (noted[key]) return; noted[key] = 1; out.push({ note: text }); }
    /* CHS while a number is being keyed changes its sign and keeps the entry open (p. 19), so a number keyed next
       still needs ENTER */
    function k(id, shift) { out.push({ key: id, shift: shift || null }); lastEntry = id === 'chs' && !shift && lastEntry; }
    function keys(list) { list.forEach(function (p) { k(p[0], p[1]); }); }
    function numTok(s) {
      if (lastEntry) k('enter');
      out.push({ num: s }); lastEntry = true;
    }
    function emitNum(n) {
      numTok(n.s);
      if (n.ee !== null && n.ee !== undefined) { out.push({ key: 'eex', shift: null }); out.push({ num: n.ee || '0' }); if (n.eeNeg) out.push({ key: 'chs', shift: null }); }
      if (n.neg) out.push({ key: 'chs', shift: null });
      lastEntry = true;
    }
    /* stack levels a node needs (Sethi-Ullman). Coordinate results leave the second value behind. */
    function need(n) {
      switch (n.t) {
        case 'num': case 'pi': case 'mem': return 1;
        case 'frac': return 2;
        case 'un': return n.fn === 'cube' || n.fn === 'cbrt' ? Math.max(need(n.a), 2) : need(n.a);
        case 'pct': return Math.max(need(n.a), 2);
        case 'pctof': return Math.max(need(n.base), 1 + need(n.a));
        case 'drgc': return Math.max(need(n.a), 2);
        case 'coord': case 'bin': {
          if (n.t === 'bin' && n.r.t === 'pctof' && n.r.base === n.l) return need(n.r);
          var l = need(n.t === 'coord' ? n.b : n.l), r = need(n.t === 'coord' ? n.a : n.r);
          if (n.t === 'coord' && n.kind === 'r2p') { l = need(n.b); r = need(n.a); }
          /* keyed left to right (the way the expression is written) when that fits the 4 levels, else the deeper
             side first */
          var base = Math.max(l, r + 1) <= 4 ? Math.max(l, r + 1) : (l === r ? l + 1 : Math.max(l, r));
          return n.op === 'root' ? Math.max(base, 2) : base;
        }
      }
      return 1;
    }
    /* the positive of a negative value: a keyed negative number is keyed without its sign, anything else gets CHS */
    function emitPos(n) {
      if (n.t === 'num' && n.neg) { var c = {}; Object.keys(n).forEach(function (key) { c[key] = n[key]; }); c.neg = false; emitNum(c); return; }
      emit(n); k('chs');
    }
    function emit(n) {
      if (n.pos) { emitPos(n.a); return; }
      switch (n.t) {
        case 'num': emitNum(n); return;
        case 'pi': k('eex', 'g'); return;
        case 'mem': k('rcl'); k('d' + n.slot); return;
        case 'frac': {
          note('frac', 'Not on this model: no a b/c key. The fraction is keyed as a division.');
          var neg = n.neg;
          /* n ÷ d first, then the whole number is added: two stack levels, the same as a plain fraction */
          if (n.w !== null) { numTok(n.n); numTok(n.d); k('div'); numTok(n.w); k('add'); }
          else { numTok(n.n); numTok(n.d); k('div'); }
          if (neg) k('chs');
          return;
        }
        case 'un': {
          if (n.fn === 'cube') { note('cube', 'Not on this model: no x³ key. Use 3 yˣ.'); emit(n.a); numTok('3'); k('pow'); return; }
          if (n.fn === 'cbrt') {
            note('cbrt', 'Not on this model: no ³√x key. Use 3 1/x yˣ.');
            if (val(n.a) < 0) {
              /* yˣ needs a positive y when x is not a whole number: root of the positive value, sign back after */
              note('cbrtneg', 'For a negative number, CHS first, take the root, then CHS again.');
              emitPos(n.a); numTok('3'); k('inv'); k('pow'); k('chs'); return;
            }
            emit(n.a); numTok('3'); k('inv'); k('pow'); return;
          }
          if (n.fn === 'dmsdd' && n.a.t === 'num') { emitNum(n.a); keys(HPU.dmsdd); return; }
          var u = HPU[n.fn];
          if (!u) throw new Unsupported('function ' + n.fn);
          emit(n.a); keys(u); return;
        }
        case 'pct': note('pct', 'The TI-30Xa % here divides by 100.'); emit(n.a); numTok('100'); k('div'); return;
        case 'pctof': emit(n.base); emit(n.a); k('pow', 'g'); return;
        case 'drgc': {
          emit(n.a);
          if (n.from === 'DEG') { k('d3', 'f'); k('d8', 'g'); }
          else if (n.from === 'RAD') { note('drg', 'Not on this model: no radians-to-grads key. Use →DEG, then × 10 ÷ 9.'); k('d3', 'g'); numTok('10'); k('mul'); numTok('9'); k('div'); k('d9', 'g'); }
          else { note('drg2', 'Not on this model: no grads-to-degrees key. Use × 0.9.'); numTok('.9'); k('mul'); k('d7', 'g'); }
          return;
        }
        case 'coord': {
          /* →R: θ ENTER r f →R gives x (y in Y). →P: y ENTER x g →P gives r (θ in Y) */
          var first = n.kind === 'p2r' ? n.b : n.b, second = n.kind === 'p2r' ? n.a : n.a;
          pair(first, second);
          k('d1', n.kind === 'p2r' ? 'f' : 'g');
          return;
        }
        case 'bin': {
          if (n.op === 'root') {
            /* the x-th root of y is y^(1/x). An odd root of a negative number: root of the positive value, sign back */
            if (val(n.l) < 0) {
              note('rootneg', 'For a negative number, CHS first, take the root, then CHS again.');
              pair({ t: 'un', fn: 'neg', a: n.l, pos: true }, n.r, true); k('chs'); return;
            }
            pair(n.l, n.r, true); return;
          }
          if ((n.op === 'add' || n.op === 'sub') && n.r.t === 'pctof' && n.r.base === n.l) {
            /* a + b%: a ENTER b g % + (p. 29: % keeps the base number in Y) */
            emit(n.r); keys(HP_BIN[n.op]); return;
          }
          pair(n.l, n.r);
          keys(HP_BIN[n.op]);
          return;
        }
      }
      throw new Unsupported('node ' + n.t);
    }
    /* put a in Y and b in X: left to right when the stack holds it (pp. 37-38, order of entry and nested
       calculations), the deeper side first with x≶y when that saves a level, a storage register when even that
       would overflow the four levels */
    function pair(a, b, root) {
      var la = need(a), lb = need(b);
      if (Math.max(la, lb + 1) <= 4) {
        emitClean(a); emitClean(b);
      } else if (Math.max(la, lb) >= 4 && la === lb || la > 4 || lb > 4) {
        var reg = free.shift();
        if (reg === undefined) throw new Unsupported('too deep');
        emitClean(b); k('sto'); k('d' + reg); k('back', 'g');
        emitClean(a); k('rcl'); k('d' + reg);
        free.unshift(reg);
      } else if (lb > la) {
        emitClean(b); emitClean(a); k('xy');
      } else {
        emitClean(a); emitClean(b);
      }
      if (root) { k('inv'); k('pow'); }
    }
    /* an operand that is a coordinate result leaves its partner in Y. x≶y R↓ (or R↓ for the second value) drops it */
    function emitClean(n) {
      if (n.t === 'coord') { emit(n); if (n.part) k('rdn'); else { k('xy'); k('rdn'); } return; }
      emit(n);
    }
    var mode = 'DEG';
    function setMode(m) { if (m === mode) return; k({ DEG: 'd7', RAD: 'd8', GRAD: 'd9' }[m], 'g'); mode = m; }
    prog.events.forEach(function (ev) {
      if (ev.mode) { setMode(ev.mode); return; }
      if (ev.store) {
        if (need(ev.node) > 4) throw new Unsupported('too deep');
        emitClean(ev.node); k('sto'); k('d' + ev.store);
        return;
      }
      if (ev.fmt !== undefined || ev.notation) throw new Unsupported('display format keys');
    });
    var x = prog.x, chk = {};
    hasTrigIn(x, mode, chk);
    if (chk.bad) throw new Unsupported('angle unit changed inside one expression');
    if (prog.pending.length) {
      prog.pending.forEach(function (o) { emitClean(o.a); });
      emitClean(x);
    } else if (x.t === 'coord') {
      emit(x);
      if (x.part) k('xy');
    } else {
      if (need(x) > 4 && x.t !== 'bin') throw new Unsupported('too deep');
      emit(x);
    }
    if (prog.showDms) { k('d2', 'f'); note('hms', 'The answer shows as degrees.minutes seconds: 99.0500 means 99°05′00″.'); }
    if (prog.disp && prog.disp.length) note('fd', 'Not on this model: no fraction display. The answer shows as a decimal.');
    return { tokens: out };
  }

  /* ---------- 3. Public: translate, tokens, key presses ---------- */
  var SEPARATOR = {
    ti30xa: [{ key: 'onc', shift: null }, { key: 'onc', shift: null }],
    el531xt: [{ key: 'onc', shift: null }, { key: 'onc', shift: null }],
    hp15c: [{ key: 'back', shift: 'g' }, { key: 'back', shift: 'g' }]
  };
  var cache = {};
  function splitRows(seq) { return String(seq).trim().split(/\s+ON\/C\s+ON\/C\s+/); }
  function translateOne(seq, model) {
    var prog = readTI(seq);
    if (model === 'el531xt') return emitSharp(prog).tokens;
    if (model === 'hp15c') return emitHP(prog).tokens;
    throw new Error('Unknown model ' + model);
  }
  /* tokens for the model: numbers, keys (with their shift key) and notes. Throws Unsupported when a TI key has no
     counterpart that keeps the value. */
  function translate(seq, model) {
    var ck = model + '|' + seq;
    if (cache[ck]) return cache[ck];
    var rows = splitRows(seq), out = [];
    rows.forEach(function (r, i) {
      if (i) out = out.concat(SEPARATOR[model]);
      out = out.concat(translateOne(r, model));
    });
    cache[ck] = out;
    return out;
  }
  /* the key presses behind the tokens, each with the index of its chip (notes have no chip) */
  function presses(tokens) {
    var list = [], chip = -1;
    tokens.forEach(function (t) {
      if (t.note) return;
      chip++;
      if (t.num != null) { String(t.num).split('').forEach(function (c) { list.push({ id: c === '.' ? 'dot' : 'd' + c, chip: chip, fast: true }); }); return; }
      if (t.shift) list.push({ id: t.shift, chip: chip });
      list.push({ id: t.key, chip: chip });
    });
    return list;
  }
  return { readTI: readTI, translate: translate, presses: presses, Unsupported: Unsupported, SEPARATOR: SEPARATOR, emitSharp: emitSharp, emitHP: emitHP };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = CalcTranslate;
