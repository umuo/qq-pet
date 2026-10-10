const {app,BrowserWindow}=require('electron');const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'qq-pet-original-travel-'));app.setPath('userData',path.join(temp,'userData'));app.on('window-all-closed',()=>{});global.initData={};global.$test=false;
const delay=ms=>new Promise(r=>setTimeout(r,ms));async function until(fn){for(let i=0;i<200;i++){if(await fn())return;await delay(100);}throw Error('Travel window timed out');}const timeout=setTimeout(()=>app.exit(2),50000);
app.whenReady().then(async()=>{
 require('../src/ini/init');global.openSpeak=()=>{};setPetInfo({info:{name:'测试企鹅',host:'测试',sex:'GG',health:5,mood:800,yb:300,hunger:2000,clean:2000,growth:500},maxInfo:{level:10,hunger:4000,clean:4000},activeOption:{trip:null}});
 const {travel}=require('../src/service/gameplay/travel');let time=Date.now();travel().now=()=>time;travel().random=()=>0;
 const room=require('../src/windows/popups/playroom/main');room.cleate('travel');const ui=require('../src/windows/popups/travel/main');
 await until(()=>ui.window&&ui.window.webContents.executeJavaScript("document.querySelectorAll('.travel-map path').length===35"));let win=ui.window;win.webContents.on('console-message',(_,level,message)=>{if(level>=2)console.log('RENDERER',message);});console.log('CHECK travel loaded');
 await until(()=>win.webContents.executeJavaScript("Array.from(document.querySelectorAll('.head img,.foot img,.lvcjImg')).every(img=>img.complete&&img.naturalWidth>0)"));
 assert.equal(win.webContents.getURL().includes('app.html'),true);assert.equal(win.isAlwaysOnTop(),true);
 assert.deepEqual(await win.webContents.executeJavaScript("({fill:getComputedStyle(document.querySelector('.travel-map path')).fill,stroke:getComputedStyle(document.querySelector('.travel-map path')).stroke})"),{fill:'rgb(238, 238, 238)',stroke:'rgb(255, 255, 255)'});
 assert.equal(await win.webContents.executeJavaScript("document.querySelector('.travel-map').getAttribute('viewBox')"),'0 0 560 557');
 async function click(selector){const point=await win.webContents.executeJavaScript(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)return null;const r=el.getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`);assert.ok(point,'Missing click target '+selector);for(const type of ['mouseMove','mouseDown','mouseUp']){win.webContents.sendInputEvent({type,...point,button:'left',clickCount:1});await delay(80);}}
 await click('.start-travel');await until(()=>!!getPetInfo().activeOption.trip);assert.equal(getPetInfo().activeOption.trip.city,'北京市');
 await until(()=>win.webContents.executeJavaScript("document.querySelector('.stop-travel').textContent.includes('北京市')"));assert.ok(await win.webContents.executeJavaScript("document.querySelector('.start-travel').disabled"));
 await win.webContents.executeJavaScript('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');await delay(100);
 fs.writeFileSync(path.join(temp,'travel-running.png'),(await win.webContents.capturePage()).toPNG());
 await click('.stop-travel');await until(()=>!getPetInfo().activeOption.trip);assert.equal(getPetInfo().playroom.travel.postcards.length,0);
 await click('.start-travel');await until(()=>!!getPetInfo().activeOption.trip);time+=55*60000;travel().tick();await until(()=>win.webContents.executeJavaScript("document.querySelectorAll('.travel-map .visited').length===1"));
 const colored=await win.webContents.executeJavaScript("getComputedStyle(document.querySelector('.travel-map .visited')).fill");assert.equal(colored,'rgb(255, 84, 40)');assert.equal(getPetInfo().playroom.travel.postcards.length,1);
 await click('.travelTab:last-child');await until(()=>win.webContents.executeJavaScript("document.querySelector('.album-pane').checkVisibility()"));
 if(getPetInfo().playroom.travel.photos.length){await until(()=>win.webContents.executeJavaScript("document.querySelector('.album-grid img')?.naturalWidth>0"));await click('.album-grid button');assert.ok(await win.webContents.executeJavaScript("document.querySelector('figure img')!==null"));}
 await click('.travelTab:first-child');await win.webContents.executeJavaScript('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');await delay(100);fs.writeFileSync(path.join(temp,'travel-returned.png'),(await win.webContents.capturePage()).toPNG());
 console.log('CHECK normal trip complete');
 // Seed a completed map to exercise the paid achievement UI without 35 hour-long trips.
 const completed={...getPetInfo().playroom.travel,visits:Object.fromEntries(travel().view().destinations.map(name=>[name,1]))};
 setPetInfo({info:{yb:10000},playroom:{...getPetInfo().playroom,travel:completed}});
 await until(()=>win.webContents.executeJavaScript("document.querySelector('.finish-tour')!==null"));
 const keep=JSON.parse(JSON.stringify({photos:completed.photos,postcards:completed.postcards,souvenirs:completed.souvenirs}));
 const {dialog}=require('electron');const realDialog=dialog.showMessageBox;let calls=0,approve;
 dialog.showMessageBox=async(parent,options)=>{assert.equal(parent,win);assert.match(options.message,/8888/);assert.match(options.detail,/照片、明信片和纪念品会保留/);calls++;if(calls===1)return {response:0};return new Promise(resolve=>approve=()=>resolve({response:1}));};
 console.log('CHECK achievement shown');
 await click('.finish-tour');await until(()=>calls===1);await delay(100);assert.equal(getPetInfo().info.yb,10000);assert.equal(Object.keys(getPetInfo().playroom.travel.visits).length,35);
 console.log('CHECK cancelled');
 await click('.finish-tour');await until(()=>!!approve);await click('.finish-tour');assert.equal(calls,2);approve();
 await until(()=>getPetInfo().info.yb===1112);assert.equal(getPetInfo().playroom.travel.tours,1);assert.deepEqual(getPetInfo().playroom.travel.visits,{});
 for(const key of Object.keys(keep))assert.deepEqual(getPetInfo().playroom.travel[key],keep[key]);
 const stored=JSON.parse(fs.readFileSync(path.join(app.getPath('userData'),'config-macos.json'),'utf8'));assert.equal(stored.pet.info.yb,1112);assert.equal(stored.pet.playroom.travel.tours,1);assert.deepEqual(stored.pet.playroom.travel.visits,{});
 await until(()=>win.webContents.executeJavaScript("document.querySelector('.finish-tour')===null && document.querySelector('.lvcjImg')?.title==='旅行成就*1' && !document.querySelector('.lvcjImg').classList.contains('noneLvcj')"));
 const save=require('../src/service/gameplay/save');const restored=save.parse(JSON.stringify(save.snapshot()));assert.equal(restored.pet.playroom.travel.tours,1);assert.deepEqual(restored.pet.playroom.travel.photos,keep.photos);
 console.log('CHECK achievement persisted');dialog.showMessageBox=realDialog;
 setPetInfo({otherOptions:{pinkDiamond:true}});await until(()=>win.webContents.executeJavaScript("document.querySelector('.box.vip')&&document.querySelector('.head img').getAttribute('src').includes('Q_01')"));await until(()=>win.webContents.executeJavaScript("Array.from(document.querySelectorAll('.head img,.foot img')).every(img=>img.complete&&img.naturalWidth>0)"));
 await click('.close');await until(()=>!ui.window);assert.equal(getPetInfo().playroom.travel.tours,1);room.cleate('travel');await until(()=>ui.window&&ui.window.webContents.executeJavaScript("document.querySelectorAll('.travel-map .visited').length===0 && document.querySelector('.lvcjImg')?.title==='旅行成就*1'"));
 console.log('PASS reference travel frame/images/colors, native start/stop, completion/map/photo, VIP skin, paid tour confirmation/cancel/repeat guard, stored collections/save round trip, close/reopen. Screenshots:',temp);clearTimeout(timeout);BrowserWindow.getAllWindows().forEach(w=>w.destroy());app.quit();
}).catch(e=>{console.error(e);app.exit(1);});
