const _require = eval("require");
const { app, screen, BrowserWindow } = _require("electron");
const infoCard = _require("../infoCard/main.js");
const control = _require("../control/main.js");
const setup = _require("../setup/main.js");
const smallGame = _require("../smallGame/main.js");
const store = _require("../store/main.js");
const aiChat = _require("../aiChat/main.js");

const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

// 让 detach 出来的 DevTools 窗口也保持置顶，避免被 alwaysOnTop 的父窗口（宠物/main/aiChat）遮挡而“出不来”
const _raisedDevTools = new Set();
const raiseDevTools = () => {
  for (const w of BrowserWindow.getAllWindows()) {
    const wc = w.webContents;
    if (wc && typeof wc.getType === "function" && wc.getType() === "devtools" && !_raisedDevTools.has(w.id)) {
      w.setAlwaysOnTop(true);
      _raisedDevTools.add(w.id);
    }
  }
};
const openDevToolsFor = (win) => {
  if (!win || win.isDestroyed() || win.webContents.isDevToolsOpened()) return;
  win.webContents.openDevTools({ mode: "detach" });
  win.webContents.once("devtools-opened", raiseDevTools);
};

class mainClass {
  constructor() {
    this.window = null;
    this.show = false;
    this.name = "rightMenu";
  }

  positionType = null;
  menuSide = "right";

