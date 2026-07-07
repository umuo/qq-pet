const _require = eval("require");
const checkUpdate = _require("../util/UpdateController");
const {
  app,
  globalShortcut,
  screen
} = _require("electron");
const {
  myPet
} = _require("../util/pet/petIndex");
const {
  MenuCreate
} = _require("./menu");
global.petControl = new myPet();
const stateInfo = _require("../popups/stateInfo/main.js");
const control = _require("../popups/control/main.js");
const tip = _require("../popups/tip/main.js");
let saveSpeakData = null;
global.openSpeak = e => {
  saveSpeakData = e;
};
const clipboardWatcher = _require("./clip.js");
let clipboardWatcherMain = null;
const rightMenu = _require("../popups/rightMenu/main.js");
const {
  getCommunication
} = _require("../util/pet/communication");
const {
  Shotycuts
} = _require("./shortcuts.js");
let shotycutsMain = null;
_require("./Notification.js");
global.toolWindow = {
  floatStyle: _require("../tool/floatStyle/main.js"),
  urlWindow: _require("../tool/urlWindow/main"),
  viewSwf: _require("../tool/viewSwf/main")
};
class mainClass {
  constructor(e) {
    this.window = null;
    this.show = false;
    this.name = "main";
    this.menu = null;
    this.loadTime = {
      seeControlTime: null
    };
  }
  reLoad = true;
  cleate(e) {
    let {
      web: t,
      defaultPetInfo: o
    } = e;
    this.maxSize = [180, 180];
    this.nowPosition = [0, 0];
    this.width = this.maxSize[0];
    this.height = this.maxSize[1];
    let n = this;
    let i = null;
    this.bd = true;
    this.wellClose = false;
    this.petState = "";
    let a = {};
    if (this.bd) {
      a.jsFiles = ["./util/move.js", "./util/pet/swfPet.js", "../service/websocket.js"];
    } else {
      a.url = `http://${t.host}:${t.post}/${t.fileName}/windows/main/indexOnline.html`;
    }
    windowsMain.open({
      name: this.name,
      ...a,
      default: {
        width: this.width || getScreenSize()[0],
        height: this.height || getScreenSize()[1]
      },
      created(e) {
        let {
          vm: t,
          preloads: a,
          getinfo: s,
          wsMethods: l
        } = e;
        n.nowPosition = t.getPosition();
        let c = {
          food: "eat",
          commodity: "clean",
          medicine: "cure"
        };
        global.changeTraysIcon = e => {
          let {
            name: t = null,
            time: o = null,
            change: a = false
          } = e;
          if (n.menu?.activeTraysIcon) {
            n.menu?.activeTraysIcon({
              name: t,
              time: o,
              change: a
            });
          } else {
            i = {
              name: t,
              time: o,
              change: a
            };
          }
        };
        petControl.init({
          petInfo: getPetInfo(),
          fn: {
            backState: (e = {}) => {
              let {
                type: t,
                msg: o,
                val: n,
                speak: i,
                speakType: a,
                otherData: s,
                active: l = null,
                communication: c = null,
                change: r = false
              } = e;
              if (i && (o || c)) {
                openSpeak({
                  data: {
                    type: a || "text",
                    data: o || "",
                    ...(s || {})
                  },
                  active: l || "speak",
                  nextActiveStr: "speak,sick,hungry,dirty",
                  communication: c || null
                });
              }
              changeTraysIcon({
                name: t,
                change: r
              });
            },
            backActive: (e = {}) => {
              setSay("backActive :>> ", e);
              if (e.msg || e.communication) {
                let t = c?.[e.type] || e.type;
                let o = "";
                if (t == "cure") {
                  if (e.overType == "ill") {
                    t = "sick";
                  } else if (e.overType == "dead") {
                    t = "die";
                  } else if (e.illType == "dead") {
                    t = "revival";
                    o = "revival";
                  } else if (e.overType == "err") {
                    t = "speak";
                    o = "speak";
                  }
                }
                openSpeak({
                  data: {
                    type: "text",
                    data: e.msg,
                    finish: t == "revival"
                  },
                  active: t,
                  communication: e.communication || null,
                  nextActiveStr: o
                });
              } else {
                t.webContents.send("main_bus-html_active", {
                  active: c?.[e.type] || e.type
                });
              }
            }
          }
        });
        global.setSay = function (...e) {
          let o = ["↓↓↓↓↓↓↓↓↓↓↓" + tool.getTime()];
          for (let e in arguments) {
            o.push(arguments[e]);
          }
          o.push("↑↑↑↑↑↑↑↑↑↑");
          t.webContents.send("main_bus-html_setSay", JSON.stringify(o));
        };
        global.doMovePosition = e => {
          if (e?.toPosition) {
            e.maxSize = n.maxSize;
            n.nowPosition = e?.toPosition;
          } else {
            n.nowPosition = [n.nowPosition[0] - e.next[0], n.nowPosition[1] - e.next[1]];
            let t = e.next;
            for (let o in n.nowPosition) {
              if (n.nowPosition[o] <= 0) {
                n.nowPosition[o] = 0;
                t[o] = 0;
              } else if (n.nowPosition[o] >= getScreenSize()[o] - e.maxSize[0]) {
                n.nowPosition[o] = getScreenSize()[o] - e.maxSize[0];
                t[o] = 0;
              }
            }
          }
          let o = {
            x: +n.nowPosition[0],
            y: +n.nowPosition[1],
            height: 144,
            width: 144
          };
          var i;
          var a;
          if (!e.notChangeSize) {
            n.maxSize = e.maxSize;
            o = {
              ...o,
              height: e.maxSize[1],
              width: e.maxSize[0]
            };
          }
          t.setBounds(o);
          i = n.nowPosition;
          a = getScreenSize();
          if (tip.show) {
            tip.setPosition({
              position: i,
              maxSize: n.maxSize
            });
          }
          if (!n.isStop()) {
            if (control?.isCleate) {
              control.setPosition({
                position: i,
                screenData: a,
                maxSize: n.maxSize
              });
            } else {
              control.cleate({
                position: i,
                screenData: a,
                maxSize: n.maxSize
              }, t);
            }
            t.webContents.send("main_bus-html_setPotision", i, a);
          }
        };
        let r = [n.nowPosition[0] - +o.info.lastX, n.nowPosition[1] - +o.info.lastY];
        doMovePosition({
          next: r,
          maxSize: n.maxSize
        });
        app.on("before-quit", e => {
          if (global.isQuittingForUpdate) {
            n.wellClose = true;
            setOutProjectMain(true);
            setSys({
              name: "doNotDisturb",
              value: false
            });
            setPetInfo({
              info: {
                lastX: n.nowPosition[0],
                lastY: n.nowPosition[1]
              }
            });
            if (clipboardWatcherMain?.stop) {
              clipboardWatcherMain.stop();
            }
            if (shotycutsMain?.cleanOur) {
              shotycutsMain.cleanOur();
            }
            for (let e in windowsMain.wins) {
              if (e != "main" && windowsMain.wins[e]?.win?.close) {
                try {
                  windowsMain.wins[e].win.close();
                } catch (e) {}
              }
            }
            return;
          }
          if (!n.wellClose) {
            n.wellClose = true;
            e.preventDefault();
            setOutProjectMain(true);
            setSys({
              name: "doNotDisturb",
              value: false
            });
            setPetInfo({
              info: {
                lastX: n.nowPosition[0],
                lastY: n.nowPosition[1]
              }
            });
            setTimeout(() => {
              try {
                app.quit();
              } catch (e) {}
            }, 30000);
            if (clipboardWatcherMain?.stop) {
              clipboardWatcherMain.stop();
            }
            if (shotycutsMain?.cleanOur) {
              shotycutsMain.cleanOur();
            }
            if (n.menu?.activeTraysIcon) {
              n.menu?.activeTraysIcon({
                name: "leave",
                change: true
              });
            }
            if (n.menu?.setTrayToolTip) {
              n.menu?.setTrayToolTip("正在退出···");
            }
            for (let e in windowsMain.wins) {
              if (e != "main" && windowsMain.wins[e]?.win?.close) {
                try {
                  windowsMain.wins[e].win.close();
                } catch (e) {}
              }
            }
            openSpeak({
              data: {
                type: "text",
                load: "exit",
                finish: "exit"
              },
              communication: ["state", "exit"],
              active: "exit",
              nextActiveStr: "exit"
            });
          }
        });
        app.on("second-instance", () => {
          if (!n.isStop()) {
            try {
              openSpeak({
                data: {
                  type: "text",
                  data: "[host]，我在这里 ~~~"
                },
                active: "appear",
                nextActiveStr: "appear"
              });
              setTimeout(() => {
                n.appear();
              }, 80);
            } catch (e) {
              setTimeout(() => {
                app.quit();
              }, 500);
            }
          }
        });
        a({
          "html_set-say": (e, t) => {
            mylog(t, " --- html_set-say say");
          },
          "html_bus-Main": (e, o) => {
            if (o.event == "mounted") {
              petControl.startGrowUp();
              if (getSys("llmEnabled")) {
                llmService.prefetch("smallTalk", getPetInfo());
                llmService.prefetch("toHeartTolk", getPetInfo());
              }
              if (typeof focusGuard !== "undefined" && focusGuard?.start) {
                focusGuard.start();
              }
              let e = getPetInfo();
              t.webContents.send("main_bus-html", {
                data: "load",
                type: "load",
                screenSize: n.screenSize,
                nowPosition: n.nowPosition,
                maxSize: n.maxSize,
                petInfo: e,
                bd: n.bd
              });
              n.menu?.setTrayToolTip(e.info.host + "家的" + e.info.name);
              global.nextActive = e => {
                t.webContents.send("main_m_nextActive_h", {
                  data: JSON.stringify(e)
                });
              };
              global._buildLLMCtx = kind => {
                const pi = getPetInfo();
                const info = pi?.info || {};
                const maxInfo = pi?.maxInfo || {};
                if (kind === "enter") {
                  const now = new Date();
                  const h = now.getHours();
                  const period = h < 6 ? "凌晨" : h < 12 ? "早上" : h < 14 ? "中午" : h < 18 ? "下午" : h < 22 ? "晚上" : "深夜";
                  const lastLogin = +info.lastLoginTime || 0;
                  let intervalStr = "刚刚";
                  if (lastLogin > 0) {
                    const diffMs = Date.now() - lastLogin;
                    const diffMin = Math.floor(diffMs / 60000);
                    if (diffMin >= 1440) {
                      intervalStr = `${Math.floor(diffMin / 1440)}天`;
                    } else if (diffMin >= 60) {
                      intervalStr = `${Math.floor(diffMin / 60)}小时`;
                    } else if (diffMin >= 1) {
                      intervalStr = `${diffMin}分钟`;
                    }
                  }
                  return {
                    timeStr: `${period}${h}点`,
                    intervalStr
                  };
                }
                if (kind === "levUp") {
                  const lv = +maxInfo.level || 1;
                  return {
                    level: lv,
                    ageStage: lv <= 4 ? "蛋" : lv < 9 ? "幼年" : "成年"
                  };
                }
                if (kind === "stateEat" || kind === "stateClean") {
                  const k = kind === "stateEat" ? "hunger" : "clean";
                  const v = +info[k] || 0;
                  const max = +maxInfo[k] || 3100;
                  return {
                    value: v,
                    max,
                    percent: Math.round(v / max * 100)
                  };
                }
                return null;
              };
              global.openSpeak = e => {
                let {
                  data: o,
                  active: n,
                  type: i,
                  nextActiveStr: a = "",
                  communication: s = null,
                  otherOpt: l = null
                } = e;
                if (!getSys("doNotDisturb") || o?.mustSpeak) {
                  if ((o.type == "text" || o.type == "seeTextImgs") && typeof s == "object" && s?.length > 0) {
                    let _rec = null;
                    if (getSys("llmEnabled") && s?.length === 1 && (s[0] === "smallTalk" || s[0] === "toHeartTolk")) {
                      _rec = llmService.dequeue(s[0]);
                      llmService.prefetch(s[0], getPetInfo());
                    }
                    if (!_rec && getSys("llmEnabled") && s?.length === 2 && s[0] === "state" && (s[1] === "eat" || s[1] === "clean")) {
                      const _pk = s[1] === "eat" ? "stateEat" : "stateClean";
                      llmService.generateOnce(_pk, _buildLLMCtx(_pk), getPetInfo()).then(r => {
                        const _final = r?.tolk ? r : getCommunication(...s);
                        openSpeak({
                          ...e,
                          communication: null,
                          data: {
                            ...o,
                            data: _final?.tolk || o.data || "",
                            submitText: _final?.submitText || o.submitText || ""
                          }
                        });
                      });
                      return;
                    }
                    if (!_rec) {
                      _rec = getCommunication(...s);
                    }
                    if (_rec?.tolk) {
                      o.data = _rec.tolk;
                      o.submitText = _rec?.submitText || "";
                    }
                  }
                  t.webContents.send("main_bus-html_active", {
                    active: n || "speak",
                    type: i || "speak",
                    load: o.load ? JSON.stringify(o?.load?.msg || o) : !o.finish && JSON.stringify(o),
                    finish: o.finish && JSON.stringify(o),
                    otherOpt: l
                  });
                  if (a) {
                    nextActive({
                      name: a
                    });
                  }
                }
              };
              if (saveSpeakData) {
                openSpeak(saveSpeakData);
                saveSpeakData = null;
              }
              t.on("blur", e => {
                if (control.show) {
                  control?.changeState("hide");
                }
              });
              if (n.reLoad) {
                clearTimeout(n.reLoad);
              }
              n.reLoad = setTimeout(() => {
                n.reLoad = false;
              }, 2000);
              let o = (e, t, o) => {
                n.openSpeak({
                  data: {
                    type: "text",
                    data: e,
                    submitText: t,
                    form: "clip"
                  },
                  otherOpt: {
                    type: "click",
                    fn: () => {
                      if (o) {
                        o();
                      }
                    }
                  }
                });
              };
              global.playPetAnimation = activeStr => {
                t.webContents.send("main_bus-html_active", {
                  active: activeStr
                });
              };
              global.doWindowEffect = effectType => {
                if (effectType === "shake") {
                  let count = 0;
                  const interval = setInterval(() => {
                    if (count++ > 20) {
                      return clearInterval(interval);
                    }
                    const dx = (Math.random() - 0.5) * 20;
                    const dy = (Math.random() - 0.5) * 20;
                    t.setBounds({
                      x: Math.round(n.nowPosition[0] + dx),
                      y: Math.round(n.nowPosition[1] + dy),
                      width: 144,
                      height: 144
                    });
                  }, 50);
                } else if (effectType === "float") {
                  let tick = 0;
                  const baseY = n.nowPosition[1];
                  const interval = setInterval(() => {
                    if (tick++ > 100) {
                      clearInterval(interval);
                      t.setBounds({
                        x: Math.round(n.nowPosition[0]),
                        y: Math.round(baseY),
                        width: 144,
                        height: 144
                      });
                      return;
                    }
                    const dy = Math.sin(tick * 0.2) * 30;
                    t.setBounds({
                      x: Math.round(n.nowPosition[0]),
                      y: Math.round(baseY + dy),
                      width: 144,
                      height: 144
                    });
                  }, 50);
                }
              };
              global.UpDateProgram = e => {
                console.log("UpDateProgram");
                checkUpdate(t => {
                  console.log("begin up");
                  let i = "";
                  if (t.type == "up") {
                    i = `\n                                    最新版本：${t.info?.version};\n                                    ${t.info?.releaseNotes}\n                                    ;点击下载 ~\n                                    `;
                    o(i, "立即下载", () => {
                      if (t.fn) {
                        t.fn();
                      }
                    });
                  } else if (t.type == "sc") {
                    i = `\n                                    下载进度： ${t.sc.percent}%；\n                                    当前网速： ${t.sc.speed}\n                                    `;
                    o(i, "取消下载", () => {
                      if (t.fn) {
                        t.fn();
                      }
                      setTimeout(() => {
                        n.openSpeak({
                          data: {
                            type: "text",
                            data: "已取消下载~",
                            submitText: "ok",
                            form: "clip"
                          }
                        });
                      }, 0);
                    });
                  } else if (t.type == "down") {
                    o("最新版本已下载完成", "立即安装~", () => {
                      if (t.fn) {
                        t.fn();
                      }
                    });
                  } else if (t.type == "not" && e) {
                    o(t.msg || "当前已经是最新版~", () => {});
                  }
                });
              };
              setTimeout(() => {
                global.UpDateProgram();
              }, 8000);
            } else if (o.event == "close") {
              n.close();
            }
          },
          "html_bus-main_move": (e, t) => {
            doMovePosition(t);
          },
          "html_bus-main_getFocus": (e, t) => {},
          "html_bus-main_mouse": (e, t) => {
            if (!n.isStop()) {
              if (t.type == "which") {
                if (control.show && t?.data?.isDown) {
                  if ((n.petState == "normal" || n.petState == "sick") && getPetInfoOne("health", "info") && getChance(0.2)) {
                    let e = getRandom(5, 20);
                    if (e < 1000) {
                      e = +getPetInfoOne("mood", "info") + e;
                      if (e > 1000) {
                        e = 1000;
                      }
                      setPetInfo({
                        info: {
                          mood: e
                        }
                      });
                      openSpeak({
                        data: {
                          type: "text"
                        },
                        communication: ["toHeartTolk"],
                        nextActiveStr: "speak"
                      });
                    }
                  }
                  control.changeState({
                    type: "menu"
                  });
                }
              } else if (t.type == "rightClick") {
                if (rightMenu.show) {
                  rightMenu.doClose();
                } else {
                  rightMenu.cleate({
                    nowPosition: [n.nowPosition[0] + t.data.clientX, n.nowPosition[1] + t.data.clientY],
                    msg: "msg fo rightMenu is rightClick",
                    positionType: "followMain"
                  });
                }
              } else if (t.type == "roller" && (console.log(t, n.petState), n.petState == "normal" || n.petState == "sick") && getPetInfoOne("health", "info") && getChance(0.2)) {
                let e = getRandom(5, 20);
                if (e < 1000) {
                  e = +getPetInfoOne("mood", "info") + e;
                  if (e > 1000) {
                    e = 1000;
                  }
                  setPetInfo({
                    info: {
                      mood: e
                    }
                  });
                  openSpeak({
                    data: {
                      type: "text"
                    },
                    communication: ["toHeartTolk"],
                    nextActiveStr: "speak"
                  });
                }
              }
            }
          },
          "html_bus-main_backPetLoadFinish": (e, t) => {
            let o = t.data;
            try {
              o = JSON.parse(o);
            } catch (e) {}
            if (t.event != "finish" || o != "exit" && o?.finish != "exit") {
              if (!getSys("doNotDisturb") || !!o?.mustSpeak) {
                if (t.type == "speak" && o) {
                  n.openSpeak({
                    data: o,
                    otherOpt: t?.otherOpt || null
                  });
                }
              }
            } else {
              app.quit();
            }
          },
          main_h_setPetState_m: (e, t) => {
            try {
              t.data = JSON.parse(t.data);
            } catch (e) {}
            n.petState = t?.data?.name || "loadIng";
            if (t.data?.tolkName) {
              const _tn = t.data.tolkName;
              const _emit = rec => {
                if (!rec) {
                  return;
                }
                if (t.data?.tolkActive) {
                  openSpeak({
                    data: {
                      type: "text",
                      data: rec.tolk || "出错了~~~",
                      submitText: rec.submitText || ""
                    },
                    active: t?.data?.tolkActive || "",
                    otherOpt: t.data?.tolkActive == "speak" && _tn == "smallTalk" ? {
                      mood: getRandom(5, 20)
                    } : ""
                  });
                } else {
                  n.openSpeak({
                    data: {
                      type: "text",
                      data: rec.tolk || "出错了~~~",
                      submitText: rec.submitText || ""
                    },
                    mustUnShow: true
                  });
                }
              };
              let _cached = null;
              if (getSys("llmEnabled") && (_tn === "smallTalk" || _tn === "toHeartTolk")) {
                _cached = llmService.dequeue(_tn);
                llmService.prefetch(_tn, getPetInfo());
              }
              if (_cached) {
                return _emit(_cached);
              }
              if (getSys("llmEnabled") && (_tn === "enter" || _tn === "levUp")) {
                return llmService.generateOnce(_tn, _buildLLMCtx(_tn), getPetInfo()).then(r => _emit(r?.tolk ? r : getCommunication(_tn || "")));
              }
              _emit(getCommunication(_tn || ""));
            }
          }
        });
        if (petControl?.changePetInfoReply) {
          petControl.changePetInfoReply(getPetInfo());
        }
        s([{
          event: "pet",
          name: n.name,
          fn: e => {
            if (!n.isStop()) {
              t.webContents.send("main_bus-html_setPet", e);
              if (petControl?.changePetInfoReply) {
                petControl.changePetInfoReply(e);
              }
              if (e?.changeInfo) {
                if (e?.changeInfo?.host || e?.changeInfo?.name) {
                  n.menu?.setTrayToolTip(e.info.host + "家的" + e.info.name);
                }
                if (e?.changeInfo?.addmood) {
                  t.webContents.send("main_m_setFloat_h", {
                    type: "seeFloat",
                    data: {
                      num: e.changeInfo.addmood,
                      time: 800
                    }
                  });
                }
              }
            }
          }
        }, {
          event: "system",
          name: n.name,
          fn: e => {
            if (e?.isCHange?.label) {
              let t = "";
              if (e.isCHange.label == "doNotDisturb") {
                t = e.isCHange.value ? getCommunication("sys", "doNotDisturbOFF") : getCommunication("sys", "doNotDisturbNO");
              }
              if (t) {
                openSpeak({
                  data: {
                    type: "text",
                    data: t?.tolk || "",
                    submitText: t?.submitText || "",
                    mustSpeak: true
                  },
                  nextActiveStr: "speak"
                });
              }
            }
          }
        }]);
        clipboardWatcherMain = clipboardWatcher({
          watchDelay: 200,
          shakeTime: 300,
          stop: n.isStop,
          onTextChange: e => {
            const _fb = () => openSpeak({
              data: {
                type: "text",
                data: e,
                submitText: "当前复制的文字",
                form: "clip"
              }
            });
            if (getSys("llmEnabled")) {
              const _t = e.length > LLM_MAX_CLIPBOARD_LEN ? e.slice(0, LLM_MAX_CLIPBOARD_LEN) + "..." : e;
              llmService.generateOnce("clipboardText", _t, getPetInfo()).then(r => {
                if (r?.tolk) {
                  openSpeak({
                    data: {
                      type: "text",
                      data: r.tolk,
                      submitText: r.submitText || "嗯",
                      form: "clip"
                    }
                  });
                } else {
                  _fb();
                }
              });
            } else {
              _fb();
            }
          },
          onImageChange: e => {
            if (e?.toDataURL) {
              e = e.toDataURL();
            }
            openSpeak({
              data: {
                type: "img",
                data: e,
                submitText: "当前复制的图片",
                form: "clip"
              }
            });
          }
        });
      },
      onload(e) {
        console.log("onload ", this.name);
        n.menu = new MenuCreate();
        let t = [{
          on: "click",
          Fn: e => {
            if (!n.isStop()) {
              if (stateInfo.show) {
                stateInfo.doClose();
              } else {
                stateInfo.cleate({
                  nowPosition: [e.bounds.x, e.bounds.y],
                  msg: "msg fo stateInfo"
                });
              }
            }
          }
        }, {
          on: "right-click",
          Fn: e => {
            if (!n.isStop()) {
              if (rightMenu.show) {
                rightMenu.doClose();
              } else {
                rightMenu.cleate({
                  nowPosition: [e.bounds.x, e.bounds.y],
                  msg: "msg fo rightMenu is trays"
                });
              }
            }
          }
        }];
        n.menu.addTrays(t);
        if (n.menu?.activeTraysIcon && i) {
          n.menu?.activeTraysIcon(i);
        }
        i &&= null;
        let o = null;
        global.addGoods = (e, t) => {
          let o = global.petControl.Goods.getOurGoods(e);
          let n = o[getRandom(o.length - 1)];
          console.log(n);
          if (t) {
            t(n);
          }
          global.petControl.Goods.toAddGoods({
            good: n
          });
        };
        let c = {};
        global.runCheatShortcut = e => {
          let t = Date.now();
          if (c[e] && t - c[e] < 250) {
            return false;
          }
          c[e] = t;
          let o = (e, t) => {
            let o = +getPetInfoOne(e, "info");
            if (o != o) {
              return false;
            } else {
              o += t;
              if (o < 0) {
                o = 0;
              }
              setPetInfo({
                info: {
                  [e]: o
                }
              });
              return true;
            }
          };
          if (e === "Ctrl+Shift+3") {
            return o("yb", 100);
          } else if (e === "Ctrl+Shift+4") {
            return o("yb", -100);
          } else if (e === "Ctrl+Shift+2") {
            return o("growth", 5000);
          } else if (e === "Ctrl+Shift+1") {
            return o("growth", -5000);
          } else if (e === "Ctrl+Shift+numdiv") {
            if (global.addGoods) {
              global.addGoods("commodity");
            }
            return true;
          } else if (e === "Ctrl+Shift+nummult") {
            if (global.addGoods) {
              global.addGoods("food");
            }
            return true;
          } else if (e === "Ctrl+Shift+numsub") {
            if (global.addGoods) {
              global.addGoods("medicine");
            }
            return true;
          } else if (e === "Ctrl+Shift+numadd") {
            if (petControl?.Goods?.cleanOurStoreGoods) {
              petControl.Goods.cleanOurStoreGoods();
            }
            return true;
          } else {
            return false;
          }
        };
        shotycutsMain = new Shotycuts({
          vm: e,
          mainShortcutKeys: e => ({
            manyFn: [{
              code: ["Ctrl+Shift+numdiv"],
              fn: () => {
                console.log("食物");
                global.runCheatShortcut("Ctrl+Shift+numdiv");
              }
            }, {
              code: ["Ctrl+Shift+nummult"],
              fn: () => {
                console.log("清洁");
                global.runCheatShortcut("Ctrl+Shift+nummult");
              }
            }, {
              code: ["Ctrl+Shift+numsub"],
              fn: () => {
                console.log("药品");
                global.runCheatShortcut("Ctrl+Shift+numsub");
              }
            }, {
              code: ["Ctrl+Shift+numadd"],
              fn: () => {
                global.runCheatShortcut("Ctrl+Shift+numadd");
              }
            }, {
              code: ["Ctrl+Shift+2"],
              fn: () => {
                global.runCheatShortcut("Ctrl+Shift+2");
              }
            }, {
              code: ["Ctrl+Shift+1"],
              fn: () => {
                global.runCheatShortcut("Ctrl+Shift+1");
              }
            }, {
              code: ["Ctrl+Shift+3"],
              fn: () => {
                global.runCheatShortcut("Ctrl+Shift+3");
              }
            }, {
              code: ["Ctrl+Shift+4"],
              fn: () => {
                global.runCheatShortcut("Ctrl+Shift+4");
              }
            }, {
              code: ["Ctrl+Up", "Ctrl+Down", "Ctrl+Left", "Ctrl+Right"],
              fn: () => {
                if (o) {
                  return;
                }
                o = setTimeout(() => {
                  o = null;
                }, 5000);
                const _fb = () => openSpeak({
                  data: {
                    type: "text"
                  },
                  communication: ["god"],
                  nextActiveStr: "speak"
                });
                if (getSys("llmEnabled")) {
                  llmService.generateOnce("godMode", null, getPetInfo()).then(r => {
                    if (r?.tolk) {
                      openSpeak({
                        data: {
                          type: "text",
                          data: r.tolk,
                          submitText: r.submitText || "哦"
                        },
                        nextActiveStr: "speak"
                      });
                    } else {
                      _fb();
                    }
                  });
                } else {
                  _fb();
                }
              }
            }],
            unSet: e
          })
        }).init();
        let a = ["floatStyle"];
        for (let e in a) {
          if (getSys(a[e])) {
            toolWindow[a[e]].cleate();
          }
        }
        shotycutsMain.upShotycut("controlTool", ["ALT", "ESC"], () => {
          if (toolWindow.floatStyle.show) {
            toolWindow.floatStyle.doClose();
            setSys({
              name: "floatStyle",
              value: false
            });
          }
        });
        shotycutsMain.upShotycut("controlTool", ["ALT", "SHIFT", "CTRL", "R"], () => {
          if (!n.isStop() && !n.reLoad) {
            if (n.menu?.destroyTray) {
              n.menu.destroyTray();
            }
            for (let e in windowsMain.wins) {
              if (e != "main" && windowsMain.wins[e]?.win?.close) {
                try {
                  windowsMain.wins[e].win.close();
                } catch (e) {}
              }
            }
            setTimeout(() => {
              e.webContents.reload();
            }, 100);
            n.reLoad = setTimeout(() => {
              n.reLoad = false;
            }, 2000);
          }
        });
        global.shotycutsMain = shotycutsMain;
        global.changeShotycuts = e => {
          let {
            type: t,
            name: o,
            key: n
          } = e;
          if (o && n) {
            if (t == "upData") {
              return shotycutsMain.upDataShotycut(o, n);
            } else {
              return undefined;
            }
          }
        };
      },
      onshow(e) {
        console.log("onshow ", this.name);
        n.window = e;
        n.show = true;
      },
      onhide() {
        console.log("onhide ", this.name);
        n.show = false;
      },
      onclose() {
        console.log("onclose ", this.name);
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
    this.window = null;
    this.show = false;
  }
  openSpeak(e) {
    let {
      data: t,
      mustUnShow: o,
      otherOpt: n
    } = e;
    if (tip.show) {
      if (o) {
        return;
      }
      tip.setMsg({
        data: t,
        otherOpt: n
      });
    } else {
      tip.cleate({
        position: this.nowPosition,
        maxSize: this.maxSize,
        data: t,
        otherOpt: n
      });
    }
  }
  isStop(e) {
    if (e == "clip") {
      return !getSys("clip");
    } else {
      return this.wellClose;
    }
  }
  appear() {
    if (!this.show) {
      this.window.show();
    }
    if (!this.window.isAlwaysOnTop()) {
      this.window.setAlwaysOnTop(true);
    }
    this.show = true;
  }
}
let main = new mainClass();
module.exports = main;
