/* Native simulator material transfer. Datums remain tied to the original blank. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.AccessDesignMaterial=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const MM=25.4,LIMIT=100000,EPS=1e-5;
  const num=(v,min,max,label)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw Error(label+' is invalid.');return v;};
  const eq=(a,b)=>Math.abs(a-b)<=EPS*Math.max(1,Math.abs(a),Math.abs(b));
  function validate(raw){
    if(!raw||raw.format!=='access-simulated-material'||raw.version!==1||raw.source!=='scene-stock'||raw.units!=='mm'||!['mill','lathe'].includes(raw.machine)||raw.complete!==true||raw.alarm)throw Error('A completed, successful preceding setup is required; preflight or partial stock cannot seed another setup.');
    const s=JSON.parse(JSON.stringify(raw)),a=s.data,b=s.stock;if(!a||!b)throw Error('Material stock and native samples are required.');
    const array=(v,n,min,max)=>{if(!Array.isArray(v)||v.length!==n||n>LIMIT)throw Error('The native material sample count is invalid.');v.forEach(x=>num(x,min,max,'Material sample'));};
    s.orientation=s.orientation||(s.machine==='mill'?'top':'front');
    if(s.machine==='mill'){
      if(!['top','bottom'].includes(s.orientation)||a.kind!=='heightfield')throw Error('Unsupported mill material frame.');
      ['widthMm','heightMm','depthMm'].forEach(k=>num(b[k],.001,1e6,k));
      if(!Number.isInteger(a.nx)||!Number.isInteger(a.ny)||a.nx<2||a.ny<2||a.nx*a.ny>LIMIT)throw Error('Invalid native mill grid.');
      num(a.dxMm,1e-9,1e6,'X spacing');num(a.dyMm,1e-9,1e6,'Y spacing');
      if(!eq((a.nx-1)*a.dxMm,b.widthMm)||!eq((a.ny-1)*a.dyMm,b.heightMm))throw Error('Native grid does not match the stock.');
      const allowance=EPS*Math.max(1,b.depthMm);array(a.topMm,a.nx*a.ny,-b.depthMm-allowance,allowance);array(a.bottomMm,a.nx*a.ny,-b.depthMm-allowance,allowance);
      if(a.topMm.some((v,i)=>v<a.bottomMm[i]-EPS))throw Error('Material top is below its bottom.');
    }else{
      if(s.orientation!=='front'||a.kind!=='radial-profile')throw Error('Lathe reversal is not supported; retain the original front datum.');
      num(b.diameterMm,.001,1e6,'Diameter');num(b.lengthMm,.001,1e6,'Length');num(a.z0Mm,-1e6,1e6,'Radius origin');num(a.dzMm,1e-9,1e6,'Axial spacing');num(a.frontZMm,-1e6,1e6,'Original front');
      if(a.stockEndZMm!==undefined)num(a.stockEndZMm,-1e6,1e6,'Original stock end');
      array(a.radiiMm,a.radiiMm&&a.radiiMm.length,0,b.diameterMm/2+EPS);
      if(a.radiiMm.length<2||!Number.isInteger(a.detachedParts)||a.detachedParts<0||a.detachedParts>12)throw Error('Invalid native lathe profile.');
      if(a.detachedProfiles!==undefined){
        if(!Array.isArray(a.detachedProfiles)||a.detachedProfiles.length!==a.detachedParts)throw Error('The detached profile count is invalid.');let count=0;
        for(const q of a.detachedProfiles){num(q.z0Mm,-1e6,1e6,'Detached origin');num(q.dzMm,1e-9,1e6,'Detached spacing');num(q.stockEndZMm,-1e6,1e6,'Detached stock end');array(q.radiiMm,q.radiiMm&&q.radiiMm.length,0,b.diameterMm/2+EPS);count+=q.radiiMm.length;if(count>LIMIT)throw Error('Detached material exceeds the native sample limit.');}
      }
    }return s;
  }
  function orient(raw,orientation){
    const s=validate(raw);if(s.machine==='lathe'){if(orientation!=='front')throw Error('Reversing or remounting a lathe part needs an explicit datum and is not supported.');return s;}
    if(!['top','bottom'].includes(orientation))throw Error('Choose the top or bottom mill face.');
    if(s.orientation!==orientation){const a=s.data,d=s.stock.depthMm,h=a.topMm.slice(),b=a.bottomMm.slice();
      for(let j=0;j<a.ny;j++)for(let i=0;i<a.nx;i++){const k=j*a.nx+i,q=(a.ny-1-j)*a.nx+i;a.topMm[q]=-d-b[k];a.bottomMm[q]=-d-h[k];}
    }s.orientation=orientation;return s;
  }
  function fingerprint(raw){
    const s=orient(raw,raw.machine==='mill'?'top':'front');let hash=2166136261;
    const value=JSON.stringify({machine:s.machine,stock:s.stock,data:s.data},(_,v)=>typeof v==='number'?Math.round(v*1e7)/1e7:v);
    for(let i=0;i<value.length;i++){hash^=value.charCodeAt(i);hash=Math.imul(hash,16777619);}return'material-v1-'+(hash>>>0).toString(16).padStart(8,'0');
  }
  function native(raw){
    // Reorientation subtracts from the original thickness. Keep transferred
    // samples at double precision so repeated flips do not round away material.
    const s=validate(raw),a=s.data,b=s.stock,copy=v=>Float64Array.from(v,n=>n/MM);
    if(s.machine==='mill')return{sx:b.widthMm/MM,sy:b.heightMm/MM,sz:b.depthMm/MM,nx:a.nx,ny:a.ny,dx:a.dxMm/MM,dy:a.dyMm/MM,h:copy(a.topMm),b:copy(a.bottomMm)};
    if(a.detachedParts)throw Error('A later setup cannot silently remount a parted-off piece. Finish this chain or define a new explicit part datum.');
    return{R:b.diameterMm/(2*MM),z0:a.z0Mm/MM,z1:(a.stockEndZMm===undefined?a.frontZMm:a.stockEndZMm)/MM,dz:a.dzMm/MM,n:a.radiiMm.length,r:copy(a.radiiMm)};
  }
  function seed(stock,raw,remember){
    const n=native(raw);
    if(raw.machine==='mill'){
      if(stock.nx!==n.nx||stock.ny!==n.ny||!eq(stock.sx,n.sx)||!eq(stock.sy,n.sy)||!eq(stock.sz,n.sz))throw Error('The next setup must retain the original stock dimensions and native grid.');
      stock.h=n.h.slice();stock.b=n.b.slice();if(remember){stock.h0=n.h.slice();stock.b0=n.b.slice();}
    }else{
      if(stock.n!==n.n||!eq(stock.z0,n.z0)||!eq(stock.z1,n.z1)||!eq(stock.dz,n.dz)||!eq(stock.R,n.R))throw Error('The next lathe setup must retain the original stock and chuck frame.');
      stock.r=n.r.slice();if(remember)stock.r0=n.r.slice();
    }return n;
  }
  function seatFixture(fixture,raw){
    if(!raw||raw.machine!=='mill')return fixture;const n=native(raw);let minimum=Infinity;
    for(let i=0;i<n.h.length;i++)if(n.h[i]>n.b[i]+1e-6)minimum=Math.min(minimum,n.b[i]);
    if(!Number.isFinite(minimum))throw Error('No remaining material can be seated in this setup.');
    const shift=Math.max(0,minimum+n.sz);fixture.seatingOffset=shift;
    for(const b of fixture.boxes){b.z0+=shift;b.z1+=shift;}for(const c of fixture.cyls){c.z0+=shift;c.z1+=shift;}
    fixture.tableTopRel+=shift;for(const k of ['jawTop','floor'])if(Number.isFinite(fixture.info[k]))fixture.info[k]+=shift;
    if(fixture.method==='clamps'){
      fixture.clampContacts=[];
      for(const clamp of fixture.boxes.filter(b=>b.kind==='clamp')){
        let surface=-Infinity;
        for(let j=0;j<n.ny;j++)for(let i=0;i<n.nx;i++){
          const x=i*n.dx,y=j*n.dy,k=j*n.nx+i;
          if(x>=clamp.x0&&x<=clamp.x1&&y>=clamp.y0&&y<=clamp.y1&&n.h[k]>n.b[k]+1e-6)surface=Math.max(surface,n.h[k]);
        }
        if(!Number.isFinite(surface))throw Error('The '+clamp.name+' has no remaining material beneath its nose. Move the clamp onto intact, supported material.');
        // Supports follow the lower surface; each strap follows its own upper
        // contact surface. Keeping the original +shift here would lift a strap
        // off a flipped part, or leave it floating above a uniformly faced top.
        const height=clamp.z1-clamp.z0,label=clamp.name.replace(/ strap clamp$/,'');
        clamp.z0=surface;clamp.z1=surface+height;
        const block=fixture.boxes.find(b=>b.kind==='block'&&b.name===label+' step block');
        const stud=fixture.cyls.find(c=>c.kind==='stud'&&c.name===label+' T-bolt and nut');
        if(block)block.z1=surface+fixture.info.heel;
        if(stud)stud.z1=surface+fixture.info.nutTop;
        fixture.clampContacts.push({name:clamp.name,surface});
      }
    }
    return fixture;
  }
  return Object.freeze({validate,orient,fingerprint,native,seed,seatFixture});
});
