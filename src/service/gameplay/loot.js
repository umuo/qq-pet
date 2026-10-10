// Reward pools/weights adapted from qqpet pet/loot.ts (6e2c8bf, GPL-3.0).
const POOLS=require('./data/pool.json');
const {shop}=require('../../windows/util/pet/shop');
const TOYS=require('./data/toys.json');
const TYPES=['food','commodity','medicine','background'];
const catalog=new Map(TYPES.flatMap(type=>Object.entries(shop[type]).map(([id,item])=>[id,{id,type,name:item.name}])));
for(const [id,item] of Object.entries(TOYS))catalog.set(id,{id,type:'toy',name:item.name});
const pools=POOLS.map(pool=>pool.filter(id=>catalog.has(id)&&['food','commodity','toy'].includes(catalog.get(id).type)));
function drawItems(count,random=Math.random) {
  const result=[];
  for(let i=0;i<count;i++) {
    let chance=random(),index=[0.02,0.25,0.75].findIndex(weight=>(chance-=weight)<=0);
    if(index<0)index=2;
    const pool=pools[index].length?pools[index]:pools.find(p=>p.length);
    if(!pool)continue;
    const id=pool[Math.min(pool.length-1,Math.max(0,Math.floor(random()*pool.length)))];
    const existing=result.find(item=>item.id===id);
    if(existing)existing.count++;else result.push({...catalog.get(id),count:1});
  }
  return result;
}
function addItems(cache,items=[]) {
  const result=JSON.parse(JSON.stringify(cache||{}));result.store ||= {};
  for(const item of items) {
    if(!item || !catalog.has(item.id) || catalog.get(item.id).type!==item.type || catalog.get(item.id).name!==item.name || !Number.isSafeInteger(item.count) || item.count<1 || item.count>100)throw Error('礼物物品数据无效。');
    const list=result.store[item.type] ||= [];
    if(!Array.isArray(list))throw Error('背包物品数据无效。');
    const index=list.findIndex(entry=>typeof entry==='string' && entry.split('-')[0]===item.id);
    const previous=index<0?0:Number(list[index].split('-')[1]),total=previous+item.count;
    if(!Number.isSafeInteger(previous)||previous<0||!Number.isSafeInteger(total))throw Error('背包物品数量无效。');
    if(index<0)list.push(`${item.id}-${total}`);else list[index]=`${item.id}-${total}`;
  }
  return result;
}
module.exports={drawItems,addItems,catalog,pools};
