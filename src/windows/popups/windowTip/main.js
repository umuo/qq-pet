const _require = eval("require"),
  path = _require("path");
class mainClass {
  constructor(e) {
    ((this.window = null), (this.show = !1), (this.name = "windowTip"));
  }
  cleate(e) {
    ((this.width = 300), (this.height = 300));
    let o = this;
    windowsMain
      .open({
        name: this.name,
        loadFile: "popups/" + this.name,
        default: { width: this.width, height: this.height },
        created(e) {
          let { vm: s, preloads: _, getinfo: i, wsMethods: t } = e;
          _({
            windowTip_h_say_m: (e, o) => {
              console.log(o, " --- windowTip_h_say_m say");
            },
            windowTip_h_bus_m: (e, _) => {
              "mounted" == _.event
                ? s.webContents.send("windowTip_m_bus", {
                    data: "load",
                    type: "load",
                  })
                : "close" == _.event && o.doClose();
            },
          });
        },
        onload() {
          (console.log("onload ", this.name), (o.show = !0));
        },
        onshow(e) {
          (console.log("onshow ", this.name), (o.window = e), (o.show = !0));
        },
        onhide() {
          (console.log("onhide ", this.name), (o.show = !1));
        },
        onclose() {
          (console.log("onclose ", this.name),
            (o.window = null),
            (o.show = !1));
        },
      })
      .then((e) => {
        ((this.window = e), this.init());
      })
      .catch((e) => {
        console.log(e);
      });
  }
  init() {
    this.show = !0;
  }
  doClose() {
    (this.window.close(), (this.show = !1));
  }
}
let main = new mainClass();
module.exports = main;
