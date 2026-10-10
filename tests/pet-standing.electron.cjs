// Actual Vue main renderer + Ruffle + native input; isolated from the user's save.
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'qq-pet-standing-renderer-')));
global.$Store = { setItem() {} };
require('../src/ini/pet');
app.on('window-all-closed', () => {});
const timeout = setTimeout(() => app.exit(2), 180000);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(fn) { for (let i = 0; i < 600; i++) { if (await fn()) return; await delay(100); } throw Error('Renderer timed out'); }
app.whenReady().then(async () => {
  global.windowsMain = new (require('../src/windows/window'))();
  setPetInfo({ info: { sex: 'GG', host: '测试', name: '测试企鹅', health: 5, growth: 100, mood: 1000, lastX: 100, lastY: 100 }, maxInfo: { level: 10 } });
  let openedMap = 0;
  const win = await windowsMain.open({ name: 'main', default: { width: 180, height: 180, show: false, webPreferences: { offscreen: true, backgroundThrottling: false } }, jsFiles: ['./util/move.js', './util/pet/facePoints.js', './util/pet/swfPet.js', './util/pet/interactions.js'],
    created: ({ vm, preloads }) => preloads({
      'html_bus-Main': (_, payload) => { if (payload.event === 'mounted') vm.webContents.send('main_bus-html', { type: 'load', bd: true, screenSize: [1920, 1080], nowPosition: [100, 100], maxSize: [180, 180], petInfo: getPetInfo() }); },
      'html_bus-main_openPlayroom': () => openedMap++
    })
  });
  await until(() => win.webContents.executeJavaScript("!!document.getElementById('app').__vue_app__"));
  await win.webContents.executeJavaScript("window.testView=document.getElementById('app').__vue_app__._instance.proxy; void 0");
  await until(() => win.webContents.executeJavaScript("testView.swfPet.swf?.oldNext.name==='normal' && !testView.swfPet.swf.changeIng"));
  for(const sex of ['GG','MM']) {
    setPetInfo({info:{sex,mood:1000}});win.webContents.send('main_bus-html_setPet',getPetInfo());
    await until(()=>win.webContents.executeJavaScript("testView.swfPet.router.sex==='"+sex+"'"));
    await win.webContents.executeJavaScript("testView.swfPet.changeSwf('appear'); void 0");
    await until(()=>win.webContents.executeJavaScript("testView.swfPet.swf.oldNext.name==='normal' && !testView.swfPet.swf.changeIng && testView.swfPet.swf.oldNext.src.includes('/"+sex+"/Adult/happy/Stand.swf')"));
    for(let i=0;i<1;i++) {
      await win.webContents.executeJavaScript("(()=>{const target=testView.swfPet.router.getRouter('play');target.src=target.src.replace(/P[0-9]+.swf$/, 'P1.swf');testView.swfPet.swf.nextSwf(target);})(); void 0");
      await until(()=>win.webContents.executeJavaScript("testView.swfPet.swf.oldNext.name==='play' && !testView.swfPet.swf.changeIng"));
      console.log('PLAY',sex,await win.webContents.executeJavaScript("({src:testView.swfPet.swf.oldNext.src,frames:testView.swfPet.swf.dom.TotalFrames()})"));
      await until(()=>win.webContents.executeJavaScript("testView.swfPet.swf.oldNext.name==='normal' && !testView.swfPet.swf.changeIng"));
      const pose=await win.webContents.executeJavaScript("({state:testView.swfPet.router.state,src:testView.swfPet.swf.oldNext.src,frames:testView.swfPet.swf.dom.TotalFrames(),visible:getComputedStyle(document.getElementById('pet')).visibility})");
      assert.equal(pose.state,'happy');assert.ok(pose.src.includes('/'+sex+'/Adult/happy/Stand.swf'));assert.equal(pose.frames,1);assert.equal(pose.visible,'visible');
    }
    const file=path.join(app.getPath('userData'),sex+'-standing.png');fs.writeFileSync(file,(await win.webContents.capturePage()).toPNG());console.log('PASS actual '+sex+' Ruffle actions return to happy Stand. Screenshot:',file);
  }
  clearTimeout(timeout); win.destroy(); app.quit();
}).catch(error => { console.error(error); for (const win of BrowserWindow.getAllWindows()) win.destroy(); app.exit(1); });
