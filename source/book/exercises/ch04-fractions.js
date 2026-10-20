/* Exercise Book, Chapter 4: Fractions */
module.exports = function (B, L) {
  const F = require('../engine/figs.js')
  const G = require('../engine/figs-ch04.js')
  const fr = L.fr, mx = L.mx

  function nr(n, d) {
    const g = L.gcd(n, d) || 1
    return [n / g, d / g]
  }
  const M = (w, n, d) => nr(w * (d || 1) + (n || 0), d || 1)
  const add = (...xs) => xs.reduce((a, b) => nr(a[0] * b[1] + b[0] * a[1], a[1] * b[1]))
  const sub = (a, b) => nr(a[0] * b[1] - b[0] * a[1], a[1] * b[1])
  const mul = (a, b) => nr(a[0] * b[0], a[1] * b[1])
  const dv = (a, b) => nr(a[0] * b[1], a[1] * b[0])
  const val = a => a[0] / a[1]
  const H = a => L.frac(a[0], a[1])
  const IN = a => H(a) + ' in'
  const IMP = a => fr(a[0], a[1])
  const RD = (v, den) => {
    const p = G.parts(v, den)
    return (p.n ? (p.w ? mx(p.w, p.n, p.d) : fr(p.n, p.d)) : String(p.w)) + ' in'
  }
  const DSP = (seq, id) => L.CALC.screenText(seq, id).main
  /* keys for a fraction value, for B.check */
  function KS(a) {
    const w = Math.floor(a[0] / a[1]), r = a[0] - w * a[1]
    if (!r) return String(w)
    if (!w) return r + ' ab/c ' + a[1]
    return w + ' ab/c ' + r + ' ab/c ' + a[1]
  }
  const EXP = a => String(+val(a).toFixed(6))
  const inch = v => ({ inch: v, den: 64 })
  const order = list => list.slice().sort((a, b) => val(a) - val(b)).map(H).join(', ')
  /* Exercise 4D (by hand) and 4K (carpentry) */
  const PL = require('../engine/plates.js')
  const art = num => PL.article(num)
  const phrases = [['9.23.5.1', 'one-quarter the depth of the member'], ['9.23.5.2', 'within half the joist depth from the edge of bearing'], ['9.23.5.2', 'not deeper than one-third the joist depth'], ['9.23.5.3', 'two-thirds the depth of the stud if the stud is loadbearing or 40 mm if the stud is non-loadbearing'], ['9.23.3.2', 'not less than half their required length']]
  phrases.forEach(c => { if (!art(c[0]).text.replace(/\s+/g, ' ').includes(c[1])) throw new Error('phrase not in ' + c[0] + ': ' + c[1]) })
  const kSet = () => {
    B.wsN = 10
    return ''
  }
  const dSet = [
    { q: fr(3, 8) + ' + ' + fr(5, 16), a: add(nr(3, 8), nr(5, 16)), w: fr(6, 16) + ' + ' + fr(5, 16) },
    { q: mx(2, 3, 4) + ' + ' + mx(1, 7, 8), a: add(M(2, 3, 4), M(1, 7, 8)), w: '3 + ' + fr(6, 8) + ' + ' + fr(7, 8) + ' = 3 + ' + fr(13, 8) },
    { q: mx(5, 1, 16) + ' − ' + mx(2, 3, 8), a: sub(M(5, 1, 16), M(2, 3, 8)), w: mx(4, 17, 16) + ' − ' + mx(2, 6, 16) },
    { q: '7 − ' + mx(3, 5, 16), a: sub(M(7), M(3, 5, 16)), w: mx(6, 16, 16) + ' − ' + mx(3, 5, 16) },
    { q: fr(3, 4) + ' × ' + fr(2, 3), a: mul(nr(3, 4), nr(2, 3)), w: fr(6, 12) },
    { q: mx(2, 1, 2) + ' × ' + mx(1, 3, 5), a: mul(M(2, 1, 2), M(1, 3, 5)), w: fr(5, 2) + ' × ' + fr(8, 5) + ' = ' + fr(40, 10) },
    { q: '4 × ' + mx(3, 5, 8), a: mul(M(4), M(3, 5, 8)), w: '4 × ' + fr(29, 8) + ' = ' + fr(116, 8) },
    { q: fr(5, 8) + ' ÷ ' + fr(1, 4), a: dv(nr(5, 8), nr(1, 4)), w: fr(5, 8) + ' × ' + fr(4, 1) + ' = ' + fr(20, 8) },
    { q: mx(10, 1, 2) + ' ÷ ' + mx(1, 3, 4), a: dv(M(10, 1, 2), M(1, 3, 4)), w: fr(21, 2) + ' × ' + fr(4, 7) + ' = ' + fr(84, 14) },
    { q: mx(6, 3, 4) + ' ÷ 3', a: dv(M(6, 3, 4), M(3)), w: fr(27, 4) + ' × ' + fr(1, 3) + ' = ' + fr(27, 12) }
  ]
  const kTape = [70 + 9 / 16, 71.25, 72 + 13 / 16]
  const kCut = [M(36, 3, 8), M(42, 11, 16), M(27, 1, 2)], kOff = sub(sub(M(120), add(...kCut)), nr(3, 8))
  const kPer = add(M(22, 1, 2), nr(1, 8)), kN = Math.floor(val(dv(M(96), kPer))), kBOff = sub(M(96), mul(M(kN), kPer))

  /* plates stacked on each other, thicknesses in inches */
  function stack(th, o) {
    o = o || {}
    const S = o.S || 120, x0 = 96, w = 120, tot = th.reduce((a, b) => a + b, 0)
    const xd = x0 + w + 22
    let h = '', y = 22 + tot * S
    th.forEach((t, i) => {
      const y2 = y - t * S
      h += F.rect(x0, y2, w, t * S, { fill: i % 2 ? F.C.fill2 : F.C.fill })
      h += F.line(x0 + w + 3, y, xd + 6, y, { c: F.C.dim, w: 1.1 }) + F.line(x0 + w + 3, y2, xd + 6, y2, { c: F.C.dim, w: 1.1 })
      h += F.line(xd, y, xd, y2, { c: F.C.dim, w: 1.2 }) + F.arrowHead(xd, y2, -Math.PI / 2) + F.arrowHead(xd, y, Math.PI / 2)
      h += G.lab(xd + 34, (y + y2) / 2 + 7, inch(t), { s: 16 })
      y = y2
    })
    h += G.dim(x0, 22 + tot * S, x0, 22, o.askTotal ? { ask: true } : inch(tot), -44, { s: 16 })
    return F.svg(xd + 70, tot * S + 44, h, { max: o.max || '2.6in' })
  }
  /* plate with four holes, spacing along the length asked */
  function fourHoles(l, w, e, o) {
    o = o || {}
    const S = 280 / l, x0 = 80, y0 = 54
    const X = x => x0 + x * S, Y = y => y0 + (w - y) * S
    let h = F.rect(x0, y0, l * S, w * S)
    const pts = [[e, e], [l - e, e], [e, w - e], [l - e, w - e]]
    pts.forEach(p => { h += F.circle(X(p[0]), Y(p[1]), 10, { fill: '#FFFFFF', w: 1.8 }) })
    h += G.dim(X(0), Y(w), X(l), Y(w), inch(l), -34, { s: 20 })
    h += G.dim(X(0), Y(0), X(0), Y(w), inch(w), -46, { s: 20 })
    h += G.dim(X(e), Y(0), X(l - e), Y(0), { ask: true }, 38, { s: 20 })
    /* centre to centre across the plate, on the right, outside the plate */
    h += G.dim(X(l - e), Y(e), X(l - e), Y(w - e), { ask: true }, e * S + 34, { s: 20 })
    return F.svg(x0 + l * S + 84, y0 + w * S + 72, h, { max: o.max || '3in' })
  }

  /* ---------- numbers ---------- */
  const ruleA = [9 / 16, 1 + 5 / 8, 2.25, 2 + 13 / 16]
  const shopCut = [M(27, 5, 8), M(19, 3, 16), M(33, 1, 2)]
  const shopOff = sub(sub(M(96), add(...shopCut)), mul(M(3), nr(1, 8)))
  const pipe2 = add(M(18, 3, 4), M(22, 7, 16))
  const grip = add(nr(5, 8), nr(3, 4), nr(1, 8))
  const centre = dv(M(15, 5, 8), M(2))
  const sp9 = dv(sub(M(48), mul(M(2), M(1, 3, 4))), M(8))
  const per = add(M(4, 3, 8), nr(1, 8)), pcs = Math.floor(val(dv(M(70), per))), pcsOff = sub(M(70), mul(M(pcs), per))
  const idp = sub(M(2, 3, 8), mul(M(2), nr(3, 16)))
  const third = dv(M(50), M(3)), third16 = Math.round((val(third) - Math.floor(val(third))) * 16)
  const plW = 12.25, plH = 9.5, plA = 3.375, plB = 2.875
  const shSteps = [M(2, 5, 8), null, M(3, 1, 4), M(4, 3, 8)], shTot = M(14, 1, 2)
  const shMiss = sub(sub(sub(shTot, shSteps[0]), shSteps[2]), shSteps[3])
  const hpEnd = 1.875, hpLen = 30, hpSp = (30 - 2 * 1.875) / 5
  const stk3 = [nr(1, 4), nr(5, 8), nr(3, 16)]
  const four = M(8, 3, 8), fourTot = mul(M(4), four), fourNew = mul(M(4), add(four, nr(1, 16)))
  const fh = [9.75, 4.5, 1.125]

  return L.join([
    B.exChapter({ num: 4, id: 'fractions', title: 'Fractions', intro: 'Practice reading tapes and rules, writing fractions in lowest terms, changing between mixed numbers and improper fractions, and adding, subtracting, multiplying and dividing fractions. Give every answer in lowest terms.' }),

    B.worksheet({ title: 'Skills', sub: 'One skill at a time, from reading a rule to dividing fractions' }),
    B.grid2(
      B.prob({ q: 'What fraction of the bar is shaded? Is it a proper fraction?', canvas: G.bar(5, 12, { w: 300, lab: false }), a: fr(5, 12) + '. Yes, the numerator is smaller than the denominator.', lines: 2 }),
      B.prob({ q: 'What fraction of the circles is shaded? Write it as an improper fraction and as a mixed number.', canvas: G.circles([{ n: 8, d: 8 }, { n: 8, d: 8 }, { n: 3, d: 8 }], { r: 34, gap: 20 }), a: fr(19, 8) + ' = ' + mx(2, 3, 8), lines: 2 })),
    B.prob({ q: 'Read marks A, B, C and D to the nearest ' + fr(1, 16) + ' in.', canvas: G.rule({ from: 0, to: 3, den: 16, ppi: 195, marks: ruleA.map((v, i) => ({ v, name: 'ABCD'[i] })), max: '5in' }), a: ruleA.map((v, i) => 'ABCD'[i] + ': ' + RD(v, 16)).join(', '), lines: 1 }),
    B.prob({ q: 'This half inch of a rule is marked in 32nds. Read marks E and F.', canvas: G.rule({ from: 0, to: 0.5, den: 32, ppi: 1150, zero: true, marks: [{ v: 7 / 32, name: 'E' }, { v: 15 / 32, name: 'F' }], max: '4.9in' }), a: 'E: ' + fr(7, 32) + ' in, F: ' + fr(15, 32) + ' in', lines: 1 }),
    B.prob({ q: 'This part of a rule runs from ' + fr(1, 2) + ' in to 1 in and is marked in 64ths. Read marks G and H.', canvas: G.rule({ from: 0.5, to: 1, den: 64, ppi: 1150, marks: [{ v: 37 / 64, name: 'G' }, { v: 53 / 64, name: 'H' }], max: '4.9in' }), a: 'G: ' + fr(37, 64) + ' in, H: ' + fr(53, 64) + ' in', work: 'G is 5 small spaces past the ' + fr(1, 2) + ' in line (' + fr(32, 64) + '). H is 5 small spaces past the ' + fr(3, 4) + ' in line (' + fr(48, 64) + ').', lines: 1 }),
    B.grid2(
      B.prob({ q: 'Write ' + fr(14, 32) + ' and ' + fr(36, 64) + ' in lowest terms.', a: H(nr(14, 32)) + ' and ' + H(nr(36, 64)), lines: 2 }),
      B.prob({ q: 'Write ' + fr(7, 8) + ' in 32nds and ' + fr(5, 16) + ' in 64ths.', a: fr(28, 32) + ' and ' + fr(20, 64), lines: 2 })),
    B.grid2(
      B.prob({ q: 'Which is longer, ' + fr(9, 16) + ' in or ' + fr(5, 8) + ' in? By how much?', a: fr(5, 8) + ' in, by ' + H(sub(nr(5, 8), nr(9, 16))) + ' in', lines: 2 }),
      B.prob({ q: 'Put in order from smallest: ' + fr(13, 32) + ', ' + fr(3, 8) + ', ' + fr(7, 16) + '.', a: order([nr(13, 32), nr(3, 8), nr(7, 16)]), lines: 2 })),
    B.grid2(
      B.prob({ q: 'Change ' + fr(37, 8) + ' and ' + fr(53, 16) + ' to mixed numbers.', a: H(nr(37, 8)) + ' and ' + H(nr(53, 16)), lines: 2 }),
      B.prob({ q: 'Change ' + mx(4, 7, 16) + ' and ' + mx(6, 3, 4) + ' to improper fractions.', a: IMP(M(4, 7, 16)) + ' and ' + IMP(M(6, 3, 4)), lines: 2 })),
    B.grid2(
      B.prob({ q: 'The Sharp shows ' + DSP('3 ab/c 9 ab/c 16 =', 'el531xt') + '. Write it as a mixed number. If the TI-30Xa shows the same number (' + DSP('3 ab/c 9 ab/c 16 =', 'ti30xa') + '), what does it show after 2nd d/c?', a: mx(3, 9, 16) + '. The TI-30Xa shows ' + DSP('3 ab/c 9 ab/c 16 = d/c', 'ti30xa') + ', which is ' + fr(57, 16) + '.', lines: 2 }),
      B.prob({ q: 'What is the reciprocal of ' + mx(2, 1, 2) + '?', a: fr(2, 5), work: mx(2, 1, 2) + ' = ' + fr(5, 2) + ', turned upside down is ' + fr(2, 5), lines: 2 })),
    B.check('3 ab/c 9 ab/c 16 = d/c', '3.5625'),
    B.grid2(
      B.prob({ q: 'Add. (a) ' + fr(5, 16) + ' + ' + fr(3, 4) + '  (b) ' + mx(7, 3, 8) + ' + ' + mx(2, 15, 16), a: '(a) ' + H(add(nr(5, 16), nr(3, 4))) + '  (b) ' + H(add(M(7, 3, 8), M(2, 15, 16))), lines: 2 }),
      B.prob({ q: 'Subtract. (a) 5 − ' + mx(1, 11, 16) + '  (b) ' + mx(9, 1, 8) + ' − ' + mx(4, 3, 4), a: '(a) ' + H(sub(M(5), M(1, 11, 16))) + '  (b) ' + H(sub(M(9, 1, 8), M(4, 3, 4))), lines: 2 })),
    B.grid2(
      B.prob({ q: 'Multiply. (a) ' + fr(5, 8) + ' × 12  (b) ' + mx(2, 1, 2) + ' × ' + mx(1, 3, 4), a: '(a) ' + H(mul(nr(5, 8), M(12))) + '  (b) ' + H(mul(M(2, 1, 2), M(1, 3, 4))), lines: 2 }),
      B.prob({ q: 'Divide. (a) ' + fr(3, 4) + ' ÷ ' + fr(3, 16) + '  (b) ' + mx(15, 3, 4) + ' ÷ 3', a: '(a) ' + H(dv(nr(3, 4), nr(3, 16))) + '  (b) ' + H(dv(M(15, 3, 4), M(3))), lines: 2 })),
    [[nr(5, 16), nr(3, 4)], [M(7, 3, 8), M(2, 15, 16)]].map(p => B.check(KS(p[0]) + ' + ' + KS(p[1]) + ' =', EXP(add(p[0], p[1])))),
    B.check('5 − 1 ab/c 11 ab/c 16 =', EXP(sub(M(5), M(1, 11, 16)))),
    B.check('9 ab/c 1 ab/c 8 − 4 ab/c 3 ab/c 4 =', EXP(sub(M(9, 1, 8), M(4, 3, 4)))),
    B.check('2 ab/c 1 ab/c 2 × 1 ab/c 3 ab/c 4 =', EXP(mul(M(2, 1, 2), M(1, 3, 4)))),
    B.check('15 ab/c 3 ab/c 4 ÷ 3 =', EXP(dv(M(15, 3, 4), M(3)))),

    B.worksheet({ title: 'Shop problems', sub: 'Fractions in fabrication, pipe trades and millwright work' }),
    B.prob({ q: 'A fabricator cuts pieces of ' + shopCut.map(IN).join(', ') + ' from a 96 in bar. There are 3 cuts and the kerf is ' + fr(1, 8) + ' in. How long is the offcut?', a: IN(shopOff), work: '96 − (' + shopCut.map(H).join(' + ') + ') − 3 × ' + fr(1, 8) + ' = 96 − ' + H(add(...shopCut)) + ' − ' + fr(3, 8) + ' = ' + H(shopOff), lines: 4 }),
    B.check('96 − 27 ab/c 5 ab/c 8 − 19 ab/c 3 ab/c 16 − 33 ab/c 1 ab/c 2 − 3 × 1 ab/c 8 =', EXP(shopOff)),
    B.grid2(
      B.prob({ q: 'A pipe fitter needs two pieces of pipe, ' + mx(18, 3, 4) + ' in and ' + mx(22, 7, 16) + ' in long. What total length of pipe is that, ignoring the saw cuts?', a: IN(pipe2), lines: 3 }),
      B.prob({ q: 'A bolt passes through a ' + fr(5, 8) + ' in plate, a ' + fr(3, 4) + ' in plate and a ' + fr(1, 8) + ' in washer. What is the total thickness it clamps?', a: IN(grip), lines: 3 })),
    B.grid2(
      B.prob({ q: 'A millwright needs to fill a ' + fr(3, 16) + ' in gap with ' + fr(1, 32) + ' in shims. How many shims does it take?', a: H(dv(nr(3, 16), nr(1, 32))) + ' shims', work: fr(3, 16) + ' ÷ ' + fr(1, 32) + ' = ' + fr(3, 16) + ' × ' + fr(32, 1) + ' = 6', lines: 3 }),
      B.prob({ q: 'A plate is ' + mx(15, 5, 8) + ' in wide. How far from the edge is the centre line?', a: IN(centre), work: mx(15, 5, 8) + ' ÷ 2 = ' + fr(125, 8) + ' × ' + fr(1, 2) + ' = ' + fr(125, 16), lines: 3 })),
    B.prob({ q: 'Nine holes are evenly spaced along a 48 in angle. The end holes are ' + mx(1, 3, 4) + ' in from the ends. Find the spacing, centre to centre.', a: IN(sp9), work: '(48 − 2 × ' + mx(1, 3, 4) + ') ÷ 8 = ' + mx(44, 1, 2) + ' ÷ 8 = ' + H(sp9), lines: 3 }),
    B.check('( 48 − 2 × 1 ab/c 3 ab/c 4 ) ÷ 8 =', EXP(sp9)),
    B.prob({ q: 'How many ' + mx(4, 3, 8) + ' in spacers can be cut from a 70 in bar? You make one cut for each spacer and the kerf is ' + fr(1, 8) + ' in. How long is the offcut?', a: pcs + ' spacers, offcut ' + IN(pcsOff), work: 'Each spacer uses ' + mx(4, 3, 8) + ' + ' + fr(1, 8) + ' = ' + H(per) + ' in. 70 ÷ ' + H(per) + ' = ' + H(dv(M(70), per)) + ', so ' + pcs + ' spacers. ' + pcs + ' × ' + H(per) + ' = ' + H(mul(M(pcs), per)) + ' in, offcut ' + H(pcsOff) + ' in.', lines: 4 }),
    B.check('70 ÷ 4 ab/c 1 ab/c 2 =', EXP(dv(M(70), per))),
    B.grid2(
      B.prob({ q: 'A pipe has an outside diameter of ' + mx(2, 3, 8) + ' in and a wall ' + fr(3, 16) + ' in thick. What is the inside diameter?', a: IN(idp), work: mx(2, 3, 8) + ' − 2 × ' + fr(3, 16) + ' = ' + mx(2, 3, 8) + ' − ' + fr(3, 8), lines: 3 }),
      B.prob({ q: 'A keyway measures ' + mx(1, 11, 16) + ' in wide on the rule. Will a ' + mx(1, 3, 4) + ' in key fit? By how much is it too wide or too narrow?', a: 'No. The key is ' + IN(sub(M(1, 3, 4), M(1, 11, 16))) + ' too wide.', lines: 3 })),
    B.grid2(
      B.prob({ q: 'A 2,400 mm length of channel is cut so one piece is ' + fr(3, 4) + ' of the length. How long is that piece?', a: L.num(2400 * 3 / 4) + ' mm', lines: 3 }),
      B.prob({ q: 'A 45 in bar is cut so one piece is ' + fr(2, 3) + ' of the bar. How long are the two pieces? Ignore the saw cut.', a: '30 in and 15 in', lines: 3 })),
    B.prob({ q: 'A 50 in bar is cut into 3 equal pieces. Ignore the saw cuts. How long is each piece, to the nearest ' + fr(1, 16) + ' in?', a: RD(val(third), 16), work: '50 ÷ 3 = ' + H(third) + '. ' + H(sub(third, M(Math.floor(val(third))))) + ' × 16 = ' + L.num(L.round((val(third) - Math.floor(val(third))) * 16, 2)) + ', nearest ' + third16 + ' sixteenths.', lines: 3 }),
    B.check('2 ab/c 3 × 16 =', '10.67'),

    B.worksheet({ title: 'Shape Canvas', sub: 'Parts in inches. Find every red ?', intro: 'Each drawing is to scale. Break the part into pieces you know, and show the fractions you add or take away.' }),
    B.grid2(
      B.prob({ q: 'Find the hidden width.', canvas: G.lPlate(plW, plH, plA, plB, { ask: ['c'], hide: ['d'], split: true, size: 240, ls: 18, max: '3in' }), a: IN(sub(M(12, 1, 4), M(3, 3, 8))), work: mx(12, 1, 4) + ' − ' + mx(3, 3, 8), lines: 2 }),
      B.prob({ q: 'Find the hidden height.', canvas: G.lPlate(plW, plH, plA, plB, { ask: ['d'], hide: ['c'], split: true, size: 240, ls: 18, max: '3in' }), a: IN(sub(M(9, 1, 2), M(2, 7, 8))), work: mx(9, 1, 2) + ' − ' + mx(2, 7, 8), lines: 2 })),
    B.prob({ q: 'The shaft is ' + mx(14, 1, 2) + ' in long overall. Find the missing step.', canvas: G.shaft([{ len: val(shSteps[0]), dia: 1.25 }, { len: val(shMiss), dia: 1.75, ask: true }, { len: val(shSteps[2]), dia: 1.5 }, { len: val(shSteps[3]), dia: 1 }], { w: 600, hmax: 56, max: '5.2in' }), a: IN(shMiss), work: mx(14, 1, 2) + ' − ' + mx(2, 5, 8) + ' − ' + mx(3, 1, 4) + ' − ' + mx(4, 3, 8) + ' = ' + H(shMiss), lines: 2 }),
    B.prob({ q: 'Six holes are evenly spaced along a 30 in plate. Find the distance from each end to the first hole.', canvas: G.holePlate(hpLen, hpEnd, 6, { ask: 'end', lastEnd: false, h: 50, ls: 16, max: '5.2in' }), a: RD(hpEnd, 16), work: '(30 − 5 × ' + RD(hpSp, 16).replace(' in', '') + ') ÷ 2', lines: 2 }),
    B.prob({ q: 'Change one value: four equal pieces of ' + mx(8, 3, 8) + ' in make up the bar. Find the overall length. If each piece is made ' + fr(1, 16) + ' in longer, what is the new overall length?', canvas: G.cutBar([1, 2, 3, 4].map(() => ({ len: val(four) })), { askTotal: true, s: 16, max: '5.6in' }), a: IN(fourTot) + ', then ' + IN(fourNew), work: '4 × ' + mx(8, 3, 8) + ' = ' + H(fourTot) + '. 4 × ' + fr(1, 16) + ' = ' + fr(1, 4) + ' more.', lines: 2 }),
    B.grid2(
      B.prob({ q: 'Three plates are stacked. How thick is the stack?', canvas: stack(stk3.map(val), { askTotal: true, S: 120 }), a: IN(add(...stk3)), work: fr(4, 16) + ' + ' + fr(10, 16) + ' + ' + fr(3, 16) + ' = ' + fr(17, 16), lines: 2 }),
      B.prob({ q: 'Each hole centre is ' + mx(1, 1, 8) + ' in from two edges. Find the centre-to-centre distance along the plate and across it.', canvas: fourHoles(fh[0], fh[1], fh[2], { max: '3.1in' }), a: 'Along: ' + RD(fh[0] - 2 * fh[2], 16) + '. Across: ' + RD(fh[1] - 2 * fh[2], 16) + '.', work: mx(9, 3, 4) + ' − 2 × ' + mx(1, 1, 8) + ' and ' + mx(4, 1, 2) + ' − 2 × ' + mx(1, 1, 8), lines: 2 })),
    B.check('4 × 8 ab/c 7 ab/c 16 =', EXP(fourNew)),

    B.worksheet({ title: 'By hand', sub: 'Add, subtract, multiply and divide fractions on paper. No calculator.', intro: 'Find a common denominator to add or subtract. Change mixed numbers to improper fractions to multiply or divide. Give every answer in lowest terms.' }),
    B.grid2(...dSet.map(d => B.prob({ q: d.q, a: H(d.a), work: d.w, lines: 4 }))),

    kSet(),
    B.worksheet({ title: 'Carpentry and the BCBC', sub: 'Tape readings on boards, cut lists with kerf, and code limits as fractions', intro: 'Give tape readings in lowest terms. Every saw cut takes a ' + fr(1, 8) + ' in kerf unless the problem says otherwise. Code values are from BC Building Code 2024, Division B, in millimetres.' }),
    B.prob({ q: 'Read marks A, B and C on the tape.', canvas: G.rule({ from: 70, to: 73, den: 16, ppi: 190, marks: kTape.map((v, i) => ({ v, name: 'ABC'[i] })), max: '5.8in' }), a: kTape.map((v, i) => 'ABC'[i] + ' = ' + RD(v, 16)).join(', '), lines: 1 }),
    B.prob({ q: 'Pieces of ' + kCut.map(IN).join(', ') + ' are cut from a 120 in board with 3 cuts. How long is the offcut?', a: IN(kOff), work: '120 − (' + kCut.map(H).join(' + ') + ') − 3 × ' + fr(1, 8) + ' = 120 − ' + H(add(...kCut)) + ' − ' + fr(3, 8), lines: 3 }),
    B.check('120 − ' + kCut.map(KS).join(' − ') + ' − 3 × 1 ab/c 8 =', EXP(kOff)),
    B.grid2(
      B.prob({ q: 'How many ' + mx(22, 1, 2) + ' in blocks come from a 96 in board, with one cut for each block? How long is the offcut?', a: kN + ' blocks, offcut ' + IN(kBOff), work: 'Each block uses ' + H(kPer) + ' in. 96 ÷ ' + H(kPer) + ' = ' + H(dv(M(96), kPer)), lines: 4 }),
      B.prob({ q: 'A stud ' + mx(92, 5, 8) + ' in long is cut from a 96 in board with one cut. How much is left after the cut?', a: IN(sub(sub(M(96), M(92, 5, 8)), nr(1, 8))), work: '96 − ' + mx(92, 5, 8) + ' − ' + fr(1, 8), lines: 4 })),
    B.grid2(
      B.prob({ q: 'Find the centre of a wall ' + mx(145, 3, 8) + ' in long.', a: IN(dv(M(145, 3, 8), M(2))) + ' from either end', lines: 3 }),
      B.prob({ q: 'In a socket set marked in sixteenths, what size comes after ' + fr(3, 4) + ' in? Which is bigger, ' + fr(11, 16) + ' in or ' + fr(5, 8) + ' in, and by how much?', a: fr(13, 16) + ' in. ' + fr(11, 16) + ' in is bigger by ' + fr(1, 16) + ' in.', lines: 3 })),
    B.grid2(
      B.prob({ q: 'Article 9.23.5.1, Sentence (1) (page ' + art('9.23.5.1').page + '): holes in floor framing shall be not larger than one-quarter the depth of the member. What is the largest hole in a joist 140 mm deep?', a: (140 / 4) + ' mm', lines: 3 }),
      B.prob({ q: 'Article 9.23.5.2, Sentence (1) (page ' + art('9.23.5.2').page + '): a notch is not deeper than one-third the joist depth and sits within half the joist depth from the edge of bearing. For a joist 235 mm deep, find both limits.', a: H(nr(235, 3)) + ' mm deep, within ' + H(nr(235, 2)) + ' mm of the bearing edge', lines: 3 })),
    B.grid2(
      B.prob({ q: 'Article 9.23.5.3, Sentence (1) (page ' + art('9.23.5.3').page + '): the undamaged part of a stud shall not be less than two-thirds of its depth if it is loadbearing, or 40 mm if it is non-loadbearing. For an 89 mm deep stud, how deep can a notch be in each case?', a: 'Loadbearing: ' + H(sub(M(89), nr(178, 3))) + ' mm. Non-loadbearing: ' + (89 - 40) + ' mm.', work: '89 − ' + fr(2, 3) + ' × 89 = 89 − ' + H(nr(178, 3)) + '. 89 − 40 = 49.', lines: 4 }),
      B.prob({ q: 'Article 9.23.3.2, Sentence (1) (page ' + art('9.23.3.2').page + '): not less than half a nail\u2019s required length goes into the second member. A nail\u2019s required length is 63 mm. How far must it go into the second member?', a: H(nr(63, 2)) + ' mm', lines: 4 })),
    B.check('96 ÷ 22 ab/c 5 ab/c 8 =', EXP(dv(M(96), kPer))), B.check('235 ÷ 3 =', '78.33'), B.check('89 − 2 ab/c 3 × 89 =', '29.67')
  ])
}
