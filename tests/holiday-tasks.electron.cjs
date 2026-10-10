const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'qq-pet-holiday-'));app.setPath('userData',path.join(temp,'userData'));app.on('window-all-closed',()=>{});global.initData={};global.$test=false;
const delay=ms=>new Promise(r=>setTimeout(r,ms));async function until(fn){for(let i=0;i<180;i++){if(await fn())return;await delay(100);}throw Error('Holiday UI timeout');}
const timeout=setTimeout(()=>app.exit(2),45000);
app.whenReady().then(async()=>{
 require('../src/ini/init');global.openSpeak=()=>{};
 setPetInfo({info:{name:'测试企鹅',host:'测试',sex:'GG',health:5,mood:100,yb:300,hunger:2000,clean:2000,strong:0},maxInfo:{level:10,hunger:4000,clean:4000,mood:1000}});
 setCache({name:'store',value:{...getCache('store'),toy:['_t0002-5']}});
 const {companion}=require('../src/service/gameplay/companion'),service=companion();let time=new Date(2026,9,1,12).getTime();service.now=()=>time;
 const room=require('../src/windows/popups/playroom/main');room.cleate();
 await until(()=>room.window&&room.window.webContents.executeJavaScript("document.querySelectorAll('.task-card').length===5"));let win=room.window;
 const selector='.task-card[data-task-id="HolidayToy"]';assert.match(await win.webContents.executeJavaScript(`document.querySelector(${JSON.stringify(selector)}).textContent`),/国庆节.*100 元宝.*物品礼包/s);
 async function click(selector){const point=await win.webContents.executeJavaScript(`(async()=>{const el=document.querySelector(${JSON.stringify(selector)});el.scrollIntoView({block:'center',behavior:'instant'});await new Promise(resolve=>setTimeout(resolve,200));const r=el.getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`);for(const type of ['mouseMove','mouseDown','mouseUp']){win.webContents.sendInputEvent({type,...point,button:'left',clickCount:1});await delay(80);}}
 for(let n=1;n<=5;n++){await click('.toy-use[data-id="_t0002"]');await until(()=>getPetInfo().playroom.daily.counts.Toy===n);}
 assert.equal(getCache('store').toy.length,0);assert.equal(getPetInfo().info.strong,10);
 await until(()=>win.webContents.executeJavaScript(`!document.querySelector(${JSON.stringify(selector+' button')}).disabled`));
 await click(selector+' button');await until(()=>getPetInfo().info.yb===400);
 const stored=JSON.parse(fs.readFileSync(path.join(app.getPath('userData'),'config-macos.json'),'utf8'));const task=stored.pet.playroom.daily.tasks.find(t=>t.id==='HolidayToy');assert.ok(task.claimed);assert.ok(stored.pet.playroom.holidayClaims['2026-10-01']);assert.equal(stored.pet.info.yb,400);
 for(const item of task.items)assert.ok(stored.cache.store[item.type].includes(`${item.id}-${item.count}`));
 assert.equal(service.claim('2026-10-01','HolidayToy').ok,false);
 const closed=new Promise(r=>win.once('closed',r));win.close();await closed;room.cleate();win=room.window;
 await until(()=>win.webContents.executeJavaScript(`document.querySelector(${JSON.stringify(selector+' button')})?.textContent==='已领取'`));
 time=new Date(2026,9,2,12).getTime();assert.equal(service.view().daily.tasks.length,4);time=new Date(2026,9,1,12).getTime();assert.ok(service.view().daily.tasks.find(t=>t.id==='HolidayToy').claimed);assert.equal(service.claim('2026-10-01','HolidayToy').ok,false);assert.equal(getPetInfo().info.yb,400);
 fs.writeFileSync(path.join(temp,'holiday.png'),(await win.webContents.capturePage()).toPNG());
 console.log('PASS native holiday task display, five toy clicks, atomic persisted currency/items/claim, reopen and date rollback. Screenshot:',path.join(temp,'holiday.png'));
 clearTimeout(timeout);BrowserWindow.getAllWindows().forEach(w=>w.destroy());app.quit();
}).catch(error=>{console.error(error);app.exit(1);});
