/* Appendix A: Kitchen Math (gap plan item T12, decision "Kitchen math" included)
   Built by build.js after Chapter 13 as Appendix A. Numbers read A.1, A.2 and the worksheet is A1.
   Sources for every factor used here:
   - Health Canada, Canada's food guide, "Measure ingredients like a pro", canada.ca, page dated 2026-03-31,
     read October 19, 2026: the metric and cup and spoon list (250 mL = 1 cup, 15 mL = 1 Tbsp, 5 mL = 1 tsp ...)
   - NIST Special Publication 1038 (2006), Section 5.1.5 and footnote 19: the U.S. cup, tablespoon and teaspoon are
     8, 1/2 and 1/6 fluid ounce, 1 fluid ounce = 29.573\u00A053 mL, practical metric equivalents 250 mL, 15 mL, 5 mL
   - Weights and Measures Act (Canada), Schedule II: ounce = 1/16 pound. units/gen.js: 1 lb = 0.453\u00A0592\u00A037 kg exactly
   - Scaling factor (new yield divided by old yield) and EP = AP x yield percent, AP = EP / yield percent come from the
     ACCESS in-house lessons "recipe conversions ik" and "% food ik" (ACCESS property, reuse allowed)
   Yield percents in the problems are given as data from a kitchen's own yield test, never as typical values. */
