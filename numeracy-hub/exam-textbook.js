/* The textbook chapter bank. Append-only registry entry: existing exam codes keep their topic indices.
   Questions are generated from numeric inputs, with the worked answer built from the same inputs.
   Coverage follows source/book/chapters/ch01…ch13 and Appendix A. No network or saved question data. */
(function (G, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else G.TextbookExam = factory(G.ExamCore, G.Shapes, G.TextbookGeometry);
})(typeof window !== 'undefined' ? window : globalThis, function (C, Shapes, geometry) {
  'use strict';
  var chapters = [
    ['1', 'Whole Numbers'], ['2', 'Your Calculator'], ['3', 'Order of Operations'],
    ['4', 'Fractions'], ['5', 'Decimals'], ['6', 'Percent, Ratio and Proportion'],
    ['7', 'Measurement and Unit Conversion'], ['8', 'Formulas and Transposing'],
    ['9', 'Perimeter and Circumference'], ['10', 'Area'], ['11', 'Volume and Capacity'],
    ['12', 'Angles and Right Triangles'], ['13', 'Trigonometry'], ['A', 'Kitchen Math']
  ].map(function (c) { return { id: c[0], title: c[1], label: (c[0] === 'A' ? 'Appendix A' : 'Chapter ' + c[0]) + ' · ' + c[1] }; });
  var tasks = [];
  function ri(r, lo, hi) { return lo + Math.floor(r() * (hi - lo + 1)); }
  function pick(r, a) { return a[Math.floor(r() * a.length)]; }
  function stable(v) { return Number(v.toPrecision(14)); }
  function n(v, dp) { return dp == null ? String(Number(v.toFixed(8))) : C.fmt(stable(v), dp); }
  function gcd(a, b) { while (b) { var t = a % b; a = b; b = t; } return Math.abs(a) || 1; }
  function frac(num, den) { var d = gcd(num, den); num /= d; den /= d; var w = Math.floor(num / den), rem = num % den; return !rem ? String(w) : (w ? w + ' ' : '') + rem + '/' + den; }
  function shape(id, p, units) { try { return Shapes ? Shapes.render(id, p, { units: units, labels: 'values', derived: 'hide' }) : ''; } catch (e) { return ''; } }
  function q(prompt, value, unit, dp, steps, o) {
    o = o || {};
    if (!isFinite(value)) throw new Error('Nonfinite textbook answer');
    // Keep fourteen significant digits (well beyond displayed precision), removing binary
    // tails such as 25.624999999999996 that would turn an exact half-up tie downward.
    value = stable(value);
    var a = { label: o.label || 'Answer', unit: unit || '', value: value, dp: dp, kind: o.fraction ? 'frac' : dp === 0 ? 'int' : 'num',
      tol: o.fraction ? 1e-8 : dp === 0 ? 1e-8 : 0.51 * Math.pow(10, -dp), rel: 0, alts: [], display: o.display || n(value, dp), raw: { value: value, unit: unit || '' } };
    a.check = C.numCheck(a);
    var keys = o.seq ? [{ label: o.label || 'Answer', seq: o.seq, expect: value }] : C.keysFromSteps ? C.keysFromSteps(o.expr ? [o.expr + ' = ' + n(value, 8)] : steps) : [];
    return { qHtml: C.esc(prompt), answers: [a], steps: steps.slice(), keys: keys, key: null, figSvg: o.fig || '', figType: 'textbook', meta: o.meta || {} };
  }
  function add(ch, id, title, level, make) {
    var chapter = chapters.find(function (c) { return c.id === String(ch); });
    if (!chapter) throw new Error('Unknown textbook chapter ' + ch);
    tasks.push({ uid: 'textbook:' + ch + ':' + id, hub: 'textbook', hubTitle: 'The textbook', module: 'textbook:' + ch,
      moduleTitle: chapter.label, id: ch + ':' + id, title: title, level: level,
      make: function (seed, lv) {
        var inst = make(C.makeRng(seed), lv || C.LEVELS[1]);
        inst.meta.chapter = chapter.id; inst.meta.source = 'The textbook, ' + chapter.label.replace(' · ', ': ');
        inst.steps.push('Textbook reference: ' + chapter.label.replace(' · ', ': ') + '.');
        return inst;
      }
    });
  }
  function rounded(prompt, value, unit, dp, steps, o) {
    value = stable(value);
    return q(prompt + ' Round to ' + dp + ' decimal places.', value, unit, dp,
      steps.concat(['Round only the final answer: ' + n(value, dp) + (unit ? ' ' + unit : '') + '.']), o);
  }

  // 1: place value, rounding, arithmetic, discrete stock quantities, averages and time.
  add(1, 'round', 'Round a whole-number measurement', 1, function (r) {
    var x = ri(r, 1211, 9879), base = pick(r, [10, 100]);
    return q('Round the measured length ' + x + ' mm to the nearest ' + base + ' mm.', Math.round(x / base) * base, 'mm', 0,
      ['Divide by the rounding unit: ' + x + ' ÷ ' + base + ' = ' + n(x / base) + '.', 'Round to the nearest whole unit, then multiply by ' + base + ': ' + Math.round(x / base) * base + ' mm.']);
  });
  add(1, 'cut-list', 'Add a cut list and find the remainder', 2, function (r) {
    var a = ri(r, 400, 1100), b = ri(r, 400, 1100), c = ri(r, 400, 1100), stock = 3600;
    return q('A ' + stock + ' mm board supplies cuts of ' + a + ', ' + b + ' and ' + c + ' mm. Ignore saw kerf. How much remains?', stock - a - b - c, 'mm', 0,
      ['Total cuts: ' + a + ' + ' + b + ' + ' + c + ' = ' + (a + b + c) + ' mm.', 'Remainder: ' + stock + ' − ' + (a + b + c) + ' = ' + (stock - a - b - c) + ' mm.']);
  });
  add(1, 'stock', 'Whole pieces from stock with kerf', 3, function (r) {
    var len = ri(r, 35, 90) * 10, stock = pick(r, [2440, 3600, 4880]), kerf = ri(r, 2, 4), count = Math.floor(stock / (len + kerf));
    return q('Cut ' + len + ' mm blocks from a ' + stock + ' mm board. Allow ' + kerf + ' mm kerf for every block cut off. What is the greatest number of full blocks?', count, 'blocks', 0,
      ['Stock used per block: ' + len + ' + ' + kerf + ' = ' + (len + kerf) + ' mm.', stock + ' ÷ ' + (len + kerf) + ' = ' + n(stock / (len + kerf), 3) + '.', 'Round down to ' + count + ' complete blocks; a partial block cannot be used.']);
  });
  add(1, 'mean', 'Average measured lengths', 2, function (r) {
    var x = ri(r, 250, 950), a = [x - 6, x + 2, x + 8, x - 4];
    return q('Four trial pieces measure ' + a.join(', ') + ' mm. Find their mean length.', x, 'mm', 0,
      ['Add the four lengths: ' + a.join(' + ') + ' = ' + 4 * x + ' mm.', 'Mean = total ÷ count = ' + 4 * x + ' ÷ 4 = ' + x + ' mm.']);
  });
  add(1, 'time', 'Working time after a break', 2, function (r) {
    var hours = ri(r, 4, 9), minutes = pick(r, [15, 30, 45]), pause = pick(r, [15, 30]);
    return q('A shift lasts ' + hours + ' hours ' + minutes + ' minutes, including an unpaid ' + pause + '-minute break. How many minutes are worked?', hours * 60 + minutes - pause, 'min', 0,
      ['Convert hours: ' + hours + ' × 60 = ' + hours * 60 + ' min.', 'Worked time = ' + hours * 60 + ' + ' + minutes + ' − ' + pause + ' = ' + (hours * 60 + minutes - pause) + ' min.']);
  });
  add(1, 'spacing', 'Posts and equal spaces', 3, function (r) {
    var spaces = ri(r, 4, 12), gap = ri(r, 3, 7) * 100, length = spaces * gap;
    return q('A straight line of ' + (spaces + 1) + ' post centres spans ' + length + ' mm from the first to the last. Find the equal centre-to-centre spacing.', gap, 'mm', 0,
      ['The number of spaces is one less than the number of posts: ' + (spaces + 1) + ' − 1 = ' + spaces + '.', 'Spacing = ' + length + ' ÷ ' + spaces + ' = ' + gap + ' mm.']);
  });

  // 2: calculator operations, powers, roots, brackets and full precision.
  add(2, 'square', 'Use the square key', 1, function (r) {
    var x = ri(r, 12, 99) / 10;
    return rounded('Use the square key to calculate ' + n(x) + '².', x * x, '', 2, [n(x) + '² means ' + n(x) + ' × ' + n(x) + ' = ' + n(x * x) + '.']);
  });
  add(2, 'root', 'Use the square-root key', 1, function (r) {
    var x = ri(r, 50, 950);
    return rounded('Use your calculator to find √' + x + '.', Math.sqrt(x), '', 2, ['Enter ' + x + ' and use the square-root function.', 'A square root multiplied by itself gives ' + x + '.']);
  });
  add(2, 'brackets', 'Group the numerator on the calculator', 2, function (r) {
    var a = ri(r, 150, 900), b = ri(r, 20, 120), c = ri(r, 3, 9);
    return rounded('Calculate (' + a + ' + ' + b + ') ÷ ' + c + '. Enter the brackets as shown.', (a + b) / c, '', 2,
      ['The brackets group the whole numerator: ' + a + ' + ' + b + ' = ' + (a + b) + '.', 'Divide the sum, not only the last term: ' + (a + b) + ' ÷ ' + c + ' = ' + n((a + b) / c, 6) + '.']);
  });
  add(2, 'precision', 'Carry full calculator precision', 3, function (r) {
    var a = ri(r, 20, 90), b = pick(r, [3, 7, 9]), c = ri(r, 11, 25);
    return rounded('Calculate (' + a + ' ÷ ' + b + ') × ' + c + '. Keep the first result on the calculator without rounding.', a / b * c, '', 2,
      ['First divide: ' + a + ' ÷ ' + b + ' = ' + n(a / b, 6) + '…', 'Continue with the stored result × ' + c + ', rather than re-entering a rounded display.']);
  });
  add(2, 'pi', 'Use the pi key', 2, function (r) {
    var d = ri(r, 8, 45) * 10;
    return rounded('Use the π key to calculate π × ' + d + '. Do not replace π with 3.14.', Math.PI * d, '', 2, ['π × ' + d + ' = ' + n(Math.PI * d, 6) + '…']);
  });

  // 3: all BEDMAS ranks plus signed arithmetic in practical formulas.
  add(3, 'multiply-first', 'Multiply before adding', 1, function (r) {
    var a = ri(r, 10, 90), b = ri(r, 3, 15), c = ri(r, 2, 12);
    return q('Evaluate ' + a + ' + ' + b + ' × ' + c + '.', a + b * c, '', 0, ['Multiply first: ' + b + ' × ' + c + ' = ' + b * c + '.', 'Then add: ' + a + ' + ' + b * c + ' = ' + (a + b * c) + '.']);
  });
  add(3, 'brackets-square', 'Brackets, exponents and multiplication', 2, function (r) {
    var a = ri(r, 4, 12), b = ri(r, 2, 8), k = ri(r, 2, 5);
    return q('Evaluate ' + k + ' × (' + a + ' + ' + b + ')².', k * (a + b) ** 2, '', 0, ['Brackets: ' + a + ' + ' + b + ' = ' + (a + b) + '.', 'Square: ' + (a + b) + '² = ' + (a + b) ** 2 + '.', 'Multiply by ' + k + ': ' + k * (a + b) ** 2 + '.']);
  });
  add(3, 'left-right', 'Multiplication and division from left to right', 2, function (r) {
    var a = ri(r, 10, 40), b = ri(r, 2, 8), c = ri(r, 2, 9);
    return q('Evaluate ' + a * b + ' ÷ ' + b + ' × ' + c + '.', a * c, '', 0, ['Division and multiplication share one rank; work left to right.', a * b + ' ÷ ' + b + ' = ' + a + '.', a + ' × ' + c + ' = ' + a * c + '.']);
  });
  add(3, 'signed', 'Signed elevations', 2, function (r) {
    var start = ri(r, -8, -1), rise = ri(r, 2, 9), fall = ri(r, 2, 8);
    return q('A reference point is at elevation ' + start + ' m. Move up ' + rise + ' m, then down ' + fall + ' m. What is the final signed elevation?', start + rise - fall, 'm', 0,
      ['Up adds and down subtracts.', start + ' + ' + rise + ' − ' + fall + ' = ' + (start + rise - fall) + ' m.']);
  });
  add(3, 'stair', 'A grouped stair calculation', 3, function (r) {
    var risers = ri(r, 10, 18), going = ri(r, 240, 290);
    return q('A straight stair flight has ' + risers + ' risers and one fewer tread than risers. Each tread has a ' + going + ' mm going. Evaluate (' + risers + ' − 1) × ' + going + ' for the total horizontal run. This is a geometry exercise.', (risers - 1) * going, 'mm', 0,
      ['Count treads in brackets: ' + risers + ' − 1 = ' + (risers - 1) + '.', 'Run = tread count × going = ' + (risers - 1) + ' × ' + going + ' = ' + (risers - 1) * going + ' mm.']);
  });

  // 4: exact fractions; checks accept an equivalent fraction, mixed number or exact decimal.
  add(4, 'sum', 'Add fractional cut lengths', 1, function (r) {
    var a = ri(r, 9, 55), b = ri(r, 3, 31), den = 8;
    return q('Add ' + frac(a, den) + ' in and ' + frac(b, den) + ' in. Give an exact fraction, mixed number or decimal.', (a + b) / den, 'in', 3,
      ['Use eighths: ' + a + '/8 + ' + b + '/8 = ' + (a + b) + '/8.', 'Reduce and convert to a mixed number: ' + frac(a + b, den) + ' in.'], { fraction: true, display: frac(a + b, den) });
  });
  add(4, 'subtract', 'Subtract fractions with borrowing', 2, function (r) {
    var a = ri(r, 6, 15) * 16 + 3, b = ri(r, 2, 5) * 16 + 13;
    return q('Find ' + frac(a, 16) + ' in − ' + frac(b, 16) + ' in. Give the exact result.', (a - b) / 16, 'in', 4,
      ['Convert to sixteenths: ' + a + '/16 − ' + b + '/16.', 'Subtract numerators: ' + (a - b) + '/16 = ' + frac(a - b, 16) + ' in.'], { fraction: true, display: frac(a - b, 16) });
  });
  add(4, 'multiply', 'Multiply a fractional length', 2, function (r) {
    var a = ri(r, 9, 63), count = ri(r, 3, 8);
    return q('A cut list needs ' + count + ' pieces, each ' + frac(a, 8) + ' in long. Ignore kerf. Find the total exact length.', count * a / 8, 'in', 3,
      ['Total = number of pieces × length.', count + ' × ' + a + '/8 = ' + count * a + '/8 = ' + frac(count * a, 8) + ' in.'], { fraction: true, display: frac(count * a, 8) });
  });
  add(4, 'divide', 'Divide a fractional length equally', 2, function (r) {
    var a = ri(r, 25, 85), count = pick(r, [2, 4]);
    return q('Divide a ' + frac(a, 4) + ' in length into ' + count + ' equal parts. Ignore kerf. What is the exact length of one part?', a / (4 * count), 'in', 4,
      ['Dividing by ' + count + ' means multiplying by 1/' + count + '.', a + '/4 × 1/' + count + ' = ' + a + '/' + 4 * count + ' = ' + frac(a, 4 * count) + ' in.'], { fraction: true, display: frac(a, 4 * count) });
  });
  add(4, 'kerf', 'Fractions and repeated kerf', 3, function (r) {
    var length = ri(r, 10, 20) * 8 + ri(r, 1, 7), count = ri(r, 3, 5), stock = 120 * 8, used = count * length + count;
    return q('From a 120 in board, cut off ' + count + ' pieces of ' + frac(length, 8) + ' in. Each cut consumes 1/8 in kerf; there are ' + count + ' cuts. Find the exact leftover length.', (stock - used) / 8, 'in', 3,
      ['Pieces use ' + count + ' × ' + frac(length, 8) + ' = ' + frac(count * length, 8) + ' in.', 'Kerfs use ' + count + ' × 1/8 = ' + frac(count, 8) + ' in.', 'Left over = 120 − ' + frac(used, 8) + ' = ' + frac(stock - used, 8) + ' in.'], { fraction: true, display: frac(stock - used, 8) });
  });

  // 5: decimal arithmetic, feet, money and rounding without intermediate loss.
  add(5, 'round', 'Round a decimal measurement', 1, function (r) {
    var thousandths = ri(r, 10001, 99999), x = thousandths / 1000;
    return rounded('Round the measurement ' + n(x, 3) + ' mm.', x, 'mm', 2, ['The third decimal digit decides whether the hundredths digit increases.']);
  });
  add(5, 'length', 'Add decimal lengths', 1, function (r) {
    var a = ri(r, 120, 480) / 100, b = ri(r, 50, 300) / 100, c = ri(r, 25, 150) / 100;
    return rounded('A trim list has lengths ' + n(a, 2) + ', ' + n(b, 2) + ' and ' + n(c, 2) + ' m. Find their total.', a + b + c, 'm', 2, ['Align decimal places, then add: ' + n(a, 2) + ' + ' + n(b, 2) + ' + ' + n(c, 2) + ' = ' + n(a + b + c, 2) + ' m.']);
  });
  add(5, 'price', 'Calculate a material price', 2, function (r) {
    var len = ri(r, 25, 185) / 10, cost = ri(r, 250, 850) / 100;
    return rounded('Trim costs $' + n(cost, 2) + ' per metre. What is the price for ' + n(len, 1) + ' m before tax?', len * cost, '$', 2, ['Price = length × rate = ' + n(len) + ' × ' + n(cost, 2) + ' = ' + n(len * cost, 4) + ' dollars.']);
  });
  add(5, 'decimal-feet', 'Feet and inches to decimal feet', 2, function (r) {
    var ft = ri(r, 3, 18), inch = ri(r, 1, 11);
    return rounded('Write ' + ft + ' ft ' + inch + ' in as decimal feet.', ft + inch / 12, 'ft', 3, ['Convert inches to a fraction of a foot: ' + inch + ' ÷ 12 = ' + n(inch / 12, 6) + '… ft.', 'Add the whole feet: ' + ft + ' + ' + inch + '/12.']);
  });
  add(5, 'division', 'Divide to thousandths', 3, function (r) {
    var len = ri(r, 75, 235) / 10, spaces = pick(r, [3, 7, 9]);
    return rounded('Divide a ' + n(len, 1) + ' m layout line into ' + spaces + ' equal spaces. Find the length of one space.', len / spaces, 'm', 3, ['Space = total length ÷ number of spaces = ' + n(len) + ' ÷ ' + spaces + '.', 'Keep the full quotient until rounding.']);
  });

  // 6: percent, waste, proportion, scale and inverse proportion.
  add(6, 'waste', 'Add a stated waste allowance', 2, function (r) {
    var area = ri(r, 30, 180), pct = pick(r, [5, 8, 10, 12, 15]);
    return rounded('The net sheathing area is ' + area + ' m². Add a specified ' + pct + '% waste allowance. What area should be allowed before rounding to whole sheets?', area * (1 + pct / 100), 'm²', 2, ['Allowance = ' + area + ' × ' + pct + '/100 = ' + n(area * pct / 100) + ' m².', 'Total = ' + area + ' + ' + n(area * pct / 100) + ' = ' + n(area * (1 + pct / 100)) + ' m².']);
  });
  add(6, 'percent', 'Find a percentage', 1, function (r) {
    var total = ri(r, 4, 20) * 10, done = ri(r, 1, total - 1);
    return rounded('A crew has installed ' + done + ' of ' + total + ' required panels. What percentage is installed?', done / total * 100, '%', 2, ['Percent = part ÷ whole × 100 = ' + done + ' ÷ ' + total + ' × 100.']);
  });
  add(6, 'ratio', 'Scale a two-part ratio', 2, function (r) {
    var a = ri(r, 1, 4), b = ri(r, 5, 9), mul = ri(r, 3, 12);
    return q('A sample mixture uses component A to B in a ' + a + ':' + b + ' ratio by volume. If A is ' + a * mul + ' L, how much B is needed?', b * mul, 'L', 0, ['Scale factor = ' + a * mul + ' ÷ ' + a + ' = ' + mul + '.', 'B = ' + b + ' × ' + mul + ' = ' + b * mul + ' L.']);
  });
  add(6, 'scale', 'Read a scale drawing', 2, function (r) {
    var mm = ri(r, 20, 160), scale = pick(r, [20, 25, 50, 100]);
    return rounded('On a 1:' + scale + ' drawing a wall measures ' + mm + ' mm. Find the actual length in metres.', mm * scale / 1000, 'm', 2, ['Actual millimetres = ' + mm + ' × ' + scale + ' = ' + mm * scale + ' mm.', 'Convert to metres: ' + mm * scale + ' ÷ 1000.']);
  });
  add(6, 'discount', 'Apply a price reduction', 2, function (r) {
    var price = ri(r, 15, 90) * 10, pct = pick(r, [5, 10, 15, 20]);
    return rounded('A tool has a listed price of $' + price + ' and a ' + pct + '% discount. Find its sale price before tax.', price * (1 - pct / 100), '$', 2, ['Discount = ' + price + ' × ' + pct + '/100 = ' + n(price * pct / 100, 2) + ' dollars.', 'Sale price = ' + price + ' − ' + n(price * pct / 100, 2) + '.']);
  });
  add(6, 'inverse', 'Inverse proportion in crew planning', 3, function (r) {
    var crew = ri(r, 2, 5), hours = ri(r, 4, 12), newCrew = crew + ri(r, 1, 4);
    return rounded('A task takes ' + crew + ' workers ' + hours + ' hours. Assume equal productivity and fixed total work. How many hours would ' + newCrew + ' workers take?', crew * hours / newCrew, 'h', 2, ['Total work = ' + crew + ' × ' + hours + ' = ' + crew * hours + ' worker-hours.', 'Time = total worker-hours ÷ new crew = ' + crew * hours + ' ÷ ' + newCrew + '.']);
  });

  // 7: dimensions, powers of unit factors, capacity, temperature and board feet.
  add(7, 'inch-mm', 'Inches to millimetres', 1, function (r) {
    var inches = ri(r, 9, 191) / 8;
    return rounded('Convert ' + n(inches) + ' in to millimetres. Use 1 in = 25.4 mm exactly.', inches * 25.4, 'mm', 2, [n(inches) + ' × 25.4 = ' + n(inches * 25.4, 5) + ' mm.']);
  });
  add(7, 'feet-metres', 'Feet to metres', 1, function (r) {
    var ft = ri(r, 4, 80);
    return rounded('Convert ' + ft + ' ft to metres. Use 1 ft = 0.3048 m exactly.', ft * 0.3048, 'm', 3, [ft + ' × 0.3048 = ' + n(ft * 0.3048, 4) + ' m.']);
  });
  add(7, 'area', 'Square a length conversion factor', 2, function (r) {
    var area = ri(r, 15, 120);
    return q('Convert ' + area + ' m² to cm². Use 1 m = 100 cm.', area * 10000, 'cm²', 0, ['Area needs the factor twice: 1 m² = 100 × 100 = 10,000 cm².', area + ' × 10,000 = ' + area * 10000 + ' cm².']);
  });
  add(7, 'capacity', 'Cubic metres to litres', 2, function (r) {
    var volume = ri(r, 125, 3750) / 1000;
    return q('Convert a capacity of ' + n(volume, 3) + ' m³ to litres. Use 1 m³ = 1000 L.', Math.round(volume * 1000), 'L', 0, ['Each cubic metre holds 1000 litres, so multiply the number of cubic metres by 1000.', n(volume) + ' × 1000 = ' + Math.round(volume * 1000) + ' L.']);
  });
  add(7, 'temperature', 'Fahrenheit to Celsius', 2, function (r) {
    var f = ri(r, 20, 110);
    return rounded('Convert ' + f + ' °F to Celsius using C = (F − 32) × 5/9.', (f - 32) * 5 / 9, '°C', 2, ['Subtract 32 first: ' + f + ' − 32 = ' + (f - 32) + '.', 'Then multiply by 5/9: ' + (f - 32) + ' × 5 ÷ 9.']);
  });
  add(7, 'board-feet', 'Calculate board feet', 3, function (r) {
    var t = pick(r, [1, 2]), width = pick(r, [4, 6, 8, 10, 12]), len = pick(r, [8, 10, 12, 14, 16]), count = ri(r, 3, 15);
    return rounded('For this lumber tally use ' + t + ' in thickness, ' + width + ' in width and ' + len + ' ft length per board. Find the board feet for ' + count + ' boards. Board feet = T(in) × W(in) × L(ft) ÷ 12.', t * width * len * count / 12, 'board ft', 2, ['Per board = ' + t + ' × ' + width + ' × ' + len + ' ÷ 12 = ' + n(t * width * len / 12, 4) + ' board ft.', 'Multiply the unrounded result by ' + count + ' boards.']);
  });

  // 8: inverse operations and substitution checks, including square-root formulas.
  add(8, 'area-width', 'Transpose A = LW', 1, function (r) {
    var l = ri(r, 3, 18), w = ri(r, 2, 12), area = l * w;
    return q('A rectangle has area ' + area + ' m² and length ' + l + ' m. Use A = LW, transpose for W and find the width.', w, 'm', 0, ['Divide both sides by L: W = A/L.', 'W = ' + area + ' ÷ ' + l + ' = ' + w + ' m.', 'Check: ' + l + ' × ' + w + ' = ' + area + ' m².']);
  });
  add(8, 'perimeter-width', 'Transpose P = 2L + 2W', 2, function (r) {
    var l = ri(r, 8, 25), w = ri(r, 3, 7), p = 2 * (l + w);
    return q('A rectangular frame has perimeter ' + p + ' m and length ' + l + ' m. Use P = 2L + 2W to find W.', w, 'm', 0, ['Subtract 2L, then divide by 2: W = (P − 2L)/2.', 'W = (' + p + ' − 2 × ' + l + ')/2 = ' + w + ' m.', 'Check: 2 × ' + l + ' + 2 × ' + w + ' = ' + p + ' m.']);
  });
  add(8, 'circle-radius', 'Transpose A = πr²', 3, function (r) {
    var area = ri(r, 25, 250);
    return rounded('A circle has area ' + area + ' cm². Starting with A = πr², find its radius. Use the π key.', Math.sqrt(area / Math.PI), 'cm', 2, ['Divide by π: r² = A/π.', 'Take the positive square root for a length: r = √(' + area + '/π).', 'Substituting the unrounded radius into πr² gives ' + area + ' cm².']);
  });
  add(8, 'linear', 'Solve a two-step equation', 2, function (r) {
    var a = ri(r, 2, 7), x = ri(r, 20, 200), b = ri(r, 5, 35), total = a * x + b;
    return q('Solve ' + a + 'x + ' + b + ' = ' + total + ' for x.', x, '', 0, ['Subtract ' + b + ' from each side: ' + a + 'x = ' + (total - b) + '.', 'Divide both sides by ' + a + ': x = ' + x + '.', 'Check: ' + a + ' × ' + x + ' + ' + b + ' = ' + total + '.']);
  });
  add(8, 'stair-riser', 'Transpose a stair rise formula', 2, function (r) {
    var count = ri(r, 10, 18), riser = ri(r, 165, 190), height = count * riser;
    return q('For a geometry exercise, total stair rise H = nr. The height is ' + height + ' mm over ' + count + ' equal risers. Transpose for r and calculate one riser height.', riser, 'mm', 0, ['Divide both sides by n: r = H/n.', 'r = ' + height + ' ÷ ' + count + ' = ' + riser + ' mm.', 'Check: ' + count + ' × ' + riser + ' = ' + height + ' mm.']);
  });

  if (typeof geometry === 'function') geometry({ add: add, q: q, ri: ri, pick: pick, n: n, shape: shape });

  // Appendix kept separate from the thirteen numbered chapters so it is optional for carpentry exams.
  add('A', 'recipe', 'Scale a recipe yield', 1, function (r) {
    var old = pick(r, [4, 6, 8, 10]), next = ri(r, 12, 36), flour = ri(r, 200, 700);
    return rounded('A recipe for ' + old + ' servings uses ' + flour + ' g of flour. How much flour is needed for ' + next + ' servings?', flour * next / old, 'g', 2, ['Scale factor = new yield ÷ old yield = ' + next + '/' + old + '.', 'New flour = ' + flour + ' × ' + next + ' ÷ ' + old + '.']);
  });
  add('A', 'yield', 'Account for preparation yield', 3, function (r) {
    var net = ri(r, 15, 65) / 10, pct = pick(r, [70, 75, 80, 85, 90]);
    return rounded('A kitchen needs ' + n(net, 1) + ' kg of prepared vegetables. Its measured preparation yield is ' + pct + '%. How much unprepared product must be bought?', net / (pct / 100), 'kg', 2, ['Prepared amount = purchased amount × yield fraction.', 'Purchased amount = ' + n(net) + ' ÷ ' + pct / 100 + '.']);
  });
  add('A', 'cups', 'Use Canadian recipe measures', 1, function (r) {
    var cups = ri(r, 3, 20) / 2;
    return q('Using the stated Canadian recipe measure 1 cup = 250 mL, how many millilitres are in ' + n(cups) + ' cups?', cups * 250, 'mL', 0, ['Total volume = number of cups × millilitres per cup.', n(cups) + ' × 250 = ' + cups * 250 + ' mL.']);
  });
  add('A', 'portions', 'Calculate ingredient cost per portion', 2, function (r) {
    var portions = ri(r, 8, 30), cost = ri(r, 1800, 9000) / 100;
    return rounded('Ingredients for ' + portions + ' portions cost $' + n(cost, 2) + '. Find the ingredient cost per portion.', cost / portions, '$', 2, ['Cost per portion = total cost ÷ portion count = ' + n(cost, 2) + ' ÷ ' + portions + '.']);
  });
  var api = { chapters: chapters, tasks: tasks, helpers: { n: n, frac: frac } };
  if (C.register) C.register({ hub: 'textbook', title: 'Textbook chapters · Carpentry', tab: 'exam', engine: api,
    format: function (engine) { return engine.tasks; }, noConvert: true });
  return api;
});
