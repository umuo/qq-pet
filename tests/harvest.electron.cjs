// Native reminder button and actual destination windows, with temporary saves/server.
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'qq-pet-harvest-'));
app.setPath('userData',path.join(temp,'userData'));app.on('window-all-closed',()=>{});
global.$Store={setItem(){}};require('../src/ini/pet');global.getSys=key=>key==='doNotDisturb'?false:1;
const delay=ms=>new Promise(r=>setTimeout(r,ms));async function until(fn){for(let i=0;i<180;i++){if(await fn())return;await delay(100);}throw Error('Harvest UI timeout');}
const timeout=setTimeout(()=>app.exit(2),50000);let server;
app.whenReady().then(async()=>{
  global.windowsMain=new(require('../src/windows/window'))();const open=windowsMain.open.bind(windowsMain);
  windowsMain.open=option=>{option.default.show=false;option.default.webPreferences={offscreen:true,backgroundThrottling:false,webSecurity:false};const created=option.created;option.created=value=>{value.vm.webContents.on('console-message',(_event,level,message)=>{if(level>=3)console.log(message);});return created(value);};return open(option);};
  const express=require('express'),local=express();local.use('/test',express.static(path.resolve(__dirname,'../src')));
  await new Promise(r=>{server=local.listen(0,'127.0.0.1',r);});
  global.openLocalHost=fn=>fn({host:'127.0.0.1',port:server.address().port,fileName:'test'});
  setPetInfo({info:{name:'测试企鹅',host:'测试',sex:'GG',health:5,yb:300,mood:850,hunger:2000,clean:2000,growth:30000},maxInfo:{level:10,hunger:4000,clean:4000}});
  const {freshFarm}=require('../src/service/gameplay/farm');const user={...freshFarm(),username:'测试企鹅',wealth:'300',checked:Math.floor(Date.now()/1000)};
  user.farmland[0]={farmland:'FarmlandS',crop:'RadishSeed',time:Math.floor(Date.now()/1000)-7*86400};
  setPetInfo({playroom:{version:1,farm:{user,session:null}}});
  const {harvest,QUIET}=require('../src/service/gameplay/harvest');let now=Date.now();harvest().now=()=>now;
  const tip=require('../src/windows/popups/tip/main');
  const {GameplaySpeech}=require('../src/service/gameplay/speech');
  const speaker=new GameplaySpeech({enabled:()=>true,quiet:()=>false,pet:()=>getPetInfo(),generate:source=>source.replace('去看看吧~','快去看看吧~'),emit:payload=>tip.cleate({position:[300,350],maxSize:[180,180],data:payload.data,otherOpt:payload.otherOpt})});
  async function reminder(news){await speaker.say({data:{type:'text',data:news.message,submitText:'去看看'},otherOpt:{type:'gameplayHarvest',target:news.target}});
    await until(()=>tip.window&&tip.window.webContents.executeJavaScript("document.querySelector('.submit')?.textContent.trim()==='去看看'"));
    const expected=news.target==='farm'?news.message.replace('去看看吧~','快去看看吧~'):news.message;
    assert.equal(await tip.window.webContents.executeJavaScript("document.querySelector('.t_m_center.text').textContent.trim()"),expected,'valid rewrite is shown; invalid AI numbers use the original');
    const win=tip.window,point=await win.webContents.executeJavaScript("(()=>{const r=document.querySelector('.submit').getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()");
    const closed=new Promise(r=>win.once('closed',r));for(const type of ['mouseMove','mouseDown','mouseUp']){win.webContents.sendInputEvent({type,...point,button:'left',clickCount:1});await delay(80);}await closed;
  }
  const farmNews=harvest().check();assert.equal(farmNews.ripe,1);assert.equal(farmNews.target,'farm');await reminder(farmNews);
  const farm=require('../src/windows/popups/farm/main');await until(()=>farm.window&&farm.window.webContents.executeJavaScript("typeof document.getElementById('farmPlayer')?.farmAll==='function'"));
  assert.equal(getPetInfo().info.yb,0);const farmClosed=new Promise(r=>farm.window.once('closed',r));farm.window.close();await farmClosed;assert.equal(Number(getPetInfo().info.yb),300);
  // Remove this fixture crop, introduce a mature fish and pass the quiet interval.
  const state=getPetInfo().playroom;state.farm.user.farmland[0]={farmland:'FarmlandS'};setPetInfo({playroom:state,fishing:{fishes:[{id:1,fryid:1,name:'秋刀鱼',avatar:1,stage:3,time:0,born:1,interval:3600,siLiao:0,quantity:5,basequantity:5,costyb:4,YB:1,AIXIN:0,growth:0,strong:0,iq:0,charm:0}]}});
  now+=QUIET;const fishNews=harvest().check();assert.equal(fishNews.target,'fishing');speaker.generate=source=>source.replace('1条鱼','9条鱼');await reminder(fishNews);
  await until(()=>windowsMain.wins.fishing?.win?.webContents.executeJavaScript("!!document.querySelector('iframe')?.src.includes('indexOnLine.html')"));
  const fish=windowsMain.wins.fishing.win;
  await until(()=>fish.webContents.executeJavaScript("!!document.querySelector('iframe')?.contentDocument?.querySelector('ruffle-embed,ruffle-player')?.ruffle().metadata"));
  await until(()=>fish.webContents.executeJavaScript("document.querySelector('iframe').contentWindow.getCookie('yb')==='300'"));
  await delay(3000);
  assert.equal(await fish.webContents.executeJavaScript("JSON.parse(document.querySelector('iframe').contentWindow.getCookie('fishes')).length"),1);
  assert.ok(await fish.webContents.executeJavaScript("getComputedStyle(document.querySelector('iframe').contentDocument.querySelector('ruffle-embed,ruffle-player').shadowRoot.querySelector('canvas')).cursor.includes('data:image')"));
  fs.writeFileSync(path.join(temp,'fishing-from-reminder.png'),(await fish.webContents.capturePage()).toPNG());
  assert.equal(harvest().check(),null);assert.equal(Number(getPetInfo().info.yb),300);
  console.log('PASS: native harvest reminder buttons open actual farm/Ruffle pond; farm wallet returns; no repeated news or currency change. Screenshot: '+path.join(temp,'fishing-from-reminder.png'));
  clearTimeout(timeout);for(const w of BrowserWindow.getAllWindows())w.destroy();server.close();app.quit();
}).catch(error=>{console.error(error);for(const w of BrowserWindow.getAllWindows())w.destroy();if(server)server.close();app.exit(1);});
