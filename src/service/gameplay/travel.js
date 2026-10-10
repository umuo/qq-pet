const { companion, Companion } = require('./companion');
const DESTINATIONS = require('./data/travel.json');
const MAP = require('./data/china.json');
const PHOTOS = require('./data/album.json');
const fs = require('node:fs');
const path = require('node:path');
const DURATION = 60 * 60 * 1000;
const TOUR_PRICE = 8888;
const MILESTONES=require('./data/travel-milestones.json');
const {catalog,addItems}=require('./loot');
function visitedCount(visits){return DESTINATIONS.filter(p=>Number.isSafeInteger(visits?.[p.name])&&visits[p.name]>0).length;}
function milestones(tour){return MILESTONES.map(t=>({...t,reward:t.reward||0,items:t.goods.map(id=>({...catalog.get(id),count:1})),done:visitedCount(tour.visits),claimed:tour.milestoneClaims?.[t.target]===true}));}

// Destination stories/map: AnkioTomas/qqpet, snapshot 6e2c8bf (GPL-3.0).
// Travel state lives in the same pet snapshot as rewards and activity ownership.
class Travel {
  constructor(options = {}) {
    this.companion = options.companion || new Companion(options);
    this.now = options.now || Date.now;
    this.random = options.random || Math.random;
    this.photoAvailable = options.photoAvailable || (id => fs.existsSync(path.join(__dirname, '../../assets/reference/album', id + '.webp')));
    this.notifying = false;
  }
  load() {
    const data = this.companion.load();
    const previous = data.state.travel || {};
    data.state.travel = { visits: {}, postcards: [], souvenirs: [], photos: [], sequence: 0, tours: 0, session: null, ...previous };
    return data;
  }
  write(p, state, patch = {}) {
    this.companion.writePet({ playroom: state, ...patch });
  }
  start() {
    const { p, state } = this.load();
    if (!this.companion.usable(p) || p.activeOption.ill) return { ok: false, message: '先恢复健康、继续成长，再去旅行吧~' };
    if (state.travel.session || ['work', 'study', 'trip', 'desktopGame'].some(k => p.activeOption[k])) return { ok: false, message: '先完成正在做的事，再出门旅行吧~' };
    const place = DESTINATIONS[Math.floor(this.random() * DESTINATIONS.length)];
    const encounter = this.random() < 0.2;
    const duration = encounter ? (55 + Math.floor(this.random() * 5)) * 60000 : DURATION;
    const story = place.extraordinaryEncounter[Math.floor(this.random() * place.extraordinaryEncounter.length)];
    const id = ++state.travel.sequence;
    state.travel.session = { id, place: place.name, remainingMs: duration, durationMs: duration, lastTick: this.now(), running: true, encounter, story };
    state.travel.lastStatus = 'started';
    this.write(p, state, { activeOption: { ...p.activeOption, trip: { managedTravel: true, id, city: place.name, overTime: 60, stateTime: 0 } } });
    return { ok: true, message: `出发去${place.name}！大约一小时后回来，途中可能遇到奇遇。` };
  }
  cancel(message = '提前回家啦。这次没有完成旅行，不计访问和奖励。') {
    const { p, state } = this.load();
    if (!state.travel.session) return { ok: false, message: '企鹅已经在家啦~' };
    const trip = state.travel.session;
    state.travel.session = null; state.travel.lastStatus = 'cancelled';
    const activeOption = { ...p.activeOption };
    if (activeOption.trip?.managedTravel && activeOption.trip.id === trip.id) activeOption.trip = null;
    this.write(p, state, { activeOption });
    return { ok: true, message };
  }
  tick() {
    if (this.notifying) return null;
    this.notifying = true;
    try {
      const { p, state } = this.load();
      const t = state.travel.session;
      if (!t) return null;
      if (+p.info.health <= 1 || p.activeOption.ill || !p.activeOption.trip?.managedTravel || p.activeOption.trip.id !== t.id || p.activeOption.work || p.activeOption.study) {
        return this.cancel('旅行已中断。等恢复健康、有空的时候再出发吧~');
      }
      const now = this.now();
      // A backwards clock is rebased without granting travel progress.
      const elapsed = Math.max(0, now - t.lastTick);
      if (t.running) t.remainingMs = Math.max(0, t.remainingMs - elapsed);
      t.lastTick = now;
      t.running = !p.maxInfo.stopGrowth;
      if (t.remainingMs > 0 || !t.running) {
        this.write(p, state);
        return null;
      }
      const firstVisit = !state.travel.visits[t.place];
      state.travel.visits[t.place] = (state.travel.visits[t.place] || 0) + 1;
      state.travel.session = null; state.travel.lastStatus = 'returned';
      state.daily.counts.Travel1 = (state.daily.counts.Travel1 || 0) + 1;
      const host = p.info.host || '主人';
      const collected = new Set(state.travel.photos.map(s => s.id));
      const left = PHOTOS.filter(photo => !collected.has(photo.id) && this.photoAvailable(photo.id));
      const buddy = this.random() < 0.4;
      const pool = [buddy, !buddy].flatMap(b => [t.place, ''].map(place => left.filter(photo => photo.b === b && photo.p === place))).find(pool => pool.length);
      const photo = pool?.[Math.floor(this.random() * pool.length)];
      if (photo) state.travel.photos.push({ id: photo.id, city: t.place, sentAt: now, buddy: photo.b });
      state.travel.postcards.unshift({
        id: t.id, place: t.place, sentAt: now, read: false, encounter: t.encounter, claimed: false,
        title: `${t.place}寄来的${t.encounter ? '奇遇' : '旅行'}明信片`,
        text: t.story.tolk.replaceAll('[host]', host), action: t.story.submitText,
        reward: t.encounter ? (firstVisit ? 40 : 20) : 0, photo: photo?.id || null
      });
      this.write(p, state, { activeOption: { ...p.activeOption, trip: null }, info: { mood: Math.min(+p.maxInfo.mood || 1000, +p.info.mood + 20) } });
      return { ok: true, message: `从${t.place}回来啦！心情 +20，${t.encounter ? '还遇到了一件奇妙的事，' : ''}明信片已寄到邮箱。` };
    } finally { this.notifying = false; }
  }
  openCard(id) {
    const { p, state } = this.load();
    const card = state.travel.postcards.find(c => c.id === id);
    if (!card || card.read) return false;
    card.read = true; this.write(p, state); return true;
  }
  claimEncounter(id) {
    const { p, state } = this.load();
    const card = state.travel.postcards.find(c => c.id === id);
    if (!card || !card.encounter || card.claimed) return { ok: false, message: '这个奇遇的纪念品已经收好啦~' };
    card.read = true; card.claimed = true;
    state.travel.souvenirs.push({ id: card.id, place: card.place, title: card.action, receivedAt: this.now() });
    this.write(p, state, { info: { yb: (+p.info.yb || 0) + card.reward } });
    return { ok: true, message: `收好「${card.action}」这份旅途纪念，获得 ${card.reward} 元宝。` };
  }
  claimMilestone(target) {
    const {p,state}=this.load(),tour=state.travel;
    const task=milestones(tour).find(t=>t.target===target);
    if(!task||task.claimed||task.done<task.target)return {ok:false,message:'先游览对应数量的不同目的地，奖励只能领取一次哦~'};
    const balance=Number(p.info.yb)+task.reward;
    if(!Number.isSafeInteger(balance)||balance<0)return {ok:false,message:'元宝数据异常，暂时无法领取。'};
    let inventory;
    try{inventory=addItems(this.companion.readCache(),task.items);}catch(_){return {ok:false,message:'背包数据异常，暂时无法领取。'};}
    tour.milestoneClaims ||= {};tour.milestoneClaims[target]=true;
    this.write(p,state,{inventory,info:{yb:balance}});
    return {ok:true,message:`完成「${task.label}」旅行任务，获得${task.reward?task.reward+'元宝和':''}${task.items.map(i=>i.name+' × '+i.count).join('、')}！`};
  }
  finishTour(expectedTours) {
    const {p,state}=this.load(),tour=state.travel;
    if(!Number.isSafeInteger(tour.tours)||tour.tours<0||tour.tours===Number.MAX_SAFE_INTEGER||expectedTours!==tour.tours||!DESTINATIONS.every(place=>Number.isSafeInteger(tour.visits[place.name])&&tour.visits[place.name]>0))return {ok:false,message:'先点亮全部 35 个目的地，再完成旅游成就吧~'};
    const balance=Number(p.info.yb);
    if(!Number.isSafeInteger(balance)||balance<TOUR_PRICE)return {ok:false,message:`完成旅游成就需要 ${TOUR_PRICE} 元宝，现在元宝还不够哦~`};
    tour.visits={};tour.tours++;
    this.write(p,state,{info:{yb:balance-TOUR_PRICE}});
    return {ok:true,message:`花费 ${TOUR_PRICE} 元宝，完成第 ${tour.tours} 次旅游成就！地图已重新开始，照片、明信片和纪念品都保留啦~`};
  }
  view() {
    const { p, state } = this.load();
    if (JSON.stringify(p.playroom) !== JSON.stringify(state)) this.write(p, state);
    const session = state.travel.session;
    return { ...state.travel, milestones:milestones(state.travel), photoTotal: PHOTOS.length, availablePhotos: PHOTOS.filter(p => this.photoAvailable(p.id)).length, destinations: DESTINATIONS.map(p => p.name), map: MAP, available: this.companion.usable(p) && !p.activeOption.ill && !['work', 'study', 'trip', 'desktopGame'].some(k => p.activeOption[k]), paused: !!p.maxInfo.stopGrowth,
      session: session && { id: session.id, place: session.place, remainingMs: session.remainingMs, durationMs: session.durationMs, running: session.running }, unread: state.travel.postcards.filter(c => !c.read).length };
  }
}
let instance;
function travel() { return instance ||= new Travel({ companion: companion() }); }
module.exports = { Travel, travel, DESTINATIONS, DURATION, PHOTOS, TOUR_PRICE };
