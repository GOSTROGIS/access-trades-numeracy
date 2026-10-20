/* Exercise Book, Appendix B: Practice Assessment (gap plan item E2). One set, Exercise B1, 40 problems, no calculator.
   The skill order follows the skill areas of the ACCESS math assessment materials listed in gap/INVENTORY-TEXT.md
   section 12: whole numbers by hand (long division by 1- and 2-digit divisors), rounding to hundredths and
   thousandths, fraction operations, decimal operations, conversions, and percent of a number.
   Every number here is new. No item from the ACCESS assessment or its key is used. Answers are computed below. */
module.exports = function (B, L) {
  const n = L.num
  const fr = L.fr, mx = L.mx
  const g = (a, b) => L.gcd(a, b) || 1
  /* exact fractions as [numerator, denominator] */
  const R = (a, b) => [a / (g(a, b) * (b < 0 ? -1 : 1)), b / (g(a, b) * (b < 0 ? -1 : 1))]
  const add = (x, y) => R(x[0] * y[1] + y[0] * x[1], x[1] * y[1])
  const sub = (x, y) => R(x[0] * y[1] - y[0] * x[1], x[1] * y[1])
  const mul = (x, y) => R(x[0] * y[0], x[1] * y[1])
  const div = (x, y) => R(x[0] * y[1], x[1] * y[0])
  const M = (w, a, b) => [w * b + a, b]
  const F = x => L.frac(x[0], x[1])
  const longDiv = (a, b) => n(Math.floor(a / b)) + ' R ' + (a % b)
  const dec = (x, dp) => n(L.round(x, dp == null ? 6 : dp), dp)
  const pct = x => n(L.round(x * 100, 6)) + '%'

  const head = [
    B.exChapter({ num: 'B', id: 'assess', title: 'Practice Assessment', intro: 'Forty problems in the same skill order as the ACCESS math assessment: whole numbers, rounding, fractions, decimals, conversions and percent of a number. Work every problem by hand.' }),
    B.worksheet({ title: 'Practice assessment', sub: 'No calculator. Whole numbers, rounding, fractions, decimals, conversions and percent', intro: '<span class="nocalc">No calculator</span>Show your work in each box. Write a remainder with R, for example 12 R 3. Give fractions in lowest terms, and as mixed numbers when they are more than 1.' })
  ]
  const P = (q, a, o) => B.prob(Object.assign({ q, a, lines: 2 }, o || {}))

  /* whole numbers */
  const w = [
    P('Add: ' + n(3486) + ' + 927 + ' + n(12058) + ' + 674', n(3486 + 927 + 12058 + 674), { lines: 3 }),
    P('Add: ' + n(40503) + ' + ' + n(8769) + ' + 315 + ' + n(2097), n(40503 + 8769 + 315 + 2097), { lines: 3 }),
    P('Subtract: ' + n(7004) + ' − ' + n(2867), n(7004 - 2867), { lines: 3 }),
    P('Subtract: ' + n(30050) + ' − ' + n(14786), n(30050 - 14786), { lines: 3 }),
    P('Multiply: 486 × 307', n(486 * 307), { lines: 5 }),
    P('Multiply: 729 × 584', n(729 * 584), { lines: 5 }),
    P('Divide: ' + n(6437) + ' ÷ 8', longDiv(6437, 8), { lines: 5 }),
    P('Divide: ' + n(9215) + ' ÷ 23', longDiv(9215, 23), { lines: 5 }),
    P('Divide: ' + n(15628) + ' ÷ 47', longDiv(15628, 47), { lines: 5 })
  ]
  /* rounding */
  const r = [
    P('Round 18.4762 to the nearest hundredth.', dec(18.4762, 2)),
    P('Round 0.8349 to the nearest hundredth.', dec(0.8349, 2)),
    P('Round 7.30951 to the nearest thousandth.', dec(7.30951, 3)),
    P('Round 125.0896 to the nearest thousandth.', dec(125.0896, 3))
  ]
  /* fractions */
  const f = [
    P('Write ' + fr(29, 6) + ' as a mixed number.', F([29, 6])),
    P('Write ' + fr(47, 8) + ' as a mixed number.', F([47, 8])),
    P('Add: ' + fr(3, 8) + ' + ' + fr(7, 8), F(add([3, 8], [7, 8])), { lines: 3 }),
    P('Add: ' + fr(2, 3) + ' + ' + fr(3, 4), F(add([2, 3], [3, 4])), { lines: 3 }),
    P('Add: ' + mx(3, 5, 16) + ' + ' + mx(2, 3, 4), F(add(M(3, 5, 16), M(2, 3, 4))), { lines: 3 }),
    P('Subtract: ' + fr(7, 8) + ' − ' + fr(5, 16), F(sub([7, 8], [5, 16])), { lines: 3 }),
    P('Subtract: ' + mx(5, 1, 4) + ' − ' + mx(2, 11, 16), F(sub(M(5, 1, 4), M(2, 11, 16))), { lines: 3 }),
    P('Multiply: ' + mx(3, 3, 8) + ' × 6', F(mul(M(3, 3, 8), [6, 1])), { lines: 3 }),
    P('Divide: ' + fr(5, 6) + ' ÷ ' + fr(2, 9), F(div([5, 6], [2, 9])), { lines: 3 }),
    P('Divide: ' + mx(4, 1, 2) + ' ÷ 6', F(div(M(4, 1, 2), [6, 1])), { lines: 3 })
  ]
  /* decimals */
  const d = [
    P('Add: 14.6 + 3.075 + 0.48', dec(14.6 + 3.075 + 0.48), { lines: 3 }),
    P('Add: 206.3 + 9.87 + 41.059', dec(206.3 + 9.87 + 41.059), { lines: 3 }),
    P('Subtract: 52 − 17.384', dec(52 - 17.384), { lines: 3 }),
    P('Subtract: 9.05 − 3.678', dec(9.05 - 3.678), { lines: 3 }),
    P('Multiply: 4.73 × 0.6', dec(4.73 * 0.6), { lines: 3 }),
    P('Multiply: 12.5 × 3.08', dec(12.5 * 3.08), { lines: 3 }),
    P('Divide: 17.3 ÷ 6. Round to the nearest thousandth.', dec(17.3 / 6, 3), { lines: 3 })
  ]
  /* conversions */
  const c = [
    P('Write ' + fr(5, 8) + ' as a decimal.', dec(5 / 8, 3)),
    P('Write ' + fr(11, 16) + ' as a decimal rounded to the nearest thousandth.', dec(11 / 16, 3)),
    P('Write 0.064 as a fraction in lowest terms.', F(R(64, 1000))),
    P('Write 135% and 7.5% as decimals.', dec(1.35) + ' and ' + dec(0.075)),
    P('Write 0.068 and 2.4 as percents.', pct(0.068) + ' and ' + pct(2.4)),
    P('Write ' + mx(1, 3, 5) + ' and ' + fr(7, 20) + ' as percents.', pct(8 / 5) + ' and ' + pct(7 / 20)),
    P('Write 45% as a fraction in lowest terms.', F(R(45, 100)))
  ]
  /* percent of a number */
  const p = [
    P('Find 15% of 260.', dec(0.15 * 260)),
    P('Find 6% of ' + n(1450) + '.', dec(0.06 * 1450)),
    P('Find 125% of 48.', dec(1.25 * 48))
  ]
  const all = [w, r, f, d, c, p]
  if (all.flat().length !== 40) throw new Error('practice assessment must have 40 problems')
  return L.join([
    head,
    B.sub('Whole numbers'), B.grid2(w),
    B.sub('Rounding'), B.grid2(r),
    B.sub('Fractions'), B.grid2(f),
    B.sub('Decimals'), B.grid2(d),
    B.sub('Conversions'), B.grid2(c),
    B.sub('Percent of a number'), B.grid2(p)
  ])
}
