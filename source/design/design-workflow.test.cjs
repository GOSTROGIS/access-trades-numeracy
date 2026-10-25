'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const W = require('../../numeracy-hub/design/design-workflow.js');
const D = require('../../numeracy-hub/design/design-model.js');
const fs = require('node:fs');
const vm = require('node:vm');
const copy = value => JSON.parse(JSON.stringify(value));
const at = '2026-10-24T12:00:00.000Z';
const plate = () => { const p = D.create('plate'); p.brief = 'Make and explain a plate.'; return W.ensure(p); };
const operation = { kind: 'profile-out', toolDiameterMm: 6, depthMm: 2, stepDownMm: 1, feedMmPerMin: 120, spindleRpm: 1800 };

test('workflow defaults preserve legacy project readability and browser validation has no model dependency', () => {
  const p = D.create(); assert.equal(p.workflow, undefined);
  const ready = W.ensure(p); assert.equal(ready.workflow.revision, 1); assert.equal(ready.workflow.operation, null); assert.equal(p.workflow, undefined);
  assert.deepEqual(D.validate(ready), ready);
  const context = vm.createContext({}); vm.runInContext(fs.readFileSync(require.resolve('../../numeracy-hub/design/design-workflow.js'), 'utf8'), context);
  assert.equal(context.AccessDesignWorkflow.defaultMetadata().mode, 'guided');
  assert.equal(context.AccessDesignWorkflow.validateMetadata(context.AccessDesignWorkflow.defaultMetadata()).version, 1);
});

test('metadata validation rejects unknown fields, getters, malformed scores and excessive data', () => {
  let m = W.defaultMetadata(); m.unexpected = true; assert.throws(() => W.validateMetadata(m), /Unexpected/);
  m = W.defaultMetadata(); Object.defineProperty(m, 'mode', { enumerable: true, get() { throw Error('getter must not execute'); } }); assert.throws(() => W.validateMetadata(m), /Unexpected/);
  m = W.defaultMetadata(); m.revision = Infinity; assert.throws(() => W.validateMetadata(m), /revision/);
  m = W.defaultMetadata(); m.reviews.push({ criterionId: 'missing', score: 1, comment: '', reviewer: '' }); assert.throws(() => W.validateMetadata(m), /criterion/);
  m = W.defaultMetadata(); m.operation = { ...operation, stepDownMm: 3 }; assert.throws(() => W.validateMetadata(m), /Step down/);
});

test('fingerprints track manufacturing dependencies and exclude reflection and grading', () => {
  const p = plate(), f = W.fingerprint(p); const edited = copy(p); edited.reflection = 'I checked units.';
  assert.equal(W.fingerprint(edited), f);
  edited.workflow.mode = 'advanced'; assert.equal(W.fingerprint(edited), f);
  edited.geometry.params.l += 1; assert.notEqual(W.fingerprint(edited), f);
  const units = copy(p); units.units = 'in'; assert.notEqual(W.fingerprint(units), f);
  assert.equal(W.geometryFingerprint(units), W.geometryFingerprint(p));
  assert.notEqual(W.fingerprint(W.setOperation(p, operation)), f);
  const same = copy(p); same.geometry.params = { w: p.geometry.params.w, l: p.geometry.params.l }; assert.equal(W.fingerprint(same), f);
});

test('results are revision-bound evidence and become stale without being deleted', () => {
  const p = W.setOperation(plate(), operation);
  const next = W.recordResult(p, { capturedAt: at, accepted: true, summary: 'Simulator accepted the program.', actionCount: 3, removedVolumeMm3: 40 });
  const r = next.workflow.results[0]; assert.equal(r.actionCount, 3); assert.equal(W.resultStatus(next, r).status, 'current');
  const revised = copy(next); revised.stock.width += 10;
  assert.equal(W.resultStatus(revised, r).status, 'stale'); assert.equal(revised.workflow.results.length, 1);
  assert.equal(p.workflow.results.length, 0);
  assert.throws(() => W.recordResult(p, { removedVolumeMm3: NaN }), /removed volume/);
});

test('revision updates ignore no-op edits and retain original immutable inputs', () => {
  const p = plate(); assert.equal(W.syncMetadata(copy(p), p).workflow.revision, 1);
  const edited = copy(p); edited.reflection = 'New working'; const next = W.syncMetadata(edited, p);
  assert.equal(next.workflow.revision, 2); assert.equal(p.workflow.revision, 1);
  assert.equal(next.reflection, 'New working');
});

test('estimate checkpoints preserve units and invalidate only when geometry changes', () => {
  const p = W.addCheckpoint(plate(), { label: 'Estimated length', unit: 'mm', estimate: 79, actual: 80, tolerance: 2, working: 'Measure twice.' });
  const c = p.workflow.checkpoints[0]; assert.equal(W.checkpointStatus(p, c).status, 'within-tolerance');
  const setup = copy(p); setup.stock.width += 2; setup.units = 'in'; assert.equal(W.checkpointStatus(setup, c).status, 'within-tolerance');
  setup.geometry.params.l += 2; assert.equal(W.checkpointStatus(setup, c).status, 'stale');
  const pending = W.addCheckpoint(p, { label: 'Area estimate', unit: 'mm2' }); assert.equal(W.checkpointStatus(pending, pending.workflow.checkpoints[1]).status, 'pending');
});

test('inspection compares entered measurements and explicit asymmetric tolerance in physical mm', () => {
  const p = plate(); p.geometry.params.l = 25.4;
  const inspected = W.inspect(p, { key: 'l', measured: 1.001, toleranceMinus: .001, tolerancePlus: .002, resolution: .0001, units: 'in', instrument: 'Caliper', recordedAt: at });
  const i = inspected.workflow.inspections[0], result = W.inspectionStatus(inspected, i);
  assert.ok(Math.abs(i.measuredMm - 25.4254) < 1e-9); assert.equal(result.status, 'within-tolerance'); assert.ok(Math.abs(result.deviationMm - .0254) < 1e-9);
  assert.equal(i.nominalMm, 25.4); assert.match(result.message, /entered measurement/);
  const outside = W.inspect(p, { key: 'l', measured: 26, tolerance: .1, resolution: .5 });
  assert.equal(W.inspectionStatus(outside, outside.workflow.inspections[0]).status, 'outside-tolerance');
  assert.equal(W.inspectionStatus(outside, outside.workflow.inspections[0]).resolutionWarning, true);
});

