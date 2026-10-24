/* Shared design handoff: a target and an explicitly accepted stock setup.
 * Target geometry never generates cutting actions or modifies the original project.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../design/design-model.js'), require('./manual-engine.js'));
  else {
    root.CNCDesignBridge = factory(root.AccessDesign, root.CNCManual);
    root.CNCDesignBridge.mount(root);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (D, E) {
  'use strict';
  const STORAGE = 'access-design-cnc-link-v1';
  function parseHash(hash) {
    if (typeof hash !== 'string' || !hash.startsWith('#design=')) return null;
    return D.decode(hash.slice(8));
  }
  function prepare(raw) {
    const project = D.validate(raw);
    const failure = D.checks(project).find(check => !check.ok && check.id !== 'brief');
    if (failure) throw Error(failure.message);
    const config = E.defaultConfig(project.machine, project.units), factor = project.units === 'in' ? 25.4 : 1;
    config.title = project.title;
    config.stock = project.machine === 'mill'
      ? { x: project.stock.width / factor, y: project.stock.height / factor, z: project.stock.depth / factor }
      : { diameter: project.stock.diameter / factor, length: project.stock.length / factor };
    // create delegates to the engine's exact limits. It rejects out-of-range stock.
    let normalized;
    try { normalized = E.create(config).config; }
    catch (error) { throw Error(error.message + ' Setup values are in ' + project.units + '. Adjust the stock in Design Workshop.'); }
    const notes = [];
    if (normalized.title !== project.title) notes.push('The CNC program title is shortened and uses plain characters; the original design title is preserved.');
    const rounded = Object.keys(config.stock).filter(key => Math.abs(config.stock[key] - normalized.stock[key]) > 1e-9);
    if (rounded.length) notes.push('The CNC setup rounds stock ' + rounded.join(', ') + ' to ' + (project.units === 'mm' ? '0.001 mm' : '0.0001 in') + '. The design keeps its original measurements.');
    return { project, config: normalized, notes };
  }
  function apply(builder, project) {
    const ready = prepare(project);
    if (!builder || typeof builder.applySetup !== 'function') throw Error('The manual machining workspace is unavailable.');
    const result = builder.applySetup(ready.config);
    if (!result || !result.ok) throw Error(result && result.error || 'The simulator did not accept this design setup.');
    return { ...ready, backupSaved: result.backupSaved !== false };
  }
  function matches(config, expected) {
    return !!config && !!expected && JSON.stringify(config) === JSON.stringify(expected);
  }
  function returnURL(project) { return '../design/index.html#project=' + D.encode(project); }
  function mount(win) {
    const doc = win.document;
    if (!doc) return;
    const nav = doc.querySelector('.workspace-switch') || doc.querySelector('.topbar');
    if (nav && !doc.getElementById('cnc-design-nav')) {
      const link = doc.createElement('a'); link.id = 'cnc-design-nav'; link.className = 'cnc-design-nav';
      link.href = '../design/index.html'; link.textContent = 'Design Workshop'; nav.append(link);
    }
    if (!D || !E) return;
    const host = doc.querySelector('#manual-builder .mb-scroll');
    if (!host) return;
    const card = doc.createElement('details'); card.id = 'cnc-design-target'; card.className = 'cnc-design-target'; card.hidden = true;
    card.innerHTML = '<summary>Design target <span id="cnc-design-summary"></span></summary><div class="cnc-design-content"><h3 id="cnc-design-title"></h3><p id="cnc-design-brief"></p><div id="cnc-design-preview" class="cnc-design-preview"></div><p id="cnc-design-sizes"></p><p id="cnc-design-origin"></p><p class="cnc-design-note">This is your target. Use the machining controls to plan and make cuts; the target does not generate a toolpath.</p><p id="cnc-design-notes" class="cnc-design-note"></p><p id="cnc-design-status" role="status" aria-live="polite"></p><button type="button" id="cnc-design-apply" class="mb-primary">Use this design setup</button><a id="cnc-design-return" class="cnc-design-return">Return to my design</a></div>';
    const heading = host.querySelector('.mb-head'); if (heading) heading.after(card); else host.prepend(card);
    const $ = id => doc.getElementById(id);
    let project = null, expected = null, linked = false, prepared = null, storageNote = '';
    function saveLink() {
      if (!project || !expected) return;
      try { win.localStorage.setItem(STORAGE, JSON.stringify({ project: D.encode(project), config: expected, linked })); }
      catch (_) { storageNote = 'The design link is available for this visit; browser storage is unavailable.'; }
    }
    function stateStatus() {
      if (!project || !prepared) return;
      const state = win.CNCBuilder && win.CNCBuilder.getState();
      const current = linked && state && matches(state.config, expected);
      $('cnc-design-summary').textContent = current ? '· linked setup' : '· reference';
      $('cnc-design-apply').disabled = !!current;
      $('cnc-design-apply').textContent = current ? 'Design setup in use' : 'Use this design setup';
      $('cnc-design-status').textContent = current
        ? 'Stock and units match this design. ' + state.actions.length + ' machining action' + (state.actions.length === 1 ? '' : 's') + ' recorded. Compare the result with your target.'
        : linked ? 'The current job differs from the design setup. The target remains a reference; apply it again to start fresh stock.'
          : 'Review this target, then choose Use this design setup to start fresh stock. Your current job is kept for Undo during this visit.';
      if (storageNote) $('cnc-design-status').textContent += ' ' + storageNote;
    }
    function display(raw, incoming) {
      project = D.validate(raw); card.hidden = false; card.open = !!incoming;
      $('cnc-design-return').href = returnURL(project); $('cnc-design-return').hidden = false;
      $('cnc-design-title').textContent = project.title;
      $('cnc-design-brief').textContent = project.brief || 'No design brief yet. Add your purpose and key measurements in Design Workshop.';
      const b = D.bounds(project), factor = project.units === 'in' ? 25.4 : 1;
      const fmt = value => Number((value / factor).toFixed(4)).toLocaleString('en-CA', { maximumFractionDigits: 4 });
      const params = project.geometry.params;
      const shapeNames = { rectangle: 'Rectangle', square: 'Square', circle: 'Circle', annulus: 'Washer', cylinder: 'Cylinder' };
      const target = project.geometry.shapeId === 'cylinder' ? 'Ø ' + fmt(b.diameter) + ' × ' + fmt(b.length) + ' long'
        : project.geometry.shapeId === 'annulus' ? 'outer Ø ' + fmt(params.R * 2) + ', hole Ø ' + fmt(params.r * 2)
          : project.geometry.shapeId === 'circle' ? 'Ø ' + fmt(params.r * 2) : fmt(b.width) + ' × ' + fmt(b.height);
      const stock = project.machine === 'lathe' ? 'Ø ' + fmt(project.stock.diameter) + ' × ' + fmt(project.stock.length) + ' stick-out'
        : fmt(project.stock.width) + ' × ' + fmt(project.stock.height) + ' × ' + fmt(project.stock.depth);
      $('cnc-design-sizes').textContent = shapeNames[project.geometry.shapeId] + ' target: ' + target + ' ' + project.units + '. Stock: ' + stock + ' ' + project.units + '.';
      $('cnc-design-origin').textContent = project.machine === 'lathe'
        ? 'Lathe: X is diameter; Z0 is the front face and negative Z goes toward the chuck. The target is centred on the stock axis; canvas X/Y placement is not used.'
        : 'Mill: X0 Y0 is the lower-left stock corner; Z0 is the stock top. Target lower-left: X ' + fmt(project.placement.x) + ', Y ' + fmt(project.placement.y) + ' ' + project.units + '.';
      const preview = $('cnc-design-preview'); preview.replaceChildren();
      if (project.geometry.shapeId !== 'cylinder') {
        try {
          const img = doc.createElement('img'); img.alt = shapeNames[project.geometry.shapeId] + ' target profile placed within the stock dimensions';
          // A screen preview needs a visible outline at thumbnail size; measured exports stay untouched.
          const stroke = Number((Math.max(project.stock.width, project.stock.height) / 100).toFixed(6));
          const thumbnail = D.toSVG(project).replace('stroke="#000000" stroke-width="0.1"', 'stroke="#940010" stroke-width="' + stroke + '"');
          img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(thumbnail); preview.append(img);
        } catch (_) { /* The precise validation error is displayed below. */ }
      } else if (win.Shapes) {
        const targetShape = D.toCanvas(project, project.units), img = doc.createElement('img');
        img.alt = 'Cylinder target with radius and length dimensions';
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(win.Shapes.render('cylinder', targetShape.params, { units: project.units, labels: 'values' }));
        preview.append(img);
      }
      try {
        prepared = prepare(project);
        $('cnc-design-notes').textContent = prepared.notes.join(' ');
        stateStatus();
      } catch (error) {
        prepared = null; $('cnc-design-apply').disabled = true; $('cnc-design-summary').textContent = '· check stock';
        $('cnc-design-status').textContent = error.message; $('cnc-design-notes').textContent = '';
      }
    }
    function receive() {
      if (!win.location.hash.startsWith('#design=')) return false;
      linked = false; expected = null;
      try { display(parseHash(win.location.hash), true); }
      catch (error) {
        project = null; prepared = null; card.hidden = false; card.open = true;
        $('cnc-design-title').textContent = 'Design could not be opened'; $('cnc-design-summary').textContent = '· invalid link';
        ['cnc-design-brief', 'cnc-design-sizes', 'cnc-design-origin', 'cnc-design-notes'].forEach(id => $(id).textContent = '');
        $('cnc-design-preview').replaceChildren(); $('cnc-design-status').textContent = error.message;
        $('cnc-design-apply').disabled = true; $('cnc-design-return').hidden = true;
      }
      return true;
    }
    $('cnc-design-apply').addEventListener('click', () => {
      try {
        const accepted = apply(win.CNCBuilder, project);
        expected = accepted.config; linked = true; prepared = accepted;
        if (!accepted.backupSaved) storageNote = 'The previous draft remains available with Undo during this visit; its browser backup could not be saved.';
        saveLink(); stateStatus(); card.open = false;
        // Remove the incoming command so a reload restores the linked draft, without asking to replace it again.
        win.history.replaceState(null, '', win.location.pathname + win.location.search);
      } catch (error) { $('cnc-design-status').textContent = error.message; card.open = true; }
    });
    win.addEventListener('cnc-builder-state', event => {
      if (event.detail && event.detail.reason === 'setup') { linked = false; saveLink(); }
      stateStatus();
    });
    win.addEventListener('hashchange', receive);
    if (!receive()) {
      try {
        const stored = win.localStorage.getItem(STORAGE);
        if (stored && stored.length <= D.maxBytes * 4) {
          const parsed = JSON.parse(stored), restored = D.decode(parsed.project), setup = prepare(restored);
          expected = setup.config; linked = parsed.linked === true && matches(parsed.config, expected);
          display(restored, false);
        }
      } catch (_) { /* A damaged saved link must never alter the CNC draft. */ }
    }
  }
  return Object.freeze({ parseHash, prepare, apply, matches, returnURL, mount });
});
