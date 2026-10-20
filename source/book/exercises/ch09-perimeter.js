/* Exercise Book, Chapter 9: Perimeter and Circumference */
module.exports = function (B, L) {
  const G8 = require('../engine/figs-ch08.js');
  const G = require('../engine/figs-ch09.js');
  const { SH } = G8.shapers(B);
  const n = L.num, R = L.round, m = L.m, PI = Math.PI;
  const d2 = x => n(R(x, 2), 2);
  const P = (q, a, o) => B.prob(Object.assign({ q, a, lines: 2 }, o || {}));
  const row = (a, b) => B.grid2(a, b);
  const P3 = (q, a, o) => P(q, a, Object.assign({ lines: 3 }, o || {}));
  const side2 = (a, b) => '<div style="display:flex;justify-content:center;align-items:center;gap:14pt">' + a + b + '</div>';

  /* BCBC 2024 wording quoted in set 9K, checked against the code text */
  const PL = require('../engine/plates.js');
  const pg = num => PL.article(num).page;
  const q3 = 'in all non-loadbearing walls';
  [['9.23.11.2', 'A bottom wall plate shall be provided in all cases.'], ['9.23.11.3', 'at least 2 top plates shall be provided in loadbearing walls'], ['9.23.11.3', q3]].forEach(([a, q]) => {
    if (!PL.article(a).text.replace(/\s+/g, ' ').includes(q)) throw new Error('BCBC ' + a + ': quote not found')
  });

  const jacket = PI * 10.75;
  const band = PI * 1850 + 150;
  const duct = PI * 355 + 25;

  return L.join([
    B.exChapter({ num: 9, id: 'perimeter', title: 'Perimeter and Circumference', intro: 'Practice finding the distance around straight-sided shapes and circles, the stretch-out of pipes and ducts, arcs and composite shapes. The distance around a circle is always π × D.' }),

    B.worksheet({ title: 'Skills', sub: 'Perimeter, parts of a circle, circumference and arcs' }),
    row(P3('Find the perimeter of a rectangle 2,400 mm by 1,150 mm.', n(2 * (2400 + 1150)) + ' mm'), P3('Find the perimeter of a square with sides of 75 cm.', (4 * 75) + ' cm')),
    row(P3('A triangle has sides of 0.8 m, 1.1 m and 1.3 m. Find the perimeter.', n(R(0.8 + 1.1 + 1.3, 2)) + ' m'), P3('A regular pentagon has sides of 90 mm. Find the perimeter.', (5 * 90) + ' mm')),
    row(P3('A regular octagon has sides of 45 in. Find the perimeter in feet.', (8 * 45) + ' in = ' + (8 * 45 / 12) + ' ft'), P3('Find the perimeter of a rectangle 15' + L.fr(3, 4) + ' in by 9' + L.fr(5, 8) + ' in.', '50' + L.fr(3, 4) + ' in', { work: '2 × (15 6/8 + 9 5/8) = 2 × 25 3/8' })),
    row(P3('Find the perimeter of a rectangle 9 ft 3 in by 5 ft 10 in, in feet and inches.', '2 × (111 + 70) = 362 in = ' + L.ftin(362)), P3('A rectangle has a perimeter of 3,800 mm and a length of 1,200 mm. Find the width.', n(3800 / 2 - 1200) + ' mm')),
    row(P3('A circle has a diameter of 273 mm. Find the radius.', n(273 / 2) + ' mm'), P3('A circle has a radius of 82.5 mm. Find the diameter.', n(2 * 82.5) + ' mm')),
    row(P3('D = 380 mm. Find C to two decimal places.', d2(PI * 380) + ' mm'), P3('r = 95 mm. Find C to two decimal places.', d2(PI * 190) + ' mm')),
    row(P3('C = 1,500 mm. Find D to two decimal places.', d2(1500 / PI) + ' mm'), P3('D = 14 in. Find C to the nearest 1/16 in.', L.inch(PI * 14, 16))),
    row(P3('Find the length of a 45° arc of a circle with D = 800 mm. Round to two decimal places.', d2(45 / 360 * PI * 800) + ' mm'), P3('Find the length of a 150° arc of a circle with r = 600 mm. Round to two decimal places.', d2(150 / 360 * PI * 1200) + ' mm')),
    row(P3('Find the curved edge of a half circle with D = 640 mm, to two decimal places.', d2(PI * 640 / 2) + ' mm'), P3('A circle has its diameter cut in half. What happens to its circumference?', 'It is cut in half too.')),

    B.worksheet({ title: 'Shop problems', sub: 'Fabrication, pipe trades and millwright' }),
    row(P('A frame of angle iron is 2 ft 6 in by 1 ft 9 in. How much angle iron goes around it? Give feet and inches.', '2 × (30 + 21) = 102 in = ' + L.ftin(102), { lines: 4 }),
      P('A steel band goes once around a tank 1,850 mm in diameter, with 150 mm extra for the overlap. Find the band length to the nearest millimetre.', n(Math.round(band)) + ' mm', { lines: 4, work: 'π × 1,850 + 150 = ' + d2(band) })),
    row(P('A round duct is 355 mm in diameter. The drawing adds 25 mm to the stretch-out for the seam. Find the cut length to the nearest millimetre.', n(Math.round(duct)) + ' mm', { lines: 4, work: 'π × 355 + 25 = ' + d2(duct) }),
      P('An insulation jacket wraps a pipe with an outside diameter of 10' + L.fr(3, 4) + ' in. Find the stretch-out to the nearest 1/16 in.', L.inch(jacket, 16), { lines: 4, work: 'π × 10.75 = ' + n(R(jacket, 3), 3) + ' in, ' + n(R(jacket - 33, 3), 3) + ' × 16 = ' + d2(R(jacket - 33, 3) * 16) })),
    row(P('A pulley 250 mm in diameter turns 1,450 times. How far does a point on its rim travel, in metres to two decimal places?', d2(1450 * PI * 250 / 1000) + ' m', { lines: 4, work: '1,450 × π × 250 ÷ 1,000' }),
      P('A cart wheel is 24 in in diameter. How many turns does it make in 100 ft? Round to two decimal places.', d2(1200 / (PI * 24)) + ' turns', { lines: 4, work: '100 ft = 1,200 in, 1,200 ÷ (π × 24)' })),
    row(P('A fillet weld runs once around a pipe with an outside diameter of 168.3 mm. How long is the weld, to two decimal places?', d2(PI * 168.3) + ' mm', { lines: 4 }),
      P('A tape wrapped around a round column reads 2,042 mm. Find the diameter to the nearest millimetre.', n(Math.round(2042 / PI)) + ' mm', { lines: 4, work: '2,042 ÷ π = ' + d2(2042 / PI) })),
    row(P('Four guard frames, each 1,200 mm by 800 mm, are cut from 6,000 mm lengths of flat bar. Ignore saw cuts. How much bar is needed, and how many 6,000 mm lengths must be ordered?', n(4 * 2 * 2000) + ' mm, so 3 lengths (2 lengths hold only 12,000 mm)', { lines: 5 }),
      P('A handrail follows a 90° arc of a circle with a 1,500 mm radius. How long is the rail, to two decimal places?', d2(90 / 360 * PI * 3000) + ' mm', { lines: 5, work: '90 ÷ 360 × π × 3,000' })),
    P('A belt runs around two pulleys, each 300 mm in diameter, with centres 1,100 mm apart. The pulleys are moved 150 mm farther apart. Find the belt length before and after. How much longer is the new belt? Round to two decimal places.', 'Before ' + d2(2200 + PI * 300) + ' mm, after ' + d2(2500 + PI * 300) + ' mm, 300 mm longer (each straight run grows by 150 mm).', { lines: 5 }),
    row(P('A round tank lid is 1,220 mm in diameter. A rubber gasket goes once around its edge, with 40 mm extra for the joint. Find the gasket length to two decimal places.', d2(PI * 1220 + 40) + ' mm', { lines: 4, work: 'π × 1,220 + 40' }),
      P('A rectangular duct is 600 mm by 400 mm. A strip of insulation wraps once around it with a 50 mm overlap. How long must the strip be?', n(2 * (600 + 400) + 50) + ' mm', { lines: 4, work: '2 × (600 + 400) + 50' })),

    B.worksheet({ title: 'Shape Canvas', sub: 'Find every ?, break it down, unfold it. Round answers to two decimal places.' }),
    row(P('The perimeter is 5,600 mm. Find the length.', n(5600 / 2 - 900) + ' mm', { lines: 3, canvas: SH('rectangle', { l: 1900, w: 900 }, { hide: ['l'], width: '1.7in' }) }),
      P('Find the perimeter. The dashed line is the height, not an edge.', (20 + 16 + 15) + ' cm', { lines: 3, canvas: SH('scalene-triangle', { a: 20, b: 16, c: 15 }, { units: 'cm', angles: true, derived: 'show', width: '2.2in' }) })),
    row(P('Unfold it. Find the stretch-out marked ?.', 'π × 500 = ' + d2(PI * 500) + ' mm', { lines: 3, canvas: side2(G8.cyl3d(250, 800, 'mm', { max: '0.85in' }), G8.cylNet(250, 800, 'mm', { askS: true, max: '1.6in' })) }),
      P('Find the length of the arc marked ?.', '120 ÷ 360 × π × 700 = ' + d2(120 / 360 * PI * 700) + ' mm', { lines: 3, canvas: G.sectorFig(350, 120, 'mm', { askL: true, max: '1.3in' }) })),
    row(P('Break it down: the plate has a half circle on each end. Find its perimeter.', '2 × 600 + π × 250 = ' + d2(1200 + PI * 250) + ' mm', { lines: 3, canvas: G.rectSemi(600, 250, { both: true, split: true, max: '2.1in' }) }),
      P('Each corner is a quarter circle. Find the perimeter of the plate.', '2 × 780 + 2 × 280 + π × 120 = ' + d2(1560 + 560 + PI * 120) + ' mm', { lines: 3, work: 'Straight edges 900 − 2 × 60 = 780 and 400 − 2 × 60 = 280. Four quarter circles make one circle, D = 120', canvas: G.roundedPlate(900, 400, 60, { split: true, max: '1.7in' }) })),
    row(P('The belt is 2,400 mm long. Find the centre distance marked ?.', d2((2400 - PI * 200) / 2) + ' mm', { lines: 3, work: 'c = (L − π × D) ÷ 2', canvas: G.belt(200, (2400 - PI * 200) / 2, { askC: true, max: '2.2in' }) }),
      P('Change one value: the outside of the washer is kept, but the hole is made 10 mm bigger across. Find the new total length of both edges.', 'π × 140 + π × 80 = ' + d2(PI * 220) + ' mm (was ' + d2(PI * 210) + ' mm)', { lines: 3, canvas: G8.washer(70, 35, 'mm', { max: '1.15in' }) })),

    /* Set 9K: the set letter K is kept for the Carpentry sets in every chapter */
    (() => { B.wsN = 10; return ''; })(),
    B.worksheet({ title: 'Carpentry and the BCBC', sub: 'Wall plates (BCBC 2024, Division B, Articles 9.23.11.2 and 9.23.11.3), rim joists, fascia and trim' }),
    row(P('A loadbearing wall 7,320 mm long has one bottom plate and two top plates (Sentences 9.23.11.2.(1), page ' + pg('9.23.11.2') + ', and 9.23.11.3.(1), page ' + pg('9.23.11.3') + '). How much plate is in the wall?', n(3 * 7320) + ' mm', { lines: 3 }),
      P('Sentence 9.23.11.3.(3) permits a single top plate "' + q3 + '". A non-loadbearing wall 3,050 mm long has one bottom plate and one top plate. How much plate is that?', n(2 * 3050) + ' mm', { lines: 3 })),
    row(P('The outside walls of a house are 14,640 mm by 9,760 mm. All are loadbearing with one bottom and two top plates. Using the outside perimeter and ignoring openings, find the plate needed and the number of 4,880 mm lengths.', n(3 * 2 * (14640 + 9760)) + ' mm, ' + n(3 * 2 * (14640 + 9760) / 4880) + ' lengths', { lines: 4, work: 'P = 2 × (14,640 + 9,760) = ' + n(2 * (14640 + 9760)) + ', × 3, ÷ 4,880' }),
      P('A floor frame is 10,980 mm by 7,930 mm. Find the total length of rim joist. How many 3,660 mm lengths are needed, ignoring joints?', n(2 * (10980 + 7930)) + ' mm, ' + Math.ceil(2 * (10980 + 7930) / 3660) + ' lengths (' + d2(2 * (10980 + 7930) / 3660) + ' rounded up)', { lines: 4 })),
    row(P('Walls are 12,000 mm by 8,000 mm. The hip roof overhangs 600 mm on every side, with fascia on all four edges. Find the length of fascia.', n(2 * (13200 + 9200)) + ' mm', { lines: 4, work: '2 × (12,000 + 1,200 + 8,000 + 1,200)' }),
      P('Walls are 36 ft by 24 ft. The hip roof overhangs 18 in on every side. Find the length of fascia in feet.', 2 * (39 + 27) + ' ft', { lines: 4, work: '18 in = 1.5 ft. 2 × (36 + 3 + 24 + 3)' })),
    row(P('A room is 4,270 mm by 3,660 mm. Baseboard runs around it except across a door opening 860 mm wide and a closet opening 1,520 mm wide. How much baseboard is needed?', n(2 * (4270 + 3660) - 860 - 1520) + ' mm', { lines: 4 }),
      P('A room is 13 ft 4 in by 10 ft 8 in with one door opening 30 in wide. How much baseboard is needed? Give feet and inches.', 2 * (160 + 128) - 30 + ' in = ' + L.ftin(2 * (160 + 128) - 30), { lines: 4 })),
    row(P('Window casing is measured around its outside edge, 1,370 mm by 1,060 mm. How much casing goes around the window?', n(2 * (1370 + 1060)) + ' mm', { lines: 3 }),
      P('Change one value: the house in problem 3 is made 1,220 mm longer. How much more plate is needed?', n(3 * 2 * 1220) + ' mm more (3 plates × 2 walls × 1,220 mm)', { lines: 3 })),
    row(P('The walls are 9,000 mm by 6,000 mm and the fascia around the roof is 33,600 mm long. Find the overhang marked ?.', n((33600 / 2 - 15000) / 4) + ' mm', { lines: 4, mode: 'Practice: find the ?', work: '33,600 ÷ 2 = 16,800. 16,800 − (9,000 + 6,000) = 1,800, shared by 4 overhangs', canvas: G.roofPlan(9000, 6000, 450, { L: '9,000 mm', W: '6,000 mm', ov: '?', max: '2.4in' }) }),
      P('Find the length of baseboard for the room. The door opening is not covered.', n(2 * (4880 + 3660) - 910) + ' mm', { lines: 4, canvas: G.roomPlan({ l: '4,880 mm', w: '3,660 mm', d: '910 mm' }, { ratio: 4880 / 3660, door: 910 / 4880, max: '2.4in' }) })),
    B.check('3 × 2 × ( 14640 + 9760 ) ÷ 4880 =', n(3 * 2 * (14640 + 9760) / 4880)),
    B.check('2 × ( 10980 + 7930 ) ÷ 3660 =', d2(2 * (10980 + 7930) / 3660)),
    B.check('2 × ( 13200 + 9200 ) =', n(2 * (13200 + 9200))),
    B.check('2 × ( 4270 + 3660 ) − 860 − 1520 =', n(2 * (4270 + 3660) - 860 - 1520)),
    B.check('( 33600 ÷ 2 − 15000 ) ÷ 4 =', n((33600 / 2 - 15000) / 4)),
    B.check('2 × ( 4880 + 3660 ) − 910 =', n(2 * (4880 + 3660) - 910)),
    B.check('π × 380 =', d2(PI * 380)),
    B.check('π × 190 =', d2(PI * 190)),
    B.check('1500 ÷ π =', d2(1500 / PI)),
    B.check('45 ÷ 360 × π × 800 =', d2(45 / 360 * PI * 800)),
    B.check('150 ÷ 360 × π × 1200 =', d2(150 / 360 * PI * 1200)),
    B.check('π × 640 ÷ 2 =', d2(PI * 320)),
    B.check('2 × ( 15 ab/c 3 ab/c 4 + 9 ab/c 5 ab/c 8 ) =', '50.75'),
    B.check('π × 1850 + 150 =', d2(band)),
    B.check('π × 355 + 25 =', d2(duct)),
    B.check('π × 10.75 =', n(R(jacket, 3), 3)),
    B.check('1450 × π × 250 ÷ 1000 =', d2(1450 * PI * 250 / 1000)),
    B.check('1200 ÷ ( π × 24 ) =', d2(1200 / (PI * 24))),
    B.check('π × 168.3 =', d2(PI * 168.3)),
    B.check('2042 ÷ π =', d2(2042 / PI)),
    B.check('90 ÷ 360 × π × 3000 =', d2(90 / 360 * PI * 3000)),
    B.check('2 × 1100 + π × 300 =', d2(2200 + PI * 300)),
    B.check('2 × 1250 + π × 300 =', d2(2500 + PI * 300)),
    B.check('π × 500 =', d2(PI * 500)),
    B.check('120 ÷ 360 × π × 700 =', d2(120 / 360 * PI * 700)),
    B.check('2 × 600 + π × 250 =', d2(1200 + PI * 250)),
    B.check('( 2400 − π × 200 ) ÷ 2 =', d2((2400 - PI * 200) / 2)),
    B.check('π × 140 + π × 80 =', d2(PI * 220)),
    B.check('2 × 780 + 2 × 280 + π × 120 =', d2(1560 + 560 + PI * 120)),
    B.check('π × 210 =', d2(PI * 210)),
    B.check('π × 1220 + 40 =', d2(PI * 1220 + 40))
  ]);
};
