const {app,BrowserWindow,dialog}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'qq-pet-pond-save-'));app.setPath('userData',path.join(temp,'userData'));app.on('window-all-closed',()=>{});
const saved={},messages=[];global.$Store={setItem(key,value){saved[key]=JSON.parse(JSON.stringify(value));fs.writeFileSync(path.join(temp,key+'.json'),JSON.stringify(value));}};
require('../src/ini/pet');global.openSpeak=message=>messages.push(message);
const delay=ms=>new Promise(r=>setTimeout(r,ms));async function until(fn){for(let i=0;i<200;i++){if(await fn())return;await delay(50);}throw Error('Pond save timeout');}
const timeout=setTimeout(()=>app.exit(2),65000);let server;
const errors=[];app.on('web-contents-created',(_event,contents)=>contents.on('console-message',event=>{if(event.level==='error'||event.level>=3){errors.push(event.message);console.log('POND ERROR',event.message);}}));
app.whenReady().then(async()=>{
  global.windowsMain=new(require('../src/windows/window'))();const open=windowsMain.open.bind(windowsMain);windowsMain.open=option=>{option.default.show=false;option.default.webPreferences={offscreen:true,backgroundThrottling:false};return open(option);};
  const express=require('express'),local=express();local.use('/test',express.static(path.resolve(__dirname,'../src')));await new Promise(r=>{server=local.listen(0,'127.0.0.1',r);});
  const endpoint={host:'127.0.0.1',port:server.address().port,fileName:'test'},pond=require('../src/windows/popups/fishing/main');
  setPetInfo({info:{name:'鱼塘测试',host:'测试',sex:'GG',health:5,yb:2,mood:850,hunger:2000,clean:2000,growth:30000},maxInfo:{level:10,hunger:4000,clean:4000}});
  async function openPond(balance){if(balance!==undefined)setPetInfo({info:{yb:balance},fishing:{fishes:[],harvestfish:0,canusecnt:1}});pond.cleate(endpoint);await until(()=>pond.window&&pond.window.webContents.executeJavaScript("document.querySelector('iframe')?.contentWindow?.getCookie?.('yb')!==null&&typeof document.querySelector('iframe')?.contentDocument?.getElementById('hlyg')?.PETEventOnReceived==='function'"));return pond.window;}
  async function buy(win){return win.webContents.executeJavaScript("(()=>{const f=document.querySelector('iframe').contentWindow;const id=f.eval('shop.find(item=>item.price_yb===2).fryid');f.PETSendData(JSON.stringify({head:{cmd:4},data:{paytype:1,fryid:id}}));return {yb:f.getCookie('yb'),fishes:JSON.parse(f.getCookie('fishes')).length,pending:f.eval('Object.keys(saveOpt).length')};})()");}
  async function close(win){const done=new Promise(r=>win.once('closed',r));win.close();await done;}
  let win=await openPond(2);
  assert.deepEqual(await buy(win),{yb:'0',fishes:1,pending:3});await close(win);
  assert.equal(getPetInfo().info.yb,0);assert.equal(saved.pet.info.yb,0);assert.equal(saved.pet.fishing.fishes.length,1);
  win=await openPond();assert.equal(await win.webContents.executeJavaScript("JSON.parse(document.querySelector('iframe').contentWindow.getCookie('fishes')).length"),1);await close(win);
  win=await openPond(2);await buy(win);setPetInfo({info:{yb:5}});await close(win);
  assert.equal(getPetInfo().info.yb,3,'outside income survives the pending fish debit');assert.equal(saved.pet.fishing.fishes.length,1);
  win=await openPond(10);await buy(win);await until(()=>getPetInfo().info.yb===8);await close(win);assert.equal(getPetInfo().info.yb,8,'normal save plus close replay cannot charge twice');
  win=await openPond(2);await buy(win);setPetInfo({info:{yb:0}});await close(win);
  assert.equal(getPetInfo().info.yb,0);assert.equal(getPetInfo().fishing.fishes.length,0,'an unaffordable pending operation cannot grant a free fish');
  win=await openPond(10);await buy(win);const out=path.join(temp,'export.json');dialog.showSaveDialog=async()=>({canceled:false,filePath:out});dialog.showMessageBox=async(_parent,options)=>{throw Error(options.message);};
  await require('../src/service/gameplay/saveUI').run('exportSave',win);
  const exported=JSON.parse(fs.readFileSync(out,'utf8'));assert.equal(exported.pet.info.yb,8);assert.equal(exported.pet.fishing.fishes.length,1);assert.ok(win.isDestroyed());
  assert.deepEqual(errors,[]);
  console.log('PASS actual HTTP/Ruffle pond callback batching, immediate close, persisted reopen, concurrent income, replay/insufficient balance, export settlement',temp);
  clearTimeout(timeout);server.close();BrowserWindow.getAllWindows().forEach(w=>w.destroy());app.quit();
}).catch(error=>{console.error(error);server?.close();BrowserWindow.getAllWindows().forEach(w=>w.destroy());app.exit(1);});
