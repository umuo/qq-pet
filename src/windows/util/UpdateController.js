const { autoUpdater } = require('electron-updater');

const checkUpdate = (fn) => {
  if (!fn) return;
  
  const onUpdateAvailable = (info) => {
    cleanup();
    fn({ type: "not", msg: `发现新版本 ${info.version}，正在后台下载...` });
  };
  
  const onUpdateNotAvailable = (info) => {
    cleanup();
    fn({ type: "not", msg: "当前已经是最新版~" });
  };
  
  const onError = (err) => {
    cleanup();
    fn({ type: "not", msg: "检查更新出错，请检查网络或稍后再试。" });
  };
  
  const cleanup = () => {
    autoUpdater.removeListener('update-available', onUpdateAvailable);
    autoUpdater.removeListener('update-not-available', onUpdateNotAvailable);
    autoUpdater.removeListener('error', onError);
  };

  autoUpdater.once('update-available', onUpdateAvailable);
  autoUpdater.once('update-not-available', onUpdateNotAvailable);
  autoUpdater.once('error', onError);

  autoUpdater.checkForUpdates().catch(err => {
    console.error('手动检查更新失败:', err);
  });
};

module.exports = checkUpdate;
