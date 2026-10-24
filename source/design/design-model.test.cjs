'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const modelPath = path.resolve(__dirname, '../../numeracy-hub/design/design-model.js');
const Design = require(modelPath);
const Shapes = require('../canvas/src/vendor/shapes-engine.js');
const copy = value => JSON.parse(JSON.stringify(value));
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);

test('browser and Node expose the same shared document API', () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(modelPath, 'utf8'), context);
  assert.equal(context.AccessDesign.format, Design.format);
  assert.equal(context.AccessDesign.create('washer').geometry.shapeId, 'annulus');
});

test('templates are editable independent documents and round-trip through links', () => {
  for (const template of ['plate', 'washer', 'shaft']) {
    const p = Design.create(template), cloned = Design.validate(p);
    assert.deepEqual(Design.decode(Design.encode(p)), p);
    assert.notEqual(cloned, p);
    assert.notEqual(cloned.geometry.params, p.geometry.params);
    assert.equal(Design.checks(p).find(c => c.id === 'stock-fit').ok, true);
    assert.equal(Design.checks(p).find(c => c.id === 'brief').ok, false);
  }
  assert.throws(() => Design.create('unknown'), /template/);
});

test('all five engine shapes round-trip every canvas unit without reinterpretation', () => {
  const factors = { mm: 1, cm: 10, m: 1000, in: 25.4, ft: 304.8 };
  for (const shapeId of ['rectangle', 'square', 'circle', 'annulus', 'cylinder']) {
    for (const [units, factor] of Object.entries(factors)) {
      const params = Shapes.defaults(shapeId);
      const p = Design.fromCanvas({ shapeId, params, units });
      const back = Design.toCanvas(p, units);
      assert.equal(back.shapeId, shapeId);
      for (const [key, value] of Object.entries(params)) {
        near(p.geometry.params[key], value * factor);
        near(back.params[key], value);
      }
      assert.equal(Shapes.validate(shapeId, back.params), null);
      const before = copy(p.geometry);
      p.units = p.units === 'mm' ? 'in' : 'mm';
      assert.deepEqual(Design.validate(p).geometry, before);
    }
  }
  assert.throws(() => Design.fromCanvas({ shapeId: 'circle', params: { r: 3 }, units: 'yards' }), /unit/);
});

test('unknown schema, prototype fields, non-JSON objects and unsafe dimensions are rejected', () => {
  for (const bad of [null, [], {}, { ...Design.create(), version: 2 }, { ...Design.create(), units: 'cm' }])
    assert.throws(() => Design.validate(bad));
  for (const number of [NaN, Infinity, -Infinity, -1, 0, '10', 1000001, 0.000001]) {
    const p = Design.create(); p.geometry.params.l = number;
    assert.throws(() => Design.validate(p));
  }
  let p = Design.create(); p.geometry.params.extra = 5;
  assert.throws(() => Design.validate(p), /Unexpected/);
  p = Design.create(); p.surprise = 5;
  assert.throws(() => Design.validate(p), /Unexpected/);
  p = Design.create(); Object.setPrototypeOf(p.geometry.params, { inherited: true });
  assert.throws(() => Design.validate(p), /plain JSON/);
  p = Design.create(); Object.defineProperty(p, 'brief', { enumerable: true, get() { throw Error('getter should never run'); } });
  assert.throws(() => Design.validate(p), /plain JSON/);
  const polluted = JSON.stringify(Design.create()).replace('"params":{', '"params":{"__proto__":{"polluted":true},');
  assert.throws(() => Design.decode(polluted), /Unexpected/);
  assert.equal({}.polluted, undefined);
});

test('malformed, oversized, invalid Unicode and invalid annulus imports fail clearly', () => {
  for (const payload of ['', '%ZZ', '{bad', 'null', 'a'.repeat(Design.maxBytes * 3 + 1)])
    assert.throws(() => Design.decode(payload));
  const p = Design.create('washer'); p.geometry.params.r = p.geometry.params.R;
  assert.throws(() => Design.validate(p), /inner radius/);
  const long = Design.create(); long.title = 'a'.repeat(161);
  assert.throws(() => Design.validate(long), /Title/);
  long.title = '\ud800';
  assert.throws(() => Design.validate(long), /Unicode/);
  assert.throws(() => Design.decode('{' + ' '.repeat(Design.maxBytes) + '}'), /64 KB/);
});

