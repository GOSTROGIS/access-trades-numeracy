/* Chapter 2 drawings: TI-30Xa and Sharp EL-531XT faceplates and displays.
   Key layouts come from the hub calculator code: calc2/ti30.js LAYOUT (TI-30Xa) and calc2/src/core-sharp.js LAYOUT
   (Sharp EL-531XT), placed the way calc2/src/ui-popup.js and popup.css draw them. The Sharp layout matches the
   EL-531TH guide p. 3 and the EL-531XT photo. Colours follow the hub popup. */
const path = require('path');
const F = require('./figs.js');
const TI = require(path.join(__dirname, '..', '..', 'calc2', 'ti30.js'));
const SH = require(path.join(__dirname, '..', '..', 'calc2', 'src', 'core-sharp.js'));
const MONO = 'DejaVu Sans Mono, monospace';
const f = F.f, esc = F.esc;

function key(x, y, w, h, lab, st, o) {
  o = o || {};
  let s = '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(h) + '" rx="' + (st.rx || 5) + '" fill="' + st.bg + '"' + (st.bd ? ' stroke="' + st.bd + '" stroke-width="1.4"' : ' stroke="#0B0C0D" stroke-width="0.8"') + '/>';
  if (o.ask) s += '<rect x="' + f(x + w / 2 - 12) + '" y="' + f(y + h / 2 - 10) + '" width="24" height="20" rx="3" fill="#FAE8E9" stroke="' + F.C.red + '" stroke-width="1.6"/>' + F.t(x + w / 2, y + h / 2 + 6, o.ask === true ? '?' : o.ask, { s: 16, b: true, c: F.C.red });
  else s += F.t(x + w / 2, y + h / 2 + st.fs * 0.36, lab, { s: st.fs, wgt: 600, c: st.fg });
  if (o.hl) s += '<rect x="' + f(x - 3) + '" y="' + f(y - 3) + '" width="' + f(w + 6) + '" height="' + f(h + 6) + '" rx="' + ((st.rx || 5) + 2) + '" fill="none" stroke="' + F.C.gold + '" stroke-width="3"/>';
  return s;
}
function askOf(o, id) { const a = o.ask; if (!a) return false; if (Array.isArray(a)) return a.includes(id); return a[id] || false; }
/* second-function and memory-letter labels above the keys */
const SMALL = 8.8;
function small(x, y, s, c, a, sz) { return s ? F.t(x, y, s, { s: sz || SMALL, wgt: 600, c, a: a || 'middle' }) : ''; }

/* ---------- TI-30Xa (hub popup layout: ON/C beside the model name, 2 rows of 5, then 4 columns of 6 rows and the
   operation column on the right) ---------- */
function tiPlate(o) {
  o = o || {};
  const L = TI.LAYOUT, W = 300, pos = {};
  const ST = {
    fn: { bg: '#DEE0E2', fg: '#141618', fs: 10.5 }, num: { bg: '#1A1C1E', fg: '#FFFFFF', fs: 14.5 },
    sec: { bg: '#76BA28', fg: '#141618', fs: 10.5 }, on: { bg: '#DEE0E2', fg: '#141618', fs: 10, rx: 11 },
    op: { bg: '#969BA0', fg: '#FFFFFF', fs: 15 }
  };
  const st = id => id === '2nd' ? ST.sec : (id === 'onc' || id === 'off') ? ST.on : /^d\d$/.test(id) || id === 'dot' || id === 'neg' ? ST.num : ST.fn;
  let h = '<rect x="1" y="1" width="' + (W - 2) + '" height="' + 503 + '" rx="16" fill="#2E3136" stroke="#111214" stroke-width="2"/>';
  h += '<rect x="20" y="18" width="260" height="66" rx="8" fill="#BEC9B4" stroke="#1C1E20" stroke-width="3"/>';
  h += F.t(32, 35, o.ind || 'DEG', { s: 9.5, b: true, c: '#16180F', a: 'start' });
  h += '<text x="268" y="72" text-anchor="end" font-family="' + MONO + '" font-size="28" font-weight="600" fill="#16180F">' + esc(o.main || '0.') + '</text>';
  h += F.t(22, 118, 'TI-30Xa', { s: 13, b: true, c: '#C8E296', a: 'start' });
  const cell = (k, x, y, w, kh, extra) => {
    const id = k[0];
    pos[id] = { x: x + w / 2, y: y + 11 + kh / 2, x0: x, x1: x + w, y0: y + 11, y1: y + 11 + kh };
    return small(x + w / 2, y + 8, k[2], '#C8E296', 'middle', o.sm) + key(x, y + 11, w, kh, k[1], extra || st(id), { ask: askOf(o, id), hl: (o.hl || []).includes(id) });
  };
  h += cell(L.onc, 222, 92, 56, 22);
  L.top.forEach((row, r) => row.forEach((k, c) => { h += cell(k, 20 + c * 53, 128 + r * 40, 45, 24); }));
  L.left.forEach((row, r) => row.forEach((k, c) => { h += cell(k, 20 + c * 52, 214 + r * 47, 44, 28); }));
  L.right.forEach((k, r) => { h += cell(k, 232, 214 + r * 56, 48, k[0] === 'eq' ? 50 : 38, ST.op); });
  return { body: h, W, H: 506, pos };
}

