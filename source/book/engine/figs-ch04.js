/* Drawing helpers for Chapter 4 (Fractions) and Chapter 5 (Decimals).
   Labels are "specs": a plain string, { ask: true } for the red ? chip, or { inch: value, den: 16 } for an inch
   value drawn as a stacked mixed number, or { n, d, w, unit } for a stacked fraction. */
const F = require('./figs.js')
const C = F.C
const ff = F.f

function gcd(a, b) {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b) {
    const t = a % b
    a = b
    b = t
  }
  return a
}
/* inch value to { w, n, d } at the nearest 1/den, in lowest terms */
function parts(v, den) {
  den = den || 16
  const t = Math.round(v * den)
  const w = Math.floor(t / den)
  const r = t - w * den
  if (!r) return { w: w, n: 0, d: 1 }
  const g = gcd(r, den)
  return { w: w, n: r / g, d: den / g }
}
/* stacked mixed number centred at (x, c). Returns { svg, w } */
function stacked(x, c, w, n, d, o) {
  o = o || {}
  const fs = o.s || 13, sf = fs * 0.88, col = o.c || C.ink
  const ws = w ? String(w) : ''
  const wW = ws ? ws.length * fs * 0.6 + (n ? fs * 0.12 : 0) : 0
  const fW = n ? Math.max(String(n).length, String(d).length) * sf * 0.62 + fs * 0.25 : 0
  const mW = o.unit ? fs * 0.38 : 0
  const tot = wW + fW + mW
  let x0 = x - tot / 2
  let h = ''
  if (ws) h += F.t(x0 + (wW - (n ? fs * 0.12 : 0)) / 2, c + fs * 0.36, ws, { s: fs, wgt: 600, c: col })
  if (n) {
    const fx = x0 + wW + fW / 2
    h += F.t(fx, c - fs * 0.12, String(n), { s: sf, wgt: 600, c: col })
    h += '<path d="M' + ff(fx - fW / 2 + 1) + ' ' + ff(c) + 'L' + ff(fx + fW / 2 - 1) + ' ' + ff(c) + '" stroke="' + col + '" stroke-width="1.1"/>'
    h += F.t(fx, c + fs * 0.75, String(d), { s: sf, wgt: 600, c: col })
  }
  if (o.unit) h += F.t(x0 + wW + fW + mW / 2, c + fs * 0.2, o.unit, { s: fs, wgt: 600, c: col })
  return { svg: h, w: tot }
}
/* a label spec drawn like F.label: baseline y, white chip behind */
function lab(x, y, spec, o) {
  o = o || {}
  const fs = o.s || 13
  if (spec && spec.ask) return F.label(x, y, '?', { ask: true, s: fs })
  if (spec == null || typeof spec === 'string' || typeof spec === 'number') return F.label(x, y, String(spec == null ? '' : spec), { s: fs, c: o.c })
  let p
  if (spec.inch != null) p = parts(spec.inch, spec.den)
  else p = { w: spec.w || 0, n: spec.n, d: spec.d }
  const unit = spec.unit === undefined ? (spec.inch != null ? '″' : '') : spec.unit
  const c = y - fs / 2 + 2
  if (!p.n) return F.label(x, y, String(p.w) + unit, { s: fs, c: o.c })
  const st = stacked(x, c, p.w, p.n, p.d, { s: fs, unit: unit, c: o.c })
  const hh = fs * 2.04
  return '<rect x="' + ff(x - st.w / 2 - 4) + '" y="' + ff(c - hh / 2 + fs * 0.02) + '" width="' + ff(st.w + 8) + '" height="' + ff(hh) + '" rx="2" fill="#FFFFFF"/><g>' + st.svg + '</g>'
}
/* the width a label spec takes, in drawing units */
function labW(spec, fs) {
  if (spec && spec.ask) return 26
  if (spec == null || typeof spec === 'string' || typeof spec === 'number') return String(spec == null ? '' : spec).length * fs * 0.56 + 10
  const p = spec.inch != null ? parts(spec.inch, spec.den) : { w: spec.w || 0, n: spec.n, d: spec.d }
  if (!p.n) return String(p.w).length * fs * 0.6 + 14
  return stacked(0, 0, p.w, p.n, p.d, { s: fs, unit: spec.inch != null ? '″' : spec.unit }).w + 8
}
/* dimension line like F.dim, with a spec label */
function dim(x1, y1, x2, y2, spec, off, o) {
  o = o || {}
  off = off == null ? 24 : off
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux
  const a1 = [x1 + nx * off, y1 + ny * off], a2 = [x2 + nx * off, y2 + ny * off]
  const g = off >= 0 ? 1 : -1
  let h = F.line(x1 + nx * 3 * g, y1 + ny * 3 * g, x1 + nx * (off + 6 * g), y1 + ny * (off + 6 * g), { c: C.dim, w: 1.1 }) +
    F.line(x2 + nx * 3 * g, y2 + ny * 3 * g, x2 + nx * (off + 6 * g), y2 + ny * (off + 6 * g), { c: C.dim, w: 1.1 }) +
    F.line(a1[0], a1[1], a2[0], a2[1], { c: C.dim, w: 1.2 }) +
    F.arrowHead(a1[0], a1[1], Math.atan2(-uy, -ux)) + F.arrowHead(a2[0], a2[1], Math.atan2(uy, ux))
  const mx = o.lx != null ? o.lx : (a1[0] + a2[0]) / 2, my = (a1[1] + a2[1]) / 2 + 5 + (o.below || 0)
  return h + lab(mx, my, spec, { s: o.s || 13.5 })
}
/* tick length for a reading v (inches), by the finest fraction it sits on */
function tickLen(v) {
  const u = Math.round(v * 64)
  if (u % 64 === 0) return 32
  if (u % 32 === 0) return 25
  if (u % 16 === 0) return 20
  if (u % 8 === 0) return 15.5
  if (u % 4 === 0) return 11.5
  if (u % 2 === 0) return 8.5
  return 6
}
/* inch rule from o.from to o.to inches with ticks every 1/den.
   marks [{ v, name, lab, c }]: red pointer at v, a letter in a circle above, a spec label below */
