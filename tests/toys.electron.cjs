const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'qq-pet-toys-'));app.setPath('userData',path.join(temp,'userData'));app.on('window-all-closed',()=>{});global.initData={};global.$test=false;
const delay=ms=>new Promise(r=>setTimeout(r,ms));async function until(fn){for(let i=0;i<180;i++){if(await fn())return;await delay(100);}throw Error('Toy UI timeout');}
const timeout=setTimeout(()=>app.exit(2),45000);
app.whenReady().then(async()=>{
  require('../src/ini/init');const speaks=[],tip=require('../src/windows/popups/tip/main');
  global.openSpeak=payload=>{speaks.push(payload);if(tip.show)tip.setMsg({data:payload.data});else tip.cleate({position:[400,450],maxSize:[180,180],data:payload.data});};
  setPetInfo({info:{name:'测试企鹅',host:'测试',sex:'GG',health:5,mood:850,yb:1000,hunger:2000,clean:2000,growth:30000,strong:0,charm:0,intel:0},maxInfo:{level:10,hunger:4000,clean:4000,mood:1000,growthRate:260}});
  const {dayKey}=require('../src/service/gameplay/companion');
  setPetInfo({playroom:{version:1,daily:{day:dayKey(Date.now()),counts:{},tasks:[{id:'Toy',label:'陪我玩玩具',target:1,reward:50,claimed:false}],gameMinutes:0}}});
  const room=require('../src/windows/popups/playroom/main');room.cleate();
  await until(()=>room.window&&room.window.webContents.executeJavaScript("document.querySelectorAll('.toy-card').length===8"));const win=room.window;
  await until(()=>win.webContents.executeJavaScript("Array.from(document.querySelectorAll('.toy-card img')).every(img=>img.complete&&img.naturalWidth>0)"));
  async function click(selector){const point=await win.webContents.executeJavaScript(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.scrollIntoView({block:'center'});const r=el.getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`);for(const type of ['mouseMove','mouseDown','mouseUp']){win.webContents.sendInputEvent({type,...point,button:'left',clickCount:1});await delay(80);}}
  await click('.toy-buy[data-id="_t0002"]');await until(()=>Number(getPetInfo().info.yb)===980);assert.equal(getCache('store').toy[0],'_t0002-1');
  await click('.toy-use[data-id="_t0002"]');await until(()=>getPetInfo().info.mood===900);assert.equal(getPetInfo().info.strong,2);assert.equal(getCache('store').toy.length,0);assert.equal(getPetInfo().playroom.daily.counts.Toy,1);
  await until(()=>tip.window&&tip.window.webContents.executeJavaScript("document.querySelector('.t_m_center.text')?.textContent.includes('棒球')"));assert.equal(speaks.at(-1).active,'speak');
  const stored=JSON.parse(fs.readFileSync(path.join(app.getPath('userData'),'config-macos.json'),'utf8'));assert.equal(stored.pet.info.strong,2);assert.equal(stored.pet.playroom.daily.counts.Toy,1);assert.equal(stored.cache.store.toy.length,0);
  await click('.task-card button');await until(()=>getPetInfo().info.yb===1030);assert.ok(getPetInfo().playroom.daily.tasks[0].claimed);
  const closed=new Promise(r=>win.once('closed',r));win.close();await closed;room.cleate();await until(()=>room.window&&room.window.webContents.executeJavaScript("document.querySelectorAll('.toy-card').length===8"));
  assert.ok(await room.window.webContents.executeJavaScript("document.querySelector('.toy-use[data-id=\"_t0002\"]').disabled"));
  // Verify a toy can arrive through the actual mailbox reward path.
  const {mailbox}=require('../src/service/gameplay/mail');mailbox().drawItems=()=>[{id:'_t0005',type:'toy',name:'黑色笔记本',count:1}];mailbox().deliver();assert.equal(mailbox().claim('welcome').ok,true);assert.ok(getCache('store').toy.includes('_t0005-1'));
  const {toys}=require('../src/service/gameplay/toys');assert.equal(toys().use('_t0005').ok,true);assert.equal(getPetInfo().playroom.toys.active.left,60);
  const {GrowUp}=require('../src/windows/util/pet/GrowUp');const grow=Object.create(GrowUp.prototype);grow.growTime=60000;grow.callBackState=()=>{};
  const base=getPetInfo().info.growth,baseMinute=Math.trunc(getPetInfo().maxInfo.growthRate/60*100)/100;grow.GrowUpMain();assert.equal(getPetInfo().playroom.toys.active.left,59);assert.ok(Math.abs(getPetInfo().info.growth-base-baseMinute-10/60)<0.00001);
  setPetInfo({maxInfo:{stopGrowth:true}});grow.GrowUpMain();assert.equal(getPetInfo().playroom.toys.active.left,59);setPetInfo({maxInfo:{stopGrowth:false}});
  const save=require('../src/service/gameplay/save'),exported=save.snapshot(),roundTrip=save.parse(JSON.stringify(exported));assert.equal(roundTrip.pet.playroom.toys.active.left,59);assert.deepEqual(roundTrip.cache.store.toy,getCache('store').toy);assert.equal(roundTrip.pet.playroom.daily.counts.Toy,2);
  fs.writeFileSync(path.join(temp,'toys.png'),(await room.window.webContents.capturePage()).toPNG());
  console.log('PASS native toy images/buy/use, persisted stats/inventory/task claim, speak bubble, reopen, toy mail reward and actual GrowUp timed bonus/pause. Screenshot:',path.join(temp,'toys.png'));
  clearTimeout(timeout);BrowserWindow.getAllWindows().forEach(win=>win.destroy());app.quit();
}).catch(error=>{console.error(error);app.exit(1);});
