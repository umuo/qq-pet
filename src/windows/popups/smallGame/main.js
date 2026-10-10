const { companion } = require('../../../service/gameplay/companion');
const { GameSession } = require('../../../service/gameplay/gameSession');
const { powerMonitor } = require('electron');
const fs = require('fs');
const path = require('path');
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
              backgroundColor: "#ffffff",
              resizable: true
            },
            created(e) {
              let {
                vm: s,
                preloads: t,
                getinfo: n,
                wsMethods: l
              } = e;
              const session = new GameSession({ reward: (minutes, day) => {
                const result = companion().rewardGame(minutes, day);
                if (result.minutes && !getSys('doNotDisturb')) openSpeak({ data: { type: 'text', data: `陪我玩了${result.minutes}分钟，好开心！获得${result.yb}元宝~` }, active: 'speak' });
              } });
              const active = () => !s.isDestroyed() && s.isVisible() && !s.isMinimized() && s.isFocused() && powerMonitor.getSystemIdleTime() < 60 && companion().usable(getPetInfo());
              const timer = setInterval(() => session.tick(active()), 1000);
              const stop = () => { session.close(active()); clearInterval(timer); };
              s.on('closed', stop);
              s.webContents.on('render-process-gone', () => { session.setReady(false); });
              s.on('blur', () => session.tick(false));
              let loadingRoute = null;
              t({
                smallGame_h_say_m: (e, o) => {
                  console.log(o, " --- smallGame_h_say_m say");
                },
                smallGame_h_bus_m: (e, t) => {
                  if (e.sender !== s.webContents) return;
                  if (t.event == "mounted") {
                    s.webContents.send("smallGame_m_bus_h", {
                      data: "load",
                      type: "load"
                    });
                    s.setTitle("小游戏：请选择");
                  } else if (t.event == "close") {
                    o.doClose();
                  } else if (t.event == "showSwf") {
                    session.setReady(false);
                    const root = path.resolve(__dirname, '../../../assets/game');
                    const file = typeof t.router === 'string' ? path.resolve(root, t.router) : '';
                    loadingRoute = file.startsWith(root + path.sep) && file.endsWith('.swf') && fs.existsSync(file) ? t.router : null;
                    s.setTitle("小游戏：" + t.title);
                  } else if (t.event === 'gameReady' && loadingRoute && t.router === loadingRoute) {
                    session.setReady(true);
                    loadingRoute = null;
                  } else if (t.event === 'gameFailed') {
                    session.setReady(false);
                    loadingRoute = null;
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