function rule(o) {
  o = o || {}
  const from = o.from || 0, to = o.to == null ? 3 : o.to, den = o.den || 16, ppi = o.ppi || 180
  const marks = o.marks || []
  const anyName = marks.some(m => m.name), anyLab = marks.some(m => m.lab != null)
  const x0 = 26, y0 = anyName ? 34 : 16, bh = 58
  const X = v => x0 + (v - from) * ppi
  const W = (to - from) * ppi + 2 * x0
  let h = '<rect x="' + ff(x0 - 14) + '" y="' + y0 + '" width="' + ff((to - from) * ppi + 28) + '" height="' + bh + '" rx="3" fill="#FFF8E6" stroke="' + C.ink + '" stroke-width="1.2"/>'
  const N = Math.round((to - from) * den)
  for (let i = 0; i <= N; i++) {
    const v = from + i / den, x = X(v), L = tickLen(v) * (o.tick || 1)
    h += F.line(x, y0, x, y0 + L, { c: C.ink, w: Math.abs(v - Math.round(v)) < 1e-9 ? 1.6 : 1 })
  }
  for (let v = Math.ceil(from - 1e-9); v <= to + 1e-9; v++) {
    if (v === 0 && !o.zero) continue
    h += F.t(X(v), y0 + 51, String(v), { s: 15, b: true })
  }
  if (o.unitText) h += F.t(X(to) - 4, y0 + bh - 3, o.unitText, { s: 9.5, a: 'end', c: C.dim })
  marks.forEach(m => {
    const x = X(m.v), col = m.c || C.red
    if (m.tru) h += F.line(x, y0 + 1, x, y0 + tickLen(m.v) * (o.tick || 1), { c: col, w: 3.2 })
    else if (m.name) h += F.line(x, y0 - 6, x, y0 + 34, { c: col, w: 2 })
    else h += F.line(x, y0 - 3, x, y0 + 34, { c: col, w: 2 }) + '<path d="M' + ff(x) + ' ' + (y0 - 1) + 'l-5.5 -10h11z" fill="' + col + '"/>'
    if (m.name) h += '<circle cx="' + ff(x) + '" cy="' + (y0 - 17) + '" r="11" fill="' + col + '"/>' + F.t(x, y0 - 12.5, m.name, { s: 13, b: true, c: '#FFFFFF' })
    if (m.lab != null) h += lab(x, y0 + bh + 28, m.lab, { s: o.labS || 16, c: col })
  })
  const H = y0 + bh + (anyLab ? 46 : 8)
  return F.svg(W, H, h, { max: o.max || (W / 96).toFixed(2) + 'in' })
}
/* a strip of d equal parts with n shaded, and a stacked label to the right */
function bar(n, d, o) {
  o = o || {}
  const W = o.w || 360, H = o.h || 32, pw = W / d
  let h = ''
  for (let i = 0; i < d; i++) h += '<rect x="' + ff(2 + i * pw) + '" y="2" width="' + ff(pw) + '" height="' + H + '" fill="' + (i < n ? (o.fill || C.gold) : '#FFFFFF') + '" stroke="' + C.edge + '" stroke-width="1.5"/>'
  if (o.lab !== false) h += stacked(W + 34, H / 2 + 2, 0, n, d, { s: 17 }).svg
  return F.svg(W + (o.lab !== false ? 64 : 4), H + 4, h, { max: o.max })
}
/* bars of the same total width, one under another: rows [{ n, d }] */
function bars(rows, o) {
  o = o || {}
  const W = o.w || 400, H = o.h || 28, gap = o.gap || 12
  let h = ''
  rows.forEach((r, k) => {
    const y = 2 + k * (H + gap), pw = W / r.d
    for (let i = 0; i < r.d; i++) h += '<rect x="' + ff(2 + i * pw) + '" y="' + y + '" width="' + ff(pw) + '" height="' + H + '" fill="' + (i < r.n ? (r.fill || C.gold) : '#FFFFFF') + '" stroke="' + C.edge + '" stroke-width="1.4"/>'
    h += stacked(W + 36, y + H / 2 + 1, 0, r.n, r.d, { s: 16 }).svg
  })
  if (o.line != null) {
    const x = 2 + o.line * W
    h += F.line(x, 0, x, rows.length * (H + gap) - gap + 4, { c: C.red, w: 1.6, dash: '5 4' })
  }
  return F.svg(W + 66, rows.length * (H + gap) - gap + 6, h, { max: o.max })
}
/* fraction circles in a row: list [{ n, d }] with an optional caption spec under each */
function circles(list, o) {
  o = o || {}
  const R = o.r || 40, gap = o.gap || 22
  let h = '', x = 4
  list.forEach(it => {
    const cx = x + R, cy = R + 4
    if (it.d === 1) h += '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="' + (it.n ? C.gold : '#fff') + '" stroke="' + C.edge + '" stroke-width="1.5"/>'
    else for (let i = 0; i < it.d; i++) {
      const a1 = -Math.PI / 2 + i * 2 * Math.PI / it.d, a2 = a1 + 2 * Math.PI / it.d
      h += '<path d="M' + ff(cx) + ' ' + ff(cy) + 'L' + ff(cx + R * Math.cos(a1)) + ' ' + ff(cy + R * Math.sin(a1)) + 'A' + R + ' ' + R + ' 0 0 1 ' + ff(cx + R * Math.cos(a2)) + ' ' + ff(cy + R * Math.sin(a2)) + 'Z" fill="' + (i < it.n ? C.gold : '#FFFFFF') + '" stroke="' + C.edge + '" stroke-width="1.5"/>'
    }
    if (it.cap) h += lab(cx, 2 * R + 32, it.cap, { s: 15 })
    x += 2 * R + gap
  })
  const any = list.some(it => it.cap)
  return F.svg(x - gap + 8, 2 * R + (any ? 52 : 10), h, { max: o.max })
}
/* cut-list bar. pieces [{ len, lab (spec), ask, name }], o.total adds the leftover, o.fmt(v) gives the spec */
function cutBar(pieces, o) {
  o = o || {}
  const fmt = o.fmt || (v => ({ inch: v, den: o.den || 16 }))
  const all = pieces.slice()
  const used = pieces.reduce((a, p) => a + p.len, 0)
  const kerf = o.kerf || 0, nK = kerf ? pieces.length : 0
  if (o.total != null && o.total - used - nK * kerf > 1e-9) all.push({ len: o.total - used - nK * kerf, lab: o.restLab, ask: o.askRest, rest: true })
  const total = all.reduce((a, p) => a + p.len, 0)
  const W = o.w || 640, x0 = 22, y = 60, H = 34
  const sc = (W - 2 * x0) / (total + nK * kerf), kw = Math.max(kerf * sc, 4)
  let h = '', x = x0, kx = null
  all.forEach((p, i) => {
    let w = p.len * sc
    if (p.rest && nK) w -= nK * (kw - kerf * sc)
    h += '<rect x="' + ff(x) + '" y="' + y + '" width="' + ff(w) + '" height="' + H + '" fill="' + (p.rest ? '#FFFFFF' : (i % 2 ? C.fill2 : C.fill)) + '" stroke="' + C.edge + '" stroke-width="2"' + (p.rest ? ' stroke-dasharray="5 4"' : '') + '/>'
    if (p.name) h += F.t(x + w / 2, y + H / 2 + 5, p.name, { s: 13, b: true, c: C.edge })
    h += dim(x, y + H, x + w, y + H, p.ask ? { ask: true } : (p.lab != null ? p.lab : fmt(p.len)), 30, { s: o.s || 12.5 })
    x += w
    if (nK && !p.rest) {
      h += '<rect x="' + ff(x) + '" y="' + y + '" width="' + ff(kw) + '" height="' + H + '" fill="' + C.dim + '"/>'
      if (kx == null) kx = x + kw / 2
      x += kw
    }
  })
  if (kx != null && o.kerfLab) h += F.callout(kx, y + 3, kx + 70, y - 13, o.kerfLab, { s: o.ks || 12 })
  if (o.overall !== false) h += dim(x0, y, W - x0, y, o.askTotal ? { ask: true } : (o.totalLab != null ? o.totalLab : fmt(total + nK * kerf)), -30, { s: o.s || 13 })
  return F.svg(W, y + H + 58, h, { max: o.max || '6.4in' })
}
/* plate with a straight row of holes. ask: 'end' | 'space' | 'len' */
function holePlate(len, end, holes, o) {
  o = o || {}
  const fmt = o.fmt || (v => ({ inch: v, den: o.den || 16 }))
  const ls = o.ls || 13, W = o.w || 600, x0 = 64, sc = (W - 2 * x0) / len, y = 48, H = o.h || 70
  const sp = (len - 2 * end) / (holes - 1)
  const X = v => x0 + v * sc
  let h = F.rect(x0, y, len * sc, H)
  for (let i = 0; i < holes; i++) h += F.circle(X(end + i * sp), y + H / 2, o.r || 9, { fill: '#FFFFFF', w: 1.8 })
  /* tier 1: the end distances, labels under their lines and clear of the next hole. tier 2: the spacing */
  const below = ls * 1.25, t2 = 30 + ls * 2.1 + 22
  h += dim(X(end), y + H, X(end + sp), y + H, o.ask === 'space' ? { ask: true } : fmt(sp), t2, { s: ls })
  const eL = o.ask === 'end' ? { ask: true } : fmt(end), w1 = labW(eL, ls)
  h += dim(X(0), y + H, X(end), y + H, eL, 30, { s: ls, below: below, lx: Math.min(X(end / 2), X(end) - w1 / 2 - 3) })
  if (o.lastEnd !== false) {
    const w2 = labW(fmt(end), ls)
    h += dim(X(len - end), y + H, X(len), y + H, fmt(end), 30, { s: ls, below: below, lx: Math.max(X(len - end / 2), X(len - end) + w2 / 2 + 3) })
  }
  h += dim(X(0), y, X(len), y, o.ask === 'len' ? { ask: true } : fmt(len), -30, { s: ls })
  return F.svg(W, y + H + t2 + 34, h, { max: o.max || '5.6in' })
}
/* stepped shaft, side view. secs [{ len, dia, ask }], lengths dimensioned under, overall above.
   o.fmt(v) spec for lengths, o.dfmt(v) text for a diameter written inside the step, o.askTotal */
