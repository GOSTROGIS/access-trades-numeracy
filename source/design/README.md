# Design Workshop source and verification

The student method is **Brief → Draw → Check → Machine → Reflect**. Serve the repository root or open the downloaded root `index.html`. The workspace is `numeracy-hub/design/index.html`.

## Module responsibilities

- `numeracy-hub/design/design-model.js` exposes `AccessDesign` in browsers and Node. Physical lengths are canonical mm; mm/in is a display preference. The model supports all 24 flat shapes in the shared Shapes engine, the turning cylinder, and validated closed profiles. Angles and counts retain their own semantics. Profiles allow 64 rings / 4,096 vertices, including holes, nested islands, and disconnected parts. Crossings, touching boundaries, and zero edges are rejected.
- `numeracy-hub/design/design-workflow.js` exposes `AccessDesignWorkflow`. It validates optional project metadata and implements library/history, dependency fingerprints, operation/result records, numeracy comparisons, entered inspections, assignments, explicit rubric reviews, and submission snapshots. Metadata validation does not depend on the model; project helpers resolve the model lazily.
- `numeracy-hub/design/design-app.js`, `index.html`, and `design.css` own the five-stage UI, native project files, autosave, undo/redo, printing, and physical SVG/DXF exports. `design-studio.js` adds the library, guided/advanced controls, numeric profile editor, comparisons, inspection, classroom exchange, and shared learning record.
- `shape-canvas/design-bridge.js` transfers semantic dimensions and actual closed composite outlines. A single parametric object's presentation placement/scale does not redefine its dimensions. Composites require a common physical scale. Same-project transfers update their identified object; conflicting/locked/linked objects offer a separate-page import. Existing unrelated pages remain intact.
- `numeracy-hub/cnc/manual-engine.js` and `manual-builder.js` provide the existing teaching action model/UI. Their simulator adapter uses internal inch dimensions; transfer stock and units through the public APIs.
- `numeracy-hub/cnc/design-bridge.js` and `design-bridge.css` provide a target reference, explicit setup transfer, operation controls, and evidence return. Applying the design setup alone creates no cutting actions. Existing manual drafts are preserved until explicit application.
- `numeracy-hub/cnc/design-cam.js` exposes `AccessDesignCAM` and reuses `cad-engine.js` / `cam-engine.js` for supported closed-outline imports and single-operation teaching programs. Generated interpreter checks and approximate simulator captures are tied to the source fingerprint. Captures do not establish target dimensions or production-machine readiness.
- `docs/student-design-gap-analysis.md` records baseline evidence, the current capability boundary, prioritized gaps, and A01–A23 acceptance scenarios.

Exact circles and annuli retain circular SVG/DXF entities. Other curved parametric outlines use sampled chords with approximation information. A cylinder has no automatic SVG/DXF machining export. Shared import accepts a restricted SVG/ASCII DXF closed-outline subset: physical scaling is explicit, unsupported/open geometry fails before replacement, and original appearance/object semantics are not preserved. Native CDR/VSDX editing, parametric sketch constraints, tracing, general assemblies, multi-operation planning, and classroom accounts are outside this integration.

## Workflow and persistence contract

Optional `project.workflow` contains version/revision, mode, checkpoints, inspections, assignment, reviews, one operation, and results. `ensure(project)` returns a validated detached project with defaults. `syncMetadata(next, previous)` advances revision for a meaningful content change; a no-op does not. Use the same helper when editing through a bridge.

`fingerprint(project)` covers identity, geometry, stock, placement, units, machine, and operation. `geometryFingerprint(project)` covers identity/geometry for inspections and numeracy comparisons. Captured records retain their fingerprint; status helpers mark them stale without erasing evidence. These hashes detect changes and are not security signatures.

`setOperation`, `recordResult`, `addCheckpoint`, `inspect`, `assign`, and `review` return a detached updated project. `assessment` reports comparisons and explicitly entered review scores; it never invents marks. `submission` captures the project and assessment at deliberate export time. Measured dimensions come from the user and are not authenticated physical measurements.

The offline library lives in the single localStorage record `access-design-library-v1`, limited to 4 MiB, 20 projects, and 12 historical snapshots per project. Each entry also retains its current project separately from snapshots. `upsert` prunes old automatic edits before explicitly named versions. When all 12 slots are named, autosave still updates the current head; another named version requires freeing a slot. `restoreRevision` creates a new current revision. `removeRevision` and `remove` support explicit recovery-space management.

