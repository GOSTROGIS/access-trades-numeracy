/* Exercise Book, Chapter 3: Order of Operations. Every answer is computed here and checked on the TI-30Xa and Sharp
   emulators with B.check. */
module.exports = function (B, L) {
  const F = require('../engine/figs.js');
  const P = require('../engine/figs-ch02.js');
  const n = L.num;
  const ti = seq => L.CALC.tiValue(seq).value;
  const bar = (top, bot) => '<span class="m">' + L.fr(top, bot) + '</span>';
  /* a short skill problem with its answer from the calculator sequence, checked on both emulators */
  const s = (q, seq, dp) => { const v = dp == null ? ti(seq) : L.round(ti(seq), dp); return [B.prob({ q, a: dp == null ? n(v) : n(v, dp), lines: 3 }), B.check(seq, String(ti(seq)))]; };

  /* L-shaped plate split into A (upright) and B (base) */
  function lPlate(W, H, a, b, o) {
    o = o || {};
    const S = 240 / Math.max(W, H), x0 = 92, y0 = 40, fs = o.fs || 19;
    const Pt = (x, y) => [x0 + x * S, y0 + (H - y) * S];
    let h = F.poly([Pt(0, 0), Pt(W, 0), Pt(W, b), Pt(a, b), Pt(a, H), Pt(0, H)]);
    h += F.line(Pt(0, b)[0], Pt(0, b)[1], Pt(a, b)[0], Pt(a, b)[1], { c: '#4A4E54', w: 1.4, dash: '6 4' });
    h += F.t(Pt(a / 2, (H + b) / 2)[0], Pt(a / 2, (H + b) / 2)[1] + 8, 'A', { s: 24, b: true, c: F.C.edge });
    h += F.t(Pt(W / 2, b / 2)[0], Pt(W / 2, b / 2)[1] + 8, 'B', { s: 24, b: true, c: F.C.edge });
    h += F.dim(Pt(0, 0)[0], Pt(0, 0)[1], Pt(W, 0)[0], Pt(W, 0)[1], n(W) + ' mm', 30, { s: fs });
    h += F.dim(Pt(0, b)[0], Pt(0, b)[1], Pt(0, H)[0], Pt(0, H)[1], n(H - b) + ' mm', -44, { s: fs, wd: fs * 3.4 });
    h += F.dim(Pt(0, 0)[0], Pt(0, 0)[1], Pt(0, b)[0], Pt(0, b)[1], n(b) + ' mm', -44, { s: fs, wd: fs * 3.4 });
    h += F.dim(Pt(0, H)[0], Pt(0, H)[1], Pt(a, H)[0], Pt(a, H)[1], n(a) + ' mm', -30, { s: fs });
    return F.svg(x0 + W * S + 30, y0 + H * S + 62, h, { max: o.max || '2.4in' });
  }
  /* plate with a row of evenly spaced holes, spacing shown as the red ? */
  function holeRow(len, end, holes, o) {
    o = o || {};
    const Wd = 560, x0 = 24, sc = (Wd - 2 * x0) / len, y = 40, H = 64, sp = (len - 2 * end) / (holes - 1), fs = 15;
    let h = F.rect(x0, y, len * sc, H);
    for (let i = 0; i < holes; i++) h += F.circle(x0 + (end + i * sp) * sc, y + H / 2, 8, { fill: '#FFFFFF', w: 1.8 });
    h += F.dim(x0 + end * sc, y + H, x0 + (end + sp) * sc, y + H, '?', 26, { ask: true, s: fs });
    /* the end distances are too short for a label on the line: draw the dimension bare and put the label below it */
    h += F.dim(x0, y + H, x0 + end * sc, y + H, '', 62, { s: fs, wd: -10 }) + F.dim(x0 + (len - end) * sc, y + H, x0 + len * sc, y + H, '', 62, { s: fs, wd: -10 });
    h += F.t(x0 + end * sc / 2, y + H + 88, n(end) + ' mm', { s: fs, b: true }) + F.t(x0 + (len - end / 2) * sc, y + H + 88, n(end) + ' mm', { s: fs, b: true });
    h += F.dim(x0, y, x0 + len * sc, y, n(len) + ' mm', -24, { s: fs + 1 });
    return F.svg(Wd, y + H + 100, h, { max: o.max || '5in' });
  }

  return L.join([
    B.exChapter({ num: 3, id: 'order', title: 'Order of Operations', intro: 'Practice with BEDMAS: brackets, exponents and roots, × and ÷ left to right, + and − left to right, and the fraction bar. Work each problem on paper first, then key it so the calculator follows the same order.' }),

    B.worksheet({ title: 'Skills', sub: 'Work each one out with BEDMAS' }),
    B.grid2(
      ...s('9 + 6 × 4', '9 + 6 × 4 ='),
      ...s('50 − 18 ÷ 3', '50 − 18 ÷ 3 ='),
      ...s('7 × 8 − 6 × 5', '7 × 8 − 6 × 5 ='),
      ...s('(15 − 7) × 4', '( 15 − 7 ) × 4 ='),
      ...s('36 ÷ (4 + 5)', '36 ÷ ( 4 + 5 ) ='),
      ...s('[30 − (8 + 7)] ÷ 5', '( 30 − ( 8 + 7 ) ) ÷ 5 ='),
      ...s('2 × [12 + (9 − 3)]', '2 × ( 12 + ( 9 − 3 ) ) ='),
      ...s('6² − 4 × 5', '6 x² − 4 × 5 ='),
      ...s('(6 − 4)² × 5', '( 6 − 4 ) x² × 5 ='),
      ...s('3 × 4²', '3 × 4 x² ='),
      ...s('√(144 − 44)', '( 144 − 44 ) √x'),
      ...s('√49 + √81', '49 √x + 81 √x ='),
      ...s('72 ÷ 6 ÷ 3', '72 ÷ 6 ÷ 3 ='),
      ...s('15 ÷ 3 × 5', '15 ÷ 3 × 5 ='),
      ...s('40 − 15 + 5', '40 − 15 + 5 ='),
      ...s('2 + 3³', '2 + 3 yˣ 3 ='),
      ...s(bar('56 + 28', '9 − 2'), '( 56 + 28 ) ÷ ( 9 − 2 ) ='),
      ...s(bar('3 × 15 + 5', '10 × 2'), '( 3 × 15 + 5 ) ÷ ( 10 × 2 ) =')
    ),
    B.grid2(
      B.prob({ q: 'Add one pair of brackets to make this true: ' + L.m('4 + 6 × 3 = 30') + '.', a: '(4 + 6) × 3 = 30', lines: 2 }),
      B.prob({ q: 'Add one pair of brackets to make this true: ' + L.m('24 ÷ 6 − 2 = 6') + '.', a: '24 ÷ (6 − 2) = 6', lines: 2 })
    ),
    B.check('( 4 + 6 ) × 3 =', '30'), B.check('24 ÷ ( 6 − 2 ) =', '6'),

    B.worksheet({ title: 'Shop problems', sub: 'Write one calculation for each job, then work it out' }),
    B.prob({ q: 'A spool piece has 6 flanges with 8 bolts each. You also want 4 spare bolts. Write one calculation for the bolts needed and work it out.', a: '6 × 8 + 4 = ' + ti('6 × 8 + 4 =') + ' bolts', lines: 6 }),
    B.check('6 × 8 + 4 =', '52'),
    B.prob({ q: 'A rectangular guard frame is 1,350 mm by 875 mm. The distance around it is ' + L.m('2 × (1,350 + 875)') + '. Find it.', a: n(ti('2 × ( 1350 + 875 ) =')) + ' mm', work: 'Brackets first: 2,225. Then 2 × 2,225.', lines: 6 }),
    B.check('2 × ( 1350 + 875 ) =', '4450'),
    B.prob({ q: 'Four 27 in pieces and two 15 in pieces are cut from a 144 in bar. Ignore the saw cuts. The offcut is ' + L.m('144 − (4 × 27 + 2 × 15)') + '. Find it.', a: ti('144 − ( 4 × 27 + 2 × 15 ) =') + ' in', work: '4 × 27 = 108, 2 × 15 = 30, 108 + 30 = 138, 144 − 138 = 6.', lines: 6 }),
    B.check('144 − ( 4 × 27 + 2 × 15 ) =', '6'),
    B.prob({ q: 'Three pipe spools measure 3,250 mm, 2,980 mm and 3,105 mm. Their average length is ' + bar('3,250 + 2,980 + 3,105', '3') + '. Find it to two decimal places.', a: n(L.round(ti('( 3250 + 2980 + 3105 ) ÷ 3 ='), 2), 2) + ' mm', lines: 6 }),
    B.check('( 3250 + 2980 + 3105 ) ÷ 3 =', '3111.67'),
    B.prob({ q: 'A 60 in bar has 5 evenly spaced holes, with the end holes 4 in from the ends. The spacing is ' + bar('60 − 2 × 4', '4') + '. Find it.', a: ti('( 60 − 2 × 4 ) ÷ 4 =') + ' in', lines: 6 }),
    B.check('( 60 − 2 × 4 ) ÷ 4 =', '13'),
    B.prob({ q: 'Three pipe pieces of 1,200 mm, 850 mm and 640 mm go into a run with 6 fittings. For this job each fitting takes up 25 mm of the run. The length of the run is ' + L.m('(1,200 + 850 + 640) + 6 × 25') + '. Find it.', a: n(ti('( 1200 + 850 + 640 ) + 6 × 25 =')) + ' mm', lines: 6 }),
    B.check('( 1200 + 850 + 640 ) + 6 × 25 =', '2840'),
    B.prob({ q: 'A crew of 3 works 8 hours and a crew of 2 works 10 hours. The total hours are ' + L.m('3 × 8 + 2 × 10') + '. A learner keys ' + L.m('(3 × 8 + 2) × 10') + ' instead. Find both answers and say which is right.', a: 'Right: 3 × 8 + 2 × 10 = ' + ti('3 × 8 + 2 × 10 =') + ' hours. The wrong one gives ' + ti('( 3 × 8 + 2 ) × 10 =') + '.', lines: 6 }),
    B.check('3 × 8 + 2 × 10 =', '44'), B.check('( 3 × 8 + 2 ) × 10 =', '260'),
    B.prob({ q: 'A learner finds a hole spacing by keying 1,500 − 300 ÷ 4 = and gets 1,425. The spacing should be ' + bar('1,500 − 300', '4') + '. What went wrong? What are the right keys and the right answer?', a: 'The calculator divided 300 ÷ 4 first. Key ( 1500 − 300 ) ÷ 4 = to get ' + ti('( 1500 − 300 ) ÷ 4 =') + ' mm.', lines: 6 }),
    B.check('1500 − 300 ÷ 4 =', '1425'), B.check('( 1500 − 300 ) ÷ 4 =', '300'),

    B.worksheet({ title: 'Shape Canvas', sub: 'Write the calculation for each drawing, then work it out' }),
    B.grid2(
      B.prob({ q: 'The plate is split into A and B. Its area in mm² is ' + L.m('400 × 350 + 1,000 × 300') + '. Work it out.', canvas: lPlate(1000, 650, 400, 300, { max: '2.2in' }), a: '140,000 + 300,000 = ' + n(ti('400 × 350 + 1000 × 300 =')) + ' mm²', lines: 2 }),
      B.prob({ q: 'The distance around this frame is 3,000 mm. Find the hidden length with ' + L.m('L = 3,000 ÷ 2 − 600') + '.', canvas: P.rectLW(900, 600, 'mm', { ask: 'l', max: '2.3in' }), a: 'L = 1,500 − 600 = ' + n(ti('3000 ÷ 2 − 600 =')) + ' mm', lines: 2 })
    ),
    B.check('400 × 350 + 1000 × 300 =', '440000'), B.check('3000 ÷ 2 − 600 =', '900'),
    B.prob({ q: 'Four 1,200 mm pieces are cut from a 6,000 mm bar with four cuts. The kerf is 3 mm. The offcut is ' + L.m('6,000 − (4 × 1,200 + 4 × 3)') + '. Find it.', canvas: F.cutBar([{ len: 1200 }, { len: 1200 }, { len: 1200 }, { len: 1200 }], { total: 6000, askRest: true, max: '5.4in' }), a: n(ti('6000 − ( 4 × 1200 + 4 × 3 ) =')) + ' mm', lines: 2 }),
    B.check('6000 − ( 4 × 1200 + 4 × 3 ) =', '1188'),
    B.prob({ q: 'The ring has R = 60 mm and r = 45 mm. Its area is ' + L.m('π × (R² − r²)') + '. Find it to two decimal places. Then change one value: what is the area if r becomes 30 mm?', canvas: P.ringR(60, 45, 'mm', { max: '2.4in' }), a: 'π × (3,600 − 2,025) = ' + n(L.round(ti('( 60 x² − 45 x² ) × π ='), 2), 2) + ' mm². With r = 30 mm: π × (3,600 − 900) = ' + n(L.round(ti('( 60 x² − 30 x² ) × π ='), 2), 2) + ' mm².', lines: 3 }),
    B.prob({ q: 'Nine holes are evenly spaced on a 2,000 mm plate. The spacing is ' + L.m('(2,000 − 2 × 80) ÷ 8') + '. Find it.', canvas: holeRow(2000, 80, 9, { max: '5.2in' }), a: n(ti('( 2000 − 2 × 80 ) ÷ 8 =')) + ' mm', lines: 3 }),
    B.check('( 60 x² − 45 x² ) × π =', '4948.01'), B.check('( 60 x² − 30 x² ) × π =', '8482.30'), B.check('( 2000 − 2 × 80 ) ÷ 8 =', '230')
  ]);
};
