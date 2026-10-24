/* Run with a repository-root server. No external services or machining hardware. */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const D=require('../../numeracy-hub/design/design-model.js');
const base=process.env.DESIGN_BASE_URL||'http://127.0.0.1:8766';
const ready=p=>p.waitForFunction(()=>window.AccessDesignCAM&&window.CNCBuilder&&CNCBuilder.getState());
const snapshot=p=>p.evaluate(()=>JSON.parse(JSON.stringify(CNCBuilder.getState())));
const incoming=async(p,project)=>{await p.evaluate(hash=>location.hash=hash,'#design='+D.encode(project));await p.waitForFunction(title=>document.getElementById('cnc-design-title').textContent===title,project.title);await p.locator('#cnc-operation').evaluate(el=>el.open=true);};
(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true}),external=[],errors=[];
    await context.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>{external.push(route.request().url());return route.abort();});
    const page=await context.newPage();page.setDefaultTimeout(40000);page.setDefaultNavigationTimeout(60000);page.on('pageerror',e=>errors.push(e.message));
    console.log('CAM browser: generate, check, simulate, capture and return');
    await page.goto(base+'/numeracy-hub/cnc/index.html?mode=builder&machine=mill');await ready(page);await page.click('#mb-spindle');
    const old=await snapshot(page),plate=D.create('plate');plate.title='CAM learning plate';plate.reflection='My own explanation remains.';
    await incoming(page,plate);const originalProgram=await page.evaluate(()=>Trainer.S.text);
    await page.click('#cnc-op-generate');assert.match(await page.locator('#cnc-op-status').textContent(),/Program checked/);
    assert.deepEqual(await snapshot(page),old);assert.equal(await page.evaluate(()=>Trainer.S.text),originalProgram,'Preflight leaves visible simulator unchanged');
    assert.match(await page.locator('#cnc-op-maths').textContent(),/Surface speed/);
    const download=page.waitForEvent('download');await page.click('#cnc-op-download');assert.match(fs.readFileSync(await(await download).path(),'utf8'),/O09201/);
    await page.click('#cnc-op-capture');let captured=await page.evaluate(()=>AccessDesign.decode(document.getElementById('cnc-design-return').hash.slice(9)));
    assert.equal(captured.workflow.results[0].kind,'check');assert.match(captured.workflow.results[0].summary,/not played/);
    await page.click('#cnc-op-simulate');assert.match(await page.locator('#cnc-op-status').textContent(),/preview completed/);assert.deepEqual(await snapshot(page),old);
    assert.equal(await page.evaluate(()=>CNCBuilder.isGeneratedPreview()),true);assert.match(await page.evaluate(()=>Trainer.S.text),/O09201/);
    await page.click('#cnc-op-capture');captured=await page.evaluate(()=>AccessDesign.decode(document.getElementById('cnc-design-return').hash.slice(9)));
    assert.equal(captured.workflow.results.length,2);assert.equal(captured.workflow.results[1].kind,'simulation');assert.ok(captured.workflow.results[1].removedVolumeMm3>0);assert.equal(captured.reflection,plate.reflection);
    await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Generated operation mobile overflow');
    if(process.env.DESIGN_SCREENSHOT_DIR){fs.mkdirSync(process.env.DESIGN_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.DESIGN_SCREENSHOT_DIR,'cnc-operation-mobile.png'),fullPage:true});}
    await page.setViewportSize({width:1440,height:1000});
    if(process.env.DESIGN_SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.DESIGN_SCREENSHOT_DIR,'cnc-operation-desktop.png'),fullPage:true});
    await page.click('#workshop-simulator');assert.match(await page.evaluate(()=>Trainer.S.text),/O09201/,'Simulator navigation retains generated program');assert.equal(await page.evaluate(()=>Trainer.S.running),false,'Navigation does not auto-run');
    await page.click('#btn-start');await page.waitForFunction(()=>Trainer.S.running||Trainer.S.finished);assert.match(await page.evaluate(()=>Trainer.S.text),/O09201/);await page.click('#btn-reset');assert.equal(await page.evaluate(()=>Trainer.S.running),false);assert.match(await page.evaluate(()=>Trainer.S.text),/O09201/);
    await page.click('#workshop-builder');assert.equal(await page.evaluate(()=>CNCBuilder.isGeneratedPreview()),false);assert.deepEqual(await snapshot(page),old,'Returning to builder recovers the saved manual draft');
    await page.click('#cnc-op-simulate');await page.click('#cnc-op-restore');assert.equal(await page.evaluate(()=>CNCBuilder.isGeneratedPreview()),false);assert.deepEqual(await snapshot(page),old);
    await page.reload();await ready(page);await page.locator('#cnc-design-target').evaluate(el=>el.open=true);
    assert.equal(await page.evaluate(()=>AccessDesign.decode(document.getElementById('cnc-design-return').hash.slice(9)).workflow.results.length),2,'Captured results survive reload without applying manual setup');
    await page.click('#cnc-design-return');await page.waitForFunction(()=>window.DesignWorkshop);assert.equal(await page.evaluate(()=>DesignWorkshop.getProject().workflow.results.length),2);await page.click('[data-step="4"]');assert.match(await page.locator('#machine-results').textContent(),/Completed simulator preview/);

    console.log('CAM browser: rejected fixtures and accepted mill/lathe operation matrix');
    await page.goto(base+'/numeracy-hub/cnc/index.html?mode=builder&machine=mill');await ready(page);
    const cases=await page.evaluate(()=>{
      const result=[];for(const template of ['plate','washer','shaft'])for(const units of ['mm','in']){
        const p=AccessDesign.create(template);p.units=units;const plan=AccessDesignCAM.defaults(p),g=AccessDesignCAM.generate(p,plan),v=Trainer.validateManual(g.training);result.push({template,units,accepted:v.accepted,diagnostics:v.diagnostics,removal:v.removedVolumeIn3});
      }
      const p=AccessDesign.create('washer');for(const kind of ['profile-out','profile-in','drill']){const plan={...AccessDesignCAM.defaults(p),kind};if(kind==='drill')plan.toolDiameterMm=20;const g=AccessDesignCAM.generate(p,plan),v=Trainer.validateManual(g.training);result.push({template:'washer',kind,accepted:v.accepted,diagnostics:v.diagnostics,removal:v.removedVolumeIn3});}
      return result;
    });for(const c of cases){assert.equal(c.accepted,true,JSON.stringify(c));assert.ok(c.removal>0,JSON.stringify(c));}
    const rejected=D.create('shaft');rejected.title='Chuck clearance lesson';rejected.stock.length=90;
    await incoming(page,rejected);const before=await snapshot(page),text=await page.evaluate(()=>Trainer.S.text);
    await page.click('#cnc-op-generate');assert.match(await page.locator('#cnc-op-status').textContent(),/did not pass/);assert.equal(await page.locator('#cnc-op-simulate').isDisabled(),true);assert.match(await page.locator('#cnc-op-diagnostics').textContent(),/chuck jaws/);assert.deepEqual(await snapshot(page),before);assert.equal(await page.evaluate(()=>Trainer.S.text),text);
    await page.click('#cnc-op-capture');captured=await page.evaluate(()=>AccessDesign.decode(document.getElementById('cnc-design-return').hash.slice(9)));assert.equal(captured.workflow.results[0].accepted,false);
    const shaft=D.create('shaft');shaft.title='Accepted shaft';await incoming(page,shaft);await page.click('#cnc-op-generate');await page.click('#cnc-op-simulate');assert.match(await page.locator('#cnc-op-status').textContent(),/preview completed/);assert.deepEqual(await snapshot(page),before);await page.click('#cnc-op-capture');
    await page.fill('#cnc-op-feed','90');await page.locator('#cnc-op-feed').blur();assert.equal(await page.locator('#cnc-op-capture').isDisabled(),true);captured=await page.evaluate(()=>AccessDesign.decode(document.getElementById('cnc-design-return').hash.slice(9)));assert.equal(await page.evaluate(p=>AccessDesignWorkflow.resultStatus(p,p.workflow.results[0]).stale,captured),true);
    await page.click('#cnc-op-restore');await incoming(page,plate);await page.click('#cnc-design-apply');await page.reload();await ready(page);await page.locator('#cnc-design-target').evaluate(el=>el.open=true);await page.click('#cnc-design-recover');assert.deepEqual(await snapshot(page),before,'Saved draft recovery survives reload');

    console.log('CAM browser: measured SVG/DXF, transform, unsupported and compound import checks');
    const imports=await page.evaluate(()=>{
      const D=AccessDesign,C=AccessDesignCAM,p=D.create('washer'),out={};
      for(const f of ['svg','dxf']){const q=C.importDrawing(f==='svg'?D.toSVG(p):D.toDXF(p),f,{document});out[f]={rings:q.geometry.rings.length,bounds:D.bounds(q)};}
      const profile=D.fromProfile({rings:[[[0,0],[40,0],[40,30],[0,30]],[[10,10],[20,10],[20,20],[10,20]]],units:'mm'});out.compound=C.importDrawing(D.toSVG(profile),'svg',{document}).geometry.rings.length;
      const plain='<svg xmlns="http://www.w3.org/2000/svg" width="100mm" height="100mm" viewBox="0 0 100 100"><g transform="translate(10,20) scale(2)"><rect width="10" height="15"/></g></svg>';out.transform=D.bounds(C.importDrawing(plain,'svg',{document}));
      out.rejected=[];for(const svg of ['<svg xmlns="http://www.w3.org/2000/svg"><script>window.importRan=true</script></svg>',plain.replace('<g ','<g clip-path="url(#clip)" '),plain.replace('100mm','50%'),'<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0 L10 20"/></svg>']){try{C.importDrawing(svg,'svg',{units:'mm',document});out.rejected.push(false);}catch(_){out.rejected.push(true);}}
      out.scriptRan=!!window.importRan;return out;
    });assert.equal(imports.svg.rings,2);assert.equal(imports.dxf.rings,2);assert.ok(Math.abs(imports.svg.bounds.width-50)<1e-8);assert.ok(Math.abs(imports.svg.bounds.height-50)<1e-8);assert.equal(imports.compound,2);assert.ok(Math.abs(imports.transform.width-20)<.02);assert.ok(Math.abs(imports.transform.height-30)<.02);assert.ok(imports.rejected.every(Boolean));assert.equal(imports.scriptRan,false);
    assert.deepEqual(errors,[]);assert.deepEqual(external,[]);await context.close();

    console.log('CAM browser: offline generation');
    const offline=await browser.newContext();await offline.setOffline(true);const file=await offline.newPage();await file.goto(pathToFileURL(path.resolve(__dirname,'../../numeracy-hub/cnc/index.html')).href+'?mode=builder');await ready(file);
    const accepted=await file.evaluate(()=>{const p=AccessDesign.create('plate'),g=AccessDesignCAM.generate(p,AccessDesignCAM.defaults(p));return Trainer.validateManual(g.training).accepted;});assert.equal(accepted,true);await offline.close();
    console.log('CNC CAM browser integration: PASS');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
