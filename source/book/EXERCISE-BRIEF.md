# Exercise Book: author brief (read BOOK-BRIEF.md too, every rule there still applies)

The Exercise Book is a separate PDF of about 80 pages: front matter plus about 6 pages per chapter for Chapters 1 to 13. It is practice only: no teaching, no worked examples, no calculator boxes. Answers go to the Answer Key book, so every problem needs a correct answer computed in code.

## File and structure
One file per chapter: $BK/exercises/chNN-short-name.js (NN = the textbook chapter number), exporting function (B, L) that returns L.join([...]) of a flat list:

    B.exChapter({ num: NN, id: 'short', title: 'Same title as the textbook chapter', intro: 'One or two plain sentences on what this practice covers.' }),
    B.worksheet({ title: 'Skills', sub: '...' }),            Set A, about 2 pages: the skills of the chapter one at a time, short problems
    B.prob({ q, a, lines, canvas, fig }) ...
    B.worksheet({ title: 'Shop problems', sub: '...' }),     Set B, about 2 pages: word problems in fabrication, pipe trades and millwright settings, metric and imperial
    B.prob(...) ...
    B.worksheet({ title: 'Shape Canvas', sub: '...' }),      Set C, about 2 pages: drawings on the canvas ground with hidden ? sizes, break it down, unfold it, callouts, change one value
    B.prob(...) ...

In the Exercise Book the engine labels each set "Exercise NNA", "NNB", "NNC". Use B.grid2(probA, probB) to put two short problems side by side with lines: 2 to save space. Use lines: 2 for short skill problems and 3 to 5 for shop problems.

## Rules
- Every problem must be new. Do not copy textbook Try it, example or worksheet problems. Use different numbers and situations.
- Cover every section of the textbook chapter, easy to harder.
- Answers: computed in JavaScript from the same values as the question (a: L.num(x, 2) + ' mm'). Give short working in work: '...' for multi-step problems, it will print in the Answer Key. State the rounding in the question.
- Use B.check(seq, expect) for any answer that needs a calculator, so the numbers are verified on the TI-30Xa and Sharp emulators. It prints nothing.
- Drawings: reuse your chapter's helpers (require your engine/figs-chNN.js or copy helpers from your chapter file into the exercise file). Labels must print at 7 pt or more.
- Glossary: do not define terms (no definitions in B.term). The textbook owns the glossary.
- Real-world claims follow BOOK-BRIEF rule 1: write them as problem data.

## Build and check
cd $BK && node build.js --book exercise --only NN --png   (0 overflow, 0 errors), then node lint.js out/exercise-chNN.html (lint clean), then look at every page image (out/exercise-chNN-png) and fix layout. About 6 pages per chapter (5 to 7 is fine).

## Report back
Files, pages per chapter, problems per chapter, B.check count, lint result, overflow count, anything you left out.
