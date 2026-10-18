/* Drawing helpers for Chapter 8 (Formulas and Transposing), shared by the textbook chapter and the Exercise Book */
const F = require('./figs.js');
const C = F.C;

/* Shapes printed small: enlarge each label chip in place so it prints at about 7.5 pt,
   and pad the view box so enlarged chips at the edge are not cut off */
function readable(svg, widthIn, base) {
  const vb = /viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/.exec(svg);
  if (!vb) return svg;
  const [x, y, w, h] = vb.slice(1).map(Number);
  const W96 = widthIn * 96, fs = base || 15;
  /* scale k so that fs * k * W96 / (w + 2 * 9 * k) reaches 10 px (7.5 pt) after the view box is padded */
  const den = fs * W96 - 180;
  const k = den > 0 ? Math.max(1, Math.min(2.6, 10 * w / den)) : 2.6;
  if (k < 1.05) return svg;
  const pad = 9 * k;
  let out = svg.replace(/<rect ([^>]*)\/><text ([^>]*)>([^<]*)<\/text>/g, (all, ra) => {
    const g = a => +((new RegExp(' ' + a + '="([-\\d.]+)"').exec(' ' + ra) || [0, 0])[1]);
    const cx = g('x') + g('width') / 2, cy = g('y') + g('height') / 2;
    return '<g transform="translate(' + cx.toFixed(2) + ' ' + cy.toFixed(2) + ') scale(' + k.toFixed(3) + ') translate(' + (-cx).toFixed(2) + ' ' + (-cy).toFixed(2) + ')">' + all + '</g>';
  });
  return out.replace(vb[0], 'viewBox="' + (x - pad).toFixed(2) + ' ' + (y - pad).toFixed(2) + ' ' + (w + 2 * pad).toFixed(2) + ' ' + (h + 2 * pad).toFixed(2) + '"');
}
/* B.shape and B.net with readable labels */
function shapers(B) {
  const inches = o => parseFloat((o && o.width) || '3.2');
  return {
    SH: (id, p, o) => readable(B.shape(id, p, o), inches(o)),
    NT: (id, p, o) => readable(B.net(id, p, o), inches(o))
  };
}
/* one balance scale as an SVG body, 400 wide and 200 high. op: red note above both pans */
function balanceBody(left, right, op) {
  const W = 400, cx = W / 2, by = 128, arm = 128;
  let h = '';
  h += F.poly([[cx, by], [cx - 26, 188], [cx + 26, 188]], { fill: C.gold, w: 2 });
  h += F.rect(cx - 62, 188, 124, 9, { fill: C.fill, w: 1.8 });
  h += F.rect(cx - arm - 12, by - 6, 2 * arm + 24, 12, { fill: C.fill, w: 2 });
  h += '<circle cx="' + cx + '" cy="' + by + '" r="4" fill="' + C.edge + '"/>';
  [[-1, left], [1, right]].forEach(([s, lab]) => {
    const x = cx + s * arm;
    h += F.line(x, by - 6, x, by - 30, { c: C.edge, w: 4 });
    h += '<path d="M' + (x - 70) + ' ' + (by - 38) + 'L' + (x + 70) + ' ' + (by - 38) + 'L' + (x + 56) + ' ' + (by - 28) + 'L' + (x - 56) + ' ' + (by - 28) + 'Z" fill="' + C.gold + '" stroke="' + C.edge + '" stroke-width="2"/>';
    const tw = Math.max(70, lab.length * 10 + 24);
    h += F.rect(x - tw / 2, by - 80, tw, 42, { fill: '#FFFFFF', w: 2 });
    h += F.t(x, by - 53, lab, { s: 18, b: true });
    if (op) h += F.t(x, by - 90, op, { s: 16, b: true, c: C.red });
  });
  return h;
}
/* a single balance scale, for a worksheet canvas */
function balance(left, right, max) { return F.svg(400, 204, balanceBody(left, right), { max: max || '2.6in' }); }
/* circle with a hidden diameter and a callout for the distance around */
function circleCallout(note, mx) {
  const cx = 130, cy = 112, r = 86;
  let h = F.circle(cx, cy, r) + '<circle cx="' + cx + '" cy="' + cy + '" r="3.2" fill="' + C.edge + '"/>';
  h += F.dim(cx - r, cy, cx + r, cy, '?', 0, { ask: true, s: 13 }).replace(/<path d="M[^"]*" stroke="#4A4E54" stroke-width="1.1"[^>]*\/>/g, '');
  h += F.callout(cx + r * Math.cos(-0.7), cy + r * Math.sin(-0.7), 300, 40, note, { s: 12.5 });
  return readable(F.svg(370, 210, h, { max: mx || '2.7in' }), parseFloat(mx || '2.7'), 12.5);
}