test('stock fit is readiness, not document validity; coordinates use stock lower-left', () => {
  const p = Design.create();
  p.placement = { x: 10, y: 10 }; p.stock.width = 90; p.stock.height = 60;
  assert.equal(Design.checks(p).find(c => c.id === 'stock-fit').ok, true);
  p.placement.x = 10.1;
  assert.doesNotThrow(() => Design.validate(p));
  assert.equal(Design.checks(p).find(c => c.id === 'stock-fit').ok, false);
  assert.throws(() => Design.toSVG(p), /inside the stock/);
  p.placement.x = -1;
  assert.equal(Design.checks(p).find(c => c.id === 'stock-fit').ok, false);
  const shaft = Design.create('shaft');
  assert.deepEqual(Design.bounds(shaft), { width: 80, height: 30, length: 80, diameter: 30 });
  shaft.stock.length = 80; shaft.stock.diameter = 30;
  shaft.placement = { x: -500, y: 9999 };
  assert.equal(Design.checks(shaft).find(c => c.id === 'stock-fit').ok, true);
  shaft.stock.length = 79;
  assert.equal(Design.checks(shaft).find(c => c.id === 'stock-fit').ok, false);
  shaft.stock.length = 80; shaft.stock.diameter = 29.9;
  assert.equal(Design.checks(shaft).find(c => c.id === 'stock-fit').ok, false);
});

test('SVG is physical millimetres with exact primitive placement, inner ring and escaped metadata', () => {
  const p = Design.create('plate'); p.placement = { x: 2, y: 3 };
  p.title = '<script>alert("x")</script> & 25%';
  const svg = Design.toSVG(p);
  assert.match(svg, /width="90mm" height="60mm" viewBox="0 0 90 60"/);
  assert.match(svg, /<rect x="2" y="7" width="80" height="50"\/>/);
  assert.ok(!svg.includes('<script>'));
  assert.match(svg, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt; &amp; 25%/);
  assert.deepEqual(Design.decode(Design.encode(p)), p);
  assert.deepEqual(Design.decode(JSON.stringify(p)), p);
  const ring = Design.toSVG(Design.create('washer'));
  assert.equal((ring.match(/<circle /g) || []).length, 2);
  assert.match(ring, /cx="30" cy="30" r="25"/);
  assert.match(ring, /cx="30" cy="30" r="10"/);
  assert.match(ring, /fill="none"/);
  const inches = Design.fromCanvas({ shapeId: 'square', params: { s: 1 }, units: 'in' });
  assert.match(Design.toSVG(inches), /width="25.4" height="25.4"/);
});

test('DXF uses mm header, placed contours, true inner circle and no executable metadata', () => {
  const p = Design.create(); p.placement = { x: 2, y: 3 };
  p.title = '\n0\nENDSEC\n0\nEOF';
  const dxf = Design.toDXF(p);
  assert.match(dxf, /\$ACADVER\r\n1\r\nAC1015/);
  assert.match(dxf, /\$INSUNITS\r\n70\r\n4/);
  assert.equal((dxf.match(/\r\nLINE\r\n/g) || []).length, 4);
  assert.match(dxf, /10\r\n2\r\n20\r\n3\r\n30\r\n0\r\n11\r\n82\r\n21\r\n3/);
  assert.equal((dxf.match(/\r\nEOF/g) || []).length, 1);
  const ring = Design.toDXF(Design.create('washer'));
  assert.equal((ring.match(/\r\nCIRCLE\r\n/g) || []).length, 2);
  assert.match(ring, /8\r\nHOLE\r\n100\r\nAcDbCircle\r\n10\r\n30\r\n20\r\n30\r\n30\r\n0\r\n40\r\n10/);
  assert.match(dxf, /2D design profile only/);
});

test('unsupported lathe export and mismatched machine never masquerade as a toolpath', () => {
  const shaft = Design.create('shaft');
  assert.throws(() => Design.toSVG(shaft), /lathe profile/);
  assert.throws(() => Design.toDXF(shaft), /lathe profile/);
  const plate = Design.create(); plate.machine = 'lathe';
  assert.equal(Design.checks(plate).find(c => c.id === 'machine').ok, false);
  assert.throws(() => Design.toDXF(plate), /Choose mill/);
});
