/* Exercise Book, Chapter 5: Decimals */
module.exports = function (B, L) {
  const F = require('../engine/figs.js')
  const G = require('../engine/figs-ch04.js')
  const fr = L.fr, mx = L.mx, n = L.num, R = L.round
  const mm = (v, dp) => n(dp == null ? R(v, 4) : R(v, dp), dp) + ' mm'
  const tape = (v, den) => {
    const p = G.parts(v, den)
    return (p.n ? (p.w ? mx(p.w, p.n, p.d) : fr(p.n, p.d)) : String(p.w)) + ' in'
  }
  const cnt = (v, den) => Math.round((v - Math.floor(v)) * den)

  /* pipe cross-section with outside diameter asked */
  function tube(OD, wall, o) {
    o = o || {}
    const S = 180 / OD, cx = 150, cy = 140, Ro = OD / 2 * S, Ri = (OD / 2 - wall) * S
    let h = F.circle(cx, cy, Ro) + F.circle(cx, cy, Ri, { fill: '#FFFFFF' })
    h += G.dim(cx - Ro, cy, cx + Ro, cy, { ask: true }, -(Ro + 28), { s: 18 })
    h += G.dim(cx - Ri, cy, cx + Ri, cy, mm(OD - 2 * wall), 0.01, { s: 18 })
    h += F.callout(cx + (Ri + Ro) / 2 * 0.7071, cy - (Ri + Ro) / 2 * 0.7071, cx + Ro + 50, cy - Ro + 18, 'wall ' + mm(wall), { s: 16 })
    return F.svg(cx + Ro + 130, cy + Ro + 18, h, { max: o.max || '3in', vb: [0, cy - Ro - 56, cx + Ro + 130, 2 * Ro + 74] })
  }

  /* ---------- numbers ---------- */
  const rmm = [8.5, 26, 44.5, 57]
  const cut = [412.5, 287.25, 650], cutOff = R(1500 - cut.reduce((a, b) => a + b, 0) - 3 * 2.5, 2)
  const pipeCost = R(3 * 1.85 * 14.6, 2)
  const bolts = R(25 * 0.46 + 25 * 0.12, 2)
  const hs = R((900 - 2 * 37.5) / 7, 2)
  const wt = R(4.5 * 2.36, 2)
  const pay = R(37.5 * 21.4, 2)
  const p120 = 120 / 25.4
  const shaftMid = R(210 - 45.5 - 62.25, 2)
  const tID = 77.9, tW = 5.5, tOD = R(tID + 2 * tW, 2)
  const plL = 203.2, plW = 101.6, plP = R(2 * (plL + plW), 2)
  const hpEnd = 45, hpLen = 750
  const five = 228.6, fiveTot = R(5 * five, 2), fiveNew = R(5 * (five - 1.5), 2)
  const decPl = [5.875, 3.25]

  return L.join([
    B.exChapter({ num: 5, id: 'decimals', title: 'Decimals', intro: 'Practice place value, reading a metric rule, rounding, the four operations with decimals, changing between fractions and decimals, and money. Round only where the problem says so.' }),

    B.worksheet({ title: 'Skills', sub: 'Place value, rounding, the four operations and conversions' }),
    B.grid2(
      B.prob({ q: 'What is the 4 worth in 30.249? Write 0.075 in words.', a: '4 hundredths (0.04). Seventy-five thousandths.', lines: 2 }),
      B.prob({ q: 'Write ' + fr(3, 100) + ' and ' + fr(48, '1,000') + ' as decimals.', a: '0.03 and 0.048', lines: 2 })),
    B.prob({ q: 'Read marks A, B, C and D to the nearest 0.5 mm.', canvas: F.mmRuler(0, 60, rmm.map((v, i) => ({ v, lab: 'ABCD'[i] })), { ppm: 10, max: '5.6in' }).replace(/font-size="10"([^>]*>cm<)/, 'font-size="13"$1'), a: rmm.map((v, i) => 'ABCD'[i] + ' = ' + n(v) + ' mm').join(', '), lines: 1 }),
    B.grid2(
      B.prob({ q: 'Put in order from smallest: 0.4, 0.375, 0.41.', a: '0.375, 0.4, 0.41', lines: 2 }),
      B.prob({ q: 'Which is longer, 2.5 mm or 2.45 mm? By how much?', a: '2.5 mm, by 0.05 mm', lines: 2 })),
    B.grid2(
      B.prob({ q: 'Round 7.846 to one decimal place and to two decimal places.', a: n(R(7.846, 1), 1) + ' and ' + n(R(7.846, 2), 2), lines: 2 }),
      B.prob({ q: 'Round 31.27 mm and 18.8 mm to the nearest 0.5 mm.', a: mm(Math.round(31.27 * 2) / 2) + ' and ' + mm(Math.round(18.8 * 2) / 2), work: '31.27 × 2 = 62.54, rounds to 63, ÷ 2 = 31.5. 18.8 × 2 = 37.6, rounds to 38, ÷ 2 = 19', lines: 2 })),
    B.grid2(
      B.prob({ q: 'Add. 63.5 + 9.53 + 0.8', a: n(R(63.5 + 9.53 + 0.8, 2)), lines: 2 }),
      B.prob({ q: 'Subtract. 50 − 17.46', a: n(R(50 - 17.46, 2)), lines: 2 })),
    B.check('63.5 + 9.53 + 0.8 =', '73.83'),
    B.check('50 − 17.46 =', '32.54'),
    B.grid2(
      B.prob({ q: 'Multiply. (a) 0.6 × 0.4  (b) 25.4 × 7  (c) 3.125 × 1,000', a: '(a) 0.24  (b) ' + n(R(25.4 * 7, 2)) + '  (c) 3,125', lines: 2 }),
      B.prob({ q: 'Divide. (a) 8.4 ÷ 0.12  (b) 45.72 ÷ 6  (c) 19.5 ÷ 100', a: '(a) 70  (b) 7.62  (c) 0.195', lines: 2 })),
    B.check('8.4 ÷ 0.12 =', '70'),
    B.check('45.72 ÷ 6 =', '7.62'),
    B.grid2(
      B.prob({ q: 'Change ' + fr(7, 8) + ' and ' + mx(3, 1, 4) + ' to decimals.', a: '0.875 and 3.25', lines: 2 }),
      B.prob({ q: 'Change 0.875 and 0.08 to fractions in lowest terms.', a: fr(7, 8) + ' and ' + fr(2, 25), work: fr(875, '1,000') + ' ÷ 125 = ' + fr(7, 8) + '. ' + fr(8, 100) + ' ÷ 4 = ' + fr(2, 25), lines: 2 })),
    B.grid2(
      B.prob({ q: 'Change 1.47 in to the nearest ' + fr(1, 16) + ' in and to the nearest ' + fr(1, 32) + ' in.', a: tape(1.47, 16) + ' (0.47 × 16 = 7.52, rounds to 8) and ' + tape(1.47, 32) + ' (0.47 × 32 = 15.04, rounds to 15)', lines: 2 }),
      B.prob({ q: 'Change 0.29 in to the nearest ' + fr(1, 16) + ' in.', a: tape(0.29, 16) + ' (0.29 × 16 = 4.64, rounds to 5)', lines: 2 })),
    B.check('0.47 × 16 =', '7.52'),
    B.check('0.47 × 32 =', '15.04'),
    B.check('0.29 × 16 =', '4.64'),
    B.grid2(
      B.prob({ q: 'Change 30 mm to the nearest ' + fr(1, 16) + ' in.', a: tape(30 / 25.4, 16), work: '30 ÷ 25.4 × 16 = 18.90, rounds to 19. ' + fr(19, 16) + ' = ' + mx(1, 3, 16), lines: 2 }),
      B.prob({ q: 'Change ' + mx(1, 1, 4) + ' in to millimetres.', a: mm(1.25 * 25.4), work: '1.25 × 25.4', lines: 2 })),
    B.check('30 ÷ 25.4 × 16 =', '18.90'),
    B.check('1.25 × 25.4 =', '31.75'),

    B.worksheet({ title: 'Shop problems', sub: 'Decimals in fabrication, pipe trades and millwright work' }),
    B.prob({ q: 'Pieces of ' + cut.map(v => mm(v)).join(', ') + ' are cut from a 1,500 mm bar. There are 3 cuts and the kerf is 2.5 mm. How long is the offcut?', a: mm(cutOff), work: '1,500 − (412.5 + 287.25 + 650) − 3 × 2.5 = 1,500 − 1,349.75 − 7.5', lines: 4 }),
    B.check('1500 − 412.5 − 287.25 − 650 − 3 × 2.5 =', n(cutOff)),
    B.grid2(
      B.prob({ q: 'A pipe fitter needs 3 lengths of pipe, each 1.85 m. The pipe costs $14.60 per metre. What does the pipe cost?', a: '$' + n(pipeCost, 2), work: '3 × 1.85 = 5.55 m. 5.55 × 14.60', lines: 4 }),
      B.prob({ q: 'A millwright stacks shims that are each 0.25 mm thick. How many shims make a stack 1.75 mm thick?', a: String(R(1.75 / 0.25, 2)) + ' shims', work: '1.75 ÷ 0.25 = 175 ÷ 25', lines: 4 })),
    B.check('3 × 1.85 × 14.6 =', n(pipeCost, 2)),
    B.check('1.75 ÷ 0.25 =', '7'),
    B.grid2(
      B.prob({ q: 'An order has 25 bolts at $0.46 each and 25 nuts at $0.12 each. What is the total?', a: '$' + n(bolts, 2), lines: 3 }),
      B.prob({ q: 'Flat bar on a job weighs 2.36 kg per metre. What do 4.5 m weigh?', a: n(wt) + ' kg', lines: 3 })),
    B.check('25 × 0.46 + 25 × 0.12 =', n(bolts, 2)),
    B.check('4.5 × 2.36 =', n(wt)),
    B.prob({ q: 'Eight holes are evenly spaced along a 900 mm plate. The end holes are 37.5 mm from the ends. Find the spacing to two decimal places.', a: mm(hs, 2), work: '(900 − 2 × 37.5) ÷ 7 = 825 ÷ 7', lines: 3 }),
    B.check('( 900 − 2 × 37.5 ) ÷ 7 =', n(hs, 2)),
    B.grid2(
      B.prob({ q: 'A drawing gives a length of 3.38 in. What do you mark on the tape, to the nearest ' + fr(1, 16) + ' in?', a: tape(3.38, 16), work: '0.38 × 16 = 6.08, rounds to 6. ' + fr(6, 16) + ' = ' + fr(3, 8), lines: 3 }),
      B.prob({ q: 'A metric part is 120 mm long. What is that to the nearest ' + fr(1, 16) + ' in?', a: tape(p120, 16), work: '120 ÷ 25.4 × 16 = ' + n(R(p120 * 16, 2), 2) + ', rounds to ' + Math.round(p120 * 16) + '. ' + fr(Math.round(p120 * 16), 16) + ' = ' + tape(p120, 16).replace(' in', ''), lines: 3 })),
    B.check('0.38 × 16 =', '6.08'),
    B.check('120 ÷ 25.4 × 16 =', n(R(p120 * 16, 2), 2)),
    B.grid2(
      B.prob({ q: 'A pre-apprentice works 37.5 hours at $21.40 an hour. What is the pay before deductions?', a: '$' + n(pay, 2), lines: 3 }),
      B.prob({ q: 'A ' + fr(5, 8) + ' in bolt hole is drilled in a metric part. What is the hole size in millimetres?', a: mm(0.625 * 25.4), work: '0.625 × 25.4', lines: 3 })),
    B.check('37.5 × 21.4 =', n(pay, 2)),
    B.check('5 ÷ 8 × 25.4 =', n(R(0.625 * 25.4, 4))),

    B.worksheet({ title: 'Shape Canvas', sub: 'Decimal sizes on the canvas. Find every red ?', intro: 'Each drawing is to scale. Line up the decimal points when you add or subtract.' }),
    B.prob({ q: 'The pin is 210 mm long overall. Find the length of the middle step.', canvas: G.shaft([{ len: 45.5, dia: 30 }, { len: shaftMid, dia: 22, ask: true }, { len: 62.25, dia: 26 }], { fmt: v => n(R(v, 2)) + ' mm', totalLab: '210 mm', w: 560, hmax: 56, ls: 16, max: '5.2in' }), a: mm(shaftMid), work: '210 − 45.5 − 62.25', lines: 2 }),
    B.check('210 − 45.5 − 62.25 =', n(shaftMid)),
    B.grid2(
      B.prob({ q: 'Find the outside diameter of the pipe.', canvas: tube(tOD, tW, { max: '3in' }), a: mm(tOD), work: '77.9 + 2 × 5.5', lines: 2 }),
      B.prob({ q: 'The distance around the plate is ' + mm(plP) + '. Find the width.', canvas: B.shape('rectangle', { l: plL, w: plW }, { units: 'mm', hide: ['w'], width: '3in' }), a: mm(plW), work: '(' + n(plP) + ' − 2 × 203.2) ÷ 2', lines: 2 })),
    B.check('( 609.6 − 2 × 203.2 ) ÷ 2 =', n(plW)),
    B.prob({ q: 'Five holes are evenly spaced along a 750 mm bar. Find the distance from each end to the first hole.', canvas: G.holePlate(hpLen, hpEnd, 5, { ask: 'end', lastEnd: false, fmt: v => n(v) + ' mm', h: 50, ls: 16, max: '5.2in' }), a: mm(hpEnd), work: '(750 − 4 × 165) ÷ 2', lines: 2 }),
    B.prob({ q: 'Change one value: five pieces of 228.6 mm make up the bar. Find the overall length. If each piece is cut 1.5 mm shorter, what is the new overall length?', canvas: F.cutBar([1, 2, 3, 4, 5].map(() => ({ len: five })), { askTotal: true, fmt: v => n(v), max: '5.6in' }), a: mm(fiveTot) + ', then ' + mm(fiveNew), work: '5 × 228.6. 5 × 1.5 = 7.5 mm less.', lines: 2 }),
    B.grid2(
      B.prob({ q: 'Write each size as a fraction in lowest terms.', canvas: G.plate(decPl[0], decPl[1], { fmt: v => n(v) + '″', size: 240, max: '3in' }), a: '5.875 in = ' + tape(5.875, 16) + ', 3.25 in = ' + tape(3.25, 16), lines: 2 }),
      B.prob({ q: 'Read marks A and B. How far apart are they?', canvas: F.mmRuler(20, 50, [{ v: 23.5, lab: 'A' }, { v: 41, lab: 'B' }], { ppm: 10, max: '3in' }).replace(/font-size="10"([^>]*>cm<)/, 'font-size="13"$1'), a: 'A = 23.5 mm, B = 41 mm, ' + mm(41 - 23.5) + ' apart', lines: 2 }))
  ])
}
