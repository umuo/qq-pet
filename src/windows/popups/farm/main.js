const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { farm } = require('../../../service/gameplay/farm');
const appFile = path.resolve(__dirname, '../../app.html');
const readScript = `({raw:localStorage.getItem('localhost//test'),id:localStorage.getItem('qqpet:farm-session')})`;
class FarmWindow {
  window = null;
  closing = null;
  name = 'farm';
  constructor() {
    let quitting=false;
    app.on('before-quit',event=>{
      if(!this.window||this.window.isDestroyed())return;
      // close prevents Electron's original quit while the SOL is captured.
      // Resume after settlement when the primary pet is not still animating exit.
      event.preventDefault();
      if(quitting)return;
      quitting=true;
      this.close().then(()=>{quitting=false;if(!require('../../../service/gameplay/exit').waitingForPet)app.quit();}).catch(error=>{quitting=false;console.error(error);});
    });
  }
  async readStorage() {
    const reader = new BrowserWindow({ show: false, webPreferences: { offscreen: true, contextIsolation: true, nodeIntegration: false } });
    try { await reader.loadFile(appFile); return await reader.webContents.executeJavaScript(readScript); }
    finally { reader.destroy(); }
  }
  recoverOnStartup(payload) {
    if (this.window && !this.window.isDestroyed()) return;
    farm().recover(payload);
  }
  cleate() {
    if (this.window && !this.window.isDestroyed()) { this.window.show(); this.window.focus(); return; }
    const assets = path.resolve(__dirname, '../../../assets/reference');
    if (!['qqfarm/Farm.swf', 'qqfarm/props.swf', 'qqfont.ttf', 'qqfarm/com/MyFarm/data/xml/skin.xml', 'qqfarm/com/MyFarm/data/xml/Crop.xml', 'qqfarm/com/MyFarm/data/xml/seed.xml', 'qqfarm/com/MyFarm/data/xml/props.xml'].every(p => fs.existsSync(path.join(assets, p)))) {
      if (typeof openSpeak === 'function') openSpeak({ data: { type: 'text', data: '农场资源不完整，暂时无法打开。' }, active: 'speak' });
      return;
    }
    windowsMain.open({ name: this.name, loadFile: 'popups/farm', jsFiles: ['./util/pet/sol.js'], default: { width: 732, height: 678, frame: true, transparent: false, alwaysOnTop: false, skipTaskbar: false, resizable: false, backgroundColor: '#f1f2de' },
      created: ({ vm, preloads, getinfo }) => {
        this.window = vm; this.closing = null;
        vm.setTitle('企鹅 · QQ 农场'); vm.setOpacity(1);
        let id = null;
        const state = () => { if (!this.closing && !vm.isDestroyed() && !vm.webContents.isCrashed()) vm.webContents.send('farm_m_wallet', farm().view()); };
        preloads({ farm_h_event: (event, payload) => {
          if (event.sender !== vm.webContents || this.closing) return;
          if (payload?.type === 'ready') {
            const result = farm().open(); id = result.id;
            vm.webContents.send('farm_m_boot', result); state();
          } else if (payload?.type === 'sync') { farm().sync(payload); state(); }
          else if (payload?.type === 'failed') { if (id) farm().close({ id }); state(); }
          else if (payload?.type === 'close') vm.close();
        } });
        getinfo([{ event: 'pet', name: 'farm', fn: state }]);
        const finish = async crashed => {
          if (this.closing) return this.closing;
          this.closing = (async () => {
            let payload;
            try {
              payload = crashed ? await this.readStorage() : await Promise.race([
                vm.webContents.executeJavaScript('window.captureFarm ? window.captureFarm() : ' + readScript),
                new Promise(resolve => setTimeout(() => resolve(null), 1500))
              ]);
            } catch (_) {}
            if (!payload && id) {
              try { payload = await this.readStorage(); } catch (_) {}
            }
            const session = getPetInfo().playroom?.farm?.session;
            if (session?.id === id) farm().close(payload?.id === id ? { ...payload, sequence: session.sequence + 1 } : { id });
            if (!vm.isDestroyed()) vm.destroy();
          })();
          return this.closing;
        };
        vm.on('close', event => { event.preventDefault(); finish(false).catch(console.error); });
        vm.webContents.on('render-process-gone', () => finish(true).catch(console.error));
        vm.on('closed', () => { if (id) farm().close({ id }); this.window = null; });
      }
    }).catch(console.error);
  }
  async close() { if (this.window && !this.window.isDestroyed()) this.window.close(); if (this.closing) await this.closing; }
}
module.exports = new FarmWindow();
