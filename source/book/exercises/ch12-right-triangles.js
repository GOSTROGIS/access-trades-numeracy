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
    B.check('( 500 x² + 500 x² + 500 x² ) √x', f2(500 * Math.sqrt(3))),

    /* ---------- 12D Angles and DMS ---------- */
    B.worksheet({ title: 'Angles and DMS', sub: 'Angle pairs, parallel lines, and degrees, minutes and seconds.' }),
    B.grid2(
      B.prob({ q: 'Find the complement of 34°.', a: n(90 - 34) + '°', lines: 2 }),
      B.prob({ q: 'Find the supplement of 117°.', a: n(180 - 117) + '°', lines: 2 }),
      B.prob({ q: 'Two lines cross. Find each ?', canvas: g(G.auto(() => G.crossLines(47, ['47°', '?', '?', '?'], { max: '1.45in' }), 2.7)), a: n(180 - 47) + '°, 47° and ' + n(180 - 47) + '° (going round from the 47° angle)', lines: 2 }),
      B.prob({ q: 'The two level lines are parallel. Angle a is 64°. Find angles d, e and f.', canvas: g(G.auto(() => G.transversal(64, ['64°', 'b', 'c', 'd'], ['e', 'f', 'g', 'h'], { max: '1.8in', W: 380 }), 2.7)), a: 'd = ' + n(180 - 64) + '°, e = 64°, f = ' + n(180 - 64) + '°', lines: 2 }),
      B.prob({ q: 'A brace crosses two parallel rails. One alternate angle between the rails is 58°. What is the other?', a: '58°', lines: 2 }),
      B.prob({ q: 'A brace crosses two parallel rails. One co-interior angle is 109°. What is the other?', a: n(180 - 109) + '°', lines: 2 }),
      B.prob({ q: 'Change 52°18′ to decimal degrees.', a: n(G.dd(52, 18, 0)) + '°', lines: 4 }),
      B.prob({ q: 'Change 19°44′24″ to decimal degrees.', a: n(L.round(G.dd(19, 44, 24), 6)) + '°', lines: 4 }),
      B.prob({ q: 'Change 28.65° to degrees, minutes and seconds.', a: G.dmsText(28.65), lines: 4 }),
      B.prob({ q: 'Change 71.2525° to degrees, minutes and seconds.', a: G.dmsText(71.2525), work: '0.2525 × 60 = 15.15′, 0.15 × 60 = 9″', lines: 4 }),
      B.prob({ q: 'Add 33°27′48″ + 41°50′35″.', a: G.dmsText(G.dd(33, 27, 48) + G.dd(41, 50, 35)), work: '74°77′83″ = 74°78′23″ = 75°18′23″', lines: 4 }),
      B.prob({ q: 'Find 180° − 96°42′15″.', a: G.dmsText(180 - G.dd(96, 42, 15)), work: '179°59′60″ − 96°42′15″', lines: 4 })
    ),
    B.check('52.18 DMS▸DD', n(G.dd(52, 18, 0))),
    B.check('19.4424 DMS▸DD', n(L.round(G.dd(19, 44, 24), 6))),
    B.check('28.65 DD▸DMS', '28.65'),
    B.check('71.2525 DD▸DMS', '71.2525'),
    B.check('33.2748 DMS▸DD + 41.5035 DMS▸DD = DD▸DMS', n(L.round(G.dd(33, 27, 48) + G.dd(41, 50, 35), 4))),
    B.check('180 − 96.4215 DMS▸DD = DD▸DMS', n(L.round(180 - G.dd(96, 42, 15), 4))),

    /* ---------- 12E Stairs ---------- */
    B.worksheet({ title: 'Stairs', sub: 'Risers, treads, total rise and run, and the stringer line.' }),
    B.prob({ q: 'A stair has 15 risers of 188 mm and 14 treads with a 270 mm unit run. Find the total rise, the total run and the stringer line to two decimal places.', a: 'Total rise ' + n(15 * 188) + ' mm, total run ' + n(14 * 270) + ' mm, stringer line ' + f2(hyp(15 * 188, 14 * 270)) + ' mm', work: '√(2,820² + 3,780²)', lines: 3 }),
    B.prob({ q: 'A private stair has a total rise of 2,560 mm. Use the 200 mm maximum rise to find the number of risers, then the unit rise to two decimal places.', a: Math.ceil(2560 / 200) + ' risers of ' + f2(2560 / Math.ceil(2560 / 200)) + ' mm', work: '2,560 ÷ 200 = 12.8, round up to 13. 2,560 ÷ 13', lines: 3 }),
    B.prob({ q: 'A public stair has a total rise of 2,880 mm. Using the 180 mm maximum rise and the 280 mm minimum run, find the number of risers, the number of treads, the total run and the stringer line to two decimal places.', a: '16 risers of 180 mm, 15 treads, total run ' + n(15 * 280) + ' mm, stringer line ' + f2(hyp(2880, 4200)) + ' mm', work: '2,880 ÷ 180 = 16. 15 × 280 = 4,200. √(2,880² + 4,200²)', lines: 3 }),
    B.prob({ q: 'A stair has 8 risers of ' + L.mx(7, 3, 8) + '″ and 7 treads of ' + L.mx(10, 1, 4) + '″. Find the total rise, the total run and the stringer line to the nearest 1/16″.', a: 'Total rise ' + n(8 * 7.375) + '″, total run ' + n(7 * 10.25) + '″, stringer line ' + L.inch(hyp(59, 71.75), 16) + ' (' + L.ftin(hyp(59, 71.75), 16) + ')', work: '√(59² + 71.75²) = ' + f3(hyp(59, 71.75)) + '″', lines: 3 }),
    B.prob({ q: 'The risers of one flight measure 182, 185, 183, 187, 190 and 186 mm. Do they meet Article 9.8.4.4, Sentence (1): 5 mm between adjacent risers and 10 mm between the tallest and shortest?', a: 'Yes. The largest step between neighbours is 4 mm, and 190 − 182 = 8 mm.', lines: 3 }),
    B.prob({ q: 'The tread runs of one flight measure 265, 268, 262, 271 and 266 mm. Do they meet Article 9.8.4.4, Sentence (3)?', a: 'No. 268 mm to 262 mm is 6 mm and 262 mm to 271 mm is 9 mm between adjacent treads (5 mm allowed). The 10 mm check passes: 271 − 262 = 9 mm.', lines: 3 }),
    B.prob({ q: 'A rectangular tread has a run of 255 mm and a depth of 290 mm. Does it meet Sentence 9.8.4.2.(2)? What is the largest depth allowed?', a: 'No. The depth may be at most 255 + 25 = 280 mm.', lines: 2 }),
    B.prob({ q: 'Find the stringer line, bottom corner to top corner, to two decimal places.', canvas: full(G.auto(() => G.stairSide(7, 190, 260, { lab: { totalRise: '1,330 mm', totalRun: '1,560 mm', stringer: '?' }, max: '3.4in' }), 6)), a: f2(hyp(1330, 1560)) + ' mm', lines: 2 }),
    B.check('( 2820 x² + 3780 x² ) √x', f2(hyp(2820, 3780))),
    B.check('2560 ÷ 13 =', f2(2560 / 13)),
    B.check('( 2880 x² + 4200 x² ) √x', f2(hyp(2880, 4200))),
    B.check('( 59 x² + 71.75 x² ) √x', f3(hyp(59, 71.75))),
    B.check('( 1330 x² + 1560 x² ) √x', f2(hyp(1330, 1560))),

    /* ---------- 12K Carpentry and the BCBC ---------- */
    (() => { B.wsN = 10; return '' })(),
    B.worksheet({ title: 'Carpentry and the BCBC', sub: 'Rafters, layout and stairs. Code values are from the BC Building Code 2024, Division B.' }),
    B.prob({ q: 'A building is 8,400 mm wide with the ridge in the middle and a 6 in 12 roof. Find the run, the rise and the rafter line length to two decimal places.', a: 'Run 4,200 mm, rise 2,100 mm, rafter line ' + f2(hyp(4200, 2100)) + ' mm', work: '4,200 × 6 ÷ 12 = 2,100. √(4,200² + 2,100²)', lines: 3 }),
    B.prob({ q: 'A 4 in 12 roof has a rafter run of 13′ 0″. Find the rise and the rafter line length to the nearest 1/16″.', a: 'Rise 52″, rafter line ' + L.inch(hyp(156, 52), 16) + ' (' + L.ftin(hyp(156, 52), 16) + ')', work: '156 × 4 ÷ 12 = 52. √(156² + 52²) = ' + f3(hyp(156, 52)) + '″', lines: 3 }),
    B.prob({ q: 'Find the length per foot of run of a 9 in 12 roof. Use it to find the rafter line length for a 10′ run, in feet and inches.', a: n(hyp(12, 9)) + '″ per foot. 10 × 15 = 150″ = ' + L.ftin(150, 16), lines: 3 }),
    B.prob({ q: 'A deck frame is 4.2 m by 3.0 m. What should each diagonal measure, to the nearest millimetre?', a: n(Math.round(hyp(4200, 3000))) + ' mm (' + f2(hyp(4200, 3000)) + ' mm)', lines: 2 }),
    B.prob({ q: 'You square a wall layout with 3-4-5 using 900 mm as the unit. Where are the two marks, and how far apart should they be?', a: '2,700 mm and 3,600 mm from the corner, ' + n(hyp(2700, 3600)) + ' mm apart', lines: 2 }),
    B.prob({ q: 'A wall layout is 7,800 mm by 3,000 mm. The diagonals measure 8,362 mm and 8,349 mm. What should they be, to the nearest millimetre? Which corners do you move?', a: n(Math.round(hyp(7800, 3000))) + ' mm. Push the two corners at the ends of the 8,362 mm diagonal toward each other.', lines: 3 }),
    B.prob({ q: 'A private stair has a total rise of 2,450 mm. Using the 200 mm maximum rise in Table 9.8.4.1 (Article 9.8.4.1, page 9-31), find the number of risers and the unit rise to two decimal places. Is the unit rise above the 125 mm minimum?', a: Math.ceil(2450 / 200) + ' risers of ' + f2(2450 / 13) + ' mm. Yes.', work: '2,450 ÷ 200 = 12.25, round up to 13', lines: 3 }),
    B.prob({ q: 'A public stair is drawn with a unit rise of 185 mm. Does it meet Table 9.8.4.1 (page 9-31)? For a total rise of 2,700 mm, how many risers does it need at the public stair maximum?', a: 'No, the public maximum is 180 mm. 2,700 ÷ 180 = ' + n(2700 / 180) + ' risers of 180 mm.', lines: 3 }),
    B.prob({ q: 'Measured straight up from the nosing line, a beam is 1,980 mm above a stair. Article 9.8.2.2 (page 9-30) asks for 2,050 mm, or 1,950 mm over stairs serving a single dwelling unit or a house with a secondary suite. Is the clear height enough for a stair in a house? For a public stair?', a: 'Yes in a house (1,980 ≥ 1,950). No for a public stair (1,980 < 2,050).', lines: 3 }),
    B.prob({ q: 'The risers of a flight measure 192, 196, 193, 199 and 195 mm. Do they meet Article 9.8.4.4, Sentence (1) (page 9-32)?', a: 'No. 193 mm to 199 mm is 6 mm between adjacent risers (5 mm allowed). The tallest and shortest differ by 7 mm, which is inside 10 mm.', lines: 3 }),
    B.prob({ q: 'A building is 6,000 mm wide with the ridge in the middle and a 4 in 12 roof. Find each ? to two decimal places.', canvas: full(G.auto(() => G.gable(6000, 1000, { lab: { span: '6,000 mm', run: '?', rise: '?', rafter: '?' }, slope: [4, 12], max: '3.4in' }), 6)), a: 'Run 3,000 mm, rise 1,000 mm, rafter line ' + f2(hyp(3000, 1000)) + ' mm', lines: 3 }),
    B.check('( 4200 x² + 2100 x² ) √x', f2(hyp(4200, 2100))),
    B.check('( 156 x² + 52 x² ) √x', f3(hyp(156, 52))),
    B.check('( 4200 x² + 3000 x² ) √x', f2(hyp(4200, 3000))),
    B.check('( 7800 x² + 3000 x² ) √x', f2(hyp(7800, 3000))),
    B.check('2450 ÷ 13 =', f2(2450 / 13)),
    B.check('( 3000 x² + 1000 x² ) √x', f2(hyp(3000, 1000)))
  ])
}
