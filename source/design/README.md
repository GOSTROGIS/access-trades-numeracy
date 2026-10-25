# Design Workshop source and verification

The student method is **Brief → Draw → Check → Machine → Reflect**. Serve the repository root or open the downloaded root `index.html`. The workspace is `numeracy-hub/design/index.html`.

## Module responsibilities

- `numeracy-hub/design/design-model.js` exposes `AccessDesign` in browsers and Node. Physical lengths are canonical mm; mm/in is a display preference. The model supports all 24 flat shapes in the shared Shapes engine, the turning cylinder, and validated closed profiles. Angles and counts retain their own semantics. Profiles allow 64 rings / 4,096 vertices, including holes, nested islands, and disconnected parts. Crossings, touching boundaries, and zero edges are rejected.
- `numeracy-hub/design/design-workflow.js` exposes `AccessDesignWorkflow`. It validates optional project metadata and implements library/history, dependency fingerprints, operation/result records, numeracy comparisons, entered inspections, assignments, explicit rubric reviews, and submission snapshots. Metadata validation does not depend on the model; project helpers resolve the model lazily.
- `numeracy-hub/design/design-app.js`, `index.html`, and `design.css` own the five-stage UI, native project files, autosave, undo/redo, printing, and physical SVG/DXF exports. `design-studio.js` adds the library, guided/advanced controls, numeric profile editor, comparisons, inspection, classroom exchange, and shared learning record.
- `shape-canvas/design-bridge.js` transfers semantic dimensions and actual closed composite outlines. A single parametric object's presentation placement/scale does not redefine its dimensions. Composites require a common physical scale. Same-project transfers update their identified object; conflicting/locked/linked objects offer a separate-page import. Existing unrelated pages remain intact.
- `numeracy-hub/cnc/manual-engine.js` and `manual-builder.js` provide the existing teaching action model/UI. Their simulator adapter uses internal inch dimensions; transfer stock and units through the public APIs.
- `numeracy-hub/cnc/design-bridge.js` and `design-bridge.css` provide a target reference, explicit setup transfer, operation controls, and evidence return. Applying the design setup alone creates no cutting actions. Existing manual drafts are preserved until explicit application.
- `numeracy-hub/cnc/design-cam.js` exposes `AccessDesignCAM` and reuses `cad-engine.js` / `cam-engine.js` for supported closed-outline imports and ordered sequences of up to 12 teaching operations per setup. `generateSetups` prepares up to four setups through a selected stage, each with an explicit fixture, orientation, sequence and goal. Facing runs first at increasing cumulative allowances per physical side; lathe parting ends the chain. Mill tool changes retract; cylinder turning steps use unique profile labels. Interpreter checks and completed simulator captures retain the appropriate setup-prefix fingerprint.
- `numeracy-hub/cnc/design-workholding.js` exposes `AccessDesignWorkholding` with canonical-mm, method-specific fixture controls and one explicit conversion into the existing simulator. `design-material.js` exposes `AccessDesignMaterial` for bounded native material validation, orientation, transfer and consistency fingerprints. The simulator replays the prefix from original stock, carrying only actual completed material into each later setup; stored project files never supply a replacement stock array.
- `numeracy-hub/cnc/design-comparison.js` exposes `AccessDesignComparison.defaults/compare/summary/renderSVG`. It reads actual detached copies of stock samples from `Scene3D.materialSnapshot` / `Trainer.simulatedMaterial` after successful playback. Mill comparison uses top/bottom material surfaces and an explicit pocket/retained-solid/facing goal. Lathe comparison measures diameter, front position, and one parted piece's sampled length in the original stock frame. Mounted chuck allowance is excluded. Summary metrics/maps preserve tolerance and sampling limits.
- `docs/student-design-gap-analysis.md` records baseline evidence, the current capability boundary, prioritized gaps, and A01–A37 acceptance scenarios.

Exact circles and annuli retain circular SVG/DXF entities. Other curved parametric outlines use sampled chords with approximation information. A cylinder has no automatic SVG/DXF machining export. Shared import accepts a restricted SVG/ASCII DXF closed-outline subset: physical scaling is explicit, unsupported/open geometry fails before replacement, and original appearance/object semantics are not preserved. Native CDR/VSDX editing, sketch constraints, tracing, general assemblies, automatic feature/process planning, arbitrary fixture geometry, lathe reversal/detached-part remounting, between-centres transfer, production postprocessors, and classroom accounts are outside this integration. Existing standalone mesh CAM is distinct from the shared setup/comparison contract.

