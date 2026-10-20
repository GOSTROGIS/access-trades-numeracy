/* Drawing and working helpers for Chapter 1 (Whole Numbers), also used by Chapter 5 (Decimals).
   Every number a helper prints is computed here from its inputs. */
const F = require('./figs.js')
const C = F.C
const ff = F.f
const MONO = 'IBM Plex Mono, DejaVu Sans Mono, monospace'
const com = v => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

/* ---------- long multiplication in columns ----------
   colMul(347, 26) draws the top number, the multiplier, one partial product for each digit of the multiplier
   (placeholder zeros in red), and the sum. Returns { svg, rows: [{ digit, place, value }], product } */
function colMul(a, b, o) {
  o = o || {}
  const bs = String(b), as = String(a)
  const rows = []
  for (let k = 0; k < bs.length; k++) {
    const dgt = +bs[bs.length - 1 - k]
    if (dgt || k === 0) rows.push({ digit: dgt, place: k, value: a * dgt * Math.pow(10, k) })
  }
  const prod = a * b
  const ncol = Math.max(String(prod).length, as.length, bs.length + 1, ...rows.map(r => String(r.value).length)) + 1
  const cw = o.cw || 24, fs = o.s || 22, rh = fs * 1.5, x0 = 18, labX = x0 + ncol * cw + 18
  const R = (i) => x0 + (ncol - i) * cw - cw / 2   /* centre of the column i places from the right (i = 1 is ones) */
  let h = '', y = fs + 8
  const put = (str, yy, opt) => {
    const s = String(str)
    for (let i = 0; i < s.length; i++) {
      const col = s.length - i
      const red = opt && opt.zeros && col <= opt.zeros
      h += F.t(R(col), yy, s[i], { s: fs, wgt: 600, c: red ? C.red : C.ink, family: MONO })
    }
  }
  put(as, y)
  y += rh
  put(bs, y)
  h += F.t(R(bs.length + 1), y, '×', { s: fs, wgt: 600, c: C.ink })
  h += F.line(R(ncol) - cw / 2 + 4, y + 9, x0 + ncol * cw, y + 9, { c: C.ink, w: 1.8 })
  rows.forEach(r => {
    y += rh
    put(r.value === 0 ? '0'.repeat(r.place + 1) : String(r.value), y, { zeros: r.place })
    if (o.labels !== false) h += F.t(labX, y, as + ' × ' + (r.digit * Math.pow(10, r.place)), { s: fs * 0.66, a: 'start', c: C.dim, wgt: 500 })
  })
  if (rows.length > 1) {
    h += F.t(R(String(prod).length + 1), y, '+', { s: fs, wgt: 600, c: C.ink })
    h += F.line(R(ncol) - cw / 2 + 4, y + 9, x0 + ncol * cw, y + 9, { c: C.ink, w: 1.8 })
    y += rh
    put(String(prod), y)
    if (o.labels !== false) h += F.t(labX, y, 'product', { s: fs * 0.66, a: 'start', c: C.edge, wgt: 700 })
  }
  const W = labX + (o.labels !== false ? (as.length + 8) * fs * 0.42 : 0) + 6
  return { svg: F.svg(W, y + 12, h, { max: o.max || (W / 96 * 0.9).toFixed(2) + 'in' }), rows, product: prod }
}
/* the step-by-step working of colMul as sentences */
function colMulSteps(a, b) {
  const r = colMul(a, b).rows
  const fmt = v => com(v)
  const bs = String(b)
  const skipped = []
  for (let k = 1; k < bs.length; k++) if (bs[bs.length - 1 - k] === '0') skipped.push(['tens', 'hundreds', 'thousands'][k - 1])
  const out = r.map(x => {
    const mult = x.digit * Math.pow(10, x.place)
    const name = ['ones', 'tens', 'hundreds', 'thousands'][x.place]
    if (x.place === 0) return 'Multiply ' + fmt(a) + ' by the ones digit, ' + x.digit + ': ' + fmt(a) + ' × ' + x.digit + ' = ' + fmt(x.value) + '.'
    return 'Multiply by the ' + name + ' digit, ' + x.digit + ', which is worth ' + fmt(mult) + '. Write ' + (x.place === 1 ? 'a zero' : x.place + ' zeros') + ' to hold the place, then ' + fmt(a) + ' × ' + x.digit + ' = ' + fmt(a * x.digit) + ' goes in front: ' + fmt(x.value) + '.'
  })
  if (skipped.length) out.splice(1, 0, 'The ' + skipped.join(' and ') + ' digit is 0, so that row would be all zeros. Skip it, but keep the zeros that hold the places in the next row.')
  out.push('Add the partial products: ' + r.map(x => fmt(x.value)).join(' + ') + ' = ' + fmt(a * b) + '.')
  return out
}

/* ---------- long division ----------
   divSteps(dividend, divisor, places) divides digit by digit, carrying on past the decimal point for `places`
   decimal places (adding zeros). Returns { q (string), rem, steps: [sentences] }.
   dividend is a whole number or a decimal given as a string, for example '4500' or '2.5' */
