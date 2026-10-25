/* Shared design handoff, explicit operation generation and captured simulator evidence.
 * Opening a target never changes a machining draft or runs a program.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../design/design-model.js'), require('./manual-engine.js'));
  else {
    root.CNCDesignBridge = factory(root.AccessDesign, root.CNCManual);
    root.CNCDesignBridge.mount(root);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (D, E) {
  'use strict';
  const STORAGE = 'access-design-cnc-link-v1';
  function parseHash(hash) {
    if (typeof hash !== 'string' || !hash.startsWith('#design=')) return null;
    return D.decode(hash.slice(8));
  }
  function prepare(raw) {
    const project = D.validate(raw);
    const failure = D.checks(project).find(check => !check.ok && check.id !== 'brief');
    if (failure) throw Error(failure.message);
    const config = E.defaultConfig(project.machine, project.units), factor = project.units === 'in' ? 25.4 : 1;
    config.title = project.title;
    config.stock = project.machine === 'mill'
      ? { x: project.stock.width / factor, y: project.stock.height / factor, z: project.stock.depth / factor }
      : { diameter: project.stock.diameter / factor, length: project.stock.length / factor };
    // create delegates to the engine's exact limits. It rejects out-of-range stock.
    let normalized;
    try { normalized = E.create(config).config; }
    catch (error) { throw Error(error.message + ' Setup values are in ' + project.units + '. Adjust the stock in Design Workshop.'); }
    const notes = [];
    if (normalized.title !== project.title) notes.push('The CNC program title is shortened and uses plain characters; the original design title is preserved.');
    const rounded = Object.keys(config.stock).filter(key => Math.abs(config.stock[key] - normalized.stock[key]) > 1e-9);
    if (rounded.length) notes.push('The CNC setup rounds stock ' + rounded.join(', ') + ' to ' + (project.units === 'mm' ? '0.001 mm' : '0.0001 in') + '. The design keeps its original measurements.');
    return { project, config: normalized, notes };
  }
  function apply(builder, project) {
    const ready = prepare(project);
    if (!builder || typeof builder.applySetup !== 'function') throw Error('The manual machining workspace is unavailable.');
    const result = builder.applySetup(ready.config);
    if (!result || !result.ok) throw Error(result && result.error || 'The simulator did not accept this design setup.');
    return { ...ready, backupSaved: result.backupSaved !== false };
  }
  function matches(config, expected) {
    return !!config && !!expected && JSON.stringify(config) === JSON.stringify(expected);
  }
  function returnURL(project) { return '../design/index.html#project=' + D.encode(project); }
  function mount(win) {
    const doc = win.document, C = win.AccessDesignCAM, W = win.AccessDesignWorkflow, Q = win.AccessDesignComparison, H = win.AccessDesignWorkholding;
    if (!doc) return;
    const nav = doc.querySelector('.workspace-switch') || doc.querySelector('.topbar');
    if (nav && !doc.getElementById('cnc-design-nav')) {
      const link = doc.createElement('a'); link.id = 'cnc-design-nav'; link.className = 'cnc-design-nav';
      link.href = '../design/index.html'; link.textContent = 'Design Workshop'; nav.append(link);
    }
    if (!D || !E) return;
    const host = doc.querySelector('#manual-builder .mb-scroll');
    if (!host) return;
    const card = doc.createElement('details'); card.id = 'cnc-design-target'; card.className = 'cnc-design-target'; card.hidden = true;
    card.innerHTML = '<summary>Design target <span id="cnc-design-summary"></span></summary><div class="cnc-design-content"><h3 id="cnc-design-title"></h3><p id="cnc-design-brief"></p><div id="cnc-design-preview" class="cnc-design-preview"></div><p id="cnc-design-sizes"></p><p id="cnc-design-origin"></p><p class="cnc-design-note">Practice with manual moves, or choose an operation below and review its program before simulating.</p><p id="cnc-design-notes" class="cnc-design-note"></p><p id="cnc-design-status" role="status" aria-live="polite"></p><button type="button" id="cnc-design-apply" class="mb-primary">Use this design setup</button><button type="button" id="cnc-design-recover" class="mb-secondary">Recover previous saved CNC draft</button><button type="button" id="cnc-compare-manual" class="mb-secondary" disabled>Compare manual result</button><button type="button" id="cnc-capture-manual" class="mb-secondary">Capture manual result</button><details id="cnc-operation" class="cnc-operation"><summary>Plan an ordered machining sequence</summary><p id="cnc-sequence-note" class="cnc-design-note"></p><section id="cnc-setups" class="cnc-setups" aria-label="Machining setups"><h4>Hold the part, then choose the cuts</h4><p class="cnc-design-note">A new setup repositions or reholds the same material. Check and simulate through the selected setup to carry earlier cuts forward.</p><ol id="cnc-setup-list" class="cnc-sequence-list" aria-label="Ordered setups"></ol><div class="cnc-sequence-actions"><button type="button" id="cnc-setup-add" class="mb-secondary">Add setup</button><button type="button" id="cnc-setup-duplicate" class="mb-secondary">Duplicate setup</button><button type="button" id="cnc-setup-up" class="mb-secondary">Move setup up</button><button type="button" id="cnc-setup-down" class="mb-secondary">Move setup down</button><button type="button" id="cnc-setup-remove" class="mb-secondary">Remove setup</button></div><div class="cnc-operation-fields"><label>Setup name<input id="cnc-setup-label" maxlength="160"></label><label>Side facing the tool<select id="cnc-setup-orientation"></select></label><label>How is the part held?<select id="cnc-setup-fixture"></select></label></div><div id="cnc-fixture-fields" class="cnc-operation-fields"></div><p id="cnc-setup-note" class="cnc-design-note"></p><p id="cnc-setup-status" role="status" aria-live="polite"></p></section><ol id="cnc-sequence-list" class="cnc-sequence-list" aria-label="Ordered machining steps"></ol><div class="cnc-sequence-actions"><button type="button" id="cnc-step-add" class="mb-secondary">Add step</button><button type="button" id="cnc-step-duplicate" class="mb-secondary">Duplicate step</button><button type="button" id="cnc-step-up" class="mb-secondary">Move up</button><button type="button" id="cnc-step-down" class="mb-secondary">Move down</button><button type="button" id="cnc-step-remove" class="mb-secondary">Remove step</button></div><h4 id="cnc-step-heading">Edit step</h4><div class="cnc-operation-fields"><label class="cnc-span">Step name<input id="cnc-op-label" maxlength="160" autocomplete="off"></label><label>Operation<select id="cnc-op-kind"></select></label><label id="cnc-op-tool-label">Tool diameter<input id="cnc-op-tool" type="number" step="any"></label><label id="cnc-op-depth-label">Depth<input id="cnc-op-depth" type="number" step="any"></label><label id="cnc-op-step-label">Depth per pass<input id="cnc-op-step" type="number" step="any"></label><label id="cnc-op-feed-label">Feed per minute<input id="cnc-op-feed" type="number" step="any"></label><label>Spindle RPM<input id="cnc-op-rpm" type="number" step="1" min="100"></label></div><p id="cnc-op-help" class="cnc-design-note"></p><p id="cnc-op-maths" class="cnc-design-note"></p><button type="button" id="cnc-face-goal" class="mb-secondary" hidden>Use this facing amount as my design allowance</button><div class="cnc-comparison"><h4>What should the finished simulation look like?</h4><div class="cnc-operation-fields"><label class="cnc-span">Comparison goal<select id="cnc-goal-mode"><option value="retained-solid">Keep outlined material</option><option value="pocket">Pocket inside the outline</option></select></label><label id="cnc-goal-face-label">Facing allowance<input id="cnc-goal-face" type="number" step="any" min="0"></label><label id="cnc-goal-depth-label">Goal depth<input id="cnc-goal-depth" type="number" step="any"></label><label id="cnc-goal-tolerance-label">Comparison tolerance<input id="cnc-goal-tolerance" type="number" step="any" min="0"></label></div><p id="cnc-goal-note" class="cnc-design-note"></p></div><button type="button" id="cnc-op-generate" class="mb-primary">Generate and check program</button><p id="cnc-op-status" role="status" aria-live="polite"></p><ul id="cnc-op-diagnostics"></ul><details id="cnc-op-code-details" hidden><summary>Review generated G-code</summary><pre id="cnc-op-code" tabindex="0"></pre></details><button type="button" id="cnc-op-download" class="mb-secondary" disabled>Download generated .nc</button><button type="button" id="cnc-op-simulate" class="mb-primary" disabled>Simulate this program</button><button type="button" id="cnc-op-compare" class="mb-secondary" disabled>Compare simulated sequence</button><button type="button" id="cnc-op-capture" class="mb-secondary" disabled>Capture checked result</button><button type="button" id="cnc-op-restore" class="mb-secondary" hidden>Return to manual draft</button></details><section id="cnc-comparison-result" class="cnc-comparison" hidden aria-label="Comparison result"><h4>Compare, adjust, try again</h4><p id="cnc-compare-status" role="status" aria-live="polite"></p><div id="cnc-compare-map"></div><p id="cnc-compare-legend"></p><p id="cnc-compare-dimensions"></p><ul id="cnc-compare-observations"></ul><details><summary>Sampling limits</summary><ul id="cnc-compare-limits"></ul></details></section><p id="cnc-evidence-status" role="status" aria-live="polite"></p><a id="cnc-design-return" class="cnc-design-return">Return to my design</a></div>';
    const heading = host.querySelector('.mb-head'); if (heading) heading.after(card); else host.prepend(card);
    const $ = id => doc.getElementById(id);
    let project = null, expected = null, linked = false, prepared = null, storageNote = '', generation = null, checked = null, simulated = false, previewFingerprint = null, sequenceSteps = [], selectedStep = -1, editorOriginal = null, editorValues = {}, comparisonResult = null, comparisonSource = null, comparisonFingerprint = null, goalOriginal = null, goalValues = {};
    let selectedSetupId = 'setup-1', fixtureOriginal = null, fixtureValues = {};
    function updateReturn(){if(project)$('cnc-design-return').href=returnURL(project);}
    const newStepId=()=> 'step-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
    const multi=()=>!!project?.workflow?.setups;
    function setupItems(){return W.getSetups(project).items;}
    function activeSetup(){const items=setupItems();return items.find(s=>s.id===selectedSetupId)||items[0];}
    function activeProject(){return multi()?W.setupProject(project,activeSetup().id):project;}
    function currentFingerprint(){return multi()?W.setupFingerprint(project,activeSetup().id):W.fingerprint(project);}
    function saveSetups(items,message){
      const candidate=D.validate(W.setSetups(project,{version:1,items}));project=candidate;
      if(!items.some(s=>s.id===selectedSetupId))selectedSetupId=items[0].id;
      updateReturn();saveLink();invalidate(message||'Setup changed. Check and simulate through this setup again.');stateStatus();renderSetups();
    }
    function editSetup(change,message){
      const items=setupItems(),index=Math.max(0,items.findIndex(s=>s.id===selectedSetupId));
      if(!multi())items[index].sequence={version:1,steps:sequenceSteps};
      items[index]=change(items[index]);saveSetups(items,message);
    }
    function saveGoal(goal){
      if(multi()){const validated=W.getComparison(W.setComparison(activeProject(),goal));editSetup(s=>({...s,comparison:validated}));}
      else project=D.validate(W.setComparison(project,goal));
    }
    function renderSetups(){
      const items=setupItems(),active=activeSetup(),index=items.findIndex(s=>s.id===active.id);selectedSetupId=active.id;
      $('cnc-setup-list').replaceChildren(...items.map((s,i)=>{const li=doc.createElement('li'),button=doc.createElement('button'),detail=doc.createElement('small');button.type='button';button.className='cnc-sequence-step';button.setAttribute('aria-pressed',String(s.id===active.id));button.textContent=(i+1)+'. '+s.label;detail.textContent=(s.orientation==='bottom'?'Bottom side · turn over about X':s.orientation==='front'?'Original front':'Top side')+' · '+(H.methods(project.machine).find(m=>m.id===s.fixture.method)?.label||s.fixture.method);button.append(detail);button.onclick=()=>{try{commitStep();selectedSetupId=s.id;fillPlan();saveLink();}catch(error){$('cnc-setup-status').textContent=error.message;}};li.append(button);return li;}));
      $('cnc-setup-add').disabled=items.length>=4;$('cnc-setup-duplicate').disabled=items.length>=4;$('cnc-setup-up').disabled=index===0;$('cnc-setup-down').disabled=index===items.length-1;$('cnc-setup-remove').disabled=items.length===1;
      $('cnc-setup-label').value=active.label;
      const orientations=project.machine==='mill'?[['top','Original top facing up'],['bottom','Bottom facing up · turn over about X']]:[['front','Original front toward the tool']];
      $('cnc-setup-orientation').replaceChildren(...orientations.map(([value,label])=>{const o=doc.createElement('option');o.value=value;o.textContent=label;return o;}));$('cnc-setup-orientation').value=active.orientation;
      $('cnc-setup-fixture').replaceChildren(...H.methods(project.machine).map(m=>{const o=doc.createElement('option');o.value=m.id;o.textContent=m.label;return o;}));$('cnc-setup-fixture').value=active.fixture.method;
      fixtureOriginal=active.fixture;fixtureValues={};const fields=H.methods(project.machine).find(m=>m.id===active.fixture.method)?.fields||[],factor=project.units==='in'?25.4:1;
      $('cnc-fixture-fields').replaceChildren(...fields.map(f=>{const label=doc.createElement('label'),input=doc.createElement(f.type==='select'?'select':'input');label.textContent=f.label+(f.unit==='mm'?' · '+project.units:'');input.id='cnc-fixture-'+f.key;if(f.type==='select')input.replaceChildren(...f.options.map(item=>{const o=doc.createElement('option');o.value=item.value;o.textContent=item.label;return o;}));else{input.type='number';input.step='any';input.min=f.min/(f.unit==='mm'?factor:1);input.max=f.max/(f.unit==='mm'?factor:1);}input.value=f.type==='select'?active.fixture.params[f.key]:Number((active.fixture.params[f.key]/(f.unit==='mm'?factor:1)).toFixed(8));fixtureValues[f.key]=input.value;input.onchange=()=>{try{commitStep();const params={};for(const field of fields){const raw=$('cnc-fixture-'+field.key).value;params[field.key]=raw===fixtureValues[field.key]?fixtureOriginal.params[field.key]:field.type==='select'?raw:raw.trim()&&Number.isFinite(Number(raw))?Number(raw)*(field.unit==='mm'?factor:1):NaN;}editSetup(s=>({...s,fixture:{method:active.fixture.method,params}}));}catch(error){renderSetups();$('cnc-setup-status').textContent=error.message;}};label.append(input);return label;}));
      $('cnc-setup-note').textContent=(index===0?'Start with fresh stock. ':'Starts with material left by setups 1–'+index+'. ')+(project.machine==='mill'?'A bottom setup turns the stock over about X: the front/back edges exchange places. The outline and measured material follow that turn. Depth is from the original surface of the chosen side.':'Fixture changes keep the original front and stock datum. Part off only in the final setup; reversing or remounting a loose piece is not supported.')+' Review the grip, supports and tool clearance before simulating.';
      try{$('cnc-setup-status').textContent=H.checks(project,active.fixture).filter(c=>!c.ok).map(c=>c.message).join(' ');}catch(error){$('cnc-setup-status').textContent=error.message;}
      const setupState=W.setupState(project,active.id);if(!setupState.valid)$('cnc-setup-status').textContent=setupState.issues.join(' ');
      if(active.fixture.params.parallels==='none'&&$('cnc-fixture-gripMm')){$('cnc-fixture-gripMm').disabled=true;$('cnc-setup-note').textContent+=' On the vise floor, the trainer jaws grip 35.56 mm; the separate grip entry is not used.';}
      $('cnc-op-generate').textContent=multi()?'Generate and check through setup '+(index+1):'Generate and check program';$('cnc-op-simulate').textContent=multi()?'Simulate through setup '+(index+1):'Simulate this program';$('cnc-op-download').textContent=multi()?'Download this setup .nc':'Download generated .nc';
    }
    function readPlan(){
      const factor=project.units==='in'?25.4:1;
      const value=(suffix,key,scale=factor)=>{const id='cnc-op-'+suffix,raw=$(id).value.trim();if(editorOriginal&&$(id).value===editorValues[id])return editorOriginal[key];if(!raw||!Number.isFinite(Number(raw)))throw Error('Enter all operation measurements before generating a program.');return Number(raw)*scale;};
      return{kind:$('cnc-op-kind').value,toolDiameterMm:value('tool','toolDiameterMm'),depthMm:value('depth','depthMm'),stepDownMm:value('step','stepDownMm'),feedMmPerMin:value('feed','feedMmPerMin'),spindleRpm:value('rpm','spindleRpm',1)};
    }
    function invalidate(message){
      comparisonResult=null;comparisonSource=null;$('cnc-comparison-result').hidden=true;$('cnc-op-compare').disabled=true;generation=null;checked=null;simulated=false;$('cnc-op-simulate').disabled=true;$('cnc-op-capture').disabled=true;$('cnc-op-download').disabled=true;$('cnc-op-capture').textContent='Capture checked result';$('cnc-op-code-details').hidden=true;$('cnc-op-diagnostics').replaceChildren();
      $('cnc-op-status').textContent=message||'Sequence changed. Generate and check the whole program before simulating or capturing.';
    }
    function persistSequence(){if(multi())editSetup(s=>({...s,sequence:{version:1,steps:sequenceSteps}}));else project=D.validate(W.setSequence(project,{version:1,steps:sequenceSteps}));sequenceSteps=W.getSequence(activeProject()).steps;updateReturn();saveLink();stateStatus();invalidate();renderSequence();}
    function commitStep(){
      if(selectedStep<0)return;
      const before=sequenceSteps[selectedStep],next={...before,label:$('cnc-op-label').value.trim(),operation:readPlan()};
      if(JSON.stringify(before)!==JSON.stringify(next)){const candidate=sequenceSteps.map((s,i)=>i===selectedStep?next:s);W.validateSequence({version:1,steps:candidate});sequenceSteps=candidate;persistSequence();}
    }
    function renderSequence(){
      $('cnc-sequence-list').replaceChildren(...sequenceSteps.map((step,i)=>{const li=doc.createElement('li'),button=doc.createElement('button'),detail=doc.createElement('small');button.type='button';button.className='cnc-sequence-step';button.setAttribute('aria-pressed',String(i===selectedStep));button.textContent=(i+1)+'. '+step.label+' · T'+(i+1);detail.textContent=(C.kinds(project).find(k=>k.kind===step.operation.kind)||{label:step.operation.kind}).label;button.append(detail);button.addEventListener('click',()=>{try{commitStep();selectedStep=i;loadStep();renderSequence();}catch(error){$('cnc-op-status').textContent=error.message;}});li.append(button);return li;}));
      $('cnc-step-add').disabled=sequenceSteps.length>=12;$('cnc-step-duplicate').disabled=selectedStep<0||sequenceSteps.length>=12;$('cnc-step-up').disabled=selectedStep<=0;$('cnc-step-down').disabled=selectedStep<0||selectedStep>=sequenceSteps.length-1;$('cnc-step-remove').disabled=selectedStep<0;$('cnc-op-generate').disabled=!sequenceSteps.length;
      $('cnc-step-heading').textContent=selectedStep<0?'Add a step to begin':'Edit step '+(selectedStep+1)+' of '+sequenceSteps.length;
    }
    function loadStep(){
      const choices=C.kinds(project),plan=selectedStep<0?C.defaults(project):sequenceSteps[selectedStep].operation,factor=project.units==='in'?25.4:1;
      if(!choices.some(c=>c.kind===plan.kind))choices.push({kind:plan.kind,label:'Unsupported for this target: '+plan.kind});
      $('cnc-op-kind').replaceChildren(...choices.map(o=>{const option=doc.createElement('option');option.value=o.kind;option.textContent=o.label;return option;}));$('cnc-op-kind').value=plan.kind;
      $('cnc-op-label').value=selectedStep<0?'':sequenceSteps[selectedStep].label;
      fillFields(plan);
      ['label','kind','tool','depth','step','feed','rpm'].forEach(id=>$('cnc-op-'+id).disabled=selectedStep<0);operationHelp();cuttingMaths();
    }
    function fillFields(plan){
      const factor=project.units==='in'?25.4:1;
      [['tool','toolDiameterMm'],['depth','depthMm'],['step','stepDownMm'],['feed','feedMmPerMin']].forEach(([id,key])=>$('cnc-op-'+id).value=Number((plan[key]/factor).toFixed(8)));
      $('cnc-op-rpm').value=plan.spindleRpm;editorOriginal={...plan};editorValues={};['tool','depth','step','feed','rpm'].forEach(id=>editorValues['cnc-op-'+id]=$('cnc-op-'+id).value);
    }
    function operationHelp(){
      const lathe=project.machine==='lathe',kind=$('cnc-op-kind').value,face=kind==='face',part=kind==='part',surface=multi()&&activeSetup().orientation==='bottom'?'bottom':'top';
      $('cnc-sequence-note').textContent='Steps run from top to bottom on the same stock, with a tool number for each step. Face first; repeated facing amounts must increase. '+(lathe?'Turning and parting lengths start at the newly faced end. Part off last.':'Cut depths always start at the original stock '+surface+', so facing is included in the total depth.');
      $('cnc-op-tool-label').firstChild.textContent=(part?'Blade width':lathe?'Insert width':'Tool diameter')+' · '+project.units;
      $('cnc-op-depth-label').firstChild.textContent=(face?'Total facing from original '+(lathe?'front':surface):part?'Finished piece length':lathe?'Length from faced front':'Depth from original '+surface)+' · '+project.units;
      $('cnc-op-step-label').firstChild.textContent=(part?'Radial depth per peck':face&&lathe?'Facing depth per pass':'Depth per pass')+' · '+project.units;
      $('cnc-op-feed-label').firstChild.textContent='Feed · '+project.units+'/min';
      $('cnc-face-goal').hidden=!face||selectedStep<0;
      $('cnc-op-help').textContent=(face?'Face the whole stock surface to this total allowance. Set the intended allowance in the comparison goal so a wrong cut remains visible.':part?'Separate the finished piece at this length from the faced front. The blade cuts behind the piece, toward the chuck; its width needs extra stock. A different length from the design will appear in the comparison.':lathe?'Turn to the target diameter over this length from the faced front.':'Clear around the shape keeps it as an island and clears its holes. Pocket removes material inside the boundary. Profile follows an edge without clearing all surrounding waste.')+(lathe?' Keep the cut clear of the selected jaws or collet; its projection and the blade width are checked. Fixed RPM; feed per revolution = feed per minute ÷ RPM.':'')+' Generated code uses G20 inches; millimetre inputs are converted (25.4 mm = 1 inch). This is a simulator teaching program.';
    }
    function fillPlan(){
      if(!C||!W){$('cnc-operation').hidden=true;return;}
      $('cnc-operation').hidden=false;renderSetups();sequenceSteps=W.sequence(activeProject()).steps;
      if(!sequenceSteps.length&&!multi()&&!(project.workflow&&project.workflow.sequence))sequenceSteps=[{id:newStepId(),label:'First cut',operation:C.defaults(project)}];
      selectedStep=sequenceSteps.length?0:-1;loadStep();renderSequence();loadGoal();
      invalidate('Choose the ordered steps and their cutting settings. Your manual draft stays available.');
    }
    function loadGoal(){
      const state=W.comparisonState(activeProject()),goal=state.settings,factor=project.units==='in'?25.4:1,lathe=project.machine==='lathe';goalOriginal=goal;
      $('cnc-goal-mode').value=goal.mode;$('cnc-goal-mode').disabled=lathe;$('cnc-goal-depth-label').hidden=lathe;$('cnc-goal-depth').value=goal.depthMm===null?'':Number((goal.depthMm/factor).toFixed(8));$('cnc-goal-tolerance').value=Number((goal.toleranceMm/factor).toFixed(8));
      $('cnc-goal-face').value=Number((goal.faceAllowanceMm/factor).toFixed(8));
      goalValues={face:$('cnc-goal-face').value,depth:$('cnc-goal-depth').value,tolerance:$('cnc-goal-tolerance').value};$('cnc-goal-face-label').firstChild.textContent='Facing allowance from original '+(lathe?'front':'top')+' · '+project.units;$('cnc-goal-depth-label').firstChild.textContent='Goal depth from original top · '+project.units;$('cnc-goal-tolerance-label').firstChild.textContent='Tolerance · '+project.units;
      const fmt=n=>Number((n/factor).toFixed(4))+' '+project.units;
      $('cnc-goal-note').textContent=(state.adjusted?state.message+' ':'')+(lathe?'The intended front is '+fmt(goal.faceAllowanceMm)+' back from the original front. Compare diameter along the design length and, after parting, the loose piece length. Chuck allowance is excluded.':goal.mode==='pocket'?'Remove material inside the outline to the goal depth measured from the original top. Pocket depth below the faced surface: '+fmt(goal.depthMm-goal.faceAllowanceMm)+'. Drawing islands and outside material stay at the faced surface.':'Keep the outlined material at the faced surface, '+fmt(goal.faceAllowanceMm)+' below the original top. Clear outside it and through its holes to the goal depth. Equal facing and goal depths describe a flat faced surface.')+' Comparison reads completed simulated material; it does not inspect a real manufactured part.';
      if(multi()&&activeSetup().orientation==='bottom'){ $('cnc-goal-face-label').firstChild.textContent='Facing allowance from original bottom · '+project.units; $('cnc-goal-depth-label').firstChild.textContent='Goal depth from original bottom · '+project.units; $('cnc-goal-note').textContent=$('cnc-goal-note').textContent.replaceAll('original top','original bottom'); }
      if(multi())$('cnc-goal-note').textContent+=' The comparison also retains the goals for earlier setups, including the opposite side.';
    }
    function readGoal(){const factor=project.units==='in'?25.4:1;const value=(id,key,original)=>{const raw=$(id).value.trim();if($(id).value===goalValues[key])return original;if(!raw||!Number.isFinite(Number(raw)))throw Error('Enter a finite facing allowance, comparison depth and tolerance.');return Number(raw)*factor;};return{mode:project.machine==='lathe'?'retained-solid':$('cnc-goal-mode').value,faceAllowanceMm:value('cnc-goal-face','face',goalOriginal.faceAllowanceMm),depthMm:project.machine==='lathe'?null:value('cnc-goal-depth','depth',goalOriginal.depthMm),toleranceMm:value('cnc-goal-tolerance','tolerance',goalOriginal.toleranceMm)};}
    function showComparison(result,source){
      comparisonResult=Q.summary(result);comparisonSource=source;comparisonFingerprint=currentFingerprint();$('cnc-comparison-result').hidden=false;
      const labels={'needs-work':'Differences found: review the map','within-sample-tolerance':'No sampled difference exceeds the chosen tolerance','resolution-limited':'Sampling cannot confirm this result',unsupported:'Comparison unavailable for this result',incomplete:'Finish the simulation before comparing'};
      $('cnc-compare-status').textContent=labels[result.status]||result.status;$('cnc-compare-map').innerHTML=Q.renderSVG(comparisonResult,project.units);$('cnc-compare-legend').textContent=!result.overlay?'':result.overlay.kind==='mill-map'?'Red: missing material / overcut. Blue: extra material / uncut. Purple: both in one map cell. Grey: within the sampled tolerance.':'Blue line: measured simulator diameter. Dashed line: design diameter. Above the target means extra stock; below it means overcut.';
      const dimensions=result.dimensions,factor=project.units==='in'?25.4:1,fmt=n=>n===null?'not measurable':Number((n/factor).toFixed(4))+' '+project.units;
      $('cnc-compare-dimensions').textContent=dimensions?(dimensions.source==='detached'?'Loose piece length: '+fmt(dimensions.actualLengthMm)+'; design length: '+fmt(dimensions.expectedLengthMm)+'. ':'The shaft is still attached to the stock. ')+'Front position error: '+fmt(dimensions.frontErrorMm)+'. Dimensions are sampled.':'';
      const list=(id,values)=>$(id).replaceChildren(...values.map(text=>{const li=doc.createElement('li');li.textContent=text;return li;}));list('cnc-compare-observations',result.observations);list('cnc-compare-limits',result.limitations);if(source==='generated')$('cnc-op-capture').textContent='Capture comparison and simulation';else $('cnc-capture-manual').textContent='Capture comparison and manual result';
      $('cnc-evidence-status').textContent='Comparison is ready. Capture the '+(source==='generated'?'sequence':'manual')+' result to keep this evidence with your design.';
    }
    function comparisonEvidence(source){return comparisonResult&&comparisonSource===source&&comparisonFingerprint===currentFingerprint()?comparisonResult:undefined;}
    function cuttingMaths(){try{const p=readPlan(),speed=Math.PI*p.toolDiameterMm*p.spindleRpm/1000;$('cnc-op-maths').textContent=project.machine==='lathe'?'Feed per revolution = '+p.feedMmPerMin.toFixed(2)+' mm/min ÷ '+p.spindleRpm+' RPM = '+(p.feedMmPerMin/p.spindleRpm).toFixed(4)+' mm/rev.':'Surface speed = π × '+p.toolDiameterMm.toFixed(2)+' mm × '+p.spindleRpm+' RPM ÷ 1000 = '+speed.toFixed(1)+' m/min. Feed per revolution = '+(p.feedMmPerMin/p.spindleRpm).toFixed(4)+' mm/rev.';}catch(_){$('cnc-op-maths').textContent='';}}
    function diagnostics(result){$('cnc-op-diagnostics').replaceChildren(...[...(generation?generation.warnings:[]),...(result.diagnostics||[])].map(d=>{const li=doc.createElement('li');li.textContent=(d.level||'info')+': '+(d.setupId?'['+(setupItems().find(s=>s.id===d.setupId)?.label||d.setupId)+'] ':'')+(d.message||d);return li;}));}
    function saveLink() {
      if (!project) return;
      try { win.localStorage.setItem(STORAGE, JSON.stringify({ project: D.encode(project), config: expected, linked, selectedSetupId }));
        // Once the student changes or captures the design, reload its saved revision rather than replaying the original incoming hash.
        if(win.location.hash.startsWith('#design='))win.history.replaceState(null,'',win.location.pathname+win.location.search);
      }
      catch (_) { storageNote = 'The design link is available for this visit; browser storage is unavailable.'; }
    }
    function stateStatus() {
      if (!project || !prepared) return;
      const state = win.CNCBuilder && win.CNCBuilder.getState();
      const current = linked && state && matches(state.config, expected);
      $('cnc-capture-manual').disabled=!current||!win.CNCBuilder.getResult()||win.CNCBuilder.isGeneratedPreview();$('cnc-compare-manual').disabled=$('cnc-capture-manual').disabled||!Q||!win.CNCBuilder.getResult()?.materialSnapshot;
      $('cnc-capture-manual').hidden=multi();$('cnc-compare-manual').hidden=multi();
      $('cnc-design-summary').textContent = current ? '· linked setup' : '· reference';
      $('cnc-design-apply').disabled = !!current;
      $('cnc-design-apply').textContent = current ? 'Design setup in use' : 'Use this design setup';
      $('cnc-design-status').textContent = current
        ? 'Stock and units match this design. ' + state.actions.length + ' machining action' + (state.actions.length === 1 ? '' : 's') + ' recorded. Compare the result with your target.'
        : linked ? 'The current job differs from the design setup. The target remains a reference; apply it again to start fresh stock.'
          : 'Review this target, then choose Use this design setup to start fresh stock. Your current job is kept for Undo during this visit.';
      if(win.CNCBuilder.isGeneratedPreview()){$('cnc-design-summary').textContent='· generated preview';$('cnc-design-status').textContent=previewFingerprint===currentFingerprint()?'The generated operation preview is shown above. Your manual draft remains saved separately. Return to the manual draft to continue your own tool moves.':'An earlier generated preview is shown above. Generate and simulate this target to update it, or return to your manual draft.';}
      if (storageNote) $('cnc-design-status').textContent += ' ' + storageNote;
    }
    function display(raw, incoming) {
      project = D.validate(raw); card.hidden = false; card.open = !!incoming;
      $('cnc-design-return').href = returnURL(project); $('cnc-design-return').hidden = false;
      $('cnc-design-title').textContent = project.title;
      $('cnc-design-brief').textContent = project.brief || 'No design brief yet. Add your purpose and key measurements in Design Workshop.';
      const b = D.bounds(project), factor = project.units === 'in' ? 25.4 : 1;
      const fmt = value => Number((value / factor).toFixed(4)).toLocaleString('en-CA', { maximumFractionDigits: 4 });
      const params = project.geometry.params;
      const shapeNames = { rectangle: 'Rectangle', square: 'Square', circle: 'Circle', annulus: 'Washer', cylinder: 'Cylinder', profile:'Imported profile' };
      shapeNames[project.geometry.shapeId]=D.geometryInfo(project).name;
      const target = project.geometry.shapeId === 'cylinder' ? 'Ø ' + fmt(b.diameter) + ' × ' + fmt(b.length) + ' long'
        : project.geometry.shapeId === 'annulus' ? 'outer Ø ' + fmt(params.R * 2) + ', hole Ø ' + fmt(params.r * 2)
          : project.geometry.shapeId === 'circle' ? 'Ø ' + fmt(params.r * 2) : fmt(b.width) + ' × ' + fmt(b.height);
      const stock = project.machine === 'lathe' ? 'Ø ' + fmt(project.stock.diameter) + ' × ' + fmt(project.stock.length) + ' stick-out'
        : fmt(project.stock.width) + ' × ' + fmt(project.stock.height) + ' × ' + fmt(project.stock.depth);
      $('cnc-design-sizes').textContent = shapeNames[project.geometry.shapeId] + ' target: ' + target + ' ' + project.units + '. Stock: ' + stock + ' ' + project.units + '.';
      $('cnc-design-origin').textContent = project.machine === 'lathe'
        ? 'Lathe: X is diameter; Z0 stays at the original stock front face and negative Z goes toward the chuck. The target is centred on the stock axis; canvas X/Y placement is not used.'
        : 'Mill: X0 Y0 is the lower-left stock corner; Z0 is the stock top. Target lower-left: X ' + fmt(project.placement.x) + ', Y ' + fmt(project.placement.y) + ' ' + project.units + '.';
      const preview = $('cnc-design-preview'); preview.replaceChildren();
      if (project.geometry.shapeId !== 'cylinder') {
        try {
          const img = doc.createElement('img'); img.alt = shapeNames[project.geometry.shapeId] + ' target profile placed within the stock dimensions';
          // A screen preview needs a visible outline at thumbnail size; measured exports stay untouched.
          const stroke = Number((Math.max(project.stock.width, project.stock.height) / 100).toFixed(6));
          const thumbnail = D.toSVG(project).replace('stroke="#000000" stroke-width="0.1"', 'stroke="#940010" stroke-width="' + stroke + '"');
          img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(thumbnail); preview.append(img);
        } catch (_) { /* The precise validation error is displayed below. */ }
      } else if (win.Shapes) {
        const targetShape = D.toCanvas(project, project.units), img = doc.createElement('img');
        img.alt = 'Cylinder target with radius and length dimensions';
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(win.Shapes.render('cylinder', targetShape.params, { units: project.units, labels: 'values' }));
        preview.append(img);
      }
      try {
        prepared = prepare(project);
        $('cnc-design-notes').textContent = prepared.notes.join(' ');
        fillPlan();
        stateStatus();
      } catch (error) {
        prepared = null; $('cnc-design-apply').disabled = true; $('cnc-design-summary').textContent = '· check stock';
        $('cnc-design-status').textContent = error.message; $('cnc-design-notes').textContent = '';
        $('cnc-operation').hidden=true;$('cnc-capture-manual').disabled=true;
      }
    }
    function receive() {
      if (!win.location.hash.startsWith('#design=')) return false;
      linked = false; expected = null;
      try { display(parseHash(win.location.hash), true); }
      catch (error) {
        project = null; prepared = null; card.hidden = false; card.open = true;
        $('cnc-design-title').textContent = 'Design could not be opened'; $('cnc-design-summary').textContent = '· invalid link';
        ['cnc-design-brief', 'cnc-design-sizes', 'cnc-design-origin', 'cnc-design-notes'].forEach(id => $(id).textContent = '');
        $('cnc-design-preview').replaceChildren(); $('cnc-design-status').textContent = error.message;
        $('cnc-design-apply').disabled = true; $('cnc-design-return').hidden = true;
        $('cnc-operation').hidden=true;$('cnc-capture-manual').disabled=true;
      }
      return true;
    }
    $('cnc-design-recover').addEventListener('click',()=>{const r=win.CNCBuilder.recoverBeforeDesign();if(r.ok){linked=false;saveLink();stateStatus();}else $('cnc-design-status').textContent=r.error;});
    $('cnc-design-apply').addEventListener('click', () => {
      try {
        const accepted = apply(win.CNCBuilder, project);
        expected = accepted.config; linked = true; prepared = accepted;
        if (!accepted.backupSaved) storageNote = 'The previous draft remains available with Undo during this visit; its browser backup could not be saved.';
        saveLink(); stateStatus(); card.open = false;
        // Remove the incoming command so a reload restores the linked draft, without asking to replace it again.
        win.history.replaceState(null, '', win.location.pathname + win.location.search);
      } catch (error) { $('cnc-design-status').textContent = error.message; card.open = true; }
    });
    ['label','kind','tool','depth','step','feed','rpm'].forEach(key=>$('cnc-op-'+key).addEventListener('change',()=>{
      invalidate();
      try{
        if(key==='kind'){
          const factor=project.units==='in'?25.4:1,kind=$('cnc-op-kind').value,oldKind=editorOriginal&&editorOriginal.kind,choices=C.kinds(project);
          if(['face','part'].includes(kind)||['face','part'].includes(oldKind))fillFields(C.defaults(project,kind));
          if(kind==='drill')$('cnc-op-tool').value=project.geometry.params.r*2/factor;
          if(kind==='clear-outside')$('cnc-op-tool').value=Math.min(3,Number($('cnc-op-tool').value)*factor)/factor;
          const oldLabel=choices.find(c=>c.kind===oldKind)?.label;
          if(/^(First cut|Step \d+)$/.test($('cnc-op-label').value)||$('cnc-op-label').value===oldLabel)$('cnc-op-label').value=choices.find(c=>c.kind===kind)?.label||kind;
        }
        commitStep();operationHelp();cuttingMaths();
      }catch(error){$('cnc-op-status').textContent=error.message;}
    }));
    function changeSequence(action){try{
      commitStep();
      if(action==='add'){if(sequenceSteps.length>=12)throw Error('A sequence supports at most 12 steps.');sequenceSteps=sequenceSteps.concat([{id:newStepId(),label:'Step '+(sequenceSteps.length+1),operation:C.defaults(project)}]);selectedStep=sequenceSteps.length-1;}
      else if(action==='duplicate'&&selectedStep>=0){if(sequenceSteps.length>=12)throw Error('A sequence supports at most 12 steps.');const copy=JSON.parse(JSON.stringify(sequenceSteps[selectedStep]));copy.id=newStepId();copy.label=(copy.label+' copy').slice(0,160);sequenceSteps=sequenceSteps.slice();sequenceSteps.splice(++selectedStep,0,copy);}
      else if(action==='remove'&&selectedStep>=0){sequenceSteps=sequenceSteps.filter((_,i)=>i!==selectedStep);selectedStep=Math.min(selectedStep,sequenceSteps.length-1);}
      else if((action==='up'||action==='down')&&selectedStep>=0){const to=selectedStep+(action==='up'?-1:1);if(to<0||to>=sequenceSteps.length)return;sequenceSteps=sequenceSteps.slice();[sequenceSteps[selectedStep],sequenceSteps[to]]=[sequenceSteps[to],sequenceSteps[selectedStep]];selectedStep=to;}
      persistSequence();loadStep();renderSequence();
    }catch(error){$('cnc-op-status').textContent=error.message;}}
    ['add','duplicate','up','down','remove'].forEach(action=>$('cnc-step-'+action).addEventListener('click',()=>changeSequence(action)));
    ['label','orientation','fixture'].forEach(key=>$('cnc-setup-'+key).addEventListener('change',()=>{
      try{commitStep();const value=$('cnc-setup-'+key).value;editSetup(s=>key==='fixture'?{...s,fixture:H.defaults(project.machine,project.stock,value)}:{...s,[key]:value.trim()});loadGoal();operationHelp();}
      catch(error){renderSetups();$('cnc-setup-status').textContent=error.message;}
    }));
    ['add','duplicate','up','down','remove'].forEach(action=>$('cnc-setup-'+action).addEventListener('click',()=>{
      try{commitStep();const items=setupItems(),index=Math.max(0,items.findIndex(s=>s.id===selectedSetupId));if(!multi())items[index].sequence={version:1,steps:sequenceSteps};let nextId=selectedSetupId;
        if(action==='add'||action==='duplicate'){
          if(items.length>=4)throw Error('A project supports up to four setups.');
          const id='setup-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6),next=action==='duplicate'?JSON.parse(JSON.stringify(items[index])):W.defaultSetup(project,id,'Setup '+(items.length+1));next.id=id;
          if(action==='duplicate'){next.label=(next.label+' copy').slice(0,160);next.sequence.steps.forEach(s=>{s.id=newStepId();});}
          else{next.orientation=project.machine==='mill'?(items[index].orientation==='top'?'bottom':'top'):'front';next.sequence={version:1,steps:[{id:newStepId(),label:'First cut',operation:C.defaults(project)}]};}
          items.splice(index+1,0,next);nextId=id;
        }else if(action==='remove'){if(items.length===1)throw Error('Keep at least one setup.');items.splice(index,1);nextId=items[Math.min(index,items.length-1)].id;}
        else{const to=index+(action==='up'?-1:1);if(to<0||to>=items.length)return;[items[index],items[to]]=[items[to],items[index]];}
        saveSetups(items);selectedSetupId=nextId;fillPlan();saveLink();
      }catch(error){renderSetups();$('cnc-setup-status').textContent=error.message;}
    }));
    $('cnc-op-generate').addEventListener('click',()=>{
      invalidate();
      try{
        commitStep();generation=multi()?C.generateSetups(project,activeSetup().id):C.generateSequence(project,{version:1,steps:sequenceSteps});project=generation.project;sequenceSteps=W.getSequence(activeProject()).steps;checked=generation.chain?win.Trainer.validateSetups(generation.chain):win.Trainer.validateManual(generation.training);simulated=false;
        updateReturn();saveLink();$('cnc-op-code').textContent=generation.training.text;$('cnc-op-code-details').hidden=false;$('cnc-op-download').disabled=false;cuttingMaths();diagnostics(checked);
        $('cnc-op-status').textContent=checked.accepted?'Program checked: '+generation.sequence.steps.length+' ordered steps, '+generation.lineCount+' lines.'+(generation.chain?' Workholding and material continuity checked through setup '+generation.chain.setups.length+'. The code below belongs to the selected setup.':'')+' Review the diagnostics and G-code, then choose Simulate. The machine view and your manual draft are unchanged.':'The program did not pass the simulator checks. Resolve the diagnostics before simulating.';
        $('cnc-op-simulate').disabled=!checked.accepted;$('cnc-op-capture').disabled=false;
      }catch(error){generation=null;checked=null;$('cnc-op-download').disabled=true;$('cnc-op-status').textContent=error.message;$('cnc-op-simulate').disabled=true;$('cnc-op-capture').disabled=true;}
    });
    ['mode','face','depth','tolerance'].forEach(key=>$('cnc-goal-'+key).addEventListener('change',()=>{
      invalidate();try{saveGoal(readGoal());loadGoal();updateReturn();saveLink();stateStatus();$('cnc-op-status').textContent='Comparison goal changed. Generate and simulate again before capturing a comparison.';}catch(error){loadGoal();$('cnc-op-status').textContent=error.message;}
    }));
    $('cnc-face-goal').addEventListener('click',()=>{
      try{commitStep();const plan=readPlan();if(plan.kind!=='face')return;saveGoal({...W.getComparison(activeProject()),faceAllowanceMm:plan.depthMm});loadGoal();updateReturn();saveLink();invalidate('Facing allowance set to this step. Review the finished goal, then generate and simulate.');stateStatus();}
      catch(error){$('cnc-op-status').textContent=error.message;}
    });
    $('cnc-op-compare').addEventListener('click',()=>{try{if(!Q||!simulated||!generation||!checked.materialSnapshot||currentFingerprint()!==generation.sourceFingerprint)throw Error('Generate and complete the current sequence before comparing.');showComparison(generation.chain?Q.compareSetups(project,activeSetup().id,checked.materialSnapshot):Q.compare(project,checked.materialSnapshot,W.getComparison(project)),'generated');}catch(error){$('cnc-evidence-status').textContent=error.message;}});
    $('cnc-compare-manual').addEventListener('click',()=>{try{const state=win.CNCBuilder.getState(),result=win.CNCBuilder.getResult();if(multi()||!Q||!linked||!matches(state.config,expected)||win.CNCBuilder.isGeneratedPreview()||!result?.materialSnapshot)throw Error('Use the matching manual setup and complete a preview before comparing.');showComparison(Q.compare(project,result.materialSnapshot,W.getComparison(project)),'manual');}catch(error){$('cnc-evidence-status').textContent=error.message;}});
    $('cnc-op-download').addEventListener('click',()=>{if(!generation)return;const url=win.URL.createObjectURL(new Blob([generation.training.text],{type:'text/plain'})),a=doc.createElement('a');a.href=url;a.download='design-'+(Number.isInteger(generation.setupIndex)?'setup-'+(generation.setupIndex+1)+'-':'')+'O'+generation.programNumber+'.nc';a.click();win.setTimeout(()=>win.URL.revokeObjectURL(url),1000);});
    $('cnc-op-simulate').addEventListener('click',()=>{
      if(!generation||currentFingerprint()!==generation.sourceFingerprint)return;
      checked=generation.chain?win.CNCBuilder.previewGeneratedSetups(generation.chain):win.CNCBuilder.previewGenerated(generation.training);simulated=!!checked.accepted;if(simulated)previewFingerprint=generation.sourceFingerprint;diagnostics(checked);$('cnc-op-capture').textContent=simulated?'Capture simulation result':'Capture checked result';
      $('cnc-op-status').textContent=simulated?'Simulator preview completed. Estimated material removed: '+(checked.removedVolumeIn3*Math.pow(25.4,3)).toLocaleString('en-CA',{maximumFractionDigits:1})+' mm³. Compare the simulated sequence with your goal, then capture the comparison and simulation. Physical dimensions still require inspection.':'The simulator could not complete this preview. Your manual draft is unchanged.';
      $('cnc-op-compare').disabled=!simulated||!Q||!checked.materialSnapshot;comparisonResult=null;comparisonSource=null;$('cnc-comparison-result').hidden=true;$('cnc-op-restore').hidden=!simulated;$('cnc-op-capture').disabled=false;stateStatus();card.open=true;
    });
    $('cnc-op-capture').addEventListener('click',()=>{try{if(!generation||!checked)throw Error('Generate and check a program first.');project=C.record(project,generation,checked,simulated,comparisonEvidence('generated'));updateReturn();saveLink();$('cnc-evidence-status').textContent='Captured '+(comparisonEvidence('generated')?'the material comparison and completed simulation':simulated?'the completed simulator preview':'the preflight check')+(generation.chain?' for '+activeSetup().label:'')+'. Return to your design to inspect the dimensions and explain the result.';}catch(error){$('cnc-evidence-status').textContent=error.message;}});
    $('cnc-op-restore').addEventListener('click',()=>{if(win.CNCBuilder.restoreManualPreview()){$('cnc-op-restore').hidden=true;stateStatus();}});
    $('cnc-capture-manual').addEventListener('click',()=>{
      try{const state=win.CNCBuilder.getState(),result=win.CNCBuilder.getResult();if(multi()||!linked||!matches(state.config,expected)||win.CNCBuilder.isGeneratedPreview())throw Error('Use the matching manual design setup before capturing a manual result.');
        project=D.validate(W.recordResult(project,{...(comparisonEvidence('manual')?{comparison:comparisonEvidence('manual')}:{}),kind:'simulation',operationKind:'',programNumber:state.config.programNumber,programLineCount:E.code(state,{complete:true}).split('\n').length,actionCount:state.actions.length,accepted:!!result.accepted,removedVolumeMm3:Math.max(0,result.removedVolumeIn3||0)*Math.pow(25.4,3),diagnostics:(result.diagnostics||[]).map(d=>({level:d.level||'info',message:d.message.slice(0,1000)})).slice(0,50),summary:'Manual simulator result: '+state.actions.length+' recorded actions. Removal is an estimate; target dimensions have not been measured.'}));updateReturn();saveLink();$('cnc-evidence-status').textContent='Manual result captured with '+state.actions.length+' actions. Your design notes are unchanged.';
      }catch(error){$('cnc-evidence-status').textContent=error.message;}
    });
    win.addEventListener('cnc-builder-state', event => {
      if(comparisonSource==='manual'){comparisonResult=null;comparisonSource=null;$('cnc-comparison-result').hidden=true;$('cnc-capture-manual').textContent='Capture manual result';}
      if (event.detail && event.detail.reason === 'setup') { linked = false; saveLink(); }
      stateStatus();
    });
    win.addEventListener('hashchange', receive);
    if (!receive()) {
      try {
        const stored = win.localStorage.getItem(STORAGE);
        if (stored && stored.length <= D.maxBytes * 4) {
          const parsed = JSON.parse(stored), restored = D.decode(parsed.project), setup = prepare(restored);
          expected = setup.config; linked = parsed.linked === true && matches(parsed.config, expected);
          selectedSetupId=typeof parsed.selectedSetupId==='string'?parsed.selectedSetupId:'setup-1';display(restored, false);
        }
      } catch (_) { /* A damaged saved link must never alter the CNC draft. */ }
    }
  }
  return Object.freeze({ parseHash, prepare, apply, matches, returnURL, mount });
});