## Workflow and persistence contract

Optional `project.workflow` contains version/revision, mode, checkpoints, inspections, assignment, reviews, a legacy operation, optional ordered sequence, optional comparison goal, optional setup plan, and results. `ensure(project)` returns a validated detached project with defaults. `syncMetadata(next, previous)` advances revision for a meaningful content change; a no-op does not. Use the same helper when editing through a bridge.

`getSequence(project)` (also `sequence`) resolves the legacy operation into one labelled step without changing the project. `setSequence(project, {version: 1, steps: [{id, label, operation}]})` persists up to 12 ordered steps and mirrors the first operation for older summary readers. The sequence is authoritative. `setOperation` intentionally returns to a legacy single operation and deletes the explicit sequence; generation can use it on isolated per-operation copies.

Optional `workflow.setups` is `{version: 1, items: [{id, label, fixture, orientation, sequence, comparison}]}`, with one to four uniquely identified setups. `getSetups` (alias `setups`) resolves old files to one implicit `setup-1` without changing them. `defaultSetup` constructs a reviewable default; `setSetups` persists the plan and mirrors the first setup's sequence/goal for older summary readers. The setup list is authoritative when present. `setupProject(project, id)` returns a detached projection with that setup's sequence/goal and no setup list; CAM owns the physical geometry transform. Old single-operation/sequence files and their hashes stay unchanged until explicit opt-in.

Mill orientation is `top` or `bottom`; bottom is an exact 180° turn about X, reversing Y and exchanging the measured top/bottom surfaces around original blank thickness. The first mill setup is top. Lathe setups keep `front`, the same original axial frame and stock; later setup transfer after parting is rejected. Supported fixtures are mill hard/soft vises, strap clamps and fixture plate; lathe three/four-jaw chucks, soft jaws, collet, tailstock support and steady rest. Each exposes only its declared parameters. Fixture/collision/support checks reuse the native models and actual remaining material; a different fixture does not restore removed stock.

`setupState(project, id)` reports `{setup, valid, issues, comparison}` without silently replacing a fixture. Stock/machine edits may leave historical fields needing review. `setSetups` context-checks every new or changed fixture/orientation/goal while retaining unchanged historical fields, so students can repair one field/setup at a time. Generation independently validates the entire selected prefix before machining. `setupFingerprint` covers base physical data and all setups through the selected one: earlier edits stale downstream records, while later edits leave upstream records current. Full-project setup hashes use `design-v3`; legacy mirrors and UI selection do not affect them.

Optional `result.setup` records `{id, index, orientation, inputMaterialFingerprint, outputMaterialFingerprint}`. `recordResult` validates its identity/order/orientation and selected goal, then writes the setup-prefix hash into `sourceFingerprint`. Preflight material digests are null; accepted completed simulations require both actual material digests. Material digests are consistency markers, not security signatures. Reloading a project requires replay of preceding setups to rebuild native material; compact evidence cannot seed future cuts. `compareSetups` compares both mill surfaces against the latest explicit goal for each physical side, retaining each side's tolerance.

`getComparison(project)` returns `{mode: 'retained-solid'|'pocket', depthMm, toleranceMm, faceAllowanceMm}`. The optional serialized facing allowance defaults semantically to zero; old files keep that field absent and retain their legacy hashes. For projects without an explicit goal, the default mill goal is a pocket at the lesser of 2 mm or 20% of stock depth, matching the recommended first operation; the lathe goal is retained-solid with null depth. Default tolerance is 0.1 mm. Explicit goals remain unchanged. `setComparison` validates the current machine/stock. `comparisonState` returns `{settings, adjusted, message}`: machine/stock changes resolve safe current settings without rewriting historical settings/evidence, and the UI prompts review.

Facing never moves the original G54 coordinate frame. A face operation's depth is the cumulative amount removed from the original top/front; only increasing leading face steps are accepted. In a mill setup, goal depth is absolute inward from the original surface of the chosen side: local kept surface is `-faceAllowanceMm`, cut floor is `-depthMm`, and equality describes a faced-only surface. Lathe turn/part depth is length from the newly faced front; a parting step's step-down is radial peck depth, independent of axial length. Generation checks the facing amount, target/operation length, blade behind the cut and fixture-specific simulated clearance. The comparison goal is an explicit student choice, never inferred silently from generated operations.

