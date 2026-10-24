/* NODE_PATH=<Playwright installation> DESIGN_BASE_URL=http://127.0.0.1:8766 node source/design/browser-design-comparison.test.cjs */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const base=process.env.DESIGN_BASE_URL||'http://127.0.0.1:8765';
(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const context=await browser.newContext();await context.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(60000);
    await page.goto(base+'/numeracy-hub/cnc/index.html?mode=builder&machine=mill',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.Trainer&&window.AccessDesignComparison&&window.AccessDesignCAM);
    console.log('Comparison browser: completed cumulative mill sequence');
    const mill=await page.evaluate(()=>{
      const D=AccessDesign,W=AccessDesignWorkflow,C=AccessDesignComparison,CAM=AccessDesignCAM;
      let p=D.create('plate');p.geometry.params={l:30,w:20};p.stock.width=60;p.stock.height=40;p.stock.depth=10;p.placement={x:15,y:10};
      p=W.setComparison(p,{mode:'pocket',depthMm:2,toleranceMm:.5});
      const operation={...CAM.defaults(p),kind:'pocket',toolDiameterMm:6,stepDownMm:1};
      const sequence={version:1,steps:[{id:'rough',label:'Pocket first millimetre',operation:{...operation,depthMm:1}},{id:'finish',label:'Pocket to two millimetres',operation:{...operation,depthMm:2}}]};
      const generation=CAM.generateSequence(p,sequence),preflight=Trainer.validateManual(generation.training);
      if(!preflight.accepted)return{accepted:false,diagnostics:preflight.diagnostics};
      const result=Trainer.previewManual(generation.training);
      if(!result.accepted)return{accepted:false,diagnostics:result.diagnostics};
      const material=result.materialSnapshot,comparison=C.compare(generation.project,material,C.defaults(generation.project));
      const first=material.data.topMm[0];material.data.topMm[0]=123;
      const fresh=Trainer.simulatedMaterial();
      return{accepted:result.accepted,finished:result.snapshot.finished,complete:material.complete,source:material.source,steps:generation.steps.length,minTop:Math.min(...fresh.data.topMm),nativeSamples:fresh.data.topMm.length,detached:fresh.data.topMm[0]===first,comparison,preflightHasMaterial:'materialSnapshot' in preflight};
    });
    assert.equal(mill.accepted,true,JSON.stringify(mill.diagnostics));assert.equal(mill.finished,true);assert.equal(mill.complete,true);assert.equal(mill.source,'scene-stock');assert.equal(mill.steps,2);assert.ok(Math.abs(mill.minTop+2)<.01);assert.ok(mill.nativeSamples>10000);assert.equal(mill.detached,true);assert.equal(mill.preflightHasMaterial,false);
    assert.ok(mill.comparison.metrics.actualVolumeMm3<mill.comparison.metrics.desiredVolumeMm3+250,'Cumulative stock was cut to the second operation depth');assert.ok(mill.comparison.metrics.sampleCount>10000);assert.ok(mill.comparison.overlay.cells.length<=2304);
    console.log('Comparison browser: retained-solid clearing sequence');
    const retained=await page.evaluate(()=>{
      const D=AccessDesign,W=AccessDesignWorkflow,C=AccessDesignComparison,CAM=AccessDesignCAM;
      let p=D.create('plate');p.geometry.params={l:30,w:20};p.stock.width=60;p.stock.height=40;p.stock.depth=10;p.placement={x:15,y:10};
      p=W.setComparison(p,{mode:'retained-solid',depthMm:2,toleranceMm:.5});
      const operation={...CAM.defaults(p),kind:'clear-outside',toolDiameterMm:3,stepDownMm:1};
      const sequence={version:1,steps:[{id:'clear-rough',label:'Clear around plate one millimetre',operation:{...operation,depthMm:1}},{id:'clear-finish',label:'Clear around plate two millimetres',operation:{...operation,depthMm:2}}]};
      const generation=CAM.generateSequence(p,sequence),preflight=Trainer.validateManual(generation.training);
      if(!preflight.accepted)return{accepted:false,diagnostics:preflight.diagnostics};
      const result=Trainer.previewManual(generation.training);
      if(!result.accepted)return{accepted:false,diagnostics:result.diagnostics};
      const material=result.materialSnapshot,a=material.data,comparison=C.compare(generation.project,material,C.defaults(generation.project));
      const cutTargetSamples=[];
      for(let j=0;j<a.ny;j++)for(let i=0;i<a.nx;i++){const x=i*a.dxMm,y=j*a.dyMm;if(x>=15&&x<=45&&y>=10&&y<=30&&a.topMm[j*a.nx+i]<-.5)cutTargetSamples.push(Math.min(x-15,45-x,y-10,30-y));}
      return{accepted:true,finished:result.snapshot.finished,complete:material.complete,steps:generation.steps.length,comparison,
        deepestTargetInset:Math.max(0,...cutTargetSamples),corners:[a.topMm[0],a.topMm[a.nx-1],a.topMm[(a.ny-1)*a.nx],a.topMm[a.nx*a.ny-1]],centre:a.topMm[Math.floor(a.ny/2)*a.nx+Math.floor(a.nx/2)]};
    });
    assert.equal(retained.accepted,true,JSON.stringify(retained.diagnostics));assert.equal(retained.finished,true);assert.equal(retained.complete,true);assert.equal(retained.steps,2);
    console.log('Retained-solid measured result:',JSON.stringify({status:retained.comparison.status,metrics:retained.comparison.metrics,deepestTargetInset:retained.deepestTargetInset}));
    assert.ok(retained.corners.every(z=>Math.abs(z+2)<.01),'The expanded clearing envelope reaches all four stock corners');assert.ok(Math.abs(retained.centre)<.01,'The desired centre of the plate stays intact');
    assert.ok(retained.deepestTargetInset<.02,'Any cut target samples are limited to the outline boundary');assert.ok(retained.comparison.metrics.excessVolumeMm3<180,'At least 95% of the intended surrounding stock is cleared');
    assert.equal(retained.comparison.status,'resolution-limited','Boundary aliases are retained as unresolved differences, never a finished match');
    assert.match(retained.comparison.observations.join(' '),/small XY boundary shift/);assert.ok(retained.comparison.metrics.mismatchedPercent>0&&retained.comparison.metrics.missingVolumeMm3+retained.comparison.metrics.excessVolumeMm3>0,'Raw discrepancies remain explicitly reported');
    console.log('Comparison browser: cumulative lathe 40→80 mm sequence');
    const lathe=await page.evaluate(()=>{
      const D=AccessDesign,W=AccessDesignWorkflow,C=AccessDesignComparison,CAM=AccessDesignCAM;
      let p=W.setComparison(D.create('shaft'),{mode:'retained-solid',depthMm:null,toleranceMm:.2});
      const operation=CAM.defaults(p),sequence={version:1,steps:[{id:'turn-front',label:'Turn the first 40 mm',operation:{...operation,depthMm:40}},{id:'turn-full',label:'Extend turning to 80 mm',operation:{...operation,depthMm:80}}]};
      const generation=CAM.generateSequence(p,sequence),preflight=Trainer.validateManual(generation.training);
      if(!preflight.accepted)return{accepted:false,diagnostics:preflight.diagnostics};
      const result=Trainer.previewManual(generation.training);
      if(!result.accepted)return{accepted:false,diagnostics:result.diagnostics};
      const material=result.materialSnapshot,comparison=C.compare(generation.project,material,C.defaults(generation.project));
      const ranges=Array.from(generation.training.text.matchAll(/G71[^\n]*\bP(\d+)\s+Q(\d+)/g),m=>[m[1],m[2]]);
      return{accepted:true,finished:result.snapshot.finished,complete:material.complete,steps:generation.steps.length,ranges,kind:material.data.kind,front:material.data.frontZMm,firstRadius:material.data.radiiMm[0],comparison};
    });
    assert.equal(lathe.accepted,true,JSON.stringify(lathe.diagnostics));assert.equal(lathe.finished,true);assert.equal(lathe.complete,true);assert.equal(lathe.kind,'radial-profile');assert.ok(Math.abs(lathe.front-100)<.001);assert.ok(Math.abs(lathe.firstRadius-20)<.001,'Chuck-side allowance remains original stock');
    assert.equal(lathe.steps,2);assert.equal(lathe.ranges.length,2);assert.equal(new Set(lathe.ranges.flat()).size,4,'Each lathe step has distinct P/Q profile labels');
    assert.equal(lathe.comparison.status,'within-sample-tolerance',JSON.stringify(lathe.comparison));assert.ok(lathe.comparison.overlay.samples.every(s=>Math.abs(s.diameterMm-30)<.2));assert.ok(lathe.comparison.metrics.excessVolumeMm3<1);assert.deepEqual(errors,[]);
    console.log('PASS: actual cumulative pocket, retained-solid clearing and two-step lathe playback supply complete material snapshots with distinct P/Q profiles; comparisons retain legitimate residuals and exclude chuck allowance');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
