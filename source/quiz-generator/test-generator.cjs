'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const dir=path.resolve(__dirname,'../../carpentry/intake-142/Quizzes');
const scope={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(dir,'quiz-data.js'),'utf8'),scope);
const data=JSON.parse(JSON.stringify(scope.window.QUIZ_DATA));
const original=JSON.stringify(data);
const engine=require(path.join(dir,'generator-engine.js'));
let versions=0,freshQuestions=0;
for(const lecture of data.lectures){
 assert.ok(engine.mapping[lecture.id],lecture.id+' needs templates');
 for(const count of [10,11,12,15,25])for(const seed of [0,1,97,20261028,4294967295]){
  const quiz=engine.build(data,{lectureId:lecture.id,count,seed});versions++;
  assert.equal(quiz.questions.length,count);
  assert.equal(new Set(quiz.questions.map(q=>q.prompt)).size,count,'duplicate prompts in '+quiz.code);
  assert.deepEqual(engine.build(data,engine.decode(quiz.code)),quiz,'version code must reproduce exact order and answers');
  for(const q of quiz.questions){
   assert.ok(q.explanation&&q.reference&&q.category);
   if(q.type==='number'){assert.ok(Number.isFinite(q.answer));assert.ok(q.tolerance>=0);if(q.generated){freshQuestions++;const printed=Number(q.displayAnswer.match(/^-?[\d,.]+/)[0].replace(/,/g,''));assert.ok(Math.abs(printed-q.answer)<=q.tolerance+1e-8,'printed answer mismatches numerical key: '+q.prompt);}}
   else{assert.equal(new Set(q.choices).size,q.choices.length);assert.ok(q.choices.includes(q.answer));assert.equal(engine.answerText(q),String.fromCharCode(65+q.choices.indexOf(q.answer))+'. '+q.answer);}
   if(q.image)assert.ok(fs.existsSync(path.join(dir,'assets',q.image+'.png')));
  }
  if(lecture.id==='W08-L03')assert.equal(new Set(quiz.questions.filter(q=>q.skill).map(q=>q.skill)).size,Math.min(12,count));
 }
}
assert.equal(JSON.stringify(data),original,'generator must not mutate the game bank');
assert.throws(()=>engine.build(data,{lectureId:'bad',count:15,seed:1}));
for(const count of [0,9,26,Infinity,15.5])assert.throws(()=>engine.build(data,{lectureId:'W01-L01',count,seed:1}));
for(const seed of [-1,NaN,Infinity,4294967296,1.5])assert.throws(()=>engine.build(data,{lectureId:'W01-L01',count:15,seed}));
for(const code of ['', '<script>', 'LQ1-W01L01-26-A','LQ1-W01L01-15-ZZZZZZZ'])assert.throws(()=>engine.decode(code));
// Independent exact-cent and round-up regressions, calculated from stated givens.
let money=0,sheets=0;
for(let seed=0;seed<350;seed++){
 for(const lid of ['W04-L04','W07-L02']){
  const quiz=engine.build(data,{lectureId:lid,count:25,seed});
  for(const q of quiz.questions.filter(q=>q.generated)){
   const m=q.prompt.match(/Material costs \$(\d+)\.(\d{2}) per metre\. What is the cost of ([\d.]+) m/);
   if(m){const cents=Number(m[1])*100+Number(m[2]),tenths=Math.round(Number(m[3])*10);assert.equal(q.answer,Math.floor((cents*tenths+5)/10)/100,q.prompt);money++;}
   const n=q.prompt.match(/base requirement of (\d+) sheets.*stated (\d+)% classroom/);
   if(n){assert.equal(q.answer,Math.floor((Number(n[1])*(100+Number(n[2]))+99)/100),q.prompt);sheets++;}
  }
 }
}
assert.ok(money>500&&sheets>500);
console.log(`PASS: ${data.lectures.length} lectures, ${versions} reproducible versions, ${freshQuestions} fresh questions; ${money} exact-cent and ${sheets} whole-sheet regression cases.`);
