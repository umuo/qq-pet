// Execute the production main-window state handler with isolated globals;
// render its result in the real tip window and click the native reply button.
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'qq-pet-greeting-'));app.setPath('userData',path.join(temp,'userData'));app.on('window-all-closed',()=>{});
global.$Store={setItem(){}};require('../src/ini/pet');let quiet=false;
global.getSys=key=>key==='doNotDisturb'?quiet:key==='llmEnabled'?false:key==='opacity'?1:{hdImages:true};
const delay=ms=>new Promise(r=>setTimeout(r,ms));async function until(fn){for(let i=0;i<120;i++){if(await fn())return;await delay(100);}throw Error('Greeting UI timeout');}
const timeout=setTimeout(()=>app.exit(2),40000);
app.whenReady().then(async()=>{
  global.windowsMain=new(require('../src/windows/window'))();
  const open=windowsMain.open.bind(windowsMain);windowsMain.open=option=>{option.default.show=false;option.default.webPreferences={offscreen:true,backgroundThrottling:false};return open(option);};
  setPetInfo({info:{name:'测试企鹅',host:'小明',sex:'GG',growth:30000,health:5,mood:850,yb:300,hunger:2000,clean:2000},maxInfo:{level:10,hunger:4000,clean:4000}});
  const {greeting}=require('../src/service/gameplay/greeting');let now=new Date(2026,9,9,5).getTime();greeting().now=()=>now;greeting().random=()=>0;
  const tip=require('../src/windows/popups/tip/main');let emitted=0;
  const speak=payload=>{emitted++;tip.cleate({position:[400,400],maxSize:[180,180],data:payload.data});};
  const source=fs.readFileSync(path.resolve(__dirname,'../src/windows/main/main.js'),'utf8'),start=source.indexOf('main_h_setPetState_m: (e, t) => {'),end=source.indexOf('\n        });\n        if (petControl',start);
  assert.ok(start>=0&&end>start,'production handler found');
  const context={_require:name=>require(path.resolve(__dirname,'../src/windows/main',name)),n:{isStop:()=>false,openSpeak:speak},openSpeak:speak,getSys:global.getSys,getPetInfo:global.getPetInfo,getCommunication:()=>assert.fail('enter should use local greeting'),getRandom:()=>5};
  const handler=vm.runInNewContext('({'+source.slice(start,end)+'}).main_h_setPetState_m',context);
  const enter=()=>handler({}, {data:JSON.stringify({name:'enter',tolkName:'enter',tolkActive:'speak'})});
  for(const [hour,text,reply] of [[5,'早上好','早上好~'],[18,'晚上好','来玩吧'],[23,'半夜','晚安~']]) {
    now=new Date(2026,9,9,hour).getTime();await enter();
    await until(()=>tip.window&&tip.window.webContents.executeJavaScript(`document.querySelector('.t_m_center.text')?.textContent.includes(${JSON.stringify(text)})`));
    const win=tip.window;assert.equal(await win.webContents.executeJavaScript("document.querySelector('.submit').textContent.trim()"),reply);
    assert.ok(await win.webContents.executeJavaScript("document.querySelector('.t_m_center.text').textContent.includes('小明')"));
    fs.writeFileSync(path.join(temp,`${hour}.png`),(await win.webContents.capturePage()).toPNG());
    const count=emitted;await enter();assert.equal(emitted,count,'same period does not emit twice');
    const point=await win.webContents.executeJavaScript("(()=>{const r=document.querySelector('.submit').getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()");
    const closed=new Promise(r=>win.once('closed',r));for(const type of ['mouseMove','mouseDown','mouseUp']){win.webContents.sendInputEvent({type,...point,button:'left',clickCount:1});await delay(80);}await closed;
  }
  now=new Date(2026,9,10,5).getTime();quiet=true;await enter();assert.equal(emitted,3);quiet=false;await enter();assert.equal(emitted,4,'DND did not consume the next greeting');
  await until(()=>tip.window&&tip.window.webContents.executeJavaScript("document.querySelector('.t_m_center.text')?.textContent.includes('早上好')"));
  assert.equal(getPetInfo().info.yb,300);
  console.log('PASS production enter handler, offline morning/evening/night bubbles, owner/reply, native reply clicks, once-per-period and DND. Screenshots:',temp);
  clearTimeout(timeout);BrowserWindow.getAllWindows().forEach(win=>win.destroy());app.quit();
}).catch(error=>{console.error(error);app.exit(1);});