test('inspection handles missing observations, stale dimensions and bad inputs', () => {
  const p = W.inspect(plate(), { key: 'width', measured: null, tolerance: .1 });
  assert.equal(W.inspectionStatus(p, p.workflow.inspections[0]).status, 'pending');
  const changed = copy(p); changed.geometry.params.l = 90; assert.equal(W.inspectionStatus(changed, changed.workflow.inspections[0]).status, 'stale');
  assert.throws(() => W.inspect(p, { key: 'count', measured: 4 }), /length/);
  assert.throws(() => W.inspect(p, { key: 'missing', measured: 4 }), /dimension/);
  assert.throws(() => W.inspect(p, { key: 'l', measured: Infinity }), /measured/);
  assert.throws(() => W.inspect(p, { key: 'l', measured: '80' }), /measured/);
  assert.throws(() => W.inspect(p, { key: 'l', measured: 2, tolerance: -1 }), /tolerance/);
  assert.throws(() => W.inspect(p, { key: 'l', measured: 2, units: 'ft' }), /units/);
  assert.throws(() => W.inspect(p, { key: 'l', measured: 2, recordedAt: '2026-02-30T12:00:00.000Z' }), /date/);
});

test('assignments round-trip explicitly and reject malformed or unknown formats', () => {
  const a = W.createAssignment('plate'); a.title = 'Plate and measurements'; a.requirements.push({ key: 'l', targetMm: 80, toleranceMm: .1 });
  assert.deepEqual(W.importAssignment(W.assignmentJSON(a)), a);
  assert.throws(() => W.importAssignment('{bad'), /JSON/);
  assert.throws(() => W.importAssignment(JSON.stringify({ ...a, version: 2 })), /version/);
  assert.throws(() => W.importAssignment(' '.repeat(65537)), /size/);
  const duplicate = copy(a); duplicate.criteria.push(copy(duplicate.criteria[0])); assert.throws(() => W.validateAssignment(duplicate), /Duplicate/);
});

test('rubrics keep teacher scores separate from automatic requirement checks', () => {
  const a = W.createAssignment('plate'); a.requirements.push({ key: 'l', targetMm: 80, toleranceMm: 0 });
  let p = W.assign(plate(), a), result = W.assessment(p);
  assert.equal(result.requirements[0].met, true); assert.equal(result.totalAwarded, 0); assert.equal(result.complete, false);
  p = W.review(p, { criterionId: a.criteria[0].id, score: 3, comment: 'Show the conversion.', reviewer: 'Instructor' });
  result = W.assessment(p); assert.equal(result.totalAwarded, 3); assert.equal(result.reviewedCount, 1); assert.equal(result.complete, false);
  assert.throws(() => W.review(p, { criterionId: a.criteria[0].id, score: 5 }), /score/);
  assert.throws(() => W.review(p, { criterionId: 'missing', score: 2 }), /criterion/);
  const replaced = W.assign(p, W.createAssignment('washer')); assert.deepEqual(replaced.workflow.reviews, []);
});

test('submission snapshots the exact editable project and grading context', () => {
  const p = W.inspect(plate(), { key: 'l', measured: 80, tolerance: .1 });
  const saved = W.submission(p, at); assert.equal(saved.format, 'access-design-submission'); assert.equal(saved.submittedAt, at);
  assert.deepEqual(saved.project, p); saved.project.title = 'Changed copy'; assert.notEqual(saved.project.title, p.title);
  assert.match(saved.assessment.note, /do not award marks/);
});

test('library holds independent projects and exports all records without mutation', () => {
  const a = plate(), b = W.ensure(D.create('washer')), initial = W.createLibrary();
  let lib = W.upsert(initial, a, undefined, at); lib = W.upsert(lib, b, undefined, at);
  assert.equal(lib.entries.length, 2); assert.equal(initial.entries.length, 0); assert.equal(lib.activeId, b.id);
  const reopened = W.open(lib, a.id); reopened.title = 'Detached'; assert.equal(W.open(lib, a.id).title, a.title);
  assert.deepEqual(W.importLibrary(W.exportLibrary(lib)), lib);
  assert.equal(W.activate(lib, a.id).activeId, a.id); assert.equal(W.remove(lib, b.id).entries.length, 1);
  assert.throws(() => W.open(lib, 'missing'), /library/);
});

test('named versions survive automatic edit pruning and unchanged projects can be named', () => {
  let p = plate(), lib = W.upsert(W.createLibrary(), p, undefined, at);
  lib = W.upsert(lib, W.open(lib, p.id), 'Before machining', at);
  const named = lib.entries[0].revisions.find(r => r.label === 'Before machining'); assert.equal(named.number, 2);
  for (let k = 0; k < 25; k++) { p = W.open(lib, p.id); p.reflection = 'Edit ' + k; lib = W.upsert(lib, p, undefined, at); }
  assert.equal(lib.entries[0].revisions.length, 12); assert.ok(lib.entries[0].revisions.some(r => r.label === 'Before machining'));
  const restored = W.restoreRevision(lib, p.id, named.number, at); assert.equal(W.open(restored, p.id).reflection, named.project.reflection);
  assert.ok(W.open(restored, p.id).workflow.revision > W.open(lib, p.id).workflow.revision);
});

test('twelve named versions keep autosave head editable without deleting historical snapshots', () => {
  let p = plate(), lib = W.upsert(W.createLibrary(), p, undefined, at);
  for (let k = 0; k < 12; k++) lib = W.upsert(lib, W.open(lib, p.id), 'Named ' + k, at);
  const numbers = lib.entries[0].revisions.map(r => r.number); assert.equal(numbers.length, 12);
  p = W.open(lib, p.id); p.reflection = 'Unsnapshotted current head'; lib = W.upsert(lib, p, undefined, at);
  assert.deepEqual(lib.entries[0].revisions.map(r => r.number), numbers); assert.equal(W.open(lib, p.id).reflection, p.reflection);
  assert.ok(W.open(lib, p.id).workflow.revision > numbers.at(-1));
  assert.throws(() => W.upsert(lib, W.open(lib, p.id), 'Thirteenth'), /12 named/);
  const restored = W.restoreRevision(lib, p.id, numbers[0], at); assert.deepEqual(restored.entries[0].revisions.map(r => r.number), numbers);
  const removed = W.removeRevision(lib, p.id, numbers[0]); assert.equal(removed.entries[0].revisions.length, 11);
  assert.equal(W.upsert(removed, W.open(removed, p.id), 'Replacement name', at).entries[0].revisions.length, 12);
});

