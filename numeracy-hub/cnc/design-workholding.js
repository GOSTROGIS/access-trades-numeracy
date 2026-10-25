/* Canonical-mm fixture choices for shared CNC setup plans. Geometry checks remain in SETUPS. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.AccessDesignWorkholding=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const MM=25.4;
  const number=(key,label,min,max,step=1)=>({key,label,type:'number',unit:'mm',min,max,step});
  const select=(key,label,options)=>({key,label,type:'select',options:options.map(([value,label])=>({value,label}))});
  const parallels=()=>select('parallels','Parallels',[['jaws','Against the jaws'],['middle','Under the middle'],['none','None: on the vise floor']]);
  const methodsByMachine={
    mill:[
      {id:'vise',label:'Vise with hard jaws',fields:[number('gripMm','Depth gripped in jaws',1.27,35.56,.5),parallels()]},
      {id:'vise_soft',label:'Vise with soft jaws',fields:[number('gripMm','Depth gripped in jaws',1.27,35.56,.5),parallels()]},
      {id:'clamps',label:'Strap clamps and step blocks',fields:[select('place','Clamp positions',[['ends','At both ends'],['sides','At front and back'],['four','Four clamps']]),number('overlapMm','Clamp overlap on the part',2.54,50.8,.5),number('heelMm','Heel height above work top',-25.4,25.4,.5),{...number('boltFraction','Bolt position: 0 at work, 1 at block',0,1,.05),unit:'ratio'},number('parallelHeightMm','Parallel height',0,50.8,.5),select('parallelPosition','Parallel positions',[['clamps','Under the clamps'],['middle','Under the middle']])]},
      {id:'plate',label:'Fixture plate with edge clamps',fields:[number('clampHeightMm','Edge clamp height above plate',1.27,38.1,.5)]}
    ],
    lathe:[
      {id:'chuck3',label:'Three-jaw chuck',fields:[]},
      {id:'chuck4',label:'Four-jaw independent chuck',fields:[]},
      {id:'soft',label:'Chuck with soft jaws',fields:[number('gripLengthMm','Soft jaw projection / grip length',5.08,76.2,.5)]},
      {id:'collet',label:'Collet chuck',fields:[select('size','Collet size',[['match','Matches the stock'],['over','1/16 inch too large'],['under','1/16 inch too small']])]},
      {id:'tail',label:'Chuck and tailstock centre',fields:[]},
      {id:'steady',label:'Chuck and steady rest',fields:[number('positionMm','Rest centre from chuck face',30.48,254,1)]}
    ]
  };
  const clone=o=>JSON.parse(JSON.stringify(o));
  function object(o,keys,label){
    if(!o||typeof o!=='object'||Array.isArray(o)||![Object.prototype,null].includes(Object.getPrototypeOf(o)))throw Error(label+' must be a plain object.');
    for(const k of Reflect.ownKeys(o)){
      if(typeof k!=='string'||!keys.includes(k))throw Error('Unsupported '+label+' field.');
      const d=Object.getOwnPropertyDescriptor(o,k);if(!d||!d.enumerable||!Object.hasOwn(d,'value'))throw Error(label+' requires enumerable data fields without accessors.');
    }
  }
  function methods(machine){if(!methodsByMachine[machine])throw Error('Choose mill or lathe workholding.');return clone(methodsByMachine[machine]);}
  function identify(id){for(const machine of ['mill','lathe']){const method=methodsByMachine[machine].find(m=>m.id===id);if(method)return{machine,method};}throw Error('Choose a supported workholding method. Between-centres work and detached-part remounting are not supported by this setup chain.');}
  function validate(fixture,machine){
    object(fixture,['method','params'],'fixture');const found=identify(fixture.method);
    if(machine&&machine!==found.machine)throw Error('The '+fixture.method+' fixture cannot hold work in the '+machine+' setup.');
    const fields=found.method.fields;object(fixture.params,fields.map(f=>f.key),'fixture parameters');const params={};
    for(const f of fields){const value=fixture.params[f.key];
      if(f.type==='number'){
        if(typeof value!=='number'||!Number.isFinite(value)||value<f.min||value>f.max)throw Error(f.label+' must be between '+f.min+' and '+f.max+(f.unit==='mm'?' mm':'')+'.');
      }else if(!f.options.some(o=>o.value===value))throw Error('Choose a supported value for '+f.label.toLowerCase()+'.');
      params[f.key]=value;
    }
    return{method:fixture.method,params};
  }
  function defaults(machine,stock,method){
    method=method||(machine==='mill'?'vise':'chuck3');identify(method);stock=stock||{};
    const depth=Number(stock.depth)||10,length=Number(stock.length)||100;
    const table={vise:{gripMm:Math.max(1.27,Math.min(depth*.25,12.7)),parallels:'jaws'},vise_soft:{gripMm:Math.max(1.27,Math.min(depth*.25,12.7)),parallels:'jaws'},clamps:{place:'ends',overlapMm:12.7,heelMm:1.524,boltFraction:.3,parallelHeightMm:12.7,parallelPosition:'clamps'},plate:{clampHeightMm:Math.max(1.27,Math.min(9.525,depth*.6))},chuck3:{},chuck4:{},soft:{gripLengthMm:22.86},collet:{size:'match'},tail:{},steady:{positionMm:Math.max(30.48,Math.min(254,length*.7))}};
    return validate({method,params:table[method]},machine);
  }
  function toTrainer(fixture,machine){
    const f=validate(fixture,machine),p=f.params;let params={};
    if(f.method==='vise'||f.method==='vise_soft')params={grip:p.gripMm/MM,parallels:p.parallels};
    else if(f.method==='clamps')params={place:p.place,overlap:p.overlapMm/MM,heel:p.heelMm/MM,bolt:p.boltFraction,parH:p.parallelHeightMm/MM,parPos:p.parallelPosition};
    else if(f.method==='plate')params={clampH:p.clampHeightMm/MM};
    else if(f.method==='soft')params={softLen:p.gripLengthMm/MM};
    else if(f.method==='collet')params={collet:p.size};
    else if(f.method==='steady')params={zs:p.positionMm/MM};
    return{method:f.method,params};
  }
  function clearanceMm(fixture){const f=validate(fixture,'lathe');return f.method==='soft'?f.params.gripLengthMm:f.method==='collet'?6.35:15.24;}
  function checks(project,fixture){
    const f=validate(fixture,project.machine),p=f.params,s=project.stock,out=[];
    const add=(id,ok,message)=>out.push({id,ok,level:ok?'info':'warning',message});
    if(project.machine==='mill'){
      if(f.method==='vise'||f.method==='vise_soft'){
        const grip=p.parallels==='none'?35.56:p.gripMm;
        add('jaw-height',s.depth>grip,'The original stock has '+Number((s.depth-grip).toFixed(3))+' mm above the jaws; completed-cut support is checked from simulated material.');
      }else if(f.method==='clamps'){
        add('clamp-heel',p.heelMm>=0,'Clamp heels should be level with or above the work top.');
        add('clamp-bolt',p.boltFraction<=.5,'The bolt should be nearer the work than the step block.');
        add('clamp-support',p.parallelPosition==='clamps','Support should sit under the clamping points.');
      }
    }else{
      const free=s.length-clearanceMm(f);
      if(['chuck3','chuck4','soft'].includes(f.method))add('overhang',free<=3*s.diameter,'Free stickout is '+Number(free.toFixed(3))+' mm. The native fixture check warns above three stock diameters without added support.');
      if(f.method==='collet')add('collet-size',p.size==='match','The collet must match the material at the grip; native checks also inspect material left by preceding setups.');
    }
    return out;
  }
  return Object.freeze({methods,defaults,validate,toTrainer,clearanceMm,checks});
});
