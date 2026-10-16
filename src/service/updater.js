const { dialog, shell } = require('electron');
const { autoUpdater } = require('electron-updater');

function getReleaseUrl(info) {
  if (info?.version) {
    return `https://github.com/umuo/qq-pet/releases/tag/v${info.version}`;
  }
  return 'https://github.com/umuo/qq-pet/releases/latest';
}

function initUpdater() {
  // macOS 无证书时禁用自动下载大安装包，避免无用下载并在检测到更新后引导去 Releases 页面
  // Windows/Linux 环境继续保留自动下载与静默/重启安装
  autoUpdater.autoDownload = process.platform !== 'darwin';
  
  autoUpdater.on('error', (error) => {
    console.error('更新过程中发生错误：', error);
  });

  autoUpdater.on('before-quit-for-update', () => {
    console.log('正在退出应用并安装更新...');
    global.isQuittingForUpdate = true;
    if (typeof global.setOutProjectMain === 'function') {
      global.setOutProjectMain(true);
    }
  });

  autoUpdater.on('checking-for-update', () => {
    console.log('正在检查更新...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('发现新版本：', info);

    // macOS 无证书签名时无法使用 Squirrel.Mac 热更，直接弹窗引导下载 DMG
    if (process.platform === 'darwin' && !global.isManualUpdateCheck) {
      dialog.showMessageBox({
        type: 'info',
        title: '发现新版本',
        message: `QQ 宠物发现新版本 ${info.version}！`,
        detail: 'macOS 系统受安全策略限制，未签名版本无法自动静默重启，请前往 GitHub 下载最新 DMG 安装包替换。',
        buttons: ['前往下载', '稍后提醒我']
      }).then((result) => {
        if (result.response === 0) {
          shell.openExternal(getReleaseUrl(info));
        }
      }).catch(err => {
        console.error('显示更新弹窗失败:', err);
      });
    }
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

    if (process.platform === 'darwin') {
      dialog.showMessageBox({
        type: 'info',
        title: '发现新版本',
        message: `QQ 宠物新版本 ${info.version} 已就绪！`,
        detail: 'macOS 系统受安全策略限制，未签名版本无法自动静默重启，请前往 GitHub 下载最新 DMG 安装包替换。',
        buttons: ['前往下载', '稍后提醒我']
      }).then((result) => {
        if (result.response === 0) {
          shell.openExternal(getReleaseUrl(info));
        }
      }).catch(err => {
        console.error('显示更新弹窗失败:', err);
      });
      return;
    }

    // Windows / Linux: 弹窗提示用户是否立即安装并重启
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
        if (typeof global.setOutProjectMain === 'function') {
          global.setOutProjectMain(true);
        }
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
