/* CalcKit standalone build (calc2/calc-kit.js). Dependency-free: no other file or library is needed.
   Three calculators: the TI-30Xa (default), the Sharp EL-531XT (D.A.L.) and the HP-15C (RPN).
   Worked solutions are written as canonical TI-30Xa key sequences, for example "2 x 3.5 x² =" written with the
   calculator's own key labels: 2 × 3.5 x² =. CalcKit translates them for the selected model.
     CalcKit.models()               [{id, name, logic}]
     CalcKit.getModel(), setModel(id)   saved per viewer in localStorage 'access-calc-model'
     CalcKit.onChange(fn)           fn(id) after every model change
     CalcKit.keysFor(seq, id)       [{label, key, shift}] one entry per chip group
     CalcKit.notesFor(seq, id)      "not on this model" notes for the sequence
     CalcKit.renderChips(el, seq)   key chips for the selected model, drawn again when the model changes
     CalcKit.blockHtml(list, opts)  a full key block (title, start line, chips, screen, Run button) like the hub's
     CalcKit.screen(seq, id)        the calculator's display after the keys {main, exp}
     CalcKit.mount(opts)            the floating Calculator button and the popup, model menu at the top right
     CalcKit.play(seq, {id, onStep(i, chip), onDone, onStop})   plays the keys on the selected model
     CalcKit.installLayer(win)      keeps a document's .tikeys blocks and TI30.tokens in step with the model
   Run buttons: any element with class tikeys-run and data-seq plays its sequence when clicked. */
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  var CSS = ".sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }\n/* ---------- TI-30Xa key chips and sequence blocks ---------- */\n.tk { display: inline-flex; align-items: center; justify-content: center; min-width: 30px; height: 28px; padding: 0 7px; margin: 2px 3px 2px 0;\n  font: 600 13px/1 var(--font-body, system-ui, sans-serif); border-radius: 6px; border: 1px solid rgb(30, 32, 34);\n  box-shadow: 0 2px 0 rgb(20, 22, 24); vertical-align: middle; white-space: nowrap; }\n.tk-num { background: rgb(28, 30, 33); color: rgb(255, 255, 255); font-family: var(--font-mono, ui-monospace, monospace); }\n.tk-fn { background: rgb(226, 228, 230); color: rgb(20, 22, 24); }\n.tk-op { background: rgb(84, 89, 95); color: rgb(255, 255, 255); }\n.tk-2nd { background: rgb(118, 186, 40); color: rgb(20, 22, 24); border-color: rgb(70, 120, 20); }\n.tk-sec { box-shadow: 0 2px 0 rgb(70, 120, 20); border-color: rgb(70, 120, 20); }\n.tk.is-now { outline: 3px solid var(--gold, rgb(255, 188, 0)); outline-offset: 1px; }\n.tk-lcd { display: inline-block; padding: 3px 10px; border-radius: 5px; background: rgb(196, 206, 186); color: rgb(24, 28, 22);\n  font: 600 16px/1.3 var(--font-mono, ui-monospace, monospace); letter-spacing: 0.02em; }\n.tk-lcd sup { font-size: 11px; margin-left: 4px; }\n.tikeys { margin-top: 16px; padding: 14px 16px; border: 1px solid var(--line, rgb(217, 210, 202)); border-left: 4px solid rgb(118, 186, 40);\n  border-radius: var(--radius, 6px); background: var(--surface, rgb(255, 255, 255)); }\n.tikeys-h { display: flex; flex-wrap: wrap; gap: 4px 12px; align-items: baseline; margin: 0 0 8px; }\n.tikeys-title { font-family: var(--font-display, sans-serif); font-weight: 700; font-size: 15px; color: var(--ink, rgb(26, 21, 18)); }\n.tikeys-sub { font-size: 13px; color: var(--muted, rgb(90, 90, 90)); }\n.tikeys-sub .tk { height: 22px; min-width: 0; font-size: 11px; padding: 0 5px; }\n.tikeys-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }\n.tikeys-row { display: grid; gap: 6px; padding-top: 10px; border-top: 1px dashed var(--line, rgb(217, 210, 202)); }\n.tikeys-row:first-child { border-top: 0; padding-top: 0; }\n.tikeys-lab { font-size: 13px; font-weight: 600; color: var(--slate, rgb(60, 64, 70)); }\n.tikeys-seq { line-height: 1.9; }\n.tikeys-out { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 10px; }\n.tikeys-scr { font-size: 12px; color: var(--muted, rgb(90, 90, 90)); text-transform: uppercase; letter-spacing: 0.06em; }\n.tikeys-run { font: 600 14px/1 var(--font-body, sans-serif); min-height: 36px; padding: 8px 12px; border-radius: var(--radius, 6px);\n  border: 1.5px solid var(--line-strong, rgb(150, 140, 130)); background: var(--surface-2, rgb(248, 246, 243)); color: var(--ink, rgb(26, 21, 18)); cursor: pointer; }\n.tikeys-run:hover { border-color: rgb(118, 186, 40); }\n.tikeys-run:focus-visible { outline: 3px solid var(--focus, rgb(0, 95, 204)); outline-offset: 2px; }\n.twist { color: var(--red, rgb(210, 24, 31)); }\n.fig-hidden-note { margin: 0; padding: 12px 14px; font-size: 14px; color: var(--muted, rgb(90, 90, 90)); border: 1px dashed var(--line-strong, rgb(150, 140, 130)); border-radius: var(--radius, 6px); }\n\n\n/* ---------- calculator ---------- */\n.ti-pop { position: fixed; right: 20px; bottom: 84px; z-index: 60; width: 330px; max-height: calc(100vh - 100px); max-height: calc(100dvh - 100px); overflow: auto;\n  background: rgb(62, 66, 70); color: rgb(240, 240, 240); border-radius: 18px; box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45); border: 1px solid rgb(30, 32, 34); }\n.ti-pop[hidden] { display: none; }\n.ti-bar { display: flex; align-items: center; gap: 8px; padding: 8px 8px 8px 14px; cursor: grab; background: rgb(40, 43, 46); border-radius: 18px 18px 0 0; touch-action: none; user-select: none; }\n.ti-grip { width: 18px; height: 10px; background: repeating-linear-gradient(0deg, rgb(130, 130, 130) 0 2px, transparent 2px 4px); }\n.ti-title { flex: 1; font: 600 14px/1 var(--font-body, sans-serif); }\n.ti-ic { width: 36px; height: 36px; display: grid; place-items: center; border: 0; border-radius: 8px; background: transparent; color: rgb(240, 240, 240); cursor: pointer; }\n.ti-ic svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }\n.ti-ic:hover { background: rgb(70, 74, 78); }\n.ti-ic:focus-visible, .ti-k:focus-visible, .ti-stop:focus-visible { outline: 3px solid rgb(255, 188, 0); outline-offset: 2px; }\n.ti-body { padding: 12px 14px 14px; }\n.ti-lcd { background: rgb(190, 201, 180); color: rgb(22, 26, 20); border-radius: 8px; padding: 6px 10px 8px; border: 3px solid rgb(28, 30, 32); }\n.ti-ind { display: flex; flex-wrap: wrap; gap: 2px 7px; min-height: 14px; font: 600 9.5px/1.3 var(--font-body, sans-serif); letter-spacing: 0.04em; }\n.ti-ind span { opacity: 0.12; }\n.ti-ind span.on { opacity: 1; }\n.ti-num { display: flex; justify-content: flex-end; align-items: flex-start; gap: 6px; min-height: 42px; font: 600 34px/1.15 var(--font-mono, ui-monospace, monospace); font-variant-numeric: tabular-nums; }\n.ti-exp { font-size: 17px; line-height: 1.2; min-width: 1.6em; text-align: right; }\n.ti-play { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px; font-size: 13px; color: rgb(255, 214, 102); }\n.ti-play[hidden] { display: none; }\n.ti-stop { font: 600 13px/1 var(--font-body, sans-serif); padding: 6px 10px; border-radius: 6px; border: 1px solid rgb(150, 150, 150); background: rgb(40, 43, 46); color: rgb(240, 240, 240); cursor: pointer; }\n.ti-tape { min-height: 30px; margin-top: 6px; line-height: 1.7; }\n.ti-tape .tk { height: 22px; min-width: 22px; font-size: 11px; padding: 0 5px; }\n.ti-brand { display: flex; align-items: flex-end; justify-content: space-between; margin: 8px 0 2px; }\n.ti-model { font: 700 13px/1 var(--font-display, sans-serif); color: rgb(200, 226, 150); letter-spacing: 0.04em; padding-bottom: 8px; }\n.ti-top, .ti-left { display: grid; gap: 4px 6px; }\n.ti-top { grid-template-columns: repeat(5, 1fr); margin-bottom: 4px; }\n.ti-lower { display: grid; grid-template-columns: 4fr 1fr; gap: 6px; }\n.ti-left { grid-template-columns: repeat(4, 1fr); }\n.ti-right { display: flex; flex-direction: column; justify-content: space-between; padding-top: 14px; }\n.ti-cell { display: grid; gap: 1px; justify-items: stretch; }\n.ti-oncell { width: 62px; }\n.k2 { min-height: 13px; font: 600 9.5px/1.3 var(--font-body, sans-serif); color: rgb(200, 226, 150); text-align: center; white-space: nowrap; overflow: hidden; }\n.ti-k { min-height: 34px; padding: 0 2px; border-radius: 8px; cursor: pointer; font: 600 14px/1 var(--font-body, sans-serif);\n  border: 1px solid rgb(20, 22, 24); box-shadow: 0 3px 0 rgb(20, 22, 24); transition: transform 0.05s, box-shadow 0.05s; touch-action: manipulation; }\n.ti-k:active, .ti-k.is-hit { transform: translateY(2px); box-shadow: 0 1px 0 rgb(20, 22, 24); }\n.ti-k.is-hit { outline: 3px solid rgb(255, 188, 0); }\n.ti-k.k-num { background: rgb(26, 28, 30); color: rgb(255, 255, 255); font-size: 17px; }\n.ti-k.k-fn { background: rgb(222, 224, 226); color: rgb(20, 22, 24); }\n.ti-right .ti-k.k-fn { background: rgb(84, 89, 95); color: rgb(255, 255, 255); font-size: 18px; min-height: 42px; }\n.ti-eqcell .ti-k { min-height: 48px; }\n.ti-k.k-2nd { background: rgb(118, 186, 40); color: rgb(20, 22, 24); }\n.ti-k.k-on { background: rgb(222, 224, 226); color: rgb(20, 22, 24); border-radius: 14px; font-size: 12px; }\n.ti-help { margin: 10px 0 0; font-size: 12px; color: rgb(190, 190, 190); }\n/* phones: while keys play, show only the screen and key tape so the glowing drawing behind stays visible */\n@media (max-width: 640px) { .ti-pop.is-playing .ti-brand, .ti-pop.is-playing .ti-top, .ti-pop.is-playing .ti-lower, .ti-pop.is-playing .ti-help { display: none; } }\n.ti-fab { position: fixed; right: 20px; bottom: 20px; z-index: 59; display: inline-flex; align-items: center; gap: 8px; min-height: 48px; padding: 10px 16px;\n  border-radius: 999px; border: 2px solid rgb(28, 30, 32); background: rgb(118, 186, 40); color: rgb(20, 22, 24); font: 700 15px/1 var(--font-body, sans-serif);\n  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3); cursor: pointer; }\n.ti-fab svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; }\n.ti-fab:focus-visible { outline: 3px solid var(--focus, rgb(0, 95, 204)); outline-offset: 3px; }\n.calc-only body > *:not(.ti-pop) { display: none !important; }\n.calc-only body { background: rgb(36, 38, 40); }\n.ti-pop.ti-standalone { position: static; margin: 16px auto; max-height: none; }\n@media (max-width: 640px) {\n  .ti-pop:not(.ti-standalone) { left: 0 !important; right: 0 !important; top: auto !important; bottom: 0 !important; width: auto; border-radius: 18px 18px 0 0; max-height: 88vh; max-height: 88dvh; }\n  .ti-fab span { display: none; }\n  .ti-fab { padding: 12px; }\n}\n@media print { .ti-pop, .ti-fab, .tikeys-run { display: none !important; } }\n/* ---------- calculator: playback speed, jog (one key at a time) and hide operations ---------- */\n.ti-ctl { display: grid; gap: 2px; margin-top: 8px; }\n.ti-speed { display: flex; align-items: center; gap: 4px; }\n.ti-ctl-l { font: 600 12px/1 var(--font-body, sans-serif); color: rgb(214, 214, 214); margin-right: 4px; }\n.ti-sp { font: 600 13px/1 var(--font-body, sans-serif); min-height: 30px; padding: 5px 9px; border-radius: 8px; cursor: pointer;\n  border: 1px solid rgb(126, 130, 134); background: rgb(40, 43, 46); color: rgb(240, 240, 240); }\n.ti-sp[aria-checked=\"true\"] { background: rgb(118, 186, 40); color: rgb(20, 22, 24); border-color: rgb(70, 120, 20); }\n.ti-mult { margin-left: auto; min-width: 3em; text-align: right; font: 600 13px/1 var(--font-mono, ui-monospace, monospace); color: rgb(240, 240, 240); }\n.ti-sw { display: flex; flex-wrap: wrap; gap: 2px 14px; }\n.ti-sw label { display: inline-flex; align-items: center; gap: 7px; min-height: 28px; font: 600 13px/1.2 var(--font-body, sans-serif); color: rgb(240, 240, 240); cursor: pointer; }\n.ti-sw input { width: 18px; height: 18px; margin: 0; accent-color: rgb(118, 186, 40); cursor: pointer; }\n.ti-play { flex-wrap: wrap; }\n.ti-prog { font: 600 13px/1 var(--font-mono, ui-monospace, monospace); color: rgb(240, 240, 240); white-space: nowrap; }\n.ti-jog { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }\n.ti-jog[hidden] { display: none; }\n.ti-jb { flex: 1 1 auto; font: 600 14px/1 var(--font-body, sans-serif); min-height: 40px; padding: 8px 10px; border-radius: 8px; cursor: pointer;\n  border: 1px solid rgb(150, 150, 150); background: rgb(40, 43, 46); color: rgb(240, 240, 240); }\n.ti-jb-main { background: rgb(255, 188, 0); border-color: rgb(255, 188, 0); color: rgb(20, 22, 24); }\n.ti-jb:disabled { opacity: 0.45; cursor: default; }\n.ti-ops-show { margin-top: 8px; font: 600 13px/1 var(--font-body, sans-serif); min-height: 34px; padding: 6px 10px; border-radius: 8px; cursor: pointer;\n  border: 1.5px dashed rgb(170, 170, 170); background: transparent; color: rgb(240, 240, 240); }\n.ti-ops-show[aria-expanded=\"true\"] { border-style: solid; }\n.ti-ops-show[hidden] { display: none; }\n.ti-pop.ops-hidden .ti-tape { display: none; }\n.ti-last { display: flex; align-items: center; gap: 8px; margin: 8px 0 0; font-size: 13px; color: rgb(240, 240, 240); }\n.ti-last[hidden] { display: none; }\n.ti-last .tk { height: 26px; min-width: 26px; font-size: 13px; padding: 0 6px; margin: 0; }\n.ti-sp:focus-visible, .ti-jb:focus-visible, .ti-ops-show:focus-visible, .ti-sw input:focus-visible { outline: 3px solid rgb(255, 188, 0); outline-offset: 2px; }\n\n/* short laptop screens: slightly shorter keys so the playback controls do not push the = key out of view */\n@media (min-width: 641px) and (max-height: 820px) {\n  .ti-body { padding-top: 10px; }\n  .ti-k { min-height: 29px; }\n  .ti-right .ti-k.k-fn { min-height: 36px; }\n  .ti-eqcell .ti-k { min-height: 42px; }\n  .ti-top, .ti-left { gap: 2px 6px; }\n  .ti-num { min-height: 38px; }\n  .ti-brand { margin: 4px 0 0; }\n  .ti-model { padding-bottom: 6px; }\n}\n\n/* ---------- calculator run glow: hub kit v1 (orange and red on purpose, outside the brand palette) ----------\n   While the hub's TI-30Xa plays a key sequence for this page: the block being solved pulses, the key chip being\n   pressed glows, and the drawing in the block glows. Classes only, added and removed by the glow script, and\n   screen only, so the glow is never part of a print, a download or an export. */\n@keyframes glowBlock { from { box-shadow: 0 0 0 3px #FF8A00, 0 0 14px 3px rgba(255, 138, 0, 0.55); } to { box-shadow: 0 0 0 3px #E10600, 0 0 26px 8px rgba(225, 6, 0, 0.5); } }\n@keyframes glowFig { from { box-shadow: 0 0 0 3px #FF6A00, 0 0 12px 2px rgba(255, 106, 0, 0.6); } to { box-shadow: 0 0 0 3px #E10600, 0 0 22px 6px rgba(225, 6, 0, 0.55); } }\n@keyframes glowKey { from { background: #FF8A00; color: #1A1A1A; box-shadow: 0 0 8px 2px rgba(255, 138, 0, 0.9); } to { background: #E10600; color: #FFFFFF; box-shadow: 0 0 16px 5px rgba(225, 6, 0, 0.75); } }\n@keyframes glowPart { from { filter: drop-shadow(0 0 2px #FF8A00) drop-shadow(0 0 4px rgba(255, 106, 0, 0.7)); } to { filter: drop-shadow(0 0 3px #FF6A00) drop-shadow(0 0 9px rgba(225, 6, 0, 0.75)); } }\n@media screen {\n  .glow-run { border-radius: 10px; box-shadow: 0 0 0 3px #FF8A00, 0 0 18px 4px rgba(255, 138, 0, 0.55); animation: glowBlock 1.1s ease-in-out infinite alternate; }\n  .glow-fig { box-shadow: 0 0 0 3px #FF6A00, 0 0 16px 4px rgba(255, 106, 0, 0.6); animation: glowFig 1.1s ease-in-out infinite alternate; }\n  kbd.tk.glow-key { background: #FF8A00; color: #1A1A1A; border-color: #E10600; outline: 3px solid #E10600; outline-offset: 1px; box-shadow: 0 0 10px 3px rgba(255, 138, 0, 0.9); animation: glowKey 0.55s ease-in-out infinite alternate; }\n  svg .glow-part { fill: #E10600; font-weight: 700; filter: drop-shadow(0 0 2px #FF8A00) drop-shadow(0 0 6px rgba(255, 106, 0, 0.8)); animation: glowPart 1.1s ease-in-out infinite alternate; }\n}\n@media screen and (prefers-reduced-motion: reduce) {\n  .glow-run { animation: none; box-shadow: 0 0 0 3px #E10600, 0 0 18px 4px rgba(255, 138, 0, 0.6); }\n  .glow-fig { animation: none; box-shadow: 0 0 0 3px #E10600, 0 0 16px 4px rgba(255, 106, 0, 0.6); }\n  kbd.tk.glow-key { animation: none; }\n  svg .glow-part { animation: none; filter: drop-shadow(0 0 3px #FF6A00) drop-shadow(0 0 7px rgba(225, 6, 0, 0.75)); }\n}\n/* ---------- calculator models: model menu, Sharp EL-531XT and HP-15C faceplates (CalcKit) ----------\n   Original drawings in each calculator's own layout and colours. Model names are plain text, no logos. Key-cap\n   colours are fixed, like the TI-30Xa keys, so they read the same in light and dark mode. */\n.ti-msel-w { display: inline-flex; }\n.ti-msel { font: 600 13px/1 var(--font-body, sans-serif); min-height: 32px; max-width: 130px; padding: 4px 6px; border-radius: 8px; cursor: pointer;\n  border: 1px solid rgb(126, 130, 134); background: rgb(40, 43, 46); color: rgb(240, 240, 240); }\n.ti-msel:focus-visible { outline: 3px solid rgb(255, 188, 0); outline-offset: 2px; }\n.ti-notes { margin: 6px 0 0; font-size: 12.5px; line-height: 1.4; color: rgb(255, 214, 102); }\n.ti-notes[hidden] { display: none; }\n.ti-tape .tk-sh-2ndf, .ti-last .tk-sh-2ndf { background: rgb(240, 150, 40); color: rgb(20, 22, 24); border-color: rgb(150, 80, 10); }\n.ti-tape .tk-sh-f, .ti-last .tk-sh-f { background: rgb(232, 176, 104); color: rgb(20, 22, 24); border-color: rgb(140, 96, 40); }\n.ti-tape .tk-sh-g, .ti-last .tk-sh-g { background: rgb(112, 172, 224); color: rgb(20, 22, 24); border-color: rgb(40, 90, 140); }\n.ti-tape .tk-sec-2ndf { box-shadow: 0 2px 0 rgb(150, 80, 10); border-color: rgb(150, 80, 10); }\n.ti-tape .tk-sec-f { box-shadow: 0 2px 0 rgb(140, 96, 40); border-color: rgb(140, 96, 40); }\n.ti-tape .tk-sec-g { box-shadow: 0 2px 0 rgb(40, 90, 140); border-color: rgb(40, 90, 140); }\n.ti-tape .tk-alpha { box-shadow: 0 2px 0 rgb(30, 110, 60); border-color: rgb(30, 110, 60); }\n\n/* Sharp EL-531XT: white upper face with the solar strip and display, charcoal keypad */\n.ti-pop.calc-el531xt { width: 380px; background: rgb(36, 37, 40); }\n.calc-el531xt .ti-bar { background: rgb(24, 25, 27); }\n.sh-head { background: rgb(242, 242, 240); border-radius: 12px; padding: 10px 12px 8px; }\n.sh-solar { display: block; width: 48%; height: 14px; margin: 0 0 8px auto; border-radius: 3px; background: rgb(64, 44, 40); }\n.sh-lcd { background: rgb(200, 207, 198); color: rgb(24, 28, 24); border: 2px solid rgb(120, 124, 120); border-radius: 6px; padding: 4px 8px 6px; }\n.sh-lcd .ti-ind { gap: 2px 8px; }\n.sh-eq { min-height: 17px; margin-top: 2px; font: 500 13px/1.3 var(--font-mono, ui-monospace, monospace); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.sh-lcd .ti-num { min-height: 38px; font-size: 30px; }\n.sh-name { display: flex; justify-content: space-between; margin: 6px 2px 0; font: italic 600 11px/1 var(--font-body, sans-serif); letter-spacing: 0.04em; color: rgb(84, 86, 90); }\n.sh-face { margin-top: 10px; }\n.sh-cell { display: grid; gap: 1px; justify-items: stretch; min-width: 0; }\n.sk-lab { display: flex; justify-content: space-between; gap: 2px; min-height: 12px; font: 600 8.5px/1.3 var(--font-body, sans-serif); white-space: nowrap; overflow: hidden; }\n.sk-2 { color: rgb(255, 176, 72); }\n.sk-a { color: rgb(120, 210, 150); }\n.sh-nav { display: grid; grid-template-columns: 1fr 1.5fr 1fr; gap: 4px 10px; align-items: end; }\n.sh-nav > .sh-cell:nth-child(1) { grid-column: 1; grid-row: 1; }\n.sh-nav > .sh-pad { grid-column: 2; grid-row: 1 / span 2; }\n.sh-nav > .sh-cell:nth-child(3) { grid-column: 3; grid-row: 1; }\n.sh-nav > .sh-cell:nth-child(4) { grid-column: 1; grid-row: 2; }\n.sh-nav > .sh-cell:nth-child(5) { grid-column: 3; grid-row: 2; }\n.sh-pad { display: grid; grid-template-columns: 1fr 1fr 1fr; grid-template-rows: 1fr 1fr 1fr; height: 76px; align-self: center; border-radius: 36px; background: rgb(236, 236, 234); border: 1px solid rgb(20, 22, 24); }\n.sh-ar { border: 0; background: transparent; color: rgb(36, 38, 42); font: 700 11px/1 var(--font-body, sans-serif); cursor: pointer; min-width: 24px; min-height: 24px; border-radius: 6px; touch-action: manipulation; }\n.sh-ar:hover { background: rgb(214, 214, 212); }\n.sh-ar:focus-visible { outline: 3px solid rgb(255, 188, 0); outline-offset: 1px; }\n.sh-ar.is-hit { background: rgb(255, 188, 0); }\n.sh-up { grid-column: 2; grid-row: 1; } .sh-left { grid-column: 1; grid-row: 2; } .sh-right { grid-column: 3; grid-row: 2; } .sh-down { grid-column: 2; grid-row: 3; }\n.sh-row3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px 10px; margin: 6px 0 2px; }\n.sh-fn { display: grid; grid-template-columns: repeat(6, 1fr); gap: 2px 5px; }\n.sh-num { display: grid; grid-template-columns: repeat(5, 1fr); gap: 3px 7px; margin-top: 6px; }\n.sh-eqcell { grid-column: span 2; }\n.calc-el531xt .ti-k { min-height: 28px; font-size: 12.5px; border-radius: 7px; }\n.ti-k.sk-fn { background: rgb(70, 72, 78); color: rgb(255, 255, 255); }\n.ti-k.sk-num { background: rgb(18, 19, 21); color: rgb(255, 255, 255); font-size: 18px; min-height: 36px; }\n.ti-k.sk-op { background: rgb(238, 238, 236); color: rgb(20, 22, 24); font-size: 18px; min-height: 36px; }\n.ti-k.sk-2nd { background: rgb(36, 37, 40); color: rgb(255, 176, 72); border: 1.5px solid rgb(255, 176, 72); }\n.ti-k.sk-alpha { background: rgb(36, 37, 40); color: rgb(120, 210, 150); border: 1.5px solid rgb(120, 210, 150); }\n.ti-k.sk-on { background: rgb(62, 40, 48); color: rgb(255, 160, 180); }\n\n/* HP-15C: brushed upper panel with the display, black keyboard, gold f and blue g legends, ENTER two rows high */\n.ti-pop.calc-hp15c { width: 600px; max-width: calc(100vw - 40px); background: rgb(30, 30, 32); }\n.calc-hp15c .ti-bar { background: rgb(18, 18, 20); }\n.hp-head { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 10px; background: rgb(218, 218, 214); border-bottom: 3px solid rgb(150, 150, 146); }\n.hp-lcd { flex: 1; min-width: 0; background: rgb(172, 178, 164); color: rgb(24, 26, 22); border: 3px solid rgb(60, 62, 60); border-radius: 4px; padding: 4px 10px; }\n.hp-lcd .ti-num { justify-content: flex-start; min-height: 36px; font-size: 30px; }\n.hp-lcd .ti-exp { margin-left: auto; }\n.hp-lcd .ti-ind { gap: 2px 14px; min-height: 13px; }\n.hp-name { margin: 0; font: italic 700 15px/1 var(--font-display, sans-serif); color: rgb(52, 54, 58); white-space: nowrap; }\n.hp-face { margin-top: 10px; padding: 6px 6px 8px; border-radius: 8px; background: rgb(20, 20, 22); border: 2px solid rgb(96, 88, 70); }\n.hp-grid { display: grid; grid-template-columns: repeat(10, minmax(0, 1fr)); gap: 2px 5px; }\n.hp-cell { display: grid; grid-template-rows: auto 1fr; gap: 1px; min-width: 0; }\n.hp-enter { grid-column: 6; grid-row: 3 / span 2; }\n.hk-f-lab { min-height: 11px; font: 700 8px/1.3 var(--font-body, sans-serif); color: rgb(232, 176, 104); text-align: center; white-space: nowrap; overflow: hidden; }\n.hp-clr .hk-f-lab { border-top: 1px solid rgb(232, 176, 104); }\n.calc-hp15c .ti-k { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; min-height: 40px; padding: 2px 1px; border-radius: 5px; min-width: 0; }\n.ti-k.hk-k { background: rgb(52, 52, 56); color: rgb(255, 255, 255); border-color: rgb(8, 8, 10); }\n.ti-k.hk-f { background: rgb(232, 170, 100); color: rgb(20, 22, 24); }\n.ti-k.hk-g { background: rgb(112, 172, 224); color: rgb(20, 22, 24); }\n.hk-face { font: 700 13px/1.1 var(--font-body, sans-serif); white-space: nowrap; }\n.hk-g-lab { font: 700 8px/1.2 var(--font-body, sans-serif); color: rgb(130, 190, 240); white-space: nowrap; }\n.hp-enter .ti-k { height: 100%; }\n.hp-enter .hk-face { writing-mode: vertical-rl; text-orientation: upright; letter-spacing: -1px; font-size: 12px; }\n@media (max-width: 640px) {\n  .ti-pop.calc-hp15c:not(.ti-standalone), .ti-pop.calc-el531xt:not(.ti-standalone) { width: auto; max-width: none; }\n  .hp-grid { gap: 2px 3px; }\n  .hk-face { font-size: 11px; }\n  .hk-f-lab, .hk-g-lab { font-size: 7.5px; }\n  .calc-hp15c .ti-k { min-height: 36px; }\n  .hp-name { font-size: 12px; }\n  .ti-pop.is-playing .ti-keys, .ti-pop.is-playing .sh-name, .ti-pop.is-playing .sh-solar { display: none; }\n}\n@media (min-width: 641px) and (max-height: 820px) {\n  .calc-el531xt .ti-k { min-height: 25px; }\n  .ti-k.sk-num, .ti-k.sk-op { min-height: 30px; }\n  .sh-pad { height: 64px; }\n  .calc-hp15c .ti-k { min-height: 34px; }\n}\n.ti-pop.ti-standalone.calc-hp15c { width: 600px; }\n/* the floating Calculator button in ACCESS gold with ACCESS ink (about 11:1), the same in light and dark */\n.ti-fab { background: rgb(255, 188, 0); color: rgb(26, 21, 18); border-color: rgb(26, 21, 18); }\n.ti-fab:hover { background: rgb(255, 205, 64); }\n";
  function addCss() {
    if (document.getElementById('calckit-css')) return;
    var st = document.createElement('style');
    st.id = 'calckit-css';
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addCss); else addCss();
  if (window.CALCKIT_AUTOMOUNT !== true) window.CALCKIT_NO_AUTOMOUNT = true;
})();

