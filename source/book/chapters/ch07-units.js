/* Chapter 7: Measurement and Unit Conversion.
   Every factor is exact by definition or comes from the hub units module sources:
   Weights and Measures Act (Canada), Schedules I and II, and NIST SP 1038 (2006). */
module.exports = function (B, L) {
  const F = require('../engine/figs.js')
  const G = require('../engine/figs-ch07.js')
  const G6 = require('../engine/figs-ch06.js')
  /* format a number, trimming binary noise such as 9.524999999999999 */
  const n = (x, dp) => L.num(dp == null ? L.round(x, 9) : x, dp)
  const C = F.C
  const range = k => Array.from({ length: k }, (_, i) => i)

  /* exact factors */
  const IN_MM = 25.4, FT_M = 0.3048, LB_KG = 0.45359237, IN3_CM3 = 16.387064, FT2_M2 = 0.09290304
  const USGAL_IN3 = 231, USGAL_L = USGAL_IN3 * IN3_CM3 / 1000, IMPGAL_L = 4.54609
  const r = (x, d) => L.round(x, d)
  const ftinTxt = (x, den) => {
    den = den || 16
    const t = Math.round(x * den), ft = Math.floor(t / (12 * den)), rest = t - ft * 12 * den
    const w = Math.floor(rest / den), fr = rest - w * den
    const g = L.gcd(fr, den)
    const ins = fr ? (w ? w + ' ' : '') + (fr / g) + '/' + (den / g) : String(w)
    return (ft ? ft + '′ ' : '') + ins + '″'
  }

  /* metric prefix staircase */
  function ladder() {
    const st = [['km', 'kilometre'], ['m', 'metre'], ['cm', 'centimetre'], ['mm', 'millimetre']]
    const f = ['× 1,000', '× 100', '× 10']
    const bw = 108, bh = 38, dx = 150, dy = 30
    let h = ''
    st.forEach((s, i) => {
      const x = 10 + i * dx, y = 8 + i * dy
      h += F.rect(x, y, bw, bh, { fill: i === 1 ? C.gold : C.fill })
      h += F.t(x + bw / 2, y + 17, s[0], { s: 16, b: true, c: C.edge }) + F.t(x + bw / 2, y + 31, s[1], { s: 14, c: C.ink })
      if (i < 3) {
        const x1 = x + bw, y1 = y + bh / 2, x2 = x + dx, y2 = y + dy + bh / 2
        h += '<path d="M' + x1 + ' ' + y1 + 'H' + (x2 - 12) + 'V' + (y2 - 22) + '" fill="none" stroke="' + C.dim + '" stroke-width="1.6"/>' + F.arrowHead(x2 - 12, y2 - 20, Math.PI / 2, C.dim)
        h += F.t(x1 + 4, y1 - 7, f[i], { s: 15, b: true, a: 'start', c: C.red })
      }
    })
    h += F.t(10, 8 + 3 * dy + 20, 'Down a step: multiply. Up a step: divide.', { s: 15, a: 'start', c: C.dim, wgt: 600 })
    return F.svg(10 + 3 * dx + bw + 10, 8 + 3 * dy + bh + 4, h, { max: G.fit(10 + 3 * dx + bw + 10, 14) })
  }
  /* one square foot split into square inches */
  function ftGrid() {
    const g = 13, x0 = 50, y0 = 10, N = 12
    let h = ''
    range(N * N).forEach(i => { h += '<rect x="' + (x0 + (i % N) * g) + '" y="' + (y0 + Math.floor(i / N) * g) + '" width="' + g + '" height="' + g + '" fill="' + (i === 0 ? C.gold : C.fill2) + '" stroke="' + C.edge + '" stroke-width="0.7"/>' })
    h += '<rect x="' + x0 + '" y="' + y0 + '" width="' + N * g + '" height="' + N * g + '" fill="none" stroke="' + C.edge + '" stroke-width="2.2"/>'
    h += F.dim(x0, y0 + N * g, x0 + N * g, y0 + N * g, '12 in = 1 ft', 24, { s: 13 })
    h += F.dim(x0, y0, x0, y0 + N * g, '12 in', 26, { s: 13 })
    h += F.callout(x0 + g / 2, y0 + g / 2, x0 + N * g + 90, y0 + 18, '1 in²', { s: 13 })
    h += F.t(x0 + N * g + 30, y0 + 84, '12 × 12 = 144', { s: 15, b: true, a: 'start', c: C.edge }) + F.t(x0 + N * g + 30, y0 + 106, '1 ft² = 144 in²', { s: 15, b: true, a: 'start' })
    return F.svg(x0 + N * g + 170, y0 + N * g + 52, h, { max: '3.6in' })
  }
  /* Celsius and Fahrenheit scales side by side, marks from the exact formula */
  function thermo() {
    const cs = [-40, 0, 50, 100], top = 40, bot = 236, x1 = 120, x2 = 300
    const Y = c => bot - (c + 40) / 140 * (bot - top)
    let h = F.line(x1, top - 8, x1, bot + 8, { c: C.ink, w: 3 }) + F.line(x2, top - 8, x2, bot + 8, { c: C.ink, w: 3 })
    h += F.t(x1, 20, '°C', { s: 18, b: true, c: C.edge }) + F.t(x2, 20, '°F', { s: 18, b: true, c: C.edge })
    cs.forEach(c => {
      const fv = 1.8 * c + 32, y = Y(c)
      h += F.line(x1, y, x2, y, { c: C.grey, w: 1, dash: '4 4' })
      h += F.line(x1 - 8, y, x1 + 8, y, { c: C.ink, w: 1.6 }) + F.line(x2 - 8, y, x2 + 8, y, { c: C.ink, w: 1.6 })
      h += F.t(x1 - 14, y + 6, n(c) + ' °C', { s: 17, wgt: 600, a: 'end' }) + F.t(x2 + 14, y + 6, n(fv) + ' °F', { s: 17, wgt: 600, a: 'start' })
    })
    return F.svg(420, 254, h, { max: '2.6in' })
  }
  /* flat bar with callouts for worksheet */
  function barCallouts() {
    let h = F.rect(40, 70, 360, 34)
    h += '<path d="M400 70l14 -10v34l-14 10z" fill="' + C.fill2 + '" stroke="' + C.edge + '" stroke-width="1.8"/>' + '<path d="M40 70l14 -10h360l-14 10z" fill="' + C.fill2 + '" stroke="' + C.edge + '" stroke-width="1.8"/>'
    h += F.callout(200, 86, 200, 140, 'Length 6′ 6″', { s: 16 })
    h += G6.calloutFr(110, 64, 110, 22, ['Width 2', [1, 2], '″'], { s: 19 })
    h += G6.calloutFr(407, 80, 320, 22, ['Thickness ', [3, 8], '″'], { s: 19 })
    return F.svg(440, 160, h, { max: G.fit(440, 16 * G6.FR_K) })
  }
  /* rectangle with both sizes given */
  function rectBoth(l, w, sc, ul, uw, o) {
    o = o || {}
    const x0 = 14, y0 = 14, W = l * sc, H = w * sc
    let h = F.rect(x0, y0, W, H)
    h += F.dim(x0, y0 + H, x0 + W, y0 + H, ul, 26, { s: 15 })
    h += F.dim(x0 + W, y0 + H, x0 + W, y0, uw, 28, { s: 15 })
    return F.svg(x0 + W + 70, y0 + H + 50, h, { max: o.max || '2in' })
  }

  /* worked numbers */
  const fi1 = 7 * 12 + 9.5, fi1mm = fi1 * IN_MM
  const tin = 142.75, tft = Math.floor(tin / 12), tinRest = tin - tft * 12
  const addA = 6 * 12 + 4.75, addB = 2 * 12 + 10.5, addT = addA + addB
  const mm1 = 1480, mm1in = mm1 / IN_MM, mm1s = Math.round(mm1in * 16)
  const lb = 50, lbkg = lb * LB_KG
  const pl = [2400, 1200], plmm2 = pl[0] * pl[1], plm2 = plmm2 / 1e6
  const sh = [4, 8], shft2 = sh[0] * sh[1], shm2 = shft2 * FT2_M2
  const tk = [1200, 600, 500], tkmm3 = tk[0] * tk[1] * tk[2], tkL = tkmm3 / 1e6, tkGal = tkL / USGAL_L
  const drum = 55, drumL = drum * USGAL_L
  const ig = 40, igL = ig * IMPGAL_L, igUS = igL / USGAL_L
  const c1 = 60, f1 = 1.8 * c1 + 32
  const f2 = 350, c2 = (f2 - 32) / 1.8
  const dC = 25, dF = dC * 1.8

  /* 7.7 to 7.9. Code values are read from the BC Building Code 2024 text through engine/plates.js (articles.json).
     The board foot is from NIST SP 1038, section 5.1.5: 1 board foot = 0.002 359 737 m³, which is 144 in³. */
  const PL = require('../engine/plates.js')
  const G7 = G
  const sup = e => '10<sup>' + String(e).replace('-', '−') + '</sup>'
  const df1 = [10, 4, 3, 16], df1v = df1[0] + (df1[1] + df1[2] / df1[3]) / 12
  const df2 = 12.35, df2in = r((df2 - 12) * 12, 6), df2s = r((df2in - 4) * 16, 6)
  const rise = 200, riseS = rise / IN_MM * 16, riseDn = Math.floor(riseS), riseNear = Math.round(riseS)
  const run = 255, runS = run / IN_MM * 16, runUp = Math.ceil(runS)
  const BF_M3 = 0.002359737, bf = [2, 8, 12], bfEach = bf[0] * bf[1] * bf[2] / 12, bfN = 25
  const room = [4.2, 3.6], roomM2 = r(room[0] * room[1], 6), roomFt2 = roomM2 / FT2_M2

  return L.join([
    B.chapter({
      num: 7, id: 'units', title: 'Measurement and Unit Conversion',
      intro: B.p('A metric drawing, an inch tape, a pump rated in US gallons and a heater set in °F can all turn up on the same job. Before you can add, compare or cut, every number has to be in the same unit.',
        'This chapter covers the metric system and its prefixes, imperial units and feet-and-inches, and how to convert between them with exact conversion factors. It finishes with units of area and volume, litres and gallons, and temperature. Every factor in this chapter is exact or is taken from a published source, and the source is given with each table.'),
      objectives: ['Use SI units and the prefixes kilo, centi and milli', 'Work with inches, feet and yards, and with feet and inches', 'Convert between metric and imperial with exact factors', 'Convert units of area and volume', 'Convert between litres, US gallons and imperial gallons', 'Convert temperatures between °C and °F'],
      words: ['unit', 'metric system', 'SI', 'prefix', 'imperial system', 'conversion factor'],
      art: ladder()
    }),

    B.section('Units and the metric system'),
    B.p('A ' + B.term('unit', 'A fixed amount used to measure, such as the metre, the inch or the litre. A measurement is a number and a unit.') + ' is a fixed amount used to measure something: a metre, an inch, a litre. A measurement is always a number and a unit. “2,400” on its own means nothing on the job. 2,400 mm and 2,400 in are very different lengths.',
      'The ' + B.term('metric system', 'A system of units based on powers of ten, such as the millimetre, metre and kilometre.') + ' is built on powers of ten. Its modern form is the ' + B.term('SI', 'The International System of Units, the modern metric system. Its base units include the metre, the kilogram and the second.') + ', the International System of Units. The SI base units include the metre (m) for length, the kilogram (kg) for mass and the second (s) for time (NIST SP 1038, section 4.1.1). The litre (L) is accepted for use with the SI for volume (NIST SP 1038, section 4.1.2 and the note to the volume table in section 5.1.5).'),
    B.p('A ' + B.term('prefix', 'Letters in front of a unit name that multiply the unit by a power of ten, such as kilo (1,000) and milli (' + L.fr(1, '1,000') + ').') + ' in front of a unit multiplies it by a power of ten. Kilo means 1,000, so 1 km = 1,000 m. Milli means ' + L.fr(1, '1,000') + ', so 1 mm = ' + L.fr(1, '1,000') + ' m.'),
    B.table(['Prefix', 'Symbol', 'Multiplies the unit by', 'Example'], [
      ['kilo', 'k', '1,000', '1 km = 1,000 m'],
      ['hecto', 'h', '100', '1 hL = 100 L'],
      ['deca', 'da', '10', '1 dam = 10 m'],
      ['deci', 'd', '0.1', '1 dm = 0.1 m'],
      ['centi', 'c', '0.01', '1 cm = 0.01 m'],
      ['milli', 'm', '0.001', '1 mm = 0.001 m'],
      ['micro', 'µ', '0.000 001', '1 µm = 0.000 001 m']
    ], { align: ['', 'c', 'c', ''], caption: 'SI prefixes. Source: Weights and Measures Act (Canada), Schedule I, Part V, and NIST SP 1038, Table 2. NIST notes that deci, deka (deca) and hecto are rarely used.' }),
    B.p('Each step on the ladder in the chapter opener is a power of ten, so a metric conversion only moves the decimal point. Going to a smaller unit, the number gets bigger, so multiply. Going to a bigger unit, the number gets smaller, so divide.'),
    B.example({
      title: 'Metric conversions',
      q: 'Convert: (a) 2.45 m to mm, (b) 375 mm to m, (c) 1,250 mL to L, (d) 0.85 t to kg.',
      steps: ['(a) 1 m = 1,000 mm. Smaller unit, so multiply: 2.45 × 1,000 = ' + n(2.45 * 1000) + ' mm. The point moves 3 places right.', '(b) Bigger unit, so divide: 375 ÷ 1,000 = ' + n(375 / 1000) + ' m. The point moves 3 places left.', '(c) 1 L = 1,000 mL. 1,250 ÷ 1,000 = ' + n(1250 / 1000) + ' L.', '(d) 1 t (tonne) = 1,000 kg (Weights and Measures Act, Schedule I, Part IV). 0.85 × 1,000 = ' + n(0.85 * 1000) + ' kg.'],
      answer: n(2450) + ' mm, ' + n(0.375) + ' m, ' + n(1.25) + ' L and ' + n(850) + ' kg.'
    }),
    B.p('Very large and very small numbers, such as 1,000,000 mm² in a square metre, can also be written with a power of ten. Section 7.7 shows this scientific notation and the EE key on both calculators.'),
    B.tryIt([
      { q: '3.6 m to mm', a: n(3600) + ' mm' },
      { q: '850 mm to m', a: n(0.85) + ' m' },
      { q: '42 cm to mm', a: n(420) + ' mm' },
      { q: '6,096 mm to m', a: n(6.096) + ' m' },
      { q: '2.5 L to mL', a: n(2500) + ' mL' },
      { q: '1,800 kg to t', a: n(1.8) + ' t' }
    ]),

    B.section('Imperial units, feet and inches'),
    B.p('The ' + B.term('imperial system', 'The system of units based on the inch, foot, yard, pound and gallon. Canada and the United States define these units from the metric units.') + ' uses the inch, foot, yard, pound and gallon. Canadian law defines the yard as 0.9144 m, the foot as ' + L.fr(1, 3) + ' yard and the inch as ' + L.fr(1, 36) + ' yard (Weights and Measures Act, Schedule II). The US defines the same inch, foot and yard (NIST SP 1038), so a US tape and a Canadian tape agree. Table 7.2 lists the length units.'),
    B.p('Lengths on the job are often written in feet and inches, such as 7′ ' + L.mx(9, 1, 2) + '″ (7 feet ' + L.mx(9, 1, 2) + ' inches). To work with them on a calculator, change them to inches first. Multiply the feet by 12 and add the inches.'),
    B.p('For example, 7′ ' + L.mx(9, 1, 2) + '″ is 7 × 12 + 9.5 = ' + n(fi1) + ' in.'),
    B.check('7 × 12 + 9.5 =', n(fi1)),
    B.example({
      title: 'Inches to feet and inches',
      q: 'A cut list gives a length of ' + L.mx(142, 3, 4) + ' in. Write it in feet and inches.',
      steps: ['Divide by 12: 142.75 ÷ 12 = ' + n(r(tin / 12, 4)) + '… The whole number part is ' + tft + ' ft.', 'Inches left over: 142.75 − ' + tft + ' × 12 = ' + n(tinRest) + ' in.', n(tinRest) + ' in is ' + L.mx(10, 3, 4) + ' in.'],
      calc: { seq: '142.75 ÷ 12 =', expect: n(r(tin / 12, 4)), say: 'Only the whole number part, ' + tft + ', is feet. Find the inches left with 142.75 − ' + tft + ' × 12 =, which shows ' + n(tinRest) + '.' },
      answer: L.ftin(tin, 16)
    }),
    B.table(['Unit', 'Symbol', 'Equals'], [
      ['inch', 'in or ″', L.fr(1, 36) + ' yard'],
      ['foot', 'ft or ′', '12 in = ' + L.fr(1, 3) + ' yard'],
      ['yard', 'yd', '3 ft = 36 in'],
      ['mile', 'mi', '1,760 yd = 5,280 ft']
    ], { align: ['', 'c', ''], width: '62%', caption: 'Imperial length units. Source: Weights and Measures Act (Canada), Schedule II, Measurement of Length.' }),
    B.check('142.75 − ' + tft + ' × 12 =', n(tinRest)),
    B.raw(''),
    B.example({
      title: 'Adding feet and inches',
      q: 'Two pieces of 6′ ' + L.mx(4, 3, 4) + '″ and 2′ ' + L.mx(10, 1, 2) + '″ are laid end to end. Find the total length.',
      fig: G6.cutBarFr([{ len: addA, parts: ['6′ 4', [3, 4], '″'] }, { len: addB, parts: ['2′ 10', [1, 2], '″'] }], { askTotal: true, w: 340 }),
      steps: ['Add the feet: 6 + 2 = 8 ft. Add the inches: ' + L.mx(4, 3, 4) + ' + ' + L.mx(10, 1, 2) + ' = ' + L.mx(15, 1, 4) + ' in.', L.mx(15, 1, 4) + ' in is more than a foot: ' + L.mx(15, 1, 4) + ' − 12 = ' + L.mx(3, 1, 4) + ' in, and carry 1 ft.', 'Total: 8 + 1 = 9 ft and ' + L.mx(3, 1, 4) + ' in.', 'Check in inches: ' + n(addA) + ' + ' + n(addB) + ' = ' + n(addT) + ' in = ' + L.ftin(addT, 16) + '.'],
      calc: { seq: n(addA) + ' + ' + n(addB) + ' =', expect: n(addT) },
      answer: L.ftin(addT, 16)
    }),
    B.p('Some plans and site layouts give lengths in decimal feet, such as 12.35 ft. Section 7.8 changes feet, inches and sixteenths to decimal feet and back.'),
    B.tryIt([
      { q: 'Write 5′ 7″ in inches.', a: n(5 * 12 + 7) + ' in' },
      { q: 'Write 10′ ' + L.mx(2, 1, 4) + '″ in inches.', a: L.inch(10 * 12 + 2.25, 16).replace('″', ' in') },
      { q: 'Write 86 in in feet and inches.', a: L.ftin(86, 16) },
      { q: 'Write ' + L.mx(125, 1, 2) + ' in in feet and inches.', a: L.ftin(125.5, 16) },
      { q: 'How many feet are in 4 yd?', a: '12 ft' },
      { q: 'Add 3′ ' + L.mx(8, 1, 2) + '″ and 4′ ' + L.mx(7, 3, 4) + '″.', a: L.ftin(3 * 12 + 8.5 + 4 * 12 + 7.75, 16) }
    ]),

    B.section('Converting with exact factors'),
    B.p('A ' + B.term('conversion factor', 'A number that changes a measurement from one unit to another, such as 25.4 to change inches to millimetres.') + ' is the number you multiply or divide by to change units. The inch is defined as exactly 25.4 mm, so 25.4 is the factor between inches and millimetres. It is exact, not rounded, and it gives the same answer on every job.'),
    B.formula('Inches and millimetres', ['mm = in × 25.4', 'in = mm ÷ 25.4'], '1 in = 25.4 mm exactly (NIST SP 1038, section 5.1.3). It also follows from the Weights and Measures Act: 0.9144 m ÷ 36 = 0.0254 m.'),
    B.table(['From', 'To', 'Multiply by', 'Exact?'], [
      ['inch (in)', 'millimetre (mm)', '25.4', 'exact'],
      ['inch (in)', 'centimetre (cm)', '2.54', 'exact'],
      ['foot (ft)', 'metre (m)', '0.3048', 'exact'],
      ['yard (yd)', 'metre (m)', '0.9144', 'exact'],
      ['mile (mi)', 'kilometre (km)', '1.609 344', 'exact'],
      ['pound (lb)', 'kilogram (kg)', '0.453 592 37', 'exact']
    ], { align: ['', '', 'c', 'c'], caption: 'Length and mass factors. Source: NIST SP 1038, sections 5.1.3 and 5.2, which prints exact factors in bold. The yard and the pound are also defined this way in the Weights and Measures Act (Canada), Schedule II. To go the other way, divide. Long decimals are printed in groups of three digits, as in the source. Key them without the spaces.' }),
    B.example({
      title: 'A fraction of an inch in millimetres',
      q: 'A drawing calls for ' + L.fr(3, 8) + ' in plate. What is that in millimetres?',
      steps: ['Inches to millimetres: multiply by 25.4.', L.fr(3, 8) + ' × 25.4 = 0.375 × 25.4 = ' + n(0.375 * IN_MM) + ' mm.'],
      calc: { seq: '3 ab/c 8 × 25.4 =', expect: n(0.375 * IN_MM), say: 'The fraction key keys ' + L.fr(3, 8) + ' directly. Keying 3 ÷ 8 × 25.4 = gives the same result.' },
      answer: n(0.375 * IN_MM) + ' mm'
    }),
    B.example({
      title: 'Millimetres to the nearest sixteenth',
      q: 'A metric drawing shows 1,480 mm. You have an inch tape. What do you mark, to the nearest ' + L.fr(1, 16) + ' in?',
      steps: ['Dividing by 25.4 changes millimetres to inches. Multiplying by 16 then counts sixteenths of an inch, so do both in one line.', '1,480 ÷ 25.4 × 16 = ' + n(r(mm1in * 16, 2), 2) + '… sixteenths, which rounds to ' + mm1s + ' sixteenths.', mm1s + ' ÷ 16 = ' + n(mm1s / 16) + ' in, which is ' + L.mx(58, 4, 16) + ' = ' + L.mx(58, 1, 4) + ' in.'],
      calc: { rows: [{ label: 'Sixteenths', seq: '1480 ÷ 25.4 × 16 =', expect: n(r(mm1in * 16, 2), 2) }, { label: 'Inches', seq: mm1s + ' ÷ 16 =', expect: n(mm1s / 16) }] },
      answer: 'Mark ' + L.inch(mm1in, 16) + ' (that is ' + L.ftin(mm1in, 16) + ').'
    }),
    B.example({
      title: 'Feet and inches to millimetres',
      q: 'A pipe run is 7′ ' + L.mx(9, 1, 2) + '″ long. How long is it in millimetres?',
      steps: ['Change to inches first, as in Section 7.2: 7 × 12 + 9.5 = ' + n(fi1) + ' in.', 'Multiply by 25.4: ' + n(fi1) + ' × 25.4 = ' + n(fi1mm) + ' mm.'],
      calc: { seq: '( 7 × 12 + 9.5 ) × 25.4 =', expect: n(fi1mm), say: 'The brackets make both calculators finish the inches before multiplying by 25.4.' },
      answer: n(fi1mm) + ' mm, which is about ' + n(r(fi1mm / 1000, 2), 2) + ' m.'
    }),
    B.example({
      title: 'Pounds to kilograms',
      q: 'A bag of grout is marked 50 lb. What is its mass in kilograms, to two decimal places?',
      steps: ['Pounds to kilograms: multiply by 0.453 592 37.', '50 × 0.453 592 37 = ' + n(lbkg) + ' kg.', 'Round to two decimal places: ' + n(r(lbkg, 2), 2) + ' kg.'],
      calc: { seq: '50 × 0.45359237 =', expect: n(r(lbkg, 2), 2) },
      answer: n(r(lbkg, 2), 2) + ' kg'
    }),
    B.watch('Multiply or divide?', 'A millimetre is much smaller than an inch, so a length in millimetres is always the bigger number. If you convert ' + L.fr(3, 8) + ' in and get 0.015 mm, you divided when you should have multiplied. Check every answer this way.'),
    B.tryIt([
      { q: '12 in to mm', a: n(12 * IN_MM) + ' mm' },
      { q: L.fr(5, 16) + ' in to mm', a: n(5 / 16 * IN_MM) + ' mm' },
      { q: '20 ft to m', a: n(20 * FT_M) + ' m' },
      { q: '762 mm to inches', a: n(762 / IN_MM) + ' in' },
      { q: '2,000 mm to inches, to the nearest ' + L.fr(1, 16) + ' in', a: L.inch(2000 / IN_MM, 16) },
      { q: '110 lb to kg, to two decimal places', a: n(r(110 * LB_KG, 2), 2) + ' kg' }
    ]),

    B.section('Units of area and volume'),
    B.p('Area is measured in square units and volume in cubic units. A ' + B.term('square unit') + ' is a square 1 unit on each side. A ' + B.term('cubic unit') + ' is a cube 1 unit on each side. Because a square has two sides that are measured, the length factor is used twice for area. For volume it is used three times.'),
    B.figure(ftGrid(), 'One square foot is a square 12 in on each side. It holds 12 rows of 12 square inches.'),
    B.table(['Area', 'Volume'], [
      ['1 m² = 1,000 × 1,000 = 1,000,000 mm²', '1 m³ = 1,000 L'],
      ['1 ft² = 12 × 12 = 144 in²', '1 L = 1,000,000 mm³ = 1,000 cm³'],
      ['1 in² = 645.16 mm² (exact)', '1 ft³ = 12 × 12 × 12 = 1,728 in³'],
      ['1 ft² = 0.092 903 04 m² (exact)', '1 in³ = 16.387 064 cm³ (exact)']
    ], { caption: 'Area and volume factors. Sources: NIST SP 1038, sections 5.1.4 and 5.1.5, for the square inch, square foot and cubic inch. The Weights and Measures Act (Canada), Schedule I, Part IV, for the litre (' + L.fr(1, '1,000') + ' m³), and Schedule II for 1 in² = ' + L.fr(1, 144) + ' ft² and 1 in³ = ' + L.fr(1, '1,728') + ' ft³.' }),
    B.example({
      title: 'A plate in square metres',
      q: 'A plate is ' + n(pl[0]) + ' mm by ' + n(pl[1]) + ' mm. Find its area in mm² and in m².',
      steps: ['Area = length × width = ' + n(pl[0]) + ' × ' + n(pl[1]) + ' = ' + n(plmm2) + ' mm².', '1 m² = 1,000,000 mm², so divide: ' + n(plmm2) + ' ÷ 1,000,000 = ' + n(plm2) + ' m².', 'Check with metres first: 2.4 m × 1.2 m = ' + n(r(2.4 * 1.2, 6)) + ' m².'],
      calc: { seq: pl[0] + ' × ' + pl[1] + ' ÷ 1000000 =', expect: n(plm2) },
      answer: n(plmm2) + ' mm² = ' + n(plm2) + ' m²'
    }),
    B.example({
      title: 'A sheet in square feet and square metres',
      q: 'A sheet is 4 ft by 8 ft. Find its area in ft², then in m² to two decimal places.',
      steps: ['Area = 4 × 8 = ' + shft2 + ' ft².', 'Multiply by 0.092 903 04: ' + shft2 + ' × 0.092 903 04 = ' + n(r(shm2, 8)) + ' m².', 'Round: ' + n(r(shm2, 2), 2) + ' m².'],
      calc: { seq: shft2 + ' × 0.09290304 =', expect: n(r(shm2, 2), 2) },
      answer: shft2 + ' ft² = ' + n(r(shm2, 2), 2) + ' m²'
    }),
    B.example({
      title: 'Litres in a tank',
      q: 'A rectangular tank measures ' + tk.map(v => n(v)).join(' mm × ') + ' mm inside. How many litres does it hold?',
      fig: B.shape('rectangular-prism', { l: tk[0], w: tk[1], h: tk[2] }, { width: '2.5in' }),
      steps: ['Volume = ' + tk.map(v => n(v)).join(' × ') + ' = ' + n(tkmm3) + ' mm³.', '1 L = 1,000,000 mm³, so divide: ' + n(tkmm3) + ' ÷ 1,000,000 = ' + n(tkL) + ' L.'],
      calc: { seq: tk.join(' × ') + ' ÷ 1000000 =', expect: n(tkL) },
      answer: n(tkL) + ' L'
    }),
    B.watch('Do not use 1,000 for square millimetres', '1 m = 1,000 mm, but 1 m² = 1,000,000 mm². A square metre is 1,000 mm long and 1,000 mm wide, so it holds 1,000 × 1,000 square millimetres.'),
    B.tryIt([
      { q: '3 m² to mm²', a: n(3e6) + ' mm²' },
      { q: '450,000 mm² to m²', a: n(0.45) + ' m²' },
      { q: '5 ft² to in²', a: n(5 * 144) + ' in²' },
      { q: '10 in² to mm²', a: n(r(10 * 645.16, 6)) + ' mm²' },
      { q: 'A tank 1,000 mm × 800 mm × 600 mm. Litres?', a: n(1000 * 800 * 600 / 1e6) + ' L' },
      { q: '2 ft³ to in³', a: n(2 * 1728) + ' in³' }
    ]),

    B.section('Litres and gallons'),
    B.p('There are two gallons, and they are not the same size. The US gallon is 231 in³ (NIST SP 1038, section 3.2). Since 1 in³ = 16.387 064 cm³ exactly, the US gallon is 231 × 16.387 064 = 3,785.411 784 cm³, which is exactly 3.785 411 784 L. The imperial gallon is defined in the Weights and Measures Act (Canada), Schedule II, as ' + L.fr('454 609', '100 000 000') + ' m³, which is exactly 4.546 09 L.'),
    B.check('231 × 16.387064 ÷ 1000 =', n(r(USGAL_L, 9))),
    B.table(['Gallon', 'Litres (exact)', 'Source'], [
      ['US gallon (US gal)', '3.785 411 784', 'NIST SP 1038: 231 in³, and 1 in³ = 16.387 064 cm³'],
      ['Imperial gallon (imp gal)', '4.546 09', 'Weights and Measures Act (Canada), Schedule II']
    ], { align: ['', 'c', ''], caption: 'The two gallons. The volume table in NIST SP 1038 (section 5.1.5) rounds the US gallon to 3.785 412 L.' }),
    B.example({
      title: 'US gallons to litres',
      q: 'A drum holds ' + drum + ' US gal. How many litres is that, to two decimal places?',
      steps: ['Multiply by 3.785 411 784: ' + drum + ' × 3.785 411 784 = ' + n(r(drumL, 6)) + '… L.', 'Round: ' + n(r(drumL, 2), 2) + ' L.'],
      calc: { seq: drum + ' × 3.785411784 =', expect: n(r(drumL, 2), 2) },
      answer: n(r(drumL, 2), 2) + ' L'
    }),
    B.example({
      title: 'Imperial gallons, litres and US gallons',
      q: 'An older tank is marked ' + ig + ' imp gal. How many litres does it hold? How many US gallons? Round to two decimal places.',
      steps: ['Imperial gallons to litres: ' + ig + ' × 4.546 09 = ' + n(igL) + ' L.', 'Litres to US gallons: divide by 3.785 411 784. ' + n(igL) + ' ÷ 3.785 411 784 = ' + n(r(igUS, 4)) + '…', 'Round: ' + n(r(igL, 2), 2) + ' L and ' + n(r(igUS, 2), 2) + ' US gal.'],
      calc: { rows: [{ label: 'Litres', seq: ig + ' × 4.54609 =', expect: n(r(igL, 2), 2) }, { label: 'US gallons', seq: ig + ' × 4.54609 ÷ 3.785411784 =', expect: n(r(igUS, 2), 2) }] },
      answer: n(r(igL, 2), 2) + ' L, which is ' + n(r(igUS, 2), 2) + ' US gal. The imperial gallon is the larger gallon.'
    }),
    B.tryIt([
      { q: '10 US gal to L, to two decimal places', a: n(r(10 * USGAL_L, 2), 2) + ' L' },
      { q: '10 imp gal to L, to two decimal places', a: n(r(10 * IMPGAL_L, 2), 2) + ' L' },
      { q: 'The ' + n(tkL) + ' L tank in Example 7.10, in US gal to two decimal places', a: n(r(tkGal, 2), 2) + ' US gal' },
      { q: '1 imp gal in US gal, to three decimal places', a: n(r(IMPGAL_L / USGAL_L, 3), 3) + ' US gal' },
      { q: '1 ft³ in US gal, to two decimal places (1 ft³ = 1,728 in³)', a: n(r(1728 / 231, 2), 2) + ' US gal' },
      { q: '500 L to imp gal, to two decimal places', a: n(r(500 / IMPGAL_L, 2), 2) + ' imp gal' }
    ]),

    B.section('Temperature'),
    B.p('Temperature is measured in degrees Celsius (°C) in the metric system and degrees Fahrenheit (°F) in the imperial system. The two scales are linked by an exact formula. NIST SP 1038 (section 5.3, note 33) gives °C = (°F − 32) ÷ 1.8, and turned around it gives °F = 1.8 × °C + 32. Both are exact definitions, so round only the final answer.'),
    B.formula('Celsius and Fahrenheit', ['°F = 1.8 × °C + 32', '°C = (°F − 32) ÷ 1.8'], 'Exact. Follow BEDMAS: in the first formula multiply before you add, and in the second subtract inside the brackets before you divide.'),
    B.figure(thermo(), 'The two scales side by side. Each °F mark comes from °F = 1.8 × °C + 32. At −40 the two scales read the same number.'),
    B.example({
      title: 'Celsius to Fahrenheit',
      q: 'A water heater is set to ' + c1 + ' °C. What is that in °F?',
      steps: ['°F = 1.8 × ' + c1 + ' + 32. Multiply first: 1.8 × ' + c1 + ' = ' + n(1.8 * c1) + '.', 'Then add: ' + n(1.8 * c1) + ' + 32 = ' + n(f1) + '.'],
      calc: { seq: '1.8 × ' + c1 + ' + 32 =', expect: n(f1) },
      answer: n(f1) + ' °F'
    }),
    B.example({
      title: 'Fahrenheit to Celsius',
      q: 'An oven for drying electrodes is set to ' + f2 + ' °F. What is that in °C, to one decimal place?',
      steps: ['°C = (' + f2 + ' − 32) ÷ 1.8. Brackets first: ' + f2 + ' − 32 = ' + (f2 - 32) + '.', 'Divide: ' + (f2 - 32) + ' ÷ 1.8 = ' + n(r(c2, 4)) + '…, which rounds to ' + n(r(c2, 1), 1) + '.'],
      calc: { seq: '( ' + f2 + ' − 32 ) ÷ 1.8 =', expect: n(r(c2, 1), 1), say: 'Without the brackets, both calculators divide 32 by 1.8 first and give a wrong answer.' },
      answer: n(r(c2, 1), 1) + ' °C'
    }),
    B.keyidea('A change in temperature has no 32', 'A rise or drop is converted with the 1.8 alone: a change of 1 °C is a change of 1.8 °F (NIST SP 1038, note 33). A part that warms up by ' + dC + ' °C warms up by ' + dC + ' × 1.8 = ' + n(dF) + ' °F.'),
    B.check(dC + ' × 1.8 =', n(dF)),
    B.p('Worksheet 7C at the end of the chapter is a full page of temperature practice.'),
    B.tryIt([
      { q: '20 °C to °F', a: n(1.8 * 20 + 32) + ' °F' },
      { q: '−10 °C to °F', a: n(1.8 * -10 + 32) + ' °F' },
      { q: '212 °F to °C', a: n((212 - 32) / 1.8) + ' °C' },
      { q: '50 °F to °C', a: n((50 - 32) / 1.8) + ' °C' },
      { q: '400 °F to °C, to one decimal place', a: n(r((400 - 32) / 1.8, 1), 1) + ' °C' },
      { q: 'A temperature drops by 15 °C. How many °F is that drop?', a: n(15 * 1.8) + ' °F' }
    ]),

    B.section('Powers of ten and scientific notation'),
    B.p('The metric prefixes in Section 7.1 are powers of ten. 1,000 is 10 × 10 × 10, which is written ' + sup(3) + ': ten to the power 3. 1,000,000 is ' + sup(6) + '. A negative power means divide: ' + sup(-3) + ' is 1 ÷ 1,000 = 0.001, the milli in millimetre.',
      B.term('Scientific notation', 'A way to write a number as a number from 1 up to 10, times a power of ten, such as 6.4 × 10<sup>6</sup> for 6,400,000.', 'Scientific notation') + ' writes a number as a number from 1 up to 10, times a power of ten. 6,400,000 is 6.4 × ' + sup(6) + '. 0.0254 is 2.54 × ' + sup(-2) + '. The power tells you how many places the decimal point moves: right for a positive power, left for a negative one.'),
    B.example({
      title: 'Writing numbers in scientific notation',
      q: 'Write (a) 2,880,000 mm² and (b) 0.000 35 m in scientific notation. (c) Write 3.6 × ' + sup(4) + ' as an ordinary number.',
      steps: ['(a) Put the point after the first digit: 2.88. The point moved 6 places left, so the power is 6. 2,880,000 mm² = 2.88 × ' + sup(6) + ' mm².', '(b) The first digit that is not zero is 3. The point moves 4 places right to make 3.5, so the power is −4. 0.000 35 m = 3.5 × ' + sup(-4) + ' m.', '(c) A power of 4 moves the point 4 places right: 3.6 × ' + sup(4) + ' = 36,000.'],
      answer: '2.88 × ' + sup(6) + ' mm², 3.5 × ' + sup(-4) + ' m and 36,000.'
    }),
    B.p('Both calculators take a power of ten with one key. On the TI-30Xa it is EE. On the Sharp EL-531XT it is Exp. Key the number, then EE or Exp, then the power. A calculator also switches to scientific notation by itself when an answer has too many digits for the display.'),
    B.example({
      title: 'Scientific notation on the calculator',
      q: 'A tank holds 3.6 × ' + sup(8) + ' mm³. There are 1 × ' + sup(6) + ' mm³ in a litre. How many litres does it hold?',
      steps: ['Divide the volume by the size of one litre: 3.6 × ' + sup(8) + ' ÷ (1 × ' + sup(6) + ').', 'Dividing powers of ten takes the powers away: 8 − 6 = 2, so the answer is 3.6 × ' + sup(2) + ' = 360.'],
      calc: { seq: '3.6 EE 8 ÷ 1 EE 6 =', expect: '360', say: 'EE (TI-30Xa) and Exp (Sharp EL-531XT) key the power of ten that belongs to the number in front of them, so no brackets are needed.' },
      answer: '360 L. This is the tank of Example 7.10: 1,200 × 600 × 500 = 360,000,000 mm³.'
    }),
    B.check('1200 × 600 × 500 =', '360,000,000'),
    B.tryIt([
      { q: 'Write 45,000 in scientific notation.', a: '4.5 × ' + sup(4) },
      { q: 'Write 0.006 in scientific notation.', a: '6 × ' + sup(-3) },
      { q: 'Write 7.2 × ' + sup(5) + ' as an ordinary number.', a: n(720000) },
      { q: 'Write 1.5 × ' + sup(-3) + ' m in millimetres.', a: n(1.5) + ' mm' },
      { q: 'How many mm² are in 1 m², as a power of ten?', a: sup(6) + ' mm²' },
      { q: 'Work out 4.8 × ' + sup(7) + ' ÷ (2 × ' + sup(4) + ').', a: '2.4 × ' + sup(3) + ' = ' + n(2400) }
    ]),
    B.check('4.8 EE 7 ÷ 2 EE 4 =', '2,400'),

    B.section('Decimal feet'),
    B.p('Site plans and some layout tools give lengths in ' + B.term('decimal feet', 'Feet written as a decimal number, such as 12.35 ft, instead of feet and inches. 0.01 ft is 0.12 in.') + ': feet and hundredths of a foot, such as 12.35 ft. A hundredth of a foot is 0.01 × 12 = 0.12 in, a little less than ' + L.fr(1, 8) + ' in. Your tape reads feet, inches and sixteenths, so you need to change between the two.'),
    B.keyidea('Changing between the two', 'To decimal feet: change the inches and sixteenths to inches, divide by 12, and add the whole feet.', 'From decimal feet: keep the whole feet. Multiply the decimal part by 12 to get inches. Keep the whole inches, and multiply what is left by 16 to count sixteenths.'),
    B.example({
      title: 'Feet, inches and sixteenths to decimal feet',
      q: 'Write 10′ ' + L.mx(4, 3, 16) + '″ in decimal feet, to two decimal places.',
      steps: ['Inches: 4 + 3 ÷ 16 inches. Divide by 12 to change them to feet.', 'Add the whole feet: 10 + (4 + 3 ÷ 16) ÷ 12 = ' + n(r(df1v, 4)) + '… ft.', 'Round to two decimal places: ' + n(r(df1v, 2), 2) + ' ft.'],
      calc: { seq: '10 + ( 4 + 3 ÷ 16 ) ÷ 12 =', expect: n(r(df1v, 2), 2), say: 'The brackets make both calculators add the inches before dividing by 12.' },
      answer: n(r(df1v, 2), 2) + ' ft'
    }),
    B.example({
      title: 'Decimal feet to feet, inches and sixteenths',
      q: 'A plan gives a length of ' + n(df2) + ' ft. What do you mark on the tape, to the nearest ' + L.fr(1, 16) + ' in?',
      steps: ['Whole feet: 12 ft. The decimal part is 0.35 ft.', 'Inches: 0.35 × 12 = ' + n(df2in) + ' in. Keep the 4 whole inches.', 'Sixteenths: 0.2 × 16 = ' + n(df2s) + ', which rounds to 3 sixteenths.', 'Put it together: 12′ ' + L.mx(4, 3, 16) + '″.'],
      calc: { rows: [{ label: 'Inches', seq: '0.35 × 12 =', expect: n(df2in) }, { label: 'Sixteenths', seq: '0.2 × 16 =', expect: n(df2s) }] },
      answer: '12′ ' + L.mx(4, 3, 16) + '″'
    }),
    B.tryIt([
      { q: 'Write 6′ 6″ in decimal feet.', a: n(6.5) + ' ft' },
      { q: 'Write 8′ 3″ in decimal feet.', a: n(8.25) + ' ft' },
      { q: 'Write 4′ ' + L.mx(7, 1, 2) + '″ in decimal feet, to two decimal places.', a: n(r(4 + 7.5 / 12, 2), 2) + ' ft' },
      { q: 'Write 9.75 ft in feet and inches.', a: L.ftin(9.75 * 12, 16) },
      { q: 'Write 15.4 ft in feet and inches, to the nearest ' + L.fr(1, 16) + ' in.', a: L.ftin(15.4 * 12, 16) },
      { q: 'Write 22.18 ft in feet and inches, to the nearest ' + L.fr(1, 16) + ' in.', a: L.ftin(22.18 * 12, 16) }
    ]),

    B.section('Carpentry: code values, board feet and floor area'),
    B.p('The BC Building Code states its limits in millimetres. On a job laid out in inches you convert them, but the code value itself never changes. The rise limit is 200 mm, not the inch number you worked out. When you round a converted limit to a tape reading, round so that you stay inside the limit: round a maximum down and a minimum up.',
      'Table 9.8.4.1 forms part of Sentence 9.8.4.1.(1) (' + PL.cite('9.8.4.1') + '). For private stairs, which serve single dwelling units, it gives a maximum rise of 200 mm and a minimum rise of 125 mm. Table 9.8.4.2, in Sentence 9.8.4.2.(1) (' + PL.cite('9.8.4.2') + '), gives private stairs a minimum run of 255 mm and a maximum run of 355 mm.'),
    PL.figure(B, '9.8.4.1', { crop: [55, 160, 490, 155], width: '4.4in', caption: 'Table 9.8.4.1 on the ACCESS plate for Article 9.8.4.1. The code value is the millimetre number. The inch values in brackets are conversions to the nearest sixteenth.' }),
    B.example({
      title: 'A code maximum in inches',
      q: 'The maximum rise for private stairs is 200 mm (Table 9.8.4.1). Convert it to sixteenths of an inch. What is the largest tape reading that stays within the limit?',
      steps: ['200 ÷ 25.4 × 16 = ' + n(r(riseS, 2), 2) + '… sixteenths.', 'The nearest sixteenth is ' + riseNear + ' sixteenths, which is ' + L.mx(7, 14, 16) + ' = ' + L.mx(7, 7, 8) + ' in. But ' + riseNear + ' ÷ 16 × 25.4 = ' + n(r(riseNear / 16 * IN_MM, 2), 2) + ' mm, a little over 200 mm.', 'For a maximum, round down: ' + riseDn + ' sixteenths = ' + L.mx(7, 13, 16) + ' in, which is ' + n(r(riseDn / 16 * IN_MM, 2), 2) + ' mm.', 'The code value is still 200 mm.'],
      calc: { rows: [{ label: 'Sixteenths', seq: '200 ÷ 25.4 × 16 =', expect: n(r(riseS, 2), 2) }, { label: 'Check ' + riseDn + ' sixteenths', seq: riseDn + ' ÷ 16 × 25.4 =', expect: n(r(riseDn / 16 * IN_MM, 2), 2) }] },
      answer: L.mx(7, 13, 16) + ' in. The limit stays 200 mm.'
    }),
    B.example({
      title: 'A code minimum in inches',
      q: 'The minimum run for private stairs is 255 mm (Table 9.8.4.2). What is the smallest tape reading, to a sixteenth, that meets it?',
      steps: ['255 ÷ 25.4 × 16 = ' + n(r(runS, 2), 2) + '… sixteenths.', 'For a minimum, round up: ' + runUp + ' sixteenths.', runUp + ' ÷ 16 = 10 and 1 sixteenth left: ' + L.mx(10, 1, 16) + ' in. Check: ' + runUp + ' ÷ 16 × 25.4 = ' + n(r(runUp / 16 * IN_MM, 2), 2) + ' mm, which is at least 255 mm.'],
      calc: { rows: [{ label: 'Sixteenths', seq: '255 ÷ 25.4 × 16 =', expect: n(r(runS, 2), 2) }, { label: 'Check ' + runUp + ' sixteenths', seq: runUp + ' ÷ 16 × 25.4 =', expect: n(r(runUp / 16 * IN_MM, 2), 2) }] },
      answer: L.mx(10, 1, 16) + ' in. The limit stays 255 mm.'
    }),
    B.p('Lumber is often counted in ' + B.term('board foot', null, 'board feet') + '. NIST SP 1038 (section 5.1.5) gives 1 board foot = 0.002 359 737 m³. Divided by 1 in³ = 16.387 064 cm³, that is 144 in³: a board 12 in by 12 in by 1 in. For a board with its thickness and width in inches and its length in feet, the formula below follows from 144 in³. Use the sizes the problem or the order gives.'),
    B.formula('Board feet', ['Board feet = thickness (in) × width (in) × length (ft) ÷ 12'], 'Thickness × width × (length × 12) ÷ 144 is the same as thickness × width × length ÷ 12.'),
    B.check('0.002359737 × 1000000 ÷ 16.387064 =', '144'),
    B.example({
      title: 'Board feet in a lumber order',
      q: 'An order has ' + bfN + ' pieces sized ' + bf[0] + ' in × ' + bf[1] + ' in × ' + bf[2] + ' ft. How many board feet is that? What is the volume in m³, to three decimal places?',
      steps: ['One piece: ' + bf.join(' × ') + ' ÷ 12 = ' + n(bfEach) + ' board feet.', bfN + ' pieces: ' + bfN + ' × ' + n(bfEach) + ' = ' + n(bfEach * bfN) + ' board feet.', 'In m³: ' + n(bfEach * bfN) + ' × 0.002 359 737 = ' + n(r(bfEach * bfN * BF_M3, 6)) + '…, which rounds to ' + n(r(bfEach * bfN * BF_M3, 3), 3) + ' m³.'],
      calc: { rows: [{ label: 'Board feet', seq: bfN + ' × ' + bf.join(' × ') + ' ÷ 12 =', expect: n(bfEach * bfN) }, { label: 'Cubic metres', seq: n(bfEach * bfN).replace(',', '') + ' × 0.002359737 =', expect: n(r(bfEach * bfN * BF_M3, 3), 3) }] },
      answer: n(bfEach * bfN) + ' board feet, about ' + n(r(bfEach * bfN * BF_M3, 3), 3) + ' m³.'
    }),
    B.example({
      title: 'Floor area in square feet',
      q: 'A room measures ' + room[0] + ' m by ' + room[1] + ' m. The flooring is priced by the square foot. Find the area in m² and in ft², to two decimal places.',
      steps: ['Area: ' + room[0] + ' × ' + room[1] + ' = ' + n(roomM2) + ' m².', '1 ft² = 0.092 903 04 m², so divide: ' + n(roomM2) + ' ÷ 0.092 903 04 = ' + n(r(roomFt2, 4)) + '…', 'Round: ' + n(r(roomFt2, 2), 2) + ' ft².'],
      calc: { seq: room[0] + ' × ' + room[1] + ' ÷ 0.09290304 =', expect: n(r(roomFt2, 2), 2) },
      answer: n(roomM2) + ' m² = ' + n(r(roomFt2, 2), 2) + ' ft²'
    }),
    B.tryIt([
      { q: 'The maximum rise for public stairs is 180 mm (Table 9.8.4.1). Convert it to inches, rounded down to a sixteenth.', a: L.inch(Math.floor(180 / IN_MM * 16) / 16, 16) },
      { q: 'Guards inside a dwelling unit must be at least 900 mm high (Sentence 9.8.8.3.(2), page ' + PL.article('9.8.8.3').page + '). Convert to inches, rounded up to a sixteenth.', a: L.inch(Math.ceil(900 / IN_MM * 16) / 16, 16) },
      { q: 'How many board feet are in one piece 2 in × 6 in × 10 ft?', a: n(2 * 6 * 10 / 12) + ' board feet' },
      { q: 'How many board feet are in 12 pieces 2 in × 4 in × 8 ft? Give two decimal places.', a: n(r(12 * 2 * 4 * 8 / 12, 2), 2) + ' board feet' },
      { q: 'A deck is 3.6 m × 4.8 m. Area in ft², to two decimal places?', a: n(r(3.6 * 4.8 / FT2_M2, 2), 2) + ' ft²' },
      { q: 'A sheet is 4 ft × 8 ft. Area in m², to two decimal places?', a: n(r(32 * FT2_M2, 2), 2) + ' m²' }
    ]),

    B.worksheet({ title: 'Convert on the canvas', sub: 'Lengths and masses in both systems', intro: 'Write the factor you use on every line. Use 1 in = 25.4 mm and 1 lb = 0.453 592 37 kg.' }),
    B.grid2(
      B.prob({ q: 'The sheet is sized in inches. Write both sizes in millimetres.', canvas: rectBoth(48, 30, 4, '48 in', '30 in', { max: '2.1in' }), a: n(48 * IN_MM) + ' mm by ' + n(30 * IN_MM) + ' mm', lines: 2 }),
      B.prob({ q: 'The plate is sized in millimetres. Write both sizes in inches, to the nearest sixteenth of an inch.', canvas: rectBoth(610, 355, 0.3, '610 mm', '355 mm', { max: '2.1in' }), a: L.inch(610 / IN_MM, 16) + ' by ' + L.inch(355 / IN_MM, 16), work: '610 ÷ 25.4 × 16 = ' + n(r(610 / IN_MM * 16, 2), 2) + ' sixteenths, rounds to ' + Math.round(610 / IN_MM * 16) + '. 355 ÷ 25.4 × 16 = ' + n(r(355 / IN_MM * 16, 2), 2) + ' sixteenths, rounds to ' + Math.round(355 / IN_MM * 16) + '.', lines: 2 }),
      B.prob({ q: 'Find the total length in feet and inches, then in millimetres.', canvas: G6.cutBarFr([{ len: 40.5, parts: ['3′ 4', [1, 2], '″'] }, { len: 69, lab: '5′ 9″' }, { len: 31.75, parts: ['2′ 7', [3, 4], '″'] }], { askTotal: true, w: 360, fs: 15 }), a: L.ftin(141.25, 16) + ' = ' + n(141.25 * IN_MM) + ' mm', lines: 2 }),
      B.prob({ q: 'Convert each size on the flat bar to millimetres.', canvas: barCallouts(), a: 'Length ' + n(78 * IN_MM) + ' mm, width ' + n(2.5 * IN_MM) + ' mm, thickness ' + n(0.375 * IN_MM) + ' mm', lines: 2 }),
      B.prob({ q: 'Three bags of 50 lb are loaded on a cart. What is their total mass in kilograms, to two decimal places?', a: n(r(150 * LB_KG, 2), 2) + ' kg', lines: 4 }),
      B.prob({ q: 'A drawing gives 2,400 mm. Write it in metres, in centimetres, and in feet and inches to the nearest sixteenth of an inch.', a: n(2.4) + ' m, ' + n(240) + ' cm, ' + L.ftin(2400 / IN_MM, 16), work: '2,400 ÷ 25.4 × 16 = ' + n(r(2400 / IN_MM * 16, 2), 2) + ' sixteenths, rounds to ' + n(Math.round(2400 / IN_MM * 16)) + '. ' + n(Math.round(2400 / IN_MM * 16)) + ' ÷ 16 = ' + n(Math.round(2400 / IN_MM * 16) / 16) + ' in', lines: 4 })
    ),

    B.worksheet({ title: 'Area, volume, capacity and temperature', sub: 'Square and cubic units, gallons and degrees', intro: 'Use 1 L = 1,000,000 mm³, 1 US gal = 231 in³ and 1 ft² = 0.092 903 04 m².' }),
    B.grid2(
      B.prob({ q: 'How many litres does the tank hold?', canvas: G6.fitSvg(B.shape('rectangular-prism', { l: 1000, w: 500, h: 400 }), 15), a: n(1000 * 500 * 400 / 1e6) + ' L', lines: 2 }),
      B.prob({ q: 'The tank is measured in inches. How many US gallons does it hold, to two decimal places?', canvas: G6.fitSvg(B.shape('rectangular-prism', { l: 30, w: 12, h: 12 }, { units: 'in' }), 15), a: n(r(30 * 12 * 12 / 231, 2), 2) + ' US gal', work: '30 × 12 × 12 = ' + n(30 * 12 * 12) + ' in³, ÷ 231', lines: 2 }),
      B.prob({ q: 'Unfold it: the net of a closed box. Add the six rectangles. Give the area in mm² and m².', canvas: G6.fitSvg(B.net('rectangular-prism', { l: 600, w: 400, h: 300 }), 15), a: n(2 * (600 * 400 + 600 * 300 + 400 * 300)) + ' mm² = ' + n(2 * (600 * 400 + 600 * 300 + 400 * 300) / 1e6) + ' m²', work: '2 × (600 × 400 + 600 × 300 + 400 × 300)', lines: 2 }),
      '<div>' + B.prob({ q: 'A procedure gives a preheat of 150 °C. What is that in °F? A part cools by 40 °C. How many °F is that drop?', a: n(1.8 * 150 + 32) + ' °F. A drop of ' + n(40 * 1.8) + ' °F.', lines: 3 }) + B.prob({ q: 'Change one value: a cube is 100 mm on each side. How many litres does it hold? How many if each side is 200 mm?', a: n(1) + ' L, then ' + n(8) + ' L (8 times as much)', lines: 3 }) + '</div>'
    ),
    B.check('30 × 12 × 12 ÷ 231 =', n(L.round(30 * 12 * 12 / 231, 2), 2)),

    B.worksheet({ title: 'Temperature practice', sub: 'Celsius and Fahrenheit, readings and changes', intro: 'Use °F = 1.8 × °C + 32 and °C = (°F − 32) ÷ 1.8 for a reading. Use 1.8 alone for a change in temperature. Round only the final answer.' }),
    B.grid2(
      B.prob({ q: 'Find each red ? on the two scales.', canvas: G7.thermo([{ c: 100 }, { c: 40, askF: true }, { c: 0 }, { c: -30, askC: true }]), a: '40 °C = ' + n(1.8 * 40 + 32) + ' °F, and ' + n(1.8 * -30 + 32) + ' °F = −30 °C', mode: 'Practice: find the ?', lines: 3 }),
      '<div>' + B.prob({ q: 'A shop is heated to 22 °C. What is that in °F?', a: n(1.8 * 22 + 32) + ' °F', lines: 3 }) + B.prob({ q: 'A curing oven is set to 425 °F. What is that in °C, to one decimal place?', a: n(r((425 - 32) / 1.8, 1), 1) + ' °C', lines: 3 }) + '</div>',
      B.prob({ q: 'A winter night drops to −25 °C. What is that in °F?', a: n(1.8 * -25 + 32) + ' °F', lines: 3 }),
      B.prob({ q: 'A US weather report gives 5 °F. What is that in °C?', a: n((5 - 32) / 1.8) + ' °C', lines: 3 }),
      B.prob({ q: 'Water in a loop warms up by 18 °C. How many °F is that rise?', a: n(18 * 1.8) + ' °F', lines: 3 }),
      B.prob({ q: 'A part cools by 45 °F. How many °C is that drop?', a: n(45 / 1.8) + ' °C', lines: 3 }),
      B.prob({ q: 'Which is hotter, 38 °C or 100 °F? By how many °F?', a: '38 °C is hotter. It is ' + n(1.8 * 38 + 32) + ' °F, ' + n(r(1.8 * 38 + 32 - 100, 6)) + ' °F more.', lines: 3 }),
      B.prob({ q: 'A product label gives a working range of 10 °C to 32 °C. Write the range in °F.', a: n(1.8 * 10 + 32) + ' °F to ' + n(r(1.8 * 32 + 32, 6)) + ' °F', lines: 3 }),
      B.prob({ q: 'At what temperature do the two scales read the same number? Check it with both formulas.', a: '−40. 1.8 × (−40) + 32 = −40', lines: 3 }),
      B.prob({ q: 'Change one value: a heater is set to 50 °C. Find the °F reading. It is turned up by 10 °C. Find the new reading. By how much did the °F reading go up?', a: n(1.8 * 50 + 32) + ' °F, then ' + n(1.8 * 60 + 32) + ' °F. Up ' + n(10 * 1.8) + ' °F.', lines: 3 }),
      B.prob({ q: 'Write 0 °F in °C, to one decimal place.', a: n(r((0 - 32) / 1.8, 1), 1) + ' °C', lines: 3 }),
      B.prob({ q: 'Write 60 °F in °C, to one decimal place.', a: n(r((60 - 32) / 1.8, 1), 1) + ' °C', lines: 3 }),
      B.prob({ q: 'A recipe oven is set to 180 °C. What is that in °F?', a: n(1.8 * 180 + 32) + ' °F', lines: 3 }),
      B.prob({ q: 'Write 37 °C in °F.', a: n(r(1.8 * 37 + 32, 6)) + ' °F', lines: 3 }),
      B.prob({ q: 'A thermostat is turned up from 68 °F to 72 °F. How many °C is that change, to one decimal place?', a: n(r(4 / 1.8, 1), 1) + ' °C', lines: 3 }),
      B.prob({ q: 'A pipe warms from 15 °C to 60 °C. Find the rise in °C and in °F.', a: '45 °C, which is ' + n(45 * 1.8) + ' °F', lines: 3 })
    ),
    B.check('( 0 − 32 ) ÷ 1.8 =', n(r(-32 / 1.8, 1), 1)),
    B.check('( 60 − 32 ) ÷ 1.8 =', n(r(28 / 1.8, 1), 1)),
    B.check('4 ÷ 1.8 =', n(r(4 / 1.8, 1), 1)),
    B.check('1.8 × 22 + 32 =', n(1.8 * 22 + 32)),
    B.check('( 425 − 32 ) ÷ 1.8 =', n(r((425 - 32) / 1.8, 1), 1)),
    B.check('1.8 × 25 +⇄− + 32 =', n(1.8 * -25 + 32)),
    B.check('( 5 − 32 ) ÷ 1.8 =', n((5 - 32) / 1.8)),
    B.check('1.8 × 38 + 32 =', n(1.8 * 38 + 32)),

    B.worksheet({ title: 'Carpentry: code values, board feet and area', sub: 'Convert without changing the code value', intro: 'Code values are quoted from the BC Building Code 2024, Division B. Round a converted maximum down and a converted minimum up, to the nearest ' + L.fr(1, 16) + ' in. Use 1 ft² = 0.092 903 04 m² and board feet = thickness (in) × width (in) × length (ft) ÷ 12.' }),
    B.grid2(
      B.prob({ q: 'A room is drawn with metric sizes. Find its area in m², then in ft² to two decimal places.', canvas: rectBoth(4.8, 3.6, 40, '4.8 m', '3.6 m', { max: '2.1in' }), a: n(r(4.8 * 3.6, 6)) + ' m² = ' + n(r(4.8 * 3.6 / FT2_M2, 2), 2) + ' ft²', lines: 3 }),
      B.prob({ q: 'Find the board feet in one piece, to two decimal places. Then find the board feet in 30 pieces.', canvas: G6.fitSvg(B.shape('rectangular-prism', { l: 192, w: 10, h: 2 }, { units: 'in' }), 15), a: n(2 * 10 * 16 / 12, 2) + ' board feet each, ' + n(30 * 2 * 10 * 16 / 12) + ' board feet in 30', work: '2 × 10 × 16 ÷ 12, where 192 in = 16 ft', lines: 3 }),
      B.prob({ q: 'The maximum rise for public stairs is 180 mm (Table 9.8.4.1, page 9-31). Give the largest tape reading, to a sixteenth, that stays within it.', a: L.inch(Math.floor(180 / IN_MM * 16) / 16, 16), work: '180 ÷ 25.4 × 16 = ' + n(r(180 / IN_MM * 16, 2), 2) + ' sixteenths, round down to ' + Math.floor(180 / IN_MM * 16), lines: 3 }),
      B.prob({ q: 'Stairs serving a single dwelling unit need a clear height of at least 1 950 mm (Sentence 9.8.2.2.(3), page 9-30). Write it in feet and inches, rounded up to a sixteenth.', a: L.ftin(Math.ceil(1950 / IN_MM * 16) / 16, 16), work: '1,950 ÷ 25.4 × 16 = ' + n(r(1950 / IN_MM * 16, 2), 2) + ' sixteenths, round up to ' + n(Math.ceil(1950 / IN_MM * 16)), lines: 3 }),
      B.prob({ q: 'Required handrails must be 865 mm to 1 070 mm high (Sentence 9.8.7.4.(2), page 9-36). Write the range in inches, rounded to a sixteenth so that it stays inside the range.', a: L.inch(Math.ceil(865 / IN_MM * 16) / 16, 16) + ' to ' + L.inch(Math.floor(1070 / IN_MM * 16) / 16, 16), work: '865 ÷ 25.4 × 16 = ' + n(r(865 / IN_MM * 16, 2), 2) + ', round up. 1,070 ÷ 25.4 × 16 = ' + n(r(1070 / IN_MM * 16, 2), 2) + ', round down', lines: 3 }),
      B.prob({ q: 'A layout gives a wall as 14.65 ft. Write it in feet, inches and sixteenths.', a: L.ftin(14.65 * 12, 16), work: '0.65 × 12 = ' + n(r(0.65 * 12, 6)) + ' in, 0.8 × 16 = ' + n(r(0.8 * 16, 6)) + ', about 13 sixteenths', lines: 3 }),
      B.prob({ q: 'Find the total length of the rim joist pieces in feet and inches, in decimal feet to two places, and in millimetres.', canvas: G6.cutBarFr([{ len: 148.5, parts: ['12′ 4', [1, 2], '″'] }, { len: 115.75, parts: ['9′ 7', [3, 4], '″'] }], { askTotal: true, w: 300 }), a: L.ftin(264.25, 16) + ' = ' + n(r(264.25 / 12, 2), 2) + ' ft = ' + n(r(264.25 * IN_MM, 2), 2) + ' mm', work: '148.5 + 115.75 = 264.25 in', lines: 3 }),
      B.prob({ q: 'A sheet of sheathing is 4 ft × 8 ft. A roof needs 46 sheets. What is the area covered in ft² and in m², to two decimal places?', a: n(46 * 32) + ' ft² = ' + n(r(46 * 32 * FT2_M2, 2), 2) + ' m²', lines: 3 }),
      B.prob({ q: 'The minimum rise for private stairs is 125 mm (Table 9.8.4.1, page 9-31). Give the smallest tape reading, to a sixteenth, that meets it.', a: L.inch(Math.ceil(125 / IN_MM * 16) / 16, 16), work: '125 ÷ 25.4 × 16 = ' + n(r(125 / IN_MM * 16, 2), 2) + ' sixteenths, round up to ' + Math.ceil(125 / IN_MM * 16), lines: 3 }),
      B.prob({ q: 'The maximum run for private stairs is 355 mm (Table 9.8.4.2, page 9-31). Give the largest tape reading, to a sixteenth, that stays within it.', a: L.inch(Math.floor(355 / IN_MM * 16) / 16, 16), work: '355 ÷ 25.4 × 16 = ' + n(r(355 / IN_MM * 16, 2), 2) + ' sixteenths, round down to ' + Math.floor(355 / IN_MM * 16), lines: 3 }),
      B.prob({ q: 'A lumber order is 40 pieces 2 in × 6 in × 12 ft and 20 pieces 2 in × 10 in × 14 ft. How many board feet in all, to the nearest whole board foot?', a: n(Math.round(40 * 2 * 6 * 12 / 12 + 20 * 2 * 10 * 14 / 12)) + ' board feet', work: '40 × 2 × 6 × 12 ÷ 12 = ' + n(40 * 2 * 6) + ', 20 × 2 × 10 × 14 ÷ 12 = ' + n(r(20 * 2 * 10 * 14 / 12, 2), 2), lines: 3 }),
      B.prob({ q: 'Write 9′ ' + L.mx(5, 1, 4) + '″ in decimal feet, to two decimal places.', a: n(r(9 + 5.25 / 12, 2), 2) + ' ft', work: '9 + 5.25 ÷ 12', lines: 3 })
    ),
    B.check('125 ÷ 25.4 × 16 =', n(r(125 / IN_MM * 16, 2), 2)),
    B.check('355 ÷ 25.4 × 16 =', n(r(355 / IN_MM * 16, 2), 2)),
    B.check('40 × 2 × 6 × 12 ÷ 12 + 20 × 2 × 10 × 14 ÷ 12 =', n(r(480 + 20 * 2 * 10 * 14 / 12, 2), 2)),
    B.check('9 + 5.25 ÷ 12 =', n(r(9 + 5.25 / 12, 2), 2)),
    B.check('4.8 × 3.6 ÷ 0.09290304 =', n(r(4.8 * 3.6 / FT2_M2, 2), 2)),
    B.check('2 × 10 × 16 ÷ 12 =', n(r(2 * 10 * 16 / 12, 2), 2)),
    B.check('180 ÷ 25.4 × 16 =', n(r(180 / IN_MM * 16, 2), 2)),
    B.check('1950 ÷ 25.4 × 16 =', n(r(1950 / IN_MM * 16, 2), 2)),
    B.check('865 ÷ 25.4 × 16 =', n(r(865 / IN_MM * 16, 2), 2)),
    B.check('1070 ÷ 25.4 × 16 =', n(r(1070 / IN_MM * 16, 2), 2)),
    B.check('264.25 × 25.4 =', n(r(264.25 * IN_MM, 2), 2)),
    B.check('46 × 32 × 0.09290304 =', n(r(46 * 32 * FT2_M2, 2), 2))
  ])
}
