/* Real browser coverage for the integrated project library, geometry and learning record. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const D = require('../../numeracy-hub/design/design-model.js');
const W = require('../../numeracy-hub/design/design-workflow.js');
const base = process.env.DESIGN_BASE_URL || 'http://127.0.0.1:8765';
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
    await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => route.abort());
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base + '/numeracy-hub/design/index.html');
    await page.waitForFunction(() => window.AccessDesignCAM && window.DesignWorkshop);
    await page.fill('#project-brief', 'Design a part and explain the dimensions.'); await page.locator('#project-brief').blur();
    await page.selectOption('#workflow-mode', 'advanced');
    await page.click('[data-step="1"]');
    assert.equal(await page.locator('#shape-choice option').count(), 25);
    for (const shape of D.geometryCatalog()) {
      await page.selectOption('#shape-choice', shape.id);
      assert.equal(await page.evaluate(() => DesignWorkshop.getProject().geometry.shapeId), shape.id);
      assert.equal(await page.locator('#drawing-preview svg').count(), 1, shape.id + ' preview');
      assert.doesNotMatch(await page.locator('#measurements').innerText(), /NaN|undefined/);
    }
    await page.selectOption('#shape-choice', 'sector');
    const angle = await page.inputValue('#dim-t');
    await page.click('[data-step="0"]'); await page.selectOption('#units', 'in'); await page.click('[data-step="1"]');
    assert.equal(await page.inputValue('#dim-t'), angle, 'Angles are not scaled with units');
    await page.click('[data-step="0"]'); await page.selectOption('#units', 'mm'); await page.click('[data-step="1"]');

    const washer = D.create('washer');
    await page.setInputFiles('#drawing-file', { name: 'washer.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(D.toSVG(washer)) });
    await page.waitForFunction(() => DesignWorkshop.getProject().geometry.shapeId === 'profile');
    let imported = await page.evaluate(() => DesignWorkshop.getProject());
    assert.equal(imported.geometry.rings.length, 2); assert.ok(Math.abs(D.bounds(imported).width - D.bounds(washer).width) < .02);
    await page.locator('#profile-editor summary').click();
    await page.fill('#profile-points', '0,0\n60,0\n60,40\n0,40\n\n20,10\n20,30\n40,30\n40,10');
    await page.click('#profile-apply');
    imported = await page.evaluate(() => DesignWorkshop.getProject());
    assert.equal(D.measurements(imported, 'mm').items[0].value, 2000);
    await page.click('#profile-rotate');
    assert.equal(D.bounds(await page.evaluate(() => DesignWorkshop.getProject())).width, 40);
    await page.click('#profile-mirror');
    await page.fill('#profile-scale', '2'); await page.click('#profile-resize');
    assert.equal(D.measurements(await page.evaluate(() => DesignWorkshop.getProject()), 'mm').items[0].value, 8000);
    await page.click('#undo'); await page.click('#undo'); await page.click('#undo');
    assert.deepEqual(await page.evaluate(() => DesignWorkshop.getProject()), imported);
    await page.fill('#profile-points', '0,0\n20,20\n0,20\n20,0'); await page.click('#profile-apply');
    assert.match(await page.locator('#notice').innerText(), /zero area|cross|overlap/);
    assert.deepEqual(await page.evaluate(() => DesignWorkshop.getProject()), imported);
    await page.setInputFiles('#drawing-file', { name: 'profile.dxf', mimeType: 'application/dxf', buffer: Buffer.from(D.toDXF(imported)) });
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => DesignWorkshop.getProject().geometry.rings.length), 2);
    await page.setInputFiles('#drawing-file', { name: 'open.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="100mm" height="100mm" viewBox="0 0 100 100"><path d="M0 0 L10 20"/></svg>') });
    await page.waitForFunction(() => document.getElementById('drawing-import-message').textContent.includes('not opened'));
    assert.match(await page.locator('#drawing-import-message').textContent(), /not opened/);
    assert.deepEqual(errors, []);

    await page.selectOption('#shape-choice', 'rectangle');
    await page.fill('#dim-l', '80'); await page.locator('#dim-l').blur();
    await page.fill('#dim-w', '50'); await page.locator('#dim-w').blur();
    await page.locator('#library-panel summary').click();
    await page.fill('#revision-name', 'Before inspection'); await page.click('#revision-save');
    await page.click('#revision-remove'); await page.click('#library-undo');
    assert.equal(await page.locator('#library-revision option').filter({ hasText: 'Before inspection' }).count(), 1);
    await page.fill('#dim-l', '85'); await page.locator('#dim-l').blur();
    const label = await page.locator('#library-revision option').filter({ hasText: 'Before inspection' }).getAttribute('value');
    await page.selectOption('#library-revision', label); await page.click('#library-restore');
    assert.equal(await page.inputValue('#dim-l'), '80');

    await page.click('[data-step="2"]');
    await page.fill('#estimate-value', '3900'); await page.fill('#estimate-tolerance', '200'); await page.fill('#estimate-working', '80 × 50 = 4000 mm².'); await page.click('#estimate-save');
    assert.match(await page.locator('#checkpoint-list').innerText(), /within tolerance/);
    await page.getByText('Inspect a measured dimension', { exact: true }).click();
    await page.selectOption('#inspection-dimension', 'l'); await page.fill('#inspection-measured', '80.2'); await page.fill('#inspection-tolerance', '.5'); await page.fill('#inspection-resolution', '.1'); await page.fill('#inspection-source', 'Calliper, practice part'); await page.click('#inspection-save');
    assert.match(await page.locator('#inspection-list').innerText(), /within tolerance/);
    await page.click('[data-step="1"]'); await page.fill('#dim-l', '81'); await page.locator('#dim-l').blur(); await page.click('[data-step="2"]');
    assert.match(await page.locator('#checkpoint-list').innerText(), /stale/); assert.match(await page.locator('#inspection-list').innerText(), /stale/);

    const assignment = W.createAssignment('plate'); assignment.title = 'Plate lesson'; assignment.brief = 'Explain area and measure the plate.'; assignment.requirements = [{ key: 'l', targetMm: 80, toleranceMm: .5 }];
    await page.setInputFiles('#assignment-file', { name: 'class.json', mimeType: 'application/json', buffer: Buffer.from(W.assignmentJSON(assignment)) });
    await page.waitForFunction(() => DesignWorkshop.getProject().workflow.assignment);
    assert.match(await page.locator('#assignment-checks').textContent(), /review the difference/);
    await page.click('[data-step="4"]');
    await page.fill('[data-criterion="criterion-1"]', '3'); await page.fill('[data-criterion-comment="criterion-1"]', 'Converted units and checked dimensions.'); await page.fill('[data-criterion-reviewer="criterion-1"]', 'Self review'); await page.locator('.rubric-row').first().getByText('Record review', { exact: true }).click();
    assert.match(await page.locator('#assessment-summary').innerText(), /1\/5 criteria reviewed/);
    await page.click('#undo'); assert.equal(await page.inputValue('[data-criterion="criterion-1"]'), '');
    await page.click('#redo'); assert.equal(await page.inputValue('[data-criterion="criterion-1"]'), '3');
    await page.fill('#reflection', 'The old measurement needs repeating after I changed the drawing.'); await page.locator('#reflection').blur();
    const downloaded = page.waitForEvent('download'); await page.click('#submission-download');
    const submission = JSON.parse(fs.readFileSync(await (await downloaded).path(), 'utf8'));
    assert.equal(submission.format, 'access-design-submission'); assert.equal(submission.assessment.totalAwarded, 3); assert.equal(submission.project.workflow.inspections.length, 1); assert.equal(submission.assessment.inspections[0].status, 'stale');
    await page.reload(); await page.waitForFunction(() => window.DesignWorkshop);
    assert.equal(await page.evaluate(() => DesignWorkshop.getProject().workflow.assignment.title), 'Plate lesson');
    await page.setViewportSize({ width: 320, height: 840 });
    for (let step = 0; step < 5; step++) { await page.click(`[data-step="${step}"]`); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, '320px layout step ' + step); }
    assert.deepEqual(errors, [], 'No script errors across expanded workflow');
    if (process.env.DESIGN_SCREENSHOT_DIR) { fs.mkdirSync(process.env.DESIGN_SCREENSHOT_DIR, { recursive: true }); await page.screenshot({ path: path.join(process.env.DESIGN_SCREENSHOT_DIR, 'design-studio-mobile.png'), fullPage: true }); await page.setViewportSize({ width: 1440, height: 1000 }); await page.click('[data-step="2"]'); await page.screenshot({ path: path.join(process.env.DESIGN_SCREENSHOT_DIR, 'design-studio-desktop.png'), fullPage: true }); }
    await context.close();

    // A broken library must remain available for recovery; startup cannot silently overwrite it.
    const broken = await browser.newContext(); await broken.addInitScript(() => localStorage.setItem('access-design-library-v1', 'damaged-library'));
    const recovery = await broken.newPage(); await recovery.goto(base + '/numeracy-hub/design/index.html'); await recovery.waitForFunction(() => window.DesignWorkshop);
    assert.equal(await recovery.evaluate(() => localStorage.getItem('access-design-library-v1')), 'damaged-library');
    await broken.close();
    console.log('PASS: 25 shape previews, angle units, SVG/DXF closed holes, profile edits/rejection, named recovery, numeracy and inspection staleness, assignment/rubric/submission, 320px and damaged-library preservation');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
