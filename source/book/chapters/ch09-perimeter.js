/* Chapter 9: Perimeter and Circumference */
module.exports = function (B, L) {
  const F = require('../engine/figs.js');
  const C = F.C;
  const n = L.num, R = L.round;
  const d2 = x => n(R(x, 2), 2);
  const d3 = x => n(R(x, 3), 3);
  const PI = Math.PI;
  const m = L.m;
  /* an example with a calculator box may break before the box. The heading, question and steps stay together, and
     the calculator box stays with the answer. An example with no calculator box never breaks */
  const EX = o => {
    if (!o.calc) return B.example(o);
    const h = B.example(Object.assign({ long: true }, o));
    const k = h.indexOf('<div class="clear"></div>') + '<div class="clear"></div>'.length;
    const b = h.indexOf('<div class="bd">');
    return h.slice(0, b).replace('<div class="ex long">', '<div class="ex long"><div style="break-inside:avoid">').replace('<div class="hd">', '<div class="hd" style="background:var(--red1);padding:5pt 11pt;font:700 10pt Archivo,sans-serif;color:var(--deep8)">').replace('<span class="n">', '<span class="n" style="color:var(--red);margin-right:6pt">') + '<div class="bd" style="padding-bottom:2pt">' + h.slice(b + 16, k) + '</div></div><div class="bd" style="padding-top:0"><div style="break-inside:avoid">' + h.slice(k, h.length - 12) + '</div></div></div>';
  };
  const dot = (x, y, c) => '<circle cx="' + F.f(x) + '" cy="' + F.f(y) + '" r="3.2" fill="' + (c || C.edge) + '"/>';
  const dash = (x1, y1, x2, y2) => F.line(x1, y1, x2, y2, { c: C.dim, w: 1.4, dash: '6 4' });
  /* inches to the nearest 1/16 as plain text for SVG labels */
  const side2 = (a, b) => '<div style="display:flex;justify-content:center;align-items:center;gap:14pt">' + a + b + '</div>';

  const G8 = require('../engine/figs-ch08.js');
  const G = require('../engine/figs-ch09.js');
  const { SH } = G8.shapers(B);

  /* ---------- drawings ---------- */
  /* a circle rolled through one turn along the floor */
  function rollArt() {
    const r = 58, y = 176, x1 = 96, x2 = x1 + PI * 2 * r;
    let h = F.line(20, y, x2 + 90, y, { c: C.ink, w: 2 });
    h += F.circle(x1, y - r, r) + dot(x1, y - r);
    h += F.circle(x2, y - r, r, { fill: 'none', dash: '7 5' }) + dot(x2, y - r);
    h += F.line(x1, y - 2 * r, x1, y, { c: C.edge, w: 1.6 });
    h += F.t(x1 + 10, y - r - 6, 'D', { s: 15, b: true, c: C.edge, a: 'start' });
    h += F.line(x1, y, x2, y, { c: C.red, w: 4 });
    h += '<circle cx="' + x1 + '" cy="' + y + '" r="5" fill="' + C.red + '"/><circle cx="' + F.f(x2) + '" cy="' + y + '" r="5" fill="' + C.red + '"/>';
    h += '<path d="M' + (x1 + 40) + ' ' + (y - 2 * r - 14) + 'Q' + ((x1 + x2) / 2) + ' ' + (y - 2 * r - 52) + ' ' + (x2 - 40) + ' ' + (y - 2 * r - 14) + '" fill="none" stroke="' + C.dim + '" stroke-width="1.6" stroke-dasharray="5 4"/>' + F.arrowHead(x2 - 40, y - 2 * r - 14, 0.5, C.dim);
    h += F.t((x1 + x2) / 2, y - 2 * r - 40, 'one full turn', { s: 14, c: C.dim });
    h += F.dim(x1, y, x2, y, 'distance rolled = π × D', 30, { s: 15, wd: 170 });
    return F.svg(x2 + 110, y + 50, h, { max: '5.2in' });
  }
  /* the parts of a circle with callouts */
  function partsCircle() {
    const cx = 150, cy = 128, r = 100;
    let h = F.circle(cx, cy, r);
    h += F.line(cx - r, cy, cx + r, cy, { c: C.ink, w: 2 });
    const a = -0.95;
    h += F.line(cx, cy, cx + r * Math.cos(a), cy + r * Math.sin(a), { c: C.red, w: 2.4 });
    h += dot(cx, cy, C.ink);
    h += F.t(cx - 50, cy - 8, 'D', { s: 16, b: true });
    h += F.t(cx + 36, cy - 44, 'r', { s: 16, b: true, c: C.red });
    h += F.callout(cx, cy, 330, cy + 14, 'centre', { s: 12.5 });
    h += F.callout(cx + 0.6 * r * Math.cos(a), cy + 0.6 * r * Math.sin(a), 330, 40, 'radius r: centre to edge', { s: 12.5 });
    h += F.callout(cx + 70, cy, 330, cy + 56, 'diameter D: across through the centre', { s: 12.5 });
    h += F.callout(cx + r * Math.cos(2.3), cy + r * Math.sin(2.3), 330, 226, 'circumference C: the distance around', { s: 12.5 });
    return F.svg(470, 248, h, { max: '4.2in' });
  }
  /* ---------- worked numbers ---------- */
  const tankC = PI * 48;
  const jacket = PI * 6.625;

  return L.join([
    B.chapter({
      num: 9, id: 'perimeter', title: 'Perimeter and Circumference',
      intro: B.p('How much flat bar goes around a guard? How long is the band that wraps a tank? How big a sheet rolls into a round duct? Each question asks for a distance around the outside of a shape.',
        'This chapter works out the distance around rectangles, triangles and other straight-sided shapes, and then around circles. The distance around a circle is always π × D, the number π times the diameter. The same formula gives the stretch-out, the length of flat sheet that rolls into a pipe or a round duct.'),
      objectives: ['Find the perimeter of straight-sided shapes', 'Find a missing side from a perimeter', 'Name the parts of a circle', 'Use C = π × D, and find D from C', 'Find the stretch-out of a pipe or duct', 'Find arcs and composite perimeters'],
      words: ['perimeter', 'radius', 'diameter', 'circumference', 'pi (π)', 'stretch-out', 'arc'],
      art: rollArt()
    }),

    B.section('Perimeter of straight-sided shapes'),
    B.p('The ' + B.term('perimeter', 'The distance all the way around the outside of a flat shape.') + ' is the distance all the way around the outside of a flat shape. Picture walking along every edge until you are back where you started. Add up every edge you walked.'),
    B.formula('Perimeter', [m('Rectangle: P = 2 × (l + w)') + '  ' + m('Square: P = 4 × s'), m('Triangle: P = a + b + c') + '  ' + m('Regular polygon: P = n × s')], 'l length, w width, s side, a, b and c the three sides, n the number of equal sides'),
    EX({
      title: 'A rectangular guard frame',
      q: 'A guard frame is 1,500 mm long and 750 mm wide. How much flat bar goes around it?',
      fig: SH('rectangle', { l: 1500, w: 750 }, { width: '1.6in' }),
      steps: ['Two lengths and two widths: ' + m('P = 2 × (l + w)') + '.', m('P = 2 × (1,500 + 750) = 2 × 2,250 = 4,500')],
      answer: '4,500 mm, which is 4.5 m.'
    }),
    B.check('2 × ( 1500 + 750 ) =', '4,500'),
    EX({
      title: 'A frame in fractions of an inch',
      q: 'A picture-style frame is 24' + L.fr(3, 8) + ' in by 18' + L.fr(1, 2) + ' in. Find the perimeter.',
      steps: ['Add a length and a width: 24' + L.fr(3, 8) + ' + 18' + L.fr(1, 2) + ' = 24' + L.fr(3, 8) + ' + 18' + L.fr(4, 8) + ' = 42' + L.fr(7, 8) + ' in.', 'Double it: 2 × 42' + L.fr(7, 8) + ' = 84' + L.fr(14, 8) + ' = 85' + L.fr(6, 8) + ' = 85' + L.fr(3, 4) + ' in. Both calculators below show this as a mixed number, 85 and 3/4.'],
      calc: { seq: '2 × ( 24 ab/c 3 ab/c 8 + 18 ab/c 1 ab/c 2 ) =', expect: '85.75' },
      answer: '85' + L.fr(3, 4) + ' in, which is ' + L.ftin(85.75, 16) + '.'
    }),
    EX({
      title: 'Feet and inches',
      q: 'A concrete pad is 12 ft 6 in long and 8 ft 9 in wide. How much edge form goes around it? Give the answer in feet and inches.',
      fig: G.ftinRect('12′ 6″', '8′ 9″', '2.3in', 150 / 105),
      steps: ['Change to inches. 12 ft 6 in = 12 × 12 + 6 = 150 in. 8 ft 9 in = 8 × 12 + 9 = 105 in.', m('P = 2 × (150 + 105) = 510') + ' in.', '510 ÷ 12 = 42.5 ft, which is 42 ft and 0.5 × 12 = 6 in.'],
      calc: { seq: '2 × ( 150 + 105 ) =', expect: '510' },
      answer: '42 ft 6 in'
    }),
    B.check('510 ÷ 12 =', '42.5'),
    B.p('When you know the perimeter and one side, transpose the formula as in Chapter 8. For a rectangle, ' + m('w = P ÷ 2 − l') + '. A rectangle with a perimeter of 3,000 mm and a length of 900 mm has a width of 3,000 ÷ 2 − 900 = 600 mm.'),
    B.check('3000 ÷ 2 − 900 =', '600'),
    B.tryIt([
      { q: 'A square plate has sides of 850 mm. Find the perimeter.', a: n(4 * 850) + ' mm' },
      { q: 'A triangle has sides of 1.2 m, 0.9 m and 1.5 m. Find the perimeter.', a: n(R(1.2 + 0.9 + 1.5, 2)) + ' m' },
      { q: 'A regular hexagon has sides of 125 mm. Find the perimeter.', a: n(6 * 125) + ' mm' },
      { q: 'A regular octagon has sides of 80 mm. Find the perimeter.', a: n(8 * 80) + ' mm' },
      { q: 'A rectangle is 3 ft 4 in by 2 ft 8 in. Find the perimeter in feet.', a: (2 * (40 + 32)) + ' in = ' + (2 * (40 + 32) / 12) + ' ft' },
      { q: 'A rectangle has a perimeter of 2,600 mm and a length of 800 mm. Find the width.', a: n(2600 / 2 - 800) + ' mm' },
      { q: 'A frame is 36' + L.fr(1, 4) + ' in by 24' + L.fr(1, 2) + ' in. Find the perimeter.', a: '121' + L.fr(1, 2) + ' in' }
    ]),

    B.section('The parts of a circle and π'),
    B.p('The ' + B.term('radius', 'The distance from the centre of a circle to its edge. Its letter is r.') + ' (r) is the distance from the centre of a circle to its edge. The ' + B.term('diameter', 'The distance across a circle through its centre. D = 2 × r.') + ' (D) is the distance across the circle through the centre, so it is two radii: ' + m('D = 2 × r') + ' and ' + m('r = D ÷ 2') + '. The ' + B.term('circumference', 'The distance around a circle. C = π × D.') + ' (C) is the distance around the circle. It is the perimeter of a circle.'),
    B.figure(partsCircle(), 'The parts of a circle.'),
    B.p('Wrap a string once around any circle and lay it along the diameter. It fits a little more than 3 times, every time, for a washer or a tank. That number is ' + B.term('pi', 'The number you get when you divide the circumference of any circle by its diameter, about 3.14159. Its symbol is π.', 'pi') + ', written π. It is about 3.14159, and its digits never end.'),
    B.calc({ title: 'The π key', seq: 'π', expect: '3.141592654', say: 'Both calculators show π to 10 digits. Use the key every time instead of typing 3.14.' }),
    B.watch('3.14 is not π', 'π × 600 = ' + d2(PI * 600) + ', but 3.14 × 600 = ' + n(3.14 * 600) + '. The short value is almost 1 mm short on a 600 mm circle, and the error grows with the size of the job.'),
    B.check('π × 600 =', d2(PI * 600)),
    B.check('3.14 × 600 =', n(R(3.14 * 600, 2))),
    B.tryIt([
      { q: 'A circle has a radius of 45 mm. Find the diameter.', a: (2 * 45) + ' mm' },
      { q: 'A pipe has a diameter of 168.3 mm. Find the radius.', a: n(R(168.3 / 2, 2)) + ' mm' },
      { q: 'A tank has a diameter of 2 ft. Find the radius in inches.', a: '12 in' },
      { q: 'Which is longer, the diameter of a circle or its circumference? About how many times longer?', a: 'The circumference, a little more than 3 times longer (π times).' }
    ]),

    B.section('Circumference'),
    B.formula('Circumference', [m('C = π × D')], 'If you know the radius, double it first to get D. Double D and C doubles: C and D always keep the same ratio, π.'),
    EX({
      title: 'From a diameter and from a radius',
      q: 'Find the circumference of a disc 450 mm in diameter, and of a ring with a radius of 125 mm. Round to two decimal places.',
      steps: ['Disc: ' + m('C = π × 450 = ' + d2(PI * 450)) + '.', 'Ring: double the radius first, D = 2 × 125 = 250. Then ' + m('C = π × 250 = ' + d2(PI * 250)) + '.'],
      calc: { rows: [{ label: 'Disc', seq: 'π × 450 =', expect: d2(PI * 450) }, { label: 'Ring', seq: 'π × 250 =', expect: d2(PI * 250) }] },
      answer: d2(PI * 450) + ' mm and ' + d2(PI * 250) + ' mm.'
    }),
    EX({
      title: 'A band around a tank',
      q: 'A round tank is 48 in in diameter. How long is a band that goes once around it? Give the answer to the nearest 1/16 in.',
      steps: [m('C = π × 48 = ' + d3(tankC)) + ' in.', 'Change the decimal part to sixteenths: 0.796 × 16 = ' + d2(0.796 * 16) + ', which rounds to 13.', '150' + L.fr(13, 16) + ' in is 12 ft 6' + L.fr(13, 16) + ' in, because 150 = 12 × 12 + 6.'],
      calc: { seq: 'π × 48 =', expect: d3(tankC) },
      answer: L.inch(tankC, 16) + ', which is ' + L.ftin(tankC, 16) + '.'
    }),
    B.check('0.796 × 16 =', d2(0.796 * 16)),
    EX({
      title: 'Turns of a wheel',
      q: 'A wheel 600 mm in diameter rolls along a floor. In one turn it rolls one circumference. How far does it roll in 25 turns? How many turns does it make in 50 m?',
      steps: ['One turn: π × 600 mm. 25 turns: ' + m('25 × π × 600 = ' + d2(25 * PI * 600)) + ' mm, about ' + d2(25 * PI * 600 / 1000) + ' m.', 'Turns in 50 m = 50,000 mm: ' + m('50,000 ÷ (π × 600) = ' + d2(50000 / (PI * 600))) + '.'],
      calc: { rows: [{ label: 'Distance', seq: '25 × π × 600 =', expect: d2(25 * PI * 600) }, { label: 'Turns', seq: '50000 ÷ ( π × 600 ) =', expect: d2(50000 / (PI * 600)) }] },
      answer: d2(25 * PI * 600) + ' mm (' + d2(25 * PI * 600 / 1000) + ' m) and ' + d2(50000 / (PI * 600)) + ' turns.'
    }),
    B.tryIt([
      { q: 'D = 200 mm. Find C to two decimal places.', a: d2(PI * 200) + ' mm' },
      { q: 'r = 60 mm. Find C to two decimal places.', a: d2(PI * 120) + ' mm' },
      { q: 'D = 10 in. Find C to the nearest 1/16 in.', a: L.inch(PI * 10, 16) },
      { q: 'A tape wrapped once around a pipe reads 2,500 mm. Find D to two decimal places.', a: d2(2500 / PI) + ' mm, from D = C ÷ π' },
      { q: 'C = 1,256.64 mm. Find D to the nearest millimetre.', a: n(Math.round(1256.64 / PI)) + ' mm' },
      { q: 'A 500 mm wheel turns 10 times. How far does it roll, to two decimal places?', a: d2(10 * PI * 500) + ' mm' },
      { q: 'A circle with C = 1,000 mm has its diameter doubled. What is the new C?', a: '2,000 mm' }
    ]),

    B.section('Stretch-out of a pipe or duct'),
    B.p('Open out the side of a cylinder and it lies flat as a rectangle. One side of the rectangle is the length of the cylinder. The other side wrapped once around the cylinder, so it is the circumference. This length is the ' + B.term('stretch-out', 'The length of flat material that rolls or wraps into a round shape. For a cylinder it is π × D.') + '. To make a round duct, you cut a sheet as long as the stretch-out and roll it.'),
    B.figure(side2(G8.cyl3d(150, 600, 'mm', { max: '1.3in' }), G8.cylNet(150, 600, 'mm', { max: '2.25in' })), 'Unfold it. The cylinder on the left opens out to the net on the right. The stretch-out is π × D = π × 300 = ' + d2(PI * 300) + ' mm.'),
    B.tip('Measure around when you can', 'A tape wrapped once around a part reads the stretch-out directly. You need π only when you start from the diameter.'),
    EX({
      title: 'Sheet for a round duct',
      q: 'A round duct is 300 mm in diameter and 1,200 mm long. The drawing adds 25 mm to the stretch-out for a lap seam. What size sheet is cut? Give the sheet length to the nearest millimetre.',
      steps: ['Stretch-out: ' + m('π × 300 = ' + d2(PI * 300)) + ' mm. Add the 25 mm seam allowance from the drawing: ' + d2(PI * 300) + ' + 25 = ' + d2(PI * 300 + 25) + ' mm.'],
      calc: { seq: 'π × 300 + 25 =', expect: d2(PI * 300 + 25) },
      answer: n(Math.round(PI * 300 + 25)) + ' mm by 1,200 mm.'
    }),
    EX({
      title: 'A jacket around a pipe',
      q: 'A sheet-metal jacket wraps around the outside of a pipe. The outside diameter is 6' + L.fr(5, 8) + ' in. Find the stretch-out to the nearest 1/16 in.',
      steps: ['The jacket wraps the outside surface, so use the outside diameter: ' + m('π × 6.625 = ' + d3(jacket)) + ' in.', 'Sixteenths: 0.813 × 16 = ' + d2(0.813 * 16) + ', which rounds to 13.'],
      calc: { seq: 'π × 6 ab/c 5 ab/c 8 =', expect: d3(jacket) },
      answer: L.inch(jacket, 16)
    }),
    B.check('0.813 × 16 =', d2(0.813 * 16)),
    B.tryIt([
      { q: 'A duct is 250 mm in diameter. Find the stretch-out to two decimal places.', a: d2(PI * 250) + ' mm' },
      { q: 'A duct is 400 mm in diameter and the drawing adds 30 mm for the seam. Find the cut length to two decimal places.', a: d2(PI * 400 + 30) + ' mm' },
      { q: 'A pipe has an outside diameter of 4' + L.fr(1, 2) + ' in. Find the stretch-out of a jacket to the nearest 1/16 in.', a: L.inch(PI * 4.5, 16) },
      { q: 'A stretch-out is 942.48 mm. What diameter does it roll into, to the nearest millimetre?', a: n(Math.round(942.48 / PI)) + ' mm' }
    ]),

    B.section('Arcs'),
    B.p('An ' + B.term('arc', 'A part of the circumference of a circle.') + ' is a part of the circumference. A 90° arc is a quarter of the circle, because a full turn is 360°. Find the fraction of the circle, then take that fraction of π × D.'),
    B.formula('Arc length', [m('arc = angle ÷ 360 × π × D')], 'Half circle: π × D ÷ 2. Quarter circle: π × D ÷ 4.'),
    B.figure(SH('sector', { r: 300, t: 90 }, { derived: 'show', width: '0.85in' }), 'A 90° arc of a circle with a 300 mm radius. D = 600 mm, so the arc is 90 ÷ 360 × π × 600 = ' + d2(PI * 600 / 4) + ' mm.'),
    B.check('90 ÷ 360 × π × 600 =', d2(PI * 600 / 4)),
    EX({
      title: 'A curved handrail',
      q: 'A curved handrail follows a 120° arc of a circle 2,400 mm in diameter. How long is the rail? Round to two decimal places.',
      steps: ['120° is 120 ÷ 360 = one third of the circle.', m('arc = 120 ÷ 360 × π × 2,400 = ' + d2(120 / 360 * PI * 2400))],
      calc: { seq: '120 ÷ 360 × π × 2400 =', expect: d2(120 / 360 * PI * 2400) },
      answer: d2(120 / 360 * PI * 2400) + ' mm'
    }),
    B.tryIt([
      { q: 'A half circle has D = 500 mm. Find the curved edge.', a: d2(PI * 500 / 2) + ' mm' },
      { q: 'A quarter circle has r = 200 mm. Find the curved edge.', a: d2(PI * 400 / 4) + ' mm' },
      { q: 'A 60° arc has D = 900 mm. Find its length.', a: d2(60 / 360 * PI * 900) + ' mm' },
      { q: 'A 270° arc has D = 100 mm. Find its length.', a: d2(270 / 360 * PI * 100) + ' mm' }
    ]),

    B.section('Composite perimeters'),
    B.p('A composite shape is made of simple parts. Break it down: split it into straight edges and arcs, find any missing lengths, then add only the edges on the outside. The dashed lines used to split a shape are not edges.'),
    EX({
      title: 'A slot',
      q: 'A slot has straight sides 60 mm long and round ends 30 mm across. Find the distance around the slot.',
      fig: SH('stadium', { l: 60, r: 15 }, { derived: 'show', width: '2.3in' }),
      steps: ['Two straight sides: 2 × 60 = 120 mm.', 'Two half circles make one whole circle with D = 30 mm: π × 30 = ' + d2(PI * 30) + ' mm.', 'Add: 120 + ' + d2(PI * 30) + ' = ' + d2(120 + PI * 30) + '.'],
      calc: { seq: '2 × 60 + π × 30 =', expect: d2(120 + PI * 30) },
      answer: d2(120 + PI * 30) + ' mm'
    }),
    EX({
      title: 'A plate with a round end',
      q: 'A plate is a 400 mm by 200 mm rectangle with a half circle on one end. Find its perimeter.',
      fig: G.rectSemi(400, 200, { split: true, max: '2.1in' }),
      steps: ['Part A gives three outside edges: 400 + 400 + 200 = 1,000 mm. The dashed line is inside the plate. Part B is a half circle with D = 200 mm: π × 200 ÷ 2 = ' + d2(PI * 100) + ' mm.', 'Add: 1,000 + ' + d2(PI * 100) + ' = ' + d2(1000 + PI * 100) + '.'],
      answer: d2(1000 + PI * 100) + ' mm'
    }),
    B.check('2 × 400 + 200 + π × 200 ÷ 2 =', d2(1000 + PI * 100)),
    EX({
      title: 'A belt around two pulleys',
      q: 'A belt runs around two pulleys, each 200 mm in diameter. The centres are 800 mm apart. How long is the belt?',
      fig: G.belt(200, 800, { max: '2.4in' }),
      steps: ['Each straight run is as long as the centre distance: 2 × 800 = 1,600 mm.', 'The belt wraps half of each pulley, and two halves make one circle: π × 200 = ' + d2(PI * 200) + ' mm. Add: 1,600 + ' + d2(PI * 200) + ' = ' + d2(1600 + PI * 200) + '.'],
      answer: d2(1600 + PI * 200) + ' mm'
    }),
    B.check('2 × 800 + π × 200 =', d2(1600 + PI * 200)),
    B.tryIt([
      { q: 'A slot: straight sides 50 mm, ends 20 mm across. Find P.', a: d2(100 + PI * 20) + ' mm' },
      { q: 'A 600 mm by 400 mm plate, 50 mm corner radius. Find P.', a: d2(2 * (600 - 100) + 2 * (400 - 100) + PI * 100) + ' mm (four quarter circles make one circle, D = 100 mm)' },
      { q: 'Two 150 mm pulleys, centres 600 mm apart. Belt length?', a: d2(1200 + PI * 150) + ' mm' },
      { q: 'A quarter circle, r = 300 mm. Find P, edges and arc.', a: d2(600 + PI * 600 / 4) + ' mm' }
    ]),

    B.worksheet({ title: 'Around the outside', sub: 'Find the perimeter, or find the ? from the perimeter', intro: 'Add every outside edge. If a perimeter is given, transpose to find the ?' }),
    B.grid2(
      B.prob({ q: 'Find the perimeter of the plate.', canvas: SH('rectangle', { l: 1800, w: 950 }, { width: '1.7in' }), a: n(2 * (1800 + 950)) + ' mm', lines: 2 }),
      B.prob({ q: 'Find the perimeter. The dashed height is not an edge.', canvas: G.tri(14, 13, 15, 'cm', { h: '12 cm', max: '2.25in' }), a: (14 + 13 + 15) + ' cm', lines: 2 })
    ),
    B.grid2(
      B.prob({ q: 'The perimeter is 4,200 mm. Find the width.', canvas: SH('rectangle', { l: 1350, w: 750 }, { hide: ['w'], width: '1.7in' }), a: n(4200 / 2 - 1350) + ' mm', work: 'w = P ÷ 2 − l = 4,200 ÷ 2 − 1,350', lines: 2 }),
      B.prob({ q: 'Find the perimeter in feet and inches.', canvas: G.ftinRect('10′ 4″', '6′ 8″', '1.6in', 124 / 80), a: '2 × (124 + 80) = ' + (2 * (124 + 80)) + ' in = ' + (2 * (124 + 80) / 12) + ' ft', lines: 2 })
    ),
    B.grid2(
      B.prob({ q: 'A square has a perimeter of 2,000 mm. Find the side.', a: n(2000 / 4) + ' mm', work: 's = P ÷ 4', lines: 2 }),
      B.prob({ q: 'Change one value: both sides of the plate in problem 1 are doubled. Find the new perimeter. What happened to it?', a: n(2 * 2 * (1800 + 950)) + ' mm. The perimeter doubled.', lines: 2 })
    ),

    B.worksheet({ title: 'Circles, arcs and stretch-outs', sub: 'Distance around a circle is always π × D', intro: 'Round to two decimal places unless a problem says otherwise. If a drawing gives r, double it to get D.' }),
    B.grid2(
      B.prob({ q: 'Find the circumference.', canvas: G8.radCircle(175, 'mm', { max: '1.15in' }), a: 'C = π × 350 = ' + d2(PI * 350) + ' mm', lines: 2 }),
      B.prob({ q: 'A tape around the tank reads 3,000 mm. Find the diameter.', canvas: G8.circleCallout('C = 3,000 mm', '1.8in'), a: 'D = 3,000 ÷ π = ' + d2(3000 / PI) + ' mm', lines: 2 })
    ),
    B.grid2(
      B.prob({ q: 'Unfold it. Find the stretch-out marked ? above the net.', canvas: side2(G8.cyl3d(200, 400, 'mm', { max: '0.9in' }), G8.cylNet(200, 400, 'mm', { askS: true, max: '1.75in' })), a: 'π × 400 = ' + d2(PI * 400) + ' mm', lines: 2 }),
      B.prob({ q: 'Find the length of the arc.', canvas: G.sectorFig(400, 75, 'mm', { askL: true, max: '1.3in' }), a: '75 ÷ 360 × π × 800 = ' + d2(75 / 360 * PI * 800) + ' mm', lines: 2 })
    ),
    B.grid2(
      B.prob({ q: 'A wheel is 700 mm in diameter. How many turns does it make in 10 m?', a: d2(10000 / (PI * 700)) + ' turns', lines: 2 }),
      B.prob({ q: 'A jacket wraps a pipe with an outside diameter of 8' + L.fr(5, 8) + ' in. Find the stretch-out to the nearest 1/16 in.', a: L.inch(PI * 8.625, 16), lines: 2 })
    ),

    B.worksheet({ title: 'Break it down: composite shapes', sub: 'Split each shape into straight edges and arcs', intro: 'Add only the outside edges. Dashed lines are not edges. Round to two decimal places.' }),
    B.grid2(
      B.prob({ q: 'Find the perimeter of the slot.', canvas: SH('stadium', { l: 80, r: 20 }, { derived: 'show', width: '2.3in' }), a: '2 × 80 + π × 40 = ' + d2(160 + PI * 40) + ' mm', lines: 2 }),
      B.prob({ q: 'Find the perimeter. Part B is a half circle.', canvas: G.rectSemi(500, 240, { split: true, max: '2.3in' }), a: '500 + 500 + 240 + π × 240 ÷ 2 = ' + d2(1240 + PI * 120) + ' mm', lines: 2 })
    ),
    B.grid2(
      B.prob({ q: 'Each corner is a quarter circle. Find the perimeter.', canvas: G.roundedPlate(800, 500, 40, { split: true, max: '1.6in' }), a: '2 × 720 + 2 × 420 + π × 80 = ' + d2(1440 + 840 + PI * 80) + ' mm', lines: 2 }),
      B.prob({ q: 'Find the total length of both edges of the washer.', canvas: G8.washer(60, 30, 'mm', { max: '1.15in' }), a: 'π × 120 + π × 60 = ' + d2(PI * 180) + ' mm', lines: 2 })
    ),
    B.grid2(
      B.prob({ q: 'Find the length of the belt.', canvas: G.belt(250, 1000, { max: '2.3in' }), a: '2 × 1,000 + π × 250 = ' + d2(2000 + PI * 250) + ' mm', lines: 2 }),
      B.prob({ q: 'A quarter circle has a radius of 250 mm. Find its perimeter, both straight edges and the arc.', a: '2 × 250 + π × 500 ÷ 4 = 500 + ' + d2(PI * 125) + ' = ' + d2(500 + PI * 125) + ' mm', lines: 2 })
    ),
    B.check('π × 350 =', d2(PI * 350)),
    B.check('3000 ÷ π =', d2(3000 / PI)),
    B.check('π × 400 =', d2(PI * 400)),
    B.check('75 ÷ 360 × π × 800 =', d2(75 / 360 * PI * 800)),
    B.check('10000 ÷ ( π × 700 ) =', d2(10000 / (PI * 700))),
    B.check('2 × 80 + π × 40 =', d2(160 + PI * 40)),
    B.check('1240 + π × 240 ÷ 2 =', d2(1240 + PI * 120)),
    B.check('2 × 720 + 2 × 420 + π × 80 =', d2(1440 + 840 + PI * 80)),
    B.check('2 × 1000 + π × 250 =', d2(2000 + PI * 250)),
    B.check('2 × 250 + π × 500 ÷ 4 =', d2(500 + PI * 125)),
    B.check('π × 120 + π × 60 =', d2(PI * 180))
  ]);
};
