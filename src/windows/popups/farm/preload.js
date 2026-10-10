const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  farmEvent: payload => ipcRenderer.send('farm_h_event', payload),
  onFarmBoot: fn => ipcRenderer.on('farm_m_boot', (_, payload) => fn(payload)),
  onFarmWallet: fn => ipcRenderer.on('farm_m_wallet', (_, payload) => fn(payload))
});
