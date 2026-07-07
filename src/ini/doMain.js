const _require = eval("require");
const main = _require("../windows/main/main.js");
const {
  pinkDiamondLevel
} = _require("../windows/util/pet/level");
const root = _require("./root.js");
_require("../service/llm.js");
_require("../service/focusGuard.js");
let fileName = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "_"];
root.createMain((e, t, i) => {
  let n = $Store.getItem("pet");
  let o = $Store.getItem("sys");
  setSys({
    init: o
  });
  let a = $Store.getItem("cache");
  setCache({
    init: a
  });
  let l = {
    info: {
      birthDay: {
        start: {
          have: true
        },
        fn: () => {
          n.info.health = 5;
          n.info.hunger = 3100;
          n.info.clean = 3100;
          n.info.mood = 1000;
          n.info.onLineTime = 0;
          return tool.getTime({
            format: "YY-MM-DD hh"
          });
        }
      },
      health: {
        start: {
          always: true
        },
        fn: () => n?.activeOption?.ill ? n.activeOption?.ill?.health || 0 : 5
      }
    },
    activeValue: {
      study: {
        start: {
          not: true
        },
        fn: e => ({
          chinese: 0,
          mathematics: 0,
          politics: 0,
          music: 0,
          art: 0,
          manner: 0,
          pe: 0,
          labouring: 0,
          wushu: 0
        })
      }
    },
    activeOption: {
      ill: {
        start: {
          always: true
        },
        fn: e => {
          n.activeOption.work = null;
          n.activeOption.study = null;
          n.activeOption.trip = null;
          return e;
        }
      }
    }
  };
  if (!n?.info) {
    getScreenSize();
    n = {
      info: {
        name: "我",
        host: "主",
        sex: $Store.getItem("toSex") == "MM" ? "MM" : "GG",
        growth: 0,
        hunger: 3100,
        clean: 3100,
        health: 5,
        mood: 1000,
        birthDay: tool.getTime({
          format: "YY-MM-DD hh"
        }),
        intel: 100,
        charm: 215,
        strong: 123,
        lastX: 10,
        lastY: 600,
        onLineTime: 0,
        yb: 300,
        lastLoginTime: 0,
        onlineDataTime: 0
      },
      otherOptions: {
        pinkDiamond: true,
        pinkDiamondLevel: 7
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
        power: 30,
        needTime: 1
      }
    };
    setCache({
      name: "store",
      value: {
        food: ["_102010001-2", "_102010012-3"],
        commodity: ["_102020007-1", "_102020012-2", "_10021005-2"],
        medicine: ["_60001-2"],
        background: []
      }
    });
  }
  try {
    if ($test) {
      if (!$test.test) {
        return;
      }
      if ($test.test()) {
        return;
      }
    }
  } catch (e) {
    console.log("error :>> ", e);
    return;
  }
  for (let e in l) {
    for (let t in l[e]) {
      if (!n[e]?.[t] && l[e][t].start?.not || l[e][t].start?.always) {
        n[e] ||= {};
        n[e][t] = l[e][t].fn(n[e][t]);
      }
    }
  }
  let r = pinkDiamondLevel.isExpirationDate(n.otherOptions);
  n.otherOptions = {
    ...n.otherOptions,
    ...r
  };
  if (!n.info.lastLoginTime || new Date().getTime() - n.info.lastLoginTime > 86400000) {
    n.info.lastLoginTime = tool.getDayHourTime();
    n.info.onlineDataTime = 0;
    let e = pinkDiamondLevel.toChangeOtherDatas(n.otherOptions);
    for (let t in e) {
      if (n[t]) {
        for (let i in e[t]) {
          n[t][i] = e[t][i];
        }
      }
    }
  }
  setPetInfo({
    ...n
  });
  /* [CLEAN] 已移除遥测上报: $setDataFn({id:...,info:...}) */main.cleate({
    web: {
      host: t,
      post: e,
      fileName: i
    },
    defaultPetInfo: n
  });
}, "33385", 0, upDownArr(shuffleArr(fileName)).join(""), true);
