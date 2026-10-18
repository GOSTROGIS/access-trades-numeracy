/* Exercise Book, Chapter 8: Formulas and Transposing */
module.exports = function (B, L) {
  const G = require('../engine/figs-ch08.js');
  const { SH } = G.shapers(B);
  const n = L.num, R = L.round, m = L.m, PI = Math.PI;
  const d2 = x => n(R(x, 2), 2);
  const tF = 't<sub>F</sub>', tC = 't<sub>C</sub>';
  const P = (q, a, o) => B.prob(Object.assign({ q, a, lines: 2 }, o || {}));
  const row = (a, b) => B.grid2(a, b);

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
