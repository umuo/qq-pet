// Closed-farm disasters and harvest reminders adapted from qqpet farm.ts/harvest.ts.
const fs=require('node:fs'),path=require('node:path');
const {Companion,companion}=require('./companion');
const QUIET=30*60*1000,PEST_TIME=14400;
let XML='';
try {XML=fs.readFileSync(path.resolve(__dirname,'../../assets/reference/qqfarm/com/MyFarm/data/xml/Crop.xml'),'utf8');} catch (_) { /* Fish reminders still work if farm resources are absent. */ }
const TIMES={};
for(const item of XML.matchAll(/<items\s+([^>]+)>/g)) {
  const attrs=Object.fromEntries([...item[1].matchAll(/(\w+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
  if(attrs.seed && Number(attrs.time)>0)TIMES[attrs.seed]=Number(attrs.time);
}
function ripeFish(fishes,now) {
  return (Array.isArray(fishes)?fishes:[]).filter(fish=>{
    if(Number(fish.stage)>=3)return true;
    const interval=Number(fish.interval),born=Number(fish.born),feed=Number(fish.siLiao||0);
    return interval>0 && born>0 && Number.isFinite(feed) && Math.floor(now/1000)-born+3600*feed>=2*interval;
  }).length;
}
class Harvest {
  constructor(options={}){this.companion=options.companion||new Companion(options);this.now=options.now||this.companion.now;this.random=options.random||Math.random;this.checking=false;}
  check(quiet=false) {
    if(this.checking)return null;this.checking=true;
    try {
      const {p,state}=this.companion.load(),now=this.now();
      state.harvest={seen:{ripe:0,pests:0,fish:0},lastAt:null,...state.harvest};
      const before=JSON.stringify(state),seen={ripe:0,pests:0,fish:0,...state.harvest.seen};
      const current={ripe:seen.ripe,pests:seen.pests,fish:ripeFish(p.fishing?.fishes,now)};
      const user=state.farm?.user;
      if(!state.farm?.session) {
        current.ripe=0;current.pests=0;
        if(Array.isArray(user?.farmland)) {
          const seconds=Math.floor(now/1000),checked=Number(user.checked??seconds),chance=1-Math.exp(-Math.max(0,seconds-checked)/PEST_TIME);
          let growing=false;
          for(const land of user.farmland) {
            if(!land?.crop || land.harvest!==undefined || !TIMES[land.crop] || !Number.isFinite(Number(land.time)))continue;
            if(seconds-Number(land.time)>=TIMES[land.crop]){current.ripe++;continue;}
            growing=true;
            if(land.grass===undefined && this.random()<chance)land.grass=1;
            if(land.worm===undefined && this.random()<chance)land.worm=1;
            if(land.farmland==='FarmlandS' && this.random()<chance)land.farmland='FarmlandG';
            if(land.grass!==undefined||land.worm!==undefined||land.farmland==='FarmlandG')current.pests++;
          }
          if(growing)user.checked=seconds;
        }
      }
      // Reductions reset the baseline; increases remain pending while quiet or throttled.
      state.harvest.seen=Object.fromEntries(Object.keys(current).map(key=>[key,Math.min(seen[key],current[key])]));
      const news=Object.keys(current).some(key=>current[key]>state.harvest.seen[key]);
      const busy=['work','study','trip','desktopGame'].some(key=>p.activeOption?.[key]);
      const allowed=news && !quiet && !busy && +p.info.health>1 && !p.maxInfo.stopGrowth && (state.harvest.lastAt===null||now-state.harvest.lastAt>=QUIET);
      let result=null;
      if(allowed){
        state.harvest.seen=current;state.harvest.lastAt=now;
        const parts=[current.ripe&&`农场有${current.ripe}块地的庄稼熟了`,current.pests&&`农场有${current.pests}块地需要除草、除虫或浇水`,current.fish&&`鱼塘有${current.fish}条鱼可以收获`].filter(Boolean);
        result={message:`${p.info.host||'主人'}，${parts.join('，')}，去看看吧~`,target:current.ripe||current.pests?'farm':'fishing',...current};
      }
      if(JSON.stringify(state)!==before)this.companion.writePet({playroom:state});
      return result;
    }finally{this.checking=false;}
  }
}
let instance;function harvest(){return instance ||= new Harvest({companion:companion()});}
function openHarvest(target) {
  if(target==='farm')require('../../windows/popups/farm/main').cleate();
  else if(target==='fishing')global.openLocalHost(info=>require('../../windows/popups/fishing/main').cleate(info));
}
module.exports={Harvest,harvest,ripeFish,openHarvest,TIMES,QUIET};
