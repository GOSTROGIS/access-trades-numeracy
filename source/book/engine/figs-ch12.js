/* Drawings for Chapters 12 and 13 (angles, right triangles, trigonometry). Model units have y up.
   Every triangle is drawn from its true corner points, so angles and proportions are true. */
const F = require('./figs.js')
const C = F.C
const D2R = Math.PI / 180

/* text size multiplier. Chapters raise it for a drawing that would otherwise print labels under 7 pt.
   FK wraps the text-drawing helpers of figs.js so every label in this file follows it. */
let K = 1
function setK(k) { K = k || 1 }
const sc = (o, d) => Object.assign({}, o, { s: ((o && o.s) || d) * K })
const FK = {
  t: (x, y, s, o) => F.t(x, y, s, sc(o, 14)),
  label: (x, y, s, o) => F.label(x, y, s, sc(o, 14)),
  dim: (x1, y1, x2, y2, lab, off, o) => F.dim(x1, y1, x2, y2, lab, off, sc(o, 14)),
  arc: (p, a1, a2, r, lab, o) => {
    const oo = Object.assign(sc(o, 13), { lr: ((o && o.lr) || 16) * K })
    if (!(o && o.ask)) return F.arc(p, a1, a2, r, lab, oo)
    /* figs.js draws the ? chip of an arc at a fixed size, so draw it here at the scaled size */
    let d = a2 - a1
    while (d < 0) d += 2 * Math.PI
    const mid = a1 + d / 2, lr = r + oo.lr
    return F.arc(p, a1, a2, r, null, oo) + F.label(p[0] + lr * Math.cos(mid), p[1] + lr * Math.sin(mid) + 5, '?', { ask: true, s: oo.s })
  },
  callout: (px, py, bx, by, s, o) => F.callout(px, py, bx, by, s, sc(o, 12))
}
/* smallest printed label size, in points, of an svg shown at most avail inches wide */
function minPt(svg, avail) {
  const vb = /viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/.exec(svg)
  const mw = /max-width:([\d.]+)in/.exec(svg)
  const disp = Math.min(mw ? +mw[1] : avail, avail || 6.5)
  const sizes = Array.from(svg.matchAll(/font-size="([\d.]+)"/g)).map(m => +m[1])
  return sizes.length ? Math.min(...sizes) * disp * 72 / +vb[3] : 99
}
/* build a drawing so its smallest label prints at 7.3 pt or more in a space avail inches wide */
function auto(fn, avail) {
  let k = 1, svg
  for (let i = 0; i < 6; i++) {
    setK(k)
    svg = fn()
    const pt = minPt(svg, avail)
    if (pt >= 7.3) break
    k = k * 7.35 / pt
  }
  setK(1)
  if (minPt(svg, avail) < 7) throw new Error('label under 7 pt after scaling')
  return svg
}

/* fit model points into an SVG box: returns P(model point) -> [x, y] in SVG units */
function fitter(pts, W, H, pad, padX) {
  if (padX == null) padX = pad
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1])
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys)
  const s = Math.min((W - 2 * padX) / Math.max(x1 - x0, 1e-9), (H - 2 * pad) / Math.max(y1 - y0, 1e-9))
  const w = (x1 - x0) * s + 2 * padX, h = (y1 - y0) * s + 2 * pad
  const P = p => [padX + (p[0] - x0) * s, pad + (y1 - p[1]) * s]
  return { P, s, w, h }
}
function sub(a, b) { return [a[0] - b[0], a[1] - b[1]] }
function unit(v) { const L = Math.hypot(v[0], v[1]); return [v[0] / L, v[1] / L] }
function centroid(ps) { return [ps.reduce((t, p) => t + p[0], 0) / ps.length, ps.reduce((t, p) => t + p[1], 0) / ps.length] }

/* a dimension on the side p1 to p2 (SVG coords) placed away from point away */
function dimOut(p1, p2, away, lab, o) {
  o = o || {}
  const u = unit(sub(p2, p1)), n = [-u[1], u[0]]
  const mid = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2]
  const side = (n[0] * (mid[0] - away[0]) + n[1] * (mid[1] - away[1])) >= 0 ? 1 : -1
  return FK.dim(p1[0], p1[1], p2[0], p2[1], o.ask ? '?' : lab, side * (o.off || 26) * Math.max(1, K), { ask: o.ask, s: o.s || 13 })
}
/* a text label beside the middle of a side, away from a point */
function sideText(p1, p2, away, s, o) {
  o = o || {}
  const u = unit(sub(p2, p1)), n = [-u[1], u[0]]
  const mid = [(p1[0] + p2[0]) / 2 + u[0] * (o.along || 0), (p1[1] + p2[1]) / 2 + u[1] * (o.along || 0)]
  const side = (n[0] * (mid[0] - away[0]) + n[1] * (mid[1] - away[1])) >= 0 ? 1 : -1
  const d = (o.off || 16) * Math.max(1, K)
  const x = mid[0] + side * n[0] * d, y = mid[1] + side * n[1] * d + 5
  if (o.ask) return FK.label(x, y - 1, '?', { ask: true, s: 14 })
  if (o.chip) return FK.label(x, y, s, { s: o.s || 13, c: o.c })
  return FK.t(x, y, s, { s: o.s || 13, b: !!o.b, c: o.c || C.ink, wgt: o.wgt || 600 })
}
/* angle arc at vertex v between neighbours a and b (all SVG coords), on the inside */
function arcAt(v, a, b, r, lab, o) {
  o = o || {}
  let a1 = Math.atan2(a[1] - v[1], a[0] - v[0]), a2 = Math.atan2(b[1] - v[1], b[0] - v[0])
  let d = a2 - a1
  while (d < 0) d += 2 * Math.PI
  if (d > Math.PI) { const t = a1; a1 = a2; a2 = t }
  return FK.arc(v, a1, a2, r, lab, { ask: o.ask, c: o.c, lr: o.lr, s: o.s || 13 })
}
/* right angle box at vertex v with legs toward a and b */
function rightAt(v, a, b, s) { return F.rightMark(v, unit(sub(a, v)), unit(sub(b, v)), s || 12) }

/* triangle or polygon figure.
   o.pts {key: [x, y]} model coords, o.order [keys], o.right key, o.ang {key: {lab, ask, r, lr, c}},
   o.sides [{a, b, lab, ask, dim, name, nameC, off}], o.vlab true, o.W, o.H, o.pad, o.max, o.fill, o.extra(P) */