test('library validation rejects duplicate identities, invalid head/revision links and excessive projects', () => {
  const lib = W.upsert(W.createLibrary(), plate(), undefined, at);
  let bad = copy(lib); bad.entries.push(copy(bad.entries[0])); assert.throws(() => W.validateLibrary(bad), /Duplicate/);
  bad = copy(lib); bad.entries[0].revisions[0].project.id = 'other'; assert.throws(() => W.validateLibrary(bad), /identity/);
  bad = copy(lib); bad.entries[0].revisions[0].number = 999; assert.throws(() => W.validateLibrary(bad), /newer/);
  bad = copy(lib); bad.activeId = 'missing'; assert.throws(() => W.validateLibrary(bad), /active project/);
  let full = W.createLibrary(); for (let k = 0; k < 20; k++) full = W.upsert(full, plate(), undefined, at);
  assert.throws(() => W.upsert(full, plate(), undefined, at), /20 projects/);
});

test('library backup merge preserves named histories and creates copies for conflicts', () => {
  const p = plate(); p.workflow.revision = 8;
  let original = W.upsert(W.createLibrary(), p, 'Before cutting', at); assert.equal(original.entries[0].project.workflow.revision, 8);
  const modified = W.open(original, p.id); modified.reflection = 'Local work';
  const current = W.upsert(original, modified, 'Local version', at);
  const restored = W.mergeLibrary(W.createLibrary(), current);
  assert.deepEqual(restored.library, current); assert.equal(restored.imported, 1);
  const conflict = W.mergeLibrary(current, original);
  assert.equal(conflict.copied, 1); assert.equal(conflict.library.entries.length, 2);
  assert.equal(W.open(conflict.library, p.id).reflection, 'Local work');
  const imported = conflict.library.entries.find(e => e.id !== p.id);
  assert.equal(imported.revisions[0].label, 'Before cutting'); assert.equal(imported.revisions[0].project.id, imported.id);
  assert.match(imported.project.title, /imported copy/);
  assert.deepEqual(W.mergeLibrary(current, current).library, current); assert.equal(W.mergeLibrary(current, current).skipped, 1);
  assert.equal(original.entries.length, 1);
});

test('atomic save uses one record and retains in-memory changes on quota failure', () => {
  const lib = W.upsert(W.createLibrary(), plate(), undefined, at), calls = [], store = { setItem: (...args) => calls.push(args), getItem: () => calls[0][1] };
  assert.equal(W.saveLibrary(store, lib).ok, true); assert.equal(calls.length, 1); assert.equal(calls[0][0], W.storageKey);
  assert.deepEqual(W.loadLibrary(store).library, lib);
  const failed = W.saveLibrary({ setItem() { throw Error('QuotaExceeded'); } }, lib); assert.equal(failed.ok, false); assert.deepEqual(failed.library, lib); assert.match(failed.message, /Download/);
});

test('damaged or blocked storage is never overwritten automatically', () => {
  let writes = 0; const corrupt = { getItem: () => '{damaged', setItem: () => { writes++; } };
  const result = W.loadLibrary(corrupt); assert.equal(result.ok, false); assert.equal(writes, 0); assert.equal(result.library.entries.length, 0); assert.match(result.message, /left unchanged/);
  assert.equal(W.loadLibrary({ getItem() { throw Error('Blocked'); } }).ok, false);
  assert.equal(W.loadLibrary({ getItem: () => null }).ok, true);
  assert.throws(() => W.importLibrary('x'.repeat(W.limits.bytes + 1)), /size/);
});

const sequence = () => ({ version: 1, steps: [
  { id: 'rough', label: 'Rough the pocket', operation: { ...operation, kind: 'pocket', depthMm: 4 } },
  { id: 'finish', label: 'Finish the edge', operation: { ...operation, toolDiameterMm: 4 } }
] });
function millComparison(p) {
  const settings = W.getComparison(p);
  return { version: 1, machine: 'mill', ...settings, resolutionMm: .5, status: 'needs-work',
    metrics: { sampleCount: 1000, desiredVolumeMm3: 40000, actualVolumeMm3: 42000, missingVolumeMm3: 0, excessVolumeMm3: 2000, maxUndercutMm: 0, maxExcessMm: 2, mismatchedPercent: 5 },
    observations: ['Some material remains outside the target.'], limitations: ['Sampled simulator material is not physical inspection.'],
    overlay: { kind: 'mill-map', columns: 2, rows: 2, widthMm: 90, heightMm: 60, cells: '0023' } };
}

test('legacy fingerprints and captured evidence remain readable until sequence opt-in', () => {
  const fixture = D.create('plate'); fixture.id = 'legacy-fixture';
  assert.equal(W.fingerprint(fixture), 'design-v1-2f5f06e3');
  let p = W.setOperation(fixture, operation);
  p = W.recordResult(p, { id: 'legacy-result', capturedAt: at, accepted: true });
  const oldHash = W.fingerprint(p), oldResult = p.workflow.results[0];
  assert.equal(W.resultStatus(W.ensure(p), oldResult).status, 'current');
  const resolved = W.getSequence(p);
  assert.equal(resolved.steps[0].id, 'legacy-operation'); assert.deepEqual(resolved.steps[0].operation, operation);
  resolved.steps[0].label = 'Changed detached label'; assert.equal(W.fingerprint(p), oldHash);
  const migrated = W.setSequence(p, W.getSequence(p));
  assert.match(W.fingerprint(migrated), /^design-v2-/);
  assert.equal(W.resultStatus(migrated, oldResult).status, 'stale');
  assert.equal(p.workflow.sequence, undefined);
});

test('ordered sequence survives project/library export and invalidates evidence on order or tool edits', () => {
  let p = W.setSequence(plate(), sequence());
  assert.equal(p.workflow.operation.kind, 'pocket');
  p = W.recordResult(p, { operationKind: 'sequence', operationCount: 2, accepted: true, capturedAt: at });
  const capture = p.workflow.results[0], hash = W.fingerprint(p);
  assert.equal(W.resultStatus(p, capture).stale, false);
  const reordered = W.getSequence(p); reordered.steps.reverse();
  const otherOrder = W.setSequence(p, reordered);
  assert.notEqual(W.fingerprint(otherOrder), hash); assert.equal(W.resultStatus(otherOrder, capture).stale, true);
  const toolChange = W.getSequence(p); toolChange.steps[1].operation.toolDiameterMm += 1;
  assert.notEqual(W.fingerprint(W.setSequence(p, toolChange)), hash);
  const relabel = W.getSequence(p); relabel.steps[0].label = 'Revised plan'; assert.notEqual(W.fingerprint(W.setSequence(p, relabel)), hash);
  const lib = W.importLibrary(W.exportLibrary(W.upsert(W.createLibrary(), p, 'Two stages', at)));
  assert.deepEqual(W.getSequence(W.open(lib, p.id)), sequence());
  assert.equal(W.open(lib, p.id).workflow.results[0].operationCount, 2);
  assert.equal(W.setOperation(p, operation).workflow.sequence, undefined);
  const empty = W.setSequence(p, { version: 1, steps: [] }); assert.equal(empty.workflow.operation, null); assert.equal(W.getSequence(empty).steps.length, 0);
});

