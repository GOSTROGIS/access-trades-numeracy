'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const M=require('../../numeracy-hub/cnc/design-material.js'),D=require('../../numeracy-hub/design/design-model.js'),W=require('../../numeracy-hub/design/design-workflow.js'),C=require('../../numeracy-hub/cnc/design-comparison.js');
const near=(a,b,e=1e-6)=>assert.ok(Math.abs(a-b)<=e,`${a} != ${b}`);
function blank(){return{format:'access-simulated-material',version:1,source:'scene-stock',units:'mm',machine:'mill',orientation:'top',complete:true,alarm:null,stock:{widthMm:76.2,heightMm:50.8,depthMm:12.7},data:{kind:'heightfield',nx:31,ny:21,dxMm:2.54,dyMm:2.54,topMm:Array(651).fill(0),bottomMm:Array(651).fill(-12.7)}};}
function setups(){const html=fs.readFileSync(path.resolve(__dirname,'../../numeracy-hub/cnc/index.html'),'utf8'),code=html.slice(html.indexOf('const SETUPS = (function () {'),html.indexOf('/* ===================================================================\n   THREE.JS'));
  const end=code.indexOf('\n})();');const context=vm.createContext({AccessDesignMaterial:M});vm.runInContext(code.slice(0,end+6)+'\nglobalThis.api=SETUPS;',context);return context.api;
}
function nativeStock(machine){
  const html=fs.readFileSync(path.resolve(__dirname,'../../numeracy-hub/cnc/index.html'),'utf8');
  const code=machine==='mill'?html.slice(html.indexOf('  class MillStock {'),html.indexOf('  /* ---------------- lathe stock')):html.slice(html.indexOf('  class LatheStock {'),html.indexOf('  /* ---------------- workholding'));
  const capture=html.slice(html.indexOf('  function materialSnapshot(meta)'),html.indexOf('  /* Exact-resolution, detached stock check'));
  const context=vm.createContext({THREE:{Group:class{constructor(){this.children=[];}}}});
  vm.runInContext(code+'\nlet M;\n'+capture+'\nglobalThis.make=()=>{const stock='+(machine==='mill'?'new MillStock(3,2,.5,false)':'new LatheStock(40/25.4,-.7,100/25.4,false)')+';M={type:"'+machine+'",stock,setup:{stock:{stickout:100/25.4}}};return stock;};globalThis.capture=materialSnapshot;',context);
  return{stock:context.make(),snapshot:()=>context.capture({complete:true,program:'native-contact-regression'})};
}
test('native top/bottom transform preserves holes, axes, material volume and canonical fingerprint',()=>{
  const s=blank();s.data.topMm[3]=-4;s.data.bottomMm[3]=-11;s.data.topMm[10]=s.data.bottomMm[10]=-7;
  const flipped=M.orient(s,'bottom'),k=20*31+3;near(flipped.data.topMm[k],-1.7);near(flipped.data.bottomMm[k],-8.7);
  assert.equal(flipped.data.topMm[20*31+10],flipped.data.bottomMm[20*31+10],'An empty column must remain empty');
  assert.equal(M.fingerprint(s),M.fingerprint(flipped));assert.equal(M.fingerprint(s),M.fingerprint(M.orient(flipped,'top')));
  const original=s.data.topMm[3];flipped.data.bottomMm[k]=99;assert.equal(s.data.topMm[3],original,'Transfer must be detached');
});
test('native seeding preserves both cut surfaces and rejects changed stock, partial results and lathe remounts',()=>{
  const s=blank();s.data.topMm.fill(-1);s.data.bottomMm[0]=-10;const n=M.native(s),target={...n,h:new Float32Array(n.h.length),b:new Float32Array(n.b.length)};
  M.seed(target,s,true);near(target.h[0]*25.4,-1);near(target.b[0]*25.4,-10);assert.notEqual(target.h0,target.h);
  const flipped=M.orient(s,'bottom');M.seed(target,flipped,true);const measured=structuredClone(flipped);measured.data.topMm=Array.from(target.h,n=>n*25.4);measured.data.bottomMm=Array.from(target.b,n=>n*25.4);assert.equal(M.fingerprint(measured),M.fingerprint(s),'Changing setup cannot round the measured material into a different digest');
  assert.throws(()=>M.seed({...target,sx:4},s,true),/original stock/);assert.throws(()=>M.orient({...s,complete:false},'bottom'),/completed/);
  const lathe={format:s.format,version:1,source:s.source,units:'mm',machine:'lathe',orientation:'front',complete:true,stock:{diameterMm:10,lengthMm:20},data:{kind:'radial-profile',z0Mm:0,dzMm:1,frontZMm:20,radiiMm:Array(21).fill(5),detachedParts:1}};
  assert.throws(()=>M.native(lathe),/parted-off/);assert.throws(()=>M.orient(lathe,'back'),/Reversing/);
});
test('measured seating raises the actual fixture and its contact checks retain original datum',()=>{
  const S=setups(),s=blank();s.data.topMm.fill(-1.27);const flipped=M.orient(s,'bottom'),geo=S.build('mill',{x:3,y:2,z:.5},{method:'vise',params:{grip:.15,parallels:'jaws'}});
  const before=geo.boxes.find(b=>b.kind==='parallel').z1;M.seatFixture(geo,flipped);near(geo.seatingOffset,.05);near(geo.boxes.find(b=>b.kind==='parallel').z1,before+.05);
  const r=S.check({geo,steps:[],tools:{},tipOf:()=>{},label:()=>'',initialMaterial:flipped});assert.equal(r.crash,0,JSON.stringify(r.findings));assert.ok(r.findings.some(f=>f.code==='SETUP-SEAT'));
  assert.equal(flipped.stock.depthMm,12.7);assert.equal(flipped.data.topMm[0],0,'Original bottom datum stays zero after flipping');
});
test('remaining material with a pocket over one parallel or missing jaw contact blocks the next setup',()=>{
  const S=setups(),s=blank();for(let j=18;j<21;j++)for(let i=0;i<31;i++)s.data.topMm[j*31+i]=-5;
  const flipped=M.orient(s,'bottom'),geo=S.build('mill',{x:3,y:2,z:.5},{method:'vise',params:{grip:.15,parallels:'jaws'}});M.seatFixture(geo,flipped);
  const r=S.check({geo,steps:[],tools:{},tipOf:()=>{},label:()=>'',initialMaterial:flipped});assert.ok(r.findings.some(f=>f.code==='SETUP-SUPPORT'&&f.level==='crash'));
  const missing=blank();for(let i=0;i<31;i++)missing.data.topMm[i]=-12.7;
  const grip=S.check({geo:S.build('mill',{x:3,y:2,z:.5},{method:'vise',params:{grip:.15,parallels:'jaws'}}),steps:[],tools:{},tipOf:()=>{},label:()=>'',initialMaterial:missing});assert.ok(grip.findings.some(f=>f.code==='SETUP-GRIP'&&f.level==='crash'));
});
test('actual faced stock seats strap noses independently from lower supports on either orientation',()=>{
  const S=setups(),actual=nativeStock('mill');actual.stock.cut({x:0,y:1,z:-.05},{x:3,y:1,z:-.05},2,1);
  for(const orientation of ['top','bottom']){
    const incoming=M.orient(actual.snapshot(),orientation),geo=S.build('mill',{x:3,y:2,z:.5},{method:'clamps',params:{place:'ends',overlap:.5,heel:.06,bolt:.3,parH:.5,parPos:'clamps'}});
    M.seatFixture(geo,incoming);const nose=orientation==='top'?actual.stock.h[0]:0,lower=orientation==='top'?-.5:-.5-actual.stock.h[0];
    for(const clamp of geo.boxes.filter(b=>b.kind==='clamp')){near(clamp.z0,nose);near(clamp.z1,nose+.56);}
    for(const block of geo.boxes.filter(b=>b.kind==='block')){near(block.z1,nose+.06);near(block.z0,lower-.5);}
    for(const stud of geo.cyls.filter(b=>b.kind==='stud')){near(stud.z1,nose+1.21);near(stud.z0,lower-.5);}
    for(const support of geo.boxes.filter(b=>b.kind==='parallel'))near(support.z1,lower);
    const result=S.check({geo,steps:[],tools:{},tipOf:()=>{},label:()=>'',initialMaterial:incoming});assert.equal(result.crash,0,JSON.stringify(result.findings));assert.ok(result.findings.some(f=>f.code==='SETUP-SEAT'));
    const hit=S.collide(geo,{x:.25,y:1,z:nose-.001},{dia:.1,len:1});assert.equal(hit.ob.kind,'clamp','Collision geometry uses the same adjusted strap nose');
  }
  const uneven=actual.snapshot();for(let j=0;j<uneven.data.ny;j++)for(let i=0;i<uneven.data.nx;i++)if(i*uneven.data.dxMm<10&&j*uneven.data.dyMm>16&&j*uneven.data.dyMm<35)uneven.data.topMm[j*uneven.data.nx+i]-=2;
  const fixture=S.build('mill',{x:3,y:2,z:.5},{method:'clamps',params:{place:'ends',overlap:.5,heel:.06,bolt:.3,parH:.5,parPos:'clamps'}});M.seatFixture(fixture,uneven);
  assert.ok(S.check({geo:fixture,steps:[],tools:{},tipOf:()=>{},label:()=>'',initialMaterial:uneven}).findings.some(f=>f.code==='SETUP-CLAMP'&&f.level==='crash'),'Finding a highest surface must not accept insufficient uneven contact');
});
test('actual collet machining cannot claim gripping contact behind a later three-jaw chuck',()=>{
  const S=setups(),actual=nativeStock('lathe');actual.stock.cut({z:100/25.4,r:15/25.4},{z:8/25.4,r:15/25.4},'turn',0,1);const incoming=actual.snapshot();
  const check=method=>S.check({geo:S.build('lathe',{dia:40/25.4,stickout:100/25.4,extra:0},{method,params:{}}),steps:[],tools:{},tipOf:()=>{},label:()=>'',initialMaterial:incoming});
  assert.equal(check('collet').crash,0,'The original collet interval still retains its full stock diameter');
  const jaws=check('chuck3'),finding=jaws.findings.find(f=>f.code==='SETUP-GRIP');assert.ok(finding&&finding.level==='crash',JSON.stringify(jaws.findings));assert.ok(parseInt(finding.what,10)<60,'Only the actual [-0.05, jawLen] jaw band can contribute contact');
});
test('a fixed steady rest rejects the radial gap at an actually turned diameter',()=>{
  const S=setups(),actual=nativeStock('lathe');actual.stock.cut({z:100/25.4,r:15/25.4},{z:60/25.4,r:15/25.4},'turn',0,1);const incoming=actual.snapshot();
  const check=position=>S.check({geo:S.build('lathe',{dia:40/25.4,stickout:100/25.4,extra:0},{method:'steady',params:{zs:position/25.4}}),steps:[],tools:{},tipOf:()=>{},label:()=>'',initialMaterial:incoming});
  const unsafe=check(70).findings.find(f=>f.code==='SETUP-REST');assert.ok(unsafe&&unsafe.level==='crash');assert.match(unsafe.what,/radial gap/);assert.match(unsafe.fix,/intact original diameter/);
  assert.equal(check(40).crash,0,'Moving the rest to the remaining original diameter restores actual finger contact');
});
test('composed setup comparison retains both independent surface goals and detects earlier overcut',()=>{
  let p=D.create('plate');p.stock={width:76.2,height:50.8,depth:12.7,diameter:80,length:80};p.geometry.params={l:76.2,w:50.8};p.placement={x:0,y:0};
  const first=W.getSetups(p).items[0];first.comparison={mode:'retained-solid',depthMm:.5,faceAllowanceMm:.5,toleranceMm:4};
  const second={...structuredClone(first),id:'setup-2',orientation:'bottom',comparison:{mode:'retained-solid',depthMm:.75,faceAllowanceMm:.75,toleranceMm:4}};
  p=W.setSetups(p,{version:1,items:[first,second]});const s=blank();s.data.topMm.fill(-.5);s.data.bottomMm.fill(-11.95);
  const correct=C.compareSetups(p,'setup-2',s);near(correct.metrics.missingVolumeMm3,0);near(correct.metrics.excessVolumeMm3,0);near(correct.metrics.desiredVolumeMm3,76.2*50.8*11.45,.001);assert.equal(correct.status,'within-sample-tolerance');
  const precise=W.getSetups(p);precise.items[0].comparison.toleranceMm=.1;p=W.setSetups(p,precise);s.data.topMm[10*31+15]=-1;
  const wrong=C.compareSetups(p,'setup-2',s);assert.equal(wrong.status,'needs-work','A looser second-setup tolerance cannot hide a first-face overcut');assert.ok(wrong.metrics.missingVolumeMm3>0);assert.match(wrong.observations[0],/Each side keeps its own tolerance/);
});
