# ACCESS Trades Numeracy Textbook: author brief

Book folder: /tmp/claude-0/-home-claude/5f677e4b-ee1b-5d37-90f5-16af2f24aca2/scratchpad/book (call it $BK)
Scratch root: /tmp/claude-0/-home-claude/5f677e4b-ee1b-5d37-90f5-16af2f24aca2/scratchpad (call it $S)

## The request, verbatim
"we're going to be building a textbook in pdf format. we will focus on whole numbers, fractions and decimals, calculator pushes for the sharp and ti calculators, trig, area, volume, and all the mathematics basics, including transposing simple formulas. we'll start each chapter with intro, prose, examples, and work sheets that use concepts from the shape canvas. after that, we'll build an exercise book and a complementary answer key book."
Follow-up: about 200 pages with lots of visuals and examples, US Letter print-ready, metric and imperial units.

## Who reads it
Adult pre-apprentices at ACCESS Trades (an urban Indigenous trades-training organization in BC): fabrication, pipe trades and millwright. Many have been away from math for years. Plain, warm, direct language. Short sentences. Every new word is defined where it first appears. Numeracy for Skills for Success.

## Hard rules (the instructor calls breaking these a critical failure)
1. Never fabricate or assume. Every number, formula, key press and fact must be correct and verifiable. Math is verified by the engine (see below). A real-world claim (a standard size, a code rule, how a tool or calculator behaves) is allowed only if you checked it in a source you actually read in this workspace or on the web, and you list it in your report with the source. When in doubt, write it as problem data ("A bar is 6,000 mm long") instead of a claim about the world ("Bars come in 6 m lengths").
2. No draft, placeholder, TODO, "coming soon" or filler wording. No meta talk about the book being written.
3. Tolerances and plus/minus working ranges may be taught (decision of Oct 16 2026). Do not carry decimal inches to four places in working (convert to sixteenths instead). Micrometers read to 0.001 in and 0.01 mm, calipers to 0.001 in and 0.02 mm, rules to 1/64 in and 0.5 mm.
4. Distance around a circle is pi × D (diameter). Area of a circle uses the radius (pi × r²). Never write 2pi r.
5. BEDMAS for order of operations.
6. Metric and imperial both, metric first. mm, m, cm, L, kg alongside in, ft, ft-in, US gal where the trades use them.
7. Writing style: no semicolons and no em dashes in reading text (the lint fails on them, and a tool hook rejects them when you write files, even inside code comments). Use periods and commas. Whole numbers of 4 or more digits get thousands commas (1,250). Use the Unicode symbols × ÷ − (minus U+2212) π ² ³ √ ° in text.
8. Do not edit anything in $BK/engine, $BK/styles, $BK/build.js, $BK/lint.js or other authors' chapters. Those are shared. If you need a drawing helper, write it inside your chapter file, or in a new file $BK/engine/figs-chNN.js (NN = your chapter). If you find an engine bug, work around it in your file and report it.

## How a chapter is written
Read $BK/chapters/ch01-whole-numbers.js first. It is the model chapter. Copy its structure and level of detail.

A chapter is a file $BK/chapters/chNN-short-name.js exporting function (B, L) that returns L.join([...]) of a FLAT list, evaluated in order:

    B.chapter({ num, id, title, intro: B.p(...), objectives: [...], words: [...], art: svg }),
    B.section('Title'), B.p('...', '...'), B.example({...}), B.calc({...}), B.figure(svg, caption), B.table(head, rows, {caption, align}),
    B.tip(title, text), B.watch(title, text), B.shop(title, text), B.keyidea(title, text), B.formula(title, [rows], key),
    B.tryIt([{q, a}]),      quick practice at the end of a section (answers go to the Answer Key book)
    B.worksheet({ title, sub, intro }), B.prob({ q, a, canvas, fig, lines }) ...   Shape Canvas worksheet pages
    B.check(seq, expect)    verify a number stated in the text that came from a calculation, with no box shown

Helpers (engine/lib.js): L.num(x, dp) formats with commas and a true minus. L.round(x, dp). L.fr(n, d) stacked fraction, L.mx(w, n, d) mixed number, L.frac(n, d) lowest terms, L.inch(x, den) inches to nearest 1/den with the inch mark, L.ftin(totalInches, den) feet and inches, B.term(word, definition, shown) highlights a key word and adds it to the glossary (define each term ONCE, in the chapter that owns it, see the list below, and call B.term(word) with no definition elsewhere).

