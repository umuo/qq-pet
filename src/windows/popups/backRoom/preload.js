const _require = eval("require");
const {
  contextBridge,
  ipcRenderer
} = _require("electron");
let main_html = {};
let html_main = {};
contextBridge.exposeInMainWorld("electronAPI", {
  backRoom_h_say: e => ipcRenderer.send("backRoom_h_say_m", e),
  backRoom_m_bus: e => ipcRenderer.on("backRoom_m_bus_h", e),
  backRoom_h_bus: e => ipcRenderer.send("backRoom_h_bus_m", e),
  ...main_html,
  ...html_main
});
