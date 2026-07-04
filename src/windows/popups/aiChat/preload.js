const _require = eval("require");
const { contextBridge, ipcRenderer, clipboard } = _require("electron");
let hljs = null;
try {
  hljs = _require("highlight.js");
} catch (e) {}

contextBridge.exposeInMainWorld("electronAPI", {
  aiChat_h_send: (data) => ipcRenderer.send("aiChat_h_send_m", data),
  aiChat_h_abort: () => ipcRenderer.send("aiChat_h_abort_m"),
  aiChat_h_bus: (data) => ipcRenderer.send("aiChat_h_bus_m", data),
  aiChat_h_get_config: () => ipcRenderer.send("aiChat_h_get_config_m"),
  aiChat_h_get_history: (mode) => ipcRenderer.send("aiChat_h_get_history_m", mode),
  aiChat_h_save_history: (data) => ipcRenderer.send("aiChat_h_save_history_m", data),
  aiChat_h_clear_history: (mode) => ipcRenderer.send("aiChat_h_clear_history_m", mode),
  aiChat_m_onHistory: (callback) => ipcRenderer.on("aiChat_m_history_h", callback),
  aiChat_m_onStream: (callback) => ipcRenderer.on("aiChat_m_stream_h", callback),
  aiChat_m_onBus: (callback) => ipcRenderer.on("aiChat_m_bus_h", callback),
  aiChat_m_onConfig: (callback) => ipcRenderer.on("aiChat_m_config_h", callback),
  aiChat_h_select_dir: () => ipcRenderer.send("aiChat_h_select_dir_m"),
  aiChat_m_onSelectedDir: (callback) => ipcRenderer.on("aiChat_m_selected_dir_h", callback),
  copyText: (text) => {
    try {
      if (clipboard && clipboard.writeText) {
        clipboard.writeText(text || "");
        return true;
      }
    } catch (e) {}
    return false;
  },
  highlightCode: (code, lang) => {
    if (!code) return "";
    try {
      if (hljs) {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
      }
    } catch (e) {}
    return code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