function poly(o) {
  const keys = o.order || Object.keys(o.pts)
  const fit = fitter(keys.map(k => o.pts[k]), o.W || 380, o.H || 260, o.pad == null ? 66 : o.pad, o.padX)
  const P = {}
  keys.forEach(k => { P[k] = fit.P(o.pts[k]) })
  const cen = centroid(keys.map(k => P[k]))
  let h = F.poly(keys.map(k => P[k]), { fill: o.fill == null ? C.fill : o.fill })
  if (o.under) h = o.under(fit.P, P) + h
  const nb = k => { const i = keys.indexOf(k), n = keys.length; return [P[keys[(i + n - 1) % n]], P[keys[(i + 1) % n]]] }
  if (o.right) [].concat(o.right).forEach(k => { const [a, b] = nb(k); h += rightAt(P[k], a, b) })
  Object.keys(o.ang || {}).forEach(k => {
    const g = o.ang[k], [a, b] = nb(k)
    h += arcAt(P[k], a, b, g.r || 26, g.ask ? '?' : g.lab, g)
  })
  ;(o.sides || []).forEach(sd => {
    const p1 = P[sd.a], p2 = P[sd.b]
    if (sd.dim) h += dimOut(p1, p2, cen, sd.lab, { ask: sd.ask, off: sd.off, s: sd.s })
    else if (sd.lab != null || sd.ask) h += sideText(p1, p2, cen, sd.lab, { ask: sd.ask, chip: true, off: sd.off || 18, s: sd.s, along: sd.along })
    if (sd.name) h += sideText(p1, p2, cen, sd.name, { off: sd.nameOff || (sd.dim ? 62 : 40), c: sd.nameC || C.deep, b: true, s: sd.nameS || 13, along: sd.nameAlong })
  })
  if (o.vlab) keys.forEach(k => {
    const u = unit(sub(P[k], cen))
    h += FK.t(P[k][0] + u[0] * (o.vlabOff || 16), P[k][1] + u[1] * (o.vlabOff || 16) + 5, k, { s: 14, b: true, c: C.ink })
  })
  if (o.extra) h += o.extra(fit.P, P)
  return F.svg(fit.w, fit.h, h, { max: o.max || '3.2in' })
}

/* right triangle from base b along x, height h along y, right angle at the origin.
   corner names: R right angle, A at the end of the base, B at the top. */
function rt(b, h, o) {
  o = Object.assign({}, o)
  let pts = { R: [0, 0], A: [b, 0], B: [0, h] }
  if (o.flip) pts = { R: [0, 0], A: [-b, 0], B: [0, h] }
  if (o.down) Object.keys(pts).forEach(k => { pts[k] = [pts[k][0], -pts[k][1]] })
  if (o.rot) {
    const c = Math.cos(o.rot * D2R), s = Math.sin(o.rot * D2R)
    Object.keys(pts).forEach(k => { const p = pts[k]; pts[k] = [p[0] * c - p[1] * s, p[0] * s + p[1] * c] })
  }
  return poly(Object.assign({ pts, order: ['R', 'A', 'B'], right: 'R' }, o))
}

/* the squares on the three sides of a 3-4-5 triangle, drawn on a unit grid */
function pythSquares(a, b, o) {
  o = o || {}
  const S = o.unit || 26, c = Math.hypot(a, b)
  /* model: right angle at origin, leg b along +x, leg a along +y */
  const R = [0, 0], A = [b, 0], B = [0, a]
  const sq = (p, q, sgn) => { const v = sub(q, p), n = [-v[1] * sgn, v[0] * sgn]; return [p, q, [q[0] + n[0], q[1] + n[1]], [p[0] + n[0], p[1] + n[1]]] }
  const sqB = sq(R, A, -1), sqA = sq(B, R, -1), sqC = sq(A, B, -1)
  const all = [].concat(sqB, sqA, sqC)
  const xs = all.map(p => p[0]), ys = all.map(p => p[1])
  const x0 = Math.min(...xs), y1 = Math.max(...ys), pad = 30
  const T = p => [pad + (p[0] - x0) * S, pad + (y1 - p[1]) * S]
  const W = (Math.max(...xs) - x0) * S + 2 * pad, H = (y1 - Math.min(...ys)) * S + 2 * pad
  let h = ''
  const grid = (q, n, fill) => {
    let g = F.poly(q.map(T), { fill, w: 2 })
    const [p0, p1, , p3] = q
    Array.from({ length: n - 1 }, (_, i) => i + 1).forEach(i => {
      const t = i / n
      const u0 = [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t], u1 = [p3[0] + (p1[0] - p0[0]) * t, p3[1] + (p1[1] - p0[1]) * t]
      const w0 = [p0[0] + (p3[0] - p0[0]) * t, p0[1] + (p3[1] - p0[1]) * t], w1 = [p1[0] + (p3[0] - p0[0]) * t, p1[1] + (p3[1] - p0[1]) * t]
      g += F.line(...T(u0), ...T(u1), { c: C.edge, w: 0.7 }) + F.line(...T(w0), ...T(w1), { c: C.edge, w: 0.7 })
    })
    const m = centroid(q.map(T))
    return g + FK.label(m[0], m[1] + 6, o.labs ? o.labs.shift() : '', { s: 15 })
  }
  o.labs = (o.labs || [a + '² = ' + a * a, b + '² = ' + b * b, c + '² = ' + c * c]).slice()
  h += grid(sqA, a, C.fill2) + grid(sqB, b, C.fill2) + grid(sqC, c, '#FFF3CC')
  h += F.poly([R, A, B].map(T), { fill: C.gold, w: 2.4 }) + rightAt(T(R), T(A), T(B))
  return F.svg(W, H, h, { max: o.max || '3in' })
}