const dot = (x, y) => '<circle cx="' + F.f(x) + '" cy="' + F.f(y) + '" r="3.4" fill="' + C.edge + '"/>';
const fmt = v => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
/* plain (non-chip) text size that prints at about 7.5 pt in an SVG W units wide printed maxIn inches wide */
const printSize = (W, maxIn, min) => Math.max(min || 12, 10.5 * W / (maxIn * 96));
/* a circle with its radius drawn from the centre and labelled "r = ..." in a callout above, clear of the rim.
   o.askR labels the radius "r = ?". o.askD draws the diameter and a "D = ?" dimension below. o.max: print width */
function radCircle(r, unit, o) {
  o = o || {};
  const R = 82, cx = R + 34, cy = R + 64, a = -0.75;
  let h = F.circle(cx, cy, R) + dot(cx, cy);
  const ex = cx + R * Math.cos(a), ey = cy + R * Math.sin(a);
  h += F.line(cx, cy, ex, ey, { c: C.red, w: 2.6 }) + F.arrowHead(ex, ey, a, C.red);
  h += F.callout(cx + 0.45 * R * Math.cos(a), cy + 0.45 * R * Math.sin(a), cx + 10, 24, o.askR ? 'r = ?' : 'r = ' + fmt(r) + ' ' + unit, { s: 13 });
  if (o.askD) h += F.line(cx - R, cy, cx + R, cy, { c: C.dim, w: 1.4, dash: '6 4' }) + F.dim(cx - R, cy, cx + R, cy, 'D = ?', R + 22, { s: 13 });
  const H = o.askD ? cy + R + 44 : cy + R + 12;
  return readable(F.svg(2 * cx, H, h, { max: o.max || '1.6in' }), parseFloat(o.max || '1.6'), 13);
}
/* a washer: outer and inner radius drawn from the centre, each labelled in a callout (outer above, inner below) */
function washer(Ro, Ri, unit, o) {
  o = o || {};
  const R = 90, cx = R + 40, cy = R + 62, r = R * Ri / Ro;
  let h = F.circle(cx, cy, R) + F.circle(cx, cy, r, { fill: '#FFFFFF' }) + dot(cx, cy);
  const a1 = -0.7, a2 = 2.5;
  const p1 = [cx + R * Math.cos(a1), cy + R * Math.sin(a1)], p2 = [cx + r * Math.cos(a2), cy + r * Math.sin(a2)];
  h += F.line(cx, cy, p1[0], p1[1], { c: C.red, w: 2.6 }) + F.arrowHead(p1[0], p1[1], a1, C.red);
  h += F.line(cx, cy, p2[0], p2[1], { c: C.red, w: 2.6 }) + F.arrowHead(p2[0], p2[1], a2, C.red);
  h += F.callout(cx + (r + (R - r) * 0.5) * Math.cos(a1), cy + (r + (R - r) * 0.5) * Math.sin(a1), cx + 20, 24, 'outer r = ' + fmt(Ro) + ' ' + unit, { s: 13 });
  h += F.callout(cx + 0.55 * r * Math.cos(a2), cy + 0.55 * r * Math.sin(a2), cx - 10, cy + R + 30, 'inner r = ' + fmt(Ri) + ' ' + unit, { s: 13 });
  return readable(F.svg(2 * cx, cy + R + 50, h, { max: o.max || '1.8in' }), parseFloat(o.max || '1.8'), 13);
}
/* a cylinder drawn to scale: radius line on the top face with an "r = ..." callout, height dimension on the right.
   o.askH / o.askR put a ? in place of the value */
