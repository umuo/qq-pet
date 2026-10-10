const fs = require('node:fs'), path = require('node:path');
const { randomUUID, createHash } = require('node:crypto');
const { validUser } = require('./farm');
const FORMAT = 'qq-pet-save', LIMIT = 16 * 1024 * 1024;
const PHOTO_IDS = new Set(require('./data/album.json').map(photo=>photo.id));
const PLACES = new Set(require('./data/travel.json').map(place=>place.name));
const SETTINGS = ['hdImages','opacity','doNotDisturb','startupSelf','shortcuts','clip','floatStyle','getOption'];
function object(value) { return value && typeof value === 'object' && !Array.isArray(value); }
function checkedTree(value, depth = 0) {
  if (depth > 40) throw Error('存档嵌套过深。');
  if (typeof value === 'number' && !Number.isFinite(value)) throw Error('存档含无效数字。');
  if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) {
    if (['__proto__','prototype','constructor'].includes(key)) throw Error('存档含不支持的字段。');
    checkedTree(child, depth + 1);
  }
}
function settings(source = {}) { return Object.fromEntries(SETTINGS.filter(key => Object.prototype.hasOwnProperty.call(source, key)).map(key => [key, source[key]])); }
function validate(input) {
  checkedTree(input);
  if (!object(input)) throw Error('请选择 QQ 宠物 JSON 存档。');
  if (input.format && (input.format !== FORMAT || input.version !== 1)) throw Error('不支持这个存档格式或版本。');
  const payload = input.format ? input : input.pet ? {pet:input.pet,cache:input.cache,settings:settings(input.sys)} : {pet:input};
  const p = JSON.parse(JSON.stringify(payload.pet || {}));
  if (!object(p.info) || !object(p.maxInfo) || !['GG','MM'].includes(p.info.sex)) throw Error('宠物资料不完整或性别无效。');
  for (const key of ['growth','health','hunger','clean','mood','yb']) {
    if (p.info[key] === '' || p.info[key] === null || !['number','string'].includes(typeof p.info[key]) || !Number.isFinite(Number(p.info[key])) || Number(p.info[key]) < 0) throw Error(`宠物 ${key} 数值无效。`);
  }
  if (!Number.isSafeInteger(Number(p.info.yb))) throw Error('元宝余额无效。');
  for (const key of ['activeOption','activeValue','otherOptions','fishing']) if (p[key] !== undefined && !object(p[key])) throw Error(`宠物 ${key} 数据无效。`);
  if (p.fishing?.fishes !== undefined && !Array.isArray(p.fishing.fishes)) throw Error('鱼塘数据无效。');
  p.activeOption = {...p.activeOption, desktopGame:null};
  if (p.playroom != null) {
    if (!object(p.playroom) || p.playroom.version !== 1) throw Error('不支持这个玩法存档版本。');
    const state = p.playroom;
    require('./pokeMilestones').validate(state);
    if(state.gameRewardDays!==undefined&&(!object(state.gameRewardDays)||Object.entries(state.gameRewardDays).some(([day,minutes])=>!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isSafeInteger(minutes)||minutes<0||minutes>60)))throw Error('小游戏每日计奖记录无效。');
    if (state.daily && (!object(state.daily) || !object(state.daily.counts) || !Array.isArray(state.daily.tasks))) throw Error('陪伴任务数据无效。');
    if(state.dailyHistory!==undefined){
      if(!object(state.dailyHistory))throw Error('每日任务历史数据无效。');
      for(const [day,daily] of Object.entries(state.dailyHistory)) {
        if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!object(daily)||daily.day!==day||!object(daily.counts)||!Array.isArray(daily.tasks)||daily.tasks.some(task=>!object(task))||!Number.isSafeInteger(daily.gameMinutes)||daily.gameMinutes<0||daily.gameMinutes>60)throw Error('每日任务历史数据无效。');
        require('./pokeMilestones').validate({daily});
      }
    }
    if (state.mail && (!object(state.mail) || !Array.isArray(state.mail.letters) || !object(state.mail.sent))) throw Error('邮箱数据无效。');
    if(state.backgrounds!==undefined){
      const active=state.backgrounds?.active,goods=require('./backgrounds').GOODS;
      if(!object(state.backgrounds)||(active!==null&&active!==undefined&&(!object(active)||!Object.hasOwn(goods,active.id)||!goods[active.id].useTimeing||!Number.isFinite(active.left)||active.left<=0||active.left>goods[active.id].useTimeing)))throw Error('背景效果记录无效。');
    }
    if (state.travel) {
      if (!object(state.travel)) throw Error('旅行数据无效。');
      if (state.travel.tours !== undefined && (!Number.isSafeInteger(state.travel.tours) || state.travel.tours < 0)) throw Error('旅行成就次数无效。');
      for (const key of ['photos','postcards','souvenirs']) if (state.travel[key] !== undefined && !Array.isArray(state.travel[key])) throw Error('旅行收藏数据无效。');
      const photos = state.travel.photos || [];
      if (photos.some(photo => !object(photo) || !PHOTO_IDS.has(photo.id)) || new Set(photos.map(photo=>photo.id)).size !== photos.length) throw Error('相簿照片编号无效或重复。');
      if (state.travel.postcards?.some(card=>!object(card)||(card.photo!=null&&!PHOTO_IDS.has(card.photo)))) throw Error('旅行明信片照片编号无效。');
      if(state.travel.milestoneClaims!==undefined&&(!object(state.travel.milestoneClaims)||Object.entries(state.travel.milestoneClaims).some(([k,v])=>!['5','10','15','20','25','30','35'].includes(k)||typeof v!=='boolean')))throw Error('旅行里程碑领奖记录无效。');
      const trip = state.travel.session;
      if (trip && (!object(trip) || !Number.isSafeInteger(trip.id) || !Number.isFinite(trip.lastTick) || !Number.isFinite(trip.remainingMs) || trip.remainingMs < 0 || !p.activeOption.trip?.managedTravel || p.activeOption.trip.id !== trip.id)) throw Error('旅行进度与活动记录不一致。');
      if (trip && (
        trip.id <= 0 || !PLACES.has(trip.place) ||
        !Number.isSafeInteger(state.travel.sequence) || state.travel.sequence < trip.id ||
        trip.lastTick < 0 || !Number.isFinite(trip.durationMs) || trip.durationMs <= 0 || trip.durationMs > 3600000 || trip.remainingMs > trip.durationMs ||
        typeof trip.running !== 'boolean' || typeof trip.encounter !== 'boolean' ||
        !object(trip.story) || typeof trip.story.tolk !== 'string' || !trip.story.tolk.trim() || typeof trip.story.submitText !== 'string' || !trip.story.submitText.trim()
      )) throw Error('旅行进度数据不完整或无效，请选择完整的宠物存档。');
      if (!trip && p.activeOption.trip?.managedTravel) throw Error('旅行活动缺少进度记录。');
    }
    if (state.farm) {
      if (!object(state.farm) || (state.farm.user && !validUser(state.farm.user))) throw Error('农场数据无效。');
      if (state.farm.session) {
        const balance = state.farm.session.balance;
        if (!Number.isSafeInteger(balance) || balance < 0 || !Number.isSafeInteger(Number(p.info.yb) + balance)) throw Error('农场元宝余额无效。');
        // Imported snapshots cannot own a live player's local SharedObject.
        p.info.yb = Number(p.info.yb) + balance;
        state.farm.session = null;
      }
    }
  }
  if (p.activeOption.trip?.managedTravel && !p.playroom?.travel?.session) throw Error('旅行活动缺少进度记录。');
  if (payload.cache !== undefined && !object(payload.cache)) throw Error('背包和缓存数据无效。');
  if (payload.settings !== undefined && !object(payload.settings)) throw Error('设置数据无效。');
  delete p.changeInfo; delete p.changeMax; delete p.changeValue; delete p.listenMain;
  return { format:FORMAT, version:1, pet:p, ...(payload.cache ? {cache:payload.cache} : {}), settings:settings(payload.settings) };
}
function parse(raw) {
  if (Buffer.byteLength(raw) > LIMIT) throw Error('存档超过 16 MB，无法导入。');
  let value; try {value = JSON.parse(raw);} catch (_) {throw Error('存档不是有效的 JSON 文件。');}
  return validate(value);
}
function snapshot() { return validate({format:FORMAT,version:1,pet:getPetInfo(),cache:getCache(),settings:settings(getSys())}); }
function atomicWrite(file, data) {
  const temp = file + '.' + randomUUID() + '.tmp';
  try {fs.writeFileSync(temp, data, {mode:0o600});fs.renameSync(temp,file);} finally {if(fs.existsSync(temp))fs.unlinkSync(temp);}
}
function write(file, data) { atomicWrite(file, JSON.stringify(data, null, 2) + '\n'); }
function applyPending(store, dir) {
  const pending = path.join(dir, 'pending-pet-import.json');
  if (!fs.existsSync(pending)) return false;
  let applied = false;
  try {
    const raw = fs.readFileSync(pending,'utf8'), data = parse(raw);
    const digest = createHash('sha256').update(raw).digest('hex');
    const current = store.ElectronStore.store;
    if (current.lastPetImportDigest !== digest) store.ElectronStore.store = {...current,lastPetImportDigest:digest,pet:data.pet,...(data.cache ? {cache:data.cache} : {}),sys:{...current.sys,...data.settings}};
    applied = true;
    try { fs.unlinkSync(pending); } catch (error) { console.error('存档已导入，待导入文件清理失败：',error.message); }
    return true;
  } catch (error) {
    if (!applied) fs.renameSync(pending, pending + '.rejected-' + Date.now());
    console.error('存档导入未应用，原存档保留：',error.message);
    return false;
  }
}
module.exports = {validate,parse,snapshot,write,applyPending,FORMAT,LIMIT};