/* angle drawn at true size: vertex, one arm along 0°, the other at deg, with arc and label */
function angleFig(deg, o) {
  o = o || {}
  const L = o.len || 110, W = o.W || 180, H = o.H || 130
  const vx = o.vx != null ? o.vx : (deg > 90 ? W / 2 + 10 : 30), vy = H - 26
  const ex = vx + L * Math.cos(deg * D2R), ey = vy - L * Math.sin(deg * D2R)
  let h = F.line(vx, vy, vx + L, vy, { c: C.edge, w: 2.6 }) + F.line(vx, vy, ex, ey, { c: C.edge, w: 2.6 })
  h += '<circle cx="' + vx + '" cy="' + vy + '" r="3.2" fill="' + C.edge + '"/>'
  if (deg === 90) h += F.rightMark([vx, vy], [1, 0], [0, -1], 16)
  else h += FK.arc([vx, vy], -deg * D2R, 0, o.r || 26, null, {})
  const lr = (o.r || 26) + 18, mid = -deg * D2R / 2
  h += FK.t(vx + lr * Math.cos(mid) + (deg > 150 ? 0 : 4), vy + lr * Math.sin(mid) + 5, o.lab || deg + '°', { s: 14, b: true, c: C.red })
  if (o.name) h += FK.t(W / 2, H - 4, o.name, { s: 14, b: true, c: C.ink })
  return F.svg(W, H, h, { max: o.max || '1.6in' })
}

/* protractor with one scale (0 at the right) and an angle of deg drawn on it. Numbers every o.step degrees.
   The red arm stops short of the numbers and shows its reading with a mark across the scale. */
function protractor(deg, o) {
  o = o || {}
  const R = 170, cx = 200, cy = 196, step = o.step || 10, nr = R - 30
  let h = '<path d="M' + (cx - R) + ' ' + cy + 'A' + R + ' ' + R + ' 0 0 1 ' + (cx + R) + ' ' + cy + 'Z" fill="' + C.fill2 + '" stroke="' + C.ink + '" stroke-width="1.4"/>'
  Array.from({ length: 37 }, (_, k) => k * 5).forEach(i => {
    const a = -i * D2R, L = i % 10 === 0 ? 16 : 10
    h += F.line(cx + R * Math.cos(a), cy + R * Math.sin(a), cx + (R - L) * Math.cos(a), cy + (R - L) * Math.sin(a), { c: C.ink, w: i % 10 === 0 ? 1.3 : 0.8 })
    if (i % step === 0) {
      const end = i === 0 || i === 180
      const x = end ? (i === 0 ? cx + R - 12 : cx - R + 14) : cx + nr * Math.cos(a), y = end ? cy + 18 * K + 4 : cy + nr * Math.sin(a) + 4
      h += FK.t(x, y, String(i), { s: 10.5, wgt: 600 })
    }
  })
  h += F.line(cx - R, cy, cx + R, cy, { c: C.ink, w: 1.2 })
  h += '<circle cx="' + cx + '" cy="' + cy + '" r="3" fill="' + C.ink + '"/>'
  const inner = nr - 26
  const ray = (t, w) => F.line(cx, cy, cx + inner * Math.cos(t), cy + inner * Math.sin(t), { c: C.red, w }) + F.line(cx + (R - 14) * Math.cos(t), cy + (R - 14) * Math.sin(t), cx + (R + 16) * Math.cos(t), cy + (R + 16) * Math.sin(t), { c: C.red, w })
  h += ray(0, 2.6) + ray(-deg * D2R, 2.6)
  h += FK.arc([cx, cy], -deg * D2R, 0, 40, o.ask ? '?' : deg + '°', { ask: o.ask, lr: 18, s: 15 })
  h += FK.callout(cx, cy, cx - 40, cy + 22 + 18 * K, 'centre mark on the vertex', { s: 11 })
  return F.svg(cx + R + 30, cy + 40 + 24 * K, h, { max: o.max || '3.4in' })
}

/* a straight line with a ray from point v at deg: two angles, either can be asked */
function straightLine(deg, o) {
  o = o || {}
  const W = 380, H = 150, vx = 190, vy = 118, L = 120
  let h = F.line(20, vy, W - 20, vy, { c: C.edge, w: 2.6 })
  h += F.line(vx, vy, vx + L * Math.cos(-deg * D2R), vy + L * Math.sin(-deg * D2R), { c: C.edge, w: 2.6 })
  h += FK.arc([vx, vy], -deg * D2R, 0, 30, o.askR ? '?' : (o.labR || deg + '°'), { ask: o.askR, lr: 18 })
  h += FK.arc([vx, vy], -Math.PI, -deg * D2R, 46, o.askL ? '?' : (o.labL || (180 - deg) + '°'), { ask: o.askL, lr: 18, c: C.edge })
  return F.svg(W, H, h, { max: o.max || '3in' })
}

/* angles around a point: list of angles (degrees, adding to 360), labels, ask index */
function aroundPoint(angs, o) {
  o = o || {}
  const W = 300, H = 260, cx = 150, cy = 130, L = 105
  let h = '', a = o.start || 0
  const rays = []
  angs.forEach(d => { rays.push(a); a += d })
  rays.forEach(r => { h += F.line(cx, cy, cx + L * Math.cos(-r * D2R), cy + L * Math.sin(-r * D2R), { c: C.edge, w: 2.6 }) })
  angs.forEach((d, i) => {
    const r0 = rays[i], r1 = r0 + d, ask = o.ask === i
    h += FK.arc([cx, cy], -r1 * D2R, -r0 * D2R, 30 + (i % 2) * 8, ask ? '?' : d + '°', { ask, lr: 20, c: i % 2 ? C.edge : C.red })
  })
  h += '<circle cx="' + cx + '" cy="' + cy + '" r="3.4" fill="' + C.edge + '"/>'
  return F.svg(W, H, h, { max: o.max || '2.5in' })
}

/* bolt circle: n equal holes, the angle between two neighbours marked */
function boltCircle(n, o) {
  o = o || {}
  const R = 95, cx = 140, cy = 130
  let h = F.circle(cx, cy, R + 30, { fill: C.fill }) + F.circle(cx, cy, 22, { fill: '#FFFFFF' })
  h += '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="' + C.dim + '" stroke-width="1" stroke-dasharray="6 4"/>'
  Array.from({ length: n }, (_, i) => i).forEach(i => {
    const a = (-90 + i * 360 / n) * D2R
    h += F.circle(cx + R * Math.cos(a), cy + R * Math.sin(a), 11, { fill: '#FFFFFF', w: 1.8 })
  })
  const a0 = -90 * D2R, a1 = (-90 + 360 / n) * D2R
  h += F.line(cx, cy, cx + R * Math.cos(a0), cy + R * Math.sin(a0), { c: C.red, w: 1.6 }) + F.line(cx, cy, cx + R * Math.cos(a1), cy + R * Math.sin(a1), { c: C.red, w: 1.6 })
  h += FK.arc([cx, cy], a0, a1, 48, o.ask ? '?' : o.lab, { ask: o.ask, lr: 16 })
  return F.svg(280, 260, h, { max: o.max || '2.3in' })
}

