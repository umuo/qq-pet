// Whole Electron processes share only this test directory; never the user's save.
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const [dir,phase]=process.argv.slice(2);const planted=process.env.QQPET_TEST_PLANTED==='1';
const cropData=user=>user.farmland.map((land,index)=>({index,crop:land.crop,time:land.time})).filter(land=>land.crop);
const fixture=path.join(dir,'planted-fixture.json');app.setPath('userData',dir);global.initData={};global.$test=false;
app.on('window-all-closed',()=>{});const timer=setTimeout(()=>{console.error('Timeout in farm phase',phase);app.exit(2);},45000);
const delay=ms=>new Promise(r=>setTimeout(r,ms));async function until(fn){for(let i=0;i<200;i++){if(await fn())return;await delay(100);}throw Error('Farm restart timeout: '+phase);}
app.whenReady().then(async()=>{
 require('../src/ini/init');global.openSpeak=()=>{};
 if(phase==='purchase-quit')setPetInfo({info:{name:'重启企鹅',host:'测试',sex:'GG',health:5,yb:300,mood:850,hunger:2000,clean:2000,growth:100},maxInfo:{level:10,hunger:4000,clean:4000}});
 else {setPetInfo($Store.getItem('pet'));setCache({init:$Store.getItem('cache')});setSys({init:$Store.getItem('sys')});}
 const farmUI=require('../src/windows/popups/farm/main'),{farm}=require('../src/service/gameplay/farm');
 if(phase.endsWith('recover')){
   const expected=phase==='clean-recover'?245:175;
   if(phase==='orphan-recover'){assert.equal(getPetInfo().info.yb,10);assert.equal(getPetInfo().playroom.farm.session.balance,165);}
   // Actual main renderer sends its persisted Ruffle SOL and nonce at mount,
   // through the same production FarmWindow recovery method as main.js.
   const main=await windowsMain.open({name:'main',default:{width:180,height:180,show:false,webPreferences:{offscreen:true,backgroundThrottling:false}},jsFiles:['./util/move.js','./util/pet/facePoints.js','./util/pet/swfPet.js','./util/pet/interactions.js'],created:({vm,preloads})=>preloads({
     'html_bus-Main':(_,payload)=>{if(payload.event==='mounted')vm.webContents.send('main_bus-html',{type:'load',bd:true,screenSize:[1920,1080],nowPosition:[100,100],maxSize:[180,180],petInfo:getPetInfo()});},
     'html_bus-main_gameplayStorage':(event,payload)=>{if(event.sender===vm.webContents)farmUI.recoverOnStartup(payload);}
   })});
   await until(()=>!getPetInfo().playroom.farm.session);assert.equal(getPetInfo().info.yb,expected);assert.equal(farm().recover({}),false);assert.equal(getPetInfo().info.yb,expected);
   const count=planted?0:phase==='clean-recover'?1:2;
   if(planted){assert.deepEqual(cropData(getPetInfo().playroom.farm.user),JSON.parse(fs.readFileSync(fixture,'utf8')));}assert.equal(getPetInfo().playroom.farm.user.burden.find(i=>i.Items==='RadishSeed')?.number||0,count);
   farmUI.cleate();await until(()=>farmUI.window&&farmUI.window.webContents.executeJavaScript("typeof document.getElementById('farmPlayer')?.farmAll==='function' && !document.querySelector('nav button').disabled"));assert.equal(farm().view().wallet,expected);
   if(planted){await until(()=>farmUI.window.webContents.executeJavaScript("!document.querySelector('nav button').disabled"));const actual=await farmUI.window.webContents.executeJavaScript("PetSol.readSol(PetSol.storageKey()).user");assert.deepEqual(cropData(actual),JSON.parse(fs.readFileSync(fixture,'utf8')));assert.equal(cropData(actual).length,phase==='clean-recover'?1:2);}
   await farmUI.close();assert.equal(getPetInfo().info.yb,expected);assert.equal(getPetInfo().playroom.farm.session,null);
   main.destroy();console.log('PASS',phase,'wallet',expected,'seeds',count,'recovery/reopen/close once');app.quit();return;
 }
 farmUI.cleate();await until(()=>farmUI.window&&farmUI.window.webContents.executeJavaScript("typeof document.getElementById('farmPlayer')?.farmAll==='function' && !document.querySelector('nav button').disabled"));
 const win=farmUI.window;const stage=await win.webContents.executeJavaScript("(()=>{const r=document.getElementById('farm-stage').getBoundingClientRect();return {x:r.x,y:r.y}})()");
 async function click(x,y){for(const type of ['mouseMove','mouseDown','mouseUp']){win.webContents.sendInputEvent({type,x:Math.round(stage.x+x),y:Math.round(stage.y+y),button:'left',clickCount:1});await delay(80);}await delay(300);}
 await delay(500);await click(662,37);await delay(3000);await click(195,224);await delay(1500);await click(310,420);
 const wallet=phase==='purchase-quit'?220:165;try{await until(()=>farm().view().wallet===wallet);}catch(error){fs.writeFileSync(path.join(dir,'purchase-failed.png'),(await win.webContents.capturePage()).toPNG());console.error('Purchase screenshot',dir,'wallet',farm().view().wallet);throw error;}assert.equal(getPetInfo().playroom.farm.user.burden.find(i=>i.Items==='RadishSeed').number,planted?1:phase==='purchase-quit'?1:2);
 if(planted){const point=await win.webContents.executeJavaScript("(()=>{const b=document.querySelector('nav button').getBoundingClientRect();return {x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)}})()");for(const type of ['mouseMove','mouseDown','mouseUp']){win.webContents.sendInputEvent({type,...point,button:'left',clickCount:1});await delay(80);}await until(()=>cropData(getPetInfo().playroom.farm.user).length===(phase==='purchase-quit'?1:2));assert.equal(getPetInfo().playroom.farm.user.burden.find(i=>i.Items==='RadishSeed')?.number||0,0);fs.writeFileSync(fixture,JSON.stringify(cropData(getPetInfo().playroom.farm.user)));console.log('PASS actual native planting',fs.readFileSync(fixture,'utf8'));}
 setPetInfo({info:{yb:phase==='purchase-quit'?25:10}});win.webContents.session.flushStorageData();await delay(500);
 console.log('PASS',phase,'actual purchase 80, persisted farm wallet',wallet,'outside income',getPetInfo().info.yb);
 if(phase==='orphan-exit'){process.kill(process.pid,'SIGKILL');return;}
 // Keep the farm open: app.quit itself must run its close/settlement path.
 app.on('will-quit',()=>{assert.equal(getPetInfo().info.yb,245);assert.equal(getPetInfo().playroom.farm.session,null);console.log('PASS app will-quit after farm settlement');});app.quit();
}).catch(error=>{console.error(error);BrowserWindow.getAllWindows().forEach(w=>w.destroy());app.exit(1);});
