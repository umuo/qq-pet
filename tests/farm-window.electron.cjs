// Actual formal farm UI, temporary Ruffle storage and an in-memory pet save.
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'qq-pet-farm-window-'));
app.setPath('userData', path.join(temp, 'userData'));
app.on('window-all-closed', () => {});
const saves = [];
global.$Store = { setItem(key, value) { saves.push({ key, value: JSON.parse(JSON.stringify(value)) }); } };
require('../src/ini/pet');
const { farm } = require('../src/service/gameplay/farm');
const timeout = setTimeout(() => app.exit(2), 65000);
const delay = ms => new Promise(r => setTimeout(r, ms));
async function until(fn) { for (let i = 0; i < 150; i++) { if (await fn()) return; await delay(100); } throw Error('Farm UI timeout'); }
app.whenReady().then(async () => {
  global.windowsMain = new (require('../src/windows/window'))();
  const open = windowsMain.open.bind(windowsMain);
  windowsMain.open = option => { option.default.webPreferences = { offscreen: true, backgroundThrottling: false }; option.default.show = false; return open(option); };
  global.openSpeak = () => {};
  setPetInfo({ info: { name: '测试企鹅', host: '测试', sex: 'GG', health: 5, yb: 300, mood: 850, hunger: 2000, clean: 2000 }, maxInfo: { level: 10, hunger: 4000, clean: 4000 } });
  const view = require('../src/windows/popups/farm/main'); view.cleate();
  await until(() => view.window && view.window.webContents.executeJavaScript("typeof document.getElementById('farmPlayer')?.farmAll==='function' && !document.querySelector('nav button').disabled"));
  const win = view.window;
  assert.equal(getPetInfo().info.yb, 0); assert.equal(farm().view().wallet, 300);
  const stage = await win.webContents.executeJavaScript("(()=>{const r=document.getElementById('farm-stage').getBoundingClientRect();return {x:r.x,y:r.y}})()");
  async function click(x, y) {
    win.webContents.sendInputEvent({ type: 'mouseMove', x: Math.round(stage.x + x), y: Math.round(stage.y + y) }); await delay(50);
    win.webContents.sendInputEvent({ type: 'mouseDown', button: 'left', x: Math.round(stage.x + x), y: Math.round(stage.y + y), clickCount: 1 }); await delay(50);
    win.webContents.sendInputEvent({ type: 'mouseUp', button: 'left', x: Math.round(stage.x + x), y: Math.round(stage.y + y), clickCount: 1 }); await delay(300);
  }
  await click(662, 37);
  await delay(3000);
  await click(195, 224);
  await delay(1500); // The original shop detail grows into place over one second.
  fs.writeFileSync('/private/tmp/qq-pet-farm-detail.png', (await win.webContents.capturePage()).toPNG());
  await click(310, 420);
  fs.writeFileSync('/private/tmp/qq-pet-farm-after-buy.png', (await win.webContents.capturePage()).toPNG());
  await until(() => farm().view().wallet === 220);
  assert.equal(getPetInfo().playroom.farm.user.burden.find(item=>item.Items==='RadishSeed').number, 1);
  fs.writeFileSync('/private/tmp/qq-pet-farm-shop.png', (await win.webContents.capturePage()).toPNG());
  console.log('Farm shop screenshot: /private/tmp/qq-pet-farm-shop.png');
  assert.ok(await win.webContents.executeJavaScript("getComputedStyle(document.getElementById('farmPlayer').shadowRoot.querySelector('canvas')).cursor.includes('data:image')"));
  const normalCursor = await win.webContents.executeJavaScript("getComputedStyle(document.getElementById('farmPlayer').shadowRoot.querySelector('canvas')).cursor");
  win.webContents.sendInputEvent({type:'mouseDown',button:'left',x:stage.x+600,y:stage.y+40,clickCount:1}); await delay(100);
  const pressedCursor = await win.webContents.executeJavaScript("getComputedStyle(document.getElementById('farmPlayer').shadowRoot.querySelector('canvas')).cursor");
  assert.notEqual(pressedCursor, normalCursor); assert.ok(pressedCursor.includes('data:image'));
  win.webContents.sendInputEvent({type:'mouseUp',button:'left',x:stage.x+600,y:stage.y+40,clickCount:1}); await delay(100);
  assert.equal(await win.webContents.executeJavaScript("getComputedStyle(document.getElementById('farmPlayer').shadowRoot.querySelector('canvas')).cursor"), normalCursor);
  async function toolbar(target, index) {
    const point=await target.webContents.executeJavaScript(`(()=>{const r=document.querySelectorAll('nav button')[${index}].getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`);
    for(const type of ['mouseMove','mouseDown','mouseUp']) {target.webContents.sendInputEvent({type,...point,button:'left',clickCount:1});await delay(80);}
  }
  await toolbar(win, 0);
  await until(()=>getPetInfo().playroom.farm.user.farmland.filter(p=>p.crop==='RadishSeed').length===1);
  await toolbar(win, 1);
  setPetInfo({ info: { yb: 25 } });
  const closed = new Promise(r => win.once('closed', r)); win.close(); await closed;
  assert.equal(getPetInfo().info.yb, 245); assert.equal(getPetInfo().playroom.farm.session, null);
  assert.equal(getPetInfo().playroom.farm.user.username, '测试企鹅');
  assert.equal(getPetInfo().playroom.farm.user.farmland.filter(p=>p.crop==='RadishSeed').length,1);
  // Mature only this test fixture; opening the formal window must preserve its plot.
  const state=getPetInfo().playroom;for(const land of state.farm.user.farmland)if(land.crop)land.time=Math.floor(Date.now()/1000)-7*86400;
  setPetInfo({playroom:state});
  view.cleate(); await until(()=>view.window && view.window.webContents.executeJavaScript("typeof document.getElementById('farmPlayer')?.farmAll==='function' && !document.querySelector('nav button').disabled"));
  const reopened=view.window; await toolbar(reopened,2);
  await until(()=>getPetInfo().playroom.farm.user.warehouse.length>0);
  assert.equal(getPetInfo().playroom.farm.user.farmland.filter(p=>p.harvest!==undefined).length,1);
  const crashedClosed=new Promise(r=>reopened.once('closed',r));reopened.webContents.forcefullyCrashRenderer();await crashedClosed;
  assert.equal(getPetInfo().info.yb,245);assert.equal(getPetInfo().playroom.farm.session,null);
  assert.ok(getPetInfo().playroom.farm.user.warehouse.length>0);
  assert.equal(farm().recover({}),false);assert.equal(getPetInfo().info.yb,245);
  console.log('PASS: real farm purchase (80), inventory, native planting/care, reopen/harvest, renderer crash refund once, outside income preserved, normal/pressed canvas hand cursors');
  clearTimeout(timeout); for (const w of BrowserWindow.getAllWindows()) w.destroy(); app.quit();
}).catch(error => { console.error(error); for (const w of BrowserWindow.getAllWindows()) w.destroy(); app.exit(1); });
