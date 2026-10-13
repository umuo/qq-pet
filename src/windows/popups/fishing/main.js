(() => {
  var e = {
    580: e => {
      let s = new class {
        constructor(e) {
          this.window = null;
          this.show = false;
          this.name = "fishing";
        }
        cleate(e) {
          if (!e.host) {
            return;
          }
          this.width = 380;
          this.height = 300;
          let s = this;
          let n = `http://${e.host}:${e.port}/${e.fileName}/windows/popups/fishing/indexOnLine.html`;
          console.log("url", n);
          windowsMain.open({
            name: this.name,
            loadFile: "popups/" + this.name,
            localPageUrl: `http://${e.host}:${e.port}/${e.fileName}/windows/app.html`,
            default: {
              width: this.width,
              height: this.height
            },
            webPreferences: {
              nodeIntegrationInSubFrames: true
            },
            created(e) {
              let {
                vm: i,
                preloads: t,
                getinfo: o,
                wsMethods: h
              } = e;
              let a = JSON.parse(JSON.stringify(getPetInfo()));
              const {PondSave}=require('../../../service/gameplay/pondSave');
              const pond=new PondSave();let closing=false,settled=false;s.lastSaveError=null;
              const applySave=data=>{
                try {
                  const sequence=pond.commit(data);a=JSON.parse(JSON.stringify(getPetInfo()));
                  if(!i.isDestroyed())i.webContents.send('fishing_m_bus_h',{type:'saveAck',sequence});
                } catch(error) {
                  const sequence=pond.discard(data);
                  if(!i.isDestroyed())i.webContents.send('fishing_m_bus_h',{type:'saveRejected',sequence,data:JSON.parse(JSON.stringify(getPetInfo()))});
                  if(typeof openSpeak==='function')openSpeak({data:{type:'text',data:'鱼塘操作未保存，请重试。'+error.message},active:'speak'});
                }
              };
              i.on('close',event=>{
                if(settled)return;event.preventDefault();if(closing)return;closing=true;i.setEnabled(false);
                let timeout;
                Promise.race([
                  i.webContents.executeJavaScript("(()=>{const f=document.querySelector('iframe')?.contentWindow;return f?.settleFishSave?.()||{packets:[]};})()"),
                  new Promise((_resolve,reject)=>{timeout=setTimeout(()=>reject(Error('鱼塘保存结算超时，请重新打开鱼塘后再导出。')),4000);})
                ]).then(applySave).catch(error=>{s.lastSaveError=error;console.error('鱼塘关闭结算失败',error);})
                  .finally(()=>{clearTimeout(timeout);settled=true;if(!i.isDestroyed())i.close();});
              });
              t({
                fishing_h_say_m: (e, s) => {
                  console.log(s, " --- fishing_h_say_m say");
                },
                fishing_h_bus_m: (e, t) => {
                  if(e.sender!==i.webContents||i.isDestroyed())return;
                  if (t.event == "mounted") {
                    i.webContents.send("fishing_m_bus_h", {
                      data: n,
                      type: "load"
                    });
                  } else if (t.event == "getInfo") {
                    i.webContents.send("fishing_m_bus_h", {
                      data: a,
                      type: "setPetInfo"
                    });
                  } else if (t.event == "saveDatas") {
                    applySave(t.data);
                  } else if (t.event == "close") {
                    s.doClose();
                  }
                }
              });
              o([{
                event: "pet",
                name: s.name,
                fn: e => {
                  if (a.maxInfo.level != e.maxInfo.level || a.info.yb != e.info.yb || a.info.sex != e.info.sex || a.info.host != e.info.host || a.info.name != e.info.name || a.otherOptions.pinkDiamond != e.otherOptions.pinkDiamond || a.otherOptions.pinkDiamondLevel != e.otherOptions.pinkDiamondLevel || a.fishing.allvipcnt != e.fishing.allvipcnt || a.fishing.canusecnt != e.fishing.canusecnt) {
                    a = JSON.parse(JSON.stringify(e));
                    i.webContents.send("fishing_m_bus_h", {
                      data: a,
                      type: "setPetInfo"
                    });
                  }
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
        doClose() {
          this.window.close();
          this.show = false;
        }
      }();
      e.exports = s;
    }
  };
  var s = {};
  var n = function n(i) {
    var t = s[i];
    if (t !== undefined) {
      return t.exports;
    }
    var o = s[i] = {
      exports: {}
    };
    e[i](o, o.exports, n);
    return o.exports;
  }(580);
  module.exports = n;
})();
