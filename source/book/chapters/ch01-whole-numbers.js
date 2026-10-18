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
      q: 'The four pieces from Example 1.5 (' + n(cutSum) + ' mm in total) are cut from a 6,000 mm bar. Ignore the width of the saw cuts. How long is the offcut?',
      fig: F.cutBar(cut.map((v, i) => ({ len: v, name: 'ABCD'[i] })), { total: 6000, askRest: true, overall: true, w: 520 }),
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
    B.p('Many shop problems take more than one step. Write down what you know, decide which operation each step needs, and check the final answer against an estimate.'),
    B.example({
      title: 'Ordering brackets', long: true,
      q: 'A job has 3 units. Each unit needs 14 brackets, and you want 6 spares. Brackets come in boxes of 10. How many boxes do you order?',
      steps: ['Brackets for the units: 3 × 14 = 42.', 'Add the spares: 42 + 6 = 48 brackets.', 'Boxes: 48 ÷ 10 = 4.8.', '4 boxes hold only 40 brackets, which is not enough. Round up to 5 boxes.'],
      calc: { rows: [{ label: 'Brackets', seq: '3 × 14 + 6 =', expect: '48' }, { label: 'Boxes', seq: '48 ÷ 10 =', expect: '4.8' }] },
      answer: '5 boxes (50 brackets).'
    }),
    B.watch('Rounding up or rounding down', 'When you are counting pieces you can cut, round down: a part piece is scrap. When you are counting boxes, lengths or sheets you need to buy, round up: a part box still has to be bought.'),

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
    B.check('312 + 298 + 305 + 301 = ÷ 4 =', '304')
  ]);
};
