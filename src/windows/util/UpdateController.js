const { autoUpdater } = require('electron-updater');

// 防重入锁：防止重复点击导致多次检查/下载
let isChecking = false;
let isDownloading = false;

// 存储当前回调，用于进度更新
let currentCallback = null;

const checkUpdate = (fn) => {
  if (!fn) return;

  // 如果正在检查或下载中，直接返回当前状态
  if (isChecking) {
    fn({ type: "not", msg: "正在检查更新中，请稍候..." });
    return;
  }
  if (isDownloading) {
    fn({ type: "not", msg: "新版本正在下载中，请耐心等待..." });
    return;
  }

  isChecking = true;
  currentCallback = fn;
  // 标记为手动检查，updater.js 的自动弹窗会跳过
  global.isManualUpdateCheck = true;

  const onUpdateAvailable = (info) => {
    // 只移除检查阶段的监听器，保留下载阶段的监听器
    cleanupCheck();
    isChecking = false;

    // autoDownload = true 时，electron-updater 会自动开始下载
    // 此时切换到下载状态
    isDownloading = true;
    fn({ type: "up", info: info, fn: null });

    // 通知 UI 正在下载
    fn({ type: "not", msg: `发现新版本 ${info.version}，正在后台下载...` });
  };

  const onUpdateNotAvailable = (info) => {
    cleanup();
    isChecking = false;
    global.isManualUpdateCheck = false;
    fn({ type: "not", msg: "当前已经是最新版~" });
  };

  const onError = (err) => {
    cleanup();
    isChecking = false;
    isDownloading = false;
    global.isManualUpdateCheck = false;
    currentCallback = null;
    fn({ type: "not", msg: "检查更新出错，请检查网络或稍后再试。" });
  };

  // 下载进度事件（节流：最多每 800ms 回调一次，避免弹窗刷屏）
  let lastProgressTime = 0;
  let lastProgressObj = null;
  const onDownloadProgress = (progressObj) => {
    lastProgressObj = progressObj;
    const now = Date.now();
    if (now - lastProgressTime < 800) return;
    lastProgressTime = now;

    const sc = {
      percent: progressObj.percent.toFixed(1),
      speed: formatBytes(progressObj.bytesPerSecond) + '/s',
      transferred: formatBytes(progressObj.transferred),
      total: formatBytes(progressObj.total)
    };
    fn({ type: "sc", sc: sc, fn: cancelDownload });
  };

  // 下载完成事件
  const onUpdateDownloaded = (info) => {
    // 发送最后一次进度（确保显示 100%）
    if (lastProgressObj) {
      const sc = {
        percent: '100.0',
        speed: formatBytes(lastProgressObj.bytesPerSecond) + '/s',
        transferred: formatBytes(lastProgressObj.total),
        total: formatBytes(lastProgressObj.total)
      };
      fn({ type: "sc", sc: sc, fn: cancelDownload });
    }
    cleanup();
    isChecking = false;
    isDownloading = false;
    global.isManualUpdateCheck = false;
    lastProgressObj = null;
    lastProgressTime = 0;
    fn({ type: "down", info: info, fn: installUpdate });
  };

  // 取消下载
  const cancelDownload = () => {
    try {
      autoUpdater.cancelDownload();
    } catch (e) {
      console.error('取消下载失败:', e);
    }
    isDownloading = false;
    isChecking = false;
    global.isManualUpdateCheck = false;
    cleanup();
  };

  // 安装更新
  const installUpdate = () => {
    global.isQuittingForUpdate = true;
    autoUpdater.quitAndInstall();
  };

  // 只清理检查阶段的监听器（保留错误、下载进度和下载完成监听）
  const cleanupCheck = () => {
    autoUpdater.removeListener('update-available', onUpdateAvailable);
    autoUpdater.removeListener('update-not-available', onUpdateNotAvailable);
  };

  // 清理所有监听器
  const cleanup = () => {
    cleanupCheck();
    autoUpdater.removeListener('download-progress', onDownloadProgress);
    autoUpdater.removeListener('update-downloaded', onUpdateDownloaded);
  };

  autoUpdater.once('update-available', onUpdateAvailable);
  autoUpdater.once('update-not-available', onUpdateNotAvailable);
  autoUpdater.on('error', onError);
  autoUpdater.on('download-progress', onDownloadProgress);
  autoUpdater.once('update-downloaded', onUpdateDownloaded);

  autoUpdater.checkForUpdates().catch(err => {
    console.error('手动检查更新失败:', err);
    cleanup();
    isChecking = false;
    global.isManualUpdateCheck = false;
    fn({ type: "not", msg: "检查更新出错，请检查网络或稍后再试。" });
  });
};

// 格式化字节大小
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

module.exports = checkUpdate;
