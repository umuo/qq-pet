// Real settings export/import, followed by a separate process running main.js.
// File chooser/confirmation/relaunch are controlled; offline elapsed time is
// represented by the imported timestamp, not by waiting a whole hour.
const {app,BrowserWindow,dialog,clipboard}=require('electron');
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawn}=require('node:child_process');
const restore=process.argv[2]==='restore',root=restore?process.argv[3]:fs.mkdtempSync(path.join(os.tmpdir(),'qq-pet-travel-save-')),dir=path.join(root,'userData');
const mode=process.env.QQPET_TRAVEL_SAVE_MODE||'normal';assert.ok(['normal','paused','ill'].includes(mode));
app.setPath('userData',dir);app.on('window-all-closed',()=>{});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));async function until(fn){for(let i=0;i<400;i++){if(await fn())return;await delay(100);}throw Error('Travel save timeout');}
const realExit=app.exit.bind(app);const timeout=setTimeout(()=>realExit(2),110000);
async function click(win,selector){app.focus({steal:true});win.focus();await delay(150);const point=await win.webContents.executeJavaScript(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)throw Error('Missing target');el.scrollIntoView();const r=el.getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`);for(const type of ['mouseMove','mouseDown','mouseUp']){win.webContents.sendInputEvent({type,...point,button:'left',clickCount:1});await delay(80);}}
if(restore){
 for(const name of ['readText','readHTML','readImage'])clipboard[name]=()=>{throw Error('Unexpected clipboard read');};
 const Factory=require('../src/windows/window'),open=Factory.prototype.open;Factory.prototype.open=function(option){option.default.webPreferences={...option.default.webPreferences,offscreen:true,backgroundThrottling:false};return open.call(this,option);};
 require('../main');
}
app.whenReady().then(async()=>{
 if(!restore){
  global.initData={};global.$test=false;require('../src/ini/init');global.openSpeak=()=>{};require('../src/service/model/user').getLogs=async()=>null;
  setSys({name:'doNotDisturb',value:true});setSys({name:'clip',value:false});setSys({name:'llmEnabled',value:false});setSys({name:'apiKey',value:'retained-local-secret'});
  setPetInfo({info:{name:'旅行存档企鹅',host:'测试',sex:'GG',birthDay:'2020-01-02 08',growth:30000,health:5,hunger:3000,clean:3000,mood:800,yb:300,lastLoginTime:Date.now()+3600000},maxInfo:{level:10,hunger:4000,clean:4000},activeOption:{trip:null,ill:null}});
  const {travel}=require('../src/service/gameplay/travel');travel().random=()=>0;
  const photo={id:'u_alipay',city:'北京市',sentAt:Date.now()-86400000,buddy:false};
  setPetInfo({playroom:{version:1,travel:{visits:{北京市:1},photos:[photo],postcards:[],souvenirs:[],session:null,sequence:0}}});
  const ui=require('../src/windows/popups/travel/main');ui.cleate();await until(()=>ui.window&&ui.window.webContents.executeJavaScript("!!document.getElementById('app').__vue_app__?._instance?.proxy?.state"));
  await click(ui.window,'.start-travel');await until(()=>!!getPetInfo().activeOption.trip);assert.equal(getPetInfo().playroom.travel.session.place,'北京市');
  if(mode==='paused'){setPetInfo({maxInfo:{stopGrowth:true}});travel().tick();assert.equal(getPetInfo().playroom.travel.session.running,false);}
  const out=path.join(root,'export.json'),incoming=path.join(root,'incoming.json');let relaunch=false,exit=false;const importErrors=[];let confirmations=0;
  dialog.showSaveDialog=async()=>({canceled:false,filePath:out});dialog.showOpenDialog=async()=>({canceled:false,filePaths:[incoming]});dialog.showMessageBox=async(_win,options)=>{if(options.type==='error'){importErrors.push(options.message);return {response:0};}confirmations++;return {response:1};};
  app.relaunch=()=>{relaunch=true;};app.exit=()=>{exit=true;};
  const setup=require('../src/windows/popups/setup/main');setup.cleate();await until(()=>setup.window&&setup.window.webContents.executeJavaScript("document.body.textContent.includes('导出宠物存档')"));
  async function settingsClick(label){const selector=await setup.window.webContents.executeJavaScript(`(()=>{const rows=Array.from(document.querySelectorAll('.childrenIn'));const el=rows.find(el=>el.textContent.includes(${JSON.stringify(label)}));el.dataset.travelSaveTarget='true';return '[data-travel-save-target] .sliderButs_submit';})()`);await click(setup.window,selector);await setup.window.webContents.executeJavaScript("document.querySelector('[data-travel-save-target]').removeAttribute('data-travel-save-target')");}
  await settingsClick('导出宠物存档');await until(()=>fs.existsSync(out));const data=JSON.parse(fs.readFileSync(out,'utf8'));
  assert.equal(data.pet.activeOption.trip.managedTravel,true);assert.equal(data.pet.activeOption.trip.id,data.pet.playroom.travel.session.id);assert.deepEqual(data.pet.playroom.travel.photos,[photo]);assert.equal(data.pet.playroom.travel.postcards.length,0);
  // Malformed imports must show errors before confirmation, backup or restart.
  const beforeInvalid=JSON.parse(JSON.stringify(getPetInfo()));
  const invalidStory=JSON.parse(JSON.stringify(data));delete invalidStory.pet.playroom.travel.session.story;
  const invalidPhoto=JSON.parse(JSON.stringify(data));invalidPhoto.pet.playroom.travel.photos.push({id:'unknown_photo'});
  for(const [index,invalid] of [invalidStory,invalidPhoto,'broken-json'].entries()){
   fs.writeFileSync(incoming,typeof invalid==='string'?invalid:JSON.stringify(invalid));await settingsClick('导入宠物存档');await until(()=>importErrors.length===index+1);
   assert.equal(confirmations,0);assert.equal(relaunch,false);assert.equal(exit,false);assert.equal(fs.existsSync(path.join(dir,'pending-pet-import.json')),false);assert.equal(fs.existsSync(path.join(dir,'pet-backups')),false);assert.deepEqual(getPetInfo(),beforeInvalid);
  }
  assert.match(importErrors[0],/旅行进度/);assert.match(importErrors[1],/相簿照片/);assert.match(importErrors[2],/JSON/);console.log('PASS native invalid import errors preserve live state, skip confirmation/backup/relaunch and recover for valid import');
  // Simulate elapsed offline time in the saved trip, keeping its frozen story.
  data.pet.playroom.travel.session.lastTick=Date.now()-data.pet.playroom.travel.session.remainingMs-1000;
  if(mode==='ill'){data.pet.activeOption.ill={type:'ill',value:'hungry',health:2};data.pet.info.health=2;}
  fs.writeFileSync(incoming,JSON.stringify(data));await settingsClick('导入宠物存档');await until(()=>exit);assert.equal(relaunch,true);assert.equal(confirmations,1);assert.ok(getPetInfo().activeOption.trip,'old live pet was not replaced');
  assert.equal(fs.readdirSync(path.join(dir,'pet-backups')).length,1);
  BrowserWindow.getAllWindows().forEach(win=>win.destroy());
  await new Promise((resolve,reject)=>{const child=spawn(process.execPath,[__filename,'restore',root],{stdio:['ignore','pipe','pipe']});let log='';child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);child.on('error',reject);child.on('exit',code=>{console.log(log);code===0?resolve():reject(Error('Travel restore exited '+code));});});
  clearTimeout(timeout);console.log('PASS native trip settings export/import, backup and real main startup:',mode,root);realExit(0);return;
 }
 const main=require('../src/windows/main/main');
 if(mode!=='normal'){
  await until(()=>main.window&&global.petControl&&getPetInfo().playroom?.travel?.lastStatus===(mode==='paused'?'started':'cancelled'));
  const {travel}=require('../src/service/gameplay/travel'),before=JSON.parse(fs.readFileSync(path.join(root,'incoming.json'),'utf8')).pet.playroom.travel;
  assert.equal(fs.existsSync(path.join(dir,'pending-pet-import.json')),false);
  const ui=require('../src/windows/popups/travel/main');ui.cleate();await until(()=>ui.window&&ui.window.webContents.executeJavaScript("!!document.getElementById('app').__vue_app__?._instance?.proxy?.state"));
  if(mode==='paused'){
   assert.equal(getPetInfo().playroom.travel.session.running,false);assert.equal(getPetInfo().playroom.travel.session.remainingMs,before.session.remainingMs);
   for(let i=0;i<3;i++){await delay(250);travel().tick();}
   assert.equal(getPetInfo().playroom.travel.session.remainingMs,before.session.remainingMs);
   assert.ok(await ui.window.webContents.executeJavaScript("document.body.textContent.includes('暂停')"));
   // Resume using the real right-click menu; do not advance the travel clock.
   await until(()=>main.window.webContents.executeJavaScript("!!document.getElementById('app').__vue_app__?._instance?.proxy?.swfPet?.swf"));
   for(const type of ['mouseDown','mouseUp']){main.window.webContents.sendInputEvent({type,x:90,y:90,button:'right',clickCount:1});await delay(100);}
   const menu=require('../src/windows/popups/rightMenu/main');await until(()=>menu.window&&menu.window.webContents.executeJavaScript("!!document.querySelector('.center[fv=\"openGrowth\"]')"));
   await click(menu.window,'.center[fv="openGrowth"]');await until(()=>getPetInfo().maxInfo.stopGrowth===false&&getPetInfo().playroom.travel.session.running===true);
   const left=getPetInfo().playroom.travel.session.remainingMs;assert.ok(left<=before.session.remainingMs&&left>before.session.remainingMs-3000,'resume must not count paused offline time');
   // The ordinary menu must stop a managed trip via Travel, not legacy ticks.
   for(const type of ['mouseDown','mouseUp']){main.window.webContents.sendInputEvent({type,x:90,y:90,button:'right',clickCount:1});await delay(100);}
   await until(()=>menu.window&&menu.window.webContents.executeJavaScript("!!document.querySelector('.center[fv=\"stopState\"]')"));
   await click(menu.window,'.center[fv="stopState"]');await until(()=>getPetInfo().playroom.travel.session===null);assert.equal(getPetInfo().activeOption.trip,null);
   await click(ui.window,'.start-travel');await until(()=>!!getPetInfo().activeOption.trip);
   const stateUI=require('../src/windows/popups/stateInfo/main');stateUI.cleate({nowPosition:[600,600]});
   await until(()=>stateUI.window&&stateUI.window.webContents.executeJavaScript("!!document.getElementById('app').__vue_app__?._instance?.proxy?.canStopState"));
   await click(stateUI.window,'.onceInfoLine:last-child .getOnlineGift');await until(()=>getPetInfo().playroom.travel.session===null);assert.equal(getPetInfo().activeOption.trip,null);

  }else{
   assert.equal(getPetInfo().activeOption.trip,null);assert.equal(getPetInfo().playroom.travel.session,null);assert.ok(getPetInfo().activeOption.ill);
   assert.ok(await ui.window.webContents.executeJavaScript("document.querySelector('.start-travel').disabled"));
  }
  for(let i=0;i<3;i++)travel().tick();
  const p=getPetInfo();assert.deepEqual(p.playroom.travel.visits,before.visits);assert.deepEqual(p.playroom.travel.photos,before.photos);assert.equal(p.playroom.travel.postcards.length,0);assert.equal(p.playroom.travel.souvenirs.length,0);assert.equal(p.info.yb,300);
  const stored=JSON.parse(fs.readFileSync(path.join(dir,'config-macos.json'),'utf8'));assert.equal(stored.pet.playroom.travel.session,null);assert.equal(stored.pet.activeOption.trip,null);assert.equal(stored.pet.info.yb,300);
  fs.writeFileSync(path.join(root,mode+'-restored.png'),(await ui.window.webContents.capturePage()).toPNG());
  console.log('PASS actual main trip import',mode,'offline pause/resume or illness cancellation, native travel UI, no visits/photos/rewards and durable cleanup');clearTimeout(timeout);realExit(0);return;
 }
 await until(()=>main.window&&getPetInfo().playroom?.travel?.session===null&&getPetInfo().playroom.travel.postcards.length===1);
 const {travel}=require('../src/service/gameplay/travel'),p=getPetInfo(),tour=p.playroom.travel;
 assert.equal(p.info.name,'旅行存档企鹅');assert.equal(p.activeOption.trip,null);assert.equal(tour.visits['北京市'],2);assert.equal(tour.photos.length,2);assert.equal(new Set(tour.photos.map(p=>p.id)).size,2);assert.equal(tour.photos[0].id,'u_alipay');assert.equal(tour.postcards[0].reward,20);assert.equal(p.info.yb,300);assert.equal(fs.existsSync(path.join(dir,'pending-pet-import.json')),false);assert.equal($Store.getItem('sys').apiKey,'retained-local-secret');
 for(let i=0;i<3;i++)travel().tick();assert.equal(getPetInfo().playroom.travel.postcards.length,1);
 const room=require('../src/windows/popups/playroom/main');room.cleate();await until(()=>room.window&&room.window.webContents.executeJavaScript("!!document.getElementById('app').__vue_app__?._instance?.proxy?.state"));const win=room.window;
 await click(win,'.playroom-tabs button:nth-child(3)');await click(win,'.travel-postcards button');await until(()=>win.webContents.executeJavaScript("!!document.querySelector('.travel-letter button')"));await click(win,'.travel-letter button');await until(()=>getPetInfo().info.yb===320);
 assert.equal(getPetInfo().playroom.travel.souvenirs.length,1);assert.equal(travel().claimEncounter(tour.postcards[0].id).ok,false);assert.equal(getPetInfo().info.yb,320);
 await click(win,'.playroom-tabs button:nth-child(4)');await until(()=>win.webContents.executeJavaScript("document.querySelectorAll('.album-grid img').length===2&&Array.from(document.querySelectorAll('.album-grid img')).every(i=>i.complete&&i.naturalWidth>0)"));await click(win,'.album-grid button');await until(()=>win.webContents.executeJavaScript("document.querySelector('.album-preview img')?.naturalWidth>0"));
 fs.writeFileSync(path.join(root,'restored-album.png'),(await win.webContents.capturePage()).toPNG());
 const save=require('../src/service/gameplay/save'),again=save.parse(JSON.stringify(save.snapshot()));assert.equal(again.pet.info.yb,320);assert.equal(again.pet.playroom.travel.postcards[0].claimed,true);assert.equal(again.pet.playroom.travel.photos.length,2);assert.equal(again.pet.playroom.travel.souvenirs.length,1);
 const stored=JSON.parse(fs.readFileSync(path.join(dir,'config-macos.json'),'utf8'));assert.equal(stored.pet.info.yb,320);assert.equal(stored.pet.playroom.travel.postcards.length,1);assert.equal(stored.pet.playroom.travel.postcards[0].claimed,true);
 console.log('PASS actual main imports running trip, completes elapsed trip once, retains/distinct photos, native postcard claim and album images, durable claims/re-export');clearTimeout(timeout);app.exit(0);
}).catch(error=>{console.error(error,'fixture',root);realExit(1);});
