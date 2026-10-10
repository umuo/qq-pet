const test=require('node:test'),assert=require('node:assert/strict');
const {drawItems,addItems,pools,catalog}=require('../src/service/gameplay/loot');
const {Mailbox}=require('../src/service/gameplay/mail');
test('reference weighted pools only draw consumables supported by this inventory; duplicate draws stack',()=>{
  assert.deepEqual(pools.map(pool=>pool.length),[129,578,140]);
  const items=drawItems(2,()=>0);assert.equal(items.length,1);assert.equal(items[0].count,2);assert.equal(items[0].id,'_100010032');
  for(const value of [0,0.05,0.5,0.999])for(const item of drawItems(2,()=>value)){assert.ok(catalog.has(item.id));assert.ok(['food','commodity','toy'].includes(item.type));}
});
test('inventory stacks exact IDs and keeps other categories; malformed quantities are rejected without mutation',()=>{
  const item={id:'_100010031',type:'food',name:'雪泥爽',count:2},cache={store:{food:['_100010031-3','_100010032-1'],commodity:[]},gift:{sign:['keep']}};
  const result=addItems(cache,[item]);assert.deepEqual(result.store.food,['_100010031-5','_100010032-1']);assert.deepEqual(result.gift,cache.gift);assert.equal(cache.store.food[0],'_100010031-3');
  for(const patch of [{id:'unknown'},{type:'medicine'},{count:0},{count:1.5}])assert.throws(()=>addItems(cache,[{...item,...patch}]));
});
test('mail draws freeze at delivery; claiming saves items/reward/claimed together and never rerolls or grants twice',()=>{
  let pet={info:{name:'企鹅',host:'主人',birthDay:'2020-10-09',health:5,yb:10,hunger:1500,clean:1500,mood:800},maxInfo:{level:10},activeOption:{},playroom:null},cache={store:{food:[],commodity:[]}},draws=0,writes=[];
  const options={readPet:()=>pet,readCache:()=>cache,writePet:patch=>{writes.push(patch);if(patch.inventory)cache=patch.inventory;pet={...pet,...patch,info:{...pet.info,...patch.info}};},now:()=>new Date(2026,9,9,12).getTime(),holidays:()=>[],drawItems:()=>{draws++;return [{id:'_100010031',type:'food',name:'雪泥爽',count:2}];}};
  let mailbox=new Mailbox(options);assert.equal(mailbox.deliver().sent,2);assert.equal(draws,2);mailbox=new Mailbox(options);assert.equal(mailbox.deliver(),null);assert.equal(draws,2);
  const result=mailbox.claim('birthday-2026');assert.equal(result.ok,true);assert.equal(pet.info.yb,310);assert.equal(cache.store.food[0],'_100010031-2');const patch=writes.at(-1);assert.ok(patch.playroom.mail.letters.find(l=>l.id==='birthday-2026').claimed);assert.ok(patch.inventory);assert.equal(patch.info.yb,310);
  assert.equal(mailbox.claim('birthday-2026').ok,false);assert.equal(pet.info.yb,310);assert.equal(cache.store.food[0],'_100010031-2');assert.equal(draws,2);
});
