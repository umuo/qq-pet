const { app, BrowserWindow } = require('electron');
const assert = require('node:assert/strict'), fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'qq-pet-hd-'));
app.setPath('userData', path.join(temp, 'userData')); app.on('window-all-closed', () => {});
const saved = {}; global.$Store = { setItem(key, value) { saved[key] = JSON.parse(JSON.stringify(value)); } };
require('../src/ini/pet'); global.openSpeak = () => {};
require('../src/service/model/user').getLogs = async () => null;
global.windowsMain = new (require('../src/windows/window'))();
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(fn) { for (let i=0;i<150;i++) { if (await fn()) return; await delay(100); } throw Error('HD UI timeout'); }
const timeout = setTimeout(() => app.exit(2), 45000);
app.whenReady().then(async () => {
  const hd = require('../src/windows/util/hdImages');
  assert.equal(Object.keys(hd.hdPairs()).length, 710);
  const unsafe = 'background:url("../assets/Menu/ditu01.png")';
  assert.equal(hd.hdCss(unsafe, true), unsafe, 'mismatched dimensions keep original');
  assert.equal(hd.hdCss('background:url("https://example.com/assets/sysSeting/guanbi00.png")', true), 'background:url("https://example.com/assets/sysSeting/guanbi00.png")');
  const setup = require('../src/windows/popups/setup/main');
  async function open() {
    setup.cleate();
    await until(() => setup.window && setup.window.webContents.executeJavaScript("Array.from(document.querySelectorAll('.radio .label')).some(el=>el.textContent.includes('高清界面'))"));
    return setup.window;
  }
  let win = await open();
  const before = await win.webContents.executeJavaScript("(()=>{const el=document.querySelector('.close'),r=el.getBoundingClientRect();return {width:r.width,height:r.height,background:getComputedStyle(el).backgroundImage,cursor:getComputedStyle(el).cursor}})()");
  assert.ok(before.background.includes('image-set(') && before.background.includes('@2x.png'));
  assert.ok(before.cursor.includes('data:image/x-icon'));
  await win.webContents.executeJavaScript(`(()=>{
    const img=document.createElement('img');img.id='hdProbe';img.src='../assets/sysSeting/guanbi00.png';document.body.appendChild(img);
    const bg=document.createElement('div');bg.id='inlineProbe';bg.style.backgroundImage='url("../assets/sysSeting/guanbi00.png")';document.body.appendChild(bg);
  })();void 0;`);
  await until(() => win.webContents.executeJavaScript("document.getElementById('hdProbe').complete && document.getElementById('hdProbe').currentSrc.includes('@2x.png')"));
  const image = await win.webContents.executeJavaScript("(()=>{const el=document.getElementById('hdProbe');return {width:el.naturalWidth,height:el.naturalHeight,background:document.getElementById('inlineProbe').style.backgroundImage}})()");
  const low = fs.readFileSync(path.resolve(__dirname, '../src/assets/sysSeting/guanbi00.png'));
  assert.equal(image.width, low.readUInt32BE(16)); assert.equal(image.height, low.readUInt32BE(20));
  assert.ok(image.background.includes('image-set('));
  // Vue changes an existing image's source; don't leave its previous HD srcset behind.
  await win.webContents.executeJavaScript("document.getElementById('hdProbe').src='../assets/sysSeting/guanbi01.png';void 0;");
  await until(() => win.webContents.executeJavaScript("document.getElementById('hdProbe').currentSrc.includes('guanbi01@2x.png')"));
  const point = await win.webContents.executeJavaScript("(()=>{const row=Array.from(document.querySelectorAll('.radio')).find(el=>el.textContent.includes('高清界面'));row.scrollIntoView();const r=row.querySelector('.choose').getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()");
  for (const type of ['mouseMove','mouseDown','mouseUp']) { win.webContents.sendInputEvent({type,...point,button:'left',clickCount:1}); await delay(80); }
  await until(() => getSys().hdImages === false);
  assert.equal(saved.sys.hdImages, false, 'actual settings click saves the preference');
  const closed = new Promise(resolve => win.once('closed', resolve));win.close();await closed;
  // Simulate restoring persisted settings into the existing store API.
  setSys({init:saved.sys});
  win = await open();
  const after = await win.webContents.executeJavaScript("(()=>{const el=document.querySelector('.close'),r=el.getBoundingClientRect();return {width:r.width,height:r.height,background:getComputedStyle(el).backgroundImage}})()");
  assert.equal(after.width, before.width); assert.equal(after.height, before.height);
  assert.ok(!after.background.includes('image-set('));
  assert.ok(after.background.includes('sysSeting/guanbi00.png'));
  console.log('PASS HD setup backgrounds, dynamic image/inline style, unchanged intrinsic/layout sizes, hand cursor, native settings toggle and persisted reopen', JSON.stringify({before:{...before,cursor:'verified hand'},after,image}));
  fs.writeFileSync(path.join(temp,'setup.png'),(await win.webContents.capturePage()).toPNG());
  clearTimeout(timeout);BrowserWindow.getAllWindows().forEach(win => win.destroy());app.quit();
}).catch(error => { console.error(error); app.exit(1); });
