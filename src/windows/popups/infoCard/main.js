const _require = eval("require");
class mainClass {
  constructor(e) {
    this.window = null;
    this.show = false;
    this.name = "infoCard";
  }
  cleate(e) {
    this.width = 432;
    this.height = 276;
    let o = this;
    windowsMain.open({
      name: this.name,
      loadFile: "popups/" + this.name,
      default: {
        width: this.width,
        height: this.height,
        notChangeSize: true
      },
      created(e) {
        let {
          vm: t,
          preloads: n,
          getinfo: i,
          wsMethods: s
        } = e;
        let a = {};
        const l = e => {
          if (e?.activeValue?.study) {
            for (let o in e.activeValue.study) {
              if (e.activeValue.study[o] && e.activeValue.study[o] >= 9) {
                if (a[o] != e.activeValue.study[o]) {
                  a[o] = getStudyLevel(o, e.activeValue.study[o], true);
                }
              } else if (a[o]) {
                delete a[o];
              }
            }
          } else {
            a = {};
          }
          let o = {};
          if (e.otherOptions.pinkDiamond && e.otherOptions.pinkDiamondExpirationDate) {
            o.lostTime = tool.getTime({
              defaultTime: e.otherOptions.pinkDiamondExpirationDate,
              format: "YY-MM-DD"
            });
          }
          t.webContents.send("infoCard_bus-htmlPetInfo", {
            type: "info",
            data: {
              ...e,
              studyValue: a,
              pinkDiamondStr: o
            }
          });
        };
        n({
          "infoCard_set-say": (e, o) => {
            console.log(o, " --- infoCard_set say");
          },
          "infoCard_bus-Main": (e, n) => {
            if (n.event == "mounted") {
              t.webContents.send("infoCard_bus-html", {
                type: "load"
              });
              setTimeout(() => {
                l(getPetInfo());
              }, 0);
            } else if (n.event == "close") {
              o.doClose();
            }
          },
          "infoCard_bus-Main_change": (e, o) => {
            if (o) {
              setPetInfo({
                info: o
              });
            }
          }
        });
        i([{
          event: "pet",
          name: o.name,
          fn: e => {
            l(e);
          }
        }]);
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