/* frame corner check: two edges meeting at a corner, marks at m1 along the base and m2 up the side,
   tape between the marks. units text u, labels for the three distances */
function cornerCheck(m1, m2, o) {
  o = o || {}
  const W = o.W || 470, H = o.H || 360, x0 = 112, y0 = H - 70, sc = Math.min((W - x0 - 40) / (m1 * 1.3), (y0 - 30) / (m2 * 1.3))
  const bw = 16, Lx = m1 * 1.3 * sc, Ly = m2 * 1.3 * sc
  let h = F.rect(x0 - bw, y0, Lx + bw, bw, { fill: C.fill }) + F.rect(x0 - bw, y0 - Ly, bw, Ly, { fill: C.fill2 })
  const pA = [x0 + m1 * sc, y0], pB = [x0, y0 - m2 * sc]
  h += F.line(pA[0], y0 - 6, pA[0], y0 + bw + 6, { c: C.red, w: 2.4 }) + F.line(x0 - bw - 6, pB[1], x0 + 6, pB[1], { c: C.red, w: 2.4 })
  h += F.line(pA[0], pA[1], pB[0], pB[1], { c: C.gold, w: 5 }) + F.line(pA[0], pA[1], pB[0], pB[1], { c: C.ink, w: 1, dash: '3 5' })
  h += F.rightMark([x0, y0], [1, 0], [0, -1], 14)
  h += FK.dim(x0, y0 + bw, pA[0], y0 + bw, o.l1, 26, { s: 13 })
  h += FK.dim(x0 - bw, y0, x0 - bw, pB[1], o.l2, -28, { s: 13 })
  const mx = (pA[0] + pB[0]) / 2, my = (pA[1] + pB[1]) / 2
  h += o.ask3 ? FK.label(mx + 22, my - 14, '?', { ask: true, s: 14 }) : FK.label(mx + 44, my - 16, o.l3, { s: 14, c: C.deep })
  return F.svg(W, H, h, { max: o.max || '3.8in' })
}

/* rectangle frame with both diagonals, labels for length and width and optional diagonal labels */
function frameDiag(l, w, o) {
  o = o || {}
  const W = o.W || 440, sc = (W - 150) / l, H = w * sc + 100, x0 = 50, y0 = 30, bw = o.bw || 12
  let h = F.rect(x0, y0, l * sc, w * sc, { fill: C.fill }) + F.rect(x0 + bw, y0 + bw, l * sc - 2 * bw, w * sc - 2 * bw, { fill: '#FFFFFF' })
  h += F.line(x0, y0 + w * sc, x0 + l * sc, y0, { c: C.dim, w: 1.6, dash: '7 5' })
  if (o.both !== false) h += F.line(x0, y0, x0 + l * sc, y0 + w * sc, { c: C.dim, w: 1.6, dash: '7 5' })
  h += FK.dim(x0, y0 + w * sc, x0 + l * sc, y0 + w * sc, o.askL ? '?' : o.l, 26, { ask: o.askL, s: 13 })
  h += FK.dim(x0 + l * sc, y0 + w * sc, x0 + l * sc, y0, o.askW ? '?' : o.w, 28, { ask: o.askW, s: 13 })
  const ang = Math.atan2(w * sc, l * sc), cx = x0 + l * sc / 2, cy = y0 + w * sc / 2
  if (o.d1 != null || o.askD) h += FK.label(cx - 0.28 * l * sc, cy + 0.28 * w * sc + 2 - 10, o.askD ? '?' : o.d1, { ask: o.askD, s: 13, c: C.deep })
  if (o.d2 != null) h += FK.label(cx - 0.28 * l * sc, cy - 0.28 * w * sc + 8, o.d2, { s: 13, c: C.deep })
  if (o.callouts) h += o.callouts(x0, y0, l * sc, w * sc)
  return F.svg(W, H, h, { max: o.max || '3.8in' })
}

/* pipe offset: two parallel runs joined by a travel piece at the fitting angle deg.
   o.set, o.run, o.travel labels (or ask*), o.ang label, model set value for proportion */
function pipeOffset(deg, setv, o) {
  o = o || {}
  const run = setv / Math.tan(deg * D2R)
  const W = o.W || 560, lead = Math.max(run * 0.45, setv * 0.5)
  const total = lead * 2 + run
  const sc = Math.min((W - 120) / total, (o.Hmax || 220) / setv)
  const H = setv * sc + 120, x0 = 30 + (W - 60 - total * sc) / 2, yb = H - 58
  const p0 = [x0 + lead * sc, yb], p1 = [x0 + (lead + run) * sc, yb - setv * sc]
  const pipe = (a, b) => F.line(a[0], a[1], b[0], b[1], { c: C.edge, w: 16 }) + F.line(a[0], a[1], b[0], b[1], { c: C.fill, w: 11 })
  let h = pipe([x0, yb], p0) + pipe(p0, p1) + pipe(p1, [x0 + total * sc, p1[1]])
  h += '<circle cx="' + p0[0] + '" cy="' + p0[1] + '" r="10" fill="' + C.gold + '" stroke="' + C.edge + '" stroke-width="1.6"/>'
  h += '<circle cx="' + p1[0] + '" cy="' + p1[1] + '" r="10" fill="' + C.gold + '" stroke="' + C.edge + '" stroke-width="1.6"/>'
  h += F.line(x0, yb, x0 + total * sc, yb, { c: C.dim, w: 1, dash: '8 4 2 4' }) + F.line(x0, p1[1], x0 + total * sc, p1[1], { c: C.dim, w: 1, dash: '8 4 2 4' })
  h += F.line(p0[0], p0[1], p1[0], p1[1], { c: C.ink, w: 1, dash: '8 4 2 4' })
  h += F.line(p1[0], p1[1], p1[0], yb, { c: C.red, w: 1.6, dash: '6 4' })
  h += F.rightMark([p1[0], yb], [-1, 0], [0, -1], 12)
  h += FK.arc(p0, -deg * D2R, 0, deg < 35 ? 90 : 48, o.askAng ? '?' : (o.ang || deg + '°'), { ask: o.askAng, lr: 18, s: 14 })
  h += FK.dim(p0[0], yb, p1[0], yb, o.askRun ? '?' : o.run, 34, { ask: o.askRun, s: 13 })
  h += FK.dim(p1[0], yb, p1[0], p1[1], o.askSet ? '?' : o.set, 34, { ask: o.askSet, s: 13 })
  const ux = (p1[0] - p0[0]), uy = (p1[1] - p0[1]), L = Math.hypot(ux, uy), nx = uy / L, ny = -ux / L
  const mx = (p0[0] + p1[0]) / 2 + nx * 30, my = (p0[1] + p1[1]) / 2 + ny * 30
  h += o.askTravel ? FK.label(mx, my + 5, '?', { ask: true, s: 14 }) : FK.label(mx, my + 5, o.travel, { s: 13, c: C.deep })
  if (o.names) {
    h += FK.t(p1[0] + 70, (p1[1] + yb) / 2 + 26, 'set', { s: 13, b: true, c: C.deep, a: 'start' })
    h += FK.t((p0[0] + p1[0]) / 2, yb + 52, 'run', { s: 13, b: true, c: C.deep })
    h += FK.t(mx + nx * 26, my + ny * 26 + 5, 'travel', { s: 13, b: true, c: C.deep })
  }
  return F.svg(W, H, h, { max: o.max || '5.4in' })
}

