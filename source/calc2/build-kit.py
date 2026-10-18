"""Builds calc2/calc-kit.js: a standalone, dependency-free CalcKit (TI-30Xa, Sharp EL-531XT and HP-15C emulators,
the translator, the popup and the key chips) for the Shape Canvas app. The styles are the hub's own calculator
styles, taken from hub-v9.html so both look the same, plus the model faceplates.
Usage: python3 build-kit.py"""
import os, json
S = os.path.dirname(os.path.abspath(__file__))
hub = open(os.path.join(S, '..', 'hub', 'hub-v9.html'), encoding='utf-8').read()

def between(a, b, include_end=False):
    i = hub.index(a)
    j = hub.index(b, i)
    return hub[i:j + (len(b) if include_end else 0)] + '\n'

css = ''
css += [l for l in hub.split('\n') if l.startswith('.sr-only {')][0] + '\n'
css += between('/* ---------- TI-30Xa key chips and sequence blocks ---------- */', '/* ---------- level picker ---------- */')
css += between('/* ---------- calculator ---------- */', '@media print { .ti-pop, .ti-fab, .tikeys-run { display: none !important; } }', True)
css += between('/* ---------- calculator: playback speed, jog (one key at a time) and hide operations ---------- */', '/* ---------- hide operations: one switch for every tab ---------- */')
css += between('/* short laptop screens: slightly shorter keys', '/* ---------- calculator run glow: hub kit v1')
glow = hub.index('/* ---------- calculator run glow: hub kit v1')
css += hub[glow:hub.index('</style>', glow)]
css += open(os.path.join(S, 'src', 'popup.css'), encoding='utf-8').read()
assert '</' not in css

def part(name):
    return open(os.path.join(S, name), encoding='utf-8').read().rstrip() + '\n'

out = '''/* CalcKit standalone build (calc2/calc-kit.js). Dependency-free: no other file or library is needed.
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
  var CSS = ''' + json.dumps(css) + ''';
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
'''
for n in ['ti30.js', 'src/core-sharp.js', 'src/core-hp.js', 'src/core-translate.js', 'src/calc-kit-core.js', 'src/ui-popup.js', 'src/frame-layer.js']:
    out += '\n/* ===== ' + os.path.basename(n) + ' ===== */\n' + part(n)
out += '''
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
'''
open(os.path.join(S, 'calc-kit.js'), 'w', encoding='utf-8').write(out)
print('wrote calc-kit.js', len(out))
