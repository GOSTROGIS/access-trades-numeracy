/* Chapter 10: Area. Every number is computed here and cross-checked against the Shapes engine where a shape exists. */
module.exports = function (B, L) {
  const F = require('../engine/figs.js');
  const C = F.C;
  const n = L.num;
  const PI = Math.PI;
  const r2 = x => L.round(x, 2);
  const n2 = x => n(r2(x), 2);
  const n0 = x => n(Math.round(x));
  const G = require('../engine/figs-ch10.js')(B, L);

  /* cross-check a value against the Shapes engine calculation */
  function xc(id, p, key, v) {
    const it = B.shapeCalc(id, p, 'mm').items.find(i => i.key === key);
    if (!it || Math.abs(it.value - v) > 1e-6 * Math.max(1, Math.abs(v))) throw new Error('ch10 cross-check ' + id + ' ' + key + ': ' + v + ' vs ' + (it && it.value));
    return v;
  }

  /* Shapes engine drawings with labels enlarged for print: every label chip and its text are scaled about the
     chip centre by k, and the viewBox gets a margin so the bigger chips are not clipped */
  function big(svg, k) {
    k = k || 1.8;
    const num = (a, t) => +((new RegExp('\\b' + a + '="([-\\d.]+)"')).exec(t) || [0, 0])[1];
    svg = svg.replace(/viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/, (m, x, y, w, h) => { const p = 9 * k; return 'viewBox="' + (+x - p) + ' ' + (+y - p) + ' ' + (+w + 2 * p) + ' ' + (+h + 2 * p) + '"'; });
    return svg.replace(/<rect ([^>]*)\/><text ([^>]*)>([^<]*)<\/text>/g, (all, ra, ta, txt) => {
      const x = num('x', ra), y = num('y', ra), w = num('width', ra), h = num('height', ra), cx = x + w / 2, cy = y + h / 2;
      const ra2 = ra.replace(/\bx="[-\d.]+"/, 'x="' + (cx - w * k / 2).toFixed(2) + '"').replace(/\by="[-\d.]+"/, 'y="' + (cy - h * k / 2).toFixed(2) + '"').replace(/\bwidth="[-\d.]+"/, 'width="' + (w * k).toFixed(2) + '"').replace(/\bheight="[-\d.]+"/, 'height="' + (h * k).toFixed(2) + '"');
      const ta2 = ta.replace(/\bx="[-\d.]+"/, 'x="' + (cx + (num('x', ta) - cx) * k).toFixed(2) + '"').replace(/\by="[-\d.]+"/, 'y="' + (cy + (num('y', ta) - cy) * k).toFixed(2) + '"').replace(/font-size="([\d.]+)"/, (m, fs) => 'font-size="' + (fs * k).toFixed(1) + '"');
      return '<rect ' + ra2 + '/><text ' + ta2 + '>' + txt + '</text>';
    });
  }
  const SH = (id, p, o) => big(B.shape(id, p, o), (o && o.k) || 1.8);
  const NET = (id, p, o) => big(B.net(id, p, o), (o && o.k) || 1.8);

  /* ---------- drawing helpers ---------- */
  /* a frame in real units (y up) scaled into a pixel box. pad = [left, top, right, bottom] in px */
  function frame(w, h, o) {
    o = o || {};
    const pw = o.pw || 360, ph = o.ph || 240, pad = o.pad || [64, 44, 64, 52];
    const S = Math.min(pw / w, ph / h);
    const P = (x, y) => [pad[0] + x * S, pad[1] + (h - y) * S];
    const W = pad[0] + w * S + pad[2], H = pad[1] + h * S + pad[3];
    return { P, S, out: (body, max) => F.svg(W, H, body, { max: max || o.max || '3.4in' }) };
  }
  const D = (a, b, lab, off, ask, s) => F.dim(a[0], a[1], b[0], b[1], ask ? '?' : lab, off, { ask: !!ask, s: s || 13 });
  const shape = (pts, o) => F.poly(pts, o);
  const split = (a, b) => F.line(a[0], a[1], b[0], b[1], { c: C.dim, w: 1.5, dash: '6 4' });
  const tag = (p, s) => F.t(p[0], p[1] + 7, s, { s: 20, b: true, c: C.edge });
  const hole = (p, rpx) => F.circle(p[0], p[1], rpx, { fill: '#FFFFFF', w: 2 });
  const pair = (a, b, wa, wb) => '<div style="display:flex;justify-content:center;align-items:center;gap:14pt"><div style="width:' + (wa || '46%') + '">' + a + '</div><div style="width:' + (wb || '46%') + '">' + b + '</div></div>';
  const mmA = v => n(v) + ' mm';

  /* squares on a grid: cells [[col,row],...] filled, grid of cols x rows, cell size px */
  function gridFig(cols, rows, cells, o) {
    o = o || {};
    const g = o.g || 34, x0 = 30, y0 = 18;
    let h = '';
    for (let i = 0; i <= cols; i++) h += F.line(x0 + i * g, y0, x0 + i * g, y0 + rows * g, { c: '#C9CDD2', w: 1 });
    for (let j = 0; j <= rows; j++) h += F.line(x0, y0 + j * g, x0 + cols * g, y0 + j * g, { c: '#C9CDD2', w: 1 });
    cells.forEach(([c, r]) => { h += '<rect x="' + (x0 + c * g) + '" y="' + (y0 + (rows - 1 - r) * g) + '" width="' + g + '" height="' + g + '" fill="' + C.fill + '" stroke="' + C.edge + '" stroke-width="1.4"/>'; });
    if (o.numbers) cells.forEach(([c, r], k) => { h += F.t(x0 + c * g + g / 2, y0 + (rows - 1 - r) * g + g / 2 + 5, String(k + 1), { s: 13, c: C.dim }); });
    const lc = o.unitCell || [cols - 1, rows - 1];
    const ux = x0 + lc[0] * g, uy = y0 + (rows - 1 - lc[1]) * g;
    h += '<rect x="' + ux + '" y="' + uy + '" width="' + g + '" height="' + g + '" fill="' + C.gold + '" stroke="' + C.edge + '" stroke-width="1.4"/>';
    h += F.dim(ux, uy, ux + g, uy, o.u || '1 cm', -16, { s: 13 });
    return F.svg(x0 + cols * g + 30, y0 + rows * g + 22, h, { max: o.max || '3in' });
  }

  /* 1 m² and 1 ft² side by side */
  function unitSquares() {
    let h = '';
    const s = 150, x1 = 60, y1 = 34, x2 = 330;
    h += F.rect(x1, y1, s, s, { fill: C.fill });
    h += F.dim(x1, y1, x1 + s, y1, '1 m = 1,000 mm', -18, { s: 12 });
    h += F.dim(x1, y1 + s, x1, y1, '1 m', -20, { s: 12 });
    h += F.label(x1 + s / 2, y1 + s / 2 - 6, '1 m²', { s: 17 }) + F.label(x1 + s / 2, y1 + s / 2 + 20, '1,000,000 mm²', { s: 12 });
    for (let i = 1; i < 12; i++) { h += F.line(x2 + i * s / 12, y1, x2 + i * s / 12, y1 + s, { c: '#E3B98A', w: 0.8 }) + F.line(x2, y1 + i * s / 12, x2 + s, y1 + i * s / 12, { c: '#E3B98A', w: 0.8 }); }
    h += F.rect(x2, y1, s, s, { fill: 'none' });
    h += '<rect x="' + x2 + '" y="' + y1 + '" width="' + s / 12 + '" height="' + s / 12 + '" fill="' + C.gold + '" stroke="' + C.edge + '" stroke-width="1"/>';
    h += F.dim(x2, y1, x2 + s, y1, '1 ft = 12 in', -18, { s: 12 });
    h += F.label(x2 + s / 2, y1 + s / 2 - 6, '1 ft²', { s: 17 }) + F.label(x2 + s / 2, y1 + s / 2 + 20, '144 in²', { s: 12 });
    h += F.callout(x2 + s / 24, y1 + s / 24, x2 + s + 62, y1 + 30, '1 in²', { s: 11 });
    return F.svg(560, y1 + s + 16, h, { max: '5in' });
  }

  /* a rectangle cut on its diagonal, then three triangles with the same base and height */
  function triFamily() {
    const b = 150, hh = 96, y = 130, gap = 46;
    let h = '', x = 22;
    h += F.rect(x, y - hh, b, hh, { fill: C.fill2, dash: '5 4', w: 1.6 });
    h += shape([[x, y], [x + b, y], [x + b, y - hh]], { fill: C.fill });
    h += F.t(x + b * 0.68, y - 14, 'half', { s: 12, b: true, c: C.edge });
    h += F.t(x + b / 2, y + 22, 'b', { s: 14, b: true }) + F.t(x - 10, y - hh / 2 + 5, 'h', { s: 14, b: true });
    x += b + gap + 10;
    const tri = (apx, lab) => {
      let t = shape([[x, y], [x + b, y], [x + apx, y - hh]]);
      if (apx > b) t += F.line(x + b, y, x + apx + 4, y, { c: C.dim, w: 1.2, dash: '4 3' });
      t += F.line(x + apx, y - hh, x + apx, y, { c: C.red, w: 1.5, dash: '5 3' });
      t += F.rightMark([x + apx, y], [apx > 0 ? -1 : 1, 0], [0, -1], 8);
      t += F.t(x + apx + (apx > b ? 10 : apx > 0 ? 9 : 9), y - hh / 2 + 5, 'h', { s: 14, b: true, c: C.red, a: 'start' });
      t += F.t(x + b / 2, y + 22, 'b', { s: 14, b: true });
      if (lab) t += F.t(x + b / 2, 18, lab, { s: 11.5, c: C.dim });
      x += b + gap + (apx > b ? 40 : 0);
      return t;
    };
    h += tri(0, 'right triangle') + tri(64, 'height inside') + tri(200, 'height outside');
    return F.svg(x + 4, y + 34, h, { max: '6.4in' });
  }

  /* parallelogram cut and moved into a rectangle */
  function paraMove() {
    const b = 190, hh = 100, off = 60, y = 128, x = 24;
    let h = shape([[x + off, y - hh], [x + off + b, y - hh], [x + b, y], [x + off, y]]);
    h += shape([[x, y], [x + off, y], [x + off, y - hh]], { fill: C.gold });
    h += F.line(x + off, y - hh, x + off, y, { c: C.red, w: 1.6, dash: '5 3' });
    h += F.t(x + (off + b) / 2 + 20, y + 22, 'b', { s: 14, b: true });
    const ax = x + off + b + 26;
    h += F.line(ax, y - hh / 2, ax + 42, y - hh / 2, { c: C.ink, w: 2 }) + F.arrowHead(ax + 46, y - hh / 2, 0, C.ink);
    const x2 = ax + 70;
    h += shape([[x2, y - hh], [x2 + b, y - hh], [x2 + b - off, y], [x2, y]]);
    h += shape([[x2 + b - off, y], [x2 + b, y], [x2 + b, y - hh]], { fill: C.gold });
    h += F.rightMark([x2 + b, y], [-1, 0], [0, -1], 8);
    h += D([x2, y], [x2 + b, y], 'b', 22, false, 14);
    h += D([x2 + b, y], [x2 + b, y - hh], 'h', 24, false, 14);
    return F.svg(x2 + b + 60, y + 52, h, { max: '5.2in' });
  }

  /* trapezoid and a turned copy make a parallelogram with base a + b */
  function trapDouble() {
    const a = 80, b = 170, hh = 92, y = 118, x = 26, sh = 40;
    let h = shape([[x, y], [x + b, y], [x + sh + a, y - hh], [x + sh, y - hh]]);
    h += F.t(x + sh + a / 2, y - hh - 8, 'a', { s: 14, b: true }) + F.t(x + b / 2, y + 22, 'b', { s: 14, b: true });
    h += F.line(x + sh, y - hh, x + sh, y, { c: C.red, w: 1.5, dash: '5 3' }) + F.t(x + sh + 8, y - hh / 2 + 5, 'h', { s: 14, b: true, c: C.red, a: 'start' });
    const x2 = x + b + 70;
    h += shape([[x2, y], [x2 + b, y], [x2 + sh + a, y - hh], [x2 + sh, y - hh]]);
    h += shape([[x2 + b, y], [x2 + b + a, y], [x2 + b + a + sh, y - hh], [x2 + sh + a, y - hh]], { fill: C.fill2, dash: '6 4' });
    h += F.t(x2 + b / 2, y - 30, 'A', { s: 16, b: true, c: C.edge }) + F.t(x2 + b + 10, y - 30, 'copy', { s: 12, b: true, c: C.dim, a: 'start' });
    h += D([x2, y], [x2 + b + a, y], 'a + b', 22, false, 13);
    h += F.t(x2 + sh + a / 2, y - hh - 8, 'a', { s: 13, c: C.dim }) + F.t(x2 + b + a / 2 + 4, y - 6, 'a', { s: 13, c: C.dim });
    return F.svg(x2 + b + a + sh + 20, y + 50, h, { max: '5.6in' });
  }

  /* circle inside a 2r square with one r by r square shaded */
  function circleSquare() {
    const R = 80, cx = 30 + R, cy = 22 + R;
    let h = F.rect(cx - R, cy - R, 2 * R, 2 * R, { fill: '#FFFFFF', w: 1.5, c: C.dim });
    h += '<rect x="' + cx + '" y="' + (cy - R) + '" width="' + R + '" height="' + R + '" fill="' + C.gold + '" stroke="' + C.dim + '" stroke-width="1.2"/>';
    h += F.line(cx - R, cy, cx + R, cy, { c: C.dim, w: 1, dash: '4 3' }) + F.line(cx, cy - R, cx, cy + R, { c: C.dim, w: 1, dash: '4 3' });
    h += F.circle(cx, cy, R, { fill: 'rgba(255,235,178,0.55)' });
    h += F.line(cx, cy, cx - R * 0.6, cy + R * 0.8, { c: C.red, w: 1.8 }) + F.t(cx - R * 0.42, cy + R * 0.42, 'r', { s: 15, b: true, c: C.red });
    h += F.label(cx + R / 2, cy - R / 2 + 6, 'r²', { s: 16 });
    h += F.dim(cx, cy - R, cx + R, cy - R, 'r', -16, { s: 13 });
    return F.svg(2 * R + 60, 2 * R + 44, h, { max: '2.1in' });
  }

  /* ---------- numbers ---------- */
  const plate = { l: 600, w: 450 }, plateA = xc('rectangle', plate, 'A', plate.l * plate.w);
  const floorA = 6 * 4.5, cover = 5, litres = floorA / cover;
  const gus = { b: 300, h: 200 }, gusA = xc('right-triangle', gus, 'A', gus.b * gus.h / 2);
  const endP = { b: 600, h: 400 }, endA = xc('isosceles-triangle', endP, 'A', endP.b * endP.h / 2);
  const par = { b: 500, h: 300, s: 340 }, parA = xc('parallelogram', par, 'A', par.b * par.h);
  const trap = { a: 400, b: 1200, h: 700 }, trapA = xc('trapezoid', trap, 'A', (trap.a + trap.b) / 2 * trap.h);
  const disc = { r: 150 }, discA = xc('circle', disc, 'A', PI * disc.r * disc.r);
  const cov = 18, covA = PI * (cov / 2) * (cov / 2);
  const semi = { r: 200 }, semiA = xc('semicircle', semi, 'A', PI * semi.r * semi.r / 2);
  const ring = { R: 150, r: 100 }, ringA = xc('annulus', ring, 'A', PI * (ring.R * ring.R - ring.r * ring.r));
  const ringWrong = PI * (ring.R - ring.r) * (ring.R - ring.r);
  const lA = 250 * 600, lB = 550 * 200, lTot = lA + lB, lAlt = 800 * 600 - 550 * 400;
  if (lAlt !== lTot) throw new Error('L plate check');
  const hpA = 400 * 300, hpB = PI * 80 * 80, hpNet = hpA - hpB;
  const lugA = 120 * 150, lugB = PI * 60 * 60 / 2, lugC = PI * 15 * 15, lugT = lugA + lugB - lugC;
  const box = { l: 600, w: 400, h: 300 }, boxSA = xc('rectangular-prism', box, 'SA', 2 * (box.l * box.w + box.l * box.h + box.w * box.h));
  const cyl = { r: 300, h: 1000 }, cylEnds = PI * cyl.r * cyl.r * 2, cylSide = PI * 2 * cyl.r * cyl.h, cylSA = xc('cylinder', cyl, 'SA', cylEnds + cylSide);
  xc('cylinder', cyl, 'LA', cylSide);
  const duct = { a: 12, b: 8, len: 60 }, ductP = 2 * (duct.a + duct.b), ductA = ductP * duct.len;

  /* worksheet numbers */
  const w1 = { l: 1250, w: 600 }, w1A = xc('rectangle', w1, 'A', w1.l * w1.w);
  const w2 = { b: 450, h: 320 }, w2A = xc('right-triangle', w2, 'A', w2.b * w2.h / 2);
  const w3 = { b: 36, h: 20, s: 24 }, w3A = xc('parallelogram', w3, 'A', w3.b * w3.h);
  const w4 = { a: 500, b: 900, h: 400 }, w4A = xc('trapezoid', w4, 'A', (w4.a + w4.b) / 2 * w4.h);
  const w5 = { r: 225 }, w5A = xc('circle', w5, 'A', PI * w5.r * w5.r);
  const w6 = { R: 90, r: 60 }, w6A = xc('annulus', w6, 'A', PI * (w6.R * w6.R - w6.r * w6.r));
  const w7 = { l: 900, w: 400 }, w7A = w7.l * w7.w;
  const w8 = { b: 360, h: 300 }, w8A = w8.b * w8.h / 2;
  const tA = 600 * 150, tB = 200 * 450, tT = tA + tB;
  const nT = 700 * 400 - 200 * 150;
  const uA = 150 * 500, uC = 600 * 150, uT = 2 * uA + uC;
  const bpT = 300 * 200 - 4 * PI * 10 * 10;
  const gT = 24 * 10 + 24 * 6 / 2, gFt = gT / 144;
  const slT = 500 * 200 + PI * 100 * 100;
  const cube = { s: 250 }, cubeSA = xc('cube', cube, 'SA', 6 * cube.s * cube.s);
  const pr = { l: 800, w: 500, h: 400 }, prSA = xc('rectangular-prism', pr, 'SA', 2 * (pr.l * pr.w + pr.l * pr.h + pr.w * pr.h));
  const cy2 = { r: 200, h: 600 }, cy2S = PI * 2 * cy2.r, cy2SA = xc('cylinder', cy2, 'SA', PI * cy2.r * cy2.r * 2 + cy2S * cy2.h);
  const ot = { l: 1000, w: 600, h: 500 }, otSA = ot.l * ot.w + 2 * ot.l * ot.h + 2 * ot.w * ot.h;
  const d2 = { a: 16, b: 10, len: 48 }, d2A = 2 * (d2.a + d2.b) * d2.len;
  const c100 = PI * 100 * 100, c200 = PI * 200 * 200;

  /* materials takeoff numbers (10.8 and Worksheet 10D). Sheet sizes, coverage, waste percents and prices are given
     data in each problem, not standards. Code values are quoted from BCBC 2024 Division B with Article, Sentence
     and page. Units to buy always round up */
  const PL = require('../engine/plates.js');
  const up = x => Math.ceil(L.round(x, 6));
  const money = v => '$' + n(v, 2);
  const dw = { W: 6, H: 2.4, door: [0.9, 2.1], win: [1.5, 1.2], sheet: 1.2 * 2.4, price: 18.5 };
  const dwNet = dw.W * dw.H - dw.door[0] * dw.door[1] - dw.win[0] * dw.win[1], dwS = dwNet / dw.sheet, dwN = up(dwS);
  const sh = { W: 36, H: 8, nWin: 2, win: [4, 3], doorA: 3 * 80 / 12, sheet: 32, price: 24.95 };
  const shNet = sh.W * sh.H - sh.nWin * sh.win[0] * sh.win[1] - sh.doorA, shS = shNet / sh.sheet, shN = up(shS);
  const tl = { l: 3.6, w: 2.7, waste: 10, perBox: 12 * 0.3 * 0.3, price: 42 };
  const tlA = tl.l * tl.w, tlW = tlA * (1 + tl.waste / 100), tlB = tlW / tl.perBox, tlN = up(L.round(tlB, 6));
  const pt = { l: 4.2, w: 3.6, h: 2.4, door: [0.9, 2.1], win: [1.2, 1], coats: 2, can: 35, price: 54.99 };
  const ptWall = 2 * (pt.l + pt.w) * pt.h, ptNet = ptWall - pt.door[0] * pt.door[1] - pt.win[0] * pt.win[1], ptC = ptNet * pt.coats / pt.can, ptN = up(ptC);
  const rf = { L: 12.6, s: 4.2, waste: 5, sheet: 1.22 * 2.44, price: 32.75 };
  const rfA = 2 * rf.L * rf.s, rfW = rfA * (1 + rf.waste / 100), rfS = rfW / rf.sheet, rfN = up(rfS);
  /* worksheet 10D */
  const k1 = (5.4 * 2.4 - 1.2 * 1.2) / 2.88, k2L = 5 * 2.88 / 2.4;
  const k3A = (2400 * 3600 + 2400 * 1800) / 1e6, k3B = k3A * 1.1 / 1.08;
  const k4A = 2 * 10 * 4.5, k4B = k4A / 3.1;
  const k5 = (24 * 8 - 6 * 4) / 32, k6 = (4 * 2.6 - 0.9 * 2) * 2 / 9;

  /* the quadrilateral family table in 10.4. It is written as plain HTML with no caption number, so the numbering of
     Chapter 10 tables does not move (numbering is frozen, Oct 20 2026) */
  function quadTable() {
    const rows = [
      ['square', 'Square', '4 equal sides, opposite sides parallel', '4 right angles', 'Equal length, cross at right angles, cut each other in half', 'A = s × s'],
      ['rectangle', 'Rectangle', 'Opposite sides equal and parallel', '4 right angles', 'Equal length, cut each other in half', 'A = l × w'],
      ['parallelogram', 'Parallelogram', 'Opposite sides equal and parallel', 'Opposite angles equal', 'Cut each other in half', 'A = b × h'],
      ['rhombus', 'Rhombus', '4 equal sides, opposite sides parallel', 'Opposite angles equal', 'Cross at right angles, cut each other in half', 'A = b × h or A = d₁ × d₂ ÷ 2'],
      ['trapezoid', 'Trapezoid', 'One pair of parallel sides, a and b', 'No fixed rule', 'No fixed rule', 'A = (a + b) ÷ 2 × h'],
      ['kite', 'Kite', 'Two pairs of equal sides that meet at a corner', 'One pair of opposite angles equal', 'Cross at right angles, one cuts the other in half', 'A = d₁ × d₂ ÷ 2']
    ]
    const th = ['Shape', '', 'Sides', 'Angles', 'Diagonals', 'Area'].map(h => '<th>' + h + '</th>').join('')
    const tb = rows.map(r => '<tr><td>' + G.quadIcon(r[0]) + '</td><td><b>' + r[1] + '</b></td><td>' + r[2] + '</td><td>' + r[3] + '</td><td>' + r[4] + '</td><td style="white-space:nowrap">' + r[5] + '</td></tr>').join('')
    return '<table class="t"><tr>' + th + '</tr>' + tb + '</table><div class="tcap">The quadrilateral family. Tick marks show sides of equal length. h is always measured at right angles to the base, and d₁ and d₂ are the diagonals.</div>'
  }

  /* an example that may break between its steps and its calculator box. The calculator box and the answer stay
     together, so an answer line never starts a page on its own */
  function exL(o) {
    const c = o.calc;
    if (!c || (o.fig && !o.breakable)) return B.example(o);
    B.ex++;
    const top = '<div class="hd" style="background:var(--red1);padding:5pt 11pt;font:700 10pt Archivo,sans-serif;color:var(--deep8)"><span class="n" style="color:var(--red);margin-right:6pt">Example ' + B.ch + '.' + B.ex + '</span>' + (o.title || '') + '</div><div class="bd">' +
      (o.fig ? '<div class="fig">' + o.fig + '</div>' : '') + (o.q ? '<div class="q">' + o.q + '</div>' : '') +
      (o.steps && o.steps.length ? '<div class="lbl">Solution</div><ol class="steps">' + o.steps.map(x => '<li>' + x + '</li>').join('') + '</ol>' : '') + (o.after || '') + '<div class="clear"></div></div>';
    const bottom = '<div class="bd" style="padding-top:0">' + B.calc(c) + (o.answer ? '<div class="a">' + o.answer + '</div>' : '') + '</div>';
    return '<div class="ex long"><div class="keep">' + top + '</div><div class="keep">' + bottom + '</div></div>';
  }


  return L.join([
    B.chapter({
      num: 10, id: 'area', title: 'Area',
      intro: B.p('Area tells you how much flat surface a part covers. You use it to order plate and sheet, to work out how much coating a floor needs, and to lay out the sheet metal for a duct or a tank. This chapter builds the area formulas one shape at a time, then breaks composite parts into pieces and unfolds solids into flat nets.'),
      objectives: ['Explain what area is and use square units', 'Find the area of rectangles, triangles, parallelograms and trapezoids', 'Find the area of circles and rings with π × r²', 'Change mm² to m² and in² to ft²', 'Break a composite shape into basic shapes', 'Unfold a solid into a net and find its surface area'],
      words: ['area', 'square unit', 'base and height', 'composite shape', 'surface area', 'net'],
      art: G.row(G.lPlate(800, 600, 250, 200, { hole: 100, max: '2.2in', ph: 100 }), G.box(600, 400, 300, { max: '1.9in', ph: 90 }), G.boxNet(600, 400, 300, { max: '1.6in', ph: 125 }))
    }),

    B.section('Area and square units'),
    B.p(B.term('Area', 'The amount of flat surface inside a shape, measured in square units.') + ' is the amount of flat surface inside a shape. A length is measured in one direction. Area covers two directions at once, so it is measured with squares.',
      'A ' + B.term('square unit', 'A square that is 1 unit long on each side, such as 1 mm², 1 m², 1 in² or 1 ft². Area is counted in square units.') + ' is a square that is 1 unit long on each side. A square 1 cm on each side has an area of 1 square centimetre, written 1 cm². The small 2 shows that two lengths were multiplied: centimetres times centimetres.',
      'The square units used in this book are mm², cm² and m² (square millimetres, square centimetres and square metres), and in² and ft² (square inches and square feet). A length in mm and an area in mm² measure different things, so always write the small 2 on an area.'),
    B.figure(gridFig(8, 5, [[1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3]], { unitCell: [7, 4], max: '2.6in' }), 'A plate drawn on a 1 cm grid covers 3 rows of 6 squares, so its area is 18 cm². The gold square is 1 cm².'),
    B.tryIt([
      { q: 'A plate on a 1 cm grid covers 4 rows of 7 squares. What is its area?', a: '28 cm²' },
      { q: 'How do you say 35 m² out loud?', a: 'Thirty-five square metres' },
      { q: 'Which is an area: 12 ft, 12 ft² or 12 ft³?', a: '12 ft²' },
      { q: 'A floor is covered by 30 tiles. Each tile is exactly 1 ft². What is the area of the floor?', a: '30 ft²' }
    ]),

    B.section('Rectangles and squares'),
    B.p('A rectangle that is 6 squares long and 3 squares wide holds 3 rows of 6 squares. Multiplying the length by the width counts them all at once, so you do not need a grid.'),
    B.formula('Area of a rectangle and a square', ['A = l × w', 'A = s × s = s²'], 'A = area, l = length, w = width, s = side of a square. Both lengths must be in the same unit.'),
    B.p('Square millimetres make big numbers, and a large area is easier to read in square metres. One metre is 1,000 mm, so a square metre is 1,000 mm by 1,000 mm. In the same way, a square foot is 12 in by 12 in.'),
    B.figure(unitSquares(), '1 m² = 1,000 mm × 1,000 mm = 1,000,000 mm². 1 ft² = 12 in × 12 in = 144 in².'),
    exL({
      title: 'Area of a base plate',
      q: 'A machine base plate is ' + mmA(plate.l) + ' long and ' + mmA(plate.w) + ' wide. Find its area in mm² and in m².',
      fig: G.rect(plate.l, plate.w, { max: '1.9in' }),
      steps: ['A = l × w = ' + n(plate.l) + ' × ' + n(plate.w) + ' = ' + n(plateA) + ' mm².', 'To change mm² to m², divide by 1,000,000: ' + n(plateA) + ' ÷ 1,000,000 = 0.27 m².', 'Check: in metres the plate is 0.6 m by 0.45 m, and 0.6 × 0.45 = 0.27 m².'],
      calc: { rows: [{ label: 'Area in mm²', seq: plate.l + ' × ' + plate.w + ' =', expect: n(plateA) }, { label: 'mm² to m²', seq: plateA + ' ÷ 1000000 =', expect: '0.27' }] },
      answer: n(plateA) + ' mm² = 0.27 m²'
    }),
    B.check('0.6 × 0.45 =', '0.27'),
    B.watch('Divide by 1,000,000, not by 1,000', 'Changing mm to m divides a length by 1,000. An area has two lengths multiplied, so the factor is used twice: 1,000 × 1,000 = 1,000,000. Dividing ' + n(plateA) + ' mm² by 1,000 gives 270, far too big for this plate in m².'),
    B.p('The same idea works in imperial units. A sheet 4 ft by 8 ft has an area of 4 × 8 = 32 ft². In inches it is 48 in by 96 in, and 48 × 96 = 4,608 in². The check 32 × 144 = 4,608 shows the two answers agree.' + B.check('48 × 96 =', '4,608') + B.check('32 × 144 =', '4,608')),
    exL({
      title: 'Coating a shop floor',
      q: 'A shop floor is 6 m by 4.5 m. The coating label says one litre covers ' + cover + ' m². The coating is sold in 1 L tins. How many tins do you buy?',
      steps: ['Area: 6 × 4.5 = ' + n(floorA) + ' m².', 'Litres: ' + n(floorA) + ' ÷ ' + cover + ' = ' + n(litres) + ' L.', 'A part tin still has to be bought, so round up.'],
      calc: { seq: '6 × 4.5 ÷ ' + cover + ' =', expect: n(litres) },
      answer: Math.ceil(litres) + ' tins'
    }),
    B.tryIt([
      { q: 'A plate is 750 mm by 400 mm. Find its area in mm².', a: n(750 * 400) + ' mm²' },
      { q: 'A square cover plate has 250 mm sides. Find its area.', a: n(250 * 250) + ' mm²' },
      { q: 'A table top is 3 ft by 5 ft. Find its area in ft² and in in².', a: '15 ft² = ' + n(15 * 144) + ' in²' },
      { q: 'A floor is 8 m by 5 m. One litre of coating covers 6 m². How many 1 L tins?', a: Math.ceil(40 / 6) + ' tins (40 ÷ 6 = ' + n(r2(40 / 6), 2) + ' L)' }
    ]),

    B.section('Triangles'),
    B.p('Every triangle is half of a rectangle or of a parallelogram. To use that idea you need two measurements, the base and the height.',
      'The ' + B.term('base', 'The side of a shape that a height is measured from. Any side can be used as the base.') + ' is the side you measure from, usually the bottom side. The ' + B.term('height', 'The distance from the base to the opposite corner or side, measured at right angles (90°) to the base.') + ' is the distance from the base to the opposite corner, measured at right angles to the base. The height is not a sloping side.'),
    B.figure(triFamily(), 'Left: a rectangle cut on its diagonal makes two equal triangles. Right: three triangles with the same base b and the same height h have the same area.'),
    B.formula('Area of a triangle', ['A = b × h ÷ 2'], 'b = base, h = height at right angles to the base.'),
    exL({
      title: 'A triangular end panel',
      q: 'The end panel of a trough is a triangle with a base of ' + mmA(endP.b) + ' and a height of ' + mmA(endP.h) + '. Its two sloping sides are each 500 mm long. Find the area in mm² and in m².',
      fig: SH('isosceles-triangle', endP, { allAngles: true, derived: 'show', width: '2in' }),
      steps: ['Use the base and the height. The 500 mm sloping sides are not needed.', 'A = ' + endP.b + ' × ' + endP.h + ' ÷ 2 = ' + n(endA) + ' mm².', 'In m²: ' + n(endA) + ' ÷ 1,000,000 = ' + n(endA / 1e6) + ' m².'],
      calc: { seq: endP.b + ' × ' + endP.h + ' ÷ 2 =', expect: n(endA) },
      answer: n(endA) + ' mm² = ' + n(endA / 1e6) + ' m²'
    }),
    B.watch('The sloping side is not the height', 'Using the 500 mm side in the example above would give 600 × 500 ÷ 2 = 150,000 mm², which is too big. The height always meets the base at a right angle. A drawing often shows it as a dashed line with a small square at its foot.'),
    B.tryIt([
      { q: 'A right-angled gusset: base 300 mm, height 200 mm. Area?', a: n(gusA) + ' mm²' },
      { q: 'Base 18 in, height 10.5 in. Area?', a: n(18 * 10.5 / 2) + ' in²' },
      { q: 'Base 1.2 m, height 0.9 m. Area?', a: n(r2(1.2 * 0.9 / 2), 2) + ' m²' },
      { q: 'Base 300 mm, sloping sides 250 mm, height 200 mm. Area?', a: n(300 * 200 / 2) + ' mm²' }
    ]),

    B.section('Parallelograms and trapezoids'),
    B.p('A parallelogram has two pairs of parallel sides. Cut the triangle off one end and move it to the other end: the parallelogram becomes a rectangle with the same base and the same height. So its area is base times height: <b>A = b × h</b>, where h is the height at right angles to the base, not the slanted side.'),
    B.figure(paraMove(), 'The gold triangle moves from the left end to the right end. The parallelogram and the rectangle have the same area.'),
    B.p('A trapezoid has one pair of parallel sides, called a and b. Two copies of the same trapezoid, one turned around, fit together to make a parallelogram with base a + b. One trapezoid is half of it.'),
    B.figure(trapDouble(), 'A trapezoid and a turned copy make a parallelogram with base a + b and the same height.'),
    B.formula('Area of a trapezoid', ['A = (a + b) ÷ 2 × h'], 'a and b = the two parallel sides, h = the height between them. (a + b) ÷ 2 is the average width.'),
    exL({
      title: 'A hopper side panel',
      q: 'A hopper side panel is a trapezoid. The parallel sides are ' + mmA(trap.a) + ' and ' + mmA(trap.b) + ', and the height between them is ' + mmA(trap.h) + '. Find the area in mm² and m².',
      fig: SH('trapezoid', trap, { width: '2in' }), breakable: true,
      steps: ['A = (a + b) ÷ 2 × h.', 'Brackets first: ' + n(trap.a) + ' + ' + n(trap.b) + ' = ' + n(trap.a + trap.b) + '.', 'Average width: ' + n(trap.a + trap.b) + ' ÷ 2 = ' + n((trap.a + trap.b) / 2) + '.', 'Times the height: ' + n((trap.a + trap.b) / 2) + ' × ' + trap.h + ' = ' + n(trapA) + ' mm² = ' + n(trapA / 1e6) + ' m².'],
      calc: { seq: '( ' + trap.a + ' + ' + trap.b + ' ) ÷ 2 × ' + trap.h + ' =', expect: n(trapA), say: 'The brackets make both calculators add the parallel sides before dividing.' },
      answer: n(trapA) + ' mm² = ' + n(trapA / 1e6) + ' m²'
    }),
    B.sub('The quadrilateral family'),
    B.p('A ' + B.term('quadrilateral', 'Any flat shape with four straight sides, such as a square, rectangle, parallelogram, rhombus, trapezoid or kite.') + ' is any flat shape with four straight sides. The shapes in this chapter belong to one family. A square is a rectangle with four equal sides, and it is also a rhombus with four right angles. Rectangles and rhombuses are special parallelograms. The table lists what each member has, and the area formula to use.'),
    quadTable(),
    B.p('A rhombus and a kite can also be found from their two ' + B.term('diagonals', 'The straight lines joining opposite corners of a shape with four sides.') + ', the lines joining opposite corners. The diagonals cross at right angles, so the shape is exactly half of the rectangle that is d₁ long and d₂ wide: <b>A = d₁ × d₂ ÷ 2</b>. A kite-shaped gusset with diagonals of 600 mm and 400 mm has an area of 600 × 400 ÷ 2 = 120,000 mm².' + B.check('600 × 400 ÷ 2 =', '120,000')),
    B.tryIt([
      { q: 'Parallelogram: base 500 mm, slanted side 340 mm, height 300 mm. Area?', a: n(parA) + ' mm²' },
      { q: 'Parallelogram: base 30 in, slanted side 15 in, height 12 in. Area?', a: n(30 * 12) + ' in²' },
      { q: 'Trapezoid: parallel sides 300 mm and 500 mm, height 200 mm. Area?', a: n((300 + 500) / 2 * 200) + ' mm²' },
      { q: 'Trapezoid: parallel sides 14 in and 22 in, height 9 in. Area?', a: n((14 + 22) / 2 * 9) + ' in²' }
    ]),

    B.section('Circles and rings'),
    B.p('The area of a circle uses the ' + B.term('radius') + ', the distance from the centre to the edge. The radius is half the ' + B.term('diameter') + '.',
      'Picture the circle inside a square. The square is 2 r on each side, so it holds 4 small squares that are r by r. The circle covers a bit more than 3 of those small squares: exactly ' + B.term('pi', null, 'π') + ' of them, and π is about 3.14.'),
    B.figure(circleSquare(), 'The gold square is r × r = r². The circle covers π of these squares.', { width: '1.7in' }),
    B.formula('Area of a circle', ['A = π × r²'], 'r = radius. Square the radius first (exponents come before multiplying in BEDMAS), then multiply by π. Use the π key for the full value.'),
    exL({
      title: 'A round blank',
      q: 'A round blank is cut with a radius of ' + mmA(disc.r) + '. Find its area to two decimal places.',
      steps: ['A = π × r².', 'Square the radius: ' + disc.r + '² = ' + disc.r + ' × ' + disc.r + ' = ' + n(disc.r * disc.r) + '.', 'Multiply by π: π × ' + n(disc.r * disc.r) + ' = ' + n2(discA) + '.'],
      calc: { seq: 'π × ' + disc.r + ' x² =', expect: n2(discA), say: 'Both calculators square 150 before multiplying by π, because they follow BEDMAS.' },
      answer: n2(discA) + ' mm²'
    }),
    B.watch('Halve the diameter first', 'A round cover for an opening ' + cov + ' in across has r = ' + cov / 2 + ' in, so its area is π × ' + cov / 2 + '² = ' + n2(covA) + ' in². Putting the diameter into the formula gives π × 18² = ' + n2(PI * 324) + ' in², four times too big. When a drawing gives Ø (diameter), divide by 2 before you square.' + B.check('π × 9 x² =', n2(covA)) + B.check('π × 18 x² =', n2(PI * 324))),
    B.p('A half circle has half the area of the full circle, and a quarter circle has a quarter. A ring, such as a washer, a flange or the end of a pipe, is a big circle with a small circle taken out. Find the area of the outside circle (radius R) and subtract the area of the hole (radius r).'),
    B.formula('Area of a ring', ['A = π × R² − π × r² = π × (R² − r²)'], 'R = outside radius, r = inside radius. Square each radius before subtracting.'),
    exL({
      title: 'A flange ring',
      q: 'A flat flange ring has an outside diameter of ' + mmA(2 * ring.R) + ' and an inside diameter of ' + mmA(2 * ring.r) + '. Find its area to two decimal places.',
      fig: G.ring(ring.R, ring.r, { max: '1.7in' }),
      steps: ['Halve the diameters: R = ' + ring.R + ' mm and r = ' + ring.r + ' mm.', 'Square each one: ' + ring.R + '² = ' + n(ring.R * ring.R) + ' and ' + ring.r + '² = ' + n(ring.r * ring.r) + '.', 'Subtract: ' + n(ring.R * ring.R) + ' − ' + n(ring.r * ring.r) + ' = ' + n(ring.R * ring.R - ring.r * ring.r) + '.', 'Multiply by π: π × ' + n(ring.R * ring.R - ring.r * ring.r) + ' = ' + n2(ringA) + '.'],
      calc: { seq: 'π × ( ' + ring.R + ' x² − ' + ring.r + ' x² ) =', expect: n2(ringA) },
      answer: n2(ringA) + ' mm²'
    }),
    B.watch('Square each radius, then subtract', 'Subtracting the radii first, ' + ring.R + ' − ' + ring.r + ' = ' + (ring.R - ring.r) + ', and then squaring gives π × ' + (ring.R - ring.r) + '² = ' + n2(ringWrong) + ' mm². That is the area of a small circle, not the ring.' + B.check('π × 50 x² =', n2(ringWrong))),
    B.tryIt([
      { q: 'Circle, radius 80 mm. Area to two decimal places?', a: n2(PI * 6400) + ' mm²' },
      { q: 'Half circle, radius 200 mm. Area to two decimal places?', a: n2(semiA) + ' mm²' },
      { q: 'Washer: outside diameter 40 mm, inside diameter 22 mm. Area to two decimal places?', a: n2(PI * (400 - 121)) + ' mm²' },
      { q: 'Tube end: outside diameter 60 mm, wall 5 mm thick. Area of metal to two decimal places?', a: n2(PI * (900 - 625)) + ' mm² (R = 30, r = 25)' }
    ]),

    B.section('Composite shapes'),
    B.p('A ' + B.term('composite shape', 'A shape made of two or more basic shapes, such as rectangles, triangles and circles.') + ' is made of two or more basic shapes: an L-shaped bracket, a plate with a hole, a lug with a round end. The Shape Canvas calls the method <b>break it down</b>.'),
    B.how(['Split the shape with dashed lines into basic shapes. Label them A, B, C.', 'Find any missing dimensions from the overall dimensions.', 'Find the area of each piece.', 'Add the pieces. Subtract any hole or cut-out.']),
    exL({
      title: 'An L-shaped plate',
      q: 'Find the area of the L-shaped plate.',
      fig: G.lPlate(800, 600, 250, 200, { max: '2.4in' }),
      steps: ['Split on the dashed line into A (the upright) and B (the foot).', 'A: 250 × 600 = ' + n(lA) + ' mm².', 'B is 800 − 250 = 550 mm long: 550 × 200 = ' + n(lB) + ' mm².', 'Add: ' + n(lA) + ' + ' + n(lB) + ' = ' + n(lTot) + ' mm².'],
      calc: { seq: '250 × 600 + 550 × 200 =', expect: n(lTot) },
      answer: n(lTot) + ' mm²'
    }),
    B.tip('Two ways, one answer', 'The L is also an 800 × 600 rectangle with a 550 × 400 corner missing. 800 × 600 − 550 × 400 = ' + n(lAlt) + ' mm², the same answer. When two methods agree, you can trust the answer.' + B.check('800 × 600 − 550 × 400 =', n(lAlt))),
    exL({
      title: 'A lifting lug',
      q: 'A lifting lug is a 120 mm by 150 mm rectangle with a half circle on top. A 30 mm diameter hole is centred where the half circle meets the rectangle. Find the area of the lug to two decimal places.',
      fig: G.lug(120, 150, 30, { max: '2.6in', ph: 115 }), breakable: true,
      steps: ['A: 120 × 150 = ' + n(lugA) + ' mm².', 'B: the half circle is 120 mm across, so r = 60 mm. π × 60² ÷ 2 = ' + n2(lugB) + ' mm².', 'C: r = 15 mm. π × 15² = ' + n2(lugC) + ' mm².', 'A + B − C = ' + n2(lugT) + ' mm².'],
      calc: { seq: '120 × 150 + π × 60 x² ÷ 2 − π × 15 x² =', expect: n2(lugT) },
      answer: n2(lugT) + ' mm²'
    }),
    B.tryIt([
      { q: 'A 500 mm by 300 mm rectangle with a 200 mm by 100 mm corner cut away. Area?', a: n(500 * 300 - 200 * 100) + ' mm²' },
      { q: 'A 400 mm by 300 mm plate with a 160 mm diameter hole in the middle. Area to two decimal places?', a: n2(hpNet) + ' mm²' },
      { q: 'A 300 mm by 200 mm plate with four 20 mm diameter holes. Area to two decimal places?', a: n2(bpT) + ' mm²' },
      { q: 'A 700 mm by 400 mm plate with a 200 mm by 150 mm notch cut out of one edge. Area?', a: n(nT) + ' mm²' }
    ]),

    B.section('Surface area and nets'),
    B.p('A solid, such as a box or a tank, is covered by faces. Its ' + B.term('surface area', 'The total area of all the outside faces of a solid. Find it by adding the areas of the faces in its net.') + ' is the total area of all its outside faces. Surface area tells you how much sheet a tank needs, or how much area there is to paint.',
      'A ' + B.term('net', 'A flat pattern that folds or rolls up to make a solid. Each face of the solid is one piece of the net.') + ' is a flat pattern that folds or rolls up to make the solid. The Shape Canvas calls this <b>unfold it</b>. Unfold the solid, find the area of each piece of the net, and add them.'),
    B.figure(G.row(G.box(box.l, box.w, box.h, { max: '2.3in' }), G.boxNet(box.l, box.w, box.h, { max: '2.2in', ph: 170 })), 'A closed box and its net. Opposite faces are the same size, so the net has three pairs of rectangles. Dashed lines are folds.'),
    exL({
      title: 'Surface area of a closed box',
      q: 'A closed box is ' + mmA(box.l) + ' long, ' + mmA(box.w) + ' wide and ' + mmA(box.h) + ' high. Find its surface area in mm² and m².',
      steps: ['Top and bottom: 2 × ' + box.l + ' × ' + box.w + ' = ' + n(2 * box.l * box.w) + ' mm².', 'Front and back: 2 × ' + box.l + ' × ' + box.h + ' = ' + n(2 * box.l * box.h) + ' mm².', 'Two ends: 2 × ' + box.w + ' × ' + box.h + ' = ' + n(2 * box.w * box.h) + ' mm².', 'Add the three pairs: ' + n(2 * box.l * box.w) + ' + ' + n(2 * box.l * box.h) + ' + ' + n(2 * box.w * box.h) + ' = ' + n(boxSA) + ' mm².', 'In m²: ' + n(boxSA) + ' ÷ 1,000,000 = ' + n(boxSA / 1e6) + ' m².'],
      calc: { seq: '2 × ( ' + box.l + ' × ' + box.w + ' + ' + box.l + ' × ' + box.h + ' + ' + box.w + ' × ' + box.h + ' ) =', expect: n(boxSA) },
      answer: n(boxSA) + ' mm² = ' + n(boxSA / 1e6) + ' m²'
    }),
    B.p('A cylinder unrolls into two circles and one rectangle. The rectangle wraps around the circle, so its length is the distance around the circle, π × D. This length is the ' + B.term('stretch-out') + '. The width of the rectangle is the height of the cylinder.'),
    B.figure(G.row(G.cyl(cyl.r, cyl.h, { lab: 'D', max: '1.4in', ph: 96 }), G.cylNet(cyl.r, cyl.h, { circ: 'D', max: '2.4in', ph: 128 })), 'A closed cylinder and its net. The circles are 600 mm across, and the stretch-out is π × 600 = ' + n2(PI * 600) + ' mm.' + B.check('π × 600 =', n2(PI * 600))),
    B.formula('Surface area of a closed cylinder', ['Two ends: 2 × (π × r²)', 'Side: π × D × h', 'SA = two ends + side'], 'r = radius, D = diameter, h = height. The side is the stretch-out π × D times the height.'),
    exL({
      title: 'Sheet for a cylinder tank',
      q: 'A closed cylindrical tank has a radius of ' + mmA(cyl.r) + ' and a height of ' + mmA(cyl.h) + '. Find its surface area to two decimal places in mm², then in m².',
      steps: ['Two ends: π × ' + cyl.r + '² = ' + n2(cylEnds / 2) + ' mm² each, so ' + n2(cylEnds) + ' mm² for both.', 'Side: D = 2 × ' + cyl.r + ' = ' + 2 * cyl.r + ' mm, and π × ' + 2 * cyl.r + ' × ' + n(cyl.h) + ' = ' + n2(cylSide) + ' mm².', 'Total: ' + n2(cylEnds) + ' + ' + n2(cylSide) + ' = ' + n2(cylSA) + ' mm².', 'In m²: ' + n2(cylSA) + ' ÷ 1,000,000 = ' + n2(cylSA / 1e6) + ' m² to two decimal places.'],
      calc: { rows: [{ label: 'Two ends', seq: 'π × ' + cyl.r + ' x² × 2 =', expect: n2(cylEnds) }, { label: 'Side', seq: 'π × ' + 2 * cyl.r + ' × ' + cyl.h + ' =', expect: n2(cylSide) }] },
      answer: n2(cylSA) + ' mm², about ' + n2(cylSA / 1e6) + ' m²'
    }),
    B.check('π × ' + cyl.r + ' x² × 2 + π × ' + 2 * cyl.r + ' × ' + cyl.h + ' =', n2(cylSA)),
    exL({
      title: 'Sheet for a duct',
      q: 'A rectangular duct is ' + duct.a + ' in by ' + duct.b + ' in and ' + duct.len + ' in long, open at both ends. Its net is one long rectangle: the four sides side by side. Ignore seams. Find the area of sheet in in² and in ft² to two decimal places.',
      fig: G.ductNet(duct.a, duct.b, duct.len, { max: '1.9in', ph: 110 }), breakable: true,
      steps: ['The width of the net is the ' + B.term('perimeter') + ' of the duct: ' + duct.a + ' + ' + duct.b + ' + ' + duct.a + ' + ' + duct.b + ' = ' + ductP + ' in.', 'Area: ' + ductP + ' × ' + duct.len + ' = ' + n(ductA) + ' in².', 'In ft²: ' + n(ductA) + ' ÷ 144 = ' + n2(ductA / 144) + ' ft².'],
      calc: { seq: '2 × ( ' + duct.a + ' + ' + duct.b + ' ) × ' + duct.len + ' ÷ 144 =', expect: n2(ductA / 144) },
      answer: n(ductA) + ' in² = ' + n2(ductA / 144) + ' ft²'
    }),
    B.tryIt([
      { q: 'Closed box 500 mm by 400 mm by 200 mm. Surface area in mm²?', a: n(2 * (500 * 400 + 500 * 200 + 400 * 200)) + ' mm²' },
      { q: 'Open-top box 400 mm by 300 mm by 250 mm (no lid). Surface area in mm²?', a: n(400 * 300 + 2 * 400 * 250 + 2 * 300 * 250) + ' mm²' },
      { q: 'Duct 10 in by 6 in, 72 in long, open ends. Sheet area in ft² to two decimal places?', a: n2(2 * 16 * 72 / 144) + ' ft² (' + n(2 * 16 * 72) + ' in²)' },
      { q: 'Closed cylinder, radius 100 mm, height 400 mm. Surface area to two decimal places?', a: n2(PI * 10000 * 2 + PI * 200 * 400) + ' mm²' }
    ]),

    B.section('Materials takeoff'),
    B.p('A ' + B.term('takeoff', 'A list of the materials a job needs, worked out from the drawings: how many sheets, boxes, cans or pieces to buy, and what they cost.') + ' is the list of materials a job needs, worked out from the drawings. Area is the first step for drywall, sheathing, flooring, tile, paint and roofing. Sheets, boxes and cans are sold in whole units, so the count is always rounded up. A result of 3.1 sheets means you buy 4.',
      'Sheet sizes, the area a box or can covers, the waste allowance and the price come from the job: the drawings, the product label and the supplier. In this section they are given in each problem.'),
    B.how(['Find the whole area of the wall, floor, ceiling or roof.', 'Subtract the openings (doors and windows) that the material does not cover.', 'If a waste allowance is given, add it: area × (1 + waste % ÷ 100).', 'Divide by the area that one unit covers.', 'Round up to the next whole unit, then multiply by the price for the cost.']),
    B.formula('Materials takeoff', ['Units = area ÷ coverage of one unit, rounded up', 'Area with waste = area × (1 + waste % ÷ 100)', 'Cost = units × price of one unit'], 'Coverage is the area one sheet, box or can covers. A 10% waste allowance multiplies the area by 1.10. Two coats of paint double the area.'),
    exL({
      title: 'Drywall for a wall with openings',
      q: 'A wall is ' + dw.W + ' m long and ' + dw.H + ' m high. It has a door ' + dw.door[0] + ' m by ' + dw.door[1] + ' m and a window ' + dw.win[0] + ' m by ' + dw.win[1] + ' m. Drywall comes in 1.2 m by 2.4 m sheets at ' + money(dw.price) + ' each. How many sheets do you buy, and what do they cost?',
      fig: G.wallElev(dw.W, dw.H, [{ x: 0.6, y: 0, w: dw.door[0], h: dw.door[1], name: 'door' }, { x: 3.6, y: 0.9, w: dw.win[0], h: dw.win[1], name: 'window' }], { max: '2.6in', ph: 80 }), breakable: true,
      steps: ['Wall: ' + dw.W + ' × ' + dw.H + ' = ' + n(dw.W * dw.H, 1) + ' m².', 'Openings: ' + dw.door[0] + ' × ' + dw.door[1] + ' = ' + n(dw.door[0] * dw.door[1], 2) + ' m² and ' + dw.win[0] + ' × ' + dw.win[1] + ' = ' + n(dw.win[0] * dw.win[1], 1) + ' m².', 'Net area: ' + n(dw.W * dw.H, 1) + ' − ' + n(dw.door[0] * dw.door[1], 2) + ' − ' + n(dw.win[0] * dw.win[1], 1) + ' = ' + n(dwNet, 2) + ' m².', 'One sheet covers 1.2 × 2.4 = 2.88 m². ' + n(dwNet, 2) + ' ÷ 2.88 = ' + n2(dwS) + ', so buy ' + dwN + ' sheets.', 'Cost: ' + dwN + ' × ' + money(dw.price) + ' = ' + money(dwN * dw.price) + '.'],
      calc: { rows: [{ label: 'Sheets', seq: '( ' + dw.W + ' × ' + dw.H + ' − ' + dw.door[0] + ' × ' + dw.door[1] + ' − ' + dw.win[0] + ' × ' + dw.win[1] + ' ) ÷ 2.88 =', expect: n2(dwS) }, { label: 'Cost', seq: dwN + ' × 18.50 =', expect: n(dwN * dw.price, 2) }] },
      answer: dwN + ' sheets, ' + money(dwN * dw.price)
    }),
    B.p('The thickness of the board is a code question, not a math question. BCBC 2024 Sentence 9.29.5.3.(1) says the spacing of supports for single-layer gypsum board must conform to Table 9.29.5.3. (<span style="white-space:nowrap">page 9-275</span>). For walls, the table allows 12.7 mm board on studs up to 600 mm o.c., whether the board runs parallel or perpendicular to the studs. 9.5 mm board on walls is listed only perpendicular to the framing, with supports up to 400 mm o.c.'),
    PL.figure(B, '9.29.5.3', { crop: [40, 150, 960, 395], width: '6.5in', caption: 'Read across a row: the board thickness, the way the board runs to the framing, then the largest spacing of supports for walls and ceilings.' }),
    exL({
      title: 'Wall sheathing in feet',
      q: 'An exterior wall is ' + sh.W + ' ft long and ' + sh.H + ' ft high. The plan subtracts two windows, each ' + sh.win[0] + ' ft by ' + sh.win[1] + ' ft, and a door 3 ft by 6 ft 8 in. Sheathing comes in 4 ft by 8 ft sheets at ' + money(sh.price) + '. How many sheets, and what is the cost?',
      fig: G.wallElev(sh.W, sh.H, [{ x: 4, y: 3.5, w: 4, h: 3, name: 'window', key: 'windows 4 ft × 3 ft' }, { x: 16, y: 0, w: 3, h: 80 / 12, name: 'door', key: 'door 3 ft × 6 ft 8 in' }, { x: 26, y: 3.5, w: 4, h: 3, name: 'window', key: '' }], { unit: 'ft', max: '2.7in', ph: 70 }), breakable: true,
      steps: ['Wall: ' + sh.W + ' × ' + sh.H + ' = ' + n(sh.W * sh.H) + ' ft².', 'Windows: 2 × ' + sh.win[0] + ' × ' + sh.win[1] + ' = ' + n(sh.nWin * sh.win[0] * sh.win[1]) + ' ft². Door: 6 ft 8 in = 80 in, and 80 ÷ 12 = 6⅔ ft, so 3 × 6⅔ = ' + n(sh.doorA) + ' ft².', 'Net area: ' + n(sh.W * sh.H) + ' − ' + n(sh.nWin * sh.win[0] * sh.win[1]) + ' − ' + n(sh.doorA) + ' = ' + n(shNet) + ' ft².', 'One sheet covers 4 × 8 = 32 ft². ' + n(shNet) + ' ÷ 32 = ' + n(shS) + ', so buy ' + shN + ' sheets.', 'Cost: ' + shN + ' × ' + money(sh.price) + ' = ' + money(shN * sh.price) + '.'],
      calc: { rows: [{ label: 'Net area, ft²', seq: sh.W + ' × ' + sh.H + ' − 2 × 4 × 3 − 3 × 80 ÷ 12 =', expect: n(shNet) }, { label: 'Sheets', seq: shNet + ' ÷ 32 =', expect: n(shS) }, { label: 'Cost', seq: shN + ' × ' + sh.price + ' =', expect: n(shN * sh.price, 2) }] },
      answer: shN + ' sheets, ' + money(shN * sh.price)
    }),
    exL({
      title: 'Floor tile with a waste allowance',
      q: 'A kitchen floor is ' + tl.l + ' m by ' + tl.w + ' m. The tiles are 300 mm by 300 mm, 12 to a box, at ' + money(tl.price) + ' a box. The plan allows ' + tl.waste + '% for cuts and breakage. How many boxes, and what is the cost?',
      steps: ['Floor: ' + tl.l + ' × ' + tl.w + ' = ' + n(tlA, 2) + ' m².', 'Add ' + tl.waste + '%: ' + n(tlA, 2) + ' × 1.10 = ' + n(L.round(tlW, 3), 3) + ' m².', 'One box covers 12 × 0.3 × 0.3 = ' + n(tl.perBox, 2) + ' m².', n(L.round(tlW, 3), 3) + ' ÷ ' + n(tl.perBox, 2) + ' = ' + n(L.round(tlB, 2), 1) + ', so buy ' + tlN + ' boxes.', 'Cost: ' + tlN + ' × ' + money(tl.price) + ' = ' + money(tlN * tl.price) + '.'],
      calc: { seq: tl.l + ' × ' + tl.w + ' × 1.10 ÷ 1.08 =', expect: n(L.round(tlB, 1), 1) },
      answer: tlN + ' boxes, ' + money(tlN * tl.price)
    }),
    B.watch('Add the waste before you round', 'Work out the area with waste first, then divide and round up once at the end. Rounding the area or the box count early can leave you a box short.'),
    exL({
      title: 'Paint for a room, two coats',
      q: 'A room is ' + pt.l + ' m by ' + pt.w + ' m and the walls are ' + pt.h + ' m high. Leave out a door ' + pt.door[0] + ' m by ' + pt.door[1] + ' m and a window ' + pt.win[0] + ' m by ' + pt.win[1] + ' m. The walls get two coats. The label says one 3.78 L can covers ' + pt.can + ' m². Cans are ' + money(pt.price) + '. How many cans, and what is the cost?',
      steps: ['The walls unfold into one long rectangle. Its length is the perimeter of the room: 2 × (' + pt.l + ' + ' + pt.w + ') = ' + n(2 * (pt.l + pt.w), 1) + ' m.', 'Wall area: ' + n(2 * (pt.l + pt.w), 1) + ' × ' + pt.h + ' = ' + n(ptWall, 2) + ' m².', 'Less the openings: ' + n(ptWall, 2) + ' − ' + n(pt.door[0] * pt.door[1], 2) + ' − ' + n(pt.win[0] * pt.win[1], 1) + ' = ' + n(ptNet, 2) + ' m².', 'Two coats: ' + n(ptNet, 2) + ' × 2 = ' + n(ptNet * 2, 1) + ' m². ' + n(ptNet * 2, 1) + ' ÷ ' + pt.can + ' = ' + n2(ptC) + ', so buy ' + ptN + ' cans.', 'Cost: ' + ptN + ' × ' + money(pt.price) + ' = ' + money(ptN * pt.price) + '.'],
      calc: { seq: '( 2 × ( ' + pt.l + ' + ' + pt.w + ' ) × ' + pt.h + ' − ' + pt.door[0] + ' × ' + pt.door[1] + ' − ' + pt.win[0] + ' × ' + pt.win[1] + ' ) × 2 ÷ ' + pt.can + ' =', expect: n2(ptC) },
      answer: ptN + ' cans, ' + money(ptN * pt.price)
    }),
    exL({
      title: 'Sheathing a gable roof',
      q: 'A gable roof has two equal sides. Each side measures ' + rf.L + ' m along the ridge and ' + rf.s + ' m down the slope from the ridge to the eave. Roof sheathing comes in 1.22 m by 2.44 m sheets at ' + money(rf.price) + '. Allow ' + rf.waste + '% waste. How many sheets, and what is the cost?',
      fig: G.gableRoof(rf.L, rf.s, { max: '2.5in', ph: 88 }), breakable: true,
      steps: ['Use the slope length, not the level width of the building: the sheathing lies on the slope.', 'Two sides: 2 × ' + rf.L + ' × ' + rf.s + ' = ' + n(rfA, 2) + ' m².', 'Add ' + rf.waste + '%: ' + n(rfA, 2) + ' × 1.05 = ' + n(L.round(rfW, 3), 3) + ' m².', 'One sheet covers 1.22 × 2.44 = ' + n(L.round(rf.sheet, 4), 4) + ' m². ' + n(L.round(rfW, 3), 3) + ' ÷ ' + n(L.round(rf.sheet, 4), 4) + ' = ' + n2(rfS) + ', so buy ' + rfN + ' sheets.', 'Cost: ' + rfN + ' × ' + money(rf.price) + ' = ' + money(rfN * rf.price) + '.', 'The thickness comes from the code. For roofs not used as a walking deck, Sentence 9.23.16.7.(2) points to Table 9.23.16.7.-A (<span style="white-space:nowrap">page 9-226</span>). With rafters at 600 mm o.c., plywood needs at least 9.5 mm with the edges supported, or 12.5 mm with the edges unsupported.'],
      calc: { rows: [{ label: 'Sheets', seq: '2 × ' + rf.L + ' × ' + rf.s + ' × 1.05 ÷ ( 1.22 × 2.44 ) =', expect: n2(rfS) }, { label: 'Cost', seq: rfN + ' × ' + rf.price + ' =', expect: n(rfN * rf.price, 2) }] },
      answer: rfN + ' sheets, ' + money(rfN * rf.price)
    }),
    B.tryIt([
      { q: 'A wall 4.8 m by 2.4 m has one door 0.9 m by 2.1 m. How many 1.2 m by 2.4 m drywall sheets?', a: up((4.8 * 2.4 - 0.9 * 2.1) / 2.88) + ' sheets (' + n2((4.8 * 2.4 - 0.9 * 2.1) / 2.88) + ', round up)' },
      { q: 'A subfloor is 7.2 m by 4.8 m. Sheets are 1.22 m by 2.44 m. Allow 5% waste. How many sheets?', a: up(7.2 * 4.8 * 1.05 / (1.22 * 2.44)) + ' sheets (' + n2(7.2 * 4.8 * 1.05 / (1.22 * 2.44)) + ')' },
      { q: 'Laminate flooring for a room 5.4 m by 3.9 m, 8% waste. One box covers 2.2 m² and costs $38.50. Boxes and cost?', a: up(5.4 * 3.9 * 1.08 / 2.2) + ' boxes, ' + money(up(5.4 * 3.9 * 1.08 / 2.2) * 38.5) + ' (' + n2(5.4 * 3.9 * 1.08 / 2.2) + ' boxes before rounding)' },
      { q: 'A ceiling 5 m by 4 m gets two coats. One can covers 35 m². How many cans?', a: up(40 / 35) + ' cans (40 ÷ 35 = ' + n2(40 / 35) + ')' },
      { q: 'A wall 20 ft by 8 ft has a window 5 ft by 4 ft. How many 4 ft by 8 ft sheets?', a: up((160 - 20) / 32) + ' sheets (140 ÷ 32 = ' + n((160 - 20) / 32) + ')' }
    ]),

    B.worksheet({ title: 'Find the area', sub: 'Practice mode: one drawing hides a dimension behind a red ?', intro: 'Show the formula, the numbers you put into it and the answer with its square unit.' }),
    B.grid2(
      B.prob({ q: 'Find the area in mm² and in m².', canvas: G.rect(w1.l, w1.w, { max: '2.1in', ph: 62 }), a: n(w1A) + ' mm² = ' + n(w1A / 1e6) + ' m²', lines: 2 }),
      B.prob({ q: 'Find the area in in² and in ft².', canvas: G.para(w3.b, w3.h, w3.s, { unit: 'in', max: '2.4in', ph: 62 }), a: n(w3A) + ' in² = ' + n(w3A / 144) + ' ft²', lines: 2 })
    ),
    B.grid2(
      B.prob({ q: 'Find the area of the trapezoid.', canvas: SH('trapezoid', w4, { width: '1.45in', k: 1.7 }), a: n(w4A) + ' mm²', lines: 2 }),
      B.prob({ q: 'The triangle has an area of ' + n(w8A) + ' mm². Find the hidden height.', canvas: SH('right-triangle', w8, { width: '1.1in', k: 1.9, hide: ['h'] }), a: n(w8.h) + ' mm', work: n(w8A) + ' × 2 ÷ ' + w8.b + ' = ' + w8.h, lines: 2 })
    ),
    B.grid2(
      B.prob({ q: 'Find the area of the disc to the nearest mm².', canvas: G.circ(w5.r, { max: '1.9in', ph: 66 }), a: n0(w5A) + ' mm²', lines: 2 }),
      B.prob({ q: 'Find the area of the washer to two decimal places.', canvas: G.ring(w6.R, w6.r, { lab: 'r', max: '2.1in', ph: 66 }), a: n2(w6A) + ' mm²', work: 'π × (90² − 60²) = π × 4,500', lines: 2 })
    ),

    B.worksheet({ title: 'Break it down', sub: 'Split each part into basic shapes A, B, C', intro: 'Find any ? first. Then find the area of each piece and add, or subtract a hole. Give answers to two decimal places where π is used.' }),
    B.grid2(
      B.prob({ q: 'Find the hidden height of B, then the area of the T-plate.', canvas: G.tPlate(600, 600, 150, 200), a: 'B is 450 mm high. Area = ' + n(tA) + ' + ' + n(tB) + ' = ' + n(tT) + ' mm²', lines: 3 }),
      B.prob({ q: 'Find the hidden width, then the area of the U-shaped plate.', canvas: G.uPlate(900, 500, 150, 150), a: 'Hidden width 600 mm. Area = ' + n(uA) + ' + ' + n(uA) + ' + ' + n(uC) + ' = ' + n(uT) + ' mm²', lines: 3 })
    ),
    B.grid2(
      B.prob({ q: 'Find the area of the gusset in in², then in ft² to two decimal places.', canvas: G.gusset(24, 10, 6), a: n(gT) + ' in² = ' + n2(gFt) + ' ft²', work: '240 + 72 = 312 in², 312 ÷ 144', lines: 3 }),
      B.prob({ q: 'Find the area of the slotted plate. B and C are half circles.', canvas: G.slotPlate(500, 100), a: n2(slT) + ' mm²', work: 'A = 500 × 200, B + C = one full circle, π × 100²', lines: 3 })
    ),

    B.worksheet({ title: 'Unfold it', sub: 'Solids and their nets', intro: 'Find the area of each piece of the net, then add. Give answers to two decimal places where π is used.' }),
    B.grid2(
      B.prob({ q: 'This is the net of a closed box. Find the surface area of the box in mm² and in m².', canvas: G.boxNet(pr.l, pr.w, pr.h, { max: '2.3in', ph: 118 }), a: n(prSA) + ' mm² = ' + n(prSA / 1e6) + ' m²', lines: 3 }),
      B.prob({ q: 'Change one value: a disc has a radius of 100 mm. The radius is doubled to 200 mm. Find both areas to two decimal places. How many times bigger is the new area?', canvas: G.row(G.circ(100, { max: '1in', ph: 36 }), G.circ(200, { max: '1.3in', ph: 72 })), a: n2(c100) + ' mm² and ' + n2(c200) + ' mm². The new area is ' + n(c200 / c100) + ' times bigger (2 × 2).', lines: 3 })
    ),
    B.grid2(
      B.prob({ q: 'This is the net of a closed cylinder with radius 200 mm and height 600 mm. Find the hidden stretch-out to two decimal places, then the surface area.', canvas: G.cylNet(cy2.r, cy2.h, { circ: 'r', ask: ['S'], max: '2.9in', ph: 128 }), a: 'Stretch-out π × 400 = ' + n2(cy2S) + ' mm. SA = ' + n2(cy2SA) + ' mm²', work: 'Ends π × 200² × 2, side π × 400 × 600', lines: 3 }),
      B.prob({ q: 'The duct is 16 in by 10 in and open at both ends. Find the hidden width of its net, then the sheet area in ft² to two decimal places.', canvas: G.ductNet(16, 10, 48, { askTop: true, max: '2in' }), a: '52 in across. ' + n(d2A) + ' in² = ' + n2(d2A / 144) + ' ft²', lines: 3 })
    ),

    B.worksheet({ title: 'Materials takeoff', sub: 'Area, openings, waste, whole units and cost', intro: 'Sheet sizes, coverage, waste and prices are given in each problem. Show the net area, the units before rounding, the whole units you buy and the cost.' }),
    B.grid2(
      B.prob({ q: 'Drywall sheets are 1.2 m by 2.4 m. How many sheets cover the wall?', canvas: G.wallElev(5.4, 2.4, [{ x: 3.4, y: 0.9, w: 1.2, h: 1.2, name: 'window' }], { max: '2.5in', ph: 66 }), a: '11.52 ÷ 2.88 = ' + n(k1) + ' exactly, so ' + up(k1) + ' sheets', work: '5.4 × 2.4 − 1.2 × 1.2 = 11.52 m², 11.52 ÷ 2.88' + B.check('( 5.4 × 2.4 − 1.2 × 1.2 ) ÷ 2.88 =', n(k1)), lines: 3 }),
      B.prob({ q: 'The wall has no openings and took exactly 5 sheets of 1.2 m by 2.4 m drywall. Find the hidden length.', canvas: G.wallElev(k2L, 2.4, [], { ask: ['W'], max: '2.5in', ph: 66 }), a: n(k2L) + ' m', work: '5 × 2.88 = 14.4 m², 14.4 ÷ 2.4' + B.check('5 × 2.88 ÷ 2.4 =', n(k2L)), lines: 3 })
    ),
    B.grid2(
      B.prob({ q: 'Tile the L-shaped floor. Allow 10% waste. A box covers 1.08 m² and costs $42.00. How many boxes, and what is the cost?', canvas: G.lPlate(4800, 3600, 2400, 1800, { max: '2.3in', ph: 80 }), a: n(k3A, 2) + ' m², ' + n2(k3B) + ' boxes, so ' + up(k3B) + ' boxes, ' + money(up(k3B) * 42), work: '2,400 × 3,600 + 2,400 × 1,800 mm² = 12.96 m², × 1.10 ÷ 1.08' + B.check('12.96 × 1.10 ÷ 1.08 =', n2(k3B)), lines: 3 }),
      B.prob({ q: 'Shingle both sides of the roof. One bundle covers 3.1 m² and costs $36.00. How many bundles, and what is the cost?', canvas: G.gableRoof(10, 4.5, { max: '2.4in', ph: 80 }), a: n(k4A) + ' m², ' + n2(k4B) + ' bundles, so ' + up(k4B) + ' bundles, ' + money(up(k4B) * 36), work: '2 × 10 × 4.5 = 90 m², 90 ÷ 3.1' + B.check('2 × 10 × 4.5 ÷ 3.1 =', n2(k4B)), lines: 3 })
    ),
    B.grid2(
      B.prob({ q: 'Sheathing comes in 4 ft by 8 ft sheets at $27.40. How many sheets, and what is the cost?', canvas: G.wallElev(24, 8, [{ x: 9, y: 3, w: 6, h: 4, name: 'window' }], { unit: 'ft', max: '2.5in', ph: 66 }), a: n(k5) + ' sheets, so ' + up(k5) + ' sheets, ' + money(up(k5) * 27.4), work: '24 × 8 − 6 × 4 = 168 ft², 168 ÷ 32' + B.check('( 24 × 8 − 6 × 4 ) ÷ 32 =', n(k5)), lines: 3 }),
      B.prob({ q: 'The wall gets two coats of paint. One litre covers 9 m², and paint is sold in 1 L tins. How many tins?', canvas: G.wallElev(4, 2.6, [{ x: 1.5, y: 0, w: 0.9, h: 2, name: 'door' }], { max: '2.3in', ph: 70 }), a: n2(k6) + ' L, so ' + up(k6) + ' tins', work: '4 × 2.6 − 0.9 × 2 = 8.6 m², × 2 coats = 17.2 m², ÷ 9' + B.check('( 4 × 2.6 − 0.9 × 2 ) × 2 ÷ 9 =', n2(k6)), lines: 3 })
    )
  ]);
};
