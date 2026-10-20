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

  /* Set D, materials takeoff, and Set K, carpentry and the BCBC (Oct 2026). Sheet sizes, coverage, waste and prices
     are given data in each problem. Code values are quoted from BCBC 2024 Division B with Article, Sentence and page.
     Whole units always round up. New sets go after Set C so the numbering of Sets A to C does not move */
  const up = x => Math.ceil(L.round(x, 6));
  const money = v => '$' + n(v, 2);
  const d1 = (7.2 * 2.4 - 0.9 * 2.1 - 1.8 * 1.2) / 2.88, d3 = 2.4 * 1.8 * 1.15 / 0.18, d4 = 3 * 0.6 * 1.1 / 0.01;
  const d5 = (2 * (5 + 4) * 2.5 - 0.9 * 2.1 - 2 * 1.2 * 1.2) * 2 / 35, d6 = 2 * 30 * 9 / 350, d7 = 15 * 12 * 1.07 / 20;
  const d8 = (9.6 * 2.7 - 2 * 1.5 * 1.2) * 1.1 / 2.32, d10 = (3.6 * 2.4 - 0.9 * 0.9) / 2.88;
  const SHT = 1.22 * 2.44;
  const kS = 9.6 * 7.2 / SHT, kR = 2 * 11 * 4 * 1.05 / SHT, kW = (2 * (14 + 12) * 8 - 20 - 15) / 32, kC = 14 * 12 / 32;
  const kO = (40 * 2.4 - 9.5) / SHT, kG = (8 * 2.4 + 8 * 1.6 / 2 - 1.2) * 1.1 / 2;

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
    ),

    B.worksheet({ title: 'Materials takeoff', sub: 'Openings, waste, whole units and cost' }),
    B.grid2(
      B.prob({ q: 'A wall is 7.2 m by 2.4 m with a door 0.9 m by 2.1 m and a window 1.8 m by 1.2 m. Drywall sheets are 1.2 m by 2.4 m at $19.25. How many sheets, and what is the cost?', a: ck('( 7.2 × 2.4 − 0.9 × 2.1 − 1.8 × 1.2 ) ÷ 2.88 =', d1, 2) + ' sheets, so ' + up(d1) + ' sheets, ' + money(up(d1) * 19.25), work: 'Net area 13.23 m²', lines: 4 }),
      B.prob({ q: 'A ceiling is 4.8 m by 3.6 m. Drywall sheets are 1.2 m by 3.6 m. How many sheets?', a: ck('4.8 × 3.6 ÷ ( 1.2 × 3.6 ) =', 4, 0) + ' sheets exactly', work: '17.28 m² ÷ 4.32 m²', lines: 4 })
    ),
    B.grid2(
      B.prob({ q: 'A bathroom floor is 2.4 m by 1.8 m. The tiles are 300 mm by 600 mm. Allow 15% waste. How many tiles?', a: ck('2.4 × 1.8 × 1.15 ÷ 0.18 =', d3, 1) + ', so ' + up(d3) + ' tiles', work: 'One tile 0.3 × 0.6 = 0.18 m²', lines: 4 }),
      B.prob({ q: 'A backsplash is 3.0 m long and 0.6 m high. The tiles are 100 mm by 100 mm. Allow 10% waste. How many tiles?', a: ck('3 × 0.6 × 1.1 ÷ 0.01 =', d4, 0) + ' tiles', work: 'One tile 0.1 × 0.1 = 0.01 m²', lines: 4 })
    ),
    B.grid2(
      B.prob({ q: 'A room is 5.0 m by 4.0 m with walls 2.5 m high. Leave out a door 0.9 m by 2.1 m and two windows 1.2 m by 1.2 m. Two coats. One can covers 35 m² and costs $49.99. How many cans, and what is the cost?', a: ck('( 2 × ( 5 + 4 ) × 2.5 − 0.9 × 2.1 − 2 × 1.2 × 1.2 ) × 2 ÷ 35 =', d5, 2) + ' cans, so ' + up(d5) + ' cans, ' + money(up(d5) * 49.99), work: 'Walls 45 m², net 40.23 m², two coats 80.46 m²', lines: 4 }),
      B.prob({ q: 'Two walls are each 30 ft long and 9 ft high. They get one coat. The label says 1 US gal covers 350 ft². How many whole gallons?', a: ck('2 × 30 × 9 ÷ 350 =', d6, 2) + ' gal, so ' + up(d6) + ' gal', work: '540 ft² ÷ 350', lines: 4 })
    ),
    B.grid2(
      B.prob({ q: 'Laminate flooring for a room 15 ft by 12 ft. Allow 7% waste. One box covers 20 ft² and costs $44.90. How many boxes, and what is the cost?', a: ck('15 × 12 × 1.07 ÷ 20 =', d7, 2) + ' boxes, so ' + up(d7) + ' boxes, ' + money(up(d7) * 44.9), lines: 4 }),
      B.prob({ q: 'A wall is 9.6 m by 2.7 m with two windows 1.5 m by 1.2 m. Siding comes in boxes that cover 2.32 m². Allow 10% waste. How many boxes?', a: ck('( 9.6 × 2.7 − 2 × 1.5 × 1.2 ) × 1.1 ÷ 2.32 =', d8, 2) + ', so ' + up(d8) + ' boxes', work: 'Net area 22.32 m²', lines: 4 })
    ),
    B.grid2(
      B.prob({ q: 'Carpet is sold by the whole square metre at $32.50 a square metre. A room is 4.2 m by 3.5 m. How many square metres do you buy, and what is the cost?', a: ck('4.2 × 3.5 =', 14.7, 1) + ' m², so buy ' + up(14.7) + ' m², ' + money(up(14.7) * 32.5), lines: 4 }),
      B.prob({ q: 'You have 6 drywall sheets, each 2.88 m². A wall needs 13.5 m² plus 10% waste. Is that enough? By how much?', a: 'Yes. 6 sheets cover ' + ck('6 × 2.88 =', 17.28, 2) + ' m², the wall needs ' + ck('13.5 × 1.1 =', 14.85, 2) + ' m², ' + n(L.round(17.28 - 14.85, 2), 2) + ' m² to spare', lines: 4 })
    ),
    B.prob({ q: 'Drywall sheets are 1.2 m by 2.4 m. How many sheets do you buy for this wall?', canvas: G.wallElev(3.6, 2.4, [{ x: 1.5, y: 1, w: 0.9, h: 0.9, name: 'win.' }], { max: '2.4in', ph: 70 }), a: ck('( 3.6 × 2.4 − 0.9 × 0.9 ) ÷ 2.88 =', d10, 2) + ', so ' + up(d10) + ' sheets', lines: 3 }),

    (B.wsN = 10, ''),
    B.worksheet({ title: 'Carpentry and the BCBC', sub: 'Sheathing, drywall, flooring and roofs, with BCBC 2024 Part 9 tables' }),
    B.grid2(
      B.prob({ q: 'Studs are 600 mm o.c. Table 9.29.5.3. (Sentence 9.29.5.3.(1), <span style="white-space:nowrap">page 9-275</span>) lists gypsum board 9.5 mm, 12.7 mm and 15.9 mm thick. Which thicknesses may be used on these walls as a single layer?', a: '12.7 mm and 15.9 mm (600 mm on walls). 9.5 mm is listed for walls only perpendicular to the framing, at up to 400 mm o.c.', lines: 4 }),
      B.prob({ q: 'Ceiling joists are 600 mm o.c. with a painted finish. Use Table 9.29.5.3. (<span style="white-space:nowrap">page 9-275</span>). May regular 12.7 mm gypsum board run parallel to the joists? Perpendicular?', a: 'Parallel: no, the limit is 400 mm. Perpendicular: yes, the limit is 600 mm.', lines: 4 })
    ),
    B.grid2(
      B.prob({ q: 'Floor joists are 400 mm o.c. Table 9.23.15.5.-A (Sentence 9.23.15.5.(1), <span style="white-space:nowrap">page 9-224</span>) gives the minimum plywood subfloor thickness. What is it? How many 1.22 m by 2.44 m sheets cover a floor 9.6 m by 7.2 m, with no waste allowance?', a: '15.5 mm. ' + ck('9.6 × 7.2 ÷ ( 1.22 × 2.44 ) =', kS, 2) + ', so ' + up(kS) + ' sheets', work: '69.12 m² ÷ 2.9768 m²', lines: 4 }),
      B.prob({ q: 'The same floor is framed with joists at 600 mm o.c. What minimum plywood subfloor thickness does Table 9.23.15.5.-A (<span style="white-space:nowrap">page 9-224</span>) give, and how much thicker is it than at 400 mm o.c.?', a: '18.5 mm, 3 mm thicker than 15.5 mm', lines: 4 })
    ),
    B.grid2(
      B.prob({ q: 'Roof rafters are 600 mm o.c. on a roof that is not a walking deck. Table 9.23.16.7.-A (Sentence 9.23.16.7.(2), <span style="white-space:nowrap">page 9-226</span>) gives the minimum plywood roof sheathing thickness. What is it with the edges supported, and with the edges unsupported?', a: '9.5 mm with edges supported, 12.5 mm with edges unsupported', lines: 4 }),
      B.prob({ q: 'Sheathe both sides of the roof with 1.22 m by 2.44 m sheets. Allow 5% waste. How many sheets?', canvas: G.gableRoof(11, 4, { max: '2.3in', ph: 70 }), a: ck('2 × 11 × 4 × 1.05 ÷ ( 1.22 × 2.44 ) =', kR, 2) + ', so ' + up(kR) + ' sheets', work: '2 × 11 × 4 = 88 m², × 1.05 = 92.4 m²', lines: 3 })
    ),
    B.grid2(
      B.prob({ q: 'Table 9.26.3.1. (Sentence 9.26.3.1.(1), <span style="white-space:nowrap">page 9-242</span>) sets a minimum slope for asphalt shingles of 1 in 3 for normal application and 1 in 6 for low slope application. A roof rises 4 in per 12 in. Write it as 1 in ?. Which application may be used?', a: '4 in 12 = 1 in 3 (12 ÷ 4 = 3). Normal application, at its minimum slope', lines: 4 }),
      B.prob({ q: 'Use the same table. A roof rises 3 in per 12 in. Write it as 1 in ?. May asphalt shingles be applied, and how?', a: '3 in 12 = 1 in 4. It is steeper than 1 in 6 but not as steep as 1 in 3, so low slope application only', lines: 4 })
    ),
    B.grid2(
      B.prob({ q: 'A roof rises 2 in per 12 in. Write it as 1 in ?. What does Table 9.26.3.1. (<span style="white-space:nowrap">page 9-242</span>) allow for asphalt shingles?', a: '2 in 12 = 1 in 6. Low slope application, at its minimum slope. Normal application is not allowed', lines: 4 }),
      B.prob({ q: 'A room is 14 ft by 12 ft with 8 ft walls. Drywall the walls and the ceiling with 4 ft by 8 ft sheets at $15.98. Leave out a door of 20 ft² and a window of 15 ft². Round the walls and the ceiling up separately. How many sheets, and what is the cost?', a: 'Walls ' + ck('( 2 × ( 14 + 12 ) × 8 − 20 − 15 ) ÷ 32 =', kW, 2) + ', so ' + up(kW) + '. Ceiling ' + ck('14 × 12 ÷ 32 =', kC, 2) + ', so ' + up(kC) + '. ' + (up(kW) + up(kC)) + ' sheets, ' + money((up(kW) + up(kC)) * 15.98), work: 'Walls 416 − 35 = 381 ft², ceiling 168 ft²', lines: 4 })
    ),
    B.grid2(
      B.prob({ q: 'Table 9.23.17.2.-A (Sentence 9.23.17.2.(1), <span style="white-space:nowrap">page 9-227</span>) lists the minimum thickness of OSB, O-2 Grade, wall sheathing. What is it with studs 400 mm o.c., and with studs 600 mm o.c.?', a: '6.0 mm at 400 mm o.c., 7.5 mm at 600 mm o.c.', lines: 4 }),
      B.prob({ q: 'Walls with a total length of 40 m are 2.4 m high. The openings add up to 9.5 m². Sheathing sheets are 1.22 m by 2.44 m. How many sheets?', a: ck('( 40 × 2.4 − 9.5 ) ÷ ( 1.22 × 2.44 ) =', kO, 2) + ', so ' + up(kO) + ' sheets', work: '96 − 9.5 = 86.5 m²', lines: 4 })
    ),
    B.prob({ q: 'A gable end wall is a rectangle 8 m wide and 2.4 m high with a triangle on top, 8 m at the base and 1.6 m high. Leave out a 1.2 m² window. Siding boxes cover 2 m². Allow 10% waste. How many boxes?', a: ck('( 8 × 2.4 + 8 × 1.6 ÷ 2 − 1.2 ) × 1.1 ÷ 2 =', kG, 2) + ', so ' + up(kG) + ' boxes', work: '19.2 + 6.4 − 1.2 = 24.4 m²', lines: 3 })
  ]);
};
