const test=require('node:test'),assert=require('node:assert/strict');
const {Mailbox,birthday,holidays}=require('../src/service/gameplay/mail');
function harness(date,born='2020-10-01 08') {
  let now=new Date(date+'T12:00:00').getTime(),pet={info:{name:'企鹅',host:'主人',birthDay:born,yb:40,health:5,mood:800},maxInfo:{level:10,mood:1000,hunger:3000,clean:3000},activeOption:{},playroom:{version:1,travel:{photos:[{id:'photo'}]},farm:{user:{wealth:'220'}}}};
  const writes=[];const options={readPet:()=>pet,writePet:patch=>{writes.push(JSON.parse(JSON.stringify(patch)));pet={...pet,...patch,info:{...pet.info,...patch.info}};},now:()=>now,random:()=>0};
  return {mail:new Mailbox(options),pet:()=>pet,writes,options,setDate:date=>{now=new Date(date+'T12:00:00').getTime();}};
}
test('birthday and fixed festival arrive together; reload/repeated delivery and claims grant once atomically',()=>{
  const h=harness('2026-10-01');assert.equal(h.mail.deliver().sent,3);assert.equal(h.writes.length,1);
  assert.equal(h.mail.view().unread,3);assert.equal(h.pet().info.yb,40);assert.equal(h.mail.deliver(),null);
  const reloaded=new Mailbox(h.options);assert.equal(reloaded.deliver(),null);
  assert.equal(reloaded.claim('birthday-2026').ok,true);assert.equal(h.pet().info.yb,340);
  const last=h.writes.at(-1);assert.equal(last.playroom.mail.letters.find(l=>l.id==='birthday-2026').claimed,true);assert.equal(last.info.yb,340);
  assert.equal(reloaded.claim('birthday-2026').ok,false);assert.equal(h.pet().info.yb,340);
  assert.equal(h.pet().playroom.travel.photos[0].id,'photo');assert.equal(h.pet().playroom.farm.user.wealth,'220');
  h.setDate('2026-11-01');assert.equal(reloaded.deliver(),null,'matching day alone is not a birthday');
  h.setDate('2027-10-01');assert.equal(reloaded.deliver().sent,2);
  h.setDate('2026-10-01');assert.equal(reloaded.deliver(),null,'clock reversal cannot redeliver the same year');
});
test('leap-day birthdates, invalid data, Unix seconds/milliseconds and original local format are parsed explicitly',()=>{
  assert.equal(birthday('2024-02-29 08').getDate(),29);assert.equal(birthday('2025-02-29'),null);assert.equal(birthday('garbage'),null);
  const date=new Date(2020,9,1,8);assert.equal(birthday(date.getTime()).getMonth(),9);assert.equal(birthday(date.getTime()/1000).getMonth(),9);
  const h=harness('2027-02-28','2024-02-29 08');h.mail.deliver();assert.equal(h.mail.view().letters.some(l=>l.id.startsWith('birthday')),false);
  h.setDate('2028-02-29');assert.equal(h.mail.deliver().sent,1);
});
test('lunar festivals are calculated offline, welcome and sent records survive removed letters',()=>{
  assert.deepEqual(holidays(new Date(2026,1,17,12)),['春节']);assert.deepEqual(holidays(new Date(2026,5,19,12)),['端午节']);assert.deepEqual(holidays(new Date(2026,8,25,12)),['中秋节']);
  const h=harness('2026-10-09','invalid');assert.equal(h.mail.deliver().sent,1);
  h.pet().playroom.mail.letters=[];assert.equal(h.mail.deliver(),null);
  assert.equal(h.mail.claim('missing').ok,false);
});