/* plate edge bevel: thickness t, bevel angle deg from the square face */
function bevel(t, deg, o) {
  o = o || {}
  const w = t * Math.tan(deg * D2R), Lp = t * 2.2, sc = (o.size || 150) / t
  const x0 = 84, yb = 40 + t * sc, x1 = x0 + Lp * sc
  const P = [[x0, yb], [x1, yb], [x1 - w * sc, yb - t * sc], [x0, yb - t * sc]]
  let h = F.poly(P, { fill: C.fill })
  h += F.line(x1, yb, x1, yb - t * sc - 12, { c: C.dim, w: 1.2, dash: '6 4' })
  const ar = Math.min(60, t * sc * 0.5)
  h += FK.arc([x1, yb], -Math.PI / 2 - deg * D2R, -Math.PI / 2, ar, null, {})
  /* angle label just right of the dashed square line, level with the top of the arc, clear of the width dimension */
  h += o.askAng ? FK.label(x1 + 24 * K, yb - ar + 4, '?', { ask: true, s: 16 }) : FK.t(x1 + 8, yb - ar + 6, deg + '°', { s: 16, b: true, c: C.red, a: 'start' })
  h += FK.dim(x0, yb, x0, yb - t * sc, o.askT ? '?' : o.t, -34, { ask: o.askT, s: 16 })
  h += FK.dim(x1 - w * sc, yb - t * sc, x1, yb - t * sc, o.askW ? '?' : o.w, 26, { ask: o.askW, s: 16 })
  h += FK.callout(x1 - w * sc * 0.35, yb - t * sc * 0.35, x1 + 80, yb - 4, 'bevel face', { s: 14 })
  return F.svg(x1 + 150, yb + 30, h, { max: o.max || '3.6in' })
}

/* a frame corner with a mitre joint for a frame of n equal sides (n = 4 gives a square corner) */
function mitreCorner(n, o) {
  o = o || {}
  const inter = 180 - 360 / n, half = inter / 2
  const len = 250, bw = 40
  /* corner at the origin, piece 1 along +x (outer edge on y = 0), piece 2 turned by the interior angle */
  const d2 = [Math.cos(inter * D2R), Math.sin(inter * D2R)]
  const n1 = [0, 1], n2 = [Math.sin(inter * D2R), -Math.cos(inter * D2R)]
  const q = half * D2R, inner = [bw / Math.tan(q), bw]
  const Pm = [[0, 0], [len, 0], [len, bw], inner]
  const Qm = [[0, 0], inner, [len * d2[0] + bw * n2[0], len * d2[1] + bw * n2[1]], [len * d2[0], len * d2[1]]]
  const all = Pm.concat(Qm)
  const xs = all.map(p => p[0]), ys = all.map(p => p[1]), pad = 46
  const x0 = Math.min(...xs), y0 = Math.min(...ys)
  const T = p => [pad + (p[0] - x0), pad + (p[1] - y0)]
  /* flip so the frame opens upward on the page: y down already places piece 2 below, mirror y */
  const H = Math.max(...ys) - y0 + 2 * pad, W = Math.max(...xs) - x0 + 2 * pad
  const M = p => { const t = T(p); return [t[0], H - t[1]] }
  let h = F.poly(Pm.map(M), { fill: C.fill }) + F.poly(Qm.map(M), { fill: C.fill2 })
  h += F.line(...M([0, 0]), ...M(inner), { c: C.red, w: 2.4 })
  const c0 = M([0, 0]), ci = M(inner), c1 = M([len, 0]), c2 = M([len * d2[0], len * d2[1]])
  h += arcAt(c0, c1, c2, 96, o.askInter ? '?' : (o.interLab || inter + '°'), { ask: o.askInter, c: C.edge, lr: 18 })
  h += arcAt(c0, c1, ci, 46, o.askCut ? '?' : (o.cutLab || half + '°'), { ask: o.askCut, lr: 16 })
  h += FK.callout(...M([inner[0] * 0.6, inner[1] * 0.6]), ...M([len * 0.8, bw + 96]), 'mitre joint', { s: 11.5 })
  return F.svg(W, H, h, { max: o.max || '2.8in' })
}

/* regular polygon frame of n sides with mitre lines at the corners */
function polyFrame(n, o) {
  o = o || {}
  const R = 110, r = 80, cx = 140, cy = 135
  const pt = (rad, i) => { const a = (-90 + 180 / n + i * 360 / n) * D2R; return [cx + rad * Math.cos(a), cy + rad * Math.sin(a)] }
  const outer = Array.from({ length: n }, (_, i) => pt(R, i)), inner = Array.from({ length: n }, (_, i) => pt(r, i))
  let h = F.poly(outer, { fill: C.fill }) + F.poly(inner, { fill: '#FFFFFF' })
  outer.forEach((p, i) => { h += F.line(p[0], p[1], inner[i][0], inner[i][1], { c: C.red, w: 1.8 }) })
  return F.svg(280, 270, h, { max: o.max || '2in' })
}

