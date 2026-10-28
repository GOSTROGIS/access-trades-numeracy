(function(){
 'use strict';
 const $=id=>document.getElementById(id),data=window.QUIZ_DATA,engine=window.LectureQuiz;
 let current=null,showKey=false,busy=false;
 const versionControls=['lecture-select','question-count','generate','rebuild','rebuild-code','download-quiz','download-key'];
 function setBusy(value){busy=value;versionControls.forEach(id=>$(id).disabled=value);}
 const params=new URLSearchParams(location.search),dateLabel=s=>new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(s+'T12:00:00Z'));
 function node(tag,text,cls){const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e;}
 function status(text,error){$('generator-status').textContent=text;$('generator-status').setAttribute('role',error?'alert':'status');}
 for(let week=1;week<=8;week++){const group=document.createElement('optgroup');group.label='Week '+week;data.lectures.filter(l=>l.week===week).forEach(l=>{const o=document.createElement('option');o.value=l.id;o.textContent=`${l.id} · Day ${l.day} · ${l.topic}`;group.append(o);});$('lecture-select').append(group);}
 for(let n=10;n<=25;n++){const o=document.createElement('option');o.value=n;o.textContent=n;$('question-count').append(o);}
 $('question-count').value='15';
 $('lecture-select').value=data.lectures.some(l=>l.id===params.get('lecture'))?params.get('lecture'):data.lectures[0].id;
 function render(){
  const quiz=current,l=quiz.lecture;
  $('lecture-select').value=l.id;$('question-count').value=quiz.count;
  $('lecture-schedule').textContent=`Day ${l.day} · ${dateLabel(l.date)} · ${l.start}–${l.end}`;
  $('lecture-reading').textContent=l.reading.replace(/^Textbook/,'The textbook');
  $('count-note').textContent=l.id==='W08-L03'?(quiz.count<12?`${quiz.count} of the 12 readiness skills are sampled. Choose 12 or more questions to cover all 12 skills.`:'All 12 readiness skills are included. Extra questions add fresh practice.'):'Choose 10–25 questions. Each version mixes reviewed questions with fresh calculations.';
  $('quiz-title').textContent=l.topic;
  $('quiz-meta').textContent=`${l.id} · Day ${l.day} · ${dateLabel(l.date)} · ${l.start}–${l.end}`;
  $('quiz-code').textContent=quiz.code;$('rebuild-code').value=quiz.code;
  $('paper-label').textContent=showKey?'Instructor answer key':'Lecture quiz';
  $('preview-title').textContent=showKey?'Answer key preview':'Learner preview';
  $('toggle-key').textContent=showKey?'Show learner quiz':'Show answer key';$('toggle-key').setAttribute('aria-pressed',String(showKey));
  $('name-row').hidden=showKey;
  $('quiz-instructions').textContent=showKey?`${quiz.count} answers for this exact version. Choice letters match the learner PDF. Use the worked method to review mistakes.`:`${quiz.count} questions. Show your method and include units. For multiple choice, enter A, B, C or D. Follow your instructor’s calculator guidance.`;
  $('original-pdf').href='PDF/'+l.id+'.pdf';$('play-lecture').href='index.html?lecture='+l.id;
  const list=$('quiz-questions');list.replaceChildren();
  quiz.questions.forEach((q,i)=>{const item=node('li',null,'question');item.dataset.questionId=q.id;item.append(node('p',q.category,'question-category'),node('p',q.prompt,'question-prompt'));
   if(q.choices){const choices=node('ol',null,'choices');choices.type='A';q.choices.forEach(c=>choices.append(node('li',c)));item.append(choices);}
   if(q.image){const spec=data.assets[q.image],figure=node('figure',null,'question-figure'),img=document.createElement('img');img.src='assets/'+q.image+'.png';img.alt=spec?spec.alt:'Diagram for question '+(i+1);img.loading='lazy';figure.append(img);if(spec)figure.append(node('figcaption',spec.source+' · '+spec.dimensions));item.append(figure);}
   if(showKey)item.append(node('p','Answer: '+engine.answerText(q),'key-answer'),node('p',q.explanation,'key-explanation'));
   else item.append(node('div','Answer','answer-space'),node('div','Working / method','answer-space working'));
   item.append(node('p',String(q.reference||l.reading).replace(/^Textbook/,'The textbook'),'question-reference'));list.append(item);
  });
  $('quiz-footer').textContent=l.id+' · '+quiz.code+' · '+quiz.count+' questions';
  document.title=l.topic+' · Lecture quiz generator';
  try{const u=new URL(location.href);u.searchParams.set('lecture',l.id);u.searchParams.set('code',quiz.code);history.replaceState(null,'',u);}catch(_){}
 }
 function generate(opts){try{current=engine.build(data,opts||{lectureId:$('lecture-select').value,count:Number($('question-count').value),seed:engine.freshSeed()});render();status(`${current.count} questions ready. Both downloads use version ${current.code}.`);return true;}catch(e){status(e.message,true);return false;}}
 function rebuild(){try{generate(engine.decode($('rebuild-code').value));}catch(e){status(e.message,true);}}
 $('generate').addEventListener('click',()=>generate());$('lecture-select').addEventListener('change',()=>generate());$('question-count').addEventListener('change',()=>generate());$('rebuild').addEventListener('click',rebuild);$('rebuild-code').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();rebuild();}});
 $('toggle-key').addEventListener('click',()=>{showKey=!showKey;render();});$('print-quiz').addEventListener('click',()=>window.print());
 $('copy-code').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(current.code);status('Quiz code copied.');}catch(_){$('rebuild-code').value=current.code;$('rebuild-code').closest('details').open=true;$('rebuild-code').focus();$('rebuild-code').select();status('Select and copy the code in “Rebuild an existing version”.');}});
 async function download(answerKey){if(busy||!current)return;const snapshot=current;setBusy(true);status('Preparing '+(answerKey?'the matching answer key':'your fillable quiz')+'…');try{const bytes=await window.LectureQuizPDF.create(snapshot,{answerKey});const blob=new Blob([bytes],{type:'application/pdf'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=snapshot.lecture.id+'-'+snapshot.code+(answerKey?'-Answer-Key':'-Quiz')+'.pdf';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);status((answerKey?'Answer key':'Fillable quiz')+' downloaded for '+snapshot.code+'.');}catch(e){status('The PDF could not be created. '+e.message,true);}finally{setBusy(false);}}
 $('download-quiz').addEventListener('click',()=>download(false));$('download-key').addEventListener('click',()=>download(true));
 if(params.has('code')){try{if(!generate(engine.decode(params.get('code'))))throw new Error('Unknown quiz version');}catch(e){generate();status('That version code was not valid; a fresh quiz is shown.',true);}}else generate();
 window.LectureQuizApp={current:()=>current,generate,showKey:()=>showKey};
})();
