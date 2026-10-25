'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../../numeracy-hub/design/design-model.js'),W=require('../../numeracy-hub/design/design-workflow.js'),C=require('../../numeracy-hub/cnc/design-cam.js'),H=require('../../numeracy-hub/cnc/design-workholding.js'),CAM=require('../../numeracy-hub/cnc/cam-engine.js');
const seq=(...plans)=>({version:1,steps:plans.map((operation,i)=>({id:'op-'+i,label:'Cut '+(i+1),operation}))});
const setup=(p,id,orientation,plans,fixture)=>({...W.defaultSetup(p,id,id),orientation,sequence:seq(...plans),fixture:fixture||H.defaults(p.machine,p.stock)});
const project=(p,...items)=>W.setSetups(p,{version:1,items});

test('all supported workholding controls round trip with explicit mm-to-inch mapping and no mutation',()=>{
  for(const machine of ['mill','lathe'])for(const m of H.methods(machine)){
    const p=D.create(machine==='mill'?'plate':'shaft'),fixture=H.defaults(machine,p.stock,m.id),before=JSON.stringify(fixture),clean=H.validate(fixture,machine),native=H.toTrainer(clean,machine);
    assert.equal(native.method,m.id);assert.equal(JSON.stringify(fixture),before);assert.notEqual(clean,fixture);
    assert.deepEqual(Object.keys(clean.params).sort(),m.fields.map(f=>f.key).sort());
  }
  const p=D.create('plate'),v=H.defaults('mill',p.stock);v.params.gripMm=5.08;assert.equal(H.toTrainer(v,'mill').params.grip,.2);
  const clamps=H.defaults('mill',p.stock,'clamps'),out=H.toTrainer(clamps,'mill').params;assert.equal(out.overlap,.5);assert.equal(out.parH,.5);assert.equal(out.bolt,.3);
  assert.equal(H.clearanceMm(H.defaults('lathe',{},'collet')),6.35);assert.equal(H.clearanceMm(H.defaults('lathe',{},'soft')),22.86);
});

test('fixture validation rejects accessors, extra fields, unknown methods and unsafe reinterpretation',()=>{
  const fixture=H.defaults('mill',{depth:10});let executed=false;
  const getter={params:{}};Object.defineProperty(getter,'method',{enumerable:true,get(){executed=true;return'vise';}});assert.throws(()=>H.validate(getter),/accessors/);assert.equal(executed,false);
  const accessor={method:'vise',params:{parallels:'jaws'}};Object.defineProperty(accessor.params,'gripMm',{enumerable:true,get(){executed=true;return5;}});assert.throws(()=>H.validate(accessor),/accessors/);assert.equal(executed,false);
  for(const value of [NaN,Infinity,0,40])assert.throws(()=>H.validate({...fixture,params:{...fixture.params,gripMm:value}}),/between/);
  assert.throws(()=>H.validate({...fixture,params:{...fixture.params,grip:1}}),/Unsupported/);
  assert.throws(()=>H.validate(fixture,'lathe'),/cannot hold/);assert.throws(()=>H.validate({method:'centers',params:{}}),/not supported/);
  const hidden={...fixture};Object.defineProperty(hidden,'junk',{value:true});assert.throws(()=>H.validate(hidden),/Unsupported/);
  const symbol={...fixture,[Symbol('x')]:true};assert.throws(()=>H.validate(symbol),/Unsupported/);
  assert.throws(()=>H.validate({method:'steady',params:{positionMm:20}}),/between/,'Reject a value the native rest builder would silently clamp');
});

