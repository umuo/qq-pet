// Run with: node_modules/.bin/electron tests/pet-pointer.electron.cjs
// Uses a hidden test window and temporary userData; no pet save is opened.
const { app, BrowserWindow } = require('electron');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const { installHandCursor } = require('../src/windows/util/handCursor');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'qq-pet-pointer-'));
app.setPath('userData', path.join(temp, 'userData'));
const url = p => pathToFileURL(path.join(root, p)).href;
let win;
const timeout = setTimeout(() => app.exit(2), 30000);
app.whenReady().then(async () => {
  win = new BrowserWindow({ show: false, width: 180, height: 180, webPreferences: { offscreen: true, backgroundThrottling: false } });
  installHandCursor(win);
  const html = `<html><head><base href="${url('src/windows/app.html')}">
    <script>window.RufflePlayer={config:{autoplay:'on',unmuteOverlay:'hidden',splashScreen:false,allowScriptAccess:true}};
    window.messages=[];window.cursorCalls=0;
    window.API={GetCursorPosition:()=>{cursorCalls++;return '90,30,0'},GetWindowRect:()=> '0,0,180,180'};
    window.electronAPI={html_ToMain_mouse:data=>messages.push({kind:'mouse',data}),html_ToMain_move:data=>messages.push({kind:'move',data})};
    window.Vue={createApp:options=>({mount(){window.view=options.data();for(const [key,fn] of Object.entries(options.methods))view[key]=fn.bind(view);view.swfPet={changeSwf(){}};}})};
    </script><script src="${url('src/windows/js/ruffle/ruffle.js')}"></script>
    <script src="${url('src/windows/util/move.js')}"></script>
    <script src="${url('src/windows/util/pet/facePoints.js')}"></script>
    <script src="${url('src/windows/util/pet/interactions.js')}"></script>
    </head><body><div id="app"><div id="appMain"><div id="move" style="width:180px;height:180px"></div></div></div>
    <script src="${url('src/windows/main/index.js')}"></script></body></html>`;
  const htmlPath = path.join(temp, 'test.html');
  fs.writeFileSync(htmlPath, html);
  await win.loadFile(htmlPath);
  // Match window.js: CSS is injected into app.html rather than linked from main/.
  await win.webContents.insertCSS(fs.readFileSync(path.join(root, "src/windows/main/index.css"), "utf8"));
  await win.webContents.executeJavaScript(`(async()=>{
    const player=RufflePlayer.newest().createPlayer();player.id='pet';document.getElementById('move').appendChild(player);
    await player.ruffle().load({url:${JSON.stringify(url('src/assets/Action/GG/Adult/peaceful/Stand.swf'))},allowScriptAccess:true});
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    await view.doMove();
    const samples=document.createElement('div');
    samples.innerHTML='<button style="cursor:pointer!important">Menu</button><input style="cursor:text!important"><button disabled style="cursor:not-allowed!important">Disabled</button><span style="cursor:move!important">Drag</span><svg style="cursor:crosshair!important"></svg>';
    samples.id='cursorSamples';samples.style.display='none';document.body.appendChild(samples);
  })()`);
  const send = async event => {
    win.webContents.sendInputEvent(event);
    await new Promise(resolve => setTimeout(resolve, 50));
  };
  await send({ type: 'mouseMove', x: 90, y: 90 });
  const normalCursor = await win.webContents.executeJavaScript("getComputedStyle(document.getElementById('move')).cursor");
  await send({ type: 'mouseDown', button: 'left', x: 90, y: 90, clickCount: 1 });
  const pressedCursor = await win.webContents.executeJavaScript("getComputedStyle(document.getElementById('move')).cursor");
  await send({ type: 'mouseMove', x: 110, y: 100 });
  await send({ type: 'mouseUp', button: 'left', x: 110, y: 100, clickCount: 1 });
  await send({ type: 'mouseDown', button: 'right', x: 90, y: 90, clickCount: 1 });
  await send({ type: 'mouseUp', button: 'right', x: 90, y: 90, clickCount: 1 });
  const result = await win.webContents.executeJavaScript(`({
    target:document.elementFromPoint(90,90).id,
    drag:messages.filter(m=>m.kind==='move').map(m=>m.data.next),
    rightClick:messages.some(m=>m.kind==='mouse'&&m.data.type==='rightClick'),
    released:!view.moveOut.isDown,
    cursorCalls
  })`);
  const cursorStyle = name => `url("data:image/x-icon;base64,${fs.readFileSync(path.join(root, 'src/assets/img_res/hand/focus', name + '.cur')).toString('base64')}"), pointer`;
  assert.ok(normalCursor === cursorStyle('normal'), 'hover cursor uses normal hand');
  assert.ok(pressedCursor === cursorStyle('press'), 'pressed cursor uses pressed hand');
  const sampleCursors = await win.webContents.executeJavaScript("Array.from(document.querySelectorAll('#cursorSamples > *'), el => getComputedStyle(el).cursor)");
  for (const [index, value] of sampleCursors.entries()) assert.ok(value === normalCursor, 'global hand cursor on sample ' + index);
  assert.equal(result.target, 'move');
  assert.deepEqual(result.drag, [[-20, -10]]);
  assert.equal(result.rightClick, true);
  assert.equal(result.released, true);
  assert.ok(result.cursorCalls > 0, 'SWF still queries the cursor with pointer events disabled');
  await win.webContents.executeJavaScript(`window.spots=new PetInteractions({root:document.getElementById('move'),pose:()=>({sex:'GG',age:'Adult',state:'peaceful'}),mode:()=>2,request:pose=>messages.push({kind:'poke',data:pose})});spots.hovered=true;spots.show();`);
  const point = await win.webContents.executeJavaScript(`(()=>{const r=document.querySelector('[data-pet-spot="H"]').getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`);
  await send({ type: 'mouseMove', ...point });
  await send({ type: 'mouseDown', button: 'left', ...point, clickCount: 1 });
  await send({ type: 'mouseUp', button: 'left', ...point, clickCount: 1 });
  assert.equal(await win.webContents.executeJavaScript("messages.filter(m=>m.kind==='poke').length"), 1, 'hotspot click triggers one reaction');
  await win.webContents.executeJavaScript('spots.show()');
  await send({ type: 'mouseMove', x: point.x + 1, y: point.y });
  await send({ type: 'mouseDown', button: 'left', ...point, clickCount: 1 });
  await send({ type: 'mouseMove', x: point.x + 15, y: point.y + 10 });
  await send({ type: 'mouseUp', button: 'left', x: point.x + 15, y: point.y + 10, clickCount: 1 });
  const afterDrag = await win.webContents.executeJavaScript("({pokes:messages.filter(m=>m.kind==='poke').length,moves:messages.filter(m=>m.kind==='move').length,events:messages.slice(-8)})");
  assert.equal(afterDrag.pokes, 1, 'dragging a hotspot does not trigger an interaction');
  assert.equal(afterDrag.moves, 2, 'dragging from a hotspot still moves the pet: ' + JSON.stringify(afterDrag.events));
  console.log('PASS: hand cursor states and real Ruffle drag/menu handlers', JSON.stringify(result));
  clearTimeout(timeout);
  win.destroy();
  app.quit();
}).catch(error => {
  console.error(error);
  if (win && !win.isDestroyed()) win.destroy();
  app.exit(1);
});