/* ---------- Sharp EL-531XT (EL-531TH guide p. 3 layout and the popup: white head with the solar strip and the
   two-line display, charcoal keypad) ---------- */
function sharpPlate(o) {
  o = o || {};
  const L = SH.LAYOUT, W = 300, H = 586, pos = {};
  const ST = {
    fn: { bg: '#46484E', fg: '#FFFFFF', fs: 10 }, num: { bg: '#121315', fg: '#FFFFFF', fs: 15 }, op: { bg: '#EEEEEC', fg: '#141618', fs: 15 },
    sec: { bg: '#242528', fg: '#FFB048', bd: '#FFB048', fs: 10 }, alpha: { bg: '#242528', fg: '#78D296', bd: '#78D296', fs: 9.5 },
    on: { bg: '#3E2830', fg: '#FFA0B4', fs: 10, rx: 9 }
  };
  const WHITE = { lp: 1, rp: 1, mul: 1, div: 1, add: 1, sub: 1, eq: 1 };
  const st = id => /^d\d$/.test(id) || id === 'dot' || id === 'neg' ? ST.num : WHITE[id] ? ST.op : id === '2ndf' ? ST.sec : id === 'alpha' ? ST.alpha : id === 'onc' ? ST.on : ST.fn;
  let h = '<rect x="1" y="1" width="' + (W - 2) + '" height="' + (H - 2) + '" rx="18" fill="#242528" stroke="#111214" stroke-width="2"/>';
  h += '<path d="M19 2H281A17 17 0 0 1 298 19V146H2V19A17 17 0 0 1 19 2Z" fill="#F2F2F0"/>';
  h += '<rect x="150" y="14" width="130" height="20" rx="3" fill="#402C28"/>';
  h += '<rect x="20" y="42" width="260" height="70" rx="6" fill="#C8CFC6" stroke="#787C78" stroke-width="2"/>';
  h += F.t(234, 54, o.ind || 'DEG', { s: 9, b: true, c: '#181C18' });
  if (o.top) h += '<text x="28" y="70" font-family="' + MONO + '" font-size="12" font-weight="700" fill="#181C18">' + esc(o.top) + '</text>';
  h += '<text x="270" y="102" text-anchor="end" font-family="' + MONO + '" font-size="26" font-weight="600" fill="#181C18">' + esc(o.main || '0.') + '</text>';
  h += F.t(24, 132, 'D.A.L.', { s: 12, b: true, c: '#54565A', a: 'start' }) + F.t(276, 132, 'EL-531XT', { s: 11, b: true, c: '#54565A', a: 'end' });
  const cell = (k, x, y, w, kh, extra) => {
    const id = k[0];
    pos[id] = { x: x + w / 2, y: y + 10 + kh / 2, x0: x, x1: x + w, y0: y + 10, y1: y + 10 + kh };
    return small(x + 1, y + 7.5, k[2], '#FFB048', 'start', o.sm) + small(x + w - 1, y + 7.5, k[3], '#78D296', 'end', o.sm) +
      key(x, y + 10, w, kh, k[1], extra || st(id), { ask: askOf(o, id), hl: (o.hl || []).includes(id) });
  };
  const nav = {}; L.nav.forEach(k => { nav[k[0]] = k; });
  h += cell(nav.home, 20, 156, 70, 20) + cell(nav.onc, 210, 156, 70, 20, ST.on);
  h += cell(nav['2ndf'], 20, 196, 70, 20) + cell(nav.mode, 210, 196, 70, 20);
  /* cursor pad */
  h += '<rect x="104" y="162" width="92" height="58" rx="26" fill="#ECECEA" stroke="#141618" stroke-width="1"/>';
  h += F.t(150, 178, '▲', { s: 10, c: '#24262A' }) + F.t(150, 214, '▼', { s: 10, c: '#24262A' }) + F.t(120, 195, '◀', { s: 10, c: '#24262A' }) + F.t(180, 195, '▶', { s: 10, c: '#24262A' });
  pos.cursor = { x: 150, y: 191, x0: 104, x1: 196, y0: 162, y1: 220 };
  L.rows[0].forEach((k, c) => { h += cell(k, 20 + c * 84, 232, 70, 20); });
  h += '<circle cx="264" cy="252" r="3" fill="#121315" stroke="#8E9298" stroke-width="1"/>' + F.t(279, 241, 'RESET', { s: 9.5, wgt: 600, c: '#D8D8D6', a: 'middle' });
  for (let r = 1; r <= 3; r++) L.rows[r].forEach((k, c) => { h += cell(k, 20 + c * 44, 268 + (r - 1) * 36, 38, 22); });
  for (let r = 4; r <= 7; r++) L.rows[r].forEach((k, c) => { h += cell(k, 20 + c * 53, 380 + (r - 4) * 49, k[0] === 'eq' ? 98 : 45, 32); });
  return { body: h, W, H, pos };
}

