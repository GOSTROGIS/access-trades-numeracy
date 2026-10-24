(function () {
  'use strict';
  const D = window.AccessDesign, $ = id => document.getElementById(id);
  const STORE = 'access-design-workshop-v1';
  const titles = ['Give your design a purpose', 'Draw with real dimensions', 'Check the part against the stock', 'Try your design in the machine', 'Explain what you learned'];
  const nextLabels = ['Draw your part →', 'Check the design →', 'Plan machining →', 'Record your learning →'];
  const names = { rectangle: 'Plate', square: 'Square plate', circle: 'Disc', annulus: 'Washer', cylinder: 'Shaft' };
  const labels = { l: 'Length', w: 'Width', s: 'Side length', r: 'Radius', R: 'Outside radius', h: 'Length' };
  let project = D.create('plate'), step = 0, undo = [], redo = [], pendingTemplate = null, pendingIncoming = null, hadSaved = false;
  let initialMessage = '';
  try { const saved = localStorage.getItem(STORE); if (saved) { project = D.validate(JSON.parse(saved)); hadSaved = true; } }
  catch (_) { initialMessage = 'Your saved project could not be opened. You can open a downloaded project or start again.'; }
  if (location.hash.startsWith('#project=')) {
    try { const incoming = D.decode(location.hash.slice(9)); if (hadSaved && JSON.stringify(incoming) !== JSON.stringify(project)) pendingIncoming = incoming; else project = incoming; initialMessage = 'Design received. Your dimensions, stock and notes are ready to review.'; }
    catch (e) { initialMessage = 'The incoming project was not opened: ' + e.message; }
    try { history.replaceState(null, '', location.pathname + location.search); } catch (_) { /* file URLs may reject history changes */ }
  }
  function notify(text) { $('notice').textContent = text; $('notice').hidden = !text; }
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(project)); $('save-status').textContent = 'Saved in this browser · Download to keep a copy'; }
    catch (_) { $('save-status').textContent = 'Browser saving unavailable · Download your project to keep it'; }
  }
  const copy = p => JSON.parse(JSON.stringify(p));
  const unitFactor = () => project.units === 'in' ? 25.4 : 1;
  const fmt = n => Number(n.toFixed(5)).toLocaleString('en-CA', { maximumFractionDigits: 5 });
  let dimensionShape = '', stockMachine = '';
  function edit(change) {
    const candidate = copy(project);
    try {
      change(candidate);
      const clean = D.validate(candidate);
      if (JSON.stringify(clean) !== JSON.stringify(project)) { undo.push(copy(project)); if (undo.length > 80) undo.shift(); redo = []; project = clean; save(); }
      notify(''); render();
    } catch (e) { notify('Check this value: ' + e.message); render(); }
  }
  function numericField(container, id, labelText, value, change, min = 0.000001) {
    const label = document.createElement('label'); label.htmlFor = id; label.append(labelText);
    const unit = document.createElement('span'); unit.className = 'unit-label'; unit.textContent = project.units; label.append(unit);
    const input = document.createElement('input'); input.type = 'number'; input.id = id; input.step = 'any'; input.min = min; input.required = true;
    input.value = Number((value / unitFactor()).toFixed(8));
    input.onchange = () => { const number = input.valueAsNumber; edit(p => change(p, number * unitFactor())); };
    label.append(input); container.append(label);
  }
  function render() {
    $('project-title').value = project.title; $('project-brief').value = project.brief; $('units').value = project.units; $('reflection').value = project.reflection;
    $('undo').disabled = !undo.length; $('redo').disabled = !redo.length;
    if (dimensionShape !== project.geometry.shapeId) {
      $('dimension-fields').replaceChildren(); dimensionShape = project.geometry.shapeId;
      for (const [key, value] of Object.entries(project.geometry.params)) numericField($('dimension-fields'), 'dim-' + key,
        project.geometry.shapeId === 'annulus' && key === 'r' ? 'Inside radius' : labels[key], value, (p, n) => { p.geometry.params[key] = n; });
    }
    for (const [key, value] of Object.entries(project.geometry.params)) $('dim-' + key).value = Number((value / unitFactor()).toFixed(8));
    document.querySelectorAll('#dimension-fields .unit-label').forEach(el => { el.textContent = project.units; });
    for (const axis of ['x', 'y']) $('placement-' + axis).value = Number((project.placement[axis] / unitFactor()).toFixed(8));
    document.querySelectorAll('#placement-fields .unit-label').forEach(el => { el.textContent = project.units; });
    const lathe = project.machine === 'lathe';
    const requiredMachine = project.geometry.shapeId === 'cylinder' ? 'lathe' : 'mill';
    $('repair-machine').hidden = project.machine === requiredMachine;
    $('repair-machine').textContent = 'Use the ' + requiredMachine + ' for this ' + (requiredMachine === 'lathe' ? 'shaft' : 'flat profile');
    $('placement-fields').hidden = lathe;
    $('origin-note').textContent = lathe ? 'Lathe drawing: radius defines the part. CNC X is diameter (2 × radius); Z0 is the front face of the stock.' : 'Mill drawing: X0 Y0 is the lower-left stock corner. These offsets place the part inside the stock. Z0 is the top surface.';
    const stockLabels = lathe ? { diameter: 'Stock diameter', length: 'Stock length' } : { width: 'Stock width (X)', height: 'Stock height (Y)', depth: 'Stock thickness (Z)' };
    if (stockMachine !== project.machine) {
      $('stock-fields').replaceChildren(); stockMachine = project.machine;
      for (const [key, label] of Object.entries(stockLabels)) numericField($('stock-fields'), 'stock-' + key, label, project.stock[key], (p, n) => { p.stock[key] = n; });
    }
    for (const key of Object.keys(stockLabels)) $('stock-' + key).value = Number((project.stock[key] / unitFactor()).toFixed(8));
    document.querySelectorAll('#stock-fields .unit-label').forEach(el => { el.textContent = project.units; });
    $('drawing-title').textContent = project.title; $('unit-chip').textContent = project.units;
    const canvasShape = D.toCanvas(project, project.units);
    $('drawing-preview').innerHTML = Shapes.render(canvasShape.shapeId, canvasShape.params, { units: project.units, labels: 'values', allAngles: false, moreDims: false });
    const svg = $('drawing-preview').querySelector('svg'); if (svg) { svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', names[project.geometry.shapeId] + ' with dimensions in ' + project.units); }
    $('drawing-caption').textContent = names[project.geometry.shapeId] + ' · ' + (lathe ? 'X uses diameter in CNC practice.' : 'Part offsets: X ' + fmt(project.placement.x / unitFactor()) + ', Y ' + fmt(project.placement.y / unitFactor()) + ' ' + project.units + '.');
    const maths = Shapes.calc(canvasShape.shapeId, canvasShape.params, project.units);
    $('measurements').replaceChildren(); $('formula-working').replaceChildren();
    maths.items.slice(0, 4).forEach(item => { const box = document.createElement('div'); box.className = 'measurement'; const label = document.createElement('span'); label.textContent = item.name; const number = document.createElement('strong'); number.textContent = fmt(item.value) + ' ' + item.unit; box.append(label, number); $('measurements').append(box); });
    maths.items.forEach(item => { const title = document.createElement('h3'); title.textContent = item.name; $('formula-working').append(title); item.lines.forEach(line => { const p = document.createElement('p'); p.textContent = line; $('formula-working').append(p); }); });
    const checks = D.checks(project);
    $('check-list').replaceChildren();
    checks.forEach(check => { const li = document.createElement('li'); if (!check.ok) li.className = 'fail'; const mark = document.createElement('b'); mark.textContent = check.ok ? '✓ Pass' : 'Review'; const text = document.createElement('span'); text.textContent = check.message; li.append(mark, text); $('check-list').append(li); });
    $('machine-title').textContent = lathe ? 'Lathe · manual program builder' : 'Mill · manual program builder';
    const envelope = D.bounds(project);
    const targetSize = requiredMachine === 'lathe' ? `Target: Ø${fmt(envelope.diameter / unitFactor())} × ${fmt(envelope.length / unitFactor())} ${project.units}.` : `Target envelope: ${fmt(envelope.width / unitFactor())} × ${fmt(envelope.height / unitFactor())} ${project.units}.`;
    $('machine-summary').textContent = (lathe ? `Stock: Ø${fmt(project.stock.diameter / unitFactor())} × ${fmt(project.stock.length / unitFactor())} ${project.units}. ` : `Stock: ${fmt(project.stock.width / unitFactor())} × ${fmt(project.stock.height / unitFactor())} × ${fmt(project.stock.depth / unitFactor())} ${project.units}. `) + targetSize;
    const ready = checks.every(c => c.ok);
    $('machine-readiness').textContent = ready ? 'Design checks passed. Review your tool and setup in the trainer.' : 'Return to Check and resolve the review items before continuing.';
    $('open-cnc').setAttribute('aria-disabled', String(!ready));
    $('open-cnc').href = '../cnc/index.html?mode=builder&machine=' + project.machine + '#design=' + D.encode(project);
    $('open-canvas').href = '../../shape-canvas/index.html#project=' + D.encode(project);
    $('export-svg').disabled = lathe; $('export-dxf').disabled = lathe;
    $('export-note').textContent = lathe ? 'Download the editable project for this 3D shaft. A lathe cutting profile requires a separate machining operation.' : 'Exports contain the part outline at real size in millimetres, without dimension labels. Check units when importing into another app.';
    renderStep(false); renderWorksheet(checks);
  }
  function renderStep(focus = true) {
    document.querySelectorAll('[data-panel]').forEach(el => { el.hidden = Number(el.dataset.panel) !== step; });
    document.querySelectorAll('[data-step]').forEach(el => { if (Number(el.dataset.step) === step) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current'); });
    $('step-title').textContent = titles[step]; $('step-number').textContent = 'STEP ' + (step + 1) + ' OF 5';
    $('previous').disabled = step === 0; $('next').hidden = step === 4; $('next').textContent = nextLabels[step] || '';
    if (focus) $('step-title').focus();
  }
  function renderWorksheet(checks) {
    const out = $('print-summary'); out.replaceChildren();
    const heading = (text, tag = 'h3') => { const el = document.createElement(tag); el.textContent = text; out.append(el); };
    const paragraph = text => { const el = document.createElement('p'); el.textContent = text; out.append(el); };
    heading(project.title, 'h2'); heading('Design brief'); paragraph(project.brief || 'No brief recorded.');
    heading('Dimensions and setup'); paragraph($('machine-summary').textContent); paragraph($('origin-note').textContent);
    for (const [key, value] of Object.entries(project.geometry.params)) paragraph((labels[key] || key) + ': ' + fmt(value / unitFactor()) + ' ' + project.units);
    heading('Design checks'); checks.forEach(c => paragraph((c.ok ? 'Pass: ' : 'Review: ') + c.message));
    heading('Working and reflection'); paragraph(project.reflection || 'Record your calculations, changes and next steps here.');
    paragraph('Training design worksheet · ACCESS Indigenous Skills4Success');
  }
  function download(name, text, type) {
    const url = URL.createObjectURL(new Blob([text], { type })), a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const filename = () => (project.title.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '').slice(0, 60) || 'access-design');
  function downloadProject() { download(filename() + '.access-design.json', JSON.stringify(D.validate(project), null, 2), 'application/json'); }
  $('project-form').onsubmit = event => event.preventDefault();
  $('project-title').onchange = e => edit(p => { p.title = e.target.value; });
  $('project-brief').onchange = e => edit(p => { p.brief = e.target.value; });
  $('reflection').onchange = e => edit(p => { p.reflection = e.target.value; });
  $('repair-machine').onclick = () => edit(p => { p.machine = p.geometry.shapeId === 'cylinder' ? 'lathe' : 'mill'; });
  $('units').onchange = e => edit(p => { p.units = e.target.value; });
  ['x', 'y'].forEach(axis => { $('placement-' + axis).onchange = e => edit(p => { p.placement[axis] = e.target.valueAsNumber * unitFactor(); }); });
  document.querySelectorAll('[data-step]').forEach(el => { el.onclick = () => { step = Number(el.dataset.step); renderStep(); }; });
  $('previous').onclick = () => { step = Math.max(0, step - 1); renderStep(); };
  $('next').onclick = () => { step = Math.min(4, step + 1); renderStep(); };
  $('undo').onclick = () => { if (undo.length) { redo.push(copy(project)); project = undo.pop(); save(); render(); notify('Project change undone.'); } };
  $('redo').onclick = () => { if (redo.length) { undo.push(copy(project)); project = redo.pop(); save(); render(); notify('Project change restored.'); } };
  function askReplace(incoming) {
    const dialog = $('new-dialog');
    dialog.querySelector('h2').textContent = incoming ? 'Open the incoming design?' : 'Start a new design?';
    dialog.querySelector('p').textContent = 'You already have a project in this workshop. Download it to keep a separate copy. You can also Undo after replacing it during this visit.';
    dialog.querySelector('[value="start"]').textContent = incoming ? 'Open incoming design' : 'Start new design';
    dialog.returnValue = ''; dialog.showModal();
  }
  document.querySelectorAll('[data-template]').forEach(el => { el.onclick = () => { pendingTemplate = el.dataset.template; askReplace(false); }; });
  $('new-dialog').addEventListener('close', () => { if ($('new-dialog').returnValue === 'start' && (pendingTemplate || pendingIncoming)) { const next = pendingIncoming || D.create(pendingTemplate); edit(p => { for (const key of Object.keys(p)) delete p[key]; Object.assign(p, next); }); notify('Design opened. Undo returns to the previous project during this visit.'); } pendingTemplate = null; pendingIncoming = null; });
  $('download-before-new').onclick = downloadProject; $('save-project').onclick = downloadProject;
  $('open-project').onclick = () => $('project-file').click();
  $('project-file').onchange = async event => {
    const file = event.target.files[0]; if (!file) return;
    try { if (file.size > 100000) throw new Error('Project files must be smaller than 100 KB.'); const incoming = D.validate(JSON.parse(await file.text())); undo.push(copy(project)); redo = []; project = incoming; step = 0; save(); render(); notify('Project opened. Use Undo to return to your previous design.'); }
    catch (e) { notify('Project not opened: ' + e.message); }
    event.target.value = '';
  };
  $('open-cnc').onclick = event => { if ($('open-cnc').getAttribute('aria-disabled') === 'true') { event.preventDefault(); step = 2; renderStep(); notify('Resolve the highlighted checks before opening CNC practice.'); } };
  for (const ext of ['svg', 'dxf']) $('export-' + ext).onclick = () => { try { download(filename() + '.' + ext, ext === 'svg' ? D.toSVG(project) : D.toDXF(project), ext === 'svg' ? 'image/svg+xml' : 'application/dxf'); } catch (e) { notify(e.message); } };
  $('print-sheet').onclick = () => { renderWorksheet(D.checks(project)); window.print(); };
  // Read-only snapshots make the handoff inspectable without exposing mutable application state.
  window.DesignWorkshop = { getProject: () => copy(project) };
  render(); save(); if (initialMessage) notify(initialMessage); if (pendingIncoming) askReplace(true);
})();
