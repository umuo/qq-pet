const _require = eval("require");
const piAgentService = _require("../../../service/piAgent.js");
const { screen } = _require("electron");

class MainClass {
  constructor() {
    this.window = null;
    this.show = false;
    this.name = "aiChat";
    this._fsBounds = null;
  }

  isWindowUsable(win = this.window) {
    return !!win && !win.isDestroyed();
  }

  ensureWindowOnScreen(win) {
    if (!this.isWindowUsable(win)) return;

    try {
      const bounds = win.getBounds();
      const displays = screen.getAllDisplays();
      const visible = displays.some(({ workArea }) => {
        const overlapWidth = Math.max(
          0,
          Math.min(bounds.x + bounds.width, workArea.x + workArea.width) -
            Math.max(bounds.x, workArea.x)
        );
        const overlapHeight = Math.max(
          0,
          Math.min(bounds.y + bounds.height, workArea.y + workArea.height) -
            Math.max(bounds.y, workArea.y)
        );
        return overlapWidth >= Math.min(80, bounds.width) && overlapHeight >= Math.min(48, bounds.height);
      });

      if (visible) return;

      const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
      const area = display.workArea;
      const width = Math.min(Math.max(bounds.width, 600), area.width);
      const height = Math.min(Math.max(bounds.height, 400), area.height);
      win.setBounds({
        x: area.x + Math.max(0, Math.round((area.width - width) / 2)),
        y: area.y + Math.max(0, Math.round((area.height - height) / 2)),
        width,
        height
      });
    } catch (err) {
      console.error("aiChat restore bounds error:", err);
    }
  }

  activateWindow(win = this.window) {
    if (!this.isWindowUsable(win)) return false;

    try {
      // Windows 下 show() 不一定会退出最小化状态，必须先 restore()。
      if (win.isMinimized()) win.restore();
      this.ensureWindowOnScreen(win);
      win.setSkipTaskbar(false);
      win.show();
      win.focus();
      if (typeof win.moveTop === "function") win.moveTop();
      this.show = true;
      return true;
    } catch (err) {
      console.error("aiChat activate window error:", err);
      return false;
    }
  }

  cleate() {
    this.width = 800;
    this.height = 600;
    let self = this;

    if (this.activateWindow()) {
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
        show: false,
        skipTaskbar: false,
        title: "Q宠·智能助手",
        transparent: false,
        backgroundColor: "#111311",
        hasShadow: true,
        alwaysOnTop: false
      },
      created(e) {
        let { vm: t, preloads: n, getinfo } = e;
        t.setIgnoreMouseEvents(false);
        t.setOpacity(1);
        t.setSkipTaskbar(false);
        t.setTitle("Q宠·智能助手");

        // 独立窗口的可见状态由原生窗口事件维护，避免最小化后菜单误判为“仍在显示”。
        t.on("minimize", () => {
          self.show = false;
        });
        t.on("restore", () => {
          self.show = true;
        });
        t.on("show", () => {
          self.show = true;
        });
        t.on("hide", () => {
          self.show = false;
        });
        t.on("page-title-updated", (event) => {
          event.preventDefault();
          if (!t.isDestroyed()) t.setTitle("Q宠·智能助手");
        });

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
          aiChat_h_get_skills_m: async (evt, agentDir) => {
            try {
              const skills = await piAgentService.getAvailableSkills(agentDir || "");
              if (t && !t.isDestroyed()) {
                t.webContents.send("aiChat_m_skills_h", skills);
              }
            } catch (err) {
              console.error("get skills error:", err);
              if (t && !t.isDestroyed()) t.webContents.send("aiChat_m_skills_h", []);
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
            } else if (data?.event === "theme") {
              const themeBackgrounds = {
                obsidian: "#10120f",
                aurora: "#0b1020",
                porcelain: "#f3f2ed",
                sakura: "#f7efef",
                ink: "#e8e5dc"
              };
              const color = themeBackgrounds[data.theme] || themeBackgrounds.obsidian;
              if (t && !t.isDestroyed() && t.setBackgroundColor) t.setBackgroundColor(color);
            } else if (data?.event === "fullscreen") {
              try {
                if (!t || t.isDestroyed()) return;
                if (self._fsBounds) {
                  // 退出全屏：恢复到进入前的位置与尺寸
                  t.setBounds(self._fsBounds);
                  self._fsBounds = null;
                  t.webContents.send("aiChat_m_fullscreen_h", { isFullscreen: false });
                } else {
                  // 进入全屏：最大化到当前所在屏幕的工作区（避免原生全屏 space 对无边框/置顶窗口的兼容问题）
                  const prev = t.getBounds();
                  const display = screen.getDisplayMatching(prev);
                  const area = display.workArea;
                  self._fsBounds = prev;
                  t.setBounds({
                    x: area.x,
                    y: area.y,
                    width: area.width,
                    height: area.height
                  });
                  t.webContents.send("aiChat_m_fullscreen_h", { isFullscreen: true });
                }
              } catch (err) {
                console.error("aiChat fullscreen error:", err);
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
        if (win && win.setOpacity) win.setOpacity(1);
        self.activateWindow(win);
      },
      onshow(win) {
        console.log("onshow", self.name);
        self.window = win;
        if (win && win.setOpacity) win.setOpacity(1);
        self.activateWindow(win);
        if (self.isWindowUsable(win)) {
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
        this.show = win.isVisible() && !win.isMinimized();
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