  cleate(options = {}) {
    const { nowPosition = [0, 0], positionType } = options;
    this.positionType = positionType;
    this.width = 340;
    this.height = 300;

    const position = this.getWindowPosition(nowPosition, positionType);
    const self = this;

    windowsMain
      .open({
        name: this.name,
        loadFile: "popups/" + this.name,
        jsFiles: ["./util/move.js"],
        default: {
          width: this.width,
          height: this.height,
          x: position[0],
          y: position[1],
          alwaysOnTop: true,
        },
        created(backVm) {
          const { vm, preloads, getinfo } = backVm;
          vm.setIgnoreMouseEvents(true, { forward: true });

          const changedMenu = {};
          const updateMenuItem = (item, where) => {
            if (!item?.label || !where?.length) return;
            const key = "w" + where.join("-");
            if (changedMenu[key] === item.value) return;
            changedMenu[key] = item.value;
            vm.webContents.send("rightMenu_m_bus_h", {
              data: item,
              type: "changeMenu",
              where,
            });
          };

          const updateGrowthMenu = (petInfo) => {
            let active = null;
            for (const key in petInfo.activeOption) {
              if (petInfo.activeOption[key] && key !== "ill") active = petInfo.activeOption[key];
            }

            const item = active
              ? { label: "停止状态", value: "stopState" }
              : petInfo?.maxInfo?.stopGrowth
                ? { label: "开启成长", value: "openGrowth" }
                : { label: "停止成长", value: "stopGrowth" };

            updateMenuItem(item, [7]);
          };

          const updateMuteMenu = (sysInfo) => {
            updateMenuItem(
              sysInfo.doNotDisturb
                ? { label: "关闭免打扰", value: "closeMute", new: true }
                : { label: "开启免打扰", value: "openMute" },
              [6, 1],
            );
          };

          let canUseMenu = false;
          const keepFocusItems = ["4-0"];

          preloads({
            rightMenu_h_say_m: (event, say) => {
              console.log(say, " --- rightMenu_h_say_m say ");
            },
            rightMenu_h_bus_m: (event, val) => {
              if (val.event === "mounted") {
                updateGrowthMenu(getPetInfo());
                updateMuteMenu(getSys());
                vm.on("blur", () => {
                  if (canUseMenu) {
                    setTimeout(() => {
                      if (self.show) vm.focus();
                    }, 200);
                  } else {
                    self.doClose();
                  }
                });
                vm.webContents.send("rightMenu_m_bus_h", {
                  type: "load",
                  positionType: self.positionType,
                  menuSide: self.menuSide,
                });
                vm.focus();
                return;
              }

              if (val.event === "close") self.doClose();
            },
            rightMenu_h_eventMouse_m: (event, val) => {
              canUseMenu = !!val.canDoType;
              vm.setIgnoreMouseEvents(!canUseMenu, { forward: true });
            },
            rightMenu_h_setItem_m: (event, val) => {
              self.handleMenuItem(val, keepFocusItems, vm);
            },
          });

          getinfo([
            {
              event: "pet",
              name: self.name,
              fn: (petInfo) => updateGrowthMenu(petInfo),
            },
            {
              event: "system",
              name: self.name,
              fn: (sysInfo) => updateMuteMenu(sysInfo),
            },
          ]);
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

  getWindowPosition(nowPosition, positionType) {
    if (positionType !== "followMain") {
      return [
        Math.trunc(nowPosition[0] - this.width / 2),
        Math.trunc(nowPosition[1] - this.height),
      ];
    }

    const mainWin = global.windowsMain?.wins?.main?.win;
    const petBounds =
      mainWin && !mainWin.isDestroyed?.() && mainWin.getBounds
        ? mainWin.getBounds()
        : {
            x: nowPosition[0] - 90,
            y: nowPosition[1] - 90,
            width: 180,
            height: 180,
          };

    const fallbackScreenSize =
      typeof getScreenSize === "function" ? getScreenSize() : [1440, 900];
    const display = screen.getDisplayMatching(petBounds);
    const workArea = display?.workArea || {
      x: 0,
      y: 0,
      width: fallbackScreenSize[0] || 1440,
      height: fallbackScreenSize[1] || 900,
    };
    const rightEdge = workArea.x + workArea.width;
    const bottomEdge = workArea.y + workArea.height;
    const gap = 4;

    const leftMenuVisibleInset = 0;
    const rightMenuVisibleInset = 36;
    const rightX = petBounds.x + petBounds.width + gap - rightMenuVisibleInset;
    const leftX = petBounds.x - this.width - gap + leftMenuVisibleInset;
    const canOpenRight = rightX + this.width <= rightEdge;
    const canOpenLeft = leftX >= workArea.x;

    this.menuSide = canOpenRight || !canOpenLeft ? "right" : "left";
    let x = this.menuSide === "right" ? rightX : leftX;
    let y = petBounds.y + petBounds.height / 2 - this.height / 2;

    x = clamp(Math.trunc(x), workArea.x, rightEdge - this.width);
    y = clamp(Math.trunc(y), workArea.y, bottomEdge - this.height);

    return [x, y];
  }

  handleMenuItem(val, keepFocusItems, vm) {
    try {
      val.data = JSON.parse(val.data);
    } catch (e) {}

    const item = val.data || {};

    if (item.value === "openAiChat") {
      if (!aiChat.show) aiChat.cleate();
    } else if (item.value === "openSwfViewer") {
      if (global.toolWindow?.viewSwf) global.toolWindow.viewSwf.cleate();
    } else if (["food", "clean", "cure"].includes(item.value)) {
      if (control.show) control.useInState({ type: "active", opt: { value: item.value } });
    } else if (item.value === "stopGrowth") {
      setPetInfo({ maxInfo: { stopGrowth: true } });
      changeTraysIcon({ name: "pause" });
    } else if (item.value === "openGrowth") {
      setPetInfo({ maxInfo: { stopGrowth: false } });
      petControl.determineHealth({ communication: ["state", "startGrowth"] });
    } else if (item.value === "stopState") {
      const activeOption = getPetInfoOne("", "activeOption");
      activeOption[activeOption?.work ? "work" : activeOption?.study ? "study" : activeOption?.trip ? "trip" : ""].stopNow = true;
      setPetInfo({ activeOption });
      petControl.GrowUp.GrowUpMain({ unGrow: true });
    } else if (item.value === "quit") {
      app.quit();
    } else if (item.value === "petInfo") {
      infoCard.show ? infoCard.doClose() : infoCard.cleate();
    } else if (item.value === "openMute") {
      setSys({ name: "doNotDisturb", value: true });
    } else if (item.value === "closeMute") {
      setSys({ name: "doNotDisturb", value: false });
    } else if (item.value === "openStore") {
      if (!store.show) store.cleate();
    } else if (item.value === "openSetup") {
      if (!setup.show) setup.cleate();
    } else if (item.value === "smallGame") {
      if (!smallGame.show) smallGame.cleate();
    }

    if (item.value === "openDevTools") {
      openDevToolsFor(windowsMain.wins.main?.win);
      openDevToolsFor(windowsMain.wins.aiChat?.win);
    }

    if (item.value) {
      if (keepFocusItems.includes(item.id)) {
        vm.focus();
      } else {
        this.doClose();
      }
    }
  }

  init() {
    this.show = true;
  }

  doClose() {
    if (this.show && this.window && !this.window.isDestroyed()) {
      this.window.close();
    }
    this.show = false;
  }
}

const main = new mainClass();
module.exports = main;
