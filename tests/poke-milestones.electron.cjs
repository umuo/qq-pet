const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'qq-pet-poke-milestones-'));
app.setPath('userData',dir);app.on('window-all-closed',()=>{});global.initData={};global.$test=false;
process.on('uncaughtException',error=>{console.error(error);app.exit(1);});
const delay=ms=>new Promise(r=>setTimeout(r,ms));async function until(fn){for(let i=0;i<160;i++){if(await fn())return;await delay(100);}throw Error('Poke rewards UI timeout');}
const timer=setTimeout(()=>app.exit(2),40000);
app.whenReady().then(async()=>{
 require('../src/ini/init');global.openSpeak=()=>{};setPetInfo({info:{name:'互动企鹅',host:'测试',sex:'GG',health:5,yb:300,mood:400,hunger:2000,clean:2000,growth:40000},maxInfo:{level:20,hunger:4000,clean:4000}});
 setCache({name:'store',value:{food:[],commodity:[],toy:[]}});
 const {companion}=require('../src/service/gameplay/companion'),service=companion();let now=new Date(2026,9,10,12).getTime();service.now=()=>now;service.random=()=>0.5;
 // Exercise the production success path; this does not simulate 25 visual hotspot animations.
 for(let i=0;i<25;i++)assert.ok(service.poke());const before=service.view(),rewards=before.pokeMilestones.flatMap(t=>t.items);
 const room=require('../src/windows/popups/playroom/main');room.cleate();let win=room.window;
 await until(()=>win.webContents.executeJavaScript("document.querySelectorAll('.poke-milestones .milestone-card').length===5"));
 async function click(target){const point=await win.webContents.executeJavaScript(`(async()=>{const el=document.querySelector('[data-poke-target="${target}"] button');el.scrollIntoView({block:'center',behavior:'instant'});await new Promise(r=>setTimeout(r,150));const b=el.getBoundingClientRect();return {x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)}})()`);for(const type of ['mouseMove','mouseDown','mouseUp']){win.webContents.sendInputEvent({type,...point,button:'left',clickCount:1});await delay(80);}}
 for(const target of [5,10,15,20,25]){await click(target);await until(()=>service.view().pokeMilestones.find(t=>t.target===target).claimed);}
 assert.equal(getPetInfo().info.yb,300);for(const item of rewards){const entry=getCache('store')[item.type].find(v=>v.split('-')[0]===item.id);assert.ok(Number(entry.split('-')[1])>=item.count);}
 assert.equal(await win.webContents.executeJavaScript("document.querySelectorAll('.poke-milestones button:disabled').length"),5);
 const frozen=JSON.stringify(getCache('store'));assert.equal(service.claimPokeMilestone(before.daily.day,5).ok,false);assert.equal(JSON.stringify(getCache('store')),frozen);
 const saved=$Store.getItem('pet');assert.ok(saved.playroom.pokeMilestoneClaims[before.daily.day][25]);assert.deepEqual($Store.getItem('cache').store,getCache('store'));
 const {parse}=require('../src/service/gameplay/save');assert.ok(parse(JSON.stringify({pet:saved,cache:$Store.getItem('cache')})).pet.playroom.daily.pokeMilestones.every(t=>t.claimed));
 fs.writeFileSync(path.join(dir,'claimed.png'),(await win.webContents.capturePage()).toPNG());
 win.close();await until(()=>room.window===null);room.cleate();win=room.window;await until(()=>win.webContents.executeJavaScript("document.querySelectorAll('.poke-milestones button:disabled').length===5"));
 assert.deepEqual(service.view().pokeMilestones.map(t=>t.items),before.pokeMilestones.map(t=>t.items));
 now=new Date(2026,9,11,6).getTime();service.view();win.close();await until(()=>room.window===null);room.cleate();win=room.window;
 await until(()=>win.webContents.executeJavaScript("document.querySelectorAll('.poke-milestones button:disabled').length===5"));assert.ok(service.view().pokeMilestones.every(t=>!t.claimed&&t.done===0));assert.equal(JSON.stringify(getCache('store')),frozen);
 now=new Date(2026,9,10,12).getTime();service.view();win.close();await until(()=>room.window===null);room.cleate();await until(()=>room.window);win=room.window;
 await until(()=>win.webContents.executeJavaScript("document.querySelectorAll('.poke-milestones button:disabled').length===5"));assert.ok(service.view().pokeMilestones.every(t=>t.claimed&&t.done===25));assert.deepEqual(service.view().pokeMilestones.map(t=>t.items),before.pokeMilestones.map(t=>t.items));assert.equal(JSON.stringify(getCache('store')),frozen);assert.ok($Store.getItem('pet').playroom.dailyHistory['2026-10-10']);
 console.log('PASS production poke counting, five native reward buttons, saved inventory/ledger, duplicate/reopen/frozen rewards, 06:00 reset and restored previous-day UI:',dir);
 clearTimeout(timer);for(const w of BrowserWindow.getAllWindows())w.destroy();app.quit();
}).catch(error=>{console.error(error,'fixture:',dir);app.exit(1);});
