const test=require('node:test'),assert=require('node:assert/strict');
const {selfCare}=require('../src/service/gameplay/sweetheart');const {shop}=require('../src/windows/util/pet/shop');
function fixture(){const food=Object.keys(shop.food).find(id=>shop.food[id].starve>0),clean=Object.keys(shop.commodity).find(id=>shop.commodity[id].clean>0);const pet={info:{health:5,hunger:100,clean:100,mood:100},maxInfo:{hunger:3000,clean:3000,mood:1000},otherOptions:{sweetHeart:true}};const cache={store:{food:[food+'-2'],commodity:[clean+'-2'],toy:['_t0002-2']}},used=[];const goods={getConsumables(){},getGoodsInfo({goodName}){return {type:goodName.split('*')[0],name:goodName};},useConsumables(item){used.push(item);return {};}};const options={readPet:()=>pet,readCache:()=>cache,goods,toys:()=>({use(id){used.push({type:'toy',id});return {ok:true,message:'玩具'};}})};return {pet,cache,options,used};}
test('care uses one owned item per tick, food before cleaning before toys, below 60 percent',()=>{
 const h=fixture();assert.equal(selfCare(h.options).type,'food');assert.equal(h.used.length,1);
 h.pet.info.hunger=1800;assert.equal(selfCare(h.options).type,'commodity');h.pet.info.clean=1800;assert.equal(selfCare(h.options).type,'toy');h.pet.info.mood=600;assert.equal(selfCare(h.options),null);assert.equal(h.used.length,3);
});
test('disabled/paused/dead and empty or corrupt urgent inventory never consume or buy another item',()=>{
 for(const mutate of [h=>h.pet.otherOptions.sweetHeart=false,h=>h.pet.maxInfo.stopGrowth=true,h=>h.pet.info.health=0,h=>h.cache.store.food=[],h=>h.cache.store.food=['missing-2','_invalid--1']]){const h=fixture();mutate(h);assert.equal(selfCare(h.options),null);assert.equal(h.used.length,0);}
 const h=fixture();h.options.goods.useConsumables=()=>({overType:'err'});assert.equal(selfCare(h.options),null);
});
