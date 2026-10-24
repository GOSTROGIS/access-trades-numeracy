/* Run with Playwright installed, against a local HTTP server at the repository root.
   DESIGN_BASE_URL=http://127.0.0.1:8765 node source/design/browser-workflow.test.cjs */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const D = require('../../numeracy-hub/design/design-model.js');
const root = path.resolve(__dirname, '../..');
const base = process.env.DESIGN_BASE_URL || 'http://127.0.0.1:8765';
const screenshotDir = process.env.DESIGN_SCREENSHOT_DIR;
if (screenshotDir) fs.mkdirSync(screenshotDir, { recursive: true });
const shot = async (p, name) => { if (screenshotDir) await p.screenshot({ path: path.join(screenshotDir, name + '.png'), fullPage: true }); };
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
    await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => route.abort());
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.stack || error.message));
    page.on('requestfailed', request => { if (request.url().startsWith(base)) errors.push(request.url() + ' ' + request.failure()?.errorText); });
    await page.goto(base + '/numeracy-hub/design/index.html');
    await page.waitForFunction(() => window.DesignWorkshop);
    assert.deepEqual(errors, [], 'Initial workshop scripts loaded');
    await page.fill('#project-title', 'Fixture plate'); await page.fill('#project-brief', 'Make a plate that fits the available stock.');
    await page.locator('#project-brief').blur();
    await page.click('[data-step="1"]'); await page.fill('#dim-l', '101.6'); await page.locator('#dim-l').blur();
    await page.click('[data-step="0"]'); await page.selectOption('#units', 'in');
    await page.click('[data-step="1"]'); assert.equal(await page.inputValue('#dim-l'), '4');
    assert.equal(await page.evaluate(() => DesignWorkshop.getProject().geometry.params.l), 101.6);
    await page.click('[data-step="2"]');
    assert.match(await page.locator('#check-list').innerText(), /Review/);
    await page.click('[data-step="3"]'); await page.click('#open-cnc', { force: true });
    assert.equal(await page.locator('[data-step="2"]').getAttribute('aria-current'), 'step');
    await page.fill('#stock-width', '5'); await page.locator('#stock-width').blur();
    assert.equal(await page.locator('#check-list .fail').count(), 0);
    await page.click('#undo'); assert.equal(await page.locator('#check-list .fail').count(), 1);
    await page.click('#redo'); assert.equal(await page.locator('#check-list .fail').count(), 0);
    await page.click('[data-step="4"]'); await page.fill('#reflection', 'I converted 101.6 mm to 4 in, then increased the stock width.'); await page.locator('#reflection').blur();
    const beforeCanvas = await page.evaluate(() => DesignWorkshop.getProject());
    await page.click('[data-step="1"]'); await page.click('#open-canvas');
    await page.waitForSelector('#design-project-dialog[open]');
    const oldPages = await page.evaluate(() => SC.M.doc.pages.length);
    await page.click('#design-project-primary');
    assert.equal(await page.evaluate(() => SC.M.doc.pages.length), oldPages + 1);
    const selected = await page.evaluate(() => SC.DesignBridge.selectedProject());
    assert.ok(Math.abs(selected.geometry.params.l - 101.6) < 1e-8); assert.equal(selected.brief, beforeCanvas.brief);
    // Exercise editing with the real canvas document, while unit regressions cover its individual fields.
    await page.evaluate(() => { const o = SC.M.obj(SC.S.sel[0]); o.params.l *= .9; SC.I.commit(); });
    await page.getByRole('button', { name: 'Design project', exact: true }).click();
    await page.click('#design-project-primary');
    await page.waitForURL('**/numeracy-hub/design/index.html**');
    await page.waitForFunction(() => window.DesignWorkshop);
    assert.equal(await page.locator('#new-dialog').evaluate(el => el.open), true,
      JSON.stringify({ url: page.url(), errors, project: await page.evaluate(() => DesignWorkshop.getProject()), notice: await page.locator('#notice').textContent() }));
    assert.equal(await page.evaluate(() => DesignWorkshop.getProject().geometry.params.l), 101.6);
    await page.click('#new-dialog [value="start"]');
    await page.waitForFunction(() => Math.abs(DesignWorkshop.getProject().geometry.params.l - 91.44) < 1e-8);
    assert.ok(Math.abs(await page.evaluate(() => DesignWorkshop.getProject().geometry.params.l) - 91.44) < 1e-8);
    assert.equal(await page.evaluate(() => DesignWorkshop.getProject().reflection), beforeCanvas.reflection);
    const project = await page.evaluate(() => DesignWorkshop.getProject());
    const downloadEvent = page.waitForEvent('download'); await page.click('#save-project'); const download = await downloadEvent;
    const saved = JSON.parse(fs.readFileSync(await download.path(), 'utf8')); assert.deepEqual(saved, project);
    await page.setInputFiles('#project-file', { name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"format":"wrong"}') });
    assert.match(await page.locator('#notice').innerText(), /not opened/); assert.deepEqual(await page.evaluate(() => DesignWorkshop.getProject()), project);
    await page.reload(); await page.waitForFunction(() => window.DesignWorkshop);
    assert.deepEqual(await page.evaluate(() => DesignWorkshop.getProject()), project);
    await page.setInputFiles('#project-file', { name: 'saved.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(beforeCanvas)) });
    await page.waitForFunction(() => DesignWorkshop.getProject().geometry.params.l === 101.6);
    await page.click('[data-step="3"]');
    const svgDownload = page.waitForEvent('download'); await page.click('#export-svg');
    const svgText = fs.readFileSync(await (await svgDownload).path(), 'utf8'); assert.match(svgText, /mm"/);
    await page.click('[data-step="0"]'); await shot(page, 'design-desktop');
    await page.setViewportSize({ width: 390, height: 844 }); await shot(page, 'design-mobile');
    for (let n = 0; n < 5; n++) { await page.click(`[data-step="${n}"]`); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'No mobile horizontal overflow at step ' + n); }
    assert.deepEqual(errors, [], 'No uncaught browser errors in the shared workflow');
    const mismatched = D.create('plate'); mismatched.machine = 'lathe'; mismatched.brief = 'Fix the imported setup.';
    await page.setInputFiles('#project-file', { name: 'mismatched.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(mismatched)) });
    await page.click('[data-step="3"]'); assert.doesNotMatch(await page.locator('#machine-summary').textContent(), /NaN/);
    await page.click('[data-step="2"]'); await page.click('#repair-machine');
    assert.equal(await page.evaluate(() => DesignWorkshop.getProject().machine), 'mill');
    await page.click('[data-step="1"]'); await page.fill('#dim-l', '81'); await page.press('#dim-l', 'Tab');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'dim-w', 'Changing a dimension preserves keyboard navigation');
    await context.close();

    // Every essential workshop asset must also work from a downloaded folder, without a server.
    const offline = await browser.newContext({ offline: true, viewport: { width: 390, height: 844 } });
    const local = await offline.newPage();
    await local.goto(pathToFileURL(path.join(root, 'numeracy-hub/design/index.html')).href);
    await local.waitForFunction(() => window.DesignWorkshop);
    assert.equal(await local.locator('#drawing-preview svg').count(), 1);
    await offline.close();

    const denied = await browser.newContext();
    await denied.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } }); });
    const blocked = await denied.newPage(); await blocked.goto(base + '/numeracy-hub/design/index.html');
    await blocked.waitForFunction(() => window.DesignWorkshop);
    assert.match(await blocked.locator('#save-status').innerText(), /unavailable/);
    await denied.close();
    console.log('PASS: student workflow, stock gate, unit conversion, undo, canvas round trip, file recovery, responsive layout, offline file and blocked storage');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
