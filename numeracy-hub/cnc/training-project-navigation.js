/* Candidate-only operation tracking for interactive playback. Recording is excluded. */
(()=>{'use strict';
 const T=window.Trainer,C=window.CNCStudio,projects=window.CNC_PROJECTS;
 if(!T||!C||!Array.isArray(projects))throw Error('Project navigation dependencies missing');
 const picker=document.getElementById('training-projects');
 if(!picker)throw Error('Native project selector missing');
 const choose=document.createElement('button');choose.type='button';choose.textContent='Projects';
 choose.className='studio-project-picker';choose.setAttribute('aria-label','Return to the 40-project selector');
 choose.style.cssText='position:absolute;left:800px;top:16px;pointer-events:auto;background:#FFBC00;color:#1A1A1A;border:1px solid #FFEBB2;border-radius:4px;padding:7px 14px;font:600 14px Segoe UI';
 choose.onclick=()=>{C.end();picker.focus();};document.getElementById('studio').append(choose);
 picker.style.cssText='max-width:460px;min-width:260px';
 function operationAt(p,state){
  if(state.finished)return {id:'conclusion',title:'Inspect the completed project',math:[],view:'finished'};
  const m=/^\s*N\s*(\d+)\b/i.exec(state.activeBlock||'');
  if(!m)return state.time===0?p.operations[0]:null;
  const n=Number(m[1]);return p.operations.find(o=>n>=o.startN&&n<=o.endN)||null;
 }
 let lastKey=null;
 function refresh(){
  if(!document.body.classList.contains('teaching-view')||document.body.classList.contains('recording')){lastKey=null;return;}
  const state=T.trainingSnapshot(),p=projects.find(x=>state.program==='COURSE-'+x.id);if(!p){lastKey=null;return;}
  const op=operationAt(p,state);if(!op)return;
  const key=p.id+':'+op.id;if(key===lastKey)return;
  C.setOperation(op);lastKey=key;
 }
 const fitStyle=document.createElement('style');fitStyle.textContent=`
 body.teaching-view:not(.recording) #studio{inset:auto;left:var(--project-left);top:var(--project-top);width:1280px;height:720px;transform-origin:0 0;transform:scale(var(--project-scale))}
 body.teaching-view:not(.recording) .viewport{position:fixed!important;left:var(--project-left);top:var(--project-viewport-top);width:840px;height:556px;transform-origin:0 0;transform:scale(var(--project-scale))}
 body.teaching-view:not(.recording){background:#171719}`;
 document.head.append(fitStyle);
 function layoutFor(w,h){
  if(!(Number.isFinite(w)&&Number.isFinite(h)&&w>0&&h>0))throw Error('Invalid viewport');
  const scale=Math.min(w/1280,h/720),left=(w-1280*scale)/2,top=(h-720*scale)/2;
  return{scale,left,top,viewportTop:top+64*scale,studioWidth:1280*scale,studioHeight:720*scale,viewportWidth:840*scale,viewportHeight:556*scale};
 }
 function fit(){
  if(!document.body.classList.contains('teaching-view')||document.body.classList.contains('recording'))return;
  const x=layoutFor(innerWidth,innerHeight),d=document.documentElement.style;
  d.setProperty('--project-scale',String(x.scale));d.setProperty('--project-left',x.left+'px');d.setProperty('--project-top',x.top+'px');d.setProperty('--project-viewport-top',x.viewportTop+'px');
 }
 window.addEventListener('resize',fit);
 new MutationObserver(fit).observe(document.body,{attributes:true,attributeFilter:['class']});
 window.CNCProjectNavigation={operationAt,refresh,layoutFor,fit};setInterval(refresh,100);fit();
})();
