'use strict';
const assert = require('node:assert/strict');
const M = require('../../numeracy-hub/cnc/manual-engine.js');
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-9, `${a} != ${b}`);
let checks=0;
function test(name,fn){fn();checks++;console.log('PASS '+name);}

test('default setup has physically consistent metric/inch boundary',()=>{
  for(const machine of ['mill','lathe'])for(const units of ['mm','in']){
    const state=M.create(M.defaultConfig(machine,units)),project=M.project(state);
    assert.equal(project.machine,machine);assert.equal(project.gen,'classic');
    assert.equal(state.actions.length,0);assert.equal(state.spindle.on,false);
    assert.ok(Object.isFrozen(state)&&Object.isFrozen(state.config.stock));
    const factor=units==='mm'?25.4:1;
    if(machine==='mill'){near(project.stock.x,state.config.stock.x/factor);near(project.tools[1].dia,state.config.tool.diameter/factor);near(project.tools[1].len,state.config.tool.length/factor);}
    else{near(project.stock.dia,state.config.stock.diameter/factor);near(project.stock.stickout,state.config.stock.length/factor);assert.equal(project.stock.extra,0);}
    assert.ok(project.text.includes(units==='mm'?'G21':'G20'));
  }
});
test('configuration rejects invalid geometry/units and nonfinite values',()=>{
  for(const [key,value]of [['units','cm'],['clearance',0],['feed',0],['rpm',90000],['rpm',1200.5],['jog',NaN],['programNumber',1.5]]){
    assert.throws(()=>M.create({...M.defaultConfig(),[key]:value}));
  }
  assert.throws(()=>M.create({...M.defaultConfig(),stock:{x:0,y:70,z:20}}));
  assert.throws(()=>M.create({...M.defaultConfig(),tool:{type:'endmill',diameter:Infinity,length:100}}));
  assert.throws(()=>M.defaultConfig('router'));assert.throws(()=>M.defaultConfig('mill','feet'));
});
test('manual feed requires running spindle; rejected action leaves history unchanged',()=>{
  const old=M.create(M.defaultConfig());const snapshot=JSON.stringify(old);
  assert.throws(()=>M.apply(old,{type:'move',target:{z:-1},motion:'feed'}),/spindle/);
  assert.equal(JSON.stringify(old),snapshot);
  assert.throws(()=>M.apply(old,{type:'move',target:{x:NaN},motion:'rapid'}));
  assert.throws(()=>M.apply(old,{type:'move',target:{x:999999},motion:'rapid'}));
  assert.throws(()=>M.apply(old,{type:'move',target:{a:1},motion:'rapid'}));
});
test('immutable mill action history emits actual mill movements and preserves feed',()=>{
  const initial=M.create(M.defaultConfig());
  let state=M.apply(initial,{type:'spindle',on:true,rpm:2400});
  state=M.apply(state,{type:'coolant',on:true});
  state=M.apply(state,{type:'move',target:{x:10,y:10},motion:'rapid'});
  state=M.apply(state,{type:'move',target:{z:-1},motion:'feed',feed:80});
  state=M.apply(state,{type:'move',target:{x:50},motion:'feed'});
  assert.equal(state.actions.length,5);assert.equal(initial.actions.length,0);
  assert.deepEqual(state.position,{x:50,y:10,z:-1});assert.equal(state.feed,80);
  const code=M.code(state);assert.match(code,/G17 G90 G40 G49 G80 G94/);assert.match(code,/G43 H01 Z5\.000/);
  assert.match(code,/S2400 M03/);assert.match(code,/G01 Z-1\.000 F80\.000/);assert.match(code,/G01 X50\.000 F80\.000/);
  assert.ok(!/M30/.test(code));assert.ok(!code.trim().endsWith('%'));
  const complete=M.code(state,{complete:true});assert.match(complete,/G00 Z5\.000\nM09\nM05\nM30\n%\n$/);
  assert.equal(M.lines(state).filter(r=>r.actionIndex!==null).length,5);
  const undone=M.undo(state);assert.deepEqual(undone.position,{x:10,y:10,z:-1});assert.equal(undone.actions.length,4);
  assert.deepEqual(M.rebuild(state.config,state.actions),state);
});
test('lathe uses diameter X and work Z with G98/G97, never mill G90/G94',()=>{
  let state=M.create(M.defaultConfig('lathe','mm'));
  assert.deepEqual(state.position,{x:50,y:0,z:5});
  state=M.apply(state,{type:'spindle',on:true,rpm:1000});
  state=M.apply(state,{type:'move',target:{z:-15},motion:'rapid'});
  state=M.apply(state,{type:'move',target:{x:36},motion:'feed',feed:60});
  assert.equal(state.position.x,36);assert.equal(M.project(state).stock.dia,40/25.4);
  const code=M.code(state);assert.match(code,/G18 G40 G80 G98 G97/);assert.match(code,/T0101/);
  assert.ok(!/\bG(?:90|94)\b/.test(code));assert.match(code,/G01 X36\.000 F60\.000/);
  const complete=M.code(state,{complete:true});assert.match(complete,/G00 X50\.000\nG00 Z5\.000\nM09\nM05\nM30\n%/);
  assert.throws(()=>M.apply(state,{type:'move',motion:'rapid',target:{y:1}}),/two-axis/);
  assert.throws(()=>M.apply(state,{type:'move',motion:'feed',target:{x:-1}}),/diameter/);
});
test('retract is sequential and never moves down to a lower clearance',()=>{
  let mill=M.create(M.defaultConfig());mill=M.apply(mill,{type:'move',motion:'rapid',target:{z:20}});
  assert.equal(M.apply(mill,{type:'retract'}),mill);
  const finish=M.code(mill,{complete:true});assert.ok(!finish.includes('G00 Z5.000\nM09'));
  let lathe=M.create(M.defaultConfig('lathe'));lathe=M.apply(lathe,{type:'spindle',on:true});
  lathe=M.apply(lathe,{type:'move',motion:'feed',target:{x:38,z:-10}});
  lathe=M.apply(lathe,{type:'retract'});
  assert.deepEqual(lathe.position,{x:50,y:0,z:5});assert.match(M.code(lathe),/G00 X50\.000\nG00 Z5\.000\n$/);
});
test('inch precision, mixed unit isolation and safe comment formatting',()=>{
  let state=M.create({...M.defaultConfig('mill','in'),title:'Test)\nM03\n(%'});
  state=M.apply(state,{type:'move',target:{x:0.123456,y:-0.000001},motion:'rapid'});
  assert.equal(state.position.x,.1235);assert.equal(state.position.y,0);assert.equal(M.format(-0.0000001,'in'),'0.0000');
  const code=M.code(state);assert.match(code,/G00 X0\.1235 Y0\.0000/);assert.equal(code.split('\n').filter(l=>l==='M03').length,0);
  assert.equal(M.create(M.defaultConfig('mill','mm')).actions.length,0);
});
test('dwell uses decimal seconds and standalone feed setting remains modal',()=>{
  let state=M.create(M.defaultConfig());state=M.apply(state,{type:'feed',value:55});
  state=M.apply(state,{type:'dwell',seconds:2});state=M.apply(state,{type:'spindle',on:true});
  state=M.apply(state,{type:'move',motion:'feed',target:{x:1}});
  assert.match(M.code(state),/F55\.000\nG04 P2\.000/);assert.match(M.code(state),/G01 X1\.000 F55\.000/);
  assert.throws(()=>M.apply(state,{type:'dwell',seconds:Infinity}));
});
test('changing RPM while stopped records the selected speed immediately',()=>{
  const state=M.apply(M.create(M.defaultConfig()),{type:'spindle',on:false,rpm:2200});
  assert.equal(state.spindle.on,false);assert.equal(state.spindle.rpm,2200);
  assert.match(M.code(state),/S2200 M05\n$/);
});
console.log(JSON.stringify({checks,status:'pass'}));
