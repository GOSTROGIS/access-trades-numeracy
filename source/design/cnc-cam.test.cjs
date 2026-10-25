'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../../numeracy-hub/design/design-model.js');
const C=require('../../numeracy-hub/cnc/design-cam.js');
const W=require('../../numeracy-hub/design/design-workflow.js');

test('mill generated program preserves stock origin, physical units, cutting intent and input project',()=>{
  const p=D.create('plate'),before=JSON.stringify(p),plan=C.defaults(p),g=C.generate(p,plan);
  assert.equal(JSON.stringify(p),before);assert.equal(g.training.machine,'mill');
  assert.equal(g.training.stock.x,p.stock.width/25.4);assert.equal(g.training.stock.y,p.stock.height/25.4);assert.equal(g.training.stock.z,p.stock.depth/25.4);
  assert.match(g.training.text,/G20/);assert.match(g.training.text,/S1800 M03/);assert.match(g.training.text,/POCKET/);
  assert.equal(g.project.workflow.operation.feedMmPerMin,120);assert.equal(g.sourceFingerprint,W.fingerprint(g.project));
  p.units='in';const imperial=C.generate(p,plan);assert.equal(imperial.training.text,g.training.text);
});
test('annulus holes use the existing pocket island and inside profile paths',()=>{
  const p=D.create('washer');let g=C.generate(p,C.defaults(p));assert.match(g.training.text,/ISLAND/);
  g=C.generate(p,{...C.defaults(p),kind:'profile-out'});assert.match(g.training.text,/OUTSIDE PROFILE OUTER/);assert.match(g.training.text,/INSIDE PROFILE HOLE/);
  g=C.generate(p,{...C.defaults(p),kind:'profile-in'});assert.doesNotMatch(g.training.text,/OUTSIDE PROFILE/);assert.match(g.training.text,/INSIDE PROFILE HOLE/);
});
test('drill and turning programs obey explicit target size, feed and stock',()=>{
  const p=D.create('washer');assert.throws(()=>C.generate(p,{...C.defaults(p),kind:'drill'}),/drill diameter/);
  const drill=C.generate(p,{...C.defaults(p),kind:'drill',toolDiameterMm:20});assert.match(drill.training.text,/G83/);assert.equal(drill.training.tools[1].dia,20/25.4);
  const shaft=D.create('shaft'),g=C.generate(shaft,C.defaults(shaft));assert.match(g.training.text,/G71/);assert.match(g.training.text,/G70/);assert.match(g.training.text,/G97 S1200/);assert.doesNotMatch(g.training.text,/G96/);
  assert.equal(g.training.stock.stickout,shaft.stock.length/25.4);assert.equal(g.training.stock.dia,40/25.4);
});
test('unsupported, nonfinite, out-of-stock and excessive operation requests are rejected without mutation',()=>{
  const p=D.create('plate'),before=JSON.stringify(p),base=C.defaults(p);
  for(const change of [{kind:'turn'},{depthMm:11},{spindleRpm:NaN},{feedMmPerMin:0},{toolDiameterMm:100},{depthMm:1,stepDownMm:2}])assert.throws(()=>C.generate(p,{...base,...change}));
  assert.equal(JSON.stringify(p),before);p.placement.x=40;assert.throws(()=>C.generate(p,base),/stock/);
});
test('captured check versus simulation evidence is explicit, bounded and invalidated by source changes',()=>{
  const p=D.create('plate');p.reflection='Student explanation';const g=C.generate(p,C.defaults(p));
  const check=C.record(g.project,g,{accepted:false,removedVolumeIn3:0,diagnostics:[{level:'error',message:'Rejected fixture'}]},false);
  assert.equal(check.workflow.results[0].kind,'check');assert.equal(check.workflow.results[0].accepted,false);assert.match(check.workflow.results[0].summary,/not played/);
  const sim=C.record(g.project,g,{accepted:true,removedVolumeIn3:1,diagnostics:[]},true);assert.equal(sim.workflow.results[0].removedVolumeMm3,25.4**3);assert.equal(sim.reflection,'Student explanation');
  assert.equal(W.resultStatus(sim,sim.workflow.results[0]).stale,false);sim.stock.depth+=1;assert.equal(W.resultStatus(sim,sim.workflow.results[0]).stale,true);assert.throws(()=>C.record(sim,g,{accepted:true},true),/changed/);
});
test('DXF physical import preserves nested holes, dimensions and explicit ambiguity policy',()=>{
  const p=D.create('washer'),imported=C.importDrawing(D.toDXF(p),'dxf');assert.equal(imported.geometry.rings.length,2);assert.ok(Math.abs(D.bounds(imported).width-50)<1e-8);assert.ok(Math.abs(D.bounds(imported).height-50)<1e-8);
  const noUnits=D.toDXF(p).replace(/(\$INSUNITS\r?\n70\r?\n)4/, '$10');assert.throws(()=>C.importDrawing(noUnits,'dxf'),/units/);assert.equal(C.importDrawing(noUnits,'dxf',{units:'mm'}).geometry.rings.length,2);
  assert.throws(()=>C.importDrawing('x'.repeat(2*1024*1024+1),'dxf'),/2 MB/);assert.throws(()=>C.importDrawing('', 'pdf'),/SVG or ASCII DXF/);
});
test('imported concave and nested geometry generates a pocket via the same CAM engine',()=>{
  const p=D.fromProfile({rings:[[[0,0],[40,0],[40,30],[20,30],[20,20],[0,20]],[[5,5],[10,5],[10,10],[5,10]]],units:'mm',title:'Nested plate'});
  const g=C.generate(p,C.defaults(p));assert.match(g.training.text,/ISLAND/);assert.equal(g.training.stock.x,p.stock.width/25.4);assert.ok(g.lineCount>20);
});
