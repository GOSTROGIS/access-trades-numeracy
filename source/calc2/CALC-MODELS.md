# Calculator models: TI-30Xa, Sharp EL-531XT, HP-15C

Worked solutions in the hub, the new tabs and the Shape Canvas app are written once, as canonical TI-30Xa key
sequences (the seq strings pages already send in `{ti30:'play'}`). CalcKit translates each one for the selected
model. Nobody writes Sharp or HP sequences by hand.

## Files

| File | What it is |
|---|---|
| `calc2/ti30.js` | TI-30Xa emulator (the hub's own engine, unchanged) |
| `calc2/src/core-sharp.js` | Sharp EL-531XT emulator, `window.SharpEL` |
| `calc2/src/core-hp.js` | HP-15C emulator, `window.HP15C` |
| `calc2/src/core-translate.js` | Translator, `window.CalcTranslate`: TI-30Xa seq → expression tree → model keys |
| `calc2/src/calc-kit-core.js` | `window.CalcKit`: models, selected model, chips, screens, key blocks |
| `calc2/src/ui-popup.js` | The calculator popup for all three models (built on the TI-30Xa popup, API `window.TICalc` unchanged) |
| `calc2/src/frame-layer.js` | Carries the model into each hub frame (and the shell): `TI30.tokens`, `TIKeys`, `.tikeys` blocks |
| `calc2/src/shell-glue.js` | Hub shell: frames, `{calcModel}` messages, help texts |
| `calc2/src/popup.css` | Model menu and the Sharp and HP faceplates |
| `calc2/src/exam-patch.txt` | Exam builder changes (chips, notes, headings, intro, export chip colours) |
| `calc2/build-hub.py` | Builds `hub/hub-v10.html` from `hub/hub-v9.html` |
| `calc2/build-kit.py` | Builds `calc2/calc-kit.js`, the standalone kit |
| `calc2/calc-kit.js`, `calc2/demo.html` | Standalone kit for the Shape Canvas app, and its demo |
| `calc2/work/*.js` | Manual cases, translator checks, fuzz test, page seq collector |
| `hub/test-models.js` | Hub tests for the models |

## Sources

* Sharp EL-531XT Operation Manual with Calculation Examples, `EL531XT_OM_En.pdf`, sharp.ca. Sheet 1 is the
  operation manual. Sheets 2 and 3 are the Calculation Examples, numbered [1] to [16]. Cited below as "XT manual"
  and "XT Examples [n]".
* Sharp EL-531TH Series Operation Guide, `OperationGuide_EL531TH.pdf` (SEP. 2017), global.sharp. Same key layout
  and keys as the EL-531XT. Cited as "TH guide p. n" (printed page numbers).
* HP-15C Owner's Handbook, `hp15c-oh-en.pdf` (edition 2.4), and the HP 15c Collector's Edition Owner's Handbook,
  `hp15c-ce-oh-en.pdf` (edition 3, February 2023). Printed page numbers are the same in both and are cited as
  "HP p. n". In the CE PDF the PDF page is the printed page plus 12.

## The canonical vocabulary

Every TI-30Xa key the translator reads. Each is checked against the TI-30Xa emulator (see Tests).

Numbers (with `.`, `+⇄−`, `EE`, `a b/c` fractions), `+ − × ÷ =`, `( )`, `x² x³ √x ³√x 1/x yˣ ˣ√y`, `π`,
`LOG LN 10ˣ eˣ`, `SIN COS TAN SIN⁻¹ COS⁻¹ TAN⁻¹`, `HYP` with the trig keys, `x!`, `nCr`, `nPr`, `%`, `DRG`,
`DRG▸`, `DMS▸DD`, `DD▸DMS`, `F⇄D`, `d/c`, `STO n`, `RCL n`, `SUM n` (n = 1 to 3), `x⇄y`, `ON/C`, `←`.

Coordinate conversion is part of the vocabulary, the way the TI-30Xa keys it:

* Rectangular to polar: `x x⇄y y R▸P` shows r, then `x⇄y` shows θ.
* Polar to rectangular: `r x⇄y θ P▸R` shows x, then `x⇄y` shows y.

Rows joined by ` ON/C ON/C ` are translated one by one and joined with the model's own two-key clear, so a joined
sequence still lines up row by row with the chips.

## How the translator works

1. `readTI(seq)` reads the keys the way the TI-30Xa does (pending operations, brackets, `=`, memories, `ON/C`,
   `x⇄y` with the t register, coordinate conversion), but it builds an expression tree instead of numbers.
2. The tree is written for the model: D.A.L. order for the Sharp, RPN for the HP.
3. `CalcKit.steps` turns the model keys into presses, each tagged with the chip it belongs to, so the glow, the
   jog and the "Key 3 of 11" count work the same on every model.

## Translation rules: Sharp EL-531XT (D.A.L.)

D.A.L.: keys go in the order the expression is written, and `=` (or another calculation-ending key) works the
line out with the priority levels (XT manual, Priority Levels in Calculation). The translator puts brackets
round anything that would bind less tightly than its place needs, and round the argument of a function written
before its argument unless the argument is a plain number, π or a memory.

| TI-30Xa | Sharp EL-531XT | Source |
|---|---|---|
| `a + b =`, `− × ÷`, `( )` | the same keys in written order, `=` | TH guide p. 11, XT manual Priority Levels |
| `x x²`, `x x³`, `x 1/x` | `x x²`, `x x³`, `x 2ndF x⁻¹` (keys after their argument) | TH guide p. 13, Priority level 2 |
| `x √x`, `x ³√x` | `√ x`, `2ndF ³√ x` (key before the argument) | TH guide p. 13 |
| `y yˣ x` | `y yˣ x` | TH guide p. 13 |
| `y ˣ√y x` | `x 2ndF ˣ√ y` | TH guide p. 13 |
| `x SIN`, `x SIN⁻¹` … | `sin x`, `2ndF sin⁻¹ x` … | TH guide pp. 22-23 |
| `HYP SIN` … | `hyp sin x`, `2ndF arc hyp sin x` | TH guide p. 24 |
| `x LOG`, `x LN`, `x 10ˣ`, `x eˣ` | `log x`, `ln x`, `2ndF 10ˣ x`, `2ndF eˣ x` | TH guide pp. 14-15 |
| `π` | `π` | TH guide p. 8 |
| `x +⇄−` while keying | `+/−` before the number | TH guide p. 8 (NEG) |
| `m EE e` | `m Exp e` | TH guide p. 5, p. 8 |
| `n x!`, `n nCr r`, `n nPr r` | `n 2ndF n!`, `n 2ndF nCr r`, `n 2ndF nPr r` | TH guide pp. 16-17 |
| `a + b % =` and `a − b % =` | `a + b 2ndF %`, `a − b 2ndF %` | XT Examples [4], TH guide p. 12 |
| `a × b % =`, `a ÷ b % =` | `a × b 2ndF %`, `a ÷ b 2ndF %` | XT Examples [4] |
| `%` in any other shape | `× b ÷ 100` written out (the % key ends the calculation) | XT Examples [4] |
| `w ab/c n ab/c d`, `n ab/c d` | `w a b/c n a b/c d`, `n a b/c d` | XT Examples [8], TH guide p. 19 |
| `F⇄D` after a result | `a b/c` after the result | XT Examples [8], TH guide p. 19 |
| `d/c` | `2ndF d/c` | TH guide p. 19 |
| `d.mmss DMS▸DD` (a keyed angle) | `d D°M′S m D°M′S s` | XT Examples [10], TH guide p. 18 |
| `DD▸DMS` | `2ndF ↔DEG` after the result | XT Examples [10], TH guide p. 18 |
| `DRG` | `DRG` (DEG, RAD, GRAD in the same order) | TH guide p. 6 |
| `DRG▸` | `2ndF DRG▸` | XT Examples [5] |
| `STO 1`, `STO 2`, `STO 3` | `STO A`, `STO B`, `STO C` (ALPHA letters on yˣ, √, x²) | TH guide pp. 3, 20 |
| `RCL n` | `RCL A` / `B` / `C` | TH guide p. 20 |
| `SUM n` | the sum worked out, then `STO` | TH guide p. 20 |
| `x x⇄y y R▸P` | `x 2ndF , y 2ndF →rθ` (shows r) | TH guide p. 25 |
| `r x⇄y θ P▸R` | `r 2ndF , θ 2ndF →xy` (shows x) | TH guide p. 25 |
| `x⇄y` after a conversion | `2ndF ←,→` (shows θ or y) | TH guide p. 25 |
| a conversion input that is worked out | worked out first, `STO D` or `STO E`, `ON/C`, then `RCL D` | TH guide pp. 20, 25 |
| a conversion result used in a larger line | the conversion first, then `RCL X` (r or x) or `RCL Y` (θ or y) | XT manual, Coordinate Conversion (results go to X and Y) |
| start, and between rows | `ON/C ON/C` | TH guide p. 7 |

Display: NORM1, 10 digits, plain from 0.000000001 to 9999999999 (TH guide p. 4), internal mantissa up to 14
digits (XT manual, Modify Function). The entry stops at the 10 digit cells of the display.

## Translation rules: HP-15C (RPN)

Numbers are keyed with `ENTER` between them, then the operation (HP pp. 22-23, 37). The translator keys
operands left to right, the way the expression is written, whenever that fits the four stack levels
(HP pp. 32, 37-38). When it would not, it keys the deeper operand first and uses `x≷y`, and when even that would
overflow it parks a value in a storage register R4 to R9 (`STO n`, later `RCL n`, HP pp. 42-45). TI-30Xa
memories 1 to 3 are R1 to R3.

| TI-30Xa | HP-15C | Source |
|---|---|---|
| `a + b =` and `− × ÷` | `a ENTER b +` (and so on) | HP pp. 22-23 |
| nested brackets | inner results first, the stack holds the pending values | HP pp. 37-38 |
| `x x²`, `x √x`, `x 1/x` | `x g x²`, `x √x`, `x 1/x` | HP p. 25 |
| `y yˣ x` | `y ENTER x yˣ` | HP p. 29 |
| `y ˣ√y x` | `y ENTER x 1/x yˣ` | HP pp. 25, 29 |
| `x SIN`, `x SIN⁻¹` … | `x SIN`, `x g SIN⁻¹` … | HP p. 26 |
| `HYP SIN`, inverse | `f HYP SIN`, `g HYP⁻¹ SIN` | HP p. 28 |
| `x LOG`, `x LN`, `10ˣ`, `eˣ` | `x g LOG`, `x g LN`, `10ˣ`, `eˣ` | HP p. 28 |
| `π` | `g π` (10 digits, 3.141592654) | HP p. 24 |
| `+⇄−` | `CHS` (after the digits, or on a result) | HP p. 19 |
| `m EE e` | `m EEX e` | HP pp. 19-20 |
| `n x!` | `n f x!` | HP p. 25 |
| `n nCr r`, `n nPr r` | `n ENTER r g Cy,x`, `n ENTER r f Py,x` | HP p. 47 |
| `a + b % =`, `a − b % =` | `a ENTER b g % +` (% keeps a in Y) | HP p. 29 |
| `%` in other shapes | `b 100 ÷` | HP p. 29 |
| `DMS▸DD` | `g →H` | HP pp. 26-27 |
| `DD▸DMS` | `f →H.MS` (shows degrees.minutes seconds) | HP pp. 26-27 |
| `DRG` | `g DEG`, `g RAD`, `g GRD` | HP p. 26 |
| `DRG▸` DEG to RAD | `f →RAD`, then `g RAD` (the TI-30Xa switches to RAD as well) | HP pp. 26-27 |
| `x x⇄y y R▸P` | `y ENTER x g →P` (shows r, θ in Y) | HP p. 30 |
| `r x⇄y θ P▸R` | `θ ENTER r f →R` (shows x, y in Y) | HP p. 31 |
| `x⇄y` after a conversion | `x≷y` | HP pp. 30-31, 33 |
| a conversion result used in a larger calculation | its partner in Y is dropped with `x≷y R↓` (or `R↓`) | HP p. 33 |
| `STO n`, `RCL n` | `STO n`, `RCL n` | HP p. 42 |
| an odd root of a negative number | `CHS` first, root, `CHS` again (yˣ needs y ≥ 0 when x is not whole) | HP p. 29 |
| start | `g CLx` | HP p. 21 |
| between rows | `g CLx g CLx` | HP pp. 21, 36 |

Stack rules the emulator follows: `ENTER` lifts the stack, copies X into Y and disables stack lift. `CLx`, `Σ+`
and `Σ−` also disable it. Most other keys enable it. Once a number is keyed, digit entry leaves the lift enabled,
and `CHS`, `EEX` and `←` are neutral while a number is being keyed (HP pp. 32-36, 209-211). Display: FIX 4 at
power-up (HP p. 58), every result rounded to 10 significant digits (HP p. 60), commas between thousands
(HP p. 61). `%` and `Δ%` keep Y (HP pp. 29-30).

## Features with no equivalent

When a TI-30Xa key has no counterpart on a model, the chip row says so in a note ("Not on this model: …") and
uses keys the model does have. The translator never invents a key.

### Sharp EL-531XT

* `EXC n` (exchange with memory): not translated. The sequence would keep its TI-30Xa keys with a note. No page
  or bank uses it.
* `K` (constant), `FIX`, `SCI`, `ENG`, `FLO` and the statistics keys (`Σ+`, `FRQ`, `x̄`, `σ`): not translated
  (same handling). No page or bank uses them.
* A sequence that changes the angle unit in the middle of one expression is not translated (same handling).

### HP-15C

* No `a b/c` key and no fraction display: fractions are keyed as divisions (note: "Not on this model: no a b/c
  key. The fraction is keyed as a division."), and `F⇄D` or `d/c` give a decimal answer (note).
* No `x³` key: `3 yˣ` (note). No `³√x` key: `3 1/x yˣ` (note), with `CHS` before and after for a negative number.
* No radians-to-grads and no grads-to-degrees conversion key: `→DEG` then `× 10 ÷ 9`, or `× 0.9` (notes).
* No D°M′S display: `→H.MS` shows degrees.minutes seconds as a decimal (note: 99.0500 means 99°05′00″).
* `EXC`, `K`, `FIX`/`SCI`/`ENG` from TI-30Xa sequences and the TI-30Xa statistics keys: not translated (same as
  the Sharp). No page or bank uses them.

## Known differences between the models

* The HP-15C keeps 10 digits (HP p. 60), the TI-30Xa 13 and the Sharp 14. In a long chain with cancellation the
  HP's last digits can differ from the TI-30Xa while the FIX 4 display shows the same digits. The tests count
  these as "display" agreement.
* `→H.MS` works on the 10-digit value. When the decimal degrees came from `→H` of a minutes value (for example
  180 − 80°55′), the HP can show 60 seconds carried in the last digit: 99.0460 is 99°04′60″, the same angle as
  the TI-30Xa's 99°05′00″. The tests count these as "hms" agreement and check the angle.
* Trig of a very large angle (more than about 10⁵ degrees) depends on every digit kept, so the three models give
  different answers. No page or bank does this. The fuzz test shows it.

## Tests

* `node calc2/work/sharp-manual.js`: 55 manual cases (XT Examples and TH guide), all pass.
* `node calc2/work/hp-manual.js`: 49 handbook cases (displays and stack contents), all pass.
* `node calc2/work/xlate-test.js` (exam banks) and `node calc2/work/xlate-test.js page-seqs-list.json` (pages):
  every seq agrees on both models.
* `node calc2/work/fuzz.js 20000 <seed>`: random seqs over the whole vocabulary.
* `node hub/test-models.js`: the hub tests (translation of at least 20,000 page and bank seqs, every tab and the
  exam export after a model switch, runs, jog, hide operations, persistence, screenshots, contrast).
* `node calc2/work/test-kit.js`: the standalone kit and demo.

## Rebuilding

    python3 calc2/build-hub.py [hub/hub-v9.html] [hub/hub-v10.html]
    python3 calc2/build-kit.py
    bash calc2/build-v11.sh    (hub-v10 + Coordinate Systems and Measuring Tools tabs and banks + calc2/patch-v11.py)

`build-hub.py` takes any hub that still has the TI-30Xa-only popup block, so it can be run again on a hub that
has new tabs. New tabs need nothing of their own: the layer reaches every `.hub-frame` and every `.tikeys` block.
