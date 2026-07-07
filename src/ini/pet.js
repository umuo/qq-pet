(() => {
  var e = {
    info: {
      name: "",
      host: "",
      sex: "",
      growth: "",
      hunger: "",
      clean: "",
      health: "",
      mood: "",
      birthDay: "",
      intel: "",
      charm: "",
      strong: "",
      onLineTime: "",
      lastX: "",
      lastY: "",
      yb: 300,
      lastLoginTime: "",
      onlineDataTime: 0
    },
    maxInfo: {
      stopGrowth: false,
      level: "",
      upGrowth: "",
      nextGrowth: "",
      growthRate: 260,
      hunger: "",
      clean: "",
      health: 5,
      mood: 1000
    },
    activeValue: {
      work: {},
      study: {
        chinese: 0,
        mathematics: 0,
        politics: 0,
        music: 0,
        art: 0,
        manner: 0,
        pe: 0,
        labouring: 0,
        wushu: 0
      }
    },
    activeOption: {
      work: null,
      study: null,
      trip: null,
      ill: null,
      die: null
    },
    otherOptions: {
      pinkDiamond: false,
      growth: 0,
      growthValue: 0,
      growthValue_next: 0,
      pinkDiamondLevel: 0,
      pinkDiamondBeginDate: 0,
      pinkDiamondExpirationDate: 0,
      sweetHeart: false
    },
    fishing: {
      fishes: [],
      harvestfish: 0,
      allvipcnt: 0,
      canusecnt: 0,
      power: 0,
      needTime: 0
    },
    listenMain: {}
  };
  const t = {
    chinese: "中文",
    mathematics: "数学",
    politics: "政治",
    music: "音乐",
    art: "艺术",
    manner: "礼仪",
    pe: "体育",
    labouring: "劳技",
    wushu: "武术"
  };
  global.isStudyUpLevel = e => {
    switch (e) {
      case 9:
      case 20:
      case 40:
      case 95:
        return true;
      default:
        return false;
    }
  };
  global.getStudyLevel = (e, n, i) => {
    let a = "";
    if (i) {
      switch (true) {
        case n >= 9 && n < 20:
          a = "小学";
          break;
        case n >= 20 && n < 40:
          a = "中学";
          break;
        case n >= 40 && n < 95:
          a = "大学";
          break;
        case n >= 95:
          a = "研究生";
      }
      return a + t[e];
    }
    switch (true) {
      case n > 0 && n < 9:
        a = "小学";
        break;
      case n > 9 && n <= 20:
        a = "中学";
        break;
      case n > 20 && n <= 40:
        a = "大学";
        break;
      case n > 40 && n <= 95:
        a = "研究生";
        break;
      case n > 95:
        a = "学无止境";
    }
    return a + t[e];
  };
  const n = ["growth", "hunger", "clean", "health", "mood", "intel", "charm", "strong", "onLineTime"];
  const i = {
    growth: 0,
    hunger: 0,
    clean: 0,
    health: 0,
    mood: 0,
    intel: 0,
    charm: 0,
    strong: 0,
    onLineTime: 0
  };
  const a = ["listenMain", "system", "cache"];
  global.setPetInfo = (t = {}) => {
    let {
      info: l,
      maxInfo: s,
      activeOption: r,
      otherOptions: c,
      activeValue: h,
      fishing: f
    } = t;
    let u = null;
    let g = null;
    let m = null;
    let p = null;
    let d = null;
    changeFishing = null;
    if (l) {
      for (let t in e.info) {
        if (i[t] == 0) {
          i[t] = 1;
        }
        if ((!!l[t] || l[t] === 0) && l[t] != e.info[t]) {
          if (n.includes(t) && !l[t]) {
            l[t] = "0";
          }
          g ||= {};
          g[t] = l[t];
          if (g[t] - e.info[t] > 0) {
            g["add" + t] = g[t] - e.info[t];
          }
          e.info[t] = g[t];
        }
      }
      for (let t in i) {
        if (i[t] == 0) {
          e.info[t] = "0";
        }
        i[t] = 0;
      }
    }
    if (s) {
      for (let t in e.maxInfo) {
        if ((!!s[t] || s[t] === 0 || s[t] === false) && s[t] != e.maxInfo[t]) {
          u ||= {};
          u[t] = s[t];
          e.maxInfo[t] = u[t];
        }
      }
    }
    if (r) {
      for (let t in e.activeOption) {
        if (r[t] != e.activeOption[t]) {
          m ||= {};
          m[t] = r[t];
          e.activeOption[t] = m[t];
        }
      }
    }
    if (h) {
      for (let t in e.activeValue) {
        if (h[t] != e.activeValue[t]) {
          p ||= {};
          p[t] = h[t];
          e.activeValue[t] = p[t];
        }
      }
    }
    if (c) {
      for (let t in e.otherOptions) {
        if (c[t] != null && c[t] != e.otherOptions[t]) {
          d ||= {};
          d[t] = c[t];
          e.otherOptions[t] = d[t];
        }
      }
    }
    if (f) {
      for (let t in e.fishing) {
        if (f[t] != null && f[t] != e.fishing[t]) {
          changeFishing ||= {};
          changeFishing[t] = f[t];
          e.fishing[t] = changeFishing[t];
        }
      }
    }
    if (!u && !g && !m && !d && !p && !changeFishing) {
      return;
    }
    let b = {
      ...e
    };
    for (let e in a) {
      if (b?.[a[e]]) {
        delete b?.[a[e]];
      }
    }
    let v = {
      changeInfo: g,
      changeMax: u,
      changeValue: p,
      ...b
    };
    $Store.setItem("pet", v);
    if (!o) {
      if (e.listenMain.pet) {
        for (let t in e.listenMain.pet) {
          e.listenMain.pet[t](v);
        }
      }
      return v;
    }
  };
  global.getPetInfo = t => {
    let n = {
      ...e
    };
    for (let e in a) {
      if (n?.[a[e]]) {
        delete n?.[a[e]];
      }
    }
    return n;
  };
  global.getPetInfoOne = (t, n) => {
    if (n) {
      if (t) {
        return e?.[n]?.[t] || "";
      } else {
        return e?.[n] || {};
      }
    }
    let i = "";
    for (let n in e) {
      for (let a in e[n]) {
        if (a == t) {
          i = e[n][a];
          break;
        }
      }
      if (i !== "") {
        break;
      }
    }
    return i;
  };
  const l = ["hunger", "clean", "mood", "intel", "charm", "strong"];
  global.addPetInfo = t => {
    let n = {};
    for (let i in t) {
      if (t[i] && l.includes(i) && +e.info[i] == +e.info[i] && +t[i] == +t[i]) {
        let a = +e.info[i] + +t[i];
        if (a <= (e?.maxInfo[i] || 99999999999999)) {
          n[i] = a;
        }
      }
    }
    setPetInfo({
      info: n
    });
  };
  global.listenInfo = t => {
    let {
      event: n,
      name: i,
      fn: a
    } = t;
    e.listenMain[n] ||= {};
    e.listenMain[n][i] = a;
  };
  global.unListenInfo = t => {
    let {
      event: n,
      name: i
    } = t;
    if (e.listenMain[n][i]) {
      e.listenMain[n][i] = null;
      delete e.listenMain[n][i];
    }
  };
  e.system = {
    clip: true,
    doNotDisturb: false,
    startupSelf: false,
    shortcuts: {
      screenshot: ["ALT", "Q"],
      openStting: ["ALT", "D"],
      god: ["ALT", "."]
    },
    opacity: 1,
    getOption: false,
    floatStyle: false
  };
  global.setSys = (t = {}) => {
    let {
      name: n,
      value: i,
      upName: a,
      init: l
    } = t;
    if (n == "opacity" || l?.opacity != null) {
      windowsMain.setOpacity(n == "opacity" ? i || 1 : l.opacity || 1);
    }
    if (l) {
      e.system = l;
      return;
    }
    if (!n) {
      return;
    }
    if (a) {
      if (!e.system[a]) {
        return;
      }
      e.system[a][n] = i;
    } else {
      e.system[n] = i;
    }
    if (o) {
      return;
    }
    let s = false;
    if (e.listenMain.system) {
      s = {
        ...e.system,
        isCHange: {
          label: n,
          value: i
        }
      };
      for (let t in e.listenMain.system) {
        e.listenMain.system[t](s);
      }
    }
    $Store.setItem("sys", e.system);
    return s;
  };
  global.getSys = t => t ? e.system[t] || undefined : e.system;
  let o = false;
  global.outProjectMain = () => o;
  global.setOutProjectMain = e => {
    o = e;
  };
  e.cache = {
    gift: {
      sign: [],
      online: []
    },
    store: {
      food: [],
      commodity: [],
      medicine: [],
      background: []
    }
  };
  global.getCache = (t, n) => {
    if (!t) {
      return e.cache;
    }
    let i = e.cache;
    if (n) {
      i = i[n];
    }
    return i?.[t] || undefined;
  };
  global.setCache = (t = {}) => {
    let {
      name: n,
      value: i,
      upName: a,
      init: l
    } = t;
    if (l) {
      e.cache = l;
      return;
    }
    if (!n) {
      return;
    }
    if (a) {
      if (!e.cache[a]) {
        return;
      }
      e.cache[a][n] = i;
    } else {
      e.cache[n] = i;
    }
    if (o) {
      return;
    }
    let s = false;
    if (e.listenMain.cache) {
      s = {
        ...e.cache,
        isCHange: {
          label: n,
          value: i
        }
      };
      for (let t in e.listenMain.cache) {
        e.listenMain.cache[t](s);
      }
    }
    $Store.setItem("cache", e.cache);
    return s;
  };
  global.HaveUpdate = true;
  global.UpdateDowning = false;
  global.UpdateChecking = false;
  global.HaveUpdateListen = {};
  global.ChangeHaveUpdate = e => {
    HaveUpdate = e;
    UpdateChecking = false;
    for (let t in HaveUpdateListen) {
      HaveUpdateListen[t](e);
    }
  };
  global.SetHaveUpdateListen = (e, t) => {
    HaveUpdateListen[e] = t;
    console.log("ooo", e);
    HaveUpdateListen[e](HaveUpdate);
  };
  module.exports = {};
})();
