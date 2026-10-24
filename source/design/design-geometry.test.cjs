'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../../numeracy-hub/design/design-model.js');
const S = require('../canvas/src/vendor/shapes-engine.js');
const W = require('../../numeracy-hub/design/design-workflow.js');
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-7*Math.max(1,Math.abs(a),Math.abs(b)), `${a} != ${b}`);
const ring = (x,y,w,h) => [[x,y],[x+w,y],[x+w,y+h],[x,y+h]];

test('all engine flat shapes and cylinder preserve semantic parameters across units',()=>{
  const catalog = D.geometryCatalog();
  assert.equal(catalog.filter(s=>s.kind==='flat').length,S.list({all:true}).filter(s=>s.kind==='flat').length);
  for(const entry of catalog) {
    const params = S.defaults(entry.id);
    for(const [unit,factor] of Object.entries({mm:1,cm:10,m:1000,in:25.4,ft:304.8})) {
      const p = D.fromCanvas({shapeId:entry.id,params,units:unit});
      const back = D.toCanvas(p,unit);
      for(const q of entry.params) {near(back.params[q.k],params[q.k]);near(p.geometry.params[q.k],params[q.k]*(q.int||q.angle?1:factor));}
      assert.match(D.render(p),/<svg/);
      assert.ok(D.measurements(p).items.length);
      if(entry.id!=='cylinder') {const outline=D.outline(p);assert.ok(outline.rings.length);assert.match(D.toSVG(p),/<svg/);assert.match(D.toDXF(p),/ENTITIES/);}
    }
  }
});
test('triangle angle inputs keep degrees while lengths convert',()=>{
  for(const id of ['right-triangle','isosceles-triangle','scalene-triangle']) {
    const ao={angles:true,angleInput:'angle'},params=S.defaults(id,ao),p=D.fromCanvas({shapeId:id,params,ao,units:'in'});
    assert.deepEqual(p.geometry.ao,ao);
    for(const q of S.angleParams(id)) near(p.geometry.params[q.k],params[q.k]*(q.angle?1:25.4));
    assert.deepEqual(D.toCanvas(p,'in').ao,ao);
    assert.ok(D.outline(p).width>0);
  }
});
test('profile holes, islands and units preserve exact polygon measurements',()=>{
  const p=D.fromProfile({rings:[ring(100,200,10,10),ring(102,202,6,6),ring(104,204,2,2)],units:'cm',title:'Nested profile'});
  assert.deepEqual(D.bounds(p),{width:100,height:100});
  const out=D.outline(p);assert.deepEqual(out.depths,[0,1,2]);
  const math=D.measurements(p,'cm');near(math.items.find(i=>i.key==='A').value,68);near(math.items.find(i=>i.key==='P').value,72);
  assert.match(D.toSVG(p),/fill-rule="evenodd"/);
  assert.equal((D.toDXF(p).match(/\r\nLINE\r\n/g)||[]).length,12);
  const saved=D.decode(D.encode(p));assert.deepEqual(saved,p);
  const islands=D.fromProfile({rings:[ring(0,0,10,10),ring(20,0,5,5)],units:'mm'});near(D.measurements(islands).items[0].value,125);
});
test('invalid profile topology and untrusted dimensions are rejected',()=>{
  for(const rings of [[],[[[0,0],[2,2],[0,2],[2,0]]],[ring(0,0,10,10),ring(5,5,10,10)],[ring(0,0,10,10),ring(0,2,2,2)],[[[0,0],[1,0],[1,0],[0,1]]],[[[0,0],[1,0],[Infinity,1]]]]) assert.throws(()=>D.fromProfile({rings,units:'mm'}));
  assert.throws(()=>D.fromCanvas({shapeId:'sector',params:{r:2,t:'30'},units:'mm'}),/number/);
  const star=D.create('star');star.geometry.params.n=4.5;assert.throws(()=>D.validate(star));
  const tiny=D.fromProfile({rings:[ring(900000,900000,.01,.01)],units:'mm'});near(D.measurements(tiny).items[0].value,.0001);
});
test('workflow metadata survives geometry changes and becomes stale by fingerprint',()=>{
  let p=W.withMetadata(D.create('star'));p=W.inspect(p,{key:'R',measured:100,tolerance:1});
  const before=p.workflow.inspections[0];p.geometry.params.R=110;p=D.validate(p);
  assert.equal(W.inspectionStatus(p,before).stale,true);
  assert.equal(p.workflow.inspections.length,1);
});
test('new turning projects reserve chuck clearance without changing saved stock',()=>{
  const shaft=D.create('shaft');assert.equal(shaft.stock.length,100);
  const imported=D.fromCanvas({shapeId:'cylinder',params:{r:1,h:3},units:'in'});
  near(imported.stock.length,3*25.4+20);
  shaft.stock.length=90;
  assert.equal(D.decode(D.encode(shaft)).stock.length,90);
});
test('curve approximation reporting follows geometry, not number of corners',()=>{
  const star=D.create('star');star.geometry.params.n=24;
  assert.equal(D.outline(star).approximate,false);
  const sector=D.create('sector');sector.geometry.params.t=1;
  assert.equal(D.outline(sector).approximate,true);
  const strip=D.create('ring-sector');strip.geometry.params={R:1000,r:999,t:1};
  const out=D.outline(strip);assert.equal(out.approximate,true);
  near(out.tolerance,1000*(1-Math.cos(Math.PI/256)));
});
