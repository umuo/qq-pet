const _require = eval("require");
const {
  contextBridge,
  ipcRenderer
} = _require("electron");
let main_html = {};
let html_main = {};
contextBridge.exposeInMainWorld("electronAPI", {
  model_h_say: e => ipcRenderer.send("model_h_say_m", e),
  model_m_bus: e => ipcRenderer.on("model_m_bus_h", e),
  model_h_bus: e => ipcRenderer.send("model_h_bus_m", e),
  ...main_html,
  ...html_main
});