/* ramp: run along the ground, rise at the high end, slope length along the top */
function ramp(run, rise, o) {
  o = o || {}
  const pts = { A: [0, 0], R: [run, 0], B: [run, rise] }
  return poly(Object.assign({ pts, order: ['A', 'R', 'B'], right: 'R', W: 520, H: 200, max: '4.6in' }, o))
}

/* a right triangle given an angle at the base corner: base adjacent, hypotenuse slanted */
function trigTri(deg, o) {
  o = o || {}
  const b = o.b || 10, h = b * Math.tan(deg * D2R)
  return rt(b, h, o)
}

/* the four angles at a crossing point p (SVG coords) of a horizontal line and a line at deg (math angle, counter-
   clockwise from the right). labs: four labels for the sectors 0 to deg, deg to 180, 180 to 180 + deg and the last,
   '?' draws the chip, null leaves the sector bare. cols: arc colours */
function crossArcs(p, deg, labs, o) {
  o = o || {}
  const st = [0, deg, 180, 180 + deg], en = [deg, 180, 180 + deg, 360]
  let h = ''
  labs.forEach((lab, i) => {
    if (lab == null) return
    const small = en[i] - st[i] < 90
    h += FK.arc(p, -en[i] * D2R, -st[i] * D2R, small ? (o.r || 30) : (o.r || 30) - 12, lab, { ask: lab === '?', lr: small ? (o.lr || 16) : (o.lr || 16) + 12, s: o.s || 16, c: small ? C.red : C.dim })
  })
  return h
}
/* two straight lines that cross: one level, one at deg. labs as in crossArcs */
function crossLines(deg, labs, o) {
  o = o || {}
  const W = 340, H = 210, cx = 170, cy = 105, L1 = 150, L2 = 100
  const d = [Math.cos(deg * D2R), -Math.sin(deg * D2R)]
  let h = F.line(cx - L1, cy, cx + L1, cy, { c: C.edge, w: 2.6 })
  h += F.line(cx - L2 * d[0], cy - L2 * d[1], cx + L2 * d[0], cy + L2 * d[1], { c: C.edge, w: 2.6 })
  h += crossArcs([cx, cy], deg, labs, o)
  h += '<circle cx="' + cx + '" cy="' + cy + '" r="3.2" fill="' + C.edge + '"/>'
  return F.svg(W, H, h, { max: o.max || '2.8in' })
}
/* two parallel level lines cut by a transversal at deg. top and bot: four labels each, as in crossArcs.
   o.names: names written at the right end of the parallel lines */
function transversal(deg, top, bot, o) {
  o = o || {}
  const W = o.W || 400, H = 250, y1 = 70, y2 = 185, gap = y2 - y1
  const dx = gap / Math.tan(deg * D2R), xm = W / 2, x1 = xm + dx / 2, x2 = xm - dx / 2
  const ext = 66, d = [Math.cos(deg * D2R), -Math.sin(deg * D2R)]
  let h = F.line(24, y1, W - 24, y1, { c: C.edge, w: 2.6 }) + F.line(24, y2, W - 24, y2, { c: C.edge, w: 2.6 })
  /* arrow marks show the two lines are parallel */
  for (const y of [y1, y2]) {
    const x = W - 60
    h += F.line(x - 7, y - 6, x, y, { c: C.edge, w: 2 }) + F.line(x - 7, y + 6, x, y, { c: C.edge, w: 2 })
  }
  h += F.line(x2 - ext * d[0], y2 - ext * d[1], x1 + ext * d[0], y1 + ext * d[1], { c: C.ink, w: 2.4 })
  h += crossArcs([x1, y1], deg, top, o) + crossArcs([x2, y2], deg, bot, o)
  if (o.names) {
    h += FK.t(30, y1 - 10, o.names[0], { s: 13, b: true, c: C.deep, a: 'start' }) + FK.t(30, y2 - 10, o.names[1], { s: 13, b: true, c: C.deep, a: 'start' })
    if (o.names[2]) h += FK.t(x1 + ext * d[0] + 4, y1 + ext * d[1] + 4, o.names[2], { s: 13, b: true, c: C.ink, a: 'start' })
  }
  return F.svg(W, H, h, { max: o.max || '3.2in' })
}

/* side view of a straight stair from floor to floor: n risers of unit rise R and treads of unit run U (model units).
   o.lab: { rise, run, totalRise, totalRun, stringer } texts, '?' for a chip, null to leave out.
   o.names: write riser, tread and nosing callouts. o.head: clear height text drawn above the stair */