module.exports = function (B, L) {
  const F = require('../engine/figs.js')
  const n = L.num
  const money = x => '$' + n(x, 2)
  const LB = 0.45359237
  const FLOZ = 29.57353
  /* a small table with no number, for inside an example or a worksheet problem */
  const tbl = (head, rows, al) => '<table class="t" style="width:100%">' + '<tr>' + head.map((h, i) => '<th class="' + ((al || [])[i] || '') + '">' + h + '</th>').join('') + '</tr>' +
    rows.map(r => '<tr>' + r.map((c, i) => '<td class="' + ((al || [])[i] || '') + '">' + c + '</td>').join('') + '</tr>').join('') + '</table>'

  /* Example A.1 soup */
  const s1 = { old: 12, neu: 45 }
  s1.k = s1.neu / s1.old
  const soup = [['Chicken stock', 2.4, 'L', 1], ['Diced onion', 600, 'g', 0], ['Vegetable oil', 30, 'mL', 1], ['Salt', 10, 'mL', 1]]
  /* Example A.2 rice, portions and portion size both change */
  const r2 = { oldP: 20, oldS: 150, newP: 64, newS: 200, rice: 1.2 }
  r2.oldY = r2.oldP * r2.oldS
  r2.newY = r2.newP * r2.newS
  r2.k = r2.newY / r2.oldY
  r2.out = r2.rice * r2.k
  /* Example A.3 scaling down */
  const d3 = { old: 40, neu: 15, flour: 1600, milk: 1.2 }
  d3.k = d3.neu / d3.old
  /* yield */
  const y7 = { ap: 5, ep: 4.2 }
  y7.pct = y7.ep / y7.ap * 100
  const y8 = { ap: 12, pct: 70 }
  y8.ep = y8.ap * y8.pct / 100
  const y9 = { ep: 9, pct: 88 }
  y9.ap = y9.ep / (y9.pct / 100)
  const y10 = { price: 2.4, pct: 80 }
  y10.cost = y10.price / (y10.pct / 100)

  /* bar: AP split into EP and trim */
  const apBar = (ep, trim, o) => F.cutBar([{ len: ep, name: 'EP', lab: o.epLab, ask: o.askEp }, { len: trim, name: 'trim', lab: o.trimLab, ask: o.askTrim }],
    { unit: ' kg', fmt: v => n(v), totalLab: o.apLab, askTotal: o.askAp, w: o.w || 520, max: o.max || '4.6in' })

  /* Health Canada list, in the order the page gives it */
  const HC = [['750 mL', '3 cups'], ['500 mL', '2 cups'], ['375 mL', L.mx(1, 1, 2) + ' cups'], ['310 mL', L.mx(1, 1, 4) + ' cups'], ['250 mL', '1 cup'], ['180 mL', L.fr(3, 4) + ' cup'],
    ['150 mL', L.fr(2, 3) + ' cup'], ['125 mL', L.fr(1, 2) + ' cup'], ['80 mL', L.fr(1, 3) + ' cup'], ['60 mL', L.fr(1, 4) + ' cup'], ['45 mL', '3 Tbsp'], ['30 mL', '2 Tbsp'],
    ['15 mL', '1 Tbsp'], ['10 mL', '2 tsp'], ['7.5 mL', L.fr(1, 2) + ' Tbsp'], ['5 mL', '1 tsp'], ['2 mL', L.fr(1, 2) + ' tsp'], ['1 mL', L.fr(1, 4) + ' tsp']]
  const half = Math.ceil(HC.length / 2)
  const hcRows = HC.slice(0, half).map((r, i) => r.concat(HC[half + i] || ['', '']))

  const usCup = 8 * FLOZ
  const oz = LB / 16 * 1000

  return L.join([
    B.chapter({
      num: 'A', id: 'kitchen', title: 'Kitchen Math',
      intro: B.p('A cook uses the same math as the rest of the shop. A recipe that feeds 12 has to feed 45. A recipe written in cups has to be measured in millilitres. A case of carrots loses weight when it is peeled, so the cook has to buy more than the plate needs.',
        'This appendix covers three kitchen skills: scaling a recipe with a scaling factor, changing between cooking measures, and food yield percent. They use the fractions, decimals and percents from Chapters 4, 5 and 6.'),
      objectives: ['Find a scaling factor and use it to make a recipe larger or smaller', 'Change cups and spoons to millilitres, and pounds and ounces to kilograms and grams', 'Find a yield percent from a yield test', 'Find the edible portion, the amount to buy and the cost per kilogram after trimming'],
      words: ['yield', 'scaling factor', 'as purchased (AP)', 'edible portion (EP)', 'yield percent'],
      art: apBar(4.2, 0.8, { epLab: '4.2 kg', trimLab: '0.8 kg', apLab: '5 kg as purchased', w: 520, max: '3.6in' })
    }),

    B.section('Scaling a recipe'),
    B.p('The ' + B.term('yield', 'The amount a recipe makes, given as a number of portions or as a total mass or volume.') + ' of a recipe is the amount it makes, such as 12 portions or 3 kg. To make a different amount, every ingredient is multiplied by the same number, the ' + B.term('scaling factor', 'The number every amount in a recipe is multiplied by to change its yield: new yield ÷ old yield.') + '.',
      'The scaling factor is the new yield divided by the old yield. A factor greater than 1 makes the recipe larger. A factor less than 1 makes it smaller. The yields must be in the same unit: portions with portions, grams with grams.'),
    B.formula('Scaling a recipe', ['Scaling factor = new yield ÷ old yield', 'New amount = old amount × scaling factor'], 'New yield over old yield. Never the other way around.'),
    B.example({
      title: 'Soup for a bigger crew',
      q: 'A soup recipe makes ' + s1.old + ' portions. The kitchen needs ' + s1.neu + ' portions. Scale the recipe.',
      steps: ['Scaling factor = new yield ÷ old yield = ' + s1.neu + ' ÷ ' + s1.old + ' = ' + n(s1.k) + '.', 'Multiply every ingredient by ' + n(s1.k) + '. For the stock: ' + n(2.4) + ' L × ' + n(s1.k) + ' = ' + n(2.4 * s1.k) + ' L.'],
      after: tbl(['Ingredient', 'For ' + s1.old + ' portions', '× ' + n(s1.k), 'For ' + s1.neu + ' portions'], soup.map(r => [r[0], n(r[1]) + ' ' + r[2], '', n(L.round(r[1] * s1.k, 4)) + ' ' + r[2]]), ['', 'r', 'c', 'r']),
      calc: { seq: s1.neu + ' ÷ ' + s1.old + ' =', expect: n(s1.k), say: 'The scaling factor is <b>' + n(s1.k) + '</b>.' },
      answer: n(2.4 * s1.k) + ' L of stock, ' + n(600 * s1.k) + ' g of onion, ' + n(30 * s1.k) + ' mL of oil and ' + n(10 * s1.k) + ' mL of salt.'
    }),
    B.check('2.4 × 3.75 =', n(2.4 * s1.k)),
    B.check('600 × 3.75 =', n(600 * s1.k)),
    B.p('Sometimes the portion size changes too. Then work out each yield as a total amount first: number of portions × portion size.'),
    B.example({
      title: 'More portions, bigger portions',
      q: 'A rice recipe makes ' + r2.oldP + ' portions of ' + r2.oldS + ' g and uses ' + n(r2.rice) + ' kg of dry rice. The kitchen needs ' + r2.newP + ' portions of ' + r2.newS + ' g. How much dry rice is needed?',
      steps: ['Old yield: ' + r2.oldP + ' × ' + r2.oldS + ' g = ' + n(r2.oldY) + ' g.', 'New yield: ' + r2.newP + ' × ' + r2.newS + ' g = ' + n(r2.newY) + ' g.', 'Scaling factor = ' + n(r2.newY) + ' ÷ ' + n(r2.oldY) + ' = ' + n(L.round(r2.k, 4)) + ' (rounded here, kept in full on the calculator).', 'Rice: ' + n(r2.rice) + ' kg × the factor = ' + n(L.round(r2.out, 3)) + ' kg.'],
      calc: { seq: r2.newY + ' ÷ ' + r2.oldY + ' × ' + r2.rice + ' =', expect: n(L.round(r2.out, 2)), say: 'Divide and multiply in one run, so the full factor is used: <b>' + n(L.round(r2.out, 2)) + ' kg</b>.' },
      answer: n(L.round(r2.out, 2)) + ' kg of dry rice.'
    }),
    B.example({
      title: 'Scaling down',
      q: 'A biscuit recipe makes ' + d3.old + ' biscuits with ' + n(d3.flour) + ' g of flour and ' + n(d3.milk) + ' L of milk. Make ' + d3.neu + ' biscuits.',
      steps: ['Scaling factor = ' + d3.neu + ' ÷ ' + d3.old + ' = ' + n(d3.k) + '. It is less than 1, so the recipe gets smaller.', 'Flour: ' + n(d3.flour) + ' g × ' + n(d3.k) + ' = ' + n(d3.flour * d3.k) + ' g.', 'Milk: ' + n(d3.milk) + ' L × ' + n(d3.k) + ' = ' + n(L.round(d3.milk * d3.k, 4)) + ' L = ' + n(L.round(d3.milk * d3.k * 1000, 2)) + ' mL.'],
      calc: { seq: d3.neu + ' ÷ ' + d3.old + ' =', expect: n(d3.k) },
      answer: n(d3.flour * d3.k) + ' g of flour and ' + n(L.round(d3.milk * d3.k * 1000, 2)) + ' mL of milk.'
    }),
    B.check('1600 × 0.375 =', n(d3.flour * d3.k)),
    B.check('1.2 × 0.375 =', n(L.round(d3.milk * d3.k, 4))),
    B.watch('New over old', 'The factor is new yield ÷ old yield. If you divide the other way, a recipe you meant to make larger comes out smaller. Check: more portions needs a factor greater than 1.'),
    B.tip('Round only what you measure', 'Keep the full scaling factor on the calculator and round only the amount you will weigh or measure. Measure dry goods by mass when you can. It is more exact than cups.'),
    B.tryIt([
      { q: 'A recipe makes 8 portions. Find the scaling factor to make 30 portions.', a: n(30 / 8) },
      { q: 'A recipe makes 50 portions. Find the scaling factor to make 20 portions.', a: n(20 / 50) },
      { q: 'A sauce for 16 portions uses 1.8 L of tomatoes. How much for 40 portions?', a: n(L.round(1.8 * 40 / 16, 4)) + ' L' },
      { q: 'A stew for 24 portions uses 3.6 kg of beef. How much for 18 portions?', a: n(L.round(3.6 * 18 / 24, 4)) + ' kg' },
      { q: 'A recipe makes 30 portions of 120 g. Find the scaling factor to make 45 portions of 160 g.', a: n(45 * 160 / (30 * 120)) },
      { q: 'A dough uses 900 g of flour for 36 rolls. How much flour for 120 rolls?', a: n(900 * 120 / 36) + ' g' }
    ]),

    B.section('Cooking measures'),
    B.p('Canadian kitchens measure liquids in millilitres and litres, and many recipes still give cups and spoons. Table A.1 is the conversion list Health Canada gives with Canada’s food guide. It uses a metric cup of 250 mL, a tablespoon (Tbsp) of 15 mL and a teaspoon (tsp) of 5 mL.'),
    B.table(['Metric', 'Cups and spoons', 'Metric', 'Cups and spoons'], hcRows, { align: ['r', '', 'r', ''], caption: 'Metric and cup and spoon measures. Source: Health Canada, Canada’s food guide, “Measure ingredients like a pro”, canada.ca (page dated 2026-03-31, read October 19, 2026).' }),
    B.p('Some rows are rounded to a size that is easy to measure. A quarter of 250 mL is 62.5 mL, and the list gives 60 mL. Three tablespoons is 3 × 15 mL = 45 mL, which is exact.',
      'One tablespoon is 3 teaspoons: 15 mL = 3 × 5 mL. To change teaspoons to tablespoons, divide by 3.'),
    B.example({
      title: 'Cups and spoons to millilitres',
      q: 'A recipe calls for 2' + L.fr(1, 2) + ' cups of stock and 3 Tbsp of oil. Measure them in millilitres with a 250 mL cup and a 15 mL spoon.',
      steps: ['Stock: 2.5 × 250 mL = ' + n(2.5 * 250) + ' mL.', 'Oil: 3 × 15 mL = ' + n(3 * 15) + ' mL. Table A.1 lists 45 mL for 3 Tbsp too.'],
      calc: { seq: '2.5 × 250 =', expect: n(2.5 * 250) },
      answer: n(2.5 * 250) + ' mL of stock and ' + n(45) + ' mL of oil.'
    }),
    B.example({
      title: 'Teaspoons after scaling',
      q: 'After scaling, a spice rub needs 12 tsp of paprika. How many tablespoons is that, and how many millilitres?',
      steps: ['3 tsp = 1 Tbsp, so 12 tsp ÷ 3 = ' + n(12 / 3) + ' Tbsp.', n(12 / 3) + ' × 15 mL = ' + n(12 / 3 * 15) + ' mL. Check: 12 × 5 mL = ' + n(12 * 5) + ' mL.'],
      answer: n(12 / 3) + ' Tbsp, or ' + n(60) + ' mL.'
    }),
    B.p('A recipe from the United States uses the U.S. cup. In the United States the cup, tablespoon and teaspoon are defined as 8, ' + L.fr(1, 2) + ' and ' + L.fr(1, 6) + ' U.S. fluid ounce, and 1 U.S. fluid ounce is 29.573\u00A053 mL (NIST SP 1038, Section 5.1.5 and its note 19). So a U.S. cup is 8 × 29.573\u00A053 mL = ' + n(L.round(usCup, 2)) + ' mL, a little less than the 250 mL metric cup. The same note gives 250 mL, 15 mL and 5 mL as the practical metric equivalents.'),
    B.check('8 × 29.57353 =', n(L.round(usCup, 2))),
    B.p('Meat and produce are often priced by the pound. One pound is exactly 0.453\u00A0592\u00A037 kg, and one ounce is ' + L.fr(1, 16) + ' of a pound (Weights and Measures Act, Schedule II). So one ounce is 0.453\u00A0592\u00A037 ÷ 16 × 1,000 = ' + n(L.round(oz, 2)) + ' g.'),
    B.check('0.45359237 ÷ 16 × 1000 =', n(L.round(oz, 2))),
    B.example({
      title: 'Pounds and ounces to kilograms',
      q: 'A recipe from an old card uses 5 lb of potatoes and 12 oz of butter. Change both to metric. Round to the nearest gram.',
      steps: ['Potatoes: 5 × 0.453\u00A0592\u00A037 kg = ' + n(L.round(5 * LB, 3)) + ' kg.', 'Butter: 12 oz = 12 ÷ 16 lb = ' + n(12 / 16) + ' lb. ' + n(12 / 16) + ' × 0.453\u00A0592\u00A037 kg = ' + n(L.round(0.75 * LB, 3), 3) + ' kg = ' + n(L.round(0.75 * LB * 1000, 0)) + ' g.'],
      calc: { rows: [{ label: 'Potatoes, kg', seq: '5 × 0.45359237 =', expect: n(L.round(5 * LB, 3)) }, { label: 'Butter, kg', seq: '12 ÷ 16 × 0.45359237 =', expect: n(L.round(0.75 * LB, 3), 3) }] },
      answer: n(L.round(5 * LB, 3)) + ' kg of potatoes and ' + n(L.round(0.75 * LB * 1000, 0)) + ' g of butter.'
    }),
    B.watch('Two kinds of cup', 'A metric cup is 250 mL. A U.S. cup is about ' + n(L.round(usCup, 1)) + ' mL. For a large batch the difference adds up: 40 cups is ' + n(40 * 250) + ' mL with metric cups and about ' + n(L.round(40 * usCup, 0)) + ' mL with U.S. cups. Use the cup the recipe was written for.'),
    B.check('40 × 8 × 29.57353 =', n(L.round(40 * usCup, 0))),
    B.tryIt([
      { q: 'Change 1' + L.fr(1, 2) + ' cups to millilitres, using a 250 mL cup.', a: n(1.5 * 250) + ' mL' },
      { q: 'Change 4 Tbsp to millilitres.', a: n(4 * 15) + ' mL' },
      { q: 'Change 18 tsp to tablespoons.', a: n(18 / 3) + ' Tbsp' },
      { q: 'How many 250 mL cups are in 2 L of milk?', a: n(2000 / 250) + ' cups' },
      { q: 'Change 3 lb of ground beef to kilograms. Round to three decimal places.', a: n(L.round(3 * LB, 3)) + ' kg' },
      { q: 'Change 8 oz of cheese to grams. Round to the nearest gram.', a: n(L.round(8 / 16 * LB * 1000, 0)) + ' g' }
    ]),
    B.check('3 × 0.45359237 =', n(L.round(3 * LB, 3))),
    B.check('8 ÷ 16 × 0.45359237 × 1000 =', n(L.round(8 / 16 * LB * 1000, 0))),

    B.section('Food yield percent'),
    B.p('Food is bought whole and loses weight when it is trimmed, peeled, boned or cored. The amount bought is the ' + B.term('as purchased (AP)', 'The amount of a food as it is bought, before any trimming, peeling or boning. Written AP.', 'as purchased') + ' amount, written AP. What is left to cook or serve is the ' + B.term('edible portion (EP)', 'The amount of a food left to cook or serve after trimming, peeling or boning. Written EP.', 'edible portion') + ', written EP.',
      'The ' + B.term('yield percent', 'The edible portion as a percent of the amount as purchased: EP ÷ AP × 100.') + ' is the EP as a percent of the AP. A kitchen finds it with a yield test: weigh the food as purchased, trim it, and weigh what is left.'),
    B.figure(apBar(y7.ep, y7.ap - y7.ep, { epLab: n(y7.ep) + ' kg', trimLab: n(L.round(y7.ap - y7.ep, 4)) + ' kg', apLab: n(y7.ap) + ' kg as purchased (AP)' }), 'A yield test on a case of carrots. The edible portion (EP) and the trim add up to the amount as purchased (AP).'),
    B.formula('Food yield', ['Yield percent = EP ÷ AP × 100', 'EP = AP × yield percent ÷ 100', 'AP = EP ÷ (yield percent ÷ 100)'], 'EP and AP in the same unit. To find how much to buy, divide by the yield as a decimal.'),
    B.example({
      title: 'A yield test',
      q: 'A cook peels and trims ' + n(y7.ap) + ' kg of carrots and is left with ' + n(y7.ep) + ' kg. What is the yield percent?',
      steps: ['Yield percent = EP ÷ AP × 100 = ' + n(y7.ep) + ' ÷ ' + n(y7.ap) + ' × 100 = ' + n(y7.pct) + '%.', 'The trim was ' + n(y7.ap) + ' − ' + n(y7.ep) + ' = ' + n(L.round(y7.ap - y7.ep, 4)) + ' kg, which is ' + n(L.round(100 - y7.pct, 4)) + '% of the AP.'],
      calc: { seq: y7.ep + ' ÷ ' + y7.ap + ' × 100 =', expect: n(y7.pct) },
      answer: n(y7.pct) + '%'
    }),
    B.example({
      title: 'Finding the edible portion',
      q: 'The kitchen’s yield test on whole squash gave ' + y8.pct + '%. How many kilograms of squash are ready to cook from ' + y8.ap + ' kg as purchased?',
      steps: ['EP = AP × yield percent ÷ 100 = ' + y8.ap + ' × ' + y8.pct + ' ÷ 100 = ' + n(y8.ep) + ' kg.'],
      calc: { seq: y8.ap + ' × ' + y8.pct + ' ÷ 100 =', expect: n(y8.ep) },
      answer: n(y8.ep) + ' kg'
    }),
    B.example({
      title: 'How much to buy',
      q: 'A recipe needs ' + y9.ep + ' kg of trimmed onions. The kitchen’s yield test on onions gave ' + y9.pct + '%. How many kilograms should be bought? Onions come in 1 kg bags.',
      steps: ['AP = EP ÷ (yield percent ÷ 100) = ' + y9.ep + ' ÷ ' + n(y9.pct / 100) + ' = ' + n(L.round(y9.ap, 3)) + ' kg.', 'Check: ' + n(L.round(y9.ap, 3)) + ' × ' + n(y9.pct / 100) + ' is about ' + y9.ep + ' kg.', 'Bags hold whole kilograms, so round up: ' + Math.ceil(y9.ap) + ' bags.'],
      calc: { seq: y9.ep + ' ÷ ' + n(y9.pct / 100) + ' =', expect: n(L.round(y9.ap, 3)) },
      answer: n(L.round(y9.ap, 3)) + ' kg, so buy ' + Math.ceil(y9.ap) + ' kg (' + Math.ceil(y9.ap) + ' bags).'
    }),
    B.watch('Divide to find what to buy', 'To find the AP, divide by the yield as a decimal. Multiplying gives a smaller number and the kitchen runs short. The AP is always more than the EP.'),
    B.example({
      title: 'Cost of the edible portion',
      q: 'Carrots cost ' + money(y10.price) + ' per kilogram as purchased. The yield is ' + y10.pct + '%. What does one kilogram of trimmed carrots cost?',
      steps: ['Only ' + y10.pct + '% of each kilogram bought can be used, so a usable kilogram costs more.', 'EP cost = AP price ÷ (yield percent ÷ 100) = ' + money(y10.price) + ' ÷ ' + n(y10.pct / 100) + ' = ' + money(y10.cost) + '.'],
      calc: { seq: n(y10.price) + ' ÷ ' + n(y10.pct / 100) + ' =', expect: n(y10.cost) },
      answer: money(y10.cost) + ' per kilogram of trimmed carrots.'
    }),
    B.shop('Yield tests are your own numbers', 'Yield depends on the food, its size and quality, and how it is trimmed. A kitchen keeps its own yield records from its own tests. The yield percents in this appendix are given as data for the problems.'),
    B.tryIt([
      { q: 'A 6.4 kg case of potatoes gives 5.12 kg after peeling. Find the yield percent.', a: n(5.12 / 6.4 * 100) + '%' },
      { q: 'A 3.5 kg pork loin gives 2.8 kg after trimming. Find the yield percent.', a: n(2.8 / 3.5 * 100) + '%' },
      { q: 'The yield is 85%. Find the EP from 20 kg as purchased.', a: n(20 * 0.85) + ' kg' },
      { q: 'The yield is 60%. How much must be bought to get 4.5 kg of EP?', a: n(4.5 / 0.6) + ' kg' },
      { q: 'The yield is 75%. How much must be bought to get 10 kg of EP? Round to two decimal places.', a: n(L.round(10 / 0.75, 2)) + ' kg' },
      { q: 'Celery costs $3.00 per kilogram as purchased and the yield is 75%. Find the cost per kilogram of EP.', a: money(3 / 0.75) }
    ]),
    B.check('10 ÷ 0.75 =', n(L.round(10 / 0.75, 2))),

    B.worksheet({ title: 'Kitchen math on the canvas', sub: 'Yield bars, a recipe card and measures', intro: 'Write the formula you use, then the numbers. Keep the full scaling factor on the calculator.' }),
    B.grid2(
      B.prob({ q: 'A yield test on onions. Find the mass of the trim and the yield percent.', canvas: apBar(4.8, 1.2, { epLab: '4.8 kg', askTrim: true, apLab: '6 kg as purchased', w: 420, max: '3.1in' }), a: n(1.2) + ' kg of trim, ' + n(4.8 / 6 * 100) + '% yield', work: '6 − 4.8 = 1.2 kg. 4.8 ÷ 6 × 100 = 80%', lines: 2 }),
      B.prob({ q: 'The yield percent is 75%. Find the amount as purchased.', canvas: F.cutBar([{ len: 3.6, name: 'EP', lab: '3.6 kg' }], { total: 4.8, restLab: 'trim', unit: ' kg', fmt: v => n(v), askTotal: true, w: 420, max: '3.1in' }), a: n(3.6 / 0.75) + ' kg', work: '3.6 ÷ 0.75', lines: 2 })
    ),
    B.check('3.6 ÷ 0.75 =', n(3.6 / 0.75)),
    B.prob({ q: 'This chili recipe makes 10 portions. Scale it to 24 portions. Give each new amount.', fig: tbl(['Chili, 10 portions', 'Amount', 'Chili, 10 portions', 'Amount'], [['Ground beef', '1.5 kg', 'Crushed tomatoes', '1.2 L'], ['Cooked beans', '800 g', 'Chili powder', '30 mL']], ['', 'r', '', 'r']),
      a: 'Factor ' + n(24 / 10) + ': ' + n(L.round(1.5 * 2.4, 4)) + ' kg of beef, ' + n(800 * 2.4) + ' g of beans, ' + n(L.round(1.2 * 2.4, 4)) + ' L of tomatoes, ' + n(30 * 2.4) + ' mL of chili powder', work: '24 ÷ 10 = 2.4, then multiply each amount by 2.4', lines: 3 }),
    B.check('1.2 × 2.4 =', n(L.round(1.2 * 2.4, 4))),
    B.grid2(
      B.prob({ q: 'Change one value: the chili in Problem 3 is made for 6 portions instead. How much ground beef is needed?', a: n(L.round(1.5 * 0.6, 4)) + ' kg', work: '6 ÷ 10 = 0.6, 1.5 × 0.6', lines: 2 }),
      B.prob({ q: 'A dressing needs 4 Tbsp and 2 tsp of vinegar. Give the amount in millilitres and in teaspoons.', a: n(4 * 15 + 2 * 5) + ' mL, or ' + n(4 * 3 + 2) + ' tsp', lines: 2 }),
    ),
    B.grid2(
      B.prob({ q: 'Green beans cost $3.60 per kilogram as purchased. The yield is 90%. Find the cost per kilogram of EP.', a: money(3.6 / 0.9), work: '3.60 ÷ 0.90', lines: 2 }),
      B.prob({ q: 'A recipe makes 40 portions of 180 g. Find the scaling factor to make 25 portions of 240 g. Is the new batch larger or smaller?', a: n(25 * 240 / (40 * 180), 4) + ' (to four decimal places). The new batch is smaller.', work: '25 × 240 = 6,000 g. 40 × 180 = 7,200 g. 6,000 ÷ 7,200', lines: 2 })
    ),
    B.check('6000 ÷ 7200 =', n(25 * 240 / (40 * 180), 4))
  ])
}
