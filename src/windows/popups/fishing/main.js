(() => {
  var e = {
    580: e => {
      let s = new class {
        constructor(e) {
          this.window = null;
          this.show = false;
          this.name = "fishing";
        }
        cleate(e) {
          if (!e.host) {
            return;
          }
          this.width = 380;
          this.height = 300;
          let s = this;
          let n = `http://${e.host}:${e.port}/${e.fileName}/windows/popups/fishing/indexOnLine.html`;
          console.log("url", n);
          windowsMain.open({
            name: this.name,
            loadFile: "popups/" + this.name,
            default: {
              width: this.width,
              height: this.height
            },
            webPreferences: {
              nodeIntegrationInSubFrames: true
            },
            created(e) {
              let {
                vm: i,
                preloads: t,
                getinfo: o,
                wsMethods: h
              } = e;
              let a = JSON.parse(JSON.stringify(getPetInfo()));
              t({
                fishing_h_say_m: (e, s) => {
                  console.log(s, " --- fishing_h_say_m say");
                },
                fishing_h_bus_m: (e, t) => {
                  if (t.event == "mounted") {
                    i.webContents.send("fishing_m_bus_h", {
                      data: n,
                      type: "load"
                    });
                  } else if (t.event == "getInfo") {
                    i.webContents.send("fishing_m_bus_h", {
                      data: a,
                      type: "setPetInfo"
                    });
                  } else if (t.event == "saveDatas") {
                    let e = {};
                    if (t.data?.fishes || t.data?.harvestfish || t.data?.canusecnt) {
                      e.fishing ||= {};
                      if (t.data.fishes) {
                        e.fishing.fishes = t.data.fishes;
                        try {
                          e.fishing.fishes = JSON.parse(t.data.fishes);
                        } catch (e) {}
                        a.fishing.fishes = e.fishing.fishes;
                      }
                      if (t.data.harvestfish) {
                        e.fishing.harvestfish = t.data.harvestfish;
                      }
                      if (t.data.canusecnt) {
                        e.fishing.canusecnt = t.data.canusecnt;
                      }
                    }
                    if (t.data?.yb) {
                      e.info ||= {};
                      e.info.yb = +t.data.yb;
                    }
                    setPetInfo(e);
                    if (t.data.getPetInfo) {
                      i.webContents.send("fishing_m_bus_h", {
                        data: a,
                        type: "setPetInfo"
                      });
                    }
                  } else if (t.event == "close") {
                    s.doClose();
                  }
                }
              });
              o([{
                event: "pet",
                name: s.name,
                fn: e => {
                  if (a.maxInfo.level != e.maxInfo.level || a.info.yb != e.info.yb || a.info.sex != e.info.sex || a.info.host != e.info.host || a.info.name != e.info.name || a.otherOptions.pinkDiamond != e.otherOptions.pinkDiamond || a.otherOptions.pinkDiamondLevel != e.otherOptions.pinkDiamondLevel || a.fishing.allvipcnt != e.fishing.allvipcnt || a.fishing.canusecnt != e.fishing.canusecnt) {
                    a = JSON.parse(JSON.stringify(e));
                    i.webContents.send("fishing_m_bus_h", {
                      data: a,
                      type: "setPetInfo"
                    });
                  }
                }
              }]);
            },
            onload() {
              console.log("onload ", this.name);
              s.show = true;
            },
            onshow(e) {
              console.log("onshow ", this.name);
              s.window = e;
              s.show = true;
            },
            onhide() {
              console.log("onhide ", this.name);
              s.show = false;
            },
            onclose() {
              console.log("onclose ", this.name);
              s.window = null;
              s.show = false;
            }
          }).then(e => {
            this.window = e;
            this.init();
          }).catch(e => {
            console.log(e);
          });
        }
        init() {
          this.show = true;
        }
        doClose() {
          this.window.close();
          this.show = false;
        }
      }();
      e.exports = s;
    }
  };
  var s = {};
  var n = function n(i) {
    var t = s[i];
    if (t !== undefined) {
      return t.exports;
    }
    var o = s[i] = {
      exports: {}
    };
    e[i](o, o.exports, n);
    return o.exports;
  }(580);
  module.exports = n;
})();
