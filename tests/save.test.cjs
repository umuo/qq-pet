const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const save = require('../src/service/gameplay/save');
const {freshFarm} = require('../src/service/gameplay/farm');
const destination=require('../src/service/gameplay/data/travel.json')[0];
function fixture() { return {format:save.FORMAT,version:1,pet:{info:{name:'测试',sex:'GG',growth:30000,health:5,hunger:2000,clean:2000,mood:850,yb:75},maxInfo:{level:10},activeOption:{desktopGame:'rope',trip:{managedTravel:true,id:1}},fishing:{fishes:[{id:1,stage:3}]},playroom:{version:1,daily:{counts:{Eat:2},tasks:[{id:'Eat',claimed:true}]},travel:{sequence:1,session:{id:1,place:destination.name,lastTick:Date.now(),remainingMs:10000,durationMs:3600000,running:true,encounter:false,story:destination.extraordinaryEncounter[0]},photos:[{id:'u_alipay'}],postcards:[{id:1,claimed:true}],souvenirs:[{id:'toy'}]},mail:{letters:[{id:'welcome',claimed:true}],sent:{welcome:true}},farm:{user:{...freshFarm(),wealth:'220'},session:{id:'orphan',balance:220,sequence:4}},harvest:{seen:{fish:1},lastAt:123}}},cache:{store:{food:[{id:1,num:2}]}},settings:{hdImages:false,apiKey:'do-not-export'}}; }
test('round trip preserves gameplay/claims/inventory; settles an imported farm wallet once and clears transient games',()=>{
  const input=fixture(),parsed=save.parse(JSON.stringify(input));
  assert.equal(parsed.pet.info.yb,295);assert.equal(parsed.pet.playroom.farm.session,null);assert.equal(parsed.pet.activeOption.desktopGame,null);
  assert.deepEqual(parsed.pet.playroom.travel,input.pet.playroom.travel);assert.deepEqual(parsed.pet.playroom.mail,input.pet.playroom.mail);
  assert.deepEqual(parsed.cache,input.cache);assert.deepEqual(parsed.settings,{hdImages:false});
  assert.deepEqual(save.parse(JSON.stringify(parsed)),parsed,'normalization is idempotent');
  assert.equal(input.pet.playroom.farm.session.balance,220,'source is unchanged');
});
test('legacy config and raw pet are accepted without importing API credentials',()=>{
  const f=fixture();const parsed=save.validate({pet:f.pet,cache:f.cache,sys:{hdImages:false,apiKey:'secret'}});
  assert.equal(parsed.pet.info.yb,295);assert.equal(parsed.settings.apiKey,undefined);
  assert.equal(save.validate(f.pet).pet.info.name,'测试');
});
test('game reward date ledger survives saves and rejects malformed daily budgets',()=>{
  const f=fixture();f.pet.playroom.gameRewardDays={'2026-10-09':60,'2026-10-10':1};
  assert.deepEqual(save.parse(JSON.stringify(f)).pet.playroom.gameRewardDays,f.pet.playroom.gameRewardDays);
  for(const ledger of [[],{'2026-10-09':61},{'2026-10-09':-1},{'2026-10-09':1.5},{'2026-10-09':'1'},{bad:1}]){f.pet.playroom.gameRewardDays=ledger;assert.throws(()=>save.validate(f),/小游戏每日计奖/);}
});
test('daily history preserves earlier claims and frozen gifts; malformed history is rejected',()=>{
  const f=fixture();f.pet.playroom.dailyHistory={'2026-10-09':{day:'2026-10-09',counts:{Eat:2},tasks:[{id:'Eat',target:2,reward:50,claimed:true}],gameMinutes:0}};
  assert.deepEqual(save.parse(JSON.stringify(f)).pet.playroom.dailyHistory,f.pet.playroom.dailyHistory);
  for(const history of [[],{bad:{}},{'2026-10-09':null},{'2026-10-09':{day:'2026-10-10',counts:{},tasks:[],gameMinutes:0}},{'2026-10-09':{day:'2026-10-09',counts:{},tasks:[null],gameMinutes:0}}]){f.pet.playroom.dailyHistory=history;assert.throws(()=>save.validate(f),/每日任务历史/);}
});
test('malformed versions, paths, balances, deep/prototype data and inconsistent trips are rejected',()=>{
  assert.throws(()=>save.parse('not json'));
  for (const mutate of [f=>f.version=9,f=>f.pet.info.yb=-1,f=>f.pet.info.yb=1.5,f=>f.pet.info.health='NaN',f=>f.pet.playroom.travel.photos[0].id='../outside',f=>f.pet.playroom.travel.tours=-1,f=>f.pet.playroom.travel.tours=1.5,f=>f.pet.activeOption.trip.id=2,f=>f.pet.playroom.farm.session.balance=-1,f=>f.pet.playroom.daily.tasks={},f=>f.cache=[]]) {const f=fixture();mutate(f);assert.throws(()=>save.validate(f));}
  assert.throws(()=>save.parse('{"__proto__":{}}'));
  assert.throws(()=>save.parse(' '.repeat(save.LIMIT+1)));
});
test('pending import atomically replaces pet/cache but retains local AI configuration; replay cannot roll back new progress',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'qq-pet-save-')),pending=path.join(dir,'pending-pet-import.json');
  const raw=JSON.stringify(fixture());let writes=0,value={pet:{old:true},cache:{old:true},sys:{apiKey:'local-secret',opacity:0.8},other:'keep'};
  const store={ElectronStore:{get store(){return value},set store(v){writes++;value=v}}};
  fs.writeFileSync(pending,raw);assert.equal(save.applyPending(store,dir),true);assert.equal(writes,1);
  assert.equal(value.pet.info.yb,295);assert.equal(value.sys.apiKey,'local-secret');assert.equal(value.sys.hdImages,false);assert.equal(value.sys.opacity,0.8);assert.equal(value.other,'keep');
  value.pet.info.yb=300;fs.writeFileSync(pending,raw);save.applyPending(store,dir);assert.equal(writes,1);assert.equal(value.pet.info.yb,300);
  fs.writeFileSync(pending,JSON.stringify({...fixture(),importId:'new-user-import'}));save.applyPending(store,dir);assert.equal(writes,2);assert.equal(value.pet.info.yb,295,'explicitly importing the same backup again restores it');
  value.pet.info.yb=300;
  fs.writeFileSync(pending,'broken');assert.equal(save.applyPending(store,dir),false);assert.equal(value.pet.info.yb,300);assert.ok(fs.readdirSync(dir).some(name=>name.includes('rejected')));
  fs.rmSync(dir,{recursive:true,force:true});
});

