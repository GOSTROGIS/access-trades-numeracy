/* Exercise Book, Appendix A: Kitchen Math (gap plan item E4). One set, Exercise A1.
   Factors as in chapters/app-a-kitchen-math.js: metric cup 250 mL, Tbsp 15 mL, tsp 5 mL (Health Canada, read
   October 19, 2026), 1 lb = 0.45359237 kg exactly (units/gen.js), 1 oz = 1/16 lb (Weights and Measures Act).
   Yield percents are given as data in each problem. */
module.exports = function (B, L) {
  const F = require('../engine/figs.js')
  const n = L.num
  const money = x => '$' + n(x, 2)
  const LB = 0.45359237
  const bar = (ep, trim, o) => F.cutBar([{ len: ep, name: 'EP', lab: o.epLab, ask: o.askEp }, { len: trim, name: 'trim', lab: o.trimLab, ask: o.askTrim }],
    { unit: ' kg', fmt: v => n(v), totalLab: o.apLab, askTotal: o.askAp, w: 420, max: '3.1in' })

  const head = [
    B.exChapter({ num: 'A', id: 'kitchen', title: 'Kitchen Math', intro: 'Scaling recipes, cooking measures and food yield percent. Use a 250 mL cup, a 15 mL tablespoon and a 5 mL teaspoon.' }),
    B.worksheet({ title: 'Kitchen math', sub: 'Scaling factors, cups and spoons, pounds and ounces, and yield percent' })
  ]
  const p = []
  /* 1 to 4 scaling */
  p.push(B.prob({ q: 'A recipe makes 15 portions. Find the scaling factor to make 54 portions.', a: n(54 / 15), lines: 2 }))
  p.push(B.prob({ q: 'A recipe makes 60 portions. Find the scaling factor to make 45 portions.', a: n(45 / 60), lines: 2 }))
  p.push(B.prob({ q: 'A curry for 18 portions uses 2.7 kg of chicken. How much chicken for 42 portions?', a: n(L.round(2.7 * 42 / 18, 4)) + ' kg', work: '42 ÷ 18 × 2.7', lines: 2 }))
  p.push(B.prob({ q: 'A recipe makes 25 portions of 160 g. Find the scaling factor to make 70 portions of 200 g, and the new amount of a 1.25 kg ingredient.', a: 'Factor ' + n(70 * 200 / (25 * 160)) + ', ' + n(L.round(1.25 * 70 * 200 / (25 * 160), 4)) + ' kg', work: '70 × 200 = 14,000 g. 25 × 160 = 4,000 g. 14,000 ÷ 4,000 = 3.5', lines: 2 }))
  /* 5 to 8 measures */
  p.push(B.prob({ q: 'Change 3' + L.fr(1, 2) + ' cups to millilitres, using a 250 mL cup.', a: n(3.5 * 250) + ' mL', lines: 2 }))
  p.push(B.prob({ q: 'A glaze needs 5 Tbsp and 1 tsp of honey. Give the amount in millilitres and in teaspoons.', a: n(5 * 15 + 5) + ' mL, or ' + n(5 * 3 + 1) + ' tsp', lines: 2 }))
  p.push(B.prob({ q: 'Change 7 lb of carrots to kilograms. Round to three decimal places.', a: n(L.round(7 * LB, 3)) + ' kg', lines: 2 }))
  p.push(B.prob({ q: 'Change 20 oz of cheese to grams. Round to the nearest gram.', a: n(L.round(20 / 16 * LB * 1000, 0)) + ' g', work: '20 ÷ 16 = 1.25 lb, × 0.45359237 kg', lines: 2 }))
  /* 9 to 12 yield */
  p.push(B.prob({ q: 'A yield test on a 7.5 kg case of potatoes. Find the trim and the yield percent.', canvas: bar(6, 1.5, { epLab: '6 kg', askTrim: true, apLab: '7.5 kg as purchased' }), a: n(1.5) + ' kg of trim, ' + n(6 / 7.5 * 100) + '% yield', work: '6 ÷ 7.5 × 100', lines: 2 }))
  p.push(B.prob({ q: 'The yield percent is 65%. Find the amount as purchased.', canvas: F.cutBar([{ len: 5.2, name: 'EP', lab: '5.2 kg' }], { total: 8, restLab: 'trim', unit: ' kg', fmt: v => n(v), askTotal: true, w: 420, max: '3.1in' }), a: n(L.round(5.2 / 0.65, 4)) + ' kg', work: '5.2 ÷ 0.65', lines: 2 }))
  p.push(B.prob({ q: 'A kitchen’s yield test on pineapple gave 52%. How much pineapple is ready to serve from 15 kg as purchased?', a: n(15 * 0.52) + ' kg', lines: 2 }))
  p.push(B.prob({ q: 'A recipe needs 6 kg of trimmed leeks. The yield is 58%. How many kilograms must be bought? Round up to the next whole kilogram.', a: n(L.round(6 / 0.58, 3)) + ' kg, so buy ' + Math.ceil(6 / 0.58) + ' kg', work: '6 ÷ 0.58', lines: 2 }))
  p.push(B.prob({ q: 'Salmon costs $18.00 per kilogram as purchased. The yield after filleting is 60%. Find the cost per kilogram of EP.', a: money(18 / 0.6), work: '18.00 ÷ 0.60', lines: 2 }))
  p.push(B.prob({ q: 'Change one value: in Problem 13 the yield improves to 72%. Find the new cost per kilogram of EP. Is it more or less?', a: money(18 / 0.72) + '. It is less.', work: '18.00 ÷ 0.72', lines: 2 }))

  return L.join([
    head,
    B.grid2(p.slice(0, 4)),
    B.grid2(p.slice(4, 8)),
    B.grid2(p.slice(8, 10)),
    B.grid2(p.slice(10, 14)),
    B.check('42 ÷ 18 × 2.7 =', n(L.round(2.7 * 42 / 18, 4))),
    B.check('14000 ÷ 4000 × 1.25 =', n(L.round(1.25 * 3.5, 4))),
    B.check('7 × 0.45359237 =', n(L.round(7 * LB, 3))),
    B.check('20 ÷ 16 × 0.45359237 × 1000 =', n(L.round(20 / 16 * LB * 1000, 0))),
    B.check('6 ÷ 7.5 × 100 =', n(6 / 7.5 * 100)),
    B.check('5.2 ÷ 0.65 =', n(L.round(5.2 / 0.65, 4))),
    B.check('15 × 0.52 =', n(15 * 0.52)),
    B.check('6 ÷ 0.58 =', n(L.round(6 / 0.58, 3))),
    B.check('18 ÷ 0.6 =', n(18 / 0.6, 2)),
    B.check('18 ÷ 0.72 =', n(18 / 0.72, 2))
  ])
}