/* ===== ti30.js ===== */
/* TI-30Xa emulator engine.
   Behaviour follows the TI-30Xa guidebook (education.ti.com, 30xa-eng.pdf).
   Exposed as window.TI30 in the browser and module.exports in node. */
(function (root) {
  'use strict';

  var PI12 = 3.14159265359;
  var SEP = '⌟';
  var MAXV = 9.999999999e99;

  /* Faceplate layout, top row first. Each key is [id, primary label, 2nd label]. */
  var LAYOUT = {
    top: [
      [['2nd', '2nd', ''], ['drg', 'DRG', 'DRG\u25B8'], ['log', 'LOG', '10\u02E3'], ['ln', 'LN', 'e\u02E3'], ['off', 'OFF', '']],
      [['hyp', 'HYP', 'K'], ['sin', 'SIN', 'SIN\u207B\u00B9'], ['cos', 'COS', 'COS\u207B\u00B9'], ['tan', 'TAN', 'TAN\u207B\u00B9'], ['pow', 'y\u02E3', '\u02E3\u221Ay']]
    ],
    left: [
      [['pi', '\u03C0', 'x\u21C4y'], ['inv', '1/x', 'FRQ'], ['sq', 'x\u00B2', 'x\u0304'], ['sqrt', '\u221Ax', '\u03C3xn-1']],
      [['sigma', '\u03A3+', '\u03A3\u2212'], ['ee', 'EE', 'n'], ['lp', '(', '\u03A3x'], ['rp', ')', '\u03A3x\u00B2']],
      [['sto', 'STO', 'EXC'], ['d7', '7', 'CSR'], ['d8', '8', 'nCr'], ['d9', '9', 'nPr']],
      [['rcl', 'RCL', 'SUM'], ['d4', '4', 'FLO'], ['d5', '5', 'SCI'], ['d6', '6', 'ENG']],
      [['abc', 'a b/c', 'd/c'], ['d1', '1', 'x\u00B3'], ['d2', '2', '%'], ['d3', '3', 'x!']],
      [['back', '\u2190', 'F\u21C4D'], ['d0', '0', '\u00B3\u221Ax'], ['dot', '.', 'FIX'], ['neg', '+\u21C4\u2212', '']]
    ],
    right: [['div', '\u00F7', '\u03C3xn'], ['mul', '\u00D7', 'P\u25B8R'], ['sub', '\u2212', 'R\u25B8P'], ['add', '+', 'DMS\u25B8DD'], ['eq', '=', 'DD\u25B8DMS']],
    onc: ['onc', 'ON/C', '']
  };
  var KEYS = {};
  function addKey(k) { KEYS[k[0]] = [k[1], k[2]]; }
  LAYOUT.top.concat(LAYOUT.left).forEach(function (row) { row.forEach(addKey); });
  LAYOUT.right.forEach(addKey);
  addKey(LAYOUT.onc);

  /* 2nd functions by key id */
  var SECOND = {
    drg: 'drgconv', log: 'tenx', ln: 'ex', hyp: 'konst', sin: 'asin', cos: 'acos', tan: 'atan', pow: 'root',
    pi: 'xy', inv: 'frq', sq: 'mean', sqrt: 'sdn1', div: 'sdn', sigma: 'sminus', ee: 'n', lp: 'sx', rp: 'sx2',
    mul: 'p2r', sto: 'exc', d7: 'csr', d8: 'ncr', d9: 'npr', sub: 'r2p', rcl: 'sum', d4: 'flo', d5: 'sci',
    d6: 'eng', add: 'dmsdd', abc: 'dc', d1: 'cube', d2: 'pct', d3: 'fact', back: 'fd', d0: 'cbrt', dot: 'fix', eq: 'dddms'
  };
  var PREC = { add: 1, sub: 1, mul: 2, div: 2, pow: 3, root: 3, ncr: 4, npr: 4 };

  function sig13(v) { return (v === 0 || !isFinite(v)) ? v : Number(v.toPrecision(13)); }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }
  function rat(n, d) {
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d);
    return [n / g, d / g];
  }
  function isInt(v) { return Math.abs(v - Math.round(v)) < 1e-9 && Math.abs(v) < 1e15; }
  function V(v) { return { v: v, r: null, fr: false, imp: false }; }
  function I(n) { return { v: n, r: [n, 1], fr: false, imp: false }; }
  function F(n, d) {
    var r = rat(n, d);
    return { v: r[0] / r[1], r: r, fr: r[1] !== 1, imp: false };
  }

  function CalcError(msg) { this.msg = msg; }

  function Calc() { this.memory = [0, 0, 0]; this.powerOn(); }

  Calc.prototype.powerOn = function () {
    this.off = false;
    this.angle = 'DEG';
    this.notation = 'FLO';
    this.fix = null;
    this.stat = { n: 0, sx: 0, sx2: 0 };
    this.clearAll();
  };

  Calc.prototype.clearAll = function () {
    this.x = I(0);
    this.entry = null;
    this.ops = [];
    this.K = null;
    this.t = 0;
    this.err = false;
    this.second = false;
    this.hyp = false;
    this.await = null;
    this.frqData = null;
    this.override = null;
    this.coord = '';
    this.lastKey = null;
    this.lastWasOp = false;
  };

  /* ---------- entry ---------- */
  Calc.prototype.newEntry = function () {
    this.entry = { parts: [''], neg: false, ee: null, eeNeg: false };
    this.lastWasOp = false;
  };
  Calc.prototype.entryCur = function () { return this.entry.parts[this.entry.parts.length - 1]; };
  Calc.prototype.digit = function (ch) {
    if (!this.entry) this.newEntry();
    var e = this.entry;
    if (e.ee !== null) { e.ee = (e.ee + ch).slice(-2); return; }
    var cur = this.entryCur();
    var count = e.parts.join('').replace(/[^0-9]/g, '').length;
    if (count >= 10) return;
    if (ch === '.') {
      if (e.parts.length > 1 || cur.indexOf('.') >= 0) return;
      if (cur === '') cur = '0';
      e.parts[e.parts.length - 1] = cur + '.';
      return;
    }
    if (cur === '0') cur = '';
    e.parts[e.parts.length - 1] = cur + ch;
  };
  Calc.prototype.entryValue = function () {
    var e = this.entry, sgn = e.neg ? -1 : 1;
    if (e.parts.length > 1) {
      var p = e.parts.map(function (s) { return parseInt(s || '0', 10); });
      var w = 0, n, d;
      if (p.length === 3) { w = p[0]; n = p[1]; d = p[2]; } else { n = p[0]; d = p[1]; }
      if (d === 0 || d > 999) throw new CalcError('denominator');
      var val = F(sgn * (w * d + n), d);
      val.fr = true;
      val.imp = (p.length === 2 && n >= d);
      return val;
    }
    var s = e.parts[0] || '0';
    var v = parseFloat(s);
    if (e.ee !== null) v = v * Math.pow(10, (e.eeNeg ? -1 : 1) * parseInt(e.ee || '0', 10));
    v = sgn * v;
    if (e.ee === null && s.indexOf('.') < 0) return I(v);
    return V(sig13(v));
  };
  Calc.prototype.finish = function () {
    if (this.entry) { this.x = this.entryValue(); this.entry = null; }
    return this.x;
  };

  /* ---------- checks ---------- */
  function chk(v) {
    if (typeof v !== 'number' || isNaN(v) || Math.abs(v) > MAXV) throw new CalcError('overflow');
    if (Math.abs(v) < 1e-99) return 0;
    return sig13(v);
  }
  Calc.prototype.setX = function (v) { this.x = V(chk(v)); };
  Calc.prototype.toRad = function (a) {
    if (this.angle === 'DEG') return a * Math.PI / 180;
    if (this.angle === 'GRAD') return a * Math.PI / 200;
    return a;
  };
  Calc.prototype.fromRad = function (a) {
    if (this.angle === 'DEG') return a * 180 / Math.PI;
    if (this.angle === 'GRAD') return a * 200 / Math.PI;
    return a;
  };
  function clean(v) { return Math.abs(v) < 1e-12 ? 0 : v; }

  /* ---------- binary operations ---------- */
  function apply(op, a, b) {
    var v, r = null, both = a.r && b.r;
    switch (op) {
      case 'add': v = a.v + b.v; if (both) r = rat(a.r[0] * b.r[1] + b.r[0] * a.r[1], a.r[1] * b.r[1]); break;
      case 'sub': v = a.v - b.v; if (both) r = rat(a.r[0] * b.r[1] - b.r[0] * a.r[1], a.r[1] * b.r[1]); break;
      case 'mul': v = a.v * b.v; if (both) r = rat(a.r[0] * b.r[0], a.r[1] * b.r[1]); break;
      case 'div':
        if (b.v === 0) throw new CalcError('div0');
        v = a.v / b.v; if (both) r = rat(a.r[0] * b.r[1], a.r[1] * b.r[0]); break;
      case 'pow':
        if (a.v === 0 && b.v === 0) throw new CalcError('pow');
        if (a.v < 0 && !isInt(b.v)) throw new CalcError('pow');
        if (a.v === 0 && b.v < 0) throw new CalcError('div0');
        v = Math.pow(a.v, b.v); break;
      case 'root':
        if (b.v === 0) throw new CalcError('root');
        if (a.v < 0) {
          if (!(isInt(b.v) && Math.abs(Math.round(b.v)) % 2 === 1)) throw new CalcError('root');
          v = -Math.pow(-a.v, 1 / b.v);
        } else v = Math.pow(a.v, 1 / b.v);
        break;
      case 'ncr':
      case 'npr':
        if (!isInt(a.v) || !isInt(b.v) || a.v < 0 || b.v < 0 || b.v > a.v) throw new CalcError('ncr');
        var n = Math.round(a.v), k = Math.round(b.v), p = 1, i;
        if (op === 'npr') { for (i = 0; i < k; i++) p *= (n - i); }
        else { k = Math.min(k, n - k); for (i = 1; i <= k; i++) p = p * (n - k + i) / i; p = Math.round(p); }
        v = p; break;
    }
    v = chk(v);
    var out = V(v);
    if (r && (op === 'add' || op === 'sub' || op === 'mul' || op === 'div')) {
      if (a.fr || b.fr) {
        if (r[1] <= 999) { out.r = r; out.fr = r[1] !== 1; }
      } else if (r[1] === 1) out.r = r;
    }
    return out;
  }

  Calc.prototype.pendingCount = function () {
    return this.ops.filter(function (o) { return o !== '('; }).length;
  };
  Calc.prototype.reduceTo = function (prec) {
    while (this.ops.length) {
      var top = this.ops[this.ops.length - 1];
      if (top === '(' || PREC[top.op] < prec) break;
      this.ops.pop();
      this.x = apply(top.op, top.a, this.x);
    }
  };
  Calc.prototype.binary = function (op) {
    var self = this;
    if (this.lastWasOp && this.ops.length && this.ops[this.ops.length - 1] !== '(') {
      this.ops[this.ops.length - 1].op = op;
      return;
    }
    this.finish();
    this.K = null;
    this.reduceTo(PREC[op]);
    var lim = this.stat.n > 0 ? 2 : 4;
    if (this.pendingCount() + 1 > lim) throw new CalcError('pending');
    this.ops.push({ op: op, a: self.x });
    this.lastWasOp = true;
  };
  Calc.prototype.lparen = function () {
    var opens = this.ops.filter(function (o) { return o === '('; }).length;
    if (opens >= 15) throw new CalcError('paren');
    this.entry = null;
    this.ops.push('(');
    this.lastWasOp = true;
  };
  Calc.prototype.rparen = function () {
    this.finish();
    this.reduceTo(0);
    if (this.ops.length && this.ops[this.ops.length - 1] === '(') this.ops.pop();
  };
  Calc.prototype.equals = function () {
    this.finish();
    if (!this.ops.length && this.K) { this.x = apply(this.K.op, this.x, this.K.b); return; }
    while (this.ops.length) {
      var top = this.ops.pop();
      if (top !== '(') this.x = apply(top.op, top.a, this.x);
    }
  };

  /* ---------- single-variable functions ---------- */
  Calc.prototype.unary = function (fn) {
    var x = this.finish(), v = x.v, r, h = this.hyp;
    this.hyp = false;
    switch (fn) {
      case 'sq': r = v * v; break;
      case 'cube': r = v * v * v; break;
      case 'sqrt': if (v < 0) throw new CalcError('sqrt'); r = Math.sqrt(v); break;
      case 'cbrt': r = Math.cbrt(v); break;
      case 'inv': if (v === 0) throw new CalcError('div0'); r = 1 / v; break;
      case 'log': if (v <= 0) throw new CalcError('log'); r = Math.log10(v); break;
      case 'ln': if (v <= 0) throw new CalcError('ln'); r = Math.log(v); break;
      case 'tenx': r = Math.pow(10, v); break;
      case 'ex': r = Math.exp(v); break;
      case 'fact':
        if (!isInt(v) || v < 0 || v > 69) throw new CalcError('fact');
        r = 1; for (var i = 2; i <= Math.round(v); i++) r *= i; break;
      case 'sin': r = h ? Math.sinh(v) : clean(Math.sin(this.toRad(v))); break;
      case 'cos': r = h ? Math.cosh(v) : clean(Math.cos(this.toRad(v))); break;
      case 'tan':
        if (h) { r = Math.tanh(v); break; }
        var q = this.angle === 'DEG' ? 90 : (this.angle === 'GRAD' ? 100 : null);
        if (q !== null && isInt(v / q) && Math.round(v / q) % 2 !== 0) throw new CalcError('tan');
        var c = Math.cos(this.toRad(v));
        if (Math.abs(c) < 1e-13) throw new CalcError('tan');
        r = clean(Math.tan(this.toRad(v))); break;
      case 'asin':
        if (h) { r = Math.asinh(v); break; }
        if (Math.abs(v) > 1) throw new CalcError('asin'); r = this.fromRad(Math.asin(v)); break;
      case 'acos':
        if (h) { if (v < 1) throw new CalcError('acosh'); r = Math.acosh(v); break; }
        if (Math.abs(v) > 1) throw new CalcError('acos'); r = this.fromRad(Math.acos(v)); break;
      case 'atan':
        if (h) { if (Math.abs(v) >= 1) throw new CalcError('atanh'); r = Math.atanh(v); break; }
        r = this.fromRad(Math.atan(v)); break;
      case 'dmsdd':
        var sg = v < 0 ? -1 : 1, a = Math.abs(v), d = Math.floor(a + 1e-12);
        var rest = Math.round((a - d) * 100 * 1e9) / 1e9, m = Math.floor(rest + 1e-12);
        var s = (rest - m) * 100;
        r = sg * (d + m / 60 + s / 3600); break;
      case 'pct':
        var top = this.ops.length ? this.ops[this.ops.length - 1] : null;
        if (top && top !== '(' && (top.op === 'add' || top.op === 'sub')) r = top.a.v * v / 100;
        else r = v / 100;
        break;
    }
    this.setX(r);
  };

  /* ---------- statistics ---------- */
  Calc.prototype.statAdd = function (sign) {
    var x = this.finish().v, data = x, f = 1;
    if (this.frqData !== null) { data = this.frqData; f = Math.round(x); this.frqData = null; }
    if (Math.abs(data) >= 1e64) throw new CalcError('stat');
    var st = this.stat;
    if (sign < 0 && st.n - f <= 0) throw new CalcError('stat');
    st.n += sign * f; st.sx += sign * f * data; st.sx2 += sign * f * data * data;
    this.x = I(st.n);
    this.override = { label: 'n=' };
  };
  Calc.prototype.statGet = function (what) {
    this.finish();
    var st = this.stat, n = st.n, r;
    if (what === 'n') r = n;
    else if (what === 'sx') r = st.sx;
    else if (what === 'sx2') r = st.sx2;
    else {
      if (n === 0) throw new CalcError('stat');
      var mean = st.sx / n;
      if (what === 'mean') r = mean;
      else {
        var ss = Math.max(0, st.sx2 - st.sx * st.sx / n);
        if (what === 'sdn') r = Math.sqrt(ss / n);
        else { if (n < 2) throw new CalcError('stat'); r = Math.sqrt(ss / (n - 1)); }
      }
    }
    this.setX(r);
  };

  /* ---------- angle units and coordinates ---------- */
  var NEXT = { DEG: 'RAD', RAD: 'GRAD', GRAD: 'DEG' };
  Calc.prototype.drgConvert = function () {
    var v = this.finish().v, to = NEXT[this.angle], r;
    if (this.angle === 'DEG') r = v * Math.PI / 180;
    else if (this.angle === 'RAD') r = v * 200 / Math.PI;
    else r = v * 0.9;
    this.angle = to;
    this.setX(r);
  };
  Calc.prototype.coordConvert = function (kind) {
    var b = this.finish().v, a = this.t, r1, r2;
    if (kind === 'r2p') { r1 = Math.sqrt(a * a + b * b); r2 = this.fromRad(Math.atan2(b, a)); this.coord = 'r'; }
    else { var th = this.toRad(b); r1 = a * Math.cos(th); r2 = a * Math.sin(th); r1 = clean(r1); r2 = clean(r2); this.coord = 'x'; }
    this.setX(r1);
    this.t = chk(r2);
  };
  Calc.prototype.swapXY = function () {
    var v = this.finish().v, t = this.t;
    this.t = v;
    this.setX(t);
  };

  /* ---------- fractions ---------- */
  function toFrac(v) {
    for (var d = 1; d <= 999; d++) {
      var n = Math.round(v * d);
      if (Math.abs(n / d - v) <= 1e-10 * Math.max(1, Math.abs(v))) return rat(n, d);
    }
    return null;
  }
  Calc.prototype.fracDec = function () {
    var x = this.finish();
    if (x.fr) { this.x = V(x.v); this.x.wasFr = x.r; return; }
    if (this.fix === 0) return;
    var r = x.wasFr || toFrac(x.v);
    if (r && r[1] !== 1) this.x = { v: x.v, r: r, fr: true, imp: false };
  };
  Calc.prototype.toggleImp = function () {
    var x = this.finish();
    if (x.fr) x.imp = !x.imp;
  };

  /* ---------- memory ---------- */
  Calc.prototype.memOp = function (kind, n) {
    var i = n - 1, x = this.finish().v;
    if (kind === 'sto') this.memory[i] = x;
    else if (kind === 'rcl') this.setX(this.memory[i]);
    else if (kind === 'sum') this.memory[i] = chk(this.memory[i] + x);
    else if (kind === 'exc') { var m = this.memory[i]; this.memory[i] = x; this.setX(m); }
  };

  /* ---------- key handler ---------- */
  Calc.prototype.press = function (key) {
    if (!KEYS[key]) throw new Error('Unknown key: ' + key);
    var wasOnc = this.lastKey === 'onc';
    this.lastKey = key;
    if (this.off) { if (key === 'onc') this.powerOn(); return; }
    if (key === 'onc') {
      if (this.err || wasOnc) { this.clearAll(); this.lastKey = 'onc'; return; }
      this.entry = null; this.x = I(0); this.K = null; this.second = false; this.hyp = false;
      this.await = null; this.override = null; this.coord = '';
      return;
    }
    if (this.err) return;
    if (key === 'off') { this.off = true; return; }
    this.override = null;
    try { this.dispatch(key); } catch (e) {
      if (e instanceof CalcError) { this.err = e.msg; this.second = false; this.hyp = false; this.await = null; }
      else throw e;
    }
  };

  Calc.prototype.dispatch = function (key) {
    if (this.await) {
      var aw = this.await;
      this.await = null;
      if (aw === 'fix') {
        if (key === 'dot') { this.fix = null; return; }
        if (/^d[0-9]$/.test(key)) { this.fix = parseInt(key.slice(1), 10); return; }
      } else if (/^d[1-3]$/.test(key)) { this.memOp(aw, parseInt(key.slice(1), 10)); return; }
    }
    if (key === '2nd') { this.second = !this.second; return; }
    var act = key;
    if (this.second) { this.second = false; act = SECOND[key] || key; }
    if (act !== 'hyp' && ['sin', 'cos', 'tan', 'asin', 'acos', 'atan'].indexOf(act) < 0) this.hyp = false;
    if (act !== 'p2r' && act !== 'r2p' && act !== 'xy') this.coord = '';
    var wasOp = this.lastWasOp;
    if (!/^d[0-9]$/.test(act) && act !== 'dot' && act !== 'abc' && act !== 'ee' && act !== 'neg' && act !== 'back') this.lastWasOp = false;

    if (/^d[0-9]$/.test(act)) { if (!this.entry) this.newEntry(); this.digit(act.slice(1)); return; }
    switch (act) {
      case 'dot': if (!this.entry) this.newEntry(); this.digit('.'); return;
      case 'abc':
        if (!this.entry) return;
        if (this.entry.ee !== null || this.entry.parts.length >= 3 || this.entryCur().indexOf('.') >= 0) return;
        this.entry.parts.push(''); return;
      case 'ee':
        if (!this.entry) { this.newEntry(); this.entry.parts[0] = String(Math.abs(this.x.v)); this.entry.neg = this.x.v < 0; }
        if (this.entry.parts.length > 1) return;
        if (this.entry.ee === null) this.entry.ee = '';
        return;
      case 'neg':
        if (this.entry) {
          if (this.entry.ee !== null) this.entry.eeNeg = !this.entry.eeNeg; else this.entry.neg = !this.entry.neg;
          this.lastWasOp = wasOp;
          return;
        }
        this.x = { v: -this.x.v, r: this.x.r ? [-this.x.r[0], this.x.r[1]] : null, fr: this.x.fr, imp: this.x.imp };
        return;
      case 'back':
        if (!this.entry) return;
        var e = this.entry;
        if (e.ee !== null) { if (e.ee.length) e.ee = e.ee.slice(0, -1); else e.ee = null; return; }
        var cur = this.entryCur();
        if (cur.length) e.parts[e.parts.length - 1] = cur.slice(0, -1);
        else if (e.parts.length > 1) e.parts.pop();
        return;
      case 'pi': this.entry = null; this.x = V(PI12); return;
      case 'add': case 'sub': case 'mul': case 'div': case 'pow': case 'root': case 'ncr': case 'npr':
        this.lastWasOp = wasOp; this.binary(act); return;
      case 'lp': this.lparen(); return;
      case 'rp': this.rparen(); return;
      case 'eq': this.equals(); return;
      case 'sq': case 'cube': case 'sqrt': case 'cbrt': case 'inv': case 'log': case 'ln': case 'tenx': case 'ex':
      case 'fact': case 'sin': case 'cos': case 'tan': case 'asin': case 'acos': case 'atan': case 'dmsdd': case 'pct':
        this.unary(act); return;
      case 'hyp': this.hyp = true; return;
      case 'drg': this.finish(); this.angle = NEXT[this.angle]; return;
      case 'drgconv': this.drgConvert(); return;
      case 'konst':
        this.finish();
        var top = this.ops.length ? this.ops[this.ops.length - 1] : null;
        if (top && top !== '(') this.K = { op: top.op, b: this.x };
        return;
      case 'xy': this.swapXY(); return;
      case 'p2r': case 'r2p': this.coordConvert(act); return;
      case 'sto': case 'rcl': case 'sum': case 'exc': this.finish(); this.await = act; return;
      case 'fix': this.finish(); this.await = 'fix'; return;
      case 'flo': this.finish(); this.notation = 'FLO'; return;
      case 'sci': this.finish(); this.notation = 'SCI'; return;
      case 'eng': this.finish(); this.notation = 'ENG'; return;
      case 'frq': this.frqData = this.finish().v; this.entry = null; return;
      case 'sigma': this.statAdd(1); return;
      case 'sminus': this.statAdd(-1); return;
      case 'mean': case 'sdn': case 'sdn1': case 'n': case 'sx': case 'sx2': this.statGet(act); return;
      case 'csr':
        if (this.stat.n === 0) throw new CalcError('stat');
        this.stat = { n: 0, sx: 0, sx2: 0 }; return;
      case 'fd': this.fracDec(); return;
      case 'dc': this.toggleImp(); return;
      case 'dddms': this.finish(); this.override = { dms: true }; return;
    }
  };

  /* ---------- display ---------- */
  function digitsOf(s) { return s.replace(/[^0-9]/g, '').length; }
  function stripZeros(s) { return s.indexOf('.') >= 0 ? s.replace(/0+$/, '') : s; }
  function pad2(e) { var a = Math.abs(e); return (e < 0 ? '-' : '') + (a < 10 ? '0' : '') + a; }

  function fmtSci(v, fix, eng) {
    var a = Math.abs(v), e = a === 0 ? 0 : Math.floor(Math.log10(a));
    if (eng) e = Math.floor(e / 3) * 3;
    var out = fmtSciAt(v, e, fix, eng);
    if (Math.abs(parseFloat(out.main)) >= (eng ? 1000 : 10)) out = fmtSciAt(v, e + (eng ? 3 : 1), fix, eng);
    return out;
  }
  function fmtSciAt(v, e, fix, eng) {
    var m = v / Math.pow(10, e);
    var intDigits = Math.max(1, Math.floor(Math.log10(Math.abs(m) || 1)) + 1);
    var dec = fix !== null ? fix : 10 - intDigits;
    var s = m.toFixed(Math.min(dec, 10 - intDigits));
    if (fix === null) s = stripZeros(s);
    if (fix === null && s.indexOf('.') < 0) s += '.';
    return { main: s, exp: pad2(e) };
  }
  function fmtFlo(v, fix) {
    var a = Math.abs(v);
    if (a !== 0 && (a >= 9999999999.5 || a < 1e-9)) return fmtSci(v, fix, false);
    var k = a >= 1 ? Math.floor(Math.log10(a)) + 1 : 1;
    var dec = Math.max(0, 10 - k);
    if (fix !== null) dec = Math.min(dec, fix);
    var s = v.toFixed(dec);
    if (digitsOf(s) > 10) s = v.toFixed(Math.max(0, dec - 1));
    if (fix === null) {
      s = stripZeros(s);
      if (s.indexOf('.') < 0) s += '.';
    }
    if (/^-?0\.?0*$/.test(s) && fix === null) s = '0.';
    if (s === '-0.') s = '0.';
    return { main: s, exp: '' };
  }
  function fmtFrac(x) {
    var n = x.r[0], d = x.r[1], sg = n < 0 ? '-' : '';
    n = Math.abs(n);
    if (d === 1) return sg + n + '.';
    if (x.imp || n < d) return sg + n + SEP + d;
    var w = Math.floor(n / d), rem = n - w * d;
    return sg + w + SEP + rem + SEP + d;
  }
  function fmtDMS(v) {
    var sg = v < 0 ? '-' : '', a = Math.abs(v);
    var tenths = Math.round(a * 36000);
    var d = Math.floor(tenths / 36000), rem = tenths - d * 36000;
    var m = Math.floor(rem / 600); rem -= m * 600;
    var s = Math.floor(rem / 10), t = rem - s * 10;
    function two(q) { return (q < 10 ? '0' : '') + q; }
    return sg + d + '°' + two(m) + "'" + two(s) + '"' + t;
  }

  Calc.prototype.formatValue = function (x) {
    if (x.fr && x.r && x.r[1] !== 1) return { main: fmtFrac(x), exp: '' };
    if (this.notation === 'SCI') return x.v === 0 ? { main: this.fix !== null ? (0).toFixed(this.fix) : '0.', exp: '00' } : fmtSci(x.v, this.fix, false);
    if (this.notation === 'ENG') return x.v === 0 ? { main: this.fix !== null ? (0).toFixed(this.fix) : '0.', exp: '00' } : fmtSci(x.v, this.fix, true);
    return fmtFlo(x.v, this.fix);
  };

  Calc.prototype.display = function () {
    var ind = {
      second: this.second, hyp: this.hyp, angle: this.angle,
      m1: this.memory[0] !== 0, m2: this.memory[1] !== 0, m3: this.memory[2] !== 0,
      stat: this.stat.n > 0, k: !!this.K, paren: this.ops.indexOf('(') >= 0,
      fix: this.fix !== null, sci: this.notation === 'SCI', eng: this.notation === 'ENG',
      x: this.coord === 'x', r: this.coord === 'r', n: !!(this.override && this.override.label === 'n=')
    };
    if (this.off) return { main: '', exp: '', ind: {}, off: true };
    if (this.err) return { main: 'Error', exp: '', ind: ind, error: this.err };
    if (this.entry) {
      var e = this.entry, s;
      if (e.parts.length > 1) s = e.parts.join(SEP);
      else s = e.parts[0] || '0';
      if (e.neg) s = '-' + s;
      var ex = e.ee !== null ? (e.eeNeg ? '-' : '') + (e.ee.length ? (e.ee.length === 1 ? '0' + e.ee : e.ee) : '00') : '';
      return { main: s, exp: ex, ind: ind, entry: true };
    }
    if (this.override && this.override.dms) return { main: fmtDMS(this.x.v), exp: '', ind: ind };
    var f = this.formatValue(this.x);
    return { main: f.main, exp: f.exp, ind: ind };
  };
  Calc.prototype.value = function () { return this.entry ? this.entryValue().v : this.x.v; };
  Calc.prototype.text = function () { var d = this.display(); return d.main + (d.exp ? ' ' + d.exp : ''); };

  /* ---------- key sequences ---------- */
  var ALIAS = {
    '+': 'add', '-': 'sub', '−': 'sub', '*': 'mul', '×': 'mul', 'x': 'mul', '/': 'div', '÷': 'div',
    '=': 'eq', '(': 'lp', ')': 'rp', '^': 'pow', '±': 'neg', '+/-': 'neg', 'ab/c': 'abc', '1/x': 'inv',
    'x²': 'sq', '√': 'sqrt', 'π': 'pi', 'pi': 'pi', 'on/c': 'onc', 'ac': 'onc', '.': 'dot'
  };
  /* Key labels as they are printed on the calculator. 2nd labels expand to 2nd plus the key. */
  var BY1 = {}, BY2 = {};
  Object.keys(KEYS).forEach(function (id) {
    if (KEYS[id][0] && !/^d[0-9]$/.test(id) && id !== 'dot') BY1[KEYS[id][0]] = id;
    if (KEYS[id][1]) BY2[KEYS[id][1]] = id;
  });
  /* Token list for a sequence string. Numbers stay whole, keys are resolved to ids. */
  function tokens(seq) {
    var out = [];
    String(seq).trim().split(/\s+/).forEach(function (tok) {
      if (!tok) return;
      if (/^-?(\d+\.?\d*|\.\d+)$/.test(tok)) { out.push({ num: tok.replace(/^-/, ''), neg: tok[0] === '-' }); return; }
      if (tok === '2nd') { out.push({ key: '2nd' }); return; }
      if (BY2[tok]) { out.push({ key: BY2[tok], second: true }); return; }
      var low = tok.toLowerCase();
      var id = BY1[tok] || (KEYS[tok] ? tok : (KEYS[low] ? low : ALIAS[tok] || ALIAS[low]));
      if (!id) throw new Error('Unknown key token: ' + tok);
      out.push({ key: id });
    });
    return out;
  }
  function parseSeq(seq) {
    var keys = [];
    tokens(seq).forEach(function (t) {
      if (t.key) { if (t.second) keys.push('2nd'); keys.push(t.key); return; }
      t.num.split('').forEach(function (c) { keys.push(c === '.' ? 'dot' : 'd' + c); });
      if (t.neg) keys.push('neg');
    });
    return keys;
  }
  Calc.prototype.run = function (seq) {
    var self = this;
    parseSeq(seq).forEach(function (k) { self.press(k); });
    return this.display();
  };

  var api = {
    Calc: Calc, KEYS: KEYS, LAYOUT: LAYOUT, SECOND: SECOND, PI12: PI12, SEP: SEP,
    parseSeq: parseSeq, tokens: tokens,
    label: function (id, second) { return KEYS[id] ? (second ? KEYS[id][1] : KEYS[id][0]) : id; }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TI30 = api;
})(typeof window !== 'undefined' ? window : this);

