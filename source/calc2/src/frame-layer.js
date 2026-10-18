/* CalcKit page layer: carries the selected calculator model into one document (the shell itself or a hub frame,
   which are same-origin srcdoc frames), the same way the hide-operations layer is put into each frame.
   - TI30.tokens answers with the selected model's tokens, so every glow chip map in the page lines up with the
     chips on screen and with the keys the calculator plays.
   - TIKeys.html, render, chips and screen build blocks for the selected model.
   - Key-chip blocks already on the page (.tikeys, including pre-rendered ones) are rebuilt from their data-seq:
     title, start line, chips and screen. A MutationObserver keeps blocks added later in step.
   - The frame's <html> gets data-calc-model, and a {calcModel} message switches the layer too.
   With the TI-30Xa selected and nothing switched yet, nothing on the page is touched.
   CalcKit.installLayer(W) returns W.CalcKitLayer. Chip colours are fixed key-cap colours, like the TI-30Xa chips. */
(function (G) {
  'use strict';
  var K = G.CalcKit;
  var CSS = '.tk-sh-2ndf { background: rgb(240, 150, 40); color: rgb(20, 22, 24); border-color: rgb(150, 80, 10); }' +
    '.tk-sec-2ndf { box-shadow: 0 2px 0 rgb(150, 80, 10); border-color: rgb(150, 80, 10); }' +
    '.tk-sh-f { background: rgb(232, 176, 104); color: rgb(20, 22, 24); border-color: rgb(140, 96, 40); }' +
    '.tk-sec-f { box-shadow: 0 2px 0 rgb(140, 96, 40); border-color: rgb(140, 96, 40); }' +
    '.tk-sh-g { background: rgb(112, 172, 224); color: rgb(20, 22, 24); border-color: rgb(40, 90, 140); }' +
    '.tk-sec-g { box-shadow: 0 2px 0 rgb(40, 90, 140); border-color: rgb(40, 90, 140); }' +
    '.tk-alpha { box-shadow: 0 2px 0 rgb(30, 110, 60); border-color: rgb(30, 110, 60); }' +
    '.tk-note { display: block; margin: 2px 0 6px; font: italic 400 13px/1.4 var(--font-body, sans-serif); color: var(--muted, rgb(90, 90, 90)); white-space: normal; }' +
    '.tikeys[data-calc-model="el531xt"] { border-left-color: rgb(240, 150, 40); }' +
    '.tikeys[data-calc-model="hp15c"] { border-left-color: rgb(232, 176, 104); }' +
    '.tikeys[data-calc-model="el531xt"] .tikeys-run:hover { border-color: rgb(240, 150, 40); }' +
    '.tikeys[data-calc-model="hp15c"] .tikeys-run:hover { border-color: rgb(196, 140, 70); }';
  function install(W) {
    var D;
    try { D = W.document; } catch (e) { return null; }
    if (!D || !D.documentElement || !D.body) return null;
    if (W.CalcKitLayer) return W.CalcKitLayer;
    var st = D.createElement('style');
    st.id = 'calckit-layer-style';
    st.textContent = CSS;
    (D.head || D.documentElement).appendChild(st);
    var model = 'ti30xa', mo = null, queued = false;
    /* TI30.tokens: the page's own engine keeps working (its run and parse use the original), only the token list
       handed to page scripts follows the model */
    function wrapTokens() {
      var T = W.TI30;
      if (!T || typeof T.tokens !== 'function' || T.__calcKitOrig) return;
      var orig = T.tokens;
      T.__calcKitOrig = orig;
      T.tokens = function (seq) { return model === 'ti30xa' ? orig.apply(this, arguments) : K.pageTokens(seq, model); };
    }
    function wrapTIKeys() {
      var TK = W.TIKeys;
      if (!TK || TK.__calcKit) return;
      TK.__calcKit = true;
      var o = { html: TK.html, chips: TK.chips, screen: TK.screen };
      TK.html = function (list, opts) { return model === 'ti30xa' && o.html ? o.html.apply(this, arguments) : K.blockHtml(list, opts, model); };
      TK.render = function (container, list, opts) {
        if (!container) return;
        var old = container.querySelector(':scope > .tikeys');
        if (old) old.remove();
        var s = TK.html(list, opts);
        if (s) container.insertAdjacentHTML('beforeend', s);
      };
      if (o.chips) TK.chips = function (seq) { return model === 'ti30xa' ? o.chips.apply(this, arguments) : K.chipsHtml(seq, model); };
      if (o.screen) TK.screen = function (seq) { return model === 'ti30xa' ? o.screen.apply(this, arguments) : K.screen(seq, model); };
    }
    /* one block, rebuilt for the model from the data-seq of each row */
    function rebuild(box) {
      var hd = K.heading(model);
      var title = box.querySelector('.tikeys-title');
      if (title && /^On the /.test(title.textContent)) title.textContent = hd.title;
      var sub = box.querySelector('.tikeys-sub');
      if (sub && /^Start with/.test(sub.textContent)) sub.innerHTML = hd.subHtml;
      Array.prototype.forEach.call(box.querySelectorAll('.tikeys-row'), function (row) {
        var run = row.querySelector('.tikeys-run'), seq = run && run.getAttribute('data-seq');
        if (!seq) return;
        var chips = row.querySelector('.tikeys-seq');
        if (chips) chips.innerHTML = K.chipsHtml(seq, model);
        var lcd = row.querySelector('.tikeys-out .tk-lcd');
        if (lcd) lcd.outerHTML = K.screenHtml(K.screen(seq, model));
      });
      box.setAttribute('data-calc-model', model);
    }
    function scan() {
      queued = false;
      wrapTokens(); wrapTIKeys();
      Array.prototype.forEach.call(D.querySelectorAll('.tikeys'), function (box) {
        var has = box.getAttribute('data-calc-model') || 'ti30xa';
        if (has !== model) rebuild(box);
      });
    }
    function later() { if (!queued) { queued = true; W.setTimeout(scan, 0); } }
    function set(id) {
      if (!id) return;
      model = id;
      D.documentElement.setAttribute('data-calc-model', id);
      scan();
      if (!mo && W.MutationObserver) { mo = new W.MutationObserver(later); mo.observe(D.body, { childList: true, subtree: true }); }
    }
    W.addEventListener('message', function (e) { var d = e.data; if (d && typeof d.calcModel === 'string' && d.calcModel !== model) set(d.calcModel); });
    W.CalcKitLayer = { set: set, model: function () { return model; }, scan: scan };
    set(K.getModel());
    return W.CalcKitLayer;
  }
  K.installLayer = install;
})(typeof window !== 'undefined' ? window : this);
