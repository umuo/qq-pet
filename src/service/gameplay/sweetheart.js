// Care priority and 60% threshold follow qqpet pet/pet.ts selfCare (6e2c8bf).
const {shop}=require('../../windows/util/pet/shop');
const NEEDS=[{stat:'hunger',type:'food',effect:'starve'},{stat:'clean',type:'commodity',effect:'clean'},{stat:'mood',type:'toy',effect:'mood'}];
function selfCare({readPet=()=>getPetInfo(),readCache=()=>getCache(),goods=global.petControl?.Goods,toys=()=>require('./toys').toys(),persistInventory=()=>{if(typeof global.setCache==='function')setCache({name:'store',value:getCache('store')});}}={}){
 const pet=readPet();
 if(!pet.otherOptions?.sweetHeart||pet.maxInfo.stopGrowth||Number(pet.info.health)<=0)return null;
 const need=NEEDS.find(n=>Number(pet.maxInfo[n.stat])>0&&Number(pet.info[n.stat])/Number(pet.maxInfo[n.stat])<0.6);
 if(!need)return null;
 const list=readCache()?.store?.[need.type];if(!Array.isArray(list))return null;
 const catalog=need.type==='toy'?require('./toys').TOYS:shop[need.type];
 const owned=list.find(entry=>{if(typeof entry!=='string')return false;const [id,num]=entry.split('-');return Object.prototype.hasOwnProperty.call(catalog,id)&&Number.isSafeInteger(Number(num))&&Number(num)>0&&Number(catalog[id][need.effect])>0;});
 if(!owned)return null;
 if(need.type==='toy'){
   const result=toys().use(owned.split('-')[0]);return result.ok?{type:'toy',message:result.message}:null;
 }
 if(!goods)return null;
 // Re-read Goods' cache after gift/import updates, then use the normal validated
 // consumable path so effects, animation callbacks and task counting agree.
 goods.getConsumables();const item=goods.getGoodsInfo({goodName:need.type+'*'+owned});
 const result=goods.useConsumables(item);
 if(!result||result.overType)return null;
 // Auto-care may run immediately before quitting; don't wait for Goods' timer.
 persistInventory();
 return {type:need.type,name:item.name};
}
module.exports={selfCare,NEEDS};
