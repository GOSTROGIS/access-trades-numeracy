/* Chapter 12: Angles and Right Triangles */
module.exports = function (B, L) {
  const F = require('../engine/figs.js')
  const G = require('../engine/figs-ch12.js')
  const C = F.C
  const n = L.num
  const r2 = x => L.round(x, 2)
  const f2 = x => n(L.round(x, 2), 2), f3 = x => n(L.round(x, 3), 3)
  const hyp = (a, b) => Math.sqrt(a * a + b * b)
  const leg = (c, a) => Math.sqrt(c * c - a * a)
  const D2R = Math.PI / 180
  const A = G.auto, FK = G.FK
  /* print widths available to a drawing, in inches */
  const EX = 2.85, GRID = 2.6, FULL = 6.2
  /* limit a drawing by its printed height: sets max-width so the height is hIn inches */
  const hmax = (svg, hIn) => {
    const vb = /viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/.exec(svg)
    return svg.replace(/max-width:[\d.]+in/, 'max-width:' + (hIn * vb[3] / vb[4]).toFixed(2) + 'in')
  }
  const nextFig = () => 'Figure ' + B.ch + '.' + (B.fig + 1)
  const rtLab = (b, h, sides, o) => G.rt(b, h, Object.assign({ sides: sides.map(x => Object.assign({ s: 16 }, x)), W: 340, H: 240, pad: 70 }, o))

  /* a triangle drawn from two base angles: base along x from P to Q, third corner T */
  function triPts(a, b, base) {
    const c = 180 - a - b, side = base * Math.sin(b * D2R) / Math.sin(c * D2R)
    return { P: [0, 0], Q: [base, 0], T: [side * Math.cos(a * D2R), side * Math.sin(a * D2R)] }
  }
  function triFig(a, b, o) {
    o = o || {}
    const c = 180 - a - b
    const lab = (k, v) => (o.ask === k ? { ask: true, s: 16 } : { lab: v + '°', s: 16 })
    return G.poly({ pts: triPts(a, b, 10), order: ['P', 'Q', 'T'], ang: { P: lab('P', a), Q: lab('Q', b), T: Object.assign(lab('T', c), { r: 22 }) }, W: o.W || 340, H: o.H || 220, pad: 30, max: o.max || '2.8in' })
  }
  /* quadrilateral from four interior angles, first side 10 and second side s2 */
  function quadPts(angs, s2) {
    const h = [0, 180 - angs[1], 360 - angs[1] - angs[2], 540 - angs[1] - angs[2] - angs[3]].map(x => x * D2R)
    const v = h.map(t => [Math.cos(t), Math.sin(t)])
    /* close: 10 v0 + s2 v1 + x v2 + y v3 = 0, solve for x and y */
    const rx = -(10 * v[0][0] + s2 * v[1][0]), ry = -(10 * v[0][1] + s2 * v[1][1])
    const det = v[2][0] * v[3][1] - v[3][0] * v[2][1]
    const x = (rx * v[3][1] - v[3][0] * ry) / det, y = (v[2][0] * ry - rx * v[2][1]) / det
    const P0 = [0, 0], P1 = [10, 0], P2 = [10 + s2 * v[1][0], s2 * v[1][1]], P3 = [P2[0] + x * v[2][0], P2[1] + x * v[2][1]]
    return { pts: { W: P0, X: P1, Y: P2, Z: P3 }, x, y }
  }
  /* three angles that make a straight line: the corners of a triangle torn off and put side by side */
  function onALine(angs) {
    const W = 360, H = 150, cx = 180, cy = 120, L2 = 120, cols = [C.red, C.edge, C.deep]
    let h = F.line(30, cy, W - 30, cy, { c: C.edge, w: 2.6 }), a = 0
    angs.forEach((d, i) => {
      if (i) h += F.line(cx, cy, cx + L2 * Math.cos(-a * D2R), cy + L2 * Math.sin(-a * D2R), { c: C.edge, w: 2.2 })
      h += FK.arc([cx, cy], -(a + d) * D2R, -a * D2R, 34 + i * 6, d + '°', { lr: 18, c: cols[i], s: 15 })
      a += d
    })
    h += '<circle cx="' + cx + '" cy="' + cy + '" r="3.4" fill="' + C.edge + '"/>'
    return F.svg(W, H, h, { max: '2.8in' })
  }
  /* a stair stringer: total rise and total run, the stringer is the hypotenuse */
  function stringer(run, rise, o) {
    o = o || {}
    return G.poly({
      pts: { A: [0, 0], R: [run, 0], T: [run, rise] }, order: ['A', 'R', 'T'], right: 'R', W: 420, H: 280, max: '2.5in',
      sides: [{ a: 'A', b: 'R', lab: n(run) + ' mm', dim: true, s: 15 }, { a: 'R', b: 'T', lab: n(rise) + ' mm', dim: true, s: 15 }, { a: 'A', b: 'T', ask: true }], pad: 80,
      extra: (P, Q) => {
        let h = '', steps = 5
        Array.from({ length: steps }, (_, i) => i).forEach(i => {
          const x0 = run * i / steps, y0 = rise * i / steps, x1 = run * (i + 1) / steps, y1 = rise * (i + 1) / steps
          const a = P([x0, y0]), b = P([x0, y1]), c = P([x1, y1])
          h += F.line(a[0], a[1], b[0], b[1], { c: C.dim, w: 1.2, dash: '4 3' }) + F.line(b[0], b[1], c[0], c[1], { c: C.dim, w: 1.2, dash: '4 3' })
        })
        const m = P([run * 0.25, rise * 0.25])
        return h + FK.callout(m[0], m[1], m[0] + 10, m[1] - 120, 'stringer', { s: 13 })
      }
    })
  }

  /* worked numbers */
  const gus = { a: 400, b: 250 }, gusC = hyp(gus.a, gus.b)
  const br = { c: 2000, a: 1350 }, brB = leg(br.c, br.a)
  const im = { a: 32, b: 20 }, imC = hyp(im.a, im.b), imD5 = L.round(imC - Math.floor(imC), 5), imFr = imD5 * 16
  const fr = { l: 2400, w: 1200 }, frD = hyp(fr.l, fr.w)
  const sh = { l: 96, w: 48 }, shD = hyp(sh.l, sh.w), shFr = L.round(shD - Math.floor(shD), 3) * 16
  const sq = 500, sqD = sq * Math.SQRT2
  const tri345 = [[300, 400, 'mm'], [600, 800, 'mm'], [3, 4, 'ft'], [6, 8, 'ft']]
  const quad = quadPts([85, 100, 75, 100], 6)
  if (!(quad.x > 0 && quad.y > 0)) throw new Error('quadrilateral does not close')

  /* Sections 12.7 to 12.10: angle pairs, degrees minutes and seconds, stairs, rafters and layout */
  const PL = require('../engine/plates.js')
  const dmsT = G.dmsText, dk = G.dmsKey, dd = G.dd
  const cr = 62, gt = 52
  const d1 = [36, 52, 12], d1v = dd(...d1)
  const d2 = 47.37, d2m = (d2 - 47) * 60, d2s = (d2m - Math.floor(d2m)) * 60
  const ad1 = [27, 45, 30], ad2 = [18, 32, 45], adv = dd(...ad1) + dd(...ad2)
  const sb = [37, 25, 15], sbv = 90 - dd(...sb)
  /* a metric stair: total rise, the private stair maximum rise from Table 9.8.4.1, a chosen run */
  const st = { tr: 2720, max: 200, run: 265 }
  st.n = Math.ceil(st.tr / st.max)
  st.ur = st.tr / st.n
  st.t = st.n - 1
  st.trun = st.t * st.run
  st.len = hyp(st.tr, st.trun)
  /* an imperial deck stair */
  const si = { n: 6, r: 7.25, u: 10.5 }
  si.tr = si.n * si.r
  si.trun = (si.n - 1) * si.u
  si.len = hyp(si.tr, si.trun)
  si.rmm = si.r * 25.4
  si.umm = si.u * 25.4
  const unif = [191, 194, 189, 195, 192, 190]
  const adj = unif.slice(1).map((v, i) => Math.abs(v - unif[i])), adjMax = Math.max(...adj), spread = Math.max(...unif) - Math.min(...unif)
  /* rafters and layout */
  const rf = { span: 7200, p: 5, run: 3600 }
  rf.rise = rf.run * rf.p / 12
  rf.len = hyp(rf.run, rf.rise)
  const ri = { run: 138, p: 6, rise: 138 * 6 / 12 }
  ri.len = hyp(ri.run, ri.rise)
  ri.pf = hyp(12, ri.p)
  const lay = { l: 9600, w: 6000, m1: 3600, m2: 4800, d1: 11332, d2: 11309, d: hyp(9600, 6000) }

  return L.join([
    B.chapter({
      num: 12, id: 'triangles', title: 'Angles and Right Triangles',
      intro: B.p('Square corners hold a shop together. A frame that is out of square will not sit flat, a brace cut to the wrong length will not fit, and a bolt circle laid out at the wrong angle will not line up with its flange.',
        'This chapter starts with angles: how they are measured in degrees and how they are named. Then it moves to the right triangle and the Pythagorean theorem, the rule that lets you find a missing side, check a corner for square with the 3-4-5 method and work out the diagonal of a frame.'),
      objectives: ['Measure and name angles in degrees', 'Tell acute, right, obtuse and straight angles apart', 'Find a missing angle on a line, around a point and in a triangle', 'Name the legs and the hypotenuse of a right triangle', 'Use the Pythagorean theorem to find a missing side', 'Check a corner for square with the 3-4-5 method and with diagonals'],
      words: ['angle', 'degree', 'right angle', 'acute angle', 'obtuse angle', 'leg', 'hypotenuse', 'Pythagorean theorem'],
      art: '<div class="figrow" style="align-items:flex-end">' + [A(() => G.angleFig(40, { lab: '40°', max: '1.4in' }), 1.5), A(() => G.angleFig(90, { lab: '90°', max: '1.4in' }), 1.5), A(() => G.angleFig(130, { lab: '130°', max: '1.4in' }), 1.5), A(() => rtLab(4, 3, [{ a: 'R', b: 'A', lab: '4', s: 20 }, { a: 'R', b: 'B', lab: '3', s: 20 }, { a: 'A', b: 'B', lab: '5', s: 20 }], { W: 300, H: 230, pad: 44, max: '1.45in' }), 1.5)].map(x => '<div style="flex:1">' + x + '</div>').join('') + '</div>'
    }),

    B.section('Angles and degrees'),
    B.p('An ' + B.term('angle', 'The amount of turn between two lines that meet at a point. Angles are measured in degrees.') + ' is the amount of turn between two lines that meet at a point. The point is called the vertex, and the two lines are the arms of the angle.',
      'Angles are measured in ' + B.term('degrees', 'The unit for measuring angles. One full turn is 360 degrees, written 360°.') + '. One full turn is 360 degrees, written 360°. Half a turn is 180°, and a quarter turn is 90°.'),
    B.figure(A(() => G.protractor(50, { max: '3.4in' }), FULL), 'A protractor measures an angle. Put the centre mark on the vertex, line one arm up with 0 and read where the other arm crosses the scale. This angle is 50°.'),
    B.watch('Long arms do not make a bigger angle', 'The size of an angle is the amount of turn, not the length of the arms. A 50° angle drawn with 20 mm arms is the same angle as one drawn with 2 m arms.'),
    B.p('Equal parts of a turn come up in layout work all the time. Holes spaced evenly around a circle, such as the bolt holes in a flange, split the full 360° turn into equal angles.'),
    B.example({
      title: 'Angle between bolt holes',
      q: 'Six bolt holes are spaced evenly around a circle. What is the angle between two holes that are next to each other, measured at the centre?',
      fig: A(() => G.boltCircle(6, { lab: '60°', max: '1.9in' }), EX),
      steps: ['A full turn is 360°.', 'Six equal spaces share the turn: 360° ÷ 6 = 60°.'],
      answer: '60° between holes.'
    }),
    B.tryIt([
      { q: 'How many degrees are in half a turn?', a: '180°' },
      { q: 'How many degrees are in one eighth of a turn?', a: n(360 / 8) + '°' },
      { q: 'Eight bolt holes are evenly spaced on a circle. Angle between neighbours?', a: n(360 / 8) + '°' },
      { q: 'Five holes are evenly spaced on a circle. Angle between neighbours?', a: n(360 / 5) + '°' },
      { q: 'Twelve holes are evenly spaced on a circle. Angle between neighbours?', a: n(360 / 12) + '°' },
      { q: 'What fraction of a full turn is 270°?', a: '3/4 of a turn (270 ÷ 360)' }
    ]),

    B.section('Types of angles'),
    B.p('Angles are named by their size. The most important one in the shop is the ' + B.term('right angle', 'An angle of exactly 90°, a quarter turn. A square corner.') + ', exactly 90°. A right angle is a square corner, and drawings mark it with a small square instead of an arc.',
      'An ' + B.term('acute angle', 'An angle less than 90°.') + ' is less than 90°. An ' + B.term('obtuse angle', 'An angle more than 90° and less than 180°.') + ' is more than 90° and less than 180°. A straight angle is exactly 180°: the two arms make a straight line.'),
    B.figure('<div class="figrow">' + [A(() => G.angleFig(40, { name: 'acute: 40°', lab: '40°' }), 1.55), A(() => G.angleFig(90, { name: 'right: 90°', lab: ' ' }), 1.55), A(() => G.angleFig(130, { name: 'obtuse: 130°', lab: '130°' }), 1.55), A(() => G.angleFig(180, { name: 'straight: 180°', lab: '180°' }), 1.55)].map(s => '<div style="flex:1">' + s + '</div>').join('') + '</div>', 'The four kinds of angle, drawn at their true size.'),
    B.p('Two facts let you find a missing angle without a protractor. Angles that sit side by side on a straight line add to 180°. Angles that go all the way around a point add to 360°. For example, if three lines meet at a point and two of the angles are 110° and 95°, the third angle is 360° − 110° − 95° = 155°.'),
    B.example({
      title: 'A bent strap',
      q: 'A flat strap is bent so that one side of the bend makes an angle of 125° with the straight part, as shown. Find the angle on the other side of the bend.',
      fig: A(() => G.straightLine(55, { askR: true, labL: '125°', max: '2.6in' }), EX),
      steps: ['The two angles sit on a straight line, so they add to 180°.', 'Missing angle = 180° − 125° = 55°.'],
      answer: '55°, an acute angle.'
    }),
    B.p('Angles that add to 90° or to 180°, the equal angles across from each other where two lines cross, and the angles made where a line crosses two parallel lines are in Section 12.7, Angle pairs and parallel lines.'),
    B.tryIt([
      { q: 'Name each angle: 35°, 90°, 150°, 89°, 180°.', a: 'acute, right, obtuse, acute, straight' },
      { q: 'Two angles on a straight line. One is 72°. Find the other.', a: n(180 - 72) + '°' },
      { q: 'Two angles on a straight line. One is 135°. Find the other.', a: n(180 - 135) + '°' },
      { q: 'Three angles around a point: 120°, 135° and ?. Find the ?', a: n(360 - 120 - 135) + '°' },
      { q: 'Four equal angles go around a point. How big is each?', a: n(360 / 4) + '°' },
      { q: 'Is 91° acute, right or obtuse?', a: 'obtuse' }
    ]),

    B.section('Angles in a triangle'),
    B.p('The three angles inside any triangle add to 180°. You can see why by tearing the three corners off a paper triangle and laying them side by side. They fit together into a straight line.'),
    B.figure('<div class="figrow"><div style="flex:1">' + A(() => triFig(50, 60, { max: '2.3in' }), 3) + '</div><div style="flex:1">' + A(() => onALine([70, 60, 50]), 3) + '</div></div>', 'The corners of a 50°, 60°, 70° triangle (left) placed side by side make a straight angle: 50° + 60° + 70° = 180°.'),
    B.formula('Angles in a triangle', ['∠A + ∠B + ∠C = 180°', 'In a right triangle: the two acute angles add to 90°'], '∠ means "angle". A right triangle already uses 90° of the 180°, so the other two angles share the other 90°.'),
    B.example({
      title: 'The third angle of a gusset',
      q: 'A triangular gusset has angles of 48° and 67°. Find the third angle.',
      fig: A(() => triFig(48, 67, { ask: 'T', max: '1.7in' }), EX),
      steps: ['The three angles add to 180°.', 'Third angle = 180° − 48° − 67° = 65°.'],
      answer: '65°'
    }),
    B.p('A triangle with two equal sides also has two equal angles. They are the angles at the ends of the third side. If the angle between the equal sides is 40°, the other two angles share 180° − 40° = 140°, so each one is 140° ÷ 2 = 70°.'),
    B.tryIt([
      { q: 'A triangle has angles of 35° and 85°. Find the third angle.', a: n(180 - 35 - 85) + '°' },
      { q: 'A triangle has angles of 90° and 27°. Find the third angle.', a: n(180 - 90 - 27) + '°' },
      { q: 'One acute angle of a right triangle is 45°. Find the other.', a: '45°' },
      { q: 'Can a triangle have two right angles? Why?', a: 'No. Two right angles already add to 180°, leaving 0° for the third angle.' },
      { q: 'A gusset has two equal sides with 50° between them. Find the other two angles.', a: n((180 - 50) / 2) + '° each' },
      { q: 'All three angles of a triangle are equal. How big is each?', a: n(180 / 3) + '°' }
    ]),

    B.section('Right triangles and the Pythagorean theorem'),
    B.p('A right triangle has one right angle. Its sides have special names. The two sides that make the right angle are the ' + B.term('legs', 'The two sides of a right triangle that form the right angle.') + '. The side across from the right angle is the ' + B.term('hypotenuse', 'The side of a right triangle across from the right angle. It is always the longest side.') + '.'),
    B.figure('<div class="figrow">' + [
      A(() => G.rt(4, 3, { sides: [{ a: 'R', b: 'A', lab: 'leg', s: 20 }, { a: 'R', b: 'B', lab: 'leg', s: 20 }, { a: 'A', b: 'B', lab: 'hypotenuse', s: 20, off: 24 }], W: 340, H: 240, pad: 64, max: '1.9in' }), 2.1),
      A(() => G.rt(4, 3, { flip: true, down: true, sides: [{ a: 'R', b: 'A', lab: 'leg', s: 20 }, { a: 'R', b: 'B', lab: 'leg', s: 20 }, { a: 'A', b: 'B', lab: 'hypotenuse', s: 20, off: 24 }], W: 340, H: 240, pad: 64, max: '1.9in' }), 2.1),
      A(() => G.rt(4, 3, { rot: 90, sides: [{ a: 'R', b: 'A', lab: 'leg', s: 20 }, { a: 'R', b: 'B', lab: 'leg', s: 20 }, { a: 'A', b: 'B', lab: 'hypotenuse', s: 20, off: 24 }], W: 340, H: 240, pad: 64, max: '1.7in' }), 2.1)
    ].map(s => '<div style="flex:1">' + s + '</div>').join('') + '</div>', 'Three right triangles turned different ways. The hypotenuse is always across from the small square that marks the right angle, and it is always the longest side.'),
    B.p('The ' + B.term('Pythagorean theorem', 'In a right triangle, the square of the hypotenuse equals the sum of the squares of the two legs: a² + b² = c².') + ' links the three sides of every right triangle. Square each leg and add the results. The total is the ' + B.term('square') + ' of the hypotenuse.',
      nextFig() + ' shows it with real squares. A right triangle with legs of 3 and 4 units has a hypotenuse of 5 units. The squares on the legs hold 9 and 16 small squares. The square on the hypotenuse holds 25, and 9 + 16 = 25.'),
    B.figure(A(() => G.pythSquares(3, 4, { max: '2.1in' }), FULL), 'The squares on the sides of a 3-4-5 right triangle: 9 + 16 = 25.'),
    B.formula('Pythagorean theorem', ['a² + b² = c²', 'Find the hypotenuse: c = √(a² + b²)', 'Find a leg: a = √(c² − b²)'], 'a and b are the legs, c is the hypotenuse. The second and third lines are the theorem ' + B.term('transposed') + ' (Chapter 8) to make c or a the subject.'),
    B.how(['Sketch the triangle and mark the right angle.', 'Label the hypotenuse c and the legs a and b.', 'To find the hypotenuse, square both legs, add, then take the ' + B.term('square root') + '.', 'To find a leg, square the hypotenuse and the known leg, subtract, then take the square root.', 'Check: the hypotenuse must be the longest side.']),
    B.example({
      title: 'Length of a gusset edge',
      q: 'A triangular gusset has legs of ' + n(gus.a) + ' mm and ' + n(gus.b) + ' mm. Find the length of the sloped edge (the hypotenuse) to two decimal places.',
      fig: A(() => rtLab(gus.a, gus.b, [{ a: 'R', b: 'A', lab: n(gus.a) + ' mm', dim: true }, { a: 'R', b: 'B', lab: n(gus.b) + ' mm', dim: true }, { a: 'A', b: 'B', ask: true, off: 22 }], { max: '2.3in' }), EX),
      long: true,
      steps: ['c² = ' + n(gus.a) + '² + ' + n(gus.b) + '² = ' + n(gus.a * gus.a) + ' + ' + n(gus.b * gus.b) + ' = ' + n(gus.a * gus.a + gus.b * gus.b) + '.', 'c = √' + n(gus.a * gus.a + gus.b * gus.b) + '.'],
      calc: { seq: '( ' + gus.a + ' x² + ' + gus.b + ' x² ) √x', expect: n(r2(gusC), 2), say: 'The brackets make the calculator add the squares before it takes the square root. The Sharp puts the √ key first and the brackets after it.' },
      answer: n(r2(gusC), 2) + ' mm'
    }),
    B.example({
      title: 'Finding a leg',
      q: 'A brace ' + n(br.c) + ' mm long runs from the floor to a column. Its top end is ' + n(br.a) + ' mm above the floor. How far from the column is its bottom end? Give the answer to two decimal places.',
      fig: A(() => rtLab(brB, br.a, [{ a: 'R', b: 'A', ask: true, dim: true }, { a: 'R', b: 'B', lab: n(br.a) + ' mm', dim: true }, { a: 'A', b: 'B', lab: n(br.c) + ' mm', off: 22 }], { H: 260, max: '2.1in' }), EX),
      long: true,
      steps: ['The brace is the hypotenuse: c = ' + n(br.c) + '. The known leg is a = ' + n(br.a) + '.', 'b² = ' + n(br.c) + '² − ' + n(br.a) + '² = ' + n(br.c * br.c) + ' − ' + n(br.a * br.a) + ' = ' + n(br.c * br.c - br.a * br.a) + '.', 'b = √' + n(br.c * br.c - br.a * br.a) + '.'],
      calc: { seq: '( ' + br.c + ' x² − ' + br.a + ' x² ) √x', expect: n(r2(brB), 2) },
      answer: n(r2(brB), 2) + ' mm. Check: it is shorter than the ' + n(br.c) + ' mm brace.'
    }),
    B.watch('Add to find the hypotenuse, subtract to find a leg', 'If you add the squares when you are looking for a leg, your answer will be longer than the hypotenuse. That cannot happen. A leg is always shorter than the hypotenuse.'),
    B.example({
      title: 'Feet and inches',
      q: 'A right triangle has legs of 2′ 8″ and 1′ 8″. Find the hypotenuse to the nearest 1/16″, in feet and inches.',
      steps: ['Change the legs to inches: 2′ 8″ = 2 × 12 + 8 = ' + im.a + '″ and 1′ 8″ = 1 × 12 + 8 = ' + im.b + '″.', 'c² = ' + im.a + '² + ' + im.b + '² = ' + n(im.a * im.a) + ' + ' + n(im.b * im.b) + ' = ' + n(im.a * im.a + im.b * im.b) + '.', 'c = √' + n(im.a * im.a + im.b * im.b) + ' = ' + n(L.round(imC, 5), 5) + '″ (the display shows more digits).', 'Change the decimal part to sixteenths: ' + n(imD5, 5) + ' × 16 = ' + n(L.round(imFr, 2), 2) + ', which rounds to ' + Math.round(imFr) + ' sixteenths.', Math.round(imFr) + '/16 = ' + L.frac(Math.round(imFr), 16) + ' in lowest terms.'],
      calc: { seq: '( ' + im.a + ' x² + ' + im.b + ' x² ) √x', expect: n(L.round(imC, 3), 3) },
      answer: L.inch(imC, 16) + ', which is ' + L.ftin(imC, 16) + '.'
    }),
    B.check(String(imD5) + ' × 16 =', n(L.round(imFr, 2), 2)),
    B.tryIt([
      { q: 'Legs 600 mm and 800 mm. Find the hypotenuse.', a: n(hyp(600, 800)) + ' mm' },
      { q: 'Legs 1,500 mm and 900 mm. Find the hypotenuse to two decimal places.', a: n(r2(hyp(1500, 900)), 2) + ' mm' },
      { q: 'Hypotenuse 1,300 mm, one leg 500 mm. Find the other leg.', a: n(leg(1300, 500)) + ' mm' },
      { q: 'Hypotenuse 2.5 m, one leg 1.8 m. Find the other leg to two decimal places.', a: n(r2(leg(2.5, 1.8)), 2) + ' m' },
      { q: 'Legs 9″ and 12″. Find the hypotenuse.', a: n(hyp(9, 12)) + '″' },
      { q: 'Legs 2′ 0″ and 1′ 3″. Find the hypotenuse to the nearest 1/16″.', a: L.inch(hyp(24, 15), 16) + ' (' + n(L.round(hyp(24, 15), 3), 3) + '″)' }
    ]),

    B.section('The 3-4-5 check for square'),
    B.p('The theorem also works backwards. If the sides of a triangle fit a² + b² = c², the corner between a and b is a right angle. The smallest whole numbers that fit are 3, 4 and 5: 3² + 4² = 9 + 16 = 25 = 5².',
      'Any multiple of 3, 4 and 5 works too, in any unit. Pick the largest set that fits on the work. A reading error of 1 mm matters less on a 1,000 mm diagonal than on a 500 mm one.'),
    B.how(['From the corner, measure and mark 3 units along one edge.', 'From the same corner, measure and mark 4 units along the other edge.', 'Measure the straight distance between the two marks.', 'If it is exactly 5 units, the corner is square. If it is longer, the corner is open past 90°. If it is shorter, the corner is closed to less than 90°.']),
    B.example({
      title: 'Is the frame square?',
      q: 'You mark 600 mm along one side of a frame corner and 800 mm along the other. The tape reads 1,006 mm between the marks. Is the corner square?',
      fig: A(() => G.cornerCheck(600, 800, { l1: '600 mm', l2: '800 mm', l3: '1,006 mm', max: '2.3in' }), EX),
      steps: ['For a square corner: 600² + 800² = 360,000 + 640,000 = 1,000,000, and √1,000,000 = 1,000 mm.', 'The tape reads 1,006 mm, which is 6 mm too long.', 'A diagonal that is too long means the corner is opened past 90°.'],
      answer: 'No. Close the corner until the marks are 1,000 mm apart.'
    }),
    B.table(['Leg a', 'Leg b', 'Diagonal c', 'Check: a² + b² = c²'], tri345.map(([a, b, u]) => [n(a) + ' ' + u, n(b) + ' ' + u, n(hyp(a, b)) + ' ' + u, n(a * a) + ' + ' + n(b * b) + ' = ' + n(a * a + b * b) + ' = ' + n(hyp(a, b)) + '²']), { align: ['c', 'c', 'c', ''], caption: 'Multiples of 3-4-5 in metric and imperial units.' }),
    B.tryIt([
      { q: 'Marks at 300 mm and 400 mm. What should the diagonal be?', a: '500 mm' },
      { q: 'Marks at 9 ft and 12 ft. What should the diagonal be?', a: '15 ft' },
      { q: 'Marks at 900 mm and 1,200 mm. The diagonal reads 1,494 mm. Is the corner open or closed?', a: 'Closed (less than 90°). It should read 1,500 mm.' },
      { q: 'Marks at 1.2 m and 1.6 m. What should the diagonal be?', a: n(hyp(1.2, 1.6)) + ' m' },
      { q: 'Marks at 15″ and 20″. What should the diagonal be?', a: n(hyp(15, 20)) + '″' },
      { q: 'Do 5, 12 and 13 make a right triangle? Show the check.', a: 'Yes. 25 + 144 = 169 = 13²' }
    ]),

    B.section('Diagonals of rectangles'),
    B.p('A diagonal joins opposite corners of a rectangle. It cuts the rectangle into two right triangles, so its length comes from the Pythagorean theorem: d = √(l² + w²).',
      'Diagonals are the fastest check for a whole frame. Measure both diagonals corner to corner. If the opposite sides are equal and the two diagonals are equal, every corner is 90°.'),
    B.example({
      title: 'Diagonal of a base frame',
      q: 'A base frame is ' + n(fr.l) + ' mm long and ' + n(fr.w) + ' mm wide. What should each diagonal measure, to the nearest millimetre?',
      fig: A(() => G.frameDiag(fr.l, fr.w, { l: n(fr.l) + ' mm', w: n(fr.w) + ' mm', askD: true, max: '2.6in', W: 380 }), EX),
      steps: ['d² = ' + n(fr.l) + '² + ' + n(fr.w) + '² = ' + n(fr.l * fr.l) + ' + ' + n(fr.w * fr.w) + ' = ' + n(fr.l * fr.l + fr.w * fr.w) + '.', 'd = √' + n(fr.l * fr.l + fr.w * fr.w) + ' = ' + n(r2(frD), 2) + ' mm.'],
      calc: { seq: '( ' + fr.l + ' x² + ' + fr.w + ' x² ) √x', expect: n(r2(frD), 2) },
      answer: n(Math.round(frD)) + ' mm'
    }),
    B.shop('Squaring a frame', 'When the two diagonals of a frame are different, the two corners at the ends of the long diagonal are less than 90°. Push those two corners toward each other and measure again until both diagonals match.'),
    B.tryIt([
      { q: 'A rectangle is 1,600 mm by 1,200 mm. Find the diagonal.', a: n(hyp(1600, 1200)) + ' mm' },
      { q: 'A frame is 1,800 mm by 750 mm. Find the diagonal.', a: n(hyp(1800, 750)) + ' mm' },
      { q: 'A frame is 3,000 mm by 1,500 mm. Find the diagonal to the nearest millimetre.', a: n(Math.round(hyp(3000, 1500))) + ' mm' },
      { q: 'A square has 300 mm sides. Find the diagonal to two decimal places. Hint: both legs are 300 mm.', a: n(r2(300 * Math.SQRT2), 2) + ' mm' },
      { q: 'A frame measures 2,013 mm on one diagonal and 2,020 mm on the other. Is it square?', a: 'No. The diagonals are not equal.' },
      { q: 'A door opening is 36″ by 80″. Find the diagonal to the nearest 1/16″.', a: L.inch(hyp(36, 80), 16) }
    ]),

    /* ---------- 12.7 Angle pairs and parallel lines ---------- */
    B.section('Angle pairs and parallel lines'),
    B.p('Some pairs of angles come up so often that they have names. Two angles that add to 90° are ' + B.term('complementary angles', 'Two angles that add to 90°.') + '. The two acute angles of a right triangle are complementary. Two angles that add to 180° are ' + B.term('supplementary angles', 'Two angles that add to 180°.') + '. The two angles at the bend of the strap in Example 12.2 are supplementary: 125° + 55° = 180°.',
      'When two straight lines cross, they make four angles. The angles across from each other are ' + B.term('vertically opposite angles', 'The angles across from each other where two straight lines cross. They are always equal.') + ', and they are always equal. Each angle and the angle beside it sit on a straight line, so they are supplementary.'),
    B.figure(A(() => G.crossLines(cr, [cr + '°', (180 - cr) + '°', cr + '°', (180 - cr) + '°'], { max: '2.6in' }), FULL), 'Two lines cross. The angles across from each other are equal: ' + cr + '° and ' + cr + '°, ' + (180 - cr) + '° and ' + (180 - cr) + '°. Any two angles side by side add to 180°.'),
    B.p('Two lines are ' + B.term('parallel lines', 'Lines that run in the same direction and stay the same distance apart. They never meet.', 'parallel') + ' when they run in the same direction and stay the same distance apart, like the two rails of a gate or the top and bottom plates of a wall. A line that crosses two or more lines is a ' + B.term('transversal', 'A line that crosses two or more other lines.') + '. Where a transversal crosses two parallel lines, it makes the same four angles at each crossing.'),
    B.figure(A(() => G.transversal(gt, ['a', 'b', 'c', 'd'], ['e', 'f', 'g', 'h'], { max: '3.3in' }), FULL), 'A transversal crosses two parallel lines and makes eight angles, a to h. The arrow marks show that the two lines are parallel.'),
    B.table(['Angle pair', 'Where the angles are', 'Rule', 'In ' + 'Figure ' + B.ch + '.' + B.fig], [
      ['Complementary', 'any two angles', 'add to 90°', 'the two acute angles of a right triangle'],
      ['Supplementary', 'any two angles', 'add to 180°', 'a and b, a and d'],
      ['Vertically opposite', 'across from each other at a crossing', 'equal', 'a and c, b and d'],
      ['Corresponding', 'in the same position at each crossing', 'equal', 'a and e, d and h'],
      ['Alternate', 'between the parallel lines, on opposite sides of the transversal', 'equal', 'c and e, d and f'],
      ['Co-interior', 'between the parallel lines, on the same side of the transversal', 'add to 180°', 'd and e, c and f']
    ], { align: ['', '', 'c', ''], caption: 'Angle pairs and their rules.' }),
    B.example({
      title: 'Angles on a gate brace',
      q: 'A brace crosses the two parallel rails of a gate. At the top rail, angle a is ' + gt + '°. Find angles b to h.',
      fig: A(() => G.transversal(gt, [gt + '°', 'b', 'c', 'd'], ['e', 'f', 'g', 'h'], { max: '2.7in', W: 380 }), EX),
      long: true,
      steps: ['b sits beside a on the straight rail: b = 180° − ' + gt + '° = ' + (180 - gt) + '°.', 'c is opposite a, so c = ' + gt + '°. d is opposite b, so d = ' + (180 - gt) + '°.', 'Corresponding angles are equal, so the bottom crossing repeats the top one: e = ' + gt + '°, f = ' + (180 - gt) + '°, g = ' + gt + '°, h = ' + (180 - gt) + '°.', 'Check with a co-interior pair: d + e = ' + (180 - gt) + '° + ' + gt + '° = 180°.'],
      answer: 'a, c, e and g are ' + gt + '°. b, d, f and h are ' + (180 - gt) + '°.'
    }),
    B.example({
      title: 'Crossed braces',
      q: 'Two braces cross like an X. One of the four angles where they cross is 68°. Find the other three.',
      fig: A(() => G.crossLines(68, ['68°', '?', '?', '?'], { max: '2.3in' }), EX),
      steps: ['The angle beside 68° makes a straight line with it: 180° − 68° = 112°.', 'Vertically opposite angles are equal: 68° across from 68°, and 112° across from 112°.', 'Check: 68° + 112° + 68° + 112° = 360°, a full turn.'],
      answer: '112°, 68° and 112°.'
    }),
    B.tryIt([
      { q: 'Find the complement of 28°.', a: n(90 - 28) + '°' },
      { q: 'Find the supplement of 28°.', a: n(180 - 28) + '°' },
      { q: 'Two lines cross. One angle is 104°. Find the other three.', a: n(180 - 104) + '°, 104° and ' + n(180 - 104) + '°' },
      { q: 'A transversal crosses two parallel lines. One of the eight angles is 41°. What sizes are the other seven?', a: 'Three more of 41° and four of ' + n(180 - 41) + '°' },
      { q: 'Two alternate angles lie between two parallel lines. One is 73°. Find the other.', a: '73° (alternate angles are equal)' },
      { q: 'Two co-interior angles lie between two parallel lines. One is 115°. Find the other.', a: n(180 - 115) + '°' }
    ]),

    /* ---------- 12.8 Degrees, minutes and seconds ---------- */
    B.section('Degrees, minutes and seconds'),
    B.p('A degree can be split into smaller parts. One degree is 60 ' + B.term('minutes of angle', 'One sixtieth of a degree, written ′. 60′ = 1°.', 'minutes') + ', and one minute is 60 ' + B.term('seconds of angle', 'One sixtieth of a minute of angle, written ″. 60″ = 1′.', 'seconds') + '. An angle written this way is in degrees, minutes and seconds, D°M′S for short. 36°52′12″ is read "36 degrees, 52 minutes, 12 seconds".',
      'The marks ′ and ″ are the same marks used for feet and inches. After a degree sign they mean minutes and seconds. An angle can also be written in decimal degrees, such as 36.87°. The SIN, COS and TAN keys work in decimal degrees, so you need to change from one form to the other.'),
    B.formula('Degrees, minutes and seconds', ['1° = 60′ and 1′ = 60″, so 1° = 3,600″', 'decimal degrees = D + M ÷ 60 + S ÷ 3,600', 'minutes = decimal part of the degrees × 60', 'seconds = decimal part of the minutes × 60'],'D, M and S are the degrees, minutes and seconds.'),
    B.example({
      title: 'D°M′S to decimal degrees',
      q: 'A drawing gives an angle of ' + d1[0] + '°' + d1[1] + '′' + d1[2] + '″. Change it to decimal degrees.',
      steps: ['Minutes: ' + d1[1] + ' ÷ 60 = ' + n(L.round(d1[1] / 60, 6), 6) + '.', 'Seconds: ' + d1[2] + ' ÷ 3,600 = ' + n(L.round(d1[2] / 3600, 6), 6) + '.', 'Add: ' + d1[0] + ' + ' + n(L.round(d1[1] / 60, 6), 6) + ' + ' + n(L.round(d1[2] / 3600, 6), 6) + ' = ' + n(L.round(d1v, 6)) + '°.'],
      after: G.dmsCalc(B, { seq: dk(...d1) + ' DMS▸DD', expect: n(L.round(d1v, 2)), say: 'On the TI-30Xa, key the angle as ' + dk(...d1) + ': the degrees, the decimal point, then two digits of minutes and two of seconds. 2nd DMS▸DD changes it to decimal degrees. On the Sharp, press D°M′S after the degrees and after the minutes. The Sharp shows the angle in D°M′S, and 2ndF ↔DEG switches the display to decimal degrees.' }),
      answer: n(L.round(d1v, 6)) + '°'
    }),
    B.example({
      title: 'Decimal degrees to D°M′S',
      q: 'Change ' + d2 + '° to degrees, minutes and seconds.',
      steps: ['The whole number is the degrees: 47°.', 'Minutes: 0.37 × 60 = ' + n(L.round(d2m, 4)) + '. The whole number is the minutes: ' + Math.floor(L.round(d2m, 4)) + '′.', 'Seconds: ' + n(L.round(d2m - Math.floor(L.round(d2m, 4)), 4)) + ' × 60 = ' + n(L.round(d2s, 4)) + '″.'],
      after: G.dmsCalc(B, { seq: d2 + ' DD▸DMS', expect: String(d2), say: 'On the TI-30Xa, 2nd DD▸DMS shows the angle in D°M′S while you look at it. The next calculation goes on in decimal degrees. On the Sharp, 2ndF ↔DEG switches the display between decimal degrees and D°M′S.' }),
      answer: dmsT(d2)
    }),
    B.tip('Keying angles in D°M′S', 'TI-30Xa: key D.MMSS, with two digits for the minutes and two for the seconds, using 0s where needed. 48°5′3″ is keyed 48.0503. Change a D°M′S value with 2nd DMS▸DD before you use it in a calculation.', 'Sharp EL-531XT: key the degrees, D°M′S, the minutes, D°M′S, then the seconds. The Sharp adds and subtracts D°M′S values as they are and shows the result in D°M′S.', 'Sources: TI-30Xa Guidebook, page 7 (DMS), and Sharp EL-531XT Operation Manual, Calculation Examples [10].'),
    B.example({
      title: 'Adding angles',
      q: 'Add ' + ad1[0] + '°' + ad1[1] + '′' + ad1[2] + '″ + ' + ad2[0] + '°' + ad2[1] + '′' + ad2[2] + '″.',
      steps: ['Add each column: ' + (ad1[0] + ad2[0]) + '°, ' + (ad1[1] + ad2[1]) + '′ and ' + (ad1[2] + ad2[2]) + '″.', (ad1[2] + ad2[2]) + '″ is more than 60″: ' + (ad1[2] + ad2[2]) + '″ = 1′ ' + (ad1[2] + ad2[2] - 60) + '″. Carry 1 to the minutes: ' + (ad1[1] + ad2[1] + 1) + '′.', (ad1[1] + ad2[1] + 1) + '′ = 1° ' + (ad1[1] + ad2[1] + 1 - 60) + '′. Carry 1 to the degrees: ' + (ad1[0] + ad2[0] + 1) + '°.'],
      after: G.dmsCalc(B, { seq: dk(...ad1) + ' DMS▸DD + ' + dk(...ad2) + ' DMS▸DD = DD▸DMS', expect: n(L.round(adv, 4)), say: 'The TI-30Xa adds in decimal degrees, and 2nd DD▸DMS shows the sum in D°M′S. The Sharp adds the D°M′S values and shows the sum in D°M′S.' }),
      answer: dmsT(adv)
    }),
    B.example({
      title: 'Subtracting from 90°',
      q: 'Find 90° − ' + sb[0] + '°' + sb[1] + '′' + sb[2] + '″, the complement of ' + sb[0] + '°' + sb[1] + '′' + sb[2] + '″.',
      steps: ['Write 90° as 89°59′60″: borrow 1° = 60′, then 1′ = 60″.', 'Subtract each column: 89 − ' + sb[0] + ' = ' + (89 - sb[0]) + '°, 59 − ' + sb[1] + ' = ' + (59 - sb[1]) + '′, 60 − ' + sb[2] + ' = ' + (60 - sb[2]) + '″.'],
      after: G.dmsCalc(B, { seq: '90 − ' + dk(...sb) + ' DMS▸DD = DD▸DMS', expect: n(L.round(sbv, 4)) }),
      answer: dmsT(sbv)
    }),
    B.watch('36.52° is not 36°52′', 'Decimal degrees and minutes are not the same thing. 36°52′ = 36 + 52 ÷ 60 = ' + n(L.round(dd(36, 52, 0), 4), 4) + '°, but 36.52° = ' + dmsT(36.52) + '. Always change one form to the other before you compare or calculate.'),
    B.check('36 + 52 ÷ 60 =', n(L.round(dd(36, 52, 0), 4), 4)),
    B.tryIt([
      { q: 'Change 25°30′ to decimal degrees.', a: n(dd(25, 30, 0)) + '°' },
      { q: 'Change 12°15′36″ to decimal degrees.', a: n(L.round(dd(12, 15, 36), 6)) + '°' },
      { q: 'Change 63.75° to D°M′S.', a: dmsT(63.75) },
      { q: 'Change 18.125° to D°M′S.', a: dmsT(18.125) },
      { q: 'Add 14°38′50″ + 22°45′25″.', a: dmsT(dd(14, 38, 50) + dd(22, 45, 25)) },
      { q: 'Find the supplement of 72°41′36″.', a: dmsT(180 - dd(72, 41, 36)) }
    ]),
    B.check('12.1536 DMS▸DD', n(L.round(dd(12, 15, 36), 6))),
    B.check('14.3850 DMS▸DD + 22.4525 DMS▸DD = DD▸DMS', n(L.round(dd(14, 38, 50) + dd(22, 45, 25), 4))),
    B.check('180 − 72.4136 DMS▸DD = DD▸DMS', n(L.round(180 - dd(72, 41, 36), 4))),

    /* ---------- 12.9 Stair geometry ---------- */
    B.section('Stair geometry'),
    B.p('A straight stair is a row of small right triangles that make one large right triangle. Each step has a ' + B.b('unit rise') + ', the height of one riser, and a ' + B.b('unit run') + ', the depth of one tread measured from nosing to nosing. The whole flight has a ' + B.b('total rise') + ' from floor to floor and a ' + B.b('total run') + ' along the floor. The stringer, the board that carries the treads, slopes along the long side.',
      'Chapter 8 shows the stair formulas: how many risers a stair needs, the unit rise and the total run. This section puts those numbers on a drawing, checks them against the BC Building Code and finds the stringer line with the Pythagorean theorem.'),
    B.figure(A(() => G.stairSide(6, 190, 260, { names: true, lab: { rise: 'unit rise', run: 'unit run', totalRise: 'total rise', totalRun: 'total run', stringer: 'stringer line' }, max: '4.4in' }), FULL), 'A straight flight with 6 risers and 5 treads. The upper floor is the last step, so this flight has one tread fewer than it has risers. The dashed stringer line runs from the bottom corner to the top corner.'),
    B.formula('Stair geometry', ['treads = risers − 1 (a flight from floor to floor)', 'total rise = risers × unit rise', 'total run = treads × unit run', 'stringer line = √(total rise² + total run²)'], 'The stringer line is the hypotenuse of the right triangle that has the total rise and the total run as its legs. The board for a stringer is longer than the line, to leave room for the cuts at each end.'),
    B.sub('What the BC Building Code says'),
    B.p('The BC Building Code 2024 (BCBC), Division B, Part 9, limits the rise and run of stairs. The limits depend on the stair type. In the code, private stairs are "exterior and interior stairs that serve a. single dwelling units, b. houses with a secondary suite including their common spaces, or c. garages that serve houses described in Clause a) or b)". Public stairs are "all stairs not described as service stairs or private stairs" (Notes to Tables 9.8.4.1. and 9.8.4.2., page 9-31). The rise and run tables do not apply to "stairs serving areas only used as service rooms or service spaces".'),
    B.table(['What is limited', 'Private stair', 'Public stair', 'Where in the BCBC 2024, Division B'], [
      ['Rise, maximum', '200 mm', '180 mm', 'Article 9.8.4.1, Sentence (1), Table 9.8.4.1, page 9-31'],
      ['Rise, minimum', '125 mm', '125 mm', 'Article 9.8.4.1, Sentence (1), Table 9.8.4.1, page 9-31'],
      ['Run, maximum', '355 mm', 'No limit', 'Article 9.8.4.2, Sentence (1), Table 9.8.4.2, page 9-31'],
      ['Run, minimum', '255 mm', '280 mm', 'Article 9.8.4.2, Sentence (1), Table 9.8.4.2, page 9-31'],
      ['Depth of a rectangular tread', 'not less than its run and not more than its run plus 25 mm', 'the same', 'Article 9.8.4.2, Sentence (2), page 9-31'],
      ['Risers in one flight', '5 mm between adjacent treads or landings, 10 mm between the tallest and shortest', 'the same', 'Article 9.8.4.4, Sentence (1), page 9-32'],
      ['Runs of rectangular treads in one flight', '5 mm between adjacent treads, 10 mm between the deepest and shallowest', 'the same', 'Article 9.8.4.4, Sentence (3), page 9-32']
    ], { align: ['', 'c', 'c', ''], caption: 'Stair limits quoted from the BCBC 2024. The rise "is measured as the vertical nosing-to-nosing distance" (Sentence 9.8.4.1.(1)).' }),
    B.p('Clear height over a stair is measured "vertically, over the clear width of the stair, from a straight line tangent to the tread and landing nosings to the lowest point above". It "shall not be less than 2 050 mm", and over stairs "serving a single dwelling unit or a house with a secondary suite including their common spaces" it "shall not be less than 1 950 mm" (Article 9.8.2.2, Sentences (1) to (3), page 9-30).'),
    G.plateFig(B, [{ num: '9.8.4.1', crop: [660, 398, 340, 218], width: '3.05in' }, { num: '9.8.4.2', crop: [586, 398, 336, 218], width: '3.05in' }], 'Rise (left) and run (right) are both measured from nosing to nosing. Tread depth (right) is measured from the nosing to the riser, so it is a little more than the run.'),
    B.example({
      title: 'Laying out a stair',
      q: 'A stair in a house runs from one floor to the next. The total rise is ' + n(st.tr) + ' mm. Use the private stair maximum rise of ' + st.max + ' mm to find the number of risers and the unit rise. The treads have a unit run of ' + st.run + ' mm. Check both against Table 12.3, then find the total run and the stringer line, to two decimal places.',
      fig: A(() => G.stairSide(st.n, st.ur, st.run, { lab: { totalRise: n(st.tr) + ' mm', totalRun: '?', stringer: '?' }, max: '2.6in' }), EX),
      steps: ['Risers (Chapter 8): ' + n(st.tr) + ' ÷ ' + st.max + ' = ' + n(st.tr / st.max) + '. Round up to ' + st.n + ' risers, so no riser is taller than ' + st.max + ' mm.', 'Unit rise = ' + n(st.tr) + ' ÷ ' + st.n + ' = ' + f2(st.ur) + ' mm. It is between 125 mm and 200 mm.', 'Treads = ' + st.n + ' − 1 = ' + st.t + '. The unit run of ' + st.run + ' mm is between 255 mm and 355 mm.', 'Total run = ' + st.t + ' × ' + st.run + ' = ' + n(st.trun) + ' mm.', 'Stringer line = √(' + n(st.tr) + '² + ' + n(st.trun) + '²).'],
      calc: { rows: [{ label: 'Unit rise', seq: st.tr + ' ÷ ' + st.n + ' =', expect: f2(st.ur) }, { label: 'Stringer line', seq: '( ' + st.tr + ' x² + ' + st.trun + ' x² ) √x', expect: f2(st.len) }] },
      answer: st.n + ' risers of ' + f2(st.ur) + ' mm and ' + st.t + ' treads. Total run ' + n(st.trun) + ' mm, stringer line ' + f2(st.len) + ' mm.'
    }),
    B.example({
      title: 'A deck stair in inches',
      q: 'A deck stair has ' + si.n + ' risers of ' + L.mx(7, 1, 4) + '″ and ' + (si.n - 1) + ' treads with a unit run of ' + L.mx(10, 1, 2) + '″. Find the total rise, the total run and the stringer line to the nearest 1/16″. Then change the unit rise and run to millimetres (1 in = 25.4 mm, Chapter 7) and check them against the private stair limits.',
      steps: ['Total rise = ' + si.n + ' × 7.25 = ' + n(si.tr) + '″. Total run = ' + (si.n - 1) + ' × 10.5 = ' + n(si.trun) + '″.', 'Stringer line = √(' + n(si.tr) + '² + ' + n(si.trun) + '²) = ' + f3(si.len) + '″, which is ' + L.inch(si.len, 16) + ' or ' + L.ftin(si.len, 16) + '.', 'Unit rise: 7.25 × 25.4 = ' + f2(si.rmm) + ' mm, between 125 mm and 200 mm. Unit run: 10.5 × 25.4 = ' + f2(si.umm) + ' mm, between 255 mm and 355 mm.'],
      calc: { seq: '( ' + si.tr + ' x² + ' + si.trun + ' x² ) √x', expect: f3(si.len) },
      answer: 'Total rise ' + n(si.tr) + '″, total run ' + n(si.trun) + '″, stringer line ' + L.ftin(si.len, 16) + '. Both step sizes are inside the private stair limits.'
    }),
    B.check('7.25 × 25.4 =', f2(si.rmm)),
    B.check('10.5 × 25.4 =', f2(si.umm)),
    B.example({
      title: 'Checking the risers of a flight',
      q: 'The risers in one flight measure ' + unif.join(', ') + ' mm, from the bottom up. Does the flight meet Article 9.8.4.4, Sentence (1)?',
      steps: ['Differences between neighbours: ' + adj.join(', ') + ' mm. The largest is ' + adjMax + ' mm, more than the 5 mm allowed between adjacent treads or landings.', 'Tallest minus shortest: ' + Math.max(...unif) + ' − ' + Math.min(...unif) + ' = ' + spread + ' mm. That is inside the 10 mm allowed in a flight.'],
      answer: 'No. The flight passes the 10 mm check but fails the 5 mm check between the ' + unif[2] + ' mm and ' + unif[3] + ' mm risers.'
    }),
    B.tryIt([
      { q: 'A stair has 12 risers of 185 mm and 11 treads with a 270 mm unit run. Find the total rise, the total run and the stringer line to two decimal places.', a: 'Total rise ' + n(12 * 185) + ' mm, total run ' + n(11 * 270) + ' mm, stringer line ' + f2(hyp(12 * 185, 11 * 270)) + ' mm' },
      { q: 'Is a unit rise of 205 mm allowed on a private stair? On a public stair?', a: 'No on both. The maximum rise is 200 mm for private stairs and 180 mm for public stairs (Table 9.8.4.1).' },
      { q: 'A public stair has a unit run of 275 mm. Does it meet Table 9.8.4.2?', a: 'No. The minimum run for a public stair is 280 mm.' },
      { q: 'A rectangular tread has a run of 260 mm. What tread depths does Sentence 9.8.4.2.(2) allow?', a: '260 mm to ' + (260 + 25) + ' mm' },
      { q: 'Measured straight up from the nosing line, a beam is 2,000 mm above a stair. Is that enough over a stair serving a single dwelling unit? Over a public stair?', a: 'Yes for the dwelling unit (1,950 mm minimum). No for the public stair (2,050 mm minimum).' },
      { q: 'A stair has 4 risers of 7½″ and 3 treads of 11″. Find the stringer line to the nearest 1/16″.', a: L.inch(hyp(4 * 7.5, 3 * 11), 16) + ' (' + f3(hyp(4 * 7.5, 3 * 11)) + '″)' }
    ]),
    B.check('( 2220 x² + 2970 x² ) √x', f2(hyp(2220, 2970))),
    B.check('( 30 x² + 33 x² ) √x', f3(hyp(30, 33))),

    /* ---------- 12.10 Rafters and squaring a layout ---------- */
    B.section('Rafters and squaring a layout'),
    B.p('A gable roof is two right triangles back to back. In this section the ' + B.b('run') + ' of a rafter is the level distance it covers, from the wall line to the centre line of the ridge, and the ' + B.b('rise') + ' is how far it climbs over that run. The rafter line length is the hypotenuse. When the ridge is in the middle, the run is half the span.',
      'Roof slope is often written as rise in 12: the number of units the roof rises for every 12 units of run. A 5 in 12 roof rises 5 mm for every 12 mm of run, or 5″ for every foot. Chapter 13 finds the angle of the roof from the same two numbers.'),
    B.figure(A(() => G.gable(24, 5, { lab: { span: 'span', run: 'run', rise: 'rise', rafter: 'rafter line length' }, slope: [5, 12], max: '3.8in' }), FULL), 'A gable roof with a 5 in 12 slope. The rafter line length is the hypotenuse of the triangle with the run and the rise as legs. The small triangle on the left shows the slope: 5 up for every 12 across.'),
    B.formula('Rafter line length', ['rise = run × (rise in 12) ÷ 12', 'rafter line length = √(run² + rise²)', 'length per foot of run = √(12² + (rise in 12)²), in inches'], 'Multiply the length per foot of run by the run in feet to get the rafter line length in inches.'),
    B.example({
      title: 'Rafter line length in millimetres',
      q: 'A building is ' + n(rf.span) + ' mm wide with the ridge in the middle. The roof slope is ' + rf.p + ' in 12. Find the run, the rise and the rafter line length.',
      fig: A(() => G.gable(rf.span, rf.rise, { lab: { span: n(rf.span) + ' mm', run: '?', rise: '?', rafter: '?' }, slope: [rf.p, 12], max: '2.6in' }), EX),
      steps: ['Run = ' + n(rf.span) + ' ÷ 2 = ' + n(rf.run) + ' mm.', 'Rise = ' + n(rf.run) + ' × ' + rf.p + ' ÷ 12 = ' + n(rf.rise) + ' mm.', 'Rafter line length = √(' + n(rf.run) + '² + ' + n(rf.rise) + '²).'],
      calc: { seq: '( ' + rf.run + ' x² + ' + rf.rise + ' x² ) √x', expect: n(rf.len) },
      answer: 'Run ' + n(rf.run) + ' mm, rise ' + n(rf.rise) + ' mm, rafter line length ' + n(rf.len) + ' mm. The sides are 12, 5 and 13 times ' + n(rf.run / 12) + ' mm.'
    }),
    B.example({
      title: 'Rafter line length in feet and inches',
      q: 'A ' + ri.p + ' in 12 roof has a rafter run of 11′ 6″. Find the rafter line length to the nearest 1/16″, two ways.',
      steps: ['Run = 11 × 12 + 6 = ' + ri.run + '″. Rise = ' + ri.run + ' × ' + ri.p + ' ÷ 12 = ' + n(ri.rise) + '″.', 'Way 1: √(' + ri.run + '² + ' + n(ri.rise) + '²) = ' + f3(ri.len) + '″.', 'Way 2: length per foot of run = √(12² + ' + ri.p + '²) = ' + f3(ri.pf) + '″. The run is 11.5 ft, and 11.5 × ' + f3(ri.pf) + ' = ' + f3(11.5 * L.round(ri.pf, 3)) + '″. The rounded constant makes the last digit differ a little.'],
      calc: { rows: [{ label: 'Way 1', seq: '( ' + ri.run + ' x² + ' + ri.rise + ' x² ) √x', expect: f3(ri.len) }, { label: 'Length per foot of run', seq: '( 12 x² + ' + ri.p + ' x² ) √x', expect: f3(ri.pf) }] },
      answer: L.inch(ri.len, 16) + ', which is ' + L.ftin(ri.len, 16) + '.'
    }),
    B.check('11.5 × ' + f3(ri.pf) + ' =', f3(11.5 * L.round(ri.pf, 3))),
    B.sub('Squaring a layout'),
    B.p('The outline of a building, a deck or a wall is laid out square with the methods of Sections 12.5 and 12.6. Use the largest multiple of 3, 4 and 5 that fits at a corner, then check that both diagonals match.'),
    B.example({
      title: 'Squaring a foundation layout',
      q: 'A foundation layout is ' + n(lay.l) + ' mm by ' + n(lay.w) + ' mm. (a) What 3-4-5 marks would you use at a corner, with 1,200 mm as the unit? (b) What should each diagonal measure, to the nearest millimetre? (c) The diagonals measure ' + n(lay.d1) + ' mm and ' + n(lay.d2) + ' mm. Is the layout square?',
      fig: A(() => G.frameDiag(lay.l, lay.w, { l: n(lay.l) + ' mm', w: n(lay.w) + ' mm', askD: true, max: '2.6in', W: 380 }), EX),
      long: true,
      steps: ['(a) 3 × 1,200 = ' + n(lay.m1) + ' mm along one side and 4 × 1,200 = ' + n(lay.m2) + ' mm along the other. The marks should be 5 × 1,200 = ' + n(hyp(lay.m1, lay.m2)) + ' mm apart.', '(b) d = √(' + n(lay.l) + '² + ' + n(lay.w) + '²) = ' + f2(lay.d) + ' mm.', '(c) The diagonals differ by ' + n(lay.d1) + ' − ' + n(lay.d2) + ' = ' + (lay.d1 - lay.d2) + ' mm, so the layout is not square.'],
      calc: { seq: '( ' + lay.l + ' x² + ' + lay.w + ' x² ) √x', expect: f2(lay.d) },
      answer: '(a) ' + n(lay.m1) + ' mm and ' + n(lay.m2) + ' mm, ' + n(hyp(lay.m1, lay.m2)) + ' mm apart. (b) ' + n(Math.round(lay.d)) + ' mm. (c) No. Push the two corners at the ends of the ' + n(lay.d1) + ' mm diagonal toward each other until both diagonals read ' + n(Math.round(lay.d)) + ' mm.'
    }),
    B.tryIt([
      { q: 'A roof has a 4 in 12 slope and a run of 3,000 mm. Find the rise and the rafter line length to two decimal places.', a: 'Rise ' + n(3000 * 4 / 12) + ' mm, rafter line ' + f2(hyp(3000, 1000)) + ' mm' },
      { q: 'A building is 9,000 mm wide with the ridge in the middle and an 8 in 12 slope. Find the run, the rise and the rafter line length to two decimal places.', a: 'Run ' + n(4500) + ' mm, rise ' + n(4500 * 8 / 12) + ' mm, rafter line ' + f2(hyp(4500, 3000)) + ' mm' },
      { q: 'A 12 in 12 roof has a run of 10′. Find the rafter line length to the nearest 1/16″.', a: L.inch(hyp(120, 120), 16) + ', which is ' + L.ftin(hyp(120, 120), 16) },
      { q: 'Find the length per foot of run for a 7 in 12 roof, to three decimal places.', a: f3(hyp(12, 7)) + '″' },
      { q: 'A deck frame is 4,800 mm by 3,600 mm. What should each diagonal measure?', a: n(hyp(4800, 3600)) + ' mm' },
      { q: 'A wall layout is 20′ by 12′. What should the diagonal be, to the nearest 1/16″?', a: L.ftin(hyp(240, 144), 16) + ' (' + f3(hyp(240, 144)) + '″)' }
    ]),
    B.check('( 3000 x² + 1000 x² ) √x', f2(hyp(3000, 1000))),
    B.check('( 4500 x² + 3000 x² ) √x', f2(hyp(4500, 3000))),
    B.check('( 120 x² + 120 x² ) √x', f3(hyp(120, 120))),
    B.check('( 12 x² + 7 x² ) √x', f3(hyp(12, 7))),
    B.check('( 240 x² + 144 x² ) √x', f3(hyp(240, 144))),

    B.worksheet({ title: 'Angles on the canvas', sub: 'Each drawing shows the angles at their true size. Find every red ?', intro: 'Use the angle facts from this chapter: a straight line is 180°, a full turn is 360° and the angles of a triangle add to 180°. Write the fact you used in the working box.' }),
    B.grid2(
      B.prob({ q: 'Find the third angle of the triangle.', canvas: A(() => hmax(triFig(48, 74, { ask: 'T', max: '1.75in' }), 1.0), GRID), a: n(180 - 48 - 74) + '°', lines: 2 }),
      B.prob({ q: 'Find the missing angle of the right triangle.', canvas: A(() => hmax(G.poly({ pts: { R: [0, 0], A: [10, 0], T: [0, 10 * Math.tan(27 * D2R)] }, order: ['R', 'A', 'T'], right: 'R', ang: { A: { lab: '27°', r: 44, s: 15 }, T: { ask: true, s: 15 } }, W: 340, H: 200, pad: 34, max: '2.1in' }), 1.0), GRID), a: n(90 - 27) + '°', lines: 2 }),
      B.prob({ q: 'A strap is bent as shown. Find the ?', canvas: A(() => hmax(G.straightLine(138, { askL: true, max: '2.3in' }), 1.0), GRID), a: n(180 - 138) + '°', lines: 2 }),
      B.prob({ q: 'Three lines meet at a point. Find the ?', canvas: A(() => hmax(G.aroundPoint([100, 145, 115], { ask: 2, start: 20, max: '1.45in' }), 1.0), GRID), a: n(360 - 100 - 145) + '°', lines: 2 }),
      B.prob({ q: 'Eight holes are evenly spaced. Find the angle between neighbours.', canvas: A(() => hmax(G.boltCircle(8, { ask: true, max: '1.45in' }), 1.0), GRID), a: n(360 / 8) + '°', lines: 2 }),
      B.prob({ q: 'The gusset has two equal sides. Find each ?', canvas: A(() => hmax(G.poly({ pts: { P: [0, 0], Q: [10, 0], T: [5, 5 * Math.tan(72 * D2R)] }, order: ['P', 'Q', 'T'], ang: { P: { ask: true, s: 15 }, Q: { ask: true, s: 15 }, T: { lab: '36°', r: 34, s: 15 } }, W: 220, H: 260, pad: 30, max: '1.2in' }), 1.0), GRID), a: n((180 - 36) / 2) + '° each', lines: 2 })
    ),
      B.prob({ q: 'Break it down. The dashed line splits the plate into triangles A and B. How many degrees do the four angles of the plate add to? Find the ?', canvas: A(() => G.poly({ pts: quad.pts, order: ['W', 'X', 'Y', 'Z'], ang: { W: { lab: '85°' }, X: { lab: '100°' }, Y: { lab: '75°' }, Z: { ask: true } }, W: 380, H: 260, pad: 36, max: '2.6in', extra: (P, Q) => F.line(Q.X[0], Q.X[1], Q.Z[0], Q.Z[1], { c: C.dim, w: 1.4, dash: '6 4' }) + FK.t((Q.W[0] + Q.X[0] + Q.Z[0]) / 3, (Q.W[1] + Q.X[1] + Q.Z[1]) / 3 + 6, 'A', { s: 16, b: true, c: C.edge }) + FK.t((Q.X[0] + Q.Y[0] + Q.Z[0]) / 3, (Q.X[1] + Q.Y[1] + Q.Z[1]) / 3 + 6, 'B', { s: 16, b: true, c: C.edge }) }), FULL), a: 'Two triangles hold 2 × 180° = 360°. ? = 360 − 85 − 100 − 75 = ' + n(360 - 85 - 100 - 75) + '°', lines: 2 }),
      B.prob({ q: 'Read the protractor. How big is the angle, and what type of angle is it?', canvas: A(() => G.protractor(125, { ask: true, step: 20, max: '2.8in' }), FULL), a: '125°, an obtuse angle', lines: 2 }),
    B.prob({ q: 'Change one value. The plate in problem 5 is made with 10 holes instead of 8, still evenly spaced. What is the angle between neighbours now? With 12 holes? Do more holes give a bigger or a smaller angle?', a: n(360 / 10) + '° with 10 holes, ' + n(360 / 12) + '° with 12 holes. More holes give a smaller angle.', lines: 3 }),

    B.worksheet({ title: 'Pythagoras on the canvas', sub: 'Every triangle has a right angle. Find every red ?', intro: 'Label the hypotenuse c before you start. Add the squares to find the hypotenuse. Subtract to find a leg. Check that the hypotenuse is the longest side.' }),
    B.grid2(
      B.prob({ q: 'Find the hypotenuse.', canvas: A(() => rtLab(600, 450, [{ a: 'R', b: 'A', lab: '600 mm', dim: true }, { a: 'R', b: 'B', lab: '450 mm', dim: true }, { a: 'A', b: 'B', ask: true, off: 22 }], { max: '2.3in' }), GRID), a: n(hyp(600, 450)) + ' mm', lines: 3 }),
      B.prob({ q: 'Find the missing leg.', canvas: A(() => rtLab(1.2, 0.5, [{ a: 'R', b: 'A', lab: '1.2 m', dim: true }, { a: 'R', b: 'B', ask: true, dim: true }, { a: 'A', b: 'B', lab: '1.3 m', off: 22 }], { max: '2.3in' }), GRID), a: n(leg(1.3, 1.2), 1) + ' m', lines: 3 }),
      B.prob({ q: 'Find the hypotenuse to the nearest 1/16″.', canvas: A(() => rtLab(22, 15, [{ a: 'R', b: 'A', lab: '22″', dim: true }, { a: 'R', b: 'B', lab: '15″', dim: true }, { a: 'A', b: 'B', ask: true, off: 22 }], { max: '2.3in' }), GRID), a: L.inch(hyp(22, 15), 16) + ' (' + n(L.round(hyp(22, 15), 3), 3) + '″)', lines: 3 }),
      B.prob({ q: 'Find the diagonal of the frame to two decimal places.', canvas: A(() => G.frameDiag(1800, 900, { l: '1,800 mm', w: '900 mm', askD: true, both: false, max: '2.4in', W: 360 }), GRID), a: n(r2(hyp(1800, 900)), 2) + ' mm', lines: 3 })
    ),
    B.grid2(
      B.prob({ q: 'A stair has a total rise of 1,050 mm and a total run of 1,400 mm. How long is the stringer from the bottom corner to the top corner?', canvas: A(() => stringer(1400, 1050), GRID), a: n(hyp(1400, 1050)) + ' mm', lines: 3 }),
      B.prob({ q: 'You mark 900 mm and 1,200 mm from a corner. The tape reads 1,507 mm between the marks. What should it read? Is the corner open or closed?', canvas: A(() => G.cornerCheck(900, 1200, { l1: '900 mm', l2: '1,200 mm', ask3: true, max: '2.5in' }), GRID), a: 'It should read ' + n(hyp(900, 1200)) + ' mm. At 1,507 mm the corner is open past 90°.', lines: 3 })
    ),
    B.prob({ q: 'Change one value. A right triangle has legs of 300 mm and 400 mm. Find the hypotenuse. Then double both legs. What happens to the hypotenuse?', a: n(hyp(300, 400)) + ' mm. With legs of 600 mm and 800 mm it is ' + n(hyp(600, 800)) + ' mm, so it doubles too.', lines: 3 }),
    B.prob({ q: 'Break it down. A box is 600 mm long, 400 mm wide and 300 mm high. First find the diagonal across the bottom. Then use it as a leg to find the longest straight rod that fits inside, corner to corner. Give the answer to two decimal places.', lines: 3, canvas: B.shape('rectangular-prism', { l: 600, w: 400, h: 300 }, { units: 'mm', width: '1.8in' }), a: 'Bottom diagonal √(600² + 400²) = ' + n(r2(hyp(600, 400)), 2) + ' mm. Rod √(' + n(600 * 600 + 400 * 400) + ' + 300²) = ' + n(r2(Math.sqrt(600 * 600 + 400 * 400 + 300 * 300)), 2) + ' mm' })
  ])
}
