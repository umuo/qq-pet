// Execute the actual top-level entry, using an isolated existing-pet profile.
const {app,BrowserWindow,clipboard}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'qq-pet-app-startup-'));app.setPath('userData',dir);
fs.writeFileSync(path.join(dir,'config-macos.json'),JSON.stringify({sys:{llmEnabled:false,clip:false,doNotDisturb:true},cache:{store:{food:[],commodity:[],toy:[]}},pet:{info:{name:'启动企鹅',host:'测试',sex:'GG',birthDay:'2020-01-02 08',growth:40000,health:5,yb:300,hunger:3000,clean:3000,mood:1000,lastX:300,lastY:400,lastLoginTime:Date.now()+3600000},maxInfo:{},otherOptions:{pinkDiamond:false,sweetHeart:false},activeOption:{ill:null,work:null,study:null,trip:null},activeValue:{work:{},study:{}}}}));
const fresh=process.env.QQPET_TEST_FRESH==='1',expectedName=fresh?'我':'启动企鹅';
if(fresh){const file=path.join(dir,'config-macos.json'),config=JSON.parse(fs.readFileSync(file,'utf8'));delete config.pet;config.sys.shortcuts={};fs.writeFileSync(file,JSON.stringify(config));}
for(const name of ['readText','readHTML','readImage'])clipboard[name]=()=>{throw Error('Disabled clipboard must not be read');};
const errors=[],rejections=[],intervals=[],watches=[];
process.on('uncaughtException',error=>{console.error('STARTUP UNCAUGHT',error);app.exit(1);});process.on('unhandledRejection',error=>rejections.push(String(error)));
app.on('web-contents-created',(_event,contents)=>contents.on('console-message',event=>{if(event.level==='error'||event.level>=3)errors.push(event.message);}));
const originalInterval=global.setInterval;global.setInterval=(fn,ms,...args)=>{intervals.push({ms,stack:new Error().stack});return originalInterval(fn,ms,...args);};
const originalWatch=fs.watch;fs.watch=function(file,...args){watches.push(String(file));return originalWatch.call(this,file,...args);};
const Factory=require('../src/windows/window'),open=Factory.prototype.open;Factory.prototype.open=function(option){option.default.webPreferences={...option.default.webPreferences,offscreen:true,backgroundThrottling:false};return open.call(this,option);};
const delay=ms=>new Promise(r=>setTimeout(r,ms));async function until(fn,attempts=400){for(let i=0;i<attempts;i++){if(await fn())return;await delay(100);}throw Error('Full app startup timeout');}
const timer=setTimeout(()=>app.exit(2),fresh?150000:85000);
require('../main');
app.whenReady().then(async()=>{
 assert.ok(app.hasSingleInstanceLock());const main=require('../src/windows/main/main');
 await until(()=>main.window&&main.window.webContents.executeJavaScript("!!document.getElementById('app')?.__vue_app__?._instance?.proxy?.swfPet?.swf&&!document.getElementById('app').__vue_app__._instance.proxy.swfPet.swf.changeIng"));await delay(6500);
 let poseChecks=0;await until(async()=>{const pose=JSON.parse(await main.window.webContents.executeJavaScript("JSON.stringify((()=>{const s=document.getElementById('app').__vue_app__._instance.proxy.swfPet.swf;return {changing:s.changeIng,name:s.oldNext.name,src:s.oldNext.src,frames:s.dom.metadata?.numFrames,current:s.dom.CurrentFrame?.(),next:s.nextSwfRouter?.name}})())"));if(poseChecks++%50===0)console.log('POSE WAIT',JSON.stringify(pose));return !pose.changing&&pose.name==='normal'&&pose.frames>0;},fresh?1200:400);
 console.log('READY POSE',await main.window.webContents.executeJavaScript("JSON.stringify({name:document.getElementById('app').__vue_app__._instance.proxy.swfPet.swf.oldNext.name,frames:document.getElementById('app').__vue_app__._instance.proxy.swfPet.swf.dom.metadata.numFrames})"));
 assert.equal(getPetInfo().info.name,expectedName);assert.equal(getSys('clip'),undefined);assert.equal(getSys('llmEnabled'),undefined);assert.equal(getSys('doNotDisturb'),true);
 assert.ok(watches.includes(dir),'real data watcher started');assert.ok(intervals.some(t=>t.ms===15000&&t.stack.includes('service/systemWatcher.js')),'real system watcher initialized');assert.ok(require('electron-updater').autoUpdater.listenerCount('before-quit-for-update')>0,'real updater initialized (development checks skip by library policy)');
 for(const type of ['mouseDown','mouseUp']){main.window.webContents.sendInputEvent({type,x:90,y:90,button:'right',clickCount:1});await delay(100);}
 const menu=require('../src/windows/popups/rightMenu/main');await until(()=>menu.window&&menu.window.webContents.executeJavaScript("!!document.querySelector('.center[fv=\"openPlayroom\"]')"));
 const point=await menu.window.webContents.executeJavaScript("(()=>{const b=document.querySelector('.center[fv=\"openPlayroom\"]').getBoundingClientRect();return {x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)}})()");for(const type of ['mouseMove','mouseDown','mouseUp']){menu.window.webContents.sendInputEvent({type,...point,button:'left',clickCount:1});await delay(100);}
 const room=require('../src/windows/popups/playroom/main');await until(()=>room.window&&room.window.webContents.executeJavaScript("document.querySelectorAll('.poke-milestones .milestone-card').length===5"));assert.equal(await room.window.webContents.executeJavaScript("document.querySelectorAll('.travel-milestones .milestone-card').length"),7);assert.ok(getPetInfo().playroom.mail.sent.welcome);
 fs.writeFileSync(path.join(dir,'main.png'),(await main.window.webContents.capturePage()).toPNG());fs.writeFileSync(path.join(dir,'playroom.png'),(await room.window.webContents.capturePage()).toPNG());assert.deepEqual(errors,[]);assert.deepEqual(rejections,[]);
 let exitFinished=false;main.window.webContents.on('ipc-message',(_event,channel,payload)=>{if(channel==='html_bus-main_backPetLoadFinish'&&payload?.event==='finish'){let data=payload.data;try{data=JSON.parse(data);}catch(_){}if(data==='exit'||data?.finish==='exit')exitFinished=true;}});
 app.on('will-quit',()=>{assert.deepEqual(errors,[]);assert.deepEqual(rejections,[]);assert.ok(exitFinished,'real exit animation completes');const saved=JSON.parse(fs.readFileSync(path.join(dir,'config-macos.json'),'utf8'));assert.equal(saved.pet.info.name,expectedName);assert.ok(saved.pet.playroom.mail.sent.welcome);console.log('PASS top-level main entry/single-instance/data watcher/system watcher/updater initialization, actual right menu/playroom, durable mail and exit:',JSON.stringify({fresh,dir}));clearTimeout(timer);});
 app.quit();
}).catch(error=>{console.error(error,'fixture:',dir);app.exit(1);});
