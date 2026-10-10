// Actual Vue main renderer + Ruffle + native input; isolated from the user's save.
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'qq-pet-trip-renderer-')));
global.$Store = { setItem() {} };
require('../src/ini/pet');
app.on('window-all-closed', () => {});
const timeout = setTimeout(() => app.exit(2), 40000);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(fn) { for (let i = 0; i < 200; i++) { if (await fn()) return; await delay(100); } throw Error('Renderer timed out'); }
app.whenReady().then(async () => {
  global.windowsMain = new (require('../src/windows/window'))();
  setPetInfo({ info: { sex: 'GG', host: '测试', name: '测试企鹅', health: 5, growth: 100, mood: 850, lastX: 100, lastY: 100 }, maxInfo: { level: 10 } });
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
  setPetInfo({ activeOption: { ...getPetInfo().activeOption, trip: { managedTravel: true, id: 1, city: '北京市' } } });
  win.webContents.send('main_bus-html_setPet', getPetInfo());
  await delay(1000);
  assert.equal(await win.webContents.executeJavaScript("getComputedStyle(document.getElementById('pet')).visibility"), 'visible');
  assert.equal(await win.webContents.executeJavaScript("document.querySelector('.travel-badge')===null"), true);
  assert.notEqual(await win.webContents.executeJavaScript("testView.swfPet.swf.oldNext.name"), 'hide');
  setPetInfo({ activeOption: { ...getPetInfo().activeOption, trip: null } });
  win.webContents.send('main_bus-html_setPet', getPetInfo());
  await delay(500);
  assert.equal(await win.webContents.executeJavaScript("getComputedStyle(document.getElementById('pet')).visibility"), 'visible');
  setPetInfo({activeOption:{...getPetInfo().activeOption,desktopGame:'rope'}});
  win.webContents.send('main_bus-html_setPet',getPetInfo());
  await until(()=>win.webContents.executeJavaScript("testView.swfPet.swf.oldNext.name==='hide' && !testView.swfPet.swf.changeIng"));
  assert.equal(await win.webContents.executeJavaScript("getComputedStyle(document.getElementById('pet')).visibility"),'hidden');
  setPetInfo({activeOption:{...getPetInfo().activeOption,desktopGame:null}});
  win.webContents.send('main_bus-html_setPet',getPetInfo());
  await until(()=>win.webContents.executeJavaScript("testView.swfPet.swf.oldNext.name==='normal' && !testView.swfPet.swf.changeIng"));
  assert.equal(await win.webContents.executeJavaScript("getComputedStyle(document.getElementById('pet')).visibility"),'visible');
  console.log('PASS: real Ruffle/Vue pet remains visible during and after travel; no placeholder badge; desktop game hide/restore still works');
  clearTimeout(timeout); win.destroy(); app.quit();
}).catch(error => { console.error(error); for (const win of BrowserWindow.getAllWindows()) win.destroy(); app.exit(1); });
