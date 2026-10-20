/* Exercise Book, Chapter 1: Whole Numbers. Every answer is computed here from the numbers in the question. */
module.exports = function (B, L) {
  const F = require('../engine/figs.js');
  const n = L.num;
  const g = (q, a, o) => B.prob(Object.assign({ q, a, lines: 2 }, o || {}));
  const rnd = (v, to) => Math.round(v / to) * to;
  const sum = xs => xs.reduce((a, b) => a + b, 0);

  /* a plate with a straight row of holes: length, end distance, hole count. ask: 'end' | 'space' | 'len' */
  function holePlate(len, end, holes, o) {
    o = o || {};
    const W = 600, x0 = 30, sc = (W - 2 * x0) / len, y = 40, H = 70, u = o.unit || ' mm', fs = o.fs || 14;
    const sp = (len - 2 * end) / (holes - 1);
    let h = F.rect(x0, y, len * sc, H);
    for (let i = 0; i < holes; i++) h += F.circle(x0 + (end + i * sp) * sc, y + H / 2, 9, { fill: '#FFFFFF', w: 1.8 });
    /* a short end dimension: the label sits below the dimension line so it does not cover the arrows */
    const endDim = (xa, xb, lab, ask) => {
      const yd = y + H + 50, c = F.C.dim
      return F.line(xa, y + H + 3, xa, yd + 6, { c, w: 1.1 }) + F.line(xb, y + H + 3, xb, yd + 6, { c, w: 1.1 }) +
        F.line(xa, yd, xb, yd, { c, w: 1.2 }) + F.arrowHead(xa, yd, Math.PI) + F.arrowHead(xb, yd, 0) +
        F.label((xa + xb) / 2, yd + fs + 9, lab, { ask, s: fs })
    }
    h += endDim(x0, x0 + end * sc, o.ask === 'end' ? '?' : n(end) + u, o.ask === 'end')
    h += F.dim(x0 + end * sc, y + H, x0 + (end + sp) * sc, y + H, o.ask === 'space' ? '?' : n(sp) + u, 24, { ask: o.ask === 'space', s: fs })
    h += endDim(x0 + (len - end) * sc, x0 + len * sc, n(end) + u, false)
    h += F.dim(x0, y, x0 + len * sc, y, o.ask === 'len' ? '?' : n(len) + u, -26, { ask: o.ask === 'len', s: fs + 1 });
    return F.svg(W, y + H + 92, h, { max: o.max || '5.4in' });
  }
  /* L-shaped plate: overall width W, overall height H, upright leg width a, base height b. ask and hide: lists of names */
  function lPlate(W, H, a, b, o) {
    o = o || {};
    const ask = o.ask || [], hide = o.hide || [], fs = o.fs || 19;
    const S = 300 / Math.max(W, H), x0 = 92, y0 = 40;
    const P = (x, y) => [x0 + x * S, y0 + (H - y) * S];
    let h = F.poly([P(0, 0), P(W, 0), P(W, b), P(a, b), P(a, H), P(0, H)]);
    const D = (k, p1, p2, v, off) => hide.includes(k) ? '' : F.dim(p1[0], p1[1], p2[0], p2[1], ask.includes(k) ? '?' : n(v) + ' mm', off, { ask: ask.includes(k), s: fs });
    h += D('W', P(0, 0), P(W, 0), W, 30);
    h += D('H', P(0, 0), P(0, H), H, -50);
    h += D('a', P(0, H), P(a, H), a, -28);
    h += D('b', P(W, 0), P(W, b), b, 48);
    /* o.cTop: the c dimension goes above the top of the upright, in line with a, so it does not cross d in the notch */
    if (o.cTop) h += F.line(P(W, b)[0], P(W, b)[1] - 3, P(W, H)[0], P(W, H)[1], { c: F.C.dim, w: 1.1 }) + D('c', P(a, H), P(W, H), W - a, -28)
    else h += D('c', P(a, b), P(W, b), W - a, -26);
    h += D('d', P(a, b), P(a, H), H - b, 40);
    if (o.split) h += F.line(P(a, 0)[0], P(a, 0)[1], P(a, b)[0], P(a, b)[1], { c: '#4A4E54', w: 1.4, dash: '6 4' }) + F.t(P(a / 2, H / 2)[0], P(a / 2, H / 2)[1] + 7, 'A', { s: 22, b: true, c: '#940010' }) + F.t(P((a + W) / 2, b / 2)[0], P((a + W) / 2, b / 2)[1] + 7, 'B', { s: 22, b: true, c: '#940010' });
    return F.svg(x0 + W * S + 100, y0 + H * S + 62, h, { max: o.max || '3in' });
  }
  /* rows of holes in a plate, with an optional callout note */
  function holeGrid(rows, cols, note) {
    const gp = 34, W = cols * gp + 40, Hh = rows * gp + 30, top = note ? 46 : 0;
    let h = F.rect(8, 8 + top, W - 16, Hh - 16);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) h += F.circle(28 + c * gp, 26 + top + r * gp, 8, { fill: '#FFFFFF', w: 1.6 });
    if (note) h += F.callout(28 + (cols - 1) * gp, 26 + top, W - 120, 18, note, { s: 14 });
    return F.svg(W, Hh + top, h, { max: '2.8in' });
  }

  /* Set B numbers */
  const cutB = [1350, 980, 2145], runs = [12, 9, 15, 7, 18], hrs = [7, 9, 8, 6, 10];
  /* Set C numbers */
  const pcs = [1420, 1065, 1890];
  /* Exercise 1D (by hand) and 1K (carpentry): helpers and numbers */
  const H = require('../engine/figs-ch01.js')
  const PL = require('../engine/plates.js')
  const art = num => PL.article(num)
  const dAdd = [4786, 3958, 607]
  const mulWork = (a, b) => H.colMul(a, b).rows.map(r => n(a) + ' × ' + n(r.digit * Math.pow(10, r.place)) + ' = ' + n(r.value)).join(', ') + '. Sum ' + n(a * b) + '.'
  const divAns = (a, d) => n(Math.floor(a / d)) + (a % d ? ' r ' + (a % d) : '')
  const divWork = (a, d) => H.divSteps(String(a), d).steps.join(' ') + ' Check: ' + n(Math.floor(a / d)) + ' × ' + d + (a % d ? ' + ' + (a % d) : '') + ' = ' + n(a) + '.'
  const k10 = [13, 19, 13, 9, 16]
  /* the carpentry set is labelled K in every chapter */
  const kSet = () => { B.wsN = 10
    return '' }
  /* code values used in 1K, checked against the code text (spaces collapsed) */
  const flat = num => art(num).text.replace(/\s+/g, ' ')
  const codeChecks = [['9.23.10.1', '38 × 64 400 2.4 Roof with or without attic storage 38 × 89 600 3.0'], ['9.23.10.1', 'Exterior 38 × 89 300 3.0 Roof with or without attic storage plus 2'], ['9.29.5.3', 'parallel 600 400 - 12.7 perpendicular 600 600 400']]
  codeChecks.forEach(c => { if (!flat(c[0]).includes(c[1])) throw new Error('code text check failed: ' + c[0] + ' ' + c[1]) })

  return L.join([
    B.exChapter({ num: 1, id: 'whole', title: 'Whole Numbers', intro: 'Practice with place value, rounding and estimating, the four operations, averages and multi-step shop problems. Estimate each answer first, then check it with your calculator.' }),

    B.worksheet({ title: 'Skills', sub: 'Place value, rounding, estimating and the four operations' }),
    B.grid2(
      g('Write 4,072 in words.', 'Four thousand seventy-two'),
      g('Write in digits: fifteen thousand three hundred eight.', '15,308'),
      g('What is the 7 worth in 37,215?', '7,000'),
      g('Put in order, smallest first: 3,409, 3,490, 3,049, 3,940.', '3,049, 3,409, 3,490, 3,940'),
      g('Round 3,462 to the nearest ten.', n(rnd(3462, 10))),
      g('Round 8,951 to the nearest hundred.', n(rnd(8951, 100))),
      g('Round 14,500 to the nearest thousand.', n(rnd(14500, 1000))),
      g('Round 795 to the nearest ten.', n(rnd(795, 10))),
      g('Estimate 1,180 + 2,940 + 615 by rounding each number to the nearest hundred.', n(1200 + 2900 + 600) + ' (1,200 + 2,900 + 600)'),
      g('Estimate 48 × 21 by rounding each number to the nearest ten.', n(50 * 20) + ' (50 × 20)'),
      g('3,275 + 1,948', n(3275 + 1948)),
      g('509 + 2,716 + 88', n(509 + 2716 + 88)),
      g('7,000 − 2,368', n(7000 - 2368)),
      g('10,250 − 4,875', n(10250 - 4875)),
      g('32 × 15', n(32 * 15)),
      g('215 × 24', n(215 * 24)),
      g('2,688 ÷ 12', n(2688 / 12)),
      g('Divide 5,000 by 320. Give the whole-number quotient and the remainder.', Math.floor(5000 / 320) + ' remainder ' + (5000 % 320)),
      g('Find the average of 64, 58, 71 and 67.', n(sum([64, 58, 71, 67]) / 4)),
      g('Check 7,000 − 2,368 by adding. What should you get?', n(7000 - 2368) + ' + 2,368 = 7,000')
    ),
    B.check('3275 + 1948 =', '5223'), B.check('7000 − 2368 =', '4632'), B.check('10250 − 4875 =', '5375'), B.check('215 × 24 =', '5160'),
    B.check('2688 ÷ 12 =', '224'), B.check('5000 − 15 × 320 =', '200'), B.check('( 64 + 58 + 71 + 67 ) ÷ 4 =', '65'),

    B.worksheet({ title: 'Shop problems', sub: 'Whole numbers on the job, in metric and imperial' }),
    B.prob({ q: 'Three pieces, ' + cutB.map(v => n(v) + ' mm').join(', ') + ', are cut from a 6,000 mm length of flat bar. Ignore the saw cuts. How long is the offcut?', a: n(6000 - sum(cutB)) + ' mm', work: 'Total cut ' + n(sum(cutB)) + ' mm. 6,000 − ' + n(sum(cutB)) + ' = ' + n(6000 - sum(cutB)) + '.', lines: 3 }),
    B.check('6000 − ( 1350 + 980 + 2145 ) =', '1525'),
    B.prob({ q: 'A plumber measures five pipe runs: ' + runs.join(' ft, ') + ' ft. The supplier sells this pipe in 21 ft lengths. Ignore fittings and waste. How many feet of pipe are needed, and how many 21 ft lengths must be bought?', a: sum(runs) + ' ft. ' + sum(runs) + ' ÷ 21 = ' + L.round(sum(runs) / 21, 2) + ', so buy ' + Math.ceil(sum(runs) / 21) + ' lengths.', work: 'Round up: a part length still has to be bought.', lines: 3 }),
    B.check('( 12 + 9 + 15 + 7 + 18 ) ÷ 21 =', '2.90'),
    B.prob({ q: 'A millwright sets 14 baseplates. Each baseplate takes 8 anchor bolts. Anchor bolts come in boxes of 25. How many bolts are needed, and how many boxes?', a: (14 * 8) + ' bolts, ' + Math.ceil(14 * 8 / 25) + ' boxes', work: '14 × 8 = 112. 112 ÷ 25 = 4.48, round up to 5 boxes.', lines: 3 }),
    B.check('14 × 8 ÷ 25 =', '4.48'),
    B.prob({ q: 'A pipe job has 9 flanged joints. Each joint takes 8 bolts and each bolt takes 2 nuts. How many nuts are needed?', a: n(9 * 8 * 2) + ' nuts', lines: 3 }),
    B.prob({ q: 'Lengths of 18 in are cut from a 20 ft bar of angle (20 ft = 240 in). Ignore the saw cuts. How many pieces can be cut, and how long is the offcut?', a: Math.floor(240 / 18) + ' pieces, offcut ' + (240 - Math.floor(240 / 18) * 18) + ' in', work: '240 ÷ 18 = 13.33. 13 × 18 = 234. 240 − 234 = 6.', lines: 3 }),
    B.check('240 − 13 × 18 =', '6'),
    B.prob({ q: 'A 48 in bar has 7 holes in a straight row. The end holes are 3 in from the ends and the holes are evenly spaced. Find the spacing, centre to centre.', a: ((48 - 6) / 6) + ' in', work: '48 − 3 − 3 = 42 in. 7 holes make 6 spaces. 42 ÷ 6 = 7.', lines: 3 }),
    B.prob({ q: 'A welder logs ' + hrs.join(', ') + ' hours over five days. What is the average number of hours per day?', a: (sum(hrs) / 5) + ' hours', lines: 3 }),
    B.prob({ q: 'A machine makes 45 parts an hour. It runs 3 shifts of 8 hours. How many parts does it make? Estimate first, using 50 parts an hour.', a: 'Estimate 50 × 24 = 1,200. Exact ' + n(45 * 24) + ' parts.', lines: 3 }),
    B.check('45 × 3 × 8 =', '1080'),
    B.prob({ q: 'A crew uses 18 welding rods a day for 12 days. Rods come in boxes of 50. How many boxes do they need, and how many rods are left over?', a: Math.ceil(18 * 12 / 50) + ' boxes, ' + (Math.ceil(18 * 12 / 50) * 50 - 18 * 12) + ' rods left over', work: '18 × 12 = 216 rods. 216 ÷ 50 = 4.32, round up to 5 boxes = 250 rods. 250 − 216 = 34.', lines: 4 }),
    B.check('18 × 12 ÷ 50 =', '4.32'),

    B.worksheet({ title: 'Shape Canvas', sub: 'Find each red ? on the drawing' }),
    B.prob({ q: 'Three pieces are cut from a 6,000 mm bar. Ignore the saw cuts. Find the offcut.', canvas: F.cutBar(pcs.map(v => ({ len: v })), { total: 6000, askRest: true }), a: n(6000 - sum(pcs)) + ' mm', lines: 2 }),
    B.prob({ q: 'Find the overall length.', canvas: F.cutBar([{ len: 845 }, { len: 1260 }, { len: 845 }, { len: 1260 }], { askTotal: true }), a: n(2 * (845 + 1260)) + ' mm', lines: 2 }),
    B.prob({ q: 'The overall length is 4,800 mm. Find the hidden piece.', canvas: F.cutBar([{ len: 1325 }, { len: 4800 - 1325 - 960 - 1150, ask: true }, { len: 960 }, { len: 1150 }], { totalLab: '4,800 mm' }), a: n(4800 - 1325 - 960 - 1150) + ' mm', lines: 2 }),
    B.prob({ q: 'Seven holes are evenly spaced 160 mm apart along a plate. The end holes are 60 mm from the ends. Find the length of the plate.', canvas: holePlate(60 * 2 + 6 * 160, 60, 7, { ask: 'len' }), a: n(60 * 2 + 6 * 160) + ' mm', work: '6 spaces × 160 = 960. 960 + 60 + 60 = 1,080.', lines: 2 }),
    B.grid2(
      B.prob({ q: 'Find the hidden width. The dashed line splits the plate into A and B.', canvas: lPlate(1100, 800, 350, 300, { ask: ['c'], hide: ['d'], split: true, max: '2.7in' }), a: n(1100 - 350) + ' mm', lines: 2 }),
      B.prob({ q: 'How far does A rise above the top of B? Find the hidden height.', canvas: lPlate(1100, 800, 350, 300, { ask: ['d'], hide: ['c'], split: true, max: '2.7in' }), a: n(800 - 300) + ' mm', lines: 2 })
    ),
    B.grid2(
      B.prob({ q: 'Find the distance around the plate: add all six edges.', canvas: lPlate(1100, 800, 350, 300, { cTop: true, max: '2.7in' }), a: '1,100 + 300 + 750 + 500 + 350 + 800 = ' + n(1100 + 300 + 750 + 500 + 350 + 800) + ' mm', lines: 2 }),
      B.prob({ q: 'Count the holes with one multiplication. How long does it take to drill all the holes?', canvas: holeGrid(4, 6, '3 min per hole'), a: '4 × 6 = 24 holes, 24 × 3 = ' + (24 * 3) + ' minutes', lines: 2 })
    ),
    B.prob({ q: 'Change one value: each of the three pieces in problem 1 is cut 25 mm longer. How much shorter is the offcut now?', a: (3 * 25) + ' mm shorter. The offcut is ' + n(6000 - sum(pcs) - 75) + ' mm.', lines: 2 }),

    B.worksheet({ title: 'By hand', sub: 'Column adding and subtracting, long multiplication and long division. No calculator.', intro: 'Work each problem on paper in columns. Show the carries, the borrows and the partial products. Write each remainder with an r, as in 25 r 3.' }),
    B.grid2(
      g(dAdd.map(v => n(v)).join(' + '), n(sum(dAdd)), { work: 'Line up the ones. Column sums from the right: ' + H.carriesAdd(dAdd).map(c => c.sum).join(', ') + '.', lines: 5 }),
      g('10,000 − 3,476', n(10000 - 3476), { work: 'Borrow through the zeros: 10,000 = 9 thousands, 9 hundreds, 9 tens and 10 ones.', lines: 5 }),
      g('5,003 − 1,867', n(5003 - 1867), { work: 'Borrow through the zeros in the tens and hundreds.', lines: 5 }),
      g('64 × 37', n(64 * 37), { work: mulWork(64, 37), lines: 5 }),
      g('506 × 23', n(506 * 23), { work: mulWork(506, 23), lines: 5 }),
      g('348 × 275', n(348 * 275), { work: mulWork(348, 275), lines: 7 }),
      g('709 × 406', n(709 * 406), { work: mulWork(709, 406), lines: 7 }),
      g('7,284 ÷ 6', divAns(7284, 6), { work: divWork(7284, 6), lines: 7 }),
      g('9,135 ÷ 8', divAns(9135, 8), { work: divWork(9135, 8), lines: 7 }),
      g('6,048 ÷ 24', divAns(6048, 24), { work: divWork(6048, 24), lines: 7 }),
      g('8,500 ÷ 32', divAns(8500, 32), { work: divWork(8500, 32), lines: 7 }),
      g('13,580 ÷ 45', divAns(13580, 45), { work: divWork(13580, 45), lines: 7 })
    ),

    kSet(),
    B.worksheet({ title: 'Carpentry and the BCBC', sub: 'Studs, joists, plates, sheets and time on a framing job', intro: 'Every wall has a stud at each end, and spacings are on centre (o.c.). Round the number of spaces up when a spacing is a maximum. Code values are from BC Building Code 2024, Division B.' }),
    B.prob({ q: 'A wall is 7,200 mm long with studs at 400 mm o.c. How many studs? How many fewer studs would it need at 600 mm o.c.?', a: (7200 / 400 + 1) + ' studs. At 600 mm, ' + (7200 / 600 + 1) + ' studs, which is ' + ((7200 / 400 + 1) - (7200 / 600 + 1)) + ' fewer.', work: '7,200 ÷ 400 = 18, 18 + 1 = 19. 7,200 ÷ 600 = 12, 12 + 1 = 13.', lines: 3 }),
    B.prob({ q: 'Table 9.23.10.1 (Article 9.23.10.1, Sentence (1), page ' + art('9.23.10.1').page + ') lists exterior walls that support a roof with or without attic storage. For 38 × 89 studs, what is the maximum stud spacing and the maximum unsupported height?', a: '600 mm, and 3.0 m', lines: 2 }),
    B.prob({ q: 'Table 9.23.10.1 allows 38 × 89 studs at no more than 300 mm o.c. in an exterior wall that supports a roof plus 2 floors (Article 9.23.10.1, page ' + art('9.23.10.1').page + '). How many studs does a 4,500 mm length of that wall need?', a: (4500 / 300 + 1) + ' studs', work: '4,500 ÷ 300 = 15 spaces, 15 + 1 = 16.', lines: 3 }),
    B.prob({ q: 'Table 9.23.10.1 allows 38 × 64 studs in an exterior wall that supports a roof only at no more than 400 mm o.c., with a maximum unsupported height of 2.4 m. A wall 3,900 mm long is laid out at 400 mm from one end. How many studs, and how wide is the last space?', a: (Math.ceil(3900 / 400) + 1) + ' studs, last space ' + (3900 - (Math.ceil(3900 / 400) - 1) * 400) + ' mm', work: '3,900 ÷ 400 = 9.75, round up to 10 spaces. 9 × 400 = 3,600. 3,900 − 3,600 = 300.', lines: 3 }),
    B.prob({ q: 'Table 9.29.5.3 (Article 9.29.5.3, Sentence (1), page ' + art('9.29.5.3').page + ') says 12.7 mm gypsum board on a ceiling with a painted finish, laid parallel to the framing, needs supports no more than 400 mm o.c. A ceiling is 5,000 mm long. How many ceiling joists, with one at each end?', a: (Math.ceil(5000 / 400) + 1) + ' joists', work: '5,000 ÷ 400 = 12.5, round up to 13 spaces. 13 + 1 = 14.', lines: 3 }),
    B.prob({ q: 'You need 18 cripple studs, each 457 mm long, cut from boards 2,438 mm long. Allow 3 mm of kerf for each piece. How many pieces come from one board, and how many boards do you need?', a: Math.floor(2438 / 460) + ' pieces per board, ' + Math.ceil(18 / Math.floor(2438 / 460)) + ' boards', work: '457 + 3 = 460. 2,438 ÷ 460 = 5.3, so 5. 18 ÷ 5 = 3.6, round up to 4.', lines: 3 }),
    B.prob({ q: 'A 7,200 mm wall has one bottom plate and a double top plate. Plate stock comes in 4,880 mm lengths. How many millimetres of plate are needed, and how many lengths must be bought? Ignore the joints.', a: n(3 * 7200) + ' mm, ' + Math.ceil(3 * 7200 / 4880) + ' lengths', work: '3 × 7,200 = 21,600. 21,600 ÷ 4,880 = 4.43, round up to 5.', lines: 3 }),
    B.prob({ q: 'The 7,200 mm wall is sheathed with sheets 1,220 mm wide, in 2 rows. Ignore openings. How many sheets?', a: (2 * Math.ceil(7200 / 1220)) + ' sheets', work: '7,200 ÷ 1,220 = 5.9, round up to 6 per row. 2 × 6 = 12.', lines: 3 }),
    B.prob({ q: 'A framing crew of 4 starts at 7:15 a.m. and finishes at 3:45 p.m., with a 30 minute unpaid lunch. How many paid hours does each worker have, and how many paid hours does the crew have in total?', a: '8 hours each, ' + (4 * 8) + ' hours for the crew', work: '7:15 a.m. to 3:45 p.m. is 8 h 30 min. 8 h 30 min − 30 min = 8 h. 4 × 8 = 32.', lines: 3 }),
    B.prob({ q: 'Five walls need ' + k10.join(', ') + ' studs. Find the mean, the median and the mode.', a: 'Mean ' + (sum(k10) / 5) + ', median ' + k10.slice().sort((a, b) => a - b)[2] + ', mode 13', work: 'Sum ' + sum(k10) + ', ' + sum(k10) + ' ÷ 5. In order: ' + k10.slice().sort((a, b) => a - b).join(', ') + '.', lines: 3 }),
    B.check('2438 ÷ 460 =', '5.3'), B.check('3 × 7200 ÷ 4880 =', '4.43'), B.check('7200 ÷ 1220 =', '5.90'), B.check('3900 ÷ 400 =', '9.75')
  ]);
};
