// Holiday/birthday mailbox rules inspired by qqpet pet/mail.ts (6e2c8bf).
const { Companion, companion } = require('./companion');
const {drawItems,addItems}=require('./loot');
function birthday(value) {
  if (typeof value === 'string') {
    const match=value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s|T|$)/);
    if(match){const [,y,m,d]=match.map(Number),date=new Date(y,m-1,d);return date.getFullYear()===y&&date.getMonth()===m-1&&date.getDate()===d?date:null;}
  }
  const number=Number(value);
  if(!Number.isFinite(number)||number<=0)return null;
  const date=new Date(number<1e11?number*1000:number);
  return Number.isNaN(date.getTime())?null:date;
}
const {holidays}=require('./calendar');

class Mailbox {
  constructor(options={}) { this.companion=options.companion||new Companion(options);this.now=options.now||this.companion.now;this.holidays=options.holidays||holidays;this.drawItems=options.drawItems||((count)=>drawItems(count,this.companion.random));this.readCache=options.readCache||(()=>typeof global.getCache==='function'?getCache():{store:{}});this.delivering=false; }
  load() {
    const data=this.companion.load();
    data.state.mail={letters:[],sent:{},...data.state.mail};
    return data;
  }
  deliver() {
    if(this.delivering)return null;
    this.delivering=true;
    try {
      const {p,state}=this.load();const now=this.now(),date=new Date(now),year=date.getFullYear(),due=[];
      if(!state.mail.sent.welcome)due.push({id:'welcome',title:'欢迎来到企鹅的小日子',text:'谢谢你陪着我。一起摸摸头、玩游戏、出门看看吧~',reward:100});
      const born=birthday(p.info.birthDay),age=born?year-born.getFullYear():0;
      if(age>0 && born.getMonth()===date.getMonth() && born.getDate()===date.getDate())due.push({id:`birthday-${year}`,title:`${p.info.name||'企鹅'}的${age}周岁生日快乐！`,text:'今天是我的生日，谢谢你一直陪着我！这份生日礼物，留给我们下一段快乐的日子。',reward:300});
      for(const name of this.holidays(date))due.push({id:`holiday-${year}-${name}`,title:`${name}快乐！`,text:`${p.info.host||'主人'}，${name}快乐！给你寄来一份小礼物，今天也一起开心地过吧~`,reward:200});
      let sent=0;
      for(const letter of due) {
        if(state.mail.sent[letter.id] || state.mail.letters.some(l=>l.id===letter.id))continue;
        const items=this.drawItems(letter.id==='welcome'?1:2);
        state.mail.sent[letter.id]=now;state.mail.letters.unshift({...letter,items,sentAt:now,read:false,claimed:false});sent++;
      }
      if(sent)this.companion.writePet({playroom:state});
      return sent?{message:`邮箱里有${sent}封新信，来看看企鹅寄给你的礼物吧~`,sent}:null;
    }finally{this.delivering=false;}
  }
  read(id) {const {state}=this.load(),letter=state.mail.letters.find(l=>l.id===id);if(!letter||letter.read)return false;letter.read=true;this.companion.writePet({playroom:state});return true;}
  claim(id) {
    const {p,state}=this.load(),letter=state.mail.letters.find(l=>l.id===id);
    if(!letter||letter.claimed || !Number.isSafeInteger(letter.reward) || letter.reward<0)return {ok:false,message:'这份礼物已经收好，或信件不存在啦~'};
    if((letter.items!==undefined && !Array.isArray(letter.items)) || !Number.isSafeInteger(Number(p.info.yb)+letter.reward) || Number(p.info.yb)<0)return {ok:false,message:'礼物或元宝数据异常，先检查存档再领取吧~'};
    let inventory;
    try {inventory=letter.items?.length?addItems(this.readCache(),letter.items):null;} catch(_){return {ok:false,message:'礼物或背包数据异常，先检查存档再领取吧~'};}
    letter.claimed=true;letter.read=true;
    this.companion.writePet({playroom:state,info:{yb:(+p.info.yb||0)+letter.reward},...(inventory?{inventory}:{})});
    const items=(letter.items||[]).map(item=>`「${item.name}」×${item.count}`).join('、');
    return {ok:true,message:`收下「${letter.title}」的礼物，获得 ${letter.reward} 元宝${items?'和'+items:''}。`};
  }
  view() {const {state}=this.load();return {...state.mail,unread:state.mail.letters.filter(l=>!l.read).length};}
}
let instance;
function mailbox(){return instance ||= new Mailbox({companion:companion()});}
module.exports={Mailbox,mailbox,birthday,holidays};
