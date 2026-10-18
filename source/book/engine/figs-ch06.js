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
module.exports = { fit, fitSvg, allowBar, pctGrid, mixBar, scalePlate, tri, rect2, side, num }
