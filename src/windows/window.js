const _require = eval("require");
const { BrowserWindow, ipcMain } = _require("electron");
const path = _require("path");
const fs = _require("fs");

let icon = "";
try {
  icon = path.join(__dirname, "../assets/penguin.ico");
} catch (e) {}

const defaultOption = {
  width: undefined,
  height: undefined,
  frame: false,
  transparent: true,
  resizable: false,
  icon,
  skipTaskbar: true,
  alwaysOnTop: true,
  hasShadow: false,
  backgroundColor: "#00000000",
  roundedCorners: false,
  webPreferences: {
    plugins: false,
    nodeIntegration: true,
    contextIsolation: true,
    worldSafeExecuteJavaScript: true,
    webSecurity: false,
  },
};

class addWindow {
  constructor() {
    this.wins = {};
    this.preloads = {};
    return this;
  }

  winOpacity = 1;
  canSeeWin = ["setup"];
  alwaysSeeWin = ["floatStyle"];
  opt = {
    names: [
      "setup",
      "rightMenu",
      "smallGame",
      "viewSwf",
      "store",
      "aiChat",
      "infoCard",
      "control",
      "tip",
      "windowTip",
    ],
  };

  open(option) {
    if (!option?.name) return Promise.reject("参数错误");

    const oldEntry = this.wins[option.name];
    if (oldEntry?.win && !oldEntry.win.isDestroyed()) {
      if (option.closeType === "hide") {
        oldEntry.win.show();
        if (typeof option.onshow === "function") option.onshow(oldEntry.win);
      }
      return Promise.resolve(oldEntry.win);
    }

    if (oldEntry?.option) this.cleanupOption(oldEntry.option);

    const winOption = this.normalizeOption(option);
    const entry = {
      win: null,
      preload: null,
      option,
      didFinishLoad: null,
      urlLoadingWin: null,
    };

    this.wins[option.name] = entry;
    option.default = winOption;
    entry.win = new BrowserWindow(winOption);

    return option.url ? this.openUrl(entry) : this.doListener(entry);
  }

  normalizeOption(option) {
    const sourceDefault = option.default || {};
    const webPreferences = {
      ...defaultOption.webPreferences,
      ...(sourceDefault.webPreferences || {}),
    };

    const winOption = {
      ...defaultOption,
      ...sourceDefault,
      webPreferences,
    };

    if (option.webPreferences) {
      winOption.webPreferences = {
        ...winOption.webPreferences,
        ...option.webPreferences,
      };
    }

    try {
      winOption.webPreferences.preload = path.join(
        __dirname,
        `./${option.loadFile || option.name}/preload.js`,
      );
    } catch (e) {}

    if (winOption.width && winOption.height && !winOption.notChangeSize) {
      winOption.width += 10;
      winOption.height += 10;
    }

    return winOption;
  }

  doListener(entry) {
    return new Promise((resolve) => {
      const win = entry.win;
      const option = entry.option;

      win.loadFile(path.join(__dirname, "./app.html"));
      win.setIgnoreMouseEvents(true);

      const jsFiles = ["./lib/icon/iconfont.js", "./lib/vue/vue.global.js"];
      if (option?.jsFiles) jsFiles.unshift(...option.jsFiles);
      if (option?.jsFilesAfter) jsFiles.push(...option.jsFilesAfter);
      jsFiles.push(`./${option.loadFile || option.name}/index.js`);

      const cssFiles = [
        "./lib/ant-design/antd.css",
        "./css/index.css",
        "./css/util.css",
        "./css/keyframes.css",
        `./${option.loadFile || option.name}/index.css`,
      ];
      if (option.cssFiles) cssFiles.unshift(...option.cssFiles);

      entry.didFinishLoad = () => {
        this.loadLocalWindow(entry, jsFiles, cssFiles);
      };
      win.webContents.on("did-finish-load", entry.didFinishLoad);

      resolve(win);
      win.removeMenu();
      if (option.default.openDevTools) win.openDevTools({ mode: "detach" });
      win.setIgnoreMouseEvents(false);

      this.callCreated(entry);
      this.bindCloseLifecycle(entry);
    });
  }

  loadLocalWindow(entry, jsFiles, cssFiles) {
    const win = entry.win;
    const option = entry.option;
    if (!win || win.isDestroyed()) return;

    try {
      const html = fs
        .readFileSync(path.join(__dirname, `./${option.loadFile || option.name}/index.html`))
        .toString();

      if (global.$test) this.winOpacity = 0.2;

      try {
        let opacity = getSys("opacity");
        if (opacity < 0 || !opacity) opacity = 0.1;
        const normalized = ((10 * opacity) | 0) / 10;
        if (normalized) this.winOpacity = normalized;
      } catch (e) {}

      if (this.opt.names.indexOf(option.name) !== -1) {
        win.setOpacity(1);
      } else {
        win.setOpacity(this.winOpacity);
      }

      win.webContents.executeJavaScript(`
        const seeApp = () => {
          const app = document.getElementById('app')
          app.style.display = 'flex'
          app.style.opacity = 1;
        }
        const changeOpacity = (opacity)=>{
          const app = document.getElementById('app')
          app.style.opacity = opacity || '1'
        }
        let appDom = document.getElementById('app');
        appDom.innerHTML = \`${html}\`;
        seeApp()
      `);
    } catch (e) {}

    for (const file of cssFiles) {
      try {
        const css = fs.readFileSync(path.join(__dirname, file)).toString();
        win.webContents.insertCSS(css);
      } catch (e) {}
    }

    for (const file of jsFiles) {
      try {
        const js = fs.readFileSync(path.join(__dirname, file)).toString();
        win.webContents.executeJavaScript(js);
      } catch (e) {}
    }

    if (typeof option.onload === "function") option.onload(win);
  }

