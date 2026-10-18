/* Exercise Book, Chapter 10: Area. All answers computed here, cross-checked with the Shapes engine where a shape
   exists, and calculator answers checked on both emulators with B.check. */
module.exports = function (B, L) {
  const G = require('../engine/figs-ch10.js')(B, L);
  const { SH, NET, pair, xc } = G;
  const n = L.num;
  const PI = Math.PI;
  const r2 = x => L.round(x, 2);
  /* answer with a calculator check: seq is keyed on both calculators and must give v to dp places */
  function ck(seq, v, dp) { const s = n(L.round(v, dp), dp); B.check(seq, s); return s; }

  /* Set A values */
  const a6 = xc('rectangle', { l: 840, w: 350 }, 'A', 840 * 350);
  const a8 = xc('right-triangle', { b: 520, h: 270 }, 'A', 520 * 270 / 2);
  const a10 = xc('parallelogram', { b: 0.75, h: 0.4, s: 0.5 }, 'A', 0.75 * 0.4);
  const a11 = xc('trapezoid', { a: 250, b: 410, h: 180 }, 'A', (250 + 410) / 2 * 180);
  const a12 = xc('circle', { r: 45 }, 'A', PI * 45 * 45);
  const a13 = xc('circle', { r: 15 }, 'A', PI * 15 * 15);
  const a14 = xc('semicircle', { r: 1.2 }, 'A', PI * 1.44 / 2);
  const a15 = xc('annulus', { R: 60, r: 40 }, 'A', PI * (3600 - 1600));
  const a16 = xc('quarter-circle', { r: 500 }, 'A', PI * 250000 / 4);

  /* Set B values */
  const b2A = 2 * 4 * 2.5 * 1.6, b2L = b2A / 7;
  const b3 = xc('annulus', { R: 170, r: 110 }, 'A', PI * (170 * 170 - 110 * 110));
  const b5 = 450 * 450 - 4 * PI * 11 * 11;
  const b6 = 4 * (1500 + 300) / 2 * 900;
  const b7 = 2 * (18 + 12) * 96;
  const b8c = { r: 0.6, h: 2 }, b8 = xc('cylinder', b8c, 'SA', PI * 0.36 * 2 + PI * 1.2 * 2);
  const b9 = 900 * 600 - PI * 150 * 150 / 2;
  const b10 = PI * 168 * 3000;

  /* Set C values */
  const c3A = 31416, c3r = Math.sqrt(c3A / PI);
  const c4 = 300 * 750 + 700 * 250;
  const c5 = 600 * 300 + 300 * 200 / 2;
  const c6 = 160 * 200 + PI * 80 * 80 / 2 - PI * 20 * 20;
  const c7p = { l: 900, w: 400, h: 250 }, c7 = xc('rectangular-prism', c7p, 'SA', 2 * (900 * 400 + 900 * 250 + 400 * 250));
  const c8p = { r: 150, h: 500 }, c8S = PI * 300, c8 = xc('cylinder', c8p, 'SA', PI * 150 * 150 * 2 + c8S * 500);

  return L.join([
    B.exChapter({ num: 10, id: 'area', title: 'Area', intro: 'Practice with square units, the area formulas for rectangles, triangles, parallelograms, trapezoids, circles and rings, composite shapes and surface area from nets. Use the π key for circles.' }),

    B.worksheet({ title: 'Skills', sub: 'One skill at a time' }),
    B.grid2(
      B.prob({ q: 'A plate drawn on a 1 cm grid covers 5 rows of 9 squares. What is its area?', a: '45 cm²', lines: 4 }),
      B.prob({ q: 'Write 1,500,000 mm² in m².', a: '1.5 m²', lines: 4 })
    ),
    B.grid2(
      B.prob({ q: 'Write 0.08 m² in mm².', a: n(0.08 * 1e6) + ' mm²', lines: 4 }),
      B.prob({ q: 'Write 6 ft² in in². Then write 432 in² in ft².', a: '864 in², 3 ft²', lines: 4 })
    ),
    B.grid2(
      B.prob({ q: 'Find the area of a rectangle 840 mm by 350 mm.', a: n(a6) + ' mm²', lines: 4 }),
      B.prob({ q: 'Find the area of a square with 1.6 m sides.', a: ck('1.6 x² =', 2.56, 2) + ' m²', lines: 4 })
    ),
    B.grid2(
      B.prob({ q: 'Triangle: base 520 mm, height 270 mm. Find the area.', a: n(a8) + ' mm²', lines: 4 }),
      B.prob({ q: 'Triangle: base 15 in, height 7 in. Find the area.', a: ck('15 × 7 ÷ 2 =', 52.5, 1) + ' in²', lines: 4 })
    ),
    B.grid2(
      B.prob({ q: 'Parallelogram: base 0.75 m, slanted side 0.5 m, height 0.4 m. Find the area.', a: n(r2(a10), 1) + ' m²', lines: 4 }),
      B.prob({ q: 'Trapezoid: parallel sides 250 mm and 410 mm, height 180 mm. Find the area.', a: ck('( 250 + 410 ) ÷ 2 × 180 =', a11, 0) + ' mm²', lines: 4 })
    ),
    B.grid2(
      B.prob({ q: 'Circle, radius 45 mm. Find the area to two decimal places.', a: ck('π × 45 x² =', a12, 2) + ' mm²', lines: 4 }),
      B.prob({ q: 'Circle, diameter 30 in. Find the area to two decimal places.', a: ck('π × 15 x² =', a13, 2) + ' in²', work: 'r = 15 in', lines: 4 })
    ),
    B.grid2(
      B.prob({ q: 'Half circle, radius 1.2 m. Find the area to two decimal places.', a: ck('π × 1.2 x² ÷ 2 =', a14, 2) + ' m²', lines: 4 }),
      B.prob({ q: 'Quarter circle, radius 500 mm. Find the area to the nearest mm².', a: ck('π × 500 x² ÷ 4 =', a16, 0) + ' mm²', lines: 4 })
    ),
    B.grid2(
      B.prob({ q: 'Ring: outside diameter 120 mm, inside diameter 80 mm. Find the area to two decimal places.', a: ck('π × ( 60 x² − 40 x² ) =', a15, 2) + ' mm²', work: 'R = 60, r = 40, π × (3,600 − 1,600)', lines: 4 }),
      B.prob({ q: 'A ring has an outside radius of 60 mm and an inside radius of 40 mm. A student finds its area with π × (60 − 40)². Explain the mistake.', a: 'The radii must be squared before subtracting: π × (60² − 40²), not π × (60 − 40)².', lines: 4 })
    ),
    B.grid2(
      B.prob({ q: 'A triangle has an area of 54 in² and a base of 12 in. Find its height.', a: '9 in', work: '54 × 2 ÷ 12', lines: 4 }),
      B.prob({ q: 'Write 2.5 m² in cm². (1 m² = 10,000 cm²)', a: n(2.5 * 1e4) + ' cm²', lines: 4 })
    ),

    B.worksheet({ title: 'Shop problems', sub: 'Area at work, metric and imperial' }),
    B.prob({ q: 'A mezzanine floor is 7.2 m by 3.6 m. It is covered with checker plate sheets that are 1.2 m by 2.4 m, laid edge to edge with no waste. Find the floor area and the number of sheets.', a: n(r2(7.2 * 3.6), 2) + ' m², ' + (7.2 * 3.6 / 2.88).toFixed(0) + ' sheets', work: '7.2 × 3.6 = 25.92 m², one sheet = 2.88 m², 25.92 ÷ 2.88 = 9' + B.check('7.2 × 3.6 ÷ ( 1.2 × 2.4 ) =', '9'), lines: 3 }),
    B.prob({ q: 'Four plates, each 2.5 m by 1.6 m, are primed on both sides. The primer label says 1 L covers 7 m². Primer is sold in 1 L tins. How many tins do you buy? Give the litres to two decimal places.', a: ck('2 × 4 × 2.5 × 1.6 ÷ 7 =', b2L, 2) + ' L, so ' + Math.ceil(b2L) + ' tins', work: 'Area 2 × 4 × 4 = 32 m², 32 ÷ 7', lines: 4 }),
    B.grid2(
      B.prob({ q: 'A full-face gasket is a ring with an outside diameter of 340 mm and an inside diameter of 220 mm. Find the area of gasket material to two decimal places.', a: ck('π × ( 170 x² − 110 x² ) =', b3, 2) + ' mm²', lines: 4 }),
      B.prob({ q: 'A job needs 24 triangular gussets, each with a base of 16 in and a height of 12 in. Find the total area in in² and in ft².', a: n(24 * 96) + ' in² = ' + n(24 * 96 / 144) + ' ft²', work: '16 × 12 ÷ 2 = 96 in² each' + B.check('24 × 16 × 12 ÷ 2 ÷ 144 =', '16'), lines: 4 })
    ),
    B.grid2(
      B.prob({ q: 'A base plate is 450 mm square with four 22 mm diameter bolt holes. Find the area of steel left, to two decimal places.', a: ck('450 x² − 4 × π × 11 x² =', b5, 2) + ' mm²', lines: 4 }),
      B.prob({ q: 'A hopper has four equal trapezoid sides. Each has parallel sides of 1,500 mm and 300 mm, and a height of 900 mm. Find the total area of the four sides in m².', a: ck('4 × ( 1500 + 300 ) ÷ 2 × 900 ÷ 1000000 =', b6 / 1e6, 2) + ' m²', work: 'One side 810,000 mm²', lines: 4 })
    ),
    B.grid2(
      B.prob({ q: 'A duct 18 in by 12 in and 96 in long is open at both ends. Ignore seams. Find the area of sheet in ft².', a: ck('2 × ( 18 + 12 ) × 96 ÷ 144 =', b7 / 144, 0) + ' ft² (' + n(b7) + ' in²)', lines: 4 }),
      B.prob({ q: 'A closed cylindrical tank is 1.2 m across and 2 m high. Find its surface area in m² to two decimal places.', a: ck('π × 0.6 x² × 2 + π × 1.2 × 2 =', b8, 2) + ' m²', work: 'Ends π × 0.6² × 2, side π × 1.2 × 2', lines: 4 })
    ),
    B.grid2(
      B.prob({ q: 'A machine guard panel is 900 mm by 600 mm with a half-circle notch of radius 150 mm cut from one long edge. Find the area of the panel to two decimal places.', a: ck('900 × 600 − π × 150 x² ÷ 2 =', b9, 2) + ' mm²', lines: 4 }),
      B.prob({ q: 'A sheet metal jacket wraps once around a pipe with an outside diameter of 168 mm. The jacket is 3,000 mm long. Ignore laps. Find the area of the jacket in m² to two decimal places.', a: ck('π × 168 × 3000 ÷ 1000000 =', b10 / 1e6, 2) + ' m²', work: 'Stretch-out π × 168, times 3,000', lines: 4 })
    ),

    B.grid2(
      B.prob({ q: 'A 300 mm by 200 mm access hole is cut in a 1,200 mm by 800 mm cover plate. Find the area of plate left in mm² and in m².', a: n(1200 * 800 - 300 * 200) + ' mm² = ' + n((1200 * 800 - 300 * 200) / 1e6, 1) + ' m²', lines: 4 }),
      B.prob({ q: 'A shop floor is 14 ft by 9 ft 6 in. Find its area in ft².', a: n(14 * 9.5) + ' ft²', work: '9 ft 6 in = 9.5 ft, 14 × 9.5', lines: 4 })
    ),

    B.worksheet({ title: 'Shape Canvas', sub: 'Hidden sizes, break it down, unfold it, change one value' }),
    B.grid2(
      B.prob({ q: 'The plate has an area of 0.42 m². Find the hidden length.', canvas: G.rect(700, 600, { ask: ['l'], max: '2.2in', ph: 72 }), a: '700 mm', work: '420,000 ÷ 600', lines: 2 }),
      B.prob({ q: 'The trapezoid has an area of 300,000 mm². Find the hidden height.', canvas: G.trap(400, 800, 500, { ask: ['h'], max: '2.3in', ph: 64 }), a: '500 mm', work: '300,000 ÷ ((400 + 800) ÷ 2) = 300,000 ÷ 600', lines: 2 })
    ),
    B.grid2(
      B.prob({ q: 'The disc has an area of 31,416 mm². Find the hidden radius to the nearest mm.', canvas: G.circ(100, { ask: ['r'], max: '1.8in', ph: 72 }), a: ck('31416 ÷ π = √x', c3r, 0) + ' mm', work: 'r = √(31,416 ÷ π)', lines: 2 }),
      B.prob({ q: 'Find the hidden length of the foot B, then the area of the L-plate.', canvas: G.lPlate(1000, 750, 300, 250, { showC: true, ask: ['c'], max: '2.5in' }), a: 'Foot 700 mm long. Area = ' + n(300 * 750) + ' + ' + n(700 * 250) + ' = ' + n(c4) + ' mm²', lines: 2 })
    ),
    B.grid2(
      B.prob({ q: 'Find the area of the plate with the pointed end.', canvas: G.arrowPlate(600, 300, 200, { max: '2.45in', ph: 66 }), a: n(600 * 300) + ' + ' + n(300 * 200 / 2) + ' = ' + n(c5) + ' mm²', lines: 2 }),
      B.prob({ q: 'Find the area of the lug, A + B − C, to two decimal places.', canvas: G.lug(160, 200, 40, { max: '2.4in', ph: 82 }), a: ck('160 × 200 + π × 80 x² ÷ 2 − π × 20 x² =', c6, 2) + ' mm²', lines: 2 })
    ),
    B.grid2(
    B.prob({ q: 'Unfold it: this is the net of a closed box. Find the surface area of the box in mm² and m².', canvas: G.boxNet(c7p.l, c7p.w, c7p.h, { max: '2.5in', ph: 98 }), a: n(c7) + ' mm² = ' + n(c7 / 1e6) + ' m²', work: '2 × (360,000 + 225,000 + 100,000)', lines: 2 }),
      B.prob({ q: 'This net makes a closed cylinder with a radius of 150 mm. Find the hidden stretch-out and the surface area, to two decimal places.', canvas: G.cylNet(c8p.r, c8p.h, { circ: 'r', ask: ['S'], max: '2.6in', ph: 98 }), a: 'Stretch-out ' + ck('π × 300 =', c8S, 2) + ' mm. SA = ' + ck('π × 150 x² × 2 + π × 300 × 500 =', c8, 2) + ' mm²', lines: 2 })
    ),
    B.grid2(
      B.prob({ q: 'Change one value: the 300 mm side of a square plate is made 3 times longer. Find both areas. How many times bigger is the new area?', canvas: G.row(G.rect(300, 300, { only: ['l'], max: '1in', ph: 19, pad: [14, 6, 14, 28] }), G.rect(900, 900, { only: ['l'], max: '2in', ph: 57, pad: [14, 6, 14, 28] })), a: '90,000 mm² and 810,000 mm², 9 times bigger (3 × 3)', lines: 2 })
    )
  ]);
};
