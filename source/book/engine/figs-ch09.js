/* Drawing helpers for Chapter 9 (Perimeter and Circumference), used by the Exercise Book */
const F = require('./figs.js');
const { readable, printSize } = require('./figs-ch08.js');
const C = F.C, PI = Math.PI;
const num = v => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const fmt = num;
const dot = (x, y) => '<circle cx="' + F.f(x) + '" cy="' + F.f(y) + '" r="3.2" fill="' + C.edge + '"/>';
const dash = (x1, y1, x2, y2) => F.line(x1, y1, x2, y2, { c: C.dim, w: 1.4, dash: '6 4' });

/* rectangle l by w with a half circle on the right end (both ends with o.both). o.ask: list of 'l', 'w' */
function rectSemi(l, w, o) {
  o = o || {};
  const ask = o.ask || [];
  const ends = o.both ? 2 : 1;
  const S = 300 / (l + ends * w / 2), R2 = w * S / 2, x0 = 84 + (o.both ? R2 : 0), y0 = 34, xr = x0 + l * S, yb = y0 + w * S;
  let h = '<path d="M' + F.f(x0) + ' ' + y0 + 'L' + F.f(xr) + ' ' + y0 + 'A' + F.f(R2) + ' ' + F.f(R2) + ' 0 0 1 ' + F.f(xr) + ' ' + F.f(yb) + 'L' + F.f(x0) + ' ' + F.f(yb) +
    (o.both ? 'A' + F.f(R2) + ' ' + F.f(R2) + ' 0 0 1 ' + F.f(x0) + ' ' + y0 : '') + 'Z" fill="' + C.fill + '" stroke="' + C.edge + '" stroke-width="2.25"/>';
  if (o.split) {
    h += dash(xr, y0, xr, yb) + F.t((x0 + xr) / 2, (y0 + yb) / 2 + 9, o.both ? 'B' : 'A', { s: o.ls || printSize(xr + R2 + 130, parseFloat(o.max || '3'), 17), b: true, c: C.edge }) + F.t(xr + R2 * 0.4, (y0 + yb) / 2 + 9, o.both ? 'C' : 'B', { s: o.ls || printSize(xr + R2 + 130, parseFloat(o.max || '3'), 17), b: true, c: C.edge });
    if (o.both) h += dash(x0, y0, x0, yb) + F.t(x0 - R2 * 0.42, (y0 + yb) / 2 + 9, 'A', { s: o.ls || printSize(xr + R2 + 130, parseFloat(o.max || '3'), 17), b: true, c: C.edge });
  }
  h += F.dim(x0, y0, xr, y0, ask.includes('l') ? '?' : num(l) + ' mm', -22, { s: 12.5, ask: ask.includes('l') });
  if (!o.both) h += F.dim(x0, yb, x0, y0, ask.includes('w') ? '?' : num(w) + ' mm', -26, { s: 12.5, ask: ask.includes('w') });
  else h += F.dim(xr + R2 + 50, yb, xr + R2 + 50, y0, num(w) + ' mm', -0.001, { s: 12.5 }).replace(/<path d="M[^"]*" stroke="#4A4E54" stroke-width="1.1"[^>]*\/>/g, '');
  const W = xr + R2 + (o.both ? 130 : 30);
  return readable(F.svg(W, yb + 30, h, { max: o.max || '3in' }), parseFloat(o.max || '3'), 12.5);
}
/* plate with rounded corners: overall L by W, corner radius r */
function roundedPlate(Lx, W, r, o) {
  o = o || {};
  const S = 320 / Lx, x0 = 88, y0 = 40, w = Lx * S, hh = W * S, rr = r * S;
  const A = (x, y) => 'A' + F.f(rr) + ' ' + F.f(rr) + ' 0 0 1 ' + F.f(x) + ' ' + F.f(y);
  let h = '<path d="M' + F.f(x0 + rr) + ' ' + y0 + 'L' + F.f(x0 + w - rr) + ' ' + y0 + A(x0 + w, y0 + rr) + 'L' + F.f(x0 + w) + ' ' + F.f(y0 + hh - rr) + A(x0 + w - rr, y0 + hh) + 'L' + F.f(x0 + rr) + ' ' + F.f(y0 + hh) + A(x0, y0 + hh - rr) + 'L' + x0 + ' ' + F.f(y0 + rr) + A(x0 + rr, y0) + 'Z" fill="' + C.fill + '" stroke="' + C.edge + '" stroke-width="2.25"/>';
  if (o.split) [[x0 + rr, y0 + rr], [x0 + w - rr, y0 + rr], [x0 + w - rr, y0 + hh - rr], [x0 + rr, y0 + hh - rr]].forEach(p => { h += dash(p[0], y0, p[0], y0 + hh) + dash(x0, p[1], x0 + w, p[1]); });
  h += F.dim(x0, y0, x0 + w, y0, num(Lx) + ' mm', -22, { s: 12.5 });
  h += F.dim(x0, y0 + hh, x0, y0, num(W) + ' mm', -28, { s: 12.5 });
  h += F.callout(x0 + w - rr * (1 - Math.cos(PI / 4)), y0 + hh - rr * (1 - Math.sin(PI / 4)), x0 + w * 0.45, y0 + hh + 40, 'corner radius ' + num(r) + ' mm', { s: 12 });
  return readable(F.svg(x0 + w + 30, y0 + hh + 62, h, { max: o.max || '3.2in' }), parseFloat(o.max || '3.2'), 12.5);
}
/* open belt around two equal pulleys: diameter D, centre distance c */
function belt(D, c, o) {
  o = o || {};
  const S = 380 / (c + D), Rp = D / 2 * S, x1 = 30 + Rp, x2 = x1 + c * S, y = 24 + Rp, Rb = Rp + 4;
  let h = F.circle(x1, y, Rp, { fill: C.fill2, w: 1.8 }) + F.circle(x2, y, Rp, { fill: C.fill2, w: 1.8 }) + dot(x1, y) + dot(x2, y);
  h += '<path d="M' + F.f(x1) + ' ' + F.f(y - Rb) + 'L' + F.f(x2) + ' ' + F.f(y - Rb) + 'A' + F.f(Rb) + ' ' + F.f(Rb) + ' 0 0 1 ' + F.f(x2) + ' ' + F.f(y + Rb) + 'L' + F.f(x1) + ' ' + F.f(y + Rb) + 'A' + F.f(Rb) + ' ' + F.f(Rb) + ' 0 0 1 ' + F.f(x1) + ' ' + F.f(y - Rb) + 'Z" fill="none" stroke="' + C.deep + '" stroke-width="4"/>';
  h += F.dim(x1, y, x2, y, o.askC ? '?' : num(c) + ' mm', Rb + 22, { s: 12.5, ask: o.askC });
  h += F.dim(x2, y + Rp, x2, y - Rp, num(D) + ' mm', Rb + 34, { s: 12.5 });
  return readable(F.svg(x2 + Rb + 110, y + Rb + 50, h, { max: o.max || '3.6in' }), parseFloat(o.max || '3.6'), 12.5);
}
/* rectangle with feet-and-inches labels, drawn to scale: ratio = length ÷ width */
function ftinRect(a, b, max, ratio) {
  const w = 300, hh = w / (ratio || 1.5), x0 = 96, y0 = 40;
  let h = F.rect(x0, y0, w, hh);
  h += F.dim(x0, y0, x0 + w, y0, a, -22, { s: 13 }) + F.dim(x0, y0 + hh, x0, y0, b, -38, { s: 13 });
  return readable(F.svg(x0 + w + 24, y0 + hh + 18, h, { max: max || '2.7in' }), parseFloat(max || '2.7'), 13);
}
/* a triangle with sides a (base), b (right) and c (left), drawn to scale with each angle inside its corner,
   the side lengths outside, and the dashed height with its own red label clear of the sides */