`exportLibrary` / `importLibrary` preserve the complete record. `mergeLibrary` preserves full histories, skips identical entries, and copies differing same-ID entries under a new identity. Their existing evidence becomes stale because its original identity is retained in its fingerprint. No existing project is replaced by a conflicting backup.

`saveLibrary` validates and writes once, returning `{ok, library, message}`. `loadLibrary` returns `{ok: false, library, message}` for corruption or blocked storage without overwriting the stored data. The UI must gate automatic writes after a failed load, preserve editing/download recovery, and report unsuccessful writes truthfully. Browser tab merging is best effort; localStorage is not a transactional collaboration service.

## Automated checks

Use Node's built-in test runner from the repository root for the pure model, workflow, geometry, engine-drift, and adapter checks:

```sh
node --test source/design/design-model.test.cjs source/design/design-workflow.test.cjs source/design/design-geometry.test.cjs source/design/engine-consistency.test.cjs source/design/canvas-bridge.test.cjs source/design/cnc-design-bridge.test.cjs
node --test source/design/cnc-cam.test.cjs
```

These exercise schema and bounds, units/angles/counts, topology, source-versus-shipped engine consistency, physical exchange, setup mapping, operation/program generation, revision invalidation, comparison/inspection records, full-library backup/merge, pinned versions, and blocked/corrupt storage. Pure tests do not replace browser journeys or desktop round trips.

The browser scripts require a local Playwright package and Chromium plus a server serving the repository root. Start a server in one terminal:

```sh
python -m http.server 8765 --bind 127.0.0.1
```

Then run in another terminal:

```sh
node source/design/browser-workflow.test.cjs
node source/design/browser-design-studio.test.cjs
node source/design/browser-canvas-geometry.test.cjs
node source/design/browser-cnc.test.cjs
node source/design/browser-cnc-cam.test.cjs
```

The scripts default to `http://127.0.0.1:8765`; `DESIGN_BASE_URL` overrides it. `DESIGN_SCREENSHOT_DIR` optionally stores screenshots outside the source tree. Browser suites include local-file/offline checks where applicable. Do not use a broad test-file wildcard for Node-only checks: browser scripts have additional prerequisites.

Use original small fixtures with known dimensions. Do not add application binaries, commercial sample drawings, credentials, or personal files.

## Browser release checks

Recorded integrated checkpoint: 53 shared model/workflow/geometry/adapter/CAM tests plus 10 CNC manual-engine checks pass (63 total), as do the five browser scripts above. The CAM browser rerun also verifies generated-program navigation, explicit cycle start/reset, and return to the preserved manual draft. Keep subsequent results in release notes after final integration edits:

1. Complete the five-stage plate journey, switch units without physical drift, save/open, undo/redo, and repeat with washer/shaft.
2. Exchange geometry with a canvas containing unrelated work. Verify real dimensions, composite holes/common scale, same-project update, stale conflicts, and unsupported selection preservation.
3. Create multiple library projects and named versions, restore a version, back up/reimport history, and test blocked/quota/corrupt storage. At twelve named versions, keep editing the current project and verify no name disappears.
4. Record an estimate/calculation, entered measurement/tolerance, assignment, and rubric review. Switch between projects sharing a rubric and verify scores/comments remain isolated. Export a submission with the exact evidence/status. Export current dimensions as assignment targets and verify requirement comparisons in Check.
5. Import supported SVG/DXF contours, reject invalid topology/unsupported constructs, edit profile coordinates without dragging, apply physical rotate/mirror/scale transforms, and verify explicit physical dimensions.
6. Apply design setup deliberately in CNC, preserve the prior draft until application, generate a supported operation, capture its checks/preview, return to the design, and verify stale evidence after dependency changes.
7. Complete the keyboard path, visible-focus review, 320 px/200% zoom checks, downloads, and offline core operation. Optional CNC DWG/STEP/IGES readers are separately documented network features. Test screen-reader tasks with an actual assistive-technology user.

The gap analysis keeps implemented scope separate from the complete roadmap. Passing tests establishes only the tested behavior; it does not certify machining, dimensional inspection, accessibility conformance, or classroom usability.
