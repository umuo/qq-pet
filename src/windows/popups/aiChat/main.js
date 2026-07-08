const _require = eval("require");
const piAgentService = _require("../../../service/piAgent.js");

class MainClass {
  constructor() {
    this.window = null;
    this.show = false;
    this.name = "aiChat";
  }

  cleate() {
    this.width = 800;
    this.height = 600;
    let self = this;

    if (this.window && !this.window.isDestroyed()) {
      this.window.show();
      this.window.focus();
      this.show = true;
      return;
    }

    windowsMain.open({
      name: this.name,
      loadFile: "popups/" + this.name,
      jsFiles: ["./util/move.js", "./lib/marked/marked.min.js"],
      cssFiles: ["./lib/highlight/atom-one-dark.min.css"],
      closeType: "hide",
      default: {
        width: this.width,
        height: this.height,
        notChangeSize: true,
        resizable: true,
        minWidth: 600,
        minHeight: 400,
        transparent: false,
        backgroundColor: "#12161f",
        hasShadow: true
      },
      created(e) {
        let { vm: t, preloads: n, getinfo } = e;
        t.setIgnoreMouseEvents(false);
        t.setOpacity(1);

        // 同步全屏状态给渲染进程（含用户用系统手势进入/退出全屏的情况）
        const notifyFullscreen = (flag) => {
          if (t && !t.isDestroyed()) {
            t.webContents.send("aiChat_m_fullscreen_h", { isFullscreen: flag });
          }
        };
        t.on("enter-full-screen", () => notifyFullscreen(true));
        t.on("leave-full-screen", () => notifyFullscreen(false));

        const sendConfig = () => {
          if (t && !t.isDestroyed()) {
            const cfg = piAgentService.getLlmConfig();
            t.webContents.send("aiChat_m_config_h", cfg);
          }
        };

        n({
          aiChat_h_send_m: (evt, data) => {
            try {
              const req = typeof data === "string" ? JSON.parse(data) : data;
              const mode = req.mode || "chat";
              let messages = req.messages;
              if (!messages || !Array.isArray(messages) || messages.length === 0) {
                const hist = Array.isArray(req.history) ? req.history : [];
                messages = [...hist, { role: "user", content: req.query || "" }];
              }
              const params = req.params || {};
              const agentDir = req.agentDir || "";
              piAgentService.chat(mode, messages, params, agentDir, (event) => {
                if (t && !t.isDestroyed()) {
                  t.webContents.send("aiChat_m_stream_h", event);
                }
              });
            } catch (err) {
              console.error("aiChat send error:", err);
            }
          },
          aiChat_h_abort_m: () => {
            piAgentService.abort();
          },
          aiChat_h_get_config_m: () => {
            sendConfig();
          },
          aiChat_h_get_sessions_m: (evt) => {
            try {
              const list = piAgentService.getSessions();
              if (t && !t.isDestroyed()) {
                t.webContents.send("aiChat_m_sessions_h", list);
              }
            } catch (err) {
              console.error("get sessions error:", err);
            }
          },
          aiChat_h_save_sessions_m: (evt, list) => {
            try {
              const req = typeof list === "string" ? JSON.parse(list) : list;
              piAgentService.saveSessions(Array.isArray(req) ? req : []);
            } catch (err) {
              console.error("save sessions error:", err);
            }
          },
          aiChat_h_delete_session_m: (evt, id) => {
            try {
              piAgentService.deleteSession(id);
            } catch (err) {
              console.error("delete session error:", err);
            }
          },
          aiChat_h_select_dir_m: async (evt) => {
            try {
              const { dialog } = _require("electron");
              const result = await dialog.showOpenDialog(t, {
                properties: ['openDirectory']
              });
              if (!result.canceled && result.filePaths.length > 0) {
                t.webContents.send("aiChat_m_selected_dir_h", result.filePaths[0]);
              }
            } catch (err) {
              console.error("select dir error:", err);
            }
          },
          aiChat_h_bus_m: (evt, arg) => {
            const data = typeof arg === "string" ? JSON.parse(arg) : arg;
            if (data?.event === "mounted") {
              if (t && !t.isDestroyed()) {
                t.webContents.send("aiChat_m_bus_h", { type: "load" });
                sendConfig();
                t.webContents.send("aiChat_m_sessions_h", piAgentService.getSessions());
              }
            } else if (data?.event === "close") {
              self.doClose();
            } else if (data?.event === "minimize") {
              if (t && !t.isDestroyed() && t.minimize) t.minimize();
            } else if (data?.event === "fullscreen") {
              if (t && !t.isDestroyed() && t.setFullScreen) {
                t.setFullScreen(!t.isFullScreen());
              }
            }
          }
        });

        getinfo([
          {
            event: "system",
            name: self.name,
            fn: (sys) => {
              const changedKey = sys?.isCHange?.label;
              if (
                changedKey === "llmUrl" ||
                changedKey === "llmApiKey" ||
                changedKey === "llmModel" ||
                changedKey === "llmEnabled"
              ) {
                sendConfig();
              }
            }
          }
        ]);
      },
      onload(win) {
        console.log("onload", self.name);
        self.show = true;
        if (win && win.setOpacity) win.setOpacity(1);
      },
      onshow(win) {
        console.log("onshow", self.name);
        self.window = win;
        self.show = true;
        if (win && win.setOpacity) win.setOpacity(1);
        if (win && !win.isDestroyed()) {
          win.webContents.send("aiChat_m_config_h", piAgentService.getLlmConfig());
        }
      },
      onhide() {
        console.log("onhide", self.name);
        self.show = false;
      },
      onclose() {
        console.log("onclose", self.name);
        self.window = null;
        self.show = false;
      }
    })
      .then((win) => {
        this.window = win;
        this.show = true;
      })
      .catch((err) => {
        console.error("aiChat create window error:", err);
      });
  }

  doClose() {
    if (this.window && !this.window.isDestroyed()) {
      if (this.window.hide) {
        this.window.hide();
      } else {
        this.window.close();
      }
    }
    this.show = false;
  }
}

let main = new MainClass();
module.exports = main;
