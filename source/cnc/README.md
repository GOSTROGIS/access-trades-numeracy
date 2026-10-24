# CNC workshop checks

Run `node source/cnc/test-manual-engine.cjs` from the repository root. No packages are required. The checks cover unit conversion, mill and lathe coordinate conventions, G-code modes, immutable action history, input validation, undo, spindle/feed state and finishing moves.

The maintained browser files live in `numeracy-hub/cnc/`; there is no build step. Open the page through Numeracy Hub’s **CNC machining** tab or serve the repository with a local static server.

For an interactive check, use **Manual program builder → Position for a first cut**, feed into the stock, and confirm that the visible cut and generated program agree. Check both machines, undo/redo, a rejected rapid into stock, reload, `.nc` download and full-program replay. The simulator’s diagnostics use an approximate geometric model.
