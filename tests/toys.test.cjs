const test=require('node:test'),assert=require('node:assert/strict');
const {Toys,TOYS,advanceToy}=require('../src/service/gameplay/toys');
function harness(){let p={info:{yb:1000,mood:900,charm:0,intel:0,strong:0,health:5,growth:30000},maxInfo:{level:10,mood:1000},activeOption:{},otherOptions:{}},cache={store:{food:[],toy:[]}},writes=[];const options={readPet:()=>p,readCache:()=>cache,writePet:patch=>{writes.push(patch);if(patch.inventory)cache=patch.inventory;p={...p,...patch,info:{...p.info,...patch.info}};},now:()=>new Date(2026,9,9,12).getTime(),random:()=>0};return {toys:new Toys(options),pet:()=>p,cache:()=>cache,writes};}
test('buy/use a baseball grants exact reference effects and consumes one, with counters and inventory in one write',()=>{
  const h=harness();assert.equal(h.toys.buy('_t0002').ok,true);assert.equal(h.pet().info.yb,980);assert.equal(h.cache().store.toy[0],'_t0002-1');
  assert.equal(h.toys.use('_t0002').ok,true);assert.equal(h.pet().info.mood,950);assert.equal(h.pet().info.strong,2);assert.equal(h.cache().store.toy.length,0);assert.equal(h.pet().playroom.daily.counts.Toy,1);assert.equal(h.pet().playroom.lifetime.toyUses,1);assert.ok(h.writes.at(-1).inventory);assert.ok(h.writes.at(-1).info);assert.ok(h.writes.at(-1).playroom);
  assert.equal(h.toys.use('_t0002').ok,false);assert.equal(h.pet().info.strong,2);
});
test('catalog, levels, diamond requirements, discount, balance, pause and activity checks are enforced',()=>{
  const h=harness();assert.equal(h.toys.view().list.length,8);assert.equal(h.toys.buy('_t0001').ok,false);assert.equal(h.toys.buy('_t0005').ok,false);assert.equal(h.toys.buy('constructor').ok,false);
  h.pet().otherOptions.pinkDiamond=true;assert.equal(h.toys.buy('_t0005').ok,true);assert.equal(h.pet().info.yb,696);
  for(const key of ['work','study','trip','desktopGame','ill']){h.pet().activeOption[key]={};assert.equal(h.toys.use('_t0005').ok,false);h.pet().activeOption[key]=null;}
  h.pet().maxInfo.stopGrowth=true;assert.equal(h.toys.use('_t0005').ok,false);h.pet().maxInfo.stopGrowth=false;h.pet().info.health=0;assert.equal(h.toys.use('_t0005').ok,false);h.pet().info.health=5;
  assert.equal(h.toys.use('_t0005').ok,true);assert.equal(h.pet().info.mood,1000);assert.equal(h.pet().info.intel,2);assert.deepEqual(h.pet().playroom.toys.active,{id:'_t0005',left:60});
  h.pet().info.yb=0;assert.equal(h.toys.buy('_t0002').ok,false);
});
test('all toy effects are preserved; timed growth replaces the current toy, survives saves and expires exactly after online minutes',()=>{
  for(const [id,good] of Object.entries(TOYS)){const h=harness();h.cache().store.toy.push(id+'-1');h.pet().info.mood=100;assert.equal(h.toys.use(id).ok,true);assert.equal(h.pet().info.mood,100+good.mood);for(const key of ['strong','intel','charm'])assert.equal(h.pet().info[key],good[key]||0);}
  const h=harness();h.cache().store.toy=['_t0005-1','_t0006-1'];h.toys.use('_t0005');let state=JSON.parse(JSON.stringify(h.pet().playroom));let step=advanceToy(state,30);assert.equal(step.growth,5);assert.equal(step.state.toys.active.left,30);assert.equal(state.toys.active.left,60);step=advanceToy(step.state,40);assert.equal(step.growth,5);assert.equal(step.state.toys.active,null);assert.equal(advanceToy(step.state,1),null);
  h.toys.use('_t0006');assert.equal(h.pet().playroom.toys.active.id,'_t0006');assert.equal(h.pet().playroom.toys.active.left,60);
});