/* ===== core-sharp.js ===== */
/* Sharp EL-531XT emulator (normal mode).
   Sources: EL-531XT Operation Manual and Calculation Examples (sharp.ca, EL531XT_OM_En.pdf) and the
   EL-531TH Series Operation Guide (global.sharp, OperationGuide_EL531TH.pdf). See calc2/CALC-MODELS.md.
   D.A.L. (Direct Algebraic Logic): keys are typed in the order the expression is written. The equation line is
   worked out on = (or another calculation-ending key) with the manual's priority levels. */
var SharpEL = (function () {
  'use strict';

  /* Key layout, top to bottom, as on the EL-531XT faceplate (EL-531TH guide p. 3 shows the same layout).
     [id, face label, 2ndF label (orange), ALPHA letter (green)] */
  var LAYOUT = {
    nav: [['2ndf', '2ndF', '', ''], ['home', 'HOME', '', ''], ['onc', 'ON/C', 'OFF', ''], ['mode', 'MODE', 'CA', '']],
    rows: [
      [['alpha', 'ALPHA', 'STAT VAR', ''], ['setup', 'SET UP', '', ''], ['del', 'DEL', 'INS', '']],
      [['hyp', 'hyp', 'arc hyp', ''], ['sin', 'sin', 'sin⁻¹', ''], ['cos', 'cos', 'cos⁻¹', ''], ['tan', 'tan', 'tan⁻¹', ''], ['pi', 'π', 'DRG▸', ''], ['drg', 'DRG', '', '']],
      [['pow', 'yˣ', 'ˣ√', 'A'], ['sqrt', '√', '', 'B'], ['sq', 'x²', 'x⁻¹', 'C'], ['cube', 'x³', '³√', 'D'], ['log', 'log', '10ˣ', 'E'], ['ln', 'ln', 'eˣ', 'F']],
      [['exp', 'Exp', '←,→', ''], ['abc', 'a b/c', 'd/c', ''], ['dms', 'D°M′S', '↔DEG', ''], ['rcl', 'RCL', '', 'X'], ['sto', 'STO', ',', 'Y'], ['mplus', 'M+', 'M−', 'M']],
      [['d7', '7', 'RANDOM', ''], ['d8', '8', '→rθ', ''], ['d9', '9', '→xy', ''], ['lp', '(', '', ''], ['rp', ')', '', '']],
      [['d4', '4', 'n!', ''], ['d5', '5', 'nCr', ''], ['d6', '6', 'nPr', ''], ['mul', '×', '', ''], ['div', '÷', '', '']],
      [['d1', '1', '%', ''], ['d2', '2', '', ''], ['d3', '3', '', ''], ['add', '+', '', ''], ['sub', '−', '', '']],
      [['d0', '0', 'MDF', ''], ['dot', '.', '', ''], ['neg', '+/−', 'M-CLR', ''], ['eq', '=', '', 'ANS']]
    ]
  };
  var KEYS = {};
  LAYOUT.nav.concat.apply(LAYOUT.nav, LAYOUT.rows).forEach(function (k) { KEYS[k[0]] = { face: k[1], second: k[2], alpha: k[3] }; });
  KEYS.up = { face: '▲', second: '', alpha: '' }; KEYS.down = { face: '▼', second: '', alpha: '' };
  KEYS.left = { face: '◀', second: '', alpha: '' }; KEYS.right = { face: '▶', second: '', alpha: '' };
  /* the letter keys used after STO, RCL and ALPHA (green letters on the faceplate) */
  var LETTER = { pow: 'A', sqrt: 'B', sq: 'C', cube: 'D', log: 'E', ln: 'F', rcl: 'X', sto: 'Y', mplus: 'M' };
  var LETTER_KEY = {};
  Object.keys(LETTER).forEach(function (k) { LETTER_KEY[LETTER[k]] = k; });

  var PI = Math.PI;
  function sig(v, n) { return (v === 0 || !isFinite(v)) ? v : Number(v.toPrecision(n)); }
  function SErr(kind) { this.kind = kind; }
  var NEXT = { DEG: 'RAD', RAD: 'GRAD', GRAD: 'DEG' };
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }
  function toFrac(v) {
    if (!isFinite(v)) return null;
    for (var d = 1; d <= 99999; d++) {
      var n = Math.round(v * d);
      if (Math.abs(n / d - v) <= 1e-11 * Math.max(1, Math.abs(v))) { var g = gcd(n, d); return [n / g, d / g]; }
    }
    return null;
  }
  function fracDigits(fr) {
    var n = Math.abs(fr[0]), d = fr[1], w = Math.floor(n / d), r = n - w * d;
    return String(w || '').length + String(r).length + String(d).length;
  }

  function Calc() { this.mem = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, X: 0, Y: 0, M: 0 }; this.ans = 0; this.reset(); }
  Calc.prototype.reset = function () {
    this.angle = 'DEG';
    this.fse = 'NORM1'; this.tab = null;
    this.off = false;
    this.clearEntry();
    this.result = { v: 0, form: 'dec' };
    this.top = '';
    this.state = 'result';
  };
  Calc.prototype.clearEntry = function () {
    this.eq = []; this.num = null; this.second = false; this.alpha = false; this.hypOn = false; this.arcHyp = false;
    this.await = null; this.err = null; this.setup = null; this.coordShown = null;
  };

  /* ---------- typing the equation ---------- */
  function newNum() { return { kind: 'dec', parts: [''], exp: null, expNeg: false, neg: false }; }
  Calc.prototype.startEq = function (keepAns) {
    if (this.state === 'result') {
      this.eq = keepAns ? [{ k: 'ans' }] : [];
      this.state = 'entry';
      this.coordShown = null;
    }
  };
  Calc.prototype.closeNum = function () {
    if (!this.num) return;
    var n = this.num, v, tok = { k: 'num' };
    if (n.kind === 'dms') {
      var p = n.parts.map(function (s) { return parseFloat(s || '0'); });
      v = p[0] + (p[1] || 0) / 60 + (p[2] || 0) / 3600;
      tok.dms = true;
      tok.s = n.parts[0] + '°' + (n.parts.length > 1 ? (n.parts[1] || '0') + '′' : '') + (n.parts.length > 2 ? (n.parts[2] || '0') + '″' : '');
    } else if (n.kind === 'frac') {
      var q = n.parts.map(function (s) { return parseFloat(s || '0'); }), w = 0, nu, de;
      if (q.length === 3) { w = q[0]; nu = q[1]; de = q[2]; } else { nu = q[0]; de = q[1]; }
      if (de === 0) throw new SErr('Error 2');
      v = w + nu / de;
      tok.frac = true; tok.s = n.parts.join('┌');
      tok.imp = q.length === 2 && nu >= de;
    } else {
      v = parseFloat(n.parts[0] || '0');
      if (n.exp !== null) v = v * Math.pow(10, (n.expNeg ? -1 : 1) * parseInt(n.exp || '0', 10));
      tok.s = (n.parts[0] || '0') + (n.exp !== null ? 'E' + (n.expNeg ? '-' : '') + (n.exp || '0') : '');
    }
    if (n.neg) { v = -v; tok.s = '-' + tok.s; }
    tok.v = v;
    this.eq.push(tok);
    this.num = null;
  };
  Calc.prototype.digit = function (ch) {
    this.startEq(false);
    if (!this.num) this.num = newNum();
    var n = this.num;
    if (n.exp !== null) { if (ch !== '.') n.exp = (n.exp + ch).slice(-2); return; }
    var i = n.parts.length - 1, cur = n.parts[i];
    if (ch === '.') { if (cur.indexOf('.') < 0) n.parts[i] = (cur || '0') + '.'; return; }
    /* the entry stops at the 10 digit cells of the display (a leading 0 before the point takes a cell) */
    if (n.parts.join('').replace(/\D/g, '').length >= 10) return;
    n.parts[i] = (cur === '0' ? '' : cur) + ch;
  };
  Calc.prototype.push = function (tok) { this.closeNum(); this.eq.push(tok); };

  /* ---------- working out the equation line ----------
     Priority levels from the manual ("Priority Levels in Calculation"), highest first: fractions, functions after
     their argument (x⁻¹, x², n!), yˣ and ˣ√, implied multiplication, functions before their argument (sin, √ ...),
     nCr and nPr, × and ÷, + and −, then = and the other calculation-ending keys. */
  Calc.prototype.toRad = function (a) { return this.angle === 'DEG' ? a * PI / 180 : this.angle === 'GRAD' ? a * PI / 200 : a; };
  Calc.prototype.fromRad = function (a) { return this.angle === 'DEG' ? a * 180 / PI : this.angle === 'GRAD' ? a * 200 / PI : a; };
  function clean(v) { return Math.abs(v) < 1e-13 ? 0 : v; }
  Calc.prototype.fn = function (f, x) {
    var h = f.h;
    switch (f.fn) {
      case 'sin': return h === 'hyp' ? Math.sinh(x) : h === 'arc' ? Math.asinh(x) : clean(Math.sin(this.toRad(x)));
      case 'cos': if (h === 'hyp') return Math.cosh(x); if (h === 'arc') { if (x < 1) throw new SErr('Error 2'); return Math.acosh(x); } return clean(Math.cos(this.toRad(x)));
      case 'tan':
        if (h === 'hyp') return Math.tanh(x);
        if (h === 'arc') { if (Math.abs(x) >= 1) throw new SErr('Error 2'); return Math.atanh(x); }
        var q = this.angle === 'DEG' ? x / 90 : this.angle === 'GRAD' ? x / 100 : null;
        if (q !== null && Math.abs(q - Math.round(q)) < 1e-12 && Math.round(q) % 2) throw new SErr('Error 2');
        return clean(Math.tan(this.toRad(x)));
      case 'asin': if (Math.abs(x) > 1) throw new SErr('Error 2'); return this.fromRad(Math.asin(x));
      case 'acos': if (Math.abs(x) > 1) throw new SErr('Error 2'); return this.fromRad(Math.acos(x));
      case 'atan': return this.fromRad(Math.atan(x));
      case 'sqrt': if (x < 0) throw new SErr('Error 2'); return Math.sqrt(x);
      case 'cbrt': return Math.cbrt(x);
      case 'log': if (x <= 0) throw new SErr('Error 2'); return Math.log10(x);
      case 'ln': if (x <= 0) throw new SErr('Error 2'); return Math.log(x);
      case 'tenx': return Math.pow(10, x);
      case 'ex': return Math.exp(x);
    }
    throw new SErr('Error 1');
  };
  function isInt(v) { return Math.abs(v - Math.round(v)) < 1e-9; }
  Calc.prototype.evaluate = function (toks) {
    var self = this, p = 0;
    function peek() { return toks[p]; }
    function is(k, sub) { var t = toks[p]; return t && t.k === k && (sub === undefined || t.op === sub); }
    function startsPrimary(t) { return t && (t.k === 'num' || t.k === 'lp' || t.k === 'pi' || t.k === 'var' || t.k === 'ans' || t.k === 'pre'); }
    function sum() {
      var v = prod();
      while (is('op', 'add') || is('op', 'sub')) { var o = toks[p++].op, r = prod(); v = o === 'add' ? v + r : v - r; }
      return v;
    }
    function prod() {
      var v = comb();
      while (is('op', 'mul') || is('op', 'div')) {
        var o = toks[p++].op, r = comb();
        if (o === 'div' && r === 0) throw new SErr('Error 2');
        v = o === 'mul' ? v * r : v / r;
      }
      return v;
    }
    function comb() {
      var v = implied();
      while (is('ncr') || is('npr')) {
        var o = toks[p++].k, r = implied();
        if (!isInt(v) || !isInt(r) || v < 0 || r < 0 || r > v) throw new SErr('Error 2');
        var n = Math.round(v), k = Math.round(r), out = 1, i;
        if (o === 'npr') for (i = 0; i < k; i++) out *= (n - i);
        else { k = Math.min(k, n - k); for (i = 1; i <= k; i++) out = out * (n - k + i) / i; out = Math.round(out); }
        v = out;
      }
      return v;
    }
    function implied() {
      var v = prefix();
      while (startsPrimary(peek())) v = v * prefix();
      return v;
    }
    function prefix() {
      var t = peek();
      if (t && t.k === 'pre') { p++; return self.fn(t, prefix2()); }
      if (t && t.k === 'neg') { p++; return -prefix2(); }
      return power();
    }
    /* the argument of a function written before it: everything of a higher priority (powers, x² ...) */
    function prefix2() { var t = peek(); if (t && (t.k === 'pre' || t.k === 'neg')) return prefix(); return power(); }
    function power() {
      var v = postfix();
      while (is('pow') || is('root')) {
        var o = toks[p++].k, r = (peek() && (peek().k === 'pre' || peek().k === 'neg')) ? prefix() : postfix();
        if (o === 'pow') {
          if (v === 0 && r <= 0) throw new SErr('Error 2');
          if (v < 0 && !isInt(r)) {
            var inv = 1 / r;
            if (isInt(inv) && Math.round(inv) % 2) { v = -Math.pow(-v, r); continue; }
            throw new SErr('Error 2');
          }
          v = Math.pow(v, r);
        } else {
          /* the x-th root of y, keyed x 2ndF ˣ√ y */
          if (v === 0) throw new SErr('Error 2');
          if (r < 0) { if (isInt(v) && Math.round(v) % 2) { v = -Math.pow(-r, 1 / v); continue; } throw new SErr('Error 2'); }
          v = Math.pow(r, 1 / v);
        }
      }
      return v;
    }
    function postfix() {
      var v = primary();
      while (is('fbar')) { p++; var den = primary(); if (den === 0) throw new SErr('Error 2'); v = v / den; }
      while (is('post')) {
        var f = toks[p++].fn;
        if (f === 'sq') v = v * v;
        else if (f === 'cube') v = v * v * v;
        else if (f === 'inv') { if (v === 0) throw new SErr('Error 2'); v = 1 / v; }
        else if (f === 'fact') {
          if (!isInt(v) || v < 0 || v > 69) throw new SErr('Error 2');
          var r = 1; for (var i = 2; i <= Math.round(v); i++) r *= i; v = r;
        }
      }
      return v;
    }
    function primary() {
      var t = toks[p++];
      if (!t) throw new SErr('Error 1');
      if (t.k === 'num') return t.v;
      if (t.k === 'pi') return PI;
      if (t.k === 'var') return self.mem[t.name];
      if (t.k === 'ans') return self.ans;
      if (t.k === 'lp') {
        var v = sum();
        if (is('rp')) p++;
        else if (p < toks.length) throw new SErr('Error 1');
        return v;
      }
      if (t.k === 'pre' || t.k === 'neg') { p--; return prefix(); }
      throw new SErr('Error 1');
    }
    var out = sum();
    if (p < toks.length) throw new SErr('Error 1');
    if (!isFinite(out) || Math.abs(out) >= 1e100) throw new SErr('Error 2');
    return sig(out, 14);
  };
  /* A result shows as a fraction when a fraction was keyed and only arithmetic was done. It shows in degrees,
     minutes and seconds when D°M′S values were keyed and no function or plain number was added or subtracted
     (Calculation Examples [8] and [10]). */
  Calc.prototype.formOf = function (toks, v) {
    var hasFrac = toks.some(function (t) { return t.frac; }), hasDms = toks.some(function (t) { return t.dms; });
    /* a plain decimal number keyed with a fraction gives a decimal result (Calculation Examples [8]: 1.25 + 2/5 = 1.65) */
    var hasDec = toks.some(function (t) { return t.k === 'num' && !t.frac && !t.dms && /\.|E/.test(t.s); });
    /* the first fraction keyed sets the form: 7┌5 (improper) gives 16807┌3125, 3┌1┌2 gives 4┌5┌6 (Calculation Examples [8]) */
    var firstFr = toks.filter(function (t) { return t.frac; })[0], imp = !!(firstFr && firstFr.imp);
    var fnUsed = toks.some(function (t) { return t.k === 'pre' && t.fn !== 'sqrt'; });
    if (hasFrac && !fnUsed && !hasDec && !hasDms) {
      var fr = toFrac(v);
      if (fr && fracDigits(fr) <= 10) return { form: fr[1] === 1 ? 'dec' : 'frac', fr: fr, imp: imp };
    }
    if (hasDms && !toks.some(function (t) { return t.k === 'pre' || t.k === 'post'; })) {
      var mixed = false;
      toks.forEach(function (t, i) {
        if (t.k === 'num' && !t.dms) {
          var prev = toks[i - 1], next = toks[i + 1];
          if ((prev && prev.k === 'op' && (prev.op === 'add' || prev.op === 'sub')) || (next && next.k === 'op' && (next.op === 'add' || next.op === 'sub'))) mixed = true;
        }
      });
      if (!mixed) return { form: 'dms' };
    }
    return { form: 'dec' };
  };
  var PRE_TXT = { sin: 'sin', cos: 'cos', tan: 'tan', asin: 'sin⁻¹', acos: 'cos⁻¹', atan: 'tan⁻¹', sqrt: '√', cbrt: '³√', log: 'log', ln: 'ln', tenx: '10^', ex: 'e^' };
  Calc.prototype.eqText = function (toks) {
    var s = '';
    toks.forEach(function (t) {
      switch (t.k) {
        case 'num': s += t.s; break;
        case 'op': s += { add: '+', sub: '−', mul: '×', div: '÷' }[t.op]; break;
        case 'lp': s += '('; break;
        case 'rp': s += ')'; break;
        case 'pi': s += 'π'; break;
        case 'var': s += t.name; break;
        case 'ans': s += 'ANS'; break;
        case 'neg': s += '−'; break;
        case 'pow': s += '^'; break;
        case 'root': s += 'ˣ√'; break;
        case 'ncr': s += 'C'; break;
        case 'npr': s += 'P'; break;
        case 'comma': s += ','; break;
        case 'fbar': s += '┌'; break;
        case 'post': s += { sq: '²', cube: '³', inv: '⁻¹', fact: '!' }[t.fn]; break;
        case 'pre': s += (t.h === 'arc' ? 'arc' : '') + (PRE_TXT[t.fn] || t.fn) + (t.h ? 'h' : ''); break;
      }
    });
    return s;
  };
  /* = and the other calculation-ending keys */
  Calc.prototype.finishEq = function (endText) {
    this.closeNum();
    var toks = this.eq;
    if (this.state === 'result') return this.result.v;
    /* a function keyed straight after a result, with nothing after it, works on that result (Calculation Examples [7]: √ANS) */
    if (toks.length && toks[toks.length - 1].k === 'pre') toks.push({ k: 'ans' });
    var v = this.evaluate(toks);
    var f = this.formOf(toks, v);
    this.result = { v: v, form: f.form, fr: f.fr, imp: !!f.imp };
    this.ans = v;
    this.top = this.eqText(toks) + (endText === undefined ? '=' : endText);
    this.state = 'result';
    return v;
  };
  Calc.prototype.percent = function () {
    /* 2ndF %, from Calculation Examples [4]: a×b% = a×b÷100, a÷b% = a÷b×100, a+b% = a+a×b÷100, a−b% = a−a×b÷100 */
    this.closeNum();
    var toks = this.eq, i = toks.length - 1, depth = 0;
    for (; i >= 0; i--) {
      var t = toks[i];
      if (t.k === 'rp') depth++;
      else if (t.k === 'lp') depth--;
      else if (depth === 0 && t.k === 'op') break;
    }
    var b = this.evaluate(toks.slice(i + 1)), v;
    if (i < 0) v = b / 100;
    else {
      var a = this.evaluate(toks.slice(0, i)), op = toks[i].op;
      v = op === 'mul' ? a * b / 100 : op === 'div' ? a / b * 100 : op === 'add' ? a + a * b / 100 : a - a * b / 100;
    }
    v = sig(v, 14);
    this.top = this.eqText(toks) + '%';
    this.result = { v: v, form: 'dec' };
    this.ans = v; this.state = 'result';
  };
  Calc.prototype.coord = function (kind) {
    this.closeNum();
    var toks = this.eq, at = -1;
    toks.forEach(function (t, i) { if (t.k === 'comma') at = i; });
    if (at < 0) throw new SErr('Error 1');
    var a = this.evaluate(toks.slice(0, at)), b = this.evaluate(toks.slice(at + 1)), r1, r2;
    if (kind === 'rp') { r1 = Math.sqrt(a * a + b * b); r2 = this.fromRad(Math.atan2(b, a)); }
    else { var th = this.toRad(b); r1 = clean(a * Math.cos(th)); r2 = clean(a * Math.sin(th)); }
    r1 = sig(r1, 14); r2 = sig(r2, 14);
    /* the results go to memories X and Y (Coordinate Conversions) */
    this.mem.X = r1; this.mem.Y = r2;
    this.top = this.eqText(toks);
    this.result = { v: r1, form: 'dec' };
    this.coordShown = { kind: kind, which: 0 };
    this.ans = r1; this.state = 'result';
  };

  /* ---------- keys ---------- */
  Calc.prototype.press = function (key) {
    if (!KEYS[key]) throw new Error('Unknown Sharp key: ' + key);
    if (this.off) { if (key === 'onc') { this.off = false; this.clearEntry(); this.state = 'result'; this.result = { v: 0, form: 'dec' }; this.top = ''; } return; }
    if (this.err) { if (key === 'onc') { this.clearEntry(); this.state = 'result'; this.result = { v: 0, form: 'dec' }; this.top = ''; } return; }
    try { this.key(key); } catch (e) {
      if (e instanceof SErr) { this.err = e.kind; this.second = false; this.alpha = false; }
      else throw e;
    }
  };
  Calc.prototype.key = function (key) {
    var sec = this.second;
    if (this.await) {
      var aw = this.await; this.await = null;
      var letter = LETTER[key];
      if (!letter) return;
      if (aw === 'sto') {
        var v = this.state === 'entry' ? this.finishEq('⇒' + letter) : this.result.v;
        this.mem[letter] = v;
        if (!/⇒[A-Z]$/.test(this.top)) this.top = this.fmtPlain(v) + '⇒' + letter;
        return;
      }
      if (aw === 'rcl' && this.state === 'result') {
        /* RCL on its own shows the memory (Memory Calculations, example 1: RCL M shows M=) */
        this.eq = [{ k: 'var', name: letter }]; this.state = 'entry';
        return;
      }
      this.startEq(false);
      this.push({ k: 'var', name: letter });
      return;
    }
    if (key === '2ndf') { this.second = !this.second; this.alpha = false; return; }
    if (key === 'alpha') { if (sec) { this.second = false; return; } this.alpha = !this.alpha; this.await = this.alpha ? 'alpha' : null; return; }
    this.second = false; this.alpha = false;
    if (key === 'onc') {
      if (sec) { this.off = true; return; }
      this.clearEntry(); this.state = 'result'; this.result = { v: 0, form: 'dec' }; this.top = '';
      return;
    }
    if (/^d[0-9]$/.test(key) && sec) {
      var sk = { d8: 'rp', d9: 'xy', d4: 'fact', d5: 'ncr', d6: 'npr', d1: 'pct' }[key];
      if (sk === 'rp' || sk === 'xy') { this.coord(sk); return; }
      if (sk === 'fact') { this.startEq(true); this.push({ k: 'post', fn: 'fact' }); return; }
      if (sk === 'ncr' || sk === 'npr') { this.startEq(true); this.push({ k: sk }); return; }
      if (sk === 'pct') { this.percent(); return; }
      return;
    }
    if (/^d[0-9]$/.test(key)) { this.digit(key.slice(1)); return; }
    switch (key) {
      case 'dot': this.digit('.'); return;
      case 'exp':
        if (sec) { /* ← , → shows the other coordinate result */
          if (this.coordShown) {
            this.coordShown.which = 1 - this.coordShown.which;
            this.result = { v: this.coordShown.which ? this.mem.Y : this.mem.X, form: 'dec' };
          }
          return;
        }
        if (!this.num) this.digit('1');
        if (this.num.kind === 'dec' && this.num.exp === null) this.num.exp = '';
        return;
      case 'neg':
        if (sec) { this.mem = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, X: 0, Y: 0, M: 0 }; return; }
        if (this.num && this.num.exp !== null) { this.num.expNeg = !this.num.expNeg; return; }
        if (this.num) { this.num.neg = !this.num.neg; return; }
        this.startEq(false);
        this.eq.push({ k: 'neg' });
        return;
      case 'abc':
        if (sec) { if (this.state === 'result' && this.result.form === 'frac') this.result.imp = !this.result.imp; return; }
        if (this.num && this.num.kind !== 'dms' && this.num.exp === null && this.num.parts.length < 3) {
          this.num.kind = 'frac'; this.num.parts.push(''); return;
        }
        /* a b/c after a D°M′S value divides it, as a fraction (Calculation Examples [8]: 1°2′3″ over 2) */
        if (this.num && this.num.kind === 'dms') { this.push({ k: 'fbar' }); return; }
        if (this.state === 'result') {
          /* a b/c on a result switches between fraction and decimal (Fractional Calculations) */
          if (this.result.form === 'frac') this.result = { v: this.result.v, form: 'dec', wasFr: this.result.fr };
          else { var fr = this.result.wasFr || toFrac(this.result.v); if (fr && fr[1] !== 1 && fracDigits(fr) <= 10) this.result = { v: this.result.v, form: 'frac', fr: fr, imp: false }; }
        }
        return;
      case 'dms':
        if (sec) { /* ↔DEG */
          if (this.state === 'entry') this.finishEq('=');
          this.result = { v: this.result.v, form: this.result.form === 'dms' ? 'dec' : 'dms' };
          return;
        }
        if (!this.num) this.digit('0');
        if (this.num.kind === 'dec' && this.num.exp === null && this.num.parts.length === 1) { this.num.kind = 'dms'; this.num.parts.push(''); return; }
        if (this.num.kind === 'dms' && this.num.parts.length < 3) { this.num.parts.push(''); return; }
        return;
      case 'pi':
        if (sec) { /* DRG▸ changes the value to the next angle unit and switches to it (Calculation Examples [5]) */
          if (this.state === 'entry') this.finishEq('=');
          var v0 = this.result.v, to = NEXT[this.angle], r;
          if (this.angle === 'DEG') r = v0 * PI / 180; else if (this.angle === 'RAD') r = v0 * 200 / PI; else r = v0 * 0.9;
          this.angle = to; r = sig(r, 14);
          this.result = { v: r, form: 'dec' }; this.ans = r;
          return;
        }
        this.startEq(false); this.push({ k: 'pi' }); return;
      case 'drg': this.angle = NEXT[this.angle]; return;
      case 'hyp':
        if (sec) { this.arcHyp = true; this.hypOn = false; } else { this.hypOn = true; this.arcHyp = false; }
        return;
      case 'sin': case 'cos': case 'tan': {
        this.startEq(false);
        var fnm = key, h = null;
        if (this.hypOn) h = 'hyp'; else if (this.arcHyp) h = 'arc'; else if (sec) fnm = 'a' + key;
        this.hypOn = false; this.arcHyp = false;
        this.push({ k: 'pre', fn: fnm, h: h });
        return;
      }
      case 'sqrt': this.startEq(false); this.push({ k: 'pre', fn: 'sqrt' }); return;
      case 'log': this.startEq(false); this.push({ k: 'pre', fn: sec ? 'tenx' : 'log' }); return;
      case 'ln': this.startEq(false); this.push({ k: 'pre', fn: sec ? 'ex' : 'ln' }); return;
      case 'cube':
        if (sec) { this.startEq(false); this.push({ k: 'pre', fn: 'cbrt' }); return; }
        this.startEq(true); this.push({ k: 'post', fn: 'cube' }); return;
      case 'sq': this.startEq(true); this.push({ k: 'post', fn: sec ? 'inv' : 'sq' }); return;
      case 'pow': this.startEq(true); this.push({ k: sec ? 'root' : 'pow' }); return;
      case 'add': case 'sub': case 'mul': case 'div': this.startEq(true); this.push({ k: 'op', op: key }); return;
      case 'lp': this.startEq(false); this.push({ k: 'lp' }); return;
      case 'rp': this.startEq(true); this.push({ k: 'rp' }); return;
      case 'eq':
        if (this.state === 'result') return;
        this.finishEq('='); return;
      case 'sto':
        if (sec) { this.startEq(true); this.push({ k: 'comma' }); return; }
        this.await = 'sto'; return;
      case 'rcl': this.await = 'rcl'; return;
      case 'mplus': {
        var mv = this.state === 'entry' ? this.finishEq(sec ? 'M−' : 'M+') : this.result.v;
        this.mem.M = sig(this.mem.M + (sec ? -mv : mv), 14);
        return;
      }
      case 'del':
        if (this.num) {
          var nn = this.num, li = nn.parts.length - 1;
          if (nn.exp !== null) { if (nn.exp.length) nn.exp = nn.exp.slice(0, -1); else nn.exp = null; }
          else if (nn.parts[li].length) nn.parts[li] = nn.parts[li].slice(0, -1);
          else if (li > 0) nn.parts.pop();
          else this.num = null;
          return;
        }
        if (this.state === 'entry') this.eq.pop();
        return;
      case 'home': case 'mode': this.clearEntry(); this.state = 'result'; this.result = { v: 0, form: 'dec' }; this.top = ''; return;
      case 'setup': return;
    }
  };

  /* ---------- display ---------- */
  function group(intStr) { return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, '’'); }
  /* NORM1 (the default): 10 digits, plain notation for 0.000000001 to 9999999999 ("Setting the Floating Point Numbers System") */
  function fmtNorm(v) {
    if (v === 0) return { main: '0.', exp: '' };
    var a = Math.abs(v), sg = v < 0 ? '-' : '';
    var r = Number(a.toPrecision(10));
    if (r >= 1e-9 && r <= 9999999999) {
      var intDigits = r >= 1 ? Math.floor(Math.log10(r) + 1e-12) + 1 : 1;
      var dec = Math.max(0, 10 - intDigits);
      var s = r.toFixed(Math.min(20, dec + 2));
      var ip = s.split('.')[0], fp = (s.split('.')[1] || '').slice(0, dec).replace(/0+$/, '');
      return { main: sg + group(ip) + '.' + fp, exp: '' };
    }
    var e = Math.floor(Math.log10(r)), m = r / Math.pow(10, e);
    if (Number(m.toPrecision(10)) >= 10) { e += 1; m = r / Math.pow(10, e); }
    var ms = Number(m.toPrecision(10)).toString();
    if (ms.indexOf('.') < 0) ms += '.';
    return { main: sg + ms, exp: String(e) };
  }
  function fmtDms(v) {
    var sg = v < 0 ? '-' : '', a = Math.abs(v);
    var d = Math.floor(a + 1e-12), mr = (a - d) * 60, m = Math.floor(mr + 1e-9), s = sig((mr - m) * 60, 10);
    if (s >= 60 - 1e-7) { s = 0; m += 1; }
    if (m >= 60) { m = 0; d += 1; }
    var ss = String(Number(s.toFixed(Math.max(0, 8 - String(d).length - String(m).length))));
    return sg + d + '°' + m + '′' + ss + '″';
  }
  function fmtFrac(fr, imp) {
    var n = fr[0], d = fr[1], sg = n < 0 ? '-' : '';
    n = Math.abs(n);
    if (d === 1) return sg + n + '.';
    if (imp || n < d) return sg + n + '┌' + d;
    var w = Math.floor(n / d);
    return sg + w + '┌' + (n - w * d) + '┌' + d;
  }
  Calc.prototype.fmtPlain = function (v) { return fmtNorm(v).main.replace(/’/g, ''); };
  Calc.prototype.display = function () {
    var ind = { second: this.second, hyp: this.hypOn || this.arcHyp, arc: this.arcHyp, alpha: this.alpha || this.await === 'alpha', angle: this.angle,
      m: this.mem.M !== 0, sto: this.await === 'sto', rcl: this.await === 'rcl' };
    if (this.off) return { top: '', main: '', exp: '', ind: {}, off: true };
    if (this.err) return { top: '', main: this.err, exp: '', ind: ind, error: this.err };
    if (this.state === 'entry') {
      var top = this.eqText(this.eq), main = '0.', exp = '';
      if (this.num) {
        var n = this.num;
        if (n.kind === 'dms') main = n.parts[0] + '°' + (n.parts.length > 1 ? n.parts[1] + '′' : '') + (n.parts.length > 2 ? n.parts[2] + '″' : '');
        else if (n.kind === 'frac') main = n.parts.join('┌');
        else { main = (n.parts[0] || '0'); exp = n.exp !== null ? (n.expNeg ? '-' : '') + ('0' + n.exp).slice(-2) : ''; }
        if (n.neg) main = '-' + main;
      } else if (this.eq.length === 1 && this.eq[0].k === 'var') {
        main = fmtNorm(this.mem[this.eq[0].name]).main;
        top = this.eq[0].name + '=';
      } else {
        main = fmtNorm(this.result.v).main;
      }
      return { top: top, main: main, exp: exp, ind: ind, entry: true };
    }
    var r = this.result, f;
    if (r.form === 'frac' && r.fr) f = { main: fmtFrac(r.fr, r.imp), exp: '' };
    else if (r.form === 'dms') f = { main: fmtDms(r.v), exp: '' };
    else f = fmtNorm(r.v);
    var label = this.coordShown ? (this.coordShown.kind === 'rp' ? ['r=', 'θ='] : ['x=', 'y='])[this.coordShown.which] : null;
    return { top: label || this.top, main: f.main, exp: f.exp, ind: ind, form: r.form };
  };
  Calc.prototype.value = function () {
    if (this.state === 'entry') {
      if (this.num) {
        var keepEq = this.eq.slice(), n = this.num;
        this.num = JSON.parse(JSON.stringify(n));
        this.closeNum();
        var t = this.eq.pop();
        this.eq = keepEq; this.num = n;
        return t.v;
      }
      if (this.eq.length === 1 && this.eq[0].k === 'var') return this.mem[this.eq[0].name];
      return this.result.v;
    }
    return this.result.v;
  };
  Calc.prototype.text = function () { var d = this.display(); return d.main + (d.exp ? ' ' + d.exp : ''); };
  Calc.prototype.run = function (keys) { var self = this; keys.forEach(function (k) { self.press(k); }); return this.display(); };

  return { Calc: Calc, KEYS: KEYS, LAYOUT: LAYOUT, LETTER: LETTER, LETTER_KEY: LETTER_KEY, fmtDms: fmtDms, fmtNorm: fmtNorm };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = SharpEL;

