const _require = eval("require");
const {
  contextBridge,
  ipcRenderer
} = _require("electron");
let main_html = {
  urlWindow_h_bus_m_eventMouse: e => ipcRenderer.send("urlWindow_h_bus_m_eventMouse", e)
};
let html_main = {};
contextBridge.exposeInMainWorld("electronAPI", {
  urlWindow_h_say: e => ipcRenderer.send("urlWindow_h_say_m", e),
  urlWindow_m_bus: e => ipcRenderer.on("urlWindow_m_bus_h", e),
  urlWindow_h_bus: e => ipcRenderer.send("urlWindow_h_bus_m", e),
  ...main_html,
  ...html_main
});