`fingerprint(project)` covers identity, geometry, stock, placement, units, machine, and operation. Explicit sequences/comparison settings extend it with every ordered step and target mode/depth/tolerance/facing allowance under a new fingerprint prefix. Untouched legacy hashes remain stable, including old goals without the optional facing field; adding or changing an explicit goal leaves earlier captures stale. `geometryFingerprint(project)` covers identity/geometry for inspections and numeracy comparisons. Status helpers preserve stale evidence. These hashes detect changes and are not security signatures.

`recordResult` accepts optional `operationCount` and validated `comparison` evidence. Comparison evidence retains metrics, resolution/status, observations/limitations, optional facing allowance and lathe dimension observations, and an optional compact mill map (48 × 48 maximum) or lathe chart (192 samples maximum). Dimension observations distinguish mounted/detached material, expected/observed front and length, and signed errors; unavailable observations remain null. Mounted stock cannot claim a loose-part length. Native detached profiles are copied before simulator part removal, bounded to 12 pieces/100,000 detached samples, and retained only in transient simulator snapshots. One loose piece can be assessed; multiple pieces and old parted snapshots without measured profiles report unsupported. Each end is unresolved by up to one axial spacing (normally 0.127 mm), so loose length has up to two spacings of uncertainty. Full simulator arrays are rejected from project evidence. Evidence settings must match the current effective goal. `recordResult`, `addCheckpoint`, `inspect`, `assign`, and `review` return detached updated projects. `assessment` reports explicit review scores; it never invents marks. `submission` captures the exact project and assessment. Entered measurements and sampled simulation comparison are separate evidence types, neither an authenticated physical inspection.

The offline library lives in the single localStorage record `access-design-library-v1`, limited to 4 MiB, 20 projects, and 12 historical snapshots per project. Each entry also retains its current project separately from snapshots. `upsert` prunes old automatic edits before explicitly named versions. When all 12 slots are named, autosave still updates the current head; another named version requires freeing a slot. `restoreRevision` creates a new current revision. `removeRevision` and `remove` support explicit recovery-space management.

`exportLibrary` / `importLibrary` preserve the complete record. The exported JSON is compact so valid near-limit libraries remain within the same import budget. `mergeLibrary` preserves full histories, skips identical entries, and copies differing same-ID entries under a new identity. Their existing evidence becomes stale because its original identity is retained in its fingerprint. No existing project is replaced by a conflicting backup.

`saveLibrary` validates and writes once, returning `{ok, library, message}`. `loadLibrary` returns `{ok: false, library, message}` for corruption or blocked storage without overwriting the stored data. The UI must gate automatic writes after a failed load, preserve editing/download recovery, and report unsuccessful writes truthfully. Browser tab merging is best effort; localStorage is not a transactional collaboration service.

## Automated checks

Use Node's built-in test runner from the repository root for the pure model, workflow, geometry, engine-drift, and adapter checks:

```sh
node --test source/design/design-model.test.cjs source/design/design-workflow.test.cjs source/design/design-geometry.test.cjs source/design/geometry-exports.test.cjs source/design/engine-consistency.test.cjs source/design/canvas-bridge.test.cjs source/design/cnc-design-bridge.test.cjs
node --test source/design/cnc-cam.test.cjs
node --test source/design/cnc-sequence.test.cjs source/design/design-comparison.test.cjs
node --test source/design/cnc-facing-parting.test.cjs
node --test source/design/cnc-setups.test.cjs source/design/design-material.test.cjs
node source/cnc/test-manual-engine.cjs
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
node source/design/browser-cnc-sequence.test.cjs
node source/design/browser-design-comparison.test.cjs
node source/design/browser-cnc-facing-parting.test.cjs
node source/design/browser-cnc-setups.test.cjs
```

The scripts default to `http://127.0.0.1:8765`; `DESIGN_BASE_URL` overrides it. `DESIGN_SCREENSHOT_DIR` optionally stores screenshots outside the source tree. Browser suites include local-file/offline checks where applicable. Do not use a broad test-file wildcard for Node-only checks: browser scripts have additional prerequisites.

