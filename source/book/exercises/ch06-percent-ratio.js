/* Exercise Book, Chapter 6: Percent, Ratio and Proportion */
module.exports = function (B, L) {
  const F = require('../engine/figs.js')
  const G = require('../engine/figs-ch06.js')
  const C = F.C
  const n = L.num
  const r = L.round
  const money = x => '$' + n(x, 2)
  const P = o => B.prob(Object.assign({ lines: 3 }, o))
  const P4 = o => B.prob(Object.assign({ lines: 4 }, o))
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

  /* Set E numbers. Tax: GST 5% (CRA) and B.C. PST 7% (Province of B.C.), each found on the price before tax, to the cent */
  const PL = require('../engine/plates.js')
  const cent = x => r(x, 2)
  const pay1 = [38, 24.5], pay2 = [26.8, 46], pay2T = 40 * pay2[0] + (pay2[1] - 40) * pay2[0] * 1.5, stub = [1240, 287.15]
  const t1 = 185, t1g = cent(t1 * 0.05), t1p = cent(t1 * 0.07)
  const t2 = 64.99, t2g = cent(t2 * 0.05), t2p = cent(t2 * 0.07)
  const sw = 420, swOff = 15, swS = cent(sw * (1 - swOff / 100)), swG = cent(swS * 0.05), swP = cent(swS * 0.07), swT = cent(swS + swG + swP)
  const up1 = [44.98, 15.49], sc1 = 8.49, sc2 = 19.75, fuel = [46.2, 1.879]
  const rep1 = cent(95 * 2.75 + 48.6), rep1T = cent(rep1 + cent(rep1 * 0.05) + cent(rep1 * 0.07))

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
      P({ q: 'Solve ' + L.fr(7, 'x') + ' = ' + L.fr(21, 36) + '.', a: 'x = ' + n(7 * 36 / 21) }),
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
    B.prob({ q: 'A drawing is marked ' + L.fr(1, 8) + '″ = 1′-0″. A line measures ' + L.mx(5, 3, 8) + ' in. How long is the real length?', a: n(imp8ft) + ' ft', work: '5.375 ÷ 0.125', lines: 3 }),
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
      B.prob({ q: 'Triangle B is triangle A made larger. Find the height of B.', canvas: G.side(G.tri(50, 20, 1, { name: 'A', k: 0.6, out: true }), G.tri(150, 60, 1, { name: 'B', ask: 'h', k: 0.66 })), a: n(20 * 150 / 50) + ' mm', work: L.fr(50, 20) + ' = ' + L.fr(150, 'x'), lines: 2 }),
      B.prob({ q: 'The sizes are measured on a 1 : 25 drawing. Find the real length and width.', canvas: G.scalePlate(56, 32, '1 : 25'), a: n(56 * 25) + ' mm by ' + n(32 * 25) + ' mm', lines: 2 }),
      B.prob({ q: 'Part A and Part B are mixed as shown. How much of each makes 1.5 L?', canvas: G.mixBar([{ k: 2, name: 'Part A' }, { k: 3, name: 'Part B', fill: C.gold }], { u: 44 }), a: n(0.6) + ' L of A and ' + n(0.9) + ' L of B', lines: 2 }),
      B.prob({ q: 'A drawing is marked ' + L.fr(1, 2) + '″ = 1′-0″. The line above the rule is measured from 0 to the red mark. Find the real length of the line in feet and inches.', canvas: G.rulerFr(3, 16, [{ v: 1.875, parts: ['1', [7, 8]] }], { ppi: 56, line: true }), a: n(1.875 / 0.5) + ' ft = 3′ 9″', mode: 'Read the drawing', lines: 2 })
    ),
    B.check('1.875 ÷ 0.5 =', '3.75'),
    B.prob({ q: 'Change one value: a plate 800 mm × 500 mm is drawn at 1 : 10. Find the drawing sizes. Then find them at 1 : 5. What happens to every line?', canvas: G.rect2(800, 500, 0.22, '800 mm', '500 mm'), a: '80 mm × 50 mm at 1 : 10, 160 mm × 100 mm at 1 : 5. Every line is twice as long.', lines: 3 }),

    /* ---------- Set D: by hand, no calculator ---------- */
    B.worksheet({ title: 'By hand', sub: 'No calculator: percents over 100%, conversions and quick percents' }),
    B.grid2(
      P4({ q: 'Write 125% as a decimal.', a: n(1.25) }),
      P4({ q: 'Write 340% as a decimal.', a: n(3.4) }),
      P4({ q: 'Write 0.5% as a decimal.', a: n(0.005) }),
      P4({ q: 'Write 2.08 as a percent.', a: n(208) + '%' }),
      P4({ q: 'Write 0.015 as a percent.', a: n(1.5) + '%' }),
      P4({ q: 'Write ' + L.mx(1, 1, 2) + ' as a percent.', a: n((1 + 1 / 2) * 100) + '%' }),
      P4({ q: 'Write ' + L.mx(2, 3, 5) + ' as a percent.', a: n((2 + 3 / 5) * 100) + '%' }),
      P4({ q: 'Write ' + L.fr(3, 20) + ' as a percent.', a: n(3 / 20 * 100) + '%' }),
      P4({ q: 'Write 160% as a mixed number in lowest terms.', a: L.frac(160, 100) }),
      P4({ q: 'Write 225% as a mixed number in lowest terms.', a: L.frac(225, 100) }),
      P4({ q: 'Write 12.5% as a fraction in lowest terms.', a: L.frac(125, 1000) }),
      P4({ q: 'Write ' + L.fr(9, 25) + ' as a decimal and as a percent.', a: n(9 / 25) + ' and ' + n(9 / 25 * 100) + '%' }),
      P4({ q: 'Find 10% of 3,450.', a: n(345) }),
      P4({ q: 'Find 1% of 2,500.', a: n(25) }),
      P4({ q: 'Find 5% of 820. Hint: half of 10%.', a: n(41) }),
      P4({ q: 'Find 25% of 1,680. Hint: a quarter.', a: n(420) }),
      P4({ q: 'Find 35% of 240 as 10% + 10% + 10% + 5%.', a: n(0.35 * 240), work: '24 + 24 + 24 + 12' }),
      P4({ q: 'Find 150% of 64 as 100% + 50%.', a: n(1.5 * 64), work: '64 + 32' }),
      P4({ q: 'A new tank holds 140% of the old one. The old tank holds 500 L. What does the new one hold?', a: n(1.4 * 500) + ' L', work: '500 + 40% of 500 = 500 + 200' }),
      P4({ q: '18 is what percent of 12?', a: n(18 / 12 * 100) + '%', work: L.fr(18, 12) + ' = ' + L.mx(1, 1, 2) + ' = 150%' })
    ),

    /* ---------- Set E: money on the job ---------- */
    B.worksheet({ title: 'Money on the job', sub: 'Pay, overtime, sales tax, discounts and unit price' }),
    B.raw('<div class="ws-intro">Use GST 5% and B.C. PST 7%, the rates in Textbook Section 6.9. Find each tax on the price before tax, to the cent, then add.</div>'),
    B.prob({ q: 'An apprentice works ' + n(pay1[0]) + ' hours at ' + money(pay1[1]) + ' an hour. What is the pay before deductions?', a: money(pay1[0] * pay1[1]), lines: 3 }),
    B.check(pay1[0] + ' × ' + pay1[1] + ' =', n(pay1[0] * pay1[1], 2)),
    B.prob({ q: 'A worker earns ' + money(pay2[0]) + ' an hour for the first 40 hours. On this job, hours over 40 are paid at 1.5 times the hourly rate. This week the worker puts in ' + pay2[1] + ' hours. Find the pay before deductions.', a: money(pay2T), work: '40 × ' + n(pay2[0], 2) + ' = ' + money(40 * pay2[0]) + ', overtime ' + (pay2[1] - 40) + ' × ' + n(pay2[0] * 1.5, 2) + ' = ' + money((pay2[1] - 40) * pay2[0] * 1.5), lines: 3 }),
    B.check('40 × ' + pay2[0] + ' + ' + (pay2[1] - 40) + ' × ' + pay2[0] + ' × 1.5 =', n(pay2T, 2)),
    B.prob({ q: 'A pay stub shows gross pay of ' + money(stub[0]) + ' and deductions of ' + money(stub[1]) + '. What is the net pay?', a: money(stub[0] - stub[1]), lines: 3 }),
    B.prob({ q: 'A tool costs ' + money(t1) + ' before tax. Find the GST, the PST and the total.', a: 'GST ' + money(t1g) + ', PST ' + money(t1p) + ', total ' + money(t1 + t1g + t1p), lines: 3 }),
    B.check(t1 + ' × 5 % =', n(t1 * 0.05, 4)),
    B.check(t1 + ' × 7 % =', n(t1 * 0.07, 4)),
    B.prob({ q: 'A box of fittings costs ' + money(t2) + ' before tax. Find the GST, the PST and the total, to the cent.', a: 'GST ' + money(t2g) + ', PST ' + money(t2p) + ', total ' + money(t2 + t2g + t2p), work: 'GST ' + n(t2, 2) + ' × 0.05 = ' + n(r(t2 * 0.05, 4)) + ', PST ' + n(t2, 2) + ' × 0.07 = ' + n(r(t2 * 0.07, 4)), lines: 3 }),
    B.check(t2 + ' × 0.05 =', n(r(t2 * 0.05, 4))),
    B.check(t2 + ' × 0.07 =', n(r(t2 * 0.07, 4))),
    B.prob({ q: 'A saw is listed at ' + money(sw) + '. It is on sale at ' + swOff + '% off. Take off the discount first, then add GST and PST. What do you pay?', a: money(swT), work: 'Sale price ' + money(swS) + ', GST ' + money(swG) + ', PST ' + money(swP), lines: 3 }),
    B.check(sw + ' − ' + swOff + ' % =', n(swS, 2)),
    B.prob({ q: 'Primer comes in a 3.78 L can for ' + money(up1[0]) + ' and in a 0.946 L can for ' + money(up1[1]) + '. Find the price per litre of each, to the cent. Which is the better buy?', a: 'Large can ' + money(r(up1[0] / 3.78, 2)) + ' per L, small can ' + money(r(up1[1] / 0.946, 2)) + ' per L. The large can is the better buy.', lines: 3 }),
    B.check(up1[0] + ' ÷ 3.78 =', n(r(up1[0] / 3.78, 2), 2)),
    B.check(up1[1] + ' ÷ 0.946 =', n(r(up1[1] / 0.946, 2), 2)),
    B.prob({ q: 'A box of 100 screws costs ' + money(sc1) + '. A box of 250 costs ' + money(sc2) + '. Find the cost of one screw in each box, in cents to one decimal place. Which box costs less per screw?', a: n(r(sc1, 1), 1) + '¢ and ' + n(r(sc2 / 250 * 100, 1), 1) + '¢ per screw. The box of 250 costs less per screw.', lines: 3 }),
    B.check(sc2 + ' ÷ 250 × 100 =', n(r(sc2 / 250 * 100, 1), 1)),
    B.prob({ q: 'Three apprentices each work 7.5 hours at ' + money(21.4) + ' an hour. What is the total pay for the crew?', a: money(3 * 7.5 * 21.4), lines: 3 }),
    B.check('3 × 7.5 × 21.4 =', n(3 * 7.5 * 21.4, 2)),
    B.prob({ q: 'A service truck takes ' + n(fuel[0]) + ' L of fuel at $' + fuel[1].toFixed(3) + ' per litre, the price on the pump. What does the fill cost, to the cent?', a: money(r(fuel[0] * fuel[1], 2)), lines: 3 }),
    B.check(fuel[0] + ' × ' + fuel[1] + ' =', n(r(fuel[0] * fuel[1], 2), 2)),
    B.prob({ q: 'A box of gloves goes from ' + money(12.5) + ' to ' + money(13.75) + '. What is the percent increase?', a: n((13.75 - 12.5) / 12.5 * 100) + '%', lines: 3 }),
    B.check('( 13.75 − 12.5 ) ÷ 12.5 × 100 =', n((13.75 - 12.5) / 12.5 * 100)),
    B.prob({ q: 'A shop charges ' + money(95) + ' an hour for labour. A repair takes 2.75 hours and ' + money(48.6) + ' in parts. Labour and parts are both taxable. Find the total with GST and PST.', a: money(rep1T), work: 'Before tax ' + money(rep1) + ', GST ' + money(r(rep1 * 0.05, 2)) + ', PST ' + money(r(rep1 * 0.07, 2)), lines: 3 }),
    B.check('95 × 2.75 + 48.6 =', n(rep1, 2)),

    /* ---------- Set K: carpentry and the BCBC ---------- */
    B.raw((B.wsN = 10, '')),
    B.worksheet({ title: 'Carpentry and the BCBC', sub: 'Roof slope, waste allowance, scale drawings and crew time' }),
    B.raw('<div class="ws-intro">Problems 1 and 2 use Table 9.26.3.1, Roofing Types and Slope Limits, which forms part of Sentence 9.26.3.1.(1) of the BC Building Code 2024 (' + PL.cite('9.26.3.1') + '). It gives a minimum slope of 1 in 3 for asphalt shingles in normal application and 1 in 6 in low slope application. Waste allowances and sheet sizes are given in each problem.</div>'),
    B.prob({ q: 'A roof rises 5 in for every 12 in of run. Write the slope as “1 in ?”. Is it at least the minimum slope for asphalt shingles in normal application (1 in 3, Table 9.26.3.1, page 9-242)?', a: '1 in ' + n(12 / 5) + '. Yes. 1 in ' + n(12 / 5) + ' is steeper than 1 in 3.', work: '12 ÷ 5 = ' + n(12 / 5) + '. A smaller second number means a steeper roof.', lines: 3 }),
    B.prob({ q: 'A porch roof is framed at 3 in 12. Write it as “1 in ?”. Can asphalt shingles go on in normal application (minimum 1 in 3)? In low slope application (minimum 1 in 6)? Use Table 9.26.3.1, page 9-242.', a: '1 in ' + n(12 / 3) + '. Not in normal application. Yes in low slope application.', work: '12 ÷ 3 = 4. 1 in 4 is flatter than 1 in 3 but steeper than 1 in 6.', lines: 3 }),
    B.prob({ q: 'Write a slope of 1 in 3 as a rise in 12.', a: n(12 / 3) + ' in 12', work: L.fr(1, 3) + ' = ' + L.fr('x', 12), lines: 3 }),
    B.prob({ q: 'A roof is framed at 4 in 12. Its horizontal run is 3,600 mm. How far does the roof rise over that run?', a: n(3600 * 4 / 12) + ' mm', work: L.fr(4, 12) + ' = ' + L.fr('x', '3,600'), lines: 3 }),
    B.prob({ q: 'A roof is framed at 6 in 12. Its run is 14 ft. How far does it rise, in feet?', a: n(14 * 6 / 12) + ' ft', lines: 3 }),
    B.prob({ q: 'A wall needs 42 sheets of sheathing. The estimate adds a 10% waste allowance. How many whole sheets do you order?', a: Math.ceil(42 * 1.1 - 1e-9) + ' sheets (' + n(r(42 * 1.1, 6)) + ' rounded up)', lines: 3 }),
    B.prob({ q: 'A floor is 36.5 m². The flooring estimate adds an 8% waste allowance. One box covers 2.2 m². How many m² do you need, and how many whole boxes?', a: n(r(36.5 * 1.08, 4)) + ' m², ' + Math.ceil(36.5 * 1.08 / 2.2 - 1e-9) + ' boxes', work: '36.5 × 1.08 = ' + n(r(36.5 * 1.08, 4)) + ', ÷ 2.2 = ' + n(r(36.5 * 1.08 / 2.2, 2)) + ', round up', lines: 3 }),
    B.check('36.5 × 1.08 ÷ 2.2 =', n(r(36.5 * 1.08 / 2.2, 2))),
    B.prob({ q: 'On a floor plan drawn at 1 : 50, a wall measures 128 mm. How long is the real wall, in metres?', a: n(128 * 50) + ' mm = ' + n(128 * 50 / 1000) + ' m', lines: 3 }),
    B.prob({ q: 'A 4,800 mm wall is drawn on a plan at 1 : 50. How long is it on the plan?', a: n(4800 / 50) + ' mm', lines: 3 }),
    B.prob({ q: 'A plan is drawn at ' + L.fr(1, 4) + '″ = 1′-0″. A room measures ' + L.mx(3, 1, 4) + ' in by ' + L.mx(2, 3, 4) + ' in on the plan. What are the real sizes?', a: n(3.25 / 0.25) + ' ft by ' + n(2.75 / 0.25) + ' ft', lines: 3 }),
    B.prob({ q: 'A concrete mix for a small pad is given as 1 part cement, 2 parts sand and 3 parts gravel by volume. How much of each is in 0.9 m³ of dry mix?', a: n(0.9 / 6) + ' m³ cement, ' + n(0.9 / 6 * 2) + ' m³ sand, ' + n(0.9 / 6 * 3) + ' m³ gravel', work: '0.9 ÷ 6 parts = ' + n(0.9 / 6) + ' m³ per part', lines: 3 }),
    B.prob({ q: 'Four framers can sheathe a roof in 9 hours. How long would six framers take, working at the same rate?', a: n(4 * 9 / 6) + ' hours', work: '4 × 9 = 36 framer-hours, ÷ 6', lines: 3 })
  ])
}
