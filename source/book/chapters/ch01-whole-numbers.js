/* Chapter 1: Whole Numbers. Reference chapter for the author brief. */
module.exports = function (B, L) {
  const F = require('../engine/figs.js');
  const n = L.num;

  /* a plate with a straight row of holes: length, end distance, hole count. ask: 'end' | 'space' | 'len' */
  function holePlate(len, end, holes, o) {
    o = o || {};
    const W = 640, x0 = 70, sc = (W - 2 * x0) / len, y = 40, H = 70;
    const sp = (len - 2 * end) / (holes - 1);
    let h = F.rect(x0, y, len * sc, H);
    for (let i = 0; i < holes; i++) h += F.circle(x0 + (end + i * sp) * sc, y + H / 2, 9, { fill: '#FFFFFF', w: 1.8 });
    const endDim = (xa, xb, lab, ask, side) => {
      let d = F.line(xa, y + H + 3, xa, y + H + 32, { c: '#4A4E54', w: 1.1 }) + F.line(xb, y + H + 3, xb, y + H + 32, { c: '#4A4E54', w: 1.1 }) +
        F.line(xa, y + H + 26, xb, y + H + 26, { c: '#4A4E54', w: 1.2 }) + F.arrowHead(xa, y + H + 26, Math.PI) + F.arrowHead(xb, y + H + 26, 0);
      const lx = side < 0 ? xa - 34 : xb + 34;
      return d + F.label(lx, y + H + 31, lab, { ask, s: 12 });
    };
    h += endDim(x0, x0 + end * sc, o.ask === 'end' ? '?' : n(end) + ' mm', o.ask === 'end', -1);
    h += endDim(x0 + (len - end) * sc, x0 + len * sc, n(end) + ' mm', false, 1);
    h += F.dim(x0 + end * sc, y + H, x0 + (end + sp) * sc, y + H, o.ask === 'space' ? '?' : n(sp) + ' mm', 58, { ask: o.ask === 'space', s: 12 });
    h += F.dim(x0, y, x0 + len * sc, y, o.ask === 'len' ? '?' : n(len) + ' mm', -24, { ask: o.ask === 'len', s: 13 });
    return F.svg(W, y + H + 86, h, { max: o.max || '5.8in' });
  }
  /* L-shaped plate: overall width W, overall height H, upright leg width a, base height b. ask = list of names */
  function lPlate(W, H, a, b, o) {
    o = o || {};
    const ask = o.ask || [], hide = o.hide || [];
    const S = 330 / Math.max(W, H), x0 = 92, y0 = 40;
    const P = (x, y) => [x0 + x * S, y0 + (H - y) * S];
    let h = F.poly([P(0, 0), P(W, 0), P(W, b), P(a, b), P(a, H), P(0, H)]);
    const D = (k, p1, p2, v, off) => hide.includes(k) ? '' : F.dim(p1[0], p1[1], p2[0], p2[1], ask.includes(k) ? '?' : n(v) + ' mm', off, { ask: ask.includes(k), s: 12.5 });
    h += D('W', P(0, 0), P(W, 0), W, 26);
    h += D('H', P(0, 0), P(0, H), H, -52);
    h += D('a', P(0, H), P(a, H), a, -24);
    h += D('b', P(W, 0), P(W, b), b, 52);
    h += D('c', P(a, H), P(W, H), W - a, -24);
    h += D('d', P(W, b), P(W, H), H - b, 52);
    if (o.split) h += F.line(P(a, 0)[0], P(a, 0)[1], P(a, b)[0], P(a, b)[1], { c: '#4A4E54', w: 1.4, dash: '6 4' }) + F.t(P(a / 2, H / 2)[0], P(a / 2, H / 2)[1] + 5, 'A', { s: 16, b: true, c: '#940010' }) + F.t(P((a + W) / 2, b / 2)[0], P((a + W) / 2, b / 2)[1] + 5, 'B', { s: 16, b: true, c: '#940010' });
    return F.svg(x0 + W * S + 100, y0 + H * S + 52, h, { max: o.max || '3.8in' });
  }
  /* rows of holes in a plate for counting problems */
  function holeGrid(rows, cols) {
    const g = 34, W = cols * g + 40, H = rows * g + 30;
    let h = F.rect(8, 8, W - 16, H - 16);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) h += F.circle(28 + c * g, 26 + r * g, 8, { fill: '#FFFFFF', w: 1.6 });
    return F.svg(W, H, h, { max: '2.6in' });
  }

  /* worked numbers, all computed here */
  const cut = [1250, 875, 640, 1480], cutSum = cut.reduce((a, b) => a + b, 0);
  const est = cut.map(v => Math.round(v / 100) * 100), estSum = est.reduce((a, b) => a + b, 0);

  /* ---------- Sections 1.9 to 1.12 and Worksheet 1C: helpers and numbers, all computed here ---------- */
  const G = require('../engine/figs-ch01.js')
  const PL = require('../engine/plates.js')
  const sum = xs => xs.reduce((a, b) => a + b, 0)
  const sorted = xs => xs.slice().sort((a, b) => a - b)
  const median = xs => {
    const s = sorted(xs), k = s.length
    return k % 2 ? s[(k - 1) / 2] : (s[k / 2 - 1] + s[k / 2]) / 2
  }
  const modes = xs => {
    const c = {}
    xs.forEach(v => { c[v] = (c[v] || 0) + 1 })
    const top = Math.max(...Object.values(c))
    return top < 2 ? [] : Object.keys(c).filter(k => c[k] === top).map(Number)
  }
  /* clock times in minutes after midnight */
  const tm = m => ((Math.floor(m / 60) % 12) || 12) + ':' + String(m % 60).padStart(2, '0') + ' ' + (m >= 720 ? 'p.m.' : 'a.m.')
  const t24 = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0')
  const hmin = m => Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + (m % 60) + ' min' : '')
  const clocks = [[7, 15], [11, 50], [3, 35]]
  const el = { s: 7 * 60 + 45, e: 15 * 60 + 20 }, elMin = el.e - el.s
  const elA = 60 - el.s % 60, elB = Math.floor(el.e / 60) - Math.ceil(el.s / 60), elC = el.e % 60
  const days = [['Monday', 420, 930], ['Tuesday', 420, 975], ['Wednesday', 405, 930], ['Thursday', 420, 900], ['Friday', 420, 825]]
  const lunch = 30, dayMin = days.map(d => d[2] - d[1] - lunch), weekMin = sum(dayMin), weekH = weekMin / 60
  const rate = 27.8, pay = L.round(weekH * rate, 2)
  const decH = 6.4, decMin = L.round((decH - Math.floor(decH)) * 60, 0)
  const tenths = [6, 12, 15, 18, 24, 30, 36, 42, 45, 48, 54]
  const m1 = G.colMul(347, 26), m2 = G.colMul(408, 235)
  const wrong408 = 408 * 5 + 408 * 3 + 408 * 2
  const welds = [38, 42, 45, 40, 35], parts6 = [12, 15, 9, 14, 15, 11]
  const shifts = [46, 52, 48, 52, 55, 41, 49]
  const dry = [['Mon', 18], ['Tue', 24], ['Wed', 21], ['Thu', 24], ['Fri', 23]].map(d => ({ lab: d[0], v: d[1] }))
  const rods = [['Mon', 240], ['Tue', 205], ['Wed', 180], ['Thu', 150], ['Fri', 120]].map(d => ({ lab: d[0], v: d[1] }))
  const used = rods.slice(1).map((d, i) => rods[i].v - d.v)
  const st1 = G.studWall(4800, 400, { ask: 'count', max: '6in' }), st1n = 4800 / 400 + 1
  const w2 = 3700, sp2 = 400, sp2n = Math.ceil(w2 / sp2), short2 = w2 - (sp2n - 1) * sp2
  const blk = 400 - 38, blkUse = blk + 3, blkPer = Math.floor(2440 / blkUse), blkN = 12, blkBoards = Math.ceil(blkN / blkPer), blkOff = 2440 - blkPer * blkUse
  const shed = [9760, 6100, 9760, 6100], shedP = sum(shed), shedSheets = Math.ceil(shedP / 1220)
  const a91 = PL.article('9.23.10.1')

  return L.join([
    B.chapter({
      num: 1, id: 'whole', title: 'Whole Numbers',
      intro: B.p('Every job in the shop starts with whole numbers. You count bolts and brackets, read sizes off a drawing, add up a cut list and work out how many pieces you can get from one length of stock.',
        'This chapter reviews place value, rounding and estimating, and the four operations: adding, subtracting, multiplying and dividing. Each method is shown by hand first and then on the TI-30Xa and the Sharp EL-531XT, so you can check your work two ways.'),
      objectives: ['Read and write whole numbers using place value', 'Round whole numbers and use rounding to estimate', 'Add and subtract lengths on a cut list', 'Multiply and divide to find totals, pieces and spacing', 'Work out averages and multi-step shop problems', 'Check answers with an estimate and with your calculator'],
      words: ['whole number', 'digit', 'place value', 'rounding', 'estimate', 'sum and difference', 'factors and product', 'quotient and remainder', 'kerf', 'average'],
      art: F.cutBar([{ len: 1250, name: 'A' }, { len: 875, name: 'B' }, { len: 640, name: 'C' }, { len: 1480, name: 'D' }], { total: 6000, askRest: true, max: '6in' })
    }),

    B.section('Whole numbers and place value'),
    B.p('A ' + B.term('whole number', 'A number with no fraction or decimal part: 0, 1, 2, 3 and so on.') + ' is a number with no fraction or decimal part: 0, 1, 2, 3 and so on. Whole numbers are written with ten ' + B.term('digits', 'The ten symbols 0, 1, 2, 3, 4, 5, 6, 7, 8 and 9 used to write numbers.') + ', 0 to 9.',
      'The value of a digit depends on where it sits in the number. This is called ' + B.term('place value', 'The value a digit has because of its position in a number. In 12,450 the 2 is worth 2,000.') + '. Each place is worth ten times the place to its right.'),
    B.table(['Number', 'Ten thousands', 'Thousands', 'Hundreds', 'Tens', 'Ones'], [
      ['6,096', '', '6', '0', '9', '6'],
      ['12,450', '1', '2', '4', '5', '0'],
      ['305', '', '', '3', '0', '5']
    ], { align: ['', 'c', 'c', 'c', 'c', 'c'], caption: 'Place value of three numbers.' }),
    B.p('A zero holds a place. In 305 the zero shows there are no tens. Without it the number would read 35, which is a very different length.'),
    B.example({
      title: 'Reading a size off a drawing',
      q: 'A drawing gives the length of a beam as 12,450 mm. Write the number in words and say what the 2 is worth.',
      steps: ['Split the number at the comma: 12 thousand and 450.', 'Read each part: twelve thousand, four hundred fifty.', 'The 2 is in the thousands place, so it is worth 2 × 1,000 = 2,000.'],
      answer: 'Twelve thousand four hundred fifty millimetres. The 2 is worth 2,000.'
    }),
    B.tip('Commas and spaces', 'This book puts a comma between each group of three digits in numbers with four or more digits, for example 12,450. You may also see a small space used instead, as in 12 450. Both mean the same number. The conversion table at the back of this book groups long decimals with spaces, as in 0.453 592 37.'),
    B.tryIt([
      { q: 'Write 3,048 in words.', a: 'Three thousand forty-eight' },
      { q: 'Write in digits: seven thousand six hundred two.', a: '7,602' },
      { q: 'What is the 5 worth in 25,410?', a: '5,000' },
      { q: 'What is the 9 worth in 6,096?', a: '90' },
      { q: 'Which is longer, 2,450 mm or 2,405 mm?', a: '2,450 mm (45 tens is more than 40 tens)' },
      { q: 'Write in digits: twenty thousand fifty.', a: '20,050' }
    ]),

    B.section('Rounding'),
    B.p(B.term('Rounding', 'Replacing a number with a nearby number that is easier to work with, such as the nearest ten, hundred or thousand.') + ' replaces a number with a nearby number that is easier to work with. You round to a place: the nearest ten, the nearest hundred or the nearest thousand.'),
    B.how(['Find the digit in the place you are rounding to.', 'Look at the digit just to its right.', 'If that digit is 5 or more, add one to the rounding digit. If it is 4 or less, leave the rounding digit as it is.', 'Change every digit to the right of the rounding place to zero.']),
    B.figure(F.numberLine(2800, 2900, 10, 50, [{ v: 2847, lab: '2,847' }], { w: 620, fmt: v => n(v) }), '2,847 is closer to 2,800 than to 2,900, so it rounds to 2,800 to the nearest hundred.'),
    B.example({
      title: 'Rounding a length',
      q: 'Round 2,847 mm to the nearest ten and to the nearest hundred.',
      steps: ['Nearest ten: the tens digit is 4. The digit to its right is 7, which is 5 or more, so the 4 becomes 5: 2,850 mm.', 'Nearest hundred: the hundreds digit is 8. The digit to its right is 4, which is 4 or less, so the 8 stays: 2,800 mm.'],
      answer: '2,850 mm to the nearest ten, 2,800 mm to the nearest hundred.'
    }),
    B.example({
      title: 'Rounding up past a nine',
      q: 'Round 6,960 to the nearest hundred.',
      steps: ['The hundreds digit is 9. The digit to its right is 6, so the 9 goes up by one.', 'Nine plus one is ten, so write 0 in the hundreds place and carry 1 into the thousands: 6 thousands become 7 thousands.'],
      answer: '7,000'
    }),
    B.watch('Round at the end', 'Do the whole calculation with the exact numbers and round only the final answer. Rounding each step adds small errors together and the result can be a cut that is too short.'),
    B.tryIt([
      { q: 'Round 1,374 to the nearest ten.', a: '1,370' },
      { q: 'Round 1,375 to the nearest ten.', a: '1,380' },
      { q: 'Round 6,096 to the nearest hundred.', a: '6,100' },
      { q: 'Round 6,096 to the nearest thousand.', a: '6,000' },
      { q: 'Round 49,950 to the nearest hundred.', a: '50,000' },
      { q: 'Round 845 to the nearest hundred.', a: '800' }
    ]),

    B.section('Estimating'),
    B.p('An ' + B.term('estimate', 'A quick, rounded answer used to check that an exact answer makes sense.') + ' is a quick answer made with rounded numbers. It tells you roughly what the exact answer should be. If your calculator gives an answer far from your estimate, a key was probably missed or pressed twice.'),
    B.example({
      title: 'Estimating a cut list',
      q: 'A cut list has four pieces: ' + cut.map(v => n(v) + ' mm').join(', ') + '. Estimate the total length.',
      steps: ['Round each length to the nearest hundred: ' + est.map(v => n(v)).join(', ') + '.', 'Add the rounded numbers: ' + est.map(v => n(v)).join(' + ') + ' = ' + n(estSum) + '.'],
      answer: 'About ' + n(estSum) + ' mm. The exact total, found in Example 1.5, is ' + n(cutSum) + ' mm, which is close to the estimate.'
    }),
    B.keyidea('Key idea', 'Estimate first, calculate second, compare third. An estimate does not replace the exact answer. It catches mistakes before they reach the saw.'),

    B.section('Adding'),
    B.p('Adding puts amounts together. The answer to an addition is the ' + B.term('sum', 'The answer to an addition.') + '. To add by hand, line the numbers up by place value, ones under ones and tens under tens, and add each column from the right. When a column adds to 10 or more, write the ones digit and carry the tens digit to the next column.'),
    B.figure(F.cutBar(cut.map((v, i) => ({ len: v, name: 'ABCD'[i] })), { askTotal: true }), 'The cut list from Example 1.4. The total length is hidden.'),
    B.example({
      title: 'Total length of a cut list',
      q: 'Find the exact total length of the four pieces: ' + cut.map(v => n(v) + ' mm').join(', ') + '.',
      steps: ['Ones: 0 + 5 + 0 + 0 = 5.', 'Tens: 5 + 7 + 4 + 8 = 24. Write 4, carry 2.', 'Hundreds: 2 + 8 + 6 + 4 + 2 (carried) = 22. Write 2, carry 2.', 'Thousands: 1 + 1 + 2 (carried) = 4.'],
      calc: { seq: cut.join(' + ') + ' =', expect: n(cutSum), say: 'The TI-30Xa shows ' + cutSum + '. The Sharp EL-531XT shows ' + n(cutSum).replace(',', '\u2019') + ', with a small mark between the thousands and the hundreds. The total is <b>' + n(cutSum) + ' mm</b>.' },
      answer: n(cutSum) + ' mm, close to the estimate of ' + n(estSum) + ' mm.'
    }),
    B.p('The TI-30Xa shows no separator between groups of digits. Read its display from the right in groups of three to put the commas back: ' + cutSum + ' is ' + n(cutSum) + '. The Sharp EL-531XT marks each group of three with a small raised mark, as in ' + n(cutSum).replace(',', '\u2019') + '.'),
    B.tryIt([
      { q: '2,450 + 1,375', a: n(2450 + 1375) },
      { q: '608 + 1,295 + 47', a: n(608 + 1295 + 47) },
      { q: 'Pieces of 915, 915 and 1,220 mm. Total length?', a: n(915 + 915 + 1220) + ' mm' },
      { q: '12,450 + 3,048 + 9,960', a: n(12450 + 3048 + 9960) }
    ]),

    B.section('Subtracting'),
    B.p('Subtracting takes one amount away from another. The answer is the ' + B.term('difference', 'The answer to a subtraction.') + '. Line the numbers up by place value with the larger number on top. When the top digit in a column is smaller than the bottom digit, borrow 1 from the next column to the left. That 1 is worth 10 in the column you are working on.'),
    B.example({
      title: 'What is left of the bar?',
      /* the drawing sits full width under the question so its labels print at 7 pt or more */
      q: 'The four pieces from Example 1.5 (' + n(cutSum) + ' mm in total) are cut from a 6,000 mm bar. Ignore the width of the saw cuts. How long is the offcut?' +
        '<div class="fullfig" style="margin:6pt auto 2pt;max-width:6in">' + F.cutBar(cut.map((v, i) => ({ len: v, name: 'ABCD'[i] })), { total: 6000, askRest: true, overall: true }).replace(/(font-size=")13(" font-weight="700" fill="#940010">[A-D]<)/g, '$118$2') + '</div>',
      steps: ['Write 6,000 on top and ' + n(cutSum) + ' below it.', 'Ones: 0 − 5 needs a borrow. The tens and hundreds are 0, so borrow through them: 6,000 becomes 5 thousands, 9 hundreds, 9 tens and 10 ones.', '10 − 5 = 5, 9 − 4 = 5, 9 − 2 = 7, 5 − 4 = 1.'],
      calc: { seq: '6000 − ' + cutSum + ' =', expect: n(6000 - cutSum) },
      answer: n(6000 - cutSum) + ' mm'
    }),
    B.example({
      title: 'Finding a hidden dimension', long: true,
      q: 'A drawing gives the overall length of a part as 2,400 mm and two of its three sections as 750 mm and 900 mm. Find the middle section.',
      fig: F.cutBar([{ len: 750 }, { len: 750, ask: true }, { len: 900 }], { w: 460 }).replace(/3,?\d{3} mm|2,?400 mm/, '2,400 mm'),
      steps: ['The three sections add up to the overall length.', 'Add the sections you know: 750 + 900 = 1,650.', 'Subtract from the overall length: 2,400 − 1,650 = 750.'],
      calc: { seq: '2400 − 750 − 900 =', expect: '750' },
      answer: 'The middle section is 750 mm.'
    }),
    B.tip('Check a subtraction by adding', 'Add the answer back to the number you took away. You should get the number you started with: ' + n(6000 - cutSum) + ' + ' + n(cutSum) + ' = 6,000.'),
    B.tryIt([
      { q: '5,000 − 1,875', a: n(5000 - 1875) },
      { q: '12,450 − 9,960', a: n(12450 - 9960) },
      { q: 'A 3,600 mm bar has 2,475 mm cut off. How much is left?', a: n(3600 - 2475) + ' mm' },
      { q: 'Overall 1,800 mm. Sections of 600 mm and ? mm. Find the ?', a: '1,200 mm' }
    ]),

    B.section('Multiplying'),
    B.p('Multiplying is a fast way to add the same number many times. 24 × 4 means 24 groups of 4. The numbers you multiply are ' + B.term('factors', 'Numbers that are multiplied together.') + ', and the answer is the ' + B.term('product', 'The answer to a multiplication.') + '.'),
    B.example({
      title: 'Counting bolts',
      q: 'A job needs 24 brackets. Each bracket is held by 4 bolts. How many bolts are needed?',
      steps: ['24 groups of 4: 24 × 4.', '20 × 4 = 80 and 4 × 4 = 16.', '80 + 16 = 96.'],
      calc: { seq: '24 × 4 =', expect: '96' },
      answer: '96 bolts'
    }),
    B.example({
      title: 'Multiplying by a two-digit number',
      q: 'You need 36 pieces, each 125 mm long. What total length of stock do the pieces use? Ignore the saw cuts.',
      steps: ['Split 36 into 30 + 6.', '125 × 6 = 750.', '125 × 30 = 3,750.', 'Add the two parts: 750 + 3,750 = 4,500.'],
      calc: { seq: '36 × 125 =', expect: '4,500' },
      answer: '4,500 mm'
    }),
    B.p('Splitting a number into parts works well in your head. On paper, most people multiply in columns, one digit of the bottom number at a time. Section 1.10 shows the column method step by step, for numbers up to three digits by three digits, with a times table.'),
    B.shop('Saw cuts take material', 'A saw blade turns a strip of metal into chips. The width of that strip is the ' + B.term('kerf', 'The width of material removed by a saw cut.') + '. When you cut many pieces, the kerf adds up. With a kerf of 3 mm, 12 cuts remove 12 × 3 = 36 mm of stock. The problems in this book give the kerf whenever it counts.'),
    B.tryIt([
      { q: '15 × 8', a: '120' },
      { q: '48 × 25', a: n(48 * 25) },
      { q: '125 × 64', a: n(125 * 64) },
      { q: '18 pieces at 450 mm. Total length?', a: n(18 * 450) + ' mm' },
      { q: '7 cuts with a 3 mm kerf. Stock lost?', a: '21 mm' },
      { q: '6 rows of 14 bolts. How many bolts?', a: '84' }
    ]),

    B.section('Dividing'),
    B.p('Dividing splits an amount into equal groups or equal parts. In 6,000 ÷ 450, the number being divided (6,000) is the dividend, the number you divide by (450) is the divisor, and the answer is the ' + B.term('quotient', 'The answer to a division.') + '. When the division does not come out even, the amount left over is the ' + B.term('remainder', 'The amount left over when a number does not divide evenly.') + '.'),
    B.example({
      title: 'Pieces from one bar',
      q: 'How many 450 mm pieces can you cut from a 6,000 mm bar? Ignore the saw cuts. How long is the offcut?',
      steps: ['Divide: 6,000 ÷ 450. The calculator shows 13.33333333.', 'Only whole pieces count, so you get 13 pieces.', 'The 13 pieces use 13 × 450 = 5,850 mm.', 'The offcut is the remainder: 6,000 − 5,850 = 150 mm.'],
      calc: { rows: [{ label: 'Pieces', seq: '6000 ÷ 450 =', expect: '13.3333' }, { label: 'Offcut', seq: '6000 − 13 × 450 =', expect: '150' }] },
      answer: '13 pieces, with a 150 mm offcut.'
    }),
    B.watch('Whole pieces only', 'The calculator shows 13.33333333 pieces. Only whole pieces count, so the answer is 13. Even 13.9 would still be 13 pieces, because the 14th piece does not fit. Think about what the answer means before you round.'),
    B.example({
      title: 'Long division by hand',
      q: 'Divide 4,500 by 36.',
      steps: ['36 does not go into 4. It goes into 45 once: 1 × 36 = 36, and 45 − 36 = 9.', 'Bring down the 0 to make 90. 36 goes into 90 twice: 2 × 36 = 72, and 90 − 72 = 18.', 'Bring down the last 0 to make 180. 36 goes into 180 five times: 5 × 36 = 180, remainder 0.', 'Read the answer from the top: 125.'],
      calc: { seq: '4500 ÷ 36 =', expect: '125' },
      answer: '125. This undoes Example 1.9: 36 × 125 = 4,500.'
    }),
    B.p('Equal spacing is a division problem with one twist. When there is a hole at each end of a straight row, the number of spaces is one less than the number of holes.'),
    B.figure(holePlate(1200, 100, 6, { ask: 'space' }), 'Six holes in a row, with the end holes 100 mm from the ends of a 1,200 mm plate.'),
    B.example({
      title: 'Equal hole spacing',
      q: 'Six holes are drilled in a straight row along a 1,200 mm plate. The first and last holes are 100 mm from the ends. The holes are evenly spaced. How far apart are the holes, centre to centre?',
      steps: ['Distance from the first hole to the last hole: 1,200 − 100 − 100 = 1,000 mm.', 'Six holes make 6 − 1 = 5 spaces.', 'Spacing: 1,000 ÷ 5 = 200 mm.'],
      calc: { seq: '( 1200 − 2 × 100 ) ÷ 5 =', expect: '200' },
      answer: '200 mm centre to centre.'
    }),
    B.keyidea('Key idea', 'In a straight row with a hole at each end, spaces = holes − 1. Draw a quick sketch and count the gaps if you are unsure.'),
    B.p('Carpenters use the same idea the other way round: studs = spaces + 1. Section 1.12 counts studs and joists along a wall or floor.'),
    B.tryIt([
      { q: '144 ÷ 12', a: '12' },
      { q: '5,850 ÷ 450', a: '13' },
      { q: '1,000 ÷ 8', a: '125' },
      { q: 'How many 380 mm pieces from a 3,000 mm bar? Offcut?', a: '7 pieces (2,660 mm), offcut 340 mm' },
      { q: '96 bolts shared equally among 24 brackets. Bolts each?', a: '4' },
      { q: '6 holes evenly spaced, end holes 50 mm from the ends of a 650 mm bar. Spacing?', a: '110 mm (550 ÷ 5)' }
    ]),

    B.section('Averages and multi-step problems'),
    B.p('The ' + B.term('average', 'The sum of a set of numbers divided by how many numbers there are. Also called the mean.') + ' of a set of numbers is one number that represents the whole set. Add the numbers, then divide by how many numbers there are.'),
    B.example({
      title: 'Average welds per day',
      q: 'Over five days a welder completes 38, 42, 45, 40 and 35 joints. What is the average number of joints per day?',
      steps: ['Add: 38 + 42 + 45 + 40 + 35 = 200.', 'There are 5 days, so divide by 5: 200 ÷ 5 = 40.'],
      calc: { seq: '( 38 + 42 + 45 + 40 + 35 ) ÷ 5 =', expect: '40', say: 'The brackets make the calculator add first and divide second. Chapter 3 explains why.' },
      answer: '40 joints per day.'
    }),
    B.p('The average is one way to describe a set of numbers. Two more are the median and the mode. The ' + B.term('median', 'The middle number when a set of numbers is put in order from smallest to largest. With an even count, it is halfway between the two middle numbers.') + ' is the middle number once the set is put in order. For the welder, 35, 38, 40, 42, 45 has 40 in the middle, so the median is 40 joints. The ' + B.term('mode', 'The number that comes up most often in a set of numbers. A set can have no mode or more than one.') + ' is the number that comes up most often. Each number of joints comes up once, so this set has no mode.'),
    B.keyidea('Mean, median and mode', 'Mean (average): add them up and divide by how many. Median: put them in order and take the middle one. Mode: the one that comes up most often. Section 1.11 works through all three with shop tables and graphs.'),
    B.p('Many shop problems take more than one step. Write down what you know, decide which operation each step needs, and check the final answer against an estimate.'),
    B.example({
      title: 'Ordering brackets', long: true,
      q: 'A job has 3 units. Each unit needs 14 brackets, and you want 6 spares. Brackets come in boxes of 10. How many boxes do you order?',
      steps: ['Brackets for the units: 3 × 14 = 42.', 'Add the spares: 42 + 6 = 48 brackets.', 'Boxes: 48 ÷ 10 = 4.8.', '4 boxes hold only 40 brackets, which is not enough. Round up to 5 boxes.'],
      calc: { rows: [{ label: 'Brackets', seq: '3 × 14 + 6 =', expect: '48' }, { label: 'Boxes', seq: '48 ÷ 10 =', expect: '4.8' }] },
      answer: '5 boxes (50 brackets).'
    }),
    B.watch('Rounding up or rounding down', 'When you are counting pieces you can cut, round down: a part piece is scrap. When you are counting boxes, lengths or sheets you need to buy, round up: a part box still has to be bought.'),

    B.section('Time on the job'),
    B.p('Shifts, breaks, timesheets and pay all run on the clock. The amount of time that passes between a start time and an end time is the ' + B.term('elapsed time', 'The amount of time that passes between a start time and an end time.') + '. Time does not count in tens: 60 minutes make an hour, so you cannot subtract clock times the way you subtract lengths.'),
    B.sub('Reading a clock'),
    B.p('A clock face has two hands. The short hand points to the hour. The long hand points to the minutes. The numbers 1 to 12 mark the hours for the short hand. For the long hand, each number is 5 minutes more than the one before: the 1 means 5 minutes, the 2 means 10 minutes, and the 9 means 45 minutes. The small marks between the numbers are single minutes.',
      'When the long hand is past the 12, the short hand has moved past the hour it just reached. At 7:15 it sits a quarter of the way from the 7 to the 8.'),
    B.figure('<div style="display:flex;justify-content:center;gap:0.35in">' + clocks.map((c, i) => G.clock(c[0], c[1], { lab: 'ABC'[i], max: '1.55in' })).join('') + '</div>', 'Three clocks. The short hand shows the hour and the long red hand shows the minutes.'),
    B.example({
      title: 'Reading three clocks',
      q: 'Read clocks A, B and C in Figure 1.4.',
      steps: ['A: the short hand is just past the 7, so the hour is 7. The long hand is on the 3: 3 × 5 = 15 minutes. A reads 7:15.', 'B: the short hand is near the 12 but has not reached it, so the hour is still 11. The long hand is on the 10: 10 × 5 = 50 minutes. B reads 11:50.', 'C: the short hand is past the 3. The long hand is on the 7: 7 × 5 = 35 minutes. C reads 3:35.'],
      answer: 'A is 7:15, B is 11:50 and C is 3:35.'
    }),
    B.sub('Elapsed time'),
    B.p('To find how long a job took, count up from the start time in three steps: up to the next whole hour, then whole hours, then the minutes that are left. This works across noon too.'),
    B.example({
      title: 'A job that runs past noon',
      q: 'A pour starts at ' + tm(el.s) + ' and finishes at ' + tm(el.e) + ' How long does it take?',
      steps: ['Up to the next whole hour: ' + tm(el.s) + ' to ' + tm(el.s + elA) + ' is ' + elA + ' minutes.', 'Whole hours: ' + tm(el.s + elA) + ' to ' + tm(el.s + elA + elB * 60) + ' is ' + elB + ' hours: 8:00 to 12:00 is 4 hours and 12:00 to 3:00 is 3 more.', 'The minutes that are left: ' + tm(el.e - elC) + ' to ' + tm(el.e) + ' is ' + elC + ' minutes.', 'Add: ' + elB + ' h + ' + elA + ' min + ' + elC + ' min = ' + elB + ' h ' + (elA + elC) + ' min.'],
      answer: hmin(elMin) + '.'
    }),
    B.p('A clock face does not say morning or afternoon. Times from midnight to noon are a.m. and times from noon to midnight are p.m. Many sites, schedules and phones use the 24-hour clock instead, which counts the hours from 00 to 23 after midnight. For a p.m. time from 1:00 p.m. on, add 12 to the hour: 3:35 p.m. is 15:35.'),
    B.raw('<div class="keep">' + B.table(['12-hour clock', '24-hour clock'], [7 * 60 + 15, 11 * 60 + 50, 12 * 60, 13 * 60 + 30, 15 * 60 + 35, 23 * 60 + 5].map(m => [tm(m), t24(m)]), { align: ['c', 'c'], caption: 'The same times on the 12-hour and the 24-hour clock. 12:00 p.m. is noon.' }) + '</div>'),
    B.sub('Decimal hours and timesheets'),
    B.p('Timesheets and pay use decimal hours. To change minutes to a decimal part of an hour, divide by 60: 45 minutes is 45 ÷ 60 = 0.75 hours. To change a decimal part of an hour back to minutes, multiply by 60. Chapter 5 covers decimals in full.'),
    B.calc({ title: 'Minutes to decimal hours', rows: [{ label: '45 min', seq: '45 ÷ 60 =', expect: '0.75' }, { label: '24 min', seq: '24 ÷ 60 =', expect: '0.4' }] }),
    '<div style="break-inside:avoid">' + B.table(['Minutes', 'Decimal hours'], tenths.map(m => [String(m), L.num(m / 60)]), { align: ['c', 'c'], caption: 'Minutes that change to an exact decimal of an hour (minutes ÷ 60).' }) + '</div>',
    B.example({
      title: 'A week on the timesheet', long: true,
      q: 'A pre-apprentice works the week below. Each day has a ' + lunch + ' minute unpaid lunch. Find the hours for each day, the total for the week in hours and minutes and in decimal hours, and the pay before deductions at $' + L.num(rate, 2) + ' an hour.',
      after: B.table(['Day', 'Start', 'Finish', 'Time on site', 'Paid time', 'Decimal hours'], days.map((d, i) => [d[0], tm(d[1]), tm(d[2]), hmin(d[2] - d[1]), hmin(dayMin[i]), L.num(dayMin[i] / 60)]).concat([['<b>Week</b>', '', '', '', '<b>' + hmin(weekMin) + '</b>', '<b>' + L.num(weekH) + '</b>']]), { align: ['', 'c', 'c', 'c', 'c', 'c'], caption: 'The timesheet for Example 1.17.' }),
      steps: ['For each day, find the time on site by counting up from the start to the finish. Monday: ' + tm(days[0][1]) + ' to ' + tm(days[0][2]) + ' is ' + hmin(days[0][2] - days[0][1]) + '.', 'Take off the ' + lunch + ' minute lunch: ' + hmin(days[0][2] - days[0][1]) + ' − ' + lunch + ' min = ' + hmin(dayMin[0]) + '.', 'Add the paid time for the five days: ' + dayMin.map(hmin).join(' + ') + ' = ' + hmin(weekMin) + '.', 'In decimal hours: ' + (weekMin % 60) + ' ÷ 60 = ' + L.num((weekMin % 60) / 60) + ', so ' + hmin(weekMin) + ' = ' + L.num(weekH) + ' hours.', 'Pay: ' + L.num(weekH) + ' × ' + L.num(rate, 2) + ' = $' + L.num(pay, 2) + '.'],
      calc: { seq: L.num(weekH) + ' × ' + rate + ' =', expect: L.num(pay, 2), say: 'The display shows ' + L.CALC.screenText(L.num(weekH) + ' × ' + rate + ' =', 'ti30xa').main + ' on the TI-30Xa. Money is written with two decimal places: $' + L.num(pay, 2) + '.' },
      answer: hmin(weekMin) + ', or ' + L.num(weekH) + ' hours. Pay before deductions: $' + L.num(pay, 2) + '.'
    }),
    B.example({
      title: 'Decimal hours back to minutes',
      q: 'A job log shows ' + decH + ' hours. How many hours and minutes is that?',
      steps: ['The whole number is the hours: 6 hours.', 'Multiply the decimal part by 60: 0.4 × 60 = ' + decMin + ' minutes.'],
      calc: { seq: '0.4 × 60 =', expect: String(decMin) },
      answer: '6 h ' + decMin + ' min.'
    }),
    B.watch('6.4 hours is not 6 hours 40 minutes', 'The digits after the point are tenths of an hour, not minutes. 6.4 hours is 6 hours 24 minutes. Always multiply the decimal part by 60.'),
    B.tryIt([
      { q: 'Write 2:45 p.m. on the 24-hour clock.', a: '14:45' },
      { q: 'Write 19:20 on the 12-hour clock.', a: tm(19 * 60 + 20) },
      { q: 'How long is it from 6:50 a.m. to 9:15 a.m.?', a: hmin(9 * 60 + 15 - (6 * 60 + 50)) },
      { q: 'How long is it from 10:40 a.m. to 2:05 p.m.?', a: hmin(14 * 60 + 5 - (10 * 60 + 40)) },
      { q: 'Change 7 h 30 min to decimal hours.', a: '7.5 hours' },
      { q: 'Change 8 h 12 min to decimal hours.', a: L.num(8 + 12 / 60) + ' hours' },
      { q: 'Change 3.75 hours to hours and minutes.', a: '3 h 45 min' },
      { q: 'A shift runs 7:00 a.m. to 3:30 p.m. with a 30 minute unpaid lunch. How many paid hours?', a: hmin(15 * 60 + 30 - 7 * 60 - 30) + ' (' + L.num((15 * 60 + 30 - 7 * 60 - 30) / 60) + ' hours)' }
    ]),
    B.check('8 + 12 ÷ 60 =', L.num(8 + 12 / 60)),

    B.section('Multiplying in columns'),
    B.p('To multiply by a number with two or more digits on paper, work in columns. Write the larger number on top and line the digits up on the right. Multiply the top number by each digit of the bottom number in turn, starting with the ones. Each answer is a partial product. Then add the partial products.',
      'The digits of the bottom number are worth different amounts. In 26, the 2 is worth 20. So when you multiply by the tens digit, the answer is ten times bigger, and you write a zero in the ones column first to hold the place. When you multiply by the hundreds digit, write two zeros. These zeros hold the places. They are shown in red below.'),
    B.figure(m1.svg, '347 × 26 in columns. The red zero holds the ones place in the second row.', { width: '3.2in' }),
    B.example({
      title: 'Three digits by two digits',
      q: 'A job needs 26 pieces of flat bar, each 347 mm long. Ignore the saw cuts. Find the total length by multiplying 347 × 26 in columns.',
      steps: G.colMulSteps(347, 26).concat(['Check with an estimate: 350 × 30 = 10,500. The answer is close.']),
      calc: { seq: '347 × 26 =', expect: L.num(m1.product) },
      answer: L.num(m1.product) + ' mm'
    }),
    B.figure(m2.svg, '408 × 235 in columns. Each row moves one place to the left, and the red zeros hold the places.', { width: '3.6in' }),
    B.example({
      title: 'Three digits by three digits',
      q: 'Multiply 408 × 235 in columns.',
      steps: G.colMulSteps(408, 235).concat(['Estimate: 400 × 200 = 80,000 and 400 × 250 = 100,000. The answer sits between them.']),
      calc: { seq: '408 × 235 =', expect: L.num(m2.product) },
      answer: L.num(m2.product)
    }),
    B.watch('Do not drop the zeros that hold the places', 'Without the zeros, the three rows of 408 × 235 would add to ' + L.num(408 * 5) + ' + ' + L.num(408 * 3) + ' + ' + L.num(408 * 2) + ' = ' + L.num(wrong408) + ', far below the estimate of about 80,000. An estimate catches this mistake every time.'),
    B.p('Column multiplication goes faster when you know the times table. Find a product where a row meets a column: 7 × 8 is in row 7 under column 8.'),
    B.raw('<div class="keep">' + B.table(['×'].concat([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(String)), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(r => ['<b>' + r + '</b>'].concat([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(c => String(r * c)))), { align: Array(13).fill('c'), caption: 'Times table from 1 × 1 to 12 × 12.' }) + '</div>'),
    B.tryIt([
      { q: '56 × 34', a: L.num(56 * 34) },
      { q: '125 × 48', a: L.num(125 * 48) },
      { q: '307 × 24', a: L.num(307 * 24) },
      { q: '214 × 136', a: L.num(214 * 136) },
      { q: '605 × 408', a: L.num(605 * 408) },
      { q: '36 bolts at 165 g each. Total mass in grams?', a: L.num(36 * 165) + ' g' }
    ]),

    B.section('Median, mode, tables and graphs'),
    B.p('Section 1.8 found the average, also called the mean. The median and the mode describe a set of numbers in two other ways. Put the numbers in order first. That makes the median and the mode easy to find.'),
    B.example({
      title: 'The median of an odd number of values',
      q: 'Find the median of the welder’s joints in Example 1.13: ' + welds.join(', ') + '.',
      steps: ['Put them in order: ' + sorted(welds).join(', ') + '.', 'There are 5 values, so the middle one is the 3rd: ' + median(welds) + '.'],
      answer: 'The median is ' + median(welds) + ' joints. Here the mean is also 40.'
    }),
    B.example({
      title: 'The median and mode of an even number of values',
      q: 'A machine shop logs parts finished each shift: ' + parts6.join(', ') + '. Find the mean, the median and the mode.',
      steps: ['Mean: ' + parts6.join(' + ') + ' = ' + sum(parts6) + ', and ' + sum(parts6) + ' ÷ 6 = ' + L.num(L.round(sum(parts6) / 6, 2), 2) + ' to two decimal places.', 'Order: ' + sorted(parts6).join(', ') + '. There are 6 values, so there are two middle ones, ' + sorted(parts6)[2] + ' and ' + sorted(parts6)[3] + '. The median is halfway between: (' + sorted(parts6)[2] + ' + ' + sorted(parts6)[3] + ') ÷ 2 = ' + median(parts6) + '.', 'Mode: ' + modes(parts6)[0] + ' comes up twice. Every other value comes up once.'],
      calc: { seq: '( ' + parts6.join(' + ') + ' ) ÷ 6 =', expect: L.num(L.round(sum(parts6) / 6, 2), 2) },
      answer: 'Mean ' + L.num(L.round(sum(parts6) / 6, 2), 2) + ' parts, median ' + median(parts6) + ' parts, mode ' + modes(parts6)[0] + ' parts.'
    }),
    B.sub('Reading a table'),
    B.p('Trade tables put numbers in rows and columns. Read across a row and down a column to find a value. The table below logs the bolts a crew used on each shift of a 7-shift week.'),
    B.table(['Shift'].concat(shifts.map((v, i) => String(i + 1))), [['Bolts used'].concat(shifts.map(String))], { align: Array(8).fill('c'), caption: 'Bolts used on each shift.' }),
    B.example({
      title: 'Mean, median and mode from a table',
      q: 'Use Table 1.6. Find the mean, median and mode of the bolts used per shift.',
      steps: ['Mean: ' + shifts.join(' + ') + ' = ' + sum(shifts) + '. ' + sum(shifts) + ' ÷ 7 = ' + L.num(sum(shifts) / 7) + '.', 'Median: in order, ' + sorted(shifts).join(', ') + '. The 4th of 7 values is the middle: ' + median(shifts) + '.', 'Mode: ' + modes(shifts)[0] + ' comes up twice.'],
      calc: { seq: '( ' + shifts.join(' + ') + ' ) ÷ 7 =', expect: L.num(sum(shifts) / 7) },
      answer: 'Mean ' + L.num(sum(shifts) / 7) + ', median ' + median(shifts) + ', mode ' + modes(shifts)[0] + ' bolts.'
    }),
    B.sub('Bar graphs and line graphs'),
    B.p('A bar graph shows each value as a bar. Read the value at the top of the bar against the scale on the left. A line graph joins the values with a line, so you can see a change from one point to the next.'),
    B.figure(G.barGraph(dry, { step: 5, yLab: 'Sheets', xLab: 'Day', max: '5in' }), 'Drywall sheets hung by a crew each day.'),
    B.example({
      title: 'Reading a bar graph',
      q: 'Use Figure 1.7. On which day were the most sheets hung? Find the mean, median and mode.',
      steps: ['The tallest bars are Tuesday and Thursday, ' + Math.max(...dry.map(d => d.v)) + ' sheets each.', 'Mean: ' + dry.map(d => d.v).join(' + ') + ' = ' + sum(dry.map(d => d.v)) + ', and ' + sum(dry.map(d => d.v)) + ' ÷ 5 = ' + L.num(sum(dry.map(d => d.v)) / 5) + '.', 'Median: in order, ' + sorted(dry.map(d => d.v)).join(', ') + '. The middle value is ' + median(dry.map(d => d.v)) + '.', 'Mode: ' + modes(dry.map(d => d.v))[0] + ' comes up twice.'],
      answer: 'Tuesday and Thursday. Mean ' + L.num(sum(dry.map(d => d.v)) / 5) + ', median ' + median(dry.map(d => d.v)) + ', mode ' + modes(dry.map(d => d.v))[0] + ' sheets.'
    }),
    B.figure(G.lineGraph(rods, { step: 50, ymax: 250, yLab: 'Rods in stock', xLab: 'End of day', max: '5in' }), 'Welding rods left in stock at the end of each day.'),
    B.example({
      title: 'Reading a line graph',
      q: 'Use Figure 1.8. How many rods were used from Monday night to Friday night? What is the mean number used per day over those 4 days, and what is the mode?',
      steps: ['Used each day: ' + rods.slice(1).map((d, i) => rods[i].v + ' − ' + d.v + ' = ' + used[i]).join(', ') + '.', 'Total used: ' + rods[0].v + ' − ' + rods[4].v + ' = ' + (rods[0].v - rods[4].v) + ' rods.', 'Mean: ' + (rods[0].v - rods[4].v) + ' ÷ 4 = ' + ((rods[0].v - rods[4].v) / 4) + ' rods per day.', 'Mode: ' + modes(used)[0] + ' comes up twice in ' + used.join(', ') + '.'],
      answer: (rods[0].v - rods[4].v) + ' rods. Mean ' + ((rods[0].v - rods[4].v) / 4) + ' rods per day, mode ' + modes(used)[0] + '.'
    }),
    B.tryIt([
      { q: 'Find the median of 14, 9, 22, 17, 11.', a: String(median([14, 9, 22, 17, 11])) },
      { q: 'Find the median of 8, 3, 10, 6.', a: String(median([8, 3, 10, 6])) },
      { q: 'Find the mode of 5, 7, 5, 9, 7, 5.', a: String(modes([5, 7, 5, 9, 7, 5])[0]) },
      { q: 'Find the mean, median and mode of 30, 25, 30, 35, 40.', a: 'Mean ' + sum([30, 25, 30, 35, 40]) / 5 + ', median ' + median([30, 25, 30, 35, 40]) + ', mode 30' },
      { q: 'In Figure 1.7, how many more sheets were hung on Tuesday than on Monday?', a: String(dry[1].v - dry[0].v) },
      { q: 'In Figure 1.8, on which day were the most rods used?', a: 'Tuesday (' + used[0] + ' rods)' }
    ]),

    B.section('Carpentry: studs, joists and cut lists'),
    B.p('In a wood-frame wall, the upright pieces are studs. They stand between a bottom plate and a top plate. In a floor, the joists lie side by side. Studs and joists are set out at an equal spacing measured from the centre of one to the centre of the next. Carpenters call this the spacing ' + B.term('on centre', 'Measured from the centre of one framing member to the centre of the next. Written o.c., as in 400 mm o.c.') + ', written o.c.'),
    PL.figure(B, '9.23.10.1', { crop: [190, 180, 690, 186], width: '5.4in', caption: 'Studs on edge and on the flat along a bottom plate. The spacing is measured on centre.' }),
    B.p('The BC Building Code sets the largest stud spacing allowed. Article 9.23.10.1, Sentence (1) says the size and spacing of studs shall conform to Table 9.23.10.1 (page ' + a91.page + '). Part of the table for exterior walls is below. The spacings in the code are in millimetres.'),
    B.raw('<div class="keep">' + B.table(['Exterior wall supports', 'Minimum stud size, mm', 'Maximum stud spacing, mm', 'Maximum unsupported height, m'], [
      ['Roof with or without attic storage', '38 × 64', '400', '2.4'],
      ['', '38 × 89', '600', '3.0'],
      ['Roof with or without attic storage plus one floor', '38 × 89', '400', '3.0'],
      ['', '38 × 140', '600', '3.0'],
      ['Roof with or without attic storage plus 2 floors', '38 × 89', '300', '3.0'],
      ['', '64 × 89', '400', '3.0'],
      ['', '38 × 140', '400', '3.6']
    ], { align: ['', 'c', 'c', 'c'], caption: 'Exterior wall rows of Table 9.23.10.1, Size and Spacing of Studs. ' + PL.cite('9.23.10.1') + '. The full table also lists interior walls.' }) + '</div>'),
    B.figure(st1.svg, 'A 4,800 mm wall with studs at 400 mm o.c. and a stud at each end. The plates run along the top and bottom.'),
    B.example({
      title: 'Counting studs',
      q: 'A wall is 4,800 mm long. Studs go at 400 mm o.c., starting at one end, with a stud at each end. How many studs are there?',
      steps: ['Spaces: 4,800 ÷ 400 = ' + (4800 / 400) + '.', 'There is a stud at each end, so studs = spaces + 1 = ' + (4800 / 400) + ' + 1 = ' + st1n + '.', 'Count the studs in Figure 1.10 to check.'],
      calc: { seq: '4800 ÷ 400 + 1 =', expect: String(st1n) },
      answer: st1n + ' studs. This count is for a plain wall. Corners, openings and wall ends often need extra studs, which a framing plan shows.'
    }),
    B.example({
      title: 'A length that does not divide evenly',
      q: 'A wall is ' + L.num(w2) + ' mm long. The studs may be no more than ' + sp2 + ' mm o.c. Lay them out at ' + sp2 + ' mm from one end, with a stud at each end. How many studs, and how wide is the last space?',
      fig: G.studWall(w2, sp2, { max: '3in', w: 560 }).svg,
      steps: ['Spaces: ' + L.num(w2) + ' ÷ ' + sp2 + ' = ' + L.num(w2 / sp2) + '.', 'A space wider than ' + sp2 + ' mm is not allowed, so round the spaces up: ' + sp2n + ' spaces.', 'Studs: ' + sp2n + ' + 1 = ' + (sp2n + 1) + '.', 'The first ' + (sp2n - 1) + ' spaces are ' + sp2 + ' mm: ' + (sp2n - 1) + ' × ' + sp2 + ' = ' + L.num((sp2n - 1) * sp2) + ' mm. The last space is ' + L.num(w2) + ' − ' + L.num((sp2n - 1) * sp2) + ' = ' + short2 + ' mm.'],
      calc: { seq: w2 + ' ÷ ' + sp2 + ' =', expect: L.num(w2 / sp2) },
      answer: (sp2n + 1) + ' studs. The last space is ' + short2 + ' mm.'
    }),
    B.watch('Spacing is a maximum', 'When the spacing is the largest allowed, round the number of spaces up, never down. Rounding down would make every space wider than the limit.'),
    B.example({
      title: 'A cut list for blocking',
      q: 'Blocking fits between studs that are 38 mm thick and set at 400 mm o.c. Each block is 400 − 38 = ' + blk + ' mm long. You need ' + blkN + ' blocks, cut from boards 2,440 mm long. Each cut takes a 3 mm kerf. How many blocks come from one board, how many boards do you need, and how long is the offcut from each full board?',
      steps: ['Each block uses its length plus one saw cut: ' + blk + ' + 3 = ' + blkUse + ' mm.', 'Blocks per board: 2,440 ÷ ' + blkUse + ' = ' + L.num(L.round(2440 / blkUse, 2), 2) + '. Only whole blocks count: ' + blkPer + ' blocks.', 'Boards: ' + blkN + ' ÷ ' + blkPer + ' = ' + L.num(L.round(blkN / blkPer, 2), 2) + '. Round up: ' + blkBoards + ' boards.', 'Offcut from a board cut into ' + blkPer + ' blocks: 2,440 − ' + blkPer + ' × ' + blkUse + ' = ' + blkOff + ' mm.'],
      calc: { rows: [{ label: 'Blocks per board', seq: '2440 ÷ ' + blkUse + ' =', expect: L.num(L.round(2440 / blkUse, 2), 2) }, { label: 'Offcut', seq: '2440 − ' + blkPer + ' × ' + blkUse + ' =', expect: String(blkOff) }] },
      answer: blkPer + ' blocks per board, ' + blkBoards + ' boards, and a ' + blkOff + ' mm offcut from each full board.'
    }),
    B.example({
      title: 'Estimating sheathing',
      q: 'A shed has walls of ' + shed.map(v => L.num(v) + ' mm').join(', ') + '. The walls are sheathed with sheets 1,220 mm wide, standing on end, one row high. Ignore openings and corners. Estimate the number of sheets, then find it exactly.',
      steps: ['Estimate: round each wall to the nearest thousand: 10,000 + 6,000 + 10,000 + 6,000 = 32,000 mm. 32,000 ÷ 1,200 is a little under 27.', 'Exact: the walls add to ' + shed.map(v => L.num(v)).join(' + ') + ' = ' + L.num(shedP) + ' mm.', L.num(shedP) + ' ÷ 1,220 = ' + L.num(shedP / 1220) + '.'],
      calc: { seq: '( ' + shed.join(' + ') + ' ) ÷ 1220 =', expect: L.num(shedP / 1220) },
      answer: shedSheets + ' sheets, close to the estimate.'
    }),
    B.tryIt([
      { q: 'A wall is 6,000 mm long with studs at 400 mm o.c. and a stud at each end. How many studs?', a: String(6000 / 400 + 1) },
      { q: 'A wall is 3,000 mm long with studs at 600 mm o.c. and a stud at each end. How many studs?', a: String(3000 / 600 + 1) },
      { q: 'A floor is 5,500 mm long. Joists may be no more than 400 mm o.c., with a joist at each end. How many joists?', a: String(Math.ceil(5500 / 400) + 1) + ' (' + L.num(5500 / 400) + ' rounds up to ' + Math.ceil(5500 / 400) + ' spaces)' },
      { q: 'In Table 1.7, what is the largest spacing for 38 × 89 studs in an exterior wall that supports a roof plus one floor?', a: '400 mm' },
      { q: 'How many 600 mm blocks come from a 3,660 mm board with a 3 mm kerf on each cut?', a: String(Math.floor(3660 / 603)) + ' blocks' }
    ]),

    B.worksheet({ title: 'Cut lists on the canvas', sub: 'Each drawing is to scale. Find every red ?', intro: 'Work each problem in the working box. Ignore saw cuts unless the problem gives a kerf. Estimate first, then check with your calculator.' }),
    B.prob({ q: 'Three pieces are cut from a 6,000 mm bar. How long is the offcut?', canvas: F.cutBar([{ len: 1800 }, { len: 1200 }, { len: 950 }], { total: 6000, askRest: true }), a: n(6000 - 1800 - 1200 - 950) + ' mm', lines: 3 }),
    B.prob({ q: 'The overall length is 3,600 mm. Find the middle section.', canvas: F.cutBar([{ len: 1150 }, { len: 3600 - 1150 - 1375, ask: true }, { len: 1375 }]), a: n(3600 - 1150 - 1375) + ' mm', lines: 3 }),
    B.prob({ q: 'Six equal pieces of 735 mm. Find the total length.', canvas: F.cutBar([735, 735, 735, 735, 735, 735].map(v => ({ len: v })), { askTotal: true }), a: n(6 * 735) + ' mm', lines: 3 }),
    B.prob({ q: 'How many 380 mm pieces can be cut from a 6,000 mm bar? How long is the offcut?', a: Math.floor(6000 / 380) + ' pieces, offcut ' + n(6000 - Math.floor(6000 / 380) * 380) + ' mm', lines: 4 }),
    B.prob({ q: 'Two 1,500 mm pieces and one 2,000 mm piece are cut from a 6,000 mm bar. You make one cut for each piece and the kerf is 3 mm. How long is the offcut?', canvas: F.cutBar([{ len: 1500 }, { len: 1500 }, { len: 2000 }], { total: 6000, askRest: true }), a: n(6000 - 5000 - 3 * 3) + ' mm (5,000 mm of pieces plus 9 mm of kerf)', lines: 4 }),
    B.prob({ q: 'Nine holes are evenly spaced along a 1,350 mm bar. The end holes are 75 mm from the ends. Find the spacing.', canvas: holePlate(1350, 75, 9, { ask: 'space' }), a: n((1350 - 150) / 8) + ' mm', lines: 3 }),

    B.worksheet({ title: 'Break it down: plates and parts', sub: 'Split each part into simple pieces to find the ?', intro: 'The dashed line splits the plate into a part A and a part B. Use the sizes you know to find the sizes you do not know.' }),
    B.prob({ q: 'Find the hidden width.', canvas: lPlate(900, 700, 300, 250, { ask: ['c'], hide: ['d'], split: true }), a: n(900 - 300) + ' mm', lines: 2 }),
    B.prob({ q: 'Find the overall height.', canvas: lPlate(900, 700, 300, 250, { ask: ['H'], hide: ['c'], split: true }), a: n(450 + 250) + ' mm', lines: 2 }),
    B.prob({ q: 'Find the length of all six edges of the plate, then add them to find the distance around.', canvas: lPlate(900, 700, 300, 250, { split: false }), a: '900 + 250 + 600 + 450 + 300 + 700 = ' + n(900 + 250 + 600 + 450 + 300 + 700) + ' mm', lines: 3 }),
    B.prob({ q: 'A plate has holes in equal rows. Count them with one multiplication. Each hole takes 2 minutes to drill. How long does the plate take?', canvas: holeGrid(3, 8), a: '3 × 8 = 24 holes, 24 × 2 = 48 minutes', lines: 3 }),
    B.prob({ q: 'Estimate 4 × 1,180 by rounding 1,180 to the nearest hundred. Then find the exact answer.', a: 'Estimate 4 × 1,200 = 4,800. Exact ' + n(4 * 1180) + '.', lines: 2 }),
    B.prob({ q: 'Four test plates measure 312, 298, 305 and 301 mm across. Find the average.', a: n((312 + 298 + 305 + 301) / 4) + ' mm', lines: 2 }),
    B.check('312 + 298 + 305 + 301 = ÷ 4 =', '304'),

    B.worksheet({ title: 'Carpentry: studs, joists and cut lists', sub: 'Walls and floors on the canvas. Find every red ?', intro: 'Every wall has a stud at each end. Spacings are on centre (o.c.). Round the number of spaces up when the spacing is a maximum. Code values come from Table 1.7.' }),
    B.prob({ q: 'Studs go at 400 mm o.c. along a 3,600 mm wall. How many studs are there?', canvas: G.studWall(3600, 400, { note: 'How many studs?', max: '5.6in' }).svg, a: (3600 / 400 + 1) + ' studs', work: '3,600 ÷ 400 = 9 spaces. 9 + 1 = 10.', lines: 2 }),
    B.prob({ q: 'A 4,800 mm wall has 13 studs, evenly spaced, with one at each end. Find the spacing.', canvas: G.studWall(4800, 400, { ask: 'space', max: '5.6in' }).svg, a: (4800 / 12) + ' mm o.c.', work: '13 studs make 12 spaces. 4,800 ÷ 12 = 400.', lines: 2 }),
    B.prob({ q: 'Seven studs are set 600 mm o.c., with one at each end. How long is the wall?', canvas: G.studWall(3600, 600, { ask: 'len', max: '5.6in' }).svg, a: L.num(6 * 600) + ' mm', work: '7 studs make 6 spaces. 6 × 600 = 3,600.', lines: 2 }),
    B.prob({ q: 'A floor is 4,880 mm long. The joists may be no more than 400 mm o.c., with a joist at each end. How many joists are needed, and how wide is the last space if you lay them out at 400 mm from one end?', a: (Math.ceil(4880 / 400) + 1) + ' joists. The last space is ' + (4880 - (Math.ceil(4880 / 400) - 1) * 400) + ' mm.', work: '4,880 ÷ 400 = 12.2, round up to 13 spaces. 13 + 1 = 14. 12 × 400 = 4,800, 4,880 − 4,800 = 80.', lines: 3 }),
    B.prob({ q: 'Use Table 1.7. An exterior wall supports a roof plus one floor. It is framed with 38 × 89 studs at 600 mm o.c. Does this meet the table? If not, how many studs does a 6,000 mm length of this wall need at the largest spacing the table allows, with a stud at each end?', a: 'No. The table allows 38 × 89 studs at no more than 400 mm for this wall. ' + (6000 / 400 + 1) + ' studs.', work: '6,000 ÷ 400 = 15 spaces, 15 + 1 = 16.', lines: 3 }),
    B.prob({ q: 'You need 10 cripple studs, each 610 mm long, cut from boards 2,440 mm long. Allow 3 mm of kerf for each piece. How many pieces come from one board, and how many boards do you need?', a: Math.floor(2440 / 613) + ' pieces per board, ' + Math.ceil(10 / Math.floor(2440 / 613)) + ' boards', work: '610 + 3 = 613. 2,440 ÷ 613 = 3.98, so 3 pieces. 10 ÷ 3 = 3.33, round up to 4 boards.', lines: 3 }),
    B.prob({ q: 'Walls with a total length of 14,640 mm are sheathed with sheets 1,220 mm wide, in 2 rows. Ignore openings. Estimate first, then find the number of sheets.', a: 'Estimate 15,000 ÷ 1,200 is about 12 per row. Exact: ' + (14640 / 1220) + ' per row, ' + (2 * 14640 / 1220) + ' sheets.', lines: 3 }),
    B.check('2440 ÷ 613 =', '3.98'), B.check('4880 ÷ 400 =', '12.2'), B.check('14640 ÷ 1220 × 2 =', '24')
  ]);
};