/* a faceplate with numbered call-outs: a numbered tag on each key and a note in the side margin, level with the
   key. o.notes: [{k: key id, t: text, side: 'L'|'R'}]. Tags are numbered top to bottom. */
function plate(model, o) {
  o = o || {};
  const P = model === 'ti' ? tiPlate(o) : sharpPlate(o);
  const k = o.ps || 1, PW = P.W * k, PH = P.H * k;
  const notes = (o.notes || []).map(n => Object.assign({}, n, { p: P.pos[n.k] })).sort((a, b) => a.p.y - b.p.y || a.p.x - b.p.x);
  notes.forEach((n, i) => { n.num = i + 1; });
  const fs = o.fs || 12, TOP = 6;
  const need = side => Math.max(6, ...notes.filter(n => n.side === side).map(n => String(n.t).length * fs * 0.62 + 34 + 22));
  const ML = need('L'), MR = need('R');
  let h = '<g transform="translate(' + ML + ' ' + TOP + ') scale(' + k + ')">' + P.body + '</g>';
  const tag = (x, y, t) => '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="8.6" fill="' + F.C.deep + '" stroke="#FFFFFF" stroke-width="1.4"/>' + F.t(x, y + 4, String(t), { s: 11.5, b: true, c: '#FFFFFF' });
  /* each tag sits on the side edge of its key, level with the key face, so the labels above the keys stay clear
     (n.tag 'L' for the left edge, 'B' for the middle of the bottom edge) */
  notes.forEach(n => { const x = n.tag === 'L' ? n.p.x0 : n.tag === 'B' ? (n.p.x0 + n.p.x1) / 2 : n.p.x1, y = n.tag === 'B' ? n.p.y1 : (n.p.y0 + n.p.y1) / 2; h += tag(ML + x * k, TOP + y * k, n.num); });
  ['L', 'R'].forEach(side => {
    const list = notes.filter(n => n.side === side);
    let last = -1e9;
    list.forEach(n => { n.by = Math.max(TOP + n.p.y * k, last + (o.gap || 27)); last = n.by; });
    const over = last - (PH - 4); if (over > 0) list.forEach(n => { n.by -= over; });
    list.forEach(n => {
      const w = String(n.t).length * fs * 0.62 + 34;
      const x0 = side === 'L' ? ML - 12 - w : ML + PW + 12;
      h += '<rect x="' + f(x0) + '" y="' + f(n.by - 11) + '" width="' + f(w) + '" height="22" rx="4" fill="#FFFFFF" stroke="' + F.C.deep + '" stroke-width="1.1"/>';
      h += tag(x0 + 12, n.by, n.num) + F.t(x0 + 25, n.by + fs * 0.36, n.t, { s: fs, wgt: 600, c: F.C.ink, a: 'start' });
    });
  });
  return F.svg(ML + PW + MR, PH + 12, h, { max: o.max || '6.4in' });
}

