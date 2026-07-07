const _require = eval("require");
const {
  app,
  Menu,
  MenuItem,
  Tray,
  nativeImage
} = _require("electron");
const path = _require("path");
const icons = path.join(__dirname, "../../assets/tray-icon.png");
const loadTrayIcon = function (p) {
  try {
    let img = nativeImage.createFromPath(p);
    if (img.isEmpty()) {
      return nativeImage.createFromPath(icons);
    }
    return img.resize({
      width: 18,
      height: 18
    });
  } catch (e) {
    return nativeImage.createFromPath(icons);
  }
};
class MenuCreate {
  menu = {};
  tray = {};
  constructor(e = {}) {
    this.menu = new Menu();
    this.tray = new Tray(loadTrayIcon(e?.icon || icons));
    this.tray.setToolTip(e?.title || "pet");
  }
  addMenus(e) {
    for (let t in e) {
      let a = e[t];
      this.menu.append(new MenuItem(a));
    }
  }
  addTrays(e) {
    for (let t in e) {
      if (e[t].on || e[t].Fn && !e[t].trayList) {
        this.tray.on(e[t].on, (a, r) => {
          if (e[t].trayList && e[t].trayList.length > 0) {
            const a = Menu.buildFromTemplate([...e[t].trayList]);
            this.tray.popUpContextMenu(a);
          } else if (e[t].Fn && e[t].Fn) {
            e[t].Fn({
              event: a,
              bounds: r
            });
          }
        });
      }
    }
  }
  visibleMenu(e, t) {
    this.menu.getMenuItemById(e).visible = t;
  }
  activeTraysIconTime = null;
  oldActiveTraysIcon = {};
  activeTraysIcon(e = {}) {
    let {
      name: t,
      time: a,
      change: r
    } = e;
    let s = getTranIcon(t);
    if (this.oldActiveTraysIcon?.opt?.needHead && !s?.opt?.must && !r) {
      return;
    }
    this.oldActiveTraysIcon = s;
    if (this.activeTraysIconTime) {
      clearTimeout(this.activeTraysIconTime);
    }
    if (typeof s.opt == "string") {
      try {
        this.tray.setImage(loadTrayIcon(path.join(__dirname, "../../assets/img_res/Tray/" + s.sex + "/" + s.opt)));
      } catch (e) {}
      return;
    }
    let n = e => {
      try {
        this.tray.setImage(loadTrayIcon(path.join(__dirname, "../../assets/img_res/Tray/" + s.sex + "/" + s.name + "/" + e + ".ico")));
      } catch (e) {}
      this.activeTraysIconTime = setTimeout(() => {
        let t = e + 1 > s.opt.end ? s.opt.start : e + 1;
        n(t);
      }, a || s?.time || 350);
    };
    if (s?.opt?.start && s?.opt?.end) {
      n(s.opt.start);
    }
  }
  setTrayToolTip(e) {
    this.tray.setToolTip(e || "pet");
  }
  destroyTray() {
    if (this.activeTraysIconTime) {
      clearTimeout(this.activeTraysIconTime);
      this.activeTraysIconTime = null;
    }
    if (this.tray.destroy) {
      this.tray.destroy();
      this.tray = {};
    }
  }
}
try {
  if (module) {
    module.exports = {
      MenuCreate
    };
  }
} catch (e) {}
let traysModel = {
  normal: {
    start: 1,
    end: 4
  },
  leave: "leave.ico",
  dirty: {
    start: 1,
    end: 4
  },
  event: {
    start: 1,
    end: 2
  },
  feast: {
    start: 1,
    end: 3,
    needHead: true
  },
  game: {
    start: 1,
    end: 4,
    needHead: true
  },
  hungry: {
    start: 1,
    end: 4
  },
  ill: {
    start: 1,
    end: 2,
    must: true
  },
  pause: {
    start: 1,
    end: 5,
    must: true
  },
  study: {
    start: 1,
    end: 4,
    needHead: true
  },
  trip: {
    start: 1,
    end: 3,
    needHead: true
  },
  work: {
    start: 1,
    end: 3,
    needHead: true
  },
  dead: {
    start: 1,
    end: 2,
    must: true
  }
};
const getTranIcon = e => ({
  sex: getPetInfo().info.sex == "GG" ? "Boy" : "Girl",
  name: e && traysModel[e] ? e : "normal",
  opt: e && traysModel[e] ? traysModel[e] : traysModel.normal
});
