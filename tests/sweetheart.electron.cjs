const {app,BrowserWindow}=require('electron');const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'qq-pet-sweetheart-'));app.setPath('userData',dir);global.initData={};global.$test=false;app.on('window-all-closed',()=>{});
const timerMode=process.env.QQPET_TEST_SWEETHEART_TIMER==='1';
const delay=ms=>new Promise(r=>setTimeout(r,ms));async function until(fn){for(let i=0;i<160;i++){if(await fn())return;await delay(100);}throw Error('Sweetheart UI timeout');}const timeout=setTimeout(()=>app.exit(2),timerMode?100000:35000);
app.whenReady().then(async()=>{
 require('../src/ini/init');global.openSpeak=()=>{};
 setPetInfo({info:{name:'贴心企鹅',host:'测试',sex:'GG',health:5,hunger:1000,clean:1000,mood:400,yb:300,growth:30000},maxInfo:{level:10,hunger:4000,clean:4000}});
 const {shop}=require('../src/windows/util/pet/shop');const food=Object.keys(shop.food).find(id=>shop.food[id].starve===720),clean=Object.keys(shop.commodity).find(id=>shop.commodity[id].clean>0);
 setCache({name:'store',value:{...getCache('store'),food:[food+'-2'],commodity:[clean+'-2'],toy:['_t0002-2']}});
 const callbacks=[],{myPet}=require('../src/windows/util/pet/petIndex');global.petControl=new myPet();petControl.init({petInfo:getPetInfo(),fn:{backState:()=>{},backActive:result=>callbacks.push(result)}});
 const ui=require('../src/windows/popups/stateInfo/main');ui.cleate({nowPosition:[600,600]});await until(()=>ui.window&&ui.window.webContents.executeJavaScript("document.querySelector('#app').__vue_app__?._instance?.proxy?.petInfo?.info?.name==='贴心企鹅'"));let win=ui.window;
 async function click(selector){app.focus({steal:true});win.focus();await delay(150);const point=await win.webContents.executeJavaScript(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`);for(const type of ['mouseMove','mouseDown','mouseUp']){win.webContents.sendInputEvent({type,...point,button:'left',clickCount:1});await delay(80);}}
 await click('.openSweetHeart');await until(()=>getPetInfo().otherOptions.sweetHeart===true);
 assert.ok($Store.getItem('pet').otherOptions.sweetHeart);
 const grow=petControl.GrowUp;
 if(timerMode){
   assert.equal(grow.growTime,60000);
   petControl.startGrowUp();
   assert.equal(getCache('store').food[0],food+'-2','startup must not consume');
   await delay(61000);
   clearInterval(grow.intervalTime);grow.intervalTime=null;
 }else grow.GrowUpMain();
 assert.equal(getCache('store').food[0],food+'-1');assert.equal(getPetInfo().playroom.daily.counts.Eat,1);assert.equal(callbacks.at(-1).type,'food');assert.equal($Store.getItem('cache').store.food[0],food+'-1','auto-care inventory persists before the delayed Goods timer');assert.ok(getPetInfo().info.hunger>1600);
 // First/refresh/offline-style updates must not consume inventory.
 grow.GrowUpMain({first:true});grow.GrowUpMain({unGrow:true});assert.equal(getCache('store').food[0],food+'-1');
 setPetInfo({info:{hunger:getPetInfo().maxInfo.hunger,mood:400}});grow.GrowUpMain();assert.equal(getCache('store').commodity[0],clean+'-1');assert.equal(getPetInfo().playroom.daily.counts.Clean,1);assert.equal(callbacks.at(-1).type,'commodity');
 setPetInfo({info:{hunger:getPetInfo().maxInfo.hunger,clean:getPetInfo().maxInfo.clean,mood:400}});grow.GrowUpMain();assert.equal(getCache('store').toy[0],'_t0002-1');assert.equal(getPetInfo().playroom.daily.counts.Toy,1);
 await until(()=>win.webContents.executeJavaScript("document.querySelector('.closeSweetHeart')!==null"));await click('.closeSweetHeart');await until(()=>getPetInfo().otherOptions.sweetHeart===false);setPetInfo({info:{hunger:100}});grow.GrowUpMain();assert.equal(getCache('store').food[0],food+'-1');
 await click('.openSweetHeart');await until(()=>getPetInfo().otherOptions.sweetHeart);setPetInfo({maxInfo:{stopGrowth:true}});grow.GrowUpMain();assert.equal(getCache('store').food[0],food+'-1');setPetInfo({maxInfo:{stopGrowth:false},info:{health:0}});grow.GrowUpMain();assert.equal(getCache('store').food[0],food+'-1');
 await delay(1200);const saved=JSON.parse(fs.readFileSync(path.join(dir,'config-macos.json'),'utf8'));assert.equal(saved.cache.store.food[0],food+'-1');assert.equal(saved.cache.store.commodity[0],clean+'-1');assert.equal(saved.cache.store.toy[0],'_t0002-1');assert.equal(saved.pet.playroom.daily.counts.Toy,1);assert.equal(saved.pet.otherOptions.sweetHeart,true);
 console.log('PASS native sweetheart toggle, '+(timerMode?'real 60-second timer, ':'')+'actual GrowUp/Goods/State food and cleaning, toy care/task counters, first/refresh/off/pause/death guards, persisted cache:',dir);clearTimeout(timeout);BrowserWindow.getAllWindows().forEach(w=>w.destroy());app.quit();
}).catch(error=>{console.error(error);app.exit(1);});
