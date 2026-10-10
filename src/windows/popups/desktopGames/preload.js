const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  desktopEvent: data => ipcRenderer.send('desktopGames_h_event', data),
  desktopRequest: data => ipcRenderer.sendSync('desktopGames_h_request', data),
  onDesktopBoot: fn => ipcRenderer.on('desktopGames_m_boot', (_, data) => fn(data))
});
