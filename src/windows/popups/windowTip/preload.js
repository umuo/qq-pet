const _require = eval("require");
const {
  contextBridge,
  ipcRenderer
} = _require("electron");
let main_html = {};
let html_main = {};
contextBridge.exposeInMainWorld("electronAPI", {
  windowTip_h_say: e => ipcRenderer.send("windowTip_h_say_m", e),
  windowTip_m_bus: e => ipcRenderer.on("windowTip_m_bus_h", e),
  windowTip_h_bus: e => ipcRenderer.send("windowTip_h_bus_m", e),
  ...main_html,
  ...html_main
});