Drawings:
- B.shape(id, params, opts) and B.net(id, params, opts) draw with the hub Shapes engine (the same engine as the Shape Canvas app). Shapes.list() in $S/canvas/src/vendor/shapes-engine.js gives ids and parameters (rectangle l w, right-triangle b h, circle r, cylinder r h, cone r h, rectangular-prism l w h, and many more). opts: units 'mm'|'cm'|'m'|'in'|'ft', labels 'values'|'letters'|'both'|'none', width '2.6in', hide: ['w'] replaces those dimension labels with the red ? chip (Shape Canvas practice), angles: true for triangles. B.shapeCalc(id, params, units) returns the engine's worked calculation lines.
- engine/figs.js: svg, line, poly, rect, circle, t (text), label, dim (dimension line, o.ask for a ? chip), rightMark, arc (angle arc with label), callout (Shape Canvas callout), numberLine, inchRuler, mmRuler, fracBar, fracCircle, cutBar. Read the file. All drawings use the ACCESS palette in figs.js C. Note the dim() offset sign: positive offset is to the left of the direction from the first point to the second (in SVG coordinates, y down). Check every dimension sits outside the shape.
- Drawings must be correct: angles drawn at the stated angle, lengths roughly to scale, labels that match the numbers in the text.

## Calculator boxes (the core of "calculator pushes")
B.calc({ seq, expect, title, say }) or B.calc({ rows: [{label, seq, expect}], say }) shows the TI-30Xa keys and the Sharp EL-531XT keys side by side, each with the display its emulator shows. The keys are written ONCE as a canonical TI-30Xa sequence and translated to the Sharp by the hub translator ($S/calc2/CALC-MODELS.md lists the vocabulary and every translation rule with manual pages). Read that file before writing sequences.
- Canonical vocabulary: numbers, + − × ÷ = ( ), x² x³ √x ³√x 1/x yˣ ˣ√y π, LOG LN 10ˣ eˣ, SIN COS TAN SIN⁻¹ COS⁻¹ TAN⁻¹, +⇄− (change sign, after the digits), ab/c (fraction key, e.g. "3 ab/c 1 ab/c 4" is 3 1/4), F⇄D, d/c, %, STO 1, RCL 1, x⇄y, R▸P, P▸R, DMS▸DD, DD▸DMS. Functions go AFTER their number on the TI-30Xa: "25 √x", "35 SIN". Use the minus sign − (U+2212) in sequences.
- expect is the plain number the text states (commas allowed). The build fails if the TI-30Xa value rounded to the places you wrote differs, if either calculator shows Error, or if the Sharp translation does not give the same value. So the numbers in your text are guaranteed to match the keys.
- Displays differ between models. The Sharp marks thousands with a small raised mark (4’245.), shows fractions as 5┌7┌8, and its % key ends the calculation. The TI-30Xa shows 4245. and 5⌟7⌟8. These come from the emulators, which were built from the manuals in $S/calc2/manuals (the Sharp Calculation Examples sheet $S/calc2/manuals/xt-2.png shows displays such as 1’700. and 4┌5┌6). Describe a display only as the box shows it.
- Every chapter after Chapter 2 should have calculator boxes in most examples that use a calculator (not for simple mental arithmetic).

## Shape Canvas worksheets
Each chapter ends with 2 or 3 worksheet pages (B.worksheet then B.prob items). They use concepts from the ACCESS Shape Canvas app:
- Practice mode: dimensions hidden as a red ? chip. Learners find the hidden value (hide option on B.shape, ask option on figs.dim).
- Break it down: a composite part split by dashed lines into basic shapes labelled A, B, C.
- Unfold it: a solid next to its net (B.net).
- Callouts: leader lines pointing at parts with a short note (figs.callout).
- Change one value and everything updates: "If the diameter doubles, what happens to ...".
- Working box: every problem has lined working space (lines option) with an Answer line.
- Triangles with angles shown (angles: true).
Pass the drawing as canvas: svg so it sits on the dotted canvas ground. Every B.prob has an answer a, computed in code wherever possible (a: L.num(x, 2) + ' mm'), and short working steps in work when useful.

## Answers
Every tryIt item and every prob needs a correct answer string a. Compute answers in JavaScript from the same numbers as the question, never type a result you worked out in your head. If the answer is a rounded decimal, say the rounding in the question ("to two decimal places", "to the nearest 1/16 in").

## Build and check (do all of these before you report)
1. cd $BK && node build.js --book textbook --only NN --png    (NN = your chapter number, e.g. 4)
   It prints pages, overflowing items and errors. Fix until 0 overflow and 0 errors.
2. node lint.js out/textbook-chNN.html   must say "lint clean".
3. Look at every page: out/textbook-chNN-png/ has page images. Use python3 $BK/sheet.py <png dir> <out.png> <start> <count> to make contact sheets and Read them. Fix crowding, orphaned headings, empty half pages caused by large unbreakable boxes, labels that collide or overlap shapes, drawings that do not match the text.
4. Page target is given per chapter below (within about 2 pages).

## Chapters and owners
Glossary terms listed are the ones that chapter defines with B.term(word, definition). Use B.term(word) without a definition for a term another chapter owns. Chapter 1 owns: whole number, digits, place value, rounding, estimate, sum, difference, factors, product, kerf, quotient, remainder, average.

