/* Drawing helpers for Chapter 6 (Percent, Ratio and Proportion), used by the Exercise Book.
   Each drawing is sized so that its smallest label prints at about 7.3 pt or more:
   width in inches = svg width × 7.3 ÷ (72 × smallest font size in svg units). */
const F = require('./figs.js')
const C = F.C
const range = k => Array.from({ length: k }, (_, i) => i)
const num = x => {
  let s = String(parseFloat((+x).toFixed(9)))
  const neg = s[0] === '-'
  if (neg) s = s.slice(1)
  const p = s.split('.')
  if (p[0].length >= 4) p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return (neg ? '−' : '') + p.join('.')
}
/* the print width that keeps a label of font size fs at 7.3 pt or more */
function fit(W, fs, min) {
  const need = W * 7.3 / (72 * fs)
  return Math.max(need, min || 0).toFixed(2) + 'in'
}
/* 10 by 10 grid with the first k squares shaded */
function pctGrid(k, o) {
  o = o || {}
  const g = o.g || 16, x0 = 4, y0 = 4
  let h = ''
  range(100).forEach(i => {
    const r = Math.floor(i / 10), c = i % 10
    h += '<rect x="' + (x0 + c * g) + '" y="' + (y0 + r * g) + '" width="' + g + '" height="' + g + '" fill="' + (i < k ? C.gold : '#FFFFFF') + '" stroke="' + C.edge + '" stroke-width="1"/>'
  })
  h += '<rect x="' + x0 + '" y="' + y0 + '" width="' + 10 * g + '" height="' + 10 * g + '" fill="none" stroke="' + C.edge + '" stroke-width="2.2"/>'
  return F.svg(x0 * 2 + 10 * g, y0 * 2 + 10 * g, h, { max: o.max || '1.4in' })
}
/* groups [{k, name, fill}] of equal unit blocks with a bracket and name under each group */
function mixBar(groups, o) {
  o = o || {}
  const u = o.u || 48, x0 = 30, y = 10, H = 36, fs = 16
  const T = groups.reduce((a, g) => a + g.k, 0)
  let h = '', x = x0
  groups.forEach(g => {
    const gx = x
    range(g.k).forEach(() => {
      h += '<rect x="' + F.f(x) + '" y="' + y + '" width="' + u + '" height="' + H + '" fill="' + (g.fill || C.fill) + '" stroke="' + C.edge + '" stroke-width="1.8"/>'
      x += u
    })
    h += F.line(gx + 3, y + H + 9, x - 3, y + H + 9, { c: C.dim, w: 1.2 }) + F.line(gx + 3, y + H + 4, gx + 3, y + H + 9, { c: C.dim, w: 1.2 }) + F.line(x - 3, y + H + 4, x - 3, y + H + 9, { c: C.dim, w: 1.2 })
    h += F.t((gx + x) / 2, y + H + 28, g.name, { s: fs, b: true, c: C.edge })
  })
  const W = x0 * 2 + T * u
  return F.svg(W, y + H + 36, h, { max: fit(W, fs, o.min) })
}
/* a plate drawn on paper, with drawing sizes and a scale note */
function scalePlate(dl, dw, scale, o) {
  o = o || {}
  const ppm = o.ppm || 3, x0 = 64, y0 = 40, fs = 16
  const W = dl * ppm, H = dw * ppm
  let h = F.rect(x0, y0, W, H)
  h += F.dim(x0, y0 + H, x0 + W, y0 + H, num(dl) + ' mm', 28, { s: fs })
  h += F.dim(x0, y0, x0, y0 + H, num(dw) + ' mm', 30, { s: fs })
  h += '<rect x="' + (x0 + W - 136) + '" y="4" width="136" height="28" fill="#FFFFFF" stroke="' + C.ink + '" stroke-width="1.2"/>' + F.t(x0 + W - 68, 24, 'SCALE ' + scale, { s: fs, b: true })
  const SW = x0 + W + 20
  return F.svg(SW, y0 + H + 46, h, { max: fit(SW, fs, o.min) })
}
/* right triangle to scale: base and height dimensions, ask 'b' or 'h', name under it */
function tri(b, hgt, sc, o) {
  o = o || {}
  const x0 = 76, fs = 16, yb = 14 + hgt * sc
  const A = [x0, yb], Bp = [x0 + b * sc, yb], Cp = [x0, yb - hgt * sc]
  let h = F.poly([A, Bp, Cp]) + F.rightMark(A, [1, 0], [0, -1])
  if (o.out) {
    /* short sides: the dimension lines stay clear and each label sits outside its line */
    const bare = s => s.replace(new RegExp('<rect [^>]*fill="' + C.white + '"/><text [^>]*>[^<]*</text>'), '')
    h += bare(F.dim(A[0], A[1], Bp[0], Bp[1], 'x', 22, { s: fs })) + F.t(x0 + b * sc / 2, yb + 44, num(b) + ' mm', { s: fs, wgt: 600 })
    h += bare(F.dim(A[0], A[1], Cp[0], Cp[1], 'x', -22, { s: fs })) + F.t(x0 - 28, yb - hgt * sc / 2 + 6, num(hgt) + ' mm', { s: fs, wgt: 600, a: 'end' })
    if (o.name) h += F.t(x0 + b * sc / 2, yb + 66, o.name, { s: fs, b: true, c: C.edge })
    const W2 = x0 + b * sc + 20 + 18
    return F.svg(W2, yb + 72, h, { vb: [-18, 0, W2, yb + 72], max: o.k ? (W2 / 96 * o.k).toFixed(2) + 'in' : fit(W2, fs) })
  }
  h += F.dim(A[0], A[1], Bp[0], Bp[1], o.ask === 'b' ? '?' : num(b) + ' mm', 26, { ask: o.ask === 'b', s: fs })
  h += F.dim(A[0], A[1], Cp[0], Cp[1], o.ask === 'h' ? '?' : num(hgt) + ' mm', -30, { ask: o.ask === 'h', s: fs })
  if (o.name) h += F.t(x0 + b * sc / 2, yb + 58, o.name, { s: fs, b: true, c: C.edge })
  const W = x0 + b * sc + 20
  return F.svg(W, yb + 64, h, { max: o.k ? (W / 96 * o.k).toFixed(2) + 'in' : fit(W, fs) })
}
/* rectangle with a length below and a width on the right. o.askW, o.askL hide one */
function rect2(l, w, sc, labL, labW, o) {
  o = o || {}
  const x0 = 12, y0 = 12, W = l * sc, H = w * sc, fs = 16
  let h = F.rect(x0, y0, W, H)
  h += F.dim(x0, y0 + H, x0 + W, y0 + H, o.askL ? '?' : labL, 26, { ask: o.askL, s: fs })
  h += F.dim(x0 + W, y0 + H, x0 + W, y0, o.askW ? '?' : labW, 28, { ask: o.askW, s: fs })
  const SW = x0 + W + (o.askW ? 50 : 16 + String(labW).length * 9.5 + 30)
  return F.svg(SW, y0 + H + 48, h, { max: fit(SW, fs, o.min) })
}
/* a needed length plus an allowance piece. The main length is dimensioned below, the allowance gets a short
   leader to a label outside the bar, and the overall length above is a ? chip */
