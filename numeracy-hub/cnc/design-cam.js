/* Design adapters around the existing ACCESS CAD/CAM engines. All plan values are mm. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../design/design-model.js'),require('../design/design-workflow.js'),require('./cad-engine.js'),require('./cam-engine.js'),require('./manual-engine.js'));
  else root.AccessDesignCAM=factory(root.AccessDesign,root.AccessDesignWorkflow,root.AccessCAD,root.AccessCAM,root.CNCManual);
})(typeof globalThis!=='undefined'?globalThis:this,function(D,W,CAD,CAM,E){
  'use strict';
  const MM=25.4, TAU=Math.PI*2;
  const labels={face:'Face the stock',part:'Part off the shaft','clear-outside':'Clear around the shape','profile-out':'Profile outside the target','profile-in':'Finish the inside hole',pocket:'Pocket inside the boundary',drill:'Drill the circular hole',turn:'Rough and finish the shaft'};
  const plain=s=>String(s).replace(/[^\x20-\x7e]/g,' ').replace(/[()%]/g,'').slice(0,60);
  function kinds(project){const p=D.validate(project),id=p.geometry.shapeId;return(id==='cylinder'?['face','turn','part']:id==='annulus'?['face','clear-outside','profile-out','profile-in','pocket','drill']:id==='circle'?['face','clear-outside','profile-out','pocket','drill']:['face','clear-outside','profile-out','pocket']).map(kind=>({kind,label:labels[kind]}));}
  function defaults(project,kind){
    const p=D.validate(project),lathe=p.machine==='lathe';kind=kind||(lathe?'turn':'pocket');
    if(!kinds(p).some(o=>o.kind===kind))throw Error('Choose an operation supported by this target shape.');
    const depth=kind==='face'?Math.min(.5,(lathe?p.stock.length:p.stock.depth)*.1):lathe?p.geometry.params.h:Math.min(2,p.stock.depth*.2);
    return{kind,toolDiameterMm:lathe?3:kind==='face'?25.4:6,depthMm:depth,stepDownMm:kind==='part'?1:Math.min(1,depth),feedMmPerMin:lathe?80:120,spindleRpm:lathe?1200:1800};
  }
  function finite(n,min,max,label){if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max)throw Error(label+' must be between '+min+' and '+max+'.');return n;}
  function planProject(raw,plan){
    let p=D.validate(W.setOperation(raw,plan));
    const bad=D.checks(p).find(c=>!c.ok&&c.id!=='brief');if(bad)throw Error(bad.message);
    if(!kinds(p).some(o=>o.kind===plan.kind))throw Error('Choose an operation supported by this target shape.');
    finite(plan.toolDiameterMm,.508,50.8,p.machine==='lathe'?'Insert width (mm)':'Tool diameter (mm)');
    finite(plan.depthMm,.01,p.machine==='lathe'?p.stock.length:p.stock.depth,'Cut depth / length (mm)');
    finite(plan.stepDownMm,.127,50.8,'Depth per pass (mm)');
    finite(plan.feedMmPerMin,.0254,15240,'Feed (mm/min)');
    finite(plan.spindleRpm,100,p.machine==='lathe'?6000:8100,'Spindle RPM');if(!Number.isInteger(plan.spindleRpm))throw Error('Spindle RPM must be a whole number.');
    if(p.machine==='lathe'&&plan.toolDiameterMm>12.7)throw Error('Turning insert / parting blade width must be at most 12.7 mm.');
    if(p.machine==='lathe'&&plan.kind==='face'&&plan.stepDownMm>6.35)throw Error('Lathe facing depth per pass must be at most 6.35 mm, the simulator turning cutter reach.');
    if(plan.kind!=='face'&&Math.ceil((p.machine==='lathe'&&plan.kind==='turn'?(p.stock.diameter-p.geometry.params.r*2)/2:p.machine==='lathe'&&plan.kind==='part'?p.stock.diameter/2+.381:plan.depthMm)/plan.stepDownMm-1e-9)>100)throw Error('This operation needs more than 100 passes. Increase the depth per pass or reduce the stock.');
    if(E){const cfg=E.defaultConfig(p.machine,p.units),f=p.units==='in'?MM:1;cfg.stock=p.machine==='mill'?{x:p.stock.width/f,y:p.stock.height/f,z:p.stock.depth/f}:{diameter:p.stock.diameter/f,length:p.stock.length/f};E.create(cfg);}
    return p;
  }
  // Fixed original-stock G54. Facing changes the material front, never the work offset.
  function sequenceFrames(p,steps){
    let face=0,cutStarted=false;const warnings=[],frames=[];
    steps.forEach((s,i)=>{
      const q=s.operation,name='Step '+(i+1)+' ('+s.label+'): ',from=face;
      if(q.kind==='face'){
        if(cutStarted)throw Error(name+'facing must come before turning, parting, drilling or profile/pocket cuts.');
        if(q.depthMm<=face+1e-9)throw Error(name+'facing depth must increase the cumulative removal from the original stock face.');
        if(Math.ceil((q.depthMm-face)/q.stepDownMm-1e-9)>100)throw Error(name+'facing needs more than 100 passes from the previous face. Increase the depth per pass.');
        face=q.depthMm;
      }else cutStarted=true;
      if(q.kind==='part'&&i!==steps.length-1)throw Error(name+'parting must be the final operation; the separated part cannot be machined in this setup.');
      if(p.machine==='lathe'){
        const length=q.kind==='face'?0:q.depthMm,blade=q.kind==='part'?q.toolDiameterMm:0,needed=face+length+blade+15.24;
        if(needed>p.stock.length+1e-8)throw Error(name+'needs '+Number(needed.toFixed(4))+' mm stickout: '+face+' mm facing + '+length+' mm length + '+blade+' mm blade behind the cut + 15.24 mm chuck clearance. Stock stickout is '+p.stock.length+' mm.');
        if(q.kind==='part'&&Math.abs(length-p.geometry.params.h)>.001)warnings.push({level:'warning',message:name+'parting at '+length+' mm produces a piece '+(length<p.geometry.params.h?'shorter':'longer')+' than the '+p.geometry.params.h+' mm design.'});
        if(q.kind==='turn'&&length>p.geometry.params.h+.001)warnings.push({level:'warning',message:name+'turning extends '+Number((length-p.geometry.params.h).toFixed(4))+' mm beyond the design length.'});
      }else if(q.kind!=='face'&&q.depthMm<=face+1e-9)warnings.push({level:'warning',message:name+'cut depth is at or above the already faced surface; it may remove no further material. Depth stays measured from the original stock top.'});
      frames.push({faceAllowanceMm:face,previousFaceAllowanceMm:from,frontZMm:-face,cutEndZMm:p.machine==='lathe'?-(face+(q.kind==='face'?0:q.depthMm)):-q.depthMm});
    });
    return{frames,warnings};
  }
  function layersFor(p){
    const g=p.geometry,q=g.params,x=p.placement.x/MM,y=p.placement.y/MM,items=[];
    const line=(layer,a,b)=>items.push({layer,seg:{t:'L',a:{x:a[0],y:a[1]},b:{x:b[0],y:b[1]}}});
    const circle=(layer,r,cx,cy)=>items.push({layer,circle:true,seg:{t:'A',c:{x:cx,y:cy},r,a0:0,sw:TAU}});
    if(g.shapeId==='cylinder'){const h=q.h/MM,r=q.r/MM;line('TARGET',[h,r],[0,r]);return CAD.chain(items);}
    if(g.shapeId==='circle'||g.shapeId==='annulus'){
      const r=(g.shapeId==='annulus'?q.R:q.r)/MM;circle('OUTER',r,x+r,y+r);if(g.shapeId==='annulus')circle('HOLE',q.r/MM,x+r,y+r);
    }else{
      const outline=D.outline(p);outline.rings.forEach((ring,i)=>{const layer=(outline.depths&&outline.depths[i]%2?'HOLE':'OUTER')+'_'+i;ring.forEach((v,j)=>{const next=ring[(j+1)%ring.length];line(layer,[x+v[0]/MM,y+v[1]/MM],[x+next[0]/MM,y+next[1]/MM]);});});
    }
    return CAD.chain(items);
  }
  function generate(raw,plan){
    if(plan===undefined&&raw.workflow&&raw.workflow.sequence)return generateSequence(raw,raw.workflow.sequence);
    if(plan===undefined)plan=raw.workflow&&raw.workflow.operation||defaults(raw);
    const project=planProject(raw,plan),p=project,lathe=p.machine==='lathe',lib={},feed=plan.feedMmPerMin/MM;
    if(plan.kind==='face'||plan.kind==='part'){
      const g=generateSequence(raw,{version:1,steps:[{id:'single-operation',label:labels[plan.kind],operation:plan}]});
      delete g.sequence;delete g.steps;g.project=project;g.plan=project.workflow.operation;g.sourceFingerprint=W.fingerprint(project);g.training.title=p.title+' · '+labels[plan.kind];return g;
    }
    const frame=sequenceFrames(p,[{label:labels[plan.kind],operation:plan}]);
    let layers=layersFor(p),out;
    const mat={label:'Student practice settings',face:[plan.spindleRpm,feed],em:[plan.spindleRpm,feed,feed*.4],spot:[plan.spindleRpm,feed*.4],drill:[plan.spindleRpm,feed],rough:[plan.spindleRpm,feed/plan.spindleRpm],finish:[plan.spindleRpm,feed/plan.spindleRpm],part:[plan.spindleRpm,feed/plan.spindleRpm]};
    if(lathe){
      // Existing lathe CAM expects a right-to-left half-profile: horizontal is length, vertical is radius.
      layers=CAD.chain([{layer:'TARGET',seg:{t:'L',a:{x:plan.depthMm/MM,y:p.geometry.params.r/MM},b:{x:0,y:p.geometry.params.r/MM}}}]);
      lib[1]={name:'Practice turning insert',type:'turn',dia:0,len:0,width:plan.toolDiameterMm/MM,color:'#D2181F'};
      out=CAM.genLathe({layers,layer:'TARGET',file:'SHARED DESIGN',title:plain(p.title),progNo:9202,face:false,rough:1,finish:1,part:'',groove:'',mat,lib,maxRpm:plan.spindleRpm,gen:'classic',rpm:plan.spindleRpm,stepDown:plan.stepDownMm/MM,stock:{dia:p.stock.diameter/MM,stickout:p.stock.length/MM,extra:0}});
    }else{
      const drill=plan.kind==='drill';lib[1]={name:drill?'Practice drill':'Practice flat end mill',type:drill?'drill':'endmill',shape:'flat',dia:plan.toolDiameterMm/MM,len:100/MM,ang:118,color:'#D2181F'};
      const op={tool:1,depth:plan.depthMm/MM,step:plan.stepDownMm/MM,stepover:40,finish:true};let ops;
      if(drill){const layer=p.geometry.shapeId==='annulus'?'HOLE':'OUTER';const diameter=(p.geometry.shapeId==='annulus'?p.geometry.params.r:p.geometry.params.r)*2;if(Math.abs(diameter-plan.toolDiameterMm)>.001)throw Error('For this drilling operation, set the drill diameter to the target hole diameter ('+diameter+' mm).');ops=[{...op,op:'drill',layer}];}
      else if(plan.kind==='pocket'||plan.kind==='clear-outside'){
        layers={TARGET:{name:'TARGET',contours:(plan.kind==='clear-outside'?stockOutline(p,plan.toolDiameterMm/2+.1):[]).concat(Object.values(layers).flatMap(l=>l.contours)),circles:[],points:[]}};ops=[{...op,op:'pocket',layer:'TARGET'}];
      }else ops=Object.keys(layers).filter(name=>plan.kind!=='profile-in'||name.startsWith('HOLE')).map(layer=>({...op,op:layer.startsWith('HOLE')?'profile-in':'profile-out',layer}));
      out=CAM.genMill({layers,ops,file:'SHARED DESIGN',title:plain(p.title),progNo:9201,zero:'stock',margin:0,thick:p.stock.depth/MM,stock:{x:p.stock.width/MM,y:p.stock.height/MM,z:p.stock.depth/MM},keepStockOrigin:true,faceTool:'',faceDepth:0,mat,lib,maxRpm:plan.spindleRpm,cutting:{rpm:plan.spindleRpm,feed,plunge:feed*.4}});
    }
    if(out.error)throw Error(out.error);
    if(out.text.split('\n').length>20000)throw Error('This program exceeds 20,000 lines. Simplify the profile or use fewer passes.');
    const warnings=frame.warnings.concat((out.warnings||[]).map(message=>({level:'warning',message})));
    if(!/(?:G0?1|G0?2|G0?3|G71|G83)\b/.test(out.text))throw Error('The selected operation did not produce a cutting path.');
    const training={id:lathe?'CNC-992':'CNC-991',machine:p.machine,gen:'classic',title:p.title+' · '+labels[plan.kind],text:out.text,stock:out.stock,tools:lib,showToolpath:true,setup:lathe?{method:'chuck3',params:{}}:{method:'vise',params:{grip:Math.max(.05,Math.min(p.stock.depth/MM*.25,.5)),parallels:'jaws'}}};
    return{project,plan:project.workflow.operation,training,warnings,sourceFingerprint:W.fingerprint(project),programNumber:lathe?9202:9201,lineCount:out.text.split('\n').length};
  }
  function stockOutline(p,paddingMm=0){
    const w=p.stock.width/MM,h=p.stock.height/MM,pad=paddingMm/MM,points=[[-pad,-pad],[w+pad,-pad],[w+pad,h+pad],[-pad,h+pad]];
    return CAD.chain(points.map((a,i)=>({layer:'STOCK',seg:{t:'L',a:{x:a[0],y:a[1]},b:{x:points[(i+1)%4][0],y:points[(i+1)%4][1]}}}))).STOCK.contours;
  }
  function generateSequence(raw,sequence){
    const project=D.validate(W.setSequence(raw,sequence)),p=project,steps=p.workflow.sequence.steps,lathe=p.machine==='lathe';
    if(!steps.length)throw Error('Add at least one operation to the sequence.');
    steps.forEach((s,i)=>{try{planProject(p,s.operation);}catch(error){throw Error('Step '+(i+1)+' ('+s.label+'): '+error.message);}});
    const context=sequenceFrames(p,steps),lib={},warnings=context.warnings,baseLayers=layersFor(p),allLayers={...baseLayers},ops=[];
    allLayers.TARGET={name:'TARGET',contours:Object.values(baseLayers).flatMap(l=>l.contours),circles:[],points:[]};
    const material=plan=>{const feed=plan.feedMmPerMin/MM;return{label:'Student sequence settings',face:[plan.spindleRpm,feed],em:[plan.spindleRpm,feed,feed*.4],spot:[plan.spindleRpm,feed*.4],drill:[plan.spindleRpm,feed],rough:[plan.spindleRpm,feed/plan.spindleRpm],finish:[plan.spindleRpm,feed/plan.spindleRpm],part:[plan.spindleRpm,feed/plan.spindleRpm]};};
    steps.forEach((s,i)=>{const plan=s.operation,tn=i+1,drill=plan.kind==='drill';
      lib[tn]=lathe?{name:'Step '+tn+' '+(plan.kind==='part'?'parting blade':'turning insert'),type:plan.kind==='part'?'part':'turn',dia:0,len:0,width:plan.toolDiameterMm/MM,color:'#D2181F'}:{name:'Step '+tn+' '+(drill?'drill':plan.kind==='face'?'face mill':'flat end mill'),type:drill?'drill':plan.kind==='face'?'face':'endmill',shape:plan.kind==='face'?'face':'flat',dia:plan.toolDiameterMm/MM,len:100/MM,ang:118,color:'#D2181F'};
      if(lathe)return;
      const feed=plan.feedMmPerMin/MM,common={tool:tn,depth:plan.depthMm/MM,step:plan.stepDownMm/MM,stepover:40,finish:true,stepId:s.id,stepLabel:'STEP '+tn+': '+plain(s.label),cutting:{rpm:plan.spindleRpm,feed,plunge:feed*.4}};
      if(plan.kind==='face')ops.push({...common,op:'face',layer:'TARGET',fromDepth:context.frames[i].previousFaceAllowanceMm/MM});
      else if(drill){const diameter=p.geometry.params.r*2;if(Math.abs(diameter-plan.toolDiameterMm)>.001)throw Error('Step '+tn+': set the drill diameter to the target hole diameter ('+diameter+' mm).');ops.push({...common,op:'drill',layer:p.geometry.shapeId==='annulus'?'HOLE':'OUTER'});}
      else if(plan.kind==='pocket'||plan.kind==='clear-outside'){
        const layer=plan.kind==='clear-outside'?'CLEAR_OUTSIDE_'+tn:'TARGET';
        if(plan.kind==='clear-outside')allLayers[layer]={name:layer,contours:stockOutline(p,plan.toolDiameterMm/2+.1).concat(allLayers.TARGET.contours),circles:[],points:[]};
        ops.push({...common,op:'pocket',layer});
      }
      else Object.keys(baseLayers).filter(name=>plan.kind!=='profile-in'||name.startsWith('HOLE')).forEach(layer=>ops.push({...common,op:layer.startsWith('HOLE')?'profile-in':'profile-out',layer}));
    });
    let out;
    if(lathe){
      const lines=['%','O09202 ('+plain(p.title)+' - ORDERED SEQUENCE)'];
      steps.forEach((s,i)=>{const plan=s.operation,tn=i+1,frame=context.frames[i],layers=CAD.chain([{layer:'TARGET',seg:{t:'L',a:{x:plan.depthMm/MM,y:p.geometry.params.r/MM},b:{x:0,y:p.geometry.params.r/MM}}}]);
        const part=CAM.genLathe({layers,layer:'TARGET',file:'SHARED DESIGN',title:plain(p.title),progNo:9202,originalFront:true,frontOffset:frame.faceAllowanceMm/MM,face:plan.kind==='face',faceTool:tn,faceDepth:plan.kind==='face'?plan.depthMm/MM:0,faceFrom:frame.previousFaceAllowanceMm/MM,faceStep:plan.stepDownMm/MM,rough:plan.kind==='turn'?tn:'',finish:plan.kind==='turn'?tn:'',part:plan.kind==='part'?tn:'',partStep:plan.stepDownMm/MM,groove:'',mat:material(plan),lib,maxRpm:plan.spindleRpm,gen:'classic',rpm:plan.spindleRpm,stepDown:plan.stepDownMm/MM,profileStart:100+i*200,profileEnd:200+i*200,stock:{dia:p.stock.diameter/MM,stickout:p.stock.length/MM,extra:0}});
        if(part.error)throw Error('Step '+tn+': '+part.error);
        warnings.push(...(part.warnings||[]).map(message=>({level:'warning',message:'Step '+tn+': '+message})));
        lines.push('(STEP '+tn+': '+plain(s.label)+')',...part.text.split('\n').filter(line=>line!=='%'&&!/^O\d/.test(line)&&line!=='M30'),'M09','M05');
      });
      lines.push('M30','%');out={text:lines.join('\n'),stock:{dia:p.stock.diameter/MM,stickout:p.stock.length/MM,extra:0}};
    }else{
      out=CAM.genMill({layers:allLayers,ops,file:'SHARED DESIGN SEQUENCE',title:plain(p.title),progNo:9201,zero:'stock',margin:0,thick:p.stock.depth/MM,stock:{x:p.stock.width/MM,y:p.stock.height/MM,z:p.stock.depth/MM},keepStockOrigin:true,faceTool:'',faceDepth:0,mat:material(steps[0].operation),lib,maxRpm:Math.max(...steps.map(s=>s.operation.spindleRpm))});
      if(out.error)throw Error(out.error);warnings.push(...(out.warnings||[]).map(message=>({level:'warning',message})));
    }
    const lineCount=out.text.split('\n').length;if(lineCount>20000)throw Error('The sequence exceeds 20,000 program lines. Reduce the passes or simplify the outline.');
    const training={id:lathe?'CNC-992':'CNC-991',machine:p.machine,gen:'classic',title:p.title+' · '+steps.length+' ordered steps',text:out.text,stock:out.stock,tools:lib,showToolpath:true,setup:lathe?{method:'chuck3',params:{}}:{method:'vise',params:{grip:Math.max(.05,Math.min(p.stock.depth/MM*.25,.5)),parallels:'jaws'}}};
    return{project,plan:steps[0].operation,sequence:p.workflow.sequence,steps:steps.map((s,i)=>({...s,toolNumber:i+1,frame:context.frames[i]})),training,warnings,sourceFingerprint:W.fingerprint(p),programNumber:lathe?9202:9201,lineCount};
  }
  function record(project,generation,result,simulated,comparison){
    if(W.fingerprint(project)!==generation.sourceFingerprint)throw Error('The design or operation changed. Generate and check the program again before capturing a result.');
    if(comparison&&!simulated)throw Error('A preflight check cannot capture a completed simulation comparison. Simulate and compare the current program first.');
    const input={kind:simulated?'simulation':'check',operationKind:generation.sequence?'sequence':generation.plan.kind,programNumber:generation.programNumber,programLineCount:generation.lineCount,actionCount:0,accepted:!!result.accepted,removedVolumeMm3:Math.max(0,Number(result.removedVolumeIn3)||0)*Math.pow(MM,3),diagnostics:[...generation.warnings,...(result.diagnostics||[])].map(d=>({level:['info','warning','error'].includes(d.level)?d.level:'info',message:String(d.message||d).slice(0,1000)})).slice(0,50),summary:(simulated?'Completed simulator preview':'Program preflight only; not played')+'. '+(generation.sequence?'Ordered sequence of '+generation.sequence.steps.length+' steps':labels[generation.plan.kind])+'. Removal is a simulator estimate; target dimensions have not been measured.'};
    if(generation.sequence)input.operationCount=generation.sequence.steps.length;if(comparison)input.comparison=comparison;
    if(comparison)input.summary=input.summary.replace('target dimensions have not been measured.','includes a sampled material comparison; physical dimensions still require inspection.');
    return D.validate(W.recordResult(project,input));
  }
  function importDrawing(text,format,options={}){
    if(typeof text!=='string'||text.length>2*1024*1024)throw Error('Choose a drawing smaller than 2 MB.');
    const units={mm:1,cm:10,m:1000,in:25.4,ft:304.8};let parsed,factor;
    if(format==='dxf'){
      parsed=CAD.parseDXF(text);factor=CAD.UNIT_TO_IN[parsed.insunits]*MM;
      if(!factor){if(!units[options.units])throw Error('This DXF has no supported declared units. Choose the drawing units explicitly.');factor=units[options.units];}
    }else if(format==='svg'){
      if(!options.document||typeof DOMParser==='undefined')throw Error('SVG import needs the browser drawing parser.');
      const xml=new DOMParser().parseFromString(text,'image/svg+xml'),root=xml.documentElement;
      if(root.localName!=='svg'||xml.querySelector('parsererror'))throw Error('The SVG is not valid XML.');
      const allowed=new Set(['svg','g','path','rect','circle','ellipse','line','polyline','polygon','title','desc','metadata']);
      const all=[root,...root.querySelectorAll('*')];if(all.length>512)throw Error('This SVG has too many elements. Simplify it before importing.');
      const attrs=new Set(['xmlns','id','width','height','viewBox','preserveAspectRatio','fill','fill-rule','stroke','stroke-width','stroke-linecap','stroke-linejoin','stroke-miterlimit','vector-effect','transform','d','cx','cy','r','rx','ry','x','y','x1','y1','x2','y2','points']);
      for(const el of all){if(!allowed.has(el.localName)||el!==root&&el.localName==='svg')throw Error('Unsupported SVG element: '+el.localName+'. Export plain outlined geometry.');for(const attr of [...el.attributes]){
        if(!attrs.has(attr.name)||/url\s*\(/i.test(attr.value))throw Error('Unsupported SVG attribute: '+attr.name+'. Export plain geometry without styling, clipping or external references.');
        if(['x','y','cx','cy','r','rx','ry','x1','y1','x2','y2'].includes(attr.name)||el!==root&&['width','height'].includes(attr.name)){if(!/^[+-]?(?:\d*\.)?\d+(?:e[+-]?\d+)?$/i.test(attr.value.trim()))throw Error('SVG geometry coordinates must be plain numbers in drawing units.');}
      }}
      if(root.hasAttribute('transform'))throw Error('SVG root transforms are unsupported; apply the transform before exporting.');
      const physical=value=>{const m=/^([\d.]+)\s*(mm|cm|m|in|pt|pc|px)?$/.exec((value||'').trim());return m?{value:+m[1],unit:m[2]||'px',mm:+m[1]*({mm:1,cm:10,m:1000,in:25.4,pt:25.4/72,pc:25.4/6,px:25.4/96}[m[2]||'px'])}:null;};
      const width=physical(root.getAttribute('width')),height=physical(root.getAttribute('height')),vb=(root.getAttribute('viewBox')||'').trim().split(/[\s,]+/).map(Number);
      if(root.hasAttribute('width')&&(!width||!(width.value>0))||root.hasAttribute('height')&&(!height||!(height.value>0)))throw Error('SVG dimensions must be positive numbers with supported units; percentages are unsupported.');
      if(root.hasAttribute('viewBox')&&(vb.length!==4||!vb.every(Number.isFinite)||!(vb[2]>0&&vb[3]>0)))throw Error('SVG viewBox must have four finite values and positive dimensions.');
      if(width&&height&&vb.length===4&&vb[2]>0&&vb[3]>0&&Math.abs(width.mm/height.mm-vb[2]/vb[3])>1e-6)throw Error('SVG width, height and viewBox have different aspect ratios. Export matching dimensions before import.');
      if(!width||width.unit==='px'){
        if(!units[options.units])throw Error('This SVG has no physical width. Choose the drawing units explicitly.');
        root.setAttribute('width',((vb.length===4?vb[2]:width?width.value:100)*units[options.units])+'mm');
        if(vb.length===4||height)root.setAttribute('height',((vb.length===4?vb[3]:height.value)*units[options.units])+'mm');
      }else if(width.unit==='m')root.setAttribute('width',width.mm+'mm');
      if(height&&height.unit==='m')root.setAttribute('height',height.mm+'mm');
      factor=MM;
      // Sampling separate closed subpaths preserves their exact endpoints and holes.
      for(const path of [...root.querySelectorAll('path')]){
        const data=path.getAttribute('d')||'',moves=data.match(/[mM]/g)||[];
        const number=/[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g,counts={m:2,l:2,h:1,v:1,c:6,s:4,q:4,t:2,a:7,z:0};
        if(!/^[mM]/.test(data.trim())||data.replace(number,'').replace(/[mlhvcsqtaz\s,]/gi,'')!=='')throw Error('SVG path data contains unsupported or malformed commands.');
        for(const part of data.matchAll(/([a-df-z])([^a-df-z]*)/ig)){const cmd=part[1].toLowerCase(),values=(part[2].match(number)||[]).map(Number),count=counts[cmd];
          if(count===undefined||!values.every(Number.isFinite)||count===0&&values.length||count>0&&(!values.length||values.length%count))throw Error('SVG path command '+part[1]+' has incomplete coordinates.');
          if(cmd==='a')for(let j=0;j<values.length;j+=7)if(values[j]<0||values[j+1]<0||![0,1].includes(values[j+3])||![0,1].includes(values[j+4]))throw Error('SVG arc radii or flags are invalid.');
        }
        if(moves.length>1){if(moves.some(m=>m==='m'))throw Error('Compound relative SVG paths are unsupported. Export separate closed paths or absolute coordinates.');
          const parts=data.trim().split(/(?=M)/).filter(Boolean);for(const part of parts){if(!/[zZ]\s*$/.test(part))throw Error('Close each SVG subpath before importing.');const node=path.cloneNode(false);node.setAttribute('d',part);path.parentNode.insertBefore(node,path);}path.remove();
        }
      }
      // Existing parser samples paths into geometry. Reject references before any live DOM insertion.
      parsed=CAD.parseSVG(new XMLSerializer().serializeToString(root),options.document);
    }else throw Error('Choose an SVG or ASCII DXF drawing.');
    if(Object.keys(parsed.skipped||{}).length||(parsed.warnings||[]).length)throw Error('The drawing contains unsupported or incomplete geometry: '+[...Object.keys(parsed.skipped||{}),...(parsed.warnings||[])].join('; '));
    if(!parsed.items.length||parsed.items.length>30000)throw Error('The drawing is empty or too complex.');
    const items=CAD.scaleItems(parsed.items,factor);let samples=0;
    for(const item of items){const s=item.seg,points=s?(s.t==='L'?[s.a,s.b]:[s.c]):[item.point];
      if(points.some(p=>!p||![p.x,p.y].every(n=>Number.isFinite(n)&&Math.abs(n)<=1e6))||s&&s.t==='A'&&(!Number.isFinite(s.r)||s.r<=0||s.r>1e6||!Number.isFinite(s.sw)))throw Error('Drawing coordinates or radii are outside the supported range.');
      samples+=s&&s.t==='A'?Math.max(32,Math.ceil(CAD.segLen(s)/5)):2;
      if(samples>100000)throw Error('The drawing is too complex at its declared physical scale. Simplify it before importing.');
    }
    // The chain overview needs only coarse arc points; the final rings below use measured tolerance.
    const layers=CAD.chain(items,undefined,5);const rings=[];
    Object.values(layers).forEach(layer=>{if(layer.points.length)throw Error('Point-only drawings are unsupported; supply closed outlines.');layer.contours.forEach(c=>{if(!c.closed)throw Error('The drawing includes an open contour. Close every boundary before import.');const pts=[];c.segs.forEach((s,i)=>{
      // CAD.flatten takes segment length, not radial error. Bound arc deviation to 0.05 mm.
      const error=s.t==='A'?Math.min(.05,s.r/4):.05;
      const chord=s.t==='A'?2*Math.sqrt(2*s.r*error-error*error):.05;
      let sample=CAD.flatten(s,chord);
      if(s.t==='A'&&Math.abs(Math.abs(s.sw)-TAU)<1e-9){const n=Math.ceil((sample.length-1)/4)*4;sample=Array.from({length:n+1},(_,j)=>CAD.arcPt(s,j/n));}
      (i?sample.slice(1):sample).forEach(p=>pts.push([p.x,p.y]));
    });if(pts.length&&Math.hypot(pts[0][0]-pts.at(-1)[0],pts[0][1]-pts.at(-1)[1])<.001)pts.pop();rings.push(pts);});});
    return D.fromProfile({rings,units:'mm',title:options.title||'Imported drawing'});
  }
  return Object.freeze({kinds,defaults,generate,generateSequence,record,importDrawing});
});
