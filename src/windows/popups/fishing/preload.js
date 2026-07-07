const _require = eval("require");
const {
  contextBridge,
  ipcRenderer
} = _require("electron");
let main_html = {};
let html_main = {};
contextBridge.exposeInMainWorld("electronAPI", {
  fishing_h_say: e => ipcRenderer.send("fishing_h_say_m", e),
  fishing_m_bus: e => ipcRenderer.on("fishing_m_bus_h", e),
  fishing_h_bus: e => ipcRenderer.send("fishing_h_bus_m", e),
  ...main_html,
  ...html_main
});
