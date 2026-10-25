'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../../numeracy-hub/design/design-model.js'),W=require('../../numeracy-hub/design/design-workflow.js'),C=require('../../numeracy-hub/cnc/design-cam.js');
const seq=(...operations)=>({version:1,steps:operations.map((operation,i)=>({id:'step-'+i,label:'Operation '+(i+1),operation}))});
const fmt=n=>(Math.round(n/25.4*10000)/10000).toFixed(4).replace(/0+$/,'');

test('kind defaults select usable facing and parting parameters without mutating canonical dimensions',()=>{
  const mill=D.create('plate'),lathe=D.create('shaft');
  assert.ok(C.kinds(mill).some(k=>k.kind==='face'));assert.ok(!C.kinds(mill).some(k=>k.kind==='part'));
  assert.deepEqual(C.kinds(lathe).map(k=>k.kind),['face','turn','part']);
  assert.equal(C.defaults(mill,'face').toolDiameterMm,25.4);assert.equal(C.defaults(lathe,'part').depthMm,lathe.geometry.params.h);
  for(const p of [mill,lathe])for(const kind of C.kinds(p).map(k=>k.kind).filter(k=>['face','part'].includes(k))){
    const before=JSON.stringify(p),plan=C.defaults(p,kind),g=C.generate(p,plan);
    assert.equal(g.plan.kind,kind);assert.equal(g.project.workflow.sequence,undefined);assert.equal(g.sourceFingerprint,W.fingerprint(g.project));assert.equal(JSON.stringify(p),before);
    assert.match(g.training.text,/G20/);assert.ok(g.lineCount>15);
  }
  assert.throws(()=>C.defaults(mill,'part'),/supported/);
});

