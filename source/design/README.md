# Design Workshop source and verification

The student workflow is **Brief → Draw → Check → Machine → Reflect**. Run the site from its repository root or open the downloaded root `index.html`. The design workspace is `numeracy-hub/design/index.html`.

## Files

- `numeracy-hub/design/design-model.js` exposes the dependency-free `AccessDesign` API in browsers and Node. Native project data stores dimensions in mm; mm/in is a display preference.
- `numeracy-hub/design/design-app.js`, `index.html`, and `design.css` provide the guided UI, local autosave, undo/redo, native project file handling, worksheet printing, and measured SVG/DXF export.
- `shape-canvas/design-bridge.js` uses canvas semantic dimensions, not pixels or paper scale. A confirmed import adds a page and leaves existing pages intact. The supported subset is rectangle, square, circle, annulus, and cylinder.
- `numeracy-hub/cnc/manual-engine.js` and `manual-builder.js` are the existing teaching CNC action model/UI. Its simulator project adapter uses internal inch dimensions; enter through its public APIs when transferring stock and units.
- `numeracy-hub/cnc/design-bridge.js` and `design-bridge.css` provide the target reference and explicit setup transfer. `CNCDesignBridge.prepare` delegates exact limits to `CNCManual.create`; `CNCBuilder.applySetup` applies a checked setup. The bridge retains the original design and listens to `cnc-builder-state` to identify a changed setup. It generates no cutting actions.
- `docs/student-design-gap-analysis.md` records baseline evidence, current delivery boundaries, the prioritized capability map, and acceptance scenarios.

## Automated checks

Node's built-in test runner is sufficient for the model and canvas bridge tests. From the repository root:

```sh
node --test source/design/design-model.test.cjs source/design/canvas-bridge.test.cjs
```

Run the CNC adapter contract tests separately:

```sh
node --test source/design/cnc-design-bridge.test.cjs
```

The model tests exercise strict schema and value validation, supported shape/unit conversion, encoding/decoding, stock fit, geometry bounds, and measured exports. The canvas adapter tests use controlled canvas objects to test dimension conversion and preservation behaviour. The CNC adapter tests check the setup mapping and receiver limits. These are not substitutes for browser interaction or a desktop application round trip.

`browser-workflow.test.cjs` requires a locally available Playwright package and its Chromium browser, plus a local HTTP server serving the repository root. With those prerequisites available, start the server in one terminal:

```sh
python -m http.server 8765 --bind 127.0.0.1
```

Then run the browser checks from the repository root in another terminal:

```sh
node source/design/browser-workflow.test.cjs
node source/design/browser-cnc.test.cjs
```

The scripts default to `http://127.0.0.1:8765`; `DESIGN_BASE_URL` overrides it. `DESIGN_SCREENSHOT_DIR` optionally saves screenshots outside the source tree. The browser scripts also exercise local-file/offline operation. Do not use the test-file wildcard for the Node-only checks: the browser scripts need the extra prerequisites above.

Use original tiny fixtures with known dimensions. Do not add supplied application binaries, commercial sample drawings, credentials, or personal files to this test directory.

## Browser release checks

Record observed results in the change's validation notes. At minimum:

1. Create a plate, enter a brief, change dimensions and units, check fit, record reflection, download/open the native project, then undo/redo an edit.
2. Send the part to a canvas containing existing pages, confirm the new page, edit a dimension, and return to the design method. Confirm unrelated pages and real dimensions survive.
3. Repeat with a washer and shaft. Verify invalid washer dimensions are rejected and shaft SVG/DXF export explains why it is unavailable.
4. Transfer to the CNC receiver. Before applying setup, confirm the current CNC draft is retained. After explicit apply, confirm stock/units/title and target reference agree with the design; out-of-range stock must fail without replacing the job.
5. Verify failed imports, blocked localStorage, and unsupported canvas selections leave usable work and a recovery action.
6. Check keyboard navigation, visible focus, 320 px width, 200% zoom, file downloads, and offline operation. Optional CNC DWG/STEP/IGES readers are separately documented network features.
7. Attempt a stale return from an older canvas/project tab; document any remaining conflict limitation instead of treating navigation as synchronization.

The complete A01–A16 scenarios and P0/P1/P2 acceptance matrix are in the gap analysis. Passing model tests does not prove manufacturing readiness, accessible completion, or target machining. This integration carries a design target and setup into a teaching workflow; operations and generated programs require their own checks.