test('sequence validates bounded IDs, operations and structure without executing getters', () => {
  const s = sequence(); s.steps.push(copy(s.steps[0])); assert.throws(() => W.validateSequence(s), /Duplicate/);
  const excessive = { version: 1, steps: Array.from({ length: 13 }, (_, i) => ({ id: String(i), label: 'Operation', operation })) };
  assert.throws(() => W.validateSequence(excessive), /at most 12/);
  assert.throws(() => W.validateSequence({ ...sequence(), version: 2 }), /version/);
  const invalid = sequence(); invalid.steps[0].operation = null; assert.throws(() => W.validateSequence(invalid), /needs an operation/);
  const getter = sequence(); Object.defineProperty(getter.steps[0], 'label', { enumerable: true, get() { throw Error('must not execute'); } }); assert.throws(() => W.validateSequence(getter), /Unexpected/);
  for (const kind of ['clear-outside', 'face', 'part']) assert.equal(W.validateOperation({ ...operation, kind }).kind, kind);
});

test('comparison settings are explicit physical targets and invalidate only manufacturing evidence', () => {
  const p = W.setSequence(plate(), sequence()), f = W.fingerprint(p), g = W.geometryFingerprint(p);
  assert.deepEqual(W.getComparison(p), { mode: 'pocket', depthMm: 2, toleranceMm: .1, faceAllowanceMm: 0 });
  const changed = W.setComparison(p, { mode: 'pocket', depthMm: 4, toleranceMm: .25 });
  assert.notEqual(W.fingerprint(changed), f); assert.equal(W.geometryFingerprint(changed), g);
  assert.equal(p.workflow.comparison, undefined);
  const tolerance = W.setComparison(changed, { ...W.getComparison(changed), toleranceMm: .3 }); assert.notEqual(W.fingerprint(tolerance), W.fingerprint(changed));
  assert.throws(() => W.setComparison(p, { mode: 'pocket', depthMm: 11, toleranceMm: .1 }), /stock depth/);
  assert.throws(() => W.setComparison(p, { mode: 'pocket', depthMm: null, toleranceMm: .1 }), /stock depth/);
  const shaft = D.create('shaft'); assert.deepEqual(W.getComparison(shaft), { mode: 'retained-solid', depthMm: null, toleranceMm: .1, faceAllowanceMm: 0 });
  assert.throws(() => W.setComparison(shaft, { mode: 'pocket', depthMm: 2, toleranceMm: .1 }), /cylinder/);
});

test('captured comparison retains bounded scalar evidence and compact map through submission and library', () => {
  let p = W.setComparison(W.setSequence(plate(), sequence()), { mode: 'pocket', depthMm: 4, toleranceMm: .2 });
  const comparison = millComparison(p);
  p = W.recordResult(p, { operationKind: 'sequence', operationCount: 2, comparison, accepted: true, capturedAt: at });
  const r = p.workflow.results[0]; assert.deepEqual(r.comparison, comparison);
  comparison.overlay.cells = '1111'; assert.equal(r.comparison.overlay.cells, '0023');
  assert.equal(W.submission(p, at).project.workflow.results[0].comparison.metrics.excessVolumeMm3, 2000);
  const reopened = W.open(W.importLibrary(W.exportLibrary(W.upsert(W.createLibrary(), p))), p.id);
  assert.deepEqual(reopened.workflow.results[0].comparison, r.comparison);
  assert.equal(W.resultStatus(reopened, r).status, 'current');
  const changed = W.setComparison(p, { ...W.getComparison(p), toleranceMm: .3 }); assert.equal(W.resultStatus(changed, r).status, 'stale');
  const reflection = copy(p); reflection.reflection = 'I need another finishing pass.'; assert.equal(W.resultStatus(reflection, r).status, 'current');
  assert.throws(() => W.recordResult(changed, { comparison: r.comparison }), /current target/);
});

test('comparison evidence rejects raw fields, oversized maps, invalid metrics and incompatible context', () => {
  const p = plate(), result = millComparison(p);
  assert.throws(() => W.validateComparisonResult({ ...result, rawHeightfield: [] }), /Unexpected/);
  const bad = copy(result); bad.overlay.cells = '002'; assert.throws(() => W.validateComparisonResult(bad), /dimensions/);
  bad.overlay.cells = '002X'; assert.throws(() => W.validateComparisonResult(bad), /dimensions/);
  bad.overlay.columns = 49; assert.throws(() => W.validateComparisonResult(bad), /columns/);
  const invalid = copy(result); invalid.metrics.mismatchedPercent = 101; assert.throws(() => W.validateComparisonResult(invalid), /percentage/);
  invalid.metrics.mismatchedPercent = 3; invalid.metrics.sampleCount = 1.5; assert.throws(() => W.validateComparisonResult(invalid), /samples/);
  assert.throws(() => W.validateComparisonResult({ ...result, observations: Array(9).fill('Long record') }), /at most 8/);
  assert.throws(() => W.validateComparisonResult({ ...result, resolutionMm: 0 }), /resolution/);
  assert.equal(W.validateComparisonResult({ ...result, status: 'incomplete', resolutionMm: 0, overlay: null }).status, 'incomplete');
  assert.throws(() => W.recordResult(p, { operationCount: 13 }), /operation count/);
});