function stairSide(n, R, U, o) {
  o = o || {}
  const K1 = Math.max(1, K)
  const lab = o.lab || {}
  const top = (n - 1) * U, TR = n * R
  const prof = [[-0.9 * U, 0], [0, 0]]
  for (let k = 1; k <= n; k++) {
    prof.push([(k - 1) * U, k * R])
    if (k < n) prof.push([k * U, k * R])
  }
  prof.push([top + 1.3 * U, TR])
  const pts = prof.concat([[top + 1.3 * U, TR - 0.55 * R], [top, TR - 0.55 * R], [top, 0]])
  const ext = o.head ? [[top * 0.4, TR + 0.2 * R + (o.headH || 2.6 * R)]] : []
  const fit = fitter(pts.concat(ext), o.W || 520, o.H || 330, o.pad || 56, o.padX || 104)
  const P = fit.P
  let h = F.poly([[0, 0]].concat(prof.slice(2, -1), [[top, 0]]).map(P), { fill: C.fill, w: 1.4 })
  h += F.poly(prof.map(P), { fill: 'none', w: 2.6, open: true })
  h += F.poly([[top, TR], [top + 1.3 * U, TR], [top + 1.3 * U, TR - 0.55 * R], [top, TR - 0.55 * R]].map(P), { fill: C.fill2, w: 1.4 })
  h += F.line(...P([-0.9 * U, 0]), ...P([top + 1.3 * U, 0]), { c: C.ink, w: 1.4 })
  const ch = (v, a, b, off) => v == null ? '' : FK.dim(...P(a), ...P(b), v, off, { ask: v === '?', s: 13 })
  /* stringer line, bottom corner to top corner */
  if (lab.stringer !== null) {
    h += F.line(...P([0, 0]), ...P([top, TR]), { c: C.red, w: 1.8, dash: '8 5' })
    const m = P([top * 0.55, TR * 0.55]), uu = unit(sub(P([top, TR]), P([0, 0])))
    const off = (lab.stringer === '?' ? 26 : 46) * K1
    h += lab.stringer === '?' ? FK.label(m[0] - off * uu[1], m[1] + off * uu[0] + 6, '?', { ask: true, s: 14 }) : FK.label(m[0] - off * uu[1], m[1] + off * uu[0] + 6, lab.stringer || 'stringer', { s: 13, c: C.deep })
  }
  h += ch(lab.totalRun, [0, 0], [top, 0], 30 * K1)
  h += ch(lab.totalRise, [top + 1.3 * U, 0], [top + 1.3 * U, TR], 34 * K1)
  if (n > 2) {
    h += ch(lab.rise, [-0.2 * U, 0], [-0.2 * U, R], -30 * K1)
    h += ch(lab.run, [0, R], [U, R], -22 * K1)
  }
  if (o.names && n > 4) {
    const r1 = P([(n - 2) * U, (n - 1.5) * R]), t1 = P([2.5 * U, 3 * R]), ns = P([(n - 3) * U, (n - 2) * R])
    h += FK.callout(r1[0], r1[1], r1[0] + 45, r1[1] + 25, 'riser', { s: 12 })
    h += FK.callout(t1[0], t1[1], t1[0] - 90, t1[1] - 30, 'tread', { s: 12 })
    h += FK.callout(ns[0], ns[1], ns[0] - 60, ns[1] - 70, 'nosing', { s: 12 })
  }
  if (o.head) {
    const xb = top * 0.4, yb = xb * TR / top, yt = yb + (o.headH || 2.6 * R)
    h += F.rect(...P([xb - 0.6 * U, yt + 0.35 * R]), (1.2 * U) * fit.s, 0.35 * R * fit.s, { fill: C.light })
    h += F.line(...P([xb, yb]), ...P([xb, yt]), { c: C.dim, w: 1.2, dash: '4 3' })
    h += FK.dim(...P([xb, yb]), ...P([xb, yt]), o.head, 20, { ask: o.head === '?', s: 13 })
  }
  return F.svg(fit.w, fit.h, h, { max: o.max || '4.2in' })
}

/* gable roof seen from the end: span along the bottom, ridge in the middle.
   o.lab: { span, run, rise, rafter } texts ('?' for a chip, null to leave out). o.slope: [rise, run] slope mark */
function gable(span, rise, o) {
  o = o || {}
  const K1 = Math.max(1, K)
  const lab = o.lab || {}
  const pts = { L: [0, 0], R: [span, 0], T: [span / 2, rise] }
  const fit = fitter([pts.L, pts.R, pts.T], o.W || 460, o.H || 260, o.pad || 66 + 30 * K, o.padX || 40)
  const P = fit.P
  const L0 = P(pts.L), R0 = P(pts.R), T0 = P(pts.T), M0 = P([span / 2, 0])
  let h = F.poly([L0, R0, T0], { fill: C.fill })
  h += F.line(T0[0], T0[1], M0[0], M0[1], { c: C.dim, w: 1.2, dash: '6 4' }) + F.rightMark(M0, [1, 0], [0, -1], 11)
  const ch = (v, a, b, off) => v == null ? '' : FK.dim(a[0], a[1], b[0], b[1], v, off, { ask: v === '?', s: 13 })
  h += ch(lab.span, L0, R0, 52 * K1)
  h += ch(lab.run, M0, R0, 20 * K1)
  if (lab.rise != null) h += lab.rise === '?' ? FK.label(M0[0] - 22, (M0[1] + T0[1]) / 2 + 6, '?', { ask: true, s: 14 }) : FK.label(M0[0] - 8 - String(lab.rise).length * 4 * K, (M0[1] + T0[1]) / 2 + 6, lab.rise, { s: 13 })
  if (lab.rafter != null) h += sideText(T0, R0, M0, lab.rafter, { ask: lab.rafter === '?', chip: true, off: 24, s: 13, along: String(lab.rafter).length > 3 ? 40 : 0 })
  if (o.slope) {
    /* slope mark on the left rafter: a small level line of length 12 units and a rise */
    const a = P([span * 0.1, rise * 0.2]), k = span * 0.12 / o.slope[1]
    const b = P([span * 0.1 + o.slope[1] * k, rise * 0.2]), c = P([span * 0.1 + o.slope[1] * k, rise * 0.2 + o.slope[0] * k])
    h += F.line(a[0], a[1] + 14, b[0], b[1] + 14, { c: C.ink, w: 1.2 }) + F.line(b[0], b[1] + 14, c[0], c[1] + 14, { c: C.ink, w: 1.2 })
    h += FK.t((a[0] + b[0]) / 2, a[1] + 32, String(o.slope[1]), { s: 12, b: true }) + FK.t(b[0] + 6, (b[1] + c[1]) / 2 + 18, String(o.slope[0]), { s: 12, b: true, a: 'start' })
  }
  return F.svg(fit.w, fit.h, h, { max: o.max || '3.6in' })
}

/* a common rafter at slope deg, with a plumb cut at the ridge end and a birdsmouth (seat cut and heel cut)
   over a wall plate. o.askTop, o.askSeat draw ? chips for the two cut angles */
