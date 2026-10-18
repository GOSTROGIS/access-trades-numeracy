/* Small SVG toolkit for the book's own drawings, in the Shapes engine palette.
   Units are SVG user units (1 unit = 1 px at 96 dpi when drawn at natural size). */
const C = { edge: '#940010', fill: '#FFEBB2', fill2: '#FFF8E6', dim: '#4A4E54', ink: '#1A1A1A', red: '#D2181F', gold: '#FFBC00', grey: '#8E9298', light: '#E5E7E9', white: '#FFFFFF', deep: '#C60016', green: '#2E7D32' };
const FONT = 'IBM Plex Sans, DejaVu Sans, sans-serif';
function f(n) { return Math.round(n * 100) / 100; }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function svg(w, h, body, o) {
  o = o || {};
  const vb = o.vb || [0, 0, w, h];
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb.join(' ') + '" width="100%" style="max-width:' + (o.max || (w / 96).toFixed(2) + 'in') + '" font-family="' + FONT + '">' + body + '</svg>';
}
function line(x1, y1, x2, y2, o) { o = o || {}; return '<path d="M' + f(x1) + ' ' + f(y1) + 'L' + f(x2) + ' ' + f(y2) + '" stroke="' + (o.c || C.edge) + '" stroke-width="' + (o.w || 2) + '"' + (o.dash ? ' stroke-dasharray="' + o.dash + '"' : '') + ' stroke-linecap="round" fill="none"/>'; }
function poly(pts, o) { o = o || {}; return '<path d="M' + pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + (o.open ? '' : 'Z') + '" fill="' + (o.fill == null ? C.fill : o.fill) + '" stroke="' + (o.c || C.edge) + '" stroke-width="' + (o.w || 2.25) + '" stroke-linejoin="round"' + (o.dash ? ' stroke-dasharray="' + o.dash + '"' : '') + '/>'; }
function rect(x, y, w, h, o) { return poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], o); }
function circle(cx, cy, r, o) { o = o || {}; return '<circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(r) + '" fill="' + (o.fill == null ? C.fill : o.fill) + '" stroke="' + (o.c || C.edge) + '" stroke-width="' + (o.w || 2.25) + '"' + (o.dash ? ' stroke-dasharray="' + o.dash + '"' : '') + '/>'; }
/* text, escaped unless o.html */
function t(x, y, s, o) {
  o = o || {};
  const body = o.html ? s : esc(s);
  return '<text x="' + f(x) + '" y="' + f(y) + '" text-anchor="' + (o.a || 'middle') + '" font-size="' + (o.s || 14) + '" font-weight="' + (o.b ? 700 : o.wgt || 500) + '" fill="' + (o.c || C.ink) + '"' + (o.rot ? ' transform="rotate(' + o.rot + ' ' + f(x) + ' ' + f(y) + ')"' : '') + (o.family ? ' font-family="' + o.family + '"' : '') + '>' + body + '</text>';
}
/* label with a white chip behind it, like the Shapes engine. o.ask draws the red ? chip */
function label(x, y, s, o) {
  o = o || {};
  const fs = o.s || 14, w = (o.wd || String(s).length * fs * 0.56) + 10;
  if (o.ask) return '<rect x="' + f(x - 13) + '" y="' + f(y - fs) + '" width="26" height="' + (fs + 6) + '" rx="3" fill="#FAE8E9" stroke="' + C.red + '" stroke-width="1.4"/>' + t(x, y + 1, '?', { s: fs + 1, b: true, c: C.red });
  return '<rect x="' + f(x - w / 2) + '" y="' + f(y - fs + 0.5) + '" width="' + f(w) + '" height="' + (fs + 5) + '" rx="2" fill="#FFFFFF"/>' + t(x, y, s, { s: fs, wgt: 600, c: o.c || C.ink });
}
function arrowHead(x, y, ang, c) {
  const a = ang, L = 9, W = 3.3;
  const p1 = [x - L * Math.cos(a) + W * Math.sin(a), y - L * Math.sin(a) - W * Math.cos(a)];
  const p2 = [x - L * Math.cos(a) - W * Math.sin(a), y - L * Math.sin(a) + W * Math.cos(a)];
  return '<path d="M' + f(x) + ' ' + f(y) + 'L' + f(p1[0]) + ' ' + f(p1[1]) + 'L' + f(p2[0]) + ' ' + f(p2[1]) + 'Z" fill="' + (c || C.dim) + '"/>';
}
/* dimension line between two points, offset to one side (off in px, positive = left of the direction a to b),
   with extension lines and a centred label. o.ask draws the red ? chip instead of the label. */
function dim(x1, y1, x2, y2, lab, off, o) {
  o = o || {};
  off = off == null ? 22 : off;
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const a1 = [x1 + nx * off, y1 + ny * off], a2 = [x2 + nx * off, y2 + ny * off];
  const g = off >= 0 ? 1 : -1;
  let h = line(x1 + nx * 3 * g, y1 + ny * 3 * g, x1 + nx * (off + 6 * g), y1 + ny * (off + 6 * g), { c: C.dim, w: 1.1 }) +
    line(x2 + nx * 3 * g, y2 + ny * 3 * g, x2 + nx * (off + 6 * g), y2 + ny * (off + 6 * g), { c: C.dim, w: 1.1 }) +
    line(a1[0], a1[1], a2[0], a2[1], { c: C.dim, w: 1.2 }) +
    arrowHead(a1[0], a1[1], Math.atan2(-uy, -ux)) + arrowHead(a2[0], a2[1], Math.atan2(uy, ux));
  const mx = (a1[0] + a2[0]) / 2, my = (a1[1] + a2[1]) / 2 + 5;
  h += label(mx, my, lab, { ask: o.ask, s: o.s, wd: o.wd });
  return h;
}
/* right-angle mark at corner p with legs along unit vectors u and v */
function rightMark(p, u, v, s) { s = s || 11; return '<path d="M' + f(p[0] + u[0] * s) + ' ' + f(p[1] + u[1] * s) + 'L' + f(p[0] + u[0] * s + v[0] * s) + ' ' + f(p[1] + u[1] * s + v[1] * s) + 'L' + f(p[0] + v[0] * s) + ' ' + f(p[1] + v[1] * s) + '" fill="none" stroke="' + C.dim + '" stroke-width="1.2"/>'; }
/* angle arc at vertex p from direction angle a1 to a2 (radians, SVG y down, clockwise sweep), radius r, label */
function arc(p, a1, a2, r, lab, o) {
  o = o || {};
  const x1 = p[0] + r * Math.cos(a1), y1 = p[1] + r * Math.sin(a1), x2 = p[0] + r * Math.cos(a2), y2 = p[1] + r * Math.sin(a2);
  let d = a2 - a1; while (d < 0) d += 2 * Math.PI;
  const large = d > Math.PI ? 1 : 0;
  const mid = a1 + d / 2, lr = r + (o.lr || 16);
  return '<path d="M' + f(x1) + ' ' + f(y1) + 'A' + r + ' ' + r + ' 0 ' + large + ' 1 ' + f(x2) + ' ' + f(y2) + '" fill="none" stroke="' + (o.c || C.red) + '" stroke-width="1.6"/>' +
    (lab != null ? (o.ask ? label(p[0] + lr * Math.cos(mid), p[1] + lr * Math.sin(mid) + 5, '?', { ask: true, s: 13 }) : t(p[0] + lr * Math.cos(mid), p[1] + lr * Math.sin(mid) + 5, lab, { s: o.s || 13, b: true, c: o.c || C.red })) : '');
}
/* callout: a leader line from a point to a note box (Shape Canvas callout) */
function callout(px, py, bx, by, s, o) {
  o = o || {};
  const fs = o.s || 12, w = (o.wd || String(s).length * fs * 0.54) + 14, h = fs + 10;
  return line(px, py, bx, by, { c: C.deep, w: 1.2 }) + '<circle cx="' + f(px) + '" cy="' + f(py) + '" r="2.6" fill="' + C.deep + '"/>' +
    '<rect x="' + f(bx - w / 2) + '" y="' + f(by - h / 2) + '" width="' + f(w) + '" height="' + h + '" rx="4" fill="#FFFFFF" stroke="' + C.deep + '" stroke-width="1.2"/>' + t(bx, by + fs * 0.36, s, { s: fs, wgt: 600, c: C.deep });
}
/* number line from a to b, ticks every step, labels every lstep, marks [{v, lab, c}] */
function numberLine(a, b, step, lstep, marks, o) {
  o = o || {};
  const W = o.w || 620, H = o.h || 70, x0 = 24, x1 = W - 24, y = 34;
  const X = v => x0 + (v - a) / (b - a) * (x1 - x0);
  let h = line(x0 - 10, y, x1 + 10, y, { c: C.ink, w: 1.6 }) + arrowHead(x1 + 12, y, 0, C.ink) + arrowHead(x0 - 12, y, Math.PI, C.ink);
  const n = Math.round((b - a) / step);
  for (let i = 0; i <= n; i++) {
    const v = a + i * step, big = Math.abs(((v - a) / lstep) - Math.round((v - a) / lstep)) < 1e-9;
    h += line(X(v), y - (big ? 8 : 5), X(v), y + (big ? 8 : 5), { c: C.ink, w: big ? 1.5 : 1 });
    if (big) h += t(X(v), y + 24, o.fmt ? o.fmt(v) : String(+v.toFixed(6)).replace('-', '−'), { s: 12.5, wgt: 500, html: !!o.html });
  }
  (marks || []).forEach(mk => { h += '<circle cx="' + f(X(mk.v)) + '" cy="' + y + '" r="5.5" fill="' + (mk.c || C.red) + '"/>' + (mk.lab ? t(X(mk.v), y - 14, mk.lab, { s: 12.5, b: true, c: mk.c || C.red }) : ''); });
  return svg(W, H, h, { max: o.max });
}
/* inch ruler showing 0 to len inches with ticks to 1/den, marks [{v, lab}] in inches */
function inchRuler(len, den, marks, o) {
  o = o || {};
  const ppi = o.ppi || 150, W = len * ppi + 40, H = 92, x0 = 20, y0 = 16;
  let h = '<rect x="' + (x0 - 8) + '" y="' + y0 + '" width="' + (len * ppi + 16) + '" height="56" rx="3" fill="#FFF8E6" stroke="' + C.ink + '" stroke-width="1.2"/>';
  for (let i = 0; i <= len * den; i++) {
    const x = x0 + i / den * ppi;
    let L;
    if (i % den === 0) L = 30; else if (i % (den / 2) === 0) L = 22; else if (den >= 4 && i % (den / 4) === 0) L = 16; else if (den >= 8 && i % (den / 8) === 0) L = 11; else L = 7;
    h += line(x, y0, x, y0 + L, { c: C.ink, w: i % den === 0 ? 1.6 : 1 });
    if (i % den === 0 && i) h += t(x, y0 + 46, String(i / den), { s: 15, b: true });
  }
  (marks || []).forEach(mk => {
    const x = x0 + mk.v * ppi;
    h += line(x, y0 - 4, x, y0 + 40, { c: C.red, w: 2 }) + '<path d="M' + f(x) + ' ' + (y0 + 40) + 'l-5 9h10z" fill="' + C.red + '"/>' + (mk.lab ? t(x, y0 + 68, mk.lab, { s: 13, b: true, c: C.red, html: true }) : '');
  });
  return svg(W, H + 6, h, { max: o.max });
}
/* metric rule in mm from a to b (mm), numbered in cm */
function mmRuler(a, b, marks, o) {
  o = o || {};
  const ppm = o.ppm || 8, W = (b - a) * ppm + 40, x0 = 20, y0 = 16;
  let h = '<rect x="' + (x0 - 8) + '" y="' + y0 + '" width="' + ((b - a) * ppm + 16) + '" height="56" rx="3" fill="#FFF8E6" stroke="' + C.ink + '" stroke-width="1.2"/>';
  for (let v = a; v <= b + 1e-9; v++) {
    const x = x0 + (v - a) * ppm, L = v % 10 === 0 ? 30 : v % 5 === 0 ? 20 : 12;
    h += line(x, y0, x, y0 + L, { c: C.ink, w: v % 10 === 0 ? 1.5 : 1 });
    if (v % 10 === 0) h += t(x, y0 + 46, String(v / 10), { s: 14, b: true });
  }
  (marks || []).forEach(mk => { const x = x0 + (mk.v - a) * ppm; h += line(x, y0 - 4, x, y0 + 40, { c: C.red, w: 2 }) + '<path d="M' + f(x) + ' ' + (y0 + 40) + 'l-5 9h10z" fill="' + C.red + '"/>' + (mk.lab ? t(x, y0 + 68, mk.lab, { s: 13, b: true, c: C.red }) : ''); });
  h += t(x0 + (b - a) * ppm, y0 + 12, 'cm', { s: 10, a: 'end', c: C.dim });
  return svg(W, 98, h, { max: o.max });
}
/* fraction bar: a strip of d equal parts with n shaded */
function fracBar(n, d, o) {
  o = o || {};
  const W = o.w || 360, H = o.h || 34, pw = W / d;
  let h = '';
  for (let i = 0; i < d; i++) h += '<rect x="' + f(2 + i * pw) + '" y="2" width="' + f(pw) + '" height="' + H + '" fill="' + (i < n ? (o.fill || C.gold) : '#FFFFFF') + '" stroke="' + C.edge + '" stroke-width="1.6"/>';
  if (o.lab) h += t(W + 14, H / 2 + 7, o.lab, { s: 15, b: true, a: 'start', html: !!o.html });
  return svg(W + (o.lab ? 70 : 4), H + 4, h, { max: o.max });
}
/* fraction circle: n of d slices shaded */
function fracCircle(n, d, o) {
  o = o || {};
  const R = o.r || 44, cx = R + 3, cy = R + 3;
  let h = '';
  if (d === 1) h = '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="' + (n ? C.gold : '#fff') + '" stroke="' + C.edge + '" stroke-width="1.6"/>';
  else for (let i = 0; i < d; i++) {
    const a1 = -Math.PI / 2 + i * 2 * Math.PI / d, a2 = a1 + 2 * Math.PI / d;
    const p1 = [cx + R * Math.cos(a1), cy + R * Math.sin(a1)], p2 = [cx + R * Math.cos(a2), cy + R * Math.sin(a2)];
    h += '<path d="M' + cx + ' ' + cy + 'L' + f(p1[0]) + ' ' + f(p1[1]) + 'A' + R + ' ' + R + ' 0 0 1 ' + f(p2[0]) + ' ' + f(p2[1]) + 'Z" fill="' + (i < n ? (o.fill || C.gold) : '#FFFFFF') + '" stroke="' + C.edge + '" stroke-width="1.6"/>';
  }
  return svg(2 * R + 6, 2 * R + 6, h, { max: o.max });
}
module.exports = { C, FONT, svg, line, poly, rect, circle, t, label, dim, rightMark, arc, callout, arrowHead, numberLine, inchRuler, mmRuler, fracBar, fracCircle, f, esc };

/* cut-list bar: a length of stock split into pieces [{len, lab, ask, fill}] drawn to scale, with a dimension for
   each piece below and the overall length above. o.total (number) adds the leftover piece. o.unit text after numbers */
function cutBar(pieces, o) {
  o = o || {};
  const unit = o.unit == null ? ' mm' : o.unit, fmt = o.fmt || (v => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
  const all = pieces.slice();
  const used = pieces.reduce((a, p) => a + p.len, 0);
  if (o.total != null && o.total - used > 0) all.push({ len: o.total - used, lab: o.restLab, ask: o.askRest, rest: true });
  const total = all.reduce((a, p) => a + p.len, 0);
  const W = o.w || 640, x0 = 18, y = 58, H = 34, sc = (W - 2 * x0) / total;
  let h = '', x = x0;
  all.forEach((p, i) => {
    const w = p.len * sc;
    h += '<rect x="' + f(x) + '" y="' + y + '" width="' + f(w) + '" height="' + H + '" fill="' + (p.rest ? '#FFFFFF' : (i % 2 ? C.fill2 : C.fill)) + '" stroke="' + C.edge + '" stroke-width="2"' + (p.rest ? ' stroke-dasharray="5 4"' : '') + '/>';
    if (p.name) h += t(x + w / 2, y + H / 2 + 5, p.name, { s: 13, b: true, c: C.edge });
    h += dim(x, y + H, x + w, y + H, p.ask ? '?' : (p.lab || fmt(p.len) + unit), 26, { ask: p.ask, s: 12.5 });
    x += w;
  });
  if (o.overall !== false) h += dim(x0, y, x0 + total * sc, y, o.askTotal ? '?' : (o.totalLab || fmt(total) + unit), -26, { ask: o.askTotal, s: 13 });
  return svg(W, y + H + 52, h, { max: o.max || '6.4in' });
}
module.exports.cutBar = cutBar;
