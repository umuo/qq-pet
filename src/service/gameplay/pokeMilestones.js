// qqpet pet/tasks.ts ddw rewards (6e2c8bf, GPL-3.0), reset at 06:00.
const {catalog,drawItems,addItems}=require('./loot');
const DEFINITIONS=[
  {target:5,id:'_102010001'},
  {target:10,id:'_10012002'},
  {target:15,id:'_10013004'},
  {target:20,draws:1},
  {target:25,draws:2}
];
function prepare(state,random) {
  if(state.daily.pokeMilestones===undefined)state.daily.pokeMilestones=DEFINITIONS.map(def=>({target:def.target,items:def.id?[{...catalog.get(def.id),count:1}]:drawItems(def.draws,random),claimed:!!state.pokeMilestoneClaims?.[state.daily.day]?.[def.target]}));
}
function validReward(task,def) {
  if(!task||!Array.isArray(task.items)||typeof task.claimed!=='boolean')return false;
  try{addItems({},task.items);}catch(_){return false;}
  return def.id?task.items.length===1&&task.items[0].id===def.id&&task.items[0].count===1:task.items.every(i=>['food','commodity','toy'].includes(i.type))&&task.items.reduce((n,i)=>n+i.count,0)===def.draws;
}
function view(state) {
  const count=state.daily.counts.Amusing,done=Number.isSafeInteger(count)&&count>=0?count:0;
  return DEFINITIONS.map(def=>{const task=state.daily.pokeMilestones?.find(t=>t.target===def.target);return {target:def.target,label:'逗逗我',done,items:task?.items||[],claimed:!!task?.claimed||!!state.pokeMilestoneClaims?.[state.daily.day]?.[def.target]};});
}
function claim(service,day,target) {
  const {state}=service.load(),def=DEFINITIONS.find(d=>d.target===target),task=state.daily.pokeMilestones?.find(t=>t.target===target),count=state.daily.counts.Amusing;
  if(day!==state.daily.day||!def||!validReward(task,def)||task.claimed||state.pokeMilestoneClaims?.[day]?.[target]||!Number.isSafeInteger(count)||count<target)return {ok:false,message:'今天的互动还没完成，或这份礼物已经领取啦~'};
  let inventory;try{inventory=addItems(service.readCache(),task.items);}catch(_){return {ok:false,message:'背包数据异常，暂时不能领取。'};}
  task.claimed=true;state.pokeMilestoneClaims ||= {};state.pokeMilestoneClaims[day] ||= {};state.pokeMilestoneClaims[day][target]=true;
  service.writePet({playroom:state,inventory});
  return {ok:true,message:`完成今天 ${target} 次互动，收到${task.items.map(i=>`「${i.name}」×${i.count}`).join('、')}。`};
}
function validate(state) {
  const tasks=state.daily?.pokeMilestones;
  if(tasks!==undefined&&(!Array.isArray(tasks)||tasks.length!==5||DEFINITIONS.some(def=>tasks.filter(t=>t?.target===def.target).length!==1||!validReward(tasks.find(t=>t?.target===def.target),def))))throw Error('互动阶梯奖励数据无效。');
  if(state.pokeMilestoneClaims!==undefined){
    const ledger=state.pokeMilestoneClaims;
    if(!ledger||typeof ledger!=='object'||Array.isArray(ledger)||Object.entries(ledger).some(([day,claims])=>!/^\d{4}-\d{2}-\d{2}$/.test(day)||!claims||typeof claims!=='object'||Array.isArray(claims)||Object.entries(claims).some(([target,value])=>!DEFINITIONS.some(d=>String(d.target)===target)||typeof value!=='boolean')))throw Error('互动阶梯领奖记录无效。');
  }
}
module.exports={prepare,view,claim,validate,DEFINITIONS};
