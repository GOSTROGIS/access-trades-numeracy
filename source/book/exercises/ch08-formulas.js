/* Exercise Book, Chapter 8: Formulas and Transposing */
module.exports = function (B, L) {
  const G = require('../engine/figs-ch08.js');
  const { SH } = G.shapers(B);
  const n = L.num, R = L.round, m = L.m, PI = Math.PI;
  const d2 = x => n(R(x, 2), 2);
  const tF = 't<sub>F</sub>', tC = 't<sub>C</sub>';
  const P = (q, a, o) => B.prob(Object.assign({ q, a, lines: 2 }, o || {}));
  const row = (a, b) => B.grid2(a, b);

  /* BCBC 2024 stair values, read from the code text. The build stops if the text does not hold them */
  const PL = require('../engine/plates.js');
  const codeNum = (num, re) => {
    const mm = re.exec(PL.article(num).text.replace(/\s+/g, ' '));
    if (!mm) throw new Error('BCBC ' + num + ': value not found in the code text ' + re);
    return mm.slice(1).map(v => /^\d+$/.test(v) ? +v : v);
  };
  const [rPrivMax] = codeNum('9.8.4.1', /Private \(1\) (\d+) (\d+)/);
  const [rPubMax] = codeNum('9.8.4.1', /Public \(2\) (\d+) (\d+)/);
  const [uPrivMax, uPrivMin] = codeNum('9.8.4.2', /Private \(1\) (\d+) (\d+)/);
  const [tolAdj] = codeNum('9.8.4.4', /a\) (\d+) mm between adjacent treads or landings/);
  const [tolAll] = codeNum('9.8.4.4', /b\) (\d+) mm between the tallest and shortest risers in a flight/);
  codeNum('9.8.4.4', /a\) (\d+) mm between adjacent treads, and/);
  const [flightMax] = codeNum('9.8.3.3', /shall not exceed (\d+\.\d+) m/);
  const pg = num => PL.article(num).page;

  /* worked values */
  const gasketD = 2 * Math.sqrt(12000 / PI);
  const tankH = 4 / (PI * 0.75 * 0.75);
  const tapeD = 52.375 / PI;
  const cylR = Math.sqrt(0.9 / (PI * 1.5));
  const circR = Math.sqrt(8000 / PI);

  return L.join([
    B.exChapter({ num: 8, id: 'formulas', title: 'Formulas and Transposing', intro: 'Practice reading formulas, substituting values, solving with inverse operations and transposing formulas, including formulas with squares and square roots. Check every answer by substituting it back.' }),

    B.worksheet({ title: 'Skills', sub: 'Name the parts, substitute, solve and transpose' }),
    row(P('In ' + m('V = π × r² × h') + ', name the subject, the variables and the constant.', 'Subject V. Variables V, r and h. Constant π.'),
      P('Rewrite ' + m('3ab') + ' and ' + m('πr²') + ' with × signs.', '3 × a × b and π × r × r')),
    row(P('Substitute: ' + m('A = l × w') + ' with l = 3.6 m and w = 2.5 m.', n(R(3.6 * 2.5, 2)) + ' m²'),
      P('Substitute: ' + m('P = 2 × (l + w)') + ' with l = 1,250 mm and w = 875 mm.', n(2 * (1250 + 875)) + ' mm')),
    row(P('Substitute: ' + m('C = π × D') + ' with D = 450 mm. Round to two decimal places.', d2(PI * 450) + ' mm'),
      P('Substitute: ' + m('A = π × r²') + ' with r = 35 mm. Round to two decimal places.', d2(PI * 35 * 35) + ' mm²')),
    row(P('Substitute: ' + m('V = l × w × h') + ' with l = 1.2 m, w = 0.9 m and h = 0.75 m.', n(R(1.2 * 0.9 * 0.75, 3)) + ' m³'),
      P('Substitute: ' + m(tF + ' = 1.8 × ' + tC + ' + 32') + ' with ' + tC + ' = −10 °C.', n(R(1.8 * -10 + 32, 2)) + ' °F', { work: '1.8 × (−10) = −18, −18 + 32 = 14' })),
    row(P('Solve ' + m('x + 175 = 640') + '.', String(640 - 175)), P('Solve ' + m('x − 38 = 112') + '.', String(112 + 38))),
    row(P('Solve ' + m('8 × x = 2,000') + '.', String(2000 / 8)), P('Solve ' + m('x ÷ 6 = 45') + '.', String(45 * 6))),
    row(P('Solve ' + m('15 × x = 1,350') + '.', String(1350 / 15)), P('Solve ' + m('x − 2.75 = 9.5') + '.', n(R(9.5 + 2.75, 2)))),
    row(P('Make l the subject of ' + m('A = l × w') + '.', 'l = A ÷ w'), P('Make D the subject of ' + m('C = π × D') + '.', 'D = C ÷ π')),
    row(P('Make w the subject of ' + m('V = l × w × h') + '.', 'w = V ÷ (l × h)'), P('Make s the subject of ' + m('P = 4 × s') + '.', 's = P ÷ 4')),
    row(P('Make l the subject of ' + m('P = 2 × (l + w)') + '.', 'l = P ÷ 2 − w'), P('Make ' + tC + ' the subject of ' + m(tF + ' = 1.8 × ' + tC + ' + 32') + '.', tC + ' = (' + tF + ' − 32) ÷ 1.8')),
    row(P('Make b the subject of ' + m('A = b × h ÷ 2') + '.', 'b = 2 × A ÷ h'), P('Make h the subject of ' + m('T = a + r × h') + '.', 'h = (T − a) ÷ r')),
    row(P('Make s the subject of ' + m('A = s²') + '.', 's = √A'), P('Make r the subject of ' + m('A = π × r²') + '.', 'r = √(A ÷ π)')),
    row(P('Make h the subject of ' + m('V = π × r² × h') + '.', 'h = V ÷ (π × r²)'), P('Make n the subject of ' + m('L = n × π × D') + ', where n is a number of turns.', 'n = L ÷ (π × D)')),

    B.worksheet({ title: 'Shop problems', sub: 'Transpose first, then substitute and check' }),
    row(P('A floor plate must cover 0.54 m² and is 0.6 m wide. How long is it?', n(R(0.54 / 0.6, 2)) + ' m', { lines: 4, work: 'l = A ÷ w = 0.54 ÷ 0.6' }),
      P('A rectangular tank base is 1.5 m by 1.0 m. The tank must hold 1.8 m³. How tall is it?', n(R(1.8 / 1.5, 2)) + ' m', { lines: 4, work: 'h = V ÷ (l × w) = 1.8 ÷ (1.5 × 1.0)' })),
    row(P('A round gasket must have an area of 12,000 mm². Find its diameter to two decimal places.', d2(gasketD) + ' mm', { lines: 4, work: 'r = √(12,000 ÷ π) = ' + d2(gasketD / 2) + ', D = 2 × r' }),
      P('A welded frame uses 6,400 mm of tube all the way around. It is 1,250 mm wide. How long is it?', n(6400 / 2 - 1250) + ' mm', { lines: 4, work: 'l = P ÷ 2 − w = 3,200 − 1,250' })),
    row(P('A welding procedure calls for a preheat of 250 °F. Change it to °C, to two decimal places.', d2((250 - 32) / 1.8) + ' °C', { lines: 4, work: '(250 − 32) ÷ 1.8' }),
      P('A square base plate has an area of 1,296 in². Find the side in inches and in feet.', Math.sqrt(1296) + ' in = ' + (Math.sqrt(1296) / 12) + ' ft', { lines: 4, work: 's = √1,296' })),
    row(P('A round tank has a radius of 0.75 m and must hold 4 m³. Use ' + m('V = π × r² × h') + ' to find its height, to two decimal places.', d2(tankH) + ' m', { lines: 4, work: 'h = 4 ÷ (π × 0.75²)' }),
      P('A rental invoice uses ' + m('T = 45 + 18.50 × d') + ', with T in dollars and d in days. The total is $285.50. For how many days was the welder rented?', String((285.5 - 45) / 18.5) + ' days', { lines: 4, work: 'd = (285.50 − 45) ÷ 18.50' })),
    row(P('A tape wrapped once around a pipe reads 52' + L.fr(3, 8) + ' in. Find the diameter to the nearest 1/16 in.', L.inch(tapeD, 16), { lines: 4, work: 'D = 52.375 ÷ π = ' + n(R(tapeD, 3), 3) + ' in, ' + n(R(tapeD - 16, 3), 3) + ' × 16 = ' + d2(R(tapeD - 16, 3) * 16) + ', round to 11' }),
      P('A triangular gusset must have an area of 15,000 mm². Its height is 150 mm. Use ' + m('A = b × h ÷ 2') + ' to find the base.', n(2 * 15000 / 150) + ' mm', { lines: 4, work: 'b = 2 × A ÷ h' })),
    row(P('A drawing gives a disc an area of 0.25 m². Find its radius to three decimal places.', n(R(Math.sqrt(0.25 / PI), 3), 3) + ' m', { lines: 4, work: 'r = √(0.25 ÷ π)' }),
      P('A shelf is 1.8 m long and 0.6 m deep, so its area is 1.08 m². A part laid flat is 1.6 m by 0.65 m. Find the area of the part. Does the part fit on the shelf? Explain using areas and sizes.', 'The part is ' + n(R(1.6 * 0.65, 2)) + ' m², less than the 1.08 m² shelf, but it is 0.65 m deep and the shelf is only 0.6 m deep, so it does not fit.', { lines: 4 })),
    row(P('A sheet is 48 in wide and has an area of 4,608 in². Find its length in inches and in feet.', (4608 / 48) + ' in = ' + (4608 / 48 / 12) + ' ft', { lines: 4, work: 'l = A ÷ w = 4,608 ÷ 48' }),
      P('A cart wheel is 18 in in diameter. Use ' + m('n = L ÷ (π × D)') + ' to find how many turns it makes when the cart moves 150 ft. Round to two decimal places.', d2(1800 / (PI * 18)) + ' turns', { lines: 4, work: '150 ft = 1,800 in, n = 1,800 ÷ (π × 18)' })),
    P('Find the mistake. A learner transposes ' + m('P = 2 × (l + w)') + ' to ' + m('l = P − 2 × w') + ' and uses P = 4,000 mm and w = 700 mm. Find the learner\'s answer, check it by substituting back, and find the correct length.', 'Learner: 4,000 − 1,400 = 2,600 mm. Check: 2 × (2,600 + 700) = 6,600, not 4,000. Correct: l = P ÷ 2 − w = ' + n(4000 / 2 - 700) + ' mm.', { lines: 5 }),

    B.worksheet({ title: 'Shape Canvas', sub: 'Use the value you know to find the ?' }),
    row(P('The rectangle has an area of 4,800 cm². Find the width.', n(4800 / 80) + ' cm', { lines: 3, canvas: G.rectFig(80, 60, 'cm', { askW: true, max: '1.7in' }) }),
      P('The square has an area of 3,136 mm². Find the side.', Math.sqrt(3136) + ' mm', { lines: 3, canvas: G.rectFig(56, 56, 'mm', { askL: true, square: true, max: '1.25in' }) })),
    row(P('The circle has an area of 8,000 mm². Find r and D to two decimal places.', 'r = ' + d2(circR) + ' mm, D = ' + d2(2 * circR) + ' mm', { lines: 3, mode: 'Practice: find the ?', canvas: G.radCircle(50, 'mm', { askR: true, askD: true, max: '1.4in' }) }),
      P('The triangle has an area of 25,200 mm². Find the height.', n(2 * 25200 / 280) + ' mm', { lines: 3, canvas: SH('right-triangle', { b: 280, h: 180 }, { hide: ['h'], width: '1.6in' }) })),
    row(P('The box holds 0.48 m³. Find its length.', n(R(0.48 / (0.8 * 0.5), 2)) + ' m', { lines: 3, canvas: SH('rectangular-prism', { l: 1.2, w: 0.8, h: 0.5 }, { units: 'm', hide: ['l'], width: '2.3in' }) }),
      P('The tank holds 0.9 m³. Find its radius to two decimal places.', d2(cylR) + ' m', { lines: 3, mode: 'Practice: find the ?', work: 'r = √(V ÷ (π × h)) = √(0.9 ÷ (π × 1.5))', canvas: G.cyl3d(0.44, 1.5, 'm', { askR: true, max: '1.3in' }) })),
    row(P('The scale is level. Find x.', String(1350 / 3), { lines: 3, canvas: G.balance('3 × x', '1,350', '2.3in') }),
      P('A tape around the pipe reads 1,500 mm. Find D to two decimal places.', d2(1500 / PI) + ' mm', { lines: 3, canvas: G.circleCallout('C = 1,500 mm', '1.7in') })),
    row(P('Change one value: the square in problem 2 is given an area 9 times as big. Find the new side.', (3 * 56) + ' mm, three times the side', { lines: 3 }),
      P('Change one value: the circle in problem 3 is given an area 4 times as big, 32,000 mm². Find the new diameter to two decimal places. What happened to it?', d2(4 * circR) + ' mm. The diameter doubled.', { lines: 3 })),

    /* Set 8K: the set letter K is kept for the Carpentry sets in every chapter */
    (() => { B.wsN = 10; return ''; })(),
    B.worksheet({ title: 'Carpentry and the BCBC', sub: 'Stair formulas checked against BCBC 2024, Division B, Articles 9.8.3.3, 9.8.4.1, 9.8.4.2 and 9.8.4.4' }),
    row(P('A private stair has a total rise of 2,565 mm. The maximum rise is ' + rPrivMax + ' mm (Table 9.8.4.1, page ' + pg('9.8.4.1') + '). Find the number of risers and the unit rise to two decimal places.', Math.ceil(2565 / rPrivMax) + ' risers of ' + d2(2565 / Math.ceil(2565 / rPrivMax)) + ' mm', { lines: 4, work: '2,565 ÷ ' + rPrivMax + ' = ' + n(2565 / rPrivMax, 3) + ', round up to 13. 2,565 ÷ 13' }),
      P('The stair in problem 1 has a unit run of 265 mm. Does the run meet Table 9.8.4.2 (page ' + pg('9.8.4.2') + ') for a private stair? Find the total run.', 'Yes, 265 mm is between ' + uPrivMin + ' mm and ' + uPrivMax + ' mm. Total run 12 × 265 = ' + n(12 * 265) + ' mm', { lines: 4 })),
    row(P('A public stair has a total rise of 2,960 mm. The maximum rise is ' + rPubMax + ' mm (Table 9.8.4.1). Find the number of risers and the unit rise to two decimal places.', Math.ceil(2960 / rPubMax) + ' risers of ' + d2(2960 / Math.ceil(2960 / rPubMax)) + ' mm', { lines: 4, work: '2,960 ÷ ' + rPubMax + ' = ' + d2(2960 / rPubMax) + ', round up to 17' }),
      P('For the stair in problem 3, a learner rounds down to 16 risers. Find the unit rise and explain why it does not meet Table 9.8.4.1.', '2,960 ÷ 16 = ' + n(2960 / 16) + ' mm, more than the ' + rPubMax + ' mm maximum for a public stair', { lines: 4 })),
    row(P('A stair has 16 risers of 178 mm. Find the total rise.', n(16 * 178) + ' mm', { lines: 3, work: 'total rise = number of risers × unit rise' }),
      P('A private stair has 13 treads and a total run of 3,315 mm. Find the unit run. Does it meet Table 9.8.4.2?', n(3315 / 13) + ' mm. Yes, it is exactly the ' + uPrivMin + ' mm minimum', { lines: 3, work: 'unit run = total run ÷ number of treads' })),
    row(P('The risers of a flight measure 182, 185, 181, 186, 184 and 179 mm, from the bottom. Do they meet Sentence 9.8.4.4.(1) (page ' + pg('9.8.4.4') + '): ' + tolAdj + ' mm between adjacent risers and ' + tolAll + ' mm between the tallest and the shortest?', 'Yes. Adjacent differences are 3, 4, 5, 2 and 5 mm, none more than ' + tolAdj + ' mm. Tallest minus shortest is 186 − 179 = 7 mm, within ' + tolAll + ' mm', { lines: 4 }),
      P('The rectangular treads of a flight have runs of 270, 276, 268 and 272 mm. Sentence 9.8.4.4.(3) allows ' + tolAdj + ' mm between adjacent treads. Do they meet it?', 'No. 276 − 270 = 6 mm and 276 − 268 = 8 mm are more than ' + tolAdj + ' mm', { lines: 4 })),
    row(P('Article 9.8.3.3 (page ' + pg('9.8.3.3') + ') says the vertical height of a flight shall not exceed ' + flightMax + ' m. A private stair has a total rise of 3,900 mm. Can it be one flight? If it is split into two equal flights with a landing, find the risers and the unit rise in each flight.', 'No, 3,900 mm is more than ' + n(parseFloat(flightMax) * 1000) + ' mm. Each flight rises 1,950 mm: ' + Math.ceil(1950 / rPrivMax) + ' risers of ' + n(1950 / Math.ceil(1950 / rPrivMax)) + ' mm', { lines: 4 }),
      P('A stair has n risers of 190 mm and a total rise of 2,660 mm. Write an equation and solve it for n.', '190 × n = 2,660, so n = ' + n(2660 / 190), { lines: 4 })),
    row(P('A stair has 15 risers and a total run of 3,640 mm. Transpose ' + m('total run = number of treads × unit run') + ' and find the unit run.', 'unit run = total run ÷ number of treads = 3,640 ÷ 14 = ' + n(3640 / 14) + ' mm', { lines: 4 }),
      P('The stair drawing shows 12 risers, a total rise of 2,280 mm and a unit run of 250 mm. Find the unit rise and the total run marked ?.', 'Unit rise 2,280 ÷ 12 = ' + n(2280 / 12) + ' mm. Total run 11 × 250 = ' + n(11 * 250) + ' mm', { lines: 4, canvas: G.stairFig(12, { rise: '2,280 mm', run: '?', un: '250 mm', max: '2.6in' }) })),
    row(P('A private stair has a total rise of 2,600 mm, built as 13 risers of 200 mm. It must fit in a total run of no more than 3,400 mm. Find the largest whole-millimetre unit run that fits, and check it against Table 9.8.4.2.', '12 treads: 3,400 ÷ 12 = ' + d2(3400 / 12) + ', so ' + Math.floor(3400 / 12) + ' mm. It is between ' + uPrivMin + ' mm and ' + uPrivMax + ' mm, so it meets the table', { lines: 3 }),
      P('Change one value: the total rise in problem 1 becomes 2,605 mm. Find the number of risers and the unit rise to two decimal places. What changed?', Math.ceil(2605 / rPrivMax) + ' risers of ' + d2(2605 / Math.ceil(2605 / rPrivMax)) + ' mm. 2,605 ÷ ' + rPrivMax + ' = ' + n(2605 / rPrivMax, 3) + ' rounds up to 14, one more riser, so each riser is lower', { lines: 3 })),
    B.check('3400 ÷ 12 =', d2(3400 / 12)),
    B.check('2605 ÷ ' + rPrivMax + ' =', n(2605 / rPrivMax, 3)),
    B.check('2605 ÷ 14 =', d2(2605 / 14)),
    B.check('2565 ÷ ' + rPrivMax + ' =', n(2565 / rPrivMax, 3)),
    B.check('2565 ÷ 13 =', d2(2565 / 13)),
    B.check('12 × 265 =', n(12 * 265)),
    B.check('2960 ÷ ' + rPubMax + ' =', d2(2960 / rPubMax)),
    B.check('2960 ÷ 17 =', d2(2960 / 17)),
    B.check('2960 ÷ 16 =', n(2960 / 16)),
    B.check('16 × 178 =', n(16 * 178)),
    B.check('3315 ÷ 13 =', n(3315 / 13)),
    B.check('1950 ÷ 10 =', n(1950 / 10)),
    B.check('2660 ÷ 190 =', n(2660 / 190)),
    B.check('3640 ÷ 14 =', n(3640 / 14)),
    B.check('2280 ÷ 12 =', n(2280 / 12)),
    B.check('π × 450 =', d2(PI * 450)),
    B.check('π × 35 x² =', d2(PI * 35 * 35)),
    B.check('1.8 × 10 +⇄− + 32 =', '14'),
    B.check('12000 ÷ π = √x × 2 =', d2(gasketD)),
    B.check('( 250 − 32 ) ÷ 1.8 =', d2((250 - 32) / 1.8)),
    B.check('1296 √x', '36'),
    B.check('4 ÷ ( π × 0.75 x² ) =', d2(tankH)),
    B.check('( 285.5 − 45 ) ÷ 18.5 =', '13'),
    B.check('52 ab/c 3 ab/c 8 ÷ π =', n(R(tapeD, 3), 3)),
    B.check('0.25 ÷ π = √x', n(R(Math.sqrt(0.25 / PI), 3), 3)),
    B.check('1.6 × 0.65 =', '1.04'),
    B.check('8000 ÷ π = √x', d2(circR)),
    B.check('8000 ÷ π = √x × 2 =', d2(2 * circR)),
    B.check('0.9 ÷ ( π × 1.5 ) = √x', d2(cylR)),
    B.check('1500 ÷ π =', d2(1500 / PI)),
    B.check('3136 √x', '56'),
    B.check('1800 ÷ ( π × 18 ) =', d2(1800 / (PI * 18))),
    B.check('4608 ÷ 48 =', '96'),
    B.check('32000 ÷ π = √x × 2 =', d2(4 * circR)),
    B.check('0.671 × 16 =', d2(0.671 * 16))
  ]);
};
