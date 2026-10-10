const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  playroomAction: payload => ipcRenderer.send('playroom_h_action', payload),
  onPlayroomState: fn => ipcRenderer.on('playroom_m_state', (_, payload) => fn(payload)),
  onPlayroomTab: fn => ipcRenderer.on('playroom_m_tab', (_, tab) => fn(tab))
});
