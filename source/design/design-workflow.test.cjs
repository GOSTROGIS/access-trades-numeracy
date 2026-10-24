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
