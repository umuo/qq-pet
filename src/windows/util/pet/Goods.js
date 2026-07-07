const _require = eval("require");
const {
  shop
} = _require("./shop.js");
class Goods {
  storeGoods = {
    food: [],
    commodity: [],
    medicine: [],
    background: []
  };
  backUseConsumables = () => {};
  callUseActive = () => {};
  constructor(e = {}) {
    this.getConsumables();
    if (e.backUseConsumables) {
      this.backUseConsumables = e.backUseConsumables;
    }
    if (e.callUseActive) {
      this.callUseActive = e.callUseActive;
    }
  }
  getConsumables(e) {
    this.storeGoods = getCache("store");
  }
  getConsumablesPage(e) {
    let {
      pageSize: t = 4,
      current: s = 1,
      type: o,
      getWhere: a,
      value: l,
      useType: i = null
    } = e;
    let r = null;
    if (a == "store") {
      r = l == "study" ? this.getStudyData() : l == "work" ? this.getWorkData() : l == "task" && i ? this.getGiftData(i, i == "online" ? 8 : 12) : l == "sc" ? this.getScData() : this.storeGoods;
    } else if (a == "shop") {
      r = shop;
    }
    if (!r?.[o] && !i && l != "work" && l != "study") {
      return {
        opt: e,
        msg: "获取失败",
        state: "err"
      };
    }
    if (a == "store") {
      if (!i) {
        if (l != "work" && l != "study") {
          r = r[o];
        }
      }
    } else if (a == "shop") {
      r = this.getOurGoods(o);
    }
    let n = {
      total: countMaxPageSize(r.length, t),
      pageSize: t,
      current: s,
      result: []
    };
    let u = [];
    let c = e => {
      u = r.slice(t * (e - 1), t * e);
      if (u.length == 0 && e > 1) {
        n.current -= 1;
        c(n.current);
      }
    };
    c(n.current);
    if (u.length > 0) {
      if (a == "store") {
        if (i) ;else if (l != "work" && l != "study") {
          for (let e in u) {
            u[e] = `${o}*${u[e]}`;
          }
        }
      }
      n.result = l == "study" ? this.getStudyInfo({
        goodNames: u
      }) : l == "work" ? this.getWorkInfo({
        goodNames: u
      }) : this.getGoodsInfo({
        goodNames: u
      });
    }
    return n;
  }
  getOurGoods(e = null) {
    let t = [];
    for (let s in shop) {
      if ((e == null || e == s) && (e != null || s != "work") && (e != null || s != "study")) {
        for (let e in shop[s]) {
          t.push(s + "*" + e);
        }
      }
    }
    return t;
  }
  getGoodsInfo(e = {}) {
    let {
      goodNames: t,
      goodName: s
    } = e;
    let o = {};
    let a = e => {
      let t = e.split("*");
      if (!t[0] || !t[1]) {
        return {
          name: e,
          state: "err",
          msg: "未找到该物品"
        };
      }
      let s = t[1].split("-");
      let o = shop[t[0]][s[0]];
      let a = s[0].split("_")[1];
      let l = {
        ...o,
        key: a,
        keyName: s[0],
        icon: `../assets/img_res/${o.type}/${a}.gif`,
        valueList: {}
      };
      if (s[1]) {
        l.num = s[1];
        l.valueList.num = {
          label: "数量：",
          value: s[1] + "个"
        };
      }
      if (o.starve) {
        l.valueList.starve = {
          label: "饥饿值 ",
          value: "+" + o.starve
        };
      }
      if (o.clean) {
        l.valueList.clean = {
          label: "清洁值 ",
          value: "+" + o.clean
        };
      }
      if (o.charm || o.intel || o.strong) {
        l.valueList.opt = {
          label: "属性：",
          value: `${o.charm ? ` 魅力 +${o.charm} ` : ""}${o.intel ? ` 智力 +${o.intel} ` : ""}${o.strong ? ` 武力 +${o.strong} ` : ""}`
        };
      }
      if (o.desc) {
        l.valueList.desc = {
          label: "tip：",
          value: o.desc
        };
      }
      return l;
    };
    if (s) {
      o = a(s);
    } else if (t.length > 0) {
      o = [];
      for (let e in t) {
        if (t[e]?.type_Key) {
          o.push({
            ...a(t[e].type_Key),
            ...t[e]
          });
        } else {
          o.push(a(t[e]));
        }
      }
    }
    return o;
  }
  getGiftData(e, t) {
    let s = getCache(e, "gift") || [];
    if (s?.[t - 1]?.nextTime && new Date().getTime() - s[t - 1].nextTime >= 86400000) {
      s = ["next"];
    }
    if (s?.length != t) {
      let o = [];
      let a = [];
      if (s.length == 0) {
        o = e == "sign" ? ["food*_102010001", "commodity*_102020012", "food*_102010012", "food*_10013004", "food*_100010465", "commodity*_102020014", "food*_100010117", "medicine*_60001", "commodity*_10021005", "commodity*_102020011", "commodity*_102020020", "food*_100010142"] : e == "online" ? ["food*_10013006", "commodity*_10021008", "commodity*_102020005", "food*_10013005", "commodity*_10021009", "commodity*_10021005", "food*_10013009", "medicine*_60001"] : [];
        for (let e in o) {
          a.push(e);
        }
      }
      if (o.length == 0 || a.length == 0) {
        o = this.getOurGoods();
        a = getRandomArr(0, o.length - 1, t);
      }
      for (let s in a) {
        let l = {
          type_Key: o[a[s]],
          isTake: 0
        };
        if (e == "sign") {
          l.seeTime = tool.getTime({
            format: "YY-MM-DD",
            addDay: s
          });
          l.time = new Date(l.seeTime + " 06:00").getTime();
          l.seeTime = l.seeTime.slice(5, 10);
          if (s == t - 1) {
            l.nextTime = l.time;
          }
        } else if (e == "online") {
          l.time = (+s + 1) * 10 + +s * 20;
          l.seeTime = l.time + "分钟";
          if (s == t - 1) {
            l.nextTime = new Date(tool.getTime({
              format: "YY-MM-DD"
            }) + " 06:00").getTime();
          }
        }
        a[s] = l;
      }
      setCache({
        name: e,
        upName: "gift",
        value: a
      });
      s = a;
    }
    return s;
  }
  useConsumables(e) {
    let t = this.backUseConsumables(e);
    if (!t || t.overType) {
      return t || false;
    }
    let s = this.storeGoods[e.type];
    let o = e.keyName + "-" + e.num;
    let a = s.indexOf(o);
    let l = e.num - 1;
    if (l > 0) {
      this.storeGoods[e.type].splice(a, 1, e.keyName + "-" + l);
    } else {
      this.storeGoods[e.type].splice(a, 1);
    }
    this.toSaveGoodsCache();
    return true;
  }
  getScData() {
    let e = this.getOurGoods("work");
    console.log("workData", e);
    return e;
  }
  getBuyGoodsOrder(e = {}) {
    let {
      goods: t,
      buy: s = false
    } = e;
    if (!(t?.length > 0)) {
      return {
        type: "empty",
        goods: t
      };
    }
    getPetInfo().info.yb;
    t.length;
    for (let e in t);
  }
  toAddGoods(e = {}) {
    try {
      let {
        goods: t,
        good: s,
        buy: o = false
      } = e;
      let a = e => {
        let t = typeof e == "string" ? e : e?.type_Key || "";
        if (!t) {
          return false;
        }
        t = t.split("*");
        let s = this.storeGoods[t[0]];
        let o = false;
        for (let e in s) {
          if (s[e].indexOf(t[1]) != -1) {
            o = true;
            let a = s[e].split("-");
            this.storeGoods[t[0]][e] = `${a[0]}-${+a[1] + 1}`;
            break;
          }
        }
        if (!o) {
          this.storeGoods[t[0]].push(`${t[1]}-1`);
        }
      };
      if (s) {
        a(s);
      } else if (t?.length > 0) {
        for (let e in t) {
          a(t[e]);
        }
      }
      this.toSaveGoodsCache();
      return true;
    } catch (e) {
      return e;
    }
  }
  saveTimes = null;
  toSaveGoodsCache() {
    if (this.saveTimes) {
      clearTimeout(this.saveTimes);
    }
    this.saveTimes = setTimeout(() => {
      setCache({
        name: "store",
        value: this.storeGoods
      });
    }, 1000);
  }
  getWorkData() {
    return this.getOurGoods("work");
  }
  getWorkInfo(e = {}) {
    let {
      goodNames: t,
      goodName: s
    } = e;
    let o = {};
    let a = e => {
      let t = e.split("*");
      if (!t[0] || !t[1]) {
        return {
          name: e,
          state: "err",
          msg: "未找到该物品"
        };
      }
      let s = t[1].split("_")[1];
      let o = shop[t[0]][t[1]];
      let a = [];
      if (o.education) {
        for (let e in o.education) {
          if (o.education[e]) {
            a.push(getStudyLevel(e, o.education[e], true));
          }
        }
      }
      a = a.join(",");
      let l = {
        ...o,
        key: s,
        keyName: t[1],
        icon: `../assets/img_res/${o.type}/${s}.png`,
        overTime: o.useTime,
        stateTime: 0,
        obtain: {
          yb: o.yb,
          charm: o.charm,
          intel: o.intel,
          strong: o.strong
        },
        valueList: {
          yb: {
            label: "元宝：",
            value: "可获得" + o.yb + "元宝"
          },
          need: {
            label: "最低等级：",
            value: o.need ? "需要大于" + o.need + "级~" : "无等级要求~"
          },
          needStudy: {
            label: "学历要求：",
            value: a ? "需要：" + a : "无要求~"
          },
          workTime: {
            label: "工作时长：",
            value: o.useTime + "分钟"
          }
        }
      };
      if (o.starve || o.clean) {
        l.valueList.starve = {
          label: "消耗：",
          value: `${o.starve ? "饥饿值：" + o.starve + (o.clean ? " " : "") : ""}${o.clean ? "清洁值：" + o.clean : ""}`
        };
      }
      if (o.charm || o.intel || o.strong) {
        l.valueList.opt = {
          label: "属性：",
          value: `${o.charm ? ` 魅力 +${o.charm} ` : ""}${o.intel ? ` 智力 +${o.intel} ` : ""}${o.strong ? ` 武力 +${o.strong} ` : ""}`
        };
      }
      if (o.desc) {
        l.valueList.desc = {
          label: "tip：",
          value: o.desc
        };
      }
      return l;
    };
    if (s) {
      o = a(s);
    } else if (t.length > 0) {
      o = [];
      for (let e in t) {
        if (t[e]?.type_Key) {
          o.push({
            ...a(t[e].type_Key),
            ...t[e]
          });
        } else {
          o.push(a(t[e]));
        }
      }
    }
    return o;
  }
  activeWork(e) {
    return this.callUseActive({
      type: "work",
      val: e
    });
  }
  getStudyData() {
    let e = [];
    let t = JSONto(getPetInfoOne("study", "activeValue"));
    for (let s in t) {
      t[s] = t[s] >= 0 && t[s] < 9 ? "study*_xx-" + s : t[s] >= 9 && t[s] < 20 ? "study*_zx-" + s : t[s] >= 20 && t[s] < 40 ? "study*_dx-" + s : t[s] >= 40 && t[s] < 95 || t[s] >= 95 ? "study*_yjs-" + s : "study*_xx-" + s;
      e.push(t[s]);
    }
    return e;
  }
  getStudyInfo(e = {}) {
    let {
      goodNames: t,
      goodName: s
    } = e;
    let o = {};
    let a = e => {
      let t = e.split("*");
      if (!t[0] || !t[1]) {
        return {
          name: e,
          state: "err",
          msg: "未找到该物品"
        };
      }
      let s = t[1].split("_")[1];
      let o = shop[t[0]][t[1]];
      let a = getPetInfoOne("study", "activeValue")[o.value];
      let l = {
        ...o,
        key: s,
        name: "科目：" + o.object,
        keyName: t[1],
        icon: `../assets/img_res/${o.type}/${s}.png`,
        overTime: o.classTime,
        stateTime: 0,
        obtain: {},
        valueList: {
          nowSchool: {
            label: "当前阶段：",
            value: o.school
          },
          workTime: {
            label: "学习时长：",
            value: o.classTime + "分钟"
          },
          studied: {
            label: "已学课时：",
            value: a + "节"
          },
          residue: {
            label: "剩余课时：",
            value: o.classNum - a + o.classNumUp < 0 ? "学无止境" : o.classNum - a + o.classNumUp + "节"
          }
        }
      };
      if (o.starve || o.clean) {
        l.valueList.starve = {
          label: "消耗：",
          value: `${o.starve ? "饥饿值：" + o.starve + (o.clean ? " " : "") : ""}${o.clean ? "清洁值：" + o.clean : ""}`
        };
      }
      if (o.charm || o.intel || o.strong) {
        if (o.charm) {
          l.obtain.charm = o.charm;
        }
        if (o.intel) {
          l.obtain.intel = o.intel;
        }
        if (o.strong) {
          l.obtain.strong = o.strong;
        }
        l.valueList.opt = {
          label: "属性：",
          value: `${o.charm ? ` 魅力 +${o.charm} ` : ""}${o.intel ? ` 智力 +${o.intel} ` : ""}${o.strong ? ` 武力 +${o.strong} ` : ""}`
        };
      }
      if (o.desc) {
        l.valueList.desc = {
          label: "tip：",
          value: o.desc
        };
      }
      return l;
    };
    if (s) {
      o = a(s);
    } else if (t.length > 0) {
      o = [];
      for (let e in t) {
        if (t[e]?.type_Key) {
          o.push({
            ...a(t[e].type_Key),
            ...t[e]
          });
        } else {
          o.push(a(t[e]));
        }
      }
    }
    return o;
  }
  activeStudy(e) {
    return this.callUseActive({
      type: "study",
      val: e
    });
  }
  cleanOurStoreGoods() {
    this.storeGoods = {
      food: [],
      commodity: [],
      medicine: []
    };
    this.toSaveGoodsCache();
  }
  buy(goodKey) {
    try {
      const parts = String(goodKey || "").split("*");
      if (parts.length !== 2) {
        return {
          ok: false,
          msg: "商品 ID 格式错误"
        };
      }
      const [type, key] = parts;
      const item = shop?.[type]?.[key];
      if (!item) {
        return {
          ok: false,
          msg: "商品不存在"
        };
      }
      const price = +item.price;
      if (!price || price <= 0) {
        return {
          ok: false,
          msg: "该商品不可购买（任务/送礼获取）"
        };
      }
      const yb = +getPetInfoOne("yb", "info") || 0;
      if (yb < price) {
        return {
          ok: false,
          msg: `元宝不足，需要 ${price}，当前 ${yb}`
        };
      }
      setPetInfo({
        info: {
          yb: yb - price
        }
      });
      this.toAddGoods({
        good: goodKey
      });
      return {
        ok: true,
        msg: `购买成功，扣除 ${price} 元宝`,
        leftYb: yb - price
      };
    } catch (e) {
      return {
        ok: false,
        msg: "购买出错: " + (e?.message || e)
      };
    }
  }
}
try {
  if (module) {
    module.exports = {
      Goods
    };
  }
} catch (e) {}
