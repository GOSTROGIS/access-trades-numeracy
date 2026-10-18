/* Drawing helpers for Chapter 7 (Measurement and Unit Conversion), used by the Exercise Book.
   Drawings are sized so that the smallest label prints at about 7.3 pt or more (see figs-ch06.js fit). */
const F = require('./figs.js')
const G6 = require('./figs-ch06.js')
const C = F.C
const fit = G6.fit
const range = k => Array.from({ length: k }, (_, i) => i)
/* a square split into n by n smaller squares, with a side label and a total note */
function unitGrid(nn, g, side, note1, note2, sideL) {
  const x0 = 70, y0 = 10, fs = 16
  let h = ''
  range(nn * nn).forEach(i => { h += '<rect x="' + (x0 + (i % nn) * g) + '" y="' + (y0 + Math.floor(i / nn) * g) + '" width="' + g + '" height="' + g + '" fill="' + (i === 0 ? C.gold : C.fill2) + '" stroke="' + C.edge + '" stroke-width="1"/>' })
  h += '<rect x="' + x0 + '" y="' + y0 + '" width="' + nn * g + '" height="' + nn * g + '" fill="none" stroke="' + C.edge + '" stroke-width="2.2"/>'
  h += F.dim(x0, y0 + nn * g, x0 + nn * g, y0 + nn * g, side, 26, { s: fs })
  h += F.dim(x0, y0, x0, y0 + nn * g, sideL || side, 30, { s: fs })
  h += F.t(x0 + nn * g + 18, y0 + nn * g / 2 - 6, note1, { s: fs, b: true, a: 'start', c: C.edge }) + F.t(x0 + nn * g + 18, y0 + nn * g / 2 + 16, note2, { s: fs, b: true, a: 'start' })
  const W = x0 + nn * g + 150
  return F.svg(W, y0 + nn * g + 52, h, { max: fit(W, fs) })
}
/* a flat plate with a hole and three callouts */
function platCallouts(c1, c2, c3) {
  const fs = 16
  let h = F.rect(60, 70, 300, 70) + F.circle(250, 105, 16, { fill: '#FFFFFF', w: 1.8 })
  h += '<path d="M360 70l14 -10v70l-14 10z" fill="' + C.fill2 + '" stroke="' + C.edge + '" stroke-width="1.8"/>' + '<path d="M60 70l14 -10h300l-14 10z" fill="' + C.fill2 + '" stroke="' + C.edge + '" stroke-width="1.8"/>'
  h += F.callout(250, 105, 300, 172, c1, { s: fs })
  h += F.callout(110, 66, 110, 22, c2, { s: fs })
  h += F.callout(367, 100, 330, 22, c3, { s: fs })
  return F.svg(430, 192, h, { max: fit(430, fs) })
}
/* Celsius and Fahrenheit scales. marks [{c, askF, askC}] */
function thermo(marks) {
  const top = 40, bot = 236, x1 = 120, x2 = 300, fs = 17, lo = -40, hi = 100
  const Y = c => bot - (c - lo) / (hi - lo) * (bot - top)
  let h = F.line(x1, top - 8, x1, bot + 8, { c: C.ink, w: 3 }) + F.line(x2, top - 8, x2, bot + 8, { c: C.ink, w: 3 })
  h += F.t(x1, 20, '°C', { s: 18, b: true, c: C.edge }) + F.t(x2, 20, '°F', { s: 18, b: true, c: C.edge })
  marks.forEach(m => {
    const y = Y(m.c), fv = 1.8 * m.c + 32
    h += F.line(x1, y, x2, y, { c: C.grey, w: 1, dash: '4 4' }) + F.line(x1 - 8, y, x1 + 8, y, { c: C.ink, w: 1.6 }) + F.line(x2 - 8, y, x2 + 8, y, { c: C.ink, w: 1.6 })
    h += m.askC ? F.label(x1 - 34, y + 6, '?', { ask: true, s: fs }) : F.t(x1 - 14, y + 6, G6.num(m.c) + ' °C', { s: fs, wgt: 600, a: 'end' })
    h += m.askF ? F.label(x2 + 34, y + 6, '?', { ask: true, s: fs }) : F.t(x2 + 14, y + 6, G6.num(fv) + ' °F', { s: fs, wgt: 600, a: 'start' })
  })
  return F.svg(420, 254, h, { max: fit(420, fs) })
}
module.exports = { fit, unitGrid, platCallouts, thermo, rect2: G6.rect2 }
