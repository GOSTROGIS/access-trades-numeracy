/*GEN-START*/
var UC = (function () {
  /* ---------- Conversion factors ----------
     Exact factors are exact by definition. Their sources are the Weights and Measures Act (Canada), Schedules I and II,
     NIST SP 811 Appendix B.8 (factors in boldface are exact) with its footnotes, and NIST SP 1038 (U.S. gallon = 231 in³).
     Rounded factors are the ones a task tells you to use. Each one is the exact or measured value cut short. */
  var X = {
    IN_MM: 25.4, FT_IN: 12, FT_M: 0.3048, YD_M: 0.9144,
    IN2_MM2: 645.16, FT2_IN2: 144, FT2_M2: 0.09290304,
    IN3_CM3: 16.387064, FT3_IN3: 1728, FT3_L: 28.316846592, M3_L: 1000,
    USGAL_IN3: 231, USGAL_L: 3.785411784, IMPGAL_L: 4.54609,
    LB_KG: 0.45359237, T_KG: 1000,
    BAR_KPA: 100, F_PER_C: 1.8, F_ZERO: 32
  };
  var RND = { PSI_KPA: 6.895, KPA_PER_M: 9.81, PSI_PER_FT: 0.433, FT_PER_PSI: 2.31 };
  /* Densities from The Engineering ToolBox pages Metals and Alloys - Densities and Water - Density. A real job uses the supplier's figure. */
  var DENS = { steel: { name: 'steel', kgm3: 7850 }, aluminum: { name: 'aluminum', kgm3: 2712 }, copper: { name: 'copper', kgm3: 8940 } };

  /* Every factor shown on the page. exact: true when it is exact by definition. src: key of the Sources list. */
  var FACTORS = [
    { id: 'km', mod: 'u1', from: '1 km', to: '1,000 m', v: 1000, exact: true, src: 'wma', how: 'kilo means 1,000' },
    { id: 'cm', mod: 'u1', from: '1 m', to: '100 cm', v: 100, exact: true, src: 'wma', how: 'centi means 1/100' },
    { id: 'mm', mod: 'u1', from: '1 m', to: '1,000 mm', v: 1000, exact: true, src: 'wma', how: 'milli means 1/1,000' },
    { id: 'cmmm', mod: 'u1', from: '1 cm', to: '10 mm', v: 10, exact: true, src: 'wma', how: '1/100 m = 10/1,000 m' },
    { id: 'ml', mod: 'u1', from: '1 L', to: '1,000 mL', v: 1000, exact: true, src: 'wma', how: 'the millilitre is 1/1,000 litre' },
    { id: 'g', mod: 'u1', from: '1 kg', to: '1,000 g', v: 1000, exact: true, src: 'wma', how: 'kilo means 1,000' },
    { id: 't', mod: 'u1', from: '1 t (tonne)', to: '1,000 kg', v: 1000, exact: true, src: 'wma', how: 'the tonne is 1,000 kilograms' },
    { id: 'in', mod: 'u2', from: '1 in', to: '25.4 mm', v: X.IN_MM, exact: true, src: 'nist', how: 'inch = 1/36 yard, yard = 0.9144 m' },
    { id: 'ft', mod: 'u2', from: '1 ft', to: '12 in = 304.8 mm = 0.3048 m', v: X.FT_M, exact: true, src: 'nist', how: 'foot = 1/3 yard' },
    { id: 'yd', mod: 'u2', from: '1 yd', to: '0.9144 m', v: X.YD_M, exact: true, src: 'wma', how: 'defined in the Weights and Measures Act' },
    { id: 'sixteenth', mod: 'u2', from: '1/16 in', to: '1.5875 mm', v: 1.5875, exact: true, src: 'nist', how: '25.4 ÷ 16' },
    { id: 'mmin', mod: 'u2', from: '1 mm', to: '0.03937 in', v: 0.03937, exact: false, full: '0.039 370 078 7…', src: 'npc', how: '1 ÷ 25.4, rounded' },
    { id: 'mft', mod: 'u2', from: '1 m', to: '3.281 ft', v: 3.281, exact: false, full: '3.280 839 895…', src: 'npc', how: '1 ÷ 0.3048, rounded' },
    { id: 'm2mm2', mod: 'u3', from: '1 m²', to: '1,000,000 mm²', v: 1e6, exact: true, src: 'wma', how: '1,000 × 1,000' },
    { id: 'm2cm2', mod: 'u3', from: '1 m²', to: '10,000 cm²', v: 1e4, exact: true, src: 'wma', how: '100 × 100' },
    { id: 'ft2in2', mod: 'u3', from: '1 ft²', to: '144 in²', v: X.FT2_IN2, exact: true, src: 'nist', how: '12 × 12' },
    { id: 'in2', mod: 'u3', from: '1 in²', to: '645.16 mm²', v: X.IN2_MM2, exact: true, src: 'nist', how: '25.4 × 25.4' },
    { id: 'ft2', mod: 'u3', from: '1 ft²', to: '0.092 903 04 m²', v: X.FT2_M2, exact: true, src: 'nist', how: '0.3048 × 0.3048' },
    { id: 'm2ft2', mod: 'u3', from: '1 m²', to: '10.76 ft²', v: 10.76, exact: false, full: '10.763 910 4…', src: 'npc', how: '1 ÷ 0.092 903 04, rounded' },
    { id: 'm3', mod: 'u3', from: '1 m³', to: '1,000 L', v: X.M3_L, exact: true, src: 'wma', how: 'the litre is 1/1,000 cubic metre' },
    { id: 'lmm3', mod: 'u3', from: '1 L', to: '1,000,000 mm³', v: 1e6, exact: true, src: 'wma', how: '1 L = 1 dm³ = 100 mm × 100 mm × 100 mm' },
    { id: 'ft3in3', mod: 'u3', from: '1 ft³', to: '1,728 in³', v: X.FT3_IN3, exact: true, src: 'nist', how: '12 × 12 × 12' },
    { id: 'ft3', mod: 'u3', from: '1 ft³', to: '28.316 846 592 L', v: X.FT3_L, exact: true, src: 'nist', how: '0.3048 × 0.3048 × 0.3048 × 1,000' },
    { id: 'ft3gal', mod: 'u3', from: '1 ft³', to: '7.48 US gal', v: 7.48, exact: false, full: '7.480 519 48… (1,728 ÷ 231)', src: 'sp1038', how: '1,728 ÷ 231, rounded' },
    { id: 'usgal', mod: 'u4', from: '1 US gal', to: '231 in³ = 3.785 411 784 L', v: X.USGAL_L, exact: true, src: 'sp1038', how: '231 × 16.387 064 cm³' },
    { id: 'impgal', mod: 'u4', from: '1 imperial gal', to: '4.546 09 L', v: X.IMPGAL_L, exact: true, src: 'wma', how: 'defined in the Weights and Measures Act' },
    { id: 'imp_us', mod: 'u4', from: '1 imperial gal', to: '1.201 US gal', v: 1.201, exact: false, full: '1.200 949 9…', src: 'nist', how: '4.546 09 ÷ 3.785 411 784, rounded' },
    { id: 'limp', mod: 'u4', from: '1 L', to: '0.2200 imperial gal', v: 0.22, exact: false, full: '0.219 969 2…', src: 'npc', how: '1 ÷ 4.546 09, rounded' },
    { id: 'psi', mod: 'u5', from: '1 psi', to: '6.894 757 kPa', v: 6.894757, exact: false, full: '6.894 757 293 168… (from the exact pound, inch and standard gravity)', src: 'nist', how: 'NIST lists 7 digits' },
    { id: 'psi4', mod: 'u5', from: '1 psi', to: '6.895 kPa', v: RND.PSI_KPA, exact: false, full: '6.894 757…', src: 'nist', how: 'the rounded factor the tasks use' },
    { id: 'kpapsi', mod: 'u5', from: '1 kPa', to: '0.1450 psi', v: 0.145, exact: false, full: '0.145 037 7…', src: 'npc', how: '1 ÷ 6.894 757, rounded' },
    { id: 'bar', mod: 'u5', from: '1 bar', to: '100 kPa', v: X.BAR_KPA, exact: true, src: 'nist', how: 'defined as 100,000 Pa' },
    { id: 'mwater', mod: 'u5', from: '1 m of water head', to: '9.81 kPa', v: RND.KPA_PER_M, exact: false, full: '9.806 65 kPa, the conventional metre of water (NIST SP 811: 1 mm of water = 9.806 65 Pa, exact)', src: 'nist', how: '9.806 65 rounded to 2 decimal places' },
    { id: 'ftwater', mod: 'u5', from: '1 ft of water head', to: '0.433 psi', v: RND.PSI_PER_FT, exact: false, full: '0.4331 psi for water at 60 °F (NIST SP 811: 1 in of water at 60 °F = 248.84 Pa)', src: 'nist', how: '12 × 248.84 = 2,986.08 Pa, ÷ 6,894.757 = 0.4331, rounded to 3 decimal places' },
    { id: 'psihead', mod: 'u5', from: '1 psi', to: '2.31 ft of water head', v: RND.FT_PER_PSI, exact: false, full: '2.309 ft for water at 60 °F (NIST SP 811)', src: 'nist', how: '1 ÷ 0.433 09 = 2.309, rounded to 2 decimal places' },
    { id: 'c2f', mod: 'u6', from: '°F', to: '1.8 × °C + 32', v: X.F_PER_C, exact: true, src: 'nist', how: 'multiply first, then add' },
    { id: 'f2c', mod: 'u6', from: '°C', to: '(°F − 32) ÷ 1.8', v: X.F_ZERO, exact: true, src: 'nist', how: 'brackets first, then divide' },
    { id: 'dt', mod: 'u6', from: 'a change of 1 °C', to: 'a change of 1.8 °F', v: X.F_PER_C, exact: true, src: 'nist', how: 'a difference has no + 32' },
    { id: 'pct', mod: 'u7', from: 'percent grade', to: 'fall ÷ run × 100', v: 100, exact: true, src: 'npc', how: 'fall and run in the same unit' },
    { id: 'onein', mod: 'u7', from: '1 in 50', to: '1 vertical to 50 horizontal = 2%', v: 2, exact: true, src: 'npc', how: '1 ÷ 50 × 100' },
    { id: 'mmpm', mod: 'u7', from: '1% grade', to: '10 mm per m', v: 10, exact: true, src: 'wma', how: '1/100 of 1,000 mm' },
    { id: 'inft', mod: 'u7', from: '1/4 in per ft', to: '2.083%', v: 2.083, exact: false, full: '2.083 33… (0.25 ÷ 12 × 100)', src: 'nist', how: '0.25 ÷ 12 × 100, rounded' },
    { id: 'lb', mod: 'u8', from: '1 lb', to: '0.453 592 37 kg', v: X.LB_KG, exact: true, src: 'wma', how: 'defined in the Weights and Measures Act' },
    { id: 'kglb', mod: 'u8', from: '1 kg', to: '2.205 lb', v: 2.205, exact: false, full: '2.204 622 6…', src: 'npc', how: '1 ÷ 0.453 592 37, rounded' },
    { id: 'steel', mod: 'u8', from: 'steel', to: '7,850 kg/m³', v: 7850, exact: false, full: 'a listed value, not a definition', src: 'etb-metals', how: 'density' },
    { id: 'alum', mod: 'u8', from: 'aluminum', to: '2,712 kg/m³', v: 2712, exact: false, full: 'a listed value, not a definition', src: 'etb-metals', how: 'density' },
    { id: 'copper', mod: 'u8', from: 'copper', to: '8,940 kg/m³', v: 8940, exact: false, full: 'a listed value, not a definition', src: 'etb-metals', how: 'density' },
    { id: 'water', mod: 'u8', from: 'water at 4 °C', to: '1,000 kg/m³ = about 1 kg per litre', v: 1000, exact: false, full: '999.97 kg/m³ in the table', src: 'etb-water', how: 'density' }
  ];

  /* NPC 2025, Nominal Pipe Size (NPS) to Diameter Nominal (DN) Conversion Chart, PDF page 246. */
  var NPS = [['1/8', 0.125, 6], ['1/4', 0.25, 8], ['3/8', 0.375, 10], ['1/2', 0.5, 15], ['3/4', 0.75, 20], ['1', 1, 25], ['1 1/4', 1.25, 32], ['1 1/2', 1.5, 38],
    ['2', 2, 50], ['2 1/2', 2.5, 65], ['3', 3, 75], ['4', 4, 100], ['5', 5, 125], ['6', 6, 150], ['8', 8, 200], ['10', 10, 250], ['12', 12, 300], ['14', 14, 350],
    ['16', 16, 400], ['18', 18, 450], ['20', 20, 500], ['22', 22, 550], ['24', 24, 600]].map(function (r) { return { nps: r[0], v: r[1], dn: r[2] }; });
  /* Outside diameter of steel pipe, mm: the ASME column of the NPS table on The Engineering ToolBox. Only these sizes are used. */
  var OD = { '1/2': 21.3, '3/4': 26.7, '1': 33.4, '1 1/4': 42.2, '1 1/2': 48.3, '2': 60.3, '2 1/2': 73.0, '3': 88.9, '4': 114.3, '5': 141.3, '6': 168.3, '8': 219.1, '10': 273.0, '12': 323.8, '14': 355.6, '16': 406.4 };

  /* ---------- formatting ---------- */
  /* A value on an exact half (3.175 to 2 decimal places) is stored a hair away from zero, so every display rounds it up. */
  function nudge(x) { return x === 0 ? 0 : x + (x > 0 ? 1 : -1) * Math.abs(x) * 1e-12; }
  function clean(x) { return Number((+x).toPrecision(12)); }
  function grp(s) { return s.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  /* Round half up (away from zero) on the decimal value: 3.175 to 2 places is 3.18, even though the binary number is a hair under. */
  function fmt(n, dp) {
    var f = Math.pow(10, dp), r = Math.round(Number((Math.abs(n) * f).toPrecision(13))) / f;
    var p = r.toFixed(dp).split('.');
    return (n < 0 && r !== 0 ? '−' : '') + grp(p[0]) + (p[1] ? '.' + p[1] : '');
  }
  function trim(n, dp) { var s = fmt(n, dp == null ? 6 : dp); if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, ''); return s; }
  /* n significant digits, for small intermediate values like a volume in m³ */
  function sig(x, n) { if (!x) return '0'; var dp = Math.max(0, n - 1 - Math.floor(Math.log(Math.abs(x)) / Math.LN10)); return trim(x, Math.min(dp, 15)); }
  function rd(n, dp) { var f = Math.pow(10, dp); return Math.round(Number((n * f).toPrecision(13))) / f; }
  function plural(n, one, many) { return n === 1 ? one : many; }
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  function frac16(x) {
    var n = Math.round(x * 16), w = Math.floor(n / 16), r = n - w * 16;
    if (!r) return String(w);
    var g = gcd(r, 16), f = (r / g) + '/' + (16 / g);
    return w ? w + ' ' + f : f;
  }
  function inch(x) { return frac16(x) + '"'; }
  function ftin(x) { var n = Math.round(x * 16), ft = Math.floor(n / 192), r = (n - ft * 192) / 16; return ft + "' " + frac16(r) + '"'; }

  function mkR(rng) {
    rng = rng || Math.random;
    return {
      int: function (a, b) { return a + Math.floor(rng() * (b - a + 1)); },
      pick: function (arr) { return arr[Math.floor(rng() * arr.length)]; },
      /* a decimal from a to b in steps of 10^-dp */
      dec: function (a, b, dp) { var f = Math.pow(10, dp); return clean((Math.round(a * f) + Math.floor(rng() * (Math.round((b - a) * f) + 1))) / f); }
    };
  }

  /* ---------- answers ---------- */
  function extend(o, more) { if (more) for (var k in more) o[k] = more[k]; return o; }
  function num(q, v, dp, unit, steps, more) {
    return extend({ q: q, kind: 'num', ans: nudge(v), tol: 0.5 * Math.pow(10, -dp) + 1e-9 + Math.abs(v) * 1e-12, unit: unit, dp: dp,
      ansText: fmt(v, dp) + (unit ? ' ' + unit : ''), steps: steps }, more);
  }
  function exact(q, v, unit, steps, more) {
    return extend({ q: q, kind: 'num', ans: clean(v), tol: 1e-9 + Math.abs(v) * 1e-9, unit: unit, exact: true, ansText: trim(v, 8) + (unit ? ' ' + unit : ''), steps: steps }, more);
  }
  function whole(q, v, unit, steps, more) {
    return extend({ q: q, kind: 'int', ans: v, tol: 1e-9, unit: unit, ansText: grp(String(v)) + (unit ? ' ' + unit : ''), steps: steps }, more);
  }
  function len(q, v, unit, steps, more) {
    return extend({ q: q, kind: 'len', ans: v, tol: 1 / 64, unit: unit, ansText: unit === 'NPS' ? 'NPS ' + frac16(v) : inch(v), steps: steps }, more);
  }
  /* Rounding step. The rule is in the title: look at the next digit, and 5 or more rounds up. */
  function roundStep(v, dp, unit) {
    var full = trim(v, Math.max(dp + 3, 6)), r = fmt(v, dp);
    return full === r ? null : { t: 'Round (5 or more rounds up)', m: full + ' → ' + r + (unit ? ' ' + unit : '') };
  }
  function withRound(steps, v, dp, unit) { var s = roundStep(v, dp, unit); return s ? steps.concat([s]) : steps; }

  /* ---------- Module 1: metric prefixes ---------- */
  var LEN = { km: 1000, m: 1, cm: 0.01, mm: 0.001 };
  var VOL = { L: 1, mL: 0.001 };
  var MASS = { t: 1000, kg: 1, g: 0.001 };
  var NAMES = { km: 'kilometres', m: 'metres', cm: 'centimetres', mm: 'millimetres', L: 'litres', mL: 'millilitres', t: 'tonnes', kg: 'kilograms', g: 'grams' };
  function ratio(tab, a, b) { return clean(tab[a] / tab[b]); }
  function places(f) { return Math.round(Math.log(f) / Math.LN10); }
  function prefixSteps(v, a, b, tab) {
    var big = tab[a] > tab[b], f = big ? ratio(tab, a, b) : ratio(tab, b, a), res = clean(big ? v * f : v / f), k = places(f);
    return { res: res, steps: [
      { t: big ? 'Bigger unit to smaller unit, so multiply' : 'Smaller unit to bigger unit, so divide', m: big ? '1 ' + a + ' = ' + grp(String(f)) + ' ' + b : '1 ' + b + ' = ' + grp(String(f)) + ' ' + a },
      { t: (big ? 'Multiply by ' : 'Divide by ') + grp(String(f)) + ', so the decimal point moves ' + k + ' ' + plural(k, 'place', 'places') + (big ? ' right' : ' left'), m: trim(v, 8) + (big ? ' × ' : ' ÷ ') + f + ' = ' + trim(res, 8) + ' ' + b }
    ] };
  }
  function pairTask(id, level, tab, pairs, ctx) {
    return { id: id, level: level,
      make: function (R) {
        var pr = R.pick(pairs), dir = R.int(0, 1), a = dir ? pr[0] : pr[1], b = dir ? pr[1] : pr[0], big = tab[a] > tab[b], v;
        if (big) v = R.pick([R.dec(0.1, 9.9, 1), R.dec(0.05, 9.95, 2), R.dec(0.125, 9.875, 3)]);
        else v = R.int(15, 9500);
        return { v: v, a: a, b: b, c: R.int(0, ctx.length - 1) };
      },
      solve: function (p) {
        var s = prefixSteps(p.v, p.a, p.b, tab);
        return exact(ctx[p.c % ctx.length].replace('{v}', '<b>' + trim(p.v, 8) + ' ' + p.a + '</b>') + ' How many ' + NAMES[p.b] + ' is that?', s.res, p.b, s.steps);
      } };
  }
  var m1 = [
    pairTask('1.1', 1, LEN, [['m', 'mm'], ['m', 'cm'], ['cm', 'mm'], ['km', 'm']], ['A cut list shows {v}.', 'The drawing gives a length of {v}.', 'The site plan shows a run of {v}.']),
    pairTask('1.2', 1, VOL, [['L', 'mL']], ['The cutting fluid jug holds {v}.', 'The test calls for {v} of dye.']),
    pairTask('1.3', 1, MASS, [['kg', 'g'], ['t', 'kg']], ['The scale reads {v}.', 'The delivery slip lists {v}.']),
    { id: '1.4', level: 2,
      make: function (R) { return { a: R.dec(1.05, 2.95, 2), b: R.int(12, 95) * 10 + R.pick([0, 5]), c: R.int(15, 90) }; },
      solve: function (p) {
        var a = clean(p.a * 1000), c = clean(p.c * 10), tot = clean(a + p.b + c);
        return exact('Three pieces of flat bar are laid end to end: <b>' + trim(p.a, 3) + ' m</b>, <b>' + p.b + ' mm</b> and <b>' + p.c + ' cm</b>. What is the total length in millimetres?', tot, 'mm', [
          { t: 'Change metres to millimetres', m: trim(p.a, 3) + ' × 1000 = ' + a + ' mm' },
          { t: 'Change centimetres to millimetres', m: p.c + ' × 10 = ' + c + ' mm' },
          { t: 'Add, now that all three are in millimetres', m: a + ' + ' + p.b + ' + ' + c + ' = ' + grp(String(tot)) + ' mm' }]);
      } },
    { id: '1.5', level: 2,
      make: function (R) { var S = R.pick([6, 6.1, 3, 12]), n = R.int(2, 6), mx = Math.floor(S * 1000 / n) - 50, pc = R.int(Math.max(120, Math.floor(mx / 3)), mx); return { S: S, n: n, pc: pc }; },
      solve: function (p) {
        var L = clean(p.S * 1000), used = p.n * p.pc, left = L - used;
        return exact('A stock length of pipe is <b>' + trim(p.S, 1) + ' m</b>. You cut <b>' + p.n + '</b> pieces, each <b>' + p.pc + ' mm</b> long. Ignore the saw cuts. How many millimetres are left?', left, 'mm', [
          { t: 'Change the stock length to millimetres', m: trim(p.S, 1) + ' × 1000 = ' + L + ' mm' },
          { t: 'Multiply to find the length used', m: p.n + ' × ' + p.pc + ' = ' + used + ' mm' },
          { t: 'Subtract', m: L + ' − ' + used + ' = ' + left + ' mm' }]);
      } },
    { id: '1.6', level: 3,
      make: function (R) { return R.int(0, 1) ? { k: 0, kg: R.pick([11, 15, 18, 20]), g: R.int(35, 140) } : { k: 1, km: R.dec(0.35, 2.4, 2), L: R.pick([6, 3]) }; },
      solve: function (p) {
        if (p.k === 0) {
          var g = clean(p.kg * 1000), raw = g / p.g, n = Math.floor(raw + 1e-9);
          return whole('A spool of welding wire holds <b>' + p.kg + ' kg</b>. Each weld on this job uses <b>' + p.g + ' g</b> of wire. How many whole welds can you make from one spool?', n, 'welds', [
            { t: 'Change kilograms to grams', m: p.kg + ' × 1000 = ' + g + ' g' },
            { t: 'Divide by the grams for one weld', m: g + ' ÷ ' + p.g + ' = ' + trim(raw, 4) },
            { t: 'Only whole welds count, so round down', m: n + ' welds' }]);
        }
        var m = clean(p.km * 1000), raw2 = m / p.L, n2 = Math.ceil(raw2 - 1e-9);
        return whole('A water line is <b>' + trim(p.km, 2) + ' km</b> long. The pipe for this job comes in <b>' + p.L + ' m</b> lengths. How many lengths must you order to cover the run? Ignore the joints.', n2, 'lengths', [
          { t: 'Change kilometres to metres', m: trim(p.km, 2) + ' × 1000 = ' + m + ' m' },
          { t: 'Divide by the length of one piece', m: m + ' ÷ ' + p.L + ' = ' + trim(raw2, 4) },
          { t: Math.abs(n2 - raw2) < 1e-9 ? 'The lengths come out even' : 'A part length still needs a whole piece, so round up', m: n2 + ' lengths' }]);
      } }
  ];

  /* ---------- Module 2: length ---------- */
  function fracDec(w, n, d) { return clean(w + n / d); }
  function fracText(n, d) { var g = gcd(n, d); return (n / g) + '/' + (d / g); }
  /* Round inches to the nearest 1/16, with the steps */
  function to16Steps(x, mmText) {
    var w0 = Math.floor(x + 1e-9), s = (x - w0) * 16, k = Math.round(s + 1e-9), w = w0, n = k, st = [], v;
    if (k === 16) { w = w0 + 1; n = 0; }
    v = w + n / 16;
    st.push({ t: 'Keep the whole inches (' + w0 + '). Change the part left over to sixteenths', m: '(' + mmText + ' − ' + w0 + ') × 16 = ' + trim(s, 2) });
    st.push({ t: 'Round to the nearest whole sixteenth', m: trim(s, 2) + ' → ' + k + '/16' + (k === 16 ? ', a whole inch, so ' + w0 + ' becomes ' + w : k === 0 ? ', so no fraction is left' : (gcd(k, 16) > 1 ? ' = ' + fracText(k, 16) : '')) });
    st.push(n ? { t: 'Put it back together', m: w + ' + ' + n + ' ÷ 16 = ' + trim(v, 4) + ' = ' + inch(v) } : { t: 'Put it back together', m: inch(v) });
    return { v: v, steps: st };
  }
  function avoidHalf(mm) { var s = (mm / 25.4) * 16; return Math.abs(s - Math.floor(s) - 0.5) < 0.02; }
  var m2 = [
    { id: '2.1', level: 1,
      make: function (R) { var d = R.pick([2, 4, 8, 16]), n = R.int(1, d - 1); while (gcd(n, d) !== 1) n = R.int(1, d - 1); return { w: R.int(0, 47), n: n, d: d }; },
      solve: function (p) {
        var x = fracDec(p.w, p.n, p.d), mm = x * 25.4;
        return num('The tape reads <b>' + inch(x) + '</b>. What is that in millimetres? Round to 1 decimal place.', mm, 1, 'mm', withRound([
          { t: 'Change the fraction to a decimal', m: p.n + ' ÷ ' + p.d + ' = ' + trim(p.n / p.d, 4) },
          { t: 'Add the whole inches', m: p.w + ' + ' + trim(p.n / p.d, 4) + ' = ' + trim(x, 4) + ' in' },
          { t: 'Multiply by 25.4 (1 in = 25.4 mm, exact)', m: trim(x, 4) + ' × 25.4 = ' + trim(mm, 4) + ' mm' }], mm, 1, 'mm'));
      } },
    { id: '2.2', level: 1,
      make: function (R) { return { w: R.int(0, 30), n: R.int(1, 15) }; },
      solve: function (p) {
        var x = p.w + p.n / 16, d = trim(p.n / 16, 4);
        return len('A spec sheet gives a dimension of <b>' + trim(x, 4) + ' in</b>. What tape fraction is that? Give it to the nearest 1/16".', x, 'in', [
          { t: 'Split off the whole inches', m: trim(x, 4) + ' = ' + p.w + ' + ' + d },
          { t: 'Multiply the decimal part by 16 to count sixteenths', m: d + ' × 16 = ' + p.n },
          { t: 'Write it as a fraction and reduce', m: p.n + '/16' + (gcd(p.n, 16) > 1 ? ' = ' + fracText(p.n, 16) : '') + ', so the answer is ' + inch(x) },
          { t: 'Check it on the calculator', m: p.w + ' + ' + p.n + ' ÷ 16 = ' + trim(x, 4) }]);
      } },
    { id: '2.3', level: 1,
      make: function (R) { var a = R.int(5, 95) * 5, b = R.int(10, 1200); return { mm: R.int(0, 1) ? a : b }; },
      solve: function (p) {
        var x = p.mm / 25.4;
        return num('A metric drawing shows <b>' + grp(String(p.mm)) + ' mm</b>. What is that in decimal inches? Round to 3 decimal places.', x, 3, 'in', withRound([
          { t: 'Divide by 25.4 (1 in = 25.4 mm)', m: p.mm + ' ÷ 25.4 = ' + trim(x, 6) + ' in' }], x, 3, 'in'));
      } },
    { id: '2.4', level: 2,
      make: function (R) { var mm, i = 0; do { mm = R.int(12, 900); i++; } while (avoidHalf(mm) && i < 50); return { mm: mm }; },
      solve: function (p) {
        var x = p.mm / 25.4, r = to16Steps(x, p.mm + ' ÷ 25.4');
        return len('A metric part is <b>' + p.mm + ' mm</b>. You only have an inch tape. What do you mark, to the nearest 1/16"?', r.v, 'in', [
          { t: 'Divide by 25.4 to get inches', m: p.mm + ' ÷ 25.4 = ' + trim(x, 6) + ' in' }].concat(r.steps));
      } },
    { id: '2.5', level: 2,
      make: function (R) { var d = R.pick([2, 4, 8, 16]), n = R.int(0, d - 1); return { ft: R.int(2, 16), i: R.int(0, 11), n: n, d: d }; },
      solve: function (p) {
        var I = fracDec(p.i, p.n, p.d), x = p.ft * 12 + I, mm = x * 25.4;
        return num('A frame on the drawing is <b>' + ftin(x) + '</b> wide. What is that in millimetres, to the nearest whole millimetre?', mm, 0, 'mm', withRound([
          { t: 'Feet to inches first (multiply), then add the inches', m: p.ft + ' × 12 + ' + trim(I, 4) + ' = ' + trim(x, 4) + ' in' },
          { t: 'Multiply by 25.4', m: trim(x, 4) + ' × 25.4 = ' + trim(mm, 4) + ' mm' }], mm, 0, 'mm'));
      } },
    { id: '2.6', level: 3,
      make: function (R) { var mm, i = 0; do { mm = R.int(320, 6000); i++; } while (avoidHalf(mm) && i < 50); return { mm: mm }; },
      solve: function (p) {
        var x = p.mm / 25.4, r = to16Steps(x, p.mm + ' ÷ 25.4'), n = Math.round(r.v * 16), ft = Math.floor(n / 192), wi = Math.floor(r.v + 1e-9);
        return len('A metric plan gives <b>' + grp(String(p.mm)) + ' mm</b>. Write it in feet and inches to the nearest 1/16".', r.v, 'ft and in', [
          { t: 'Divide by 25.4 to get inches', m: p.mm + ' ÷ 25.4 = ' + trim(x, 6) + ' in' }].concat(r.steps, [
          { t: 'Divide the whole inches by 12 for feet', m: wi + ' ÷ 12 = ' + ft + ' remainder ' + (wi - ft * 12) },
          { t: 'Write feet and inches', m: ftin(r.v) }]), { kind: 'ftin', ansText: ftin(r.v) });
      } },
    { id: '2.7', level: 3,
      make: function (R) { var d = R.pick([2, 4, 8, 16]), n = R.int(0, d - 1); return { ft: R.int(3, 48), i: R.int(0, 11), n: n, d: d }; },
      solve: function (p) {
        var I = fracDec(p.i, p.n, p.d), x = p.ft * 12 + I, m = x * 0.0254;
        return num('A pipe rack run is <b>' + ftin(x) + '</b>. How many metres is that? Round to 3 decimal places.', m, 3, 'm', withRound([
          { t: 'Feet to inches first (multiply), then add the inches', m: p.ft + ' × 12 + ' + trim(I, 4) + ' = ' + trim(x, 4) + ' in' },
          { t: 'Multiply by 0.0254 (1 in = 0.0254 m)', m: trim(x, 4) + ' × 0.0254 = ' + trim(m, 6) + ' m' }], m, 3, 'm'));
      } }
  ];

  /* ---------- Module 3: area and volume ---------- */
  var m3 = [
    { id: '3.1', level: 1,
      make: function (R) { var a = R.pick([R.dec(0.05, 0.95, 2), R.dec(1.1, 4.8, 1), R.dec(0.125, 0.875, 3)]), b = R.int(12, 950) * 1000; return R.int(0, 1) ? { d: 1, v: a } : { d: 0, v: b }; },
      solve: function (p) {
        if (p.d) { var r = clean(p.v * 1e6);
          return exact('A steel plate has an area of <b>' + trim(p.v, 3) + ' m²</b>. What is that in square millimetres?', r, 'mm²', [
            { t: '1 m = 1000 mm, so 1 m² is a square 1000 mm by 1000 mm', m: '1000 × 1000 = 1000000 mm² in 1 m²' },
            { t: 'Multiply', m: trim(p.v, 3) + ' × 1000000 = ' + grp(String(r)) + ' mm²' }]); }
        var r2 = clean(p.v / 1e6);
        return exact('A gasket sheet has an area of <b>' + grp(String(p.v)) + ' mm²</b>. What is that in square metres?', r2, 'm²', [
          { t: '1 m² is a square 1000 mm by 1000 mm', m: '1000 × 1000 = 1000000 mm² in 1 m²' },
          { t: 'Divide', m: p.v + ' ÷ 1000000 = ' + trim(r2, 6) + ' m²' }]);
      } },
    { id: '3.2', level: 1,
      make: function (R) { return { a: R.int(8, 450) }; },
      solve: function (p) {
        var v = p.a * X.FT2_M2;
        return num('A shop floor area is <b>' + p.a + ' ft²</b>. What is that in square metres? Round to 2 decimal places.', v, 2, 'm²', withRound([
          { t: '1 ft = 0.3048 m, so 1 ft² is 0.3048 m by 0.3048 m', m: '0.3048 × 0.3048 = 0.09290304 m²' },
          { t: 'Multiply', m: p.a + ' × 0.09290304 = ' + trim(v, 6) + ' m²' }], v, 2, 'm²'));
      } },
    { id: '3.3', level: 2,
      make: function (R) { var L = R.pick([1220, 2440, 3050, 1500, 3000, R.int(30, 250) * 10]), W = R.pick([610, 1220, 1250, 1500, R.int(20, 120) * 10]); return { L: L, W: W }; },
      solve: function (p) {
        var mm2 = p.L * p.W, v = mm2 / 1e6;
        return num('A sheet is <b>' + grp(String(p.L)) + ' mm</b> by <b>' + grp(String(p.W)) + ' mm</b>. What is its area in square metres? Round to 3 decimal places.', v, 3, 'm²', withRound([
          { t: 'Multiply length by width', m: p.L + ' × ' + p.W + ' = ' + grp(String(mm2)) + ' mm²' },
          { t: 'Divide by 1000000 (1 m² = 1000 × 1000 mm²)', m: mm2 + ' ÷ 1000000 = ' + trim(v, 6) + ' m²' }], v, 3, 'm²'));
      } },
    { id: '3.4', level: 2,
      make: function (R) { var a = R.pick([R.dec(0.2, 9.8, 1), R.dec(0.05, 2.5, 2), R.dec(0.125, 1.5, 3)]), b = R.int(40, 9800); return R.int(0, 1) ? { d: 1, v: a } : { d: 0, v: b }; },
      solve: function (p) {
        if (p.d) { var r = clean(p.v * 1000);
          return exact('A holding tank holds <b>' + trim(p.v, 3) + ' m³</b>. How many litres is that?', r, 'L', [
            { t: 'The litre is 1/1000 of a cubic metre', m: '1 m³ = 1000 L' },
            { t: 'Multiply', m: trim(p.v, 3) + ' × 1000 = ' + grp(String(r)) + ' L' }]); }
        var r2 = clean(p.v / 1000);
        return exact('A tank holds <b>' + grp(String(p.v)) + ' L</b>. How many cubic metres is that?', r2, 'm³', [
          { t: 'The litre is 1/1000 of a cubic metre', m: '1 m³ = 1000 L' },
          { t: 'Divide', m: p.v + ' ÷ 1000 = ' + trim(r2, 6) + ' m³' }]);
      } },
    { id: '3.5', level: 2,
      make: function (R) { var a = R.int(2, 120), b = R.dec(1.5, 40, 1); return { v: R.int(0, 1) ? a : b }; },
      solve: function (p) {
        var r = p.v * X.FT3_L;
        return num('A sump pit holds <b>' + trim(p.v, 1) + ' ft³</b> of water. How many litres is that? Round to 1 decimal place.', r, 1, 'L', withRound([
          { t: '1 ft³ = 0.3048³ m³ = 28.316846592 L (exact)', m: '0.3048 × 0.3048 × 0.3048 × 1000 = 28.316846592 L' },
          { t: 'Multiply', m: trim(p.v, 1) + ' × 28.316846592 = ' + trim(r, 4) + ' L' }], r, 1, 'L'));
      } },
    { id: '3.6', level: 3,
      make: function (R) { return { a: R.int(12, 48), b: R.int(10, 36), c: R.int(12, 60) }; },
      solve: function (p) {
        var in3 = p.a * p.b * p.c, g = in3 / 231;
        return num('A rectangular tank measures <b>' + p.a + ' in</b> by <b>' + p.b + ' in</b> by <b>' + p.c + ' in</b> inside. How many US gallons does it hold? Use 1 US gal = 231 in³. Round to 1 decimal place.', g, 1, 'US gal', withRound([
          { t: 'Multiply the three sides for cubic inches', m: p.a + ' × ' + p.b + ' × ' + p.c + ' = ' + grp(String(in3)) + ' in³' },
          { t: 'Divide by 231', m: in3 + ' ÷ 231 = ' + trim(g, 4) + ' US gal' }], g, 1, 'US gal'));
      } },
    { id: '3.7', level: 3,
      make: function (R) { return { a: R.int(30, 180) * 10, b: R.int(30, 120) * 10, c: R.int(20, 150) * 10 }; },
      solve: function (p) {
        var mm3 = p.a * p.b * p.c, L = mm3 / 1e6;
        return num('A steel box tank is <b>' + grp(String(p.a)) + ' mm</b> by <b>' + grp(String(p.b)) + ' mm</b> by <b>' + grp(String(p.c)) + ' mm</b> inside. How many litres does it hold? Round to 1 decimal place.', L, 1, 'L', withRound([
          { t: 'Multiply the three sides for cubic millimetres', m: p.a + ' × ' + p.b + ' × ' + p.c + ' = ' + grp(String(mm3)) + ' mm³' },
          { t: 'Divide by 1000000 (1 L = 100 × 100 × 100 mm³)', m: mm3 + ' ÷ 1000000 = ' + trim(L, 6) + ' L' }], L, 1, 'L'));
      } },
    { id: '3.8', level: 3,
      make: function (R) { return { a: R.dec(2.4, 12.5, 1), b: R.dec(1.8, 9.5, 1) }; },
      solve: function (p) {
        var m2 = clean(p.a * p.b), f = m2 / X.FT2_M2;
        return num('A room is <b>' + trim(p.a, 1) + ' m</b> by <b>' + trim(p.b, 1) + ' m</b>. The flooring is sold by the square foot. What is the area in ft²? Round to 1 decimal place.', f, 1, 'ft²', withRound([
          { t: 'Area in square metres', m: trim(p.a, 1) + ' × ' + trim(p.b, 1) + ' = ' + trim(m2, 4) + ' m²' },
          { t: 'Divide by 0.09290304 (the m² in 1 ft²)', m: trim(m2, 4) + ' ÷ 0.09290304 = ' + trim(f, 4) + ' ft²' }], f, 1, 'ft²'));
      } }
  ];

  /* ---------- Module 4: liquid volume ---------- */
  function galPick(R, hi) { var a = R.int(1, hi), b = R.dec(0.5, 20, 1); return R.int(0, 1) ? a : b; }
  var m4 = [
    { id: '4.1', level: 1,
      make: function (R) { return { g: galPick(R, 80) }; },
      solve: function (p) { var L = p.g * X.USGAL_L;
        return num('A US spec sheet says the tank holds <b>' + trim(p.g, 1) + ' US gal</b>. How many litres is that? Round to 2 decimal places.', L, 2, 'L', withRound([
          { t: 'Multiply by 3.785411784 (1 US gal = 3.785411784 L, exact)', m: trim(p.g, 1) + ' × 3.785411784 = ' + trim(L, 6) + ' L' }], L, 2, 'L')); } },
    { id: '4.2', level: 1,
      make: function (R) { return { g: galPick(R, 60) }; },
      solve: function (p) { var L = p.g * X.IMPGAL_L;
        return num('An older Canadian boiler manual gives a capacity of <b>' + trim(p.g, 1) + ' imperial gal</b>. How many litres is that? Round to 2 decimal places.', L, 2, 'L', withRound([
          { t: 'Multiply by 4.54609 (1 imperial gal = 4.54609 L, exact)', m: trim(p.g, 1) + ' × 4.54609 = ' + trim(L, 6) + ' L' }], L, 2, 'L')); } },
    { id: '4.3', level: 2,
      make: function (R) { return { L: R.int(5, 400) }; },
      solve: function (p) { var g = p.L / X.USGAL_L;
        return num('A system holds <b>' + p.L + ' L</b>. The treatment chart you are using is in US gallons. How many US gallons is that? Round to 2 decimal places.', g, 2, 'US gal', withRound([
          { t: 'Litres to US gallons, divide by 3.785411784', m: p.L + ' ÷ 3.785411784 = ' + trim(g, 6) + ' US gal' }], g, 2, 'US gal')); } },
    { id: '4.4', level: 2,
      make: function (R) { return { L: R.int(5, 400) }; },
      solve: function (p) { var g = p.L / X.IMPGAL_L;
        return num('A drum holds <b>' + p.L + ' L</b>. How many imperial gallons is that? Round to 2 decimal places.', g, 2, 'imperial gal', withRound([
          { t: 'Litres to imperial gallons, divide by 4.54609', m: p.L + ' ÷ 4.54609 = ' + trim(g, 6) + ' imperial gal' }], g, 2, 'imperial gal')); } },
    { id: '4.5', level: 3,
      make: function (R) { return { g: R.int(5, 250), d: R.int(0, 1) }; },
      solve: function (p) {
        if (p.d) { var L = p.g * X.USGAL_L, i = L / X.IMPGAL_L;
          return num('A US-made water heater holds <b>' + p.g + ' US gal</b>. The customer asks for imperial gallons. How many is that? Go through litres. Round to 2 decimal places.', i, 2, 'imperial gal', withRound([
            { t: 'US gallons to litres', m: p.g + ' × 3.785411784 = ' + trim(L, 8) + ' L' },
            { t: 'Litres to imperial gallons', m: trim(L, 8) + ' ÷ 4.54609 = ' + trim(i, 6) + ' imperial gal' }], i, 2, 'imperial gal')); }
        var L2 = p.g * X.IMPGAL_L, u = L2 / X.USGAL_L;
        return num('An old tank is stamped <b>' + p.g + ' imperial gal</b>. The pump chart is in US gallons. How many US gallons is that? Go through litres. Round to 2 decimal places.', u, 2, 'US gal', withRound([
          { t: 'Imperial gallons to litres', m: p.g + ' × 4.54609 = ' + trim(L2, 8) + ' L' },
          { t: 'Litres to US gallons', m: trim(L2, 8) + ' ÷ 3.785411784 = ' + trim(u, 6) + ' US gal' }], u, 2, 'US gal'));
      } },
    { id: '4.6', level: 3,
      make: function (R) { return { g: R.int(3, 120) }; },
      solve: function (p) { var L = p.g * X.USGAL_L * 60;
        return num('A circulator moves <b>' + p.g + ' US gal per minute</b>. How many litres per hour is that? Round to the nearest whole litre.', L, 0, 'L/h', withRound([
          { t: 'US gallons to litres, then minutes to hours (60 minutes in an hour)', m: p.g + ' × 3.785411784 × 60 = ' + trim(L, 4) + ' L/h' }], L, 0, 'L/h')); } },
    { id: '4.7', level: 3,
      make: function (R) { return { g: R.int(5, 200) }; },
      solve: function (p) { var v = p.g * X.IMPGAL_L / 60;
        return num('An old pump plate reads <b>' + p.g + ' imperial gal per minute</b>. The new spec is in litres per second. How many L/s is that? Round to 2 decimal places.', v, 2, 'L/s', withRound([
          { t: 'Imperial gallons to litres, then per minute to per second (÷ 60)', m: p.g + ' × 4.54609 ÷ 60 = ' + trim(v, 6) + ' L/s' }], v, 2, 'L/s')); } }
  ];

  /* ---------- Module 5: pressure and head ---------- */
  var m5 = [
    { id: '5.1', level: 1,
      make: function (R) { return { p: R.int(5, 200) }; },
      solve: function (p) { var k = p.p * RND.PSI_KPA;
        return num('A pressure gauge reads <b>' + p.p + ' psi</b>. What is that in kPa? Use 1 psi = 6.895 kPa. Round to 1 decimal place.', k, 1, 'kPa', withRound([
          { t: 'Multiply by 6.895', m: p.p + ' × 6.895 = ' + trim(k, 4) + ' kPa' }], k, 1, 'kPa')); } },
    { id: '5.2', level: 1,
      make: function (R) { var a = R.dec(0.5, 16, 1), b = R.int(25, 1600); return R.int(0, 1) ? { d: 1, v: a } : { d: 0, v: b }; },
      solve: function (p) {
        if (p.d) { var k = clean(p.v * 100);
          return exact('A European pump label says <b>' + trim(p.v, 1) + ' bar</b>. What is that in kPa?', k, 'kPa', [
            { t: '1 bar = 100 kPa (exact)', m: trim(p.v, 1) + ' × 100 = ' + grp(String(k)) + ' kPa' }]); }
        var b = clean(p.v / 100);
        return exact('A gauge reads <b>' + grp(String(p.v)) + ' kPa</b>. What is that in bar?', b, 'bar', [
          { t: '1 bar = 100 kPa, so divide by 100', m: p.v + ' ÷ 100 = ' + trim(b, 4) + ' bar' }]);
      } },
    { id: '5.3', level: 1,
      make: function (R) { return { h: R.int(8, 160) }; },
      solve: function (p) { var v = p.h * RND.PSI_PER_FT;
        return num('The water in a riser stands <b>' + p.h + ' ft</b> above a gauge. No water is flowing. What does the gauge read? Use 0.433 psi per foot of head. Round to 1 decimal place.', v, 1, 'psi', withRound([
          { t: 'Multiply the head by 0.433', m: p.h + ' × 0.433 = ' + trim(v, 4) + ' psi' }], v, 1, 'psi')); } },
    { id: '5.4', level: 2,
      make: function (R) { return { p: R.int(5, 90) }; },
      solve: function (p) { var h = p.p * RND.FT_PER_PSI;
        return num('A street main holds <b>' + p.p + ' psi</b> at the meter. How high could that push a column of water with no flow? Use 2.31 ft of head per psi. Round to 1 decimal place.', h, 1, 'ft', withRound([
          { t: 'Multiply the pressure by 2.31', m: p.p + ' × 2.31 = ' + trim(h, 4) + ' ft' }], h, 1, 'ft')); } },
    { id: '5.5', level: 2,
      make: function (R) { return { h: R.dec(2, 60, 1), d: R.int(0, 1) }; },
      solve: function (p) {
        if (p.d) { var k = p.h * RND.KPA_PER_M;
          return num('The top fixture in a building is <b>' + trim(p.h, 1) + ' m</b> above the gauge. What static pressure does that height of water make at the gauge? Use 9.81 kPa per metre of head. Round to 1 decimal place.', k, 1, 'kPa', withRound([
            { t: 'Multiply the head by 9.81', m: trim(p.h, 1) + ' × 9.81 = ' + trim(k, 4) + ' kPa' }], k, 1, 'kPa')); }
        var kp = clean(p.h * 10), h = kp / RND.KPA_PER_M;
        return num('A gauge reads <b>' + trim(kp, 1) + ' kPa</b> with no water flowing. How many metres of water head is that? Use 9.81 kPa per metre. Round to 2 decimal places.', h, 2, 'm', withRound([
          { t: 'Divide the pressure by 9.81', m: trim(kp, 1) + ' ÷ 9.81 = ' + trim(h, 6) + ' m' }], h, 2, 'm'));
      } },
    { id: '5.6', level: 2,
      make: function (R) { return { k: R.int(50, 1400) }; },
      solve: function (p) { var v = p.k / RND.PSI_KPA;
        return num('A metric spec calls for a test pressure of <b>' + grp(String(p.k)) + ' kPa</b>. Your gauge reads in psi. What should it show? Use 1 psi = 6.895 kPa. Round to 1 decimal place.', v, 1, 'psi', withRound([
          { t: 'kPa to psi, divide by 6.895', m: p.k + ' ÷ 6.895 = ' + trim(v, 4) + ' psi' }], v, 1, 'psi')); } },
    { id: '5.7', level: 3,
      make: function (R) { return { g: R.int(200, 600), h: R.dec(3, 18, 1) }; },
      solve: function (p) { var v = p.g - p.h * RND.KPA_PER_M;
        return num('A gauge in the basement reads <b>' + p.g + ' kPa</b> with no water flowing. What will a gauge read on a floor <b>' + trim(p.h, 1) + ' m</b> higher? Use 9.81 kPa per metre. Round to 1 decimal place.', v, 1, 'kPa', withRound([
          { t: 'The higher gauge has less water above it. BEDMAS says multiply before you subtract', m: p.g + ' − ' + trim(p.h, 1) + ' × 9.81 = ' + trim(v, 4) + ' kPa' }], v, 1, 'kPa')); } },
    { id: '5.8', level: 3,
      make: function (R) { return { g: R.int(45, 90), h: R.int(10, 80) }; },
      solve: function (p) { var v = p.g - p.h * RND.PSI_PER_FT;
        return num('Street pressure at the meter is <b>' + p.g + ' psi</b> with no flow. The highest shower head is <b>' + p.h + ' ft</b> above the meter. What is the static pressure there? Use 0.433 psi per foot. Round to 1 decimal place.', v, 1, 'psi', withRound([
          { t: 'BEDMAS says work out the head loss (multiply) before you subtract', m: p.g + ' − ' + p.h + ' × 0.433 = ' + trim(v, 4) + ' psi' }], v, 1, 'psi')); } },
    { id: '5.9', level: 3,
      make: function (R) { var a = R.dec(1, 16, 1), b = R.int(2, 25); return { b: R.int(0, 1) ? a : b }; },
      solve: function (p) { var v = p.b * 100 / RND.PSI_KPA;
        return num('A pressure relief valve is stamped <b>' + trim(p.b, 1) + ' bar</b>. What is that in psi? Use 1 bar = 100 kPa and 1 psi = 6.895 kPa. Round to 1 decimal place.', v, 1, 'psi', withRound([
          { t: 'Bar to kPa (× 100), then kPa to psi (÷ 6.895), left to right', m: trim(p.b, 1) + ' × 100 ÷ 6.895 = ' + trim(v, 4) + ' psi' }], v, 1, 'psi')); } }
  ];

  /* ---------- Module 6: temperature ---------- */
  /* xkeys: extra key sequences with the +⇄− key, for steps the written-expression reader cannot key (a minus number) */
  function negKeys(o, seq, expect, label) { o.xkeys = [{ label: label, seq: seq, expect: expect }]; return o; }
  var m6 = [
    { id: '6.1', level: 1,
      make: function (R) { return { c: R.int(1, 120) }; },
      solve: function (p) { var f = 1.8 * p.c + 32;
        return num('A tank thermometer reads <b>' + p.c + ' °C</b>. What is that in °F? Round to 1 decimal place.', f, 1, '°F', withRound([
          { t: 'The formula', m: '°F = 1.8 × °C + 32' },
          { t: 'BEDMAS says multiply first, then add', m: '1.8 × ' + p.c + ' + 32 = ' + trim(f, 4) + ' °F' }], f, 1, '°F')); } },
    { id: '6.2', level: 1,
      make: function (R) { return { f: R.int(40, 250) }; },
      solve: function (p) { var c = (p.f - 32) / 1.8;
        return num('A US pump manual gives a maximum water temperature of <b>' + p.f + ' °F</b>. What is that in °C? Round to 1 decimal place.', c, 1, '°C', withRound([
          { t: 'The formula', m: '°C = (°F − 32) ÷ 1.8' },
          { t: 'BEDMAS says brackets first, then divide', m: '(' + p.f + ' − 32) ÷ 1.8 = ' + trim(c, 4) + ' °C' }], c, 1, '°C')); } },
    { id: '6.3', level: 2,
      make: function (R) { var f = -R.int(1, 40), c = -R.int(1, 45); return R.int(0, 1) ? { d: 0, f: f } : { d: 1, c: c }; },
      solve: function (p) {
        if (p.d === 0) { var c = (p.f - 32) / 1.8, a = -p.f;
          return negKeys(num('A cold-weather spec for pipe insulation lists <b>' + fmt(p.f, 0) + ' °F</b>. What is that in °C? Round to 1 decimal place.', c, 1, '°C', withRound([
            { t: 'The formula', m: '°C = (°F − 32) ÷ 1.8' },
            { t: 'Brackets first. ' + fmt(p.f, 0) + ' − 32 goes 32 further below zero', m: a + ' + 32 = ' + (a + 32) + ', so ' + fmt(p.f, 0) + ' − 32 = ' + fmt(p.f - 32, 0) },
            { t: 'Then divide. A minus number divided by 1.8 stays minus', m: (a + 32) + ' ÷ 1.8 = ' + trim(-c, 4) + ', so the answer is ' + trim(c, 4) + ' °C' }], c, 1, '°C')),
            '( -' + a + ' − 32 ) ÷ 1.8 =', c, 'With the +⇄− key for the minus sign'); }
        var f = 1.8 * p.c + 32, b = -p.c, m = 1.8 * b;
        return negKeys(num('Overnight the shop drops to <b>' + fmt(p.c, 0) + ' °C</b>. What is that in °F? Round to 1 decimal place.', f, 1, '°F', withRound([
          { t: 'The formula', m: '°F = 1.8 × °C + 32' },
          { t: 'BEDMAS says multiply first. A minus number times 1.8 stays minus', m: '1.8 × ' + b + ' = ' + trim(m, 4) + ', so 1.8 × ' + fmt(p.c, 0) + ' = ' + trim(-m, 4) },
          { t: 'Then add 32. Adding 32 to ' + trim(-m, 4) + ' is the same as 32 − ' + trim(m, 4), m: '32 − ' + trim(m, 4) + ' = ' + trim(f, 4) + ' °F' }], f, 1, '°F')),
          '1.8 × -' + b + ' + 32 =', f, 'With the +⇄− key for the minus sign');
      } },
    { id: '6.4', level: 2,
      make: function (R) { return { a: R.int(5, 40), b: R.int(10, 70) }; },
      solve: function (p) { var lo = p.a, hi = p.a + p.b, d = (hi - lo) * 1.8;
        return num('A heating loop warms from <b>' + lo + ' °C</b> to <b>' + hi + ' °C</b>. The expansion chart wants the temperature rise in °F. What is the rise in °F? Round to 1 decimal place.', d, 1, '°F', withRound([
          { t: 'Find the rise in °C', m: hi + ' − ' + lo + ' = ' + (hi - lo) + ' °C' },
          { t: 'A change of 1 °C is a change of 1.8 °F. A difference gets no + 32', m: (hi - lo) + ' × 1.8 = ' + trim(d, 4) + ' °F' }], d, 1, '°F')); } },
    { id: '6.5', level: 3,
      make: function (R) { var hi = R.int(100, 200); return { hi: hi, lo: hi - R.int(8, 60) }; },
      solve: function (p) { var d = (p.hi - p.lo) / 1.8;
        return num('Water leaves the heater at <b>' + p.hi + ' °F</b> and reaches the far tap at <b>' + p.lo + ' °F</b>. How many degrees Celsius cooler is it at the tap? Round to 1 decimal place.', d, 1, '°C', withRound([
          { t: 'Find the drop in °F', m: p.hi + ' − ' + p.lo + ' = ' + (p.hi - p.lo) + ' °F' },
          { t: 'It is a difference, so divide by 1.8 and do not subtract 32', m: (p.hi - p.lo) + ' ÷ 1.8 = ' + trim(d, 4) + ' °C' }], d, 1, '°C')); } }
  ];

  /* ---------- Module 7: slope and grade ---------- */
  var m7 = [
    { id: '7.1', level: 1,
      make: function (R) { return { n: R.pick([25, 40, 50, 60, 68, 75, 100, 133, 200, 400]) }; },
      solve: function (p) { var v = 100 / p.n;
        return num('A drain is laid at a slope of <b>1 in ' + p.n + '</b>. What is that as a percent grade? Round to 2 decimal places.', v, 2, '%', withRound([
          { t: '1 in ' + p.n + ' means 1 unit down for every ' + p.n + ' units along', m: 'grade = fall ÷ run × 100' },
          { t: 'Divide, then multiply, left to right', m: '1 ÷ ' + p.n + ' × 100 = ' + trim(v, 4) + '%' }], v, 2, '%')); } },
    { id: '7.2', level: 1,
      make: function (R) { var a = R.dec(0.5, 5, 1), b = R.dec(0.25, 4, 2); return { g: R.int(0, 1) ? a : b }; },
      solve: function (p) { var v = clean(p.g * 10);
        return exact('A grade of <b>' + trim(p.g, 2) + '%</b> is shown on a metric drawing. How many millimetres of fall is that per metre of run?', v, 'mm per m', [
          { t: 'Percent means per 100. 1 m = 1000 mm, so take that percent of 1000 mm', m: trim(p.g, 2) + ' ÷ 100 × 1000 = ' + trim(v, 4) + ' mm per m' }]); } },
    { id: '7.3', level: 2,
      make: function (R) { return R.pick([{ n: 1, d: 8 }, { n: 3, d: 16 }, { n: 1, d: 4 }, { n: 3, d: 8 }, { n: 1, d: 2 }, { n: 1, d: 16 }]); },
      solve: function (p) { var x = p.n / p.d, v = x / 12 * 100;
        return num('The drawing calls for <b>' + p.n + '/' + p.d + '" per foot</b> of fall. What percent grade is that? Round to 2 decimal places.', v, 2, '%', withRound([
          { t: 'The fraction as a decimal', m: p.n + ' ÷ ' + p.d + ' = ' + trim(x, 4) + ' in' },
          { t: '1 ft = 12 in. Fall ÷ run with both in inches, then × 100', m: trim(x, 4) + ' ÷ 12 × 100 = ' + trim(v, 4) + '%' }], v, 2, '%')); } },
    { id: '7.4', level: 2,
      make: function (R) { return { L: R.dec(2, 45, 1), g: R.pick([1, 1.5, 2, 2.5, 3, 4]) }; },
      solve: function (p) { var mm = clean(p.L * 1000), f = mm * p.g / 100;
        return num('A run of drain is <b>' + trim(p.L, 1) + ' m</b> long at a grade of <b>' + trim(p.g, 1) + '%</b>. How much does it fall, in millimetres? Round to 1 decimal place.', f, 1, 'mm', withRound([
          { t: 'Change the run to millimetres', m: trim(p.L, 1) + ' × 1000 = ' + mm + ' mm' },
          { t: 'Take the percent of the run', m: mm + ' × ' + trim(p.g, 1) + ' ÷ 100 = ' + trim(f, 4) + ' mm' }], f, 1, 'mm')); } },
    { id: '7.5', level: 2,
      make: function (R) { return { n: R.pick([25, 40, 48, 50, 60, 96, 100, 200]) }; },
      solve: function (p) { var v = 12 / p.n;
        return num('A slope of <b>1 in ' + p.n + '</b> is given. Your level reads in inches per foot. How many inches of fall per foot is that? Round to 3 decimal places.', v, 3, 'in per ft', withRound([
          { t: 'Over 1 ft (12 in) of run, the fall is 12 ÷ ' + p.n, m: '12 ÷ ' + p.n + ' = ' + trim(v, 6) + ' in per ft' }], v, 3, 'in per ft')); } },
    { id: '7.6', level: 3,
      make: function (R) { return { a: R.pick([0.5, 1, 1.15, 1.2, 1.5, 2, 2.5, 3, 5]) }; },
      solve: function (p) { var v = 100 * Math.tan(p.a * Math.PI / 180);
        return num('A laser level shows a pipe at <b>' + trim(p.a, 2) + '°</b> below horizontal. What percent grade is that? Round to 2 decimal places.', v, 2, '%', withRound([
          { t: 'Rise ÷ run is the tangent of the angle. Calculator in DEG mode', m: 'tan ' + trim(p.a, 2) + '° = ' + sig(v / 100, 8) },
          { t: 'Grade = rise ÷ run × 100', m: '100 × ' + sig(v / 100, 8) + ' = ' + trim(v, 4) + '%' }], v, 2, '%'), { xkeys: [{ label: 'With the TAN key (DEG mode)', seq: '100 × ' + trim(p.a, 2) + ' TAN =', expect: v }] }); } },
    { id: '7.7', level: 3,
      make: function (R) { var s = R.pick([{ n: 1, d: 8 }, { n: 1, d: 4 }, { n: 3, d: 16 }, { n: 1, d: 2 }]); return { L: R.int(6, 80), n: s.n, d: s.d }; },
      solve: function (p) { var x = p.n / p.d, fin = p.L * x, mm = fin * 25.4;
        return num('A drain runs <b>' + p.L + ' ft</b> at <b>' + p.n + '/' + p.d + '" per foot</b>. The invert elevations on the drawing are in millimetres. How many millimetres does the drain fall? Round to 1 decimal place.', mm, 1, 'mm', withRound([
          { t: 'Fall in inches = run × fall per foot', m: p.L + ' × ' + p.n + ' ÷ ' + p.d + ' = ' + trim(fin, 4) + ' in' },
          { t: 'Inches to millimetres', m: trim(fin, 4) + ' × 25.4 = ' + trim(mm, 4) + ' mm' }], mm, 1, 'mm')); } },
    { id: '7.8', level: 3,
      make: function (R) { return { f: R.int(20, 400), L: R.dec(1.5, 20, 1) }; },
      solve: function (p) { var mm = clean(p.L * 1000), v = p.f / mm * 100, ok = v >= 2 - 1e-9;
        return num('You measure a fall of <b>' + p.f + ' mm</b> over a run of <b>' + trim(p.L, 1) + ' m</b>. What is the percent grade? Round to 2 decimal places.', v, 2, '%', withRound([
          { t: 'Run in millimetres, so both are in the same unit', m: trim(p.L, 1) + ' × 1000 = ' + mm + ' mm' },
          { t: 'Grade = fall ÷ run × 100', m: p.f + ' ÷ ' + mm + ' × 100 = ' + trim(v, 4) + '%' },
          { t: 'Compare with 1 in 50 (2%)', m: ok ? 'At least 2%, so it is at least as steep as 1 in 50' : 'Less than 2%, so it is flatter than 1 in 50' }], v, 2, '%')); } }
  ];

  /* ---------- Module 8: mass and weight ---------- */
  function matPick(R) { return R.pick(['steel', 'steel', 'aluminum', 'copper']); }
  var m8 = [
    { id: '8.1', level: 1,
      make: function (R) { var a = R.int(2, 900), b = R.dec(0.5, 50, 1); return { lb: R.int(0, 1) ? a : b }; },
      solve: function (p) { var v = p.lb * X.LB_KG;
        return num('A crate is marked <b>' + trim(p.lb, 1) + ' lb</b>. What is its mass in kilograms? Round to 2 decimal places.', v, 2, 'kg', withRound([
          { t: 'Multiply by 0.45359237 (1 lb = 0.45359237 kg, exact)', m: trim(p.lb, 1) + ' × 0.45359237 = ' + trim(v, 6) + ' kg' }], v, 2, 'kg')); } },
    { id: '8.2', level: 1,
      make: function (R) { var a = R.int(2, 900), b = R.dec(0.5, 50, 1); return { kg: R.int(0, 1) ? a : b }; },
      solve: function (p) { var v = p.kg / X.LB_KG;
        return num('A valve body has a mass of <b>' + trim(p.kg, 1) + ' kg</b>. The rigging chart is in pounds. What is that in pounds? Round to 1 decimal place.', v, 1, 'lb', withRound([
          { t: 'Divide by 0.45359237 (the kilograms in 1 lb)', m: trim(p.kg, 1) + ' ÷ 0.45359237 = ' + trim(v, 4) + ' lb' }], v, 1, 'lb')); } },
    { id: '8.3', level: 2,
      make: function (R) { return { n: R.int(2, 12), lb: R.int(15, 250) }; },
      solve: function (p) { var t = p.n * p.lb, v = t * X.LB_KG;
        return num('A lift has <b>' + p.n + '</b> pieces of pipe at <b>' + p.lb + ' lb</b> each. What is the total in kilograms? Round to 1 decimal place.', v, 1, 'kg', withRound([
          { t: 'Total pounds', m: p.n + ' × ' + p.lb + ' = ' + t + ' lb' },
          { t: 'Pounds to kilograms', m: t + ' × 0.45359237 = ' + trim(v, 4) + ' kg' }], v, 1, 'kg')); } },
    { id: '8.4', level: 2,
      make: function (R) { return { m: matPick(R), L: R.int(20, 300) * 10, W: R.int(10, 150) * 10, t: R.pick([3, 5, 6, 8, 10, 12, 16, 20, 25]) }; },
      solve: function (p) { var D = DENS[p.m], a = p.L / 1000, b = p.W / 1000, c = p.t / 1000, vol = a * b * c, kg = vol * D.kgm3;
        return num('A ' + D.name + ' plate is <b>' + grp(String(p.L)) + ' mm</b> by <b>' + grp(String(p.W)) + ' mm</b> by <b>' + p.t + ' mm</b> thick. Use <b>' + grp(String(D.kgm3)) + ' kg/m³</b> for ' + D.name + '. What is its mass? Round to 2 decimal places.', kg, 2, 'kg', withRound([
          { t: 'Change each size to metres (÷ 1000), because the density is per cubic metre', m: trim(a, 3) + ' m, ' + trim(b, 3) + ' m, ' + trim(c, 3) + ' m' },
          { t: 'Volume = length × width × thickness', m: trim(a, 3) + ' × ' + trim(b, 3) + ' × ' + trim(c, 3) + ' = ' + sig(vol, 10) + ' m³' },
          { t: 'Mass = volume × density', m: sig(vol, 10) + ' × ' + D.kgm3 + ' = ' + trim(kg, 4) + ' kg' }], kg, 2, 'kg')); } },
    { id: '8.5', level: 2,
      make: function (R) { return { L: R.int(40, 1200) }; },
      solve: function (p) { var lb = p.L / X.LB_KG;
        return num('A tank holds <b>' + grp(String(p.L)) + ' L</b> of water. The hoist chart is in pounds. Use 1 kg of water per litre. About how many pounds does the water weigh? Round to 1 decimal place.', lb, 1, 'lb', withRound([
          { t: 'Litres of water to kilograms (1 kg per litre)', m: grp(String(p.L)) + ' L of water ≈ ' + grp(String(p.L)) + ' kg' },
          { t: 'Kilograms to pounds', m: p.L + ' ÷ 0.45359237 = ' + trim(lb, 4) + ' lb' }], lb, 1, 'lb')); } },
    { id: '8.6', level: 3,
      make: function (R) { var d = R.pick([4, 8, 16]), n = R.pick([1, 3]); return { m: matPick(R), a: R.int(12, 96), b: R.int(6, 48), n: n, d: d }; },
      solve: function (p) { var D = DENS[p.m], t = p.n / p.d, a = p.a * 0.0254, b = p.b * 0.0254, c = t * 0.0254, vol = a * b * c, kg = vol * D.kgm3, lb = kg / X.LB_KG;
        return num('A ' + D.name + ' plate is <b>' + p.a + ' in</b> by <b>' + p.b + ' in</b> by <b>' + inch(t) + '</b> thick. Use <b>' + grp(String(D.kgm3)) + ' kg/m³</b> for ' + D.name + '. What does it weigh in pounds? Round to 1 decimal place.', lb, 1, 'lb', withRound([
          { t: 'Each size in metres (1 in = 0.0254 m)', m: p.a + ' × 0.0254 = ' + trim(a, 6) + ' m, ' + p.b + ' × 0.0254 = ' + trim(b, 6) + ' m, ' + trim(t, 4) + ' × 0.0254 = ' + trim(c, 8) + ' m' },
          { t: 'Volume = length × width × thickness', m: trim(a, 6) + ' × ' + trim(b, 6) + ' × ' + trim(c, 8) + ' = ' + sig(vol, 10) + ' m³' },
          { t: 'Mass in kilograms = volume × density', m: sig(vol, 10) + ' × ' + D.kgm3 + ' = ' + trim(kg, 8) + ' kg' },
          { t: 'Kilograms to pounds', m: trim(kg, 8) + ' ÷ 0.45359237 = ' + trim(lb, 4) + ' lb' }], lb, 1, 'lb')); } },
    { id: '8.7', level: 3,
      make: function (R) { return { cap: R.pick([500, 1000, 1500, 2000, 3000]), lb: R.int(40, 450) }; },
      solve: function (p) { var lbs = p.cap / X.LB_KG, raw = lbs / p.lb, n = Math.floor(raw + 1e-9);
        return whole('A sling is rated for <b>' + grp(String(p.cap)) + ' kg</b>. Each piece of pipe weighs <b>' + p.lb + ' lb</b>. How many whole pieces can it lift without going over the rating?', n, 'pieces', [
          { t: 'Change the rating to pounds', m: p.cap + ' ÷ 0.45359237 = ' + trim(lbs, 4) + ' lb' },
          { t: 'Divide by the weight of one piece', m: trim(lbs, 4) + ' ÷ ' + p.lb + ' = ' + trim(raw, 4) },
          { t: 'Never go over the rating, so round down', m: n + ' pieces' }]); } }
  ];

  /* ---------- Module 9: pipe sizes ---------- */
  function excerpt(R, i) { var a = Math.max(0, Math.min(NPS.length - 4, i - R.int(0, 3))); return NPS.slice(a, a + 4).map(function (r) { return 'NPS ' + r.nps + ' = DN ' + r.dn; }).join(', '); }
  var ODKEYS = Object.keys(OD);
  function idxOf(nps) { for (var i = 0; i < NPS.length; i++) if (NPS[i].nps === nps) return i; return -1; }
  var m9 = [
    { id: '9.1', level: 1,
      make: function (R) { var i = R.int(3, 16); return { i: i, ex: excerpt(R, i) }; },
      solve: function (p) { var r = NPS[p.i];
        return whole('From the NPC 2025 NPS to DN chart: ' + p.ex + '. A Canadian drawing calls for <b>NPS ' + r.nps + '</b>. What DN is that on a metric drawing?', r.dn, '', [
          { t: 'Find NPS ' + r.nps + ' in the NPS column and read across', m: 'NPS ' + r.nps + ' = DN ' + r.dn },
          { t: 'Do not multiply by 25.4. DN is a size name from the chart', m: 'DN ' + r.dn }], { ansText: 'DN ' + r.dn, lookup: true }); } },
    { id: '9.2', level: 1,
      make: function (R) { var i = R.int(3, 16); return { i: i, ex: excerpt(R, i) }; },
      solve: function (p) { var r = NPS[p.i];
        return len('From the NPC 2025 NPS to DN chart: ' + p.ex + '. A metric spec lists <b>DN ' + r.dn + '</b> pipe. What NPS do you order?', r.v, 'NPS', [
          { t: 'Find DN ' + r.dn + ' in the DN column and read across', m: 'DN ' + r.dn + ' = NPS ' + r.nps }], { lookup: true, tol: 1e-6 }); } },
    { id: '9.3', level: 2,
      make: function (R) { return { k: R.pick(ODKEYS) }; },
      solve: function (p) { var od = OD[p.k], x = od / 25.4;
        return num('A steel pipe table lists the outside diameter of <b>NPS ' + p.k + '</b> steel pipe as <b>' + trim(od, 1) + ' mm</b>. What is that in inches? Round to 3 decimal places.', x, 3, 'in', withRound([
          { t: 'Divide by 25.4', m: trim(od, 1) + ' ÷ 25.4 = ' + trim(x, 6) + ' in' },
          { t: 'Compare with the name', m: 'NPS ' + p.k + ' is the size name. The pipe measures about ' + trim(x, 2) + ' in across the outside.' }], x, 3, 'in')); } },
    { id: '9.4', level: 2,
      make: function (R) { return { k: R.pick(ODKEYS.slice(0, 12)) }; },
      solve: function (p) { var od = OD[p.k], n = NPS[idxOf(p.k)].v, nm = clean(n * 25.4), d = clean(od - nm);
        return num('The outside diameter of <b>NPS ' + p.k + '</b> steel pipe is <b>' + trim(od, 1) + ' mm</b>. A new apprentice thinks the pipe should be ' + p.k + ' in across. By how many millimetres is the real outside diameter bigger than ' + p.k + ' in? Round to 1 decimal place.', d, 1, 'mm', withRound([
          { t: 'The size name in millimetres', m: trim(n, 3) + ' × 25.4 = ' + trim(nm, 3) + ' mm' },
          { t: 'Subtract from the real outside diameter', m: trim(od, 1) + ' − ' + trim(nm, 3) + ' = ' + trim(d, 3) + ' mm' }], d, 1, 'mm')); } },
    { id: '9.5', level: 3,
      make: function (R) { var i = R.int(5, 13); return { i: i, m: R.dec(8, 120, 1), L: R.pick([10, 20, 21]) }; },
      solve: function (p) { var r = NPS[p.i], ft = p.m / 0.3048, raw = ft / p.L, n = Math.ceil(raw - 1e-9);
        return whole('A metric spec calls for <b>' + trim(p.m, 1) + ' m</b> of <b>DN ' + r.dn + '</b> pipe (NPS ' + r.nps + '). Your supplier sells it in <b>' + p.L + ' ft</b> lengths. How many lengths do you order? Ignore the joints.', n, 'lengths', [
          { t: 'Metres to feet, divide by 0.3048', m: trim(p.m, 1) + ' ÷ 0.3048 = ' + trim(ft, 4) + ' ft' },
          { t: 'Divide by the length of one piece', m: trim(ft, 4) + ' ÷ ' + p.L + ' = ' + trim(raw, 4) },
          { t: Math.abs(n - raw) < 1e-9 ? 'It comes out even' : 'A part length still needs a whole piece, so round up', m: n + ' lengths' }]); } }
  ];

  /* ---------- Module 10: mixed trade problems ---------- */
  var m10 = [
    { id: '10.1', level: 2,
      make: function (R) { return { d: R.pick([15.8, 20.9, 26.6, 35.1, 40.9, 52.5, 62.7, 77.9]), L: R.int(5, 60) }; },
      solve: function (p) { var r = p.d / 2, rm = r / 1000, v = Math.PI * rm * rm * p.L, L = v * 1000;
        return num('A pipe has an inside diameter of <b>' + trim(p.d, 1) + ' mm</b> and is <b>' + p.L + ' m</b> long. How many litres does it hold when full? Use the π key. Round to 1 decimal place.', L, 1, 'L', withRound([
          { t: 'Radius is half the diameter', m: trim(p.d, 1) + ' ÷ 2 = ' + trim(r, 3) + ' mm' },
          { t: 'Radius in metres (÷ 1000), so the volume comes out in m³', m: trim(r, 3) + ' ÷ 1000 = ' + trim(rm, 6) + ' m' },
          { t: 'Volume = π × r² × length. BEDMAS says square the radius first', m: 'π × ' + trim(rm, 6) + '² × ' + p.L + ' = ' + trim(v, 8) + ' m³' },
          { t: 'Cubic metres to litres', m: trim(v, 8) + ' × 1000 = ' + trim(L, 4) + ' L' }], L, 1, 'L')); } },
    { id: '10.2', level: 2,
      make: function (R) { return { q: R.dec(0.2, 15, 1) }; },
      solve: function (p) { var g = p.q * 60 / X.USGAL_L;
        return num('A metric pump curve shows <b>' + trim(p.q, 1) + ' L/s</b>. Your flow meter reads US gallons per minute. What should it read? Round to 1 decimal place.', g, 1, 'US gpm', withRound([
          { t: 'Per second to per minute (× 60), then litres to US gallons (÷ 3.785411784)', m: trim(p.q, 1) + ' × 60 ÷ 3.785411784 = ' + trim(g, 4) + ' US gpm' }], g, 1, 'US gpm')); } },
    { id: '10.3', level: 3,
      make: function (R) { return { a: R.dec(2, 8, 1), b: R.dec(1.5, 5, 1), c: R.dec(1.5, 4, 1) }; },
      solve: function (p) { var ft3 = clean(p.a * p.b * p.c), L = ft3 * X.FT3_L;
        return num('A rectangular water tank is <b>' + trim(p.a, 1) + ' ft</b> by <b>' + trim(p.b, 1) + ' ft</b> by <b>' + trim(p.c, 1) + ' ft</b> inside. Use 1 kg of water per litre. About how many kilograms of water does it hold when full? Round to 1 decimal place.', L, 1, 'kg', withRound([
          { t: 'Volume in cubic feet', m: trim(p.a, 1) + ' × ' + trim(p.b, 1) + ' × ' + trim(p.c, 1) + ' = ' + trim(ft3, 4) + ' ft³' },
          { t: 'Cubic feet to litres (1 ft³ = 28.316846592 L)', m: trim(ft3, 4) + ' × 28.316846592 = ' + trim(L, 4) + ' L' },
          { t: 'Litres of water to kilograms', m: trim(L, 4) + ' L ≈ ' + trim(L, 4) + ' kg' }], L, 1, 'kg')); } },
    { id: '10.4', level: 3,
      make: function (R) { return { h: R.dec(3, 40, 1) }; },
      solve: function (p) { var k = p.h * RND.KPA_PER_M, v = k / RND.PSI_KPA;
        return num('The top of a sprinkler riser is <b>' + trim(p.h, 1) + ' m</b> above the gauge. With no flow, how many psi does that height of water add at the gauge? Use 9.81 kPa per metre and 1 psi = 6.895 kPa. Round to 1 decimal place.', v, 1, 'psi', withRound([
          { t: 'Head to kPa', m: trim(p.h, 1) + ' × 9.81 = ' + trim(k, 4) + ' kPa' },
          { t: 'kPa to psi', m: trim(k, 4) + ' ÷ 6.895 = ' + trim(v, 4) + ' psi' }], v, 1, 'psi')); } },
    { id: '10.5', level: 3,
      make: function (R) { var s = R.pick([{ n: 1, d: 8 }, { n: 1, d: 4 }, { n: 3, d: 16 }]); return { L: R.dec(3, 40, 1), n: s.n, d: s.d }; },
      solve: function (p) { var mm = clean(p.L * 1000), f = mm * p.n / p.d / 12;
        return num('The metric plan shows a <b>' + trim(p.L, 1) + ' m</b> run. The spec calls for <b>' + p.n + '/' + p.d + '" per foot</b> of fall. How many millimetres does the run fall? Round to 1 decimal place.', f, 1, 'mm', withRound([
          { t: 'Inches of fall per 12 inches of run is a ratio with no units, so it works on millimetres too', m: p.n + ' ÷ ' + p.d + ' ÷ 12 = ' + trim(p.n / p.d / 12, 6) },
          { t: 'Run in millimetres', m: trim(p.L, 1) + ' × 1000 = ' + mm + ' mm' },
          { t: 'Fall = run × ratio, worked left to right', m: mm + ' × ' + p.n + ' ÷ ' + p.d + ' ÷ 12 = ' + trim(f, 4) + ' mm' }], f, 1, 'mm')); } },
    { id: '10.6', level: 3,
      make: function (R) { return { w: R.pick([25, 38, 40, 50, 65, 75, 100, 150]), t: R.pick([3, 5, 6, 8, 10, 12]) }; },
      solve: function (p) { var a = p.w / 1000, b = p.t / 1000, kgm = a * b * DENS.steel.kgm3, lbft = kgm * 0.3048 / X.LB_KG;
        return num('Steel flat bar is <b>' + p.w + ' mm</b> wide and <b>' + p.t + ' mm</b> thick. Use <b>7,850 kg/m³</b> for steel. How many pounds does one foot of it weigh? Round to 2 decimal places.', lbft, 2, 'lb per ft', withRound([
          { t: 'Mass of 1 m of bar = width × thickness × 1 m × density, sizes in metres', m: trim(a, 3) + ' × ' + trim(b, 3) + ' × 7850 = ' + trim(kgm, 6) + ' kg per m' },
          { t: 'Per metre to per foot (× 0.3048), then kilograms to pounds (÷ 0.45359237)', m: trim(kgm, 6) + ' × 0.3048 ÷ 0.45359237 = ' + trim(lbft, 6) + ' lb per ft' }], lbft, 2, 'lb per ft')); } },
    { id: '10.7', level: 3,
      make: function (R) { return { A: R.int(20, 400), c: R.pick([250, 300, 350, 400]) }; },
      solve: function (p) { var ft2 = p.A / X.FT2_M2, raw = ft2 / p.c, n = Math.ceil(raw - 1e-9);
        return whole('The walls to be coated are <b>' + p.A + ' m²</b>. The coating label says one US gallon covers <b>' + p.c + ' ft²</b>. How many whole gallons do you buy?', n, 'US gal', [
          { t: 'Square metres to square feet', m: p.A + ' ÷ 0.09290304 = ' + trim(ft2, 4) + ' ft²' },
          { t: 'Divide by the coverage of one gallon', m: trim(ft2, 4) + ' ÷ ' + p.c + ' = ' + trim(raw, 4) },
          { t: Math.abs(n - raw) < 1e-9 ? 'It comes out even' : 'A part gallon is still a whole can, so round up', m: n + ' US gal' }]); } }
  ];

  var MODULES = [
    { n: 1, key: 'u1', title: 'Metric prefixes', short: 'mm, cm, m, km, mL and L, g, kg and t',
      why: 'Metric drawings, cut lists and labels move between millimetres, metres and kilometres, millilitres and litres, grams and kilograms. Each step is a power of ten, so the decimal point just moves.',
      exTask: '1.4', exParams: { a: 1.25, b: 450, c: 38 }, tasks: m1 },
    { n: 2, key: 'u2', title: 'Length: inches, feet and millimetres', short: 'Tape fractions, feet and inches, decimal inches',
      why: 'You read an inch tape to the nearest sixteenth, but the drawing may be metric. 1 in = 25.4 mm exactly, so the change is one multiply or one divide.',
      exTask: '2.4', exParams: { mm: 200 }, tasks: m2 },
    { n: 3, key: 'u3', title: 'Area and volume', short: 'Why the factor is squared or cubed',
      why: 'Plate, sheet and floor areas and tank volumes are in square and cubic units. The length factor gets used once for each side: twice for area, three times for volume.',
      exTask: '3.3', exParams: { L: 2440, W: 1220 }, tasks: m3 },
    { n: 4, key: 'u4', title: 'Liquid volume: litres and gallons', short: 'US gallon, imperial gallon, litre',
      why: 'Canadian specs use litres. US equipment uses US gallons. Older Canadian equipment can be marked in imperial gallons. The two gallons are not the same size.',
      exTask: '4.5', exParams: { g: 40, d: 1 }, tasks: m4 },
    { n: 5, key: 'u5', title: 'Pressure and head', short: 'kPa, psi, bar, feet and metres of water',
      why: 'Gauges read in psi, kPa or bar. A column of water makes pressure at the bottom, so height (head) and pressure change into each other.',
      exTask: '5.7', exParams: { g: 350, h: 12 }, tasks: m5 },
    { n: 6, key: 'u6', title: 'Temperature', short: '°C and °F in BEDMAS order',
      why: 'Water heaters, thermal expansion charts, welding preheat and pipe insulation specs give temperatures in °C or °F. The formulas only work in the right order.',
      exTask: '6.1', exParams: { c: 60 }, tasks: m6 },
    { n: 7, key: 'u7', title: 'Slope and grade', short: 'Percent, 1 in 50, inches per foot, mm per metre, degrees',
      why: 'Drain lines must fall. The code writes slope as a ratio (1 in 50), drawings may show percent or millimetres per metre, and an inch level reads inches per foot.',
      exTask: '7.3', exParams: { n: 1, d: 4 }, tasks: m7 },
    { n: 8, key: 'u8', title: 'Mass and weight of material', short: 'kg and lb, mass from density',
      why: 'Rigging, shipping and hoist ratings need the mass of the load. You may know a size and a material, or a weight in the other unit system.',
      exTask: '8.4', exParams: { m: 'steel', L: 1200, W: 600, t: 10 }, tasks: m8 },
    { n: 9, key: 'u9', title: 'Pipe sizes: NPS and DN', short: 'A nominal size is a name, not a measurement',
      why: 'Pipe is ordered by trade size. NPS is the inch name and DN is the metric name. Neither one is the measured diameter, so you look it up in a chart instead of converting.',
      exTask: '9.4', exParams: { k: '2' }, tasks: m9 },
    { n: 10, key: 'u10', title: 'Mixed trade problems', short: 'Several conversions in one job',
      why: 'Real jobs mix units: a metric drawing, an inch tape, a US pump and a Canadian code. Work one change at a time, write the unit on every line, and round only at the end.',
      exTask: '10.1', exParams: { d: 52.5, L: 30 }, tasks: m10 }
  ];

  /* ---------- answer parsing and checking ---------- */
  function cleanIn(s) { return String(s == null ? '' : s).toLowerCase().replace(/[’‘′`´]/g, "'").replace(/[”“″]/g, '"').replace(/[−–—]/g, '-').replace(/,/g, '').replace(/\s+/g, ' ').trim(); }
  function parseMixed(s) {
    s = String(s).trim(); var m;
    if (!s) return NaN;
    if ((m = s.match(/^(\d+(?:\.\d*)?|\.\d+)$/))) return parseFloat(m[1]);
    if ((m = s.match(/^(\d+)\s*\/\s*(\d+)$/))) return +m[2] === 0 ? NaN : m[1] / m[2];
    if ((m = s.match(/^(\d+)(?:\s+|\s*-\s*)(\d+)\s*\/\s*(\d+)$/))) return +m[3] === 0 ? NaN : +m[1] + m[2] / m[3];
    return NaN;
  }
  function parseLength(raw) {
    var s = cleanIn(raw).replace(/\bnps\b/g, ' ').replace(/\b(feet|foot|ft)\b\.?/g, "'").replace(/\b(inches|inch|in)\b\.?/g, '"').trim();
    var hasFeet = false, ft = 0, i = s.indexOf("'");
    if (i >= 0) { hasFeet = true; ft = parseMixed(s.slice(0, i)); if (isNaN(ft)) return { v: NaN, hasFeet: true }; s = s.slice(i + 1); }
    s = s.replace(/"/g, ' ').replace(/^\s*-\s*/, '').trim();
    var inn = 0;
    if (s) { inn = parseMixed(s); if (isNaN(inn)) return { v: NaN, hasFeet: hasFeet }; }
    else if (!hasFeet) return { v: NaN, hasFeet: false };
    return { v: ft * 12 + inn, hasFeet: hasFeet };
  }
  var UNIT_WORDS = /\b(us|imp|imperial|gal|gallons?|gpm|litres?|liters?|kpa|psi|bar|mm|cm|km|ml|kg|lbs?|pounds?|g|t|tonnes?|ft|in|m|l|s|h|f|c|dn|nps|per|percent|pieces?|lengths?|welds?|deg|degrees?|of|water|head)\b/g;
  function parseNum(raw) {
    var s = cleanIn(raw).replace(/[%°²³"']/g, ' ');
    s = s.replace(/\/\s*(s|h|min|m|ft)\b/g, ' ').replace(UNIT_WORDS, ' ').replace(/\s+/g, ' ').trim();
    var neg = false; if (s.charAt(0) === '-') { neg = true; s = s.slice(1).trim(); }
    var v = parseMixed(s); return neg ? -v : v;
  }
  function check(sol, raw) {
    if (!String(raw || '').trim()) return { res: 'hint', msg: 'Type your answer in the box first.' };
    var v;
    if (sol.kind === 'len' || sol.kind === 'ftin') {
      var pl = parseLength(raw);
      if (isNaN(pl.v)) return { res: 'hint', msg: sol.unit === 'NPS' ? 'Type the size like 1 1/2 or 3/4.' : 'Type a length like 7 7/8, 7-7/8 or 7.875. Feet and inches work too: 8\' 2 3/8".' };
      if (sol.kind === 'ftin' && !pl.hasFeet) return { res: 'hint', msg: 'Write the answer in feet and inches, like 8\' 2 3/8".' };
      v = pl.v;
    } else {
      v = parseNum(raw);
      if (isNaN(v)) return { res: 'hint', msg: 'Type a number, like 92.1. Fractions work too, like 3/16.' };
      if (sol.kind === 'int' && Math.abs(v - Math.round(v)) > 1e-9) return { res: 'hint', msg: 'Give a whole number.' };
    }
    return { res: Math.abs(v - sol.ans) <= sol.tol + 1e-9 ? 'right' : 'wrong', v: v };
  }

  return { MODULES: MODULES, mkR: mkR, check: check, X: X, RND: RND, DENS: DENS, FACTORS: FACTORS, NPS: NPS, OD: OD,
    fmt: fmt, trim: trim, rd: rd, frac16: frac16, inch: inch, ftin: ftin, parseNum: parseNum, parseLength: parseLength };
})();
if (typeof module !== "undefined") module.exports = UC;
/*GEN-END*/