function rafterCuts(deg, o) {
  o = o || {}
  const t = Math.tan(deg * D2R), s = Math.sin(deg * D2R), c = Math.cos(deg * D2R)
  const d = 1.15, X = 5, xt = -1.1, xa = 1.1, ys = xa * t + 0.6 * d / c
  const xb = ys / t
  const topY = x => d / c + x * t
  const pts = [[xt, xt * t], [xa, xa * t], [xa, ys], [xb, ys], [X, X * t], [X, topY(X)], [xt, topY(xt)]]
  const plate = [[xa, ys], [xb + 0.7, ys], [xb + 0.7, ys - 1.4], [xa, ys - 1.4]]
  const fit = fitter(pts.concat(plate), o.W || 520, o.H || 340, o.pad || 70, o.padX || 70)
  const P = fit.P
  let h = F.poly(plate.map(P), { fill: C.light, w: 1.4 }) + F.poly(pts.map(P), { fill: C.fill })
  h += F.line(...P([xa, xa * t]), ...P([xa, ys]), { c: C.red, w: 2.6 }) + F.line(...P([xa, ys]), ...P([xb, ys]), { c: C.red, w: 2.6 }) + F.line(...P([X, X * t]), ...P([X, topY(X)]), { c: C.red, w: 2.6 })
  /* angle between the plumb cut and the top edge, and between the seat cut and the bottom edge */
  h += arcAt(P([X, topY(X)]), P([X, X * t]), P([X - 3, topY(X - 3)]), 40, o.askTop ? '?' : (o.topLab || L2(90 - deg) + '°'), { ask: o.askTop, lr: 18, s: 14 })
  h += arcAt(P([xb, ys]), P([xa, ys]), P([xa, xa * t]), 40, null, {})
  const sp = P([xb, ys])
  h += o.askSeat ? FK.label(sp[0] - 22, sp[1] + 38, '?', { ask: true, s: 14 }) : FK.t(sp[0] - 22, sp[1] + 38, o.seatLab || L2(deg) + '°', { s: 14, b: true, c: C.red })
  const pc = P([X, (X * t + topY(X)) / 2]), sc = P([(xa + xb) / 2, ys]), hc = P([xa, (xa * t + ys) / 2])
  h += FK.callout(pc[0], pc[1], pc[0] + 20, pc[1] + 80, 'plumb cut', { s: 12 })
  h += FK.callout(sc[0], sc[1], sc[0] - 10, sc[1] + 84, 'seat cut', { s: 12 })
  h += FK.callout(hc[0], hc[1], hc[0] - 80, hc[1] + 60, 'heel cut', { s: 12 })
  return F.svg(fit.w, fit.h, h, { max: o.max || '4in' })
}
function L2(x) { return String(Math.round(x * 100) / 100) }

/* ---------- degrees, minutes and seconds ---------- */
/* decimal degrees to [d, m, s], seconds rounded to dp places (0 = whole seconds), with carries */
function dms(x, dp) {
  dp = dp || 0
  const f = Math.pow(10, dp)
  let tot = Math.round(Math.abs(x) * 3600 * f) / f
  const d = Math.floor(tot / 3600 + 1e-9)
  tot = Math.round((tot - d * 3600) * f) / f
  const m = Math.floor(tot / 60 + 1e-9)
  const s = Math.round((tot - m * 60) * f) / f
  return [d, m, s]
}
const pad2 = v => (v < 10 ? '0' : '') + v
/* text form 36°52′12″ (minutes and seconds kept, even when zero) */
function dmsText(x, dp) { const [d, m, s] = dms(x, dp); return d + '°' + m + '′' + s + '″' }
/* the TI-30Xa entry D.MMSS for d m s */
function dmsKey(d, m, s) { return d + '.' + pad2(m) + pad2(s) }
const dd = (d, m, s) => d + m / 60 + s / 3600

/* a calculator box for angles in D°M′S. The TI-30Xa keys are the canonical sequence. The Sharp shows a sum or
   difference of D°M′S values in D°M′S, and its 2ndF ↔DEG key switches the display between D°M′S and decimal
   (Sharp EL-531XT Calculation Examples [10]), so for the Sharp the box uses the sequence with or without the final
   DD▸DMS that leaves its display in the same form as the TI-30Xa. Both sequences are checked on both emulators. */
const CALC = require('./calc.js')
function dmsCalc(B, o) {
  const rows = o.rows || [{ seq: o.seq, expect: o.expect, label: o.label }]
  const isDms = (s, id) => /°/.test(CALC.screenText(s, id).main)
  rows.forEach(r => {
    const want = isDms(r.seq, 'ti30xa')
    const alt = /\sDD▸DMS$/.test(r.seq) ? r.seq.replace(/\sDD▸DMS$/, '') : r.seq + ' DD▸DMS'
    r.sh = [r.seq, alt].find(s => isDms(s, 'el531xt') === want)
    if (!r.sh) throw new Error('no Sharp sequence shows the same form for ' + r.seq)
    B.check(r.seq, r.expect)
    if (r.sh !== r.seq) B.check(r.sh, r.expect)
  })
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const col = md => {
    let h = '<div class="col"><div class="mdl">' + md.name + '</div>'
    rows.forEach(r => {
      const s = md.id === 'ti30xa' ? r.seq : r.sh, d = CALC.screenText(s, md.id)
      h += (r.label ? '<div class="rowlab">' + r.label + '</div>' : '') + '<div class="keys">' + CALC.chips(s, md.id) + '</div>' +
        '<div class="disp">Display <span class="lcd">' + esc(d.main) + (d.exp ? '<span class="e">' + esc(d.exp) + '</span>' : '') + '</span></div>'
    })
    return h + '</div>'
  }
  return '<div class="calc"><div class="hd">Calculator' + (o.title ? '<span class="t">' + o.title + '</span>' : '') + '</div>' +
    '<div class="cols">' + CALC.MODELS.map(col).join('') + '</div>' + (o.say ? '<div class="say">' + o.say + '</div>' : '') + '</div>'
}

/* ---------- BCBC plates ---------- */
/* one numbered figure with two or more cropped plates side by side (PL.figure takes one plate). parts: [{ num, crop, width }] */
function plateFig(B, parts, caption) {
  const PL = require('./plates.js')
  const nums = Array.from(new Set(parts.map(p => p.num)))
  /* each plate sits in a box of fixed height, so the page layout knows its size before the drawing loads */
  const hgt = p => (parseFloat(p.width) * p.crop[3] / p.crop[2]).toFixed(3) + 'in'
  const body = '<div style="display:flex;gap:6pt;justify-content:center">' + parts.map(p => '<div style="width:' + p.width + ';height:' + hgt(p) + ';overflow:hidden">' + PL.svg(p.num, { crop: p.crop }) + '</div>').join('') + '</div>'
  const src = '<span class="src">Source: ' + nums.map(n => PL.cite(n)).join(', and ') + '</span>'
  return B.figure(body, caption + ' ' + src, { cls: 'plate', width: parts.length > 1 ? null : parts[0].width }).replace('<figure class="plate">', '<figure class="plate" style="break-inside:avoid">')
}

module.exports = { FK, setK, minPt, auto, fitter, poly, rt, trigTri, pythSquares, angleFig, protractor, straightLine, aroundPoint, boltCircle, cornerCheck, frameDiag, pipeOffset, bevel, mitreCorner, polyFrame, ramp, arcAt, rightAt, dimOut, sideText, D2R, crossArcs, crossLines, transversal, stairSide, gable, rafterCuts, dms, dmsText, dmsKey, dd, dmsCalc, plateFig }
