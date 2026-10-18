/* Exercise Book, Chapter 6: Percent, Ratio and Proportion */
module.exports = function (B, L) {
  const F = require('../engine/figs.js')
  const G = require('../engine/figs-ch06.js')
  const C = F.C
  const n = L.num
  const r = L.round
  const money = x => '$' + n(x, 2)
  const P = o => B.prob(Object.assign({ lines: 2 }, o))
  const bar = (pieces, o) => { const W = (o && o.w) || 340, s = F.cutBar(pieces, Object.assign({ w: W }, o)); return s.replace(/max-width:[\d.]+in/, 'max-width:' + G.fit(W, 12.5)) }

  /* Set B numbers */
  const run = 64, allowB = 12, runOrd = run * (1 + allowB / 100), runLen = 6.4, runPcs = Math.ceil(runOrd / runLen - 1e-9)
  const sheets = 18, shAllow = 15, shNeed = sheets * (1 + shAllow / 100), shBuy = Math.ceil(shNeed - 1e-9)
  const brg = 86.5, disc = 12, brgEach = r(brg * (1 - disc / 100), 2), brgN = 6
  const belt = [18, 45], beltRate = belt[0] / belt[1], beltT = 50 / beltRate
  const welds = [85, 6], wPct = welds[1] / welds[0] * 100
  const ang = [14, 9.8, 35], angNeed = ang[1] * ang[2] / ang[0]
  const ep = [5, 2, 1.4], epPart = ep[2] / (ep[0] + ep[1])
  const pr = [3.2, 3.68], prPct = (pr[1] - pr[0]) / pr[0] * 100
  const imp8 = 5.375, imp8ft = imp8 / 0.125

  return L.join([
    B.exChapter({ num: 6, id: 'percent', title: 'Percent, Ratio and Proportion', intro: 'Practice with percents, decimals and fractions, percent of a number, allowances, increases and decreases, ratios, rates, proportions and scale drawings.' }),

    B.worksheet({ title: 'Skills', sub: 'One skill at a time' }),
    B.grid2(
      P({ q: 'Write 64% as a decimal.', a: n(0.64) }),
      P({ q: 'Write 3.5% as a decimal.', a: n(0.035) }),
      P({ q: 'Write 0.7 as a percent.', a: '70%' }),
      P({ q: 'Write 2.4 as a percent.', a: '240%' }),
      P({ q: 'Write 45% as a fraction in lowest terms.', a: L.frac(45, 100) }),
      P({ q: 'Write ' + L.fr(7, 8) + ' as a percent.', a: n(7 / 8 * 100) + '%' }),
      P({ q: 'Find 30% of 260.', a: n(0.3 * 260) }),
      P({ q: 'Find 6.5% of 4,200.', a: n(0.065 * 4200) }),
      P({ q: '27 is what percent of 360?', a: n(27 / 360 * 100) + '%' }),
      P({ q: '42 is 35% of what number?', a: n(42 / 0.35) }),
      P({ q: 'Increase 340 by 15%.', a: n(340 * 1.15) }),
      P({ q: 'Decrease 1,250 by 8%.', a: n(1250 * 0.92) }),
      P({ q: 'A value goes from 48 to 60. What is the percent increase?', a: n((60 - 48) / 48 * 100) + '%' }),
      P({ q: 'Write 36 : 84 in lowest terms.', a: '3 : 7' }),
      P({ q: 'Write the ratio of 250 mm to 1.5 m in lowest terms.', a: '1 : 6', work: '250 : 1,500, divide both by 250' }),
      P({ q: 'Share 1,200 in the ratio 5 : 3.', a: n(750) + ' and ' + n(450), work: '1,200 ÷ 8 = 150 per part' }),
      P({ q: 'A tank fills with 840 L in 12 minutes. What is the rate in L per minute?', a: n(840 / 12) + ' L per minute' }),
      P({ q: 'Solve 7/x = 21/36.', a: 'x = ' + n(7 * 36 / 21) }),
      P({ q: 'At a scale of 1 : 40, a line measures 85 mm. How long is the real length?', a: n(85 * 40) + ' mm' }),
      P({ q: 'A 14 mm part is drawn at 3 : 1. How long is it on the drawing?', a: n(14 * 3) + ' mm' })
    ),
    B.check('6.5 × 4200 ÷ 100 =', '273'),
    B.check('27 ÷ 360 × 100 =', '7.5'),
    B.check('42 ÷ 0.35 =', '120'),
    B.check('340 + 15 % =', '391'),
    B.check('1250 − 8 % =', '1,150'),

    B.worksheet({ title: 'Shop problems', sub: 'Fabrication, pipe trades and millwright jobs' }),
    B.prob({ q: 'A pipe run needs ' + run + ' m of pipe. Add a ' + allowB + '% waste allowance. The pipe on this job comes in ' + runLen + ' m lengths. How many metres do you need, and how many lengths do you order?', a: n(runOrd) + ' m, ' + runPcs + ' lengths', work: run + ' × 1.12 = ' + n(runOrd) + ', ÷ ' + runLen + ' = ' + n(r(runOrd / runLen, 2)) + ', round up', lines: 3 }),
    B.check(run + ' + ' + allowB + ' % =', n(runOrd)),
    B.prob({ q: 'A fabrication job needs ' + sheets + ' sheets of 4 ft × 8 ft plate. Add a ' + shAllow + '% allowance and round up to whole sheets.', a: shBuy + ' sheets (' + n(shNeed) + ' rounded up)', lines: 3 }),
    B.check(sheets + ' × 1.15 =', n(shNeed)),
    B.prob({ q: 'A bearing lists at ' + money(brg) + '. Your shop gets a ' + disc + '% trade discount. What does one bearing cost? What do ' + brgN + ' cost? Round to the cent.', a: money(brgEach) + ' each, ' + money(brgEach * brgN) + ' for ' + brgN, work: brg + ' − 12% = ' + n(brgEach, 2) + ', × ' + brgN, lines: 3 }),
    B.check(brg + ' − ' + disc + ' % =', n(brgEach, 2)),
    B.prob({ q: 'A conveyor belt moves ' + belt[0] + ' m in ' + belt[1] + ' s. What is its rate in m per s? At that rate, how long does a part take to travel 50 m?', a: n(beltRate) + ' m per s, ' + n(beltT) + ' s', lines: 3 }),
    B.check('50 ÷ ( ' + belt[0] + ' ÷ ' + belt[1] + ' ) =', n(beltT)),
    B.prob({ q: 'Of ' + welds[0] + ' welds tested, ' + welds[1] + ' are rejected. What percent are rejected, to two decimal places?', a: n(wPct, 2) + '%', lines: 3 }),
    B.check(welds[1] + ' ÷ ' + welds[0] + ' % =', n(wPct, 2)),
    B.prob({ q: 'Cutting ' + ang[0] + ' brackets uses ' + ang[1] + ' m of angle iron. How much angle iron do ' + ang[2] + ' brackets use?', a: n(angNeed) + ' m', work: ang[1] + ' × ' + ang[2] + ' ÷ ' + ang[0], lines: 3 }),
    B.check(ang[1] + ' × ' + ang[2] + ' ÷ ' + ang[0] + ' =', n(angNeed)),
    B.prob({ q: 'A two-part epoxy is mixed ' + ep[0] + ' : ' + ep[1] + ' by volume. You need ' + ep[2] + ' L of mixed epoxy. How much of each part do you measure?', a: n(ep[0] * epPart) + ' L and ' + n(ep[1] * epPart) + ' L', work: ep[2] + ' ÷ 7 = ' + n(epPart) + ' L per part', lines: 3 }),
    B.check(ep[2] + ' ÷ 7 × 5 =', n(ep[0] * epPart)),
    B.prob({ q: 'A drawing is marked 1/8″ = 1′-0″. A line measures 5 3/8 in. How long is the real length?', a: n(imp8ft) + ' ft', work: '5.375 ÷ 0.125', lines: 3 }),
    B.check('5.375 ÷ 0.125 =', n(imp8ft)),
    B.prob({ q: 'Pipe insulation goes from ' + money(pr[0]) + ' to ' + money(pr[1]) + ' per foot. What is the percent increase?', a: n(prPct) + '%', lines: 3 }),
    B.check('( ' + pr[1] + ' − ' + pr[0] + ' ) ÷ ' + pr[0] + ' × 100 =', n(prPct)),
    B.prob({ q: 'A drive pulley is 300 mm across and the driven pulley is 120 mm across. Write the ratio of the drive pulley to the driven pulley in lowest terms.', a: '5 : 2', work: '300 : 120, divide both by 60', lines: 3 }),

    B.worksheet({ title: 'Shape Canvas', sub: 'Find each red ?' }),
    B.grid2(
      B.prob({ q: 'Write the shaded part as a percent, a decimal and a fraction in lowest terms.', canvas: G.pctGrid(62), a: '62%, ' + n(0.62) + ', ' + L.frac(62, 100), mode: 'Read the drawing', lines: 2 }),
      B.prob({ q: 'The width is 35% of the length. Find the width.', canvas: G.rect2(1600, 560, 0.12, '1,600 mm', '', { askW: true }), a: n(0.35 * 1600) + ' mm', lines: 2 })
    ),
    B.prob({ q: 'Two pieces are cut from a 4,800 mm bar. Find the offcut. What percent of the bar is the offcut?', canvas: bar([{ len: 1200 }, { len: 960 }], { total: 4800, askRest: true, w: 420 }), a: n(4800 - 2160) + ' mm, ' + n((4800 - 2160) / 4800 * 100) + '%', lines: 2 }),
    B.grid2(
      B.prob({ q: 'Triangle B is triangle A made larger. Find the height of B.', canvas: G.side(G.tri(50, 20, 1, { name: 'A', k: 0.66 }), G.tri(150, 60, 1, { name: 'B', ask: 'h', k: 0.66 })), a: n(20 * 150 / 50) + ' mm', work: '50/20 = 150/x', lines: 2 }),
      B.prob({ q: 'The sizes are measured on a 1 : 25 drawing. Find the real length and width.', canvas: G.scalePlate(56, 32, '1 : 25'), a: n(56 * 25) + ' mm by ' + n(32 * 25) + ' mm', lines: 2 }),
      B.prob({ q: 'Part A and Part B are mixed as shown. How much of each makes 1.5 L?', canvas: G.mixBar([{ k: 2, name: 'Part A' }, { k: 3, name: 'Part B', fill: C.gold }], { u: 44 }), a: n(0.6) + ' L of A and ' + n(0.9) + ' L of B', lines: 2 }),
      B.prob({ q: 'A drawing is marked 1/2″ = 1′-0″. Find the real length of the line in feet and inches.', canvas: F.inchRuler(3, 16, [{ v: 1.875, lab: '1 7/8' }], { ppi: 56, max: G.fit(208, 13) }), a: n(1.875 / 0.5) + ' ft = 3′ 9″', mode: 'Read the drawing', lines: 2 })
    ),
    B.check('1.875 ÷ 0.5 =', '3.75'),
    B.prob({ q: 'Change one value: a plate 800 mm × 500 mm is drawn at 1 : 10. Find the drawing sizes. Then find them at 1 : 5. What happens to every line?', canvas: G.rect2(800, 500, 0.22, '800 mm', '500 mm'), a: '80 mm × 50 mm at 1 : 10, 160 mm × 100 mm at 1 : 5. Every line is twice as long.', lines: 3 })
  ])
}