function tri(a, b, c, unit, o) {
  o = o || {};
  const fx = (c * c - b * b + a * a) / (2 * a), fy = Math.sqrt(c * c - fx * fx), S = 260 / a, x0 = 40, yb = fy * S + 46;
  const A = [x0, yb], Bp = [x0 + a * S, yb], T = [x0 + fx * S, yb - fy * S], foot = [T[0], yb];
  let h = F.poly([A, Bp, T]);
  h += F.line(T[0], T[1], foot[0], foot[1], { c: C.dim, w: 1.4, dash: '6 4' }) + F.rightMark(foot, [1, 0], [0, -1], 9);
  h += F.dim(A[0], A[1], Bp[0], Bp[1], fmt(a) + ' ' + unit, 20, { s: 13 });
  h += F.dim(Bp[0], Bp[1], T[0], T[1], fmt(b) + ' ' + unit, 20, { s: 13 });
  h += F.dim(T[0], T[1], A[0], A[1], fmt(c) + ' ' + unit, 20, { s: 13 });
  const ang = (p, q) => Math.atan2(q[1] - p[1], q[0] - p[0]);
  const deg = (u, v, w) => { const d1 = [v[0] - u[0], v[1] - u[1]], d2 = [w[0] - u[0], w[1] - u[1]]; return Math.acos((d1[0] * d2[0] + d1[1] * d2[1]) / Math.hypot(...d1) / Math.hypot(...d2)) * 180 / PI; };
  const lab = v => (Math.round(v * 100) / 100).toFixed(2) + '°';
  const as = printSize(x0 + a * S + 40, parseFloat(o.max || '2.4'));
  h += F.arc(A, ang(A, T), ang(A, Bp), 22, lab(deg(A, Bp, T)), { lr: 22 + 1.6 * as, s: as });
  h += F.arc(Bp, ang(Bp, A), ang(Bp, T), 22, lab(deg(Bp, A, T)), { lr: 22 + 1.6 * as, s: as });
  h += F.arc(T, ang(T, Bp), ang(T, A), 20, lab(deg(T, A, Bp)), { lr: 10 + 1.2 * as, s: as });
  if (o.h) h += F.label(foot[0] - 36, T[1] + 0.74 * (yb - T[1]), o.h, { s: 13, c: C.red });
  return readable(F.svg(x0 + a * S + 40, yb + 44, h, { max: o.max || '2.4in' }), parseFloat(o.max || '2.4'), 13);
}
/* a sector: centre at the bottom left, a radius along the bottom, angle t (degrees) marked inside the corner,
   and the arc length outside the arc. o.askL puts a ? on the arc */
