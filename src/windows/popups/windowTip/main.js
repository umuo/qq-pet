const _require = eval("require");
const path = _require("path");
class mainClass {
  constructor(e) {
    this.window = null;
    this.show = false;
    this.name = "windowTip";
  }
  cleate(e) {
    this.width = 300;
    this.height = 300;
    let o = this;
    windowsMain.open({
      name: this.name,
      loadFile: "popups/" + this.name,
      default: {
        width: this.width,
        height: this.height
      },
      created(e) {
        let {
          vm: s,
          preloads: _,
          getinfo: i,
          wsMethods: t
        } = e;
        _({
          windowTip_h_say_m: (e, o) => {
            console.log(o, " --- windowTip_h_say_m say");
          },
          windowTip_h_bus_m: (e, _) => {
            if (_.event == "mounted") {
              s.webContents.send("windowTip_m_bus", {
                data: "load",
                type: "load"
              });
            } else if (_.event == "close") {
              o.doClose();
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
}
let main = new mainClass();
module.exports = main;
