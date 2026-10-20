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
  const PL = require('../engine/plates.js');

  /* BCBC 2024 stair values, read from the code text of each Article. The build stops if the text does not hold them */
  const codeNum = (num, re) => {
    const mm = re.exec(PL.article(num).text.replace(/\s+/g, ' '));
    if (!mm) throw new Error('BCBC ' + num + ': value not found in the code text ' + re);
    return mm.slice(1).map(v => /^\d+$/.test(v) ? +v : v);
  };
  const [rPrivMax, rPrivMin] = codeNum('9.8.4.1', /Private \(1\) (\d+) (\d+)/);
  const [rPubMax, rPubMin] = codeNum('9.8.4.1', /Public \(2\) (\d+) (\d+)/);
  const [uPrivMax, uPrivMin] = codeNum('9.8.4.2', /Private \(1\) (\d+) (\d+)/);
  const [uPubMax, uPubMin] = codeNum('9.8.4.2', /Public \(2\) (No limit) (\d+)/);
  const [tolAdj] = codeNum('9.8.4.4', /a\) (\d+) mm between adjacent treads or landings/);
  const [tolAll] = codeNum('9.8.4.4', /b\) (\d+) mm between the tallest and shortest risers in a flight/);
  const [flightMax] = codeNum('9.8.3.3', /shall not exceed (\d+\.\d+) m/);
  const pg = num => PL.article(num).page;
  /* a plate figure kept whole on one page */
  const plate = (num, o) => {
    const c = o.crop, hIn = parseFloat(o.width) * c[3] / c[2];
    /* a set height, so the page layout knows the size of the cropped plate before it draws it */
    return '<div style="break-inside:avoid">' + G.pruneCrop(PL.figure(B, num, o), c).replace('class="bcbc-plate"', 'class="bcbc-plate" style="height:' + hIn.toFixed(2) + 'in"') + '</div>';
  };

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
      calc: { rows: [{ label: 'Area', seq: '1200 × 800 =', expect: n(1200 * 800) }, { label: 'Perimeter', seq: '2 × ( 1200 + 800 ) =', expect: '4,000' }], say: 'Key the brackets. Without them the calculator works 2 × 1,200 first and then adds 800.' },
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
    B.p('Electrical work uses formulas too. The two below link voltage, current, resistance and power. Substitute into them the same way: write the formula, put the numbers in place of the letters, then work it out.'),
    B.formula('Electrical formulas', [m('V = I × R'), m('P = V × I')], 'V voltage in volts (V), I current in amperes (A), R resistance in ohms (Ω), P power in watts (W). V = I × R is called Ohm\'s law. Section 8.9 works both formulas and turns them around.'),
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
      calc: { rows: [{ label: 'Diameter', seq: '1000 ÷ π =', expect: d2(cD) }, { label: 'Check with the rounded answer', seq: '318.31 × π =', expect: n(R(318.31 * PI, 2), 2) }] },
      answer: 'D = ' + d2(cD) + ' mm. The check gives ' + n(R(318.31 * PI, 2), 2) + ' mm to two decimal places, so the answer is right.'
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
    B.p('Ohm\'s law turns around the same way: ' + m('I = V ÷ R') + ' and ' + m('R = V ÷ I') + '. Section 8.9 has worked examples.'),

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
      fig: SH('right-triangle', { b: 400, h: 300 }, { hide: ['h'], allAngles: true, derived: 'show', width: '1.9in' }),
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
      calc: { rows: [{ label: 'Radius', seq: '50000 ÷ π = √x', expect: d2(rPlate) }, { label: 'Diameter', seq: '50000 ÷ π = √x × 2 =', expect: d2(2 * rPlate) }], say: 'The calculator keeps every digit of r, so the diameter comes from the unrounded r.' },
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

    B.section('From words to formulas and equations'),
    B.p('On the job, math usually arrives as words: "the offcut is 315 mm shorter than the bar", "the bill is a $75 call-out plus $95 an hour". To work with it, turn the words into symbols.',
      'An ' + B.term('expression', 'A group of numbers, letters and operation signs with no equals sign, such as x + 250 or 3 × l.') + ' is a group of numbers, letters and operation signs with no equals sign, such as ' + m('x + 250') + ' or ' + m('3 × l') + '. An ' + B.term('equation', 'A statement that two quantities are equal, written with an equals sign, such as x + 250 = 900.') + ' says that two quantities are equal, so it has an equals sign: ' + m('x + 250 = 900') + '. A formula is an equation that works as a rule for any values you put in.'),
    B.table(['Operation', 'Key words', 'Example', 'In symbols'], [
      ['+ add', 'plus, more than, longer than, added to, increased by, total, sum, altogether', '250 mm longer than the bar', m('b + 250')],
      ['− subtract', 'minus, less than, shorter than, take away, decreased by, difference, left over', '315 mm shorter than the bar', m('b − 315')],
      ['× multiply', 'times, product, double, twice, triple', 'twice the width', m('2 × w')],
      ['÷ divide', 'divided by, shared equally, cut into equal pieces, half, quarter', 'a bar cut into 4 equal pieces', m('b ÷ 4')],
      ['= equals', 'is, equals, gives, comes to, totals, makes', 'the total is 900 mm', m('… = 900')]
    ], { caption: 'Key words and the operations they usually mean. Read the whole sentence: a key word is a clue, not a rule.' }),
    B.watch('Less than turns the order around', '"75 less than x" is ' + m('x − 75') + ', not 75 − x. Start from the amount that something is taken from. In the same way, "315 mm shorter than the bar" is ' + m('b − 315') + '.'),
    B.p('To turn a story into an equation and solve it, work through these steps. Example 8.' + (B.ex + 1) + ' starts with the first part: writing expressions.'),
    B.how(['Read the story to the end. Find what you are asked for.', 'Choose a letter for the unknown and say what it stands for, with its unit.', 'Turn the key words into symbols and write the equation. The equals sign goes where the story says is, totals or comes to.', 'Solve with inverse operations, as in Sections 8.3 to 8.5.', 'Check the answer in the story, not only in the equation.', 'Write the answer as a sentence with its unit.']),
    EX({
      title: 'Writing expressions',
      q: 'Let L be the length of a bar in millimetres. Write an expression for each: (a) 150 mm longer than the bar, (b) the bar less a 3 mm saw cut, (c) twice the bar, (d) the bar cut into 5 equal pieces, (e) 4 bars and a 600 mm offcut.',
      steps: ['(a) "longer than" adds: ' + m('L + 150') + '.', '(b) "less" takes 3 away from the bar: ' + m('L − 3') + '.', '(c) "twice" multiplies by 2: ' + m('2 × L') + '.', '(d) "cut into equal pieces" divides: ' + m('L ÷ 5') + '.', '(e) 4 bars is ' + m('4 × L') + '. Then add the offcut: ' + m('4 × L + 600') + '.'],
      answer: m('L + 150') + ', ' + m('L − 3') + ', ' + m('2 × L') + ', ' + m('L ÷ 5') + ' and ' + m('4 × L + 600') + '.'
    }),
    EX({
      title: 'One-step equations from a story',
      q: '(a) A piece is cut from a 2,440 mm board. The piece left over measures 1,685 mm. Ignore the saw cut. How long is the piece that was cut off? (b) Four equal shelves use 3,360 mm of board. How long is each shelf?',
      steps: ['(a) Let x be the piece cut off, in mm. The two pieces make the board: ' + m('x + 1,685 = 2,440') + '. Subtract 1,685 from both sides: ' + m('x = 2,440 − 1,685 = ' + n(2440 - 1685)) + '. Check in the story: ' + n(2440 - 1685) + ' + 1,685 = 2,440 mm.', '(b) Let s be one shelf, in mm. Four shelves: ' + m('4 × s = 3,360') + '. Divide both sides by 4: ' + m('s = 3,360 ÷ 4 = ' + n(3360 / 4)) + '. Check: 4 × ' + n(3360 / 4) + ' = 3,360 mm.'],
      calc: { rows: [{ label: 'Piece cut off', seq: '2440 − 1685 =', expect: n(2440 - 1685) }, { label: 'One shelf', seq: '3360 ÷ 4 =', expect: n(3360 / 4) }] },
      answer: 'The piece cut off is ' + n(2440 - 1685) + ' mm. Each shelf is ' + n(3360 / 4) + ' mm.'
    }),
    EX({
      title: 'A two-step equation from a story',
      q: 'A fence has a 1,200 mm gate and n boards, each 140 mm wide, set edge to edge. The whole fence is 3,580 mm long. How many boards are there?',
      steps: ['Let n be the number of boards. The boards give 140 × n, and the gate adds 1,200: ' + m('140 × n + 1,200 = 3,580') + '.', 'Undo in reverse order. Undo the + 1,200 first: ' + m('140 × n = 3,580 − 1,200 = 2,380') + '.', 'Then undo the × 140: ' + m('n = 2,380 ÷ 140 = ' + n((3580 - 1200) / 140)) + '.', 'Check in the story: 140 × ' + n((3580 - 1200) / 140) + ' + 1,200 = ' + n(140 * 17) + ' + 1,200 = 3,580 mm.'],
      calc: { seq: '( 3580 − 1200 ) ÷ 140 =', expect: n((3580 - 1200) / 140), say: 'The brackets make the calculator subtract before it divides, the same order as the solution.' },
      answer: n((3580 - 1200) / 140) + ' boards.'
    }),
    B.check('140 × 17 + 1200 =', '3,580'),
    EX({
      title: 'A bill written as an equation',
      q: 'A mobile welder charges a $75 call-out fee plus $95 an hour. The bill comes to $502.50. How many hours did the job take?',
      steps: ['Let h be the hours. "$95 an hour" means $95 for each hour, so the hours cost 95 × h. Add the call-out fee: ' + m('75 + 95 × h = 502.50') + '.', 'Undo the + 75: ' + m('95 × h = 502.50 − 75 = 427.50') + '.', 'Undo the × 95: ' + m('h = 427.50 ÷ 95 = ' + n((502.5 - 75) / 95, 1)) + '.', 'Check: 75 + 95 × 4.5 = 75 + 427.50 = $502.50.'],
      calc: { seq: '( 502.5 − 75 ) ÷ 95 =', expect: n((502.5 - 75) / 95, 1) },
      answer: n((502.5 - 75) / 95, 1) + ' hours.'
    }),
    B.check('75 + 95 × 4.5 =', '502.5'),
    B.keyidea('Key idea', 'Name the unknown, turn the key words into symbols, and put the equals sign where the story says is or totals. Solve, then check the answer in the story.'),
    B.tryIt([
      { q: 'Write an expression for a length 75 mm shorter than a bar of length b.', a: 'b − 75' },
      { q: 'Write an expression for the cost of n bolts at $0.85 each plus $12 delivery.', a: '0.85 × n + 12' },
      { q: 'Write an expression for a 6,000 mm length cut into k equal pieces.', a: '6,000 ÷ k' },
      { q: 'A pipe run needs 2,750 mm of pipe. 1,980 mm is already in place. Write and solve an equation for the length still needed.', a: 'x + 1,980 = 2,750, so x = ' + n(2750 - 1980) + ' mm' },
      { q: 'Six equal studs use 14,640 mm of lumber. Ignore saw cuts. Write and solve an equation for the length of one stud.', a: '6 × s = 14,640, so s = ' + n(14640 / 6) + ' mm' },
      { q: 'Three times a length, plus 250 mm, is 1,600 mm. Find the length.', a: '3 × x + 250 = 1,600, so x = ' + n((1600 - 250) / 3) + ' mm' },
      { q: 'A plumber charges $90 to come out plus $110 an hour. The bill is $640. How many hours were worked?', a: '90 + 110 × h = 640, so h = ' + n((640 - 90) / 110) + ' hours' },
      { q: 'Half a bar, less a 3 mm saw cut, is 1,497 mm. How long is the bar?', a: 'L ÷ 2 − 3 = 1,497, so L = ' + n((1497 + 3) * 2) + ' mm' }
    ]),

    B.section('Electrical formulas'),
    B.p('Section 8.2 gave two electrical formulas: Ohm\'s law, ' + m('V = I × R') + ', and the power formula, ' + m('P = V × I') + '. Here they are used as math only: substitute, transpose and check, the same skills as the rest of this chapter.',
      'The formulas follow from how the units are defined. NIST (the US National Institute of Standards and Technology) gives 1 Ω = 1 V/A, one ohm is one volt per ampere, and 1 V = 1 W/A, one volt is one watt per ampere.'),
    EX({
      title: 'Ohm\'s law and power',
      q: 'A heating coil on a test bench has a resistance of 12 Ω and carries a current of 1.5 A. Use ' + m('V = I × R') + ' to find the voltage across it. Then use ' + m('P = V × I') + ' to find the power.',
      steps: [m('V = I × R = 1.5 × 12 = ' + n(1.5 * 12)) + ' V.', m('P = V × I = 18 × 1.5 = ' + n(18 * 1.5)) + ' W. Use the voltage you just found.'],
      calc: { rows: [{ label: 'Voltage', seq: '1.5 × 12 =', expect: n(1.5 * 12) }, { label: 'Power', seq: '18 × 1.5 =', expect: n(18 * 1.5) }] },
      answer: 'V = ' + n(1.5 * 12) + ' V and P = ' + n(18 * 1.5) + ' W.'
    }),
    EX({
      title: 'Ohm\'s law turned around',
      q: 'Make I the subject of ' + m('V = I × R') + ' and find the current when V = 24 V and R = 16 Ω. Then make I the subject of ' + m('P = V × I') + ' and find the current when P = 60 W and V = 12 V.',
      steps: ['In ' + m('V = I × R') + ', I has been multiplied by R. Divide both sides by R: ' + m('I = V ÷ R') + '.', m('I = 24 ÷ 16 = ' + n(24 / 16, 1)) + ' A.', 'In ' + m('P = V × I') + ', I has been multiplied by V. Divide both sides by V: ' + m('I = P ÷ V = 60 ÷ 12 = ' + n(60 / 12)) + ' A.'],
      calc: { rows: [{ label: 'I = V ÷ R', seq: '24 ÷ 16 =', expect: n(24 / 16, 1) }, { label: 'I = P ÷ V', seq: '60 ÷ 12 =', expect: n(60 / 12) }] },
      answer: 'I = ' + n(24 / 16, 1) + ' A, then I = ' + n(60 / 12) + ' A. Check: 1.5 × 16 = 24 and 12 × 5 = 60.'
    }),
    B.check('1.5 × 16 =', '24'),
    B.check('12 × 5 =', '60'),
    B.tryIt([
      { q: m('V = I × R') + ' with I = 0.5 A and R = 48 Ω. Find V.', a: n(0.5 * 48) + ' V' },
      { q: m('P = V × I') + ' with V = 24 V and I = 2.5 A. Find P.', a: n(24 * 2.5) + ' W' },
      { q: 'Make R the subject of ' + m('V = I × R') + '. Find R when V = 36 V and I = 3 A.', a: 'R = V ÷ I = ' + n(36 / 3) + ' Ω' },
      { q: 'Find I when V = 9 V and R = 4.5 Ω.', a: 'I = V ÷ R = ' + n(9 / 4.5) + ' A' },
      { q: 'Make V the subject of ' + m('P = V × I') + '. Find V when P = 90 W and I = 7.5 A.', a: 'V = P ÷ I = ' + n(90 / 7.5) + ' V' },
      { q: 'Putting V = I × R into P = V × I gives ' + m('P = I² × R') + '. Find P when I = 2 A and R = 6 Ω.', a: n(2 * 2 * 6) + ' W' }
    ]),

    B.section('Stair formulas and the BC Building Code'),
    B.p('A carpenter laying out a stair starts from one measurement, the total rise: the height from the finished floor at the bottom to the finished floor at the top. Each step up is a riser. The height of one step is the unit rise. The run of one step is the unit run, and the horizontal length of the whole flight is the total run.',
      'The BC Building Code (BCBC 2024) sets the limits. It says the rise is "measured as the vertical nosing-to-nosing distance" (Division B, Sentence 9.8.4.1.(1), page ' + pg('9.8.4.1') + '), and it defines run as "the horizontal distance between two adjacent tread nosings on a stair" (Division A, Sentence 1.4.1.2.(1), page 1-23). A flight is "a series of steps between landings" (Division A, page 1-18).'),
    B.figure(G.stairFig(14, { rise: 'total rise', run: 'total run', ur: 'unit rise', un: 'unit run', max: '4.6in' }), 'A straight flight of 14 risers from one floor to the next. The upper floor is the top step, so the flight has 13 treads. Chapter 12 finds the length of the stringer from the total rise and the total run with the Pythagorean theorem.'),
    B.formula('Stair formulas', [m('number of risers = total rise ÷ maximum rise') + ', rounded up to a whole number', m('unit rise = total rise ÷ number of risers'), m('number of treads = number of risers − 1'), m('total run = number of treads × unit run')], 'Work in millimetres. Round the number of risers up, never down: rounding down makes each riser taller than the maximum.'),
    B.table(['Stair type', 'Rise, max.', 'Rise, min.', 'Run, max.', 'Run, min.'], [
      ['Private', rPrivMax + ' mm', rPrivMin + ' mm', uPrivMax + ' mm', uPrivMin + ' mm'],
      ['Public', rPubMax + ' mm', rPubMin + ' mm', uPubMax, uPubMin + ' mm']
    ], { caption: 'Rise and run for rectangular treads. BCBC 2024, Division B, Table 9.8.4.1 (Sentence 9.8.4.1.(1), page ' + pg('9.8.4.1') + ') and Table 9.8.4.2 (Sentence 9.8.4.2.(1), page ' + pg('9.8.4.2') + ').', align: ['', 'r', 'r', 'r', 'r'] }),
    B.p('The notes to both tables say that private stairs "are exterior and interior stairs that serve" single dwelling units, houses with a secondary suite including their common spaces, and garages that serve those houses. Public stairs "are all stairs not described as service stairs or private stairs." Article 9.8.3.3 adds that "the vertical height of any flight of stairs shall not exceed ' + flightMax + ' m" (page ' + pg('9.8.3.3') + ').'),
    plate('9.8.4.1', { crop: [100, 450, 450, 445], width: '3.4in', caption: 'Part of plate 9.8.4.1. The rise of each step is measured vertically from one nosing to the next. The limits are in Table ' + B.ch + '.' + B.tab + '.' }),
    EX({
      title: 'Risers for a house stair',
      q: 'A private stair in a house has a total rise of 2,690 mm. Find the number of risers and the unit rise, to two decimal places. Check the unit rise against Table 9.8.4.1.',
      steps: ['Number of risers: ' + m('2,690 ÷ ' + rPrivMax + ' = ' + n(2690 / rPrivMax, 2)) + '. Round up to 14.', 'Unit rise: ' + m('2,690 ÷ 14 = ' + d2(2690 / 14)) + ' mm.', 'Check: ' + d2(2690 / 14) + ' mm is not more than ' + rPrivMax + ' mm and not less than ' + rPrivMin + ' mm, so it meets the table.', 'Why not 13 risers? ' + m('2,690 ÷ 13 = ' + d2(2690 / 13)) + ' mm, taller than the ' + rPrivMax + ' mm maximum.'],
      calc: { rows: [{ label: 'Risers', seq: '2690 ÷ ' + rPrivMax + ' =', expect: n(2690 / rPrivMax, 2) }, { label: 'Unit rise', seq: '2690 ÷ 14 =', expect: d2(2690 / 14) }, { label: 'With 13 risers', seq: '2690 ÷ 13 =', expect: d2(2690 / 13) }] },
      answer: '14 risers of ' + d2(2690 / 14) + ' mm.'
    }),
    plate('9.8.4.2', { crop: [580, 395, 330, 165], width: '2.8in', caption: 'Part of plate 9.8.4.2. The run is measured horizontally from nosing to nosing. Sentence 9.8.4.2.(2) says the depth of a rectangular tread "shall be not less than its run and not more than its run plus 25 mm."' }),
    EX({
      title: 'Total run',
      q: 'The stair in Example ' + B.ch + '.' + B.ex + ' has 14 risers. The drawing gives a unit run of 260 mm. Check the unit run against Table 9.8.4.2, then find the total run.',
      steps: ['260 mm is not less than ' + uPrivMin + ' mm and not more than ' + uPrivMax + ' mm, so it meets the table for a private stair.', 'Number of treads: 14 − 1 = 13.', 'Total run: ' + m('13 × 260 = ' + n(13 * 260)) + ' mm.'],
      calc: { seq: '13 × 260 =', expect: n(13 * 260) },
      answer: 'The total run is ' + n(13 * 260) + ' mm.'
    }),
    EX({
      title: 'A public stair',
      q: 'A public stair has a total rise of 3,150 mm. Check the height of the flight against Article 9.8.3.3. Find the number of risers and the unit rise. The drawing gives a unit run of 300 mm. Find the total run.',
      steps: ['3,150 mm is less than ' + flightMax + ' m = ' + n(parseFloat(flightMax) * 1000) + ' mm, so one flight is allowed.', 'Risers: ' + m('3,150 ÷ ' + rPubMax + ' = ' + n(3150 / rPubMax, 1)) + '. Round up to 18.', 'Unit rise: ' + m('3,150 ÷ 18 = ' + n(3150 / 18)) + ' mm, between ' + rPubMin + ' mm and ' + rPubMax + ' mm.', 'The run of 300 mm is not less than ' + uPubMin + ' mm. Treads: 18 − 1 = 17. Total run: ' + m('17 × 300 = ' + n(17 * 300)) + ' mm.'],
      calc: { rows: [{ label: 'Risers', seq: '3150 ÷ ' + rPubMax + ' =', expect: n(3150 / rPubMax, 1) }, { label: 'Unit rise', seq: '3150 ÷ 18 =', expect: n(3150 / 18) }, { label: 'Total run', seq: '17 × 300 =', expect: n(17 * 300) }] },
      answer: '18 risers of ' + n(3150 / 18) + ' mm and a total run of ' + n(17 * 300) + ' mm.'
    }),
    B.p('Every riser in a flight must be the same height, within a small tolerance. Sentence 9.8.4.4.(1) allows a maximum tolerance of "' + tolAdj + ' mm between adjacent treads or landings" and "' + tolAll + ' mm between the tallest and shortest risers in a flight". Sentence 9.8.4.4.(3) sets the same ' + tolAdj + ' mm and ' + tolAll + ' mm for the run of rectangular treads (page ' + pg('9.8.4.4') + ').'),
    EX({
      title: 'Checking a built flight',
      q: 'The risers of a built flight measure, from the bottom: 188, 191, 190, 196, 189 and 191 mm. Do they meet Sentence 9.8.4.4.(1)?',
      steps: ['Adjacent risers: 191 − 188 = 3, 191 − 190 = 1, 196 − 190 = 6, 196 − 189 = 7, 191 − 189 = 2.', 'Two differences, 6 mm and 7 mm, are more than ' + tolAdj + ' mm.', 'Tallest and shortest: 196 − 188 = ' + (196 - 188) + ' mm, which is within ' + tolAll + ' mm.'],
      answer: 'No. The flight meets the ' + tolAll + ' mm rule but fails the ' + tolAdj + ' mm rule between adjacent risers, at the fourth riser.'
    }),
    B.p('The stair formulas transpose like any other formula. From ' + m('unit rise = total rise ÷ number of risers') + ' you get ' + m('total rise = number of risers × unit rise') + ', and from ' + m('total run = number of treads × unit run') + ' you get ' + m('unit run = total run ÷ number of treads') + '.'),
    B.tryIt([
      { q: 'A private stair has a total rise of 2,450 mm. Find the number of risers and the unit rise to two decimal places.', a: Math.ceil(2450 / rPrivMax) + ' risers of ' + d2(2450 / Math.ceil(2450 / rPrivMax)) + ' mm' },
      { q: 'The stair in question 1 has a unit run of 280 mm. Find the total run.', a: n((Math.ceil(2450 / rPrivMax) - 1) * 280) + ' mm' },
      { q: 'A public stair has a total rise of 2,880 mm. Find the number of risers and the unit rise.', a: Math.ceil(2880 / rPubMax) + ' risers of ' + n(2880 / Math.ceil(2880 / rPubMax)) + ' mm (2,880 ÷ ' + rPubMax + ' is exactly 16)' },
      { q: 'A stair has 15 risers of 186 mm. Find the total rise.', a: n(15 * 186) + ' mm' },
      { q: 'A private stair has 12 treads and a total run of 3,060 mm. Find the unit run. Does it meet Table 9.8.4.2?', a: n(3060 / 12) + ' mm. Yes, it is exactly the ' + uPrivMin + ' mm minimum.' },
      { q: 'Two adjacent risers measure 184 mm and 191 mm. Do they meet Sentence 9.8.4.4.(1)?', a: 'No. They differ by 7 mm, more than ' + tolAdj + ' mm.' }
    ]),
    B.check('2450 ÷ 13 =', d2(2450 / 13)),
    B.check('12 × 280 =', n(12 * 280)),
    B.check('3060 ÷ 12 =', n(3060 / 12)),
    B.check('15 × 186 =', n(15 * 186)),

    B.worksheet({ title: 'Given the area, find the side', sub: 'Use the value you know to find the ?', intro: 'Transpose the formula first, then substitute. Check each answer by putting it back into the formula you started with. Round to two decimal places where the answer does not come out exactly.' }),
    B.grid2(
      B.prob({ q: 'The rectangle has an area of 7,200 cm² and a length of 120 cm. Use ' + m('A = l × w') + ' to find the width.', canvas: SH('rectangle', { l: 120, w: 60 }, { units: 'cm', hide: ['w'], width: '2in' }), a: n(7200 / 120) + ' cm', work: 'w = A ÷ l = 7,200 ÷ 120', lines: 3 }),
      B.prob({ q: 'The square has an area of 2,025 cm². Use ' + m('A = s²') + ' to find the side.', canvas: SH('square', { s: 45 }, { units: 'cm', hide: ['s'], width: '1.45in' }), a: n(Math.sqrt(2025)) + ' cm', work: 's = √A = √2,025', lines: 3 })
    ),
    B.grid2(
      B.prob({ q: 'The circle has an area of 5,000 mm². Find the radius and the diameter.', canvas: SH('circle', { r: 40 }, { hide: ['r', 'D'], derived: 'show', width: '1.55in' }), a: 'r = ' + d2(Math.sqrt(5000 / PI)) + ' mm, D = ' + d2(2 * Math.sqrt(5000 / PI)) + ' mm', work: 'r = √(5,000 ÷ π), D = 2 × r', lines: 3 }),
      B.prob({ q: 'The gusset has an area of 43,200 mm² and a base of 360 mm. Use ' + m('A = b × h ÷ 2') + ' to find the height.', canvas: SH('right-triangle', { b: 360, h: 240 }, { hide: ['h'], allAngles: true, derived: 'show', width: '1.9in' }), a: n(2 * 43200 / 360) + ' mm', work: 'h = 2 × A ÷ b = 2 × 43,200 ÷ 360', lines: 3 })
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
      B.prob({ q: 'The gusset has an area of 67,500 mm² and a height of 300 mm. Make b the subject of ' + m('A = b × h ÷ 2') + ' and find the base.', canvas: SH('right-triangle', { b: 450, h: 300 }, { hide: ['b'], angles: true, allAngles: true, derived: 'show', width: '1.9in' }), a: 'b = 2 × A ÷ h = ' + n(2 * 67500 / 300) + ' mm', lines: 3 }),
      '<div>' + B.prob({ q: 'Make ' + tC + ' the subject of ' + m(tF + ' = 1.8 × ' + tC + ' + 32') + '. Then change 450 °F to °C.', a: tC + ' = (' + tF + ' − 32) ÷ 1.8 = ' + d2((450 - 32) / 1.8) + ' °C', lines: 2 }) +
      B.prob({ q: 'An invoice uses ' + m('T = 60 + 85 × h') + ', with T in dollars and h in hours. The total is $527.50. How many hours were worked?', a: 'h = (T − 60) ÷ 85 = ' + n(R((527.5 - 60) / 85, 2)) + ' hours', lines: 2 }) + '</div>'
    ),
    B.check('0.72 ÷ 1.2 × 0.8 =', n(R(0.72 / 1.2 * 0.8, 2))),
    B.check('( 527.5 − 60 ) ÷ 85 =', n(R((527.5 - 60) / 85, 2)))
  ]);
};
