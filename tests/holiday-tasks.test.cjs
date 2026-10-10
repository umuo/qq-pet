const test=require('node:test'),assert=require('node:assert/strict');
const {Companion}=require('../src/service/gameplay/companion');
const {holidays}=require('../src/service/gameplay/calendar');
function harness(){
 let time=new Date(2026,9,1,12).getTime(),cache={store:{}},pet={info:{yb:300,health:5,hunger:100,clean:100,mood:100},maxInfo:{level:10,hunger:3000,clean:3000},activeOption:{}};
 const writes=[];let draws=0;
 const service=new Companion({readPet:()=>pet,readCache:()=>cache,writePet:p=>{writes.push(p);pet={...pet,...p,info:{...pet.info,...p.info}};if(p.inventory)cache=p.inventory;},now:()=>time,random:()=>{draws++;return 0;}});
 return {service,writes,pet:()=>pet,cache:()=>cache,draws:()=>draws,at:(d,h=12,m=0)=>time=new Date(2026,9,d,h,m).getTime()};
}
test('holiday adds one frozen gift task to four normal tasks and upgrades an existing day',()=>{
 const h=harness(),first=h.service.view();assert.equal(first.daily.tasks.length,5);
 const task=first.daily.tasks.find(t=>t.id==='HolidayToy');assert.equal(task.target,5);assert.equal(task.reward,100);assert.equal(task.items.reduce((n,i)=>n+i.count,0),2);assert.match(task.label,/国庆节/);
 const draws=h.draws();h.service.view();assert.equal(h.draws(),draws);assert.deepEqual(h.service.view().daily.tasks.find(t=>t.id==='HolidayToy').items,task.items);
 h.pet().playroom.daily.tasks=h.pet().playroom.daily.tasks.filter(t=>t.id!=='HolidayToy');assert.equal(h.service.view().daily.tasks.length,5);assert.equal(h.service.view().daily.tasks.length,5);
});
test('06:00 boundary keeps holiday task until next morning; calendar is shared with mail',()=>{
 const h=harness();h.at(1,5,59);assert.equal(h.service.view().daily.tasks.length,4);
 h.at(1,6);assert.equal(h.service.view().daily.tasks.length,5);
 h.at(2,5,59);assert.equal(h.service.view().daily.day,'2026-10-01');assert.equal(h.service.view().daily.tasks.length,5);
 h.at(2,6);assert.equal(h.service.view().daily.tasks.length,4);
 assert.equal(require('../src/service/gameplay/mail').holidays,holidays);
 for(const [m,d,label] of [[0,1,'元旦'],[4,1,'劳动节'],[9,1,'国庆节'],[1,17,'春节'],[5,19,'端午节'],[8,25,'中秋节']])assert.ok(holidays(new Date(2026,m,d,12)).includes(label));
});
test('toy counter unlocks atomic currency/inventory claim; reload and clock rollback cannot pay twice',()=>{
 const h=harness(),day=h.service.view().daily.day;assert.equal(h.service.claim(day,'HolidayToy').ok,false);
 h.service.record('Toy',4);assert.equal(h.service.claim(day,'HolidayToy').ok,false);h.service.record('Toy');
 assert.equal(h.service.claim(day,'HolidayToy').ok,true);const patch=h.writes.at(-1);assert.equal(patch.info.yb,400);assert.ok(patch.playroom.holidayClaims[day]);assert.ok(patch.inventory);assert.deepEqual(h.cache(),patch.inventory);
 const writes=h.writes.length;assert.equal(h.service.claim(day,'HolidayToy').ok,false);assert.equal(h.writes.length,writes);
 const reload=new Companion({readPet:()=>h.pet(),writePet:()=>assert.fail('duplicate write'),now:()=>new Date(2026,9,1,12).getTime()});assert.equal(reload.claim(day,'HolidayToy').ok,false);
 h.at(2);h.service.view();h.at(1);assert.ok(h.service.view().daily.tasks.find(t=>t.id==='HolidayToy').claimed);h.service.record('Toy',5);assert.equal(h.service.claim(day,'HolidayToy').ok,false);assert.equal(h.pet().info.yb,400);
});
test('invalid gift and currency data cannot mark claimed or change inventory',()=>{
 for(const corrupt of [t=>t.items={},t=>t.items=[{id:'missing',count:1}],t=>t.reward=Infinity]){
  const h=harness(),day=h.service.view().daily.day;h.service.record('Toy',5);corrupt(h.pet().playroom.daily.tasks.find(t=>t.id==='HolidayToy'));
  const writes=h.writes.length;assert.equal(h.service.claim(day,'HolidayToy').ok,false);assert.equal(h.writes.length,writes);assert.equal(h.pet().info.yb,300);assert.ok(!h.pet().playroom.holidayClaims?.[day]);
 }
});
