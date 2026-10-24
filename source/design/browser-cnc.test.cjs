/* Run against an HTTP server at the repository root.
   DESIGN_BASE_URL=http://127.0.0.1:8765 node source/design/browser-cnc.test.cjs
   Optional DESIGN_SCREENSHOT_DIR writes review screenshots outside the source tree. */
'use strict';
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const D = require('../../numeracy-hub/design/design-model.js');
const Bridge = require('../../numeracy-hub/cnc/design-bridge.js');
const root = path.resolve(__dirname, '../..');
const base = process.env.DESIGN_BASE_URL || 'http://127.0.0.1:8765';
const screenshots = process.env.DESIGN_SCREENSHOT_DIR;
if (screenshots) fs.mkdirSync(screenshots, { recursive: true });
const shot = async (page, name) => { if (screenshots) await page.screenshot({ path: path.join(screenshots, name + '.png'), fullPage: true }); };
const state = page => page.evaluate(() => JSON.parse(JSON.stringify(CNCBuilder.getState())));
const ready = page => page.waitForFunction(() => window.CNCBuilder && CNCBuilder.getState() && window.CNCDesignBridge);
const incoming = async (page, project) => {
  await page.evaluate(hash => { location.hash = hash; }, '#design=' + D.encode(project));
  await page.waitForFunction(title => document.getElementById('cnc-design-title').textContent === title, project.title);
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const external = [];
    await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => { external.push(route.request().url()); return route.abort(); });
    const page = await context.newPage(), errors = [];
    page.setDefaultTimeout(25000); page.setDefaultNavigationTimeout(45000);
    page.on('pageerror', error => errors.push(error.stack || error.message));
    console.log('CNC browser: opening manual workspace');
    await page.goto(base + '/numeracy-hub/cnc/index.html?mode=builder&machine=mill');
    await ready(page);
    console.log('CNC browser: checking explicit handoff and draft recovery');
    assert.equal(await page.locator('#cnc-design-nav').count(), 1);
    await page.click('#mb-spindle');
    const original = await state(page);
    assert.equal(original.actions.length, 1);
    const plate = D.create('plate'); plate.title = 'Bench plate 25%'; plate.brief = 'Make a measured plate for the fixture.'; plate.reflection = 'Keep my original design notes.';
    await incoming(page, plate);
    assert.deepEqual(await state(page), original, 'Offering a design never overwrites a draft');
    assert.equal(await page.locator('#cnc-design-target').evaluate(el => el.open), true);
    assert.equal(await page.locator('#cnc-design-preview img').count(), 1);
    await page.click('#cnc-design-apply');
    assert.deepEqual((await state(page)).config, Bridge.prepare(plate).config);
    assert.equal((await state(page)).actions.length, 0);
    assert.match(await page.locator('#cnc-design-summary').innerText(), /linked setup/);
    assert.equal(await page.evaluate(() => location.hash), '');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('numeracy-cnc-manual-v1-before-design')).jobs.mill.actions.length), 1);
    assert.deepEqual(D.decode((await page.locator('#cnc-design-return').getAttribute('href')).split('#project=')[1]), plate);
    await page.click('#mb-undo');
    assert.deepEqual(await state(page), original, 'Undo restores full prior config and action history');
    assert.match(await page.locator('#cnc-design-summary').innerText(), /reference/);
    await page.click('#mb-redo');
    assert.deepEqual((await state(page)).config, Bridge.prepare(plate).config);
    await page.reload(); await ready(page);
    assert.match(await page.locator('#cnc-design-summary').innerText(), /linked setup/);
    assert.equal(await page.locator('#cnc-design-title').textContent(), plate.title);
    await page.click('#mb-lathe');
    assert.match(await page.locator('#cnc-design-summary').innerText(), /reference/);
    await page.click('#mb-mill');
    assert.match(await page.locator('#cnc-design-summary').innerText(), /linked setup/);

    for (const machine of ['mill', 'lathe']) for (const units of ['mm', 'in']) {
      console.log('CNC browser: checking ' + machine + ' ' + units);
      const p = D.create(machine === 'mill' ? 'washer' : 'shaft'); p.units = units;
      p.title = machine + ' ' + units + ' target'; p.brief = 'Measure, machine, and compare the result.';
      if (machine === 'mill') { p.stock.width = 101.6; p.stock.height = 76.2; p.stock.depth = 12.7; }
      else { p.stock.diameter = 50.8; p.stock.length = 101.6; }
      const before = await state(page);
      await incoming(page, p);
      assert.deepEqual(await state(page), before);
      await page.click('#cnc-design-apply');
      assert.deepEqual((await state(page)).config, Bridge.prepare(p).config);
      assert.equal(await page.evaluate(() => Trainer.S.machine), machine);
      assert.equal((await state(page)).actions.length, 0);
      const restored = D.decode((await page.locator('#cnc-design-return').getAttribute('href')).split('#project=')[1]);
      assert.deepEqual(restored, p);
      await page.click('#mb-undo');
      assert.deepEqual(await state(page), before, 'Undo restores prior machine too');
      await page.click('#mb-redo');
      assert.deepEqual((await state(page)).config, Bridge.prepare(p).config);
    }
    const lastValid = await state(page);
    console.log('CNC browser: checking invalid links and responsive return');
    await page.evaluate(() => { location.hash = '#design=%INVALID'; });
    await page.waitForFunction(() => document.getElementById('cnc-design-title').textContent === 'Design could not be opened');
    assert.equal(await page.locator('#cnc-design-apply').isDisabled(), true);
    assert.deepEqual(await state(page), lastValid);
    const tooLarge = D.create('plate'); tooLarge.title = 'Oversized stock'; tooLarge.stock.width = 1000;
    await incoming(page, tooLarge);
    assert.equal(await page.locator('#cnc-design-apply').isDisabled(), true);
    assert.match(await page.locator('#cnc-design-status').innerText(), /Stock X length must be no more/);
    assert.deepEqual(await state(page), lastValid);
    const fresh = D.create('washer'); fresh.title = 'Mobile washer'; fresh.brief = 'Check the inner and outer diameters.';
    await incoming(page, fresh); await page.click('#cnc-design-apply');
    await page.locator('#cnc-design-target summary').click();
    await shot(page, 'cnc-design-desktop');
    await page.setViewportSize({ width: 390, height: 844 });
    await shot(page, 'cnc-design-mobile');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, '390 px layout does not overflow horizontally');
    const retained = D.decode((await page.locator('#cnc-design-return').getAttribute('href')).split('#project=')[1]);
    await page.click('#cnc-design-return');
    await page.waitForURL('**/numeracy-hub/design/index.html**');
    await page.waitForFunction(() => window.DesignWorkshop);
    assert.deepEqual(await page.evaluate(() => DesignWorkshop.getProject()), retained);
    assert.deepEqual(errors, [], 'No uncaught CNC bridge/browser errors');
    assert.deepEqual(external, [], 'The manual design workflow needs no external network assets');
    await context.close();

    // The bundled viewer, shape preview and setup handoff also run directly from a downloaded folder.
    const offline = await browser.newContext({ offline: true, viewport: { width: 390, height: 844 } });
    console.log('CNC browser: checking offline file workflow');
    const local = await offline.newPage(), offlineErrors = [];
    local.on('pageerror', error => offlineErrors.push(error.message));
    const file = pathToFileURL(path.join(root, 'numeracy-hub/cnc/index.html'));
    file.search = '?mode=builder&machine=lathe';
    const shaft = D.create('shaft'); shaft.title = 'Offline shaft';
    file.hash = 'design=' + D.encode(shaft);
    await local.goto(file.href); await ready(local);
    assert.equal(await local.locator('#cnc-design-title').innerText(), shaft.title);
    assert.equal(await local.locator('#cnc-design-preview img').count(), 1);
    await local.click('#cnc-design-apply');
    assert.deepEqual((await state(local)).config, Bridge.prepare(shaft).config);
    assert.equal(await local.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(offlineErrors, []);
    await offline.close();
    console.log('PASS: CNC explicit setup, draft preservation, mill/lathe mm/in, undo across machines, reload, divergence, invalid inputs, return link, mobile layout and offline file workflow');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
