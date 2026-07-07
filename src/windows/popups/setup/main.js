const _require = eval("require");
const {
  app
} = _require("electron");
const {
  getLogs
} = _require("../../../service/model/user");
const ex = process.execPath;
class mainClass {
  constructor(e) {
    this.window = null;
    this.show = false;
    this.name = "setup";
  }
  cleate(e) {
    this.width = 350;
    this.height = 311;
    let t = this;
    windowsMain.open({
      name: this.name,
      loadFile: "popups/" + this.name,
      jsFiles: ["./util/move.js"],
      default: {
        width: this.width,
        height: this.height
      },
      created(e) {
        let {
          vm: a,
          preloads: o,
          getinfo: s,
          wsMethods: n
        } = e;
        let l = [];
        let i = [];
        let d = [];
        const u = ["stopGrowth"];
        let p = {};
        const r = e => {
          delete (e = {
            ...e,
            ...e.shortcuts
          }).shortcuts;
          a.webContents.send("setup_m_sysInfo_h", {
            data: JSON.stringify(e),
            type: "sysInfo"
          });
        };
        let h = false;
        o({
          setup_h_say_m: (e, t) => {
            console.log(t, " --- setup_h_say_m say");
          },
          setup_h_bus_m: (e, o) => {
            if (o.event == "mounted") {
              r(getSys());
              a.webContents.send("setup_m_bus_h", {
                data: "load",
                type: "load",
                version: app.getVersion()
              });
              if (l.length > 0) {
                a.webContents.send("setup_m_bus_h", {
                  data: l,
                  type: "showLog",
                  version: app.getVersion()
                });
              } else {
                getLogs().then(e => {
                  console.log("logs", "res");
                  if (e?.logs) {
                    l = e.logs;
                    let t = {
                      label: "赞助池",
                      value: "当前赞助Q币小伙伴~",
                      type: "see",
                      values: []
                    };
                    for (let a in e.sponsorList) {
                      t.values.push(e.sponsorList[a].name + " QQ：" + hideAccountName(e.sponsorList[a].account) + "； ");
                    }
                    let o = {
                      label: "赞助资源",
                      value: "当前赞助程序代码小伙伴~",
                      type: "see",
                      values: []
                    };
                    for (let t in e.sourceList) {
                      let a = "";
                      for (let o in e.sourceList[t].addList) {
                        if (o != 0) {
                          a += "、";
                        }
                        a += e.sourceList[t].addList[o].name;
                      }
                      o.values.push(e.sourceList[t].name + " QQ：" + hideAccountName(e.sourceList[t].account) + " 资源：" + a + "； ");
                    }
                    d = [t, o];
                    i = e.myMd?.values;
                    if (a?.webContents?.send) {
                      a.webContents.send("setup_m_bus_h", {
                        data: l,
                        mvs: i,
                        zz: d,
                        type: "showLog",
                        version: app.getVersion()
                      });
                    }
                  } else {
                    l = [];
                    if (a?.webContents?.send) {
                      a.webContents.send("setup_m_bus_h", {
                        type: "showLog",
                        version: app.getVersion()
                      });
                    }
                  }
                }).catch(e => {
                  l = [];
                  if (a?.webContents?.send) {
                    a.webContents.send("setup_m_bus_h", {
                      type: "showLog",
                      version: app.getVersion()
                    });
                  }
                });
              }
            } else if (o.event == "close") {
              t.doClose();
            }
          },
          setup_h_setStting_m: (e, t) => {
            try {
              t.data = JSON.parse(t.data);
            } catch (e) {}
            if (t.type == "saveChange") {
              let e = [0, 0];
              for (let a in t.data) {
                if (t.data[a].type == "shortcutKeys") {
                  let o = changeShotycuts({
                    name: t.data[a].changeValue,
                    key: t.data[a].changeKey,
                    type: "upData"
                  });
                  if (o?.upDataShotycutName == t.data[a].changeValue) {
                    setSys({
                      upName: "shortcuts",
                      name: o.upDataShotycutName,
                      value: t.data[a].changeKey
                    });
                    e[0]++;
                  } else {
                    e[1]++;
                  }
                }
              }
              let a = "";
              if (e[0] == 0 && e[1] == 0) {
                a = "[host],没想好要怎么设置么~~~";
              } else if (e[0] == Object.keys(t.data).length) {
                a = "[host],保存成功哦~~~";
              } else if (e[0] == 0 && e[1] != 0) {
                a = "[host],保存失败啦~~~";
              } else if (e[0] != 0 && e[1] != 0) {
                a = "[host],要看看有些设置没有保存成功哦~~~";
              }
              openSpeak({
                data: {
                  type: "text",
                  data: a
                }
              });
              return;
            }
            if (t.data?.type == "radio") {
              if (t.data.value == "stopGrowth") {
                if (t.data?.data) {
                  setPetInfo({
                    maxInfo: {
                      stopGrowth: false
                    }
                  });
                  petControl.determineHealth({
                    communication: ["state", "startGrowth"]
                  });
                } else {
                  setPetInfo({
                    maxInfo: {
                      stopGrowth: true
                    }
                  });
                  changeTraysIcon({
                    name: "pause"
                  });
                }
                return;
              }
              if (t.data.value == "startupSelf") {
                let e = {
                  data: {
                    type: "text"
                  },
                  nextActiveStr: "speak"
                };
                if (t.data?.data) {
                  app.setLoginItemSettings({
                    openAtLogin: false,
                    path: ex,
                    args: []
                  });
                  e.communication = ["startupSelf", "startupSelfOff"];
                } else {
                  app.setLoginItemSettings({
                    openAtLogin: true,
                    path: ex,
                    args: []
                  });
                  e.communication = ["startupSelf", "startupSelfOn"];
                }
                openSpeak(e);
              } else if (t.data.value == "floatStyle") {
                if (t.data?.data) {
                  if (toolWindow?.floatStyle?.show === true) {
                    toolWindow.floatStyle.doClose();
                  }
                } else if (toolWindow?.floatStyle?.show === false) {
                  toolWindow.floatStyle.cleate();
                }
              }
              setSys({
                name: t.data?.value,
                value: !t.data?.data
              });
            }
            if (t.data?.type == "slider") {
              let e = t.data.data;
              if (t.data.useType == "up") {
                e += 0.1;
              } else if (t.data.useType == "down") {
                e -= 0.1;
              }
              if (e > 1) {
                e = 1;
              } else if (e <= 0) {
                e = 0.01;
              }
              setSys({
                name: t.data?.value,
                value: e
              });
            }
            if (t.data?.type == "input") {
              setSys({
                name: t.data.value,
                value: t.data.data || ""
              });
            }
            if (t.data?.type == "buts") {
              if (h) {
                return;
              }
              h = true;
              if (t.data.value == "newScreen") {
                getScreenSize(true);
              } else if (t.data.value == "homing") {
                let e = getScreenSize(true, true);
                doMovePosition({
                  toPosition: [70, e[1] - 200]
                });
                setTimeout(() => {
                  doMovePosition({
                    toPosition: [70, e[1] - 200]
                  });
                  h = false;
                }, 100);
                openSpeak({
                  data: {
                    type: "text",
                    data: "[host]，我在这里 ~~~"
                  },
                  active: "appear",
                  nextActiveStr: "appear"
                });
              } else if (t.data.value == "getOption") {
                setSys({
                  name: t.data?.value,
                  value: "cantSee"
                });
                setTimeout(() => {
                  h = false;
                }, 100);
              } else if (t.data.value == "sex") {
                let e = $Store.getItem("pet")?.info?.sex == "GG" ? "MM" : "GG";
                $Store.clear();
                $Store.setItem("toSex", e);
                app.relaunch();
                app.exit(0);
              } else if (t.data.value == "testLlm") {
                const k = getSys("llmApiKey");
                const u = getSys("llmUrl");
                if (!k && !u) {
                  openSpeak({
                    data: {
                      type: "text",
                      data: "[host]，先填上 API URL 或 API Key 再来测试~~~"
                    }
                  });
                } else {
                  openSpeak({
                    data: {
                      type: "text",
                      data: "[host]，正在测试连接，请稍等~~~"
                    }
                  });
                  llmService.test(k || "", getPetInfo()).then(ok => {
                    openSpeak({
                      data: {
                        type: "text",
                        data: ok ? "[host]，AI 连接成功！我会说新台词啦~~~" : "[host]，连接失败，检查 API 配置或网络~~~"
                      }
                    });
                  }).catch(() => {
                    openSpeak({
                      data: {
                        type: "text",
                        data: "[host]，测试出错了，检查下网络及配置吧~~~"
                      }
                    });
                  });
                }
              } else if (t.data.value == "newProgram") {
                if (UpDateProgram) {
                  UpDateProgram(true);
                }
              } else if (t.data.value == "urlWindow") {
                toolWindow?.urlWindow.openImages();
              } else if (t.data.value == "urlWindowOpen") {
                if (toolWindow?.urlWindow?.show === false) {
                  toolWindow.urlWindow.cleate();
                }
              } else if (t.data.value == "viewSwf" || t.data.value == "viewSwf") {
                if (toolWindow?.viewSwf?.show === false) {
                  toolWindow.viewSwf.cleate();
                }
              } else if (t.data.value == "floatStyle" && toolWindow?.floatStyle?.show === false) {
                toolWindow.floatStyle.cleate();
              }
              setTimeout(() => {
                h = false;
              }, 300);
            }
          }
        });
        s([{
          event: "pet",
          name: t.name,
          fn: e => {
            (e => {
              if (e.changeMax) {
                for (let t in u) {
                  if (e.changeMax?.[u[t]] != null) {
                    p[u[t]] = e.maxInfo[u[t]];
                    a.webContents.send("setup_m_sysInfo_h", {
                      data: JSON.stringify(p),
                      type: "petInfo"
                    });
                  }
                }
              }
            })(e);
          }
        }, {
          event: "system",
          name: t.name,
          fn: e => {
            r(e);
          }
        }]);
      },
      onload() {
        console.log("onload ", this.name);
        t.show = true;
      },
      onshow(e) {
        console.log("onshow ", this.name);
        t.window = e;
        t.show = true;
      },
      onhide() {
        console.log("onhide ", this.name);
        t.show = false;
      },
      onclose() {
        console.log("onclose ", this.name);
        t.window = null;
        t.show = false;
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
