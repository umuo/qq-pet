const _require = eval("require");
const path = _require("path");
const {
  globalShortcut
} = _require("electron");
const execFile = _require("child_process").execFile;
let setup = "";
let store = "";
let windowTip = "";
let floatStyle = "";
try {
  setup = _require("../popups/setup/main.js");
  store = _require("../popups/store/main.js");
  windowTip = _require("../popups/windowTip/main.js");
  floatStyle = _require("../tool/floatStyle/main.js");
} catch (t) {}
let isPrintIng = false;
let shortcutKeysTime = null;
class Shotycuts {
  vm = null;
  map = {};
  loopFn = {};
  constructor(t) {
    if (t?.vm) {
      this.vm = t.vm;
    }
    if (t?.mainShortcutKeys) {
      this.loopFn.mainShortcutKeys = t.mainShortcutKeys;
    }
    return this;
  }
  init() {
    let t = getSys("shortcuts");
    let e = Object.keys(t);
    for (let r in e) {
      this.upShotycut(e[r], t[e[r]]);
    }
    return this;
  }
  upShotycut(t, e, r) {
    if (isEmptyArray(e) || !t || !this.methods?.[t] && !r) {
      return {
        map: this.map,
        state: false
      };
    } else {
      e = this.doKeys(e);
      globalShortcut.registerAll(e, r || this.methods[t]);
      this.map[t] = e;
      return {
        addShotycutName: t,
        map: this.map,
        state: true
      };
    }
  }
  unShotycut(t) {
    if (!t || !this.map[t]) {
      return {
        map: this.map,
        state: false
      };
    }
    let e = true;
    for (let r in this.map[t]) {
      if (!globalShortcut.isRegistered(this.map[t][r])) {
        e = false;
        break;
      }
      globalShortcut.unregister(this.map[t][r]);
    }
    if (e) {
      delete this.map[t];
      return {
        deleteShotycutName: t,
        map: this.map,
        state: true
      };
    } else {
      return {
        map: this.map,
        state: false
      };
    }
  }
  upDataShotycut(t, e) {
    if (!isEmptyArray(e) && t && this.map[t]) {
      if (this.unShotycut(t).state) {
        return {
          ...this.upShotycut(t, e),
          upDataShotycutName: t
        };
      } else {
        return undefined;
      }
    } else {
      return {
        map: this.map,
        state: false
      };
    }
  }
  cleanOur() {
    globalShortcut.unregisterAll();
    this.map = {};
    return {
      map: this.map,
      state: true
    };
  }
  AddLoop(t, e, r) {
    this.loopFn[t.name] = t.fns;
    this.upShotycut(t.name, e, r);
    return this;
  }
  deleteLoop(t, e) {
    this.loopFn[t] = null;
    delete this.loopFn[t];
    this.unShotycut(e);
  }
  loopShortcut = (t, e) => {
    if (shortcutKeysTime) {
      return;
    }
    let r = this.loopFn?.[t];
    if (!r || typeof r != "function") {
      return;
    }
    r = r();
    let s = false;
    for (let t in r.manyFn) {
      let e = r.manyFn[t];
      for (let t in e.code) {
        if (globalShortcut.isRegistered(e.code[t], e.fn)) {
          globalShortcut.unregister(e.code[t], e.fn);
          s = false;
        } else if (!r.unSet) {
          globalShortcut.register(e.code[t], e.fn);
          s = true;
        }
      }
    }
    if (shortcutKeysTime) {
      clearTimeout(shortcutKeysTime);
    }
    shortcutKeysTime = setTimeout(() => {
      shortcutKeysTime = null;
    }, e || 1000);
    return s;
  };
  keysMap = {
    0: "num0",
    1: "num1",
    2: "num2",
    3: "num3",
    4: "num4",
    5: "num5",
    6: "num6",
    7: "num7",
    8: "num8",
    9: "num9",
    "/": "numdiv",
    "*": "nummult",
    "-": "numsub",
    "+": "numadd",
    ".": "numdec"
  };
  doKeys(t) {
    let e = "";
    for (let r in t) {
      if (r != 0) {
        e += "+";
      }
      e += this.keysMap[t[r]] || t[r];
    }
    e = [e];
    return e;
  }
  methods = {
    screenshot: () => {
      if (!this.vm) {
        return;
      }
      if (isPrintIng) {
        console.log("isPrintIng");
        return;
      }
      isPrintIng = true;
      var e = execFile("screencapture", ["-ic"]);
      e.on("exit", function (t) {
        isPrintIng = false;
        if (t) {
          this?.vm?.webContents?.paste();
        }
      });
    },
    god: () => {
      if (shortcutKeysTime) {
        return;
      }
      let t = "";
      t = this.loopShortcut("mainShortcutKeys") ? "上帝模式已开启 ctrl 加上下左右有不一样的惊喜~~~" : "上帝模式已关闭";
      openSpeak({
        data: {
          type: "text",
          data: t
        },
        nextActiveStr: "speak"
      });
    },
    openStting: () => {
      let t = setup;
      if (t.show) {
        t.doClose();
      } else {
        t.cleate();
      }
    },
    selfFn: t => t
  };
}
try {
  if (module) {
    module.exports = {
      Shotycuts
    };
  }
} catch (t) {}
