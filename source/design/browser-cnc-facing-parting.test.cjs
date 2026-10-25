/* Student-facing face / turn / part workflow and actual shared-stock material checks. */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const D=require('../../numeracy-hub/design/design-model.js');
const base=process.env.DESIGN_BASE_URL||'http://127.0.0.1:8766';
const field=async(page,id,value)=>{await page.fill(id,String(value));await page.locator(id).blur();};
const linked=page=>page.evaluate(()=>AccessDesign.decode(document.getElementById('cnc-design-return').hash.slice(9)));
async function simulate(page){await page.click('#cnc-op-generate');assert.match(await page.locator('#cnc-op-status').textContent(),/Program checked/);await page.click('#cnc-op-simulate');assert.match(await page.locator('#cnc-op-status').textContent(),/preview completed/);await page.click('#cnc-op-compare');await page.click('#cnc-op-capture');return(await linked(page)).workflow.results.at(-1);}
(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});await context.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
    const page=await context.newPage(),errors=[];page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.message));
    const p=D.create('shaft');p.title='Face, turn and part a small shaft';p.brief='Make a 20 mm shaft after facing the end by 0.5 mm.';p.geometry.params={r:8,h:20};p.stock.diameter=20;p.stock.length=50;
    await page.goto(base+'/numeracy-hub/design/index.html#project='+D.encode(p));await page.waitForFunction(()=>window.DesignWorkshop);await page.click('[data-step="3"]');
    await field(page,'#comparison-face-allowance',.5);await field(page,'#comparison-tolerance',.3);
    await page.click('[data-step="0"]');await page.selectOption('#units','in');await page.click('[data-step="3"]');
    assert.ok(Math.abs(Number(await page.inputValue('#comparison-face-allowance'))*25.4-.5)<1e-6);
    await field(page,'#comparison-tolerance',.02);assert.equal(await page.evaluate(()=>DesignWorkshop.getProject().workflow.comparison.faceAllowanceMm),.5,'Unedited canonical allowance remains exact in inch display');
    await page.click('[data-step="0"]');await page.selectOption('#units','mm');await page.click('[data-step="3"]');await field(page,'#comparison-tolerance',.3);
    await page.click('#open-cnc');await page.waitForFunction(()=>window.CNCBuilder&&window.AccessDesignComparison);await page.locator('#cnc-operation').evaluate(e=>{e.open=true;});
    const manual=await page.evaluate(()=>CNCBuilder.getState());
    await page.selectOption('#cnc-op-kind','face');assert.equal(await page.inputValue('#cnc-op-depth'),'0.5','Changing from turning length loads a usable facing allowance');
    assert.match(await page.locator('#cnc-op-depth-label').textContent(),/original front/);await field(page,'#cnc-op-depth',.6);
    assert.equal((await linked(page)).workflow.comparison.faceAllowanceMm,.5,'Editing the cut never rewrites the independent design goal');
    await page.click('#cnc-face-goal');assert.equal((await linked(page)).workflow.comparison.faceAllowanceMm,.6,'Explicit helper sets the intended allowance');
    await field(page,'#cnc-op-depth',.5);await page.click('#cnc-face-goal');
    await page.click('#cnc-step-add');assert.equal(await page.inputValue('#cnc-op-kind'),'turn');assert.equal(await page.inputValue('#cnc-op-depth'),'20');
    await page.click('#cnc-step-add');await page.selectOption('#cnc-op-kind','part');assert.equal(await page.inputValue('#cnc-op-depth'),'20');assert.match(await page.locator('#cnc-op-tool-label').textContent(),/Blade width/);assert.match(await page.locator('#cnc-op-step-label').textContent(),/Radial/);
    await page.click('#cnc-step-up');await page.click('#cnc-op-generate');assert.match(await page.locator('#cnc-op-status').textContent(),/parting must be the final/);await page.click('#cnc-step-down');
    await field(page,'#cnc-op-depth',18);const short=await simulate(page);
    console.log('Short loose piece:',JSON.stringify({status:short.comparison?.status,dimensions:short.comparison?.dimensions}));
    assert.equal(short.comparison.status,'needs-work');assert.equal(short.comparison.dimensions.source,'detached');assert.ok(short.comparison.dimensions.lengthErrorMm < -1.5);assert.match(await page.locator('#cnc-op-diagnostics').textContent(),/shorter/);
    await field(page,'#cnc-op-depth',20);assert.equal(await page.locator('#cnc-op-capture').isDisabled(),true);const finished=await simulate(page);
    console.log('Finished loose piece:',JSON.stringify({status:finished.comparison?.status,dimensions:finished.comparison?.dimensions,observations:finished.comparison?.observations}));
    assert.equal(finished.operationCount,3);assert.equal(finished.comparison.dimensions.source,'detached');assert.ok(Math.abs(finished.comparison.dimensions.lengthErrorMm)<.3);assert.ok(Math.abs(finished.comparison.dimensions.frontErrorMm)<.15);assert.equal(finished.comparison.status,'within-sample-tolerance');
    assert.match(await page.locator('#cnc-compare-dimensions').textContent(),/Loose piece length/);assert.equal(finished.comparison.faceAllowanceMm,.5);assert.deepEqual(await page.evaluate(()=>CNCBuilder.getState()),manual,'Generated sequence preserves manual draft');
    await page.click('#cnc-op-restore');assert.deepEqual(await page.evaluate(()=>CNCBuilder.getState()),manual);
    await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'New controls fit phone width');await page.setViewportSize({width:1440,height:1000});
    await page.reload();await page.waitForFunction(()=>window.CNCBuilder&&CNCBuilder.getState());await page.locator('#cnc-design-target').evaluate(e=>{e.open=true;});assert.deepEqual((await linked(page)).workflow.results.at(-1).comparison,finished.comparison);
    await page.click('#cnc-design-return');await page.waitForFunction(()=>window.DesignWorkshop);if(await page.locator('#new-dialog[open]').count())await page.click('#new-dialog [value="start"]');await page.click('[data-step="3"]');
    assert.equal(await page.locator('#operation-sequence li').count(),3);assert.match(await page.locator('#machine-results').textContent(),/Loose piece length/);
    await field(page,'#comparison-face-allowance',.7);assert.ok(await page.evaluate(()=>{const p=DesignWorkshop.getProject();return p.workflow.results.every(r=>AccessDesignWorkflow.resultStatus(p,r).stale);}));await page.click('#undo');
    if(process.env.DESIGN_SCREENSHOT_DIR){fs.mkdirSync(process.env.DESIGN_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.DESIGN_SCREENSHOT_DIR,'facing-parting-desktop.png'),fullPage:true});}
    await page.click('[data-step="4"]');const download=page.waitForEvent('download');await page.click('#submission-download');const submission=JSON.parse(fs.readFileSync(await(await download).path(),'utf8'));assert.deepEqual(submission.project.workflow.results.at(-1).comparison,finished.comparison);
    await page.evaluate(()=>{window.print=()=>{};});await page.click('#print-sheet');assert.match(await page.locator('#print-summary').textContent(),/Loose piece length/);
    await page.setViewportSize({width:320,height:840});await page.click('[data-step="3"]');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    if(process.env.DESIGN_SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.DESIGN_SCREENSHOT_DIR,'facing-parting-mobile.png'),fullPage:true});
    await page.setViewportSize({width:1440,height:1000});
    const m=D.create('plate');m.title='Face then pocket';m.geometry.params={l:20,w:15};m.stock.width=30;m.stock.height=25;m.placement={x:5,y:5};
    await page.goto(base+'/numeracy-hub/cnc/index.html?mode=builder&machine=mill#design='+D.encode(m));await page.waitForFunction(()=>window.CNCBuilder&&window.AccessDesignComparison);await page.locator('#cnc-operation').evaluate(e=>{e.open=true;});
    await page.selectOption('#cnc-op-kind','face');await page.click('#cnc-face-goal');await field(page,'#cnc-goal-depth',2);await field(page,'#cnc-goal-tolerance',.3);
    await page.click('#cnc-step-add');await field(page,'#cnc-op-tool',3);await field(page,'#cnc-op-depth',2);await field(page,'#cnc-op-step',1);
    const milled=await simulate(page);assert.equal(milled.operationCount,2);assert.equal(milled.comparison.faceAllowanceMm,.5);
    const native=await page.evaluate(()=>{const m=Trainer.simulatedMaterial(),d=m.data;return{min:Math.min(...d.topMm),max:Math.max(...d.topMm),corners:[d.topMm[0],d.topMm[d.nx-1],d.topMm[d.nx*(d.ny-1)],d.topMm.at(-1)]};});
    assert.ok(Math.abs(native.min+2)<.01,'Pocket floor stays 2mm below original top');assert.ok(native.corners.every(z=>Math.abs(z+.5)<.01),'Facing reaches all four corners');assert.ok(Math.abs(native.max+.5)<.01,'Surrounding stock stays at faced height');
    assert.ok(milled.comparison.metrics.missingVolumeMm3<10,'Pocket is not overcut by a second facing offset');assert.deepEqual(errors,[]);
    console.log('PASS: face/turn/part and face/pocket student journeys; independent facing goal, kind defaults, invalid order, short/correct detached length, actual surface depths, manual preservation, units, reload, return, stale evidence/undo, submission, print and mobile');
    await context.close();
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
