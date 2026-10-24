# CNC workshop

Open `index.html`, or choose **CNC machining** in Numeracy Hub.

- **3D simulator:** explore the mill and lathe, edit programs, inspect workholding and tools, and run the included machining demonstrations.
- **Manual program builder:** choose stock and units, start the spindle, and jog or enter tool coordinates. Accepted moves update the cut stock and G-code together. Undo and redo rebuild both. Each machine keeps its own draft in the browser.
- **Program output:** copy or download an `.nc` program, or replay it in the 3D simulator. The builder includes the setup and finishing moves. The mill uses XYZ coordinates; lathe X is diameter and Z0 is the front face. Builder feed is distance per minute.

The manual builder uses a flat end mill or a turning tool and the simulator’s Classic-style interpreter. It is a teaching generator, not a machine-specific production postprocessor. Material removal and collision checks use the simulator’s approximate stock model.

The simulator, manual builder, examples, DXF/SVG/CSV and STL imports work locally without a network. Optional DWG and STEP/IGES readers download on demand and need internet access.

The machine models and interface carry the official IS4S artwork from `../../brand/`, using the ACCESS colour palette.

## Included components

The browser simulator, 40 project demonstrations and sample programs came from the supplied `Simulators.zip`. The legacy Windows executables and machine-memory files are not included in this web module.

Three.js r128 is bundled in `index.html` under the MIT licence; its original notice is retained. Optional external readers are `@mlightcad/libredwg-web` 0.7.15 (GPL-3.0) and `occt-import-js` 0.0.23 (LGPL-2.1); they are not bundled. Tool and control manufacturer names identify training references, not endorsements.

`manual-engine.js` holds the action model and code generation. `manual-builder.js` and `manual-builder.css` provide the workspace. The `Trainer.previewManual` and `Trainer.validateManual` hooks in `index.html` compile and check candidate programs before changing the visible part. Shared branding is in `access-theme.css` and `access-brand.js`.