test('import rejects broken travel stories, unknown/duplicate photos and impossible trip clocks before startup',()=>{
 for(const change of [
  f=>delete f.pet.playroom.travel.session.story,
  f=>delete f.pet.playroom.travel,
  f=>delete f.pet.playroom,
  f=>f.pet.playroom.travel.session.story={tolk:12,submitText:'收下'},
  f=>f.pet.playroom.travel.session.place='不存在的城市',
  f=>f.pet.playroom.travel.session.durationMs=-1,
  f=>f.pet.playroom.travel.session.remainingMs=3600001,
  f=>f.pet.playroom.travel.session.running='false',
  f=>f.pet.playroom.travel.session.encounter=null,
  f=>f.pet.playroom.travel.session.lastTick=-1,
  f=>f.pet.playroom.travel.session.id=0,
  f=>f.pet.playroom.travel.sequence=0,
  f=>f.pet.playroom.travel.photos=[{id:'unknown_photo'}],
  f=>f.pet.playroom.travel.photos.push({id:'u_alipay'}),
  f=>f.pet.playroom.travel.postcards[0].photo='unknown_photo'
 ]){const f=fixture();change(f);assert.throws(()=>save.validate(f),/旅行|相簿/);}
 const f=fixture();f.pet.playroom.travel.session.running=false;f.pet.maxInfo.stopGrowth=true;
 assert.equal(save.parse(JSON.stringify(f)).pet.playroom.travel.session.running,false);
});
