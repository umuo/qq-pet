const _require = eval("require");
const infoCard = _require("../infoCard/main.js");
const control = _require("../control/main.js");
class mainClass {
  constructor(e) {
    this.window = null;
    this.name = "stateInfo";
    this.show = false;
    this.position = [0, 0];
  }
  cleate(e) {
    let {
      nowPosition: t,
      msg: o
    } = e;
    this.msg = o;
    let s = this;
    this.width = 190;
    this.height = 290;
    windowsMain.open({
      name: this.name,
      loadFile: "popups/" + this.name,
      default: {
        width: this.width,
        height: this.height,
        x: Math.trunc(t[0] - 95),
        y: Math.trunc(t[1] - 290),
        notChangeSize: true
      },
      created(e) {
        let {
          vm: t,
          preloads: o,
          getinfo: n,
          wsMethods: a
        } = e;
        o({
          "stateInfo_set-say": (e, t) => {
            console.log(t, " --- stateInfo_set say");
          },
          "stateInfo_bus-Main": (e, o) => {
            if (o.event == "mounted") {
              t.webContents.send("stateInfo_bus-html", {
                data: getPetInfo(),
                type: "load"
              });
              t.on("blur", e => {
                t.webContents.send("stateInfo_bus-htmlFB", {
                  type: "blur",
                  data: true
                });
              });
              t.on("focus", e => {
                t.webContents.send("stateInfo_bus-htmlFB", {
                  type: "focus",
                  data: true
                });
              });
            }
          },
          "stateInfo_bus-upData": (e, t) => {
            if (t.type != "openPetFile") {
              setPetInfo(t);
            } else if (infoCard.show) {
              infoCard.doClose();
            } else {
              infoCard.cleate();
            }
          },
          "stateInfo_bus-close": (e, t) => {
            s.doClose();
          },
          "stateInfo_bus-openActive": (e, t) => {
            if (t && control.show) {
              control.useInState({
                type: "active",
                opt: {
                  value: t
                }
              });
            }
          },
          stateInfo_h_stopState_m: (e, t) => {
            let o = getPetInfoOne("", "activeOption");
            o[o?.work ? "work" : o?.study ? "study" : o?.trip ? "trip" : ""].stopNow = true;
            setPetInfo({
              activeOption: o
            });
            petControl.GrowUp.GrowUpMain({
              unGrow: true
            });
          }
        });
        n([{
          event: "pet",
          name: s.name,
          fn: e => {
            t.webContents.send("stateInfo_bus-htmlPetInfo", {
              type: "info",
              data: getPetInfo()
            });
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
  doHide() {
    this.window.hide();
    this.show = false;
  }
  doClose() {
    this.window.close();
    this.show = false;
  }
}
let main = new mainClass();
module.exports = main;
