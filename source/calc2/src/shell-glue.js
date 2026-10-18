/* Hub shell: the selected calculator model reaches every tab. On a model change (or a frame load) the shell puts the
   CalcKit page layer into each hub frame, as the hide-operations layer does, and sends {calcModel: id}. The shell
   itself gets the layer too (Exam builder blocks). Shell help texts that name the TI-30Xa as the calculator in
   general follow the model. Page text that names TI-30Xa keys inside an explanation is page content and is not
   changed here. */
(function (G) {
  'use strict';
  var K = G.CalcKit, doc = G.document;
  function frames() { return Array.prototype.slice.call(doc.querySelectorAll('.hub-frame')); }
  function toFrame(fr) {
    var w = null;
    try { w = fr.contentWindow; } catch (e) { w = null; }
    if (!w) return;
    try { var L = K.installLayer(w); if (L) L.set(K.getModel()); } catch (e) { /* frame not ready */ }
    try { w.postMessage({ calcModel: K.getModel() }, '*'); } catch (e) { /* frame gone */ }
  }
  /* shell texts that say which calculator the keys are for: [selector, attribute or null for the text] */
  var TEXTS = [['.lede', null], ['#t-ooo', 'title'], ['#ops-tg', 'title'], ['#eb-opt-keys + span', null]];
  var ORIG = 'TI-30Xa';
  function swapText(el, name) {
    var walk = doc.createTreeWalker(el, 4, null), n;
    while ((n = walk.nextNode())) {
      if (n.__calcOrig == null) { if (n.data.indexOf(ORIG) < 0) continue; n.__calcOrig = n.data; }
      n.data = n.__calcOrig.split(ORIG).join(name);
    }
  }
  function texts() {
    var name = K.info().name;
    TEXTS.forEach(function (t) {
      Array.prototype.forEach.call(doc.querySelectorAll(t[0]), function (el) {
        if (t[1]) {
          var key = 'data-calc-orig-' + t[1];
          if (!el.hasAttribute(key)) { var v = el.getAttribute(t[1]) || ''; if (v.indexOf(ORIG) < 0) return; el.setAttribute(key, v); }
          el.setAttribute(t[1], el.getAttribute(key).split(ORIG).join(name));
        } else swapText(el, name);
      });
    });
  }
  function apply() {
    doc.documentElement.setAttribute('data-calc-model', K.getModel());
    var mine = K.installLayer(G);
    if (mine) mine.set(K.getModel());
    frames().forEach(function (fr) { if (fr.getAttribute('srcdoc')) toFrame(fr); });
    texts();
  }
  /* frames load when their tab is first opened: the capture listener also covers frames added after this script */
  doc.addEventListener('load', function (e) { var t = e.target; if (t && t.classList && t.classList.contains('hub-frame')) toFrame(t); }, true);
  K.onChange(apply);
  G.CalcModelShell = { apply: apply };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', apply); else apply();
})(window);
