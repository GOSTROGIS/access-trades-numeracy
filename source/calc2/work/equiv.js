/* Equivalence check for one canonical TI-30Xa seq: the Sharp and HP translations, played on their emulators, must
   give the TI-30Xa value. Levels of agreement, strictest first:
   exact   relative difference within 2e-9 (rounding noise only)
   display the two values show the same digits on the model's own display (HP FIX 4, Sharp 10 digits)
   hms     HP minutes-seconds result whose →H value equals the TI angle (60 seconds carried in the last digit)
   hp10    the HP keys give the TI value without 10-digit rounding: the HP-15C's own rounding moved the last digit
   Used by xlate-test.js (exam banks) and hub/test-models.js (pages plus banks). */
const path = require('path');
const TI30 = require('../ti30.js'); global.TI30 = TI30;
const SharpEL = require('../src/core-sharp.js');
const HP15C = require('../src/core-hp.js');
const X = require('../src/core-translate.js');
function exact(a, b) {
  if (!isFinite(a) || !isFinite(b)) return a === b;
  const d = Math.abs(a - b), m = Math.max(Math.abs(a), Math.abs(b));
  return d <= 1e-9 || d / m <= 2e-9;
}
function play(model, seq) {
  const toks = X.translate(seq, model);
  const c = model === 'el531xt' ? new SharpEL.Calc() : new HP15C.Calc();
  if (model === 'el531xt') { c.press('onc'); c.press('onc'); }
  X.presses(toks).forEach(p => c.press(p.id));
  return { c, toks };
}
function check(seq) {
  /* a worked solution never passes through an error: a seq whose run shows Error at any key is not checked */
  const ti = new TI30.Calc();
  for (const k of TI30.parseSeq(seq)) { ti.press(k); if (ti.display().error) return null; }
  const tv = ti.value(), last = seq.split(/\s+ON\/C\s+ON\/C\s+/).pop();
  const showDms = X.readTI(last).showDms;
  const res = { seq, ti: tv };
  ['el531xt', 'hp15c'].forEach(model => {
    let r;
    try { r = play(model, seq); }
    catch (e) { res[model] = e instanceof X.Unsupported ? { level: 'unsupported', why: e.message } : { level: 'error', why: e.stack }; return; }
    const v = r.c.value(), disp = r.c.display();
    let want = tv;
    if (model === 'hp15c' && showDms) want = HP15C.h2hms(tv);
    let level = null;
    if (disp.error) level = 'fail';
    else if (exact(v, want)) level = 'exact';
    else if (model === 'hp15c') {
      const f = r.c.fmtValue(want);
      if (f.main === disp.main && f.exp === disp.exp) level = 'display';
      else if (showDms && Math.abs(HP15C.hms2h(v) - tv) <= 1e-7 * Math.max(1, Math.abs(tv))) level = 'hms';
    } else {
      const f = SharpEL.fmtNorm(want), g = SharpEL.fmtNorm(v);
      if (f.main === g.main && f.exp === g.exp) level = 'display';
    }
    /* 10-digit rounding on the HP-15C (p. 60) against 13 on the TI-30Xa: large trig arguments and long chains */
    /* the same HP keys without the 10-digit rounding: equal to the TI-30Xa means the keys are right and only the
       HP-15C's own rounding (p. 60) moved the last digit shown, as it would on the calculator */
    if (!level && model === 'hp15c') {
      HP15C.unrounded(true);
      try { const c2 = new HP15C.Calc(); X.presses(r.toks).forEach(p => c2.press(p.id)); if (exact(c2.value(), want)) level = 'hp10'; } finally { HP15C.unrounded(false); }
    }
    if (!level && Math.abs(v - want) <= 1e-5 * Math.max(1, Math.abs(want))) level = 'precision';
    res[model] = { level: level || 'fail', got: v, want, shown: disp.main + (disp.exp ? ' ' + disp.exp : ''), toks: r.toks };
  });
  return res;
}
function tokText(toks) { return toks.map(t => t.note ? '[' + t.note + ']' : t.num != null ? t.num : (t.shift ? t.shift + ' ' : '') + t.key).join(' '); }
module.exports = { check, tokText, X, TI30, SharpEL, HP15C };
