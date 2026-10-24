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
    const doc = win.document, C = win.AccessDesignCAM, W = win.AccessDesignWorkflow;
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
    card.innerHTML = '<summary>Design target <span id="cnc-design-summary"></span></summary><div class="cnc-design-content"><h3 id="cnc-design-title"></h3><p id="cnc-design-brief"></p><div id="cnc-design-preview" class="cnc-design-preview"></div><p id="cnc-design-sizes"></p><p id="cnc-design-origin"></p><p class="cnc-design-note">Practice with manual moves, or choose an operation below and review its program before simulating.</p><p id="cnc-design-notes" class="cnc-design-note"></p><p id="cnc-design-status" role="status" aria-live="polite"></p><button type="button" id="cnc-design-apply" class="mb-primary">Use this design setup</button><button type="button" id="cnc-design-recover" class="mb-secondary">Recover previous saved CNC draft</button><button type="button" id="cnc-capture-manual" class="mb-secondary">Capture manual result</button><details id="cnc-operation" class="cnc-operation"><summary>Plan a teaching operation</summary><div class="cnc-operation-fields"><label>Operation<select id="cnc-op-kind"></select></label><label id="cnc-op-tool-label">Tool diameter<input id="cnc-op-tool" type="number" step="any"></label><label id="cnc-op-depth-label">Depth<input id="cnc-op-depth" type="number" step="any"></label><label id="cnc-op-step-label">Depth per pass<input id="cnc-op-step" type="number" step="any"></label><label id="cnc-op-feed-label">Feed per minute<input id="cnc-op-feed" type="number" step="any"></label><label>Spindle RPM<input id="cnc-op-rpm" type="number" step="1" min="100"></label></div><p id="cnc-op-help" class="cnc-design-note"></p><p id="cnc-op-maths" class="cnc-design-note"></p><button type="button" id="cnc-op-generate" class="mb-primary">Generate and check program</button><p id="cnc-op-status" role="status" aria-live="polite"></p><ul id="cnc-op-diagnostics"></ul><details id="cnc-op-code-details" hidden><summary>Review generated G-code</summary><pre id="cnc-op-code" tabindex="0"></pre></details><button type="button" id="cnc-op-download" class="mb-secondary" disabled>Download generated .nc</button><button type="button" id="cnc-op-simulate" class="mb-primary" disabled>Simulate this program</button><button type="button" id="cnc-op-capture" class="mb-secondary" disabled>Capture checked result</button><button type="button" id="cnc-op-restore" class="mb-secondary" hidden>Return to manual draft</button></details><p id="cnc-evidence-status" role="status" aria-live="polite"></p><a id="cnc-design-return" class="cnc-design-return">Return to my design</a></div>';
    const heading = host.querySelector('.mb-head'); if (heading) heading.after(card); else host.prepend(card);
    const $ = id => doc.getElementById(id);
    let project = null, expected = null, linked = false, prepared = null, storageNote = '', generation = null, checked = null, simulated = false, previewFingerprint = null;
    function updateReturn(){if(project)$('cnc-design-return').href=returnURL(project);}
    function readPlan(){const factor=project.units==='in'?25.4:1;const value=id=>{const raw=$(id).value.trim();if(!raw||!Number.isFinite(Number(raw)))throw Error('Enter all operation measurements before generating a program.');return Number(raw);};return{kind:$('cnc-op-kind').value,toolDiameterMm:value('cnc-op-tool')*factor,depthMm:value('cnc-op-depth')*factor,stepDownMm:value('cnc-op-step')*factor,feedMmPerMin:value('cnc-op-feed')*factor,spindleRpm:value('cnc-op-rpm')};}
    function fillPlan(){
      if(!C||!W){$('cnc-operation').hidden=true;return;}
      $('cnc-operation').hidden=false;const choices=C.kinds(project),saved=project.workflow&&project.workflow.operation;
      const plan=saved&&choices.some(o=>o.kind===saved.kind)?saved:C.defaults(project),factor=project.units==='in'?25.4:1;
      $('cnc-op-kind').replaceChildren(...choices.map(o=>{const option=doc.createElement('option');option.value=o.kind;option.textContent=o.label;return option;}));$('cnc-op-kind').value=plan.kind;
      [['tool','toolDiameterMm'],['depth','depthMm'],['step','stepDownMm'],['feed','feedMmPerMin']].forEach(([id,key])=>$('cnc-op-'+id).value=Number((plan[key]/factor).toFixed(5)));
      $('cnc-op-rpm').value=plan.spindleRpm;
      $('cnc-op-tool-label').firstChild.textContent=(project.machine==='lathe'?'Insert width':'Tool diameter')+' · '+project.units;
      $('cnc-op-depth-label').firstChild.textContent=(project.machine==='lathe'?'Length to turn':'Cut depth')+' · '+project.units;
      $('cnc-op-step-label').firstChild.textContent='Depth per pass · '+project.units;$('cnc-op-feed-label').firstChild.textContent='Feed · '+project.units+'/min';
      $('cnc-op-help').textContent=project.machine==='lathe'?'Turns to the target diameter over the selected length. Fixed RPM; G99 feed per revolution is calculated from feed per minute ÷ RPM. No facing or parting is added. Leave at least 15.24 mm between the cut end and the chuck face for the simulated jaws.':'A pocket removes material inside the boundary; nested holes remain islands. A profile follows its edge. These are separate teaching operations, not proof of a finished part. General curved outlines use sampled straight segments.';
      $('cnc-op-help').textContent+=' Generated code uses G20 inches; millimetre inputs are converted (25.4 mm = 1 inch). This is a simulator teaching program.';
      generation=null;checked=null;simulated=false;$('cnc-op-simulate').disabled=true;$('cnc-op-capture').disabled=true;$('cnc-op-code-details').hidden=true;$('cnc-op-status').textContent='Choose the operation and its cutting settings. Your draft will stay available.';$('cnc-op-diagnostics').replaceChildren();$('cnc-op-download').disabled=true;$('cnc-op-capture').textContent='Capture checked result';$('cnc-op-code-details').hidden=true;cuttingMaths();
    }
    function cuttingMaths(){try{const p=readPlan(),speed=Math.PI*p.toolDiameterMm*p.spindleRpm/1000;$('cnc-op-maths').textContent=project.machine==='lathe'?'Feed per revolution = '+p.feedMmPerMin.toFixed(2)+' mm/min ÷ '+p.spindleRpm+' RPM = '+(p.feedMmPerMin/p.spindleRpm).toFixed(4)+' mm/rev.':'Surface speed = π × '+p.toolDiameterMm.toFixed(2)+' mm × '+p.spindleRpm+' RPM ÷ 1000 = '+speed.toFixed(1)+' m/min. Feed per revolution = '+(p.feedMmPerMin/p.spindleRpm).toFixed(4)+' mm/rev.';}catch(_){$('cnc-op-maths').textContent='';}}
    function diagnostics(result){$('cnc-op-diagnostics').replaceChildren(...[...(generation?generation.warnings:[]),...(result.diagnostics||[])].map(d=>{const li=doc.createElement('li');li.textContent=(d.level||'info')+': '+(d.message||d);return li;}));}
    function saveLink() {
      if (!project) return;
      try { win.localStorage.setItem(STORAGE, JSON.stringify({ project: D.encode(project), config: expected, linked }));
        // Once the student changes or captures the design, reload its saved revision rather than replaying the original incoming hash.
        if(win.location.hash.startsWith('#design='))win.history.replaceState(null,'',win.location.pathname+win.location.search);
      }
      catch (_) { storageNote = 'The design link is available for this visit; browser storage is unavailable.'; }
    }
    function stateStatus() {
      if (!project || !prepared) return;
      const state = win.CNCBuilder && win.CNCBuilder.getState();
      const current = linked && state && matches(state.config, expected);
      $('cnc-capture-manual').disabled=!current||!win.CNCBuilder.getResult()||win.CNCBuilder.isGeneratedPreview();
      $('cnc-design-summary').textContent = current ? '· linked setup' : '· reference';
      $('cnc-design-apply').disabled = !!current;
      $('cnc-design-apply').textContent = current ? 'Design setup in use' : 'Use this design setup';
      $('cnc-design-status').textContent = current
        ? 'Stock and units match this design. ' + state.actions.length + ' machining action' + (state.actions.length === 1 ? '' : 's') + ' recorded. Compare the result with your target.'
        : linked ? 'The current job differs from the design setup. The target remains a reference; apply it again to start fresh stock.'
          : 'Review this target, then choose Use this design setup to start fresh stock. Your current job is kept for Undo during this visit.';
      if(win.CNCBuilder.isGeneratedPreview()){$('cnc-design-summary').textContent='· generated preview';$('cnc-design-status').textContent=previewFingerprint===W.fingerprint(project)?'The generated operation preview is shown above. Your manual draft remains saved separately. Return to the manual draft to continue your own tool moves.':'An earlier generated preview is shown above. Generate and simulate this target to update it, or return to your manual draft.';}
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
        ? 'Lathe: X is diameter; Z0 is the front face and negative Z goes toward the chuck. The target is centred on the stock axis; canvas X/Y placement is not used.'
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
    ['kind','tool','depth','step','feed','rpm'].forEach(key=>$('cnc-op-'+key).addEventListener('change',()=>{
      $('cnc-op-simulate').disabled=true;$('cnc-op-capture').disabled=true;checked=null;generation=null;simulated=false;$('cnc-op-download').disabled=true;$('cnc-op-capture').textContent='Capture checked result';$('cnc-op-code-details').hidden=true;cuttingMaths();
      try{project=D.validate(W.setOperation(project,readPlan()));updateReturn();saveLink();stateStatus();$('cnc-op-status').textContent='Operation changed. Generate and check a new program before simulating or capturing.';}catch(error){$('cnc-op-status').textContent=error.message;}
    }));
    $('cnc-op-generate').addEventListener('click',()=>{
      try{
        generation=C.generate(project,readPlan());project=generation.project;checked=win.Trainer.validateManual(generation.training);simulated=false;
        updateReturn();saveLink();$('cnc-op-code').textContent=generation.training.text;$('cnc-op-code-details').hidden=false;$('cnc-op-download').disabled=false;cuttingMaths();diagnostics(checked);
        $('cnc-op-status').textContent=checked.accepted?'Program checked: '+generation.lineCount+' lines. Review the diagnostics and G-code, then choose Simulate. The machine view and your manual draft are unchanged.':'The program did not pass the simulator checks. Resolve the diagnostics before simulating.';
        $('cnc-op-simulate').disabled=!checked.accepted;$('cnc-op-capture').disabled=false;
      }catch(error){generation=null;checked=null;$('cnc-op-download').disabled=true;$('cnc-op-status').textContent=error.message;$('cnc-op-simulate').disabled=true;$('cnc-op-capture').disabled=true;}
    });
    $('cnc-op-download').addEventListener('click',()=>{if(!generation)return;const url=win.URL.createObjectURL(new Blob([generation.training.text],{type:'text/plain'})),a=doc.createElement('a');a.href=url;a.download='design-O'+generation.programNumber+'.nc';a.click();win.setTimeout(()=>win.URL.revokeObjectURL(url),1000);});
    $('cnc-op-simulate').addEventListener('click',()=>{
      if(!generation||W.fingerprint(project)!==generation.sourceFingerprint)return;
      checked=win.CNCBuilder.previewGenerated(generation.training);simulated=!!checked.accepted;if(simulated)previewFingerprint=generation.sourceFingerprint;diagnostics(checked);$('cnc-op-capture').textContent=simulated?'Capture simulation result':'Capture checked result';
      $('cnc-op-status').textContent=simulated?'Simulator preview completed. Estimated material removed: '+(checked.removedVolumeIn3*Math.pow(25.4,3)).toLocaleString('en-CA',{maximumFractionDigits:1})+' mm³. Capture this result to carry it back to your design. Target dimensions still need inspection.':'The simulator could not complete this preview. Your manual draft is unchanged.';
      $('cnc-op-restore').hidden=!simulated;$('cnc-op-capture').disabled=false;stateStatus();card.open=true;
    });
    $('cnc-op-capture').addEventListener('click',()=>{try{if(!generation||!checked)throw Error('Generate and check a program first.');project=C.record(project,generation,checked,simulated);updateReturn();saveLink();$('cnc-evidence-status').textContent='Captured '+(simulated?'the completed simulator preview':'the preflight check')+'. Return to your design to inspect the dimensions and explain the result.';}catch(error){$('cnc-evidence-status').textContent=error.message;}});
    $('cnc-op-restore').addEventListener('click',()=>{if(win.CNCBuilder.restoreManualPreview()){$('cnc-op-restore').hidden=true;stateStatus();}});
    $('cnc-capture-manual').addEventListener('click',()=>{
      try{const state=win.CNCBuilder.getState(),result=win.CNCBuilder.getResult();if(!linked||!matches(state.config,expected)||win.CNCBuilder.isGeneratedPreview())throw Error('Use the matching manual design setup before capturing a manual result.');
        project=D.validate(W.recordResult(project,{kind:'simulation',operationKind:'',programNumber:state.config.programNumber,programLineCount:E.code(state,{complete:true}).split('\n').length,actionCount:state.actions.length,accepted:!!result.accepted,removedVolumeMm3:Math.max(0,result.removedVolumeIn3||0)*Math.pow(25.4,3),diagnostics:(result.diagnostics||[]).map(d=>({level:d.level||'info',message:d.message.slice(0,1000)})).slice(0,50),summary:'Manual simulator result: '+state.actions.length+' recorded actions. Removal is an estimate; target dimensions have not been measured.'}));updateReturn();saveLink();$('cnc-evidence-status').textContent='Manual result captured with '+state.actions.length+' actions. Your design notes are unchanged.';
      }catch(error){$('cnc-evidence-status').textContent=error.message;}
    });
    win.addEventListener('cnc-builder-state', event => {
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
          display(restored, false);
        }
      } catch (_) { /* A damaged saved link must never alter the CNC draft. */ }
    }
  }
  return Object.freeze({ parseHash, prepare, apply, matches, returnURL, mount });
});