test('lathe comparison charts preserve bounded physical diameter samples and reject reversed order', () => {
  const p = D.create('shaft'), r = { ...millComparison(plate()), machine: 'lathe', depthMm: null, mode: 'retained-solid',
    overlay: { kind: 'lathe-chart', lengthMm: 100, targetDiameterMm: 30, samples: [{ zMm: 0, diameterMm: 32 }, { zMm: 100, diameterMm: 30 }] } };
  const saved = W.recordResult(p, { comparison: r, operationKind: 'turn', operationCount: 1 });
  assert.equal(saved.workflow.results[0].comparison.overlay.samples.length, 2);
  const reversed = copy(r); reversed.overlay.samples.reverse(); assert.throws(() => W.validateComparisonResult(reversed), /ordered/);
  const tooMany = copy(r); tooMany.overlay.samples = Array.from({ length: 193 }, (_, i) => ({ zMm: i / 2, diameterMm: 30 })); assert.throws(() => W.validateComparisonResult(tooMany), /at most 192/);
  const outside = copy(r); outside.overlay.samples[1].zMm = 101; assert.throws(() => W.validateComparisonResult(outside), /position/);
  const wrong = copy(r); wrong.machine = 'mill'; wrong.depthMm = 2; assert.throws(() => W.validateComparisonResult(wrong), /lathe chart/);
});

test('stock and machine changes retain old targets for undo but resolve usable current comparison controls', () => {
  let p = W.setComparison(plate(), { mode: 'pocket', depthMm: 8, toleranceMm: .2 });
  p = W.recordResult(p, { comparison: millComparison(p), accepted: true });
  const old = p.workflow.results[0], shallower = copy(p); shallower.stock.depth = 3;
  assert.equal(D.validate(shallower).stock.depth, 3);
  assert.deepEqual(W.getComparison(shallower), { mode: 'pocket', depthMm: 3, toleranceMm: .2, faceAllowanceMm: 0 });
  assert.equal(W.comparisonState(shallower).adjusted, true);
  assert.equal(shallower.workflow.comparison.depthMm, 8); assert.equal(W.resultStatus(shallower, old).status, 'stale');
  const cylinder = D.create('shaft'); cylinder.id = p.id; cylinder.workflow = copy(p.workflow);
  assert.deepEqual(W.getComparison(cylinder), { mode: 'retained-solid', depthMm: null, toleranceMm: .2, faceAllowanceMm: 0 });
  assert.equal(cylinder.workflow.comparison.mode, 'pocket'); assert.equal(W.resultStatus(cylinder, old).status, 'stale');
  const saved = W.setComparison(cylinder, W.getComparison(cylinder)); assert.equal(W.comparisonState(saved).adjusted, false);
  const back = plate(); back.workflow = copy(saved.workflow); assert.equal(W.getComparison(back).depthMm, back.stock.depth);
});

test('comparison evidence with an earlier implicit goal cannot be revalidated by a legacy source hash', () => {
  const p = plate(), result = W.recordResult(p, { comparison: millComparison(p), accepted: true }).workflow.results[0];
  assert.equal(W.resultStatus(p, result).status, 'current');
  const earlierGoal = copy(result); earlierGoal.comparison.mode = 'retained-solid'; earlierGoal.comparison.depthMm = p.stock.depth;
  assert.equal(earlierGoal.sourceFingerprint, W.fingerprint(p));
  assert.equal(W.resultStatus(p, earlierGoal).status, 'stale');
  assert.equal(W.resultStatus(p, { ...result, comparison: { ...result.comparison, toleranceMm: .5 } }).status, 'stale');
});

test('a near-limit library backup remains within the same import size budget', () => {
  const lib = W.createLibrary();
  for (let i = 0; i < 3; i++) {
    const p = plate(); p.id = 'large-backup-' + i; p.workflow.revision = 12;
    p.workflow.checkpoints = Array.from({ length: 25 }, (_, j) => ({ id: 'calculation-' + j, label: 'Calculation', unit: 'mm2', estimate: 100, actual: 101, tolerance: 1, working: 'x'.repeat(4000), sourceFingerprint: W.geometryFingerprint(p) }));
    const revisions = Array.from({ length: 12 }, (_, j) => { const saved = copy(p); saved.workflow.revision = j + 1; return { number: j + 1, label: 'Saved edit', at, project: saved }; });
    lib.entries.push({ id: p.id, project: p, updatedAt: at, revisions });
  }
  lib.activeId = lib.entries[0].id;
  const valid = W.validateLibrary(lib), exported = W.exportLibrary(valid);
  assert.ok(Buffer.byteLength(exported) <= W.limits.bytes);
  assert.ok(Buffer.byteLength(JSON.stringify(valid, null, 2)) > W.limits.bytes, 'fixture exposes pretty-print growth above the import limit');
  const restored = W.importLibrary(exported); assert.equal(restored.entries.length, 3); assert.equal(restored.entries[0].revisions.length, 12);
});

test('face and part plans round-trip without changing the meaning of part radial peck depth', () => {
  const face = { ...operation, kind: 'face', depthMm: 2, stepDownMm: .5 };
  const part = { ...operation, kind: 'part', depthMm: .5, stepDownMm: 1 };
  assert.equal(W.validateOperation(part).stepDownMm, 1);
  assert.throws(() => W.validateOperation({ ...part, kind: 'face' }), /Step down/);
  const p = W.setSequence(D.create('shaft'), { version: 1, steps: [{ id: 'face', label: 'Face the bar', operation: face }, { id: 'part', label: 'Part off', operation: part }] });
  assert.equal(W.getSequence(D.decode(D.encode(p))).steps[1].operation.kind, 'part');
  assert.equal(W.recordResult(p, { operationKind: 'part', operationCount: 2 }).workflow.results[0].operationKind, 'part');
});

test('optional zero face allowance preserves old v2 files and fingerprints until explicitly saved', () => {
  let p = D.create('plate'); p.id = 'legacy-goal-v2';
  p = W.setComparison(p, { mode: 'pocket', depthMm: 4, toleranceMm: .2 });
  assert.equal(W.fingerprint(p), 'design-v2-c73d47ba');
  assert.equal(Object.hasOwn(p.workflow.comparison, 'faceAllowanceMm'), false);
  assert.equal(W.getComparison(p).faceAllowanceMm, 0);
  const reopened = D.decode(D.encode(p));
  assert.equal(W.fingerprint(reopened), W.fingerprint(p)); assert.equal(Object.hasOwn(reopened.workflow.comparison, 'faceAllowanceMm'), false);
  const explicit = W.setComparison(p, W.getComparison(p)); assert.equal(explicit.workflow.comparison.faceAllowanceMm, 0); assert.notEqual(W.fingerprint(explicit), W.fingerprint(p));
  const legacySummary = millComparison(p); delete legacySummary.faceAllowanceMm;
  const captured = W.recordResult(p, { comparison: legacySummary, accepted: true }); assert.equal(W.resultStatus(captured, captured.workflow.results[0]).status, 'current');
});

