/* Chapter 13: Trigonometry */
module.exports = function (B, L) {
  const F = require('../engine/figs.js')
  const G = require('../engine/figs-ch12.js')
  const C = F.C
  const n = L.num
  const D2R = Math.PI / 180
  const sin = d => Math.sin(d * D2R), cos = d => Math.cos(d * D2R), tan = d => Math.tan(d * D2R)
  const asin = x => Math.asin(x) / D2R, acos = x => Math.acos(x) / D2R, atan = x => Math.atan(x) / D2R
  const r2 = x => L.round(x, 2), f2 = x => n(L.round(x, 2), 2), f3 = x => n(L.round(x, 3), 3), f4 = x => n(L.round(x, 4), 4)
  const deg = x => f2(x) + '°'
  const A = G.auto, FK = G.FK
  /* print widths available to a drawing, in inches */
  const EX = 2.85, GRID = 2.6, FULL = 6.2
  /* limit a drawing by its printed height: sets max-width so the height is hIn inches */
  const hmax = (svg, hIn) => {
    const vb = /viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/.exec(svg)
    return svg.replace(/max-width:[\d.]+in/, 'max-width:' + (hIn * vb[3] / vb[4]).toFixed(2) + 'in')
  }

  /* right triangle with the given angle at corner A on the base. lab: { opp, adj, hyp, ang } where a value of '?'
     draws the red ? chip and null leaves the side bare. o: rot, flip, down, W, H, max, other (label for the other acute angle) */
  function tt(a, lab, o) {
    o = o || {}
    const side = v => v == null ? null : (v === '?' ? { ask: true } : { lab: v })
    const sides = []
    const add = (p, q, v, s) => { const x = side(v); if (x) sides.push(Object.assign({ a: p, b: q, s: s || 15, off: 22 }, x)) }
    add('R', 'B', lab.opp)
    add('R', 'A', lab.adj)
    add('A', 'B', lab.hyp)
    const ang = { A: lab.ang === '?' ? { ask: true, r: a < 30 ? 56 : 34, s: 15 } : { lab: lab.ang || a + '°', r: a < 30 ? 56 : 34, s: 15 } }
    if (lab.other) ang.B = lab.other === '?' ? { ask: true, r: 28, s: 15 } : { lab: lab.other, r: 28, s: 15 }
    return G.rt(10, 10 * tan(a), Object.assign({ ang, sides, W: 360, H: 240, pad: 58, max: '2.2in' }, o))
  }
  /* height-limited ramp for a worksheet column */
  function rampFig(run, rise, extra) {
    return G.ramp(run, rise, Object.assign({ ang: { A: { ask: true, r: 90, s: 15 } }, sides: [{ a: 'A', b: 'R', lab: n(run) + ' mm', dim: true, s: 15 }, { a: 'R', b: 'B', lab: n(rise) + ' mm', dim: true, s: 15 }] }, extra))
  }
  /* the named sides of a triangle seen from one of its acute angles */
  function named(fromB) {
    const lab = fromB ? { opp: 'adjacent', adj: 'opposite', hyp: 'hypotenuse' } : { opp: 'opposite', adj: 'adjacent', hyp: 'hypotenuse' }
    const ang = fromB ? { B: { lab: 'B', r: 28, s: 17 } } : { A: { lab: 'A', r: 36, s: 17 } }
    const sides = [{ a: 'R', b: 'B', lab: lab.opp, s: 16 }, { a: 'R', b: 'A', lab: lab.adj, s: 16 }, { a: 'A', b: 'B', lab: lab.hyp, s: 16, off: 24 }]
    return G.rt(4, 3, { ang, sides, W: 420, H: 250, pad: 62, padX: 110, max: '2.3in' })
  }

  /* three 30° triangles drawn to one scale, so the sizes compare */
  function similar30() {
    const S = 62, base = 186, gap = 40
    let h = '', x = 64
    ;[1, 1.5, 2].forEach(k => {
      const b = k * Math.sqrt(3) * S, ht = k * S
      const A = [x + b, base], R0 = [x, base], T = [x, base - ht]
      h += F.poly([R0, A, T]) + G.rightAt(R0, A, T) + G.arcAt(A, R0, T, 30, '30°', { s: 13, lr: 14 })
      h += FK.label(x - 24, base - ht / 2 + 5, n(k, 1) + ' m', { s: 14 }) + FK.label(x + b / 2 + 10, base - ht / 2 - 12, n(2 * k, 1) + ' m', { s: 14, c: C.deep })
      x += b + gap + 30
    })
    return F.svg(x, base + 14, h, { max: '5.6in' })
  }

  /* worked numbers */
  const ex1 = { h: 2400, a: 35 }, ex1v = ex1.h * sin(ex1.a)
  const ex2 = { h: 6000, a: 15 }, ex2v = ex2.h * cos(ex2.a)
  const ex3 = { b: 4200, a: 22 }, ex3v = ex3.b * tan(ex3.a)
  const ex4 = { o: 1800, a: 50 }, ex4v = ex4.o / sin(ex4.a)
  const ex5 = { h: 24, a: 30 }, ex5v = ex5.h * cos(ex5.a), ex5d = L.round(ex5v - Math.floor(ex5v), 5)
  const an2 = { o: 1500, h: 2200 }, an2v = asin(an2.o / an2.h)
  const an3 = { b: 1250, h: 1800 }, an3v = acos(an3.b / an3.h)
  const rp = { rise: 450, run: 5400 }, rpA = atan(rp.rise / rp.run), rpG = rp.rise / rp.run * 100, rpL = Math.hypot(rp.rise, rp.run)
  const dr = { g: 2, run: 12000 }, drF = dr.g / 100 * dr.run, drA = atan(dr.g / 100)
  const rl = { len: 4000, a: 5 }, rlRise = rl.len * sin(rl.a), rlRun = rl.len * cos(rl.a)
  const po1 = { set: 450, a: 45 }, po1T = po1.set / sin(po1.a), po1R = po1.set / tan(po1.a)
  const po2 = { set: 14, a: 60 }, po2T = po2.set / sin(po2.a), po2R = po2.set / tan(po2.a)
  const po3 = { set: 300, run: 520 }, po3A = atan(po3.set / po3.run)
  const consts = [60, 45, 30, 22.5, 11.25]
  const bv = { t: 12, a: 30 }, bvW = bv.t * tan(bv.a)
  const bv2 = { t: 10, w: 6 }, bv2A = atan(bv2.w / bv2.t)
  const frames = [4, 6, 8, 12]

  /* 13.5 inches per foot, and Section 13.8 roofs, stairs and ramps */
  const PL = require('../engine/plates.js')
  const ipf = 0.25
  const pitches = [2, 3, 4, 5, 6, 8, 10, 12]
  const rp5 = atan(5 / 12)
  const dn = { ipf: 0.25, run: 30 }
  const sh = { p: 3, normal: 3, low: 6 }
  const vt = { p: 1.5, area: 96 }
  const sa = { rise: 2720 / 14, run: 265 }
  const ramps = [['Exterior ramps', 'a', 10], ['Interior ramps serving residential occupancies', 'b', 10], ['Industrial occupancies', 'c', 6], ['All other occupancies', 'd', 8]]
  const rx = { rise: 600, k: 10 }
  const rc = { p: 6 }

  return L.join([
    B.chapter({
      num: 13, id: 'trig', title: 'Trigonometry',
      intro: B.p('The Pythagorean theorem finds a side when you know two sides. On the job you often know one side and an angle instead: a brace set at 35°, a ramp that must not be steeper than a given slope, a pipe offset made with 45° fittings.',
        'Trigonometry links the angles of a right triangle to its sides. With three ratios, sine, cosine and tangent, and the SIN, COS and TAN keys on your calculator, you can find any side or any angle of a right triangle.'),
      objectives: ['Name the opposite side, adjacent side and hypotenuse from a given angle', 'Write the sine, cosine and tangent ratios', 'Use SIN, COS and TAN in DEG mode on both calculators', 'Find a missing side from one side and one angle', 'Find a missing angle with the inverse keys', 'Solve slopes, ramps, pipe offsets, bevels and mitres'],
      words: ['trigonometry', 'opposite side', 'adjacent side', 'sine', 'cosine', 'tangent', 'inverse trig function', 'offset'],
      art: '<div class="figrow" style="align-items:center"><div>' + A(() => hmax(named(false), 1.15), 2.2) + '</div><div>' + A(() => hmax(G.pipeOffset(45, 300, { set: 'set', run: 'run', travel: 'travel', W: 420 }), 1.2), 3.8) + '</div></div>'
    }),

    B.section('Naming the sides'),
    B.p(B.term('Trigonometry', 'The math that links the angles of a right triangle to the lengths of its sides.') + ' is the math that links the angles of a right triangle to the lengths of its sides. It always starts from one of the two acute angles. From that angle, each side gets a name.'),
    B.ul(['The ' + B.term('hypotenuse') + ' is across from the right angle. It is the longest side.',
      'The ' + B.term('opposite side', 'In a right triangle, the side across from the angle you are working with.') + ' is across from the angle you are working with. It does not touch that angle.',
      'The ' + B.term('adjacent side', 'In a right triangle, the side next to the angle you are working with that is not the hypotenuse.') + ' is next to the angle. It is the side that touches the angle and is not the hypotenuse.']),
    B.figure('<div class="figrow"><div style="flex:1">' + A(() => named(false), 3) + '</div><div style="flex:1">' + A(() => named(true), 3) + '</div></div>', 'The same triangle named from angle A (left) and from angle B (right). The opposite and adjacent sides swap. The hypotenuse stays the same.'),
    B.keyidea('Mark the angle first', 'Put your finger on the angle you are working with. The side your finger cannot touch is the opposite side. Of the two sides that touch it, the longer one is the hypotenuse and the other one is the adjacent side.'),
    B.figure(A(() => tt(31, { opp: 'q', adj: 'p', hyp: 'r', ang: 'X', other: 'Y' }, { max: '2in' }), FULL), 'A right triangle with sides p, q and r and acute angles X and Y.'),
    B.tryIt([
      { q: 'In Figure ' + B.ch + '.' + B.fig + ', which side is opposite angle X?', a: 'q' },
      { q: 'Which side is adjacent to angle X?', a: 'p' },
      { q: 'Which side is the hypotenuse?', a: 'r' },
      { q: 'Which side is opposite angle Y?', a: 'p' },
      { q: 'Which side is adjacent to angle Y?', a: 'q' },
      { q: 'Angle X is 31°. How big is angle Y?', a: n(90 - 31) + '°' }
    ]),

    B.section('Sine, cosine and tangent'),
    B.p('Draw any right triangle with a 30° angle, large or small. Divide the opposite side by the hypotenuse and you always get 0.5. The ratio of two sides depends only on the angle, not on the size of the triangle. That is why one angle and one side are enough to find the rest.'),
    B.figure(A(() => similar30(), FULL), 'Three 30° triangles. In each one, opposite ÷ hypotenuse = 1 ÷ 2 = 1.5 ÷ 3 = 2 ÷ 4 = 0.5.'),
    B.p('Each pair of sides gives a ratio with its own name. The ' + B.term('sine', 'In a right triangle, the opposite side divided by the hypotenuse. Written sin.') + ' (sin) of an angle is opposite ÷ hypotenuse. The ' + B.term('cosine', 'In a right triangle, the adjacent side divided by the hypotenuse. Written cos.') + ' (cos) is adjacent ÷ hypotenuse. The ' + B.term('tangent', 'In a right triangle, the opposite side divided by the adjacent side. Written tan.') + ' (tan) is opposite ÷ adjacent.'),
    B.formula('The three trig ratios', ['sin A = opposite ÷ hypotenuse', 'cos A = adjacent ÷ hypotenuse', 'tan A = opposite ÷ adjacent'], 'A memory aid: SOH CAH TOA. S = O ÷ H, C = A ÷ H, T = O ÷ A.'),
    B.example({
      title: 'The ratios of a 3-4-5 triangle',
      q: 'A right triangle has sides 3, 4 and 5. Angle A is opposite the side of 3. Write sin A, cos A and tan A as fractions and as decimals.',
      fig: A(() => tt(atan(3 / 4), { opp: '3', adj: '4', hyp: '5', ang: 'A' }, { max: '1.8in' }), EX),
      steps: ['From A: opposite = 3, adjacent = 4, hypotenuse = 5.', 'sin A = 3 ÷ 5 = ' + n(3 / 5) + '.', 'cos A = 4 ÷ 5 = ' + n(4 / 5) + '.', 'tan A = 3 ÷ 4 = ' + n(3 / 4) + '.'],
      answer: 'sin A = 3/5 = 0.6, cos A = 4/5 = 0.8, tan A = 3/4 = 0.75.'
    }),
    B.sub('The trig keys and DEG mode'),
    B.p('Angles in this book are in degrees, so both calculators must be in degree mode. On the TI-30Xa, check that DEG shows in the display. If it does not, press DRG until it does. On the Sharp EL-531XT, DEG shows at the top of the display, and the DRG key steps through DEG, RAD and GRAD. Chapter 2 shows the keys.',
      'The keys go in a different order. On the TI-30Xa, key the angle first, then SIN, COS or TAN. On the Sharp, press sin, cos or tan first, then the angle, then =.'),
    B.calc({
      title: 'Check your mode: sin 30°', seq: '30 SIN', expect: '0.5',
      say: 'If sin 30° does not give 0.5, the calculator is not in degree mode. In radian mode the same keys give ' + f3(Math.sin(30)) + '. Press DRG until DEG shows, then try again.'
    }),
    B.tryIt([
      { q: 'sin 40° to four decimal places', a: f4(sin(40)) },
      { q: 'cos 40° to four decimal places', a: f4(cos(40)) },
      { q: 'tan 40° to four decimal places', a: f4(tan(40)) },
      { q: 'tan 45°', a: n(L.round(tan(45), 6)) },
      { q: 'sin 60° and cos 30° to four decimal places. What do you notice?', a: f4(sin(60)) + ' and ' + f4(cos(30)) + '. The same, because 60° and 30° are the two acute angles of one triangle.' },
      { q: 'A right triangle has opposite 5, adjacent 12, hypotenuse 13. Find sin A and tan A to four decimal places.', a: 'sin A = 5 ÷ 13 = ' + f4(5 / 13) + ', tan A = 5 ÷ 12 = ' + f4(5 / 12) }
    ]),

    B.section('Finding a side'),
    B.how(['Mark the angle you know.', 'Name the side you know and the side you want: opposite, adjacent or hypotenuse.', 'Pick the ratio that uses those two sides: SOH, CAH or TOA.', 'Write the ratio with the numbers in it and ' + B.term('transpose') + ' it for the side you want.', 'Check: the hypotenuse must be the longest side.']),
    B.watch('When the side you want is on the bottom, divide', 'If the unknown side is the hypotenuse in SOH or CAH, or the adjacent side in TOA, it sits under the fraction bar. Then you divide the known side by sin, cos or tan instead of multiplying.'),
    B.example({
      title: 'Height of a brace (sine)',
      q: 'A brace ' + n(ex1.h) + ' mm long is set at ' + ex1.a + '° to the floor. How high up the wall does it reach? Give the answer to two decimal places.',
      fig: A(() => tt(ex1.a, { opp: '?', hyp: n(ex1.h) + ' mm' }), EX),
      steps: ['From the ' + ex1.a + '° angle: the brace is the hypotenuse, the height is the opposite side.', 'Opposite and hypotenuse: SOH. sin ' + ex1.a + '° = opposite ÷ ' + n(ex1.h) + '.', 'Multiply both sides by ' + n(ex1.h) + ': opposite = ' + n(ex1.h) + ' × sin ' + ex1.a + '°.'],
      calc: { seq: ex1.a + ' SIN × ' + ex1.h + ' =', expect: f2(ex1v) },
      answer: f2(ex1v) + ' mm'
    }),
    B.example({
      title: 'Rise of a truss (tangent)',
      q: 'The top chord of a truss rises at ' + ex3.a + '° over a half span of ' + n(ex3.b) + ' mm. How high is the peak above the bottom chord? Give the answer to two decimal places.',
      fig: A(() => tt(ex3.a, { opp: '?', adj: n(ex3.b) + ' mm' }, { max: '2.4in' }), EX),
      steps: ['The half span is the adjacent side. The height is the opposite side.', 'Opposite and adjacent: TOA. opposite = ' + n(ex3.b) + ' × tan ' + ex3.a + '°.'],
      calc: { seq: ex3.a + ' TAN × ' + ex3.b + ' =', expect: f2(ex3v) },
      answer: f2(ex3v) + ' mm'
    }),
    B.example({
      title: 'Length of a brace (divide)',
      q: 'A brace must reach ' + n(ex4.o) + ' mm up a column and meet the floor at ' + ex4.a + '°. How long is the brace? Give the answer to two decimal places.',
      fig: A(() => tt(ex4.a, { opp: n(ex4.o) + ' mm', hyp: '?' }, { max: '1.8in' }), EX),
      steps: ['The height is the opposite side. The brace is the hypotenuse.', 'SOH: sin ' + ex4.a + '° = ' + n(ex4.o) + ' ÷ hypotenuse.', 'Transpose: hypotenuse = ' + n(ex4.o) + ' ÷ sin ' + ex4.a + '°.'],
      calc: { seq: ex4.o + ' ÷ ' + ex4.a + ' SIN =', expect: f2(ex4v) },
      answer: f2(ex4v) + ' mm. Check: longer than the ' + n(ex4.o) + ' mm height.'
    }),
    B.example({
      title: 'Inches to the nearest sixteenth',
      q: 'A ' + ex5.h + '″ gusset edge is set at ' + ex5.a + '° to the base. Find the base (the adjacent side) to the nearest 1/16″.',
      fig: A(() => tt(ex5.a, { adj: '?', hyp: ex5.h + '″' }, { max: '2.1in' }), EX),
      steps: ['CAH: adjacent = ' + ex5.h + ' × cos ' + ex5.a + '° = ' + n(L.round(ex5v, 5), 5) + '″ (the display shows more digits).', 'Sixteenths: ' + n(ex5d, 5) + ' × 16 = ' + f2(ex5d * 16) + ', which rounds to ' + Math.round(ex5d * 16) + '.'],
      calc: { seq: ex5.a + ' COS × ' + ex5.h + ' =', expect: f3(ex5v) },
      answer: L.inch(ex5v, 16)
    }),
    B.check(String(ex5d) + ' × 16 =', f2(ex5d * 16)),
    B.tryIt([
      { q: 'Hypotenuse 800 mm, angle 25°. Find the opposite side to two decimal places.', a: f2(800 * sin(25)) + ' mm' },
      { q: 'Hypotenuse 1,500 mm, angle 40°. Find the adjacent side to two decimal places.', a: f2(1500 * cos(40)) + ' mm' },
      { q: 'Adjacent 2,000 mm, angle 18°. Find the opposite side to two decimal places.', a: f2(2000 * tan(18)) + ' mm' },
      { q: 'Opposite 600 mm, angle 35°. Find the hypotenuse to two decimal places.', a: f2(600 / sin(35)) + ' mm' },
      { q: 'Opposite 900 mm, angle 52°. Find the adjacent side to two decimal places.', a: f2(900 / tan(52)) + ' mm' },
      { q: 'Hypotenuse 30″, angle 40°. Find the opposite side to the nearest 1/16″.', a: L.inch(30 * sin(40), 16) + ' (' + f3(30 * sin(40)) + '″)' }
    ]),

    B.section('Finding an angle'),
    B.p('When you know two sides, work out their ratio and then turn the ratio back into an angle. That is the job of an ' + B.term('inverse trig function', 'A function that turns a trig ratio back into an angle: SIN⁻¹, COS⁻¹ and TAN⁻¹.') + ': SIN⁻¹, COS⁻¹ and TAN⁻¹. They are the second functions of the SIN, COS and TAN keys.',
      'On the TI-30Xa, key the ratio, then 2nd and SIN, COS or TAN. Put a division in brackets so it is worked out first. On the Sharp, press 2ndF and sin, cos or tan first, then the ratio, then =.'),
    B.example({
      title: 'The angles of a 3-4-5 triangle', long: true,
      q: 'Find both acute angles of a 3-4-5 triangle to two decimal places. Angle A is opposite the side of 3.',
      fig: A(() => tt(atan(3 / 4), { opp: '3', adj: '4', hyp: '5', ang: '?', other: '?' }, { max: '1.9in', H: 280 }), EX),
      steps: ['From A, the opposite side is 3 and the adjacent side is 4: TOA.', 'tan A = 3 ÷ 4, so A = tan⁻¹(3 ÷ 4) = ' + deg(atan(3 / 4)) + '.', 'The two acute angles add to 90°: B = 90° − ' + deg(atan(3 / 4)) + ' = ' + deg(90 - L.round(atan(3 / 4), 2)) + '.'],
      calc: { rows: [{ label: 'A from TOA', seq: '( 3 ÷ 4 ) TAN⁻¹', expect: f2(atan(3 / 4)) }, { label: 'Check with SOH', seq: '( 3 ÷ 5 ) SIN⁻¹', expect: f2(asin(3 / 5)) }], say: 'Any ratio that uses two known sides gives the same angle. Here SOH, sin A = 3 ÷ 5, checks the answer.' },
      answer: 'A = ' + deg(atan(3 / 4)) + ', B = ' + deg(90 - L.round(atan(3 / 4), 2))
    }),
    B.watch('Ratio key or angle key?', 'SIN, COS and TAN turn an angle into a ratio. SIN⁻¹, COS⁻¹ and TAN⁻¹ turn a ratio into an angle. A sine or cosine ratio is always less than 1, because the hypotenuse is the longest side. If yours is more than 1, the sides are mixed up.'),
    B.tryIt([
      { q: 'Opposite 500, adjacent 800. Find the angle to two decimal places.', a: deg(atan(500 / 800)) },
      { q: 'Opposite 700, hypotenuse 1,000. Find the angle to two decimal places.', a: deg(asin(0.7)) },
      { q: 'Adjacent 1,100, hypotenuse 1,400. Find the angle to two decimal places.', a: deg(acos(1100 / 1400)) },
      { q: 'Opposite 9″, adjacent 12″. Find both acute angles to two decimal places.', a: deg(atan(9 / 12)) + ' and ' + deg(90 - L.round(atan(9 / 12), 2)) },
      { q: 'sin A = 0.5. Find A.', a: n(L.round(asin(0.5), 6)) + '°' },
      { q: 'tan A = 1. Find A.', a: n(L.round(atan(1), 6)) + '°' }
    ]),

    B.section('Slopes and ramps'),
    B.p('A slope is a right triangle lying on its side. The rise is the opposite side, the run is the adjacent side and the length along the slope is the hypotenuse. The angle of the slope comes from the tangent: angle = tan⁻¹(rise ÷ run).',
      'Slopes are also given as a ' + B.term('percent') + ' grade: rise ÷ run × 100. A slope written as 1 in 12 rises 1 unit for every 12 units of run.'),
    B.example({
      title: 'Angle and grade of a ramp',
      q: 'A ramp rises ' + rp.rise + ' mm over a run of ' + n(rp.run) + ' mm. Find its angle and its percent grade to two decimal places.',
      fig: A(() => G.ramp(rp.run, rp.rise, { ang: { A: { ask: true, r: 90, s: 15 } }, sides: [{ a: 'A', b: 'R', lab: n(rp.run) + ' mm', dim: true, s: 15 }, { a: 'R', b: 'B', lab: rp.rise + ' mm', dim: true, s: 15 }], W: 440, H: 150, pad: 56, max: '2.8in' }), EX),
      steps: ['Rise and run are opposite and adjacent: TOA.', 'Angle = tan⁻¹(' + rp.rise + ' ÷ ' + n(rp.run) + ').', 'Grade = ' + rp.rise + ' ÷ ' + n(rp.run) + ' × 100 = ' + f2(rpG) + '%.'],
      calc: { seq: '( ' + rp.rise + ' ÷ ' + rp.run + ' ) TAN⁻¹', expect: f2(rpA) },
      answer: 'Angle ' + deg(rpA) + ', grade ' + f2(rpG) + '%. The drawing is to scale: a slope this gentle looks almost flat.'
    }),
    B.check(rp.rise + ' ÷ ' + rp.run + ' × 100 =', f2(rpG)),
    B.tip('1 in 12', rp.rise + ' ÷ ' + n(rp.run) + ' is the same ratio as 1 ÷ 12. So a slope of 1 in 12 has the same angle, ' + deg(atan(1 / 12)) + '.'),
    B.example({
      title: 'Fall of a drain line',
      q: 'A drain line runs ' + n(dr.run) + ' mm at a grade of ' + dr.g + '%. How far does it fall, and what is its angle to two decimal places?',
      steps: ['Grade = fall ÷ run × 100, so fall = run × grade ÷ 100 = ' + n(dr.run) + ' × ' + dr.g + ' ÷ 100 = ' + n(drF) + ' mm.', 'Angle = tan⁻¹(' + dr.g + ' ÷ 100) = tan⁻¹(' + n(dr.g / 100) + ') = ' + deg(drA) + '. Key it the same way as the ramp angle.'],
      answer: 'Fall ' + n(drF) + ' mm, angle ' + deg(drA) + '.'
    }),
    B.check(n(dr.g / 100) + ' TAN⁻¹', f2(drA)),
    B.sub('Inches per foot'),
    B.p('A slope can also be given as the rise in inches for every foot (12″) of run, such as ' + L.fr(1, 4) + '″ per foot. Divide the inches by 12 to get the ratio rise ÷ run. ' + L.fr(1, 4) + '″ per foot is 0.25 ÷ 12, the same as 1 in ' + n(12 / ipf) + ', which is also written 1:' + n(12 / ipf) + '. As a grade it is 0.25 ÷ 12 × 100 = ' + f2(ipf / 12 * 100) + '%, and its angle is tan⁻¹(0.25 ÷ 12) = ' + deg(atan(ipf / 12)) + '.',
      'A roof that rises 5″ per foot is a 5 in 12 roof. Its ratio is 5 ÷ 12, which is 1 in ' + n(L.round(12 / 5, 2)) + ', and its angle is tan⁻¹(5 ÷ 12) = ' + deg(atan(5 / 12)) + '. Section 13.8 works with roof slopes in this form.'),
    B.keyidea('One slope, five ways', L.fr(1, 4) + '″ per foot = 1 in ' + n(12 / ipf) + ' = 1:' + n(12 / ipf) + ' = ' + f2(ipf / 12 * 100) + '% grade = ' + deg(atan(ipf / 12)) + '. The first three are ratios of rise to run, the grade is the ratio × 100 and the angle comes from TAN⁻¹ of the ratio.'),
    B.check('0.25 ÷ 12 × 100 =', f2(ipf / 12 * 100)),
    B.check('( 0.25 ÷ 12 ) TAN⁻¹', f2(atan(ipf / 12))),
    B.check('( 5 ÷ 12 ) TAN⁻¹', f2(atan(5 / 12))),
    B.tryIt([
      { q: 'Rise 300 mm, run 4,000 mm. Find the angle and the grade to two decimal places.', a: deg(atan(300 / 4000)) + ', ' + f2(300 / 4000 * 100) + '%' },
      { q: 'A slope of 1 in 20. Find the angle to two decimal places.', a: deg(atan(1 / 20)) },
      { q: 'A 1% grade over a 15,000 mm run. How far does it fall?', a: n(0.01 * 15000) + ' mm' },
      { q: 'A ramp is 3,000 mm long, measured along the slope. It slopes at 4°. Find the rise to two decimal places.', a: f2(3000 * sin(4)) + ' mm' },
      { q: 'A roof rises 6″ for every 12″ of run. Find its angle to two decimal places.', a: deg(atan(6 / 12)) },
      { q: 'A ramp must rise 600 mm at an angle of 3°. How long is the run, to the nearest millimetre?', a: n(Math.round(600 / tan(3))) + ' mm' }
    ]),

    B.section('Pipe offsets'),
    B.p('An ' + B.term('offset', 'A change in the line of a pipe that moves it over to a new line parallel to the first. In this book an offset has two fittings of the same angle.') + ' moves a pipe over to a new line that is parallel to the first one. In this book an offset has two fittings of the same angle, and the three measurements of an offset are the sides of a right triangle. In this book, set, run and travel are measured along the centreline of the pipe.'),
    B.ul(['<b>Set:</b> how far the pipe moves over, square to the two parallel lines. It is the side opposite the fitting angle.',
      '<b>Run:</b> the distance along the line of the pipe that the offset takes up. It is the side adjacent to the fitting angle.',
      '<b>Travel:</b> the length along the centreline of the angled part, from one fitting to the other. It is the hypotenuse.']),
    B.figure(A(() => G.pipeOffset(45, 300, { set: 'set', run: 'run', travel: 'travel', ang: 'θ', W: 440, max: '3.1in' }), FULL), 'A 45° offset. Set, run and travel form a right triangle. The fitting angle θ (theta) is at the first fitting.'),
    B.formula('Offsets', ['travel = set ÷ sin θ', 'run = set ÷ tan θ', 'set = travel × sin θ'], 'θ (theta) is the fitting angle. These are SOH and TOA with the set as the opposite side.'),
    B.example({
      title: 'A 45° offset',
      q: 'A line must move over ' + po1.set + ' mm using 45° fittings. Find the travel and the run, to two decimal places.',
      fig: A(() => G.pipeOffset(45, po1.set, { set: po1.set + ' mm', askRun: true, askTravel: true, W: 400, max: '2.6in' }), EX),
      steps: ['Travel = ' + po1.set + ' ÷ sin 45°.', 'Run = ' + po1.set + ' ÷ tan 45°. Since tan 45° = 1, the run equals the set: ' + f2(po1R) + ' mm.'],
      calc: { seq: po1.set + ' ÷ 45 SIN =', expect: f2(po1T) },
      answer: 'Travel ' + f2(po1T) + ' mm, run ' + f2(po1R) + ' mm.'
    }),
    B.example({
      title: 'A 60° offset in inches',
      q: 'A line must move over ' + po2.set + '″ using 60° fittings. Find the travel and the run to the nearest 1/16″.',
      steps: ['Travel = ' + po2.set + ' ÷ sin 60° = ' + f3(po2T) + '″.', 'Run = ' + po2.set + ' ÷ tan 60° = ' + f3(po2R) + '″.', 'Change each decimal part to sixteenths and round.'],
      calc: { rows: [{ label: 'Travel', seq: po2.set + ' ÷ 60 SIN =', expect: f3(po2T) }, { label: 'Run', seq: po2.set + ' ÷ 60 TAN =', expect: f3(po2R) }] },
      answer: 'Travel ' + L.inch(po2T, 16) + ', run ' + L.inch(po2R, 16) + '.'
    }),
    B.sub('Where offset constants come from'),
    B.p('Travel = set ÷ sin θ is the same as set × (1 ÷ sin θ). The number 1 ÷ sin θ depends only on the fitting angle, so it can be worked out once and kept in a table. The same goes for 1 ÷ tan θ for the run. Every one of these numbers comes from the calculator:'),
    B.table(['Fitting angle θ', 'Travel constant 1 ÷ sin θ', 'Run constant 1 ÷ tan θ'], consts.map(a => [n(a) + '°', f3(1 / sin(a)), f3(1 / tan(a))]), { align: ['c', 'c', 'c'], caption: 'Offset constants worked out from sine and tangent, to three decimal places.' }),
    B.calc({ title: 'The 45° travel constant: 1 ÷ sin 45°', seq: '45 SIN 1/x', expect: f3(1 / sin(45)), say: 'The 1/x key (2ndF x⁻¹ on the Sharp) divides 1 by the number. For the run constant, use TAN instead of SIN.' }),
    B.watch('A rounded constant gives a rounded answer', 'With the constant 1.414, the 45° travel above is ' + po1.set + ' × 1.414 = ' + f2(po1.set * 1.414) + ' mm. Dividing by sin 45° on the calculator gives ' + f2(po1T) + ' mm. The difference grows with the set, so use the calculator value when you can. To find the fitting angle from a set and a run, use θ = tan⁻¹(set ÷ run).'),
    B.check(po1.set + ' × 1.414 =', f2(po1.set * 1.414)),
    B.tryIt([
      { q: '45° fittings, set 600 mm. Find the travel to two decimal places.', a: f2(600 / sin(45)) + ' mm' },
      { q: '60° fittings, set 400 mm. Find the travel and run to two decimal places.', a: 'Travel ' + f2(400 / sin(60)) + ' mm, run ' + f2(400 / tan(60)) + ' mm' },
      { q: '22.5° fittings, set 250 mm. Find the travel to two decimal places.', a: f2(250 / sin(22.5)) + ' mm' },
      { q: '45° fittings, set 10″. Find the travel to the nearest 1/16″.', a: L.inch(10 / sin(45), 16) },
      { q: 'Travel 900 mm with 30° fittings. Find the set.', a: n(L.round(900 * sin(30), 6)) + ' mm' },
      { q: 'Set 350 mm, run 350 mm. What fitting angle?', a: n(L.round(atan(1), 6)) + '°' }
    ]),

    B.section('Bevel and mitre angles'),
    B.p('A mitre joint joins two pieces at a corner. Each piece is cut at an angle so that the joint line splits the corner angle in half. For a square corner (90°), each piece is cut at 45° to its edge.',
      'A frame with equal sides and equal corners turns 360° in all, so each corner turns 360° ÷ n, where n is the number of sides. The corner angle inside the frame is 180° − 360° ÷ n, and each piece is cut at half of that to its edge.'),
    B.figure('<div class="figrow"><div style="flex:1">' + A(() => G.mitreCorner(4, { max: '2in' }), 2.1) + '</div><div style="flex:1">' + A(() => G.mitreCorner(6, { max: '2.1in' }), 2.1) + '</div><div style="flex:1">' + G.polyFrame(6, { max: '1.3in' }) + '</div></div>', 'Mitre joints for a square corner (90°, cut at 45°) and for a six-sided frame (120°, cut at 60°).'),
    B.table(['Sides n', 'Corner angle 180° − 360° ÷ n', 'Cut angle to the edge (half the corner)', 'Angle away from a square cut'], frames.map(k => [String(k), n(180 - 360 / k) + '°', n((180 - 360 / k) / 2) + '°', n(90 - (180 - 360 / k) / 2) + '°']), { align: ['c', 'c', 'c', 'c'], caption: 'Mitre angles for frames with equal sides.' }),
    B.p('A bevel is an angled face cut along the edge of a plate. In this book the bevel angle is measured from the square edge. Through the full thickness t, the bevel is t × tan(angle) wide at the top. Two plates bevelled at the same angle and butted together open a groove of twice the bevel angle.'),
    B.example({
      title: 'Width of a bevel',
      q: 'A ' + bv.t + ' mm plate is bevelled at ' + bv.a + '° through its full thickness. How wide is the bevel at the top, to two decimal places?',
      fig: A(() => G.bevel(bv.t, bv.a, { t: bv.t + ' mm', askW: true, size: 110, max: '2.8in' }), EX),
      steps: ['The thickness is the side adjacent to the bevel angle. The width is the opposite side: TOA.', 'Width = ' + bv.t + ' × tan ' + bv.a + '°.'],
      calc: { seq: bv.t + ' × ' + bv.a + ' TAN =', expect: f2(bvW) },
      answer: f2(bvW) + ' mm. Two plates bevelled like this open a ' + n(2 * bv.a) + '° groove. To find a bevel angle from the thickness and the width, use tan⁻¹(width ÷ thickness).'
    }),
    B.tryIt([
      { q: 'A frame has 5 equal sides. Find the corner angle and the cut angle.', a: 'Corner ' + n(180 - 360 / 5) + '°, cut ' + n((180 - 360 / 5) / 2) + '°' },
      { q: 'Each corner of a frame is 150°. How many sides does it have?', a: String(360 / (180 - 150)) + ' (each corner turns 30°, and 360 ÷ 30 = 12)' },
      { q: 'A 20 mm plate is bevelled at 30° through its thickness. Bevel width to two decimal places?', a: f2(20 * tan(30)) + ' mm' },
      { q: 'A 16 mm plate has a 9 mm wide bevel. Find the bevel angle to two decimal places.', a: deg(atan(9 / 16)) },
      { q: 'Two plates are each bevelled at 35°. What is the groove angle?', a: '70°' },
      { q: 'A square frame corner is cut at 45°. A cut of 46° is made by mistake on both pieces. What corner angle do the pieces make?', a: '92° (2 × 46°)' }
    ]),

    /* ---------- 13.8 Roofs, stairs and ramps ---------- */
    B.section('Roofs, stairs and ramps'),
    B.p('Carpentry slopes are right triangles too. A roof slope written as rise in 12, a stair step with its unit rise and unit run, and a ramp written as 1 in 10 all give a rise and a run. The angle is tan⁻¹(rise ÷ run), the same as for the ramps in Section 13.5. Section 12.10 finds rafter lengths from the same numbers.'),
    B.sub('Roof slope'),
    B.table(['Rise in 12', 'As 1 in …', 'Percent grade', 'Angle tan⁻¹(rise ÷ 12)'], pitches.map(p => [p + ' in 12', '1 in ' + n(L.round(12 / p, 2)), f2(p / 12 * 100) + '%', deg(atan(p / 12))]), { align: ['c', 'c', 'c', 'c'], caption: 'Roof slopes worked out with the calculator, to two decimal places.' }),
    B.example({
      title: 'Angle of a 5 in 12 roof',
      q: 'Find the angle of a 5 in 12 roof to two decimal places, and in degrees, minutes and seconds to the nearest second (Section 12.8).',
      fig: A(() => tt(rp5, { opp: '5', adj: '12', ang: '?' }, { max: '2.1in' }), EX),
      steps: ['Rise 5 and run 12 are the opposite and adjacent sides: TOA.', 'Angle = tan⁻¹(5 ÷ 12) = ' + deg(rp5) + '.', 'In D°M′S: ' + G.dmsText(rp5) + '.'],
      after: G.dmsCalc(B, { rows: [{ label: 'Angle', seq: '( 5 ÷ 12 ) TAN⁻¹', expect: f2(rp5) }, { label: 'In D°M′S', seq: '( 5 ÷ 12 ) TAN⁻¹ DD▸DMS', expect: f2(rp5) }] }),
      answer: deg(rp5) + ', which is ' + G.dmsText(rp5) + ' to the nearest second.'
    }),
    B.example({
      title: 'A slope in inches per foot',
      q: 'A drain line slopes ' + L.fr(1, 4) + '″ per foot. Write the slope as 1 in …, as a percent grade and as an angle to two decimal places. How far does it fall over a ' + dn.run + ' ft run?',
      steps: ['Ratio: 0.25 ÷ 12. Turn it over: 12 ÷ 0.25 = ' + n(12 / dn.ipf) + ', so the slope is 1 in ' + n(12 / dn.ipf) + '.', 'Grade = 0.25 ÷ 12 × 100 = ' + f2(dn.ipf / 12 * 100) + '%.', 'Angle = tan⁻¹(0.25 ÷ 12) = ' + deg(atan(dn.ipf / 12)) + '.', 'Fall = ' + dn.run + ' ft × 0.25″ per foot = ' + n(dn.run * dn.ipf) + '″.'],
      calc: { rows: [{ label: 'Angle', seq: '( 0.25 ÷ 12 ) TAN⁻¹', expect: f2(atan(dn.ipf / 12)) }, { label: 'Grade', seq: '0.25 ÷ 12 × 100 =', expect: f2(dn.ipf / 12 * 100) }] },
      answer: '1 in ' + n(12 / dn.ipf) + ', ' + f2(dn.ipf / 12 * 100) + '%, ' + deg(atan(dn.ipf / 12)) + '. It falls ' + n(dn.run * dn.ipf) + '″ (' + L.mx(7, 1, 2) + '″) over ' + dn.run + ' ft.'
    }),
    B.p('The BC Building Code 2024 (BCBC), Division B, sets the slopes that roof coverings may be put on. Sentence 9.26.3.1.(1) says the slopes "shall conform to Table 9.26.3.1." In that table (page 9-242), asphalt shingles have a minimum slope of "1 in 3" for normal application and "1 in 6" for low slope application, with "no limit" as the maximum. Wood shingles have a minimum of "1 in 4" and cedar shakes "1 in 3".'),
    PL.figure(B, '9.26.3.1', { crop: [50, 160, 595, 131], width: '5.4in', caption: 'The asphalt shingle rows of Table 9.26.3.1. A slope of 1 in 3 rises 1 unit for every 3 units of run, the same as 4 in 12.' }),
    B.example({
      title: 'Shingles on a 3 in 12 roof',
      q: 'Can asphalt shingles go on a 3 in 12 roof in normal application? In low slope application? Compare the angles.',
      steps: ['3 in 12 is 3 ÷ 12 = 1 in 4. Its angle is tan⁻¹(3 ÷ 12) = ' + deg(atan(3 / 12)) + '.', 'Normal application needs at least 1 in 3 = 4 in 12, an angle of tan⁻¹(1 ÷ 3) = ' + deg(atan(1 / 3)) + '. The roof is flatter than that.', 'Low slope application needs at least 1 in 6 = 2 in 12, an angle of tan⁻¹(1 ÷ 6) = ' + deg(atan(1 / 6)) + '. The roof is steeper than that.'],
      answer: 'Not in normal application. Yes in low slope application.'
    }),
    B.check('( 3 ÷ 12 ) TAN⁻¹', f2(atan(3 / 12))), B.check('( 1 ÷ 3 ) TAN⁻¹', f2(atan(1 / 3))), B.check('( 1 ÷ 6 ) TAN⁻¹', f2(atan(1 / 6))),
    B.p('Roof slope also changes how much venting a roof space needs. Sentence 9.19.1.2.(1) says "the unobstructed vent area shall be not less than 1/300 of the insulated ceiling area." Sentence 9.19.1.2.(2) says "Where the roof slope is less than 1 in 6 or in roofs that are constructed with roof joists, the unobstructed vent area shall be not less than 1/150 of the insulated ceiling area" (page 9-136).'),
    PL.figure(B, '9.19.1.2', { crop: [528, 560, 465, 250], width: '3.8in', caption: 'The worked example on the 9.19.1.2 plate: the same ceiling needs twice the vent area when Sentence (2) applies.' }),
    B.example({
      title: 'Vent area for a low roof',
      q: 'A roof framed with trusses has a slope of ' + vt.p + ' in 12. The insulated ceiling below it is ' + vt.area + ' m². Which Sentence of Article 9.19.1.2 applies, and what is the least vent area?',
      steps: [vt.p + ' in 12 is ' + vt.p + ' ÷ 12 = 1 in ' + n(12 / vt.p) + '. 1 in 6 is 2 in 12. The roof is flatter, so its slope is less than 1 in 6.', 'Sentence (2) applies: vent area = ' + vt.area + ' ÷ 150 = ' + f2(vt.area / 150) + ' m².', 'For comparison, a roof of 1 in 6 or steeper over the same ceiling needs ' + vt.area + ' ÷ 300 = ' + f2(vt.area / 300) + ' m² (Sentence (1)).'],
      answer: 'Sentence (2). At least ' + f2(vt.area / 150) + ' m² of unobstructed vent area.'
    }),
    B.sub('Stair angle'),
    B.p('Each step of a stair is a small right triangle. The stair angle is tan⁻¹(unit rise ÷ unit run). The largest rise with the smallest run allowed by Tables 9.8.4.1 and 9.8.4.2 (Section 12.9) gives the steepest stair those two limits allow: tan⁻¹(200 ÷ 255) = ' + deg(atan(200 / 255)) + ' for a private stair and tan⁻¹(180 ÷ 280) = ' + deg(atan(180 / 280)) + ' for a public stair.'),
    B.check('( 200 ÷ 255 ) TAN⁻¹', f2(atan(200 / 255))), B.check('( 180 ÷ 280 ) TAN⁻¹', f2(atan(180 / 280))),
    B.example({
      title: 'Angle of a stair',
      q: 'The stair in Example 12.15 has a unit rise of ' + n(L.round(sa.rise, 2), 2) + ' mm (2,720 ÷ 14) and a unit run of ' + sa.run + ' mm. Find the stair angle to two decimal places.',
      steps: ['Angle = tan⁻¹(unit rise ÷ unit run) = tan⁻¹(' + n(L.round(sa.rise, 2), 2) + ' ÷ ' + sa.run + ').', 'Key 2,720 ÷ 14 in the brackets so the calculator keeps every digit of the unit rise.'],
      calc: { seq: '( 2720 ÷ 14 ÷ ' + sa.run + ' ) TAN⁻¹', expect: f2(atan(sa.rise / sa.run)) },
      answer: deg(atan(sa.rise / sa.run)) + '. It is less steep than ' + deg(atan(200 / 255)) + ', the steepest the private stair limits allow.'
    }),
    B.sub('Ramp slope'),
    B.p('Sentence 9.8.5.4.(1) says "The slope of ramps shall be not more than a) 1 in 10 for exterior ramps, b) 1 in 10 for interior ramps serving residential occupancies, c) 1 in 6 for industrial occupancies, and d) 1 in 8 for all other occupancies" (pages 9-33 and 9-34).'),
    B.table(['Ramp', 'Clause', 'Steepest slope', 'Percent grade', 'Angle'], ramps.map(r => [r[0], '(' + r[1] + ')', '1 in ' + r[2], f2(100 / r[2]) + '%', deg(atan(1 / r[2]))]), { align: ['', 'c', 'c', 'c', 'c'], caption: 'The ramp limits of Sentence 9.8.5.4.(1) as grades and angles.' }),
    PL.figure(B, '9.8.5.4', { crop: [150, 300, 690, 430], width: '4.6in', caption: 'Four ramps, each at the steepest slope Sentence 9.8.5.4.(1) allows for its use.' }),
    B.example({
      title: 'Shortest exterior ramp',
      q: 'An exterior ramp must rise ' + rx.rise + ' mm. Find the shortest run Clause 9.8.5.4.(1)(a) allows, the length along the slope to two decimal places and the angle.',
      fig: A(() => G.ramp(rx.rise * rx.k, rx.rise, { ang: { A: { ask: true, r: 90, s: 15 } }, sides: [{ a: 'A', b: 'R', ask: true, dim: true, s: 15 }, { a: 'R', b: 'B', lab: rx.rise + ' mm', dim: true, s: 15 }], W: 440, H: 150, pad: 56, max: '2.8in' }), EX),
      steps: ['1 in 10 means the run is at least 10 times the rise: ' + rx.rise + ' × 10 = ' + n(rx.rise * rx.k) + ' mm.', 'Length along the slope = √(' + n(rx.rise * rx.k) + '² + ' + rx.rise + '²) = ' + f2(Math.hypot(rx.rise * rx.k, rx.rise)) + ' mm.', 'Angle = tan⁻¹(1 ÷ 10) = ' + deg(atan(1 / rx.k)) + '.'],
      calc: { rows: [{ label: 'Length along the slope', seq: '( ' + rx.rise * rx.k + ' x² + ' + rx.rise + ' x² ) √x', expect: f2(Math.hypot(rx.rise * rx.k, rx.rise)) }, { label: 'Angle', seq: '( 1 ÷ 10 ) TAN⁻¹', expect: f2(atan(1 / rx.k)) }] },
      answer: 'Run ' + n(rx.rise * rx.k) + ' mm, length ' + f2(Math.hypot(rx.rise * rx.k, rx.rise)) + ' mm, angle ' + deg(atan(1 / rx.k)) + '.'
    }),
    B.check('( 1 ÷ 6 ) TAN⁻¹', f2(atan(1 / 6))), B.check('( 1 ÷ 8 ) TAN⁻¹', f2(atan(1 / 8))),
    B.sub('Rafter cuts'),
    B.p('A rafter sits at the roof angle θ. Two of its cuts are plumb or level when the rafter is in place. The plumb cut at the ridge is vertical. The birdsmouth over the wall has a level seat cut and a plumb heel cut. Because the rafter edge slopes at θ, the seat cut meets the rafter edge at θ, and a plumb cut meets the rafter edge at 90° − θ. A square cut across the rafter is 90° to the edge, so a plumb cut is θ away from square.'),
    B.figure(A(() => G.rafterCuts(atan(rc.p / 12), { topLab: deg(90 - atan(rc.p / 12)), seatLab: deg(atan(rc.p / 12)), max: '4.2in' }), FULL), 'A ' + rc.p + ' in 12 rafter with a plumb cut at the ridge end and a birdsmouth over the wall plate. The roof angle is ' + deg(atan(rc.p / 12)) + '.'),
    B.example({
      title: 'Cut angles for a 6 in 12 rafter',
      q: 'Find the roof angle of a ' + rc.p + ' in 12 roof, the angle between the seat cut and the rafter edge, and the angle between the plumb cut and the rafter edge, to two decimal places.',
      steps: ['Roof angle θ = tan⁻¹(' + rc.p + ' ÷ 12) = ' + deg(atan(rc.p / 12)) + '.', 'The seat cut is level, so it meets the rafter edge at θ = ' + deg(atan(rc.p / 12)) + '.', 'The plumb cut meets the rafter edge at 90° − ' + deg(atan(rc.p / 12)) + ' = ' + deg(90 - L.round(atan(rc.p / 12), 2)) + '. It is ' + deg(atan(rc.p / 12)) + ' away from a square cut.'],
      calc: { seq: '( ' + rc.p + ' ÷ 12 ) TAN⁻¹', expect: f2(atan(rc.p / 12)) },
      answer: 'θ = ' + deg(atan(rc.p / 12)) + ', seat cut ' + deg(atan(rc.p / 12)) + ', plumb cut ' + deg(90 - L.round(atan(rc.p / 12), 2)) + ' to the rafter edge.'
    }),
    B.tryIt([
      { q: 'Find the angle of a 4 in 12 roof to two decimal places.', a: deg(atan(4 / 12)) },
      { q: 'A roof is 7 in 12. Write it as 1 in … to two decimal places, and find its angle.', a: '1 in ' + f2(12 / 7) + ', ' + deg(atan(7 / 12)) },
      { q: 'A drain slopes ' + L.fr(1, 8) + '″ per foot. Write the slope as 1 in … and as a percent grade to two decimal places.', a: '1 in ' + n(12 / 0.125) + ', ' + f2(0.125 / 12 * 100) + '%' },
      { q: 'Can asphalt shingles go on a 2.5 in 12 roof in normal application? In low slope application? Use Table 9.26.3.1.', a: '2.5 in 12 is 1 in ' + n(12 / 2.5) + '. Not in normal application (needs 1 in 3, 4 in 12). Yes in low slope application (needs 1 in 6, 2 in 12).' },
      { q: 'An industrial ramp rises 450 mm at the steepest slope Clause 9.8.5.4.(1)(c) allows. Find the run and the angle.', a: 'Run ' + n(450 * 6) + ' mm, angle ' + deg(atan(1 / 6)) },
      { q: 'A rafter is 8 in 12. Find the angle between the seat cut and the rafter edge, and between the plumb cut and the rafter edge.', a: 'Seat cut ' + deg(atan(8 / 12)) + ', plumb cut ' + deg(90 - L.round(atan(8 / 12), 2)) }
    ]),
    B.check('( 4 ÷ 12 ) TAN⁻¹', f2(atan(4 / 12))), B.check('( 7 ÷ 12 ) TAN⁻¹', f2(atan(7 / 12))), B.check('( 8 ÷ 12 ) TAN⁻¹', f2(atan(8 / 12))), B.check('0.125 ÷ 12 × 100 =', f2(0.125 / 12 * 100)),

    B.worksheet({ title: 'Find the side', sub: 'Each triangle is drawn at its true angle. Find every red ?', intro: 'Mark the angle, name the sides, pick SOH, CAH or TOA, then multiply or divide. Give metric answers to two decimal places and inch answers to the nearest 1/16″.' }),
    B.grid2(
      B.prob({ q: 'Find the opposite side.', canvas: A(() => hmax(tt(40, { opp: '?', hyp: '500 mm' }, { H: 300, pad: 70, padX: 100 }), 1.05), GRID), a: f2(500 * sin(40)) + ' mm', lines: 2 }),
      B.prob({ q: 'Find the height.', canvas: A(() => hmax(tt(28, { opp: '?', adj: '1,200 mm' }, { H: 300, pad: 70, padX: 100 }), 1.05), GRID), a: f2(1200 * tan(28)) + ' mm', lines: 2 }),
      B.prob({ q: 'Find the base.', canvas: A(() => hmax(tt(62, { adj: '?', hyp: '3.6 m' }, { H: 300, pad: 70, padX: 100, flip: true }), 1.05), GRID), a: f2(3.6 * cos(62)) + ' m', lines: 2 }),
      B.prob({ q: 'Find the hypotenuse.', canvas: A(() => hmax(tt(35, { opp: '750 mm', hyp: '?' }, { H: 300, pad: 70, padX: 100, down: true }), 1.05), GRID), a: f2(750 / sin(35)) + ' mm', lines: 2 }),
      B.prob({ q: 'Find the opposite side to the nearest 1/16″.', canvas: A(() => hmax(tt(20, { opp: '?', hyp: '36″' }, { H: 300, pad: 70, padX: 100 }), 1.05), GRID), a: L.inch(36 * sin(20), 16) + ' (' + f3(36 * sin(20)) + '″)', lines: 2 }),
      B.prob({ q: 'Find the hypotenuse to the nearest 1/16″.', canvas: A(() => hmax(tt(55, { adj: '18″', hyp: '?' }, { H: 300, pad: 70, padX: 100, flip: true }), 1.05), GRID), a: L.inch(18 / cos(55), 16) + ' (' + f3(18 / cos(55)) + '″)', lines: 2 })
    ),

    B.worksheet({ title: 'Find the angle', sub: 'Use the inverse keys. Find every red ?', intro: 'Name the two sides you know, pick the ratio, then use SIN⁻¹, COS⁻¹ or TAN⁻¹. Give angles and percent grades to two decimal places. Check: the two acute angles add to 90°.' }),
    B.grid2(
      B.prob({ q: 'Find the angle.', canvas: A(() => hmax(tt(atan(600 / 900), { opp: '600 mm', adj: '900 mm', ang: '?' }, { H: 300, pad: 70, padX: 100 }), 1.05), GRID), a: deg(atan(600 / 900)), lines: 2 }),
      B.prob({ q: 'Find the angle.', canvas: A(() => hmax(tt(asin(1.2 / 2), { opp: '1.2 m', hyp: '2.0 m', ang: '?' }, { H: 300, pad: 70, padX: 100, flip: true }), 1.05), GRID), a: deg(asin(0.6)), lines: 2 }),
      B.prob({ q: 'Find the angle.', canvas: A(() => hmax(tt(acos(450 / 520), { adj: '450 mm', hyp: '520 mm', ang: '?' }, { H: 300, pad: 70, padX: 100 }), 1.05), GRID), a: deg(acos(450 / 520)), lines: 2 }),
      B.prob({ q: 'Find both acute angles.', canvas: A(() => hmax(tt(atan(7 / 24), { opp: '7″', adj: '24″', ang: '?', other: '?' }, { W: 700, H: 300, pad: 70, padX: 100 }), 1.05), GRID), a: deg(atan(7 / 24)) + ' and ' + deg(90 - L.round(atan(7 / 24), 2)), lines: 2 }),
      B.prob({ q: 'A ramp rises 300 mm over a run of 3,600 mm. Find its angle and its percent grade.', canvas: A(() => rampFig(3600, 300, { W: 440, H: 150, pad: 50, padX: 80, max: '2.6in' }), GRID), a: 'Angle ' + deg(atan(300 / 3600)) + ', grade ' + f2(300 / 3600 * 100) + '%', lines: 2 }),
      B.prob({ q: 'A roof rises 5″ for every 12″ of run. Find the roof angle and the sloped length.', canvas: A(() => hmax(tt(atan(5 / 12), { opp: '5″', adj: '12″', hyp: '?', ang: '?' }, { H: 300, pad: 70, padX: 100 }), 1.05), GRID), a: 'Angle ' + deg(atan(5 / 12)) + ', sloped edge ' + n(Math.hypot(5, 12)) + '″', lines: 2 })
    ),
    B.worksheet({ title: 'Shop triangles', sub: 'Offsets, bevels and mitres. Find every red ?', intro: 'Find the right triangle in each job first. Set, run and travel are opposite, adjacent and hypotenuse from the fitting angle.' }),
    B.grid2(
      B.prob({ q: 'A 45° offset has a set of 18″. Find the travel to the nearest 1/16″ and the run.', canvas: A(() => hmax(G.pipeOffset(45, 18, { set: '18″', askRun: true, askTravel: true, W: 400 }), 1.35), GRID), a: 'Travel ' + L.inch(18 / sin(45), 16) + ' (' + f3(18 / sin(45)) + '″), run ' + n(L.round(18 / tan(45), 6)) + '″', lines: 3 }),
      B.prob({ q: 'A 22.5° offset has a set of 300 mm. Find the travel and the run to two decimal places.', canvas: A(() => hmax(G.pipeOffset(22.5, 300, { set: '300 mm', askRun: true, askTravel: true, W: 440 }), 1.35), GRID), a: 'Travel ' + f2(300 / sin(22.5)) + ' mm, run ' + f2(300 / tan(22.5)) + ' mm', lines: 3 }),
      B.prob({ q: 'An offset has a set of 400 mm and a run of 693 mm. Find the fitting angle to two decimal places.', canvas: A(() => hmax(G.pipeOffset(atan(400 / 693), 400, { set: '400 mm', run: '693 mm', askAng: true, travel: 'travel', W: 400 }), 1.35), GRID), a: deg(atan(400 / 693)) + ', so 30° fittings', lines: 3 }),
      B.prob({ q: 'Break it down. A rolling offset rises 300 mm and rolls 400 mm. First find the true offset (the set) with the Pythagorean theorem. Then find the travel with 45° fittings. Give both to two decimal places.', canvas: A(() => G.rt(400, 300, { sides: [{ a: 'R', b: 'A', lab: 'roll 400 mm', s: 15 }, { a: 'R', b: 'B', lab: 'rise 300 mm', s: 15 }, { a: 'A', b: 'B', ask: true }], W: 380, H: 260, pad: 60, padX: 110 }), GRID), a: 'True offset √(300² + 400²) = ' + n(Math.hypot(300, 400)) + ' mm, travel ' + f2(Math.hypot(300, 400) / sin(45)) + ' mm', lines: 3 })
    ),
      B.prob({ q: 'A 16 mm plate is bevelled at 37.5° through its thickness. Find the bevel width to two decimal places.', canvas: A(() => hmax(G.bevel(16, 37.5, { t: '16 mm', askW: true, size: 110 }), 1.55), FULL), a: f2(16 * tan(37.5)) + ' mm', lines: 3 }),
      B.prob({ q: 'An eight-sided frame. Find the corner angle and the cut angle of each piece.', canvas: A(() => hmax(G.mitreCorner(8, { askCut: true, askInter: true }), 1.75), FULL), a: 'Corner ' + n(180 - 360 / 8) + '°, cut ' + n((180 - 360 / 8) / 2) + '°', lines: 3 }),
    B.prob({ q: 'Change one value. A ramp is 3,000 mm long, measured along the slope, and slopes at 6°. Find its rise to two decimal places. Then double the angle to 12°. Does the rise double too?', a: 'At 6°: ' + f2(3000 * sin(6)) + ' mm. At 12°: ' + f2(3000 * sin(12)) + ' mm. No, it is a little less than double (2 × ' + f2(3000 * sin(6)) + ' = ' + f2(2 * L.round(3000 * sin(6), 2)) + ').', lines: 5 })
  ])
}