function allowBar(main, extra, labMain, labExtra, o) {
  o = o || {}
  const W = o.w || 360, x0 = 16, y = 52, H = 32, fs = 16
  const sc = (W - 150) / (main + extra)
  const xm = x0 + main * sc, xe = xm + extra * sc
  let h = '<rect x="' + x0 + '" y="' + y + '" width="' + F.f(main * sc) + '" height="' + H + '" fill="' + C.fill + '" stroke="' + C.edge + '" stroke-width="2"/>'
  h += '<rect x="' + F.f(xm) + '" y="' + y + '" width="' + F.f(extra * sc) + '" height="' + H + '" fill="' + C.fill2 + '" stroke="' + C.edge + '" stroke-width="2"/>'
  h += F.dim(x0, y + H, xm, y + H, labMain, 26, { s: fs })
  h += F.dim(x0, y, xe, y, '?', -26, { ask: true, s: fs })
  const mx = (xm + xe) / 2
  h += F.line(mx, y + H / 2, xe + 26, y + H + 22, { c: C.deep, w: 1.3 }) + '<circle cx="' + F.f(mx) + '" cy="' + (y + H / 2) + '" r="2.6" fill="' + C.deep + '"/>'
  h += F.t(xe + 30, y + H + 28, labExtra, { s: fs, b: true, a: 'start', c: C.deep })
  return F.svg(W, y + H + 46, h, { max: fit(W, fs, o.min) })
}
/* set the print width of any svg so that text of size fs prints at 7.3 pt or more */
function fitSvg(svg, fs) {
  const w = +(/viewBox="[-\d.]+ [-\d.]+ ([\d.]+)/.exec(svg) || [0, 400])[1]
  return svg.replace(/max-width:[\d.]+in/, 'max-width:' + fit(w, fs))
}
const side = (...svgs) => '<div style="display:flex;justify-content:center;align-items:flex-end;gap:24px">' + svgs.join('') + '</div>'

/* ---------- stacked fractions inside drawings ----------
   parts: a list of plain strings and [numerator, denominator] pairs, for example ['3′ 4', [1, 2], '″'].
   The fraction is stacked with a bar, the same way L.fr prints it in the text. Digits of the fraction print at
   0.86 of the font size, so a drawing that uses frT is fitted on that smaller size. */
const FR_K = 0.86
const cw = (s, fs) => String(s).split('').reduce((a, ch) => a + fs * (/[′″'.,: ]/.test(ch) ? 0.3 : 0.58), 0)
function frWidth(parts, fs) {
  return parts.reduce((a, p) => a + (Array.isArray(p) ? Math.max(cw(p[0], fs * FR_K), cw(p[1], fs * FR_K)) + 5 : cw(p, fs)), 0)
}
/* text with stacked fractions. y is the baseline of the plain text. o: s, c, b, a ('middle', 'start', 'end') */
function frT(x, y, parts, o) {
  o = o || {}
  const fs = o.s || 14, ff = fs * FR_K, W = frWidth(parts, fs)
  let cx = o.a === 'start' ? x : o.a === 'end' ? x - W : x - W / 2
  const wgt = o.b ? 700 : (o.wgt || 600), col = o.c || C.ink
  const yc = y - fs * 0.34
  let h = '<g font-weight="' + wgt + '" fill="' + col + '">'
  parts.forEach(p => {
    if (Array.isArray(p)) {
      const w = Math.max(cw(p[0], ff), cw(p[1], ff)) + 5, mx = cx + w / 2
      h += '<text x="' + F.f(mx) + '" y="' + F.f(yc - 2.2) + '" text-anchor="middle" font-size="' + F.f(ff) + '">' + p[0] + '</text>'
      h += '<path d="M' + F.f(cx + 1.5) + ' ' + F.f(yc) + 'H' + F.f(cx + w - 1.5) + '" stroke="' + col + '" stroke-width="1.1"/>'
      h += '<text x="' + F.f(mx) + '" y="' + F.f(yc + ff * 0.74 + 2) + '" text-anchor="middle" font-size="' + F.f(ff) + '">' + p[1] + '</text>'
      cx += w
    } else {
      h += '<text x="' + F.f(cx) + '" y="' + F.f(y) + '" text-anchor="start" font-size="' + fs + '">' + F.esc(p) + '</text>'
      cx += cw(p, fs)
    }
  })
  return h + '</g>'
}
/* the same text on a white label chip, centred on (x, y) like F.label */
function chipFr(x, y, parts, o) {
  o = o || {}
  const fs = o.s || 14, W = frWidth(parts, fs) + 10, hasF = parts.some(Array.isArray)
  const top = hasF ? y - fs * 0.34 - fs * FR_K * 0.74 - 5 : y - fs + 0.5, bot = hasF ? y - fs * 0.34 + fs * FR_K * 0.74 + 5 : y + 5.5
  return '<rect x="' + F.f(x - W / 2) + '" y="' + F.f(top) + '" width="' + F.f(W) + '" height="' + F.f(bot - top) + '" rx="2" fill="' + C.white + '"/>' + frT(x, y, parts, o)
}
/* a callout (leader line to a note box) whose note can hold stacked fractions */
function calloutFr(px, py, bx, by, parts, o) {
  o = o || {}
  const fs = o.s || 14, w = frWidth(parts, fs) + 16, hasF = parts.some(Array.isArray), hh = hasF ? fs * 2.1 : fs + 10
  return F.line(px, py, bx, by, { c: C.deep, w: 1.2 }) + '<circle cx="' + F.f(px) + '" cy="' + F.f(py) + '" r="2.6" fill="' + C.deep + '"/>' +
    '<rect x="' + F.f(bx - w / 2) + '" y="' + F.f(by - hh / 2) + '" width="' + F.f(w) + '" height="' + F.f(hh) + '" rx="4" fill="' + C.white + '" stroke="' + C.deep + '" stroke-width="1.2"/>' +
    frT(bx, by + fs * 0.36, parts, { s: fs, c: C.deep })
}
/* replace the labels of an svg made by figs.js (dim or label) that read token with stacked-fraction labels.
   map: { token: parts }. Each token must be unique text in the svg. */
function swapLabels(svg, map, fs) {
  Object.keys(map).forEach(tok => {
    const re = new RegExp('<rect x="[-\\d.]+" y="[-\\d.]+" width="[-\\d.]+" height="[-\\d.]+" rx="2" fill="' + C.white + '"/><text x="([-\\d.]+)" y="([-\\d.]+)"[^>]*>' + tok + '</text>')
    const m = re.exec(svg)
    if (!m) throw new Error('swapLabels: no label ' + tok)
    svg = svg.replace(re, chipFr(+m[1], +m[2], map[tok], { s: fs }))
  })
  return svg
}
/* cut-list bar (figs.cutBar) whose piece labels are feet and inches with stacked fractions.
   pieces: [{len, parts}] or [{len, ask: true}]. Fitted so the fraction digits print at 7.3 pt or more. */
function cutBarFr(pieces, o) {
  o = o || {}
  const W = o.w || 360, map = {}
  const ps = pieces.map((p, i) => { if (p.parts) map['QZ' + i + 'Q'] = p.parts; return Object.assign({}, p, { lab: p.parts ? 'QZ' + i + 'Q' : p.lab }) })
  const fs = o.fs || 13
  let s = F.cutBar(ps, Object.assign({ unit: '' }, o, { w: W }))
  s = swapLabels(s, map, fs)
  return s.replace(/max-width:[\d.]+in/, 'max-width:' + fit(W, fs * FR_K))
}
/* inch ruler with ticks to 1/den and red marks [{v, parts}] whose labels are stacked mixed numbers.
   o.line: also draw the measured line above the ruler from 0 to the first mark, with 0 labelled at both. */
function rulerFr(len, den, marks, o) {
  o = o || {}
  const ppi = o.ppi || 64, x0 = 24, top = o.line ? 54 : 8, y0 = top, fs = 15
  const W = len * ppi + 48
  let h = ''
  if (o.line) {
    const xe = x0 + marks[0].v * ppi
    h += F.line(x0, 28, xe, 28, { c: C.edge, w: 3.2 }) + F.line(x0, 21, x0, 35, { c: C.edge, w: 1.6 }) + F.line(xe, 21, xe, 35, { c: C.edge, w: 1.6 })
    h += F.t((x0 + xe) / 2, 15, o.lineLab || 'line on the drawing', { s: 14, c: C.edge, wgt: 600 })
    h += F.line(x0, 35, x0, y0, { c: C.grey, w: 1, dash: '3 3' }) + F.line(xe, 35, xe, y0 - 4, { c: C.grey, w: 1, dash: '3 3' })
  }
  h += '<rect x="' + (x0 - 10) + '" y="' + y0 + '" width="' + (len * ppi + 20) + '" height="56" rx="3" fill="' + C.fill2 + '" stroke="' + C.ink + '" stroke-width="1.2"/>'
  for (let i = 0; i <= len * den; i++) {
    const x = x0 + i / den * ppi
    let L
    if (i % den === 0) L = 30; else if (i % (den / 2) === 0) L = 22; else if (den >= 4 && i % (den / 4) === 0) L = 16; else if (den >= 8 && i % (den / 8) === 0) L = 11; else L = 7
    h += F.line(x, y0, x, y0 + L, { c: C.ink, w: i % den === 0 ? 1.6 : 1 })
    if (i % den === 0) h += F.t(x, y0 + 47, String(i / den), { s: fs, b: true })
  }
  marks.forEach(mk => {
    const x = x0 + mk.v * ppi
    h += F.line(x, y0 - 4, x, y0 + 40, { c: C.red, w: 2 }) + '<path d="M' + F.f(x) + ' ' + (y0 + 40) + 'l-5 9h10z" fill="' + C.red + '"/>'
    if (mk.parts) h += frT(x, y0 + 75, mk.parts, { s: fs, c: C.red, b: true })
  })
  const H = y0 + 83
  return F.svg(W, H, h, { max: o.max || fit(W, fs * FR_K) })
}
/* a shed roof seen from the end: run along the bottom, rise up the wall at the right, and the carpenter's slope
   mark (a small triangle on the roof line with 12 across and the rise up). o.runLab, o.riseLab ('?' for a chip),
   o.mark: [rise, 12] for the slope mark. Drawn to the true slope. */
function roofTri(slope, o) {
  o = o || {}
  const fs = 16, W = o.w || 300, H = W * slope, x0 = 24, yb = 22 + Math.max(H, 40) + 40
  const A = [x0, yb], Bp = [x0 + W, yb], Cp = [x0 + W, yb - H]
  let h = F.poly([A, Bp, Cp]) + F.rightMark(Bp, [-1, 0], [0, -1])
  h += F.dim(A[0], A[1], Bp[0], Bp[1], o.runLab || '', 26, { s: fs, ask: o.runLab === '?' })
  h += F.dim(Bp[0], Bp[1], Cp[0], Cp[1], o.riseLab || '', 30, { s: fs, ask: o.riseLab === '?' })
  if (o.mark) {
    const L = 64, t = 0.26, P = [x0 + W * t, yb - H * t], Q = [P[0], P[1] - L * slope], R = [P[0] + L, P[1] - L * slope]
    h += F.line(P[0], P[1], Q[0], Q[1], { c: C.red, w: 1.8 }) + F.line(Q[0], Q[1], R[0], R[1], { c: C.red, w: 1.8 })
    h += F.t(Q[0] - 8, (P[1] + Q[1]) / 2 + 6, String(o.mark[0]), { s: fs, b: true, c: C.red, a: 'end' })
    h += F.t((Q[0] + R[0]) / 2, Q[1] - 8, String(o.mark[1]), { s: fs, b: true, c: C.red })
  }
  const SW = x0 + W + 90
  return F.svg(SW, yb + 50, h, { max: o.max || fit(SW, fs) })
}
module.exports = { fit, fitSvg, allowBar, pctGrid, mixBar, scalePlate, tri, rect2, side, num, roofTri, frT, chipFr, calloutFr, swapLabels, cutBarFr, rulerFr, frWidth, FR_K }
