// Toy catalog/effects adapted from qqpet goods.json/items.ts (6e2c8bf, GPL-3.0).
const TOYS=require('./data/toys.json');
const {Companion,companion}=require('./companion');
const {addItems}=require('./loot');
const toyOf=id=>typeof id==='string'&&Object.prototype.hasOwnProperty.call(TOYS,id)?TOYS[id]:null;
function advanceToy(state,minutes) {
  const active=state?.toys?.active,good=toyOf(active?.id);
  if(!good?.group || !Number.isFinite(active.left) || active.left<=0 || !Number.isFinite(minutes) || minutes<=0)return null;
  const used=Math.min(active.left,minutes),next=JSON.parse(JSON.stringify(state));
  next.toys.active=active.left>used?{...active,left:active.left-used}:null;
  return {state:next,growth:good.group*used/60};
}
class Toys {
  constructor(options={}){this.companion=options.companion||new Companion(options);this.readCache=options.readCache||(()=>getCache());}
  count(id,cache=this.readCache()) {const list=cache.store?.toy;const entry=Array.isArray(list)?list.find(entry=>typeof entry==='string'&&entry.split('-')[0]===id):null;const count=entry?Number(entry.split('-')[1]):0;return Number.isSafeInteger(count)&&count>=0?count:0;}
  usable(p){return this.companion.usable(p)&&!p.activeOption.ill&&!['work','study','trip','desktopGame'].some(key=>p.activeOption[key]);}
  price(good,p){return Math.floor(good.price*(p.otherOptions?.pinkDiamond?0.8:1));}
  buy(id) {
    const good=toyOf(id),{p,state}=this.companion.load();
    if(!good)return {ok:false,message:'没有找到这个玩具。'};
    if(+p.maxInfo.level<(good.needLevel||0)||(good.PD&&!p.otherOptions?.pinkDiamond))return {ok:false,message:'等级或粉钻条件还不满足，先看看其他玩具吧~'};
    const price=this.price(good,p),balance=Number(p.info.yb);
    if(!Number.isSafeInteger(balance)||balance<price)return {ok:false,message:'元宝还不够，先完成陪伴任务赚一点吧~'};
    let inventory;try{inventory=addItems(this.readCache(),[{id,type:'toy',name:good.name,count:1}]);}catch(_){return {ok:false,message:'背包数据异常，暂时不能购买。'};}
    this.companion.writePet({playroom:state,inventory,info:{yb:balance-price}});
    return {ok:true,message:`买到「${good.name}」，花了 ${price} 元宝。`};
  }
  use(id) {
    const good=toyOf(id),{p,state}=this.companion.load();
    if(!good||!this.usable(p))return {ok:false,message:'先恢复健康、继续成长，并完成正在做的事，再陪我玩玩具吧~'};
    const inventory=JSON.parse(JSON.stringify(this.readCache())),count=this.count(id,inventory);
    if(!count)return {ok:false,message:'这个玩具用完啦，领取礼物或买一个再来吧~'};
    const index=inventory.store.toy.findIndex(entry=>entry.split('-')[0]===id);
    if(count===1)inventory.store.toy.splice(index,1);else inventory.store.toy[index]=`${id}-${count-1}`;
    const mood=Math.min(+p.maxInfo.mood||1000,(+p.info.mood||0)+good.mood),info={mood};
    for(const key of ['charm','intel','strong'])if(good[key])info[key]=(+p.info[key]||0)+good[key];
    state.daily.counts.Toy=(state.daily.counts.Toy||0)+1;state.lifetime.toyUses=(state.lifetime.toyUses||0)+1;
    if(good.useTimeing)state.toys={...state.toys,active:{id,left:good.useTimeing}};
    this.companion.writePet({playroom:state,inventory,info});
    return {ok:true,message:`一起玩「${good.name}」，心情增加 ${mood-(+p.info.mood||0)}${good.useTimeing?`，额外成长效果持续 ${good.useTimeing} 分钟`:''}。`};
  }
  view() {const {p,state}=this.companion.load();return {active:state.toys?.active||null,list:Object.entries(TOYS).map(([id,good])=>({...good,id,count:this.count(id),price:this.price(good,p),canUse:this.usable(p)&&this.count(id)>0,canBuy:+p.maxInfo.level>=(good.needLevel||0)&&(!good.PD||!!p.otherOptions?.pinkDiamond)&&+p.info.yb>=this.price(good,p)}))};}
}
let instance;function toys(){return instance ||= new Toys({companion:companion()});}
module.exports={Toys,toys,TOYS,advanceToy};
