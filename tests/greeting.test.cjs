const test=require('node:test'),assert=require('node:assert/strict');
const {Greeting}=require('../src/service/gameplay/greeting');
function harness(hour=5) {
  let now=new Date(2026,9,9,hour).getTime(),pet={info:{name:'企鹅',host:'主人',health:5,mood:800,yb:300},maxInfo:{level:10,hunger:3000,clean:3000},activeOption:{},playroom:{version:1,travel:{photos:[{id:'u_alipay'}]}}};
  const options={readPet:()=>pet,writePet:patch=>pet={...pet,...patch},now:()=>now,random:()=>0};
  return {g:new Greeting(options),pet:()=>pet,setHour:hour=>now=new Date(2026,9,9,hour).getTime(),setDate:day=>now=new Date(2026,9,day,5).getTime(),reload:()=>new Greeting(options)};
}
test('all six local periods and exact boundaries select offline lines with owner/reply',()=>{
  for(const [hour,word] of [[0,'晚'],[4,'晚'],[5,'早上好'],[10,'早上好'],[11,'中午好'],[13,'中午好'],[14,'下午好'],[17,'下午好'],[18,'晚上好'],[22,'晚上好'],[23,'半夜']]) {
    const h=harness(hour),line=h.g.take();assert.ok(line.tolk.includes(word),`${hour}: ${line.tolk}`);assert.ok(line.tolk.includes('主人'));assert.ok(line.submitText);assert.ok(!line.tolk.includes('[host]'));
  }
});
test('same date/period is once across restarts, next period/day works, clock rollback does not reannounce',()=>{
  const h=harness();assert.ok(h.g.take());assert.equal(h.g.take(),null);assert.equal(h.reload().take(),null);
  h.setHour(11);assert.ok(h.g.take());h.setHour(5);assert.equal(h.g.take(),null);h.setDate(10);assert.ok(h.g.take());h.setDate(9);assert.equal(h.g.take(),null);
  assert.equal(h.pet().info.yb,300);assert.equal(h.pet().playroom.travel.photos[0].id,'u_alipay');
});
test('DND, busy, illness, death and paused growth do not consume a greeting',()=>{
  const h=harness();assert.equal(h.g.take(true),null);assert.ok(!h.pet().playroom.greetings);
  for(const key of ['work','study','trip','desktopGame','ill']) {h.pet().activeOption[key]={};assert.equal(h.g.take(),null);h.pet().activeOption[key]=null;}
  h.pet().info.health=1;assert.equal(h.g.take(),null);h.pet().info.health=5;h.pet().maxInfo.stopGrowth=true;assert.equal(h.g.take(),null);h.pet().maxInfo.stopGrowth=false;assert.ok(h.g.take());
});
