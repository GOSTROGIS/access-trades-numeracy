/* Chapter 3: Order of Operations. Every calculated number is checked on the TI-30Xa emulator and the Sharp
   translation, in a calculator box or with B.check. */
module.exports = function (B, L) {
  const F = require('../engine/figs.js');
  const P = require('../engine/figs-ch02.js');
  const n = L.num;
  const ti = seq => L.CALC.tiValue(seq).value;

  /* the BEDMAS ladder: one step per rank, top step first */
  function ladder(o) {
    o = o || {};
    const steps = [
      ['B', 'Brackets', 'Work out what is inside ( ) and [ ] first'],
      ['E', 'Exponents', 'Squares, cubes, powers and roots'],
      ['D M', 'Division and Multiplication', 'Same rank: work left to right'],
      ['A S', 'Addition and Subtraction', 'Same rank: work left to right']
    ];
    const W = 640, sh = 54, gap = 8;
    let h = '';
    steps.forEach((s, i) => {
      const x = i * 40, y = 10 + i * (sh + gap), w = W - 20 - i * 40;
      h += '<rect x="' + (x + 4) + '" y="' + y + '" width="' + w + '" height="' + sh + '" rx="6" fill="' + (i % 2 ? F.C.fill2 : F.C.fill) + '" stroke="' + F.C.edge + '" stroke-width="2"/>';
      h += '<rect x="' + (x + 4) + '" y="' + y + '" width="74" height="' + sh + '" rx="6" fill="' + F.C.deep + '"/>';
      h += F.t(x + 41, y + sh / 2 + 9, s[0], { s: 24, b: true, c: '#FFFFFF' });
      h += F.t(x + 92, y + (o.compact ? 35 : 23), s[1], { s: o.compact ? 24 : 17, b: true, c: F.C.ink, a: 'start' });
      if (!o.compact) h += F.t(x + 92, y + 43, s[2], { s: 13.5, c: '#4A4E54', a: 'start' });
      h += F.t(x + 4 + w - 14, y + sh / 2 + 7, String(i + 1), { s: 20, b: true, c: F.C.edge, a: 'end' });
    });
    return F.svg(W + 4, 10 + 4 * (sh + gap), h, { max: o.max || '5.6in' });
  }
  /* L-shaped plate split into A (upright) and B (base). W overall width, H overall height, a upright width, b base height */
  function lPlate(W, H, a, b, o) {
    o = o || {};
    const S = 240 / Math.max(W, H), x0 = 92, y0 = 40, fs = o.fs || 19;
    const P = (x, y) => [x0 + x * S, y0 + (H - y) * S];
    let h = F.poly([P(0, 0), P(W, 0), P(W, b), P(a, b), P(a, H), P(0, H)]);
    h += F.line(P(0, b)[0], P(0, b)[1], P(a, b)[0], P(a, b)[1], { c: '#4A4E54', w: 1.4, dash: '6 4' });
    h += F.t(P(a / 2, (H + b) / 2)[0], P(a / 2, (H + b) / 2)[1] + 6, 'A', { s: 24, b: true, c: F.C.edge });
    h += F.t(P(W / 2, b / 2)[0], P(W / 2, b / 2)[1] + 8, 'B', { s: 24, b: true, c: F.C.edge });
    h += F.dim(P(0, 0)[0], P(0, 0)[1], P(W, 0)[0], P(W, 0)[1], n(W) + ' mm', 30, { s: fs });
    h += F.dim(P(0, b)[0], P(0, b)[1], P(0, H)[0], P(0, H)[1], n(H - b) + ' mm', -44, { s: fs, wd: fs * 3.4 });
    h += F.dim(P(0, 0)[0], P(0, 0)[1], P(0, b)[0], P(0, b)[1], n(b) + ' mm', -44, { s: fs, wd: fs * 3.4 });
    h += F.dim(P(0, H)[0], P(0, H)[1], P(a, H)[0], P(a, H)[1], n(a) + ' mm', -30, { s: fs });
    return F.svg(x0 + W * S + 30, y0 + H * S + 62, h, { max: o.max || '3in' });
  }
  /* plate with a row of evenly spaced holes, with the spacing shown as the red ? */
  function holeRow(len, end, holes, o) {
    o = o || {};
    const Wd = o.wd || 560, x0 = 24, sc = (Wd - 2 * x0) / len, y = 40, H = 64, sp = (len - 2 * end) / (holes - 1);
    let h = F.rect(x0, y, len * sc, H);
    for (let i = 0; i < holes; i++) h += F.circle(x0 + (end + i * sp) * sc, y + H / 2, 8, { fill: '#FFFFFF', w: 1.8 });
    const fs = o.fs || 12;
    h += F.dim(x0 + end * sc, y + H, x0 + (end + sp) * sc, y + H, '?', 26, { ask: true, s: fs });
    if (!o.noEnds) h += F.dim(x0, y + H, x0 + end * sc, y + H, n(end) + ' mm', 26, { s: fs }) + F.dim(x0 + (len - end) * sc, y + H, x0 + len * sc, y + H, n(end) + ' mm', 26, { s: fs });
    h += F.dim(x0, y, x0 + len * sc, y, n(len) + ' mm', -24, { s: fs + 1 });
    return F.svg(Wd, y + H + 52, h, { max: o.max || '5in' });
  }
  /* a written calculation shown with a fraction bar */
  const bar = (top, bot) => '<span class="m">' + L.fr(top, bot) + '</span>';


  return L.join([
    B.chapter({
      num: 3, id: 'order', title: 'Order of Operations',
      intro: B.p('What is 3 + 4 × 5? Add first and you get 35. Multiply first and you get 23. Only one answer can be right, so everyone who works with numbers follows the same order, and so does your calculator. This chapter sets out that order, BEDMAS, and shows when the calculator needs brackets that are not written on the page.'),
      objectives: ['Use BEDMAS to work a calculation step by step', 'Work out brackets, powers and roots in the right order', 'Work left to right for × and ÷, and for + and −', 'Treat a fraction bar as a grouping symbol', 'Key brackets so the calculator follows the same order'],
      words: ['order of operations', 'BEDMAS', 'brackets', 'exponent', 'square', 'square root'],
      art: ladder({ max: '4.5in', compact: true })
    }),

    B.section('Why order matters'),
    B.p('A calculation with more than one operation can be read in more than one way. The ' + B.term('order of operations', 'The agreed order for working out a calculation that has more than one operation in it.') + ' is the agreed order for working one out. When everyone uses the same order, a calculation written on a drawing or in a formula means the same thing to everyone who reads it.'),
    B.example({
      title: 'Bolts in a crate',
      q: 'A crate holds 3 loose bolts and 4 bags of 5 bolts. The count is written 3 + 4 × 5. How many bolts are in the crate?',
      steps: ['The 4 bags of 5 bolts are 4 × 5 = 20 bolts. That multiplication has to happen first.', 'Add the loose bolts: 3 + 20 = 23.', 'Adding first, 3 + 4 = 7 and 7 × 5 = 35, counts the 3 loose bolts as if they were in bags. That is wrong.'],
      calc: { seq: '3 + 4 × 5 =', expect: '23', say: 'Both calculators multiply before they add, so both show 23 even though the keys are pressed left to right.' },
      answer: '23 bolts'
    }),

    B.section('BEDMAS'),
    B.p(B.term('BEDMAS', 'A memory aid for the order of operations: Brackets, Exponents, Division and Multiplication (left to right), Addition and Subtraction (left to right).') + ' is a memory aid for the order of operations. Each letter stands for one kind of operation, from the first to be done to the last. The ladder on the first page of this chapter shows the four steps: start at the top step and work down.'),
    B.table(['Letter', 'Stands for', 'Example'], [
      ['B', 'Brackets ( ) and [ ]', '(12 + 8) × 3: add 12 + 8 first'],
      ['E', 'Exponents: squares, powers and roots', '100 − 5²: work out 5² first'],
      ['D and M', 'Division and Multiplication, left to right', '24 ÷ 4 × 3: divide first, because ÷ comes first'],
      ['A and S', 'Addition and Subtraction, left to right', '20 − 8 + 2: subtract first, because − comes first']
    ], { caption: 'What each letter of BEDMAS means.', align: ['c', '', ''] }),
    B.keyidea('Key idea', 'D and M are one step, not two. Neither one goes first. Work them in the order they appear, left to right. The same goes for A and S.'),
    B.example({
      title: 'Working through BEDMAS',
      q: 'Find 8 − 3 × 2 + 1.',
      steps: ['No brackets and no exponents.', 'Multiply: 3 × 2 = 6. The calculation is now 8 − 6 + 1.', 'Add and subtract left to right: 8 − 6 = 2, then 2 + 1 = 3.'],
      calc: { seq: '8 − 3 × 2 + 1 =', expect: '3' },
      answer: '3'
    }),
    B.tip('Rewrite the line after each step', 'Write the whole calculation again after each step, with the part you just worked out replaced by its answer. Each line gets shorter until one number is left.'),
    B.tryIt([
      { q: '6 + 4 × 3', a: n(ti('6 + 4 × 3 =')) },
      { q: '20 − 12 ÷ 4', a: n(ti('20 − 12 ÷ 4 =')) },
      { q: '5 × 6 − 4 × 3', a: n(ti('5 × 6 − 4 × 3 =')) },
      { q: '18 ÷ 3 + 2 × 7', a: n(ti('18 ÷ 3 + 2 × 7 =')) }
    ]),

    B.section('Brackets'),
    B.p(B.term('Brackets', 'The symbols ( ) and [ ] that group part of a calculation so that it is worked out first.') + ' group part of a calculation so it is worked out first. They come first in BEDMAS. Inside the brackets, use BEDMAS again.',
      'Sometimes there are brackets inside brackets. Square brackets [ ] are often used for the outer pair so they are easy to tell apart. Work out the innermost brackets first, then work outward. On the calculator, every bracket is keyed with the ( and ) keys.'),
    B.example({
      title: 'Brackets change the answer',
      q: 'Find 12 + 8 × 3 and (12 + 8) × 3.',
      steps: ['12 + 8 × 3: multiply first, 8 × 3 = 24, then 12 + 24 = 36.', '(12 + 8) × 3: brackets first, 12 + 8 = 20, then 20 × 3 = 60.'],
      calc: { rows: [{ label: 'No brackets', seq: '12 + 8 × 3 =', expect: '36' }, { label: 'With brackets', seq: '( 12 + 8 ) × 3 =', expect: '60' }] },
      answer: '36 and 60. The same numbers give different answers.'
    }),
    B.example({
      title: 'A frame and brackets inside brackets',
      q: 'A rectangular frame is 450 mm by 300 mm. The distance around it is ' + L.m('2 × (450 + 300)') + '. Find it. Then find ' + L.m('2 × [15 − (4 + 6)]') + '.',
      fig: P.rectLW(450, 300, 'mm', { max: '2.2in' }),
      steps: ['Frame: brackets first, 450 + 300 = 750. Then 2 × 750 = 1,500 mm.', 'Inner brackets first: 4 + 6 = 10. The line is now 2 × [15 − 10].', 'Outer brackets: 15 − 10 = 5. Then 2 × 5 = 10.'],
      after: B.p('On the calculator, square brackets are keyed with the same ( and ) keys: 2 × ( 15 − ( 4 + 6 ) ) =. Close every bracket you open.'),
      answer: 'The frame is 1,500 mm around, and 2 × [15 − (4 + 6)] = 10.'
    }),
    B.watch('Key the × before a bracket', 'On paper, 3(4 + 5) means 3 × (4 + 5). The × is often left out next to a bracket. On the calculator, always key the × yourself: 3 × ( 4 + 5 ) = 27.'),
    B.check('3 × ( 4 + 5 ) =', '27'),
    B.check('2 × ( 450 + 300 ) =', '1500'),
    B.check('2 × ( 15 − ( 4 + 6 ) ) =', '10'),
    B.tryIt([
      { q: '(6 + 4) × (3 − 2)', a: n(ti('( 6 + 4 ) × ( 3 − 2 ) =')) },
      { q: '(25 − 5) ÷ 4', a: n(ti('( 25 − 5 ) ÷ 4 =')) },
      { q: '3 × (7 + 8)', a: n(ti('3 × ( 7 + 8 ) =')) },
      { q: '2 × (1,200 + 800)', a: n(ti('2 × ( 1200 + 800 ) =')) }

    ]),

    B.section('Exponents, squares and square roots'),
    B.p('An ' + B.term('exponent', 'A small raised number that says how many of that number are multiplied together. In 5³ the exponent is 3: 5³ = 5 × 5 × 5 = 125.') + ' is the small raised number that says how many of that number are multiplied together. In 5³ the exponent is 3: 5³ = 5 × 5 × 5 = 125.',
      'The ' + B.term('square', 'A number multiplied by itself. The square of 5, written 5², is 5 × 5 = 25.') + ' of a number is the number multiplied by itself. The square of 5 is written 5² and read "5 squared": 5 × 5 = 25. The ' + B.term('square root', 'The number that, multiplied by itself, gives the number you started with. √25 = 5 because 5 × 5 = 25.') + ' undoes a square. √25 = 5 because 5 × 5 = 25.',
      'Exponents and roots come right after brackets in BEDMAS. An exponent belongs only to the number or bracket it touches.'),
    B.example({
      title: 'What does the square belong to?',
      q: 'Find 100 − 5², (100 − 5)², 5 × 3² and (5 × 3)².',
      steps: ['100 − 5²: the square belongs to the 5. 5² = 25, then 100 − 25 = 75.', '(100 − 5)²: brackets first, 95, then 95² = 9,025.', '5 × 3²: the square belongs to the 3. 3² = 9, then 5 × 9 = 45.', '(5 × 3)²: brackets first, 15, then 15² = 225.'],
      calc: { rows: [{ label: '100 − 5²', seq: '100 − 5 x² =', expect: '75' }, { label: '(100 − 5)²', seq: '( 100 − 5 ) x²', expect: '9,025' }] },
      answer: '75, 9,025, 45 and 225.'
    }),
    B.p('A square root sign works like a bracket. The bar over the top covers everything under it, and all of that is worked out before the root is taken.'),
    B.example({
      title: 'A root over a sum',
      q: 'Find √(9 + 16) and √9 + √16.',
      steps: ['√(9 + 16): the root covers the sum. 9 + 16 = 25, then √25 = 5.', '√9 + √16: two separate roots. √9 = 3 and √16 = 4, then 3 + 4 = 7.', 'On the Sharp, key √ and then the sum in brackets. On the TI-30Xa, key the sum in brackets, then √x after the closing bracket.'],
      calc: { seq: '( 9 + 16 ) √x', expect: '5', title: '√(9 + 16)' },
      answer: '√(9 + 16) = 5 but √9 + √16 = 7. They are not the same.'
    }),
    B.tryIt([
      { q: '4²', a: n(ti('4 x²')) },
      { q: '2 × 3²', a: n(ti('2 × 3 x² =')) },
      { q: '(2 × 3)²', a: n(ti('( 2 × 3 ) x²')) },
      { q: '10 + 2³', a: n(ti('10 + 2 yˣ 3 =')) }

    ]),

    B.section('Left to right'),
    B.p('Division and multiplication share one step of BEDMAS. Addition and subtraction share the last step. When a line has two operations from the same step, work them in the order you meet them, from left to right.'),
    B.watch('Multiplication does not always come first', 'The M comes after the D in BEDMAS, but that does not mean divide before multiply. They share a step. 24 ÷ 4 × 3 = 18, not 24 ÷ 12 = 2. In the same way, 50 − 20 + 5 = 35, not 50 − 25 = 25.'),
    B.check('24 ÷ 12 =', '2'),
    B.check('50 − 20 + 5 =', '35'),
    B.check('20 − 8 − 2 =', '10'),
    B.check('9 √x + 16 √x =', '7'),
    B.check('5 × 3 x² =', '45'),
    B.check('( 5 × 3 ) x²', '225'),
    B.p('A bar is 6,000 mm long. You cut off 1,250 mm, then 875 mm, and then weld a 400 mm piece back on. Ignoring saw cuts, its length is 6,000 − 1,250 − 875 + 400. Left to right, that is 4,750, then 3,875, then 4,275 mm.'),
    B.example({
      title: 'Left to right',
      q: 'Find 48 ÷ 6 ÷ 2, 24 ÷ 4 × 3 and 20 − 8 − 2.',
      steps: ['48 ÷ 6 ÷ 2: left to right, 48 ÷ 6 = 8, then 8 ÷ 2 = 4. Working 6 ÷ 2 first would give 48 ÷ 3 = 16, which is wrong.', '24 ÷ 4 × 3: ÷ comes first, 24 ÷ 4 = 6, then 6 × 3 = 18.', '20 − 8 − 2: 20 − 8 = 12, then 12 − 2 = 10. Working 8 − 2 first would give 14, which is wrong.'],
      calc: { rows: [{ label: '48 ÷ 6 ÷ 2', seq: '48 ÷ 6 ÷ 2 =', expect: '4' }, { label: '24 ÷ 4 × 3', seq: '24 ÷ 4 × 3 =', expect: '18' }] },
      answer: '4, 18 and 10.'
    }),
    B.check('6000 − 1250 − 875 + 400 =', '4275'),
    B.tryIt([
      { q: '48 ÷ 4 × 2', a: n(ti('48 ÷ 4 × 2 =')) },
      { q: '90 ÷ 3 ÷ 5', a: n(ti('90 ÷ 3 ÷ 5 =')) },
      { q: '40 − 16 ÷ 4 × 2', a: n(ti('40 − 16 ÷ 4 × 2 =')) },
      { q: '30 − 10 + 5', a: n(ti('30 − 10 + 5 =')) }

    ]),

    B.section('The fraction bar groups'),
    B.p('A fraction bar means divide. It also groups: everything above the bar is worked out as one number, everything below the bar is worked out as one number, and then the top is divided by the bottom. It acts like a pair of brackets around the top and another pair around the bottom.',
      'On a calculator there is no fraction bar for a calculation like this, so you must key the brackets yourself: (top) ÷ (bottom).'),
    B.example({
      title: 'Brackets for a fraction bar',
      q: 'Find ' + bar('18 + 6', '15 − 8') + ' to two decimal places.',
      steps: ['Top: 18 + 6 = 24. Bottom: 15 − 8 = 7.', 'Divide: 24 ÷ 7 = 3.428571429..., which rounds to 3.43.', 'Keyed without brackets, 18 + 6 ÷ 15 − 8 = gives 10.4, because the calculator divides 6 ÷ 15 first. That answer is wrong.'],
      calc: { rows: [{ label: 'With brackets', seq: '( 18 + 6 ) ÷ ( 15 − 8 ) =', expect: '3.43' }, { label: 'Without brackets (wrong)', seq: '18 + 6 ÷ 15 − 8 =', expect: '10.4' }], say: 'This is the same calculation as an example in the Sharp manual, keyed with brackets.' },
      answer: '3.43'
    }),
    B.example({
      title: 'Hole spacing',
      q: 'Seven holes are evenly spaced along a 1,500 mm plate, with the end holes 150 mm from each end. Seven holes make 6 spaces. The spacing is ' + bar('1,500 − 2 × 150', '6') + '. Find it.',
      fig: holeRow(1500, 150, 7, { wd: 330, fs: 15, noEnds: true, max: '2.6in' }),
      steps: ['Top first, using BEDMAS inside it: 2 × 150 = 300, then 1,500 − 300 = 1,200.', 'Divide by the bottom: 1,200 ÷ 6 = 200.', 'On either calculator, key ( 1500 − 2 × 150 ) ÷ 6 =.'],
      answer: '200 mm centre to centre.'
    }),
    B.check('( 1500 − 2 × 150 ) ÷ 6 =', '200'),
    B.tryIt([
      { q: bar('45 + 27', '14 − 6'), a: n(ti('( 45 + 27 ) ÷ ( 14 − 6 ) =')) },
      { q: bar('312 + 305 + 298 + 309', '4'), a: n(ti('( 312 + 305 + 298 + 309 ) ÷ 4 =')) },
      { q: bar('100', '2 + 3'), a: n(ti('100 ÷ ( 2 + 3 ) =')) },
      { q: bar('2,400 − 2 × 200', '5'), a: n(ti('( 2400 − 2 × 200 ) ÷ 5 =')) }
    ]),

    B.section('Your calculator and BEDMAS'),
    B.p('Both calculators follow BEDMAS. Key a calculation from left to right, as it is written, and the calculator holds back an addition until any multiplication after it is done. That is why 3 + 4 × 5 = gives 23 on both. The TI-30Xa guidebook and the Sharp manual both list this order, with anything in brackets worked out first.',
      'The calculator only knows what you key. It cannot see a fraction bar, a root bar over a sum, or a square that belongs to a whole bracket. Before you key a formula from a drawing or a manual, find every grouping on paper, then key each one as brackets. On the Sharp, read the top line of the display before you press =.'),
    B.table(['Written', 'Key it as', 'Why'], [
      [bar('18 + 6', '15 − 8'), '( 18 + 6 ) ÷ ( 15 − 8 ) =', 'A fraction bar groups the top and the bottom'],
      ['√(9 + 16)', 'TI-30Xa: ( 9 + 16 ) √x<br>Sharp: √ ( 9 + 16 ) =', 'The root bar covers the whole sum'],
      ['(100 − 5)²', 'TI-30Xa: ( 100 − 5 ) x²<br>Sharp: ( 100 − 5 ) x² =', 'The square belongs to the bracket'],
      ['3(4 + 5)', '3 × ( 4 + 5 ) =', 'Key the × that is not written']
    ], { caption: 'When the calculator needs brackets.', align: ['c', 'c', ''] }),

    B.worksheet({ title: 'Order on the canvas', sub: 'Write the calculation, then work it out with BEDMAS', intro: 'Each drawing comes with a calculation. Work it out step by step on paper, rewriting the line after each step, then check it on your calculator.' }),
    B.grid2(
      B.prob({ q: 'The plate is split into A and B. Its area in mm² is 300 × 450 + 900 × 250. Work it out.', canvas: lPlate(900, 700, 300, 250, { max: '1.9in' }), a: '135,000 + 225,000 = ' + n(ti('300 × 450 + 900 × 250 =')) + ' mm²', lines: 2 }),
      B.prob({ q: 'The distance around the frame is 2 × (L + W). Find it. If L doubles, what is the new distance around?', canvas: P.rectLW(600, 250, 'mm', { names: true, max: '2.5in' }), a: '2 × (600 + 250) = ' + n(ti('2 × ( 600 + 250 ) =')) + ' mm. With L = 1,200 mm: 2 × (1,200 + 250) = ' + n(ti('2 × ( 1200 + 250 ) =')) + ' mm.', lines: 2 })
    ),
    B.grid2(
      B.prob({ q: 'The ring has R = 40 mm and r = 25 mm. Its area is π × (R² − r²). Find it to two decimal places.', canvas: P.ringR(40, 25, 'mm', { max: '2.3in' }), a: 'π × (1,600 − 625) = π × 975 = ' + n(L.round(ti('( 40 x² − 25 x² ) × π ='), 2), 2) + ' mm²', lines: 2 }),
      B.prob({ q: 'Nine holes are evenly spaced on a 1,350 mm bar, with the end holes 75 mm from the ends. The spacing is (1,350 − 2 × 75) ÷ 8. Find it.', canvas: holeRow(1350, 75, 9, { wd: 330, fs: 15, noEnds: true, max: '2.6in' }), a: '(1,350 − 150) ÷ 8 = ' + n(ti('( 1350 − 2 × 75 ) ÷ 8 =')) + ' mm', lines: 2 })
    ),

    B.worksheet({ title: 'Brackets or not?', sub: 'Work out, add brackets, and key it right', intro: 'Use BEDMAS for each problem. Where you add brackets, check the new line gives the answer asked for.' }),
    B.grid2(
      B.prob({ q: 'Find 6 + 4 × 3 − 2.', a: n(ti('6 + 4 × 3 − 2 =')), lines: 2 }),
      B.prob({ q: 'Find 9 + 36 ÷ 4 − 2.', a: n(ti('9 + 36 ÷ 4 − 2 =')), lines: 2 }),
      B.prob({ q: 'Find 2 × 3² and (2 × 3)². Why are they different?', a: n(ti('2 × 3 x² =')) + ' and ' + n(ti('( 2 × 3 ) x²')) + '. In 2 × 3² the square belongs to the 3 only.', lines: 2 }),
      B.prob({ q: 'Find 40 − 16 ÷ 4 × 2.', a: n(ti('40 − 16 ÷ 4 × 2 =')) + ' (16 ÷ 4 = 4, 4 × 2 = 8, 40 − 8 = 32)', lines: 2 }),
      B.prob({ q: 'Add one pair of brackets to make this true: 12 + 8 ÷ 4 = 5.', a: '(12 + 8) ÷ 4 = 5', lines: 2 }),
      B.prob({ q: 'Add one pair of brackets to make this true: 3 × 5 − 2 + 4 = 13.', a: '3 × (5 − 2) + 4 = 13', lines: 2 }),
      B.prob({ q: 'Find √(36 + 64) and √36 + √64.', a: n(ti('( 36 + 64 ) √x')) + ' and ' + n(ti('36 √x + 64 √x =')), lines: 2 }),
      B.prob({ q: 'Write the keys for ' + bar('45 + 27', '14 − 6') + ' and find the answer.', a: '( 45 + 27 ) ÷ ( 14 − 6 ) = gives ' + n(ti('( 45 + 27 ) ÷ ( 14 − 6 ) =')), lines: 2 })
    ),
    B.check('( 12 + 8 ) ÷ 4 =', '5'),
    B.check('3 × ( 5 − 2 ) + 4 =', '13'),
    B.grid2(
      B.prob({ q: 'Three 1,500 mm pieces are cut from a 6,000 mm bar with three cuts. The kerf is 3 mm. The offcut is 6,000 − (3 × 1,500 + 3 × 3). Find it.', a: '6,000 − (4,500 + 9) = ' + n(ti('6000 − ( 3 × 1500 + 3 × 3 ) =')) + ' mm', lines: 2 }),
      B.prob({ q: 'In 5 × 3², change the 3 to a 4. What is the new answer? By how much did it grow?', a: '5 × 4² = ' + n(ti('5 × 4 x² =')) + '. It grew by ' + n(ti('5 × 4 x² =') - ti('5 × 3 x² =')) + ' (from 45 to 80).', lines: 2 })
    ),
    B.prob({ q: 'A crew splits 120 m and 60 m of cable equally among 3 jobs. A learner keys 120 + 60 ÷ 3 = and gets 140. What went wrong? Write the right keys and the right answer.', a: 'The calculator divided 60 ÷ 3 first. Key ( 120 + 60 ) ÷ 3 = to get ' + n(ti('( 120 + 60 ) ÷ 3 =')) + ' m per job.', lines: 2 }),
    B.check('120 + 60 ÷ 3 =', '140')
  ]);
};
