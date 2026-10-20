/* Drawing kit for Chapters 10 and 11 (Area, Volume and Capacity), textbook and exercise files.
   Usage: const G = require('../engine/figs-ch10.js')(B, L).
   Every drawing here is laid out in print pixels (96 per inch) at the size it prints, so the label font FS = 10 px
   prints at 7.5 pt. Dimensions sit outside the parts. Radii are labelled "r = ...", diameters "Ø ...". */
module.exports = function (B, L) {
  const F = require('./figs.js');
  const C = F.C;
  const n = L.num;
  const FS = 10, TS = 15;
  const COS = Math.cos(Math.PI / 6);

  /* cross-check a value against the Shapes engine calculation */
  function xc(id, p, key, v) {
    const it = B.shapeCalc(id, p, 'mm').items.find(i => i.key === key);
    if (!it || Math.abs(it.value - v) > 1e-6 * Math.max(1, Math.abs(v))) throw new Error('cross-check ' + id + ' ' + key + ': ' + v + ' vs ' + (it && it.value));
    return v;
  }
  /* Shapes engine drawing with each label chip and its text scaled about the chip centre by k */
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
  const pair = (a, b, wa, wb) => '<div style="display:flex;justify-content:center;align-items:center;gap:14pt"><div style="width:' + (wa || '46%') + '">' + a + '</div><div style="width:' + (wb || '46%') + '">' + b + '</div></div>';
  const row = (...svgs) => '<div style="display:flex;justify-content:center;align-items:center;gap:14pt;flex-wrap:wrap">' + svgs.join('') + '</div>';

  /* ---------- frames in print pixels ---------- */
  const inch = s => parseFloat(s || '2.6in') * 96;
  /* 2D frame: real extents w by h (y up). o.max: widest the drawing may print, o.ph: tallest drawing area (px),
     o.pad: [left, top, right, bottom] in px. The svg prints at its natural size, so 1 svg px = 1 print px. */
  function frame(w, h, o) {
    o = o || {};
    const pad = o.pad || [54, 26, 54, 34], maxPx = inch(o.max);
    const pw = maxPx - pad[0] - pad[2], ph = o.ph || 150;
    const S = Math.min(pw / w, ph / h);
    const P = (x, y) => [pad[0] + x * S, pad[1] + (h - y) * S];
    const W = pad[0] + w * S + pad[2], H = pad[1] + h * S + pad[3];
    return { P, S, W, H, out: body => F.svg(W, H, body, { max: (W / 96).toFixed(2) + 'in' }) };
  }
  /* isometric frame around a set of 3D points (x along, y across, z up). P3 maps a point to print px */
  const q0 = p => [(p[0] - p[1]) * COS, (p[0] + p[1]) * 0.5 - p[2]];
  function isoFrame(pts, o) {
    o = o || {};
    const pad = o.pad || [50, 24, 50, 30], maxPx = inch(o.max);
    const qs = pts.map(q0);
    const x0 = Math.min(...qs.map(v => v[0])), x1 = Math.max(...qs.map(v => v[0])), y0 = Math.min(...qs.map(v => v[1])), y1 = Math.max(...qs.map(v => v[1]));
    const S = Math.min((maxPx - pad[0] - pad[2]) / (x1 - x0), (o.ph || 140) / (y1 - y0));
    const P3 = p => { const v = q0(p); return [pad[0] + (v[0] - x0) * S, pad[1] + (v[1] - y0) * S]; };
    const W = pad[0] + (x1 - x0) * S + pad[2], H = pad[1] + (y1 - y0) * S + pad[3];
    const cs = pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length, a[2] + p[2] / pts.length], [0, 0, 0]);
    return { P3, S, W, H, centre: P3(cs), out: body => F.svg(W, H, body, { max: (W / 96).toFixed(2) + 'in' }) };
  }

  /* ---------- labels ---------- */
  const u = (v, unit) => n(v) + ' ' + (unit || 'mm');
  /* a dimension. On an upright dimension the label chip sits across the line, so the line is pushed out far enough
     that the chip clears the shape edge */
  const D = (a, b, lab, off, ask) => {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    if (Math.abs(dy) > 2 * Math.abs(dx)) {
      const need = 0.3 * FS * String(ask ? '?' : lab).length + 10;
      if (Math.abs(off) < need) off = (off < 0 ? -1 : 1) * need;
    }
    return F.dim(a[0], a[1], b[0], b[1], ask ? '?' : lab, off, { ask: !!ask, s: FS });
  };
  /* dimension offset to the side away from point c */
  function Dout(a, b, lab, dist, c, ask) {
    const dx = b[0] - a[0], dy = b[1] - a[1], Lg = Math.hypot(dx, dy), nx = -dy / Lg, ny = dx / Lg;
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const s = ((m[0] + nx - c[0]) ** 2 + (m[1] + ny - c[1]) ** 2) > ((m[0] - nx - c[0]) ** 2 + (m[1] - ny - c[1]) ** 2) ? 1 : -1;
    return D(a, b, lab, s * dist, ask);
  }
  const split = (a, b) => F.line(a[0], a[1], b[0], b[1], { c: C.dim, w: 1.4, dash: '6 4' });
  const tag = (p, s) => F.t(p[0], p[1] + 5.5, s, { s: TS, b: true, c: C.edge });
  const hole = (p, rpx) => F.circle(p[0], p[1], rpx, { fill: '#FFFFFF', w: 2 });
  const note = (p, s, o) => F.t(p[0], p[1], s, Object.assign({ s: FS, c: C.dim }, o || {}));
  const call = (p, b, s) => F.callout(p[0], p[1], b[0], b[1], s, { s: FS });
  const ask = (o, k) => !!(o && o.ask && o.ask.includes(k));
  const lab = (o, k, v, unit) => ask(o, k) ? '?' : u(v, unit);

  /* ---------- polyhedra in isometric view ---------- */
  function newell(P) { let x = 0, y = 0, z = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; x += (a[1] - b[1]) * (a[2] + b[2]); y += (a[2] - b[2]) * (a[0] + b[0]); z += (a[0] - b[0]) * (a[1] + b[1]); } return [x, y, z]; }
  /* faces: [{pts, fill}] of a convex solid. Hidden edges dashed, visible faces filled */
  function poly3(f, faces) {
    const all = faces.flatMap(fc => fc.pts), cg = all.reduce((a, p) => [a[0] + p[0] / all.length, a[1] + p[1] / all.length, a[2] + p[2] / all.length], [0, 0, 0]);
    const info = faces.map(fc => {
      let nv = newell(fc.pts);
      const fcen = fc.pts.reduce((a, p) => [a[0] + p[0] / fc.pts.length, a[1] + p[1] / fc.pts.length, a[2] + p[2] / fc.pts.length], [0, 0, 0]);
      if (nv[0] * (fcen[0] - cg[0]) + nv[1] * (fcen[1] - cg[1]) + nv[2] * (fcen[2] - cg[2]) < 0) nv = nv.map(v => -v);
      return { fc, vis: nv[0] + nv[1] + nv[2] > 1e-9, nz: nv[2] / Math.hypot(...nv), nx: nv[0] / Math.hypot(...nv) };
    });
    let h = '';
    const key = (a, b) => { const s1 = a.join(','), s2 = b.join(','); return s1 < s2 ? s1 + '|' + s2 : s2 + '|' + s1; };
    const visE = new Set();
    info.filter(i => i.vis).forEach(i => { const p = i.fc.pts; for (let k = 0; k < p.length; k++) visE.add(key(p[k], p[(k + 1) % p.length])); });
    info.filter(i => i.vis).forEach(i => { h += F.poly(i.fc.pts.map(f.P3), { fill: i.fc.fill || (i.nz > 0.5 ? C.fill2 : i.nx > 0.5 ? C.gold : C.fill), w: 2 }); });
    const done = new Set();
    info.filter(i => !i.vis).forEach(i => { const p = i.fc.pts; for (let k = 0; k < p.length; k++) { const a = p[k], b = p[(k + 1) % p.length], kk = key(a, b); if (visE.has(kk) || done.has(kk)) continue; done.add(kk); const A = f.P3(a), Bp = f.P3(b); h += F.line(A[0], A[1], Bp[0], Bp[1], { c: '#DD6673', w: 1.2, dash: '5 4' }); } });
    return h;
  }
  /* closed box l by w by h. o.ask: 'l','w','h'. o.unit */
  function box(l, w, hh, o) {
    o = o || {};
    const V = [[0, 0, 0], [l, 0, 0], [l, w, 0], [0, w, 0], [0, 0, hh], [l, 0, hh], [l, w, hh], [0, w, hh]];
    const f = isoFrame(V, { max: o.max || '2.2in', ph: o.ph || 110, pad: o.pad || (o.edge ? [12, 10, 12, 26] : [44, 18, 74, 36]) });
    const fc = ids => ({ pts: ids.map(i => V[i]) });
    let h = poly3(f, [fc([0, 1, 2, 3]), fc([4, 5, 6, 7]), fc([0, 1, 5, 4]), fc([1, 2, 6, 5]), fc([2, 3, 7, 6]), fc([3, 0, 4, 7])]);
    const P = f.P3, c = f.centre;
    if (o.edge) return f.out(h + F.label(P(V[2])[0], P(V[2])[1] + 16, o.edge, { s: FS }));
    h += Dout(P(V[3]), P(V[2]), lab(o, 'l', l, o.unit), 18, c, ask(o, 'l'));
    h += o.wTop ? Dout(P(V[7]), P(V[4]), lab(o, 'w', w, o.unit), 16, c, ask(o, 'w')) : Dout(P(V[2]), P(V[1]), lab(o, 'w', w, o.unit), 18, c, ask(o, 'w'));
    h += Dout(P(V[1]), P(V[5]), lab(o, 'h', hh, o.unit), 34, c, ask(o, 'h'));
    return f.out(h);
  }
  /* net of a closed box: column back, top, front, bottom with the two ends on the sides of the top */
  function boxNet(l, w, hh, o) {
    o = o || {};
    const W = l + 2 * hh, Ht = 2 * hh + 2 * w;
    const f = frame(W, Ht, { max: o.max || '2.2in', ph: o.ph || 170, pad: [12, 30, 64, 30] }), P = f.P;
    const R = (x, y, ww, hh2) => F.poly([P(x, y), P(x + ww, y), P(x + ww, y + hh2), P(x, y + hh2)], { fill: C.fill, w: 2 });
    let h = R(hh, Ht - hh, l, hh) + R(hh, Ht - hh - w, l, w) + R(hh, Ht - 2 * hh - w, l, hh) + R(hh, 0, l, w) + R(0, Ht - hh - w, hh, w) + R(hh + l, Ht - hh - w, hh, w);
    [Ht - hh, Ht - hh - w, w].forEach(y => { h += split(P(hh, y), P(hh + l, y)); });
    h += split(P(hh, Ht - hh - w), P(hh, Ht - hh)) + split(P(hh + l, Ht - hh - w), P(hh + l, Ht - hh));
    h += D(P(hh, Ht), P(hh + l, Ht), lab(o, 'l', l, o.unit), -16, ask(o, 'l'));
    h += D(P(hh + l, Ht - hh), P(hh + l, Ht), lab(o, 'h', hh, o.unit), 18, ask(o, 'h'));
    h += D(P(hh + l, 0), P(hh + l, w), lab(o, 'w', w, o.unit), 18, ask(o, 'w'));
    return f.out(h);
  }
  /* cylinder seen from the front, radius r, height hh. o.lab: 'r' (radius callout) or 'D' (diameter dimension). o.ask */
  function cyl(r, hh, o) {
    o = o || {};
    const ry = r * 0.22;
    const f = frame(2 * r, hh + 2 * ry, { max: o.max || (o.lab === 'D' ? '1.5in' : '2in'), ph: o.ph || 130, pad: o.pad || [16, o.lab === 'D' ? 30 : 26, o.lab === 'D' ? 80 : 112, 16] }), P = f.P, S = f.S;
    const top = P(r, ry + hh), bot = P(r, ry), rx = r * S, rr = ry * S;
    let h = '<path d="M' + P(0, ry + hh).join(' ') + 'L' + P(0, ry).join(' ') + 'A' + rx + ' ' + rr + ' 0 0 0 ' + P(2 * r, ry).join(' ') + 'L' + P(2 * r, ry + hh).join(' ') + 'Z" fill="' + C.gold + '" stroke="' + C.edge + '" stroke-width="2"/>';
    h += '<path d="M' + P(0, ry).join(' ') + 'A' + rx + ' ' + rr + ' 0 0 1 ' + P(2 * r, ry).join(' ') + '" fill="none" stroke="#DD6673" stroke-width="1.2" stroke-dasharray="5 4"/>';
    h += '<ellipse cx="' + top[0] + '" cy="' + top[1] + '" rx="' + rx + '" ry="' + rr + '" fill="' + C.fill2 + '" stroke="' + C.edge + '" stroke-width="2"/>';
    if (o.lab === 'D') h += D(P(0, ry + hh), P(2 * r, ry + hh), ask(o, 'D') ? '?' : 'Ø' + u(2 * r, o.unit), -(rr + 12), ask(o, 'D'));
    else {
      h += F.circle(top[0], top[1], 2.4, { fill: C.red, c: C.red, w: 1 }) + F.line(top[0], top[1], top[0] + rx, top[1], { c: C.red, w: 1.6 });
      const t = ask(o, 'r') ? 'r = ?' : 'r = ' + u(r, o.unit);
      if (o.rBelow) h += F.label(bot[0], bot[1] + rr + 14, t, { s: FS });
      else h += call([top[0] + rx * 0.5, top[1]], [P(2 * r, 0)[0] + 58, top[1] - rr - 6], t);
    }
    if (!o.noH) h += D(P(2 * r, ry), P(2 * r, ry + hh), lab(o, 'h', hh, o.unit), 36, ask(o, 'h'));
    return f.out(h);
  }
  /* net of a closed cylinder: rectangle (stretch-out by height) with a circle above and below.
     o.circ: 'D' (diameter dimension on the top circle) or 'r' (radius callout). o.ask: 'S' stretch-out, 'h', 'c' circle */
  function cylNet(r, hh, o) {
    o = o || {};
    const Ls = Math.PI * 2 * r, Ht = hh + 4 * r, cx = Ls * 0.32;
    const f = frame(Ls, Ht, { max: o.max || (o.circ === 'r' ? '2.9in' : '2.3in'), ph: o.ph || 180, pad: [o.circ === 'r' ? 112 : 14, o.circ === 'D' ? 40 : 14, 62, 14] }), P = f.P, S = f.S;
    let h = F.poly([P(0, 2 * r), P(Ls, 2 * r), P(Ls, 2 * r + hh), P(0, 2 * r + hh)], { fill: C.fill, w: 2 });
    const ct = P(cx, 3 * r + hh), cb = P(cx, r);
    h += F.circle(ct[0], ct[1], r * S, { fill: C.fill }) + F.circle(cb[0], cb[1], r * S, { fill: C.fill });
    h += F.circle(ct[0], ct[1], 2.2, { fill: C.edge, c: C.edge, w: 1 }) + F.circle(cb[0], cb[1], 2.2, { fill: C.edge, c: C.edge, w: 1 });
    const cl = ask(o, 'c') ? '?' : null;
    if (o.circ === 'D') {
      h += F.line(ct[0] - r * S, ct[1], ct[0] + r * S, ct[1], { c: C.red, w: 1.3 });
      h += D([ct[0] - r * S, ct[1]], [ct[0] + r * S, ct[1]], cl || 'Ø' + u(2 * r, o.unit), -(r * S + 10), !!cl);
    } else if (o.circ === 'r') {
      [ct, cb].forEach(c => { h += F.line(c[0], c[1], c[0] - r * S * 0.71, c[1] - r * S * 0.71, { c: C.red, w: 1.5 }); });
      h += call([ct[0] - r * S * 0.4, ct[1] - r * S * 0.4], [56, ct[1] - 4], cl ? 'r = ?' : 'r = ' + u(r, o.unit));
      h += call([cb[0] - r * S * 0.4, cb[1] - r * S * 0.4], [56, cb[1] - 4], cl ? 'r = ?' : 'r = ' + u(r, o.unit));
    }
    h += D(P(0, 2 * r), P(Ls, 2 * r), ask(o, 'S') ? '?' : u(Math.round(Ls * 100) / 100, o.unit), -16, ask(o, 'S'));
    h += D(P(Ls, 2 * r), P(Ls, 2 * r + hh), lab(o, 'h', hh, o.unit), 18, ask(o, 'h'));
    return f.out(h);
  }
  /* triangular trough: a prism of length l, open side up, point down. end triangle base b, height hz */
  function trough(b, hz, l, o) {
    o = o || {};
    /* two views side by side: the end view (a triangle, point down) and the side view (a rectangle) */
    const gap = Math.max(b, l) * 0.28, Wt = b + gap + l;
    const f = frame(Wt, hz, { max: o.max || '3.2in', ph: o.ph || 80, pad: [50, 34, 12, 52] }), P = f.P;
    let h = F.poly([P(0, hz), P(b, hz), P(b / 2, 0)], { fill: C.gold });
    h += F.line(P(b / 2, hz)[0], P(b / 2, hz)[1], P(b / 2, 0)[0], P(b / 2, 0)[1], { c: C.red, w: 1.3, dash: '4 3' });
    h += D(P(0, hz), P(b, hz), lab(o, 'b', b, o.unit), -14, ask(o, 'b'));
    h += F.line(P(b / 2, 0)[0] - 4, P(b / 2, 0)[1], P(0, 0)[0] - 4, P(b / 2, 0)[1], { c: C.dim, w: 1 });
    h += D(P(0, 0), P(0, hz), lab(o, 'h', hz, o.unit), -16, ask(o, 'h'));
    h += note([P(b / 2, 0)[0], P(0, 0)[1] + 46], 'end view (open top)');
    const x2 = b + gap;
    h += F.poly([P(x2, 0), P(x2 + l, 0), P(x2 + l, hz), P(x2, hz)], { fill: C.fill });
    h += D(P(x2, 0), P(x2 + l, 0), lab(o, 'l', l, o.unit), 16, ask(o, 'l'));
    h += note([P(x2 + l / 2, 0)[0], P(0, 0)[1] + 46], 'side view');
    return f.out(h);
  }
  /* L-shaped end of an angle bar: legs a (upright) and b (flat), thickness t, split into A and B */
  function angleEnd(a, b, t, o) {
    o = o || {};
    const f = frame(b, a, { max: o.max || '2.5in', ph: o.ph || 130, pad: [56, 14, 110, 34] }), P = f.P;
    let h = F.poly([P(0, 0), P(b, 0), P(b, t), P(t, t), P(t, a), P(0, a)]);
    h += split(P(t, 0), P(t, t));
    h += D(P(0, 0), P(0, a), u(a), -22) + D(P(0, 0), P(b, 0), u(b), 18);
    const bx = P(b, 0)[0] + 56;
    h += call([P(t / 2, a * 0.8)[0], P(0, a * 0.8)[1]], [bx, P(0, a * 0.8)[1]], u(t) + ' thick');
    h += call([P(t / 2, a * 0.45)[0], P(0, a * 0.45)[1]], [bx, P(0, a * 0.45)[1]], 'A: upright');
    h += call([P((t + b) / 2, t / 2)[0], P(0, t / 2)[1]], [bx, P(0, a * 0.15)[1]], 'B: flat leg');
    return f.out(h);
  }
  /* tank with round ends seen from the side: body length l, radius r */
  function capsuleSide(r, l, o) {
    o = o || {};
    const w = l + 2 * r, H = 2 * r;
    const f = frame(w, H, { max: o.max || '2.6in', ph: o.ph || 90, pad: [14, 14, 14, 34] }), P = f.P, S = f.S;
    let h = '<path d="M' + P(r, 0).join(' ') + 'L' + P(r + l, 0).join(' ') + 'A' + r * S + ' ' + r * S + ' 0 0 0 ' + P(r + l, H).join(' ') + 'L' + P(r, H).join(' ') + 'A' + r * S + ' ' + r * S + ' 0 0 0 ' + P(r, 0).join(' ') + 'Z" fill="' + C.fill + '" stroke="' + C.edge + '" stroke-width="2"/>';
    h += split(P(r, 0), P(r, H)) + split(P(r + l, 0), P(r + l, H));
    h += tag(P(r * 0.5, r), 'B') + tag(P(r + l / 2, r + r * 0.35), 'A') + tag(P(r + l + r * 0.5, r), 'C');
    h += D(P(r, 0), P(r + l, 0), lab(o, 'l', l, o.unit), 18, ask(o, 'l'));
    const c0 = P(r, r);
    h += F.circle(c0[0], c0[1], 2.4, { fill: C.red, c: C.red, w: 1 }) + F.line(c0[0], c0[1], P(r + l * 0.4, r)[0], c0[1], { c: C.red, w: 1.6 });
    h += F.label(P(r + l * 0.2, r)[0], c0[1] + 16, ask(o, 'r') ? 'r = ?' : 'r = ' + u(r, o.unit), { s: FS });
    return f.out(h);
  }
  /* cone seen from the front: base radius r, height hc */
  function cone(r, hc, o) {
    o = o || {};
    const ry = r * 0.22;
    const f = frame(2 * r, hc + 2 * ry, { max: o.max || '1.7in', ph: o.ph || 120, pad: [14, 14, 88, 26] }), P = f.P, S = f.S;
    const b = P(r, ry), ap = P(r, ry + hc), rx = r * S, rr = ry * S;
    let h = '<path d="M' + P(0, ry).join(' ') + 'L' + ap.join(' ') + 'L' + P(2 * r, ry).join(' ') + 'A' + rx + ' ' + rr + ' 0 0 1 ' + P(0, ry).join(' ') + 'Z" fill="' + C.gold + '" stroke="' + C.edge + '" stroke-width="2"/>';
    h += '<path d="M' + P(0, ry).join(' ') + 'A' + rx + ' ' + rr + ' 0 0 1 ' + P(2 * r, ry).join(' ') + '" fill="none" stroke="#DD6673" stroke-width="1.2" stroke-dasharray="5 4"/>';
    h += F.line(ap[0], ap[1], b[0], b[1], { c: C.red, w: 1.3, dash: '4 3' }) + F.line(b[0], b[1], b[0] + rx, b[1], { c: C.red, w: 1.6 });
    h += F.line(ap[0] + 4, ap[1], P(2 * r, 0)[0] + 42, ap[1], { c: C.dim, w: 1 });
    h += D(P(2 * r, ry), [P(2 * r, ry)[0], ap[1]], lab(o, 'h', hc, o.unit), 36, ask(o, 'h'));
    h += F.label(b[0] + rx * 0.5, b[1] + rr + 14, ask(o, 'r') ? 'r = ?' : 'r = ' + u(r, o.unit), { s: FS });
    return f.out(h);
  }
  /* square pyramid in isometric view: base b, height hz */
  function pyramid(b, hz, o) {
    o = o || {};
    const V = [[0, 0, 0], [b, 0, 0], [b, b, 0], [0, b, 0]], Ap = [b / 2, b / 2, hz];
    const f = isoFrame(V.concat([Ap]), { max: o.max || '2.3in', ph: o.ph || 130, pad: [40, 16, 92, 34] });
    let h = poly3(f, [{ pts: V }, { pts: [V[0], V[1], Ap] }, { pts: [V[1], V[2], Ap] }, { pts: [V[2], V[3], Ap] }, { pts: [V[3], V[0], Ap] }]);
    const P = f.P3, c = f.centre, ap = P(Ap), bc = P([b / 2, b / 2, 0]);
    h += F.line(ap[0], ap[1], bc[0], bc[1], { c: C.red, w: 1.3, dash: '4 3' });
    h += call([ap[0], (ap[1] + bc[1]) / 2], [P(V[1])[0] + 18, ap[1] + 4], ask(o, 'h') ? 'height ?' : 'height ' + u(hz, o.unit));
    h += Dout(P(V[3]), P(V[2]), lab(o, 'b', b, o.unit), 16, c, ask(o, 'b')) + Dout(P(V[2]), P(V[1]), lab(o, 'b', b, o.unit), 16, c, ask(o, 'b'));
    return f.out(h);
  }
  /* sphere: radius r */
  function sphere(r, o) {
    o = o || {};
    const f = frame(2 * r, 2 * r, { max: o.max || '1.6in', ph: o.ph || 90, pad: o.pad || (o.rBelow ? [16, 8, 16, 26] : [10, 12, 70, 12]) }), P = f.P, S = f.S;
    const c = P(r, r), R = r * S;
    let h = F.circle(c[0], c[1], R, { fill: C.gold });
    h += '<path d="M' + (c[0] - R) + ' ' + c[1] + 'A' + R + ' ' + R * 0.25 + ' 0 0 0 ' + (c[0] + R) + ' ' + c[1] + '" fill="none" stroke="' + C.edge + '" stroke-width="1.2"/>';
    h += '<path d="M' + (c[0] - R) + ' ' + c[1] + 'A' + R + ' ' + R * 0.25 + ' 0 0 1 ' + (c[0] + R) + ' ' + c[1] + '" fill="none" stroke="#DD6673" stroke-width="1.1" stroke-dasharray="4 3"/>';
    h += F.circle(c[0], c[1], 2.4, { fill: C.red, c: C.red, w: 1 }) + F.line(c[0], c[1], c[0] + R * 0.71, c[1] - R * 0.71, { c: C.red, w: 1.6 });
    const t = ask(o, 'r') ? 'r = ?' : 'r = ' + u(r, o.unit);
    h += o.rBelow ? F.label(c[0], c[1] + R + 16, t, { s: FS }) : call([c[0] + R * 0.45, c[1] - R * 0.45], [c[0] + R + 34, c[1] - R * 0.75], t);
    return f.out(h);
  }
  /* ---------- flat shapes ---------- */
  function rect(l, w, o) {
    o = o || {};
    const f = frame(l, w, { max: o.max || '1.8in', ph: o.ph || 90, pad: o.pad || [12, 12, 62, 30] }), P = f.P;
    let h = F.poly([P(0, 0), P(l, 0), P(l, w), P(0, w)]);
    const show = k => !o.only || o.only.includes(k);
    if (show('l')) h += D(P(0, 0), P(l, 0), lab(o, 'l', l, o.unit), 16, ask(o, 'l'));
    if (show('w')) h += D(P(l, 0), P(l, w), lab(o, 'w', w, o.unit), 16, ask(o, 'w'));
    return f.out(h);
  }
  function para(b, hh, s, o) {
    o = o || {};
    const ox = Math.sqrt(s * s - hh * hh);
    const f = frame(b + ox, hh, { max: o.max || '2in', ph: o.ph || 90, pad: [56, 12, 14, 30] }), P = f.P;
    let h = F.poly([P(0, 0), P(b, 0), P(b + ox, hh), P(ox, hh)]);
    h += F.line(P(ox, hh)[0], P(ox, hh)[1], P(ox, 0)[0], P(ox, 0)[1], { c: C.red, w: 1.3, dash: '4 3' }) + F.rightMark(P(ox, 0), [1, 0], [0, -1], 7);
    h += ask(o, 'h') ? F.label(P(ox, hh / 2)[0] + 18, P(0, hh / 2)[1] + 5, '?', { ask: true, s: FS + 2 }) : F.label(P(ox, hh / 2)[0] + 6 + 0.28 * FS * lab(o, 'h', hh, o.unit).length + 4, P(0, hh / 2)[1] + 4, lab(o, 'h', hh, o.unit), { s: FS, c: C.red });
    h += D(P(0, 0), P(b, 0), lab(o, 'b', b, o.unit), 16, ask(o, 'b')) + D(P(0, 0), P(ox, hh), lab(o, 's', s, o.unit), -14, ask(o, 's'));
    return f.out(h);
  }
  /* circle with a radius callout (o.lab 'r') or a diameter dimension (o.lab 'D') */
  function circ(r, o) {
    o = o || {};
    const f = frame(2 * r, 2 * r, { max: o.max || '1.5in', ph: o.ph || 80, pad: [10, o.lab === 'D' ? 30 : 10, 70, 10] }), P = f.P, S = f.S;
    const c = P(r, r), R = r * S;
    let h = F.circle(c[0], c[1], R);
    if (o.lab === 'D') { h += F.line(c[0] - R, c[1], c[0] + R, c[1], { c: C.red, w: 1.4 }) + D([c[0] - R, c[1]], [c[0] + R, c[1]], ask(o, 'D') ? '?' : 'Ø' + u(2 * r, o.unit), -(R + 12), ask(o, 'D')); }
    else {
      h += F.circle(c[0], c[1], 2.4, { fill: C.red, c: C.red, w: 1 }) + F.line(c[0], c[1], c[0] + R * 0.71, c[1] - R * 0.71, { c: C.red, w: 1.6 });
      h += call([c[0] + R * 0.45, c[1] - R * 0.45], [c[0] + R + 34, c[1] - R * 0.8], ask(o, 'r') ? 'r = ?' : 'r = ' + u(r, o.unit));
    }
    return f.out(h);
  }
  /* trapezoid: bottom b, top a (centred), height hh. The height dimension runs outside the left side */
  function trap(a, b, hh, o) {
    o = o || {};
    const x0 = (b - a) / 2;
    const f = frame(b, hh, { max: o.max || '2.2in', ph: o.ph || 90, pad: [70, 30, 14, 30] }), P = f.P;
    let h = F.poly([P(0, 0), P(b, 0), P(x0 + a, hh), P(x0, hh)]);
    h += D(P(x0, hh), P(x0 + a, hh), lab(o, 'a', a, o.unit), -16, ask(o, 'a')) + D(P(0, 0), P(b, 0), lab(o, 'b', b, o.unit), 16, ask(o, 'b'));
    const xl = P(0, 0)[0];
    h += F.line(P(x0, hh)[0] - 4, P(x0, hh)[1], xl - 30, P(x0, hh)[1], { c: C.dim, w: 1 });
    h += D(P(0, 0), [xl, P(0, hh)[1]], lab(o, 'h', hh, o.unit), -22, ask(o, 'h'));
    return f.out(h);
  }
  /* ring: outside and inside diameters as dimensions, or radii as callouts (o.lab 'r') */
  function ring(R, r, o) {
    o = o || {};
    const f = frame(2 * R, 2 * R, { max: o.max || '1.6in', ph: o.ph || 90, pad: [10, 30, o.lab === 'r' ? 74 : 10, 10] }), P = f.P, S = f.S;
    const c = P(R, R);
    let h = '<path d="M' + (c[0] - R * S) + ' ' + c[1] + 'a' + R * S + ' ' + R * S + ' 0 1 0 ' + 2 * R * S + ' 0a' + R * S + ' ' + R * S + ' 0 1 0 ' + (-2 * R * S) + ' 0ZM' + (c[0] - r * S) + ' ' + c[1] + 'a' + r * S + ' ' + r * S + ' 0 1 1 ' + 2 * r * S + ' 0a' + r * S + ' ' + r * S + ' 0 1 1 ' + (-2 * r * S) + ' 0Z" fill="' + C.fill + '" fill-rule="evenodd" stroke="' + C.edge + '" stroke-width="2"/>';
    if (o.lab === 'r') {
      h += F.circle(c[0], c[1], 2.4, { fill: C.red, c: C.red, w: 1 }) + F.line(c[0], c[1], c[0] + R * S * 0.71, c[1] - R * S * 0.71, { c: C.red, w: 1.5 }) + F.line(c[0], c[1], c[0] + r * S * 0.71, c[1] + r * S * 0.71, { c: C.red, w: 1.5 });
      h += call([c[0] + R * S * 0.6, c[1] - R * S * 0.6], [c[0] + R * S + 38, c[1] - R * S * 0.7], 'R = ' + u(R, o.unit)) + call([c[0] + r * S * 0.5, c[1] + r * S * 0.5], [c[0] + R * S + 38, c[1] + R * S * 0.6], 'r = ' + u(r, o.unit));
      h = h.replace('pad', 'pad');
    } else {
      h += D([c[0] - R * S, c[1]], [c[0] + R * S, c[1]], 'Ø' + u(2 * R, o.unit), -(R * S + 12));
      h += F.line(c[0] - r * S, c[1], c[0] + r * S, c[1], { c: C.dim, w: 1.1 }) + F.arrowHead(c[0] - r * S, c[1], Math.PI) + F.arrowHead(c[0] + r * S, c[1], 0) + F.label(c[0], c[1] - 6, 'Ø' + u(2 * r, o.unit), { s: FS });
    }
    return f.out(h);
  }

  /* ---------- composite plates (print px) ---------- */
  /* L-shaped plate: overall W by H, upright leg width a, foot height b. o.ask: 'W','H','a','b','c'. o.hole: hole Ø at the upright */
  function lPlate(W, H, a, b, o) {
    o = o || {};
    const f = frame(W, H, { max: o.max || '2.4in', ph: o.ph || 120, pad: [58, 28, 62, 34] }), P = f.P;
    let h = F.poly([P(0, 0), P(W, 0), P(W, b), P(a, b), P(a, H), P(0, H)]);
    h += split(P(a, 0), P(a, b)) + tag(P(a / 2, o.hole ? b / 2 + (H - b) * 0.15 : H / 2), 'A') + tag(P((a + W) / 2, b / 2), 'B');
    if (o.hole) h += hole(P(a / 2, H - (H - b) * 0.32), o.hole / 2 * f.S);
    h += D(P(0, 0), P(W, 0), lab(o, 'W', W, o.unit), 18, ask(o, 'W'));
    h += D(P(0, 0), P(0, H), lab(o, 'H', H, o.unit), -22, ask(o, 'H'));
    h += D(P(0, H), P(a, H), lab(o, 'a', a, o.unit), -16, ask(o, 'a'));
    h += D(P(W, 0), P(W, b), lab(o, 'b', b, o.unit), 20, ask(o, 'b'));
    if (o.showC) h += D(P(a, b), P(W, b), lab(o, 'c', W - a, o.unit), -16, ask(o, 'c'));
    return f.out(h);
  }
  /* plate with a pointed end: rectangle Lr by H with a triangle of length t on the right */
  function arrowPlate(Lr, H, t, o) {
    o = o || {};
    const f = frame(Lr + t, H, { max: o.max || '2.5in', ph: o.ph || 100, pad: [56, 16, 16, 34] }), P = f.P;
    let h = F.poly([P(0, 0), P(Lr, 0), P(Lr + t, H / 2), P(Lr, H), P(0, H)]);
    h += split(P(Lr, 0), P(Lr, H)) + tag(P(Lr / 2, H / 2), 'A') + tag(P(Lr + t * 0.35, H / 2), 'B');
    h += D(P(0, 0), P(Lr, 0), u(Lr), 18) + D(P(Lr, 0), P(Lr + t, 0), u(t), 18, !!o.askT);
    h += D(P(0, 0), P(0, H), u(H), -22);
    return f.out(h);
  }
  /* lifting lug: rectangle w by hr with a half circle on top and a hole of diameter dh at the arc centre */
  function lug(w, hr, dh, o) {
    o = o || {};
    const r = w / 2;
    const f = frame(w, hr + r, { max: o.max || '2.6in', ph: o.ph || 150, pad: [58, 12, 120, 34] }), P = f.P, S = f.S;
    const q = P(w, hr), p0 = P(0, hr);
    let h = '<path d="M' + P(0, 0).join(' ') + 'L' + P(w, 0).join(' ') + 'L' + q.join(' ') + 'A' + r * S + ' ' + r * S + ' 0 0 0 ' + p0.join(' ') + 'Z" fill="' + C.fill + '" stroke="' + C.edge + '" stroke-width="2.25"/>';
    h += split(p0, q) + hole(P(r, hr), dh / 2 * S);
    h += tag(P(r, hr / 2), 'A') + tag(P(r, hr + r * 0.62), 'B');
    h += D(P(0, 0), P(w, 0), u(w), 18) + D(P(0, 0), P(0, hr), u(hr), -22);
    const bx = P(w, 0)[0] + 62;
    h += call(P(w * 0.8, hr / 2), [bx, P(0, hr / 2 - 25)[1]], 'A: rectangle');
    h += call(P(w * 0.82, hr + r * 0.45), [bx, P(0, hr + r * 0.75)[1]], 'B: half circle');
    h += call(P(r + dh * 0.36, hr - dh * 0.36), [bx, P(0, hr - dh - 14)[1] + 6], 'C: Ø' + dh + ' hole');
    return f.out(h);
  }
  /* side view of a hopper: cylinder diameter Dm, height hc, on a cone of height hk */
  function hopper(Dm, hc, hk, o) {
    o = o || {};
    const f = frame(Dm, hc + hk, { max: o.max || '2.3in', ph: o.ph || 150, pad: [86, 30, 62, 12] }), P = f.P;
    let h = F.poly([P(0, hk + hc), P(Dm, hk + hc), P(Dm, hk), P(0, hk)], { fill: C.fill });
    h += F.poly([P(0, hk), P(Dm, hk), P(Dm / 2, 0)], { fill: C.gold });
    h += split(P(0, hk), P(Dm, hk));
    h += F.line(P(Dm / 2, hk)[0], P(Dm / 2, hk)[1], P(Dm / 2, 0)[0], P(Dm / 2, 0)[1], { c: C.red, w: 1.3, dash: '4 3' });
    h += tag(P(Dm / 2, hk + hc / 2), 'A') + tag(P(Dm * 0.62, hk * 0.66), 'B');
    h += D(P(0, hk + hc), P(Dm, hk + hc), o.askD ? '?' : 'Ø' + u(Dm), -16, !!o.askD);
    h += D(P(Dm, hk), P(Dm, hk + hc), u(hc), 20);
    h += F.line(P(Dm / 2, 0)[0] + 4, P(Dm / 2, 0)[1], P(Dm, 0)[0] + 26, P(Dm / 2, 0)[1], { c: C.dim, w: 1 });
    h += D(P(Dm, 0), P(Dm, hk), u(hk), 20);
    h += call(P(Dm * 0.15, hk + hc * 0.75), [42, P(0, hk + hc * 0.75)[1]], 'A: cylinder');
    h += call(P(Dm * 0.36, hk * 0.5), [42, P(0, hk * 0.3)[1]], 'B: cone');
    return f.out(h);
  }
  /* a block of unit cubes nx by ny by nz in an isometric view (s = cube edge in px) */
  function cubes(nx, ny, nz, o) {
    o = o || {};
    const s = o.s || 30, a = s * COS, b = s * 0.5;
    const ox = 30 + ny * a, oy = 26 + nz * s;
    const Q = (x, y, z) => [ox + (x - y) * a, oy + (x + y) * b - z * s];
    let h = '';
    const face = (pts, fill) => { h += F.poly(pts, { fill, w: 1.3 }); };
    for (let x = 0; x < nx; x++) for (let y = 0; y < ny; y++) face([Q(x, y, nz), Q(x + 1, y, nz), Q(x + 1, y + 1, nz), Q(x, y + 1, nz)], C.fill2);
    for (let y = 0; y < ny; y++) for (let z = 0; z < nz; z++) face([Q(nx, y, z), Q(nx, y + 1, z), Q(nx, y + 1, z + 1), Q(nx, y, z + 1)], C.gold);
    for (let x = 0; x < nx; x++) for (let z = 0; z < nz; z++) face([Q(x, ny, z), Q(x + 1, ny, z), Q(x + 1, ny, z + 1), Q(x, ny, z + 1)], C.fill);
    if (o.dims) {
      h += F.dim(...Q(0, ny, 0), ...Q(nx, ny, 0), o.dims[0], 16, { s: FS }) + F.dim(...Q(nx, ny, 0), ...Q(nx, 0, 0), o.dims[1], 16, { s: FS }) + F.dim(...Q(nx, 0, 0), ...Q(nx, 0, nz), o.dims[2], 32, { s: FS });
    }
    if (o.label) h += F.label(Q(nx / 2, ny, nz / 2)[0], Q(nx / 2, ny, nz / 2)[1] + 6, o.label, { s: 14 });
    const W = ox + nx * a + (o.dims ? 66 : 46), H = oy + (nx + ny) * b + 36;
    return F.svg(W, H, h, { max: (W / 96).toFixed(2) + 'in' });
  }

  /* T-plate: top bar W by t, stem s wide, overall height H. The stem height is hidden */
  function tPlate(W, H, t, sw, o) {
    o = o || {};
    const x1 = (W - sw) / 2;
    const f = frame(W, H, { max: o.max || '2.6in', ph: o.ph || 150, pad: [56, 28, 76, 30] }), P = f.P;
    let h = F.poly([P(0, H), P(W, H), P(W, H - t), P(x1 + sw, H - t), P(x1 + sw, 0), P(x1, 0), P(x1, H - t), P(0, H - t)]);
    h += split(P(x1, H - t), P(x1 + sw, H - t)) + tag(P(W / 2, H - t / 2), 'A') + tag(P(W / 2, (H - t) / 2), 'B');
    h += D(P(0, H), P(W, H), u(W), -16) + D(P(0, H - t), P(0, H), u(t), -20) + D(P(x1, 0), P(x1 + sw, 0), u(sw), 18);
    h += D(P(x1, 0), P(x1, H - t), '?', -20, true);
    h += D(P(x1 + sw, 0), P(x1 + sw, H), u(H), (W - x1 - sw) * f.S + 22);
    return f.out(h);
  }
  /* U-plate: overall W by H, legs l wide, base bt high. The inside width is hidden */
  function uPlate(W, H, l, bt, o) {
    o = o || {};
    const f = frame(W, H, { max: o.max || '2.9in', ph: o.ph || 110, pad: [56, 50, 62, 30] }), P = f.P;
    let h = F.poly([P(0, 0), P(W, 0), P(W, H), P(W - l, H), P(W - l, bt), P(l, bt), P(l, H), P(0, H)]);
    h += split(P(l, 0), P(l, bt)) + split(P(W - l, 0), P(W - l, bt));
    h += tag(P(l / 2, H / 2), 'A') + tag(P(W - l / 2, H / 2), 'B') + tag(P(W / 2, bt / 2), 'C');
    h += D(P(0, 0), P(W, 0), u(W), 18) + D(P(0, 0), P(0, H), u(H), -22) + D(P(W, 0), P(W, bt), u(bt), 20);
    h += D(P(0, H), P(l, H), u(l), -14) + D(P(W - l, H), P(W, H), u(l), -14);
    h += D(P(l, H), P(W - l, H), '?', -38, true);
    return f.out(h);
  }
  /* gusset: rectangle W by hr (inches) with a triangle of height ht on top */
  function gusset(W, hr, ht, o) {
    o = o || {};
    const f = frame(W, hr + ht, { max: o.max || '2.5in', ph: o.ph || 120, pad: [52, 14, 20, 30] }), P = f.P;
    let h = F.poly([P(0, 0), P(W, 0), P(W, hr), P(W / 2, hr + ht), P(0, hr)]);
    h += split(P(0, hr), P(W, hr)) + tag(P(W / 2, hr / 2), 'A') + tag(P(W / 2 - W * 0.12, hr + ht / 3), 'B');
    h += F.line(P(W / 2, hr)[0], P(W / 2, hr)[1], P(W / 2, hr + ht)[0], P(W / 2, hr + ht)[1], { c: C.red, w: 1.3, dash: '4 3' }) + F.rightMark(P(W / 2, hr), [1, 0], [0, -1], 7);
    h += F.label(P(W / 2, hr + ht / 2)[0] + 22, P(0, hr + ht / 2)[1] + 6, u(ht, 'in'), { s: FS, c: C.red });
    h += D(P(0, 0), P(W, 0), u(W, 'in'), 18) + D(P(0, 0), P(0, hr), u(hr, 'in'), -22);
    return f.out(h);
  }
  /* slotted plate: straight length l, half circles of radius r on both ends */
  function slotPlate(l, r, o) {
    o = o || {};
    const w = l + 2 * r, H = 2 * r;
    const f = frame(w, H, { max: o.max || '2.9in', ph: o.ph || 80, pad: [12, 12, 12, 56] }), P = f.P, S = f.S;
    let h = '<path d="M' + P(r, 0).join(' ') + 'L' + P(r + l, 0).join(' ') + 'A' + r * S + ' ' + r * S + ' 0 0 0 ' + P(r + l, H).join(' ') + 'L' + P(r, H).join(' ') + 'A' + r * S + ' ' + r * S + ' 0 0 0 ' + P(r, 0).join(' ') + 'Z" fill="' + C.fill + '" stroke="' + C.edge + '" stroke-width="2.25"/>';
    h += split(P(r, 0), P(r, H)) + split(P(r + l, 0), P(r + l, H));
    h += tag(P(r * 0.5, r), 'B') + tag(P(r + l / 2, r), 'A') + tag(P(r + l + r * 0.5, r + r * 0.45), 'C');
    h += D(P(r, 0), P(r + l, 0), u(l), 18);
    const c0 = P(r + l, r), e = P(r + l + r * 0.71, r - r * 0.71);
    h += F.circle(c0[0], c0[1], 2.4, { fill: C.red, c: C.red, w: 1 }) + F.line(c0[0], c0[1], e[0], e[1], { c: C.red, w: 1.6 });
    h += call([(c0[0] + e[0]) / 2, (c0[1] + e[1]) / 2], [c0[0] + 4, P(0, 0)[1] + 40], 'r = ' + u(r));
    return f.out(h);
  }
  /* rectangular duct net: four panels a, b, a, b inches wide, len long, fold lines dashed */
  function ductNet(a, b, len, o) {
    o = o || {};
    const W = 2 * (a + b);
    const f = frame(W, len, { max: o.max || '1.9in', ph: o.ph || 130, pad: [44, 28, 12, 44] }), P = f.P;
    let h = F.poly([P(0, 0), P(W, 0), P(W, len), P(0, len)]);
    let x = 0;
    [a, b, a, b].forEach((w, i) => { if (i) h += split(P(x, 0), P(x, len)); h += F.label(P(x + w / 2, 0)[0], P(0, len * 0.12)[1], String(w), { s: FS }); x += w; });
    h += note([P(W / 2, 0)[0], P(0, 0)[1] + 16], 'panel widths in inches');
    h += D(P(0, 0), P(0, len), u(len, 'in'), -22);
    h += D(P(0, len), P(W, len), o.askTop ? '?' : u(W, 'in'), -14, !!o.askTop);
    return f.out(h);
  }
  /* ---------- materials takeoff drawings ---------- */
  /* size text for key k, or ? when o.ask holds k */
  const sz = (o, k, v, unit) => ask(o, k) ? '?' : u(v, unit)
  /* wall elevation W by H (real units, y up) with openings [{x, y, w, h, name}] measured from the bottom left corner.
     Each opening is white with its name inside. The opening sizes are written in a key line under the wall, so no
     label sits on an edge. o.unit, o.ask: ['W'] or ['H'] hides that overall size behind a red ? */
  function wallElev(W, H, ops, o) {
    o = o || {}
    ops = ops || []
    const unit = o.unit || 'm'
    const keyTxt = ops.map(op => op.key != null ? op.key : (op.name + ' ' + n(op.w) + ' ' + unit + ' × ' + n(op.h) + ' ' + unit)).filter(s => s).join(',  ')
    const f = frame(W, H, { max: o.max || '2.6in', ph: o.ph || 86, pad: o.pad || [16, 30, 62, ops.length ? 34 : 14] }), P = f.P
    let h = F.poly([P(0, 0), P(W, 0), P(W, H), P(0, H)], { fill: C.fill, w: 2 })
    ops.forEach(op => {
      h += F.poly([P(op.x, op.y), P(op.x + op.w, op.y), P(op.x + op.w, op.y + op.h), P(op.x, op.y + op.h)], { fill: C.white, w: 1.6 })
      const c = P(op.x + op.w / 2, op.y + op.h / 2)
      if (op.name.length * FS * 0.56 + 4 <= op.w * f.S) h += F.t(c[0], c[1] + 3.5, op.name, { s: FS, c: C.dim, wgt: 600 })
    })
    h += D(P(0, H), P(W, H), sz(o, 'W', W, unit), -16, ask(o, 'W'))
    h += D(P(W, 0), P(W, H), sz(o, 'H', H, unit), 18, ask(o, 'H'))
    if (ops.length) h += F.t(P(W / 2, 0)[0], P(0, 0)[1] + 20, keyTxt, { s: FS, c: C.ink, wgt: 500 })
    return f.out(h)
  }
  /* gable roof in isometric view: ridge length Lr, slope length s (eave to ridge) on each side. run is the level
     distance eave to ridge, used only to draw the pitch. o.unit, o.ask: ['L'] or ['s'] */
  function gableRoof(Lr, s, o) {
    o = o || {}
    const unit = o.unit || 'm'
    const run = o.run || s * 0.949, rise = Math.sqrt(Math.max(s * s - run * run, 0))
    const e1a = [0, 0, 0], e1b = [Lr, 0, 0], ra = [0, run, rise], rb = [Lr, run, rise], e2a = [0, 2 * run, 0], e2b = [Lr, 2 * run, 0]
    const f = isoFrame([e1a, e1b, ra, rb, e2a, e2b], { max: o.max || '2.5in', ph: o.ph || 90, pad: o.pad || [40, 22, 60, 36] })
    let h = poly3(f, [{ pts: [e1a, e1b, rb, ra], fill: C.fill }, { pts: [ra, rb, e2b, e2a], fill: C.fill2 }, { pts: [e1a, ra, e2a] }, { pts: [e1b, e2b, rb] }, { pts: [e1a, e2a, e2b, e1b] }])
    const P = f.P3, c = f.centre
    h += Dout(P(e1a), P(e1b), sz(o, 'L', Lr, unit), 18, c, ask(o, 'L'))
    h += Dout(P(e1b), P(rb), sz(o, 's', s, unit), 20, c, ask(o, 's'))
    const rl = P(ra)
    h += F.t(rl[0] - 5, rl[1] - 4, 'ridge', { s: FS, c: C.dim, wgt: 600, a: 'end' })
    return f.out(h)
  }
  /* small icons for the quadrilateral family table: square, rectangle, parallelogram, rhombus, trapezoid, kite.
     Equal sides carry the same number of tick marks. Drawn 56 by 36 px */
  function quadIcon(kind) {
    const pts = {
      square: [[14, 4], [44, 4], [44, 32], [14, 32]],
      rectangle: [[4, 7], [52, 7], [52, 30], [4, 30]],
      parallelogram: [[14, 6], [52, 6], [42, 30], [4, 30]],
      rhombus: [[29, 2], [50, 18], [29, 34], [8, 18]],
      trapezoid: [[17, 6], [39, 6], [52, 30], [4, 30]],
      kite: [[29, 2], [42, 13], [29, 34], [16, 13]]
    }[kind]
    let h = F.poly(pts, { fill: C.fill, w: 1.6 })
    const tick = (a, b, k) => {
      const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], dx = b[0] - a[0], dy = b[1] - a[1], Lg = Math.hypot(dx, dy), ux = dx / Lg, uy = dy / Lg
      let t = ''
      for (let i = 0; i < k; i++) { const o2 = (i - (k - 1) / 2) * 3.2, cx = m[0] + ux * o2, cy = m[1] + uy * o2; t += F.line(cx - uy * 3.5, cy + ux * 3.5, cx + uy * 3.5, cy - ux * 3.5, { c: C.dim, w: 1.1 }) }
      return t
    }
    const ticks = { square: [1, 1, 1, 1], rectangle: [1, 2, 1, 2], parallelogram: [1, 2, 1, 2], rhombus: [1, 1, 1, 1], trapezoid: [0, 0, 0, 0], kite: [1, 2, 2, 1] }[kind]
    ticks.forEach((k, i) => { if (k) h += tick(pts[i], pts[(i + 1) % 4], k) })
    return F.svg(56, 36, h, { max: '0.6in' })
  }

  return { F, C, FS, TS, xc, big, SH, NET, pair, row, frame, isoFrame, D, Dout, split, tag, hole, note, call, u,
    box, boxNet, cyl, cylNet, trough, angleEnd, capsuleSide, cone, pyramid, sphere, rect, para, circ, ring, trap,
    lPlate, arrowPlate, lug, hopper, cubes, tPlate, uPlate, gusset, slotPlate, ductNet, wallElev, gableRoof, quadIcon, poly3, ask, sz };
};
