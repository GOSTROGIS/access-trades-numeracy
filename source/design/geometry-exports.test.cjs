'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const D=require('../../numeracy-hub/design/design-model.js');
const CAD=require('../../numeracy-hub/cnc/cad-engine.js');
const CAM=require('../../numeracy-hub/cnc/cam-engine.js');
const adapter=require('../../numeracy-hub/cnc/design-cam.js');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const ring=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
function placed(p){p.placement={x:7,y:11};p.stock.width=80;p.stock.height=90;return p;}
function captureMachineInput(p){
  const original=CAM.genMill;let input;
  CAM.genMill=options=>{input=options;return{text:'G1 X0 Y0',stock:options.stock,warnings:[]};};
  try{adapter.generate(p,{...adapter.defaults(p),kind:'profile-out'});}finally{CAM.genMill=original;}
  return input;
}
test('a 3 by 4 cm triangle keeps handedness, placement and physical scale in SVG, DXF and CAM',()=>{
  const p=placed(D.fromCanvas({shapeId:'right-triangle',params:{b:3,h:4},units:'cm'}));
  near(D.measurements(p).items.find(i=>i.key==='A').value,600);
  const dxf=CAD.parseDXF(D.toDXF(p));
  assert.equal(dxf.insunits,4);assert.deepEqual(dxf.skipped,{});assert.deepEqual(dxf.warnings,[]);
  assert.deepEqual(dxf.items.map(i=>[i.seg.a.x,i.seg.a.y]),[[7,11],[37,11],[7,51]]);
  assert.match(D.toSVG(p),/d="M7,79L37,79L7,39Z"/);
  const machine=captureMachineInput(p),segments=Object.values(machine.layers)[0].contours[0].segs;
  const points=segments.flatMap(s=>[s.a,s.b]);
  for(const expected of [[7,11],[37,11],[7,51]])assert.ok(points.some(v=>Math.abs(v.x*25.4-expected[0])<1e-7&&Math.abs(v.y*25.4-expected[1])<1e-7));
  near(machine.stock.x*25.4,80);near(machine.stock.y*25.4,90);
  const svg=D.toSVG(p),dxfText=D.toDXF(p);p.units='in';
  assert.equal(D.toSVG(p),svg);assert.equal(D.toDXF(p),dxfText);
});
test('washer exports and CNC preserve exact concentric circles and hole identity',()=>{
  const p=placed(D.create('washer')),parsed=CAD.parseDXF(D.toDXF(p));
  assert.deepEqual(parsed.items.map(i=>i.layer),['PROFILE','HOLE']);
  assert.deepEqual(parsed.items.map(i=>i.seg.r),[25,10]);
  for(const item of parsed.items){assert.equal(item.seg.t,'A');near(item.seg.c.x,32);near(item.seg.c.y,36);}
  assert.match(D.toSVG(p),/<circle cx="32" cy="54" r="25"\/>/);
  assert.match(D.toSVG(p),/<circle cx="32" cy="54" r="10"\/>/);
  const input=captureMachineInput(p);
  for(const [layer,radius] of [['OUTER',25],['HOLE',10]]){
    const arc=input.layers[layer].contours[0].segs[0];
    assert.equal(arc.t,'A');near(arc.r*25.4,radius);near(arc.c.x*25.4,32);near(arc.c.y*25.4,36);
  }
  assert.deepEqual(input.ops.map(o=>o.op),['profile-out','profile-in']);
});
test('nested profile boundaries use even-odd holes consistently across preview, DXF and CNC',()=>{
  const p=placed(D.fromProfile({rings:[ring(100,200,40,40),ring(110,210,20,20),ring(115,215,10,10)],units:'mm'}));
  near(D.measurements(p).items[0].value,1300);
  assert.match(D.render(p),/fill-rule="evenodd"/);
  const parsed=CAD.parseDXF(D.toDXF(p));
  assert.equal(parsed.items.filter(i=>i.layer==='HOLE').length,4);
  assert.equal(parsed.items.filter(i=>i.layer==='PROFILE').length,8);
  const input=captureMachineInput(p);
  assert.deepEqual(Object.keys(input.layers),['OUTER_0','HOLE_1','OUTER_2']);
  assert.deepEqual(input.ops.map(o=>o.op),['profile-out','profile-in','profile-out']);
});
