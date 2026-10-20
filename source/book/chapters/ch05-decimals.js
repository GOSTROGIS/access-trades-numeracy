/* Chapter 5: Decimals */
module.exports = function (B, L) {
  const F = require('../engine/figs.js')
  const G = require('../engine/figs-ch04.js')
  const fr = L.fr, mx = L.mx, n = L.num
  const R = L.round
  const mm = (v, dp) => n(dp == null ? R(v, 4) : R(v, dp), dp) + ' mm'
  const DSP = (seq, id) => L.CALC.screenText(seq, id).main
  /* a decimal inch to the nearest 1/den as html, with the count of 1/den parts */
  const near = (v, den) => {
    const p = G.parts(v, den)
    return { html: (p.n ? (p.w ? mx(p.w, p.n, p.d) : fr(p.n, p.d)) : String(p.w)) + ' in', k: Math.round((v - Math.floor(v)) * den) }
  }

  /* pipe cross-section: outside diameter, wall. ask: 'id' | 'od' | 'wall' */
  function tube(OD, wall, o) {
    o = o || {}
    const S = 180 / OD, cx = 150, cy = 140, Ro = OD / 2 * S, Ri = (OD / 2 - wall) * S
    let h = F.circle(cx, cy, Ro) + F.circle(cx, cy, Ri, { fill: '#FFFFFF' })
    h += G.dim(cx - Ro, cy, cx + Ro, cy, o.ask === 'od' ? { ask: true } : mm(OD), -(Ro + 28), { s: 14 })
    h += G.dim(cx - Ri, cy, cx + Ri, cy, o.ask === 'id' ? { ask: true } : mm(OD - 2 * wall), 0.01, { s: 14 })
    h += F.callout(cx + (Ri + Ro) / 2 * 0.7071, cy - (Ri + Ro) / 2 * 0.7071, cx + Ro + 50, cy - Ro + 18, o.ask === 'wall' ? 'wall ?' : 'wall ' + mm(wall), { s: 15 })
    return F.svg(cx + Ro + 110, cy + Ro + 18, h, { max: o.max || '3in', vb: [0, cy - Ro - 52, cx + Ro + 110, 2 * Ro + 70] })
  }

  /* ---------- numbers ---------- */
  const cut = [152.4, 76.2, 38.1, 12.7], cutSum = R(cut.reduce((a, b) => a + b, 0), 2)
  const mid = R(120.65 - 25.4 - 38.1, 2)
  const inSum = R(2.375 + 1.25 + 0.625, 3)
  const twelve = R(12 * 152.4, 2)
  const sp = R((1000 - 2 * 62.5) / 4, 2)
  const per = R(152.4 + 3.2, 2), pcs = Math.floor(2438.4 / per), pOff = R(2438.4 - pcs * per, 2)
  const cost1 = R(7.5 * 3.99, 3), inv = R(4 * 12.85 + 2 * 8.49, 2)
  const eighths = [1, 2, 3, 4, 5, 6, 7, 8]
  /* worksheet numbers */
  const wsMid = R(165.1 - 31.75 - 44.45, 2)
  const tubeOD = 60.3, tubeW = 3.9, tubeID = R(tubeOD - 2 * tubeW, 2)
  const wsSp = R((1219.2 - 2 * 50.8) / 6, 2)
  const wsCut = [457.2, 609.6, 304.8], wsOff = R(2438.4 - wsCut.reduce((a, b) => a + b, 0) - 3 * 3.2, 2)
  const rmm = [13, 28.5, 36.5]
  const shim = [0.8, 0.5, 0.25, 1.5], shimSum = R(shim.reduce((a, b) => a + b, 0), 3)
  const dsh = R(6.5 - 1.25 - 2.375, 3)
  const w1 = near(1.71, 16), w2 = near(1.71, 32), w3 = near(75 / 25.4, 16)
  const buy = R(3 * 6 * 4.15 + 12 * 0.38, 2)
  /* Sections 5.8 and 5.9 and Worksheet 5C: numbers and helpers */
  const W = require('../engine/figs-ch01.js')
  const PL = require('../engine/plates.js')
  const d1 = W.divSteps('9.25', 4, 4), d2 = W.divSteps('2', 7, 4), d3 = W.divSteps('5', 12, 4)
  const nails = [['45', '2.64'], ['51', '2.84'], ['57', '2.87'], ['63', '3.25'], ['76', '3.66'], ['82', '3.66'], ['101 or greater', '4.88']]
  /* every diameter is checked against the code text */
  nails.forEach(r => { if (!PL.article('9.23.3.1').text.includes(r[1])) throw new Error('nail diameter not in code text: ' + r[1]) })
  const pr = { n: 24, perM: 2.79, sheets: 12, sheet: 54.99 }
  pr.m = R(pr.n * 2.44, 2)
  pr.lumberRaw = R(pr.m * pr.perM, 4)
  pr.lumber = R(pr.lumberRaw, 2)
  pr.sheetsC = R(pr.sheets * pr.sheet, 2)
  pr.total = R(pr.lumber + pr.sheetsC, 2)

  return L.join([
    B.chapter({
      num: 5, id: 'decimals', title: 'Decimals',
      intro: B.p('A metric drawing might give a size of 76.2 mm, flat bar might cost $3.99 a metre, and a calculator answer might come out as 2.83 in. Each of these is a decimal.',
        'This chapter covers place value after the decimal point, reading a metric rule, rounding, and adding, subtracting, multiplying and dividing decimals. It then links decimals to the fractions in Chapter 4, so you can change a decimal inch to the nearest sixteenth and mark it on a tape.'),
      objectives: ['Read and write decimals using place value', 'Read a metric rule to the nearest 0.5 mm', 'Compare and round decimals', 'Add, subtract, multiply and divide decimals', 'Change fractions to decimals and decimals to fractions', 'Change a decimal inch to the nearest 1/16 or 1/32 in', 'Work with money to the nearest cent'],
      words: ['decimal', 'decimal point', 'decimal place', 'decimal inch'],
      art: F.mmRuler(0, 60, [{ v: 23.5, lab: '23.5 mm' }, { v: 47, lab: '?' }], { ppm: 9, max: '6in' })
    }),

    B.section('Decimals and place value'),
    B.p('A ' + B.term('decimal', 'A number written with a decimal point, such as 2.375. The digits after the point are tenths, hundredths, thousandths and so on.') + ' is a number written with a ' + B.term('decimal point', 'The dot that separates the whole number part of a decimal from the part that is less than one.') + '. The point separates the whole number part from the part that is less than one. Each place after the point is worth one tenth of the place to its left: tenths, then hundredths, then thousandths.'),
    B.table(['Number', 'Tens', 'Ones', '.', 'Tenths', 'Hundredths', 'Thousandths'], [
      ['25.4', '2', '5', '.', '4', '', ''],
      ['76.2', '7', '6', '.', '2', '', ''],
      ['3.175', '', '3', '.', '1', '7', '5'],
      ['0.375', '', '0', '.', '3', '7', '5']
    ], { align: ['', 'c', 'c', 'c', 'c', 'c', 'c'], caption: 'Place value on both sides of the decimal point.' }),
    B.p('Each digit after the point fills one ' + B.term('decimal place', 'One position after the decimal point. 2.375 has three decimal places.') + '. 2.375 has three decimal places. A decimal is a fraction with 10, 100 or 1,000 on the bottom: 0.7 = ' + fr(7, 10) + ', 0.25 = ' + fr(25, 100) + ' and 0.375 = ' + fr(375, '1,000') + '. Write a 0 in front of the point when there is no whole number, as in 0.375. It makes the point easy to see.'),
    B.figure(F.numberLine(0, 1, 0.05, 0.1, [{ v: 0.25, lab: '0.25' }, { v: 0.7, lab: '0.7' }], { w: 620, fmt: v => v.toFixed(1) }), 'Tenths from 0 to 1. 0.25 sits halfway between 0.2 and 0.3, and 0.7 is seven tenths.'),
    B.example({
      title: 'Reading a decimal size',
      q: 'A drawing gives a hole position as 12.07 mm. Read the number in words and say what the 7 is worth.',
      steps: ['The whole number part is 12.', 'The 0 is in the tenths place and the 7 is in the hundredths place.', 'Read it as twelve and seven hundredths. The 7 is worth ' + fr(7, 100) + ', or 0.07.'],
      answer: 'Twelve and seven hundredths millimetres. The 7 is worth 0.07 mm.'
    }),
    B.sub('Reading a metric rule'),
    B.p('On the metric rules in this book, each small line is 1 mm, the longer lines mark every 5 mm, and the numbered lines mark every 10 mm (1 cm). This book reads metric rules to the nearest 0.5 mm. A mark halfway between two millimetre lines reads as .5.'),
    B.figure(F.mmRuler(0, 50, [{ v: 17, lab: 'A' }, { v: 23.5, lab: 'B' }, { v: 41.5, lab: 'C' }], { ppm: 12, max: '6.4in' }), 'A metric rule. Each small space is 1 mm.'),
    B.example({
      title: 'Reading the metric rule',
      q: 'Read marks A, B and C on the rule above.',
      steps: ['A: past the 1 cm line (10 mm) by 7 small spaces: 10 + 7 = 17 mm.', 'B: past the 20 mm line by 3 spaces and then half a space: 23.5 mm.', 'C: past the 40 mm line by 1 space and half a space: 41.5 mm.'],
      answer: 'A = 17 mm, B = 23.5 mm, C = 41.5 mm'
    }),
    B.tryIt([
      { q: 'Write 3.06 in words.', a: 'Three and six hundredths' },
      { q: 'What is the 5 worth in 0.375?', a: '5 thousandths (0.005)' },
      { q: 'How many decimal places does 9.525 have?', a: '3' },
      { q: 'Write ' + fr(9, 10) + ' as a decimal.', a: '0.9' },
      { q: 'Write ' + fr(45, 100) + ' as a decimal.', a: '0.45' },
      { q: 'Write 0.125 as a fraction over 1,000.', a: fr(125, '1,000') }
    ]),

    B.section('Comparing and rounding decimals'),
    B.p('To compare decimals, line up the decimal points and compare the digits from the left. Add zeros on the right so both numbers have the same number of decimal places. Zeros on the right of a decimal do not change its value: 0.38 = 0.380. To compare a 0.375 in plate with a 0.38 in plate, write 0.375 and 0.380. The tenths are the same, and 8 hundredths is more than 7 hundredths, so the 0.38 in plate is thicker, by 0.005 in.'),
    B.watch('More digits is not bigger', '0.375 has more digits than 0.38, but it is the smaller number. Compare place by place from the left, not by counting digits.'),
    B.p('Decimals round the same way as whole numbers. Find the place you are rounding to, look at the digit to its right, and round up if that digit is 5 or more. Then drop every digit after the rounding place.'),
    B.figure(F.numberLine(12.7, 12.8, 0.01, 0.05, [{ v: 12.738, lab: '12.738' }], { w: 600, fmt: v => v.toFixed(2) }), '12.738 is closer to 12.74 than to 12.73, and closer to 12.7 than to 12.8.'),
    B.example({
      title: 'Rounding a size',
      q: 'Round 12.738 mm to one decimal place and to two decimal places.',
      steps: ['One place: the tenths digit is 7. The digit to its right is 3, so the 7 stays: 12.7 mm.', 'Two places: the hundredths digit is 3. The digit to its right is 8, so the 3 goes up to 4: 12.74 mm.'],
      answer: '12.7 mm to one place, 12.74 mm to two places.'
    }),
    B.example({
      title: 'Rounding to the nearest 0.5 mm',
      q: 'A calculation gives 23.38 mm. Round it to the nearest 0.5 mm so you can mark it with a metric rule.',
      steps: ['Double the number: 23.38 × 2 = 46.76.', 'Round to the nearest whole number: 47.', 'Halve it: 47 ÷ 2 = 23.5.'],
      answer: '23.5 mm'
    }),
    B.check('23.38 × 2 =', '46.76'),
    B.tryIt([
      { q: 'Which is bigger, 0.6 or 0.58?', a: '0.6' },
      { q: 'Put in order from smallest: 0.5, 0.125, 0.25.', a: '0.125, 0.25, 0.5' },
      { q: 'Round 6.35 to one decimal place.', a: '6.4' },
      { q: 'Round 9.525 to two decimal places.', a: n(R(9.525, 2), 2) },
      { q: 'Round 3.175 mm to the nearest 0.5 mm.', a: mm(Math.round(3.175 * 2) / 2, 1) },
      { q: 'Round 18.74 mm to the nearest whole millimetre.', a: '19 mm' }
    ]),

    B.section('Adding and subtracting decimals'),
    B.p('To add or subtract decimals, line up the decimal points, one under the other. Fill empty places with zeros, then add or subtract as with whole numbers. The point in the answer goes straight below the points above it.'),
    B.example({
      title: 'Total of a metric cut list',
      q: 'Find the total length of four pieces: ' + cut.map(v => mm(v)).join(', ') + '.',
      steps: ['Line up the points: each number has one decimal place.', 'Tenths: 4 + 2 + 1 + 7 = 14. Write 4, carry 1.', 'Whole numbers: 152 + 76 + 38 + 12 + 1 (carried) = 279.'],
      calc: { seq: cut.join(' + ') + ' =', expect: n(cutSum) },
      answer: mm(cutSum)
    }),
    B.example({
      title: 'Finding a hidden length',
      q: 'A stepped pin is 120.65 mm long overall. Two of its steps are 25.4 mm and 38.1 mm long. How long is the third step?',
      fig: G.shaft([{ len: 25.4, dia: 30 }, { len: mid, dia: 20, ask: true }, { len: 38.1, dia: 25 }], { fmt: v => n(R(v, 2)) + ' mm', w: 460, hmax: 60, ls: 15 }),
      steps: ['Add the known steps: 25.4 + 38.1 = 63.5.', 'Subtract from the overall length: write 63.5 as 63.50 and line up the points.', '120.65 − 63.50 = ' + n(mid) + '.'],
      calc: { seq: '120.65 − 25.4 − 38.1 =', expect: n(mid) },
      answer: mm(mid)
    }),
    B.p('Decimal inches add the same way. Pieces of 2.375 in, 1.25 in and 0.625 in come to 2.375 + 1.250 + 0.625 = ' + n(inSum) + ' in.'),
    B.check('2.375 + 1.25 + 0.625 =', n(inSum)),
    B.tryIt([
      { q: '4.5 + 0.75', a: n(R(4.5 + 0.75, 2)) },
      { q: '12.7 + 6.35 + 3.175', a: n(R(12.7 + 6.35 + 3.175, 3)) },
      { q: '10 − 3.25', a: n(R(10 - 3.25, 2)) },
      { q: '76.2 − 19.05', a: n(R(76.2 - 19.05, 2)) },
      { q: 'A 600 mm bar has pieces of 152.4 mm and 228.6 mm cut off. Ignore the saw cuts. How much is left?', a: mm(R(600 - 152.4 - 228.6, 2)) },
      { q: 'Shims of 0.5 mm, 0.25 mm and 0.1 mm are stacked. How thick is the stack?', a: mm(R(0.5 + 0.25 + 0.1, 2)) }
    ]),

    B.section('Multiplying decimals'),
    B.p('To multiply decimals, multiply as if there were no points. Then count the decimal places in the numbers you multiplied and give the answer that many decimal places. For 1.5 × 0.25: 15 × 25 = 375. 1.5 has one place and 0.25 has two, so the answer has three: 0.375.',
      'Multiplying by 10, 100 or 1,000 moves the point 1, 2 or 3 places to the right: 2.375 × 1,000 = 2,375.'),
    B.example({
      title: 'Twelve equal pieces',
      q: 'You need 12 pieces, each 152.4 mm long. What total length do they use? Ignore the saw cuts.',
      steps: ['Estimate first: 12 × 150 = 1,800.', 'Multiply without the point: 12 × 1,524 = 18,288.', '152.4 has one decimal place, so the answer has one: 1,828.8. It is close to the estimate.'],
      calc: { seq: '12 × 152.4 =', expect: n(twelve), say: 'The TI-30Xa shows ' + DSP('12 × 152.4 =', 'ti30xa') + '. The Sharp shows ' + DSP('12 × 152.4 =', 'el531xt') + ', with a small mark between the thousands and the hundreds.' },
      answer: mm(twelve)
    }),
    B.example({
      title: 'Inches to millimetres',
      q: 'A drawing calls for a ' + fr(3, 8) + ' in plate. How thick is that in millimetres? Round to the nearest 0.5 mm.',
      steps: ['There are exactly 25.4 mm in 1 in. Chapter 7 covers unit conversion.', fr(3, 8) + ' in = 0.375 in. 0.375 × 25.4 = 9.525 mm.', 'To the nearest 0.5 mm: 9.525 × 2 = 19.05, which rounds to 19, and 19 ÷ 2 = 9.5.'],
      calc: { seq: '3 ÷ 8 × 25.4 =', expect: '9.525' },
      answer: '9.525 mm, or 9.5 mm to the nearest 0.5 mm.'
    }),
    B.tryIt([
      { q: '0.5 × 0.5', a: '0.25' },
      { q: '3 × 2.375', a: n(R(3 * 2.375, 3)) },
      { q: '1.2 × 0.15', a: n(R(1.2 * 0.15, 3)) },
      { q: '4.75 × 100', a: '475' },
      { q: '8 pieces at 76.2 mm. Total length?', a: mm(R(8 * 76.2, 2)) },
      { q: 'Change ' + fr(5, 8) + ' in (0.625 in) to millimetres.', a: mm(R(0.625 * 25.4, 4)) }
    ]),

    B.section('Dividing decimals'),
    B.p('When you divide by a whole number, divide as usual and keep the point in the same place in the answer. When you divide by a decimal, move the point to the right in both numbers until the number you divide by is a whole number. Dividing by 10, 100 or 1,000 moves the point 1, 2 or 3 places to the left: 254 ÷ 100 = 2.54.'),
    B.p('When a division does not come out even, keep going past the last digit: write zeros after the point and bring them down. Section 5.8 shows this by hand, and how to round the answer to hundredths or thousandths.'),
    B.example({
      title: 'Dividing by a decimal',
      q: 'How many 0.25 m lengths can be cut from a 7.5 m bar? Ignore the saw cuts.',
      steps: ['0.25 has two decimal places, so move the point two places to the right in both numbers: 7.5 ÷ 0.25 becomes 750 ÷ 25 = 30.'],
      answer: '30 lengths'
    }),
    B.check('7.5 ÷ 0.25 =', '30'),
    B.example({
      title: 'Pieces with saw cuts',
      q: 'How many 152.4 mm pieces can you cut from a 2,438.4 mm bar? You make one cut for each piece and the kerf is 3.2 mm. How long is the offcut?',
      steps: ['Each piece uses its length plus one saw cut: 152.4 + 3.2 = ' + n(per) + ' mm.', '2,438.4 ÷ ' + n(per) + ' = 15.67. Only whole pieces count: ' + pcs + ' pieces.', pcs + ' pieces use ' + pcs + ' × ' + n(per) + ' = ' + n(R(pcs * per, 2)) + ' mm. The offcut is 2,438.4 − ' + n(R(pcs * per, 2)) + ' = ' + n(pOff) + ' mm.'],
      calc: { rows: [{ label: 'Pieces', seq: '2438.4 ÷ ' + per + ' =', expect: '15.67' }, { label: 'Offcut', seq: '2438.4 − ' + pcs + ' × ' + per + ' =', expect: n(pOff) }] },
      answer: pcs + ' pieces, with an offcut of ' + mm(pOff) + '.'
    }),
    B.tryIt([
      { q: '9.6 ÷ 4', a: n(R(9.6 / 4, 2)) },
      { q: '1.5 ÷ 0.3', a: '5' },
      { q: '25.4 ÷ 0.5', a: n(R(25.4 / 0.5, 2)) },
      { q: '635 ÷ 100', a: '6.35' },
      { q: 'A 914.4 mm bar is cut into 6 equal pieces. Ignore the saw cuts. How long is each piece?', a: mm(R(914.4 / 6, 2)) },
      { q: '100 mm split into 3 equal parts. How long is each, to two decimal places?', a: mm(R(100 / 3, 2), 2) }
    ]),

    B.section('Fractions and decimals'),
    B.p('The fraction bar means divide, so to change a fraction to a decimal, divide the numerator by the denominator: ' + fr(3, 8) + ' = 3 ÷ 8 = 0.375. An inch size written this way is a ' + B.term('decimal inch', 'An inch measurement written as a decimal, such as 0.375 in for 3/8 in.') + ': 0.375 in is ' + fr(3, 8) + ' in. For a mixed number, change only the fraction part and keep the whole number: ' + mx(2, 5, 8) + ' in = 2.625 in.'),
    B.calc({ title: 'Fraction to decimal', rows: [{ label: fr(3, 8) + ' by dividing', seq: '3 ÷ 8 =', expect: '0.375' }, { label: mx(2, 5, 8) + ' with the fraction key', seq: '2 ab/c 5 ab/c 8 F⇄D', expect: '2.625' }] }),
    B.raw('<div class="keep">' + B.table(['Fraction', 'Decimal inch', 'Millimetres'], eighths.map(k => [L.frac(k, 8) + ' in', n(k / 8) + ' in', n(R(k / 8 * 25.4, 3)) + ' mm']), { align: ['c', 'c', 'c'], caption: 'Eighths of an inch as decimal inches and millimetres. All of these are exact.' }) + '</div>'),
    B.p('To change a decimal with three places or fewer to a fraction, write it over 10, 100 or 1,000 and put it in ' + B.term('lowest terms') + ': 0.375 = ' + fr(375, '1,000') + ' = ' + fr(3, 8) + ' (divide both by 125). The fraction key does this for you (2nd F⇄D on the TI-30Xa, a b/c on the Sharp), as Chapter 4 showed.'),
    B.p('Some fractions never end as a decimal. ' + fr(2, 3) + ' = 0.666… and ' + fr(5, 12) + ' = 0.4166… go on forever. Section 5.8 divides them by hand and rounds them to three decimal places.'),
    B.sub('Decimal inches to the nearest sixteenth'),
    B.p('A tape is marked in sixteenths, but a calculator gives decimal inches such as 2.83 in. To mark the length, change the decimal part to the nearest ' + fr(1, 16) + ' in. For finer work on a steel rule, use the nearest ' + fr(1, 32) + ' in. Always say which one you used.'),
    B.how(['Keep the whole number of inches.', 'Multiply the decimal part by 16 (or by 32).', 'Round to the nearest whole number. That is the number of sixteenths (or 32nds).', 'Write it over 16 (or 32) and put it in lowest terms.']),
    B.figure(G.rule({ from: 2.5, to: 3, den: 32, ppi: 1180, marks: [{ v: 2.83, lab: '2.83″' }], max: '6.2in', labS: 15 }), 'The half inch from ' + mx(2, 1, 2) + ' in to 3 in, marked in 32nds. 2.83 in lies between the ' + mx(2, 26, 32) + ' line and the ' + mx(2, 27, 32) + ' line, a little closer to ' + mx(2, 27, 32) + '.'),
    B.example({
      title: 'Marking 2.83 in on a tape',
      q: 'A calculation gives 2.83 in. Change it to the nearest ' + fr(1, 16) + ' in, and to the nearest ' + fr(1, 32) + ' in.',
      steps: ['Keep the 2 inches. The decimal part is 0.83.', 'Nearest ' + fr(1, 16) + ': 0.83 × 16 = 13.28, which rounds to 13. That gives ' + fr(13, 16) + ', so ' + mx(2, 13, 16) + ' in.', 'Nearest ' + fr(1, 32) + ': 0.83 × 32 = 26.56, which rounds to 27. That gives ' + fr(27, 32) + ', so ' + mx(2, 27, 32) + ' in.'],
      calc: { rows: [{ label: 'Sixteenths', seq: '0.83 × 16 =', expect: '13.28' }, { label: '32nds', seq: '0.83 × 32 =', expect: '26.56' }] },
      answer: mx(2, 13, 16) + ' in to the nearest ' + fr(1, 16) + ' in, or ' + mx(2, 27, 32) + ' in to the nearest ' + fr(1, 32) + ' in.'
    }),
    B.example({
      title: 'Millimetres to the nearest sixteenth',
      q: 'A metric part is 50 mm long. What is that to the nearest ' + fr(1, 16) + ' in?',
      steps: ['Change to inches by dividing by 25.4, and multiply by 16 in the same line to count sixteenths: 50 ÷ 25.4 × 16 = 31.496 (to three places).', 'Round to the nearest whole number: 31.496 is less than 31.5, so 31 sixteenths.', fr(31, 16) + ' = ' + mx(1, 15, 16) + '.'],
      calc: { seq: '50 ÷ 25.4 × 16 =', expect: '31.496', say: 'The display shows 31.49606299. That is just under 31.5, so it rounds down to 31 sixteenths.' },
      answer: mx(1, 15, 16) + ' in to the nearest ' + fr(1, 16) + ' in.'
    }),
    B.watch('The fraction key does not round to the tape', 'The fraction key gives the exact fraction, not the nearest sixteenth. On the TI-30Xa, 0.83 2nd F⇄D shows ' + DSP('0.83 F⇄D', 'ti30xa') + '. On the Sharp, 0.83 = a b/c shows ' + DSP('0.83 F⇄D', 'el531xt') + '. Both mean ' + fr(83, 100) + ', not a tape reading. Use the multiply-by-16 method instead.'),
    B.calc({ title: 'The fraction key on 0.83', seq: '0.83 F⇄D', expect: '0.83' }),
    B.tryIt([
      { q: 'Change ' + fr(3, 4) + ' to a decimal.', a: '0.75' },
      { q: 'Change ' + mx(1, 7, 8) + ' in to a decimal inch.', a: '1.875 in' },
      { q: 'Change 0.625 to a fraction in lowest terms.', a: fr(5, 8) },
      { q: 'Change 3.4 in to the nearest ' + fr(1, 16) + ' in.', a: near(3.4, 16).html + ' (0.4 × 16 = 6.4, rounds to 6)' },
      { q: 'Change 0.59 in to the nearest ' + fr(1, 32) + ' in.', a: near(0.59, 32).html + ' (0.59 × 32 = 18.88, rounds to 19)' },
      { q: 'Change 100 mm to the nearest ' + fr(1, 16) + ' in.', a: near(100 / 25.4, 16).html + ' (100 ÷ 25.4 × 16 = ' + n(R(100 / 25.4 * 16, 2), 2) + ', rounds to ' + Math.round(100 / 25.4 * 16) + ')' }
    ]),

    B.section('Money'),
    B.p('Money is written with two decimal places: dollars, then cents. $3.99 is 3 dollars and 99 cents. Round money answers to the nearest cent, which is two decimal places. The calculator does not show zeros at the end of a decimal: 4 × 12.85 shows 51.4, which means $51.40. Always write money with two decimal places.'),
    B.check('4 × 12.85 =', '51.4'),
    B.p('Flat bar at $3.99 per metre: 7.5 m cost 7.5 × 3.99 = $29.925. The third decimal digit is 5, so round up to the nearest cent: $29.93.'),
    B.check('7.5 × 3.99 =', '29.925'),
    B.example({
      title: 'Adding up an order',
      q: 'An order has 4 boxes of bolts at $12.85 a box and 2 cans of cutting oil at $8.49 a can. What is the total?',
      steps: ['Bolts: 4 × 12.85 = 51.40.', 'Oil: 2 × 8.49 = 16.98.', 'Total: 51.40 + 16.98 = ' + n(inv, 2) + '.'],
      calc: { seq: '4 × 12.85 + 2 × 8.49 =', expect: n(inv, 2), say: 'The calculator multiplies before it adds, so no brackets are needed. Chapter 3 explains why. The display shows ' + DSP('4 × 12.85 + 2 × 8.49 =', 'ti30xa') + ', which is $' + n(inv, 2) + '.' },
      answer: '$' + n(inv, 2)
    }),
    B.tryIt([
      { q: 'Round $14.736 to the nearest cent.', a: '$14.74' },
      { q: '3 m of pipe at $6.25 per metre. Cost?', a: '$' + n(R(3 * 6.25, 2), 2) },
      { q: '12 washers at $0.18 each. Cost?', a: '$' + n(R(12 * 0.18, 2), 2) },
      { q: '2.4 m of angle at $5.49 per metre. Cost, to the nearest cent?', a: '$' + n(R(2.4 * 5.49, 2), 2) },
      { q: 'You pay for a $37.65 order with $50. How much change?', a: '$' + n(R(50 - 37.65, 2), 2) },
      { q: 'Five workers split a $68.40 lunch bill equally. How much each?', a: '$' + n(R(68.4 / 5, 2), 2) }
    ]),

    B.section('Dividing to thousandths and rounding'),
    B.p('Many divisions do not come out even. To carry on, divide as usual and write the point in the answer straight above the point in the number you are dividing. When you run out of digits, write a 0 at the end of the number and bring it down. Keep going until you have one more decimal place than you need, then round.'),
    B.how(['Divide the whole number part as usual.', 'Write the point in the answer above the point in the number.', 'Write a 0 after the last digit, bring it down and divide again. Repeat.', 'Stop one place past the place you round to. Then round.']),
    B.example({
      title: 'Dividing past the last digit',
      q: 'A 9.25 m length of trim is cut into 4 equal pieces. Ignore the saw cuts. How long is each piece? Round to two and to three decimal places.',
      steps: d1.steps.concat(['The answer is ' + d1.q + ' m. It ends here, because the remainder is 0.', 'To two decimal places: the digit after the hundredths is 2, so ' + d1.q + ' rounds to ' + n(R(9.25 / 4, 2), 2) + '. To three places: the digit after the thousandths is 5, so it rounds up to ' + n(R(9.25 / 4, 3), 3) + '.']),
      calc: { seq: '9.25 ÷ 4 =', expect: d1.q },
      answer: n(R(9.25 / 4, 2), 2) + ' m to two decimal places, ' + n(R(9.25 / 4, 3), 3) + ' m to three. Three decimal places of a metre is the nearest millimetre: ' + n(R(9.25 / 4 * 1000, 0)) + ' mm.'
    }),
    B.example({
      title: 'A division that never ends',
      q: 'A 2 kg bag of grout is shared equally among 7 forms. How much goes in each form? Round to three decimal places.',
      steps: d2.steps.concat(['The digits keep coming, so stop at four places: ' + d2.q + '.', 'The fourth digit is 7, which is 5 or more, so the third digit goes up: ' + n(R(2 / 7, 3), 3) + '.']),
      calc: { seq: '2 ÷ 7 =', expect: n(R(2 / 7, 3), 3), say: 'The display shows ' + DSP('2 ÷ 7 =', 'ti30xa') + '. Round it the same way.' },
      answer: n(R(2 / 7, 3), 3) + ' kg in each form, to three decimal places.'
    }),
    B.example({
      title: 'A fraction that does not end',
      q: 'Change ' + fr(5, 12) + ' to a decimal by hand. Round to three decimal places.',
      steps: d3.steps.concat(['The 6 repeats forever: ' + d3.q + '…', 'To three places, look at the fourth digit, 6. Round up: ' + n(R(5 / 12, 3), 3) + '.']),
      calc: { seq: '5 ÷ 12 =', expect: n(R(5 / 12, 3), 3) },
      answer: fr(5, 12) + ' ≈ ' + n(R(5 / 12, 3), 3) + '. The ≈ sign means "is about".'
    }),
    B.watch('Carry one digit past the place', 'To round to thousandths you need the digit after the thousandths. Divide to four decimal places, round to three, and write only the three.'),
    B.tryIt([
      { q: '7 ÷ 8 by hand', a: n(7 / 8) },
      { q: '10 ÷ 3, to three decimal places', a: n(R(10 / 3, 3), 3) },
      { q: '1 ÷ 6, to two decimal places', a: n(R(1 / 6, 2), 2) },
      { q: '22 ÷ 7, to three decimal places', a: n(R(22 / 7, 3), 3) },
      { q: '4.5 ÷ 7, to three decimal places', a: n(R(4.5 / 7, 3), 3) },
      { q: 'Change ' + fr(7, 9) + ' to a decimal, to three decimal places.', a: n(R(7 / 9, 3), 3) }
    ]),

    B.section('Carpentry: decimal feet and pricing'),
    B.p('A builder’s plans or a calculator may give lengths in decimal feet, such as 12.75 ft. A tape reads feet, inches and sixteenths. A foot has 12 inches, so to change the decimal part of a foot to inches, multiply it by 12. To go the other way, divide the inches by 12.'),
    B.example({
      title: 'Decimal feet to a tape reading',
      q: 'A rafter calculation gives 8.6 ft. What do you mark on the tape, to the nearest ' + fr(1, 16) + ' in?',
      steps: ['Keep the 8 feet. The decimal part is 0.6 ft.', '0.6 × 12 = ' + n(R(0.6 * 12, 2)) + ' in. Keep the 7 inches.', 'Change the 0.2 in to sixteenths: 0.2 × 16 = ' + n(R(0.2 * 16, 2)) + ', which rounds to 3.'],
      calc: { rows: [{ label: 'Inches', seq: '0.6 × 12 =', expect: '7.2' }, { label: 'Sixteenths', seq: '0.2 × 16 =', expect: '3.2' }] },
      answer: '8 ft ' + mx(7, 3, 16) + ' in'
    }),
    B.example({
      title: 'Feet and inches to decimal feet',
      q: 'A wall is 14 ft 5 in long. Write it in decimal feet, to three decimal places.',
      steps: ['5 in is ' + fr(5, 12) + ' ft. Divide: 5 ÷ 12 = 0.4166…', 'Round to three places: 0.417.', 'Add the whole feet: 14 + 0.417 = 14.417.'],
      calc: { seq: '14 + 5 ÷ 12 =', expect: '14.417' },
      answer: '14.417 ft'
    }),
    B.p('Building code values are metric decimals. Article 9.23.3.1, Sentence (2) says nails used for the framing and sheathing nailing tables shall have a diameter not less than that stated in Table 9.23.3.1. The table gives the minimum diameter for each minimum nail length (' + PL.cite('9.23.3.1') + ').'),
    PL.figure(B, '9.23.3.1', { crop: [55, 208, 760, 330], width: '6.2in', caption: 'Table 9.23.3.1 drawn to scale. Left: the minimum length of each nail. Right: its minimum diameter in millimetres, with decimal inches in brackets.' }),
    B.raw('<div class="keep">' + B.table(['Minimum length of nails, mm', 'Minimum diameter of nails, mm'], nails.map(r => [r[0], r[1]]), { align: ['c', 'c'], caption: 'Table 9.23.3.1, Diameter of Nails. ' + PL.cite('9.23.3.1') + '.' }) + '</div>'),
    B.example({
      title: 'Comparing nail diameters',
      q: 'Use Table 5.' + B.tab + '. By how much is the minimum diameter of a 76 mm nail larger than that of a 63 mm nail? Which two lengths have the closest diameters?',
      steps: ['3.66 − 3.25 = ' + n(R(3.66 - 3.25, 2), 2) + ' mm.', 'Line up the points and compare each diameter with the next: 2.84 and 2.87 differ by only ' + n(R(2.87 - 2.84, 2), 2) + ' mm. The 76 mm and 82 mm nails have the same diameter, 3.66 mm.'],
      answer: n(R(3.66 - 3.25, 2), 2) + ' mm larger. The 51 mm and 57 mm nails have the closest different diameters, ' + n(R(2.87 - 2.84, 2), 2) + ' mm apart.'
    }),
    B.check('3.66 − 3.25 =', '0.41'),
    B.example({
      title: 'Pricing lumber and sheets',
      q: 'An order has ' + pr.n + ' pieces of 38 × 89 lumber, each 2.44 m long, at $' + n(pr.perM, 2) + ' per metre, and ' + pr.sheets + ' sheets of sheathing at $' + n(pr.sheet, 2) + ' each. The prices are from the supplier’s quote. Find the total before tax.',
      steps: ['Metres of lumber: ' + pr.n + ' × 2.44 = ' + n(pr.m) + ' m.', 'Lumber: ' + n(pr.m) + ' × ' + n(pr.perM, 2) + ' = $' + n(pr.lumberRaw) + ', which rounds to $' + n(pr.lumber, 2) + '.', 'Sheets: ' + pr.sheets + ' × ' + n(pr.sheet, 2) + ' = $' + n(pr.sheetsC, 2) + '.', 'Total: ' + n(pr.lumber, 2) + ' + ' + n(pr.sheetsC, 2) + ' = $' + n(pr.total, 2) + '.'],
      calc: { rows: [{ label: 'Lumber', seq: pr.n + ' × 2.44 × ' + pr.perM + ' =', expect: n(pr.lumber, 2) }, { label: 'Sheets', seq: pr.sheets + ' × ' + pr.sheet + ' =', expect: n(pr.sheetsC, 2) }] },
      answer: '$' + n(pr.total, 2) + ' before tax.'
    }),
    B.tryIt([
      { q: 'Change 10.25 ft to feet and inches.', a: '10 ft 3 in' },
      { q: 'Change 6 ft 9 in to decimal feet.', a: '6.75 ft' },
      { q: 'Change 3.4 ft to feet and inches, to the nearest ' + fr(1, 16) + ' in.', a: '3 ft ' + mx(4, 13, 16) + ' in (0.4 × 12 = 4.8 in, 0.8 × 16 = 12.8, rounds to 13)' },
      { q: 'Change 9 ft 7 in to decimal feet, to three decimal places.', a: n(R(9 + 7 / 12, 3), 3) + ' ft' },
      { q: 'In Table 5.' + B.tab + ', what is the minimum diameter of a 57 mm nail?', a: '2.87 mm' },
      { q: '16 studs at $4.87 each. Cost?', a: '$' + n(R(16 * 4.87, 2), 2) }
    ]),
    B.check('9 + 7 ÷ 12 =', n(R(9 + 7 / 12, 3), 3)), B.check('16 × 4.87 =', n(R(16 * 4.87, 2), 2)),

    B.worksheet({ title: 'Decimal parts on the canvas', sub: 'Metric parts with decimal sizes. Find every red ?', intro: 'Line up the decimal points when you add or subtract. Estimate first, then check with your calculator.' }),
    B.prob({ q: 'The pin is 165.1 mm long overall. Find the length of the middle step.', canvas: G.shaft([{ len: 31.75, dia: 30 }, { len: wsMid, dia: 22, ask: true }, { len: 44.45, dia: 26 }], { fmt: v => n(R(v, 2)) + ' mm', totalLab: '165.1 mm', w: 560, hmax: 46, ls: 15, max: '4.8in' }), a: mm(wsMid), work: '165.1 − 31.75 − 44.45 = ' + n(wsMid), lines: 2 }),
    B.prob({ q: 'Read marks A, B and C to the nearest 0.5 mm.', canvas: F.mmRuler(0, 50, rmm.map((v, i) => ({ v, lab: 'ABC'[i] })), { ppm: 12, max: '5.6in' }).replace(/font-size="10"([^>]*>cm<)/, 'font-size="12.5"$1'), a: rmm.map((v, i) => 'ABC'[i] + ' = ' + n(v) + ' mm').join(', '), lines: 1 }),
    B.prob({ q: 'Three pieces are cut from a 2,438.4 mm bar. You make 3 cuts and the kerf is 3.2 mm. How long is the offcut?', canvas: G.cutBar(wsCut.map(v => ({ len: v })), { total: 2438.4, askRest: true, kerf: 3.2, kerfLab: 'kerf 3.2 mm', ks: 14, s: 15, fmt: v => n(R(v, 2)) + ' mm', max: '5.4in' }), a: mm(wsOff), work: '2,438.4 − (457.2 + 609.6 + 304.8) − 3 × 3.2 = ' + n(wsOff), lines: 2 }),
    B.grid2(
      B.prob({ q: 'A pipe has an outside diameter of ' + mm(tubeOD) + ' and a wall ' + mm(tubeW) + ' thick. Find the inside diameter.', canvas: tube(tubeOD, tubeW, { ask: 'id', max: '2.5in' }), a: mm(tubeID), work: n(tubeOD) + ' − 2 × ' + n(tubeW) + ' = ' + n(tubeID), lines: 2 }),
      B.prob({ q: 'Find the distance around the plate by adding its four sides.', canvas: B.shape('rectangle', { l: 152.4, w: 76.2 }, { units: 'mm', width: '3in' }), a: mm(R(2 * (152.4 + 76.2), 2)), work: '152.4 + 76.2 + 152.4 + 76.2', lines: 2 })),
    B.prob({ q: 'Shims of ' + shim.map(v => mm(v)).join(', ') + ' are stacked. How thick is the stack? Is it more or less than 3 mm?', a: mm(shimSum) + '. It is ' + (shimSum > 3 ? 'more' : 'less') + ' than 3 mm.', lines: 2 }),

    B.prob({ q: 'Seven holes are evenly spaced along a 1,219.2 mm plate. The end holes are 50.8 mm from the ends. Find the spacing to two decimal places.', canvas: G.holePlate(1219.2, 50.8, 7, { ask: 'space', fmt: v => n(R(v, 2)) + ' mm', h: 36, ls: 15, max: '4.8in' }), a: mm(wsSp, 2), work: '(1,219.2 − 2 × 50.8) ÷ 6 = 1,117.6 ÷ 6 = ' + n(wsSp, 2), lines: 2 }),

    B.worksheet({ title: 'Decimal inches and money', sub: 'Change decimal inches to tape fractions and work out costs', intro: 'For each tape reading, say whether you rounded to the nearest 1/16 in or the nearest 1/32 in. Round money to the nearest cent.' }),
    B.grid2(
      B.prob({ q: 'Write each size on the plate as a fraction in lowest terms.', canvas: G.plate(4.375, 2.625, { fmt: v => n(v) + '″', size: 240, max: '2.7in' }), a: '4.375 in = ' + mx(4, 3, 8) + ' in, 2.625 in = ' + mx(2, 5, 8) + ' in', lines: 2 }),
      B.prob({ q: 'The pin is 6.5 in long overall. Find the missing step as a decimal inch, then as a fraction.', canvas: G.shaft([{ len: 1.25, dia: 1 }, { len: 2.375, dia: 1.4 }, { len: dsh, dia: 0.8, ask: true }], { fmt: v => n(v) + '″', totalLab: '6.5″', w: 420, hmax: 50, ls: 17, max: '2.7in' }), a: n(dsh) + ' in = ' + near(dsh, 16).html, work: '6.5 − 1.25 − 2.375 = ' + n(dsh), lines: 2 })),
    B.grid2(
      B.prob({ q: 'Change 1.71 in to the nearest ' + fr(1, 16) + ' in and to the nearest ' + fr(1, 32) + ' in.', a: w1.html + ' (0.71 × 16 = 11.36, rounds to 11) and ' + w2.html + ' (0.71 × 32 = 22.72, rounds to 23)', lines: 2 }),
      B.prob({ q: 'A metric part is 75 mm long. What is that to the nearest ' + fr(1, 16) + ' in?', a: w3.html, work: '75 ÷ 25.4 × 16 = ' + n(R(75 / 25.4 * 16, 2), 2) + ', rounds to ' + Math.round(75 / 25.4 * 16), lines: 2 })),
    B.grid2(
      B.prob({ q: 'Change ' + fr(5, 16) + ' in to millimetres, to two decimal places.', a: mm(R(5 / 16 * 25.4, 2), 2), work: '5 ÷ 16 × 25.4 = 7.9375', lines: 2 }),
      B.prob({ q: 'Three 6 m lengths of flat bar at $4.15 per metre and 12 bolts at $0.38 each. What is the total cost?', a: '$' + n(buy, 2), work: '3 × 6 × 4.15 + 12 × 0.38 = 74.70 + 4.56', lines: 2 })),
    B.prob({ q: 'Change one value: a cut list has 6 pieces at 2.375 in. Find the total length as a decimal inch and as a fraction. If each piece is cut 0.125 in shorter, what is the new total?', a: n(R(6 * 2.375, 3)) + ' in = ' + near(6 * 2.375, 16).html + '. New total ' + n(R(6 * 2.25, 3)) + ' in = ' + near(6 * 2.25, 16).html + '.', lines: 2 }),
    B.check('3 × 6 × 4.15 + 12 × 0.38 =', n(buy, 2)),
    B.check('165.1 − 31.75 − 44.45 =', n(wsMid)),
    B.check('0.71 × 16 =', '11.36'),
    B.check('0.71 × 32 =', '22.72'),

    B.worksheet({ title: 'Carpentry: decimal feet and pricing', sub: 'Feet, inches and decimal feet, lumber prices and nail sizes', intro: 'A foot has 12 inches. Round tape readings to the nearest 1/16 in and money to the nearest cent. Prices are given in each problem. Code values come from Table 5.' + B.tab + '.' }),
    B.grid2(
      B.prob({ q: 'Change 11.5 ft to feet and inches.', a: '11 ft 6 in', work: '0.5 × 12 = 6', lines: 2 }),
      B.prob({ q: 'Change 7 ft 8 in to decimal feet, to three decimal places.', a: n(R(7 + 8 / 12, 3), 3) + ' ft', work: '8 ÷ 12 = 0.6666…, rounds to 0.667', lines: 2 })),
    B.grid2(
      B.prob({ q: 'A plan gives 5.3 ft. What is that in feet and inches, to the nearest ' + fr(1, 16) + ' in?', a: '5 ft ' + mx(3, 5, 8) + ' in', work: '0.3 × 12 = 3.6 in. 0.6 × 16 = 9.6, rounds to 10. ' + fr(10, 16) + ' = ' + fr(5, 8), lines: 2 }),
      B.prob({ q: 'Divide by hand: 15 ft of trim is cut into 7 equal pieces. Ignore the saw cuts. How long is each piece, to three decimal places?', a: n(R(15 / 7, 3), 3) + ' ft', work: '15 ÷ 7 = 2.1428…, rounds to 2.143', lines: 2 })),
    B.prob({ q: 'A 16 ft board is cut into 3 equal pieces. Ignore the saw cuts. Find each piece in decimal feet to three decimal places, then in feet and inches.', canvas: G.cutBar([1, 2, 3].map(() => ({ len: 16 / 3, ask: true })), { totalLab: '16 ft', fmt: v => n(R(v, 3)) + ' ft', s: 15, max: '5.4in' }), a: n(R(16 / 3, 3), 3) + ' ft = 5 ft 4 in', work: '16 ÷ 3 = 5.333… 0.333… × 12 = 4 in', lines: 2 }),
    B.prob({ q: 'An order has 30 studs at $4.87 each and 8 sheets at $62.45 each. What is the total before tax?', a: '$' + n(R(30 * 4.87 + 8 * 62.45, 2), 2), work: '30 × 4.87 = 146.10. 8 × 62.45 = 499.60.', lines: 3 }),
    B.prob({ q: 'Baseboard runs around a room with walls of 3.66 m, 2.44 m, 3.66 m and 2.44 m. Ignore the door. Baseboard costs $3.15 per metre. How many metres, and what does it cost?', canvas: B.shape('rectangle', { l: 3.66, w: 2.44 }, { units: 'm', width: '2.2in' }), a: n(R(2 * (3.66 + 2.44), 2)) + ' m, $' + n(R(2 * (3.66 + 2.44) * 3.15, 2), 2), work: '3.66 + 2.44 + 3.66 + 2.44 = 12.2 m. 12.2 × 3.15', lines: 3 }),
    B.prob({ q: 'Use Table 5.' + B.tab + '. Write the minimum diameters of the 45 mm, 63 mm and 101 mm nails from smallest to largest. How much bigger is the largest than the smallest?', a: '2.64 mm, 3.25 mm, 4.88 mm. ' + n(R(4.88 - 2.64, 2), 2) + ' mm bigger.', lines: 2 }),
    B.check('7 + 8 ÷ 12 =', n(R(7 + 8 / 12, 3), 3)), B.check('15 ÷ 7 =', n(R(15 / 7, 3), 3)), B.check('30 × 4.87 + 8 × 62.45 =', n(R(30 * 4.87 + 8 * 62.45, 2), 2)), B.check('2 × ( 3.66 + 2.44 ) × 3.15 =', n(R(2 * (3.66 + 2.44) * 3.15, 2), 2))
  ])
}