function divSteps(dividend, divisor, places) {
  places = places || 0
  const s = String(dividend)
  let [w, d] = s.split('.')
  d = d || ''
  const digits = (w + d).split('').map(Number)
  const pointAfter = w.length            /* the quotient's point goes after this many digits */
  const total = Math.max(digits.length, pointAfter + places)
  while (digits.length < total) digits.push(0)
  let rem = 0, q = '', started = false
  const steps = []
  for (let i = 0; i < total; i++) {
    const cur = rem * 10 + digits[i]
    const qd = Math.floor(cur / divisor)
    const prod = qd * divisor
    const newRem = cur - prod
    const added = i >= (w + d).length
    if (i === pointAfter && i > 0) q += '.'
    if (qd > 0 || started || i >= pointAfter - 1) {
      q += qd
      started = true
    }
    if (cur < divisor && !started) {
      rem = newRem
      continue
    }
    let txt = ''
    if (i === pointAfter && i > 0) txt += 'Write the point in the answer. '
    if (added) txt += 'Write a 0 at the end of the number and bring it down to make ' + cur + '. '
    else if (steps.length) txt += 'Bring down the ' + digits[i] + ' to make ' + cur + '. '
    else txt += 'Start with ' + cur + '. '
    txt += divisor + ' goes into ' + cur + ' ' + (qd === 0 ? 'zero times. Write 0.' : (qd === 1 ? 'once' : qd === 2 ? 'twice' : qd + ' times') + ': ' + qd + ' × ' + divisor + ' = ' + prod + ', and ' + cur + ' − ' + prod + ' = ' + newRem + '.')
    steps.push(txt)
    rem = newRem
  }
  if (q.startsWith('.')) q = '0' + q
  return { q, rem, steps }
}

/* ---------- column addition and subtraction drawn as working (used for answer working text) ---------- */
function carriesAdd(nums) {
  const L = Math.max(...nums.map(v => String(v).length))
  let carry = 0
  const out = []
  for (let k = 0; k < L + 1; k++) {
    const sum = nums.reduce((a, v) => a + Math.floor(v / Math.pow(10, k)) % 10, 0) + carry
    if (k >= L && !sum) break
    out.push({ place: k, sum, write: sum % 10, carry: Math.floor(sum / 10) })
    carry = Math.floor(sum / 10)
  }
  return out
}

/* ---------- an analog clock face ----------
   clock(h, m, o): hands at h:m. o.r radius, o.lab text under the face, o.max */
function clock(h, m, o) {
  o = o || {}
  const R = o.r || 80, cx = R + 10, cy = R + 10
  let s = '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="' + C.white + '" stroke="' + C.edge + '" stroke-width="3"/>'
  for (let i = 0; i < 60; i++) {
    const a = i / 60 * 2 * Math.PI, big = i % 5 === 0
    const r1 = R - (big ? 10 : 5), r2 = R - 2
    s += F.line(cx + r1 * Math.sin(a), cy - r1 * Math.cos(a), cx + r2 * Math.sin(a), cy - r2 * Math.cos(a), { c: C.ink, w: big ? 2 : 1 })
  }
  for (let k = 1; k <= 12; k++) {
    const a = k / 12 * 2 * Math.PI, rr = R - 25
    s += F.t(cx + rr * Math.sin(a), cy - rr * Math.cos(a) + 6, String(k), { s: o.ns || 15, b: true })
  }
  const am = m / 60 * 2 * Math.PI, ah = ((h % 12) + m / 60) / 12 * 2 * Math.PI
  s += F.line(cx, cy, cx + R * 0.48 * Math.sin(ah), cy - R * 0.48 * Math.cos(ah), { c: C.ink, w: 5.5 })
  s += F.line(cx, cy, cx + R * 0.78 * Math.sin(am), cy - R * 0.78 * Math.cos(am), { c: C.red, w: 3 })
  s += '<circle cx="' + cx + '" cy="' + cy + '" r="5" fill="' + C.ink + '"/>'
  let H = 2 * R + 20
  if (o.lab) {
    s += F.t(cx, H + 18, o.lab, { s: o.ls || 17, b: true, c: o.ask ? C.red : C.ink })
    H += 28
  }
  return F.svg(2 * R + 20, H, s, { max: o.max || '1.6in' })
}

/* ---------- bar graph and line graph ----------
   data [{ lab, v }], o: { title axis label (yLab), step (gridline step), max (svg width), w, h, valueLabels } */
