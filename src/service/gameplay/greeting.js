// Launch greeting lines/periods adapted from qqpet pet/data/greet.ts (6e2c8bf, GPL-3.0).
const GREET = require('./data/greet.json');
const {Companion,companion} = require('./companion');
class Greeting {
  constructor(options={}) {this.companion=options.companion||new Companion(options);this.now=options.now||this.companion.now;this.random=options.random||Math.random;this.checking=false;}
  take(quiet=false) {
    if(this.checking)return null;this.checking=true;
    try {
      const {p,state}=this.companion.load(),now=this.now(),date=new Date(now);
      if(quiet || !this.companion.usable(p) || p.activeOption.ill || ['work','study','trip','desktopGame'].some(key=>p.activeOption[key]))return null;
      const period=[...GREET].reverse().find(([hour])=>date.getHours()>=hour);
      const key=`${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}:${period[0]}`;
      const previous=state.greetings||{seen:{},lastAt:0};
      if(previous.seen?.[key]!==undefined || now<previous.lastAt)return null;
      const line=period[1][Math.min(period[1].length-1,Math.max(0,Math.floor(this.random()*period[1].length)))];
      state.greetings={seen:Object.fromEntries(Object.entries(previous.seen||{}).filter(([,time])=>time>=now-7*86400000)),lastAt:now};
      state.greetings.seen[key]=now;
      this.companion.writePet({playroom:state});
      return {...line,tolk:line.tolk.replaceAll('[host]',p.info.host||'主人')};
    }finally{this.checking=false;}
  }
}
let instance;function greeting(){return instance ||= new Greeting({companion:companion()});}
module.exports={Greeting,greeting,GREET};
