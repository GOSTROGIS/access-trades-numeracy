/* Chapter 4: Fractions */
module.exports = function (B, L) {
  const F = require('../engine/figs.js')
  const G = require('../engine/figs-ch04.js')
  const fr = L.fr, mx = L.mx

  /* exact fractions as [numerator, denominator] in lowest terms */
  function nr(n, d) {
    const g = L.gcd(n, d) || 1
    return [n / g, d / g]
  }
  const M = (w, n, d) => nr(w * (d || 1) + (n || 0), d || 1)
  const add = (...xs) => xs.reduce((a, b) => nr(a[0] * b[1] + b[0] * a[1], a[1] * b[1]))
  const sub = (a, b) => nr(a[0] * b[1] - b[0] * a[1], a[1] * b[1])
  const mul = (a, b) => nr(a[0] * b[0], a[1] * b[1])
  const dv = (a, b) => nr(a[0] * b[1], a[1] * b[0])
  const val = a => a[0] / a[1]
  const H = a => L.frac(a[0], a[1])
  const IN = a => H(a) + ' in'
  /* a reading in inches (decimal) to lowest-terms html at 1/den */
  const RD = (v, den) => {
    const p = G.parts(v, den)
    return (p.n ? (p.w ? mx(p.w, p.n, p.d) : fr(p.n, p.d)) : String(p.w)) + ' in'
  }
  const DSP = (seq, id) => L.CALC.screenText(seq, id).main
  const shows = (seq, a) => 'The TI-30Xa shows ' + DSP(seq, 'ti30xa') + ' and the Sharp shows ' + DSP(seq, 'el531xt') + '. Both mean ' + H(a) + '.'
  const inch = v => ({ inch: v, den: 64 })

  /* side view of plates stacked on each other, thicknesses in inches. Each layer gets a short vertical
     dimension with its label to the right, and the total is dimensioned on the left */
  function stack(th, o) {
    o = o || {}
    const S = o.S || 120, x0 = 96, w = o.w || 120, tot = th.reduce((a, b) => a + b, 0)
    const xd = x0 + w + 22
    let h = '', y = 22 + tot * S
    th.forEach((t, i) => {
      const y2 = y - t * S
      h += F.rect(x0, y2, w, t * S, { fill: i % 2 ? F.C.fill2 : F.C.fill })
      h += F.line(x0 + w + 3, y, xd + 6, y, { c: F.C.dim, w: 1.1 }) + F.line(x0 + w + 3, y2, xd + 6, y2, { c: F.C.dim, w: 1.1 })
      h += F.line(xd, y, xd, y2, { c: F.C.dim, w: 1.2 }) + F.arrowHead(xd, y2, -Math.PI / 2) + F.arrowHead(xd, y, Math.PI / 2)
      h += G.lab(xd + 34, (y + y2) / 2 + 7, inch(t), { s: 16 })
      y = y2
    })
    h += G.dim(x0, 22 + tot * S, x0, 22, o.askTotal ? { ask: true } : inch(tot), -44, { s: 16 })
    return F.svg(xd + 70, tot * S + 44, h, { max: o.max || '3in' })
  }

  /* ---------- numbers used in the chapter ---------- */
  const cl = [M(12, 3, 4), M(8, 5, 8), M(15, 1, 2)], clSum = add(...cl)
  const stk = [nr(3, 8), nr(1, 4), nr(3, 16)], stkSum = add(...stk)
  const off1 = sub(M(48), M(29, 5, 8))
  const bor = sub(M(5, 1, 4), M(2, 7, 16))
  const six = mul(M(2, 3, 8), M(6))
  const kerfOff = sub(sub(M(48), mul(M(4), M(11, 3, 4))), mul(M(4), nr(1, 8)))
  const eq4 = dv(M(30, 1, 2), M(4))
  const spc = dv(M(24), M(1, 3, 4)), spcN = Math.floor(val(spc)), spcOff = sub(M(24), mul(M(spcN), M(1, 3, 4)))
  const big = (a, b) => val(a) > val(b) ? a : b
  const order = list => list.slice().sort((a, b) => val(a) - val(b)).map(H).join(', ')
  const tryRule = [7 / 16, 1.25, 1 + 15 / 16, 2.625, 3 + 3 / 16, 3.875]
  /* worksheet numbers */
  const wsA = [13 / 16, 1.375, 2 + 15 / 16]
  const wsCut = [M(24, 3, 8), M(31, 1, 2), M(18, 3, 4)], wsOff = sub(M(96), add(...wsCut))
  const wsMid = sub(sub(M(40), M(12, 5, 8)), M(15, 7, 16))
  const hid = sub(sub(M(10, 1, 2), M(3, 3, 8)), M(4, 3, 4))
  const sh4 = [M(2, 1, 4), M(3, 5, 8), M(1, 7, 8), M(4, 1, 2)]
  const holeSp = dv(sub(M(36), mul(M(2), M(2, 1, 4))), M(6))
  const stk2 = [nr(3, 8), nr(1, 2), nr(5, 16)]
  const fl = sub(sub(sub(M(144), mul(M(2), M(36, 3, 8))), mul(M(2), M(24, 5, 8))), mul(M(4), nr(1, 8)))
  const fifth = dv(M(72), M(5)), fifth16 = Math.round((val(fifth) - Math.floor(val(fifth))) * 16)
  const pcs = Math.floor(val(dv(M(30), add(M(2, 1, 4), nr(1, 8))))), pcsOff = sub(M(30), mul(M(pcs), add(M(2, 1, 4), nr(1, 8))))

  return L.join([
    B.chapter({
      num: 4, id: 'fractions', title: 'Fractions',
      intro: B.p('Many inch sizes are fractions. A tape reads ' + mx(2, 5, 16) + ' in, a drawing calls for ' + fr(3, 8) + ' in plate, and a cut list adds up lengths like ' + mx(36, 3, 8) + ' in. To read, add and divide these sizes you need to work with fractions.',
        'This chapter starts with what a fraction means and how to read an inch tape and a steel rule. It then covers equivalent fractions, lowest terms, mixed numbers and the four operations. Each method is shown by hand and then with the fraction key on the TI-30Xa and the Sharp EL-531XT.'),
      objectives: ['Read an inch tape to the nearest 1/16 in and a rule to 1/32 and 1/64 in', 'Write equivalent fractions and put fractions in lowest terms', 'Change between improper fractions and mixed numbers', 'Compare fractions using a common denominator', 'Add, subtract, multiply and divide fractions and mixed numbers', 'Use the fraction key on both calculators'],
      words: ['fraction', 'numerator and denominator', 'proper and improper fraction', 'mixed number', 'equivalent fractions', 'lowest terms', 'common denominator', 'reciprocal'],
      art: G.rule({ from: 0, to: 4, den: 16, ppi: 140, marks: [{ v: 1.375, lab: { inch: 1.375 } }, { v: 2 + 11 / 16, lab: { inch: 2 + 11 / 16 } }, { v: 3.5, lab: { ask: true } }], max: '6in' })
    }),

    B.section('What a fraction is'),
    B.p('A ' + B.term('fraction', 'A number that names part of a whole, written as one whole number over another, such as 3/8.') + ' names part of a whole. The whole is split into equal parts, and the fraction tells you how many of those parts you have.',
      'In ' + fr(3, 8) + ' the bottom number is the ' + B.term('denominator', 'The bottom number of a fraction. It tells how many equal parts the whole is split into.') + '. It tells how many equal parts the whole is split into: 8. The top number is the ' + B.term('numerator', 'The top number of a fraction. It tells how many of the equal parts you have.') + '. It tells how many of those parts you have: 3.',
      'The line between the two numbers is the fraction bar. It means divide: ' + fr(3, 8) + ' is the same as 3 ÷ 8. Chapter 5 uses this to change fractions into decimals.',
      'A fraction whose numerator is smaller than its denominator is a ' + B.term('proper fraction', 'A fraction whose numerator is smaller than its denominator, such as 5/8. It is worth less than one whole.') + '. It is worth less than one whole. ' + fr(5, 8) + ', ' + fr(3, 4) + ' and ' + fr(15, 16) + ' are proper fractions.'),
    B.example({
      title: 'Parts of a bar',
      q: 'A flat bar is marked into 8 equal lengths. Three lengths are cut off. What fraction of the bar is cut off, and what fraction is left?',
      fig: G.bar(3, 8, { w: 320 }),
      steps: ['The bar is split into 8 equal parts, so the denominator is 8.', '3 parts are cut off, so ' + fr(3, 8) + ' of the bar is cut off.', '8 − 3 = 5 parts are left, so ' + fr(5, 8) + ' of the bar is left.'],
      answer: fr(3, 8) + ' is cut off and ' + fr(5, 8) + ' is left. Together they make ' + fr(8, 8) + ', the whole bar.'
    }),
    B.figure(G.bars([{ n: 1, d: 2 }, { n: 1, d: 4 }, { n: 1, d: 8 }, { n: 1, d: 16 }], { w: 440, h: 24, gap: 10 }), 'One part of each bar is shaded. The bigger the denominator, the smaller each part: ' + fr(1, 16) + ' in is smaller than ' + fr(1, 8) + ' in.', { width: '4.2in' }),
    B.tryIt([
      { q: 'A bar is split into 4 equal parts and 3 are shaded. What fraction is shaded?', a: fr(3, 4) },
      { q: 'In ' + fr(7, 16) + ', which number is the numerator?', a: '7' },
      { q: 'In ' + fr(7, 16) + ', how many equal parts is the whole split into?', a: '16' },
      { q: 'A box holds 12 couplings and 5 are used. What fraction is used? What fraction is left?', a: fr(5, 12) + ' used, ' + fr(7, 12) + ' left' },
      { q: 'Which is smaller, ' + fr(1, 4) + ' in or ' + fr(1, 8) + ' in?', a: fr(1, 8) + ' in' },
      { q: 'Is ' + fr(9, 8) + ' a proper fraction? Explain.', a: 'No. The numerator 9 is bigger than the denominator 8, so it is worth more than one whole.' }
    ]),

    B.section('Reading an inch tape and rule'),
    B.p('Inch tapes and rules split each inch into equal parts. On the rule below, the longest lines mark whole inches. The next longest line marks the half inch. Shorter lines mark quarters, then eighths, and the shortest lines mark sixteenths. This book reads tapes to the nearest ' + fr(1, 16) + ' in, and steel rules to ' + fr(1, 32) + ' in or ' + fr(1, 64) + ' in.'),
    B.figure(G.rule({ from: 0, to: 1, den: 16, ppi: 540, zero: true, marks: [{ v: 1 / 16, tru: true, lab: { n: 1, d: 16, unit: '″' } }, { v: 1 / 8, tru: true, lab: { n: 1, d: 8, unit: '″' } }, { v: 1 / 4, tru: true, lab: { n: 1, d: 4, unit: '″' } }, { v: 1 / 2, tru: true, lab: { n: 1, d: 2, unit: '″' } }, { v: 3 / 4, tru: true, lab: { n: 3, d: 4, unit: '″' } }], max: '6.2in' }), 'One inch split into sixteenths. ' + fr(1, 2) + ' = ' + fr(8, 16) + ', ' + fr(1, 4) + ' = ' + fr(4, 16) + ' and ' + fr(1, 8) + ' = ' + fr(2, 16) + '. The length of each line shows which fraction it marks.'),
    B.how(['Find the last whole inch line before the mark. That gives the whole number.', 'Count the sixteenth spaces from that inch line to the mark.', 'Write the count over 16. That is the fraction part.', 'Put the fraction in lowest terms (Section 4.3 shows how).']),
    B.figure(G.rule({ from: 0, to: 3, den: 16, ppi: 200, marks: [{ v: 2 + 5 / 16, name: 'A' }, { v: 1.75, name: 'B' }], max: '6.4in' }), 'A rule marked in sixteenths. Marks A and B are read in Example 4.2.'),
    B.example({
      title: 'Reading marks A and B',
      q: 'Read marks A and B on the rule above.',
      steps: ['A: the last whole inch line before A is the 2. Count the spaces from the 2 line to A: 5 sixteenths. 5 is odd, so ' + fr(5, 16) + ' is in lowest terms. A reads ' + mx(2, 5, 16) + ' in.', 'B: the last whole inch line before B is the 1. Count 12 sixteenths past it. Divide the top and bottom of ' + fr(12, 16) + ' by 4 to get ' + fr(3, 4) + '. B reads ' + mx(1, 3, 4) + ' in.', 'Check: B sits on a quarter line, the line for ' + fr(3, 4) + '.'],
      answer: 'A is ' + mx(2, 5, 16) + ' in and B is ' + mx(1, 3, 4) + ' in.'
    }),
    B.watch('Count spaces, not lines', 'Start counting at the first space after the whole inch line. If you count the inch line itself as 1, every reading comes out ' + fr(1, 16) + ' in too long.'),
    B.p('A rule marked in 32nds splits each inch into 32 equal parts, and a rule marked in 64ths splits each inch into 64. The lines are close together, so read them in two steps. First find the last eighth line before the mark, then count the small spaces past it.'),
    B.figure(G.rule({ from: 0, to: 0.5, den: 32, ppi: 1180, zero: true, marks: [{ v: 13 / 32, name: 'C' }], max: '5.4in' }), 'The first half inch of a rule marked in 32nds.'),
    B.figure(G.rule({ from: 0, to: 0.5, den: 64, ppi: 1180, zero: true, marks: [{ v: 27 / 64, name: 'D' }], max: '5.4in' }), 'The first half inch of a rule marked in 64ths.'),
    B.example({
      title: 'Reading 32nds and 64ths',
      q: 'Read mark C on the rule marked in 32nds and mark D on the rule marked in 64ths.',
      steps: ['C: the last eighth line before C is the ' + fr(3, 8) + ' line, and ' + fr(3, 8) + ' = ' + fr(12, 32) + '. C is 1 small space past it: 12 + 1 = 13. C reads ' + fr(13, 32) + ' in.', 'D: the last eighth line before D is also the ' + fr(3, 8) + ' line, and ' + fr(3, 8) + ' = ' + fr(24, 64) + '. D is 3 small spaces past it: 24 + 3 = 27. D reads ' + fr(27, 64) + ' in.', '13 and 27 are odd, so both readings are in lowest terms.'],
      answer: 'C is ' + fr(13, 32) + ' in and D is ' + fr(27, 64) + ' in.'
    }),
    B.p('Read each mark on the rule below for Try it 4.2. Give each reading to the nearest ' + fr(1, 16) + ' in, in lowest terms.'),
    B.figure(G.rule({ from: 0, to: 4, den: 16, ppi: 150, marks: tryRule.map((v, i) => ({ v, name: 'ABCDEF'[i] })), max: '6.4in' }), 'Marks A to F for Try it 4.2.'),
    B.tryIt(tryRule.map((v, i) => ({ q: 'Mark ' + 'ABCDEF'[i], a: RD(v, 16) }))),

    B.section('Equivalent fractions and lowest terms'),
    B.p(B.term('Equivalent fractions', 'Fractions that are written differently but have the same value, such as 1/2, 2/4 and 8/16.') + ' are written differently but have the same value. In the figure below, ' + fr(1, 2) + ', ' + fr(2, 4) + ', ' + fr(4, 8) + ' and ' + fr(8, 16) + ' of the bars are shaded. The four shaded parts are the same length.'),
    B.figure(G.bars([{ n: 1, d: 2 }, { n: 2, d: 4 }, { n: 4, d: 8 }, { n: 8, d: 16 }], { w: 440, h: 24, gap: 10, line: 0.5 }), fr(1, 2) + ' = ' + fr(2, 4) + ' = ' + fr(4, 8) + ' = ' + fr(8, 16) + '. The dashed line is at the half.', { width: '4.2in' }),
    B.keyidea('Making an equivalent fraction', 'Multiply or divide the numerator and the denominator by the same number. The value of the fraction does not change. To write ' + fr(3, 4) + ' in sixteenths, multiply the top and bottom by 4: ' + fr(3, 4) + ' = ' + fr(12, 16) + '.'),
    B.p('A fraction is in ' + B.term('lowest terms', 'A fraction is in lowest terms when no whole number bigger than 1 divides evenly into both its numerator and its denominator.') + ' when no whole number bigger than 1 divides evenly into both the numerator and the denominator. To put a fraction in lowest terms, divide the top and the bottom by a number that goes into both, and repeat until no number bigger than 1 goes into both. This book writes tape readings in lowest terms: ' + mx(1, 3, 4) + ' in, not ' + mx(1, 12, 16) + ' in.'),
    B.example({
      title: 'Reducing a reading',
      q: 'Write ' + fr(12, 16) + ' and ' + fr(24, 64) + ' in lowest terms.',
      steps: [fr(12, 16) + ': both numbers are even. Divide both by 2 to get ' + fr(6, 8) + ', then by 2 again to get ' + fr(3, 4) + '. 3 is odd, so stop.', fr(24, 64) + ': divide by 8 in one step. 24 ÷ 8 = 3 and 64 ÷ 8 = 8, so ' + fr(24, 64) + ' = ' + fr(3, 8) + '.'],
      calc: { seq: '12 ab/c 16 =', expect: '0.75', say: 'When you press =, the display shows the fraction in lowest terms. The TI-30Xa shows ' + DSP('12 ab/c 16 =', 'ti30xa') + ' and the Sharp shows ' + DSP('12 ab/c 16 =', 'el531xt') + '. Read either one as ' + fr(3, 4) + '.' },
      answer: fr(12, 16) + ' = ' + fr(3, 4) + ' and ' + fr(24, 64) + ' = ' + fr(3, 8)
    }),
    B.tip('A quick test for tape fractions', 'Tape and rule fractions have 2, 4, 8, 16, 32 or 64 as the denominator. If the numerator is odd, the fraction is already in lowest terms. If the numerator is even, divide the top and the bottom by 2 and test again.'),
    B.sub('Comparing fractions'),
    B.p('When two fractions have the same denominator, the one with the bigger numerator is bigger: ' + fr(9, 16) + ' is bigger than ' + fr(7, 16) + '. When the denominators are different, rewrite the fractions with the same denominator first. A denominator that the fractions share is a ' + B.term('common denominator', 'A denominator that two or more fractions share. For 3/8 and 5/16, 16 is a common denominator.') + '. For tape fractions, 16 works for halves, quarters, eighths and sixteenths. Use 32 or 64 when a fraction has 32 or 64 on the bottom.'),
    B.example({
      title: 'Putting sizes in order',
      q: 'Three bolts have diameters of ' + fr(3, 8) + ' in, ' + fr(5, 16) + ' in and ' + fr(1, 4) + ' in. List them from smallest to largest.',
      fig: G.rule({ from: 0, to: 0.5, den: 16, ppi: 640, zero: true, labS: 19, marks: [{ v: 1 / 4, lab: { n: 1, d: 4, unit: '″' } }, { v: 5 / 16, lab: { n: 5, d: 16, unit: '″' } }, { v: 3 / 8, lab: { n: 3, d: 8, unit: '″' } }] }),
      steps: ['Change each to sixteenths: ' + fr(3, 8) + ' = ' + fr(6, 16) + ', ' + fr(5, 16) + ' stays as it is, and ' + fr(1, 4) + ' = ' + fr(4, 16) + '.', 'Put the numerators in order: 4, 5, 6.', 'The rule shows the same order from left to right.'],
      answer: order([nr(3, 8), nr(5, 16), nr(1, 4)])
    }),
    B.p('For fractions that are not tape fractions, use the smallest number that both denominators divide into evenly. For ' + fr(2, 3) + ' and ' + fr(3, 4) + ' that number is 12: ' + fr(2, 3) + ' = ' + fr(8, 12) + ' and ' + fr(3, 4) + ' = ' + fr(9, 12) + ', so ' + fr(3, 4) + ' is bigger.'),
    B.tryIt([
      { q: 'Write ' + fr(10, 16) + ' in lowest terms.', a: H(nr(10, 16)) },
      { q: 'Write ' + fr(14, 16) + ' in lowest terms.', a: H(nr(14, 16)) },
      { q: 'Write ' + fr(20, 32) + ' in lowest terms.', a: H(nr(20, 32)) },
      { q: 'Write ' + fr(48, 64) + ' in lowest terms.', a: H(nr(48, 64)) },
      { q: 'Write ' + fr(5, 8) + ' in sixteenths.', a: fr(10, 16) },
      { q: 'Write ' + fr(3, 4) + ' in 32nds.', a: fr(24, 32) },
      { q: 'Which is bigger, ' + fr(3, 8) + ' or ' + fr(7, 16) + '?', a: H(big(nr(3, 8), nr(7, 16))) },
      { q: 'Which is bigger, ' + fr(5, 32) + ' or ' + fr(1, 8) + '?', a: H(big(nr(5, 32), nr(1, 8))) },
      { q: 'Put in order from smallest: ' + fr(3, 4) + ', ' + fr(5, 8) + ', ' + fr(11, 16) + '.', a: order([nr(3, 4), nr(5, 8), nr(11, 16)]) },
      { q: 'Which is bigger, ' + fr(2, 3) + ' or ' + fr(5, 8) + '? Use 24 as the common denominator.', a: H(big(nr(2, 3), nr(5, 8))) + ' (' + fr(16, 24) + ' is bigger than ' + fr(15, 24) + ')' }
    ]),

    B.section('Improper fractions and mixed numbers'),
    B.p('An ' + B.term('improper fraction', 'A fraction whose numerator is equal to or bigger than its denominator, such as 11/4. It is worth one whole or more.') + ' has a numerator equal to or bigger than its denominator, so it is worth one whole or more. A ' + B.term('mixed number', 'A whole number and a proper fraction written together, such as 2 3/4.') + ' is a whole number and a proper fraction written together. Tape readings such as ' + mx(2, 3, 4) + ' in are mixed numbers. Improper fractions make multiplying and dividing easier.'),
    B.figure(G.circles([{ n: 4, d: 4, cap: '1' }, { n: 4, d: 4, cap: '1' }, { n: 3, d: 4, cap: { n: 3, d: 4 } }], { r: 40, gap: 36 }), 'Eleven quarters make 2 whole circles and 3 quarters more: ' + fr(11, 4) + ' = ' + mx(2, 3, 4) + '.', { width: '2.4in' }),
    B.example({
      title: 'Improper to mixed',
      q: 'Change ' + fr(43, 16) + ' to a mixed number.',
      steps: ['Divide the numerator by the denominator: 43 ÷ 16 = 2 with a remainder. 2 × 16 = 32 and 43 − 32 = 11.', 'The whole number is 2. The remainder 11 goes over the same denominator: ' + fr(11, 16) + '.'],
      answer: fr(43, 16) + ' = ' + mx(2, 11, 16)
    }),
    B.example({
      title: 'Mixed to improper',
      q: 'Change ' + mx(3, 5, 8) + ' to an improper fraction.',
      steps: ['Multiply the whole number by the denominator: 3 whole inches hold 3 × 8 = 24 eighths.', 'Add the numerator: 24 + 5 = 29. Write it over the same denominator.'],
      answer: mx(3, 5, 8) + ' = ' + fr(29, 8)
    }),
    B.tryIt([
      { q: 'Change ' + fr(7, 4) + ' to a mixed number.', a: H(nr(7, 4)) },
      { q: 'Change ' + fr(29, 16) + ' to a mixed number.', a: H(nr(29, 16)) },
      { q: 'Change ' + fr(21, 8) + ' to a mixed number.', a: H(nr(21, 8)) },
      { q: 'Change ' + mx(2, 3, 8) + ' to an improper fraction.', a: fr(M(2, 3, 8)[0], 8) },
      { q: 'Change ' + mx(5, 1, 2) + ' to an improper fraction.', a: fr(M(5, 1, 2)[0], 2) },
      { q: 'Change ' + mx(1, 15, 16) + ' to an improper fraction.', a: fr(M(1, 15, 16)[0], 16) }
    ]),

    B.section('The fraction key'),
    B.p('The TI-30Xa and the Sharp EL-531XT each have a fraction key, marked a b/c. To key in a mixed number, press the whole number, the fraction key, the numerator, the fraction key again and then the denominator. For a fraction with no whole number, start with the numerator.'),
    B.calc({
      title: 'Keying in ' + mx(3, 5, 8),
      rows: [
        { label: 'Key in ' + mx(3, 5, 8) + ' and press =', seq: '3 ab/c 5 ab/c 8 =', expect: '3.625' },
        { label: 'Change it to an improper fraction', seq: '3 ab/c 5 ab/c 8 = d/c', expect: '3.625' },
        { label: 'Change it to a decimal', seq: '3 ab/c 5 ab/c 8 = F⇄D', expect: '3.625' }
      ],
      say: 'The TI-30Xa marks the parts of a fraction with ⌟ and the Sharp uses ┌. Read ' + DSP('3 ab/c 5 ab/c 8 =', 'ti30xa') + ' and ' + DSP('3 ab/c 5 ab/c 8 =', 'el531xt') + ' as ' + mx(3, 5, 8) + ', and ' + DSP('3 ab/c 5 ab/c 8 = d/c', 'ti30xa') + ' as ' + fr(29, 8) + '.'
    }),
    B.table(['Job', 'TI-30Xa', 'Sharp EL-531XT'], [
      ['Key in a fraction', 'a b/c between the parts', 'a b/c between the parts'],
      ['Change a result between a fraction and a decimal', '2nd, then F⇄D', 'a b/c after the ='],
      ['Change between a mixed number and an improper fraction', '2nd, then d/c', '2ndF, then d/c'],
      ['Change a decimal such as 0.375 to a fraction', '0.375, 2nd, F⇄D', '0.375, =, a b/c']
    ], { caption: 'Fraction keys on the two calculators. Both show 0.375 as ' + fr(3, 8) + '.' }),
    B.calc({ title: 'A decimal as a fraction', seq: '0.375 F⇄D', expect: '0.375', say: 'Both displays read ' + fr(3, 8) + '.' }),
    B.watch('A decimal in a fraction calculation', 'On the Sharp, if any number in a fraction calculation is keyed as a decimal, the answer comes out as a decimal: its manual shows 1.25 + 2/5 = 1.65. Key every number as a fraction when you want a fraction answer. To switch a fraction answer to a decimal and back, press 2nd F⇄D on the TI-30Xa or a b/c on the Sharp.'),
    B.tryIt([
      { q: 'Write the keys to enter ' + mx(2, 7, 16) + '.', a: '2 a b/c 7 a b/c 16' },
      { q: 'The TI-30Xa shows ' + DSP('1 ab/c 3 ab/c 8 =', 'ti30xa') + '. What number is that?', a: mx(1, 3, 8) },
      { q: 'The Sharp shows ' + DSP('15 ab/c 16 =', 'el531xt') + '. What number is that?', a: fr(15, 16) },
      { q: 'Use the fraction key to put ' + fr(28, 32) + ' in lowest terms.', a: H(nr(28, 32)) },
      { q: 'Use d/c to change ' + mx(4, 3, 4) + ' to an improper fraction.', a: fr(19, 4) },
      { q: 'Use the calculator to change 0.625 to a fraction.', a: fr(5, 8) }
    ]),

    B.section('Adding and subtracting fractions'),
    B.p('To add or subtract fractions with the same denominator, add or subtract the numerators and keep the denominator: ' + fr(3, 16) + ' + ' + fr(5, 16) + ' = ' + fr(8, 16) + ' = ' + fr(1, 2) + '. When the denominators are different, change to a common denominator first: ' + fr(7, 8) + ' − ' + fr(5, 16) + ' = ' + fr(14, 16) + ' − ' + fr(5, 16) + ' = ' + H(sub(nr(7, 8), nr(5, 16))) + '. Then put the answer in lowest terms.'),
    B.example({
      title: 'Stacking plates',
      q: 'Three plates are stacked. They are ' + fr(3, 8) + ' in, ' + fr(1, 4) + ' in and ' + fr(3, 16) + ' in thick. How thick is the stack?',
      fig: stack(stk.map(val), { askTotal: true, S: 150 }),
      steps: ['Change to sixteenths: ' + fr(6, 16) + ', ' + fr(4, 16) + ' and ' + fr(3, 16) + '.', 'Add the numerators: 6 + 4 + 3 = 13.', 'The total is ' + fr(13, 16) + '. 13 is odd, so it is in lowest terms.'],
      calc: { seq: '3 ab/c 8 + 1 ab/c 4 + 3 ab/c 16 =', expect: String(val(stkSum)), say: shows('3 ab/c 8 + 1 ab/c 4 + 3 ab/c 16 =', stkSum) },
      answer: IN(stkSum)
    }),
    B.p('To add mixed numbers, add the whole numbers and add the fractions. If the fractions come to one whole or more, change that part to a mixed number and carry the whole number.'),
    B.figure(G.cutBar(cl.map((a, i) => ({ len: val(a), name: 'ABC'[i] })), { askTotal: true, w: 560 }), 'Three pieces on a cut list. The total length is hidden.', { width: '5in' }),
    B.example({
      title: 'Total of a cut list',
      q: 'Find the total length of the three pieces: ' + cl.map(IN).join(', ') + '.',
      steps: ['Add the whole numbers: 12 + 8 + 15 = 35.', 'Change the fractions to eighths and add them: ' + fr(6, 8) + ' + ' + fr(5, 8) + ' + ' + fr(4, 8) + ' = ' + fr(15, 8) + '.', fr(15, 8) + ' = ' + mx(1, 7, 8) + '. Carry the 1: 35 + 1 = 36. The total is ' + mx(36, 7, 8) + ' in.'],
      calc: { seq: '12 ab/c 3 ab/c 4 + 8 ab/c 5 ab/c 8 + 15 ab/c 1 ab/c 2 =', expect: String(val(clSum)), say: shows('12 ab/c 3 ab/c 4 + 8 ab/c 5 ab/c 8 + 15 ab/c 1 ab/c 2 =', clSum) },
      answer: IN(clSum)
    }),
    B.p('To subtract mixed numbers, subtract the fractions first and then the whole numbers. When the fraction on top is smaller than the fraction you take away, borrow 1 from the whole number. Write the borrowed 1 as a fraction with the same denominator, such as ' + fr(8, 8) + ' or ' + fr(16, 16) + ', and add it to the fraction. For example, ' + mx(5, 1, 4) + ' − ' + mx(2, 7, 16) + ' = ' + mx(5, 4, 16) + ' − ' + mx(2, 7, 16) + ' = ' + mx(4, 20, 16) + ' − ' + mx(2, 7, 16) + ' = ' + H(bor) + '.'),
    B.check('5 ab/c 1 ab/c 4 − 2 ab/c 7 ab/c 16 =', String(val(bor))),
    B.example({
      title: 'What is left of the bar?',
      q: 'A piece ' + mx(29, 5, 8) + ' in long is cut from a 48 in bar. Ignore the saw cut. How long is the offcut?',
      fig: G.cutBar([{ len: 29.625 }], { total: 48, askRest: true, w: 420, s: 15 }),
      steps: ['There is no fraction in 48 to take ' + fr(5, 8) + ' from, so borrow 1: 48 = 47 ' + fr(8, 8) + '.', 'Fractions: ' + fr(8, 8) + ' − ' + fr(5, 8) + ' = ' + fr(3, 8) + '.', 'Whole numbers: 47 − 29 = 18.'],
      calc: { seq: '48 − 29 ab/c 5 ab/c 8 =', expect: String(val(off1)), say: shows('48 − 29 ab/c 5 ab/c 8 =', off1) },
      answer: IN(off1)
    }),
    B.tip('Check by adding', 'Add your answer to the number you took away. You should get the number you started with: ' + mx(18, 3, 8) + ' + ' + mx(29, 5, 8) + ' = ' + H(add(off1, M(29, 5, 8))) + '.'),
    B.tryIt([
      { q: fr(3, 8) + ' + ' + fr(7, 16), a: H(add(nr(3, 8), nr(7, 16))) },
      { q: fr(5, 8) + ' + ' + fr(3, 4), a: H(add(nr(5, 8), nr(3, 4))) },
      { q: mx(10, 7, 8) + ' + ' + mx(6, 3, 4), a: H(add(M(10, 7, 8), M(6, 3, 4))) },
      { q: 'Pieces of ' + mx(18, 3, 8) + ' in, ' + mx(24, 1, 2) + ' in and ' + mx(9, 15, 16) + ' in. What is the total length?', a: IN(add(M(18, 3, 8), M(24, 1, 2), M(9, 15, 16))) },
      { q: fr(15, 16) + ' − ' + fr(3, 8), a: H(sub(nr(15, 16), nr(3, 8))) },
      { q: '6 − ' + mx(2, 3, 8), a: H(sub(M(6), M(2, 3, 8))) },
      { q: mx(12, 3, 16) + ' − ' + mx(5, 5, 8), a: H(sub(M(12, 3, 16), M(5, 5, 8))) },
      { q: 'A piece ' + mx(22, 11, 16) + ' in long is cut from a 36 in bar. Ignore the saw cut. How long is the offcut?', a: IN(sub(M(36), M(22, 11, 16))) }
    ]),

    B.section('Multiplying and dividing fractions'),
    B.p('To multiply fractions, multiply the numerators, multiply the denominators and put the answer in lowest terms: ' + fr(2, 3) + ' × ' + fr(3, 4) + ' = ' + fr(6, 12) + ' = ' + fr(1, 2) + '. A whole number can be written over 1: 6 = ' + fr(6, 1) + '. Change mixed numbers to improper fractions before you multiply.',
      'In word problems, the word "of" means multiply. ' + fr(3, 4) + ' of a 24 in bar is ' + fr(3, 4) + ' × ' + fr(24, 1) + ' = ' + fr(72, 4) + ' = 18 in.'),
    B.shop('Saw cuts in fractions', 'When a problem gives the ' + B.term('kerf') + ' as a fraction of an inch, work with it like any other fraction. With a kerf of ' + fr(1, 8) + ' in, 4 cuts remove 4 × ' + fr(1, 8) + ' = ' + fr(4, 8) + ' = ' + fr(1, 2) + ' in of stock. The problems in this book give the kerf whenever it counts.'),
    B.example({
      title: 'Pieces and saw cuts',
      q: 'Four pieces, each ' + mx(11, 3, 4) + ' in long, are cut from a 48 in bar. You make 4 cuts and the kerf is ' + fr(1, 8) + ' in. How long is the offcut?',
      steps: ['Pieces: 4 × ' + mx(11, 3, 4) + ' = 4 × ' + fr(47, 4) + ' = ' + fr(188, 4) + ' = 47 in.', 'Saw cuts: 4 × ' + fr(1, 8) + ' = ' + fr(1, 2) + ' in.', 'Offcut: 48 − 47 − ' + fr(1, 2) + ' = ' + H(kerfOff) + ' in.'],
      calc: { seq: '48 − 4 × 11 ab/c 3 ab/c 4 − 4 × 1 ab/c 8 =', expect: String(val(kerfOff)) },
      answer: IN(kerfOff)
    }),
    B.p('The ' + B.term('reciprocal', 'The fraction turned upside down. The reciprocal of 3/4 is 4/3. A number times its reciprocal is 1.') + ' of a fraction is the fraction turned upside down. The reciprocal of ' + fr(3, 4) + ' is ' + fr(4, 3) + ', and the reciprocal of 5 (or ' + fr(5, 1) + ') is ' + fr(1, 5) + '. A number times its reciprocal is 1: ' + fr(3, 4) + ' × ' + fr(4, 3) + ' = ' + fr(12, 12) + ' = 1.'),
    B.keyidea('Dividing by a fraction', 'To divide by a fraction, multiply by its reciprocal. Change mixed numbers to improper fractions first. Then turn the number you are dividing by upside down and multiply.'),
    B.p('For example, a ' + mx(30, 1, 2) + ' in bar cut into 4 equal pieces, ignoring the saw cuts, gives ' + mx(30, 1, 2) + ' ÷ 4 = ' + fr(61, 2) + ' × ' + fr(1, 4) + ' = ' + fr(61, 8) + ' = ' + IN(eq4) + ' for each piece.'),
    B.check('30 ab/c 1 ab/c 2 ÷ 4 =', String(val(eq4))),
    B.example({
      title: 'How many pieces?',
      q: 'How many spacers ' + mx(1, 3, 4) + ' in long can be cut from a 24 in bar? Ignore the saw cuts. How long is the offcut?',
      steps: ['24 ÷ ' + mx(1, 3, 4) + ' = ' + fr(24, 1) + ' × ' + fr(4, 7) + ' = ' + fr(96, 7) + ' = ' + H(spc) + '.', 'Only whole spacers count: ' + spcN + ' spacers.', spcN + ' spacers use ' + spcN + ' × ' + mx(1, 3, 4) + ' = ' + H(mul(M(spcN), M(1, 3, 4))) + ' in. The offcut is 24 − ' + H(mul(M(spcN), M(1, 3, 4))) + ' = ' + H(spcOff) + ' in.'],
      calc: { rows: [{ label: 'Spacers', seq: '24 ÷ 1 ab/c 3 ab/c 4 =', expect: L.round(val(spc), 2).toFixed(2) }, { label: 'Offcut', seq: '24 − ' + spcN + ' × 1 ab/c 3 ab/c 4 =', expect: String(val(spcOff)) }], say: 'The first display reads ' + H(spc) + '. Only the whole number of spacers counts.' },
      answer: spcN + ' spacers, with an offcut of ' + IN(spcOff) + '.'
    }),
    B.tip('Lengths that are not on the tape', 'Some answers have denominators that are not on a tape, such as thirds. To mark them, multiply the fraction part by 16 and round to the nearest whole number of sixteenths. A 25 in bar cut into 3 equal pieces gives ' + fr(25, 3) + ' = ' + mx(8, 1, 3) + ' in. ' + fr(1, 3) + ' × 16 = ' + mx(5, 1, 3) + ', which rounds to 5, so mark each piece at ' + mx(8, 5, 16) + ' in. Chapter 5 does the same job with decimal inches.'),
    B.check('1 ab/c 3 × 16 =', '5.33'),
    B.tryIt([
      { q: fr(3, 8) + ' × 4', a: H(mul(nr(3, 8), M(4))) },
      { q: fr(2, 3) + ' of 18', a: H(mul(nr(2, 3), M(18))) },
      { q: mx(1, 1, 2) + ' × ' + mx(2, 1, 4), a: H(mul(M(1, 1, 2), M(2, 1, 4))) },
      { q: '6 pieces at ' + mx(2, 3, 8) + ' in. What is the total length, ignoring saw cuts?', a: IN(six) },
      { q: 'What is the reciprocal of ' + fr(5, 8) + '?', a: fr(8, 5) },
      { q: fr(7, 8) + ' ÷ 2', a: H(dv(nr(7, 8), M(2))) },
      { q: mx(10, 1, 2) + ' ÷ ' + mx(1, 3, 4), a: H(dv(M(10, 1, 2), M(1, 3, 4))) },
      { q: 'A ' + mx(29, 1, 4) + ' in bar is cut into 3 equal pieces. Ignore the saw cuts. How long is each piece?', a: IN(dv(M(29, 1, 4), M(3))) }
    ]),

    B.worksheet({ title: 'Read the rule', sub: 'Read each red pointer, then find the hidden lengths', intro: 'Give every reading in lowest terms. Ignore saw cuts unless the problem gives a kerf. Check your answers with the fraction key.' }),
    B.prob({ q: 'Read marks A, B and C to the nearest ' + fr(1, 16) + ' in.', canvas: G.rule({ from: 0, to: 3, den: 16, ppi: 195, marks: wsA.map((v, i) => ({ v, name: 'ABC'[i] })), max: '5.6in' }), a: wsA.map((v, i) => 'ABC'[i] + ': ' + RD(v, 16)).join(', '), lines: 1 }),
    B.prob({ q: 'This half inch of a rule is marked in 32nds. Read marks D and E.', canvas: G.rule({ from: 0, to: 0.5, den: 32, ppi: 1150, zero: true, marks: [{ v: 5 / 32, name: 'D' }, { v: 11 / 32, name: 'E' }], max: '5in' }), a: 'D: ' + fr(5, 32) + ' in, E: ' + fr(11, 32) + ' in', lines: 1 }),
    B.prob({ q: 'This half inch of a rule is marked in 64ths. Read marks F and G.', canvas: G.rule({ from: 0, to: 0.5, den: 64, ppi: 1150, zero: true, marks: [{ v: 11 / 64, name: 'F' }, { v: 29 / 64, name: 'G' }], max: '5in' }), a: 'F: ' + fr(11, 64) + ' in, G: ' + fr(29, 64) + ' in', lines: 1 }),
    B.prob({ q: 'Draw a pointer on the rule at ' + mx(1, 3, 8) + ' in and another at ' + mx(2, 11, 16) + ' in. Label them.', canvas: G.rule({ from: 0, to: 3, den: 16, ppi: 195, max: '5.6in' }), a: mx(1, 3, 8) + ' in is 6 sixteenths past the 1 in line. ' + mx(2, 11, 16) + ' in is 11 sixteenths past the 2 in line.', lines: 0 }),
    B.prob({ q: 'Three pieces are cut from a 96 in bar. How long is the offcut?', canvas: G.cutBar(wsCut.map(a => ({ len: val(a) })), { total: 96, askRest: true, max: '5.8in' }), a: IN(wsOff), work: '96 − (' + wsCut.map(H).join(' + ') + ') = 96 − ' + H(add(...wsCut)) + ' = ' + H(wsOff), lines: 2 }),
    B.prob({ q: 'The overall length is 40 in. Find the middle piece.', canvas: G.cutBar([{ len: 12.625 }, { len: val(wsMid), ask: true }, { len: 15.4375 }], { totalLab: { inch: 40 }, max: '5.8in' }), a: IN(wsMid), work: '40 − ' + mx(12, 5, 8) + ' − ' + mx(15, 7, 16) + ' = ' + H(wsMid), lines: 2 }),
    B.prob({ q: 'A frame needs 2 pieces at ' + mx(36, 3, 8) + ' in and 2 pieces at ' + mx(24, 5, 8) + ' in, cut from a 144 in bar. You make 4 cuts and the kerf is ' + fr(1, 8) + ' in. How long is the offcut?', a: IN(fl), work: '144 − 2 × ' + mx(36, 3, 8) + ' − 2 × ' + mx(24, 5, 8) + ' − 4 × ' + fr(1, 8) + ' = ' + H(fl), lines: 3 }),
    B.grid2(
      B.prob({ q: 'Change one value: 8 pieces are each ' + mx(5, 3, 8) + ' in long. What is their total length? If each piece is made ' + fr(1, 16) + ' in longer, how much more stock is needed?', a: IN(mul(M(8), M(5, 3, 8))) + ' in total. ' + IN(mul(M(8), nr(1, 16))) + ' more, for a new total of ' + IN(mul(M(8), M(5, 7, 16))) + '.', lines: 3 }),
      B.prob({ q: 'A 72 in bar is cut into 5 equal pieces. Ignore the saw cuts. How long is each piece, to the nearest ' + fr(1, 16) + ' in?', a: RD(val(fifth), 16), work: '72 ÷ 5 = ' + H(fifth) + '. ' + H(sub(fifth, M(Math.floor(val(fifth))))) + ' × 16 = ' + L.num(L.round((val(fifth) - Math.floor(val(fifth))) * 16, 1)) + ', nearest ' + fifth16 + ' sixteenths.', lines: 3 })),

    B.worksheet({ title: 'Break it down: parts in inches', sub: 'Split each part into pieces you can work with', intro: 'Each drawing is to scale. Find every red ?. Show the fractions you add or take away in the working box.' }),
    B.grid2(
      B.prob({ q: 'Find the hidden width.', canvas: G.lPlate(10.5, 8.75, 3.25, 2.625, { ask: ['c'], hide: ['d'], split: true, size: 240, ls: 18, max: '3in' }), a: IN(sub(M(10, 1, 2), M(3, 1, 4))), work: mx(10, 1, 2) + ' − ' + mx(3, 1, 4) + ' = ' + H(sub(M(10, 1, 2), M(3, 1, 4))), lines: 2 }),
      B.prob({ q: 'Find the overall height.', canvas: G.lPlate(10.5, 8.75, 3.25, 2.625, { ask: ['H'], hide: ['c'], split: true, size: 240, ls: 18, max: '3in' }), a: IN(add(M(6, 1, 8), M(2, 5, 8))), work: mx(6, 1, 8) + ' + ' + mx(2, 5, 8) + ' = ' + H(add(M(6, 1, 8), M(2, 5, 8))), lines: 2 })),
    B.grid2(
      B.prob({ q: 'Three plates are stacked. How thick is the stack?', canvas: stack(stk2.map(val), { askTotal: true, S: 110, max: '2.6in' }), a: IN(add(...stk2)), work: fr(6, 16) + ' + ' + fr(8, 16) + ' + ' + fr(5, 16) + ' = ' + fr(19, 16) + ' = ' + H(add(...stk2)), lines: 2 }),
      B.prob({ q: 'You cut ' + mx(2, 1, 4) + ' in pieces from a 30 in bar. You make one cut for each piece and the kerf is ' + fr(1, 8) + ' in. How many pieces do you get, and how long is the offcut?', a: pcs + ' pieces, offcut ' + IN(pcsOff), work: 'Each piece uses ' + mx(2, 1, 4) + ' + ' + fr(1, 8) + ' = ' + mx(2, 3, 8) + ' in. 30 ÷ ' + mx(2, 3, 8) + ' = ' + H(dv(M(30), M(2, 3, 8))) + ', so ' + pcs + ' pieces. Offcut 30 − ' + pcs + ' × ' + mx(2, 3, 8) + ' = ' + H(pcsOff), lines: 5 })),
    B.prob({ q: 'The shaft is ' + mx(10, 1, 2) + ' in long overall. Find the length of the middle step.', canvas: G.shaft([{ len: 3.375, dia: 1.5 }, { len: val(hid), dia: 1, ask: true }, { len: 4.75, dia: 1.25 }], { w: 560, hmax: 50, max: '4.6in' }), a: IN(hid), work: mx(10, 1, 2) + ' − ' + mx(3, 3, 8) + ' − ' + mx(4, 3, 4) + ' = ' + H(hid), lines: 2 }),
    B.prob({ q: 'Find the overall length of the shaft.', canvas: G.shaft(sh4.map((a, i) => ({ len: val(a), dia: [1.25, 1.75, 1.5, 1][i] })), { askTotal: true, w: 600, hmax: 50, max: '4.8in' }), a: IN(add(...sh4)), lines: 2 }),
    B.prob({ q: 'Seven holes are evenly spaced along a 36 in plate. The end holes are ' + mx(2, 1, 4) + ' in from the ends. Find the spacing.', canvas: G.holePlate(36, 2.25, 7, { ask: 'space', h: 50, ls: 16, max: '5in' }), a: IN(holeSp), work: '(36 − 2 × ' + mx(2, 1, 4) + ') ÷ 6 = ' + fr(63, 2) + ' ÷ 6 = ' + H(holeSp), lines: 2 })
  ])
}
