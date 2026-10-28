# Local PDF dependencies

These files are loaded only when a quiz PDF is exported. No CDN or external service is used at runtime.

- `pdf-lib.min.js`: pdf-lib 1.17.1, MIT license. Source: https://github.com/Hopding/pdf-lib. License in `pdf-lib-LICENSE.md`.
- `fontkit.umd.min.js`: @pdf-lib/fontkit 1.1.1, MIT license. Source: https://github.com/Hopding/fontkit. Attribution and upstream license declaration in `fontkit-LICENSE.txt`.
- `pdf-resources.js`: DejaVu Sans regular/bold plus the existing quiz illustrations and official IS4S badge, encoded for offline use. DejaVu copyright and font license are in `DejaVu-LICENSE.txt`. Fonts are embedded as subsets to retain mathematical symbols in the PDF.

The original minified releases were downloaded from their versioned npm distribution files through jsDelivr. They are checked in so PDF exports use the local copies.

The resource bundle avoids browser restrictions on `fetch()` from `file://`, so exporting also works when opening the downloaded site directly. Rebuild it with `python source/quiz-generator/build-pdf-resources.py`; it reads the checked-in quiz images and badge plus DejaVu Sans installed locally (or passed through `--font-directory`).
