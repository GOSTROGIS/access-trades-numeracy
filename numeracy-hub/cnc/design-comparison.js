/* Compare a detached sample of the completed simulator stock with an explicit
   design goal. No toolpath, removal total or intended motion supplies the result. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../design/design-model.js'),require('../design/design-workflow.js'),require('./design-material.js'));
  else root.AccessDesignComparison=factory(root.AccessDesign,root.AccessDesignWorkflow,root.AccessDesignMaterial);
})(typeof globalThis!=='undefined'?globalThis:this,function(D,W,Material){
  'use strict';
  const LIMIT=100000, EPS=1e-5;
  const finite=(n,min,max,name)=>{if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max)throw Error(name+' is outside the supported range.');return n;};
  const close=(a,b)=>Math.abs(a-b)<=1e-5*Math.max(1,Math.abs(a),Math.abs(b));
  const fmt=n=>Number(n.toFixed(3)).toString();
  function defaults(raw){return W.getComparison(D.validate(raw));}
  function settings(p,value){
    const s=W.validateComparison(value||defaults(p));
    if(p.machine==='lathe'){
      if(s.mode!=='retained-solid'||s.depthMm!==null)throw Error('A cylinder comparison keeps the target shaft; use retained-solid with no pocket depth.');
      if((s.faceAllowanceMm||0)+p.geometry.params.h>p.stock.length+EPS)throw Error('Facing allowance plus target length must fit within the exposed stock.');
    }else if(s.depthMm===null||s.depthMm>p.stock.depth||s.depthMm<(s.faceAllowanceMm||0))throw Error('Comparison floor must be at or below the faced surface and within the stock thickness.');
    if((s.faceAllowanceMm||0)>=(p.machine==='mill'?p.stock.depth:p.stock.length))throw Error('Facing allowance must leave material in the stock.');
    return s;
  }
  function base(p,s){return{version:1,machine:p.machine,mode:s.mode,depthMm:s.depthMm,toleranceMm:s.toleranceMm,faceAllowanceMm:s.faceAllowanceMm||0,resolutionMm:0,status:'unsupported',
    metrics:{sampleCount:0,desiredVolumeMm3:0,actualVolumeMm3:0,missingVolumeMm3:0,excessVolumeMm3:0,maxUndercutMm:0,maxExcessMm:0,mismatchedPercent:0},observations:[],limitations:[],overlay:null};}
  function unavailable(result,status,message){result.status=status;result.observations.push(message);return result;}
  function checkedSnapshot(s){
    if(!s||s.format!=='access-simulated-material'||s.version!==1||s.source!=='scene-stock'||s.units!=='mm'||!['mill','lathe'].includes(s.machine)||typeof s.complete!=='boolean'||!s.stock||!s.data)throw Error('A measured simulator material snapshot is required.');
    return s;
  }
  function samples(values,count,name,min,max){
    if(!Array.isArray(values)||values.length!==count||count>LIMIT)throw Error(name+' must contain the bounded native simulator samples.');
    values.forEach(n=>finite(n,min,max,name));return values;
  }
  // Even-odd fill across all rings, preserving holes and nested islands.
  function crossings(rings,y){
    const out=[],horizontal=[];for(const r of rings)for(let i=0,j=r.length-1;i<r.length;j=i++){
      const a=r[i],b=r[j];if((a[1]>y)!==(b[1]>y))out.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));
      if(Math.abs(a[1]-y)<EPS&&Math.abs(b[1]-y)<EPS)horizontal.push([Math.min(a[0],b[0]),Math.max(a[0],b[0])]);
    }return{values:out.sort((a,b)=>a-b),horizontal};
  }
  function classify(missing,excess,tolerance){return(missing>tolerance+EPS?1:0)|(excess>tolerance+EPS?2:0);}
  function status(r){r.status=r.metrics.mismatchedPercent>EPS?'needs-work':r.toleranceMm+EPS<r.resolutionMm?'resolution-limited':'within-sample-tolerance';}
  function compareMill(p,s,result,goals){
    const a=s.data,stock=s.stock;
    if(a.kind!=='heightfield')throw Error('This mill snapshot has no material heightfield.');
    for(const key of ['widthMm','heightMm','depthMm'])finite(stock[key],.001,1000000,'Snapshot stock '+key);
    if(!close(stock.widthMm,p.stock.width)||!close(stock.heightMm,p.stock.height)||!close(stock.depthMm,p.stock.depth))return unavailable(result,'unsupported','The simulated stock dimensions differ from this design. Simulate the current design again.');
    if(!Number.isInteger(a.nx)||!Number.isInteger(a.ny)||a.nx<2||a.ny<2||a.nx*a.ny>LIMIT)throw Error('The mill sample grid is invalid or too large.');
    finite(a.dxMm,1e-9,1000000,'X sample spacing');finite(a.dyMm,1e-9,1000000,'Y sample spacing');
    if(!close((a.nx-1)*a.dxMm,stock.widthMm)||!close((a.ny-1)*a.dyMm,stock.heightMm))throw Error('The sample grid does not cover the declared stock.');
    const count=a.nx*a.ny,rounding=EPS*Math.max(1,stock.depthMm),top=samples(a.topMm,count,'Top surface',-stock.depthMm-rounding,rounding),bottom=samples(a.bottomMm,count,'Bottom surface',-stock.depthMm-rounding,rounding);
    if(top.some((n,i)=>n<bottom[i]-EPS))throw Error('A material sample has its top below its bottom.');
    const outline=D.outline(p),rings=outline.rings.map(r=>r.map(v=>[v[0]+p.placement.x,v[1]+p.placement.y]));
    const boundaryBand=Math.hypot(a.dxMm,a.dyMm)/2,segments=[];
    for(const ring of rings)for(let i=0;i<ring.length;i++){
      const u=ring[i],v=ring[(i+1)%ring.length],dx=v[0]-u[0],dy=v[1]-u[1];
      segments.push({x:u[0],y:u[1],dx,dy,length2:dx*dx+dy*dy,minX:Math.min(u[0],v[0])-boundaryBand,maxX:Math.max(u[0],v[0])+boundaryBand,minY:Math.min(u[1],v[1])-boundaryBand,maxY:Math.max(u[1],v[1])+boundaryBand});
    }
    const round=p.geometry.shapeId==='circle'||p.geometry.shapeId==='annulus';
    function nearBoundary(x,y,rowSegments){
      if(round){const q=p.geometry.params,R=p.geometry.shapeId==='circle'?q.r:q.R,dist=Math.hypot(x-p.placement.x-R,y-p.placement.y-R);return Math.abs(dist-R)<=boundaryBand+EPS||(p.geometry.shapeId==='annulus'&&Math.abs(dist-q.r)<=boundaryBand+EPS);}
      for(const e of rowSegments){
        if(x<e.minX||x>e.maxX)continue;
        const t=Math.max(0,Math.min(1,((x-e.x)*e.dx+(y-e.y)*e.dy)/e.length2));
        if(Math.hypot(x-e.x-e.dx*t,y-e.y-e.dy*t)<=boundaryBand+EPS)return true;
      }return false;
    }
    const topGoal=goals?goals.top:result,bottomGoal=goals?goals.bottom:null;
    const topTolerance=topGoal?topGoal.toleranceMm:result.toleranceMm,bottomTolerance=bottomGoal?bottomGoal.toleranceMm:result.toleranceMm;
    const removal=(goal,inside)=>goal?((goal.mode==='pocket'?inside:!inside)?goal.depthMm:(goal.faceAllowanceMm||0)):0;
    const columns=Math.min(48,a.nx),rows=Math.min(48,a.ny),codes=new Uint8Array(columns*rows),m=result.metrics;
    result.resolutionMm=Math.hypot(a.dxMm,a.dyMm);m.sampleCount=count;
    let mismatchArea=0,resolvedMismatchArea=0,insideSamples=0;
    for(let j=0;j<a.ny;j++){
      const y=j*a.dyMm,row=crossings(rings,y),intersections=row.values,weightY=(j===0||j===a.ny-1)?.5:1;let crossing=0;
      const rowSegments=round?[]:segments.filter(e=>y>=e.minY&&y<=e.maxY);
      for(let i=0;i<a.nx;i++){
        const x=i*a.dxMm,k=j*a.nx+i;
        while(crossing<intersections.length&&x>=intersections[crossing])crossing++;
        let inside=(crossing%2)===1||Math.abs(x-intersections[crossing])<EPS||Math.abs(x-intersections[crossing-1])<EPS||row.horizontal.some(span=>x>=span[0]-EPS&&x<=span[1]+EPS);
        // Preserve exact circle boundaries; polygon outlines otherwise use stored sampled edges.
        if(p.geometry.shapeId==='circle'||p.geometry.shapeId==='annulus'){
          const q=p.geometry.params,R=p.geometry.shapeId==='circle'?q.r:q.R,dist=Math.hypot(x-p.placement.x-R,y-p.placement.y-R);
          inside=dist<=R&&!(p.geometry.shapeId==='annulus'&&dist<q.r);
        }
        if(inside)insideSamples++;
        const expectedTop=-removal(topGoal,inside),expectedBottom=-stock.depthMm+removal(bottomGoal,inside);
        const expectedThickness=Math.max(0,expectedTop-expectedBottom),actualThickness=Math.max(0,top[k]-bottom[k]);
        const overlap=Math.max(0,Math.min(expectedTop,top[k])-Math.max(expectedBottom,bottom[k]));
        const missing=Math.max(0,expectedThickness-overlap),excess=Math.max(0,actualThickness-overlap);
        const area=a.dxMm*a.dyMm*weightY*((i===0||i===a.nx-1)?.5:1);
        const code=goals&&expectedThickness>0?((Math.max(0,expectedTop-Math.max(top[k],expectedBottom))>topTolerance+EPS||Math.max(0,Math.min(bottom[k],expectedTop)-expectedBottom)>bottomTolerance+EPS?1:0)|(Math.max(0,top[k]-Math.max(bottom[k],expectedTop))>topTolerance+EPS||Math.max(0,Math.min(top[k],expectedBottom)-bottom[k])>bottomTolerance+EPS?2:0)):classify(missing,excess,Math.min(topTolerance,bottomTolerance));
        m.desiredVolumeMm3+=expectedThickness*area;m.actualVolumeMm3+=actualThickness*area;m.missingVolumeMm3+=missing*area;m.excessVolumeMm3+=excess*area;
        m.maxUndercutMm=Math.max(m.maxUndercutMm,missing);m.maxExcessMm=Math.max(m.maxExcessMm,excess);
        if(code){mismatchArea+=area;if(!nearBoundary(x,y,rowSegments))resolvedMismatchArea+=area;}
        const ci=Math.min(columns-1,Math.floor(i*columns/a.nx)),cj=Math.min(rows-1,Math.floor(j*rows/a.ny));codes[cj*columns+ci]|=code;
      }
    }
    m.mismatchedPercent=Math.min(100,100*mismatchArea/(stock.widthMm*stock.heightMm));
    result.overlay={kind:'mill-map',columns,rows,widthMm:stock.widthMm,heightMm:stock.heightMm,cells:Array.from(codes).join('')};
    status(result);
    if(result.status==='within-sample-tolerance'&&Math.min(topTolerance,bottomTolerance)<result.resolutionMm)result.status='resolution-limited';
    const boundaryOnly=mismatchArea>0&&resolvedMismatchArea===0;
    if(boundaryOnly)result.status='resolution-limited';
    if(!insideSamples){if(!resolvedMismatchArea)result.status='resolution-limited';result.limitations.push('No native sample lies inside the target outline. This grid cannot assess that feature; a matching removal total would not establish its shape.');}
    result.observations.push('Measured the completed simulator top and bottom surfaces at '+count+' grid points. '+fmt(m.mismatchedPercent)+'% of the sampled stock area differs by more than the chosen depth tolerance.');
    result.observations.push('Approximately '+fmt(m.missingVolumeMm3)+' mm³ of desired material is missing; '+fmt(m.excessVolumeMm3)+' mm³ of material remains where the goal calls for removal.');
    if(boundaryOnly)result.observations.push('Every differing sample lies within '+fmt(boundaryBand)+' mm of the target boundary. Raw missing/excess depths reach '+fmt(m.maxUndercutMm)+' / '+fmt(m.maxExcessMm)+' mm there. The grid cannot distinguish a small XY boundary shift or program rounding from a full depth difference at those points.');
    else result.observations.push('Largest sampled missing-material depth: '+fmt(m.maxUndercutMm)+' mm. Largest sampled material excess: '+fmt(m.maxExcessMm)+' mm.');
    if(result.mode==='pocket'&&m.mismatchedPercent>0&&m.mismatchedPercent<2&&m.maxExcessMm>result.toleranceMm&&m.maxUndercutMm<=result.toleranceMm)
      result.observations.push('Small areas still contain excess material. A round cutter may leave material in sharp inside corners: compare those locations on the map with the tool diameter and design. A smaller tool reduces the corner radius; it cannot make a perfectly sharp internal corner.');
    result.limitations.push('The grid resolves approximately '+fmt(result.resolutionMm)+' mm across its diagonal. Volumes and boundaries are sampled estimates; features between points and undercuts cannot be certified.');
    if(result.mode==='retained-solid')result.limitations.push('The goal keeps the outlined region at '+fmt(result.faceAllowanceMm)+' mm below the original top and removes surrounding stock to '+fmt(result.depthMm)+' mm below that original top. An outside contour can leave surrounding waste, which is still counted here; a groove alone is not a finished part.');
    else result.limitations.push('The pocket floor is '+fmt(result.depthMm)+' mm below the original top; surrounding stock and nested islands should be at '+fmt(result.faceAllowanceMm)+' mm below the original top. Facing allowance is an explicit goal, not inferred from the program.');
    if(outline.approximate&&!['circle','annulus'].includes(p.geometry.shapeId))result.limitations.push('This target boundary uses the design library’s sampled curve segments; formula measurements may be more precise than the polygon boundary.');
    return result;
  }
  function compareLathe(p,s,result){
    const a=s.data,stock=s.stock;
    if(p.geometry.shapeId!=='cylinder')return unavailable(result,'unsupported','Only a cylindrical target can currently be compared with the lathe radius samples.');
    if(a.kind!=='radial-profile')throw Error('This lathe snapshot has no radial material profile.');
    finite(stock.diameterMm,.001,1000000,'Snapshot diameter');finite(stock.lengthMm,.001,1000000,'Snapshot length');
    if(!close(stock.diameterMm,p.stock.diameter)||!close(stock.lengthMm,p.stock.length))return unavailable(result,'unsupported','The simulated bar differs from the design stock. Simulate the current design again.');
    finite(a.z0Mm,-1000000,1000000,'Profile origin');finite(a.dzMm,1e-9,1000000,'Profile sample spacing');finite(a.frontZMm,-1000000,1000000,'Original front coordinate');
    if(!Number.isInteger(a.detachedParts)||a.detachedParts<0||a.detachedParts>12)throw Error('The detached part count is invalid.');
    const mounted=samples(a.radiiMm,a.radiiMm&&a.radiiMm.length,'Stock radii',0,stock.diameterMm/2+EPS);
    if(mounted.length<2)throw Error('A lathe comparison needs at least two radial samples.');
    if(a.detachedParts&&!Array.isArray(a.detachedProfiles))return unavailable(result,'unsupported','This older snapshot has no native radius samples for its parted-off pieces. Replay the program to measure the loose part.');
    if(a.detachedProfiles&&(!Array.isArray(a.detachedProfiles)||a.detachedProfiles.length!==a.detachedParts))throw Error('Detached part samples do not match the recorded piece count.');
    let total=0;
    for(const q of a.detachedProfiles||[]){
      finite(q.z0Mm,-1000000,1000000,'Detached profile origin');finite(q.dzMm,1e-9,1000000,'Detached profile spacing');
      finite(q.stockEndZMm,-1000000,1000000,'Original stock end');
      samples(q.radiiMm,q.radiiMm&&q.radiiMm.length,'Detached part radii',0,stock.diameterMm/2+EPS);total+=q.radiiMm.length;
      const offset=(q.z0Mm-a.z0Mm)/a.dzMm;
      if(!close(q.dzMm,a.dzMm)||Math.abs(offset-Math.round(offset))>1e-5||offset<-EPS||offset+q.radiiMm.length>mounted.length+EPS||q.radiiMm.length<2||total>LIMIT||!close(q.stockEndZMm,a.stockEndZMm===undefined?a.frontZMm:a.stockEndZMm))throw Error('Detached samples must preserve the bounded native stock grid.');
    }
    if(a.detachedParts>1)return unavailable(result,'unsupported','The simulator contains more than one detached piece. Select or replay one final part before assessing its dimensions; this comparison will not guess which loose piece is the design.');
    const detached=a.detachedParts===1,q=detached?a.detachedProfiles[0]:a,r=q.radiiMm;
    const stockEnd=q.stockEndZMm===undefined?a.frontZMm:finite(q.stockEndZMm,-1000000,1000000,'Original stock end');
    const radius=p.geometry.params.r,length=p.geometry.params.h,end=a.frontZMm-result.faceAllowanceMm,start=end-length,last=a.z0Mm+(mounted.length-1)*a.dzMm;
    if(start<a.z0Mm-EPS||end>last+EPS)return unavailable(result,'unsupported','The material snapshot does not cover the full target length.');
    let first=-1,lastMaterial=-1;for(let k=0;k<r.length;k++)if(r[k]>1e-4*25.4){if(first<0)first=k;lastMaterial=k;}
    const actualFront=lastMaterial<0?null:Math.min(stockEnd,q.z0Mm+lastMaterial*q.dzMm),actualBack=first<0?null:q.z0Mm+first*q.dzMm;
    const actualLength=detached&&actualFront!==null?Math.max(0,actualFront-actualBack):null;
    result.dimensions={source:detached?'detached':'mounted',pieceCount:a.detachedParts,expectedFrontMm:end,actualFrontMm:actualFront,expectedLengthMm:length,actualLengthMm:actualLength,frontErrorMm:actualFront===null?null:actualFront-end,lengthErrorMm:actualLength===null?null:actualLength-length};
    // Use native samples inside the target interval. Interpolating through its
    // shoulder would mix the target with chuck allowance that is explicitly excluded.
    const zs=[],values=[];
    for(let k=Math.max(0,Math.ceil((start-a.z0Mm-EPS)/a.dzMm));k<mounted.length;k++){
      const z=a.z0Mm+k*a.dzMm;if(z>end+EPS)break;
      const index=Math.round((z-q.z0Mm)/q.dzMm);zs.push(Math.max(start,Math.min(end,z)));values.push(index>=0&&index<r.length?r[index]:0);
    }
    if(zs.length<2)return unavailable(result,'unsupported','The target length contains fewer than two native radius samples. The simulator cannot measure its diameter profile.');
    const m=result.metrics;result.resolutionMm=a.dzMm;m.sampleCount=zs.length;
    let mismatchLength=0,resolvedMismatchLength=0,minDiameter=Infinity,maxDiameter=0;
    for(let i=0;i<zs.length;i++){
      const actual=values[i];minDiameter=Math.min(minDiameter,actual*2);maxDiameter=Math.max(maxDiameter,actual*2);
      m.maxUndercutMm=Math.max(m.maxUndercutMm,2*Math.max(0,radius-actual));m.maxExcessMm=Math.max(m.maxExcessMm,2*Math.max(0,actual-radius));
      const left=i?(zs[i-1]+zs[i])/2:start,right=i<zs.length-1?(zs[i]+zs[i+1])/2:end,dz=right-left;
      m.desiredVolumeMm3+=Math.PI*radius*radius*dz;m.actualVolumeMm3+=Math.PI*actual*actual*dz;
      m.missingVolumeMm3+=Math.PI*Math.max(0,radius*radius-actual*actual)*dz;m.excessVolumeMm3+=Math.PI*Math.max(0,actual*actual-radius*radius)*dz;
      if(Math.abs(actual-radius)*2>result.toleranceMm+EPS){mismatchLength+=dz;if(Math.min(zs[i]-start,end-zs[i])>a.dzMm+EPS)resolvedMismatchLength+=dz;}
    }
    // The loose piece is assessed in its original stock coordinates. Material
    // beyond either desired end remains excess; mounted chuck allowance is excluded.
    if(actualFront!==null)for(let i=first;i<=lastMaterial;i++){
      const z=q.z0Mm+i*q.dzMm,left=Math.max(actualBack,z-q.dzMm/2),right=Math.min(actualFront,z+q.dzMm/2);
      const beyondFront=Math.max(0,right-Math.max(left,end)),behindBack=detached?Math.max(0,Math.min(right,start)-left):0,dz=beyondFront+behindBack;
      if(dz>0&&r[i]>0){const v=Math.PI*r[i]*r[i]*dz;m.actualVolumeMm3+=v;m.excessVolumeMm3+=v;m.maxExcessMm=Math.max(m.maxExcessMm,2*r[i]);if(2*r[i]>result.toleranceMm+EPS){mismatchLength+=dz;if(z>end+a.dzMm+EPS||(detached&&z<start-a.dzMm-EPS))resolvedMismatchLength+=dz;}}
    }
    m.mismatchedPercent=Math.min(100,100*mismatchLength/length);
    const profile=zs.map((z,i)=>({zMm:Math.max(0,Math.min(length,end-z)),diameterMm:values[i]*2})).reverse(),points=[];
    // Preserve extrema in each interval so the compact chart cannot hide a narrow gouge.
    const buckets=Math.min(94,profile.length);points.push(profile[0]);
    for(let i=0;i<buckets;i++){
      const section=profile.slice(Math.floor(i*profile.length/buckets),Math.floor((i+1)*profile.length/buckets));
      let low=section[0],high=section[0];for(const q of section){if(q.diameterMm<low.diameterMm)low=q;if(q.diameterMm>high.diameterMm)high=q;}
      for(const q of [low,high].sort((x,y)=>x.zMm-y.zMm))if(q.zMm>points[points.length-1].zMm)points.push(q);
    }
    if(points[points.length-1].zMm<profile[profile.length-1].zMm)points.push(profile[profile.length-1]);
    result.overlay={kind:'lathe-chart',lengthMm:length,targetDiameterMm:radius*2,samples:points};status(result);
    const d=result.dimensions,frontResolved=d.frontErrorMm!==null&&Math.abs(d.frontErrorMm)>result.toleranceMm+a.dzMm+EPS,lengthResolved=d.lengthErrorMm!==null&&Math.abs(d.lengthErrorMm)>result.toleranceMm+2*a.dzMm+EPS;
    const endpointDifference=(d.frontErrorMm!==null&&Math.abs(d.frontErrorMm)>result.toleranceMm+EPS)||(d.lengthErrorMm!==null&&Math.abs(d.lengthErrorMm)>result.toleranceMm+EPS);
    if(actualFront===null||resolvedMismatchLength>0||frontResolved||lengthResolved)result.status='needs-work';
    else if(m.mismatchedPercent>EPS||endpointDifference)result.status='resolution-limited';
    result.observations.push('Measured the '+(detached?'detached piece':'mounted bar')+' against the fixed '+fmt(length)+' mm target, starting '+fmt(result.faceAllowanceMm)+' mm behind the original front. '+(detached?'Excess material beyond either desired end is counted.':'The chuck allowance behind the target is excluded.'));
    result.observations.push(actualFront===null?'No positive-radius material remains in the measured profile.':'Measured front: '+fmt(actualFront)+' mm in the original stock frame; target front: '+fmt(end)+' mm (signed difference '+fmt(d.frontErrorMm)+' mm).'+(detached?' Sampled loose-part length: '+fmt(actualLength)+' mm; target: '+fmt(length)+' mm (difference '+fmt(d.lengthErrorMm)+' mm).':''));
    result.observations.push('Sampled diameter ranges from '+fmt(minDiameter)+' to '+fmt(maxDiameter)+' mm; target diameter is '+fmt(radius*2)+' mm. '+fmt(m.mismatchedPercent)+'% of the sampled length exceeds the diameter tolerance.');
    result.observations.push('Approximately '+fmt(m.missingVolumeMm3)+' mm³ is overcut and '+fmt(m.excessVolumeMm3)+' mm³ remains above the target cylinder.');
    result.limitations.push('Axial sample spacing is '+fmt(a.dzMm)+' mm. The model assumes a solid, rotationally symmetric part; it cannot assess internal bores, thread form, runout, surface finish or real tool deflection.');
    result.limitations.push('Endpoint positions are the first/last positive native samples, clipped to the original stock end. Each face is unresolved by up to '+fmt(a.dzMm)+' mm; a sampled loose-part length can differ by up to '+fmt(2*a.dzMm)+' mm from its boundary extent. Endpoint volumes use nearest interior samples.');
    if(result.status==='resolution-limited'&&m.mismatchedPercent>EPS)result.observations.push('The remaining discrepancies lie within an axial sample of the desired end faces. Their raw volume and diameter differences are retained, but this sampling cannot resolve the exact face or part-off position.');
    return result;
  }
  function compare(raw,snapshot,options,goals){
    const p=D.validate(raw),goal=settings(p,options),result=base(p,goal),s=checkedSnapshot(snapshot);
    if(!s.complete||s.alarm)return unavailable(result,'incomplete','Finish a successful simulator playback before comparing material. A preflight check alone does not provide a completed result.');
    if(s.machine!==p.machine)return unavailable(result,'unsupported','The material snapshot belongs to a different machine.');
    const checks=D.checks(p).find(c=>!c.ok&&c.id!=='brief');if(checks)return unavailable(result,'unsupported',checks.message);
    if(p.machine==='mill')compareMill(p,s,result,goals);else compareLathe(p,s,result);
    if(result.resolutionMm&&result.toleranceMm<result.resolutionMm)result.limitations.push('The requested tolerance is smaller than the sampling spacing. Even if no mismatch is detected, the simulator cannot establish that tolerance.');
    if(result.status==='needs-work')result.observations.push('Use the difference map or diameter chart to locate the error. Recheck the comparison goal, cut depth, tool size and operation order before regenerating.');
    else if(result.status==='within-sample-tolerance')result.observations.push('No sampled mismatch exceeds the chosen tolerance. This is a simulator comparison, not a measurement of a manufactured part.');
    else if(result.status==='resolution-limited')result.observations.push(result.metrics.mismatchedPercent>0?'Differences are confined to unresolved boundary samples. The raw volumes and map remain visible, but this does not establish either a finished match or a resolved interior overcut.':'No mismatch was detected at the available sample resolution. The grid cannot confirm the requested feature or tolerance.');
    return summary(result);
  }
  function compareSetups(raw,setupId,snapshot){
    const p=D.validate(raw),items=W.getSetups(p).items,index=items.findIndex(s=>s.id===setupId);if(index<0)throw Error('Choose a setup in this project.');
    const projected=W.setupProject(p,setupId),selected=items[index],goals={top:null,bottom:null};
    for(const s of items.slice(0,index+1))if(p.machine==='mill')goals[s.orientation]=settings(p,s.comparison);
    const measured=snapshot.complete?Material.orient(snapshot,p.machine==='mill'?'top':'front'):snapshot;
    const result=compare(projected,measured,selected.comparison,p.machine==='mill'?goals:undefined);
    if(p.machine==='mill'){
      const describe=(side,g)=>side+': '+(g?g.mode+', floor '+fmt(g.depthMm)+' mm, facing '+fmt(g.faceAllowanceMm||0)+' mm, tolerance '+fmt(g.toleranceMm)+' mm':'original uncut stock surface');
      result.observations.unshift('Cumulative setup goal in the original blank frame. '+describe('Top',goals.top)+'. '+describe('Bottom',goals.bottom)+'. Each side keeps its own tolerance.');
      result.observations=result.observations.slice(0,8);
      result.limitations=result.limitations.filter(t=>!t.startsWith('The goal keeps')&&!t.startsWith('The pocket floor'));
      result.limitations.push('Each depth and facing allowance is measured inward from that side of the ORIGINAL blank. The expected solid is the material between the composed top and bottom surfaces; earlier overcuts are not repaired or ignored by a later setup.');
    }return summary(result);
  }
  function summary(result){return W.validateComparisonResult(result);}
  function renderSVG(raw,units){
    const r=summary(raw),o=r.overlay;if(!o)return'';
    const factor=units==='in'?25.4:1,unit=units==='in'?'in':'mm',show=n=>fmt(n/factor);
    if(o.kind==='mill-map'){
      const colors=['#f0f3f5','#b91c1c','#1261a0','#6e3a91'],w=540,h=Math.max(80,Math.min(360,w*o.heightMm/o.widthMm)),x=40,y=28,cw=w/o.columns,ch=h/o.rows;
      let art='';for(let j=0;j<o.rows;j++)for(let i=0;i<o.columns;){const code=o.cells[j*o.columns+i],start=i;while(i<o.columns&&o.cells[j*o.columns+i]===code)i++;art+='<rect x="'+fmt(x+start*cw)+'" y="'+fmt(y+(o.rows-1-j)*ch)+'" width="'+fmt((i-start)*cw+.02)+'" height="'+fmt(ch+.02)+'" fill="'+colors[+code]+'"/>';}
      return'<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Simulated material difference map. Red means missing material, blue means excess material, purple means both." viewBox="0 0 620 '+fmt(h+115)+'">'+art+'<rect x="40" y="28" width="540" height="'+fmt(h)+'" fill="none" stroke="#334155"/><g fill="#17202a" font-family="system-ui,sans-serif" font-size="13"><text x="40" y="18">Difference across the entire stock</text><text x="40" y="'+fmt(h+48)+'">X: '+show(o.widthMm)+' '+unit+' · Y: '+show(o.heightMm)+' '+unit+'</text><text x="40" y="'+fmt(h+69)+'">Red: missing / overcut · Blue: excess / uncut</text><text x="40" y="'+fmt(h+91)+'">Purple: both in one map cell · Grey: within sampled tolerance</text></g></svg>';
    }
    const width=540,height=250,x=40,y=30,max=Math.max(o.targetDiameterMm,...o.samples.map(q=>q.diameterMm))*1.1;
    const px=z=>x+z/o.lengthMm*width,py=d=>y+height-d/(max||1)*height,points=o.samples.map(q=>fmt(px(q.zMm))+','+fmt(py(q.diameterMm))).join(' ');
    return'<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Simulated diameter along the target length, compared with the design diameter." viewBox="0 0 620 370"><rect x="40" y="30" width="540" height="250" fill="#f0f3f5" stroke="#334155"/><path d="M40,'+fmt(py(o.targetDiameterMm))+'H580" stroke="#17202a" stroke-width="2" stroke-dasharray="6 4"/><polyline points="'+points+'" fill="none" stroke="#1261a0" stroke-width="2"/><g fill="#17202a" font-family="system-ui,sans-serif" font-size="13"><text x="40" y="18">Diameter target: '+show(o.targetDiameterMm)+' '+unit+'</text><text x="40" y="302">0 · design front</text><text x="430" y="302">'+show(o.lengthMm)+' '+unit+' from front</text><text x="40" y="327">Blue: measured simulator diameter · Dashed: design diameter</text><text x="40" y="349">Above target: excess stock · Below target: overcut</text></g></svg>';
  }
  return Object.freeze({defaults,compare,compareSetups,summary,renderSVG:function(result,units){
    return renderSVG(result,units).replace(/(<svg[^>]*>)/,'$1<title>Simulated material compared with the design goal</title><desc>The figure displays measured simulator samples. Read the accompanying numerical differences and resolution limitations; colour alone does not establish a finished-part match.</desc>');
  }});
});
