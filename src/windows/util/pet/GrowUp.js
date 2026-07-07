(() => {
  var e = {
    303: (e, t, o) => {
      e = o.nmd(e);
      const {
        Level: i,
        pinkDiamondLevel: n
      } = o(527);
      class a {
        callBackState = e => {};
        oldEvent = null;
        maxGrow = 150;
        growTime = 60000;
        intervalTime = null;
        normalGrowthRate = 260;
        constructor(e = {}) {
          let {
            fn: t,
            petInfo: o,
            growTime: i,
            callBackState: n
          } = e;
          this.oldEvent = null;
          if (typeof n == "function") {
            this.callBackState = e => {
              if (this.oldEvent != e.type) {
                this.oldEvent = e.type;
                if (e.type) {
                  n(e);
                }
              }
            };
          }
          if (i) {
            this.growTime = i;
          }
          this.doChangeMaxInfo(o);
        }
        startGrowUp() {
          if (this.intervalTime) {
            clearInterval(this.intervalTime);
            this.intervalTime = null;
          } else {
            this.GrowUpMain({
              first: true
            });
          }
          let e = this.growTime;
          if ($test) {
            e = 1000;
          }
          this.intervalTime = setInterval(() => {
            this.GrowUpMain();
          }, e);
        }
        doChangeMaxInfo(e) {
          let t = JSONto(e.maxInfo);
          let o = JSONto(e.info);
          if (o.growth || o.growth == 0) {
            let e = i.getNowLevel(o.growth);
            t.upGrowth = e.upGrowth;
            t.nextGrowth = e.nextGrowth;
            t.level = e.level;
          } else {
            t.upGrowth = 0;
            t.nextGrowth = 100;
            t.level = 1;
          }
          t.hunger = 3000 + (t.level > 30 ? 30 : t.level) * 100;
          t.clean = 3000 + (t.level > 30 ? 30 : t.level) * 100;
          t.growthRate = this.getEffectGrowthRate(e);
          setPetInfo({
            maxInfo: t
          });
        }
        addMax = 0;
        addMaxi = 1;
        GrowUpMain(e = {}) {
          let {
            first: t,
            unGrow: o = false
          } = e;
          let i = getPetInfo();
          if (i.info.lastLoginTime && new Date().getTime() >= i.info.lastLoginTime) {
            let e = tool.getTime({
              format: "YY-MM-DD",
              addDay: 1
            });
            let t = {
              lastLoginTime: new Date(e + " 06:00").getTime(),
              onlineDataTime: 0
            };
            let o = n.isExpirationDate(i.otherOptions);
            let a = n.toChangeOtherDatas(i.otherOptions);
            setPetInfo({
              info: t,
              otherOptions: o,
              ...a
            });
          }
          if (i?.maxInfo?.stopGrowth) {
            this.callBackState({
              type: "pause",
              communication: ["state", "stopGrowth"],
              speak: true
            });
            return;
          }
          this.callBackState({
            type: null
          });
          if (i.info.health == 0) {
            return;
          }
          let a = JSONto(i.maxInfo);
          let l = JSONto(i.info);
          let r = JSONto(i.activeOption);
          let s = JSONto(i.activeValue);
          if (t) {
            if (l.growth == 0) {
              setTimeout(() => {
                setPetInfo({
                  info: {
                    growth: 0.5
                  }
                });
              }, 500);
            }
          } else {
            if (!o) {
              let e = this.getEffectHungerCleanMood(i);
              let t = isNumber(l.hunger) - e[0];
              l.hunger = t < 0 ? 0 : t;
              let o = isNumber(l.clean) - e[1];
              l.clean = o < 0 ? 0 : o;
              let n = isNumber(l.mood) - e[2];
              l.mood = n < 0 ? 0 : n;
              let r = 100;
              let s = Math.trunc(a.growthRate / 60 / (60 / (this.growTime / 1000)) * r) / r;
              l.growth = Math.trunc((isNumber(l.growth) + s) * r) / r;
              l.onLineTime = isNumber(l.onLineTime) + this.growTime / 60000;
              l.onlineDataTime = isNumber(l.onlineDataTime) + this.growTime / 60000;
            }
            if (!i.activeOption.ill) {
              r = this.countdownActiveTime(r, s, e => {
                for (let t in e) {
                  l[t] = +l[t] + +e[t];
                }
              }, e => {
                s.study[e] = (s.study[e] || 0) + 1;
              });
            }
          }
          setPetInfo({
            info: l,
            activeOption: r,
            activeValue: s
          });
        }
        getEffectGrowthRate(e) {
          let t = [0, 0, 0, 0, 0];
          if (e.info.mood || e.info.mood == 0) {
            t[0] = getInterval(e.info.mood, {
              100: typeof e.info.mood != "number",
              0: [900, 1000],
              20: [700, 899],
              70: [500, 699],
              100: [300, 499],
              140: [100, 299],
              180: [0, 99]
            });
          }
          if (e.info.health || e.info.health == 0) {
            t[1] = getInterval(e.info.health, {
              500: typeof e.info.health != "number",
              0: [5, 5],
              30: [4, 4],
              80: [3, 3],
              120: [2, 2],
              160: [1, 1],
              500: [0, 0]
            });
          }
          if (e.otherOptions.pinkDiamond) {
            t[2] = (e.otherOptions.pinkDiamondLevel || 0) * -10;
          }
          if (e.otherOptions.sweetHeart) {
            t[4] = -10;
          }
          if (e.info.hunger < 720) {
            t[3] = 80;
          }
          if (e.info.clean < 1080) {
            t[3] = 80;
          }
          let o = this.normalGrowthRate;
          for (let e in t) {
            o -= t[e];
          }
          if (o <= 0) {
            return 0;
          } else {
            return o;
          }
        }
        getEffectHungerCleanMood(e) {
          let t = [getRandom(5, 8), getRandom(5, 8), getRandom(2, 4)];
          if (e.info.mood) {
            let o = getInterval(e.info.mood, {
              0: typeof e.info.mood != "number",
              0: [600, 1000],
              2: [0, 599]
            });
            t[0] = +t[0] + +o;
            t[1] = +t[1] + +o;
          }
          for (let o in e.activeOption) {
            if (e.activeOption[o]) {
              if (e.activeOption[o]?.starve) {
                t[0] += this.doGetMS(e.activeOption[o].starve, e.activeOption[o].overTime);
              }
              if (e.activeOption[o]?.clean) {
                t[1] += this.doGetMS(e.activeOption[o].clean, e.activeOption[o].overTime);
              }
              if (e.activeOption[o]?.mood) {
                t[2] += this.doGetMS(e.activeOption[o].mood, e.activeOption[o].overTime);
              }
            }
          }
          if ($test) {
            t = [1, 1, 1];
          }
          return t;
        }
        doGetMS(e, t) {
          return e / t | 0;
        }
        sweetHeartAuto() {}
        countdownActiveTime(e, t, o, i) {
          let n = e?.work ? "work" : e?.study ? "study" : e?.trip ? "trip" : "";
          if (n) {
            if (e[n]?.stopNow) {
              this.callBackState({
                type: "normal",
                msg: "[host]，我回来了哦~~",
                speak: true,
                change: true
              });
              e[n] = null;
              return e;
            }
            if (e[n].stateTime + 1 > e[n].overTime) {
              o(e[n].obtain);
              let a = "";
              let l = getRandom(1, 4);
              l = l <= 3 ? 1 : 2;
              if (n == "study") {
                i(e[n].value);
                if (isStudyUpLevel(t.study[e[n].value])) {
                  l = 3;
                  a = "overStudyUp";
                } else {
                  a = "overStudy";
                }
              } else if (n == "work") {
                a = "overWork";
              }
              e[n] = null;
              let r = [];
              let s = () => {
                let e = Math.random();
                addGoods(e <= 0.43 ? "commodity" : e <= 0.86 ? "food" : "medicine", e => {
                  let t = e.split("*_");
                  t = `../assets/img_res/${t[0]}/${t[1]}.gif`;
                  r.push(t);
                  if (r.length < l) {
                    s();
                  } else {
                    this.callBackState({
                      speakType: "seeTextImgs",
                      type: "normal",
                      communication: ["state", a],
                      speak: true,
                      change: true,
                      otherData: {
                        imgUrls: r
                      }
                    });
                  }
                });
              };
              s();
              return e;
            }
            if (new Date().getTime() - e[n].startTime > this.growTime / 60) {
              e[n].stateTime++;
            }
          }
          return e;
        }
      }
      try {
        if (e) {
          e.exports = {
            GrowUp: a
          };
        }
      } catch (e) {}
    },
    527: (e, t, o) => {
      e = o.nmd(e);
      const i = new class {
        levels = [0, 100, 300, 600, 1100, 1800, 2800, 4200, 5900, 8000, 10600, 13700, 17400, 21700, 26700, 32500, 39000, 46300, 54500, 63600, 73700, 84800, 97000, 110400, 124900, 140600, 157600, 175900, 195600, 216700, 239300, 263500, 289200, 316500, 345500, 376200, 408700, 443000, 479200, 517400, 557500, 599600, 643800, 690100, 738600, 789300, 842300, 897700, 955400, 1015500, 1078100, 1143200, 1210900, 1281200, 1354200, 1430000, 1508500, 1589800, 1674000, 1761100, 1851200, 1944300, 2040500, 2139900, 2242400, 2348100, 2457100, 2569400, 2685100, 2804200, 2926800, 3053000, 3182700, 3316000, 3453000, 3593700, 3738200, 3886500, 4038700, 4194900, 4355000, 4519100, 4687300, 4859600, 5036100, 5216800, 5401800, 5591200, 5784900, 5983000, 6185600, 6392700, 6604400, 6820700, 7041700, 7267500, 7498000, 7733300, 7973500, 8218600, 8468700, 8723800, 8984000, 9249400, 9519900, 9795600, 10076600, 10362900, 10654600, 10951700, 11254300, 11562500, 11876200, 12195500, 12520500, 12851200, 13187700, 13530000, 13878200, 14232400, 14592500, 14958600, 15330800, 15709100, 16093600, 16484300, 16881300, 17284700, 17694400, 18110500, 18533100, 18962200, 19397900, 19840200, 20289200, 20745000, 21207500, 21676800, 22153000, 22636100, 23126200, 23623300, 24127500, 24638900, 25157400, 25683100, 26216100, 26756400, 27304100, 27859200, 28421800, 28992000, 29569700, 30155000, 30748000, 31348700, 31957200, 32573500, 33197700, 33829900, 34470000, 35118100, 35774300, 36438600, 37111100, 37791800, 38480800, 39178200, 39883900, 40598000, 41320600, 42051700, 42791400, 43539700, 44296700, 45062500, 45837000, 46620300, 47412500, 48213600, 49023700, 49842800, 50671000, 51508400, 52354900, 53210600, 54075600, 54949900, 55833600, 56726700, 57629300, 58541500, 59463200, 60394500, 61335500, 62286200, 63246700, 64217000, 65197200, 66187400, 67187500, 68197600, 69217800, 70248100, 71288600, 72339300, 73400300, 74471700, 75553400, 76645500, 77748100, 78861200, 79984900, 81119200, 82264200, 83420000, 84586500, 85763800, 86952000, 88151100, 89361200, 90582300, 91814500, 93057900, 94312400, 95578100, 96855100, 98143400, 99443100, 100754200, 102076800, 103411000, 104756700, 106114000, 107483000, 108863700, 110256200, 111660500, 113076700, 114504900, 115945000, 117397100, 118861300, 120337600, 121826100, 123326800, 124839800, 126365200, 127902900, 129453000, 131015600, 132590700, 134178400, 135778700, 137391700, 139017500, 140656000, 142307300, 143971500, 145648600, 147338700, 149041800, 150758000, 152487400, 154229900, 155985600, 157754600, 159536900, 161332600, 163141700, 164964300, 166800500, 168650200, 170513500, 172390500, 174281200, 176185700, 178104000, 180036200, 181982400, 183942500, 185916600, 187904800, 189907100, 191923600, 193954300, 195999300, 198058700, 200132400, 202220500, 204323100, 206440200, 208571900, 210718200, 212879200, 215055000, 217245500, 219450800, 221671000, 223906100, 226156200, 228421300, 230701500, 232996900, 235307400, 237633100, 239974100, 242330400, 244702100, 247089200, 249491800, 251910000, 254343700, 256793000, 259258000, 261738700, 264235200, 266747500, 269275700, 271819900, 274380000, 276956100, 279548300, 282156600, 284781100, 287421800, 290078800, 292752200, 295441900, 298148000, 300870600, 303609700, 306365400, 309137700, 311926700, 314732500, 317555000, 320394300, 323250500, 326123600, 329013700, 331920800, 334845000, 337786400, 340744900, 343720600, 346713600, 349723900, 352751600, 355796700, 358859300, 361939500, 365037200, 368152500, 371285500, 374436200, 377604700, 380791000, 383995200, 387217400, 390457500, 393715600, 396991800, 400286100, 403598600, 406929300, 410278300, 413645700, 417031400, 420435500, 423858100, 427299200, 430758900, 434237200, 437734200, 441250000, 444784500, 448337800, 451910000, 455501100, 459111200, 462740300, 466388500, 470055900, 473742400, 477448100, 481173100, 484917400, 488681100, 492464200, 496266800, 500089000, 503930700, 507792000, 511673000, 515573700, 519494200, 523434500, 527394700, 531374900, 535375000, 539395200];
        level = 1;
        constructor() {}
        getNowLevel(e) {
          if (!e || +e != +e) {
            return {
              upGrowth: 0,
              nextGrowth: this.levels[1],
              level: 1
            };
          }
          e = +e;
          let t = [];
          for (let o = 1; o <= 400; o++) {
            if (e >= this.levels[o - 1] && e < this.levels[o]) {
              t = [this.levels[o - 1], this.levels[o]];
              this.level = o;
              break;
            }
          }
          return {
            upGrowth: t[0],
            nextGrowth: t[1],
            level: this.level
          };
        }
      }();
      const n = new class {
        levels = [0, 100, 300, 600, 1100, 1800, 2800];
        constructor() {}
        getNowLevel(e) {
          if (!e || +e != +e) {
            return {
              upGrowth: 0,
              nextGrowth: this.levels[1],
              level: 1
            };
          }
          e = +e;
          let t = [];
          for (let o = 1; o <= 7; o++) {
            if (e >= this.levels[o - 1] && e < this.levels[o]) {
              t = [this.levels[o - 1], this.levels[o]];
              this.level = o;
              break;
            }
          }
          return {
            upGrowth: t[0],
            nextGrowth: t[1],
            level: this.level
          };
        }
        hour = 86400000;
        isExpirationDate(e) {
          let t = {
            growth: e.growth || 0
          };
          if (e.pinkDiamondExpirationDate) {
            let o = 0;
            let i = new Date().getTime();
            if (i >= e.pinkDiamondExpirationDate) {
              t.pinkDiamond = false;
              o = e.pinkDiamondExpirationDate - e.pinkDiamondBeginDate;
              t.growthValue = 0;
              t.pinkDiamondBeginDate = 0;
              t.pinkDiamondExpirationDate = 0;
            } else {
              t.pinkDiamond = true;
              t.growthValue = t.growthValue || 20;
              o = i - e.pinkDiamondBeginDate;
            }
            let n = o / this.hour | 0;
            if (n > 0) {
              if (i < e.pinkDiamondExpirationDate) {
                t.pinkDiamondBeginDate = tool.getDayHourTime();
              }
              t.growth = t.growth + n * (e.growthValue || 5);
            }
            let a = this.getNowLevel(t.growth);
            t.pinkDiamondLevel = a.level;
            t.growthValue_next = a.nextGrowth || 100;
          }
          console.log("opt", t);
          return t;
        }
        toChangeOtherDatas(e) {
          let t = {};
          if (e.pinkDiamond) {
            t.allvipcnt = e.pinkDiamondLevel * 2;
            t.canusecnt = t.allvipcnt;
          } else {
            t.allvipcnt = e.pinkDiamondLevel * 2;
            t.canusecnt = 0;
          }
          return {
            fishing: t
          };
        }
      }();
      try {
        if (e) {
          e.exports = {
            Level: i,
            pinkDiamondLevel: n
          };
        }
      } catch (e) {}
    }
  };
  var t = {};
  function o(i) {
    var n = t[i];
    if (n !== undefined) {
      return n.exports;
    }
    var a = t[i] = {
      id: i,
      loaded: false,
      exports: {}
    };
    e[i](a, a.exports, o);
    a.loaded = true;
    return a.exports;
  }
  o.nmd = e => {
    e.paths = [];
    e.children ||= [];
    return e;
  };
  var i = o(303);
  module.exports = i;
})();
