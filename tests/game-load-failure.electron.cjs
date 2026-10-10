const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'qq-pet-game-load-failure-'));
app.setPath('userData',dir);app.on('window-all-closed',()=>{});global.initData={};global.$test=false;
process.on('uncaughtException',error=>{console.error(error);app.exit(1);});
const delay=ms=>new Promise(r=>setTimeout(r,ms));async function until(fn){for(let i=0;i<350;i++){if(await fn())return;await delay(100);}throw Error('Game failure UI timeout');}
const timer=setTimeout(()=>app.exit(2),60000);
app.whenReady().then(async()=>{
 require('../src/ini/init');global.openSpeak=()=>{};
 const open=windowsMain.open.bind(windowsMain);windowsMain.open=option=>{option.default.webPreferences={offscreen:true,backgroundThrottling:false};return open(option);};
 setPetInfo({info:{name:'测试',host:'测试',sex:'GG',health:5,yb:300,mood:800,hunger:2000,clean:2000,growth:40000},maxInfo:{level:20,hunger:4000,clean:4000}});
 const room=require('../src/windows/popups/smallGame/main');room.cleate();await until(()=>room.window);const win=room.window;
 await until(()=>win.webContents.executeJavaScript("!!document.getElementById('app').__vue_app__"));
 // Change the isolated renderer's menu fixture; no real asset is moved or deleted.
 await win.webContents.executeJavaScript("(()=>{const p=document.getElementById('app').__vue_app__._instance.proxy;p.gameList[0].router='missing-test-game.swf';p.gameList[0].name='缺失资源测试';})()");
 async function click(name){const point=await win.webContents.executeJavaScript(`(()=>{const el=Array.from(document.querySelectorAll('.menu_item')).find(el=>el.textContent.trim()===${JSON.stringify(name)});el.scrollIntoView({block:'center'});const b=el.getBoundingClientRect();return {x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)}})()`);for(const type of ['mouseMove','mouseDown','mouseUp']){win.webContents.sendInputEvent({type,...point,button:'left',clickCount:1});await delay(80);}}
 await click('缺失资源测试');await until(()=>win.webContents.executeJavaScript("!!document.querySelector('.game-load-error')"));
 const failure=await win.webContents.executeJavaScript("(()=>{const el=document.querySelector('.game-load-error'),p=document.getElementById('app').__vue_app__._instance.proxy;return {text:el.textContent,visible:el.getBoundingClientRect().height>0,role:el.getAttribute('role'),busy:p.changeIng,loading:!!document.getElementById('gameLoading')}})()");
 assert.match(failure.text,/缺失资源测试.*加载失败.*重新选择/);assert.ok(failure.visible);assert.equal(failure.role,'alert');assert.equal(failure.busy,false);assert.equal(failure.loading,false);assert.equal(getPetInfo().info.yb,300);
 fs.writeFileSync(path.join(dir,'missing-alert.png'),(await win.webContents.capturePage()).toPNG());
 await click('泡泡');await until(()=>win.webContents.executeJavaScript("!!document.getElementById('gameMain')?.ruffle?.().metadata"));assert.equal(await win.webContents.executeJavaScript("document.querySelector('.game-load-error')===null"),true);assert.equal(await win.webContents.executeJavaScript("document.activeElement.id"),'gameMain');assert.equal(getPetInfo().info.yb,300);
 fs.writeFileSync(path.join(dir,'recovered.png'),(await win.webContents.capturePage()).toPNG());win.close();await until(()=>room.window===null);
 console.log('PASS native missing-asset selection, visible alert, loading cleanup, valid-game recovery and close:',dir);clearTimeout(timer);for(const w of BrowserWindow.getAllWindows())w.destroy();app.quit();
}).catch(error=>{console.error(error,'fixture:',dir);app.exit(1);});