/* a display on its own, for reading problems. o.top: Sharp equation line, o.ind: DEG etc */
function lcd(model, main, o) {
  o = o || {};
  const W = o.w || 250, sharp = model === 'sharp';
  let h = '<rect x="3" y="3" width="' + (W - 6) + '" height="64" rx="7" fill="' + (sharp ? '#C8CFC6' : '#BEC9B4') + '" stroke="' + (sharp ? '#787C78' : '#1C1E20') + '" stroke-width="' + (sharp ? 2 : 3) + '"/>';
  h += F.t(sharp ? W - 50 : 16, o.indS ? 9 + o.indS * 0.5 : 16, o.ind || 'DEG', { s: o.indS || 8, b: true, c: '#181C18', a: sharp ? 'middle' : 'start' });
  if (o.top) h += '<text x="12" y="32" font-family="' + MONO + '" font-size="11.5" font-weight="700" fill="#181C18">' + esc(o.top) + '</text>';
  h += '<text x="' + (W - (o.exp ? 34 : 14)) + '" y="58" text-anchor="end" font-family="' + MONO + '" font-size="24" font-weight="600" fill="#181C18">' + esc(main) + '</text>';
  if (o.exp) h += '<text x="' + (W - 12) + '" y="42" text-anchor="end" font-family="' + MONO + '" font-size="13" font-weight="600" fill="#181C18">' + esc(o.exp) + '</text>';
  h += F.t(W / 2, 84, sharp ? 'Sharp EL-531XT' : 'TI-30Xa', { s: 11, b: true, c: '#4A4E54' });
  return F.svg(W, 90, h, { max: o.max || '2.6in' });
}

/* both faceplates side by side, no notes. o.sm: a larger size for the labels above the keys */
function pair(o) {
  o = o || {};
  const a = tiPlate({ ask: o.askTi, sm: o.sm }), b = sharpPlate({ ask: o.askSharp, sm: o.sm });
  const h = '<g transform="translate(4 40)">' + a.body + '</g><g transform="translate(' + (a.W + 30) + ' 4)">' + b.body + '</g>';
  return F.svg(a.W + b.W + 34, b.H + 10, h, { max: o.max || '5in' });
}
/* Shapes engine drawings shown small: enlarge each label chip (a rect followed by its text) by k about the text
   anchor, and pad the viewBox so the bigger labels are not clipped. Used for drawings narrower than about 2.5 in. */