function cyl3d(r, hgt, unit, o) {
  o = o || {};
  const sc = Math.min(62 / r, 230 / hgt), rx = r * sc, ry = rx * 0.32, H = hgt * sc, cx = 56 + rx, top = 80;
  let h = '<path d="M' + F.f(cx - rx) + ' ' + top + 'L' + F.f(cx - rx) + ' ' + F.f(top + H) + 'A' + F.f(rx) + ' ' + F.f(ry) + ' 0 0 0 ' + F.f(cx + rx) + ' ' + F.f(top + H) + 'L' + F.f(cx + rx) + ' ' + top + 'Z" fill="' + C.gold + '" stroke="' + C.edge + '" stroke-width="2.25"/>';
  h += '<path d="M' + F.f(cx - rx) + ' ' + F.f(top + H) + 'A' + F.f(rx) + ' ' + F.f(ry) + ' 0 0 1 ' + F.f(cx + rx) + ' ' + F.f(top + H) + '" fill="none" stroke="' + C.edge + '" stroke-width="1.3" stroke-dasharray="5 4"/>';
  h += '<ellipse cx="' + F.f(cx) + '" cy="' + top + '" rx="' + F.f(rx) + '" ry="' + F.f(ry) + '" fill="' + C.fill2 + '" stroke="' + C.edge + '" stroke-width="2.25"/>';
  h += dot(cx, top) + F.line(cx, top, cx + rx, top, { c: C.red, w: 2.6 }) + F.arrowHead(cx + rx, top, 0, C.red);
  const rl = o.askR ? null : 'r = ' + fmt(r) + ' ' + unit;
  if (rl) h += F.callout(cx + rx / 2, top, cx + 10, 24, rl, { s: 13 });
  else h += F.callout(cx + rx / 2, top, cx + 10, 24, 'r = ?', { s: 13 });
  h += F.dim(cx + rx, top + H, cx + rx, top, o.askH ? '?' : fmt(hgt) + ' ' + unit, 26, { ask: o.askH, s: 13 });
  return readable(F.svg(cx + rx + 96, top + H + ry + 16, h, { max: o.max || '1.6in' }), parseFloat(o.max || '1.6'), 13);
}
/* the net of a cylinder: the side as a rectangle with the two end circles. The stretch-out dimension sits above
   the top circle, the height dimension on the right, and the bottom circle carries an "r = ..." callout.
   o.askS puts a ? on the stretch-out */
function cylNet(r, hgt, unit, o) {
  o = o || {};
  const Wn = Math.PI * 2 * r, sc = Math.min(300 / Wn, 230 / (hgt + 4 * r)), w = Wn * sc, hh = hgt * sc, rr = r * sc;
  const x0 = 24, y0 = 2 * rr + 62, cxc = x0 + w * 0.32;
  let h = F.rect(x0, y0, w, hh);
  h += F.circle(cxc, y0 - rr, rr) + F.circle(cxc, y0 + hh + rr, rr) + dot(cxc, y0 - rr) + dot(cxc, y0 + hh + rr);
  const ey = y0 + hh + rr;
  h += F.line(cxc, ey, cxc + rr, ey, { c: C.red, w: 2.4 }) + F.arrowHead(cxc + rr, ey, 0, C.red);
  h += F.callout(cxc + rr / 2, ey, cxc + rr + 95, ey + rr * 0.6 + 6, 'r = ' + fmt(r) + ' ' + unit, { s: 13 });
  h += F.dim(x0, y0, x0 + w, y0, o.askS ? '?' : fmt(Math.round(Wn * 100) / 100) + ' ' + unit, -(2 * rr + 26), { ask: o.askS, s: 13 });
  h += F.dim(x0 + w, y0 + hh, x0 + w, y0, fmt(hgt) + ' ' + unit, 26, { s: 13 });
  return readable(F.svg(x0 + w + 110, y0 + hh + 2 * rr + 30, h, { max: o.max || '2.4in' }), parseFloat(o.max || '2.4'), 13);
}

/* a rectangle (or square) drawn to scale with dimension lines set well clear of the edges.
   o.askL / o.askW put a ? chip in place of the value */
function rectFig(l, w, unit, o) {
  o = o || {};
  const sc = Math.min(240 / l, 150 / w), W = l * sc, H = w * sc, x0 = 24, y0 = 24;
  let h = F.rect(x0, y0, W, H) + F.rightMark([x0, y0 + H], [1, 0], [0, -1], 10);
  h += F.dim(x0, y0 + H, x0 + W, y0 + H, o.askL ? '?' : fmt(l) + ' ' + unit, 46, { ask: o.askL, s: 13 });
  if (!o.square) h += F.dim(x0 + W, y0 + H, x0 + W, y0, o.askW ? '?' : fmt(w) + ' ' + unit, 46, { ask: o.askW, s: 13 });
  return readable(F.svg(x0 + W + 120, y0 + H + 80, h, { max: o.max || '1.8in' }), parseFloat(o.max || '1.8'), 13);
}
module.exports = { rectFig, printSize, readable, shapers, balanceBody, balance, circleCallout, radCircle, washer, cyl3d, cylNet };