test('mill facing uses bounded cumulative passes before absolute-depth pocketing on one stock',()=>{
  const p=D.create('plate'),f={...C.defaults(p,'face'),depthMm:1,stepDownMm:.5},g=C.generateSequence(p,seq(f,{...f,depthMm:1.5},{...C.defaults(p),depthMm:2})),text=g.training.text;
  assert.equal((text.match(/^O\d+/gm)||[]).length,1);assert.equal((text.match(/^M30$/gm)||[]).length,1);
  assert.match(text,/FACE THE TOP PASS 1 OF 2 TO ORIGINAL Z-0\.0197/);assert.match(text,/FACE THE TOP PASS 1 OF 1 TO ORIGINAL Z-0\.0591/);
  assert.match(text,/POCKET TARGET ROUGH Z-0\.0787/);assert.doesNotMatch(text,/Z-0\.1378/,'Pocket floor must not silently gain 1.5mm of facing');
  assert.equal(g.steps[1].frame.previousFaceAllowanceMm,1);assert.equal(g.steps[2].frame.frontZMm,-1.5);assert.equal(g.steps[2].frame.cutEndZMm,-2);
  assert.equal(g.training.tools[1].type,'face');assert.equal(g.training.tools[3].type,'endmill');assert.equal(g.training.stock.z,p.stock.depth/25.4);
  assert.match(text,/G00 Z1\. M09\nM05\nG91 G28 Z0\.\nG90\nM01\n\(STEP 2:/);
  const air=C.generateSequence(p,seq(f,{...C.defaults(p),depthMm:1,stepDownMm:.5}));assert.ok(air.warnings.some(w=>/already faced/.test(w.message)));
});

test('lathe face-turn-part offsets geometry from the newly faced front without moving G54 or stock',()=>{
  const p=D.create('shaft'),f=C.defaults(p,'face'),t=C.defaults(p,'turn'),part=C.defaults(p,'part'),g=C.generateSequence(p,seq(f,t,part)),text=g.training.text;
  assert.match(text,/Z0 = ORIGINAL STOCK FRONT/);assert.doesNotMatch(text,/G10|G92/);
  assert.match(text,/FACE PASS 1 OF 1 TO ORIGINAL Z-0\.0197/);
  assert.ok(text.includes('G01 Z'+fmt(-.5)));assert.ok(text.includes('X'+fmt(30)+' Z'+fmt(-80.5)));
  assert.ok(text.includes('PART OFF AT ORIGINAL Z'+fmt(-80.5)));assert.equal(g.steps[2].frame.cutEndZMm,-80.5);
  assert.equal(g.training.stock.stickout,100/25.4);assert.equal(g.training.stock.extra,0);assert.equal(g.training.tools[3].type,'part');assert.equal(g.training.tools[3].width,3/25.4);
  assert.match(text,/T0101/);assert.match(text,/T0202/);assert.match(text,/T0303/);assert.match(text,/G71 P300 Q400/);assert.match(text,/G70 P300 Q400/);
  assert.equal((text.match(/^M30$/gm)||[]).length,1);
});

test('lathe face passes increase cumulative allowance and part pecks obey radial depth including centre crossing',()=>{
  const p=D.create('shaft');p.stock.length=150;
  const face={...C.defaults(p,'face'),depthMm:8,stepDownMm:4},part={...C.defaults(p,'part'),depthMm:80,stepDownMm:2};
  const g=C.generateSequence(p,seq(face,{...face,depthMm:12},part)),text=g.training.text;
  assert.match(text,/FACE PASS 1 OF 2/);assert.match(text,/FACE PASS 2 OF 2/);assert.match(text,/FACE PASS 1 OF 1 TO ORIGINAL Z-0\.4724/);
  assert.equal(g.steps[2].frame.cutEndZMm,-92);
  const partText=text.slice(text.indexOf('(PART OFF')),diameters=[p.stock.diameter,...[...partText.matchAll(/G01 X(-?[\d.]+) F/g)].map(m=>Number(m[1])*25.4)];
  assert.ok(diameters.length>5);assert.ok(diameters.at(-1)<0);
  for(let i=1;i<diameters.length;i++)assert.ok((diameters[i-1]-diameters[i])/2<=2.002,'Each radial peck including centre crossing is bounded');
  assert.equal((partText.match(/G00 X/g)||[]).length,diameters.length,'Each cut retracts radially before repositioning');
});

test('sequence rejects misplaced facing, repeated allowance, premature parting and unreachable blade back atomically',()=>{
  const p=D.create('shaft'),f=C.defaults(p,'face'),t=C.defaults(p),part=C.defaults(p,'part'),before=JSON.stringify(p);
  assert.throws(()=>C.generateSequence(p,seq(t,f)),/Step 2.*facing must come before/);
  assert.throws(()=>C.generateSequence(p,seq(f,f)),/Step 2.*must increase/);
  assert.throws(()=>C.generateSequence(p,seq(part,t)),/Step 1.*parting must be the final/);
  assert.throws(()=>C.generateSequence(p,seq({...f,depthMm:2},t,part)),/Step 3.*blade behind.*chuck clearance/);
  assert.throws(()=>C.generateSequence(p,seq({...f,depthMm:7,stepDownMm:7})),/6.35/);
  assert.throws(()=>C.generateSequence(p,seq({...part,stepDownMm:.127})),/more than 100 passes/);
  assert.equal(JSON.stringify(p),before);
  const mill=D.create('plate');assert.throws(()=>C.generateSequence(mill,seq({...C.defaults(mill),kind:'part'})),/supported/);
});

test('shorter and longer part lengths remain explicit student choices with honest warnings',()=>{
  const p=D.create('shaft');p.stock.length=130;
  for(const depth of [60,90]){
    const g=C.generateSequence(p,seq({...C.defaults(p,'part'),depthMm:depth}));
    assert.ok(g.warnings.some(w=>w.message.includes(depth+' mm produces a piece '+(depth<80?'shorter':'longer'))));
    assert.equal(g.project.geometry.params.h,80);assert.equal(g.steps[0].frame.cutEndZMm,-depth);assert.equal(g.training.stock.stickout,130/25.4);
  }
  const shallow=C.generate(p,{...C.defaults(p,'part'),depthMm:.5,stepDownMm:2});assert.equal(shallow.plan.stepDownMm,2,'Radial peck need not be smaller than axial finished length');
});

test('face-turn-part generation is physically identical in mm and inch display modes; evidence becomes stale after facing edits',()=>{
  const p=D.create('shaft'),s=seq(C.defaults(p,'face'),C.defaults(p),C.defaults(p,'part')),metric=C.generateSequence(p,s);p.units='in';const inch=C.generateSequence(p,s);
  assert.equal(metric.training.text,inch.training.text);assert.deepEqual(metric.training.stock,inch.training.stock);
  const captured=C.record(metric.project,metric,{accepted:true,removedVolumeIn3:.1,diagnostics:[]},true),changed=structuredClone(captured.workflow.sequence);changed.steps[0].operation.depthMm=.6;
  const edited=W.setSequence(captured,changed);assert.equal(W.resultStatus(edited,captured.workflow.results[0]).stale,true);assert.throws(()=>C.record(edited,metric,{accepted:true},true),/changed/);
});


test('pass limits use additional facing allowance and include the parting centre crossing',()=>{
  const p=D.create('shaft');p.stock.length=254;
  const f=C.defaults(p,'face'),g=C.generateSequence(p,seq({...f,depthMm:150,stepDownMm:2},{...f,depthMm:201,stepDownMm:1}));
  assert.match(g.training.text,/FACE PASS 51 OF 51/);assert.equal(g.steps[1].frame.previousFaceAllowanceMm,150);
  assert.throws(()=>C.generateSequence(p,seq({...f,depthMm:150,stepDownMm:1})),/100 passes/);
  p.stock.diameter=30;p.geometry.params.r=10;
  assert.throws(()=>C.generateSequence(p,seq({...C.defaults(p,'part'),stepDownMm:.15})),/100 passes/,'Extra centre crossing also counts toward the bounded pecks');
});
