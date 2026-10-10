const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('electronAPI',{
  travelAction:payload=>ipcRenderer.send('travel_h_action',payload),
  onTravelState:fn=>ipcRenderer.on('travel_m_state',(_,payload)=>fn(payload))
});