test('setup chain carries original stock, chosen fixtures and only the selected dependency prefix',()=>{
  const p=D.create('plate'),a=C.defaults(p),v=H.defaults('mill',p.stock),soft=H.defaults('mill',p.stock,'vise_soft');soft.params.gripMm=2;
  const full=project(p,setup(p,'a','top',[{...a,depthMm:1}],v),setup(p,'b','bottom',[a],soft),setup(p,'c','top',[a])),before=JSON.stringify(full);
  const g=C.generateSetups(full,'b');assert.equal(g.setupId,'b');assert.equal(g.setupIndex,1);assert.equal(g.orientation,'bottom');assert.equal(g.chain.setups.length,2);assert.equal(C.generate(full).setupId,'c','Default generation honors the authoritative setup list');
  assert.equal(g.sourceFingerprint,W.setupFingerprint(full,'b'));assert.equal(g.training,g.chain.setups[1].training);assert.equal(g.chain.setups[1].training.setup.method,'vise_soft');assert.equal(g.training.setup.params.grip,2/25.4);
  for(const s of g.chain.setups){assert.deepEqual(s.training.stock,{x:p.stock.width/25.4,y:p.stock.height/25.4,z:p.stock.depth/25.4});assert.equal(s.training.initialMaterial,undefined);}
  assert.throws(()=>C.generate(full,a),/setup list is authoritative/);assert.throws(()=>C.generateSequence(full,seq(a)),/setup list is authoritative/);
  assert.equal(JSON.stringify(full),before);assert.throws(()=>C.generateSetups(full,'missing'),/Choose a setup/);
});

test('bottom setup mirrors exact circles and asymmetric polygons about the original stock height',()=>{
  const p=D.fromCanvas({shapeId:'circle',params:{r:8},units:'mm',title:'Offset hole'});p.stock.height=60;p.placement.y=5;
  const drill={...C.defaults(p,'drill'),toolDiameterMm:16,depthMm:1},g=C.generateSetups(project(p,setup(p,'top','top',[drill]),setup(p,'bottom','bottom',[drill])));
  assert.match(g.chain.setups[0].training.text,/Y0\.5118/);assert.match(g.chain.setups[1].training.text,/Y1\.8504/);assert.equal(g.project.placement.y,5);
  const poly=D.fromProfile({rings:[[[0,0],[10,0],[10,6],[0,2]]],units:'mm'});poly.stock.height=40;poly.placement.y=3;
  const cut={...C.defaults(poly),toolDiameterMm:1},calls=[],saved=CAM.genMill;CAM.genMill=job=>{calls.push(job);return saved(job);};
  try{C.generateSetups(project(poly,setup(poly,'a','top',[cut]),setup(poly,'b','bottom',[cut])));}finally{CAM.genMill=saved;}
  const top=calls[0].layers.OUTER_0.contours[0].segs,bottom=calls[1].layers.OUTER_0.contours[0].segs;
  assert.equal(top.length,bottom.length);for(let i=0;i<top.length;i++)for(const end of ['a','b']){assert.equal(top[i][end].x,bottom[i][end].x);assert.ok(Math.abs(top[i][end].y+bottom[i][end].y-40/25.4)<1e-9);}
  const signed=ss=>ss.reduce((n,s)=>n+s.a.x*s.b.y-s.b.x*s.a.y,0);assert.ok(signed(top)*signed(bottom)<0,'Mirroring reverses boundary winding');
});

test('cumulative face allowance follows each physical side and persists across lathe fixture changes',()=>{
  const p=D.create('plate'),f=C.defaults(p,'face'),g=C.generateSetups(project(p,setup(p,'a','top',[f]),setup(p,'b','bottom',[f]),setup(p,'c','top',[{...f,depthMm:1}])));
  assert.equal(g.setups[1].generation.steps[0].frame.previousFaceAllowanceMm,0);assert.equal(g.steps[0].frame.previousFaceAllowanceMm,.5);assert.match(g.training.text,/FACE THE TOP PASS 1 OF 1/);
  const shaft=D.create('shaft'),lathe=C.generateSetups(project(shaft,setup(shaft,'face','front',[C.defaults(shaft,'face')]),setup(shaft,'turn','front',[C.defaults(shaft)],H.defaults('lathe',shaft.stock,'collet'))));
  assert.equal(lathe.steps[0].frame.frontZMm,-.5);assert.equal(lathe.steps[0].frame.cutEndZMm,-80.5);assert.equal(lathe.training.setup.method,'collet');assert.equal(lathe.training.stock.stickout,100/25.4);
});

