'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const D = require('../../numeracy-hub/design/design-model.js');
const E = require('../../numeracy-hub/cnc/manual-engine.js');
const B = require('../../numeracy-hub/cnc/design-bridge.js');
const clone = object => JSON.parse(JSON.stringify(object));

test('mill handoff preserves target and maps physical stock, title and units to an empty CNC setup', () => {
  const project = D.create('plate'); project.title = 'Bench plate'; project.brief = 'Fit the bench bracket.'; project.reflection = 'Measure twice.';
  const before = JSON.stringify(project), ready = B.prepare(project);
  assert.deepEqual(ready.config.stock, { x: 90, y: 60, z: 10 });
  assert.equal(ready.config.title, 'Bench plate');
  assert.equal(ready.config.units, 'mm');
  assert.equal(E.create(ready.config).actions.length, 0);
  assert.equal(JSON.stringify(project), before);
  assert.deepEqual(D.decode(B.returnURL(project).split('#project=')[1]), project);
});

test('inch handoff converts canonical mm and discloses CNC precision without clamping dimensions', () => {
  const project = D.create(); project.units = 'in'; project.stock.width = 101.6; project.stock.height = 76.2; project.stock.depth = 25.4;
  const ready = B.prepare(project);
  assert.deepEqual(ready.config.stock, { x: 4, y: 3, z: 1 });
  assert.equal(ready.config.units, 'in');
  assert.equal(ready.notes.length, 0);
  project.stock.width = 101;
  const rounded = B.prepare(project);
  assert.equal(rounded.config.stock.x, 3.9764);
  assert.match(rounded.notes.join(' '), /0.0001 in/);
  assert.equal(project.stock.width, 101);
});

test('lathe handoff uses diameter and stick-out; target geometry is not converted to cutting actions', () => {
  const project = D.create('shaft'), ready = B.prepare(project), state = E.create(ready.config);
  assert.deepEqual(ready.config.stock, { diameter: 40, length: 90 });
  assert.equal(state.actions.length, 0);
  const simulator = E.project(state);
  assert.equal(simulator.machine, 'lathe');
  assert.equal(simulator.stock.dia, 40 / 25.4);
  assert.equal(simulator.stock.stickout, 90 / 25.4);
  assert.deepEqual(ready.project.geometry, project.geometry);
});

test('bad, oversized and incompatible design links do not reach the setup mutator', () => {
  let calls = 0;
  const builder = { applySetup() { calls++; return { ok: true }; } };
  const invalid = D.create(); invalid.geometry.params.l = NaN;
  assert.throws(() => B.apply(builder, invalid));
  for (const hash of ['#design=%NO', '#design=' + 'a'.repeat(D.maxBytes * 3 + 1), '#design=null']) assert.throws(() => B.parseHash(hash));
  const wrongMachine = D.create(); wrongMachine.machine = 'lathe';
  assert.throws(() => B.apply(builder, wrongMachine), /Choose mill/);
  const outside = D.create(); outside.placement.x = 999;
  assert.throws(() => B.apply(builder, outside), /inside the stock/);
  assert.equal(calls, 0);
  assert.equal(B.parseHash('#unrelated=example'), null);
  const p = D.create(); p.title = '25% plate';
  assert.deepEqual(B.parseHash('#design=' + D.encode(p)), p);
});

test('engine stock limits reject too-small and too-large setups without altering the project or builder', () => {
  let calls = 0;
  const builder = { applySetup() { calls++; return { ok: true }; } };
  const cases = [
    { make: 'plate', change: p => p.stock.width = 610, match: /Stock X length must be no more than 609\.6/ },
    { make: 'plate', change: p => p.stock.depth = 3, match: /Stock thickness must be at least 3.175/ },
    { make: 'shaft', change: p => p.stock.length = 255, match: /Stock length must be no more than 254/ },
    { make: 'shaft', change: p => p.stock.diameter = 153, match: /Stock diameter must be no more than 152\.4/ }
  ];
  for (const item of cases) {
    const p = D.create(item.make); item.change(p);
    const before = JSON.stringify(p);
    assert.throws(() => B.apply(builder, p), item.match);
    assert.equal(JSON.stringify(p), before);
  }
  assert.equal(calls, 0);
});

test('explicit application surfaces simulator rejection and never rewrites design reflection', () => {
  const p = D.create(); p.reflection = 'My original notes.';
  const before = clone(p);
  assert.throws(() => B.apply({ applySetup: () => ({ ok: false, error: 'Tool clearance is outside the machine.' }) }, p), /Tool clearance/);
  let applied;
  const accepted = B.apply({ applySetup(config) { applied = config; return { ok: true, backupSaved: false }; } }, p);
  assert.equal(accepted.backupSaved, false);
  assert.deepEqual(applied, B.prepare(p).config);
  assert.deepEqual(p, before);
  assert.equal(B.matches(applied, accepted.config), true);
  const changed = clone(applied); changed.stock.x += 1;
  assert.equal(B.matches(changed, accepted.config), false);
});

test('builder setup transaction does not mutate rejected jobs and provides cross-machine undo history', () => {
  // Run the actual public transaction with an isolated renderer and the production engine.
  const source = fs.readFileSync(path.resolve(__dirname, '../../numeracy-hub/cnc/manual-builder.js'), 'utf8');
  const transaction = source.slice(source.indexOf('  function applySetup(config){'), source.indexOf('  function numeric(id)'));
  assert.ok(transaction.startsWith('  function applySetup(config){'));
  const old = E.apply(E.create(E.defaultConfig('mill')), { type: 'spindle', on: true, rpm: 1800 });
  const savedWrites = [], events = [];
  const sandbox = { E, JSON, console, Error, Event: class { constructor(type) { this.type = type; } },
    localStorage: { setItem(key, value) { savedWrites.push([key, value]); } },
    document: { body: { classList: { contains: () => false, add() {} } } },
    window: { dispatchEvent: event => events.push(event) },
    T: { manualPlayback() {} },
    $: () => ({ textContent: 'Fixture check failed.', setAttribute() {} }),
    say() {}, render() {}, persist() {}, previous: old,
    accepted: false, recorded: null
  };
  const context = vm.createContext(sandbox);
  vm.runInContext("let busy=false,state=previous,machine='mill',undoStack=[],redoStack=[],lastResult=null,mode='feed',active=true,saved={jobs:{}}; const KEY='draft'; function preview(candidate){return accepted?{accepted:true}:null;}" + transaction + ';globalThis.trySetup=applySetup;globalThis.snapshot=()=>({state,machine,undo:undoStack.slice(),redo:redoStack.slice(),busy});', context);
  const target = B.prepare(D.create('shaft')).config;
  let result = sandbox.trySetup(target);
  assert.equal(result.ok, false);
  assert.equal(sandbox.snapshot().state, old);
  assert.equal(sandbox.snapshot().undo.length, 0);
  assert.equal(savedWrites.length, 0);
  sandbox.accepted = true;
  result = sandbox.trySetup(target);
  assert.equal(result.ok, true);
  assert.equal(sandbox.snapshot().machine, 'lathe');
  assert.equal(sandbox.snapshot().undo[0], old);
  assert.equal(sandbox.snapshot().state.actions.length, 0);
  assert.equal(JSON.parse(savedWrites[0][1]).jobs.mill.actions.length, 1);
  assert.equal(sandbox.snapshot().busy, false);
  const current = sandbox.snapshot().state;
  const invalid = clone(target); invalid.stock.length = 9999;
  assert.equal(sandbox.trySetup(invalid).ok, false);
  assert.equal(sandbox.snapshot().state, current);
});
