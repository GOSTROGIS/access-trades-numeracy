/* Student project continuity, numeracy evidence and offline classroom exchange. */
(function () {
  'use strict';
  const D = window.AccessDesign, W = window.AccessDesignWorkflow, app = window.DesignWorkshop;
  const $ = id => document.getElementById(id), copy = p => JSON.parse(JSON.stringify(p));
  const fmt = n => Number(n.toFixed(5)).toLocaleString('en-CA', { maximumFractionDigits: 5 });
  const factor = p => p.units === 'in' ? 25.4 : 1;
  const get = () => app.getProject();
  const meta = p => W.ensure(p).workflow;
  let library = W.createLibrary(), libraryWritable = true, lastSaved = '', selectedProject = '', selectedRevision = '', profileSignature = '', rubricSignature = '', lastUnits = get().units, storedLibraryText = null, removedLibrary = null;
  try { const loaded = W.loadLibrary(localStorage); storedLibraryText = localStorage.getItem(W.storageKey); library = loaded.library; libraryWritable = loaded.ok; $('library-message').textContent = loaded.message; }
  catch (_) { libraryWritable = false; $('library-message').textContent = 'Browser saving is unavailable. Download your project or library to keep your work.'; }
  function attempt(action) { try { action(); } catch (error) { app.notify(error.message); } }
  function mutate(action) { attempt(() => { const p = get(); app.replaceProject(W.syncMetadata(action(p), get())); }); }
  function element(tag, text, className) { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (className) el.className = className; return el; }
  function options(select, rows, selected) { const signature = JSON.stringify(rows); if (select.dataset.options !== signature) { select.replaceChildren(...rows.map(row => { const o = element('option', row.label); o.value = row.value; return o; })); select.dataset.options = signature; } if (rows.some(r => r.value === selected)) select.value = selected; }
  function card(container, title, lines, status) { const box = element('article', undefined, 'evidence-card' + (status === 'stale' || status === 'outside-tolerance' ? ' needs-review' : '')); box.append(element('h3', title)); lines.filter(Boolean).forEach(line => box.append(element('p', line))); container.append(box); return box; }
  function writeLibrary() {
    if (!libraryWritable) return;
    try {
      const external = localStorage.getItem(W.storageKey); let merged = false;
      if (external && external !== storedLibraryText) { library = W.mergeLibrary(library, W.importLibrary(external)).library; merged = true; }
      const saved = W.saveLibrary(localStorage, library); if (saved.ok) storedLibraryText = JSON.stringify(saved.library);
      $('library-message').textContent = saved.ok && merged ? 'Changes from another tab were preserved in the library. Different versions are kept as separate imported copies.' : saved.message;
    }
    catch (error) { $('library-message').textContent = error.message; }
  }
  function remember(p) {
    const serialized = JSON.stringify(p); if (serialized === lastSaved) return;
    try { library = W.upsert(library, p); lastSaved = serialized; writeLibrary(); }
    catch (error) { $('library-message').textContent = error.message + ' Your active project can still be downloaded.'; }
  }
  function renderLibrary() {
    const p = get(); $('library-count').textContent = '(' + library.entries.length + ')';
    options($('library-project'), library.entries.map(e => ({ value: e.id, label: e.project.title + (e.id === p.id ? ' · current' : '') })), selectedProject || p.id);
    selectedProject = $('library-project').value;
    const entry = library.entries.find(e => e.id === selectedProject), rows = entry ? entry.revisions.slice().reverse().map(r => ({ value: String(r.number), label: 'Version ' + r.number + ' · ' + r.label })) : [];
    options($('library-revision'), rows, selectedRevision); selectedRevision = $('library-revision').value;
    $('library-open').disabled = !entry; $('library-restore').disabled = !rows.length; $('library-remove').disabled = !entry || entry.id === p.id; $('revision-remove').disabled = !rows.length; $('library-undo').disabled = !removedLibrary;
  }
  function renderShapes(p) {
    const advanced = meta(p).mode === 'advanced', familiar = ['rectangle', 'square', 'circle', 'annulus', 'cylinder'];
    const rows = D.geometryCatalog().filter(s => advanced || familiar.includes(s.id) || s.id === p.geometry.shapeId).map(s => ({ value: s.id, label: s.name }));
    if (p.geometry.shapeId === 'profile') rows.push({ value: 'profile', label: 'Imported / composed outline' });
    options($('shape-choice'), rows, p.geometry.shapeId);
    $('profile-editor').hidden = p.geometry.shapeId !== 'profile';
    const signature = JSON.stringify(p.geometry) + p.units;
    if (p.geometry.shapeId === 'profile' && signature !== profileSignature) { $('profile-points').value = p.geometry.rings.map(r => r.map(pt => pt.map(n => Number((n / factor(p)).toFixed(8))).join(', ')).join('\n')).join('\n\n'); profileSignature = signature; }
  }
  function quantities(p, units) { return D.measurements(p, units).items.filter(item => /^(?:mm|in)(?:²|³)?$/.test(item.unit) && Number.isFinite(item.value)); }
  function power(unit) { return unit.endsWith('³') ? 3 : unit.endsWith('²') ? 2 : 1; }
  function unitText(unit, p) { return p.units + (unit === 'mm2' ? '²' : unit === 'mm3' ? '³' : ''); }
  function renderChecks(p) {
    const m = meta(p), f = factor(p), previous = $('estimate-quantity').value;
    options($('estimate-quantity'), quantities(p, p.units).map((q, i) => ({ value: String(i), label: q.name + ' (' + q.unit + ')' })), previous);
    const dimensionRows = D.geometryParams(p).filter(q => !q.angle && !q.int).map(q => ({ value: q.k, label: q.name }));
    for (const [key, value] of Object.entries(D.bounds(p))) if (['width', 'height', 'diameter', 'length'].includes(key) && Number.isFinite(value) && !dimensionRows.some(row => row.value === key)) dimensionRows.push({ value: key, label: 'Overall ' + key });
    options($('inspection-dimension'), dimensionRows, $('inspection-dimension').value);
    document.querySelectorAll('.inspection-unit').forEach(el => { el.textContent = p.units; });
    $('assignment-checks').replaceChildren();
    const requirements = W.assessment(p).requirements;
    if (requirements.length) card($('assignment-checks'), 'Compare with your assignment', requirements.map(r => r.key + ': target ' + fmt(r.targetMm / f) + ' ± ' + fmt(r.toleranceMm / f) + ' ' + p.units + ' · ' + (r.actualMm === null ? 'dimension missing from this shape' : 'drawing ' + fmt(r.actualMm / f) + ' ' + p.units + (r.met ? ' · matches' : ' · review the difference'))), requirements.every(r => r.met) ? 'current' : 'outside-tolerance');
    $('checkpoint-list').replaceChildren();
    m.checkpoints.slice().reverse().forEach(c => { const state = W.checkpointStatus(p, c), pow = c.unit === 'mm3' ? 3 : c.unit === 'mm2' ? 2 : 1, scale = c.unit === 'count' ? 1 : Math.pow(f, pow), unit = c.unit === 'count' ? '' : unitText(c.unit, p);
      card($('checkpoint-list'), c.label + ' · ' + state.status.replaceAll('-', ' '), [c.estimate === null ? '' : 'Estimate: ' + fmt(c.estimate / scale) + ' ' + unit,
        c.actual === null ? '' : 'Calculated: ' + fmt(c.actual / scale) + ' ' + unit,
        state.difference === null ? '' : 'Difference: ' + fmt(state.difference / scale) + ' ' + unit, c.working,
        state.stale ? 'The drawing changed after this comparison. Record a new comparison for the current design.' : ''], state.status);
    });
    $('inspection-list').replaceChildren();
    m.inspections.slice().reverse().forEach(i => { const state = W.inspectionStatus(p, i); card($('inspection-list'), i.label + ' · ' + state.status.replaceAll('-', ' '), [
      'Target: ' + fmt(i.nominalMm / f) + ' ' + p.units + ' · measured: ' + (i.measuredMm === null ? 'pending' : fmt(i.measuredMm / f) + ' ' + p.units),
      'Accepted range: ' + fmt(state.minimumMm / f) + ' to ' + fmt(state.maximumMm / f) + ' ' + p.units,
      i.instrument ? 'Source: ' + i.instrument : '', state.resolutionWarning ? 'The instrument resolution is wider than the tolerance range. Use a more precise instrument.' : '',
      state.stale ? 'The drawing changed. Measure the revised dimension again.' : ''], state.status); });
  }
  function renderResults(p) {
    const m = meta(p); $('operation-summary').textContent = m.operation ? 'Planned operation: ' + m.operation.kind.replaceAll('-', ' ') + ' · tool ' + fmt(m.operation.toolDiameterMm / factor(p)) + ' ' + p.units + ' · depth ' + fmt(m.operation.depthMm / factor(p)) + ' ' + p.units + '. Edit the plan and generate its program in CNC practice.' : 'In CNC practice, choose an operation, review the tool and cutting values, generate a program, then capture its checks before returning here.';
    $('machine-results').replaceChildren();
    m.results.slice().reverse().forEach(r => { const state = W.resultStatus(p, r); card($('machine-results'), (state.stale ? 'Earlier design · review required' : 'Current design') + ' · ' + r.kind, [r.summary, r.programLineCount + ' program lines · ' + (r.accepted ? 'Checks accepted' : 'Checks need review'),
      'Estimated removed volume: ' + fmt(r.removedVolumeMm3 / Math.pow(factor(p), 3)) + ' ' + p.units + '³',
      ...r.diagnostics.map(d => d.level + ': ' + d.message), state.stale ? 'The geometry, setup or operation changed after this capture. Generate and check the current plan again.' : 'Captured ' + new Date(r.capturedAt).toLocaleString()], state.status); });
  }
  function renderAssessment(p) {
    const m = meta(p), a = W.assessment(p); $('assessment-summary').replaceChildren();
    card($('assessment-summary'), 'Your learning record', [m.checkpoints.length + ' calculation comparisons · ' + m.inspections.length + ' inspections · ' + m.results.length + ' CNC captures',
      a.results.some(r => r.stale) || a.inspections.some(r => r.stale) || a.checkpoints.some(r => r.stale) ? 'Some evidence belongs to an earlier design. Review the marked records before submitting.' : 'Add your working and explain any changes to the design.',
      m.assignment ? 'Assignment: ' + m.assignment.title + ' · ' + a.reviewedCount + '/' + a.criteria.length + ' criteria reviewed' : 'You can submit learning evidence with or without a class assignment.']);
    $('assignment-summary').textContent = m.assignment ? m.assignment.title + ': ' + m.assignment.brief : 'Open a teacher’s assignment to keep the brief and assessment criteria with your project.';
    const signature = p.id + JSON.stringify(m.assignment);
    if (signature !== rubricSignature) {
      $('assessment-criteria').replaceChildren(); rubricSignature = signature;
      if (m.assignment) {
        $('assessment-criteria').append(element('h3', 'Rubric review'), element('p', 'Scores and comments are entered by a student or teacher; automated checks do not award marks.', 'help'));
        m.assignment.criteria.forEach(c => {
          const section = element('div', undefined, 'rubric-row'); section.append(element('h3', c.title)); if (c.description) section.append(element('p', c.description, 'help'));
          const label = element('label', 'Score out of ' + c.maxScore), score = element('input'); score.type = 'number'; score.min = '0'; score.max = String(c.maxScore); score.step = '1'; score.dataset.criterion = c.id; label.append(score);
          const commentLabel = element('label', 'Comment'), comment = element('textarea'); comment.rows = 2; comment.maxLength = 2000; comment.dataset.criterionComment = c.id; commentLabel.append(comment);
          const reviewerLabel = element('label', 'Reviewer'), reviewer = element('input'); reviewer.maxLength = 160; reviewer.placeholder = 'Self review or teacher name'; reviewer.dataset.criterionReviewer = c.id; reviewerLabel.append(reviewer);
          const save = element('button', 'Record review'); save.type = 'button'; save.onclick = () => mutate(current => W.review(current, { criterionId: c.id, score: score.value === '' ? null : score.valueAsNumber, comment: comment.value, reviewer: reviewer.value }));
          section.append(label, commentLabel, reviewerLabel, save); $('assessment-criteria').append(section);
        });
      }
    }
    document.querySelectorAll('[data-criterion]').forEach(input => { const r = m.reviews.find(v => v.criterionId === input.dataset.criterion), section = input.closest('.rubric-row'); input.value = !r || r.score === null ? '' : r.score; section.querySelector('textarea').value = r ? r.comment : ''; section.querySelector('[data-criterion-reviewer]').value = r ? r.reviewer : ''; });
  }
  function render(p) {
    remember(p); renderLibrary(); const m = meta(p); $('workflow-mode').value = m.mode;
    document.querySelectorAll('[data-advanced]').forEach(el => { el.hidden = m.mode !== 'advanced'; });
    if (p.units !== lastUnits) {
      const ratio = (lastUnits === 'in' ? 25.4 : 1) / factor(p);
      ['inspection-measured', 'inspection-tolerance', 'inspection-resolution', 'assignment-tolerance'].forEach(id => { if ($(id).value !== '' && Number.isFinite($(id).valueAsNumber)) $(id).value = Number(($(id).valueAsNumber * ratio).toFixed(8)); });
      $('estimate-value').value = ''; $('estimate-tolerance').value = '0'; lastUnits = p.units;
    }
    renderShapes(p); renderChecks(p); renderResults(p); renderAssessment(p);
  }
  function appendWorksheet(p) {
    const target = $('print-summary'), m = meta(p), heading = text => target.append(element('h3', text)), para = text => target.append(element('p', text));
    if (m.checkpoints.length) { heading('Numeracy comparisons'); m.checkpoints.forEach(c => para(c.label + ': estimate ' + c.estimate + ', calculated ' + c.actual + ' ' + c.unit + ' · ' + W.checkpointStatus(p, c).status + '. ' + c.working)); }
    if (m.inspections.length) { heading('Inspection'); m.inspections.forEach(i => para(i.label + ': target ' + fmt(i.nominalMm) + ' mm, measured ' + (i.measuredMm === null ? 'pending' : fmt(i.measuredMm) + ' mm') + ' · ' + W.inspectionStatus(p, i).status + '. ' + i.instrument)); }
    if (m.results.length) { heading('CNC learning evidence'); m.results.forEach(r => para(W.resultStatus(p, r).status + ': ' + r.summary + ' · ' + (r.accepted ? 'checks accepted' : 'review required'))); }
    if (m.assignment) { heading('Assignment: ' + m.assignment.title); W.assessment(p).criteria.forEach(c => para(c.title + ': ' + (c.score === null ? 'not reviewed' : c.score + '/' + c.maxScore) + ' ' + c.comment)); }
  }
  $('workflow-mode').onchange = e => mutate(p => { p = W.ensure(p); p.workflow.mode = e.target.value; return p; });
  $('shape-choice').onchange = e => mutate(p => { const starter = D.create(e.target.value); p.geometry = starter.geometry; p.machine = starter.machine; return p; });
  $('profile-apply').onclick = () => mutate(p => { const rings = $('profile-points').value.trim().split(/\n\s*\n/).map(group => group.split(/\n/).map(line => { const parts = line.trim().split(/\s*,\s*/); if (parts.length !== 2 || parts.some(x => x.trim() === '')) throw Error('Each outline point needs two numbers: X, Y.'); return parts.map(Number); })); p.geometry = D.fromProfile({ rings, units: p.units, title: p.title }).geometry; return p; });
  function transformProfile(map) { mutate(p => { if (p.geometry.shapeId !== 'profile') throw Error('Open a measured outline first.'); p.geometry = D.fromProfile({ rings: p.geometry.rings.map(r => r.map(map)), units: 'mm', title: p.title }).geometry; return p; }); }
  $('profile-rotate').onclick = () => transformProfile(([x, y]) => [-y, x]);
  $('profile-mirror').onclick = () => transformProfile(([x, y]) => [-x, y]);
  $('profile-resize').onclick = () => attempt(() => { const scale = $('profile-scale').valueAsNumber; if (!Number.isFinite(scale) || scale < .001 || scale > 1000) throw Error('Choose a scale factor from 0.001 to 1000.'); transformProfile(([x, y]) => [x * scale, y * scale]); });
  $('estimate-save').onclick = () => mutate(p => { const i = Number($('estimate-quantity').value), q = quantities(p, 'mm')[i], shown = quantities(p, p.units)[i]; if (!q || !shown) throw Error('Choose a calculated measurement first.'); if ($('estimate-value').value === '') throw Error('Enter your estimate before recording the comparison.'); const scale = Math.pow(factor(p), power(q.unit)); return W.addCheckpoint(p, { label: q.name, unit: power(q.unit) === 3 ? 'mm3' : power(q.unit) === 2 ? 'mm2' : 'mm', estimate: $('estimate-value').valueAsNumber * scale, actual: q.value, tolerance: $('estimate-tolerance').value === '' ? null : $('estimate-tolerance').valueAsNumber * scale, working: $('estimate-working').value }); });
  $('inspection-save').onclick = () => mutate(p => { if ($('inspection-measured').value === '') throw Error('Enter the measured value first.'); return W.inspect(p, { key: $('inspection-dimension').value, label: $('inspection-dimension').selectedOptions[0].textContent, measured: $('inspection-measured').valueAsNumber, tolerance: $('inspection-tolerance').valueAsNumber, resolution: $('inspection-resolution').value === '' ? null : $('inspection-resolution').valueAsNumber, units: p.units, instrument: $('inspection-source').value }); });
  $('library-project').onchange = () => { selectedProject = $('library-project').value; selectedRevision = ''; renderLibrary(); };
  $('library-revision').onchange = () => { selectedRevision = $('library-revision').value; };
  $('library-open').onclick = () => attempt(() => { const p = W.open(library, $('library-project').value); library = W.activate(library, p.id); app.replaceProject(p); app.notify('Saved project opened. Undo returns to your previous project.'); });
  $('library-restore').onclick = () => attempt(() => { const id = $('library-project').value; library = W.restoreRevision(library, id, Number($('library-revision').value)); selectedRevision = ''; app.replaceProject(W.open(library, id)); writeLibrary(); app.notify('Saved version restored as the current design.'); });
  $('library-remove').onclick = () => attempt(() => { const id = $('library-project').value; if (id === get().id) throw Error('Open a different project before removing this one from the library.'); removedLibrary = library; library = W.remove(library, id); selectedProject = ''; selectedRevision = ''; writeLibrary(); renderLibrary(); app.notify('Project removed from this library. Undo library removal restores it during this visit.'); });
  $('revision-remove').onclick = () => attempt(() => { removedLibrary = library; library = W.removeRevision(library, $('library-project').value, Number($('library-revision').value)); selectedRevision = ''; writeLibrary(); renderLibrary(); app.notify('Saved version removed. Undo library removal restores it during this visit. Your current drawing is unchanged.'); });
  $('library-undo').onclick = () => attempt(() => { if (!removedLibrary) return; const restored = copy(library); for (const old of removedLibrary.entries) { const entry = restored.entries.find(e => e.id === old.id); if (!entry) restored.entries.push(copy(old)); else { for (const revision of old.revisions) if (!entry.revisions.some(r => r.number === revision.number)) entry.revisions.push(copy(revision)); entry.revisions.sort((a, b) => a.number - b.number); while (entry.revisions.length > W.limits.revisions) { const automatic = entry.revisions.findIndex(r => ['Saved edit', 'First saved version'].includes(r.label)); if (automatic < 0) throw Error('Remove another named version before restoring this one.'); entry.revisions.splice(automatic, 1); } } } library = W.validateLibrary(restored); removedLibrary = null; writeLibrary(); renderLibrary(); app.notify('Removed library content restored.'); });
  $('revision-save').onclick = () => attempt(() => { const label = $('revision-name').value.trim(); if (!label) throw Error('Name this version so you can find it later.'); library = W.upsert(library, get(), label); writeLibrary(); selectedProject = get().id; selectedRevision = ''; app.replaceProject(W.open(library, get().id)); renderLibrary(); $('revision-name').value = ''; app.notify('Named version saved: ' + label); });
  $('library-download').onclick = () => attempt(() => app.download('access-design-library.json', W.exportLibrary(library), 'application/json'));
  $('library-import').onclick = () => $('library-file').click();
  $('library-file').onchange = async e => { const file = e.target.files[0]; if (!file) return; try { if (file.size > W.limits.bytes) throw Error('Library backups must be no larger than 4 MB.'); const incoming = W.importLibrary(await file.text()), merged = W.mergeLibrary(library, incoming); library = merged.library; libraryWritable = true; writeLibrary(); renderLibrary(); app.notify('Library backup added with its saved versions. Select a project to open it. Existing projects were kept.'); } catch (error) { app.notify('Library not opened: ' + error.message); } e.target.value = ''; };
  $('assignment-open').onclick = () => $('assignment-file').click();
  $('assignment-file').onchange = async e => { const file = e.target.files[0]; if (!file) return; try { if (file.size > 65536) throw Error('Assignments must be smaller than 64 KB.'); const assignment = W.importAssignment(await file.text()); mutate(p => { p = W.assign(p, assignment); if (!p.brief.trim()) p.brief = assignment.brief; return p; }); } catch (error) { app.notify('Assignment not opened: ' + error.message); } e.target.value = ''; };
  $('assignment-download').onclick = () => attempt(() => { const p = get(), assignment = W.createAssignment(p.geometry.shapeId === 'cylinder' ? 'shaft' : p.geometry.shapeId === 'annulus' ? 'washer' : 'any'); assignment.title = p.title; assignment.brief = p.brief; const criteria = $('assignment-criteria').value.split(/\n/).map(s => s.trim()).filter(Boolean); if (criteria.length) assignment.criteria = criteria.map((title, i) => ({ id: 'criterion-' + (i + 1), title, description: '', maxScore: 4 })); if ($('assignment-dimensions').value === 'yes') { const tolerance = $('assignment-tolerance').valueAsNumber * factor(p), dimensions = D.geometryParams(p).filter(q => !q.angle && !q.int); assignment.requirements = dimensions.length ? dimensions.map(q => ({ key: q.k, targetMm: p.geometry.params[q.k], toleranceMm: tolerance })) : ['width', 'height'].map(key => ({ key, targetMm: D.bounds(p)[key], toleranceMm: tolerance })); } app.download(app.filename() + '.access-assignment.json', W.assignmentJSON(assignment), 'application/json'); });
  $('submission-download').onclick = () => attempt(() => app.download(app.filename() + '.access-submission.json', JSON.stringify(W.submission(get()), null, 2), 'application/json'));
  $('drawing-import').onclick = () => $('drawing-file').click();
  $('drawing-file').onchange = async e => { const file = e.target.files[0]; if (!file) return; try { if (file.size > 2 * 1024 * 1024) throw Error('Use a drawing smaller than 2 MB.'); const format = file.name.toLowerCase().endsWith('.dxf') ? 'dxf' : file.name.toLowerCase().endsWith('.svg') ? 'svg' : ''; if (!format) throw Error('Choose an SVG or DXF drawing.'); const p = get(), imported = window.AccessDesignCAM.importDrawing(await file.text(), format, { units: $('import-units').value, title: p.title, document }); const next = imported.project || imported; app.update(current => { current.geometry = next.geometry; current.machine = 'mill'; }); $('drawing-import-message').textContent = 'Drawing opened as a measured outline. Review its dimensions and stock fit before continuing.'; } catch (error) { $('drawing-import-message').textContent = 'Drawing not opened: ' + error.message; app.notify('Drawing not opened: ' + error.message); } e.target.value = ''; };
  window.addEventListener('design-workshop-render', e => render(e.detail));
  window.addEventListener('design-workshop-worksheet', e => appendWorksheet(e.detail));
  render(get()); app.refresh();
})();