function bigLabels(svg, k, pad) {
  k = k || 1.5;
  let out = svg.replace(/<rect ([^>]*?)\/><text ([^>]*?)>([^<]*)<\/text>/g, (all, ra, ta, txt) => {
    const g = (a, n) => { const m = new RegExp('\\b' + n + '="([-\\d.]+)"').exec(a); return m ? +m[1] : null; };
    const tx = g(ta, 'x'), ty = g(ta, 'y'), fs = g(ta, 'font-size');
    const x = g(ra, 'x'), y = g(ra, 'y'), w = g(ra, 'width'), h = g(ra, 'height');
    if ([tx, ty, fs, x, y, w, h].some(v => v == null)) return all;
    const nr = ra.replace(/\bx="[-\d.]+"/, 'x="' + f(tx - (tx - x) * k) + '"').replace(/\by="[-\d.]+"/, 'y="' + f(ty - (ty - y) * k) + '"')
      .replace(/\bwidth="[-\d.]+"/, 'width="' + f(w * k) + '"').replace(/\bheight="[-\d.]+"/, 'height="' + f(h * k) + '"');
    const nt = ta.replace(/font-size="[-\d.]+"/, 'font-size="' + f(fs * k) + '"');
    return '<rect ' + nr + '/><text ' + nt + '>' + txt + '</text>';
  });
  out = out.replace(/viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/, (a, x, y, w, h) => {
    const p = (pad == null ? 0.12 : pad) * Math.max(+w, +h);
    return 'viewBox="' + f(+x - p) + ' ' + f(+y - p) + ' ' + f(+w + 2 * p) + ' ' + f(+h + 2 * p) + '"';
  });
  return out;
}
/* a circle with its radius drawn and labelled inside, along the radius line: "r = 75 mm" */
function circleR(r, unit, o) {
  o = o || {};
  const R = 100, cx = 112, cy = 112, fs = o.fs || 17;
  let h = F.circle(cx, cy, R) + '<circle cx="' + cx + '" cy="' + cy + '" r="3" fill="' + F.C.edge + '"/>';
  h += F.line(cx, cy, cx + R, cy, { c: F.C.edge, w: 1.8 });
  h += F.t(cx + R * 0.46, cy - 10, o.ask ? 'r = ?' : 'r = ' + r + ' ' + unit, { s: fs, b: true, c: o.ask ? F.C.red : F.C.ink });
  return F.svg(224, 224, h, { max: o.max || '1.8in' });
}
/* a flat ring: both radius lines drawn and labelled clear of the outlines */
function ringR(Ro, ri, unit, o) {
  o = o || {};
  const S = 110 / Ro, cx = 130, cy = 128, fs = o.fs || 15, a1 = -Math.PI / 5, a2 = Math.PI;
  let h = '<path d="M' + (cx + Ro * S) + ' ' + cy + 'A' + (Ro * S) + ' ' + (Ro * S) + ' 0 1 0 ' + (cx - Ro * S) + ' ' + cy + 'A' + (Ro * S) + ' ' + (Ro * S) + ' 0 1 0 ' + (cx + Ro * S) + ' ' + cy +
    'M' + (cx + ri * S) + ' ' + cy + 'A' + (ri * S) + ' ' + (ri * S) + ' 0 1 1 ' + (cx - ri * S) + ' ' + cy + 'A' + (ri * S) + ' ' + (ri * S) + ' 0 1 1 ' + (cx + ri * S) + ' ' + cy + 'Z" fill="' + F.C.fill + '" fill-rule="evenodd" stroke="' + F.C.edge + '" stroke-width="2.25"/>';
  h += '<circle cx="' + cx + '" cy="' + cy + '" r="3" fill="' + F.C.edge + '"/>';
  const ex = cx + Ro * S * Math.cos(a1), ey = cy + Ro * S * Math.sin(a1);
  h += F.line(cx, cy, ex, ey, { c: F.C.edge, w: 1.8 }) + F.line(ex, ey, ex + 18, ey - 10, { c: F.C.dim, w: 1.1 });
  h += F.t(ex + 20, ey - 12, 'R = ' + Ro + ' ' + unit, { s: fs, b: true, a: 'start' });
  const ix = cx + ri * S * Math.cos(a2), iy = cy + ri * S * Math.sin(a2);
  h += F.line(cx, cy, ix, iy, { c: F.C.edge, w: 1.8 });
  h += F.t(cx, cy + 26, 'r = ' + ri + ' ' + unit, { s: fs, b: true });
  return F.svg(cx + Ro * S + 120, 2 * cy, h, { max: o.max || '2.4in' });
}
/* a rectangle with its sizes on dimension lines outside the edges. o.names labels them L and W, o.ask: 'l' or 'w' */
function rectLW(l, w, unit, o) {
  o = o || {};
  const S = 230 / Math.max(l, w), x0 = 30, y0 = 46, L = l * S, Wd = w * S, fs = o.fs || 17;
  const lab = (k, v) => o.ask === k ? '?' : (o.names ? (k === 'l' ? 'L = ' : 'W = ') : '') + F.f(v).toLocaleString('en-US') + ' ' + unit;
  let h = F.rect(x0, y0, L, Wd);
  h += F.dim(x0, y0 + Wd, x0 + L, y0 + Wd, lab('l', l), 30, { s: fs, ask: o.ask === 'l' });
  const tw = o.ask === 'w' ? 26 : lab('w', w).length * fs * 0.58;
  h += F.dim(x0 + L, y0 + Wd, x0 + L, y0, lab('w', w), tw / 2 + 22, { s: fs, ask: o.ask === 'w' });
  return F.svg(x0 + L + tw + 50, y0 + Wd + 60, h, { max: o.max || '2.6in' });
}
/* comma groups for whole numbers, with a true minus and an optional plus sign */
function grp(v, plus) {
  const s = String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return (v < 0 ? '−' : (plus && v > 0 ? '+' : '')) + s
}
/* integer number line from a to b. o.lstep: label every lstep. o.hops: [{ from, to, lab }] drawn as red arrows
   above the line. o.marks: [{ v, lab }] dots on the line with a label under the numbers */
