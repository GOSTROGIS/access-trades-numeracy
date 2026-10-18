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

  /* ---------------- numbers and text ---------------- */
  function round2(n) { var r = Math.round(n * 100) / 100; return (r === 0) ? 0 : r; }
  function fmt(n) {
    if (!isFinite(n)) return '?';
    return round2(n).toLocaleString('en-CA', { maximumFractionDigits: 2 });
  }
  function N(n) { var r = Math.round(n * 100) / 100; return String(r === 0 ? 0 : r); }
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
    if (l.derived && o.derived === 'hide') return null;
    if (o.labels === 'none') return '';
    var ask = l.derived && o.derived === 'ask';
    var val = l.unit === '°' ? fmt(l.value) + '°' : fmt(l.value) + ' ' + unitStr(o.units, l.pow);
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
  Canvas.prototype.path = function (layer, pts, attrs, closed) {
    if (pts.length < 2) return;
    this.L[layer].push('<path d="' + this.d(pts, closed) + '" ' + attrs + '/>');
  };
  Canvas.prototype.multi = function (layer, rings, attrs) {
    var self = this, d = rings.map(function (r) { return self.d(r, true); }).join('');
    this.L[layer].push('<path d="' + d + '" ' + attrs + '/>');
  };
  Canvas.prototype.arrow = function (tip, dir) {
    var b = sub(tip, mul(dir, AH)), p = [-dir[1], dir[0]];
    this.path('dim', [tip, add(b, mul(p, AW)), sub(b, mul(p, AW))], 'fill="' + COL.dim + '" stroke="none"', true);
  };
  Canvas.prototype.label = function (c, text, color, nudge) {
    if (!text) return;
    var w = tw(text) + 8, h = FS * 1.3;
    var nd = nudge ? nrm(nudge) : [0, 1];
    var step = Math.abs(nd[0]) * (w * 0.55) + Math.abs(nd[1]) * (h * 0.9);
    var cx = c[0], cy = c[1], tries = [0, 1, -1, 2, -2, 3, -3, 4, 5];
    for (var i = 0; i < tries.length; i++) {
      var x = c[0] + nd[0] * tries[i] * step, y = c[1] + nd[1] * tries[i] * step, box = [x - w / 2, y - h / 2, w, h];
      var hit = this.boxes.some(function (b) { return box[0] < b[0] + b[2] && b[0] < box[0] + box[2] && box[1] < b[1] + b[3] && b[1] < box[1] + box[3]; });
      if (!hit) { cx = x; cy = y; break; }
    }
    var box = [cx - w / 2, cy - h / 2, w, h];
    this.boxes.push(box);
    this.ext(cx - w / 2, cy - h / 2); this.ext(cx + w / 2, cy + h / 2);
    this.L.lab.push('<rect x="' + N(cx - w / 2) + '" y="' + N(cy - h / 2) + '" width="' + N(w) + '" height="' + N(h) + '" rx="2" fill="' + COL.white + '"/>' +
      '<text x="' + N(cx) + '" y="' + N(cy + 0.35 * FS) + '" text-anchor="middle" font-family="' + FONT + '" font-size="' + FS + '" font-weight="600" fill="' + color + '">' + esc(text) + '</text>');
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
    if (hlPart) cv.hlLine(hlPart, [[A2, B2], [add(A, mul(n, 3)), add(A, mul(n, off + 6))], [add(B, mul(n, 3)), add(B, mul(n, off + 6))]]);
    if (text === null) return;
    if (off > 4) {
      cv.path('dim', [add(A, mul(n, 3)), add(A, mul(n, off + 6))], A_DIM);
      cv.path('dim', [add(B, mul(n, 3)), add(B, mul(n, off + 6))], A_DIM);
    }
    if (L >= 2 * AH + 6) {
      cv.path('dim', [A2, B2], A_DIM);
      cv.arrow(A2, mul(u, -1)); cv.arrow(B2, u);
    } else {
      cv.path('dim', [sub(A2, mul(u, AH + 10)), add(B2, mul(u, AH + 10))], A_DIM);
      cv.arrow(A2, u); cv.arrow(B2, mul(u, -1));
    }
    if (text) {
      var bw = tw(text) + 8, bh = FS * 1.3;
      var along = Math.abs(u[0]) * bw + Math.abs(u[1]) * bh;
      var c = lerp(A2, B2, 0.5);
      if (along > L - 2 * AH - 4) {
        var across = Math.abs(n[0]) * bw + Math.abs(n[1]) * bh;
        c = add(c, mul(n, across / 2 + 3));
      }
      box = cv.label(c, text, COL.ink, n);
      if (hlPart) cv.hlBox(hlPart, box);
    }
  }
  function drawRA(cv, p, u, v, k, dash, hlPart) {
    var pts = [add(p, mul(u, k)), add(add(p, mul(u, k)), mul(v, k)), add(p, mul(v, k))];
    if (dash !== null) cv.path('mark', pts, attrsLine(COL.dim, 1.25, dash ? '3 3' : null));
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
        cv.path('aux', [T(pr.a), T(pr.b)], attrsLine(COL.fold, thumb ? 1 : 1.5, thumb ? '4 3' : '8 5'));
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
      var gone = (pr.derived && o.derived === 'hide');
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
            cv.path('mark', [add(c, mul(n, 6)), sub(c, mul(n, 6))], attrsLine(COL.dim, 1.5));
          }
          break;
        case 'dot':
          A = T(pr.p);
          cv.L.mark.push('<circle cx="' + N(A[0]) + '" cy="' + N(A[1]) + '" r="2.75" fill="' + COL.edge + '"/>');
          cv.ext(A[0], A[1]);
          break;
        case 'angle':
          A = T(pr.c);
          var rp = pr.rp || 26, pts = [], ks = 28;
          for (var i = 0; i <= ks; i++) { var a = pr.a0 + (pr.a1 - pr.a0) * i / ks; pts.push([A[0] + rp * Math.cos(a), A[1] + rp * Math.sin(a)]); }
          if (!gone) cv.path('mark', pts, attrsLine(COL.dim, 1.5));
          if (hp) cv.hlLine(hp, [pts]);
          if (txt) {
            var am = (pr.a0 + pr.a1) / 2, dir = [Math.cos(am), Math.sin(am)];
            if (pr.out) dir = mul(dir, -1);
            var half = Math.abs(dir[0]) * (tw(txt) + 8) / 2 + Math.abs(dir[1]) * FS * 0.65;
            bxx = cv.label(add(A, mul(dir, (pr.out ? 8 : rp + 5) + half)), txt, COL.ink, dir);
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
  function aoOf(o) { o = o || {}; var on = !!o.angles; return { on: on, input: on && o.angleInput === 'angle' ? 'angle' : 'sides' }; }

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
        dim(Av, Bv, lab('c', Math.hypot(b, h), 1, true)), ra(Cv, [1, 0], [0, -1], A0.on ? { lab: angLab('C', 90, false) } : null)];
      if (A0.on) {
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
      if (aoOf(ao).on) out.push(angAt(pts[0], pts[1], pts[2], angLab('A', 60, false)), angAt(pts[1], pts[2], pts[0], angLab('B', 60, false)), angAt(pts[2], pts[0], pts[1], angLab('C', 60, false)));
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
      if (A0.on) {
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
      if (A0.on) {
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
    var A = def.annot ? def.annot(p) : {};
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
      if (r.derived && o.derived === 'hide') return;
      var u = r.uFrom ? dirs[r.uFrom] : r.u;
      if (!u) return;
      var k = 11 / sc, Pv = toView(r.p), Uv = sub(toView(add(r.p, mul(u, k))), Pv), Vv = sub(toView(add(r.p, mul(r.v, k))), Pv);
      var hidden = occluded(add(Pv, mul(add(Uv, Vv), 0.5)), null);
      drawRA(cv, S(Pv), mul(S(Uv), 1 / 11), mul(S(Vv), 1 / 11), 11, hidden);
    });
    (A.dots || []).forEach(function (d) {
      var q = S(toView(d));
      cv.L.mark.push('<circle cx="' + N(q[0]) + '" cy="' + N(q[1]) + '" r="2.75" fill="' + COL.edge + '"/>');
    });
    (A.dims || []).forEach(function (dm) {
      var txt = labelText(dm.lab, o), hp = H ? hlDim(o, dm.lab && dm.lab.letter) : null;
      if (txt === null && !hp) return;
      var ab = pick(dm.cands, dm.pref, true), sa = S(toView(ab[0])), sb = S(toView(ab[1])), u = nrm(sub(sb, sa)), n = [-u[1], u[0]];
      if (dot(n, sub(lerp(sa, sb, 0.5), cenS)) < 0) n = mul(n, -1);
      drawDim(cv, sa, sb, txt, n, 22, hp);
    });
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
    return { panels: nd.panels, prims: nd.prims, folds: folds, cuts: cuts };
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
  var TERM_RE = Object.keys(TERMS).map(function (k) { return { k: k, re: new RegExp('(^|[^A-Za-z])(' + TERMS[k].m + ')(?![A-Za-z])', TERMS[k].cs ? 'g' : 'gi'), n: TERMS[k].m.length }; });
  function findTerms(text) {
    var hits = [];
    TERM_RE.forEach(function (t) {
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
  function render(id, params, opts) {
    var d = get(id), o = normOpts(opts), ao = { angles: o.angles, angleInput: o.angleInput }, p = fill(id, params, ao);
    if (validate(id, p, ao)) p = defaults(id, ao);
    if (d.kind === 'flat') return render2D(d.draw(p, undefined, ao), o);
    return render3D(d, p, o);
  }
  function net(id, params, opts) {
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
    var items = d.calc(p, u, ao);
    items.forEach(function (it) { it.hl = ((byAng && d.hlByAng && d.hlByAng[it.key]) || (d.hl && d.hl[it.key]) || []).slice(); });
    return finish(items, d.notes);
  }
  function layout(id, params, units) {
    var d = get(id);
    if (!d.layout) return null;
    var p = fill(id, params), items = d.layout(p, units || 'cm');
    items.forEach(function (it) { it.hl = ((d.layoutHl && d.layoutHl[it.key]) || []).slice(); });
    return finish(items, d.layoutNotes);
  }

  return {
    version: '1.0.0',
    colors: COL,
    list: function () { return ORDER.map(function (id) { return infoOf(DEF[id]); }); },
    info: function (id) { return infoOf(get(id)); },
    defaults: defaults,
    validate: validate,
    random: random,
    render: render,
    net: net,
    calc: calc,
    layout: layout,
    terms: function () {
      var o = {};
      Object.keys(TERMS).forEach(function (k) {
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
    /* test hooks */
    _rings: function (id, p, n, ao) { return get(id).rings(fill(id, p, ao), n, ao); },
    _draw: function (id, p, ao) { return get(id).draw(fill(id, p, ao), undefined, ao); },
    _mesh: function (id, p, res) { return get(id).mesh(fill(id, p), res); },
    _net: function (id, p, res) { var d = get(id); return d.net ? netBuild(d, fill(id, p), res) : null; }
  };
});
