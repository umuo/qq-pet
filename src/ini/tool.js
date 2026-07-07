global.tool = {
  getTime: (e = {}) => {
    let {
      defaultTime: t = null,
      format: r = "YY-MM-DD hh:mm:ss",
      weekType: a = "",
      addDay: l = 0
    } = e;
    let o = e => e < 10 ? "0" + e : e;
    var n = new Date();
    if (t) {
      n = new Date(t);
    }
    if (+l == +l) {
      n = n.setDate(n.getDate() + +l);
      n = new Date(n);
    }
    var g = n.getFullYear();
    var i = n.getMonth() + 1;
    var s = n.getDate();
    var u = n.getHours();
    var m = n.getMinutes();
    var c = n.getSeconds();
    let b = r;
    b = b.replace("YY", g);
    b = b.replace("MM", o(i));
    b = b.replace("DD", o(s));
    b = b.replace("hh", o(u));
    b = b.replace("mm", o(m));
    b = b.replace("ss", o(c));
    if (r.includes("week")) {
      let e = n.getDay() - 1;
      let t = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"];
      if (a) {
        for (let e in t) {
          t[e] = t[e].replace("星期", a);
        }
      }
      b = b.replace("week", t[e]);
    }
    return b;
  },
  getDayHourTime: () => {
    let e = tool.getTime({
      format: "YY-MM-DD"
    });
    return new Date(e + " 06:00").getTime();
  }
};
global.getInterval = (e, t) => {
  let r = 0;
  for (let a in t) {
    if (typeof t[a] != "object") {
      if (t[a]) {
        r = a;
        break;
      }
    } else if (+e <= t[a][1] && +e >= t[a][0]) {
      r = a;
      break;
    }
  }
  return r;
};
global.hideAccountName = e => {
  let t = e.length - 1;
  return e.slice(0, 3) + "***" + e.slice(t - 3, t);
};
global.getRandom = (e, t) => e == 0 || e ? (t == 0 || t ? t < e && ([t, e] = [e, t]) : (t = e, e = 0), Math.round(Math.random() * (t - e) + e)) : Math.random();
global.getRandomArr = (e, t, r, a) => {
  let l = [];
  for (let o = 0; o < r; o++) {
    let r = getRandom(e, t);
    if (!a) {
      if (l.includes(r)) {
        o--;
      } else {
        l.push(r);
      }
    }
  }
  return l;
};
global.getRatio = (e, t = 10) => !!e && !(e > t) && getRandom(1, t) <= e;
global.JSONto = e => JSON.parse(JSON.stringify(e));
global.shuffleArr = e => {
  try {
    return JSONto(e).sort(() => Math.random() - 0.5);
  } catch (t) {
    return e;
  }
};
global.upDownArr = e => {
  try {
    return e.map(e => Math.random() < 0.5 ? e.toUpperCase() : e.toLowerCase());
  } catch (t) {
    return e;
  }
};
global.countMaxPageSize = (e, t) => {
  if (e == 0) {
    return 0;
  }
  let r = +e / +t;
  let a = Math.trunc(r);
  if (r > a) {
    a++;
  }
  return a;
};
global.isNumber = e => +e == +e && +e || 0;
global.isString = (e, t) => t ? +e + "" : e + "";
global.isEmptyArray = e => Array.isArray(e) && !e.length;
global.isArray = e => Array.isArray(e);
global.isString = e => typeof e == "string";
global.getChance = e => Math.random() < e;
global.hourTime = 86400000;
module.exports = {};
