(() => {
  var e = {
    693: e => {
      let o = new class {
        constructor(e) {
          this.window = null;
          this.show = false;
          this.name = "smallGame";
        }
        cleate(e) {
          this.width = 600;
          this.height = 600;
          let o = this;
          windowsMain.open({
            name: this.name,
            loadFile: "popups/" + this.name,
            default: {
              width: this.width,
              height: this.height,
              frame: true,
              alwaysOnTop: false,
              skipTaskbar: false,
              transparent: false,
              resizable: true
            },
            created(e) {
              let {
                vm: s,
                preloads: t,
                getinfo: n,
                wsMethods: l
              } = e;
              t({
                smallGame_h_say_m: (e, o) => {
                  console.log(o, " --- smallGame_h_say_m say");
                },
                smallGame_h_bus_m: (e, t) => {
                  if (t.event == "mounted") {
                    s.webContents.send("smallGame_m_bus", {
                      data: "load",
                      type: "load"
                    });
                    s.setTitle("小游戏：请选择");
                  } else if (t.event == "close") {
                    o.doClose();
                  } else if (t.event == "showSwf") {
                    s.setTitle("小游戏：" + t.title);
                  }
                }
              });
            },
            onload() {
              console.log("onload ", this.name);
              o.show = true;
            },
            onshow(e) {
              console.log("onshow ", this.name);
              o.window = e;
              o.show = true;
            },
            onhide() {
              console.log("onhide ", this.name);
              o.show = false;
            },
            onclose() {
              console.log("onclose ", this.name);
              o.window = null;
              o.show = false;
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
      e.exports = o;
    }
  };
  var o = {};
  var s = function s(t) {
    var n = o[t];
    if (n !== undefined) {
      return n.exports;
    }
    var l = o[t] = {
      exports: {}
    };
    e[t](l, l.exports, s);
    return l.exports;
  }(693);
  module.exports = s;
})();
