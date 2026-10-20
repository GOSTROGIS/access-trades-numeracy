/* Exercise Book, Chapter 11: Volume and Capacity. Answers computed here, cross-checked with the Shapes engine where a
   solid exists, calculator answers checked with B.check. 1 L = 1,000,000 mm³, 1 m³ = 1,000 L, 1 US gal = 231 in³
   = 3.785411784 L (NIST SP 1038 and the hub units module). */
module.exports = function (B, L) {
  const G = require('../engine/figs-ch10.js')(B, L);
  const { SH, NET, pair, xc } = G;
  const n = L.num;
  const PI = Math.PI;
  const GAL = 3.785411784;
  function ck(seq, v, dp) { const s = n(L.round(v, dp), dp); B.check(seq, s); return s; }

  /* Set A */
  const a6 = xc('rectangular-prism', { l: 700, w: 400, h: 250 }, 'V', 700 * 400 * 250);
  const a8 = xc('triangular-prism', { b: 300, h: 200, l: 1500 }, 'V', 300 * 200 / 2 * 1500);
  const a13 = xc('cylinder', { r: 150, h: 600 }, 'V', PI * 150 * 150 * 600);
  const a14 = xc('cone', { r: 200, h: 450 }, 'V', PI * 200 * 200 * 450 / 3);
  const a15 = xc('square-pyramid', { b: 900, h: 600 }, 'V', 900 * 900 * 600 / 3);
  const a16 = xc('sphere', { r: 250 }, 'V', 4 / 3 * PI * Math.pow(250, 3));
  const a17 = xc('hemisphere', { r: 0.4 }, 'V', 2 / 3 * PI * 0.064);

  /* Set B */
  const b2 = PI * 81 * 48 / 231;
  const b3 = PI * Math.pow(0.026, 2) * 75 * 1000;
  const b4 = (PI * Math.pow(0.05, 2) * 40 + PI * Math.pow(0.025, 2) * 25) * 1000;
  const b6A = xc('cylinder', { r: 0.6, h: 1 }, 'V', PI * 0.36), b6B = xc('cone', { r: 0.6, h: 0.8 }, 'V', PI * 0.36 * 0.8 / 3);
  const b7 = PI * Math.pow(11.25, 2) * 33.5 / 231;
  const b8 = xc('capsule', { r: 0.5, l: 2 }, 'V', PI * 0.25 * 2 + 4 / 3 * PI * 0.125);
  const b9 = xc('cylinder', { r: 25, h: 3000 }, 'V', PI * 625 * 3000);
  const b10 = xc('pipe', { R: 57, r: 51, h: 6000 }, 'V', PI * (57 * 57 - 51 * 51) * 6000);
  const b11 = PI * 0.25 * 1.4;

  /* Set C */
  const c2 = xc('cylinder', { r: 300, h: 1000 }, 'V', PI * 90000 * 1000);
  const c4 = xc('cylinder', { r: 250, h: 600 }, 'V', PI * 62500 * 600);
  const c5 = PI * 90000 * 500 + PI * 90000 * 400 / 3;
  const c6 = xc('capsule', { r: 200, l: 800 }, 'V', PI * 40000 * 800 + 4 / 3 * PI * 8e6);
  const c7a = PI * 90000 * 300 / 3, c7b = PI * 90000 * 600 / 3;
  const c8a = 4 / 3 * PI * 1e6, c8b = 4 / 3 * PI * 8e6;
  const ai = { a: 80, b: 60, t: 8, L: 400 }, aiA = ai.t * (ai.a + ai.b - ai.t), aiV = xc('angle-iron', ai, 'V', aiA * ai.L);

  /* Set D, concrete, steel and lumber, and Set K, carpentry and the BCBC (Oct 2026). New sets go after Set C so
     Sets A to C keep their numbers. 1 yd = 0.9144 m exactly, so 1 yd³ = 0.9144³ m³. Densities: concrete 2,240 to
     2,400 kg/m³ (FHWA, Portland Cement Concrete Materials), steel 7,850 kg/m³ (The Engineering ToolBox, Metals and
     Alloys - Densities). Lumber sizes: Canadian Wood Council. Imperial gallon 4.54609 L (Weights and Measures Act).
     Code values: BCBC 2024 Division B with Article, Sentence and page */
  const G11 = require('../engine/figs-ch11.js')(B, L);
  const YD3 = Math.pow(0.9144, 3), IMP = 4.54609;
  const money = v => '$' + n(v, 2);
  const pg = s => '<span style="white-space:nowrap">page ' + s + '</span>';
  const e1 = 4.8 * 3.6 * 0.1, e4 = PI * 0.01 * 1 * 10, e6 = 1.5 * 0.6 * 0.012 * 7850, e7 = PI * 0.0004 * 3 * 7850;
  const e8 = 2 * 8 * 14 / 12 * 16, e9N = 2 * 4 * 10 / 12, e9A = 1.5 * 3.5 * 10 / 12;
  const e11 = xc('cylinder', { r: 750, h: 2000 }, 'V', PI * 750 * 750 * 2000) / 1e6, e12 = 500 * IMP;
  const k5 = 0.35 * 0.1 * 44, k6 = Math.ceil(Math.sqrt(0.75) * 1000), k7 = 4 * Math.pow(k6 / 1000, 2) * 0.2;
  const k8 = 10.8 * 8.4 * 0.075, k9 = 10.8 * 8.4 * 0.1, k11 = 0.2 * 1.95 * 36, k12 = 36 * 0.8 * 2 - 0.45 * 0.15 * 36 - 0.2 * 1.85 * 36;

  return L.join([
    B.exChapter({ num: 11, id: 'volume', title: 'Volume and Capacity', intro: 'Practice with cubic units, the volume of prisms, cylinders, cones, pyramids and spheres, composite solids, and capacity in litres and US gallons (1 US gal = 231 in³ = 3.785411784 L).' }),

    B.worksheet({ title: 'Skills', sub: 'One skill at a time' }),
    B.grid2(
      B.prob({ q: 'A block of 1 cm cubes is 6 long, 4 wide and 3 high. Find its volume.', a: '72 cm³', lines: 2 }),
      B.prob({ q: 'Write 3 cm³ in mm³.', a: '3,000 mm³', lines: 2 })
    ),
    B.grid2(
      B.prob({ q: 'Write 2,500,000,000 mm³ in m³.', a: '2.5 m³', lines: 2 }),
      B.prob({ q: 'Write 0.45 m³ in litres.', a: '450 L', lines: 2 })
    ),
    B.grid2(
      B.prob({ q: 'Write 3,456 in³ in ft³.', a: '2 ft³', work: '3,456 ÷ 1,728', lines: 2 }),
      B.prob({ q: 'Write 2,000,000 mm³ in litres.', a: '2 L', lines: 2 })
    ),
    B.grid2(
      B.prob({ q: 'Box 700 mm by 400 mm by 250 mm. Find the volume in m³.', a: ck('0.7 × 0.4 × 0.25 =', a6 / 1e9, 2) + ' m³', lines: 2 }),
      B.prob({ q: 'Cube with 0.6 m edges. Find the volume in m³.', a: ck('0.6 x³ =', 0.216, 3) + ' m³', lines: 2 })
    ),
    B.grid2(
      B.prob({ q: 'Triangular prism: end base 300 mm, end height 200 mm, length 1,500 mm. Find the volume in litres.', a: ck('300 × 200 ÷ 2 × 1500 ÷ 1000000 =', a8 / 1e6, 0) + ' L', lines: 2 }),
      B.prob({ q: 'Write 1,155 in³ in US gallons.', a: ck('1155 ÷ 231 =', 5, 0) + ' US gal', lines: 2 })
    ),
    B.grid2(
      B.prob({ q: 'Write 75 US gal in litres, to two decimal places.', a: ck('75 × 3.785411784 =', 75 * GAL, 2) + ' L', lines: 2 }),
      B.prob({ q: 'Write 500 L in US gallons, to two decimal places.', a: ck('500 ÷ 3.785411784 =', 500 / GAL, 2) + ' US gal', lines: 2 })
    ),
    B.grid2(
      B.prob({ q: 'Cylinder: radius 150 mm, height 600 mm. Capacity in litres, to two decimal places?', a: ck('π × 150 x² × 600 ÷ 1000000 =', a13 / 1e6, 2) + ' L', lines: 2 }),
      B.prob({ q: 'Cone: radius 200 mm, height 450 mm. Capacity in litres, to two decimal places?', a: ck('π × 200 x² × 450 ÷ 3 ÷ 1000000 =', a14 / 1e6, 2) + ' L', lines: 2 })
    ),
    B.grid2(
      B.prob({ q: 'Square pyramid: base 900 mm by 900 mm, height 600 mm. Capacity in litres?', a: ck('900 x² × 600 ÷ 3 ÷ 1000000 =', a15 / 1e6, 0) + ' L', lines: 2 }),
      B.prob({ q: 'Sphere: radius 250 mm. Capacity in litres, to two decimal places?', a: ck('4 ÷ 3 × π × 250 x³ ÷ 1000000 =', a16 / 1e6, 2) + ' L', lines: 2 })
    ),
    B.grid2(
      B.prob({ q: 'Hemisphere: radius 0.4 m. Volume in m³, to three decimal places?', a: ck('2 ÷ 3 × π × 0.4 x³ =', a17, 3) + ' m³', lines: 2 }),
      B.prob({ q: 'Pipe with an inside diameter of 80 mm. Litres per metre, to two decimal places?', a: ck('π × 0.04 x² × 1000 =', PI * 0.0016 * 1000, 2) + ' L', lines: 2 })
    ),
    B.grid2(
      B.prob({ q: 'A box holds 0.24 m³. Its base is 0.8 m by 0.5 m. Find its height.', a: ck('0.24 ÷ ( 0.8 × 0.5 ) =', 0.6, 1) + ' m', lines: 2 }),
      B.prob({ q: 'How many US gallons are in 1 ft³ (1,728 in³), to two decimal places?', a: ck('1728 ÷ 231 =', 1728 / 231, 2) + ' US gal', lines: 2 })
    ),
    B.grid2(
      B.prob({ q: 'Which holds more, a 40 L drum or a 10 US gal can? Show the litres to two decimal places.', a: 'The 40 L drum. 10 US gal = ' + ck('10 × 3.785411784 =', 10 * GAL, 2) + ' L', lines: 2 }),
      B.prob({ q: 'Cylinder: radius 0.2 m, height 0.5 m. Volume in m³, to three decimal places?', a: ck('π × 0.2 x² × 0.5 =', xc('cylinder', { r: 0.2, h: 0.5 }, 'V', PI * 0.04 * 0.5), 3) + ' m³', lines: 2 })
    ),

    B.worksheet({ title: 'Shop problems', sub: 'Tanks, pipes and parts, metric and imperial' }),
    B.prob({ q: 'A hydraulic reservoir is 800 mm by 500 mm by 450 mm inside. How many litres does it hold? How many 20 L pails of oil fill it?', a: ck('800 × 500 × 450 ÷ 1000000 =', 180, 0) + ' L, 9 pails', lines: 3 }),
    B.grid2(
      B.prob({ q: 'A water heater tank is a cylinder 18 in across and 48 in tall inside. Find its capacity in US gallons, to two decimal places.', a: ck('π × 9 x² × 48 ÷ 231 =', b2, 2) + ' US gal', work: 'r = 9 in, π × 81 × 48 in³, ÷ 231', lines: 4 }),
      B.prob({ q: 'Before a pressure test, 75 m of pipe with an inside diameter of 52 mm is filled with water. How many litres, to two decimal places?', a: ck('π × 0.026 x² × 75 × 1000 =', b3, 2) + ' L', lines: 4 })
    ),
    B.grid2(
      B.prob({ q: 'A system has 40 m of pipe with a 100 mm inside diameter and 25 m with a 50 mm inside diameter. Find the total litres, to two decimal places.', a: ck('( π × 0.05 x² × 40 + π × 0.025 x² × 25 ) × 1000 =', b4, 2) + ' L', lines: 4 }),
      B.prob({ q: 'A sump is 1.5 m by 1.0 m. The water in it is 0.6 m deep. A pump removes 45 L per minute. How many litres are in the sump, and how long does pumping take?', a: ck('1.5 × 1 × 0.6 × 1000 =', 900, 0) + ' L, ' + ck('900 ÷ 45 =', 20, 0) + ' minutes', lines: 4 })
    ),
    B.grid2(
      B.prob({ q: 'A hopper is a cylinder 1.2 m across and 1.0 m high on a cone 0.8 m high. Find its capacity in litres, to two decimal places.', a: ck('( π × 0.6 x² × 1 + π × 0.6 x² × 0.8 ÷ 3 ) × 1000 =', (b6A + b6B) * 1000, 2) + ' L', work: 'Cylinder ' + n(L.round(b6A, 4), 4) + ' m³ + cone ' + n(L.round(b6B, 4), 4) + ' m³', lines: 4 }),
      B.prob({ q: 'A drum is 22.5 in across and 33.5 in tall inside. Find its capacity in US gallons, to two decimal places.', a: ck('π × 11.25 x² × 33.5 ÷ 231 =', b7, 2) + ' US gal', lines: 4 })
    ),
    B.grid2(
      B.prob({ q: 'A tank is a cylinder with a hemisphere on each end. The cylinder part is 2 m long. The radius is 0.5 m. Find its capacity in litres, to two decimal places.', a: ck('( π × 0.5 x² × 2 + 4 ÷ 3 × π × 0.5 x³ ) × 1000 =', b8 * 1000, 2) + ' L', lines: 4 }),
      B.prob({ q: 'A vertical tank is 1 m across inside and holds water 1.4 m deep. How many litres are in it, to two decimal places?', a: ck('π × 0.5 x² × 1.4 × 1000 =', b11 * 1000, 2) + ' L', lines: 4 })
    ),
    B.grid2(
      B.prob({ q: 'A solid round bar is 50 mm in diameter and 3 m long. Find its volume in cm³, to two decimal places.', a: ck('π × 25 x² × 3000 ÷ 1000 =', b9 / 1000, 2) + ' cm³', lines: 4 }),
      B.prob({ q: 'A tube has an outside diameter of 114 mm, an inside diameter of 102 mm and a length of 6,000 mm. Find the volume of metal in cm³, to two decimal places.', a: ck('π × ( 57 x² − 51 x² ) × 6000 ÷ 1000 =', b10 / 1000, 2) + ' cm³', lines: 4 })
    ),

    B.grid2(
      B.prob({ q: 'A fuel day tank is 36 in by 24 in by 20 in inside. Find its capacity in US gallons to two decimal places. A heater burns 2.5 US gal per hour. How many hours will a full tank last, to the nearest hour?', a: ck('36 × 24 × 20 ÷ 231 =', 17280 / 231, 2) + ' US gal, about ' + ck('36 × 24 × 20 ÷ 231 ÷ 2.5 =', 17280 / 231 / 2.5, 0) + ' hours', lines: 4 }),
      B.prob({ q: 'A blast-media hopper is an upside-down square pyramid. The top is 1,200 mm square and the depth is 900 mm. Find its capacity in litres.', a: ck('1200 x² × 900 ÷ 3 ÷ 1000000 =', xc('square-pyramid', { b: 1200, h: 900 }, 'V', 1200 * 1200 * 900 / 3) / 1e6, 0) + ' L', lines: 4 })
    ),

    B.worksheet({ title: 'Shape Canvas', sub: 'Hidden sizes, break it down, unfold it, change one value' }),
    B.grid2(
      B.prob({ q: 'The tank holds 240 L. Find the hidden length.', canvas: G.box(800, 600, 500, { ask: ['l'], max: '2.3in', ph: 90 }), a: '800 mm', work: '240,000,000 mm³ ÷ (600 × 500)', lines: 2 }),
      B.prob({ q: 'The cylinder holds 282.74 L to two decimal places. Find the hidden height to the nearest mm.', canvas: G.cyl(300, 1000, { ask: ['h'], max: '2.2in', ph: 100 }), a: ck('282740000 ÷ ( π × 300 x² ) =', 1000, 0) + ' mm', work: 'h = V ÷ (π × r²)' + B.check('π × 300 x² × 1000 ÷ 1000000 =', n(L.round(c2 / 1e6, 2), 2)), lines: 2 })
    ),
    B.grid2(
      B.prob({ q: 'Fold the net into a cube. Find its capacity in litres.', canvas: G.boxNet(400, 400, 400, { max: '2.3in', ph: 120 }), a: '64 L', work: '400³ = 64,000,000 mm³', lines: 2 }),
      B.prob({ q: 'Fold the net into a closed cylinder. Find its capacity in litres, to two decimal places.', canvas: G.cylNet(250, 600, { circ: 'D', max: '2.4in', ph: 120 }), a: ck('π × 250 x² × 600 ÷ 1000000 =', c4 / 1e6, 2) + ' L', work: 'The circles are 500 mm across, so r = 250 mm', lines: 2 })
    ),
    B.grid2(
      B.prob({ q: 'Break it down: A is a cylinder 600 mm across and B is a cone. Find the capacity of the hopper, A + B, in litres to two decimal places.', canvas: G.hopper(600, 500, 400, { max: '2.4in', ph: 88 }), a: ck('( π × 300 x² × 500 + π × 300 x² × 400 ÷ 3 ) ÷ 1000000 =', c5 / 1e6, 2) + ' L', lines: 2 }),
      B.prob({ q: 'The tank has a hemisphere on each end. Find its capacity in litres, to two decimal places.', canvas: G.capsuleSide(200, 800, { max: '2.5in', ph: 80 }), a: ck('( π × 200 x² × 800 + 4 ÷ 3 × π × 200 x³ ) ÷ 1000000 =', c6 / 1e6, 2) + ' L', lines: 2 })
    ),
    B.grid2(
      B.prob({ q: 'Break down the L-shaped end of the angle bar into two rectangles. Find the end area and the volume in cm³.', canvas: G.angleEnd(ai.a, ai.b, ai.t, { max: '2.5in', ph: 80 }), a: 'End area ' + n(aiA) + ' mm², volume ' + ck('1056 × 400 ÷ 1000 =', aiV / 1000, 1) + ' cm³', work: '80 × 8 + 52 × 8 = 640 + 416', lines: 2 }),
      B.prob({ q: 'Change one value: a spherical float with a radius of 100 mm has its radius doubled. Find both capacities in litres, to two decimal places. How many times bigger is the new one?', canvas: G.row(G.sphere(100, { rBelow: true, max: '1.5in', ph: 34, pad: [22, 8, 22, 26] }), G.sphere(200, { rBelow: true, max: '1.5in', ph: 68 })), a: ck('4 ÷ 3 × π × 100 x³ ÷ 1000000 =', c8a / 1e6, 2) + ' L and ' + ck('4 ÷ 3 × π × 200 x³ ÷ 1000000 =', c8b / 1e6, 2) + ' L, 8 times bigger (2 × 2 × 2)', lines: 2 })
    ),
    B.prob({ q: 'Change one value: a cone has a radius of 300 mm and a height of 300 mm. The height is doubled. Find both capacities in litres, to two decimal places.', canvas: G.row(G.cone(300, 300, { max: '2in', ph: 35 }), G.cone(300, 600, { max: '2in', ph: 60 })), a: ck('π × 300 x² × 300 ÷ 3 ÷ 1000000 =', c7a / 1e6, 2) + ' L and ' + ck('π × 300 x² × 600 ÷ 3 ÷ 1000000 =', c7b / 1e6, 2) + ' L, 2 times bigger', lines: 2 }),

    B.worksheet({ title: 'Concrete, steel and lumber', sub: 'Cubic metres and yards, mass, board feet and tank capacity' }),
    B.grid2(
      B.prob({ q: 'A patio slab is 4.8 m by 3.6 m and 100 mm thick. Concrete in m³ and in cubic yards, to two decimal places?', a: ck('4.8 × 3.6 × 0.1 =', e1, 2) + ' m³ = ' + ck('4.8 × 3.6 × 0.1 ÷ 0.9144 x³ =', e1 / YD3, 2) + ' yd³', lines: 4 }),
      B.prob({ q: 'A driveway is 30 ft by 12 ft and 4 in thick. How many cubic yards, to two decimal places?', a: ck('30 × 12 × 4 ÷ 12 ÷ 27 =', 120 / 27, 2) + ' yd³', work: '4 in = 4 ÷ 12 ft, 120 ft³ ÷ 27', lines: 4 })
    ),
    B.grid2(
      B.prob({ q: 'A strip footing is 450 mm wide, 150 mm thick and 32 m long. Concrete in m³?', a: ck('0.45 × 0.15 × 32 =', 2.16, 2) + ' m³', lines: 4 }),
      B.prob({ q: 'Ten round piers are each 200 mm across and 1.0 m deep. Concrete in m³, to two decimal places?', a: ck('π × 0.1 x² × 1 × 10 =', e4, 2) + ' m³', lines: 4 })
    ),
    B.grid2(
      B.prob({ q: 'Find the mass of the 2.16 m³ footing from question 3 at 2,240 kg/m³ and at 2,400 kg/m³, the range FHWA gives for normal concrete.', a: ck('2.16 × 2240 =', 2.16 * 2240, 1) + ' kg to ' + ck('2.16 × 2400 =', 2.16 * 2400, 0) + ' kg', lines: 4 }),
      B.prob({ q: 'A steel plate is 1,500 mm by 600 mm and 12 mm thick. Mass at 7,850 kg/m³, to two decimal places?', a: ck('1.5 × 0.6 × 0.012 × 7850 =', e6, 2) + ' kg', lines: 4 })
    ),
    B.grid2(
      B.prob({ q: 'A steel round bar is 40 mm across and 3 m long. Mass at 7,850 kg/m³, to two decimal places?', a: ck('π × 0.02 x² × 3 × 7850 =', e7, 2) + ' kg', lines: 4 }),
      B.prob({ q: 'An order is 16 pieces of 2 × 8, each 14 ft long, at $1,250 per MBF. Board feet and cost, to two decimal places?', a: ck('2 × 8 × 14 ÷ 12 × 16 =', e8, 2) + ' BF, ' + money(L.round(e8 / 1000 * 1250, 2)) + B.check('2 × 8 × 14 ÷ 12 × 16 ÷ 1000 × 1250 =', n(L.round(e8 / 1000 * 1250, 2), 2)), lines: 4 })
    ),
    B.grid2(
      B.prob({ q: 'A 2 × 4 is 10 ft long. Find its board feet from the nominal size. Then find the board feet of wood in the dressed piece, 1½ in by 3½ in (Canadian Wood Council S-Dry size). Two decimal places.', a: ck('2 × 4 × 10 ÷ 12 =', e9N, 2) + ' BF sold, ' + ck('1.5 × 3.5 × 10 ÷ 12 =', e9A, 2) + ' BF of wood', lines: 4 }),
      B.prob({ q: 'A tank is 2,000 mm by 1,200 mm by 1,000 mm inside. Capacity in litres, US gallons and imperial gallons, to two decimal places?', a: ck('2000 × 1200 × 1000 ÷ 1000000 =', 2400, 0) + ' L = ' + ck('2400 ÷ 3.785411784 =', 2400 / GAL, 2) + ' US gal = ' + ck('2400 ÷ 4.54609 =', 2400 / IMP, 2) + ' imperial gal', lines: 4 })
    ),
    B.grid2(
      B.prob({ q: 'A vertical tank is 1,500 mm across and 2,000 mm high inside. Capacity in litres, US gallons and imperial gallons, to two decimal places?', a: ck('π × 0.75 x² × 2 × 1000 =', e11, 2) + ' L = ' + ck('π × 0.75 x² × 2 × 1000 ÷ 3.785411784 =', e11 / GAL, 2) + ' US gal = ' + ck('π × 0.75 x² × 2 × 1000 ÷ 4.54609 =', e11 / IMP, 2) + ' imperial gal', lines: 4 }),
      B.prob({ q: 'An old tank is stamped 500 imperial gal. How many litres, and how many US gallons, to two decimal places?', a: ck('500 × 4.54609 =', e12, 2) + ' L = ' + ck('500 × 4.54609 ÷ 3.785411784 =', e12 / GAL, 2) + ' US gal', lines: 4 })
    ),

    (B.wsN = 10, ''),
    B.worksheet({ title: 'Carpentry and the BCBC', sub: 'Footings, foundation walls, slabs, granular base and backfill, with BCBC 2024 Sections 9.15 and 9.16' }),
    B.grid2(
      B.prob({ q: 'Table 9.15.3.4. (Sentence 9.15.3.4.(1), ' + pg('9-120') + ') gives minimum strip footing widths. What are they under exterior walls for 1, 2 and 3 floors supported?', a: '250 mm, 350 mm and 450 mm', lines: 4 }),
      B.prob({ q: 'Use the same table for interior walls, 1, 2 and 3 floors supported. For how many floors are the exterior and interior widths the same?', a: '200 mm, 350 mm and 500 mm. They are the same, 350 mm, for 2 floors', lines: 4 })
    ),
    B.grid2(
      B.prob({ q: 'A two-storey house has exterior strip footings at the minimum width, centred under 200 mm walls. Find the projection, then the minimum thickness from Sentence 9.15.3.8.(1) (' + pg('9-121') + ').', a: 'Projection (350 − 200) ÷ 2 = 75 mm. Thickness is the greater of 100 mm and 75 mm: 100 mm', lines: 4 }),
      B.prob({ q: 'The drawings show a 600 mm footing centred under a 200 mm wall. Use Sentence 9.15.3.8.(1) to find the minimum thickness.', canvas: G11.footingSec(600, 200, 200, { ask: ['ft'], max: '2.3in', ph: 100 }), a: 'Projection (600 − 200) ÷ 2 = 200 mm, so at least 200 mm thick', lines: 3 })
    ),
    B.grid2(
      B.prob({ q: 'The footing from question 3 (350 mm by 100 mm) runs 44 m. Concrete in m³ and cubic yards, to two decimal places?', a: ck('0.35 × 0.1 × 44 =', k5, 2) + ' m³ = ' + ck('0.35 × 0.1 × 44 ÷ 0.9144 x³ =', k5 / YD3, 2) + ' yd³', lines: 4 }),
      B.prob({ q: 'Table 9.15.3.4. gives 0.75 m² as the minimum column footing area for 2 floors supported (columns 3 m o.c.). A square pad must have at least that area. What is its smallest side, rounded up to the next whole mm?', a: ck('0.75 √x', Math.sqrt(0.75), 4) + ' m, so ' + n(k6) + ' mm', work: 'side = √0.75', lines: 4 })
    ),
    B.grid2(
      B.prob({ q: 'Four square pads are ' + n(k6) + ' mm by ' + n(k6) + ' mm and 200 mm thick. Concrete in m³, to two decimal places?', a: ck('4 × 0.867 x² × 0.2 =', k7, 2) + ' m³', lines: 4 }),
      B.prob({ q: 'A basement slab is 10.8 m by 8.4 m at the minimum thickness of Sentence 9.16.4.3.(1) (' + pg('9-130') + '). Find the thickness, then the concrete in m³ and cubic yards, to two decimal places.', canvas: G11.slabSec(75, 100, { ask: ['t'], max: '2.4in', ph: 70 }), a: '75 mm. ' + ck('10.8 × 8.4 × 0.075 =', k8, 2) + ' m³ = ' + ck('10.8 × 8.4 × 0.075 ÷ 0.9144 x³ =', k8 / YD3, 2) + ' yd³', lines: 3 })
    ),
    B.grid2(
      B.prob({ q: 'Under the same slab, Sentence 9.16.2.1.(1) (' + pg('9-129') + ') sets the least depth of coarse clean granular material. What is it, and how many m³ are needed?', a: '100 mm. ' + ck('10.8 × 8.4 × 0.1 =', k9, 3) + ' m³', lines: 4 }),
      B.prob({ q: 'Must granular material be placed under the slab of a detached garage? Use Sentence 9.16.2.1.(2) (' + pg('9-129') + ').', a: 'No. Clause (2)(a) says granular material need not be installed under slabs in garages, carports or accessory buildings', lines: 4 })
    ),
    B.grid2(
      B.prob({ q: 'The top of a footing is 1.8 m below finished ground. Sentence 9.15.4.6.(1) (' + pg('9-127') + ') says exterior foundation walls extend not less than 150 mm above finished ground. What is the least wall height? Find the concrete for a 200 mm wall of that height, 36 m long.', a: '1.8 + 0.15 = 1.95 m. ' + ck('0.2 × 1.95 × 36 =', k11, 2) + ' m³', lines: 4 }),
      B.prob({ q: 'A trench 36 m long, 0.8 m wide and 2.0 m deep holds a 450 mm by 150 mm footing and a 200 mm wall that rises from the footing past the top of the trench. How much backfill fills the trench?', a: ck('36 × 0.8 × 2 − 0.45 × 0.15 × 36 − 0.2 × 1.85 × 36 =', k12, 2) + ' m³', work: 'Trench 57.6 m³, footing 2.43 m³, wall in the trench 13.32 m³', lines: 4 })
    )
  ]);
};
