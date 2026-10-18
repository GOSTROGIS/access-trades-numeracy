/* Header calculator selector: "Calculator: TI-30Xa / Sharp EL-531XT / HP-15C" at the top right of the hub header, on
   every tab. It is the same switch as the menu inside the calculator: both call CalcKit.setModel, and both follow
   every model change (the saved 'access-calc-model' choice included), so the tabs, the Exam builder and its exports
   are drawn again exactly as from the calculator's own menu. */
(function (G) {
  'use strict';
  var K = G.CalcKit, doc = G.document;
  function sel() { return doc.getElementById('calc-model-sel'); }
  function paint() {
    var s = sel();
    if (!s) return;
    if (s.value !== K.getModel()) s.value = K.getModel();
    var box = s.closest('.calc-pick');
    if (box) box.setAttribute('data-calc-model', K.getModel());
  }
  function start() {
    var s = sel();
    if (!s || s.__calcPick) return;
    s.__calcPick = true;
    if (!s.options.length) K.models().forEach(function (m) { var o = doc.createElement('option'); o.value = m.id; o.textContent = m.name; s.appendChild(o); });
    s.addEventListener('change', function () { K.setModel(s.value); });
    paint();
  }
  K.onChange(paint);
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start); else start();
})(window);
