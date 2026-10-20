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

  /* ---------- 11.8 to 11.10 (Oct 2026). New sections go after 11.7 so earlier numbers do not move ----------
     Cubic yard: 1 yd = 0.9144 m exactly (Weights and Measures Act, hub units module), so 1 yd³ = 0.9144³ m³.
     Code values: BCBC 2024 Division B, quoted from the code text with Article, Sentence and page.
     Densities: concrete 2,240 to 2,400 kg/m³ from FHWA, Portland Cement Concrete Materials (fhwa.dot.gov/pavement/
     pubs/013683.pdf), steel 7,850 kg/m³ from The Engineering ToolBox, Metals and Alloys - Densities, the source the
     hub units module uses. Board foot: Briggs, Forest Products Measurements and Conversion Factors, ch. 2 (University
     of Washington), and lumber sizes from the Canadian Wood Council, cwc.ca/articles/lumber */
  const PL = require('../engine/plates.js');
  const G11 = require('../engine/figs-ch11.js')(B, L);
  const YD3 = Math.pow(0.9144, 3), CONC_LO = 2240, CONC_HI = 2400, STEEL = 7850;
  if (Math.abs(YD3 - 0.764554857984) > 1e-15) throw new Error('cubic yard check');
  const money = v => '$' + n(v, 2);
  const pg = s => '<span style="white-space:nowrap">page ' + s + '</span>';
  const gs = { l: 7.2, w: 6, t: 0.1 }, gsV = gs.l * gs.w * gs.t, gsY = gsV / YD3;
  const ft1 = { fw: 250, ft: 100, ww: 200, len: 38 }, ft1P = (ft1.fw - ft1.ww) / 2, ft1V = ft1.fw / 1000 * ft1.ft / 1000 * ft1.len, ft1Y = ft1V / YD3;
  const ft2 = { fw: 350, ft: 100, ww: 200, wh: 2.4, len: 40 }, ft2P = (ft2.fw - ft2.ww) / 2, ft2F = 0.35 * 0.1 * ft2.len, ft2W = 0.2 * ft2.wh * ft2.len, ft2Y = (ft2F + ft2W) / YD3;
  const pr = { r: 0.15, h: 1.2, k: 8 }, prV = xc('cylinder', { r: 150, h: 1200 }, 'V', PI * 150 * 150 * 1200) / 1e9 * pr.k, prY = prV / YD3;
  const sl = { l: 9.6, w: 7.2, t: 0.075, g: 0.1 }, slC = sl.l * sl.w * sl.t, slG = sl.l * sl.w * sl.g;
  const bf = { len: 40, w: 0.6, d: 0.5, fw: 0.35, ft: 0.1, ww: 0.2 }, bfX = bf.len * bf.w * bf.d, bfF = bf.fw * bf.ft * bf.len, bfW = bf.ww * (bf.d - bf.ft) * bf.len, bfB = bfX - bfF - bfW;
  const stp = { l: 2.44, w: 1.22, t: 0.01 }, stV = stp.l * stp.w * stp.t, stM = stV * STEEL;
  const b1 = { t: 2, w: 6, L: 12, k: 24, mbf: 1150 }, b1E = b1.t * b1.w * b1.L / 12, b1T = b1E * b1.k, b1C = b1T / 1000 * b1.mbf;
  const b2N = 2 * 4 * 8 / 12, b2A = 1.5 * 3.5 * 8 / 12;
  const tk1 = { l: 1500, w: 1000, h: 800 }, tk1L = xc('rectangular-prism', tk1, 'V', tk1.l * tk1.w * tk1.h) / 1e6;
  const tk2 = { r: 600, h: 2500 }, tk2L = xc('cylinder', tk2, 'V', PI * tk2.r * tk2.r * tk2.h) / 1e6;

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
    B.p('Section 11.10 works out tank capacities in litres, US gallons and imperial gallons side by side.'),
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

    B.section('Concrete and steel'),
    B.p('Concrete is ordered by volume. In Canada it is ordered in cubic metres, and some plans and suppliers still use cubic yards. Slabs, footings and walls are prisms, and round piers are cylinders, so the formulas in this chapter give the volume. Change every size to metres first.',
      'A ' + B.term('cubic yard', 'A cube 1 yard (3 ft) on each edge. 1 yd³ = 27 ft³ = 0.9144³ m³, about 0.765 m³.') + ' is a cube 1 yard on each edge. A yard is exactly 0.9144 m (Weights and Measures Act), so 1 yd³ = 0.9144 × 0.9144 × 0.9144 = 0.764554857984 m³. A yard is also 3 ft, so 1 yd³ = 3 × 3 × 3 = 27 ft³.'),
    B.formula('Concrete volumes', ['m³ = length × width × thickness, all in metres', 'yd³ = m³ ÷ 0.9144³', 'yd³ = ft³ ÷ 27'], 'On the calculator, key ÷ 0.9144 x³ to change m³ into cubic yards.'),
    exL({
      title: 'A garage slab',
      q: 'A garage slab is ' + gs.l + ' m by ' + gs.w + ' m and 100 mm thick. How much concrete is that in m³ and in cubic yards, to two decimal places?',
      steps: ['Thickness in metres: 100 mm = 0.1 m.', 'V = ' + gs.l + ' × ' + gs.w + ' × 0.1 = ' + n(gsV, 2) + ' m³.', 'Cubic yards: ' + n(gsV, 2) + ' ÷ 0.9144³ = ' + n2(gsY) + ' yd³.'],
      calc: { rows: [{ label: 'm³', seq: gs.l + ' × ' + gs.w + ' × 0.1 =', expect: n(gsV, 2) }, { label: 'yd³', seq: n(gsV, 2) + ' ÷ 0.9144 x³ =', expect: n2(gsY) }] },
      answer: n(gsV, 2) + ' m³ = ' + n2(gsY) + ' yd³'
    }),
    B.p('The BC Building Code sets the smallest footing a house may have. Sentence 9.15.3.4.(1) says the minimum footing width or area must comply with Table 9.15.3.4. (' + pg('9-120') + '). For strip footings under exterior walls the table gives 250 mm for 1 floor supported, 350 mm for 2 floors and 450 mm for 3 floors. Under interior walls it gives 200 mm, 350 mm and 500 mm. Column footings, for columns spaced 3 m o.c., need 0.4 m², 0.75 m² and 1.0 m². The table applies unless Sentence (2) (supported joist spans over 4.9 m), Sentence (3) (gravel, sand or silt with a high water table) or Articles 9.15.3.5. to 9.15.3.7. change it.',
      'Sentence 9.15.3.8.(1) (' + pg('9-121') + ') sets the thickness: not less than the greater of 100 mm or the width of the projection of the footing beyond the wall it supports. For a footing centred under a wall, the projection is (footing width − wall thickness) ÷ 2.'),
    PL.figure(B, '9.15.3.4', { crop: 'draw', width: '6.5in', caption: 'Strip footings under exterior and interior walls, and a column footing, with Table 9.15.3.4. The plate shows the sizes. The code text is quoted above.' }),
    exL({
      title: 'Footings at the code minimum',
      q: 'A one-storey house with wood-frame floors has 200 mm concrete foundation walls. The strip footings under the exterior walls are centred under the walls, at the minimum width and thickness the code allows. They run ' + ft1.len + ' m in all. Find the footing size and the concrete in m³ and yd³.',
      fig: G11.footingSec(ft1.fw, ft1.ft, ft1.ww, { max: '2.3in', ph: 110 }), breakable: true,
      steps: ['Width: 1 floor supported, exterior walls, Table 9.15.3.4.: ' + ft1.fw + ' mm.', 'Projection: (' + ft1.fw + ' − ' + ft1.ww + ') ÷ 2 = ' + ft1P + ' mm.', 'Thickness, Sentence 9.15.3.8.(1): the greater of 100 mm and ' + ft1P + ' mm, so ' + ft1.ft + ' mm.', 'Volume: 0.25 × 0.1 × ' + ft1.len + ' = ' + n(ft1V, 2) + ' m³.', 'Cubic yards: ' + n(ft1V, 2) + ' ÷ 0.9144³ = ' + n2(ft1Y) + ' yd³.'],
      calc: { rows: [{ label: 'm³', seq: '0.25 × 0.1 × ' + ft1.len + ' =', expect: n(ft1V, 2) }, { label: 'yd³', seq: n(ft1V, 2) + ' ÷ 0.9144 x³ =', expect: n2(ft1Y) }] },
      answer: ft1.fw + ' mm by ' + ft1.ft + ' mm, ' + n(ft1V, 2) + ' m³ = ' + n2(ft1Y) + ' yd³'
    }),
    B.tip('Minimum is not the design', 'The code sizes are the smallest a footing may be. The drawings for a job may call for larger footings. Take the sizes from the drawings, and use the code to check that they are not below the minimum.'),
    PL.figure(B, '9.15.3.8', { crop: [40, 150, 960, 385], width: '6.5in', caption: 'Panel A: the projection p is under 100 mm, so the footing is at least 100 mm thick.' }),
    exL({
      title: 'Footing and foundation wall',
      q: 'A two-storey house has exterior footings at the Table 9.15.3.4. minimum width, centred under 200 mm walls. The walls are ' + ft2.wh + ' m high and the footing and the wall each run ' + ft2.len + ' m. Find the footing thickness, then the total concrete in m³ and yd³.',
      steps: ['Width: 2 floors supported, exterior walls: ' + ft2.fw + ' mm. Projection: (' + ft2.fw + ' − ' + ft2.ww + ') ÷ 2 = ' + ft2P + ' mm, so the thickness is the greater of 100 mm and ' + ft2P + ' mm: 100 mm.', 'Footing: 0.35 × 0.1 × ' + ft2.len + ' = ' + n(ft2F, 2) + ' m³.', 'Wall: 0.2 × ' + ft2.wh + ' × ' + ft2.len + ' = ' + n(ft2W, 2) + ' m³.', 'Total: ' + n(ft2F, 2) + ' + ' + n(ft2W, 2) + ' = ' + n(ft2F + ft2W, 2) + ' m³ = ' + n2(ft2Y) + ' yd³.', 'Sentence 9.15.4.6.(1) (' + pg('9-127') + ') also says exterior foundation walls must extend not less than 150 mm above finished ground level. Check on the drawings that the top of the wall is at least that high.'],
      calc: { rows: [{ label: 'm³', seq: '0.35 × 0.1 × ' + ft2.len + ' + 0.2 × ' + ft2.wh + ' × ' + ft2.len + ' =', expect: n(ft2F + ft2W, 2) }, { label: 'yd³', seq: n(ft2F + ft2W, 2) + ' ÷ 0.9144 x³ =', expect: n2(ft2Y) }] },
      answer: n(ft2F + ft2W, 2) + ' m³ = ' + n2(ft2Y) + ' yd³'
    }),
    exL({
      title: 'Round piers',
      q: 'A deck sits on ' + pr.k + ' round concrete piers. Each pier is 300 mm across and 1.2 m deep. How much concrete, in m³ and yd³, to two decimal places?',
      fig: G.cyl(150, 1200, { lab: 'D', max: '1.2in', ph: 110 }), breakable: true,
      steps: ['Radius: 300 ÷ 2 = 150 mm = 0.15 m.', 'One pier: π × 0.15² × 1.2 = ' + n(L.round(prV / pr.k, 4), 4) + ' m³.', 'Eight piers: × 8 = ' + n2(prV) + ' m³.', 'Cubic yards: ÷ 0.9144³ = ' + n2(prY) + ' yd³.'],
      calc: { rows: [{ label: 'm³', seq: 'π × 0.15 x² × 1.2 × 8 =', expect: n2(prV) }, { label: 'yd³', seq: 'π × 0.15 x² × 1.2 × 8 ÷ 0.9144 x³ =', expect: n2(prY) }] },
      answer: n2(prV) + ' m³ = ' + n2(prY) + ' yd³'
    }),
    B.p('A concrete floor on the ground sits on a layer of crushed stone or gravel. Sentence 9.16.4.3.(1) (' + pg('9-130') + ') says concrete slabs shall not be less than 75 mm thick, not counting any topping. Sentence 9.16.2.1.(1) (' + pg('9-129') + ') says not less than 100 mm of coarse clean granular material, with not more than 10% passing a 4 mm sieve, shall be placed beneath floors-on-ground. Sentence (2) lists the exceptions, such as slabs in garages, carports and accessory buildings.'),
    PL.figure(B, '9.16.2.1', { crop: [40, 150, 960, 385], width: '6.5in', caption: 'Panel A: the granular layer under a floor-on-ground, at least 100 mm deep.' }),
    exL({
      title: 'Slab and granular base',
      q: 'A basement floor is ' + sl.l + ' m by ' + sl.w + ' m. The slab and the granular layer under it are at the code minimum thicknesses. How much concrete and how much granular material, in m³?',
      fig: G11.slabSec(75, 100, { max: '2.5in', ph: 80 }), breakable: true,
      steps: ['Slab: 75 mm = 0.075 m. ' + sl.l + ' × ' + sl.w + ' × 0.075 = ' + n(L.round(slC, 3), 3) + ' m³.', 'Granular layer: 100 mm = 0.1 m. ' + sl.l + ' × ' + sl.w + ' × 0.1 = ' + n(L.round(slG, 3), 3) + ' m³.'],
      calc: { rows: [{ label: 'Concrete', seq: sl.l + ' × ' + sl.w + ' × 0.075 =', expect: n(L.round(slC, 3), 3) }, { label: 'Granular', seq: sl.l + ' × ' + sl.w + ' × 0.1 =', expect: n(L.round(slG, 3), 3) }] },
      answer: n(L.round(slC, 3), 3) + ' m³ of concrete, ' + n(L.round(slG, 3), 3) + ' m³ of granular material'
    }),
    exL({
      title: 'Backfill around a footing',
      q: 'A trench ' + bf.len + ' m long, ' + bf.w + ' m wide and ' + bf.d + ' m deep is dug for a footing. The footing is 350 mm wide and 100 mm thick, and the 200 mm wall on it rises from the top of the footing to the top of the trench and beyond. How much backfill is needed to fill the trench back to the top?',
      steps: ['Trench: ' + bf.len + ' × ' + bf.w + ' × ' + bf.d + ' = ' + n(bfX) + ' m³.', 'Footing: 0.35 × 0.1 × ' + bf.len + ' = ' + n(bfF, 1) + ' m³.', 'Wall inside the trench: 0.2 × (' + bf.d + ' − 0.1) × ' + bf.len + ' = ' + n(bfW, 1) + ' m³.', 'Backfill: ' + n(bfX) + ' − ' + n(bfF, 1) + ' − ' + n(bfW, 1) + ' = ' + n(bfB, 1) + ' m³.'],
      calc: { seq: bf.len + ' × ' + bf.w + ' × ' + bf.d + ' − 0.35 × 0.1 × ' + bf.len + ' − 0.2 × 0.4 × ' + bf.len + ' =', expect: n(bfB, 1) },
      answer: n(bfB, 1) + ' m³ of backfill'
    }),
    B.p('Concrete and steel are heavy. A load on a truck, a lift with a crane or a load on a beam starts from the mass, and the mass is the volume times the ' + B.term('density', 'The mass of one cubic unit of a material, such as kilograms per cubic metre (kg/m³).') + '. Density is the mass of one cubic metre of the material, in kg/m³.'),
    B.formula('Mass from volume', ['mass (kg) = volume (m³) × density (kg/m³)', '1 t (tonne) = 1,000 kg'], 'Use the density the supplier or the drawings give. The values in Table 11.3 are for practice.'),
    B.table(['Material', 'Density', 'Source'], [
      ['Concrete, normal weight', '2,240 to 2,400 kg/m³', 'FHWA, Portland Cement Concrete Materials (fhwa.dot.gov/pavement/pubs/013683.pdf), read Oct 20 2026'],
      ['Steel', '7,850 kg/m³', 'The Engineering ToolBox, Metals and Alloys: Densities (engineeringtoolbox.com), read Oct 20 2026, the source of the hub units module']
    ], { caption: 'Densities used in this chapter. Concrete varies with its stone, air and water, so the source gives a range.', align: ['', 'r', ''] }),
    exL({
      title: 'Mass of the garage slab',
      q: 'Find the mass of the ' + n(gsV, 2) + ' m³ garage slab from Example 11.12, at the low and the high end of the concrete range in Table 11.3.',
      steps: ['Low end: ' + n(gsV, 2) + ' × 2,240 = ' + n(gsV * CONC_LO, 1) + ' kg.', 'High end: ' + n(gsV, 2) + ' × 2,400 = ' + n(gsV * CONC_HI) + ' kg.', 'In tonnes: about ' + n(L.round(gsV * CONC_LO / 1000, 2), 2) + ' t to ' + n(L.round(gsV * CONC_HI / 1000, 2), 2) + ' t.'],
      calc: { rows: [{ label: 'Low', seq: n(gsV, 2) + ' × 2240 =', expect: n(gsV * CONC_LO, 1) }, { label: 'High', seq: n(gsV, 2) + ' × 2400 =', expect: n(gsV * CONC_HI) }] },
      answer: n(L.round(gsV * CONC_LO / 1000, 2), 2) + ' t to ' + n(L.round(gsV * CONC_HI / 1000, 2), 2) + ' t'
    }),
    exL({
      title: 'Mass of a steel plate',
      q: 'A steel plate is 2,440 mm by 1,220 mm and 10 mm thick. Find its mass to two decimal places, using 7,850 kg/m³.',
      steps: ['In metres: 2.44 × 1.22 × 0.01 = ' + n(L.round(stV, 6), 6) + ' m³.', 'Mass: ' + n(L.round(stV, 6), 6) + ' × 7,850 = ' + n2(stM) + ' kg.'],
      calc: { seq: '2.44 × 1.22 × 0.01 × 7850 =', expect: n2(stM) },
      answer: n2(stM) + ' kg'
    }),
    B.tryIt([
      { q: 'A sidewalk is 12 m long, 1.2 m wide and 100 mm thick. Concrete in m³ and yd³, to two decimal places?', a: n(1.44, 2) + ' m³ = ' + n2(1.44 / YD3) + ' yd³' },
      { q: 'A pour is 300 ft³. How many cubic yards, to two decimal places?', a: n2(300 / 27) + ' yd³' },
      { q: 'Six round piers, each 250 mm across and 1.5 m deep. Concrete in m³, to two decimal places?', a: n2(PI * 0.125 * 0.125 * 1.5 * 6) + ' m³' },
      { q: 'A strip footing under an interior wall of a one-storey house, at the Table 9.15.3.4. minimum width, is 100 mm thick and 12 m long. Concrete in m³?', a: '200 mm wide, ' + n(0.2 * 0.1 * 12, 2) + ' m³' },
      { q: 'A steel round bar is 25 mm across and 6 m long. Mass at 7,850 kg/m³, to two decimal places?', a: n2(PI * 0.0125 * 0.0125 * 6 * STEEL) + ' kg' }
    ]),

    B.section('Board feet'),
    B.p('Softwood and hardwood lumber is often priced by the ' + B.term('board foot', 'A volume of lumber 1 in thick, 12 in wide and 1 ft long: 144 in³, or 1/12 of a cubic foot.') + '. One board foot is a piece 1 in thick, 12 in wide and 1 ft long, which is 144 in³, or 1/12 of a cubic foot. Prices are often given per thousand board feet, written MBF.',
      'Lumber is named by its nominal size, such as 2 × 4. The Canadian Wood Council lists the actual surfaced dry (S-Dry) size of a 2 × 4 as 38 mm × 89 mm, or 1½ in × 3½ in. Board feet are tallied on the nominal size: a 1 × 12 that is 16 ft long is sold as 16 board feet, even though the dressed piece is smaller (Briggs, Forest Products Measurements and Conversion Factors, University of Washington).'),
    B.formula('Board feet', ['BF = thickness (in) × width (in) × length (ft) ÷ 12'], 'Thickness and width are the nominal sizes in inches. Length is in feet. MBF = 1,000 board feet.'),
    B.table(['Nominal size, in', 'S-Dry size, mm', 'S-Dry size, in'], [
      ['2 × 4', '38 × 89', '1½ × 3½'], ['2 × 6', '38 × 140', '1½ × 5½'], ['2 × 8', '38 × 184', '1½ × 7¼'],
      ['2 × 10', '38 × 235', '1½ × 9¼'], ['2 × 12', '38 × 286', '1½ × 11¼'], ['4 × 4', '89 × 89', '3½ × 3½']
    ], { caption: 'Nominal and actual surfaced dry lumber sizes, from the Canadian Wood Council table of dimension lumber sizes (cwc.ca/articles/lumber), read Oct 20 2026.', align: ['', 'r', 'r'] }),
    exL({
      title: 'A lumber order',
      q: 'An order is for ' + b1.k + ' pieces of 2 × 6, each ' + b1.L + ' ft long. The yard charges ' + money(b1.mbf) + ' per MBF. How many board feet, and what is the cost?',
      steps: ['One piece: 2 × 6 × ' + b1.L + ' ÷ 12 = ' + n(b1E) + ' BF.', b1.k + ' pieces: ' + n(b1E) + ' × ' + b1.k + ' = ' + n(b1T) + ' BF.', 'Cost: ' + n(b1T) + ' ÷ 1,000 × ' + money(b1.mbf) + ' = ' + money(b1C) + '.'],
      calc: { rows: [{ label: 'Board feet', seq: '2 × 6 × ' + b1.L + ' ÷ 12 × ' + b1.k + ' =', expect: n(b1T) }, { label: 'Cost', seq: b1T + ' ÷ 1000 × ' + b1.mbf + ' =', expect: n(b1C, 2) }] },
      answer: n(b1T) + ' BF, ' + money(b1C)
    }),
    exL({
      title: 'Nominal and actual',
      q: 'Find the board feet in one 2 × 4 that is 8 ft long. Then find how many board feet of wood the dressed piece holds, using its S-Dry size of 1½ in by 3½ in.',
      steps: ['Nominal: 2 × 4 × 8 ÷ 12 = ' + n2(b2N) + ' BF.', 'Actual: 1.5 × 3.5 × 8 ÷ 12 = ' + n(b2A) + ' BF.', 'The piece is sold as ' + n2(b2N) + ' BF but holds ' + n(b2A) + ' BF of wood.'],
      calc: { rows: [{ label: 'Nominal', seq: '2 × 4 × 8 ÷ 12 =', expect: n2(b2N) }, { label: 'Actual', seq: '1.5 × 3.5 × 8 ÷ 12 =', expect: n(b2A) }] },
      answer: n2(b2N) + ' BF sold, ' + n(b2A) + ' BF of wood'
    }),
    B.tryIt([
      { q: 'Ten pieces of 2 × 10, each 16 ft long. Board feet, to two decimal places?', a: n2(2 * 10 * 16 / 12 * 10) + ' BF' },
      { q: 'One 1 × 8 board, 10 ft long. Board feet, to two decimal places?', a: n2(1 * 8 * 10 / 12) + ' BF' },
      { q: 'One 4 × 4 post, 8 ft long. Board feet, to two decimal places?', a: n2(4 * 4 * 8 / 12) + ' BF' },
      { q: 'Forty pieces of 2 × 4, each 8 ft long, at $1,200 per MBF. Board feet and cost?', a: n2(2 * 4 * 8 / 12 * 40) + ' BF, ' + money(2 * 4 * 8 / 12 * 40 / 1000 * 1200) }
    ]),

    B.section('Tank capacity in litres and gallons'),
    B.p('A tank may be rated in litres, in US gallons or in imperial gallons. Find the inside volume, change it to litres, and then divide by the size of the gallon you need. The US gallon is 3.785411784 L (231 in³, NIST SP 1038). The imperial gallon is 4.54609 L (Weights and Measures Act). Both factors are exact.'),
    B.formula('Capacity in three units', ['L = mm³ ÷ 1,000,000 = m³ × 1,000', 'US gal = L ÷ 3.785411784', 'imperial gal = L ÷ 4.54609'], 'Use the inside sizes of the tank. Keep the full litre value in the calculator before dividing.'),
    exL({
      title: 'A rectangular tank',
      q: 'A tank is ' + n(tk1.l) + ' mm by ' + n(tk1.w) + ' mm by ' + tk1.h + ' mm inside. Find its capacity in litres, US gallons and imperial gallons, to two decimal places.',
      fig: G.box(tk1.l, tk1.w, tk1.h, { max: '2.2in', ph: 90 }), breakable: true,
      steps: ['Volume: ' + n(tk1.l) + ' × ' + n(tk1.w) + ' × ' + tk1.h + ' = ' + n(tk1L * 1e6) + ' mm³ = ' + n(tk1L) + ' L.', 'US gallons: ' + n(tk1L) + ' ÷ 3.785411784 = ' + n2(tk1L / USGAL_L) + ' US gal.', 'Imperial gallons: ' + n(tk1L) + ' ÷ 4.54609 = ' + n2(tk1L / IMPGAL_L) + ' imperial gal.'],
      calc: { rows: [{ label: 'US gal', seq: tk1L + ' ÷ 3.785411784 =', expect: n2(tk1L / USGAL_L) }, { label: 'Imperial gal', seq: tk1L + ' ÷ 4.54609 =', expect: n2(tk1L / IMPGAL_L) }] },
      answer: n(tk1L) + ' L = ' + n2(tk1L / USGAL_L) + ' US gal = ' + n2(tk1L / IMPGAL_L) + ' imperial gal'
    }),
    exL({
      title: 'A round tank',
      q: 'A vertical tank is ' + n(2 * tk2.r) + ' mm across and ' + n(tk2.h) + ' mm high inside. Find its capacity in litres, US gallons and imperial gallons, to two decimal places.',
      fig: G.cyl(tk2.r, tk2.h, { lab: 'D', max: '1.4in', ph: 110 }), breakable: true,
      steps: ['Radius: ' + n(2 * tk2.r) + ' ÷ 2 = ' + tk2.r + ' mm = 0.6 m. Height 2.5 m.', 'Volume: π × 0.6² × 2.5 = ' + n(L.round(tk2L / 1000, 5), 5) + ' m³ = ' + n2(tk2L) + ' L.', 'US gallons: ÷ 3.785411784 = ' + n2(tk2L / USGAL_L) + ' US gal.', 'Imperial gallons: ÷ 4.54609 = ' + n2(tk2L / IMPGAL_L) + ' imperial gal.'],
      calc: { rows: [{ label: 'Litres', seq: 'π × 0.6 x² × 2.5 × 1000 =', expect: n2(tk2L) }, { label: 'US gal', seq: 'π × 0.6 x² × 2.5 × 1000 ÷ 3.785411784 =', expect: n2(tk2L / USGAL_L) }, { label: 'Imperial gal', seq: 'π × 0.6 x² × 2.5 × 1000 ÷ 4.54609 =', expect: n2(tk2L / IMPGAL_L) }] },
      answer: n2(tk2L) + ' L = ' + n2(tk2L / USGAL_L) + ' US gal = ' + n2(tk2L / IMPGAL_L) + ' imperial gal'
    }),
    B.watch('The imperial gallon is bigger', 'One imperial gallon is 4.54609 ÷ 3.785411784 = ' + n(L.round(IMPGAL_L / USGAL_L, 3), 3) + ' US gallons, so the same tank holds fewer imperial gallons than US gallons.' + B.check('4.54609 ÷ 3.785411784 =', n(L.round(IMPGAL_L / USGAL_L, 3), 3))),
    B.tryIt([
      { q: 'A tank holds 2,000 L. US gallons and imperial gallons, to two decimal places?', a: n2(2000 / USGAL_L) + ' US gal, ' + n2(2000 / IMPGAL_L) + ' imperial gal' },
      { q: 'A tank is 48 in by 24 in by 30 in inside. US gallons, litres and imperial gallons, to two decimal places?', a: n2(48 * 24 * 30 / 231) + ' US gal = ' + n2(48 * 24 * 30 / 231 * USGAL_L) + ' L = ' + n2(48 * 24 * 30 / 231 * USGAL_L / IMPGAL_L) + ' imperial gal' },
      { q: 'A tank is 900 mm across and 1,500 mm high inside. Litres, US gallons and imperial gallons, to two decimal places?', a: n2(PI * 0.45 * 0.45 * 1.5 * 1000) + ' L = ' + n2(PI * 0.45 * 0.45 * 1.5 * 1000 / USGAL_L) + ' US gal = ' + n2(PI * 0.45 * 0.45 * 1.5 * 1000 / IMPGAL_L) + ' imperial gal' },
      { q: 'A boiler manual says 100 imperial gal. How many US gallons, to two decimal places?', a: n2(100 * IMPGAL_L / USGAL_L) + ' US gal' }
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
