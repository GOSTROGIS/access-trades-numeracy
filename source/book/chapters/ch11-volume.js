/* Chapter 11: Volume and Capacity. Every number is computed here and cross-checked against the Shapes engine where a
   solid exists. Capacity factors: 1 L = 1,000 cm³ and 1 m³ = 1,000 L (SI), 1 US gal = 231 in³ (NIST SP 1038),
   1 in³ = 16.387064 cm³ (NIST, exact), so 1 US gal = 3.785411784 L, as in the hub units module (units/gen.js). */
module.exports = function (B, L) {
  const F = require('../engine/figs.js');
  const C = F.C;
  const n = L.num;
  const PI = Math.PI;
  const r2 = x => L.round(x, 2);
  const n2 = x => n(r2(x), 2);
  const USGAL_IN3 = 231, USGAL_L = 3.785411784, IMPGAL_L = 4.54609;
  if (Math.abs(USGAL_IN3 * 16.387064 / 1000 - USGAL_L) > 1e-12) throw new Error('US gallon factor check');

  function xc(id, p, key, v) {
    const it = B.shapeCalc(id, p, 'mm').items.find(i => i.key === key);
    if (!it || Math.abs(it.value - v) > 1e-6 * Math.max(1, Math.abs(v))) throw new Error('ch11 cross-check ' + id + ' ' + key + ': ' + v + ' vs ' + (it && it.value));
    return v;
  }

  const G = require('../engine/figs-ch10.js')(B, L);
  const mmA = v => n(v) + ' mm';

  /* ---------- numbers ---------- */
  const tank = { l: 1200, w: 600, h: 500 }, tankV = xc('rectangular-prism', tank, 'V', tank.l * tank.w * tank.h);
  const trough = { b: 400, h: 300, l: 1000 }, troughA = trough.b * trough.h / 2, troughV = xc('triangular-prism', trough, 'V', troughA * trough.l);
  const ang = { a: 100, b: 75, t: 10, L: 300 }, angA1 = ang.a * ang.t, angA2 = (ang.b - ang.t) * ang.t, angV = xc('angle-iron', ang, 'V', (angA1 + angA2) * ang.L);
  const ti = { l: 24, w: 18, h: 12 }, tiV = ti.l * ti.w * ti.h, tiGal = tiV / USGAL_IN3, tiL = tiGal * USGAL_L;
  const vt = { r: 400, h: 1200 }, vtV = xc('cylinder', vt, 'V', PI * vt.r * vt.r * vt.h);
  const pipeID = 102, pipeLen = 30, pipeV = PI * Math.pow(pipeID / 2000, 2) * pipeLen, pipeL = pipeV * 1000;
  const lpm = d => PI * Math.pow(d / 2000, 2) * 1000;
  const cone = { r: 400, h: 600 }, coneV = xc('cone', cone, 'V', PI * cone.r * cone.r * cone.h / 3);
  const pyr = { b: 600, h: 400 }, pyrV = xc('square-pyramid', pyr, 'V', pyr.b * pyr.b * pyr.h / 3);
  const sph = { r: 150 }, sphV = xc('sphere', sph, 'V', 4 / 3 * PI * Math.pow(sph.r, 3));
  const cap = { r: 300, l: 1200 }, capA = PI * cap.r * cap.r * cap.l, capB = 4 / 3 * PI * Math.pow(cap.r, 3), capV = xc('capsule', cap, 'V', capA + capB);
  const hop = { D: 1000, hc: 800, hk: 600 }, hopA = PI * 500 * 500 * hop.hc, hopB = PI * 500 * 500 * hop.hk / 3, hopV = hopA + hopB;
  xc('cylinder', { r: 500, h: hop.hc }, 'V', hopA); xc('cone', { r: 500, h: hop.hk }, 'V', hopB);
  const tube = { R: 30, r: 25, h: 2000 }, tubeV = xc('pipe', tube, 'V', PI * (tube.R * tube.R - tube.r * tube.r) * tube.h);

  /* worksheet numbers */
  const q1 = { l: 1000, w: 500, h: 400 }, q1V = xc('rectangular-prism', q1, 'V', q1.l * q1.w * q1.h);
  const q2 = { s: 300 }, q2V = xc('cube', q2, 'V', Math.pow(q2.s, 3));
  const q3 = { b: 600, h: 400, l: 1000 }, q3V = xc('triangular-prism', q3, 'V', q3.b * q3.h / 2 * q3.l);
  const q4 = { r: 250, h: 800 }, q4V = xc('cylinder', q4, 'V', PI * q4.r * q4.r * q4.h);
  const q5 = { r: 300, h: 450 }, q5V = xc('cone', q5, 'V', PI * q5.r * q5.r * q5.h / 3);
  const q6 = { l: 1000, w: 800, h: 600 }, q6L = q6.l * q6.w * q6.h / 1e6;
  const s1 = { r: 200 }, s1V = xc('sphere', s1, 'V', 4 / 3 * PI * Math.pow(s1.r, 3));
  const h2A = PI * 400 * 400 * 600, h2B = PI * 400 * 400 * 450 / 3, h2V = h2A + h2B;
  const c3 = { r: 250, l: 1000 }, c3V = xc('capsule', c3, 'V', PI * c3.r * c3.r * c3.l + 4 / 3 * PI * Math.pow(c3.r, 3));
  const i4 = 30 * 20 * 16, i4g = i4 / USGAL_IN3;
  const k1a = PI * 100 * 100 * 500 / 1e6, k1b = PI * 200 * 200 * 500 / 1e6;
  const k3a = PI * Math.pow(0.025, 2) * 20 * 1000, k3b = PI * Math.pow(0.05, 2) * 20 * 1000;
  const nt = { r: 150, h: 400 }, ntV = xc('cylinder', nt, 'V', PI * nt.r * nt.r * nt.h);

  /* an example that may break between its steps and its calculator box. The calculator box and the answer stay
     together, so an answer line never starts a page on its own */
  function exL(o) {
    const c = o.calc;
    if (!c || (o.fig && !o.breakable)) return B.example(o);
    B.ex++;
    const top = '<div class="hd" style="background:var(--red1);padding:5pt 11pt;font:700 10pt Archivo,sans-serif;color:var(--deep8)"><span class="n" style="color:var(--red);margin-right:6pt">Example ' + B.ch + '.' + B.ex + '</span>' + (o.title || '') + '</div><div class="bd">' +
      (o.fig ? '<div class="fig">' + o.fig + '</div>' : '') + (o.q ? '<div class="q">' + o.q + '</div>' : '') +
      (o.steps && o.steps.length ? '<div class="lbl">Solution</div><ol class="steps">' + o.steps.map(x => '<li>' + x + '</li>').join('') + '</ol>' : '') + (o.after || '') + '<div class="clear"></div></div>';
    const bottom = '<div class="bd" style="padding-top:0">' + B.calc(c) + (o.answer ? '<div class="a">' + o.answer + '</div>' : '') + '</div>';
    return '<div class="ex long"><div class="keep">' + top + '</div><div class="keep">' + bottom + '</div></div>';
  }


  return L.join([
    B.chapter({
      num: 11, id: 'volume', title: 'Volume and Capacity',
      intro: B.p('Volume is the amount of space a solid takes up or holds. You need it to size a tank, to know how much water fills a pipe run before a pressure test, and to work out what a hopper holds. This chapter counts cubic units, builds the volume formulas for prisms, cylinders, cones, pyramids and spheres, and changes volumes into litres and US gallons.'),
      objectives: ['Explain volume and use cubic units', 'Find the volume of prisms with V = end area × length', 'Find the volume of cylinders, tanks and pipes', 'Find the volume of cones, pyramids and spheres', 'Change volumes into litres and US gallons', 'Break a composite solid into basic solids'],
      words: ['volume', 'cubic unit', 'prism', 'cylinder', 'cone and pyramid', 'sphere', 'capacity'],
      art: G.row(G.cubes(4, 3, 2, { s: 24 }), G.cyl(300, 800, { max: '1.9in', ph: 100 }), G.cone(300, 400, { max: '1.7in', ph: 80 }))
    }),

    B.section('Volume and cubic units'),
    B.p(B.term('Volume', 'The amount of space a solid takes up or holds, measured in cubic units.') + ' is the amount of space a solid takes up or holds. Length uses one direction and area uses two. Volume uses three: length, width and height.',
      'Volume is counted in cubes. A ' + B.term('cubic unit', 'A cube that is 1 unit long on each edge, such as 1 mm³, 1 cm³, 1 m³, 1 in³ or 1 ft³. Volume is counted in cubic units.') + ' is a cube 1 unit long on each edge. A cube 1 cm on each edge is 1 cubic centimetre, written 1 cm³. The small 3 shows that three lengths were multiplied. The cubic units in this book are mm³, cm³ and m³, and in³ and ft³.'),
    B.figure(G.cubes(4, 3, 2, { s: 30, dims: ['4 cm', '3 cm', '2 cm'] }), 'One layer holds 4 × 3 = 12 cubes of 1 cm³. Two layers hold 12 × 2 = 24 cm³.'),
    B.p('Changing between cubic units uses the length factor three times. A cubic centimetre is 10 mm × 10 mm × 10 mm = 1,000 mm³. A cubic metre is 1,000 mm × 1,000 mm × 1,000 mm = 1,000,000,000 mm³. A cubic foot is 12 in × 12 in × 12 in = 1,728 in³.'),
    B.watch('Three factors, not one', 'To change mm³ to m³, divide by 1,000,000,000 (1,000 three times). Dividing by 1,000 only changes a length. Many people find it easier to change each length to metres first and then multiply.'),
    B.tryIt([
      { q: 'A block of 1 cm cubes is 5 long, 2 wide and 3 high. How many cm³?', a: '30 cm³' },
      { q: 'How many mm³ are in 1 cm³?', a: '1,000 mm³' },
      { q: 'How many in³ are in 2 ft³?', a: n(2 * 1728) + ' in³' },
      { q: 'Which is a volume: 8 m, 8 m² or 8 m³?', a: '8 m³' }
    ]),

    B.section('Prisms'),
    B.p('A ' + B.term('prism', 'A solid with two identical, parallel ends joined by flat sides. Every slice parallel to the ends is the same shape.') + ' is a solid with two identical, parallel ends joined by flat sides. Cut a slice anywhere along it and the slice is the same shape as the end. A box, a triangular trough and a length of angle bar are all prisms.',
      'Think of the end as one layer. The volume is the area of that layer times how many layers there are, which is the length.'),
    B.formula('Volume of a prism', ['V = end area × length', 'Box: V = l × w × h'], 'Find the end area with the formulas from Chapter 10. All lengths in the same unit.'),
    exL({
      title: 'A rectangular tank',
      q: 'A tank is ' + mmA(tank.l) + ' long, ' + mmA(tank.w) + ' wide and ' + mmA(tank.h) + ' high inside. Find its volume in mm³ and in m³.',
      fig: G.box(tank.l, tank.w, tank.h, { max: '2.2in', ph: 100 }),
      steps: ['V = l × w × h = ' + n(tank.l) + ' × ' + tank.w + ' × ' + tank.h + ' = ' + n(tankV) + ' mm³.', 'In metres the tank is 1.2 m by 0.6 m by 0.5 m.', 'V = 1.2 × 0.6 × 0.5 = ' + n(tankV / 1e9) + ' m³.'],
      calc: { rows: [{ label: 'mm³', seq: tank.l + ' × ' + tank.w + ' × ' + tank.h + ' =', expect: n(tankV) }, { label: 'm³', seq: '1.2 × 0.6 × 0.5 =', expect: n(tankV / 1e9) }] },
      answer: n(tankV) + ' mm³ = ' + n(tankV / 1e9) + ' m³'
    }),
    exL({
      title: 'A triangular trough',
      q: 'A trough is a triangular prism. Its end is a triangle with a base of ' + mmA(trough.b) + ' and a height of ' + mmA(trough.h) + '. The trough is ' + mmA(trough.l) + ' long. Find the volume in m³.',
      fig: G.trough(trough.b, trough.h, trough.l, { max: '2.6in', ph: 70 }),
      steps: ['End area: ' + trough.b + ' × ' + trough.h + ' ÷ 2 = ' + n(troughA) + ' mm².', 'Volume: ' + n(troughA) + ' × ' + n(trough.l) + ' = ' + n(troughV) + ' mm³.', 'In m³: ' + n(troughV) + ' ÷ 1,000,000,000 = ' + n(troughV / 1e9) + ' m³.'],
      calc: { seq: trough.b + ' × ' + trough.h + ' ÷ 2 × ' + trough.l + ' ÷ 1000000000 =', expect: n(troughV / 1e9) },
      answer: n(troughV / 1e9) + ' m³'
    }),
    exL({
      title: 'Break down the end of an angle bar',
      q: 'An angle bar has legs of ' + mmA(ang.a) + ' and ' + mmA(ang.b) + ', is ' + mmA(ang.t) + ' thick and ' + mmA(ang.L) + ' long. Find the volume of steel in cm³.',
      fig: G.angleEnd(ang.a, ang.b, ang.t, { max: '2.4in', ph: 110 }),
      steps: ['Break the L-shaped end into two rectangles. Upright: ' + ang.a + ' × ' + ang.t + ' = ' + n(angA1) + ' mm². Flat leg without the corner: (' + ang.b + ' − ' + ang.t + ') × ' + ang.t + ' = ' + n(angA2) + ' mm².', 'End area: ' + n(angA1 + angA2) + ' mm². Volume: ' + n(angA1 + angA2) + ' × ' + n(ang.L) + ' = ' + n(angV) + ' mm³.', 'In cm³ (1 cm³ = 1,000 mm³): ' + n(angV) + ' ÷ 1,000 = ' + n(angV / 1000) + ' cm³.'],
      calc: { seq: (angA1 + angA2) + ' × ' + ang.L + ' ÷ 1000 =', expect: n(angV / 1000) },
      answer: n(angV / 1000) + ' cm³'
    }),
    B.tryIt([
      { q: 'Box 800 mm by 500 mm by 300 mm. Volume in m³?', a: n(0.8 * 0.5 * 0.3, 2) + ' m³' },
      { q: 'Box 24 in by 18 in by 12 in. Volume in in³ and ft³?', a: n(tiV) + ' in³ = ' + n(tiV / 1728) + ' ft³' },
      { q: 'Triangular prism: end base 0.5 m, end height 0.4 m, length 3 m. Volume?', a: n(0.5 * 0.4 / 2 * 3, 1) + ' m³' },
      { q: 'A flat bar 50 mm by 10 mm, 2,000 mm long. Volume in cm³?', a: n(50 * 10 * 2000 / 1000) + ' cm³' }
    ]),

    B.section('Capacity: litres and US gallons'),
    B.p(B.term('Capacity', 'How much a container holds, usually given in litres (L) or gallons.') + ' is how much a container holds. Liquids are measured in litres (L) or in gallons. The litre is tied to the cubic units: a cube 10 cm (100 mm) on each edge holds exactly 1 L.'),
    B.figure(G.cubes(1, 1, 1, { s: 80, dims: ['100 mm', '100 mm', '100 mm'], label: '1 L' }), 'A cube 100 mm on each edge: 10 cm × 10 cm × 10 cm = 1,000 cm³ = 1 L.'),
    B.table(['Volume', 'Capacity', 'Exact or rounded', 'Source'], [
      ['1,000 cm³', '1 L', 'exact', 'SI definition of the litre'],
      ['1,000,000 mm³', '1 L', 'exact', '100 mm × 100 mm × 100 mm'],
      ['1 m³', '1,000 L', 'exact', 'SI definition of the litre'],
      ['231 in³', '1 US gal', 'exact', 'NIST SP 1038'],
      ['1 US gal', '3.785411784 L', 'exact', '231 × 16.387064 cm³ (NIST)']
    ], { caption: 'Capacity factors. The gallon factors are the NIST SP 1038 factors used in Chapter 7.', align: ['r', 'r', '', ''] }),
    exL({
      title: 'Litres in a tank',
      q: 'How many litres does the ' + n(tank.l) + ' mm by ' + tank.w + ' mm by ' + tank.h + ' mm tank from Example 11.1 hold?',
      steps: ['Its volume is ' + n(tankV) + ' mm³, which is ' + n(tankV / 1e9) + ' m³.', 'Method 1: 1 L = 1,000,000 mm³, so ' + n(tankV) + ' ÷ 1,000,000 = ' + n(tankV / 1e6) + ' L.', 'Method 2: 1 m³ = 1,000 L, so ' + n(tankV / 1e9) + ' × 1,000 = ' + n(tankV / 1e6) + ' L.'],
      calc: { seq: tankV + ' ÷ 1000000 =', expect: n(tankV / 1e6) },
      answer: n(tankV / 1e6) + ' L'
    }),
    B.check('0.36 × 1000 =', n(tankV / 1e6)),
    exL({
      title: 'A tank in US gallons and litres',
      q: 'A US-made tank is ' + ti.l + ' in by ' + ti.w + ' in by ' + ti.h + ' in inside. Find its capacity in US gallons and in litres, to two decimal places.',
      steps: ['Volume: ' + ti.l + ' × ' + ti.w + ' × ' + ti.h + ' = ' + n(tiV) + ' in³.', 'US gallons: 1 US gal = 231 in³, so ' + n(tiV) + ' ÷ 231 = ' + n2(tiGal) + ' US gal.', 'Litres: multiply the full gallon value by 3.785411784: ' + n2(tiL) + ' L.'],
      calc: { rows: [{ label: 'US gallons', seq: ti.l + ' × ' + ti.w + ' × ' + ti.h + ' ÷ 231 =', expect: n2(tiGal) }, { label: 'Litres', seq: ti.l + ' × ' + ti.w + ' × ' + ti.h + ' ÷ 231 × 3.785411784 =', expect: n2(tiL) }] },
      answer: n2(tiGal) + ' US gal = ' + n2(tiL) + ' L'
    }),
    B.watch('Two different gallons', 'The US gallon is defined as 231 in³, which is 3.785411784 L (NIST SP 1038). The imperial gallon is defined as 4.54609 L (Weights and Measures Act). Check which gallon a label means. This book uses US gallons.'),
    B.tryIt([
      { q: 'Write 2.5 m³ in litres.', a: n(2500) + ' L' },
      { q: 'A tank is 1,000 mm by 500 mm by 400 mm inside. Litres?', a: n(1000 * 500 * 400 / 1e6) + ' L' },
      { q: '50 US gal in litres, to two decimal places?', a: n2(50 * USGAL_L) + ' L' },
      { q: '200 L in US gallons, to two decimal places?', a: n2(200 / USGAL_L) + ' US gal' },
      { q: 'A box 12 in by 11 in by 7 in. US gallons?', a: n(12 * 11 * 7 / 231) + ' US gal (924 ÷ 231)' },
      { q: 'How many litres in 1 ft³? Use 1 ft³ = 1,728 in³. Two decimal places.', a: n2(1728 / 231 * USGAL_L) + ' L' }
    ]),

    B.section('Cylinders: tanks and pipes'),
    B.p('A ' + B.term('cylinder', 'A solid with two equal, parallel circular ends joined by a curved side.') + ' has two equal circular ends joined by a curved side. It works like a prism: every slice is the same circle. So its volume is the circle area times the height (or length).'),
    B.formula('Volume of a cylinder', ['V = π × r² × h'], 'r = radius of the end, h = height or length. For a pipe, h is the length of the run.'),
    exL({
      title: 'A vertical tank',
      q: 'A vertical tank is ' + mmA(2 * vt.r) + ' across inside and ' + mmA(vt.h) + ' high. How many litres does it hold, to two decimal places?',
      fig: G.cyl(vt.r, vt.h, { lab: 'D', max: '1.5in', ph: 120 }),
      steps: ['Radius: ' + 2 * vt.r + ' ÷ 2 = ' + vt.r + ' mm.', 'V = π × ' + vt.r + '² × ' + n(vt.h) + ' = ' + n2(vtV) + ' mm³.', 'Litres: ÷ 1,000,000 gives ' + n2(vtV / 1e6) + ' L.'],
      calc: { seq: 'π × ' + vt.r + ' x² × ' + vt.h + ' ÷ 1000000 =', expect: n2(vtV / 1e6) },
      answer: n2(vtV / 1e6) + ' L'
    }),
    exL({
      title: 'Filling a pipe run',
      q: 'A pipe run is ' + pipeLen + ' m long and the pipe has an inside diameter of ' + pipeID + ' mm. How many litres of water fill it, to two decimal places?',
      steps: ['Work in metres. Inside radius: ' + pipeID + ' ÷ 2 = 51 mm = 0.051 m.', 'V = π × 0.051² × ' + pipeLen + ' = ' + n(L.round(pipeV, 5), 5) + ' m³.', 'Litres: × 1,000 = ' + n2(pipeL) + ' L.'],
      calc: { seq: 'π × 0.051 x² × ' + pipeLen + ' × 1000 =', expect: n2(pipeL) },
      answer: n2(pipeL) + ' L'
    }),
    B.watch('Use the inside diameter', 'Capacity uses the inside diameter, because the water fills the inside. The outside diameter tells you how much space the pipe or tank takes up.'),
    B.table(['Inside diameter', 'Litres per metre', 'Compared with 25 mm'], [25, 50, 100, 200].map(d => [d + ' mm', n2(lpm(d)), n(lpm(d) / lpm(25)) + (lpm(d) / lpm(25) === 1 ? ' time' : ' times')])
      , { caption: 'Litres per metre of pipe, π × r² × 1 m × 1,000. Doubling the diameter holds 2 × 2 = 4 times as much.', align: ['r', 'r', 'r'] }),
    B.check('π × 0.0125 x² × 1000 =', n2(lpm(25))),
    B.tryIt([
      { q: 'Tank 600 mm across inside, 900 mm high. Litres to two decimal places?', a: n2(PI * 300 * 300 * 900 / 1e6) + ' L' },
      { q: 'Pipe, inside diameter 50 mm, 40 m long. Litres to two decimal places?', a: n2(PI * 0.025 * 0.025 * 40 * 1000) + ' L' },
      { q: 'Tank 24 in across inside, 36 in tall. US gallons to two decimal places?', a: n2(PI * 144 * 36 / 231) + ' US gal' },
      { q: 'Pipe, inside diameter 150 mm. Litres per metre to two decimal places?', a: n2(lpm(150)) + ' L' }
    ]),

    B.section('Cones and pyramids'),
    B.p('A ' + B.term('cone', 'A solid with a circular base that narrows to a point (the apex).') + ' has a circular base that narrows to a point. A ' + B.term('pyramid', 'A solid with a flat base, often a square, and triangular sides that meet at a point (the apex).') + ' has a flat base, often a square, and triangular sides that meet at a point. A cone holds one third of a cylinder with the same base and height, and a pyramid holds one third of a prism with the same base and height.'),
    B.figure(G.row(G.cone(cone.r, cone.h, { max: '2in', ph: 110 }), G.pyramid(pyr.b, pyr.h, { max: '2.4in', ph: 100 })), 'A cone and a square pyramid. Each height is the dashed line from the apex straight down to the centre of the base.'),
    B.formula('Volume of a cone and a pyramid', ['V = base area × h ÷ 3', 'Cone: V = π × r² × h ÷ 3', 'Square pyramid: V = b² × h ÷ 3'], 'h = height at right angles to the base, not the sloping side.'),
    exL({
      title: 'A cone-shaped hopper',
      q: 'A cone-shaped hopper has a radius of ' + mmA(cone.r) + ' and a height of ' + mmA(cone.h) + '. How many litres does it hold, to two decimal places?',
      steps: ['Base area: π × ' + cone.r + '² = ' + n2(PI * cone.r * cone.r) + ' mm².', 'V = ' + n2(PI * cone.r * cone.r) + ' × ' + cone.h + ' ÷ 3 = ' + n2(coneV) + ' mm³.', 'Litres: ÷ 1,000,000 = ' + n2(coneV / 1e6) + ' L.'],
      calc: { seq: 'π × ' + cone.r + ' x² × ' + cone.h + ' ÷ 3 ÷ 1000000 =', expect: n2(coneV / 1e6) },
      answer: n2(coneV / 1e6) + ' L'
    }),
    B.tryIt([
      { q: 'Cone, radius 300 mm, height 400 mm. Litres to two decimal places?', a: n2(PI * 90000 * 400 / 3 / 1e6) + ' L' },
      { q: 'Square pyramid, base 600 mm, height 400 mm. Litres?', a: n(pyrV / 1e6) + ' L (600² × 400 ÷ 3 = ' + n(pyrV) + ' mm³)' },
      { q: 'Square pyramid, base 12 in, height 10 in. Volume in in³?', a: n(144 * 10 / 3) + ' in³' },
      { q: 'A cone has a radius of 300 mm, a height of 400 mm and a sloping side of 500 mm. Which length goes into the formula as h?', a: '400 mm, the height at right angles to the base' }
    ]),

    B.section('Spheres'),
    B.p('A ' + B.term('sphere', 'A perfectly round ball. Every point on its surface is the same distance (the radius) from its centre.') + ' is a perfectly round ball. Every point on its surface is the same distance, the radius, from the centre. Half a sphere is a hemisphere.'),
    B.formula('Volume of a sphere', ['V = 4 ÷ 3 × π × r³', 'Hemisphere: half of that'], 'r = radius. r³ means r × r × r. Use the x³ key, or yˣ 3.'),
    exL({
      title: 'A spherical float',
      q: 'A spherical float has a radius of ' + mmA(sph.r) + '. Find its volume in litres, to two decimal places.',
      fig: G.sphere(sph.r, { max: '1.7in', ph: 90 }),
      steps: ['r³ = ' + sph.r + ' × ' + sph.r + ' × ' + sph.r + ' = ' + n(Math.pow(sph.r, 3)) + '.', 'V = 4 ÷ 3 × π × ' + n(Math.pow(sph.r, 3)) + ' = ' + n2(sphV) + ' mm³.', 'Litres: ÷ 1,000,000 = ' + n2(sphV / 1e6) + ' L.'],
      calc: { seq: '4 ÷ 3 × π × ' + sph.r + ' x³ ÷ 1000000 =', expect: n2(sphV / 1e6) },
      answer: n2(sphV / 1e6) + ' L'
    }),
    B.tryIt([
      { q: 'Sphere, radius 100 mm. Litres to two decimal places?', a: n2(4 / 3 * PI * 1e6 / 1e6) + ' L' },
      { q: 'Hemisphere, radius 300 mm. Litres to two decimal places?', a: n2(xc('hemisphere', { r: 300 }, 'V', 2 / 3 * PI * 27e6) / 1e6) + ' L' },
      { q: 'Sphere, diameter 1 m. m³ to three decimal places?', a: n(L.round(4 / 3 * PI * 0.125, 3), 3) + ' m³' },
      { q: 'Sphere, radius 6 in. Volume in in³ to two decimal places?', a: n2(4 / 3 * PI * 216) + ' in³' }
    ]),

    B.section('Composite solids'),
    B.p('Many tanks and hoppers are composite solids. Break the solid into basic solids, find each volume, and add. Take away the volume of any hollow part.'),
    exL({
      title: 'A tank with round ends',
      q: 'A tank is a cylinder ' + mmA(cap.l) + ' long with a hemisphere on each end. The radius is ' + mmA(cap.r) + '. How many litres does it hold, to two decimal places?',
      fig: G.capsuleSide(cap.r, cap.l, { max: '2.6in', ph: 80 }), breakable: true,
      steps: ['The two hemispheres make one sphere. Cylinder: π × ' + cap.r + '² × ' + n(cap.l) + ' = ' + n2(capA) + ' mm³.', 'Sphere: 4 ÷ 3 × π × ' + cap.r + '³ = ' + n2(capB) + ' mm³.', 'Total: ' + n2(capV) + ' mm³ = ' + n2(capV / 1e6) + ' L.'],
      calc: { seq: '( π × ' + cap.r + ' x² × ' + cap.l + ' + 4 ÷ 3 × π × ' + cap.r + ' x³ ) ÷ 1000000 =', expect: n2(capV / 1e6) },
      answer: n2(capV / 1e6) + ' L'
    }),
    exL({
      title: 'A hopper',
      q: 'A hopper is a cylinder ' + mmA(hop.D) + ' across and ' + mmA(hop.hc) + ' high, on top of a cone ' + mmA(hop.hk) + ' high. Find the capacity in litres, to two decimal places.',
      fig: G.hopper(hop.D, hop.hc, hop.hk, { max: '2.2in', ph: 130 }), breakable: true,
      steps: ['Radius: ' + n(hop.D) + ' ÷ 2 = 500 mm.', 'A, cylinder: π × 500² × ' + hop.hc + ' = ' + n2(hopA) + ' mm³.', 'B, cone: π × 500² × ' + hop.hk + ' ÷ 3 = ' + n2(hopB) + ' mm³.', 'A + B = ' + n2(hopV) + ' mm³ = ' + n2(hopV / 1e6) + ' L.'],
      calc: { seq: '( π × 500 x² × ' + hop.hc + ' + π × 500 x² × ' + hop.hk + ' ÷ 3 ) ÷ 1000000 =', expect: n2(hopV / 1e6) },
      answer: n2(hopV / 1e6) + ' L'
    }),
    B.keyidea('Change one value', 'Double the radius of a cylinder and its volume becomes 2 × 2 = 4 times bigger, because r is squared. Double every length of a solid, and the volume becomes 2 × 2 × 2 = 8 times bigger.'),
    B.tryIt([
      { q: 'Tube: outside diameter 60 mm, inside diameter 50 mm, 2,000 mm long. Volume of metal in cm³, to two decimal places?', a: n2(tubeV / 1000) + ' cm³' },
      { q: 'A cylinder 400 mm across and 500 mm high sits on a cone 300 mm high with the same radius. Litres to two decimal places?', a: n2((PI * 40000 * 500 + PI * 40000 * 300 / 3) / 1e6) + ' L' },
      { q: 'A rectangular tank 1,200 mm by 600 mm is filled to a depth of 350 mm. Litres?', a: n(1200 * 600 * 350 / 1e6) + ' L' },
      { q: 'A cylinder holds 20 L. The radius is doubled and the height kept. How many litres now?', a: '80 L (4 times)' }
    ]),

    B.worksheet({ title: 'Find the volume', sub: 'Practice mode: one drawing hides a dimension behind a red ?', intro: 'Write the formula and the numbers. Round to two decimal places where π is used.' }),
    B.grid2(
      B.prob({ q: 'Volume in m³? Capacity in litres?', canvas: G.box(q1.l, q1.w, q1.h, { wTop: true, max: '2.2in', ph: 50, pad: [44, 26, 74, 30] }), a: n(q1V / 1e9, 1) + ' m³ = ' + n(q1V / 1e6) + ' L', lines: 2 }),
      B.prob({ q: 'Volume of the cube in mm³ and in litres?', canvas: G.box(q2.s, q2.s, q2.s, { edge: 'edge 300 mm', max: '2in', ph: 64 }), a: n(q2V) + ' mm³ = ' + n(q2V / 1e6) + ' L', lines: 2 })
    ),
    B.grid2(
      B.prob({ q: 'Capacity of the trough in litres?', canvas: G.trough(q3.b, q3.h, q3.l, { max: '2.6in', ph: 40 }), a: n(q3V / 1e6) + ' L', work: '600 × 400 ÷ 2 × 1,000', lines: 2 }),
      B.prob({ q: 'The tank holds ' + n(q6L) + ' L. Find the ?', canvas: G.box(q6.l, q6.w, q6.h, { ask: ['h'], wTop: true, max: '2.2in', ph: 50, pad: [44, 26, 74, 30] }), a: n(q6.h) + ' mm', work: n(q6L) + ' L = ' + n(q6L * 1e6) + ' mm³, ÷ (1,000 × 800)', lines: 2 })
    ),
    B.grid2(
      B.prob({ q: 'Capacity of the cylinder in litres?', canvas: G.cyl(q4.r, q4.h, { max: '2in', ph: 60 }), a: n2(q4V / 1e6) + ' L', lines: 2 }),
      B.prob({ q: 'Capacity of the cone in litres?', canvas: G.cone(q5.r, q5.h, { max: '1.9in', ph: 54 }), a: n2(q5V / 1e6) + ' L', lines: 2 })
    ),

    B.worksheet({ title: 'Tanks and hoppers', sub: 'Break each solid into basic solids', intro: 'Find each part, then add. Give answers to two decimal places.' }),
    B.grid2(
      B.prob({ q: 'Find the capacity of the hopper in litres.', canvas: G.hopper(800, 600, 450, { max: '2.4in', ph: 120 }), a: n2(h2V / 1e6) + ' L', work: 'A = π × 400² × 600, B = π × 400² × 450 ÷ 3', lines: 3 }),
      B.prob({ q: 'The tank has a hemisphere on each end. Find its capacity in litres.', canvas: G.capsuleSide(c3.r, c3.l, { max: '2.6in', ph: 80 }), a: n2(c3V / 1e6) + ' L', work: 'Cylinder π × 250² × 1,000 plus one sphere 4 ÷ 3 × π × 250³', lines: 3 })
    ),
    B.grid2(
      B.prob({ q: 'Find the capacity of the spherical tank in litres.', canvas: G.sphere(s1.r, { max: '1.8in', ph: 90 }), a: n2(s1V / 1e6) + ' L', lines: 3 }),
      B.prob({ q: 'A US-made tank is 30 in by 20 in by 16 in inside. Find its capacity in US gallons.', canvas: G.box(30, 20, 16, { unit: 'in', max: '2.2in', ph: 90 }), a: n(i4) + ' in³ ÷ 231 = ' + n2(i4g) + ' US gal', lines: 3 })
    ),

    B.worksheet({ title: 'Change one value', sub: 'Unfold it, fold it back, and see what changes', intro: 'Give answers to two decimal places. For each pair, say how many times bigger the second answer is.' }),
    B.grid2(
      B.prob({ q: 'Both cylinders are 500 mm high. The radius doubles from 100 mm to 200 mm. Find both capacities in litres.', canvas: G.row(G.cyl(100, 500, { rBelow: true, noH: true, max: '2in', ph: 90, pad: [26, 8, 26, 30] }), G.cyl(200, 500, { rBelow: true, noH: true, max: '2in', ph: 108, pad: [16, 8, 16, 30] })) + '<div style="font-size:7.5pt;text-align:center">Both are 500 mm high.</div>', a: n2(k1a) + ' L and ' + n2(k1b) + ' L, 4 times bigger', lines: 3 }),
      B.prob({ q: 'A cube edge doubles from 200 mm to 400 mm. Find both capacities in litres.', canvas: G.row(G.box(200, 200, 200, { edge: 'edge 200 mm', max: '2in', ph: 44, pad: [24, 10, 24, 26] }), G.box(400, 400, 400, { edge: 'edge 400 mm', max: '2in', ph: 88 })), a: '8 L and 64 L, 8 times bigger', lines: 3 })
    ),
    B.grid2(
      B.prob({ q: 'A 20 m pipe run has an inside diameter of 50 mm. A second run of the same length is 100 mm inside. How many litres fills each?', a: n2(k3a) + ' L and ' + n2(k3b) + ' L, 4 times bigger', work: 'π × 0.025² × 20 × 1,000 and π × 0.05² × 20 × 1,000', lines: 3 }),
      B.prob({ q: 'This net folds up into a closed cylinder. Find the capacity of the cylinder in litres.', canvas: G.cylNet(nt.r, nt.h, { circ: 'D', max: '2.4in', ph: 140 }), a: n2(ntV / 1e6) + ' L', work: 'The circles are 300 mm across, so r = 150 mm. The height is 400 mm', lines: 3 })
    )
  ]);
};