function axes(data, o) {
  const W = o.w || 560, H = o.h || 250, left = 62, right = 16, top = 18, bottom = 46
  const vmax = o.ymax || Math.ceil(Math.max(...data.map(d => d.v)) / o.step) * o.step
  const Y = v => top + (H - top - bottom) * (1 - v / vmax)
  let s = ''
  for (let v = 0; v <= vmax + 1e-9; v += o.step) {
    s += F.line(left, Y(v), W - right, Y(v), { c: v ? C.light : C.ink, w: v ? 1 : 1.6 })
    s += F.t(left - 8, Y(v) + 5, com(v), { s: 14, a: 'end', c: C.dim })
  }
  s += F.line(left, top - 4, left, Y(0), { c: C.ink, w: 1.6 })
  if (o.yLab) s += F.t(16, (top + Y(0)) / 2, o.yLab, { s: 14, wgt: 600, c: C.dim, rot: -90 })
  return { s, W, H, left, right, top, bottom, Y }
}
function barGraph(data, o) {
  o = o || {}
  const A = axes(data, o)
  const n = data.length, slot = (A.W - A.left - A.right) / n, bw = slot * 0.58
  let s = A.s
  data.forEach((d, i) => {
    const x = A.left + slot * i + (slot - bw) / 2
    s += '<rect x="' + ff(x) + '" y="' + ff(A.Y(d.v)) + '" width="' + ff(bw) + '" height="' + ff(A.Y(0) - A.Y(d.v)) + '" fill="' + (d.hi ? C.red : C.gold) + '" stroke="' + C.edge + '" stroke-width="1.4"/>'
    if (o.valueLabels !== false) s += F.t(x + bw / 2, A.Y(d.v) - 6, com(d.v), { s: 14, b: true })
    s += F.t(x + bw / 2, A.Y(0) + 20, d.lab, { s: 14, wgt: 600 })
  })
  if (o.xLab) s += F.t((A.left + A.W - A.right) / 2, A.H - 4, o.xLab, { s: 14, wgt: 600, c: C.dim })
  return F.svg(A.W, A.H, s, { max: o.max || '5.4in' })
}
function lineGraph(data, o) {
  o = o || {}
  const A = axes(data, o)
  const n = data.length, slot = (A.W - A.left - A.right) / n
  const X = i => A.left + slot * i + slot / 2
  let s = A.s
  s += '<path d="M' + data.map((d, i) => ff(X(i)) + ' ' + ff(A.Y(d.v))).join('L') + '" fill="none" stroke="' + C.red + '" stroke-width="2.6" stroke-linejoin="round"/>'
  data.forEach((d, i) => {
    s += '<circle cx="' + ff(X(i)) + '" cy="' + ff(A.Y(d.v)) + '" r="5" fill="' + C.white + '" stroke="' + C.red + '" stroke-width="2.4"/>'
    if (o.valueLabels !== false) s += F.t(X(i), A.Y(d.v) - 11, com(d.v), { s: 14, b: true })
    s += F.t(X(i), A.Y(0) + 20, d.lab, { s: 14, wgt: 600 })
  })
  if (o.xLab) s += F.t((A.left + A.W - A.right) / 2, A.H - 4, o.xLab, { s: 14, wgt: 600, c: C.dim })
  return F.svg(A.W, A.H, s, { max: o.max || '5.4in' })
}

/* ---------- stud wall elevation ----------
   studWall(len, spacing, o): a wall len mm long with studs every `spacing` mm measured from the left end,
   and a stud at the right end. o.ask: 'count' hides nothing but writes "How many studs?", 'len' or 'space'
   puts a ? chip on that dimension. o.unit, o.member ('stud'), o.h wall height in drawing units, o.max */
function studWall(len, spacing, o) {
  o = o || {}
  const u = o.unit || ' mm', W = o.w || 620, x0 = 30, sc = (W - 2 * x0) / len, top = 52, Hh = o.h || 120
  const t = Math.max(o.t != null ? o.t : 38 * sc, 6)
  const xs = []
  for (let p = 0; p < len - 1e-9; p += spacing) xs.push(p)
  xs.push(len)
  let s = F.rect(x0, top, len * sc, t, { fill: C.fill2 }) + F.rect(x0, top + Hh - t, len * sc, t, { fill: C.fill2 })
  xs.forEach((p, i) => {
    let x = x0 + p * sc
    if (i === 0) x += 0
    else if (i === xs.length - 1) x -= t
    else x -= t / 2
    s += F.rect(x, top + t, t, Hh - 2 * t, { fill: C.fill, w: 1.6 })
  })
  const fs = o.fs || 15
  s += F.dim(x0, top, x0 + len * sc, top, o.ask === 'len' ? '?' : com(len) + u, -26, { ask: o.ask === 'len', s: fs })
  s += F.dim(x0, top + Hh, x0 + spacing * sc, top + Hh, o.ask === 'space' ? '?' : com(spacing) + u + (o.oc === false ? '' : ' o.c.'), 26, { ask: o.ask === 'space', s: fs })
  if (o.note) s += F.t(x0 + len * sc, top + Hh + 34, o.note, { s: fs, a: 'end', wgt: 600, c: C.edge })
  return { svg: F.svg(W, top + Hh + 48, s, { max: o.max || '6in' }), count: xs.length }
}

module.exports = { colMul, colMulSteps, divSteps, carriesAdd, clock, barGraph, lineGraph, studWall, com, MONO }
