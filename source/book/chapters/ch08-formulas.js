/* Chapter 8: Formulas and Transposing */
module.exports = function (B, L) {
  const F = require('../engine/figs.js');
  const C = F.C;
  const n = L.num, R = L.round;
  const d2 = x => n(R(x, 2), 2);
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
  const tF = 't<sub>F</sub>', tC = 't<sub>C</sub>';

  const G = require('../engine/figs-ch08.js');
  const { SH } = G.shapers(B);

  /* ---------- drawings ---------- */
  function balances(pairs, o) {
    o = o || {};
    let h = '';
    pairs.forEach((p, i) => {
      h += '<g transform="translate(' + (i * 470) + ',0)">' + G.balanceBody(p[0], p[1], p[2]) + '</g>';
      if (i < pairs.length - 1) h += F.line(i * 470 + 406, 120, i * 470 + 456, 120, { c: C.dim, w: 2.5 }) + F.arrowHead(i * 470 + 462, 120, 0, C.dim);
    });
    return F.svg(pairs.length * 470 - 70, 204, h, { max: o.max || '5.8in' });
  }
  /* rows of boxes joined by arrows: [{lab, items}] first and last item are letters, the middle items operations */
  function flow(rows, o) {
    o = o || {};
    const bw = 84, bh = 36, gap = 40, x0 = 74;
    let h = '';
    const cols = Math.max(...rows.map(r => r.items.length));
    rows.forEach((r, ri) => {
      const y = 12 + ri * 66;
      h += F.t(6, y + bh / 2 + 5, r.lab, { s: 14, b: true, a: 'start', c: r.c || C.ink });
      r.items.forEach((it, i) => {
        const x = x0 + i * (bw + gap), end = i === 0 || i === r.items.length - 1;
        h += F.rect(x, y, bw, bh, { fill: end ? C.fill : '#FFFFFF', c: end ? C.edge : (r.c || C.dim), w: end ? 2.2 : 1.6 });
        h += F.t(x + bw / 2, y + bh / 2 + 6, it, { s: 17, b: true, c: end ? C.edge : (r.c || C.ink) });
        if (i < r.items.length - 1) h += F.line(x + bw + 4, y + bh / 2, x + bw + gap - 8, y + bh / 2, { c: r.c || C.dim, w: 2 }) + F.arrowHead(x + bw + gap - 3, y + bh / 2, 0, r.c || C.dim);
      });
    });
    return F.svg(x0 + cols * (bw + gap) - gap + 6, 12 + rows.length * 66 - 18, h, { max: o.max || '5in' });
  }
  /* squares drawn to scale with their areas */
  function squaresFig(sides, unit) {
    const sc = 5.6, base = 210;
    let h = '', x = 16;
    sides.forEach(s => {
      const w = s * sc;
      h += F.rect(x, base - w, w, w);
      h += F.dim(x, base - w, x + w, base - w, n(s) + ' ' + unit, -18, { s: 12.5 });
      h += F.t(x + w / 2, base + 22, 'A = ' + n(s * s) + ' ' + unit + '²', { s: 13, b: true, c: C.edge });
      x += w + 46;
    });
    return F.svg(x - 30, base + 32, h, { max: '4in' });
  }
  /* ---------- worked numbers ---------- */
  const cD = 1000 / PI;
  const rPlate = Math.sqrt(50000 / PI);
  const rIn = Math.sqrt(1000 / PI), dIn = 2 * rIn;
  const hTank = 1.5 / (PI * 0.5 * 0.5);
  const tC350 = (350 - 32) / 1.8;

  return L.join([
    B.chapter({
      num: 8, id: 'formulas', title: 'Formulas and Transposing',
      intro: B.p('A formula is a short rule that tells you how to work something out. Shop drawings, code books and manuals are full of them: the area of a plate, the distance around a pipe, the volume of a tank.',
        'This chapter shows you how to read a formula, put your own numbers into it, and turn it around to find a different value. Turning a formula around is called transposing. It lets you start from the answer you need, such as an area, and find the size that gives it. Every result is checked by putting it back into the formula.'),
      objectives: ['Read a formula and name its subject, variables and constants', 'Substitute values into a formula and work it out with BEDMAS', 'Use inverse operations to keep an equation balanced', 'Transpose one-step and two-step formulas', 'Transpose formulas with squares and square roots, such as A = π × r²', 'Check every answer by substituting it back'],
      words: ['formula', 'variable', 'constant', 'subject of a formula', 'substitute', 'inverse operation', 'transpose'],
      art: balances([['1,200 × w', '960,000', '÷ 1,200'], ['w', '800']], { max: '6in' })
    }),

    B.section('Reading a formula'),
    B.p('A ' + B.term('formula', 'A rule written with letters and symbols that shows how to work out one quantity from others, such as A = l × w.') + ' is a rule written with letters and symbols. The formula for the area of a rectangle is ' + m('A = l × w') + '. It says: the area A equals the length l times the width w.',
      'A letter that stands for a quantity that can change is a ' + B.term('variable', 'A letter in a formula that stands for a quantity that can change, such as l for length.') + '. A value that never changes is a ' + B.term('constant', 'A value in a formula that is always the same, such as π or the 2 in P = 2 × (l + w).') + '. In ' + m('C = π × D') + ', C and D are variables and π is a constant.',
      'The letter on its own on the left of the equals sign is the ' + B.term('subject of a formula', 'The letter on its own on one side of the equals sign. The formula tells you how to work it out.', 'subject') + ' of the formula. The formula tells you how to work out the subject from the other values.'),
    B.table(['Formula', 'What it works out', 'What the letters mean'], [
      [m('A = l × w'), 'Area of a rectangle', 'A area, l length, w width'],
      [m('P = 2 × (l + w)'), 'Perimeter of a rectangle', 'P perimeter (distance around)'],
      [m('C = π × D'), 'Distance around a circle', 'C circumference, D diameter'],
      [m('A = π × r²'), 'Area of a circle', 'r radius (half the diameter)'],
      [m('V = l × w × h'), 'Volume of a box shape', 'V volume, h height'],
      [m(tF + ' = 1.8 × ' + tC + ' + 32'), 'Temperature in °F from °C', tF + ' degrees Fahrenheit, ' + tC + ' degrees Celsius']
    ], { caption: 'Formulas used in this chapter. Chapters 9, 10 and 11 explain where the shape formulas come from.' }),
    B.p('Some books leave out the × sign: ' + m('lw') + ' means ' + m('l × w') + ' and ' + m('2l') + ' means ' + m('2 × l') + '. A small raised 2 means squared: ' + m('r²') + ' means ' + m('r × r') + '. This book writes the × sign every time.'),
    B.tryIt([
      { q: 'What is the subject of ' + m('V = l × w × h') + '?', a: 'V' },
      { q: 'Name the constant in ' + m('A = π × r²') + '.', a: 'π (the 2 in r² is a power, it tells you to square r)' },
      { q: 'Name the variables in ' + m('C = π × D') + '.', a: 'C and D' },
      { q: 'Rewrite ' + m('2lw') + ' with × signs.', a: '2 × l × w' },
      { q: 'What does ' + m('s²') + ' mean?', a: 's × s' },
      { q: 'Name the two constants in ' + m(tF + ' = 1.8 × ' + tC + ' + 32') + '.', a: '1.8 and 32' }
    ]),

    B.section('Substituting values'),
    B.p('To ' + B.term('substitute', 'To replace a letter in a formula with its value.') + ' means to put a number in place of a letter. Write the formula, write it again with the numbers in place of the letters, then work it out using ' + B.term('BEDMAS') + ' from Chapter 3.'),
    B.how(['Write the formula.', 'Write it again with each letter replaced by its value. Keep every bracket.', 'Work it out in BEDMAS order: brackets, exponents, division and multiplication, then addition and subtraction.', 'Write the answer with its unit.']),
    EX({
      title: 'Area and perimeter of a plate',
      q: 'A plate is 1,200 mm long and 800 mm wide. Use ' + m('A = l × w') + ' to find its area and ' + m('P = 2 × (l + w)') + ' to find the distance around it.',
      steps: ['Area: ' + m('A = 1,200 × 800 = ' + n(1200 * 800)) + '.', 'Perimeter: ' + m('P = 2 × (1,200 + 800)') + '. Brackets first, 1,200 + 800 = 2,000. Then 2 × 2,000 = 4,000.'],
      calc: { title: 'Perimeter', seq: '2 × ( 1200 + 800 ) =', expect: '4,000', say: 'Key the brackets. Without them the calculator works 2 × 1,200 first and then adds 800.' },
      answer: 'A = ' + n(1200 * 800) + ' mm² (square millimetres) and P = 4,000 mm.'
    }),
    EX({
      title: 'Formulas with π and a square',
      q: 'A disc has a diameter of 150 mm, so its radius is 75 mm. Use ' + m('C = π × D') + ' to find the distance around it and ' + m('A = π × r²') + ' to find its area. Round to two decimal places.',
      steps: ['Distance around: ' + m('C = π × 150 = ' + d2(PI * 150)) + '. Use the π key. It holds many more digits than 3.14.', 'Area: ' + m('A = π × 75²') + '. The exponent comes first, so square only the 75: 75² = ' + n(75 * 75) + '. Then π × ' + n(75 * 75) + ' = ' + d2(PI * 5625) + '.'],
      calc: { rows: [{ label: 'Distance around', seq: 'π × 150 =', expect: d2(PI * 150) }, { label: 'Area', seq: 'π × 75 x² =', expect: d2(PI * 5625) }], say: 'The x² key squares only the number just before it, so the calculator follows BEDMAS for you.' },
      answer: 'C = ' + d2(PI * 150) + ' mm and A = ' + d2(PI * 5625) + ' mm².'
    }),
    EX({
      title: 'Converting a temperature',
      q: 'The formula ' + m(tF + ' = 1.8 × ' + tC + ' + 32') + ' changes a Celsius temperature to Fahrenheit. Change 20 °C to °F.',
      steps: [m(tF + ' = 1.8 × 20 + 32'), 'Multiply first: 1.8 × 20 = 36. Then add: 36 + 32 = 68.'],
      answer: '68 °F'
    }),
    B.check('1.8 × 20 + 32 =', '68'),
    B.watch('Use the same units', 'Every length in a formula must be in the same unit. A plate 1.2 m long and 800 mm wide must be changed to 1,200 mm by 800 mm, or 1.2 m by 0.8 m, before you multiply. Chapter 7 shows how.'),
    B.tryIt([
      { q: m('A = l × w') + ' with l = 2.4 m and w = 1.2 m.', a: n(R(2.4 * 1.2, 2)) + ' m²' },
      { q: m('P = 2 × (l + w)') + ' with l = 600 mm and w = 450 mm.', a: n(2 * (600 + 450)) + ' mm' },
      { q: m('C = π × D') + ' with D = 300 mm. Round to two decimal places.', a: d2(PI * 300) + ' mm' },
      { q: m('A = π × r²') + ' with r = 20 cm. Round to two decimal places.', a: d2(PI * 400) + ' cm²' },
      { q: m('V = l × w × h') + ' with l = 2 m, w = 1.5 m and h = 0.5 m.', a: n(R(2 * 1.5 * 0.5, 3)) + ' m³' },
      { q: m(tF + ' = 1.8 × ' + tC + ' + 32') + ' with ' + tC + ' = 35 °C.', a: n(R(1.8 * 35 + 32, 2)) + ' °F' }
    ]),

    B.section('Keeping an equation balanced'),
    B.p('An equals sign says that both sides have the same value. Think of a balance scale that is level. If you take something off one pan, you must take the same off the other pan, or the scale tips. The same rule keeps an equation true: whatever you do to one side, do to the other side.'),
    B.p('To find an unknown value you undo what has been done to it. Each operation has an ' + B.term('inverse operation', 'An operation that undoes another. Subtracting undoes adding, dividing undoes multiplying, and a square root undoes squaring.') + ' that undoes it.'),
    B.table(['If the letter has been', 'Undo it by', 'Example'], [
      ['added to (+ 250)', 'subtracting (− 250)', m('x + 250 − 250 = x')],
      ['subtracted from (− 75)', 'adding (+ 75)', m('x − 75 + 75 = x')],
      ['multiplied (× 4)', 'dividing (÷ 4)', m('4 × x ÷ 4 = x')],
      ['divided (÷ 3)', 'multiplying (× 3)', m('x ÷ 3 × 3 = x')],
      ['squared (x²)', 'taking the square root (√)', m('√(x²) = x')]
    ], { caption: 'Operations and their inverses.' }),
    B.figure(balances([['x + 250', '900', '− 250'], ['x', '650']]), 'Take 250 off both pans and the scale stays level. The unknown x is left on its own.'),
    EX({
      title: 'Undoing an operation',
      q: 'A 900 mm bar is cut into a 250 mm piece and a second piece, so ' + m('x + 250 = 900') + '. Solve it. Then solve ' + m('4 × x = 1,000') + ' and ' + m('x ÷ 3 = 125') + '.',
      fig: F.cutBar([{ len: 250 }, { len: 650, ask: true }], { w: 420 }),
      steps: ['250 was added to x. Subtract 250 from both sides: ' + m('x = 900 − 250 = 650') + '. Check: 650 + 250 = 900.', 'x was multiplied by 4. Divide both sides by 4: ' + m('x = 1,000 ÷ 4 = 250') + '. Check: 4 × 250 = 1,000.', 'x was divided by 3. Multiply both sides by 3: ' + m('x = 125 × 3 = 375') + '. Check: 375 ÷ 3 = 125.'],
      answer: 'The second piece is 650 mm. Then x = 250 and x = 375.'
    }),
    B.keyidea('Key idea', 'Do the same thing to both sides. Pick the inverse operation that leaves the letter on its own.'),
    B.tryIt([
      { q: 'Solve ' + m('x + 38 = 120') + '.', a: String(120 - 38) },
      { q: 'Solve ' + m('x − 45 = 155') + '.', a: String(155 + 45) },
      { q: 'Solve ' + m('6 × x = 1,500') + '.', a: String(1500 / 6) },
      { q: 'Solve ' + m('x ÷ 4 = 35') + '.', a: String(35 * 4) },
      { q: 'Solve ' + m('x + 1,275 = 6,000') + '.', a: n(6000 - 1275) },
      { q: 'Solve ' + m('12 × x = 3,000') + '.', a: String(3000 / 12) }
    ]),

    B.section('Transposing one-step formulas'),
    B.p('To ' + B.term('transpose', 'To rearrange a formula so that a different letter becomes its subject.') + ' a formula means to rearrange it so that a different letter becomes the subject. You use the balance rule from the last section. The letters stay letters until the end, then you substitute the numbers.'),
    B.how(['Find the letter you want on its own.', 'Ask what has been done to it.', 'Undo that with the inverse operation, on both sides.', 'Write the new formula with the letter you want on the left.', 'Substitute the numbers, work it out, then check.']),
    B.p('In the Shape Canvas, change one size and the numbers that depend on it update. Transposing lets you work the other way, from a value you need, such as an area, back to the size that gives it.'),
    EX({
      title: 'Given the area, find the width',
      q: 'A rectangular plate must have an area of 960,000 mm². It is 1,200 mm long. Transpose ' + m('A = l × w') + ' to find the width.',
      fig: SH('rectangle', { l: 1200, w: 800 }, { hide: ['w'], width: '2in' }),
      steps: ['w has been multiplied by l. Divide both sides by l.', m('A ÷ l = l × w ÷ l') + ', so ' + m('w = A ÷ l') + '.', m('w = 960,000 ÷ 1,200 = 800')],
      calc: { seq: '960000 ÷ 1200 =', expect: '800' },
      answer: 'w = 800 mm. Check: 1,200 × 800 = 960,000.'
    }),
    EX({
      title: 'Given the distance around, find the diameter',
      q: 'A tape wrapped once around a round tank reads 1,000 mm. Transpose ' + m('C = π × D') + ' and find the diameter to two decimal places.',
      steps: ['D has been multiplied by π. Divide both sides by π, so ' + m('D = C ÷ π') + '.', m('D = 1,000 ÷ π = ' + d2(cD))],
      calc: { seq: '1000 ÷ π =', expect: d2(cD) },
      answer: 'D = ' + d2(cD) + ' mm. Check: π × 318.31 = ' + n(R(318.31 * PI, 2), 2) + ' to two decimal places, so the answer is right.'
    }),
    EX({
      title: 'Find the height of a tank',
      q: 'A tank with a rectangular base 1.2 m long and 0.8 m wide must hold 0.576 m³. Transpose ' + m('V = l × w × h') + ' to find the height.',
      steps: ['h has been multiplied by l and by w. Divide both sides by l × w, so ' + m('h = V ÷ (l × w)') + '.', m('h = 0.576 ÷ (1.2 × 0.8) = 0.576 ÷ 0.96 = 0.6')],
      calc: { seq: '0.576 ÷ ( 1.2 × 0.8 ) =', expect: '0.6', say: 'The brackets matter. Keyed as 0.576 ÷ 1.2 × 0.8, both calculators divide by 1.2 and then multiply by 0.8, which gives 0.384.' },
      answer: '0.6 m. Check: 1.2 × 0.8 × 0.6 = 0.576.'
    }),
    B.check('0.576 ÷ 1.2 × 0.8 =', '0.384'),
    B.check('1.2 × 0.8 × 0.6 =', '0.576'),
    B.tryIt([
      { q: 'Make l the subject of ' + m('A = l × w') + '.', a: 'l = A ÷ w' },
      { q: 'A = 2.88 m² and w = 1.2 m. Find l.', a: n(R(2.88 / 1.2, 2)) + ' m' },
      { q: 'A sheet has an area of 1,152 in² and is 24 in wide. Find its length.', a: (1152 / 24) + ' in (4 ft)' },
      { q: 'C = 942.48 mm. Find D to the nearest millimetre.', a: n(Math.round(942.48 / PI)) + ' mm' },
      { q: m('D = 2 × r') + '. D = 168 mm. Find r.', a: (168 / 2) + ' mm' },
      { q: 'V = 1.5 m³, l = 2 m and w = 1.5 m. Find h.', a: n(R(1.5 / (2 * 1.5), 2)) + ' m' },
      { q: 'A square has ' + m('P = 4 × s') + '. P = 2,400 mm. Find s.', a: (2400 / 4) + ' mm' }
    ]),

    B.section('Transposing two-step formulas'),
    B.p('In a two-step formula, two things have been done to the letter you want. Undo them in the reverse order. The last thing done is the first thing you undo, just as you take off your boots before your socks.'),
    B.figure(flow([{ lab: 'Do', items: ['l', '+ w', '× 2', 'P'] }, { lab: 'Undo', items: ['P', '÷ 2', '− w', 'l'], c: C.red }]), 'In P = 2 × (l + w), l has w added and then is multiplied by 2. To get l back, divide by 2 and then subtract w.'),
    EX({
      title: 'Find the length from the perimeter',
      q: 'A rectangular frame uses 5,000 mm of flat bar all the way around. It is 900 mm wide. Transpose ' + m('P = 2 × (l + w)') + ' to find the length.',
      steps: ['Undo the × 2: divide both sides by 2. ' + m('P ÷ 2 = l + w'), 'Undo the + w: subtract w from both sides. ' + m('l = P ÷ 2 − w'), m('l = 5,000 ÷ 2 − 900 = 2,500 − 900 = 1,600')],
      calc: { seq: '5000 ÷ 2 − 900 =', expect: n(5000 / 2 - 900) },
      answer: n(5000 / 2 - 900) + ' mm. Check: 2 × (1,600 + 900) = 5,000.'
    }),
    EX({
      title: 'Fahrenheit to Celsius',
      q: 'Transpose ' + m(tF + ' = 1.8 × ' + tC + ' + 32') + ' to make ' + tC + ' the subject. Then change 350 °F to °C, to two decimal places.',
      steps: [tC + ' was multiplied by 1.8 and then 32 was added. Undo the + 32 first: ' + m(tF + ' − 32 = 1.8 × ' + tC), 'Then undo the × 1.8: ' + m(tC + ' = (' + tF + ' − 32) ÷ 1.8'), m(tC + ' = (350 − 32) ÷ 1.8 = 318 ÷ 1.8 = ' + d2(tC350))],
      calc: { seq: '( 350 − 32 ) ÷ 1.8 =', expect: d2(tC350), say: 'Keyed without brackets, 350 − 32 ÷ 1.8 gives ' + d2(350 - 32 / 1.8) + ', because the calculator divides first.' },
      answer: d2(tC350) + ' °C. NIST publishes the same conversion: ' + tC + ' = (' + tF + ' − 32) / 1.8.'
    }),
    B.check('350 − 32 ÷ 1.8 =', d2(350 - 32 / 1.8)),
    EX({
      title: 'Height of a gusset',
      q: 'A triangular gusset has an area given by ' + m('A = b × h ÷ 2') + '. Its base is 400 mm and its area must be 60,000 mm². Find the height.',
      fig: SH('right-triangle', { b: 400, h: 300 }, { hide: ['h'], width: '1.9in' }),
      steps: ['Undo the ÷ 2: ' + m('2 × A = b × h'), 'Undo the × b: ' + m('h = 2 × A ÷ b'), m('h = 2 × 60,000 ÷ 400 = 300')],
      calc: { seq: '2 × 60000 ÷ 400 =', expect: '300' },
      answer: '300 mm. Check: 400 × 300 ÷ 2 = 60,000.'
    }),
    B.tryIt([
      { q: m('P = 2 × (l + w)') + '. P = 3,600 mm and l = 1,100 mm. Find w.', a: n(3600 / 2 - 1100) + ' mm' },
      { q: 'Make w the subject of ' + m('P = 2 × (l + w)') + '.', a: 'w = P ÷ 2 − l' },
      { q: 'Change 212 °F to °C.', a: n(R((212 - 32) / 1.8, 2)) + ' °C' },
      { q: 'Change −40 °F to °C.', a: n(R((-40 - 32) / 1.8, 2)) + ' °C' },
      { q: 'An invoice uses ' + m('T = 60 + 85 × h') + ', with T in dollars and h in hours. T = $740. Find h.', a: n((740 - 60) / 85) + ' hours, from h = (T − 60) ÷ 85' },
      { q: m('A = b × h ÷ 2') + '. A = 6,000 mm² and b = 120 mm. Find h.', a: n(2 * 6000 / 120) + ' mm' }
    ]),

    B.section('Formulas with squares and square roots'),
    B.p('Squaring and taking the ' + B.term('square root') + ' undo each other. If a letter has been squared, take the square root of both sides to get it back.'),
    EX({
      title: 'Side of a square plate',
      q: 'A square plate must have an area of 62,500 mm². Transpose ' + m('A = s²') + ' and find the side.',
      steps: ['s has been squared. Take the square root of both sides, so ' + m('s = √A') + '.', m('s = √62,500 = 250')],
      calc: { seq: '62500 √x', expect: '250' },
      answer: '250 mm. Check: 250² = 250 × 250 = 62,500.'
    }),
    B.figure(squaresFig([10, 20, 30], 'cm'), 'Change the side of a square and its area changes with it. Four times the area goes with twice the side. Nine times the area goes with three times the side.'),
    B.p('In ' + m('A = π × r²') + ', two things are done to r: it is squared, then multiplied by π. Undo them in reverse order. Divide by π first, then take the square root.'),
    B.formula('Radius from the area of a circle', [m('r = √(A ÷ π)') + '  ' + m('D = 2 × r')], 'Divide by π first, then take the square root. Double r to get the diameter.'),
    EX({
      title: 'Given the area, find the radius',
      q: 'A round plate must have an area of 50,000 mm². Find its radius and its diameter, to two decimal places.',
      fig: SH('circle', { r: 126 }, { hide: ['r', 'D'], derived: 'show', width: '1.6in' }),
      steps: ['Undo the × π: ' + m('A ÷ π = r²'), 'Undo the square: ' + m('r = √(A ÷ π)'), m('r = √(50,000 ÷ π) = ' + d2(rPlate)), m('D = 2 × r = 2 × ' + n(R(rPlate, 4), 4) + '… = ' + d2(2 * rPlate)) + ' (use the unrounded r)'],
      calc: { title: 'Diameter', seq: '50000 ÷ π = √x × 2 =', expect: d2(2 * rPlate), say: 'The calculator keeps every digit of r, so the diameter comes from the unrounded r.' },
      answer: 'r = ' + d2(rPlate) + ' mm and D = ' + d2(2 * rPlate) + ' mm. Check: π × ' + d2(rPlate) + '² = ' + n(R(PI * R(rPlate, 2) ** 2, 1), 1) + ', very close to 50,000.'
    }),
    B.check('1200 × 800 =', n(1200 * 800)),
    B.check('318.31 × π =', n(R(318.31 * PI, 2), 2)),
    B.check('50000 ÷ π = √x', d2(rPlate)),
    B.check('π × 126.16 x² =', n(R(PI * 126.16 * 126.16, 1), 1)),
    EX({
      title: 'An imperial cover plate',
      q: 'A round cover plate must have an area of 1,000 in². Find its diameter to the nearest 1/16 in.',
      steps: [m('r = √(1,000 ÷ π) = ' + n(R(rIn, 3), 3)) + ' in, so ' + m('D = 2 × r = ' + n(R(dIn, 3), 3)) + ' in.', 'Change the decimal part to sixteenths: ' + n(R(dIn - 35, 3), 3) + ' × 16 = ' + n(R(R(dIn - 35, 3) * 16, 2), 2) + ', which rounds to ' + Math.round((dIn - 35) * 16) + '.'],
      calc: { seq: '1000 ÷ π = √x × 2 =', expect: n(R(dIn, 3), 3) },
      answer: 'D = ' + L.inch(dIn, 16)
    }),
    B.check('0.682 × 16 =', n(R(0.682 * 16, 2), 2)),
    B.watch('Divide by π before the square root', 'In ' + m('r = √(A ÷ π)') + ' the division is inside the root. Taking √50,000 first and then dividing by π gives ' + d2(Math.sqrt(50000) / PI) + ', which is wrong. On the TI-30Xa press = before √x. On the Sharp put the division in brackets after √.'),
    B.check('50000 √x ÷ π =', d2(Math.sqrt(50000) / PI)),
    B.tryIt([
      { q: 'A square has an area of 1,600 cm². Find its side.', a: Math.sqrt(1600) + ' cm' },
      { q: 'A square has an area of 0.36 m². Find its side.', a: n(R(Math.sqrt(0.36), 2)) + ' m' },
      { q: 'A circle has an area of 31,416 mm². Find r to the nearest millimetre.', a: n(Math.round(Math.sqrt(31416 / PI))) + ' mm' },
      { q: 'A circle has an area of 2,000 mm². Find D to two decimal places.', a: d2(2 * Math.sqrt(2000 / PI)) + ' mm' },
      { q: 'A round tank has ' + m('V = π × r² × h') + ', r = 0.5 m and V = 1.5 m³. Find h to two decimal places.', a: d2(hTank) + ' m, from h = V ÷ (π × r²)' },
      { q: 'The area of a square is made 9 times as big. What happens to its side?', a: 'The side becomes 3 times as long (√9 = 3).' }
    ]),

    B.section('Checking by substituting back'),
    B.p('A transposed formula can look right and still be wrong. The check takes a few seconds: put your answer back into the formula you started with, together with the values you were given. If the formula works out to the value you were given, your answer is right. If you rounded the answer, the check comes out close rather than exact.'),
    EX({
      title: 'Catching a mistake',
      q: 'A learner transposes ' + m('V = l × w × h') + ' and writes ' + m('h = V × l ÷ w') + '. With V = 0.45 m³, l = 1.5 m and w = 0.6 m this gives h = ' + n(R(0.45 * 1.5 / 0.6, 4)) + ' m. Check the answer and correct it.',
      steps: ['Substitute back: ' + m('1.5 × 0.6 × ' + n(R(0.45 * 1.5 / 0.6, 4)) + ' = ' + n(R(1.5 * 0.6 * 0.45 * 1.5 / 0.6, 4))) + '. That is not 0.45, so the answer is wrong.', 'The mistake: l multiplies h, so it must divide. ' + m('h = V ÷ (l × w) = 0.45 ÷ (1.5 × 0.6) = 0.5'), 'Substitute back: ' + m('1.5 × 0.6 × 0.5 = 0.45') + '. It checks.'],
      calc: { seq: '0.45 ÷ ( 1.5 × 0.6 ) =', expect: '0.5' },
      answer: 'h = 0.5 m'
    }),
    B.check('1.5 × 0.6 × 0.5 =', '0.45'),
    B.check('0.45 × 1.5 ÷ 0.6 =', n(R(0.45 * 1.5 / 0.6, 4))),
    B.check('1.5 × 0.6 × 1.125 =', n(R(1.5 * 0.6 * 1.125, 4))),
    B.p('Also ask whether the size is reasonable before you cut. A tank 1.5 m long and 0.6 m wide that holds less than half a cubic metre cannot be more than a metre tall.'),
    B.keyidea('Key idea', 'Transpose with letters, substitute the numbers, then check by putting the answer back into the original formula.'),

    B.worksheet({ title: 'Given the area, find the side', sub: 'Use the value you know to find the ?', intro: 'Transpose the formula first, then substitute. Check each answer by putting it back into the formula you started with. Round to two decimal places where the answer does not come out exactly.' }),
    B.grid2(
      B.prob({ q: 'The rectangle has an area of 7,200 cm² and a length of 120 cm. Use ' + m('A = l × w') + ' to find the width.', canvas: SH('rectangle', { l: 120, w: 60 }, { units: 'cm', hide: ['w'], width: '2in' }), a: n(7200 / 120) + ' cm', work: 'w = A ÷ l = 7,200 ÷ 120', lines: 3 }),
      B.prob({ q: 'The square has an area of 2,025 cm². Use ' + m('A = s²') + ' to find the side.', canvas: SH('square', { s: 45 }, { units: 'cm', hide: ['s'], width: '1.45in' }), a: n(Math.sqrt(2025)) + ' cm', work: 's = √A = √2,025', lines: 3 })
    ),
    B.grid2(
      B.prob({ q: 'The circle has an area of 5,000 mm². Find the radius and the diameter.', canvas: SH('circle', { r: 40 }, { hide: ['r', 'D'], derived: 'show', width: '1.55in' }), a: 'r = ' + d2(Math.sqrt(5000 / PI)) + ' mm, D = ' + d2(2 * Math.sqrt(5000 / PI)) + ' mm', work: 'r = √(5,000 ÷ π), D = 2 × r', lines: 3 }),
      B.prob({ q: 'The gusset has an area of 43,200 mm² and a base of 360 mm. Use ' + m('A = b × h ÷ 2') + ' to find the height.', canvas: SH('right-triangle', { b: 360, h: 240 }, { hide: ['h'], width: '1.9in' }), a: n(2 * 43200 / 360) + ' mm', work: 'h = 2 × A ÷ b = 2 × 43,200 ÷ 360', lines: 3 })
    ),
    B.grid2(
      B.prob({ q: 'The box holds 0.72 m³. Use ' + m('V = l × w × h') + ' to find the height.', canvas: SH('rectangular-prism', { l: 1.2, w: 0.8, h: 0.75 }, { units: 'm', hide: ['h'], width: '1.9in' }), a: n(R(0.72 / (1.2 * 0.8), 2)) + ' m', work: 'h = V ÷ (l × w) = 0.72 ÷ (1.2 × 0.8)', lines: 3 }),
      B.prob({ q: 'The round tank holds 2 m³. Use ' + m('V = π × r² × h') + ' to find the height.', canvas: G.cyl3d(0.6, 1.77, 'm', { askH: true, max: '1.35in' }), a: d2(2 / (PI * 0.36)) + ' m', work: 'h = V ÷ (π × r²) = 2 ÷ (π × 0.6²)', lines: 3 })
    ),
    B.grid2(
      B.prob({ q: 'Change one value: the square in problem 2 is given an area 4 times as big, 8,100 cm². Find the new side. What happened to the side?', a: n(Math.sqrt(8100)) + ' cm. The side doubled.', lines: 3 }),
      B.prob({ q: 'Change one value: the rectangle in problem 1 keeps its area of 7,200 cm², but its length is doubled to 240 cm. Find the new width. What happened to the width?', a: n(7200 / 240) + ' cm. The width was halved.', lines: 3 })
    ),

    B.prob({ q: 'Find the mistake. A learner keys 0.72 ÷ 1.2 × 0.8 = to find the height of a box 1.2 m by 0.8 m that holds 0.72 m³, and gets ' + n(R(0.72 / 1.2 * 0.8, 2)) + ' m. What went wrong? Find the correct height and check it.', a: 'l × w must be in brackets: h = V ÷ (l × w) = ' + n(R(0.72 / 0.96, 2)) + ' m. Check: 1.2 × 0.8 × 0.75 = 0.72.', lines: 3 }),

    B.worksheet({ title: 'Rearrange, solve and check', sub: 'Transpose with letters first, then put in the numbers', intro: 'Show the transposed formula, the substitution and the check. Round to two decimal places unless the problem says otherwise.' }),
    B.grid2(
      B.prob({ q: 'Make D the subject of ' + m('C = π × D') + '. Find the diameter of a pipe whose circumference is 2,000 mm.', canvas: G.circleCallout('C = 2,000 mm', '2.4in'), a: 'D = C ÷ π = ' + d2(2000 / PI) + ' mm', lines: 3 }),
      B.prob({ q: 'A frame uses 4,800 mm of bar all the way around and is 1,500 mm long. Use ' + m('P = 2 × (l + w)') + ' to find the width.', canvas: SH('rectangle', { l: 1500, w: 900 }, { hide: ['w'], width: '1.7in' }), a: 'w = P ÷ 2 − l = ' + n(4800 / 2 - 1500) + ' mm', lines: 3 })
    ),
    B.grid2(
      B.prob({ q: 'The gusset has an area of 67,500 mm² and a height of 300 mm. Make b the subject of ' + m('A = b × h ÷ 2') + ' and find the base.', canvas: SH('right-triangle', { b: 450, h: 300 }, { hide: ['b'], angles: true, width: '1.9in' }), a: 'b = 2 × A ÷ h = ' + n(2 * 67500 / 300) + ' mm', lines: 3 }),
      '<div>' + B.prob({ q: 'Make ' + tC + ' the subject of ' + m(tF + ' = 1.8 × ' + tC + ' + 32') + '. Then change 450 °F to °C.', a: tC + ' = (' + tF + ' − 32) ÷ 1.8 = ' + d2((450 - 32) / 1.8) + ' °C', lines: 2 }) +
      B.prob({ q: 'An invoice uses ' + m('T = 60 + 85 × h') + ', with T in dollars and h in hours. The total is $527.50. How many hours were worked?', a: 'h = (T − 60) ÷ 85 = ' + n(R((527.5 - 60) / 85, 2)) + ' hours', lines: 2 }) + '</div>'
    ),
    B.check('0.72 ÷ 1.2 × 0.8 =', n(R(0.72 / 1.2 * 0.8, 2))),
    B.check('( 527.5 − 60 ) ÷ 85 =', n(R((527.5 - 60) / 85, 2)))
  ]);
};
