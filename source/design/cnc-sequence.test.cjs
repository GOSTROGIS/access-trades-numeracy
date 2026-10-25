'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../../numeracy-hub/design/design-model.js'),W=require('../../numeracy-hub/design/design-workflow.js'),C=require('../../numeracy-hub/cnc/design-cam.js');
const sequence=(...plans)=>({version:1,steps:plans.map((operation,i)=>({id:'step-'+(i+1),label:'Cut '+(i+1),operation}))});

test('ordered drilling and profiling create one program, stock and tool library',()=>{
  const p=D.create('washer'),base=C.defaults(p),seq=sequence({...base,kind:'drill',toolDiameterMm:20,spindleRpm:1200,feedMmPerMin:90},{...base,kind:'profile-out',toolDiameterMm:6,spindleRpm:4000,feedMmPerMin:200}),before=JSON.stringify(p);
  const g=C.generateSequence(p,seq),text=g.training.text;
  assert.equal(JSON.stringify(p),before);assert.equal((text.match(/^O\d+/gm)||[]).length,1);assert.equal((text.match(/^M30$/gm)||[]).length,1);
  assert.ok(text.indexOf('(STEP 1:')<text.indexOf('(STEP 2:'));assert.ok(text.indexOf('G83')<text.indexOf('(STEP 2:'));
  assert.ok(text.indexOf('T1 M06')<text.indexOf('T2 M06'));assert.match(text,/S1200 M03/);assert.match(text,/S4000 M03/);
  assert.ok(text.includes('F'+200/25.4));assert.equal(g.training.tools[1].type,'drill');assert.equal(g.training.tools[1].dia,20/25.4);assert.equal(g.training.tools[2].dia,6/25.4);
  assert.equal(g.training.stock.x,p.stock.width/25.4);assert.equal(g.training.stock.z,p.stock.depth/25.4);assert.equal(g.steps[1].toolNumber,2);
});
test('each milling step retracts and stops before its next tool; depths stay absolute',()=>{
  const p=D.create('plate'),a={...C.defaults(p),depthMm:1,stepDownMm:1},b={...a,depthMm:2};const g=C.generateSequence(p,sequence(a,b));
  assert.match(g.training.text,/G00 Z1\. M09\nM05\nG91 G28 Z0\.\nG90\nM01\n\(STEP 2:/);
  assert.match(g.training.text,/Z-0\.0787/);assert.doesNotMatch(g.training.text,/Z-0\.1181/,'Second depth is not added to the first');
  assert.equal(g.training.stock.z,p.stock.depth/25.4);
});
test('turning sequences use distinct tools and noncolliding G71/G70 profile labels',()=>{
  const p=D.create('shaft'),base=C.defaults(p),g=C.generateSequence(p,sequence({...base,depthMm:40},{...base,depthMm:80,spindleRpm:1800,feedMmPerMin:100})),text=g.training.text;
  assert.match(text,/T0101/);assert.match(text,/T0202/);assert.match(text,/G71 P100 Q200/);assert.match(text,/G70 P100 Q200/);assert.match(text,/G71 P300 Q400/);assert.match(text,/G70 P300 Q400/);
  const labels=text.match(/^N\d+/gm);assert.equal(labels.length,new Set(labels).size);assert.match(text,/M09\nM05\n\(STEP 2:/);assert.equal((text.match(/^M30$/gm)||[]).length,1);
  assert.equal(g.training.stock.stickout,p.stock.length/25.4);assert.match(text,/G97 S1800 M03/);
});
test('clear-around steps reuse pocket island clearing with an envelope beyond the stock',()=>{
  const p=D.create('plate'),a={...C.defaults(p),kind:'clear-outside',toolDiameterMm:3,depthMm:1},g=C.generateSequence(p,sequence(a,{...a,depthMm:2}));
  assert.match(g.training.text,/POCKET CLEAR_OUTSIDE_1/);assert.match(g.training.text,/ISLAND/);assert.match(g.training.text,/POCKET CLEAR_OUTSIDE_2/);assert.match(g.training.text,/X-/);
  assert.equal(g.training.stock.x,p.stock.width/25.4,'Clearing envelope does not resize stock');assert.equal(g.training.stock.y,p.stock.height/25.4);
  assert.equal(C.generate(p,a).project.workflow.operation.kind,'clear-outside','Legacy explicit operation API remains usable');
});
test('invalid sequence members fail atomically with a named step',()=>{
  const p=D.create('plate'),a=C.defaults(p),before=JSON.stringify(p);
  assert.throws(()=>C.generateSequence(p,sequence()),/at least one/);
  assert.throws(()=>C.generateSequence(p,sequence(a,{...a,depthMm:11})),/Step 2/);
  assert.throws(()=>C.generateSequence(p,sequence(...Array(13).fill(a))),/12/);
  const duplicate=sequence(a,a);duplicate.steps[1].id=duplicate.steps[0].id;assert.throws(()=>C.generateSequence(p,duplicate),/duplicate|unique/i);
  assert.equal(JSON.stringify(p),before);
});
test('order, tools and cutting changes invalidate sequence evidence; check cannot carry a previous comparison',()=>{
  const p=D.create('plate'),a=C.defaults(p),g=C.generateSequence(p,sequence({...a,depthMm:1},a)),r={accepted:true,removedVolumeIn3:.1,diagnostics:[]};
  const captured=C.record(g.project,g,r,true);assert.equal(captured.workflow.results[0].operationKind,'sequence');assert.equal(captured.workflow.results[0].operationCount,2);
  const reordered=W.setSequence(captured,{version:1,steps:[...captured.workflow.sequence.steps].reverse()});assert.equal(W.resultStatus(reordered,captured.workflow.results[0]).stale,true);assert.throws(()=>C.record(reordered,g,r,true),/changed/);
  assert.throws(()=>C.record(g.project,g,r,false,{}),/preflight check cannot capture/);
});
test('sequence generation preserves canonical dimensions across display units and legacy calls',()=>{
  const p=D.create('plate'),a=C.defaults(p),seq=sequence({...a,depthMm:1},a),metric=C.generateSequence(p,seq);p.units='in';const inch=C.generateSequence(p,seq);assert.equal(metric.training.text,inch.training.text);
  const legacy=W.setOperation(D.create('plate'),a);assert.deepEqual(C.generate(legacy).plan,a);assert.deepEqual(C.generate(metric.project).sequence,metric.sequence);
});
