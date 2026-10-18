/* Exercise Book, Chapter 12: Angles and Right Triangles */
module.exports = function (B, L) {
  const F = require('../engine/figs.js')
  const G = require('../engine/figs-ch12.js')
  const C = F.C
  const n = L.num
  const D2R = Math.PI / 180
  const f2 = x => n(L.round(x, 2), 2), f3 = x => n(L.round(x, 3), 3)
  const hyp = (a, b) => Math.sqrt(a * a + b * b)
  const leg = (c, a) => Math.sqrt(c * c - a * a)

  /* every label must print at 7 pt or more: font size times the print scale of the drawing */
  function chk(svg, colIn) {
    const vb = /viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/.exec(svg)
    const mw = /max-width:([\d.]+)in/.exec(svg)
    const disp = Math.min(+mw[1], colIn || 6)
    const sizes = Array.from(svg.matchAll(/font-size="([\d.]+)"/g)).map(m => +m[1])
    const pt = Math.min(...sizes) * disp * 72 / +vb[3]
    if (pt < 7) throw new Error('ch12 exercise label prints at ' + pt.toFixed(2) + ' pt')
    return svg
  }
  const g = svg => chk(svg, 2.7)
  const full = svg => chk(svg, 6)

  /* triangle from two base angles, labels at a readable size */
  function triFig(a, b, ask, max) {
    const c = 180 - a - b, side = 10 * Math.sin(b * D2R) / Math.sin(c * D2R)
    const pts = { P: [0, 0], Q: [10, 0], T: [side * Math.cos(a * D2R), side * Math.sin(a * D2R)] }
    const lab = (k, v) => (ask === k ? { ask: true, s: 20, r: 36 } : { lab: v + '°', s: 20, r: 36 })
    return G.poly({ pts, order: ['P', 'Q', 'T'], ang: { P: lab('P', a), Q: lab('Q', b), T: lab('T', c) }, W: 340, H: 230, pad: 34, max: max || '2.3in' })
  }
  /* a straight line with a ray, larger labels than the textbook drawing */
  function lineAngle(deg, askLeft) {
    const W = 300, H = 130, vx = 150, vy = 104, Lr = 96
    let h = F.line(16, vy, W - 16, vy, { c: C.edge, w: 2.6 })
    const e = [vx + Lr * Math.cos(-deg * D2R), vy + Lr * Math.sin(-deg * D2R)]
    h += F.line(vx, vy, e[0], e[1], { c: C.edge, w: 2.6 })
    h += F.arc([vx, vy], -deg * D2R, 0, 28, askLeft ? deg + '°' : '?', { ask: !askLeft, lr: 20, s: 18 })
    h += F.arc([vx, vy], -Math.PI, -deg * D2R, 42, askLeft ? '?' : (180 - deg) + '°', { ask: askLeft, lr: 20, s: 18, c: C.edge })
    return F.svg(W, H, h, { max: '2.3in' })
  }
  /* angles around a point with larger labels */
  function around(angs, ask, start) {
    const W = 260, H = 240, cx = 130, cy = 120, Lr = 96
    let h = '', a = start || 0
    const rays = angs.map(d => { const r = a; a += d; return r })
    rays.forEach(r => { h += F.line(cx, cy, cx + Lr * Math.cos(-r * D2R), cy + Lr * Math.sin(-r * D2R), { c: C.edge, w: 2.6 }) })
    angs.forEach((d, i) => { h += F.arc([cx, cy], -(rays[i] + d) * D2R, -rays[i] * D2R, 26 + (i % 2) * 8, ask === i ? '?' : d + '°', { ask: ask === i, lr: 24, s: 18, c: i % 2 ? C.edge : C.red }) })
    return F.svg(W, H, h, { max: '2in' })
  }
  /* plate with a sloped top: bottom width w, left height hl, right height hr, split into rectangle A and triangle B */
  function slopedPlate(w, hl, hr) {
    return G.poly({
      pts: { P: [0, 0], Q: [w, 0], R: [w, hr], S: [0, hl] }, order: ['P', 'Q', 'R', 'S'], W: 520, H: 260, pad: 70, padX: 130, max: '2.7in',
      sides: [{ a: 'P', b: 'Q', lab: n(w) + ' mm', dim: true, s: 16 }, { a: 'Q', b: 'R', lab: n(hr) + ' mm', dim: true, s: 16, off: 56 }, { a: 'P', b: 'S', lab: n(hl) + ' mm', dim: true, s: 16, off: 56 }, { a: 'R', b: 'S', ask: true, off: 24 }],
      right: ['P', 'Q'],
      extra: (P) => {
        const a = P([0, hr]), b = P([w, hr]), m1 = P([w / 2, hr / 2]), m2 = P([w * 0.33, hr + (hl - hr) * 0.33])
        return F.line(a[0], a[1], b[0], b[1], { c: C.dim, w: 1.4, dash: '6 4' }) + F.t(m1[0], m1[1] + 7, 'A', { s: 20, b: true, c: C.edge }) + F.t(m2[0], m2[1] + 7, 'B', { s: 20, b: true, c: C.edge })
      }
    })
  }

  /* values */
  const s11 = hyp(350, 480), s13 = leg(2.6, 1.4), s14 = hyp(14, 19), s17 = hyp(1100, 600), s18 = 450 * Math.SQRT2
  const rack = hyp(3000, 1800), cv = hyp(2250, 800), gate = hyp(48, 78), plateB = hyp(900, 300)

  return L.join([
    B.exChapter({ num: 12, id: 'triangles', title: 'Angles and Right Triangles', intro: 'Practice with degrees, angle names, missing angles in triangles, the Pythagorean theorem, the 3-4-5 check and diagonals.' }),

    B.worksheet({ title: 'Skills', sub: 'Angles, triangles and the Pythagorean theorem, one skill at a time.' }),
    B.grid2(
      B.prob({ q: 'How many degrees are in one third of a turn?', a: n(360 / 3) + '°', lines: 3 }),
      B.prob({ q: 'Nine holes are evenly spaced around a circle. What is the angle between neighbours?', a: n(360 / 9) + '°', lines: 3 }),
      B.prob({ q: 'Name each angle: 12°, 90°, 179°, 95°.', a: 'acute, right, obtuse, obtuse', lines: 3 }),
      B.prob({ q: 'Two angles sit on a straight line. One is 64°. Find the other.', a: n(180 - 64) + '°', lines: 3 }),
      B.prob({ q: 'Four angles go around a point: 80°, 95°, 110° and ?. Find the ?', a: n(360 - 80 - 95 - 110) + '°', lines: 3 }),
      B.prob({ q: 'A triangle has angles of 52° and 71°. Find the third angle.', a: n(180 - 52 - 71) + '°', lines: 3 }),
      B.prob({ q: 'One acute angle of a right triangle is 38°. Find the other.', a: n(90 - 38) + '°', lines: 3 }),
      B.prob({ q: 'A triangle has two equal sides with 64° between them. Find the other two angles.', a: n((180 - 64) / 2) + '° each', lines: 3 }),
      B.prob({ q: 'A triangle has two equal angles of 35°. Find the third angle.', a: n(180 - 2 * 35) + '°', lines: 3 }),
      B.prob({ q: 'Legs of 700 mm and 2,400 mm. Find the hypotenuse.', a: n(hyp(700, 2400)) + ' mm', lines: 3 }),
      B.prob({ q: 'Legs of 350 mm and 480 mm. Find the hypotenuse to two decimal places.', a: f2(s11) + ' mm', work: '√(350² + 480²) = √' + n(350 * 350 + 480 * 480), lines: 3 }),
      B.prob({ q: 'Hypotenuse 1,700 mm, one leg 800 mm. Find the other leg.', a: n(leg(1700, 800)) + ' mm', work: '√(1,700² − 800²) = √' + n(1700 * 1700 - 800 * 800), lines: 3 }),
      B.prob({ q: 'Hypotenuse 2.6 m, one leg 1.4 m. Find the other leg to two decimal places.', a: f2(s13) + ' m', work: '√(2.6² − 1.4²) = √' + n(L.round(2.6 * 2.6 - 1.4 * 1.4, 4)), lines: 3 }),
      B.prob({ q: 'Legs of 14″ and 19″. Find the hypotenuse to the nearest 1/16″.', a: L.inch(s14, 16) + ' (' + f3(s14) + '″)', work: '√(196 + 361) = √557', lines: 3 }),
      B.prob({ q: 'Do 8, 15 and 17 make a right triangle? Show the check.', a: 'Yes. 64 + 225 = 289 = 17²', lines: 3 }),
      B.prob({ q: 'Do 6, 9 and 11 make a right triangle? Show the check.', a: 'No. 36 + 81 = 117, but 11² = 121', lines: 3 }),
      B.prob({ q: 'A rectangle is 1,100 mm by 600 mm. Find the diagonal to the nearest millimetre.', a: n(Math.round(s17)) + ' mm (' + f2(s17) + ' mm)', lines: 3 }),
      B.prob({ q: 'A square has 450 mm sides. Find the diagonal to two decimal places.', a: f2(s18) + ' mm', work: '450 × √2', lines: 3 })
    ),
    B.check('( 350 x² + 480 x² ) √x', f2(s11)),
    B.check('( 2.6 x² − 1.4 x² ) √x', f2(s13)),
    B.check('( 14 x² + 19 x² ) √x', f3(s14)),
    B.check('( 1100 x² + 600 x² ) √x', f2(s17)),
    B.check('450 × 2 √x =', f2(s18)),

    B.worksheet({ title: 'Shop problems', sub: 'Layout, bracing and squaring in the shop. Metric and imperial.' }),
    B.prob({ q: 'A pump flange has 12 bolt holes evenly spaced on its bolt circle. What is the angle between neighbouring holes? What is the angle at the centre from hole 1 to hole 4?', a: n(360 / 12) + '° between neighbours. Hole 1 to hole 4 is 3 spaces: ' + n(3 * 360 / 12) + '°', lines: 4 }),
    B.prob({ q: 'A flat bar is bent so that one side of the bend makes 142° with the straight part. What angle is on the other side of the bend? Is it acute or obtuse?', a: n(180 - 142) + '°, acute', lines: 4 }),
    B.prob({ q: 'A corner brace on a machine stand runs from a point 450 mm up the leg to a point 600 mm along the rail. Both points are measured from the inside corner. How long is the brace, centre line to centre line? Two braces are cut from one bar with two cuts, 3 mm kerf each. How much bar do they use?', a: n(hyp(450, 600)) + ' mm each. Two braces and two cuts: 2 × 750 + 2 × 3 = ' + n(2 * hyp(450, 600) + 6) + ' mm', work: '√(450² + 600²) = √562,500 = 750', lines: 4 }),
    B.prob({ q: 'You square up a skid on the floor. You mark 1.2 m along one side and 1.6 m along the other. The tape reads 1.998 m between the marks. What should it read? Is the corner open or closed?', a: 'It should read ' + n(hyp(1.2, 1.6)) + ' m. At 1.998 m it is closed, less than 90°.', lines: 4 }),
    B.prob({ q: 'A pipe rack frame is 3,000 mm by 1,800 mm. The diagonals measure 3,505 mm and 3,492 mm. What should each diagonal measure, to the nearest millimetre? Which two corners do you push toward each other?', a: n(Math.round(rack)) + ' mm each (' + f2(rack) + ' mm). Push the two corners at the ends of the 3,505 mm diagonal.', work: '√(3,000² + 1,800²) = √12,240,000', lines: 4 }),
    B.check('( 3000 x² + 1800 x² ) √x', f2(rack)),
    B.prob({ q: 'A sloped support covers 2,250 mm along the floor and rises 800 mm. How long is it, to two decimal places?', a: f2(cv) + ' mm', work: '√(2,250² + 800²) = √' + n(2250 * 2250 + 800 * 800), lines: 4 }),
    B.check('( 2250 x² + 800 x² ) √x', f2(cv)),
    B.prob({ q: 'A gate frame is 4′ 0″ wide and 6′ 6″ tall. Find the length of the diagonal brace, corner to corner, to the nearest 1/16″. Give it in feet and inches.', a: L.inch(gate, 16) + ', which is ' + L.ftin(gate, 16), work: '48″ and 78″: √(2,304 + 6,084) = √8,388 = ' + f3(gate) + '″', lines: 4 }),
    B.check('( 48 x² + 78 x² ) √x', f3(gate)),
    B.prob({ q: 'A guard is bent from one bar into a right triangle. The two short sides are 18″ and 24″. How long is the bar before bending? Ignore the bends.', a: '18 + 24 + 30 = ' + n(18 + 24 + hyp(18, 24)) + '″', work: 'Hypotenuse √(18² + 24²) = 30″', lines: 4 }),
    B.prob({ q: 'A three-arm bracket has its arms evenly spaced around a hub. What is the angle between arms? If one arm is moved so one of the angles next to it is 100°, what are the other two angles?', a: n(360 / 3) + '° evenly spaced. The two arms that did not move keep ' + n(360 / 3) + '° between them, and the third angle is 360 − 100 − ' + n(360 / 3) + ' = ' + n(360 - 100 - 360 / 3) + '°. The other two angles are ' + n(360 / 3) + '° and ' + n(360 - 100 - 360 / 3) + '°.', lines: 4 }),

    B.worksheet({ title: 'Shape Canvas', sub: 'Find every red ?. Break it down where the drawing shows a dashed line.' }),
    B.grid2(
      B.prob({ q: 'Find the hypotenuse.', canvas: g(G.auto(() => G.rt(360, 150, { sides: [{ a: 'R', b: 'A', lab: '360 mm', dim: true, s: 20 }, { a: 'R', b: 'B', lab: '150 mm', dim: true, s: 20, off: 54 }, { a: 'A', b: 'B', ask: true, off: 30 }], W: 440, H: 230, pad: 80, padX: 130, max: '2.5in' }), 2.7)), a: n(hyp(360, 150)) + ' mm', lines: 2 }),
      B.prob({ q: 'Find the missing leg.', canvas: g(G.auto(() => G.rt(2, 1.5, { sides: [{ a: 'R', b: 'A', lab: '2 m', dim: true, s: 20 }, { a: 'R', b: 'B', ask: true, dim: true, off: 36 }, { a: 'A', b: 'B', lab: '2.5 m', s: 20, off: 44 }], W: 400, H: 250, pad: 80, padX: 110, max: '2.4in' }), 2.7)), a: n(leg(2.5, 2)) + ' m', lines: 2 }),
      B.prob({ q: 'Find the third angle.', canvas: g(triFig(41, 77, 'T')), a: n(180 - 41 - 77) + '°', lines: 2 }),
      B.prob({ q: 'Find the ?', canvas: g(around([105, 120, 135], 1, 30)), a: n(360 - 105 - 135) + '°', lines: 2 }),
      B.prob({ q: 'Find the ? on the bent strap.', canvas: g(lineAngle(57, false)), a: n(180 - 123) + '°', lines: 2 }),
      B.prob({ q: 'Find the diagonal of the frame.', canvas: g(G.frameDiag(1500, 800, { l: '1,500 mm', w: '800 mm', askD: true, both: false, W: 280, max: '2.5in' })), a: n(hyp(1500, 800)) + ' mm', lines: 2 })
    ),
    B.prob({ q: 'Change one value. A 300-400-500 triangle has its 300 mm leg made 600 mm long. The other leg stays 400 mm. Find the new hypotenuse to two decimal places. Did it double?', a: f2(hyp(600, 400)) + ' mm. No, it did not double.', lines: 2 }),
    B.check('( 600 x² + 400 x² ) √x', f2(hyp(600, 400))),
    B.grid2(
      B.prob({ q: 'Break it down. The dashed line splits the plate into rectangle A and right triangle B. Find the legs of triangle B, then the sloped edge to two decimal places.', canvas: g(G.auto(() => slopedPlate(900, 600, 300), 2.7)), a: 'Legs 900 mm and 600 − 300 = 300 mm. Sloped edge √(900² + 300²) = ' + f2(plateB) + ' mm', lines: 3 }),
      B.prob({ q: 'Break it down. A cube has 500 mm edges. Find the diagonal of one face. Then use it and an edge as legs to find the longest rod that fits inside, corner to corner. Two decimal places.', canvas: g(B.shape('cube', { s: 500 }, { units: 'mm', width: '2.2in' })), a: 'Face diagonal ' + f2(500 * Math.SQRT2) + ' mm. Rod √(' + f2(500 * Math.SQRT2) + '² + 500²) = ' + f2(500 * Math.sqrt(3)) + ' mm', lines: 3 })
    ),
    B.check('( 900 x² + 300 x² ) √x', f2(plateB)),
    B.check('( 500 x² + 500 x² + 500 x² ) √x', f2(500 * Math.sqrt(3)))
  ])
}
