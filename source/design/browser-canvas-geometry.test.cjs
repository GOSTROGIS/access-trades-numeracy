/* NODE_PATH=<Playwright installation> DESIGN_BASE_URL=http://127.0.0.1:8766 node source/design/browser-canvas-geometry.test.cjs */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.DESIGN_BASE_URL || 'http://127.0.0.1:8766';
(async()=>{
  const browser=await chromium.launch({headless:true});
  try {
    const context=await browser.newContext();
    await context.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/shape-canvas/index.html');
    await page.waitForFunction(()=>window.SC?.DesignBridge);
    const result=await page.evaluate(()=>{
      SC.M.reset();SC.M.doc.unit='mm';
      const rect=SC.M.addShape('rectangle',0,0,{l:80,w:50});
      const circle=SC.M.addShape('circle',0,0,{r:10});
      const comp=SC.Co.make([rect,circle]);SC.S.sel=[comp.id];SC.M.resetHistory();SC.A.afterLoad();
      const p=SC.DesignBridge.selectedProject();
      return {p,bounds:AccessDesign.bounds(p),maths:AccessDesign.measurements(p),depths:AccessDesign.outline(p).depths};
    });
    assert.equal(result.p.geometry.shapeId,'profile');assert.deepEqual(result.bounds,{width:80,height:50});
    assert.deepEqual(result.depths.sort(),[0,1]);assert.ok(Math.abs(result.maths.items[0].value-(4000-Math.PI*100))<.25);
    await page.click('#btn-design-project');await page.click('#design-project-primary');
    await page.waitForFunction(()=>window.DesignWorkshop);
    await page.waitForFunction(()=>DesignWorkshop.getProject().geometry.shapeId==='profile');
    assert.equal(await page.locator('#drawing-preview svg').count(),1);
    await page.goto(base+'/shape-canvas/index.html');await page.waitForFunction(()=>window.SC?.DesignBridge);
    const importResult=await page.evaluate(p=>{
      // A new page keeps the source composite intact while adding a measured vector view.
      const originalPages=SC.M.doc.pages.length,id=SC.DesignBridge.importProject(p,{mode:'new'}),o=SC.M.obj(id);
      const before=SC.M.doc.pages.length;
      // A separate document is used for unambiguous idempotent updates.
      SC.M.doc.pages=SC.M.doc.pages.filter(pg=>pg.objs.some(obj=>obj.id===id));SC.M.doc.page=0;SC.M.resetHistory();SC.A.afterLoad();
      const repeat=SC.DesignBridge.importProject(p),repeatPages=SC.M.doc.pages.length;
      const changed=JSON.parse(JSON.stringify(p));changed.geometry.rings=changed.geometry.rings.map(r=>r.map(q=>[q[0]*1.1,q[1]*1.1]));
      const updated=SC.DesignBridge.importProject(changed),width=AccessDesign.bounds(SC.DesignBridge.selectedProject()).width;
      const undo=SC.M.undo(),undoWidth=AccessDesign.bounds(SC.M.obj(id).designProject).width;
      return {id,repeat,updated,type:o.type,originalPages,before,repeatPages,width,undo,undoWidth};
    },result.p);
    assert.equal(importResult.type,'svg');assert.equal(importResult.before,importResult.originalPages+1);assert.equal(importResult.id,importResult.repeat);assert.equal(importResult.id,importResult.updated);assert.equal(importResult.repeatPages,1);assert.ok(Math.abs(importResult.width-88)<1e-8);assert.equal(importResult.undo,true);assert.equal(importResult.undoWidth,80);
    const updates=await page.evaluate(()=>{
      SC.M.reset();SC.M.doc.unit='cm';SC.M.resetHistory();
      const p=AccessDesign.create('sector');p.geometry.params={r:40,t:60};const id=SC.DesignBridge.importProject(p),count=SC.M.doc.pages.length;
      const same=SC.DesignBridge.importProject(p);
      const newP=AccessDesign.validate(p);newP.geometry.params.r=50;SC.DesignBridge.importProject(newP);
      const radius=SC.M.obj(id).params.r,angle=SC.M.obj(id).params.t;
      SC.M.obj(id).params.r=7;SC.I.commit();
      const conflicted=SC.DesignBridge.incomingStatus(p).kind;let rejected=false;try{SC.DesignBridge.importProject(p);}catch(e){rejected=true;}
      return {id,same,count,pages:SC.M.doc.pages.length,radius,angle,conflicted,rejected,remaining:SC.M.obj(id).params.r};
    });
    assert.equal(updates.id,updates.same);assert.equal(updates.count,updates.pages);assert.equal(updates.radius,5);assert.equal(updates.angle,60);assert.equal(updates.conflicted,'conflict');assert.equal(updates.rejected,true);assert.equal(updates.remaining,7);
    assert.deepEqual(errors,[]);
    console.log('PASS: real composite holes, workspace profile rendering, vector import, idempotent updates, undo, angle units, and local-edit conflict preservation');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