function intLine(a, b, o) {
  o = o || {}
  const W = o.w || 640, x0 = 34, x1 = W - 34, hopH = (o.hops && o.hops.length) ? 70 : 10, y = 30 + hopH
  const fs = o.fs || 16, X = v => x0 + (v - a) / (b - a) * (x1 - x0), ls = o.lstep || 1
  let h = F.line(x0 - 16, y, x1 + 16, y, { c: F.C.ink, w: 1.8 })
  h += '<path d="M' + f(x1 + 26) + ' ' + y + 'l-11 -5v10z" fill="' + F.C.ink + '"/><path d="M' + f(x0 - 26) + ' ' + y + 'l11 -5v10z" fill="' + F.C.ink + '"/>'
  for (let v = a; v <= b; v++) {
    const big = (v - a) % ls === 0
    h += F.line(X(v), y - (big ? 9 : 6), X(v), y + (big ? 9 : 6), { c: v === 0 ? F.C.red : F.C.ink, w: big ? 1.8 : 1.2 })
    if (big) h += F.t(X(v), y + 30, grp(v), { s: fs, wgt: 600, c: v === 0 ? F.C.red : F.C.ink })
  }
  let under = false
  for (const hp of o.hops || []) {
    const xa = X(hp.from), xb = X(hp.to), xm = (xa + xb) / 2, d = 18 + Math.min(52, Math.abs(xb - xa) * 0.35)
    const dir = xb > xa ? 1 : -1, sg = hp.under ? 1 : -1, yb = hp.under ? y + 40 : y - 6, top = yb + sg * d
    if (hp.under) under = true
    h += '<path d="M' + f(xa) + ' ' + yb + 'Q' + f(xm) + ' ' + f(2 * top - yb) + ' ' + f(xb) + ' ' + yb + '" fill="none" stroke="' + F.C.red + '" stroke-width="2"/>'
    h += '<path d="M' + f(xb) + ' ' + (yb + sg) + 'l' + f(-dir * 4) + ' ' + (sg * 11) + 'l' + f(dir * 8) + ' ' + (-sg * 2) + 'z" fill="' + F.C.red + '"/>'
    if (hp.lab) h += F.label(xm, top + (hp.under ? 18 : -4), hp.lab, { s: fs - 1, c: F.C.red })
  }
  for (const mk of o.marks || []) {
    h += '<circle cx="' + f(X(mk.v)) + '" cy="' + y + '" r="6.5" fill="' + F.C.deep + '"/>'
    if (mk.lab) h += F.t(X(mk.v), y + 56, mk.lab, { s: fs, b: true, c: F.C.deep })
  }
  const hasLab = (o.marks || []).some(m => m.lab)
  return F.svg(W, y + (under ? 128 : hasLab ? 66 : 42), h, { max: o.max || '6in' })
}
/* elevations on a vertical scale. levels: [{ v (mm), name, ask, lab }]. The 0 level (benchmark) is red.
   o.dims: [{ top, bot, lab, ask }] vertical dimension lines to the right */
function elevScale(levels, o) {
  o = o || {}
  const vs = levels.map(l => l.v), top = Math.max(...vs), bot = Math.min(...vs)
  const H = o.h || 380, y0 = 40, S = (H - y0 - 20) / (top - bot), Y = v => y0 + (top - v) * S
  const xl = 20, xr = o.xr || 330, fs = o.fs || 17
  let h = ''
  for (const l of levels) {
    const yy = Y(l.v), z = l.v === 0
    h += F.line(xl, yy, xr, yy, { c: z ? F.C.red : F.C.edge, w: z ? 2.6 : 2.2, dash: l.dash ? '8 6' : null })
    h += F.t(xl, yy - 8, l.name, { s: fs, b: true, a: 'start', c: z ? F.C.red : F.C.ink })
    h += l.ask ? F.label(xr - 16, yy - 9, '?', { ask: true, s: fs }) : F.t(xr, yy - 8, l.lab || grp(l.v, true) + ' mm', { s: fs, wgt: 600, a: 'end', c: z ? F.C.red : F.C.ink })
  }
  let k = 0
  for (const d of o.dims || []) {
    const off = -(56 + k * 120)
    h += F.dim(xr, Y(d.top), xr, Y(d.bot), d.ask ? '?' : d.lab, off, { s: fs - 1, ask: d.ask })
    k++
  }
  return F.svg(xr + 70 + k * 120, H, h, { max: o.max || '4in' })
}
/* a wall in elevation: plates top and bottom, studs from one end at the spacing, and a last stud at the far end.
   o.lenLab, o.spLab label the length and the first spacing. o.askLen puts the ? on the length */