Use original small fixtures with known dimensions. Do not add application binaries, commercial sample drawings, credentials, or personal files.

## Browser release checks

Current multi-setup checkpoint, 25 October 2026: 123 shared Node tests plus 10 CNC manual-engine checks pass (133 total), including 44 workflow, nine setup-generator and eight native-material transfer tests. Canvas project-file exchange also preserves setup plans and lineage and stales captured evidence after a physical geometry edit. Seven browser suites pass on the current implementation: studio, CNC CAM, ordered sequences, actual-material comparison, facing/parting, Canvas geometry and multiple setups.

The multi-setup journey verifies an asymmetric faced/pocketed top, an X-axis flip and a strap-clamped bottom pocket at the correct original-frame locations. It also covers native material lineage, insufficient jaw/collet rejection with transactional rollback, front-frame lathe fixture changes followed by parting, selected-setup replay/reset, immediate reload after adding a setup, upstream/downstream evidence status, return/reload, print/submission and mobile layout. Strap contact is checked against measured remaining surfaces; fixture seating does not restore cut stock.

Actual face/turn/part distinguishes short 18 mm from correct 20 mm pieces; faced/pocketed stock retains the intended absolute surfaces. Coverage includes order/workholding rejection, independent goal/helper, units, manual draft protection, capture/reload/return/staleness, undo, submission/print, 320 px layout, regenerated-map provenance, preview/start/reset, accepted mm/in cases, imports and offline operation. Outside clearing at 1→2 mm and two-step turning at 40→80 mm also pass actual playback. Boundary-only discrepancies retain raw metrics and report resolution-limited; resolved interior overcuts remain needs-work. Earlier beginner/CNC setup journeys passed. Release checks are:

1. Complete the five-stage plate journey, switch units without physical drift, save/open, undo/redo, and repeat with washer/shaft.
2. Exchange geometry with a canvas containing unrelated work. Verify real dimensions, composite holes/common scale, same-project update, stale conflicts, and unsupported selection preservation.
3. Create multiple library projects and named versions, restore a version, back up/reimport history, and test blocked/quota/corrupt storage. At twelve named versions, keep editing the current project and verify no name disappears.
4. Record an estimate/calculation, entered measurement/tolerance, assignment, and rubric review. Switch between projects sharing a rubric and verify scores/comments remain isolated. Export a submission with the exact evidence/status. Export current dimensions as assignment targets and verify requirement comparisons in Check.
5. Import supported SVG/DXF contours, reject invalid topology/unsupported constructs, edit profile coordinates without dragging, apply physical rotate/mirror/scale transforms, and verify explicit physical dimensions.
6. Apply design setup deliberately in CNC, preserve the prior draft until application, add/reorder supported operations and generate one program. Compare actual completed material with an explicit goal, capture the metrics/map, return to the workshop and verify stale evidence after order/tool/goal edits. Regenerating unchanged steps must clear a prior comparison; preflight cannot contain completed material evidence. Manual moves clear their cached comparison.
7. Face a mill surface then pocket to an absolute original-top depth; face/turn/part a shaft. Compare correct and deliberately wrong cut lengths/allowances in original coordinates. Confirm unsupported old/multiple-piece snapshots, nullable observations, blade/chuck bounds, final-only parting and increasing leading faces. Round-trip the compact evidence and verify sampled endpoint uncertainty remains visible.
8. Machine an asymmetric mill feature, turn to the bottom, change workholding and continue from actual prior material. Verify unchanged material lineage, both side goals, selected-setup program downloads, preflight without digests, reload/replay, and upstream/downstream evidence invalidation. Check supported front-frame lathe fixture changes, invalid support/grip rejection, and rejection of continuation after part-off. Historical incompatible plans must remain editable one field at a time without silently replacing their fixtures.
9. Complete the keyboard path, visible-focus review, 320 px/200% zoom checks, downloads, and offline core operation. Optional CNC DWG/STEP/IGES readers are separately documented network features. Test screen-reader tasks with an actual assistive-technology user.

The gap analysis keeps implemented scope separate from the complete roadmap. Passing tests establishes only the tested behavior; it does not certify machining, dimensional inspection, accessibility conformance, or classroom usability.
