// Keep pet UI at the same desktop level as the reference project's overlay.
// Raising the level does not activate the app or take keyboard focus.
function raiseDesktopWindow(win) {
  if (!win || win.isDestroyed()) return;
  if (process.platform === 'darwin' || process.platform === 'win32') {
    win.setAlwaysOnTop(true, 'screen-saver');
  } else {
    win.setAlwaysOnTop(true);
  }
}

function configureDesktopWindow(win, option) {
  if (!option.default.alwaysOnTop) return;
  raiseDesktopWindow(win);
  if (['main', 'control', 'tip', 'rightMenu'].includes(option.name) && process.platform !== 'win32') {
    // Match the reference: all desktop Spaces, but not full-screen app Spaces.
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });
  }
  win.on('show', () => raiseDesktopWindow(win));
}

module.exports = { raiseDesktopWindow, configureDesktopWindow };