test('mill face goals use an absolute original-top floor and keep facing-only equality valid', () => {
  const p = plate(), goal = { mode: 'pocket', depthMm: 4, toleranceMm: .2, faceAllowanceMm: 1 };
  assert.deepEqual(W.getComparison(W.setComparison(p, goal)), goal);
  assert.equal(W.setComparison(p, { ...goal, faceAllowanceMm: 4 }).workflow.comparison.faceAllowanceMm, 4);
  assert.throws(() => W.setComparison(p, { ...goal, faceAllowanceMm: 5 }), /faced surface/);
  assert.throws(() => W.setComparison(p, { ...goal, depthMm: p.stock.depth, faceAllowanceMm: p.stock.depth }), /faced surface/);
  assert.throws(() => W.setComparison(p, { ...goal, faceAllowanceMm: -1 }), /face allowance/);
  assert.throws(() => W.setComparison(p, { ...goal, faceAllowanceMm: '1' }), /face allowance/);
  const old = W.setComparison(p, { ...goal, faceAllowanceMm: 3 }); old.stock.depth = 2;
  assert.equal(old.workflow.comparison.faceAllowanceMm, 3); assert.equal(D.validate(old).stock.depth, 2);
  const safe = W.comparisonState(old); assert.equal(safe.adjusted, true); assert.ok(safe.settings.faceAllowanceMm < 2); assert.equal(safe.settings.depthMm, 2);
});

test('facing changes invalidate captured comparison evidence and target matching uses semantic zero', () => {
  const p = W.setComparison(plate(), { mode: 'pocket', depthMm: 4, toleranceMm: .2, faceAllowanceMm: 1 });
  const saved = W.recordResult(p, { comparison: millComparison(p), accepted: true }), result = saved.workflow.results[0];
  assert.equal(result.comparison.faceAllowanceMm, 1);
  const changed = W.setComparison(saved, { ...W.getComparison(saved), faceAllowanceMm: 2 });
  assert.equal(W.resultStatus(changed, result).status, 'stale'); assert.equal(changed.workflow.results.length, 1);
  assert.throws(() => W.recordResult(changed, { comparison: result.comparison }), /current target/);
  const wrong = millComparison(p); wrong.faceAllowanceMm = 5; assert.throws(() => W.validateComparisonResult(wrong), /floor/);
});

test('lathe faced-front goals fit the fixed target length and adapt after stock edits without rewriting history', () => {
  const p = D.create('shaft'), goal = { mode: 'retained-solid', depthMm: null, toleranceMm: .2, faceAllowanceMm: 2 };
  const saved = W.setComparison(p, goal); assert.deepEqual(W.getComparison(saved), goal);
  assert.throws(() => W.setComparison(p, { ...goal, faceAllowanceMm: p.stock.length - p.geometry.params.h + 1 }), /target length/);
  const short = copy(saved); short.stock.length = short.geometry.params.h + 1;
  assert.equal(short.workflow.comparison.faceAllowanceMm, 2); assert.equal(W.getComparison(short).faceAllowanceMm, 1); assert.equal(W.comparisonState(short).adjusted, true);
});

function facedLatheEvidence(p) {
  return { ...millComparison(plate()), machine: 'lathe', ...W.getComparison(p),
    overlay: { kind: 'lathe-chart', lengthMm: p.geometry.params.h, targetDiameterMm: p.geometry.params.r * 2, samples: [{ zMm: 0, diameterMm: p.geometry.params.r * 2 }, { zMm: p.geometry.params.h, diameterMm: p.geometry.params.r * 2 }] },
    dimensions: { source: 'detached', pieceCount: 1, expectedFrontMm: 88, actualFrontMm: 88.05, expectedLengthMm: 80, actualLengthMm: 79.9, frontErrorMm: .05, lengthErrorMm: -.1 } };
}

test('sampled detached length and faced-front evidence survive project library and submission', () => {
  const p = W.setComparison(D.create('shaft'), { mode: 'retained-solid', depthMm: null, toleranceMm: .2, faceAllowanceMm: 2 });
  const evidence = facedLatheEvidence(p), saved = W.recordResult(p, { comparison: evidence, operationKind: 'part', accepted: true });
  const reopened = W.open(W.importLibrary(W.exportLibrary(W.upsert(W.createLibrary(), saved, 'Faced and parted'))), saved.id);
  assert.deepEqual(reopened.workflow.results[0].comparison.dimensions, evidence.dimensions);
  assert.equal(W.submission(reopened).project.workflow.results[0].comparison.faceAllowanceMm, 2);
  const mounted = copy(evidence); mounted.dimensions.source = 'mounted'; mounted.dimensions.pieceCount = 0; mounted.dimensions.actualLengthMm = null; mounted.dimensions.lengthErrorMm = null;
  assert.equal(W.validateComparisonResult(mounted).dimensions.actualLengthMm, null);
});

test('detached dimensions reject inconsistent errors, mounted length claims, raw arrays and invalid bounds', () => {
  const p = W.setComparison(D.create('shaft'), { mode: 'retained-solid', depthMm: null, toleranceMm: .2, faceAllowanceMm: 2 });
  const r = facedLatheEvidence(p), bad = copy(r); bad.dimensions.lengthErrorMm = 0; assert.throws(() => W.validateComparisonResult(bad), /observed value/);
  bad.dimensions = { ...r.dimensions, source: 'mounted' }; assert.throws(() => W.validateComparisonResult(bad), /Mounted/);
  bad.dimensions = { ...r.dimensions, pieceCount: 0 }; assert.throws(() => W.validateComparisonResult(bad), /at least one/);
  bad.dimensions = { ...r.dimensions, pieceCount: 13 }; assert.throws(() => W.validateComparisonResult(bad), /piece count/);
  bad.dimensions = { ...r.dimensions, radii: [] }; assert.throws(() => W.validateComparisonResult(bad), /Unexpected/);
  bad.dimensions = { ...r.dimensions, actualFrontMm: null }; assert.throws(() => W.validateComparisonResult(bad), /observed value/);
  const mill = millComparison(plate()); mill.dimensions = r.dimensions; assert.throws(() => W.validateComparisonResult(mill), /only available for the lathe/);
});

