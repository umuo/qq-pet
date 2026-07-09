const { dialog } = require('electron');
const { autoUpdater } = require('electron-updater');

function initUpdater() {
  // 设置自动下载新版本
  autoUpdater.autoDownload = true;
  
  autoUpdater.on('error', (error) => {
    console.error('更新过程中发生错误：', error);
  });

  autoUpdater.on('before-quit-for-update', () => {
    console.log('正在退出应用并安装更新...');
    global.isQuittingForUpdate = true;
  });

  autoUpdater.on('checking-for-update', () => {
    console.log('正在检查更新...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('发现新版本，正在后台下载...', info);
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('当前已经是最新版本。', info);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = '下载速度: ' + progressObj.bytesPerSecond;
    log_message = log_message + ' - 已下载 ' + progressObj.percent.toFixed(2) + '%';
    log_message = log_message + ' (' + progressObj.transferred + '/' + progressObj.total + ')';
    console.log(log_message);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('新版本下载完成：', info);

    // 如果是手动检查触发的下载，由 UpdateController 处理 UI，此处跳过弹窗
    if (global.isManualUpdateCheck) {
      return;
    }

    // 弹窗提示用户是否立即安装并重启
    dialog.showMessageBox({
      type: 'info',
      title: '发现新版本',
      message: 'QQ 宠物新版本已下载完毕，是否立即重启并安装？',
      detail: `最新版本：${info.version}`,
      buttons: ['立即重启', '稍后提醒我']
    }).then((result) => {
      if (result.response === 0) { // 用户点击了"立即重启"
        // 安装更新并重启应用
        global.isQuittingForUpdate = true;
        autoUpdater.quitAndInstall();
      }
    }).catch(err => {
      console.error('显示更新弹窗失败:', err);
    });
  });

  // 开始检查更新
  autoUpdater.checkForUpdatesAndNotify().catch(err => {
    console.error('检查更新失败:', err);
  });
}

module.exports = {
  initUpdater
};
