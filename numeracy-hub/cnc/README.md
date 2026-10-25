# CNC workshop

Open `index.html`, or choose **CNC machining** in Numeracy Hub.

- **3D simulator:** explore the mill and lathe, edit programs, inspect workholding and tools, and run the included machining demonstrations.
- **Manual program builder:** choose stock and units, start the spindle, and jog or enter tool coordinates. Accepted moves update the cut stock and G-code together. Undo and redo rebuild both. Each machine keeps its own draft in the browser.
- **Program output:** copy or download an `.nc` program, or replay it in the 3D simulator. The builder includes the setup and finishing moves. The mill uses XYZ coordinates; lathe X is diameter and Z0 is the front face. Builder feed is distance per minute.
- **Design Workshop:** bring a measured drawing and stock into an ordered sequence. Add facing before other cuts, then pockets/profiles/clearing/drilling on the mill or turning followed by parting on the lathe. Generate, review, simulate, compare with the design, and capture the result before returning to the same project.

Use **Add setup** when the part needs to be turned over or held differently. Give each setup a useful name, choose its side and workholding, then add its cuts and finished-material goal. A plan can contain four setups with up to 12 operations each. Choose **Generate and check through setup** to review the selected stage and everything before it. The checks use the material left by earlier cuts, including support contact, jaw engagement and tool clearance. Rejected checks keep the previous simulation and manual draft available.

Mill setups can use the original top or turn the stock over about X to machine the bottom. The outline and actual remaining material turn together. Depths start at the original surface of the chosen side; the comparison retains both side goals. Lathe fixture changes retain the original front and stock datum. Parting ends the setup chain; reversing or remounting a loose piece is not supported.

After a successful simulation, compare and capture the selected setup, then return to the Design Workshop. The setup names, fixtures, cuts and measured comparison stay with the project, Canvas exchange, worksheet and submission. Changing an earlier setup marks later captures for review. Reloading or replaying rebuilds the preceding cuts before running the selected setup.

In a shared design sequence, facing amounts are measured from the original stock top/front. Mill pocket and profile depths also start at that original top. Lathe turning and finished-piece lengths start at the newly faced front; the work offset stays fixed. Enter the intended facing allowance in the comparison goal, independently of the cut. Parting runs last and includes blade width plus chuck clearance. The comparison checks sampled material, including the front and length of one loose piece, and keeps the result with the design's worksheet and submission.

The manual builder uses a flat end mill or a turning tool and the simulator’s Classic-style interpreter. It is a teaching generator, not a machine-specific production postprocessor. Material removal and collision checks use the simulator’s approximate stock model.

The simulator, manual builder, examples, DXF/SVG/CSV and STL imports work locally without a network. Optional DWG and STEP/IGES readers download on demand and need internet access.

The machine models and interface carry the official IS4S artwork from `../../brand/`, using the ACCESS colour palette.

## Included components

The browser simulator, 40 project demonstrations and sample programs came from the supplied `Simulators.zip`. The legacy Windows executables and machine-memory files are not included in this web module.

Three.js r128 is bundled in `index.html` under the MIT licence; its original notice is retained. Optional external readers are `@mlightcad/libredwg-web` 0.7.15 (GPL-3.0) and `occt-import-js` 0.0.23 (LGPL-2.1); they are not bundled. Tool and control manufacturer names identify training references, not endorsements.

`manual-engine.js` holds the action model and code generation. `manual-builder.js` and `manual-builder.css` provide the workspace. The `Trainer.previewManual` and `Trainer.validateManual` hooks in `index.html` compile and check candidate programs before changing the visible part. Shared branding is in `access-theme.css` and `access-brand.js`.
