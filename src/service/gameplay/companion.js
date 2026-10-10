// Local companion rules, inspired by AnkioTomas/qqpet's daily tasks and game rewards.
// A single pet write stores progress and awarded stats together.
const DAY_LIMIT = 60;
const validMinutes=value=>Number.isSafeInteger(value)&&value>=0&&value<=DAY_LIMIT;
const ledgerObject=value=>value&&typeof value==='object'&&!Array.isArray(value);
const {holidays:localHolidays}=require('./calendar');
const {drawItems,addItems}=require('./loot');
const TYPES = [
  { id: 'Eat', label: '喂我吃东西', range: [1, 3], needs: p => +p.info.hunger < +p.maxInfo.hunger / 2 },
  { id: 'Clean', label: '帮我洗香香', range: [1, 2], needs: p => +p.info.clean < +p.maxInfo.clean / 2 },
  { id: 'Amusing', label: '摸摸我、逗我笑', range: [3, 6], needs: p => +p.info.mood < 500 },
  { id: 'Game', label: '陪我玩小游戏', range: [2, 5], needs: p => +p.info.mood < 500, unit: '分钟' },
  { id: 'Work', label: '去打一次工', range: [1, 1], can: p => +p.maxInfo.level >= 2, needs: p => +p.info.yb < 500 },
  { id: 'Study', label: '好好上一节课', range: [1, 1], needs: () => true },
  { id: 'Toy', label: '陪我玩玩具', range: [2, 4], needs: p => +p.info.mood < 500 },
  { id: 'Travel1', label: '出门看看世界', range: [1, 1], needs: () => false }
];
function dayKey(now) {
  const d = new Date(now);
  if (d.getHours() < 6) d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
class Companion {
  constructor({ readPet, writePet, now = Date.now, random = Math.random, holidays=localHolidays, readCache=()=>typeof global.getCache==='function'?getCache():{store:{}} }) {
    Object.assign(this, { readPet, writePet, now, random, holidays, readCache });
  }
  load() {
    const p = this.readPet();
    const state = JSON.parse(JSON.stringify(p.playroom || {}));
    state.version = 1;
    state.settings = { faceMode: 2, ...state.settings };
    state.lifetime ||= { pokes: 0, gameMinutes: 0 };
    // Keep awarded minutes per date, including legacy saves, so returning to
    // an earlier date cannot reopen that day's reward budget.
    state.gameRewardDays ??= {};
    const ledger=state.gameRewardDays,previous=state.daily;
    if(ledgerObject(ledger)&&previous&&/^\d{4}-\d{2}-\d{2}$/.test(previous.day)&&validMinutes(previous.gameMinutes)) {
      const recorded=ledger[previous.day];
      if((previous.gameMinutes>0||recorded!==undefined)&&(recorded===undefined||validMinutes(recorded)))ledger[previous.day]=Math.max(recorded||0,previous.gameMinutes);
    }
    const day = dayKey(this.now());
    if (state.daily?.day !== day) {
      state.dailyHistory ??= {};
      if(!ledgerObject(state.dailyHistory))throw Error('每日任务历史数据无效。');
      if(previous&&/^\d{4}-\d{2}-\d{2}$/.test(previous.day))state.dailyHistory[previous.day]=previous;
      const restored=state.dailyHistory[day];
      if(restored)state.daily=JSON.parse(JSON.stringify(restored));
      else {
        const pool = TYPES.filter(t => !t.can || t.can(p));
        const tasks = [];
        while (tasks.length < 4 && pool.length) {
          const weighted = pool.flatMap(t => Array(t.needs(p) ? 3 : 1).fill(t));
          const t = weighted[Math.floor(this.random() * weighted.length)];
          tasks.push({ id: t.id, label: t.label, target: t.range[0] + Math.floor(this.random() * (t.range[1] - t.range[0] + 1)), unit: t.unit || '次', reward: 50, claimed: false });
          pool.splice(pool.indexOf(t), 1);
        }
        const recorded=ledgerObject(ledger)?ledger[day]:DAY_LIMIT;
        const gameMinutes=recorded===undefined?0:validMinutes(recorded)?recorded:DAY_LIMIT;
        state.daily = { day, counts: gameMinutes?{Game:gameMinutes}:{}, tasks, gameMinutes };
      }
    }
    // Festival tasks follow the same 06:00 day boundary as normal tasks.
    const festivals=this.holidays(new Date(day+'T12:00:00'));
    if(festivals.length && !state.daily.tasks.some(task=>task.id==='HolidayToy')) {
      state.daily.tasks.push({id:'HolidayToy',counter:'Toy',label:festivals.join('、')+'快乐 · 陪我玩玩具',target:5,unit:'次',reward:100,items:drawItems(2,this.random),claimed:!!state.holidayClaims?.[day]});
    }
    require('./pokeMilestones').prepare(state,this.random);
    return { p, state };
  }
  view() {
    const { p, state } = this.load();
    if (JSON.stringify(p.playroom) !== JSON.stringify(state)) this.writePet({ playroom: state });
    return { ...state, pokeMilestones:require('./pokeMilestones').view(state), daily: { ...state.daily, tasks: state.daily.tasks.map(t => ({ ...t, done: state.daily.counts[t.counter||t.id] || 0 })) } };
  }
  usable(p) { return +p.info.health > 1 && !p.maxInfo.stopGrowth; }
  record(id, n = 1) {
    if (!TYPES.some(t => t.id === id) || !Number.isFinite(n) || n <= 0) return false;
    const { p, state } = this.load();
    if (!this.usable(p)) return false;
    state.daily.counts[id] = (state.daily.counts[id] || 0) + n;
    this.writePet({ playroom: state });
    return true;
  }
  poke() {
    const { p, state } = this.load();
    if (!this.usable(p) || ['work', 'study', 'trip', 'desktopGame'].some(k => p.activeOption?.[k])) return false;
    state.daily.counts.Amusing = (state.daily.counts.Amusing || 0) + 1;
    state.lifetime.pokes++;
    const mood = Math.min(+p.maxInfo.mood || 1000, +p.info.mood + 5 + Math.floor(this.random() * 11));
    this.writePet({ playroom: state, info: { mood } });
    return true;
  }
  claim(day, id) {
    const { p, state } = this.load();
    const t = state.daily.tasks.find(t => t.id === id);
    if (day !== state.daily.day || !t || t.claimed || (state.daily.counts[t.counter||id] || 0) < t.target || (id==='HolidayToy'&&state.holidayClaims?.[day])) return { ok: false, message: '任务还没完成，或奖励已经领取啦~' };
    const balance=Number(p.info.yb)+t.reward;
    if(!Number.isSafeInteger(t.reward)||t.reward<0||!Number.isSafeInteger(balance)||balance<0)return {ok:false,message:'奖励或元宝数据异常，暂时无法领取。'};
    let inventory;
    try {
      if(t.items!==undefined&&!Array.isArray(t.items))throw Error('Invalid items');
      inventory=t.items?.length?addItems(this.readCache(),t.items):null;
    }catch(_){return {ok:false,message:'物品或背包数据异常，暂时无法领取。'};}
    t.claimed = true;
    if(id==='HolidayToy'){state.holidayClaims ||= {};state.holidayClaims[day]=true;}
    this.writePet({ playroom: state, info: { yb: balance }, ...(inventory?{inventory}:{}) });
    const items=(t.items||[]).map(item=>`「${item.name}」×${item.count}`).join('、');
    return { ok: true, message: `完成「${t.label}」，获得${t.reward}元宝${items?'和'+items:''}~` };
  }
  claimPokeMilestone(day,target) {return require('./pokeMilestones').claim(this,day,target);}
  setting(faceMode) {
    if (![0, 1, 2].includes(faceMode)) return false;
    const { state } = this.load();
    state.settings.faceMode = faceMode;
    this.writePet({ playroom: state });
    return true;
  }
  rewardGame(minutes, day = dayKey(this.now())) {
    const { p, state } = this.load();
    if (!this.usable(p) || day !== state.daily.day) return { minutes: 0 };
    const ledger=state.gameRewardDays,recorded=ledgerObject(ledger)?ledger[day]:null;
    if(!ledgerObject(ledger)||!validMinutes(state.daily.gameMinutes)||(recorded!==undefined&&!validMinutes(recorded)))return {minutes:0};
    const awarded=Math.max(state.daily.gameMinutes,recorded||0);
    const m = Math.min(Math.max(0, Math.floor(minutes)), DAY_LIMIT - awarded);
    if (!Number.isFinite(m) || m <= 0) return { minutes: 0 };
    state.daily.gameMinutes = awarded+m;
    ledger[day]=state.daily.gameMinutes;
    state.daily.counts.Game = (state.daily.counts.Game || 0) + m;
    state.lifetime.gameMinutes += m;
    this.writePet({ playroom: state, info: {
      yb: (+p.info.yb || 0) + 5 * m,
      mood: Math.min(+p.maxInfo.mood || 1000, +p.info.mood + 2 * m),
      growth: (+p.info.growth || 0) + (+p.maxInfo.growthRate || 260) / 60 * m
    } });
    return { minutes: m, yb: 5 * m };
  }
  rewardDesktop() {
    const { p, state } = this.load();
    if (!this.usable(p) || p.activeOption?.ill) return { mood: 0, yb: 0 };
    const mood = Math.max(0, Math.min(55, (+p.maxInfo.mood || 1000) - +p.info.mood));
    state.daily.desktopRewards = (state.daily.desktopRewards || 0) + 1;
    this.writePet({ playroom: state, info: { mood: +p.info.mood + mood, yb: (+p.info.yb || 0) + 1 } });
    return { mood, yb: 1 };
  }
  desktopRound() {
    const { p, state } = this.load();
    if (!this.usable(p)) return false;
    state.daily.counts.GameRound = (state.daily.counts.GameRound || 0) + 1;
    state.lifetime.desktopRounds = (state.lifetime.desktopRounds || 0) + 1;
    this.writePet({ playroom: state });
    return true;
  }
}
let instance;
function companion() {
  return instance ||= new Companion({ readPet: () => global.getPetInfo(), writePet: p => global.setPetInfo(p) });
}
module.exports = { Companion, companion, dayKey, DAY_LIMIT };
