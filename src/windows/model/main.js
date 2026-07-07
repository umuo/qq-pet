(() => {
  var o = {
    783: o => {
      let e = new class {
        constructor(o) {
          this.window = null;
          this.show = false;
          this.name = "model";
        }
        cleate(o) {
          this.width = 300;
          this.height = 300;
          let e = this;
          windowsMain.open({
            name: this.name,
            default: {
              width: this.width,
              height: this.height
            },
            created(o) {
              let {
                vm: s,
                preloads: t,
                getinfo: n,
                wsMethods: h
              } = o;
              s.setIgnoreMouseEvents(true, {
                forward: true
              });
              t({
                model_h_say_m: (o, e) => {
                  console.log(e, " --- model_h_say_m say");
                },
                model_h_bus_m: (o, t) => {
                  if (t.event == "mounted") {
                    s.webContents.send("model_m_bus", {
                      data: "load",
                      type: "load"
                    });
                  } else if (t.event == "close") {
                    e.doClose();
                  }
                }
              });
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
  var s = function s(t) {
    var n = e[t];
    if (n !== undefined) {
      return n.exports;
    }
    var h = e[t] = {
      exports: {}
    };
    o[t](h, h.exports, s);
    return h.exports;
  }(783);
  module.exports = s;
})();
