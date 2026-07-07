const _require = eval("require");
class mainClass {
  constructor(t) {
    this.window = null;
    this.show = false;
    this.name = "floatStyle";
  }
  nowShotycutsMain = null;
  cleate(t) {
    let e = getScreenSize(true, true);
    this.width = e[0] - 20;
    this.height = e[1] - 20;
    let o = this;
    let n = null;
    windowsMain.open({
      name: this.name,
      loadFile: "tool/" + this.name,
      default: {
        width: this.width,
        height: this.height
      },
      created(t) {
        let e = true;
        let a = {
          much: 100,
          op: 0.3,
          opmou: 1,
          opline: 0.3,
          pointSize: 5,
          starT: 1,
          starSize: 25,
          starContent: "*",
          showIcon: true,
          showControl: {
            kjj: true,
            line: false,
            normal: true
          },
          lineOption: {
            show: false
          }
        };
        let l = Object.keys(a);
        let s = $Store.getItem("tool.floatStyle");
        if (s) {
          a = {
            ...a,
            ...s
          };
        }
        let c = {
          much: {
            add: 1,
            min: 1,
            max: 300
          },
          op: {
            add: 0.1,
            min: 0.1,
            max: 1
          },
          opmou: {
            add: 0.1,
            min: 0.1,
            max: 1
          },
          opline: {
            add: 0.1,
            min: 0.1,
            max: 1
          },
          pointSize: {
            add: 1,
            min: 1,
            max: 300
          },
          starT: {
            add: 0.1,
            min: 0.1,
            max: 1
          },
          starSize: {
            add: 1,
            min: 1,
            max: 1000
          }
        };
        const _ = () => {
          if (n) {
            clearTimeout(n);
          }
          n = setTimeout(() => {
            $Store.setItem("tool.floatStyle", a);
          }, 2000);
        };
        let h = 0;
        let d = null;
        const i = (t, e) => {
          let o = c[t].add;
          if (o != 0.1) {
            if (d) {
              clearTimeout(d);
            }
            d = setTimeout(() => {
              h = 0;
            }, 100);
            o += h;
            h++;
          }
          let n = e == "+" ? o : -o;
          let l = a[t] + n;
          l = Math.trunc(l * 10) / 10;
          if (l < c[t].min) {
            l = c[t].min;
          } else if (l > c[t].max) {
            l = c[t].max;
          }
          let s = {
            [t]: l
          };
          a[t] = l;
          _();
          return s;
        };
        let {
          vm: r,
          preloads: u,
          getinfo: m,
          wsMethods: w
        } = t;
        r.setIgnoreMouseEvents(true, {
          forward: true
        });
        u({
          floatStyle_h_say_m: (t, e) => {
            console.log(e, " --- floatStyle_h_say_m say");
          },
          floatStyle_h_bus_m: (t, e) => {
            if (e.event == "mounted") {
              r.webContents.send("floatStyle_m_bus", {
                data: "load",
                type: "load"
              });
              r.webContents.send("floatStyle_m_changeData_h", {
                type: "background",
                data: a
              });
              const {
                app: t
              } = _require("electron");
              let e = t => {
                let e = [{
                  code: ["ALT+Up"],
                  fn: () => {
                    let t = i("pointSize", "+");
                    r.webContents.send("floatStyle_m_changeData_h", {
                      type: "background",
                      data: t
                    });
                  }
                }, {
                  code: ["ALT+Down"],
                  fn: () => {
                    let t = i("pointSize");
                    r.webContents.send("floatStyle_m_changeData_h", {
                      type: "background",
                      data: t
                    });
                  }
                }, {
                  code: ["ALT+Left"],
                  fn: () => {
                    let t = i("much", "+");
                    r.webContents.send("floatStyle_m_changeData_h", {
                      type: "background",
                      data: t
                    });
                  }
                }, {
                  code: ["ALT+Right"],
                  fn: () => {
                    let t = i("much");
                    r.webContents.send("floatStyle_m_changeData_h", {
                      type: "background",
                      data: t
                    });
                  }
                }, {
                  code: ["Ctrl+Up"],
                  fn: () => {
                    let t = i("op", "+");
                    r.webContents.send("floatStyle_m_changeData_h", {
                      type: "background",
                      data: t
                    });
                  }
                }, {
                  code: ["Ctrl+Down"],
                  fn: () => {
                    let t = i("op");
                    r.webContents.send("floatStyle_m_changeData_h", {
                      type: "background",
                      data: t
                    });
                  }
                }, {
                  code: ["Ctrl+Left"],
                  fn: () => {
                    let t = i("opline", "+");
                    r.webContents.send("floatStyle_m_changeData_h", {
                      type: "background",
                      data: t
                    });
                  }
                }, {
                  code: ["Ctrl+Right"],
                  fn: () => {
                    let t = i("opline");
                    r.webContents.send("floatStyle_m_changeData_h", {
                      type: "background",
                      data: t
                    });
                  }
                }, {
                  code: ["Shift+Up"],
                  fn: () => {
                    let t = i("opmou", "+");
                    r.webContents.send("floatStyle_m_changeData_h", {
                      type: "background",
                      data: t
                    });
                  }
                }, {
                  code: ["Shift+Down"],
                  fn: () => {
                    let t = i("opmou");
                    r.webContents.send("floatStyle_m_changeData_h", {
                      type: "background",
                      data: t
                    });
                  }
                }, {
                  code: ["Alt+num8"],
                  fn: () => {
                    let t = i("starSize", "+");
                    r.webContents.send("floatStyle_m_changeData_h", {
                      type: "background",
                      data: t
                    });
                  }
                }, {
                  code: ["Alt+num2"],
                  fn: () => {
                    let t = i("starSize");
                    r.webContents.send("floatStyle_m_changeData_h", {
                      type: "background",
                      data: t
                    });
                  }
                }, {
                  code: ["Alt+num4"],
                  fn: () => {
                    let t = i("starT", "+");
                    r.webContents.send("floatStyle_m_changeData_h", {
                      type: "background",
                      data: t
                    });
                  }
                }, {
                  code: ["Alt+num6"],
                  fn: () => {
                    let t = i("starT");
                    r.webContents.send("floatStyle_m_changeData_h", {
                      type: "background",
                      data: t
                    });
                  }
                }, {
                  code: ["Alt+num5"],
                  fn: () => {
                    a.showIcon = !a.showIcon;
                    r.webContents.send("floatStyle_m_changeData_h", {
                      type: "background",
                      data: {
                        showIcon: a.showIcon
                      }
                    });
                    _();
                  }
                }];
                r.webContents.send("floatStyle_m_changeData_h", {
                  type: "open"
                });
                return {
                  manyFn: e,
                  unSet: t
                };
              };
              o.nowShotycutsMain = global?.shotycutsMain || null;
              if (o.nowShotycutsMain) {
                o.nowShotycutsMain.AddLoop({
                  name: "controlTool",
                  fns: e
                }, ["ALT", "0"], () => {
                  o.nowShotycutsMain.loopShortcut("controlTool");
                });
              } else {
                const {
                  Shotycuts: n
                } = _require("../../main/shortcuts.js");
                o.nowShotycutsMain = new n().AddLoop({
                  name: "controlTool",
                  fns: e
                }, ["ALT", "0"], () => {
                  o.nowShotycutsMain.loopShortcut("controlTool");
                });
                o.nowShotycutsMain.upShotycut("controlTool", ["ALT", "ESC"], () => {
                  t.exit([true]);
                });
              }
              o.nowShotycutsMain.upShotycut("controlTool", ["ALT", "R"], () => {
                r.webContents.reload();
                r.setIgnoreMouseEvents(true, {
                  forward: true
                });
              });
              o.nowShotycutsMain.upShotycut("controlTool", ["ALT", "Y"], () => {
                r.webContents.send("floatStyle_m_changeData_h", {
                  type: "see"
                });
              });
            } else if (e.event == "close") {
              o.doClose();
            }
          },
          "floatStyle_bus-Main_eventMouse": (t, o) => {
            if (o.canDoType) {
              e = false;
              r.setIgnoreMouseEvents(false, {
                forward: true
              });
            } else {
              e = true;
              r.setIgnoreMouseEvents(true, {
                forward: true
              });
            }
          },
          floatStyle_h_save_m: (t, e) => {
            try {
              e = JSON.parse(e);
            } catch (t) {}
            for (let t in e) {
              if (l.includes(t)) {
                a[t] = e[t];
              }
            }
            _();
          },
          floatStyle_h_openKJ_m: (t, e) => {
            if (e.open) {
              o.nowShotycutsMain.loopShortcut("controlTool");
            }
          }
        });
      },
      onload() {
        console.log("onload ", this.name);
        o.show = true;
      },
      onshow(t) {
        console.log("onshow ", this.name);
        o.window = t;
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
        if (n) {
          clearTimeout(n);
        }
      }
    }).then(t => {
      this.window = t;
      this.init();
    }).catch(t => {
      console.log(t);
    });
  }
  init() {
    this.show = true;
  }
  doClose(t) {
    if (this.nowShotycutsMain && !t) {
      this.nowShotycutsMain.deleteLoop();
    }
    this.window.close();
    this.show = false;
  }
}
let main = new mainClass();
module.exports = main;
