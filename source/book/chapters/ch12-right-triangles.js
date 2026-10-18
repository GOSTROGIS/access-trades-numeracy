/* Chapter 12: Angles and Right Triangles */
module.exports = function (B, L) {
  const F = require('../engine/figs.js')
  const G = require('../engine/figs-ch12.js')
  const C = F.C
  const n = L.num
  const r2 = x => L.round(x, 2)
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
