const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const repo = path.resolve(__dirname, '../..');
const modelPath = path.join(repo, 'numeracy-hub/design/design-model.js');
const D = require(modelPath);
const Workflow = require(path.join(repo, 'numeracy-hub/design/design-workflow.js'));
const Shapes = require(path.join(repo, 'source/canvas/src/vendor/shapes-engine.js'));
const html = fs.readFileSync(path.join(repo, 'shape-canvas/index.html'), 'utf8');
const code = html.match(/<script id="js-model">([\s\S]*?)<\/script>/)[1];
let nextId = 0;
const SC = {
  U: { uid: prefix => prefix + (++nextId), TO_MM: { mm: 1, cm: 10, m: 1000, in: 25.4, ft: 304.8 } },
  Geo: { box: () => [0, 0, 100, 100] },
  S: { sel: [] },
  A: { afterLoad() {} },
  P: { toast() {}, closePops() {} }
};
const nodes = {};
const handlers = {};
let ready;
function node(id) {
  if (!nodes[id]) nodes[id] = {
    hidden: false, disabled: false, open: false, textContent: '',
    events: {},
    addEventListener(type, callback) { this.events[type] = callback; },
    showModal() { this.open = true; },
    close() { this.open = false; this.events.close?.(); },
    focus() {},
    click() { if (!this.disabled) this.events.click?.(); }
  };
  return nodes[id];
}
const location = { hash: '', pathname: '/shape-canvas/index.html', search: '', href: '' };
const window = {
  SC, Shapes, AccessDesign: D, AccessDesignWorkflow: Workflow, location,
  history: { replaceState() { location.hash = ''; } },
  addEventListener(type, callback) { handlers[type] = callback; },
  document: { readyState: 'loading', addEventListener(type, callback) { ready = callback; }, getElementById: node }
};
// Use the model's JSON realm for snapshots, matching the single browser realm.
const ctx = vm.createContext({ window, console, JSON, setTimeout: () => 1, clearTimeout() {} });
vm.runInContext(code, ctx);
SC.I = { commit: () => SC.M.commit() };
vm.runInContext(fs.readFileSync(path.join(repo, 'shape-canvas/design-bridge.js'), 'utf8'), ctx);
const M = SC.M;
const original = M.addShape('rectangle', 200, 300, { l: 2, w: 1 });
M.doc.unit = 'in';
M.resetHistory();
const originalPage = JSON.stringify(M.page());
const originalSnapshot = M.snapshot();
const p = D.fromCanvas({ shapeId: 'rectangle', params: { l: 100, w: 50 }, units: 'mm', title: 'Bench plate' });
p.brief = 'A practice plate for the workbench.';
p.reflection = 'Check the units at each step.';
const id = SC.DesignBridge.importProject(p);
assert.equal(M.doc.pages.length, 2);
assert.equal(JSON.stringify(M.doc.pages[0]), originalPage);
assert.equal(M.unit(), 'in');
assert.ok(Math.abs(M.obj(id).params.l - 100 / 25.4) < 1e-10);
assert.ok(Math.abs(M.obj(id).params.w - 50 / 25.4) < 1e-10);
assert.equal(M.canUndo(), true);
const importedSnapshot = M.snapshot();
assert.equal(M.undo(), true);
assert.equal(M.snapshot(), originalSnapshot);
assert.equal(M.redo(), true);
assert.equal(M.snapshot(), importedSnapshot);
M.restore(M.snapshot());
SC.S.sel = [id];
M.obj(id).params.l = 5;
M.obj(id).x = 9999;
M.obj(id).y = -8000;
M.obj(id).ppu = 0.001;
M.obj(id).rot = 42;
const roundTrip = SC.DesignBridge.selectedProject();
assert.ok(Math.abs(roundTrip.geometry.params.l - 127) < 1e-9);
assert.equal(roundTrip.id, p.id);
assert.equal(roundTrip.title, p.title);
assert.equal(roundTrip.brief, p.brief);
assert.equal(roundTrip.reflection, p.reflection);
assert.deepEqual(roundTrip.stock, p.stock);
assert.deepEqual(roundTrip.placement, p.placement);
const beforeInvalid = M.snapshot();
const invalid = JSON.parse(JSON.stringify(p));
invalid.geometry.params.l = -1;
assert.throws(() => SC.DesignBridge.importProject(invalid));
assert.equal(M.snapshot(), beforeInvalid);
SC.S.sel = [id, original.id];
assert.throws(() => SC.DesignBridge.selectedProject(), /Select one/);
SC.S.sel = [id];
M.obj(id).shape = 'cone';
assert.throws(() => SC.DesignBridge.selectedProject(), /flat shape/);
M.obj(id).shape = 'rectangle';
const file = M.exportJSON();
assert.equal(M.importJSON(file).ok, true);
assert.equal(M.obj(id).designProject.reflection, p.reflection);
SC.S.sel = [id];
assert.equal(SC.DesignBridge.selectedProject().brief, p.brief);
// Opening a project link offers an explicit, undoable append action.
location.hash = '#project=' + D.encode(p);
const beforeOffer = M.snapshot();
ready();
assert.equal(node('design-project-dialog').open, true);
assert.equal(M.snapshot(), beforeOffer);
assert.equal(node('design-project-primary').disabled, true, 'Conflicting local dimensions are not overwritten');
assert.equal(node('design-project-new').hidden, false);
node('design-project-new').click();
assert.equal(M.doc.pages.length, 3);
assert.equal(node('design-project-dialog').open, false);
assert.equal(location.hash, '');
const afterAcceptance = M.snapshot();
handlers.hashchange();
assert.equal(M.snapshot(), afterAcceptance);
// Returning a linked shape preserves its project and ignores drawing coordinates.
node('btn-design-project').click();
assert.equal(node('design-project-primary').textContent, 'Return to design project');
let saves = 0;
M.save = () => { saves++; };
node('design-project-primary').click();
assert.equal(saves, 1, 'Flush any pending canvas save before leaving');
const outbound = D.decode(location.href.split('#project=')[1]);
assert.equal(outbound.brief, p.brief);
assert.equal(outbound.id, p.id);
node('design-project-workspace').click();
assert.equal(saves, 2, 'The direct workspace link also flushes canvas changes');
node('design-project-dialog').close();
// Malformed links are presented without an enabled import action or mutation.
const beforeMalformed = M.snapshot();
location.hash = '#project=%INVALID';
handlers.hashchange();
assert.equal(node('design-project-primary').disabled, true);
assert.equal(M.snapshot(), beforeMalformed);
node('design-project-dialog').close();
assert.equal(location.hash, '');
// An older legacy copy must not silently erase newly attached learning evidence.
M.reset();
const evidenced = Workflow.withMetadata(D.create('plate'));
const evidenceId = SC.DesignBridge.importProject(evidenced);
const legacy = D.validate(evidenced); delete legacy.workflow;
const beforeLegacy = M.snapshot();
assert.equal(SC.DesignBridge.incomingStatus(legacy).kind, 'conflict');
assert.throws(() => SC.DesignBridge.importProject(legacy), /learning evidence/);
assert.equal(M.snapshot(), beforeLegacy);
assert.equal(M.obj(evidenceId).designProject.workflow.revision, evidenced.workflow.revision);
console.log('PASS: canvas bridge preserves pages, units, metadata, JSON roundtrip, selection rules, and undo/redo; project links require acceptance and invalid imports do not mutate the drawing.');