/* ===== core-hp.js ===== */
/* HP-15C emulator (RPN, Run mode, real numbers).
   Sources: HP-15C Owner's Handbook (hp15c-oh-en.pdf, edition 2.4) and the HP 15c Collector's Edition Owner's Handbook
   (hp15c-ce-oh-en.pdf, edition 3, February 2023). Page numbers in comments are the printed pages, which are the same in
   both handbooks. See calc2/CALC-MODELS.md. */
var HP15C = (function () {
  'use strict';

  /* Keyboard, four rows of ten as on the calculator. [id, face, gold f label (above), blue g label (lower face)] */
  var ROWS = [
    [['sqrt', '√x', 'A', 'x²'], ['ex', 'eˣ', 'B', 'LN'], ['tenx', '10ˣ', 'C', 'LOG'], ['pow', 'yˣ', 'D', '%'], ['inv', '1/x', 'E', 'Δ%'],
      ['chs', 'CHS', 'MATRIX', 'ABS'], ['d7', '7', 'FIX', 'DEG'], ['d8', '8', 'SCI', 'RAD'], ['d9', '9', 'ENG', 'GRD'], ['div', '÷', 'SOLVE', 'x≤y']],
    [['sst', 'SST', 'LBL', 'BST'], ['gto', 'GTO', 'HYP', 'HYP⁻¹'], ['sin', 'SIN', 'DIM', 'SIN⁻¹'], ['cos', 'COS', '(i)', 'COS⁻¹'], ['tan', 'TAN', 'I', 'TAN⁻¹'],
      ['eex', 'EEX', 'RESULT', 'π'], ['d4', '4', 'x≶', 'SF'], ['d5', '5', 'DSE', 'CF'], ['d6', '6', 'ISG', 'F?'], ['mul', '×', '∫ˣᵧ', 'x=0']],
    [['rs', 'R/S', 'PSE', 'P/R'], ['gsb', 'GSB', 'Σ', 'RTN'], ['rdn', 'R↓', 'PRGM', 'R↑'], ['xy', 'x≶y', 'REG', 'RND'], ['back', '←', 'PREFIX', 'CLx'],
      ['enter', 'ENTER', 'RAN #', 'LSTx'], ['d1', '1', '→R', '→P'], ['d2', '2', '→H.MS', '→H'], ['d3', '3', '→RAD', '→DEG'], ['sub', '−', 'Re≶Im', 'TEST']],
    [['on', 'ON', '', ''], ['f', 'f', '', ''], ['g', 'g', '', ''], ['sto', 'STO', 'FRAC', 'INT'], ['rcl', 'RCL', 'USER', 'MEM'],
      ['enter2', '', '', ''], ['d0', '0', 'x!', 'x̄'], ['dot', '.', 'ŷ,r', 's'], ['sigma', 'Σ+', 'L.R.', 'Σ−'], ['add', '+', 'Py,x', 'Cy,x']]
  ];
  var KEYS = {};
  ROWS.forEach(function (r) { r.forEach(function (k) { if (k[0] !== 'enter2') KEYS[k[0]] = { face: k[1], f: k[2], g: k[3] }; }); });

  var PI10 = 3.141592654; /* "the first 10 digits of π" (p. 24) */
  var MAXV = 9.999999999e99;
  function HErr(n) { this.n = n; }
  /* every result is rounded to 10 significant digits (p. 60, Round-Off Error) */
  /* test switch only: true skips the 10-digit rounding, to tell a translation error from the HP's own rounding */
  var unrounded = false;
  function r10(v) {
    if (typeof v !== 'number' || isNaN(v)) throw new HErr(0);
    if (v === 0 || unrounded) return v;
    if (Math.abs(v) > MAXV) return v > 0 ? MAXV : -MAXV;
    if (Math.abs(v) < 1e-99) return 0;
    return Number(v.toPrecision(10));
  }
  function isInt(v) { return Math.abs(v - Math.round(v)) < 1e-9; }
  function hms2h(v) {
    var sg = v < 0 ? -1 : 1, a = Math.abs(v), h = Math.floor(a + 1e-12);
    var rest = Math.round((a - h) * 1e10) / 1e8, m = Math.floor(rest + 1e-9), s = (rest - m) * 100;
    return sg * (h + m / 60 + s / 3600);
  }
  function h2hms(v) {
    var sg = v < 0 ? -1 : 1, a = Math.abs(v), h = Math.floor(a + 1e-12);
    var mr = (a - h) * 60, m = Math.floor(mr + 1e-9), s = (mr - m) * 60;
    if (s >= 60 - 1e-7) { s = 0; m += 1; }
    if (m >= 60) { m -= 60; h += 1; }
    return sg * (h + m / 100 + s / 10000);
  }

  function Calc() { this.R = []; for (var i = 0; i < 20; i++) this.R.push(0); this.powerOn(); }
  Calc.prototype.powerOn = function () {
    this.x = 0; this.y = 0; this.z = 0; this.t = 0; this.lastx = 0;
    this.lift = true; this.entry = null; this.prefix = null; this.await = null; this.hyp = null;
    this.angle = 'DEG'; this.fmt = { mode: 'FIX', n: 4 }; this.err = null; this.off = false;
  };

  /* ---------- the stack (section 3 and appendix B) ---------- */
  Calc.prototype.liftStack = function () { this.t = this.z; this.z = this.y; this.y = this.x; };
  Calc.prototype.drop = function () { this.y = this.z; this.z = this.t; };
  Calc.prototype.endEntry = function () {
    if (!this.entry) return;
    var e = this.entry, v = parseFloat((e.neg ? '-' : '') + (e.mant || '0'));
    if (e.exp !== null) v = v * Math.pow(10, (e.expNeg ? -1 : 1) * parseInt(e.exp || '0', 10));
    this.x = r10(v);
    this.entry = null;
  };
  /* a new number keyed or recalled: the stack lifts first when lift is enabled (p. 36) */
  Calc.prototype.newNumber = function (v) {
    this.endEntry();
    if (this.lift) this.liftStack();
    this.x = r10(v);
    this.lift = true;
  };
  Calc.prototype.startEntry = function () {
    this.endEntry();
    if (this.lift) this.liftStack();
    this.entry = { mant: '', exp: null, expNeg: false, neg: false };
    this.x = 0;
    /* a keyed number is lifted by the next number keyed or recalled: digit entry leaves the lift enabled, so
       CLx 7 π lifts 7 into Y (pp. 209-211: only ENTER, CLx, Σ+, Σ− disable; CHS, EEX, ← are neutral during entry) */
    this.lift = true;
  };
  Calc.prototype.digit = function (ch) {
    if (!this.entry) this.startEntry();
    var e = this.entry;
    if (e.exp !== null) { if (ch !== '.') e.exp = (e.exp + ch).slice(-2); return; }
    if (ch === '.') { if (e.mant.indexOf('.') < 0) e.mant = (e.mant || '0') + '.'; return; }
    if (e.mant.replace(/\D/g, '').length >= 10) return;
    e.mant = (e.mant === '0' ? '' : e.mant) + ch;
  };
  Calc.prototype.unary = function (f) {
    this.endEntry();
    this.lastx = this.x;
    this.x = r10(f(this.x));
    this.lift = true;
  };
  Calc.prototype.binary = function (f) {
    this.endEntry();
    var y = this.y, x = this.x;
    var v = r10(f(y, x));
    this.lastx = x;
    this.x = v; this.drop();
    this.lift = true;
  };
  Calc.prototype.toRad = function (a) { return this.angle === 'DEG' ? a * Math.PI / 180 : this.angle === 'GRAD' ? a * Math.PI / 200 : a; };
  Calc.prototype.fromRad = function (a) { return this.angle === 'DEG' ? a * 180 / Math.PI : this.angle === 'GRAD' ? a * 200 / Math.PI : a; };
  function clean(v) { return Math.abs(v) < 1e-12 ? 0 : v; }
  function fact(v) { if (!isInt(v) || v < 0 || v > 69) throw new HErr(0); var r = 1; for (var i = 2; i <= Math.round(v); i++) r *= i; return r; }
  function comb(y, x, perm) {
    if (!isInt(y) || !isInt(x) || y < 0 || x < 0 || x > y) throw new HErr(0);
    var n = Math.round(y), k = Math.round(x), p = 1, i;
    if (perm) { for (i = 0; i < k; i++) p *= (n - i); return p; }
    k = Math.min(k, n - k); for (i = 1; i <= k; i++) p = p * (n - k + i) / i; return Math.round(p);
  }
  var REG = { d0: 0, d1: 1, d2: 2, d3: 3, d4: 4, d5: 5, d6: 6, d7: 7, d8: 8, d9: 9 };

  Calc.prototype.press = function (key) {
    if (!KEYS[key]) throw new Error('Unknown HP-15C key: ' + key);
    if (this.off) { if (key === 'on') this.off = false; return; }
    /* any key clears an Error display and is not otherwise carried out (p. 61) */
    if (this.err !== null) { this.err = null; return; }
    try { this.key(key); } catch (e) {
      if (e instanceof HErr) { this.err = e.n; this.prefix = null; this.await = null; this.hyp = null; this.entry = null; }
      else throw e;
    }
  };
  Calc.prototype.key = function (key) {
    var self = this;
    if (key === 'on') { this.off = true; return; }
    /* register address after STO, RCL or f x≶ (p. 42): 0-9, or . then 0-9 */
    if (this.await) {
      var aw = this.await;
      if (key === 'dot' && !aw.dot) { aw.dot = true; return; }
      if (!aw.arith && (key === 'add' || key === 'sub' || key === 'mul' || key === 'div') && (aw.op === 'sto' || aw.op === 'rcl')) { aw.arith = key; return; }
      this.await = null;
      if (!(key in REG)) return;
      var n = REG[key] + (aw.dot ? 10 : 0);
      this.endEntry();
      if (aw.op === 'sto') {
        if (aw.arith) {
          var cur = this.R[n], x0 = this.x;
          this.R[n] = r10(aw.arith === 'add' ? cur + x0 : aw.arith === 'sub' ? cur - x0 : aw.arith === 'mul' ? cur * x0 : (function () { if (x0 === 0) throw new HErr(0); return cur / x0; })());
        } else this.R[n] = this.x;
        this.lift = true;
      } else if (aw.op === 'rcl') {
        if (aw.arith) {
          var r = this.R[n], xv = this.x;
          this.lastx = xv;
          this.x = r10(aw.arith === 'add' ? xv + r : aw.arith === 'sub' ? xv - r : aw.arith === 'mul' ? xv * r : (function () { if (r === 0) throw new HErr(0); return xv / r; })());
          this.lift = true;
        } else this.newNumber(this.R[n]);
      } else if (aw.op === 'xchg') {
        var tmp = this.R[n]; this.R[n] = this.x; this.x = tmp; this.lift = true;
      } else if (aw.op === 'fix' || aw.op === 'sci' || aw.op === 'eng') {
        this.fmt = { mode: aw.op.toUpperCase(), n: REG[key] };
      }
      return;
    }
    if (key === 'f' || key === 'g') { this.prefix = this.prefix === key ? null : key; return; }
    var pre = this.prefix;
    this.prefix = null;
    if (pre === 'f') return this.fkey(key);
    if (pre === 'g') return this.gkey(key);
    if (this.hyp) {
      var hy = this.hyp; this.hyp = null;
      if (key === 'sin' || key === 'cos' || key === 'tan') {
        var fn = { sin: [Math.sinh, Math.asinh], cos: [Math.cosh, Math.acosh], tan: [Math.tanh, Math.atanh] }[key][hy === 'inv' ? 1 : 0];
        this.unary(function (v) { var r = fn(v); if (isNaN(r) || !isFinite(r)) throw new HErr(0); return r; });
        return;
      }
    }
    if (/^d[0-9]$/.test(key)) { this.digit(key.slice(1)); return; }
    switch (key) {
      case 'dot': this.digit('.'); return;
      case 'eex':
        /* EEX starts the exponent of the number being keyed (p. 19) */
        if (!this.entry) { this.startEntry(); this.entry.mant = '1'; }
        if (this.entry.exp === null) this.entry.exp = '';
        return;
      case 'chs':
        if (this.entry) { if (this.entry.exp !== null) this.entry.expNeg = !this.entry.expNeg; else this.entry.neg = !this.entry.neg; return; }
        this.x = -this.x; this.lift = true; return;
      case 'back':
        /* ← deletes the last digit during entry, otherwise it clears X like CLx (p. 21) */
        if (this.entry) {
          var e = this.entry;
          if (e.exp !== null) { if (e.exp.length) e.exp = e.exp.slice(0, -1); else e.exp = null; return; }
          if (e.mant.length > 1) { e.mant = e.mant.slice(0, -1); return; }
          this.entry = null; this.x = 0; this.lift = false; return;
        }
        this.x = 0; this.lift = false; return;
      case 'enter':
        /* ENTER lifts the stack, copies X into Y and disables stack lift (pp. 33, 36) */
        this.endEntry(); this.liftStack(); this.lift = false; return;
      case 'add': this.binary(function (y, x) { return y + x; }); return;
      case 'sub': this.binary(function (y, x) { return y - x; }); return;
      case 'mul': this.binary(function (y, x) { return y * x; }); return;
      case 'div': this.binary(function (y, x) { if (x === 0) throw new HErr(0); return y / x; }); return;
      case 'pow': this.binary(function (y, x) {
        if (y === 0 && x <= 0) throw new HErr(0);
        if (y < 0 && !isInt(x)) throw new HErr(0);
        return Math.pow(y, x);
      }); return;
      case 'sqrt': this.unary(function (v) { if (v < 0) throw new HErr(0); return Math.sqrt(v); }); return;
      case 'ex': this.unary(Math.exp); return;
      case 'tenx': this.unary(function (v) { return Math.pow(10, v); }); return;
      case 'inv': this.unary(function (v) { if (v === 0) throw new HErr(0); return 1 / v; }); return;
      case 'sin': this.unary(function (v) { return clean(Math.sin(self.toRad(v))); }); return;
      case 'cos': this.unary(function (v) { return clean(Math.cos(self.toRad(v))); }); return;
      case 'tan': this.unary(function (v) {
        var q = self.angle === 'DEG' ? v / 90 : self.angle === 'GRAD' ? v / 100 : null;
        if (q !== null && isInt(q) && Math.round(q) % 2) return MAXV;
        return clean(Math.tan(self.toRad(v)));
      }); return;
      case 'xy': this.endEntry(); var a = this.x; this.x = this.y; this.y = a; this.lift = true; return;
      case 'rdn': this.endEntry(); var w = this.x; this.x = this.y; this.y = this.z; this.z = this.t; this.t = w; this.lift = true; return;
      case 'sto': this.endEntry(); this.await = { op: 'sto' }; return;
      case 'rcl': this.endEntry(); this.await = { op: 'rcl' }; return;
      case 'gto': return;
      default: return;
    }
  };
  Calc.prototype.fkey = function (key) {
    var self = this;
    switch (key) {
      case 'gto': this.hyp = 'hyp'; return;
      case 'd1': /* →R: θ in Y, r in X gives x in X and y in Y (p. 31) */
        this.endEntry();
        var r = this.x, th = this.toRad(this.y);
        this.lastx = r;
        this.x = r10(clean(r * Math.cos(th))); this.y = r10(clean(r * Math.sin(th))); this.lift = true; return;
      case 'd2': this.unary(h2hms); return;
      case 'd3': this.unary(function (v) { return v * Math.PI / 180; }); return;
      case 'd0': this.unary(fact); return;
      case 'sto': this.unary(function (v) { return v - (v < 0 ? Math.ceil(v) : Math.floor(v)); }); return;
      case 'add': this.binary(function (y, x) { return comb(y, x, true); }); return;
      case 'd4': this.endEntry(); this.await = { op: 'xchg' }; return;
      case 'd7': this.endEntry(); this.await = { op: 'fix' }; return;
      case 'd8': this.endEntry(); this.await = { op: 'sci' }; return;
      case 'd9': this.endEntry(); this.await = { op: 'eng' }; return;
      case 'back': return;
      default: return;
    }
  };
  Calc.prototype.gkey = function (key) {
    var self = this;
    switch (key) {
      case 'sqrt': this.unary(function (v) { return v * v; }); return;
      case 'ex': this.unary(function (v) { if (v <= 0) throw new HErr(0); return Math.log(v); }); return;
      case 'tenx': this.unary(function (v) { if (v <= 0) throw new HErr(0); return Math.log10(v); }); return;
      case 'pow': /* % keeps the base in Y (p. 29) */
        this.endEntry(); this.lastx = this.x; this.x = r10(this.y * this.x / 100); this.lift = true; return;
      case 'inv': /* Δ% keeps the base in Y (p. 30) */
        this.endEntry(); if (this.y === 0) throw new HErr(0); this.lastx = this.x; this.x = r10((this.x - this.y) / this.y * 100); this.lift = true; return;
      case 'chs': this.unary(Math.abs); return;
      case 'd7': this.endEntry(); this.angle = 'DEG'; return;
      case 'd8': this.endEntry(); this.angle = 'RAD'; return;
      case 'd9': this.endEntry(); this.angle = 'GRAD'; return;
      case 'gto': this.hyp = 'inv'; return;
      case 'sin': this.unary(function (v) { if (Math.abs(v) > 1) throw new HErr(0); return self.fromRad(Math.asin(v)); }); return;
      case 'cos': this.unary(function (v) { if (Math.abs(v) > 1) throw new HErr(0); return self.fromRad(Math.acos(v)); }); return;
      case 'tan': this.unary(function (v) { return self.fromRad(Math.atan(v)); }); return;
      case 'eex': this.newNumber(PI10); return;
      case 'rdn': this.endEntry(); var w = this.t; this.t = this.z; this.z = this.y; this.y = this.x; this.x = w; this.lift = true; return;
      case 'xy': /* RND rounds to the display format (p. 24) */
        this.unary(function (v) { if (self.fmt.mode !== 'FIX') return Number(v.toPrecision(self.fmt.n + 1)); return Number(v.toFixed(self.fmt.n)); }); return;
      case 'back': /* CLx clears X and disables stack lift (p. 36) */
        this.entry = null; this.x = 0; this.lift = false; return;
      case 'enter': this.endEntry(); if (this.lift) this.liftStack(); this.x = this.lastx; this.lift = true; return;
      case 'd1': /* →P: y in Y, x in X gives r in X and θ in Y (p. 30) */
        this.endEntry();
        var x = this.x, y = this.y;
        this.lastx = x;
        this.x = r10(Math.sqrt(x * x + y * y)); this.y = r10(this.fromRad(Math.atan2(y, x))); this.lift = true; return;
      case 'd2': this.unary(hms2h); return;
      case 'd3': this.unary(function (v) { return v * 180 / Math.PI; }); return;
      case 'sto': this.unary(function (v) { return v < 0 ? Math.ceil(v) : Math.floor(v); }); return;
      case 'add': this.binary(function (y, x) { return comb(y, x, false); }); return;
      default: return;
    }
  };

  /* ---------- display (section 5) ---------- */
  function commas(s) { return s.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  /* |v| to n decimals, rounded half up on the 10 decimal digits the calculator holds (not on the binary value) */
  function decFixed(v, n) {
    var a = Math.abs(v);
    if (a === 0) return n > 0 ? '0.' + new Array(n + 1).join('0') : '0';
    var ex = a.toExponential(9), m = ex.split('e'), digits = m[0].replace('.', ''), e = parseInt(m[1], 10);
    var k = e - 9 + n, big = BigInt(digits), out;
    if (k >= 0) out = big * (10n ** BigInt(k));
    else { var div = 10n ** BigInt(-k); out = big / div; if ((big % div) * 2n >= div) out += 1n; }
    var str = out.toString();
    if (n > 0) { while (str.length <= n) str = '0' + str; str = str.slice(0, -n) + '.' + str.slice(-n); }
    return str;
  }
  function sciOf(v, n) {
    n = Math.min(n, 6);
    var a = Math.abs(v), e = a === 0 ? 0 : Math.floor(Math.log10(a)), m = a / Math.pow(10, e);
    if (Number(decFixed(m, n)) >= 10) { e += 1; m = a / Math.pow(10, e); }
    var ms = decFixed(m, n);
    if (ms.indexOf('.') < 0) ms += '.';
    return { main: (v < 0 ? '-' : '') + ms, exp: (e < 0 ? '-' : ' ') + ('0' + Math.abs(e)).slice(-2) };
  }
  Calc.prototype.fmtValue = function (v) {
    var f = this.fmt;
    if (f.mode === 'SCI') return sciOf(v, f.n);
    if (f.mode === 'ENG') {
      var a = Math.abs(v), e = a === 0 ? 0 : Math.floor(Math.log10(a)), e3 = Math.floor(e / 3) * 3, m = v / Math.pow(10, e3);
      var dec = Math.max(0, f.n - (Math.floor(Math.log10(Math.abs(m) || 1))));
      return { main: m.toFixed(Math.min(dec, 6)), exp: (e3 < 0 ? '-' : ' ') + ('0' + Math.abs(e3)).slice(-2) };
    }
    /* FIX n, up to 10 digits. Too large or too small for that shows an exponent (p. 58) */
    var av = Math.abs(v);
    if (av >= 1e10) return sciOf(v, f.n);
    var intDigits = av >= 1 ? Math.floor(Math.log10(av) + 1e-12) + 1 : 1;
    var n = Math.min(f.n, 10 - intDigits);
    if (v !== 0 && Number(decFixed(av, n)) === 0) return sciOf(v, f.n);
    var s = decFixed(av, n);
    if (s.replace(/\D/g, '').length > 10) s = decFixed(av, Math.max(0, n - 1));
    var ip = s.split('.')[0], fp = s.split('.')[1];
    return { main: (v < 0 ? '-' : '') + commas(ip) + '.' + (fp || ''), exp: '' };
  };
  Calc.prototype.display = function () {
    var ind = { f: this.prefix === 'f', g: this.prefix === 'g', angle: this.angle, rad: this.angle === 'RAD', grad: this.angle === 'GRAD' };
    if (this.off) return { main: '', exp: '', ind: {}, off: true };
    if (this.err !== null) return { main: 'Error ' + this.err, exp: '', ind: ind, error: 'Error ' + this.err };
    if (this.entry) {
      var e = this.entry, m = e.mant || '0', ip = m.split('.')[0], fp = m.indexOf('.') >= 0 ? '.' + m.split('.')[1] : '';
      return { main: (e.neg ? '-' : '') + commas(ip) + fp, exp: e.exp !== null ? (e.expNeg ? '-' : ' ') + ('0' + e.exp).slice(-2) : '', ind: ind, entry: true };
    }
    var f = this.fmtValue(this.x);
    return { main: f.main, exp: f.exp, ind: ind };
  };
  Calc.prototype.value = function () {
    if (this.entry) { var e = this.entry, v = parseFloat((e.neg ? '-' : '') + (e.mant || '0')); if (e.exp !== null) v *= Math.pow(10, (e.expNeg ? -1 : 1) * parseInt(e.exp || '0', 10)); return v; }
    return this.x;
  };
  Calc.prototype.text = function () { var d = this.display(); return d.main + (d.exp ? ' ' + d.exp.trim() : ''); };
  Calc.prototype.run = function (keys) { var self = this; keys.forEach(function (k) { self.press(k); }); return this.display(); };

  return { Calc: Calc, KEYS: KEYS, ROWS: ROWS, PI10: PI10, hms2h: hms2h, h2hms: h2hms, unrounded: function (on) { unrounded = !!on; } };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = HP15C;

/* ===== core-translate.js ===== */
/* Translator: a canonical TI-30Xa key sequence (the form every worked solution is written in) becomes the key
   sequence for another calculator model.
   1. The TI sequence is read key by key, the way the TI-30Xa reads it (pending operations, brackets, = , memories,
      ON/C), but instead of numbers it builds an expression tree.
   2. The tree is written out for the target model: Sharp EL-531XT in D.A.L. order, HP-15C in RPN with ENTER and the
      4-level stack (storage registers take over when an expression would need more than four levels).
   Rows joined by " ON/C ON/C " are translated one by one and joined with the model's own clear, two key presses, so
   a chip map for the joined sequence still lines up row by row. Needs TI30 (the TI-30Xa engine). */
var CalcTranslate = (function () {
  'use strict';
  var G = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
  function T30() { return G.TI30 || (typeof require === 'function' ? require('../ti30.js') : null); }

  function Unsupported(msg) { this.message = msg; }
  var PREC = { add: 1, sub: 1, mul: 2, div: 2, pow: 3, root: 3, ncr: 4, npr: 4 };
  var NEXT = { DEG: 'RAD', RAD: 'GRAD', GRAD: 'DEG' };

  /* ---------- 1. TI-30Xa key sequence to expression tree ---------- */
  function num(s, neg, ee, eeNeg) { return { t: 'num', s: s, neg: !!neg, ee: ee, eeNeg: !!eeNeg }; }
  function lit(n) { return { t: 'num', s: String(n), neg: false, ee: null, eeNeg: false }; }
  function readTI(seq) {
    var T = T30(), keys = T.parseSeq(seq);
    var st = {
      x: lit(0), entry: null, ops: [], lastWasOp: false, mem: [null, null, null], t: lit(0), angle: 'DEG',
      events: [], second: false, hyp: false, await: null, lastKey: null, showDms: false, fmt: null, disp: []
    };
    function finish() {
      if (!st.entry) return st.x;
      var e = st.entry;
      if (e.parts.length > 1) {
        var p = e.parts.map(function (s) { return s || '0'; });
        st.x = p.length === 3 ? { t: 'frac', w: p[0], n: p[1], d: p[2], neg: e.neg } : { t: 'frac', w: null, n: p[0], d: p[1], neg: e.neg };
      } else st.x = num(e.parts[0] || '0', e.neg, e.ee, e.eeNeg);
      st.entry = null;
      return st.x;
    }
    function reduceTo(prec) {
      while (st.ops.length) {
        var top = st.ops[st.ops.length - 1];
        if (top === '(' || PREC[top.op] < prec) break;
        st.ops.pop();
        st.x = { t: 'bin', op: top.op, l: top.a, r: st.x };
      }
    }
    function memRef(i) { return { t: 'mem', slot: i, node: st.mem[i - 1] || lit(0) }; }
    keys.forEach(function (key) {
      var wasOnc = st.lastKey === 'onc';
      st.lastKey = key;
      if (key !== '2nd' && key !== 'dddms' && !st.second) st.showDms = false;
      if (key === 'onc') {
        st.disp = [];
        if (wasOnc) { st.x = lit(0); st.entry = null; st.ops = []; st.t = lit(0); st.lastWasOp = false; }
        else { st.entry = null; st.x = lit(0); }
        st.second = false; st.hyp = false; st.await = null;
        return;
      }
      if (st.await) {
        var aw = st.await; st.await = null;
        if (aw === 'fix') {
          if (key === 'dot') { st.events.push({ fmt: null }); return; }
          if (/^d[0-9]$/.test(key)) { st.events.push({ fmt: parseInt(key.slice(1), 10) }); return; }
        } else if (/^d[1-3]$/.test(key)) {
          var slot = parseInt(key.slice(1), 10), xv = finish();
          if (aw === 'sto') { st.mem[slot - 1] = xv; st.events.push({ store: slot, node: xv }); }
          else if (aw === 'rcl') { st.x = memRef(slot); }
          else if (aw === 'sum') { var sm = { t: 'bin', op: 'add', l: memRef(slot), r: xv }; st.mem[slot - 1] = sm; st.events.push({ store: slot, node: sm }); }
          else throw new Unsupported('EXC');
          return;
        }
      }
      if (key === '2nd') { st.second = !st.second; return; }
      var act = key;
      if (st.second) { st.second = false; act = T.SECOND[key] || key; }
      if (act === 'dddms') { finish(); st.showDms = true; return; }
      var wasOp = st.lastWasOp;
      if (act !== 'neg' && act !== 'back') st.lastWasOp = false;
      if (act !== 'hyp' && ['sin', 'cos', 'tan', 'asin', 'acos', 'atan'].indexOf(act) < 0) st.hyp = false;
      if (/^d[0-9]$/.test(act) || act === 'dot') {
        if (!st.entry) st.entry = { parts: [''], neg: false, ee: null, eeNeg: false };
        var en = st.entry, ch = act === 'dot' ? '.' : act.slice(1);
        if (en.ee !== null) { if (ch !== '.') en.ee = (en.ee + ch).slice(-2); return; }
        var cur = en.parts[en.parts.length - 1];
        if (ch === '.') { if (en.parts.length === 1 && cur.indexOf('.') < 0) en.parts[0] = (cur || '0') + '.'; return; }
        en.parts[en.parts.length - 1] = (cur === '0' ? '' : cur) + ch;
        return;
      }
      switch (act) {
        case 'abc':
          if (st.entry && st.entry.ee === null && st.entry.parts.length < 3 && st.entry.parts[st.entry.parts.length - 1].indexOf('.') < 0) st.entry.parts.push('');
          return;
        case 'ee':
          if (!st.entry) {
            var xs = st.x;
            if (xs.t !== 'num' || xs.ee !== null) throw new Unsupported('EE after a result');
            st.entry = { parts: [xs.s], neg: xs.neg, ee: null, eeNeg: false };
          }
          if (st.entry.parts.length === 1 && st.entry.ee === null) st.entry.ee = '';
          return;
        case 'neg':
          if (st.entry) { if (st.entry.ee !== null) st.entry.eeNeg = !st.entry.eeNeg; else st.entry.neg = !st.entry.neg; st.lastWasOp = wasOp; return; }
          st.x = { t: 'un', fn: 'neg', a: st.x };
          return;
        case 'back':
          if (!st.entry) return;
          var e2 = st.entry;
          if (e2.ee !== null) { if (e2.ee.length) e2.ee = e2.ee.slice(0, -1); else e2.ee = null; return; }
          var c2 = e2.parts[e2.parts.length - 1];
          if (c2.length) e2.parts[e2.parts.length - 1] = c2.slice(0, -1); else if (e2.parts.length > 1) e2.parts.pop();
          return;
        case 'pi': st.entry = null; st.x = { t: 'pi' }; return;
        case 'add': case 'sub': case 'mul': case 'div': case 'pow': case 'root': case 'ncr': case 'npr':
          if (wasOp && st.ops.length && st.ops[st.ops.length - 1] !== '(') { st.ops[st.ops.length - 1].op = act; st.lastWasOp = true; return; }
          finish(); reduceTo(PREC[act]); st.ops.push({ op: act, a: st.x }); st.lastWasOp = true; return;
        case 'lp': st.entry = null; st.ops.push('('); st.lastWasOp = true; return;
        case 'rp': finish(); reduceTo(0); if (st.ops.length && st.ops[st.ops.length - 1] === '(') st.ops.pop(); return;
        case 'eq':
          finish();
          while (st.ops.length) { var top = st.ops.pop(); if (top !== '(') st.x = { t: 'bin', op: top.op, l: top.a, r: st.x }; }
          return;
        case 'sq': case 'cube': case 'sqrt': case 'cbrt': case 'inv': case 'log': case 'ln': case 'tenx': case 'ex': case 'fact':
        case 'sin': case 'cos': case 'tan': case 'asin': case 'acos': case 'atan': case 'dmsdd': {
          var a = finish(), fn = act;
          if (st.hyp && /^(a?)(sin|cos|tan)$/.test(act)) fn = act.charAt(0) === 'a' ? 'a' + act.slice(1) + 'h' : act + 'h';
          st.hyp = false;
          st.x = { t: 'un', fn: fn, a: a, mode: /^(sin|cos|tan|asin|acos|atan)$/.test(fn) ? st.angle : null };
          return;
        }
        case 'pct': {
          var pv = finish(), tp = st.ops.length ? st.ops[st.ops.length - 1] : null;
          st.x = tp && tp !== '(' && (tp.op === 'add' || tp.op === 'sub') ? { t: 'pctof', base: tp.a, a: pv } : { t: 'pct', a: pv };
          return;
        }
        case 'hyp': st.hyp = true; return;
        case 'drg': finish(); st.angle = NEXT[st.angle]; st.events.push({ mode: st.angle }); return;
        case 'drgconv': { var dv = finish(); st.x = { t: 'drgc', from: st.angle, to: NEXT[st.angle], a: dv }; st.angle = NEXT[st.angle]; return; }
        case 'xy': { var sv = finish(), tt = st.t; st.t = sv; st.x = tt; return; }
        case 'p2r': case 'r2p': {
          var b = finish(), ca = st.t;
          st.x = { t: 'coord', kind: act, a: ca, b: b, part: 0, mode: st.angle };
          st.t = { t: 'coord', kind: act, a: ca, b: b, part: 1, mode: st.angle };
          return;
        }
        case 'sto': case 'rcl': case 'sum': case 'exc': finish(); st.await = act; return;
        case 'fix': finish(); st.await = 'fix'; return;
        case 'flo': case 'sci': case 'eng': finish(); st.events.push({ notation: act }); return;
        /* F⇄D and d/c change only how the answer is shown: the value stays the same */
        case 'fd': finish(); st.disp.push('fd'); return;
        case 'dc': finish(); st.disp.push('dc'); return;
        default: throw new Unsupported('TI key ' + act + ' has no translation');
      }
    });
    if (st.entry) finish();
    var pending = st.ops.filter(function (o) { return o !== '('; });
    return { events: st.events, x: st.x, pending: pending, open: st.ops.length, angle: st.angle, showDms: st.showDms, mem: st.mem, disp: st.disp };
  }

  /* ---------- tree helpers ---------- */
  function numValue(n) {
    var v = parseFloat(n.s);
    if (n.ee !== null && n.ee !== undefined) v *= Math.pow(10, (n.eeNeg ? -1 : 1) * parseInt(n.ee || '0', 10));
    return n.neg ? -v : v;
  }
  /* value of a tree node, worked out the way the TI-30Xa does (used to pick keys that depend on a sign) */
  var RAD = { DEG: Math.PI / 180, RAD: 1, GRAD: Math.PI / 200 };
  function hms(v) { var a = Math.abs(v), d = Math.floor(a + 1e-12), f = (a - d) * 100, m = Math.floor(f + 1e-9), sec = (f - m) * 100; return (v < 0 ? -1 : 1) * (d + m / 60 + sec / 3600); }
  function val(n) {
    switch (n.t) {
      case 'num': return numValue(n);
      case 'frac': { var w = n.w !== null ? parseFloat(n.w) : 0, f = parseFloat(n.n) / parseFloat(n.d); return (n.neg ? -1 : 1) * (w + f); }
      case 'pi': return Math.PI;
      case 'mem': return val(n.node);
      case 'pct': return val(n.a) / 100;
      case 'pctof': return val(n.base) * val(n.a) / 100;
      case 'drgc': { var f2 = { DEG: { RAD: Math.PI / 180 }, RAD: { GRAD: 200 / Math.PI }, GRAD: { DEG: 0.9 } }; return val(n.a) * f2[n.from][n.to]; }
      case 'coord': {
        var a = val(n.a), b = val(n.b), u = RAD[n.mode];
        if (n.kind === 'p2r') return n.part ? a * Math.sin(b * u) : a * Math.cos(b * u);
        return n.part ? Math.atan2(b, a) / u : Math.sqrt(a * a + b * b);
      }
      case 'bin': {
        var l = val(n.l), r = val(n.r);
        switch (n.op) {
          case 'add': return l + r; case 'sub': return l - r; case 'mul': return l * r; case 'div': return l / r;
          case 'pow': return Math.pow(l, r);
          case 'root': return l < 0 ? -Math.pow(-l, 1 / r) : Math.pow(l, 1 / r);
          default: return NaN;
        }
      }
      case 'un': {
        var x = val(n.a), m = RAD[n.mode] || 1;
        switch (n.fn) {
          case 'neg': return -x; case 'sq': return x * x; case 'cube': return x * x * x; case 'sqrt': return Math.sqrt(x); case 'cbrt': return Math.cbrt(x);
          case 'inv': return 1 / x; case 'log': return Math.log10(x); case 'ln': return Math.log(x); case 'tenx': return Math.pow(10, x); case 'ex': return Math.exp(x);
          case 'sin': return Math.sin(x * m); case 'cos': return Math.cos(x * m); case 'tan': return Math.tan(x * m);
          case 'asin': return Math.asin(x) / m; case 'acos': return Math.acos(x) / m; case 'atan': return Math.atan(x) / m;
          case 'dmsdd': return hms(x);
          default: return NaN;
        }
      }
    }
    return NaN;
  }
  function hasTrigIn(node, mode, out) {
    if (!node || typeof node !== 'object') return;
    if ((node.t === 'un' && node.mode) || node.t === 'coord') { if (node.mode !== mode) out.bad = true; }
    ['a', 'b', 'l', 'r', 'base'].forEach(function (k) { if (node[k]) hasTrigIn(node[k], mode, out); });
  }

  /* ---------- 2a. Sharp EL-531XT (D.A.L.) ---------- */
  /* Token shapes: {num:'12.5'} | {key:id, shift:'2ndf'|'alpha'|null} | {note:text} */
  var SH = {
    sin: ['sin'], cos: ['cos'], tan: ['tan'], asin: ['sin', '2ndf'], acos: ['cos', '2ndf'], atan: ['tan', '2ndf'],
    sqrt: ['sqrt'], cbrt: ['cube', '2ndf'], log: ['log'], ln: ['ln'], tenx: ['log', '2ndf'], ex: ['ln', '2ndf']
  };
  var SH_POST = { sq: ['sq'], cube: ['cube'], inv: ['sq', '2ndf'], fact: ['d4', '2ndf'] };
  var SLOT_LETTER = { 1: 'A', 2: 'B', 3: 'C' };
  /* Sharp priority of a tree node: higher binds tighter (manual, Priority Levels in Calculation) */
  function shPrio(n) {
    if (n.t === 'num') return n.neg ? 5 : 10;
    if (n.t === 'frac' || n.t === 'pi' || n.t === 'mem' || n.t === 'coordref' || n.t === 'dmslit') return 10;
    if (n.t === 'un') {
      if (SH_POST[n.fn]) return 9;
      return 5;
    }
    if (n.t === 'bin') return { pow: 8, root: 8, ncr: 7, npr: 7, mul: 3, div: 3, add: 2, sub: 2 }[n.op];
    if (n.t === 'pct' || n.t === 'pctof') return 3;
    return 10;
  }
  function emitSharp(prog) {
    var out = [], notes = [], spills = 0;
    function k(id, shift) { out.push({ key: id, shift: shift || null }); }
    function numTok(s) { out.push({ num: s }); }
    function emitNum(n) {
      if (n.neg) k('neg');
      numTok(n.s);
      if (n.ee !== null && n.ee !== undefined) { k('exp'); if (n.eeNeg) k('neg'); numTok(n.ee || '0'); }
    }
    function paren(fn) { k('lp'); fn(); k('rp'); }
    function emit(n, ctx) {
      switch (n.t) {
        case 'num': emitNum(n); return;
        case 'pi': k('pi'); return;
        case 'frac':
          if (n.neg) k('neg');
          if (n.w !== null) { numTok(n.w); k('abc'); }
          numTok(n.n); k('abc'); numTok(n.d);
          return;
        case 'dmslit':
          numTok(n.d); k('dms'); numTok(n.m); k('dms'); numTok(n.s);
          return;
        case 'mem': k('rcl'); k(n.letterKey); return;
        case 'coordref': k('rcl'); k(n.which ? 'sto' : 'rcl'); return;
        case 'un': {
          if (n.fn === 'neg') { k('neg'); sub(n.a, 5.5); return; }
          if (n.fn === 'dmsdd') {
            var dl = dmsLiteral(n.a);
            if (!dl) throw new Unsupported('DMS▸DD of a result');
            emit(dl); return;
          }
          if (/h$/.test(n.fn)) {
            var base = n.fn.replace(/h$/, ''), arc = base.charAt(0) === 'a';
            if (arc) { k('hyp', '2ndf'); k(base.slice(1)); } else { k('hyp'); k(base); }
            sub(n.a, 8.5, true); return;
          }
          if (SH_POST[n.fn]) { sub(n.a, 9.5); var pk = SH_POST[n.fn]; k(pk[0], pk[1]); return; }
          var f = SH[n.fn];
          if (!f) throw new Unsupported('function ' + n.fn);
          k(f[0], f[1]);
          sub(n.a, 8.5, true);
          return;
        }
        case 'bin': {
          var pr = shPrio(n), opk = { add: 'add', sub: 'sub', mul: 'mul', div: 'div', pow: 'pow', root: 'pow', ncr: 'd5', npr: 'd6' }[n.op];
          if (n.op === 'root') {
            /* TI: y ˣ√y x is the x-th root of y. Sharp: x 2ndF ˣ√ y */
            sub(n.r, pr + 0.5); k('pow', '2ndf'); sub(n.l, pr + 0.5); return;
          }
          sub(n.l, n.op === 'pow' ? pr + 0.5 : pr);
          if (n.op === 'ncr' || n.op === 'npr') k(opk, '2ndf'); else k(opk);
          sub(n.r, pr + 0.5);
          return;
        }
        case 'pct': sub(n.a, 3.5); k('div'); numTok('100'); return;
        case 'pctof': sub(n.base, 3.5); k('mul'); sub(n.a, 3.5); k('div'); numTok('100'); return;
      }
      throw new Unsupported('node ' + n.t);
    }
    /* need: the priority the slot needs. Brackets go round anything that binds less tightly. A function written
       before its argument gets its argument in brackets unless it is a plain number. */
    function sub(n, need, fnArg) {
      var plain = n.t === 'num' && !n.neg && (n.ee === null || n.ee === undefined) || n.t === 'pi' || n.t === 'mem' || n.t === 'coordref';
      if (fnArg) { if (plain) emit(n); else paren(function () { emit(n); }); return; }
      if (shPrio(n) < need || (n.t === 'un' && SH[n.fn] && need > 5) || (n.t === 'frac' && need >= 8) || (n.t === 'num' && n.neg && need > 5) || (n.t === 'dmslit' && need >= 8)) paren(function () { emit(n); });
      else emit(n);
    }
    function dmsLiteral(a) {
      if (a.t !== 'num' || a.ee !== null && a.ee !== undefined) return null;
      var s = a.s, ip = s.split('.')[0] || '0', fp = (s.split('.')[1] || '');
      var mm = (fp + '00').slice(0, 2), ss = fp.length > 2 ? fp.slice(2, 4) + (fp.length > 4 ? '.' + fp.slice(4) : '') : '0';
      return { t: 'dmslit', d: String(parseInt(ip, 10)), m: String(parseInt(mm, 10)), s: String(Number(ss)), neg: a.neg };
    }
    /* coordinates used inside a larger expression: the conversion runs first, then RCL X or RCL Y */
    function lift(n, pre) {
      if (!n || typeof n !== 'object') return n;
      if (n.t === 'coord' && !pre.top) {
        pre.list.push(n);
        return { t: 'coordref', which: n.part };
      }
      var c = {};
      Object.keys(n).forEach(function (key) { c[key] = n[key]; });
      ['a', 'b', 'l', 'r', 'base'].forEach(function (key) { if (c[key]) c[key] = lift(c[key], { top: false, list: pre.list }); });
      if (c.t === 'mem') c.letterKey = SLOT_KEY(c.slot);
      return c;
    }
    /* memory letters A to F sit on the keys yˣ √ x² x³ log ln (ALPHA letters, EL-531TH guide p. 3) */
    function SLOT_KEY(slot) { return { A: 'pow', B: 'sqrt', C: 'sq', D: 'cube', E: 'log', F: 'ln' }[SLOT_LETTER[slot] || spillLetter(slot)]; }
    function spillLetter(slot) { return { 4: 'D', 5: 'E', 6: 'F' }[slot]; }
    function coordPart(n) {
      /* a 2ndF , b 2ndF →rθ (or →xy). Each part is a number, or worked out first and kept in D or E */
      var parts = [n.a, n.b].map(function (p, i) {
        if (p.t === 'num' && (p.ee === null || p.ee === undefined)) return p;
        if (p.t === 'mem') return lift(p, { top: false, list: [] });
        var slot = 4 + i;
        statement(p);
        k('sto'); k(SLOT_KEY(slot));
        k('onc');
        return { t: 'mem', slot: slot, letterKey: SLOT_KEY(slot) };
      });
      emit(parts[0]); k('sto', '2ndf'); emit(parts[1]);
      k(n.kind === 'r2p' ? 'd8' : 'd9', '2ndf');
    }
    function statement(node) {
      var pre = { top: true, list: [] };
      var tree = node.t === 'coord' ? node : lift(node, pre);
      pre.list.forEach(function (c) { coordPart(c); k('onc'); });
      if (tree.t === 'coord') { coordPart(tree); if (tree.part) k('exp', '2ndf'); return 'coord'; }
      if (tree.t === 'drgc') { sub(lift(tree.a, { top: false, list: [] }), 0); k('pi', '2ndf'); return 'end'; }
      emit(tree, {});
      return 'open';
    }
    var mode = 'DEG';
    function setMode(m) { while (mode !== m) { k('drg'); mode = NEXT[mode]; } }
    prog.events.forEach(function (ev) {
      if (ev.mode) { setMode(ev.mode); return; }
      if (ev.store) {
        var how = statement(ev.node);
        if (how === 'coord') { k('onc'); k('rcl'); k(ev.node.part ? 'sto' : 'rcl'); }
        k('sto'); k(SLOT_KEY(ev.store));
        k('onc');
        return;
      }
      if (ev.fmt !== undefined || ev.notation) throw new Unsupported('display format keys');
    });
    var x = prog.x, finalHow;
    var chk = {};
    function plainNum(n) { return n.t === 'num' && !n.neg && (n.ee === null || n.ee === undefined); }
    /* 2ndF % ends the calculation (Calculation Examples [4]): a+b% = a+a×b÷100, a−b% = a−a×b÷100, a×b% = a×b÷100,
       a÷b% = a÷b×100. Used only in those documented shapes, with plain numbers. */
    function nativePct(n) {
      if (n.t === 'bin' && (n.op === 'add' || n.op === 'sub') && n.r.t === 'pctof' && n.r.base === n.l && plainNum(n.l) && plainNum(n.r.a)) return [n.l, n.op, n.r.a];
      if (n.t === 'bin' && (n.op === 'mul' || n.op === 'div') && n.r.t === 'pct' && plainNum(n.l) && plainNum(n.r.a)) return [n.l, n.op, n.r.a];
      if (n.t === 'pctof' && plainNum(n.base) && plainNum(n.a)) return [n.base, 'mul', n.a];
      return null;
    }
    hasTrigIn(x, mode, chk);
    if (chk.bad) throw new Unsupported('angle unit changed inside one expression');
    var np = nativePct(x);
    if (np) {
      emitNum(np[0]); k(np[1]); emitNum(np[2]); k('d1', '2ndf');
      finalHow = 'end';
    } else if (prog.pending.length && !(x.t === 'num' && !x.neg)) {
      /* the TI-30Xa sequence stops part way with a worked-out value on its screen (a % amount, a function of the
         number keyed): the D.A.L. line shows that value with = */
      finalHow = statement(x);
      if (finalHow === 'open') k('eq');
    } else if (prog.pending.length) {
      /* the sequence stops part way: key the same unfinished line */
      prog.pending.forEach(function (o) { emit(lift(o.a, { top: false, list: [] })); k({ add: 'add', sub: 'sub', mul: 'mul', div: 'div', pow: 'pow' }[o.op] || 'mul'); });
      emit(lift(x, { top: false, list: [] }));
      finalHow = 'pending';
    } else if (x.t === 'num' && !x.neg && x.ee == null && !prog.showDms && !prog.events.some(function (e) { return e.store; })) {
      emitNum(x); finalHow = 'entry';
    } else {
      finalHow = statement(x);
      if (finalHow === 'open') k('eq');
    }
    if (prog.showDms) { k('dms', '2ndf'); }
    /* F⇄D: a b/c after a result switches decimal and fraction; d/c: 2ndF d/c switches mixed and improper
       (Calculation Examples [8], EL-531TH guide p. 19). A bare number is finished with = first. */
    if (prog.disp && prog.disp.length) {
      if (finalHow === 'entry') k('eq');
      prog.disp.forEach(function (d) { if (d === 'fd') k('abc'); else k('abc', '2ndf'); });
    }
    return { tokens: out, notes: notes, how: finalHow };
  }

  /* ---------- 2b. HP-15C (RPN) ---------- */
  var HPU = {
    sq: [['sqrt', 'g']], sqrt: [['sqrt']], inv: [['inv']], log: [['tenx', 'g']], ln: [['ex', 'g']], tenx: [['tenx']], ex: [['ex']],
    fact: [['d0', 'f']], sin: [['sin']], cos: [['cos']], tan: [['tan']], asin: [['sin', 'g']], acos: [['cos', 'g']], atan: [['tan', 'g']],
    sinh: [['gto', 'f'], ['sin']], cosh: [['gto', 'f'], ['cos']], tanh: [['gto', 'f'], ['tan']],
    asinh: [['gto', 'g'], ['sin']], acosh: [['gto', 'g'], ['cos']], atanh: [['gto', 'g'], ['tan']],
    dmsdd: [['d2', 'g']], neg: [['chs']]
  };
  var HP_BIN = { add: [['add']], sub: [['sub']], mul: [['mul']], div: [['div']], pow: [['pow']], ncr: [['add', 'g']], npr: [['add', 'f']] };
  var COMMUTE = { add: 1, mul: 1 };
  function emitHP(prog) {
    var out = [], noted = {}, free = [4, 5, 6, 7, 8, 9], lastEntry = false;
    function note(key, text) { if (noted[key]) return; noted[key] = 1; out.push({ note: text }); }
    /* CHS while a number is being keyed changes its sign and keeps the entry open (p. 19), so a number keyed next
       still needs ENTER */
    function k(id, shift) { out.push({ key: id, shift: shift || null }); lastEntry = id === 'chs' && !shift && lastEntry; }
    function keys(list) { list.forEach(function (p) { k(p[0], p[1]); }); }
    function numTok(s) {
      if (lastEntry) k('enter');
      out.push({ num: s }); lastEntry = true;
    }
    function emitNum(n) {
      numTok(n.s);
      if (n.ee !== null && n.ee !== undefined) { out.push({ key: 'eex', shift: null }); out.push({ num: n.ee || '0' }); if (n.eeNeg) out.push({ key: 'chs', shift: null }); }
      if (n.neg) out.push({ key: 'chs', shift: null });
      lastEntry = true;
    }
    /* stack levels a node needs (Sethi-Ullman). Coordinate results leave the second value behind. */
    function need(n) {
      switch (n.t) {
        case 'num': case 'pi': case 'mem': return 1;
        case 'frac': return 2;
        case 'un': return n.fn === 'cube' || n.fn === 'cbrt' ? Math.max(need(n.a), 2) : need(n.a);
        case 'pct': return Math.max(need(n.a), 2);
        case 'pctof': return Math.max(need(n.base), 1 + need(n.a));
        case 'drgc': return Math.max(need(n.a), 2);
        case 'coord': case 'bin': {
          if (n.t === 'bin' && n.r.t === 'pctof' && n.r.base === n.l) return need(n.r);
          var l = need(n.t === 'coord' ? n.b : n.l), r = need(n.t === 'coord' ? n.a : n.r);
          if (n.t === 'coord' && n.kind === 'r2p') { l = need(n.b); r = need(n.a); }
          /* keyed left to right (the way the expression is written) when that fits the 4 levels, else the deeper
             side first */
          var base = Math.max(l, r + 1) <= 4 ? Math.max(l, r + 1) : (l === r ? l + 1 : Math.max(l, r));
          return n.op === 'root' ? Math.max(base, 2) : base;
        }
      }
      return 1;
    }
    /* the positive of a negative value: a keyed negative number is keyed without its sign, anything else gets CHS */
    function emitPos(n) {
      if (n.t === 'num' && n.neg) { var c = {}; Object.keys(n).forEach(function (key) { c[key] = n[key]; }); c.neg = false; emitNum(c); return; }
      emit(n); k('chs');
    }
    function emit(n) {
      if (n.pos) { emitPos(n.a); return; }
      switch (n.t) {
        case 'num': emitNum(n); return;
        case 'pi': k('eex', 'g'); return;
        case 'mem': k('rcl'); k('d' + n.slot); return;
        case 'frac': {
          note('frac', 'Not on this model: no a b/c key. The fraction is keyed as a division.');
          var neg = n.neg;
          /* n ÷ d first, then the whole number is added: two stack levels, the same as a plain fraction */
          if (n.w !== null) { numTok(n.n); numTok(n.d); k('div'); numTok(n.w); k('add'); }
          else { numTok(n.n); numTok(n.d); k('div'); }
          if (neg) k('chs');
          return;
        }
        case 'un': {
          if (n.fn === 'cube') { note('cube', 'Not on this model: no x³ key. Use 3 yˣ.'); emit(n.a); numTok('3'); k('pow'); return; }
          if (n.fn === 'cbrt') {
            note('cbrt', 'Not on this model: no ³√x key. Use 3 1/x yˣ.');
            if (val(n.a) < 0) {
              /* yˣ needs a positive y when x is not a whole number: root of the positive value, sign back after */
              note('cbrtneg', 'For a negative number, CHS first, take the root, then CHS again.');
              emitPos(n.a); numTok('3'); k('inv'); k('pow'); k('chs'); return;
            }
            emit(n.a); numTok('3'); k('inv'); k('pow'); return;
          }
          if (n.fn === 'dmsdd' && n.a.t === 'num') { emitNum(n.a); keys(HPU.dmsdd); return; }
          var u = HPU[n.fn];
          if (!u) throw new Unsupported('function ' + n.fn);
          emit(n.a); keys(u); return;
        }
        case 'pct': note('pct', 'The TI-30Xa % here divides by 100.'); emit(n.a); numTok('100'); k('div'); return;
        case 'pctof': emit(n.base); emit(n.a); k('pow', 'g'); return;
        case 'drgc': {
          emit(n.a);
          if (n.from === 'DEG') { k('d3', 'f'); k('d8', 'g'); }
          else if (n.from === 'RAD') { note('drg', 'Not on this model: no radians-to-grads key. Use →DEG, then × 10 ÷ 9.'); k('d3', 'g'); numTok('10'); k('mul'); numTok('9'); k('div'); k('d9', 'g'); }
          else { note('drg2', 'Not on this model: no grads-to-degrees key. Use × 0.9.'); numTok('.9'); k('mul'); k('d7', 'g'); }
          return;
        }
        case 'coord': {
          /* →R: θ ENTER r f →R gives x (y in Y). →P: y ENTER x g →P gives r (θ in Y) */
          var first = n.kind === 'p2r' ? n.b : n.b, second = n.kind === 'p2r' ? n.a : n.a;
          pair(first, second);
          k('d1', n.kind === 'p2r' ? 'f' : 'g');
          return;
        }
        case 'bin': {
          if (n.op === 'root') {
            /* the x-th root of y is y^(1/x). An odd root of a negative number: root of the positive value, sign back */
            if (val(n.l) < 0) {
              note('rootneg', 'For a negative number, CHS first, take the root, then CHS again.');
              pair({ t: 'un', fn: 'neg', a: n.l, pos: true }, n.r, true); k('chs'); return;
            }
            pair(n.l, n.r, true); return;
          }
          if ((n.op === 'add' || n.op === 'sub') && n.r.t === 'pctof' && n.r.base === n.l) {
            /* a + b%: a ENTER b g % + (p. 29: % keeps the base number in Y) */
            emit(n.r); keys(HP_BIN[n.op]); return;
          }
          pair(n.l, n.r);
          keys(HP_BIN[n.op]);
          return;
        }
      }
      throw new Unsupported('node ' + n.t);
    }
    /* put a in Y and b in X: left to right when the stack holds it (pp. 37-38, order of entry and nested
       calculations), the deeper side first with x≶y when that saves a level, a storage register when even that
       would overflow the four levels */
    function pair(a, b, root) {
      var la = need(a), lb = need(b);
      if (Math.max(la, lb + 1) <= 4) {
        emitClean(a); emitClean(b);
      } else if (Math.max(la, lb) >= 4 && la === lb || la > 4 || lb > 4) {
        var reg = free.shift();
        if (reg === undefined) throw new Unsupported('too deep');
        emitClean(b); k('sto'); k('d' + reg); k('back', 'g');
        emitClean(a); k('rcl'); k('d' + reg);
        free.unshift(reg);
      } else if (lb > la) {
        emitClean(b); emitClean(a); k('xy');
      } else {
        emitClean(a); emitClean(b);
      }
      if (root) { k('inv'); k('pow'); }
    }
    /* an operand that is a coordinate result leaves its partner in Y. x≶y R↓ (or R↓ for the second value) drops it */
    function emitClean(n) {
      if (n.t === 'coord') { emit(n); if (n.part) k('rdn'); else { k('xy'); k('rdn'); } return; }
      emit(n);
    }
    var mode = 'DEG';
    function setMode(m) { if (m === mode) return; k({ DEG: 'd7', RAD: 'd8', GRAD: 'd9' }[m], 'g'); mode = m; }
    prog.events.forEach(function (ev) {
      if (ev.mode) { setMode(ev.mode); return; }
      if (ev.store) {
        if (need(ev.node) > 4) throw new Unsupported('too deep');
        emitClean(ev.node); k('sto'); k('d' + ev.store);
        return;
      }
      if (ev.fmt !== undefined || ev.notation) throw new Unsupported('display format keys');
    });
    var x = prog.x, chk = {};
    hasTrigIn(x, mode, chk);
    if (chk.bad) throw new Unsupported('angle unit changed inside one expression');
    if (prog.pending.length) {
      prog.pending.forEach(function (o) { emitClean(o.a); });
      emitClean(x);
    } else if (x.t === 'coord') {
      emit(x);
      if (x.part) k('xy');
    } else {
      if (need(x) > 4 && x.t !== 'bin') throw new Unsupported('too deep');
      emit(x);
    }
    if (prog.showDms) { k('d2', 'f'); note('hms', 'The answer shows as degrees.minutes seconds: 99.0500 means 99°05′00″.'); }
    if (prog.disp && prog.disp.length) note('fd', 'Not on this model: no fraction display. The answer shows as a decimal.');
    return { tokens: out };
  }

  /* ---------- 3. Public: translate, tokens, key presses ---------- */
  var SEPARATOR = {
    ti30xa: [{ key: 'onc', shift: null }, { key: 'onc', shift: null }],
    el531xt: [{ key: 'onc', shift: null }, { key: 'onc', shift: null }],
    hp15c: [{ key: 'back', shift: 'g' }, { key: 'back', shift: 'g' }]
  };
  var cache = {};
  function splitRows(seq) { return String(seq).trim().split(/\s+ON\/C\s+ON\/C\s+/); }
  function translateOne(seq, model) {
    var prog = readTI(seq);
    if (model === 'el531xt') return emitSharp(prog).tokens;
    if (model === 'hp15c') return emitHP(prog).tokens;
    throw new Error('Unknown model ' + model);
  }
  /* tokens for the model: numbers, keys (with their shift key) and notes. Throws Unsupported when a TI key has no
     counterpart that keeps the value. */
  function translate(seq, model) {
    var ck = model + '|' + seq;
    if (cache[ck]) return cache[ck];
    var rows = splitRows(seq), out = [];
    rows.forEach(function (r, i) {
      if (i) out = out.concat(SEPARATOR[model]);
      out = out.concat(translateOne(r, model));
    });
    cache[ck] = out;
    return out;
  }
  /* the key presses behind the tokens, each with the index of its chip (notes have no chip) */
  function presses(tokens) {
    var list = [], chip = -1;
    tokens.forEach(function (t) {
      if (t.note) return;
      chip++;
      if (t.num != null) { String(t.num).split('').forEach(function (c) { list.push({ id: c === '.' ? 'dot' : 'd' + c, chip: chip, fast: true }); }); return; }
      if (t.shift) list.push({ id: t.shift, chip: chip });
      list.push({ id: t.key, chip: chip });
    });
    return list;
  }
  return { readTI: readTI, translate: translate, presses: presses, Unsupported: Unsupported, SEPARATOR: SEPARATOR, emitSharp: emitSharp, emitHP: emitHP };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = CalcTranslate;

/* ===== calc-kit-core.js ===== */
/* CalcKit core: the three calculator models, the selected model, key chips and screens for any canonical TI-30Xa
   key sequence. Worked solutions are written once, as TI-30Xa sequences (the seq strings pages send in
   {ti30:'play'}). CalcTranslate turns them into the selected model's keys, so pages never write Sharp or HP keys.
   Needs TI30, SharpEL, HP15C and CalcTranslate. The popup (CalcKit.mount, CalcKit.play) is added by ui-popup.js. */
var CalcKit = (function (G) {
  'use strict';
  var T = G.TI30, S = G.SharpEL, H = G.HP15C, X = G.CalcTranslate;
  var STORE = 'access-calc-model';
  var MODELS = [
    { id: 'ti30xa', name: 'TI-30Xa', logic: 'algebraic', maker: 'Texas Instruments' },
    { id: 'el531xt', name: 'Sharp EL-531XT', logic: 'dal', maker: 'Sharp' },
    { id: 'hp15c', name: 'HP-15C', logic: 'rpn', maker: 'HP' }
  ];
  var BY = {};
  MODELS.forEach(function (m) { BY[m.id] = m; });
  /* how each model starts a worked solution: the two key presses the calculator plays before the keys of the
     solution (the same count on every model, so "Key 3 of 11" and the chip glow line up) */
  var START = {
    ti30xa: [{ key: 'onc', shift: null }, { key: 'onc', shift: null }],
    el531xt: [{ key: 'onc', shift: null }, { key: 'onc', shift: null }],
    hp15c: [{ key: 'back', shift: 'g' }]
  };
  var SUB = {
    ti30xa: { pre: 'Start with ', post: ' and DEG on the screen.' },
    el531xt: { pre: 'Start with ', post: ' and DEG on the screen.' },
    hp15c: { pre: 'Start with ', post: ' in Degrees mode (no RAD or GRAD on the screen).' }
  };
  var model = 'ti30xa';
  try { var saved = G.localStorage.getItem(STORE); if (BY[saved]) model = saved; } catch (e) { /* storage blocked: TI-30Xa for this visit */ }
  var listeners = [];

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function info(id) { return BY[id || model]; }
  function models() { return MODELS.map(function (m) { return { id: m.id, name: m.name, logic: m.logic }; }); }
  function getModel() { return model; }
  function setModel(id) {
    if (!BY[id] || id === model) return model;
    model = id;
    try { G.localStorage.setItem(STORE, id); } catch (e) { /* storage blocked: kept for this visit */ }
    listeners.slice().forEach(function (fn) { try { fn(id); } catch (e) { /* one listener failing must not stop the rest */ } });
    return model;
  }
  function onChange(fn) { listeners.push(fn); return function () { var i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); }; }

  /* ---------- tokens ---------- */
  /* model tokens for a canonical sequence: {num}, {key, shift} and {note}. TI-30Xa tokens come from the TI30
     tokenizer itself. A sequence the translator cannot carry over keeps its TI-30Xa keys and gets a note. */
  var cache = {};
  function tokensFor(seq, id) {
    id = id || model;
    var ck = id + '|' + seq;
    if (cache[ck]) return cache[ck];
    var r;
    if (id === 'ti30xa') r = { toks: tiTokens(seq), ok: true };
    else {
      try { r = { toks: X.translate(seq, id), ok: true }; }
      catch (e) {
        if (!(e instanceof X.Unsupported)) throw e;
        r = { toks: [{ note: 'Not on this model: ' + e.message + '. The TI-30Xa keys are shown.' }].concat(tiTokens(seq)), ok: false, why: e.message };
      }
    }
    cache[ck] = r;
    return r;
  }
  function tiTokens(seq) {
    return T.tokens(seq).map(function (t) {
      if (t.num != null) return { num: t.num, neg: !!t.neg, ti: true };
      if (t.key === '2nd') return { key: '2nd', shift: null, ti: true };
      return { key: t.key, shift: t.second ? '2nd' : null, ti: true };
    });
  }
  /* the token list the TI30.tokens wrapper hands to page scripts: one entry per chip group, notes left out.
     A number is one chip (two when a TI-30Xa number is negative); a key with its shift key is two chips. */
  function pageTokens(seq, id) {
    var out = [];
    tokensFor(seq, id).toks.forEach(function (t) {
      if (t.note) return;
      if (t.num != null) out.push({ num: String(t.num), neg: !!t.neg });
      else out.push({ key: t.key, second: !!t.shift && t.key !== '2nd' });
    });
    return out;
  }

  /* ---------- labels and chips ---------- */
  var OPS = { add: 1, sub: 1, mul: 1, div: 1, eq: 1, onc: 1, enter: 1 };
  var SHIFT_LABEL = { '2nd': '2nd', '2ndf': '2ndF', f: 'f', g: 'g', alpha: 'ALPHA' };
  function shiftOf(t, id) { return t.ti ? 'ti30xa' : id; }
  function label(t, id, prev) {
    var m = shiftOf(t, id);
    if (t.num != null) return String(t.num);
    if (m === 'ti30xa') return T.KEYS[t.key] ? T.KEYS[t.key][t.shift ? 1 : 0] : t.key;
    if (m === 'el531xt') {
      var k = S.KEYS[t.key];
      if (!k) return t.key;
      /* the key after STO or RCL names a memory: its green letter (EL-531TH guide p. 3) */
      if (!t.shift && prev && !prev.shift && (prev.key === 'sto' || prev.key === 'rcl') && S.LETTER[t.key]) return S.LETTER[t.key];
      return t.shift === '2ndf' ? k.second : t.shift === 'alpha' ? k.alpha : k.face;
    }
    var h = H.KEYS[t.key];
    if (!h) return t.key;
    return t.shift === 'f' ? h.f : t.shift === 'g' ? h.g : h.face;
  }
  function kindOf(t, id, prev) {
    if (t.num != null) return 'num';
    var m = shiftOf(t, id);
    if (t.key === '2nd') return '2nd';
    if (t.shift) return 'fn';
    if (m === 'el531xt' && prev && !prev.shift && (prev.key === 'sto' || prev.key === 'rcl') && S.LETTER[t.key]) return 'alpha';
    if (/^d[0-9]$/.test(t.key) || t.key === 'dot' || t.key === 'neg' || t.key === 'chs') return 'num';
    return OPS[t.key] ? 'op' : 'fn';
  }
  /* CalcKit.keysFor: one entry per chip group. {label, key, shift} plus kind, and neg for a negative TI number */
  function keysFor(seq, id) {
    id = id || model;
    var out = [], prev = null;
    tokensFor(seq, id).toks.forEach(function (t) {
      if (t.note) return;
      var e = { label: label(t, id, prev), key: t.num != null ? 'num' : t.key, shift: t.shift || null, kind: kindOf(t, id, prev) };
      if (t.shift) e.shiftLabel = SHIFT_LABEL[t.shift];
      if (t.neg) e.neg = true;
      out.push(e);
      prev = t;
    });
    return out;
  }
  function notesFor(seq, id) {
    return tokensFor(seq, id || model).toks.filter(function (t) { return t.note; }).map(function (t) { return t.note; });
  }
  var SHIFT_CLASS = { '2nd': '', '2ndf': ' tk-sh-2ndf', f: ' tk-sh-f', g: ' tk-sh-g', alpha: ' tk-sh-alpha' };
  var SEC_CLASS = { '2nd': '', '2ndf': ' tk-sec-2ndf', f: ' tk-sec-f', g: ' tk-sec-g', alpha: ' tk-sec-alpha' };
  /* chip HTML with the class names the hub already uses (tk, tk-num, tk-op, tk-fn, tk-2nd, tk-sec), so glow and hide
     operations work for every model. Notes are spans, never kbd, so they are not counted as chips. */
  function chipsHtml(seq, id) {
    id = id || model;
    var h = '', prev = null;
    tokensFor(seq, id).toks.forEach(function (t) {
      if (t.note) { h += '<span class="tk-note">' + esc(t.note) + '</span>'; return; }
      var lab = label(t, id, prev), kind = kindOf(t, id, prev);
      if (t.num != null) {
        h += '<kbd class="tk tk-num">' + esc(lab) + '</kbd>';
        if (t.neg) h += '<kbd class="tk tk-num">' + esc(T.KEYS.neg[0]) + '</kbd>';
      } else if (t.key === '2nd') h += '<kbd class="tk tk-2nd">2nd</kbd>';
      else if (t.shift) {
        h += '<kbd class="tk tk-2nd' + SHIFT_CLASS[t.shift] + '">' + esc(SHIFT_LABEL[t.shift]) + '</kbd>' +
          '<kbd class="tk tk-fn tk-sec' + SEC_CLASS[t.shift] + '">' + esc(lab) + '</kbd>';
      } else h += '<kbd class="tk tk-' + (kind === 'alpha' ? 'fn tk-alpha' : kind) + '">' + esc(lab) + '</kbd>';
      prev = t;
    });
    return h;
  }
  /* chips for Word and PDF exports: {t, k} with k one of num, op, fn, 2nd, 2ndf, f, g, alpha, note */
  function exportChips(seq, id) {
    id = id || model;
    var out = [], prev = null;
    tokensFor(seq, id).toks.forEach(function (t) {
      if (t.note) { out.push({ t: t.note, k: 'note' }); return; }
      var lab = label(t, id, prev), kind = kindOf(t, id, prev);
      if (t.num != null) { out.push({ t: lab, k: 'num' }); if (t.neg) out.push({ t: T.KEYS.neg[0], k: 'num' }); }
      else if (t.key === '2nd') out.push({ t: '2nd', k: '2nd' });
      else if (t.shift) { out.push({ t: SHIFT_LABEL[t.shift], k: t.shift }); out.push({ t: lab, k: 'fn' }); }
      else out.push({ t: lab, k: kind === 'alpha' ? 'alpha' : kind });
      prev = t;
    });
    return out;
  }

  /* ---------- emulators and screens ---------- */
  function newCalc(id) {
    id = id || model;
    if (id === 'el531xt') return new S.Calc();
    if (id === 'hp15c') return new H.Calc();
    return new T.Calc();
  }
  /* the key presses of a run: the start presses (not counted as keys of the solution) then the solution's keys,
     each with the index of its chip group */
  function steps(seq, id) {
    id = id || model;
    var r = tokensFor(seq, id), list = [];
    var tiRun = id === 'ti30xa' || !r.ok;
    (tiRun ? START.ti30xa : START[id]).forEach(function (t) {
      if (t.shift) list.push({ id: t.shift, chip: -1 });
      list.push({ id: t.key, chip: -1 });
    });
    var chip = -1;
    r.toks.forEach(function (t) {
      if (t.note) return;
      chip++;
      if (t.num != null) {
        String(t.num).split('').forEach(function (c) { list.push({ id: c === '.' ? 'dot' : 'd' + c, chip: chip, fast: true }); });
        if (t.neg) list.push({ id: 'neg', chip: chip });
        return;
      }
      if (t.shift) list.push({ id: t.shift, chip: chip });
      list.push({ id: t.key, chip: chip });
    });
    return { list: list, start: 2, ti: tiRun };
  }
  function screen(seq, id) {
    id = id || model;
    var st = steps(seq, id), c = newCalc(st.ti ? 'ti30xa' : id);
    st.list.forEach(function (s) { c.press(s.id); });
    return c.display();
  }
  function screenText(d) { return d.main + (d.exp ? ' ×10^' + String(d.exp).trim() : ''); }

  /* ---------- key-chip blocks ---------- */
  function startChips(id) {
    id = id || model;
    return (START[id]).map(function (t) {
      if (t.shift) return '<kbd class="tk tk-2nd' + SHIFT_CLASS[t.shift] + '">' + SHIFT_LABEL[t.shift] + '</kbd><kbd class="tk tk-fn tk-sec' + SEC_CLASS[t.shift] + '">' + esc(label(t, id, null)) + '</kbd>';
      return '<kbd class="tk tk-op">' + esc(label(t, id, null)) + '</kbd>';
    }).join('');
  }
  function heading(id) {
    id = id || model;
    var sub = SUB[id];
    return {
      title: 'On the ' + BY[id].name,
      subHtml: sub.pre + startChips(id) + sub.post,
      subText: sub.pre + START[id].map(function (t) { return (t.shift ? SHIFT_LABEL[t.shift] + ' ' : '') + label(t, id, null); }).join(' ') + sub.post
    };
  }
  /* the calculator line of an exam's instructions */
  function examIntro(id) {
    id = id || model;
    return 'Use the ' + BY[id].name + (id === 'hp15c' ? ' in Degrees mode.' : ' in DEG mode.');
  }
  function screenHtml(d) { return '<span class="tk-lcd">' + esc(d.main) + (d.exp ? '<sup>' + esc(String(d.exp).trim()) + '</sup>' : '') + '</span>'; }
  /* the same block TIKeys.html builds, for the selected model: list [{label, seq}], opts.hideScreen */
  function blockHtml(list, opts, id) {
    opts = opts || {};
    id = id || model;
    if (!list || !list.length) return '';
    var hd = heading(id);
    var h = '<div class="tikeys" data-calc-model="' + id + '"><p class="tikeys-h"><span class="tikeys-title">' + esc(hd.title) + '</span><span class="tikeys-sub">' + hd.subHtml + '</span></p><ol class="tikeys-list">';
    list.forEach(function (k) {
      h += '<li class="tikeys-row"><span class="tikeys-lab">' + esc(k.label) + '</span><span class="tikeys-seq">' + chipsHtml(k.seq, id) + '</span>' +
        '<span class="tikeys-out">' + (opts.hideScreen ? '' : '<span class="tikeys-scr">Screen</span>' + screenHtml(screen(k.seq, id))) +
        '<button type="button" class="tikeys-run" data-seq="' + esc(k.seq) + '">Run on calculator</button></span></li>';
    });
    return h + '</ol></div>';
  }
  /* CalcKit.renderChips: a chip row for the selected model inside el, rendered again whenever the model changes */
  var rendered = [];
  function renderChips(el, seq) {
    if (!el) return;
    el.setAttribute('data-calc-seq', seq);
    el.innerHTML = chipsHtml(seq);
    el.setAttribute('data-calc-model', model);
    if (rendered.indexOf(el) < 0) rendered.push(el);
  }
  onChange(function () {
    rendered = rendered.filter(function (el) { return el.isConnected !== false; });
    rendered.forEach(function (el) { el.innerHTML = chipsHtml(el.getAttribute('data-calc-seq')); el.setAttribute('data-calc-model', model); });
  });

  return {
    models: models, getModel: getModel, setModel: setModel, onChange: onChange, info: info,
    keysFor: keysFor, notesFor: notesFor, tokensFor: tokensFor, pageTokens: pageTokens,
    chipsHtml: chipsHtml, exportChips: exportChips, examIntro: examIntro, renderChips: renderChips, blockHtml: blockHtml, heading: heading,
    screen: screen, screenText: screenText, screenHtml: screenHtml, steps: steps, newCalc: newCalc,
    STORE: STORE, START: START
  };
})(typeof window !== 'undefined' ? window : global);
if (typeof module !== 'undefined' && module.exports) module.exports = CalcKit;

/* ===== ui-popup.js ===== */
/* Calculator faceplate: popup panel inside the page, own-window mode at #calc, keyboard input and key playback.
   Built on the TI-30Xa popup (TICalc). The model menu at the top right switches between the TI-30Xa, the Sharp
   EL-531XT and the HP-15C: the whole panel is drawn again as that calculator, and every run plays the selected
   model's keys (CalcKit translates the canonical TI-30Xa sequence). Speed, jog, hide operations, the run glow
   messages and the compact phone view work the same for all three. API: window.TICalc (unchanged) and
   CalcKit.mount / CalcKit.play. */
(function (G) {
  'use strict';
  var K = G.CalcKit, T = G.TI30, S = G.SharpEL, H = G.HP15C, doc = G.document;
  var model = K.getModel();
  var calc = K.newCalc(model);
  var root, lcdMain, lcdExp, lcdInd, lcdTop, live, tape, notesEl, playBox, playTxt, fab;
  var progEl, jogBox, opsShowBtn, lastBox, lastKey, multEl, jogIn, opsIn;
  var playing = null, mounted = false;
  /* playback settings, remembered per viewer: speed multiplier and jog (one key at a time) */
  var SPEEDS = [{ m: 0.5, name: 'Slow' }, { m: 1, name: 'Normal' }, { m: 2, name: 'Fast' }];
  var PREF_KEY = 'access-ti30-play-v1', prefs = { speed: 1, jog: false };
  try {
    var saved = JSON.parse(G.localStorage.getItem(PREF_KEY) || 'null');
    if (saved && SPEEDS.some(function (s) { return s.m === saved.speed; })) prefs.speed = saved.speed;
    if (saved && typeof saved.jog === 'boolean') prefs.jog = saved.jog;
  } catch (e) { /* storage blocked: defaults for this visit */ }
  function savePrefs() { try { G.localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (e) { /* storage blocked */ } }
  var opsOn = false, opsShown = false;
  var standalone = /(^|#)calc$/.test(G.location.hash);

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var NAME = { ti30xa: 'TI-30Xa', el531xt: 'Sharp EL-531XT', hp15c: 'HP-15C' };
  var SHORT = { ti30xa: 'TI-30Xa', el531xt: 'EL-531XT', hp15c: 'HP-15C' };

  /* ---------- TI-30Xa faceplate ---------- */
  var CAT = { '2nd': 'k-2nd', onc: 'k-on', off: 'k-on' };
  function cat(id) {
    if (CAT[id]) return CAT[id];
    if (/^d[0-9]$/.test(id) || id === 'dot' || id === 'neg') return 'k-num';
    return 'k-fn';
  }
  function keyCell(k, extra) {
    var id = k[0], p = k[1], s = k[2];
    var aria = p + (s ? ', 2nd ' + s : '');
    return '<div class="ti-cell' + (extra ? ' ' + extra : '') + '"><span class="k2" aria-hidden="true">' + esc(s || '') + '</span>' +
      '<button type="button" class="ti-k ' + cat(id) + '" data-k="' + id + '" aria-label="' + esc(aria) + '">' + esc(p) + '</button></div>';
  }
  function faceTI() {
    var L = T.LAYOUT, h = '';
    h += '<div class="ti-brand"><span class="ti-model">TI-30Xa layout</span>' + keyCell(L.onc, 'ti-oncell') + '</div>';
    h += '<div class="ti-top">';
    L.top.forEach(function (row) { row.forEach(function (k) { h += keyCell(k); }); });
    h += '</div><div class="ti-lower"><div class="ti-left">';
    L.left.forEach(function (row) { row.forEach(function (k) { h += keyCell(k); }); });
    h += '</div><div class="ti-right">';
    L.right.forEach(function (k) { h += keyCell(k, k[0] === 'eq' ? 'ti-eqcell' : ''); });
    h += '</div></div>';
    return h;
  }

  /* ---------- Sharp EL-531XT faceplate (EL-531TH guide p. 3 key layout; colours from the EL-531XT) ---------- */
  var SH_WHITE = { lp: 1, rp: 1, mul: 1, div: 1, add: 1, sub: 1, eq: 1 };
  function shCell(k, extra) {
    var id = k[0], face = k[1], sec = k[2], al = k[3];
    var cls = /^d[0-9]$/.test(id) || id === 'dot' || id === 'neg' ? 'sk-num' : SH_WHITE[id] ? 'sk-op' : id === '2ndf' ? 'sk-2nd' : id === 'alpha' ? 'sk-alpha' : id === 'onc' ? 'sk-on' : 'sk-fn';
    var aria = face + (sec ? ', 2ndF ' + sec : '') + (al ? ', ALPHA ' + al : '');
    return '<div class="sh-cell' + (extra ? ' ' + extra : '') + '"><span class="sk-lab" aria-hidden="true"><span class="sk-2">' + esc(sec || '') + '</span><span class="sk-a">' + esc(al || '') + '</span></span>' +
      '<button type="button" class="ti-k ' + cls + '" data-k="' + id + '" aria-label="' + esc(aria) + '">' + esc(face) + '</button></div>';
  }
  function faceSharp() {
    var L = S.LAYOUT, R = L.rows, nav = {};
    L.nav.forEach(function (k) { nav[k[0]] = k; });
    var h = '<div class="ti-keys sh-face">';
    h += '<div class="sh-nav">' + shCell(['home', 'HOME', '', '']) + '<div class="sh-pad" role="group" aria-label="Cursor keys">' +
      '<button type="button" class="sh-ar sh-up" data-k="up" aria-label="Up">▲</button><button type="button" class="sh-ar sh-left" data-k="left" aria-label="Left">◀</button>' +
      '<button type="button" class="sh-ar sh-right" data-k="right" aria-label="Right">▶</button><button type="button" class="sh-ar sh-down" data-k="down" aria-label="Down">▼</button></div>' +
      shCell(nav.onc) + shCell(nav['2ndf']) + shCell(nav.mode) + '</div>';
    h += '<div class="sh-row3">';
    R[0].forEach(function (k) { h += shCell(k); });
    h += '</div><div class="sh-fn">';
    for (var r = 1; r <= 3; r++) R[r].forEach(function (k) { h += shCell(k); });
    h += '</div><div class="sh-num">';
    for (var q = 4; q <= 7; q++) R[q].forEach(function (k) { h += shCell(k, k[0] === 'eq' ? 'sh-eqcell' : ''); });
    h += '</div></div>';
    return h;
  }

  /* ---------- HP-15C faceplate (four rows of ten, ENTER two rows high; handbook pp. 18-19) ---------- */
  function hpCell(k, extra) {
    var id = k[0], face = k[1], f = k[2], g = k[3];
    var cls = id === 'f' ? 'hk-f' : id === 'g' ? 'hk-g' : 'hk-k';
    var aria = face + (f ? ', f ' + f : '') + (g ? ', g ' + g : '');
    return '<div class="hp-cell' + (extra ? ' ' + extra : '') + '"><span class="hk-f-lab" aria-hidden="true">' + esc(f || '') + '</span>' +
      '<button type="button" class="ti-k ' + cls + '" data-k="' + id + '" aria-label="' + esc(aria) + '"><span class="hk-face">' + esc(face) + '</span>' +
      (g ? '<span class="hk-g-lab" aria-hidden="true">' + esc(g) + '</span>' : '') + '</button></div>';
  }
  function faceHP() {
    var h = '<div class="ti-keys hp-face"><div class="hp-grid">';
    H.ROWS.forEach(function (row, ri) {
      row.forEach(function (k, ci) {
        if (k[0] === 'enter2') return;
        var extra = k[0] === 'enter' ? 'hp-enter' : '';
        if (ri === 2 && ci >= 1 && ci <= 4) extra += ' hp-clr';
        h += hpCell(k, extra);
      });
    });
    h += '</div></div>';
    return h;
  }

  var HELP = {
    ti30xa: 'Keyboard: digits, + − × ÷ ( ) ^, Enter for =, Backspace for ←, Esc for ON/C.',
    el531xt: 'Keyboard: digits, + − × ÷ ( ) ^, Enter for =, Backspace for DEL, Esc for ON/C. Keys go in the order the expression is written (D.A.L.).',
    hp15c: 'Keyboard: digits, + − × ÷, Enter for ENTER, Backspace for ←. RPN: key a number, ENTER, the next number, then the operation.'
  };
  function build() {
    var h = '';
    h += '<div class="ti-bar"><span class="ti-grip" aria-hidden="true"></span><span class="ti-title">' + esc(NAME[model]) + ' calculator</span>';
    h += '<label class="ti-msel-w"><span class="sr-only">Calculator model</span><select class="ti-msel" aria-label="Calculator model">' +
      K.models().map(function (m) { return '<option value="' + m.id + '"' + (m.id === model ? ' selected' : '') + '>' + esc(SHORT[m.id]) + '</option>'; }).join('') + '</select></label>';
    if (!standalone) h += '<button type="button" class="ti-ic" data-act="popout" title="Open in its own window" aria-label="Open the calculator in its own window"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M11 3h6v6M17 3l-8 8M8 5H4v11h11v-4"/></svg></button>' +
      '<button type="button" class="ti-ic" data-act="close" title="Close" aria-label="Close the calculator"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15"/></svg></button>';
    h += '</div><div class="ti-body">';
    if (model === 'ti30xa') h += '<div class="ti-lcd"><div class="ti-ind" aria-hidden="true"></div><div class="ti-num" aria-hidden="true"><span class="ti-main">0.</span><span class="ti-exp"></span></div></div>';
    else if (model === 'el531xt') h += '<div class="sh-head"><span class="sh-solar" aria-hidden="true"></span><div class="ti-lcd sh-lcd"><div class="ti-ind" aria-hidden="true"></div><div class="sh-eq" aria-hidden="true"></div><div class="ti-num" aria-hidden="true"><span class="ti-main">0.</span><span class="ti-exp"></span></div></div><p class="sh-name"><span>D.A.L.</span><span>EL-531XT</span></p></div>';
    else h += '<div class="hp-head"><div class="ti-lcd hp-lcd"><div class="ti-num" aria-hidden="true"><span class="ti-main">0.0000</span><span class="ti-exp"></span></div><div class="ti-ind" aria-hidden="true"></div></div><p class="hp-name">HP-15C</p></div>';
    h += '<p class="sr-only ti-live" aria-live="polite"></p>';
    h += '<div class="ti-ctl"><div class="ti-speed" role="radiogroup" aria-label="Playback speed"><span class="ti-ctl-l" aria-hidden="true">Speed</span>';
    SPEEDS.forEach(function (s) { h += '<button type="button" class="ti-sp" role="radio" aria-checked="false" data-act="speed" data-speed="' + s.m + '" aria-label="' + s.name + ', ' + s.m + ' times">' + s.name + '</button>'; });
    h += '<output class="ti-mult"></output></div>';
    h += '<div class="ti-sw"><label><input type="checkbox" class="ti-jog-in" role="switch">Jog: one key at a time</label><label><input type="checkbox" class="ti-ops-in" role="switch">Hide operations</label></div></div>';
    h += '<div class="ti-play" hidden><span class="ti-play-t"></span><span class="ti-prog" aria-live="off"></span><button type="button" class="ti-stop" data-act="stop">Stop</button></div>';
    h += '<div class="ti-jog" role="group" aria-label="Jog: one key at a time" hidden><button type="button" class="ti-jb" data-act="back">Back</button><button type="button" class="ti-jb ti-jb-main" data-act="step">Next key</button><button type="button" class="ti-jb" data-act="rest">Play rest</button></div>';
    h += '<button type="button" class="ti-ops-show" data-act="ops" aria-expanded="false" hidden>Show operations</button>';
    h += '<div class="ti-tape" aria-label="Keys pressed"></div>';
    h += '<p class="ti-notes" hidden></p>';
    h += '<p class="ti-last" hidden><span>Key pressed</span><kbd class="tk tk-fn"></kbd></p>';
    h += model === 'ti30xa' ? faceTI() : model === 'el531xt' ? faceSharp() : faceHP();
    h += '<p class="ti-help">' + esc(HELP[model]) + '</p>';
    h += '</div>';
    var keep = root ? { hidden: root.hidden, style: root.getAttribute('style') } : null;
    if (root && root.parentNode) root.parentNode.removeChild(root);
    root = doc.createElement('section');
    root.className = 'ti-pop calc-' + model + (standalone ? ' ti-standalone' : '');
    root.id = 'ti-pop';
    root.setAttribute('data-calc-model', model);
    root.setAttribute('role', standalone ? 'region' : 'dialog');
    root.setAttribute('aria-label', NAME[model] + ' calculator');
    root.innerHTML = h;
    if (!standalone) root.hidden = keep ? keep.hidden : true;
    if (keep && keep.style) root.setAttribute('style', keep.style);
    doc.body.appendChild(root);
    lcdMain = root.querySelector('.ti-main'); lcdExp = root.querySelector('.ti-exp'); lcdInd = root.querySelector('.ti-ind'); lcdTop = root.querySelector('.sh-eq');
    live = root.querySelector('.ti-live'); tape = root.querySelector('.ti-tape'); notesEl = root.querySelector('.ti-notes');
    playBox = root.querySelector('.ti-play'); playTxt = root.querySelector('.ti-play-t');
    progEl = root.querySelector('.ti-prog'); jogBox = root.querySelector('.ti-jog'); opsShowBtn = root.querySelector('.ti-ops-show');
    lastBox = root.querySelector('.ti-last'); lastKey = lastBox.querySelector('kbd'); multEl = root.querySelector('.ti-mult');
    jogIn = root.querySelector('.ti-jog-in'); opsIn = root.querySelector('.ti-ops-in');
    jogIn.addEventListener('change', function () { api.setJog(jogIn.checked); });
    opsIn.addEventListener('change', function () { if (G.HideOps) G.HideOps.set(opsIn.checked); else api.opsChanged(opsIn.checked); });
    root.querySelector('.ti-msel').addEventListener('change', function (e) { K.setModel(e.target.value); });
    root.querySelector('.ti-speed').addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var k = 0;
      SPEEDS.forEach(function (s, j) { if (s.m === prefs.speed) k = j; });
      k = Math.max(0, Math.min(SPEEDS.length - 1, k + d));
      api.setSpeed(SPEEDS[k].m);
      root.querySelector('.ti-sp[aria-checked="true"]').focus();
    });
    root.addEventListener('click', onClick);
    if (!standalone) {
      if (!fab) {
        fab = doc.createElement('button');
        fab.type = 'button';
        fab.className = 'ti-fab';
        fab.setAttribute('aria-controls', 'ti-pop');
        fab.setAttribute('aria-expanded', 'false');
        fab.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="4" y="2" width="12" height="16" rx="2"/><path d="M7 5h6M7 9h1M10 9h1M13 9h0M7 12h1M10 12h1M7 15h1M10 15h1M13 12v3"/></svg><span>Calculator</span>';
        fab.addEventListener('click', function () { api.toggle(); });
        doc.body.appendChild(fab);
      }
      fab.setAttribute('aria-expanded', root.hidden ? 'false' : 'true');
      drag();
    }
    if (standalone) doc.title = NAME[model] + ' calculator';
    paint();
    paintPrefs();
    paintOps();
  }
  function paintPrefs() {
    if (!root) return;
    Array.prototype.forEach.call(root.querySelectorAll('.ti-sp'), function (b) {
      var on = +b.getAttribute('data-speed') === prefs.speed;
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    multEl.textContent = prefs.speed + '×';
    jogIn.checked = prefs.jog;
  }
  /* with operations hidden, the key list stays behind a Show operations button: the screen and keypad still show each key */
  function paintOps() {
    if (!root) return;
    var hide = opsOn && !opsShown;
    root.classList.toggle('ops-hidden', hide);
    opsIn.checked = opsOn;
    opsShowBtn.hidden = !opsOn;
    opsShowBtn.setAttribute('aria-expanded', opsShown ? 'true' : 'false');
    opsShowBtn.textContent = opsShown ? 'Hide operations' : 'Show operations';
    if (!hide) lastBox.hidden = true;
  }
  /* the face label of a key, as printed on the key itself */
  function faceLabel(id) {
    if (model === 'el531xt') return S.KEYS[id] ? S.KEYS[id].face : id;
    if (model === 'hp15c') return H.KEYS[id] ? H.KEYS[id].face : id;
    return T.label(id, false);
  }
  var SHIFTS = { '2nd': 'tk-2nd', '2ndf': 'tk-2nd tk-sh-2ndf', f: 'tk-2nd tk-sh-f', g: 'tk-2nd tk-sh-g' };
  function keyClass(id) {
    if (SHIFTS[id]) return 'tk ' + SHIFTS[id];
    return 'tk ' + (/^d[0-9]$|^dot$|^neg$|^chs$/.test(id) ? 'tk-num' : 'tk-fn');
  }
  function showLast(id) {
    if (!(opsOn && !opsShown) || !id) { lastBox.hidden = true; return; }
    lastKey.textContent = faceLabel(id);
    lastKey.className = keyClass(id);
    lastBox.hidden = false;
  }

  var IND = {
    ti30xa: [['second', '2nd'], ['hyp', 'HYP'], ['angle', null], ['m1', 'M1'], ['m2', 'M2'], ['m3', 'M3'], ['stat', 'STAT'], ['k', 'K'], ['paren', '( )'], ['fix', 'FIX'], ['sci', 'SCI'], ['eng', 'ENG'], ['x', 'x'], ['r', 'r'], ['n', 'n=']],
    el531xt: [['second', '2ndF'], ['hyp', 'HYP'], ['alpha', 'ALPHA'], ['angle', null], ['m', 'M']],
    hp15c: [['f', 'f'], ['g', 'g'], ['rad', 'RAD'], ['grad', 'GRAD']]
  };
  function paint() {
    var d = calc.display();
    lcdMain.textContent = d.off ? '' : d.main;
    lcdExp.textContent = d.exp ? String(d.exp).trim() : '';
    if (lcdTop) lcdTop.textContent = d.off ? '' : (d.top || '');
    var h = '';
    IND[model].forEach(function (it) {
      var on = it[1] === null ? !d.off : !!(d.ind && d.ind[it[0]]);
      var txt = it[1] === null ? (d.ind && d.ind.angle) || 'DEG' : it[1];
      h += '<span class="' + (on ? 'on' : '') + '">' + esc(txt) + '</span>';
    });
    lcdInd.innerHTML = h;
    live.textContent = d.off ? 'Calculator off' : 'Display ' + d.main + (d.exp ? ' times ten to the ' + String(d.exp).trim() : '');
  }
  function flash(id) {
    var b = root.querySelector('[data-k="' + id + '"]');
    if (!b) return;
    b.classList.add('is-hit');
    setTimeout(function () { b.classList.remove('is-hit'); }, 200);
  }
  function addTape(id) {
    var span = doc.createElement('kbd');
    span.className = keyClass(id);
    span.textContent = faceLabel(id);
    tape.appendChild(span);
    while (tape.childNodes.length > 24) tape.removeChild(tape.firstChild);
  }
  function press(id, fromPlay) {
    if (!fromPlay && playing) stop();
    calc.press(id);
    flash(id);
    if (!fromPlay) addTape(id);
    paint();
  }
  function onClick(e) {
    var k = e.target.closest('.ti-k, .sh-ar');
    if (k) { press(k.dataset.k); return; }
    var a = e.target.closest('[data-act]');
    if (!a) return;
    var act = a.dataset.act;
    if (act === 'close') api.close();
    else if (act === 'popout') api.popout();
    else if (act === 'stop') stop();
    else if (act === 'speed') api.setSpeed(+a.getAttribute('data-speed'));
    else if (act === 'step') jogStep();
    else if (act === 'back') jogBack();
    else if (act === 'rest') jogRest();
    else if (act === 'ops') { opsShown = !opsShown; paintOps(); }
  }

  /* ---------- playback ---------- */
  function stop() {
    if (playing) {
      clearTimeout(playing.timer);
      /* tell the page that asked for this run that it was stopped */
      if (playing.src) post(playing.src, { ti30: 'stop', id: playing.id });
      if (playing.cb && playing.cb.onStop) { try { playing.cb.onStop(); } catch (e) { /* caller's own code */ } }
      playing = null;
    }
    if (!root) return;
    playBox.hidden = true;
    jogBox.hidden = true;
    lastBox.hidden = true;
    notesEl.hidden = true;
    root.classList.remove('is-playing');
    Array.prototype.forEach.call(tape.querySelectorAll('.is-now'), function (n) { n.classList.remove('is-now'); });
  }
  function post(src, msg) { try { src.postMessage(msg, '*'); } catch (e) { /* the page has gone */ } }
  /* step times: 240 ms for a digit, 420 ms for any other key, divided by the speed multiplier */
  function delay(s) { return Math.round((s.fast ? 240 : 420) / prefs.speed); }
  function lightChip(chip) {
    var p = playing;
    Array.prototype.forEach.call(tape.querySelectorAll('.is-now'), function (n) { n.classList.remove('is-now'); });
    if (p && chip >= 0 && p.map[chip]) p.map[chip].forEach(function (n) { if (n) n.classList.add('is-now'); });
  }
  /* the two opening presses are not counted: "Key 3 of 11" counts the keys of the sequence itself */
  function paintProg() {
    var p = playing;
    if (!p) return;
    progEl.textContent = 'Key ' + Math.max(0, p.i - 2) + ' of ' + p.keys;
  }
  function paintJog() {
    var p = playing;
    jogBox.hidden = !(p && p.paused);
    progEl.setAttribute('aria-live', p && p.paused ? 'polite' : 'off');
    if (!p || !p.paused) return;
    jogBox.querySelector('[data-act="back"]').disabled = p.i <= 2;
    playTxt.textContent = p.i <= 2 ? 'Jog: press Next key' : 'Jog: paused';
  }
  /* press the next key of the run and tell the page which chip it was */
  function doStep() {
    var p = playing, s = p.steps[p.i++];
    lightChip(s.chip);
    if (p.src) post(p.src, { ti30: 'step', chip: s.chip, id: p.id });
    if (p.cb && p.cb.onStep) { try { p.cb.onStep(s.chip, p.chips[s.chip] || null); } catch (e) { /* caller's own code */ } }
    press(s.id, true);
    showLast(p.i > 2 ? s.id : null);
    paintProg();
    return s;
  }
  function finish() {
    var p = playing;
    playTxt.textContent = 'Done. The screen shows the answer.';
    jogBox.hidden = true;
    if (p && p.src) post(p.src, { ti30: 'done', id: p.id });
    if (p && p.cb && p.cb.onDone) { try { p.cb.onDone(); } catch (e) { /* caller's own code */ } }
    playing = null;
    setTimeout(function () { if (!playing) { playBox.hidden = true; lastBox.hidden = true; notesEl.hidden = true; root.classList.remove('is-playing'); } }, 2600);
  }
  function next() {
    var p = playing;
    if (!p) return;
    if (p.i >= p.steps.length) { finish(); return; }
    /* jog: the opening presses play by themselves, then every key waits for Next key */
    if (p.jog && p.i >= 2) {
      var first = !p.paused;
      p.paused = true;
      paintJog();
      if (first && root.contains(doc.activeElement) === false) { try { jogBox.querySelector('[data-act="step"]').focus({ preventScroll: true }); } catch (e) { /* focus refused */ } }
      return;
    }
    var s = doStep();
    p.timer = setTimeout(next, delay(s));
  }
  function jogStep() {
    var p = playing;
    if (!p || !p.paused) return;
    doStep();
    if (p.i >= p.steps.length) { finish(); return; }
    paintJog();
  }
  /* Back: a calculator has no undo, so replay the run from the start, without sound or messages, to one key before.
     The TI-30Xa starts again from ON/C. The Sharp and the HP start again from the state the run started in. */
  function snap(c) {
    var o = Object.create(Object.getPrototypeOf(c)), j = JSON.parse(JSON.stringify(c));
    Object.keys(j).forEach(function (k) { o[k] = j[k]; });
    return o;
  }
  function jogBack() {
    var p = playing;
    if (!p || !p.paused || p.i <= 2) return;
    var target = p.i - 1;
    if (p.snap) calc = snap(p.snap); else calc.press('onc');
    for (var k = 0; k < target; k++) calc.press(p.steps[k].id);
    p.i = target;
    paint();
    var s = p.steps[p.i - 1], chip = p.i > 2 ? s.chip : -1;
    lightChip(chip);
    if (p.src) post(p.src, { ti30: 'step', chip: chip, id: p.id });
    if (p.cb && p.cb.onStep) { try { p.cb.onStep(chip, p.chips[chip] || null); } catch (e) { /* caller's own code */ } }
    showLast(p.i > 2 ? s.id : null);
    paintProg();
    paintJog();
  }
  function jogRest() {
    var p = playing;
    if (!p) return;
    p.jog = false;
    p.paused = false;
    jogBox.hidden = true;
    progEl.setAttribute('aria-live', 'off');
    playTxt.textContent = 'Playing the key presses';
    clearTimeout(p.timer);
    next();
  }
  /* seq: a canonical TI-30Xa key sequence. source and id: the page that asked (from the message event) gets step, done
     and stop messages back. cb: {onStep(i, chip), onDone, onStop} for CalcKit.play */
  function play(seq, source, id, cb) {
    api.open();
    stop();
    var st = K.steps(seq, model);
    var chips = K.keysFor(seq, model);
    if (st.ti && model !== 'ti30xa') {
      /* the translator could not carry these keys over: say so instead of pressing keys this model does not have */
      playBox.hidden = false;
      playTxt.textContent = K.notesFor(seq, model).join(' ');
      if (source) post(source, { ti30: 'done', id: id });
      if (cb && cb.onDone) { try { cb.onDone(); } catch (e) { /* caller's own code */ } }
      return;
    }
    tape.innerHTML = K.chipsHtml(seq, model).replace(/<span class="tk-note">[\s\S]*?<\/span>/g, '');
    var notes = K.notesFor(seq, model);
    notesEl.textContent = notes.join(' ');
    notesEl.hidden = !notes.length;
    var chipEls = tape.querySelectorAll('kbd'), map = [], ci = 0;
    chips.forEach(function (c, i) { var n = c.kind === 'num' && c.key === 'num' ? (c.neg ? 2 : 1) : (c.shift && c.key !== '2nd' ? 2 : 1); map[i] = []; for (var j = 0; j < n; j++) map[i].push(chipEls[ci++]); });
    opsShown = false;
    paintOps();
    playBox.hidden = false;
    root.classList.add('is-playing');
    playTxt.textContent = prefs.jog ? 'Jog: press Next key' : 'Playing the key presses';
    playing = { timer: null, src: source || null, id: id, steps: st.list, i: 0, map: map, chips: chips, keys: st.list.length - 2, jog: prefs.jog, paused: false, cb: cb || null, snap: model === 'ti30xa' ? null : snap(calc) };
    paintProg();
    if (model === 'ti30xa') calc.press('onc');
    next();
  }

  /* ---------- dragging ---------- */
  function drag() {
    var bar = root.querySelector('.ti-bar'), sx, sy, ox, oy, on = false;
    bar.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button, select, label') || G.matchMedia('(max-width: 640px)').matches) return;
      on = true; bar.setPointerCapture(e.pointerId);
      var r = root.getBoundingClientRect();
      sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top;
    });
    bar.addEventListener('pointermove', function (e) {
      if (!on) return;
      var x = Math.min(Math.max(0, ox + e.clientX - sx), G.innerWidth - 120), y = Math.min(Math.max(0, oy + e.clientY - sy), G.innerHeight - 60);
      root.style.left = x + 'px'; root.style.top = y + 'px'; root.style.right = 'auto'; root.style.bottom = 'auto';
    });
    bar.addEventListener('pointerup', function () { on = false; });
  }

  /* ---------- keyboard ---------- */
  var KB = {
    ti30xa: { '+': 'add', '-': 'sub', '*': 'mul', 'x': 'mul', '/': 'div', '^': 'pow', '(': 'lp', ')': 'rp', '=': 'eq', 'Enter': 'eq', 'Backspace': 'back', 'Escape': 'onc', '.': 'dot' },
    el531xt: { '+': 'add', '-': 'sub', '*': 'mul', 'x': 'mul', '/': 'div', '^': 'pow', '(': 'lp', ')': 'rp', '=': 'eq', 'Enter': 'eq', 'Backspace': 'del', 'Escape': 'onc', '.': 'dot' },
    hp15c: { '+': 'add', '-': 'sub', '*': 'mul', 'x': 'mul', '/': 'div', '^': 'pow', 'Enter': 'enter', '=': 'enter', 'Backspace': 'back', '.': 'dot' }
  };
  doc.addEventListener('keydown', function (e) {
    if (!root || root.hidden || e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    if (!standalone && !root.contains(t) && t !== doc.body) return;
    if (e.key === 'Escape' && !standalone) { e.preventDefault(); api.close(); return; }
    /* jog: Space or Right arrow presses the next key, Left arrow steps back (a focused button keeps its own Space) */
    if (playing && playing.paused && root.contains(t) && !(t.closest && t.closest('.ti-speed'))) {
      var onBtn = t.closest && t.closest('button, input');
      if (e.key === 'ArrowRight' || (e.key === ' ' && !onBtn)) { e.preventDefault(); jogStep(); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); jogBack(); return; }
    }
    var id = /^[0-9]$/.test(e.key) ? 'd' + e.key : KB[model][e.key];
    if (!id) return;
    e.preventDefault();
    press(id);
  });

  /* ---------- model switch: the whole panel is drawn again as the chosen calculator ---------- */
  function switchModel(id) {
    if (id === model) return;
    var wasOpen = root && !root.hidden, focusSel = root && root.contains(doc.activeElement) && doc.activeElement.classList.contains('ti-msel');
    stop();
    model = id;
    calc = K.newCalc(model);
    if (root) {
      build();
      if (!standalone) root.hidden = !wasOpen;
      if (focusSel) { try { root.querySelector('.ti-msel').focus(); } catch (e) { /* focus refused */ } }
    }
  }
  K.onChange(switchModel);

  var api = {
    open: function () {
      if (!root) build();
      root.hidden = false;
      if (fab) fab.setAttribute('aria-expanded', 'true');
    },
    close: function () {
      stop();
      root.hidden = true;
      if (fab) { fab.setAttribute('aria-expanded', 'false'); fab.focus(); }
    },
    toggle: function () { if (!root || root.hidden) { api.open(); root.querySelector('.ti-k').focus(); } else api.close(); },
    play: play,
    press: press,
    popout: function () {
      var url = G.location.href.split('#')[0] + '#calc';
      var w = null;
      try { w = G.open(url, 'ti30xa', 'popup,width=' + (model === 'hp15c' ? 640 : 400) + ',height=' + (model === 'hp15c' ? 620 : 760)); } catch (e) { w = null; }
      if (!w) { playBox.hidden = false; playTxt.textContent = 'This browser blocked a new window. Use the calculator here.'; }
    },
    standalone: standalone,
    setSpeed: function (m) {
      if (!SPEEDS.some(function (s) { return s.m === m; })) return;
      prefs.speed = m; savePrefs(); paintPrefs();
    },
    setJog: function (on) {
      prefs.jog = !!on; savePrefs(); paintPrefs();
      if (!on && playing && playing.paused) jogRest();
    },
    prefs: function () { return { speed: prefs.speed, jog: prefs.jog }; },
    jogStep: function () { jogStep(); },
    jogBack: function () { jogBack(); },
    jogRest: function () { jogRest(); },
    state: function () { return playing ? { id: playing.id, key: Math.max(0, playing.i - 2), keys: playing.keys, paused: !!playing.paused } : null; },
    opsChanged: function (on) { opsOn = !!on; opsShown = false; paintOps(); },
    model: function () { return model; },
    setModel: function (id) { K.setModel(id); }
  };
  Object.defineProperty(api, 'calc', { get: function () { return calc; }, enumerable: true });
  G.TICalc = api;
  /* CalcKit.mount: the floating Calculator button and the popup. CalcKit.play: a run with callbacks */
  K.mount = function (opts) {
    opts = opts || {};
    if (opts.standalone) standalone = true;
    if (!root) build();
    if (opts.open) api.open();
    mounted = true;
    return api;
  };
  K.play = function (seq, o) {
    o = o || {};
    play(seq, null, o.id, { onStep: o.onStep, onDone: o.onDone, onStop: o.onStop });
  };
  K.popup = api;
  G.addEventListener('message', function (e) {
    var d = e.data;
    if (d && d.ti30 === 'play' && typeof d.seq === 'string') play(d.seq, e.source, d.id);
    if (d && d.ti30 === 'open') api.open();
  });
  function start() {
    if (G.CALCKIT_NO_AUTOMOUNT && !standalone) return;
    build();
    if (standalone) doc.documentElement.classList.add('calc-only');
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start); else start();
})(window);

/* ===== frame-layer.js ===== */
/* CalcKit page layer: carries the selected calculator model into one document (the shell itself or a hub frame,
   which are same-origin srcdoc frames), the same way the hide-operations layer is put into each frame.
   - TI30.tokens answers with the selected model's tokens, so every glow chip map in the page lines up with the
     chips on screen and with the keys the calculator plays.
   - TIKeys.html, render, chips and screen build blocks for the selected model.
   - Key-chip blocks already on the page (.tikeys, including pre-rendered ones) are rebuilt from their data-seq:
     title, start line, chips and screen. A MutationObserver keeps blocks added later in step.
   - The frame's <html> gets data-calc-model, and a {calcModel} message switches the layer too.
   With the TI-30Xa selected and nothing switched yet, nothing on the page is touched.
   CalcKit.installLayer(W) returns W.CalcKitLayer. Chip colours are fixed key-cap colours, like the TI-30Xa chips. */
(function (G) {
  'use strict';
  var K = G.CalcKit;
  var CSS = '.tk-sh-2ndf { background: rgb(240, 150, 40); color: rgb(20, 22, 24); border-color: rgb(150, 80, 10); }' +
    '.tk-sec-2ndf { box-shadow: 0 2px 0 rgb(150, 80, 10); border-color: rgb(150, 80, 10); }' +
    '.tk-sh-f { background: rgb(232, 176, 104); color: rgb(20, 22, 24); border-color: rgb(140, 96, 40); }' +
    '.tk-sec-f { box-shadow: 0 2px 0 rgb(140, 96, 40); border-color: rgb(140, 96, 40); }' +
    '.tk-sh-g { background: rgb(112, 172, 224); color: rgb(20, 22, 24); border-color: rgb(40, 90, 140); }' +
    '.tk-sec-g { box-shadow: 0 2px 0 rgb(40, 90, 140); border-color: rgb(40, 90, 140); }' +
    '.tk-alpha { box-shadow: 0 2px 0 rgb(30, 110, 60); border-color: rgb(30, 110, 60); }' +
    '.tk-note { display: block; margin: 2px 0 6px; font: italic 400 13px/1.4 var(--font-body, sans-serif); color: var(--muted, rgb(90, 90, 90)); white-space: normal; }' +
    '.tikeys[data-calc-model="el531xt"] { border-left-color: rgb(240, 150, 40); }' +
    '.tikeys[data-calc-model="hp15c"] { border-left-color: rgb(232, 176, 104); }' +
    '.tikeys[data-calc-model="el531xt"] .tikeys-run:hover { border-color: rgb(240, 150, 40); }' +
    '.tikeys[data-calc-model="hp15c"] .tikeys-run:hover { border-color: rgb(196, 140, 70); }';
  function install(W) {
    var D;
    try { D = W.document; } catch (e) { return null; }
    if (!D || !D.documentElement || !D.body) return null;
    if (W.CalcKitLayer) return W.CalcKitLayer;
    var st = D.createElement('style');
    st.id = 'calckit-layer-style';
    st.textContent = CSS;
    (D.head || D.documentElement).appendChild(st);
    var model = 'ti30xa', mo = null, queued = false;
    /* TI30.tokens: the page's own engine keeps working (its run and parse use the original), only the token list
       handed to page scripts follows the model */
    function wrapTokens() {
      var T = W.TI30;
      if (!T || typeof T.tokens !== 'function' || T.__calcKitOrig) return;
      var orig = T.tokens;
      T.__calcKitOrig = orig;
      T.tokens = function (seq) { return model === 'ti30xa' ? orig.apply(this, arguments) : K.pageTokens(seq, model); };
    }
    function wrapTIKeys() {
      var TK = W.TIKeys;
      if (!TK || TK.__calcKit) return;
      TK.__calcKit = true;
      var o = { html: TK.html, chips: TK.chips, screen: TK.screen };
      TK.html = function (list, opts) { return model === 'ti30xa' && o.html ? o.html.apply(this, arguments) : K.blockHtml(list, opts, model); };
      TK.render = function (container, list, opts) {
        if (!container) return;
        var old = container.querySelector(':scope > .tikeys');
        if (old) old.remove();
        var s = TK.html(list, opts);
        if (s) container.insertAdjacentHTML('beforeend', s);
      };
      if (o.chips) TK.chips = function (seq) { return model === 'ti30xa' ? o.chips.apply(this, arguments) : K.chipsHtml(seq, model); };
      if (o.screen) TK.screen = function (seq) { return model === 'ti30xa' ? o.screen.apply(this, arguments) : K.screen(seq, model); };
    }
    /* one block, rebuilt for the model from the data-seq of each row */
    function rebuild(box) {
      var hd = K.heading(model);
      var title = box.querySelector('.tikeys-title');
      if (title && /^On the /.test(title.textContent)) title.textContent = hd.title;
      var sub = box.querySelector('.tikeys-sub');
      if (sub && /^Start with/.test(sub.textContent)) sub.innerHTML = hd.subHtml;
      Array.prototype.forEach.call(box.querySelectorAll('.tikeys-row'), function (row) {
        var run = row.querySelector('.tikeys-run'), seq = run && run.getAttribute('data-seq');
        if (!seq) return;
        var chips = row.querySelector('.tikeys-seq');
        if (chips) chips.innerHTML = K.chipsHtml(seq, model);
        var lcd = row.querySelector('.tikeys-out .tk-lcd');
        if (lcd) lcd.outerHTML = K.screenHtml(K.screen(seq, model));
      });
      box.setAttribute('data-calc-model', model);
    }
    function scan() {
      queued = false;
      wrapTokens(); wrapTIKeys();
      Array.prototype.forEach.call(D.querySelectorAll('.tikeys'), function (box) {
        var has = box.getAttribute('data-calc-model') || 'ti30xa';
        if (has !== model) rebuild(box);
      });
    }
    function later() { if (!queued) { queued = true; W.setTimeout(scan, 0); } }
    function set(id) {
      if (!id) return;
      model = id;
      D.documentElement.setAttribute('data-calc-model', id);
      scan();
      if (!mo && W.MutationObserver) { mo = new W.MutationObserver(later); mo.observe(D.body, { childList: true, subtree: true }); }
    }
    W.addEventListener('message', function (e) { var d = e.data; if (d && typeof d.calcModel === 'string' && d.calcModel !== model) set(d.calcModel); });
    W.CalcKitLayer = { set: set, model: function () { return model; }, scan: scan };
    set(K.getModel());
    return W.CalcKitLayer;
  }
  K.installLayer = install;
})(typeof window !== 'undefined' ? window : this);

/* Run buttons in a page that uses the kit on its own: play the sequence on the selected calculator */
(function () {
  'use strict';
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.tikeys-run');
    if (!b || window.HubGlow || !b.getAttribute('data-seq')) return;
    e.preventDefault();
    if (!window.CalcKit.popup) window.CalcKit.mount({});
    window.CalcKit.play(b.getAttribute('data-seq'), {});
  });
  window.CalcKit.onChange(function () { try { window.CalcKit.installLayer(window); } catch (e) { /* no page layer needed */ } });
})();
