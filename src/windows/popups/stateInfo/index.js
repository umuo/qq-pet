(() => {
  var e = {};
  var t = (e, t) => {
    window.electronAPI[e](JSON.parse(JSON.stringify(t)));
  };
  const o = {
    data: () => ({
      petInfo: {},
      closeTime: null,
      getGrowth: [0, 0, 0],
      bone: [{
        icon: "dengji"
      }],
      valueList: {
        hunger: {
          label: "饥饿：",
          type: "food",
          value: [0, 0],
          background: ""
        },
        clean: {
          label: "清洁：",
          type: "clean",
          value: [0, 0],
          background: ""
        },
        health: {
          label: "健康：",
          type: "cure",
          value: [0, 0],
          background: ""
        },
        mood: {
          label: "心情：",
          value: [0, 0],
          background: ""
        }
      },
      petState: {
        msg: ""
      },
      hoverNum: true,
      msgOpt: {
        work: "已工作",
        study: "已学习",
        trip: "已旅行"
      },
      canStopState: false
    }),
    watch: {
      petInfo: {
        handler(e, t) {
          for (let t in e.info) {
            let o = e.info[t] / e.maxInfo[t];
            this.valueList[t] &&= {
              ...this.valueList[t],
              value: [e.info[t] + "", e.maxInfo[t] + ""],
              background: o > 0.6 ? "shenglan" : o > 0.3 ? "huangse" : "hongse"
            };
          }
          if (e.maxInfo.level) {
            let t = +e.maxInfo?.level || 0;
            t = t / 5 | 0;
            let o = t / 8 | 0;
            let n = o * 8;
            let i = (t - n) / 4 | 0;
            let a = i * 4;
            let s = (t - n - a) / 2 | 0;
            let l = t - n - a - s * 2 + 1;
            if (!i && !s && !l) {
              l++;
            }
            this.bone = [];
            if (o) {
              for (let e = o; e > 0; e--) {
                this.bone.push({
                  icon: "dengji3"
                });
              }
            }
            if (i) {
              for (let e = i; e > 0; e--) {
                this.bone.push({
                  icon: "dengji2"
                });
              }
            }
            if (s) {
              for (let e = s; e > 0; e--) {
                this.bone.push({
                  icon: "dengji1"
                });
              }
            }
            if (l) {
              for (let e = l; e > 0; e--) {
                this.bone.push({
                  icon: "dengji"
                });
              }
            }
          }
          let o = e?.info?.growth || 0;
          let n = e?.maxInfo?.nextGrowth || 0;
          let i = e?.maxInfo?.upGrowth || 0;
          this.getGrowth[0] = Math.trunc(o);
          this.getGrowth[1] = Math.trunc(n);
          this.getGrowth[2] = Math.trunc(i);
          let a = "";
          let s = false;
          for (let t in e.activeOption) {
            if (e.activeOption[t]) {
              let o = e.activeOption[t];
              if (t == "work" || t == "study" || t == "trip") {
                a = this.getActiveMsg(t, o);
                s = true;
              }
              if (t == "ill") {
                a = o.name == "死亡" ? "死亡了~" : "生病了~";
                break;
              }
            }
          }
          this.canStopState = s;
          if (a != "死亡了~" && e?.maxInfo?.stopGrowth) {
            a = "暂停成长~";
          }
          this.petState.msg = a || "成长中~";
        },
        deep: true
      }
    },
    computed: {},
    created() {},
    mounted() {
      var e;
      window.electronAPI.stateInfo_ToHtml((e, t) => {
        if (t.type == "load") {
          this.petInfo = t.data;
          seeApp();
        }
      });
      window.electronAPI.stateInfo_ToHtmlPetInfo((e, t) => {
        if (t.type == "info") {
          this.petInfo = t.data;
        }
      });
      window.electronAPI.stateInfo_ToHtmlFB((e, t) => {
        if (t.type == "focus" && this.closeTime) {
          clearTimeout(this.closeTime);
        }
        t.type;
      });
      e = {
        event: "mounted"
      };
      window.electronAPI.stateInfo_ToMain(JSON.parse(JSON.stringify(e)));
    },
    methods: {
      stopState() {
        window.electronAPI.stateInfo_h_stopState();
      },
      getActiveMsg(e, t) {
        let o = "";
        o = t.stopNow ? "马上回家了~" : t.stateTime >= t.overTime ? e == "work" ? "打工结算中~" : "放学回家中~" : this.msgOpt[e] + t.stateTime + "分钟";
        return o;
      },
      openPetFile() {
        t("stateInfo_ToMainUpData", {
          type: "openPetFile"
        });
      },
      doSweetHeart(e) {
        t("stateInfo_ToMainUpData", {
          otherOptions: {
            sweetHeart: e
          }
        });
      },
      toPercent: (e, t, o) => o ? (+e - +o) / (+t - +o) * 100 + "%" : +e / +t * 100 + "%",
      goClose() {
        if (this.closeTime) {
          clearTimeout(this.closeTime);
        }
        this.closeTime = setTimeout(() => {
          window.electronAPI.stateInfo_ToMainClose("close");
        }, 100);
      },
      chooseOnce(e) {
        if (e.type) {
          window.electronAPI.stateInfo_ToMainOpenActive(e.type);
        } else {
          this.hoverNum = !this.hoverNum;
        }
      }
    }
  };
  Vue.createApp(o).mount("#app");
  var n = window;
  for (var i in e) {
    n[i] = e[i];
  }
  if (e.__esModule) {
    Object.defineProperty(n, "__esModule", {
      value: true
    });
  }
})();