function studWall(len, sp, o) {
  o = o || {}
  const W = o.w || 620, x0 = 24, x1 = W - 24, S = (x1 - x0) / len, X = v => x0 + v * S
  const yt = 30, ht = 150, pl = 12, sw = 9, fs = o.fs || 17
  let h = F.rect(x0, yt, x1 - x0, pl) + F.rect(x0, yt + ht - pl, x1 - x0, pl)
  const pos = []
  for (let p = 0; p < len - 1e-9; p += sp) pos.push(p)
  pos.push(len)
  for (const p of pos) {
    const xc = Math.min(Math.max(X(p), x0 + sw / 2), x1 - sw / 2)
    h += F.rect(xc - sw / 2, yt + pl, sw, ht - 2 * pl, { fill: F.C.fill2, w: 1.6 })
  }
  const c0 = x0 + sw / 2, c1 = X(sp)
  h += F.dim(c0, yt, c1, yt, o.spLab || String(sp), -18, { s: fs - 2 })
  h += F.dim(x0, yt + ht, x1, yt + ht, o.askLen ? '?' : (o.lenLab || grp(len) + ' mm'), 30, { s: fs, ask: o.askLen })
  return F.svg(W, yt + ht + 70, h, { max: o.max || '5.4in', vb: [0, -16, W, yt + ht + 70] })
}
/* a straight stair in side view: n risers of rise, n − 1 treads of run, the upper floor is the top step.
   o.ask: 'rise' or 'run' puts the ? on that total. o.unit labels (default mm). o.riseLab, o.runLab label one step */
function stairProfile(n, rise, run, o) {
  o = o || {}
  const tr = (n - 1) * run, R = n * rise, S = Math.min(400 / tr, 250 / R), x0 = 120, yb = 290, fs = o.fs || 16
  const X = v => x0 + v * S, Y = v => yb - v * S, u = o.unit || 'mm'
  const pts = [[X(0), Y(0)]]
  for (let i = 0; i < n; i++) {
    pts.push([X(i * run), Y((i + 1) * rise)])
    if (i < n - 1) pts.push([X((i + 1) * run), Y((i + 1) * rise)])
  }
  pts.push([X(tr), Y(0)])
  let h = F.line(x0 - 70, yb, X(tr) + 40, yb, { c: F.C.ink, w: 2 }) + F.line(X(tr), Y(R), X(tr) + 110, Y(R), { c: F.C.ink, w: 2.4 })
  h += F.poly(pts)
  h += F.t(x0 - 12, yb + 22, 'lower floor', { s: fs - 2, a: 'end', c: F.C.dim }) + F.t(X(tr) + 110, Y(R) - 10, 'upper floor', { s: fs - 2, a: 'end', c: F.C.dim })
  const tl = o.ask === 'run' ? '?' : (o.runTot || grp(tr) + ' ' + u), rl = o.ask === 'rise' ? '?' : (o.riseTot || grp(R) + ' ' + u)
  h += F.dim(X(0), yb, X(tr), yb, tl, 40, { s: fs, ask: o.ask === 'run' })
  h += F.dim(X(tr), yb, X(tr), Y(R), rl, 70, { s: fs, ask: o.ask === 'rise' })
  if (o.riseLab) h += F.t(X(0) - 10, Y(rise / 2) + 6, o.riseLab, { s: fs - 2, b: true, a: 'end', c: F.C.deep })
  if (o.runLab) h += F.t(X(run / 2), Y(rise) - 10, o.runLab, { s: fs - 2, b: true, c: F.C.deep })
  return F.svg(X(tr) + 200, yb + 80, h, { max: o.max || '4.6in', vb: [0, Y(R) - 40, X(tr) + 200, yb + 80 - Y(R) + 40] })
}
module.exports = { plate, lcd, tiPlate, sharpPlate, pair, bigLabels, circleR, ringR, rectLW, intLine, elevScale, studWall, stairProfile, grp };
