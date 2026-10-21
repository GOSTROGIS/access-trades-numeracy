# Source for the ACCESS Indigenous Skills4Success Numeracy books and calculators

The finished files are in the folders above this one:
- `books/`: Textbook, Exercise Book and Answer Key (US Letter PDFs)
- `calculators/`: offline TI-30Xa, Sharp EL-531XT and HP-15C calculator pages
- `brand/`: ACCESS logo SVG files, the ACCESS Indigenous Skills4Success (IS4S) badge and brand notes

This folder holds what is needed to rebuild them.

## Rebuild the books
1. Install Node.js and Playwright with Chromium.
2. In `source/book/vendor`, run `npm install` (Paged.js and the Archivo and IBM Plex fonts).
3. In `source/book`, run in this order:
   - `node build.js --book textbook --name textbook`
   - `node build.js --book exercise --name exercise`
   - `node build.js --book answers --name answers` (it reads the answers saved by the two builds above)
4. The PDFs are written to `source/book/out/`. `node lint.js out/textbook.html` checks the wording.

Every calculator key sequence in the books is played on the TI-30Xa and Sharp EL-531XT emulators in `source/calc2` during the build, and the build stops if a stated answer does not match.

## Rebuild the calculators
In `source/calculators`, run `python3 build.py`. It packs `source/calc2/calc-kit.js`, the fonts from `source/book/vendor` and the IS4S badge into one offline file per calculator.
