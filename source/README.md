# Source for the ACCESS Indigenous Skills4Success Numeracy books and calculators

The finished files are in the folders above this one:
- `books/`: Textbook, Exercise Book and Answer Key (US Letter PDFs)
- `calculators/`: offline TI-30Xa, Sharp EL-531XT and HP-15C calculator pages
- `brand/`: ACCESS logo SVG files, the ACCESS Indigenous Skills4Success (IS4S) badge and brand notes

This folder holds what is needed to rebuild them.

## Rebuild the books
1. Install Node.js and Playwright with Chromium.
2. In `source/book/vendor`, run `npm install` (Paged.js and the Archivo and IBM Plex fonts).
   Exercise PDF builds also require Python 3 with PyMuPDF (`python3 -m pip install pymupdf`) for the fillable form fields.
3. In `source/book`, run in this order:
   - `node build.js --book textbook --name textbook`
   - `node build.js --book exercise --name exercise`
   - `node build.js --book answers --name answers` (it reads the answers saved by the two builds above)
4. The PDFs are written to `source/book/out/`. `node lint.js out/textbook.html` checks the wording.

Exercise PDF builds automatically add answer, working, name and date fields and write a `*-forms.json` report. The page content and pagination stay intact. To add fields to an existing exercise PDF, use its matching HTML:

```sh
python3 source/book/fillable-pdf.py --pdf books/ACCESS-Trades-Numeracy-Exercise-Book.pdf --html books/ACCESS-Trades-Numeracy-Exercise-Book-web.html
```

The script preserves existing responses when the complete expected field set is already present. It refuses to overwrite a mismatched form.

Build the exercise web edition with `node build.js --book exercise --web` from `source/book`. It embeds the response controls, styles and browser storage code in the standalone HTML. To update the interactive layer in the published file without rebuilding its learning content, run:

```sh
node source/book/engine/exercise-fillable.js books/ACCESS-Trades-Numeracy-Exercise-Book-web.html
```

The PDF form fields embed the full DejaVu Sans font already bundled in `carpentry/intake-142/Quizzes/vendor/pdf-resources.js`, so later responses can include mathematical symbols. Its license is in the same folder.

Check field coverage and placement with `python3 source/book/test-exercise-forms.py`, and fonts and saved-response preservation with `python3 source/book/test-fillable-pdf.py` (both require PyMuPDF). Check browser persistence with `python3 source/book/test-fillable-web.py --browser /usr/bin/chromium` (Python Playwright and Chromium). Tests use temporary copies and fresh browser storage.

Every calculator key sequence in the books is played on the TI-30Xa and Sharp EL-531XT emulators in `source/calc2` during the build, and the build stops if a stated answer does not match.

## Rebuild the calculators
In `source/calculators`, run `python3 build.py`. It packs `source/calc2/calc-kit.js`, the fonts from `source/book/vendor` and the IS4S badge into one offline file per calculator.