function shaft(secs, o) {
  o = o || {}
  const fmt = o.fmt || (v => ({ inch: v, den: o.den || 16 }))
  const total = secs.reduce((a, s) => a + s.len, 0)
  const maxD = Math.max(...secs.map(s => s.dia))
  const W = o.w || 620, x0 = 24, sc = (W - 2 * x0) / total
  const dsc = (o.hmax || 86) / maxD, cy = 50 + (o.hmax || 86) / 2
  let h = '', x = x0
  secs.forEach((s, i) => {
    const w = s.len * sc, hh = s.dia * dsc
    h += F.rect(x, cy - hh / 2, w, hh, { fill: i % 2 ? C.fill2 : C.fill })
    if (o.dfmt) h += F.t(x + w / 2, cy + 5, o.dfmt(s.dia, i), { s: 12, wgt: 600, c: C.edge })
    h += dim(x, cy + maxD * dsc / 2, x + w, cy + maxD * dsc / 2, s.ask ? { ask: true } : fmt(s.len), 30, { s: o.ls || 14.5 })
    x += w
  })
  h += F.line(x0 - 12, cy, x0 + total * sc + 12, cy, { c: C.grey, w: 1, dash: '12 4 3 4' })
  if (o.overall !== false) h += dim(x0, cy - maxD * dsc / 2, x0 + total * sc, cy - maxD * dsc / 2, o.askTotal ? { ask: true } : (o.totalLab != null ? o.totalLab : fmt(total)), -30, { s: o.ls || 14.5 })
  return F.svg(W, cy + maxD * dsc / 2 + 60, h, { max: o.max || '6in' })
}
/* L-shaped plate: overall W x H, upright leg width a, base height b. o.ask / o.hide lists of names W H a b c d */
function lPlate(Wd, Hd, a, b, o) {
  o = o || {}
  const fmt = o.fmt || (v => ({ inch: v, den: o.den || 16 }))
  const ask = o.ask || [], hide = o.hide || []
  const S = (o.size || 300) / Math.max(Wd, Hd), x0 = 70, y0 = 40
  const P = (x, y) => [x0 + x * S, y0 + (Hd - y) * S]
  let h = F.poly([P(0, 0), P(Wd, 0), P(Wd, b), P(a, b), P(a, Hd), P(0, Hd)])
  const D = (k, p1, p2, v, off) => hide.includes(k) ? '' : dim(p1[0], p1[1], p2[0], p2[1], ask.includes(k) ? { ask: true } : fmt(v), off, { s: o.ls || 12.5 })
  h += D('W', P(0, 0), P(Wd, 0), Wd, 30)
  h += D('H', P(0, 0), P(0, Hd), Hd, -36)
  h += D('a', P(0, Hd), P(a, Hd), a, -30)
  h += D('b', P(Wd, 0), P(Wd, b), b, 34)
  h += D('c', P(a, b), P(Wd, b), Wd - a, -30)
  h += D('d', P(a, b), P(a, Hd), Hd - b, 36)
  if (o.split) {
    h += F.line(P(a, 0)[0], P(a, 0)[1], P(a, b)[0], P(a, b)[1], { c: C.dim, w: 1.4, dash: '6 4' })
    h += F.t(P(a / 2, Hd / 2)[0], P(a / 2, Hd / 2)[1] + 5, 'A', { s: 16, b: true, c: C.edge })
    h += F.t(P((a + Wd) / 2, b / 2)[0], P((a + Wd) / 2, b / 2)[1] + 5, 'B', { s: 16, b: true, c: C.edge })
  }
  return F.svg(x0 + Wd * S + 90, y0 + Hd * S + 64, h, { max: o.max || '3.8in' })
}
/* rectangle plate with any of its sides dimensioned. o.fmt, o.ask ['l','w'] */
function plate(l, w, o) {
  o = o || {}
  const fmt = o.fmt || (v => ({ inch: v, den: o.den || 16 }))
  const ask = o.ask || []
  const S = (o.size || 300) / Math.max(l, w), x0 = 60, y0 = 44
  let h = F.rect(x0, y0, l * S, w * S)
  if (o.holes) o.holes.forEach(p => { h += F.circle(x0 + p[0] * S, y0 + (w - p[1]) * S, o.hr || 8, { fill: '#FFFFFF', w: 1.6 }) })
  h += dim(x0, y0, x0 + l * S, y0, ask.includes('l') ? { ask: true } : fmt(l), -30, { s: 12.5 })
  h += dim(x0, y0 + w * S, x0, y0, ask.includes('w') ? { ask: true } : fmt(w), -36, { s: 12.5 })
  return F.svg(x0 + l * S + 30, y0 + w * S + 20, h, { max: o.max || '3.6in' })
}
module.exports = { gcd, parts, stacked, lab, labW, dim, rule, bar, bars, circles, cutBar, holePlate, shaft, lPlate, plate, tickLen }
