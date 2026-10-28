# Lecture quiz generator

The browser entry point is `carpentry/intake-142/Quizzes/generator.html`. It shares the existing 1,200 reviewed questions across 50 lectures with the quiz game through `quiz-data.js`. The original game and lecture PDFs remain available.

- `generator-engine.js` combines reviewed questions and original numerical templates, explicitly mapped to each lecture. It samples without repeated prompts, shuffles choice order, and emits 10–25 questions. The 12-skill readiness lecture includes all skills when the count is at least 12; a smaller count samples that many skills.
- `generator-app.js` provides the lecture dropdown, count, version rebuilding, learner/key preview, and separate downloads. Changing a lecture or count generates a new version. Version-changing controls are disabled while exporting a PDF.
- `generator-pdf.js` lazily loads local libraries and embedded resources. It creates letter-size PDFs using the existing quiz format: numbered questions, category, images, textbook references, answer and working fields, name/date, and page numbers. The separate key repeats the questions with the exact shuffled letters, answers and explanations. Learner fields start blank.
- `vendor/` records pinned PDF dependencies and their licenses. `pdf-resources.js` embeds fonts, the official IS4S badge and the existing Shape Canvas/Numeracy Hub illustrations, so exports require no network service.

Every version code includes generator version, lecture ID, question count and unsigned 32-bit seed, for example `LQ1-W01L01-15-ABC123`. `LectureQuiz.decode(code)` and `LectureQuiz.build(data, options)` reproduce the complete question/choice order and key. Preserve `LQ1` behavior after publication; changing the bank, templates, selection algorithm or RNG requires a new version with the old generator retained if existing codes must stay rebuildable.

## Validation

Run from the repository root:

```sh
node source/quiz-generator/test-generator.cjs
```

This validates every lecture at 10, 11, 12, 15 and 25 questions with five seeds; uniqueness, deterministic rebuilding, choice-key alignment, readiness coverage, asset existence, numeric display accuracy, and invalid input rejection. Additional independent regressions recompute whole-sheet rounding from integer percentages and money totals from integer cents, covering floating-point boundary cases.

To rebuild the bundled images and fonts after an intentional asset change:

```sh
python source/quiz-generator/build-pdf-resources.py
```

The resource script needs DejaVu Sans regular and bold, either in the system font directory or supplied with `--font-directory`.
