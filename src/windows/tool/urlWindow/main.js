const _require = eval("require");
const { BrowserWindow, shell } = _require("electron");
const path = _require("path");
const doTypes = _require("./doTypes");

class mainClass {
  constructor() {
    this.window = null;
    this.show = false;
    this.name = "urlWindow";
  }

  defaultImagePaths = [
    path.join(__dirname, "./instructions.png"),
    path.join(__dirname, "./urlwindow.gif"),
  ];
  defaultImagePath = path.join(__dirname, "./instructions.png");

  cleate() {
    this.width = 600;
    this.height = 332;

    let childWindow = null;
    let moveTimer = null;
    let mouseForward = false;
    let disposed = false;
    const self = this;

    const cleanup = () => {
      if (disposed) return;
      disposed = true;
      if (moveTimer) clearTimeout(moveTimer);
      moveTimer = null;
      try {
        self.window?.removeListener?.("move", onMove);
      } catch (e) {}
      try {
        if (childWindow && !childWindow.isDestroyed()) childWindow.close();
      } catch (e) {}
      childWindow = null;
    };

    const childOptions = (parent) => ({
      parent,
      width: 600,
      height: 600,
      skipTaskbar: true,
      resizable: true,
      webPreferences: {
        nodeIntegration: true,
        sandbox: false,
      },
    });

    const createChildWindow = (parent) => {
      if (childWindow && !childWindow.isDestroyed()) return childWindow;

      childWindow = new BrowserWindow(childOptions(parent));
      childWindow.setOpacity(1);
      childWindow.setMenu(null);
      childWindow.setMinimizable(false);
      childWindow.setClosable(true);

      childWindow.on("closed", () => {
        childWindow = null;
        try {
          if (self.window && !self.window.isDestroyed()) self.doClose();
        } catch (e) {}
      });

      childWindow.webContents.on("new-window", (event, url) => {
        event.preventDefault();
        console.log("new window:", url);
        parent.webContents.send("urlWindow_m_bus_h", {
          data: { url, type: "new window" },
          type: "setUrl",
        });
      });

      childWindow.webContents.on("will-redirect", (event, url) => {
        console.log("rego:", url);
        event.preventDefault();
        parent.webContents.send("urlWindow_m_bus_h", {
          data: { url, type: "rego" },
          type: "setUrl",
        });
      });

      childWindow.webContents.on("did-navigate", (event, url) => {
        console.log("overRego:", url);
        event.preventDefault();
        parent.webContents.send("urlWindow_m_bus_h", {
          data: { url, type: "overRego" },
          type: "setUrl",
        });
      });

      return childWindow;
    };

    const syncPosition = () => {
      moveTimer = null;
      if (!childWindow || childWindow.isDestroyed()) return;
      const size = childWindow.getSize();
      console.log(size);
    };

    function onMove() {
      if (!moveTimer) moveTimer = setTimeout(syncPosition, 10);
    }

    windowsMain
      .open({
        name: this.name,
        loadFile: "tool/" + this.name,
        jsFiles: ["./util/move.js"],
        default: {
          width: this.width,
          height: this.height,
          resizable: true,
        },
        created(backVm) {
          const { vm, preloads } = backVm;
          childWindow = createChildWindow(vm);
          vm.on("move", onMove);
          syncPosition();

          vm.setIgnoreMouseEvents(mouseForward, { forward: true });

          preloads({
            urlWindow_h_say_m: (event, say) => {
              console.log(say, " --- urlWindow_h_say_m say");
            },
            urlWindow_h_bus_m: (event, val) => {
              console.log(13, val);

              if (val.event === "mounted") {
                vm.webContents.send("urlWindow_m_bus_h", {
                  data: "load",
                  type: "load",
                });
                return;
              }

              if (val.event === "close") {
                childWindow?.close();
                self.doClose();
                return;
              }

              if (val.event === "tourl") {
                console.log("tourl", val.url);
                const nextChild = createChildWindow(vm);
                nextChild.setTitle("url:  " + val.url);
                nextChild.webContents.once("did-finish-load", () => {
                  if (!nextChild.isDestroyed()) nextChild.setTitle("url:  " + val.url);
                });
                nextChild.loadURL(val.url);
                self.toGetSunDatas(nextChild);
                return;
              }

              if (val.event === "copacity") {
                console.log(val);
                if (childWindow && !childWindow.isDestroyed()) {
                  childWindow.setOpacity(val.opacity);
                }
                return;
              }

              if (val.event === "czd") {
                console.log(val);
                if (childWindow && !childWindow.isDestroyed()) {
                  childWindow.setAlwaysOnTop(!!val.disable, "normal");
                }
                vm.setAlwaysOnTop(true, "normal");
              }
            },
            urlWindow_h_bus_m_eventMouse: (event, val) => {
              mouseForward = !val.canDoType;
              vm.setIgnoreMouseEvents(mouseForward, { forward: true });
            },
          });
        },
        onload() {
          console.log("onload ", this.name);
          self.show = true;
        },
        onshow(win) {
          console.log("onshow ", this.name);
          self.window = win;
          self.show = true;
        },
        onhide() {
          console.log("onhide ", this.name);
          self.show = false;
        },
        onclose() {
          console.log("onclose ", this.name);
          cleanup();
          self.window = null;
          self.show = false;
        },
      })
      .then((win) => {
        this.window = win;
        this.init();
      })
      .catch((err) => {
        console.log(err);
      });
  }

  init() {
    this.show = true;
  }

  doClose() {
    if (this.window && !this.window.isDestroyed()) this.window.close();
    this.show = false;
  }

  toGetSunDatas(win) {
    if (!this.doType?.length) return;
    for (const type of this.doType) {
      if (doTypes[type]) win.webContents.executeJavaScript(doTypes[type]);
    }
  }

  openImages(paths) {
    const items = paths || this.defaultImagePaths;
    for (const item of items) {
      shell.openPath(item).then((err) => {
        if (err) console.error("打开失败:", err);
      });
    }
  }

  openImage(imagePath) {
    shell.openPath(imagePath || this.defaultImagePath).then((err) => {
      if (err) console.error("打开失败:", err);
    });
  }
}

const main = new mainClass();
module.exports = main;