  openUrl(entry) {
    return new Promise((resolve) => {
      const win = entry.win;
      const option = entry.option;

      entry.urlLoadingWin = new BrowserWindow({
        width: 80,
        height: 80,
        frame: false,
        transparent: true,
        skipTaskbar: true,
        alwaysOnTop: true,
      });
      entry.urlLoadingWin.setIgnoreMouseEvents(true);
      entry.urlLoadingWin.loadFile(path.join(__dirname, "./app.html"));

      win.loadURL(option.url);

      entry.didFinishLoad = () => {
        if (entry.urlLoadingWin?.close) entry.urlLoadingWin.close();
        entry.urlLoadingWin = null;
        win.show();
        win.focus();
        if (typeof option.onload === "function") option.onload(win);
      };
      win.webContents.on("did-finish-load", entry.didFinishLoad);

      resolve(win);
      win.removeMenu();
      if (option.default.openDevTools) win.openDevTools({ mode: "detach" });

      this.callCreated(entry);
      this.bindCloseLifecycle(entry);
    });
  }

  callCreated(entry) {
    const option = entry.option;
    if (typeof option.created !== "function") return;

    option.created({
      vm: entry.win,
      preloads: (handlers) => this.registerPreloads(option, handlers),
      getinfo: (items) => this.registerGetinfo(option, items),
      wsMethods: (items) => this.registerWsMethods(option, items),
    });
  }

  bindCloseLifecycle(entry) {
    const win = entry.win;
    const option = entry.option;

    win.on("close", (event) => {
      const isQuitting = typeof global.outProjectMain === "function" && global.outProjectMain();
      if (option.closeType === "hide" && !isQuitting) {
        if (typeof option.onhide === "function") option.onhide(win);
        event.preventDefault();
        win.hide();
      }
    });

    win.on("closed", () => {
      if (typeof option.onclose === "function") option.onclose(win);
      this.cleanupEntry(entry);
      entry.win = null;
    });
  }

  registerPreloads(option, handlers = {}) {
    this.removePreload(option);
    option.preloads = handlers || {};
    for (const channel in option.preloads) {
      ipcMain.on(channel, option.preloads[channel]);
    }
  }

  registerGetinfo(option, items = []) {
    this.removeGetinfo(option);
    option.getinfo = items || [];
    if (!global?.listenInfo) return;
    for (const item of option.getinfo) listenInfo(item);
  }

  registerWsMethods(option, items = []) {
    this.removeWsMethods(option);
    option.wsMethods = items || [];
    if (!global?.addWsBackMsg) return;
    for (const item of option.wsMethods) addWsBackMsg(item);
  }

  setPreload(handlers = {}) {
    for (const channel in handlers) {
      if (this.preloads[channel]) {
        ipcMain.removeListener(channel, this.preloads[channel]);
      }
      ipcMain.on(channel, handlers[channel]);
    }
    this.preloads = { ...this.preloads, ...handlers };
  }

  cleanupEntry(entry) {
    if (!entry) return;
    try {
      if (entry.win?.webContents && entry.didFinishLoad) {
        entry.win.webContents.removeListener("did-finish-load", entry.didFinishLoad);
      }
    } catch (e) {}
    try {
      if (entry.urlLoadingWin?.close) entry.urlLoadingWin.close();
    } catch (e) {}
    entry.urlLoadingWin = null;
    this.cleanupOption(entry.option);
  }

  cleanupOption(option) {
    this.removePreload(option);
    this.removeGetinfo(option);
    this.removeWsMethods(option);
  }

  removePreload(option) {
    if (!option?.name) return;
    const handlers = option.preloads || {};
    for (const channel in handlers) {
      ipcMain.removeListener(channel, handlers[channel]);
    }
    option.preloads = {};
  }

  removeGetinfo(option) {
    if (!global?.unListenInfo || !option?.name) return;
    const items = option.getinfo || [];
    for (const item of items) unListenInfo(item);
    option.getinfo = [];
  }

  removeWsMethods(option) {
    if (!global?.deleteWsBackMsg || !option?.name) return;
    const items = option.wsMethods || [];
    for (const item of items) deleteWsBackMsg(item);
    option.wsMethods = [];
  }

  setOpacity(opacity) {
    this.winOpacity = !opacity || opacity <= 0 ? 0.1 : opacity;
    for (const name in this.wins) {
      const win = this.wins[name]?.win;
      if (!win?.setOpacity) continue;
      win.setOpacity(this.opt.names.indexOf(name) !== -1 ? 1 : this.winOpacity);
    }
  }
}

module.exports = addWindow;