function twoSetups() {
  let p = W.setSequence(plate(), { version: 1, steps: [{ id: 'cut-top', label: 'Pocket the top', operation: { ...operation, kind: 'pocket' } }] });
  const setups = W.getSetups(p), second = copy(setups.items[0]);
  second.id = 'setup-2'; second.label = 'Turn over and face'; second.orientation = 'bottom';
  second.fixture.method = 'vise_soft'; second.sequence = { version: 1, steps: [{ id: 'face-bottom', label: 'Face the back', operation: { ...operation, kind: 'face', depthMm: 1, stepDownMm: .5 } }] };
  second.comparison = { mode: 'retained-solid', depthMm: 1, toleranceMm: .2, faceAllowanceMm: 1 };
  setups.items.push(second); return W.setSetups(p, setups);
}
function setupEvidence(p, index, actual = true) {
  const setup = W.getSetups(p).items[index];
  return { id: setup.id, index, orientation: setup.orientation, inputMaterialFingerprint: actual ? 'material-in-' + index : null, outputMaterialFingerprint: actual ? 'material-out-' + index : null };
}

test('implicit setup reads leave old serialization and v1/v2 hashes unchanged', () => {
  const old = D.create('plate'); old.id = 'legacy-fixture'; const before = JSON.stringify(old);
  const implicit = W.getSetups(old); assert.equal(implicit.items[0].id, 'setup-1'); assert.equal(implicit.items[0].orientation, 'top');
  assert.equal(implicit.items[0].fixture.method, 'vise'); assert.deepEqual(implicit.items[0].sequence.steps, []);
  assert.equal(JSON.stringify(old), before); assert.equal(W.fingerprint(old), 'design-v1-2f5f06e3');
  let v2 = D.create('plate'); v2.id = 'legacy-goal-v2'; v2 = W.setComparison(v2, { mode: 'pocket', depthMm: 4, toleranceMm: .2 });
  W.getSetups(v2); assert.equal(W.fingerprint(v2), 'design-v2-c73d47ba'); assert.equal(Object.hasOwn(v2.workflow, 'setups'), false);
  v2.stock.depth = 2; const retained = W.getSetups(v2);
  assert.equal(retained.items[0].comparison.depthMm, 4, 'Resolving an implicit setup preserves its historical goal');
  assert.equal(Object.hasOwn(retained.items[0].comparison, 'faceAllowanceMm'), false);
  assert.equal(W.setupState(v2, 'setup-1').valid, false);
  assert.throws(() => W.setSetups(v2, retained), /stock depth/, 'Opt-in needs explicit goal review instead of a silent clamp');
  const lathe = W.getSetups(D.create('shaft')).items[0]; assert.equal(lathe.orientation, 'front'); assert.equal(lathe.fixture.method, 'chuck3');
});

test('explicit setups own their sequence, comparison, orientation and canonical fixture across files', () => {
  const p = twoSetups(), reopened = D.decode(D.encode(p));
  assert.deepEqual(W.getSetups(reopened), p.workflow.setups); assert.equal(p.workflow.sequence.steps[0].operation.kind, 'pocket');
  assert.deepEqual(p.workflow.comparison, p.workflow.setups.items[0].comparison); assert.match(W.fingerprint(p), /^design-v3-/);
  const saved = W.open(W.importLibrary(W.exportLibrary(W.upsert(W.createLibrary(), p, 'Both faces'))), p.id);
  assert.deepEqual(saved.workflow.setups, p.workflow.setups); assert.deepEqual(W.submission(saved).project.workflow.setups, p.workflow.setups);
});

test('setup projection is detached and leaves geometry transformation to the machining adapter', () => {
  const p = twoSetups(), before = copy(p), local = W.setupProject(p, 'setup-2');
  assert.equal(Object.hasOwn(local.workflow, 'setups'), false); assert.equal(local.workflow.sequence.steps[0].operation.kind, 'face');
  assert.equal(local.workflow.comparison.faceAllowanceMm, 1); assert.equal(local.id, p.id); assert.deepEqual(local.geometry, p.geometry); assert.deepEqual(local.placement, p.placement);
  local.workflow.sequence.steps[0].label = 'Changed local copy'; assert.deepEqual(p, before);
  assert.throws(() => W.setupProject(p, 'removed'), /no longer/);
});

test('prefix fingerprints invalidate downstream after earlier changes but preserve completed upstream evidence', () => {
  const p = twoSetups(), first = W.setupFingerprint(p, 'setup-1'), second = W.setupFingerprint(p, 'setup-2');
  const next = W.getSetups(p); next.items[1].fixture.params.gripMm += .2;
  const laterEdit = W.setSetups(p, next); assert.equal(W.setupFingerprint(laterEdit, 'setup-1'), first); assert.notEqual(W.setupFingerprint(laterEdit, 'setup-2'), second);
  next.items[0].sequence.steps[0].operation.feedMmPerMin += 10;
  const earlierEdit = W.setSetups(p, next); assert.notEqual(W.setupFingerprint(earlierEdit, 'setup-1'), first); assert.notEqual(W.setupFingerprint(earlierEdit, 'setup-2'), second);
  const reflection = copy(p); reflection.reflection = 'I turned the stock over.'; assert.equal(W.setupFingerprint(reflection, 'setup-2'), second);
  const units = copy(p); units.units = 'in'; assert.notEqual(W.setupFingerprint(units, 'setup-1'), first);
  const mirrors = copy(p); mirrors.workflow.sequence.steps[0].label = 'Ignored old summary mirror'; assert.equal(W.fingerprint(mirrors), W.fingerprint(p));
});

test('captured setup evidence validates its selected goal and reports prefix staleness', () => {
  let p = twoSetups();
  p = W.recordResult(p, { id: 'top-result', accepted: true, setup: setupEvidence(p, 0), comparison: millComparison(W.setupProject(p, 'setup-1')) });
  p = W.recordResult(p, { id: 'bottom-result', accepted: true, setup: setupEvidence(p, 1), comparison: millComparison(W.setupProject(p, 'setup-2')) });
  const [first, second] = p.workflow.results; assert.equal(first.sourceFingerprint, W.setupFingerprint(p, 'setup-1')); assert.equal(second.sourceFingerprint, W.setupFingerprint(p, 'setup-2'));
  assert.equal(W.resultStatus(p, second).status, 'current');
  const restored = W.open(W.importLibrary(W.exportLibrary(W.upsert(W.createLibrary(), p, 'Measured both setups'))), p.id);
  assert.deepEqual(restored.workflow.results[1].setup, second.setup); assert.equal(W.resultStatus(restored, restored.workflow.results[1]).status, 'current');
  assert.deepEqual(W.submission(restored).project.workflow.results[1].setup, second.setup);
  const plan = W.getSetups(p); plan.items[1].comparison.toleranceMm = .3; const changed = W.setSetups(p, plan);
  assert.equal(W.resultStatus(changed, first).status, 'current'); assert.equal(W.resultStatus(changed, second).status, 'stale');
  plan.items[0].fixture.params.gripMm += .5; const upstream = W.setSetups(p, plan); assert.equal(W.resultStatus(upstream, first).status, 'stale'); assert.equal(W.resultStatus(upstream, second).status, 'stale');
  const removed = W.setSetups(p, { version: 1, items: [plan.items[0]] }); assert.equal(W.resultStatus(removed, second).status, 'stale');
  assert.throws(() => W.recordResult(p, { accepted: true, setup: setupEvidence(p, 1), comparison: millComparison(W.setupProject(p, 'setup-1')) }), /current target/);
});

