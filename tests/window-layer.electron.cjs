// Verify actual macOS window levels, not only the alwaysOnTop boolean.
const { app, BrowserWindow } = require('electron');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { execFileSync } = require('node:child_process');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'qq-pet-layer-'));
app.setPath('userData', path.join(temp, 'userData'));
app.on('window-all-closed', () => {});
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const timeout = setTimeout(() => app.exit(2), 60000);
app.whenReady().then(async () => {
  const manager = new (require('../src/windows/window'))();
  const overlays = [];
  for (const [index, name] of ['main', 'control', 'tip', 'rightMenu'].entries()) {
    const loaded = {};
    loaded.promise = new Promise(resolve => { loaded.resolve = resolve; });
    const win = await manager.open({ name, url: 'data:text/html,<body>Pet overlay</body>',
      default: { width: 210 + index * 10, height: 180, show: false, x: 100, y: 100,
        webPreferences: { preload: undefined } }, onload: loaded.resolve });
    await loaded.promise;
    overlays.push(win);
    assert.equal(win.isAlwaysOnTop(), true);
    if (process.platform !== 'win32') assert.equal(win.isVisibleOnAllWorkspaces(), true);
  }
  const normal = await manager.open({ name: 'normalGame', url: 'data:text/html,<body>Game</body>',
    default: { width: 310, height: 180, alwaysOnTop: false, webPreferences: { preload: undefined } } });
  assert.equal(normal.isAlwaysOnTop(), false, 'ordinary game windows retain their policy');
  const competitor = new BrowserWindow({ width: 330, height: 180, x: 100, y: 100 });
  await competitor.loadURL('data:text/html,<body>Competing floating window</body>');
  competitor.setAlwaysOnTop(true, 'floating');
  competitor.focus();
  overlays[0].hide();
  overlays[0].showInactive();
  await delay(500);
  assert.equal(competitor.isFocused(), true, 'restoring the pet does not steal focus');
  if (process.platform === 'darwin') {
    const source = path.join(temp, 'layers.swift');
    fs.writeFileSync(source, `import CoreGraphics
import Foundation
let rows = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID) as! [[String: Any]]
let result = rows.filter { ($0[kCGWindowOwnerPID as String] as? Int) == ${process.pid} }.map { row -> [String: Any] in
  let bounds = row[kCGWindowBounds as String] as! [String: Any]
  return ["width": bounds["Width"]!, "layer": row[kCGWindowLayer as String]!]
}
let data = try! JSONSerialization.data(withJSONObject: result)
print(String(data: data, encoding: .utf8)!)
`);
    const rows = JSON.parse(execFileSync('/usr/bin/swift', [source], { encoding: 'utf8', timeout: 45000 }));
    const layer = win => {
      const width = win.getBounds().width;
      const row = rows.find(row => row.width === width);
      assert.ok(row, `window width ${width} is visible in macOS window list`);
      return row.layer;
    };
    for (const win of overlays) assert.ok(layer(win) > layer(competitor), 'pet/menu/bubble/control stay above floating windows');
    assert.ok(layer(normal) < layer(competitor));
    console.log('PASS actual macOS layers:', JSON.stringify(rows));
  }
  console.log('PASS desktop overlays, all-workspace visibility, restore without focus theft, ordinary game policy');
  clearTimeout(timeout);
  BrowserWindow.getAllWindows().forEach(win => win.destroy());
  app.quit();
}).catch(error => { console.error(error); app.exit(1); });
