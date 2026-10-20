/* Exercise Book, Chapter 7: Measurement and Unit Conversion.
   Factors as in the textbook chapter: exact by definition (Weights and Measures Act, Schedules I and II, NIST SP 1038). */
module.exports = function (B, L) {
  const F = require('../engine/figs.js')
  const G = require('../engine/figs-ch07.js')
  const G6 = require('../engine/figs-ch06.js')
  const n = L.num
  const P = o => B.prob(Object.assign({ lines: 3 }, o))
  const r1 = x => L.round(x, 1), r2 = x => L.round(x, 2)
  /* move one engine label (its white chip and its text) by dx, dy so it sits clear of an edge */
  const nudge = (svg, lab, dx, dy) => svg.replace(new RegExp('<rect x="([-\\d.]+)" y="([-\\d.]+)"([^>]*)/><text x="([-\\d.]+)" y="([-\\d.]+)"([^>]*)>' + lab + '</text>'),
    (all, rx, ry, ra, tx, ty, ta) => '<rect x="' + (+rx + dx) + '" y="' + (+ry + dy) + '"' + ra + '/><text x="' + (+tx + dx) + '" y="' + (+ty + dy) + '"' + ta + '>' + lab + '</text>')
  const sup = e => '10<sup>' + String(e).replace('-', '−') + '</sup>'
  const IN = 25.4, FT = 0.3048, LB = 0.45359237, FT2 = 0.09290304, IN3 = 16.387064, USG = 231 * IN3 / 1000, IMPG = 4.54609
  const bar = (pieces, o) => { const W = (o && o.w) || 360, s = F.cutBar(pieces, Object.assign({ w: W }, o)); return s.replace(/max-width:[\d.]+in/, 'max-width:' + G.fit(W, 12.5)) }
  const shp = (id, p, o) => { const s = B.shape(id, p, o), w = +(/viewBox="[-\d.]+ [-\d.]+ ([\d.]+)/.exec(s) || [0, 400])[1]; return s.replace(/max-width:[\d.]+in/, 'max-width:' + G.fit(w, 15)) }
  const net = (id, p, o) => { const s = B.net(id, p, o), w = +(/viewBox="[-\d.]+ [-\d.]+ ([\d.]+)/.exec(s) || [0, 400])[1]; return s.replace(/max-width:[\d.]+in/, 'max-width:' + G.fit(w, 15)) }

  /* Set B numbers */
  const dmm = 2235, din = dmm / IN
  const pcs = [54.5, 87.75, 35], pcsT = pcs.reduce((a, b) => a + b, 0)
  const boxes = 12, boxLb = 22, boxKg = boxes * boxLb * LB
  const fl = [6.2, 4.5], flM2 = fl[0] * fl[1], flFt2 = flM2 / FT2, cov = 350
  const rs = [900, 600, 450], rsL = rs[0] * rs[1] * rs[2] / 1e6, rsGal = rsL / USG
  const ig = 30, igUS = ig * IMPG / USG
  const pf = 200, pc = (pf - 32) / 1.8, mx = 120, mxF = 1.8 * mx + 32
  const pl = [0.5, 6, 30], plIn3 = pl[0] * pl[1] * pl[2], plCm3 = plIn3 * IN3
  const sh = [1220, 2440], shM2 = sh[0] * sh[1] / 1e6, shFt2 = shM2 / FT2
  const cut = [50.5, 81.25, 36.75], cutT = cut.reduce((a, b) => a + b, 0)

  return L.join([
    B.exChapter({ num: 7, id: 'units', title: 'Measurement and Unit Conversion', intro: 'Practice with metric prefixes, feet and inches, exact conversion factors, area and volume units, litres and gallons, and temperature. Use 1 in = 25.4 mm, 1 ft = 0.3048 m, 1 lb = 0.453 592 37 kg, 1 US gal = 3.785 411 784 L and 1 imp gal = 4.546 09 L.' }),

    B.worksheet({ title: 'Skills', sub: 'One conversion at a time' }),
    B.grid2(
      P({ q: 'Convert 4.75 m to mm.', a: n(4750) + ' mm' }),
      P({ q: 'Convert 625 mm to m.', a: n(0.625) + ' m' }),
      P({ q: 'Convert 38 cm to mm.', a: n(380) + ' mm' }),
      P({ q: 'Convert 3,250 mL to L.', a: n(3.25) + ' L' }),
      P({ q: 'Convert 2.4 t to kg.', a: n(2400) + ' kg' }),
      P({ q: 'Convert 750 g to kg.', a: n(0.75) + ' kg' }),
      P({ q: 'Write 8′ 5″ in inches.', a: n(8 * 12 + 5) + ' in' }),
      P({ q: 'Write 9′ ' + L.mx(7, 3, 4) + '″ in inches.', a: L.mx(115, 3, 4) + ' in', work: '9 × 12 + 7.75 = ' + n(9 * 12 + 7.75) }),
      P({ q: 'Write 94 in in feet and inches.', a: L.ftin(94, 16) }),
      P({ q: 'Write ' + L.mx(157, 1, 2) + ' in in feet and inches.', a: L.ftin(157.5, 16) }),
      P({ q: 'Convert ' + L.fr(5, 8) + ' in to mm.', a: n(5 / 8 * IN) + ' mm' }),
      P({ q: 'Convert ' + L.mx(2, 1, 4) + ' in to mm.', a: n(2.25 * IN) + ' mm' }),
      P({ q: 'Convert 950 mm to inches, to the nearest ' + L.fr(1, 16) + ' in.', a: L.inch(950 / IN, 16), work: '950 ÷ 25.4 × 16 = ' + n(L.round(950 / IN * 16, 2)) + ' sixteenths, rounds to ' + Math.round(950 / IN * 16) }),
      P({ q: 'Convert 15 ft to m.', a: n(15 * FT) + ' m' }),
      P({ q: 'Convert 75 lb to kg, to two decimal places.', a: n(75 * LB, 2) + ' kg' }),
      P({ q: 'How many feet are in 6 yd? How many metres?', a: '18 ft, ' + n(6 * 0.9144) + ' m' }),
      P({ q: 'Convert 2.5 m² to mm².', a: n(2.5e6) + ' mm²' }),
      P({ q: 'Convert 6 ft² to in².', a: n(6 * 144) + ' in²' }),
      P({ q: 'Convert 25 in² to mm².', a: n(25 * 645.16) + ' mm²' }),
      P({ q: 'A tank is 800 mm × 400 mm × 300 mm inside. How many litres does it hold?', a: n(800 * 400 * 300 / 1e6) + ' L' }),
      P({ q: 'Convert 20 US gal to L, to two decimal places.', a: n(20 * USG, 2) + ' L' }),
      P({ q: 'Convert 25 imp gal to L, to two decimal places.', a: n(25 * IMPG, 2) + ' L' }),
      P({ q: 'Convert 35 °C to °F.', a: n(1.8 * 35 + 32) + ' °F' }),
      P({ q: 'Convert −4 °F to °C.', a: n((-4 - 32) / 1.8) + ' °C' })
    ),
    B.check('9 × 12 + 7.75 =', '115.75'),
    B.check('5 ab/c 8 × 25.4 =', n(5 / 8 * IN)),
    B.check('2.25 × 25.4 =', n(2.25 * IN)),
    B.check('950 ÷ 25.4 × 16 =', n(L.round(950 / IN * 16, 2))),
    B.check('15 × 0.3048 =', n(15 * FT)),
    B.check('75 × 0.45359237 =', n(75 * LB, 2)),
    B.check('25 × 645.16 =', n(25 * 645.16)),
    B.check('800 × 400 × 300 ÷ 1000000 =', '96'),
    B.check('20 × 3.785411784 =', n(20 * USG, 2)),
    B.check('25 × 4.54609 =', n(25 * IMPG, 2)),
    B.check('1.8 × 35 + 32 =', '95'),
    B.check('( 4 +⇄− − 32 ) ÷ 1.8 =', '−20'),

    B.worksheet({ title: 'Shop problems', sub: 'Metric drawings, imperial tools and mixed units' }),
    B.prob({ q: 'A metric drawing gives a length of ' + n(dmm) + ' mm. Your tape reads in feet and inches. What do you mark, to the nearest ' + L.fr(1, 16) + ' in?', a: L.ftin(din, 16) + ' (' + L.inch(din, 16) + ')', work: n(dmm) + ' ÷ 25.4 × 16 = ' + n(L.round(din * 16, 2)) + ' sixteenths, rounds to ' + n(Math.round(din * 16)) + ' = ' + n(Math.round(din * 16) / 16) + ' in', lines: 3 }),
    B.check(dmm + ' ÷ 25.4 × 16 =', n(L.round(din * 16, 2))),
    B.prob({ q: 'Three pieces of pipe are 4′ ' + L.mx(6, 1, 2) + '″, 7′ ' + L.mx(3, 3, 4) + '″ and 2′ 11″ long. Find the total length in feet and inches and in millimetres.', a: L.ftin(pcsT, 16) + ' = ' + n(pcsT * IN) + ' mm', work: pcs.map(v => n(v)).join(' + ') + ' = ' + n(pcsT) + ' in', lines: 4 }),
    B.check('( ' + pcs.join(' + ') + ' ) × 25.4 =', n(pcsT * IN)),
    B.prob({ q: boxes + ' boxes of fittings weigh ' + boxLb + ' lb each. What is the total mass in kilograms, to two decimal places?', a: n(boxKg, 2) + ' kg', lines: 3 }),
    B.check(boxes + ' × ' + boxLb + ' × 0.45359237 =', n(boxKg, 2)),
    B.prob({ q: 'A shop floor is ' + fl[0] + ' m by ' + fl[1] + ' m. Find its area in m² and in ft², to two decimal places. The coating label says one US gallon covers ' + cov + ' ft². How many whole gallons do you buy?', a: n(flM2, 2) + ' m² = ' + n(flFt2, 2) + ' ft², buy ' + Math.ceil(flFt2 / cov - 1e-9) + ' US gal', work: n(flM2) + ' ÷ 0.092 903 04, then ÷ ' + cov + ' = ' + n(L.round(flFt2 / cov, 3)), lines: 4 }),
    B.check(fl[0] + ' × ' + fl[1] + ' ÷ 0.09290304 =', n(flFt2, 2)),
    B.prob({ q: 'A hydraulic reservoir is ' + rs.map(v => n(v)).join(' mm × ') + ' mm inside. How many litres does it hold? How many US gallons, to two decimal places?', a: n(rsL) + ' L = ' + n(rsGal, 2) + ' US gal', lines: 4 }),
    B.check(rs.join(' × ') + ' ÷ 1000000 ÷ 3.785411784 =', n(rsGal, 2)),
    B.prob({ q: 'An older air receiver is marked ' + ig + ' imp gal. What is that in US gallons, to two decimal places?', a: n(igUS, 2) + ' US gal', work: ig + ' × 4.546 09 ÷ 3.785 411 784', lines: 3 }),
    B.check(ig + ' × 4.54609 ÷ 3.785411784 =', n(igUS, 2)),
    B.prob({ q: 'A welding procedure gives a preheat of ' + pf + ' °F and a maximum temperature between passes of ' + mx + ' °C. Write the preheat in °C, to one decimal place, and the maximum in °F.', a: n(pc, 1) + ' °C and ' + n(mxF) + ' °F', lines: 4 }),
    B.check('( ' + pf + ' − 32 ) ÷ 1.8 =', n(pc, 1)),
    B.check('1.8 × ' + mx + ' + 32 =', n(mxF)),
    B.prob({ q: 'A shaft warms up by 35 °C while running. How many °F is that rise?', a: n(35 * 1.8) + ' °F', lines: 3 }),
    B.prob({ q: 'A flat bar is ' + L.fr(1, 2) + '″ × 6″ × 30″. Find its volume in in³, then in cm³ to two decimal places.', a: n(plIn3) + ' in³ = ' + n(plCm3, 2) + ' cm³', lines: 3 }),
    B.check('90 × 16.387064 =', n(plCm3, 2)),
    B.prob({ q: 'A metric sheet is ' + n(sh[0]) + ' mm × ' + n(sh[1]) + ' mm. Find its area in m², then in ft² to two decimal places.', a: n(shM2) + ' m² = ' + n(shFt2, 2) + ' ft²', lines: 3 }),
    B.check(sh[0] + ' × ' + sh[1] + ' ÷ 1000000 ÷ 0.09290304 =', n(shFt2, 2)),

    B.worksheet({ title: 'Shape Canvas', sub: 'Convert the drawings and find each red ?' }),
    B.grid2(
      B.prob({ q: 'Write both sizes of the sheet in millimetres.', canvas: G.rect2(36, 24, 5, '36 in', '24 in'), a: n(36 * IN) + ' mm by ' + n(24 * IN) + ' mm', lines: 2 }),
      B.prob({ q: 'Convert each size on the plate to millimetres.', canvas: G.platCallouts(['Hole ', [13, 16], '″'], 'Width 4″', ['Thickness ', [1, 4], '″']), a: 'Hole ' + n(13 / 16 * IN) + ' mm, width ' + n(4 * IN) + ' mm, thickness ' + n(0.25 * IN) + ' mm', lines: 2 })
    ),
    B.check('13 ab/c 16 × 25.4 =', n(13 / 16 * IN)),
    B.prob({ q: 'Find the overall length in feet and inches and in millimetres.', canvas: G6.cutBarFr(cut.map((v, i) => ({ len: v, parts: [['4′ 2', [1, 2], '″'], ['6′ 9', [1, 4], '″'], ['3′ 0', [3, 4], '″']][i] })), { askTotal: true, w: 440, fs: 15 }), a: L.ftin(cutT, 16) + ' = ' + n(cutT * IN) + ' mm', work: cut.map(v => n(v)).join(' + ') + ' = ' + n(cutT) + ' in', lines: 2 }),
    B.check('( ' + cut.join(' + ') + ' ) × 25.4 =', n(cutT * IN)),
    B.grid2(
      B.prob({ q: 'The tank holds 150 L. Find the hidden height.', canvas: nudge(shp('rectangular-prism', { l: 1000, w: 500, h: 300 }, { hide: ['h'] }), '500 mm', 16, 9), a: n(150e6 / (1000 * 500)) + ' mm', work: '150 L = 150,000,000 mm³, ÷ (1,000 × 500)', lines: 2 }),
      B.prob({ q: 'Unfold it: the net of a closed box in inches. Find the total area in in² and in ft².', canvas: net('rectangular-prism', { l: 12, w: 8, h: 6 }, { units: 'in' }), a: n(2 * (96 + 72 + 48)) + ' in² = ' + n(2 * (96 + 72 + 48) / 144) + ' ft²', lines: 2 }),
      B.prob({ q: 'A square yard split into square feet. How many ft² are in 1 yd²? How many in²?', canvas: G.unitGrid(3, 40, '1 yd = 3 ft', '1 yd²', '= ? ft²', '3 ft'), a: '9 ft² = ' + n(9 * 144) + ' in²', mode: 'Practice: find the ?', lines: 2 }),
      B.prob({ q: 'Find each red ? on the two scales.', canvas: G.thermo([{ c: 100 }, { c: 70, askF: true }, { c: 0 }, { c: -20, askC: true }]), a: '70 °C = ' + n(1.8 * 70 + 32) + ' °F, and −4 °F = −20 °C', lines: 2 })
    ),
    B.prob({ q: 'Change one value: a cube is 50 mm on each side. How many litres does it hold? Each side is doubled to 100 mm. How many litres now, and how many times as much?', a: n(0.125) + ' L, then 1 L, 8 times as much', lines: 2 }),

    /* ---------- Set D: decimal feet, powers of ten and temperature ---------- */
    B.worksheet({ title: 'Decimal feet, powers of ten and temperature', sub: 'Textbook Sections 7.6, 7.7 and 7.8' }),
    B.raw('<div class="ws-intro">Use 1 ft = 12 in, °F = 1.8 × °C + 32, °C = (°F − 32) ÷ 1.8, and 1.8 alone for a change in temperature. The imperial gallon is 4.546 09 L.</div>'),
    B.grid2(
      P({ q: 'Write 5′ 9″ in decimal feet.', a: n(5.75) + ' ft' }),
      P({ q: 'Write 11′ 4″ in decimal feet, to two decimal places.', a: n(r2(11 + 4 / 12), 2) + ' ft' }),
      P({ q: 'Write 7′ ' + L.mx(10, 1, 2) + '″ in decimal feet, to two decimal places.', a: n(r2(7 + 10.5 / 12), 2) + ' ft' }),
      P({ q: 'Write 3′ ' + L.mx(2, 5, 16) + '″ in decimal feet, to two decimal places.', a: n(r2(3 + (2 + 5 / 16) / 12), 2) + ' ft', work: '3 + (2 + 5 ÷ 16) ÷ 12' }),
      P({ q: 'Write 8.5 ft in feet and inches.', a: L.ftin(8.5 * 12, 16) }),
      P({ q: 'Write 6.25 ft in feet and inches.', a: L.ftin(6.25 * 12, 16) }),
      P({ q: 'Write 10.8 ft in feet and inches, to the nearest ' + L.fr(1, 16) + ' in.', a: L.ftin(10.8 * 12, 16), work: '0.8 × 12 = 9.6 in, 0.6 × 16 = 9.6, about 10 sixteenths' }),
      P({ q: 'Write 23.47 ft in feet and inches, to the nearest ' + L.fr(1, 16) + ' in.', a: L.ftin(23.47 * 12, 16), work: '0.47 × 12 = 5.64 in, 0.64 × 16 = 10.24, about 10 sixteenths' }),
      P({ q: 'Write 52,000,000 in scientific notation.', a: '5.2 × ' + sup(7) }),
      P({ q: 'Write 0.000 75 in scientific notation.', a: '7.5 × ' + sup(-4) }),
      P({ q: 'Write 9.1 × ' + sup(3) + ' as an ordinary number.', a: n(9100) }),
      P({ q: 'Work out 6 × ' + sup(5) + ' ÷ (3 × ' + sup(2) + '). Give the answer both ways.', a: '2 × ' + sup(3) + ' = ' + n(2000) }),
      P({ q: 'Convert 15 °C to °F.', a: n(1.8 * 15 + 32) + ' °F' }),
      P({ q: 'Convert 72 °F to °C, to one decimal place.', a: n(r1((72 - 32) / 1.8), 1) + ' °C' }),
      P({ q: 'Convert −18 °C to °F.', a: n(1.8 * -18 + 32) + ' °F' }),
      P({ q: 'Convert 350 °C to °F.', a: n(1.8 * 350 + 32) + ' °F' }),
      P({ q: 'Convert 1,000 °F to °C, to one decimal place.', a: n(r1((1000 - 32) / 1.8), 1) + ' °C' }),
      P({ q: 'A temperature rises by 22 °C. How many °F is the rise?', a: n(22 * 1.8) + ' °F' }),
      P({ q: 'A temperature drops by 27 °F. How many °C is the drop?', a: n(27 / 1.8) + ' °C' }),
      P({ q: 'A 40 imp gal tank of water is heated from 10 °C to 60 °C. How many litres is the tank, to two decimal places? What is the rise in °F?', a: n(r2(40 * IMPG), 2) + ' L, a rise of ' + n(50 * 1.8) + ' °F' })
    ),
    B.check('11 + 4 ÷ 12 =', n(r2(11 + 4 / 12), 2)),
    B.check('7 + 10.5 ÷ 12 =', n(r2(7 + 10.5 / 12), 2)),
    B.check('3 + ( 2 + 5 ÷ 16 ) ÷ 12 =', n(r2(3 + (2 + 5 / 16) / 12), 2)),
    B.check('6 EE 5 ÷ 3 EE 2 =', '2,000'),
    B.check('( 72 − 32 ) ÷ 1.8 =', n(r1((72 - 32) / 1.8), 1)),
    B.check('1.8 × 18 +⇄− + 32 =', n(1.8 * -18 + 32)),
    B.check('( 1000 − 32 ) ÷ 1.8 =', n(r1((1000 - 32) / 1.8), 1)),
    B.check('40 × 4.54609 =', n(r2(40 * IMPG), 2)),

    /* ---------- Set K: carpentry and the BCBC ---------- */
    B.raw((B.wsN = 10, '')),
    B.worksheet({ title: 'Carpentry and the BCBC', sub: 'Code values in inches, board feet and floor area' }),
    B.raw('<div class="ws-intro">Code values are quoted from the BC Building Code 2024, Division B, with the Sentence and page. The code value stays in millimetres. When you convert, round a maximum down and a minimum up to the nearest ' + L.fr(1, 16) + ' in. Board feet = thickness (in) × width (in) × length (ft) ÷ 12, and 1 board foot = 0.002 359 737 m³ (NIST SP 1038). 1 ft² = 0.092 903 04 m².</div>'),
    B.prob({ q: 'Table 9.8.4.1 (Sentence 9.8.4.1.(1)), page 9-31, gives a maximum rise of 200 mm for private stairs. What is the largest tape reading, to a sixteenth, that stays within it?', a: L.inch(Math.floor(200 / IN * 16) / 16, 16), work: '200 ÷ 25.4 × 16 = ' + n(L.round(200 / IN * 16, 2)) + ' sixteenths, round down to ' + Math.floor(200 / IN * 16), lines: 3 }),
    B.check('200 ÷ 25.4 × 16 =', n(L.round(200 / IN * 16, 2))),
    B.prob({ q: 'The same table gives a minimum rise of 125 mm. What is the smallest tape reading, to a sixteenth, that meets it?', a: L.inch(Math.ceil(125 / IN * 16) / 16, 16), work: '125 ÷ 25.4 × 16 = ' + n(L.round(125 / IN * 16, 2)) + ' sixteenths, round up to ' + Math.ceil(125 / IN * 16), lines: 3 }),
    B.check('125 ÷ 25.4 × 16 =', n(L.round(125 / IN * 16, 2))),
    B.prob({ q: 'Table 9.8.4.2 (Sentence 9.8.4.2.(1), page 9-31) gives public stairs a minimum run of 280 mm. What is the smallest tape reading, to a sixteenth, that meets it?', a: L.inch(Math.ceil(280 / IN * 16) / 16, 16), work: '280 ÷ 25.4 × 16 = ' + n(L.round(280 / IN * 16, 2)) + ' sixteenths, round up to ' + Math.ceil(280 / IN * 16), lines: 3 }),
    B.check('280 ÷ 25.4 × 16 =', n(L.round(280 / IN * 16, 2))),
    B.prob({ q: 'Sentence 9.8.8.3.(1) (page 9-40) says guards shall be not less than 1 070 mm high, except as Sentences (2) and (3) allow. Convert 1 070 mm to inches, rounded up to a sixteenth.', a: L.inch(Math.ceil(1070 / IN * 16) / 16, 16), work: '1,070 ÷ 25.4 × 16 = ' + n(L.round(1070 / IN * 16, 2)) + ' sixteenths, round up to ' + Math.ceil(1070 / IN * 16), lines: 3 }),
    B.check('1070 ÷ 25.4 × 16 =', n(L.round(1070 / IN * 16, 2))),
    B.prob({ q: 'Sentence 9.8.8.3.(3) (page 9-40) depends on whether a walking surface is more than 1 800 mm above the finished ground. A deck surface is measured at 5′ 11″ above the ground. Is it more than 1 800 mm? Show the height in millimetres.', a: 'Yes. 5′ 11″ = 71 in = ' + n(71 * IN) + ' mm, which is more than 1,800 mm.', lines: 3 }),
    B.check('71 × 25.4 =', n(71 * IN)),
    B.prob({ q: 'Sentence 9.8.2.2.(2) (page 9-30) gives a minimum clear height over stairs of 2 050 mm. Write it in feet and inches, rounded up to a sixteenth.', a: L.ftin(Math.ceil(2050 / IN * 16) / 16, 16), work: '2,050 ÷ 25.4 × 16 = ' + n(L.round(2050 / IN * 16, 2)) + ' sixteenths, round up to ' + n(Math.ceil(2050 / IN * 16)), lines: 3 }),
    B.check('2050 ÷ 25.4 × 16 =', n(L.round(2050 / IN * 16, 2))),
    B.prob({ q: 'How many board feet are in one piece 2 in × 12 in × 16 ft? In 18 pieces?', a: n(2 * 12 * 16 / 12) + ' board feet, ' + n(18 * 2 * 12 * 16 / 12) + ' board feet', lines: 3 }),
    B.prob({ q: 'A bundle has 50 boards 1 in × 6 in × 8 ft. How many board feet is that?', a: n(50 * 1 * 6 * 8 / 12) + ' board feet', lines: 3 }),
    B.prob({ q: 'Write 576 board feet in m³, to three decimal places.', a: n(L.round(576 * 0.002359737, 3), 3) + ' m³', lines: 3 }),
    B.check('576 × 0.002359737 =', n(L.round(576 * 0.002359737, 3), 3)),
    B.prob({ q: 'A floor is 5.4 m × 4.2 m. Find its area in m² and in ft², to two decimal places.', a: n(L.round(5.4 * 4.2, 6)) + ' m² = ' + n(r2(5.4 * 4.2 / FT2), 2) + ' ft²', lines: 3 }),
    B.check('5.4 × 4.2 ÷ 0.09290304 =', n(r2(5.4 * 4.2 / FT2), 2)),
    B.prob({ q: 'A room is 14 ft × 18 ft. Find its area in ft² and in m², to two decimal places.', a: n(14 * 18) + ' ft² = ' + n(r2(14 * 18 * FT2), 2) + ' m²', lines: 3 }),
    B.check('14 × 18 × 0.09290304 =', n(r2(14 * 18 * FT2), 2)),
    B.prob({ q: 'Flooring for the 5.4 m × 4.2 m floor comes in boxes that cover 20 ft² each. How many whole boxes do you buy?', a: Math.ceil(5.4 * 4.2 / FT2 / 20 - 1e-9) + ' boxes', work: n(r2(5.4 * 4.2 / FT2), 2) + ' ÷ 20 = ' + n(r2(5.4 * 4.2 / FT2 / 20), 2) + ', round up', lines: 3 })
  ])
}