test('actual fixture projections govern lathe reach and parting prevents a later setup',()=>{
  const p=D.create('shaft');p.stock.length=90;const part=C.defaults(p,'part');
  const collet=project(p,setup(p,'a','front',[part],H.defaults('lathe',p.stock,'collet')));assert.doesNotThrow(()=>C.generateSetups(collet));
  assert.throws(()=>C.generateSetups(project(p,setup(p,'a','front',[part]))),/15.24 mm chuck3 clearance/);
  p.stock.length=100;assert.throws(()=>C.generateSetups(project(p,setup(p,'a','front',[part],H.defaults('lathe',p.stock,'soft')))),/22.86 mm soft clearance/);
  const parted=project(p,setup(p,'a','front',[part]),setup(p,'b','front',[C.defaults(p)]));assert.doesNotThrow(()=>C.generateSetups(parted,'a'));assert.throws(()=>C.generateSetups(parted),/previous setup parted off/);
});

test('setup evidence captures measured lineage, checks stay unmeasured and upstream edits invalidate downstream evidence only',()=>{
  const p=D.create('plate'),a=C.defaults(p),planned=project(p,setup(p,'a','top',[a]),setup(p,'b','bottom',[a])),g=C.generateSetups(planned,'a');
  const result={accepted:true,diagnostics:[],removedVolumeIn3:.1,setup:{id:'a',index:0,orientation:'top',inputMaterialFingerprint:'material-in',outputMaterialFingerprint:'material-out'}};
  const saved=C.record(g.project,g,result,true),r=saved.workflow.results[0];assert.equal(r.sourceFingerprint,W.setupFingerprint(saved,'a'));assert.equal(r.setup.outputMaterialFingerprint,'material-out');assert.match(r.summary,/Setup 1 a \(top\).*Completed through setup 1/);
  const edited=structuredClone(saved.workflow.setups);edited.items[1].sequence.steps[0].operation.depthMm=1;const future=W.setSetups(saved,edited);assert.equal(W.resultStatus(future,r).stale,false);assert.doesNotThrow(()=>C.record(future,g,result,true));
  edited.items[0].fixture.params.gripMm+=.1;const upstream=W.setSetups(saved,edited);assert.equal(W.resultStatus(upstream,r).stale,true);assert.throws(()=>C.record(upstream,g,result,true),/changed/);
  assert.throws(()=>C.record(g.project,g,{...result,setup:{...result.setup,id:'b'}},true),/does not belong/);assert.throws(()=>C.record(g.project,g,{...result,setup:undefined},true),/does not belong/);
  const checked=C.record(g.project,g,result,false).workflow.results[0];assert.equal(checked.kind,'check');assert.equal(checked.setup.inputMaterialFingerprint,null);assert.equal(checked.setup.outputMaterialFingerprint,null);
});

test('setup plans generate identical physical programs in mm and inch display units',()=>{
  const p=D.create('plate'),a=C.defaults(p),planned=project(p,setup(p,'a','top',[a]),setup(p,'b','bottom',[a])),mm=C.generateSetups(planned);planned.units='in';const inch=C.generateSetups(planned);
  assert.deepEqual(mm.chain,inch.chain);assert.equal(mm.training.setup.params.grip,inch.training.setup.params.grip);
});


test('generation rejects historic invalid setup goals after a stock edit while preserving a valid earlier prefix',()=>{
  const p=D.create('plate'),a={...C.defaults(p),depthMm:1},first=setup(p,'a','top',[a]),second=setup(p,'b','bottom',[a]);second.comparison.depthMm=8;
  let edited=project(p,first,second);edited.stock.depth=5;
  const items=structuredClone(edited.workflow.setups);items.items[1].label='Review bottom';edited=W.setSetups(edited,items);
  assert.equal(W.setupState(edited,'b').valid,false);assert.doesNotThrow(()=>C.generateSetups(edited,'a'));
  assert.throws(()=>C.generateSetups(edited,'b'),/Setup 2.*comparison depth/);
});
