/* Chapter 6: Percent, Ratio and Proportion */
module.exports = function (B, L) {
  const F = require('../engine/figs.js')
  const G = require('../engine/figs-ch06.js')
  const n = L.num
  const C = F.C
  const range = k => Array.from({ length: k }, (_, i) => i)
  const money = x => '$' + n(x, 2)

  /* 10 by 10 grid with the first k squares shaded, row by row */
  function pctGrid(k, o) {
    o = o || {}
    const g = o.g || 20, x0 = 6, y0 = 6
    let h = ''
    range(100).forEach(i => {
      const r = Math.floor(i / 10), c = i % 10
      h += '<rect x="' + (x0 + c * g) + '" y="' + (y0 + r * g) + '" width="' + g + '" height="' + g + '" fill="' + (i < k ? C.gold : '#FFFFFF') + '" stroke="' + C.edge + '" stroke-width="1.1"/>'
    })
    h += '<rect x="' + x0 + '" y="' + y0 + '" width="' + 10 * g + '" height="' + 10 * g + '" fill="none" stroke="' + C.edge + '" stroke-width="2.4"/>'
    if (o.lab) o.lab.forEach((s, i) => { h += F.t(x0 + 10 * g + 18, y0 + 2.2 * g + i * 24, s, { s: 16, b: i === 0, a: 'start', c: i === 0 ? C.edge : C.ink }) })
    return F.svg(x0 * 2 + 10 * g + (o.lab ? 170 : 0), y0 * 2 + 10 * g, h, { max: o.max || '2.2in' })
  }
  /* double number line: percent above, decimal below */
  function dblLine(marks) {
    const W = 640, x0 = 36, x1 = W - 36, y = 48
    const X = p => x0 + (x1 - x0) * p / 100
    let h = F.line(x0, y, x1, y, { c: C.ink, w: 1.8 })
    range(11).forEach(i => {
      const p = i * 10
      h += F.line(X(p), y - 7, X(p), y + 7, { c: C.ink, w: 1.3 })
      h += F.t(X(p), y - 14, p + '%', { s: 12.5, wgt: 600 })
      h += F.t(X(p), y + 24, i === 10 ? '1' : (i === 0 ? '0' : '0.' + i), { s: 12.5, wgt: 500, c: C.dim })
    })
    marks.forEach(p => {
      h += '<circle cx="' + F.f(X(p)) + '" cy="' + y + '" r="5.5" fill="' + C.red + '"/>'
      h += F.t(X(p), y + 44, n(p / 100), { s: 13, b: true, c: C.red })
    })
    h += F.t(4, y - 14, '%', { s: 13, a: 'start', c: C.dim }) + F.t(0, y + 24, 'dec.', { s: 13, a: 'start', c: C.dim })
    return F.svg(W, y + 54, h, { max: '6in' })
  }
  /* mix bar: groups [{k, name, fill}] of equal unit blocks */
  function mixBar(groups, o) {
    o = o || {}
    const u = o.u || 64, x0 = 14, y = 14, H = 40
    const T = groups.reduce((a, g) => a + g.k, 0)
    let h = '', x = x0
    groups.forEach(g => {
      const gx = x
      range(g.k).forEach(() => {
        h += '<rect x="' + F.f(x) + '" y="' + y + '" width="' + u + '" height="' + H + '" fill="' + (g.fill || C.fill) + '" stroke="' + C.edge + '" stroke-width="1.8"/>'
        x += u
      })
      h += F.line(gx + 3, y + H + 10, x - 3, y + H + 10, { c: C.dim, w: 1.2 }) + F.line(gx + 3, y + H + 5, gx + 3, y + H + 10, { c: C.dim, w: 1.2 }) + F.line(x - 3, y + H + 5, x - 3, y + H + 10, { c: C.dim, w: 1.2 })
      h += F.t((gx + x) / 2, y + H + 28, g.name, { s: 13, b: true, c: C.edge })
      if (g.sub) h += F.t((gx + x) / 2, y + H + 46, g.sub, { s: 12, c: C.ink })
    })
    return F.svg(x0 * 2 + T * u, y + H + 54, h, { max: o.max || (T * u / 96 * 0.9).toFixed(2) + 'in' })
  }
  /* a plate drawn on paper with its drawing sizes, a scale note and optional holes */
  function scalePlate(dl, dw, scale, o) {
    o = o || {}
    const ppm = o.ppm || 5, x0 = 56, y0 = 38
    const W = dl * ppm, H = dw * ppm
    let h = F.rect(x0, y0, W, H)
    if (o.holes) o.holes.forEach(p => { h += F.circle(x0 + p[0] * ppm, y0 + p[1] * ppm, p[2] * ppm, { fill: '#FFFFFF', w: 1.8 }) })
    const fs = o.s || 14
    h += F.dim(x0, y0 + H, x0 + W, y0 + H, o.askL ? '?' : n(dl) + ' mm', 28, { ask: o.askL, s: fs })
    h += F.dim(x0, y0, x0, y0 + H, o.askW ? '?' : n(dw) + ' mm', 30, { ask: o.askW, s: fs })
    h += '<rect x="' + (x0 + W - 126) + '" y="4" width="126" height="28" fill="#FFFFFF" stroke="' + C.ink + '" stroke-width="1.2"/>' + F.t(x0 + W - 63, 23, 'SCALE ' + scale, { s: fs, b: true })
    return F.svg(x0 + W + 30, y0 + H + 46, h, { max: o.max || '3.4in' })
  }
  /* right triangle drawn to scale with base and height dimensions. ask: 'b' or 'h' */
  function tri(b, hgt, sc, o) {
    o = o || {}
    const x0 = 70, yb = 14 + hgt * sc
    const A = [x0, yb], Bp = [x0 + b * sc, yb], Cp = [x0, yb - hgt * sc]
    let h = F.poly([A, Bp, Cp]) + F.rightMark(A, [1, 0], [0, -1])
    h += F.dim(A[0], A[1], Bp[0], Bp[1], o.ask === 'b' ? '?' : n(b) + ' mm', 26, { ask: o.ask === 'b', s: 15 })
    h += F.dim(A[0], A[1], Cp[0], Cp[1], o.ask === 'h' ? '?' : n(hgt) + ' mm', -30, { ask: o.ask === 'h', s: 15 })
    if (o.name) h += F.t(x0 + b * sc / 2, yb + 56, o.name, { s: 16, b: true, c: C.edge })
    return F.svg(x0 + b * sc + 24, yb + 62, h, { max: o.max || ((x0 + b * sc + 24) / 96 * (o.k || 1)).toFixed(2) + 'in' })
  }
  /* rectangle with a length dimension below and a hidden width on the right */
  function rectAsk(l, w, sc, o) {
    o = o || {}
    const x0 = 14, y0 = 14, W = l * sc, H = w * sc
    let h = F.rect(x0, y0, W, H)
    h += F.dim(x0, y0 + H, x0 + W, y0 + H, n(l) + ' mm', 26, { s: 15 })
    h += F.dim(x0 + W, y0 + H, x0 + W, y0, '?', 26, { ask: true, s: 15 })
    return F.svg(x0 + W + 56, y0 + H + 50, h, { max: o.max || '2in' })
  }
  const side = (...svgs) => '<div style="display:flex;justify-content:center;align-items:flex-end;gap:28px">' + svgs.join('') + '</div>'

  /* percent equivalents table */
  const eq = [1, 5, 10, 12.5, 20, 25, 50, 75, 100, 150]
  const eqRows = eq.map(p => [n(p) + '%', n(p / 100), p === 100 ? '1' : L.frac(Math.round(p * 10), 1000)])

  /* worked numbers */
  const brk = 240, brkP = 15, brkPart = brk * brkP / 100
  const weld = 240, weldBad = 18, weldPct = weldBad / weld * 100
  const pipe = 85, allow = 10, pipeOrder = L.round(pipe * (1 + allow / 100), 2), pipeLen = 6, pipeLengths = Math.ceil(pipeOrder / pipeLen - 1e-9)
  const tool = 400, off = 30, toolNow = tool * (1 - off / 100)
  const w0 = 24, w1 = 25.2, wPct = L.round((w1 - w0) / w0 * 100, 6)
  const mix = 750, mb = 4, mh = 1, perPart = mix / (mb + mh)
  const pump = 1200, pumpMin = 8, pumpRate = pump / pumpMin, tank = 2700, tankMin = tank / pumpRate
  const ca = [12, 86.4], cb = [20, 138]
  const rateA = L.round(ca[1] / ca[0], 2), rateB = L.round(cb[1] / cb[0], 2)
  const bk = [8, 2.5], bkN = 20, bkT = bk[1] * bkN / bk[0]
  const scaleD = 63, scaleK = 50, scaleR = scaleD * scaleK
  const wall = 2400, wallK = 20, wallD = wall / wallK
  const imp = 3.5, impReal = imp / 0.25

  return L.join([
    B.chapter({
      num: 6, id: 'percent', title: 'Percent, Ratio and Proportion',
      intro: B.p('Shop math is full of comparisons. A waste allowance adds 10% to an order. A coating is mixed 4 parts to 1. A pump moves so many litres per minute. A drawing shows a 2,400 mm wall as a 120 mm line.',
        'This chapter shows how percents, ratios, rates and proportions work, how they connect to the fractions and decimals you already know, and how to read a scale drawing. Percent is shown on both calculators, because the Sharp EL-531XT and the TI-30Xa use the % key in different ways.'),
      objectives: ['Change between percents, decimals and fractions', 'Find a percent of a number, and find what percent one number is of another', 'Add a waste allowance and work out increases and decreases', 'Write and simplify ratios, and share an amount in a ratio', 'Work with rates and solve proportions', 'Read and make scale drawings in metric and imperial'],
      words: ['percent', 'ratio', 'rate', 'proportion', 'scale'],
      art: pctGrid(25, { g: 13, lab: ['25 of 100 squares', '= 25%', '= 0.25', '= 1/4'], max: '3.1in' })
    }),

    B.section('What percent means'),
    B.p(B.term('Percent', 'A number out of 100. 25% means 25 out of every 100, which is 0.25 or 1/4.') + ' means “out of 100”. The sign % stands for percent. 25% means 25 out of every 100. If a square is split into 100 equal parts and 25 of them are shaded, 25% of the square is shaded.',
      'A percent is one more way to write a part of a whole. You already know two others: a ' + B.term('fraction') + ' and a ' + B.term('decimal') + '. 25% = 25/100 = 0.25. All three describe the same amount.'),
    B.figure(dblLine([25, 50, 75]), 'Percent and decimal on the same line. 100% is the whole, which is 1.'),
    B.keyidea('Moving between percent and decimal', 'Percent to decimal: divide by 100, which moves the decimal point two places left. 35% = 0.35.', 'Decimal to percent: multiply by 100, which moves the decimal point two places right. 0.08 = 8%.'),
    B.example({
      title: 'Percent to decimal and fraction',
      q: 'Write 35%, 6.5% and 150% as decimals. Write 35% as a fraction in lowest terms.',
      steps: ['35% = 35 ÷ 100 = 0.35.', '6.5% = 6.5 ÷ 100 = 0.065. The point moves two places left, so a zero fills the empty place.', '150% = 150 ÷ 100 = 1.5. A percent over 100 is more than one whole.', '35% = 35/100. Divide the top and bottom by 5: 35/100 = 7/20.'],
      answer: '0.35, 0.065 and 1.5. 35% = ' + L.frac(35, 100) + '.'
    }),
    B.example({
      title: 'Fraction to percent',
      q: 'A crew has finished 3/8 of a pipe run. What percent is finished?',
      steps: ['Change the fraction to a decimal: 3 ÷ 8 = 0.375.', 'Multiply by 100 to change the decimal to a percent: 0.375 × 100 = 37.5.'],
      calc: { seq: '3 ÷ 8 × 100 =', expect: '37.5' },
      answer: '37.5% is finished.'
    }),
    B.table(['Percent'].concat(eqRows.map(r => r[0])), [['Decimal'].concat(eqRows.map(r => r[1])), ['Fraction'].concat(eqRows.map(r => r[2]))], { align: ['', 'c', 'c', 'c', 'c', 'c', 'c', 'c', 'c', 'c', 'c'], caption: 'Percents you will meet often, with their decimals and fractions in lowest terms.' }),
    B.tryIt([
      { q: 'Write 42% as a decimal.', a: n(0.42) },
      { q: 'Write 7.5% as a decimal.', a: n(0.075) },
      { q: 'Write 0.06 as a percent.', a: '6%' },
      { q: 'Write 1.25 as a percent.', a: '125%' },
      { q: 'Write 40% as a fraction in lowest terms.', a: L.frac(40, 100) },
      { q: 'Write ' + L.fr(5, 8) + ' as a percent.', a: n(5 / 8 * 100) + '%' }
    ]),

    B.section('Finding a percent of a number'),
    B.p('In a percent question, the word “of” means multiply. To find 15% of 240, change 15% to a decimal and multiply: 0.15 × 240.',
      'Both calculators also have a % key. They use it in different ways. On the TI-30Xa the % key is a second function, and you finish with = (TI-30Xa guidebook, p. 4). On the Sharp EL-531XT, 2ndF % works the calculation out by itself, so there is no = at the end (Sharp EL-531XT Calculation Examples [4]).'),
    B.example({
      title: 'Brackets for a second job',
      q: 'A pallet holds ' + brk + ' brackets. ' + brkP + '% of them are set aside for a second job. How many brackets is that?',
      steps: ['Change the percent to a decimal: ' + brkP + '% = ' + n(brkP / 100) + '.', 'Multiply: ' + n(brkP / 100) + ' × ' + brk + ' = ' + n(brkPart) + '.'],
      calc: { seq: brk + ' × ' + brkP + ' % =', expect: n(brkPart), say: 'With the % key, the TI-30Xa keys end with =, and the Sharp keys end with 2ndF %. The decimal method, ' + n(brkP / 100) + ' × ' + brk + ' =, gives ' + n(brkPart) + ' on both calculators too.' },
      answer: n(brkPart) + ' brackets.'
    }),
    B.watch('The Sharp % key ends the calculation', 'On the Sharp EL-531XT, do not press = after 2ndF %. The answer is already on the display. On the TI-30Xa, press = after % to finish.'),
    B.tip('A quick 10% check', '10% of a number is the number divided by 10: move the decimal point one place left. 10% of 240 is 24, so 15% must be about one and a half times that, 36. Use this to check your calculator answer.'),
    B.tryIt([
      { q: '20% of 450', a: n(0.2 * 450) },
      { q: '8% of 1,250', a: n(0.08 * 1250) },
      { q: '75% of 64', a: n(0.75 * 64) },
      { q: '2.5% of 3,000', a: n(0.025 * 3000) },
      { q: 'A box of 500 bolts. 4% are rejected. How many bolts are rejected?', a: n(0.04 * 500) + ' bolts' },
      { q: '10% of 6,096 mm', a: n(609.6) + ' mm' }
    ]),

    B.section('Finding the percent and the whole'),
    B.p('Sometimes you know the part and the whole and you want the percent. Divide the part by the whole, then multiply by 100.'),
    B.formula('Percent of a whole', ['Percent = Part ÷ Whole × 100'], 'The part and the whole must be in the same unit.'),
    B.example({
      title: 'Welds that failed inspection',
      q: 'An inspector checks ' + weld + ' welds and ' + weldBad + ' of them fail. What percent fail?',
      steps: ['The part is ' + weldBad + ' and the whole is ' + weld + '.', weldBad + ' ÷ ' + weld + ' = ' + n(weldBad / weld) + '.', n(weldBad / weld) + ' × 100 = ' + n(weldPct) + '.'],
      calc: { seq: weldBad + ' ÷ ' + weld + ' % =', expect: n(weldPct), say: 'Here the % key does the × 100. Keying ' + weldBad + ' ÷ ' + weld + ' × 100 = gives the same ' + n(weldPct) + '.' },
      answer: n(weldPct) + '% of the welds fail.'
    }),
    B.p('When you know the part and the percent, you can find the whole. Change the percent to a decimal and divide the part by it. In Example 6.3, ' + brkPart + ' brackets were ' + brkP + '% of the pallet. If you did not know the pallet size, you could find it: ' + brkPart + ' ÷ ' + n(brkP / 100) + ' = ' + n(brkPart / (brkP / 100)) + ' brackets.'),
    B.check(brkPart + ' ÷ ' + n(brkP / 100) + ' =', n(brkPart / (brkP / 100))),
    B.keyidea('Three questions, one relationship', 'Part = decimal × Whole. Find the part by multiplying. Find the decimal by dividing the part by the whole. Find the whole by dividing the part by the decimal.'),
    B.tryIt([
      { q: '45 is what percent of 180?', a: n(45 / 180 * 100) + '%' },
      { q: '12 is what percent of 400?', a: n(12 / 400 * 100) + '%' },
      { q: '9 of 60 parts are scrap. What percent is scrap?', a: n(9 / 60 * 100) + '%' },
      { q: '30 is 25% of what number?', a: n(30 / 0.25) },
      { q: '18 is 6% of what number?', a: n(18 / 0.06) },
      { q: 'A 750 mm piece is cut from a 3,000 mm bar. What percent of the bar is the piece?', a: n(750 / 3000 * 100) + '%' }
    ]),

    B.section('Waste allowance, increase and decrease'),
    B.p('Some material is always lost to cutting, fitting and mistakes. A waste allowance is extra material added to an order to cover that loss. A 10% waste allowance means you order the amount you need plus 10% of it.',
      'Adding a percent is a percent increase. Taking a percent away is a percent decrease. You can do either in two steps (find the percent, then add or subtract it) or in one step by multiplying. To add 10%, multiply by 1.10, which is 110%. To take off 30%, multiply by 0.70, which is 70%.'),
    B.example({
      title: 'Ordering pipe with a waste allowance',
      fig: G.allowBar(pipe, pipe * allow / 100, pipe + ' m', allow + '%', { w: 330 }),
      q: 'A job needs ' + pipe + ' m of pipe. Add a ' + allow + '% waste allowance. The pipe is sold in ' + pipeLen + ' m lengths. How many lengths do you order?',
      steps: [allow + '% of ' + pipe + ' = ' + n(allow / 100) + ' × ' + pipe + ' = ' + n(pipe * allow / 100) + ' m.', 'Add it on: ' + pipe + ' + ' + n(pipe * allow / 100) + ' = ' + n(pipeOrder) + ' m.', 'Lengths: ' + n(pipeOrder) + ' ÷ ' + pipeLen + ' = ' + n(L.round(pipeOrder / pipeLen, 4)) + '…', 'A part length still has to be bought, so round up to ' + pipeLengths + '.'],
      calc: { seq: pipe + ' + ' + allow + ' % =', expect: n(pipeOrder), say: 'Pressing + and then % adds ' + allow + '% of ' + pipe + ' to ' + pipe + ' on both calculators (TI-30Xa guidebook, p. 4, and Sharp EL-531XT Calculation Examples [4]). In one step without the % key: ' + pipe + ' × 1.1 = ' + n(pipeOrder) + '.' },
      answer: n(pipeOrder) + ' m of pipe, which is ' + pipeLengths + ' lengths.'
    }),
    B.example({
      title: 'A sale price',
      q: 'A tool is priced at ' + money(tool) + '. It is on sale at ' + off + '% off. What is the sale price?',
      steps: [off + '% of ' + money(tool) + ' = ' + n(off / 100) + ' × ' + tool + ' = ' + money(tool * off / 100) + '.', 'Subtract: ' + money(tool) + ' − ' + money(tool * off / 100) + ' = ' + money(toolNow) + '. In one step: ' + n((100 - off) / 100) + ' × ' + tool + ' = ' + n(toolNow) + '.'],
      calc: { seq: tool + ' − ' + off + ' % =', expect: n(toolNow), say: 'Pressing − and then % takes ' + off + '% of ' + tool + ' away from ' + tool + ' on both calculators (TI-30Xa guidebook, p. 4, and Sharp EL-531XT Calculation Examples [4]).' },
      answer: 'The sale price is ' + money(toolNow) + '.'
    }),
    B.p('To find a percent change, find the amount of the change, divide it by the original amount (the amount before the change), and multiply by 100.'),
    B.formula('Percent change', ['Percent change = (New − Original) ÷ Original × 100'], 'A positive answer is an increase. A negative answer is a decrease.'),
    B.example({
      title: 'A pay raise',
      q: 'An apprentice’s wage goes from ' + money(w0) + ' to ' + money(w1) + ' an hour. What is the percent increase?',
      steps: ['Change: ' + money(w1) + ' − ' + money(w0) + ' = ' + money(w1 - w0) + '.', 'Divide by the original wage: ' + n(L.round(w1 - w0, 2), 2) + ' ÷ ' + n(w0, 2) + ' = ' + n(L.round((w1 - w0) / w0, 4)) + '.', 'Multiply by 100: ' + n(wPct) + '%.'],
      calc: { seq: '( ' + w1 + ' − ' + w0 + ' ) ÷ ' + w0 + ' × 100 =', expect: n(wPct), say: 'The brackets make both calculators find the change before dividing.' },
      answer: 'A ' + n(wPct) + '% increase.'
    }),
    B.watch('Up 10% and down 10% is not a round trip', 'Start with 200. Up 10% gives 200 × 1.1 = ' + n(L.round(200 * 1.1, 6)) + '. Down 10% from there gives ' + n(220) + ' × 0.9 = ' + n(L.round(220 * 0.9, 6)) + ', not 200. Each percent is taken of a different starting amount.'),
    B.tryIt([
      { q: 'Add a 15% waste allowance to 60 m of cable.', a: n(L.round(60 * 1.15, 6)) + ' m' },
      { q: 'You need 24 sheets. Add a 10% allowance and round up to whole sheets.', a: Math.ceil(24 * 1.1 - 1e-9) + ' sheets (' + n(L.round(24 * 1.1, 6)) + ' rounded up)' },
      { q: 'A ' + money(250) + ' price is cut by 20%. New price?', a: money(250 * 0.8) },
      { q: 'A 1,200 mm piece grows by 5%. New length?', a: n(L.round(1200 * 1.05, 6)) + ' mm' },
      { q: 'A price rises from ' + money(80) + ' to ' + money(92) + '. Percent increase?', a: n(L.round((92 - 80) / 80 * 100, 6)) + '%' },
      { q: 'A tank level drops from 1,500 L to 1,200 L. Percent decrease?', a: n(L.round((1500 - 1200) / 1500 * 100, 6)) + '%' }
    ]),

    B.section('Ratio'),
    B.p('A ' + B.term('ratio', 'A comparison of two amounts by division, written 3 : 1, 3 to 1 or 3/1.') + ' compares two amounts. A coating mixed 4 parts base to 1 part hardener has a ratio of base to hardener of 4 to 1. You can write it three ways: 4 : 1, 4 to 1 or 4/1.',
      'Order matters. The ratio of hardener to base is 1 : 4, not 4 : 1. A ratio is simplified the same way as a fraction: divide both numbers by the same number until they share no common factor. Before you compare two amounts, put them in the same unit.'),
    B.figure(mixBar([{ k: mb, name: 'Base', sub: mb + ' parts' }, { k: mh, name: 'Hardener', sub: mh + ' part', fill: C.gold }]), 'A mix of ' + mb + ' : ' + mh + '. Every part is the same size.'),
    B.p('For example, to compare a 750 mm piece with a 2.5 m piece, first write 2.5 m as 2,500 mm. The ratio 750 : 2,500 simplifies to 3 : 10 when you divide both numbers by 250.'),
    B.example({
      title: 'Sharing an amount in a ratio',
      q: 'You need ' + mix + ' mL of mixed coating. The label gives a mix of ' + mb + ' parts base to ' + mh + ' part hardener. How much of each do you measure?',
      fig: mixBar([{ k: mb, name: 'Base' }, { k: mh, name: 'Hardener', fill: C.gold }], { u: 40, max: '2.4in' }),
      steps: ['Add the parts: ' + mb + ' + ' + mh + ' = ' + (mb + mh) + ' parts.', 'One part: ' + mix + ' ÷ ' + (mb + mh) + ' = ' + perPart + ' mL.', 'Base: ' + mb + ' × ' + perPart + ' = ' + n(mb * perPart) + ' mL. Hardener: ' + mh + ' × ' + perPart + ' = ' + perPart + ' mL.', 'Check: ' + n(mb * perPart) + ' + ' + perPart + ' = ' + mix + ' mL.'],
      calc: { seq: mix + ' ÷ ' + (mb + mh) + ' × ' + mb + ' =', expect: n(mb * perPart) },
      answer: n(mb * perPart) + ' mL of base and ' + perPart + ' mL of hardener.'
    }),
    B.tryIt([
      { q: 'Write 12 : 18 in lowest terms.', a: '2 : 3' },
      { q: 'Write 48 teeth to 16 teeth in lowest terms.', a: '3 : 1' },
      { q: 'Write 400 mm to 1.2 m in lowest terms.', a: '1 : 3' },
      { q: 'Share 900 mL in the ratio 2 : 1.', a: n(600) + ' mL and ' + n(300) + ' mL' },
      { q: 'Share 2 L in the ratio 3 : 1. Give the answers in mL.', a: n(1500) + ' mL and ' + n(500) + ' mL' },
      { q: 'A crew has 3 journeypersons and 5 apprentices. Ratio of apprentices to journeypersons?', a: '5 : 3' }
    ]),

    B.section('Rate'),
    B.p('A ' + B.term('rate', 'A ratio that compares two amounts in different units, such as litres per minute or dollars per metre.') + ' compares two amounts in different units: litres per minute, dollars per metre, millimetres per minute. A unit rate is the amount for one unit, such as 150 L in one minute. Find it by dividing.'),
    B.example({
      title: 'Pump rate',
      q: 'A pump moves ' + n(pump) + ' L in ' + pumpMin + ' minutes. What is its rate? At that rate, how long does it take to fill a ' + n(tank) + ' L tank?',
      steps: ['Rate: ' + n(pump) + ' ÷ ' + pumpMin + ' = ' + pumpRate + ' L per minute.', 'Time: ' + n(tank) + ' ÷ ' + pumpRate + ' = ' + tankMin + ' minutes.'],
      calc: { rows: [{ label: 'Rate', seq: pump + ' ÷ ' + pumpMin + ' =', expect: n(pumpRate) }, { label: 'Time', seq: tank + ' ÷ ' + pumpRate + ' =', expect: n(tankMin) }] },
      answer: pumpRate + ' L per minute. The tank takes ' + tankMin + ' minutes.'
    }),
    B.tryIt([
      { q: '450 mm of weld in 3 minutes. Rate in mm per minute?', a: n(450 / 3) + ' mm per minute' },
      { q: '96 fittings in 8 hours. Fittings per hour?', a: n(96 / 8) },
      { q: 'A pump moves 75 L per minute. How long for 1,800 L?', a: n(1800 / 75) + ' minutes' },
      { q: 'Supplier A: ' + ca[0] + ' m of cable for ' + money(ca[1]) + '. Supplier B: ' + cb[0] + ' m for ' + money(cb[1]) + '. Which costs less per metre?', a: 'B: ' + money(rateB) + ' per m (A is ' + money(rateA) + ' per m)' },
      { q: 'At ' + money(7.25) + ' per metre, what do 18 m cost?', a: money(7.25 * 18) },
      { q: 'A drill bit cuts 120 holes in 40 minutes. Holes per minute?', a: n(120 / 40) }
    ]),

    B.section('Proportion'),
    B.p('A ' + B.term('proportion', 'A statement that two ratios are equal, such as 1/4 = 5/20.') + ' says that two ratios are equal. 1/4 = 5/20 is a proportion, because both ratios simplify to 1 : 4. In a proportion the cross products are equal: 1 × 20 = 4 × 5 = 20.',
      'When one of the four numbers is missing, set up the two ratios with the same units in the same places, then solve for the missing number.'),
    B.formula('Solving a proportion', ['a ÷ b = c ÷ x', 'x = b × c ÷ a'], 'Multiply the two numbers that sit across from each other, then divide by the third.'),
    B.example({
      title: 'Welding time for a larger order',
      q: 'A welder finishes ' + bk[0] + ' brackets in ' + bk[1] + ' hours. At the same rate, how long do ' + bkN + ' brackets take?',
      steps: ['Write the proportion with brackets on top and hours below: ' + bk[0] + '/' + bk[1] + ' = ' + bkN + '/x.', 'Cross multiply: ' + bk[0] + ' × x = ' + bk[1] + ' × ' + bkN + ' = ' + n(bk[1] * bkN) + '.', 'Divide: x = ' + n(bk[1] * bkN) + ' ÷ ' + bk[0] + ' = ' + n(bkT) + ' hours.', n(bkT) + ' hours is 6 hours and 0.25 × 60 = ' + n(0.25 * 60) + ' minutes.'],
      calc: { seq: bk[1] + ' × ' + bkN + ' ÷ ' + bk[0] + ' =', expect: n(bkT) },
      answer: n(bkT) + ' hours, which is 6 hours 15 minutes.'
    }),
    B.watch('Keep the units lined up', 'If brackets are on top in the first ratio, brackets go on top in the second ratio too. Mixing them up gives an answer that is far too big or far too small. Check it with common sense: more brackets must take more time.'),
    B.tryIt([
      { q: 'Is 3/4 = 15/20 a proportion?', a: 'Yes. 3 × 20 = 4 × 15 = 60' },
      { q: 'Solve 2/5 = x/45.', a: 'x = ' + n(2 * 45 / 5) },
      { q: 'Solve 6/x = 9/24.', a: 'x = ' + n(6 * 24 / 9) },
      { q: '5 brackets use 3 m of flat bar. How much bar do 35 brackets use?', a: n(3 * 35 / 5) + ' m' },
      { q: 'A crew lays 18 m of pipe in 4 hours. How long for 45 m?', a: n(4 * 45 / 18) + ' hours' },
      { q: 'A mix is 3 : 1. You have 1.8 L of the first part. How much of the second part?', a: n(1.8 / 3) + ' L' }
    ]),

    B.section('Scale drawings'),
    B.p('A drawing of a large part is smaller than the part. The ' + B.term('scale', 'The ratio of a length on a drawing to the real length. At 1 : 20, 1 mm on the drawing stands for 20 mm on the real part.') + ' is the ratio of a length on the drawing to the real length. A scale of 1 : 20 means 1 mm on the drawing stands for 20 mm on the real part.',
      'Drawing to real: multiply by the second number. Real to drawing: divide by it. A larger second number gives a smaller drawing. A scale such as 2 : 1 makes the drawing larger than the part, which is useful for small details.'),
    B.figure(scalePlate(60, 35, '1 : 20', { holes: [[10, 17.5, 3], [50, 17.5, 3]], ppm: 3.4, max: '2.4in' }), 'A plate drawn at 1 : 20. The sizes shown are the lengths measured on the paper.'),
    B.p('The plate above measures 60 mm by 35 mm on the paper, so the real plate is 60 × 20 = ' + n(60 * 20) + ' mm long and 35 × 20 = ' + n(35 * 20) + ' mm wide.'),
    B.example({
      title: 'Measuring a drawing',
      q: 'A line on a drawing at 1 : ' + scaleK + ' measures ' + scaleD + ' mm with a rule, as shown. How long is the real part?',
      fig: F.mmRuler(0, 70, [{ v: scaleD, lab: scaleD + ' mm' }], { ppm: 5, max: '3.3in' }).replace(/font-size="10"([^>]*>cm<)/, 'font-size="14"$1'),
      steps: ['Drawing to real, so multiply by ' + scaleK + '.', scaleD + ' × ' + scaleK + ' = ' + n(scaleR) + ' mm.'],
      calc: { seq: scaleD + ' × ' + scaleK + ' =', expect: n(scaleR) },
      answer: n(scaleR) + ' mm, which is ' + n(scaleR / 1000) + ' m.'
    }),
    B.p('A scale can also be written as two lengths. A drawing that states its scale as 1/4″ = 1′-0″ uses 1/4 inch on the drawing for 1 foot on the real job. Since 1 ft = 12 in, that ratio is 1/4 : 12, which is 1 : 48.'),
    B.example({
      title: 'An imperial scale',
      q: 'A drawing is marked 1/4″ = 1′-0″. A line measures 3 1/2 in, as shown. How long is the real length?',
      fig: F.inchRuler(4, 16, [{ v: imp, lab: '3 1/2' }], { ppi: 64, max: '3.1in' }),
      steps: ['Count how many quarter inches are in the line: ' + n(imp) + ' ÷ 0.25 = ' + impReal + '.', 'Each quarter inch is 1 ft, so the real length is ' + impReal + ' ft.'],
      calc: { seq: n(imp) + ' ÷ 0.25 =', expect: n(impReal) },
      answer: impReal + ' ft'
    }),
    B.tryIt([
      { q: 'At 1 : 10, a line measures 48 mm. Real length?', a: n(480) + ' mm' },
      { q: 'At 1 : 25, a line measures 72 mm. Real length?', a: n(72 * 25) + ' mm' },
      { q: 'A 3,000 mm beam is drawn at 1 : 50. Drawing length?', a: n(3000 / 50) + ' mm' },
      { q: 'A 12 mm part is drawn at 5 : 1. Drawing length?', a: n(12 * 5) + ' mm' },
      { q: 'A 1,500 mm part is drawn 75 mm long. What is the scale?', a: '75 : 1,500 = 1 : 20' },
      { q: 'At 1/4″ = 1′-0″, a line measures 2 3/4 in. Real length?', a: n(2.75 / 0.25) + ' ft' }
    ]),

    B.worksheet({ title: 'Percent on the canvas', sub: 'Find each red ?', intro: 'Show the decimal you multiply or divide by. Check each answer with a 10% estimate.' }),
    B.grid2(
      B.prob({ q: 'Write the shaded part as a percent, a decimal and a fraction in lowest terms.', canvas: pctGrid(35, { g: 11, max: '1.1in' }), a: '35%, ' + n(0.35) + ', ' + L.frac(35, 100), mode: 'Read the drawing', lines: 2 }),
      B.prob({ q: 'The width is 40% of the length. Find the width.', canvas: rectAsk(1250, 500, 0.2, { max: '2.1in' }), a: n(0.4 * 1250) + ' mm', lines: 2 }),
      B.prob({ q: 'A run needs 120 m of conduit. Add a 15% waste allowance. How much do you order?', canvas: G.allowBar(120, 18, '120 m', '15%', { w: 330 }), a: n(L.round(120 * 1.15, 6)) + ' m', work: '120 × 1.15', lines: 2 }),
      B.prob({ q: 'A 2,400 mm bar is cut down to 1,800 mm. What is the percent decrease?', canvas: F.cutBar([{ len: 1800 }, { len: 600, lab: 'cut off' }], { totalLab: '2,400 mm', w: 330, max: G.fit(330, 12.5) }), a: n((2400 - 1800) / 2400 * 100) + '% decrease', lines: 2 }),
    ),
    B.prob({ q: 'Change one value: a 750 mm piece is made 20% longer. Then the new piece is made 20% shorter. Find both lengths. Is it back to 750 mm?', a: n(750 * 1.2) + ' mm, then ' + n(L.round(900 * 0.8, 6)) + ' mm. It is not back to 750 mm.', lines: 2 }),

    B.worksheet({ title: 'Ratio, proportion and scale', sub: 'Mixes, similar shapes and scale drawings', intro: 'Write each ratio or proportion before you calculate. Keep the same units in the same places.' }),
    B.grid2(
      B.prob({ q: 'A coating is mixed as shown. How many mL of base and of hardener make 2.4 L of mix?', canvas: G.mixBar([{ k: 3, name: 'Base' }, { k: 1, name: 'Hardener', fill: C.gold }], { u: 44 }), a: n(2400 * 3 / 4) + ' mL of base and ' + n(2400 / 4) + ' mL of hardener', work: '2,400 mL ÷ 4 parts = ' + n(2400 / 4) + ' mL per part', lines: 2 }),
      B.prob({ q: 'The sizes shown are measured on a 1 : 20 drawing. Find the real length and width.', canvas: scalePlate(48, 30, '1 : 20', { ppm: 2.8, s: 15, max: '1.6in' }), a: n(48 * 20) + ' mm by ' + n(30 * 20) + ' mm', lines: 2 }),
      B.prob({ q: 'Triangle B is triangle A made larger, so their sides are in proportion. Find the height of B.', canvas: G.side(G.tri(40, 30, 1.1, { name: 'A', k: 0.6 }), G.tri(120, 90, 1.1, { name: 'B', ask: 'h', k: 0.6 })), a: n(30 * 120 / 40) + ' mm', work: '40/30 = 120/x, so x = 30 × 120 ÷ 40', lines: 2 }),
      B.prob({ q: 'Change one value: the plate in Problem 2 is redrawn at 1 : 10. How long is its 960 mm side on the new drawing? What happens to every line?', a: n(960 / 10) + ' mm. Every line is twice as long as on the 1 : 20 drawing.', lines: 3 }),
      B.prob({ q: 'At 1/4″ = 1′-0″, find the real length of this line.', canvas: F.inchRuler(4, 16, [{ v: 3.25, lab: '3 1/4' }], { ppi: 40, max: G.fit(4 * 40 + 40, 13) }), a: n(3.25 / 0.25) + ' ft', work: '3.25 ÷ 0.25', mode: 'Read the drawing', lines: 2 }),
      B.prob({ q: 'A pump fills 1,500 L in 12 minutes. Find its rate, and the time to fill 2,250 L.', a: n(1500 / 12) + ' L per minute, ' + n(2250 / 125) + ' minutes', lines: 3 })
    )
  ])
}
