const test=require('node:test'),assert=require('node:assert/strict');
const {PondSave}=require('../src/service/gameplay/pondSave');
function fixture(balance){let state={info:{yb:balance},fishing:{fishes:[],canusecnt:3,harvestfish:2},playroom:{marker:true}},writes=0;const session=new PondSave({pet:()=>state,update:patch=>{writes++;state={...state,...patch,info:{...state.info,...patch.info},fishing:{...state.fishing,...patch.fishing}};}});return {session,pet:()=>state,writes:()=>writes};}
test('fish operations preserve concurrent income and close replay settles once',()=>{
  const f=fixture(100),one={sequence:1,walletBase:100,yb:96,fishes:[{id:1}]};
  f.pet().info.yb+=10;f.session.commit({packets:[one]});assert.equal(f.pet().info.yb,106);
  f.session.commit({packets:[one,{sequence:2,walletBase:96,yb:94,fishes:[{id:1},{id:2}]}]});
  assert.equal(f.pet().info.yb,104);assert.equal(f.pet().fishing.fishes.length,2);
  const writes=f.writes();f.session.commit({packets:[one]});assert.equal(f.writes(),writes);
  assert.equal(f.pet().playroom.marker,true);
});
test('zero money/counters and a cleared pond are persisted together',()=>{
  const f=fixture(2);f.session.commit({packets:[{sequence:1,walletBase:2,yb:0,fishes:[],harvestfish:0,canusecnt:0}]});
  assert.equal(f.pet().info.yb,0);assert.equal(f.pet().fishing.canusecnt,0);assert.equal(f.pet().fishing.harvestfish,0);assert.equal(f.writes(),1);
});
test('insufficient concurrent balance rolls back the entire batch and discards replay',()=>{
  const f=fixture(0),batch={packets:[{sequence:1,walletBase:2,yb:0,fishes:[{id:1}]}]};
  assert.throws(()=>f.session.commit(batch),/元宝已发生变化/);assert.equal(f.writes(),0);
  f.session.discard(batch);f.pet().info.yb=10;f.session.commit(batch);
  assert.equal(f.pet().info.yb,10);assert.equal(f.pet().fishing.fishes.length,0);
});
test('actual pond client responses have no shared lifetime limit',()=>{
  const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');let calls=0;
  const context={window:{addEventListener(){}},document:{cookie:''},console:{log(){},error(){}},setTimeout(){},clearTimeout(){},performance:{now:()=>0},fake:{PETEventOnReceived(){calls++;}}};
  vm.createContext(context);vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../src/windows/popups/fishing/indexOnLine.js'),'utf8'),context);
  vm.runInContext('player=fake;for(let n=0;n<35;n++)setPETEVENT({head:{cmd:1},data:{}})',context);
  assert.equal(calls,35,'all client responses reach the player adapter');
});