function sectorFig(r, t, unit, o) {
  o = o || {};
  const R = 170, P = [44, 214], tr = t * PI / 180;
  const A = [P[0] + R, P[1]], Bq = [P[0] + R * Math.cos(tr), P[1] - R * Math.sin(tr)];
  let h = '<path d="M' + P[0] + ' ' + P[1] + 'L' + A[0] + ' ' + A[1] + 'A' + R + ' ' + R + ' 0 ' + (t > 180 ? 1 : 0) + ' 0 ' + F.f(Bq[0]) + ' ' + F.f(Bq[1]) + 'Z" fill="' + C.fill + '" stroke="' + C.edge + '" stroke-width="2.25"/>';
  h += dot(P[0], P[1]);
  h += F.dim(P[0], P[1], A[0], A[1], 'r = ' + fmt(r) + ' ' + unit, 22, { s: 13 });
  h += F.arc(P, -tr, 0, 30, t + '°', { lr: 12 + printSize(P[0] + R + 70, parseFloat(o.max || '1.8')), s: printSize(P[0] + R + 70, parseFloat(o.max || '1.8')) });
  const mid = -tr / 2, lx = P[0] + (R + 28) * Math.cos(mid), ly = P[1] + (R + 28) * Math.sin(mid);
  h += F.label(lx, ly + 5, o.askL ? '?' : (o.L || ''), { ask: o.askL, s: 13 });
  return readable(F.svg(P[0] + R + 70, P[1] + 44, h, { max: o.max || '1.8in' }), parseFloat(o.max || '1.8'), 13);
}
module.exports = { rectSemi, roundedPlate, belt, ftinRect, tri, sectorFig, dot };
