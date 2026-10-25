'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const D=require('../../numeracy-hub/design/design-model.js'),W=require('../../numeracy-hub/design/design-workflow.js'),C=require('../../numeracy-hub/cnc/design-comparison.js');
const near=(a,b,eps=1e-6)=>assert.ok(Math.abs(a-b)<=eps,`${a} != ${b}`);
function plate(width=2,height=2,depth=2){const p=D.create('plate');p.geometry.params={l:width,w:height};p.stock={width,height,depth,diameter:width,length:width};p.placement={x:0,y:0};return p;}
function grid(p,n=5){return{format:'access-simulated-material',version:1,source:'scene-stock',units:'mm',machine:'mill',complete:true,alarm:null,program:'test',stock:{widthMm:p.stock.width,heightMm:p.stock.height,depthMm:p.stock.depth},data:{kind:'heightfield',nx:n,ny:n,dxMm:p.stock.width/(n-1),dyMm:p.stock.height/(n-1),topMm:Array(n*n).fill(0),bottomMm:Array(n*n).fill(-p.stock.depth)}};}
function shaft(){const p=D.create('shaft');p.geometry.params={r:5,h:10};p.stock.diameter=14;p.stock.length=30;return p;}
function radial(p){return{format:'access-simulated-material',version:1,source:'scene-stock',units:'mm',machine:'lathe',complete:true,alarm:null,stock:{diameterMm:p.stock.diameter,lengthMm:p.stock.length},data:{kind:'radial-profile',z0Mm:-2,dzMm:.25,frontZMm:30,radiiMm:Array(129).fill(7),detachedParts:0}};}
test('completed unchanged stock can match a full-stock target but cannot certify a finer tolerance',()=>{
  const p=plate(),s=grid(p),r=C.compare(p,s,{mode:'retained-solid',depthMm:2,toleranceMm:1});
  assert.equal(r.status,'within-sample-tolerance');near(r.metrics.desiredVolumeMm3,8);near(r.metrics.actualVolumeMm3,8);near(r.metrics.missingVolumeMm3,0);near(r.metrics.excessVolumeMm3,0);
  assert.equal(C.compare(p,s,{mode:'retained-solid',depthMm:2,toleranceMm:.1}).status,'resolution-limited');
  assert.match(C.renderSVG(r,'in'),/role="img"/);assert.match(C.renderSVG(r,'in'),/0.079 in/);
});
test('a pocket compares local surfaces, so equal volume in the wrong location cannot pass',()=>{
  const p=plate(4,4,2);p.geometry.params={l:2,w:4};const s=grid(p,5);
  for(let j=0;j<5;j++)for(let i=0;i<5;i++)if(i>=2)s.data.topMm[j*5+i]=-1;
  const r=C.compare(p,s,{mode:'pocket',depthMm:1,toleranceMm:.1});
  assert.equal(r.status,'needs-work');assert.ok(r.metrics.missingVolumeMm3>0);assert.ok(r.metrics.excessVolumeMm3>0);assert.ok(r.metrics.mismatchedPercent>0);
  assert.ok(r.overlay.cells.includes('1'));assert.ok(r.overlay.cells.includes('2'));
  const cornerTarget=plate(4,4,2),cornerStock=grid(cornerTarget,51);cornerStock.data.topMm.fill(-1);cornerStock.data.topMm[0]=0;
  const corner=C.compare(cornerTarget,cornerStock,{mode:'pocket',depthMm:1,toleranceMm:.1});
  assert.match(corner.observations.join(' '),/round cutter may leave material in sharp inside corners/);
});
test('surrounding waste remains an explicit excess rather than a finished-part match',()=>{
  const p=plate(4,4,2);p.geometry.params={l:2,w:2};p.placement={x:1,y:1};const s=grid(p,9);
  const r=C.compare(p,s,{mode:'retained-solid',depthMm:2,toleranceMm:.1});
  assert.equal(r.status,'needs-work');near(r.metrics.missingVolumeMm3,0);assert.ok(r.metrics.excessVolumeMm3>0);assert.match(r.limitations.join(' '),/surrounding waste/);
});
test('boundary-only height aliases are unresolved while a resolved interior overcut still needs work',()=>{
  const p=plate(4,4,2);p.geometry.params={l:2,w:2};p.placement={x:1,y:1};const s=grid(p,5);
  for(let j=0;j<5;j++)for(let i=0;i<5;i++)s.data.topMm[j*5+i]=(i===2&&j===2)?0:-1;
  const options={mode:'retained-solid',depthMm:1,toleranceMm:.1},boundary=C.compare(p,s,options);
  assert.equal(boundary.status,'resolution-limited');assert.ok(boundary.metrics.missingVolumeMm3>0);assert.ok(boundary.overlay.cells.includes('1'));assert.match(boundary.observations.join(' '),/small XY boundary shift/);
  s.data.topMm[12]=-.8;const interior=C.compare(p,s,options);
  assert.equal(interior.status,'needs-work');assert.ok(interior.metrics.missingVolumeMm3>boundary.metrics.missingVolumeMm3);
});
test('pocket holes stay as islands and lower surfaces participate in missing-material assessment',()=>{
  const p=D.fromProfile({rings:[[[0,0],[4,0],[4,4],[0,4]],[[1,1],[3,1],[3,3],[1,3]]],units:'mm'});
  p.stock={width:4,height:4,depth:2,diameter:4,length:4};p.placement={x:0,y:0};const s=grid(p,9);
  for(let j=0;j<9;j++)for(let i=0;i<9;i++){const x=i*.5,y=j*.5;s.data.topMm[j*9+i]=(x>1&&x<3&&y>1&&y<3)?0:-1;}
  let r=C.compare(p,s,{mode:'pocket',depthMm:1,toleranceMm:1});assert.equal(r.metrics.missingVolumeMm3,0);assert.equal(r.metrics.excessVolumeMm3,0);
  s.data.bottomMm[40]=-1;r=C.compare(p,s,{mode:'pocket',depthMm:1,toleranceMm:.1});assert.ok(r.metrics.missingVolumeMm3>0);
});
test('lathe comparison measures target diameters and excludes untouched chuck allowance',()=>{
  const p=shaft(),s=radial(p);
  for(let k=0;k<s.data.radiiMm.length;k++)if(-2+k*.25>=20)s.data.radiiMm[k]=5;
  const r=C.compare(p,s,{mode:'retained-solid',depthMm:null,toleranceMm:.3});
  assert.equal(r.status,'within-sample-tolerance');near(r.metrics.desiredVolumeMm3,Math.PI*25*10);near(r.metrics.actualVolumeMm3,Math.PI*25*10);assert.ok(r.overlay.samples.every(q=>q.diameterMm===10));
  s.data.radiiMm[100]=4.5;const gouged=C.compare(p,s,{mode:'retained-solid',depthMm:null,toleranceMm:.3});
  assert.equal(gouged.status,'needs-work');near(gouged.metrics.maxUndercutMm,1);assert.ok(gouged.overlay.samples.some(q=>q.diameterMm===9));
  assert.ok(gouged.overlay.samples.length<=192);assert.match(C.renderSVG(gouged),/diameter/);
});
test('a shoulder between radius samples never mixes excluded chuck stock into the target',()=>{
  const p=shaft(),s=radial(p);s.data.z0Mm=-2.02;s.data.radiiMm=Array(130).fill(7);
  for(let k=0;k<s.data.radiiMm.length;k++)if(s.data.z0Mm+k*s.data.dzMm>=20)s.data.radiiMm[k]=5;
  const r=C.compare(p,s,{mode:'retained-solid',depthMm:null,toleranceMm:.3});
  assert.equal(r.status,'within-sample-tolerance');assert.equal(r.metrics.maxExcessMm,0);assert.match(r.limitations.join(' '),/Endpoint/);
});
test('incomplete, mismatched, parted-off and malformed snapshots never produce a match',()=>{
  const p=plate(),s=grid(p);s.complete=false;assert.equal(C.compare(p,s).status,'incomplete');s.complete=true;s.stock.widthMm=3;assert.equal(C.compare(p,s).status,'unsupported');
  const bad=grid(p);bad.data.topMm[0]=NaN;assert.throws(()=>C.compare(p,bad));bad.data.topMm[0]=0;bad.data.nx=100001;assert.throws(()=>C.compare(p,bad));
  const turned=shaft(),parts=radial(turned);parts.data.detachedParts=1;assert.equal(C.compare(turned,parts).status,'unsupported');
  assert.throws(()=>C.compare(p,grid(p),{mode:'pocket',depthMm:3,toleranceMm:.1}));
  const tiny=plate();tiny.geometry.params={l:.01,w:.01};tiny.placement={x:.2,y:.2};
  assert.equal(C.compare(tiny,grid(tiny),{mode:'pocket',depthMm:1,toleranceMm:1}).status,'resolution-limited');
  assert.equal(C.compare(tiny,grid(tiny),{mode:'retained-solid',depthMm:1,toleranceMm:.1}).status,'needs-work','Unresolved tiny target cannot hide resolved surrounding waste');
});
test('snapshot copies the actual native simulator material and comparison survives bounded evidence serialization',()=>{
  const html=fs.readFileSync(path.resolve(__dirname,'../../numeracy-hub/cnc/index.html'),'utf8');
  const mill=html.slice(html.indexOf('  class MillStock {'),html.indexOf('  /* ---------------- lathe stock'));
  const capture=html.slice(html.indexOf('  function materialSnapshot(meta)'),html.indexOf('  /* Exact-resolution, detached stock check'));
  const context=vm.createContext({THREE:{Group:class{constructor(){this.children=[];}}}});
  vm.runInContext(mill+'\nlet M;\n'+capture+'\nglobalThis.make=()=>{const stock=new MillStock(1,1,.25,false);M={type:"mill",stock};return stock;};globalThis.capture=materialSnapshot;',context);
  const actual=context.make();actual.cut({x:0,y:.5,z:-.1},{x:1,y:.5,z:-.1},1,1);
  const s=context.capture({complete:true,program:'actual-playback'});
  assert.equal(s.data.nx,301);assert.equal(s.data.topMm.length,301*301);near(s.data.topMm[0],-2.54,1e-6);
  const p=plate(25.4,25.4,6.35),r=C.compare(p,s,{mode:'pocket',depthMm:2.54,toleranceMm:.2});
  assert.equal(r.status,'within-sample-tolerance');assert.equal(r.metrics.sampleCount,301*301);assert.equal(r.overlay.cells.length,48*48);
  s.data.topMm[0]=0;near(actual.h[0],-.1,1e-7);
  const summary=C.summary(r);assert.deepEqual(W.validateComparisonResult(JSON.parse(JSON.stringify(summary))),summary);
  assert.ok(JSON.stringify(summary).length<10000);assert.equal('topMm' in summary,false);
});
test('mill facing shifts the kept surface while the pocket floor remains relative to the original top',()=>{
  const p=plate(4,4,3);p.geometry.params={l:2,w:2};p.placement={x:1,y:1};const s=grid(p,9);
  for(let j=0;j<9;j++)for(let i=0;i<9;i++)s.data.topMm[j*9+i]=(i>=2&&i<=6&&j>=2&&j<=6)?-1.5:-.5;
  const options={mode:'pocket',depthMm:1.5,toleranceMm:.1,faceAllowanceMm:.5},correct=C.compare(p,s,options);
  near(correct.metrics.missingVolumeMm3,0);near(correct.metrics.excessVolumeMm3,0);assert.equal(correct.status,'resolution-limited');
  const wrong=C.compare(p,s,{...options,faceAllowanceMm:0});assert.equal(wrong.status,'needs-work');assert.ok(wrong.metrics.missingVolumeMm3>0);
  assert.throws(()=>C.compare(p,s,{...options,depthMm:.4}),/floor|Facing|faced/i);
});
function actualLathe(){
  const html=fs.readFileSync(path.resolve(__dirname,'../../numeracy-hub/cnc/index.html'),'utf8');
  const lathe=html.slice(html.indexOf('  class LatheStock {'),html.indexOf('  /* ---------------- workholding'));
  const capture=html.slice(html.indexOf('  function materialSnapshot(meta)'),html.indexOf('  /* Exact-resolution, detached stock check'));
  const transaction=html.slice(html.indexOf('  function captureManualScene()'),html.indexOf('  /* Detached measurements of the stock actually changed by playback'));
  class Group{constructor(){this.children=[];}add(o){this.children.push(o);o.parent=this;}remove(o){this.children=this.children.filter(v=>v!==o);}}
  class Geometry{constructor(profile){this.attributes={position:{count:1,getY:()=>profile[1].y}};}setAttribute(k,v){this.attributes[k]=v;}}
  const context=vm.createContext({STOCK_BASE:{r:1,g:1,b:1},THREE:{Group,Vector2:class{constructor(x,y){this.x=x;this.y=y;}},LatheGeometry:Geometry,BufferAttribute:class{},MeshStandardMaterial:class{},Mesh:class{constructor(){this.rotation={};}}}});
  vm.runInContext(lathe+'\nlet M,root={},follow=false;const scene={remove(){},add(){}},controls={target:{clone(){return this;},copy(){}},apply(){}};\n'+transaction+capture+'\nglobalThis.make=()=>{const stock=new LatheStock(14/25.4,-.7,30/25.4,false);M={type:"lathe",stock,setup:{stock:{stickout:30/25.4}}};return stock;};globalThis.capture=materialSnapshot;globalThis.save=captureManualScene;globalThis.restore=restoreManualScene;',context);
  return{stock:context.make(),capture:()=>context.capture({complete:true,program:'native-turn-face-part'}),save:()=>context.save(),restore:s=>context.restore(s)};
}
function turnFacePart(length=10,allowance=1){
  const fixture=actualLathe(),s=fixture.stock,front=30-allowance,back=front-length;
  s.cut({z:back/25.4,r:5/25.4},{z:30/25.4,r:5/25.4},'turn',0,1);
  if(allowance)s.cut({z:front/25.4,r:7/25.4},{z:front/25.4,r:0},'turn',0,2);
  s.cut({z:back/25.4,r:7/25.4},{z:back/25.4,r:0},'part',1/25.4,3);
  const part=s.checkParted(back/25.4);assert.ok(part&&part.group.children.length);s.parts.push(part.group);
  return fixture;
}
test('actual lathe cuts preserve detached profiles and measure facing and part length without realigning the target',()=>{
  const p=shaft(),fixture=turnFacePart(),s=fixture.capture(),options={mode:'retained-solid',depthMm:null,toleranceMm:.3,faceAllowanceMm:1};
  assert.equal(s.data.detachedParts,1);assert.equal(s.data.detachedProfiles.length,1);
  assert.ok(s.data.detachedProfiles[0].radiiMm.some(r=>Math.abs(r-5)<1e-6));
  const r=C.compare(p,s,options);assert.equal(r.status,'within-sample-tolerance',JSON.stringify(r));assert.equal(r.dimensions.source,'detached');
  near(r.dimensions.expectedFrontMm,29);assert.ok(Math.abs(r.dimensions.actualFrontMm-29)<=.127);assert.ok(Math.abs(r.dimensions.actualLengthMm-10)<=.254);
  assert.ok(r.overlay.samples.every(v=>Math.abs(v.diameterMm-10)<1e-6));
  const liveRadius=fixture.stock.detachedProfiles[0].r[2];s.data.detachedProfiles[0].radiiMm[2]=999;near(fixture.stock.detachedProfiles[0].r[2],liveRadius);
  const wrongFace=C.compare(p,fixture.capture(),{...options,faceAllowanceMm:0});assert.equal(wrongFace.status,'needs-work');assert.ok(wrongFace.metrics.missingVolumeMm3>0);assert.ok(wrongFace.dimensions.frontErrorMm<-.8);
  const fine=C.compare(p,fixture.capture(),{...options,toleranceMm:.05});assert.equal(fine.status,'resolution-limited');
  assert.deepEqual(W.validateComparisonResult(JSON.parse(JSON.stringify(r))),r);
  const saved=fixture.save();fixture.stock.refresh=()=>{};fixture.stock.reset();assert.equal(fixture.stock.detachedProfiles.length,0);
  fixture.restore(saved);assert.equal(fixture.capture().data.detachedProfiles.length,1);assert.deepEqual(C.compare(p,fixture.capture(),options),r,'Preview rollback restores loose-piece samples and mounted material together');
});
test('actual short and long loose parts fail their fixed length goal and multiple pieces stay ambiguous',()=>{
  const p=shaft(),options={mode:'retained-solid',depthMm:null,toleranceMm:.3,faceAllowanceMm:1};
  assert.throws(()=>C.compare(p,radial(p),{...options,faceAllowanceMm:21}),/target length must fit/);
  const short=C.compare(p,turnFacePart(8).capture(),options),long=C.compare(p,turnFacePart(12).capture(),options);
  assert.equal(short.status,'needs-work');assert.ok(short.dimensions.lengthErrorMm<-1.7);assert.ok(short.metrics.missingVolumeMm3>100);
  assert.equal(long.status,'needs-work');assert.ok(long.dimensions.lengthErrorMm>1.7);assert.ok(long.metrics.excessVolumeMm3>100);
  const ambiguous=turnFacePart().capture();ambiguous.data.detachedParts=2;ambiguous.data.detachedProfiles.push(structuredClone(ambiguous.data.detachedProfiles[0]));
  assert.equal(C.compare(p,ambiguous,options).status,'unsupported');
  ambiguous.data.detachedParts=1;assert.throws(()=>C.compare(p,ambiguous,options),/piece count/);
});
