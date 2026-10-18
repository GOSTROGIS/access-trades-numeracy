/* Calculator keys for the book: TI-30Xa and Sharp EL-531XT chips from the hub's verified CalcKit core and translator.
   Every sequence is played on the TI-30Xa emulator and on the Sharp emulator. calcCheck() throws when the two
   calculators disagree, when either shows Error, or when the value stated in the book does not match. */
const path = require('path');
const C2 = path.join(__dirname, '..', '..', 'calc2');
global.TI30 = require(path.join(C2, 'ti30.js'));
global.SharpEL = require(path.join(C2, 'src', 'core-sharp.js'));
global.HP15C = require(path.join(C2, 'src', 'core-hp.js'));
global.CalcTranslate = require(path.join(C2, 'src', 'core-translate.js'));
const K = require(path.join(C2, 'src', 'calc-kit-core.js'));
const E = require(path.join(C2, 'work', 'equiv.js'));

const MODELS = [
  { id: 'ti30xa', name: 'TI-30Xa' },
  { id: 'el531xt', name: 'Sharp EL-531XT' }
];
const log = [];

function tiValue(seq) {
  const c = new TI30.Calc();
  for (const k of TI30.parseSeq(seq)) { c.press(k); if (c.display().error) return { error: true }; }
  return { value: c.value(), disp: c.display() };
}
/* the value the book states must equal the calculator value rounded to the places shown */
function sameAsShown(stated, v) {
  const s = String(stated).replace(/,/g, '').replace(/\u2212/g, '-').trim();
  if (!/^-?\d*\.?\d+$/.test(s)) throw new Error('stated value is not a plain number: ' + stated);
  const dp = s.includes('.') ? s.split('.')[1].length : 0;
  const f = Math.pow(10, dp);
  const r = Math.round(v * f + (v >= 0 ? 1e-9 : -1e-9)) / f;
  return r.toFixed(dp) === Number(s).toFixed(dp);
}
function calcCheck(seq, expect, where) {
  const ti = tiValue(seq);
  if (ti.error) throw new Error((where || '') + ' TI-30Xa shows Error for: ' + seq);
  const r = E.check(seq);
  if (!r) throw new Error((where || '') + ' sequence not checkable: ' + seq);
  const sh = r.el531xt;
  if (!sh || !(sh.level === 'exact' || sh.level === 'display')) throw new Error((where || '') + ' Sharp translation disagrees (' + (sh && sh.level) + ') for: ' + seq + ' ' + JSON.stringify(sh));
  if (expect != null && !sameAsShown(expect, ti.value)) throw new Error((where || '') + ' stated ' + expect + ' but the TI-30Xa gives ' + ti.value + ' for: ' + seq);
  const entry = { seq, expect: expect == null ? null : String(expect), ti: ti.value, sharp: sh.level, where: where || '' };
  log.push(entry);
  return entry;
}
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
/* print keycaps: num, op, fn, shift (2nd / 2ndF), alpha (Sharp memory letter), note */
function chips(seq, id) {
  return K.exportChips(seq, id).map(c => {
    if (c.k === 'note') return '<span class="kc-note">' + esc(c.t) + '</span>';
    const cls = c.k === '2nd' || c.k === '2ndf' ? 'kc kc-shift' : c.k === 'alpha' ? 'kc kc-alpha' : 'kc kc-' + c.k;
    return '<span class="' + cls + '">' + esc(c.t) + '</span>';
  }).join('<span class="kc-gap"></span>');
}
function screenText(seq, id) {
  const d = K.screen(seq, id);
  let main = String(d.main).replace(/⌟/g, '⌟').replace(/┌/g, '┌');
  return { main, exp: d.exp ? String(d.exp).trim() : '', top: d.top || '' };
}
function startChips(id) {
  return K.START[id].map(t => '<span class="kc kc-op">' + (t.key === 'onc' ? 'ON/C' : esc(t.key)) + '</span>').join('<span class="kc-gap"></span>');
}
module.exports = { K, E, MODELS, chips, screenText, calcCheck, tiValue, startChips, log, sameAsShown };
