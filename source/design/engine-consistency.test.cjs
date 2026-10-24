'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=require('../canvas/src/vendor/shapes-engine.js');
const html=fs.readFileSync(path.resolve(__dirname,'../../shape-canvas/index.html'),'utf8');
const embedded=html.match(/<script id="js-shapes-engine">([\s\S]*?)<\/script>/);
assert.ok(embedded,'Find the shipped canvas engine');
const context=vm.createContext({});vm.runInContext(embedded[1],context);
const shipped=context.Shapes;
const plain=value=>JSON.parse(JSON.stringify(value));
test('canvas and workshop engines agree on every transferable shape and dimension',()=>{
  const shapes=source.list({all:true}).filter(s=>s.kind==='flat'||s.id==='cylinder');
  for(const shape of shapes){
    assert.deepEqual(plain(shipped.info(shape.id)),source.info(shape.id),shape.id+' parameter contract');
    for(const scale of [1,1.7]){
      const params=source.defaults(shape.id);
      for(const p of shape.params)if(!p.angle&&!p.int)params[p.k]*=scale;
      assert.deepEqual(plain(shipped.calc(shape.id,params,'mm')),source.calc(shape.id,params,'mm'),shape.id+' calculations');
      if(shape.kind==='flat')assert.deepEqual(plain(shipped._rings(shape.id,params,256)),plain(source._rings(shape.id,params,256)),shape.id+' physical outline');
    }
    if(shape.angleInput){const ao={angles:true,angleInput:'angle'},params=source.defaults(shape.id,ao);assert.deepEqual(plain(shipped._rings(shape.id,params,256,ao)),plain(source._rings(shape.id,params,256,ao)),shape.id+' angle input outline');}
  }
});
