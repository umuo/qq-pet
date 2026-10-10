const DESTINATIONS = require('./data/travel.json');
const WORDS = ['元宝','照片','明信片','邮箱','农场','鱼塘','除草','除虫','浇水','庄稼熟了','可以收获','生日','春节','元旦','劳动节','国庆节','端午节','中秋节','早上','早安','早饭','中午','午饭','下午','晚上','晚饭','半夜','夜深','明天','今天'];
function facts(source, pet = {}) {
  const quoted = [...source.matchAll(/「([^」]+)」/g)].map(match => match[1]);
  const quantities = source.match(/(?:\d+(?:\.\d+)?\s*|[零一二三四五六七八九十百千万两半]+)(?:元宝|分钟|小时|块地|条鱼|封|张|个|座|次|年|天|%|级)/g) || [];
  return [...new Set([...quoted,...quantities,...WORDS,...DESTINATIONS.map(place=>place.name),pet.info?.host,pet.info?.name].filter(word=>word && source.includes(word)))];
}
function safeLine(source, line, protectedWords) {
  if (typeof line !== 'string' || !line.trim() || line.length > Math.min(320, source.length*2+20) || /[<>]/.test(line)) return source;
  const numbers = text => (text.match(/\d+(?:\.\d+)?/g)||[]).sort();
  if (JSON.stringify(numbers(source)) !== JSON.stringify(numbers(line)) || protectedWords.some(word=>!line.includes(word))) return source;
  if ([...WORDS,...DESTINATIONS.map(place=>place.name)].some(word=>line.includes(word)&&!source.includes(word))) return source;
  if ([...line.matchAll(/「([^」]+)」/g)].some(match=>!source.includes(match[1]))) return source;
  return line.trim();
}
class GameplaySpeech {
  constructor({enabled=()=>!!getSys('llmEnabled'),quiet=()=>!!getSys('doNotDisturb'),pet=()=>getPetInfo(),generate=(source,words,p)=>global.llmService?.rewriteGameplay(source,words,p),emit=payload=>openSpeak(payload),timeoutMs=1300}={}) {
    Object.assign(this,{enabled,quiet,pet,generate,emit,timeoutMs});this.pending=false;this.sequence=0;
  }
  async rewrite(source) {
    if (typeof source !== 'string' || !source || source.length>320 || !this.enabled() || this.pending) return source;
    this.pending=true;let timer;
    try {
      const pet=this.pet(), words=facts(source,pet);
      const result=await Promise.race([Promise.resolve().then(()=>this.generate(source,words,pet)),new Promise(resolve=>{timer=setTimeout(()=>resolve(null),this.timeoutMs);})]);
      return safeLine(source,result,words);
    } catch (_) {return source;} finally {clearTimeout(timer);this.pending=false;}
  }
  async say(payload) {
    const id=++this.sequence;
    if (this.quiet()) return;
    const before=this.pet(), owner=JSON.stringify([before.info?.birthDay,before.info?.name,before.info?.sex]);
    const text=await this.rewrite(payload.data?.data);
    const after=this.pet();
    if (id!==this.sequence || this.quiet() || owner!==JSON.stringify([after.info?.birthDay,after.info?.name,after.info?.sex])) return;
    this.emit({...payload,data:{...payload.data,data:text}});
  }
  cancel(){this.sequence++;}
}
let instance;function speech(){return instance ||= new GameplaySpeech();}
module.exports={GameplaySpeech,speech,facts,safeLine};
