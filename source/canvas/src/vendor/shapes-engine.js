/*
 * ACCESS Shape Engine
 * Flat shapes, 3D solids and nets as PowerPoint-safe SVG, plus worked calculations.
 * Browser: window.Shapes. Node: module.exports. No dependencies.
 *
 * API
 *   Shapes.list()                         -> [{id, name, kind, group, params, hasNet}]
 *   Shapes.info(id)                       -> same record for one shape
 *   Shapes.defaults(id)                   -> {param: value}
 *   Shapes.validate(id, params)           -> null or {k, msg}
 *   Shapes.random(id, mode)               -> params ('whole' | 'half' | 'tenth')
 *   Shapes.render(id, params, opts)       -> SVG string (flat shape or 3D view)
 *   Shapes.net(id, params, opts)          -> SVG string, or null when the solid has no net
 *   Shapes.calc(id, params, units, ao)    -> {items:[{name, sym, key, value, unit, lines[], hl[]}], notes[]}
 *   Shapes.layout(id, params, units)      -> {items, notes} layout math for the flat pattern (solids with a net), or null
 *   Shapes.angleParams(id)                -> angle-input parameter list for a triangle, or null
 *   opts: labels 'letters'|'values'|'both'|'none', plain bool, units 'mm'|'cm'|'m'|'in'|'ft',
 *         derived 'show'|'ask'|'hide' (or true/false), hidden bool (3D hidden edges),
 *         yaw, pitch (degrees), thumb bool, frame [x,y,w,h], zoom number,
 *         angles bool and angleInput 'sides'|'angle' (triangles), hl [part strings] (glow layer, screen only)
 *   ao (angle options for defaults/validate/random/calc): {angles: bool, angleInput: 'sides'|'angle'}
 *   hl parts: fill, outline, all, side, inner, bottom, top, ends, panels:lat|base|top|all, blank, folds, dim:<letter>, ang:<letter>
 *   Shapes.terms()                        -> glossary {key: {label, def, hl(id, params, view, opts)}}
 *   Shapes.termParts(key, id, params, opts) -> the hl parts that term lights on this drawing ([] = definition only)
 *   Shapes.findTerms(text)                -> [{start, end, key}] glossary words found in a piece of text
 *
 * Added Oct 2026 (all opt-in: without these options every call returns exactly what it returned before)
 *   opts.allAngles true    angle arcs and degree labels on every flat shape, 3D view and net (render, net)
 *   opts.moreDims true     a few extra derived sizes on the drawing (diagonals)
 *   opts.derivedAngles     'show' | 'ask' | 'hide' for worked-out angles only (default: the same as opts.derived)
 *   opts.lenFormat(value, units, pow)   returns the text for a size label value (with its unit), or null for the usual text
 *   opts.labelSize px      label font size (default 15). opts.arrow px: arrowhead length (default 9)
 *   opts.arrowMax f        arrowheads at most f times the length of their dimension line (for small parts)
 *   opts.precision n       decimals in the SVG coordinates (default 2)
 *   opts.parts true        data-part on every drawn element: body, edge, hidden, aux, fold, derived, mark, right-angle, tick,
 *                          angle, leader, dot, dim, dim-ext, dim-arrow, label-box, label
 *   ao.full true           calc returns every size that can be worked out, each item with a group (calcFull is the same)
 *   Shapes.list({all: true})          also lists the 3D equivalents added for the flat shapes (info(id).added is true)
 *   Shapes.solidsOf(flatId, params)   -> [{id, how, text, name, params, carried, added}] the 3D equivalents of a flat shape
 *   Shapes.flatOf(solidId)            -> [{id, how, text}] the flat shapes a solid comes from
 *   Shapes.solve(id, known, units, ao) -> {ok, params, steps[], via, calc, alt?, note?} or {ok: false, msg}
 *   Shapes.solvePaths(id)             -> the sets of known sizes that have a worked formula path
 *   Shapes.terms({all: true}), Shapes.findTerms(text, {all: true})   also the new glossary words
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Shapes = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var PI = Math.PI, D2R = PI / 180, SQ3 = Math.sqrt(3), SQ2 = Math.SQRT2;
  var COL = {
    edge: '#940010', hidden: '#DD6673', flat: '#FFEBB2', fold: '#4A4E54', dim: '#4A4E54',
    ink: '#1A1A1A', red: '#D2181F', white: '#FFFFFF', ramp: ['#FFBC00', '#FFD766', '#FFF8E6']
  };
  var FONT = 'IBM Plex Sans, Segoe UI, Arial, sans-serif';
  var FS = 15, AH = 9, AW = 3.3;
  /* drawing options for one render or net call (opts.labelSize, opts.arrow, opts.arrowMax, opts.precision, opts.parts) */
  var P10 = 100, PARTS = false, AMAX = 0;
  var LAYER_PART = { fill: 'body', edge: 'edge', hid: 'hidden', aux: 'aux', ann: 'derived', mark: 'mark', dim: 'dim' };
  function withSty(o, f) {
    o = o || {};
    var keep = [FS, AH, AW, P10, PARTS, AMAX];
    try {
      FS = +o.labelSize > 0 ? +o.labelSize : 15;
      AH = +o.arrow > 0 ? +o.arrow : 9; AW = 3.3 * AH / 9;
      P10 = o.precision != null && isFinite(o.precision) && o.precision >= 0 ? Math.pow(10, Math.min(6, Math.round(o.precision))) : 100;
      PARTS = !!o.parts;
      AMAX = +o.arrowMax > 0 ? +o.arrowMax : 0;
      return f();
    } finally { FS = keep[0]; AH = keep[1]; AW = keep[2]; P10 = keep[3]; PARTS = keep[4]; AMAX = keep[5]; }
  }
  function partAttr(layer, part) { return PARTS ? 'data-part="' + (part || LAYER_PART[layer] || layer) + '" ' : ''; }
  function isAll(o) { return !!o && (o === 'all' || !!o.all); }

  /* ---------------- numbers and text ---------------- */
  function round2(n) { var r = Math.round(n * 100) / 100; return (r === 0) ? 0 : r; }
  var NUMFMT = typeof Intl !== 'undefined' && Intl.NumberFormat ? new Intl.NumberFormat('en-CA', { maximumFractionDigits: 2 }) : null, NUMONLY = false;
  function fmt(n) {
    if (NUMONLY) return '';
    if (!isFinite(n)) return '?';
    return NUMFMT ? NUMFMT.format(round2(n)) : round2(n).toLocaleString('en-CA', { maximumFractionDigits: 2 });
  }
  function N(n) { var r = Math.round(n * P10) / P10; return String(r === 0 ? 0 : r); }
  function unitStr(u, pow) { return u + (pow === 2 ? '²' : pow === 3 ? '³' : ''); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function tw(s) { return 0.56 * FS * Array.from(String(s)).length; }

  /* ---------------- vectors ---------------- */
  function add(a, b) { return a.length === 3 ? [a[0] + b[0], a[1] + b[1], a[2] + b[2]] : [a[0] + b[0], a[1] + b[1]]; }
  function sub(a, b) { return a.length === 3 ? [a[0] - b[0], a[1] - b[1], a[2] - b[2]] : [a[0] - b[0], a[1] - b[1]]; }
  function mul(a, k) { return a.length === 3 ? [a[0] * k, a[1] * k, a[2] * k] : [a[0] * k, a[1] * k]; }
  function dot(a, b) { return a.length === 3 ? a[0] * b[0] + a[1] * b[1] + a[2] * b[2] : a[0] * b[0] + a[1] * b[1]; }
  function len(a) { return Math.sqrt(dot(a, a)); }
  function nrm(a) { var l = len(a) || 1; return mul(a, 1 / l); }
  function lerp(a, b, t) { return add(a, mul(sub(b, a), t)); }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function newell(P) {
    var n = [0, 0, 0];
    for (var i = 0; i < P.length; i++) {
      var a = P[i], b = P[(i + 1) % P.length];
      n[0] += (a[1] - b[1]) * (a[2] + b[2]);
      n[1] += (a[2] - b[2]) * (a[0] + b[0]);
      n[2] += (a[0] - b[0]) * (a[1] + b[1]);
    }
    return n;
  }

  /* ---------------- colour ---------------- */
  function hex2rgb(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
  function rgb2hex(c) { return '#' + c.map(function (v) { var s = Math.round(v).toString(16).toUpperCase(); return s.length < 2 ? '0' + s : s; }).join(''); }
  var RAMP = COL.ramp.map(hex2rgb);
  function rampColor(t) {
    t = Math.max(0, Math.min(1, t));
    t = Math.round(t * 96) / 96;
    var a, b, u;
    if (t <= 0.5) { a = RAMP[0]; b = RAMP[1]; u = t / 0.5; } else { a = RAMP[1]; b = RAMP[2]; u = (t - 0.5) / 0.5; }
    return rgb2hex([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]);
  }
  var LIGHT = nrm([-0.45, 0.8, 0.5]);

  /* ---------------- labels ---------------- */
  function lab(letter, value, pow, derived, extra) {
    var o = { letter: letter, value: value, pow: pow == null ? 1 : pow, derived: !!derived };
    if (extra) for (var k in extra) o[k] = extra[k];
    return o;
  }
  function labelText(l, o) {
    if (!l) return '';
    var dm = l.unit === '°' && o.derivedAngles ? o.derivedAngles : o.derived;
    if (l.derived && dm === 'hide') return null;
    if (o.labels === 'none') return '';
    var ask = l.derived && dm === 'ask';
    var val = l.unit === '°' ? fmt(l.value) + '°' : fmt(l.value) + ' ' + unitStr(o.units, l.pow);
    if (l.unit !== '°' && typeof o.lenFormat === 'function') { var fv = o.lenFormat(l.value, o.units, l.pow); if (fv != null && fv !== '') val = String(fv); }
    if (o.labels === 'letters') return l.letter;
    if (o.labels === 'values') return ask ? '?' : val;
    return l.letter + ' = ' + (ask ? '?' : val);
  }
  function normOpts(o) {
    var d = { labels: 'letters', units: 'cm', derived: 'show', hidden: true, yaw: -32, pitch: 24 };
    o = o || {};
    for (var k in o) if (o[k] !== undefined) d[k] = o[k];
    if (d.derived === true) d.derived = 'show';
    if (d.derived === false) d.derived = 'hide';
    if (d.derivedAngles === true) d.derivedAngles = 'show';
    if (d.derivedAngles === false) d.derivedAngles = 'hide';
    if (d.labels === 'plain') d.plain = true;
    if (d.thumb) d.plain = true;
    return d;
  }

  /* ---------------- SVG canvas ---------------- */
  function Canvas(thumb) {
    this.thumb = !!thumb;
    this.L = { fill: [], hid: [], aux: [], ann: [], edge: [], mark: [], dim: [], lab: [], hl: [] };
    this.x0 = Infinity; this.y0 = Infinity; this.x1 = -Infinity; this.y1 = -Infinity;
    this.boxes = [];
  }
  Canvas.prototype.ext = function (x, y) {
    if (x < this.x0) this.x0 = x; if (x > this.x1) this.x1 = x;
    if (y < this.y0) this.y0 = y; if (y > this.y1) this.y1 = y;
  };
  Canvas.prototype.d = function (pts, closed) {
    var s = '';
    for (var i = 0; i < pts.length; i++) { s += (i ? 'L' : 'M') + N(pts[i][0]) + ' ' + N(pts[i][1]); this.ext(pts[i][0], pts[i][1]); }
    return s + (closed ? 'Z' : '');
  };
  Canvas.prototype.path = function (layer, pts, attrs, closed, part) {
    if (pts.length < 2) return;
    this.L[layer].push('<path ' + partAttr(layer, part) + 'd="' + this.d(pts, closed) + '" ' + attrs + '/>');
  };
  Canvas.prototype.multi = function (layer, rings, attrs, part) {
    var self = this, d = rings.map(function (r) { return self.d(r, true); }).join('');
    this.L[layer].push('<path ' + partAttr(layer, part) + 'd="' + d + '" ' + attrs + '/>');
  };
  Canvas.prototype.arrow = function (tip, dir, ah, aw) {
    ah = ah || AH; aw = aw || AW;
    var b = sub(tip, mul(dir, ah)), p = [-dir[1], dir[0]];
    this.path('dim', [tip, add(b, mul(p, aw)), sub(b, mul(p, aw))], 'fill="' + COL.dim + '" stroke="none"', true, 'dim-arrow');
  };
  Canvas.prototype.label = function (c, text, color, nudge) {
    if (!text) return;
    var w = tw(text) + 8, h = FS * 1.3;
    var nd = nudge ? nrm(nudge) : [0, 1];
    var step = Math.abs(nd[0]) * (w * 0.55) + Math.abs(nd[1]) * (h * 0.9);
    var cx = c[0], cy = c[1], tries = [0, 1, -1, 2, -2, 3, -3, 4, 5];
    for (var i = 0; i < tries.length; i++) {
      var x = c[0] + nd[0] * tries[i] * step, y = c[1] + nd[1] * tries[i] * step, box = [x - w / 2, y - h / 2, w, h];
      var hit = this.boxes.some(function (b) { return box[0] < b[0] + b[2] && b[0] < box[0] + box[2] && box[1] < b[1] + b[3] && b[1] < box[1] + box[3]; }) ||
        !!(this.segs && this.segs.some(function (sg) { return segBlocksBox(sg, box); }));
      if (!hit) { cx = x; cy = y; break; }
    }
    var box = [cx - w / 2, cy - h / 2, w, h];
    this.boxes.push(box);
    this.ext(cx - w / 2, cy - h / 2); this.ext(cx + w / 2, cy + h / 2);
    this.L.lab.push('<rect ' + partAttr('lab', 'label-box') + 'x="' + N(cx - w / 2) + '" y="' + N(cy - h / 2) + '" width="' + N(w) + '" height="' + N(h) + '" rx="2" fill="' + COL.white + '"/>' +
      '<text ' + partAttr('lab', 'label') + 'x="' + N(cx) + '" y="' + N(cy + 0.35 * FS) + '" text-anchor="middle" font-family="' + FONT + '" font-size="' + FS + '" font-weight="600" fill="' + color + '">' + esc(text) + '</text>');
    return box;
  };
  /* glow layer (screen only): drawn last, never part of an export */
  var HL_FILL = 'fill="#FF6A00" fill-opacity="0.45" fill-rule="nonzero" stroke="none"';
  var HL_LINE = 'fill="none" stroke="#FF6A00" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"';
  function dq(pts, closed) {
    var t = '';
    for (var i = 0; i < pts.length; i++) t += (i ? 'L' : 'M') + N(pts[i][0]) + ' ' + N(pts[i][1]);
    return t + (closed ? 'Z' : '');
  }
  function ccw(r) {
    var a = 0;
    for (var i = 0; i < r.length; i++) { var p = r[i], q = r[(i + 1) % r.length]; a += p[0] * q[1] - q[0] * p[1]; }
    return a < 0 ? r.slice().reverse() : r;
  }
  Canvas.prototype.hlFill = function (part, rings) {
    if (!rings.length) return;
    this.L.hl.push('<path class="hl-fill" data-hl="' + esc(part) + '" d="' + rings.map(function (r) { return dq(ccw(r), true); }).join('') + '" ' + HL_FILL + '/>');
  };
  Canvas.prototype.hlLine = function (part, lines, closed) {
    lines = lines.filter(function (l) { return l && l.length > 1; });
    if (!lines.length) return;
    this.L.hl.push('<path class="hl-line" data-hl="' + esc(part) + '" d="' + lines.map(function (l) { return dq(l, closed); }).join('') + '" ' + HL_LINE + '/>');
  };
  Canvas.prototype.hlBox = function (part, b) {
    if (!b) return;
    this.L.hl.push('<rect class="hl-line" data-hl="' + esc(part) + '" x="' + N(b[0] - 6) + '" y="' + N(b[1] - 6) + '" width="' + N(b[2] + 12) + '" height="' + N(b[3] + 12) + '" rx="7" ' + HL_LINE + '/>');
  };
  /* which glow part (if any) a labelled item answers to */
  function hlWants(o, part) { return !!(o.hl && o.hl.indexOf(part) >= 0); }
  function hlDim(o, letter, kind) { return letter && hlWants(o, (kind || 'dim') + ':' + letter) ? (kind || 'dim') + ':' + letter : null; }
  Canvas.prototype.svg = function (o) {
    var m = this.thumb ? 3 : 12;
    if (!isFinite(this.x0)) { this.x0 = this.y0 = 0; this.x1 = this.y1 = 10; }
    var x = this.x0 - m, y = this.y0 - m, w = this.x1 - this.x0 + 2 * m, h = this.y1 - this.y0 + 2 * m;
    if (o.frame) { x = o.frame[0]; y = o.frame[1]; w = o.frame[2]; h = o.frame[3]; }
    if (o.frame && o.allAngles) {
      /* every angle marked: grow a fixed frame so no label or mark is cut off */
      var gx0 = Math.min(x, this.x0 - m), gy0 = Math.min(y, this.y0 - m), gx1 = Math.max(x + w, this.x1 + m), gy1 = Math.max(y + h, this.y1 + m);
      x = gx0; y = gy0; w = gx1 - gx0; h = gy1 - gy0;
    }
    var z = o.zoom || 1, L = this.L;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + N(w * z) + '" height="' + N(h * z) + '" viewBox="' + N(x) + ' ' + N(y) + ' ' + N(w) + ' ' + N(h) + '">' +
      L.fill.join('') + L.hid.join('') + L.aux.join('') + L.ann.join('') + L.edge.join('') + L.mark.join('') + L.dim.join('') +
      /* glow sits over every line and fill of the drawing; the label boxes stay above it so the letters remain readable */
      (L.hl.length ? '<g data-layer="glow">' + L.hl.join('') + '</g>' : '') + L.lab.join('') + '</svg>';
  };
  var A_DIM = 'fill="none" stroke="' + COL.dim + '" stroke-width="1.25" stroke-linecap="round"';
  function attrsLine(color, w, dash) {
    return 'fill="none" stroke="' + color + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"' + (dash ? ' stroke-dasharray="' + dash + '"' : '');
  }

  /* dimension in screen space: A, B points, n outward unit normal, off px */
  function drawDim(cv, A, B, text, n, off, hlPart) {
    var d = sub(B, A), L = len(d);
    if (L < 1e-6) return;
    var u = mul(d, 1 / L), A2 = add(A, mul(n, off)), B2 = add(B, mul(n, off)), box = null;
    /* opts.arrowMax: arrowheads no longer than that fraction of the dimension (short dimensions on small drawings) */
    var ah = AMAX ? Math.max(2, Math.min(AH, AMAX * L)) : AH, aw = AW * ah / AH;
    if (hlPart) cv.hlLine(hlPart, [[A2, B2], [add(A, mul(n, 3)), add(A, mul(n, off + 6))], [add(B, mul(n, 3)), add(B, mul(n, off + 6))]]);
    if (text === null) return;
    if (off > 4) {
      cv.path('dim', [add(A, mul(n, 3)), add(A, mul(n, off + 6))], A_DIM, false, 'dim-ext');
      cv.path('dim', [add(B, mul(n, 3)), add(B, mul(n, off + 6))], A_DIM, false, 'dim-ext');
    }
    if (L >= 2 * ah + 6) {
      cv.path('dim', [A2, B2], A_DIM);
      cv.arrow(A2, mul(u, -1), ah, aw); cv.arrow(B2, u, ah, aw);
    } else {
      cv.path('dim', [sub(A2, mul(u, ah + 10)), add(B2, mul(u, ah + 10))], A_DIM);
      cv.arrow(A2, u, ah, aw); cv.arrow(B2, mul(u, -1), ah, aw);
    }
    if (text) {
      var bw = tw(text) + 8, bh = FS * 1.3;
      var along = Math.abs(u[0]) * bw + Math.abs(u[1]) * bh;
      var c = lerp(A2, B2, 0.5);
      if (along > L - 2 * ah - 4) {
        var across = Math.abs(n[0]) * bw + Math.abs(n[1]) * bh;
        c = add(c, mul(n, across / 2 + 3));
      }
      box = cv.label(c, text, COL.ink, n);
      if (hlPart) cv.hlBox(hlPart, box);
    }
  }
  function drawRA(cv, p, u, v, k, dash, hlPart) {
    var pts = [add(p, mul(u, k)), add(add(p, mul(u, k)), mul(v, k)), add(p, mul(v, k))];
    if (dash !== null) cv.path('mark', pts, attrsLine(COL.dim, 1.25, dash ? '3 3' : null), false, 'right-angle');
    if (hlPart) cv.hlLine(hlPart, [pts]);
  }

  /* chain short segments into polylines (keys rounded) */
  function chain(segs, q) {
    q = q || 20;
    var key = function (p) { return Math.round(p[0] * q) + ',' + Math.round(p[1] * q); };
    var map = {}, used = new Array(segs.length), out = [];
    segs.forEach(function (s, i) {
      [key(s.a), key(s.b)].forEach(function (k) { (map[k] = map[k] || []).push(i); });
    });
    function next(pt) {
      var l = map[key(pt)] || [];
      for (var j = 0; j < l.length; j++) if (!used[l[j]]) return l[j];
      return -1;
    }
    for (var i = 0; i < segs.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      var pts = [segs[i].a, segs[i].b], j;
      while ((j = next(pts[pts.length - 1])) >= 0) {
        used[j] = true;
        var s = segs[j];
        pts.push(key(s.a) === key(pts[pts.length - 1]) ? s.b : s.a);
      }
      while ((j = next(pts[0])) >= 0) {
        used[j] = true;
        var s2 = segs[j];
        pts.unshift(key(s2.a) === key(pts[0]) ? s2.b : s2.a);
      }
      out.push(pts);
    }
    return out;
  }

  /* ---------------- 2D primitive helpers ---------------- */
  function shape() { return { t: 'shape', rings: Array.prototype.slice.call(arguments) }; }
  function dim(a, b, l, o) { var p = { t: 'dim', a: a, b: b, lab: l }; if (o) for (var k in o) p[k] = o[k]; return p; }
  function ann(a, b, l, o) { var p = { t: 'ann', a: a, b: b, lab: l, at: 0.5 }; if (o) for (var k in o) p[k] = o[k]; return p; }
  function aux(a, b, o) { var p = { t: 'aux', a: a, b: b }; if (o) for (var k in o) p[k] = o[k]; return p; }
  function ra(p, u, v, o) { var r = { t: 'ra', p: p, u: u, v: v }; if (o) for (var k in o) r[k] = o[k]; return r; }
  function tick(a, b, n) { return { t: 'tick', a: a, b: b, n: n || 1 }; }
  function ticks(pts, n) { return pts.map(function (p, i) { return tick(p, pts[(i + 1) % pts.length], n); }); }
  function dotP(p) { return { t: 'dot', p: p }; }
  function glow(letter, pts, closed) { return { t: 'glow', letter: letter, pts: pts, closed: !!closed }; }
  /* math angle (degrees, counter-clockwise) to y-down point */
  function pol(c, r, deg) { return [c[0] + r * Math.cos(deg * D2R), c[1] - r * Math.sin(deg * D2R)]; }
  function arc(c, r, d0, d1, n) {
    var pts = [], k = Math.max(2, Math.ceil(Math.abs(d1 - d0) / 360 * n));
    for (var i = 0; i <= k; i++) pts.push(pol(c, r, d0 + (d1 - d0) * i / k));
    return pts;
  }
  function circ(c, r, n) { var pts = []; for (var i = 0; i < n; i++) pts.push(pol(c, r, 360 * i / n)); return pts; }

  /* ---------------- 2D renderer ---------------- */
  function boxHitsCircle(bx, c, r) {
    var qx = Math.max(bx[0], Math.min(c[0], bx[0] + bx[2])), qy = Math.max(bx[1], Math.min(c[1], bx[1] + bx[3]));
    return Math.hypot(qx - c[0], qy - c[1]) < r;
  }
  function render2D(prims, o, fitW, fitH) {
    var thumb = !!o.thumb, plain = !!o.plain, H = !thumb && o.hl && o.hl.length;
    var W = thumb ? 58 : (fitW || 380), Ht = thumb ? 44 : (fitH || 270);
    var sw = thumb ? 1.4 : 2.25;
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    function addP(p) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
    prims.forEach(function (pr) {
      if (pr.rings) pr.rings.forEach(function (r) { r.forEach(addP); });
      if (pr.t === 'ann' || pr.t === 'aux') { addP(pr.a); addP(pr.b); }
      if (pr.pts && pr.t !== 'glow') pr.pts.forEach(addP);
    });
    var s = Math.min(W / Math.max(x1 - x0, 1e-9), Ht / Math.max(y1 - y0, 1e-9));
    var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    function T(p) { return [(p[0] - cx) * s, (p[1] - cy) * s]; }
    var cv = new Canvas(thumb);
    var sp = [];
    prims.forEach(function (pr) { if (pr.t === 'shape' || pr.t === 'panel') pr.rings.forEach(function (r) { r.forEach(function (p) { sp.push(T(p)); }); }); });
    var cen = sp.reduce(function (a, p) { return [a[0] + p[0] / sp.length, a[1] + p[1] / sp.length]; }, [0, 0]);
    var bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
    if (prims.some(function (pr) { return pr.near || pr.fit; })) {
      cv.cen = cen;
      cv.angCorners = prims.filter(function (pr) { return pr.t === 'angle' || (pr.t === 'ra' && pr.lab); }).map(function (pr) { return T(pr.t === 'ra' ? pr.p : pr.c); });
      cv.polyVerts = [];
      prims.forEach(function (pr) { if ((pr.t === 'shape' || pr.t === 'panel') && pr.rings) pr.rings.forEach(function (r) { if (r.length <= 16) r.forEach(function (q) { cv.polyVerts.push(T(q)); }); }); });
    }

    prims.forEach(function (pr) {
      var rings, txt, hp = null;
      if (pr.t === 'shape') {
        rings = pr.rings.map(function (r) { return r.map(T); });
        cv.multi('fill', rings, 'fill="' + COL.flat + '" fill-rule="evenodd" stroke="none"');
        cv.multi('edge', rings, attrsLine(COL.edge, sw));
        if (H && hlWants(o, 'fill')) cv.L.hl.push('<path class="hl-fill" data-hl="fill" d="' + rings.map(function (r) { return dq(r, true); }).join('') + '" ' + HL_FILL.replace('nonzero', 'evenodd') + '/>');
        if (H && hlWants(o, 'outline')) cv.hlLine('outline', rings, true);
        return;
      }
      if (pr.t === 'panel') {
        rings = pr.rings.map(function (r) { return r.map(T); });
        cv.multi('fill', rings, 'fill="' + COL.flat + '" fill-rule="evenodd" stroke="none"');
        rings.forEach(function (r) { r.forEach(function (q) { bx0 = Math.min(bx0, q[0]); bx1 = Math.max(bx1, q[0]); by0 = Math.min(by0, q[1]); by1 = Math.max(by1, q[1]); }); });
        if (H) {
          var pp = hlWants(o, 'panels:' + pr.role) ? 'panels:' + pr.role : hlWants(o, 'panels:all') ? 'panels:all' : null;
          if (pp) { cv.hlFill(pp, rings); cv.hlLine(pp, rings, true); }
        }
        return;
      }
      if (pr.t === 'cut') { cv.path('edge', pr.pts.map(T), attrsLine(COL.edge, sw), pr.closed); return; }
      if (pr.t === 'fold') {
        cv.path('aux', [T(pr.a), T(pr.b)], attrsLine(COL.fold, thumb ? 1 : 1.5, thumb ? '4 3' : '8 5'), false, 'fold');
        if (H && hlWants(o, 'folds')) cv.hlLine('folds', [[T(pr.a), T(pr.b)]]);
        return;
      }
      if (pr.t === 'glow') {
        if (H && (hp = hlDim(o, pr.letter, pr.kind))) cv.hlLine(hp, [pr.pts.map(T)], !!pr.closed);
        return;
      }
      if (plain) return;
      var letter = pr.lab ? pr.lab.letter : pr.hlLetter;
      if (H) hp = hlDim(o, letter, pr.t === 'angle' || (pr.t === 'ra' && pr.lab) ? 'ang' : 'dim');
      var gone = (pr.derived && ((pr.t === 'angle' || pr.t === 'ra') && o.derivedAngles ? o.derivedAngles : o.derived) === 'hide');
      if (pr.lab) { txt = labelText(pr.lab, o); if (txt === null) gone = true; }
      var A, B, n, u, bxx;
      if (gone) {
        /* hidden from the drawing, but the glow still shows where it is */
        if (!hp) return;
        txt = null;
      }
      switch (pr.t) {
        case 'aux':
          if (!gone) cv.path('aux', [T(pr.a), T(pr.b)], attrsLine(COL.dim, 1.25, '5 4'));
          break;
        case 'auxp':
          /* dashed helper curve (the part of a cutter circle that is not on the shape) */
          if (!gone) cv.path('aux', pr.pts.map(T), attrsLine(COL.dim, 1.25, '5 4'), !!pr.closed);
          break;
        case 'ann':
          A = T(pr.a); B = T(pr.b);
          if (!gone) cv.path('ann', [A, B], attrsLine(COL.red, 1.75, pr.dash ? '6 4' : null));
          if (hp) cv.hlLine(hp, [[A, B]]);
          if (txt) {
            u = nrm(sub(B, A));
            var ln2 = [-u[1], u[0]], lc = lerp(A, B, pr.at);
            if (pr.beside) {
              /* label sits next to the line instead of on it (diameter lines) */
              if (ln2[1] > 0) ln2 = mul(ln2, -1);
              lc = add(lc, mul(ln2, Math.abs(ln2[0]) * (tw(txt) + 8) / 2 + Math.abs(ln2[1]) * FS * 0.65 + 3));
            }
            bxx = cv.label(lc, txt, COL.red, ln2);
            if (hp) cv.hlBox(hp, bxx);
          }
          break;
        case 'ra':
          var ru = nrm(pr.u), rv = nrm(pr.v);
          drawRA(cv, T(pr.p), ru, rv, 11, gone ? null : false, hp);
          if (txt) {
            var od = nrm(mul(add(ru, rv), -1)), hr = Math.abs(od[0]) * (tw(txt) + 8) / 2 + Math.abs(od[1]) * FS * 0.65;
            bxx = cv.label(add(T(pr.p), mul(od, 8 + hr)), txt, COL.ink, od);
            if (hp) cv.hlBox(hp, bxx);
          }
          break;
        case 'tick':
          A = T(pr.a); B = T(pr.b); u = nrm(sub(B, A)); n = [-u[1], u[0]];
          var m = lerp(A, B, 0.5);
          for (var k = 0; k < pr.n; k++) {
            var c = add(m, mul(u, (k - (pr.n - 1) / 2) * 4.5));
            cv.path('mark', [add(c, mul(n, 6)), sub(c, mul(n, 6))], attrsLine(COL.dim, 1.5), false, 'tick');
          }
          break;
        case 'dot':
          A = T(pr.p);
          cv.L.mark.push('<circle ' + partAttr('mark', 'dot') + 'cx="' + N(A[0]) + '" cy="' + N(A[1]) + '" r="2.75" fill="' + COL.edge + '"/>');
          cv.ext(A[0], A[1]);
          break;
        case 'angle':
          A = T(pr.c);
          var rp = pr.rp || 26, pts = [], ks = 28;
          if (pr.fit) rp = fitRp(cv, A, pr.a0, pr.a1, rp, pr.rmax != null ? pr.rmax * s : Infinity);
          for (var i = 0; i <= ks; i++) { var a = pr.a0 + (pr.a1 - pr.a0) * i / ks; pts.push([A[0] + rp * Math.cos(a), A[1] + rp * Math.sin(a)]); }
          if (!gone) cv.path('mark', pts, attrsLine(COL.dim, 1.5), false, 'angle');
          if (hp) cv.hlLine(hp, [pts]);
          if (txt) {
            var am = (pr.a0 + pr.a1) / 2, dir = [Math.cos(am), Math.sin(am)];
            if (pr.out) dir = mul(dir, -1);
            var half = Math.abs(dir[0]) * (tw(txt) + 8) / 2 + Math.abs(dir[1]) * FS * 0.65;
            if (pr.near || pr.fit) bxx = angLabelNear(cv, A, pts[ks / 2], dir, txt, pr.out ? 8 : rp + 5, o);
            else bxx = cv.label(add(A, mul(dir, (pr.out ? 8 : rp + 5) + half)), txt, COL.ink, dir);
            if (hp) cv.hlBox(hp, bxx);
          }
          break;
        case 'text':
          A = T(pr.p);
          if (hp && pr.glow) cv.hlLine(hp, [pr.glow.map(T)]);
          if (txt) {
            var dv = nrm(pr.dir), hf = Math.abs(dv[0]) * (tw(txt) + 8) / 2 + Math.abs(dv[1]) * FS * 0.65;
            bxx = cv.label(add(A, mul(dv, (pr.gap || 8) + hf)), txt, pr.color || COL.ink, dv);
            if (hp) cv.hlBox(hp, bxx);
          }
          break;
        case 'arclab':
          /* a length label beside an arc: try spots along the arc, keep clear of circles and other labels */
          var C0 = T(pr.c), R0 = pr.r * s, side = pr.side || 1;
          if (hp) cv.hlLine(hp, [arc(pr.c, pr.r, pr.d0, pr.d1, 128).map(T)]);
          if (!txt) break;
          var bw = tw(txt) + 8, bh = FS * 1.3, fr = pr.at || [0.8, 0.2, 0.68, 0.32, 0.9, 0.1, 0.5], best = null;
          for (var f = 0; f < fr.length; f++) {
            var ang = (pr.d0 + (pr.d1 - pr.d0) * fr[f]) * D2R, rd = [Math.cos(ang), -Math.sin(ang)], dd = mul(rd, side);
            var hh = Math.abs(dd[0]) * bw / 2 + Math.abs(dd[1]) * bh * 0.65;
            var ctr = add(add(C0, mul(rd, R0)), mul(dd, 7 + hh)), bb = [ctr[0] - bw / 2, ctr[1] - bh / 2, bw, bh];
            var clash = (pr.avoid || []).some(function (av) { return boxHitsCircle(bb, T(av[0]), av[1] * s + 3); }) ||
              cv.boxes.some(function (q) { return bb[0] < q[0] + q[2] && q[0] < bb[0] + bb[2] && bb[1] < q[1] + q[3] && q[1] < bb[1] + bb[3]; });
            if (!clash) { best = [ctr, dd]; break; }
            if (!best) best = [ctr, dd];
          }
          bxx = cv.label(best[0], txt, COL.ink, best[1]);
          if (hp) cv.hlBox(hp, bxx);
          break;
        case 'dim':
          A = T(pr.a); B = T(pr.b);
          u = nrm(sub(B, A)); n = [-u[1], u[0]];
          if (pr.side) { n = nrm([pr.side[0], pr.side[1]]); }
          else if (dot(n, sub(lerp(A, B, 0.5), cen)) < 0) n = mul(n, -1);
          var off = 22 + (pr.tier || 0) * 32;
          if (pr.offModel) {
            var ex = 0;
            sp.forEach(function (p) { var e = dot(sub(p, A), n); if (e > ex) ex = e; });
            off += ex;
          }
          drawDim(cv, A, B, gone ? null : txt, n, off, hp);
          break;
      }
    });
    if (H && hlWants(o, 'blank') && isFinite(bx0)) cv.hlLine('blank', [[[bx0, by0], [bx1, by0], [bx1, by1], [bx0, by1]]], true);
    return cv.svg(o);
  }

  /* ---------------- calculation items ---------------- */
  function v(n) { return fmt(n); }
  function item(name, sym, formula, substs, value, u, pow, key) {
    var unit = pow === 0 ? '' : pow === -1 ? '°' : unitStr(u, pow);
    var exact = Math.abs(round2(value) - value) < 1e-9;
    var lines = [sym + ' = ' + formula];
    substs.forEach(function (s) { lines.push(sym + ' = ' + s); });
    lines.push(sym + (exact ? ' = ' : ' ≈ ') + fmt(value) + (pow === -1 ? '°' : unit ? ' ' + unit : ''));
    return { name: name, sym: sym, key: key || sym, value: value, unit: unit, lines: lines };
  }
  /* angle helpers for the triangles */
  function angLab(letter, deg, derived) { return lab(letter, deg, 1, derived, { unit: '°' }); }
  function angAt(V, P1, P2, l) {
    var a0 = Math.atan2(P1[1] - V[1], P1[0] - V[0]), a1 = Math.atan2(P2[1] - V[1], P2[0] - V[0]);
    while (a1 - a0 > PI) a1 -= 2 * PI;
    while (a1 - a0 < -PI) a1 += 2 * PI;
    return { t: 'angle', c: V, a0: a0, a1: a1, rp: 22, lab: l, out: true };
  }
  function angItem(name, sym, formula, substs, value, key) { return item(name, sym, formula, substs, value, '', -1, key); }
  function sumItem(vals) {
    var it = item('Angle sum check (the angles of every triangle add to 180°)', 'Sum', '∠A + ∠B + ∠C', [vals.map(function (x) { return v(x); }).join(' + ')], 180, '', -1, 'angsum');
    var rs = vals.reduce(function (t, x) { return t + round2(x); }, 0);
    if (Math.abs(rs - 180) > 1e-9) it.lines[it.lines.length - 1] = 'Sum ≈ 180°';
    return it;
  }
  function noKeys(it) { it.nokeys = true; return it; }
  function aoOf(o) { o = o || {}; var on = !!o.angles; return { on: on, input: on && o.angleInput === 'angle' ? 'angle' : 'sides', show: on || !!o.allAngles }; }

  /* ---------------- shape registry ---------------- */
  var DEF = {}, ORDER = [];
  function reg(d) { DEF[d.id] = d; ORDER.push(d.id); }
  function P(k, name, letter, def, rnd, extra) {
    var q = { k: k, name: name, letter: letter, def: def, rnd: rnd };
    if (extra) for (var e in extra) q[e] = extra[e];
    return q;
  }

  /* ======== FLAT SHAPES ======== */
  reg({
    id: 'square', name: 'Square', kind: 'flat', params: [P('s', 'Side', 's', 10, [3, 20])],
    rings: function (p) { var s = p.s; return [[[0, 0], [s, 0], [s, -s], [0, -s]]]; },
    draw: function (p) {
      var s = p.s, pts = this.rings(p)[0];
      return [shape(pts), dim([0, 0], [s, 0], lab('s', s)), ra([0, 0], [1, 0], [0, -1])].concat(ticks(pts, 1), [glow('d', [pts[0], pts[2]])]);
    },
    hl: { A: ['fill', 'dim:s'], P: ['outline', 'dim:s'], d: ['dim:d', 'dim:s'] },
    calc: function (p, u) {
      var s = p.s;
      return [item('Area', 'A', 's²', [v(s) + '²'], s * s, u, 2),
        item('Perimeter', 'P', '4 × s', ['4 × ' + v(s)], 4 * s, u, 1),
        item('Diagonal', 'd', '√(s² + s²)', ['√(' + v(s) + '² + ' + v(s) + '²)'], SQ2 * s, u, 1)];
    }
  });
  reg({
    id: 'rectangle', name: 'Rectangle', kind: 'flat', params: [P('l', 'Length', 'l', 12, [4, 24]), P('w', 'Width', 'w', 8, [2, 16])],
    rings: function (p) { return [[[0, 0], [p.l, 0], [p.l, -p.w], [0, -p.w]]]; },
    draw: function (p) {
      return [shape(this.rings(p)[0]), dim([0, 0], [p.l, 0], lab('l', p.l)), dim([p.l, 0], [p.l, -p.w], lab('w', p.w)), ra([0, 0], [1, 0], [0, -1]), glow('d', [[0, 0], [p.l, -p.w]])];
    },
    hl: { A: ['fill', 'dim:l', 'dim:w'], P: ['outline', 'dim:l', 'dim:w'], d: ['dim:d', 'dim:l', 'dim:w'] },
    calc: function (p, u) {
      var l = p.l, w = p.w;
      return [item('Area', 'A', 'l × w', [v(l) + ' × ' + v(w)], l * w, u, 2),
        item('Perimeter', 'P', '2 × (l + w)', ['2 × (' + v(l) + ' + ' + v(w) + ')'], 2 * (l + w), u, 1),
        item('Diagonal', 'd', '√(l² + w²)', ['√(' + v(l) + '² + ' + v(w) + '²)'], Math.hypot(l, w), u, 1)];
    }
  });
  reg({
    id: 'right-triangle', name: 'Right triangle', kind: 'flat', params: [P('b', 'Base', 'b', 8, [3, 20]), P('h', 'Height', 'h', 6, [3, 20])],
    angIn: { params: [P('b', 'Base', 'b', 8, [3, 20]), P('A', 'Angle A', 'A', 35, [20, 70], { deg: true, min: 1, max: 89 })],
      validate: function (p) { return p.A >= 90 ? { k: 'A', msg: 'Angle A must be less than 90°. The 90° corner and angle A must add to less than 180°.' } : null; },
      toSides: function (p) { return { b: p.b, h: p.b * Math.tan(p.A * D2R) }; } },
    rings: function (p, n, ao) { var q = aoOf(ao).input === 'angle' ? this.angIn.toSides(p) : p; return [[[0, 0], [q.b, 0], [0, -q.h]]]; },
    draw: function (p, n, ao) {
      var A0 = aoOf(ao), byAng = A0.input === 'angle', q = byAng ? this.angIn.toSides(p) : p, b = q.b, h = q.h;
      var Cv = [0, 0], Av = [b, 0], Bv = [0, -h], out = [shape([Cv, Av, Bv]), dim(Cv, Av, lab('b', b)), dim(Cv, Bv, lab('h', h, 1, byAng)),
        dim(Av, Bv, lab('c', Math.hypot(b, h), 1, true)), ra(Cv, [1, 0], [0, -1], A0.show ? { lab: angLab('C', 90, false) } : null)];
      if (A0.show) {
        var A = byAng ? p.A : Math.atan2(h, b) / D2R;
        out.push(angAt(Av, Cv, Bv, angLab('A', A, !byAng)), angAt(Bv, Av, Cv, angLab('B', 90 - A, true)));
      }
      return out;
    },
    hl: { c: ['dim:c', 'dim:b', 'dim:h'], A: ['fill', 'dim:b', 'dim:h'], P: ['outline'], h: ['dim:h', 'ang:A', 'dim:b'],
      angA: ['ang:A', 'dim:h', 'dim:b'], angB: ['ang:B', 'ang:A'], angsum: ['ang:A', 'ang:B', 'ang:C'] },
    hlByAng: { c: ['dim:c', 'ang:A', 'dim:b'] },
    calc: function (p, u, ao) {
      var A0 = aoOf(ao);
      if (A0.input === 'angle') {
        var b0 = p.b, A1 = p.A, h0 = b0 * Math.tan(A1 * D2R), c0 = b0 / Math.cos(A1 * D2R);
        return [item('Height (TOA: tan A = opposite ÷ adjacent)', 'h', 'b × tan A', [v(b0) + ' × tan ' + v(A1) + '°'], h0, u, 1),
          item('Hypotenuse (CAH: cos A = adjacent ÷ hypotenuse)', 'c', 'b ÷ cos A', [v(b0) + ' ÷ cos ' + v(A1) + '°'], c0, u, 1),
          angItem('Angle B (the two sharp angles add to 90°)', '∠B', '90 − ∠A', ['90 − ' + v(A1)], 90 - A1, 'angB'),
          sumItem([A1, 90 - A1, 90]),
          item('Area', 'A', '½ × b × h', ['½ × ' + v(b0) + ' × ' + v(h0)], b0 * h0 / 2, u, 2),
          item('Perimeter', 'P', 'b + h + c', [v(b0) + ' + ' + v(h0) + ' + ' + v(c0)], b0 + h0 + c0, u, 1)];
      }
      var b = p.b, h = p.h, c = Math.hypot(b, h);
      var out = [item('Hypotenuse', 'c', '√(b² + h²)', ['√(' + v(b) + '² + ' + v(h) + '²)'], c, u, 1),
        item('Area', 'A', '½ × b × h', ['½ × ' + v(b) + ' × ' + v(h)], b * h / 2, u, 2),
        item('Perimeter', 'P', 'b + h + c', [v(b) + ' + ' + v(h) + ' + ' + v(c)], b + h + c, u, 1)];
      if (A0.on) {
        var A = Math.atan2(h, b) / D2R;
        out.push(angItem('Angle A (TOA: tan A = opposite ÷ adjacent)', '∠A', 'tan⁻¹(h ÷ b)', ['tan⁻¹(' + v(h) + ' ÷ ' + v(b) + ')'], A, 'angA'),
          angItem('Angle B (the two sharp angles add to 90°)', '∠B', '90 − ∠A', ['90 − ' + v(A)], 90 - A, 'angB'),
          sumItem([A, 90 - A, 90]));
      }
      return out;
    }
  });
  reg({
    id: 'equilateral-triangle', name: 'Equilateral triangle', kind: 'flat', params: [P('s', 'Side', 's', 10, [4, 20])],
    rings: function (p) { var s = p.s; return [[[0, 0], [s, 0], [s / 2, -s * SQ3 / 2]]]; },
    draw: function (p, n, ao) {
      var s = p.s, H = s * SQ3 / 2, pts = this.rings(p)[0];
      var out = [shape(pts), dim([0, 0], [s, 0], lab('s', s)), ann([s / 2, -H], [s / 2, 0], lab('h', H, 1, true), { dash: true }),
        ra([s / 2, 0], [1, 0], [0, -1], { derived: true })].concat(ticks(pts, 1));
      if (aoOf(ao).show) out.push(angAt(pts[0], pts[1], pts[2], angLab('A', 60, false)), angAt(pts[1], pts[2], pts[0], angLab('B', 60, false)), angAt(pts[2], pts[0], pts[1], angLab('C', 60, false)));
      return out;
    },
    hl: { h: ['dim:h', 'dim:s'], A: ['fill', 'dim:s', 'dim:h'], P: ['outline', 'dim:s'], angA: ['ang:A', 'ang:B', 'ang:C'], angsum: ['ang:A', 'ang:B', 'ang:C'] },
    calc: function (p, u, ao) {
      var s = p.s, h = s * SQ3 / 2;
      var out = [item('Height', 'h', '√(s² − (s ÷ 2)²)', ['√(' + v(s) + '² − (' + v(s) + ' ÷ 2)²)', '√(' + v(s) + '² − ' + v(s / 2) + '²)'], h, u, 1),
        item('Area', 'A', '½ × s × h', ['½ × ' + v(s) + ' × ' + v(h)], s * h / 2, u, 2),
        item('Perimeter', 'P', '3 × s', ['3 × ' + v(s)], 3 * s, u, 1)];
      if (aoOf(ao).on) out.push(angItem('Each angle (all three angles are equal)', '∠A', '180° ÷ 3', ['180 ÷ 3'], 60, 'angA'), sumItem([60, 60, 60]));
      return out;
    }
  });
  reg({
    id: 'isosceles-triangle', name: 'Isosceles triangle', kind: 'flat', params: [P('b', 'Base', 'b', 10, [4, 20]), P('h', 'Height', 'h', 12, [3, 20])],
    angIn: { params: [P('b', 'Base', 'b', 10, [4, 20]), P('A', 'Base angle A', 'A', 65, [30, 75], { deg: true, min: 1, max: 89 })],
      validate: function (p) { return p.A >= 90 ? { k: 'A', msg: 'Base angle A must be less than 90°. The two base angles must add to less than 180°.' } : null; },
      toSides: function (p) { return { b: p.b, h: p.b / 2 * Math.tan(p.A * D2R) }; } },
    rings: function (p, n, ao) { var q = aoOf(ao).input === 'angle' ? this.angIn.toSides(p) : p; return [[[0, 0], [q.b, 0], [q.b / 2, -q.h]]]; },
    draw: function (p, n, ao) {
      var A0 = aoOf(ao), byAng = A0.input === 'angle', q = byAng ? this.angIn.toSides(p) : p, b = q.b, h = q.h, a = Math.hypot(b / 2, h);
      var Av = [0, 0], Bv = [b, 0], Cv = [b / 2, -h];
      var out = [shape([Av, Bv, Cv]), dim(Av, Bv, lab('b', b)), ann(Cv, [b / 2, 0], lab('h', h, 1, byAng), { dash: true }),
        ra([b / 2, 0], [1, 0], [0, -1]), dim(Bv, Cv, lab('a', a, 1, true)), tick(Av, Cv), tick(Bv, Cv)];
      if (A0.show) {
        var A = byAng ? p.A : Math.atan2(h, b / 2) / D2R;
        out.push(angAt(Av, Bv, Cv, angLab('A', A, !byAng)), angAt(Bv, Cv, Av, angLab('B', A, true)), angAt(Cv, Av, Bv, angLab('C', 180 - 2 * A, true)));
      }
      return out;
    },
    hl: { a: ['dim:a', 'dim:b', 'dim:h'], A: ['fill', 'dim:b', 'dim:h'], P: ['outline', 'dim:b', 'dim:a'], h: ['dim:h', 'ang:A', 'dim:b'],
      angA: ['ang:A', 'dim:h', 'dim:b'], angB: ['ang:B', 'ang:A'], angC: ['ang:C', 'ang:A', 'ang:B'], angsum: ['ang:A', 'ang:B', 'ang:C'] },
    hlByAng: { a: ['dim:a', 'ang:A', 'dim:b'] },
    calc: function (p, u, ao) {
      var A0 = aoOf(ao);
      if (A0.input === 'angle') {
        var b0 = p.b, A1 = p.A, h0 = b0 / 2 * Math.tan(A1 * D2R), a0 = b0 / 2 / Math.cos(A1 * D2R);
        return [item('Height (TOA: tan A = opposite ÷ adjacent)', 'h', '(b ÷ 2) × tan A', ['(' + v(b0) + ' ÷ 2) × tan ' + v(A1) + '°'], h0, u, 1),
          item('Equal side (CAH: cos A = adjacent ÷ hypotenuse)', 'a', '(b ÷ 2) ÷ cos A', ['(' + v(b0) + ' ÷ 2) ÷ cos ' + v(A1) + '°'], a0, u, 1),
          noKeys(angItem('Angle B (the two base angles are equal)', '∠B', '∠A', [v(A1)], A1, 'angB')),
          angItem('Top angle C (the angles add to 180°)', '∠C', '180 − 2 × ∠A', ['180 − 2 × ' + v(A1)], 180 - 2 * A1, 'angC'),
          sumItem([A1, A1, 180 - 2 * A1]),
          item('Area', 'A', '½ × b × h', ['½ × ' + v(b0) + ' × ' + v(h0)], b0 * h0 / 2, u, 2),
          item('Perimeter', 'P', 'b + 2 × a', [v(b0) + ' + 2 × ' + v(a0)], b0 + 2 * a0, u, 1)];
      }
      var b = p.b, h = p.h, a = Math.hypot(b / 2, h);
      var out = [item('Equal side', 'a', '√((b ÷ 2)² + h²)', ['√((' + v(b) + ' ÷ 2)² + ' + v(h) + '²)', '√(' + v(b / 2) + '² + ' + v(h) + '²)'], a, u, 1),
        item('Area', 'A', '½ × b × h', ['½ × ' + v(b) + ' × ' + v(h)], b * h / 2, u, 2),
        item('Perimeter', 'P', 'b + 2 × a', [v(b) + ' + 2 × ' + v(a)], b + 2 * a, u, 1)];
      if (A0.on) {
        var A = Math.atan2(h, b / 2) / D2R;
        out.push(angItem('Base angle A (TOA: tan A = opposite ÷ adjacent)', '∠A', 'tan⁻¹(h ÷ (b ÷ 2))', ['tan⁻¹(' + v(h) + ' ÷ (' + v(b) + ' ÷ 2))', 'tan⁻¹(' + v(h) + ' ÷ ' + v(b / 2) + ')'], A, 'angA'),
          noKeys(angItem('Angle B (the two base angles are equal)', '∠B', '∠A', [v(A)], A, 'angB')),
          angItem('Top angle C (the angles add to 180°)', '∠C', '180 − 2 × ∠A', ['180 − 2 × ' + v(A)], 180 - 2 * A, 'angC'),
          sumItem([A, A, 180 - 2 * A]));
      }
      return out;
    }
  });
  function scaleneApex(p) { var a = p.a, b = p.b, c = p.c, x = (a * a + c * c - b * b) / (2 * a); return [x, -Math.sqrt(Math.max(0, c * c - x * x))]; }
  function sasSide(p) { return Math.sqrt(Math.max(0, p.b * p.b + p.c * p.c - 2 * p.b * p.c * Math.cos(p.A * D2R))); }
  function cosRule(a, b, c) { return Math.acos(Math.max(-1, Math.min(1, (b * b + c * c - a * a) / (2 * b * c)))) / D2R; }
  reg({
    id: 'scalene-triangle', name: 'Scalene triangle', kind: 'flat',
    params: [P('a', 'Side a (base)', 'a', 14, [5, 20]), P('b', 'Side b', 'b', 13, [5, 20]), P('c', 'Side c', 'c', 15, [5, 20])],
    angIn: { params: [P('b', 'Side b', 'b', 13, [5, 20]), P('c', 'Side c', 'c', 15, [5, 20]), P('A', 'Angle A (between b and c)', 'A', 60, [25, 140], { deg: true, min: 1, max: 179 })],
      validate: function (p) { return p.A >= 180 ? { k: 'A', msg: 'Angle A must be less than 180°. The three angles of a triangle add to 180°.' } : null; },
      toSides: function (p) { return { a: sasSide(p), b: p.b, c: p.c }; } },
    validate: function (p) {
      if (p.a >= p.b + p.c || p.b >= p.a + p.c || p.c >= p.a + p.b) return { k: 'a', msg: 'These three sides cannot make a triangle. Each side must be shorter than the other two added together.' };
      return null;
    },
    rings: function (p, n, ao) { var q = aoOf(ao).input === 'angle' ? this.angIn.toSides(p) : p; return [[[0, 0], [q.a, 0], scaleneApex(q)]]; },
    draw: function (p, n, ao) {
      var A0 = aoOf(ao), byAng = A0.input === 'angle', q = byAng ? this.angIn.toSides(p) : p;
      var Q = scaleneApex(q), a = q.a, F = [Q[0], 0], out = [], Bv = [0, 0], Cv = [a, 0];
      out.push(shape([Bv, Cv, Q]), dim(Bv, Cv, lab('a', a, 1, byAng)), dim(Cv, Q, lab('b', q.b)), dim(Bv, Q, lab('c', q.c)));
      out.push(ann(Q, F, lab('h', -Q[1], 1, true), { dash: true }));
      if (F[0] < 0) { out.push(aux([0, 0], F, { derived: true }), ra(F, [1, 0], [0, -1], { derived: true })); }
      else if (F[0] > a) { out.push(aux([a, 0], F, { derived: true }), ra(F, [-1, 0], [0, -1], { derived: true })); }
      else out.push(ra(F, F[0] < a / 2 ? [1, 0] : [-1, 0], [0, -1], { derived: true }));
      if (A0.show) {
        var A = byAng ? p.A : cosRule(a, q.b, q.c), B = cosRule(q.b, a, q.c);
        out.push(angAt(Q, Bv, Cv, angLab('A', A, !byAng)), angAt(Bv, Cv, Q, angLab('B', B, true)), angAt(Cv, Q, Bv, angLab('C', 180 - A - B, true)));
      }
      return out;
    },
    hl: { s: ['outline'], A: ['fill', 'dim:a', 'dim:b', 'dim:c'], P: ['outline', 'dim:a', 'dim:b', 'dim:c'], h: ['dim:h', 'dim:a'], a: ['dim:a', 'dim:b', 'dim:c', 'ang:A'],
      angA: ['ang:A', 'dim:a', 'dim:b', 'dim:c'], angB: ['ang:B', 'dim:a', 'dim:b', 'dim:c'], angC: ['ang:C', 'ang:A', 'ang:B'], angsum: ['ang:A', 'ang:B', 'ang:C'] },
    hlByAng: { A: ['fill', 'dim:b', 'dim:c', 'ang:A'] },
    calc: function (p, u, ao) {
      var A0 = aoOf(ao), byAng = A0.input === 'angle', q = byAng ? this.angIn.toSides(p) : p, out = [];
      var a = q.a, b = q.b, c = q.c, s = (a + b + c) / 2, A = byAng ? b * c * Math.sin(p.A * D2R) / 2 : Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
      var angA = byAng ? p.A : cosRule(a, b, c), angB = cosRule(b, a, c);
      if (byAng) {
        out.push(item('Side a (law of cosines)', 'a', '√(b² + c² − 2 × b × c × cos A)', ['√(' + v(b) + '² + ' + v(c) + '² − 2 × ' + v(b) + ' × ' + v(c) + ' × cos ' + v(angA) + '°)'], a, u, 1));
        out.push(angItem('Angle B (law of cosines)', '∠B', 'cos⁻¹((a² + c² − b²) ÷ (2 × a × c))', ['cos⁻¹((' + v(a) + '² + ' + v(c) + '² − ' + v(b) + '²) ÷ (2 × ' + v(a) + ' × ' + v(c) + '))'], angB, 'angB'),
          angItem('Angle C (the angles add to 180°)', '∠C', '180 − ∠A − ∠B', ['180 − ' + v(angA) + ' − ' + v(angB)], 180 - angA - angB, 'angC'),
          sumItem([angA, angB, 180 - angA - angB]));
      }
      if (byAng) out.push(item('Area (two sides and the angle between them)', 'A', '½ × b × c × sin A', ['½ × ' + v(b) + ' × ' + v(c) + ' × sin ' + v(angA) + '°'], A, u, 2));
      else out.push(item('Half the perimeter', 's', '(a + b + c) ÷ 2', ['(' + v(a) + ' + ' + v(b) + ' + ' + v(c) + ') ÷ 2'], s, u, 1),
        item('Area (Heron’s formula)', 'A', '√(s × (s − a) × (s − b) × (s − c))',
          ['√(' + v(s) + ' × (' + v(s) + ' − ' + v(a) + ') × (' + v(s) + ' − ' + v(b) + ') × (' + v(s) + ' − ' + v(c) + '))',
            '√(' + v(s) + ' × ' + v(s - a) + ' × ' + v(s - b) + ' × ' + v(s - c) + ')'], A, u, 2));
      out.push(item('Perimeter', 'P', 'a + b + c', [v(a) + ' + ' + v(b) + ' + ' + v(c)], a + b + c, u, 1),
        item('Height to base a', 'h', '2 × A ÷ a', ['2 × ' + v(A) + ' ÷ ' + v(a)], 2 * A / a, u, 1));
      if (A0.on && !byAng) {
        out.push(angItem('Angle A (law of cosines)', '∠A', 'cos⁻¹((b² + c² − a²) ÷ (2 × b × c))', ['cos⁻¹((' + v(b) + '² + ' + v(c) + '² − ' + v(a) + '²) ÷ (2 × ' + v(b) + ' × ' + v(c) + '))'], angA, 'angA'),
          angItem('Angle B (law of cosines)', '∠B', 'cos⁻¹((a² + c² − b²) ÷ (2 × a × c))', ['cos⁻¹((' + v(a) + '² + ' + v(c) + '² − ' + v(b) + '²) ÷ (2 × ' + v(a) + ' × ' + v(c) + '))'], angB, 'angB'),
          angItem('Angle C (the angles add to 180°)', '∠C', '180 − ∠A − ∠B', ['180 − ' + v(angA) + ' − ' + v(angB)], 180 - angA - angB, 'angC'),
          sumItem([angA, angB, 180 - angA - angB]));
      }
      return out;
    }
  });
  reg({
    id: 'parallelogram', name: 'Parallelogram', kind: 'flat',
    params: [P('b', 'Base', 'b', 14, [6, 20]), P('h', 'Height', 'h', 8, [3, 12]), P('s', 'Slanted side', 's', 10, function (p) { return [Math.ceil(p.h), Math.ceil(p.h) + 8]; })],
    validate: function (p) { return p.s < p.h ? { k: 's', msg: 'Slanted side s must be at least as long as the height h.' } : null; },
    rings: function (p) { var dx = Math.sqrt(Math.max(0, p.s * p.s - p.h * p.h)); return [[[0, 0], [p.b, 0], [p.b + dx, -p.h], [dx, -p.h]]]; },
    draw: function (p) {
      var b = p.b, h = p.h, pts = this.rings(p)[0], dx = pts[3][0], out = [];
      out.push(shape(pts), dim([0, 0], [b, 0], lab('b', b)), dim([0, 0], [dx, -h], lab('s', p.s)), ann([dx, -h], [dx, 0], lab('h', h), { dash: true }));
      if (dx > b) out.push(aux([b, 0], [dx, 0]), ra([dx, 0], [-1, 0], [0, -1])); else out.push(ra([dx, 0], [1, 0], [0, -1]));
      out.push(tick(pts[0], pts[1], 1), tick(pts[2], pts[3], 1), tick(pts[1], pts[2], 2), tick(pts[3], pts[0], 2));
      return out;
    },
    hl: { A: ['fill', 'dim:b', 'dim:h'], P: ['outline', 'dim:b', 'dim:s'] },
    calc: function (p, u) {
      return [item('Area', 'A', 'b × h', [v(p.b) + ' × ' + v(p.h)], p.b * p.h, u, 2),
        item('Perimeter', 'P', '2 × (b + s)', ['2 × (' + v(p.b) + ' + ' + v(p.s) + ')'], 2 * (p.b + p.s), u, 1)];
    }
  });
  reg({
    id: 'rhombus', name: 'Rhombus', kind: 'flat', params: [P('d1', 'Diagonal 1', 'd₁', 16, [6, 24]), P('d2', 'Diagonal 2', 'd₂', 12, [4, 20])],
    rings: function (p) { return [[[-p.d1 / 2, 0], [0, p.d2 / 2], [p.d1 / 2, 0], [0, -p.d2 / 2]]]; },
    draw: function (p) {
      var d1 = p.d1, d2 = p.d2, pts = this.rings(p)[0], s = Math.hypot(d1 / 2, d2 / 2);
      return [shape(pts), ann([-d1 / 2, 0], [d1 / 2, 0], lab('d₁', d1), { dash: true, at: 0.25 }), ann([0, -d2 / 2], [0, d2 / 2], lab('d₂', d2), { dash: true, at: 0.25 }),
        ra([0, 0], [1, 0], [0, -1]), dim([0, -d2 / 2], [d1 / 2, 0], lab('s', s, 1, true))].concat(ticks(pts, 1));
    },
    hl: { s: ['dim:s', 'dim:d₁', 'dim:d₂'], A: ['fill', 'dim:d₁', 'dim:d₂'], P: ['outline', 'dim:s'] },
    calc: function (p, u) {
      var d1 = p.d1, d2 = p.d2, s = Math.hypot(d1 / 2, d2 / 2);
      return [item('Side', 's', '√((d₁ ÷ 2)² + (d₂ ÷ 2)²)', ['√(' + v(d1 / 2) + '² + ' + v(d2 / 2) + '²)'], s, u, 1),
        item('Area', 'A', '(d₁ × d₂) ÷ 2', ['(' + v(d1) + ' × ' + v(d2) + ') ÷ 2'], d1 * d2 / 2, u, 2),
        item('Perimeter', 'P', '4 × s', ['4 × ' + v(s)], 4 * s, u, 1)];
    }
  });
  reg({
    id: 'trapezoid', name: 'Trapezoid', kind: 'flat',
    params: [P('a', 'Top side', 'a', 8, function (p) { return [3, Math.max(3, p.b - 3)]; }), P('b', 'Bottom side', 'b', 20, [8, 24]), P('h', 'Height', 'h', 8, [3, 14])],
    rndOrder: ['b', 'a', 'h'],
    validate: function (p) { return p.a >= p.b ? { k: 'a', msg: 'Top a must be shorter than bottom b.' } : null; },
    rings: function (p) { var o = (p.b - p.a) / 2; return [[[0, 0], [p.b, 0], [o + p.a, -p.h], [o, -p.h]]]; },
    draw: function (p) {
      var a = p.a, b = p.b, h = p.h, o = (b - a) / 2, c = Math.hypot(o, h), pts = this.rings(p)[0];
      return [shape(pts), dim([0, 0], [b, 0], lab('b', b)), dim([o, -h], [o + a, -h], lab('a', a)), ann([o, -h], [o, 0], lab('h', h), { dash: true }),
        ra([o, 0], [1, 0], [0, -1]), dim([b, 0], [o + a, -h], lab('c', c, 1, true)), tick(pts[3], pts[0], 1), tick(pts[1], pts[2], 1)];
    },
    hl: { c: ['dim:c', 'dim:h', 'dim:a', 'dim:b'], A: ['fill', 'dim:a', 'dim:b', 'dim:h'], P: ['outline'] },
    calc: function (p, u) {
      var a = p.a, b = p.b, h = p.h, o = (b - a) / 2, c = Math.hypot(o, h);
      return [item('Slanted side', 'c', '√(((b − a) ÷ 2)² + h²)', ['√(((' + v(b) + ' − ' + v(a) + ') ÷ 2)² + ' + v(h) + '²)', '√(' + v(o) + '² + ' + v(h) + '²)'], c, u, 1),
        item('Area', 'A', '½ × (a + b) × h', ['½ × (' + v(a) + ' + ' + v(b) + ') × ' + v(h)], (a + b) * h / 2, u, 2),
        item('Perimeter', 'P', 'a + b + 2 × c', [v(a) + ' + ' + v(b) + ' + 2 × ' + v(c)], a + b + 2 * c, u, 1)];
    }
  });
  reg({
    id: 'kite', name: 'Kite', kind: 'flat',
    params: [P('d1', 'Long diagonal', 'd₁', 21, [8, 24]), P('d2', 'Cross diagonal', 'd₂', 24, [6, 24]), P('p', 'Top part of d₁', 'p', 5, function (q) { return [2, Math.max(2, Math.floor(q.d1 / 2) - 1)]; })],
    validate: function (p) { return p.p >= p.d1 ? { k: 'p', msg: 'Top part p must be shorter than diagonal d₁.' } : null; },
    rings: function (p) { return [[[0, 0], [p.d2 / 2, p.p], [0, p.d1], [-p.d2 / 2, p.p]]]; },
    draw: function (p) {
      var d1 = p.d1, d2 = p.d2, q = p.p, pts = this.rings(p)[0], X = [0, q];
      var x = Math.hypot(d2 / 2, q), y = Math.hypot(d2 / 2, d1 - q);
      return [shape(pts), ann([0, 0], X, lab('p', q), { dash: true }), ann(X, [0, d1], null, { dash: true }),
        ann([-d2 / 2, q], [d2 / 2, q], lab('d₂', d2), { dash: true, at: 0.25 }), ra(X, [1, 0], [0, 1]),
        dim([0, 0], [0, d1], lab('d₁', d1), { side: [1, 0], offModel: true }),
        dim(pts[3], pts[0], lab('x', x, 1, true)), dim(pts[3], pts[2], lab('y', y, 1, true)),
        tick(pts[0], pts[1], 1), tick(pts[3], pts[0], 1), tick(pts[1], pts[2], 2), tick(pts[2], pts[3], 2)];
    },
    hl: { x: ['dim:x', 'dim:d₂', 'dim:p'], y: ['dim:y', 'dim:d₂', 'dim:d₁', 'dim:p'], A: ['fill', 'dim:d₁', 'dim:d₂'], P: ['outline', 'dim:x', 'dim:y'] },
    calc: function (p, u) {
      var d1 = p.d1, d2 = p.d2, q = p.p, x = Math.hypot(d2 / 2, q), y = Math.hypot(d2 / 2, d1 - q);
      return [item('Short side', 'x', '√((d₂ ÷ 2)² + p²)', ['√(' + v(d2 / 2) + '² + ' + v(q) + '²)'], x, u, 1),
        item('Long side', 'y', '√((d₂ ÷ 2)² + (d₁ − p)²)', ['√(' + v(d2 / 2) + '² + (' + v(d1) + ' − ' + v(q) + ')²)', '√(' + v(d2 / 2) + '² + ' + v(d1 - q) + '²)'], y, u, 1),
        item('Area', 'A', '(d₁ × d₂) ÷ 2', ['(' + v(d1) + ' × ' + v(d2) + ') ÷ 2'], d1 * d2 / 2, u, 2),
        item('Perimeter', 'P', '2 × (x + y)', ['2 × (' + v(x) + ' + ' + v(y) + ')'], 2 * (x + y), u, 1)];
    }
  });
  reg({
    id: 'circle', name: 'Circle', kind: 'flat', params: [P('r', 'Radius', 'r', 6, [2, 15])],
    rings: function (p, n) { return [circ([0, 0], p.r, n || 128)]; },
    draw: function (p, n) {
      var r = p.r;
      return [shape(this.rings(p, n)[0]), dotP([0, 0]), ann([0, 0], pol([0, 0], r, 30), lab('r', r), { at: 0.55 }),
        dim([-r, 0], [r, 0], lab('D', 2 * r, 1, true), { side: [0, 1], offModel: true })];
    },
    hl: { D: ['dim:D', 'dim:r'], C: ['outline', 'dim:D'], A: ['fill', 'dim:r'] },
    calc: function (p, u) {
      var r = p.r, D = 2 * r;
      return [item('Diameter', 'D', '2 × r', ['2 × ' + v(r)], D, u, 1),
        item('Circumference', 'C', 'π × D', ['π × ' + v(D)], PI * D, u, 1),
        item('Area', 'A', 'π × r²', ['π × ' + v(r) + '²'], PI * r * r, u, 2)];
    }
  });
  reg({
    id: 'semicircle', name: 'Semicircle', kind: 'flat', params: [P('r', 'Radius', 'r', 8, [2, 15])],
    rings: function (p, n) { return [arc([0, 0], p.r, 0, 180, n || 128)]; },
    draw: function (p, n) {
      var r = p.r;
      return [shape(this.rings(p, n)[0]), dotP([0, 0]), ann([0, 0], pol([0, 0], r, 60), lab('r', r), { at: 0.55 }),
        dim([-r, 0], [r, 0], lab('D', 2 * r, 1, true), { side: [0, 1] })];
    },
    hl: { D: ['dim:D', 'dim:r'], A: ['fill', 'dim:r'], P: ['outline', 'dim:D'] },
    calc: function (p, u) {
      var r = p.r, D = 2 * r;
      return [item('Diameter', 'D', '2 × r', ['2 × ' + v(r)], D, u, 1),
        item('Area', 'A', '½ × π × r²', ['½ × π × ' + v(r) + '²'], PI * r * r / 2, u, 2),
        item('Perimeter (curve + diameter)', 'P', '(π × D) ÷ 2 + D', ['(π × ' + v(D) + ') ÷ 2 + ' + v(D)], PI * D / 2 + D, u, 1)];
    }
  });
  reg({
    id: 'quarter-circle', name: 'Quarter circle', kind: 'flat', params: [P('r', 'Radius', 'r', 10, [2, 15])],
    rings: function (p, n) { return [[[0, 0]].concat(arc([0, 0], p.r, 0, 90, n || 128))]; },
    draw: function (p, n) {
      var r = p.r;
      return [shape(this.rings(p, n)[0]), dim([0, 0], [r, 0], lab('r', r), { side: [0, 1] }), dim([0, 0], [0, -r], lab('r', r), { side: [-1, 0] }), ra([0, 0], [1, 0], [0, -1])];
    },
    hl: { D: ['dim:r'], A: ['fill', 'dim:r'], P: ['outline', 'dim:r'] },
    calc: function (p, u) {
      var r = p.r, D = 2 * r;
      return [item('Diameter of the full circle', 'D', '2 × r', ['2 × ' + v(r)], D, u, 1),
        item('Area', 'A', '¼ × π × r²', ['¼ × π × ' + v(r) + '²'], PI * r * r / 4, u, 2),
        item('Perimeter (curve + 2 radii)', 'P', '(π × D) ÷ 4 + 2 × r', ['(π × ' + v(D) + ') ÷ 4 + 2 × ' + v(r)], PI * D / 4 + 2 * r, u, 1)];
    }
  });
  reg({
    id: 'sector', name: 'Sector', kind: 'flat', params: [P('r', 'Radius', 'r', 10, [3, 15]), P('t', 'Angle', 'θ', 120, [2, 22])],
    angleParam: 't',
    validate: function (p) { return p.t >= 360 ? { k: 't', msg: 'Angle θ must be less than 360°.' } : null; },
    rings: function (p, n) { return [[[0, 0]].concat(arc([0, 0], p.r, 0, p.t, n || 128))]; },
    draw: function (p, n) {
      var r = p.r, t = p.t, L = t / 360 * 2 * PI * r;
      return [shape(this.rings(p, n)[0]), dotP([0, 0]), dim([0, 0], [r, 0], lab('r', r), { side: [0, 1], offModel: true }),
        { t: 'angle', c: [0, 0], a0: -t * D2R, a1: 0, rp: 24, lab: lab('θ', t, 1, false, { unit: '°' }) },
        { t: 'text', p: pol([0, 0], r, t / 2), dir: [Math.cos(t / 2 * D2R), -Math.sin(t / 2 * D2R)], lab: lab('L', L, 1, true), color: COL.ink, glow: arc([0, 0], r, 0, t, 128) }];
    },
    hl: { D: ['dim:r'], L: ['dim:L', 'ang:θ', 'dim:r'], A: ['fill', 'ang:θ', 'dim:r'], P: ['outline'] },
    calc: function (p, u) {
      var r = p.r, t = p.t, D = 2 * r, L = t / 360 * PI * D;
      return [item('Diameter of the full circle', 'D', '2 × r', ['2 × ' + v(r)], D, u, 1),
        item('Arc length', 'L', '(θ ÷ 360) × π × D', ['(' + v(t) + ' ÷ 360) × π × ' + v(D)], L, u, 1),
        item('Area', 'A', '(θ ÷ 360) × π × r²', ['(' + v(t) + ' ÷ 360) × π × ' + v(r) + '²'], t / 360 * PI * r * r, u, 2),
        item('Perimeter', 'P', 'L + 2 × r', [v(L) + ' + 2 × ' + v(r)], L + 2 * r, u, 1)];
    }
  });
  reg({
    id: 'annulus', name: 'Ring (washer)', kind: 'flat', params: [P('R', 'Outer radius', 'R', 10, [4, 20]), P('r', 'Inner radius', 'r', 6, function (p) { return [1, Math.max(1, p.R - 1)]; })],
    validate: function (p) { return p.r >= p.R ? { k: 'r', msg: 'Inner radius must be smaller than outer radius.' } : null; },
    rings: function (p, n) { return [circ([0, 0], p.R, n || 128), circ([0, 0], p.r, n || 128)]; },
    draw: function (p, n) {
      var R = p.R, r = p.r, rg = this.rings(p, n);
      return [shape(rg[0], rg[1]), dotP([0, 0]), ann([0, 0], pol([0, 0], R, 35), lab('R', R), { at: (R + r) / (2 * R) }),
        ann([0, 0], pol([0, 0], r, 205), lab('r', r), { at: 0.55 }), glow('C', rg[0], true), glow('c', rg[1], true)];
    },
    hl: { OD: ['dim:C', 'dim:R'], ID: ['dim:c', 'dim:r'], t: ['dim:R', 'dim:r'], A: ['fill', 'dim:R', 'dim:r'], Co: ['dim:C', 'dim:R'], Ci: ['dim:c', 'dim:r'] },
    calc: function (p, u) {
      var R = p.R, r = p.r;
      return [item('Outside diameter', 'OD', '2 × R', ['2 × ' + v(R)], 2 * R, u, 1),
        item('Inside diameter', 'ID', '2 × r', ['2 × ' + v(r)], 2 * r, u, 1),
        item('Ring width', 't', 'R − r', [v(R) + ' − ' + v(r)], R - r, u, 1),
        item('Area', 'A', 'π × (R² − r²)', ['π × (' + v(R) + '² − ' + v(r) + '²)'], PI * (R * R - r * r), u, 2),
        item('Outer circumference', 'C', 'π × OD', ['π × ' + v(2 * R)], PI * 2 * R, u, 1, 'Co'),
        item('Inner circumference', 'c', 'π × ID', ['π × ' + v(2 * r)], PI * 2 * r, u, 1, 'Ci')];
    }
  });
  function ramanujan(a, b) { return PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b))); }
  reg({
    id: 'ellipse', name: 'Ellipse (oval)', kind: 'flat', params: [P('a', 'Half width', 'a', 10, [4, 20]), P('b', 'Half height', 'b', 6, function (p) { return [2, Math.max(2, p.a - 1)]; })],
    rings: function (p, n) { var pts = [], k = n || 128; for (var i = 0; i < k; i++) { var t = 2 * PI * i / k; pts.push([p.a * Math.cos(t), -p.b * Math.sin(t)]); } return [pts]; },
    draw: function (p, n) {
      return [shape(this.rings(p, n)[0]), dotP([0, 0]), ann([0, 0], [p.a, 0], lab('a', p.a)), ann([0, 0], [0, -p.b], lab('b', p.b)), ra([0, 0], [1, 0], [0, -1])];
    },
    hl: { A: ['fill', 'dim:a', 'dim:b'], P: ['outline', 'dim:a', 'dim:b'] },
    calc: function (p, u) {
      var a = p.a, b = p.b;
      return [item('Area', 'A', 'π × a × b', ['π × ' + v(a) + ' × ' + v(b)], PI * a * b, u, 2),
        item('Perimeter (approximate)', 'P', 'π × (3 × (a + b) − √((3 × a + b) × (a + 3 × b)))',
          ['π × (3 × (' + v(a) + ' + ' + v(b) + ') − √((3 × ' + v(a) + ' + ' + v(b) + ') × (' + v(a) + ' + 3 × ' + v(b) + ')))'], ramanujan(a, b), u, 1)];
    },
    notes: ['The perimeter of an ellipse has no exact simple formula. This uses Ramanujan’s approximation, which is accurate to well under 0.1% for everyday shapes.']
  });
  function regPoly(n, s, a0) { var R = s / (2 * Math.sin(PI / n)), pts = []; for (var i = 0; i < n; i++) pts.push(pol([0, 0], R, a0 + 360 * i / n)); return pts; }
  reg({
    id: 'pentagon', name: 'Regular pentagon', kind: 'flat', params: [P('s', 'Side', 's', 10, [3, 20])],
    rings: function (p) { return [regPoly(5, p.s, -126)]; },
    draw: function (p) {
      var s = p.s, pts = this.rings(p)[0], ap = s / (2 * Math.tan(36 * D2R));
      return [shape(pts), dotP([0, 0]), dim(pts[0], pts[1], lab('s', s), { side: [0, 1] }), ann([0, 0], [0, ap], lab('a', ap, 1, true), { dash: true }),
        ra([0, ap], [1, 0], [0, -1], { derived: true })].concat(ticks(pts, 1));
    },
    hl: { P: ['outline', 'dim:s'], a: ['dim:a', 'dim:s'], A: ['fill', 'dim:a'] },
    calc: function (p, u) {
      var s = p.s, ap = s / (2 * Math.tan(36 * D2R)), P5 = 5 * s;
      return [item('Perimeter', 'P', '5 × s', ['5 × ' + v(s)], P5, u, 1),
        item('Apothem (centre to side)', 'a', 's ÷ (2 × tan 36°)', [v(s) + ' ÷ (2 × tan 36°)'], ap, u, 1),
        item('Area', 'A', '½ × P × a', ['½ × ' + v(P5) + ' × ' + v(ap)], P5 * ap / 2, u, 2)];
    }
  });
  reg({
    id: 'hexagon', name: 'Regular hexagon', kind: 'flat', params: [P('s', 'Side', 's', 10, [3, 20])],
    rings: function (p) { return [regPoly(6, p.s, 0)]; },
    draw: function (p) {
      var s = p.s, pts = this.rings(p)[0], AF = SQ3 * s;
      return [shape(pts), dotP([0, 0]), dim(pts[2], pts[1], lab('s', s), { side: [0, -1] }),
        dim(pts[1], pts[5], lab('AF', AF, 1, true), { side: [1, 0], offModel: true }),
        dim(pts[3], pts[0], lab('AC', 2 * s, 1, true), { side: [0, 1], offModel: true })].concat(ticks(pts, 1));
    },
    hl: { P: ['outline', 'dim:s'], A: ['fill', 'dim:s'], AF: ['dim:AF', 'dim:s'], AC: ['dim:AC', 'dim:s'] },
    calc: function (p, u) {
      var s = p.s;
      return [item('Perimeter', 'P', '6 × s', ['6 × ' + v(s)], 6 * s, u, 1),
        item('Area', 'A', '(3 × √3 ÷ 2) × s²', ['(3 × √3 ÷ 2) × ' + v(s) + '²'], 1.5 * SQ3 * s * s, u, 2),
        item('Across flats (wrench size)', 'AF', '√3 × s', ['√3 × ' + v(s)], SQ3 * s, u, 1),
        item('Across corners', 'AC', '2 × s', ['2 × ' + v(s)], 2 * s, u, 1)];
    }
  });
  reg({
    id: 'octagon', name: 'Regular octagon', kind: 'flat', params: [P('s', 'Side', 's', 10, [3, 20])],
    rings: function (p) { return [regPoly(8, p.s, 22.5)]; },
    draw: function (p) {
      var s = p.s, pts = this.rings(p)[0], AF = s * (1 + SQ2);
      return [shape(pts), dotP([0, 0]), dim(pts[2], pts[1], lab('s', s), { side: [0, -1] }),
        dim(pts[1], pts[6], lab('AF', AF, 1, true), { side: [1, 0], offModel: true })].concat(ticks(pts, 1), [glow('AC', [pts[0], pts[4]])]);
    },
    hl: { P: ['outline', 'dim:s'], A: ['fill', 'dim:s'], AF: ['dim:AF', 'dim:s'], AC: ['dim:AC', 'dim:s'] },
    calc: function (p, u) {
      var s = p.s;
      return [item('Perimeter', 'P', '8 × s', ['8 × ' + v(s)], 8 * s, u, 1),
        item('Area', 'A', '2 × (1 + √2) × s²', ['2 × (1 + √2) × ' + v(s) + '²'], 2 * (1 + SQ2) * s * s, u, 2),
        item('Across flats', 'AF', '(1 + √2) × s', ['(1 + √2) × ' + v(s)], (1 + SQ2) * s, u, 1),
        item('Across corners', 'AC', 's ÷ sin 22.5°', [v(s) + ' ÷ sin 22.5°'], s / Math.sin(22.5 * D2R), u, 1)];
    }
  });

  /* ======== 3D MESHES ======== */
  function Mesh() { this.v = []; this.n = []; this.f = []; }
  Mesh.prototype.add = function (p, n) { this.v.push(p); this.n.push(n || null); return this.v.length - 1; };
  Mesh.prototype.face = function (idx, hint, g, lat) {
    var self = this, nn = newell(idx.map(function (i) { return self.v[i]; }));
    if (dot(nn, hint) < 0) idx = idx.slice().reverse();
    this.f.push({ v: idx, g: g || null, lat: lat || null });
  };
  /* surface of revolution about the y axis. prof: [{r, y, nr, ny}] */
  function lathe(m, prof, seg, g, lat) {
    var rings = prof.map(function (pp) {
      var ids = [];
      for (var i = 0; i < seg; i++) {
        var a = 2 * PI * i / seg, c = Math.cos(a), s = Math.sin(a);
        ids.push(m.add([pp.r * c, pp.y, pp.r * s], [pp.nr * c, pp.ny, pp.nr * s]));
      }
      return ids;
    });
    for (var k = 0; k < rings.length - 1; k++) {
      for (var i = 0; i < seg; i++) {
        var j = (i + 1) % seg, q = [rings[k][i], rings[k][j], rings[k + 1][j], rings[k + 1][i]];
        var h = [0, 0, 0];
        q.forEach(function (id) { h = add(h, m.n[id]); });
        m.face(q, h, g, lat);
      }
    }
    return rings;
  }
  function sideProf(r1, y1, r2, y2) {
    var n = nrm([y2 - y1, -(r2 - r1)]);
    return [{ r: r1, y: y1, nr: n[0], ny: n[1] }, { r: r2, y: y2, nr: n[0], ny: n[1] }];
  }
  function cap(m, ring, up) { m.face(ring.slice(), [0, up ? 1 : -1, 0], null, null); }
  function boxMesh(l, h, w) {
    var m = new Mesh(), X = l / 2, Z = w / 2, c = [0, h / 2, 0], id = {};
    [-1, 1].forEach(function (sx) { [0, 1].forEach(function (sy) { [-1, 1].forEach(function (sz) { id[sx + ',' + sy + ',' + sz] = m.add([sx * X, sy * h, sz * Z]); }); }); });
    var g = function (a, b, cc) { return id[a + ',' + b + ',' + cc]; };
    var faces = [
      [[g(-1, 0, -1), g(1, 0, -1), g(1, 0, 1), g(-1, 0, 1)], null],
      [[g(-1, 1, -1), g(1, 1, -1), g(1, 1, 1), g(-1, 1, 1)], null],
      [[g(-1, 0, 1), g(1, 0, 1), g(1, 1, 1), g(-1, 1, 1)], 'side'],
      [[g(-1, 0, -1), g(1, 0, -1), g(1, 1, -1), g(-1, 1, -1)], 'side'],
      [[g(1, 0, -1), g(1, 0, 1), g(1, 1, 1), g(1, 1, -1)], 'side'],
      [[g(-1, 0, -1), g(-1, 0, 1), g(-1, 1, 1), g(-1, 1, -1)], 'side']];
    faces.forEach(function (f) {
      var cen = [0, 0, 0]; f[0].forEach(function (i) { cen = add(cen, mul(m.v[i], 0.25)); });
      m.face(f[0], sub(cen, c), null, f[1]);
    });
    return m;
  }
  function extrude(base, dir, L) {
    var m = new Mesh(), n = base.length, b = [], t = [], cen = [0, 0, 0];
    base.forEach(function (p) { b.push(m.add(p)); t.push(m.add(add(p, mul(dir, L)))); cen = add(cen, mul(p, 1 / n)); });
    cen = add(cen, mul(dir, L / 2));
    m.face(b.slice(), mul(dir, -1), null, null);
    m.face(t.slice(), dir, null, null);
    for (var i = 0; i < n; i++) {
      var j = (i + 1) % n, q = [b[i], b[j], t[j], t[i]], fc = [0, 0, 0];
      q.forEach(function (id) { fc = add(fc, mul(m.v[id], 0.25)); });
      m.face(q, sub(fc, cen), null, 'side');
    }
    return m;
  }
  function seg(res) { return (res && res.seg) || 64; }

  /* annotation helpers (model space) */
  function ringPts(r, y, n) { var a = []; for (var i = 0; i < n; i++) { var t = 2 * PI * i / n; a.push([r * Math.cos(t), y, r * Math.sin(t)]); } return a; }
  function spokes(c, r, y, n) { return ringPts(r, y, n).map(function (p) { return [c, p]; }); }

  /* ======== SOLIDS ======== */
  function boxAnnot(l, w, h, L1, L2, L3) {
    var X = l / 2, Z = w / 2, xe = [], ze = [], ye = [];
    [0, h].forEach(function (y) { [-Z, Z].forEach(function (z) { xe.push([[-X, y, z], [X, y, z]]); }); });
    [0, h].forEach(function (y) { [-X, X].forEach(function (x) { ze.push([[x, y, -Z], [x, y, Z]]); }); });
    [-X, X].forEach(function (x) { [-Z, Z].forEach(function (z) { ye.push([[x, 0, z], [x, h, z]]); }); });
    return { dims: [{ cands: xe, pref: [0, 1], lab: L1 }, { cands: ze, pref: [0.6, 1], lab: L2 }, { cands: ye, pref: [1, 0], lab: L3 }] };
  }
  reg({
    id: 'cube', name: 'Cube', kind: 'solid', convex: true, params: [P('s', 'Side', 's', 6, [2, 15])],
    mesh: function (p) { return boxMesh(p.s, p.s, p.s); },
    annot: function (p) { var s = p.s; return boxAnnot(s, s, s, lab('s', s), lab('s', s), lab('s', s)); },
    calc: function (p, u) {
      var s = p.s;
      return [item('Volume', 'V', 's³', [v(s) + '³'], s * s * s, u, 3),
        item('Lateral area (4 sides)', 'LA', '4 × s²', ['4 × ' + v(s) + '²'], 4 * s * s, u, 2),
        item('Total surface area', 'SA', '6 × s²', ['6 × ' + v(s) + '²'], 6 * s * s, u, 2)];
    },
    hl: { V: ['all'], LA: ['side', 'dim:s'], SA: ['all', 'dim:s'] },
    layout: function (p, u) {
      var s = p.s, SO = 4 * s, W = 3 * s, PA = 6 * s * s, BA = SO * W;
      return [item('Stretch-out (4 faces in a row)', 'SO', '4 × s', ['4 × ' + v(s)], SO, u, 1),
        item('Blank width', 'W', '3 × s', ['3 × ' + v(s)], W, u, 1),
        item('Pattern area (6 faces)', 'PA', '6 × s²', ['6 × ' + v(s) + '²'], PA, u, 2),
        item('Blank area (sheet to cut from)', 'BA', '(4 × s) × (3 × s)', ['(4 × ' + v(s) + ') × (3 × ' + v(s) + ')'], BA, u, 2),
        item('Waste (offcut)', 'WA', 'BA − PA', [v(BA) + ' − ' + v(PA)], BA - PA, u, 2)];
    },
    layoutHl: { SO: ['panels:lat', 'dim:s'], W: ['blank', 'dim:s'], PA: ['panels:all'], BA: ['blank', 'dim:s'], WA: ['blank', 'panels:all'] },
    net: function (p) {
      var s = p.s, sq = function (cx, cy) { return [[cx * s, cy * s], [(cx + 1) * s, cy * s], [(cx + 1) * s, (cy + 1) * s], [cx * s, (cy + 1) * s]]; };
      var panels = [sq(1, 0), sq(0, 1), sq(1, 1), sq(2, 1), sq(3, 1), sq(1, 2)];
      return { panels: panels.map(function (pp, i) { return { pts: pp, role: (i === 0 || i === 5) ? 'base' : 'lat' }; }),
        prims: [dim([s, 3 * s], [2 * s, 3 * s], lab('s', s), { side: [0, 1] }), dim([0, 2 * s], [0, s], lab('s', s), { side: [-1, 0] })] };
    }
  });
  reg({
    id: 'rectangular-prism', name: 'Rectangular prism', kind: 'solid', convex: true,
    params: [P('l', 'Length', 'l', 10, [4, 20]), P('w', 'Width', 'w', 6, [2, 12]), P('h', 'Height', 'h', 4, [2, 12])],
    mesh: function (p) { return boxMesh(p.l, p.h, p.w); },
    annot: function (p) { return boxAnnot(p.l, p.w, p.h, lab('l', p.l), lab('w', p.w), lab('h', p.h)); },
    calc: function (p, u) {
      var l = p.l, w = p.w, h = p.h;
      return [item('Volume', 'V', 'l × w × h', [v(l) + ' × ' + v(w) + ' × ' + v(h)], l * w * h, u, 3),
        item('Lateral area (4 sides)', 'LA', '2 × (l + w) × h', ['2 × (' + v(l) + ' + ' + v(w) + ') × ' + v(h)], 2 * (l + w) * h, u, 2),
        item('Total surface area', 'SA', '2 × (l × w + l × h + w × h)', ['2 × (' + v(l) + ' × ' + v(w) + ' + ' + v(l) + ' × ' + v(h) + ' + ' + v(w) + ' × ' + v(h) + ')'], 2 * (l * w + l * h + w * h), u, 2)];
    },
    hl: { V: ['all'], LA: ['side', 'dim:h'], SA: ['all'] },
    layout: function (p, u) {
      var l = p.l, w = p.w, h = p.h, G = 2 * (w + h), W = l + 2 * w, Lb = 2 * w + 2 * h, PA = 2 * (l * w + l * h + w * h), BA = W * Lb;
      return [item('Girth (around the long strip)', 'G', '2 × (w + h)', ['2 × (' + v(w) + ' + ' + v(h) + ')'], G, u, 1),
        item('Blank width', 'W', 'l + 2 × w', [v(l) + ' + 2 × ' + v(w)], W, u, 1),
        item('Blank length', 'Lb', '2 × w + 2 × h', ['2 × ' + v(w) + ' + 2 × ' + v(h)], Lb, u, 1),
        item('Pattern area (6 faces)', 'PA', '2 × (l × w + l × h + w × h)', ['2 × (' + v(l) + ' × ' + v(w) + ' + ' + v(l) + ' × ' + v(h) + ' + ' + v(w) + ' × ' + v(h) + ')'], PA, u, 2),
        item('Blank area (sheet to cut from)', 'BA', 'W × Lb', [v(W) + ' × ' + v(Lb)], BA, u, 2),
        item('Waste (offcut)', 'WA', 'BA − PA', [v(BA) + ' − ' + v(PA)], BA - PA, u, 2)];
    },
    layoutHl: { G: ['dim:w', 'dim:h'], W: ['blank', 'dim:l', 'dim:w'], Lb: ['blank', 'dim:w', 'dim:h'], PA: ['panels:all'], BA: ['blank'], WA: ['blank', 'panels:all'] },
    net: function (p) {
      var l = p.l, w = p.w, h = p.h, R = function (x0, y0, x1, y1) { return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]; };
      var panels = [{ pts: R(0, 0, l, w), role: 'base' }, { pts: R(0, w, l, w + h), role: 'lat' }, { pts: R(0, w + h, l, 2 * w + h), role: 'base' },
        { pts: R(0, 2 * w + h, l, 2 * w + 2 * h), role: 'lat' }, { pts: R(-w, w, 0, w + h), role: 'lat' }, { pts: R(l, w, l + w, w + h), role: 'lat' }];
      return { panels: panels, prims: [dim([0, 0], [l, 0], lab('l', l), { side: [0, -1] }), dim([-w, w], [0, w], lab('w', w), { side: [0, -1] }), dim([-w, w], [-w, w + h], lab('h', h), { side: [-1, 0] })] };
    }
  });
  reg({
    id: 'triangular-prism', name: 'Triangular prism', kind: 'solid', convex: true,
    params: [P('b', 'Triangle base', 'b', 6, [3, 14]), P('h', 'Triangle height', 'h', 4, [2, 12]), P('l', 'Length', 'l', 10, [4, 20])],
    mesh: function (p) { var b = p.b, h = p.h, l = p.l; return extrude([[-b / 2, 0, -l / 2], [b / 2, 0, -l / 2], [0, h, -l / 2]], [0, 0, 1], l); },
    annot: function (p) {
      var b = p.b, h = p.h, l = p.l, Z = l / 2, s = Math.hypot(b / 2, h);
      return {
        dims: [{ cands: [[[-b / 2, 0, Z], [b / 2, 0, Z]], [[-b / 2, 0, -Z], [b / 2, 0, -Z]]], pref: [0, 1], lab: lab('b', b) },
          { cands: [[[b / 2, 0, -Z], [b / 2, 0, Z]], [[-b / 2, 0, -Z], [-b / 2, 0, Z]], [[0, h, -Z], [0, h, Z]]], pref: [0.6, 1], lab: lab('l', l) },
          { cands: [[[-b / 2, 0, Z], [0, h, Z]], [[-b / 2, 0, -Z], [0, h, -Z]]], pref: [-1, -0.3], lab: lab('s', s, 1, true) }],
        lines: [{ a: [0, 0, Z], b: [0, h, Z], lab: lab('h', h), dash: true }],
        ras: [{ p: [0, 0, Z], u: [1, 0, 0], v: [0, 1, 0] }]
      };
    },
    calc: function (p, u) {
      var b = p.b, h = p.h, l = p.l, s = Math.hypot(b / 2, h), B = b * h / 2;
      return [item('Sloped side of triangle', 's', '√((b ÷ 2)² + h²)', ['√(' + v(b / 2) + '² + ' + v(h) + '²)'], s, u, 1),
        item('Triangle area', 'B', '½ × b × h', ['½ × ' + v(b) + ' × ' + v(h)], B, u, 2),
        item('Volume', 'V', 'B × l', [v(B) + ' × ' + v(l)], B * l, u, 3),
        item('Lateral area (3 rectangles)', 'LA', '(b + 2 × s) × l', ['(' + v(b) + ' + 2 × ' + v(s) + ') × ' + v(l)], (b + 2 * s) * l, u, 2),
        item('Total surface area', 'SA', 'LA + 2 × B', [v((b + 2 * s) * l) + ' + 2 × ' + v(B)], (b + 2 * s) * l + 2 * B, u, 2)];
    },
    hl: { s: ['dim:s', 'dim:h', 'dim:b'], B: ['ends', 'dim:b', 'dim:h'], V: ['all'], LA: ['side', 'dim:l'], SA: ['all'] },
    layout: function (p, u) {
      var b = p.b, h = p.h, l = p.l, s = Math.hypot(b / 2, h), G = 2 * s + b, Lb = l + 2 * h, PA = G * l + b * h, BA = G * Lb;
      return [item('Sloped side of triangle', 's', '√((b ÷ 2)² + h²)', ['√(' + v(b / 2) + '² + ' + v(h) + '²)'], s, u, 1),
        item('Girth (width of the 3-panel strip)', 'G', '2 × s + b', ['2 × ' + v(s) + ' + ' + v(b)], G, u, 1),
        item('Blank length', 'Lb', 'l + 2 × h', [v(l) + ' + 2 × ' + v(h)], Lb, u, 1),
        item('Pattern area (3 rectangles + 2 triangles)', 'PA', '(2 × s + b) × l + b × h', ['(2 × ' + v(s) + ' + ' + v(b) + ') × ' + v(l) + ' + ' + v(b) + ' × ' + v(h)], PA, u, 2),
        item('Blank area (sheet to cut from)', 'BA', 'G × Lb', [v(G) + ' × ' + v(Lb)], BA, u, 2),
        item('Waste (offcut)', 'WA', 'BA − PA', [v(BA) + ' − ' + v(PA)], BA - PA, u, 2)];
    },
    layoutHl: { s: ['dim:s', 'dim:h', 'dim:b'], G: ['panels:lat', 'dim:s', 'dim:b'], Lb: ['blank', 'dim:l', 'dim:h'], PA: ['panels:all'], BA: ['blank'], WA: ['blank', 'panels:all'] },
    net: function (p) {
      var b = p.b, h = p.h, l = p.l, s = Math.hypot(b / 2, h), R = function (x0, y0, x1, y1) { return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]; };
      var panels = [{ pts: R(0, 0, s, l), role: 'lat' }, { pts: R(s, 0, s + b, l), role: 'lat' }, { pts: R(s + b, 0, 2 * s + b, l), role: 'lat' },
        { pts: [[s, 0], [s + b, 0], [s + b / 2, -h]], role: 'base' }, { pts: [[s, l], [s + b, l], [s + b / 2, l + h]], role: 'base' }];
      return { panels: panels, prims: [dim([0, 0], [0, l], lab('l', l), { side: [-1, 0] }), dim([0, 0], [s, 0], lab('s', s, 1, true), { side: [0, -1] }),
        dim([s, l], [s + b, l], lab('b', b), { side: [0, 1], offModel: true }), ann([s + b / 2, 0], [s + b / 2, -h], lab('h', h), { dash: true }), ra([s + b / 2, 0], [1, 0], [0, -1])] };
    }
  });
  function hexPts(s, y) { var a = []; for (var i = 0; i < 6; i++) a.push([s * Math.cos(i * PI / 3), y, s * Math.sin(i * PI / 3)]); return a; }
  reg({
    id: 'hexagonal-prism', name: 'Hexagonal prism', kind: 'solid', convex: true,
    params: [P('s', 'Side of hexagon', 's', 4, [2, 10]), P('h', 'Height', 'h', 10, [3, 20])],
    mesh: function (p) { return extrude(hexPts(p.s, 0), [0, 1, 0], p.h); },
    annot: function (p) {
      var s = p.s, h = p.h, lo = hexPts(s, 0), hi = hexPts(s, h), se = [], ve = [];
      for (var i = 0; i < 6; i++) { se.push([lo[i], lo[(i + 1) % 6]]); ve.push([lo[i], hi[i]]); }
      return { dims: [{ cands: se, pref: [0, 1], lab: lab('s', s) }, { cands: ve, pref: [1, 0], lab: lab('h', h) }] };
    },
    calc: function (p, u) {
      var s = p.s, h = p.h, B = 1.5 * SQ3 * s * s;
      return [item('Hexagon area', 'B', '(3 × √3 ÷ 2) × s²', ['(3 × √3 ÷ 2) × ' + v(s) + '²'], B, u, 2),
        item('Volume', 'V', 'B × h', [v(B) + ' × ' + v(h)], B * h, u, 3),
        item('Lateral area (6 rectangles)', 'LA', '6 × s × h', ['6 × ' + v(s) + ' × ' + v(h)], 6 * s * h, u, 2),
        item('Total surface area', 'SA', 'LA + 2 × B', [v(6 * s * h) + ' + 2 × ' + v(B)], 6 * s * h + 2 * B, u, 2)];
    },
    hl: { B: ['bottom', 'dim:s'], V: ['all'], LA: ['side', 'dim:h'], SA: ['all'] },
    layout: function (p, u) {
      var s = p.s, h = p.h, G = 6 * s, AF = SQ3 * s, Hb = h + 2 * AF, PA = 6 * s * h + 3 * SQ3 * s * s, BA = G * Hb;
      return [item('Girth (6 sides in a row)', 'G', '6 × s', ['6 × ' + v(s)], G, u, 1),
        item('Across flats of the hexagon', 'AF', '√3 × s', ['√3 × ' + v(s)], AF, u, 1),
        item('Blank height', 'Hb', 'h + 2 × AF', [v(h) + ' + 2 × ' + v(AF)], Hb, u, 1),
        item('Pattern area (6 rectangles + 2 hexagons)', 'PA', '6 × s × h + 3 × √3 × s²', ['6 × ' + v(s) + ' × ' + v(h) + ' + 3 × √3 × ' + v(s) + '²'], PA, u, 2),
        item('Blank area (sheet to cut from)', 'BA', 'G × Hb', [v(G) + ' × ' + v(Hb)], BA, u, 2),
        item('Waste (offcut)', 'WA', 'BA − PA', [v(BA) + ' − ' + v(PA)], BA - PA, u, 2)];
    },
    layoutHl: { G: ['panels:lat', 'dim:s'], AF: ['panels:base', 'dim:s'], Hb: ['blank', 'dim:h'], PA: ['panels:all'], BA: ['blank'], WA: ['blank', 'panels:all'] },
    net: function (p) {
      var s = p.s, h = p.h, AF = SQ3 * s, panels = [];
      for (var k = 0; k < 6; k++) panels.push({ pts: [[k * s, 0], [(k + 1) * s, 0], [(k + 1) * s, h], [k * s, h]], role: 'lat' });
      var hx = function (cx, cy) { var a = []; for (var i = 0; i < 6; i++) a.push(pol([cx, cy], s, 60 * i)); return a; };
      panels.push({ pts: hx(1.5 * s, -AF / 2), role: 'base' }, { pts: hx(1.5 * s, h + AF / 2), role: 'base' });
      return { panels: panels, prims: [dim([5 * s, h], [6 * s, h], lab('s', s), { side: [0, 1] }), dim([6 * s, 0], [6 * s, h], lab('h', h), { side: [1, 0] })] };
    }
  });
  function cylMesh(r, h, n) {
    var m = new Mesh(), rg = lathe(m, sideProf(r, 0, r, h), n, 'side', 'side');
    cap(m, rg[0], false); cap(m, rg[1], true);
    return m;
  }
  reg({
    id: 'cylinder', name: 'Cylinder', kind: 'solid', convex: true,
    params: [P('r', 'Radius', 'r', 4, [2, 12]), P('h', 'Height', 'h', 10, [3, 20])],
    mesh: function (p, res) { return cylMesh(p.r, p.h, seg(res)); },
    annot: function (p) {
      var r = p.r, h = p.h;
      return {
        dims: [{ cands: ringPts(r, 0, 72).map(function (q) { return [q, [q[0], h, q[2]]]; }), pref: [1, 0], lab: lab('h', h) }],
        lines: [{ cands: spokes([0, h, 0], r, h, 72), pref: [1, 0.35], lab: lab('r', r), at: 0.55 }],
        dots: [[0, h, 0]]
      };
    },
    hl: { D: ['dim:r'], B: ['bottom', 'dim:r'], V: ['all'], LA: ['side', 'dim:r', 'dim:h'], SA: ['all'] },
    calc: function (p, u) {
      var r = p.r, h = p.h, D = 2 * r;
      return [item('Diameter', 'D', '2 × r', ['2 × ' + v(r)], D, u, 1),
        item('Base area', 'B', 'π × r²', ['π × ' + v(r) + '²'], PI * r * r, u, 2),
        item('Volume', 'V', 'π × r² × h', ['π × ' + v(r) + '² × ' + v(h)], PI * r * r * h, u, 3),
        item('Lateral area (curved side = stretch-out × height)', 'LA', 'π × D × h', ['π × ' + v(D) + ' × ' + v(h)], PI * D * h, u, 2),
        item('Total surface area', 'SA', 'π × D × h + 2 × π × r²', ['π × ' + v(D) + ' × ' + v(h) + ' + 2 × π × ' + v(r) + '²'], PI * D * h + 2 * PI * r * r, u, 2)];
    },
    layout: function (p, u) {
      var r = p.r, h = p.h, D = 2 * r, C = PI * D;
      return [item('Diameter (end discs)', 'D', '2 × r', ['2 × ' + v(r)], D, u, 1),
        item('Stretch-out (length of the body sheet)', 'C', 'π × D', ['π × ' + v(D)], C, u, 1),
        item('Body sheet area', 'LA', 'π × D × h', ['π × ' + v(D) + ' × ' + v(h)], C * h, u, 2),
        item('End disc area (cut 2)', 'E', 'π × r²', ['π × ' + v(r) + '²'], PI * r * r, u, 2)];
    },
    layoutHl: { D: ['dim:D'], C: ['panels:lat', 'dim:πD'], LA: ['panels:lat', 'dim:πD', 'dim:h'], E: ['panels:base', 'dim:D'] },
    net: function (p, res) {
      var r = p.r, h = p.h, C = 2 * PI * r, n = (res && res.circle) || 128, lo = [C / 2, h + r], hi = [C / 2, -r];
      return {
        panels: [{ pts: [[0, 0], [C, 0], [C, h], [0, h]], role: 'lat' }, { pts: circ(hi, r, n), role: 'base' }, { pts: circ(lo, r, n), role: 'base' }],
        prims: [dim([0, 0], [C, 0], lab('πD', C, 1, true), { side: [0, -1], offModel: true }), dim([C, 0], [C, h], lab('h', h), { side: [1, 0] }),
          dotP(lo), ann(pol(lo, r, 200), pol(lo, r, 20), lab('D', 2 * r, 1, true), { at: 0.5, beside: true }),
          dotP(hi), ann(pol(hi, r, 200), pol(hi, r, 20), lab('D', 2 * r, 1, true), { at: 0.5, beside: true })]
      };
    }
  });
  reg({
    id: 'pipe', name: 'Pipe (hollow cylinder)', kind: 'solid',
    params: [P('R', 'Outer radius', 'R', 6, [3, 12]), P('r', 'Inner radius', 'r', 4, function (p) { return [1, Math.max(1, p.R - 1)]; }), P('h', 'Length', 'h', 14, [4, 24])],
    validate: function (p) { return p.r >= p.R ? { k: 'r', msg: 'Inner radius must be smaller than outer radius.' } : null; },
    mesh: function (p, res) {
      var n = seg(res), m = new Mesh(), o = lathe(m, sideProf(p.R, 0, p.R, p.h), n, 'outer', 'outer');
      var ip = sideProf(p.r, 0, p.r, p.h); ip.forEach(function (q) { q.nr = -1; q.ny = 0; });
      var ii = lathe(m, ip, n, 'inner', 'inner');
      for (var i = 0; i < n; i++) {
        var j = (i + 1) % n;
        m.face([o[1][i], o[1][j], ii[1][j], ii[1][i]], [0, 1, 0], null, null);
        m.face([o[0][i], o[0][j], ii[0][j], ii[0][i]], [0, -1, 0], null, null);
      }
      return m;
    },
    annot: function (p) {
      var R = p.R, r = p.r, h = p.h;
      return {
        dims: [{ cands: ringPts(R, 0, 72).map(function (q) { return [q, [q[0], h, q[2]]]; }), pref: [1, 0], lab: lab('h', h) }],
        lines: [{ cands: spokes([0, h, 0], R, h, 72), pref: [1, 0.35], lab: lab('R', R), at: (R + r) / (2 * R) },
          { cands: spokes([0, h, 0], r, h, 72), pref: [-1, 0.45], lab: lab('r', r), at: 0.55 }],
        dots: [[0, h, 0]]
      };
    },
    hl: { OD: ['dim:R'], ID: ['dim:r'], V: ['all'], Vi: ['inner', 'dim:r', 'dim:h'], LAo: ['side', 'dim:R', 'dim:h'], LAi: ['inner', 'dim:r', 'dim:h'], E: ['ends', 'dim:R', 'dim:r'], SA: ['all'] },
    calc: function (p, u) {
      var R = p.R, r = p.r, h = p.h, ends = 2 * PI * (R * R - r * r);
      return [item('Outside diameter', 'OD', '2 × R', ['2 × ' + v(R)], 2 * R, u, 1),
        item('Inside diameter', 'ID', '2 × r', ['2 × ' + v(r)], 2 * r, u, 1),
        item('Volume of material', 'V', 'π × (R² − r²) × h', ['π × (' + v(R) + '² − ' + v(r) + '²) × ' + v(h)], PI * (R * R - r * r) * h, u, 3),
        item('Inside volume (capacity)', 'Vi', 'π × r² × h', ['π × ' + v(r) + '² × ' + v(h)], PI * r * r * h, u, 3),
        item('Outside surface', 'LAo', 'π × OD × h', ['π × ' + v(2 * R) + ' × ' + v(h)], PI * 2 * R * h, u, 2),
        item('Inside surface', 'LAi', 'π × ID × h', ['π × ' + v(2 * r) + ' × ' + v(h)], PI * 2 * r * h, u, 2),
        item('Two end rings', 'E', '2 × π × (R² − r²)', ['2 × π × (' + v(R) + '² − ' + v(r) + '²)'], ends, u, 2),
        item('Total surface area', 'SA', 'LAo + LAi + E', [v(2 * PI * R * h) + ' + ' + v(2 * PI * r * h) + ' + ' + v(ends)], 2 * PI * R * h + 2 * PI * r * h + ends, u, 2)];
    }
  });
  reg({
    id: 'cone', name: 'Cone', kind: 'solid', convex: true,
    params: [P('r', 'Base radius', 'r', 6, [2, 12]), P('h', 'Height', 'h', 8, [3, 20])],
    mesh: function (p, res) { var m = new Mesh(), rg = lathe(m, sideProf(p.r, 0, 0, p.h), seg(res), 'side', 'side'); cap(m, rg[0], false); return m; },
    annot: function (p) {
      var r = p.r, h = p.h, l = Math.hypot(r, h);
      return {
        dims: [{ cands: ringPts(r, 0, 72).map(function (q) { return [q, [0, h, 0]]; }), pref: [1, 0], lab: lab('l', l, 1, true) }],
        lines: [{ name: 'r', cands: spokes([0, 0, 0], r, 0, 72), pref: [1, 0.35], lab: lab('r', r), at: 0.55 },
          { a: [0, 0, 0], b: [0, h, 0], lab: lab('h', h), at: 0.5 }],
        ras: [{ p: [0, 0, 0], uFrom: 'r', v: [0, 1, 0] }],
        dots: [[0, 0, 0]]
      };
    },
    calc: function (p, u) {
      var r = p.r, h = p.h, l = Math.hypot(r, h), th = 360 * r / l;
      return [item('Slant height', 'l', '√(r² + h²)', ['√(' + v(r) + '² + ' + v(h) + '²)'], l, u, 1),
        item('Volume', 'V', '(π × r² × h) ÷ 3', ['(π × ' + v(r) + '² × ' + v(h) + ') ÷ 3'], PI * r * r * h / 3, u, 3),
        item('Lateral area (curved side)', 'LA', 'π × r × l', ['π × ' + v(r) + ' × ' + v(l)], PI * r * l, u, 2),
        item('Total surface area', 'SA', 'π × r × l + π × r²', ['π × ' + v(r) + ' × ' + v(l) + ' + π × ' + v(r) + '²'], PI * r * l + PI * r * r, u, 2)];
    },
    hl: { l: ['dim:l', 'dim:r', 'dim:h'], V: ['all'], LA: ['side', 'dim:r', 'dim:l'], SA: ['all'] },
    layout: function (p, u) {
      var r = p.r, h = p.h, l = Math.hypot(r, h), D = 2 * r, th = 360 * r / l;
      return [item('Sector radius (= slant height)', 'l', '√(r² + h²)', ['√(' + v(r) + '² + ' + v(h) + '²)'], l, u, 1),
        item('Base diameter', 'D', '2 × r', ['2 × ' + v(r)], D, u, 1),
        item('Arc length (stretch-out of the base edge)', 'C', 'π × D', ['π × ' + v(D)], PI * D, u, 1),
        item('Sector angle', 'θ', '360 × r ÷ l', ['360 × ' + v(r) + ' ÷ ' + v(l)], th, u, -1, 'theta'),
        item('Pattern area (sector)', 'LA', 'π × r × l', ['π × ' + v(r) + ' × ' + v(l)], PI * r * l, u, 2)];
    },
    layoutHl: { l: ['dim:l'], D: ['dim:D'], C: ['panels:lat', 'dim:πD'], theta: ['ang:θ', 'dim:l'], LA: ['panels:lat'] },
    net: function (p, res) {
      var r = p.r, h = p.h, l = Math.hypot(r, h), th = 360 * r / l, n = (res && res.circle) || 128;
      var d0 = -90 - th / 2, d1 = -90 + th / 2;
      var sector = [[0, 0]].concat(arc([0, 0], l, d0, d1, n));
      var e0 = pol([0, 0], l, d1);
      var cc = [0, l + r];
      return {
        panels: [{ pts: sector, role: 'lat' }, { pts: circ(cc, r, n), role: 'base' }],
        prims: [dotP([0, 0]), dim([0, 0], e0, lab('l', l, 1, true)),
          { t: 'angle', c: [0, 0], a0: -d1 * D2R, a1: -d0 * D2R, rp: 26, lab: lab('θ', th, 1, true, { unit: '°' }) },
          dotP(cc), ann(pol(cc, r, 200), pol(cc, r, 20), lab('D', 2 * r, 1, true), { at: 0.5, beside: true }),
          { t: 'arclab', c: [0, 0], r: l, d0: d0, d1: d1, side: 1, lab: lab('πD', 2 * PI * r, 1, true), avoid: [[cc, r]] }]
      };
    }
  });
  reg({
    id: 'frustum', name: 'Cone frustum', kind: 'solid', convex: true,
    params: [P('R', 'Bottom radius', 'R', 9, [3, 14]), P('r', 'Top radius', 'r', 6, function (p) { return [1, Math.max(1, p.R - 1)]; }), P('h', 'Height', 'h', 4, [2, 16])],
    validate: function (p) { return p.r >= p.R ? { k: 'r', msg: 'Top radius r must be smaller than bottom radius R.' } : null; },
    mesh: function (p, res) { var m = new Mesh(), rg = lathe(m, sideProf(p.R, 0, p.r, p.h), seg(res), 'side', 'side'); cap(m, rg[0], false); cap(m, rg[1], true); return m; },
    annot: function (p) {
      var R = p.R, r = p.r, h = p.h, l = Math.hypot(R - r, h), lo = ringPts(R, 0, 72), hi = ringPts(r, h, 72);
      return {
        dims: [{ cands: lo.map(function (q, i) { return [q, hi[i]]; }), pref: [1, 0], lab: lab('l', l, 1, true) }],
        lines: [{ name: 'R', cands: spokes([0, 0, 0], R, 0, 72), pref: [1, 0.35], lab: lab('R', R), at: 0.6 },
          { cands: spokes([0, h, 0], r, h, 72), pref: [1, 0.35], lab: lab('r', r), at: 0.55 },
          { a: [0, 0, 0], b: [0, h, 0], lab: lab('h', h), at: 0.4 }],
        ras: [{ p: [0, 0, 0], uFrom: 'R', v: [0, 1, 0] }],
        dots: [[0, 0, 0], [0, h, 0]]
      };
    },
    calc: function (p, u) {
      var R = p.R, r = p.r, h = p.h, l = Math.hypot(R - r, h), L = l * R / (R - r), th = 360 * R / L;
      return [item('Slant height', 'l', '√((R − r)² + h²)', ['√((' + v(R) + ' − ' + v(r) + ')² + ' + v(h) + '²)', '√(' + v(R - r) + '² + ' + v(h) + '²)'], l, u, 1),
        item('Volume', 'V', '(π × h × (R² + R × r + r²)) ÷ 3', ['(π × ' + v(h) + ' × (' + v(R) + '² + ' + v(R) + ' × ' + v(r) + ' + ' + v(r) + '²)) ÷ 3'], PI * h * (R * R + R * r + r * r) / 3, u, 3),
        item('Lateral area (curved side)', 'LA', 'π × (R + r) × l', ['π × (' + v(R) + ' + ' + v(r) + ') × ' + v(l)], PI * (R + r) * l, u, 2),
        item('Total surface area', 'SA', 'LA + π × R² + π × r²', [v(PI * (R + r) * l) + ' + π × ' + v(R) + '² + π × ' + v(r) + '²'], PI * (R + r) * l + PI * R * R + PI * r * r, u, 2)];
    },
    hl: { l: ['dim:l', 'dim:h', 'dim:R', 'dim:r'], V: ['all'], LA: ['side', 'dim:l'], SA: ['all'] },
    layout: function (p, u) {
      var R = p.R, r = p.r, h = p.h, l = Math.hypot(R - r, h), L = l * R / (R - r), th = 360 * R / L, D = 2 * R, d = 2 * r;
      return [item('Slant height', 'l', '√((R − r)² + h²)', ['√((' + v(R) + ' − ' + v(r) + ')² + ' + v(h) + '²)', '√(' + v(R - r) + '² + ' + v(h) + '²)'], l, u, 1),
        item('Outer radius of the pattern', 'L', 'l × R ÷ (R − r)', [v(l) + ' × ' + v(R) + ' ÷ (' + v(R) + ' − ' + v(r) + ')'], L, u, 1),
        item('Inner radius of the pattern', 'Li', 'L − l', [v(L) + ' − ' + v(l)], L - l, u, 1),
        item('Sector angle', 'θ', '360 × R ÷ L', ['360 × ' + v(R) + ' ÷ ' + v(L)], th, u, -1, 'theta'),
        item('Bottom diameter', 'D', '2 × R', ['2 × ' + v(R)], D, u, 1),
        item('Top diameter', 'd', '2 × r', ['2 × ' + v(r)], d, u, 1),
        item('Outer arc (stretch-out of the bottom edge)', 'C', 'π × D', ['π × ' + v(D)], PI * D, u, 1),
        item('Inner arc (stretch-out of the top edge)', 'c', 'π × d', ['π × ' + v(d)], PI * d, u, 1),
        item('Pattern area', 'LA', 'π × (R + r) × l', ['π × (' + v(R) + ' + ' + v(r) + ') × ' + v(l)], PI * (R + r) * l, u, 2)];
    },
    layoutHl: { l: ['dim:l'], L: ['dim:L'], Li: ['dim:L', 'dim:l'], theta: ['ang:θ', 'dim:L'], D: ['dim:D'], d: ['dim:d'],
      C: ['panels:lat', 'dim:πD'], c: ['panels:lat', 'dim:πd'], LA: ['panels:lat'] },
    layoutNotes: ['Layout: extend the sloped side up to where the cone would come to a point. L is the distance from that point to the bottom edge. Swing arcs of radius L and L − l through angle θ to mark out the sheet.'],
    net: function (p, res) {
      var R = p.R, r = p.r, h = p.h, l = Math.hypot(R - r, h), L = l * R / (R - r), Li = L - l, th = 360 * R / L, n = (res && res.circle) || 128;
      var d0 = -90 - th / 2, d1 = -90 + th / 2;
      var outer = arc([0, 0], L, d0, d1, n), inner = arc([0, 0], Li, d1, d0, n);
      var big = [0, L + R], small = Li >= 2.1 * r ? [0, Li - r] : [R + 0.25 * R + r, L + R];
      var oR = pol([0, 0], L, d0), oL = pol([0, 0], L, d1), iR = pol([0, 0], Li, d0), iL = pol([0, 0], Li, d1);
      return {
        panels: [{ pts: outer.concat(inner), role: 'lat' }, { pts: circ(big, R, n), role: 'base' }, { pts: circ(small, r, n), role: 'top' }],
        prims: [aux([0, 0], iL), aux([0, 0], iR), dotP([0, 0]),
          dim([0, 0], oL, lab('L', L, 1, true), { tier: 0 }), dim(iR, oR, lab('l', l, 1, true)),
          { t: 'angle', c: [0, 0], a0: -d1 * D2R, a1: -d0 * D2R, rp: 24, lab: lab('θ', th, 1, true, { unit: '°' }) },
          dotP(big), ann(pol(big, R, 200), pol(big, R, 20), lab('D', 2 * R, 1, true), { at: 0.5, beside: true }),
          dotP(small), ann(pol(small, r, 200), pol(small, r, 20), lab('d', 2 * r, 1, true), { at: 0.5, beside: true }),
          { t: 'arclab', c: [0, 0], r: L, d0: d0, d1: d1, side: 1, lab: lab('πD', 2 * PI * R, 1, true), avoid: [[big, R], [small, r]] },
          { t: 'arclab', c: [0, 0], r: Li, d0: d0, d1: d1, side: -1, at: [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74], lab: lab('πd', 2 * PI * r, 1, true), avoid: [[small, r], [big, R]] }]
      };
    }
  });
  reg({
    id: 'square-pyramid', name: 'Square pyramid', kind: 'solid', convex: true,
    params: [P('b', 'Base side', 'b', 6, [3, 16]), P('h', 'Height', 'h', 4, [2, 16])],
    mesh: function (p) {
      var b = p.b / 2, h = p.h, m = new Mesh();
      var q = [m.add([-b, 0, -b]), m.add([b, 0, -b]), m.add([b, 0, b]), m.add([-b, 0, b])], a = m.add([0, h, 0]);
      m.face(q.slice(), [0, -1, 0], null, null);
      for (var i = 0; i < 4; i++) { var j = (i + 1) % 4, c = mul(add(add(m.v[q[i]], m.v[q[j]]), m.v[a]), 1 / 3); m.face([q[i], q[j], a], sub(c, [0, h / 4, 0]), null, 'side'); }
      return m;
    },
    annot: function (p) {
      var b = p.b, h = p.h, X = b / 2, l = Math.hypot(X, h);
      return {
        dims: [{ cands: [[[-X, 0, X], [X, 0, X]], [[-X, 0, -X], [X, 0, -X]]], pref: [0, 1], lab: lab('b', b) },
          { cands: [[[X, 0, -X], [X, 0, X]], [[-X, 0, -X], [-X, 0, X]]], pref: [0.6, 1], lab: lab('b', b) }],
        lines: [{ a: [0, 0, 0], b: [0, h, 0], lab: lab('h', h), at: 0.55 }, { a: [0, 0, X], b: [0, h, 0], lab: lab('l', l, 1, true), at: 0.3 }],
        ras: [{ p: [0, 0, 0], u: [1, 0, 0], v: [0, 1, 0] }, { p: [0, 0, X], u: [1, 0, 0], v: nrm([0, h, -X]), derived: true }],
        dots: [[0, 0, 0]],
        glows: [{ a: [X, 0, X], b: [0, h, 0], letter: 'e' }]
      };
    },
    calc: function (p, u) {
      var b = p.b, h = p.h, l = Math.hypot(b / 2, h), e = Math.hypot(l, b / 2);
      return [item('Slant height (middle of a face)', 'l', '√((b ÷ 2)² + h²)', ['√(' + v(b / 2) + '² + ' + v(h) + '²)'], l, u, 1),
        item('Sloped edge', 'e', '√(l² + (b ÷ 2)²)', ['√(' + v(l) + '² + ' + v(b / 2) + '²)'], e, u, 1),
        item('Volume', 'V', '(b² × h) ÷ 3', ['(' + v(b) + '² × ' + v(h) + ') ÷ 3'], b * b * h / 3, u, 3),
        item('Lateral area (4 triangles)', 'LA', '2 × b × l', ['2 × ' + v(b) + ' × ' + v(l)], 2 * b * l, u, 2),
        item('Total surface area', 'SA', 'b² + 2 × b × l', [v(b) + '² + 2 × ' + v(b) + ' × ' + v(l)], b * b + 2 * b * l, u, 2)];
    },
    hl: { l: ['dim:l', 'dim:h', 'dim:b'], e: ['dim:e', 'dim:l', 'dim:b'], V: ['all'], LA: ['side', 'dim:l'], SA: ['all'] },
    layout: function (p, u) {
      var b = p.b, h = p.h, l = Math.hypot(b / 2, h), W = b + 2 * l, PA = b * b + 2 * b * l, BA = W * W;
      return [item('Slant height (middle of a face)', 'l', '√((b ÷ 2)² + h²)', ['√(' + v(b / 2) + '² + ' + v(h) + '²)'], l, u, 1),
        item('Blank side (square sheet)', 'W', 'b + 2 × l', [v(b) + ' + 2 × ' + v(l)], W, u, 1),
        item('Pattern area (square + 4 triangles)', 'PA', 'b² + 2 × b × l', [v(b) + '² + 2 × ' + v(b) + ' × ' + v(l)], PA, u, 2),
        item('Blank area (sheet to cut from)', 'BA', 'W²', [v(W) + '²'], BA, u, 2),
        item('Waste (offcut)', 'WA', 'BA − PA', [v(BA) + ' − ' + v(PA)], BA - PA, u, 2)];
    },
    layoutHl: { l: ['dim:l'], W: ['blank', 'dim:b', 'dim:l'], PA: ['panels:all'], BA: ['blank'], WA: ['blank', 'panels:all'] },
    net: function (p) {
      var b = p.b, h = p.h, X = b / 2, l = Math.hypot(X, h), T = X + l;
      var sq = [[-X, -X], [X, -X], [X, X], [-X, X]];
      return {
        panels: [{ pts: sq, role: 'base' }, { pts: [[-X, -X], [X, -X], [0, -T]], role: 'lat' }, { pts: [[X, -X], [X, X], [T, 0]], role: 'lat' },
          { pts: [[X, X], [-X, X], [0, T]], role: 'lat' }, { pts: [[-X, X], [-X, -X], [-T, 0]], role: 'lat' }],
        prims: [dim([-X, X], [X, X], lab('b', b), { side: [0, 1], offModel: true }), ann([X, 0], [T, 0], lab('l', l, 1, true), { dash: true }), ra([X, 0], [1, 0], [0, -1], { derived: true })]
      };
    }
  });
  reg({
    id: 'pyramid-frustum', name: 'Square pyramid frustum', kind: 'solid', convex: true,
    params: [P('a', 'Top side', 'a', 4, function (p) { return [1, Math.max(1, p.b - 2)]; }), P('b', 'Bottom side', 'b', 10, [4, 16]), P('h', 'Height', 'h', 4, [2, 14])],
    rndOrder: ['b', 'a', 'h'],
    validate: function (p) { return p.a >= p.b ? { k: 'a', msg: 'Top side a must be smaller than bottom side b.' } : null; },
    mesh: function (p) {
      var A = p.a / 2, B = p.b / 2, h = p.h, m = new Mesh(), c = [0, h / 2, 0];
      var lo = [m.add([-B, 0, -B]), m.add([B, 0, -B]), m.add([B, 0, B]), m.add([-B, 0, B])];
      var hi = [m.add([-A, h, -A]), m.add([A, h, -A]), m.add([A, h, A]), m.add([-A, h, A])];
      m.face(lo.slice(), [0, -1, 0], null, null); m.face(hi.slice(), [0, 1, 0], null, null);
      for (var i = 0; i < 4; i++) {
        var j = (i + 1) % 4, q = [lo[i], lo[j], hi[j], hi[i]], fc = [0, 0, 0];
        q.forEach(function (id) { fc = add(fc, mul(m.v[id], 0.25)); });
        m.face(q, sub(fc, c), null, 'side');
      }
      return m;
    },
    annot: function (p) {
      var A = p.a / 2, B = p.b / 2, h = p.h, l = Math.hypot(B - A, h);
      return {
        dims: [{ cands: [[[-A, h, -A], [A, h, -A]], [[-A, h, A], [A, h, A]]], pref: [0, -1], lab: lab('a', p.a) },
          { cands: [[[-B, 0, B], [B, 0, B]], [[-B, 0, -B], [B, 0, -B]]], pref: [0, 1], lab: lab('b', p.b) }],
        lines: [{ a: [0, 0, 0], b: [0, h, 0], lab: lab('h', h), at: 0.6 }, { a: [0, 0, B], b: [0, h, A], lab: lab('l', l, 1, true), at: 0.35 }],
        ras: [{ p: [0, 0, 0], u: [1, 0, 0], v: [0, 1, 0] }],
        dots: [[0, 0, 0], [0, h, 0]]
      };
    },
    calc: function (p, u) {
      var a = p.a, b = p.b, h = p.h, l = Math.hypot((b - a) / 2, h);
      return [item('Slant height (middle of a face)', 'l', '√(((b − a) ÷ 2)² + h²)', ['√(((' + v(b) + ' − ' + v(a) + ') ÷ 2)² + ' + v(h) + '²)', '√(' + v((b - a) / 2) + '² + ' + v(h) + '²)'], l, u, 1),
        item('Volume', 'V', '(h × (a² + a × b + b²)) ÷ 3', ['(' + v(h) + ' × (' + v(a) + '² + ' + v(a) + ' × ' + v(b) + ' + ' + v(b) + '²)) ÷ 3'], h * (a * a + a * b + b * b) / 3, u, 3),
        item('Lateral area (4 trapezoids)', 'LA', '2 × (a + b) × l', ['2 × (' + v(a) + ' + ' + v(b) + ') × ' + v(l)], 2 * (a + b) * l, u, 2),
        item('Total surface area', 'SA', 'LA + a² + b²', [v(2 * (a + b) * l) + ' + ' + v(a) + '² + ' + v(b) + '²'], 2 * (a + b) * l + a * a + b * b, u, 2)];
    },
    hl: { l: ['dim:l', 'dim:h', 'dim:a', 'dim:b'], V: ['all'], LA: ['side', 'dim:l'], SA: ['all'] },
    layout: function (p, u) {
      var a = p.a, b = p.b, h = p.h, l = Math.hypot((b - a) / 2, h), W = b + 2 * l + a, Lb = b + 2 * l, PA = a * a + b * b + 2 * (a + b) * l, BA = W * Lb;
      return [item('Slant height (middle of a face)', 'l', '√(((b − a) ÷ 2)² + h²)', ['√(((' + v(b) + ' − ' + v(a) + ') ÷ 2)² + ' + v(h) + '²)', '√(' + v((b - a) / 2) + '² + ' + v(h) + '²)'], l, u, 1),
        item('Blank width', 'W', 'b + 2 × l + a', [v(b) + ' + 2 × ' + v(l) + ' + ' + v(a)], W, u, 1),
        item('Blank length', 'Lb', 'b + 2 × l', [v(b) + ' + 2 × ' + v(l)], Lb, u, 1),
        item('Pattern area (2 squares + 4 trapezoids)', 'PA', 'a² + b² + 2 × (a + b) × l', [v(a) + '² + ' + v(b) + '² + 2 × (' + v(a) + ' + ' + v(b) + ') × ' + v(l)], PA, u, 2),
        item('Blank area (sheet to cut from)', 'BA', 'W × Lb', [v(W) + ' × ' + v(Lb)], BA, u, 2),
        item('Waste (offcut)', 'WA', 'BA − PA', [v(BA) + ' − ' + v(PA)], BA - PA, u, 2)];
    },
    layoutHl: { l: ['dim:l'], W: ['blank', 'dim:b', 'dim:l', 'dim:a'], Lb: ['blank', 'dim:b', 'dim:l'], PA: ['panels:all'], BA: ['blank'], WA: ['blank', 'panels:all'] },
    net: function (p) {
      var A = p.a / 2, B = p.b / 2, h = p.h, l = Math.hypot(B - A, h), T = B + l;
      return {
        panels: [{ pts: [[-B, -B], [B, -B], [B, B], [-B, B]], role: 'base' },
          { pts: [[-B, -B], [B, -B], [A, -T], [-A, -T]], role: 'lat' }, { pts: [[B, -B], [B, B], [T, A], [T, -A]], role: 'lat' },
          { pts: [[B, B], [-B, B], [-A, T], [A, T]], role: 'lat' }, { pts: [[-B, B], [-B, -B], [-T, -A], [-T, A]], role: 'lat' },
          { pts: [[T, -A], [T, A], [T + 2 * A, A], [T + 2 * A, -A]], role: 'top' }],
        prims: [dim([-B, B], [B, B], lab('b', p.b), { side: [0, 1], offModel: true }), dim([T, -A], [T + 2 * A, -A], lab('a', p.a), { side: [0, -1] }),
          ann([0, -B], [0, -T], lab('l', l, 1, true), { dash: true }), ra([0, -B], [1, 0], [0, -1], { derived: true })]
      };
    }
  });
  function sphereProf(r, n, from, to) {
    var out = [];
    for (var i = 0; i <= n; i++) { var a = (from + (to - from) * i / n) * D2R; out.push({ r: r * Math.cos(a), y: r * Math.sin(a), nr: Math.cos(a), ny: Math.sin(a) }); }
    return out;
  }
  reg({
    id: 'sphere', name: 'Sphere', kind: 'solid', convex: true, params: [P('r', 'Radius', 'r', 5, [2, 15])],
    mesh: function (p, res) { var m = new Mesh(); lathe(m, sphereProf(p.r, (res && (res.sphereLat || res.lat)) || 24, -90, 90), (res && (res.sphereSeg || res.seg)) || 48, 'sphere', 'surface'); return m; },
    annot: function (p) {
      var r = p.r;
      return {
        curves: [{ pts: ringPts(r, 0, 96), closed: true }],
        lines: [{ cands: spokes([0, 0, 0], r, 0, 72), pref: [1, 0.25], lab: lab('r', r), at: 0.55, noOcc: true }],
        dots: [[0, 0, 0]]
      };
    },
    calc: function (p, u) {
      var r = p.r;
      return [item('Volume', 'V', '(4 × π × r³) ÷ 3', ['(4 × π × ' + v(r) + '³) ÷ 3'], 4 * PI * r * r * r / 3, u, 3),
        item('Surface area', 'SA', '4 × π × r²', ['4 × π × ' + v(r) + '²'], 4 * PI * r * r, u, 2)];
    },
    hl: { V: ['all', 'dim:r'], SA: ['all', 'dim:r'] }
  });
  reg({
    id: 'hemisphere', name: 'Hemisphere', kind: 'solid', convex: true, params: [P('r', 'Radius', 'r', 6, [2, 15])],
    mesh: function (p, res) {
      var m = new Mesh(), rg = lathe(m, sphereProf(p.r, (res && (res.sphereLat || res.lat)) ? (res.sphereLat || res.lat) / 2 : 12, -90, 0), (res && (res.sphereSeg || res.seg)) || 48, 'dome', 'dome');
      cap(m, rg[rg.length - 1], true);
      return m;
    },
    annot: function (p) {
      return { lines: [{ cands: spokes([0, 0, 0], p.r, 0, 72), pref: [1, 0.35], lab: lab('r', p.r), at: 0.55 }], dots: [[0, 0, 0]] };
    },
    calc: function (p, u) {
      var r = p.r;
      return [item('Volume', 'V', '(2 × π × r³) ÷ 3', ['(2 × π × ' + v(r) + '³) ÷ 3'], 2 * PI * r * r * r / 3, u, 3),
        item('Curved surface', 'LA', '2 × π × r²', ['2 × π × ' + v(r) + '²'], 2 * PI * r * r, u, 2),
        item('Flat circle', 'B', 'π × r²', ['π × ' + v(r) + '²'], PI * r * r, u, 2),
        item('Total surface area', 'SA', '3 × π × r²', ['3 × π × ' + v(r) + '²'], 3 * PI * r * r, u, 2)];
    },
    hl: { V: ['all', 'dim:r'], LA: ['side', 'dim:r'], B: ['top', 'dim:r'], SA: ['all'] }
  });

  /* ==== UNUSUAL SHAPES (begin) ==== */
  /*
   * Unusual shapes: a third group in the picker. Sizes start in mm. Every formula below was checked against the source named
   * here (read 2026-10-14) and against the drawn geometry (rings for flat shapes, meshes for solids) by test-unusual.js.
   *   Stadium (obround): A = π r² + 2 r a, P = 2(π r + a), a = straight length. Wikipedia "Stadium (geometry)".
   *   Reuleaux triangle: A = ½ (π − √3) w², from the centre triangle plus three 60° circular segments. Wikipedia "Reuleaux triangle",
   *     MathWorld "Reuleaux Triangle". Perimeter π w: Barbier's theorem (Wikipedia "Barbier's theorem").
   *   Ring sector: A = (θ/2)(R² − r²) with θ in radians = (θ ÷ 360) × π × (R² − r²). Wikipedia "Annulus (mathematics)".
   *   Lune (crescent): circle minus its overlap with a second circle. Overlap = two circular segments,
   *     segment area = (θ ÷ 360) × π × R² − ½ × R² × sin θ (Wikipedia "Circular segment", a = R²/2 (θ − sin θ)).
   *     Segment angles from the law of cosines. Chord c = 2 R sin(θ/2) (Wikipedia "Circular segment").
   *   Star: 2n triangles, each ½ × R × r × sin(180°/n) (triangle area ½ab sin C), edge from the law of cosines.
   *   Torus: V = (π r²)(2π R), A = (2π r)(2π R), Pappus's centroid theorem. Wikipedia "Torus", "Pappus's centroid theorem".
   *   Pipe elbow: Pappus with the distance the centre of the pipe circle travels, (θ ÷ 360) × π × D.
   *     Take-out (centre to end) = bend radius × tan(θ ÷ 2): pipingengineer.org "Pipe Elbow Center Calculation".
   *     Throat = inside curve (CLR − OD/2), heel = outside curve (CLR + OD/2): bendlabs.co.uk "1D vs 1.5D vs 2D bend radius".
   *   Mitred cylinder (truncated cylinder): V = π r² (h1 + h2)/2, side = π r (h1 + h2), cut face = ellipse with semi-axes r and r / cos θ.
   *     MathWorld "Cylindrical Segment", vias.org "Cylindrical Segment", calculatorlib.com truncated cylinder calculator.
   *     Weld length round the oval cut: Ramanujan's approximation for the ellipse perimeter (the same one the Ellipse shape uses).
   *   Spherical cap: V = π h (3 a² + h²) / 6, curved area π (a² + h²), sphere radius from 2 h R = a² + h². Wikipedia "Spherical cap".
   *     Real tank heads usually add a knuckle (torispherical): Wikipedia "Head (vessel)".
   *   Capsule: V = (4/3) π r³ + π r² h, A = 2 π r (2 r + h). Wikipedia "Capsule (geometry)".
   *   I-beam: A = 2 bf tf + (d − 2 tf) tw (square corners). steelsolver.com section properties, sagecalculator.com I-beam calculator.
   *     Channel and angle: the same split into rectangles. Perimeters are the sums of the edge lengths of the drawn section.
   *   Rectangular HSS: A = B H − (B − 2t)(H − 2t). Corner radius often taken as 2t: Steel Tube Institute, "Welding HSS corners".
   *   Regular polygon: apothem = s ÷ (2 tan(180° ÷ n)), A = ½ × P × apothem. Wikipedia "Regular polygon".
   *   Platonic solids: A = (a/2)² F p cot(π/p), V = r A / 3, vertex coordinates. Wikipedia "Platonic solid".
   *     Dodecahedron A = 3√(25 + 10√5) a², V = ¼(15 + 7√5) a³ (same values as Wikipedia "Regular dodecahedron").
   *     Icosahedron A = 5√3 a², V = 5φ²a³/6 = (5/12)(3 + √5) a³ (Wikipedia "Regular icosahedron").
   *   No flat pattern: surfaces that curve both ways (sphere, torus) are not developable. Wikipedia "Developable surface".
   */
  var LB = lab;
  function U(d) { d.unusual = true; d.unit = 'mm'; reg(d); }
  function whole(n, lo, hi) { return Math.abs(n - Math.round(n)) < 1e-9 && n >= lo && n <= hi; }

  /* ======== UNUSUAL FLAT SHAPES ======== */
  U({
    id: 'stadium', name: 'Stadium (slot)', kind: 'flat',
    params: [P('l', 'Straight length', 'l', 60, [20, 150]), P('r', 'End radius', 'r', 15, [5, 40])],
    rings: function (p, n) { var k = n || 128, h = p.l / 2; return [arc([h, 0], p.r, -90, 90, k).concat(arc([-h, 0], p.r, 90, 270, k))]; },
    draw: function (p, n) {
      var h = p.l / 2, r = p.r;
      return [shape(this.rings(p, n)[0]), dotP([-h, 0]), dotP([h, 0]), aux([-h, 0], [h, 0]),
        dim([-h, -r], [h, -r], LB('l', p.l), { side: [0, -1] }), ann([h, 0], pol([h, 0], r, 35), LB('r', r), { at: 0.6 }),
        dim([-h, -r], [-h, r], LB('D', 2 * r, 1, true), { side: [-1, 0], offModel: true }),
        dim([-h - r, r], [h + r, r], LB('Lo', p.l + 2 * r, 1, true), { side: [0, 1], offModel: true })];
    },
    hl: { D: ['dim:D', 'dim:r'], Lo: ['dim:Lo', 'dim:l', 'dim:D'], A: ['fill', 'dim:l', 'dim:r'], P: ['outline', 'dim:l', 'dim:D'] },
    calc: function (p, u) {
      var l = p.l, r = p.r, D = 2 * r;
      return [item('End diameter (slot width)', 'D', '2 × r', ['2 × ' + v(r)], D, u, 1),
        item('Overall length', 'Lo', 'l + D', [v(l) + ' + ' + v(D)], l + D, u, 1),
        item('Area', 'A', 'l × D + π × r²', [v(l) + ' × ' + v(D) + ' + π × ' + v(r) + '²'], l * D + PI * r * r, u, 2),
        item('Perimeter (2 straights + 2 half circles)', 'P', '2 × l + π × D', ['2 × ' + v(l) + ' + π × ' + v(D)], 2 * l + PI * D, u, 1)];
    },
    notes: ['A stadium (obround) is the shape of a slot cut for an adjusting bolt. The two half circles make one full circle, so the round ends add π × D to the perimeter.']
  });
  function reuleauxPts(w) { return [[0, 0], [w, 0], [w / 2, -w * SQ3 / 2]]; }
  U({
    id: 'reuleaux', name: 'Reuleaux triangle', kind: 'flat',
    params: [P('w', 'Width', 'w', 80, [20, 200])],
    rings: function (p, n) {
      var k = n || 192, V = reuleauxPts(p.w), w = p.w;
      var a1 = arc(V[2], w, 240, 300, k), a2 = arc(V[0], w, 0, 60, k), a3 = arc(V[1], w, 120, 180, k);
      return [a1.concat(a2.slice(1), a3.slice(1, -1))];
    },
    draw: function (p, n) {
      var w = p.w, V = reuleauxPts(w), seg1 = arc(V[2], w, 240, 300, 96);
      return [shape(this.rings(p, n)[0]), aux(V[0], V[1]), aux(V[1], V[2]), aux(V[2], V[0]), dotP(V[0]), dotP(V[1]), dotP(V[2]),
        dim(V[0], V[1], LB('w', w), { side: [0, 1], offModel: true }), glow('T', V, true), glow('S', seg1.concat([V[0]]), true)];
    },
    hl: { T: ['dim:T', 'dim:w'], S: ['dim:S', 'dim:w'], A: ['fill', 'dim:w'], P: ['outline', 'dim:w'] },
    calc: function (p, u) {
      var w = p.w, T = SQ3 / 4 * w * w, S = PI * w * w / 6 - T;
      return [item('Centre triangle (equilateral, side w)', 'T', '(√3 ÷ 4) × w²', ['(√3 ÷ 4) × ' + v(w) + '²'], T, u, 2),
        item('One curved edge piece (60° slice of a circle minus the triangle)', 'S', '(60 ÷ 360) × π × w² − T', ['(60 ÷ 360) × π × ' + v(w) + '² − ' + v(T)], S, u, 2),
        item('Area (triangle + 3 edge pieces)', 'A', 'T + 3 × S', [v(T) + ' + 3 × ' + v(S)], T + 3 * S, u, 2),
        item('Perimeter (three 60° arcs of radius w)', 'P', 'π × w', ['π × ' + v(w)], PI * w, u, 1)];
    },
    notes: ['A Reuleaux triangle has constant width: it measures w across in every direction, the same as a circle of diameter w. That is why its perimeter is π × w.']
  });
  U({
    id: 'ring-sector', name: 'Ring sector (curved strip)', kind: 'flat',
    params: [P('R', 'Outer radius', 'R', 120, [40, 250]), P('r', 'Inner radius', 'r', 80, function (p) { return [10, Math.max(10, p.R - 10)]; }), P('t', 'Angle', 'θ', 90, [1, 12])],
    angleParam: 't', rndOrder: ['R', 'r', 't'],
    validate: function (p) {
      if (p.r >= p.R) return { k: 'r', msg: 'Inner radius r must be smaller than outer radius R.' };
      if (p.t >= 360) return { k: 't', msg: 'Angle θ must be less than 360°.' };
      return null;
    },
    rings: function (p, n) { return [arc([0, 0], p.R, 0, p.t, n || 128).concat(arc([0, 0], p.r, p.t, 0, n || 128))]; },
    draw: function (p, n) {
      var R = p.R, r = p.r, t = p.t, L = t / 360 * 2 * PI * R, mid = [Math.cos(t / 2 * D2R), -Math.sin(t / 2 * D2R)];
      return [shape(this.rings(p, n)[0]), dotP([0, 0]), aux([0, 0], pol([0, 0], r, 0)), aux([0, 0], pol([0, 0], r, t)),
        dim(pol([0, 0], r, 0), pol([0, 0], R, 0), LB('w', R - r, 1, true), { side: [0, 1] }),
        ann([0, 0], pol([0, 0], R, t), LB('R', R), { at: 0.8, dash: true }), ann([0, 0], pol([0, 0], r, t / 2), LB('r', r), { at: 0.55, dash: true }),
        { t: 'angle', c: [0, 0], a0: -t * D2R, a1: 0, rp: 22, lab: LB('θ', t, 1, false, { unit: '°' }) },
        { t: 'text', p: pol([0, 0], R, t / 2), dir: mid, lab: LB('L', L, 1, true), color: COL.ink, glow: arc([0, 0], R, 0, t, 128) },
        glow('l', arc([0, 0], r, 0, t, 128))];
    },
    hl: { D: ['dim:R'], d: ['dim:r'], w: ['dim:w', 'dim:R', 'dim:r'], L: ['dim:L', 'ang:θ', 'dim:R'], l: ['dim:l', 'ang:θ', 'dim:r'],
      A: ['fill', 'ang:θ', 'dim:R', 'dim:r'], P: ['outline', 'dim:L', 'dim:l', 'dim:w'] },
    calc: function (p, u) {
      var R = p.R, r = p.r, t = p.t, D = 2 * R, d = 2 * r, L = t / 360 * PI * D, l = t / 360 * PI * d, w = R - r;
      return [item('Outer diameter (full circle)', 'D', '2 × R', ['2 × ' + v(R)], D, u, 1),
        item('Inner diameter (full circle)', 'd', '2 × r', ['2 × ' + v(r)], d, u, 1),
        item('Width of the strip', 'w', 'R − r', [v(R) + ' − ' + v(r)], w, u, 1),
        item('Outer arc', 'L', '(θ ÷ 360) × π × D', ['(' + v(t) + ' ÷ 360) × π × ' + v(D)], L, u, 1),
        item('Inner arc', 'l', '(θ ÷ 360) × π × d', ['(' + v(t) + ' ÷ 360) × π × ' + v(d)], l, u, 1),
        item('Area', 'A', '(θ ÷ 360) × π × (R² − r²)', ['(' + v(t) + ' ÷ 360) × π × (' + v(R) + '² − ' + v(r) + '²)'], t / 360 * PI * (R * R - r * r), u, 2),
        item('Perimeter', 'P', 'L + l + 2 × w', [v(L) + ' + ' + v(l) + ' + 2 × ' + v(w)], L + l + 2 * w, u, 1)];
    },
    notes: ['A ring sector is a slice of a washer: one piece of a large flange or a curved stair stringer cut from plate.']
  });
  function starRing(p) { var n = Math.round(p.n), pts = []; for (var k = 0; k < 2 * n; k++) pts.push(pol([0, 0], k % 2 ? p.r : p.R, 90 + k * 180 / n)); return pts; }
  U({
    id: 'star', name: 'Star', kind: 'flat',
    params: [P('n', 'Number of points', 'n', 5, [4, 8], { int: true }), P('R', 'Outer radius (centre to tip)', 'R', 100, [40, 200]),
      P('r', 'Inner radius (centre to notch)', 'r', 40, function (p) { return [10, Math.max(10, Math.floor(p.R * 0.7))]; })],
    rndOrder: ['n', 'R', 'r'],
    validate: function (p) {
      if (!whole(p.n, 3, 24)) return { k: 'n', msg: 'Number of points n must be a whole number from 3 to 24.' };
      if (p.r >= p.R) return { k: 'r', msg: 'Inner radius r must be smaller than outer radius R.' };
      return null;
    },
    rings: function (p) { return [starRing(p)]; },
    draw: function (p) {
      var pts = starRing(p), n = Math.round(p.n), f = 180 / n, e = Math.sqrt(p.R * p.R + p.r * p.r - 2 * p.R * p.r * Math.cos(f * D2R));
      return [shape(pts), dotP([0, 0]), ann([0, 0], pts[0], LB('R', p.R), { at: 0.6, dash: true }), ann([0, 0], pts[2 * n - 1], LB('r', p.r), { at: 0.6, dash: true }),
        { t: 'angle', c: [0, 0], a0: -(90 - f) * D2R, a1: -90 * D2R, rp: 22, lab: LB('φ', f, 1, true, { unit: '°' }) },
        dim(pts[2 * n - 1], pts[0], LB('e', e, 1, true))];
    },
    hl: { phi: ['ang:φ'], e: ['dim:e', 'dim:R', 'dim:r', 'ang:φ'], A: ['fill', 'dim:R', 'dim:r', 'ang:φ'], P: ['outline', 'dim:e'] },
    calc: function (p, u) {
      var n = Math.round(p.n), R = p.R, r = p.r, f = 180 / n, e = Math.sqrt(R * R + r * r - 2 * R * r * Math.cos(f * D2R));
      return [angItem('Angle from a tip to the next notch', 'φ', '180 ÷ n', ['180 ÷ ' + n], f, 'phi'),
        item('Edge length (law of cosines)', 'e', '√(R² + r² − 2 × R × r × cos φ)', ['√(' + v(R) + '² + ' + v(r) + '² − 2 × ' + v(R) + ' × ' + v(r) + ' × cos ' + v(f) + '°)'], e, u, 1),
        item('Area (2 × n triangles)', 'A', 'n × R × r × sin φ', [n + ' × ' + v(R) + ' × ' + v(r) + ' × sin ' + v(f) + '°'], n * R * r * Math.sin(f * D2R), u, 2),
        item('Perimeter (2 × n edges)', 'P', '2 × n × e', ['2 × ' + n + ' × ' + v(e)], 2 * n * e, u, 1)];
    },
    notes: ['Each point of the star is two triangles that meet at the centre. Each triangle has sides R and r with the angle φ between them, so its area is ½ × R × r × sin φ.']
  });
  /* lune: circle of radius R centred at O, minus a cutter circle of radius r centred e to the right */
  function luneGeo(p) {
    var R = p.R, r = p.r, e = p.e, x0 = (e * e + R * R - r * r) / (2 * e);
    var al = Math.acos(Math.max(-1, Math.min(1, x0 / R))) / D2R, be = Math.acos(Math.max(-1, Math.min(1, (e - x0) / r))) / D2R;
    return { al: al, be: be, Ip: pol([0, 0], R, al), Im: pol([0, 0], R, -al) };
  }
  U({
    id: 'lune', name: 'Lune (crescent)', kind: 'flat',
    params: [P('R', 'Circle radius', 'R', 60, [30, 120]), P('r', 'Cutter radius', 'r', 50, function (p) { return [Math.max(10, Math.floor(p.R * 0.5)), p.R]; }),
      P('e', 'Distance between centres', 'e', 40, function (p) { var lo = Math.ceil(Math.abs(p.R - p.r)) + 3; return [lo, Math.max(lo, Math.floor(p.R + 0.6 * p.r))]; })],
    rndOrder: ['R', 'r', 'e'],
    validate: function (p) {
      if (p.e <= Math.abs(p.R - p.r) || p.e >= p.R + p.r) return { k: 'e', msg: 'The two circles must cross: distance e must be more than the difference of the radii (' + fmt(Math.abs(p.R - p.r)) + ') and less than their sum (' + fmt(p.R + p.r) + ').' };
      return null;
    },
    rings: function (p, n) {
      var g = luneGeo(p), k = n || 192;
      var big = arc([0, 0], p.R, g.al, 360 - g.al, k), small = arc([p.e, 0], p.r, 180 + g.be, 180 - g.be, k);
      return [big.concat(small.slice(1, -1))];
    },
    draw: function (p, n) {
      var g = luneGeo(p), R = p.R, r = p.r, e = p.e, O2 = [e, 0];
      return [shape(this.rings(p, n)[0]), { t: 'auxp', pts: arc(O2, r, 180 - g.be, g.be - 180, 96) }, dotP([0, 0]), dotP(O2),
        aux([0, 0], g.Ip), aux([0, 0], g.Im), aux(O2, g.Ip), aux(O2, g.Im),
        ann([0, 0], pol([0, 0], R, 180), LB('R', R), { at: 0.5 }), ann(O2, pol(O2, r, -30), LB('r', r), { at: 0.6 }),
        dim([0, 0], O2, LB('e', e), { side: [0, 1], offModel: true }), ann(g.Ip, g.Im, LB('c', 2 * R * Math.sin(g.al * D2R), 1, true), { dash: true, at: 0.3 }),
        { t: 'angle', c: [0, 0], a0: -g.al * D2R, a1: g.al * D2R, rp: 20, lab: LB('θ₁', 2 * g.al, 1, true, { unit: '°' }) },
        { t: 'angle', c: O2, a0: (180 - g.be) * D2R, a1: (180 + g.be) * D2R, rp: 18, lab: LB('θ₂', 2 * g.be, 1, true, { unit: '°' }) },
        glow('S₁', arc([0, 0], R, -g.al, g.al, 96), true), glow('S₂', arc(O2, r, 180 - g.be, 180 + g.be, 96), true),
        glow('Lo', arc([0, 0], R, g.al, 360 - g.al, 128)), glow('Li', arc(O2, r, 180 - g.be, 180 + g.be, 96))];
    },
    hl: { D: ['dim:R'], d: ['dim:r'], t1: ['ang:θ₁', 'dim:R', 'dim:r', 'dim:e'], t2: ['ang:θ₂', 'dim:R', 'dim:r', 'dim:e'],
      S1: ['dim:S₁', 'ang:θ₁', 'dim:R'], S2: ['dim:S₂', 'ang:θ₂', 'dim:r'], Ao: ['dim:S₁', 'dim:S₂'], A: ['fill', 'dim:R', 'dim:S₁', 'dim:S₂'],
      Lo: ['dim:Lo', 'ang:θ₁', 'dim:R'], Li: ['dim:Li', 'ang:θ₂', 'dim:r'], P: ['outline', 'dim:Lo', 'dim:Li'], c: ['dim:c', 'ang:θ₁', 'dim:R'] },
    calc: function (p, u) {
      var R = p.R, r = p.r, e = p.e, g = luneGeo(p), t1 = 2 * g.al, t2 = 2 * g.be, D = 2 * R, d = 2 * r;
      var S1 = t1 / 360 * PI * R * R - 0.5 * R * R * Math.sin(t1 * D2R), S2 = t2 / 360 * PI * r * r - 0.5 * r * r * Math.sin(t2 * D2R);
      var Lo = (360 - t1) / 360 * PI * D, Li = t2 / 360 * PI * d;
      return [item('Circle diameter', 'D', '2 × R', ['2 × ' + v(R)], D, u, 1),
        item('Cutter diameter', 'd', '2 × r', ['2 × ' + v(r)], d, u, 1),
        angItem('Angle of the overlap at the circle centre (law of cosines)', 'θ₁', '2 × cos⁻¹((e² + R² − r²) ÷ (2 × e × R))', ['2 × cos⁻¹((' + v(e) + '² + ' + v(R) + '² − ' + v(r) + '²) ÷ (2 × ' + v(e) + ' × ' + v(R) + '))'], t1, 't1'),
        angItem('Angle of the overlap at the cutter centre (law of cosines)', 'θ₂', '2 × cos⁻¹((e² + r² − R²) ÷ (2 × e × r))', ['2 × cos⁻¹((' + v(e) + '² + ' + v(r) + '² − ' + v(R) + '²) ÷ (2 × ' + v(e) + ' × ' + v(r) + '))'], t2, 't2'),
        item('Overlap piece of the circle (segment)', 'S₁', '(θ₁ ÷ 360) × π × R² − ½ × R² × sin θ₁', ['(' + v(t1) + ' ÷ 360) × π × ' + v(R) + '² − ½ × ' + v(R) + '² × sin ' + v(t1) + '°'], S1, u, 2, 'S1'),
        item('Overlap piece of the cutter (segment)', 'S₂', '(θ₂ ÷ 360) × π × r² − ½ × r² × sin θ₂', ['(' + v(t2) + ' ÷ 360) × π × ' + v(r) + '² − ½ × ' + v(r) + '² × sin ' + v(t2) + '°'], S2, u, 2, 'S2'),
        item('Overlap area (cut away)', 'Ao', 'S₁ + S₂', [v(S1) + ' + ' + v(S2)], S1 + S2, u, 2),
        item('Area of the lune', 'A', 'π × R² − Ao', ['π × ' + v(R) + '² − ' + v(S1 + S2)], PI * R * R - S1 - S2, u, 2),
        item('Outer arc', 'Lo', '((360 − θ₁) ÷ 360) × π × D', ['((360 − ' + v(t1) + ') ÷ 360) × π × ' + v(D)], Lo, u, 1),
        item('Inner arc (cut by the cutter)', 'Li', '(θ₂ ÷ 360) × π × d', ['(' + v(t2) + ' ÷ 360) × π × ' + v(d)], Li, u, 1),
        item('Perimeter', 'P', 'Lo + Li', [v(Lo) + ' + ' + v(Li)], Lo + Li, u, 1),
        item('Chord between the two tips', 'c', '2 × R × sin(θ₁ ÷ 2)', ['2 × ' + v(R) + ' × sin ' + v(t1 / 2) + '°'], 2 * R * Math.sin(g.al * D2R), u, 1)];
    },
    notes: ['The overlap is two circular segments back to back, one from each circle. Take it away from the whole circle to leave the lune.']
  });

  /* ======== UNUSUAL SOLIDS: mesh helpers ======== */
  /* surface of revolution through angle a0..a1 (radians) about the y axis. wrapA joins the last column to the first, wrapP closes the profile. */
  function revolve(m, prof, n, a0, a1, wrapA, wrapP, g, lat) {
    var cols = wrapA ? n : n + 1;
    var rings = prof.map(function (pp) {
      var ids = [];
      for (var i = 0; i < cols; i++) { var a = a0 + (a1 - a0) * i / n, c = Math.cos(a), s = Math.sin(a); ids.push(m.add([pp.r * c, pp.y, pp.r * s], [pp.nr * c, pp.ny, pp.nr * s])); }
      return ids;
    });
    var K = wrapP ? prof.length : prof.length - 1;
    for (var k = 0; k < K; k++) {
      var k2 = (k + 1) % prof.length;
      for (var i = 0; i < n; i++) {
        var i2 = wrapA ? (i + 1) % n : i + 1, q = [rings[k][i], rings[k][i2], rings[k2][i2], rings[k2][i]], h = [0, 0, 0];
        q.forEach(function (id) { h = add(h, m.n[id]); });
        m.face(q, h, g, lat);
      }
    }
    return rings;
  }
  function tubeProf(R, r, n) { var pr = []; for (var j = 0; j < n; j++) { var t = 2 * PI * j / n; pr.push({ r: R + r * Math.cos(t), y: r * Math.sin(t), nr: Math.cos(t), ny: Math.sin(t) }); } return pr; }
  /* straight bar: section [[sx, sy]] counter-clockwise, laid along x from −L/2 to L/2 (section sx → z, sy → y).
     pieces: convex parts of the end face as index lists, so the hidden-line test works on every face. */
  function extrudeSec(sec, L, pieces) {
    var m = new Mesh(), X = L / 2, a = [], b = [];
    sec.forEach(function (q) { a.push(m.add([-X, q[1], q[0]])); b.push(m.add([X, q[1], q[0]])); });
    m.capA = []; m.capB = []; m.sides = [];
    pieces.forEach(function (pc) {
      m.capA.push(m.f.length); m.face(pc.map(function (i) { return a[i]; }), [-1, 0, 0], null, null);
      m.capB.push(m.f.length); m.face(pc.map(function (i) { return b[i]; }), [1, 0, 0], null, null);
    });
    for (var i = 0; i < sec.length; i++) {
      var j = (i + 1) % sec.length, d = [sec[j][0] - sec[i][0], sec[j][1] - sec[i][1]];
      m.sides.push(m.f.length);
      m.face([a[i], a[j], b[j], b[i]], [0, -d[0], d[1]], null, 'side');
    }
    m.ia = a; m.ib = b;
    return m;
  }
  function secOutline(sec, x) { return sec.map(function (q) { return [x, q[1], q[0]]; }); }
  function secPerim(sec) { var s = 0; for (var i = 0; i < sec.length; i++) { var a = sec[i], b = sec[(i + 1) % sec.length]; s += Math.hypot(b[0] - a[0], b[1] - a[1]); } return s; }

  /* ---- unfolding a polyhedral mesh into a flat net (faces stay joined along fold lines, no overlaps) ---- */
  function satOverlap(A, B, eps) {
    var polys = [A, B];
    for (var pi = 0; pi < 2; pi++) {
      var Pp = polys[pi];
      for (var i = 0; i < Pp.length; i++) {
        var p1 = Pp[i], p2 = Pp[(i + 1) % Pp.length], ax = [p1[1] - p2[1], p2[0] - p1[0]], l = Math.hypot(ax[0], ax[1]);
        if (l < 1e-12) continue;
        ax = [ax[0] / l, ax[1] / l];
        var a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
        A.forEach(function (q) { var d = q[0] * ax[0] + q[1] * ax[1]; if (d < a0) a0 = d; if (d > a1) a1 = d; });
        B.forEach(function (q) { var d = q[0] * ax[0] + q[1] * ax[1]; if (d < b0) b0 = d; if (d > b1) b1 = d; });
        if (a1 <= b0 + eps || b1 <= a0 + eps) return false;
      }
    }
    return true;
  }
  /* tree: optional list of [parentFace, childFace], otherwise breadth-first from root. Returns panels with shared corner points. */
  function unfold(m, root, tree, roleOf) {
    var F = m.f.map(function (f) { return f.v; });
    var N = F.map(function (vv) { return nrm(newell(vv.map(function (i) { return m.v[i]; }))); });
    var scale = 0; m.v.forEach(function (q) { scale = Math.max(scale, len(q)); });
    var eps = 1e-7 * Math.max(1, scale), pos = F.map(function () { return null; }), placed = [];
    var edgeF = {};
    F.forEach(function (vv, fi) { vv.forEach(function (a, j) { var b = vv[(j + 1) % vv.length], k = a < b ? a + '_' + b : b + '_' + a; (edgeF[k] = edgeF[k] || []).push(fi); }); });
    function local(fi, a, b) {
      var P0 = m.v[a], u = nrm(sub(m.v[b], P0)), w = cross(N[fi], u);
      return F[fi].map(function (i) { var d = sub(m.v[i], P0); return [dot(d, u), dot(d, w)]; });
    }
    function put(fi, pts) { pos[fi] = {}; F[fi].forEach(function (vi, j) { pos[fi][vi] = pts[j]; }); placed.push(fi); }
    function tryPlace(par, ch) {
      var vv = F[par];
      for (var j = 0; j < vv.length; j++) {
        var a = vv[j], b = vv[(j + 1) % vv.length], k = a < b ? a + '_' + b : b + '_' + a;
        if ((edgeF[k] || []).indexOf(ch) < 0) continue;
        var loc = local(ch, a, b), A2 = pos[par][a], B2 = pos[par][b], ang = Math.atan2(B2[1] - A2[1], B2[0] - A2[0]), c = Math.cos(ang), s = Math.sin(ang);
        var pts = loc.map(function (q, i) {
          var vi = F[ch][i];
          if (vi === a) return A2;
          if (vi === b) return B2;
          return [A2[0] + q[0] * c - q[1] * s, A2[1] + q[0] * s + q[1] * c];
        });
        var clash = placed.some(function (o) { return satOverlap(F[o].map(function (vi) { return pos[o][vi]; }), pts, eps); });
        if (clash) return false;
        put(ch, pts);
        return true;
      }
      return false;
    }
    put(root, local(root, F[root][0], F[root][1]));
    if (tree) tree.forEach(function (pc) { if (!pos[pc[1]] && pos[pc[0]]) tryPlace(pc[0], pc[1]); });
    var grew = true;
    while (grew) {
      grew = false;
      for (var q = 0; q < placed.length; q++) {
        var f = placed[q], vv = F[f];
        for (var j = 0; j < vv.length; j++) {
          var a = vv[j], b = vv[(j + 1) % vv.length];
          (edgeF[a < b ? a + '_' + b : b + '_' + a] || []).forEach(function (g) { if (!pos[g] && tryPlace(f, g)) grew = true; });
        }
      }
    }
    /* tidy: turn the net so its bounding box is smallest (wider than tall), then flip y for the y-down drawing */
    var uniq = [];
    placed.forEach(function (fi) { F[fi].forEach(function (vi) { var pt = pos[fi][vi]; if (uniq.indexOf(pt) < 0) uniq.push(pt); }); });
    var best = null;
    placed.forEach(function (fi) {
      F[fi].forEach(function (vi, j) {
        var p1 = pos[fi][vi], p2 = pos[fi][F[fi][(j + 1) % F[fi].length]], ang = -Math.atan2(p2[1] - p1[1], p2[0] - p1[0]), c = Math.cos(ang), s = Math.sin(ang);
        var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
        uniq.forEach(function (pt) { var x = pt[0] * c - pt[1] * s, y = pt[0] * s + pt[1] * c; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; });
        var sc = (x1 - x0) * (y1 - y0) * (x1 - x0 < y1 - y0 - 1e-9 ? 1.5 : 1);
        if (!best || sc < best.sc - 1e-9) best = { sc: sc, c: c, s: s };
      });
    });
    uniq.forEach(function (pt) { var x = pt[0] * best.c - pt[1] * best.s, y = pt[0] * best.s + pt[1] * best.c; pt[0] = x; pt[1] = -y; });
    var panels = placed.map(function (fi) { return { pts: F[fi].map(function (vi) { return pos[fi][vi]; }), role: roleOf ? roleOf(fi) : (fi === root ? 'base' : 'lat'), face: fi }; });
    panels.sort(function (x, y) { return x.face - y.face; });
    return { panels: panels, at: function (fi, vi) { return pos[fi] ? pos[fi][vi] : null; }, all: placed.length === F.length };
  }

  /* ======== UNUSUAL SOLIDS ======== */
  U({
    id: 'torus', name: 'Torus (ring)', kind: 'solid',
    params: [P('R', 'Centre line radius', 'R', 80, [40, 200]), P('r', 'Tube radius', 'r', 25, function (p) { return [5, Math.max(5, Math.floor(p.R * 0.6))]; })],
    validate: function (p) { return p.r >= p.R ? { k: 'r', msg: 'Tube radius r must be smaller than centre line radius R, or the ring closes up.' } : null; },
    mesh: function (p, res) { var m = new Mesh(); revolve(m, tubeProf(p.R, p.r, (res && res.lat) || 24), seg(res), 0, 2 * PI, true, true, 'side', 'side'); return m; },
    annot: function (p) {
      var R = p.R, r = p.r;
      return {
        lines: [{ cands: spokes([0, 0, 0], R, 0, 72), pref: [1, 0.35], lab: LB('R', R), at: 0.45, noOcc: true },
          { cands: ringPts(R, 0, 72).map(function (q) { return [q, [q[0], r, q[2]]]; }), pref: [-0.2, 1], lab: LB('r', r), at: 0.5, noOcc: true }],
        dots: [[0, 0, 0]],
        glows: [{ pts: ringPts(R, 0, 96), closed: true, letter: 'C' }, { pts: ringPts(R + r, 0, 96), closed: true, letter: 'OD' }, { pts: ringPts(R - r, 0, 96), closed: true, letter: 'ID' }]
      };
    },
    hl: { Dc: ['dim:R', 'dim:C'], d: ['dim:r'], OD: ['dim:OD', 'dim:R', 'dim:r'], ID: ['dim:ID', 'dim:R', 'dim:r'], C: ['dim:C', 'dim:R'], V: ['all', 'dim:r', 'dim:C'], SA: ['all', 'dim:r', 'dim:C'] },
    calc: function (p, u) {
      var R = p.R, r = p.r, D = 2 * R, d = 2 * r, C = PI * D;
      return [item('Centre line diameter', 'D', '2 × R', ['2 × ' + v(R)], D, u, 1, 'Dc'),
        item('Tube diameter', 'd', '2 × r', ['2 × ' + v(r)], d, u, 1),
        item('Outside diameter (OD)', 'OD', 'D + d', [v(D) + ' + ' + v(d)], D + d, u, 1),
        item('Inside diameter (ID)', 'ID', 'D − d', [v(D) + ' − ' + v(d)], D - d, u, 1),
        item('Centre line length (once around the middle of the tube)', 'C', 'π × D', ['π × ' + v(D)], C, u, 1),
        item('Volume (Pappus: tube circle area × centre line length)', 'V', 'π × r² × C', ['π × ' + v(r) + '² × ' + v(C)], PI * r * r * C, u, 3),
        item('Surface area (Pappus: distance around the tube × centre line length)', 'SA', 'π × d × C', ['π × ' + v(d) + ' × ' + v(C)], PI * d * C, u, 2)];
    },
    noNet: 'No flat pattern: a torus curves two ways at once, like a ball, so no flat sheet can be bent to fit it without stretching. There is no true net.',
    notes: ['Think of the ring cut once and pulled straight: it becomes a cylinder of radius r and length C. That is why V = π × r² × C and SA = π × d × C.']
  });
  function elbowV(p) { var t2 = p.t / 2 * D2R, k = p.R / Math.cos(t2); return [k * Math.cos(t2), 0, k * Math.sin(t2)]; }
  function elbowUp(q) { return [q[0], q[2], -q[1]]; }
  U({
    id: 'elbow', name: 'Pipe elbow (bend)', kind: 'solid',
    params: [P('R', 'Bend radius (to centre line)', 'R', 152, [60, 300]), P('r', 'Pipe radius (outside)', 'r', 57, function (p) { return [10, Math.max(10, Math.floor(p.R * 0.6))]; }),
      P('t', 'Bend angle', 'θ', 90, [1, 6])],
    angleParam: 't', rndOrder: ['R', 'r', 't'],
    validate: function (p) {
      if (p.r >= p.R) return { k: 'r', msg: 'Pipe radius r must be smaller than the bend radius R.' };
      if (p.t >= 180) return { k: 't', msg: 'Bend angle θ must be less than 180°.' };
      return null;
    },
    mesh: function (p, res) {
      var m = new Mesh(), th = p.t * D2R, n = Math.max(6, Math.ceil(seg(res) * p.t / 360) * 2);
      var rg = revolve(m, tubeProf(p.R, p.r, (res && res.lat) || 24), n, 0, th, false, true, 'side', 'side');
      m.face(rg.map(function (k) { return k[0]; }), [0, 0, -1], null, null);
      m.face(rg.map(function (k) { return k[n]; }), [-Math.sin(th), 0, Math.cos(th)], null, null);
      /* stand the bend up in the x-y plane so the default view shows the elbow side on */
      m.v = m.v.map(elbowUp); m.n = m.n.map(function (q) { return q && elbowUp(q); });
      return m;
    },
    annot: function (p) {
      var R = p.R, r = p.r, th = p.t * D2R, E2 = elbowUp([R * Math.cos(th), 0, R * Math.sin(th)]), V = elbowUp(elbowV(p));
      var arcAt = function (rad) { var a = []; for (var i = 0; i <= 64; i++) { var q = th * i / 64; a.push(elbowUp([rad * Math.cos(q), 0, rad * Math.sin(q)])); } return a; };
      return {
        lines: [{ a: [0, 0, 0], b: [R, 0, 0], lab: LB('R', R), at: 0.5 }, { a: [R, 0, 0], b: [R, 0, -r], lab: LB('r', r), at: 0.6, noOcc: true },
          { a: [R, 0, 0], b: V, lab: LB('T', R * Math.tan(th / 2), 1, true), at: 0.55 }],
        curves: [{ pts: arcAt(R) }],
        dots: [[0, 0, 0], V],
        glows: [{ a: E2, b: V, letter: 'T' }, { pts: arcAt(R), letter: 'L' }, { pts: arcAt(R + r), letter: 'Lh' }, { pts: arcAt(R - r), letter: 'Lt' }]
      };
    },
    hl: { Db: ['dim:R'], d: ['dim:r'], L: ['dim:L', 'dim:R'], Lh: ['dim:Lh', 'dim:R', 'dim:r'], Lt: ['dim:Lt', 'dim:R', 'dim:r'], T: ['dim:T', 'dim:R'],
      V: ['all', 'dim:r', 'dim:L'], LA: ['side', 'dim:r', 'dim:L'], SA: ['all', 'dim:r'] },
    calc: function (p, u) {
      var R = p.R, r = p.r, t = p.t, D = 2 * R, d = 2 * r, L = t / 360 * PI * D, LA = PI * d * L;
      return [item('Bend diameter (centre line circle)', 'D', '2 × R', ['2 × ' + v(R)], D, u, 1, 'Db'),
        item('Pipe outside diameter', 'd', '2 × r', ['2 × ' + v(r)], d, u, 1),
        item('Centre line length of the bend', 'L', '(θ ÷ 360) × π × D', ['(' + v(t) + ' ÷ 360) × π × ' + v(D)], L, u, 1),
        item('Heel (outside curve)', 'Lh', '(θ ÷ 360) × π × (D + d)', ['(' + v(t) + ' ÷ 360) × π × (' + v(D) + ' + ' + v(d) + ')'], t / 360 * PI * (D + d), u, 1),
        item('Throat (inside curve)', 'Lt', '(θ ÷ 360) × π × (D − d)', ['(' + v(t) + ' ÷ 360) × π × (' + v(D) + ' − ' + v(d) + ')'], t / 360 * PI * (D - d), u, 1),
        item('Take-out (centre to end)', 'T', 'R × tan(θ ÷ 2)', [v(R) + ' × tan ' + v(t / 2) + '°'], R * Math.tan(t / 2 * D2R), u, 1),
        item('Volume (Pappus: pipe circle area × centre line length)', 'V', 'π × r² × L', ['π × ' + v(r) + '² × ' + v(L)], PI * r * r * L, u, 3),
        item('Outside surface of the bend (Pappus)', 'LA', 'π × d × L', ['π × ' + v(d) + ' × ' + v(L)], LA, u, 2),
        item('Surface area (bend + the two end circles)', 'SA', 'LA + 2 × π × r²', [v(LA) + ' + 2 × π × ' + v(r) + '²'], LA + 2 * PI * r * r, u, 2)];
    },
    noNet: 'No flat pattern: a pipe bend curves two ways at once, so no flat sheet fits it without stretching. A bend made from straight pipe uses mitre cuts instead (see Mitred cylinder).',
    notes: ['The take-out is measured from the end of the elbow to the point where the two pipe centre lines meet. For a 90° bend, tan 45° = 1, so the take-out equals the bend radius R.']
  });
  /* mitred cylinder: axis on y, square end at y = 0, cut plane y = L + x × tan θ */
  U({
    id: 'mitred-cylinder', name: 'Mitred cylinder (pipe cut at an angle)', kind: 'solid', convex: true,
    params: [P('r', 'Pipe radius (outside)', 'r', 57, [15, 150]), P('L', 'Length at the centre line', 'L', 300, [100, 600]),
      P('t', 'Cut angle', 'θ', 45, [10, 45], { deg: true, min: 1, max: 89 })],
    validate: function (p) {
      if (p.t >= 90) return { k: 't', msg: 'Cut angle θ must be less than 90°.' };
      var k = p.r * Math.tan(p.t * D2R);
      if (p.L <= k + 1e-9 * Math.max(1, k)) return { k: 'L', msg: 'The cut runs past the end of the pipe: length L must be more than r × tan θ (' + fmt(k) + ').' };
      return null;
    },
    mesh: function (p, res) {
      var m = new Mesh(), n = seg(res), r = p.r, k = Math.tan(p.t * D2R), lo = [], hi = [];
      for (var i = 0; i < n; i++) {
        var a = 2 * PI * i / n, c = Math.cos(a), s = Math.sin(a);
        lo.push(m.add([r * c, 0, r * s], [c, 0, s])); hi.push(m.add([r * c, p.L + r * c * k, r * s], [c, 0, s]));
      }
      for (var j = 0; j < n; j++) {
        var j2 = (j + 1) % n, q = [lo[j], lo[j2], hi[j2], hi[j]], h = [0, 0, 0];
        q.forEach(function (id) { h = add(h, m.n[id]); });
        m.face(q, h, 'side', 'side');
      }
      m.face(lo.slice(), [0, -1, 0], null, null);
      m.face(hi.slice(), [-k, 1, 0], null, 'top');
      return m;
    },
    annot: function (p) {
      var r = p.r, k = Math.tan(p.t * D2R), a = p.L - r * k, b = p.L + r * k, rim = [];
      for (var i = 0; i < 96; i++) { var t = 2 * PI * i / 96; rim.push([r * Math.cos(t), p.L + r * Math.cos(t) * k, r * Math.sin(t)]); }
      return {
        dims: [{ cands: [[[-r, 0, 0], [-r, a, 0]]], pref: [-1, 0], lab: LB('a', a, 1, true) }, { cands: [[[r, 0, 0], [r, b, 0]]], pref: [1, 0], lab: LB('b', b, 1, true) }],
        lines: [{ cands: spokes([0, 0, 0], r, 0, 72), pref: [1, 0.35], lab: LB('r', r), at: 0.55 }, { a: [0, 0, 0], b: [0, p.L, 0], lab: LB('L', p.L), at: 0.5 }],
        dots: [[0, 0, 0], [0, p.L, 0]],
        glows: [{ a: [-r, a, 0], b: [r, b, 0], letter: 'c' }, { pts: rim, closed: true, letter: 'W' }]
      };
    },
    hl: { D: ['dim:r'], a: ['dim:a', 'dim:L', 'dim:r'], b: ['dim:b', 'dim:L', 'dim:r'], c: ['dim:c', 'dim:r'], m: ['dim:c'], W: ['dim:W', 'dim:c', 'dim:r'],
      V: ['all', 'dim:r', 'dim:L'], LA: ['side', 'dim:r', 'dim:L'], B: ['bottom', 'dim:r'], E: ['top', 'dim:c', 'dim:r'], SA: ['all'] },
    calc: function (p, u) {
      var r = p.r, L = p.L, t = p.t, k = Math.tan(t * D2R), D = 2 * r, c = D / Math.cos(t * D2R), mm = c / 2;
      var LA = PI * D * L, B = PI * r * r, E = PI * r * mm;
      return [item('Pipe outside diameter', 'D', '2 × r', ['2 × ' + v(r)], D, u, 1),
        item('Short side', 'a', 'L − r × tan θ', [v(L) + ' − ' + v(r) + ' × tan ' + v(t) + '°'], L - r * k, u, 1),
        item('Long side', 'b', 'L + r × tan θ', [v(L) + ' + ' + v(r) + ' × tan ' + v(t) + '°'], L + r * k, u, 1),
        item('Long way across the oval cut', 'c', 'D ÷ cos θ', [v(D) + ' ÷ cos ' + v(t) + '°'], c, u, 1),
        item('Half the long way across', 'm', 'c ÷ 2', [v(c) + ' ÷ 2'], mm, u, 1),
        item('Weld length around the cut (approximate)', 'W', 'π × (3 × (m + r) − √((3 × m + r) × (m + 3 × r)))',
          ['π × (3 × (' + v(mm) + ' + ' + v(r) + ') − √((3 × ' + v(mm) + ' + ' + v(r) + ') × (' + v(mm) + ' + 3 × ' + v(r) + ')))'], ramanujan(mm, r), u, 1),
        item('Volume (the same as a straight pipe of length L)', 'V', 'π × r² × L', ['π × ' + v(r) + '² × ' + v(L)], PI * r * r * L, u, 3),
        item('Side area (curved wall)', 'LA', 'π × D × L', ['π × ' + v(D) + ' × ' + v(L)], LA, u, 2),
        item('Square end (circle)', 'B', 'π × r²', ['π × ' + v(r) + '²'], B, u, 2),
        item('Cut face (oval)', 'E', 'π × r × m', ['π × ' + v(r) + ' × ' + v(mm)], E, u, 2),
        item('Total surface area', 'SA', 'LA + B + E', [v(LA) + ' + ' + v(B) + ' + ' + v(E)], LA + B + E, u, 2)];
    },
    notes: ['For a two-piece 90° mitre, each piece is cut at θ = 45°. The weld length uses Ramanujan’s approximation for the distance around an oval, which is accurate to well under 0.1% here.'],
    layout: function (p, u) {
      var r = p.r, L = p.L, t = p.t, k = Math.tan(t * D2R), D = 2 * r;
      return [item('Pipe outside diameter', 'D', '2 × r', ['2 × ' + v(r)], D, u, 1),
        item('Stretch-out (length of the wrap-around pattern)', 'C', 'π × D', ['π × ' + v(D)], PI * D, u, 1),
        item('Short side (at the seam)', 'a', 'L − r × tan θ', [v(L) + ' − ' + v(r) + ' × tan ' + v(t) + '°'], L - r * k, u, 1),
        item('Long side (halfway round)', 'b', 'L + r × tan θ', [v(L) + ' + ' + v(r) + ' × tan ' + v(t) + '°'], L + r * k, u, 1),
        item('Pattern area (wall only)', 'LA', 'π × D × L', ['π × ' + v(D) + ' × ' + v(L)], PI * D * L, u, 2)];
    },
    layoutHl: { D: ['dim:D'], C: ['panels:lat', 'dim:πD'], a: ['dim:a'], b: ['dim:b'], LA: ['panels:lat', 'dim:L'] },
    layoutNotes: ['Wrap the pattern round the pipe with the straight edge on the square end. The cut line is lowest (a) at the seam, highest (b) halfway round, and exactly L a quarter of the way round.'],
    net: function (p, res) {
      var r = p.r, L = p.L, k = r * Math.tan(p.t * D2R), C = 2 * PI * r, n = (res && res.circle) || 128, mm = r / Math.cos(p.t * D2R);
      var body = [[0, 0], [C, 0]];
      for (var i = n; i >= 0; i--) { var x = C * i / n; body.push([x, -(L - k * Math.cos(2 * PI * x / C))]); }
      var lo = [C / 2, r], top = [C / 2, -(L + k) - r], ell = [];
      for (var j = 0; j < n; j++) { var q = 2 * PI * j / n; ell.push([top[0] + mm * Math.cos(q), top[1] + r * Math.sin(q)]); }
      return {
        panels: [{ pts: body, role: 'lat' }, { pts: circ(lo, r, n), role: 'base' }, { pts: ell, role: 'top' }],
        prims: [dim([0, 0], [C, 0], LB('πD', C, 1, true), { side: [0, 1], offModel: true }), dim([0, 0], [0, -(L - k)], LB('a', L - k, 1, true), { side: [-1, 0] }),
          ann([C / 2, 0], [C / 2, -(L + k)], LB('b', L + k, 1, true), { dash: true, at: 0.35 }), ann([C / 4, 0], [C / 4, -L], LB('L', L), { dash: true, at: 0.5 }),
          dotP(lo), ann(pol(lo, r, 200), pol(lo, r, 20), LB('D', 2 * r, 1, true), { at: 0.5, beside: true }),
          ann([top[0] - mm, top[1]], [top[0] + mm, top[1]], LB('c', 2 * mm, 1, true), { at: 0.5, beside: true })]
      };
    }
  });
  function capGeo(p) { var R = (p.a * p.a + p.h * p.h) / (2 * p.h); return { R: R, cy: p.h - R, t0: Math.asin(Math.max(-1, Math.min(1, (R - p.h) / R))) / D2R }; }
  U({
    id: 'spherical-cap', name: 'Spherical cap (dish)', kind: 'solid', convex: true,
    params: [P('a', 'Rim radius', 'a', 150, [60, 300]), P('h', 'Depth', 'h', 50, function (p) { return [10, Math.max(10, Math.floor(p.a * 0.8))]; })],
    validate: function (p) { return p.h > p.a ? { k: 'h', msg: 'Depth h can be at most the rim radius a. A deeper dish is more than half a sphere.' } : null; },
    mesh: function (p, res) {
      var g = capGeo(p), m = new Mesh(), nl = Math.max(8, (res && (res.sphereLat || res.lat)) || 24), prof = [];
      for (var i = 0; i <= nl; i++) { var t = (g.t0 + (90 - g.t0) * i / nl) * D2R; prof.push({ r: g.R * Math.cos(t), y: g.cy + g.R * Math.sin(t), nr: Math.cos(t), ny: Math.sin(t) }); }
      var rg = lathe(m, prof, (res && (res.sphereSeg || res.seg)) || 48, 'dome', 'dome');
      cap(m, rg[0], false);
      return m;
    },
    annot: function (p) {
      var g = capGeo(p);
      return {
        lines: [{ name: 'a', cands: spokes([0, 0, 0], p.a, 0, 72), pref: [1, 0.35], lab: LB('a', p.a), at: 0.55 }, { a: [0, 0, 0], b: [0, p.h, 0], lab: LB('h', p.h), at: 0.5 }],
        ras: [{ p: [0, 0, 0], uFrom: 'a', v: [0, 1, 0] }],
        dots: [[0, 0, 0]],
        glows: [{ a: [0, g.cy, 0], b: [0, p.h, 0], letter: 'R' }]
      };
    },
    hl: { D: ['dim:a'], Rs: ['dim:R', 'dim:a', 'dim:h'], V: ['all', 'dim:a', 'dim:h'], LA: ['side', 'dim:a', 'dim:h'], B: ['bottom', 'dim:a'], SA: ['all'] },
    calc: function (p, u) {
      var a = p.a, h = p.h, LA = PI * (a * a + h * h), B = PI * a * a;
      return [item('Rim diameter', 'D', '2 × a', ['2 × ' + v(a)], 2 * a, u, 1),
        item('Radius of the sphere the dish comes from', 'R', '(a² + h²) ÷ (2 × h)', ['(' + v(a) + '² + ' + v(h) + '²) ÷ (2 × ' + v(h) + ')'], (a * a + h * h) / (2 * h), u, 1, 'Rs'),
        item('Volume', 'V', '(π × h × (3 × a² + h²)) ÷ 6', ['(π × ' + v(h) + ' × (3 × ' + v(a) + '² + ' + v(h) + '²)) ÷ 6'], PI * h * (3 * a * a + h * h) / 6, u, 3),
        item('Curved (dished) surface', 'LA', 'π × (a² + h²)', ['π × (' + v(a) + '² + ' + v(h) + '²)'], LA, u, 2),
        item('Flat rim circle', 'B', 'π × a²', ['π × ' + v(a) + '²'], B, u, 2),
        item('Total surface area', 'SA', 'LA + B', [v(LA) + ' + ' + v(B)], LA + B, u, 2)];
    },
    noNet: 'No flat pattern: a dish is part of a sphere, and a sphere cannot be laid out flat exactly.',
    notes: ['Most real tank heads add a curved knuckle where the dish meets the shell (a torispherical head). This shape is the simple dish with no knuckle.']
  });
  U({
    id: 'capsule', name: 'Capsule (tank with round ends)', kind: 'solid', convex: true,
    params: [P('r', 'Radius', 'r', 300, [100, 600]), P('l', 'Straight length (body)', 'l', 1200, [300, 2400])],
    mesh: function (p, res) {
      var m = new Mesh(), r = p.r, l = p.l, n = (res && (res.sphereSeg || res.seg)) || 48, nl = Math.max(6, Math.round(((res && (res.sphereLat || res.lat)) || 24) / 2));
      lathe(m, sphereProf(r, nl, -90, 0), n, 'dome1', null);
      lathe(m, sideProf(r, 0, r, l), n, 'side', 'side');
      lathe(m, sphereProf(r, nl, 0, 90).map(function (q) { return { r: q.r, y: q.y + l, nr: q.nr, ny: q.ny }; }), n, 'dome2', null);
      return m;
    },
    annot: function (p) {
      var r = p.r, l = p.l;
      return {
        dims: [{ cands: ringPts(r, 0, 72).map(function (q) { return [q, [q[0], l, q[2]]]; }), pref: [1, 0], lab: LB('l', l) }],
        lines: [{ cands: spokes([0, l, 0], r, l, 72), pref: [1, 0.35], lab: LB('r', r), at: 0.55 }],
        dots: [[0, l, 0]],
        glows: [{ a: [0, -r, 0], b: [0, l + r, 0], letter: 'Lo' }]
      };
    },
    hl: { D: ['dim:r'], Lo: ['dim:Lo', 'dim:l', 'dim:r'], V: ['all', 'dim:r', 'dim:l'], LA: ['side', 'dim:r', 'dim:l'], E: ['ends', 'dim:r'], SA: ['all'] },
    calc: function (p, u) {
      var r = p.r, l = p.l, D = 2 * r, LA = PI * D * l, E = 4 * PI * r * r;
      return [item('Diameter', 'D', '2 × r', ['2 × ' + v(r)], D, u, 1),
        item('Overall length', 'Lo', 'l + D', [v(l) + ' + ' + v(D)], l + D, u, 1),
        item('Volume (body + one whole sphere)', 'V', 'π × r² × l + (4 × π × r³) ÷ 3', ['π × ' + v(r) + '² × ' + v(l) + ' + (4 × π × ' + v(r) + '³) ÷ 3'], PI * r * r * l + 4 * PI * r * r * r / 3, u, 3),
        item('Body (straight part) surface', 'LA', 'π × D × l', ['π × ' + v(D) + ' × ' + v(l)], LA, u, 2),
        item('Two round ends (one whole sphere)', 'E', '4 × π × r²', ['4 × π × ' + v(r) + '²'], E, u, 2),
        item('Total surface area', 'SA', 'LA + E', [v(LA) + ' + ' + v(E)], LA + E, u, 2)];
    },
    noNet: 'No flat pattern for the whole capsule: the straight body unrolls flat like a cylinder (π × D by l), but the round ends are parts of a sphere and cannot be laid out flat exactly.',
    notes: ['This is the shape of many tanks for gas under pressure. The two half spheres on the ends make one whole sphere.']
  });

  /* ---- structural shapes: section, convex end pieces, drawing dims ---- */
  function ibeamSec(p) {
    var B = p.bf / 2, w = p.tw / 2, d = p.d, t = p.tf, sec = [[-B, 0], [B, 0], [B, t], [w, t], [w, d - t], [B, d - t], [B, d], [-B, d], [-B, d - t], [-w, d - t], [-w, t], [-B, t]];
    return { sec: sec, pieces: [[0, 1, 2, 3, 10, 11], [10, 3, 4, 9], [8, 9, 4, 5, 6, 7]], webPts: [sec[10], sec[3], sec[4], sec[9]], fl: [[0, 1, 2, 11], [8, 5, 6, 7]] };
  }
  function channelSec(p) {
    var b = p.bf, w = p.tw, d = p.d, t = p.tf;
    return { sec: [[0, 0], [b, 0], [b, t], [w, t], [w, d - t], [b, d - t], [b, d], [0, d], [0, d - t], [0, t]],
      pieces: [[0, 1, 2, 3, 9], [9, 3, 4, 8], [8, 4, 5, 6, 7]], webPts: [[0, t], [w, t], [w, d - t], [0, d - t]], fl: [[0, 1, 2, 9], [8, 5, 6, 7]] };
  }
  function angleSec(p) { var a = p.a, b = p.b, t = p.t; return { sec: [[0, 0], [b, 0], [b, t], [t, t], [t, a], [0, a], [0, t]], pieces: [[0, 1, 2, 3, 6], [6, 3, 4, 5]] }; }
  function barTree(m) {
    /* strip of side faces in order, then the end pieces hung off side face 0 */
    var t = [];
    for (var i = 1; i < m.sides.length; i++) t.push([m.sides[i - 1], m.sides[i]]);
    t.push([m.sides[0], m.capA[0]], [m.sides[0], m.capB[0]]);
    for (var j = 1; j < m.capA.length; j++) t.push([m.capA[j - 1], m.capA[j]], [m.capB[j - 1], m.capB[j]]);
    return t;
  }
  function barNet(m, L, Pm) {
    var u = unfold(m, m.sides[0], barTree(m), function (fi) { return m.sides.indexOf(fi) >= 0 ? 'lat' : 'base'; });
    var s0 = m.sides[0], sl = m.sides[m.sides.length - 1];
    var A0 = u.at(s0, m.ia[0]), B0 = u.at(s0, m.ib[0]), Aend = u.at(sl, m.ia[0]);
    return { panels: u.panels, prims: [dim(A0, B0, LB('L', L)), dim(A0, Aend, LB('P', Pm, 1, true), { offModel: true })] };
  }
  function barLayout(p, u, Aitem, Pitem, Pval, Aval) {
    return [Pitem, Aitem,
      item('Pattern area (sides + 2 ends)', 'PA', 'P × L + 2 × A', [v(Pval) + ' × ' + v(p.L) + ' + 2 × ' + v(Aval)], Pval * p.L + 2 * Aval, u, 2)];
  }
  var BAR_NOTE = 'Rolled steel shapes have rounded inside corners, so a steel table area is a little different from this square-corner area.';
  function flangeBar(id, name, secFn, defs) {
    U({
      id: id, name: name, kind: 'solid',
      params: [P('d', 'Depth', 'd', defs.d[0], defs.d[1]), P('bf', 'Flange width', 'bf', defs.bf[0], defs.bf[1]), P('tf', 'Flange thickness', 'tf', defs.tf[0], defs.tf[1]),
        P('tw', 'Web thickness', 'tw', defs.tw[0], defs.tw[1]), P('L', 'Length', 'L', 600, [300, 1500])],
      validate: function (p) {
        if (2 * p.tf >= p.d) return { k: 'tf', msg: 'The two flanges (2 × tf) must be thinner than the depth d.' };
        if (p.tw >= p.bf) return { k: 'tw', msg: 'Web thickness tw must be less than the flange width bf.' };
        return null;
      },
      mesh: function (p) { var s = secFn(p); return extrudeSec(s.sec, p.L, s.pieces); },
      annot: function (p) {
        var s = secFn(p), d = p.d, t = p.tf, X = p.L / 2, ends = [X, -X], z0 = s.sec[0][0], z1 = s.sec[1][0], zw0 = s.webPts[0][0], zw1 = s.webPts[1][0];
        return {
          dims: [{ cands: [[[-X, 0, z1], [X, 0, z1]], [[-X, 0, z0], [X, 0, z0]], [[-X, d, z1], [X, d, z1]], [[-X, d, z0], [X, d, z0]]], pref: [0, 1], lab: LB('L', p.L) },
            { cands: ends.map(function (x) { return [[x, d, z0], [x, d, z1]]; }), pref: [0, -1], lab: LB('bf', p.bf) },
            { cands: [].concat.apply([], ends.map(function (x) { return [[[x, 0, z1], [x, d, z1]], [[x, 0, z0], [x, d, z0]]]; })), pref: [1, 0], lab: LB('d', d) },
            { cands: [].concat.apply([], ends.map(function (x) { return [[[x, d - t, z1], [x, d, z1]], [[x, d - t, z0], [x, d, z0]]]; })), pref: [1, 0.2], lab: LB('tf', t) },
            { cands: ends.map(function (x) { return [[x, d / 2, zw0], [x, d / 2, zw1]]; }), pref: [0, 1], lab: LB('tw', p.tw) }],
          glows: [{ pts: secOutline(s.sec, X), closed: true, letter: 'P' }, { pts: secOutline(s.webPts, X), closed: true, letter: 'web' },
            { pts: secOutline(s.fl[0].map(function (i) { return s.sec[i]; }), X), closed: true, letter: 'flange' }, { pts: secOutline(s.fl[1].map(function (i) { return s.sec[i]; }), X), closed: true, letter: 'flange' }]
        };
      },
      hl: { hw: ['dim:d', 'dim:tf', 'dim:web'], A: ['ends', 'dim:bf', 'dim:tf', 'dim:tw', 'dim:d'], V: ['all', 'dim:L'], P: ['dim:P', 'dim:bf', 'dim:d', 'dim:tw'], LA: ['side', 'dim:L'], SA: ['all'] },
      calc: function (p, u) {
        var d = p.d, bf = p.bf, tf = p.tf, tw = p.tw, L = p.L, hw = d - 2 * tf, A = 2 * bf * tf + hw * tw, Pm = 4 * bf + 2 * d - 2 * tw;
        return [item('Web height between the flanges', 'hw', 'd − 2 × tf', [v(d) + ' − 2 × ' + v(tf)], hw, u, 1),
          item('Cross-section area (2 flanges + web, square corners)', 'A', '2 × bf × tf + hw × tw', ['2 × ' + v(bf) + ' × ' + v(tf) + ' + ' + v(hw) + ' × ' + v(tw)], A, u, 2),
          item('Volume of steel', 'V', 'A × L', [v(A) + ' × ' + v(L)], A * L, u, 3),
          item('Distance around the cross-section (girth)', 'P', '4 × bf + 2 × d − 2 × tw', ['4 × ' + v(bf) + ' + 2 × ' + v(d) + ' − 2 × ' + v(tw)], Pm, u, 1),
          item('Side area (paint area, ends not included)', 'LA', 'P × L', [v(Pm) + ' × ' + v(L)], Pm * L, u, 2),
          item('Total surface area', 'SA', 'LA + 2 × A', [v(Pm * L) + ' + 2 × ' + v(A)], Pm * L + 2 * A, u, 2)];
      },
      notes: [BAR_NOTE],
      layout: function (p, u) {
        var A = 2 * p.bf * p.tf + (p.d - 2 * p.tf) * p.tw, Pm = 4 * p.bf + 2 * p.d - 2 * p.tw;
        return barLayout(p, u, item('Cross-section area (each end)', 'A', '2 × bf × tf + (d − 2 × tf) × tw', ['2 × ' + v(p.bf) + ' × ' + v(p.tf) + ' + (' + v(p.d) + ' − 2 × ' + v(p.tf) + ') × ' + v(p.tw)], A, u, 2),
          item('Girth (width of the strip of sides)', 'P', '4 × bf + 2 × d − 2 × tw', ['4 × ' + v(p.bf) + ' + 2 × ' + v(p.d) + ' − 2 × ' + v(p.tw)], Pm, u, 1), Pm, A);
      },
      layoutHl: { P: ['panels:lat', 'dim:P'], A: ['panels:base'], PA: ['panels:all'] },
      net: function (p) { var s = secFn(p); return barNet(extrudeSec(s.sec, p.L, s.pieces), p.L, secPerim(s.sec)); }
    });
  }
  flangeBar('i-beam', 'I-beam (W shape)', ibeamSec, { d: [200, [100, 400]], bf: [135, [75, 300]], tf: [10, [6, 20]], tw: [6, [4, 14]] });
  flangeBar('channel', 'Channel (C shape)', channelSec, { d: [150, [75, 300]], bf: [50, [30, 100]], tf: [9, [5, 16]], tw: [6, [4, 12]] });
  U({
    id: 'angle-iron', name: 'Angle iron (L shape)', kind: 'solid',
    params: [P('a', 'Upright leg', 'a', 100, [40, 200]), P('b', 'Flat leg', 'b', 75, function (p) { return [25, p.a]; }), P('t', 'Thickness', 't', 10, [4, 16]),
      P('L', 'Length', 'L', 600, [300, 1500])],
    rndOrder: ['a', 'b', 't', 'L'],
    validate: function (p) { return (p.t >= p.a || p.t >= p.b) ? { k: 't', msg: 'Thickness t must be less than both a and b.' } : null; },
    mesh: function (p) { var s = angleSec(p); return extrudeSec(s.sec, p.L, s.pieces); },
    annot: function (p) {
      var a = p.a, b = p.b, t = p.t, X = p.L / 2, s = angleSec(p), ends = [X, -X];
      return {
        dims: [{ cands: [[[-X, 0, 0], [X, 0, 0]], [[-X, 0, b], [X, 0, b]], [[-X, a, 0], [X, a, 0]]], pref: [0, 1], lab: LB('L', p.L) },
          { cands: ends.map(function (x) { return [[x, 0, 0], [x, a, 0]]; }), pref: [1, 0], lab: LB('a', a) },
          { cands: ends.map(function (x) { return [[x, 0, 0], [x, 0, b]]; }), pref: [0, 1], lab: LB('b', b) },
          { cands: ends.map(function (x) { return [[x, 0, b], [x, t, b]]; }), pref: [1, 0.2], lab: LB('t', t) }],
        glows: [{ pts: secOutline(s.sec, X), closed: true, letter: 'P' }]
      };
    },
    hl: { A: ['ends', 'dim:a', 'dim:b', 'dim:t'], V: ['all', 'dim:L'], P: ['dim:P', 'dim:a', 'dim:b'], LA: ['side', 'dim:L'], SA: ['all'] },
    calc: function (p, u) {
      var a = p.a, b = p.b, t = p.t, L = p.L, A = t * (a + b - t), Pm = 2 * (a + b);
      return [item('Cross-section area (square corners)', 'A', 't × (a + b − t)', [v(t) + ' × (' + v(a) + ' + ' + v(b) + ' − ' + v(t) + ')'], A, u, 2),
        item('Volume of steel', 'V', 'A × L', [v(A) + ' × ' + v(L)], A * L, u, 3),
        item('Distance around the cross-section (girth)', 'P', '2 × (a + b)', ['2 × (' + v(a) + ' + ' + v(b) + ')'], Pm, u, 1),
        item('Side area (paint area, ends not included)', 'LA', 'P × L', [v(Pm) + ' × ' + v(L)], Pm * L, u, 2),
        item('Total surface area', 'SA', 'LA + 2 × A', [v(Pm * L) + ' + 2 × ' + v(A)], Pm * L + 2 * A, u, 2)];
    },
    notes: ['The area counts the corner square once: a × t + b × t would count the t × t corner twice, so take one t away: t × (a + b − t).', BAR_NOTE],
    layout: function (p, u) {
      var A = p.t * (p.a + p.b - p.t), Pm = 2 * (p.a + p.b);
      return barLayout(p, u, item('Cross-section area (each end)', 'A', 't × (a + b − t)', [v(p.t) + ' × (' + v(p.a) + ' + ' + v(p.b) + ' − ' + v(p.t) + ')'], A, u, 2),
        item('Girth (width of the strip of sides)', 'P', '2 × (a + b)', ['2 × (' + v(p.a) + ' + ' + v(p.b) + ')'], Pm, u, 1), Pm, A);
    },
    layoutHl: { P: ['panels:lat', 'dim:P'], A: ['panels:base'], PA: ['panels:all'] },
    net: function (p) { var s = angleSec(p); return barNet(extrudeSec(s.sec, p.L, s.pieces), p.L, secPerim(s.sec)); }
  });
  U({
    id: 'hss-tube', name: 'Rectangular tube (HSS)', kind: 'solid',
    params: [P('B', 'Width', 'B', 152, [50, 300]), P('H', 'Height', 'H', 102, [50, 300]), P('t', 'Wall thickness', 't', 6.4, [3, 13]), P('L', 'Length', 'L', 600, [300, 1500])],
    validate: function (p) { return (2 * p.t >= p.B || 2 * p.t >= p.H) ? { k: 't', msg: 'The two walls (2 × t) must be thinner than both B and H.' } : null; },
    mesh: function (p) {
      var m = new Mesh(), X = p.L / 2, Bx = p.B / 2, Hy = p.H, t = p.t;
      var o2 = [[-Bx, 0], [Bx, 0], [Bx, Hy], [-Bx, Hy]], i2 = [[-Bx + t, t], [Bx - t, t], [Bx - t, Hy - t], [-Bx + t, Hy - t]];
      var oa = [], ob = [], ia = [], ib = [];
      o2.forEach(function (q) { oa.push(m.add([-X, q[1], q[0]])); ob.push(m.add([X, q[1], q[0]])); });
      i2.forEach(function (q) { ia.push(m.add([-X, q[1], q[0]])); ib.push(m.add([X, q[1], q[0]])); });
      for (var i = 0; i < 4; i++) {
        var j = (i + 1) % 4, d = [o2[j][0] - o2[i][0], o2[j][1] - o2[i][1]], e = [i2[j][0] - i2[i][0], i2[j][1] - i2[i][1]];
        m.face([oa[i], oa[j], ob[j], ob[i]], [0, -d[0], d[1]], null, 'outer');
        m.face([ia[i], ia[j], ib[j], ib[i]], [0, e[0], -e[1]], null, 'inner');
        m.face([oa[i], oa[j], ia[j], ia[i]], [-1, 0, 0], null, null);
        m.face([ob[i], ob[j], ib[j], ib[i]], [1, 0, 0], null, null);
      }
      return m;
    },
    annot: function (p) {
      var Bx = p.B / 2, H = p.H, t = p.t, X = p.L / 2, ends = [X, -X];
      var ring = function (x, b, h0, h1) { return [[x, h0, -b], [x, h0, b], [x, h1, b], [x, h1, -b]]; };
      return {
        dims: [{ cands: [[[-X, 0, Bx], [X, 0, Bx]], [[-X, 0, -Bx], [X, 0, -Bx]], [[-X, H, Bx], [X, H, Bx]], [[-X, H, -Bx], [X, H, -Bx]]], pref: [0, 1], lab: LB('L', p.L) },
          { cands: ends.map(function (x) { return [[x, H, -Bx], [x, H, Bx]]; }), pref: [0, -1], lab: LB('B', p.B) },
          { cands: [].concat.apply([], ends.map(function (x) { return [[[x, 0, Bx], [x, H, Bx]], [[x, 0, -Bx], [x, H, -Bx]]]; })), pref: [1, 0], lab: LB('H', H) },
          { cands: [].concat.apply([], ends.map(function (x) { return [[[x, H - t, Bx - t], [x, H - t, Bx]], [[x, H - t, -Bx + t], [x, H - t, -Bx]]]; })), pref: [1, 0.3], lab: LB('t', t) }],
        glows: [{ pts: ring(X, Bx, 0, H), closed: true, letter: 'Po' }, { pts: ring(X, Bx - t, t, H - t), closed: true, letter: 'Pi' }]
      };
    },
    hl: { A: ['ends', 'dim:B', 'dim:H', 'dim:t'], V: ['all', 'dim:L'], Vi: ['inner', 'dim:B', 'dim:H', 'dim:t', 'dim:L'], Po: ['dim:Po', 'dim:B', 'dim:H'],
      Pi: ['dim:Pi', 'dim:t'], LAo: ['side', 'dim:L'], LAi: ['inner', 'dim:L'], SA: ['all'] },
    calc: function (p, u) {
      var B = p.B, H = p.H, t = p.t, L = p.L, A = 2 * t * (B + H - 2 * t), Po = 2 * (B + H), Pi = 2 * (B + H - 4 * t);
      return [item('Cross-section area of the steel (square corners)', 'A', '2 × t × (B + H − 2 × t)', ['2 × ' + v(t) + ' × (' + v(B) + ' + ' + v(H) + ' − 2 × ' + v(t) + ')'], A, u, 2),
        item('Volume of steel', 'V', 'A × L', [v(A) + ' × ' + v(L)], A * L, u, 3),
        item('Inside volume (capacity)', 'Vi', '(B − 2 × t) × (H − 2 × t) × L', ['(' + v(B) + ' − 2 × ' + v(t) + ') × (' + v(H) + ' − 2 × ' + v(t) + ') × ' + v(L)], (B - 2 * t) * (H - 2 * t) * L, u, 3),
        item('Outside girth (distance around)', 'Po', '2 × (B + H)', ['2 × (' + v(B) + ' + ' + v(H) + ')'], Po, u, 1),
        item('Inside girth', 'Pi', '2 × (B + H − 4 × t)', ['2 × (' + v(B) + ' + ' + v(H) + ' − 4 × ' + v(t) + ')'], Pi, u, 1),
        item('Outside surface', 'LAo', 'Po × L', [v(Po) + ' × ' + v(L)], Po * L, u, 2),
        item('Inside surface', 'LAi', 'Pi × L', [v(Pi) + ' × ' + v(L)], Pi * L, u, 2),
        item('Total surface area (outside + inside + 2 ends)', 'SA', 'LAo + LAi + 2 × A', [v(Po * L) + ' + ' + v(Pi * L) + ' + 2 × ' + v(A)], Po * L + Pi * L + 2 * A, u, 2)];
    },
    notes: ['Real HSS has rounded corners (the outside corner radius is often taken as 2 × t), so a steel table area is a little different from this square-corner area.']
  });
  function polyBase(n, s) { var Rc = s / (2 * Math.sin(PI / n)), pts = []; for (var i = 0; i < n; i++) { var a = 2 * PI * (i + 0.5) / n + PI / 2; pts.push([Rc * Math.cos(a), 0, Rc * Math.sin(a)]); } return pts; }
  U({
    id: 'polygon-prism', name: 'Regular polygon prism', kind: 'solid', convex: true,
    params: [P('n', 'Number of sides', 'n', 8, [5, 12], { int: true }), P('s', 'Side', 's', 40, [15, 100]), P('h', 'Height', 'h', 150, [50, 300])],
    rndOrder: ['n', 's', 'h'],
    validate: function (p) { return whole(p.n, 3, 24) ? null : { k: 'n', msg: 'Number of sides n must be a whole number from 3 to 24.' }; },
    mesh: function (p) { return extrude(polyBase(Math.round(p.n), p.s), [0, 1, 0], p.h); },
    annot: function (p) {
      var n = Math.round(p.n), lo = polyBase(n, p.s), hi = lo.map(function (q) { return [q[0], p.h, q[2]]; }), se = [], ve = [], ap = [];
      for (var i = 0; i < n; i++) { var j = (i + 1) % n; se.push([lo[i], lo[j]]); ve.push([lo[i], hi[i]]); ap.push([[0, p.h, 0], lerp(hi[i], hi[j], 0.5)]); }
      return {
        dims: [{ cands: se, pref: [0, 1], lab: LB('s', p.s) }, { cands: ve, pref: [1, 0], lab: LB('h', p.h) }],
        lines: [{ cands: ap, pref: [1, 0.35], lab: LB('a', p.s / (2 * Math.tan(PI / n)), 1, true), at: 0.55 }],
        dots: [[0, p.h, 0]],
        glows: [{ pts: lo, closed: true, letter: 'P' }]
      };
    },
    hl: { P: ['dim:P', 'dim:s'], a: ['dim:a', 'dim:s'], B: ['bottom', 'dim:a', 'dim:s'], V: ['all', 'dim:h'], LA: ['side', 'dim:h'], SA: ['all'] },
    calc: function (p, u) {
      var n = Math.round(p.n), s = p.s, h = p.h, Pm = n * s, f = 180 / n, ap = s / (2 * Math.tan(f * D2R)), B = Pm * ap / 2;
      return [item('Perimeter of the end', 'P', 'n × s', [n + ' × ' + v(s)], Pm, u, 1),
        item('Apothem (centre to the middle of a side)', 'a', 's ÷ (2 × tan(180° ÷ n))', [v(s) + ' ÷ (2 × tan ' + v(f) + '°)'], ap, u, 1),
        item('End area', 'B', '½ × P × a', ['½ × ' + v(Pm) + ' × ' + v(ap)], B, u, 2),
        item('Volume', 'V', 'B × h', [v(B) + ' × ' + v(h)], B * h, u, 3),
        item('Lateral area (n rectangles)', 'LA', 'P × h', [v(Pm) + ' × ' + v(h)], Pm * h, u, 2),
        item('Total surface area', 'SA', 'LA + 2 × B', [v(Pm * h) + ' + 2 × ' + v(B)], Pm * h + 2 * B, u, 2)];
    },
    layout: function (p, u) {
      var n = Math.round(p.n), s = p.s, h = p.h, Pm = n * s, f = 180 / n, ap = s / (2 * Math.tan(f * D2R)), B = Pm * ap / 2;
      return [item('Girth (stretch-out of the n sides)', 'G', 'n × s', [n + ' × ' + v(s)], Pm, u, 1),
        item('Apothem of the end', 'a', 's ÷ (2 × tan(180° ÷ n))', [v(s) + ' ÷ (2 × tan ' + v(f) + '°)'], ap, u, 1),
        item('End area (cut 2)', 'B', '½ × G × a', ['½ × ' + v(Pm) + ' × ' + v(ap)], B, u, 2),
        item('Pattern area (n rectangles + 2 ends)', 'PA', 'G × h + 2 × B', [v(Pm) + ' × ' + v(h) + ' + 2 × ' + v(B)], Pm * h + 2 * B, u, 2)];
    },
    layoutHl: { G: ['panels:lat', 'dim:G'], a: ['dim:a'], B: ['panels:base', 'dim:a'], PA: ['panels:all'] },
    net: function (p) {
      var n = Math.round(p.n), m = extrude(polyBase(n, p.s), [0, 1, 0], p.h), sides = [], t = [];
      for (var i = 0; i < n; i++) sides.push(i + 2);
      for (var k = 1; k < n; k++) t.push([sides[k - 1], sides[k]]);
      var mid = sides[Math.floor(n / 2)];
      t.push([mid, 0], [mid, 1]);
      var uf = unfold(m, sides[0], t, function (fi) { return fi < 2 ? 'base' : 'lat'; });
      var ext = function (fi) { return uf.panels.filter(function (q) { return q.face === fi; })[0].pts; };
      var only = function (A, B) { return A.filter(function (q) { return B.indexOf(q) < 0; }); };
      var s0 = only(ext(sides[0]), ext(sides[1])), sl = only(ext(sides[n - 1]), ext(sides[n - 2])), G = n * p.s, best = null;
      s0.forEach(function (a) { sl.forEach(function (b) { var dd = Math.abs(Math.hypot(b[0] - a[0], b[1] - a[1]) - G); if (!best || dd < best.dd) best = { dd: dd, a: a, b: b }; }); });
      var other = s0[0] === best.a ? s0[1] : s0[0], bt = ext(0), cen = [0, 0];
      bt.forEach(function (q) { cen = [cen[0] + q[0] / n, cen[1] + q[1] / n]; });
      return { panels: uf.panels, prims: [dim(best.a, other, LB('h', p.h)), dim(best.a, best.b, LB('G', G, 1, true), { offModel: true }),
        dotP(cen), ann(cen, lerp(bt[0], bt[1], 0.5), LB('a', p.s / (2 * Math.tan(PI / n)), 1, true), { dash: true }), dim(bt[0], bt[1], LB('s', p.s))] };
    }
  });
  /* Platonic solids from the Cartesian vertex lists (Wikipedia "Platonic solid"), scaled to edge a, turned so one face sits flat on the bottom */
  var PHI = (1 + Math.sqrt(5)) / 2, PLAT = {};
  function signs(base) {
    var out = [];
    base.forEach(function (b) {
      for (var sx = -1; sx <= 1; sx += 2) for (var sy = -1; sy <= 1; sy += 2) for (var sz = -1; sz <= 1; sz += 2) {
        var q = [b[0] * sx, b[1] * sy, b[2] * sz], k = q.map(function (x) { return (x + 0).toFixed(9); }).join(',');
        if (!out.some(function (o) { return o.k === k; })) out.push({ k: k, q: q });
      }
    });
    return out.map(function (o) { return o.q; });
  }
  PLAT.tetrahedron = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]];
  PLAT.octahedron = signs([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
  PLAT.icosahedron = signs([[0, 1, PHI], [1, PHI, 0], [PHI, 0, 1]]);
  PLAT.dodecahedron = signs([[1, 1, 1], [0, 1 / PHI, PHI], [1 / PHI, PHI, 0], [PHI, 0, 1 / PHI]]);
  function hullFaces(V) {
    var faces = [], seen = {}, eps = 1e-7;
    for (var i = 0; i < V.length; i++) for (var j = i + 1; j < V.length; j++) for (var k = j + 1; k < V.length; k++) {
      var n = cross(sub(V[j], V[i]), sub(V[k], V[i]));
      if (len(n) < 1e-9) continue;
      n = nrm(n);
      var d0 = dot(n, V[i]), pos = false, neg = false, on = [];
      V.forEach(function (q, qi) { var s = dot(n, q) - d0; if (s > eps) pos = true; else if (s < -eps) neg = true; else on.push(qi); });
      if (pos && neg) continue;
      if (pos) n = mul(n, -1);
      var key = on.slice().sort(function (a, b) { return a - b; }).join(',');
      if (seen[key]) continue;
      seen[key] = 1;
      var c = [0, 0, 0]; on.forEach(function (qi) { c = add(c, mul(V[qi], 1 / on.length)); });
      var u = nrm(sub(V[on[0]], c)), w = cross(n, u);
      on.sort(function (a, b) { var pa = sub(V[a], c), pb = sub(V[b], c); return Math.atan2(dot(pa, w), dot(pa, u)) - Math.atan2(dot(pb, w), dot(pb, u)); });
      faces.push({ v: on, n: n });
    }
    return faces;
  }
  var platCache = {};
  function platMesh(kind, a) {
    var key = kind + '|' + a;
    if (platCache[key]) return platCache[key];
    var V0 = PLAT[kind], e = Infinity;
    for (var i = 0; i < V0.length; i++) for (var j = i + 1; j < V0.length; j++) e = Math.min(e, len(sub(V0[i], V0[j])));
    var V = V0.map(function (q) { return mul(q, a / e); }), faces = hullFaces(V);
    /* turn the face pointing most downward to face straight down (Rodrigues rotation) */
    var fd = faces.reduce(function (b, f) { return f.n[1] < b.n[1] ? f : b; }, faces[0]), t = [0, -1, 0], ax = cross(fd.n, t), s = len(ax), c = dot(fd.n, t);
    var rot = function (q) {
      if (s < 1e-12) return q;
      var k = mul(ax, 1 / s);
      return add(add(mul(q, c), mul(cross(k, q), s)), mul(k, dot(k, q) * (1 - c)));
    };
    V = V.map(rot);
    var y0 = Math.min.apply(null, V.map(function (q) { return q[1]; }));
    V = V.map(function (q) { return [q[0], q[1] - y0, q[2]]; });
    var m = new Mesh();
    V.forEach(function (q) { m.add(q); });
    faces.forEach(function (f) { m.face(f.v.slice(), rot(f.n), null, 'side'); });
    m.bottom = 0;
    m.f.forEach(function (f, fi) { var nn = nrm(newell(f.v.map(function (vi) { return m.v[vi]; }))); if (nn[1] < -0.999) m.bottom = fi; });
    var keys = Object.keys(platCache);
    if (keys.length > 40) delete platCache[keys[0]];
    platCache[key] = m;
    return m;
  }
  function platonic(id, name, F, faceName, def, rnd, Af, AfF, AfS, Vv, VF, VS) {
    U({
      id: id, name: name, kind: 'solid', convex: true, params: [P('a', 'Edge', 'a', def, rnd)],
      mesh: function (p) { return platMesh(id, p.a); },
      annot: function (p) {
        var m = platMesh(id, p.a), es = [], seen = {};
        m.f.forEach(function (f) { f.v.forEach(function (vi, j) { var vj = f.v[(j + 1) % f.v.length], k = Math.min(vi, vj) + '_' + Math.max(vi, vj); if (!seen[k]) { seen[k] = 1; es.push([m.v[vi], m.v[vj]]); } }); });
        return { dims: [{ cands: es, pref: [0, 1], lab: LB('a', p.a) }] };
      },
      hl: { Af: ['bottom', 'dim:a'], SA: ['all', 'dim:a'], V: ['all', 'dim:a'] },
      calc: function (p, u) {
        var a = p.a, af = Af(a);
        return [item('Area of one face (' + faceName + ')', 'Af', AfF, [AfS(a)], af, u, 2),
          item('Surface area (' + F + ' faces)', 'SA', F + ' × Af', [F + ' × ' + v(af)], F * af, u, 2),
          item('Volume', 'V', VF, [VS(a)], Vv(a), u, 3)];
      },
      notes: ['A Platonic solid has faces that are all the same regular shape, with the same number meeting at every corner.'],
      layout: function (p, u) {
        var a = p.a, af = Af(a);
        return [item('Area of one face (' + faceName + ')', 'Af', AfF, [AfS(a)], af, u, 2),
          item('Pattern area (all ' + F + ' faces)', 'PA', F + ' × Af', [F + ' × ' + v(af)], F * af, u, 2)];
      },
      layoutHl: { Af: ['panels:base', 'dim:a'], PA: ['panels:all'] },
      net: function (p) {
        var m = platMesh(id, p.a), uf = unfold(m, m.bottom, null), bp = uf.panels.filter(function (q) { return q.face === m.bottom; })[0].pts;
        return { panels: uf.panels, prims: [dim(bp[0], bp[1], LB('a', p.a))] };
      }
    });
  }
  platonic('tetrahedron', 'Tetrahedron (4 faces)', 4, 'equilateral triangle', 80, [20, 120],
    function (a) { return SQ3 / 4 * a * a; }, '(√3 ÷ 4) × a²', function (a) { return '(√3 ÷ 4) × ' + v(a) + '²'; },
    function (a) { return a * a * a / (6 * SQ2); }, 'a³ ÷ (6 × √2)', function (a) { return v(a) + '³ ÷ (6 × √2)'; });
  platonic('octahedron', 'Octahedron (8 faces)', 8, 'equilateral triangle', 70, [20, 120],
    function (a) { return SQ3 / 4 * a * a; }, '(√3 ÷ 4) × a²', function (a) { return '(√3 ÷ 4) × ' + v(a) + '²'; },
    function (a) { return SQ2 / 3 * a * a * a; }, '(√2 ÷ 3) × a³', function (a) { return '(√2 ÷ 3) × ' + v(a) + '³'; });
  platonic('dodecahedron', 'Dodecahedron (12 faces)', 12, 'regular pentagon', 40, [10, 60],
    function (a) { return Math.sqrt(25 + 10 * Math.sqrt(5)) / 4 * a * a; }, '¼ × √(25 + 10 × √5) × a²', function (a) { return '¼ × √(25 + 10 × √5) × ' + v(a) + '²'; },
    function (a) { return (15 + 7 * Math.sqrt(5)) / 4 * a * a * a; }, '¼ × (15 + 7 × √5) × a³', function (a) { return '¼ × (15 + 7 × √5) × ' + v(a) + '³'; });
  platonic('icosahedron', 'Icosahedron (20 faces)', 20, 'equilateral triangle', 50, [15, 80],
    function (a) { return SQ3 / 4 * a * a; }, '(√3 ÷ 4) × a²', function (a) { return '(√3 ÷ 4) × ' + v(a) + '²'; },
    function (a) { return 5 / 12 * (3 + Math.sqrt(5)) * a * a * a; }, '(5 ÷ 12) × (3 + √5) × a³', function (a) { return '(5 ÷ 12) × (3 + √5) × ' + v(a) + '³'; });
  /* ==== UNUSUAL SHAPES (end) ==== */

  /* ==== ADDED 2026-10 (begin): angles everywhere, full formulas, 3D equivalents ====
   * Everything here is opt-in, so callers that do not ask for it get byte-identical output:
   *   render / net opts.allAngles  angle arcs and degree labels on every shape, 3D view and net (derived angles show "?" with
   *                                derived 'ask' and disappear with derived 'hide', like any derived size)
   *   render opts.moreDims         a few extra derived sizes on the drawing (diagonals)
   *   calc(id, p, units, {full: true}), calcFull(...)   every size that can be worked out, each with formula, substitution and group
   *   list({all: true}), info(id).added, solidsOf(flatId, flatParams), flatOf(solidId), solve(id, known, units, ao),
   *   terms({all: true}), findTerms(text, {all: true})
   * Capacity factors: 1 in³ = 16.387064 cm³, 1 ft³ = 28.316846592 L, 1 US gal = 231 in³ = 3.785411784 L, 1 imperial gal = 4.54609 L
   * (NIST SP 811, NIST SP 1038 and the Weights and Measures Act, the same factors as the Unit Conversions page).
   */
  function iu(name, sym, formula, substs, value, unitText, key, group) {
    var it = item(name, sym, formula, substs, value, '', 0, key), last = it.lines.length - 1;
    if (unitText) it.lines[last] += ' ' + unitText;
    it.unit = unitText || '';
    if (group) it.group = group;
    return it;
  }
  function gp(g, it) { it.group = g; return it; }
  function H(parts, it) { it._hl = parts; return it; }
  function lenI(name, sym, formula, substs, value, u, key) { return item(name, sym, formula, substs, value, u, 1, key); }
  function areaI(name, sym, formula, substs, value, u, key) { return item(name, sym, formula, substs, value, u, 2, key); }
  var CAPL = { mm: ['V ÷ 1000000', 1e-6, '÷ 1000000'], cm: ['V ÷ 1000', 1e-3, '÷ 1000'], m: ['V × 1000', 1000, '× 1000'], in: ['V × 0.016387064', 0.016387064, '× 0.016387064'], ft: ['V × 28.316846592', 28.316846592, '× 28.316846592'] };
  /* capacity of the hollow inside (pipe, tube), lit on the inner surface */
  function capInside(V, u) { return capItems(V, u, 'Vi').map(function (it) { it._hl = ['inner']; it.name = it.name.replace('Capacity', 'Capacity (inside)'); return it; }); }
  function capItems(V, u, vs) {
    vs = vs || 'V';
    var c = CAPL[u] || CAPL.cm, L = V * c[1], out = [], VV = v(V);
    var rep = function (s) { return s.replace(/^V/, vs); };
    out.push(H(['all'], iu('Capacity in litres', 'Cap', rep(c[0]), [VV + ' ' + c[2]], L, 'L', 'capL', 'Capacity')));
    var us = u === 'in' ? [vs + ' ÷ 231', VV + ' ÷ 231', V / 231] : u === 'ft' ? [vs + ' × 1728 ÷ 231', VV + ' × 1728 ÷ 231', V * 1728 / 231]
      : [rep(c[0]) + ' ÷ 3.785411784', VV + ' ' + c[2] + ' ÷ 3.785411784', L / 3.785411784];
    out.push(H(['all'], iu('Capacity in US gallons (1 US gal = 3.785411784 L = 231 in³)', 'Cap', us[0], [us[1]], us[2], 'US gal', 'capUS', 'Capacity')));
    out.push(H(['all'], iu('Capacity in imperial gallons (1 imperial gal = 4.54609 L)', 'Cap', rep(c[0]) + ' ÷ 4.54609', [VV + ' ' + c[2] + ' ÷ 4.54609'], L / 4.54609, 'imp gal', 'capImp', 'Capacity')));
    return out;
  }
  function cen(name, sym, formula, substs, value, u, key) { return gp('Centroid', lenI(name, sym, formula, substs, value, u, key)); }
  function pitchI(rise, run, rs, rr) {
    return H(['ang:A'], iu('Slope as rise per 12 of run (pitch)', 'pitch', '12 × ' + rs + ' ÷ ' + rr, ['12 × ' + v(rise) + ' ÷ ' + v(run)], 12 * rise / run, 'in 12', 'pitch', 'Slope'));
  }
  function groupOf(it) {
    if (it.group) return it.group;
    var u = it.unit || '';
    if (u === '°') return 'Angles';
    if (/³$/.test(u)) return 'Volume';
    if (/²$/.test(u)) return 'Areas';
    if (u === 'L' || /gal$/.test(u)) return 'Capacity';
    return 'Lengths';
  }
  function tan1(sym1, sym2, a, b) { return { f: 'tan⁻¹(' + sym1 + ' ÷ ' + sym2 + ')', s: 'tan⁻¹(' + v(a) + ' ÷ ' + v(b) + ')', val: Math.atan2(a, b) / D2R }; }
  function angT(name, sym, t, key, parts) { return H(parts || [], angItem(name, sym, t.f, [t.s], t.val, key)); }

  /* ---------- full-calc extras for the shapes that existed before (appended after the original items) ---------- */
  var XC = {};
  /* the drawing sizes of a triangle entered by angle (the shape's own angIn.toSides) */
  function sidesOf(id, p, ao) { return aoOf(ao).input === 'angle' ? DEF[id].angIn.toSides(p) : p; }
  XC.square = function (p, u) {
    var s = p.s, d = SQ2 * s;
    return [H(['dim:corner'], angItem('Each corner angle (the 4 corners add to 360°)', '∠A', '360 ÷ 4', ['360 ÷ 4'], 90, 'angA')),
      angT('Angle between the diagonal and a side', '∠d', tan1('s', 's', s, s), 'angD', ['dim:d', 'dim:s']),
      H(['dim:s'], lenI('Radius of the circle that fits inside', 'ri', 's ÷ 2', [v(s) + ' ÷ 2'], s / 2, u)),
      H(['dim:d'], lenI('Radius of the circle through the corners', 'R', 'd ÷ 2', [v(d) + ' ÷ 2'], d / 2, u)),
      H(['fill', 'dim:s'], cen('Centroid (balance point) from any side', 'x̄', 's ÷ 2', [v(s) + ' ÷ 2'], s / 2, u, 'cx'))];
  };
  XC.rectangle = function (p, u) {
    var l = p.l, w = p.w, d = Math.hypot(l, w), t = tan1('w', 'l', w, l);
    return [H(['dim:corner'], angItem('Each corner angle (the 4 corners add to 360°)', '∠A', '360 ÷ 4', ['360 ÷ 4'], 90, 'angA')),
      angT('Angle δ between the diagonal and the length', '∠δ', t, 'angD', ['ang:δ', 'dim:l', 'dim:w']),
      H(['ang:δ', 'dim:l', 'dim:w'], angItem('Angle between the two diagonals (the one facing the width)', '∠X', '2 × ∠δ', ['2 × ' + v(t.val)], 2 * t.val, 'angX')),
      H(['dim:l', 'dim:w'], lenI('Radius of the circle through the corners', 'R', 'd ÷ 2', [v(d) + ' ÷ 2'], d / 2, u)),
      H(['fill', 'dim:w'], cen('Centroid from the long side', 'ȳ', 'w ÷ 2', [v(w) + ' ÷ 2'], w / 2, u, 'cy')),
      H(['fill', 'dim:l'], cen('Centroid from the short side', 'x̄', 'l ÷ 2', [v(l) + ' ÷ 2'], l / 2, u, 'cx'))];
  };
  XC['right-triangle'] = function (p, u, ao) {
    var q = sidesOf('right-triangle', p, ao), b = q.b, h = q.h, c = Math.hypot(b, h);
    return [angT('Angle A (TOA: tan A = opposite ÷ adjacent)', '∠A', tan1('h', 'b', h, b), 'angA', ['ang:A', 'dim:h', 'dim:b']),
      H(['ang:C'], noKeys(angItem('Angle C (the square corner)', '∠C', '90', ['90'], 90, 'angC'))),
      H(['dim:b', 'dim:h', 'dim:c'], lenI('Height to the hypotenuse (from the square corner)', 'hc', '(b × h) ÷ c', ['(' + v(b) + ' × ' + v(h) + ') ÷ ' + v(c)], b * h / c, u)),
      H(['dim:c'], lenI('Median to the hypotenuse (square corner to the middle of c)', 'mc', 'c ÷ 2', [v(c) + ' ÷ 2'], c / 2, u)),
      H(['dim:b', 'dim:h', 'dim:c'], lenI('Radius of the circle that fits inside', 'ri', '(b + h − c) ÷ 2', ['(' + v(b) + ' + ' + v(h) + ' − ' + v(c) + ') ÷ 2'], (b + h - c) / 2, u)),
      H(['dim:c'], lenI('Radius of the circle through the corners', 'R', 'c ÷ 2', [v(c) + ' ÷ 2'], c / 2, u)),
      pitchI(h, b, 'h', 'b'),
      H(['dim:h', 'dim:b'], iu('Slope as a percent (grade)', 'grade', '100 × h ÷ b', ['100 × ' + v(h) + ' ÷ ' + v(b)], 100 * h / b, '%', 'grade', 'Slope')),
      H(['fill', 'dim:h'], cen('Centroid from the base b', 'ȳ', 'h ÷ 3', [v(h) + ' ÷ 3'], h / 3, u, 'cy')),
      H(['fill', 'dim:b'], cen('Centroid from the side h', 'x̄', 'b ÷ 3', [v(b) + ' ÷ 3'], b / 3, u, 'cx'))];
  };
  XC['equilateral-triangle'] = function (p, u) {
    var s = p.s, h = s * SQ3 / 2;
    return [H(['ang:B'], noKeys(angItem('Angle B (all three angles are equal)', '∠B', '∠A', ['60'], 60, 'angB'))),
      H(['ang:C'], noKeys(angItem('Angle C (all three angles are equal)', '∠C', '∠A', ['60'], 60, 'angC'))),
      H(['dim:s'], lenI('Radius of the circle that fits inside', 'ri', 's ÷ (2 × √3)', [v(s) + ' ÷ (2 × √3)'], s / (2 * SQ3), u)),
      H(['dim:s'], lenI('Radius of the circle through the corners', 'R', 's ÷ √3', [v(s) + ' ÷ √3'], s / SQ3, u)),
      H(['fill', 'dim:h'], cen('Centroid from any side', 'ȳ', 'h ÷ 3', [v(h) + ' ÷ 3'], h / 3, u, 'cy'))];
  };
  XC['isosceles-triangle'] = function (p, u, ao) {
    var q = sidesOf('isosceles-triangle', p, ao), b = q.b, h = q.h, a = Math.hypot(b / 2, h);
    return [angT('Base angle A (TOA: tan A = opposite ÷ adjacent)', '∠A', { f: 'tan⁻¹(h ÷ (b ÷ 2))', s: 'tan⁻¹(' + v(h) + ' ÷ ' + v(b / 2) + ')', val: Math.atan2(h, b / 2) / D2R }, 'angA', ['ang:A', 'dim:h', 'dim:b']),
      H(['dim:b', 'dim:h', 'dim:a'], lenI('Height to an equal side', 'ha', '(b × h) ÷ a', ['(' + v(b) + ' × ' + v(h) + ') ÷ ' + v(a)], b * h / a, u)),
      H(['dim:b', 'dim:h', 'dim:a'], lenI('Radius of the circle that fits inside', 'ri', '(b × h) ÷ (b + 2 × a)', ['(' + v(b) + ' × ' + v(h) + ') ÷ (' + v(b) + ' + 2 × ' + v(a) + ')'], b * h / (b + 2 * a), u)),
      H(['dim:a', 'dim:h'], lenI('Radius of the circle through the corners', 'R', 'a² ÷ (2 × h)', [v(a) + '² ÷ (2 × ' + v(h) + ')'], a * a / (2 * h), u)),
      H(['ang:A', 'dim:h', 'dim:b'], iu('Roof pitch: rise per 12 of run', 'pitch', '12 × h ÷ (b ÷ 2)', ['12 × ' + v(h) + ' ÷ ' + v(b / 2)], 24 * h / b, 'in 12', 'pitch', 'Slope')),
      H(['fill', 'dim:h'], cen('Centroid from the base b', 'ȳ', 'h ÷ 3', [v(h) + ' ÷ 3'], h / 3, u, 'cy'))];
  };
  XC['scalene-triangle'] = function (p, u, ao) {
    var q = sidesOf('scalene-triangle', p, ao), a = q.a, b = q.b, c = q.c;
    var s = (a + b + c) / 2, Ar = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c))), A = cosRule(a, b, c), R = a / (2 * Math.sin(A * D2R));
    var med = function (x, y, z) { return 0.5 * Math.sqrt(Math.max(0, 2 * y * y + 2 * z * z - x * x)); };
    var medI = function (x, y, z, X, Y, Z, k) {
      return H(['dim:' + X, 'dim:' + Y, 'dim:' + Z], lenI('Median to side ' + X + ' (corner ' + X.toUpperCase() + ' to the middle of ' + X + ')', 'm' + X, '½ × √(2 × ' + Y + '² + 2 × ' + Z + '² − ' + X + '²)',
        ['½ × √(2 × ' + v(y) + '² + 2 × ' + v(z) + '² − ' + v(x) + '²)'], med(x, y, z), u, k));
    };
    return [H(['dim:a', 'dim:b', 'dim:c'], lenI('Half the perimeter', 's', '(a + b + c) ÷ 2', ['(' + v(a) + ' + ' + v(b) + ' + ' + v(c) + ') ÷ 2'], s, u)),
      H(['fill', 'dim:b'], lenI('Height to side b', 'hb', '2 × A ÷ b', ['2 × ' + v(Ar) + ' ÷ ' + v(b)], 2 * Ar / b, u)),
      H(['fill', 'dim:c'], lenI('Height to side c', 'hc', '2 × A ÷ c', ['2 × ' + v(Ar) + ' ÷ ' + v(c)], 2 * Ar / c, u)),
      medI(a, b, c, 'a', 'b', 'c', 'ma'), medI(b, a, c, 'b', 'a', 'c', 'mb'), medI(c, a, b, 'c', 'a', 'b', 'mc'),
      H(['dim:a', 'ang:A'], lenI('Law of sines (a ÷ sin A = b ÷ sin B = c ÷ sin C)', '2R', 'a ÷ sin A', [v(a) + ' ÷ sin ' + v(A) + '°'], 2 * R, u, 'sines')),
      H(['dim:a', 'ang:A'], lenI('Radius of the circle through the corners', 'R', 'a ÷ (2 × sin A)', [v(a) + ' ÷ (2 × sin ' + v(A) + '°)'], R, u)),
      H(['fill'], lenI('Radius of the circle that fits inside', 'ri', 'A ÷ s', [v(Ar) + ' ÷ ' + v(s)], Ar / s, u)),
      H(['fill', 'dim:h'], cen('Centroid from side a', 'ȳ', 'h ÷ 3', [v(2 * Ar / a) + ' ÷ 3'], 2 * Ar / a / 3, u, 'cy'))];
  };
  XC.parallelogram = function (p, u) {
    var b = p.b, h = p.h, s = p.s, x = Math.sqrt(Math.max(0, s * s - h * h)), al = Math.asin(Math.min(1, h / s)) / D2R;
    return [H(['dim:s', 'dim:h'], lenI('Sideways offset of the slanted side', 'x', '√(s² − h²)', ['√(' + v(s) + '² − ' + v(h) + '²)'], x, u)),
      H(['ang:A', 'dim:h', 'dim:s'], angItem('Angle A (between the base and the slanted side)', '∠A', 'sin⁻¹(h ÷ s)', ['sin⁻¹(' + v(h) + ' ÷ ' + v(s) + ')'], al, 'angA')),
      H(['ang:B', 'ang:A'], angItem('Angle B (next to A: the two add to 180°)', '∠B', '180 − ∠A', ['180 − ' + v(al)], 180 - al, 'angB')),
      H(['ang:C'], noKeys(angItem('Angle C (opposite A, equal to A)', '∠C', '∠A', [v(al)], al, 'angC'))),
      H(['ang:D'], noKeys(angItem('Angle D (opposite B, equal to B)', '∠D', '∠B', [v(180 - al)], 180 - al, 'angD'))),
      H(['dim:b', 'dim:h'], lenI('Long diagonal', 'd₁', '√((b + x)² + h²)', ['√((' + v(b) + ' + ' + v(x) + ')² + ' + v(h) + '²)'], Math.hypot(b + x, h), u, 'd1')),
      H(['dim:b', 'dim:h'], lenI('Short diagonal', 'd₂', '√((b − x)² + h²)', ['√((' + v(b) + ' − ' + v(x) + ')² + ' + v(h) + '²)'], Math.hypot(b - x, h), u, 'd2')),
      H(['dim:b', 'dim:h', 'dim:s'], lenI('Height to the slanted side', 'hs', '(b × h) ÷ s', ['(' + v(b) + ' × ' + v(h) + ') ÷ ' + v(s)], b * h / s, u)),
      H(['fill', 'dim:h'], cen('Centroid from the base', 'ȳ', 'h ÷ 2', [v(h) + ' ÷ 2'], h / 2, u, 'cy'))];
  };
  XC.rhombus = function (p, u) {
    var d1 = p.d1, d2 = p.d2, s = Math.hypot(d1 / 2, d2 / 2), A = 2 * Math.atan2(d2, d1) / D2R, ht = d1 * d2 / 2 / s;
    return [H(['ang:A', 'dim:d₁', 'dim:d₂'], angItem('Angle A (at the ends of d₁)', '∠A', '2 × tan⁻¹(d₂ ÷ d₁)', ['2 × tan⁻¹(' + v(d2) + ' ÷ ' + v(d1) + ')'], A, 'angA')),
      H(['ang:B', 'ang:A'], angItem('Angle B (at the ends of d₂: A and B add to 180°)', '∠B', '180 − ∠A', ['180 − ' + v(A)], 180 - A, 'angB')),
      H(['ang:C'], noKeys(angItem('Angle C (opposite A)', '∠C', '∠A', [v(A)], A, 'angC'))),
      H(['ang:D'], noKeys(angItem('Angle D (opposite B)', '∠D', '∠B', [v(180 - A)], 180 - A, 'angD'))),
      H(['fill', 'dim:s'], lenI('Height (between two opposite sides)', 'ht', 'A ÷ s', [v(d1 * d2 / 2) + ' ÷ ' + v(s)], ht, u)),
      H(['fill', 'dim:s'], lenI('Radius of the circle that fits inside', 'ri', 'ht ÷ 2', [v(ht) + ' ÷ 2'], ht / 2, u))];
  };
  XC.trapezoid = function (p, u) {
    var a = p.a, b = p.b, h = p.h, o = (b - a) / 2, al = Math.atan2(h, o) / D2R, m = (a + b) / 2;
    return [H(['dim:a', 'dim:b'], lenI('Overhang at each end', 'o', '(b − a) ÷ 2', ['(' + v(b) + ' − ' + v(a) + ') ÷ 2'], o, u)),
      angT('Base angle A (bottom corners)', '∠A', tan1('h', 'o', h, o), 'angA', ['ang:A', 'dim:h']),
      H(['ang:B'], noKeys(angItem('Angle B (the other bottom corner, equal to A)', '∠B', '∠A', [v(al)], al, 'angB'))),
      H(['ang:C', 'ang:B'], angItem('Top angle C (B and C add to 180°)', '∠C', '180 − ∠B', ['180 − ' + v(al)], 180 - al, 'angC')),
      H(['ang:D'], noKeys(angItem('Top angle D (equal to C)', '∠D', '∠C', [v(180 - al)], 180 - al, 'angD'))),
      H(['dim:a', 'dim:b', 'dim:h'], lenI('Diagonal', 'd', '√(((a + b) ÷ 2)² + h²)', ['√(' + v(m) + '² + ' + v(h) + '²)'], Math.hypot(m, h), u)),
      H(['dim:a', 'dim:b'], lenI('Midline (average of the two parallel sides)', 'm', '(a + b) ÷ 2', ['(' + v(a) + ' + ' + v(b) + ') ÷ 2'], m, u)),
      H(['fill', 'dim:h'], cen('Centroid from the bottom b', 'ȳ', '(h × (b + 2 × a)) ÷ (3 × (a + b))', ['(' + v(h) + ' × (' + v(b) + ' + 2 × ' + v(a) + ')) ÷ (3 × (' + v(a) + ' + ' + v(b) + '))'], h * (b + 2 * a) / (3 * (a + b)), u, 'cy'))];
  };
  XC.kite = function (p, u) {
    var d1 = p.d1, d2 = p.d2, q = p.p, r = d1 - q, T = 2 * Math.atan2(d2 / 2, q) / D2R, B = 2 * Math.atan2(d2 / 2, r) / D2R, S2 = (360 - T - B) / 2;
    return [H(['dim:d₁', 'dim:p'], lenI('Lower part of d₁', 'q', 'd₁ − p', [v(d1) + ' − ' + v(q)], r, u)),
      H(['ang:A', 'dim:d₂', 'dim:p'], angItem('Top angle A (between the two short sides)', '∠A', '2 × tan⁻¹((d₂ ÷ 2) ÷ p)', ['2 × tan⁻¹(' + v(d2 / 2) + ' ÷ ' + v(q) + ')'], T, 'angA')),
      H(['ang:C', 'dim:d₂'], angItem('Bottom angle C (between the two long sides)', '∠C', '2 × tan⁻¹((d₂ ÷ 2) ÷ q)', ['2 × tan⁻¹(' + v(d2 / 2) + ' ÷ ' + v(r) + ')'], B, 'angC')),
      H(['ang:B', 'ang:D', 'ang:A', 'ang:C'], angItem('Side angle B (the 4 angles add to 360°, B = D)', '∠B', '(360 − ∠A − ∠C) ÷ 2', ['(360 − ' + v(T) + ' − ' + v(B) + ') ÷ 2'], S2, 'angB')),
      H(['ang:D'], noKeys(angItem('Side angle D (equal to B)', '∠D', '∠B', [v(S2)], S2, 'angD')))];
  };
  XC.circle = function (p, u) {
    var r = p.r, D = 2 * r;
    return [H(['outline', 'dim:D'], lenI('Arc length for each 1° of the circle', 'L1', '(π × D) ÷ 360', ['(π × ' + v(D) + ') ÷ 360'], PI * D / 360, u)),
      H(['dim:D'], lenI('Side of the largest square that fits inside', 'sq', 'D ÷ √2', [v(D) + ' ÷ √2'], D / SQ2, u)),
      H(['fill', 'dim:r'], cen('Centroid: the centre, from the edge', 'x̄', 'r', [v(r)], r, u, 'cx'))];
  };
  XC.semicircle = function (p, u) {
    var r = p.r, D = 2 * r;
    return [H(['outline', 'dim:D'], lenI('Curved edge (arc)', 'L', '(π × D) ÷ 2', ['(π × ' + v(D) + ') ÷ 2'], PI * r, u)),
      H(['fill', 'dim:r'], cen('Centroid from the straight edge', 'ȳ', '(4 × r) ÷ (3 × π)', ['(4 × ' + v(r) + ') ÷ (3 × π)'], 4 * r / (3 * PI), u, 'cy'))];
  };
  XC['quarter-circle'] = function (p, u) {
    var r = p.r, D = 2 * r;
    return [H(['outline', 'dim:r'], lenI('Curved edge (arc)', 'L', '(π × D) ÷ 4', ['(π × ' + v(D) + ') ÷ 4'], PI * D / 4, u)),
      H(['dim:r'], lenI('Chord (straight line between the ends of the arc)', 'c', 'r × √2', [v(r) + ' × √2'], r * SQ2, u)),
      H(['dim:r'], lenI('Sagitta (rise of the arc above the chord)', 'sg', 'r − r × cos 45°', [v(r) + ' − ' + v(r) + ' × cos 45°'], r - r * Math.cos(PI / 4), u)),
      H([], noKeys(angItem('Corner angle', '∠A', '90', ['90'], 90, 'angA'))),
      H(['fill', 'dim:r'], cen('Centroid from each straight edge', 'x̄', '(4 × r) ÷ (3 × π)', ['(4 × ' + v(r) + ') ÷ (3 × π)'], 4 * r / (3 * PI), u, 'cx'))];
  };
  XC.sector = function (p, u) {
    var r = p.r, t = p.t, A = t / 360 * PI * r * r, c = 2 * r * Math.sin(t / 2 * D2R);
    return [H(['dim:r', 'ang:θ'], lenI('Chord (straight line between the ends of the arc)', 'c', '2 × r × sin(θ ÷ 2)', ['2 × ' + v(r) + ' × sin ' + v(t / 2) + '°'], c, u)),
      H(['dim:r', 'ang:θ'], lenI('Sagitta (rise of the arc above the chord)', 'sg', 'r − r × cos(θ ÷ 2)', [v(r) + ' − ' + v(r) + ' × cos ' + v(t / 2) + '°'], r - r * Math.cos(t / 2 * D2R), u)),
      H(['fill', 'dim:r', 'ang:θ'], areaI('Segment area (between the chord and the arc)', 'As', 'A − ½ × r² × sin θ', [v(A) + ' − ½ × ' + v(r) + '² × sin ' + v(t) + '°'], A - 0.5 * r * r * Math.sin(t * D2R), u)),
      H(['fill', 'dim:r', 'ang:θ'], cen('Centroid from the point of the sector', 'r̄', '(240 × r × sin(θ ÷ 2)) ÷ (π × θ)', ['(240 × ' + v(r) + ' × sin ' + v(t / 2) + '°) ÷ (π × ' + v(t) + ')'], 240 * r * Math.sin(t / 2 * D2R) / (PI * t), u, 'cr'))];
  };
  XC.annulus = function (p, u) {
    var R = p.R, r = p.r;
    return [H(['dim:R', 'dim:r'], lenI('Mean diameter (centre of the ring)', 'Dm', 'R + r', [v(R) + ' + ' + v(r)], R + r, u)),
      H(['dim:R', 'dim:r'], lenI('Mean circumference (centre line of the ring)', 'Cm', 'π × Dm', ['π × ' + v(R + r)], PI * (R + r), u)),
      H(['fill', 'dim:R', 'dim:r'], areaI('Area check: mean circumference × ring width', 'A', 'π × Dm × t', ['π × ' + v(R + r) + ' × ' + v(R - r)], PI * (R + r) * (R - r), u, 'At'))];
  };
  XC.ellipse = function (p, u) {
    var a = p.a, b = p.b, big = Math.max(a, b), sm = Math.min(a, b), f = Math.sqrt(big * big - sm * sm), F = a >= b ? ['a', 'b'] : ['b', 'a'];
    return [H(['dim:a'], lenI('Overall width', 'W', '2 × a', ['2 × ' + v(a)], 2 * a, u)),
      H(['dim:b'], lenI('Overall height', 'Ht', '2 × b', ['2 × ' + v(b)], 2 * b, u)),
      H(['dim:a', 'dim:b'], lenI('Centre to each focus (pin for the string method)', 'f', '√(' + F[0] + '² − ' + F[1] + '²)', ['√(' + v(big) + '² − ' + v(sm) + '²)'], f, u)),
      H(['dim:a', 'dim:b'], lenI('String length between the two pins (string method)', 'Ls', '2 × ' + F[0], ['2 × ' + v(big)], 2 * big, u)),
      H(['dim:a', 'dim:b'], iu('Eccentricity (0 = circle)', 'e', 'f ÷ ' + F[0], [v(f) + ' ÷ ' + v(big)], f / big, '', 'ecc', 'Lengths'))];
  };
  function regX(n, s, u, haveA) {
    var ap = s / (2 * Math.tan(PI / n)), R = s / (2 * Math.sin(PI / n)), f = 180 / n, out = [];
    out.push(H(['ang:A'], angItem('Interior angle at each corner', '∠A', '(n − 2) × 180 ÷ n', ['(' + n + ' − 2) × 180 ÷ ' + n], (n - 2) * 180 / n, 'angA')));
    out.push(H(['ang:θ'], angItem('Central angle (between two spokes)', 'θ', '360 ÷ n', ['360 ÷ ' + n], 360 / n, 'cen')));
    out.push(H(['ang:A'], angItem('Exterior angle (turn at each corner)', '∠E', '360 ÷ n', ['360 ÷ ' + n], 360 / n, 'angE')));
    if (!haveA) out.push(H(['dim:s'], lenI('Apothem (centre to the middle of a side)', 'a', 's ÷ (2 × tan(180° ÷ n))', [v(s) + ' ÷ (2 × tan ' + v(f) + '°)'], ap, u)));
    out.push(H(['dim:s'], lenI('Radius to a corner (circumradius)', 'R', 's ÷ (2 × sin(180° ÷ n))', [v(s) + ' ÷ (2 × sin ' + v(f) + '°)'], R, u)));
    return out;
  }
  XC.pentagon = function (p, u) {
    var s = p.s, ap = s / (2 * Math.tan(36 * D2R)), R = s / (2 * Math.sin(36 * D2R));
    return regX(5, s, u, true).concat([H(['dim:s'], lenI('Diagonal (corner to a far corner)', 'd', 's × (1 + √5) ÷ 2', [v(s) + ' × (1 + √5) ÷ 2'], s * (1 + Math.sqrt(5)) / 2, u)),
      H(['dim:a'], lenI('Height (corner to the opposite side)', 'Ht', 'a + R', [v(ap) + ' + ' + v(R)], ap + R, u))]);
  };
  XC.hexagon = function (p, u) { return regX(6, p.s, u, false); };
  XC.octagon = function (p, u) {
    var s = p.s;
    return regX(8, s, u, false).concat([H(['dim:s', 'dim:AF'], lenI('Corner cut from a square of side AF (each leg)', 'k', 's ÷ √2', [v(s) + ' ÷ √2'], s / SQ2, u))]);
  };
  XC.stadium = function (p, u) {
    var r = p.r;
    return [H(['dim:r'], lenI('Curved edge of one round end', 'Le', 'π × r', ['π × ' + v(r)], PI * r, u)),
      H(['dim:r'], areaI('Area of the two round ends together', 'Ae', 'π × r²', ['π × ' + v(r) + '²'], PI * r * r, u))];
  };
  XC.reuleaux = function (p, u) {
    var w = p.w;
    return [H(['ang:A', 'ang:B', 'ang:C'], angItem('Corner angle (between the two arcs that meet there)', '∠A', '180 − 60', ['180 − 60'], 120, 'angA')),
      H(['dim:w'], lenI('One curved edge (a 60° arc of radius w)', 'La', '(π × w) ÷ 3', ['(π × ' + v(w) + ') ÷ 3'], PI * w / 3, u))];
  };
  XC['ring-sector'] = function (p, u) {
    var R = p.R, r = p.r, t = p.t;
    return [H(['dim:R', 'ang:θ'], lenI('Outer chord', 'c', '2 × R × sin(θ ÷ 2)', ['2 × ' + v(R) + ' × sin ' + v(t / 2) + '°'], 2 * R * Math.sin(t / 2 * D2R), u)),
      H(['dim:r', 'ang:θ'], lenI('Inner chord', 'ci', '2 × r × sin(θ ÷ 2)', ['2 × ' + v(r) + ' × sin ' + v(t / 2) + '°'], 2 * r * Math.sin(t / 2 * D2R), u)),
      H(['dim:R', 'ang:θ'], lenI('Sagitta of the outer arc (rise above its chord)', 'sg', 'R − R × cos(θ ÷ 2)', [v(R) + ' − ' + v(R) + ' × cos ' + v(t / 2) + '°'], R - R * Math.cos(t / 2 * D2R), u)),
      H([], noKeys(angItem('Corner angle (a radius meets an arc square)', '∠A', '90', ['90'], 90, 'angA')))];
  };
  function starTip(p) { var n = Math.round(p.n), f = 180 / n, R = p.R, r = p.r, e = Math.sqrt(R * R + r * r - 2 * R * r * Math.cos(f * D2R)); return { f: f, e: e, tip: 2 * Math.asin(Math.min(1, r * Math.sin(f * D2R) / e)) / D2R }; }
  XC.star = function (p, u) {
    var g = starTip(p);
    return [H(['ang:τ', 'dim:e', 'dim:r', 'ang:φ'], angItem('Tip angle (law of sines, inside each point)', 'τ', '2 × sin⁻¹(r × sin φ ÷ e)', ['2 × sin⁻¹(' + v(p.r) + ' × sin ' + v(g.f) + '° ÷ ' + v(g.e) + ')'], g.tip, 'tip')),
      H(['ang:ν', 'ang:τ', 'ang:φ'], angItem('Notch angle (inside the star, more than 180°)', 'ν', '360 − 2 × φ − τ', ['360 − 2 × ' + v(g.f) + ' − ' + v(g.tip)], 360 - 2 * g.f - g.tip, 'notch'))];
  };
  XC.lune = function (p, u) {
    var R = p.R, r = p.r, e = p.e, psi = Math.acos(Math.max(-1, Math.min(1, (R * R + r * r - e * e) / (2 * R * r)))) / D2R;
    return [H(['ang:ψ', 'dim:R', 'dim:r', 'dim:e'], angItem('Tip angle (between the two arcs, law of cosines)', 'ψ', 'cos⁻¹((R² + r² − e²) ÷ (2 × R × r))', ['cos⁻¹((' + v(R) + '² + ' + v(r) + '² − ' + v(e) + '²) ÷ (2 × ' + v(R) + ' × ' + v(r) + '))'], psi, 'tip'))];
  };
  /* solids */
  XC.cube = function (p, u) {
    var s = p.s, f = SQ2 * s, d = SQ3 * s;
    return [H(['dim:s'], areaI('Area of one face', 'Af', 's²', [v(s) + '²'], s * s, u)),
      H(['dim:s'], lenI('Face diagonal', 'f', 's × √2', [v(s) + ' × √2'], f, u)),
      H(['dim:d', 'dim:s'], lenI('Space diagonal (corner to the far corner)', 'd', 's × √3', [v(s) + ' × √3'], d, u)),
      H(['dim:d', 'dim:s'], angItem('Angle between the space diagonal and the base', 'δ', 'tan⁻¹(s ÷ f)', ['tan⁻¹(' + v(s) + ' ÷ ' + v(f) + ')'], Math.atan2(s, f) / D2R, 'angD'))].concat(capItems(s * s * s, u));
  };
  XC['rectangular-prism'] = function (p, u) {
    var l = p.l, w = p.w, h = p.h, db = Math.hypot(l, w), d = Math.hypot(db, h);
    return [H(['bottom', 'dim:l', 'dim:w'], areaI('Base area (top and bottom)', 'B', 'l × w', [v(l) + ' × ' + v(w)], l * w, u)),
      H(['dim:l', 'dim:h'], areaI('Front face area', 'Af', 'l × h', [v(l) + ' × ' + v(h)], l * h, u)),
      H(['dim:w', 'dim:h'], areaI('End face area', 'Ae', 'w × h', [v(w) + ' × ' + v(h)], w * h, u)),
      H(['dim:l', 'dim:w'], lenI('Base diagonal', 'db', '√(l² + w²)', ['√(' + v(l) + '² + ' + v(w) + '²)'], db, u)),
      H(['dim:d', 'dim:h'], lenI('Space diagonal (corner to the far corner)', 'd', '√(db² + h²)', ['√(' + v(db) + '² + ' + v(h) + '²)'], d, u)),
      H(['dim:d', 'dim:h'], angItem('Angle between the space diagonal and the base', 'δ', 'tan⁻¹(h ÷ db)', ['tan⁻¹(' + v(h) + ' ÷ ' + v(db) + ')'], Math.atan2(h, db) / D2R, 'angD')),
      H(['all', 'dim:h'], cen('Centroid height', 'ȳ', 'h ÷ 2', [v(h) + ' ÷ 2'], h / 2, u, 'cy'))].concat(capItems(l * w * h, u));
  };
  XC['triangular-prism'] = function (p, u) {
    var b = p.b, h = p.h, l = p.l, s = Math.hypot(b / 2, h), A = Math.atan2(h, b / 2) / D2R;
    return [H(['ang:A', 'dim:h', 'dim:b'], angItem('Base angle A of the end triangle (roof pitch angle)', '∠A', 'tan⁻¹(h ÷ (b ÷ 2))', ['tan⁻¹(' + v(h) + ' ÷ ' + v(b / 2) + ')'], A, 'angA')),
      H(['ang:B'], noKeys(angItem('Base angle B (equal to A)', '∠B', '∠A', [v(A)], A, 'angB'))),
      H(['ang:C', 'ang:A'], angItem('Apex angle C of the end triangle', '∠C', '180 − 2 × ∠A', ['180 − 2 × ' + v(A)], 180 - 2 * A, 'angC')),
      H(['ang:A', 'dim:h', 'dim:b'], iu('Roof pitch: rise per 12 of run', 'pitch', '12 × h ÷ (b ÷ 2)', ['12 × ' + v(h) + ' ÷ ' + v(b / 2)], 24 * h / b, 'in 12', 'pitch', 'Slope')),
      H(['dim:b', 'dim:s'], lenI('Perimeter of the end triangle', 'Pe', 'b + 2 × s', [v(b) + ' + 2 × ' + v(s)], b + 2 * s, u)),
      H(['all', 'dim:h'], cen('Centroid height above the base', 'ȳ', 'h ÷ 3', [v(h) + ' ÷ 3'], h / 3, u, 'cy'))].concat(capItems(b * h / 2 * l, u));
  };
  XC['hexagonal-prism'] = function (p, u) {
    var s = p.s, h = p.h;
    return [H(['dim:s'], lenI('Across flats of the hexagon', 'AF', '√3 × s', ['√3 × ' + v(s)], SQ3 * s, u)),
      H(['dim:s'], lenI('Across corners of the hexagon', 'AC', '2 × s', ['2 × ' + v(s)], 2 * s, u)),
      H(['dim:s'], lenI('Apothem of the hexagon', 'a', '(√3 × s) ÷ 2', ['(√3 × ' + v(s) + ') ÷ 2'], SQ3 * s / 2, u)),
      H(['ang:A'], angItem('Interior angle of the hexagon', '∠A', '(6 − 2) × 180 ÷ 6', ['(6 − 2) × 180 ÷ 6'], 120, 'angA')),
      H(['dim:s', 'dim:h'], lenI('Longest diagonal (corner to the far corner)', 'd', '√((2 × s)² + h²)', ['√(' + v(2 * s) + '² + ' + v(h) + '²)'], Math.hypot(2 * s, h), u))].concat(capItems(1.5 * SQ3 * s * s * h, u));
  };
  XC.cylinder = function (p, u) {
    var r = p.r, h = p.h, D = 2 * r;
    return [H(['dim:r'], lenI('Circumference', 'C', 'π × D', ['π × ' + v(D)], PI * D, u)),
      H(['dim:r', 'dim:h'], lenI('Diagonal (longest straight rod that fits inside)', 'd', '√(D² + h²)', ['√(' + v(D) + '² + ' + v(h) + '²)'], Math.hypot(D, h), u)),
      H(['all', 'dim:h'], cen('Centroid height', 'ȳ', 'h ÷ 2', [v(h) + ' ÷ 2'], h / 2, u, 'cy'))].concat(capItems(PI * r * r * h, u));
  };
  XC.pipe = function (p, u) {
    var R = p.R, r = p.r, h = p.h;
    return [H(['dim:R', 'dim:r'], lenI('Wall thickness', 't', 'R − r', [v(R) + ' − ' + v(r)], R - r, u)),
      H(['dim:R'], lenI('Outside circumference', 'C', 'π × OD', ['π × ' + v(2 * R)], 2 * PI * R, u)),
      H(['dim:r'], lenI('Inside circumference', 'c', 'π × ID', ['π × ' + v(2 * r)], 2 * PI * r, u))].concat(capInside(PI * r * r * h, u));
  };
  XC.cone = function (p, u) {
    var r = p.r, h = p.h, l = Math.hypot(r, h), al = Math.atan2(h, r) / D2R, ha = Math.atan2(r, h) / D2R;
    return [H(['dim:r'], lenI('Base diameter', 'D', '2 × r', ['2 × ' + v(r)], 2 * r, u)),
      H(['bottom', 'dim:r'], areaI('Base area', 'B', 'π × r²', ['π × ' + v(r) + '²'], PI * r * r, u)),
      H(['ang:α', 'dim:h', 'dim:r'], angItem('Slope angle α (side to base)', 'α', 'tan⁻¹(h ÷ r)', ['tan⁻¹(' + v(h) + ' ÷ ' + v(r) + ')'], al, 'alpha')),
      H(['ang:φ', 'dim:r', 'dim:h'], angItem('Half the apex angle (side to centre line)', 'φ÷2', 'tan⁻¹(r ÷ h)', ['tan⁻¹(' + v(r) + ' ÷ ' + v(h) + ')'], ha, 'half')),
      H(['ang:φ'], angItem('Apex angle φ (across the point)', 'φ', '2 × tan⁻¹(r ÷ h)', ['2 × tan⁻¹(' + v(r) + ' ÷ ' + v(h) + ')'], 2 * ha, 'apex')),
      H(['dim:l', 'dim:r'], angItem('Sector angle of the flat pattern', 'θ', '360 × r ÷ l', ['360 × ' + v(r) + ' ÷ ' + v(l)], 360 * r / l, 'theta')),
      H(['all', 'dim:h'], cen('Centroid height above the base', 'ȳ', 'h ÷ 4', [v(h) + ' ÷ 4'], h / 4, u, 'cy'))].concat(capItems(PI * r * r * h / 3, u));
  };
  XC.frustum = function (p, u) {
    var R = p.R, r = p.r, h = p.h, l = Math.hypot(R - r, h), al = Math.atan2(h, R - r) / D2R, L = l * R / (R - r);
    return [H(['dim:R'], lenI('Bottom diameter', 'D', '2 × R', ['2 × ' + v(R)], 2 * R, u)),
      H(['dim:r'], lenI('Top diameter', 'd', '2 × r', ['2 × ' + v(r)], 2 * r, u)),
      H(['bottom', 'dim:R'], areaI('Bottom area', 'B1', 'π × R²', ['π × ' + v(R) + '²'], PI * R * R, u)),
      H(['top', 'dim:r'], areaI('Top area', 'B2', 'π × r²', ['π × ' + v(r) + '²'], PI * r * r, u)),
      H(['ang:α', 'dim:h', 'dim:R', 'dim:r'], angItem('Slope angle α (side to base)', 'α', 'tan⁻¹(h ÷ (R − r))', ['tan⁻¹(' + v(h) + ' ÷ ' + v(R - r) + ')'], al, 'alpha')),
      H(['dim:h', 'dim:R', 'dim:r'], lenI('Height of the whole cone before the top was cut off', 'Hc', 'h × R ÷ (R − r)', [v(h) + ' × ' + v(R) + ' ÷ ' + v(R - r)], h * R / (R - r), u)),
      H(['dim:l'], angItem('Sector angle of the flat pattern', 'θ', '360 × R ÷ L', ['360 × ' + v(R) + ' ÷ ' + v(L)], 360 * R / L, 'theta'))].concat(capItems(PI * h * (R * R + R * r + r * r) / 3, u));
  };
  XC['square-pyramid'] = function (p, u) {
    var b = p.b, h = p.h, l = Math.hypot(b / 2, h);
    return [H(['bottom', 'dim:b'], areaI('Base area', 'B', 'b²', [v(b) + '²'], b * b, u)),
      H(['dim:b'], lenI('Base diagonal', 'db', 'b × √2', [v(b) + ' × √2'], b * SQ2, u)),
      H(['dim:b', 'dim:l'], areaI('Area of one face (triangle)', 'Af', '½ × b × l', ['½ × ' + v(b) + ' × ' + v(l)], b * l / 2, u)),
      H(['ang:α', 'dim:h', 'dim:b'], angItem('Face slope α (face to base, the roof pitch angle)', 'α', 'tan⁻¹(h ÷ (b ÷ 2))', ['tan⁻¹(' + v(h) + ' ÷ ' + v(b / 2) + ')'], Math.atan2(h, b / 2) / D2R, 'alpha')),
      H(['ang:β', 'dim:h', 'dim:b'], angItem('Edge slope β (sloped edge to base, the hip angle)', 'β', 'tan⁻¹(h ÷ (b ÷ √2))', ['tan⁻¹(' + v(h) + ' ÷ (' + v(b) + ' ÷ √2))'], Math.atan2(h, b / SQ2) / D2R, 'beta')),
      H(['ang:φ', 'dim:b', 'dim:l'], angItem('Apex angle φ of a face', 'φ', '2 × tan⁻¹((b ÷ 2) ÷ l)', ['2 × tan⁻¹(' + v(b / 2) + ' ÷ ' + v(l) + ')'], 2 * Math.atan2(b / 2, l) / D2R, 'apex')),
      H(['dim:b', 'dim:l'], angItem('Base angle ψ of a face', 'ψ', 'tan⁻¹(l ÷ (b ÷ 2))', ['tan⁻¹(' + v(l) + ' ÷ ' + v(b / 2) + ')'], Math.atan2(l, b / 2) / D2R, 'psi')),
      H(['ang:α', 'dim:h', 'dim:b'], iu('Roof pitch: rise per 12 of run', 'pitch', '12 × h ÷ (b ÷ 2)', ['12 × ' + v(h) + ' ÷ ' + v(b / 2)], 24 * h / b, 'in 12', 'pitch', 'Slope')),
      H(['all', 'dim:h'], cen('Centroid height above the base', 'ȳ', 'h ÷ 4', [v(h) + ' ÷ 4'], h / 4, u, 'cy'))].concat(capItems(b * b * h / 3, u));
  };
  XC['pyramid-frustum'] = function (p, u) {
    var a = p.a, b = p.b, h = p.h, o = (b - a) / 2, l = Math.hypot(o, h), e = Math.hypot(l, o), ps = Math.atan2(l, o) / D2R;
    return [H(['dim:a', 'dim:b'], lenI('Step in at each side', 'o', '(b − a) ÷ 2', ['(' + v(b) + ' − ' + v(a) + ') ÷ 2'], o, u)),
      H(['dim:l'], lenI('Sloped edge (corner to corner)', 'e', '√(l² + o²)', ['√(' + v(l) + '² + ' + v(o) + '²)'], e, u)),
      H(['dim:a', 'dim:b', 'dim:l'], areaI('Area of one face (trapezoid)', 'Af', '((a + b) ÷ 2) × l', ['((' + v(a) + ' + ' + v(b) + ') ÷ 2) × ' + v(l)], (a + b) / 2 * l, u)),
      H(['ang:α', 'dim:h'], angItem('Face slope α (face to base)', 'α', 'tan⁻¹(h ÷ o)', ['tan⁻¹(' + v(h) + ' ÷ ' + v(o) + ')'], Math.atan2(h, o) / D2R, 'alpha')),
      H(['dim:h'], angItem('Edge slope β (sloped edge to base)', 'β', 'tan⁻¹(h ÷ (o × √2))', ['tan⁻¹(' + v(h) + ' ÷ (' + v(o) + ' × √2))'], Math.atan2(h, o * SQ2) / D2R, 'beta')),
      H(['ang:ψ', 'dim:l'], angItem('Bottom angle ψ of a face', 'ψ', 'tan⁻¹(l ÷ o)', ['tan⁻¹(' + v(l) + ' ÷ ' + v(o) + ')'], ps, 'psi')),
      H(['ang:ψ'], angItem('Top angle ω of a face (ψ and ω add to 180°)', 'ω', '180 − ψ', ['180 − ' + v(ps)], 180 - ps, 'omega'))].concat(capItems(h * (a * a + a * b + b * b) / 3, u));
  };
  XC.sphere = function (p, u) {
    var r = p.r;
    return [H(['dim:r'], lenI('Diameter', 'D', '2 × r', ['2 × ' + v(r)], 2 * r, u)),
      H(['dim:r'], lenI('Circumference (around the middle)', 'C', 'π × D', ['π × ' + v(2 * r)], 2 * PI * r, u)),
      H(['dim:r'], areaI('Area of the cut through the middle', 'Ac', 'π × r²', ['π × ' + v(r) + '²'], PI * r * r, u))].concat(capItems(4 * PI * r * r * r / 3, u));
  };
  XC.hemisphere = function (p, u) {
    var r = p.r;
    return [H(['dim:r'], lenI('Diameter', 'D', '2 × r', ['2 × ' + v(r)], 2 * r, u)),
      H(['dim:r'], lenI('Rim circumference', 'C', 'π × D', ['π × ' + v(2 * r)], 2 * PI * r, u)),
      H(['all', 'dim:r'], cen('Centroid from the flat face', 'ȳ', '(3 × r) ÷ 8', ['(3 × ' + v(r) + ') ÷ 8'], 3 * r / 8, u, 'cy'))].concat(capItems(2 * PI * r * r * r / 3, u));
  };
  XC.torus = function (p, u) { return capItems(PI * p.r * p.r * 2 * PI * p.R, u); };
  XC.elbow = function (p, u) { return capItems(PI * p.r * p.r * p.t / 360 * 2 * PI * p.R, u); };
  XC['mitred-cylinder'] = function (p, u) {
    var t = p.t;
    return [H([], angItem('Angle between the cut face and the pipe wall', 'ψ', '90 − θ', ['90 − ' + v(t)], 90 - t, 'psi')),
      H([], angItem('Bend made by two pieces cut at θ (two-piece mitre)', 'Bd', '2 × θ', ['2 × ' + v(t)], 2 * t, 'bend'))].concat(capItems(PI * p.r * p.r * p.L, u));
  };
  XC['spherical-cap'] = function (p, u) { return capItems(PI * p.h * (3 * p.a * p.a + p.h * p.h) / 6, u); };
  XC.capsule = function (p, u) { return capItems(PI * p.r * p.r * p.l + 4 * PI * p.r * p.r * p.r / 3, u); };
  XC['hss-tube'] = function (p, u) {
    return capInside((p.B - 2 * p.t) * (p.H - 2 * p.t) * p.L, u);
  };
  XC['polygon-prism'] = function (p, u) {
    var n = Math.round(p.n), s = p.s, ap = s / (2 * Math.tan(PI / n));
    return regX(n, s, u, true).filter(function (it) { return it.key !== 'cen'; }).concat(capItems(n * s * ap / 2 * p.h, u));
  };
  var PLATX = { tetrahedron: [60, Math.acos(1 / 3), 'cos⁻¹(1 ÷ 3)', 'cos⁻¹(1 ÷ 3)'], octahedron: [60, Math.acos(-1 / 3), 'cos⁻¹(−1 ÷ 3)', '180 − cos⁻¹(1 ÷ 3)'],
    dodecahedron: [108, Math.acos(-1 / Math.sqrt(5)), 'cos⁻¹(−1 ÷ √5)', '180 − cos⁻¹(1 ÷ √5)'], icosahedron: [60, Math.acos(-Math.sqrt(5) / 3), 'cos⁻¹(−√5 ÷ 3)', '180 − cos⁻¹(√5 ÷ 3)'] };
  function platVol(id, a) { return { tetrahedron: a * a * a / (6 * SQ2), octahedron: SQ2 / 3 * a * a * a, dodecahedron: (15 + 7 * Math.sqrt(5)) / 4 * a * a * a, icosahedron: 5 / 12 * (3 + Math.sqrt(5)) * a * a * a }[id]; }
  Object.keys(PLATX).forEach(function (id) {
    XC[id] = function (p, u) {
      var X = PLATX[id];
      return [H(['ang:φ'], noKeys(angItem('Angle at each corner of a face', 'φ', X[0] === 60 ? '180 ÷ 3' : '(5 − 2) × 180 ÷ 5', [X[0] === 60 ? '180 ÷ 3' : '(5 − 2) × 180 ÷ 5'], X[0], 'face'))),
        H(['all'], noKeys(angItem('Angle between two faces that share an edge (dihedral angle)', 'δ', X[2], [X[3]], X[1] / D2R, 'dihedral')))].concat(capItems(platVol(id, p.a), u));
    };
  });

  /* ---------- angle marks on flat drawings (opts.allAngles) ---------- */
  function angP(V, P1, P2, letter, deg, derived, o) {
    var a = angAt(V, P1, P2, angLab(letter, deg, derived));
    a.out = false; a.fit = true; a.rp = (o && o.rp) || 22;
    a.rmax = 0.42 * Math.min(Math.hypot(P1[0] - V[0], P1[1] - V[1]), Math.hypot(P2[0] - V[0], P2[1] - V[1]));
    if (o && o.reflex) a.a1 += a.a1 > a.a0 ? -2 * PI : 2 * PI;
    return a;
  }
  function polyAngs(pts, letters, vals, derived) {
    var out = [], n = pts.length;
    letters.forEach(function (L, i) { if (L) out.push(angP(pts[i], pts[(i + 1) % n], pts[(i + n - 1) % n], L, vals[i], derived)); });
    return out;
  }
  function raAll(pts, skip) {
    var out = [], n = pts.length;
    pts.forEach(function (q, i) {
      if (skip && skip.indexOf(i) >= 0) return;
      out.push(ra(q, nrm(sub(pts[(i + 1) % n], q)), nrm(sub(pts[(i + n - 1) % n], q))));
    });
    return out;
  }
  var XA = {}, CORNERS = { square: 1, rectangle: 1 };
  function cornerRA(list) { return list.map(function (q) { q.hlLetter = 'corner'; return q; }); }
  XA.square = function (p, ao) {
    var s = p.s, pts = [[0, 0], [s, 0], [s, -s], [0, -s]], out = ao.allAngles ? cornerRA(raAll(pts, [0])) : [];
    if (ao.moreDims) out.push(ann(pts[0], pts[2], LB('d', SQ2 * s, 1, true), { dash: true, at: 0.62 }));
    return out;
  };
  XA.rectangle = function (p, ao) {
    var l = p.l, w = p.w, pts = [[0, 0], [l, 0], [l, -w], [0, -w]], out = ao.allAngles ? cornerRA(raAll(pts, [0])) : [];
    if (ao.moreDims) out.push(ann(pts[0], pts[2], LB('d', Math.hypot(l, w), 1, true), { dash: true, at: 0.62 }));
    /* the angle δ is measured to the diagonal, so the diagonal is drawn (dashed) when the size is not already on */
    if (ao.allAngles && !ao.moreDims) out.push(aux(pts[0], pts[2]));
    if (ao.allAngles) out.push(angP(pts[0], pts[1], pts[2], 'δ', Math.atan2(w, l) / D2R, true, { rp: 34 }));
    return out;
  };
  function onlyAng(f) { return function (p, ao) { return ao.allAngles ? f(p, ao) : []; }; }
  XA.parallelogram = onlyAng(function (p) {
    var pts = DEF.parallelogram.rings(p)[0], al = Math.asin(Math.min(1, p.h / p.s)) / D2R;
    return polyAngs(pts, ['A', 'B', 'C', 'D'], [al, 180 - al, al, 180 - al], true);
  });
  XA.rhombus = onlyAng(function (p) {
    var pts = DEF.rhombus.rings(p)[0], A = 2 * Math.atan2(p.d2, p.d1) / D2R;
    return polyAngs(pts, ['A', 'B', 'C', 'D'], [A, 180 - A, A, 180 - A], true);
  });
  XA.trapezoid = onlyAng(function (p) {
    var pts = DEF.trapezoid.rings(p)[0], al = Math.atan2(p.h, (p.b - p.a) / 2) / D2R;
    return polyAngs(pts, ['A', 'B', 'C', 'D'], [al, al, 180 - al, 180 - al], true);
  });
  XA.kite = onlyAng(function (p) {
    var pts = DEF.kite.rings(p)[0], T = 2 * Math.atan2(p.d2 / 2, p.p) / D2R, B = 2 * Math.atan2(p.d2 / 2, p.d1 - p.p) / D2R, S2 = (360 - T - B) / 2;
    return polyAngs(pts, ['A', 'B', 'C', 'D'], [T, S2, B, S2], true);
  });
  function regAngs(pts, n) {
    var k = 0;
    pts.forEach(function (q, i) { if (q[1] > pts[k][1] + 1e-9 || (Math.abs(q[1] - pts[k][1]) < 1e-9 && q[0] < pts[k][0])) k = i; });
    var a = pts[(k + 1) % n], b = pts[(k + n - 1) % n], nb = Math.abs(a[1] - pts[k][1]) < Math.abs(b[1] - pts[k][1]) ? a : b;
    return [angP(pts[k], a, b, 'A', (n - 2) * 180 / n, true), aux([0, 0], pts[k], { derived: true }), aux([0, 0], nb, { derived: true }), angP([0, 0], pts[k], nb, 'θ', 360 / n, true, { rp: 16 })];
  }
  XA.pentagon = onlyAng(function (p) { return regAngs(DEF.pentagon.rings(p)[0], 5); });
  XA.hexagon = onlyAng(function (p) { return regAngs(DEF.hexagon.rings(p)[0], 6); });
  XA.octagon = onlyAng(function (p) { return regAngs(DEF.octagon.rings(p)[0], 8); });
  XA.reuleaux = onlyAng(function (p) {
    var V = reuleauxPts(p.w), out = [], L = ['A', 'B', 'C'];
    V.forEach(function (Vi, i) {
      var Vj = V[(i + 1) % 3], Vk = V[(i + 2) % 3];
      var t1 = nrm([-(Vi[1] - Vj[1]), Vi[0] - Vj[0]]), t2 = nrm([-(Vi[1] - Vk[1]), Vi[0] - Vk[0]]);
      if (dot(t1, sub(Vk, Vi)) < 0) t1 = mul(t1, -1);
      if (dot(t2, sub(Vj, Vi)) < 0) t2 = mul(t2, -1);
      out.push(angP(Vi, add(Vi, mul(t1, p.w * 0.3)), add(Vi, mul(t2, p.w * 0.3)), L[i], 120, true));
    });
    return out;
  });
  XA['ring-sector'] = onlyAng(function (p) {
    var R = p.R, r = p.r, t = p.t, A = pol([0, 0], r, 0), B = pol([0, 0], R, 0), C = pol([0, 0], R, t), D = pol([0, 0], r, t);
    var tg = function (deg) { return [-Math.sin(deg * D2R), -Math.cos(deg * D2R)]; };
    return [ra(B, nrm(sub(A, B)), tg(0)), ra(A, nrm(sub(B, A)), tg(0)), ra(C, nrm(sub(D, C)), mul(tg(t), -1)), ra(D, nrm(sub(C, D)), mul(tg(t), -1))];
  });
  XA.star = onlyAng(function (p) {
    var pts = starRing(p), n = Math.round(p.n), g = starTip(p);
    return [angP(pts[0], pts[1], pts[2 * n - 1], 'τ', g.tip, true), angP(pts[1], pts[0], pts[2], 'ν', 360 - 2 * g.f - g.tip, true, { reflex: true, rp: 16 })];
  });
  XA.lune = onlyAng(function (p) {
    var g = luneGeo(p), I = g.Ip, k = p.R * 0.3;
    var t1 = nrm(sub(pol([0, 0], p.R, g.al + 0.01), I)), t2 = nrm(sub(pol([p.e, 0], p.r, 180 - g.be + 0.01), I));
    var psi = Math.acos(Math.max(-1, Math.min(1, (p.R * p.R + p.r * p.r - p.e * p.e) / (2 * p.R * p.r)))) / D2R;
    return [angP(I, add(I, mul(t1, k)), add(I, mul(t2, k)), 'ψ', psi, true, { rp: 26 })];
  });
  /* full calc working: a line that only repeats the line before it is dropped ("∠C = 90", "∠C = 90", "∠C = 90°" prints once) */
  function tidyLines(lines) {
    var out = [], bare = function (s) { return s.replace(/°$/, ''); };
    (lines || []).forEach(function (s) { if (!out.length || bare(out[out.length - 1]) !== bare(s)) out.push(s); else out[out.length - 1] = s; });
    return out;
  }
  /* a copy of a drawing prim with one more field */
  function withFlag(q, k, val) { var o = {}, f; for (f in q) o[f] = q[f]; o[k] = val; return o; }
  function drawPrims(d, p, ao) {
    var pr = d.draw(p, undefined, ao);
    if (ao && ao.allAngles && CORNERS[d.id]) pr = pr.map(function (q) { return q.t !== 'ra' || q.lab || q.hlLetter ? q : withFlag(q, 'hlLetter', 'corner'); });
    if (ao && (ao.allAngles || ao.moreDims) && XA[d.id]) pr = pr.concat(XA[d.id](p, ao));
    /* with every angle marked, each angle label is kept beside its own arc (or joined to it by a leader) */
    if (ao && ao.allAngles) pr = pr.map(function (q) { return q.t !== 'angle' || q.near ? q : withFlag(q, 'near', true); });
    return pr;
  }

  /* ---------- angle marks on 3D views of the solids that existed before (opts.allAngles) ---------- */
  var A3 = {};
  A3['triangular-prism'] = function (p, ctx) {
    var b = p.b, h = p.h, z = ctx.facing([0, 0, 1]) ? p.l / 2 : -p.l / 2, A = Math.atan2(h, b / 2) / D2R;
    var L = [-b / 2, 0, z], R = [b / 2, 0, z], T = [0, h, z];
    return { angs: [{ v: L, a: R, b: T, lab: angLab('A', A, true) }, { v: R, a: T, b: L, lab: angLab('B', A, true) }, { v: T, a: L, b: R, lab: angLab('C', 180 - 2 * A, true) }] };
  };
  function topVertexAng(ring3, h, ctx, letter, deg) {
    var up = ctx.facing([0, 1, 0]), y = up ? h : 0, best = 0, bz = -Infinity, n = ring3.length;
    ring3.forEach(function (q, i) { var z = ctx.view([q[0], y, q[2]])[2]; if (z > bz) { bz = z; best = i; } });
    var P = function (i) { var q = ring3[(i + n) % n]; return [q[0], y, q[2]]; };
    return { v: P(best), a: P(best + 1), b: P(best - 1), lab: angLab(letter, deg, true) };
  }
  A3['hexagonal-prism'] = function (p, ctx) { return { angs: [topVertexAng(hexPts(p.s, 0), p.h, ctx, 'A', 120)] }; };
  A3['polygon-prism'] = function (p, ctx) { var n = Math.round(p.n); return { angs: [topVertexAng(polyBase(n, p.s), p.h, ctx, 'A', (n - 2) * 180 / n)] }; };
  function rimRight(r, y, ctx) {
    var best = 0, bx = -Infinity;
    for (var i = 0; i < 72; i++) { var t = 2 * PI * i / 72, x = ctx.view([r * Math.cos(t), y, r * Math.sin(t)])[0]; if (x > bx) { bx = x; best = t; } }
    return best;
  }
  A3.cone = function (p, ctx) {
    var r = p.r, h = p.h, t = rimRight(r, 0, ctx), P = [r * Math.cos(t), 0, r * Math.sin(t)], Q = [-P[0], 0, -P[2]], T = [0, h, 0];
    return { angs: [{ v: P, a: [0, 0, 0], b: T, lab: angLab('α', Math.atan2(h, r) / D2R, true) }, { v: T, a: P, b: Q, lab: angLab('φ', 2 * Math.atan2(r, h) / D2R, true) }],
      auxs: [[P, [0, 0, 0]], [Q, [0, 0, 0]]] };
  };
  A3.frustum = function (p, ctx) {
    var R = p.R, r = p.r, h = p.h, t = rimRight(R, 0, ctx), c = Math.cos(t), s = Math.sin(t), P = [R * c, 0, R * s], Q = [r * c, h, r * s];
    return { angs: [{ v: P, a: [0, 0, 0], b: Q, lab: angLab('α', Math.atan2(h, R - r) / D2R, true) }], auxs: [[P, [0, 0, 0]]] };
  };
  A3['square-pyramid'] = function (p) {
    var b = p.b, h = p.h, X = b / 2, l = Math.hypot(X, h), M = [0, 0, X], T = [0, h, 0], C1 = [X, 0, X], C0 = [-X, 0, X];
    return { angs: [{ v: M, a: [0, 0, 0], b: T, lab: angLab('α', Math.atan2(h, X) / D2R, true) }, { v: C1, a: [0, 0, 0], b: T, lab: angLab('β', Math.atan2(h, X * SQ2) / D2R, true) },
      { v: T, a: C0, b: C1, lab: angLab('φ', 2 * Math.atan2(X, l) / D2R, true) }], auxs: [[M, [0, 0, 0]], [C1, [0, 0, 0]]] };
  };
  A3['pyramid-frustum'] = function (p) {
    var A = p.a / 2, B = p.b / 2, h = p.h, o = B - A, l = Math.hypot(o, h), M = [0, 0, B];
    return { angs: [{ v: M, a: [0, 0, 0], b: [0, h, A], lab: angLab('α', Math.atan2(h, o) / D2R, true) }, { v: [B, 0, B], a: [-B, 0, B], b: [A, h, A], lab: angLab('ψ', Math.atan2(l, o) / D2R, true) }],
      auxs: [[M, [0, 0, 0]]] };
  };
  A3['mitred-cylinder'] = function (p) {
    var r = p.r, k = Math.tan(p.t * D2R), Cc = [0, p.L, 0];
    return { angs: [{ v: Cc, a: [r, p.L, 0], b: [r, p.L + r * k, 0], lab: angLab('θ', p.t, false) }], auxs: [[[-r, p.L, 0], [r, p.L, 0]]] };
  };
  A3.elbow = function (p) {
    var th = p.t * D2R, E2 = elbowUp([p.R * Math.cos(th), 0, p.R * Math.sin(th)]);
    return { angs: [{ v: [0, 0, 0], a: [p.R, 0, 0], b: E2, lab: angLab('θ', p.t, false) }], auxs: [[[0, 0, 0], E2]] };
  };
  Object.keys(PLATX).forEach(function (id) {
    A3[id] = function (p, ctx) {
      var m = platMesh(id, p.a), best = null, bz = -Infinity, o0 = ctx.view([0, 0, 0]);
      m.f.forEach(function (f) { var nn = nrm(newell(f.v.map(function (i) { return m.v[i]; }))), z = ctx.view(nn)[2] - o0[2]; if (z > bz) { bz = z; best = f; } });
      var vs = best.v.map(function (i) { return m.v[i]; }), n = vs.length;
      return { angs: [{ v: vs[0], a: vs[1], b: vs[n - 1], lab: angLab('φ', PLATX[id][0], true) }] };
    };
  });
  /* box solids: square-corner boxes on the four corners of the face toward the viewer and on one corner of the top face.
     With moreDims (the space diagonal drawn) also the angle the diagonal makes with the base, along the base diagonal. */
  function boxAngs(l, h, w, ctx) {
    var X = l / 2, Z = w / 2, zf = ctx.facing([0, 0, 1]) ? Z : -Z, xs = ctx.facing([1, 0, 0]) ? X : -X, yt = ctx.facing([0, 1, 0]) ? h : 0;
    var F = [[-X, 0, zf], [X, 0, zf], [X, h, zf], [-X, h, zf]], angs = [];
    F.forEach(function (q, i) { angs.push({ v: q, a: F[(i + 1) % 4], b: F[(i + 3) % 4] }); });
    angs.push({ v: [xs, yt, -zf], a: [-xs, yt, -zf], b: [xs, yt, zf] });
    var out = { angs: angs, auxs: [] };
    if (ctx.moreDims) {
      /* the diagonal runs (-X, 0, -Z) to (X, h, Z). The angle is marked at its end on the face the viewer sees (top or bottom),
         against that face's diagonal: the same angle either way */
      var B0 = [-X, 0, -Z], T1 = [X, h, Z], up = ctx.facing([0, 1, 0]), Vd = up ? T1 : B0, Ed = up ? [-X, h, -Z] : [X, 0, Z];
      out.auxs.push([Vd, Ed]);
      out.angs.push({ v: Vd, a: Ed, b: up ? B0 : T1, lab: angLab('θ', Math.atan2(h, Math.hypot(l, w)) / D2R, true) });
    }
    return out;
  }
  A3.cube = function (p, ctx) { return boxAngs(p.s, p.s, p.s, ctx); };
  A3['rectangular-prism'] = function (p, ctx) { return boxAngs(p.l, p.h, p.w, ctx); };
  /* extra sizes on 3D views (opts.moreDims) */
  var MD3 = {
    cube: function (p) { var X = p.s / 2; return [{ a: [-X, 0, -X], b: [X, p.s, X], lab: LB('d', SQ3 * p.s, 1, true), at: 0.6 }]; },
    'rectangular-prism': function (p) { var X = p.l / 2, Z = p.w / 2; return [{ a: [-X, 0, -Z], b: [X, p.h, Z], lab: LB('d', Math.hypot(p.l, p.w, p.h), 1, true), at: 0.6 }]; }
  };

  /* ---------- angle marks on nets (opts.allAngles): one panel of each kind ---------- */
  var NA = {};
  NA['triangular-prism'] = function (p) {
    var b = p.b, h = p.h, s = Math.hypot(b / 2, h), A = Math.atan2(h, b / 2) / D2R, L = [s, 0], R = [s + b, 0], T = [s + b / 2, -h];
    return [angP(L, R, T, 'A', A, true), angP(R, T, L, 'B', A, true), angP(T, L, R, 'C', 180 - 2 * A, true)];
  };
  NA['square-pyramid'] = function (p) {
    var X = p.b / 2, l = Math.hypot(X, p.h), T = X + l, a = [-X, -X], b = [X, -X], c = [0, -T], ps = Math.atan2(l, X) / D2R;
    return [angP(a, b, c, 'ψ', ps, true), angP(b, c, a, 'ψ', ps, true), angP(c, a, b, 'φ', 180 - 2 * ps, true)];
  };
  NA['pyramid-frustum'] = function (p) {
    var A = p.a / 2, B = p.b / 2, l = Math.hypot(B - A, p.h), T = B + l, q = [[-B, -B], [B, -B], [A, -T], [-A, -T]], ps = Math.atan2(l, B - A) / D2R;
    return polyAngs(q, ['ψ', 'ψ', 'ω', 'ω'], [ps, ps, 180 - ps, 180 - ps], true);
  };
  NA['polygon-prism'] = function (p, nb) {
    var n = Math.round(p.n), bp = nb.panels.filter(function (q) { return q.role === 'base'; })[0];
    return bp ? [angP(bp.pts[0], bp.pts[1], bp.pts[n - 1], 'A', (n - 2) * 180 / n, true)] : [];
  };
  Object.keys(PLATX).forEach(function (id) {
    NA[id] = function (p, nb) {
      var m = platMesh(id, p.a), bp = nb.panels.filter(function (q) { return q.face === m.bottom; })[0];
      if (!bp) return [];
      var k = bp.pts.length;
      return [angP(bp.pts[0], bp.pts[1], bp.pts[k - 1], 'φ', PLATX[id][0], true)];
    };
  });

  /* ======== 3D EQUIVALENTS OF THE FLAT SHAPES (added solids, listed only by list({all: true})) ======== */
  function ADD(d) { d.added = true; if (d.unusual) d.unit = 'mm'; reg(d); }
  /* outline runs in flat (y-down) coordinates. A straight run is one edge, a curved run is a sampled arc with its exact length. */
  function rLine(a, b) { return { pts: [a, b], curve: false, len: Math.hypot(b[0] - a[0], b[1] - a[1]) }; }
  function rPoly(pts) { return pts.map(function (a, i) { return rLine(a, pts[(i + 1) % pts.length]); }); }
  function rArc(c, r, d0, d1, n) { return { pts: arc(c, r, d0, d1, n || 96), curve: true, len: Math.abs(d1 - d0) * D2R * r }; }
  function mkSec(runs, smooth, exactP) {
    var ring = [], curve = [], runOf = [];
    runs.forEach(function (rn, ri) { for (var k = 0; k < rn.pts.length - 1; k++) { ring.push(rn.pts[k]); curve.push(!!rn.curve); runOf.push(ri); } });
    var nr = runs.map(function (rn, ri) { return { straight: !rn.curve, len: rn.len, k0: runOf.indexOf(ri), k1: runOf.lastIndexOf(ri) }; });
    if (smooth) nr = [{ straight: false, len: exactP, k0: 0, k1: ring.length - 1 }];
    var n = ring.length, sA = 0, cvx = true, sg = 0;
    for (var i = 0; i < n; i++) {
      var a = ring[i], b = ring[(i + 1) % n], c = ring[(i + 2) % n];
      sA += a[0] * b[1] - b[0] * a[1];
      var cr = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]), sc0 = Math.hypot(b[0] - a[0], b[1] - a[1]) * Math.hypot(c[0] - b[0], c[1] - b[1]);
      if (Math.abs(cr) > 1e-9 * sc0) { if (!sg) sg = cr > 0 ? 1 : -1; else if (sg * cr < 0) cvx = false; }
    }
    return { ring: ring, curve: curve, runOf: runOf, smooth: !!smooth, runs: nr, convex: cvx, sA: sA / 2 };
  }
  function cross2(a, b, c) { return (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]); }
  function inTri(p, a, b, c, s) {
    var d1 = cross2(a, b, p) * s, d2 = cross2(b, c, p) * s, d3 = cross2(c, a, p) * s;
    return d1 > 1e-12 && d2 > 1e-12 && d3 > 1e-12;
  }
  /* ear clipping: convex pieces (triangles) of a simple polygon, for the hidden-line test on non-convex ends */
  function earClip(R) {
    var idx = R.map(function (q, i) { return i; }), out = [], s = 0, guard = 0;
    for (var i = 0; i < R.length; i++) { var a = R[i], b = R[(i + 1) % R.length]; s += a[0] * b[1] - b[0] * a[1]; }
    s = s > 0 ? 1 : -1;
    while (idx.length > 3 && guard++ < 100000) {
      var found = false;
      for (var k = 0; k < idx.length; k++) {
        var ia = idx[(k + idx.length - 1) % idx.length], ib = idx[k], ic = idx[(k + 1) % idx.length];
        if (cross2(R[ia], R[ib], R[ic]) * s <= 1e-12) continue;
        var bad = false;
        for (var j = 0; j < idx.length && !bad; j++) { var q = idx[j]; if (q !== ia && q !== ib && q !== ic && inTri(R[q], R[ia], R[ib], R[ic], s)) bad = true; }
        if (bad) continue;
        out.push([ia, ib, ic]); idx.splice(k, 1); found = true; break;
      }
      if (!found) break;
    }
    if (idx.length >= 3) out.push(idx.slice());
    return out;
  }
  /* placing a section: lying prisms stand the end shape up in the x-y plane and run along z, upright prisms lay it in the x-z plane */
  function placeOf(S, L, up) {
    var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    S.ring.forEach(function (q) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); });
    var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    if (up) return { P: function (q, t) { return [q[0] - cx, t * L, q[1] - cy]; }, N: function (n) { return [n[0], 0, n[1]]; }, AX: function (s) { return [0, s, 0]; } };
    return { P: function (q, t) { return [q[0] - cx, y1 - q[1], (t - 0.5) * L]; }, N: function (n) { return [n[0], -n[1], 0]; }, AX: function (s) { return [0, 0, s]; } };
  }
  function secMesh(S, pl) {
    var m = new Mesh(), R = S.ring, n = R.length, sgn = S.sA > 0 ? 1 : -1, eN = [], k;
    for (k = 0; k < n; k++) { var a = R[k], b = R[(k + 1) % n], d = [b[0] - a[0], b[1] - a[1]]; eN.push(nrm(sgn > 0 ? [d[1], -d[0]] : [-d[1], d[0]])); }
    var cb = R.map(function (q) { return m.add(pl.P(q, 0)); }), ct = R.map(function (q) { return m.add(pl.P(q, 1)); });
    var pieces = S.convex ? [R.map(function (q, i) { return i; })] : earClip(R);
    pieces.forEach(function (pc) { m.face(pc.map(function (i) { return cb[i]; }), pl.AX(-1), null, null); m.face(pc.map(function (i) { return ct[i]; }), pl.AX(1), null, null); });
    var gid = [];
    for (k = 0; k < n; k++) gid.push(S.smooth ? 'sm' : S.curve[k] ? 'c' + S.runOf[k] : null);
    var cache = {};
    var cv = function (g, i, t) {
      var key = g + '|' + i + '|' + t;
      if (cache[key] != null) return cache[key];
      var km = (i + n - 1) % n, nn = [0, 0];
      if (gid[km] === g) nn = add(nn, eN[km]);
      if (gid[i] === g) nn = add(nn, eN[i]);
      return (cache[key] = m.add(pl.P(R[i], t), pl.N(nrm(nn))));
    };
    for (k = 0; k < n; k++) {
      var k1 = (k + 1) % n, hint = pl.N(eN[k]), g = gid[k];
      if (g) m.face([cv(g, k, 0), cv(g, k1, 0), cv(g, k1, 1), cv(g, k, 1)], hint, g, 'side');
      else m.face([cb[k], cb[k1], ct[k1], ct[k]], hint, null, 'side');
    }
    return m;
  }
  /* map a flat drawing onto one end face of a prism */
  function mapPrims(prims, P3, D3, out, onlyAngles) {
    prims.forEach(function (pr) {
      if (onlyAngles && pr.t !== 'angle' && !(pr.t === 'ra' && pr.lab)) return;
      if (pr.t === 'ra' && pr.lab) {
        /* a labelled square corner goes in with the angle marks, so its label and its highlight come along */
        out.angs.push({ v: P3(pr.p), a: P3([pr.p[0] + pr.u[0], pr.p[1] + pr.u[1]]), b: P3([pr.p[0] + pr.v[0], pr.p[1] + pr.v[1]]), lab: pr.lab });
        return;
      }
      switch (pr.t) {
        case 'dim': out.dims.push({ cands: [[P3(pr.a), P3(pr.b)]], pref: [0, 1], lab: pr.lab }); break;
        case 'ann': out.lines.push({ a: P3(pr.a), b: P3(pr.b), lab: pr.lab, at: pr.at }); break;
        case 'aux': out.auxs.push([P3(pr.a), P3(pr.b)]); break;
        case 'auxp': for (var i = 0; i + 1 < pr.pts.length; i += 2) out.auxs.push([P3(pr.pts[i]), P3(pr.pts[i + 1])]); break;
        case 'ra': out.ras.push({ p: P3(pr.p), u: nrm(D3(pr.u)), v: nrm(D3(pr.v)), derived: pr.derived }); break;
        case 'dot': out.dots.push(P3(pr.p)); break;
        case 'text': if (pr.lab) out.texts.push({ p: P3(pr.p), d: nrm(D3(pr.dir)), lab: pr.lab }); if (pr.glow && pr.lab) out.glows.push({ pts: pr.glow.map(P3), letter: pr.lab.letter }); break;
        case 'glow': out.glows.push({ pts: pr.pts.map(P3), closed: pr.closed, letter: pr.letter }); break;
        case 'angle':
          var k = 1, c = pr.c, q0 = [c[0] + Math.cos(pr.a0) * k, c[1] + Math.sin(pr.a0) * k], q1 = [c[0] + Math.cos(pr.a1) * k, c[1] + Math.sin(pr.a1) * k];
          if (pr.lab) out.angs.push({ v: P3(c), a: P3(q0), b: P3(q1), lab: pr.lab, reflex: Math.abs(pr.a1 - pr.a0) > PI + 1e-9 });
          break;
      }
    });
  }
  /* angle marks that allAngles adds to a flat drawing (the ones the plain drawing already has are left out) */
  function newAngles(fd, fpar, base) {
    var key = function (q) { var c = q.t === 'ra' ? q.p : q.c; return q.t + ',' + c[0].toFixed(6) + ',' + c[1].toFixed(6) + ',' + (q.lab ? q.lab.letter : ''); }, seen = {};
    base.forEach(function (q) { if (q.t === 'angle' || q.t === 'ra') seen[key(q)] = 1; });
    return drawPrims(fd, fpar, { allAngles: true }).filter(function (q) { return (q.t === 'angle' || q.t === 'ra') && q.lab && !seen[key(q)]; });
  }
  function emptyAnnot() { return { dims: [], lines: [], auxs: [], ras: [], dots: [], texts: [], glows: [], angs: [] }; }
  /* ---- nets for prisms: a strip of side panels with the two ends folded off one side panel ---- */
  function hullEdgeOK(R, k, s) {
    var n = R.length, a = R[k], b = R[(k + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (var i = 0; i < n; i++) { if (cross2(a, b, R[i]) * s < -1e-9 * L * L) return false; }
    return true;
  }
  function hull2(pts) { return hull(pts.map(function (q) { return [q[0], q[1]]; })); }
  /* rigid map (turn, or turn and flip) taking q0 to A and q1 to B, with the shape's centre landing away from ref */
  function placeMap(R, q0, q1, A, B, ref) {
    var ang = Math.atan2(B[1] - A[1], B[0] - A[0]) - Math.atan2(q1[1] - q0[1], q1[0] - q0[0]), c = Math.cos(ang), s = Math.sin(ang);
    var u = nrm(sub(B, A)), cen0 = [0, 0];
    R.forEach(function (q) { cen0 = [cen0[0] + q[0] / R.length, cen0[1] + q[1] / R.length]; });
    var M0 = function (q) { var d = [q[0] - q0[0], q[1] - q0[1]]; return [A[0] + d[0] * c - d[1] * s, A[1] + d[0] * s + d[1] * c]; };
    var flip = function (w) { var t = dot(w, u); return [2 * t * u[0] - w[0], 2 * t * u[1] - w[1]]; };
    var side = function (q) { return cross2(A, B, q); };
    var mirror = side(M0(cen0)) * side(ref) > 0;
    var M = mirror ? function (q) { return add(A, flip(sub(M0(q), A))); } : M0;
    var D = function (w) { var r = [w[0] * c - w[1] * s, w[0] * s + w[1] * c]; return mirror ? flip(r) : r; };
    return { M: M, D: D, mirror: mirror };
  }
  function mapAngle(pr, M) {
    var c = pr.c, q0 = [c[0] + Math.cos(pr.a0), c[1] + Math.sin(pr.a0)], q1 = [c[0] + Math.cos(pr.a1), c[1] + Math.sin(pr.a1)], reflex = Math.abs(pr.a1 - pr.a0) > PI + 1e-9;
    var o = {}; for (var k in pr) o[k] = pr[k];
    var C = M(c), A0 = M(q0), A1 = M(q1);
    o.c = C; o.a0 = Math.atan2(A0[1] - C[1], A0[0] - C[0]); o.a1 = Math.atan2(A1[1] - C[1], A1[0] - C[0]);
    while (o.a1 - o.a0 > PI) o.a1 -= 2 * PI;
    while (o.a1 - o.a0 < -PI) o.a1 += 2 * PI;
    if (reflex) o.a1 += o.a1 > o.a0 ? -2 * PI : 2 * PI;
    return o;
  }
  function mapPrim2(pr, M, D) {
    var o = {}, k;
    for (k in pr) o[k] = pr[k];
    if (pr.t === 'angle') return mapAngle(pr, M);
    if (pr.t === 'shape' || pr.t === 'arclab' || pr.t === 'tick') return null;
    ['a', 'b', 'p', 'c'].forEach(function (f) { if (pr[f] && typeof pr[f][0] === 'number') o[f] = M(pr[f]); });
    if (pr.pts) o.pts = pr.pts.map(M);
    if (pr.glow) o.glow = pr.glow.map(M);
    if (pr.t === 'ra') { o.u = D(pr.u); o.v = D(pr.v); }
    if (pr.t === 'text') o.dir = D(pr.dir);
    if (pr.side) o.side = D(pr.side);
    if (pr.offModel) o.offModel = false;
    return o;
  }
  function prismNet(S, L, flatPrims, lenLetter, Pval) {
    var R = S.ring, n = R.length, runs = S.runs, nr = runs.length, sgn = S.sA > 0 ? 1 : -1, att = -1, best = -1;
    runs.forEach(function (rn, i) { if (rn.straight && rn.len > best + 1e-9 && hullEdgeOK(R, rn.k0, sgn)) { best = rn.len; att = i; } });
    var start = att >= 0 ? (att - Math.floor(nr / 2) + nr) % nr : 0, xs = [0], order = [];
    for (var j = 0; j < nr; j++) { var i = (start + j) % nr; order.push(i); xs.push(xs[j] + runs[i].len); }
    var X = xs.map(function (x) { return [x, 0]; }), Y = xs.map(function (x) { return [x, L]; });
    var panels = order.map(function (i, j) { return { pts: [X[j], X[j + 1], Y[j + 1], Y[j]], role: 'lat' }; });
    var mid = [xs[nr] / 2, L / 2], top, bot, q0, q1, A, B, A2, B2, k0, k1;
    if (att >= 0) {
      var ja = order.indexOf(att);
      k0 = runs[att].k0; k1 = (k0 + 1) % n; q0 = R[k0]; q1 = R[k1]; A = X[ja]; B = X[ja + 1]; A2 = Y[ja]; B2 = Y[ja + 1];
    } else {
      var H2 = hull2(R), bi = 0, bl = -1;
      for (var h = 0; h < H2.length; h++) { var d = Math.hypot(H2[(h + 1) % H2.length][0] - H2[h][0], H2[(h + 1) % H2.length][1] - H2[h][1]); if (d > bl) { bl = d; bi = h; } }
      q0 = H2[bi]; q1 = H2[(bi + 1) % H2.length];
      A = [mid[0] - bl / 2, 0]; B = [mid[0] + bl / 2, 0]; A2 = [mid[0] - bl / 2, L]; B2 = [mid[0] + bl / 2, L];
    }
    top = placeMap(R, q0, q1, A, B, mid); bot = placeMap(R, q0, q1, A2, B2, mid);
    var tp = R.map(top.M), bp = R.map(bot.M);
    if (att >= 0) { tp[k0] = A; tp[k1] = B; bp[k0] = A2; bp[k1] = B2; }
    panels.push({ pts: tp, role: 'top' }, { pts: bp, role: 'base' });
    var prims = [];
    flatPrims.forEach(function (pr) { var q = mapPrim2(pr, top.M, top.D); if (q) prims.push(q); });
    prims.push(dim([0, 0], [0, L], LB(lenLetter, L), { side: [-1, 0] }), dim([0, L], [xs[nr], L], LB('P', Pval, 1, true), { side: [0, 1], offModel: true }));
    return { panels: panels, prims: prims, map: top };
  }
  function convHl(parts, lk) {
    var out = [];
    (parts || []).forEach(function (q) { var r = q === 'fill' || q === 'outline' ? 'ends' : q; if (out.indexOf(r) < 0) out.push(r); });
    return out;
  }
  /* cfg: id, name, flat, up (upright: the flat shape is the base), len (length parameter), defs (new defaults), sec(p, n), convex, unusual */
  function prismOf(cfg) {
    var fd = DEF[cfg.flat], lk = cfg.len.k, up = !!cfg.up, fname = cfg.endName || fd.name;
    var params = fd.params.map(function (q) { var c = {}, k; for (k in q) c[k] = q[k]; if (cfg.defs && cfg.defs[q.k] != null) c.def = cfg.defs[q.k]; return c; }).concat([cfg.len]);
    var fp = function (p) { var o = {}; fd.params.forEach(function (q) { o[q.k] = p[q.k]; }); return o; };
    /* the default cross-section is the flat shape's own outline */
    var secOf = cfg.sec || function (p) { return mkSec(rPoly(fd.rings(p)[0])); };
    /* the flat drawing of the end, worked out once for a set of sizes and shared by the 3D view, the net, the angles and calc */
    var memo = { key: null };
    var flat = function (p) {
      var f2 = fill(cfg.flat, fp(p)), key = JSON.stringify(f2);
      if (memo.key !== key) memo = { key: key, f2: f2, base: fd.draw(f2, 96, {}), angs: null };
      if (!memo.angs) memo.angs = newAngles(fd, f2, memo.base);
      return memo;
    };
    /* end area A and perimeter P of the flat shape (and its calc result) */
    var endAP = function (p, u, full) {
      var r = calc(cfg.flat, fp(p), u, full ? { full: true } : {}), A = 0, P = 0;
      r.items.forEach(function (it) { if (it.key === 'A') A = it.value; if (it.key === 'P') P = it.value; });
      return { r: r, A: A, P: P };
    };
    /* an upright prism leaves the worked-out sizes off its top face, so their highlights fall back to the ends */
    var gone = {};
    if (up) fd.draw(fill(cfg.flat, {}), 96, {}).forEach(function (q) { if (q.lab && q.lab.derived && (q.t === 'dim' || q.t === 'ann')) gone['dim:' + q.lab.letter] = 1; });
    var keepHl = function (list) { var f = list.filter(function (h) { return !gone[h]; }); return f.length || !list.length ? f : ['ends']; };
    var hl = { V: ['all'], LA: ['side', 'dim:' + lk], SA: ['all'], A: ['ends'], P: ['ends'], G: ['panels:lat', 'dim:P'], PA: ['panels:all'] };
    Object.keys(fd.hl || {}).forEach(function (k) { if (!hl[k]) hl[k] = convHl(fd.hl[k]); });
    if (up) Object.keys(hl).forEach(function (k) { hl[k] = keepHl(hl[k]); });
    var d = {
      id: cfg.id, name: cfg.name, kind: 'solid', convex: !!cfg.convex, unusual: !!cfg.unusual, from: cfg.flat, how: 'prism', up: up,
      params: params, angleParam: fd.angleParam, rndOrder: fd.rndOrder ? fd.rndOrder.concat([lk]) : undefined,
      validate: function (p) { return fd.validate ? fd.validate(fill(cfg.flat, fp(p))) : null; },
      sec: function (p, n) { return secOf(p, n || 96); },
      mesh: function (p, res) { var S = this.sec(p, seg(res) * 1.5); return secMesh(S, placeOf(S, p[lk], up)); },
      annot: function (p, ctx) {
        var S = this.sec(p, 96), pl = placeOf(S, p[lk], up), t = up ? (ctx && ctx.facing([0, 1, 0]) ? 1 : 0) : (ctx && ctx.facing([0, 0, 1]) ? 1 : 0);
        var P3 = function (q) { return pl.P(q, t); }, D3 = function (w) { return pl.N(w); }, out = emptyAnnot(), all = !!(ctx && ctx.allAngles), fl = flat(p);
        mapPrims(up ? fl.base.filter(function (q) { return !(q.lab && q.lab.derived && (q.t === 'dim' || q.t === 'ann')); }) : fl.base, P3, D3, out, false);
        if (all) mapPrims(fl.angs, P3, D3, out, true);
        var R = S.ring, n = R.length, cands = [];
        R.forEach(function (q, i) {
          var sharp = S.smooth ? i % Math.max(1, Math.floor(n / 24)) === 0 : !(S.curve[(i + n - 1) % n] && S.curve[i] && S.runOf[(i + n - 1) % n] === S.runOf[i]);
          if (sharp) cands.push([pl.P(q, 0), pl.P(q, 1)]);
        });
        out.dims.push({ cands: cands, pref: up ? [1, 0] : [0.6, 1], lab: LB(lk, p[lk]) });
        return out;
      },
      hl: hl,
      calc: function (p, u, ao) {
        var full = !!(ao && ao.full), L = p[lk], e = endAP(p, u, full), A = e.A, P = e.P, out = [];
        e.r.items.forEach(function (it) {
          var c = {}, k;
          for (k in it) c[k] = it[k];
          c.name = fname + ': ' + it.name.charAt(0).toLowerCase() + it.name.slice(1);
          c._hl = keepHl(convHl(it.hl));
          delete c.hl;
          if (full) c.group = 'End shape: ' + (it.group || groupOf(it));
          out.push(c);
        });
        var LN = up ? 'height' : 'length', Vv = A * L;
        out.push(item('Volume (' + (up ? 'base' : 'end') + ' area × ' + LN + ')', 'V', 'A × ' + lk, [v(A) + ' × ' + v(L)], Vv, u, 3),
          item('Lateral area (perimeter × ' + LN + ')', 'LA', 'P × ' + lk, [v(P) + ' × ' + v(L)], P * L, u, 2),
          item('Total surface area', 'SA', 'LA + 2 × A', [v(P * L) + ' + 2 × ' + v(A)], P * L + 2 * A, u, 2));
        if (full) {
          out.push(H(['ends'], areaI('The two ' + (up ? 'base and top' : 'ends') + ' together', 'E', '2 × A', ['2 × ' + v(A)], 2 * A, u, 'E')));
          out = out.concat(capItems(Vv, u));
          out.push(H(['all', 'dim:' + lk], cen('Centroid: halfway along the ' + LN, 'z̄', lk + ' ÷ 2', [v(L) + ' ÷ 2'], L / 2, u, 'cz')));
        }
        return out;
      },
      notes: fd.notes,
      layout: function (p, u) {
        var e = endAP(p, u), A = e.A, P = e.P, L = p[lk];
        return [item('Girth (stretch-out of the side strip, the perimeter of the end)', 'G', 'P', [v(P)], P, u, 1),
          item('Strip area (girth × ' + (up ? 'height' : 'length') + ')', 'LA', 'G × ' + lk, [v(P) + ' × ' + v(L)], P * L, u, 2),
          item('Pattern area (strip + 2 ends)', 'PA', 'G × ' + lk + ' + 2 × A', [v(P) + ' × ' + v(L) + ' + 2 × ' + v(A)], P * L + 2 * A, u, 2)];
      },
      layoutHl: { G: ['panels:lat', 'dim:P'], LA: ['panels:lat', 'dim:' + lk], PA: ['panels:all'] },
      net: function (p, res) { return prismNet(this.sec(p, (res && res.circle) || 128), p[lk], flat(p).base, lk, endAP(p, 'cm').P); }
    };
    NA[cfg.id] = function (p, nb) {
      if (!nb.map) return [];
      return flat(p).angs.map(function (q) { return q.t === 'ra' ? mapPrim2(q, nb.map.M, nb.map.D) : mapAngle(q, nb.map.M); });
    };
    ADD(d);
  }
  var LEN = function (k, name, def, rnd) { return P(k, name, k, def, rnd); };
  prismOf({ id: 'right-triangle-prism', name: 'Right triangle prism (wedge)', flat: 'right-triangle', convex: true, len: LEN('l', 'Length', 10, [4, 20]), defs: { b: 6, h: 4 },
    sec: function (p) { return mkSec(rPoly([[0, 0], [p.b, 0], [0, -p.h]])); } });
  prismOf({ id: 'equilateral-triangle-prism', name: 'Equilateral triangle prism', flat: 'equilateral-triangle', convex: true, len: LEN('l', 'Length', 10, [4, 20]), defs: { s: 6 } });
  prismOf({ id: 'scalene-triangle-prism', name: 'Scalene triangle prism', flat: 'scalene-triangle', convex: true, len: LEN('l', 'Length', 12, [4, 20]), defs: { a: 7, b: 6.5, c: 7.5 } });
  prismOf({ id: 'parallelogram-prism', name: 'Parallelogram prism', flat: 'parallelogram', convex: true, len: LEN('l', 'Length', 10, [4, 20]), defs: { b: 8, h: 4, s: 5 } });
  prismOf({ id: 'rhombus-prism', name: 'Rhombus prism', flat: 'rhombus', convex: true, up: true, endName: 'Rhombus base', len: LEN('h', 'Height', 3, [2, 12]), defs: { d1: 10, d2: 7 } });
  prismOf({ id: 'trapezoid-prism', name: 'Trapezoid prism', flat: 'trapezoid', convex: true, len: LEN('l', 'Length', 12, [4, 24]), defs: { a: 4, b: 10, h: 4 } });
  prismOf({ id: 'kite-prism', name: 'Kite prism', flat: 'kite', convex: true, up: true, endName: 'Kite base', len: LEN('h', 'Height', 3, [2, 12]), defs: { d1: 12, d2: 10, p: 4 } });
  prismOf({ id: 'pentagonal-prism', name: 'Pentagonal prism', flat: 'pentagon', convex: true, up: true, endName: 'Pentagon base', len: LEN('h', 'Height', 10, [3, 20]), defs: { s: 4 } });
  prismOf({ id: 'octagonal-prism', name: 'Octagonal prism', flat: 'octagon', convex: true, up: true, endName: 'Octagon base', len: LEN('h', 'Height', 10, [3, 20]), defs: { s: 3 } });
  prismOf({ id: 'elliptic-cylinder', name: 'Elliptic cylinder (oval tank)', flat: 'ellipse', convex: true, up: true, endName: 'Ellipse base', len: LEN('h', 'Height', 10, [3, 20]), defs: { a: 6, b: 4 },
    sec: function (p, n) {
      var k = Math.max(48, Math.round(n)), pts = DEF.ellipse.rings(p, k)[0];
      return mkSec([{ pts: pts.concat([pts[0]]), curve: true, len: ramanujan(p.a, p.b) }], true, ramanujan(p.a, p.b));
    } });
  prismOf({ id: 'half-cylinder', name: 'Half cylinder', flat: 'semicircle', convex: true, endName: 'Semicircle end', len: LEN('l', 'Length', 12, [4, 24]), defs: { r: 4 },
    sec: function (p, n) { return mkSec([rArc([0, 0], p.r, 0, 180, n), rLine([-p.r, 0], [p.r, 0])]); } });
  prismOf({ id: 'quarter-cylinder', name: 'Quarter cylinder (quarter round)', flat: 'quarter-circle', convex: true, endName: 'Quarter circle end', len: LEN('l', 'Length', 12, [4, 24]), defs: { r: 4 },
    sec: function (p, n) { return mkSec([rLine([0, 0], [p.r, 0]), rArc([0, 0], p.r, 0, 90, n), rLine([0, -p.r], [0, 0])]); } });
  prismOf({ id: 'sector-prism', name: 'Sector prism (wedge of a cylinder)', flat: 'sector', convex: false, up: true, endName: 'Sector base', len: LEN('h', 'Height', 3, [2, 12]), defs: { r: 6, t: 120 },
    sec: function (p, n) { return mkSec([rLine([0, 0], [p.r, 0]), rArc([0, 0], p.r, 0, p.t, n), rLine(pol([0, 0], p.r, p.t), [0, 0])]); } });
  prismOf({ id: 'stadium-prism', name: 'Stadium prism (obround tank)', flat: 'stadium', convex: true, up: true, unusual: true, endName: 'Stadium base', len: LEN('h', 'Height', 40, [10, 200]), defs: {},
    sec: function (p, n) {
      var h = p.l / 2, r = p.r, A1 = rArc([h, 0], r, -90, 90, n), A2 = rArc([-h, 0], r, 90, 270, n);
      return mkSec([A1, rLine([h, -r], [-h, -r]), A2, rLine([-h, r], [h, r])], true, 2 * p.l + 2 * PI * r);
    } });
  prismOf({ id: 'reuleaux-prism', name: 'Reuleaux prism', flat: 'reuleaux', convex: true, up: true, unusual: true, endName: 'Reuleaux base', len: LEN('h', 'Height', 30, [10, 150]), defs: {},
    sec: function (p, n) { var V = reuleauxPts(p.w), w = p.w; return mkSec([rArc(V[2], w, 240, 300, n), rArc(V[0], w, 0, 60, n), rArc(V[1], w, 120, 180, n)]); } });
  prismOf({ id: 'ring-sector-prism', name: 'Ring sector prism (curved plate)', flat: 'ring-sector', convex: false, up: true, unusual: true, endName: 'Ring sector base', len: LEN('h', 'Thickness', 20, [5, 100]), defs: {},
    sec: function (p, n) { return mkSec([rArc([0, 0], p.R, 0, p.t, n), rLine(pol([0, 0], p.R, p.t), pol([0, 0], p.r, p.t)), rArc([0, 0], p.r, p.t, 0, n), rLine(pol([0, 0], p.r, 0), pol([0, 0], p.R, 0))]); } });
  prismOf({ id: 'star-prism', name: 'Star prism', flat: 'star', convex: false, up: true, unusual: true, endName: 'Star base', len: LEN('h', 'Height', 20, [5, 100]), defs: {},
    sec: function (p) { return mkSec(rPoly(starRing(p))); } });
  prismOf({ id: 'lune-prism', name: 'Lune prism (crescent plate)', flat: 'lune', convex: false, up: true, unusual: true, endName: 'Lune base', len: LEN('h', 'Thickness', 20, [5, 100]), defs: {},
    sec: function (p, n) {
      var g = luneGeo(p), Lo = (360 - 2 * g.al) / 360 * 2 * PI * p.R, Li = 2 * g.be / 360 * 2 * PI * p.r;
      var big = { pts: arc([0, 0], p.R, g.al, 360 - g.al, n), curve: true, len: Lo }, small = { pts: arc([p.e, 0], p.r, 180 + g.be, 180 - g.be, n), curve: true, len: Li };
      small.pts[0] = big.pts[big.pts.length - 1]; small.pts[small.pts.length - 1] = big.pts[0];
      return mkSec([big, small]);
    } });

  /* ---- pyramids on the regular polygons and the rectangle ---- */
  function pyrBase(p, cfg) {
    if (cfg.rect) { var X = p.l / 2, Z = p.w / 2; return [[-X, 0, -Z], [X, 0, -Z], [X, 0, Z], [-X, 0, Z]]; }
    return polyBase(cfg.n, p.s);
  }
  function pyramidOf(cfg) {
    var rect = !!cfg.rect, n = rect ? 4 : cfg.n;
    var hl = rect ? { l1: ['dim:l₁', 'dim:h', 'dim:w'], l2: ['dim:l₂', 'dim:h', 'dim:l'], e: ['dim:e', 'dim:h'], B: ['bottom', 'dim:l', 'dim:w'], V: ['all'], LA: ['side', 'dim:l₁', 'dim:l₂'], SA: ['all'] }
      : { a: ['dim:s'], l: ['dim:l', 'dim:h'], e: ['dim:e', 'dim:h'], B: ['bottom', 'dim:s'], P: ['bottom', 'dim:s'], V: ['all'], LA: ['side', 'dim:l'], SA: ['all'] };
    var d = {
      id: cfg.id, name: cfg.name, kind: 'solid', convex: true, from: cfg.flat, how: 'pyramid', params: cfg.params,
      mesh: function (p) {
        var m = new Mesh(), q = pyrBase(p, cfg).map(function (v3) { return m.add(v3); }), a = m.add([0, p.h, 0]);
        m.face(q.slice(), [0, -1, 0], null, null);
        for (var i = 0; i < n; i++) { var j = (i + 1) % n, c = mul(add(add(m.v[q[i]], m.v[q[j]]), m.v[a]), 1 / 3); m.face([q[i], q[j], a], sub(c, [0, p.h / 4, 0]), null, 'side'); }
        return m;
      },
      annot: function (p, ctx) {
        var B = pyrBase(p, cfg), T = [0, p.h, 0], O = [0, 0, 0], out = emptyAnnot(), f = 0, bz = -Infinity, o0 = ctx ? ctx.view(O) : [0, 0, 0];
        for (var i = 0; i < n; i++) {
          var Mi = mul(add(B[i], B[(i + 1) % n]), 0.5), nn = cross(sub(B[(i + 1) % n], B[i]), sub(T, B[i]));
          if (dot(nn, Mi) < 0) nn = mul(nn, -1);
          var z = ctx ? ctx.view(nrm(nn))[2] - o0[2] : Mi[2];
          if (z > bz) { bz = z; f = i; }
        }
        var C0 = B[f], C1 = B[(f + 1) % n], M = mul(add(C0, C1), 0.5), along = nrm(sub(C1, C0)), edges = [];
        for (var k = 0; k < n; k++) edges.push([B[k], B[(k + 1) % n]]);
        if (rect) {
          out.dims.push({ cands: edges.filter(function (e) { return Math.abs(e[0][2] - e[1][2]) < 1e-9; }), pref: [0, 1], lab: LB('l', p.l) },
            { cands: edges.filter(function (e) { return Math.abs(e[0][0] - e[1][0]) < 1e-9; }), pref: [0.6, 1], lab: LB('w', p.w) });
          var onL = Math.abs(C0[2] - C1[2]) < 1e-9, ls = onL ? Math.hypot(p.w / 2, p.h) : Math.hypot(p.l / 2, p.h);
          out.lines.push({ a: M, b: T, lab: LB(onL ? 'l₁' : 'l₂', ls, 1, true), at: 0.3 });
        } else {
          out.dims.push({ cands: edges, pref: [0, 1], lab: LB('s', p.s) });
          out.lines.push({ a: M, b: T, lab: LB('l', Math.hypot(p.s / (2 * Math.tan(PI / n)), p.h), 1, true), at: 0.3 });
        }
        out.lines.push({ a: O, b: T, lab: LB('h', p.h), at: 0.55 });
        out.ras.push({ p: O, u: nrm(M), v: [0, 1, 0] }, { p: M, u: along, v: nrm(sub(T, M)), derived: true });
        out.dots.push(O);
        out.glows.push({ pts: [C1, T], letter: 'e' });
        if (ctx && ctx.allAngles) {
          var aM = Math.atan2(p.h, len(M)) / D2R, aC = Math.atan2(p.h, len(C1)) / D2R, ls2 = len(sub(T, M)), half = len(sub(C1, M));
          out.angs.push({ v: M, a: O, b: T, lab: angLab('α', aM, true) }, { v: C1, a: O, b: T, lab: angLab('β', aC, true) }, { v: T, a: C0, b: C1, lab: angLab('φ', 2 * Math.atan2(half, ls2) / D2R, true) });
          out.auxs.push([M, O], [C1, O]);
        }
        return out;
      },
      hl: hl,
      calc: function (p, u, ao) { return cfg.calc(p, u, !!(ao && ao.full)); },
      layout: function (p, u) { var r = cfg.calc(p, u, false); return r.filter(function (it) { return it.key === 'SA' || it.key === 'LA' || it.key === 'e' || it.key === 'l' || it.key === 'l1' || it.key === 'l2'; }).map(function (it) { if (it.key === 'SA') { it.name = 'Pattern area (base + ' + n + ' triangles)'; } return it; }); },
      layoutHl: { SA: ['panels:all'], LA: ['panels:lat'], e: ['dim:e'], l: ['dim:l'], l1: ['dim:l₁'], l2: ['dim:l₂'] },
      net: function (p) {
        var B = pyrBase(p, cfg), T = [0, p.h, 0], es = B.map(function (q) { return len(sub(q, T)); }), gam = [], G = 0;
        for (var i = 0; i < n; i++) { var s = len(sub(B[(i + 1) % n], B[i])); gam.push(Math.acos(Math.max(-1, Math.min(1, (es[i] * es[i] + es[(i + 1) % n] * es[(i + 1) % n] - s * s) / (2 * es[i] * es[(i + 1) % n])))) / D2R); G += gam[i]; }
        var Pp = [], cum = 90 + G / 2;
        for (var k = 0; k <= n; k++) { Pp.push(pol([0, 0], es[k % n], cum)); if (k < n) cum -= gam[k]; }
        var O2 = [0, 0], panels = [];
        for (var j = 0; j < n; j++) panels.push({ pts: [O2, Pp[j], Pp[j + 1]], role: 'lat' });
        var mI = Math.floor(n / 2), base2 = B.map(function (q) { return [q[0], q[2]]; }), mp = placeMap(base2, base2[mI], base2[(mI + 1) % n], Pp[mI], Pp[mI + 1], O2);
        var bp = base2.map(mp.M);
        bp[mI] = Pp[mI]; bp[(mI + 1) % n] = Pp[mI + 1];
        panels.push({ pts: bp, role: 'base' });
        var Mm = mul(add(Pp[mI], Pp[mI + 1]), 0.5), sL = rect ? (mI % 2 === 0 ? 'l' : 'w') : 's', sV = len(sub(B[(mI + 1) % n], B[mI]));
        var ls = len(Mm), lLet = rect ? (mI % 2 === 0 ? 'l₁' : 'l₂') : 'l';
        var prims = [dotP(O2), ann(O2, Mm, LB(lLet, ls, 1, true), { dash: true, at: 0.45 }), ra(Mm, nrm(sub(Pp[mI + 1], Mm)), nrm(sub(O2, Mm)), { derived: true }),
          dim(O2, Pp[0], LB('e', es[0], 1, true))];
        var opp = (mI + Math.floor(n / 2)) % n;
        prims.push(dim(bp[opp], bp[(opp + 1) % n], LB(sL, sV), { offModel: true }));
        if (rect) { var o2 = (mI + 1) % n; if (o2 !== opp) prims.push(dim(bp[o2], bp[(o2 + 1) % n], LB(o2 % 2 === 0 ? 'l' : 'w', len(sub(B[(o2 + 1) % n], B[o2]))), { offModel: true })); }
        return { panels: panels, prims: prims, fan: { Pp: Pp, mI: mI } };
      }
    };
    NA[cfg.id] = function (p, nb) {
      var Pp = nb.fan.Pp, m = nb.fan.mI, O2 = [0, 0], a = Pp[m], b = Pp[m + 1];
      var A1 = Math.acos(Math.max(-1, Math.min(1, dot(nrm(sub(b, a)), nrm(sub(O2, a)))))) / D2R, phi = 180 - 2 * A1;
      return [angP(O2, a, b, 'φ', phi, true), angP(a, b, O2, 'ψ', A1, true), angP(b, O2, a, 'ψ', A1, true)];
    };
    ADD(d);
  }
  function regPyrCalc(n, fname) {
    return function (p, u, full) {
      var s = p.s, h = p.h, f = 180 / n, ap = s / (2 * Math.tan(PI / n)), R = s / (2 * Math.sin(PI / n)), Pm = n * s, A = Pm * ap / 2, l = Math.hypot(ap, h), e = Math.hypot(R, h);
      var out = [H(['bottom', 'dim:s'], lenI('Perimeter of the base', 'P', n + ' × s', [n + ' × ' + v(s)], Pm, u)),
        lenI('Apothem of the base (centre to the middle of a side)', 'a', 's ÷ (2 × tan(180° ÷ ' + n + '))', [v(s) + ' ÷ (2 × tan ' + v(f) + '°)'], ap, u),
        areaI('Base area (' + fname + ')', 'B', '½ × P × a', ['½ × ' + v(Pm) + ' × ' + v(ap)], A, u),
        lenI('Slant height (middle of a face)', 'l', '√(a² + h²)', ['√(' + v(ap) + '² + ' + v(h) + '²)'], l, u),
        H(['dim:e'], lenI('Radius of the base to a corner', 'R', 's ÷ (2 × sin(180° ÷ ' + n + '))', [v(s) + ' ÷ (2 × sin ' + v(f) + '°)'], R, u)),
        lenI('Sloped edge (corner to the top)', 'e', '√(R² + h²)', ['√(' + v(R) + '² + ' + v(h) + '²)'], e, u),
        item('Volume', 'V', '(B × h) ÷ 3', ['(' + v(A) + ' × ' + v(h) + ') ÷ 3'], A * h / 3, u, 3),
        item('Lateral area (' + n + ' triangles)', 'LA', '½ × P × l', ['½ × ' + v(Pm) + ' × ' + v(l)], Pm * l / 2, u, 2),
        item('Total surface area', 'SA', 'B + LA', [v(A) + ' + ' + v(Pm * l / 2)], A + Pm * l / 2, u, 2)];
      if (full) {
        out.push(H(['dim:s', 'dim:l'], areaI('Area of one face (triangle)', 'Af', '½ × s × l', ['½ × ' + v(s) + ' × ' + v(l)], s * l / 2, u)),
          H(['ang:α', 'dim:h'], angItem('Face slope α (face to base)', 'α', 'tan⁻¹(h ÷ a)', ['tan⁻¹(' + v(h) + ' ÷ ' + v(ap) + ')'], Math.atan2(h, ap) / D2R, 'alpha')),
          H(['ang:β', 'dim:h'], angItem('Edge slope β (sloped edge to base)', 'β', 'tan⁻¹(h ÷ R)', ['tan⁻¹(' + v(h) + ' ÷ ' + v(R) + ')'], Math.atan2(h, R) / D2R, 'beta')),
          H(['ang:φ', 'dim:s', 'dim:l'], angItem('Apex angle φ of a face', 'φ', '2 × tan⁻¹((s ÷ 2) ÷ l)', ['2 × tan⁻¹(' + v(s / 2) + ' ÷ ' + v(l) + ')'], 2 * Math.atan2(s / 2, l) / D2R, 'apex')),
          H(['dim:s', 'dim:l'], angItem('Base angle ψ of a face', 'ψ', 'tan⁻¹(l ÷ (s ÷ 2))', ['tan⁻¹(' + v(l) + ' ÷ ' + v(s / 2) + ')'], Math.atan2(l, s / 2) / D2R, 'psi')),
          H([], angItem('Interior angle of the base', '∠A', '(' + n + ' − 2) × 180 ÷ ' + n, ['(' + n + ' − 2) × 180 ÷ ' + n], (n - 2) * 180 / n, 'angA')),
          H(['all', 'dim:h'], cen('Centroid height above the base', 'ȳ', 'h ÷ 4', [v(h) + ' ÷ 4'], h / 4, u, 'cy')));
        out = out.concat(capItems(A * h / 3, u));
      }
      return out;
    };
  }
  pyramidOf({ id: 'triangular-pyramid', name: 'Triangular pyramid', flat: 'equilateral-triangle', n: 3, params: [P('s', 'Base side', 's', 6, [3, 16]), P('h', 'Height', 'h', 5, [2, 16])], calc: regPyrCalc(3, 'equilateral triangle') });
  pyramidOf({ id: 'pentagonal-pyramid', name: 'Pentagonal pyramid', flat: 'pentagon', n: 5, params: [P('s', 'Base side', 's', 4, [2, 12]), P('h', 'Height', 'h', 6, [2, 16])], calc: regPyrCalc(5, 'regular pentagon') });
  pyramidOf({ id: 'hexagonal-pyramid', name: 'Hexagonal pyramid', flat: 'hexagon', n: 6, params: [P('s', 'Base side', 's', 3, [2, 10]), P('h', 'Height', 'h', 6, [2, 16])], calc: regPyrCalc(6, 'regular hexagon') });
  pyramidOf({ id: 'octagonal-pyramid', name: 'Octagonal pyramid', flat: 'octagon', n: 8, params: [P('s', 'Base side', 's', 3, [2, 8]), P('h', 'Height', 'h', 6, [2, 16])], calc: regPyrCalc(8, 'regular octagon') });
  pyramidOf({ id: 'rectangular-pyramid', name: 'Rectangular pyramid', flat: 'rectangle', rect: true,
    params: [P('l', 'Base length', 'l', 8, [3, 16]), P('w', 'Base width', 'w', 6, [3, 14]), P('h', 'Height', 'h', 4, [2, 16])],
    calc: function (p, u, full) {
      var l = p.l, w = p.w, h = p.h, l1 = Math.hypot(w / 2, h), l2 = Math.hypot(l / 2, h), db = Math.hypot(l, w), e = Math.hypot(db / 2, h), LA = l * l1 + w * l2;
      var out = [areaI('Base area', 'B', 'l × w', [v(l) + ' × ' + v(w)], l * w, u),
        lenI('Slant height of the faces on the long sides', 'l₁', '√((w ÷ 2)² + h²)', ['√(' + v(w / 2) + '² + ' + v(h) + '²)'], l1, u, 'l1'),
        lenI('Slant height of the faces on the short sides', 'l₂', '√((l ÷ 2)² + h²)', ['√(' + v(l / 2) + '² + ' + v(h) + '²)'], l2, u, 'l2'),
        H(['dim:l', 'dim:w'], lenI('Base diagonal', 'db', '√(l² + w²)', ['√(' + v(l) + '² + ' + v(w) + '²)'], db, u)),
        lenI('Sloped edge (corner to the top)', 'e', '√((db ÷ 2)² + h²)', ['√(' + v(db / 2) + '² + ' + v(h) + '²)'], e, u),
        item('Volume', 'V', '(l × w × h) ÷ 3', ['(' + v(l) + ' × ' + v(w) + ' × ' + v(h) + ') ÷ 3'], l * w * h / 3, u, 3),
        item('Lateral area (4 triangles)', 'LA', 'l × l₁ + w × l₂', [v(l) + ' × ' + v(l1) + ' + ' + v(w) + ' × ' + v(l2)], LA, u, 2),
        item('Total surface area', 'SA', 'l × w + LA', [v(l) + ' × ' + v(w) + ' + ' + v(LA)], l * w + LA, u, 2)];
      if (full) {
        out.push(H(['ang:α', 'dim:h', 'dim:w'], angItem('Slope of the faces on the long sides', 'α₁', 'tan⁻¹(h ÷ (w ÷ 2))', ['tan⁻¹(' + v(h) + ' ÷ ' + v(w / 2) + ')'], Math.atan2(h, w / 2) / D2R, 'alpha1')),
          H(['dim:h', 'dim:l'], angItem('Slope of the faces on the short sides', 'α₂', 'tan⁻¹(h ÷ (l ÷ 2))', ['tan⁻¹(' + v(h) + ' ÷ ' + v(l / 2) + ')'], Math.atan2(h, l / 2) / D2R, 'alpha2')),
          H(['ang:β', 'dim:h'], angItem('Edge slope β (sloped edge to base, the hip angle)', 'β', 'tan⁻¹(h ÷ (db ÷ 2))', ['tan⁻¹(' + v(h) + ' ÷ ' + v(db / 2) + ')'], Math.atan2(h, db / 2) / D2R, 'beta')),
          H(['dim:l', 'dim:l₁'], angItem('Apex angle of a long-side face', 'φ₁', '2 × tan⁻¹((l ÷ 2) ÷ l₁)', ['2 × tan⁻¹(' + v(l / 2) + ' ÷ ' + v(l1) + ')'], 2 * Math.atan2(l / 2, l1) / D2R, 'apex1')),
          H(['dim:w', 'dim:l₂'], angItem('Apex angle of a short-side face', 'φ₂', '2 × tan⁻¹((w ÷ 2) ÷ l₂)', ['2 × tan⁻¹(' + v(w / 2) + ' ÷ ' + v(l2) + ')'], 2 * Math.atan2(w / 2, l2) / D2R, 'apex2')),
          H(['dim:l', 'dim:l₁'], areaI('Area of a long-side face', 'A1', '½ × l × l₁', ['½ × ' + v(l) + ' × ' + v(l1)], l * l1 / 2, u)),
          H(['dim:w', 'dim:l₂'], areaI('Area of a short-side face', 'A2', '½ × w × l₂', ['½ × ' + v(w) + ' × ' + v(l2)], w * l2 / 2, u)),
          H(['all', 'dim:h'], cen('Centroid height above the base', 'ȳ', 'h ÷ 4', [v(h) + ' ÷ 4'], h / 4, u, 'cy')));
        out = out.concat(capItems(l * w * h / 3, u));
      }
      return out;
    } });

  /* ---- the 3D equivalents of each flat shape ---- */
  var SOLIDS_OF = {
    square: [['cube', 'prism', { s: 's' }], ['rectangular-prism', 'prism', { l: 's', w: 's' }], ['square-pyramid', 'pyramid', { b: 's' }]],
    rectangle: [['rectangular-prism', 'prism', { l: 'l', w: 'w' }], ['rectangular-pyramid', 'pyramid', { l: 'l', w: 'w' }], ['cylinder', 'revolve', { r: 'w', h: 'l' }]],
    'right-triangle': [['right-triangle-prism', 'prism', { b: 'b', h: 'h' }], ['cone', 'revolve', { r: 'b', h: 'h' }]],
    'equilateral-triangle': [['equilateral-triangle-prism', 'prism', { s: 's' }], ['triangular-pyramid', 'pyramid', { s: 's' }], ['tetrahedron', 'related', { a: 's' }]],
    'isosceles-triangle': [['triangular-prism', 'prism', { b: 'b', h: 'h' }], ['cone', 'revolve', { r: function (p) { return p.b / 2; }, h: 'h' }]],
    'scalene-triangle': [['scalene-triangle-prism', 'prism', { a: 'a', b: 'b', c: 'c' }]],
    parallelogram: [['parallelogram-prism', 'prism', { b: 'b', h: 'h', s: 's' }]],
    rhombus: [['rhombus-prism', 'prism', { d1: 'd1', d2: 'd2' }]],
    trapezoid: [['trapezoid-prism', 'prism', { a: 'a', b: 'b', h: 'h' }], ['pyramid-frustum', 'related', { a: 'a', b: 'b', h: 'h' }], ['frustum', 'revolve', { R: function (p) { return p.b / 2; }, r: function (p) { return p.a / 2; }, h: 'h' }]],
    kite: [['kite-prism', 'prism', { d1: 'd1', d2: 'd2', p: 'p' }]],
    circle: [['cylinder', 'prism', { r: 'r' }], ['cone', 'pyramid', { r: 'r' }], ['sphere', 'revolve', { r: 'r' }]],
    semicircle: [['half-cylinder', 'prism', { r: 'r' }], ['sphere', 'revolve', { r: 'r' }], ['hemisphere', 'related', { r: 'r' }]],
    'quarter-circle': [['quarter-cylinder', 'prism', { r: 'r' }], ['hemisphere', 'revolve', { r: 'r' }]],
    sector: [['sector-prism', 'prism', { r: 'r', t: 't' }], ['cone', 'roll', { r: function (p) { return p.r * p.t / 360; }, h: function (p) { var rc = p.r * p.t / 360; return Math.sqrt(Math.max(0, p.r * p.r - rc * rc)); } }]],
    annulus: [['pipe', 'prism', { R: 'R', r: 'r' }], ['torus', 'revolve', { R: function (p) { return (p.R + p.r) / 2; }, r: function (p) { return (p.R - p.r) / 2; } }]],
    ellipse: [['elliptic-cylinder', 'prism', { a: 'a', b: 'b' }]],
    pentagon: [['pentagonal-prism', 'prism', { s: 's' }], ['pentagonal-pyramid', 'pyramid', { s: 's' }], ['dodecahedron', 'related', { a: 's' }]],
    hexagon: [['hexagonal-prism', 'prism', { s: 's' }], ['hexagonal-pyramid', 'pyramid', { s: 's' }]],
    octagon: [['octagonal-prism', 'prism', { s: 's' }], ['octagonal-pyramid', 'pyramid', { s: 's' }]],
    stadium: [['stadium-prism', 'prism', { l: 'l', r: 'r' }], ['capsule', 'revolve', { r: 'r', l: 'l' }]],
    reuleaux: [['reuleaux-prism', 'prism', { w: 'w' }]],
    'ring-sector': [['ring-sector-prism', 'prism', { R: 'R', r: 'r', t: 't' }], ['frustum', 'roll', {
      R: function (p) { return p.R * p.t / 360; }, r: function (p) { return p.r * p.t / 360; },
      h: function (p) { var d = (p.R - p.r) * p.t / 360, l = p.R - p.r; return Math.sqrt(Math.max(0, l * l - d * d)); } }]],
    star: [['star-prism', 'prism', { n: 'n', R: 'R', r: 'r' }]],
    lune: [['lune-prism', 'prism', { R: 'R', r: 'r', e: 'e' }]]
  };
  var HOW = { prism: 'Prism: the flat shape pushed straight out (extruded)', pyramid: 'Pyramid or cone: sloped sides from the shape up to a point', revolve: 'Spun around an axis (a solid of revolution)',
    roll: 'Rolled up: this flat shape is the pattern for the solid', related: 'Related solid with the same shape of face' };
  function solidsOf(flatId, fp) {
    var list = SOLIDS_OF[flatId];
    if (!list) return [];
    var f = fp ? fill(flatId, fp) : defaults(flatId);
    return list.map(function (e) {
      var sid = e[0], p = defaults(sid), ok = true;
      Object.keys(e[2]).forEach(function (k) { var m = e[2][k], val = typeof m === 'function' ? m(f) : f[m]; if (isFinite(val) && val > 0) p[k] = val; else ok = false; });
      var good = ok && !validate(sid, p);
      return { id: sid, how: e[1], text: HOW[e[1]], name: DEF[sid].name, params: good ? p : defaults(sid), carried: good, added: !!DEF[sid].added };
    });
  }
  function flatOf(solidId) {
    var out = [];
    Object.keys(SOLIDS_OF).forEach(function (f) { SOLIDS_OF[f].forEach(function (e) { if (e[0] === solidId) out.push({ id: f, how: e[1], text: HOW[e[1]] }); }); });
    return out;
  }

  /* ---------- drawing the added 3D annotations: helper lines, labels at points, angle arcs ---------- */
  /* obstacles for placing marks and labels: the canvas label boxes (looked up through a grid of 64 px cells, indexed as they
     are added) and the leaders (one segment each). A leader blocks like a 3 px square at each of its inner sample points,
     one every 6 px or less, which is what keeps later labels and arcs off it. */
  var GRID = 64;
  function gridOf(cv) {
    var g = cv._grid || (cv._grid = { n: 0, cells: {} });
    for (; g.n < cv.boxes.length; g.n++) {
      var b = cv.boxes[g.n], i0 = Math.floor(b[0] / GRID), i1 = Math.floor((b[0] + b[2]) / GRID), j0 = Math.floor(b[1] / GRID), j1 = Math.floor((b[1] + b[3]) / GRID);
      for (var i = i0; i <= i1; i++) for (var j = j0; j <= j1; j++) (g.cells[i + ',' + j] || (g.cells[i + ',' + j] = [])).push(b);
    }
    return g;
  }
  function boxesIn(cv, x0, y0, x1, y1) {
    var g = gridOf(cv), seen = [], out = [];
    for (var i = Math.floor(x0 / GRID); i <= Math.floor(x1 / GRID); i++) for (var j = Math.floor(y0 / GRID); j <= Math.floor(y1 / GRID); j++) {
      (g.cells[i + ',' + j] || []).forEach(function (b) { if (seen.indexOf(b) < 0) { seen.push(b); out.push(b); } });
    }
    return out;
  }
  function segSamples(sg) { var out = []; for (var s = 1; s < sg.n; s++) { var c = lerp(sg.a, sg.b, s / sg.n); out.push([c[0] - 1.5, c[1] - 1.5, 3, 3]); } return out; }
  function segBlocksBox(sg, b) {
    if (Math.max(sg.a[0], sg.b[0]) + 1.5 <= b[0] || Math.min(sg.a[0], sg.b[0]) - 1.5 >= b[0] + b[2] || Math.max(sg.a[1], sg.b[1]) + 1.5 <= b[1] || Math.min(sg.a[1], sg.b[1]) - 1.5 >= b[1] + b[3]) return false;
    return segSamples(sg).some(function (q) { return b[0] < q[0] + q[2] && q[0] < b[0] + b[2] && b[1] < q[1] + q[3] && q[1] < b[1] + b[3]; });
  }
  function boxHit(cv, pts) {
    /* bounding box of the arc first, then only the boxes near it, point by point */
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    pts.forEach(function (q) { if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0]; if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1]; });
    var near = boxesIn(cv, x0 - 1, y0 - 1, x1 + 1, y1 + 1).filter(function (b) { return b[0] - 1 < x1 && b[0] + b[2] + 1 > x0 && b[1] - 1 < y1 && b[1] + b[3] + 1 > y0; });
    (cv.segs || []).forEach(function (sg) { near = near.concat(segSamples(sg)); });
    if (!near.length) return false;
    return pts.some(function (q) { return near.some(function (b) { return q[0] > b[0] - 1 && q[0] < b[0] + b[2] + 1 && q[1] > b[1] - 1 && q[1] < b[1] + b[3] + 1; }); });
  }
  function ang3(an, K, o) {
    /* an angle with no label (a plain square-corner box) is drawn whenever angles are */
    var cv = K.cv, S = K.S, tv = K.toView, sc = K.sc, hp = K.H && an.lab ? hlDim(o, an.lab.letter, 'ang') : null, txt = an.lab ? labelText(an.lab, o) : '';
    if (txt === null && !hp) return;
    var V = an.v, u1 = nrm(sub(an.a, V)), u2 = nrm(sub(an.b, V)), c = Math.max(-1, Math.min(1, dot(u1, u2))), psi = Math.acos(c);
    var w = sub(u2, mul(u1, c));
    w = len(w) < 1e-12 ? [0, 0, 0] : nrm(w);
    var sweep = an.reflex ? 2 * PI - psi : psi, sg = an.reflex ? -1 : 1, lim = 0.45 * Math.min(len(sub(an.a, V)), len(sub(an.b, V)));
    var Vs = S(tv(V));
    var dirAt = function (t) { return add(mul(u1, Math.cos(t)), mul(w, sg * Math.sin(t))); };
    var arcPts = function (rho) { var pts = []; for (var i = 0; i <= 28; i++) pts.push(S(tv(add(V, mul(dirAt(sweep * i / 28), rho))))); return pts; };
    var rho0 = Math.min(22 / sc, lim), pts = null, rho = rho0, tries = [1, 0.75, 1.3, 0.55, 1.6];
    for (var k = 0; k < tries.length; k++) { var r2 = Math.min(rho0 * tries[k], lim), pp = arcPts(r2); if (!boxHit(cv, pp)) { pts = pp; rho = r2; break; } }
    if (!pts) pts = arcPts(rho0);
    var mid = add(V, mul(dirAt(sweep / 2), rho)), hidden = K.occluded(tv(mid), null), Ms = S(tv(mid));
    if (Math.abs(psi / D2R - 90) < 0.05 && !an.reflex) {
      var k2 = Math.min(11 / sc, lim), P0 = tv(V), U = sub(tv(add(V, mul(u1, k2))), P0), W = sub(tv(add(V, mul(u2, k2))), P0);
      drawRA(cv, S(P0), mul(S(U), 1 / 11), mul(S(W), 1 / 11), 11, txt === null ? null : hidden, hp);
    } else {
      if (txt !== null) cv.path('mark', pts, attrsLine(COL.dim, 1.5, hidden ? '3 3' : null), false, 'angle');
      if (hp) cv.hlLine(hp, [pts]);
    }
    if (txt) {
      var dv = sub(Ms, Vs), rp = len(dv);
      dv = rp < 1e-9 ? [0, -1] : mul(dv, 1 / rp);
      var bx = angLabelNear(cv, Vs, Ms, dv, txt, rp + 5, o);
      if (hp) cv.hlBox(hp, bx);
    }
  }
  /* an angle label kept with its own corner, so a learner never reads it as another corner's angle.
     Pass 1: spots round the arc bisector close to the arc, where the label's own corner is the nearest corner.
     Pass 2 (a crowded or tiny face): outside the shape, on the side away from the middle of the drawing, with a leader.
     Pass 3: further out along the bisector, with a leader. A leader never runs under another label box.
     The leader is a 1.5 px line in the arc colour from the label box to the arc midpoint, with a dot of radius 2. */
  function segHitsBox(p, q, b) {
    var x0 = b[0] + 1, y0 = b[1] + 1, x1 = b[0] + b[2] - 1, y1 = b[1] + b[3] - 1, t0 = 0, t1 = 1, dx = q[0] - p[0], dy = q[1] - p[1];
    var cl = function (pp, qq) {
      if (pp === 0) return qq >= 0;
      var r = qq / pp;
      if (pp < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
      return true;
    };
    return cl(-dx, p[0] - x0) && cl(dx, x1 - p[0]) && cl(-dy, p[1] - y0) && cl(dy, y1 - p[1]) && t0 <= t1;
  }
  function angLabelNear(cv, A, Ms, dir, txt, d0, o) {
    var w = tw(txt) + 8, h = FS * 1.3, fr = o && o.frame, corners = (cv.angCorners || []).concat(cv.polyVerts || []);
    var boxAt = function (c) { return [c[0] - w / 2, c[1] - h / 2, w, h]; };
    var free = function (b) {
      if (fr && (b[0] < fr[0] || b[1] < fr[1] || b[0] + w > fr[0] + fr[2] || b[1] + h > fr[1] + fr[3])) return false;
      if (boxesIn(cv, b[0], b[1], b[0] + w, b[1] + h).some(function (q) { return b[0] < q[0] + q[2] && q[0] < b[0] + w && b[1] < q[1] + q[3] && q[1] < b[1] + h; })) return false;
      return !(cv.segs || []).some(function (sg) { return segBlocksBox(sg, b); });
    };
    var foot = function (b, P) { return [Math.max(b[0], Math.min(P[0], b[0] + b[2])), Math.max(b[1], Math.min(P[1], b[1] + b[3]))]; };
    var gapOf = function (b) { var p = foot(b, Ms), q = foot(b, A); return Math.min(Math.hypot(Ms[0] - p[0], Ms[1] - p[1]), Math.hypot(A[0] - q[0], A[1] - q[1])); };
    var ownNearest = function (b) {
      var c = [b[0] + w / 2, b[1] + h / 2], dOwn = Math.hypot(c[0] - A[0], c[1] - A[1]);
      /* clearly its own corner: every other corner at least a quarter further away */
      return !corners.some(function (v) { return Math.hypot(v[0] - A[0], v[1] - A[1]) > 2 && Math.hypot(c[0] - v[0], c[1] - v[1]) < 1.25 * dOwn; });
    };
    var leaderClear = function (b) {
      var p = foot(b, Ms), near = boxesIn(cv, Math.min(p[0], Ms[0]), Math.min(p[1], Ms[1]), Math.max(p[0], Ms[0]), Math.max(p[1], Ms[1]));
      (cv.segs || []).forEach(function (sg) { near = near.concat(segSamples(sg)); });
      return !near.some(function (q) { return segHitsBox(p, Ms, q); });
    };
    var search = function (base, offs, steps, dist0, test) {
      for (var i = 0; i < steps.length; i++) for (var j = 0; j < offs.length; j++) {
        var dd = [Math.cos(base + offs[j]), Math.sin(base + offs[j])], half = Math.abs(dd[0]) * w / 2 + Math.abs(dd[1]) * h / 2;
        var b = boxAt(add(A, mul(dd, dist0 + half + steps[i])));
        if (free(b) && test(b)) return { b: b, d: dd };
      }
      return null;
    };
    var bis = Math.atan2(dir[1], dir[0]), near = [0, 0.35, -0.35, 0.7, -0.7, 1.05, -1.05, 1.4, -1.4];
    /* pass 1: close to the arc and clearly at its own corner, no leader needed */
    var got = search(bis, near, [0, 5, 11], d0, function (b) { return gapOf(b) <= 1.5 * h && ownNearest(b); }), lead = false;
    if (!got) {
      /* pass 2: outside, away from the middle of the drawing, with a leader that crosses no label */
      var cen = cv.cen || null, away = dir;
      if (cen) { var av = sub(A, cen), al = len(av); if (al > 1e-6) away = mul(av, 1 / al); }
      got = search(Math.atan2(away[1], away[0]), [0, 0.3, -0.3, 0.6, -0.6, 0.9, -0.9, 1.2, -1.2], [8, 16, 26, 38, 52, 68, 86], d0, function (b) { return ownNearest(b) && leaderClear(b); });
      if (!got) got = search(bis, near.concat([1.8, -1.8, 2.3, -2.3, PI]), [18, 26, 36, 48, 62, 80], d0, leaderClear);
      lead = true;
    }
    var half0 = Math.abs(dir[0]) * w / 2 + Math.abs(dir[1]) * h / 2;
    var bx = cv.label(got ? [got.b[0] + w / 2, got.b[1] + h / 2] : add(A, mul(dir, d0 + half0)), txt, COL.ink, got ? got.d : dir);
    if (!bx) return bx;
    if (lead || gapOf(bx) > 1.5 * h || !ownNearest(bx)) {
      var p = foot(bx, Ms), L = Math.hypot(Ms[0] - p[0], Ms[1] - p[1]);
      if (L > 2) {
        cv.path('mark', [p, Ms], attrsLine(COL.dim, 1.5), false, 'leader');
        var dot = [];
        for (var k = 0; k < 12; k++) dot.push([Ms[0] + 2 * Math.cos(k * PI / 6), Ms[1] + 2 * Math.sin(k * PI / 6)]);
        cv.path('mark', dot, 'fill="' + COL.dim + '" stroke="none"', true, 'leader');
        /* keep later labels off the leader */
        (cv.segs || (cv.segs = [])).push({ a: p, b: Ms, n: Math.max(1, Math.ceil(L / 6)) });
      }
    }
    return bx;
  }
  function extra3D(X, K, o) {
    var cv = K.cv, S = K.S, tv = K.toView, sc = K.sc;
    cv.angCorners = (X.angs || []).map(function (an) { return S(tv(an.v)); });
    if (K.cen) cv.cen = K.cen;
    (X.auxs || []).forEach(function (ab) { K.emit(K.pieces(tv(ab[0]), tv(ab[1]), null), attrsLine(COL.dim, 1.25, '5 4'), null, 'aux', 'aux', false); });
    (X.lines || []).forEach(function (ln) {
      var hp = K.H ? hlDim(o, ln.lab && ln.lab.letter) : null, txt = labelText(ln.lab, o);
      if (txt === null && !hp) return;
      var Pa = tv(ln.a), Pb = tv(ln.b), sa = S(Pa), sb = S(Pb);
      if (hp) cv.hlLine(hp, [[sa, sb]]);
      if (txt === null) return;
      K.emit(K.pieces(Pa, Pb, null), attrsLine(COL.red, 1.75), attrsLine(COL.red, 1.5, '6 4'), 'ann', 'ann', true);
      var u = nrm(sub(sb, sa));
      if (txt) { var bx = cv.label(lerp(sa, sb, ln.at == null ? 0.5 : ln.at), txt, COL.red, [-u[1], u[0]]); if (hp) cv.hlBox(hp, bx); }
    });
    (X.texts || []).forEach(function (t) {
      var hp = K.H ? hlDim(o, t.lab && t.lab.letter) : null, txt = labelText(t.lab, o);
      if (!txt) return;
      var Ps = S(tv(t.p)), dv = nrm(sub(S(tv(add(t.p, mul(t.d, 10 / sc)))), Ps)), half = Math.abs(dv[0]) * (tw(txt) + 8) / 2 + Math.abs(dv[1]) * FS * 0.65;
      var bx = cv.label(add(Ps, mul(dv, 8 + half)), txt, COL.ink, dv);
      if (hp) cv.hlBox(hp, bx);
    });
    (X.angs || []).forEach(function (an) { ang3(an, K, o); });
  }
  /* arc radius for an added flat angle mark: keep the arc clear of label boxes already placed */
  function fitRp(cv, A, a0, a1, rp, rmax) {
    var arcAt = function (r) { var pts = []; for (var i = 0; i <= 28; i++) { var a = a0 + (a1 - a0) * i / 28; pts.push([A[0] + r * Math.cos(a), A[1] + r * Math.sin(a)]); } return pts; };
    var tries = [1, 0.8, 0.65, 1.25, 1.5, 0.5];
    for (var k = 0; k < tries.length; k++) { var r = Math.max(8, Math.min(rp * tries[k], rmax)); if (!boxHit(cv, arcAt(r))) return r; }
    return Math.max(8, Math.min(rp, rmax));
  }

  /* ---------- solving a shape from other known sizes ---------- */
  var SOLVE = {};
  function sp(need, f) { return { need: need, f: f }; }
  function triSolve(K, u) {
    /* general triangle: sides a, b, c and angles angA, angB, angC (A opposite a). Returns {p: {a, b, c}, steps} or {err} */
    var s = { A: K.a, B: K.b, C: K.c }, g = { A: K.angA, B: K.angB, C: K.angC }, steps = [], alt = null;
    var L = ['A', 'B', 'C'], lo = function (x) { return x.toLowerCase(); };
    var ns = L.filter(function (x) { return s[x] != null; }).length, ng = L.filter(function (x) { return g[x] != null; }).length;
    if (ng >= 2) {
      var miss = L.filter(function (x) { return g[x] == null; });
      if (miss.length === 1) { var m = miss[0], o2 = L.filter(function (x) { return x !== m; }); g[m] = 180 - g[o2[0]] - g[o2[1]];
        steps.push(angItem('Angle ' + m + ' (the angles add to 180°)', '∠' + m, '180 − ∠' + o2[0] + ' − ∠' + o2[1], ['180 − ' + v(g[o2[0]]) + ' − ' + v(g[o2[1]])], g[m], 'ang' + m)); }
      if (g.A <= 0 || g.B <= 0 || g.C <= 0) return { err: 'Those angles add to 180° or more, so they cannot make a triangle.' };
      var known = L.filter(function (x) { return s[x] != null; })[0];
      if (!known) return { err: 'Give at least one side as well as the angles.' };
      L.forEach(function (x) {
        if (s[x] != null) return;
        s[x] = s[known] * Math.sin(g[x] * D2R) / Math.sin(g[known] * D2R);
        steps.push(item('Side ' + lo(x) + ' (law of sines)', lo(x), lo(known) + ' × sin ' + x + ' ÷ sin ' + known, [v(s[known]) + ' × sin ' + v(g[x]) + '° ÷ sin ' + v(g[known]) + '°'], s[x], u, 1, lo(x)));
      });
    } else if (ns === 3) {
      /* SSS: nothing to work out */
    } else if (ns === 2 && ng === 1) {
      var ga = L.filter(function (x) { return g[x] != null; })[0], ms = L.filter(function (x) { return s[x] == null; })[0];
      if (ga === ms) {
        var o3 = L.filter(function (x) { return x !== ga; });
        s[ga] = Math.sqrt(Math.max(0, s[o3[0]] * s[o3[0]] + s[o3[1]] * s[o3[1]] - 2 * s[o3[0]] * s[o3[1]] * Math.cos(g[ga] * D2R)));
        steps.push(item('Side ' + lo(ga) + ' (law of cosines, two sides and the angle between them)', lo(ga), '√(' + lo(o3[0]) + '² + ' + lo(o3[1]) + '² − 2 × ' + lo(o3[0]) + ' × ' + lo(o3[1]) + ' × cos ' + ga + ')',
          ['√(' + v(s[o3[0]]) + '² + ' + v(s[o3[1]]) + '² − 2 × ' + v(s[o3[0]]) + ' × ' + v(s[o3[1]]) + ' × cos ' + v(g[ga]) + '°)'], s[ga], u, 1, lo(ga)));
      } else {
        /* SSA: angle ga with its opposite side known, and one more side */
        var other = L.filter(function (x) { return x !== ga && s[x] != null; })[0], third = ms;
        if (s[ga] == null) return { err: 'Not enough to fix the triangle.' };
        var sn = s[other] * Math.sin(g[ga] * D2R) / s[ga];
        if (sn > 1 + 1e-12) return { err: 'No triangle fits: side ' + lo(ga) + ' is too short to reach across.' };
        var g1 = Math.asin(Math.min(1, sn)) / D2R, g2 = 180 - g1;
        steps.push(angItem('Angle ' + other + ' (law of sines)', '∠' + other, 'sin⁻¹(' + lo(other) + ' × sin ' + ga + ' ÷ ' + lo(ga) + ')', ['sin⁻¹(' + v(s[other]) + ' × sin ' + v(g[ga]) + '° ÷ ' + v(s[ga]) + ')'], g1, 'ang' + other));
        if (g[ga] + g2 < 180 - 1e-9 && Math.abs(g2 - g1) > 1e-9) {
          var gt2 = 180 - g[ga] - g2, s3b = s[ga] * Math.sin(gt2 * D2R) / Math.sin(g[ga] * D2R), pa = {};
          pa[lo(ga)] = s[ga]; pa[lo(other)] = s[other]; pa[lo(third)] = s3b;
          alt = { a: pa.a, b: pa.b, c: pa.c };
        }
        g[other] = g1; g[third] = 180 - g[ga] - g1;
        steps.push(angItem('Angle ' + third + ' (the angles add to 180°)', '∠' + third, '180 − ∠' + ga + ' − ∠' + other, ['180 − ' + v(g[ga]) + ' − ' + v(g1)], g[third], 'ang' + third));
        s[third] = s[ga] * Math.sin(g[third] * D2R) / Math.sin(g[ga] * D2R);
        steps.push(item('Side ' + lo(third) + ' (law of sines)', lo(third), lo(ga) + ' × sin ' + third + ' ÷ sin ' + ga, [v(s[ga]) + ' × sin ' + v(g[third]) + '° ÷ sin ' + v(g[ga]) + '°'], s[third], u, 1, lo(third)));
      }
    } else return null; /* not a triangle-rule set of facts (for example two sides and the area): leave it to the trial method */
    return { p: { a: s.A, b: s.B, c: s.C }, steps: steps, alt: alt, note: alt ? 'Two different triangles fit these sizes (the ambiguous case). The other one has c = ' + fmt(alt.c) + '.' : null };
  }
  SOLVE['scalene-triangle'] = [sp([], triSolve)];
  SOLVE['right-triangle'] = [
    sp(['b', 'h'], function (K) { return { p: { b: K.b, h: K.h }, steps: [] }; }),
    sp(['b', 'c'], function (K, u) { var h = Math.sqrt(K.c * K.c - K.b * K.b); return { p: { b: K.b, h: h }, steps: [item('Height (Pythagoras)', 'h', '√(c² − b²)', ['√(' + v(K.c) + '² − ' + v(K.b) + '²)'], h, u, 1)] }; }),
    sp(['h', 'c'], function (K, u) { var b = Math.sqrt(K.c * K.c - K.h * K.h); return { p: { b: b, h: K.h }, steps: [item('Base (Pythagoras)', 'b', '√(c² − h²)', ['√(' + v(K.c) + '² − ' + v(K.h) + '²)'], b, u, 1)] }; }),
    sp(['b', 'angA'], function (K, u) { var h = K.b * Math.tan(K.angA * D2R); return { p: { b: K.b, h: h }, steps: [item('Height (TOA)', 'h', 'b × tan A', [v(K.b) + ' × tan ' + v(K.angA) + '°'], h, u, 1)] }; }),
    sp(['h', 'angA'], function (K, u) { var b = K.h / Math.tan(K.angA * D2R); return { p: { b: b, h: K.h }, steps: [item('Base (TOA)', 'b', 'h ÷ tan A', [v(K.h) + ' ÷ tan ' + v(K.angA) + '°'], b, u, 1)] }; }),
    sp(['c', 'angA'], function (K, u) { var b = K.c * Math.cos(K.angA * D2R), h = K.c * Math.sin(K.angA * D2R); return { p: { b: b, h: h }, steps: [item('Base (CAH)', 'b', 'c × cos A', [v(K.c) + ' × cos ' + v(K.angA) + '°'], b, u, 1), item('Height (SOH)', 'h', 'c × sin A', [v(K.c) + ' × sin ' + v(K.angA) + '°'], h, u, 1)] }; }),
    sp(['A', 'b'], function (K, u) { var h = 2 * K.A / K.b; return { p: { b: K.b, h: h }, steps: [item('Height from the area', 'h', '2 × A ÷ b', ['2 × ' + v(K.A) + ' ÷ ' + v(K.b)], h, u, 1)] }; }),
    sp(['A', 'h'], function (K, u) { var b = 2 * K.A / K.h; return { p: { b: b, h: K.h }, steps: [item('Base from the area', 'b', '2 × A ÷ h', ['2 × ' + v(K.A) + ' ÷ ' + v(K.h)], b, u, 1)] }; })];
  SOLVE['isosceles-triangle'] = [
    sp(['b', 'h'], function (K) { return { p: { b: K.b, h: K.h }, steps: [] }; }),
    sp(['b', 'a'], function (K, u) { var h = Math.sqrt(K.a * K.a - K.b * K.b / 4); return { p: { b: K.b, h: h }, steps: [item('Height (Pythagoras on half the triangle)', 'h', '√(a² − (b ÷ 2)²)', ['√(' + v(K.a) + '² − ' + v(K.b / 2) + '²)'], h, u, 1)] }; }),
    sp(['a', 'h'], function (K, u) { var b = 2 * Math.sqrt(K.a * K.a - K.h * K.h); return { p: { b: b, h: K.h }, steps: [item('Base (Pythagoras on half the triangle)', 'b', '2 × √(a² − h²)', ['2 × √(' + v(K.a) + '² − ' + v(K.h) + '²)'], b, u, 1)] }; }),
    sp(['b', 'angA'], function (K, u) { var h = K.b / 2 * Math.tan(K.angA * D2R); return { p: { b: K.b, h: h }, steps: [item('Height (TOA)', 'h', '(b ÷ 2) × tan A', ['(' + v(K.b) + ' ÷ 2) × tan ' + v(K.angA) + '°'], h, u, 1)] }; }),
    sp(['h', 'angA'], function (K, u) { var b = 2 * K.h / Math.tan(K.angA * D2R); return { p: { b: b, h: K.h }, steps: [item('Base (TOA)', 'b', '2 × h ÷ tan A', ['2 × ' + v(K.h) + ' ÷ tan ' + v(K.angA) + '°'], b, u, 1)] }; }),
    sp(['a', 'angA'], function (K, u) { var b = 2 * K.a * Math.cos(K.angA * D2R), h = K.a * Math.sin(K.angA * D2R); return { p: { b: b, h: h }, steps: [item('Base (CAH)', 'b', '2 × a × cos A', ['2 × ' + v(K.a) + ' × cos ' + v(K.angA) + '°'], b, u, 1), item('Height (SOH)', 'h', 'a × sin A', [v(K.a) + ' × sin ' + v(K.angA) + '°'], h, u, 1)] }; }),
    sp(['a', 'angC'], function (K, u) { var b = 2 * K.a * Math.sin(K.angC / 2 * D2R), h = K.a * Math.cos(K.angC / 2 * D2R); return { p: { b: b, h: h }, steps: [item('Base', 'b', '2 × a × sin(C ÷ 2)', ['2 × ' + v(K.a) + ' × sin ' + v(K.angC / 2) + '°'], b, u, 1), item('Height', 'h', 'a × cos(C ÷ 2)', [v(K.a) + ' × cos ' + v(K.angC / 2) + '°'], h, u, 1)] }; }),
    sp(['b', 'angC'], function (K, u) { var h = K.b / 2 / Math.tan(K.angC / 2 * D2R); return { p: { b: K.b, h: h }, steps: [item('Height', 'h', '(b ÷ 2) ÷ tan(C ÷ 2)', ['(' + v(K.b) + ' ÷ 2) ÷ tan ' + v(K.angC / 2) + '°'], h, u, 1)] }; }),
    sp(['h', 'angC'], function (K, u) { var b = 2 * K.h * Math.tan(K.angC / 2 * D2R); return { p: { b: b, h: K.h }, steps: [item('Base', 'b', '2 × h × tan(C ÷ 2)', ['2 × ' + v(K.h) + ' × tan ' + v(K.angC / 2) + '°'], b, u, 1)] }; })];
  SOLVE['equilateral-triangle'] = [
    sp(['h'], function (K, u) { var s = 2 * K.h / SQ3; return { p: { s: s }, steps: [item('Side from the height', 's', '2 × h ÷ √3', ['2 × ' + v(K.h) + ' ÷ √3'], s, u, 1)] }; }),
    sp(['P'], function (K, u) { var s = K.P / 3; return { p: { s: s }, steps: [item('Side from the perimeter', 's', 'P ÷ 3', [v(K.P) + ' ÷ 3'], s, u, 1)] }; }),
    sp(['A'], function (K, u) { var s = Math.sqrt(4 * K.A / SQ3); return { p: { s: s }, steps: [item('Side from the area', 's', '√(4 × A ÷ √3)', ['√(4 × ' + v(K.A) + ' ÷ √3)'], s, u, 1)] }; })];
  SOLVE.square = [
    sp(['A'], function (K, u) { var s = Math.sqrt(K.A); return { p: { s: s }, steps: [item('Side from the area', 's', '√A', ['√' + v(K.A)], s, u, 1)] }; }),
    sp(['P'], function (K, u) { var s = K.P / 4; return { p: { s: s }, steps: [item('Side from the perimeter', 's', 'P ÷ 4', [v(K.P) + ' ÷ 4'], s, u, 1)] }; }),
    sp(['d'], function (K, u) { var s = K.d / SQ2; return { p: { s: s }, steps: [item('Side from the diagonal', 's', 'd ÷ √2', [v(K.d) + ' ÷ √2'], s, u, 1)] }; })];
  SOLVE.rectangle = [
    sp(['A', 'l'], function (K, u) { var w = K.A / K.l; return { p: { l: K.l, w: w }, steps: [item('Width from the area', 'w', 'A ÷ l', [v(K.A) + ' ÷ ' + v(K.l)], w, u, 1)] }; }),
    sp(['A', 'w'], function (K, u) { var l = K.A / K.w; return { p: { l: l, w: K.w }, steps: [item('Length from the area', 'l', 'A ÷ w', [v(K.A) + ' ÷ ' + v(K.w)], l, u, 1)] }; }),
    sp(['P', 'l'], function (K, u) { var w = K.P / 2 - K.l; return { p: { l: K.l, w: w }, steps: [item('Width from the perimeter', 'w', 'P ÷ 2 − l', [v(K.P) + ' ÷ 2 − ' + v(K.l)], w, u, 1)] }; }),
    sp(['P', 'w'], function (K, u) { var l = K.P / 2 - K.w; return { p: { l: l, w: K.w }, steps: [item('Length from the perimeter', 'l', 'P ÷ 2 − w', [v(K.P) + ' ÷ 2 − ' + v(K.w)], l, u, 1)] }; }),
    sp(['d', 'l'], function (K, u) { var w = Math.sqrt(K.d * K.d - K.l * K.l); return { p: { l: K.l, w: w }, steps: [item('Width (Pythagoras)', 'w', '√(d² − l²)', ['√(' + v(K.d) + '² − ' + v(K.l) + '²)'], w, u, 1)] }; }),
    sp(['d', 'w'], function (K, u) { var l = Math.sqrt(K.d * K.d - K.w * K.w); return { p: { l: l, w: K.w }, steps: [item('Length (Pythagoras)', 'l', '√(d² − w²)', ['√(' + v(K.d) + '² − ' + v(K.w) + '²)'], l, u, 1)] }; })];
  SOLVE.circle = [
    sp(['D'], function (K, u) { var r = K.D / 2; return { p: { r: r }, steps: [item('Radius from the diameter', 'r', 'D ÷ 2', [v(K.D) + ' ÷ 2'], r, u, 1)] }; }),
    sp(['C'], function (K, u) { var r = K.C / (2 * PI); return { p: { r: r }, steps: [item('Radius from the circumference', 'r', 'C ÷ (2 × π)', [v(K.C) + ' ÷ (2 × π)'], r, u, 1)] }; }),
    sp(['A'], function (K, u) { var r = Math.sqrt(K.A / PI); return { p: { r: r }, steps: [item('Radius from the area', 'r', '√(A ÷ π)', ['√(' + v(K.A) + ' ÷ π)'], r, u, 1)] }; })];
  function regSolve(n) {
    var tf = Math.tan(PI / n), sf = Math.sin(PI / n), f = v(180 / n);
    var odd = n % 2 ? [
      sp(['d'], function (K, u) { var s = 2 * K.d / (1 + Math.sqrt(5)); return { p: { s: s }, steps: [item('Side from the diagonal (the diagonal is the golden ratio φ times the side)', 's', 'd ÷ φ = 2 × d ÷ (1 + √5)', ['2 × ' + v(K.d) + ' ÷ (1 + √5)'], s, u, 1)] }; }),
      sp(['Ht'], function (K, u) { var k = 1 / (2 * sf) + 1 / (2 * tf), s = K.Ht / k; return { p: { s: s }, steps: [item('Side from the height (height = R + a)', 's', 'Ht ÷ (1 ÷ (2 × sin ' + f + '°) + 1 ÷ (2 × tan ' + f + '°))', [v(K.Ht) + ' ÷ (1 ÷ (2 × sin ' + f + '°) + 1 ÷ (2 × tan ' + f + '°))'], s, u, 1)] }; })] : [
      sp(['AF'], function (K, u) { var s = K.AF * tf; return { p: { s: s }, steps: [item('Side from across flats', 's', 'AF × tan(180° ÷ ' + n + ')', [v(K.AF) + ' × tan ' + f + '°'], s, u, 1)] }; }),
      sp(['AC'], function (K, u) { var s = K.AC * sf; return { p: { s: s }, steps: [item('Side from across corners', 's', 'AC × sin(180° ÷ ' + n + ')', [v(K.AC) + ' × sin ' + f + '°'], s, u, 1)] }; })];
    return [sp(['P'], function (K, u) { var s = K.P / n; return { p: { s: s }, steps: [item('Side from the perimeter', 's', 'P ÷ ' + n, [v(K.P) + ' ÷ ' + n], s, u, 1)] }; }),
      sp(['a'], function (K, u) { var s = 2 * K.a * tf; return { p: { s: s }, steps: [item('Side from the apothem', 's', '2 × a × tan(180° ÷ ' + n + ')', ['2 × ' + v(K.a) + ' × tan ' + f + '°'], s, u, 1)] }; }),
      sp(['R'], function (K, u) { var s = 2 * K.R * sf; return { p: { s: s }, steps: [item('Side from the radius to a corner', 's', '2 × R × sin(180° ÷ ' + n + ')', ['2 × ' + v(K.R) + ' × sin ' + f + '°'], s, u, 1)] }; }),
      sp(['A'], function (K, u) { var s = Math.sqrt(4 * K.A * tf / n); return { p: { s: s }, steps: [item('Side from the area', 's', '√(4 × A × tan(180° ÷ ' + n + ') ÷ ' + n + ')', ['√(4 × ' + v(K.A) + ' × tan ' + f + '° ÷ ' + n + ')'], s, u, 1)] }; })].concat(odd);
  }
  SOLVE.pentagon = regSolve(5); SOLVE.hexagon = regSolve(6); SOLVE.octagon = regSolve(8);
  SOLVE.cube = [
    sp(['V'], function (K, u) { var s = Math.cbrt(K.V); return { p: { s: s }, steps: [item('Side from the volume', 's', '∛V', ['∛' + v(K.V)], s, u, 1)] }; }),
    sp(['SA'], function (K, u) { var s = Math.sqrt(K.SA / 6); return { p: { s: s }, steps: [item('Side from the surface area', 's', '√(SA ÷ 6)', ['√(' + v(K.SA) + ' ÷ 6)'], s, u, 1)] }; }),
    sp(['d'], function (K, u) { var s = K.d / SQ3; return { p: { s: s }, steps: [item('Side from the space diagonal', 's', 'd ÷ √3', [v(K.d) + ' ÷ √3'], s, u, 1)] }; })];
  function boxSolve(a, b, c) {
    return sp(['V', a, b], function (K, u) { var x = K.V / (K[a] * K[b]), p = {}; p[a] = K[a]; p[b] = K[b]; p[c] = x; return { p: p, steps: [item('Third side from the volume', c, 'V ÷ (' + a + ' × ' + b + ')', [v(K.V) + ' ÷ (' + v(K[a]) + ' × ' + v(K[b]) + ')'], x, u, 1)] }; });
  }
  SOLVE['rectangular-prism'] = [boxSolve('l', 'w', 'h'), boxSolve('l', 'h', 'w'), boxSolve('w', 'h', 'l'),
    sp(['d', 'l', 'w'], function (K, u) { var h = Math.sqrt(K.d * K.d - K.l * K.l - K.w * K.w); return { p: { l: K.l, w: K.w, h: h }, steps: [item('Height from the space diagonal', 'h', '√(d² − l² − w²)', ['√(' + v(K.d) + '² − ' + v(K.l) + '² − ' + v(K.w) + '²)'], h, u, 1)] }; })];
  SOLVE.cylinder = [
    sp(['V', 'r'], function (K, u) { var h = K.V / (PI * K.r * K.r); return { p: { r: K.r, h: h }, steps: [item('Height from the volume', 'h', 'V ÷ (π × r²)', [v(K.V) + ' ÷ (π × ' + v(K.r) + '²)'], h, u, 1)] }; }),
    sp(['V', 'h'], function (K, u) { var r = Math.sqrt(K.V / (PI * K.h)); return { p: { r: r, h: K.h }, steps: [item('Radius from the volume', 'r', '√(V ÷ (π × h))', ['√(' + v(K.V) + ' ÷ (π × ' + v(K.h) + '))'], r, u, 1)] }; }),
    sp(['V', 'D'], function (K, u) { var r = K.D / 2, h = K.V / (PI * r * r); return { p: { r: r, h: h }, steps: [item('Height from the volume', 'h', 'V ÷ (π × (D ÷ 2)²)', [v(K.V) + ' ÷ (π × ' + v(r) + '²)'], h, u, 1)] }; }),
    sp(['LA', 'r'], function (K, u) { var h = K.LA / (2 * PI * K.r); return { p: { r: K.r, h: h }, steps: [item('Height from the lateral area', 'h', 'LA ÷ (2 × π × r)', [v(K.LA) + ' ÷ (2 × π × ' + v(K.r) + ')'], h, u, 1)] }; })];
  SOLVE.cone = [
    sp(['r', 'l'], function (K, u) { var h = Math.sqrt(K.l * K.l - K.r * K.r); return { p: { r: K.r, h: h }, steps: [item('Height (Pythagoras)', 'h', '√(l² − r²)', ['√(' + v(K.l) + '² − ' + v(K.r) + '²)'], h, u, 1)] }; }),
    sp(['h', 'l'], function (K, u) { var r = Math.sqrt(K.l * K.l - K.h * K.h); return { p: { r: r, h: K.h }, steps: [item('Radius (Pythagoras)', 'r', '√(l² − h²)', ['√(' + v(K.l) + '² − ' + v(K.h) + '²)'], r, u, 1)] }; }),
    sp(['V', 'r'], function (K, u) { var h = 3 * K.V / (PI * K.r * K.r); return { p: { r: K.r, h: h }, steps: [item('Height from the volume', 'h', '3 × V ÷ (π × r²)', ['3 × ' + v(K.V) + ' ÷ (π × ' + v(K.r) + '²)'], h, u, 1)] }; }),
    sp(['V', 'h'], function (K, u) { var r = Math.sqrt(3 * K.V / (PI * K.h)); return { p: { r: r, h: K.h }, steps: [item('Radius from the volume', 'r', '√(3 × V ÷ (π × h))', ['√(3 × ' + v(K.V) + ' ÷ (π × ' + v(K.h) + '))'], r, u, 1)] }; }),
    sp(['alpha', 'r'], function (K, u) { var h = K.r * Math.tan(K.alpha * D2R); return { p: { r: K.r, h: h }, steps: [item('Height from the slope angle', 'h', 'r × tan α', [v(K.r) + ' × tan ' + v(K.alpha) + '°'], h, u, 1)] }; }),
    sp(['alpha', 'h'], function (K, u) { var r = K.h / Math.tan(K.alpha * D2R); return { p: { r: r, h: K.h }, steps: [item('Radius from the slope angle', 'r', 'h ÷ tan α', [v(K.h) + ' ÷ tan ' + v(K.alpha) + '°'], r, u, 1)] }; })];
  SOLVE.sphere = [
    sp(['V'], function (K, u) { var r = Math.cbrt(3 * K.V / (4 * PI)); return { p: { r: r }, steps: [item('Radius from the volume', 'r', '∛(3 × V ÷ (4 × π))', ['∛(3 × ' + v(K.V) + ' ÷ (4 × π))'], r, u, 1)] }; }),
    sp(['SA'], function (K, u) { var r = Math.sqrt(K.SA / (4 * PI)); return { p: { r: r }, steps: [item('Radius from the surface area', 'r', '√(SA ÷ (4 × π))', ['√(' + v(K.SA) + ' ÷ (4 × π))'], r, u, 1)] }; }),
    sp(['D'], function (K, u) { return { p: { r: K.D / 2 }, steps: [item('Radius from the diameter', 'r', 'D ÷ 2', [v(K.D) + ' ÷ 2'], K.D / 2, u, 1)] }; })];
  SOLVE['square-pyramid'] = [
    sp(['b', 'l'], function (K, u) { var h = Math.sqrt(K.l * K.l - K.b * K.b / 4); return { p: { b: K.b, h: h }, steps: [item('Height (Pythagoras)', 'h', '√(l² − (b ÷ 2)²)', ['√(' + v(K.l) + '² − ' + v(K.b / 2) + '²)'], h, u, 1)] }; }),
    sp(['b', 'e'], function (K, u) { var h = Math.sqrt(K.e * K.e - K.b * K.b / 2); return { p: { b: K.b, h: h }, steps: [item('Height from the sloped edge', 'h', '√(e² − b² ÷ 2)', ['√(' + v(K.e) + '² − ' + v(K.b) + '² ÷ 2)'], h, u, 1)] }; }),
    sp(['V', 'b'], function (K, u) { var h = 3 * K.V / (K.b * K.b); return { p: { b: K.b, h: h }, steps: [item('Height from the volume', 'h', '3 × V ÷ b²', ['3 × ' + v(K.V) + ' ÷ ' + v(K.b) + '²'], h, u, 1)] }; }),
    sp(['alpha', 'b'], function (K, u) { var h = K.b / 2 * Math.tan(K.alpha * D2R); return { p: { b: K.b, h: h }, steps: [item('Height from the face slope', 'h', '(b ÷ 2) × tan α', ['(' + v(K.b) + ' ÷ 2) × tan ' + v(K.alpha) + '°'], h, u, 1)] }; })];
  SOLVE['triangular-prism'] = [
    sp(['V', 'b', 'h'], function (K, u) { var l = K.V / (K.b * K.h / 2); return { p: { b: K.b, h: K.h, l: l }, steps: [item('Length from the volume', 'l', 'V ÷ (½ × b × h)', [v(K.V) + ' ÷ (½ × ' + v(K.b) + ' × ' + v(K.h) + ')'], l, u, 1)] }; }),
    sp(['b', 's', 'l'], function (K, u) { var h = Math.sqrt(K.s * K.s - K.b * K.b / 4); return { p: { b: K.b, h: h, l: K.l }, steps: [item('Triangle height (Pythagoras)', 'h', '√(s² − (b ÷ 2)²)', ['√(' + v(K.s) + '² − ' + v(K.b / 2) + '²)'], h, u, 1)] }; })];
  /* numeric fallback: Newton's method on the full calc values */
  function numSolve(id, K, u, ao) {
    var d = get(id), pl = plist(d, ao), unk = pl.filter(function (q) { return K[q.k] == null; }).map(function (q) { return q.k; });
    var eqs = Object.keys(K).filter(function (k) { return !pl.some(function (q) { return q.k === k; }); });
    if (!unk.length) { var p0 = {}; pl.forEach(function (q) { p0[q.k] = K[q.k]; }); return { p: p0, steps: [] }; }
    if (eqs.length < unk.length) return { err: 'Give ' + unk.length + ' more size' + (unk.length > 1 ? 's' : '') + ' to fix this shape.' };
    /* values only: the shape's own calc items and the full-calc extras, first of each key, no highlights, groups or notes */
    var ao2 = { full: true, angles: ao && ao.angles, angleInput: ao && ao.angleInput };
    if (TRI4[id]) { ao2.angles = true; ao2.angleInput = aoOf(ao2).input; }
    var vals = function (p) {
      var m = {};
      NUMONLY = true;
      try {
        var f2 = fill(id, p, ao2);
        d.calc(f2, u, ao2).forEach(function (it) { if (!(it.key in m)) m[it.key] = it.value; });
        if (XC[id]) XC[id](f2, u, ao2).forEach(function (it) { if (!(it.key in m)) m[it.key] = it.value; });
      } catch (e) { return null; } finally { NUMONLY = false; }
      return m;
    };
    var copy = function (p) { var q = {}, k; for (k in p) q[k] = p[k]; return q; };
    var bestP = null, bestE = Infinity, R0 = seeded0(7);
    for (var start = 0; start < 6 && bestE > 1e-20; start++) {
      var p = start === 0 ? defaults(id, ao) : random(id, 'tenth', R0, ao);
      pl.forEach(function (q) { if (K[q.k] != null) p[q.k] = K[q.k]; });
      for (var it = 0; it < 80; it++) {
        var m = vals(p);
        if (!m) break;
        var r = eqs.map(function (k) { return (m[k] - K[k]) / Math.max(1e-9, Math.abs(K[k])); }), E = r.reduce(function (s, x) { return s + x * x; }, 0);
        if (!isFinite(E)) break;
        if (E < bestE && !validate(id, p, ao)) { bestE = E; bestP = copy(p); }
        if (E < 1e-24) break;
        var J = eqs.map(function () { return []; });
        unk.forEach(function (k, j) { var q = copy(p), dl = Math.max(1e-7, Math.abs(p[k]) * 1e-6); q[k] = p[k] + dl; var m2 = vals(q); eqs.forEach(function (e, i) { J[i][j] = m2 ? ((m2[e] - m[e]) / Math.max(1e-9, Math.abs(K[e]))) / dl : 0; }); });
        var JT = unk.map(function (k, j) { return eqs.map(function (e, i) { return J[i][j]; }); });
        var M2 = JT.map(function (row) { return unk.map(function (k, j2) { return row.reduce(function (s, x, i) { return s + x * J[i][j2]; }, 0); }); });
        var g = JT.map(function (row) { return row.reduce(function (s, x, i) { return s + x * r[i]; }, 0); });
        var dx = gauss(M2, g);
        if (!dx) break;
        var lam = 1, moved = false;
        for (var ls = 0; ls < 20; ls++) {
          var q2 = copy(p);
          unk.forEach(function (k, j) { q2[k] = Math.max(1e-9, p[k] - lam * dx[j]); });
          var m3 = validate(id, q2, ao) ? null : vals(q2);
          if (m3) { var E2 = eqs.reduce(function (s, k) { var x = (m3[k] - K[k]) / Math.max(1e-9, Math.abs(K[k])); return s + x * x; }, 0); if (E2 < E) { p = q2; moved = true; break; } }
          lam /= 2;
        }
        if (!moved) break;
      }
    }
    if (!bestP || bestE > 1e-12) return { err: 'No shape of this kind matches those sizes.' };
    /* a size the givens do not depend on cannot be found from them (for example the slant side of a parallelogram from its base, height and area) */
    var m0 = vals(bestP), free = unk.filter(function (k) {
      var q = copy(bestP); q[k] = bestP[k] * (1 + 1e-4);
      if (validate(id, q, ao)) { q[k] = bestP[k] * (1 - 1e-4); if (validate(id, q, ao)) return false; }
      var m1 = vals(q);
      return m1 && eqs.every(function (e) { return Math.abs(m1[e] - m0[e]) <= 1e-10 * Math.max(1, Math.abs(m0[e])); });
    });
    if (free.length) return { err: 'Those sizes do not fix ' + free.join(', ') + ': changing ' + (free.length > 1 ? 'them' : 'it') + ' leaves ' + eqs.join(', ') + ' the same. Give a size that depends on ' + free.join(', ') + '.' };
    var steps = [noKeys(iu('Worked back by trial (Newton’s method): try sizes, measure ' + eqs.join(', ') + ', adjust until they match', 'Fit', 'match ' + eqs.join(', '), ['found ' + unk.map(function (k) { return k + ' = ' + fmt(bestP[k]); }).join(', ')], 0, '', 'fit', 'Solve'))];
    steps[0].lines[steps[0].lines.length - 1] = 'Fit: every given size matches to better than 1 part in a million';
    return { p: bestP, steps: steps, numeric: true };
  }
  function seeded0(s) { return function () { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; }
  function gauss(A, b) {
    var n = b.length, M = A.map(function (r, i) { return r.concat([b[i]]); });
    for (var c = 0; c < n; c++) {
      var piv = c;
      for (var r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
      if (Math.abs(M[piv][c]) < 1e-300) return null;
      var t = M[c]; M[c] = M[piv]; M[piv] = t;
      for (var r2 = 0; r2 < n; r2++) { if (r2 === c) continue; var f = M[r2][c] / M[c][c]; for (var k = c; k <= n; k++) M[r2][k] -= f * M[c][k]; }
    }
    return M.map(function (r, i) { return r[n] / M[i][i]; });
  }
  function solve(id, known, units, ao) {
    var d = get(id), u = units || 'cm', K = {}, steps = [];
    Object.keys(known || {}).forEach(function (k) { if (known[k] != null && known[k] !== '' && isFinite(+known[k]) && +known[k] > 0) K[k] = +known[k]; });
    var fct = (CAPL[u] || CAPL.cm)[1];
    if (d.kind === 'solid' && K.V == null) {
      if (K.capL != null) { K.V = K.capL / fct; steps.push(item('Volume from the capacity in litres', 'V', 'Cap ÷ ' + fct, [v(K.capL) + ' ÷ ' + fct], K.V, u, 3)); }
      else if (K.capUS != null) K.V = K.capUS * 3.785411784 / fct;
      else if (K.capImp != null) K.V = K.capImp * 4.54609 / fct;
    }
    var res = null, via = null;
    (SOLVE[id] || []).some(function (path) {
      if (!path.need.every(function (k) { return K[k] != null; })) return false;
      var r = path.f(K, u);
      if (r && r.p && !r.err && !validate(id, r.p)) { res = r; via = path.need.join(', ') || 'triangle rules'; return true; }
      if (r && r.err) { res = r; return true; }
      return false;
    });
    if (!res && d.added && d.how === 'prism') {
      var lk = d.params[d.params.length - 1].k, fps = d.params.slice(0, -1);
      if (K.V != null && fps.every(function (q) { return K[q.k] != null; }) && K[lk] == null) {
        var fpv = {}; fps.forEach(function (q) { fpv[q.k] = K[q.k]; });
        var A = 0; calc(d.from, fpv, u).items.forEach(function (it) { if (it.key === 'A') A = it.value; });
        var L = K.V / A; fpv[lk] = L;
        res = { p: fpv, steps: [item('End area of the ' + DEF[d.from].name.toLowerCase(), 'A', 'from the end sizes', [v(A)], A, u, 2), item('Length from the volume', lk, 'V ÷ A', [v(K.V) + ' ÷ ' + v(A)], L, u, 1)] };
        via = 'V and the end sizes';
      }
    }
    if (!res) { res = numSolve(id, K, u, ao); via = res.numeric ? 'trial (Newton’s method)' : 'given sizes'; }
    if (res.err) return { ok: false, msg: res.err };
    var bad = validate(id, res.p, ao);
    if (bad) return { ok: false, msg: bad.msg };
    var out = { ok: true, params: res.p, via: via, steps: steps.concat(res.steps || []), calc: calc(id, res.p, u, { full: true, angles: ao && ao.angles, angleInput: ao && ao.angleInput }) };
    if (res.alt) out.alt = res.alt;
    if (res.note) out.note = res.note;
    return out;
  }
  function solvePaths(id) { return (SOLVE[id] || []).map(function (s) { return s.need.slice(); }).filter(function (n) { return n.length; }); }

  /* ---------- new glossary words (terms({all: true})) and the shared words on the added solids ---------- */
  var NEW_TERMS = {
    pitch: { label: 'Pitch (slope)', m: 'pitch|rise per 12', def: 'The slope of a roof or ramp, written as the rise for every 12 of run, such as 6 in 12. The pitch angle is tan⁻¹(rise ÷ run).',
      hl: function () { return ['ang:A', 'ang:α']; } },
    'slope angle': { label: 'Slope angle', m: 'slope angles?|face slope|edge slope', def: 'The angle between a sloped face, side or edge and the level base.',
      hl: function () { return ['ang:α', 'ang:β']; } },
    'apex angle': { label: 'Apex angle', m: 'apex angles?', def: 'The angle at the point (apex) of a triangle face, a cone or a pyramid.', hl: function () { return ['ang:φ', 'ang:C']; } },
    'interior angle': { label: 'Interior angle', m: 'interior angles?|corner angles?', def: 'An angle inside a shape, between two sides that meet at a corner. For a regular polygon each one is (n − 2) × 180 ÷ n.',
      hl: function () { return ['ang:A', 'ang:B', 'ang:C', 'ang:D']; } },
    'central angle': { label: 'Central angle', m: 'central angles?', def: 'The angle at the centre between two spokes to neighbouring corners: 360 ÷ n for a regular polygon.', hl: function () { return ['ang:θ']; } },
    chordx: { label: 'Chord and sagitta', m: 'sagittas?', def: 'The sagitta is the rise of an arc above its chord: r − r × cos(θ ÷ 2).', hl: function () { return []; } },
    centroid: { label: 'Centroid', m: 'centroids?|balance point', def: 'The balance point of a shape: the centre of its area (or of its volume for a solid).', hl: function (id, view) { return view === 'flat' ? ['fill'] : view === '3d' ? ['all'] : []; } },
    altitude: { label: 'Altitude', m: 'altitudes?', def: 'A height drawn from a corner of a triangle square to the opposite side (or that side carried on).', hl: function () { return ['dim:h']; } },
    median: { label: 'Median', m: 'medians?', def: 'A line from a corner of a triangle to the middle of the opposite side. The three medians cross at the centroid.', hl: function () { return []; } },
    'space diagonal': { label: 'Space diagonal', m: 'space diagonals?', def: 'A line through the inside of a solid from one corner to the farthest corner.', hl: function () { return ['dim:d']; } },
    prism: { label: 'Prism', m: 'prisms?|extru(?:de|ded|sion)', def: 'A solid with two equal, parallel ends joined by flat sides: a flat shape pushed straight out. Volume = end area × length.',
      hl: function (id, view) { return view === '3d' ? ['ends'] : view === 'net' ? ['panels:base', 'panels:top'] : []; } },
    pyramid: { label: 'Pyramid', m: 'pyramids?', def: 'A solid with a flat base and sloped triangle faces that meet at a point (the apex). Volume = base area × height ÷ 3.',
      hl: function (id, view) { return view === '3d' ? ['side'] : view === 'net' ? ['panels:lat'] : []; } },
    wedge: { label: 'Wedge', m: 'wedges?', def: 'A prism with a right triangle end: the shape of a ramp, a shim or a door stop.', hl: function (id, view) { return id === 'right-triangle-prism' && view === '3d' ? ['all'] : []; } },
    focus: { label: 'Focus (of an ellipse)', m: 'foci|focus', def: 'One of two points inside an ellipse. A loop of string around pins at the two foci, pulled tight with a pencil, draws the ellipse.', hl: function () { return []; } },
    gallon: { label: 'Litre and gallon', m: 'litres?|liters?|gallons?', def: '1 L = 1000 cm³. 1 US gal = 231 in³ = 3.785411784 L. 1 imperial gal = 4.54609 L.', hl: function (id, view) { return view === '3d' ? ['all'] : []; } },
    'dihedral angle': { label: 'Dihedral angle', m: 'dihedral angles?', def: 'The angle between two faces of a solid that meet along an edge.', hl: function () { return []; } }
  };
  function addTerms() {
    Object.keys(NEW_TERMS).forEach(function (k) { TERMS[k] = NEW_TERMS[k]; });
    ['triangular-pyramid', 'pentagonal-pyramid', 'hexagonal-pyramid', 'octagonal-pyramid'].forEach(function (id) { SLANT[id] = 1; });
    var wrap = function (key, f2) { var f = TERMS[key].hl; TERMS[key].hl = function (id, view, ao) { return DEF[id] && DEF[id].added ? f2(id, view, ao, DEF[id]) : f(id, view, ao); }; };
    wrap('height', function (id, view, ao, d) { return view === 'flat' ? [] : (d.params.some(function (q) { return q.k === 'h'; }) ? ['dim:h'] : []); });
    wrap('lateral area', function (id, view) { return view === 'net' ? ['panels:lat'] : view === '3d' ? ['side'] : []; });
    wrap('base area', function (id, view, ao, d) { return view === 'net' ? ['panels:base'] : view === '3d' ? (d.up || d.how === 'pyramid' ? ['bottom'] : ['ends']) : []; });
    wrap('stretch-out', function (id, view, ao, d) { return view === 'net' && d.how === 'prism' ? ['panels:lat', 'dim:P'] : []; });
    wrap('girth', function (id, view, ao, d) { return view === 'net' && d.how === 'prism' ? ['panels:lat', 'dim:P'] : []; });
    wrap('fold line', function (id, view) { return view === 'net' ? ['folds'] : []; });
    wrap('slant height', function (id, view, ao, d) { return view === 'flat' ? [] : d.how === 'pyramid' ? ['dim:l', 'dim:l₁', 'dim:l₂'] : []; });
  }
  /* ==== ADDED 2026-10 (end) ==== */

  /* ---------------- 3D renderer ---------------- */
  function rotator(yaw, pitch) {
    var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    return function (p) {
      var x1 = p[0] * cy + p[2] * sy, z1 = -p[0] * sy + p[2] * cy, y1 = p[1];
      return [x1, y1 * cp - z1 * sp, y1 * sp + z1 * cp];
    };
  }
  function hull(pts) {
    var P2 = pts.slice().sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    var cr = function (o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); };
    var lo = [], up = [], i;
    for (i = 0; i < P2.length; i++) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], P2[i]) <= 0) lo.pop(); lo.push(P2[i]); }
    for (i = P2.length - 1; i >= 0; i--) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], P2[i]) <= 0) up.pop(); up.push(P2[i]); }
    up.pop(); lo.pop();
    return lo.concat(up);
  }

  function render3D(def, p, o) {
    var thumb = !!o.thumb, plain = !!o.plain, H = !thumb && o.hl && o.hl.length;
    var res = thumb ? { seg: 32, lat: 16 } : { seg: 64, lat: 24, sphereSeg: 72, sphereLat: 36 };
    var m = def.mesh(p, res);
    var rt = rotator(o.yaw * D2R, o.pitch * D2R);
    var b0 = [Infinity, Infinity, Infinity], b1 = [-Infinity, -Infinity, -Infinity];
    m.v.forEach(function (q) { for (var k = 0; k < 3; k++) { if (q[k] < b0[k]) b0[k] = q[k]; if (q[k] > b1[k]) b1[k] = q[k]; } });
    var c = mul(add(b0, b1), 0.5), rad = 0;
    m.v.forEach(function (q) { var d = len(sub(q, c)); if (d > rad) rad = d; });
    var Rpx = thumb ? 25 : (o.size || 150), sc = Rpx / rad, cV = rt(c);
    var toView = function (q) { var r = rt(q); return [r[0] - cV[0], r[1] - cV[1], r[2] - cV[2]]; };
    var S = function (q) { return [q[0] * sc, -q[1] * sc]; };
    var V = m.v.map(toView);
    var cv = new Canvas(thumb);
    var sw = thumb ? 1.4 : 2.25;
    var eps = 0.006 * rad, margin = 0.25 / sc, tol = 1e-9 * rad;

    /* faces */
    var F = m.f.map(function (f, i) {
      var pts = f.v.map(function (j) { return V[j]; }), n = nrm(newell(pts)), cz = 0, x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      pts.forEach(function (q) { cz += q[2] / pts.length; if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0]; if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1]; });
      return { i: i, pts: pts, n: n, front: n[2] > 1e-6, cz: cz, x0: x0, x1: x1, y0: y0, y1: y1, g: f.g };
    });
    var front = F.filter(function (f) { return f.front && f.n[2] > 1e-4; });
    function occluded(Pt, own) {
      for (var k = 0; k < front.length; k++) {
        var f = front[k];
        if (own && own.indexOf(f.i) >= 0) continue;
        if (Pt[0] < f.x0 - margin || Pt[0] > f.x1 + margin || Pt[1] < f.y0 - margin || Pt[1] > f.y1 + margin) continue;
        var pts = f.pts, inside = true;
        for (var j = 0; j < pts.length; j++) {
          var a = pts[j], b = pts[(j + 1) % pts.length], ex = b[0] - a[0], ey = b[1] - a[1], el = Math.sqrt(ex * ex + ey * ey);
          if (el < 1e-12) continue;
          if (ex * (Pt[1] - a[1]) - ey * (Pt[0] - a[0]) < -tol * el) { inside = false; break; }
        }
        if (!inside) continue;
        var zf = pts[0][2] - (f.n[0] * (Pt[0] - pts[0][0]) + f.n[1] * (Pt[1] - pts[0][1])) / f.n[2];
        if (zf > Pt[2] + eps) return true;
      }
      return false;
    }

    /* fills */
    var shadeOf = function (n) { return rampColor(Math.pow(Math.max(0, dot(n, LIGHT)), 0.85)); };
    var screenPts = function (pts) { return pts.map(S); };
    if (def.convex) {
      var hp = hull(V.map(S));
      cv.path('fill', hp, 'fill="' + COL.ramp[0] + '" stroke="' + COL.ramp[0] + '" stroke-width="0.5" stroke-linejoin="round"', true);
      var groups = {};
      F.forEach(function (f) { if (!f.front) return; var col = shadeOf(f.n); (groups[col] = groups[col] || []).push(screenPts(f.pts)); });
      Object.keys(groups).forEach(function (col) { cv.multi('fill', groups[col], 'fill="' + col + '" stroke="' + col + '" stroke-width="0.5" stroke-linejoin="round"'); });
    } else {
      var back = F.filter(function (f) { return !f.front; }).sort(function (a, b) { return a.cz - b.cz; });
      var fr = F.filter(function (f) { return f.front; }).sort(function (a, b) { return a.cz - b.cz; });
      var runs = [];
      back.forEach(function (f) { runs.push([COL.ramp[0], screenPts(f.pts)]); });
      fr.forEach(function (f) { runs.push([shadeOf(f.n), screenPts(f.pts)]); });
      var cur = null, acc = [];
      runs.forEach(function (rn) {
        if (rn[0] !== cur && acc.length) { cv.multi('fill', acc, 'fill="' + cur + '" stroke="' + cur + '" stroke-width="0.5" stroke-linejoin="round"'); acc = []; }
        cur = rn[0]; acc.push(rn[1]);
      });
      if (acc.length) cv.multi('fill', acc, 'fill="' + cur + '" stroke="' + cur + '" stroke-width="0.5" stroke-linejoin="round"');
    }

    /* segment visibility */
    function pieces(Pa, Pb, own, noOcc) {
      var sa = S(Pa), sb = S(Pb), L = len(sub(sb, sa));
      if (L < 1e-6) return [];
      var n = Math.min(40, Math.max(1, Math.ceil(L / 5))), hid = [], out = [], k;
      for (k = 0; k < n; k++) hid.push(noOcc ? false : occluded(lerp(Pa, Pb, (k + 0.5) / n), own));
      for (k = 1; k < n - 1; k++) if (hid[k - 1] === hid[k + 1] && hid[k] !== hid[k - 1]) hid[k] = hid[k - 1];
      for (k = 0; k < n; k++) out.push({ a: lerp(sa, sb, k / n), b: lerp(sa, sb, (k + 1) / n), hid: hid[k] });
      return out;
    }
    function emit(list, visAttr, hidAttr, layerVis, layerHid, showHidden) {
      var vis = list.filter(function (s) { return !s.hid; }), hid = list.filter(function (s) { return s.hid; });
      chain(vis).forEach(function (pl) { cv.path(layerVis, pl, visAttr); });
      if (showHidden) chain(hid).forEach(function (pl) { cv.path(layerHid, pl, hidAttr); });
    }

    /* edges: feature + contour */
    var edges = {}, ek = function (a, b) { return a < b ? a + '_' + b : b + '_' + a; };
    m.f.forEach(function (f, fi) {
      for (var j = 0; j < f.v.length; j++) {
        var a = f.v[j], b = f.v[(j + 1) % f.v.length];
        if (a === b) continue;
        var k = ek(a, b);
        (edges[k] = edges[k] || { a: Math.min(a, b), b: Math.max(a, b), f: [] }).f.push(fi);
      }
    });
    var segs = [];
    Object.keys(edges).forEach(function (k) {
      var e = edges[k];
      if (len(sub(m.v[e.a], m.v[e.b])) < 1e-9) return;
      if (e.f.length >= 2) {
        var f1 = F[e.f[0]], f2 = F[e.f[1]];
        if (f1.g && f1.g === f2.g) return;
        if (dot(f1.n, f2.n) > 0.9999) return;
      }
      segs = segs.concat(pieces(V[e.a], V[e.b], e.f));
    });
    var nz = m.n.map(function (n) { return n ? rt(n)[2] : 0; });
    var vf = m.v.map(function () { return []; });
    m.f.forEach(function (f, fi) { f.v.forEach(function (vi) { vf[vi].push(fi); }); });
    F.forEach(function (f) {
      if (!f.g) return;
      var ring = [];
      m.f[f.i].v.forEach(function (vi) { ring = ring.concat(vf[vi]); });
      var vs = m.f[f.i].v, cr = [];
      for (var j = 0; j < vs.length; j++) {
        var a = vs[j], b = vs[(j + 1) % vs.length];
        if ((nz[a] > 0) === (nz[b] > 0)) continue;
        var lo = Math.min(a, b), hi = Math.max(a, b), t = nz[lo] / (nz[lo] - nz[hi]);
        var e = edges[ek(a, b)], nb = e ? e.f.filter(function (x) { return x !== f.i; }) : [];
        cr.push({ P: lerp(V[lo], V[hi], t), nb: nb });
      }
      for (var q = 0; q + 1 < cr.length; q += 2) segs = segs.concat(pieces(cr[q].P, cr[q + 1].P, ring));
    });
    emit(segs, attrsLine(COL.edge, sw), attrsLine(COL.hidden, 1.5, '6 5'), 'edge', 'hid', o.hidden && !thumb);

    /* glow for surfaces (x-ray: hidden faces glow too) */
    if (H) {
      var mN = m.f.map(function (f) { return nrm(newell(f.v.map(function (j) { return m.v[j]; }))); });
      var GROUPS = {
        side: function (f) { return f.lat === 'side' || f.lat === 'outer' || f.lat === 'surface' || f.lat === 'dome'; },
        inner: function (f) { return f.lat === 'inner'; },
        bottom: function (f, i) { return mN[i][1] < -0.99; },
        top: function (f, i) { return mN[i][1] > 0.99 || f.lat === 'top'; },
        ends: function (f) { return !f.lat; }
      };
      Object.keys(GROUPS).forEach(function (part) {
        if (!hlWants(o, part)) return;
        var inG = {}, gl = [];
        m.f.forEach(function (f, i) { if (GROUPS[part](f, i)) { inG[i] = true; gl.push(i); } });
        if (!gl.length) return;
        cv.hlFill(part, gl.map(function (i) { return screenPts(F[i].pts); }));
        var hs = [];
        Object.keys(edges).forEach(function (k) {
          var e = edges[k], fs = e.f.filter(function (fi) { return inG[fi]; });
          if (!fs.length || len(sub(m.v[e.a], m.v[e.b])) < 1e-9) return;
          if (fs.length >= 2) {
            var g1 = m.f[fs[0]].g, g2 = m.f[fs[1]].g;
            if (g1 && g1 === g2) return;
            if (dot(mN[fs[0]], mN[fs[1]]) > 0.9999) return;
          }
          hs.push({ a: S(V[e.a]), b: S(V[e.b]) });
        });
        gl.forEach(function (i) {
          if (!m.f[i].g) return;
          var vs = m.f[i].v, cr = [];
          for (var j = 0; j < vs.length; j++) {
            var a = vs[j], b = vs[(j + 1) % vs.length];
            if ((nz[a] > 0) === (nz[b] > 0)) continue;
            var lo = Math.min(a, b), hi = Math.max(a, b), t = nz[lo] / (nz[lo] - nz[hi]);
            cr.push(S(lerp(V[lo], V[hi], t)));
          }
          for (var q = 0; q + 1 < cr.length; q += 2) hs.push({ a: cr[q], b: cr[q + 1] });
        });
        cv.hlLine(part, chain(hs));
      });
      if (hlWants(o, 'all')) { var hh = hull(V.map(S)); cv.hlFill('all', [hh]); cv.hlLine('all', [hh], true); }
    }

    /* annotations */
    var ctx3 = { facing: function (n3) { return rt(n3)[2] > 1e-9; }, view: toView, allAngles: !!o.allAngles, moreDims: !!o.moreDims };
    var A = def.annot ? def.annot(p, ctx3) : {};
    (A.curves || []).forEach(function (cu) {
      var cs = [], pts = cu.pts.map(toView);
      for (var i = 0; i < pts.length - (cu.closed ? 0 : 1); i++) cs = cs.concat(pieces(pts[i], pts[(i + 1) % pts.length], null));
      emit(cs, attrsLine(COL.edge, thumb ? 1 : 1.5), attrsLine(COL.hidden, 1.25, '6 5'), 'edge', 'hid', !thumb);
    });
    if (plain) return cv.svg(o);

    var cenS = S(toView(c));
    var dirs = {};
    function pick(cands, pref, useVis) {
      var best = null, bs = -Infinity, pn = nrm(pref);
      cands.forEach(function (cd) {
        var a = toView(cd[0]), b = toView(cd[1]), sa = S(a), sb = S(b), sc2;
        if (useVis) {
          sc2 = dot(sub(lerp(sa, sb, 0.5), cenS), pn) / Rpx;
          if (!occluded(lerp(a, b, 0.5), null)) sc2 += 100;
        } else sc2 = dot(nrm(sub(sb, sa)), pn);
        if (sc2 > bs) { bs = sc2; best = cd; }
      });
      return best;
    }
    (A.lines || []).forEach(function (ln) {
      var hp = H ? hlDim(o, ln.lab && ln.lab.letter) : null, gone = !!(ln.lab && labelText(ln.lab, o) === null);
      if (gone && !hp) return;
      var ab = ln.cands ? pick(ln.cands, ln.pref, false) : [ln.a, ln.b];
      var Pa = toView(ab[0]), Pb = toView(ab[1]), sa = S(Pa), sb = S(Pb);
      if (hp) cv.hlLine(hp, [[sa, sb]]);
      if (gone) return;
      if (ln.name) dirs[ln.name] = nrm(sub(ab[1], ab[0]));
      var pc = pieces(Pa, Pb, null, ln.noOcc);
      emit(pc, attrsLine(COL.red, 1.75), attrsLine(COL.red, 1.5, '6 4'), 'ann', 'ann', true);
      var txt = labelText(ln.lab, o), u = nrm(sub(sb, sa));
      if (txt) { var bx = cv.label(lerp(sa, sb, ln.at == null ? 0.5 : ln.at), txt, COL.red, [-u[1], u[0]]); if (hp) cv.hlBox(hp, bx); }
    });
    (A.glows || []).forEach(function (gw) {
      var hp = H ? hlDim(o, gw.letter) : null;
      if (hp) cv.hlLine(hp, [gw.pts ? gw.pts.map(function (q) { return S(toView(q)); }) : [S(toView(gw.a)), S(toView(gw.b))]], !!gw.closed);
    });
    (A.ras || []).forEach(function (r) {
      if (r.derived && (o.derivedAngles || o.derived) === 'hide') return;
      var u = r.uFrom ? dirs[r.uFrom] : r.u;
      if (!u) return;
      var k = 11 / sc, Pv = toView(r.p), Uv = sub(toView(add(r.p, mul(u, k))), Pv), Vv = sub(toView(add(r.p, mul(r.v, k))), Pv);
      var hidden = occluded(add(Pv, mul(add(Uv, Vv), 0.5)), null);
      drawRA(cv, S(Pv), mul(S(Uv), 1 / 11), mul(S(Vv), 1 / 11), 11, hidden);
    });
    (A.dots || []).forEach(function (d) {
      var q = S(toView(d));
      cv.L.mark.push('<circle ' + partAttr('mark', 'dot') + 'cx="' + N(q[0]) + '" cy="' + N(q[1]) + '" r="2.75" fill="' + COL.edge + '"/>');
    });
    (A.dims || []).forEach(function (dm) {
      var txt = labelText(dm.lab, o), hp = H ? hlDim(o, dm.lab && dm.lab.letter) : null;
      if (txt === null && !hp) return;
      var ab = pick(dm.cands, dm.pref, true), sa = S(toView(ab[0])), sb = S(toView(ab[1])), u = nrm(sub(sb, sa)), n = [-u[1], u[0]];
      if (dot(n, sub(lerp(sa, sb, 0.5), cenS)) < 0) n = mul(n, -1);
      drawDim(cv, sa, sb, txt, n, 22, hp);
    });
    if (o.allAngles || o.moreDims || A.angs || A.auxs || A.texts) {
      var X3 = { auxs: (A.auxs || []).slice(), lines: [], texts: (A.texts || []).slice(), angs: (A.angs || []).slice() };
      if (o.allAngles && A3[def.id]) { var a3 = A3[def.id](p, ctx3); X3.auxs = X3.auxs.concat(a3.auxs || []); X3.angs = X3.angs.concat(a3.angs || []); }
      if (o.moreDims && MD3[def.id]) X3.lines = MD3[def.id](p);
      var cen3 = null;
      if (X3.angs.length) {
        /* the middle of the drawing, for labels that have to go outside the shape */
        cen3 = [0, 0];
        m.v.forEach(function (q) { var t3 = S(toView(q)); cen3[0] += t3[0] / m.v.length; cen3[1] += t3[1] / m.v.length; });
      }
      extra3D(X3, { cv: cv, S: S, toView: toView, sc: sc, occluded: occluded, pieces: pieces, emit: emit, H: H, cen: cen3 }, o);
    }
    return cv.svg(o);
  }

  /* ---------------- nets ---------------- */
  function netBuild(def, p, res) {
    var nd = def.net(p, res), cnt = {}, segs = [];
    var q = function (pt) { return Math.round(pt[0] * 1e6) + ',' + Math.round(pt[1] * 1e6); };
    nd.panels.forEach(function (pn) {
      var pts = pn.pts;
      for (var i = 0; i < pts.length; i++) {
        var a = pts[i], b = pts[(i + 1) % pts.length], ka = q(a), kb = q(b);
        if (ka === kb) continue;
        var k = ka < kb ? ka + '|' + kb : kb + '|' + ka;
        (cnt[k] = cnt[k] || { a: a, b: b, n: 0 }).n++;
      }
    });
    var folds = [], cuts = [];
    Object.keys(cnt).forEach(function (k) { var e = cnt[k]; if (e.n >= 2) folds.push(e); else cuts.push(e); });
    var res = { panels: nd.panels, prims: nd.prims, folds: folds, cuts: cuts };
    if (nd.map) res.map = nd.map;
    if (nd.fan) res.fan = nd.fan;
    return res;
  }
  function renderNet(def, p, o) {
    var nb = netBuild(def, p, { circle: o.thumb ? 48 : 128 });
    var prims = nb.panels.map(function (pn) { return { t: 'panel', rings: [pn.pts], role: pn.role }; });
    nb.folds.forEach(function (e) { prims.push({ t: 'fold', a: e.a, b: e.b }); });
    chain(nb.cuts.map(function (e) { return { a: e.a, b: e.b }; }), 1e5).forEach(function (pl) {
      var closed = pl.length > 2 && Math.abs(pl[0][0] - pl[pl.length - 1][0]) < 1e-9 && Math.abs(pl[0][1] - pl[pl.length - 1][1]) < 1e-9;
      prims.push({ t: 'cut', pts: closed ? pl.slice(0, -1) : pl, closed: closed });
    });
    prims = prims.concat(nb.prims || []);
    if (o.allAngles && NA[def.id]) prims = prims.concat(NA[def.id](p, nb));
    return render2D(prims, o, 420, 300);
  }

  /* ---------------- glossary ---------------- */
  /* Plain trade definitions. Each term names the parts it lights; view is 'flat', '3d' or 'net', ao the triangle angle options. */
  var ROUND2 = { circle: 1, semicircle: 1 }, NETS9 = { cube: 1, 'rectangular-prism': 1, 'triangular-prism': 1, 'hexagonal-prism': 1, cylinder: 1, cone: 1, frustum: 1, 'square-pyramid': 1, 'pyramid-frustum': 1 };
  var SLANT = { cone: 1, frustum: 1, 'square-pyramid': 1, 'pyramid-frustum': 1 }, POLYNET = { cube: 1, 'rectangular-prism': 1, 'triangular-prism': 1, 'hexagonal-prism': 1, 'square-pyramid': 1, 'pyramid-frustum': 1 };
  var TRI4 = { 'right-triangle': 1, 'equilateral-triangle': 1, 'isosceles-triangle': 1, 'scalene-triangle': 1 };
  /* Unusual shapes: the parts the shared terms light on them (the common shapes keep exactly what they had) */
  var UX = {
    R2: { torus: 1, elbow: 1, 'ring-sector': 1, lune: 1, star: 1 },
    R1: { stadium: 'dim:r', 'mitred-cylinder': 'dim:r', capsule: 'dim:r', 'spherical-cap': 'dim:a' },
    noBase: { torus: 1, elbow: 1, capsule: 1, 'i-beam': 1, channel: 1, 'angle-iron': 1, 'hss-tube': 1 },
    bar: { 'i-beam': 1, channel: 1, 'angle-iron': 1 },
    plat: { tetrahedron: 1, octahedron: 1, dodecahedron: 1, icosahedron: 1 },
    fold: { 'i-beam': 1, channel: 1, 'angle-iron': 1, 'polygon-prism': 1, tetrahedron: 1, octahedron: 1, dodecahedron: 1, icosahedron: 1 },
    girth3: { 'i-beam': ['dim:P'], channel: ['dim:P'], 'angle-iron': ['dim:P'], 'hss-tube': ['dim:Po'], 'polygon-prism': ['dim:P'] },
    arc: { 'ring-sector': ['dim:L', 'dim:l'], lune: ['dim:Lo', 'dim:Li'], elbow: ['dim:Lh', 'dim:Lt'] }
  };
  function uxList(map, id) { return map[id] ? map[id].slice() : []; }
  function onlyIf(cond, parts) { return cond ? parts : []; }
  function angOn(id, ao) { return !!(TRI4[id] && ao && ao.on); }
  var ANG3 = ['ang:A', 'ang:B', 'ang:C'];
  var TERMS = {
    diameter: { label: 'Diameter', m: 'diameters?', def: 'The distance straight across a circle through its centre, D = 2 × r. Use the diameter for the distance around: C = π × D.',
      hl: function (id, view) {
        if (view === 'net') return id === 'frustum' ? ['dim:D', 'dim:d'] : onlyIf(id === 'cylinder' || id === 'cone' || id === 'mitred-cylinder', ['dim:D']);
        return onlyIf(ROUND2[id] || id === 'stadium', ['dim:D']);
      } },
    radius: { label: 'Radius', m: 'radius|radii', def: 'The distance from the centre of a circle to its edge, half the diameter. Use the radius for area: A = π × r².',
      hl: function (id, view) {
        if (view === 'net') return [];
        if (id === 'annulus' || id === 'pipe' || id === 'frustum' || UX.R2[id]) return ['dim:R', 'dim:r'];
        if (UX.R1[id]) return [UX.R1[id]];
        return onlyIf({ circle: 1, semicircle: 1, 'quarter-circle': 1, sector: 1, cylinder: 1, cone: 1, sphere: 1, hemisphere: 1 }[id], ['dim:r']);
      } },
    circumference: { label: 'Circumference', m: 'circumferences?', def: 'The distance all the way around a circle. C = π × D.',
      hl: function (id, view) {
        if (view === 'net') return id === 'frustum' ? ['dim:πD', 'dim:πd'] : onlyIf(id === 'cylinder' || id === 'cone', ['dim:πD']);
        return id === 'circle' ? ['outline'] : onlyIf(id === 'annulus', ['dim:C', 'dim:c']);
      } },
    'stretch-out': { label: 'Stretch-out', m: 'stretch-?outs?', def: 'The length of flat sheet that wraps once around the part. For a round part it is the distance around: π × D.',
      hl: function (id, view) {
        if (view !== 'net') return [];
        if (id === 'frustum') return ['dim:πD', 'dim:πd'];
        if (id === 'cylinder' || id === 'cone' || id === 'mitred-cylinder') return ['dim:πD'];
        return onlyIf({ cube: 1, 'triangular-prism': 1, 'hexagonal-prism': 1, 'polygon-prism': 1 }[id] || UX.bar[id], ['panels:lat']);
      } },
    girth: { label: 'Girth', m: 'girth', def: 'The distance around a box or prism, measured across its sides. It sets the length of the flat strip that wraps the part.',
      hl: function (id, view) { if (view !== 'net') return uxList(UX.girth3, id); return id === 'rectangular-prism' ? ['dim:w', 'dim:h'] : onlyIf({ cube: 1, 'triangular-prism': 1, 'hexagonal-prism': 1, 'polygon-prism': 1 }[id] || UX.bar[id], ['panels:lat']); } },
    arc: { label: 'Arc', m: 'arcs?', def: 'A curved part of the edge of a circle.',
      hl: function (id, view) { if (view === 'net') return id === 'frustum' ? ['dim:πD', 'dim:πd'] : onlyIf(id === 'cone', ['dim:πD']); return id === 'sector' ? ['dim:L'] : uxList(UX.arc, id); } },
    'sector angle': { label: 'Sector angle θ', m: 'sector angle|angle θ', def: 'The angle θ at the point of a sector. For a cone pattern, θ = 360 × r ÷ l.',
      hl: function (id, view) { return view === 'net' ? onlyIf(id === 'cone' || id === 'frustum', ['ang:θ']) : onlyIf(id === 'sector', ['ang:θ']); } },
    sector: { label: 'Sector', m: 'sectors?', def: 'A slice of a circle between two radii, like a slice of pie. A cone opens out flat into a sector.',
      hl: function (id, view) { return view === 'net' ? onlyIf(id === 'cone', ['panels:lat']) : onlyIf(id === 'sector', ['fill']); } },
    'slant height': { label: 'Slant height', m: 'slant heights?', def: 'The distance up the sloped side of a cone or pyramid, from the bottom edge to the top. It is longer than the straight-up height.',
      hl: function (id, view) { return onlyIf(SLANT[id] && view !== 'flat', ['dim:l']); } },
    'lateral area': { label: 'Lateral area', m: 'lateral areas?', def: 'The area of the sides only, not the top or the bottom.',
      hl: function (id, view) { if (view === 'net') return onlyIf(NETS9[id], ['panels:lat']); return onlyIf(view === '3d' && id !== 'sphere', ['side']); } },
    'surface area': { label: 'Surface area', m: 'surface areas?', def: 'The total area of every face of a solid: the sides, the top and the bottom.',
      hl: function (id, view) { return view === 'net' ? ['panels:all'] : onlyIf(view === '3d', ['all']); } },
    'base area': { label: 'Base area', m: 'base areas?', def: 'The area of the bottom face of a solid.',
      hl: function (id, view) {
        if (view === 'net') return onlyIf(!UX.noBase[id], ['panels:base']);
        if (view !== '3d' || id === 'sphere' || UX.noBase[id]) return [];
        return id === 'triangular-prism' ? ['ends'] : id === 'hemisphere' ? ['top'] : ['bottom'];
      } },
    volume: { label: 'Volume', m: 'volumes?', def: 'How much space a solid takes up, measured in cubic units such as cm³.',
      hl: function (id, view) { return onlyIf(view === '3d', ['all']); } },
    capacity: { label: 'Capacity', m: 'capacity', def: 'How much a hollow part or tank can hold inside, measured in cubic units or litres.',
      hl: function (id, view) { return onlyIf(view === '3d' && (id === 'pipe' || id === 'hss-tube'), ['inner']); } },
    apothem: { label: 'Apothem', m: 'apothems?', def: 'The distance from the centre of a regular polygon straight out to the middle of a side.',
      hl: function (id) { return onlyIf(id === 'pentagon' || id === 'polygon-prism', ['dim:a']); } },
    'across flats': { label: 'Across flats (AF)', m: 'across flats', def: 'The distance between two opposite flat sides of a hexagon or octagon. On a nut or bolt head this is the wrench size.',
      hl: function (id, view) { return view === 'net' ? onlyIf(id === 'hexagonal-prism', ['panels:base']) : onlyIf(id === 'hexagon' || id === 'octagon', ['dim:AF']); } },
    'across corners': { label: 'Across corners (AC)', m: 'across corners', def: 'The distance between two opposite corners of a regular polygon. It is longer than across flats.',
      hl: function (id) { return onlyIf(id === 'hexagon' || id === 'octagon', ['dim:AC']); } },
    hypotenuse: { label: 'Hypotenuse', m: 'hypotenuses?', def: 'The longest side of a right triangle. It is across from the 90° corner.',
      hl: function (id) { return onlyIf(id === 'right-triangle', ['dim:c']); } },
    leg: { label: 'Leg', m: 'legs?|equal sides?', def: 'One of the two sides that form the 90° corner of a right triangle. In an isosceles triangle, the two equal sides are also called legs.',
      hl: function (id) { return id === 'right-triangle' ? ['dim:b', 'dim:h'] : onlyIf(id === 'isosceles-triangle', ['dim:a']); } },
    perimeter: { label: 'Perimeter', m: 'perimeters?', def: 'The distance all the way around the outside of a flat shape.',
      hl: function (id, view) { return onlyIf(view === 'flat', ['outline']); } },
    diagonal: { label: 'Diagonal', m: 'diagonals?', def: 'A straight line joining two opposite corners.',
      hl: function (id) { return onlyIf(id === 'square' || id === 'rectangle', ['dim:d']); } },
    area: { label: 'Area', m: 'area', def: 'The amount of flat surface inside a shape, measured in square units such as cm².',
      hl: function (id, view) { return onlyIf(view === 'flat', ['fill']); } },
    height: { label: 'Height', m: 'heights?', def: 'The straight distance from the base to the top, measured square (at 90°) to the base.',
      hl: function (id, view) {
        var H = view === 'net' ? { 'rectangular-prism': 1, 'triangular-prism': 1, 'hexagonal-prism': 1, cylinder: 1, 'polygon-prism': 1 }
          : view === 'flat' ? { 'right-triangle': 1, 'equilateral-triangle': 1, 'isosceles-triangle': 1, 'scalene-triangle': 1, parallelogram: 1, trapezoid: 1 }
            : { 'rectangular-prism': 1, 'triangular-prism': 1, 'hexagonal-prism': 1, cylinder: 1, pipe: 1, cone: 1, frustum: 1, 'square-pyramid': 1, 'pyramid-frustum': 1, 'polygon-prism': 1, 'spherical-cap': 1 };
        return onlyIf(H[id], ['dim:h']);
      } },
    blank: { label: 'Blank', m: 'blanks?', def: 'The rectangle of sheet that the pattern is cut from.',
      hl: function (id, view) { return onlyIf(view === 'net', ['blank']); } },
    pattern: { label: 'Pattern', m: 'patterns?', def: 'The flat shape cut from sheet and then folded or rolled to make the part.',
      hl: function (id, view) { return onlyIf(view === 'net', ['panels:all']); } },
    waste: { label: 'Waste (offcut)', m: 'waste|offcuts?', def: 'The sheet left over after the pattern is cut from the blank: blank area − pattern area.',
      hl: function (id, view) { return onlyIf(view === 'net', ['blank', 'panels:all']); } },
    net: { label: 'Net', m: 'nets?', def: 'A solid opened out and laid flat, with the faces joined along the fold lines.',
      hl: function (id, view) { return onlyIf(view === 'net', ['panels:all']); } },
    'fold line': { label: 'Fold line', m: 'fold lines?', def: 'A line on the net where the sheet is bent. It is drawn dashed.',
      hl: function (id, view) { return onlyIf(view === 'net' && (POLYNET[id] || UX.fold[id]), ['folds']); } },
    frustum: { label: 'Frustum', m: 'frustums?|frusta', def: 'A cone or pyramid with the top cut off flat, parallel to the base.',
      hl: function (id, view) { return onlyIf(id === 'frustum' || id === 'pyramid-frustum', view === 'net' ? ['panels:all'] : ['all']); } },
    OD: { label: 'OD (outside diameter)', m: 'OD|outside diameter', cs: true, def: 'Outside diameter: the distance straight across the outside of a ring or pipe. OD = 2 × R.',
      hl: function (id, view) {
        if (id === 'torus' && view === '3d') return ['dim:OD'];
        if (id === 'mitred-cylinder' && view === 'net') return ['dim:D'];
        if ((id === 'elbow' || id === 'mitred-cylinder') && view === '3d') return ['dim:r'];
        return id === 'annulus' ? ['dim:C', 'dim:R'] : onlyIf(id === 'pipe' && view === '3d', ['dim:R']);
      } },
    ID: { label: 'ID (inside diameter)', m: 'ID|inside diameter', cs: true, def: 'Inside diameter: the distance straight across the hole. ID = 2 × r.',
      hl: function (id, view) { if (id === 'torus' && view === '3d') return ['dim:ID']; return id === 'annulus' ? ['dim:c', 'dim:r'] : onlyIf(id === 'pipe' && view === '3d', ['inner', 'dim:r']); } },
    'angle sum': { label: 'Angle sum', m: 'angle sum|angles add to 180°?', def: 'The three angles inside any triangle add up to 180°.',
      hl: function (id, view, ao) { return onlyIf(angOn(id, ao), ANG3); } },
    'soh cah toa': { label: 'SOH CAH TOA', m: 'SOH CAH TOA|SOH|CAH|TOA', cs: true, def: 'A memory aid for right triangles: Sin = Opposite ÷ Hypotenuse, Cos = Adjacent ÷ Hypotenuse, Tan = Opposite ÷ Adjacent.',
      hl: function (id, view, ao) {
        if (id === 'right-triangle') return (angOn(id, ao) ? ['ang:A'] : []).concat(['dim:h', 'dim:b', 'dim:c']);
        return onlyIf(id === 'isosceles-triangle', (angOn(id, ao) ? ['ang:A'] : []).concat(['dim:h', 'dim:b']));
      } },
    opposite: { label: 'Opposite side', m: 'opposite', def: 'In a right triangle, the side across from the angle you are working with.',
      hl: function (id, view, ao) { return onlyIf(id === 'right-triangle' || id === 'isosceles-triangle', (angOn(id, ao) ? ['ang:A'] : []).concat(['dim:h'])); } },
    adjacent: { label: 'Adjacent side', m: 'adjacent', def: 'In a right triangle, the side beside the angle you are working with that is not the hypotenuse.',
      hl: function (id, view, ao) { return onlyIf(id === 'right-triangle' || id === 'isosceles-triangle', (angOn(id, ao) ? ['ang:A'] : []).concat(['dim:b'])); } },
    'inverse trig': { label: 'Inverse trig (sin⁻¹, cos⁻¹, tan⁻¹)', m: 'inverse trig|(?:sin|cos|tan)⁻¹', def: 'sin⁻¹, cos⁻¹ and tan⁻¹ work backwards: they turn a ratio of two sides into an angle. On the TI-30Xa press 2nd, then SIN, COS or TAN.',
      hl: function (id, view, ao) { return onlyIf(angOn(id, ao), ANG3); } },
    'law of cosines': { label: 'Law of cosines', m: 'law of cosines', def: 'For any triangle, a² = b² + c² − 2 × b × c × cos A. Use it when you know two sides and the angle between them, or all three sides.',
      hl: function (id, view, ao) {
        if (id === 'star') return ['dim:e', 'dim:R', 'dim:r', 'ang:φ'];
        if (id === 'lune') return ['ang:θ₁', 'ang:θ₂', 'dim:e', 'dim:R', 'dim:r'];
        return onlyIf(id === 'scalene-triangle', ['dim:a', 'dim:b', 'dim:c'].concat(angOn(id, ao) ? ['ang:A'] : []));
      } },
    'law of sines': { label: 'Law of sines', m: 'law of sines', def: 'For any triangle, a ÷ sin A = b ÷ sin B = c ÷ sin C. Use it when you know a side and the angle across from it.',
      hl: function (id, view, ao) { return onlyIf(id === 'scalene-triangle', angOn(id, ao) ? ['dim:a', 'ang:A', 'dim:b', 'ang:B'] : ['dim:a', 'dim:b']); } },
    heron: { label: 'Heron’s formula', m: 'Heron’s formula', def: 'Finds the area of a triangle from its three sides, using s, half the perimeter.',
      hl: function (id) { return onlyIf(id === 'scalene-triangle', ['fill']); } },
    /* ---- words for the Unusual shapes ---- */
    torus: { label: 'Torus', m: 'torus|tori', def: 'A ring shape like a doughnut or an O-ring, made by swinging a circle around a centre line.',
      hl: function (id, view) { return onlyIf(id === 'torus' && view === '3d', ['all']); } },
    elbow: { label: 'Elbow', m: 'elbows?', def: 'A pipe fitting that turns a run of pipe through an angle, such as 90° or 45°.',
      hl: function (id, view) { return onlyIf(id === 'elbow' && view === '3d', ['all']); } },
    'bend radius': { label: 'Bend radius (centre line radius)', m: 'bend radius|bend radii|centre line radius|center line radius', def: 'The radius of a bend measured to the centre line of the pipe. The throat is half a pipe diameter less and the heel half a pipe diameter more.',
      hl: function (id, view) { return onlyIf((id === 'elbow' || id === 'torus') && view === '3d', ['dim:R']); } },
    'take-out': { label: 'Take-out', m: 'take-?outs?|centre to end|center to end', def: 'The distance from the end of a fitting to the point where the two pipe centre lines meet. For an elbow it is bend radius × tan(θ ÷ 2).',
      hl: function (id) { return onlyIf(id === 'elbow', ['dim:T']); } },
    throat: { label: 'Throat', m: 'throats?', def: 'The inside, shorter curve of a pipe bend.',
      hl: function (id) { return onlyIf(id === 'elbow', ['dim:Lt']); } },
    heel: { label: 'Heel', m: 'heels?', def: 'The outside, longer curve of a pipe bend.',
      hl: function (id) { return onlyIf(id === 'elbow', ['dim:Lh']); } },
    'centre line': { label: 'Centre line', m: 'centre ?lines?|center ?lines?', def: 'An imaginary line down the middle of a pipe or bar. Pipe lengths and bends are measured along it.',
      hl: function (id) { return id === 'elbow' || id === 'mitred-cylinder' ? ['dim:L'] : onlyIf(id === 'torus', ['dim:C']); } },
    pappus: { label: 'Pappus’s rule', m: 'Pappus', def: 'A solid made by swinging a flat shape around an axis has volume = shape area × the distance its centre travels. Surface area works the same way with the length of the outline.',
      hl: function (id) { return id === 'torus' ? ['dim:C'] : onlyIf(id === 'elbow', ['dim:L']); } },
    mitre: { label: 'Mitre', m: 'mitres?|miters?|mitred|mitered', def: 'A joint where two pieces are cut at an angle and fitted together, like a picture-frame corner or a two-piece pipe bend.',
      hl: function (id, view) { return onlyIf(id === 'mitred-cylinder', view === 'net' ? ['panels:top'] : ['top']); } },
    'spherical cap': { label: 'Spherical cap (dish)', m: 'spherical caps?|dish(?:es|ed)?', def: 'A dome cut off a ball by one flat cut. A shallow one is the simplest dished end for a tank.',
      hl: function (id, view) { return onlyIf(id === 'spherical-cap' && view === '3d', ['side']); } },
    capsule: { label: 'Capsule', m: 'capsules?', def: 'A cylinder with a half sphere on each end.',
      hl: function (id, view) { return onlyIf(id === 'capsule' && view === '3d', ['all']); } },
    flange: { label: 'Flange', m: 'flanges?', def: 'The wide flat plates across the top and bottom of an I-beam or channel.',
      hl: function (id, view) { return onlyIf((id === 'i-beam' || id === 'channel') && view === '3d', ['dim:flange']); } },
    web: { label: 'Web', m: 'webs?', def: 'The upright plate in the middle of an I-beam or channel that joins the two flanges.',
      hl: function (id, view) { return onlyIf((id === 'i-beam' || id === 'channel') && view === '3d', ['dim:web']); } },
    hss: { label: 'HSS (hollow structural section)', m: 'HSS', cs: true, def: 'Steel tube with a square, rectangular or round shape, sold as hollow structural section.',
      hl: function (id, view) { return onlyIf(id === 'hss-tube' && view === '3d', ['all']); } },
    'wall thickness': { label: 'Wall thickness', m: 'wall thickness(?:es)?', def: 'The thickness of the metal in the wall of a tube or pipe.',
      hl: function (id, view) { return onlyIf(id === 'hss-tube' && view === '3d', ['dim:t']); } },
    'cross-section': { label: 'Cross-section', m: 'cross-?sections?|cross sections?', def: 'The flat shape you see when you cut straight across a bar, beam or tube.',
      hl: function (id, view) { return view === 'net' ? onlyIf(UX.bar[id], ['panels:base']) : onlyIf(view === '3d' && (UX.bar[id] || id === 'hss-tube' || id === 'polygon-prism'), ['ends']); } },
    reuleaux: { label: 'Reuleaux triangle', m: 'Reuleaux', def: 'A curved triangle made from three arcs, each centred on the opposite corner. It is the same width in every direction.',
      hl: function (id) { return onlyIf(id === 'reuleaux', ['outline']); } },
    'constant width': { label: 'Constant width', m: 'constant width', def: 'A shape of constant width measures the same between two parallel jaws, like a caliper, whichever way it is turned.',
      hl: function (id) { return onlyIf(id === 'reuleaux', ['dim:w']); } },
    obround: { label: 'Obround (stadium, slot)', m: 'obrounds?|stadiums?|slots?', def: 'A rectangle with a half circle on each end: the shape of a slot or a running track.',
      hl: function (id) { return onlyIf(id === 'stadium', ['fill']); } },
    lune: { label: 'Lune (crescent)', m: 'lunes?|crescents?', def: 'The crescent left when part of one circle is cut away by another circle that crosses it.',
      hl: function (id) { return onlyIf(id === 'lune', ['fill']); } },
    chord: { label: 'Chord', m: 'chords?', def: 'A straight line joining two points on a circle.',
      hl: function (id) { return onlyIf(id === 'lune', ['dim:c']); } },
    segment: { label: 'Segment of a circle', m: 'segments?', def: 'The part of a circle cut off by a straight line (a chord).',
      hl: function (id) { return id === 'lune' ? ['dim:S₁', 'dim:S₂'] : onlyIf(id === 'reuleaux', ['dim:S']); } },
    'ring sector': { label: 'Ring sector', m: 'ring sectors?|annular sectors?', def: 'A slice of a ring between two radii, like a curved flat bar.',
      hl: function (id) { return onlyIf(id === 'ring-sector', ['fill']); } },
    'platonic solid': { label: 'Platonic solid', m: 'Platonic solids?', def: 'A solid whose faces are all the same regular shape, with the same number meeting at every corner. There are five: the tetrahedron, cube, octahedron, dodecahedron and icosahedron.',
      hl: function (id, view) { return onlyIf(UX.plat[id], view === 'net' ? ['panels:all'] : ['all']); } },
    pi: { label: 'π (pi)', m: 'π', cs: true, def: 'π ≈ 3.1416. The distance around any circle is π times its diameter.',
      hl: function () { return []; } }
  };
  /* longest phrases first, so "slant height" wins over "height" and "sector angle" over "sector" */
  function termRe(keys) { return keys.map(function (k) { return { k: k, re: new RegExp('(^|[^A-Za-z])(' + TERMS[k].m + ')(?![A-Za-z])', TERMS[k].cs ? 'g' : 'gi'), n: TERMS[k].m.length }; }); }
  var TERM_RE = termRe(Object.keys(TERMS));
  var OLD_TERMS = Object.keys(TERMS);
  addTerms();
  var TERM_RE_ALL = termRe(Object.keys(TERMS));
  function findTerms(text, fo) {
    var hits = [];
    (isAll(fo) ? TERM_RE_ALL : TERM_RE).forEach(function (t) {
      t.re.lastIndex = 0;
      var m;
      while ((m = t.re.exec(text))) {
        var st = m.index + m[1].length, en = st + m[2].length;
        hits.push({ start: st, end: en, key: t.k });
        if (t.re.lastIndex === m.index) t.re.lastIndex++;
      }
    });
    hits.sort(function (a, b) { return a.start - b.start || (b.end - b.start) - (a.end - a.start); });
    var out = [], last = -1;
    hits.forEach(function (h) { if (h.start >= last) { out.push(h); last = h.end; } });
    return out;
  }
  /* parts that actually draw on this drawing */
  function drawnParts(id, params, opts, parts, isNet) {
    if (!parts || !parts.length) return [];
    var o = {}, k;
    for (k in (opts || {})) o[k] = opts[k];
    o.hl = parts; o.thumb = false;
    var svg = isNet ? net(id, params, o) : render(id, params, o), seen = {}, m, re = /data-hl="([^"]+)"/g;
    if (!svg) return [];
    while ((m = re.exec(svg))) seen[m[1].replace(/&amp;/g, '&')] = true;
    return parts.filter(function (p2) { return seen[p2]; });
  }
  function termView(id, opts) { var d = get(id); return d.kind === 'flat' ? 'flat' : (opts && opts.view === 'net' && d.net ? 'net' : '3d'); }
  function termParts(key, id, params, opts) {
    var t = TERMS[key];
    if (!t) return [];
    var view = termView(id, opts), ao = aoOf(opts);
    return drawnParts(id, params, opts, t.hl(id, view, ao), view === 'net');
  }

  /* ---------------- public API ---------------- */
  function get(id) { var d = DEF[id]; if (!d) throw new Error('Unknown shape: ' + id); return d; }
  function pinfo(d, q) {
    var o = { k: q.k, name: q.name, letter: q.letter, def: q.def, angle: d.angleParam === q.k || !!q.deg };
    if (q.min != null) o.min = q.min;
    if (q.max != null) o.max = q.max;
    if (q.int) o.int = true;
    return o;
  }
  function infoOf(d) {
    var o = {
      id: d.id, name: d.name, kind: d.kind, group: d.unusual ? 'Unusual shapes' : d.kind === 'flat' ? 'Flat shapes' : '3D solids', hasNet: !!d.net,
      angles: /triangle$/.test(d.id), angleInput: !!d.angIn,
      params: d.params.map(function (q) { return pinfo(d, q); })
    };
    /* unusual shapes: their own picker group, sizes that start in mm, and a plain note when there is no true flat pattern */
    if (d.unusual) { o.unusual = true; o.unit = d.unit; if (d.noNet) o.noNet = d.noNet; }
    if (d.added) { o.added = true; o.from = d.from; o.how = d.how; }
    return o;
  }
  /* parameter list in use: the angle-input list when a triangle is entered by angle */
  function plist(d, ao) { return d.angIn && aoOf(ao).input === 'angle' ? d.angIn.params : d.params; }
  function defaults(id, ao) { var o = {}; plist(get(id), ao).forEach(function (q) { o[q.k] = q.def; }); return o; }
  function fill(id, p, ao) { var d = defaults(id, ao); p = p || {}; for (var k in d) if (p[k] != null && isFinite(+p[k])) d[k] = +p[k]; return d; }
  function validate(id, p, ao) {
    var d = get(id), pl = plist(d, ao);
    for (var i = 0; i < pl.length; i++) {
      var q = pl[i], val = p ? p[q.k] : undefined;
      if (val === '' || val == null || !isFinite(+val) || +val <= 0) return { k: q.k, msg: q.name + ' (' + q.letter + ') must be a number greater than 0.' };
    }
    if (pl !== d.params) return d.angIn.validate ? d.angIn.validate(fill(id, p, ao)) : null;
    return d.validate ? d.validate(fill(id, p)) : null;
  }
  function random(id, mode, rng, ao) {
    var d = get(id), R = rng || Math.random, pl = plist(d, ao);
    var order = pl === d.params && d.rndOrder ? d.rndOrder : pl.map(function (q) { return q.k; });
    for (var tries = 0; tries < 300; tries++) {
      var p = {};
      order.forEach(function (k) {
        var q = pl.filter(function (x) { return x.k === k; })[0];
        var rg = typeof q.rnd === 'function' ? q.rnd(p) : q.rnd, lo = rg[0], hi = Math.max(rg[0], rg[1]);
        var val;
        if (q.deg) {
          /* angles in whole degrees: multiples of 5 for whole numbers */
          val = lo + R() * (hi - lo);
          val = (mode === 'whole' || !mode) ? Math.round(val / 5) * 5 : Math.round(val);
          p[k] = Math.max(lo, Math.min(hi, val));
          return;
        }
        if (q.int) { p[k] = Math.round(lo + R() * (hi - lo)); return; }
        if (d.angleParam === k) val = 15 * Math.round(lo + R() * (hi - lo));
        else if (mode === 'half') val = Math.round((lo + R() * (hi - lo)) * 2) / 2;
        else if (mode === 'tenth') val = Math.round((lo + R() * (hi - lo)) * 10) / 10;
        else val = Math.round(lo + R() * (hi - lo));
        p[k] = Math.max(d.angleParam === k ? 15 : (mode === 'whole' || !mode ? 1 : 0.5), val);
      });
      if (!validate(id, p, ao)) return p;
    }
    return defaults(id, ao);
  }
  function render(id, params, opts) { return withSty(opts, function () { return render0(id, params, opts); }); }
  function net(id, params, opts) { return withSty(opts, function () { return net0(id, params, opts); }); }
  function render0(id, params, opts) {
    var d = get(id), o = normOpts(opts), ao = { angles: o.angles, angleInput: o.angleInput }, p = fill(id, params, ao);
    if (validate(id, p, ao)) p = defaults(id, ao);
    if (o.allAngles) ao.allAngles = true;
    if (o.moreDims) ao.moreDims = true;
    if (d.kind === 'flat') return render2D(drawPrims(d, p, ao), o);
    return render3D(d, p, o);
  }
  function net0(id, params, opts) {
    var d = get(id);
    if (!d.net) return null;
    var o = normOpts(opts), p = fill(id, params);
    if (validate(id, p)) p = defaults(id);
    return renderNet(d, p, o);
  }
  function finish(items, extraNotes) {
    var notes = [];
    if (items.some(function (it) { return it.lines.join(' ').indexOf('π') >= 0; })) notes.push('π ≈ 3.1416. The answers use the full value of π from the calculator.');
    if (items.some(function (it) { return it.lines[it.lines.length - 1].indexOf('≈') >= 0; })) notes.push('≈ means the answer is rounded to 2 decimal places.');
    return { items: items, notes: notes.concat(extraNotes || []) };
  }
  function calc(id, params, units, ao) {
    var d = get(id), p = fill(id, params, ao), u = units || 'cm', byAng = d.angIn && aoOf(ao).input === 'angle';
    if (ao && ao.full) return calcFull(d, p, u, ao, byAng);
    return finish(assignHl(d, d.calc(p, u, ao), byAng, false), d.notes);
  }
  /* the highlight parts of each item (the shape's tables first, then the item's own), and its group in the full calc */
  function assignHl(d, items, byAng, grouped) {
    items.forEach(function (it) {
      it.hl = ((byAng && d.hlByAng && d.hlByAng[it.key]) || (d.hl && d.hl[it.key]) || it._hl || []).slice();
      if (it._hl) delete it._hl;
      if (grouped) { it.group = groupOf(it); if (it.lines) it.lines = tidyLines(it.lines); }
    });
    return items;
  }
  function calcFull(d, p, u, ao, byAng) {
    var ao2 = {}, k;
    for (k in ao) ao2[k] = ao[k];
    if (TRI4[d.id]) { ao2.angles = true; ao2.angleInput = aoOf(ao).input; }
    var items = d.calc(p, u, ao2), have = {};
    items.forEach(function (it) { have[it.key] = true; });
    if (XC[d.id]) XC[d.id](p, u, ao2).forEach(function (it) { if (!have[it.key]) { have[it.key] = true; items.push(it); } });
    return finish(assignHl(d, items, byAng, true), d.notes);
  }
  function layout(id, params, units) {
    var d = get(id);
    if (!d.layout) return null;
    var p = fill(id, params), items = d.layout(p, units || 'cm');
    items.forEach(function (it) { it.hl = ((d.layoutHl && d.layoutHl[it.key]) || []).slice(); });
    return finish(items, d.layoutNotes);
  }

  var api = {
    version: '1.0.0',
    colors: COL,
    list: function (lo) { var all = isAll(lo); return ORDER.filter(function (id) { return all || !DEF[id].added; }).map(function (id) { return infoOf(DEF[id]); }); },
    info: function (id) { return infoOf(get(id)); },
    defaults: defaults,
    validate: validate,
    random: random,
    render: render,
    net: net,
    calc: calc,
    layout: layout,
    terms: function (to) {
      var o = {};
      (isAll(to) ? Object.keys(TERMS) : OLD_TERMS).forEach(function (k) {
        o[k] = { label: TERMS[k].label, def: TERMS[k].def, hl: (function (key) { return function (id, params, view, opts) { var q = {}, j; for (j in (opts || {})) q[j] = opts[j]; q.view = view; return termParts(key, id, params, q); }; })(k) };
      });
      return o;
    },
    termParts: termParts,
    termCandidates: function (key, id, view, opts) { return TERMS[key] ? TERMS[key].hl(id, view, aoOf(opts)) : []; },
    findTerms: findTerms,
    drawnParts: function (id, params, opts, parts) { return drawnParts(id, params, opts, parts, termView(id, opts) === 'net'); },
    angleParams: function (id) { var d = get(id); return d.angIn ? d.angIn.params.map(function (q) { return pinfo(d, q); }) : null; },
    fmt: fmt,
    calcFull: function (id, params, units, ao) { var q = {}, k; for (k in (ao || {})) q[k] = ao[k]; q.full = true; return calc(id, params, units, q); },
    solidsOf: solidsOf,
    flatOf: flatOf,
    solve: solve,
    solvePaths: solvePaths,
    features: ['allAngles', 'moreDims', 'derivedAngles', 'full', 'solidsOf', 'solve', 'lenFormat', 'labelSize', 'arrow', 'arrowMax', 'precision', 'parts'],
    /* test hooks */
    _rings: function (id, p, n, ao) { return get(id).rings(fill(id, p, ao), n, ao); },
    _draw: function (id, p, ao) { return ao && (ao.allAngles || ao.moreDims) ? drawPrims(get(id), fill(id, p, ao), ao) : get(id).draw(fill(id, p, ao), undefined, ao); },
    _mesh: function (id, p, res) { return get(id).mesh(fill(id, p), res); },
    _net: function (id, p, res) { var d = get(id); return d.net ? netBuild(d, fill(id, p), res) : null; }
  };
  /* render and net set the drawing options themselves (drawnParts, termParts and the terms() highlighters all draw through them).
     The test hooks that build drawing data directly run with the default options. withSty restores the options even on a throw. */
  ['_draw', '_net', '_mesh'].forEach(function (k) {
    var f = api[k];
    api[k] = function () { var a = arguments; return withSty(null, function () { return f.apply(api, a); }); };
  });
  return api;
});
