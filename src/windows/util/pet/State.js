(() => {
  var t = {
    852: (t, e, l) => {
      t = l.nmd(t);
      class o {
        callBackState = t => {};
        onceBackState = null;
        oldEvent = null;
        saveOtherBackState = null;
        illsPower = {};
        constructor(t = {}) {
          if (typeof t?.callBackState == "function") {
            this.callBackState = e => {
              if (this.oldEvent != e.type) {
                this.oldEvent = e.type;
                if (this.saveOtherBackState) {
                  e = {
                    ...e,
                    ...this.saveOtherBackState
                  };
                }
                if (e.msg || e.communication) {
                  e.speak = true;
                }
                if (e.type == "ill") {
                  e.active = "sick";
                }
                if (e.type == "dead") {
                  e.active = "die";
                }
                this.saveOtherBackState = null;
                t.callBackState(e);
              }
            };
          }
          this.firstDetermineHealth();
        }
        firstDetermineHealth() {
          this.determineHealth();
        }
        determineHealth(t = null, e) {
          if (e) {
            this.saveOtherBackState = e;
            this.oldEvent = null;
          }
          let l = t || getPetInfo();
          if (l.info?.health == 0) {
            let t = {
              type: "dead",
              msg: i.tolk,
              val: i
            };
            this.callBackState(t);
            return;
          }
          let o = l.info;
          let a = l.maxInfo;
          let n = [5, 1000];
          if (!(o.hunger > 720)) {
            n[0] += 50;
          }
          if (!(o.clean > 1080)) {
            n[0] += 50;
          }
          if (o.mood < 100) {
            n[0] += 200;
          }
          if (o.hunger > a.hunger - 260) {
            if (this.illsPower.full) {
              if (getRatio(...n)) {
                this.illsPower.full++;
              }
            } else {
              this.illsPower.full = getRatio(...n) ? 0 : 1;
            }
          }
          if (o.clean < 1080) {
            if (this.illsPower.dirty) {
              if (getRatio(...n)) {
                this.illsPower.dirty++;
              }
            } else {
              this.illsPower.dirty = getRatio(...n) ? 0 : 1;
            }
          }
          if (o.hunger < 720) {
            if (this.illsPower.hungry) {
              if (getRatio(...n)) {
                this.illsPower.hungry++;
              }
            } else {
              this.illsPower.hungry = getRatio(...n) ? 0 : 1;
            }
          }
          let r = l.activeOption.ill;
          if (this.illsPower.full || this.illsPower.dirty || this.illsPower.hungry) {
            for (let t in this.illsPower) {
              if (this.illsPower[t] > 4) {
                if (r) {
                  r = r?.children;
                } else if (t == "full") {
                  r = s[3];
                } else if (t == "dirty" || t == "hungry") {
                  r = s[getRandom(1, 2)];
                }
                this.illsPower = {};
                if (r) {
                  this.doActive({
                    type: "ill",
                    val: r,
                    activeOption: l.activeOption
                  });
                }
                break;
              }
            }
          }
          if (r) {
            if (o?.health == 1) {
              if (!this.onceBackState) {
                this.onceBackState = 1;
                this.oldEvent = null;
              }
            } else {
              this.onceBackState &&= null;
            }
            this.callBackState({
              type: r.type,
              msg: r.tolk,
              val: r
            });
          } else if (o.hunger < 720) {
            this.callBackState({
              type: "hungry",
              msg: "[host]，我需要吃饭了~",
              communication: ["state", "eat"]
            });
          } else if (o.clean < 1080) {
            this.callBackState({
              type: "dirty",
              msg: "[host]，我需要洗澡了~",
              communication: ["state", "clean"]
            });
          } else {
            this.callBackState({
              type: "normal",
              msg: ""
            });
          }
        }
        doActive(t) {
          let {
            type: e,
            val: l,
            activeOption: o
          } = t;
          let i = null;
          let s = null;
          let a = null;
          let n = null;
          let r = null;
          let c = {};
          if (e == "ill") {
            let t = e == "ill" ? "我生病了" : e == "dead" ? "死了" : "";
            if (o.work) {
              i = "[host]，" + t + "，我不能工作了~";
              a = null;
            } else if (o.study) {
              i = "[host]，" + t + "，我不能学习了~";
              n = null;
            } else if (o.trip) {
              i = "[host]，" + t + "，我不能旅游了~";
              r = null;
            }
            i = i || l?.tolk || " ";
            s = l;
            c.info = {
              health: s.health
            };
            setPetInfo({
              activeOption: {
                ill: s,
                work: a,
                study: n,
                trip: r
              },
              ...c
            });
            this.callBackState({
              type: e,
              msg: i,
              val: l
            });
          } else {
            if (e == "work") {
              i = "[host]，，我开始工作了~";
              a = l;
              a.startTime = new Date().getTime();
              setPetInfo({
                activeOption: {
                  ill: s,
                  work: a,
                  study: n,
                  trip: r
                },
                ...c
              });
              this.callBackState({
                type: e,
                msg: i,
                val: l
              });
              return true;
            }
            if (e == "study") {
              i = "[host]，，我被分配到" + getRandom(1000000, 9999999) + "班学习" + l.object + ",我放学就回来，不要太想念我哦~~~";
              n = l;
              n.startTime = new Date().getTime();
              setPetInfo({
                activeOption: {
                  ill: s,
                  work: a,
                  study: n,
                  trip: r
                },
                ...c
              });
              this.callBackState({
                type: e,
                msg: i,
                val: l
              });
              return true;
            }
          }
        }
        useConsumables(t) {
          let e = getPetInfo();
          let l = {};
          let o = e.activeOption.ill;
          if (t.type == "medicine") {
            if (t.name != "还魂丹" && o?.cure?.name != t.name) {
              if (o?.children) {
                this.doActive({
                  type: o.children.type,
                  val: o.children,
                  activeOption: e.activeOption
                });
              }
              return {
                overType: o?.children?.type || o?.type || "err",
                type: t.type,
                opt: t,
                ill: o,
                msg: o?.children?.errTolk || o?.errTolk || "我很健康哦~不需要吃药~"
              };
            }
            l = {
              activeOption: {
                ill: null
              },
              info: {
                health: 5
              }
            };
            if (o?.successTolk) {
              this.callBackState({
                type: "normal",
                msg: o.successTolk,
                val: o
              });
            }
          }
          if (o?.type == "dead" && !l?.info) {
            return {
              overType: o.type,
              type: t.type,
              val: o,
              msg: o?.errTolk
            };
          }
          for (let o in a) {
            if (t[a[o]]) {
              let i = a[o] == "starve" ? "hunger" : a[o];
              let s = e.info[i];
              let n = e.maxInfo[i] || "999999999999";
              s = isNumber(s) + +t[a[o]];
              if (s > n) {
                s = n;
              }
              l.info ||= {};
              l.info[i] = s;
            }
          }
          if (l.info) {
            let t = isNumber(e.info.mood) + 100;
            l.info.mood = t > e.maxInfo.mood ? 1000 : t;
          }
          if (t.type == "food" || t.type == "commodity") {
            if (e.info.hunger < 720) {
              this.callBackState({
                type: "hungry",
                msg: "",
                val: {
                  type: "hungry"
                }
              });
            } else if (e.info.clean < 1080) {
              this.callBackState({
                type: "dirty",
                msg: "",
                val: {
                  type: "dirty"
                }
              });
            } else {
              this.callBackState({
                type: "normal",
                msg: "",
                val: {
                  type: t.type
                }
              });
            }
          }
          if (Object.keys(l).length > 0) {
            setPetInfo(l);
          }
          return {
            type: t.type,
            val: l,
            msg: o?.successTolk || "",
            illType: o?.type || ""
          };
        }
      }
      try {
        if (t) {
          t.exports = {
            State: o
          };
        }
      } catch (t) {}
      let i = {
        type: "dead",
        name: "死亡",
        health: 0,
        cure: {
          icon: "60001",
          name: "还魂丹"
        },
        tolk: "[host]保重，我走了，不带走一片云彩~~",
        errTolk: "您的宠物已死亡~~ ",
        successTolk: "[host]，再次见到你很高兴~~ "
      };
      let s = [{
        type: "ill",
        name: "咳嗽",
        health: 4,
        cure: {
          icon: "10003",
          name: "枇杷糖浆"
        },
        tolk: "咳咳！咳咳咳！",
        errTolk: "[host]，你给我吃什么了？~~ ",
        successTolk: "[host]，我舒服多了~~ ",
        children: {
          type: "ill",
          name: "支气管炎",
          health: 3,
          cure: {
            icon: "20003",
            name: "甘草剂"
          },
          tolk: "[host]，我已经咳好久了，你怎么还不管我啊",
          errTolk: "[host]，花点钱带我看看吧~~ ",
          successTolk: "[host]，我舒服多了~~ ",
          children: {
            type: "ill",
            name: "哮喘",
            health: 2,
            cure: {
              icon: "30003",
              name: "定喘丸"
            },
            tolk: "[host]，我……我呼吸好困难……",
            errTolk: "[host]，快带我去看病吧，我越来越严重了~~ ",
            successTolk: "[host]，我舒服多了~~ ",
            children: {
              type: "ill",
              name: "肺结核",
              health: 1,
              cure: {
                icon: "40003",
                name: "通风散"
              },
              tolk: "狠心的[host]，你一直不理我，我就要窒息而死了",
              errTolk: "[host]，我承受不了了，再不治病你就见不到我了~~ ",
              successTolk: "[host]，我舒服多了~~ ",
              children: i
            }
          }
        }
      }, {
        type: "ill",
        name: "感冒",
        health: 4,
        cure: {
          icon: "10001",
          name: "板蓝根"
        },
        tolk: "我的鼻子好象又塞了",
        errTolk: "[host]，你给我吃什么了？~~ ",
        successTolk: "[host]，我舒服多了~~ ",
        children: {
          type: "ill",
          name: "发烧",
          health: 3,
          cure: {
            icon: "30004",
            name: "退烧药"
          },
          tolk: "[host]，我的头开始发烧了……",
          errTolk: "[host]，花点钱带我看看吧~~ ",
          successTolk: "[host]，我舒服多了~~ ",
          children: {
            type: "ill",
            name: "重感冒",
            health: 2,
            cure: {
              icon: "20001",
              name: "银翘丸"
            },
            tolk: "阿- -嚏！这是我今天的第一百零一个喷嚏！",
            errTolk: "[host]，快带我去看病吧，我越来越严重了~~ ",
            successTolk: "[host]，我舒服多了~~ ",
            children: {
              type: "ill",
              name: "肺炎",
              health: 1,
              cure: {
                icon: "30001",
                name: "金色消炎药水"
              },
              tolk: "救命啊，[host]！我胸口发疼，呼吸困难，难受死啦！",
              errTolk: "[host]，我承受不了了，再不治病你就见不到我了~~ ",
              successTolk: "[host]，我舒服多了~~ ",
              children: i
            }
          }
        }
      }, {
        type: "ill",
        name: "肚子胀",
        health: 4,
        cure: {
          icon: "10002",
          name: "消食片"
        },
        tolk: "我的肚子胀胀的，好难受哦！",
        errTolk: "[host]，你给我吃什么了？~~ ",
        successTolk: "[host]，我舒服多了~~ ",
        children: {
          type: "ill",
          name: "胃炎",
          health: 3,
          cure: {
            icon: "20002",
            name: "蓝色消炎药水"
          },
          tolk: "我今天好想吐哦！",
          errTolk: "[host]，花点钱带我看看吧~~ ",
          successTolk: "[host]，我舒服多了~~ ",
          children: {
            type: "ill",
            name: "胃溃疡",
            health: 2,
            cure: {
              icon: "30002",
              name: "龙胆草"
            },
            tolk: "我的胃好疼，好心的[host]，到我去看病吧！",
            errTolk: "[host]，快带我去看病吧，我越来越严重了~~ ",
            successTolk: "[host]，我舒服多了~~ ",
            children: {
              type: "ill",
              name: "胃癌",
              health: 1,
              cure: {
                icon: "40002",
                name: "仙人汤"
              },
              tolk: "我不想死啊，呜呜呜呜呜……",
              errTolk: "[host]，我承受不了了，再不治病你就见不到我了~~ ",
              successTolk: "[host]，我舒服多了~~ ",
              children: i
            }
          }
        }
      }];
      let a = ["starve", "clean", "charm", "intel", "strong"];
    }
  };
  var e = {};
  function l(o) {
    var i = e[o];
    if (i !== undefined) {
      return i.exports;
    }
    var s = e[o] = {
      id: o,
      loaded: false,
      exports: {}
    };
    t[o](s, s.exports, l);
    s.loaded = true;
    return s.exports;
  }
  l.nmd = t => {
    t.paths = [];
    t.children ||= [];
    return t;
  };
  var o = l(852);
  module.exports = o;
})();
