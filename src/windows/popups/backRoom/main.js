(() => {
  var o = {
    944: o => {
      let e = new class {
        constructor(o) {
          this.window = null;
          this.show = false;
          this.name = "backRoom";
        }
        cleate(o) {
          if (!o.host) {
            return;
          }
          this.width = 800;
          this.height = 600;
          let e = this;
          let t = `http://${o.host}:${o.port}/${o.fileName}/windows/popups/backRoom/indexOnLine.html`;
          console.log("url", t);
          windowsMain.open({
            name: this.name,
            loadFile: "popups/" + this.name,
            default: {
              width: this.width,
              height: this.height,
              skipTaskbar: false,
              alwaysOnTop: false,
              openDevTools: true
            },
            webPreferences: {
              nodeIntegrationInSubFrames: true
            },
            created(o) {
              let {
                vm: s,
                preloads: n,
                getinfo: a,
                wsMethods: h
              } = o;
              let i = JSON.parse(JSON.stringify(getPetInfo()));
              n({
                backRoom_h_say_m: (o, e) => {
                  console.log(e, " --- backRoom_h_say_m say");
                },
                backRoom_h_bus_m: (o, n) => {
                  if (n.event == "mounted") {
                    s.webContents.send("backRoom_m_bus_h", {
                      data: t,
                      type: "load"
                    });
                  } else if (n.event == "getInfo") {
                    s.webContents.send("backRoom_m_bus_h", {
                      data: i,
                      type: "setPetInfo"
                    });
                  } else if (n.event == "saveDatas") {
                    setPetInfo({});
                    if (n.data.getPetInfo) {
                      s.webContents.send("backRoom_m_bus_h", {
                        data: i,
                        type: "setPetInfo"
                      });
                    }
                  } else if (n.event == "close") {
                    e.doClose();
                  }
                }
              });
              a([{
                event: "pet",
                name: e.name,
                fn: o => {}
              }]);
            },
            onload() {
              console.log("onload ", this.name);
              e.show = true;
            },
            onshow(o) {
              console.log("onshow ", this.name);
              e.window = o;
              e.show = true;
            },
            onhide() {
              console.log("onhide ", this.name);
              e.show = false;
            },
            onclose() {
              console.log("onclose ", this.name);
              e.window = null;
              e.show = false;
            }
          }).then(o => {
            this.window = o;
            this.init();
          }).catch(o => {
            console.log(o);
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
      o.exports = e;
    }
  };
  var e = {};
  var t = function t(s) {
    var n = e[s];
    if (n !== undefined) {
      return n.exports;
    }
    var a = e[s] = {
      exports: {}
    };
    o[s](a, a.exports, t);
    return a.exports;
  }(944);
  module.exports = t;
})();
