// Real production window/timer/Store. OS idle seconds alone are controlled so
// automated renderer input does not depend on the user's physical activity.
const {app,BrowserWindow,powerMonitor}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'qq-pet-game-minute-'));
app.setPath('userData',dir);app.on('window-all-closed',()=>{});global.initData={};global.$test=false;
process.on('uncaughtException',error=>{console.error(error);app.exit(1);});
const delay=ms=>new Promise(r=>setTimeout(r,ms));async function until(fn){for(let i=0;i<180;i++){if(await fn())return;await delay(100);}throw Error('Game minute UI timeout');}
let idle=70,idleChecks=0;const originalIdle=powerMonitor.getSystemIdleTime.bind(powerMonitor);
powerMonitor.getSystemIdleTime=()=>{assert.ok(Number.isFinite(originalIdle()));idleChecks++;return idle;};
const timer=setTimeout(()=>app.exit(2),process.env.QQPET_GAME_CRASH==='1'?190000:115000),errors=[],speaks=[];
app.whenReady().then(async()=>{
 require('../src/ini/init');global.openSpeak=value=>speaks.push(value);
 const open=windowsMain.open.bind(windowsMain);windowsMain.open=option=>{option.default.webPreferences={offscreen:true,backgroundThrottling:false};const created=option.created;option.created=value=>{value.vm.webContents.on('console-message',event=>{if(event.level==='error'||event.level>=3)errors.push(event.message);});return created(value);};return open(option);};
 setPetInfo({info:{name:'游戏企鹅',host:'测试',sex:'GG',health:5,yb:300,mood:800,hunger:2000,clean:2000,growth:40000},maxInfo:{level:20,hunger:4000,clean:4000,growthRate:260}});
 const room=require('../src/windows/popups/smallGame/main');room.cleate();await until(()=>room.window);const win=room.window;
 await until(()=>win.webContents.executeJavaScript("!!document.getElementById('app').__vue_app__"));
 const point=await win.webContents.executeJavaScript("(()=>{const el=Array.from(document.querySelectorAll('.menu_item')).find(el=>el.textContent.trim()==='泡泡');el.scrollIntoView({block:'center'});const b=el.getBoundingClientRect();return {x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)}})()");
 for(const type of ['mouseMove','mouseDown','mouseUp']){win.webContents.sendInputEvent({type,...point,button:'left',clickCount:1});await delay(80);}
 await until(()=>win.webContents.executeJavaScript("!!document.getElementById('gameMain')?.ruffle?.().metadata"));
 const input=await win.webContents.executeJavaScript("(()=>{const b=document.getElementById('gameMain').getBoundingClientRect();return {x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)}})()");
 await delay(5000);assert.equal(getPetInfo().info.yb,300,'idle window must not earn');
 idle=0;setPetInfo({maxInfo:{stopGrowth:true}});win.focus();await delay(5000);assert.equal(getPetInfo().info.yb,300,'paused pet must not earn');
 setPetInfo({maxInfo:{stopGrowth:false}});win.hide();await delay(5000);assert.equal(getPetInfo().info.yb,300,'hidden window must not earn');
 win.show();app.focus({steal:true});win.focus();const started=Date.now();let focused=0,samples=0;
 while(getPetInfo().info.yb===300&&Date.now()-started<75000){app.focus({steal:true});win.focus();await delay(150);for(const type of ['mouseMove','mouseDown','mouseUp'])win.webContents.sendInputEvent({type,...input,button:'left',clickCount:1});win.webContents.sendInputEvent({type:'keyDown',keyCode:'Space'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Space'});samples++;if(win.isFocused())focused++;await delay(1000);if(samples%15===0)console.log('ACTIVE',samples,'focused',focused,'yb',getPetInfo().info.yb);}
 const elapsed=Date.now()-started,pet=getPetInfo();assert.ok(elapsed>=59000,'no shortened clock');assert.equal(pet.info.yb,305);assert.equal(pet.info.mood,802);assert.ok(Math.abs(pet.info.growth-(40000+260/60))<1e-8);assert.equal(pet.playroom.daily.gameMinutes,1);assert.equal(pet.playroom.daily.counts.Game,1);assert.ok(idleChecks>0);assert.ok(focused/samples>0.9);
 assert.equal($Store.getItem('pet').info.yb,305);assert.equal($Store.getItem('pet').playroom.daily.gameMinutes,1);assert.equal(speaks.length,1);
 fs.writeFileSync(path.join(dir,'game-minute.png'),(await win.webContents.capturePage()).toPNG());
 if(process.env.QQPET_GAME_CRASH==='1'){
  const gone=new Promise(resolve=>win.webContents.once('render-process-gone',(_event,details)=>resolve(details)));win.webContents.forcefullyCrashRenderer();const details=await gone;assert.ok(win.webContents.isCrashed());console.log('CRASHED',JSON.stringify(details));
  const stoppedAt=Date.now();while(Date.now()-stoppedAt<65000){app.focus({steal:true});win.focus();await delay(1000);assert.equal(getPetInfo().info.yb,305);}
  assert.equal($Store.getItem('pet').playroom.daily.gameMinutes,1);console.log('CRASH WAIT',Date.now()-stoppedAt,'ms: no extra rewards');
 }
 win.close();await until(()=>room.window===null);await delay(2200);assert.equal(getPetInfo().info.yb,305,'close must not award twice');assert.deepEqual(errors,[]);
 if(process.env.QQPET_GAME_CRASH==='1'){
  room.cleate();await until(()=>room.window);const reopened=room.window;await until(()=>reopened.webContents.executeJavaScript("!!document.getElementById('app').__vue_app__"));
  assert.equal(getPetInfo().info.yb,305);assert.equal(getPetInfo().playroom.daily.gameMinutes,1);
  await require('../src/service/gameplay/saveUI').settleWindows();assert.equal(room.window,null);
  const save=require('../src/service/gameplay/save'),file=path.join(dir,'after-crash-export.json');save.write(file,save.snapshot());const exported=save.parse(fs.readFileSync(file,'utf8'));assert.equal(exported.pet.info.yb,305);assert.equal(exported.pet.playroom.daily.gameMinutes,1);assert.equal(exported.pet.playroom.gameRewardDays[exported.pet.playroom.daily.day],1);
 }
 console.log('PASS full real minute, native menu/inputs/focus, idle/pause/hidden exclusion, atomic saved +5 yb/+2 mood/growth/Game counter, close once:',JSON.stringify({elapsed,focused,samples,idleChecks,controlledIdle:true,crashTest:process.env.QQPET_GAME_CRASH==='1',dir}));
 clearTimeout(timer);for(const w of BrowserWindow.getAllWindows())w.destroy();app.quit();
}).catch(error=>{console.error(error,'fixture:',dir);app.exit(1);});
