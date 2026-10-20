/* Chapter 2: Your Calculator, TI-30Xa and Sharp EL-531XT.
   Key behaviour comes from calc2/CALC-MODELS.md, the Sharp manuals in calc2/manuals (EL-531XT Operation Manual and
   Calculation Examples, EL-531TH guide) and the emulators, shown in the calculator boxes. */
module.exports = function (B, L) {
  const F = require('../engine/figs.js');
  const P = require('../engine/figs-ch02.js');
  const n = L.num;
  /* plain key text for the answer key, from the same chips the boxes use */
  const keys = (seq, id) => L.CALC.K.exportChips(seq, id).filter(c => c.k !== 'note').map(c => c.t).join(', ');
  const both = seq => 'TI-30Xa: ' + keys(seq, 'ti30xa') + '. Sharp: ' + keys(seq, 'el531xt') + '.';
  const ti = seq => L.CALC.tiValue(seq).value;

  const tiNotes = [
    { k: 'onc', t: 'ON/C: on and clear', side: 'R' }, { k: '2nd', t: '2nd: second functions', side: 'L' },
    { k: 'drg', t: 'DRG: angle unit', side: 'L' }, { k: 'off', t: 'OFF', side: 'R' },
    { k: 'sin', t: 'SIN COS TAN: trig keys', side: 'L' }, { k: 'pow', t: 'yˣ: powers', side: 'R' },
    { k: 'pi', t: 'π', side: 'L' }, { k: 'sq', t: 'x²: square', side: 'L' }, { k: 'sqrt', t: '√x: square root', side: 'R' },
    { k: 'div', t: '÷ × − +: operations', side: 'R' }, { k: 'rp', t: '( ): brackets', side: 'R' },
    { k: 'sto', t: 'STO: store in memory', side: 'L' }, { k: 'rcl', t: 'RCL: recall memory', side: 'L' },
    { k: 'abc', t: 'a b/c: fraction key', side: 'L' }, { k: 'back', t: '←: delete last digit', side: 'L' },
    { k: 'neg', t: '+⇄−: change sign', side: 'R' }, { k: 'eq', t: '=: works out the answer', side: 'R' }
  ];
  const shNotes = [
    { k: 'home', t: 'HOME: normal mode', side: 'L' }, { k: 'cursor', t: 'Cursor keys', side: 'L' }, { k: 'onc', t: 'ON/C: on and clear', side: 'R' },
    { k: '2ndf', t: '2ndF: second functions', side: 'L' }, { k: 'mode', t: 'MODE', side: 'R' }, { k: 'del', t: 'DEL: delete', side: 'R', tag: 'L' },
    { k: 'sin', t: 'sin cos tan: trig keys', side: 'L' }, { k: 'pi', t: 'π', side: 'R' }, { k: 'drg', t: 'DRG: angle unit', side: 'R' },
    { k: 'pow', t: 'yˣ: powers', side: 'L' }, { k: 'sqrt', t: '√: square root', side: 'L' }, { k: 'sq', t: 'x²: square', side: 'R' },
    { k: 'abc', t: 'a b/c: fraction key', side: 'L', tag: 'B' }, { k: 'rcl', t: 'RCL: recall memory', side: 'R' }, { k: 'sto', t: 'STO: store in memory', side: 'R' },
    { k: 'rp', t: '( ): brackets', side: 'R' }, { k: 'div', t: '× ÷ + −: operations', side: 'R' },
    { k: 'neg', t: '+/−: change sign', side: 'L' }, { k: 'eq', t: '=: works out the line', side: 'R' }
  ];

  /* worksheet numbers */
  const wsA = [
    { q: '2,450 + 1,375 − 980', seq: '2450 + 1375 − 980 =', dp: null },
    { q: '18²', seq: '18 x²', dp: null },
    { q: '√529', seq: '529 √x', dp: null },
    { q: '(−12) × 4 + 60', seq: '12 +⇄− × 4 + 60 =', dp: null }
  ];

  return L.join([
    B.chapter({
      num: 2, id: 'calc', title: 'Your Calculator: TI-30Xa and Sharp EL-531XT',
      intro: B.p('A scientific calculator is a shop tool like a tape measure or a square. This book shows every calculator step on two calculators, the TI-30Xa and the Sharp EL-531XT. Both give the same answers, but they do not always take the keys in the same order. This chapter walks you around both faceplates: which keys do what, how each calculator wants its keys pressed, and how to read the display and check a result.'),
      objectives: ['Find the main keys on both calculators', 'Turn on, clear and fix a mistyped number', 'Use the 2nd and 2ndF keys', 'Key in negatives, brackets, squares, roots, powers and π', 'Use the fraction, percent and memory keys', 'Set DEG and use the trig keys, then check the answer'],
      words: ['key sequence', 'display', 'second function', 'D.A.L.', 'memory'],
      art: '<div style="display:flex;gap:28pt;justify-content:center;align-items:flex-end">' + P.lcd('ti', '20.', { max: '2.7in', indS: 11 }) + P.lcd('sharp', '20.', { top: '12+8=', max: '2.7in', indS: 11 }) + '</div>'
    }),

    B.section('Meet the two calculators'),
    B.p('Both calculators have the same kinds of keys: number keys, the four operations (+ − × ÷), an equals key, and function keys for squares, roots, powers, π, fractions, memory and angles. The keys are in different places, so take a few minutes with the drawings below and your own calculator.',
      'The ' + B.term('display', 'The screen of the calculator. It shows the number you are keying in and the answer.') + ' is the screen. The TI-30Xa display shows a number of up to 10 digits, with small indicators such as DEG and 2nd. The Sharp EL-531XT shows two lines: the calculation you keyed in on the top line and the answer on the bottom line.'),
    B.figure(P.plate('ti', { notes: tiNotes, max: '6.5in', margin: 200, ps: 1.3 }), 'The TI-30Xa faceplate. The small labels above the keys are second functions, used with the 2nd key. The numbered notes name the keys used most in this book.'),
    B.p('A ' + B.term('key sequence', 'The list of keys you press, in order, to do a calculation.') + ' is the list of keys you press, in order, to do a calculation. Every calculator box in this book shows the key sequence for both calculators and the display each one shows at the end. Table 2.1 lists the keys that look or work differently on the two calculators.'),
    B.table(['Job', 'TI-30Xa', 'Sharp EL-531XT'], [
      ['Turn on', 'ON/C', 'ON/C'],
      ['Turn off', 'OFF', '2ndF then ON/C (OFF is printed above it)'],
      ['Second functions', '2nd', '2ndF'],
      ['Change the sign of a number', '+⇄− after the digits', '+/− before the number'],
      ['Square root', '√x after the number', '√ before the number, then ='],
      ['Square', 'x² after the number', 'x² after the number, then ='],
      ['Store in memory', 'STO then 1, 2 or 3', 'STO then a letter key (A to F, X, Y, M)'],
      ['Fix a mistyped digit', '←', 'DEL']
    ], { caption: 'Keys that differ between the two calculators.', align: ['', 'c', 'c'] }),

    B.figure(P.plate('sharp', { notes: shNotes, max: '6.15in', margin: 200, ps: 1.3, top: '12+8=', main: '20.' }), 'The Sharp EL-531XT faceplate. Orange labels above the keys are second functions, used with the 2ndF key. The letters at the upper right of some keys (green in this drawing) are memory names.'),
    B.section('Turning on, clearing and fixing mistakes'),
    B.p('Press ON/C to turn either calculator on. To turn the TI-30Xa off, press OFF. To turn the Sharp off, press 2ndF and then ON/C, because OFF is the second function printed in orange above the ON/C key. These steps are for the battery TI-30Xa, the model drawn in this book. The TI-30Xa Solar works differently: its guidebook says to expose the solar panel to light to turn it on and to cover the panel with the slide case to turn it off.',
      'Start every calculation with a clear calculator. The calculator boxes in this book all start that way: press ON/C twice before the keys shown, and check that DEG is on the display.'),
    B.example({
      title: 'Fixing a wrong number',
      q: 'You meant to key 7 + 9 but pressed 8 instead of 9. Then you meant to key 125 × 4 but typed 1255. Fix each mistake without starting over.',
      steps: ['TI-30Xa: press ON/C once. One press clears only the number you were keying, so 7 + is still waiting. Key 9 and press =.', 'TI-30Xa: press ← to delete the last digit typed. 1255 becomes 125. Carry on with × 4 =.', 'Sharp: press DEL. When the cursor is at the right end of the line, DEL deletes the last character. Then key the right digit.'],
      calc: { rows: [{ label: 'ON/C once', seq: '7 + 8 ON/C 9 =', expect: '16' }, { label: 'Delete the last digit', seq: '1255 ← × 4 =', expect: '500' }], say: 'The Sharp column shows each line keyed without the mistake. On the Sharp, use DEL to make the fix. ON/C on the Sharp clears the entry.' },
      answer: '7 + 9 = 16 and 125 × 4 = 500.'
    }),
    B.watch('When in doubt, start again', 'On the TI-30Xa, pressing ON/C twice clears the display and every waiting operation. On the Sharp, ON/C clears the entry. If you are not sure what the calculator is holding, clear it and key the calculation again from the start.'),

    B.section('Second functions: the 2nd and 2ndF keys'),
    B.p('There are more jobs than keys, so most keys do two jobs. The job printed on the key is its first function. The job printed above the key is its ' + B.term('second function', 'The job printed above a key. Press 2nd (TI-30Xa) or 2ndF (Sharp) first, then the key.') + '. To use a second function, press 2nd on the TI-30Xa or 2ndF on the Sharp, then press the key.',
      'On the TI-30Xa, 2nd shows on the display while it waits for the next key. On the Sharp, the second functions are printed in orange, and 2ndF shows on the display after you press 2ndF. Some functions are a second function on one calculator and a key of their own on the other. The cube, x³, is an example.'),
    B.example({
      title: 'Cube and cube root',
      q: 'Find 5³ (5 × 5 × 5) and the cube root of 27.',
      steps: ['On the TI-30Xa, x³ and ³√x are second functions, so press 2nd before each one.', 'On the Sharp, x³ has its own key. ³√ is the second function printed above the x³ key, so press 2ndF first.'],
      calc: { rows: [{ label: '5³', seq: '5 x³', expect: '125' }, { label: 'Cube root of 27', seq: '27 ³√x', expect: '3' }] },
      answer: '5³ = 125 and the cube root of 27 is 3.'
    }),
    B.tip('Read the key before you press it', 'If the label you want is above the key, you need 2nd or 2ndF first.'),
    B.check('5 x³', '125'),
    B.check('( 12 + 8 ) × 3 =', '60'),
    B.check('123456789 × 1000 =', '123456789000'),
    B.check('75 x² × π =', '17671.46'),
    B.check('1625 − 375 =', '1250'),
    B.check('6000 − 1625 =', '4375'),

    B.section('Two ways to take keys'),
    B.p('The two calculators work out the same answer but want some keys in a different order.',
      'On the TI-30Xa, a function key such as x², √x or SIN goes after the number, and it works at once. Key 144, press √x, and 12 shows straight away.',
      'The Sharp has ' + B.term('D.A.L.', 'The way the Sharp EL-531XT takes keys: in the same order the calculation is written. The line is worked out when you press =.') + ' printed on its faceplate. For you, D.A.L. means this: press the keys in the same order the calculation is written. For √144 that is √ first, then 144, then =. The line is worked out when you press =. The top line of the display shows what you keyed, so you can read it back first.'),
    B.example({
      title: 'Square and square root',
      q: 'Find 12² and √144.',
      steps: ['12² means 12 × 12. Both calculators take x² after the number. The Sharp needs = to finish.', '√144 asks which number times itself makes 144. The TI-30Xa takes √x after the number. The Sharp takes √ first, as written.'],
      calc: { rows: [{ label: '12²', seq: '12 x²', expect: '144' }, { label: '√144', seq: '144 √x', expect: '12' }] },
      answer: '12² = 144 and √144 = 12. Each answer checks the other.'
    }),
    B.tryIt([
      { q: 'Write the TI-30Xa keys for √81.', a: keys('81 √x', 'ti30xa') + ' (answer ' + ti('81 √x') + ')' },
      { q: 'Write the Sharp keys for √81.', a: keys('81 √x', 'el531xt') + ' (answer ' + ti('81 √x') + ')' },
      { q: 'Find 15².', a: String(ti('15 x²')) },
      { q: 'Find √196.', a: String(ti('196 √x')) },
      { q: 'Find 4³.', a: String(ti('4 x³')) },
      { q: 'Find the cube root of 64.', a: String(ti('64 ³√x')) }
    ]),

    B.section('Negative numbers'),
    B.p('A negative number is less than zero, such as −5. Both calculators have a change-sign key that makes a number negative. It is not the minus key. The minus key subtracts one number from another.',
      'On the TI-30Xa, key the digits first and then press +⇄−. On the Sharp, press +/− first and then the digits, the way the number is written.'),
    B.example({
      title: 'A calculation with a negative number',
      q: 'Find 42 × (−5) + 120.',
      steps: ['The −5 is a negative number, so it needs the change-sign key, not the minus key.', '42 × (−5) = −210, then −210 + 120 = −90. Both displays show the minus sign in front.'],
      calc: { seq: '42 × 5 +⇄− + 120 =', expect: '-90' },
      answer: '−90'
    }),
    B.watch('Change sign or subtract?', 'Use the minus key between two numbers: 50 − 8. Use the change-sign key for a number that is negative on its own: 6 × (−4).'),
    B.tryIt([
      { q: '−8 + 15', a: n(ti('8 +⇄− + 15 =')) },
      { q: '6 × (−4)', a: n(ti('6 × 4 +⇄− =')) },
      { q: '−20 − 12', a: n(ti('20 +⇄− − 12 =')) },
      { q: '(−36) ÷ 9', a: n(ti('36 +⇄− ÷ 9 =')) }
    ]),
    B.p('Section 3.8 in Chapter 3 covers positive and negative numbers in full: the number line, adding and subtracting with signs, and the sign rules for × and ÷.'),

    B.section('Brackets, powers and π'),
    B.p(B.term('Brackets', null) + ' tell the calculator which part to work out first. Both calculators have ( and ) keys and take them in the order written: for (12 + 8) × 3, key ( 12 + 8 ) × 3 = and both show 60. Chapter 3 explains when you need them.'),
    B.p('An ' + B.term('exponent', null) + ' says how many of that number are multiplied together. 2⁵ = 2 × 2 × 2 × 2 × 2. Use the yˣ key: the number, then yˣ, then the exponent, then =. For 2⁵, key 2 yˣ 5 = on either calculator. Both show 32, and the Sharp shows 2^5= on its top line.'),
    B.check('2 yˣ 5 =', '32'),
    B.p('The π key enters the number π, about 3.14. Use it instead of typing 3.14, so the answer keeps all the digits.'),
    B.example({
      title: 'Using the π key',
      q: 'The distance around a circle is π × D, where D is the diameter (across the circle through its centre). The area is π × r², where r is the radius (half the diameter). A round duct has D = 150 mm and r = 75 mm. Find both, to two decimal places.',
      fig: P.circleR(75, 'mm', { max: '1.35in' }),
      steps: ['Distance around: π × 150 = 471.2388..., which rounds to 471.24 mm.', 'Area: 75² = 5,625, then π × 5,625 = 17,671.458..., which rounds to 17,671.46 mm². Key 75 x² × π = on both calculators.'],
      calc: { rows: [{ label: 'π × D', seq: 'π × 150 =', expect: '471.24' }, { label: 'π × r²', seq: '75 x² × π =', expect: '17,671.46' }] },
      answer: 'About 471.24 mm around and 17,671.46 mm² of area.'
    }),
    B.tryIt([
      { q: '(25 + 15) × 4', a: n(ti('( 25 + 15 ) × 4 =')) },
      { q: '3⁴', a: n(ti('3 yˣ 4 =')) },
      { q: '10³ using yˣ', a: n(ti('10 yˣ 3 =')) },
      { q: 'π × 200, to two decimal places', a: n(L.round(ti('π × 200 ='), 2), 2) },
      { q: 'π × 40², to two decimal places', a: n(L.round(ti('40 x² × π ='), 2), 2) },
      { q: '(18 − 6) ÷ 4', a: n(ti('( 18 − 6 ) ÷ 4 =')) }
    ]),

    B.section('The fraction key'),
    B.p('Both calculators have an a b/c key for fractions. To key a mixed number such as 3¼, key the whole number, a b/c, the top number, a b/c, the bottom number. The answer comes back as a fraction. Chapter 4 covers fractions in full.'),
    B.example({
      title: 'Fractions of an inch',
      q: 'Add 3¼ in and 2⅝ in. Then change ⅜ in to a decimal.',
      steps: ['Key 3 a b/c 1 a b/c 4 for 3¼ and 2 a b/c 5 a b/c 8 for 2⅝.', 'The TI-30Xa shows 5⌟7⌟8 and the Sharp shows 5┌7┌8. Both mean 5 and 7/8: the whole number, then the top number, then the bottom number.', 'To change a fraction answer to a decimal, press 2nd F⇄D on the TI-30Xa. On the Sharp, press a b/c after the answer. The second row changes ⅜ to a decimal.'],
      calc: { rows: [{ label: '3¼ + 2⅝', seq: '3 ab/c 1 ab/c 4 + 2 ab/c 5 ab/c 8 =', expect: '5.875' }, { label: '⅜ as a decimal', seq: '3 ab/c 8 F⇄D', expect: '0.375' }] },
      answer: '5' + L.fr(7, 8) + ' in, and ⅜ in = 0.375 in.'
    }),
    B.tryIt([
      { q: '1½ + 2¾ with the fraction key', a: L.frac(17, 4) + ' (4.25)' },
      { q: 'Change ⅝ to a decimal.', a: String(ti('5 ab/c 8 F⇄D')) },
      { q: 'Change 2⅜ to a decimal.', a: String(ti('2 ab/c 3 ab/c 8 F⇄D')) },
      { q: '¾ × 120', a: String(ti('3 ab/c 4 × 120 =')) }
    ]),
    B.check('1 ab/c 1 ab/c 2 + 2 ab/c 3 ab/c 4 =', '4.25'),
    B.p('Section 2.12 shows how to key a tape length in feet, inches and fractions of an inch.'),

    B.section('Percent'),
    B.p('The percent key (%) is a second function on both calculators: 2nd % on the TI-30Xa and 2ndF % on the Sharp, where % is printed above the 1 key. On the TI-30Xa you finish with =. On the Sharp, 2ndF % works out the line itself, so you do not press = after it.'),
    B.example({
      title: 'Percent of a number, and adding a percent',
      q: 'An order is for 250 bolts. Find 15% of 250. Then find 250 plus 15% more.',
      steps: ['15% of 250: on the TI-30Xa key 250 × 15 2nd % =. On the Sharp key 250 × 15 2ndF %.', '250 plus 15%: on the TI-30Xa key 250 + 15 2nd % =. On the Sharp key 250 + 15 2ndF %. The calculator adds 15% of 250 to 250.'],
      calc: { rows: [{ label: '15% of 250', seq: '250 × 15 % =', expect: '37.5' }, { label: '250 + 15%', seq: '250 + 15 % =', expect: '287.5' }] },
      answer: '15% of 250 is 37.5. Adding 15% gives 287.5, so order 288 bolts.'
    }),
    B.tip('Percent without the % key', '15% means 15 out of 100. You can always key it as × 15 ÷ 100: 250 × 15 ÷ 100 = 37.5. Chapter 6 covers percent in full.'),
    B.check('250 × 15 ÷ 100 =', '37.5'),

    B.section('Memory: STO and RCL'),
    B.p('A ' + B.term('memory', 'A place in the calculator that holds a number until you need it again. STO stores the number and RCL recalls it.') + ' holds a number so you do not have to write it down and key it again. STO (store) puts a number in a memory. RCL (recall) brings it back.',
      'The TI-30Xa has three memories, 1, 2 and 3. Press STO then 1 to store the display in memory 1. The Sharp names its memories with letters: A to F, X, Y and M. The letters are printed at the upper right above some keys. A is above yˣ, so STO then yˣ stores in A, and the box shows that key as A. On the Sharp, STO finishes the line you keyed and stores the answer.'),
    B.example({
      title: 'Storing a cut list total',
      q: 'Two pieces, 1,250 mm and 375 mm, are cut from a 6,000 mm bar. Ignore the saw cuts. Store the total of the pieces, clear the display, then find the offcut.',
      steps: ['1,250 + 375 = 1,625. Store it in memory 1 (A on the Sharp).', 'Press ON/C. The memory keeps the number.', '6,000 − RCL 1 = 6,000 − 1,625 = 4,375.'],
      calc: { seq: '1250 + 375 = STO 1 ON/C 6000 − RCL 1 =', expect: '4,375', say: 'The TI-30Xa shows 4375. and the Sharp shows 4’375. The memory kept 1,625 after ON/C on both calculators.' },
      answer: '4,375 mm'
    }),
    B.watch('Old numbers stay in memory', 'Clearing with ON/C does not empty the memories, so a memory can still hold a number from an earlier job. Store the number you need before you recall it.'),

    B.section('Angles: DEG and the trig keys'),
    B.p('The trig keys SIN, COS and TAN work with angles. Chapter 13 explains what they mean. Angles can be measured in degrees, radians or grads, and the calculator must be set to the unit you are using. This book uses degrees.',
      'Each press of DRG changes the angle unit in the order DEG, RAD, GRAD. The unit shows at the top of the display. Before any trig calculation, check that DEG is showing. If RAD or GRAD shows, press DRG until DEG comes back.'),
    B.figure(B.figrow(P.lcd('ti', '0.', { ind: 'DEG', max: '2.3in', indS: 10 }), P.lcd('sharp', '0.', { ind: 'DEG', max: '2.3in', indS: 10 })), 'DEG at the top of each display means the calculator is set to degrees.'),
    B.p('The trig keys follow the same rule as the other functions. On the TI-30Xa, key the angle and then SIN. On the Sharp, press sin, the angle and =. The inverse keys, SIN⁻¹, COS⁻¹ and TAN⁻¹, are second functions. They take a number and give back an angle.'),
    B.example({
      title: 'Trig keys and their inverses',
      q: 'Find sin 30°. Find the angle whose tangent is 0.75, to two decimal places. Then find 600 × tan 35°, to two decimal places.',
      steps: ['sin 30° = 0.5.', 'The angle whose tangent is 0.75 uses TAN⁻¹: 2nd TAN⁻¹ on the TI-30Xa, 2ndF tan⁻¹ on the Sharp. The display shows 36.86989765, which rounds to 36.87°.', '600 × tan 35°: on the TI-30Xa, 35 TAN gives tan 35°, then × 600. On the Sharp, key tan 35 × 600 = as written. 420.1245229 rounds to 420.12.'],
      calc: { rows: [{ label: 'sin 30°', seq: '30 SIN', expect: '0.5' }, { label: 'tan⁻¹ 0.75', seq: '0.75 TAN⁻¹', expect: '36.87' }, { label: '600 × tan 35°', seq: '35 TAN × 600 =', expect: '420.12' }] },
      answer: 'sin 30° = 0.5, the angle is 36.87°, and 600 × tan 35° = 420.12.'
    }),
    B.tryIt([
      { q: 'cos 60°', a: String(L.round(ti('60 COS'), 4)) },
      { q: 'sin 45°, to four decimal places', a: n(L.round(ti('45 SIN'), 4), 4) },
      { q: 'tan 20°, to four decimal places', a: n(L.round(ti('20 TAN'), 4), 4) },
      { q: 'The angle whose sine is 0.5', a: String(ti('0.5 SIN⁻¹')) + '°' },
      { q: 'The angle whose cosine is 0.8, to two decimal places', a: n(L.round(ti('0.8 COS⁻¹'), 2), 2) + '°' },
      { q: '250 × cos 40°, to two decimal places', a: n(L.round(ti('40 COS × 250 ='), 2), 2) }
    ]),

    B.section('Checking a result'),
    B.p('A calculator does exactly what you key, including your mistakes. Before you cut or order, check the answer in at least one of these ways.'),
    B.how(['Estimate first. Round the numbers and work it out in your head, as in Chapter 1. The calculator answer should be close.', 'Work it backwards. If √144 = 12, then 12² should give 144. If 6,000 − 1,625 = 4,375, then 4,375 + 1,625 should give 6,000.', 'Read the Sharp top line. It shows the calculation you keyed, so you can spot a wrong number before you press =.', 'Key it again. If the second answer differs from the first, key it a third time slowly.']),
    B.p('An answer with more than 10 digits does not fit on the display. The calculator then shows it with a small number at the right, called an exponent of 10. For 123,456,789 × 1,000, both calculators show 1.23456789 with a small 11, which means 1.23456789 × 10¹¹, or 123,456,789,000.'),
    B.shop('Write the answer with its unit', 'The display shows a number, not a size. Write the unit next to every answer you copy down: 4,375 mm, not 4375. A number without a unit is a guess on the shop floor.'),

    B.section('Tape lengths in feet, inches and fractions'),
    B.p('A carpenter’s tape reads feet, inches and fractions of an inch, such as 8′ ' + L.mx(5, 3, 8) + '″ (8 feet ' + L.mx(5, 3, 8) + ' inches). To work with a length like this on either calculator, change it to inches first. One foot is 12 inches, so the length in inches is feet × 12 + inches. The fraction key carries the fraction of an inch.',
      'BEDMAS works the × 12 before the +, so no brackets are needed: key 8 × 12 + 5 a b/c 3 a b/c 8 =. Both calculators show the answer as a mixed number of inches, the same way they show any fraction answer (Section 2.7).'),
    B.example({
      title: 'Keying a tape length',
      q: 'A stud is cut to 8′ ' + L.mx(5, 3, 8) + '″. Find its length in inches. Then find it in millimetres, to the nearest millimetre. One inch is exactly 25.4 mm.',
      steps: ['Inches: 8 × 12 + ' + L.mx(5, 3, 8) + ' = 96 + ' + L.mx(5, 3, 8) + ' = ' + L.mx(101, 3, 8) + ' in. The TI-30Xa shows 101⌟3⌟8 and the Sharp shows 101┌3┌8.', 'Millimetres: carry on from the answer with × 25.4 =. ' + L.mx(101, 3, 8) + ' × 25.4 = ' + n(ti('8 × 12 + 5 ab/c 3 ab/c 8 = × 25.4 =')) + ', which rounds to ' + n(L.round(ti('8 × 12 + 5 ab/c 3 ab/c 8 = × 25.4 ='), 0)) + ' mm.', 'On the Sharp, the second row puts the inches in brackets, because it keys the whole line in written order.'],
      calc: { rows: [{ label: 'Feet and inches to inches', seq: '8 × 12 + 5 ab/c 3 ab/c 8 =', expect: '101.375' }, { label: 'Inches to mm', seq: '8 × 12 + 5 ab/c 3 ab/c 8 = × 25.4 =', expect: n(L.round(ti('8 × 12 + 5 ab/c 3 ab/c 8 = × 25.4 ='), 0)) }] },
      answer: L.mx(101, 3, 8) + ' in, or about ' + n(L.round(ti('8 × 12 + 5 ab/c 3 ab/c 8 = × 25.4 ='), 0)) + ' mm.'
    }),
    B.example({
      title: 'Adding tape lengths',
      q: 'Two pieces of trim, 7′ ' + L.mx(4, 5, 8) + '″ and 3′ ' + L.mx(9, 3, 4) + '″, are butted end to end. Find the total length in feet and inches.',
      steps: ['Change both to inches in one line: 7 × 12 + ' + L.mx(4, 5, 8) + ' + 3 × 12 + ' + L.mx(9, 3, 4) + ' = ' + L.mx(134, 3, 8) + ' in. BEDMAS does both × 12 before the additions.', 'Whole feet: ' + L.mx(134, 3, 8) + ' ÷ 12. The display shows 11 and a fraction. The whole number at the front, 11, is the number of whole feet.', 'Inches left over: ' + L.mx(134, 3, 8) + ' − 11 × 12 = ' + L.mx(134, 3, 8) + ' − 132 = ' + L.mx(2, 3, 8) + ' in.'],
      calc: { rows: [{ label: 'Total in inches', seq: '7 × 12 + 4 ab/c 5 ab/c 8 + 3 × 12 + 9 ab/c 3 ab/c 4 =', expect: '134.375' }, { label: 'Whole feet', seq: '134 ab/c 3 ab/c 8 ÷ 12 =', expect: n(L.round(ti('134 ab/c 3 ab/c 8 ÷ 12 ='), 2), 2) }, { label: 'Inches left over', seq: '134 ab/c 3 ab/c 8 − 11 × 12 =', expect: '2.375' }] },
      answer: L.ftin(ti('7 × 12 + 4 ab/c 5 ab/c 8 + 3 × 12 + 9 ab/c 3 ab/c 4 ='), 16) + ' (' + L.mx(134, 3, 8) + ' in)'
    }),
    B.watch('Feet and inches are not decimals', '8′ 6″ is not 8.6 ft. There are 12 inches in a foot, not 10. Key 8 × 12 + 6 = to get 102 in, and 102 ÷ 12 = 8.5 ft.'),
    B.check('8 × 12 + 6 =', '102'), B.check('102 ÷ 12 =', '8.5'),
    B.tryIt([
      { q: '6′ ' + L.mx(3, 1, 2) + '″ in inches', a: L.inch(ti('6 × 12 + 3 ab/c 1 ab/c 2 ='), 16) },
      { q: '10′ ' + L.mx(7, 3, 4) + '″ in inches', a: L.inch(ti('10 × 12 + 7 ab/c 3 ab/c 4 ='), 16) },
      { q: '2′ ' + L.mx(9, 1, 16) + '″ in inches', a: L.inch(ti('2 × 12 + 9 ab/c 1 ab/c 16 ='), 16) },
      { q: '4′ ' + L.mx(2, 5, 8) + '″ + 5′ ' + L.mx(11, 1, 8) + '″, in feet and inches', a: L.ftin(ti('4 × 12 + 2 ab/c 5 ab/c 8 + 5 × 12 + 11 ab/c 1 ab/c 8 ='), 16) + ' (' + L.inch(ti('4 × 12 + 2 ab/c 5 ab/c 8 + 5 × 12 + 11 ab/c 1 ab/c 8 ='), 16) + ')' },
      { q: '12′ minus 3′ ' + L.mx(8, 1, 4) + '″, in feet and inches. Put the length you take away in brackets.', a: L.ftin(ti('12 × 12 − ( 3 × 12 + 8 ab/c 1 ab/c 4 ) ='), 16) + ' (12 × 12 − (3 × 12 + ' + L.mx(8, 1, 4) + ') = ' + L.inch(ti('12 × 12 − ( 3 × 12 + 8 ab/c 1 ab/c 4 ) ='), 16) + ')' },
      { q: L.mx(92, 5, 8) + '″ in millimetres, to the nearest millimetre', a: n(L.round(ti('92 ab/c 5 ab/c 8 × 25.4 ='), 0)) + ' mm' }
    ]),
    B.check('12 × 12 − ( 3 × 12 + 8 ab/c 1 ab/c 4 ) =', String(ti('12 × 12 − ( 3 × 12 + 8 ab/c 1 ab/c 4 ) ='))),
    B.check('4 × 12 + 2 ab/c 5 ab/c 8 + 5 × 12 + 11 ab/c 1 ab/c 8 =', String(ti('4 × 12 + 2 ab/c 5 ab/c 8 + 5 × 12 + 11 ab/c 1 ab/c 8 ='))),
    B.check('92 ab/c 5 ab/c 8 × 25.4 =', String(ti('92 ab/c 5 ab/c 8 × 25.4 ='))),

    B.worksheet({ title: 'Key it in', sub: 'Write the keys for both calculators, then the answer', intro: 'For each problem, write the key sequence for the TI-30Xa and for the Sharp EL-531XT. Then work it out on your own calculator. Start each one with ON/C ON/C and DEG on the display.' }),
    B.grid2(...wsA.slice(0, 4).map(w => B.prob({ q: w.q, a: n(ti(w.seq)) + '. ' + both(w.seq), lines: 3 }))),
    B.grid2(
      B.prob({ q: 'The circle has the radius shown. Find D = 2 × r, then the distance around, π × D, to two decimal places.', canvas: P.circleR(60, 'mm', { max: '1.5in' }), a: 'D = 120 mm. π × 120 = ' + n(L.round(ti('π × 120 ='), 2), 2) + ' mm. ' + both('π × 120 ='), lines: 2 }),
      B.prob({ q: 'Add 2¾ in and 1⅝ in with the fraction key. Write the answer as each display shows it, then in the usual way.', a: '4' + L.fr(3, 8) + ' in. The TI-30Xa shows 4⌟3⌟8 and the Sharp shows 4┌3┌8. ' + both('2 ab/c 3 ab/c 4 + 1 ab/c 5 ab/c 8 ='), lines: 5 })
    ),
    B.check('2 ab/c 3 ab/c 4 + 1 ab/c 5 ab/c 8 =', '4.375'),
    B.grid2(
      B.prob({ q: 'Find 20% of 340 kg.', a: n(ti('340 × 20 % =')) + ' kg. ' + both('340 × 20 % ='), lines: 3 }),
      B.prob({ q: 'Find 800 × sin 25°, to two decimal places. Check that DEG is on the display first.', a: n(L.round(ti('25 SIN × 800 ='), 2), 2) + '. ' + both('25 SIN × 800 ='), lines: 3 })
    ),

    B.worksheet({ title: 'Know your keys, read the display', sub: 'Name the lettered keys and read each display', intro: 'The red letters mark keys on each faceplate. Name each key and say what it does. For the displays, write the number in the usual way.' }),
    B.prob({ q: 'Name keys A to H and say what each one does. A to D are on the TI-30Xa, E to H on the Sharp EL-531XT.', canvas: P.pair({ askTi: { abc: 'A', neg: 'B', drg: 'C', sto: 'D' }, askSharp: { '2ndf': 'E', neg: 'F', sqrt: 'G', del: 'H' }, max: '6.45in' }), mode: 'Name the keys', a: 'A: a b/c, the fraction key. B: +⇄−, change sign (after the digits). C: DRG, changes the angle unit. D: STO, stores the display in memory. E: 2ndF, for the orange second functions. F: +/−, change sign (before the number). G: √, square root (before the number). H: DEL, deletes a character.', lines: 3 }),
    B.grid2(
      B.prob({ q: 'Write the number this display shows.', canvas: P.lcd('ti', '3⌟5⌟16', { max: '2.4in', indS: 11 }), mode: 'Read', a: '3' + L.fr(5, 16), lines: 1 }),
      B.prob({ q: 'What calculation was keyed? What is the answer?', canvas: P.lcd('sharp', '15.', { top: '√225=', max: '2.4in', indS: 11 }), mode: 'Read', a: 'The square root of 225. The answer is 15.', lines: 1 })
    ),
    B.prob({ q: 'This display shows RAD. What do you press before you use SIN?', canvas: P.lcd('ti', '0.', { ind: 'RAD', max: '2.4in', indS: 11 }), mode: 'Read', a: 'Press DRG until DEG shows (RAD, then GRAD, then DEG: two presses).', lines: 1 }),
    B.check('225 √x', '15')
  ]);
};
