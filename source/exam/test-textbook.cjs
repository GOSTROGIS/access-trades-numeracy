/* Run from any directory: node source/exam/test-textbook.cjs. No dependencies. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'numeracy-hub/index.html'), 'utf8');
const TI30 = require('../calc2/ti30.js');
const Shapes = require('../canvas/src/vendor/shapes-engine.js');
const ctx = { TI30 };
ctx.window = ctx;
const keysStart = html.lastIndexOf('/* Key-cap chips for TI-30Xa');
const coreStart = html.indexOf('/* Difficulty levels, a shared task bank', keysStart);
const coreEnd = html.indexOf('\nvar ANG = ', coreStart);
assert(keysStart > 0 && coreStart > keysStart && coreEnd > coreStart, 'Hub engine boundaries');
vm.runInNewContext(html.slice(keysStart, coreEnd), ctx);
const C = ctx.ExamCore;
const bank = require('../../numeracy-hub/exam-textbook.js')(C, Shapes, require('../../numeracy-hub/exam-textbook-geometry.js'));
assert.deepEqual(bank.chapters.map(c => c.id), [...Array.from({length:13}, (_, i) => String(i+1)), 'A']);
assert.equal(new Set(bank.tasks.map(t => t.uid)).size, bank.tasks.length);
for (const ch of bank.chapters) assert(bank.tasks.filter(t => t.module === 'textbook:' + ch.id).length >= 4, ch.label);
let cases = 0, drawings = 0, calculatorSteps = 0;
for (const task of bank.tasks) {
  const unique = new Set();
  for (let seed = 1; seed <= 24; seed++) {
    for (const level of C.LEVELS) {
      // noConvert is attached by the real registry adapter, so use it here too.
      task.noConvert = true;
      const q = C.applyLevel(task, seed * 9001, level);
      const again = C.applyLevel(task, seed * 9001, level);
      assert.equal(q.qHtml, again.qHtml, task.uid + ' deterministic prompt');
      assert.equal(q.answers[0].value, again.answers[0].value, task.uid + ' deterministic answer');
      unique.add(q.qHtml);
      assert(q.steps.length >= 3 && q.steps.some(step => step.includes('Textbook reference:')), task.uid + ' worked answer and reference');
      assert(!/NaN|undefined|Infinity/.test(q.qHtml + q.steps.join(' ')), task.uid);
      for (const a of q.answers) {
        assert(Number.isFinite(a.value), task.uid);
        assert(a.check(a.display).ok, task.uid + ' displayed answer accepted: ' + a.display);
        assert(a.check(String(a.value)).ok, task.uid + ' exact answer accepted');
        assert(a.check(a.display + ' ' + a.unit).ok, task.uid + ' units accepted');
        assert(!a.check(String(a.value + 1)).ok, task.uid + ' wrong answer rejected');
        assert(!a.check('nonsense').ok && !a.check('').ok, task.uid + ' invalid answers rejected');
      }
      if (q.figSvg) { assert(q.figSvg.includes('<svg') && !/NaN|undefined|Infinity/.test(q.figSvg), task.uid + ' SVG'); drawings++; }
      for (const k of q.keys) {
        const calc = new TI30.Calc(); calc.run(k.seq);
        assert(!calc.display().error && Math.abs(calc.value() - k.expect) <= 1e-6 * Math.max(1, Math.abs(k.expect)), task.uid + ' calculator'); calculatorSteps++;
      }
      cases++;
    }
  }
  assert(unique.size >= 6, task.uid + ' prompt variation');
}
const model = C.bankFromRegistry(ctx);
assert.equal(model.modules.length, 14);
assert.equal(model.errors.length, 0);
for (const m of model.modules) {
  const exam = C.buildExam(model, {modules:[m.id], level:1, count:25, seed:346198});
  assert.equal(exam.questions.length, 25, m.title + ' fills a 25-question exam');
  const rebuilt = C.buildExam(model, C.decodeCode(model, exam.code));
  assert.equal(JSON.stringify(exam.questions.map(q => [q.qHtml, q.answers.map(a => a.value)])), JSON.stringify(rebuilt.questions.map(q => [q.qHtml, q.answers.map(a => a.value)])), m.title + ' code rebuild');
}
// Independent expected arithmetic for a representative task in every chapter.
const expected = {
  '1:spacing':q=>{const m=C.strip(q.qHtml).match(/of (\d+) post centres spans (\d+) mm/);return +m[2]/(+m[1]-1);},
  '2:square':q=>{const m=C.strip(q.qHtml).match(/calculate ([\d.]+)²/);return (+m[1])**2;},
  '3:multiply-first':q=>{const m=C.strip(q.qHtml).match(/Evaluate (\d+) \+ (\d+) × (\d+)/);return +m[1]+(+m[2])*(+m[3]);},
  '4:multiply':q=>{const m=C.strip(q.qHtml).match(/needs (\d+) pieces, each (.+?) in long/);return +m[1]*C.parseNum(m[2]);},
  '5:price':q=>{const m=C.strip(q.qHtml).match(/costs \$([\d.]+).*for ([\d.]+) m/);return +m[1]*(+m[2]);},
  '6:inverse':q=>{const m=C.strip(q.qHtml).match(/takes (\d+) workers (\d+) hours.*would (\d+) workers/);return +m[1]*(+m[2])/(+m[3]);},
  '7:board-feet':q=>{const m=C.strip(q.qHtml).match(/use (\d+) in thickness, (\d+) in width and (\d+) ft length.*for (\d+) boards/);return +m[1]*(+m[2])*(+m[3])*(+m[4])/12;},
  '8:linear':q=>{const m=C.strip(q.qHtml).match(/Solve (\d+)x \+ (\d+) = (\d+)/);return (+m[3]-(+m[2]))/(+m[1]);},
  '9:round-edging':q=>Math.PI*(+C.strip(q.qHtml).match(/diameter of ([\d.]+) m/)[1]),
  '10:sheet-takeoff':q=>{const m=C.strip(q.qHtml).match(/requires (\d+) m².*Add (\d+)%/);return Math.ceil(+m[1]*(100+(+m[2]))/288);},
  '11:slab-concrete':q=>{const m=C.strip(q.qHtml).match(/slab is (\d+) m long, (\d+) m wide and (\d+) mm thick.*when (\d+)%/);return +m[1]*(+m[2])*(+m[3])/1000*(1+(+m[4])/100);},
  '12:missing-run':q=>{const m=C.strip(q.qHtml).match(/brace is ([\d.]+) m long.*point ([\d.]+) m vertically/);return Math.sqrt((+m[1])**2-(+m[2])**2);},
  '13:rafter-length':q=>{const m=C.strip(q.qHtml).match(/angle of (\d+)°.*is ([\d.]+) m/);return +m[2]/Math.cos(+m[1]*Math.PI/180);},
  'A:cups':q=>250*(+C.strip(q.qHtml).match(/in ([\d.]+) cups/)[1])
};
for (const [id, oracle] of Object.entries(expected)) {
  const task = bank.tasks.find(t=>t.id===id); assert(task,id);
  for(let seed=11;seed<71;seed++) {const q=task.make(seed,C.LEVELS[1]);const v=oracle(q);assert(Math.abs(v-q.answers[0].value)<1e-9*Math.max(1,Math.abs(v)),id+' independent arithmetic');}
}
// Regression: decimal money half-cent ties and exact whole sheet boundaries.
const priceTask = bank.tasks.find(t => t.id === '5:price');
let halfCentCases = 0;
for (let seed = 1; seed <= 1000; seed++) {
  const q = priceTask.make(seed, C.LEVELS[1]);
  const m = C.strip(q.qHtml).match(/costs \$([\d.]+).*for ([\d.]+) m/);
  const cents = Math.round(Number(m[1]) * 100), tenths = Math.round(Number(m[2]) * 10);
  const numerator = cents * tenths;
  if (numerator % 10 === 5) {
    const expected = (Math.floor((numerator + 5) / 10) / 100).toFixed(2);
    assert.equal(q.answers[0].display, expected, 'half-cent monetary rounding'); halfCentCases++;
  }
}
assert(halfCentCases > 50);
const geometryTasks = {};
require('../../numeracy-hub/exam-textbook-geometry.js')({
  add:(ch,id,title,level,make)=>{geometryTasks[id]=make;},
  ri:(r,lo,hi)=>lo+Math.floor(r()*(hi-lo+1)), pick:(r,a)=>a[Math.floor(r()*a.length)],
  n:bank.helpers.n, shape:()=>'', q:(prompt,value)=>({prompt,value})
});
const randomValues = [(72-40+0.1)/91,1.1/5];
assert.equal(geometryTasks['sheet-takeoff'](()=>randomValues.shift()).value,27,'72 m² plus 8% is exactly 27 sheets');
console.log(JSON.stringify({chapters:bank.chapters.length,taskTypes:bank.tasks.length,generatedCases:cases,drawings,calculatorSteps,chapterExams:14,independentArithmeticChecks:Object.keys(expected).length*60,halfCentCases},null,2));
