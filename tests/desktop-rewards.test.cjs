const test=require('node:test'),assert=require('node:assert/strict');
const {Companion}=require('../src/service/gameplay/companion');
test('desktop reward saves capped mood, money and reward count in one write without altering farm or travel',()=>{
  let pet={info:{health:5,mood:980,yb:40},maxInfo:{mood:1000,level:10,hunger:3000,clean:3000},activeOption:{desktopGame:'rope'},playroom:{farm:{user:{wealth:'220'}},travel:{visits:{北京:1}}}};
  const writes=[];const c=new Companion({readPet:()=>pet,writePet:patch=>{writes.push(patch);pet={...pet,...patch,info:{...pet.info,...patch.info}};},random:()=>0});
  assert.deepEqual(c.rewardDesktop(),{mood:20,yb:1});assert.equal(writes.length,1);
  assert.equal(pet.info.mood,1000);assert.equal(pet.info.yb,41);assert.equal(pet.playroom.daily.desktopRewards,1);
  assert.equal(pet.playroom.farm.user.wealth,'220');assert.equal(pet.playroom.travel.visits.北京,1);
  assert.deepEqual(c.rewardDesktop(),{mood:0,yb:1});
  c.desktopRound();assert.equal(pet.playroom.daily.counts.GameRound,1);assert.equal(pet.playroom.lifetime.desktopRounds,1);
  pet.maxInfo.stopGrowth=true;assert.deepEqual(c.rewardDesktop(),{mood:0,yb:0});assert.equal(c.desktopRound(),false);
});
