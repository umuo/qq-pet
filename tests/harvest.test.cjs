const test=require('node:test'),assert=require('node:assert/strict');
const {Harvest,ripeFish,QUIET,TIMES}=require('../src/service/gameplay/harvest');
function harness() {
  let now=new Date(2026,9,9,12).getTime();const seconds=Math.floor(now/1000);
  let pet={info:{host:'主人',health:5,mood:800,yb:300},maxInfo:{level:10,hunger:3000,clean:3000},activeOption:{},fishing:{fishes:[]},playroom:{version:1,farm:{session:null,user:{wealth:'220',checked:seconds,farmland:[{farmland:'FarmlandS',crop:'RadishSeed',time:seconds-TIMES.RadishSeed}]}}}};
  const writes=[];const options={readPet:()=>pet,writePet:patch=>{writes.push(JSON.parse(JSON.stringify(patch)));pet={...pet,...patch};},now:()=>now,random:()=>0};
  return {harvest:new Harvest(options),options,pet:()=>pet,writes,advance:ms=>now+=ms,now:()=>now};
}
test('new crops notify once across reload; added fish waits 30 minutes; reductions permit a later harvest cycle',()=>{
  const h=harness();const result=h.harvest.check();assert.equal(result.ripe,1);assert.equal(result.target,'farm');assert.equal(h.harvest.check(),null);
  assert.equal(new Harvest(h.options).check(),null);assert.equal(h.pet().info.yb,300);
  h.pet().fishing.fishes=[{stage:3}];assert.equal(h.harvest.check(),null);
  h.advance(QUIET);assert.equal(h.harvest.check().fish,1);assert.equal(h.harvest.check(),null);
  h.pet().fishing.fishes=[];h.pet().playroom.farm.user.farmland[0].harvest=1;assert.equal(h.harvest.check(),null);
  assert.deepEqual(h.pet().playroom.harvest.seen,{ripe:0,pests:0,fish:0});
  delete h.pet().playroom.farm.user.farmland[0].harvest;h.advance(QUIET);assert.equal(h.harvest.check().ripe,1);
});
test('quiet/busy/paused pets defer news, an open farm does not roll disasters, and backward clock does not bypass throttling',()=>{
  const h=harness();assert.equal(h.harvest.check(true),null);assert.equal(h.harvest.check().ripe,1);
  h.pet().fishing.fishes=[{stage:3}];h.advance(QUIET);h.pet().activeOption.desktopGame='rope';assert.equal(h.harvest.check(),null);
  h.pet().activeOption.desktopGame=null;h.pet().maxInfo.stopGrowth=true;assert.equal(h.harvest.check(),null);
  h.pet().maxInfo.stopGrowth=false;assert.equal(h.harvest.check().fish,1);
  h.pet().fishing.fishes.push({stage:3});h.advance(-QUIET);assert.equal(h.harvest.check(),null);
  const user=h.pet().playroom.farm.user;user.farmland=[{farmland:'FarmlandS',crop:'RadishSeed',time:Math.floor(h.now()/1000)}];user.checked=Math.floor(h.now()/1000)-10000;
  h.pet().playroom.farm.session={id:'open'};h.harvest.check();assert.equal(h.pet().playroom.farm.user.farmland[0].grass,undefined);
});
test('offline disasters are saved without changing currency; ripe and harvested plots are excluded',()=>{
  const h=harness(),user=h.pet().playroom.farm.user,seconds=Math.floor(h.now()/1000);
  user.farmland.push({farmland:'FarmlandS',crop:'RadishSeed',time:seconds},{farmland:'FarmlandS',crop:'RadishSeed',time:seconds,harvest:1});user.checked=seconds-10000;
  const result=h.harvest.check();assert.equal(result.pests,1);assert.equal(result.ripe,1);
  const saved=h.pet().playroom.farm.user;assert.equal(saved.farmland[1].grass,1);assert.equal(saved.farmland[1].worm,1);assert.equal(saved.farmland[1].farmland,'FarmlandG');assert.equal(saved.farmland[2].grass,undefined);
  assert.equal(saved.wealth,'220');assert.equal(h.pet().info.yb,300);assert.equal(saved.checked,seconds);
});
test('fish maturity matches the existing pond: two growth stages, feed adds one hour, invalid intervals cannot mature',()=>{
  const now=100000000;assert.equal(ripeFish([{stage:1,born:10000,interval:45000,siLiao:0}],now),1);
  assert.equal(ripeFish([{stage:1,born:10000,interval:48000,siLiao:2}],now),1);
  assert.equal(ripeFish([{stage:1,born:10000,interval:48000,siLiao:0}],now),0);
  assert.equal(ripeFish([{stage:1,born:10000,interval:0,siLiao:0},{stage:3}],now),1);
});