- Ch 2 Your Calculator: TI-30Xa and Sharp EL-531XT (about 14 pages). Faceplate diagrams of both calculators drawn from the hub's popup layouts ($S/calc2/src/ui-popup.js, popup.css, and the photo /root/.claude/uploads/5f677e4b-ee1b-5d37-90f5-16af2f24aca2/ee6545c2-image.jpg for the Sharp) with key areas called out. Turning on and clearing, the 2nd and 2ndF keys, how each model takes keys (TI-30Xa: function after the number. Sharp D.A.L.: keys in the order the expression is written), negative numbers, brackets, squares and square roots, powers, pi, the fraction key, percent, memory (STO and RCL), DEG mode and the angle indicator, trig and inverse trig keys, checking a result. Source every behaviour in CALC-MODELS.md or the manuals. Owns: key sequence, second function, display, memory, D.A.L. Worksheet idea: write the key presses for both calculators for given expressions, read displays.
- Ch 3 Order of Operations (about 10 pages). BEDMAS, brackets, exponents, division and multiplication left to right, addition and subtraction left to right, the fraction bar as a grouping symbol, how both calculators follow BEDMAS, when brackets are needed on the calculator. Owns: order of operations, BEDMAS, brackets, exponent, square (of a number), square root.
- Ch 4 Fractions (about 18 pages). Reading fractions on an inch tape (1/2 to 1/16, and 1/32 and 1/64 on rules), equivalent fractions, lowest terms, improper and mixed, common denominators, add, subtract, multiply, divide, fractions of a length, the ab/c key on both calculators. Owns: fraction, numerator, denominator, proper fraction, improper fraction, mixed number, equivalent fractions, lowest terms, common denominator, reciprocal.
- Ch 5 Decimals (about 14 pages). Place value after the point, reading and rounding decimals, add, subtract, multiply, divide, fraction to decimal and back (decimal inch to the nearest 1/16), mm on metric drawings, money. Owns: decimal, decimal point, decimal place, decimal inch.
- Ch 6 Percent, Ratio and Proportion (about 14 pages). Percent, decimals and fractions, percent of a number, waste allowance, increase and decrease, ratio, rate, proportion, scale drawings. Owns: percent, ratio, rate, proportion, scale.
- Ch 7 Measurement and Unit Conversion (about 14 pages). SI units and prefixes, imperial units, ft-in, converting with exact factors (1 in = 25.4 mm exactly), area and volume units, litres and US and imperial gallons, temperature. Use only factors from $S/units (gen.js and the NIST SP 1038 text in $S/units/verify/sp1038.txt) and cite them. Owns: unit, metric system, SI, imperial system, conversion factor, prefix.
- Ch 8 Formulas and Transposing (about 14 pages). Reading a formula, variables and constants, substituting values, solving by inverse operations, transposing one-step and two-step formulas, formulas with squares and square roots (A = pi × r² solved for r), checking by substituting back. Owns: formula, variable, constant, substitute, transpose, inverse operation, subject of a formula.
- Ch 9 Perimeter and Circumference (about 12 pages). Perimeter of rectangles, triangles and polygons, circumference = pi × D, arcs, composite perimeters, stretch-out of a pipe or duct. Owns: perimeter, circumference, diameter, radius, pi, arc, stretch-out.
- Ch 10 Area (about 16 pages). Square units, rectangle, triangle, parallelogram, trapezoid, circle (pi × r²), ring (annulus), composite shapes by breaking down, surface area from nets. Owns: area, square unit, base, height, composite shape, surface area, net.
- Ch 11 Volume and Capacity (about 16 pages). Cubic units, prisms, cylinders (pipe and tank), cones, pyramids, spheres, capacity in L and US gal (factors from the Ch 7 sources), volume of a pipe. Owns: volume, capacity, prism, cylinder, cone, pyramid, sphere, cubic unit.
- Ch 12 Angles and Right Triangles (about 12 pages). Degrees, types of angles, angles in a triangle add to 180°, right triangles, the Pythagorean theorem, the 3-4-5 check for square, diagonals. Owns: angle, degree, right angle, acute angle, obtuse angle, hypotenuse, leg, Pythagorean theorem.
- Ch 13 Trigonometry (about 16 pages). Naming sides from an angle, sine, cosine, tangent, finding a side, finding an angle with inverse keys, DEG mode, shop uses: slopes and ramps, pipe offsets (set, run, travel), bevel and mitre angles. Owns: trigonometry, sine, cosine, tangent, opposite side, adjacent side, inverse trig function, offset.

## Report back
Files you created (absolute paths), page count, number of calculator sequences checked, number of answers, lint result, overflow count, every real-world claim you made with its source, anything you could not verify and left out, and any engine problem you worked around.