test('setup provenance rejects fabricated preflight material, incomplete digests and wrong identities', () => {
  const p = twoSetups(), input = { accepted: true, setup: setupEvidence(p, 1) };
  assert.throws(() => W.recordResult(p, { ...input, kind: 'check' }), /Preflight/);
  assert.throws(() => W.recordResult(p, { accepted: true, setup: setupEvidence(p, 1, false) }), /measured input/);
  const checked = W.recordResult(p, { kind: 'check', accepted: true, setup: setupEvidence(p, 1, false) }); assert.equal(checked.workflow.results[0].setup.outputMaterialFingerprint, null);
  assert.throws(() => W.recordResult(p, { ...input, setup: { ...input.setup, outputMaterialFingerprint: null } }), /both input/);
  for (const change of [{ id: 'removed' }, { index: 0 }, { orientation: 'top' }]) assert.throws(() => W.recordResult(p, { ...input, setup: { ...input.setup, ...change } }), /current setup/);
  assert.throws(() => W.recordResult(p, { ...input, setup: { ...input.setup, radiiMm: [] } }), /Unexpected/);
  assert.throws(() => W.recordResult(p, { kind: 'check', setup: setupEvidence(p, 1, false), comparison: millComparison(W.setupProject(p, 'setup-2')) }), /completed measured/);
});

test('setup schema bounds identity, orientation, fixture parameters and number of setups', () => {
  const p = twoSetups(), original = W.getSetups(p);
  assert.throws(() => W.setSetups(p, { version: 2, items: original.items }), /version/);
  assert.throws(() => W.setSetups(p, { version: 1, items: [] }), /at least one/);
  assert.throws(() => W.setSetups(p, { version: 1, items: Array.from({ length: 5 }, (_, i) => ({ ...copy(original.items[0]), id: 'setup-' + i })) }), /at most 4/);
  assert.throws(() => W.setSetups(p, { version: 1, items: [original.items[0], original.items[0]] }), /Duplicate/);
  const firstBottom = copy(original); firstBottom.items[0].orientation = 'bottom'; assert.throws(() => W.setSetups(p, firstBottom), /first setup/);
  const wrongMachine = copy(original); wrongMachine.items[1].orientation = 'front'; assert.throws(() => W.setSetups(p, wrongMachine), /orientation/);
  const extra = copy(original); extra.items[1].fixture.params.rawStock = []; assert.throws(() => W.setSetups(p, extra), /fixture parameters/);
  const badGoal = copy(original); badGoal.items[1].comparison.faceAllowanceMm = 3; assert.throws(() => W.setSetups(p, badGoal), /faced surface/);
});

test('machine or stock edits preserve old setup records for recovery without accepting invalid machining', () => {
  const p = twoSetups(), switched = D.create('shaft'); switched.id = p.id; switched.workflow = copy(p.workflow);
  assert.equal(D.validate(switched).machine, 'lathe'); assert.equal(W.getSetups(switched).items[0].orientation, 'top');
  assert.equal(W.setupState(switched, 'setup-1').valid, false); assert.ok(W.setupState(switched, 'setup-1').issues.length >= 2);
  assert.equal(W.setSetups(switched, W.getSetups(switched)).workflow.setups.items[0].fixture.method, 'vise', 'Old incompatible fields are retained, never silently replaced');
  const replacement = W.defaultSetup(switched); replacement.sequence = { version: 1, steps: [] };
  const corrected = W.setSetups(switched, { version: 1, items: [replacement] }); assert.equal(corrected.workflow.setups.items[0].orientation, 'front');
  const thinner = copy(p); thinner.stock.depth = .5; assert.equal(D.validate(thinner).stock.depth, .5);
  assert.equal(W.getComparison(W.setupProject(thinner, 'setup-2')).depthMm, .5);
});

test('setup review repairs incompatible historical fields one at a time without weakening new field validation', () => {
  let p = twoSetups(); p.stock.depth = .5;
  assert.equal(W.setupState(p, 'setup-1').valid, false); assert.equal(W.setupState(p, 'setup-2').valid, false);
  let plan = W.getSetups(p); plan.items[0].comparison = { mode: 'pocket', depthMm: .3, toleranceMm: .1, faceAllowanceMm: 0 };
  p = W.setSetups(p, plan); assert.equal(W.setupState(p, 'setup-1').valid, true); assert.equal(W.setupState(p, 'setup-2').valid, false);
  plan = W.getSetups(p); plan.items[1].comparison = { mode: 'retained-solid', depthMm: .2, toleranceMm: .1, faceAllowanceMm: .1 };
  p = W.setSetups(p, plan); assert.equal(W.setupState(p, 'setup-2').valid, true);
  const wrong = W.getSetups(p); wrong.items[1].comparison.depthMm = .6; assert.throws(() => W.setSetups(p, wrong), /stock depth/);
  const switched = D.create('shaft'); switched.id = p.id; switched.workflow = copy(p.workflow); let repair = W.getSetups(switched);
  repair.items[0].fixture = { method: 'chuck3', params: {} }; let partial = W.setSetups(switched, repair);
  assert.equal(W.setupState(partial, 'setup-1').valid, false); assert.equal(partial.workflow.setups.items[1].fixture.method, 'vise_soft');
  repair = W.getSetups(partial); repair.items[0].orientation = 'front'; repair.items[0].comparison = { mode: 'retained-solid', depthMm: null, toleranceMm: .2 };
  partial = W.setSetups(partial, repair); assert.equal(W.setupState(partial, 'setup-1').valid, true); assert.equal(W.setupState(partial, 'setup-2').valid, false);
  const newInvalid = W.getSetups(partial); newInvalid.items.push({ ...copy(newInvalid.items[1]), id: 'new-invalid' });
  assert.throws(() => W.setSetups(partial, newInvalid), /fixture cannot hold/);
});
