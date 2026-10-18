/* Exercise Book, Chapter 13: Trigonometry */
module.exports = function (B, L) {
  const F = require('../engine/figs.js')
  const G = require('../engine/figs-ch12.js')
  const n = L.num
  const D2R = Math.PI / 180
  const sin = d => Math.sin(d * D2R), cos = d => Math.cos(d * D2R), tan = d => Math.tan(d * D2R)
  const asin = x => Math.asin(x) / D2R, acos = x => Math.acos(x) / D2R, atan = x => Math.atan(x) / D2R
  const f2 = x => n(L.round(x, 2), 2), f3 = x => n(L.round(x, 3), 3), f4 = x => n(L.round(x, 4), 4)
  const deg = x => f2(x) + '°'

  /* every label must print at 7 pt or more */
  function chk(svg, colIn) {
    const vb = /viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/.exec(svg)
    const mw = /max-width:([\d.]+)in/.exec(svg)
    const disp = Math.min(+mw[1], colIn || 6)
    const sizes = Array.from(svg.matchAll(/font-size="([\d.]+)"/g)).map(m => +m[1])
    const pt = Math.min(...sizes) * disp * 72 / +vb[3]
    if (pt < 7) throw new Error('ch13 exercise label prints at ' + pt.toFixed(2) + ' pt')
    return svg
  }
  const g = svg => chk(svg, 2.7)
  const full = svg => chk(svg, 6)

  /* right triangle with angle a at corner A, readable labels. lab: { opp, adj, hyp, ang, other } */
  function tt(a, lab, o) {
    o = o || {}
    const side = v => v == null ? null : (v === '?' ? { ask: true } : { lab: v })
    const sides = []
    const add = (p, q, v) => { const x = side(v); if (x) sides.push(Object.assign({ a: p, b: q, s: 20, off: 36 }, x)) }
    add('R', 'B', lab.opp)
    add('R', 'A', lab.adj)
    add('A', 'B', lab.hyp)
    const r = a < 30 ? 64 : 40
    const ang = { A: lab.ang === '?' ? { ask: true, r, s: 20 } : { lab: lab.ang || a + '°', r, s: 20 } }
    if (lab.other) ang.B = lab.other === '?' ? { ask: true, r: 44, s: 20 } : { lab: lab.other, r: 44, s: 20 }
    return G.auto(() => G.rt(10, 10 * tan(a), Object.assign({ ang, sides, W: 400, H: 230, pad: 62, padX: 110, max: '2.4in' }, o)), 2.7)
  }

  /* a shallow ramp drawn to scale, angle ? at the left vertex, dimensions clear of the ramp */
  function rampEx(run, rise, o) {
    const C = F.C, s = 440 / run, yb = 70, A = [60, yb], Rp = [60 + run * s, yb], Bp = [Rp[0], yb - rise * s]
    let h = F.poly([A, Rp, Bp], { fill: C.fill })
    h += F.rightMark(Rp, [-1, 0], [0, -1], 9)
    h += F.arc(A, -Math.atan2(rise, run), 0, 90, null, { c: C.red, w: 2 })
    h += F.line(A[0] + 90, yb + 2, A[0] + 90, yb + 20, { c: C.red, w: 1.6 }) + F.label(A[0] + 90, yb + 38, '?', { ask: true, s: 18 })
    h += F.dim(A[0], yb, Rp[0], yb, o.run, 70, { s: 18 })
    const xd = Rp[0] + 24
    h += F.line(Rp[0] + 4, yb, xd + 8, yb, { c: C.dim, w: 1.1 }) + F.line(Bp[0] + 4, Bp[1], xd + 8, Bp[1], { c: C.dim, w: 1.1 }) + F.line(xd, yb, xd, Bp[1], { c: C.dim, w: 1.2 })
    h += F.t(xd + 12, (yb + Bp[1]) / 2 + 6, o.rise, { s: 18, b: true, a: 'start' })
    return F.svg(Rp[0] + 130, yb + 104, h, { max: o.max })
  }

  /* values */
  const A5 = 650 * sin(32), A6 = 1250 * cos(48), A7 = 900 * tan(24), A8 = 520 / sin(38), A9 = 300 / tan(61), A10 = 42 * sin(15)
  const A11 = atan(350 / 800), A12 = asin(0.45 / 1.2), A13 = acos(700 / 950), A16 = atan(0.25)
  const B1 = 375 / sin(45), B2t = 9 / sin(60), B2r = 9 / tan(60), B3 = 12 / sin(22.5)
  const B4s = 640 * sin(30), B4r = 640 * cos(30), B5 = atan(250 / 433), B6t = Math.hypot(450, 600) / sin(45)
  const B7 = 750 / tan(4.8), B9r = 8500 * sin(12), B9h = 8500 * cos(12), B10 = 25 * tan(30), B12r = 3600 * tan(18), B12l = 3600 / cos(18), B13 = atan(8 / 14)
  const C1 = 1800 * sin(28), C2 = 2.4 / cos(55), C3 = 15 * tan(40), C4 = atan(560 / 1200), C5 = asin(380 / 610), C7 = 16 / sin(45), C8 = atan(250 / 6000), C10 = 12 * tan(37.5)

  return L.join([
    B.exChapter({ num: 13, id: 'trig', title: 'Trigonometry', intro: 'Practice naming sides, using sine, cosine and tangent, finding sides and angles, and solving slopes, pipe offsets, bevels and mitres. Your calculator must be in DEG mode.' }),

    B.worksheet({ title: 'Skills', sub: 'Sides, ratios, missing sides and missing angles.' }),
    B.prob({ q: 'Look at the triangle. Which side is opposite angle M? Which side is adjacent to angle M? Which side is the hypotenuse? Which side is opposite angle N?', canvas: full(tt(37, { opp: 'e', adj: 'd', hyp: 'f', ang: 'M', other: 'N' }, { max: '2.2in' })), a: 'Opposite M: e. Adjacent to M: d. Hypotenuse: f. Opposite N: d.', lines: 2 }),
    B.grid2(
      B.prob({ q: 'Find sin 25°, cos 25° and tan 25° to four decimal places.', a: f4(sin(25)) + ', ' + f4(cos(25)) + ', ' + f4(tan(25)), lines: 2 }),
      B.prob({ q: 'A right triangle has sides 8, 15 and 17. Angle A is opposite the 8. Write sin A, cos A and tan A to four decimal places.', a: 'sin A = 8/17 = ' + f4(8 / 17) + ', cos A = 15/17 = ' + f4(15 / 17) + ', tan A = 8/15 = ' + f4(8 / 15), lines: 2 }),
      B.prob({ q: 'Hypotenuse 650 mm, angle 32°. Find the opposite side to two decimal places.', a: f2(A5) + ' mm', work: '650 × sin 32°', lines: 2 }),
      B.prob({ q: 'Hypotenuse 1,250 mm, angle 48°. Find the adjacent side to two decimal places.', a: f2(A6) + ' mm', work: '1,250 × cos 48°', lines: 2 }),
      B.prob({ q: 'Adjacent 900 mm, angle 24°. Find the opposite side to two decimal places.', a: f2(A7) + ' mm', work: '900 × tan 24°', lines: 2 }),
      B.prob({ q: 'Opposite 520 mm, angle 38°. Find the hypotenuse to two decimal places.', a: f2(A8) + ' mm', work: '520 ÷ sin 38°', lines: 2 }),
      B.prob({ q: 'Opposite 300 mm, angle 61°. Find the adjacent side to two decimal places.', a: f2(A9) + ' mm', work: '300 ÷ tan 61°', lines: 2 }),
      B.prob({ q: 'Hypotenuse 42″, angle 15°. Find the opposite side to the nearest 1/16″.', a: L.inch(A10, 16) + ' (' + f3(A10) + '″)', work: '42 × sin 15°', lines: 2 }),
      B.prob({ q: 'Opposite 350 mm, adjacent 800 mm. Find the angle to two decimal places.', a: deg(A11), work: 'tan⁻¹(350 ÷ 800)', lines: 2 }),
      B.prob({ q: 'Opposite 0.45 m, hypotenuse 1.2 m. Find the angle to two decimal places.', a: deg(A12), work: 'sin⁻¹(0.45 ÷ 1.2)', lines: 2 }),
      B.prob({ q: 'Adjacent 700 mm, hypotenuse 950 mm. Find the angle to two decimal places.', a: deg(A13), work: 'cos⁻¹(700 ÷ 950)', lines: 2 }),
      B.prob({ q: 'One acute angle of a right triangle is 27.4°. Find the other one.', a: n(L.round(90 - 27.4, 1)) + '°', lines: 2 }),
      B.prob({ q: 'A slope rises 120 mm over a run of 6,000 mm. Find the percent grade and the angle to two decimal places.', a: 'Grade ' + n(120 / 6000 * 100) + '%, angle ' + deg(atan(120 / 6000)), lines: 2 }),
      B.prob({ q: 'tan A = 0.25. Find A to two decimal places.', a: deg(A16), lines: 2 })
    ),
    B.check('25 SIN', f4(sin(25))), B.check('25 COS', f4(cos(25))), B.check('25 TAN', f4(tan(25))),
    B.check('32 SIN × 650 =', f2(A5)), B.check('48 COS × 1250 =', f2(A6)), B.check('24 TAN × 900 =', f2(A7)),
    B.check('520 ÷ 38 SIN =', f2(A8)), B.check('300 ÷ 61 TAN =', f2(A9)), B.check('15 SIN × 42 =', f3(A10)),
    B.check('( 350 ÷ 800 ) TAN⁻¹', f2(A11)), B.check('( 0.45 ÷ 1.2 ) SIN⁻¹', f2(A12)), B.check('( 700 ÷ 950 ) COS⁻¹', f2(A13)),
    B.check('( 120 ÷ 6000 ) TAN⁻¹', f2(atan(120 / 6000))), B.check('0.25 TAN⁻¹', f2(A16)),

    B.worksheet({ title: 'Shop problems', sub: 'Pipe offsets, slopes, bevels and mitres. Metric and imperial.' }),
    B.grid2(
      B.prob({ q: 'A line moves over 375 mm with 45° fittings. Find the travel and the run to two decimal places.', a: 'Travel ' + f2(B1) + ' mm, run 375 mm', work: '375 ÷ sin 45°, and tan 45° = 1', lines: 4 }),
      B.prob({ q: 'A line moves over 9″ with 60° fittings. Find the travel and the run to the nearest 1/16″.', a: 'Travel ' + L.inch(B2t, 16) + ' (' + f3(B2t) + '″), run ' + L.inch(B2r, 16) + ' (' + f3(B2r) + '″)', work: '9 ÷ sin 60°, 9 ÷ tan 60°', lines: 4 }),
      B.prob({ q: 'A line moves over 12″ with 22.5° fittings. Find the travel to the nearest 1/16″.', a: L.inch(B3, 16) + ' (' + f3(B3) + '″)', work: '12 ÷ sin 22.5°', lines: 4 }),
      B.prob({ q: 'An offset made with 30° fittings has a travel of 640 mm. Find the set and the run to two decimal places.', a: 'Set ' + f2(B4s) + ' mm, run ' + f2(B4r) + ' mm', work: '640 × sin 30°, 640 × cos 30°', lines: 4 }),
      B.prob({ q: 'A line must move over 250 mm in a run of 433 mm. What fitting angle does it need, to two decimal places?', a: deg(B5), work: 'tan⁻¹(250 ÷ 433)', lines: 4 }),
      B.prob({ q: 'A rolling offset rises 450 mm and rolls 600 mm. Find the true offset, then the travel with 45° fittings, to two decimal places.', a: 'True offset ' + n(Math.hypot(450, 600)) + ' mm, travel ' + f2(B6t) + ' mm', work: '√(450² + 600²) = 750, 750 ÷ sin 45°', lines: 4 }),
      B.prob({ q: 'A ramp must rise 750 mm. The job sheet sets its angle at 4.8°. How long is the run, to the nearest millimetre?', a: n(Math.round(B7)) + ' mm', work: '750 ÷ tan 4.8° = ' + f2(B7), lines: 4 }),
      B.prob({ q: 'A drain line is laid at a 1% grade over an 18 m run. How far does it fall, in millimetres?', a: n(0.01 * 18000) + ' mm', work: '18,000 × 1 ÷ 100', lines: 4 }),
      B.prob({ q: 'A conveyor 8,500 mm long slopes up at 12°. Find the rise and the floor length to two decimal places.', a: 'Rise ' + f2(B9r) + ' mm, floor length ' + f2(B9h) + ' mm', work: '8,500 × sin 12°, 8,500 × cos 12°', lines: 4 }),
      B.prob({ q: 'A 25 mm plate is bevelled at 30° through its thickness. How wide is the bevel at the top, to two decimal places? What groove angle do two such plates open?', a: f2(B10) + ' mm, a 60° groove', work: '25 × tan 30°', lines: 4 }),
      B.prob({ q: 'A frame has 10 equal sides. Find the corner angle, the cut angle to the edge and the angle away from a square cut.', a: 'Corner ' + n(180 - 360 / 10) + '°, cut ' + n((180 - 360 / 10) / 2) + '°, away from square ' + n(90 - (180 - 360 / 10) / 2) + '°', lines: 4 }),
      B.prob({ q: 'A truss top chord rises at 18° over a half span of 3,600 mm. Find the rise and the chord length to two decimal places.', a: 'Rise ' + f2(B12r) + ' mm, chord ' + f2(B12l) + ' mm', work: '3,600 × tan 18°, 3,600 ÷ cos 18°', lines: 4 }),
      B.prob({ q: 'A 14 mm plate has a bevel 8 mm wide at the top, through the full thickness. Find the bevel angle to two decimal places.', a: deg(B13), work: 'tan⁻¹(8 ÷ 14)', lines: 4 }),
      B.prob({ q: 'With the 45° travel constant 1.414, what travel do you get for a 375 mm set? How far is it from the calculator value in problem 1, to two decimal places?', a: f2(375 * 1.414) + ' mm, ' + f2(B1 - 375 * 1.414) + ' mm short', lines: 4 })
    ),
    B.check('375 ÷ 45 SIN =', f2(B1)), B.check('9 ÷ 60 SIN =', f3(B2t)), B.check('9 ÷ 60 TAN =', f3(B2r)), B.check('12 ÷ 22.5 SIN =', f3(B3)),
    B.check('30 SIN × 640 =', f2(B4s)), B.check('30 COS × 640 =', f2(B4r)), B.check('( 250 ÷ 433 ) TAN⁻¹', f2(B5)), B.check('750 ÷ 45 SIN =', f2(B6t)),
    B.check('750 ÷ 4.8 TAN =', f2(B7)), B.check('12 SIN × 8500 =', f2(B9r)), B.check('12 COS × 8500 =', f2(B9h)), B.check('25 × 30 TAN =', f2(B10)),
    B.check('18 TAN × 3600 =', f2(B12r)), B.check('3600 ÷ 18 COS =', f2(B12l)), B.check('( 8 ÷ 14 ) TAN⁻¹', f2(B13)), B.check('375 × 1.414 =', f2(375 * 1.414)),

    B.worksheet({ title: 'Shape Canvas', sub: 'Every triangle is drawn at its true angle. Find every red ?' }),
    B.grid2(
      B.prob({ q: 'Find the height to two decimal places.', canvas: g(tt(28, { opp: '?', hyp: '1,800 mm' })), a: f2(C1) + ' mm', lines: 2 }),
      B.prob({ q: 'Find the hypotenuse to two decimal places.', canvas: g(tt(55, { adj: '2.4 m', hyp: '?' }, { flip: true, max: '1.8in' })), a: f2(C2) + ' m', lines: 2 }),
      B.prob({ q: 'Find the opposite side to the nearest 1/16″.', canvas: g(tt(40, { opp: '?', adj: '15″' }, { down: true, max: '2.2in' })), a: L.inch(C3, 16) + ' (' + f3(C3) + '″)', lines: 2 }),
      B.prob({ q: 'Find the angle to two decimal places.', canvas: g(tt(C4, { opp: '560 mm', adj: '1,200 mm', ang: '?' })), a: deg(C4), lines: 2 }),
      B.prob({ q: 'Find both acute angles to two decimal places.', canvas: g(tt(C5, { opp: '380 mm', hyp: '610 mm', ang: '?', other: '?' }, { max: '2.6in', H: 280 })), a: deg(C5) + ' and ' + deg(90 - L.round(C5, 2)), lines: 2 }),
      B.prob({ q: 'A 45° offset. Find the travel to the nearest 1/16″.', canvas: g(G.pipeOffset(45, 16, { set: '16″', run: 'run', askTravel: true, W: 300, max: '2.5in' })), a: L.inch(C7, 16) + ' (' + f3(C7) + '″)', lines: 2 })
    ),
    B.prob({ q: 'A ramp rises 250 mm over a run of 6,000 mm. Find its angle to two decimal places. The drawing is to scale.', canvas: full(rampEx(6000, 250, { run: '6,000 mm', rise: '250 mm', max: '4.4in' })), a: deg(C8), lines: 2 }),
    B.grid2(
      B.prob({ q: 'Find the bevel width to two decimal places.', canvas: g(G.auto(() => G.bevel(12, 37.5, { t: '12 mm', askW: true, size: 110, max: '2.6in' }), 2.7)), a: f2(C10) + ' mm', lines: 4 }),
      B.prob({ q: 'Break it down. A rolling offset rises 200 mm and rolls 350 mm. Find the true offset, then the travel with 60° fittings. Two decimal places.', canvas: g(G.auto(() => G.rt(350, 200, { sides: [{ a: 'R', b: 'A', lab: 'roll 350 mm', s: 18 }, { a: 'R', b: 'B', lab: 'rise 200 mm', s: 18, off: 64 }, { a: 'A', b: 'B', ask: true, off: 30 }], W: 460, H: 260, pad: 72, padX: 150, max: '2.5in' }), 2.7)), a: 'True offset ' + f2(Math.hypot(350, 200)) + ' mm, travel ' + f2(Math.hypot(350, 200) / sin(60)) + ' mm', lines: 3 })
    ),
    B.prob({ q: 'Change one value. A 45° offset with a 300 mm set has a travel of ' + f2(300 / sin(45)) + ' mm. Double the set to 600 mm. What is the travel, to two decimal places? Did it double?', a: f2(600 / sin(45)) + ' mm. Yes, it doubled: the set and the travel keep the same ratio.', lines: 4 }),
    B.check('15 × 40 TAN =', f3(C3)), B.check('28 SIN × 1800 =', f2(C1)), B.check('2.4 ÷ 55 COS =', f2(C2)), B.check('( 560 ÷ 1200 ) TAN⁻¹', f2(C4)),
    B.check('( 380 ÷ 610 ) SIN⁻¹', f2(C5)), B.check('16 ÷ 45 SIN =', f3(C7)), B.check('( 250 ÷ 6000 ) TAN⁻¹', f2(C8)), B.check('12 × 37.5 TAN =', f2(C10)),
    B.check('( 350 x² + 200 x² ) √x', f2(Math.hypot(350, 200))), B.check('( 350 x² + 200 x² ) √x ÷ 60 SIN =', f2(Math.hypot(350, 200) / sin(60)))
  ])
}
