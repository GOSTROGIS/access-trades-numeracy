/* Exercise Book, Chapter 2: Your Calculator. Key answers come from the hub translator (the same chips the textbook
   boxes show) and every value is checked on the TI-30Xa and Sharp emulators. */
module.exports = function (B, L) {
  const P = require('../engine/figs-ch02.js');
  const C = L.CALC;
  const n = L.num;
  const ti = seq => C.tiValue(seq).value;
  const keys = (seq, id) => C.K.exportChips(seq, id).filter(c => c.k !== 'note').map(c => c.t).join(', ');
  const both = seq => 'TI-30Xa: ' + keys(seq, 'ti30xa') + '. Sharp: ' + keys(seq, 'el531xt') + '.';
  const scr = (seq, id) => C.screenText(seq, id);
  const chk = (seq, v) => B.check(seq, String(v).replace(/,/g, '').replace('−', '-'));
  /* a "write the keys" problem: the answer is the value and both key sequences */
  const kp = (q, seq, v, o) => [B.prob(Object.assign({ q, a: v + '. ' + both(seq), lines: 3 }, o || {})), B.check(seq, String(ti(seq)))];
  const r2 = (seq, dp) => n(L.round(ti(seq), dp), dp);

  const lcdA = { seq: '6 ab/c 11 ab/c 16', id: 'ti30xa' }, lcdB = { seq: '9120 × 2 =', id: 'el531xt' }, lcdC = { seq: '3 yˣ 4 =', id: 'el531xt' }, lcdD = { seq: '50000 × 400000 =', id: 'ti30xa' };
  const dA = scr(lcdA.seq, 'ti30xa'), dB = scr(lcdB.seq, 'el531xt'), dC = scr(lcdC.seq, 'el531xt'), dD = scr(lcdD.seq, 'ti30xa');

  return L.join([
    B.exChapter({ num: 2, id: 'calc', title: 'Your Calculator: TI-30Xa and Sharp EL-531XT', intro: 'Practice with the keys of both calculators: writing key sequences, second functions, negative numbers, powers and roots, π, fractions, percent, memory and the trig keys. Start every problem with ON/C ON/C and DEG on the display.' }),

    B.worksheet({ title: 'Skills', sub: 'Write the keys for both calculators, then the answer' }),
    B.grid2(
      ...kp('3,640 + 1,295 − 788', '3640 + 1295 − 788 =', n(ti('3640 + 1295 − 788 ='))),
      ...kp('23²', '23 x²', n(ti('23 x²'))),
      ...kp('√1,369', '1369 √x', n(ti('1369 √x'))),
      ...kp('7³', '7 x³', n(ti('7 x³'))),
      ...kp('The cube root of 343', '343 ³√x', n(ti('343 ³√x'))),
      ...kp('(−15) × 6 + 40', '15 +⇄− × 6 + 40 =', n(ti('15 +⇄− × 6 + 40 ='))),
      ...kp('3⁵, using the yˣ key', '3 yˣ 5 =', n(ti('3 yˣ 5 ='))),
      ...kp('π × 90, to two decimal places', 'π × 90 =', r2('π × 90 =', 2)),
      ...kp(L.mx(2, 3, 8) + ' + ' + L.mx(1, 7, 16) + ', using the fraction key. Write the answer as the display shows it.', '2 ab/c 3 ab/c 8 + 1 ab/c 7 ab/c 16 =', L.mx(3, 13, 16) + ' (TI-30Xa ' + scr('2 ab/c 3 ab/c 8 + 1 ab/c 7 ab/c 16 =', 'ti30xa').main + ', Sharp ' + scr('2 ab/c 3 ab/c 8 + 1 ab/c 7 ab/c 16 =', 'el531xt').main + ')'),
      ...kp('Change ' + L.fr(7, 8) + ' to a decimal.', '7 ab/c 8 F⇄D', String(ti('7 ab/c 8 F⇄D'))),
      ...kp('18% of 450', '450 × 18 % =', n(ti('450 × 18 % ='))),
      ...kp('1,250 plus 8%', '1250 + 8 % =', n(ti('1250 + 8 % ='))),
      ...kp('sin 52°, to four decimal places', '52 SIN', r2('52 SIN', 4)),
      ...kp('The angle whose tangent is 0.6, to two decimal places', '0.6 TAN⁻¹', r2('0.6 TAN⁻¹', 2) + '°'),
      ...kp('Store 640 + 385 in memory, clear the display, then find 2,400 minus the stored number.', '640 + 385 = STO 1 ON/C 2400 − RCL 1 =', n(ti('640 + 385 = STO 1 ON/C 2400 − RCL 1 ='))),
      ...kp('1 ÷ 8, using the 1/x key (x⁻¹ on the Sharp)', '8 1/x', String(ti('8 1/x'))),
      B.prob({ q: 'A learner needs (−25) + 9 and presses the minus key to make the 25 negative. Which key should they use instead on each calculator? What is the answer?', a: n(ti('25 +⇄− + 9 =')) + '. Use the change-sign key, not the minus key. ' + both('25 +⇄− + 9 ='), lines: 4 }),
      B.prob({ q: 'Find the area of the square with the x² key.', canvas: P.bigLabels(B.shape('square', { s: 37 }, { units: 'mm', width: '1.5in' }), 1.7), a: n(ti('37 x²')) + ' mm². ' + both('37 x²'), lines: 2 })
    ),
    B.check('2 ab/c 3 ab/c 8 + 1 ab/c 7 ab/c 16 =', '3.8125'),

    B.worksheet({ title: 'Shop problems', sub: 'Use the calculator keys on the job' }),
    B.prob({ q: 'A pipe has an outside diameter of 114.3 mm. The distance around it is π × D. Find it to one decimal place.', a: r2('π × 114.3 =', 1) + ' mm', work: both('π × 114.3 ='), lines: 5 }),
    chk('π × 114.3 =', r2('π × 114.3 =', 1)),
    B.prob({ q: 'The round lid of a tank has a radius of 600 mm. Its area is π × r². Find it to the nearest square millimetre.', a: n(L.round(ti('600 x² × π ='), 0)) + ' mm²', work: both('600 x² × π ='), lines: 5 }),
    chk('600 x² × π =', L.round(ti('600 x² × π ='), 0)),
    B.prob({ q: 'Three pieces, each ' + L.mx(14, 5, 8) + ' in long, are cut from a 72 in bar. Ignore the saw cuts. Use the fraction key to find the offcut: ' + L.m('72 − 3 × ' + L.mx(14, 5, 8)) + '.', a: L.mx(28, 1, 8) + ' in', work: both('72 − 3 × 14 ab/c 5 ab/c 8 ='), lines: 5 }),
    chk('72 − 3 × 14 ab/c 5 ab/c 8 =', '28.125'),
    B.prob({ q: 'A job needs 380 m of cable. The order adds 12% for waste. Use the % key to find the length to order.', a: ti('380 + 12 % =') + ' m', work: both('380 + 12 % ='), lines: 5 }),
    chk('380 + 12 % =', '425.6'),
    B.prob({ q: 'Each frame has four welds: 1,240 mm, 860 mm, 1,240 mm and 860 mm. Store the weld length for one frame in memory, then use it to find the weld length for 18 frames.', a: n(ti('1240 + 860 + 1240 + 860 = STO 1 ON/C RCL 1 × 18 =')) + ' mm', work: 'One frame: 4,200 mm. ' + both('1240 + 860 + 1240 + 860 = STO 1 ON/C RCL 1 × 18 ='), lines: 5 }),
    chk('1240 + 860 + 1240 + 860 = STO 1 ON/C RCL 1 × 18 =', '75600'),
    B.prob({ q: 'The diagonal of a 1,200 mm by 900 mm frame is ' + L.m('√(1,200² + 900²)') + '. Find it. Write the keys for both calculators.', a: n(ti('( 1200 x² + 900 x² ) √x')) + ' mm', work: both('( 1200 x² + 900 x² ) √x'), lines: 5 }),
    chk('( 1200 x² + 900 x² ) √x', '1500'),
    B.prob({ q: 'A ramp rises 450 mm over a run of 2,400 mm. Its angle is the angle whose tangent is 450 ÷ 2,400. Find it to one decimal place. Check that DEG is on the display first.', a: r2('( 450 ÷ 2400 ) TAN⁻¹', 1) + '°', work: both('( 450 ÷ 2400 ) TAN⁻¹'), lines: 5 }),
    chk('( 450 ÷ 2400 ) TAN⁻¹', r2('( 450 ÷ 2400 ) TAN⁻¹', 1)),
    B.prob({ q: 'A gauge reads −11. The setting it should read is 4. Find ' + L.m('−11 − 4') + ' to see how far off it is. Use the change-sign key.', a: n(ti('11 +⇄− − 4 =')) + ' (15 below the setting)', work: both('11 +⇄− − 4 ='), lines: 5 }),
    chk('11 +⇄− − 4 =', '-15'),

    B.worksheet({ title: 'Shape Canvas', sub: 'Keys, displays and drawings' }),
    B.prob({ q: 'Name keys A to H and say what each one does. A to D are on the TI-30Xa, E to H on the Sharp EL-531XT.', canvas: P.pair({ askTi: { pi: 'A', sq: 'B', rcl: 'C', '2nd': 'D' }, askSharp: { pow: 'E', abc: 'F', rcl: 'G', home: 'H' }, sm: 9.2, max: '6.45in' }), mode: 'Name the keys', a: 'A: π. B: x², squares a number. C: RCL, recalls a memory. D: 2nd, for the second functions printed above the keys. E: yˣ, powers. F: a b/c, the fraction key. G: RCL, recalls a memory. H: HOME, returns to normal mode.', lines: 4 }),
    B.grid2(
      B.prob({ q: 'Write the number this display shows.', canvas: P.lcd('ti', dA.main, { max: '2.3in', indS: 11 }), mode: 'Read it', a: L.mx(6, 11, 16), lines: 1 }),
      B.prob({ q: 'Write the number this display shows, with a comma.', canvas: P.lcd('sharp', dB.main, { top: '9120×2=', max: '2.3in', indS: 11 }), mode: 'Read it', a: n(ti(lcdB.seq)), lines: 1 }),
      B.prob({ q: 'What calculation was keyed? Write it with an exponent.', canvas: P.lcd('sharp', dC.main, { top: dC.top || '3^4=', max: '2.3in', indS: 11 }), mode: 'Read it', a: '3⁴ = ' + ti(lcdC.seq), lines: 1 }),
      B.prob({ q: 'The small number at the right is an exponent of 10. Write the number in full, with commas.', canvas: P.lcd('ti', dD.main, { exp: dD.exp, max: '2.3in', indS: 11 }), mode: 'Read it', a: n(ti(lcdD.seq)) + ' (2 × 10¹⁰)', lines: 1 })
    ),
    B.check('6 ab/c 11 ab/c 16', '6.6875'),
    B.grid2(
      B.prob({ q: 'This display shows GRAD. How many presses of DRG bring back DEG?', canvas: P.lcd('sharp', '0.', { ind: 'GRAD', max: '2.3in', indS: 11 }), mode: 'Read it', a: 'One press (the order is DEG, RAD, GRAD, then back to DEG).', lines: 1 }),
      B.prob({ q: 'Find the distance around the circle, π × D, to two decimal places. Then change one value: if the diameter doubles, what is the new distance around?', canvas: P.circleR(50, 'mm', { max: '1.45in' }), a: 'D = 100 mm. π × 100 = ' + r2('π × 100 =', 2) + ' mm. Doubled: π × 200 = ' + r2('π × 200 =', 2) + ' mm, twice as far.', lines: 3 })
    ),
    B.check('π × 100 =', '314.16'), B.check('25 +⇄− + 9 =', '-16'), B.check('π × 200 =', '628.32'), B.check('37 x²', '1369'),

    /* Set 2K: carpentry tape lengths and BCBC values. The set letter is K in every chapter. */
    carpSet()
  ]);

  function carpSet() {
    const PL = require('../engine/plates.js')
    const ftin = v => L.ftin(v, 16), inch = v => L.inch(v, 16)
    const fi = (w, a, b) => L.mx(w, a, b)
    const s = {
      p1: '9 × 12 + 4 ab/c 3 ab/c 4 =', p2: '14 × 12 + 11 ab/c 5 ab/c 8 =',
      p3: '5 × 12 + 6 ab/c 3 ab/c 16 + 3 × 12 + 10 ab/c 15 ab/c 16 =', p4: '16 × 12 − ( 7 × 12 + 9 ab/c 3 ab/c 8 ) =',
      p5: '( 10 × 12 + 4 ab/c 1 ab/c 2 ) ÷ 3 =', p6: '8 × 12 + 1 ab/c 1 ab/c 8 = × 25.4 =',
      p7: '2 × ( 12 × 12 + 6 ab/c 1 ab/c 2 + 9 × 12 + 11 ab/c 3 ab/c 4 ) =', p8: '15 × 7 ab/c 1 ab/c 4 =', p9: '14 × 10 ab/c 1 ab/c 2 =',
      p10: '255 ÷ 25.4 × 16 =', p11: '3700 ÷ 25.4 × 16 =', p12: '8 × 12 + 5 ab/c 3 ab/c 8 =', p13: '8 × 12 + 6 ='
    }
    const v = {}
    for (const k of Object.keys(s)) v[k] = ti(s[k])
    const run16 = Math.round(v.p10), fl16 = Math.floor(v.p11)
    const lcd12 = scr(s.p12, 'ti30xa')
    B.wsN = Math.max(B.wsN, 10)
    return [
      B.worksheet({ title: 'Carpentry and the BCBC', sub: 'Tape lengths in feet, inches and fractions on both calculators' }),
      B.grid2(...kp('Change 9′ ' + fi(4, 3, 4) + '″ to inches.', s.p1, inch(v.p1), { lines: 2 }),
        ...kp('Change 14′ ' + fi(11, 5, 8) + '″ to inches.', s.p2, inch(v.p2), { lines: 2 })),
      ...kp('Two lengths of baseboard, 5′ ' + fi(6, 3, 16) + '″ and 3′ ' + fi(10, 15, 16) + '″, are butted end to end. Find the total in feet and inches.', s.p3, ftin(v.p3) + ' (' + inch(v.p3) + ')'),
      ...kp('A piece 7′ ' + fi(9, 3, 8) + '″ long is cut from a 16′ board. Ignore the saw cut. Find the piece left over in feet and inches. Put the length you take away in brackets.', s.p4, ftin(v.p4) + ' (' + inch(v.p4) + ')'),
      ...kp('A 10′ ' + fi(4, 1, 2) + '″ board is cut into 3 equal shelves. Ignore the saw cuts. How long is each shelf?', s.p5, inch(v.p5) + ' (' + ftin(v.p5) + ')'),
      B.prob({ q: 'Change 8′ ' + fi(1, 1, 8) + '″ to millimetres, to the nearest millimetre. One inch is exactly 25.4 mm.', a: n(L.round(v.p6, 0)) + ' mm', work: inch(ti('8 × 12 + 1 ab/c 1 ab/c 8 =')) + ' × 25.4 = ' + n(v.p6) + ' mm. ' + both(s.p6), lines: 3 }),
      B.check(s.p6, n(L.round(v.p6, 0))),
      ...kp('Two walls are 12′ ' + fi(6, 1, 2) + '″ and 9′ ' + fi(11, 3, 4) + '″ long. Each wall gets a top plate and a bottom plate. Find the total plate length in feet and inches.', s.p7, ftin(v.p7) + ' (' + inch(v.p7) + ')'),
      B.grid2(...kp('A stair has 15 risers, each ' + fi(7, 1, 4) + '″ high. Find the total rise in feet and inches.', s.p8, ftin(v.p8) + ' (' + inch(v.p8) + ')', { lines: 2 }),
      ...kp('A stair has 14 treads, each with a unit run of ' + fi(10, 1, 2) + '″. Find the total run in feet and inches.', s.p9, ftin(v.p9) + ' (' + inch(v.p9) + ')', { lines: 2 })),
      B.prob({ q: 'Table 9.8.4.2 of the BC Building Code (Sentence 9.8.4.2.(1), page ' + PL.article('9.8.4.2').page + ') gives a minimum unit run of 255 mm for a private stair. Change 255 mm to inches, to the nearest ' + L.fr(1, 16) + ' in. The metric value stays the code limit.', a: inch(run16 / 16), work: '255 ÷ 25.4 × 16 = ' + n(L.round(v.p10, 2), 2) + ' sixteenths, rounds to ' + run16 + ' = ' + inch(run16 / 16) + '. Rounding up keeps the run above the minimum.', lines: 3 }),
      B.check(s.p10, n(L.round(v.p10, 2), 2)),
      B.prob({ q: 'Article 9.8.3.3, Sentence (1) (page ' + PL.article('9.8.3.3').page + '), limits the height of one flight of stairs to 3.7 m, which is 3,700 mm. Change 3,700 mm to feet and inches. Round down to the ' + L.fr(1, 16) + ' in below, so the inch value is not over the limit.', a: ftin(fl16 / 16) + ' (' + inch(fl16 / 16) + ')', work: '3,700 ÷ 25.4 × 16 = ' + n(L.round(v.p11, 2), 2) + ' sixteenths, round down to ' + n(fl16) + ' = ' + inch(fl16 / 16) + ' = ' + ftin(fl16 / 16) + '.', lines: 3 }),
      B.check(s.p11, n(L.round(v.p11, 2), 2)),
      B.grid2(
        B.prob({ q: 'A tape length was changed to inches on the TI-30Xa. Write the length in feet and inches.', canvas: P.lcd('ti', lcd12.main, { max: '2.3in', indS: 11 }), mode: 'Read it', a: ftin(v.p12) + ' (' + inch(v.p12) + ' = 8 × 12 + ' + fi(5, 3, 8) + ')', lines: 2 }),
        B.prob({ q: 'A learner writes 8′ 6″ as 8.6 ft. What is wrong? Find the length in inches and in decimal feet.', a: 'There are 12 inches in a foot, not 10. 8 × 12 + 6 = ' + v.p13 + ' in, and ' + v.p13 + ' ÷ 12 = ' + ti('102 ÷ 12 =') + ' ft.', lines: 2 })
      ),
      B.check(s.p12, String(v.p12)), B.check(s.p13, '102'), B.check('102 ÷ 12 =', '8.5')
    ]
  }
};
